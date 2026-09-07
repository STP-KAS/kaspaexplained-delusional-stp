import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {instantiatePublicToken,buildTokenGenesis,buildTokenMove,buildTokenExchange,normalizeTokenName,tokenNamePayload,readTokenNamePayload} from '../src/public-token.mjs';
import {instantiatePublicReceipt,buildBackedGenesis,buildBackedMove} from '../src/public-receipt.mjs';
import {signPublicAssetPlan,buildPublicPayment,validatePublicAssetPlan} from '../src/public-asset-signing.mjs';
import {publicAssetJournal,derivePublicAssetRecoveryPlan} from '../src/public-asset-recovery.mjs';
const sdk=createRequire(import.meta.url)('../.cache/upstream/kaspa-wasm32-sdk/nodejs/kaspa');
const templates=JSON.parse(await readFile('.cache/public-templates/templates.json','utf8')).templates;
const keys=[1,2,3,4].map(n=>new sdk.PrivateKey(n.toString(16).padStart(2,'0').repeat(32))),keysPublic=keys.map(k=>k.toPublicKey().toXOnlyPublicKey().toString()),addresses=keys.map(k=>k.toAddress('testnet-10').toString());
const utxo=(id,index,value,script,cov)=>new sdk.UtxoEntries([{outpoint:{transactionId:id,index},amount:BigInt(value),scriptPublicKey:script,blockDaaScore:0n,isCoinbase:false,...(cov?{covenant_id:cov}:{})}]).items[0];
const funding=(tag=10,value=500000000000n,owner=0)=>utxo(tag.toString(16).padStart(2,'0').repeat(32),0,value,sdk.payToAddressScript(new sdk.Address(addresses[owner])));
const from=(p,index=0)=>{const o=p.transaction.outputs[index];return utxo(p.transaction.id,index,o.value,o.scriptPublicKey,o.covenant?.covenantId.toString());};
const token=(owner,quantity,isMinter=false)=>instantiatePublicToken(sdk,templates.token,{issuer:keysPublic[0],cap:1000,state:{owner:keysPublic[owner],quantity,isMinter}});
const receipt=(owner,quantity)=>instantiatePublicReceipt(sdk,templates.receipt,{series:'aa'.repeat(32),maxFee:3000000,state:{owner:keysPublic[owner],quantity}});
async function checked(plan){await signPublicAssetPlan(plan,(tx,index,s)=>sdk.createInputSignature(tx,index,keys[keysPublic.indexOf(s.owner)]));const journal=publicAssetJournal(plan),recovered=derivePublicAssetRecoveryPlan(sdk,{templates,journal,keysPublic});assert.equal(recovered.transaction.serializeToSafeJSON(),plan.transaction.serializeToSafeJSON());assert.equal(validatePublicAssetPlan(recovered).complete,true);return plan;}
test('exact asset recovery covers token genesis mint transfer split merge burn and exchange',async()=>{
 const initial=token(0,1000,true),minter=token(0,900,true),holder=token(1,100),recipient=token(2,100),a=token(1,40),b=token(2,60);
 const genesis=await checked(buildTokenGenesis(sdk,{fundingUtxos:[funding()],token:initial,cellAmount:30000000n,fee:1000000n,changeAddress:addresses[0]}));
 const minted=await checked(buildTokenMove(sdk,{tokenInputs:[{utxo:from(genesis),token:initial}],successors:[{token:minter,amount:14500000n},{token:holder,amount:14500000n}],operation:1,fee:1000000n}));
 await checked(buildTokenMove(sdk,{tokenInputs:[{utxo:from(minted,1),token:holder}],successors:[{token:recipient,amount:13500000n}],operation:0,fee:1000000n}));
 const split=await checked(buildTokenMove(sdk,{tokenInputs:[{utxo:from(minted,1),token:holder}],successors:[{token:a,amount:16750000n},{token:b,amount:16750000n}],operation:0,fundingUtxos:[funding(11,20000000n)],fee:1000000n}));
 await checked(buildTokenMove(sdk,{tokenInputs:[{utxo:from(split),token:a},{utxo:from(split,1),token:b}],successors:[{token:recipient,amount:32000000n}],operation:0,fee:1500000n}));
 await checked(buildTokenMove(sdk,{tokenInputs:[{utxo:from(minted),token:minter},{utxo:from(minted,1),token:holder}],successors:[{token:minter,amount:27500000n}],operation:2,fee:1500000n}));
 await checked(buildTokenExchange(sdk,{sellerToken:{utxo:from(minted,1),token:holder},buyerFundingUtxos:[funding(12,20000000n,2)],buyerToken:recipient,price:8000000n,sellerAddress:addresses[1],buyerChangeAddress:addresses[2],fee:1000000n}));
});
test('receipt recovery covers full backing through split merge and partial/full redemption',async()=>{
 const full=receipt(0,100000000),other=receipt(1,100000000),a=receipt(0,40000000),b=receipt(1,60000000),remaining=receipt(0,60000000);
 const genesis=await checked(buildBackedGenesis(sdk,{fundingUtxos:[funding(20,500000000000n,3)],receipt:full,fee:1500000n,sponsorPublicKey:keysPublic[3]}));
 const move=(inputs,successors,operation='transfer')=>buildBackedMove(sdk,{receiptInputs:inputs,successors,operation,sponsorUtxo:funding(21,50000000n,3),sponsorPublicKey:keysPublic[3],fee:1500000n});
 await checked(move([{utxo:from(genesis),receipt:full}],[other]));
 const split=await checked(move([{utxo:from(genesis),receipt:full}],[a,b]));
 await checked(move([{utxo:from(split),receipt:a},{utxo:from(split,1),receipt:b}],[full]));
 await checked(move([{utxo:from(genesis),receipt:full}],[remaining],'redeem'));
 await checked(move([{utxo:from(genesis),receipt:full}],[],'redeem'));
});
test('payment recovery supports owned large change and rejects manipulated identity metadata and signatures',async()=>{
 const plan=await checked(buildPublicPayment(sdk,{fundingUtxos:[funding()],owner:keysPublic[0],recipient:keysPublic[1],amount:30000000n})),saved=publicAssetJournal(plan);
 assert.throws(()=>derivePublicAssetRecoveryPlan(sdk,{templates,journal:{...saved,id:'ff'.repeat(32)},keysPublic}),/identity/);
 assert.throws(()=>derivePublicAssetRecoveryPlan(sdk,{templates,journal:{...saved,unknown:true},keysPublic}),/Unknown/);
 assert.throws(()=>derivePublicAssetRecoveryPlan(sdk,{templates,journal:saved,keysPublic:keysPublic.slice(1)}),/owners/);
 const tx=sdk.Transaction.deserializeFromSafeJSON(saved.transaction);tx.inputs[0].signatureScript=tx.inputs[0].signatureScript.slice(0,-2)+'02';tx.finalize();assert.throws(()=>derivePublicAssetRecoveryPlan(sdk,{templates,journal:{...saved,id:tx.id,transaction:tx.serializeToSafeJSON()},keysPublic}),/SIGHASH_ALL/);
 const unsigned=buildPublicPayment(sdk,{fundingUtxos:[funding()],owner:keysPublic[0],recipient:keysPublic[1],amount:30000000n});assert.throws(()=>publicAssetJournal(unsigned),/Every signature/);
});

