import {createRequire} from 'node:module';
import {randomBytes} from 'node:crypto';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
const require=createRequire(import.meta.url);
const sdk=require('../.cache/upstream/kaspa-wasm32-sdk/nodejs/kaspa');
// These throwaway keys only produce a public compiler fixture; nobody funds it.
const publicKey=()=>Array.from(Buffer.from(new sdk.PrivateKey(randomBytes(32).toString('hex')).toPublicKey().toXOnlyPublicKey().toString(),'hex'));
await mkdir('.cache/contracts',{recursive:true});
const key=()=>({kind:'bytes',value:publicKey()}),integer=value=>({kind:'int',value});
const issuer=key();
for(const [name,args] of [['refundable-transfer',[key(),key(),integer(1800000000000)]],['payment-split',[key(),key(),key(),integer(5000),integer(1000000)]],['capped-token',[issuer,integer(1000),issuer,integer(1000),{kind:'bool',value:true}]]]){
  const argPath=`.cache/contracts/${name}-args.json`,output=`.cache/contracts/${name}.json`;
  await writeFile(argPath,JSON.stringify(args));
  execFileSync('.cache/upstream/silverc',[`contracts/${name}.sil`,'--constructor-args',argPath,'-o',output],{stdio:'pipe'});
  const artifact=JSON.parse(await readFile(output,'utf8'));
  console.log(JSON.stringify({name,contracts:Object.keys(artifact.contracts),compiler:artifact.compiler_version}));
}
