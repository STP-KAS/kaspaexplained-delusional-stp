// Encrypted-journal payload helpers only. No private keys, storage, signing or RPC.
import {buildPublicPayment,validatePublicAssetPlan,acceptKaspirePublicAssetSignature} from './public-asset-signing.mjs';
import {instantiatePublicToken,buildTokenGenesis,buildTokenMove,readTokenNamePayload} from './public-token.mjs';
import {instantiatePublicReceipt,buildBackedGenesis,buildBackedMove} from './public-receipt.mjs';
const NETWORK='testnet-10';
const clone=value=>JSON.parse(JSON.stringify(value));
const tokenRecord=t=>({issuer:t.issuer,cap:t.cap,state:t.state});
const receiptRecord=r=>({series:r.series,maxFee:r.maxFee,state:r.state});
const shape=tx=>{const value=JSON.parse(tx.serializeToSafeJSON());delete value.id;for(const i of value.inputs)delete i.signatureScript;return JSON.stringify(value);};
function fields(value,names){if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(k=>!names.includes(k)))throw new Error('Unknown asset recovery fields.');}
function publicKey(script){if(!/^20[0-9a-f]{64}ac$/i.test(script))throw new Error('Recovery requires a P2PK native output.');return script.slice(2,66);}
function address(sdk,output){if(output.scriptPublicKey.version!==0)throw new Error('Unsupported recovered output version.');return sdk.addressFromScriptPublicKey(output.scriptPublicKey,NETWORK).toString();}
export function publicAssetJournal(plan){
 const checked=validatePublicAssetPlan(plan);if(!checked.complete)throw new Error('Every signature must be collected before exporting a signed asset journal.');
 const kind=plan.payment?'payment':plan.receipts?'receipt':'token';
 const value={version:1,network:NETWORK,kind,id:plan.transaction.id,transaction:plan.transaction.serializeToSafeJSON(),feeRate:plan.mass.feeRate,operation:plan.operation,inputAssets:(plan.receipts??plan.tokens??[]).map(kind==='receipt'?receiptRecord:tokenRecord),states:plan.states??[]};
 if(plan.payment?.recipients)value.payment=clone(plan.payment);
 if(plan.operation===null&&kind!=='payment'){if(!plan.genesis)throw new Error('Genesis state is required for recovery.');value.genesis=plan.genesis;}
 return clone(value);
}
export function derivePublicAssetRecoveryPlan(sdk,{templates,journal,keysPublic}){
 fields(journal,['version','network','kind','id','transaction','feeRate','operation','inputAssets','states','genesis','payment']);
 if(journal.version!==1||journal.network!==NETWORK||!['token','receipt','payment'].includes(journal.kind)||!/^([0-9a-f]{64})$/.test(journal.id)||typeof journal.transaction!=='string'||journal.transaction.length>750000||!Array.isArray(journal.inputAssets)||journal.inputAssets.length>2||!Array.isArray(journal.states)||journal.states.length>2)throw new Error('Invalid asset recovery journal.');
 if(!Array.isArray(keysPublic)||keysPublic.length<1||keysPublic.length>8||keysPublic.some(k=>typeof k!=='string'||!/^[0-9a-f]{64}$/i.test(k)))throw new Error('Invalid asset recovery owners.');
 const original=sdk.Transaction.deserializeFromSafeJSON(journal.transaction);original.finalize();
 if(original.id!==journal.id||!original.inputs.length||original.inputs.length>8||!original.outputs.length||original.outputs.length>4)throw new Error('Asset recovery identity or size mismatch.');
 const fee=original.inputs.reduce((sum,i)=>sum+i.utxo.amount,0n)-original.outputs.reduce((sum,o)=>sum+o.value,0n);
 const covInputs=original.inputs.filter(i=>i.utxo.entry.covenantId),covOutputs=original.outputs.filter(o=>o.covenant);
 if(original.inputs.some((i,n)=>Boolean(i.utxo.entry.covenantId)!==(n<covInputs.length))||original.outputs.some((o,n)=>Boolean(o.covenant)!==(n<covOutputs.length)))throw new Error('Covenant recovery layout mismatch.');
 if(covInputs.length!==journal.inputAssets.length)throw new Error('Missing recovered asset inputs.');
 if(journal.kind!=='payment'&&journal.payment!==undefined)throw new Error('Unexpected payment recovery fields.');
 const feeRate=journal.feeRate;let plan;
 const instantiate=record=>{
  fields(record,journal.kind==='token'?['issuer','cap','state']:['series','maxFee','state']);
  fields(record.state,journal.kind==='token'?['issuer','cap','owner','quantity','isMinter']:['series','maxFee','owner','quantity','seriesId']);
  if(journal.kind==='token'&&(record.state.issuer!==record.issuer||record.state.cap!==record.cap)||journal.kind==='receipt'&&(record.state.series!==record.series||record.state.seriesId!==record.series||record.state.maxFee!==record.maxFee))throw new Error('Recovered asset identity fields disagree.');
  return journal.kind==='token'?instantiatePublicToken(sdk,templates.token,record):instantiatePublicReceipt(sdk,templates.receipt,record);
 };
 if(journal.kind==='payment'){
  if(covInputs.length||covOutputs.length||journal.inputAssets.length||journal.states.length||journal.operation!==null||journal.genesis)throw new Error('Invalid payment recovery shape.');
  const owner=publicKey(original.inputs[0].utxo.entry.scriptPublicKey.script);let destinations={recipient:publicKey(original.outputs[0].scriptPublicKey.script),amount:original.outputs[0].value};
  if(journal.payment!==undefined){fields(journal.payment,['owner','recipients','amount']);if(journal.payment.owner!==owner||!Array.isArray(journal.payment.recipients)||journal.payment.recipients.length!==2)throw new Error('Invalid recovered split payment.');destinations={recipients:journal.payment.recipients};}
  plan=buildPublicPayment(sdk,{fundingUtxos:original.inputs.map(i=>i.utxo),owner,...destinations,feeRate});
  if(journal.payment!==undefined&&JSON.stringify(journal.payment)!==JSON.stringify(plan.payment))throw new Error('Recovered payment destinations or amounts disagree.');
 }else if(journal.operation===null){
  if(covInputs.length||journal.states.length||covOutputs.length!==1||!journal.genesis)throw new Error('Invalid asset genesis recovery.');
  const asset=instantiate(journal.genesis),fundingUtxos=original.inputs.map(i=>i.utxo);
  if(journal.kind==='token')plan=buildTokenGenesis(sdk,{fundingUtxos,token:asset,tokenName:readTokenNamePayload(original.payload),cellAmount:original.outputs[0].value,fee,changeAddress:address(sdk,original.outputs[1]??{scriptPublicKey:original.inputs[0].utxo.entry.scriptPublicKey}),computeBudget:original.inputs[0].computeBudget,feeRate});
  else plan=buildBackedGenesis(sdk,{fundingUtxos,receipt:asset,fee,sponsorPublicKey:publicKey(original.inputs[0].utxo.entry.scriptPublicKey.script),nativeBudget:original.inputs[0].computeBudget,feeRate});
 }else{
  if(!covInputs.length||covOutputs.length!==journal.states.length||journal.genesis)throw new Error('Invalid asset transition recovery.');
  const assets=journal.inputAssets.map(instantiate);
  const successors=journal.states.map(state=>instantiate(journal.kind==='token'?{issuer:assets[0].issuer,cap:assets[0].cap,state}:{series:assets[0].series,maxFee:assets[0].maxFee,state}));
  if(journal.kind==='token'){
   if(original.inputs.some(i=>i.computeBudget!==original.inputs[0].computeBudget))throw new Error('Inconsistent token recovery budgets.');
   plan=buildTokenMove(sdk,{tokenInputs:assets.map((token,index)=>({token,utxo:original.inputs[index].utxo})),successors:successors.map((token,index)=>({token,amount:original.outputs[index].value})),operation:journal.operation,fundingUtxos:original.inputs.slice(assets.length).map(i=>i.utxo),payments:original.outputs.slice(successors.length).map(o=>({address:address(sdk,o),amount:o.value})),fee,computeBudget:original.inputs[0].computeBudget,feeRate});
  }else{
   if(original.inputs.length!==assets.length+1||![0,1].includes(journal.operation))throw new Error('Invalid receipt sponsor or operation.');
   const sponsor=original.inputs.at(-1);
   plan=buildBackedMove(sdk,{receiptInputs:assets.map((receipt,index)=>({receipt,utxo:original.inputs[index].utxo})),successors,operation:journal.operation===0?'transfer':'redeem',sponsorUtxo:sponsor.utxo,sponsorPublicKey:publicKey(sponsor.utxo.entry.scriptPublicKey.script),fee,receiptBudget:original.inputs[0].computeBudget,nativeBudget:sponsor.computeBudget,feeRate});
  }
 }
 if(shape(plan.transaction)!==shape(original)||plan.signers.some(s=>!keysPublic.includes(s.owner)))throw new Error('Recovered transaction differs from supported construction or its signing owners.');
 for(let index=0;index<original.inputs.length;index++){
  // Supply each saved signature through the same strict external-wallet validator.
  const partial=sdk.Transaction.deserializeFromSafeJSON(plan.transaction.serializeToSafeJSON());partial.inputs[index].signatureScript=original.inputs[index].signatureScript;
  acceptKaspirePublicAssetSignature(sdk,plan,index,partial.serializeToSafeJSON());
 }
 if(!validatePublicAssetPlan(plan).complete||plan.transaction.serializeToSafeJSON()!==original.serializeToSafeJSON())throw new Error('Asset recovery did not reproduce the identical signed transaction.');
 return plan;
}
