import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {buildFaucetPayment,validateFaucetPayment,validateClaim} from '../faucet/policy.mjs';
const sdk=createRequire(import.meta.url)('../.cache/upstream/kaspa-wasm32-sdk/nodejs/kaspa');
const keys=[71,72,73].map(n=>new sdk.PrivateKey(n.toString(16).padStart(2,'0').repeat(32))),addresses=keys.map(k=>k.toAddress('testnet-10').toString());
const [changeAddress,destination,outsider]=addresses,options={destination,changeAddress,feeRate:100};
const entry=(tag=1,amount=10000000000n,owner=0,covenant=false)=>new sdk.UtxoEntries([{outpoint:{transactionId:tag.toString(16).padStart(2,'0').repeat(32),index:0},amount,scriptPublicKey:sdk.payToAddressScript(keys[owner].toAddress('testnet-10')),blockDaaScore:0n,isCoinbase:false,...(covenant?{covenant_id:'aa'.repeat(32)}:{})}]).items[0];
const build=(entries=[entry()])=>buildFaucetPayment(sdk,{...options,entries});
const signed=()=>{const plan=build();for(let i=0;i<plan.transaction.inputs.length;i++)plan.transaction.inputs[i].signatureScript=sdk.createInputSignature(plan.transaction,i,keys[0]);plan.transaction.finalize();return plan;};
const copy=tx=>sdk.Transaction.deserializeFromSafeJSON(tx.serializeToSafeJSON());

test('faucet constructs exactly 10 tKAS and owned change within its fee ceiling',()=>{
 const plan=signed(),tx=plan.transaction;assert.equal(tx.inputs.length,1);assert.equal(tx.outputs.length,2);
 assert.equal(tx.outputs[0].value,1000000000n);assert.equal(tx.outputs[0].scriptPublicKey.script,sdk.payToAddressScript(new sdk.Address(destination)).script);
 assert.equal(tx.outputs[1].scriptPublicKey.script,sdk.payToAddressScript(new sdk.Address(changeAddress)).script);
 const fee=tx.inputs.reduce((n,i)=>n+i.utxo.amount,0n)-tx.outputs.reduce((n,o)=>n+o.value,0n);assert(fee>0n&&fee<=1000000n);assert.equal(BigInt(plan.fee),fee);assert.equal(BigInt(plan.total),10000000000n);assert.equal(BigInt(plan.change),tx.outputs[1].value);
 assert.equal(BigInt(validateFaucetPayment(sdk,tx,options)),fee);
});
test('faucet rejects diverted destination/change, amount changes and transaction metadata',()=>{
 const plan=signed();
 for(const mutate of [tx=>tx.outputs[0].scriptPublicKey=sdk.payToAddressScript(new sdk.Address(outsider)),tx=>tx.outputs[1].scriptPublicKey=sdk.payToAddressScript(new sdk.Address(outsider)),tx=>{tx.outputs[0].value-=1n;tx.outputs[1].value+=1n;},tx=>{tx.outputs[0].value+=1n;tx.outputs[1].value-=1n;},tx=>tx.outputs[1].value-=1000000n,tx=>tx.lockTime=1n,tx=>tx.version=0,tx=>tx.payload='ab',tx=>tx.inputs[0].sequence=1n,tx=>tx.storageMass+=1n]){
  const tx=copy(plan.transaction);mutate(tx);assert.throws(()=>validateFaucetPayment(sdk,tx,options));
 }
});
test('faucet funding rejects foreign/covenant inputs, duplicate outpoints and insufficient funds',()=>{
 for(const entries of [[],[entry(1,1000000000n)],[entry(1,10000000000n,1)],[entry(1,10000000000n,0,true)],[entry(),entry()]])assert.throws(()=>build(entries));
 assert.throws(()=>buildFaucetPayment(sdk,{...options,entries:[entry()],feeRate:100000}));
 const plan=build(Array.from({length:12},(_,i)=>entry(i+1,2000000000n)));assert(plan.transaction.inputs.length<=8);
});
test('faucet final validation requires SIGHASH_ALL signatures and the reviewed fee rate',()=>{
 const plan=signed();for(const script of ['', '00', '41'+'00'.repeat(64)+'02']){const tx=copy(plan.transaction);tx.inputs[0].signatureScript=script;assert.throws(()=>validateFaucetPayment(sdk,tx,options));}
 assert.throws(()=>validateFaucetPayment(sdk,plan.transaction,{...options,feeRate:100000}));
});
test('claim input is restricted to a normalized request ID and testnet P2PK address',()=>{
 const requestId='12345678-1234-4234-8234-123456789abc';const claim=validateClaim({address:destination,requestId},sdk);assert.equal(claim.address,destination);assert.equal(claim.requestId,requestId);
 for(const value of [null,{},[],{address:destination,requestId:'../evil'},{address:destination,requestId},{address:keys[1].toAddress('mainnet').toString(),requestId}]){if(value?.address===destination&&value?.requestId===requestId)continue;assert.throws(()=>validateClaim(value,sdk));}
 for(const extra of [{amount:1},{fee:1},{destination:outsider},{network:'mainnet'},{privateKey:'never accept'}])assert.throws(()=>validateClaim({address:destination,requestId,...extra},sdk));
 const scriptAddress=sdk.addressFromScriptPublicKey(sdk.payToScriptHashScript('51'),'testnet-10').toString();assert.throws(()=>validateClaim({address:scriptAddress,requestId},sdk));
});

