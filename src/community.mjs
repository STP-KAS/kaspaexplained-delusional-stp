export const KGI = 'https://kgi.kaspad.net/';

export const communityRules =
  'Rules for entering the Kaspa community: when engaging online, be mature. No price predictions. Build. Share ideas. Keep a positive critical mindset.';

export const xHandles = [
  ['Yonatan Sompolinsky', '@hashdag', 'https://x.com/hashdag', 'Founder / research'],
  ['Michael Sutton', '@michaelsuttonil', 'https://x.com/michaelsuttonil', 'Lead protocol'],
  ['Ori Newman', '@OriNewman', 'https://x.com/OriNewman', 'Core. GitHub someone235'],
  ['coderofstuff', '@coderofstuff_', 'https://x.com/coderofstuff_', 'Core contributor'],
  ['FreshAir08', '@FreshAir08', 'https://x.com/FreshAir08', 'Research / fees'],
  ['Hans Moog', '@hus_qy', 'https://x.com/hus_qy', 'Core / KEF-funded'],
  ['Romain Billot', '@IzioDev', 'https://x.com/IzioDev', 'Core / KEF-funded'],
  ['Maxim Biryukov', '@biryukovmaxim', 'https://x.com/biryukovmaxim', 'Core. KIP-21'],
  ['Aviv Zohar', '@Avivz78', 'https://x.com/Avivz78', 'GHOST co-author / research. avivz.net'],
  ['Shai Wyborski', '@DesheShai', 'https://x.com/DesheShai', 'GHOSTDAG co-author. Left core in 2025. History, not a current core pin'],
  ['Kaspa community X', '@kaspaunchained', 'https://x.com/kaspaunchained', 'Non-representative community account'],
  ['Kaspa global', '@KASPAglobal', 'https://x.com/KASPAglobal', 'Toccata is live, not coming soon'],
  ['Kaspa Commons', '@Kaspa_Commons', 'https://x.com/Kaspa_Commons', 'Relays Discord. Not core'],
  ['STP-KAS', '@StppStp', 'https://x.com/StppStp', 'This overlay. Never DMs you'],
  ['Luke Dunshea', '@elldeeone', 'https://x.com/elldeeone', 'SilverScript v1-rc1. Groth16 builtin'],
  ['Sivan Helfer', '@manyfest_', 'https://x.com/manyfest_', 'SilverScript compiler. Kas Smiths'],
];

export function kgiCard(kind = 'door') {
  const lead = kind === 'home'
    ? 'A modest live view of the blockDAG. Open it in its own tab if the frame is quiet.'
    : 'The live blockDAG. This is the picture. The rest of the door is text.';
  return `<figure class="kgi-card">
    <p class="eyebrow">Kaspa Graph Inspector</p>
    <p>${lead}</p>
    <a class="kgi-link" href="${KGI}" target="_blank" rel="noopener noreferrer">Open kgi.kaspad.net <span aria-hidden="true">↗</span></a>
    <iframe class="kgi-frame" title="Kaspa Graph Inspector" src="${KGI}" loading="lazy" referrerpolicy="no-referrer"></iframe>
    <figcaption class="small">If the frame is blank, the inspector blocked embedding. The link still works.</figcaption>
  </figure>`;
}

export function localFilm(src, caption) {
  return `<figure class="door-film">
    <video controls playsinline preload="metadata" src="${src}">
      Your browser cannot play this film. <a href="${src}">Open the file</a>.
    </video>
    ${caption ? `<figcaption class="small">${caption}</figcaption>` : ''}
  </figure>`;
}

export function pinList(items) {
  return `<nav class="topic-list" aria-label="Pins">${items.map(([title, text, url]) =>
    `<a href="${url}"${url.startsWith('http') ? ' target="_blank" rel="noopener noreferrer"' : ''}><div><strong>${title}</strong><p>${text}</p></div><span aria-hidden="true">↗</span></a>`
  ).join('')}</nav>`;
}

