import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {TestnetLab} from '../server/testnet.mjs';
import {publicTransaction,restoreSubmission,submissionJournal} from '../server/submission-journal.mjs';
import {bounded} from '../server/rpc-deadline.mjs';

const id='b'.repeat(64),serialized=JSON.stringify({id,inputs:[{previousOutpoint:{transactionId:'c'.repeat(64),index:0},signatureScript:'signed-fixture'}],outputs:[{value:'10000000',scriptPublicKey:'fixture'}]});
const sdk={PrivateKey:class{toAddress(){return {toString:()=> 'kaspatest:fixture'};}},Transaction:{deserializeFromSafeJSON:json=>({id:JSON.parse(json).id,finalize(){},serializeToSafeJSON:()=>json})}};
const release=lab=>{if(lab.release){process.removeListener('exit',lab.release);lab.release();}};
async function fixture(t){
  const directory=await mkdtemp(join(tmpdir(),'kaspa-journal-'));
  const lab=new TestnetLab({directory,loadSdk:()=>sdk});await lab.load();
  const request={id:'request',amount:'10000000',address:'kaspatest:recipient'};
  const pending={id,feeAmount:1000n,sign(){},serializeToSafeJSON:()=>serialized,submit:async()=>id};
  lab.state.requests.push(request);await lab.save();
  lab.previews.set('approve',{pending,request,expires:Date.now()+60000});
  lab.connected=action=>action({getServerInfo:async()=>({networkId:'testnet-10',isSynced:true,hasUtxoIndex:true}),getSink:async()=>({sink:'checkpoint'})});
  t.after(async()=>{release(lab);await rm(directory,{recursive:true,force:true});});
  return {lab,pending,directory};
}

test('signed journal remains private and rejects corrupted payload or identity',()=>{
  const record={id,network:'testnet-10',state:'uncertain',journal:submissionJournal({serializeToSafeJSON:()=>serialized})};
  assert.equal(restoreSubmission(sdk,record).id,id);
  const publicRecord=publicTransaction({...record,key:'not-public'});
  assert.equal(publicRecord.journal,undefined);assert.equal(publicRecord.key,undefined);
  assert.equal(JSON.stringify(publicRecord).includes('signed-fixture'),false);
  assert.throws(()=>restoreSubmission(sdk,{...record,id:'d'.repeat(64)}),/does not match/);
  assert.throws(()=>restoreSubmission(sdk,{...record,journal:{...record.journal,signedTransaction:serialized+' '}}),/no valid recovery/);
  assert.throws(()=>restoreSubmission(sdk,{id}),/no valid recovery/);
});

test('submission persists signed bytes and attempt before broadcast; duplicate approval spends once',async t=>{
  const {lab,pending,directory}=await fixture(t);let broadcasts=0;
  pending.submit=async()=>{broadcasts++;const saved=JSON.parse(await readFile(join(directory,'wallet.json'),'utf8'));assert.equal(saved.transactions[0].journal.signedTransaction,serialized);assert.equal(saved.transactions[0].journal.attempts.length,1);assert.equal(saved.transactions[0].state,'uncertain');return id;};
  const results=await Promise.allSettled([lab.submit('approve'),lab.submit('approve')]);
  assert.equal(results[0].status,'fulfilled');assert.equal(results[1].status,'rejected');assert.equal(broadcasts,1);assert.equal(lab.state.spent,'10001000');assert.equal(results[0].value.journal,undefined);
});

test('initial persistence failure prevents broadcast',async t=>{
  const {lab,pending}=await fixture(t);let broadcasts=0;pending.submit=async()=>{broadcasts++;return id;};
  lab.save=async()=>{throw new Error('disk failure');};
  await assert.rejects(lab.submit('approve'),/disk failure/);assert.equal(broadcasts,0);
});

test('uncertain broadcast survives restart; reviewed identical retry reserves no more budget',async t=>{
  const {lab,pending,directory}=await fixture(t);pending.submit=async()=>{throw new Error('response lost after broadcast');};
  const result=await lab.submit('approve');assert.equal(result.state,'uncertain');release(lab);
  const restored=new TestnetLab({directory,loadSdk:()=>sdk});t.after(()=>release(restored));await restored.load();
  const review=await restored.reviewRecovery(id);let broadcasts=0;
  restored.connected=action=>action({submitTransaction:async({transaction,allowOrphan})=>{broadcasts++;assert.equal(transaction.serializeToSafeJSON(),serialized);assert.equal(allowOrphan,false);return {transactionId:id};}});
  const retried=await restored.submitRecovery(review.token);
  assert.equal(retried.state,'submitted');assert.equal(restored.state.spent,'10001000');assert.equal(broadcasts,1);assert.equal(restored.state.transactions[0].journal.attempts.length,2);
  await assert.rejects(restored.submitRecovery(review.token),/expired/);
});

