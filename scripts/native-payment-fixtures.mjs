import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {buildNativePayment} from '../server/native-payment.mjs';
import {publicTransactionMass} from '../src/public-contracts.mjs';
const sdk=createRequire(import.meta.url)('../.cache/upstream/kaspa-wasm32-sdk/nodejs/kaspa');
export const fixtureKeys=[1,2,3].map(n=>new sdk.PrivateKey(n.toString(16).padStart(2,'0').repeat(32)));
export function fixtureUtxo(value=500000000000n,key=fixtureKeys[0],tag='ab'){return new sdk.UtxoEntries([{outpoint:{transactionId:tag.repeat(32),index:0},amount:value,scriptPublicKey:sdk.payToAddressScript(key.toAddress('testnet-10')),blockDaaScore:0n,isCoinbase:false}]).items[0];}
export const fixtureSdk=sdk;
function exported(tx){return {version:tx.version,lockTime:String(tx.lockTime),storageMass:String(tx.storageMass),inputs:tx.inputs.map(i=>({transactionId:i.previousOutpoint.transactionId,index:i.previousOutpoint.index,sequence:String(i.sequence),computeBudget:i.computeBudget,signatureScript:i.signatureScript,amount:String(i.utxo.amount),scriptPublicKey:i.utxo.entry.scriptPublicKey.script})),outputs:tx.outputs.map(o=>({value:String(o.value),scriptPublicKey:o.scriptPublicKey.script}))};}
export async function generateNativePaymentFixtures(){
 const fixtures=[];
 for(const [name,amount,entries] of [['tiny-browser-funding',30000000n,[fixtureUtxo()]],['small-payment',2000000n,[fixtureUtxo()]],['two-input-payment',30000000n,[fixtureUtxo(20000000n),fixtureUtxo(20000000n,fixtureKeys[0],'cd')]]]){
  const pending=buildNativePayment(sdk,{entries,destination:fixtureKeys[1].toAddress('testnet-10').toString(),changeAddress:fixtureKeys[0].toAddress('testnet-10').toString(),amount});pending.sign([fixtureKeys[0]]);
  const tx=sdk.Transaction.deserializeFromSafeJSON(pending.serializeToSafeJSON());const add=(label,valid,copy)=>fixtures.push({name:label,valid,transaction:exported(copy),mass:publicTransactionMass(copy)});add(name,true,tx);
  if(name==='tiny-browser-funding')for(const [label,mutate] of [['reject-output-mutation',t=>{t.outputs[0].value-=1n;t.outputs[1].value+=1n;}],['reject-destination-mutation',t=>{t.outputs[0].scriptPublicKey=sdk.payToAddressScript(fixtureKeys[2].toAddress('testnet-10'));}],['reject-wrong-signer',t=>{t.inputs[0].signatureScript=sdk.createInputSignature(t,0,fixtureKeys[2]);}],['reject-low-budget',t=>{t.inputs[0].computeBudget=0;t.inputs[0].signatureScript=sdk.createInputSignature(t,0,fixtureKeys[0]);}]]){const copy=sdk.Transaction.deserializeFromSafeJSON(pending.serializeToSafeJSON());mutate(copy);copy.storageMass=BigInt(publicTransactionMass(copy).storageMass);copy.finalize();add(label,false,copy);}
 }
 await mkdir('.cache/native-payment',{recursive:true});await writeFile('.cache/native-payment/fixtures.json',JSON.stringify({network:'testnet-10',unfunded:true,fixtures},null,2));return fixtures;
}
if(process.argv[1]&&resolve(process.argv[1])===resolve(import.meta.filename))console.log(`Generated ${(await generateNativePaymentFixtures()).length} unfunded native-payment fixtures.`);
