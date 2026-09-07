import {randomBytes,randomUUID} from 'node:crypto';
import {writeFile,readFile} from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {applicationSpec,applicationNames,applicationFiles} from '../scripts/application-fixtures.mjs';
import {NETWORK,requireBudget} from './testnet-policy.mjs';
import {bounded} from './rpc-deadline.mjs';
import {rawInputSignature} from './contract-signature.mjs';
const execute=promisify(execFile);
const publicRecord=({key,...record})=>record;

// Caller owns lab.exclusive(). No method broadcasts or reads another wallet.
export async function createApplication(lab,kind,options={}){
 await lab.load();
 if(lab.state.requests.length>=30)throw new Error('The experiment’s request limit has been reached.');
 return lab.connected(async rpc=>{
  const info=await bounded(rpc.getBlockDagInfo());if(info.network!==NETWORK)throw new Error('Wrong network.');
  const keys=[lab.key,new lab.sdk.PrivateKey(randomBytes(32).toString('hex')),new lab.sdk.PrivateKey(randomBytes(32).toString('hex'))];
  const publicKeys=keys.map(k=>k.toPublicKey().toXOnlyPublicKey().toString());
  const spec=await applicationSpec(kind,{publicKeys,now:Number(info.pastMedianTime),amount:options.amount??20000000,delayMs:options.delayMs??120000});
  const id=randomUUID(),argsPath=`${lab.directory}/${id}-args.json`,artifactPath=`${lab.directory}/${id}-artifact.json`;
  await writeFile(argsPath,JSON.stringify(spec.args),{mode:0o600});
  await execute('.cache/upstream/silverc',[`contracts/${applicationFiles[kind]}.sil`,'--constructor-args',argsPath,'-o',artifactPath],{timeout:15000,maxBuffer:100000});
  const artifact=JSON.parse(await readFile(artifactPath,'utf8')),contract=artifact.contracts[applicationNames[kind]];
  const script=Buffer.from(contract.compiled.bytecode).toString('hex');
  const record={id,kind:'application',application:kind,address:lab.sdk.addressFromScriptPublicKey(lab.sdk.payToScriptHashScript(script),NETWORK).toString(),amount:String(options.amount??20000000),created:new Date().toISOString(),expires:new Date(Date.now()+3600000).toISOString(),key:keys.slice(1).map(k=>k.toString()),publicKeys,addresses:keys.map(k=>k.toAddress(NETWORK).toString()),principal:String(spec.principal),feeReserve:String(spec.feeReserve),maxFee:String(spec.maxFee),refundAfter:spec.refundAfter,resolveAfter:spec.resolveAfter,computeBudget:spec.computeBudget,proofFixture:spec.proofFixture,script,entries:contract.entries,artifact};
  // Do not set funding receipt addresses to role addresses: funding is at P2SH.
  record.roleAddresses=record.addresses;delete record.addresses;
  lab.state.requests.push(record);await lab.save();return publicRecord(record);
 });
}

function route(record,entry,parameters){
 const roles=record.roleAddresses;
 if(record.application==='escrow'){
  if(entry==='release')return {signers:[0],args:[],destinations:[roles[1]],time:0};
  if(entry==='resolve'){if(typeof parameters.paySeller!=='boolean')throw new Error('Choose buyer or seller.');return {signers:[2],args:[parameters.paySeller],destinations:[roles[parameters.paySeller?1:0]],time:0};}
  if(entry==='refund')return {signers:[0],args:[],destinations:[roles[0]],time:record.refundAfter};
 }
 if(record.application==='treasury'&&entry==='spend'){
  const pair=parameters.pair??0;if(![0,1,2].includes(pair))throw new Error('Choose two different members.');
  const recipient=parameters.recipientPublicKey??record.publicKeys[0];if(!/^[a-f0-9]{64}$/.test(recipient))throw new Error('Provide a recipient x-only public key.');
  return {signers:[[0,1],[0,2],[1,2]][pair],args:[pair,{data:recipient}],recipientPublicKey:recipient,time:0};
 }
 if(record.application==='prediction'){
  if(entry==='settle'){if(typeof parameters.yesWins!=='boolean')throw new Error('Choose an oracle outcome.');return {signers:[2],args:[parameters.yesWins],destinations:[roles[parameters.yesWins?0:1]],time:record.resolveAfter};}
  if(entry==='refund'){const by=parameters.refundBy??'yes';if(!['yes','no'].includes(by))throw new Error('Choose a participant to authorize the refund.');return {signers:[by==='yes'?0:1],args:[],destinations:[roles[0],roles[1]],time:record.refundAfter};}
 }
 if(record.application==='receipt'&&entry==='redeem')return {signers:[1],args:[],destinations:[roles[1],roles[0]],time:0};
 if(record.application==='proof'&&entry==='verify')return {signers:[0],args:[{data:record.proofFixture.proof}],destinations:[roles[0]],time:0};
 throw new Error('Unknown application spending path.');
}