function svgWrap(title, body) {
  return `<figure class="door-visual" aria-hidden="true">
    <svg viewBox="0 0 360 120" role="img" focusable="false">
      <title>${title}</title>
      ${body}
    </svg>
  </figure>`;
}

export const doorVisuals = {
  1: svgWrap('A payment from one person to another, checked by a miner', `
    <rect x="12" y="34" width="78" height="52" rx="12" fill="currentColor" opacity=".08"/>
    <text x="51" y="65" text-anchor="middle" font-size="13" fill="currentColor">You</text>
    <path d="M96 60h52" stroke="currentColor" stroke-width="1.5" fill="none"/>
    <polygon points="148,56 158,60 148,64" fill="currentColor"/>
    <rect x="164" y="28" width="92" height="64" rx="14" fill="currentColor" opacity=".08"/>
    <text x="210" y="56" text-anchor="middle" font-size="12" fill="currentColor">Miner</text>
    <text x="210" y="74" text-anchor="middle" font-size="11" fill="currentColor" opacity=".7">energy in</text>
    <path d="M262 60h52" stroke="currentColor" stroke-width="1.5" fill="none"/>
    <polygon points="314,56 324,60 314,64" fill="currentColor"/>
    <rect x="270" y="34" width="78" height="52" rx="12" fill="currentColor" opacity=".08"/>
    <text x="309" y="65" text-anchor="middle" font-size="13" fill="currentColor">Them</text>`),
  2: svgWrap('A chain throws extra blocks away; a DAG keeps parallel honest work', `
    <text x="70" y="22" text-anchor="middle" font-size="11" fill="currentColor" opacity=".7">chain</text>
    <rect x="18" y="40" width="36" height="28" rx="6" fill="currentColor" opacity=".12"/>
    <rect x="62" y="40" width="36" height="28" rx="6" fill="currentColor" opacity=".12"/>
    <rect x="106" y="18" width="36" height="28" rx="6" fill="none" stroke="currentColor" stroke-dasharray="3 3" opacity=".45"/>
    <text x="124" y="36" text-anchor="middle" font-size="10" fill="currentColor" opacity=".55">drop</text>
    <text x="250" y="22" text-anchor="middle" font-size="11" fill="currentColor" opacity=".7">blockDAG</text>
    <rect x="196" y="48" width="36" height="28" rx="6" fill="currentColor" opacity=".12"/>
    <rect x="240" y="28" width="36" height="28" rx="6" fill="currentColor" opacity=".12"/>
    <rect x="240" y="68" width="36" height="28" rx="6" fill="currentColor" opacity=".12"/>
    <rect x="284" y="48" width="36" height="28" rx="6" fill="currentColor" opacity=".12"/>
    <path d="M232 62h8M232 62l16-20M232 62l16 20M276 42h8M276 82h8" stroke="currentColor" stroke-width="1.2" fill="none" opacity=".7"/>`),
  3: svgWrap('Live protocol versus research that is not product yet', `
    <rect x="16" y="28" width="150" height="64" rx="14" fill="currentColor" opacity=".1"/>
    <text x="91" y="54" text-anchor="middle" font-size="12" fill="currentColor">Live</text>
    <text x="91" y="74" text-anchor="middle" font-size="11" fill="currentColor" opacity=".7">10 BPS · Toccata</text>
    <rect x="194" y="28" width="150" height="64" rx="14" fill="none" stroke="currentColor" stroke-dasharray="4 3" opacity=".55"/>
    <text x="269" y="54" text-anchor="middle" font-size="12" fill="currentColor">Research</text>
    <text x="269" y="74" text-anchor="middle" font-size="11" fill="currentColor" opacity=".7">vProgs · DAGKnight</text>`),
  4: svgWrap('A price chart is not the protocol', `
    <path d="M28 88 L70 52 L110 70 L160 30 L210 48 L250 22 L320 40" fill="none" stroke="currentColor" stroke-width="1.4" opacity=".35"/>
    <path d="M28 20 L332 100" stroke="currentColor" stroke-width="2"/>
    <text x="180" y="112" text-anchor="middle" font-size="11" fill="currentColor" opacity=".75">price is not a source</text>`),
};
