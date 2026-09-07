import {createRequire} from 'node:module';
import {randomBytes,randomUUID} from 'node:crypto';
import {mkdir,readFile,writeFile,rename,open} from 'node:fs/promises';
import {unlinkSync,readFileSync} from 'node:fs';
import {NETWORK,LIMITS,requireNetwork,paymentAmount,requireBudget,receiptState} from './testnet-policy.mjs';
import {createRefundRequest,createSplitRequest,reviewContractSpend} from './contract-lab.mjs';
import {createApplication,reviewApplication} from './application-lab.mjs';
import {scanAcceptance} from './acceptance.mjs';
import {bounded} from './rpc-deadline.mjs';
import {buildNativePayment} from './native-payment.mjs';
import {publicTransaction,submissionJournal,restoreSubmission} from './submission-journal.mjs';

const require=createRequire(import.meta.url);
const ENDPOINT='wss://muon-10.kaspa.blue/kaspa/testnet-10/wrpc/borsh';
const serializable=value=>JSON.stringify(value,(_,item)=>typeof item==='bigint'?item.toString():item,2);

export class TestnetLab {
  constructor({directory='.local/testnet-10',loadSdk=()=>require('../.cache/upstream/kaspa-wasm32-sdk/nodejs/kaspa/kaspa.js')}={}){this.directory=directory;this.loadSdk=loadSdk;this.queue=Promise.resolve();this.previews=new Map();}
  exclusive(action){const operation=this.queue.then(()=>{if(this.persistenceError)throw new Error('The wallet could not save its state. Stop and restart the local server before continuing; spending remains blocked.');return action();});this.queue=operation.catch(()=>{});return operation;}
  createApplication(kind,options){return this.exclusive(()=>createApplication(this,kind,options));}
  reviewApplication(id,entry,parameters){return this.exclusive(()=>reviewApplication(this,id,entry,parameters));}
  createContract(){return this.exclusive(()=>createRefundRequest(this));}
  createSplit(share){return this.exclusive(()=>createSplitRequest(this,share));}
  reviewContract(id,entry){return this.exclusive(()=>reviewContractSpend(this,id,entry));}
  async load(){
    if(this.state)return;
    this.sdk=this.loadSdk();
    await mkdir(this.directory,{recursive:true,mode:0o700});
    const owner=randomUUID(),lockPath=`${this.directory}/owner.lock`;
    try{const lock=await open(lockPath,'wx',0o600);await lock.writeFile(JSON.stringify({pid:process.pid,owner}));await lock.close();}
    catch(error){if(error.code==='EEXIST')throw new Error('Another process owns this test wallet. Stop it before starting another server. A stale lock must be checked locally, not bypassed.');throw error;}
    this.release=()=>{try{if(JSON.parse(readFileSync(lockPath,'utf8')).owner===owner)unlinkSync(lockPath);}catch{}};
    process.once('exit',this.release);
    try{
      let state,created=false;
      try{state=JSON.parse(await readFile(`${this.directory}/wallet.json`,'utf8'));}
      catch(error){if(error.code!=='ENOENT')throw error;created=true;state={network:NETWORK,key:randomBytes(32).toString('hex'),spent:'0',requests:[],transactions:[]};}
      if(state.network!==NETWORK)throw new Error('Wrong saved network.');
      if(!Array.isArray(state.requests)||!Array.isArray(state.transactions)||!/^\d+$/.test(state.spent))throw new Error('Invalid saved wallet records.');
      const key=new this.sdk.PrivateKey(state.key),address=key.toAddress(NETWORK).toString();
      if(!address.startsWith('kaspatest:'))throw new Error('Invalid local test wallet.');
      this.state=state;this.key=key;this.address=address;
      if(created)await this.save();
    }catch(error){
      this.state=undefined;this.key=undefined;this.address=undefined;
      process.removeListener('exit',this.release);this.release();this.release=undefined;
      throw error;
    }
  }
  async save(){try{const path=`${this.directory}/wallet-${randomUUID()}.next`;const file=await open(path,'wx',0o600);try{await file.writeFile(serializable(this.state));await file.sync();}finally{await file.close();}await rename(path,`${this.directory}/wallet.json`);const directory=await open(this.directory,'r');try{await directory.sync();}finally{await directory.close();}}catch(error){this.persistenceError=true;throw error;}}
  async connected(action){
    const rpc=new this.sdk.RpcClient({url:ENDPOINT,networkId:NETWORK});
    try{await bounded(rpc.connect({blockAsyncConnect:true,timeoutDuration:5000,strategy:'fallback'}),7000);const info=await bounded(rpc.getServerInfo());requireNetwork(info);return await action(rpc,info);}
    finally{await bounded(rpc.disconnect(),2000).catch(()=>{});}
  }
  async status(){return this.exclusive(async()=>{
    await this.load();const base={network:NETWORK,address:this.address,limits:LIMITS,spent:this.state.spent,requests:this.state.requests.map(({key,...record})=>record),transactions:this.state.transactions.map(publicTransaction),endpoint:ENDPOINT};
    try{return await this.connected(async(rpc,info)=>{const {entries}=await bounded(rpc.getUtxosByAddresses([this.address]));return {...base,connected:true,balance:entries.reduce((total,e)=>total+BigInt(e.amount),0n),daa:info.virtualDaaScore,version:info.serverVersion};});}
    catch{return {...base,connected:false,error:'Testnet-10 is unavailable. Sending remains disabled.'};}
  });}
  async request(value){return this.exclusive(async()=>{
    await this.load();const amount=paymentAmount(value);if(this.state.requests.length>=30)throw new Error('This local experiment permits at most 30 requests. Existing receipts are retained.');
    const key=randomBytes(32).toString('hex'),address=new this.sdk.PrivateKey(key).toAddress(NETWORK).toString();
    const record={id:randomUUID(),address,amount:String(amount),created:new Date().toISOString(),expires:new Date(Date.now()+3600000).toISOString(),key};
    this.state.requests.push(record);await this.save();const {key:privateKey,...publicRecord}=record;return publicRecord;
  });}
  async review(requestId){return this.exclusive(async()=>{
    await this.load();const request=this.state.requests.find(r=>r.id===requestId);if(!request||Date.parse(request.expires)<Date.now())throw new Error('Choose an unexpired request created in this experiment.');
    if(request.kind==='contract-return')throw new Error('Use the contract’s claim or refund review for this request.');
    if(this.state.transactions.some(t=>t.state!=='accepted'))throw new Error('A previous submission still needs reconciliation. No further spend is permitted.');
    if(this.state.transactions.some(t=>t.requestId===requestId))throw new Error('This request already has a submitted payment.');
    return this.connected(async(rpc)=>{
      const {entries}=await bounded(rpc.getUtxosByAddresses([this.address]));if(!entries.length)throw new Error('This test wallet has no spendable tKAS. Get test coins from the faucet first.');
      const pending=buildNativePayment(this.sdk,{entries,destination:request.address,changeAddress:this.address,amount:BigInt(request.amount),spent:BigInt(this.state.spent)});
      requireBudget({amount:BigInt(request.amount),fee:pending.feeAmount,spent:BigInt(this.state.spent)});
      if(BigInt(pending.paymentAmount)!==BigInt(request.amount)||pending.aggregateInputAmount-pending.aggregateOutputAmount!==pending.feeAmount)throw new Error('Transaction amounts failed validation.');
      this.previews.clear();const token=randomUUID(),expires=Date.now()+60000;this.previews.set(token,{pending,request,expires});
      return {token,network:NETWORK,source:this.address,destination:request.address,amount:request.amount,fee:String(pending.feeAmount),change:String(pending.changeAmount),input:String(pending.aggregateInputAmount),expires,transaction:JSON.parse(pending.serializeToSafeJSON())};
    });
  });}
  async submit(token){return this.exclusive(async()=>{
    await this.load();const preview=this.previews.get(token);if(!preview||preview.recovery||preview.expires<Date.now())throw new Error('The review expired. Review a new transaction before sending.');
    this.previews.delete(token);const {pending,request}=preview;
    if(this.state.transactions.some(t=>t.state!=='accepted'||t.requestId===request.id))throw new Error('A previous payment prevents this submission.');
    return this.connected(async rpc=>{
      requireNetwork(await bounded(rpc.getServerInfo()));requireBudget({amount:BigInt(request.amount),fee:pending.feeAmount,spent:BigInt(this.state.spent)});
      const {sink}=await bounded(rpc.getSink());pending.sign([this.key]);
      const transaction={id:pending.id,requestId:request.id,network:NETWORK,amount:request.amount,fee:String(pending.feeAmount),state:'prepared',checkpoint:sink,created:new Date().toISOString(),journal:submissionJournal(pending)};
      this.state.spent=String(BigInt(this.state.spent)+BigInt(request.amount)+pending.feeAmount);this.state.transactions.push(transaction);
      // Reserve and record before the external side effect. Never automatically retry.
      await this.save();
      transaction.state='uncertain';transaction.journal.attempts.push({started:new Date().toISOString()});await this.save();
      try{const id=await bounded(pending.submit(rpc));if(id!==transaction.id)throw new Error('Transaction ID mismatch.');transaction.state='submitted';}
      catch(error){transaction.state='uncertain';transaction.submissionError=String(error.message||error).slice(0,500);}
      await this.save();return publicTransaction(transaction);
    });
  });}
  async reviewRecovery(id){return this.exclusive(async()=>{
    await this.load();const record=this.state.transactions.find(t=>t.id===id);
    if(!record||record.state==='accepted')throw new Error('Choose a recorded submission that still needs reconciliation.');
    const tx=restoreSubmission(this.sdk,record);
    const token=randomUUID(),expires=Date.now()+60000;
    this.previews.clear();this.previews.set(token,{recovery:record.id,expires});
    return {token,expires,network:NETWORK,id:record.id,amount:record.amount,fee:record.fee,transaction:JSON.parse(tx.serializeToSafeJSON()),message:'This resends the identical signed transaction. Its amount, fee, destinations, and spending reservation do not change.'};
  });}
  async submitRecovery(token){return this.exclusive(async()=>{
    await this.load();const preview=this.previews.get(token);this.previews.delete(token);
    if(!preview?.recovery||preview.expires<Date.now())throw new Error('The recovery review expired. Review it again.');
    const record=this.state.transactions.find(t=>t.id===preview.recovery);
    if(!record||record.state==='accepted')throw new Error('This transaction no longer needs recovery.');
    const tx=restoreSubmission(this.sdk,record);
    return this.connected(async rpc=>{
      record.state='uncertain';record.journal.attempts.push({started:new Date().toISOString()});await this.save();
      try{const result=await bounded(rpc.submitTransaction({transaction:tx,allowOrphan:false}));if(result.transactionId!==record.id)throw new Error('Transaction ID mismatch.');record.state='submitted';delete record.submissionError;}
      catch(error){record.submissionError=String(error.message||error).slice(0,500);}
      await this.save();return publicTransaction(record);
    });
  });}
  async receipt(requestId){return this.exclusive(async()=>{
    await this.load();const request=this.state.requests.find(r=>r.id===requestId);if(!request)throw new Error('Unknown local request.');
    return this.connected(async rpc=>{
      const transaction=this.state.transactions.find(t=>t.requestId===requestId);
      let acceptance=null;
      if(transaction){
        const scan=await scanAcceptance(rpc,transaction,{call:promise=>bounded(promise,7000),onProgress:async progress=>{Object.assign(transaction,progress);if(transaction.state==='accepted'&&!progress.acceptingBlock)transaction.state='acceptance-changed';await this.save();}});
        Object.assign(transaction,scan);acceptance=scan.acceptingBlock;
        transaction.state=acceptance?'accepted':transaction.state==='accepted'?'acceptance-changed':transaction.state;
        transaction.acceptingBlock=acceptance;transaction.checked=new Date().toISOString();await this.save();
      }
      const {entries}=await bounded(rpc.getUtxosByAddresses(request.addresses||[request.address]));
      const outputs=entries.map(entry=>({id:entry.outpoint.transactionId,index:entry.outpoint.index,amount:String(entry.amount)}));
      const relevant=transaction?outputs.filter(output=>output.id===transaction.id):outputs;
      const received=relevant.reduce((sum,output)=>sum+BigInt(output.amount),0n),expired=Date.parse(request.expires)<Date.now();
      if(transaction&&acceptance&&received>0n){transaction.verifiedAmount=String(received);await this.save();}
      const verified=transaction&&acceptance&&transaction.verifiedAmount!==undefined?BigInt(transaction.verifiedAmount):0n;
      return {network:NETWORK,requestId,address:request.address,requested:request.amount,received:String(received),verifiedAmount:String(verified),state:receiptState({requested:BigInt(request.amount),received:verified||received,accepted:Boolean(acceptance&&verified),expired}),transaction:publicTransaction(transaction),outputs,acceptingBlock:acceptance,checked:new Date().toISOString(),source:ENDPOINT,limitation:'One node’s current view, not a settlement guarantee. Verified payment history is separate from the amount still unspent. Automatic acceptance verification covers payments submitted by this workshop only.'};
    });
  });}
}
