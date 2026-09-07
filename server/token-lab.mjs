// Custom Testnet-10 covenant tokens. No wallet access, RPC, broadcast, or key storage.
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {resolve} from 'node:path';
const execute=promisify(execFile), ROOT=resolve(import.meta.dirname,'..');
export const TOKEN_NETWORK='testnet-10';
const hex=(value,bytes)=>{if(typeof value!=='string'||!new RegExp(`^[0-9a-f]{${bytes*2}}$`,'i').test(value))throw new Error(`Expected ${bytes}-byte hex.`);return value.toLowerCase();};
const integer=(value,min=0,max=1000000000)=>{if(!Number.isSafeInteger(value)||value<min||value>max)throw new Error('Invalid token integer.');return value;};
const amount=value=>{const n=BigInt(value);if(n<0n||n>18446744073709551615n)throw new Error('Invalid sompi amount.');return n;};
export function tokenState(value){return {owner:hex(value.owner,32),quantity:integer(value.quantity),isMinter:typeof value.isMinter==='boolean'?value.isMinter:(()=>{throw new Error('Invalid minter flag.');})()};}
export function pushTokenData(value){
 const bytes=Buffer.isBuffer(value)?value:Buffer.from(value,'hex'),n=bytes.length;
 if(n===0)return '00';if(n===1&&bytes[0]>=1&&bytes[0]<=16)return (0x50+bytes[0]).toString(16);if(n===1&&bytes[0]===0x81)return '4f';
 if(n<76)return Buffer.concat([Buffer.from([n]),bytes]).toString('hex');
 if(n<=255)return Buffer.concat([Buffer.from([76,n]),bytes]).toString('hex');
 if(n<=65535){const h=Buffer.alloc(3);h[0]=77;h.writeUInt16LE(n,1);return Buffer.concat([h,bytes]).toString('hex');}
 throw new Error('Script push exceeds this application limit.');
}
function scriptInteger(n){integer(n);if(n===0)return '00';let x=BigInt(n),b=[];while(x){b.push(Number(x&255n));x>>=8n;}if(b.at(-1)&128)b.push(0);return pushTokenData(Buffer.from(b));}
function fixedInteger(n){const b=Buffer.alloc(8);b.writeBigUInt64LE(BigInt(integer(n)));return b;}
export function tokenSignatureScript(token,states,operation,signature,isLeader=true){
 hex(signature,65);const c=token.artifact.contracts.CappedToken;
 const args=isLeader?[
  pushTokenData(Buffer.concat(states.map(s=>Buffer.from(s.owner,'hex')))),
  pushTokenData(Buffer.concat(states.map(s=>fixedInteger(s.quantity)))),
  pushTokenData(Buffer.from(states.map(s=>s.isMinter?1:0))),scriptInteger(operation),pushTokenData(signature)
 ]:[pushTokenData(signature)];
 const entry=c.entries[isLeader?c.cov_decl_to_abi.move:c.delegate_entry_abi];
 return args.join('')+pushTokenData(entry.dispatch_tag)+pushTokenData(token.script);
}
export async function compileToken({issuer,cap,state}){
 issuer=hex(issuer,32);cap=integer(cap,1);state=tokenState(state);
 if(state.quantity>cap||state.isMinter&&state.owner!==issuer||!state.isMinter&&state.quantity===0)throw new Error('Invalid token state.');
 const directory=await mkdtemp(resolve(ROOT,'.cache','token-compile-'));
 try{
  const args=[{kind:'bytes',value:[...Buffer.from(issuer,'hex')]},{kind:'int',value:cap},{kind:'bytes',value:[...Buffer.from(state.owner,'hex')]},{kind:'int',value:state.quantity},{kind:'bool',value:state.isMinter}];
  const input=resolve(directory,'args.json'),output=resolve(directory,'artifact.json');await writeFile(input,JSON.stringify(args));
  await execute(resolve(ROOT,'.cache/upstream/silverc'),[resolve(ROOT,'contracts/capped-token.sil'),'--constructor-args',input,'-o',output],{timeout:30000,maxBuffer:1000000});
  const artifact=JSON.parse(await readFile(output,'utf8'));if(artifact.compiler_version!=='0.1.0')throw new Error('Unexpected compiler artifact.');
  return {issuer,cap,state,script:Buffer.from(artifact.contracts.CappedToken.compiled.bytecode).toString('hex'),artifact};
 }finally{await rm(directory,{recursive:true,force:true});}
}
const covenantId=utxo=>utxo.entry?.covenantId?.toString()??utxo.covenantId?.toString()??utxo.covenant_id;
const utxoSpk=utxo=>utxo.entry?.scriptPublicKey??utxo.scriptPublicKey;
const outpoint=utxo=>utxo.outpoint;
function input(utxo,computeBudget){if(!utxo||!outpoint(utxo))throw new Error('UTXO reference required.');return {previousOutpoint:outpoint(utxo),signatureScript:'',sequence:0n,sigOpCount:0,computeBudget,utxo};}
function plainOutput(sdk,address,value){const spk=sdk.payToAddressScript(new sdk.Address(address));if(!address.startsWith('kaspatest:'))throw new Error('Testnet destination required.');return {value:amount(value),scriptPublicKey:spk};}
function tx(sdk,inputs,outputs){return new sdk.Transaction({version:1,inputs,outputs,lockTime:0n,subnetworkId:'00'.repeat(20),gas:0n,payload:''});}
function checkValue(inputs,outputs,fee){const total=inputs.reduce((s,u)=>s+amount(u.amount),0n),paid=outputs.reduce((s,o)=>s+amount(o.value),0n);if(total!==paid+fee)throw new Error('Inputs must equal outputs plus the reviewed fee.');}
function identity(t){return `${t.issuer}:${t.cap}`;}
function policy(before,after,operation){
 if(before.length<1||before.length>2||after.length<1||after.length>2)throw new Error('Token fanout is one or two.');
 if([...before,...after].some(t=>identity(t)!==identity(before[0])))throw new Error('Token template mismatch.');
 const b=before.map(t=>t.state),a=after.map(t=>t.state),total=s=>s.reduce((n,x)=>n+x.quantity,0);
 if(total(b)>before[0].cap||total(a)>before[0].cap)throw new Error('Token cap exceeded.');
 if(operation===0){if([...a,...b].some(s=>s.isMinter)||total(a)!==total(b))throw new Error('Transfer must conserve holder units.');}
 else if(operation===1){if(b.length!==1||!b[0].isMinter||a.length!==2||!a[0].isMinter||a[1].isMinter||total(a)!==total(b))throw new Error('Invalid mint.');}
 else if(operation===2){if(b.length!==2||!b[0].isMinter||b[1].isMinter||a.length!==1||!a[0].isMinter||a[0].quantity!==b[0].quantity)throw new Error('Invalid joint burn.');}
 else throw new Error('Unknown operation.');
}
export function buildTokenGenesis(sdk,{fundingUtxos,token,cellAmount,fee,changeAddress,computeBudget=16}){
 if(!token.state.isMinter||token.state.owner!==token.issuer||token.state.quantity!==token.cap)throw new Error('Genesis must contain one issuer-owned minter at the cap.');
 if(!fundingUtxos.length||fundingUtxos.some(covenantId))throw new Error('Genesis needs plain funding UTXOs.');
 fee=amount(fee);cellAmount=amount(cellAmount);const total=fundingUtxos.reduce((s,u)=>s+amount(u.amount),0n),change=total-cellAmount-fee;if(cellAmount===0n||change<0n)throw new Error('Insufficient genesis funds.');
 const outputs=[{value:cellAmount,scriptPublicKey:sdk.payToScriptHashScript(token.script)}];if(change>0n)outputs.push(plainOutput(sdk,changeAddress,change));
 const transaction=tx(sdk,fundingUtxos.map(u=>input(u,computeBudget)),outputs);transaction.populateGenesisCovenants([{authorizingInput:0,outputs:[0]}]);
 const id=sdk.covenantId(transaction.inputs[0].previousOutpoint,[{index:0,output:transaction.outputs[0]}]).toString();if(transaction.outputs[0].covenant.covenantId.toString()!==id)throw new Error('Genesis covenant mismatch.');
 return plan(sdk,transaction,fee,id,[],[],null,fundingUtxos.map((_,index)=>({index,kind:'native'})));
}
export function buildTokenMove(sdk,{tokenInputs,successors,operation,fundingUtxos=[],payments=[],fee,computeBudget=16}){
 policy(tokenInputs.map(i=>i.token),successors.map(i=>i.token),operation);
 const id=covenantId(tokenInputs[0].utxo);if(!id)throw new Error('Token UTXO has no covenant ID; preserve SDK UTXO references.');
 for(const i of tokenInputs){if(covenantId(i.utxo)!==id)throw new Error('Mixed token covenant IDs.');if(utxoSpk(i.utxo).script!==sdk.payToScriptHashScript(i.token.script).script)throw new Error('Input script does not match token state.');}
 if(fundingUtxos.some(covenantId))throw new Error('Fee funding inputs must be plain.');
 const all=[...tokenInputs.map(i=>i.utxo),...fundingUtxos],outputs=successors.map(s=>({value:amount(s.amount),scriptPublicKey:sdk.payToScriptHashScript(s.token.script),covenant:{authorizingInput:0,covenantId:id}}));
 outputs.push(...payments.map(p=>plainOutput(sdk,p.address,p.amount)));fee=amount(fee);checkValue(all,outputs,fee);
 const transaction=tx(sdk,all.map(u=>input(u,computeBudget)),outputs);
 // Confirm the SDK retained covenant output bindings instead of silently dropping them.
 successors.forEach((_,i)=>{if(transaction.outputs[i].covenant?.covenantId.toString()!==id)throw new Error('SDK dropped covenant output binding.');});
 const signers=all.map((_,index)=>({index,kind:index<tokenInputs.length?'token':'native',owner:tokenInputs[index]?.token.state.owner}));
 return plan(sdk,transaction,fee,id,tokenInputs.map(i=>i.token),successors.map(s=>s.token.state),operation,signers);
}
export function buildTokenExchange(sdk,{sellerToken, buyerFundingUtxos,buyerToken,price,sellerAddress,buyerChangeAddress,fee,computeBudget=16}){
 if(sellerToken.token.state.isMinter||buyerToken.state.isMinter||sellerToken.token.state.quantity!==buyerToken.state.quantity)throw new Error('Exchange transfers the complete holder cell.');
 price=amount(price);fee=amount(fee);if(price===0n)throw new Error('Exchange price must be positive.');
 const funds=buyerFundingUtxos.reduce((s,u)=>s+amount(u.amount),0n),change=funds-price-fee;if(change<0n)throw new Error('Buyer cannot cover price and fee.');
 const payments=[{address:sellerAddress,amount:price}];if(change>0n)payments.push({address:buyerChangeAddress,amount:change});
 const result=buildTokenMove(sdk,{tokenInputs:[sellerToken],successors:[{token:buyerToken,amount:sellerToken.utxo.amount}],operation:0,fundingUtxos:buyerFundingUtxos,payments,fee,computeBudget});
 result.exchange={price:String(price),sellerAddress,buyerChangeAddress,tokenQuantity:buyerToken.state.quantity};return result;
}
function plan(sdk,transaction,fee,id,tokens,states,operation,signers){
 const seen=new Set();for(const i of transaction.inputs){const key=`${i.previousOutpoint.transactionId}:${i.previousOutpoint.index}`;if(seen.has(key))throw new Error('Duplicate input outpoint.');seen.add(key);}
 const result={network:TOKEN_NETWORK,transaction,fee:String(fee),covenantId:id,tokens,states,operation,signers};Object.defineProperty(result,'sdk',{value:sdk});return result;
}
function reviewedShape(transaction){const value=JSON.parse(transaction.serializeToSafeJSON());for(const i of value.inputs)delete i.signatureScript;return JSON.stringify(value);}
export function preflightTokenPlan(sdk,plan,{maxFee=10000000n,feeRate=100,requireReady=false}={}){
 if(plan.network!==TOKEN_NETWORK)throw new Error('Testnet-only plan.');
 for(const signer of plan.signers){if(!plan.transaction.inputs[signer.index].signatureScript)plan.transaction.inputs[signer.index].signatureScript=signer.kind==='token'?tokenSignatureScript(plan.tokens[signer.index],plan.states,plan.operation,'00'.repeat(64)+'01',signer.index===0):pushTokenData('00'.repeat(64)+'01');}
 const mass=tokenPlanMass(sdk,plan,{feeRate}),fee=BigInt(plan.fee),ready=mass.consensus.withinBlockLimits&&fee>=BigInt(mass.consensus.minimumFee)&&fee<=BigInt(maxFee);
 plan.transaction.storageMass=BigInt(mass.consensus.storageMass);
 if(requireReady&&!ready)throw new Error(!mass.consensus.withinBlockLimits?'Token transaction exceeds the pinned Testnet-10 block mass limits.':fee>BigInt(maxFee)?'Token fee exceeds the caller safety limit.':'Token fee is below the pinned node relay estimate.');
 return {...mass,fee:String(fee),maxFee:String(maxFee),ready};
}
export async function signTokenPlan(plan,signInput,{unfundedFixture=false,maxFee=10000000n,feeRate=100}={}){
 if(plan.network!==TOKEN_NETWORK)throw new Error('Testnet-only plan.');
 if(!unfundedFixture)preflightTokenPlan(plan.sdk,plan,{maxFee,feeRate,requireReady:true});
 const reviewed=reviewedShape(plan.transaction);
 for(const signer of plan.signers){let signature=await signInput(plan.transaction,signer.index,signer);if(reviewedShape(plan.transaction)!==reviewed)throw new Error('Signer changed the reviewed transaction.');if(/^41[0-9a-f]{130}$/i.test(signature))signature=signature.slice(2);hex(signature,65);if(signature.slice(-2)!=='01')throw new Error('Token signing requires SIGHASH_ALL.');
  plan.transaction.inputs[signer.index].signatureScript=signer.kind==='token'?tokenSignatureScript(plan.tokens[signer.index],plan.states,plan.operation,signature,signer.index===0):pushTokenData(signature);
 }
 plan.transaction.finalize();return plan.transaction;
}
// Pinned rusty-kaspa a41a333 / SDK 2.0.1 Testnet-10 post-Toccata rules.
// Sources: consensus/core/src/mass/mod.rs, config/params.rs and
// mining/src/mempool/check_transaction_standard.rs. Cross-checked by token_vm.rs.
export function tokenConsensusMass(transaction,{feeRate=100}={}){
 if(transaction.version!==1||transaction.payload!==''||transaction.subnetworkId!=='00'.repeat(20)||transaction.gas!==0n)throw new Error('Mass helper supports only native v1 empty-payload token transactions.');
 if(!Number.isFinite(feeRate)||feeRate<100||feeRate>100000)throw new Error('Invalid relay fee rate.');
 const inputs=transaction.inputs,outputs=transaction.outputs;if(!inputs.length||!outputs.length)throw new Error('Inputs and outputs required.');
 const inputCells=inputs.map(i=>{const entry=i.utxo?.entry;if(!entry)throw new Error('Complete UTXO references required.');return {value:amount(i.utxo.amount),plurality:BigInt(Math.ceil((63+entry.scriptPublicKey.script.length/2+(entry.covenantId?32:0))/100))};});
 const outputCells=outputs.map(o=>({value:amount(o.value),plurality:BigInt(Math.ceil((63+o.scriptPublicKey.script.length/2+(o.covenant?32:0))/100))}));
 if([...inputCells,...outputCells].some(c=>c.value===0n))throw new Error('Zero-value output or input.');
 const size=94+inputs.reduce((s,i)=>s+54+(i.signatureScript?.length??0)/2,0)+outputs.reduce((s,o)=>s+18+o.scriptPublicKey.script.length/2+(o.covenant?34:0),0);
 const computeMass=size+outputs.reduce((s,o)=>s+(2+o.scriptPublicKey.script.length/2)*10,0)+inputs.reduce((s,i)=>s+integer(i.computeBudget,0,65535)*100,0);
 const transientMass=size*4,normalizedTransientMass=size*2;
 const C=1000000000000n,pOut=outputCells.reduce((s,c)=>s+c.plurality,0n),pIn=inputCells.reduce((s,c)=>s+c.plurality,0n);
 const harmonic=cells=>cells.reduce((s,c)=>s+C*c.plurality*c.plurality/c.value,0n),hOut=harmonic(outputCells);
 let inTerm;if(pOut===1n||pIn===1n||pOut===2n&&pIn===2n)inTerm=harmonic(inputCells);else{const sum=inputCells.reduce((s,c)=>s+c.value,0n),mean=sum/pIn;inTerm=pIn*(C/(mean>0n?mean:1n));}
 const storageMass=hOut>inTerm?hOut-inTerm:0n;
 const minimumFee=BigInt(Math.ceil(Math.max(computeMass,normalizedTransientMass)*feeRate))+1000n;
 return {estimatedBytes:size,computeMass,transientMass,normalizedTransientMass,storageMass:String(storageMass),feeRate,minimumFee:String(minimumFee),withinBlockLimits:computeMass<=500000&&transientMass<=1000000&&storageMass<=500000n};
}
export function tokenPlanMass(sdk,plan,options={}){
 const feeEstimate=sdk.calculateTransactionFee(TOKEN_NETWORK,plan.transaction,1)?.toString()??null;
 return {sdkFeeEstimate:feeEstimate,sdkWithinLegacyLimit:feeEstimate!==null,consensus:tokenConsensusMass(plan.transaction,options)};
}
