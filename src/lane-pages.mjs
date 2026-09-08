import {xHandles, localFilm, pinList, KGI} from './community.mjs';
import {link} from './components.mjs';

const intro = (eyebrow, title, lead) =>
  `<div class="page-intro"><p class="eyebrow">${eyebrow}</p><h1>${title}</h1><p class="lead">${lead}</p></div>`;

const rows = items =>
  `<div class="reading-rows">${items.map(([title, html]) =>
    `<article><h3>${title}</h3><div>${html}</div></article>`
  ).join('')}</div>`;

export const lanePages = [
  {
    file: 'moonboy.html',
    title: 'Moonboy',
    description: 'Price predictions and detailed chart analysis are not intel. Kaspa is a network.',
    body: `${intro('Moonboy', 'Price talk is not a source.', 'Price predictions are useless. Speculation is a time waste. Detailed chart analysis is the same: it does not tell you what the protocol does, what is live, or what still has to be built.')}
      ${localFilm('/media/moonboy.mp4', 'A reminder, not a forecast.')}
      ${rows([
        ['What this tab refuses', '<p>No target. No cycle top. No “next resistance.” Those sentences cannot be checked against a KIP, a node release, or a dated network snapshot.</p>'],
        ['What to do instead', '<p>Read what is live. Run a test wallet. Watch the blockDAG. If you arrived for a moon, Door 4 and the status table are the honest next pages.</p>'],
      ])}
      ${pinList([
        ['Door 4', 'Thinks they know. Price is not the protocol.', '/door-4'],
        ['What is live', 'Dated labels: live, roadmap, research, wrong.', '/status'],
        ['The tradeoffs', 'Node cost, mining concentration, what speed does not solve.', '/skeptical-case'],
      ])}`,
  },
  {
    file: 'best-practices.html',
    title: 'Best practices',
    description: 'Honest Kaspa sources: Kaspa Silver, books, Kas Smiths, Aviv Zohar, Q&A, and Core R&D recaps.',
    body: `${intro('Best practices', 'Read people who stay honest.', 'Prefer protocol explainers over price talk. Kaspa Silver is a good example of that attitude: slow, specific, and unwilling to sell you a moon.')}
      ${localFilm('/media/kaspa-silver.mp4', 'Kaspa Silver: what Kaspa is. More of that voice is on YouTube.')}
      <p><a href="https://www.youtube.com/channel/UCv8-2oyrfqDigJAKjZ_RCzQ" target="_blank" rel="noopener noreferrer">Kaspa Silver on YouTube ↗</a></p>
      ${rows([
        ['Kaspa Silver’s attitude', '<p>He explains the machine. Fair launch, proof of work, the DAG, what shipped. He does not owe you a price. That honesty is the practice: if a clip cannot point at a rule, a release, or a dated observation, skip it.</p>'],
        ['Aviv Zohar', '<p>GHOST co-author. Research first. Site: <a href="https://avivz.net" target="_blank" rel="noopener noreferrer">avivz.net</a>. X: <a href="https://x.com/Avivz78" target="_blank" rel="noopener noreferrer">@Avivz78</a>.</p>'],
      ])}
      ${localFilm('/media/kaspa-content.mp4', 'More context around Kaspa. Treat it as a film, not a spec.')}
      ${pinList([
        ['The Book of Kaspa', 'Realizing Nakamoto’s Dream. Guest book, not consensus evidence.', 'https://www.amazon.com/Book-Kaspa-Realizing-Nakamoto-Dream/dp/B0CCCJ3936'],
        ['Kaspa Ghost Knight', 'A story about blockchains’ plight. Guest book, not a KIP.', 'https://www.amazon.com/Kaspa-Ghost-Knight-blockchains-plight-ebook/dp/B0D2VK4PVR'],
        ['Kas Smiths', 'Builder workshop. kasmith.org is the same desk name; this is the working URL.', 'https://kas-smiths.org'],
        ['Core R&D Telegram', 'Observer-first. Recaps live on kaspa.news.', 'https://t.me/kasparnd'],
        ['kaspa.news', 'Public recaps of Core R&D. Not the channel itself.', 'https://kaspa.news'],
        ['Kaspa Q&A', 'Ask and search. Answers are not KIPs.', 'https://qa.kas.pa/'],
      ])}`,
  },
  {
    file: 'explore.html',
    title: 'Explore',
    description: 'kaspa.stream for ordinary people: a live explorer of blocks and payments. Plus the graph inspector.',
    body: `${intro('Explore', 'See the network without a ticker.', 'kaspa.stream is an explorer for the many: blocks, transactions, and a live picture of the DAG. You do not need a thesis to open it. You need a transaction ID, an address, or curiosity.')}
      ${rows([
        ['What kaspa.stream is', '<p>A block explorer with real-time network insight. Paste an address or a transaction. Watch new blocks land. It is a window onto the ledger, not a trading desk.</p><p><a href="https://kaspa.stream/" target="_blank" rel="noopener noreferrer">Open kaspa.stream ↗</a></p>'],
        ['What the Graph Inspector is', `<p>kgi.kaspad.net draws the blockDAG as it grows. Parallel blocks are the point. A candle chart is not.</p><p><a href="${KGI}" target="_blank" rel="noopener noreferrer">Open the Graph Inspector ↗</a></p>`],
        ['Official explorer', '<p>explorer.kaspa.org is the other public ledger view. Use either. Cross-check if a number matters.</p>'],
      ])}
      ${pinList([
        ['kaspa.stream', 'Explorer for ordinary reading of blocks and txs.', 'https://kaspa.stream/'],
        ['Graph Inspector', 'Live blockDAG.', KGI],
        ['Kaspa Explorer', 'L1 transactions.', 'https://explorer.kaspa.org'],
        ['Kaspa Q&A', 'Community questions.', 'https://qa.kas.pa/'],
      ])}`,
  },
  {
    file: 'help.html',
    title: 'Help',
    description: 'Questions go to Kaspa Discord. Dedicated rooms exist. Browse, then ask.',
    body: `${intro('Need or questions', 'Ask in the rooms that already exist.', 'Kaspa Discord is the help desk. It is not one chat. There are dedicated subtopics: wallets, development, covenants, research, mining, merchants. Browse first. Then ask. Nobody here can recover a seed.')}
      <p><a class="primary-button" href="https://discord.com/channels/599153230659846165/960905681832140850" target="_blank" rel="noopener noreferrer">Open Kaspa Discord ↗</a></p>
      <p class="small">If that channel link does not open, join first: <a href="https://discord.gg/kaspa" target="_blank" rel="noopener noreferrer">discord.gg/kaspa</a>.</p>
      ${rows([
        ['How to ask well', '<p>Say what you did, which network (mainnet or Testnet-10), which wallet, and the error text. Do not paste a recovery phrase. Do not ask for a price.</p>'],
        ['Other rooms', '<p>Kaspa Q&A for written questions. Core R&D Telegram is observer-first; recaps are on kaspa.news. Official docs stay at docs.kaspa.org.</p>'],
      ])}
      ${pinList([
        ['Discord invite', 'Join, then browse the topic rooms.', 'https://discord.gg/kaspa'],
        ['Kaspa Q&A', 'Written questions. Not law.', 'https://qa.kas.pa/'],
        ['Telegram R&D', 'Core write-restricted. Recaps: kaspa.news.', 'https://t.me/kasparnd'],
        ['Docs', 'Start here before a chat question.', 'https://docs.kaspa.org'],
      ])}`,
  },
  {
    file: 'node.html',
    title: 'Node',
    description: 'Run a Testnet-10 rusty-kaspa node and mine tKAS today. CPU first. Do not point mainnet hardware at testnet by accident.',
    body: `${intro('Node', 'A Testnet-10 node, then tKAS.', 'tKAS on TN10 today is a synced rusty-kaspa node, a kaspatest: address, and a miner pointed at that node. It is faucet money. It is not mainnet KAS. Official line: CPU mining so you do not own the tiny testnet.')}
      <p class="small">Dated lab notes plus official docs. Pin: rusty-kaspa <strong>v2.0.1</strong>. Do not use testnet-12. Addresses start with <code>kaspatest:</code>.</p>
      ${rows([
        ['What you actually run', '<p>Node first. Miner second. Mining while unsynced is how you mine a private fork. There is no official <code>kaspa.exe</code>. The Windows node binary is <code>kaspad.exe</code> from the rusty-kaspa zip.</p>'],
        ['Do not ASIC or pool this', '<p>Wiki line: do not put GPU, FPGA, or ASIC on testnet. Same kHeavyHash, different network, different address prefix. Pointing BzMiner at WoolyPooly or 2Miners is mainnet KAS. Wrong network, wasted power. If you only need coins for scripts, use the faucet.</p>'],
        ['1. Get a TN10 address', '<p>Kaspa-NG set to Testnet-10, rusty wallet, or Rothschild. Copy an address that starts with <code>kaspatest:</code>. If it starts with <code>kaspa:</code>, stop. Optional: fund it from the faucet so you can test spends without waiting for coinbase to mature.</p>'],
        ['2. Run the node', `<p>Download the Windows zip from ${link('rusty-kaspa v2.0.1','https://github.com/kaspanet/rusty-kaspa/releases/tag/v2.0.1')} (<code>rusty-kaspa-v2.0.1-win64.zip</code>). Unzip to a real folder. Confirm you see <code>kaspad.exe</code>. It is often in that folder or one level down in <code>bin</code>.</p>
          <p>PowerShell, from the folder that contains the exe. Leave this window open. Closing it kills the node.</p>
          <pre>cd C:\\Kaspa
dir kaspad.exe
.\\kaspad.exe --testnet --netsuffix=10 --utxoindex</pre>
          <p>If you need Borsh RPC as well:</p>
          <pre>.\\kaspad.exe --testnet --netsuffix=10 --utxoindex --rpclisten-borsh=127.0.0.1:17110</pre>
          <p>Linux:</p>
          <pre>./kaspad --testnet --netsuffix=10 --utxoindex --rpclisten-borsh=default</pre>
          <p>Wait until it is synced and has peers. First run can sit on IBD. That is normal. Windows Firewall: allow private networks.</p>
          <p>Check the public net is alive before you debug your box: ${link('explorer-tn10.kaspa.org','https://explorer-tn10.kaspa.org/')} · ${link('api-tn10.kaspa.org','https://api-tn10.kaspa.org/')}</p>`],
        ['3. CPU miner (the intended path)', `<p>Default TN10 gRPC port is <strong>16210</strong>. Start with one thread. Node first, miner second. ${link('kaspanet/cpuminer','https://github.com/kaspanet/cpuminer')} (v0.2.7 lineage):</p>
          <pre>kaspa-miner --testnet --mining-address kaspatest:YOUR_ADDRESS -p 16210 -t 1</pre>`],
        ['4. Need coins without mining', `<p>${link('faucet-testnet.kaspanet.io','https://faucet-testnet.kaspanet.io')} (also seen as faucet-tn10.kaspanet.io). Discord #testnet if the faucet is dry. Then bring the address to the <a href="/playground">playground</a>.</p>`],
        ['GPU, if you still insist', '<p>Official line is still CPU only on TN10. GPU is allowed by physics, not by etiquette. One card can own a network that sits around tens of MH/s. There is no public GPU pool for tKAS. You solo against your own synced node.</p><p>After Toccata, block templates carry extra fields. Old GPU miners talking raw gRPC can hash and still submit invalid blocks. If that happens, use node + stratum-bridge + miner, not more overclock.</p>'],
        ['BzMiner to the node', '<p><code>bzminer -a kaspa -w kaspatest:YOUR_ADDRESS -p node+tcp://127.0.0.1:16210 --nc 1</code>. Some builds want <code>solo+tcp://</code>. Do not use <code>stratum+tcp://pool...</code>.</p>'],
        ['Community miner', `<p>${link('tmrlvi/kaspa-miner','https://github.com/tmrlvi/kaspa-miner/releases')} GPU build. <code>./kaspa-miner --testnet --mining-address kaspatest:YOUR_ADDRESS -s 127.0.0.1 -p 16210 -t 0</code>. AMD: add <code>--opencl-enable</code>. This miner is old. Hashing with zero accepted blocks is protocol age, not clocks.</p>`],
        ['Stratum-bridge (least likely to lie after Toccata)', '<p>Node as above. Bridge pointed at <code>127.0.0.1:16210</code>. Miner to the local stratum port (often 5555, confirm with netstat). Do not port-forward that port to the internet. GPU on another PC: use the node PC LAN IP, not 127.0.0.1.</p>'],
      ])}
      <div class="table-scroll" role="region" aria-label="Node failures"><table>
        <thead><tr><th>Symptom</th><th>Actual cause</th></tr></thead>
        <tbody>
          <tr><th>Reconnect loop</th><td>Wrong port (16210 vs 16211 vs 16110) or node not listening</td></tr>
          <tr><th>Invalid address</th><td>You used <code>kaspa:</code></td></tr>
          <tr><th>Hashing, zero blocks, rejected submit</th><td>Pre-Toccata miner vs Toccata templates. Use the stratum-bridge path</td></tr>
          <tr><th>Mining instantly at start</th><td>Node not synced. You forked yourself</td></tr>
          <tr><th>Pool dashboard on Wooly or F2</th><td>You are on mainnet. Stop</td></tr>
          <tr><th><code>.\\kaspad.exe</code> not found</th><td>You are not in the extract folder. <code>cd</code> to the directory that contains the exe, then run it</td></tr>
          <tr><th>invalid IP / glued flags</th><td>Two commands pasted as one line. One command, then Enter</td></tr>
        </tbody>
      </table></div>
      ${pinList([
        ['rusty-kaspa v2.0.1', 'Windows zip. Run kaspad.exe, not a mystery kaspa.exe.', 'https://github.com/kaspanet/rusty-kaspa/releases/tag/v2.0.1'],
        ['Node operations', 'Official node docs.', 'https://docs.kaspa.org/integrate/kaspa-node'],
        ['kaspa.org/build', 'Docker one-liner and builder door.', 'https://kaspa.org/build'],
        ['TN10 explorer', 'Confirm the public testnet is alive.', 'https://explorer-tn10.kaspa.org/'],
        ['TN10 faucet', 'Coins without mining.', 'https://faucet-testnet.kaspanet.io'],
        ['Playground', 'Bring the kaspatest: address here.', '/playground'],
        ['Lab notes', 'The dated Grok share this tab restates.', 'https://grok.com/share/bGVnYWN5_01c3c778-41eb-4b4c-9013-6fe6424c60d9'],
      ])}`,
  },
  {
    file: 'x-handles.html',
    title: 'X handles',
    description: 'Kaspa X accounts from the master file. Core is not a legal title. DYOR.',
    body: `${intro('X handles', 'Follow the people who write the rules.', 'From the Kaspa master file. Yonatan’s own rough core list is a starting map, not a title. Inspect GitHub and research.kas.pa. A tweet is not a KIP.')}
      <div class="table-scroll" role="region" aria-label="Kaspa X handles"><table>
        <thead><tr><th>Person</th><th>Handle</th><th>Public role</th></tr></thead>
        <tbody>${xHandles.map(([name, handle, url, role]) =>
          `<tr><th>${name}</th><td><a href="${url}" target="_blank" rel="noopener noreferrer">${handle}</a></td><td>${role}</td></tr>`
        ).join('')}</tbody>
      </table></div>
      <p class="small">Source: Kaspa master file, freeze 7 Sep 2026. Not Kaspa core. Not official KNS.</p>`,
  },
];