test('native split signs one exact two-recipient transaction and reconstructs its journal',async()=>{
 const recipients=[{recipient:keysPublic[1],amount:20000000n},{recipient:keysPublic[2],amount:30000000n}];
 const plan=await checked(buildPublicPayment(sdk,{fundingUtxos:[funding(90)],owner:keysPublic[0],recipients}));
 assert.equal(plan.transaction.outputs.length,3);assert.equal(plan.transaction.outputs[0].value,20000000n);assert.equal(plan.transaction.outputs[1].value,30000000n);assert(BigInt(plan.fee)<=1000000n);
 assert.equal(plan.transaction.outputs[2].scriptPublicKey.script,sdk.payToAddressScript(new sdk.Address(addresses[0])).script);
 const journal=publicAssetJournal(plan);assert.equal(journal.payment.recipients.length,2);
 for(const mutate of [j=>j.payment.recipients.reverse(),j=>j.payment.recipients[0].amount='19999999',j=>j.payment.recipients[0].recipient=keysPublic[3],j=>j.payment.amount='1',j=>delete j.payment]){const changed=structuredClone(journal);mutate(changed);assert.throws(()=>derivePublicAssetRecoveryPlan(sdk,{templates,journal:changed,keysPublic}));}
 plan.transaction.outputs[0].value-=1n;plan.transaction.outputs[1].value+=1n;assert.throws(()=>validatePublicAssetPlan(plan),/changed/);
});
test('native split rejects duplicate recipients, total cap, invalid amounts and excess fee',()=>{
 const options={fundingUtxos:[funding(91)],owner:keysPublic[0]},pair=(a,b)=>[{recipient:keysPublic[1],amount:a},{recipient:keysPublic[2],amount:b}];
 for(const recipients of [pair(0n,1n),pair(-1n,1n),pair(50000001n,50000000n),[{recipient:keysPublic[1],amount:1n},{recipient:keysPublic[1].toUpperCase(),amount:1n}]])assert.throws(()=>buildPublicPayment(sdk,{...options,recipients}));
 assert.throws(()=>buildPublicPayment(sdk,{...options,recipients:pair(20000000n,30000000n),feeRate:100000}),/fee limit/);
 assert.throws(()=>buildPublicPayment(sdk,{...options,recipients:pair(20000000n,30000000n),recipient:keysPublic[1],amount:1n}));
});


