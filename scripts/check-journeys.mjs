import {chromium,firefox,webkit} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {staticPreview} from './static-preview.mjs';
const server=staticPreview('dist-v1');await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
const results=[];
try{
 for(const [engine,type] of Object.entries({chromium,firefox,webkit})){
  let browser;try{browser=await type.launch();}catch(error){results.push({engine,unavailable:error.message.split('\n')[0]});continue;}
  try{for(const width of [390,768,1440]){
   const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'}),page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(base+'/');
   await page.locator('[data-lab=network] .walkthrough-explore').click();
   await page.locator('[data-delay-preset="100"]').click();assert.match(await page.locator('[data-network-decision]').textContent(),/C references B/);
   await page.locator('[data-network-view="messages"]').click();assert(await page.locator('[data-message-view]').isVisible());
   await page.locator('[data-network-reset]').click();assert(await page.locator('[data-dag-result]').isVisible());assert.equal(await page.locator('[data-network-view="connections"]').getAttribute('aria-pressed'),'true');
   await page.locator('[data-theme-toggle]').click();assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');await page.reload();assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
   if(await page.locator('[data-menu]').isVisible()){await page.locator('[data-menu]').click();assert.equal(await page.locator('[data-menu]').getAttribute('aria-expanded'),'true');await page.keyboard.press('Escape');assert.equal(await page.locator('[data-menu]').getAttribute('aria-expanded'),'false');assert(await page.locator('[data-menu]').evaluate(e=>e===document.activeElement));}
   await page.goto(base+'/why-kaspa-matters#using-kas');await page.locator('[data-lesson-panel="0"] [data-lesson-next]').click();assert(await page.locator('[data-lesson-panel="1"]').isVisible());assert(await page.locator('[data-lesson-step="1"]').evaluate(e=>e===document.activeElement));await page.keyboard.press('End');assert(await page.locator('[data-lesson-panel="2"]').isVisible());await page.keyboard.press('Home');assert(await page.locator('[data-lesson-panel="0"]').isVisible());
   await page.goto(base+'/playground#spend');assert(await page.locator('[data-workspace-panel="spend"]').isVisible());await page.locator('[data-lab=spend] .walkthrough-explore').click();await page.locator('[data-first="bob"]').click();assert.equal(await page.locator('[data-attempt="bob"]').getAttribute('data-valid'),'true');assert.equal(await page.locator('[data-attempt="alice"]').getAttribute('data-valid'),'false');
   await page.locator('[data-workspace="mining"]').click();await page.locator('[data-lab=mining] .walkthrough-explore').click();const first=await page.locator('[data-mining-found]').textContent();await page.locator('[data-mining-sample]').click();await page.locator('[data-mining-reset]').click();assert.equal(await page.locator('[data-mining-found]').textContent(),first);
   await page.locator('[data-workspace="vault"]').click();await page.locator('[data-lab=vault] .walkthrough-explore').click();await page.locator('[data-vault-action]').selectOption({index:1});assert.match(await page.locator('[data-vault-answer]').textContent(),/nothing|fails/);
   await page.goto(base+'/money#prediction');await page.locator('[data-money] .walkthrough-explore').click();assert(await page.locator('[data-money-panel="outcome"]').isVisible());await page.locator('[data-outcome]').selectOption('yes');assert.equal(await page.locator('[data-yes]').textContent(),'$100.00');assert.equal(await page.locator('[data-no]').textContent(),'$0.00');await page.locator('[data-money-view="collateral"]').click();await page.goBack();assert(await page.locator('[data-money-panel="outcome"]').isVisible());assert.equal(await page.locator('[data-yes]').textContent(),'$100.00');
   await page.goto(base+'/search');await page.locator('[data-search]').fill('prediction');assert(await page.locator('[data-search-item][href="/money#prediction"]').isVisible());await page.locator('[data-search-item][href="/money#prediction"]').click();await page.locator('[data-money-panel="outcome"]').waitFor({state:'visible'});assert(await page.locator('[data-money-panel="outcome"]').isVisible());
   await page.goto(base+'/build-on-kaspa#coordination');
   const coordination=page.locator('[data-coordination]');await coordination.waitFor({state:'visible'});await coordination.locator('.walkthrough-explore').click();
   assert.match(await coordination.locator('[data-coordination-summary]').textContent(),/No group/);
   const ben=coordination.getByRole('checkbox',{name:'Ben: authorize conditional move'}),cleo=coordination.getByRole('checkbox',{name:'Cleo: authorize conditional move'});
   await ben.focus();await page.keyboard.press('Space');assert(await ben.isChecked());await cleo.check();
   assert.match(await coordination.locator('[data-coordination-summary]').textContent(),/Ana, Ben, Cleo can move 90 credits/);
   await coordination.getByRole('button',{name:'Preview the group'}).click();await ben.uncheck();
   await coordination.getByRole('button',{name:'Execute together'}).click();assert.match(await coordination.getByRole('status').textContent(),/Nothing moved/);
   await ben.check();await coordination.getByRole('button',{name:'Preview the group'}).click();await coordination.getByRole('button',{name:'Spend 25 of'}).click();
   await coordination.getByRole('button',{name:'Execute together'}).click();assert.match(await coordination.getByRole('status').textContent(),/Conditions changed.*Nothing moved/);
   assert.match(await coordination.locator('fieldset').first().textContent(),/Available now: 25 credits/);
   await coordination.getByRole('button',{name:'Reset',exact:true}).click();await ben.check();await cleo.check();
   await coordination.getByRole('button',{name:'Preview the group'}).click();await coordination.getByRole('button',{name:'Execute together'}).click();
   assert.match(await coordination.getByRole('status').textContent(),/moved 90 credits together/);
   assert.match(await coordination.locator('fieldset').first().textContent(),/Available now: 10 credits/);
   assert.match(await coordination.locator('fieldset').last().textContent(),/Available now: 20 credits/);
   assert(await coordination.getByRole('button',{name:'Execute together'}).isDisabled());
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Coordination page horizontal overflow');
   await mkdir('.cache/visual-review',{recursive:true});await page.screenshot({path:`.cache/visual-review/coordination-${engine}-${width}.png`,fullPage:true});
   await page.goto(base+'/ghostdag-explained#confirmation');await page.waitForURL('**/what-is-kaspa#confirmation');assert(await page.locator('#confirmation').isVisible());
   assert.deepEqual(errors,[]);results.push({engine,width,passed:true});await context.close();
  }}finally{await browser.close();}
 }
 const browser=await chromium.launch(),page=await browser.newPage({viewport:{width:1280,height:900}});
 try{await page.goto(base+'/');await page.waitForFunction(()=>document.querySelector('[data-time]').value==='1200');assert.equal(await page.locator('[data-network-replay]').textContent(),'Watch it happen');await page.waitForTimeout(900);assert.equal(await page.locator('[data-time]').inputValue(),'1200');results.push({engine:'chromium',autoplay:'completed once and stopped'});
  // Reproduce the fractional boundary exactly: range inputs round to their step.
  const boundary=await browser.newPage({viewport:{width:1280,height:900}});
  await boundary.addInitScript(()=>{let id=0;const frames=new Map();Object.defineProperty(performance,'now',{value:()=>0});window.requestAnimationFrame=callback=>{frames.set(++id,callback);return id;};window.cancelAnimationFrame=key=>frames.delete(key);window.runTestFrame=now=>{const pending=[...frames.values()];frames.clear();for(const callback of pending)callback(now);};});
  await boundary.goto(base+'/');await boundary.waitForFunction(()=>document.querySelector('[data-network-replay]')?.textContent==='Pause',null,{polling:20});
  await boundary.evaluate(()=>window.runTestFrame(5997.5));assert.equal(await boundary.locator('[data-time]').inputValue(),'1199');assert.equal(await boundary.locator('[data-network-replay]').textContent(),'Pause');
  await boundary.evaluate(()=>window.runTestFrame(6060));assert.equal(await boundary.locator('[data-time]').inputValue(),'1200');assert.equal(await boundary.locator('[data-network-replay]').textContent(),'Watch it happen');
  results.push({engine:'chromium',autoplay:'fractional end boundary stays in progress until completion'});
 }finally{await browser.close();}
}finally{await new Promise(r=>server.close(r));await mkdir('.cache/visual-review',{recursive:true});await writeFile('.cache/visual-review/journeys.json',JSON.stringify({checked:new Date().toISOString(),results},null,2));}
console.log(JSON.stringify(results,null,2));if(results.some(r=>r.unavailable))process.exitCode=1;
