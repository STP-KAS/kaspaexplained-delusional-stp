import {test} from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFile,readdir,writeFile,access} from 'node:fs/promises';

test('V1 is a fresh static artifact without local-wallet interfaces or stale files',async()=>{
  const build=()=>execFileSync(process.execPath,['scripts/build.mjs'],{env:{...process.env,KASPA_RELEASE:'v1'},stdio:'pipe'});
  build();
  await writeFile('dist-v1/stale-test-fixture.txt','This generated fixture must not survive a rebuild.');
  build();
  await assert.rejects(access('dist-v1/stale-test-fixture.txt'));
  for(const path of ['testnet.html','contracts.html','split.html','applications.html','server','assets/testnet-app.mjs','assets/contracts-app.mjs','assets/public-apps.mjs','assets/public-contracts.mjs','assets/public-templates.json','assets/kaspa'])await assert.rejects(access('dist-v1/'+path));
  assert.equal(await readFile('dist-v1/CNAME','utf8'),'kaspaexplained.com\n');
  await access('dist-v1/.nojekyll');
  for(const file of await readdir('dist-v1')){
    if(!file.endsWith('.html'))continue;
    const html=await readFile('dist-v1/'+file,'utf8');
    assert.doesNotMatch(html,/data-(?:testnet|contract-kind|lookup-form|public-apps)|href="\/(?:testnet|contracts|split|applications)(?:["#?])/ ,file);
  }
  const home=await readFile('dist-v1/index.html','utf8');
  assert.match(home,/Block C\. Miner 2 · 400 ms\. References A/);
  assert.match(home,/data-network-announcement aria-live="polite"/);
});
