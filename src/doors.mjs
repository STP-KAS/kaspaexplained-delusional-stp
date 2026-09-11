import {kgiCard} from './community.mjs';

export const doors = {
  1: {
    id: 1,
    path: '/door-1',
    label: 'Door 1',
    title: 'Beginner · Never used crypto',
    intel: 'Public cash. You hold keys. Miners spend energy so lying is expensive. Do not share a recovery phrase. Help is questions. Explore is real blocks.',
    body: `<h2>Overview</h2>
      <ul>
        <li>A bank can freeze your account. Here the list is public. You hold a secret (keys) and sign a payment.</li>
        <li><strong>Wallet</strong> holds keys. It is not a bank. An exchange balance is a company’s IOU.</li>
        <li><strong>Miner</strong> spends electricity to propose blocks. <strong>Node</strong> stores the list and checks the rules.</li>
        <li>Send, include, then accept. The recipient chooses how long to wait. Sending is not settling.</li>
        <li>Kaspa is like Bitcoin (keys, miners, public list) but keeps parallel honest blocks and orders them. About ten blocks per second. That is not instant finality.</li>
        <li>Never paste a recovery phrase. Testnet-10 tKAS is not real KAS. Price is not a source.</li>
      </ul>
      <p>Questions: <a href="/help">Help</a>. Live blocks: <a href="/explore">Explore</a>.</p>`,
    reads: [
      ['Help', 'Pick the Discord room. Ask with facts, not a seed or a price.', '/help'],
      ['Explore', 'kaspa.stream, Testnet-10 explorer, live DAG.', '/explore'],
      ['Playground', 'Slow the rules down. Bring tKAS if you have it.', '/playground'],
      ['Door 2', 'You know crypto. Place Kaspa next to it.', '/door-2'],
    ],
  },
  2: {
    id: 2,
    path: '/door-2',
    label: 'Door 2',
    title: 'Intermediate · Knows crypto, not Kaspa',
    intel: 'Bitcoin throws extra honest blocks away. Kaspa keeps them and orders them. Still proof of work. Not Ethereum. Help is questions. Explore is the ledger.',
    body: `<h2>Overview</h2>
      <ul>
        <li>Bitcoin: one chain, extras orphaned. Kaspa: concurrent PoW blocks in a DAG, ordered by GHOSTDAG. Double-spend is still checked after order.</li>
        <li>Same class as Bitcoin: PoW, UTXO, no premine. Inclusion, acceptance, and the recipient’s wait are three facts.</li>
        <li>Not Ethereum. Not an L2. Covenants are rules on outputs. Solidity does not run on Kaspa L1.</li>
        <li><strong>Live:</strong> GHOSTDAG, 10 BPS, Toccata protocol. <strong>Compiler tag:</strong> SilverScript v1.0.0 (apps are separate). <strong>Prototype:</strong> Argent, not release-ready. <strong>Research:</strong> vProgs. <strong>Proposed:</strong> DAGKnight.</li>
        <li>10 BPS is live. 100 BPS is research. A tweet is not a KIP.</li>
      </ul>
      <p>Questions: <a href="/help">Help</a>. Ledger: <a href="/explore">Explore</a>.</p>`,
    reads: [
      ['Help', 'Discord rooms. Facts, not a seed or a price.', '/help'],
      ['Explore', 'Mainnet and Testnet-10 explorers, Graph Inspector.', '/explore'],
      ['Playground', 'Parallel blocks and a failed double spend.', '/playground'],
      ['Door 3', 'Dated status and what not to claim.', '/door-3'],
    ],
  },
  3: {
    id: 3,
    path: '/door-3',
    label: 'Door 3',
    title: 'Advanced · Knows Kaspa',
    intel: 'Dated status only. Live, tagged, prototype, research. If it has no source, skip it. Help is Discord. Explore is the ledger.',
    body: `<h2>Overview</h2>
      <ul>
        <li>Snapshot 6 Sep 2026: rusty-kaspa v2.0.1. Toccata live (KIPs 16, 17, 20, 21 Active). 10 BPS live. Quote DAA and subsidy from <a href="/status">Status</a>; they age.</li>
        <li>Order: Toccata (live protocol) → SilverScript v1.0.0 (compiler tag, not production apps) → Argent (prototype; rules 5 and 6 not implemented) → vProgs (research). DAGKnight is Proposed.</li>
        <li>Do not claim: 100 BPS live, instant finality, Ethereum-class native contracts, KCC-20 adopted, vProgs live, Toccata “coming soon.”</li>
        <li>Build on Testnet-10 (<code>kaspatest:</code>). CPU first. Explorer: tn10.kaspa.stream.</li>
      </ul>
      <p>Questions: <a href="/help">Help</a>. Ledger: <a href="/explore">Explore</a>.</p>`,
    reads: [
      ['Help', 'Discord. Facts, network, error text. No seed. No price.', '/help'],
      ['Explore', 'kaspa.stream, tn10.kaspa.stream, Graph Inspector.', '/explore'],
      ['Node', 'TN10 kaspad and CPU tKAS, or a mainnet node.', '/node'],
      ['Door 4', 'How to check a claim before you repeat it.', '/door-4'],
    ],
  },
  4: {
    id: 4,
    path: '/door-4',
    label: 'Door 4',
    title: 'Expert · Checks claims',
    intel: 'Price is not protocol. Live is not an app. Check before you repeat. Help is Discord. Explore is the ledger.',
    body: `<h2>Overview</h2>
      <ul>
        <li>PoW cash, DAG history. Not staking. Not an EVM. 10 BPS live. Toccata live. SilverScript v1.0.0 is a compiler tag. vProgs are research. DAGKnight is proposed.</li>
        <li><strong>Live</strong> = activated and observable. <strong>Roadmap</strong> = written intent. <strong>Research</strong> = paper or prototype. <strong>Wrong</strong> = contradicted by the node, a KIP, or the dated snapshot.</li>
        <li>Before you repeat a sentence: primary source (KIP, rusty-kaspa, docs.kaspa.org)? Status Active/Draft/Proposed? Dated? Mixing Toccata / SilverScript / vProgs? True if KAS were worth zero?</li>
        <li>If the last check fails, it was a market claim. Stop. Wages, cash buffer, and a skill that sells without a token still exist. Node cost, pools, wallets, and wait time still exist at 10 BPS.</li>
      </ul>
      <p>Questions: <a href="/help">Help</a>. Check a block: <a href="/explore">Explore</a>.</p>`,
    reads: [
      ['Help', 'Correct Discord tab. Facts. No seed. No price.', '/help'],
      ['Explore', 'Mainnet and TN10 explorers, live DAG.', '/explore'],
      ['Moonboy', 'Chart is not a plan. Work and cash still sit outside crypto.', '/moonboy'],
      ['Door 1', 'If you will teach someone new, start them here.', '/door-1'],
    ],
  },
};

