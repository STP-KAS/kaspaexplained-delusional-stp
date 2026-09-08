import {kgiCard} from './community.mjs';

export const doors = {
  1: {
    id: 1,
    path: '/door-1',
    label: 'Door 1',
    title: 'Beginner · New to crypto',
    intel: 'Beginner. Kaspa is digital cash that does not need a bank. Miners spend energy so nobody can rewrite a payment for free. That is proof of work. This door names the parts, then tells you what they do not mean.',
    body: `<h2>Start here</h2>
      <p>You do not need a course. You need a few words, one picture of a payment, and a place to try the rules without risking real money. That is this door, then the playground.</p>
      <h2>What this is</h2>
      <p>Ordinary money is an account at a company. They can freeze it, reverse it, or go down. Crypto, in the original sense, is a public ledger that anyone can check. You hold keys. You sign a payment. Miners spend electricity to propose the next records. Other computers check the work. Nobody in the middle has to approve you.</p>
      <p>That energy is not decoration. It is the cost of lying about history. If rewriting the ledger were cheap, a thief could spend the same coins twice. Proof of work makes that expensive. Proof of stake replaced that cost with a vote of who already holds the coin. Kaspa did not take that turn. It is still proof of work.</p>
      <h2>Words you will see</h2>
      <p>Read these once. Come back if a later sentence uses them.</p>
      <ul>
        <li><strong>Keys.</strong> Secret numbers that prove a payment is yours. If you lose them, the coins are gone. If you share a recovery phrase, you have given the coins away.</li>
        <li><strong>Wallet.</strong> Software that holds keys and builds payments. It is not a bank account. An exchange account is a claim on a company, not keys you hold.</li>
        <li><strong>Ledger.</strong> The public list of coins and who can spend them. Anyone can download it. Nobody asks permission to read it.</li>
        <li><strong>Miner.</strong> A machine that spends electricity to propose the next records. Mining is not a salary from Kaspa. It is a race to find valid work.</li>
        <li><strong>Node.</strong> A computer that stores the ledger and checks the rules. You can run one. You do not have to. Someone still has to.</li>
        <li><strong>Block.</strong> A batch of payments plus proof of work. Kaspa can have more than one honest block at the same time. That bunch of blocks is a blockDAG, not a single chain.</li>
        <li><strong>Fee.</strong> A small amount paid to get into a block. It is not a bank wire fee. If the network is quiet, it can be tiny. If it is busy, it rises.</li>
      </ul>
      <h2>A payment in four beats</h2>
      <ol>
        <li><strong>You send.</strong> Your wallet signs. The payment is now a message on the network. Sending is not settling.</li>
        <li><strong>It is included.</strong> A miner puts it in a block. Inclusion is not the same as “done.”</li>
        <li><strong>It is accepted.</strong> The network’s agreed history now treats that payment as the spend. The old coins cannot be spent again.</li>
        <li><strong>The recipient waits as they choose.</strong> A coffee and a house sale do not need the same wait. Kaspa does not pick that policy for them.</li>
      </ol>
      <p>The playground slows this down so you can press the stages. Use it after this page, not instead of reading.</p>
      <h2>Where Kaspa sits</h2>
      <p>Bitcoin is the same idea: miners, keys, no premine as a fair-launch story. Bitcoin is a chain. When two honest miners find a block at the same time, one block is thrown away. Kaspa is a blockDAG. Honest parallel blocks stay. GHOSTDAG puts them in order. About ten blocks per second on mainnet today. That is a target rate, not a promise that your coffee is irreversible in a tenth of a second.</p>
      <p>Most later coins sold speed by changing the security story: staking, a small set of validators, or a company sequencer. Kaspa’s bet is the opposite. Keep Bitcoin’s root. Make the ledger fast enough that payments and, later, spending rules can live on it without a second chain.</p>
      <h2>What still costs you</h2>
      <p>If you lose the keys, the coins are gone. If mining concentrates, a few operators matter more than the diagram suggests. Nodes still have to hear every block. Ten blocks per second is work for the network, not free throughput. Inclusion in a block is not the same as acceptance in the agreed history.</p>
      <h2>How to start without getting hurt</h2>
      <ul>
        <li>Do not paste a recovery phrase into a website, a chat, or this site. Nobody here can recover a seed.</li>
        <li>Learn on Testnet-10 first. tKAS is faucet money. It is not mainnet KAS.</li>
        <li>Watch the Graph Inspector on this page for the live picture. A candle chart is not that picture.</li>
        <li>Price talk is not a source. If someone leads with a target, close the tab and come back here.</li>
        <li>When you have a question, say what you did, which network, and the error text. Ask in Help, not in a random reply.</li>
      </ul>
      <p>Door 2 is next if you already know Bitcoin or Ethereum and only need Kaspa placed. If you are still new, open Using KAS, then the playground.</p>`,
    reads: [
      ['Playground', 'Delay, double spend, mining share, spending rules. Your tKAS if you bring it.', '/playground'],
      ['Using KAS', 'A payment, change, and a fee.', '/why-kaspa-matters'],
      ['Door 2', 'You know crypto. Place Kaspa next to it.', '/door-2'],
      ['Help', 'Ask in the rooms that already exist.', '/help'],
      ['What is live', 'Dated labels, not a pitch.', '/status'],
    ],
  },
  2: {
    id: 2,
    path: '/door-2',
    label: 'Door 2',
    title: 'Intermediate · Knows crypto, not Kaspa',
    intel: 'Intermediate. Kaspa is still proof of work. Parallel honest blocks are kept and ordered. Speed is not a new security story. Compare it to the chain you already know, then check what is actually live.',
    body: `<h2>The one-sentence difference</h2>
      <p>Bitcoin selects a chain and orphans the rest. Kaspa represents concurrent proof-of-work in a DAG and orders it with GHOSTDAG. The double-spend check still happens after ordering. A DAG is not a free pass to spend twice.</p>
      <p>If you already think in UTXOs, fees, and confirmation policy, you can skip Door 1. Stay here until you can place Kaspa without borrowing Ethereum’s words.</p>
      <h2>Against the rest of the map</h2>
      <p><strong>Bitcoin.</strong> Same PoW cash lineage, UTXO ledger, no premine. Kaspa’s block interval is much shorter. That does not copy Bitcoin’s settlement culture. Recipients still pick a policy. Node bandwidth and validation cost rise with the extra blocks. If a Bitcoiner asks “is it final?”, the honest answer is: inclusion, acceptance, and the recipient’s wait are three different things. Same as Bitcoin, faster blocks.</p>
      <p><strong>Ethereum.</strong> Ethereum moved to proof of stake and an account virtual machine. Kaspa stayed with miners and UTXOs. Toccata added spending rules (covenants), covenant IDs, a ZK precompile, and sequencing lanes. That is not the EVM. You do not deploy a Solidity app onto Kaspa L1 today and get Ethereum’s tooling. “Smart contracts on Kaspa” is a sentence that needs a label: covenants are live protocol; application compilers are not all stable.</p>
      <p><strong>High-throughput PoS and L2s.</strong> Fast inclusion is often a sequencer or a validator set. Kaspa’s speed is many proof-of-work blocks. Honest work that arrives late is kept, not discarded. 100 BPS is a research target, not a spec. Crescendo’s 10 BPS is live. If you came from Solana, do not map TPS slogans onto block rate. Nodes still receive, validate, and store every block.</p>
      <h2>UTXO, not an account VM</h2>
      <p>Coins live as unspent outputs. A payment consumes outputs and creates new ones. Change is an output back to you. A covenant is a spending rule attached to an output: wait, limit, name the recipient, require a proof. That is closer to Bitcoin Script than to an EVM contract with storage.</p>
      <p>Shared execution among many users (a lending pool, an AMM with one global book) is a different problem. Covenants do not by themselves give you that. vProgs are the research name for based programs with validity proofs. They are not a product testnet you can treat as live.</p>
      <h2>Live versus later</h2>
      <p>Use these labels. Mix them and you are pitching.</p>
      <ul>
        <li><strong>Live.</strong> GHOSTDAG. 10 BPS (Crescendo). Toccata protocol rules on mainnet. rusty-kaspa v2.0.1 is the maintenance tag checked here.</li>
        <li><strong>Release candidate.</strong> SilverScript v1-rc1. Experimental. Prefer Testnet-10 until a tagged v1.</li>
        <li><strong>Prototype.</strong> Argent. Examples exist. The README says it is not release-ready.</li>
        <li><strong>Research.</strong> vProgs. Repository existence is not production.</li>
        <li><strong>Proposed.</strong> DAGKnight. The rusty <code>dagknight</code> branch is not merged. No mainnet activation is documented in the checked KIP or node releases.</li>
      </ul>
      <p>A merged Active KIP is law. A tweet, a Discord rumor, and a forum thread are not. Toccata is consensus. silverc is a compiler. People still mix those two in chat.</p>
      <h2>What speed does not buy</h2>
      <p>It does not remove miner concentration. It does not make every wallet support covenants. It does not make a repository into a product. It does not make a price chart into evidence. The skeptical list is the same as for any PoW coin, plus the extra node cost of a fast DAG.</p>
      <p>Door 3 is the dated machine: KIPs, builder network, node. If you only wanted the map, open status and the playground next.</p>`,
    reads: [
      ['Playground', 'See parallel blocks and a failed double spend without a lecture.', '/playground'],
      ['What is live', 'Live, roadmap, research, wrong.', '/status'],
      ['Door 3', 'Dated status, builder path, what not to claim.', '/door-3'],
      ['The tradeoffs', 'Node cost, mining concentration, what speed does not solve.', '/skeptical-case'],
      ['Sources', 'How a claim is checked here.', '/sources'],
    ],
  },
  3: {
    id: 3,
    path: '/door-3',
    label: 'Door 3',
    title: 'Advanced · Knows Kaspa',
    intel: 'Advanced. Skip the pitch. Check dated status, live versus research, and the tradeoffs. If a claim has no source, it is not intel. This door is the machine as of the last check, not a vision deck.',
    body: `<h2>Where the machine actually is</h2>
      <p>Checked on this site: 6 September 2026. Snapshot DAA 532,696,787. rusty-kaspa v2.0.1. Block subsidy about 2.18 KAS. Circulating supply about 27.68 billion. Those numbers age. Open status before you quote them.</p>
      <p>Toccata activated at DAA 474,165,565 (about 30 Jun 2026). KIPs 16, 17, 20, and 21 are marked Active in the checked repository. 10 BPS is live. SilverScript is v1-rc1, experimental. KCC-0020 is Draft. vProgs have no public product testnet. DAGKnight remains Proposed; the rusty <code>dagknight</code> branch is not merged.</p>
      <h2>Do not claim</h2>
      <ul>
        <li>100 BPS live</li>
        <li>Instant irreversible payments</li>
        <li>Mature native smart contracts as an Ethereum replacement</li>
        <li>KCC-20 adopted as the token standard</li>
        <li>SilverScript v1 stable</li>
        <li>vProgs live</li>
        <li>Kurrent mainnet</li>
        <li>Toccata “coming soon” (it is live)</li>
      </ul>
      <h2>Programmability, in the order it actually exists</h2>
      <ol>
        <li><strong>Covenants on L1.</strong> Toccata. Spending rules travel with the output. Live protocol. Wallet and indexer support is separate.</li>
        <li><strong>SilverScript.</strong> Compiler. v1-rc1. Docs say Testnet-10 until stable v1. Toccata is not this compiler.</li>
        <li><strong>Argent.</strong> Prototype language. Not release-ready per its own README.</li>
        <li><strong>vProgs.</strong> Research: based programs and validity proofs. Do not demo them as a mainnet product.</li>
      </ol>
      <p>The digital-cash story is still the honest one: PoW, UTXO, fair launch. The DAG is how Kaspa tries to keep that story at a payment-like interval. That is a different shape from “EVM L2 on a PoS L1.” It is also earlier. Wallets, indexers, and compilers are catching up. Discord still spends most of its volume on wallet UX, fees, and “is SilverScript the hardfork?” No. Toccata is consensus. silverc is a compiler.</p>
      <h2>Builder path that does not lie</h2>
      <p>Testnet-10 is the builder network. Do not use testnet-12. Addresses start with <code>kaspatest:</code>. Official start: kaspa.org/build. This site’s Node tab is the Windows/Linux/mac path that actually ran: dedicated folder, rusty-kaspa v2.0.1, CPU miner on 16210, explorer tn10.kaspa.stream. GPU on public TN10 is physics, not etiquette.</p>
      <p>If you are mining tKAS, bring the address to the playground. This site does not drip faucet coins at you. Faucet: faucet-tn10.kaspanet.io. PegLab if someone says they need a stable for a dapp. It is a toy that will depeg. Not a business.</p>
      <h2>Costs you already know and should not skip</h2>
      <p>Node cost scales with block rate. Mining can still pool. A live opcode is not an audited app. A public node is not a miner and is not a wallet. Do not expose open RPC that can sign. Check kaspa.stream/nodes if you meant to be a public peer.</p>
      <p>Door 4 is for people who will repeat sentences in public. If you are building, stay on Node, Build, and status until a claim has a KIP or a release tag.</p>`,
    reads: [
      ['Playground', 'The mechanics, plus your Testnet-10 wallet.', '/playground'],
      ['Node', 'TN10 rusty-kaspa, then tKAS. CPU first. Mainnet node if you mean it.', '/node'],
      ['Build on Kaspa', 'Covenants, official build door, TN10.', '/build-on-kaspa'],
      ['Door 4', 'How to check a claim before you repeat it.', '/door-4'],
      ['What is live', 'Activation, tools, prototypes.', '/status'],
    ],
  },
  4: {
    id: 4,
    path: '/door-4',
    label: 'Door 4',
    title: 'Expert · Thinks they know',
    intel: 'Expert. Price is not a protocol. A live rule is not an app. A repository is not production. Compare Kaspa to the rest of crypto with labels, not vibes. If you will repeat a sentence, this door is the checklist.',
    body: `<h2>Stop doing the useless work</h2>
      <p>Price predictions are not intel. Detailed chart analysis is the same waste. Neither one changes GHOSTDAG, issuance, node cost, or whether a wallet can spend a covenant. If you arrived with a target, this door is the correction. The Moonboy tab exists so this page does not have to shout.</p>
      <h2>How to place Kaspa without lying</h2>
      <p>It is PoW cash with a DAG history, not a staking chain, not an EVM, not a rollup brand. 10 BPS is live. Toccata is live. Tooling is young. vProgs are later. DAGKnight is proposed. Those sentences are enough. Extra adjectives are usually a pitch.</p>
      <p>Bitcoiners will ask about settlement and node cost. Answer: recipients pick a policy; nodes still hear every block; faster interval is not Bitcoin’s culture copied. Ethereum people will look for a VM and a token standard. Answer: covenants on UTXOs, not the EVM; KCC-0020 is Draft. Solana people will look for throughput and then skip the security model. Answer: many PoW blocks, not a leader schedule; capacity is not demand.</p>
      <h2>Labels, then a source</h2>
      <p>Use four words and mean them.</p>
      <ul>
        <li><strong>Live.</strong> In a release, activated, observable on the public network. Example: Toccata at a published DAA score.</li>
        <li><strong>Roadmap.</strong> Written intent with a document. Not a date you invented.</li>
        <li><strong>Research.</strong> A paper, a branch, a prototype. Not a product.</li>
        <li><strong>Wrong.</strong> Contradicted by the node, the KIP status, or the dated snapshot. Say so.</li>
      </ul>
      <p>A consensus rule can be live while every product on top is a prototype. A GitHub org is not production. Testnet-10 is not mainnet. “Core” is not a legal title. Yonatan’s rough core list on X is a starting map, not a badge.</p>
      <h2>How to check a sentence before you post it</h2>
      <ol>
        <li>Does a KIP, a rusty-kaspa release, or docs.kaspa.org say it?</li>
        <li>Is the status Active, Draft, Proposed, or a README warning?</li>
        <li>Did you date the claim? Supply, DAA, and subsidy move.</li>
        <li>Are you mixing protocol (Toccata) with a compiler (SilverScript) or a research repo (vProgs)?</li>
        <li>Would the sentence still be true if the KAS price were zero?</li>
      </ol>
      <p>If step 5 fails, you were talking about a market, not the machine. Take it to Moonboy and leave it there.</p>
      <h2>What an expert still owes</h2>
      <p>Node cost at 10 BPS. Mining pools. Wallet gaps on covenants. Indexer honesty. Settlement policy chosen by the recipient, not by a slogan. Independent review before mainnet funds in a new spending rule. None of that is solved by being early, loud, or sure.</p>
      <p>Community rule on this site: be mature. No price predictions. Build. Share ideas. Keep a positive critical mindset. If you will teach, send people to Door 1 through Door 3 in order, then here, then sources. The playground exists so you can break a double spend instead of arguing about one.</p>`,
    reads: [
      ['Moonboy', 'Why price talk and chart analysis are not intel.', '/moonboy'],
      ['Playground', 'Break the stories against a model.', '/playground'],
      ['What is live', 'Labels: live, roadmap, research, wrong.', '/status'],
      ['Sources', 'How a claim is checked on this site.', '/sources'],
      ['Best practices', 'People who stay honest.', '/best-practices'],
      ['Door 1', 'If you are about to explain this to someone new, start them here.', '/door-1'],
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
