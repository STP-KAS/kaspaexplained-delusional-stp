import {kgiCard, doorVisuals} from './community.mjs';

export const doors = {
  1: {
    id: 1,
    path: '/door-1',
    label: 'Door 1',
    title: 'New to crypto',
    intel: 'Kaspa is a way to send coins without a bank. Miners spend energy so nobody can rewrite your payment for free. That energy is proof of work. Fair launch: no premine. Start with a payment. Then look at the network. Price talk is not a source.',
    body: `<p>You hold keys. You send a payment. Miners spend electricity to propose blocks. Other nodes check the work. Nobody in the middle has to approve you.</p>
      <p>On Kaspa, honest miners can find blocks at the same time. The network keeps those blocks and puts them in order. About ten blocks per second on mainnet today. That is a target rate, not a promise that your payment is final in a tenth of a second.</p>
      <p>Toccata is live: spending rules can travel with coins. Wallets and tools are still catching up. You do not need that yet. You need a wallet, a small send, and an explorer.</p>
      <p>Watch the Graph Inspector if you want a picture. Do not start with a chart of the coin’s exchange price.</p>`,
    reads: [
      ['Using KAS', 'A payment, change, and a fee. No wallet to install yet.', '/why-kaspa-matters'],
      ['How money mechanics work', 'Redemption, collateral, and a prediction payout as pictures.', '/money'],
      ['How Kaspa works', 'Two miners, a delay, parallel blocks.', '/what-is-kaspa'],
    ],
  },
  2: {
    id: 2,
    path: '/door-2',
    label: 'Door 2',
    title: 'Knows crypto, not Kaspa',
    intel: 'Kaspa is still proof of work. Blocks can be found in parallel and still be ordered. Speed is not a new security story. Compare it to a chain you already know, then check what is actually live.',
    body: `<p>Kaspa did not switch to staking. Miners hash. There is no premine. The ledger is a blockDAG: honest parallel blocks stay. GHOSTDAG orders them. A chain would throw the extra honest work away.</p>
      <p>Crescendo set a target of ten blocks per second. That is live. One hundred blocks per second is a research target, not a spec. Toccata is live: covenants, covenant IDs, a ZK precompile, sequencing lanes. Application tooling is younger than the consensus rule.</p>
      <p>Bitcoin comparison: same PoW cash idea, different history shape. Ethereum comparison: Kaspa is UTXO plus spending rules, not an account VM. vProgs are the later based-app research path. DAGKnight is still Proposed.</p>
      <p>A merged Active KIP is law. A forum thread is not. Recheck status before you repeat a sentence from X.</p>`,
    reads: [
      ['How Kaspa works', 'Parallel blocks and why a double spend still fails.', '/what-is-kaspa'],
      ['The tradeoffs', 'Node cost, mining concentration, what speed does not solve.', '/skeptical-case'],
      ['What is live', 'Dated status. Live, roadmap, research, wrong.', '/status'],
    ],
  },
  3: {
    id: 3,
    path: '/door-3',
    label: 'Door 3',
    title: 'Knows Kaspa',
    intel: 'Skip the pitch. Check dated status, live versus research, and the tradeoffs. If a claim has no source, it is not intel.',
    body: `<p>Toccata is live on mainnet (DAA 474,165,565, about 30 Jun 2026). rusty-kaspa v2.0.1 is the maintenance tag. KIPs 16, 17, 20, and 21 are Active. A tweet is not.</p>
      <p>SilverScript is v1-rc1, experimental. Prefer Testnet-10 until a tagged v1. KCC-0020 is Draft. vProgs have no public product testnet. DAGKnight remains Proposed; the rusty <code>dagknight</code> branch is not merged.</p>
      <p>Do not claim: 100 BPS live, instant irreversible payments, mature native smart contracts, KCC-20 adopted, Silverscript v1 stable, vProgs live, Kurrent mainnet.</p>
      <p>Builder door: kaspa.org/build. Faucets and mining notes: aspectron. Testnet-10 faucet: faucet-testnet.kaspanet.io. Discord has dedicated rooms. Telegram R&amp;D is observer-first; recaps are on kaspa.news.</p>`,
    reads: [
      ['What is live', 'Activation, tools, and what is still a prototype.', '/status'],
      ['Build on Kaspa', 'TN10 node, miner, public node, official build door.', '/build-on-kaspa'],
      ['The tradeoffs', 'Assumptions and operating costs.', '/skeptical-case'],
    ],
  },
  4: {
    id: 4,
    path: '/door-4',
    label: 'Door 4',
    title: 'Thinks they know',
    intel: 'Price is not a protocol. A live rule is not an app. A repository is not production. Read the tradeoffs and the status table before you repeat a sentence.',
    body: `<p>If you arrived with a target, a cycle call, or a detailed chart, that work does not transfer. Price predictions are useless here. Chart analysis is the same waste: it does not change GHOSTDAG, issuance, or whether Toccata wallets exist.</p>
      <p>A live consensus rule is not a product. A GitHub repo is not production. A demo on Testnet-10 is not mainnet. “Core” is not a legal title.</p>
      <p>Use the labels on the status page: live, roadmap, research, wrong. Cite a primary source if you will repeat this. Community rule: be mature, skip price talk, build, keep a positive critical mindset.</p>
      <p>The Moonboy tab exists so this door does not have to shout.</p>`,
    reads: [
      ['Moonboy', 'Why price talk and chart analysis are not intel.', '/moonboy'],
      ['The tradeoffs', 'Start here if you arrived with a price story.', '/skeptical-case'],
      ['What is live', 'Labels: live, roadmap, research, wrong.', '/status'],
      ['Sources', 'How a claim is checked on this site.', '/sources'],
    ],
  },
};

