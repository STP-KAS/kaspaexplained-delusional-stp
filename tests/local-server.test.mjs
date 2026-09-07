import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createLocalServer} from '../server/index.mjs';
import {request as httpRequest} from 'node:http';

test('a failed transaction provider returns a readable error without stopping the preview',async t=>{
  const server=createLocalServer({testnet:{},lookup:async()=>{throw new Error('private upstream details');}});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  t.after(()=>new Promise(resolve=>server.close(resolve)));
  const origin=`http://127.0.0.1:${server.address().port}`;
  const response=await fetch(origin+'/api/transaction/'+'a'.repeat(64));
  assert.equal(response.status,503);
  assert.deepEqual(await response.json(),{error:'Transaction lookup is temporarily unavailable. Try again shortly.'});
  assert.equal((await fetch(origin+'/api/session')).status,200);
});

test('local API rejects unauthorized and malformed requests before invoking the wallet',async t=>{
  let calls=0;
  const server=createLocalServer({testnet:{status:async()=>{calls++;return {network:'testnet-10'};}},lookup:async()=>({status:503,body:{error:'Offline fixture'}})});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  t.after(()=>new Promise(resolve=>server.close(resolve)));
  const origin=`http://127.0.0.1:${server.address().port}`;
  const {capability}=await(await fetch(origin+'/api/session')).json();
  assert.match(capability,/^[a-f0-9]{64}$/);
  const post=(headers={},body='{}')=>fetch(origin+'/api/testnet/status',{method:'POST',headers:{origin,'content-type':'application/json','x-lab-capability':capability,...headers},body});
  assert.equal((await post({'x-lab-capability':'é'.repeat(64)})).status,403);
  assert.equal((await post({origin:'https://example.com'})).status,403);
  assert.equal((await post({'sec-fetch-site':'cross-site'})).status,403);
  const invalidHost=await new Promise((resolve,reject)=>{const request=httpRequest(origin+'/api/session',{headers:{host:'attacker.example'}},response=>{response.resume();resolve(response.statusCode);});request.on('error',reject);request.end();});
  assert.equal(invalidHost,403);
  assert.equal((await post({'content-type':'text/plain'})).status,415);
  assert.equal((await post({},'{')).status,400);
  assert.equal((await post({},JSON.stringify({value:'x'.repeat(5000)}))).status,413);
  assert.equal(calls,0);
  const valid=await post();assert.equal(valid.status,200);assert.deepEqual(await valid.json(),{network:'testnet-10'});assert.equal(calls,1);
  assert.equal((await fetch(origin+'/api/testnet/status')).status,405);
  assert.equal((await fetch(origin+'/api/transaction/not-an-id')).status,400);
  assert.equal((await fetch(origin+'/api/transaction/'+'a'.repeat(64))).status,503);
});
