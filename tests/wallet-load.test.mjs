import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,rm,access} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {TestnetLab} from '../server/testnet.mjs';

const loadSdk=()=>({PrivateKey:class{constructor(value){if(!/^[a-f0-9]{64}$/.test(value))throw new Error('Invalid fixture key');}toAddress(){return {toString:()=> 'kaspatest:fixture'};}}});
const valid={network:'testnet-10',key:'a'.repeat(64),spent:'0',requests:[],transactions:[]};

test('failed wallet loading releases ownership and cannot leave a half-loaded signer',async t=>{
  const directory=await mkdtemp(join(tmpdir(),'kaspa-wallet-test-'));
  const lab=new TestnetLab({directory,loadSdk});
  t.after(async()=>{if(lab.release){process.removeListener('exit',lab.release);lab.release();}await rm(directory,{recursive:true,force:true});});
  for(const content of ['{',JSON.stringify({...valid,network:'mainnet'}),JSON.stringify({...valid,key:'bad'}),JSON.stringify({...valid,requests:null})]){
    await writeFile(join(directory,'wallet.json'),content);
    await assert.rejects(lab.load());
    assert.equal(lab.state,undefined);assert.equal(lab.key,undefined);assert.equal(lab.address,undefined);
    await assert.rejects(access(join(directory,'owner.lock')));
    assert.equal(await readFile(join(directory,'wallet.json'),'utf8'),content);
  }
  await writeFile(join(directory,'wallet.json'),JSON.stringify(valid));
  await lab.load();assert.equal(lab.address,'kaspatest:fixture');
  const second=new TestnetLab({directory,loadSdk});
  await assert.rejects(second.load(),/Another process owns/);
  assert.equal(second.state,undefined);
});

test('new wallet save failure clears state and releases the lock',async t=>{
  const directory=await mkdtemp(join(tmpdir(),'kaspa-wallet-save-test-'));
  const lab=new TestnetLab({directory,loadSdk});
  t.after(()=>rm(directory,{recursive:true,force:true}));
  lab.save=async()=>{throw new Error('Fixture disk failure');};
  await assert.rejects(lab.load(),/Fixture disk failure/);
  assert.equal(lab.state,undefined);
  await assert.rejects(access(join(directory,'owner.lock')));
});
