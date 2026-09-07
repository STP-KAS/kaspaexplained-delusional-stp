import {test} from 'node:test';
import assert from 'node:assert/strict';
import {observePublicAcceptance} from '../src/public-acceptance.mjs';
const history=(added=[],accepted=[],removed=[])=>({addedChainBlockHashes:added,removedChainBlockHashes:removed,acceptedTransactionIds:accepted});
test('accepted history finds the exact transaction even after its outputs are spent',async()=>{
 const calls=[],responses=[history(['b'],[{acceptingBlockHash:'b',acceptedTransactionIds:['other','target']}]),history()];
 const result=await observePublicAcceptance({getVirtualChainFromBlock:async request=>{calls.push(request);return responses.shift();}},{checkpoint:'a',id:'target'});
 assert.deepEqual(result,{acceptingBlock:'b',scanCursor:'b',scanCaughtUp:true});
 assert.deepEqual(calls.map(c=>c.startHash),['a','b']);assert.ok(calls.every(c=>c.includeAcceptedTransactionIds));
});
test('reorganization revokes previous acceptance and can recognize a replacement',async()=>{
 for(const replacement of [false,true]){
  const responses=[history(['d'],replacement?[{acceptingBlockHash:'d',acceptedTransactionIds:['target']}]:[],['c','b']),history()];
  const result=await observePublicAcceptance({getVirtualChainFromBlock:async()=>responses.shift()},{checkpoint:'a',scanCursor:'c',acceptingBlock:'b',id:'target'});
  assert.equal(result.acceptingBlock,replacement?'d':null);assert.equal(result.scanCaughtUp,true);
 }
});
test('bounded history resumes at its last cursor and never substitutes another ID',async()=>{
 let count=0;const result=await observePublicAcceptance({getVirtualChainFromBlock:async()=>history([String(++count)],[{acceptingBlockHash:String(count),acceptedTransactionIds:['other']}])},{checkpoint:'a',id:'target'},{pages:2});
 assert.deepEqual(result,{acceptingBlock:null,scanCursor:'2',scanCaughtUp:false});assert.equal(count,2);
});
test('missing checkpoint and failed node calls cannot manufacture acceptance',async()=>{
 const rpc={getVirtualChainFromBlock:async()=>{throw new Error('node unavailable');}};
 assert.deepEqual(await observePublicAcceptance(rpc,{id:'target',acceptingBlock:'stale'}),{acceptingBlock:null,scanCursor:null,scanCaughtUp:false});
 await assert.rejects(observePublicAcceptance(rpc,{checkpoint:'a',id:'target'}),/node unavailable/);
});
