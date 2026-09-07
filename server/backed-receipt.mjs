// Testnet-10 transaction construction only: no wallet access, RPC, or broadcast.
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {resolve} from 'node:path';
import {pushTokenData,tokenConsensusMass} from './token-lab.mjs';
const execute=promisify(execFile),ROOT=resolve(import.meta.dirname,'..');
export const RECEIPT_NETWORK='testnet-10';
const hex=(value,length)=>{if(typeof value!=='string'||!new RegExp(`^[a-f0-9]{${length*2}}$`,'i').test(value))throw new Error(`Expected ${length}-byte hexadecimal data.`);return value.toLowerCase();};
const integer=(value,min=1,max=1000000000)=>{if(!Number.isSafeInteger(value)||value<min||value>max)throw new Error('Invalid receipt integer.');return value;};
const sompi=value=>{const n=BigInt(value);if(n<0n||n>18446744073709551615n)throw new Error('Invalid sompi amount.');return n;};
export function backedState(value){return {owner:hex(value.owner,32),quantity:integer(value.quantity),...(value.seriesId?{seriesId:hex(value.seriesId,32)}:{})};}
export async function compileBackedReceipt({series,maxFee=3000000,state}){
 series=hex(series,32);maxFee=integer(maxFee,1,3000000);state=backedState(state);
 await mkdir(resolve(ROOT,'.cache'),{recursive:true});const directory=await mkdtemp(resolve(ROOT,'.cache','backed-compile-'));
 try{
  const args=[{kind:'bytes',value:[...Buffer.from(series,'hex')]},{kind:'int',value:maxFee},{kind:'bytes',value:[...Buffer.from(state.owner,'hex')]},{kind:'int',value:state.quantity}];
  const input=resolve(directory,'args.json'),output=resolve(directory,'artifact.json');await writeFile(input,JSON.stringify(args));
  await execute(resolve(ROOT,'.cache/upstream/silverc'),[resolve(ROOT,'contracts/backed-receipt.sil'),'--constructor-args',input,'-o',output],{timeout:30000,maxBuffer:1000000});
  const artifact=JSON.parse(await readFile(output,'utf8'));if(artifact.compiler_version!=='0.1.0')throw new Error('Unexpected compiler artifact.');
  return {series,maxFee,state:{...state,seriesId:series},script:Buffer.from(artifact.contracts.BackedReceipt.compiled.bytecode).toString('hex'),artifact};
 }finally{await rm(directory,{recursive:true,force:true});}
}
function encodedInteger(value){integer(value,0);if(value===0)return '00';const out=[];let n=BigInt(value);while(n){out.push(Number(n&255n));n>>=8n;}if(out.at(-1)&128)out.push(0);return pushTokenData(Buffer.from(out));}
function fixedInteger(value){const bytes=Buffer.alloc(8);bytes.writeBigUInt64LE(BigInt(integer(value)));return bytes;}
export function backedSignatureScript(receipt,states,operation,sponsor,signature,isLeader=true){
 hex(signature,65);const c=receipt.artifact.contracts.BackedReceipt;
 const args=isLeader?[
  pushTokenData(Buffer.concat(states.map(s=>Buffer.from(s.owner,'hex')))),
  pushTokenData(Buffer.concat(states.map(s=>fixedInteger(s.quantity)))),
  pushTokenData(Buffer.concat(states.map(s=>Buffer.from(s.seriesId,'hex')))),
  encodedInteger(operation),pushTokenData(hex(sponsor,32)),pushTokenData(signature)
 ]:[pushTokenData(signature)];
 const entry=c.entries[isLeader?c.cov_decl_to_abi.move:c.delegate_entry_abi];
 return args.join('')+pushTokenData(entry.dispatch_tag)+pushTokenData(receipt.script);
}
const covId=u=>u.entry?.covenantId?.toString()??u.covenantId?.toString()??u.covenant_id;
const spk=u=>u.entry?.scriptPublicKey??u.scriptPublicKey;
const total=states=>states.reduce((n,s)=>n+s.quantity,0);
function nativeOutput(sdk,publicKey,value){const key=new sdk.PublicKey('02'+hex(publicKey,32));return {value:sompi(value),scriptPublicKey:sdk.payToAddressScript(key.toAddress(RECEIPT_NETWORK))};}
function input(utxo,computeBudget){if(!utxo?.outpoint||!utxo.entry)throw new Error('Complete SDK UTXO reference required.');return {previousOutpoint:utxo.outpoint,signatureScript:'',sequence:0n,sigOpCount:0,computeBudget:integer(computeBudget,0,65535),utxo};}
function newTransaction(sdk,inputs,outputs){return new sdk.Transaction({version:1,inputs,outputs,lockTime:0n,subnetworkId:'00'.repeat(20),gas:0n,payload:''});}
function valueCheck(inputs,outputs,fee){const provided=inputs.reduce((n,u)=>n+sompi(u.amount),0n),paid=outputs.reduce((n,o)=>n+sompi(o.value),0n);if(provided!==paid+fee)throw new Error('Receipt inputs must equal outputs plus sponsor-paid fee.');}
function checkSponsor(sdk,utxo,publicKey){if(covId(utxo))throw new Error('Sponsor must use an ordinary P2PK input.');const expected=nativeOutput(sdk,publicKey,1).scriptPublicKey;if(spk(utxo)?.version!==expected.version||spk(utxo)?.script!==expected.script)throw new Error('Sponsor public key does not match funding input.');}
function result(sdk,transaction,fee,covenantId,receipts,states,operation,sponsor,signers){
 const seen=new Set();for(const i of transaction.inputs){const id=`${i.previousOutpoint.transactionId}:${i.previousOutpoint.index}`;if(seen.has(id))throw new Error('Duplicate input outpoint.');seen.add(id);}
 const plan={network:RECEIPT_NETWORK,transaction,fee:String(fee),covenantId,receipts,states,operation,sponsor,signers};Object.defineProperty(plan,'sdk',{value:sdk});return plan;
}
export function buildBackedGenesis(sdk,{fundingUtxos,receipt,fee,sponsorPublicKey,nativeBudget=16}){
 if(!Array.isArray(fundingUtxos)||fundingUtxos.length!==1)throw new Error('This genesis example uses one ordinary funding input.');
 checkSponsor(sdk,fundingUtxos[0],sponsorPublicKey);fee=sompi(fee);if(fee===0n||fee>BigInt(receipt.maxFee))throw new Error('Genesis fee exceeds receipt policy.');
 const principal=BigInt(receipt.state.quantity),change=sompi(fundingUtxos[0].amount)-principal-fee;if(change<=0n)throw new Error('Genesis requires full backing and positive sponsor change.');
 const outputs=[{value:principal,scriptPublicKey:sdk.payToScriptHashScript(receipt.script)},nativeOutput(sdk,sponsorPublicKey,change)];
 valueCheck(fundingUtxos,outputs,fee);
 const transaction=newTransaction(sdk,fundingUtxos.map(u=>input(u,nativeBudget)),outputs);transaction.populateGenesisCovenants([{authorizingInput:0,outputs:[0]}]);
 const id=sdk.covenantId(transaction.inputs[0].previousOutpoint,[{index:0,output:transaction.outputs[0]}]).toString();if(transaction.outputs[0].covenant?.covenantId.toString()!==id)throw new Error('Genesis covenant binding was lost.');
 const plan=result(sdk,transaction,fee,id,[],[],null,sponsorPublicKey,[{index:0,kind:'native',owner:sponsorPublicKey}]);plan.genesis={series:receipt.series,maxFee:receipt.maxFee,state:receipt.state};return plan;
}
export function buildBackedMove(sdk,{receiptInputs,successors,operation='transfer',sponsorUtxo,sponsorPublicKey,fee,receiptBudget=16,nativeBudget=16}){
 if(!Array.isArray(receiptInputs)||receiptInputs.length<1||receiptInputs.length>2||!Array.isArray(successors)||successors.length>2)throw new Error('Receipt fan-in/out is at most two.');
 const before=receiptInputs.map(i=>i.receipt),states=successors.map(r=>backedState(r.state)),identity=r=>`${r.series}:${r.maxFee}`;
 if([...before,...successors].some(r=>identity(r)!==identity(before[0])))throw new Error('Receipt series or fee-policy mismatch.');
 const previous=before.map(r=>backedState(r.state));if(total(previous)>1000000000||total(states)>1000000000)throw new Error('Receipt group quantity exceeds its bound.');
 const code=operation==='transfer'?0:operation==='redeem'?1:-1;
 if(code===0){if(states.length===0||total(previous)!==total(states))throw new Error('Transfer must conserve every backed unit.');}
 else if(code===1){if(previous.length!==1||states.length>1||total(states)>=previous[0].quantity||states.some(s=>s.owner!==previous[0].owner))throw new Error('Redemption requires one holder and preserves any remaining holder balance.');}
 else throw new Error('Choose transfer or redeem.');
 const id=covId(receiptInputs[0].utxo);if(!id)throw new Error('Receipt input must retain its covenant ID.');
 for(const {utxo,receipt} of receiptInputs){if(covId(utxo)!==id)throw new Error('Mixed receipt covenant IDs.');if(sompi(utxo.amount)!==BigInt(receipt.state.quantity))throw new Error('Receipt input is not fully backed.');const expected=sdk.payToScriptHashScript(receipt.script);if(spk(utxo)?.version!==expected.version||spk(utxo)?.script!==expected.script)throw new Error('Receipt script does not match the supplied state.');}
 checkSponsor(sdk,sponsorUtxo,sponsorPublicKey);fee=sompi(fee);if(fee===0n||fee>BigInt(before[0].maxFee))throw new Error('Fee must be positive and within the receipt policy.');
 const change=sompi(sponsorUtxo.amount)-fee;if(change<=0n)throw new Error('Sponsor must cover fees and retain positive change.');
 const outputs=successors.map(r=>({value:BigInt(r.state.quantity),scriptPublicKey:sdk.payToScriptHashScript(r.script),covenant:{authorizingInput:0,covenantId:id}}));
 if(code===1)outputs.push(nativeOutput(sdk,previous[0].owner,previous[0].quantity-total(states)));
 outputs.push(nativeOutput(sdk,sponsorPublicKey,change));
 const all=[...receiptInputs.map(i=>i.utxo),sponsorUtxo];valueCheck(all,outputs,fee);
 const transaction=newTransaction(sdk,all.map((u,i)=>input(u,i<before.length?receiptBudget:nativeBudget)),outputs);
 successors.forEach((_,i)=>{if(transaction.outputs[i].covenant?.covenantId.toString()!==id)throw new Error('SDK dropped receipt binding.');});
 const signers=all.map((_,index)=>({index,kind:index<before.length?'receipt':'native',owner:index<before.length?before[index].state.owner:sponsorPublicKey}));
 const plan=result(sdk,transaction,fee,id,before,states,code,sponsorPublicKey,signers);plan.redeemed=code===1?String(previous[0].quantity-total(states)):'0';return plan;
}
export function preflightBackedPlan(plan,{feeRate=100,requireReady=false}={}){
 if(plan.network!==RECEIPT_NETWORK)throw new Error('Testnet-only receipt plan.');
 for(const signer of plan.signers){if(!plan.transaction.inputs[signer.index].signatureScript)plan.transaction.inputs[signer.index].signatureScript=signer.kind==='receipt'?backedSignatureScript(plan.receipts[signer.index],plan.states,plan.operation,plan.sponsor,'00'.repeat(64)+'01',signer.index===0):pushTokenData('00'.repeat(64)+'01');}
 const mass=tokenConsensusMass(plan.transaction,{feeRate});const maxFee=plan.receipts[0]?.maxFee??plan.genesis.maxFee;
 const ready=mass.withinBlockLimits&&BigInt(plan.fee)>=BigInt(mass.minimumFee)&&BigInt(plan.fee)<=BigInt(maxFee);
 plan.transaction.storageMass=BigInt(mass.storageMass);
 if(requireReady&&!ready)throw new Error(!mass.withinBlockLimits?'Receipt exceeds pinned node block mass limits.':'Receipt fee is outside the reviewed relay and fee-policy limits.');
 return {...mass,fee:plan.fee,maxFee,ready};
}
function shape(transaction){const json=JSON.parse(transaction.serializeToSafeJSON());for(const i of json.inputs)delete i.signatureScript;return JSON.stringify(json);}
export async function signBackedPlan(plan,signInput,{unfundedFixture=false,feeRate=100}={}){
 if(plan.network!==RECEIPT_NETWORK)throw new Error('Testnet-only receipt plan.');
 if(!unfundedFixture)preflightBackedPlan(plan,{feeRate,requireReady:true});
 const reviewed=shape(plan.transaction);
 for(const signer of plan.signers){let signature=await signInput(plan.transaction,signer.index,signer);if(shape(plan.transaction)!==reviewed)throw new Error('Signer changed the reviewed receipt transaction.');if(/^41[0-9a-f]{130}$/i.test(signature))signature=signature.slice(2);hex(signature,65);if(signature.slice(-2)!=='01')throw new Error('Receipt signing requires SIGHASH_ALL.');
  plan.transaction.inputs[signer.index].signatureScript=signer.kind==='receipt'?backedSignatureScript(plan.receipts[signer.index],plan.states,plan.operation,plan.sponsor,signature,signer.index===0):pushTokenData(signature);
 }
 plan.transaction.finalize();return plan.transaction;
}

