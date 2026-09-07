// Never-funded local fixtures: native signatures, separate covenant groups, Rust VM.
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
import {instantiateV4,buildV4Genesis,publicV4Journal} from '../src/public-v4-protocol.mjs';
import {buildV4Extra} from '../src/public-v4-extra.mjs';
import {buildV4Composed,publicV4ComposedJournal,derivePublicV4ComposedRecoveryPlan} from '../src/public-v4-composed.mjs';
import {signPublicAssetPlan,assetSignatureScript,validatePublicAssetPlan,kaspirePublicAssetSigningRequest,acceptKaspirePublicAssetSignature} from '../src/public-asset-signing.mjs';
import {pushPublicData,publicTransactionMass} from '../src/public-contracts.mjs';
const root=resolve(import.meta.dirname,'..'),sdk=createRequire(import.meta.url)('../.cache/upstream/kaspa-wasm32-sdk/nodejs/kaspa');
const templates=JSON.parse(await readFile(resolve(root,'.cache/public-templates/templates.json'))).templates;
const keys=[1,2,3,4].map(n=>new sdk.PrivateKey(n.toString(16).padStart(2,'0').repeat(32))),owners=keys.map(k=>k.toPublicKey().toXOnlyPublicKey().toString()),addresses=keys.map(k=>k.toAddress('testnet-10').toString()),worldId='44'.repeat(32);
const utxo=(id,index,value,spk,covenant)=>new sdk.UtxoEntries([{outpoint:{transactionId:id,index},amount:BigInt(value),scriptPublicKey:spk,blockDaaScore:0n,isCoinbase:false,...(covenant?{covenant_id:covenant}:{})}]).items[0];
const funding=tag=>utxo(tag.toString(16).padStart(2,'0').repeat(32),0,500000000n,sdk.payToAddressScript(new sdk.Address(addresses[3])));
const from=(plan,index,state,kind)=>({asset:instantiateV4(sdk,templates[kind],kind,state),utxo:utxo(plan.transaction.id,index,plan.transaction.outputs[index].value,plan.transaction.outputs[index].scriptPublicKey,plan.transaction.outputs[index].covenant.covenantId.toString())});

import {test} from 'node:test';
import {validatePublicV4State,derivePublicV4Cells} from '../src/public-v4-ui.mjs';
const bundleStates=[0,1,2].map(item=>({worldId,owner:owners[0],seller:owners[0],buyer:owners[1],item,price:5000000,maxFee:3000000}));
const bundle=buildV4Genesis(sdk,{kind:'bundle',templates,states:bundleStates,fundingUtxos:[funding(101)],cellAmounts:[25000000n,25000000n,25000000n],changeAddress:addresses[3]});
const policy={worldId,marketId:bundle.covenantId,owner:owners[1],recovery:owners[2],payee:owners[0],limit:5000000,maxFee:3000000};
const agent=buildV4Genesis(sdk,{kind:'agent',templates,states:[policy],fundingUtxos:[funding(102)],cellAmounts:[25000000n],changeAddress:addresses[3]});
for(const plan of [bundle,agent])await signPublicAssetPlan(plan,(tx,index,signer)=>sdk.createInputSignature(tx,index,keys[owners.indexOf(signer.owner)]));
const composed=buildV4Composed(sdk,{templates,bundleCells:bundleStates.map((s,i)=>from(bundle,i,s,'bundle')),agentCell:from(agent,0,policy,'agent')});
for(const plan of [composed])await signPublicAssetPlan(plan,(tx,index,signer)=>sdk.createInputSignature(tx,index,keys[owners.indexOf(signer.owner)]));
const record=p=>({journal:p.kind==='composed'?publicV4ComposedJournal(p):publicV4Journal(p),checkpoint:'aa'.repeat(32),applied:true,observed:true,outputsObserved:true,acceptingBlock:'bb'.repeat(32)});
test('mixed receipt returns three market outputs and agent output four independent of history order',()=>{
 for(const activity of [[record(bundle),record(agent),record(composed)],[record(composed),record(agent),record(bundle)]]){
 const market=derivePublicV4Cells(sdk,templates,activity,owners,'bundle'),budget=derivePublicV4Cells(sdk,templates,activity,owners,'agent');
 assert.equal(market.length,3);assert.deepEqual(market.map(c=>c.index),[0,1,2]);assert.ok(market.every(c=>c.transactionId===composed.transaction.id));assert.equal(budget.length,1);assert.equal(budget[0].index,4);assert.equal(budget[0].amount,composed.transaction.outputs[4].value);
 }
});
test('restore clears cached chain claims until fresh observation',()=>{
 const value=validatePublicV4State(sdk,templates,{version:1,activity:[record(bundle),record(agent),record(composed)]},owners);
 assert.ok(value.activity.every(r=>!r.applied&&!r.observed&&!r.outputsObserved&&r.acceptingBlock===null));assert.deepEqual(derivePublicV4Cells(sdk,templates,value.activity,owners,'agent'),[]);
});
test('duplicate transaction journals cannot restore twice',()=>assert.throws(()=>validatePublicV4State(sdk,templates,{version:1,activity:[record(bundle),record(bundle)]},owners),/Duplicate/));
