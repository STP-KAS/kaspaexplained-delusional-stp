// Local Testnet-10 adapter for the explicitly trusted TestUSD oracle experiment.
// Token units are not tKAS backing. The external lock is checked by oracleGuard.
import {createRequire} from 'node:module';
import {randomBytes} from 'node:crypto';
import {readFile,mkdir,open,rename,chmod} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {instantiatePublicToken,buildTokenGenesis,buildTokenMove} from '../src/public-token.mjs';
import {signPublicAssetPlan,validatePublicAssetPlan} from '../src/public-asset-signing.mjs';
import {publicAssetJournal,derivePublicAssetRecoveryPlan} from '../src/public-asset-recovery.mjs';
import {observePublicAcceptance} from '../src/public-acceptance.mjs';
import {bounded} from './rpc-deadline.mjs';

const NETWORK='testnet-10',TOKEN_NAME='Oracle-wrapped TestUSD',UNITS=100000000,CAP=1000000000,GENESIS_SOMPI=50000000n;
const NODE_URL='wss://muon-10.kaspa.blue/kaspa/testnet-10/wrpc/borsh';
const hash=value=>typeof value==='string'&&/^[0-9a-f]{64}$/.test(value);
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));

async function atomicJSON(path,value){
 const temporary=path+'.tmp-'+randomBytes(8).toString('hex'),handle=await open(temporary,'wx',0o600);
 try{await handle.writeFile(JSON.stringify(value,null,2)+'\n');await handle.sync();}finally{await handle.close();}
 await rename(temporary,path);await chmod(path,0o600);
}
async function loadOrCreateWallet(path,sdk){
 let value;try{value=JSON.parse(await readFile(path,'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;const keys=[];while(keys.length<3){const key=randomBytes(32).toString('hex');try{new sdk.PrivateKey(key);keys.push(key);}catch{}}value={version:1,network:NETWORK,keys};const handle=await open(path,'wx',0o600);try{await handle.writeFile(JSON.stringify(value,null,2)+'\n');await handle.sync();}finally{await handle.close();}}
 if(value.version!==1||value.network!==NETWORK||!Array.isArray(value.keys)||value.keys.length!==3||value.keys.some(k=>!hash(k))||new Set(value.keys).size!==3)throw Error('Invalid private wrapping wallet. Keep the original recovery file.');
 await chmod(path,0o600);return value.keys.map(key=>new sdk.PrivateKey(key));
}

/** No method claims or buys coins. Only init/mint/transfer/burn can submit.
 * oracleGuard(depositId) must return verified:true and exact amountUnits.
 * dependencies are solely for isolated tests; production uses the pinned SDK and Testnet node.
 */
export async function createWrapKaspa({directory='.local/wrap-poc',oracleGuard,dependencies={}}={}){
 const sdk=dependencies.sdk||createRequire(import.meta.url)('../.cache/upstream/kaspa-wasm32-sdk/nodejs/kaspa');
 const templates=dependencies.templates||JSON.parse(await readFile(new URL('../.cache/public-templates/templates.json',import.meta.url),'utf8')).templates;
 const dir=resolve(directory);await mkdir(dir,{recursive:true,mode:0o700});
 const keys=await loadOrCreateWallet(join(dir,'kaspa-wallet.json'),sdk),publicKeys=keys.map(key=>key.toPublicKey().toXOnlyPublicKey().toString()),addresses=keys.map(key=>key.toAddress(NETWORK).toString());
 const path=join(dir,'kaspa-journal.json');let state;try{state=JSON.parse(await readFile(path,'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;state={version:1,network:NETWORK,records:[]};await atomicJSON(path,state);}
 if(state.version!==1||state.network!==NETWORK||!Array.isArray(state.records)||state.records.length>64)throw Error('Invalid wrapping transaction journal.');
 const ids=new Set(),deposits=new Set();
 for(const r of state.records){if(!['init','mint','transfer','burn'].includes(r.action)||!hash(r.checkpoint)||r.journal?.kind!=='token'||ids.has(r.journal.id))throw Error('Invalid wrapping transaction record.');ids.add(r.journal.id);const p=recover(r);if(p.genesis?.issuer&&p.genesis.issuer!==publicKeys[2]||p.tokens.some(t=>t.issuer!==publicKeys[2]||t.cap!==CAP))throw Error('Wrapping journal issuer does not match this wallet.');if(r.action==='mint'){if(!validDepositId(r.depositId)||deposits.has(r.depositId))throw Error('Duplicate or invalid external deposit in wrapping journal.');deposits.add(r.depositId);}if(r.acceptingBlock&&!hash(r.acceptingBlock))throw Error('Invalid saved acceptance block.');}
 const rpc=dependencies.rpc||new sdk.RpcClient({url:NODE_URL,networkId:NETWORK});
 const observe=dependencies.observe||observePublicAcceptance,attempts=dependencies.acceptanceAttempts??6,delay=dependencies.acceptanceDelayMs??1000;
 let connected=false,connectionPromise=null,lastError=null,nodeCheckedAt=null,balances=['0','0','0'],queue=Promise.resolve(),busy=false;
 function recover(record){return derivePublicAssetRecoveryPlan(sdk,{templates,journal:record.journal,keysPublic:publicKeys});}
 function save(){return atomicJSON(path,state);}
 const call=promise=>bounded(promise,10000);
 function validDepositId(id){return typeof id==='string'&&/^[a-zA-Z0-9:_-]{1,200}$/.test(id);}
 async function node(){
  try{if(!connected){if(!connectionPromise)connectionPromise=call(rpc.connect({blockAsyncConnect:true,timeoutDuration:6000})).then(()=>{connected=true;}).finally(()=>{connectionPromise=null;});await connectionPromise;}
   const info=await call(rpc.getServerInfo());if(info.networkId!==NETWORK||!info.isSynced||!info.hasUtxoIndex)throw Error('A synced Testnet-10 node with a UTXO index is required. No transaction was sent.');
   nodeCheckedAt=new Date().toISOString();return info;
  }catch(error){connected=false;throw error;}
 }

 async function feeRate(){await node();const result=await call(rpc.getFeeEstimate()),rate=Math.ceil(Number(result.estimate.priorityBucket.feerate));if(!Number.isFinite(rate)||rate<0)throw Error('Invalid Testnet fee estimate.');return Math.max(100,rate);}
 async function refreshBalances(){const {entries}=await call(rpc.getUtxosByAddresses(addresses));balances=addresses.map(address=>entries.filter(e=>!e.entry.covenantId&&e.entry.scriptPublicKey.script===sdk.payToAddressScript(new sdk.Address(address)).script).reduce((sum,e)=>sum+e.amount,0n).toString());}
 function confirmedCells(){const map=new Map();for(const r of state.records){if(!r.acceptingBlock)continue;const p=recover(r);for(const input of p.transaction.inputs)map.delete(`${input.previousOutpoint.transactionId}:${input.previousOutpoint.index}`);const states=p.operation===null?[p.genesis.state]:p.states;for(const [index,holding]of states.entries())map.set(`${p.transaction.id}:${index}`,{state:holding,amountSompi:String(p.transaction.outputs[index].value),transactionId:p.transaction.id,index,covenantId:p.covenantId});}return [...map.values()];}
 const activeDeposit=()=>state.records.findLast(r=>r.action==='mint')?.depositId||null;
 function publicRecord(r){if(!r)return null;const p=recover(r);return {action:r.action,depositId:r.depositId||null,transactionId:r.journal.id,acceptingBlock:r.acceptingBlock||null,covenantId:p.covenantId,feeSompi:String(p.fee),attempted:Boolean(r.attempted),submitted:Boolean(r.submitted),accepted:Boolean(r.acceptingBlock),explorerUrl:'https://tn10.kaspa.stream/transactions/'+r.journal.id};}
 function snapshot(){
  const cells=confirmedCells(),holding=cells.filter(c=>!c.state.isMinter),pending=state.records.some(r=>!r.acceptingBlock),depositId=activeDeposit(),forDeposit=action=>state.records.findLast(r=>r.action===action&&r.depositId===depositId);
  const genesis=state.records.find(r=>r.action==='init'),lastBurn=forDeposit('burn'),stage=pending?'pending':!genesis?'uninitialized':holding.length?holding.every(c=>c.state.owner===publicKeys[0])?'minted':holding.every(c=>c.state.owner===publicKeys[1])?'transferred':'unsupported':lastBurn?.acceptingBlock?'burned':'initialized';
  return {network:NETWORK,connected,busy,error:state.records.findLast(r=>!r.acceptingBlock&&r.submissionError)?.submissionError||lastError,nodeCheckedAt,addresses:[...addresses],owners:[...publicKeys],accounts:addresses.map((address,index)=>({ownerIndex:index,role:['You','Pip','Trusted test oracle'][index],address,publicKey:publicKeys[index],balanceSompi:balances[index]})),balancesSompi:[...balances],stage,pending,asset:{name:TOKEN_NAME,symbol:'wTestUSD',decimals:6,amountUnits:String(UNITS),capUnits:String(CAP),standard:'Custom experimental covenant token; not a token-standard implementation'},trust:'The local test oracle verifies the external lock and authorizes minting. Kaspa does not independently verify the external chain.',covenantId:genesis?recover(genesis).covenantId:null,activeDepositId:depositId,issuerRemainingUnits:String(cells.find(c=>c.state.isMinter)?.state.quantity??CAP),holdings:holding.map(c=>({ownerIndex:publicKeys.indexOf(c.state.owner),quantityUnits:String(c.state.quantity),cellValueSompi:c.amountSompi,transactionId:c.transactionId,outputIndex:c.index})),init:publicRecord(genesis),mint:publicRecord(forDeposit('mint')),transfer:publicRecord(forDeposit('transfer')),burn:publicRecord(lastBurn),records:state.records.map(publicRecord)};
 }
 async function reconcile(){await node();for(const r of state.records){const result=await observe(rpc,{...r,id:r.journal.id},{call});Object.assign(r,result);r.checkedAt=new Date().toISOString();}await save();await refreshBalances();}
 function noPending(){if(state.records.some(r=>!r.acceptingBlock))throw Error('A signed transaction is pending or uncertain. Check its acceptance; no new transaction will be created or retried automatically.');if(state.records.length>=64)throw Error('This proof-of-concept journal is full.');}
 async function liveCells(){const known=confirmedCells();if(!known.length)return [];const instantiated=known.map(c=>({...c,token:instantiatePublicToken(sdk,templates.token,{issuer:publicKeys[2],cap:CAP,state:c.state})})),{entries}=await call(rpc.getUtxosByAddresses([...new Set(instantiated.map(c=>c.token.address))]));return instantiated.map(cell=>{const script=sdk.payToScriptHashScript(cell.token.script),utxo=entries.find(e=>e.outpoint.transactionId===cell.transactionId&&e.outpoint.index===cell.index&&e.entry.scriptPublicKey.version===script.version&&e.entry.scriptPublicKey.script===script.script&&String(e.amount)===cell.amountSompi&&e.entry.covenantId?.toString()===cell.covenantId);if(!utxo)throw Error('A recorded token output is no longer available. Check the saved transaction history.');return {...cell,utxo};});}
 const token=(owner,quantity,isMinter=false)=>instantiatePublicToken(sdk,templates.token,{issuer:publicKeys[2],cap:CAP,state:{owner,quantity,isMinter}});
 async function submit(action,plan,depositId=null){
  validatePublicAssetPlan(plan);const {sink}=await call(rpc.getSink());if(!hash(sink))throw Error('Invalid Testnet checkpoint.');
  await signPublicAssetPlan(plan,(transaction,index,{owner})=>{const key=keys[publicKeys.indexOf(owner)];if(!key)throw Error('The required test signing key is unavailable.');return sdk.createInputSignature(transaction,index,key);});
  const journal=publicAssetJournal(plan),restored=derivePublicAssetRecoveryPlan(sdk,{templates,journal,keysPublic:publicKeys});if(restored.transaction.serializeToSafeJSON()!==plan.transaction.serializeToSafeJSON())throw Error('Signed wrapping journal failed exact recovery.');
  const record={action,depositId,journal,checkpoint:sink,attempted:false,submitted:false,acceptingBlock:null,scanCursor:sink,createdAt:new Date().toISOString()};state.records.push(record);await save();record.attempted=true;await save();
  try{const answer=await call(rpc.submitTransaction({transaction:restored.transaction,allowOrphan:false}));if(answer.transactionId!==journal.id)throw Error('Unexpected submission response. Saved bytes are retained; do not send another transaction.');record.submitted=true;await save();}catch(error){record.submissionError='Submission uncertain; check saved transaction.';await save();lastError=error.message;}
  for(let n=0;n<attempts;n++){Object.assign(record,await observe(rpc,{...record,id:journal.id},{call}));record.checkedAt=new Date().toISOString();await save();if(record.acceptingBlock)break;if(n+1<attempts)await pause(delay);}
  await refreshBalances();
 }
 async function queued(operation){const prior=queue;let release;queue=new Promise(resolve=>{release=resolve;});await prior;try{return await operation();}finally{release();}}
 async function exclusive(operation){return queued(async()=>{busy=true;try{await operation();lastError=null;}catch(error){lastError=error.message;throw error;}finally{busy=false;}return snapshot();});}
 async function status(){if(busy)return snapshot();return queued(async()=>{try{await node();await refreshBalances();lastError=null;}catch(error){connected=false;lastError=error.message;}return snapshot();});}

 async function init(){return exclusive(async()=>{await reconcile();if(state.records.some(r=>r.action==='init'))return;noPending();const rate=await feeRate(),{entries}=await call(rpc.getUtxosByAddresses([addresses[0]])),available=entries.filter(e=>!e.entry.covenantId&&e.entry.scriptPublicKey.script===sdk.payToAddressScript(new sdk.Address(addresses[0])).script).sort((a,b)=>a.amount>b.amount?-1:a.amount<b.amount?1:0).slice(0,8);if(available.reduce((n,u)=>n+u.amount,0n)<=GENESIS_SOMPI)throw Error('Fund the You Testnet-10 address with more than 0.5 tKAS before initializing. This app never requests coins automatically.');await submit('init',buildTokenGenesis(sdk,{fundingUtxos:available,token:token(publicKeys[2],CAP,true),tokenName:TOKEN_NAME,cellAmount:GENESIS_SOMPI,changeAddress:addresses[0],feeRate:rate}));});}
 async function mint(depositId){return exclusive(async()=>{if(!validDepositId(depositId))throw Error('A stable external deposit ID is required.');await reconcile();if(state.records.some(r=>r.action==='mint'&&r.depositId===depositId))return;noPending();if(typeof oracleGuard!=='function')throw Error('A trusted external-lock verifier is required before minting.');const evidence=await oracleGuard(depositId);if(evidence?.verified!==true||String(evidence.amountUnits)!==String(UNITS)||evidence.depositId!==undefined&&evidence.depositId!==depositId||evidence.kaspaOwner!==undefined&&evidence.kaspaOwner!==publicKeys[0]&&evidence.kaspaOwner!==addresses[0])throw Error('The oracle did not verify the exact external deposit for this recipient.');const cells=await liveCells(),minter=cells.find(c=>c.state.isMinter);if(cells.some(c=>!c.state.isMinter))throw Error('Transfer and burn the existing test holding before minting another deposit.');if(!minter||minter.state.quantity<UNITS)throw Error('Initialize the token issuer, or its fixed issuance cap is exhausted.');const value=BigInt(minter.amountSompi),first=value/2n;await submit('mint',buildTokenMove(sdk,{tokenInputs:[{token:minter.token,utxo:minter.utxo}],successors:[{token:token(publicKeys[2],minter.state.quantity-UNITS,true),amount:first},{token:token(publicKeys[0],UNITS),amount:value-first}],operation:1,feeRate:await feeRate()}),depositId);});}
 async function transfer(){return exclusive(async()=>{await reconcile();noPending();const depositId=activeDeposit();if(!depositId)throw Error('Mint a verified external deposit first.');if(state.records.some(r=>r.action==='transfer'&&r.depositId===depositId))return;const cells=await liveCells(),holders=cells.filter(c=>!c.state.isMinter),holder=holders[0];if(holders.length!==1||holder.state.owner!==publicKeys[0]||holder.state.quantity!==UNITS)throw Error('Your full 100 TestUSD holding is required.');await submit('transfer',buildTokenMove(sdk,{tokenInputs:[{token:holder.token,utxo:holder.utxo}],successors:[{token:token(publicKeys[1],UNITS),amount:BigInt(holder.amountSompi)}],operation:0,feeRate:await feeRate()}),depositId);});}
 async function burn(){return exclusive(async()=>{await reconcile();noPending();const depositId=activeDeposit();if(!depositId)throw Error('Mint and transfer a verified deposit first.');if(state.records.some(r=>r.action==='burn'&&r.depositId===depositId))return;const cells=await liveCells(),minter=cells.find(c=>c.state.isMinter),holders=cells.filter(c=>!c.state.isMinter),holder=holders[0];if(!minter||holders.length!==1||holder.state.owner!==publicKeys[1]||holder.state.quantity!==UNITS)throw Error('Pip’s full 100 TestUSD holding and the issuer must authorize this burn.');await submit('burn',buildTokenMove(sdk,{tokenInputs:[{token:minter.token,utxo:minter.utxo},{token:holder.token,utxo:holder.utxo}],successors:[{token:token(publicKeys[2],minter.state.quantity,true),amount:BigInt(minter.amountSompi)+BigInt(holder.amountSompi)}],operation:2,feeRate:await feeRate()}),depositId);});}
 async function check(){return exclusive(reconcile);}
 async function close(){await queue;if(connected)await rpc.disconnect();connected=false;}
 return {status,init,mint,transfer,burn,check,close};
}
