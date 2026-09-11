// Browser-only contract construction. No network, filesystem, wallet, or key storage.
export const PUBLIC_NETWORK = 'testnet-10';
export const PUBLIC_TEMPLATES_VERSION = 1;
const I64_MAX = 9223372036854775807n;
const checkedHex = (value, bytes) => {
  if (typeof value !== 'string' || !/^(?:[0-9a-f]{2})*$/i.test(value) || (bytes !== undefined && value.length !== bytes * 2)) throw new Error('Invalid hexadecimal value.');
  return value.toLowerCase();
};
export const hexBytes = value => Uint8Array.from(checkedHex(value).match(/../g) ?? [], byte => parseInt(byte, 16));
export const bytesHex = value => Array.from(value, byte => byte.toString(16).padStart(2, '0')).join('');
function integer(value, min = 0, max = Number.MAX_SAFE_INTEGER) {
  if (!Number.isSafeInteger(value) || value < min || value > max) throw new Error('Invalid integer.');
  return value;
}
function amount(value) { const n = BigInt(value); if (n < 0n || n > I64_MAX) throw new Error('Invalid amount.'); return n; }
export function pushPublicData(value, literal = false) {
  const bytes = typeof value === 'string' ? hexBytes(value) : value, n = bytes.length;
  if (!literal) {
    if (!n) return '00';
    if (n === 1 && bytes[0] >= 1 && bytes[0] <= 16) return (80 + bytes[0]).toString(16);
    if (n === 1 && bytes[0] === 129) return '4f';
  }
  const body = bytesHex(bytes);
  if (n < 76) return n.toString(16).padStart(2, '0') + body;
  if (n <= 255) return '4c' + n.toString(16).padStart(2, '0') + body;
  if (n <= 65535) return '4d' + (n & 255).toString(16).padStart(2, '0') + (n >> 8).toString(16).padStart(2, '0') + body;
  throw new Error('Script data is too large.');
}
function fixedInteger(value) {
  let n = BigInt(value); if (n < 0n || n > I64_MAX) throw new Error('State integers must be nonnegative signed 64-bit values.');
  const bytes = new Uint8Array(8); for (let i = 0; i < 8; i++) { bytes[i] = Number(n & 255n); n >>= 8n; } return bytes;
}
function scriptInteger(value) {
  let n = BigInt(value); if (n < 0n || n > I64_MAX) throw new Error('Unsupported script integer.');
  const bytes = []; while (n) { bytes.push(Number(n & 255n)); n >>= 8n; } if (bytes.at(-1) & 128) bytes.push(0); return pushPublicData(bytes);
}
function statePayload(type, value) {
  if (['int', 'temporal'].includes(type.kind)) return fixedInteger(value);
  if (type.kind === 'bool') { if (typeof value !== 'boolean') throw new Error('Expected boolean.'); return [value ? 1 : 0]; }
  if (type.kind === 'pubkey') return hexBytes(checkedHex(value, 32));
  if (type.kind === 'fixed_bytes') return hexBytes(checkedHex(value, type.len));
  throw new Error(`Unsupported public state type: ${type.kind}`);
}
export function instantiatePublicContract(sdk, template, state) {
  if (template.version !== PUBLIC_TEMPLATES_VERSION || template.network !== PUBLIC_NETWORK) throw new Error('Unsupported public template.');
  const contract = template.artifact.contracts[template.contractName];
  if (!contract) throw new Error('Missing contract artifact.');
  const fields = contract.runtime_state.fields;
  if (Object.keys(state).length !== fields.length || fields.some(field => !(field.name in state))) throw new Error('State must match the template exactly.');
  if (!['token','receipt'].includes(template.kind) && (BigInt(state.principal) <= 0n || BigInt(state.principal) > 100000000n || BigInt(state.maxFee) < 0n || BigInt(state.maxFee) > (template.kind === 'proof' ? 20000000n : 1000000n) || BigInt(state.maxFee) > BigInt(state.principal))) throw new Error('Invalid principal or fee limit.');
  if (template.kind === 'token') { integer(state.cap,1,1000000000);integer(state.quantity,0,state.cap);checkedHex(state.issuer,32);checkedHex(state.owner,32);if(typeof state.isMinter!=='boolean'||state.isMinter&&state.owner!==state.issuer||!state.isMinter&&state.quantity===0)throw new Error('Invalid token state.'); }
  if (template.kind === 'receipt') { integer(state.quantity,1,100000000);integer(state.maxFee,1,3000000);checkedHex(state.owner,32);checkedHex(state.series,32);if(state.seriesId!==state.series)throw new Error('Receipt series mismatch.'); }
  if (template.kind === 'prediction' && BigInt(state.resolveAfter) >= BigInt(state.refundAfter)) throw new Error('Resolution must precede refund eligibility.');
  const distinct = template.kind === 'treasury' ? [state.memberA, state.memberB, state.memberC] : template.kind === 'prediction' ? [state.yesOwner, state.noOwner] : [];
  if (new Set(distinct).size !== distinct.length) throw new Error('Use distinct participant keys.');
  for (const field of fields.filter(field => field.type.kind === 'pubkey')) new sdk.PublicKey('02' + checkedHex(state[field.name], 32));
  const span = contract.compiled.state_span, code = contract.compiled.bytecode;
  integer(span.offset, 0, code.length); integer(span.len, 0, code.length - span.offset);
  // State uses explicit push opcodes (including booleans), unlike invocation args.
  const encoded = fields.map(field => pushPublicData(statePayload(field.type, state[field.name]), true)).join('');
  if (encoded.length / 2 !== span.len) throw new Error('State patch changed its fixed-width span.');
  const script = bytesHex(code.slice(0, span.offset)) + encoded + bytesHex(code.slice(span.offset + span.len));
  return {artifact: template.artifact, kind: template.kind, contractName: template.contractName, state: {...state}, script, lockingScript: sdk.payToScriptHashScript(script).script, entries: contract.entries, address: sdk.addressFromScriptPublicKey(sdk.payToScriptHashScript(script), PUBLIC_NETWORK).toString(), computeBudget: template.computeBudget, proofFixture: template.proofFixture};
}
function argument(type, value) {
  if (type.kind === 'sig') return pushPublicData(checkedHex(value, 65));
  if (['int', 'temporal'].includes(type.kind)) return scriptInteger(value);
  if (type.kind === 'bool') { if (typeof value !== 'boolean') throw new Error('Expected boolean argument.'); return scriptInteger(value ? 1 : 0); }
  if (type.kind === 'pubkey') return pushPublicData(checkedHex(value, 32));
  if (type.kind === 'fixed_bytes') return pushPublicData(checkedHex(value, type.len));
  if (type.kind === 'bytes') return pushPublicData(checkedHex(value));
  throw new Error('Unsupported public argument type.');
}
export function publicUnlockScript(plan, signatures = plan.signatures ?? []) {
  const entry = plan.contract.entries[plan.entry]; let signatureIndex = 0;
  const values = plan.args.map((value, index) => entry.params[index].type.kind === 'sig' ? signatures[signatureIndex++] ?? '00'.repeat(64) + '01' : value);
  return entry.params.map((param, index) => argument(param.type, values[index])).join('') + pushPublicData(entry.dispatch_tag) + pushPublicData(plan.contract.script);
}
const publicKeyAddress = (sdk, key) => new sdk.PublicKey('02' + checkedHex(key, 32)).toAddress(PUBLIC_NETWORK).toString();
const payment = (sdk, publicKey, value) => ({value: amount(value), scriptPublicKey: sdk.payToAddressScript(new sdk.Address(publicKeyAddress(sdk, publicKey)))});
function nativeInput(utxo, budget) {
  if (!utxo?.entry || !utxo.outpoint || utxo.entry.covenantId) throw new Error('A plain SDK UTXO reference is required.');
  return {previousOutpoint: utxo.outpoint, utxo, signatureScript: '', sequence: 0n, sigOpCount: 0, computeBudget: budget};
}
const transaction = (sdk, inputs, outputs, lockTime = 0n) => new sdk.Transaction({version: 1, inputs, outputs, lockTime, subnetworkId: '00'.repeat(20), gas: 0n, payload: ''});
function route(contract, entry, parameters) {
  const s = contract.state;
  if (contract.kind === 'escrow') {
    if (entry === 'release') return {signers: [s.buyer], args: [null], recipients: [s.seller], time: 0};
    if (entry === 'resolve' && typeof parameters.paySeller === 'boolean') return {signers: [s.arbiter], args: [null, parameters.paySeller], recipients: [parameters.paySeller ? s.seller : s.buyer], time: 0};
    if (entry === 'refund') return {signers: [s.buyer], args: [null], recipients: [s.buyer], time: s.refundAfter};
  }
  if (contract.kind === 'treasury' && entry === 'spend') {
    const pair = parameters.pair ?? 0; integer(pair, 0, 2); const beneficiary = checkedHex(parameters.beneficiary ?? s.memberA, 32);
    return {signers: [[s.memberA, s.memberB], [s.memberA, s.memberC], [s.memberB, s.memberC]][pair], args: [null, null, pair, beneficiary], recipients: [beneficiary], time: 0};
  }
  if (contract.kind === 'prediction') {
    if (entry === 'settle' && typeof parameters.yesWins === 'boolean') return {signers: [s.oracle], args: [null, parameters.yesWins], recipients: [parameters.yesWins ? s.yesOwner : s.noOwner], time: s.resolveAfter};
    if (entry === 'refund') { if (parameters.refundBy !== undefined && !['yes','no'].includes(parameters.refundBy)) throw new Error('Choose YES or NO to authorize the refund.'); return {signers: [parameters.refundBy === 'no' ? s.noOwner : s.yesOwner], args: [null], recipients: [s.yesOwner, s.noOwner], time: s.refundAfter}; }
  }
  if (contract.kind === 'proof' && entry === 'verify') return {signers: [s.owner], args: [null, contract.proofFixture.proof], recipients: [s.owner], time: 0};
  throw new Error('Unsupported contract action.');
}
export function buildPublicSpend(sdk, {contract, utxo, entry, parameters = {}, pastMedianTime, feeRate = 100}) {
  if (!contract.entries[entry]) throw new Error('Unknown spending entry.');
  if (!utxo?.entry || utxo.entry.scriptPublicKey.script !== sdk.payToScriptHashScript(contract.script).script || utxo.entry.scriptPublicKey.version !== 0) throw new Error('Funded script does not match this contract instance.');
  if (BigInt(utxo.amount) !== BigInt(contract.state.principal)) throw new Error('Fund the exact principal amount.');
  const path = route(contract, entry, parameters);
  if (path.time && (pastMedianTime === undefined || BigInt(pastMedianTime) < BigInt(path.time))) throw new Error('The node median time has not reached this action.');
  let fee = 1000n;
  for (let attempt = 0; attempt < 3; attempt++) {
    const net = BigInt(utxo.amount) - fee; if (net <= 0n || fee > BigInt(contract.state.maxFee)) throw new Error('The contract fee limit cannot cover this action.');
    const outputs = path.recipients.length === 2 ? [payment(sdk, path.recipients[0], net / 2n), payment(sdk, path.recipients[1], net - net / 2n)] : [payment(sdk, path.recipients[0], net)];
    const tx = transaction(sdk, [nativeInput(utxo, contract.computeBudget)], outputs, BigInt(path.time));
    const plan = {network: PUBLIC_NETWORK, contract, entry, args: path.args, signers: path.signers, signatures: [], recipients: path.recipients, transaction: tx, fee: String(fee)};
    tx.inputs[0].signatureScript = publicUnlockScript(plan);
    const mass = publicTransactionMass(tx, {feeRate});
    if (fee < BigInt(mass.minimumFee)) { fee = BigInt(mass.minimumFee); continue; }
    if (!mass.withinBlockLimits) throw new Error('This action exceeds the Testnet-10 block mass limits.');
    tx.storageMass = BigInt(mass.storageMass); plan.mass = mass; Object.defineProperty(plan,'sdk',{value:sdk}); validatePublicPlan(plan); return plan;
  }
  throw new Error('Fee calculation did not converge.');
}
export function buildPublicFunding(sdk, {contract, fundingUtxos, owner, feeRate = 100, maxFee = 1000000n}) {
  preflightPublicContract(sdk,contract,{feeRate});
  const ownedScript=payment(sdk,owner,1n).scriptPublicKey.script;
  if(fundingUtxos.some(u=>u.entry?.scriptPublicKey.script!==ownedScript)) throw new Error('Funding inputs must belong to the selected wallet.');
  const principal = BigInt(contract.state.principal), total = fundingUtxos.reduce((sum, u) => sum + BigInt(u.amount), 0n); let fee = 1000n;
  for (let attempt = 0; attempt < 3; attempt++) {
    const change = total - principal - fee; if (change < 0n || fee > BigInt(maxFee)) throw new Error('Insufficient funding or fee limit.');
    const outputs = [{value: principal, scriptPublicKey: sdk.payToScriptHashScript(contract.script)}]; if (change) outputs.push(payment(sdk, owner, change));
    const tx = transaction(sdk, fundingUtxos.map(u => nativeInput(u, 16)), outputs);
    for (const input of tx.inputs) input.signatureScript = pushPublicData('00'.repeat(64) + '01');
    const mass = publicTransactionMass(tx, {feeRate});
    if (fee < BigInt(mass.minimumFee)) { fee = BigInt(mass.minimumFee); continue; }
    if (!mass.withinBlockLimits) throw new Error('Funding change would exceed Testnet-10 mass limits.');
    tx.storageMass = BigInt(mass.storageMass); const plan={network: PUBLIC_NETWORK, funding: true, contract, signers: fundingUtxos.map(() => owner), transaction: tx, fee: String(fee), mass};Object.defineProperty(plan,'sdk',{value:sdk});validatePublicPlan(plan);return plan;
  }
  throw new Error('Funding fee calculation did not converge.');
}
function unsignedShape(tx) { const object = JSON.parse(tx.serializeToSafeJSON()); for (const input of object.inputs) delete input.signatureScript; return JSON.stringify(object); }
function reviewMetadata(plan) { return JSON.stringify({funding:plan.funding,contract:plan.contract,entry:plan.entry,args:plan.args,signers:plan.signers,signatures:plan.signatures,recipients:plan.recipients,fee:plan.fee,mass:plan.mass}); }
export function validatePublicPlan(plan) {
  if(plan.network!==PUBLIC_NETWORK)throw new Error('Testnet-only plan.');
  const tx=plan.transaction,principal=amount(plan.contract.state.principal),feeCap=plan.contract.kind==='proof'?20000000n:1000000n;
  const totalIn=tx.inputs.reduce((sum,i)=>sum+amount(i.utxo.amount),0n),totalOut=tx.outputs.reduce((sum,o)=>sum+amount(o.value),0n),fee=totalIn-totalOut;
  if(principal<=0n||principal>100000000n||fee<0n||fee!==BigInt(plan.fee)||fee>feeCap||fee>BigInt(plan.contract.state.maxFee))throw new Error('Signed transaction violates the principal or fee limit.');
  if(plan.funding){
    const changeScript=payment(plan.sdk,plan.signers[0],1n).scriptPublicKey.script;
    if(tx.inputs.some(i=>i.utxo.entry.scriptPublicKey.script!==changeScript)||tx.outputs.length<1||tx.outputs.length>2||tx.outputs[0].value!==principal||tx.outputs[0].scriptPublicKey.script!==plan.contract.lockingScript||(tx.outputs[1]&&tx.outputs[1].scriptPublicKey.script!==changeScript))throw new Error('Funding changed the contract or controlled change destination.');
    const change=tx.outputs[1]?.value??0n;if(totalIn-change>100000000n+feeCap)throw new Error('Funding exceeds the debit cap.');
  }else{
    if(tx.inputs.length!==1||totalIn!==principal||tx.inputs[0].utxo.entry.scriptPublicKey.script!==plan.contract.lockingScript||tx.outputs.length!==plan.recipients.length)throw new Error('Spend changed its funded contract.');
    const net=principal-fee;
    tx.outputs.forEach((o,i)=>{const expected=plan.recipients.length===1?net:i===0?net/2n:net-net/2n;if(o.value!==expected||o.scriptPublicKey.script!==payment(plan.sdk,plan.recipients[i],expected).scriptPublicKey.script)throw new Error('Spend changed the reviewed payout.');});
  }
  const mass=publicTransactionMass(tx,{feeRate:plan.mass.feeRate});if(!mass.withinBlockLimits||fee<BigInt(mass.minimumFee)||tx.storageMass!==BigInt(mass.storageMass))throw new Error('Signed transaction violates its mass or relay budget.');
  return {principal:String(principal),fee:String(fee),debit:String(plan.funding?principal+fee:principal),mass};
}
export async function signPublicPlan(plan, signInput) {
  validatePublicPlan(plan);const shape=unsignedShape(plan.transaction),metadata=reviewMetadata(plan),signatures=[];
  for(let signer=0;signer<plan.signers.length;signer++){
    const priorScripts=plan.transaction.inputs.map(i=>i.signatureScript);
    let encoded=await signInput(plan.transaction,plan.funding?signer:0,{publicKey:plan.signers[signer],signer});
    if(unsignedShape(plan.transaction)!==shape||reviewMetadata(plan)!==metadata||plan.transaction.inputs.some((i,index)=>i.signatureScript!==priorScripts[index]))throw new Error('Signer changed the reviewed transaction or contract metadata.');
    if(/^41[0-9a-f]{130}$/i.test(encoded))encoded=encoded.slice(2);checkedHex(encoded,65);if(!encoded.endsWith('01'))throw new Error('SIGHASH_ALL is required.');signatures.push(encoded);
    if(plan.funding)plan.transaction.inputs[signer].signatureScript=pushPublicData(encoded);
  }
  if(!plan.funding){plan.signatures=signatures;plan.transaction.inputs[0].signatureScript=publicUnlockScript(plan);}
  validatePublicPlan(plan);plan.transaction.finalize();return plan.transaction;
}
export function preflightPublicContract(sdk,contract,{feeRate=100}={}){
  const utxo=new sdk.UtxoEntries([{outpoint:{transactionId:'00'.repeat(32),index:0},amount:BigInt(contract.state.principal),scriptPublicKey:sdk.payToScriptHashScript(contract.script),blockDaaScore:0n,isCoinbase:false}]).items[0];
  const paths={escrow:[['release',{}],['resolve',{paySeller:true}],['resolve',{paySeller:false}],['refund',{}]],treasury:[['spend',{pair:0}],['spend',{pair:1}],['spend',{pair:2}]],prediction:[['settle',{yesWins:true}],['settle',{yesWins:false}],['refund',{refundBy:'yes'}],['refund',{refundBy:'no'}]],proof:[['verify',{}]]}[contract.kind];
  if(!paths)throw new Error('Unknown public application.');
  return {unfunded:true,exits:paths.map(([entry,parameters])=>{const plan=buildPublicSpend(sdk,{contract,utxo,entry,parameters,pastMedianTime:contract.state.refundAfter??0,feeRate});return {entry,parameters,fee:plan.fee,mass:plan.mass};})};
}
// Pure request builder. The UI calls window.kaspire.request only on a user action.
export function kaspirePublicSigningRequest(plan, signer = 0) {
  integer(signer, 0, plan.signers.length - 1);validatePublicPlan(plan);
  if (plan.funding) return {method: 'signPskt', params: {psktTransactionJson: plan.transaction.serializeToSafeJSON(), submitTransaction: false, signInputs: [{index: signer, sighashType: 1}]}};
  const entry = plan.contract.entries[plan.entry]; let signatureIndex = 0;
  const args = entry.params.map((param, index) => {
    if (param.type.kind === 'sig') { const current = signatureIndex++; return current === signer ? {type: 'signature'} : {type: 'data', hex: plan.signatures[current] ?? '00'.repeat(64) + '01'}; }
    if (param.type.kind === 'bool') return {type: 'i64', value: plan.args[index] ? 1 : 0};
    if (['int', 'temporal'].includes(param.type.kind)) return {type: 'i64', value: String(plan.args[index])};
    return {type: 'data', hex: plan.args[index]};
  });
  args.push({type: 'data', hex: entry.dispatch_tag});
  return {method: 'signPskt', params: {psktTransactionJson: plan.transaction.serializeToSafeJSON(), submitTransaction: false, signInputs: [{index: 0, sighashType: 1}], scripts: [{inputIndex: 0, scriptHex: plan.contract.script, signatureScript: {mode: 'ordered-args', args}}]}};
}
function readPushes(script) {
  const bytes = hexBytes(script), pushes = []; let offset = 0;
  while (offset < bytes.length) {
    const op = bytes[offset++]; let length;
    if (op === 0) { pushes.push(''); continue; }
    if (op >= 81 && op <= 96) { pushes.push((op - 80).toString(16).padStart(2, '0')); continue; }
    if (op < 76) length = op;
    else if (op === 76) length = bytes[offset++];
    else if (op === 77) { length = bytes[offset] + bytes[offset + 1] * 256; offset += 2; }
    else throw new Error('Unexpected signature-script opcode.');
    if (offset + length > bytes.length) throw new Error('Truncated signature script.'); pushes.push(bytesHex(bytes.slice(offset, offset + length))); offset += length;
  }
  return pushes;
}
export function acceptKaspirePublicSignature(sdk, plan, signer, result) {
  integer(signer, 0, plan.signers.length - 1); const json = typeof result === 'string' ? result : result.psktTransactionJson;
  if (typeof json !== 'string') throw new Error('Wallet returned no signed transaction.');
  const returned = sdk.Transaction.deserializeFromSafeJSON(json);
  if (unsignedShape(returned) !== unsignedShape(plan.transaction)) throw new Error('Wallet changed the reviewed transaction.');
  const index = plan.funding ? signer : 0, script = returned.inputs[index].signatureScript, pushes = readPushes(script);
  const raw = pushes[plan.funding ? 0 : signer]; checkedHex(raw, 65); if (!raw.endsWith('01')) throw new Error('Wallet used an unexpected sighash.');
  if (plan.funding) { if (script !== pushPublicData(raw)) throw new Error('Unexpected funding script.'); plan.transaction.inputs[index].signatureScript = script; }
  else { const signatures = [...plan.signatures]; signatures[signer] = raw; if (publicUnlockScript(plan, signatures) !== script) throw new Error('Wallet changed covenant arguments or another signature.'); plan.signatures = signatures; plan.transaction.inputs[0].signatureScript = script; }
  validatePublicPlan(plan);plan.transaction.finalize(); return {complete: plan.funding ? plan.transaction.inputs.every(i => readPushes(i.signatureScript)[0] !== '00'.repeat(64) + '01') : plan.signers.every((_, i) => Boolean(plan.signatures[i])), transaction: plan.transaction};
}

