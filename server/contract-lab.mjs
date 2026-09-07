import {randomBytes,randomUUID} from 'node:crypto';
import {writeFile,readFile} from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {NETWORK,requireBudget} from './testnet-policy.mjs';
import {rawInputSignature} from './contract-signature.mjs';
import {bounded} from './rpc-deadline.mjs';
import {splitRelayFee} from './split-fee.mjs';
const execute=promisify(execFile);

export async function createSplitRequest(lab,shareABps=5000){
  await lab.load();
  if(!Number.isInteger(shareABps)||shareABps<100||shareABps>9900)throw new Error('Choose a split between 1% and 99%.');
  if(lab.state.requests.length>=30)throw new Error('The experiment’s request limit has been reached.');
  const id=randomUUID(),recipientKey=new lab.sdk.PrivateKey(randomBytes(32).toString('hex'));
  const bytes=key=>({kind:'bytes',value:Array.from(Buffer.from(key.toPublicKey().toXOnlyPublicKey().toString(),'hex'))});
  const args=[bytes(lab.key),bytes(lab.key),bytes(recipientKey),{kind:'int',value:shareABps},{kind:'int',value:1000000}];
  const argPath=`${lab.directory}/${id}-args.json`,artifactPath=`${lab.directory}/${id}-artifact.json`;
  await writeFile(argPath,JSON.stringify(args),{mode:0o600});
  await execute('.cache/upstream/silverc',['contracts/payment-split.sil','--constructor-args',argPath,'-o',artifactPath],{timeout:10000,maxBuffer:100000});
  const artifact=JSON.parse(await readFile(artifactPath,'utf8')),contract=artifact.contracts.PaymentSplit;
  const script=Buffer.from(contract.compiled.bytecode).toString('hex');
  const record={id,kind:'split',address:lab.sdk.addressFromScriptPublicKey(lab.sdk.payToScriptHashScript(script),NETWORK).toString(),amount:'100000000',created:new Date().toISOString(),expires:new Date(Date.now()+3600000).toISOString(),key:recipientKey.toString(),recipients:[lab.address,recipientKey.toAddress(NETWORK).toString()],shareABps,script,entries:contract.entries,artifact};
  lab.state.requests.push(record);await lab.save();const {key,...publicRecord}=record;return publicRecord;
}

export async function createRefundRequest(lab){
  await lab.load();
  if(lab.state.requests.length>=30)throw new Error('The experiment’s request limit has been reached.');
  return lab.connected(async rpc=>{
    const info=await bounded(rpc.getBlockDagInfo());if(info.network!==NETWORK)throw new Error('Wrong network.');
    const id=randomUUID(),recipientKey=new lab.sdk.PrivateKey(randomBytes(32).toString('hex'));
    const bytes=key=>Array.from(Buffer.from(key.toPublicKey().toXOnlyPublicKey().toString(),'hex'));
    const refundAfter=Number(info.pastMedianTime)+120000;
    const args=[{kind:'bytes',value:bytes(lab.key)},{kind:'bytes',value:bytes(recipientKey)},{kind:'int',value:refundAfter}];
    const argPath=`${lab.directory}/${id}-args.json`,artifactPath=`${lab.directory}/${id}-artifact.json`;
    await writeFile(argPath,JSON.stringify(args),{mode:0o600});
    await execute('.cache/upstream/silverc',['contracts/refundable-transfer.sil','--constructor-args',argPath,'-o',artifactPath],{timeout:10000,maxBuffer:100000});
    const artifact=JSON.parse(await readFile(artifactPath,'utf8')),contract=artifact.contracts.RefundableTransfer;
    const script=Buffer.from(contract.compiled.bytecode).toString('hex');
    const address=lab.sdk.addressFromScriptPublicKey(lab.sdk.payToScriptHashScript(script),NETWORK).toString();
    const record={id,kind:'refundable',address,amount:'100000000',created:new Date().toISOString(),expires:new Date(Date.now()+3600000).toISOString(),key:recipientKey.toString(),refundAfter,script,entries:contract.entries,artifact};
    lab.state.requests.push(record);await lab.save();const {key,...publicRecord}=record;return publicRecord;
  });
}

