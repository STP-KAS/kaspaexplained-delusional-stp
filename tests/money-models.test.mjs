import {test} from 'node:test';
import assert from 'node:assert/strict';
import {redemption,collateral,settlement} from '../src/money-models.mjs';
test('redemption conserves reserves and burns only paid claims',()=>{
  for(let requested=0;requested<=10000;requested++){
    const s=redemption(requested);
    assert.equal(s.paid+s.pending,requested);assert.equal(s.paid+s.cash,2000);
    assert.equal(s.cash+s.treasuries,s.reserves);assert.equal(s.outstanding,s.reserves);
    assert.equal(s.outstanding+s.paid,10000);assert.ok(s.cash>=0);
  }
  assert.throws(()=>redemption(-1));assert.throws(()=>redemption(10001));assert.throws(()=>redemption(NaN));
});
test('collateral threshold uses exact eligibility rather than rounded display',()=>{
  assert.equal(collateral(666).eligible,true);assert.equal(collateral(667).eligible,false);
  for(let price=100;price<=2000;price++){const s=collateral(price);assert.equal(s.value,10*price);assert.equal(s.debt,5000);assert.equal(s.eligible,s.health<1);}
});
test('conditional claims never create extra collateral',()=>{
  for(const outcome of ['pending','yes','no']){const s=settlement(outcome);assert.equal(s.locked+s.yes+s.no,10000);assert.ok(s.yes===0||s.no===0);}
  assert.throws(()=>settlement('maybe'));
});
