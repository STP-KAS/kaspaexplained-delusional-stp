import {NETWORK,requireBudget} from './testnet-policy.mjs';
import {publicTransactionMass} from '../src/public-contracts.mjs';

// Native v1 only. No wallet loading, RPC lookup, or automatic broadcast.
export function buildNativePayment(sdk,{entries,destination,changeAddress,amount,spent=0n}){
 amount=BigInt(amount);requireBudget({amount,fee:0n,spent:BigInt(spent)});
 if(!destination.startsWith('kaspatest:')||!changeAddress.startsWith('kaspatest:'))throw new Error('Native payments require Testnet-10 addresses.');
 const outputScript=sdk.payToAddressScript(new sdk.Address(destination)),ownedScript=sdk.payToAddressScript(new sdk.Address(changeAddress));
 if(!/^20[0-9a-f]{64}ac$/i.test(ownedScript.script)||ownedScript.version!==0)throw new Error('Native funding requires an owned P2PK address.');
 if(!Array.isArray(entries)||!entries.length)throw new Error('No native funding inputs.');
 if(entries.some(e=>!e.entry||e.entry.covenantId||e.entry.scriptPublicKey.version!==0||e.entry.scriptPublicKey.script!==ownedScript.script||BigInt(e.amount)<=0n))throw new Error('Every funding input must be a plain output owned by this wallet.');
 const ids=entries.map(e=>`${e.outpoint.transactionId}:${e.outpoint.index}`);if(new Set(ids).size!==ids.length)throw new Error('Duplicate funding input.');
 const sorted=[...entries].sort((a,b)=>BigInt(a.amount)>BigInt(b.amount)?-1:1);let total=0n,tx,mass,fee,change;
 const selected=[];
 for(const utxo of sorted.slice(0,8)){
  selected.push(utxo);total+=BigInt(utxo.amount);fee=1000n;
  if(total<=amount+fee)continue;
  for(let attempt=0;attempt<3;attempt++){
   change=total-amount-fee;if(change<=0n)break;
   tx=new sdk.Transaction({version:1,inputs:selected.map(e=>({previousOutpoint:e.outpoint,utxo:e,signatureScript:'41'+'00'.repeat(64)+'01',sequence:0n,sigOpCount:0,computeBudget:16})),outputs:[{value:amount,scriptPublicKey:outputScript},{value:change,scriptPublicKey:ownedScript}],lockTime:0n,subnetworkId:'00'.repeat(20),gas:0n,payload:''});
   mass=publicTransactionMass(tx);
   if(fee<BigInt(mass.minimumFee)){fee=BigInt(mass.minimumFee);continue;}
   requireBudget({amount,fee,spent:BigInt(spent)});
   if(!mass.withinBlockLimits)break;
   tx.storageMass=BigInt(mass.storageMass);
   return pending(tx,mass,fee,change,total);
  }
 }
 throw new Error('No payment fits the available native inputs, positive change, fee cap and current mass limits.');
 function pending(transaction,reviewMass,exactFee,exactChange,exactTotal){
  let signed=false;const reviewed=transaction.serializeToSafeJSON();
  return {type:'final',feeAmount:exactFee,changeAmount:exactChange,paymentAmount:amount,aggregateInputAmount:exactTotal,aggregateOutputAmount:amount+exactChange,mass:reviewMass,get id(){return transaction.id;},
   sign(keys){
    if(signed)throw new Error('Payment is already signed.');if(transaction.serializeToSafeJSON()!==reviewed)throw new Error('Payment changed after review.');
    if(!Array.isArray(keys)||keys.length!==1||keys[0].toAddress(NETWORK).toString()!==changeAddress)throw new Error('Wrong native payment signer.');
    for(let index=0;index<transaction.inputs.length;index++){const signature=sdk.createInputSignature(transaction,index,keys[0]);if(!/^41[0-9a-f]{128}01$/i.test(signature))throw new Error('Native payment requires SIGHASH_ALL.');transaction.inputs[index].signatureScript=signature;}
    const checked=publicTransactionMass(transaction);if(!checked.withinBlockLimits||exactFee<BigInt(checked.minimumFee)||BigInt(checked.storageMass)!==transaction.storageMass)throw new Error('Signed payment failed mass verification.');
    requireBudget({amount,fee:exactFee,spent:BigInt(spent)});transaction.finalize();signed=true;
   },
   serializeToSafeJSON(){return transaction.serializeToSafeJSON();},
   async submit(rpc){if(!signed)throw new Error('Review and sign the native payment first.');return (await rpc.submitTransaction({transaction,allowOrphan:false})).transactionId;}
  };
 }
}
