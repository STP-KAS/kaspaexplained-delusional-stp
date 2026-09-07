// Deterministic, never-funded transaction fixtures. Does not read a wallet or call RPC.
import {createRequire} from 'node:module';
import {mkdir,readFile,writeFile,copyFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
import {instantiatePublicToken,buildTokenGenesis,buildTokenMove,buildTokenExchange,signTokenPlan as protectedSignTokenPlan,tokenSignatureScript,tokenConsensusMass,tokenNamePayload,TOKEN_NETWORK} from '../src/public-token.mjs';
import {pushPublicData} from '../src/public-contracts.mjs';
const require=createRequire(import.meta.url),sdk=require('../.cache/upstream/kaspa-wasm32-sdk/nodejs/kaspa');
const publicTemplate=JSON.parse(await readFile(new URL('../.cache/public-templates/templates.json',import.meta.url),'utf8')).templates.token;
const compileToken=options=>instantiatePublicToken(sdk,publicTemplate,options);
const tokenPlanMass=(sdk,plan)=>({consensus:tokenConsensusMass(plan.transaction)});
async function signTokenPlan(plan,callback,{unfundedFixture=false}={}){if(!unfundedFixture)return protectedSignTokenPlan(plan,callback);for(const [index,s]of plan.signers.entries()){const raw=(await callback(plan.transaction,index,s)).slice(2);plan.transaction.inputs[index].signatureScript=s.kind==='native'?pushPublicData(raw):tokenSignatureScript(plan.tokens[index],plan.states,plan.operation,raw,index===0);}plan.transaction.finalize();return plan.transaction;}
const root=resolve(import.meta.dirname,'..');
const keys=[1,2,3,4].map(n=>new sdk.PrivateKey(n.toString(16).padStart(2,'0').repeat(32)));
const owners=keys.map(k=>k.toPublicKey().toXOnlyPublicKey().toString());
const addresses=keys.map(k=>k.toAddress(TOKEN_NETWORK).toString());
const token=async(owner,quantity,isMinter=false)=>compileToken({issuer:owners[0],cap:1000,state:{owner:owners[owner],quantity,isMinter}});
const utxo=(id,index,value,spk,cov)=>new sdk.UtxoEntries([{outpoint:{transactionId:id,index},amount:BigInt(value),scriptPublicKey:spk,blockDaaScore:0n,isCoinbase:false,...(cov?{covenant_id:cov}:{})}]).items[0];
const funding=(tag,value,owner=0)=>utxo(tag.toString(16).padStart(2,'0').repeat(32),0,value,sdk.payToAddressScript(new sdk.Address(addresses[owner])));
const from=(p,index)=>{const o=p.transaction.outputs[index];return utxo(p.transaction.id,index,o.value,o.scriptPublicKey,o.covenant?.covenantId.toString());};
const fixtures=[];
function exportTransaction(transaction){
 return {version:transaction.version,payload:transaction.payload,lockTime:String(transaction.lockTime),storageMass:String(transaction.storageMass),
 inputs:transaction.inputs.map(i=>({transactionId:i.previousOutpoint.transactionId,index:i.previousOutpoint.index,sequence:String(i.sequence),computeBudget:i.computeBudget,signatureScript:i.signatureScript,amount:String(i.utxo.amount),scriptPublicKey:i.utxo.entry.scriptPublicKey.script,covenantId:i.utxo.entry.covenantId?.toString()??null})),
 outputs:transaction.outputs.map(o=>({value:String(o.value),scriptPublicKey:o.scriptPublicKey.script,covenant:o.covenant?{authorizingInput:o.covenant.authorizingInput,covenantId:o.covenant.covenantId.toString()}:null}))};
}
async function signed(name,p,{valid=true,wrongIndex=-1,mutateAfter=null}={}){
 const signatures=[];
 await signTokenPlan(p,(transaction,index,signer)=>{
  const entry=transaction.inputs[index].utxo.entry.scriptPublicKey.script;
  const owner=signer.owner??owners.find((_,i)=>sdk.payToAddressScript(new sdk.Address(addresses[i])).script===entry);
  const key=index===wrongIndex?keys[3]:keys[owners.indexOf(owner)];assert(key,`fixture signer ${index}`);
  const encoded=sdk.createInputSignature(transaction,index,key);signatures[index]=encoded.slice(2);return encoded;
 },{unfundedFixture:!valid});
 if(mutateAfter)mutateAfter(p.transaction);
 p.transaction.storageMass=BigInt(tokenPlanMass(sdk,p).consensus.storageMass);
 const serialized=p.transaction.serializeToSafeJSON(),roundtrip=sdk.Transaction.deserializeFromSafeJSON(serialized);
 assert.deepEqual(exportTransaction(roundtrip),exportTransaction(p.transaction),'safe JSON preserves covenant inputs and outputs');
 fixtures.push({name,valid,transaction:exportTransaction(p.transaction),operation:p.operation,states:p.states,tokens:p.tokens.map(t=>({issuer:t.issuer,cap:t.cap,state:t.state})),signatures,mass:tokenPlanMass(sdk,p)});
 return p;
}
await mkdir(resolve(root,'.cache/public-token-fixtures'),{recursive:true});
const initial=await token(0,1000,true),minter=await token(0,900,true),holder=await token(1,100),recipient=await token(2,100),splitA=await token(1,40),splitB=await token(2,60);
const genesis=await signed('genesis',buildTokenGenesis(sdk,{fundingUtxos:[funding(10,100000000n)],token:initial,cellAmount:30000000n,changeAddress:addresses[0]}));
const namedGenesisFactory=()=>buildTokenGenesis(sdk,{fundingUtxos:[funding(14,100000000n)],token:initial,tokenName:'Café garden',cellAmount:30000000n,changeAddress:addresses[0]});
await signed('named-genesis',namedGenesisFactory());
await signed('reject-signed-genesis-name-change',namedGenesisFactory(),{valid:false,mutateAfter:t=>{t.payload=tokenNamePayload('Other garden');}});
const mintFactory=()=>buildTokenMove(sdk,{tokenInputs:[{utxo:from(genesis,0),token:initial}],successors:[{token:minter,amount:15000000n},{token:holder,amount:15000000n}],operation:1});
const minted=await signed('mint',mintFactory());
const transferFactory=()=>buildTokenMove(sdk,{tokenInputs:[{utxo:from(minted,1),token:holder}],successors:[{token:recipient,amount:from(minted,1).amount}],operation:0});
await signed('transfer',transferFactory());
const split=await signed('split',buildTokenMove(sdk,{tokenInputs:[{utxo:from(minted,1),token:holder}],successors:[{token:splitA,amount:(from(minted,1).amount+20000000n)/2n},{token:splitB,amount:(from(minted,1).amount+20000000n)/2n}],operation:0,fundingUtxos:[funding(12,20000000n)]}));
const mergeFactory=()=>buildTokenMove(sdk,{tokenInputs:[{utxo:from(split,0),token:splitA},{utxo:from(split,1),token:splitB}],successors:[{token:recipient,amount:from(split,0).amount+from(split,1).amount}],operation:0});
await signed('merge',mergeFactory());
const burnFactory=()=>buildTokenMove(sdk,{tokenInputs:[{utxo:from(minted,0),token:minter},{utxo:from(minted,1),token:holder}],successors:[{token:minter,amount:from(minted,0).amount+from(minted,1).amount}],operation:2});
await signed('joint-burn',burnFactory());
const exchangeFactory=()=>buildTokenExchange(sdk,{sellerToken:{utxo:from(minted,1),token:holder},buyerFundingUtxos:[funding(11,20000000n,2)],buyerToken:recipient,price:8000000n,sellerAddress:addresses[1],buyerChangeAddress:addresses[2]});
await signed('atomic-exchange',exchangeFactory());
await signed('reject-wrong-holder-signature',transferFactory(),{valid:false,wrongIndex:0});
await signed('reject-wrong-delegate-signature',mergeFactory(),{valid:false,wrongIndex:1});
await signed('reject-wrong-burn-holder-signature',burnFactory(),{valid:false,wrongIndex:1});
await signed('reject-wrong-buyer-signature',exchangeFactory(),{valid:false,wrongIndex:1});
const noBudget=transferFactory();noBudget.transaction.inputs[0].computeBudget=0;await signed('reject-insufficient-budget',noBudget,{valid:false});
const alteredScript=transferFactory();alteredScript.transaction.outputs[0].scriptPublicKey=sdk.payToScriptHashScript(holder.script);await signed('reject-output-state-mismatch',alteredScript,{valid:false});
const alteredTemplate=await compileToken({issuer:owners[0],cap:999,state:recipient.state});
const template=transferFactory();template.states=[alteredTemplate.state];template.transaction.outputs[0].scriptPublicKey=sdk.payToScriptHashScript(alteredTemplate.script);await signed('reject-output-cap-template',template,{valid:false});
const issuerTemplate=await compileToken({issuer:owners[3],cap:1000,state:recipient.state});
const issuer=transferFactory();issuer.states=[issuerTemplate.state];issuer.transaction.outputs[0].scriptPublicKey=sdk.payToScriptHashScript(issuerTemplate.script);await signed('reject-output-issuer-template',issuer,{valid:false});
const noBinding=transferFactory();noBinding.transaction.outputs=[{value:noBinding.transaction.outputs[0].value,scriptPublicKey:noBinding.transaction.outputs[0].scriptPublicKey}];await signed('reject-missing-output-binding',noBinding,{valid:false});
const binding=transferFactory();binding.transaction.outputs[0].covenant.authorizingInput=7;await signed('reject-wrong-authorizing-input',binding,{valid:false});
await signed('reject-signed-price-change',exchangeFactory(),{valid:false,mutateAfter:t=>{t.outputs[1].value-=1n;t.outputs[2].value+=1n;}});
const duplicated=mintFactory();duplicated.states=[minter.state,{...minter.state,quantity:100,isMinter:true}];duplicated.transaction.outputs[1].scriptPublicKey=sdk.payToScriptHashScript((await token(0,100,true)).script);await signed('reject-second-minter',duplicated,{valid:false});
const inflation=transferFactory();inflation.states=[{...recipient.state,quantity:101}];inflation.transaction.outputs[0].scriptPublicKey=sdk.payToScriptHashScript((await token(2,101)).script);await signed('reject-inflation',inflation,{valid:false});
const refill=burnFactory();refill.states=[{...minter.state,quantity:1000}];refill.transaction.outputs[0].scriptPublicKey=sdk.payToScriptHashScript(initial.script);await signed('reject-burn-restores-allowance',refill,{valid:false});
const unknown=transferFactory();unknown.operation=99;await signed('reject-unknown-operation',unknown,{valid:false});
const zero=await token(0,0,true),lastIssued=await token(1,900);
const exhausted=await signed('exhaust-allowance',buildTokenMove(sdk,{tokenInputs:[{utxo:from(minted,0),token:minter}],successors:[{token:zero,amount:(from(minted,0).amount+20000000n)/2n},{token:lastIssued,amount:(from(minted,0).amount+20000000n)/2n}],operation:1,fundingUtxos:[funding(13,20000000n)]}));
const overmint=mintFactory();overmint.tokens=[zero];overmint.states=[zero.state,{...holder.state,quantity:1}];overmint.transaction.inputs=[new sdk.TransactionInput({previousOutpoint:from(exhausted,0).outpoint,utxo:from(exhausted,0),sequence:0n,sigOpCount:0,computeBudget:16,signatureScript:''})];overmint.transaction.outputs[0].scriptPublicKey=sdk.payToScriptHashScript(zero.script);overmint.transaction.outputs[1].scriptPublicKey=sdk.payToScriptHashScript((await token(1,1)).script);await signed('reject-exhausted-allowance',overmint,{valid:false});
const mixed=mergeFactory(),original=mixed.transaction.inputs[1],foreign=utxo(original.previousOutpoint.transactionId,original.previousOutpoint.index,original.utxo.amount,original.utxo.entry.scriptPublicKey,'22'.repeat(32));mixed.transaction.inputs=[mixed.transaction.inputs[0],new sdk.TransactionInput({previousOutpoint:foreign.outpoint,utxo:foreign,sequence:0n,sigOpCount:0,computeBudget:16,signatureScript:''})];await signed('reject-mixed-covenant-inputs',mixed,{valid:false});
const extra=transferFactory(),quarter=await token(1,25),half=await token(2,50);extra.states=[quarter.state,quarter.state,half.state];extra.transaction.outputs=[quarter,quarter,half].map(t=>({value:9000000n,scriptPublicKey:sdk.payToScriptHashScript(t.script),covenant:{authorizingInput:0,covenantId:extra.covenantId}}));await signed('reject-three-successors',extra,{valid:false});
const missing=transferFactory();missing.states=[];missing.transaction.outputs=[{value:29000000n,scriptPublicKey:sdk.payToAddressScript(new sdk.Address(addresses[1]))}];await signed('reject-unapproved-holder-destruction',missing,{valid:false});
await writeFile(resolve(root,'.cache/public-token-fixtures/transactions.json'),JSON.stringify({network:TOKEN_NETWORK,unfunded:true,fixtures},null,2));
console.log(JSON.stringify({unfunded:true,fixtures:fixtures.length,expectedValid:fixtures.filter(f=>f.valid).length,expectedInvalid:fixtures.filter(f=>!f.valid).length,mass:fixtures.filter(f=>f.valid).map(f=>({name:f.name,...f.mass}))},null,2));
if(process.argv.includes('--check-vm')){
 const upstream=resolve(root,'.cache/upstream/silverscript');
 assert.equal(execFileSync('git',['rev-parse','HEAD'],{cwd:upstream,encoding:'utf8'}).trim(),'c7d17a15ac88610d013ec9ffffa9520aeb69929b');
 execFileSync('git',['diff','--quiet','HEAD','--'],{cwd:upstream});
 await copyFile(resolve(root,'tests/public_token_vm.rs'),resolve(upstream,'silverscript-lang/tests/kaspa_explained_public_token.rs'));
 execFileSync('cargo',['test','-p','silverscript-lang','--test','kaspa_explained_public_token','--locked','--','--nocapture'],{cwd:upstream,stdio:'inherit',env:{...process.env,KE_CONTRACT_DIR:resolve(root,'contracts/public'),KE_TOKEN_FIXTURES:resolve(root,'.cache/public-token-fixtures/transactions.json'),CARGO_NET_GIT_FETCH_WITH_CLI:'true'}});
}
