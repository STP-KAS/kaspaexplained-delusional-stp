import {execFileSync,spawn} from 'node:child_process';
import {copyFile,mkdir,access} from 'node:fs/promises';
import {resolve} from 'node:path';

const upstream=resolve('.cache/upstream/silverscript');
const revision='c7d17a15ac88610d013ec9ffffa9520aeb69929b';
try{await access(upstream);}catch{
  await mkdir('.cache/upstream',{recursive:true});
  execFileSync('git',['clone','--depth','1','--branch','v1-rc1','https://github.com/kaspanet/silverscript.git',upstream],{stdio:'inherit'});
}
if(execFileSync('git',['rev-parse','HEAD'],{cwd:upstream,encoding:'utf8'}).trim()!==revision)throw new Error('Unexpected SilverScript revision. Do not test against a moving compiler.');
execFileSync('git',['diff','--quiet','HEAD','--'],{cwd:upstream});
const suites=[['native_payment_vm.rs','kaspa_explained_native_payment'],['contracts_vm.rs','kaspa_explained_contracts'],['token_vm.rs','kaspa_explained_token'],['applications_vm.rs','kaspa_explained_applications'],['backed_receipt_vm.rs','kaspa_explained_backed_receipt']];
for(const script of ['application-fixtures.mjs','token-fixtures.mjs','native-payment-fixtures.mjs']){await access('scripts/'+script);execFileSync(process.execPath,['scripts/'+script],{stdio:'pipe'});}
execFileSync(process.execPath,['server/backed-receipt.mjs','--fixtures'],{stdio:'pipe'});
const arguments_=[];
for(const [source,name] of suites){await access('tests/'+source);await copyFile('tests/'+source,`${upstream}/silverscript-lang/tests/${name}.rs`);arguments_.push('--test',name);}
const child=spawn('cargo',['test','-p','silverscript-lang',...arguments_,'--locked'],{cwd:upstream,stdio:'inherit',env:{...process.env,CARGO_NET_GIT_FETCH_WITH_CLI:'true',KE_NATIVE_FIXTURES:resolve('.cache/native-payment/fixtures.json'),KE_CONTRACT_DIR:resolve('contracts'),KE_TOKEN_FIXTURES:resolve('.cache/token-fixtures/transactions.json'),KE_BACKED_FIXTURES:resolve('.cache/backed-receipt/transactions.json')}});
child.on('error',error=>{console.error(error.message);process.exitCode=1;});
child.on('exit',code=>{process.exitCode=code??1;});
