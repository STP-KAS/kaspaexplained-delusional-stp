import {test} from 'node:test';
import assert from 'node:assert/strict';
import {networkState} from '../src/models.mjs';
import {networkDiagram} from '../src/network-diagram.mjs';

test('the initial illustration and interactive diagram use the same calculated references',()=>{
  for(const delay of [0,100,300,301,500,800])for(const time of [0,99,100,399,400,1199,1200]){
    const state=networkState(delay,time),html=networkDiagram(state,{interactive:true});
    assert.equal((html.match(/data-block="B"/g)||[]).length,state.foundB?2:0);
    assert.equal((html.match(/data-block="C"/g)||[]).length,state.foundC?2:0);
    assert.equal((html.match(/data-block="D"/g)||[]).length,time>=1200?2:0);
    if(state.foundC)assert.ok(html.includes(`Block C. Miner 2 · 400 ms. References ${state.parent}`));
    assert.ok(html.includes('drawing-wide'));assert.ok(html.includes('drawing-small'));
  }
});
test('static fallback does not offer inert keyboard buttons',()=>{
  const html=networkDiagram(networkState(500,400));
  assert.doesNotMatch(html,/tabindex|role="button"/);
  assert.match(html,/Two miners\. Two independent blocks\./);
});

test('each drawn arrow points from a visible block to its calculated earlier reference',()=>{
  for(const delay of [0,300,301,800])for(const time of [0,100,400,1200]){
    const state=networkState(delay,time),html=networkDiagram(state);
    const edges=[...html.matchAll(/data-from="([A-D])" data-to="([A-D])"/g)].map(match=>`${match[1]}→${match[2]}`);
    const expected=[];
    if(state.foundB)expected.push('B→A');
    if(state.foundC)expected.push(`C→${state.parent}`);
    if(time>=1200)expected.push(...(state.parallel?['D→B','D→C']:['D→C']));
    assert.deepEqual(edges,[...expected,...expected]);
  }
});
