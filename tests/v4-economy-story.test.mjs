import {test} from 'node:test';
import assert from 'node:assert/strict';
import {V4_ECONOMY_STORY as story,V4_ECONOMY_REPEAT as repeat} from '../src/v4-economy-story.mjs';
import {V4_WORKER_WAGE,V4_CROP_PRICE} from '../src/v4-economy-protocol.mjs';
const route=steps=>steps.map(s=>s.id),step=id=>story.find(s=>s.id===id),index=id=>route(story).indexOf(id);
test('economic dependencies precede payment and delivery; rejected overspend adds no transaction',()=>{
 assert.equal(new Set(route(story)).size,story.length);
 for(const chain of [['shop','budget','overspend','buy','parts-refund','recover'],['buy','factory','approve-main','approve-pip','approve-third','factory-pay'],['factory-pay','compute','compute-pay','compute-refund','crop-shop','crop-buy','habitat','move-1','move-2','move-3','habitat-refund','crop-refund']])for(let i=1;i<chain.length;i++)assert(index(chain[i-1])<index(chain[i]),`${chain[i-1]} must precede ${chain[i]}`);
 assert.equal(story.filter(s=>s.expected.accepted).length,21);
 assert.deepEqual(story.filter(s=>s.expected.localReject).map(s=>s.id),['overspend']);
 assert.equal(step('overspend').expected.accepted,false);
 assert(!route(story).includes('pay'),'The unrelated preliminary restricted payment must not return');
});
test('guide expectations describe the actual covenant lifecycle',()=>{
 const expected={shop:['bundle',null],budget:['agent',null],buy:['composed',1],'parts-refund':['bundle',2],recover:['agent',1],factory:['launch',null],'approve-main':['launch',0],'approve-pip':['launch',0],'approve-third':['launch',0],'factory-pay':['launch',1],compute:['compute',null],'compute-pay':['compute',0],'compute-refund':['compute',1],'crop-shop':['bundle',null],'crop-buy':['bundle',0],habitat:['terrarium',null],'move-1':['terrarium',0],'move-2':['terrarium',0],'move-3':['terrarium',0],'habitat-refund':['terrarium',1],'crop-refund':['bundle',2]};
 for(const [id,pair] of Object.entries(expected)){assert.deepEqual([step(id).expected.kind,step(id).expected.operation],pair,id);assert.equal(step(id).expected.accepted,true,id);}
 for(const id of ['crop-shop','crop-buy','crop-refund'])assert.equal(step(id).action,id,'Crop actions must dispatch to their separate purchase lineage');
});
test('repeat orders earn a new wage and buy new crops without rebuilding or replaying old shopping',()=>{
 assert.deepEqual(route(repeat),route(story).slice(index('compute')));
 assert.equal(repeat.filter(s=>s.expected.accepted).length,11);
 for(const s of repeat){assert.deepEqual(s.expected,step(s.id).expected,s.id);assert.equal(s.action,step(s.id).action,s.id);}
 assert(!repeat.some(s=>s.expected.kind==='composed'||s.expected.kind==='launch'||s.expected.localReject));
 assert(route(repeat).indexOf('compute-pay')<route(repeat).indexOf('crop-buy'));
 assert(route(repeat).indexOf('crop-buy')<route(repeat).indexOf('habitat'));
});
test('quoted wage and price match executable amounts in both routes',()=>{
 const amounts=text=>[...text.matchAll(/(\d+(?:\.\d+)?)\s*tKAS/g)].map(m=>BigInt(Math.round(Number(m[1])*1e8)));
 for(const steps of [story,repeat]){
  for(const id of ['compute','compute-pay']){const s=steps.find(s=>s.id===id),values=amounts(s.line);assert(values.length>0);assert(values.every(v=>v===V4_WORKER_WAGE),id);}
  const sale=steps.find(s=>s.id==='crop-shop'),buy=steps.find(s=>s.id==='crop-buy');assert.deepEqual(amounts(sale.line),[V4_CROP_PRICE]);assert.deepEqual(amounts(buy.line),[V4_CROP_PRICE,V4_WORKER_WAGE]);
 }
 assert(V4_WORKER_WAGE>V4_CROP_PRICE,'Wage must leave change available for the network fee');
});
