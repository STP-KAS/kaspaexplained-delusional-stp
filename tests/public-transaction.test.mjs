import {test} from 'node:test';
import assert from 'node:assert/strict';
import {normalizeTransaction,lookupTransaction} from '../src/public-transaction.mjs';
import {normalizeTransaction as serverNormalize} from '../server/transaction.mjs';
const id='ab'.repeat(32),raw={transaction_id:id,is_accepted:true,inputs:[{previous_outpoint_hash:'cd'.repeat(32),previous_outpoint_index:0,previous_outpoint_resolved:{amount:12345}}],outputs:[{index:0,amount:12000,script_public_key_address:'kaspa:example'}]};
test('browser normalization preserves server semantics including unavailable amounts',()=>{
 for(const value of [raw,{...raw,inputs:[{}]},{...raw,outputs:[{amount:Number.MAX_SAFE_INTEGER+1}]}])assert.deepEqual(normalizeTransaction(value,'fixed'),serverNormalize(value,'fixed'));
 assert.equal(normalizeTransaction(raw).feeSompi,'345');assert.equal(normalizeTransaction({...raw,inputs:[{}]}).feeSompi,null);
});
test('lookup requests only the public provider and checks identity',async()=>{
 const good=await lookupTransaction(id,async(url,options)=>{assert.equal(url,`https://api.kaspa.org/transactions/${id}?resolve_previous_outpoints=light`);assert.equal(options.redirect,'error');return new Response(JSON.stringify(raw));});assert.equal(good.status,200);
 assert.equal((await lookupTransaction(id,async()=>new Response(JSON.stringify({...raw,transaction_id:'cc'.repeat(32)})))).status,502);
});
test('invalid ID never fetches; absent and failed providers stay distinct',async()=>{
 assert.equal((await lookupTransaction('bad',()=>assert.fail('must not fetch'))).status,400);
 assert.equal((await lookupTransaction(id,async()=>new Response('',{status:404}))).status,404);
 for(const fetcher of [async()=>new Response('',{status:500}),async()=>{throw new Error('CORS/network');},async()=>new Response('{invalid')])assert.equal((await lookupTransaction(id,fetcher)).status,502);
});
test('declared and streamed bodies over 2 MB are rejected and cancelled',async()=>{
 assert.equal((await lookupTransaction(id,async()=>new Response('{}',{headers:{'content-length':'2000001'}}))).status,502);
 let cancelled=false;const body=new ReadableStream({start(c){c.enqueue(new Uint8Array(1000001));c.enqueue(new Uint8Array(1000000));},cancel(){cancelled=true;}});
 assert.equal((await lookupTransaction(id,async()=>new Response(body))).status,502);assert.equal(cancelled,true);
});
