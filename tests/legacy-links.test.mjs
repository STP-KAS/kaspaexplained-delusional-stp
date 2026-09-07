import {test} from 'node:test';
import assert from 'node:assert/strict';
import {legacyDestination} from '../scripts/legacy-target.mjs';
test('historical redirects preserve valid sections and map retired section names',()=>{
 const ids=['parallel-blocks','conflicts','confirmation'];
 assert.equal(legacyDestination('/what-is-kaspa','#confirmation',ids),'/what-is-kaspa#confirmation');
 assert.equal(legacyDestination('/what-is-kaspa','#confirmation-risk',ids),'/what-is-kaspa#confirmation');
 assert.equal(legacyDestination('/what-is-kaspa#conflicts','#unknown',ids),'/what-is-kaspa#conflicts');
 for(const invalid of ['#%','##main','#javascript:alert(1)','#https://other.example'])assert.equal(legacyDestination('/what-is-kaspa',invalid,ids),'/what-is-kaspa');
});
