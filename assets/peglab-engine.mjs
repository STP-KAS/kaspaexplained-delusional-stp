// PegLab economic engine. Pure integers. Browser and Node.
// This is the executable spec of the toy. The SilverScript contract is the
// on-chain intent; if they disagree, the tests fail.

export const NETWORK = 'testnet-10';
export const MAX_SOMPI = 1_000_000_000n; // 10 tKAS
export const MAX_TPEG = 10_000n;
export const MAX_FEE = 3_000_000n;
export const UNIT_CELL = 1_000n;
export const POOL_DUST_SOMPI = 1_000_000n;
export const POOL_DUST_TPEG = 1n;
export const MAX_POOL_SEED_SOMPI = 200_000_000n; // 2 tKAS
export const DEFAULT_ORACLE = 100_000n; // sompi per tPEG
export const DEFAULT_POOL_KAS = 200_000_000n;
export const DEFAULT_POOL_TPEG = 2_000n;

export const KIND_CONTROL = 1;
export const KIND_UNIT = 2;

export class PegError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'PegError';
    this.code = code;
  }
}

const hex32 = (value, label = 'bytes') => {
  if (typeof value !== 'string' || !/^[0-9a-f]{64}$/i.test(value)) {
    throw new PegError('BAD_HEX', `Expected 32-byte hex for ${label}.`);
  }
  return value.toLowerCase();
};

const u = (value, { min = 0n, max = MAX_SOMPI, label = 'amount' } = {}) => {
  const n = typeof value === 'bigint' ? value : BigInt(value);
  if (n < min || n > max) throw new PegError('RANGE', `${label} out of range.`);
  return n;
};

const copyUnits = (units) => units.map((x) => ({ owner: x.owner, quantity: x.quantity }));

export function inspect(state) {
  const circulating = state.units.reduce((n, x) => n + x.quantity, 0n);
  const tpegBudget = state.capRemaining + circulating + state.poolTpeg;
  const poolPrice = state.poolTpeg === 0n ? null : state.poolTkas / state.poolTpeg;
  const poolRem = state.poolTpeg === 0n ? null : state.poolTkas % state.poolTpeg;
  const oracle = state.oracleLive ? state.oraclePrice : 0n;
  let depegBps = null;
  if (oracle > 0n && poolPrice !== null) {
    const diff = poolPrice > oracle ? poolPrice - oracle : oracle - poolPrice;
    depegBps = (diff * 10_000n) / oracle;
  }
  return {
    network: NETWORK,
    seriesId: state.seriesId,
    admin: state.admin,
    paused: state.paused,
    oracleLive: state.oracleLive,
    oraclePrice: oracle,
    poolTkas: state.poolTkas,
    poolTpeg: state.poolTpeg,
    capRemaining: state.capRemaining,
    circulating,
    tpegBudget,
    poolPrice,
    poolPriceRemainder: poolRem,
    depegBps,
    cannotDefendPeg: state.poolTkas <= MAX_POOL_SEED_SOMPI || state.poolTpeg <= DEFAULT_POOL_TPEG,
    units: copyUnits(state.units),
    warning: 'TESTNET TOY. NOT USD. WILL DEPEG.',
  };
}

function assertLive(state) {
  if (!state.oracleLive || state.oraclePrice <= 0n) {
    throw new PegError('STALE_ORACLE', 'Oracle is stale or unpriced. Mint and swaps refuse.');
  }
}

function assertAdmin(state, admin) {
  if (hex32(admin, 'admin') !== state.admin) {
    throw new PegError('BAD_ADMIN', 'Admin public key does not match CONTROL.');
  }
}

function assertBudget(state) {
  const circulating = state.units.reduce((n, x) => n + x.quantity, 0n);
  if (state.capRemaining < 0n || state.poolTpeg < 0n || circulating < 0n) {
    throw new PegError('BUDGET', 'Negative tPEG budget.');
  }
  if (state.capRemaining + circulating + state.poolTpeg > MAX_TPEG) {
    throw new PegError('BUDGET', 'tPEG budget exceeds 10,000.');
  }
  if (state.poolTkas > MAX_SOMPI) throw new PegError('BUDGET', 'Pool tKAS exceeds 10 tKAS cap.');
}

function credit(state, owner, quantity) {
  owner = hex32(owner, 'holder');
  const found = state.units.find((x) => x.owner === owner);
  if (found) found.quantity += quantity;
  else state.units.push({ owner, quantity });
}

