// Build-only compiler: the deployed browser receives artifacts, never a compiler service.
import {createRequire} from 'node:module';
import {mkdir,readFile,writeFile,mkdtemp,rm,copyFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
import {applicationSpec} from './application-fixtures.mjs';
import {v4TemplateSpecs} from './v4-template-specs.mjs';
import {instantiatePublicContract,buildPublicFunding,buildPublicSpend,signPublicPlan,publicTransactionMass,kaspirePublicSigningRequest,acceptKaspirePublicSignature,publicUnlockScript,validatePublicPlan} from '../src/public-contracts.mjs';
const root=resolve(import.meta.dirname,'..');process.chdir(root);
const sdk=createRequire(import.meta.url)('../.cache/upstream/kaspa-wasm32-sdk/nodejs/kaspa');
const kinds={escrow:['application-escrow','PublicEscrow',16],treasury:['shared-treasury','PublicTreasury',24],prediction:['prediction-escrow','PublicPrediction',24],proof:['proof-payout','PublicProof',1800]};
const output=resolve(root,'.cache/public-templates');await mkdir(output,{recursive:true});
const keys=[1,2,3,5,6,7,8].map(n=>new sdk.PrivateKey(n.toString(16).padStart(2,'0').repeat(32)));
const publicKeys=keys.map(k=>k.toPublicKey().toXOnlyPublicKey().toString());
const compile=async(file,args)=>{
 const temporary=await mkdtemp(resolve(output,'compile-'));
 try{await writeFile(resolve(temporary,'args.json'),JSON.stringify(args));execFileSync(resolve(root,'.cache/upstream/silverc'),[resolve(root,'contracts/public',file+'.sil'),'--constructor-args',resolve(temporary,'args.json'),'-o',resolve(temporary,'artifact.json')],{stdio:'pipe'});return JSON.parse(await readFile(resolve(temporary,'artifact.json'),'utf8'));}
 finally{await rm(temporary,{recursive:true,force:true});}
};
const stateFor=(kind,p,now,principal)=>{
 const common={principal,maxFee:kind==='proof'?20000000:1000000};
 if(kind==='escrow')return {buyer:p[0],seller:p[1],arbiter:p[2],refundAfter:now+240000,...common};
 if(kind==='treasury')return {memberA:p[0],memberB:p[1],memberC:p[2],...common};
 if(kind==='prediction')return {yesOwner:p[0],noOwner:p[1],oracle:p[2],resolveAfter:now+120000,refundAfter:now+240000,...common};
 return {owner:p[0],...common};
};
function exportTx(tx){return {version:tx.version,lockTime:String(tx.lockTime),storageMass:String(tx.storageMass),inputs:tx.inputs.map(i=>({transactionId:i.previousOutpoint.transactionId,index:i.previousOutpoint.index,sequence:String(i.sequence),computeBudget:i.computeBudget,signatureScript:i.signatureScript,amount:String(i.utxo.amount),scriptPublicKey:i.utxo.entry.scriptPublicKey.script})),outputs:tx.outputs.map(o=>({value:String(o.value),scriptPublicKey:o.scriptPublicKey.script}))};}
function utxo(tag,value,script){return new sdk.UtxoEntries([{outpoint:{transactionId:tag.toString(16).padStart(2,'0').repeat(32),index:0},amount:BigInt(value),scriptPublicKey:script,blockDaaScore:0n,isCoinbase:false}]).items[0];}
const templates={},fixtures=[];
for(const [kind,[file,contractName,computeBudget]] of Object.entries(kinds)){
 const principal=kind==='proof'?50000000:20000000;
 const spec=await applicationSpec(kind,{publicKeys:publicKeys.slice(0,3),now:1800000000000,amount:principal});if(kind==='proof')spec.args.at(-1).value=20000000;
 const artifact=await compile(file,spec.args);const template={version:1,network:'testnet-10',kind,contractName,computeBudget,artifact,...(spec.proofFixture?{proofFixture:spec.proofFixture}:{})};templates[kind]=template;
 // Different keys and times prove this is a real state patch, not the build fixture.
 const p=publicKeys.slice(3,6),now=1800010000000,state=stateFor(kind,p,now,principal);
 const instance=instantiatePublicContract(sdk,template,state);
 const comparison=await applicationSpec(kind,{publicKeys:p,now,amount:principal});if(kind==='proof')comparison.args.at(-1).value=20000000;
 const compiled=await compile(file,comparison.args);
 assert.equal(instance.script,Buffer.from(compiled.contracts[contractName].compiled.bytecode).toString('hex'),`${kind}: browser state span matches full compiler`);
 const source=utxo(30+Object.keys(templates).length,principal,sdk.payToScriptHashScript(instance.script));
 const paths={escrow:[['release',{}],['resolve',{paySeller:true}],['resolve',{paySeller:false}],['refund',{}]],treasury:[['spend',{pair:0}],['spend',{pair:1}],['spend',{pair:2}]],prediction:[['settle',{yesWins:true}],['settle',{yesWins:false}],['refund',{}],['refund',{refundBy:'no'}]],proof:[['verify',{}]]}[kind];
 async function record(name,plan,valid=true,wrongSigner=-1){
  const signatures=[];await signPublicPlan(plan,(tx,index,signer)=>{const key=signer.signer===wrongSigner?keys.at(-1):keys[publicKeys.indexOf(signer.publicKey)];const raw=sdk.createInputSignature(tx,index,key);signatures.push(raw.slice(2));return raw;});
  const args=plan.funding?[]:instance.entries[plan.entry].params.map((param,index)=>{const value=plan.args[index];if(param.type.kind==='sig')return {kind:'bytes',value:[...Buffer.from(signatures.shift(),'hex')]};if(param.type.kind==='bool')return {kind:'bool',value};if(param.type.kind==='int'||param.type.kind==='temporal')return {kind:'int',value};return {kind:'bytes',value:[...Buffer.from(value,'hex')]};});
  fixtures.push({name,kind,file:file+'.sil',contractName,valid,funding:Boolean(plan.funding),constructorArgs:comparison.args,entry:plan.entry,args,script:instance.script,state,transaction:exportTx(plan.transaction),mass:publicTransactionMass(plan.transaction)});
 }
 for(const [entry,parameters] of paths){const plan=buildPublicSpend(sdk,{contract:instance,utxo:source,entry,parameters,pastMedianTime:now+300000});await record(kind+'-'+entry+'-'+JSON.stringify(parameters),plan);}
 const basic=paths[0];
 await record(kind+'-wrong-signer',buildPublicSpend(sdk,{contract:instance,utxo:source,entry:basic[0],parameters:basic[1],pastMedianTime:now+300000}),false,kind==='treasury'?1:0);
 if(kind==='prediction'){
  const early=buildPublicSpend(sdk,{contract:instance,utxo:source,entry:'refund',pastMedianTime:now+300000});early.transaction.lockTime=BigInt(state.refundAfter)-1n;await record('prediction-early-refund',early,false);
 }
 if(kind==='proof'){
  const bad=buildPublicSpend(sdk,{contract:instance,utxo:source,entry:'verify'});bad.args[1]=(bad.args[1][0]==='0'?'1':'0')+bad.args[1].slice(1);await record('proof-invalid-proof',bad,false);
 }
 // Exercise exact partial wallet signing request and acceptance, without a provider.
 const walletPlan=buildPublicSpend(sdk,{contract:instance,utxo:source,entry:basic[0],parameters:basic[1],pastMedianTime:now+300000});
 for(let signer=0;signer<walletPlan.signers.length;signer++){
  const request=kaspirePublicSigningRequest(walletPlan,signer);assert.equal(request.params.submitTransaction,false);assert.equal(request.params.scripts[0].signatureScript.args.filter(a=>a.type==='signature').length,1);
  const returned=sdk.Transaction.deserializeFromSafeJSON(request.params.psktTransactionJson),raw=sdk.createInputSignature(returned,0,keys[publicKeys.indexOf(walletPlan.signers[signer])]).slice(2),partial=[...walletPlan.signatures];partial[signer]=raw;returned.inputs[0].signatureScript=publicUnlockScript(walletPlan,partial);
  const accepted=acceptKaspirePublicSignature(sdk,walletPlan,signer,{psktTransactionJson:returned.serializeToSafeJSON()});assert.equal(accepted.complete,signer===walletPlan.signers.length-1);
 }
 if(kind==='escrow'){
  const mutated=buildPublicSpend(sdk,{contract:instance,utxo:source,entry:'release'});
  await assert.rejects(signPublicPlan(mutated,(tx,index,signer)=>{mutated.args[0]='metadata changed';return sdk.createInputSignature(tx,index,keys[publicKeys.indexOf(signer.publicKey)]);}),/changed the reviewed/);
  const nativeScript=sdk.payToAddressScript(new sdk.Address(keys[3].toAddress('testnet-10').toString()));
  const pair=buildPublicFunding(sdk,{contract:instance,fundingUtxos:[utxo(60,40000000n,nativeScript),utxo(61,40000000n,nativeScript)],owner:p[0]});
  await assert.rejects(signPublicPlan(pair,(tx,index)=>{if(index===1)tx.inputs[0].signatureScript='00';return sdk.createInputSignature(tx,index,keys[3]);}),/changed the reviewed/);
  const changed=buildPublicFunding(sdk,{contract:instance,fundingUtxos:[utxo(62,1000000000n,nativeScript)],owner:p[0]});
  assert(BigInt(changed.transaction.inputs[0].utxo.amount)>101000000n,'large faucet UTXO is supported with verified change');
  changed.transaction.outputs[1].scriptPublicKey=sdk.payToAddressScript(new sdk.Address(keys[4].toAddress('testnet-10').toString()));
  assert.throws(()=>validatePublicPlan(changed),/controlled change/);
 }
 const native=utxo(45+Object.keys(templates).length,BigInt(principal)+30000000n,sdk.payToAddressScript(new sdk.Address(keys[3].toAddress('testnet-10').toString())));
 await record(kind+'-funding',buildPublicFunding(sdk,{contract:instance,fundingUtxos:[native],owner:p[0]}));
}
// Covenant templates keep policy in runtime state and explicitly preserve it.
for(const [kind,file,contractName,args] of [
 ['token','capped-token','CappedToken',[{kind:'bytes',value:[...Buffer.from(publicKeys[0],'hex')]},{kind:'int',value:1000},{kind:'bytes',value:[...Buffer.from(publicKeys[0],'hex')]},{kind:'int',value:1000},{kind:'bool',value:true}]],
 ['receipt','backed-receipt','BackedReceipt',[{kind:'bytes',value:Array(32).fill(170)},{kind:'int',value:3000000},{kind:'bytes',value:[...Buffer.from(publicKeys[0],'hex')]},{kind:'int',value:100000000}]]
]) {
 const artifact=await compile(file,args);templates[kind]={version:1,network:'testnet-10',kind,contractName,computeBudget:16,artifact};
}
for(const [kind,file,contractName,args] of v4TemplateSpecs(publicKeys)){const artifact=await compile(file,args);templates[kind]={version:1,network:'testnet-10',kind,contractName,computeBudget:kind==='bundle'?20:16,artifact};}
await writeFile(resolve(output,'templates.json'),JSON.stringify({version:1,network:'testnet-10',templates}));
await writeFile(resolve(output,'fixtures.json'),JSON.stringify({version:1,network:'testnet-10',unfunded:true,fixtures},null,2));
console.log(JSON.stringify({publicTemplates:Object.keys(templates),unfundedFixtures:fixtures.length,source:'state-span patches matched fresh compiler output',output:'.cache/public-templates/templates.json'}));
if(process.argv.includes('--check-vm')){
 const upstream=resolve(root,'.cache/upstream/silverscript');assert.equal(execFileSync('git',['rev-parse','HEAD'],{cwd:upstream,encoding:'utf8'}).trim(),'c7d17a15ac88610d013ec9ffffa9520aeb69929b');
 await copyFile(resolve(root,'tests/public_templates_vm.rs'),resolve(upstream,'silverscript-lang/tests/kaspa_explained_public_templates.rs'));
 execFileSync('cargo',['test','-p','silverscript-lang','--test','kaspa_explained_public_templates','--locked','--','--nocapture'],{cwd:upstream,stdio:'inherit',env:{...process.env,KE_PUBLIC_CONTRACT_DIR:resolve(root,'contracts/public'),KE_PUBLIC_FIXTURES:resolve(output,'fixtures.json'),CARGO_NET_GIT_FETCH_WITH_CLI:'true'}});
}
