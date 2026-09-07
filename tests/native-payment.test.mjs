import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildNativePayment} from '../server/native-payment.mjs';
import {fixtureSdk as sdk,fixtureKeys as keys,fixtureUtxo,generateNativePaymentFixtures} from '../scripts/native-payment-fixtures.mjs';
const options=()=>({entries:[fixtureUtxo()],destination:keys[1].toAddress('testnet-10').toString(),changeAddress:keys[0].toAddress('testnet-10').toString(),amount:30000000n});
test('tiny payment fits native v1 mass with exact controlled change and Pending API',async()=>{
 const p=buildNativePayment(sdk,options());assert.equal(p.type,'final');assert.equal(p.paymentAmount,30000000n);assert.equal(p.aggregateInputAmount-p.aggregateOutputAmount,p.feeAmount);assert.ok(p.feeAmount<=1000000n);assert.ok(p.mass.withinBlockLimits);
 await assert.rejects(p.submit({submitTransaction:()=>assert.fail('not signed')}),/sign/);assert.throws(()=>p.sign([keys[2]]),/Wrong/);p.sign([keys[0]]);
 const tx=sdk.Transaction.deserializeFromSafeJSON(p.serializeToSafeJSON());assert.equal(tx.version,1);assert.equal(tx.outputs[1].value,500000000000n-30000000n-p.feeAmount);
 let calls=0;assert.equal(await p.submit({submitTransaction:async({transaction,allowOrphan})=>{calls++;assert.equal(allowOrphan,false);assert.equal(transaction.id,p.id);return {transactionId:p.id};}}),p.id);assert.equal(calls,1);
});
test('native builder rejects foreign network, ownership, duplicate inputs and original caps',()=>{
 for(const change of [{destination:keys[1].toAddress('mainnet').toString()},{entries:[fixtureUtxo(500000000000n,keys[2])]},{entries:[fixtureUtxo(),fixtureUtxo()]},{amount:100000001n},{spent:999999999n},{entries:[fixtureUtxo(30000001n)]}])assert.throws(()=>buildNativePayment(sdk,{...options(),...change}));
});
test('native fixtures cover valid payments and consensus signature failures',async()=>{assert.equal((await generateNativePaymentFixtures()).length,7);});
