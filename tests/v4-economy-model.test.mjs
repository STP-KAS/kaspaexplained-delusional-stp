import {test} from 'node:test';
import assert from 'node:assert/strict';
import {deriveV4Economy} from '../src/v4-economy-model.mjs';
const record=(id,kind,operation,extra={})=>({acceptingBlock:'accepted',journal:{id,kind,operation,...extra}});
const base=[record('parts','composed',0),record('fund','launch',1),record('wage','compute',0),record('purchase','bundle',0)];
const evidence={wageTransactionId:'wage',wageAcceptingBlock:'accepted',wageSompi:'10000000',purchaseTransactionId:'purchase',purchaseAccepted:true,priceSompi:'3000000',feeSompi:'12000',pipChangeSompi:'6988000'};
const state=(x,y,energy,worldId='purchase')=>({x,y,energy,worldId,owner:'Pip'});
const genesis=record('habitat','terrarium',undefined,{genesis:[state(1,1,3)]});
const move=(id,parent,before,after)=>record(id,'terrarium',0,{inputStates:[before],states:[after],transaction:JSON.stringify({inputs:[{transactionId:parent,index:0}]})});
const walk=[genesis,move('m1','habitat',state(1,1,3),state(2,1,2)),move('m2','m1',state(2,1,2),state(2,2,1)),move('m3','m2',state(2,2,1),state(1,2,0))];
test('accepted wage purchase and connected delivery explain money and physical boundary',()=>{
 const result=deriveV4Economy({records:[...base,...walk],evidence});
 assert.equal(result.objective.stage,'complete');assert.equal(result.crops.delivered,3);assert.equal(result.crops.inTransit,0);
 assert.deepEqual(result.ledger,{earnedSompi:'10000000',spentSompi:'3000000',feeSompi:'12000',pipRemainingSompi:'6988000'});
 assert.equal(result.parts.remaining,0);assert.equal(result.greenhouse.built,true);assert.match(result.boundaries.physical,/local game rules/);
});
test('replay and duplicate receipts cannot multiply inventory or income',()=>{
 const records=[...base,...walk];const once=deriveV4Economy({records,evidence});
 assert.deepEqual(deriveV4Economy({records:[...records,...records],evidence}),once);
 assert.deepEqual(deriveV4Economy({records:structuredClone(records),evidence}),once);
});
test('pending purchase and optimistic cached application award no crop',()=>{
 const records=base.map(r=>r.journal.id==='purchase'?{...r,acceptingBlock:null,applied:true}:r);
 const result=deriveV4Economy({records:[...records,...walk],evidence});
 assert.equal(result.crops.bought,0);assert.equal(result.crops.delivered,0);assert.equal(result.ledger.spentSompi,'0');
});
test('prior habitat journey and unrelated habitat cannot deliver new cargo',()=>{
 assert.equal(deriveV4Economy({records:[...walk,...base],evidence}).crops.delivered,0);
 const unrelated=structuredClone(walk);unrelated[0].journal.genesis[0].worldId='old-crops';
 assert.equal(deriveV4Economy({records:[...base,...unrelated],evidence}).crops.delivered,0);
});
test('missing, disconnected or invalid moves leave delivery incomplete',()=>{
 for(const steps of [walk.slice(0,3),[walk[0],walk[2],walk[3]],[...walk.slice(0,3),move('jump','m2',state(2,2,1),state(0,2,0))]]){
  const result=deriveV4Economy({records:[...base,...steps],evidence});assert.equal(result.delivery.complete,false);assert.equal(result.crops.inTransit,3);
 }
});
test('restoration cleared acceptance cannot retain wages, purchases or physical output',()=>{
 const result=deriveV4Economy({records:[...base,...walk].map(r=>({...r,acceptingBlock:null})),evidence});
 assert.equal(result.ledger.earnedSompi,'0');assert.equal(result.crops.delivered,0);assert.equal(result.greenhouse.built,false);assert.equal(result.objective.stage,'buy-parts');
});

test('SDK safeJSON flat outpoints and recovered nested outpoints project the same accepted delivery',()=>{
 const flat=deriveV4Economy({records:[...base,...walk],evidence});
 const nested=structuredClone(walk);for(const {journal:j} of nested)if(j.transaction){const tx=JSON.parse(j.transaction);tx.inputs=tx.inputs.map(point=>({previousOutpoint:point}));j.transaction=JSON.stringify(tx);}
 assert.equal(flat.delivery.complete,true);assert.deepEqual(deriveV4Economy({records:[...base,...nested],evidence}),flat);
});
