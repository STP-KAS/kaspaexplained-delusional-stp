import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {instantiatePublicContract,buildPublicFunding,buildPublicSpend,signPublicPlan,validatePublicPlan} from '../src/public-contracts.mjs';
import {derivePublicRecoveryPlan} from '../src/public-recovery.mjs';
const sdk=createRequire(import.meta.url)('../.cache/upstream/kaspa-wasm32-sdk/nodejs/kaspa');
const templates=JSON.parse(await readFile('.cache/public-templates/templates.json','utf8')).templates;
const keys=[1,2,3].map(n=>new sdk.PrivateKey(n.toString(16).padStart(2,'0').repeat(32))),keysPublic=keys.map(k=>k.toPublicKey().toXOnlyPublicKey().toString());
const makeUtxo=(script,amount=20000000n)=>new sdk.UtxoEntries([{outpoint:{transactionId:'ab'.repeat(32),index:0},amount,scriptPublicKey:script,blockDaaScore:0n,isCoinbase:false}]).items[0];
const state=kind=>{const [a,b,c]=keysPublic,base={principal:kind==='proof'?50000000:20000000,maxFee:kind==='proof'?20000000:1000000};return kind==='escrow'?{...base,buyer:a,seller:b,arbiter:c,refundAfter:1800000000000}:kind==='treasury'?{...base,memberA:a,memberB:b,memberC:c}:kind==='prediction'?{...base,yesOwner:a,noOwner:b,oracle:c,resolveAfter:1800000000000,refundAfter:1800000120000}:{...base,owner:a};};
const sign=plan=>signPublicPlan(plan,(tx,index,{publicKey})=>sdk.createInputSignature(tx,index,keys[keysPublic.indexOf(publicKey)]));
const journal=plan=>({id:plan.transaction.id,transaction:plan.transaction.serializeToSafeJSON(),funding:Boolean(plan.funding)});
test('exact signed recovery restores all public exits and large owned funding change',async()=>{
 for(const kind of ['escrow','treasury','prediction','proof']){
  const contract=instantiatePublicContract(sdk,templates[kind],state(kind));
  const entries=kind==='escrow'?[['release',{}],['resolve',{paySeller:false}],['refund',{}]]:kind==='treasury'?[['spend',{pair:2}]]:kind==='prediction'?[['settle',{yesWins:true}],['refund',{refundBy:'no'}]]:[['verify',{}]];
  const funding=buildPublicFunding(sdk,{contract,fundingUtxos:[makeUtxo(sdk.payToAddressScript(keys[0].toAddress('testnet-10')),500000000000n)],owner:keysPublic[0]});await sign(funding);
  for(const plan of [funding,...entries.map(([entry,parameters])=>buildPublicSpend(sdk,{contract,utxo:makeUtxo(sdk.payToScriptHashScript(contract.script),BigInt(contract.state.principal)),entry,parameters,pastMedianTime:1800000120000}))]){
   if(plan!==funding)await sign(plan);const bytes=plan.transaction.serializeToSafeJSON();
   const recovered=derivePublicRecoveryPlan(sdk,{contract,journal:journal(plan),keysPublic});assert.equal(recovered.transaction.serializeToSafeJSON(),bytes);assert.equal(recovered.recovery,true);validatePublicPlan(recovered);
  }
 }
});
test('recovery rejects identity, destination, fee and unsigned-data tampering',async()=>{
 const contract=instantiatePublicContract(sdk,templates.escrow,state('escrow'));
 const plan=buildPublicSpend(sdk,{contract,utxo:makeUtxo(sdk.payToScriptHashScript(contract.script)),entry:'release'});await sign(plan);const saved=journal(plan);
 assert.throws(()=>derivePublicRecoveryPlan(sdk,{contract,journal:{...saved,id:'ff'.repeat(32)},keysPublic}),/identity/);
 for(const mutate of [tx=>{tx.outputs[0].value-=1n;},tx=>{tx.outputs[0].scriptPublicKey=sdk.payToAddressScript(keys[0].toAddress('testnet-10'));},tx=>{tx.inputs[0].signatureScript='';},tx=>{tx.lockTime=9n;}]){
  const tx=sdk.Transaction.deserializeFromSafeJSON(saved.transaction);mutate(tx);tx.finalize();assert.throws(()=>derivePublicRecoveryPlan(sdk,{contract,journal:{...saved,id:tx.id,transaction:tx.serializeToSafeJSON()},keysPublic}));
 }
 const recovered=derivePublicRecoveryPlan(sdk,{contract,journal:{...saved,outputs:[{amount:'999999999'}],observed:true},keysPublic});assert.equal(recovered.transaction.id,saved.id);
});

 test('funding recovery recognizes each controlled role as the source owner',async()=>{
 const contract=instantiatePublicContract(sdk,templates.escrow,state('escrow'));
 for(let index=0;index<3;index++){
  const plan=buildPublicFunding(sdk,{contract,fundingUtxos:[makeUtxo(sdk.payToAddressScript(keys[index].toAddress('testnet-10')),500000000000n)],owner:keysPublic[index]});await sign(plan);
  const recovered=derivePublicRecoveryPlan(sdk,{contract,journal:journal(plan),keysPublic});assert.equal(recovered.signers[0],keysPublic[index]);assert.equal(recovered.transaction.serializeToSafeJSON(),plan.transaction.serializeToSafeJSON());
 }
});
