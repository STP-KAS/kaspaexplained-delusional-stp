export const doors = {
  1: {
    id: 1,
    path: '/door-1',
    label: 'Door 1',
    title: 'New to crypto',
    intel: 'Kaspa is a way to send coins without a bank. Miners spend energy so nobody can rewrite your payment for free. That energy is proof of work. Start with a payment. Then look at the network.',
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
    reads: [
      ['What is live', 'Activation, tools, and what is still a prototype.', '/status'],
      ['The tradeoffs', 'Assumptions and operating costs.', '/skeptical-case'],
      ['Build on Kaspa', 'Spending rules and current builder docs.', '/build-on-kaspa'],
    ],
  },
  4: {
    id: 4,
    path: '/door-4',
    label: 'Door 4',
    title: 'Thinks they know',
    intel: 'Price is not a protocol. A live rule is not an app. A repository is not production. Read the tradeoffs and the status table before you repeat a sentence.',
    reads: [
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
  {id: 'moonboy', door: 4, label: 'Moonboy crypto bro', intel: 'No price target lives here. Kaspa is a network. If you came for a moon, the door is the status page and the risks.'},
  {id: 'institution', door: 2, label: 'Institution (speculative)', intel: 'This is not a prospectus. Look at settlement, node costs, and what is live. Speculation is labeled speculation.'},
  {id: 'influencer-tech', door: 4, label: 'Tech influencer', intel: 'If you will repeat this, cite a primary source. Live, roadmap, research, and wrong are different labels.'},
  {id: 'influencer-moon', door: 4, label: 'Moonboy influencer', intel: 'If you will repeat this, cite a primary source. Live, roadmap, research, and wrong are different labels. Price talk is not intel.'},
  {id: 'cyberpunk', door: 2, label: 'Cyberpunk', intel: 'Proof of work is the root. Kaspa keeps it and makes it fast enough to program. No custodian is implied.'},
  {id: 'other-chain', door: 2, label: 'High-tech from another chain', intel: 'Same demos. Different ledger shape. Kaspa is a blockDAG with proof of work, not a rollup pitch.'},
  {id: 'other', door: 1, label: 'Other', intel: 'If none of the doors fit, start as if you are new. The demos are the same.'},
];

export const demos = [
  ['The playground', 'Network delay, competing spends, mining share. Same models for every door.', '/playground'],
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

export function mountDoors() {}
