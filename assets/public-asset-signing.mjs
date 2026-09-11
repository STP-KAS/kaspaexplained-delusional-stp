// Shared browser-only ABI, reviewed-plan protection, and wallet requests.
import {pushPublicData,hexBytes,bytesHex,publicTransactionMass} from './public-contracts.mjs';
const dummy='00'.repeat(64)+'01',reviews=new WeakMap();
export function fixedAssetInteger(value){let n=BigInt(value);if(n<0n||n>9223372036854775807n)throw new Error('Invalid state integer.');const a=new Uint8Array(8);for(let i=0;i<8;i++){a[i]=Number(n&255n);n>>=8n;}return a;}
export function assetArguments(asset,states,operation,sponsor,isLeader=true){
 if(!isLeader)return [{type:'signature'}];
 const c=asset.artifact.contracts[asset.contractName];
 const args=c.runtime_state.fields.map(f=>({type:'data',hex:bytesHex(states.flatMap(s=>Array.from(f.type.kind==='int'?fixedAssetInteger(s[f.name]):f.type.kind==='bool'?[s[f.name]?1:0]:hexBytes(s[f.name]))))}));
 args.push({type:'i64',value:operation});if(sponsor)args.push({type:'data',hex:sponsor});args.push({type:'signature'});return args;
}
const intPush=value=>{let n=BigInt(value);if(n<0n)throw new Error('Negative operation.');const a=[];while(n){a.push(Number(n&255n));n>>=8n;}if(a.at(-1)&128)a.push(0);return pushPublicData(a);};
export function assetSignatureScript(asset,states,operation,sponsor,signature,isLeader=true){
 if(!/^[0-9a-f]{128}01$/i.test(signature))throw new Error('A SIGHASH_ALL signature is required.');
 const c=asset.artifact.contracts[asset.contractName],entry=c.entries[isLeader?c.cov_decl_to_abi.move:c.delegate_entry_abi];
 return assetArguments(asset,states,operation,sponsor,isLeader).map(a=>a.type==='signature'?pushPublicData(signature):a.type==='i64'?intPush(a.value):pushPublicData(a.hex)).join('')+pushPublicData(entry.dispatch_tag)+pushPublicData(asset.script);
}
function shape(tx){const value=JSON.parse(tx.serializeToSafeJSON());delete value.id;for(const i of value.inputs)delete i.signatureScript;return JSON.stringify(value);}
function metadata(plan){const {transaction,...value}=plan;return JSON.stringify(value);}
function signatureContext(plan,index){
 if(!plan.groups)return {states:plan.states,operation:plan.operation,leader:index===0};
 const group=plan.groups.find(g=>index>=g.inputStart&&index<g.inputStart+g.inputCount);
 if(!group)throw new Error('Missing covenant signing group.');
 return {states:group.states,operation:group.operation,leader:index===group.inputStart};
}
function checkGroups(plan){
 if(plan.groups===undefined)return;
 if(!Array.isArray(plan.groups)||!plan.groups.length||plan.groups.length>3)throw new Error('Invalid covenant signing groups.');
 let end=0;
 for(const group of plan.groups){
  if(!group||Object.keys(group).some(k=>!['inputStart','inputCount','states','operation'].includes(k))||group.inputStart!==end||!Number.isSafeInteger(group.inputCount)||group.inputCount<1||group.inputCount>3||!Array.isArray(group.states)||group.states.length>3||!Number.isSafeInteger(group.operation)||group.operation<0)throw new Error('Invalid covenant signing group.');
  end+=group.inputCount;
  if(end>plan.signers.length||plan.signers.slice(group.inputStart,end).some(s=>s.kind==='native'))throw new Error('Covenant group includes a native signer.');
 }
 if(plan.signers.slice(end).some(s=>s.kind!=='native'))throw new Error('Covenant groups do not cover every covenant signer.');
}
function scriptFor(plan,index,raw){if(!/^[0-9a-f]{128}01$/i.test(raw))throw new Error('A SIGHASH_ALL signature is required.');const signer=plan.signers[index],asset=(plan.tokens??plan.receipts)[index];if(signer.kind==='native')return pushPublicData(raw);const group=signatureContext(plan,index);return assetSignatureScript(asset,group.states,group.operation,plan.sponsor,raw,group.leader);}
export function publicAssetPlanMass(plan,{feeRate=100}={}){const scripts=plan.transaction.inputs.map(i=>i.signatureScript);try{for(const [index] of plan.signers.entries())plan.transaction.inputs[index].signatureScript=scriptFor(plan,index,dummy);return publicTransactionMass(plan.transaction,{feeRate});}finally{plan.transaction.inputs.forEach((input,index)=>{input.signatureScript=scripts[index];});}}
export function preparePublicAssetPlan(plan,{feeRate=100}={}){
 checkGroups(plan);
 for(const [index,s]of plan.signers.entries()){if(s.index!==index)throw new Error('Signer order mismatch.');plan.transaction.inputs[index].signatureScript=scriptFor(plan,index,dummy);}
 const mass=publicTransactionMass(plan.transaction,{feeRate});plan.transaction.storageMass=BigInt(mass.storageMass);plan.mass=mass;
 const tx=plan.transaction,fee=tx.inputs.reduce((s,i)=>s+i.utxo.amount,0n)-tx.outputs.reduce((s,o)=>s+o.value,0n);
 if(fee<=0n||fee>(plan.payment?1000000n:3000000n)||fee!==BigInt(plan.fee)||fee<BigInt(mass.minimumFee)||!mass.withinBlockLimits)throw new Error(`Asset transaction exceeds public limits (fee ${fee}, minimum ${mass.minimumFee}, compute ${mass.computeMass}, storage ${mass.storageMass}).`);
 const covOut=tx.outputs.filter(o=>o.covenant).reduce((s,o)=>s+o.value,0n),covIn=tx.inputs.filter(i=>i.utxo.entry.covenantId).reduce((s,i)=>s+i.utxo.amount,0n);
 if(covOut>100000000n||covIn>100000000n)throw new Error('Public asset principal is limited to 1 tKAS.');
 const nativeInputs=tx.inputs.filter(i=>!i.utxo.entry.covenantId),owned=new Set(nativeInputs.map(i=>i.utxo.entry.scriptPublicKey.script));
 for(const [index,i] of tx.inputs.entries()){if(i.utxo.entry.covenantId)continue;if(i.utxo.entry.scriptPublicKey.version!==0||!/^20[0-9a-f]{64}ac$/i.test(i.utxo.entry.scriptPublicKey.script))throw new Error('Native funding must use P2PK inputs.');plan.signers[index].owner=i.utxo.entry.scriptPublicKey.script.slice(2,66);}
 const controlledChange=tx.outputs.filter(o=>!o.covenant&&o.scriptPublicKey.version===0&&owned.has(o.scriptPublicKey.script)).reduce((s,o)=>s+o.value,0n),nativeTotal=nativeInputs.reduce((s,i)=>s+i.utxo.amount,0n);
 if(nativeTotal-controlledChange>100000000n+fee)throw new Error('Public native debit is limited to principal plus fee.');
 reviews.set(plan,{shape:shape(tx),metadata:metadata(plan),completed:new Set(),scripts:tx.inputs.map(i=>i.signatureScript)});return plan;
}
export function validatePublicAssetPlan(plan){const review=reviews.get(plan);if(!review||plan.network!=='testnet-10'||review.shape!==shape(plan.transaction)||review.metadata!==metadata(plan)||plan.transaction.inputs.some((i,n)=>i.signatureScript!==review.scripts[n]))throw new Error('The reviewed asset transaction or metadata changed.');const mass=publicTransactionMass(plan.transaction,{feeRate:plan.mass.feeRate});if(!mass.withinBlockLimits||plan.transaction.storageMass!==BigInt(mass.storageMass)||BigInt(plan.fee)<BigInt(mass.minimumFee))throw new Error('Asset mass or relay budget changed.');return {mass,fee:plan.fee,complete:review.completed.size===plan.signers.length};}
export async function signPublicAssetPlan(plan,signInput){
 validatePublicAssetPlan(plan);const review=reviews.get(plan);
 for(const [index,signer] of plan.signers.entries()){
  const prior=plan.transaction.inputs.map(i=>i.signatureScript);let raw=await signInput(plan.transaction,index,signer);validatePublicAssetPlan(plan);
  if(plan.transaction.inputs.some((i,n)=>i.signatureScript!==prior[n]))throw new Error('Signer changed another signature.');
  if(/^41[0-9a-f]{130}$/i.test(raw))raw=raw.slice(2);plan.transaction.inputs[index].signatureScript=scriptFor(plan,index,raw);review.completed.add(index);review.scripts[index]=plan.transaction.inputs[index].signatureScript;
 }
 validatePublicAssetPlan(plan);plan.transaction.finalize();return plan.transaction;
}
export function kaspirePublicAssetSigningRequest(plan,index=0){
 validatePublicAssetPlan(plan);const signer=plan.signers[index];if(!signer)throw new Error('Unknown signer.');
 const params={psktTransactionJson:plan.transaction.serializeToSafeJSON(),submitTransaction:false,signInputs:[{index,sighashType:1}]};
 if(signer.kind!=='native'){const group=signatureContext(plan,index),asset=(plan.tokens??plan.receipts)[index],c=asset.artifact.contracts[asset.contractName],entry=c.entries[group.leader?c.cov_decl_to_abi.move:c.delegate_entry_abi];const args=assetArguments(asset,group.states,group.operation,plan.sponsor,group.leader);args.push({type:'data',hex:entry.dispatch_tag});params.scripts=[{inputIndex:index,scriptHex:asset.script,signatureScript:{mode:'ordered-args',args}}];}
 return {method:'signPskt',params};
}
function pushes(script){const a=hexBytes(script),out=[];let i=0;while(i<a.length){const op=a[i++];let n;if(op===0){out.push('');continue;}if(op>=81&&op<=96){out.push((op-80).toString(16).padStart(2,'0'));continue;}if(op<76)n=op;else if(op===76)n=a[i++];else if(op===77){n=a[i]+256*a[i+1];i+=2;}else throw new Error('Invalid wallet script.');if(!Number.isSafeInteger(n)||i+n>a.length)throw new Error('Truncated wallet script.');out.push(bytesHex(a.slice(i,i+n)));i+=n;}return out;}
export function acceptKaspirePublicAssetSignature(sdk,plan,index,result){
 validatePublicAssetPlan(plan);if(!plan.signers[index])throw new Error('Unknown signer.');const json=typeof result==='string'?result:result.psktTransactionJson;if(typeof json!=='string')throw new Error('Wallet returned no transaction.');const returned=sdk.Transaction.deserializeFromSafeJSON(json);
 if(shape(returned)!==shape(plan.transaction)||returned.inputs.some((input,n)=>n!==index&&input.signatureScript!==plan.transaction.inputs[n].signatureScript))throw new Error('Wallet changed transaction or prior signatures.');
 const script=returned.inputs[index].signatureScript,p=pushes(script),raw=plan.signers[index].kind==='native'?p[0]:p.at(-3);
 if(scriptFor(plan,index,raw)!==script)throw new Error('Wallet changed covenant arguments.');plan.transaction.inputs[index].signatureScript=script;reviews.get(plan).completed.add(index);reviews.get(plan).scripts[index]=script;plan.transaction.finalize();return {...validatePublicAssetPlan(plan),transaction:plan.transaction};
}
export function buildPublicPayment(sdk,{fundingUtxos,owner,recipient,amount,recipients,feeRate=100}){
 if(recipients!==undefined&&(recipient!==undefined||amount!==undefined||!Array.isArray(recipients)||recipients.length!==2))throw new Error('Choose exactly two split recipients, or one ordinary recipient.');
 const key=value=>{if(typeof value!=='string'||!/^([0-9a-f]{64})$/i.test(value))throw new Error('Payment recipient must be an x-only public key.');return value.toLowerCase();};
 owner=key(owner);const destinations=(recipients??[{recipient,amount}]).map(r=>{if(!r||typeof r!=='object'||Object.keys(r).some(k=>!['recipient','amount'].includes(k)))throw new Error('Invalid payment recipient.');const value=BigInt(r.amount);if(value<=0n||value>100000000n)throw new Error('Payment must be positive and at most 1 tKAS.');return {recipient:key(r.recipient),amount:String(value)};});
 if(new Set(destinations.map(r=>r.recipient)).size!==destinations.length)throw new Error('Split recipients must be distinct.');
 const value=destinations.reduce((sum,r)=>sum+BigInt(r.amount),0n);if(value<=0n||value>100000000n)throw new Error('Payment must be positive and at most 1 tKAS.');
 const script=key=>sdk.payToAddressScript(new sdk.PublicKey('02'+key).toAddress('testnet-10'));
 const owned=script(owner);if(!fundingUtxos.length||fundingUtxos.some(u=>u.entry?.covenantId||u.entry?.scriptPublicKey.script!==owned.script))throw new Error('Payment funding must belong to the selected account.');
 const total=fundingUtxos.reduce((s,u)=>s+u.amount,0n);let fee=1000n;
 for(let attempt=0;attempt<3;attempt++){
  const change=total-value-fee;if(change<0n||fee>1000000n)throw new Error('Insufficient payment funds or fee limit.');
  const outputs=destinations.map(r=>({value:BigInt(r.amount),scriptPublicKey:script(r.recipient)}));if(change)outputs.push({value:change,scriptPublicKey:owned});
  const transaction=new sdk.Transaction({version:1,inputs:fundingUtxos.map(u=>({previousOutpoint:u.outpoint,utxo:u,signatureScript:pushPublicData(dummy),sequence:0n,sigOpCount:0,computeBudget:16})),outputs,lockTime:0n,subnetworkId:'00'.repeat(20),gas:0n,payload:''});
  const mass=publicTransactionMass(transaction,{feeRate});if(fee<BigInt(mass.minimumFee)){fee=BigInt(mass.minimumFee);continue;}
  const plan={network:'testnet-10',transaction,tokens:[],states:[],operation:null,fee:String(fee),signers:fundingUtxos.map((_,index)=>({index,kind:'native',owner})),payment:recipients?{owner,recipients:destinations,amount:String(value)}:{owner,recipient:destinations[0].recipient,amount:String(value)}};Object.defineProperty(plan,'sdk',{value:sdk});return preparePublicAssetPlan(plan,{feeRate});
 }throw new Error('Payment fee did not converge.');
}