function debit(state, owner, quantity) {
  owner = hex32(owner, 'holder');
  const found = state.units.find((x) => x.owner === owner);
  if (!found || found.quantity < quantity) {
    throw new PegError('BALANCE', 'Holder does not have that many tPEG.');
  }
  found.quantity -= quantity;
  if (found.quantity === 0n) state.units = state.units.filter((x) => x !== found);
}

export function genesis({
  seriesId = 'aa'.repeat(32),
  admin = '11'.repeat(32),
  oraclePrice = DEFAULT_ORACLE,
  poolTkas = DEFAULT_POOL_KAS,
  poolTpeg = DEFAULT_POOL_TPEG,
} = {}) {
  seriesId = hex32(seriesId, 'series');
  admin = hex32(admin, 'admin');
  oraclePrice = u(oraclePrice, { min: 1n, max: MAX_SOMPI, label: 'oraclePrice' });
  poolTkas = u(poolTkas, { min: POOL_DUST_SOMPI, max: MAX_POOL_SEED_SOMPI, label: 'poolTkas' });
  poolTpeg = u(poolTpeg, { min: POOL_DUST_TPEG, max: MAX_TPEG, label: 'poolTpeg' });
  const state = {
    seriesId,
    admin,
    oraclePrice,
    oracleLive: true,
    paused: false,
    capRemaining: MAX_TPEG - poolTpeg,
    poolTkas,
    poolTpeg,
    units: [],
  };
  assertBudget(state);
  return state;
}

export function mint(state, { tkasIn, minter }) {
  if (state.paused) throw new PegError('PAUSED', 'Pause blocks mint. Redeem still works.');
  assertLive(state);
  tkasIn = u(tkasIn, { min: 1n, max: MAX_SOMPI, label: 'tkasIn' });
  if (tkasIn % state.oraclePrice !== 0n) {
    throw new PegError('ALIGN', 'Mint tKAS must be a whole number of tPEG at the oracle price.');
  }
  const minted = tkasIn / state.oraclePrice;
  if (minted < 1n) throw new PegError('DUST', 'Mint would issue zero tPEG.');
  if (minted > state.capRemaining) throw new PegError('OVER_CAP', 'Mint exceeds remaining cap.');
  if (state.poolTkas + tkasIn > MAX_SOMPI) throw new PegError('BUDGET', 'Backing would exceed 10 tKAS.');
  const next = {
    ...state,
    capRemaining: state.capRemaining - minted,
    poolTkas: state.poolTkas + tkasIn,
    units: copyUnits(state.units),
  };
  credit(next, minter, minted);
  assertBudget(next);
  return { state: next, minted, tkasIn, minter: hex32(minter, 'minter') };
}

export function redeem(state, { units, holder }) {
  assertLive(state);
  units = u(units, { min: 1n, max: MAX_TPEG, label: 'units' });
  const released = units * state.oraclePrice;
  if (state.poolTkas - released < POOL_DUST_SOMPI) {
    throw new PegError('POOL_DUST', 'Redeem would empty the pool below its dust floor.');
  }
  const next = {
    ...state,
    capRemaining: state.capRemaining + units,
    poolTkas: state.poolTkas - released,
    units: copyUnits(state.units),
  };
  debit(next, holder, units);
  assertBudget(next);
  return { state: next, burned: units, released, holder: hex32(holder, 'holder') };
}

export function transfer(state, { from, to, units }) {
  units = u(units, { min: 1n, max: MAX_TPEG, label: 'units' });
  if (hex32(from, 'from') === hex32(to, 'to')) {
    throw new PegError('SELF', 'Transfer needs a different holder.');
  }
  const next = { ...state, units: copyUnits(state.units) };
  debit(next, from, units);
  credit(next, to, units);
  assertBudget(next);
  return { state: next, units, from: hex32(from, 'from'), to: hex32(to, 'to') };
}

