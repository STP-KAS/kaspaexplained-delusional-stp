import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {instantiatePublicToken,buildTokenGenesis,tokenNamePayload} from '../src/public-token.mjs';
import {signPublicAssetPlan} from '../src/public-asset-signing.mjs';
import {publicAssetJournal} from '../src/public-asset-recovery.mjs';
import {validatePublicAssetsState,verifiedTokenName} from '../src/public-assets-ui.mjs';
const sdk=createRequire(import.meta.url)('../.cache/upstream/kaspa-wasm32-sdk/nodejs/kaspa');
const templates=JSON.parse(await readFile('.cache/public-templates/templates.json','utf8')).templates;
const key=new sdk.PrivateKey('01'.repeat(32)),owner=key.toPublicKey().toXOnlyPublicKey().toString(),address=key.toAddress('testnet-10').toString();
async function fixture(tokenName){
 const token=instantiatePublicToken(sdk,templates.token,{issuer:owner,cap:1000,state:{owner,quantity:1000,isMinter:true}});
 const utxo=new sdk.UtxoEntries([{outpoint:{transactionId:'aa'.repeat(32),index:0},amount:500000000000n,scriptPublicKey:sdk.payToAddressScript(new sdk.Address(address)),blockDaaScore:0n,isCoinbase:false}]).items[0];
 const plan=buildTokenGenesis(sdk,{fundingUtxos:[utxo],token,tokenName,cellAmount:50000000n,changeAddress:address});
 await signPublicAssetPlan(plan,(tx,index)=>sdk.createInputSignature(tx,index,key));
 return {version:1,collections:[{kind:'token',covenantId:plan.covenantId,...(plan.tokenName?{tokenName:plan.tokenName,nameGenesisId:plan.transaction.id}:{}),identity:{issuer:owner,cap:1000},cells:[{state:token.state,script:token.script,address:token.address,transactionId:plan.transaction.id,index:0,amount:String(plan.transaction.outputs[0].value)}]}],activity:[{journal:publicAssetJournal(plan),attempted:true,submitted:true,observed:true,applied:true}]};
}
test('restored holdings require their exact signed journal output and recheck observations',async()=>{
 const state=await fixture();assert.equal(validatePublicAssetsState(sdk,templates,state,[owner]),state);assert.equal(state.activity[0].observed,false);
});
test('restored holdings reject forged lineage, outpoints, values and duplicate records',async()=>{
 const original=await fixture();
 for(const mutate of [s=>s.collections[0].covenantId='bb'.repeat(32),s=>s.collections[0].cells[0].transactionId='cc'.repeat(32),s=>s.collections[0].cells[0].index=1,s=>s.collections[0].cells[0].amount='40000000',s=>s.activity=[],s=>s.collections.push(structuredClone(s.collections[0])),s=>s.collections[0].cells.push(structuredClone(s.collections[0].cells[0])),s=>s.activity.push(structuredClone(s.activity[0]))]){
  const changed=structuredClone(original);mutate(changed);assert.throws(()=>validatePublicAssetsState(sdk,templates,changed,[owner]),/signed journal|Duplicate/);
 }
});


test('named recovery rejects collection relabeling, missing genesis and competing genesis records',async()=>{
 const original=await fixture('Apple');
 for(const mutate of [s=>s.collections[0].tokenName='Other',s=>delete s.collections[0].tokenName,s=>s.collections[0].nameGenesisId='ff'.repeat(32),s=>delete s.collections[0].nameGenesisId,s=>s.activity=[]]){const state=structuredClone(original);mutate(state);assert.throws(()=>validatePublicAssetsState(sdk,templates,state,[owner]),/token name|signed journal/);}
 const competing=structuredClone(original),j=competing.activity[0].journal,tx=sdk.Transaction.deserializeFromSafeJSON(j.transaction);tx.payload=tokenNamePayload('Other');tx.finalize();competing.activity.push({...competing.activity[0],journal:{...j,id:tx.id,transaction:tx.serializeToSafeJSON()}});assert.throws(()=>validatePublicAssetsState(sdk,templates,competing,[owner]),/Duplicate token genesis/);
});
test('restored names stay unverified until the exact genesis transaction is observed at the node',async()=>{
 const state=await fixture('Apple');state.activity[0].acceptingBlock='bb'.repeat(32);assert.equal(verifiedTokenName(state,state.collections[0]),'Apple');
 validatePublicAssetsState(sdk,templates,state,[owner]);assert.equal(verifiedTokenName(state,state.collections[0]),undefined);
 // Recovery reconstructs signatures structurally; recomputing the id after payload tampering is not proof of network acceptance.
 const j=state.activity[0].journal,tx=sdk.Transaction.deserializeFromSafeJSON(j.transaction);tx.payload=tokenNamePayload('Other');tx.finalize();j.transaction=tx.serializeToSafeJSON();j.id=tx.id;state.collections[0].tokenName='Other';state.collections[0].nameGenesisId=tx.id;state.collections[0].cells[0].transactionId=tx.id;
 validatePublicAssetsState(sdk,templates,state,[owner]);assert.equal(verifiedTokenName(state,state.collections[0]),undefined);
 state.activity[0].outputsObserved=true;assert.equal(verifiedTokenName(state,state.collections[0]),undefined);
});
