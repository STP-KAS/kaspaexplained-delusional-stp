import {test} from 'node:test';
import assert from 'node:assert/strict';
import {splitRelayFee} from '../server/split-fee.mjs';
test('split relay fee accounts for compute and transient mass, with no legacy rate fallback',()=>{
  assert.equal(splitRelayFee(200),218000n);
  assert.equal(splitRelayFee(2000),451000n);
  assert.equal(splitRelayFee(4750),1001000n);
  assert.equal(splitRelayFee(200,200),435000n);
  for(const rate of [1,0,NaN,Infinity])assert.throws(()=>splitRelayFee(200,rate));
  for(const size of [-1,0,1.5,NaN])assert.throws(()=>splitRelayFee(size));
});
