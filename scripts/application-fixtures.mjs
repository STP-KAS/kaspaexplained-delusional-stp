import {readFile} from 'node:fs/promises';

// Extract only the public proof fixture from the checksummed SDK archive.
// Never execute its devnet example or use its demonstration signing key.
export async function grothFixture(){
 const source=await readFile('.cache/upstream/kaspa-wasm32-sdk/examples/nodejs/javascript/zkproof/groth16.js','utf8');
 const hex=name=>{const match=source.match(new RegExp(`const ${name} =\\s*"([a-f0-9]+)"`));if(!match)throw new Error('Pinned Groth16 fixture missing.');return match[1];};
 const block=source.match(/const PUBLIC_INPUTS = \[([\s\S]*?)\];/);
 const inputs=[...(block?.[1]||'').matchAll(/"([a-f0-9]{64})"/g)].map(m=>m[1]);
 if(inputs.length!==5)throw new Error('Unexpected Groth16 fixture arity.');
 return {verifyingKey:hex('UNPREPARED_VK_HEX'),proof:hex('PROOF_HEX'),inputs,source:'kaspa-wasm32-sdk v2.0.1, examples/nodejs/javascript/zkproof/groth16.js'};
}
export const APPLICATION_KINDS=Object.freeze(['escrow','treasury','prediction','receipt','proof']);
export const applicationNames=Object.freeze({escrow:'ApplicationEscrow',treasury:'SharedTreasury',prediction:'PredictionEscrow',receipt:'ReserveReceipt',proof:'ProofPayout'});
export const applicationFiles=Object.freeze({escrow:'application-escrow',treasury:'shared-treasury',prediction:'prediction-escrow',receipt:'reserve-receipt',proof:'proof-payout'});
const bytes=hex=>({kind:'bytes',value:Array.from(Buffer.from(hex,'hex'))});
const integer=value=>({kind:'int',value});
export async function applicationSpec(kind,{publicKeys,now,amount=20000000,delayMs=120000}={}){
 if(!APPLICATION_KINDS.includes(kind))throw new Error('Choose a supported application.');
 if(!Array.isArray(publicKeys)||publicKeys.length!==3||publicKeys.some(p=>!/^([a-f0-9]{64})$/.test(p)))throw new Error('Three x-only public keys required.');
 if(!Number.isSafeInteger(now)||now<500000000000||!Number.isSafeInteger(delayMs)||delayMs<60000||delayMs>3600000)throw new Error('Invalid application time.');
 if(!Number.isSafeInteger(amount)||amount<2000000||amount>100000000)throw new Error('Application deposits must be 0.02–1 tKAS.');
 const [a,b,c]=publicKeys.map(bytes),maxFee=1000000,refundAfter=now+delayMs*2,resolveAfter=now+delayMs;
 let args,principal=amount,feeReserve=0,proofFixture;
 if(kind==='escrow')args=[a,b,c,integer(refundAfter),integer(amount),integer(maxFee)];
 if(kind==='treasury')args=[a,b,c,integer(amount),integer(maxFee)];
 if(kind==='prediction')args=[a,b,c,integer(resolveAfter),integer(refundAfter),integer(amount),integer(maxFee)];
 if(kind==='receipt'){feeReserve=1000000;principal=amount-feeReserve;args=[b,a,integer(principal),integer(feeReserve)];}
 if(kind==='proof'){proofFixture=await grothFixture();args=[a,bytes(proofFixture.verifyingKey),...proofFixture.inputs.map(bytes),integer(amount),integer(maxFee)];}
 return {kind,args,principal,feeReserve,maxFee,refundAfter,resolveAfter,computeBudget:kind==='proof'?1800:40,proofFixture};
}

// Optional unfunded integration fixture generator. Uses synthetic UTXOs and
// disposable keys, never opens the workshop wallet or connects to a node.
export async function generateApplicationFixtures(){
 const {createRequire}=await import('node:module');const {mkdtemp,mkdir,writeFile,rm}=await import('node:fs/promises');const {tmpdir}=await import('node:os');
 const {createApplication,reviewApplication}=await import('../server/application-lab.mjs');
 const sdk=createRequire(import.meta.url)('../.cache/upstream/kaspa-wasm32-sdk/nodejs/kaspa');
 const directory=await mkdtemp(tmpdir()+'/ke-application-fixtures-'),fixtures=[];
 try{
  for(const kind of APPLICATION_KINDS){
   const key=new sdk.PrivateKey('01'.repeat(32));let record;
   const rpc={getBlockDagInfo:async()=>({network:'testnet-10',pastMedianTime:1800001000000n}),getUtxosByAddresses:async()=>({entries:[{address:record.address,outpoint:{transactionId:'09'.repeat(32),index:0},amount:BigInt(record.amount),entry:{scriptPublicKey:sdk.payToScriptHashScript(record.script),isCoinbase:false,blockDaaScore:0n}}]}),getFeeEstimate:async()=>({estimate:{priorityBucket:{feerate:100}}})};
   const lab={directory,sdk,key,address:key.toAddress('testnet-10').toString(),state:{requests:[],transactions:[],spent:'0'},previews:new Map(),load:async()=>{},save:async()=>{},connected:async action=>action(rpc)};
   const created=await createApplication(lab,kind);record=lab.state.requests.find(r=>r.id===created.id);
   // Advance the synthetic node after deployment for timeout paths.
   rpc.getBlockDagInfo=async()=>({network:'testnet-10',pastMedianTime:1800010000000n});
   lab.state.transactions.push({id:'09'.repeat(32),requestId:record.id,state:'accepted'});
   const routes={escrow:[['release',{}],['resolve',{paySeller:true}],['resolve',{paySeller:false}],['refund',{}]],treasury:[['spend',{pair:0}],['spend',{pair:1}],['spend',{pair:2}]],prediction:[['settle',{yesWins:true}],['settle',{yesWins:false}],['refund',{}],['refund',{refundBy:'no'}]],receipt:[['redeem',{}]],proof:[['verify',{}]]}[kind];
   for(const [entry,parameters] of routes){
    try{
     const reviewed=await reviewApplication(lab,record.id,entry,parameters);const preview=lab.previews.get(reviewed.token);preview.pending.sign();
     fixtures.push({kind,entry,deposit:record.amount,script:record.script,transaction:JSON.parse(preview.pending.serializeToSafeJSON())});
    }catch(error){if(kind==='proof'&&/above its/.test(error.message)){fixtures.push({kind,blocked:error.message});}else throw new Error(kind+': '+error.message);}
   }
  }
  await mkdir('.cache/contracts',{recursive:true});await writeFile('.cache/contracts/application-runtime-fixtures.json',JSON.stringify(fixtures,null,2));
  console.log(JSON.stringify({unfunded:true,transactions:fixtures.filter(f=>f.transaction).length,blocked:fixtures.filter(f=>f.blocked).map(f=>({kind:f.kind,reason:f.blocked}))}));
 }finally{await rm(directory,{recursive:true,force:true});}
}
if(process.argv[1]?.endsWith('/application-fixtures.mjs')||process.argv[1]==='scripts/application-fixtures.mjs')setImmediate(()=>generateApplicationFixtures().catch(error=>{console.error(error.message);process.exitCode=1;}));
