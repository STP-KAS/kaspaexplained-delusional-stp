export const TIMING = Object.freeze({ first: 100, second: 400, end: 1200 });

function clamp(value, min, max, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
}

export function networkState(delay = 500, time = TIMING.end) {
  delay = clamp(delay, 0, 800, 500);
  time = clamp(time, 0, TIMING.end, TIMING.end);
  const receivedB = TIMING.first + delay;
  const receivedC = TIMING.second + delay;
  const parallel = receivedB > TIMING.second;
  const progress = (start, end) => time < start ? 0 : end === start ? 1 : clamp((time - start) / (end - start), 0, 1, 0);
  return {
    time, delay, parallel, parent: parallel ? 'A' : 'B', receivedB, receivedC,
    foundB: time >= TIMING.first, foundC: time >= TIMING.second,
    firstKnows: ['A', ...(time >= TIMING.first ? ['B'] : []), ...(time >= receivedC ? ['C'] : [])],
    secondKnows: ['A', ...(time >= receivedB ? ['B'] : []), ...(time >= TIMING.second ? ['C'] : [])],
    progressB: progress(TIMING.first, receivedB), progressC: progress(TIMING.second, receivedC),
    events: [
      { time: 0, event: 'Both miners know A.' },
      { time: TIMING.first, event: 'Miner 1 finds B, referencing A.' },
      { time: receivedB, event: 'Miner 2 receives B.' },
      { time: TIMING.second, event: `Miner 2 finds C, referencing ${parallel ? 'A' : 'B'}.` },
      { time: receivedC, event: 'Miner 1 receives C.' },
    ].sort((a, b) => a.time - b.time),
  };
}

export function spendState(first = 'alice') {
  const winner = first === 'bob' ? 'bob' : 'alice';
  return Object.freeze({ input: 10, alice: winner === 'alice' ? 10 : 0, bob: winner === 'bob' ? 10 : 0, accepted: winner, rejected: winner === 'alice' ? 'bob' : 'alice' });
}

export function parseKas(value) {
  const match = String(value).match(/^(\d+)(?:\.(\d{1,8}))?$/);
  if (!match) return null;
  return BigInt(match[1]) * 100000000n + BigInt((match[2] || '').padEnd(8, '0'));
}

export function formatKas(sompi) {
  if (sompi === null || sompi === undefined) return 'Unavailable';
  const amount = BigInt(sompi);
  const sign = amount < 0n ? '−' : '';
  const value = amount < 0n ? -amount : amount;
  const fraction = String(value % 100000000n).padStart(8, '0').replace(/0+$/, '');
  return `${sign}${value / 100000000n}${fraction ? '.' + fraction : ''} KAS`;
}

export function transactionState(payment = '7') {
  const input = 1250000000n, fee = 100000n, paid = parseKas(payment);
  const valid = paid !== null && paid > 0n && paid + fee <= input;
  return { input, fee, paid, valid, change: valid ? input - paid - fee : null };
}

export function vaultState(action = 'early') {
  const cases = {
    early: { elapsed: 30, wait: 60, requested: 2000, destination: true },
    large: { elapsed: 60, wait: 60, requested: 3000, destination: true },
    wrong: { elapsed: 60, wait: 60, requested: 2000, destination: false },
    valid: { elapsed: 60, wait: 60, requested: 2000, destination: true },
  };
  const attempt = cases[action] || cases.early;
  const checks = [attempt.elapsed >= attempt.wait, attempt.requested <= 2000, attempt.destination];
  const accepted = checks.every(Boolean);
  return { ...attempt, checks, accepted, balance: 10000 - (accepted ? attempt.requested : 0) };
}

// Reproducible draws illustrate mining variance, not future network observations.
export function miningState(share = 1, seed = 42) {
  share = clamp(share, .1, 10, 1);
  let state = Number(seed) >>> 0;
  const blocks = Array.from({ length: 600 }, (_, index) => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return { index, yours: state / 4294967296 < share / 100 };
  });
  return { share, seed, blocks, expected: 600 * share / 100, found: blocks.filter(block => block.yours).length, seconds: 60 };
}
