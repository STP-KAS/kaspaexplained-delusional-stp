import { payment, network, spend, mining, vault, transaction, inspector, section, rows, detail, link, note, walletLesson, tradeoffComparison, evidenceSteps } from './components.mjs';
import { sources, snapshot } from './site.mjs';
import {coordinationMarkup} from './coordination-view.mjs';
import {kaspaFilm} from './doors.mjs';

const source = key => link(...sources[key]);
const routes = items => `<nav class="topic-list" aria-label="Related explanations">${items.map(([title, text, url])=>`<a href="${url}"><div><strong>${title}</strong><p>${text}</p></div><span aria-hidden="true">↗</span></a>`).join('')}</nav>`;
const intro = (eyebrow, title, lead) => `<div class="page-intro intro-${eyebrow.toLowerCase().replaceAll(" ","-")}"><p class="eyebrow">${eyebrow}</p><h1>${title}</h1><p class="lead">${lead}</p></div>`;

export const pages = [
  {
    file:'index.html', title:'Kaspa Explained', description:'Explore how Kaspa payments, parallel blocks, and spending rules work through interactive explanations.',
    body: `<p class="home-ethos">Crypto started with proof of work, for decentralized money and ownership.<br>Proof of stake left that idea.<br>Kaspa goes back to the roots: fast, programmable proof of work.</p>
      <section class="doors" aria-label="Choose an intel door">
        <p class="eyebrow">Four doors</p>
        <h1>Who is reading.</h1>
        <p>Knowledge first. Each door is its own page: text and one film. The demos stay the same.</p>
        ${kaspaFilm()}
        <div class="door-row" aria-label="Knowledge doors">
          <a href="/door-1">Door 1<br><span>New to crypto</span></a>
          <a href="/door-2">Door 2<br><span>Crypto, not Kaspa</span></a>
          <a href="/door-3">Door 3<br><span>Knows Kaspa</span></a>
          <a href="/door-4">Door 4<br><span>Thinks they know</span></a>
        </div>
        <p class="small">I am…</p>
        <div class="door-people" aria-label="People">
          <a href="/who/new">New to crypto</a>
          <a href="/who/crypto-not-kaspa">Knows crypto, not Kaspa</a>
          <a href="/who/kaspa">Knows Kaspa</a>
          <a href="/who/crypto-and-kaspa">Knows crypto and Kaspa</a>
          <a href="/who/thinks">Thinks they know crypto</a>
          <a href="/who/moonboy">Moonboy crypto bro</a>
          <a href="/who/institution">Institution (speculative)</a>
          <a href="/who/influencer-tech">Tech influencer</a>
          <a href="/who/influencer-moon">Moonboy influencer</a>
          <a href="/who/cyberpunk">Cyberpunk</a>
          <a href="/who/other-chain">High-tech, other chain</a>
          <a href="/who/other">Other</a>
        </div>
      </section>
      <div class="home-introduction"><p class="eyebrow">Kaspa Explained</p><h2>Send money.<br>Let the network verify it.</h2><p>Kaspa lets people send coins without a central payment operator.<br>See why its miners can add blocks in parallel, then follow a payment through the network.</p><a href="#first-look">See how it works <span aria-hidden="true">↓</span></a></div>
      <div id="first-look" class="home-demonstration">${network({introductory:true})}</div>
      <div class="under-experiment">${link('Follow the blocks and the information between them', '/what-is-kaspa')}</div>
      ${section('explore','Explore Kaspa',routes([
        ...(process.env.KASPA_RELEASE==='v1'?[]:[['Play a KAS economy','Build a greenhouse, hire Pip, sell the harvest and follow the money. Uses free test coins.','/covenants'],['PegLab','A Testnet-10 toy that looks like a dollar, then depegs. Not USD. Tiny pool.','/peglab']]),
        ['How the network agrees','Change what miners know. See why parallel blocks happen.','/what-is-kaspa'],
        ['Using KAS','Wallets, sending, receiving, and reading a transaction.','/why-kaspa-matters'],
        ['The tradeoffs','Security assumptions, mining concentration, and what speed does not solve.','/skeptical-case'],
        ['Building on Kaspa','Follow a spending rule and find the tools that implement it.','/build-on-kaspa'],
      ]))}
      <section class="home-payment"><div class="home-feature-heading"><p class="eyebrow">Sending KAS</p><h2>From wallet<br>to recipient</h2><p>Track submission, inclusion, and acceptance. Each describes a different stage of a payment.</p></div>${payment()}<a class="home-feature-link" href="/why-kaspa-matters">Wallets, fees, and checking a payment <span aria-hidden="true">↗</span></a></section>
      <section class="playground-invitation"><div><p class="eyebrow">The playground</p><h2>Test the network’s rules</h2></div><div><p>Slow the network. Spend the same money twice. Change a miner’s share. See which rules still hold.</p><a class="primary-button" href="/playground">Try it yourself <span aria-hidden="true">↗</span></a></div></section>
      ${section('references','Status and history',routes([
        ['What is live today?','A dated view of the network, proposals, and tools.','/status'],
        ['Where Kaspa came from','The research, launch, and implementation changes.','/kaspa-origin-story'],
      ]))}`,
  },
  {
    file:'what-is-kaspa.html', title:'How Kaspa works', description:'See why honest miners find parallel blocks and how ordering resolves conflicting payments.',
    body: `${intro('Understand','Nobody sees everything<br>at the same time.','Kaspa keeps blocks that honest miners find at the same time. Start with two miners, delay the news between them, then see why both blocks can stay while a double spend cannot.')}
      ${network()}
      ${section('parallel-blocks','A delay can change the shape of the history.',rows([
        ['News arrives in time','<p>Miner 1 finds B. If miner 2 hears about B before finding C, C can reference B.</p>'],
        ['News arrives too late','<p>Miner 2 finds C without knowing B. Both blocks reference A. They are parallel, even though both miners followed the rules.</p>'],
        ['A later block connects them','<p>Once a miner receives both branches, a later block can reference both. A chain selects a branch; Kaspa represents parallel work in a blockDAG.</p>'],
      ]) + detail('Inspect GHOSTDAG’s selection and ordering', `<p>GHOSTDAG chooses the parent with the greatest accumulated blue work, with hash tie-breaks. It classifies newly joined blocks using the parameter k: the blue set permits a bounded number of mutually unrelated blocks.</p><p>Blue and red are graph classifications, not labels for honest and dishonest miners. The implementation orders each merge set from its selected parent, then merges the other blocks by blue work and hash. Arrival order is not the ordering rule.</p><p>${source('paper')} · ${link('Parent selection and classification','https://github.com/kaspanet/rusty-kaspa/blob/master/consensus/src/processes/ghostdag/protocol.rs')} · ${link('Merge-set ordering','https://github.com/kaspanet/rusty-kaspa/blob/master/consensus/src/model/stores/ghostdag.rs')}</p>`))}
      ${section('work','Proof of work commits to block contents',rows([
        ['Choose transactions','<p>A miner prepares a candidate block. Its contents are committed through the block header used in the work calculation.</p>'],
        ['Search for valid work','<p>The miner tries work calculations until it finds a result that satisfies the target. Changing the committed contents requires searching against a different header.</p>'],
        ['Let other nodes check','<p>Nodes verify the work and the consensus rules. Frequent discoveries let work accumulate over short intervals. They sample hashpower, not a count of independent people.</p>'],
      ]) + `<p>Parallel blocks let the network represent contributions that arrive before miners have heard from one another. They do not remove communication delay or make each discovery a complete round of agreement. ${source('paper')}</p>`)}
      ${section('conflicts','Both blocks can stay.<br>The same money cannot be spent twice.',spend(), 'Once blocks are ordered, nodes still check each transaction against the ledger.')}
      ${section('confirmation','Inclusion, acceptance, and confidence',payment()+rows([
        ['Inclusion','<p>A transaction appears inside a block. This alone does not establish that it was accepted.</p>'],
        ['Acceptance','<p>The transaction is accepted in the current agreed history. Applications must still handle changes near the tips.</p>'],
        ['Confidence','<p>Additional honest work makes replacing history more demanding under the security assumptions. The recipient chooses a policy appropriate to the payment.</p>'],
      ]) + `<p class="source-line">${source('acceptance')} · ${source('paper')}</p>`)}
      ${detail('Block rate, throughput, and the limits', '<p>Mainnet targets ten blocks per second. A 100-millisecond interval is neither guaranteed transaction inclusion nor a finality promise. Transaction mass, validation cost, bandwidth, and demand limit what the network can process.</p><p>Parallel blocks do not provide free throughput. Nodes still have to receive, validate, store, and order the work.</p>')}
      ${routes([['Explore the tradeoffs','What the design assumes and what can still fail.','/skeptical-case'],['Use the playground','Inspect individual times and compare conditions.','/playground#network']])}`,
  },
  {
    file:'why-kaspa-matters.html', title:'Using KAS', description:'Understand wallets, payment outputs, fees, change, and what a transaction explorer can establish.',
    body:`${intro('Use KAS','Follow your payment.','Sending coins creates a payment, change and a fee. Follow those amounts first, then learn what your wallet controls and what an explorer can actually confirm.')}
      ${section('amounts','Where your payment, change, and fee go.',transaction(), 'A transaction consumes earlier outputs and creates new ones. Payment, change, and fees account for the input value.')}
      ${section('wallets','Who controls the keys?',rows([
        ['Your own wallet','<p>You control the keys and their backup. Losing them can mean losing access. Never share a recovery phrase with a person, website, or explorer.</p>'],
        ['An exchange account','<p>The provider controls the keys. Your account balance is a claim on that provider, with its own withdrawal rules and risks.</p>'],
      ]) + `<p>${source('wallet')} · ${link('Wallet integration documentation','https://docs.kaspa.org/integrate/wallet')} · ${link('See holdings from Kasware or Kastle','/wallet')}</p>`)}
      ${section('using-kas','Receive. Send. Verify.',walletLesson(), 'Try the three actions that make up a payment.')}
      ${section('inspect','Read a transaction',inspector(), 'A public explorer reports its provider’s view. Check amounts and acceptance, and notice which information is missing.')}
      ${detail('What these fields establish', '<p>Inputs refer to earlier outputs. Outputs specify amounts and spending destinations. An accepting-block identifier is different from the list of blocks containing the transaction.</p><p>An address does not establish a person’s identity. Output fields alone do not identify which output is a payment and which is change. A block timestamp does not establish when the sender pressed Send.</p><p>Fees are calculated only when all referenced input values and output values are available. Missing data is shown as unavailable, never zero.</p>')}
      ${section('problems','If something looks wrong',rows([
        ['Not found','<p>Check the transaction ID and network. The provider may be delayed, unavailable, or missing the record.</p>'],
        ['Included but not accepted','<p>A containing block is not an acceptance receipt. Check the accepting history and any wallet or application error.</p>'],
        ['Accepted, but no exchange credit','<p>An exchange can require additional work and internal processing. Its crediting policy is separate from Kaspa’s block interval.</p>'],
      ]) + `<p>${source('explorer')} · ${source('acceptance')}</p>`)} `,
  },
  {
    file:'skeptical-case.html', title:'Kaspa’s tradeoffs and risks', description:'Inspect Kaspa’s security assumptions, operating costs, and unresolved questions without price predictions.',
    body:`${intro('Evaluate','What does the design cost?' ,'Keeping parallel blocks can accommodate frequent discoveries. Nodes still have to receive and check them, and mining can still concentrate. Compare these costs before judging the speed.')}
      ${section('tradeoffs','Security and operating costs',tradeoffComparison())}
      ${section('security','What must keep working',rows([
        ['Consensus assumptions','<p>The security argument depends on honest work and network conditions. A diagram that converges is not proof that all adversarial cases converge safely.</p>'],
        ['Operational reliability','<p>Software bugs, outages, connectivity failures, and concentrated infrastructure remain possible. Examine incidents and recovery, not just a target block rate.</p>'],
        ['Miner funding','<p>New issuance falls on a fixed schedule. Fees, KAS’s exchange value, equipment efficiency, and power costs affect the resources miners can sustain.</p>'],
        ['Actual use','<p>Capacity is not demand. A released feature does not establish dependable applications, repeat users, or fee revenue.</p>'],
      ]) + `<p class="source-line">${source('paper')} · ${source('node')} · ${source('reward')}</p>`)}
      ${section('alternatives','Compare base-layer designs', '<p class="table-hint" id="comparison-scroll-hint">Scroll sideways to compare all three networks <span aria-hidden="true">↔</span></p><div class="table-scroll" role="region" aria-label="Design comparison" aria-describedby="comparison-scroll-hint" tabindex="0"><table><thead><tr><th>Question</th><th>Kaspa</th><th>Bitcoin</th><th>Ethereum</th></tr></thead><tbody><tr><th>Consensus participation</th><td>Proof-of-work miners</td><td>Proof-of-work miners</td><td>Proof-of-stake validators</td></tr><tr><th>Ledger and execution</th><td>UTXOs with covenant rules</td><td>UTXOs with Script</td><td>Accounts and EVM execution</td></tr><tr><th>History</th><td>BlockDAG with GHOSTDAG ordering</td><td>Chain selected by accumulated work</td><td>Chain with checkpoints and economic finality</td></tr><tr><th>What to examine</th><td>Node costs, ordering assumptions, tooling maturity</td><td>Inclusion demand, fee conditions, settlement policy</td><td>Validator assumptions, contract risk, execution costs</td></tr></tbody></table></div><p>This is a base-layer comparison, not a ranking. Custodians, bridges, and secondary layers introduce additional assumptions.</p><p class="source-line">'+source('paper')+' · '+link('Bitcoin paper','https://bitcoin.org/bitcoin.pdf')+' · '+link('Ethereum proof of stake','https://ethereum.org/en/developers/docs/consensus-mechanisms/pos/')+'</p>')}
      ${routes([['See mining participation','Separate a fast network from a miner’s personal outcome.','/kaspa-mining'],['Check current evidence','Protocol state and tool readiness, separately.','/status']])}`,
  },
  {
    file:'kaspa-mining.html', title:'Mining and KAS supply', description:'Explore mining share and variance, then inspect issuance, costs, and node participation.',
    body:`${intro('Mining','Many blocks.<br>Uneven rewards.','The network may find many blocks while your miner finds only a few. Change one miner’s share and sample another minute to see why frequent blocks do not promise steady income.')}
      ${mining()}
      ${section('supply','Where new KAS comes from.',rows([
        ['Mining rewards','<p>Eligible mining work receives newly issued KAS and transaction fees under the consensus rules.</p>'],
        ['Declining issuance',`<p>The monthly subsidy schedule decreases by roughly 5.6% per step and about half across twelve steps. The checked September 6 reward is ${snapshot.reward} KAS per block at 10 BPS.</p>`],
        ['A bounded supply','<p>The maximum is approximately 28.704 billion KAS. Schedule arithmetic uses whole sompi; issuance is not a smooth continuously calculated exponential.</p>'],
      ]) + `<p class="source-line">${source('reward')} · ${link('Dated network snapshot','/status')}</p>`)}
      ${section('costs','Mining costs and profitability',rows([
        ['Electricity and hardware','<p>Compare power consumption, equipment cost, delivery, cooling, reliability, and usable life. A future exchange value cannot be assumed.</p>'],
        ['Pools and variance','<p>A pool can smooth payouts in exchange for fees and dependence on its accounting and operation. It does not create additional network rewards.</p>'],
        ['Future competition','<p>Your share changes as other miners enter, leave, or upgrade. A current revenue estimate is not a payout promise.</p>'],
      ]))}
      ${detail('Running a node and constructing work', `<p>A synced node independently validates the network. A mining bridge can connect compatible hardware to the node’s work. This changes who supplies the network view, not your share of global hashrate.</p><p>${link('Node operations documentation','https://docs.kaspa.org/integrate/kaspa-node')} · ${source('node')}</p>`)} `,
  },
  {
    file:'build-on-kaspa.html', title:'Build on Kaspa', description:'Explore covenant rules and find current integration, compiler, and application-model documentation.',
    body:`${intro('Build','Payments and spending rules','A spending rule can require a wait, limit the amount and name the recipient. Try breaking each condition, then see what building a complete application still requires.')}
      <div class="action-row">${process.env.KASPA_RELEASE==='v1'?'':'<a class="primary-button" href="/applications">Try the Testnet-10 applications ↗</a>'}<a href="/money">Explore reserves, borrowing, and prediction payouts ↗</a></div>
      ${section('spending-rules','A withdrawal with three conditions',vault(),'A covenant can constrain how an output is spent. Try a withdrawal against three conditions.')}
      ${section('start','Integration tasks',rows([
        ['Read the network',`<p>Use node or public-service interfaces for blocks, transactions, and accepted history. Know which service you trust and how it handles missing or changed data.</p><p>${link('Integration guide','https://docs.kaspa.org/integrate/getting-started')}</p>`],
        ['Receive payments',`<p>Track the accepting history, persist a checkpoint, and reverse application state when the accepted chain changes. Choose a policy for your use case.</p><p>${source('acceptance')}</p>`],
        ['Constrain spending',`<p>Specify which outputs are allowed, how state moves, and who can authorize each path. Test rejected transactions as carefully as successful ones.</p><p>${source('programmable')}</p>`],
      ]))}
      ${section('tools','Tools and implementation status', `<div class="status-list">${snapshot.items.filter(i=>['Toccata','Silverscript','Argent','vProgs'].includes(i[0])).map(([name,state,text,url])=>`<article><div><span class="status-tag">${state}</span><h3>${name}</h3></div><div><p>${text}</p>${link('Documentation',url)}</div></article>`).join('')}</div>`)}
      ${section('application-boundaries','Covenants, shared execution, and proofs',rows([
        ['One agreement', '<p>A buyer can authorize payment to a seller, with a refund path after a deadline. The spending conditions travel with the output. Each permitted exit has to satisfy the contract.</p>'],
        ['An application many people update', '<p>A lending market also needs to coordinate deposits, loans, prices, and competing requests. Individual spending rules do not by themselves supply that shared execution system.</p>'],
        ['A computation checked by proof', '<p>A proof can establish a calculation over its specified inputs. If a user’s request was omitted from those inputs, a correct calculation can still leave that user out. The application needs to establish which requests belong in the calculation and their order.</p>'],
      ]) + `<p>The programmability documentation separates covenant rules, Based Apps, and the future direction of Full vProgs. Check the guarantees and readiness of each part before choosing an architecture. ${source('programmable')}</p>`)}
      ${detail('What a proof leaves to the application', `<p>Verification establishes the statement encoded in the proof under its assumptions. It does not automatically establish where inputs came from, whether required data remains available, or whether surrounding software is secure.</p><p>A claim about complete transaction processing therefore needs evidence about both computation and the sequence it processes.</p>`)}
      <link rel="stylesheet" href="/assets/coordination.css"><div id="coordination">${coordinationMarkup()}</div>
      ${detail('Before putting funds at risk','<p>Review the exact compiler and node versions, transaction encoding, rejected paths, recovery paths, fee behavior, and independent security review. The educational vault above is not a deployable contract.</p>')}`,
  },
  {
    file:'status.html', title:'Kaspa network and tooling status', description:'Dated primary-source evidence for Kaspa activation, releases, prototypes, and network readings.',
    body:`${intro('Current evidence','Network and tooling status','Find out what is active, what is still being built and when the evidence was checked. A working protocol rule does not mean every wallet or application supports it.')}
      <p class="checked-date">Checked ${snapshot.checked}. This is a saved observation, not a live feed.</p>
      <div class="snapshot"><div><span>DAA score</span><strong>${snapshot.daa}</strong></div><div><span>Block subsidy</span><strong>${snapshot.reward} KAS</strong></div><div><span>Circulating supply</span><strong>${snapshot.supply} KAS</strong></div><div><span>Reporting node</span><strong>v${snapshot.version} · synced</strong></div></div>
      <p class="source-line">${link('Public BlockDAG reading','https://api.kaspa.org/info/blockdag')} · ${link('Subsidy','https://api.kaspa.org/info/halving')} · ${link('Supply','https://api.kaspa.org/info/coinsupply')}</p>
      ${section('readiness','Protocol and tool status',`<div class="status-list">${snapshot.items.map(([name,state,text,url])=>`<article><div><span class="status-tag">${state}</span><h3>${name}</h3></div><div><p>${text}</p>${link('Inspect the source',url)}</div></article>`).join('')}</div>`)}
      ${detail('How activation was checked', `<p>The v2.0.0 release set Toccata activation at DAA score 474,165,565. The September 6 public reading is above that threshold. KIP-16, KIP-17, KIP-20, and KIP-21 are marked Active in the checked repository.</p><p>This supports protocol activation, not universal wallet support, application adoption, or the absence of operational problems.</p><p>${link('Activation release','https://github.com/kaspanet/rusty-kaspa/releases/tag/v2.0.0')} · ${source('kips')}</p>`)}
      ${routes([['Inspect protocol specifications','KIPs, KCCs, and how their status differs.','/kips'],['Understand the evidence','What this site checks and what it cannot establish.','/sources']])}`,
  },
  {
    file:'kaspa-origin-story.html', title:'Kaspa’s origins', description:'A concise research and launch history with primary references.',
    body:`${intro('Origins','A research problem<br>became a network.','Kaspa began with a question: can miners keep working when news of other blocks arrives late? Follow the research into the November 2021 launch and later network upgrades.')}
      <ol class="history"><li><span>Research</span><div><h2>Allow concurrent blocks.</h2><p>The PHANTOM and GHOSTDAG work examined how a graph of proof-of-work blocks could support an ordered history.</p>${source('paper')}</div></li><li><span>Before launch</span><div><h2>DAGLabs and early development</h2><p>DAGLabs explored development and launch paths before Kaspa’s public mainnet. The eventual mining-based launch was not a token presale carried through unchanged.</p>${link('Project prehistory','https://wiki.kaspa.org/prehistory')}</div></li><li><span>7 November 2021</span><div><h2>Mainnet starts.</h2><p>Kaspa launched without an official premine or coin allocation. Coins entered circulation through mining. That does not imply equal knowledge, hardware, or access among early participants.</p>${source('node')}</div></li><li><span>Implementation</span><div><h2>Rust, Crescendo, and Toccata</h2><p>Rusty Kaspa replaced the earlier Go implementation. Crescendo increased the block rate; Toccata added consensus capabilities. Each change has its own release and activation evidence.</p>${link('Node releases','https://github.com/kaspanet/rusty-kaspa/releases')}</div></li></ol>
      ${routes([['What the network does now','See the mechanism behind the research.','/what-is-kaspa']])}`,
  },
  {
    file:'kips.html', title:'Kaspa protocol specifications', description:'Find protocol changes and application conventions without confusing document status with activation.',
    body:`${intro('Specifications','From proposal to protocol.','A published proposal is not automatically a live network rule. Read the status sequence first, then check which protocol changes and application conventions have reached each stage.')}
      ${evidenceSteps()}
      ${section('toccata','Toccata’s active KIPs.',rows([
        ['KIP-16 · Proof verification',`<p>Supported proof-verification operations.</p><p>${link('Read KIP-16','https://github.com/kaspanet/kips/blob/master/kip-0016.md')}</p>`],
        ['KIP-17 · Covenants',`<p>Transaction introspection and spending constraints.</p><p>${link('Read KIP-17','https://github.com/kaspanet/kips/blob/master/kip-0017.md')}</p>`],
        ['KIP-20 · Covenant identifiers',`<p>Persistent identity for related covenant outputs.</p><p>${link('Read KIP-20','https://github.com/kaspanet/kips/blob/master/kip-0020.md')}</p>`],
        ['KIP-21 · Sequencing commitments',`<p>Commitments that support later verification of ordered activity.</p><p>${link('Read KIP-21','https://github.com/kaspanet/kips/blob/master/kip-0021.md')}</p>`],
      ]))}
      ${section('conventions','Application conventions and their status', `<p>In the September 6 check, KCC-0000 is Last Call. KCC-0001, KCC-0002, and KCC-0020 are Draft. A document’s status does not establish implementation or adoption.</p><p>KCC-0020 describes token accounting across covenant outputs. Its open design questions must not be presented as a ratified token standard.</p><p>${source('kccs')} · ${link('KCC-0020 discussion','https://github.com/kaspanet/kccs/issues/14')}</p>`)}
      ${section('research','DAGKnight remains a research direction.', `<p>KIP-2 is Proposed. Research development is visible, including a September 4 branch commit. That is not a mainnet activation. The checked mainnet release still uses GHOSTDAG.</p><p>${link('KIP-2','https://github.com/kaspanet/kips/blob/master/kip-0002.md')} · ${link('Research commit','https://github.com/kaspanet/rusty-kaspa/commit/90e406f8a7c692b171294d8d26b0f83eff530a60')}</p>`)} `,
  },
  {
    file:'moose.html', title:'Books by Moose', description:'Read Carnot Local, Brownian Global and The Instrument by Moose, preserved in full.',
    body:`${intro('Independent reading','Two books<br>by Moose.','Read the mining book to examine costs and rewards, or The Instrument to explore an argument about money. Both original PDFs are preserved unchanged; they are author arguments, not network specifications.')}
      <div class="book-list"><article><span class="book-number">01</span><div><p class="eyebrow">Mining economics · 75 pages</p><h2>Carnot Local,<br>Brownian Global</h2><p>An examination of mining costs, rewards, and fees, moving from a qualitative account into the mathematics.</p><a class="primary-button" href="/carnot-local-brownian-global.pdf">Read the original PDF ↗</a></div></article><article><span class="book-number">02</span><div><p class="eyebrow">Monetary systems · 279 pages</p><h2>The Instrument</h2><p>An argument for examining money through physical costs, followed by a slower explanation and applications of that framework.</p><a class="primary-button" href="/the-instrument.pdf">Read the original PDF ↗</a></div></article></div>
      <p>These are the author’s arguments, not protocol specifications or conclusions independently verified by this guide.</p><p>${link('Moose on X','https://x.com/THEMOOSEISLOOS5')}</p>`,
  },
  {
    file:'sources.html', title:'Sources and method', description:'Inspect the sources, model boundaries, and independence of Kaspa Explained.',
    body:`${intro('Sources','Sources and verification','Check a claim against the kind of evidence it needs: a specification, running implementation, dated network observation or stated model. This independent guide links those sources so you can inspect them.')}
      ${section('sources','Primary references',`<div class="source-list">${Object.values(sources).map(([name,url])=>link(name,url)).join('')}</div>`)}
      ${section('method','What a claim needs',evidenceSteps()+rows([
        ['Protocol behavior','<p>Specification and implementation, plus activation evidence when the rule is described as live.</p>'],
        ['Tool readiness','<p>Current documentation and releases. A repository or compelling demo does not establish production readiness.</p>'],
        ['Network values','<p>A dated observation with its source. A public endpoint is one provider’s view, not a guarantee about the entire network.</p>'],
        ['An illustrative result','<p>The model, assumptions, units, and inputs. A demonstration must not imply measurement, prediction, or security guarantees it does not calculate.</p>'],
      ]))}
      ${detail('Independence and corrections','<p>The maintainer may hold KAS. No page is a promise of return or an instruction to buy an asset. Books by guest authors retain their attribution and are not treated as consensus evidence.</p><p>If a claim has changed, compare the linked primary source and its date. The current-status page is a saved research snapshot, not continuous monitoring.</p>')}`,
  },
  {
    file:'playground.html', title:'Kaspa Playground', description:'Explore block propagation, double spending, transaction arithmetic, mining variance, and covenant rules.',
    body:`${intro('Playground','Interactive network models','Start an example and press Continue to see what changes and why. Delay a message, try spending the same coins twice or test a withdrawal rule. These local models move no real money.')}
      <div class="playground" data-playground><nav class="playground-nav" aria-label="Playground models">${[['network','Network delay'],['spend','Competing spends'],['transaction','Transaction amounts'],['mining','Mining share'],['vault','Spending rules']].map(([id,title],i)=>`<button data-workspace="${id}" aria-pressed="${i===0}" aria-controls="workspace-${id}">${title}</button>`).join('')}</nav><div class="playground-main">${[['network',network],['spend',spend],['transaction',transaction],['mining',mining],['vault',vault]].map(([id,render])=>`<section id="workspace-${id}" data-workspace-panel="${id}"${id!=='network'?' hidden':''}>${render()}</section>`).join('')}</div></div>`,
  },
  {
    file:'wallet.html', title:'Your Kaspa wallet', description:'Connect Kasware or Kastle to see KAS, tokens, and KNS domains for the address in this tab.',
    body:`${intro('Wallet','See what this address holds.','Connect Kasware or Kastle. This page reads public indexers. It never asks for a recovery phrase.')}
      <div data-wallet-page-root class="wallet-page"></div>
      <p class="small">Injected connect is Kasware and Kastle only. Ledger uses KasVault. Mobile and hardware wallets stay in their own apps. The Testnet-10 playground on this site uses a separate disposable wallet.</p>`,
  },
  {
    file:'404.html', title:'Page not found', description:'Find another Kaspa explanation.',
    body:`${intro('404','That page<br>isn’t here.','The requested address does not match a current page. Start with how Kaspa works or search for the topic you wanted.')}<div class="action-row"><a class="primary-button" href="/">Explore Kaspa</a><a href="/playground">Open the playground ↗</a></div>`,
  },
];

