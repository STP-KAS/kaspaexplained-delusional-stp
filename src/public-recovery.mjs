// Reconstruct only the original, supported signed transaction. No signing or RPC.
import {buildPublicFunding,buildPublicSpend,publicUnlockScript,validatePublicPlan} from './public-contracts.mjs';
const shape=tx=>{const value=JSON.parse(tx.serializeToSafeJSON());delete value.id;for(const input of value.inputs)delete input.signatureScript;return JSON.stringify(value);};
function paths(contract,keys){
 if(contract.kind==='escrow')return [['release',{}],['resolve',{paySeller:true}],['resolve',{paySeller:false}],['refund',{}]];
 if(contract.kind==='treasury')return [0,1,2].flatMap(pair=>keys.map(beneficiary=>['spend',{pair,beneficiary}]));
 if(contract.kind==='prediction')return [['settle',{yesWins:true}],['settle',{yesWins:false}],['refund',{refundBy:'yes'}],['refund',{refundBy:'no'}]];
 if(contract.kind==='proof')return [['verify',{}]];
 throw new Error('Unsupported recovered contract.');
}
export function derivePublicRecoveryPlan(sdk,{contract,journal,keysPublic}){
 if(!journal||typeof journal.transaction!=='string'||journal.transaction.length>750000||!/^([0-9a-f]{64})$/.test(journal.id)||typeof journal.funding!=='boolean')throw new Error('Invalid signed recovery journal.');
 if(!Array.isArray(keysPublic)||keysPublic.length!==3||keysPublic.some(k=>typeof k!=='string'||!/^[0-9a-f]{64}$/i.test(k)))throw new Error('Invalid recovery owners.');
 const tx=sdk.Transaction.deserializeFromSafeJSON(journal.transaction);tx.finalize();
 if(tx.id!==journal.id||!tx.inputs.length||tx.inputs.length>8||!tx.outputs.length||tx.outputs.length>2)throw new Error('Recovery transaction identity or size mismatch.');
 const signatures=[];
 if(journal.funding){
  for(const input of tx.inputs){if(!/^41[0-9a-f]{128}01$/i.test(input.signatureScript))throw new Error('Recovery requires complete SIGHASH_ALL signatures.');signatures.push(input.signatureScript.slice(2));}
 }else{
  // Every supported entry places its one or two signatures first.
  const count=contract.kind==='treasury'?2:1;let script=tx.inputs[0].signatureScript;
  for(let i=0;i<count;i++){const signature=script.slice(0,132);if(!/^41[0-9a-f]{128}01$/i.test(signature))throw new Error('Recovery requires complete SIGHASH_ALL signatures.');signatures.push(signature.slice(2));script=script.slice(132);}
 }
 const candidates=journal.funding?keysPublic.map(owner=>[null,{owner}]):paths(contract,keysPublic);
 for(const [entry,parameters] of candidates){
  let plan;
  try{
   plan=journal.funding?buildPublicFunding(sdk,{contract,fundingUtxos:tx.inputs.map(i=>i.utxo),owner:parameters.owner}):buildPublicSpend(sdk,{contract,utxo:tx.inputs[0].utxo,entry,parameters,pastMedianTime:Math.max(Number(contract.state.refundAfter??0),Number(contract.state.resolveAfter??0))});
   if(shape(plan.transaction)!==shape(tx))continue;
   if(!journal.funding&&publicUnlockScript(plan,signatures)!==tx.inputs[0].signatureScript)continue;
   plan.transaction=tx;plan.signatures=signatures;plan.signed=true;plan.recovery=true;
   validatePublicPlan(plan);
   // The journal's outputs/observed flags are not trusted or used for construction.
   return plan;
  }catch{continue;}
 }
 throw new Error('Signed recovery does not match a supported contract action, fee, or controlled change destination.');
}