test('crash before attempted broadcast leaves an exact recoverable prepared transaction',async t=>{
  const {lab,pending,directory}=await fixture(t);let saves=0,broadcasts=0;const save=lab.save.bind(lab);
  lab.save=async()=>{saves++;if(saves===2)throw new Error('crash before attempt save');await save();};pending.submit=async()=>{broadcasts++;return id;};
  await assert.rejects(lab.submit('approve'),/crash/);assert.equal(broadcasts,0);release(lab);
  const restored=new TestnetLab({directory,loadSdk:()=>sdk});t.after(()=>release(restored));await restored.load();
  assert.equal(restored.state.transactions[0].state,'prepared');assert.equal(restored.state.transactions[0].journal.attempts.length,0);assert.equal((await restored.reviewRecovery(id)).id,id);
});

test('actual persistence error poisons the operation queue until restart',async t=>{
  const {lab,directory}=await fixture(t);
  // A non-directory target forces the real atomic save path to fail.
  const blocked=join(directory,'not-a-directory');await writeFile(blocked,'fixture');lab.directory=blocked;
  await assert.rejects(lab.save());assert.equal(lab.persistenceError,true);
  await assert.rejects(lab.exclusive(()=>assert.fail('must not run')),/Stop and restart/);
});

test('node deadlines release the queue after a stalled request',async t=>{
  const {lab}=await fixture(t);
  await assert.rejects(lab.exclusive(()=>bounded(new Promise(()=>{}),10)),/did not answer/);
  assert.equal(await lab.exclusive(async()=>42),42);
});

test('post-broadcast disk failure retains recoverable attempt and blocks further spending',async t=>{
  const {lab,pending,directory}=await fixture(t);let broadcasts=0;
  pending.submit=async()=>{broadcasts++;const blocked=join(directory,'disk-unavailable');await writeFile(blocked,'fixture');lab.directory=blocked;return id;};
  await assert.rejects(lab.submit('approve'));
  assert.equal(broadcasts,1);assert.equal(lab.persistenceError,true);
  await assert.rejects(lab.request('0.1'),/Stop and restart/);
  const saved=JSON.parse(await readFile(join(directory,'wallet.json'),'utf8'));
  assert.equal(saved.transactions[0].state,'uncertain');assert.equal(saved.transactions[0].journal.attempts.length,1);assert.equal(saved.spent,'10001000');
  release(lab);const restored=new TestnetLab({directory,loadSdk:()=>sdk});t.after(()=>release(restored));await restored.load();
  assert.equal((await restored.reviewRecovery(id)).transaction.id,id);assert.equal(restored.state.spent,'10001000');
});

test('receipt reorg revokes accepted state durably without releasing its reservation',async t=>{
  const {lab,directory}=await fixture(t);await lab.submit('approve');
  Object.assign(lab.state.transactions[0],{state:'accepted',acceptingBlock:'old',scanCursor:'old',verifiedAmount:'10000000'});await lab.save();
  lab.connected=action=>action({getVirtualChainFromBlock:async()=>({removedChainBlockHashes:['old'],addedChainBlockHashes:[],acceptedTransactionIds:[]}),getUtxosByAddresses:async()=>({entries:[]})});
  const result=await lab.receipt('request');assert.equal(result.acceptingBlock,null);assert.equal(result.transaction.state,'acceptance-changed');assert.notEqual(result.state,'paid');assert.equal(result.verifiedAmount,'0');
  const saved=JSON.parse(await readFile(join(directory,'wallet.json'),'utf8'));assert.equal(saved.transactions[0].state,'acceptance-changed');assert.equal(saved.spent,'10001000');
  await assert.rejects(lab.submit('approve'),/expired/);
});

test('status never serializes wallet, role keys or signed recovery bytes',async t=>{
  const {lab}=await fixture(t);await lab.submit('approve');lab.state.requests[0].key=['private-role-a','private-role-b'];
  lab.connected=async()=>{throw new Error('offline');};
  const text=JSON.stringify(await lab.status(),(_,v)=>typeof v==='bigint'?String(v):v);for(const secret of [lab.state.key,'private-role-a','private-role-b','signed-fixture'])assert.equal(text.includes(secret),false);
});
