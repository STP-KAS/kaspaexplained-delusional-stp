// Pure adapter orchestration plus loopback HTTP. No chain, faucet or wallet calls.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createServer,request} from 'node:http';
import {createWrapPoc} from '../server/wrap-poc.mjs';
const depositId='0x'+'11'.repeat(32),covenantId='22'.repeat(32),burnId='33'.repeat(32),acceptingBlock='44'.repeat(32);
async function fixture(options={}){
 const directory=await mkdtemp(join(tmpdir(),'wrap-poc-test-'));
 const source={network:'Local Ethereum test chain',networkMode:'local',chainId:31337,ready:true,gasBalanceWei:'1',balances:{user:'0',vault:'100000000',pip:'0'},deposit:{id:depositId,finalized:true,released:false}};
 const state={network:'testnet-10',pending:false,balancesSompi:['100000000'],owners:['55'.repeat(32)],addresses:['unused'],covenantId,init:{accepted:true},mint:null,transfer:null,burn:null};
 const calls={verify:0,mint:0,burn:0,release:0,check:0};
 const evm={status:async()=>structuredClone(source),verifyDeposit:async id=>{calls.verify++;assert.equal(id,depositId);if(!source.deposit.finalized)throw Error('Source not finalized');return {verified:true};},release:async(id,burn)=>{calls.release++;assert.equal(id,depositId);assert.equal(burn,burnId);source.deposit.released=true;},close:async()=>{}};
 const kaspa={status:async()=>structuredClone(state),mint:async()=>{calls.mint++;state.mint={accepted:true};},burn:async()=>{calls.burn++;},check:async()=>{calls.check++;},close:async()=>{}};
 const app=await createWrapPoc({directory,sourceNetwork:'local',evmAdapter:evm,kaspaAdapter:kaspa,...options});
 return {app,source,state,calls,evm,kaspa,async close(){await app.close();await rm(directory,{recursive:true,force:true});}};
}

test('nonfinalized deposits never reach the Kaspa mint adapter',async()=>{
 const f=await fixture();try{f.source.deposit.finalized=false;assert((await f.app.view()).actions.find(a=>a.id==='mint').disabled);await assert.rejects(f.app.act('mint'),/not finalized/);assert.equal(f.calls.mint,0);assert.equal(f.calls.release,0);}finally{await f.close();}
});
test('pending, mismatched and unaccepted burns cannot release source tokens',async()=>{
 for(const burn of [null,{accepted:false},{accepted:true,acceptingBlock,depositId:'other',covenantId,transactionId:burnId},{accepted:true,acceptingBlock,depositId,covenantId:'other',transactionId:burnId},{accepted:true,depositId,covenantId,transactionId:burnId}]){
  const f=await fixture();try{f.state.mint={accepted:true};f.state.transfer={accepted:true};f.state.burn=burn;await assert.rejects(f.app.act('redeem'),/burn is not accepted/);assert.equal(f.calls.release,0);assert.equal(f.source.deposit.released,false);}finally{await f.close();}
 }
 const f=await fixture();try{f.state.mint={accepted:true};f.state.transfer={accepted:true};f.state.pending=true;await assert.rejects(f.app.act('redeem'),/pending/);assert.equal(f.calls.burn,0);assert.equal(f.calls.release,0);}finally{await f.close();}
});
test('accepted matching burn releases exactly once; repeated redeemed action is read-only',async()=>{
 const f=await fixture();try{f.state.mint={accepted:true};f.state.transfer={accepted:true};f.state.burn={accepted:true,acceptingBlock,depositId,covenantId,transactionId:burnId};assert.equal((await f.app.act('redeem')).stage,'redeemed');await f.app.act('redeem');assert.equal(f.calls.release,1);}finally{await f.close();}
});
test('one action mutex blocks duplicate mint while oracle verification is in flight',async()=>{
 const f=await fixture();let unblock;try{f.evm.verifyDeposit=()=>new Promise(resolve=>{unblock=()=>resolve({verified:true});});const running=f.app.act('mint');while(!unblock)await new Promise(resolve=>setImmediate(resolve));await assert.rejects(f.app.act('mint'),/already running/);assert.equal(f.calls.mint,0);unblock();await running;assert.equal(f.calls.mint,1);}finally{unblock?.();await f.close();}
});
test('mainnet source selection is rejected before adapter use',async()=>{
 await assert.rejects(createWrapPoc({sourceNetwork:'mainnet',evmAdapter:{},kaspaAdapter:{}}),/Only test networks/);
});
function http(port,path,{method='GET',headers={},body}={}){return new Promise((resolve,reject)=>{const req=request({hostname:'127.0.0.1',port,path,method,headers},res=>{let text='';res.on('data',d=>text+=d);res.on('end',()=>resolve({status:res.statusCode,headers:res.headers,text}));});req.on('error',reject);req.end(body);});}
test('loopback HTTP requires matching Host, Origin and capability for actions',async()=>{
 // Reserve an available port before creating the app, whose Host policy includes the port.
 const probe=createServer();await new Promise(resolve=>probe.listen(0,'127.0.0.1',resolve));const port=probe.address().port;await new Promise(resolve=>probe.close(resolve));
 const f=await fixture({port});try{await new Promise(resolve=>f.app.server.listen(port,'127.0.0.1',resolve));
  const response=await http(port,'/api/wrap-poc/status');assert.equal(response.status,200);const view=JSON.parse(response.text);assert.match(view.capability,/^[0-9a-f]{64}$/);assert.doesNotMatch(response.text,/privateKey|mnemonic|"raw"/);assert.equal(response.headers['access-control-allow-origin'],undefined);
  const valid={origin:'http://127.0.0.1:'+port,'x-wrap-capability':view.capability,'content-type':'application/json'};
  for(const headers of [{...valid,origin:'https://evil.example'},{...valid,'x-wrap-capability':'00'.repeat(32)},{...valid,host:'evil.example'}])assert.equal((await http(port,'/api/wrap-poc/action',{method:'POST',headers,body:'{"action":"check"}'})).status,403);
  assert.equal(f.calls.check,0);assert.equal((await http(port,'/api/wrap-poc/action',{method:'POST',headers:valid,body:'{"action":"check","recipient":"evil"}'})).status,400);
  assert.equal((await http(port,'/api/wrap-poc/action',{method:'POST',headers:valid,body:'{"action":"check"}'})).status,200);assert.equal(f.calls.check,1);
  assert.equal((await http(port,'/.local/wrap-poc/sepolia-wallet.json')).status,404);
 }finally{await f.close();}
});
test('unexpected source release blocks mutations at the action boundary, not only buttons',async()=>{
 const f=await fixture();try{f.source.deposit.released=true;f.state.mint={accepted:true};let transfers=0;f.kaspa.transfer=async()=>{transfers++;};assert((await f.app.view()).actions.find(a=>a.id==='transfer').disabled);await assert.rejects(f.app.act('transfer'),/released|stopped|matching.*burn/i);assert.equal(transfers,0);await f.app.act('check');}finally{await f.close();}
});
