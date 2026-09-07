// Operator-only top-up. This file is never copied into the public static build.
// The existing demo key remains local; only a transaction is sent to Testnet-10.
import {readFile,writeFile,rename} from 'node:fs/promises';
import {TestnetLab} from '../server/testnet.mjs';
import {publicTransactionMass} from '../src/public-contracts.mjs';

const amountText=process.argv[2],submit=process.argv.includes('--submit');
if(!['50','8950'].includes(amountText))throw new Error('Choose the 50 tKAS service check or the 8950 tKAS reserve top-up. Review is the default; --submit sends it.');
const amount=BigInt(amountText)*100000000n,file=`.local/faucet/topup-${amountText}.json`;
const target=JSON.parse(await readFile('.local/faucet/wallet.json','utf8'));
if(target.network!=='testnet-10')throw new Error('Wrong faucet wallet network.');
const lab=new TestnetLab();
try{
 await lab.load();
 if(lab.address!=='kaspatest:qqup3k4ru5uhj9swa05afa3zqcwkyhtv9vz9dme68cglza73mc5yk4r7an5cj')throw new Error('Unexpected demo wallet.');
 const sdk=lab.sdk,address=new sdk.PrivateKey(target.key).toAddress('testnet-10').toString();
 if(address!==target.address||address===lab.address)throw new Error('Unexpected faucet destination.');
 const rpc=new sdk.RpcClient({url:'wss://muon-10.kaspa.blue/kaspa/testnet-10/wrpc/borsh',networkId:'testnet-10'});
 try{
  await rpc.connect({blockAsyncConnect:true,timeoutDuration:6000});
  const info=await rpc.getServerInfo();if(info.networkId!=='testnet-10'||!info.isSynced||!info.hasUtxoIndex)throw new Error('Wrong or unsynchronized node.');
  let saved;try{saved=JSON.parse(await readFile(file,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
  if(saved){const {entries}=await rpc.getUtxosByAddresses([address,lab.address]);const observed=entries.some(e=>e.outpoint.transactionId===saved.transactionId&&e.outpoint.index===1&&String(e.amount)===saved.change);console.log(JSON.stringify({network:'testnet-10',transactionId:saved.transactionId,amount:saved.amount,alreadyJournaled:true,changeObserved:observed}));}
  else{
   const {entries}=await rpc.getUtxosByAddresses([lab.address]),own=sdk.payToAddressScript(new sdk.Address(lab.address)),destination=sdk.payToAddressScript(new sdk.Address(address));
   if(entries.some(e=>e.entry.covenantId||e.entry.scriptPublicKey.version!==0||e.entry.scriptPublicKey.script!==own.script))throw new Error('Unexpected funding input.');
   const selected=[...entries].sort((a,b)=>BigInt(a.amount)>BigInt(b.amount)?-1:1).slice(0,8),total=selected.reduce((sum,e)=>sum+BigInt(e.amount),0n);
   const estimate=await rpc.getFeeEstimate(),feeRate=Math.max(100,Math.ceil(estimate.estimate.priorityBucket.feerate));let fee=1000n,tx,mass;
   for(let attempt=0;attempt<5;attempt++){
    if(total<=amount+fee||fee>1000000n)throw new Error('Insufficient reserve or fee above 0.01 tKAS.');
    tx=new sdk.Transaction({version:1,inputs:selected.map(e=>({previousOutpoint:e.outpoint,utxo:e,signatureScript:'41'+'00'.repeat(64)+'01',sequence:0n,sigOpCount:0,computeBudget:16})),outputs:[{value:amount,scriptPublicKey:destination},{value:total-amount-fee,scriptPublicKey:own}],lockTime:0n,subnetworkId:'00'.repeat(20),gas:0n,payload:''});
    mass=publicTransactionMass(tx,{feeRate});if(fee<BigInt(mass.minimumFee)){fee=BigInt(mass.minimumFee);continue;}break;
   }
   if(!mass.withinBlockLimits||fee<BigInt(mass.minimumFee)||fee>1000000n)throw new Error('Funding transaction failed its fee/mass limits.');tx.storageMass=BigInt(mass.storageMass);
   const review={network:'testnet-10',source:lab.address,destination:address,amount:String(amount),fee:String(fee),change:String(total-amount-fee),mode:submit?'submit':'review'};
   console.log(JSON.stringify(review));
   if(submit){
    for(let i=0;i<tx.inputs.length;i++)tx.inputs[i].signatureScript=sdk.createInputSignature(tx,i,lab.key);
    const checked=publicTransactionMass(tx,{feeRate});if(!checked.withinBlockLimits||checked.storageMass!==mass.storageMass||BigInt(checked.minimumFee)>fee)throw new Error('Signed funding failed mass checks.');tx.finalize();
    const record={...review,transactionId:tx.id,transaction:tx.serializeToSafeJSON(),createdAt:new Date().toISOString()};
    await writeFile(file+'.tmp',JSON.stringify(record),{mode:0o600,flag:'wx'});await rename(file+'.tmp',file);
    const result=await rpc.submitTransaction({transaction:tx,allowOrphan:false});if(result.transactionId!==tx.id)throw new Error('Unexpected transaction ID. Inspect the journal; never create another top-up automatically.');
    console.log(JSON.stringify({submitted:true,transactionId:tx.id}));
   }
  }
 }finally{await rpc.disconnect();}
}finally{lab.release?.();}
