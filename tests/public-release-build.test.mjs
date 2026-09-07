import {test} from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFile,readdir,access} from 'node:fs/promises';

test('public V2 includes education and browser applications without local signer assets',async()=>{
 execFileSync(process.execPath,['scripts/build.mjs'],{env:{...process.env,KASPA_RELEASE:'v2'},stdio:'pipe'});
 const app=await readFile('dist/applications.html','utf8');assert.match(app,/data-public-apps/);
 for(const kind of ['escrow','treasury','prediction','proof'])assert.match(app,new RegExp(`data-public-kind="${kind}"`));
 for(const kind of ['token','receipt'])assert.match(app,new RegExp(`data-public-asset-kind="${kind}"`));
 assert.match(app,/data-public-send/);
 for(const file of ['index.html','what-is-kaspa.html','money.html','build-on-kaspa.html','search.html'])await access('dist/'+file);
 for(const path of ['server','api','assets/testnet-app.mjs','assets/contracts-app.mjs','assets/recovery-app.mjs','assets/refundable-transfer.sil','assets/payment-split.sil'])await assert.rejects(access('dist/'+path),path);
 for(const name of ['testnet','contracts','split','experiment/index','experiment/board','experiment/discover','experiment/polls','experiment/tipjar','experiment/vault']){
  const redirect=await readFile(`dist/${name}.html`,'utf8');assert.match(redirect,/\/applications/);assert.doesNotMatch(redirect,/data-(?:testnet|contract-kind|lookup-form)/);
 }
 const search=await readFile('dist/search.html','utf8');assert.match(search,/href="\/applications"/);assert.doesNotMatch(search,/data-search-item[^>]*href="\/(?:testnet|contracts|split)"|href="\/(?:testnet|contracts|split)"[^>]*data-search-item/);
 const sitemap=await readFile('dist/sitemap.xml','utf8');assert.match(sitemap,/<loc>https:\/\/kaspaexplained.com\/applications<\/loc>/);assert.doesNotMatch(sitemap,/<loc>[^<]*\/(?:testnet|contracts|split)<\/loc>/);
 for(const file of await readdir('dist/assets')){
  if(!file.endsWith('.mjs'))continue;
  const js=await readFile('dist/assets/'+file,'utf8');
  if(file==='wrap-local-client.mjs'){
   assert.deepEqual([...js.matchAll(/['"`](\/api\/[^'"`]+)['"`]/g)].map(m=>m[1]).sort(),['/api/wrap-poc/action','/api/wrap-poc/status']);
  }else assert.doesNotMatch(js,/['"`]\/api\//,file);
 }
 for(const file of ['public-apps.mjs','wrap-local-client.mjs','public-assets-ui.mjs','public-token.mjs','public-receipt.mjs','public-asset-signing.mjs','public-asset-recovery.mjs','public-contracts.mjs','public-templates.json','kaspa/kaspa.js','kaspa/kaspa_bg.wasm'])await access('dist/assets/'+file);
});

// Exercise the narrowly allowed local client, rather than trusting its caller's UI guard.
test('local bridge client never requests an API from public origins',async()=>{
 const {createLocalWrapClient}=await import('../src/wrap-local-client.mjs');
 let requests=0;const fetch=async()=>{requests++;throw Error('Unexpected request');};
 for(const hostname of ['kaspaexplained.com','www.kaspaexplained.com','localhost.example.com','127.0.0.1.example.com','192.168.1.2','']){
  const client=createLocalWrapClient({location:{protocol:'https:',hostname},fetch});
  await assert.rejects(client.externalStatus(),/loopback/);
  await assert.rejects(client.externalAction('mint'),/loopback/);
 }
 await assert.rejects(createLocalWrapClient({location:{protocol:'file:',hostname:'localhost'},fetch}).externalStatus(),/loopback/);
 assert.equal(requests,0);
});
test('loopback bridge client preserves the capability header and checks origin on every action',async()=>{
 const {createLocalWrapClient}=await import('../src/wrap-local-client.mjs');
 for(const hostname of ['localhost','127.0.0.1','[::1]','::1']){
  const location={protocol:'http:',hostname},calls=[],client=createLocalWrapClient({location,fetch:async(path,options)=>{calls.push({path,options});return {ok:true,json:async()=>path.endsWith('/status')?{capability:'test-capability',stage:'ready'}:{stage:'minted'}};}});
  assert.deepEqual(await client.externalAction('mint'),{stage:'minted'});
  assert.deepEqual(calls.map(c=>c.path),['/api/wrap-poc/status','/api/wrap-poc/action']);
  assert.equal(calls[1].options.method,'POST');assert.equal(calls[1].options.headers['x-wrap-capability'],'test-capability');assert.deepEqual(JSON.parse(calls[1].options.body),{action:'mint'});
  location.hostname='kaspaexplained.com';await assert.rejects(client.externalAction('burn'),/loopback/);assert.equal(calls.length,2);
 }
});