export async function reviewContractSpend(lab,id,entry){
  await lab.load();if(!['claim','refund','distribute'].includes(entry))throw new Error('Choose a supported spending path.');
  const contract=lab.state.requests.find(record=>record.id===id&&record.kind===(entry==='distribute'?'split':'refundable'));if(!contract)throw new Error('Unknown contract or spending path.');
  if(lab.state.requests.length>=30)throw new Error('The experiment’s request limit has been reached.');
  if(lab.state.transactions.some(t=>t.state!=='accepted'))throw new Error('Check the previous transaction’s receipt first.');
  const funding=lab.state.transactions.find(t=>t.requestId===id&&t.state==='accepted');if(!funding)throw new Error('Fund this contract and verify its receipt first.');
  return lab.connected(async rpc=>{
    const {entries}=await bounded(rpc.getUtxosByAddresses([contract.address]));
    const matches=entries.filter(e=>e.outpoint.transactionId===funding.id&&BigInt(e.amount)===BigInt(contract.amount));
    if(matches.length!==1)throw new Error('The funded output is no longer available, or has not been observed.');
    const utxo=matches[0],info=await bounded(rpc.getBlockDagInfo());
    if(entry==='refund'&&BigInt(info.pastMedianTime)<=BigInt(contract.refundAfter))throw new Error('The node’s median time has not reached refund eligibility. The recipient can still claim.');
    const source={address:contract.address,outpoint:utxo.outpoint,scriptPublicKey:utxo.entry.scriptPublicKey,amount:utxo.amount,isCoinbase:utxo.entry.isCoinbase,blockDaaScore:utxo.entry.blockDaaScore};
    const signatureScript=signature=>new lab.sdk.ScriptBuilder().addData(signature).addData(contract.entries[entry].dispatch_tag).addData(contract.script).drain();
    const rate=entry==='distribute'?(await bounded(rpc.getFeeEstimate())).estimate.priorityBucket.feerate:100;
    let fee=10000n,tx,outputs;
    for(let pass=0;pass<5;pass++){
      const net=BigInt(utxo.amount)-fee;
      if(entry==='distribute'){const a=net*BigInt(contract.shareABps)/10000n;outputs=[{address:contract.recipients[0],amount:a},{address:contract.recipients[1],amount:net-a}];}
      else outputs=[{address:lab.address,amount:net}];
      tx=lab.sdk.createTransaction([source],outputs,0n,'',1);
      tx.inputs[0].sequence=0n;tx.lockTime=entry==='refund'?BigInt(contract.refundAfter):0n;
      tx.inputs[0].signatureScript=signatureScript('00'.repeat(65));
      const sdkRequired=lab.sdk.calculateTransactionFee(NETWORK,tx,1);
      if(sdkRequired===undefined)throw new Error('The contract spend exceeds standard mass.');
      const required=entry==='distribute'?splitRelayFee(tx.inputs[0].signatureScript.length/2,rate):sdkRequired;
      if(required===undefined)throw new Error('The contract spend exceeds standard mass.');
      if(fee>=required+1000n)break;fee=required+1000n;
    }
    const amount=BigInt(utxo.amount)-fee;
    if(fee>1000000n)throw new Error(`The calculated contract fee is ${fee} sompi, above the 1000000-sompi safety limit. No spend was signed.`);
    requireBudget({amount,fee,spent:BigInt(lab.state.spent)});
    if(!lab.sdk.updateTransactionMass(NETWORK,tx,1))throw new Error('Invalid contract transaction mass.');
    const request={id:randomUUID(),kind:'contract-return',sourceContract:id,entry,address:lab.address,addresses:outputs.map(o=>o.address),expectedOutputs:outputs.map(o=>({address:o.address,amount:String(o.amount)})),amount:String(amount),created:new Date().toISOString(),expires:new Date(Date.now()+3600000).toISOString()};
    lab.state.requests.push(request);await lab.save();
    const key=entry==='claim'?new lab.sdk.PrivateKey(contract.key):lab.key;
    const pending={
      feeAmount:fee,changeAmount:0n,paymentAmount:amount,aggregateInputAmount:BigInt(utxo.amount),aggregateOutputAmount:amount,type:'final',
      get id(){return tx.id;},
      sign(){tx.inputs[0].signatureScript=signatureScript(rawInputSignature(lab.sdk.createInputSignature(tx,0,key)));tx.finalize();},
      async submit(client){return (await client.submitTransaction({transaction:tx})).transactionId;},
      serializeToSafeJSON(){return tx.serializeToSafeJSON();},
    };
    const token=randomUUID(),expires=Date.now()+60000;lab.previews.clear();lab.previews.set(token,{pending,request,expires});
    return {token,requestId:request.id,network:NETWORK,source:contract.address,destination:outputs.map(o=>o.address).join(', '),outputs:request.expectedOutputs,amount:String(amount),fee:String(fee),change:'0',input:String(utxo.amount),expires,entry,transaction:JSON.parse(tx.serializeToSafeJSON())};
  });
}
