import test from 'node:test';
import assert from 'node:assert/strict';
import { createMiningModel, stepMiningModel, toggleMiningParticipant, setMiningDishonesty, setMiningWork, editMiningCandidate } from '../src/v4-mining-model.mjs';

test('a paused network produces no work event, acceptance or seed advance', () => {
  let state = createMiningModel();
  for (const person of state.participants) state = toggleMiningParticipant(state, person.id);
  const next = stepMiningModel(state);
  assert.equal(next.last.status, 'paused');
  assert.equal(next.attempts, 0);
  assert.equal(next.seed, state.seed);
  assert.equal(next.history.length, 0);
});

test('a paused participant cannot win and resumed work participates again', () => {
  let state = createMiningModel({ participants: [{ id: 'Pip', work: 1 }, { id: 'Moss', work: 1 }] });
  state = toggleMiningParticipant(state, 'Moss');
  for (let i = 0; i < 20; i++) {
    state = stepMiningModel(state);
    assert.equal(state.last.participant, 'Pip');
  }
  state = toggleMiningParticipant(state, 'Moss');
  const winners = new Set();
  for (let i = 0; i < 40; i++) { state = stepMiningModel(state); winners.add(state.last.participant); }
  assert.deepEqual([...winners].sort(), ['Moss', 'Pip']);
});

test('even all the modeled work cannot authorize an invalid covenant spend', () => {
  let state = createMiningModel({ participants: [{ id: 'Pip', work: 1000, dishonest: true }] });
  state = stepMiningModel(state);
  assert.equal(state.last.workShare, 1);
  assert.equal(state.last.status, 'rejected');
  assert.equal(state.accepted, 0);
  assert.equal(state.rejected, 1);
  state = stepMiningModel(setMiningDishonesty(state, 'Pip', false));
  assert.equal(state.last.status, 'accepted');
  assert.equal(state.accepted, 1);
});

test('work share changes sampling without allocating turns', () => {
  let state = createMiningModel({ seed: 8913, participants: [{ id: 'Pip', work: 9 }, { id: 'Moss', work: 1 }] });
  let pip = 0;
  for (let i = 0; i < 10000; i++) { state = stepMiningModel(state); pip += Number(state.last.participant === 'Pip'); }
  assert.ok(pip > 8700 && pip < 9300, `Expected approximately 90% work share, saw ${pip / 100}%`);
  assert.equal(state.history.length, 60);
  assert.equal(state.attempts, 10000);
});

test('experiments are reproducible and helpers leave earlier state untouched', () => {
  const initial = createMiningModel();
  const before = structuredClone(initial);
  const changed = setMiningWork(setMiningDishonesty(toggleMiningParticipant(initial, 'Pip'), 'Moss', true), 'Bolt', 10);
  stepMiningModel(changed);
  assert.deepEqual(initial, before);
  assert.deepEqual(stepMiningModel(initial), stepMiningModel(initial));
  assert.equal(changed.participants.find(p => p.id === 'Bolt').work, 10);
});

test('invalid work and ambiguous participant identities are rejected', () => {
  for (const work of [0, -1, Infinity, NaN, 1001]) assert.throws(() => setMiningWork(createMiningModel(), 'Pip', work));
  assert.throws(() => toggleMiningParticipant(createMiningModel(), 'unknown'));
  assert.throws(() => createMiningModel({ participants: [{ id: 'Pip', work: 1 }, { id: 'Pip', work: 2 }] }));
});


test('editing a valid payment after the draw breaks its receipt without undoing the original', () => {
  const state = stepMiningModel(createMiningModel());
  const edited = editMiningCandidate(state, { payment: 4 });
  assert.equal(edited.lastEdit.checks.covenantValid, true);
  assert.equal(edited.lastEdit.checks.commitmentMatches, false);
  assert.equal(edited.lastEdit.status, 'rejected');
  assert.deepEqual(edited.last, state.last);
  assert.equal(edited.accepted, state.accepted);
  assert.equal(state.lastEdit, null);
});

test('a sealed invalid payment has a matching receipt but fails the independent rule', () => {
  const state = stepMiningModel(createMiningModel({ participants: [{ id: 'Pip', work: 1, dishonest: true }] }));
  assert.equal(state.last.checks.commitmentMatches, true);
  assert.equal(state.last.checks.covenantValid, false);
  assert.equal(state.last.status, 'rejected');
});

test("pausing after an edited parcel clears stale edit feedback",()=>{let state=stepMiningModel(createMiningModel());state=editMiningCandidate(state,{payment:4});for(const p of state.participants)state=toggleMiningParticipant(state,p.id);state=stepMiningModel(state);assert.equal(state.lastEdit,null);assert.equal(state.last.status,"paused");});
