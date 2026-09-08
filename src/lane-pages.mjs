import {xHandles, localFilm, pinList, KGI} from './community.mjs';
import {link, section} from './components.mjs';

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
    description: 'Two jobs: a Testnet-10 node plus CPU-mined tKAS, or a mainnet node that can be public. Do not mix the flags.',
    body: `${intro('Node', 'Two jobs. Do not mix them.', 'TN10 is a local kaspad plus a CPU miner paying a kaspatest: address. Mainnet is a real node. Public P2P is optional. This page does not tell you to mine mainnet.')}
      <p class="small">Lab notes from a Windows run, 7 Sep 2026, plus official docs. Pin: rusty-kaspa <strong>v2.0.1</strong> or newer. There is no official <code>kaspa.exe</code>. The node is <code>kaspad</code> / <code>kaspad.exe</code>.</p>
      <div class="table-scroll" role="region" aria-label="Do not mix these networks"><table>
        <thead><tr><th></th><th>TN10 mine tKAS</th><th>Mainnet public node</th></tr></thead>
        <tbody>
          <tr><th>Flag</th><td><code>--testnet --netsuffix=10</code></td><td>no <code>--testnet</code></td></tr>
          <tr><th>Address</th><td><code>kaspatest:</code></td><td><code>kaspa:</code> (wallet only; this guide is node-only)</td></tr>
          <tr><th>Miner port</th><td>16210</td><td>do not mine here</td></tr>
          <tr><th>P2P</th><td>testnet</td><td>16111 mainnet</td></tr>
          <tr><th>Coins</th><td>worthless</td><td>real KAS</td></tr>
          <tr><th>Explorer</th><td>${link('tn10.kaspa.stream','https://tn10.kaspa.stream/')}</td><td>${link('kaspa.stream','https://kaspa.stream/')}</td></tr>
        </tbody>
      </table></div>
      ${section('tn10', 'TN10 + tKAS', `${rows([
        ['What this is', '<p>A local kaspad on Testnet-10 plus a CPU miner paying a <code>kaspatest:</code> address. tKAS is faucet money. Official line: CPU only so you do not own a tiny testnet.</p>'],
        ['0. Download, then move it', `<p>GitHub puts the zip in Downloads. Do not run from there. Browser plus OneDrive plus <code>kaspa-miner (3).exe</code> is how paths break.</p>
          <p>Get ${link('rusty-kaspa latest','https://github.com/kaspanet/rusty-kaspa/releases/latest')}: Windows <code>rusty-kaspa-*-win64.zip</code>, Linux <code>rusty-kaspa-*-linux-amd64.zip</code>, macOS <code>rusty-kaspa-*-osx.zip</code>. CPU miner: ${link('kaspanet/cpuminer','https://github.com/kaspanet/cpuminer/releases')}.</p>
          <p>Make a dedicated folder and copy the unzipped files there. Windows: <code>C:\\Kaspa\\tn10\\</code>. Ubuntu / Linux / macOS: <code>~/kaspa/tn10/</code>. Confirm you see <code>kaspad.exe</code> or <code>kaspad</code> (sometimes in <code>bin/</code>).</p>
          <p>Windows after unzip:</p>
          <pre>New-Item -ItemType Directory -Force -Path C:\\Kaspa\\tn10
Copy-Item "$env:USERPROFILE\\Downloads\\rusty-kaspa-*\\*" C:\\Kaspa\\tn10 -Recurse</pre>
          <p>Linux / macOS:</p>
          <pre>mkdir -p ~/kaspa/tn10
unzip -o ~/Downloads/rusty-kaspa-*-linux-amd64.zip -d ~/kaspa/tn10
chmod +x ~/kaspa/tn10/kaspad ~/kaspa/tn10/kaspa-wallet ~/kaspa/tn10/rothschild</pre>
          <p>If the zip dumped a <code>bin/</code> subfolder, <code>cd</code> there. Copy the miner into the same folder. Rename long GitHub names: <code>kaspa-miner-v0.2.7-win64-amd64 (3).exe</code> becomes <code>kaspa-miner.exe</code>.</p>`],
        ['1. Get a kaspatest: address', `<p>Must start with <code>kaspatest:</code>. A <code>kaspa:</code> address is the wrong network.</p>
          <p>${link('Kaspa-NG','https://github.com/aspectron/kaspa-ng/releases')}: network Testnet-10, create wallet, copy receive address. CLI: <code>kaspa-wallet</code> in the node zip, against a running TN10 node with <code>--utxoindex</code>. Throwaway: <code>rothschild</code> in the same zip can print a key plus address. Save the key if you want that bag.</p>
          <p>Paste the full string into ${link('tn10.kaspa.stream','https://tn10.kaspa.stream/')} search. If it rejects it, you chopped the address or used mainnet. Faucet is optional: ${link('faucet-tn10.kaspanet.io','https://faucet-tn10.kaspanet.io/')}. You do not need it to mine.</p>`],
        ['2. Start the node (terminal 1, leave it open)', `<p>Windows PowerShell:</p>
          <pre>cd C:\\Kaspa\\tn10
dir kaspad.exe
.\\kaspad.exe --testnet --netsuffix=10 --utxoindex</pre>
          <p>Ubuntu / Linux / macOS:</p>
          <pre>cd ~/kaspa/tn10
./kaspad --testnet --netsuffix=10 --utxoindex</pre>
          <p>One line. Enter once. Closing this window kills the node. One kaspad only. Windows Firewall: allow private networks.</p>
          <p>Fails already hit: command from your home folder is “not recognized” (you are not in the dedicated folder). Two commands glued on one line makes <code>--rpclisten-borsh=default.\\kaspad.exe</code> and “invalid IP”. Missing <code>--testnet</code> puts you on mainnet by accident.</p>`],
        ['3. Wait until it is actually synced', '<p>Order: validating pruning-point proof (levels counting down). Receiving UTXO set chunks (<code>--utxoindex</code> is slow, hundreds of millions of UTXOs). “Finished receiving the UTXO set” then importing (looks frozen; do not kill it). Live tip: Accepted N blocks via relay every second.</p><p>Only step 4 is ready. Plan 1 to 2 hours on a home line.</p>'],
        ['4. Start the miner (terminal 2)', `<p>Node stays up. You do not hard-close kaspad to free the miner. Rename the long miner filename first if needed.</p>
          <p>Windows:</p>
          <pre>cd C:\\Kaspa\\tn10
.\\kaspa-miner.exe --testnet --mining-address kaspatest:YOUR_ADDRESS -s 127.0.0.1 -p 16210 -t 1</pre>
          <p>Linux / macOS:</p>
          <pre>cd ~/kaspa/tn10
./kaspa-miner --testnet --mining-address kaspatest:YOUR_ADDRESS -s 127.0.0.1 -p 16210 -t 1</pre>
          <p>Port <strong>16210</strong> is TN10 gRPC, not mainnet 16110. <code>-t 1</code> is one CPU thread. Enough on TN10.</p>`],
        ['5. Check rewards', `<p>${link('tn10.kaspa.stream address lookup','https://tn10.kaspa.stream/')}. explorer-tn10.kaspa.org was unreliable. Coinbase stays Confirming until mature. Blue good, red bad. Then bring the address to the <a href="/playground">playground</a>.</p>
          <p>Change address: Ctrl+C the miner only. Restart with the new <code>kaspatest:</code> string. Old coins stay on the old address.</p>`],
        ['GPU, if you still insist', `<p>Official line is still CPU only on TN10. GPU is allowed by physics, not by etiquette. One card can own a network that sits around tens of MH/s. There is no public GPU pool for tKAS.</p>
          <p>BzMiner to the node: <code>bzminer -a kaspa -w kaspatest:YOUR_ADDRESS -p node+tcp://127.0.0.1:16210 --nc 1</code>. Some builds want <code>solo+tcp://</code>. Do not use <code>stratum+tcp://pool...</code>.</p>
          <p>Or ${link('tmrlvi/kaspa-miner','https://github.com/tmrlvi/kaspa-miner/releases')} GPU build, <code>-t 0</code> for GPU only. After Toccata, old miners can hash and still submit invalid blocks. Then use <code>stratum-bridge.exe</code> from the same zip, miner to <code>127.0.0.1:5555</code>. Do not port-forward stratum.</p>`],
      ])}
      <div class="table-scroll" role="region" aria-label="TN10 failures"><table>
        <thead><tr><th>Symptom</th><th>Actual cause</th></tr></thead>
        <tbody>
          <tr><th>not recognized</th><td>Wrong folder. <code>cd</code> to the directory that contains the exe</td></tr>
          <tr><th>invalid IP / glued flags</th><td>Two commands pasted as one line. One command, then Enter</td></tr>
          <tr><th>Reconnect loop / connection refused</th><td>Wrong port (16210 vs 16211 vs 16110), node not listening, or still importing UTXOs</td></tr>
          <tr><th>Invalid address</th><td>You used <code>kaspa:</code> or chopped the string</td></tr>
          <tr><th>Hashing, zero blocks, rejected submit</th><td>Pre-Toccata miner vs Toccata templates. Use the stratum-bridge path</td></tr>
          <tr><th>Mining instantly at start</th><td>Node not synced. You forked yourself</td></tr>
          <tr><th>Pool dashboard on Wooly or F2</th><td>You are on mainnet. Stop</td></tr>
        </tbody>
      </table></div>`, 'Local kaspad on Testnet-10 plus a CPU miner paying a kaspatest: address.')}
      ${section('mainnet-node', 'Mainnet public node', `${rows([
        ['What this is', '<p>Follow real KAS. This is not a miner guide. Do not add <code>--testnet</code>. Same release zip, different folder: <code>C:\\Kaspa\\mainnet\\</code> or <code>~/kaspa/mainnet/</code>.</p>'],
        ['Hardware', '<p>SSD. 16 GB RAM minimum, 32 GB more comfortable. 4+ cores. Tens of GB free. Stable link. Mainnet after Crescendo and Toccata is heavier than TN10.</p>'],
        ['Start', `<p>Linux / Ubuntu / macOS:</p>
          <pre>cd ~/kaspa/mainnet
./kaspad --utxoindex</pre>
          <p>Windows:</p>
          <pre>cd C:\\Kaspa\\mainnet
.\\kaspad.exe --utxoindex</pre>
          <p>Optional local RPC. Keep it local:</p>
          <pre>./kaspad --utxoindex --rpclisten=127.0.0.1:16110</pre>
          <p>Do not expose 16110. IBD is long. Same rule: do not kill during UTXO import. One process per data dir.</p>`],
        ['You are synced when', '<p>Logs look like live tip: accepted blocks via relay, steady processed N blocks, not receiving UTXO set or pruning-level validation. Then a wallet can attach to <code>127.0.0.1:16110</code>.</p>'],
        ['Background (optional)', `<p>Foreground is fine for learning. Linux user systemd or tmux on Mac. One kaspad per data dir. Two processes on the same data dir is a lock or corruption.</p>
          <p>Update: stop cleanly, overwrite <code>kaspad</code>, start again. Stay on 2.0.1+ (Toccata). Same data dir. Do not delete the DB unless the release notes say to resync.</p>`],
        ['Public is optional', `<p>You can sync forever as a private follower. Public means others can dial in on P2P <strong>16111/tcp</strong> on a real public IP.</p>
          <p>Router: forward 16111 to this machine. Firewall allow 16111 (<code>sudo ufw allow 16111/tcp</code> on Ubuntu). Do not bind P2P to 127.0.0.1. Need a real public IP. CGNAT means you will never list. RPC stays private. Public node is not open RPC.</p>`],
        ['Check on kaspa.stream', `<p>${link('kaspa.stream/nodes','https://kaspa.stream/nodes')}. Use Check your node. If the crawler sees you, the page highlights you. Want user agent <code>kaspad:2.0.1</code> (Toccata). Wait 10 to 30 minutes after opening the port.</p>
          <p>Extra port test: ${link('kaspa.host','https://kaspa.host/')} on mainnet 16111. Not listed means private follower. That is still a valid node. The chain does not require you to be on the public list.</p>`],
      ])}`, 'Follow real KAS. Public P2P is optional. No miner in this guide.')}
      ${section('do-not-mix', 'Do not mix', `<div class="table-scroll" role="region" aria-label="Wrong mixes"><table>
        <thead><tr><th>Wrong</th><th>What happens</th></tr></thead>
        <tbody>
          <tr><th><code>--testnet</code> on the mainnet folder</th><td>you sync TN10</td></tr>
          <tr><th><code>kaspa:</code> on the TN10 miner</th><td>wrong network or fail</td></tr>
          <tr><th>Wooly / F2 / K1 while mining tKAS</th><td>mainnet KAS</td></tr>
          <tr><th>Two kaspad on one DB</th><td>lock or corruption</td></tr>
          <tr><th>Binaries left in Downloads</th><td>path and <code>(3).exe</code> mess</td></tr>
          <tr><th>GPU or ASIC on public TN10</th><td>you can own a tiny network</td></tr>
        </tbody>
      </table></div>
      <p>TN10: dedicated folder, synced testnet node, one CPU thread on 127.0.0.1:16210, <code>kaspatest:</code> address.</p>
      <p>Mainnet: dedicated folder, <code>kaspad --utxoindex</code>, optional 16111, then ${link('kaspa.stream/nodes','https://kaspa.stream/nodes')}.</p>`, 'Wrong flag, wrong prefix, wrong pool.')}
      ${pinList([
        ['rusty-kaspa latest', 'Run kaspad, not a mystery kaspa.exe.', 'https://github.com/kaspanet/rusty-kaspa/releases/latest'],
        ['CPU miner', 'kaspanet/cpuminer. Rename the long filename.', 'https://github.com/kaspanet/cpuminer/releases'],
        ['Kaspa-NG', 'GUI wallet. Set Testnet-10 for tKAS.', 'https://github.com/aspectron/kaspa-ng/releases'],
        ['TN10 explorer', 'The explorer that worked. explorer-tn10.kaspa.org was unreliable.', 'https://tn10.kaspa.stream/'],
        ['TN10 faucet', 'Coins without mining.', 'https://faucet-tn10.kaspanet.io'],
        ['kaspa.stream/nodes', 'Check if your mainnet node is public.', 'https://kaspa.stream/nodes'],
        ['kaspa.host', 'Independent mainnet 16111 port test.', 'https://kaspa.host/'],
        ['Playground', 'Bring the kaspatest: address here.', '/playground'],
        ['Lab notes', 'The dated Grok share this tab restates.', 'https://grok.com/share/bGVnYWN5_b69a688b-75fe-441d-80d7-66c998fe9455'],
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
