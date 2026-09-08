import {mkdir,writeFile,readFile,copyFile,cp,mkdtemp,rename,access} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {homedir} from 'node:os';
import {documents,standalone} from '../src/page-registry.mjs';
import {site} from '../src/site.mjs';
import {escape} from '../src/components.mjs';
import {communityRules} from '../src/community.mjs';
import {withContents} from '../src/page-contents.mjs';
import {legacyDestination} from './legacy-target.mjs';

if(process.env.KASPA_RELEASE && !['v1','v2'].includes(process.env.KASPA_RELEASE))throw new Error('Choose release v1 or v2.');
await mkdir('.cache',{recursive:true});
const output=await mkdtemp('.cache/site-build-');
const destination=standalone?'dist-v1':'dist';
await mkdir(`${output}/assets`,{recursive:true});
export const shell=page=>`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(page.title)}${page.title===site.title?'':' · '+site.title}</title><meta name="description" content="${escape(page.description)}"><link rel="canonical" href="${site.domain}/${page.file==='index.html'?'':page.file.replace('.html','')}"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><meta property="og:title" content="${escape(page.title)}"><meta property="og:description" content="${escape(page.description)}"><meta property="og:image" content="${site.domain}/og-kaspa-explained.png"><link rel="stylesheet" href="/assets/app.css"><link rel="stylesheet" href="/assets/network-diagram.css"><link rel="stylesheet" href="/assets/mechanism-diagrams.css"><link rel="stylesheet" href="/assets/flow-diagrams.css"><script>try{const t=new URLSearchParams(location.search).get('theme')||localStorage.getItem('kaspa-theme');if(t==='dark')document.documentElement.dataset.theme='dark';}catch{}</script><script type="module" src="/assets/app.mjs"></script></head><body${page.file==='covenants.html'?' class="covenant-world-page"':''}><a class="skip" href="#main">Skip to content</a><header class="site-header"><div class="header-inner"><a class="brand" href="/"><img src="/favicon.svg" width="28" height="28" alt="">Kaspa Explained</a><nav class="main-nav" id="main-nav" aria-label="Main navigation">${site.navigation.map(([title,href])=>`<a href="${href}"${page.file===href.slice(1)+'.html'?' aria-current="page"':''}>${title}</a>`).join('')}</nav><div class="header-tools"><a href="/search" aria-label="Search explanations">Search</a><button class="theme-button" data-theme-toggle aria-label="Dark appearance" aria-pressed="false">◐</button><button class="menu-button" data-menu aria-expanded="false" aria-controls="main-nav">Menu</button></div></div></header><main class="main" id="main">${withContents(page)}</main><footer class="site-footer"><p>Independent education about Kaspa.<br>Models explain. Sources let you check.</p><nav aria-label="Footer"><a href="/sources">Sources</a><a href="/status">Current status</a><a href="/search">Search</a></nav><p class="community-rules">${escape(communityRules)}</p></footer></body></html>`;
for(const page of documents){
  await mkdir(resolve(output, dirname(page.file)),{recursive:true});
  await writeFile(`${output}/${page.file}`,shell(page));
}
await mkdir(`${output}/media`,{recursive:true});
const films=[
  ['kaspa-roots.mp4',[resolve('media/kaspa-roots.mp4'),resolve(homedir(),'Documents/kaspa/EB3LbxCt7_h_jf4u.mp4')]],
  ['moonboy.mp4',[resolve('media/moonboy.mp4'),resolve(homedir(),'Documents/kaspa/moonboy/NSMtGVwHggdf8hlU.mp4')]],
  ['kaspa-silver.mp4',[resolve('media/kaspa-silver.mp4'),resolve(homedir(),'Documents/kaspa/kaspasilver/YTDown.com_Shorts_What-is-Kaspa_Media_F5zOaCSz_OI_001_1080p.mp4')]],
  ['kaspa-content.mp4',[resolve('media/kaspa-content.mp4'),resolve(homedir(),'Documents/kaspa/content/j4laDA2EmjlHpQby.mp4')]],
];
for(const [name,sources] of films){
  let copied=false;
  for(const source of sources){
    try{await access(source);await copyFile(source,`${output}/media/${name}`);copied=true;break;}catch{}
  }
  if(!copied)console.warn(`Film not found: /media/${name}`);
}
for(const name of ['app.mjs','network-diagram.mjs','models.mjs','app.css','money-app.mjs','money-models.mjs','coordination.mjs','coordination.css','network-diagram.css','mechanism-diagrams.mjs','mechanism-diagrams.css','flow-diagrams.mjs','flow-diagrams.css','wallet-holdings.mjs','installed-wallets.mjs','doors.mjs','community.mjs','playground-testnet.mjs'])await copyFile(`src/${name}`,`${output}/assets/${name}`);
if(!standalone){
  await copyFile('docs/wrap-poc-roundtrip-verification.json',`${output}/assets/wrap-poc-roundtrip.json`);
  for(const name of ['wrap-ui.mjs','wrap-local-client.mjs','wrap.css','public-apps.mjs','public-apps.css','public-contracts.mjs','public-recovery.mjs','public-assets-ui.mjs','public-token.mjs','public-receipt.mjs','public-asset-signing.mjs','public-asset-recovery.mjs','public-acceptance.mjs','public-transaction.mjs','peglab-engine.mjs','peglab-ui.mjs','peglab.css'])await copyFile(`src/${name}`,`${output}/assets/${name}`);
  for(const name of ['v4-economy-story.mjs','v4-economy-protocol.mjs','v4-economy-model.mjs','v4-world-props.mjs','v4-activity-view.mjs','v4-mining-model.mjs','v4-mining-ui.mjs','public-argent-ui.mjs','public-argent-protocol.mjs','public-argent-templates.json','v4-game.mjs','v4-technical-map.mjs','v4-live-story.mjs','v4-legacy-services.mjs','v4-world-model.mjs','v4-world-3d.mjs','v4-showcase-page.mjs','v4-showcase.css','v4-game.css','public-v4-ui.mjs','public-v4-protocol.mjs','public-v4-extra.mjs','public-v4-composed.mjs','v4-dag-view.mjs','v4-dag-3d.mjs'])await copyFile(`src/${name}`,`${output}/assets/${name}`);
  const v4Sources={};for(const kind of ['agent','bundle','compute','launch','terrarium','vault'])v4Sources[`contracts/public/v4-${kind}.sil`]=await readFile(`contracts/public/v4-${kind}.sil`,'utf8');for(const name of ['capped-token','backed-receipt','application-escrow','shared-treasury','prediction-escrow','proof-payout'])v4Sources[`contracts/public/${name}.sil`]=await readFile(`contracts/public/${name}.sil`,'utf8');for(const name of ['warden','creature'])for(const ext of ['ag','sil']){const path=ext==='ag'?`contracts/public/argent-habitat/${name}.ag`:`contracts/public/argent-habitat/generated/${name[0].toUpperCase()+name.slice(1)}.sil`;v4Sources[path]=await readFile(path,'utf8');}await writeFile(`${output}/assets/v4-contract-source.json`,JSON.stringify(v4Sources));
  await cp('src/vendor/three',`${output}/assets/vendor/three`,{recursive:true});
  await mkdir(`${output}/assets/kaspa`,{recursive:true});
  for(const name of ['kaspa.js','kaspa_bg.wasm','LICENSE'])await copyFile(`.cache/upstream/kaspa-wasm32-sdk/web/kaspa/${name}`,`${output}/assets/kaspa/${name}`);
  await copyFile('.cache/public-templates/templates.json',`${output}/assets/public-templates.json`);
}
for(const name of ['favicon.svg','favicon.ico','favicon.png','og-kaspa-explained.png','carnot-local-brownian-global.pdf','the-instrument.pdf','LICENSE.md','THIRD_PARTY.md'])await copyFile(name,`${output}/${name}`);
await cp('licenses',`${output}/licenses`,{recursive:true});
const aliases=JSON.parse(await readFile('src/legacy-routes.json','utf8'));
if(!standalone)for(const name of ['testnet','contracts','split','experiment/index','experiment/board','experiment/discover','experiment/polls','experiment/tipjar','experiment/vault'])aliases[name]='/applications';
const resolveAlias=(url,visited=new Set())=>{const key=url.split('#')[0].replace(/^\//,'').replace(/\.html$/,'');if(visited.has(key))return '/search';visited.add(key);return aliases[key]?resolveAlias(aliases[key],visited):url;};
for(const [name,target] of Object.entries(aliases)){const url=resolveAlias(target);const targetFile=url.split('#')[0].slice(1)||'index';const targetPage=documents.find(page=>page.file===targetFile+'.html');const ids=targetPage?[...targetPage.body.matchAll(/(?:id|data-workspace)="([^"]+)"/g)].map(match=>match[1]):[];await mkdir(`${output}/${name.split('/').slice(0,-1).join('/')}`,{recursive:true});await writeFile(`${output}/${name}.html`,`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Page moved · Kaspa Explained</title><script>location.replace((${legacyDestination.toString()})(${JSON.stringify(url)},location.hash,${JSON.stringify(ids)}));</script><noscript><meta http-equiv="refresh" content="0;url=${escape(url)}"></noscript></head><body><a href="${escape(url)}">Continue to the explanation</a></body></html>`);}
await writeFile(`${output}/sitemap.xml`,`<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${documents.filter(p=>p.file!=='404.html').map(p=>`<url><loc>${site.domain}/${p.file==='index.html'?'':p.file.replace('.html','')}</loc></url>`).join('')}</urlset>`);
await writeFile(`${output}/robots.txt`,'User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: https://kaspaexplained.com/sitemap.xml\n');
await writeFile(`${output}/CNAME`,'kaspaexplained.com\n');
await writeFile(`${output}/.nojekyll`,'');
// Preserve the previous generated tree until the replacement has been installed.
const previous=output+'-previous';let moved=false;
try{await rename(destination,previous);moved=true;}catch(error){if(error.code!=='ENOENT')throw error;}
try{await rename(output,destination);}catch(error){if(moved)await rename(previous,destination);throw error;}
console.log(`Built ${documents.length} pages and ${Object.keys(aliases).length} compatibility routes in ${destination}/.`);