export function swapKas(state, { tkasIn, trader }) {
  if (state.paused) throw new PegError('PAUSED', 'Pause blocks swaps. Redeem still works.');
  assertLive(state);
  tkasIn = u(tkasIn, { min: 1n, max: MAX_SOMPI, label: 'tkasIn' });
  const oldKas = state.poolTkas;
  const oldTpeg = state.poolTpeg;
  if (oldTpeg < POOL_DUST_TPEG || oldKas < POOL_DUST_SOMPI) {
    throw new PegError('EMPTY_POOL', 'Pool is too shallow to swap.');
  }
  const newKas = oldKas + tkasIn;
  if (newKas > MAX_SOMPI) throw new PegError('BUDGET', 'Swap would exceed 10 tKAS backing cap.');
  const newTpeg = (oldKas * oldTpeg) / newKas;
  if (newTpeg < POOL_DUST_TPEG) throw new PegError('POOL_DUST', 'Swap would drain tPEG below dust.');
  const tpegOut = oldTpeg - newTpeg;
  if (tpegOut < 1n) throw new PegError('DUST', 'Swap output rounds to zero tPEG.');
  const next = {
    ...state,
    poolTkas: newKas,
    poolTpeg: newTpeg,
    units: copyUnits(state.units),
  };
  credit(next, trader, tpegOut);
  assertBudget(next);
  return { state: next, tkasIn, tpegOut, trader: hex32(trader, 'trader') };
}

export function swapTpeg(state, { units, trader }) {
  if (state.paused) throw new PegError('PAUSED', 'Pause blocks swaps. Redeem still works.');
  assertLive(state);
  units = u(units, { min: 1n, max: MAX_TPEG, label: 'units' });
  const oldKas = state.poolTkas;
  const oldTpeg = state.poolTpeg;
  const newTpeg = oldTpeg + units;
  if (newTpeg > MAX_TPEG) throw new PegError('BUDGET', 'Pool tPEG would exceed cap.');
  const newKas = (oldKas * oldTpeg) / newTpeg;
  if (newKas < POOL_DUST_SOMPI) throw new PegError('POOL_DUST', 'Swap would drain tKAS below dust.');
  const kasOut = oldKas - newKas;
  if (kasOut < 1n) throw new PegError('DUST', 'Swap output rounds to zero sompi.');
  const next = {
    ...state,
    poolTkas: newKas,
    poolTpeg: newTpeg,
    units: copyUnits(state.units),
  };
  debit(next, trader, units);
  assertBudget(next);
  return { state: next, unitsIn: units, kasOut, trader: hex32(trader, 'trader') };
}

export function postOracle(state, { price, live = true, admin }) {
  assertAdmin(state, admin);
  const oracleLive = Boolean(live);
  const oraclePrice = oracleLive
    ? u(price, { min: 1n, max: MAX_SOMPI, label: 'oraclePrice' })
    : 0n;
  if (!oracleLive) {
    return { state: { ...state, oraclePrice: 0n, oracleLive: false, units: copyUnits(state.units) } };
  }
  return {
    state: { ...state, oraclePrice, oracleLive: true, units: copyUnits(state.units) },
  };
}

export function setPause(state, { paused, admin }) {
  assertAdmin(state, admin);
  return { state: { ...state, paused: Boolean(paused), units: copyUnits(state.units) } };
}

export function seedPool(state, { tkasIn = 0n, tpegIn = 0n, admin }) {
  assertAdmin(state, admin);
  tkasIn = u(tkasIn, { min: 0n, max: MAX_POOL_SEED_SOMPI, label: 'tkasIn' });
  tpegIn = u(tpegIn, { min: 0n, max: MAX_TPEG, label: 'tpegIn' });
  if (tkasIn === 0n && tpegIn === 0n) throw new PegError('NOOP', 'Seed must move tKAS or tPEG.');
  if (tpegIn > state.capRemaining) throw new PegError('OVER_CAP', 'Seed tPEG exceeds remaining cap.');
  const next = {
    ...state,
    poolTkas: state.poolTkas + tkasIn,
    poolTpeg: state.poolTpeg + tpegIn,
    capRemaining: state.capRemaining - tpegIn,
    units: copyUnits(state.units),
  };
  if (next.poolTkas > MAX_POOL_SEED_SOMPI) {
    throw new PegError('TINY_POOL', 'Seed exceeds the 2 tKAS tiny-pool bound.');
  }
  if (next.poolTkas > MAX_SOMPI) throw new PegError('BUDGET', 'Backing cap.');
  assertBudget(next);
  return { state: next, tkasIn, tpegIn };
}

