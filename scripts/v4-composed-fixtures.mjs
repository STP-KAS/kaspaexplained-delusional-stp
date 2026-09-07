// Never-funded local fixtures: native signatures, separate covenant groups, Rust VM.
import {createRequire} from 'node:module';
import {mkdir,readFile,writeFile,copyFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
import {instantiateV4,buildV4Genesis} from '../src/public-v4-protocol.mjs';
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
const fixtures=[];
function exportTx(tx){return {version:tx.version,payload:tx.payload,lockTime:String(tx.lockTime),storageMass:String(tx.storageMass),inputs:tx.inputs.map(i=>({transactionId:i.previousOutpoint.transactionId,index:i.previousOutpoint.index,sequence:String(i.sequence),computeBudget:i.computeBudget,signatureScript:i.signatureScript,amount:String(i.utxo.amount),scriptPublicKey:i.utxo.entry.scriptPublicKey.script,covenantId:i.utxo.entry.covenantId?.toString()??null})),outputs:tx.outputs.map(o=>({value:String(o.value),scriptPublicKey:o.scriptPublicKey.script,covenant:o.covenant?{authorizingInput:o.covenant.authorizingInput,covenantId:o.covenant.covenantId.toString()}:null}))};}
async function record(name,p,{valid=true,mutate,wrongSigner=-1}={}){
 if(mutate)mutate(p);
 if(valid)await signPublicAssetPlan(p,(tx,index,signer)=>sdk.createInputSignature(tx,index,keys[owners.indexOf(signer.owner)]));
 else{
  for(let index=0;index<p.transaction.inputs.length;index++){
   const signer=p.signers[index],raw=sdk.createInputSignature(p.transaction,index,keys[index===wrongSigner?3:owners.indexOf(signer.owner)]).slice(2);
   const group=p.groups?.find(g=>index>=g.inputStart&&index<g.inputStart+g.inputCount);
   p.transaction.inputs[index].signatureScript=signer.kind==='native'?pushPublicData(raw):assetSignatureScript(p.tokens[index],group?.states??p.states,group?.operation??p.operation,null,raw,group?index===group.inputStart:index===0);
  }
  p.transaction.finalize();
 }
 const mass=publicTransactionMass(p.transaction);p.transaction.storageMass=BigInt(mass.storageMass);
 fixtures.push({name,valid,transaction:exportTx(p.transaction),mass});return p;
}
const bundleStates=[0,1,2].map(item=>({worldId,owner:owners[0],seller:owners[0],buyer:owners[1],item,price:5000000,maxFee:3000000}));
const bundle=await record('bundle-genesis',buildV4Genesis(sdk,{kind:'bundle',templates,states:bundleStates,fundingUtxos:[funding(101)],cellAmounts:[25000000n,25000000n,25000000n],changeAddress:addresses[3]}));
const policy={worldId,marketId:bundle.covenantId,owner:owners[1],recovery:owners[2],payee:owners[0],limit:5000000,maxFee:3000000};
const agent=await record('agent-genesis',buildV4Genesis(sdk,{kind:'agent',templates,states:[policy],fundingUtxos:[funding(102)],cellAmounts:[25000000n],changeAddress:addresses[3]}));
const agentCell=from(agent,0,policy,'agent'),bundleCells=bundleStates.map((s,i)=>from(bundle,i,s,'bundle'));
const pay=()=>buildV4Extra(sdk,{kind:'agent',action:'pay',templates,cells:[agentCell],payment:5000000});
await record('agent-approved-payment',pay());
await record('agent-revoke-by-recovery',buildV4Extra(sdk,{kind:'agent',action:'revoke',templates,cells:[agentCell]}));
await record('reject-agent-overspend',pay(),{valid:false,mutate:p=>{p.transaction.outputs[1].value++;p.transaction.outputs[0].value--;}});
await record('reject-agent-wrong-payee',pay(),{valid:false,mutate:p=>{p.transaction.outputs[1].scriptPublicKey=sdk.payToAddressScript(new sdk.Address(addresses[2]));}});
await record('reject-agent-revoke-with-spending-key',buildV4Extra(sdk,{kind:'agent',action:'revoke',templates,cells:[agentCell]}),{valid:false,mutate:p=>{p.signers[0].owner=owners[1];}});
const purchase=()=>buildV4Composed(sdk,{templates,bundleCells,agentCell});
const composed=await record('composed-agent-market-purchase',purchase());
const journal=publicV4ComposedJournal(composed),recovered=derivePublicV4ComposedRecoveryPlan(sdk,{templates,journal,keysPublic:owners});assert.equal(recovered.transaction.serializeToSafeJSON(),composed.transaction.serializeToSafeJSON());
const wallet=purchase();for(const [index,signer]of wallet.signers.entries()){
 const request=kaspirePublicAssetSigningRequest(wallet,index),tx=sdk.Transaction.deserializeFromSafeJSON(request.params.psktTransactionJson),group=wallet.groups.find(g=>index>=g.inputStart&&index<g.inputStart+g.inputCount),raw=sdk.createInputSignature(tx,index,keys[owners.indexOf(signer.owner)]).slice(2);
 tx.inputs[index].signatureScript=assetSignatureScript(wallet.tokens[index],group.states,group.operation,null,raw,index===group.inputStart);acceptKaspirePublicAssetSignature(sdk,wallet,index,tx.serializeToSafeJSON());
}assert.equal(validatePublicAssetPlan(wallet).complete,true);
const changed=purchase();changed.groups[1].operation=0;assert.throws(()=>validatePublicAssetPlan(changed),/changed/);
await record('reject-composed-underpayment',purchase(),{valid:false,mutate:p=>{p.transaction.outputs[3].value--;p.transaction.outputs[4].value++;}});
await record('reject-composed-wrong-payee',purchase(),{valid:false,mutate:p=>{p.transaction.outputs[3].scriptPublicKey=sdk.payToAddressScript(new sdk.Address(addresses[2]));}});
await record('reject-composed-agent-signature',purchase(),{valid:false,wrongSigner:3});
await record('reject-composed-seller-delegate-signature',purchase(),{valid:false,wrongSigner:1});
await record('reject-composed-price-exceeds-policy',purchase(),{valid:false,mutate:p=>{p.transaction.outputs[3].value++;p.transaction.outputs[4].value--;}});
await record('reject-composed-rebind-budget-output',purchase(),{valid:false,mutate:p=>{p.transaction.outputs[4].covenant.authorizingInput=0;}});
await record('reject-composed-change-voucher-owner',purchase(),{valid:false,mutate:p=>{const state={...p.states[0],owner:owners[2]};p.groups[0].states[0]=state;p.transaction.outputs[0].scriptPublicKey=sdk.payToScriptHashScript(instantiateV4(sdk,templates.bundle,'bundle',state).script);}});
const vaultState={worldId,owner:owners[0],recovery:owners[2],recipient:owners[1],delayDaa:100,maxFee:3000000,pending:false};
const vault=await record('vault-genesis',buildV4Genesis(sdk,{kind:'vault',templates,states:[vaultState],fundingUtxos:[funding(103)],cellAmounts:[50000000n],changeAddress:addresses[3]})),vaultCell=from(vault,0,vaultState,'vault');
const prepared=await record('vault-prepare',buildV4Extra(sdk,{kind:'vault',action:'prepare',templates,cells:[vaultCell]})),pendingCell=from(prepared,0,prepared.states[0],'vault');
const release=()=>buildV4Extra(sdk,{kind:'vault',action:'release',templates,cells:[pendingCell]});
await record('vault-release-required-sequence',release());
await record('vault-cancel-by-recovery',buildV4Extra(sdk,{kind:'vault',action:'cancel',templates,cells:[pendingCell]}));
await record('reject-vault-insufficient-sequence',release(),{valid:false,mutate:p=>{p.transaction.inputs[0].sequence=99n;}});
await record('reject-vault-wrong-recipient',release(),{valid:false,mutate:p=>{p.transaction.outputs[0].scriptPublicKey=sdk.payToAddressScript(new sdk.Address(addresses[2]));}});
const dir=resolve(root,'.cache/v4-composed-fixtures');await mkdir(dir,{recursive:true});await writeFile(resolve(dir,'transactions.json'),JSON.stringify({network:'testnet-10',unfunded:true,fixtures},null,2));console.log(JSON.stringify({fixtures:fixtures.length,valid:fixtures.filter(f=>f.valid).length,invalid:fixtures.filter(f=>!f.valid).length,composedFee:composed.fee,recovery:'exact',walletGroups:'both leaders verified'}));
if(process.argv.includes('--check-vm')){
 const upstream=resolve(root,'.cache/upstream/silverscript');assert.equal(execFileSync('git',['rev-parse','HEAD'],{cwd:upstream,encoding:'utf8'}).trim(),'c7d17a15ac88610d013ec9ffffa9520aeb69929b');await copyFile(resolve(root,'tests/public_v4_composed_vm.rs'),resolve(upstream,'silverscript-lang/tests/kaspa_explained_v4_composed.rs'));execFileSync('cargo',['test','-p','silverscript-lang','--test','kaspa_explained_v4_composed','--locked','--','--nocapture'],{cwd:upstream,stdio:'inherit',env:{...process.env,KE_V4_COMPOSED_FIXTURES:resolve(dir,'transactions.json')}});
}
