// Browser adapter security checks with disposable, unfunded keys.
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {buildPublicPayment,publicAssetPlanMass,signPublicAssetPlan,validatePublicAssetPlan,kaspirePublicAssetSigningRequest,acceptKaspirePublicAssetSignature,assetSignatureScript} from '../src/public-asset-signing.mjs';
import {instantiatePublicToken,buildTokenGenesis,buildTokenMove,buildTokenExchange} from '../src/public-token.mjs';
import {instantiatePublicReceipt,buildBackedGenesis,buildBackedMove} from '../src/public-receipt.mjs';
import {pushPublicData} from '../src/public-contracts.mjs';
const sdk=createRequire(import.meta.url)('../.cache/upstream/kaspa-wasm32-sdk/nodejs/kaspa');
const templates=JSON.parse(await readFile(new URL('../.cache/public-templates/templates.json',import.meta.url),'utf8')).templates;
const keys=[5,6,7].map(n=>new sdk.PrivateKey(n.toString(16).padStart(2,'0').repeat(32))),owners=keys.map(k=>k.toPublicKey().toXOnlyPublicKey().toString()),addresses=keys.map(k=>k.toAddress('testnet-10').toString());
const utxo=(tag,value,script,cov,index=0)=>new sdk.UtxoEntries([{outpoint:{transactionId:typeof tag==='string'?tag:tag.toString(16).padStart(2,'0').repeat(32),index},amount:BigInt(value),scriptPublicKey:script,blockDaaScore:0n,isCoinbase:false,...(cov?{covenant_id:cov}:{})}]).items[0];
const native=(tag,value=1000000000n,owner=0)=>utxo(tag,value,sdk.payToAddressScript(new sdk.Address(addresses[owner])));
const from=(plan,index=0)=>{const o=plan.transaction.outputs[index];return utxo(plan.transaction.id,o.value,o.scriptPublicKey,o.covenant?.covenantId.toString(),index);};
const sign=(tx,index,s)=>sdk.createInputSignature(tx,index,keys[owners.indexOf(s.owner)]);
const pay=()=>buildPublicPayment(sdk,{fundingUtxos:[native(60)],owner:owners[0],recipient:owners[1],amount:20000000n});
await signPublicAssetPlan(pay(),sign);
const signedChanged=pay();await signPublicAssetPlan(signedChanged,sign);signedChanged.transaction.inputs[0].signatureScript='00';assert.throws(()=>validatePublicAssetPlan(signedChanged),/changed/);
await assert.rejects(signPublicAssetPlan(pay(),(tx,i,s)=>sign(tx,i,s).slice(0,-2)+'02'),/SIGHASH_ALL/);
const mutation=pay();await assert.rejects(signPublicAssetPlan(mutation,(tx,index,s)=>{mutation.fee='1';return sign(tx,index,s);}),/changed/);
const two=buildPublicPayment(sdk,{fundingUtxos:[native(61),native(62)],owner:owners[0],recipient:owners[1],amount:20000000n});
await assert.rejects(signPublicAssetPlan(two,(tx,index,s)=>{if(index===1)tx.inputs[0].signatureScript='00';return sign(tx,index,s);}),/changed/);
const changed=pay();changed.transaction.outputs[1].scriptPublicKey=sdk.payToAddressScript(new sdk.Address(addresses[2]));assert.throws(()=>validatePublicAssetPlan(changed),/changed/);
assert.throws(()=>buildPublicPayment(sdk,{fundingUtxos:[native(60)],owner:owners[1],recipient:owners[0],amount:1n}),/selected account/);
assert.throws(()=>buildPublicPayment(sdk,{fundingUtxos:[native(60)],owner:owners[0],recipient:owners[1],amount:100000001n}),/at most/);
async function walletRoundtrip(plan){
 for(const [index,s]of plan.signers.entries()){
  const request=kaspirePublicAssetSigningRequest(plan,index);assert.equal(request.params.submitTransaction,false);
  const tx=sdk.Transaction.deserializeFromSafeJSON(request.params.psktTransactionJson),raw=sign(tx,index,s).slice(2),asset=(plan.tokens??plan.receipts)[index];
  tx.inputs[index].signatureScript=s.kind==='native'?pushPublicData(raw):assetSignatureScript(asset,plan.states,plan.operation,plan.sponsor,raw,index===0);
  const accepted=acceptKaspirePublicAssetSignature(sdk,plan,index,{psktTransactionJson:tx.serializeToSafeJSON()});assert.equal(accepted.complete,index===plan.signers.length-1);
 }
}
await walletRoundtrip(pay());
const initial=instantiatePublicToken(sdk,templates.token,{issuer:owners[0],cap:1000,state:{owner:owners[0],quantity:1000,isMinter:true}}),minter=instantiatePublicToken(sdk,templates.token,{issuer:owners[0],cap:1000,state:{owner:owners[0],quantity:900,isMinter:true}}),holder=instantiatePublicToken(sdk,templates.token,{issuer:owners[0],cap:1000,state:{owner:owners[1],quantity:100,isMinter:false}}),buyer=instantiatePublicToken(sdk,templates.token,{issuer:owners[0],cap:1000,state:{owner:owners[2],quantity:100,isMinter:false}});
const genesis=buildTokenGenesis(sdk,{fundingUtxos:[native(65)],token:initial,tokenName:'Signature fixture',cellAmount:50000000n,fee:1000000n,changeAddress:addresses[0]});await walletRoundtrip(genesis);
const mint=buildTokenMove(sdk,{tokenInputs:[{utxo:from(genesis),token:initial}],successors:[{token:minter,amount:24500000n},{token:holder,amount:24500000n}],operation:1,fee:1000000n});await walletRoundtrip(mint);
const exchange=buildTokenExchange(sdk,{sellerToken:{utxo:from(mint,1),token:holder},buyerFundingUtxos:[native(66,1000000000n,2)],buyerToken:buyer,price:8000000n,sellerAddress:addresses[1],buyerChangeAddress:addresses[2],fee:1000000n});await walletRoundtrip(exchange);
const r=instantiatePublicReceipt(sdk,templates.receipt,{series:'bb'.repeat(32),state:{owner:owners[0],quantity:50000000}}),r2=instantiatePublicReceipt(sdk,templates.receipt,{series:'bb'.repeat(32),state:{owner:owners[1],quantity:50000000}});
const lock=buildBackedGenesis(sdk,{fundingUtxos:[native(67)],receipt:r,fee:1000000n,sponsorPublicKey:owners[0]});await walletRoundtrip(lock);
const transfer=buildBackedMove(sdk,{receiptInputs:[{utxo:from(lock),receipt:r}],successors:[r2],sponsorUtxo:native(68),sponsorPublicKey:owners[0],fee:1000000n});await walletRoundtrip(transfer);
console.log('Public asset signing: payment, token issue/mint/exchange, receipt lock/transfer, wallet partial signing, and mutation rejection passed.');

// Mass inspection must preserve completed signatures even when estimation rejects.
const inspected=pay();await signPublicAssetPlan(inspected,sign);const signedBytes=inspected.transaction.serializeToSafeJSON();
publicAssetPlanMass(inspected);assert.equal(inspected.transaction.serializeToSafeJSON(),signedBytes);assert.equal(validatePublicAssetPlan(inspected).complete,true);
assert.throws(()=>publicAssetPlanMass(inspected,{feeRate:0}),/fee rate/);assert.equal(inspected.transaction.serializeToSafeJSON(),signedBytes);
// The native principal limit uses the actual reviewed fee, not unused fee headroom.
assert.throws(()=>buildTokenExchange(sdk,{sellerToken:{utxo:from(mint,1),token:holder},buyerFundingUtxos:[native(69,1000000000n,2)],buyerToken:buyer,price:100000001n,sellerAddress:addresses[1],buyerChangeAddress:addresses[2],fee:1000000n}),/native debit/);
console.log('Mass inspection preserves signatures; exact principal plus fee limit passed.');