export const people = [
  {id: 'new', door: 1, label: 'New to crypto'},
  {id: 'crypto-not-kaspa', door: 2, label: 'Knows crypto, not Kaspa'},
  {id: 'kaspa', door: 3, label: 'Knows Kaspa'},
  {id: 'crypto-and-kaspa', door: 3, label: 'Knows crypto and Kaspa', intel: 'You already have both maps. Use status and the playground. Do not skip the costs.'},
  {id: 'thinks', door: 4, label: 'Thinks they know crypto'},
  {id: 'moonboy', door: 4, label: 'Moonboy crypto bro', intel: 'No price target lives here. A chart is not a job. Read this door, then Moonboy for what still works outside crypto.'},
  {id: 'institution', door: 2, label: 'Institution (speculative)', intel: 'This is not a prospectus. Settlement, node costs, and what is live. Speculation is labeled speculation.'},
  {id: 'influencer-tech', door: 4, label: 'Tech influencer', intel: 'If you will repeat this, cite a primary source. Live, roadmap, research, and wrong are different labels.'},
  {id: 'influencer-moon', door: 4, label: 'Moonboy influencer', intel: 'If you will repeat this, cite a primary source. Price talk is not intel.'},
  {id: 'cyberpunk', door: 2, label: 'Cyberpunk', intel: 'Proof of work is the root. Kaspa keeps it. No custodian is implied.'},
  {id: 'other-chain', door: 2, label: 'High-tech from another chain', intel: 'Same ledger questions, different shape. Kaspa is a PoW blockDAG, not a rollup pitch.'},
  {id: 'other', door: 1, label: 'Other', intel: 'If none of the doors fit, start as if you are new.'},
];

export const demos = [
  ['Playground', 'The mechanics, and your Testnet-10 tKAS if you bring it.', '/playground'],
  ['Using KAS', 'Follow a payment. Same walkthrough for every door.', '/why-kaspa-matters'],
];

export function kaspaFilm() {
  return `<figure class="door-film">
    <video controls playsinline preload="metadata" src="/media/kaspa-roots.mp4">
      Your browser cannot play this film. <a href="/media/kaspa-roots.mp4">Open the file</a>.
    </video>
    <figcaption class="small">Optional film. The Graph Inspector is the live picture.</figcaption>
  </figure>`;
}

export function doorKgi() {
  return kgiCard('door');
}

export function peopleChips(doorId) {
  const list = people.filter(person => person.door === doorId);
  if (!list.length) return '';
  return `<p class="small">I am… these people land on this door.</p>
    <div class="door-people" aria-label="People on this door">${list.map(person =>
      `<a href="/door-${person.door}?as=${person.id}">${person.label}</a>`
    ).join('')}</div>`;
}

export function mountDoors() {
  const note = document.querySelector('[data-door-as]');
  if (!note) return;
  const id = new URLSearchParams(location.search).get('as');
  const person = people.find(item => item.id === id);
  if (!person) return;
  note.hidden = false;
  note.textContent = `You arrived as: ${person.label}. ${person.intel || doors[person.door].intel}`;
}