// Pinned native-v1 post-Toccata mass rules, checked against Rust by fixture suites.
export function publicTransactionMass(transaction,{feeRate=100}={}){
 if(transaction.version!==1||typeof transaction.payload!=='string'||transaction.payload.length>512||!/^(?:[0-9a-f]{2})*$/i.test(transaction.payload)||transaction.subnetworkId!=='00'.repeat(20)||transaction.gas!==0n)throw new Error('Mass helper supports only native v1 transactions with at most 256 payload bytes.');
 if(!Number.isFinite(feeRate)||feeRate<100||feeRate>100000)throw new Error('Invalid relay fee rate.');
 const inputs=transaction.inputs,outputs=transaction.outputs;if(!inputs.length||!outputs.length)throw new Error('Inputs and outputs required.');
 const inputCells=inputs.map(i=>{const entry=i.utxo?.entry;if(!entry)throw new Error('Complete UTXO references required.');return {value:amount(i.utxo.amount),plurality:BigInt(Math.ceil((63+entry.scriptPublicKey.script.length/2+(entry.covenantId?32:0))/100))};});
 const outputCells=outputs.map(o=>({value:amount(o.value),plurality:BigInt(Math.ceil((63+o.scriptPublicKey.script.length/2+(o.covenant?32:0))/100))}));
 if([...inputCells,...outputCells].some(c=>c.value===0n))throw new Error('Zero-value output or input.');
 const size=94+transaction.payload.length/2+inputs.reduce((s,i)=>s+54+(i.signatureScript?.length??0)/2,0)+outputs.reduce((s,o)=>s+18+o.scriptPublicKey.script.length/2+(o.covenant?34:0),0);
 const computeMass=size+outputs.reduce((s,o)=>s+(2+o.scriptPublicKey.script.length/2)*10,0)+inputs.reduce((s,i)=>s+integer(i.computeBudget,0,65535)*100,0);
 const transientMass=size*4,normalizedTransientMass=size*2;
 const C=1000000000000n,pOut=outputCells.reduce((s,c)=>s+c.plurality,0n),pIn=inputCells.reduce((s,c)=>s+c.plurality,0n);
 const harmonic=cells=>cells.reduce((s,c)=>s+C*c.plurality*c.plurality/c.value,0n),hOut=harmonic(outputCells);
 let inTerm;if(pOut===1n||pIn===1n||pOut===2n&&pIn===2n)inTerm=harmonic(inputCells);else{const sum=inputCells.reduce((s,c)=>s+c.value,0n),mean=sum/pIn;inTerm=pIn*(C/(mean>0n?mean:1n));}
 const storageMass=hOut>inTerm?hOut-inTerm:0n;
 const minimumFee=BigInt(Math.ceil(Math.max(computeMass,normalizedTransientMass)*feeRate))+1000n;
 return {estimatedBytes:size,computeMass,transientMass,normalizedTransientMass,storageMass:String(storageMass),feeRate,minimumFee:String(minimumFee),withinBlockLimits:computeMass<=500000&&transientMass<=1000000&&storageMass<=500000n};
}
