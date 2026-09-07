// On-chain wages and a subsequent voucher purchase. Crop production/delivery are host game rules.
import {buildV4Genesis,buildV4Transition,derivePublicV4RecoveryPlan} from './public-v4-protocol.mjs';
import {derivePublicV4ComposedRecoveryPlan} from './public-v4-composed.mjs';
export const V4_CROP_PRICE=3000000n;
export const V4_WORKER_WAGE=10000000n;
const outpointEqual=(a,b)=>a.transactionId===b.transactionId&&a.index===b.index;
const recover=(sdk,templates,owners,record)=>(record.journal.kind==='composed'?derivePublicV4ComposedRecoveryPlan:derivePublicV4RecoveryPlan)(sdk,{templates,journal:record.journal,keysPublic:owners});
function wagePlan(sdk,{templates,owners,wageRecord}){
 if(!wageRecord?.acceptingBlock||wageRecord.journal?.kind!=='compute'||wageRecord.journal.operation!==0)throw Error('An accepted scheduling wage is required.');
 const p=recover(sdk,templates,owners,wageRecord),out=p.transaction.outputs[1];
 if(p.states[0]?.worker!==owners[1]||p.states[0]?.reward!==Number(V4_WORKER_WAGE)||out?.value!==V4_WORKER_WAGE||out.covenant||out.scriptPublicKey.script!=='20'+owners[1]+'ac')throw Error('Expected the exact 0.1 tKAS wage paid to Pip.');
 return p;
}
export function selectV4WageUtxo(sdk,{templates,owners,wageRecord,entries,records=[]}){
 const p=wagePlan(sdk,{templates,owners,wageRecord}),point={transactionId:p.transaction.id,index:1};
 // Signed or uncertain spends reserve the wage too. Never select another Pip coin instead.
 if(records.some(r=>r.journal?.id!==point.transactionId&&recover(sdk,templates,owners,r).transaction.inputs.some(i=>outpointEqual(i.previousOutpoint,point))))throw Error('This wage already has a saved spend. Check that transaction; do not spend it again.');
 const u=entries.find(u=>outpointEqual(u.outpoint,point)),o=p.transaction.outputs[1];
 if(!u||u.amount!==o.value||u.entry.covenantId||u.entry.scriptPublicKey.version!==o.scriptPublicKey.version||u.entry.scriptPublicKey.script!==o.scriptPublicKey.script)throw Error('The exact accepted wage output is not available. No other coins will be used.');
 return u;
}
export function buildV4CropGenesis(sdk,{templates,owners,addresses,wageRecord,fundingUtxos,feeRate,...options}){
 const wage=wagePlan(sdk,{templates,owners,wageRecord});
 const mainScript=sdk.payToAddressScript(new sdk.Address(addresses[0])).script;
 if(!fundingUtxos?.length||fundingUtxos.some(u=>u.entry.scriptPublicKey.script!==mainScript))throw Error('Main must fund the crop voucher deposits.');
 return buildV4Genesis(sdk,{kind:'bundle',templates,states:[0,1,2].map(item=>({worldId:wage.transaction.id,owner:owners[0],seller:owners[0],buyer:owners[1],item,price:Number(V4_CROP_PRICE),maxFee:3000000})),cellAmounts:[25000000n,25000000n,25000000n],fundingUtxos,changeAddress:addresses[0],feeRate,...(options.fee!==undefined?{fee:options.fee}:{})});
}
export function buildV4CropPurchase(sdk,{templates,owners,addresses,wageRecord,cells,entries,records=[],feeRate,...options}){
 const wage=selectV4WageUtxo(sdk,{templates,owners,wageRecord,entries,records});
 if(cells?.length!==3||cells.some((c,i)=>{const s=c.asset.state;return s.worldId!==wageRecord.journal.id||s.owner!==owners[0]||s.seller!==owners[0]||s.buyer!==owners[1]||s.price!==Number(V4_CROP_PRICE)||s.item!==i;}))throw Error('Expected this wage’s three unsold crop vouchers.');
 if(!records.some(r=>r.acceptingBlock&&r.journal.id===cells[0].utxo.outpoint.transactionId&&r.journal.kind==='bundle'&&r.journal.operation===null))throw Error('The crop voucher genesis must be accepted before purchase.');
 const p=buildV4Transition(sdk,{kind:'bundle',templates,cells,states:cells.map(c=>({...c.asset.state,owner:owners[1]})),operation:0,fundingUtxos:[wage],payments:[{address:addresses[0],amount:V4_CROP_PRICE},{address:addresses[1],amount:V4_WORKER_WAGE-V4_CROP_PRICE}],feeOutputIndex:4,feeRate,...(options.fee!==undefined?{fee:options.fee}:{})});
 if(BigInt(p.fee)>=V4_WORKER_WAGE-V4_CROP_PRICE)throw Error('The wage cannot cover this purchase and fee. No top-up is allowed.');
 return p;
}
export function deriveV4EconomyEvidence(sdk,{templates,owners,records,wageTransactionId}){
 const wageRecord=records.find(r=>r.journal.id===wageTransactionId);
 const wage=wagePlan(sdk,{templates,owners,wageRecord}),point={transactionId:wage.transaction.id,index:1};
 const plans=records.map(record=>({record,plan:recover(sdk,templates,owners,record)}));
 const sale=plans.find(({plan})=>plan.kind==='bundle'&&plan.genesis?.length===3&&plan.genesis.every(s=>s.worldId===point.transactionId&&s.price===Number(V4_CROP_PRICE)));
 const spent=plans.find(({plan})=>plan.transaction.inputs.some(i=>outpointEqual(i.previousOutpoint,point)));
 const purchase=spent?.plan.kind==='bundle'&&spent.plan.operation===0&&spent.plan.states.length===3&&spent.plan.states.every(s=>s.worldId===point.transactionId&&s.owner===owners[1]&&s.price===Number(V4_CROP_PRICE))?spent:null;
 return {wageTransactionId:point.transactionId,wageOutputIndex:1,wageSompi:String(V4_WORKER_WAGE),wageAcceptingBlock:wageRecord.acceptingBlock,cropGenesisId:sale?.record.journal.id||null,cropGenesisAccepted:Boolean(sale?.record.acceptingBlock),purchaseTransactionId:purchase?.record.journal.id||null,purchaseAccepted:Boolean(purchase?.record.acceptingBlock),purchaseAcceptingBlock:purchase?.record.acceptingBlock||null,priceSompi:purchase?String(V4_CROP_PRICE):null,feeSompi:purchase?purchase.plan.fee:null,pipChangeSompi:purchase?String(purchase.plan.transaction.outputs[4].value):null,wageReserved:Boolean(spent),stage:purchase?(purchase.record.acceptingBlock?'purchased':'purchase-pending'):spent?'wage-spent':sale?(sale.record.acceptingBlock?'crops-for-sale':'crop-genesis-pending'):'wage-paid',boundary:'Payments and voucher ownership are Testnet state. Crops and delivery are game rules.'};
}