// Run `node server/backed-receipt.mjs --fixtures` for isolated, unfunded tests.
// The fixture function receives no wallet path and never opens a network client.
export async function generateBackedFixtures(destination=resolve(ROOT,'.cache/backed-receipt/transactions.json')){
 const {createRequire}=await import('node:module');const assert=(await import('node:assert/strict')).default;
 const sdk=createRequire(import.meta.url)('../.cache/upstream/kaspa-wasm32-sdk/nodejs/kaspa');
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
 const full=await compiled(0,100000000),other=await compiled(1,100000000),partA=await compiled(0,40000000),partB=await compiled(1,60000000),remaining=await compiled(0,60000000);
 const genesis=await signed('genesis-locks-full-principal',buildBackedGenesis(sdk,{fundingUtxos:[sponsor(20,152000000n)],receipt:full,fee:1000000n,sponsorPublicKey:owners[3]}));
 const move=(receiptInputs,successors,operation='transfer',tag=21)=>buildBackedMove(sdk,{receiptInputs,successors,operation,sponsorUtxo:sponsor(tag),sponsorPublicKey:owners[3],fee:1000000n});
 const fullInput=()=>[{utxo:from(genesis,0),receipt:full}];
 const transfer=()=>move(fullInput(),[other]);
 await signed('holder-transfer-preserves-backing',transfer());
 const split=await signed('split-conserves-40m-plus-60m',move(fullInput(),[partA,partB]));
 const merge=()=>move([{utxo:from(split,0),receipt:partA},{utxo:from(split,1),receipt:partB}],[other],'transfer',22);
 await signed('merge-with-both-holder-signatures',merge());
 const partial=()=>move(fullInput(),[remaining],'redeem',23);
 const redeem=()=>move(fullInput(),[],'redeem',24);
 await signed('partial-redemption-pays-40m-retains-60m',partial());
 await signed('full-redemption-no-receipt-successor',redeem());
 await signed('reject-wrong-holder-signature',transfer(),{valid:false,wrongSigner:0});
 await signed('reject-wrong-delegate-signature',merge(),{valid:false,wrongSigner:1});
 await signed('reject-wrong-sponsor-signature',transfer(),{valid:false,wrongSigner:1});
 await signed('reject-payment-changed-after-signing',partial(),{valid:false,after:t=>{t.outputs[1].value-=1n;t.outputs[2].value+=1n;}});
 const reduce=transfer();reduce.transaction.outputs[0].value-=1n;reduce.transaction.outputs[1].value+=1n;await signed('reject-backing-skim-even-authorized',reduce,{valid:false});
 const increase=transfer();increase.transaction.outputs[0].value+=1n;increase.transaction.outputs[1].value-=1n;await signed('reject-value-quantity-mismatch',increase,{valid:false});
 const inflated=await compiled(1,100000001),inflation=transfer();inflation.states=[inflated.state];inflation.transaction.outputs[0].scriptPublicKey=sdk.payToScriptHashScript(inflated.script);inflation.transaction.outputs[0].value+=1n;inflation.transaction.outputs[1].value-=1n;await signed('reject-inflation-even-with-sponsored-extra-sompi',inflation,{valid:false});
 const changedSeries=await compiled(1,100000000,'bb'.repeat(32)),template=transfer();template.transaction.outputs[0].scriptPublicKey=sdk.payToScriptHashScript(changedSeries.script);await signed('reject-series-template-change',template,{valid:false});
 const lacking=transfer(),old=lacking.transaction.inputs[0],badUtxo=utxo(old.previousOutpoint.transactionId,old.previousOutpoint.index,old.utxo.amount-1n,old.utxo.entry.scriptPublicKey,old.utxo.entry.covenantId.toString());lacking.transaction.inputs=[new sdk.TransactionInput(input(badUtxo,64)),lacking.transaction.inputs[1]];await signed('reject-underbacked-input-cell',lacking,{valid:false});
 const short=partial();short.transaction.outputs[1].value-=1n;short.transaction.outputs[2].value+=1n;await signed('reject-short-redemption-even-authorized',short,{valid:false});
 const stolen=partial();stolen.transaction.outputs[1].scriptPublicKey=nativeOutput(sdk,owners[2],1).scriptPublicKey;await signed('reject-wrong-redemption-recipient',stolen,{valid:false});
 const remainingStolen=await compiled(1,60000000),ownership=partial();ownership.states=[remainingStolen.state];ownership.transaction.outputs[0].scriptPublicKey=sdk.payToScriptHashScript(remainingStolen.script);await signed('reject-changing-owner-during-partial-redemption',ownership,{valid:false});
 const fakeChange=transfer();fakeChange.transaction.outputs[1].scriptPublicKey=nativeOutput(sdk,owners[2],1).scriptPublicKey;await signed('reject-sponsor-change-theft',fakeChange,{valid:false});
 const tooMuchFee=transfer();tooMuchFee.transaction.outputs[1].value-=2000001n;await signed('reject-excess-sponsor-fee',tooMuchFee,{valid:false});
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
 assert.throws(()=>buildBackedGenesis(sdk,{fundingUtxos:[sponsor(25,100000000n)],receipt:full,fee:1000000n,sponsorPublicKey:owners[3]}),/full backing/);
 assert.throws(()=>move([{utxo:badUtxo,receipt:full}],[other]),/fully backed/);
 await mkdir(resolve(destination,'..'),{recursive:true});await writeFile(destination,JSON.stringify({network:RECEIPT_NETWORK,unfunded:true,fixtures},null,2));
 return {path:destination,unfunded:true,fixtures:fixtures.length,valid:fixtures.filter(f=>f.valid).length,invalid:fixtures.filter(f=>!f.valid).length,masses:fixtures.filter(f=>f.valid).map(f=>({name:f.name,...f.mass}))};
}
if(process.argv[1]&&resolve(process.argv[1])===resolve(import.meta.dirname,'backed-receipt.mjs')&&process.argv.includes('--fixtures')){
 const result=await generateBackedFixtures();console.log(JSON.stringify(result,null,2));
}
