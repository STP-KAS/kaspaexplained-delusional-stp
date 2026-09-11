// Pure game projection of freshly accepted, validated journal records. Physical
// parts, production and cargo are illustrative; this module is not an oracle.
const transaction=j=>typeof j.transaction==='string'?JSON.parse(j.transaction):j.transaction;
const accepted=records=>{const seen=new Set();return records.filter(r=>{const id=r.journal?.id;if(!id||!r.acceptingBlock||seen.has(id))return false;seen.add(id);return true;});};
const spends=(j,id)=>{try{return transaction(j)?.inputs?.some(i=>{const point=i.previousOutpoint||i;return point.transactionId===id&&point.index===0;})||false;}catch{return false;}};
export function deriveV4Economy({records=[],evidence=null}={}){
 const history=accepted(records),has=(kind,operation)=>history.some(r=>r.journal.kind===kind&&r.journal.operation===operation);
 const partsBought=history.some(r=>r.journal.kind==='composed')?3:0;
 const funded=has('launch',1),built=funded&&partsBought===3;
 const wage=Boolean(evidence?.wageAcceptingBlock&&history.some(r=>r.journal.id===evidence.wageTransactionId&&r.journal.kind==='compute'&&r.journal.operation===0));
 const purchaseIndex=wage&&evidence?.purchaseAccepted?history.findIndex(r=>r.journal.id===evidence.purchaseTransactionId&&r.journal.kind==='bundle'&&r.journal.operation===0):-1;
 const bought=purchaseIndex>=0?3:0;
 let genesisId=null,moves=0,position=null,lastId=null;
 if(bought){
  // A previous walk cannot deliver a newly purchased crop. Only a newly opened
  // habitat and its connected successor chain count, never unrelated moves.
  for(const {journal:j} of history.slice(purchaseIndex+1)){
   if(j.kind!=='terrarium')continue;
   if(!genesisId&&j.genesis?.length===1&&j.genesis[0].worldId===evidence.purchaseTransactionId&&j.genesis[0].x===1&&j.genesis[0].y===1&&j.genesis[0].energy===3){genesisId=j.id;lastId=j.id;position={x:1,y:1,energy:3};continue;}
   const next=j.states?.[0],before=j.inputStates?.[0];
   if(!genesisId||j.operation!==0||!spends(j,lastId)||!next||!before)continue;
   if(before.x!==position.x||before.y!==position.y||before.energy!==position.energy||next.worldId!==before.worldId||next.owner!==before.owner||next.energy!==before.energy-1||Math.abs(next.x-before.x)+Math.abs(next.y-before.y)!==1)continue;
   position={x:next.x,y:next.y,energy:next.energy};moves++;lastId=j.id;
  }
 }
 const complete=Boolean(bought&&moves===3&&position?.x===1&&position?.y===2&&position?.energy===0);
 const produced=built&&wage?3:0;
 let stage=!partsBought?'buy-parts':!built?'fund-greenhouse':!wage?'earn-wage':!bought?'buy-crops':!complete?'deliver-crops':'complete';
 const objectives={
  'buy-parts':['Buy greenhouse parts','Pip buys all three parts together within its spending rule.'],
  'fund-greenhouse':['Fund the greenhouse','Three backers release their contributions together; the game uses the three parts to build.'],
  'earn-wage':['Earn a scheduling wage','Submit a valid schedule to pay Pip 0.1 tKAS. Crop production is a local game result.'],
  'buy-crops':['Spend the wage on crops','Use Pip’s exact wage output to pay 0.03 tKAS for three crop vouchers.'],
  'deliver-crops':['Carry the bought crops to the food store',`Sprout has made ${moves} of three accepted steps. Reach square (1, 2) to deliver the local cargo.`],
  complete:['Food delivered','Pip earned a wage, bought crops, and Sprout delivered three food to the store.']
 };
 return {ledger:{earnedSompi:wage?String(evidence.wageSompi):'0',spentSompi:bought?String(evidence.priceSompi):'0',feeSompi:bought?String(evidence.feeSompi):'0',pipRemainingSompi:bought?String(evidence.pipChangeSompi):wage?String(evidence.wageSompi):'0'},parts:{bought:partsBought,used:built?3:0,remaining:built?0:partsBought},greenhouse:{funded,built},crops:{produced,bought,inTransit:bought&&!complete?3:0,delivered:complete?3:0,remainingAtGreenhouse:Math.max(0,produced-bought)},delivery:{genesisId,moves,position,complete},objective:{stage,title:objectives[stage][0],detail:objectives[stage][1]},boundaries:{ledger:'Testnet payments, voucher ownership and movement transitions are accepted transaction evidence.',physical:'Parts, greenhouse production, carried crops and food delivery are local game rules, not proof of physical goods.'}};
}
