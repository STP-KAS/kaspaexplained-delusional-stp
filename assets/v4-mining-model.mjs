// An illustrative work-share lottery, not hashing, mining or network evidence.
const MAX_HISTORY = 60;
const people = ['Moss', 'Pip', 'Bolt'];

export const V4_MINING_DESCRIPTION = Object.freeze({
  title: 'Who brings the next candidate?',
  line: 'Moss, Pip and Bolt can each contribute work. Try pausing one, or let one propose an invalid spend.',
  boundary: 'This is a local work-share model. It produces no real blocks, test coins or mining rewards and does not contact a node.',
  sampling: 'Each draw represents a successful work event. Active participants are sampled in proportion to their chosen work units. These units are not stake, votes, turns or measured hashrate.',
  commitment: 'In actual PoW, a miner commits to candidate block contents before finding a valid proof. Here each participant’s valid or invalid candidate is fixed before the draw; the lottery only illustrates work share.',
  verification: 'Winning the work contest does not authorize an invalid spend. The model’s independent rule check rejects a candidate that breaks the covenant, even if that participant supplies all the work.',
  majority: 'That validity check does not solve every attack. Consensus security also needs its honest-hashpower and network assumptions. A dishonest majority can threaten ordering, censorship or competing valid histories; this small model does not simulate those attacks.',
  sealedParcel: 'Seal the candidate before the work draw. Editing its payment afterward changes the toy commitment, so the old work receipt no longer matches. The node also checks the payment rule even when the receipt matches. This demonstration uses a small non-cryptographic checksum, not Kaspa hashing or a secure proof.',
  proposerChoice: 'A select-then-write design can give a selected proposer discretion while assembling content. A bribe to delay a rival trade illustrates that opportunity, not a claim that every PoS design behaves identically. PoW commits its candidate before finding a winning proof, but miners can still choose, reorder, censor, withhold or accept bribes. Both systems can reject invalid covenant spends independently of proposer selection.',
  participation: 'The protocol does not appoint a turn for a named participant. Real participation requires separate mining software and suitable hardware; equipment, costs and concentration matter.',
  sources: ['hashdag', 'dag']
});

export function createMiningModel({ seed = 517, participants } = {}) {
  if (!Number.isInteger(seed)) throw new TypeError('Use an integer model seed.');
  const miners = participants ?? people.map((id, index) => ({ id, work: [3, 2, 1][index], active: true, dishonest: false }));
  if (!Array.isArray(miners) || miners.length < 1 || miners.length > 20) throw new TypeError('Choose one to twenty participants.');
  const ids = new Set();
  const copied = miners.map(miner => {
    if (typeof miner.id !== 'string' || !miner.id.trim() || ids.has(miner.id)) throw new TypeError('Participants need distinct names.');
    ids.add(miner.id);
    return { id: miner.id, work: checkedWork(miner.work), active: miner.active !== false, dishonest: miner.dishonest === true };
  });
  return { modelOnly: true, seed: seed >>> 0 || 1, participants: copied, attempts: 0, accepted: 0, rejected: 0, last: null, lastEdit: null, history: [] };
}

function checkedWork(work) {
  if (!Number.isFinite(work) || work <= 0 || work > 1000) throw new RangeError('Work must be above zero and at most 1000 model units.');
  return work;
}

function changeParticipant(state, id, change) {
  if (!state.participants.some(person => person.id === id)) throw new RangeError('Unknown participant.');
  return { ...state, participants: state.participants.map(person => person.id === id ? { ...person, ...change(person) } : { ...person }) };
}

export function toggleMiningParticipant(state, id) {
  return changeParticipant(state, id, person => ({ active: !person.active }));
}

export function setMiningWork(state, id, work) {
  checkedWork(work);
  return changeParticipant(state, id, () => ({ work }));
}

export function setMiningDishonesty(state, id, dishonest) {
  if (typeof dishonest !== 'boolean') throw new TypeError('Candidate honesty must be a boolean choice.');
  return changeParticipant(state, id, () => ({ dishonest }));
}

