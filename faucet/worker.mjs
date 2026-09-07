/*!
Bundled Kaspa SDK:
ISC License

Copyright (c) 2022-2024 Kaspa developers

Permission to use, copy, modify, and distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
*/
import * as sdk from '../.cache/upstream/kaspa-wasm32-sdk/web/kaspa/kaspa.js';
import wasm from '../.cache/upstream/kaspa-wasm32-sdk/web/kaspa/kaspa_bg.wasm';
import {NETWORK,CLAIM_AMOUNT,validateClaim,buildFaucetPayment,validateFaucetPayment} from './policy.mjs';

let loaded;
async function loadSDK(){return loaded??=sdk.default({module_or_path:wasm});}
const json=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
const bounded=async(promise,ms=10000)=>{
 let timer;try{return await Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('Node timeout')),ms);})]);}finally{clearTimeout(timer);}
};
export class FaucetWallet{
 constructor(ctx,env){this.ctx=ctx;this.env=env;this.tail=Promise.resolve();}
 async fetch(request){
  const task=this.tail.then(()=>this.handle(request));this.tail=task.catch(()=>{});return task;
 }
 async handle(request){
  const url=new URL(request.url),storage=this.ctx.storage;
  let rpc;
  try{
   if(url.pathname==='/api/status'&&this.cachedStatus&&Date.now()-this.cachedStatus.at<15000)return json(this.cachedStatus.body);
   await loadSDK();
   if(!this.env.FAUCET_KEY)return json({network:NETWORK,enabled:false,claims:0,remainingClaims:0,message:'Test-coin funding is being connected.'});
   const key=new sdk.PrivateKey(this.env.FAUCET_KEY),address=key.toAddress(NETWORK).toString();
   let state=await storage.get('state')||{address,claims:0,pending:null};
   if(state.address!==address)throw new Error('Faucet key changed');
   rpc=new sdk.RpcClient({url:'wss://muon-10.kaspa.blue/kaspa/testnet-10/wrpc/borsh',networkId:NETWORK});
   await bounded(rpc.connect({blockAsyncConnect:true,timeoutDuration:6000}));
   const info=await bounded(rpc.getServerInfo());
   if(info.networkId!==NETWORK||!info.isSynced||!info.hasUtxoIndex)throw new Error('Wrong or unsynchronized network');
   let {entries}=await bounded(rpc.getUtxosByAddresses([address]));
   if(state.pending){
    const pending=state.pending;
    if(entries.some(e=>e.outpoint.transactionId===pending.transactionId&&e.outpoint.index===1&&String(e.amount)===pending.change&&e.entry.scriptPublicKey.version===0&&e.entry.scriptPublicKey.script===pending.changeScript&&!e.entry.covenantId)){
     const claim={...pending,status:'accepted',observedAt:Date.now()};delete claim.transaction;delete claim.changeScript;
     state={...state,claims:state.claims+1,pending:null};
     await storage.put({'state':state,[`address:${claim.address}`]:claim,[`id:${claim.requestId}`]:claim});
    }
   }
   const balance=entries.reduce((sum,e)=>sum+BigInt(e.amount),0n),limit=Math.min(1000,Number(this.env.MAX_CLAIMS)||1000);
   const status={network:NETWORK,enabled:this.env.ENABLED==='true',connected:true,claims:state.claims,pending:state.pending?1:0,remainingClaims:Math.max(0,Math.min(limit-state.claims-(state.pending?1:0),Number(balance/(CLAIM_AMOUNT+1000000n)))),amount:String(CLAIM_AMOUNT)};
   if(url.pathname==='/api/status'){this.cachedStatus={at:Date.now(),body:status};return json(status);}
   let body;
   try{body=validateClaim(await request.json(),sdk);}catch{return json({error:'Use the test wallet created on this page.'},400);}
   const priorByID=await storage.get(`id:${body.requestId}`),prior=await storage.get(`address:${body.address}`);
   if(priorByID&&priorByID.address!==body.address)return json({error:'This request belongs to another test wallet.'},409);
   if(prior){
    if(status.enabled&&prior.status!=='accepted'&&state.pending?.transactionId===prior.transactionId&&(prior.attempts||0)<3&&Date.now()-(prior.attemptedAt||0)>15000){
     // Recovery broadcasts only the journal's original signed bytes. A repeated
     // click or a crash never creates another payment for this wallet.
     const tx=sdk.Transaction.deserializeFromSafeJSON(prior.transaction);
     validateFaucetPayment(sdk,tx,{destination:prior.address,changeAddress:address,feeRate:prior.feeRate});
     if(tx.id!==prior.transactionId)throw new Error('Saved transaction identity mismatch');
     prior.attempts=(prior.attempts||0)+1;prior.attemptedAt=Date.now();state.pending=prior;
     await storage.put({'state':state,[`address:${prior.address}`]:prior,[`id:${prior.requestId}`]:prior});
     try{const result=await bounded(rpc.submitTransaction({transaction:tx,allowOrphan:false}));if(result.transactionId!==prior.transactionId)throw new Error('Unexpected transaction ID');}catch{}
    }
    return json(this.receipt(prior),prior.status==='accepted'?200:202);
   }
   if(!status.enabled)return json({error:'Test-coin funding is temporarily paused. Please try again later.'},503);
   if(state.pending)return json({error:'Another test wallet is being funded. Please try again in a moment.'},503);
   if(state.claims>=limit||balance<=CLAIM_AMOUNT+1000000n)return json({error:'The demo wallet needs more test coins. Please try again after it is refilled.'},503);
   if(body.address===address)return json({error:'Create a fresh test wallet first.'},400);
   const ip=request.headers.get('X-Faucet-Client')||'unknown';
   const hmacKey=await crypto.subtle.importKey('raw',new TextEncoder().encode(this.env.RATE_SALT||this.env.FAUCET_KEY),{name:'HMAC',hash:'SHA-256'},false,['sign']);
   const digest=await crypto.subtle.sign('HMAC',hmacKey,new TextEncoder().encode(ip));
   const client=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join(''),day=Math.floor(Date.now()/86400000),bucketKey=`rate:${client}`;
   const saved=await storage.get(bucketKey),bucket=saved?.day===day?saved:{day,count:0};
   if(bucket.count>=20)return json({error:'This connection has funded 20 test wallets today. Continue with one you already created, or return tomorrow.'},429);
   const estimate=await bounded(rpc.getFeeEstimate()),feeRate=Math.max(100,Math.ceil(estimate.estimate.priorityBucket.feerate));
   const payment=buildFaucetPayment(sdk,{entries,destination:body.address,changeAddress:address,feeRate}),tx=payment.transaction;
   for(let index=0;index<tx.inputs.length;index++)tx.inputs[index].signatureScript=sdk.createInputSignature(tx,index,key);
   validateFaucetPayment(sdk,tx,{destination:body.address,changeAddress:address,feeRate});tx.finalize();
   const claim={...body,transactionId:tx.id,transaction:tx.serializeToSafeJSON(),change:String(payment.change),changeScript:tx.outputs[1].scriptPublicKey.script,amount:String(CLAIM_AMOUNT),fee:String(payment.fee),feeRate,createdAt:Date.now(),attemptedAt:Date.now(),attempts:1,status:'pending'};
   state={...state,pending:claim};
   // This atomic journal is committed before any network submission. An uncertain
   // broadcast reserves the wallet; no second transaction can reuse its inputs.
   await storage.put({'state':state,[`address:${body.address}`]:claim,[`id:${body.requestId}`]:claim,[bucketKey]:{day,count:bucket.count+1}});
   this.cachedStatus=null;
   try{
    const submitted=await bounded(rpc.submitTransaction({transaction:tx,allowOrphan:false}));
    if(submitted.transactionId!==claim.transactionId)throw new Error('Unexpected transaction ID');
    claim.status='submitted';state.pending=claim;
    await storage.put({'state':state,[`address:${body.address}`]:claim,[`id:${body.requestId}`]:claim});
   }catch{return json(this.receipt(claim),202);}
   return json(this.receipt(claim),202);
  }catch{return json({network:NETWORK,error:'The test network did not respond. Your existing request is preserved; please check again.'},503);}
  finally{if(rpc)await rpc.disconnect().catch(()=>{});}
 }
 receipt(claim){return {network:NETWORK,transactionId:claim.transactionId,amount:String(CLAIM_AMOUNT),status:claim.status};}
}
export default{
 async fetch(request,env){
  const url=new URL(request.url),origin=request.headers.get('Origin');
  const allowed=origin==='https://answered-tear-homepage-spencer.trycloudflare.com'||origin==='https://kaspaexplained.com'||origin==='https://www.kaspaexplained.com'||/^http:\/\/(127\.0\.0\.1|localhost):(8898|8901|8904|8912)$/.test(origin||'');
  const headers={'Cache-Control':'no-store','Vary':'Origin',...(allowed?{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type'}:{})};
  if(request.method==='OPTIONS')return new Response(null,{status:allowed?204:403,headers});
  if(url.pathname==='/api/faucet'&&request.method==='POST'){
   if(!allowed)return json({error:'Open the applications page to get test coins.'},403);
   if(request.headers.get('Content-Type')?.split(';')[0]!=='application/json')return json({error:'JSON required'},415);
   const reader=request.body?.getReader();if(!reader)return json({error:'Request body required'},400);
   let length=0,parts=[];for(;;){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>2048){await reader.cancel();return json({error:'Request too large'},413);}parts.push(value);}
   request=new Request(request,{body:new Blob(parts),headers:{'Content-Type':'application/json','X-Faucet-Client':request.headers.get('CF-Connecting-IP')||'local'}});
  }else if(url.pathname!=='/api/status'||request.method!=='GET')return json({error:'Not found'},404);
  const result=await env.FAUCET.get(env.FAUCET.idFromName('testnet-10-v1')).fetch(request);
  return new Response(result.body,{status:result.status,headers:{...Object.fromEntries(result.headers),...headers}});
 }
};