test('faucet rejects extra outputs, too many inputs and self-funding destinations',()=>{
 const plan=signed(),raw=JSON.parse(plan.transaction.serializeToSafeJSON());
 const extra=structuredClone(raw);extra.outputs.push(structuredClone(extra.outputs[0]));assert.throws(()=>validateFaucetPayment(sdk,sdk.Transaction.deserializeFromSafeJSON(JSON.stringify(extra)),options));
 const crowded=structuredClone(raw);while(crowded.inputs.length<9)crowded.inputs.push(structuredClone(crowded.inputs[0]));assert.throws(()=>validateFaucetPayment(sdk,sdk.Transaction.deserializeFromSafeJSON(JSON.stringify(crowded)),options));
 assert.throws(()=>buildFaucetPayment(sdk,{...options,destination:changeAddress,entries:[entry()]}));
});

test('worker journals before submission, reuses a claim, observes change and enforces total cap',async()=>{
 const {readFile}=await import('node:fs/promises');
 const records=new Map();const storage={get:async key=>structuredClone(records.get(key)),put:async values=>{for(const [key,value]of Object.entries(values))records.set(key,structuredClone(value));}};
 let submissions=0,lastTransaction,entries=[entry()],wrongNetwork=false;
 class RpcClient{
  async connect(){} async disconnect(){}
  async getServerInfo(){return {networkId:wrongNetwork?'mainnet':'testnet-10',isSynced:true,hasUtxoIndex:true};}
  async getUtxosByAddresses(){return {entries};}
  async getFeeEstimate(){return {estimate:{priorityBucket:{feerate:100}}};}
  async submitTransaction({transaction}){assert.equal(records.get('state').pending.transactionId,transaction.id,'journal must precede broadcast');submissions++;lastTransaction=transaction;return {transactionId:transaction.id};}
 }
 globalThis.__faucetSecuritySDK={...sdk,default:async()=>{},RpcClient};
 let source=await readFile(new URL('../faucet/worker.mjs',import.meta.url),'utf8');source=source.replace(/^import \* as sdk[^\n]*\n/m,'const sdk=globalThis.__faucetSecuritySDK;\n').replace(/^import wasm[^\n]*\n/m,'const wasm=null;\n').replace("from './policy.mjs'",`from '${new URL('../faucet/policy.mjs',import.meta.url).href}'`);
 try{
  const {FaucetWallet}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
  const wallet=new FaucetWallet({storage},{FAUCET_KEY:(71).toString(16).repeat(32),ENABLED:'true',MAX_CLAIMS:'1',RATE_SALT:'unfunded-fixture-rate-salt'});
  const request=(address=destination,requestId='12345678-1234-4234-8234-123456789abc')=>new Request('https://example.invalid/api/faucet',{method:'POST',headers:{'Content-Type':'application/json','X-Faucet-Client':'fixture'},body:JSON.stringify({address,requestId})});
  const first=await wallet.fetch(request());assert.equal(first.status,202);assert.equal(submissions,1);assert.equal(records.get('state').claims,0);
  const retry=await wallet.fetch(request());assert.equal(retry.status,202);assert.equal(submissions,1,'immediate retry cannot send a second transaction');
  assert.equal((await wallet.fetch(request(outsider))).status,409);
  const originalBytes=lastTransaction.serializeToSafeJSON();
  for(let attempt=2;attempt<=4;attempt++){
   for(const key of ['state','address:'+destination,'id:12345678-1234-4234-8234-123456789abc']){const value=records.get(key);if(key==='state')value.pending.attemptedAt=Date.now()-16000;else value.attemptedAt=Date.now()-16000;}
   const retried=await wallet.fetch(request());assert.equal(retried.status,202);assert.equal(submissions,Math.min(attempt,3));assert.equal(lastTransaction.serializeToSafeJSON(),originalBytes,'retry must use identical signed bytes');
  }
  assert.equal(records.get('state').pending.attempts,3);assert.equal([...records.entries()].find(([key])=>key.startsWith('rate:'))[1].count,1,'retries do not consume another claim allowance');
  const o=lastTransaction.outputs[1];entries=new sdk.UtxoEntries([{outpoint:{transactionId:lastTransaction.id,index:1},amount:o.value,scriptPublicKey:o.scriptPublicKey,blockDaaScore:0n,isCoinbase:false}]).items;
  const accepted=await wallet.fetch(request());assert.equal(accepted.status,200);assert.equal(records.get('state').claims,1);assert.equal(records.get('state').pending,null);
  assert.equal((await wallet.fetch(request(outsider,'22345678-1234-4234-8234-123456789abc'))).status,503);assert.equal(submissions,3);
  wrongNetwork=true;assert.equal((await wallet.fetch(request())).status,503);assert.equal(submissions,3);
 }finally{delete globalThis.__faucetSecuritySDK;}
});

