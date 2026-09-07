import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {readFile,mkdir} from 'node:fs/promises';
import {wrapPage} from '../src/wrap-page.mjs';
import {recordedWrapEvidence} from '../src/wrap-ui.mjs';
const fixture=JSON.parse(await readFile('docs/wrap-poc-roundtrip-verification.json','utf8'));
assert.equal(recordedWrapEvidence(fixture).readOnly,true);
for(const mutate of [f=>f.kaspa.burn.acceptingBlock=null,f=>f.source.balances.vault='1',f=>f.source.releaseIntent.burnId='wrong']){const bad=structuredClone(fixture);mutate(bad);assert.throws(()=>recordedWrapEvidence(bad),/incomplete/);}
const browser=await chromium.launch();
await mkdir('.cache/visual-review/wrap-recorded',{recursive:true});
try{for(const width of [1440,390]){
 const page=await browser.newPage({viewport:{width,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',async route=>{const url=new URL(route.request().url());
  if(url.pathname==='/wrap')return route.fulfill({contentType:'text/html',body:`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/assets/app.css"></head><body>${wrapPage.body}<script type="module">import {mountWrapApp} from '/assets/wrap-ui.mjs';window.statusCalls=0;window.actionCalls=0;mountWrapApp(document.querySelector('[data-wrap-app]'),{snapshot:()=>({}),externalStatus:async()=>{statusCalls++;throw Error('No local service');},externalAction:async()=>{actionCalls++;}});</script></body></html>`});
  if(url.pathname==='/assets/wrap-poc-roundtrip.json')return route.fulfill({contentType:'application/json',body:JSON.stringify(fixture)});
  if(['/assets/wrap-ui.mjs','/assets/wrap.css','/assets/app.css'].includes(url.pathname))return route.fulfill({path:'src/'+url.pathname.split('/').at(-1),contentType:url.pathname.endsWith('.css')?'text/css':'text/javascript'});
  return route.abort();
 });
 await page.goto('https://wrap.example/wrap?experiment=bridge');
 await page.getByText(/Verified recorded example/).waitFor();
 assert.equal(await page.locator('[data-wrap-external-action]').count(),0);
 assert.equal(await page.locator('[data-wrap-external-check]').count(),0);
 assert.deepEqual(await page.evaluate(()=>[statusCalls,actionCalls]),[0,0]);
 assert.match(await page.locator('[data-wrap-external-state]').textContent(),/not your wallets or current balances/);
 assert.equal(await page.locator('[data-wrap-heading]').textContent(),'A test asset crossed chains');
 await page.locator('[data-wrap-activity]').click();
 assert(await page.locator('.wrap-kaspa-claims details').getAttribute('open')!==null);
 assert.equal(await page.locator('.wrap-kaspa-claims a[target="_blank"]').count(),4);
 assert.equal(await page.locator('.wrap-external-evidence a[target="_blank"]').count(),7);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
 assert.deepEqual(errors,[]);
 await page.screenshot({path:'.cache/visual-review/wrap-recorded/'+width+'.png',fullPage:true});
 await page.close();
}
// Local interactive sessions still request the actual bridge service first.
const page=await browser.newPage();await page.route('**/*',async route=>{const u=new URL(route.request().url());if(u.pathname==='/wrap')return route.fulfill({contentType:'text/html',body:`${wrapPage.body}<script type="module">import {mountWrapApp} from '/assets/wrap-ui.mjs';window.calls=0;mountWrapApp(document.querySelector('[data-wrap-app]'),{snapshot:()=>({}),externalStatus:async()=>{calls++;return {stage:'empty',message:'Live local service',actions:[{id:'setup',label:'Prepare test funds'}]};},externalAction:async()=>{}});</script>`});if(u.pathname==='/assets/wrap-ui.mjs')return route.fulfill({path:'src/wrap-ui.mjs',contentType:'text/javascript'});return route.abort();});await page.goto('http://127.0.0.1/wrap?experiment=bridge');await page.locator('[data-wrap-external-action="setup"]').waitFor();assert.equal(await page.evaluate(()=>calls),1);assert.equal(await page.getByText(/Verified recorded example/).count(),0);await page.close();
console.log('Recorded bridge: desktop/mobile evidence, source/Kaspa links, no public service calls or send actions; local interaction preserved.');
}finally{await browser.close();}
