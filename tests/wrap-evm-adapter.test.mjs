import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createWrapEvm} from '../server/wrap-evm.mjs';
test('source adapter persists one lock and one release through identical retries',{timeout:120000},async()=>{
 const dir=await mkdtemp(join(tmpdir(),'wrap-evm-'));let app;
 try{
  app=await createWrapEvm({directory:dir,network:'local'});
  assert.equal((await app.status()).chainId,31337);
  await app.initialize();await app.faucet();await app.lock('11'.repeat(32));
  let s=await app.status();assert.deepEqual(s.balances,{user:'0',pip:'0',vault:'100000000'});
  const verified=await app.verifyDeposit(s.deposit.id);assert.equal(verified.verified,true);assert.equal(verified.amountUnits,'100000000');
  await assert.rejects(app.verifyDeposit('0x'+'33'.repeat(32)),/Unknown deposit/);
  await assert.rejects(app.lock('22'.repeat(32)),/recipient cannot change/);
  const count=s.transactions.length;await app.lock('11'.repeat(32));assert.equal((await app.status()).transactions.length,count);
  await app.release(s.deposit.id,'44'.repeat(32));s=await app.status();assert.deepEqual(s.balances,{user:'0',pip:'100000000',vault:'0'});assert.equal(s.deposit.released,true);
  await app.release(s.deposit.id,'44'.repeat(32));assert.equal((await app.status()).transactions.length,count+1);
  await assert.rejects(app.release(s.deposit.id,'55'.repeat(32)),/cannot change/);
  await assert.rejects(app.verifyDeposit(s.deposit.id),/unavailable/);
  assert(s.transactions.every(t=>!Object.hasOwn(t,'raw')),'public status never contains signed authorizations');
 }finally{await app?.close();await rm(dir,{recursive:true,force:true});}
});
test('mainnet cannot be selected',async()=>{await assert.rejects(createWrapEvm({network:'mainnet'}),/Only local test EVM and Sepolia/);});
