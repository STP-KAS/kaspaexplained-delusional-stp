import {kgiCard} from './community.mjs';

export const doors = {
  1: {
    id: 1,
    path: '/door-1',
    label: 'Door 1',
    title: 'New to crypto',
    intel: 'Kaspa is digital cash that does not need a bank. Miners spend energy so nobody can rewrite a payment for free. That is proof of work. The rest of this page is what that means, and what it does not mean.',
    body: `<h2>What this is</h2>
      <p>Ordinary money is an account at a company. They can freeze it, reverse it, or go down. Crypto, in the original sense, is a public ledger that anyone can check. You hold keys. You sign a payment. Miners spend electricity to propose the next records. Other computers check the work. Nobody in the middle has to approve you.</p>
      <p>That energy is not decoration. It is the cost of lying about history. If rewriting the ledger were cheap, a thief could spend the same coins twice. Proof of work makes that expensive. Proof of stake replaced that cost with a vote of who already holds the coin. Kaspa did not take that turn. It is still proof of work.</p>
      <h2>Where Kaspa sits</h2>
      <p>Bitcoin is the same idea: miners, keys, no premine as a fair-launch story. Bitcoin is a chain. When two honest miners find a block at the same time, one block is thrown away. Kaspa is a blockDAG. Honest parallel blocks stay. GHOSTDAG puts them in order. About ten blocks per second on mainnet today. That is a target rate, not a promise that your coffee is irreversible in a tenth of a second.</p>
      <p>Most later coins sold speed by changing the security story: staking, a small set of validators, or a company sequencer. Kaspa’s bet is the opposite. Keep Bitcoin’s root. Make the ledger fast enough that payments and, later, spending rules can live on it without a second chain.</p>
      <h2>What still costs you</h2>
      <p>If you lose the keys, the coins are gone. If mining concentrates, a few operators matter more than the diagram suggests. Nodes still have to hear every block. Ten blocks per second is work for the network, not free throughput. Inclusion in a block is not the same as acceptance in the agreed history. The recipient chooses when to treat a payment as settled.</p>
      <p>Price talk is not a source. Watch the Graph Inspector if you want a picture of the DAG. Then try the playground: it is the same rules, slowed down so you can see them.</p>`,
    reads: [
      ['Playground', 'Delay, double spend, mining share, spending rules. Your tKAS if you bring it.', '/playground'],
      ['Using KAS', 'A payment, change, and a fee.', '/why-kaspa-matters'],
      ['What is live', 'Dated labels, not a pitch.', '/status'],
    ],
  },
  2: {
    id: 2,
    path: '/door-2',
    label: 'Door 2',
    title: 'Knows crypto, not Kaspa',
    intel: 'Kaspa is still proof of work. Parallel honest blocks are kept and ordered. Speed is not a new security story. Compare it to the chain you already know, then check what is actually live.',
    body: `<h2>The one-sentence difference</h2>
      <p>Bitcoin selects a chain and orphans the rest. Kaspa represents concurrent proof-of-work in a DAG and orders it with GHOSTDAG. The double-spend check still happens after ordering. A DAG is not a free pass to spend twice.</p>
      <h2>Against the rest of the map</h2>
      <p><strong>Bitcoin.</strong> Same PoW cash lineage, UTXO ledger, no premine. Kaspa’s block interval is much shorter. That does not copy Bitcoin’s settlement culture. Recipients still pick a policy. Node bandwidth and validation cost rise with the extra blocks.</p>
      <p><strong>Ethereum.</strong> Ethereum moved to proof of stake and an account virtual machine. Kaspa stayed with miners and UTXOs. Toccata added spending rules (covenants), covenant IDs, a ZK precompile, and sequencing lanes. That is not the EVM. You do not deploy a Solidity app onto Kaspa L1 today and get Ethereum’s tooling.</p>
      <p><strong>High-throughput PoS and L2s.</strong> Fast inclusion is often a sequencer or a validator set. Kaspa’s speed is many proof-of-work blocks. Honest work that arrives late is kept, not discarded. 100 BPS is a research target, not a spec. Crescendo’s 10 BPS is live.</p>
      <h2>Live versus later</h2>
      <p>Toccata is live on mainnet. Application tooling is younger than the consensus rule. SilverScript is a release candidate; prefer Testnet-10 until a tagged v1. vProgs (based programs with validity proofs) are research. DAGKnight is still Proposed. A merged Active KIP is law. A tweet, a Discord rumor, and a forum thread are not.</p>
      <h2>What speed does not buy</h2>
      <p>It does not remove miner concentration. It does not make every wallet support covenants. It does not make a repository into a product. It does not make a price chart into evidence. The skeptical list is the same as for any PoW coin, plus the extra node cost of a fast DAG. Read that before you repeat a sentence from X.</p>`,
    reads: [
      ['Playground', 'See parallel blocks and a failed double spend without a lecture.', '/playground'],
      ['What is live', 'Live, roadmap, research, wrong.', '/status'],
      ['Sources', 'How a claim is checked here.', '/sources'],
    ],
  },
  3: {
    id: 3,
    path: '/door-3',
    label: 'Door 3',
    title: 'Knows Kaspa',
    intel: 'Skip the pitch. Check dated status, live versus research, and the tradeoffs. If a claim has no source, it is not intel.',
    body: `<h2>Where the machine actually is</h2>
      <p>Toccata is live (DAA 474,165,565, about 30 Jun 2026). rusty-kaspa v2.0.1 is the maintenance tag. KIPs 16, 17, 20, and 21 are Active. 10 BPS is live. SilverScript is v1-rc1, experimental. KCC-0020 is Draft. vProgs have no public product testnet. DAGKnight remains Proposed; the rusty <code>dagknight</code> branch is not merged.</p>
      <p>Do not claim: 100 BPS live, instant irreversible payments, mature native smart contracts, KCC-20 adopted, Silverscript v1 stable, vProgs live, Kurrent mainnet.</p>
      <h2>Kaspa versus the rest, without the brochure</h2>
      <p>The digital-cash story is still the honest one: PoW, UTXO, fair launch. The DAG is how Kaspa tries to keep that story at a payment-like interval. Programmability is covenants on L1 now, based programs later. That is a different shape from “EVM L2 on a PoS L1.” It is also earlier. Wallets, indexers, and compilers are catching up. Discord still spends most of its volume on wallet UX, fees, and “is SilverScript the hardfork?” (no: Toccata is consensus; silverc is a compiler).</p>
      <h2>Costs you already know and should not skip</h2>
      <p>Node cost scales with block rate. Mining can still pool. A live opcode is not an audited app. Testnet-10 is the builder network; do not use testnet-12. If you are mining tKAS, bring it to the playground. This site does not drip faucet coins at you.</p>
      <p>Builder door: kaspa.org/build. Status table on this site. Playground for the mechanics. PegLab if someone says they need a stable for a dapp.</p>`,
    reads: [
      ['Playground', 'The mechanics, plus your Testnet-10 wallet.', '/playground'],
      ['Node', 'TN10 rusty-kaspa, then tKAS. CPU first.', '/node'],
      ['Build on Kaspa', 'TN10 node, miner, public node, official build door.', '/build-on-kaspa'],
      ['What is live', 'Activation, tools, prototypes.', '/status'],
    ],
  },
  4: {
    id: 4,
    path: '/door-4',
    label: 'Door 4',
    title: 'Thinks they know',
    intel: 'Price is not a protocol. A live rule is not an app. A repository is not production. Compare Kaspa to the rest of crypto with labels, not vibes.',
    body: `<h2>Stop doing the useless work</h2>
      <p>Price predictions are not intel. Detailed chart analysis is the same waste. Neither one changes GHOSTDAG, issuance, node cost, or whether a wallet can spend a covenant. If you arrived with a target, this door is the correction.</p>
      <h2>How to place Kaspa without lying</h2>
      <p>It is PoW cash with a DAG history, not a staking chain, not an EVM, not a rollup brand. 10 BPS is live. Toccata is live. Tooling is young. vProgs are later. DAGKnight is proposed. Those sentences are enough. Extra adjectives are usually a pitch.</p>
      <p>Bitcoiners will ask about settlement and node cost. Ethereum people will look for a VM and a token standard. Solana people will look for throughput and then skip the security model. Answer with the status table, not with a market cap.</p>
      <h2>Evaluate before you repeat</h2>
      <p>A consensus rule can be live while every product on top is a prototype. A GitHub org is not production. Testnet-10 is not mainnet. “Core” is not a legal title. Use the labels: live, roadmap, research, wrong. Cite a primary source. Community rule: be mature, skip price talk, build, keep a positive critical mindset.</p>
      <p>The Moonboy tab exists so this door does not have to shout. The playground exists so you can break a double spend instead of arguing about one.</p>`,
    reads: [
      ['Moonboy', 'Why price talk and chart analysis are not intel.', '/moonboy'],
      ['Playground', 'Break the stories against a model.', '/playground'],
      ['What is live', 'Labels: live, roadmap, research, wrong.', '/status'],
      ['Sources', 'How a claim is checked on this site.', '/sources'],
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
