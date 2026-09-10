import {kgiCard} from './community.mjs';

export const doors = {
  1: {
    id: 1,
    path: '/door-1',
    label: 'Door 1',
    title: 'Beginner · Never used crypto',
    intel: 'Start from zero. Kaspa is public digital cash. You hold keys. Miners spend energy so rewriting history is expensive. That is proof of work. Help is for questions. Explore is to look at real blocks.',
    body: `<h2>What this is</h2>
      <p>A bank account is a company’s list. They can freeze it. Crypto, here, is a public list of coins that anyone can check. You hold a secret (keys). You sign a payment. Machines called miners spend electricity to propose the next records. Other computers check the work. Nobody in the middle has to approve you.</p>
      <p>That energy is the cost of lying. If fake history were cheap, someone could spend the same coins twice. Proof of work makes that expensive. Proof of stake replaced work with a vote of who already holds the coin. Kaspa stayed with proof of work.</p>
      <h2>Words</h2>
      <ul>
        <li><strong>Keys.</strong> The secret that proves a payment is yours. Lose them, the coins are gone. Share a recovery phrase and you gave the coins away.</li>
        <li><strong>Wallet.</strong> Software that holds keys. It is not a bank. An exchange balance is a claim on a company.</li>
        <li><strong>Ledger.</strong> The public list. Anyone can download it.</li>
        <li><strong>Miner.</strong> A machine racing to find valid work. Not a salary from Kaspa.</li>
        <li><strong>Node.</strong> A computer that stores the ledger and checks the rules.</li>
        <li><strong>Block.</strong> A batch of payments plus proof of work. Kaspa can keep more than one honest block at the same time. That is a blockDAG, not a single chain.</li>
      </ul>
      <h2>A payment</h2>
      <ol>
        <li>You send. The wallet signs. Sending is not settling.</li>
        <li>A miner includes it in a block. Inclusion is not “done.”</li>
        <li>The network accepts it in the agreed history. Those coins cannot be spent again.</li>
        <li>The recipient waits as they choose. Kaspa does not pick that wait for them.</li>
      </ol>
      <h2>Kaspa in one line</h2>
      <p>Same idea as Bitcoin (keys, miners, public ledger). Bitcoin is a chain: extra honest blocks are thrown away. Kaspa keeps them and orders them. About ten blocks per second on mainnet. That is a target rate, not a promise that a coffee is irreversible in a tenth of a second.</p>
      <h2>Do this</h2>
      <p>Do not paste a recovery phrase into a website or a chat. Learn on Testnet-10 if you try a wallet: tKAS is not real KAS. Price talk is not a source.</p>
      <p>Questions: <a href="/help">Help</a> (Kaspa Discord). Look at blocks and addresses: <a href="/explore">Explore</a>.</p>
      <p>Next lesson is Door 2 if you already know Bitcoin or Ethereum. If you are still new, stay here, then Help and Explore.</p>`,
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
    intel: 'You already know a chain. Kaspa is still proof of work. Honest parallel blocks are kept and ordered. Speed is not a new security story. Help is for questions. Explore is the live ledger.',
    body: `<h2>The difference</h2>
      <p>Bitcoin selects one chain and orphans the rest. Kaspa keeps concurrent proof-of-work blocks in a DAG and orders them with GHOSTDAG. The double-spend check still runs after ordering. A DAG is not a pass to spend twice.</p>
      <h2>Place it</h2>
      <p><strong>Bitcoin.</strong> Same PoW, UTXO, no premine. Shorter block interval. Recipients still pick a wait. Inclusion, acceptance, and that wait are three different things. Nodes still hear every block.</p>
      <p><strong>Ethereum.</strong> Ethereum is proof of stake and accounts. Kaspa is miners and UTXOs. Toccata added spending rules (covenants) on outputs. That is not the EVM. You do not deploy Solidity on Kaspa L1 and get Ethereum’s tooling.</p>
      <p><strong>Fast PoS and L2s.</strong> Their speed is often a sequencer or a validator set. Kaspa’s speed is many proof-of-work blocks. 10 blocks per second is live. 100 BPS is research, not a spec. Do not map a TPS slogan onto block rate.</p>
      <h2>UTXO, not an account VM</h2>
      <p>A payment consumes outputs and creates new ones. A covenant is a rule on an output. Shared apps with one global book (a pool, an AMM) are a different problem. vProgs are research. They are not a product testnet.</p>
      <h2>Live versus later</h2>
      <ul>
        <li><strong>Live.</strong> GHOSTDAG. 10 BPS. Toccata protocol rules. rusty-kaspa v2.0.1 checked here.</li>
        <li><strong>v1.0.0.</strong> SilverScript compiler tagged 9 Sep 2026. Application readiness is separate.</li>
        <li><strong>Prototype.</strong> Argent. Not release-ready. Leader/delegate input-group invariants are documented; rules 5 and 6 are marked not implemented.</li>
        <li><strong>Research.</strong> vProgs.</li>
        <li><strong>Proposed.</strong> DAGKnight. No mainnet activation in the checked KIP or node releases.</li>
      </ul>
      <p>Toccata is consensus. silverc is a compiler. A tweet is not a KIP.</p>
      <p>Questions: <a href="/help">Help</a>. Blocks, Testnet-10 explorer, live DAG: <a href="/explore">Explore</a>.</p>`,
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
    intel: 'Skip the pitch. Dated status, live versus research, and the tradeoffs. If a claim has no source, it is not intel. Help is Discord. Explore is the ledger.',
    body: `<h2>Checked here</h2>
      <p>6 September 2026. DAA 532,696,787. rusty-kaspa v2.0.1. Subsidy about 2.18 KAS per block. Supply about 27.68 billion. Those numbers age. Quote them from status, not from memory.</p>
      <p>Toccata activated at DAA 474,165,565 (about 30 Jun 2026). KIPs 16, 17, 20, and 21 read Active in the checked repository. 10 BPS is live. SilverScript v1.0.0 is tagged. KCC-0020 is Draft. vProgs have no public product testnet. DAGKnight remains Proposed.</p>
      <h2>Do not claim</h2>
      <ul>
        <li>100 BPS live</li>
        <li>Instant irreversible payments</li>
        <li>Mature native smart contracts as an Ethereum replacement</li>
        <li>KCC-20 as the adopted token standard</li>
        <li>A compiler tag means production dapps exist</li>
        <li>vProgs live</li>
        <li>Toccata still “coming soon” (it is live)</li>
      </ul>
      <h2>Order of programmability</h2>
      <ol>
        <li><strong>Covenants on L1.</strong> Toccata. Live protocol. Wallets and indexers are separate.</li>
        <li><strong>SilverScript.</strong> Compiler, v1.0.0 tagged 9 Sep 2026. Not the hardfork. Application readiness is separate.</li>
        <li><strong>Argent.</strong> Prototype. Not release-ready. Input-group invariants documented; rules 5 and 6 marked not implemented.</li>
        <li><strong>vProgs.</strong> Research. Not a mainnet product.</li>
      </ol>
      <h2>Builder network</h2>
      <p>Testnet-10. Addresses start with <code>kaspatest:</code>. CPU miner first. Explorer: tn10.kaspa.stream. A public mainnet node is not a miner and is not open RPC.</p>
      <p>Questions: <a href="/help">Help</a>. Mainnet, Testnet-10, live DAG: <a href="/explore">Explore</a>.</p>`,
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
    intel: 'Price is not a protocol. A live rule is not an app. A repository is not production. If you will repeat a sentence, check it. Help is Discord. Explore is the ledger.',
    body: `<h2>What is not intel</h2>
      <p>Price predictions and chart analysis do not change GHOSTDAG, issuance, node cost, or whether a wallet can spend a covenant. If you arrived with a target, leave it. The Moonboy tab exists for that refuse pile.</p>
      <h2>Place Kaspa in one paragraph</h2>
      <p>PoW cash with a DAG history. Not staking. Not an EVM. Not a rollup brand. 10 BPS is live. Toccata is live. SilverScript v1.0.0 is a compiler tag, not production dapps. vProgs are research. DAGKnight is proposed.</p>
      <h2>Labels</h2>
      <ul>
        <li><strong>Live.</strong> Released, activated, observable. Example: Toccata at a published DAA score.</li>
        <li><strong>Roadmap.</strong> Written intent in a document. Not a date you invented.</li>
        <li><strong>Research.</strong> A paper, a branch, a prototype. Not a product.</li>
        <li><strong>Wrong.</strong> Contradicted by the node, the KIP, or the dated snapshot. Say so.</li>
      </ul>
      <h2>Before you post</h2>
      <ol>
        <li>Does a KIP, a rusty-kaspa release, or docs.kaspa.org say it?</li>
        <li>Is the status Active, Draft, Proposed, or a README warning?</li>
        <li>Did you date the claim? DAA, subsidy, and supply move.</li>
        <li>Are you mixing protocol (Toccata), compiler (SilverScript), and research (vProgs)?</li>
        <li>Would the sentence still be true if the KAS price were zero?</li>
      </ol>
      <p>If step 5 fails, you were talking about a market. Stop.</p>
      <p>Still true at 10 BPS: node cost, mining pools, wallet gaps, indexer honesty, recipient-chosen wait. None of that is solved by being sure.</p>
      <p>Questions: <a href="/help">Help</a>. Check a block or a <code>kaspatest:</code> address: <a href="/explore">Explore</a>.</p>`,
    reads: [
      ['Help', 'Correct Discord tab. Facts. No seed. No price.', '/help'],
      ['Explore', 'Mainnet and TN10 explorers, live DAG.', '/explore'],
      ['Moonboy', 'Price talk is not a source.', '/moonboy'],
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
  {id: 'moonboy', door: 4, label: 'Moonboy crypto bro', intel: 'No price target lives here. If you came for a moon, read this door, then the Moonboy tab.'},
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
