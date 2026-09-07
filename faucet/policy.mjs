import {publicTransactionMass} from '../src/public-contracts.mjs';

export const NETWORK='testnet-10',CLAIM_AMOUNT=1000000000n,MAX_FEE=1000000n;
export function publicAddress(sdk,value){
 if(typeof value!=='string'||value.length>100||!value.startsWith('kaspatest:'))throw new Error('Use a Testnet-10 wallet address.');
 const address=new sdk.Address(value),script=sdk.payToAddressScript(address);
 if(address.toString()!==value||script.version!==0||!/^20[0-9a-f]{64}ac$/.test(script.script))throw new Error('Use a standard Testnet-10 wallet address.');
 return address.toString();
}
export function validateClaim(body,sdk){
 if(!body||Array.isArray(body)||typeof body!=='object'||Object.keys(body).sort().join(',')!=='address,requestId')throw new Error('A wallet address and request ID are required.');
 if(typeof body.requestId!=='string'||!/^[a-zA-Z0-9-]{16,80}$/.test(body.requestId))throw new Error('Invalid request ID.');
 return {address:publicAddress(sdk,body.address),requestId:body.requestId};
}
export function validateFaucetPayment(sdk,tx,{destination,changeAddress,feeRate}){
 publicAddress(sdk,destination);publicAddress(sdk,changeAddress);
 if(destination===changeAddress)throw new Error('The faucet cannot fund itself.');
 const own=sdk.payToAddressScript(new sdk.Address(changeAddress)),recipient=sdk.payToAddressScript(new sdk.Address(destination));
 if(tx.version!==1||tx.lockTime!==0n||tx.subnetworkId!=='00'.repeat(20)||tx.gas!==0n||tx.payload!=='')throw new Error('Invalid faucet transaction envelope.');
 if(tx.inputs.length<1||tx.inputs.length>8||tx.outputs.length!==2)throw new Error('A faucet payment requires owned inputs, one recipient and change.');
 const ids=new Set();let total=0n;
 for(const input of tx.inputs){
  const entry=input.utxo?.entry,id=`${input.previousOutpoint.transactionId}:${input.previousOutpoint.index}`;
  if(!entry||entry.covenantId||entry.scriptPublicKey.version!==0||entry.scriptPublicKey.script!==own.script||ids.has(id)||input.sequence!==0n||input.computeBudget!==16||!/^41[0-9a-f]{128}01$/i.test(input.signatureScript))throw new Error('Invalid faucet funding input.');
  if(input.utxo.outpoint.transactionId!==input.previousOutpoint.transactionId||input.utxo.outpoint.index!==input.previousOutpoint.index||BigInt(input.utxo.amount)<=0n)throw new Error('Faucet input identity mismatch.');
  ids.add(id);total+=BigInt(input.utxo.amount);
 }
 const [payment,change]=tx.outputs;
 if(payment.value!==CLAIM_AMOUNT||payment.scriptPublicKey.version!==0||payment.scriptPublicKey.script!==recipient.script||payment.covenant||change.value<=0n||change.scriptPublicKey.version!==0||change.scriptPublicKey.script!==own.script||change.covenant)throw new Error('Faucet outputs changed.');
 const fee=total-payment.value-change.value,mass=publicTransactionMass(tx,{feeRate});
 if(fee<0n||fee>MAX_FEE||fee<BigInt(mass.minimumFee)||!mass.withinBlockLimits||tx.storageMass!==BigInt(mass.storageMass))throw new Error('Faucet fee or mass limit exceeded.');
 return fee;
}
export function buildFaucetPayment(sdk,{entries,destination,changeAddress,feeRate}){
 publicAddress(sdk,destination);publicAddress(sdk,changeAddress);
 if(destination===changeAddress)throw new Error('The faucet cannot fund itself.');
 const own=sdk.payToAddressScript(new sdk.Address(changeAddress)),recipient=sdk.payToAddressScript(new sdk.Address(destination));
 if(!Array.isArray(entries)||entries.length===0)throw new Error('The demo wallet needs more test coins.');
 if(entries.some(e=>!e.entry||e.entry.covenantId||e.entry.scriptPublicKey.version!==0||e.entry.scriptPublicKey.script!==own.script||BigInt(e.amount)<=0n))throw new Error('Unexpected funding input.');
 const ids=entries.map(e=>`${e.outpoint.transactionId}:${e.outpoint.index}`);if(new Set(ids).size!==ids.length)throw new Error('Duplicate funding input.');
 const sorted=[...entries].sort((a,b)=>BigInt(a.amount)>BigInt(b.amount)?-1:1),selected=[];let total=0n;
 for(const entry of sorted.slice(0,8)){
  selected.push(entry);total+=BigInt(entry.amount);let fee=1000n;
  for(let attempt=0;attempt<4&&total>CLAIM_AMOUNT+fee;attempt++){
   const change=total-CLAIM_AMOUNT-fee;
   const transaction=new sdk.Transaction({version:1,inputs:selected.map(e=>({previousOutpoint:e.outpoint,utxo:e,signatureScript:'41'+'00'.repeat(64)+'01',sequence:0n,sigOpCount:0,computeBudget:16})),outputs:[{value:CLAIM_AMOUNT,scriptPublicKey:recipient},{value:change,scriptPublicKey:own}],lockTime:0n,subnetworkId:'00'.repeat(20),gas:0n,payload:''});
   const mass=publicTransactionMass(transaction,{feeRate});
   if(fee<BigInt(mass.minimumFee)){fee=BigInt(mass.minimumFee);continue;}
   if(!mass.withinBlockLimits||fee>MAX_FEE)break;
   transaction.storageMass=BigInt(mass.storageMass);
   validateFaucetPayment(sdk,transaction,{destination,changeAddress,feeRate});
   return {transaction,fee,change,total};
  }
 }
 throw new Error('The demo wallet needs more test coins or a lower network fee.');
}
