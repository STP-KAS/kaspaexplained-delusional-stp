import {createHash,randomUUID} from 'node:crypto';
import {mkdir,readFile,writeFile,mkdtemp,rename,chmod,access} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';

// Release pins are deliberate. Never resolve a moving "latest" release here.
const compilers={
  'darwin-arm64':['darwin-arm64','021bbef65cf4198190a61f9022f4289f68f1fb18f349fbfe38601b2f63e6c42a'],
  'darwin-x64':['darwin-x86_64','fb9af616449adadb489086cdeadfa7a95ac6d901fc29ff0848f1956f66ffa970'],
  'linux-arm64':['linux-arm64','9661b73e218f42357b8042c6cb2aa0198636f1fcfab48f797bf401449b89879e'],
  'linux-x64':['linux-x86_64','22751e9175bce33a22022c41ebc3454adbaf213ad97d955e9f37639e686ca694'],
};
const compiler=compilers[`${process.platform}-${process.arch}`];
if(!compiler)throw new Error('This setup supports macOS and Linux on arm64 or x64. Windows setup is not yet verified.');
const root='.cache/upstream';await mkdir(root,{recursive:true});
async function archive(name,url,expected){
  const path=`${root}/${name}`;let bytes;
  try{bytes=await readFile(path);}catch(error){
    if(error.code!=='ENOENT')throw error;
    console.log(`Downloading ${name}`);
    const response=await fetch(url,{signal:AbortSignal.timeout(120000)});
    if(!response.ok)throw new Error(`Download failed: HTTP ${response.status}`);
    const chunks=[];let length=0;
    for await(const chunk of response.body){length+=chunk.length;if(length>512*1024*1024)throw new Error('Release archive exceeds the size limit.');chunks.push(chunk);}
    bytes=Buffer.concat(chunks);
  }
  if(createHash('sha256').update(bytes).digest('hex')!==expected)throw new Error(`Checksum mismatch for ${name}. Nothing was installed.`);
  try{await access(path);}catch{await writeFile(path,bytes,{flag:'wx',mode:0o600});}
  console.log(`Verified ${name}`);return path;
}
const sdk=await archive('kaspa-wasm32-sdk-v2.0.1.zip','https://github.com/kaspanet/rusty-kaspa/releases/download/v2.0.1/kaspa-wasm32-sdk-v2.0.1.zip','7eaffac9cd920ef2fdf540c6e10f2a2b7761170ebc62ec57dfa0f71c64567a71');
const silver=await archive(`silverc-${compiler[0]}.tar.gz`,`https://github.com/kaspanet/silverscript/releases/download/v1-rc1/silverc-${compiler[0]}.tar.gz`,compiler[1]);
const sdkNames=execFileSync('unzip',['-Z1',sdk],{encoding:'utf8'}).trim().split('\n');
if(sdkNames.some(name=>!name.startsWith('kaspa-wasm32-sdk/')||name.split('/').includes('..')))throw new Error('Unexpected SDK archive path.');
const compilerNames=execFileSync('tar',['-tzf',silver],{encoding:'utf8'}).trim().split('\n');
if(compilerNames.length!==1||compilerNames[0]!=='silverc')throw new Error('Unexpected compiler archive contents.');
const staging=await mkdtemp(`${root}/setup-`);
execFileSync('unzip',['-q',sdk,'-d',staging]);
execFileSync('tar',['-xzf',silver,'-C',staging]);
await access(`${staging}/kaspa-wasm32-sdk/nodejs/kaspa/LICENSE`);
await access(`${staging}/kaspa-wasm32-sdk/nodejs/kaspa/kaspa.js`);
await chmod(`${staging}/silverc`,0o755);
const previous=`${root}/sdk-previous-${randomUUID()}`;let moved=false;
try{await rename(`${root}/kaspa-wasm32-sdk`,previous);moved=true;}catch(error){if(error.code!=='ENOENT')throw error;}
try{await rename(`${staging}/kaspa-wasm32-sdk`,`${root}/kaspa-wasm32-sdk`);}catch(error){if(moved)await rename(previous,`${root}/kaspa-wasm32-sdk`);throw error;}
await rename(`${staging}/silverc`,`${root}/silverc`);
console.log('Installed SDK v2.0.1 and SilverScript v1-rc1. No wallet was created and no transaction was sent.');
