// Browser-only custom token builder. Network and wallet interaction belong to the UI.
import {instantiatePublicContract,pushPublicData,publicTransactionMass} from './public-contracts.mjs';
import {assetSignatureScript,publicAssetPlanMass,preparePublicAssetPlan,signPublicAssetPlan,validatePublicAssetPlan,kaspirePublicAssetSigningRequest,acceptKaspirePublicAssetSignature} from './public-asset-signing.mjs';
export const TOKEN_NETWORK='testnet-10';
// This application metadata is public in genesis; it does not declare a token standard.
export function normalizeTokenName(value){
 if(typeof value!=='string'||/[\p{Cc}\p{Cf}\p{Cs}]/u.test(value))throw new Error('Use a token name without control characters.');
 const name=value.normalize('NFC').trim().replace(/\s+/gu,' ');
 if(!name||Array.from(name).length>40||new TextEncoder().encode(name).length>120)throw new Error('Use a token name of 1–40 characters and at most 120 UTF-8 bytes.');
 return name;
}
export function tokenNamePayload(value){
 const bytes=new TextEncoder().encode(JSON.stringify({protocol:'kaspa-explained-token',version:1,name:normalizeTokenName(value)}));
 if(bytes.length>256)throw new Error('Token name metadata is too long.');
 return Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
}
export function readTokenNamePayload(payload){
 if(payload==='')return undefined;
 if(typeof payload!=='string'||payload.length>512||! /^(?:[0-9a-f]{2})+$/.test(payload))throw new Error('Invalid token name payload.');
 let value;try{value=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(payload.match(/../g),b=>Number.parseInt(b,16))));}catch{throw new Error('Invalid token name payload.');}
 if(!value||value.protocol!=='kaspa-explained-token'||value.version!==1||typeof value.name!=='string'||tokenNamePayload(value.name)!==payload)throw new Error('Unsupported or noncanonical token name payload.');
 return value.name;
}

