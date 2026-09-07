// Unfunded browser acceptance against the actual static build and a real Testnet-10 node.
// No faucet, signing or submission controls are used; recovery remains in memory.
import {chromium,firefox,webkit} from 'playwright';
import assert from 'node:assert/strict';
import {readFile,access,mkdir,writeFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {staticPreview} from './static-preview.mjs';

const engine=process.argv[2]||'chromium',browserType={chromium,firefox,webkit}[engine];
assert(browserType,'Choose chromium, firefox, or webkit');
const liveOrigin=process.env.PUBLIC_QA_ORIGIN?.replace(/\/$/,'');
if(liveOrigin)assert(/^https:\/\/[^/]+$/.test(liveOrigin),'PUBLIC_QA_ORIGIN must be an HTTPS origin');
const artifact=async path=>{if(!liveOrigin)return readFile('dist/'+path,'utf8');const response=await fetch(liveOrigin+'/'+path.replace(/\.html$/,''),{signal:AbortSignal.timeout(20000)});assert(response.ok,`Live artifact ${path}: HTTP ${response.status}`);return response.text();};
const canonical=['index','what-is-kaspa','why-kaspa-matters','skeptical-case','kaspa-mining','build-on-kaspa','status','kaspa-origin-story','kips','moose','sources','playground','404','money','applications','covenants','wrap','search'];
for(const name of canonical){if(liveOrigin){const route=name==='index'?'':name==='404'?'__public-qa-missing-route__':name;const response=await fetch(liveOrigin+'/'+route,{signal:AbortSignal.timeout(20000)});assert.equal(response.status,name==='404'?404:200,'Live route '+route);}else await access(`dist/${name}.html`);}
const sitemap=await artifact('sitemap.xml');
assert.deepEqual([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]).sort(),canonical.filter(name=>name!=='404').map(name=>'https://kaspaexplained.com/'+(name==='index'?'':name)).sort(),'Sitemap lists every canonical public route and excludes the error page');
const templates=JSON.parse(await artifact('assets/public-templates.json'));
assert.deepEqual(Object.keys(templates.templates).sort(),['agent','bundle','compute','escrow','launch','prediction','proof','receipt','terrarium','token','treasury','vault']);
const output=`.cache/visual-review/${liveOrigin?'live-public-browser':'public-browser'}/${engine}`;await mkdir(output,{recursive:true});
const results=[],server=liveOrigin?null:staticPreview('dist');let browser,failure;
if(server)await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base=liveOrigin||`http://127.0.0.1:${server.address().port}`;
try{
 browser=await browserType.launch();
 for(const theme of ['light','dark']){
  const context=await browser.newContext({acceptDownloads:true,reducedMotion:'reduce',viewport:{width:390,height:900}});
  try{
   let page;const errors=[],apiCalls=[],loaded=new Set();
   await context.route('**/api/**',route=>{apiCalls.push(new URL(route.request().url()).pathname);return route.abort();});
   async function newTab(){
    const previous=page;page=await context.newPage();page.setDefaultTimeout(45000);
    page.on('pageerror',error=>errors.push(error.message));
    page.on('response',response=>{if(response.ok())loaded.add(new URL(response.url()).pathname);});
    await page.goto(`${base}/applications?theme=${theme}`);
    if(previous)await previous.close();
   }
   const q=name=>page.locator(`[data-public-${name}]`);
   const idle=()=>page.waitForFunction(()=>!document.querySelector('[data-public-apps]').hasAttribute('aria-busy'));
   const success=async label=>{await idle();assert.notEqual(await q('message').getAttribute('data-error'),'true',`${label}: ${await q('message').textContent()} (real node required; no offline stub)`);};
   async function walletDetails(open=true){const details=page.locator('.public-wallet-details');if(await details.evaluate(el=>el.open)!==open)await details.locator('summary').click();}
   async function restoreForm(){await page.locator('[data-public-start] summary').focus();await page.keyboard.press('Enter');}
   const capture=async state=>{
    for(const width of [320,390,768,1440]){
     await page.setViewportSize({width,height:900});
     await page.evaluate(()=>{document.activeElement?.blur();scrollTo(0,0);});
     const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
     assert(overflow<=1,`${theme}/${state}/${width}: horizontal overflow ${overflow}`);
     assert.deepEqual(errors,[],`${state}: browser exceptions`);assert.deepEqual(apiCalls,[],`${state}: unexpected private API or faucet request`);
     results.push({theme,state,width,overflow});
     await page.screenshot({path:`${output}/${theme}-${state}-${width}.png`,fullPage:true});
    }
   };
   await newTab();await capture('initial');
   await restoreForm();await q('import').click();await idle();
   assert.equal(await q('message').getAttribute('data-error'),'true','Missing recovery must fail');
   assert.equal(await q('wallet').isVisible(),false);await capture('missing-file');
   await q('create').focus();await page.keyboard.press('Enter');await success('Create wallet');
   assert(await q('wallet').isVisible(),'Wallet creation must succeed against real RPC');
   for(const path of ['/assets/kaspa/kaspa.js','/assets/kaspa/kaspa_bg.wasm','/assets/public-templates.json'])assert(loaded.has(path),`SDK/template resource was not loaded: ${path}`);
   assert(await q('faucet').isVisible(),'Guided wallet must expose its next action');
   assert.equal(await page.locator('.public-wallet-details').evaluate(el=>el.open),false,'Optional configuration starts closed');
   assert.equal((await q('balance').innerText()).trim(),'0 tKAS');
   await capture('created-unfunded');
   await walletDetails();const addresses=[];
   for(const account of ['0','1','2']){
    await q('account-select').selectOption(account);await success('Account node refresh');
    assert.equal((await q('balance').innerText()).trim(),'0 tKAS','Fresh disposable account must be unfunded');
    addresses.push(await q('address').inputValue());
   }
   assert.equal(new Set(addresses).size,3);assert(addresses.every(address=>address.startsWith('kaspatest:')));
   // Real reload: preserve the app-created session envelope and secret, without injecting state.
   await page.reload();await q('wallet').waitFor({state:'visible'});await success('Automatic session restore');
   assert.equal(await q('address').inputValue(),addresses[0]);assert.equal(await q('start').isVisible(),false);
   assert.equal((await q('balance').innerText()).trim(),'0 tKAS');await capture('auto-restored');
   await walletDetails();
   for(const [index,address] of addresses.entries()){
    await q('account-select').selectOption(String(index));await success('Auto-restored account refresh');
    assert.equal(await q('address').inputValue(),address,'Automatic reload must preserve every role');
   }
   const password=`Unfunded browser check ${randomUUID()}`;
   await q('show-backup').click();await q('backup-password').fill(password);
   const waiting=page.waitForEvent('download');await q('export').click();const download=await waiting;await success('Optional encrypted export');
   const stream=await download.createReadStream(),chunks=[];for await(const chunk of stream)chunks.push(chunk);
   const encrypted=Buffer.concat(chunks),envelope=JSON.parse(encrypted.toString());
   assert.equal(envelope.kdf,'PBKDF2-SHA256');assert.equal(envelope.iterations,250000);
   assert.equal(envelope.network,'testnet-10');assert(envelope.ciphertext.length>50);
   assert.deepEqual(Object.keys(envelope).sort(),['ciphertext','iterations','iv','kdf','network','salt','version']);
   await download.delete();
   // A separate tab has no opener and no disposable session, so the file path is exercised.
   await newTab();assert(await q('start').isVisible());assert.equal(await q('wallet').isVisible(),false);
   await restoreForm();await q('import-file').setInputFiles({name:'unfunded-recovery.json',mimeType:'application/json',buffer:encrypted});
   await q('import-password').fill('An incorrect password');await q('import').click();await idle();
   assert.equal(await q('message').getAttribute('data-error'),'true','Wrong password must fail');
   assert.equal(await q('wallet').isVisible(),false);await capture('wrong-password');
   await q('import-password').fill(password);await q('import').click();await success('File restore');
   assert(await q('wallet').isVisible());await walletDetails();
   for(const [index,address] of addresses.entries()){
    await q('account-select').selectOption(String(index));await success('File-restored account refresh');
    assert.equal(await q('address').inputValue(),address,'File restore must recover every original role');
    assert.equal((await q('balance').innerText()).trim(),'0 tKAS');
   }
   await walletDetails(false);await capture('restored-file');
   // Legacy local recovery compatibility: use the actual app-exported encrypted envelope.
   // Fresh disposable sessions intentionally use sessionStorage, not this older storage slot.
   await page.evaluate(value=>localStorage.setItem('kaspa-public-encrypted-recovery-v1',value),encrypted.toString());
   await newTab();await restoreForm();await q('import-password').fill(password);
   await q('import-local').click();await success('Legacy browser recovery restore');
   assert(await q('wallet').isVisible());assert.equal(await q('address').inputValue(),addresses[0]);
   assert.equal((await q('balance').innerText()).trim(),'0 tKAS');await capture('restored-legacy-local');
   assert.deepEqual(apiCalls,[]);assert.deepEqual(errors,[]);
  }finally{await context.close();} // Closing the isolated context terminates its RPC sockets and discards keys/storage.
 }
}catch(error){failure=error;}
finally{
 if(browser)await browser.close();if(server){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
 await writeFile(`${output}/report.json`,JSON.stringify({engine,origin:base,scope:liveOrigin?'Deployed public site, real Testnet RPC, no funding or submissions':'Local static build, real Testnet RPC, no funding or submissions',passed:!failure,states:results.length,results,error:failure?.message},null,2));
}
if(failure)throw failure;
console.log(`Public browser ${engine}: ${results.length} states passed against ${base}; real Testnet-10 RPC, no funding or submission. Evidence: ${output}/report.json`);
