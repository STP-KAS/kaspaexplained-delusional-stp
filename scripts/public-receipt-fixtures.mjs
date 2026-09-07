// Unfunded public receipt fixture suite. No wallet or network access.
import {createRequire} from 'node:module';
import {readFile,mkdir,writeFile,copyFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
import {RECEIPT_NETWORK,instantiatePublicReceipt,buildBackedGenesis,buildBackedMove,signBackedPlan as protectedSignBackedPlan,backedSignatureScript} from '../src/public-receipt.mjs';
import {pushPublicData as pushTokenData,publicTransactionMass as tokenConsensusMass} from '../src/public-contracts.mjs';
const ROOT=resolve(import.meta.dirname,'..'),sdk=createRequire(import.meta.url)('../.cache/upstream/kaspa-wasm32-sdk/nodejs/kaspa');
const template=JSON.parse(await readFile(resolve(ROOT,'.cache/public-templates/templates.json'),'utf8')).templates.receipt;
const compileBackedReceipt=options=>instantiatePublicReceipt(sdk,template,options);
function nativeOutput(sdk,key,value){return {value:BigInt(value),scriptPublicKey:sdk.payToAddressScript(new sdk.PublicKey('02'+key).toAddress('testnet-10'))};}
function input(utxo,computeBudget){return {previousOutpoint:utxo.outpoint,signatureScript:'',sequence:0n,sigOpCount:0,computeBudget,utxo};}
async function signBackedPlan(plan,callback,{unfundedFixture=false}={}){if(!unfundedFixture)return protectedSignBackedPlan(plan,callback);for(const [index,s]of plan.signers.entries()){const raw=(await callback(plan.transaction,index,s)).slice(2);plan.transaction.inputs[index].signatureScript=s.kind==='native'?pushTokenData(raw):backedSignatureScript(plan.receipts[index],plan.states,plan.operation,plan.sponsor,raw,index===0);}plan.transaction.finalize();return plan.transaction;}
export async function generateBackedFixtures(destination=resolve(ROOT,'.cache/public-receipt-fixtures/transactions.json')){


 const keys=[1,2,3,4].map(n=>new sdk.PrivateKey(n.toString(16).padStart(2,'0').repeat(32))),owners=keys.map(k=>k.toPublicKey().toXOnlyPublicKey().toString());
 const series='aa'.repeat(32),cache=new Map();
 const compiled=async(owner,quantity,customSeries=series)=>{const id=`${owner}:${quantity}:${customSeries}`;if(!cache.has(id))cache.set(id,await compileBackedReceipt({series:customSeries,state:{owner:owners[owner],quantity}}));return cache.get(id);};
 const utxo=(id,index,value,script,covenant)=>new sdk.UtxoEntries([{outpoint:{transactionId:id,index},amount:BigInt(value),scriptPublicKey:script,blockDaaScore:0n,isCoinbase:false,...(covenant?{covenant_id:covenant}:{})}]).items[0];
 const sponsor=(tag,value=50000000n)=>utxo(tag.toString(16).padStart(2,'0').repeat(32),0,value,nativeOutput(sdk,owners[3],value).scriptPublicKey);
 const from=(plan,index)=>{const o=plan.transaction.outputs[index];return utxo(plan.transaction.id,index,o.value,o.scriptPublicKey,o.covenant?.covenantId.toString());};
 const exportTx=t=>({version:t.version,lockTime:String(t.lockTime),storageMass:String(t.storageMass),inputs:t.inputs.map(i=>({transactionId:i.previousOutpoint.transactionId,index:i.previousOutpoint.index,sequence:String(i.sequence),computeBudget:i.computeBudget,signatureScript:i.signatureScript,amount:String(i.utxo.amount),scriptPublicKey:i.utxo.entry.scriptPublicKey.script,covenantId:i.utxo.entry.covenantId?.toString()??null})),outputs:t.outputs.map(o=>({value:String(o.value),scriptPublicKey:o.scriptPublicKey.script,covenant:o.covenant?{authorizingInput:o.covenant.authorizingInput,covenantId:o.covenant.covenantId.toString()}:null}))});
 const fixtures=[];
 async function signed(name,plan,{valid=true,wrongSigner=-1,after=null}={}){
  const signatures=[];
  await signBackedPlan(plan,(t,index,s)=>{const k=index===wrongSigner?keys[(owners.indexOf(s.owner)+1)%keys.length]:keys[owners.indexOf(s.owner)];const sig=sdk.createInputSignature(t,index,k);signatures[index]=sig.slice(2);return sig;},{unfundedFixture:!valid});
  if(after)after(plan.transaction);
  const mass=tokenConsensusMass(plan.transaction);plan.transaction.storageMass=BigInt(mass.storageMass);
  const roundtrip=sdk.Transaction.deserializeFromSafeJSON(plan.transaction.serializeToSafeJSON());assert.deepEqual(exportTx(roundtrip),exportTx(plan.transaction));
  fixtures.push({name,valid,transaction:exportTx(plan.transaction),operation:plan.operation,sponsor:plan.sponsor,states:plan.states,receipts:plan.receipts.map(r=>({series:r.series,maxFee:r.maxFee,state:r.state})),signatures,mass,redeemed:plan.redeemed??'0'});return plan;
 }
 const full=await compiled(0,80000000),other=await compiled(1,80000000),partA=await compiled(0,30000000),partB=await compiled(1,50000000),remaining=await compiled(0,50000000);
 const genesis=await signed('genesis-locks-full-principal',buildBackedGenesis(sdk,{fundingUtxos:[sponsor(20,152000000n)],receipt:full,sponsorPublicKey:owners[3]}));
 const move=(receiptInputs,successors,operation='transfer',tag=21)=>buildBackedMove(sdk,{receiptInputs,successors,operation,sponsorUtxo:sponsor(tag),sponsorPublicKey:owners[3]});
 const fullInput=()=>[{utxo:from(genesis,0),receipt:full}];
 const transfer=()=>move(fullInput(),[other]);
 await signed('holder-transfer-preserves-backing',transfer());
 const split=await signed('split-conserves-30m-plus-50m',move(fullInput(),[partA,partB]));
 const merge=()=>move([{utxo:from(split,0),receipt:partA},{utxo:from(split,1),receipt:partB}],[other],'transfer',22);
 await signed('merge-with-both-holder-signatures',merge());
 const partial=()=>move(fullInput(),[remaining],'redeem',23);
 const redeem=()=>move(fullInput(),[],'redeem',24);
 await signed('partial-redemption-pays-30m-retains-50m',partial());
 await signed('full-redemption-no-receipt-successor',redeem());
 await signed('reject-wrong-holder-signature',transfer(),{valid:false,wrongSigner:0});
 await signed('reject-wrong-delegate-signature',merge(),{valid:false,wrongSigner:1});
 await signed('reject-wrong-sponsor-signature',transfer(),{valid:false,wrongSigner:1});
 await signed('reject-payment-changed-after-signing',partial(),{valid:false,after:t=>{t.outputs[1].value-=1n;t.outputs[2].value+=1n;}});
 const reduce=transfer();reduce.transaction.outputs[0].value-=1n;reduce.transaction.outputs[1].value+=1n;await signed('reject-backing-skim-even-authorized',reduce,{valid:false});
 const increase=transfer();increase.transaction.outputs[0].value+=1n;increase.transaction.outputs[1].value-=1n;await signed('reject-value-quantity-mismatch',increase,{valid:false});
 const inflated=await compiled(1,80000001),inflation=transfer();inflation.states=[inflated.state];inflation.transaction.outputs[0].scriptPublicKey=sdk.payToScriptHashScript(inflated.script);inflation.transaction.outputs[0].value+=1n;inflation.transaction.outputs[1].value-=1n;await signed('reject-inflation-even-with-sponsored-extra-sompi',inflation,{valid:false});
 const changedSeries=await compiled(1,80000000,'bb'.repeat(32)),template=transfer();template.states=[changedSeries.state];template.transaction.outputs[0].scriptPublicKey=sdk.payToScriptHashScript(changedSeries.script);await signed('reject-series-template-change',template,{valid:false});
 const changedFee=compileBackedReceipt({series,maxFee:2999999,state:{owner:owners[1],quantity:80000000}}),feePolicy=transfer();feePolicy.states=[changedFee.state];feePolicy.transaction.outputs[0].scriptPublicKey=sdk.payToScriptHashScript(changedFee.script);await signed('reject-changing-fee-policy',feePolicy,{valid:false});
 const lacking=transfer(),old=lacking.transaction.inputs[0],badUtxo=utxo(old.previousOutpoint.transactionId,old.previousOutpoint.index,old.utxo.amount-1n,old.utxo.entry.scriptPublicKey,old.utxo.entry.covenantId.toString());lacking.transaction.inputs=[new sdk.TransactionInput(input(badUtxo,64)),lacking.transaction.inputs[1]];await signed('reject-underbacked-input-cell',lacking,{valid:false});
 const short=partial();short.transaction.outputs[1].value-=1n;short.transaction.outputs[2].value+=1n;await signed('reject-short-redemption-even-authorized',short,{valid:false});
 const stolen=partial();stolen.transaction.outputs[1].scriptPublicKey=nativeOutput(sdk,owners[2],1).scriptPublicKey;await signed('reject-wrong-redemption-recipient',stolen,{valid:false});
 const remainingStolen=await compiled(1,50000000),ownership=partial();ownership.states=[remainingStolen.state];ownership.transaction.outputs[0].scriptPublicKey=sdk.payToScriptHashScript(remainingStolen.script);await signed('reject-changing-owner-during-partial-redemption',ownership,{valid:false});
 const fakeChange=transfer();fakeChange.transaction.outputs[1].scriptPublicKey=nativeOutput(sdk,owners[2],1).scriptPublicKey;await signed('reject-sponsor-change-theft',fakeChange,{valid:false});
 const tooMuchFee=transfer();tooMuchFee.transaction.outputs[1].value-=3000001n;await signed('reject-excess-sponsor-fee',tooMuchFee,{valid:false});
 const extra=transfer();extra.transaction.outputs[1].value-=10000000n;extra.transaction.outputs.push(nativeOutput(sdk,owners[2],10000000n));await signed('reject-extra-output',extra,{valid:false});
 const missingBinding=transfer();missingBinding.transaction.outputs=[{value:missingBinding.transaction.outputs[0].value,scriptPublicKey:missingBinding.transaction.outputs[0].scriptPublicKey},missingBinding.transaction.outputs[1]];await signed('reject-unbound-receipt-successor',missingBinding,{valid:false});
 const wrongBinding=transfer();wrongBinding.transaction.outputs[0].covenant.authorizingInput=1;await signed('reject-sponsor-authorized-successor',wrongBinding,{valid:false});
 const lowBudget=transfer();lowBudget.transaction.inputs[0].computeBudget=1;await signed('reject-insufficient-committed-budget',lowBudget,{valid:false});
 const unknown=transfer();unknown.operation=99;await signed('reject-unknown-operation',unknown,{valid:false});
 const mixed=merge(),original=mixed.transaction.inputs[1],foreign=utxo(original.previousOutpoint.transactionId,original.previousOutpoint.index,original.utxo.amount,original.utxo.entry.scriptPublicKey,'cc'.repeat(32));mixed.transaction.inputs=[mixed.transaction.inputs[0],new sdk.TransactionInput(input(foreign,64)),mixed.transaction.inputs[2]];await signed('reject-mixed-covenant-ids',mixed,{valid:false});
 const fakeSponsor=transfer();fakeSponsor.sponsor=owners[2];await signed('reject-sponsor-public-key-mismatch',fakeSponsor,{valid:false});
 // Builder validations are separate from the re-signed invalid VM transactions.
 assert.throws(()=>move(fullInput(),[partA]),/conserve/);
 assert.throws(()=>move(fullInput(),[other],'redeem'),/Redemption/);
 assert.throws(()=>buildBackedGenesis(sdk,{fundingUtxos:[sponsor(25,80000000n)],receipt:full,sponsorPublicKey:owners[3]}),/full backing/);
 assert.throws(()=>move([{utxo:badUtxo,receipt:full}],[other]),/fully backed/);
 await mkdir(resolve(destination,'..'),{recursive:true});await writeFile(destination,JSON.stringify({network:RECEIPT_NETWORK,unfunded:true,fixtures},null,2));
 return {path:destination,unfunded:true,fixtures:fixtures.length,valid:fixtures.filter(f=>f.valid).length,invalid:fixtures.filter(f=>!f.valid).length,masses:fixtures.filter(f=>f.valid).map(f=>({name:f.name,...f.mass}))};
}

console.log(JSON.stringify(await generateBackedFixtures(),null,2));
if(process.argv.includes('--check-vm')){
 const upstream=resolve(ROOT,'.cache/upstream/silverscript');
 await copyFile(resolve(ROOT,'tests/public_receipt_vm.rs'),resolve(upstream,'silverscript-lang/tests/kaspa_explained_public_receipt.rs'));
 execFileSync('cargo',['test','-p','silverscript-lang','--test','kaspa_explained_public_receipt','--locked','--','--nocapture'],{cwd:upstream,stdio:'inherit',env:{...process.env,KE_CONTRACT_DIR:resolve(ROOT,'contracts/public'),KE_BACKED_FIXTURES:resolve(ROOT,'.cache/public-receipt-fixtures/transactions.json'),CARGO_NET_GIT_FETCH_WITH_CLI:'true'}});
}
