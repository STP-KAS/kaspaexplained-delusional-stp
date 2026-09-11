export const site = {
  title: 'Kaspa Explained STP',
  domain: 'http://127.0.0.1:8899',
  localHost: 'kaspaexplained-stp.localhost',
  checked: '2026-09-06',
  navigation: [
    ['Playground', '/playground'],
    ['Use KAS', '/why-kaspa-matters'],
    ['Build', '/build-on-kaspa'],
    ['Node', '/node'],
    ['Explore', '/explore'],
    ['Chat', '/kachat'],
    ['PegLab', '/peglab'],
    ['Moonboy', '/moonboy'],
    ['Practices', '/best-practices'],
    ['Help', '/help'],
    ['X', '/x-handles'],
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
    ['Silverscript', 'v1.0.0', 'Official language and compiler release, tagged 9 Sep 2026. Application readiness is separate.', 'https://github.com/kaspanet/silverscript/releases/tag/v1.0.0'],
    ['Argent', 'Prototype', 'Not release-ready. Leader and delegate input-group invariants are documented; compiler rules 5 and 6 are marked not implemented.', 'https://github.com/argent-lang/argent/blob/master/docs/security-invariants/leader-delegate-input-groups.md'],
    ['vProgs', 'Research', 'Early repo, no tagged product. Sutton 11 Sep 2026: global DeFi is not sequential; related events still need order. A tweet is not a spec.', 'https://x.com/michaelsuttonil/status/2098204180406026482'],
    ['DAGKnight', 'Proposed', 'Research code is active. No mainnet activation is documented in the checked KIP or node releases.', 'https://github.com/kaspanet/kips/blob/master/kip-0002.md'],
  ],
};