export const pushTokenData=pushPublicData;
export function instantiatePublicToken(sdk,template,{issuer,cap,state}){const full={issuer,cap,owner:state.owner,quantity:state.quantity,isMinter:state.isMinter};return {...instantiatePublicContract(sdk,template,full),issuer,cap};}
export const tokenSignatureScript=(token,states,operation,signature,leader=true)=>assetSignatureScript(token,states,operation,null,signature,leader);
const hex=(value,bytes)=>{if(typeof value!=='string'||!new RegExp(`^[0-9a-f]{${bytes*2}}$`,'i').test(value))throw new Error(`Expected ${bytes}-byte hex.`);return value.toLowerCase();};
const integer=(value,min=0,max=1000000000)=>{if(!Number.isSafeInteger(value)||value<min||value>max)throw new Error('Invalid token integer.');return value;};
const amount=value=>{const n=BigInt(value);if(n<0n||n>18446744073709551615n)throw new Error('Invalid sompi amount.');return n;};
export function tokenState(value){return {owner:hex(value.owner,32),quantity:integer(value.quantity),isMinter:typeof value.isMinter==='boolean'?value.isMinter:(()=>{throw new Error('Invalid minter flag.');})()};}
const covenantId=utxo=>utxo.entry?.covenantId?.toString()??utxo.covenantId?.toString()??utxo.covenant_id;
const utxoSpk=utxo=>utxo.entry?.scriptPublicKey??utxo.scriptPublicKey;
const outpoint=utxo=>utxo.outpoint;
function input(utxo,computeBudget){if(!utxo||!outpoint(utxo))throw new Error('UTXO reference required.');return {previousOutpoint:outpoint(utxo),signatureScript:'',sequence:0n,sigOpCount:0,computeBudget,utxo};}
function plainOutput(sdk,address,value){const spk=sdk.payToAddressScript(new sdk.Address(address));if(!address.startsWith('kaspatest:'))throw new Error('Testnet destination required.');return {value:amount(value),scriptPublicKey:spk};}
function tx(sdk,inputs,outputs,payload=''){return new sdk.Transaction({version:1,inputs,outputs,lockTime:0n,subnetworkId:'00'.repeat(20),gas:0n,payload});}
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
function rawbuildTokenGenesis(sdk,{fundingUtxos,token,cellAmount,fee,changeAddress,computeBudget=16,tokenName}){
 if(!token.state.isMinter||token.state.owner!==token.issuer||token.state.quantity!==token.cap)throw new Error('Genesis must contain one issuer-owned minter at the cap.');
 if(!fundingUtxos.length||fundingUtxos.some(covenantId))throw new Error('Genesis needs plain funding UTXOs.');
 fee=amount(fee);cellAmount=amount(cellAmount);const total=fundingUtxos.reduce((s,u)=>s+amount(u.amount),0n),change=total-cellAmount-fee;if(cellAmount===0n||change<0n)throw new Error('Insufficient genesis funds.');
 const outputs=[{value:cellAmount,scriptPublicKey:sdk.payToScriptHashScript(token.script)}];if(change>0n)outputs.push(plainOutput(sdk,changeAddress,change));
 const payload=tokenName===undefined?'':tokenNamePayload(tokenName),transaction=tx(sdk,fundingUtxos.map(u=>input(u,computeBudget)),outputs,payload);transaction.populateGenesisCovenants([{authorizingInput:0,outputs:[0]}]);
 const id=sdk.covenantId(transaction.inputs[0].previousOutpoint,[{index:0,output:transaction.outputs[0]}]).toString();if(transaction.outputs[0].covenant.covenantId.toString()!==id)throw new Error('Genesis covenant mismatch.');
 const result=plan(sdk,transaction,fee,id,[],[],null,fundingUtxos.map((_,index)=>({index,kind:'native'})));result.genesis={issuer:token.issuer,cap:token.cap,state:token.state};if(payload)result.tokenName=readTokenNamePayload(payload);return result;
}
function rawbuildTokenMove(sdk,{tokenInputs,successors,operation,fundingUtxos=[],payments=[],fee,computeBudget=16}){
 policy(tokenInputs.map(i=>i.token),successors.map(i=>i.token),operation);
 const id=covenantId(tokenInputs[0].utxo);if(!id)throw new Error('Token UTXO has no covenant ID; preserve SDK UTXO references.');
 for(const i of tokenInputs){if(covenantId(i.utxo)!==id)throw new Error('Mixed token covenant IDs.');if(utxoSpk(i.utxo)?.version!==sdk.payToScriptHashScript(i.token.script).version||utxoSpk(i.utxo)?.script!==sdk.payToScriptHashScript(i.token.script).script)throw new Error('Input script does not match token state.');}
 if(fundingUtxos.some(covenantId))throw new Error('Fee funding inputs must be plain.');
 const all=[...tokenInputs.map(i=>i.utxo),...fundingUtxos],outputs=successors.map(s=>({value:amount(s.amount),scriptPublicKey:sdk.payToScriptHashScript(s.token.script),covenant:{authorizingInput:0,covenantId:id}}));
 outputs.push(...payments.map(p=>plainOutput(sdk,p.address,p.amount)));fee=amount(fee);checkValue(all,outputs,fee);
 const transaction=tx(sdk,all.map(u=>input(u,computeBudget)),outputs);
 // Confirm the SDK retained covenant output bindings instead of silently dropping them.
 successors.forEach((_,i)=>{if(transaction.outputs[i].covenant?.covenantId.toString()!==id)throw new Error('SDK dropped covenant output binding.');});
 const signers=all.map((_,index)=>({index,kind:index<tokenInputs.length?'token':'native',owner:tokenInputs[index]?.token.state.owner}));
 return plan(sdk,transaction,fee,id,tokenInputs.map(i=>i.token),successors.map(s=>s.token.state),operation,signers);
}
function rawbuildTokenExchange(sdk,{sellerToken, buyerFundingUtxos,buyerToken,price,sellerAddress,buyerChangeAddress,fee,computeBudget=16}){
 if(sellerToken.token.state.isMinter||buyerToken.state.isMinter||sellerToken.token.state.quantity!==buyerToken.state.quantity)throw new Error('Exchange transfers the complete holder cell.');
 price=amount(price);fee=amount(fee);if(price===0n)throw new Error('Exchange price must be positive.');
 const funds=buyerFundingUtxos.reduce((s,u)=>s+amount(u.amount),0n),change=funds-price-fee;if(change<0n)throw new Error('Buyer cannot cover price and fee.');
 const payments=[{address:sellerAddress,amount:price}];if(change>0n)payments.push({address:buyerChangeAddress,amount:change});
 const result=rawbuildTokenMove(sdk,{tokenInputs:[sellerToken],successors:[{token:buyerToken,amount:sellerToken.utxo.amount}],operation:0,fundingUtxos:buyerFundingUtxos,payments,fee,computeBudget});
 result.exchange={price:String(price),sellerAddress,buyerChangeAddress,tokenQuantity:buyerToken.state.quantity};return result;
}
function plan(sdk,transaction,fee,id,tokens,states,operation,signers){
 const seen=new Set();for(const i of transaction.inputs){const key=`${i.previousOutpoint.transactionId}:${i.previousOutpoint.index}`;if(seen.has(key))throw new Error('Duplicate input outpoint.');seen.add(key);}
 const result={network:TOKEN_NETWORK,transaction,fee:String(fee),covenantId:id,tokens,states,operation,signers};Object.defineProperty(result,'sdk',{value:sdk});return result;
}

export function buildTokenGenesis(sdk,options){return options.fee===undefined?converge(sdk,rawbuildTokenGenesis,options):preparePublicAssetPlan(rawbuildTokenGenesis(sdk,options),options);}
export function buildTokenMove(sdk,options){if(options.fee!==undefined)return preparePublicAssetPlan(rawbuildTokenMove(sdk,options),options);return converge(sdk,rawbuildTokenMove,options,true);}
export function buildTokenExchange(sdk,options){return options.fee===undefined?converge(sdk,rawbuildTokenExchange,options):preparePublicAssetPlan(rawbuildTokenExchange(sdk,options),options);}
export const signTokenPlan=signPublicAssetPlan;
export const preflightTokenPlan=(sdk,plan)=>({...validatePublicAssetPlan(plan),ready:true});
export const tokenConsensusMass=publicTransactionMass;
export const kaspireTokenSigningRequest=kaspirePublicAssetSigningRequest;
export const acceptKaspireTokenSignature=acceptKaspirePublicAssetSignature;

// With fee omitted, successor values are before fee; the last successor funds it.
function converge(sdk,build,options,subtractSuccessor=false){let fee=1n;for(let attempt=0;attempt<4;attempt++){const next={...options,fee};if(subtractSuccessor){const at=options.feeSuccessorIndex??options.successors.length-1;next.successors=options.successors.map((s,i)=>({...s,amount:BigInt(s.amount)-(i===at?fee:0n)}));}const plan=build(sdk,next),mass=publicAssetPlanMass(plan,options),required=BigInt(mass.minimumFee);if(fee===required)return preparePublicAssetPlan(plan,options);fee=required;}throw new Error('Token fee did not converge.');}
