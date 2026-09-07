import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createCoordination,changeCoordination,coordinationGroup,previewCoordination,executeCoordination} from '../src/coordination.mjs';
function ready(){let state=createCoordination();for(const id of ['ben','cleo'])state=changeCoordination(state,id,{authorized:true});return state;}
test('individual thresholds select a viable subset without forcing the fourth person',()=>{
 assert.deepEqual(coordinationGroup(createCoordination()),{ids:[],capital:0});
 assert.deepEqual(coordinationGroup(ready()),{ids:['ana','ben','cleo'],capital:90});
});
test('execution is atomic, preserves excluded funds and consumes only used authorizations',()=>{
 const state=ready(),before=structuredClone(state),preview=previewCoordination(state),result=executeCoordination(state,preview);
 assert.equal(result.ok,true);assert.deepEqual(state,before);assert.deepEqual(result.state.participants.map(p=>p.balance),[10,10,10,20]);
 assert.deepEqual(result.state.participants.map(p=>p.authorized),[false,false,false,true]);assert.equal(result.capital,90);
 assert.equal(executeCoordination(result.state,preview).ok,false);
});
test('revocation, spent balance and changed conditions invalidate all old execution',()=>{
 const state=ready(),preview=previewCoordination(state);
 for(const [id,changes]of [['ana',{balance:25}],['ben',{authorized:false}],['cleo',{minCapital:100}]]){
  const changed=changeCoordination(state,id,changes),before=structuredClone(changed),result=executeCoordination(changed,preview);
  assert.equal(result.ok,false);assert.deepEqual(result.state,before);assert.deepEqual(coordinationGroup(changed).ids,[]);
 }
 const changedBack=changeCoordination(changeCoordination(state,'ana',{balance:25}),'ana',{balance:50});assert.equal(executeCoordination(changedBack,preview).ok,false);
});
test('empty, altered and foreign previews cannot execute',()=>{
 const state=ready(),preview=previewCoordination(state);
 for(const invalid of [null,{...preview,capital:1},{...preview,ids:['ana']},previewCoordination(createCoordination())])assert.equal(executeCoordination(state,invalid).ok,false);
 const alone=createCoordination();assert.equal(executeCoordination(alone,previewCoordination(alone)).ok,false);
});
test('conditions reject invalid values and unknown participants without changing state',()=>{
 const state=ready(),before=structuredClone(state);
 for(const changes of [{amount:0},{amount:1.5},{balance:-1},{minPeople:5},{minCapital:4001},{authorized:1},{owner:'other'}])assert.throws(()=>changeCoordination(state,'ana',changes));
 assert.throws(()=>changeCoordination(state,'unknown',{balance:1}));assert.deepEqual(state,before);
});
test('threshold pruning agrees with exhaustive feasible-subset search',()=>{
 for(let seed=0;seed<128;seed++){
  let state=createCoordination();state={...state,participants:state.participants.map((p,i)=>({...p,authorized:Boolean((seed>>(i%3))&1),balance:((seed+i*7)%5)*10,amount:(i+1)*10,minPeople:1+(seed+i)%4,minCapital:(seed*13+i*17)%130}))};
  const feasible=[];for(let mask=1;mask<16;mask++){const group=state.participants.filter((_,i)=>mask&(1<<i)),capital=group.reduce((n,p)=>n+p.amount,0);if(group.every(p=>p.authorized&&p.balance>=p.amount&&group.length>=p.minPeople&&capital>=p.minCapital))feasible.push(group);}
  const expected=feasible.sort((a,b)=>b.length-a.length)[0]??[];assert.deepEqual(coordinationGroup(state).ids,expected.map(p=>p.id),`seed ${seed}`);
 }
});
