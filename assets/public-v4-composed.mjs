// One transaction, two independently enforced covenant groups. No keys or RPC.
import {instantiateV4} from './public-v4-protocol.mjs';
import {preparePublicAssetPlan,publicAssetPlanMass,validatePublicAssetPlan,acceptKaspirePublicAssetSignature} from './public-asset-signing.mjs';
const NETWORK='testnet-10';
const cov=utxo=>utxo.entry?.covenantId?.toString();
const ownerAddress=(sdk,key)=>new sdk.PublicKey('02'+key).toAddress(NETWORK).toString();
const shape=tx=>{const value=JSON.parse(tx.serializeToSafeJSON());delete value.id;for(const input of value.inputs)delete input.signatureScript;return JSON.stringify(value);};
function raw(sdk,{templates,bundleCells,agentCell,fee}){
 if(!Array.isArray(bundleCells)||bundleCells.length!==3||!agentCell?.utxo)throw new Error('Purchase needs all three vouchers and one agent budget.');
 const cells=[...bundleCells,agentCell],assets=cells.map((cell,index)=>cell.asset??instantiateV4(sdk,templates[index<3?'bundle':'agent'],index<3?'bundle':'agent',cell.state));
 const marketId=cov(bundleCells[0].utxo),budgetId=cov(agentCell.utxo),policy=assets[3].state,offer=assets[0].state;
 if(!marketId||!budgetId||marketId===budgetId||policy.marketId!==marketId||policy.worldId!==offer.worldId||policy.payee!==offer.seller||policy.owner!==offer.buyer)throw new Error('The budget is not authorized for this world, market, seller, and buyer.');
 const seen=new Set();for(const [index,cell]of cells.entries()){
  const id=`${cell.utxo.outpoint.transactionId}:${cell.utxo.outpoint.index}`;if(seen.has(id))throw new Error('Duplicate composed input.');seen.add(id);
  if(assets[index].kind!==(index<3?'bundle':'agent')||cov(cell.utxo)!==(index<3?marketId:budgetId)||cell.utxo.entry.scriptPublicKey.version!==0||cell.utxo.entry.scriptPublicKey.script!==sdk.payToScriptHashScript(assets[index].script).script)throw new Error('Composed input script or lineage mismatch.');
 }
 for(const [index,asset]of assets.slice(0,3).entries()){
  const s=asset.state;if(s.item!==index||s.owner!==offer.seller||s.seller!==offer.seller||s.buyer!==offer.buyer||s.price!==offer.price||s.maxFee!==offer.maxFee||s.worldId!==offer.worldId)throw new Error('All three offered vouchers must belong to the same sale.');
 }
 const price=BigInt(offer.price),cost=BigInt(fee),remainder=agentCell.utxo.amount-price-cost;
 if(price<=0n||price>BigInt(policy.limit)||cost<=0n||cost>BigInt(policy.maxFee)||cost>BigInt(offer.maxFee)||remainder<=0n)throw new Error('Purchase exceeds the spending limit, budget, or fee policy.');
 const states=[...assets.slice(0,3).map(a=>({...a.state,owner:offer.buyer})),{...policy}],next=states.map((state,index)=>instantiateV4(sdk,templates[index<3?'bundle':'agent'],index<3?'bundle':'agent',state));
 const outputs=next.slice(0,3).map((asset,index)=>({value:bundleCells[index].utxo.amount,scriptPublicKey:sdk.payToScriptHashScript(asset.script),covenant:{authorizingInput:0,covenantId:marketId}}));
 outputs.push({value:price,scriptPublicKey:sdk.payToAddressScript(new sdk.Address(ownerAddress(sdk,offer.seller)))});
 outputs.push({value:remainder,scriptPublicKey:sdk.payToScriptHashScript(next[3].script),covenant:{authorizingInput:3,covenantId:budgetId}});
 const transaction=new sdk.Transaction({version:1,inputs:cells.map((cell,index)=>({previousOutpoint:cell.utxo.outpoint,utxo:cell.utxo,signatureScript:'',sequence:0n,sigOpCount:0,computeBudget:assets[index].computeBudget})),outputs,lockTime:0n,subnetworkId:'00'.repeat(20),gas:0n,payload:''});
 const plan={network:NETWORK,kind:'composed',transaction,fee:String(cost),tokens:assets,states,operation:1,covenantId:marketId,budgetCovenantId:budgetId,groups:[{inputStart:0,inputCount:3,states:states.slice(0,3),operation:1},{inputStart:3,inputCount:1,states:[states[3]],operation:2}],signers:assets.map((asset,index)=>({index,kind:'covenant',owner:asset.state.owner}))};
 Object.defineProperty(plan,'sdk',{value:sdk});return plan;
}
export function buildV4Composed(sdk,options){
 if(options.fee!==undefined)return preparePublicAssetPlan(raw(sdk,options),options);
 let fee=1n;for(let attempt=0;attempt<5;attempt++){const plan=raw(sdk,{...options,fee}),minimum=BigInt(publicAssetPlanMass(plan,options).minimumFee);if(fee===minimum)return preparePublicAssetPlan(plan,options);fee=minimum;}throw new Error('Composed purchase fee did not converge.');
}
export function publicV4ComposedJournal(plan){
 if(plan.kind!=='composed'||!validatePublicAssetPlan(plan).complete)throw new Error('Save a fully signed composed purchase.');
 return {version:1,network:NETWORK,kind:'composed',id:plan.transaction.id,transaction:plan.transaction.serializeToSafeJSON(),feeRate:plan.mass.feeRate,inputStates:plan.tokens.map(a=>({...a.state}))};
}
export function derivePublicV4ComposedRecoveryPlan(sdk,{templates,journal,keysPublic}){
 if(!journal||Object.keys(journal).some(k=>!['version','network','kind','id','transaction','feeRate','inputStates'].includes(k))||journal.version!==1||journal.network!==NETWORK||journal.kind!=='composed'||typeof journal.transaction!=='string'||journal.transaction.length>750000||!Array.isArray(journal.inputStates)||journal.inputStates.length!==4)throw new Error('Invalid composed recovery journal.');
 const original=sdk.Transaction.deserializeFromSafeJSON(journal.transaction);original.finalize();if(original.id!==journal.id||original.inputs.length!==4||original.outputs.length!==5)throw new Error('Composed recovery transaction identity or shape mismatch.');
 const cells=journal.inputStates.map((state,index)=>({state,utxo:original.inputs[index].utxo})),fee=original.inputs.reduce((sum,i)=>sum+i.utxo.amount,0n)-original.outputs.reduce((sum,o)=>sum+o.value,0n);
 const plan=buildV4Composed(sdk,{templates,bundleCells:cells.slice(0,3),agentCell:cells[3],fee,feeRate:journal.feeRate});
 if(shape(plan.transaction)!==shape(original)||!Array.isArray(keysPublic)||plan.signers.some(s=>!keysPublic.includes(s.owner)))throw new Error('Composed recovery differs from the supported purchase or its signing owners.');
 for(let index=0;index<4;index++){const partial=sdk.Transaction.deserializeFromSafeJSON(plan.transaction.serializeToSafeJSON());partial.inputs[index].signatureScript=original.inputs[index].signatureScript;acceptKaspirePublicAssetSignature(sdk,plan,index,partial.serializeToSafeJSON());}
 if(plan.transaction.serializeToSafeJSON()!==original.serializeToSafeJSON())throw new Error('Composed recovery did not reproduce the saved transaction.');return plan;
}