if(process.env.KASPA_RELEASE!=='v1'){const adventure=`<section class="playground-invitation"><div><p class="eyebrow">Sprout Harbor · Testnet-10</p><h2>What could a KAS economy look like?</h2></div><div><p>Build a greenhouse, pay Pip for work, sell the harvest and deliver it. Follow the actual test-coin payments and explore a recorded bridge to another chain.</p><a class="primary-button" href="/covenants">Play the town economy <span aria-hidden="true">↗</span></a><p>Free test coins. Production and physical delivery are game rules.</p></div></section>`;for(const file of ['build-on-kaspa.html','playground.html'])pages.find(p=>p.file===file).body+=adventure;}

// A next step makes the reading order explicit without hiding direct routes.
const readingNext={
 'index.html':['Begin with what the miners see','/what-is-kaspa'],
 'what-is-kaspa.html':['Follow a payment and its fee','/why-kaspa-matters'],
 'why-kaspa-matters.html':['Try the payment and network examples','/playground'],
 'skeptical-case.html':['Check the current evidence','/status'],
 'kaspa-mining.html':['Compare the network’s tradeoffs','/skeptical-case'],
 'build-on-kaspa.html':['Explore backing, borrowing and payouts','/money'],
 'status.html':['Read the protocol changes behind the labels','/kips'],
 'kaspa-origin-story.html':['See how the network works','/what-is-kaspa'],
 'kips.html':['See what builders can use','/build-on-kaspa'],
 'moose.html':['Check the guide’s sources and method','/sources'],
 'sources.html':['Compare the dated network and tooling evidence','/status'],
 'playground.html':process.env.KASPA_RELEASE==='v1'?['Explore what you can build','/build-on-kaspa']:['Play a KAS economy on Testnet-10','/covenants']
};
for(const page of pages){const next=readingNext[page.file];if(next){const [label,url]=next;const target=process.env.KASPA_RELEASE==='v1'&&url==='/applications'?'/build-on-kaspa':url;page.body+=`<nav class="reading-next" aria-label="Continue learning"><p>Continue learning</p><a href="${target}">${target!==url?'Explore what you can build':label} <span aria-hidden="true">→</span></a></nav>`;}}