export function stepMiningModel(state) {
  const active = state.participants.filter(person => person.active);
  const totalWork = active.reduce((sum, person) => sum + person.work, 0);
  if (!totalWork) return { ...state, lastEdit: null, last: { modelOnly: true, status: 'paused', message: 'No one is contributing work. Resume a participant to draw a candidate.' } };
  const candidates = new Map(active.map(person => { const candidate = { participant: person.id, payment: person.dishonest ? 10 : 5, recipient: 'Harbor shop' }; return [person.id, { candidate, commitment: miningCandidateCommitment(candidate) }]; }));
  // Seeded randomness makes a classroom experiment reproducible. No real proof
  // is generated; each selected candidate was specified before this draw.
  let seed = state.seed;
  seed ^= seed << 13;
  seed ^= seed >>> 17;
  seed ^= seed << 5;
  seed >>>= 0;
  let ticket = seed / 4294967296 * totalWork;
  let winner = active[active.length - 1];
  for (const person of active) {
    ticket -= person.work;
    if (ticket < 0) { winner = person; break; }
  }
  const { candidate, commitment } = candidates.get(winner.id);
  const proof = { modelOnly: true, commitment, draw: seed };
  const check = checkMiningCandidate(candidate, proof);
  const accepted = check.accepted;
  const result = {
    modelOnly: true,
    id: `model-candidate-${state.attempts + 1}`,
    participant: winner.id,
    workShare: winner.work / totalWork,
    candidate, commitment, proof, checks: check, candidateRuleValid: check.covenantValid,
    status: accepted ? 'accepted' : 'rejected',
    message: accepted
      ? `${winner.id} won this work draw. The model node accepts the rule-valid candidate.`
      : `${winner.id} won this work draw. The model node rejects its invalid covenant spend; more work cannot make that spend valid.`
  };
  return {
    ...state, seed, attempts: state.attempts + 1,
    accepted: state.accepted + Number(accepted), rejected: state.rejected + Number(!accepted),
    last: result, lastEdit: null, history: [...state.history, result].slice(-MAX_HISTORY)
  };
}


// Deliberately non-cryptographic, for a sealed-content illustration only.
export function miningCandidateCommitment(candidate) {
  const content = JSON.stringify([candidate.participant, candidate.payment, candidate.recipient]);
  let checksum = 2166136261;
  for (let i = 0; i < content.length; i++) checksum = Math.imul(checksum ^ content.charCodeAt(i), 16777619);
  return `toy-commitment-${(checksum >>> 0).toString(16).padStart(8, '0')}`;
}

export function checkMiningCandidate(candidate, proof) {
  const commitmentMatches = proof?.modelOnly === true && proof.commitment === miningCandidateCommitment(candidate);
  const covenantValid = Number.isInteger(candidate.payment) && candidate.payment >= 0 && candidate.payment <= 5 && candidate.recipient === 'Harbor shop';
  return { modelOnly: true, commitmentMatches, covenantValid, accepted: commitmentMatches && covenantValid };
}

export function editMiningCandidate(state, { payment, recipient } = {}) {
  if (!state.last?.candidate) throw new Error('Draw a candidate before editing its sealed content.');
  const candidate = { ...state.last.candidate, ...(payment === undefined ? {} : { payment }), ...(recipient === undefined ? {} : { recipient }) };
  const checks = checkMiningCandidate(candidate, state.last.proof);
  return { ...state, lastEdit: {
    modelOnly: true, candidate, checks, status: checks.accepted ? 'accepted' : 'rejected',
    message: !checks.commitmentMatches
      ? 'The edited parcel no longer matches its toy work receipt. It needs a new commitment and work draw; the original candidate is unchanged.'
      : !checks.covenantValid
        ? 'The receipt matches, but the model node rejects the invalid payment rule.'
        : 'The content is unchanged and still passes the model checks.'
  } };
}
