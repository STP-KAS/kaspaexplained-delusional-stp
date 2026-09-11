// Browser-only fully backed tKAS receipt builder.
import {instantiatePublicContract,pushPublicData,publicTransactionMass} from './public-contracts.mjs';
import {assetSignatureScript,publicAssetPlanMass,preparePublicAssetPlan,signPublicAssetPlan,validatePublicAssetPlan,kaspirePublicAssetSigningRequest,acceptKaspirePublicAssetSignature} from './public-asset-signing.mjs';
export const RECEIPT_NETWORK='testnet-10';
export const pushTokenData=pushPublicData;
export function instantiatePublicReceipt(sdk,template,{series,maxFee=3000000,state}){const full={series,maxFee,owner:state.owner,quantity:state.quantity,seriesId:series};return {...instantiatePublicContract(sdk,template,full),series,maxFee};}
export const backedSignatureScript=(receipt,states,operation,sponsor,signature,leader=true)=>assetSignatureScript(receipt,states,operation,sponsor,signature,leader);
const hex=(value,length)=>{if(typeof value!=='string'||!new RegExp(`^[a-f0-9]{${length*2}}$`,'i').test(value))throw new Error(`Expected ${length}-byte hexadecimal data.`);return value.toLowerCase();};
const integer=(value,min=1,max=1000000000)=>{if(!Number.isSafeInteger(value)||value<min||value>max)throw new Error('Invalid receipt integer.');return value;};
const sompi=value=>{const n=BigInt(value);if(n<0n||n>18446744073709551615n)throw new Error('Invalid sompi amount.');return n;};
export function backedState(value){return {owner:hex(value.owner,32),quantity:integer(value.quantity),series:hex(value.series,32),maxFee:integer(value.maxFee,1,3000000),seriesId:hex(value.seriesId,32)};}
const covId=u=>u.entry?.covenantId?.toString()??u.covenantId?.toString()??u.covenant_id;
const spk=u=>u.entry?.scriptPublicKey??u.scriptPublicKey;
const total=states=>states.reduce((n,s)=>n+s.quantity,0);
function nativeOutput(sdk,publicKey,value){const key=new sdk.PublicKey('02'+hex(publicKey,32));return {value:sompi(value),scriptPublicKey:sdk.payToAddressScript(key.toAddress(RECEIPT_NETWORK))};}
function input(utxo,computeBudget){if(!utxo?.outpoint||!utxo.entry)throw new Error('Complete SDK UTXO reference required.');return {previousOutpoint:utxo.outpoint,signatureScript:'',sequence:0n,sigOpCount:0,computeBudget:integer(computeBudget,0,65535),utxo};}
function newTransaction(sdk,inputs,outputs){return new sdk.Transaction({version:1,inputs,outputs,lockTime:0n,subnetworkId:'00'.repeat(20),gas:0n,payload:''});}
function valueCheck(inputs,outputs,fee){const provided=inputs.reduce((n,u)=>n+sompi(u.amount),0n),paid=outputs.reduce((n,o)=>n+sompi(o.value),0n);if(provided!==paid+fee)throw new Error('Receipt inputs must equal outputs plus sponsor-paid fee.');}
function checkSponsor(sdk,utxo,publicKey){if(covId(utxo))throw new Error('Sponsor must use an ordinary P2PK input.');const expected=nativeOutput(sdk,publicKey,1).scriptPublicKey;if(spk(utxo)?.version!==expected.version||spk(utxo)?.script!==expected.script)throw new Error('Sponsor public key does not match funding input.');}
function result(sdk,transaction,fee,covenantId,receipts,states,operation,sponsor,signers){
 const seen=new Set();for(const i of transaction.inputs){const id=`${i.previousOutpoint.transactionId}:${i.previousOutpoint.index}`;if(seen.has(id))throw new Error('Duplicate input outpoint.');seen.add(id);}
 const plan={network:RECEIPT_NETWORK,transaction,fee:String(fee),covenantId,receipts,states,operation,sponsor,signers};Object.defineProperty(plan,'sdk',{value:sdk});return plan;
}
function rawbuildBackedGenesis(sdk,{fundingUtxos,receipt,fee,sponsorPublicKey,nativeBudget=16}){
 if(!Array.isArray(fundingUtxos)||fundingUtxos.length!==1)throw new Error('This genesis example uses one ordinary funding input.');
 checkSponsor(sdk,fundingUtxos[0],sponsorPublicKey);fee=sompi(fee);if(fee===0n||fee>BigInt(receipt.maxFee))throw new Error('Genesis fee exceeds receipt policy.');
 const principal=BigInt(receipt.state.quantity),change=sompi(fundingUtxos[0].amount)-principal-fee;if(change<=0n)throw new Error('Genesis requires full backing and positive sponsor change.');
 const outputs=[{value:principal,scriptPublicKey:sdk.payToScriptHashScript(receipt.script)},nativeOutput(sdk,sponsorPublicKey,change)];
 valueCheck(fundingUtxos,outputs,fee);
 const transaction=newTransaction(sdk,fundingUtxos.map(u=>input(u,nativeBudget)),outputs);transaction.populateGenesisCovenants([{authorizingInput:0,outputs:[0]}]);
 const id=sdk.covenantId(transaction.inputs[0].previousOutpoint,[{index:0,output:transaction.outputs[0]}]).toString();if(transaction.outputs[0].covenant?.covenantId.toString()!==id)throw new Error('Genesis covenant binding was lost.');
 const plan=result(sdk,transaction,fee,id,[],[],null,sponsorPublicKey,[{index:0,kind:'native',owner:sponsorPublicKey}]);plan.genesis={series:receipt.series,maxFee:receipt.maxFee,state:receipt.state};return plan;
}
function rawbuildBackedMove(sdk,{receiptInputs,successors,operation='transfer',sponsorUtxo,sponsorPublicKey,fee,receiptBudget=16,nativeBudget=16}){
 if(!Array.isArray(receiptInputs)||receiptInputs.length<1||receiptInputs.length>2||!Array.isArray(successors)||successors.length>2)throw new Error('Receipt fan-in/out is at most two.');
 const before=receiptInputs.map(i=>i.receipt),states=successors.map(r=>backedState(r.state)),identity=r=>`${r.series}:${r.maxFee}`;
 if([...before,...successors].some(r=>identity(r)!==identity(before[0])))throw new Error('Receipt series or fee-policy mismatch.');
 const previous=before.map(r=>backedState(r.state));if(total(previous)>1000000000||total(states)>1000000000)throw new Error('Receipt group quantity exceeds its bound.');
 const code=operation==='transfer'?0:operation==='redeem'?1:-1;
 if(code===0){if(states.length===0||total(previous)!==total(states))throw new Error('Transfer must conserve every backed unit.');}
 else if(code===1){if(previous.length!==1||states.length>1||total(states)>=previous[0].quantity||states.some(s=>s.owner!==previous[0].owner))throw new Error('Redemption requires one holder and preserves any remaining holder balance.');}
 else throw new Error('Choose transfer or redeem.');
 const id=covId(receiptInputs[0].utxo);if(!id)throw new Error('Receipt input must retain its covenant ID.');
 for(const {utxo,receipt} of receiptInputs){if(covId(utxo)!==id)throw new Error('Mixed receipt covenant IDs.');if(sompi(utxo.amount)!==BigInt(receipt.state.quantity))throw new Error('Receipt input is not fully backed.');const expected=sdk.payToScriptHashScript(receipt.script);if(spk(utxo)?.version!==expected.version||spk(utxo)?.script!==expected.script)throw new Error('Receipt script does not match the supplied state.');}
 checkSponsor(sdk,sponsorUtxo,sponsorPublicKey);fee=sompi(fee);if(fee===0n||fee>BigInt(before[0].maxFee))throw new Error('Fee must be positive and within the receipt policy.');
 const change=sompi(sponsorUtxo.amount)-fee;if(change<=0n)throw new Error('Sponsor must cover fees and retain positive change.');
 const outputs=successors.map(r=>({value:BigInt(r.state.quantity),scriptPublicKey:sdk.payToScriptHashScript(r.script),covenant:{authorizingInput:0,covenantId:id}}));
 if(code===1)outputs.push(nativeOutput(sdk,previous[0].owner,previous[0].quantity-total(states)));
 outputs.push(nativeOutput(sdk,sponsorPublicKey,change));
 const all=[...receiptInputs.map(i=>i.utxo),sponsorUtxo];valueCheck(all,outputs,fee);
 const transaction=newTransaction(sdk,all.map((u,i)=>input(u,i<before.length?receiptBudget:nativeBudget)),outputs);
 successors.forEach((_,i)=>{if(transaction.outputs[i].covenant?.covenantId.toString()!==id)throw new Error('SDK dropped receipt binding.');});
 const signers=all.map((_,index)=>({index,kind:index<before.length?'receipt':'native',owner:index<before.length?before[index].state.owner:sponsorPublicKey}));
 const plan=result(sdk,transaction,fee,id,before,states,code,sponsorPublicKey,signers);plan.redeemed=code===1?String(previous[0].quantity-total(states)):'0';return plan;
}

export function buildBackedGenesis(sdk,options){return options.fee===undefined?converge(sdk,rawbuildBackedGenesis,options):preparePublicAssetPlan(rawbuildBackedGenesis(sdk,options),options);}
export function buildBackedMove(sdk,options){return options.fee===undefined?converge(sdk,rawbuildBackedMove,options):preparePublicAssetPlan(rawbuildBackedMove(sdk,options),options);}
export const signBackedPlan=signPublicAssetPlan;
export const preflightBackedPlan=plan=>({...validatePublicAssetPlan(plan),ready:true});
export const kaspireBackedSigningRequest=kaspirePublicAssetSigningRequest;
export const acceptKaspireBackedSignature=acceptKaspirePublicAssetSignature;

function converge(sdk,build,options){let fee=1n;for(let attempt=0;attempt<4;attempt++){const plan=build(sdk,{...options,fee}),mass=publicAssetPlanMass(plan,options),required=BigInt(mass.minimumFee);if(fee===required)return preparePublicAssetPlan(plan,options);fee=required;}throw new Error('Receipt fee did not converge.');}
