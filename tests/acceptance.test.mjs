import {test} from 'node:test';
import assert from 'node:assert/strict';
import {scanAcceptance} from '../server/acceptance.mjs';
const response=(added=[],removed=[],groups=[])=>({addedChainBlockHashes:added,removedChainBlockHashes:removed,acceptedTransactionIds:groups});
test('acceptance follows truncated pages and retains resumable progress',async()=>{
  const seen=[];const rpc={getVirtualChainFromBlock:async({startHash})=>{seen.push(startHash);return startHash==='start'?response(['middle']):startHash==='middle'?response(['tip'],[],[{acceptingBlockHash:'tip',acceptedTransactionIds:['tx']}]):response();}};
  const first=await scanAcceptance(rpc,{checkpoint:'start',id:'tx'},{pages:1});assert.equal(first.acceptingBlock,null);assert.equal(first.scanCursor,'middle');assert.equal(first.scanCaughtUp,false);
  const result=await scanAcceptance(rpc,{checkpoint:'start',id:'tx',...first});assert.equal(result.acceptingBlock,'tip');assert.equal(result.scanCaughtUp,true);assert.deepEqual(seen,['start','middle','tip']);
});
test('reorganization revokes old acceptance, or replaces it when reaccepted',async()=>{
  const transaction={checkpoint:'start',scanCursor:'old',acceptingBlock:'old',id:'tx'};
  const revoked=await scanAcceptance({getVirtualChainFromBlock:async()=>response([],['old'])},transaction);assert.equal(revoked.acceptingBlock,null);
  let calls=0;const moved=await scanAcceptance({getVirtualChainFromBlock:async()=>calls++?response():response(['new'],['old'],[{acceptingBlockHash:'new',acceptedTransactionIds:['tx']}])},transaction);assert.equal(moved.acceptingBlock,'new');
});
