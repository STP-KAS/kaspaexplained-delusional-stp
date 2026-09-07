export const site = {
  title: 'Kaspa Explained',
  domain: 'https://kaspaexplained.com',
  checked: '2026-09-06',
  navigation: [
    ['Understand', '/what-is-kaspa'], ['Use KAS', '/why-kaspa-matters'],
    ['Evaluate', '/skeptical-case'], ['Build', '/build-on-kaspa'],
  ],
};

export const sources = {
  paper: ['GHOSTDAG paper', 'https://eprint.iacr.org/2018/104'],
  node: ['Rusty Kaspa', 'https://github.com/kaspanet/rusty-kaspa'],
  acceptance: ['Accepted-transaction integration', 'https://docs.kaspa.org/integrate/accepted-transactions'],
  programmable: ['Programmability documentation', 'https://docs.kaspa.org/programmability'],
  kips: ['Protocol proposals', 'https://github.com/kaspanet/kips'],
  kccs: ['Application conventions', 'https://github.com/kaspanet/kccs'],
  wallet: ['Wallet directory', 'https://wiki.kaspa.org/wallet'],
  explorer: ['Kaspa Explorer', 'https://explorer.kaspa.org/transactions'],
  reward: ['Consensus subsidy table', 'https://github.com/kaspanet/rusty-kaspa/blob/master/consensus/src/processes/coinbase.rs'],
};

export const snapshot = {
  checked: '6 September 2026, 10:20 UTC', daa: '532,696,787',
  reward: '2.18267645', supply: '27.6846 billion', version: '2.0.1',
  items: [
    ['GHOSTDAG', 'Live', 'Orders the blockDAG. Crescendo set a target of ten blocks per second.', 'https://github.com/kaspanet/kips/blob/master/kip-0014.md'],
    ['Toccata', 'Live protocol', 'Covenant spending rules, identifiers, sequencing commitments, and supported proof verification are active. Application readiness is separate.', 'https://github.com/kaspanet/rusty-kaspa/releases/tag/v2.0.0'],
    ['Silverscript', 'Release candidate', 'v1-rc1 is experimental. Its documentation recommends testnet-10 until a stable v1.', 'https://github.com/kaspanet/silverscript'],
    ['Argent', 'Prototype', 'Compiler and examples exist. Its README says it is not release-ready.', 'https://github.com/argent-lang/argent'],
    ['vProgs', 'Research', 'Early implementation. Repository existence does not establish production availability.', 'https://github.com/kaspanet/vprogs'],
    ['DAGKnight', 'Proposed', 'Research code is active. No mainnet activation is documented in the checked KIP or node releases.', 'https://github.com/kaspanet/kips/blob/master/kip-0002.md'],
  ],
};