export async function reviewApplication(lab,id,entry,parameters={}){
 await lab.load();
 const record=lab.state.requests.find(r=>r.id===id&&r.kind==='application');if(!record)throw new Error('Unknown application.');
 if(lab.state.requests.length>=30)throw new Error('The experiment’s request limit has been reached.');
 if(lab.state.transactions.some(t=>t.state!=='accepted'))throw new Error('Reconcile the previous transaction first.');
 const funding=lab.state.transactions.find(t=>t.requestId===id&&t.state==='accepted');if(!funding)throw new Error('Fund the application and verify its receipt first.');
 const plan=route(record,entry,parameters);
 return lab.connected(async rpc=>{
  const info=await bounded(rpc.getBlockDagInfo());if(info.network!==NETWORK)throw new Error('Wrong network.');
  if(plan.time&&BigInt(info.pastMedianTime)<=BigInt(plan.time))throw new Error('The node’s median time has not reached eligibility.');
  if(plan.recipientPublicKey){const publicKey=new lab.sdk.PublicKey('02'+plan.recipientPublicKey);plan.destinations=[publicKey.toAddress(NETWORK).toString()];}
  const {entries}=await bounded(rpc.getUtxosByAddresses([record.address]));
  const matching=entries.filter(e=>e.outpoint.transactionId===funding.id&&BigInt(e.amount)===BigInt(record.amount));if(matching.length!==1)throw new Error('The exact funded output is unavailable.');
  const u=matching[0],deposit=BigInt(u.amount),source={address:record.address,outpoint:u.outpoint,scriptPublicKey:u.entry.scriptPublicKey,amount:u.amount,isCoinbase:u.entry.isCoinbase,blockDaaScore:u.entry.blockDaaScore};
  const keyObjects=[lab.key,...record.key.map(k=>new lab.sdk.PrivateKey(k))];
  const unlock=signatures=>{
   const builder=new lab.sdk.ScriptBuilder({flags:{covenantsEnabled:true}});
   for(const signature of signatures)builder.addData(signature);
   for(const arg of plan.args){if(typeof arg==='boolean')builder.addI64(arg?1n:0n);else if(typeof arg==='number')builder.addI64(BigInt(arg));else builder.addData(arg.data);}
   builder.addData(record.entries[entry].dispatch_tag).addData(record.script);return builder.drain();
  };
  const estimate=await bounded(rpc.getFeeEstimate());const rate=Math.max(100,estimate.estimate.priorityBucket.feerate);
  if(!Number.isFinite(rate)||rate>100000)throw new Error('Invalid node fee estimate.');
  let fee=10000n,tx,outputs,converged=false;
  for(let pass=0;pass<8;pass++){
   const net=deposit-fee;if(net<=0n)throw new Error('Fee exceeds the deposit.');
   if(record.application==='receipt')outputs=[{address:plan.destinations[0],amount:BigInt(record.principal)},{address:plan.destinations[1],amount:BigInt(record.feeReserve)-fee}];
   else if(plan.destinations.length===2){const a=net/2n;outputs=[{address:plan.destinations[0],amount:a},{address:plan.destinations[1],amount:net-a}];}
   else outputs=[{address:plan.destinations[0],amount:net}];
   if(outputs.some(o=>o.amount<=0n))throw new Error('The fee reserve cannot cover this transaction.');
   tx=lab.sdk.createTransaction([source],outputs,0n,'',1);tx.version=1;tx.inputs[0].computeBudget=record.computeBudget;tx.inputs[0].sequence=0n;tx.lockTime=BigInt(plan.time);
   tx.inputs[0].signatureScript=unlock(plan.signers.map(()=> '00'.repeat(65)));
   // Conservative v1 one-input P2PK-output size bound, including budget mass.
   const signatureBytes=tx.inputs[0].signatureScript.length/2;
   const size=300+signatureBytes+outputs.length*50;
   const compute=size+outputs.length*360+record.computeBudget*100;
   const estimatedMass=Math.max(compute,size*2);
   const storage=lab.sdk.calculateStorageMass(NETWORK,[Number(deposit)],outputs.map(o=>Number(o.amount)));
   if(storage===undefined)throw new Error('Invalid application storage mass.');
   const required=BigInt(Math.ceil(estimatedMass*rate))+1000n;
   if(fee>=required){converged=true;break;}fee=required;
   if(fee>BigInt(record.maxFee))throw new Error(`The application fee needs ${fee} sompi, above its ${record.maxFee}-sompi cap. Nothing was signed.`);
  }
  if(!converged)throw new Error('Application fee did not converge.');
  const amount=deposit-fee;requireBudget({amount,fee,spent:BigInt(lab.state.spent)});
  tx.storageMass=lab.sdk.calculateStorageMass(NETWORK,[Number(deposit)],outputs.map(o=>Number(o.amount)));tx.finalize();
  const request={id:randomUUID(),kind:'contract-return',sourceContract:id,entry,address:outputs[0].address,addresses:outputs.map(o=>o.address),expectedOutputs:outputs.map(o=>({address:o.address,amount:String(o.amount)})),amount:String(amount),created:new Date().toISOString(),expires:new Date(Date.now()+3600000).toISOString()};
  lab.state.requests.push(request);await lab.save();
  const pending={feeAmount:fee,changeAmount:0n,paymentAmount:amount,aggregateInputAmount:deposit,aggregateOutputAmount:amount,type:'final',get id(){return tx.id;},sign(){tx.inputs[0].signatureScript=unlock(plan.signers.map(i=>rawInputSignature(lab.sdk.createInputSignature(tx,0,keyObjects[i]))));tx.finalize();},async submit(client){return(await client.submitTransaction({transaction:tx,allowOrphan:false})).transactionId;},serializeToSafeJSON(){return tx.serializeToSafeJSON();}};
  const token=randomUUID(),expires=Date.now()+60000;lab.previews.clear();lab.previews.set(token,{pending,request,expires});
  return {token,requestId:request.id,network:NETWORK,source:record.address,destination:outputs.map(o=>o.address).join(', '),outputs:request.expectedOutputs,amount:String(amount),fee:String(fee),change:'0',input:String(deposit),expires,entry,application:record.application,computeBudget:record.computeBudget,signers:plan.signers.map(i=>record.publicKeys[i]),transaction:JSON.parse(tx.serializeToSafeJSON())};
 });
}