export function searchPage(documents=pages) {
  const searchable=[...documents.filter(p=>p.file!=='404.html'),...[["redemption","What backs a stablecoin?","Explore cash, Treasury reserves, and redemption queues."],["collateral","Borrowing against crypto","Change collateral prices and inspect the liquidation threshold."],["prediction","How prediction payouts work","Follow Yes and No claims backed by one pool of collateral."]].map(([fragment,title,description])=>({file:`money.html#${fragment}`,title,description}))];
  return {file:'search.html',title:'Find an explanation',description:'Search Kaspa Explained topics and playgrounds.',body:`${intro('Find a topic','Find an explanation.','Search by the question you have: sending a payment, mining, spending rules or checking a claim.')}<label class="search-box"><span class="sr-only">Search the guide</span><input type="search" placeholder="Try wallets, blocks, or mining" data-search></label><p class="small" data-search-status aria-live="polite">${searchable.length} places to explore</p><div class="topic-list">${searchable.map(p=>`<a href="/${p.file==='index.html'?'':p.file.replace('.html','')}" data-search-item data-terms="${p.description}"><div><strong>${p.title}</strong><p>${p.description}</p></div><span aria-hidden="true">↗</span></a>`).join('')}</div><p data-search-empty hidden>No matching topic. Try a shorter search.</p>`};
}
