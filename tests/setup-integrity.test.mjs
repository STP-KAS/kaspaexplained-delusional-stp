import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm,access} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const execute=promisify(execFile);

test('setup rejects corrupted cached release before extracting or replacing installed files',async t=>{
 const directory=await mkdtemp(join(tmpdir(),'kaspa-setup-integrity-'));t.after(()=>rm(directory,{recursive:true,force:true}));
 const upstream=join(directory,'.cache/upstream');await mkdir(join(upstream,'kaspa-wasm32-sdk'),{recursive:true});
 const existing=join(upstream,'kaspa-wasm32-sdk/existing');await writeFile(existing,'keep installed SDK');
 await writeFile(join(upstream,'kaspa-wasm32-sdk-v2.0.1.zip'),'corrupt archive');
 await assert.rejects(execute(process.execPath,[resolve('scripts/setup-testnet.mjs')],{cwd:directory}),error=>/Checksum mismatch/.test(error.stderr));
 assert.equal(await readFile(existing,'utf8'),'keep installed SDK');
 await assert.rejects(access(join(upstream,'silverc')));
});