export const people = [
  {id: 'new', door: 1, label: 'New to crypto'},
  {id: 'crypto-not-kaspa', door: 2, label: 'Knows crypto, not Kaspa'},
  {id: 'kaspa', door: 3, label: 'Knows Kaspa'},
  {id: 'crypto-and-kaspa', door: 3, label: 'Knows crypto and Kaspa', intel: 'You already have both maps. Use the status page and the demos. Do not skip the tradeoffs.'},
  {id: 'thinks', door: 4, label: 'Thinks they know crypto'},
  {id: 'moonboy', door: 4, label: 'Moonboy crypto bro', intel: 'No price target lives here. Kaspa is a network. If you came for a moon, this door is the status page, the risks, and the Moonboy tab.'},
  {id: 'institution', door: 2, label: 'Institution (speculative)', intel: 'This is not a prospectus. Look at settlement, node costs, and what is live. Speculation is labeled speculation.'},
  {id: 'influencer-tech', door: 4, label: 'Tech influencer', intel: 'If you will repeat this, cite a primary source. Live, roadmap, research, and wrong are different labels.'},
  {id: 'influencer-moon', door: 4, label: 'Moonboy influencer', intel: 'If you will repeat this, cite a primary source. Price talk is not intel.'},
  {id: 'cyberpunk', door: 2, label: 'Cyberpunk', intel: 'Proof of work is the root. Kaspa keeps it and makes it fast enough to program. No custodian is implied.'},
  {id: 'other-chain', door: 2, label: 'High-tech from another chain', intel: 'Same demos. Different ledger shape. Kaspa is a blockDAG with proof of work, not a rollup pitch.'},
  {id: 'other', door: 1, label: 'Other', intel: 'If none of the doors fit, start as if you are new. The demos are the same.'},
];

export const demos = [
  ['The playground', 'Network delay, competing spends, mining share. Kasware for Testnet-10, or generate a tKAS wallet.', '/playground'],
  ['How Kaspa works', 'The network demonstration used on the home page.', '/what-is-kaspa'],
  ['Using KAS', 'Follow a payment. Same walkthrough for every door.', '/why-kaspa-matters'],
];

export function kaspaFilm() {
  return `<figure class="door-film">
    <video controls playsinline preload="metadata" src="/media/kaspa-roots.mp4">
      Your browser cannot play this film. <a href="/media/kaspa-roots.mp4">Open the file</a>.
    </video>
    <figcaption class="small">The same film on every door.</figcaption>
  </figure>`;
}

export function doorVisual(id) {
  return doorVisuals[id] || '';
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
