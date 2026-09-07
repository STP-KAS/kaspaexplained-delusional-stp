import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {staticPreview} from './static-preview.mjs';

process.env.KASPA_RELEASE||='v1';
const {documents,standalone}=await import('../src/page-registry.mjs');
const liveOrigin=process.env.PUBLIC_QA_ORIGIN?.replace(/\/$/,'');
const directory=standalone?'dist-v1':'dist',output=resolve('.cache/visual-review',liveOrigin?'live-'+directory:directory);
await mkdir(output,{recursive:true});
const server=liveOrigin?null:staticPreview(directory);if(server)await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base=liveOrigin||`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch();const failures=[],report=[];
try{
  for(const width of [320,390,768,1024,1440])for(const theme of ['light','dark']){
    const context=await browser.newContext({viewport:{width,height:900},colorScheme:theme,reducedMotion:'reduce'});
    for(const document of documents){
      const page=await context.newPage();const errors=[];
      page.on('pageerror',error=>errors.push(error.message));
      const response=await page.goto(`${base}/${document.file}?theme=${theme}`,{waitUntil:'networkidle'});
      const measurements=await page.evaluate(()=>{
        const visible=el=>el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden';
        const overflow=[...document.querySelectorAll('main *')].filter(el=>visible(el)&&!el.closest('.table-scroll,pre,svg')).filter(el=>{const r=el.getBoundingClientRect();return r.left< -1||r.right>innerWidth+1;}).map(el=>el.tagName+'.'+el.className).slice(0,8);
        const targets=[...document.querySelectorAll('button,input,select,summary')].filter(visible).filter(el=>{
          // A containing label is an actual activation target for a checkbox/radio,
          // not merely nearby text. Keep measuring other controls themselves.
          const label=el.matches('input[type=checkbox],input[type=radio]')?[...el.labels].find(node=>node.contains(el)&&visible(node)&&getComputedStyle(node).pointerEvents!=='none'):null;
          const r=(label||el).getBoundingClientRect();return r.height<43||r.width<43;
        }).map(el=>`${el.tagName} ${el.getAttribute('aria-label')||el.textContent.trim().slice(0,45)}`);
        return {overflow,targets,documentOverflow:document.documentElement.scrollWidth-innerWidth};
      });
      const label=`${document.file} ${width} ${theme}`;
      if(response.status()!==200||errors.length||measurements.documentOverflow>1||measurements.overflow.length||measurements.targets.length)failures.push({label,http:response.status(),errors,...measurements});
      await page.screenshot({path:`${output}/${document.file.replace('.html','')}-${width}-${theme}.png`,fullPage:true});
      report.push({label,...measurements});await page.close();
    }
    await context.close();
  }
}finally{await browser.close();if(server)await new Promise(r=>server.close(r));}
await writeFile(`${output}/report.json`,JSON.stringify({checked:new Date().toISOString(),release:directory,origin:base,scope:liveOrigin?'Published HTML, JavaScript and CSS from the live site':'Local generated build',states:report.length,failures,report},null,2));
if(failures.length){console.error(JSON.stringify(failures,null,2));process.exitCode=1;}
console.log(`Rendered ${report.length} page/viewport/theme states. ${failures.length} automated findings. Images require human review: ${output}`);
