import {test} from 'node:test';
import assert from 'node:assert/strict';
import {rawInputSignature} from '../server/contract-signature.mjs';

test('SDK signature push is decoded once before ABI encoding',()=>{
  const signature='ab'.repeat(64)+'01';
  assert.equal(rawInputSignature('41'+signature),signature);
  assert.equal(rawInputSignature('41'+signature).length/2,65);
  for(const invalid of [null,signature,'40'+signature,'41'+signature+'00','41'+'zz'.repeat(65)]){
    assert.throws(()=>rawInputSignature(invalid),/encoding/);
  }
});
