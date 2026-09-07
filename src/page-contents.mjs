import {escape} from './components.mjs';
const labels={'parallel-blocks':'Parallel blocks',conflicts:'Conflicting payments',confirmation:'Confirmation',amounts:'Payment and change',wallets:'Wallets','using-kas':'Sending and receiving',inspect:'Read a transaction',problems:'Troubleshooting',alternatives:'Other networks',tradeoffs:'Tradeoffs',security:'Security',supply:'KAS supply',costs:'Mining costs','spending-rules':'Spending rules',tools:'Builder tools',readiness:'What is available',toccata:'Toccata',start:'Where to start',research:'Research',conventions:'Evidence labels',sources:'Sources',method:'How we check'};

export function withContents(page){
  if(!page.body.includes('class="page-intro'))return page.body;
  const sections=[...page.body.matchAll(/<section class="chapter" id="([^"]+)"><div class="section-title"><h2>(.*?)<\/h2>/gs)];
  if(sections.length<2)return page.body;
  const items=sections.map(([,id,title])=>({id,title:labels[id]||title.replace(/<br\s*\/?>/g,' ').replace(/<[^>]+>/g,'')}));
  const nav=`<nav class="page-contents" aria-label="On this page"><span>On this page</span>${items.map(({id,title})=>`<a href="#${escape(id)}">${title}</a>`).join('')}</nav>`;
  return page.body.replace(/(<div class="page-intro[^\"]*">[\s\S]*?<\/div>)/,`$1${nav}`);
}