test('named genesis binds canonical public metadata and includes every payload byte in mass',async()=>{
 const options={fundingUtxos:[funding(94)],token:token(0,1000,true),cellAmount:50000000n,changeAddress:addresses[0]};
 const unnamed=buildTokenGenesis(sdk,options),named=buildTokenGenesis(sdk,{...options,tokenName:'  Cafe\u0301  garden  '});
 assert.equal(named.tokenName,'Café garden');assert.equal(readTokenNamePayload(named.transaction.payload),'Café garden');
 const bytes=named.transaction.payload.length/2;assert.equal(named.mass.estimatedBytes-unnamed.mass.estimatedBytes,bytes);assert.equal(named.mass.computeMass-unnamed.mass.computeMass,bytes);assert.equal(named.mass.transientMass-unnamed.mass.transientMass,bytes*4);assert.equal(named.mass.storageMass,unnamed.mass.storageMass);assert.equal(BigInt(named.fee)-BigInt(unnamed.fee),BigInt(bytes*100));
 await checked(named);const recovered=derivePublicAssetRecoveryPlan(sdk,{templates,journal:publicAssetJournal(named),keysPublic});assert.equal(recovered.tokenName,'Café garden');
 const before=named.transaction.inputs[0].signatureScript;const other=buildTokenGenesis(sdk,{...options,tokenName:'Other garden'});await checked(other);assert.notEqual(other.transaction.inputs[0].signatureScript,before);
 named.transaction.payload=tokenNamePayload('Different');assert.throws(()=>validatePublicAssetPlan(named),/changed/);
});
test('token name codec bounds Unicode, rejects control/noncanonical payloads, and preserves literal markup',()=>{
 assert.equal(normalizeTokenName('  Test   coins  '),'Test coins');assert.equal(readTokenNamePayload(tokenNamePayload('<img src=x onerror=alert(1)>')),'<img src=x onerror=alert(1)>');assert.equal(readTokenNamePayload(''),undefined);
 for(const name of ['', ' ', 'a'.repeat(41), '😀'.repeat(31), 'a\nname', 'a\u202ename', '\ud800'])assert.throws(()=>tokenNamePayload(name));
 for(const payload of ['ff','00','abc','aa'.repeat(257),Buffer.from(JSON.stringify({protocol:'other',version:1,name:'Test'})).toString('hex'),Buffer.from(JSON.stringify({protocol:'kaspa-explained-token',version:1,name:' Test '})).toString('hex'),Buffer.from(JSON.stringify({protocol:'kaspa-explained-token',version:1,name:'Test',extra:true})).toString('hex')])assert.throws(()=>readTokenNamePayload(payload));
});
