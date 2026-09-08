import {xHandles, localFilm, pinList, KGI} from './community.mjs';

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
      <p class="small">Source: Kaspa master file, freeze 7 Sep 2026. @StppStp / STP-KAS. Not Kaspa core. Not official KNS.</p>`,
  },
];