test('faucet CORS admits exact local and temporary origins and rejects unrelated tunnel hosts',async()=>{
 const {readFile}=await import('node:fs/promises');
 let source=await readFile(new URL('../faucet/worker.mjs',import.meta.url),'utf8');
 source=source.replace(/^import \* as sdk[^\n]*\n/m,'const sdk={};\n').replace(/^import wasm[^\n]*\n/m,'const wasm=null;\n').replace("from './policy.mjs'",`from '${new URL('../faucet/policy.mjs',import.meta.url).href}'`);
 const {default:worker}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
 const env={FAUCET:{idFromName(){throw Error('Preflight must not enter the wallet');}}};
 for(const origin of ['https://answered-tear-homepage-spencer.trycloudflare.com','http://127.0.0.1:8904','http://localhost:8904','http://127.0.0.1:8912','http://localhost:8901','https://kaspaexplained.com','https://www.kaspaexplained.com']){
  const response=await worker.fetch(new Request('https://example.invalid/api/faucet',{method:'OPTIONS',headers:{Origin:origin}}),env);
  assert.equal(response.status,204,origin);assert.equal(response.headers.get('Access-Control-Allow-Origin'),origin);assert.equal(response.headers.get('Vary'),'Origin');
 }
 for(const origin of ['https://another-tunnel.trycloudflare.com','http://answered-tear-homepage-spencer.trycloudflare.com','https://answered-tear-homepage-spencer.trycloudflare.com.evil.invalid','https://answered-tear-homepage-spencer.trycloudflare.com:8443','http://127.0.0.1:8905','http://localhost:89040','http://127.0.0.2:8904','http://localhost.evil.invalid:8904','https://localhost:8904','https://evil.invalid','null']){
  const response=await worker.fetch(new Request('https://example.invalid/api/faucet',{method:'OPTIONS',headers:{Origin:origin}}),env);
  assert.equal(response.status,403,origin);assert.equal(response.headers.get('Access-Control-Allow-Origin'),null);const deniedPost=await worker.fetch(new Request('https://example.invalid/api/faucet',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:'{}'}),env);assert.equal(deniedPost.status,403,origin+' POST must not enter wallet');
 }
 let reachedWallet=false;const exactPost=await worker.fetch(new Request('https://example.invalid/api/faucet',{method:'POST',headers:{Origin:'https://answered-tear-homepage-spencer.trycloudflare.com','Content-Type':'application/json'},body:'{}'}),{FAUCET:{idFromName:()=> 'synthetic',get:()=>({fetch:async()=>{reachedWallet=true;return new Response('synthetic routing only',{status:418});}})}});assert(reachedWallet,'Exact temporary host POST passes origin gate to mocked handler');assert.equal(exactPost.status,418);assert.equal(exactPost.headers.get('Access-Control-Allow-Origin'),'https://answered-tear-homepage-spencer.trycloudflare.com');
 const absent=await worker.fetch(new Request('https://example.invalid/api/faucet',{method:'OPTIONS'}),env);assert.equal(absent.status,403);assert.equal(absent.headers.get('Access-Control-Allow-Origin'),null);
});