export function withdrawPool(state, { tkasOut = 0n, tpegOut = 0n, admin }) {
  assertAdmin(state, admin);
  tkasOut = u(tkasOut, { min: 0n, max: MAX_SOMPI, label: 'tkasOut' });
  tpegOut = u(tpegOut, { min: 0n, max: MAX_TPEG, label: 'tpegOut' });
  if (tkasOut === 0n && tpegOut === 0n) throw new PegError('NOOP', 'Withdraw must move tKAS or tPEG.');
  if (state.poolTpeg < tpegOut || state.poolTkas < tkasOut) {
    throw new PegError('EMPTY_POOL', 'Withdraw exceeds pool reserves.');
  }
  const next = {
    ...state,
    poolTkas: state.poolTkas - tkasOut,
    poolTpeg: state.poolTpeg - tpegOut,
    capRemaining: state.capRemaining + tpegOut,
    units: copyUnits(state.units),
  };
  if (next.poolTkas < POOL_DUST_SOMPI || next.poolTpeg < POOL_DUST_TPEG) {
    throw new PegError('POOL_DUST', 'Withdraw would breach the dust floor.');
  }
  assertBudget(next);
  return { state: next, tkasOut, tpegOut };
}

export function walletPrompt(action, state) {
  const snap = inspect(state);
  const lines = [
    'TESTNET TOY. NOT USD. WILL DEPEG.',
    `Action: ${action}`,
    `Oracle: ${snap.oracleLive ? `${snap.oraclePrice} sompi / tPEG` : 'STALE'}`,
    `Pool: ${snap.poolTkas} sompi + ${snap.poolTpeg} tPEG`,
    `Pool price: ${snap.poolPrice === null ? 'n/a' : `${snap.poolPrice} sompi / tPEG`}`,
    `Target vs pool: ${snap.depegBps === null ? 'n/a' : `${snap.depegBps} bps apart`}`,
    snap.cannotDefendPeg ? 'Pool depth cannot defend a peg.' : 'Pool still tiny by design.',
    snap.paused ? 'Paused: mint and swaps blocked; redeem open.' : 'Not paused.',
  ];
  return lines.join('\n');
}

function jsonState(state) {
  const snap = inspect(state);
  return {
    ...snap,
    oraclePrice: snap.oraclePrice.toString(),
    poolTkas: snap.poolTkas.toString(),
    poolTpeg: snap.poolTpeg.toString(),
    capRemaining: snap.capRemaining.toString(),
    circulating: snap.circulating.toString(),
    tpegBudget: snap.tpegBudget.toString(),
    poolPrice: snap.poolPrice === null ? null : snap.poolPrice.toString(),
    poolPriceRemainder: snap.poolPriceRemainder === null ? null : snap.poolPriceRemainder.toString(),
    depegBps: snap.depegBps === null ? null : snap.depegBps.toString(),
    units: snap.units.map((x) => ({ owner: x.owner, quantity: x.quantity.toString() })),
  };
}

export function depegDemo() {
  const admin = '11'.repeat(32);
  const alice = '22'.repeat(32);
  const steps = [];
  const push = (title, state, extra = {}) => {
    steps.push({ title, warning: 'TESTNET TOY. NOT USD. WILL DEPEG.', ...jsonState(state), ...extra });
  };

  let state = genesis({ admin });
  push('1. Genesis: 2 tKAS + 2,000 tPEG tiny pool, oracle 100,000 sompi/tPEG', state);

  let out = mint(state, { tkasIn: 10_000_000n, minter: alice });
  state = out.state;
  push('2. Alice mints 100 tPEG at the oracle (locks 10,000,000 sompi)', state, {
    minted: out.minted.toString(),
    tkasIn: out.tkasIn.toString(),
  });

  out = postOracle(state, { price: 125_000n, admin });
  state = out.state;
  push('3. Admin posts oracle 125,000 (+25%). Target moved; pool did not.', state);

  out = swapKas(state, { tkasIn: 20_000_000n, trader: alice });
  state = out.state;
  push('4. Alice sells 20,000,000 sompi through the tiny pool. Price moves.', state, {
    tkasIn: out.tkasIn.toString(),
    tpegOut: out.tpegOut.toString(),
  });

  const snap = inspect(state);
  steps.push({
    title: '5. Read the break',
    warning: 'TESTNET TOY. NOT USD. WILL DEPEG.',
    targetSompiPerTpeg: snap.oraclePrice.toString(),
    poolSompiPerTpeg: snap.poolPrice.toString(),
    redeemSompiPerTpeg: snap.oraclePrice.toString(),
    depegBps: snap.depegBps.toString(),
    lesson:
      'Three numbers, none of them a dollar: the admin price, the pool price, and the redeem price. A 2 tKAS pool cannot pull them together. That is the $50k to $300k rung.',
  });
  return { network: NETWORK, unfunded: true, steps };
}
