// Explicit read-only recovery check. Never creates a wallet, requests coins or signs.
import {chromium} from 'playwright';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash,webcrypto} from 'node:crypto';
import assert from 'node:assert/strict';
const directory=process.env.V4_RECOVERY_DIR,origin=(process.env.V4_QA_ORIGIN||'https://kaspaexplained.com').replace(/\/$/,'');
if(!directory)throw Error('Set V4_RECOVERY_DIR to an existing recovery directory (session.json, or keys.json and latest.json). This check sends nothing.');
let envelope,secret;
try{const stored=JSON.parse(await readFile(directory+'/session.json','utf8'));envelope=JSON.parse(stored['kaspa-disposable-session-v1']);secret=stored['kaspa-disposable-secret-v1'];}catch(error){if(error.code!=='ENOENT')throw error;const keys=JSON.parse(await readFile(directory+'/keys.json','utf8'));secret=createHash('sha256').update(keys.keys[0]+'v4-guided-qa').digest('hex');envelope=JSON.parse(await readFile(directory+'/latest.json','utf8'));}
const decode=s=>Buffer.from(s,'base64'),key=await webcrypto.subtle.importKey('raw',Buffer.from(secret),'PBKDF2',false,['deriveKey']),derived=await webcrypto.subtle.deriveKey({name:'PBKDF2',salt:decode(envelope.salt),iterations:250000,hash:'SHA-256'},key,{name:'AES-GCM',length:256},false,['decrypt']);
const wallet=JSON.parse(Buffer.from(await webcrypto.subtle.decrypt({name:'AES-GCM',iv:decode(envelope.iv)},derived,decode(envelope.ciphertext))).toString()),expected=wallet.session.v4?.activity||[];
assert(expected.length,'Saved wallet needs V4 history');
const browser=await chromium.launch(),context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));const shots='.cache/visual-review/v4-recovery';await mkdir(shots,{recursive:true});
await context.route('**/api/**',r=>{errors.push('Unexpected HTTP API request');return r.abort();});
await context.route('**/assets/kaspa/kaspa.js',r=>r.fulfill({contentType:'text/javascript',body:`import * as real from '/assets/kaspa/recovery-real.js';export * from '/assets/kaspa/recovery-real.js';export {default} from '/assets/kaspa/recovery-real.js';window.recoveryMutationAttempts=0;export function createInputSignature(){window.recoveryMutationAttempts++;throw Error('Signing forbidden during recovery verification');}export class RpcClient extends real.RpcClient{async submitTransaction(){window.recoveryMutationAttempts++;throw Error('Submission forbidden during recovery verification');}}`}));
await context.route('**/assets/kaspa/recovery-real.js',async r=>r.fulfill({response:await r.fetch({url:origin+'/assets/kaspa/kaspa.js'})}));
const idle=()=>page.waitForFunction(()=>!document.querySelector('[data-public-apps]')?.hasAttribute('aria-busy'),null,{timeout:90000});
try{
 await page.goto(origin+'/covenants');await page.locator('[data-v4-wallet-menu]').click();await page.getByText('Restore a recovery file',{exact:true}).click();await page.locator('[data-public-import-file]').setInputFiles({name:'existing-recovery.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(envelope))});await page.locator('[data-public-import-password]').fill(secret);await page.locator('[data-public-import]').click();await idle();
 assert.notEqual(await page.locator('[data-public-message]').getAttribute('data-error'),'true',await page.locator('[data-public-message]').textContent());assert.equal(await page.locator('[data-public-address]').inputValue(),wallet.walletAddress);
 await page.locator('[data-v4-close-wallet]').click();await page.locator('[data-game-menu] > summary').click();await page.locator('[data-game-activity]').click();await page.locator('[data-activity-check]').click();await idle();assert.equal(await page.locator('[data-activity-id]').count(),expected.length,'Recovery preserves every saved transaction');
 for(const record of expected){const receipt=page.locator(`[data-activity-id="${record.journal.id}"]`);assert(await receipt.count(),'Saved receipt remains inspectable');assert.match(await receipt.locator('small').textContent(),/accepted/i,'Every saved transaction remains accepted after real node check');}
 assert.match(await page.locator('[data-game-money-ledger]').textContent(),/Town food store: 3 game food crates/,'Saved completed order retains delivered food');
 await page.locator('[data-activity-id]').first().click();await page.getByText('Exact transaction and outputs',{exact:true}).click();assert.match(await page.locator('[data-activity-detail]').textContent(),/Accepting block|acceptance|pending/i);
 assert.equal(await page.evaluate(()=>window.recoveryMutationAttempts),0);assert.deepEqual(errors,[]);await page.screenshot({path:shots+'/receipts.png'});await writeFile(shots+'/report.json',JSON.stringify({origin,readOnly:true,transactions:expected.length,accepted:expected.length,deliveredGameFood:3,walletAddressRetained:true,signatures:0,submissions:0,errors},null,2));console.log(`PASS ${expected.length} saved transactions inspected on ${origin}; no signatures or submissions.`);
}finally{await browser.close();}
