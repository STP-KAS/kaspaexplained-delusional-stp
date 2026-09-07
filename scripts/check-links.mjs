import {readFile,writeFile,mkdir} from 'node:fs/promises';
process.env.KASPA_RELEASE||='v1';
const {documents,standalone}=await import('../src/page-registry.mjs');
const urls=new Set();
for(const page of documents){const html=await readFile(`${standalone?'dist-v1':'dist'}/${page.file}`,'utf8');for(const match of html.matchAll(/href="(https?:\/\/[^"#]+)(?:#[^"]*)?"/g)){const url=match[1].replaceAll('&amp;','&');if(!url.startsWith('https://kaspaexplained.com'))urls.add(url);}}
const queue=[...urls],results=[];
await Promise.all(Array.from({length:4},async()=>{while(queue.length){const url=queue.shift();try{const response=await fetch(url,{signal:AbortSignal.timeout(20000),headers:{'User-Agent':'Kaspa-Explained-source-check'}});await response.body?.cancel();results.push({url,status:response.status,verified:response.ok});}catch(error){results.push({url,status:null,verified:false,error:error.name});}}}));
await mkdir('.cache/source-review',{recursive:true});await writeFile('.cache/source-review/links.json',JSON.stringify({checked:new Date().toISOString(),results},null,2));
const incomplete=results.filter(r=>!r.verified);console.log(JSON.stringify({checked:results.length,incomplete},null,2));if(incomplete.length)process.exitCode=1;
