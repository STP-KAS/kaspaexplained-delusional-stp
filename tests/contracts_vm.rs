// Unfunded, deterministic fixtures. Executes the repository's exact .sil files.
// Runs inside the pinned SilverScript workspace; see check-contract-vm.mjs.
mod common;
use common::{bytecode,encode_entry_sig_script,push_redeem_script};
use kaspa_consensus_core::hashing::sighash::{calc_schnorr_signature_hash,SigHashReusedValuesUnsync};
use kaspa_consensus_core::hashing::sighash_type::SIG_HASH_ALL;
use kaspa_consensus_core::mass::units::{Gram,ScriptUnits,SigopCount,free_script_units_per_input};
use kaspa_consensus_core::tx::{PopulatedTransaction,ScriptPublicKey,Transaction,TransactionId,TransactionInput,TransactionOutpoint,TransactionOutput,UtxoEntry,VerifiableTransaction};
use kaspa_txscript::{EngineCtx,EngineFlags,TxScriptEngine,pay_to_script_hash_script};
use kaspa_txscript::caches::Cache;
use kaspa_txscript::covenants::CovenantsContext;
use kaspa_txscript::opcodes::codes::OpCheckSig;
use kaspa_txscript::script_builder::ScriptBuilder;
use silverscript_abi::{ArtifactValue,SilAbiArtifact};
use silverscript_lang::compiler::{CompileOptions,compile_to_sil_abi_artifact_with_options};
use secp256k1::{Keypair,Secp256k1,SecretKey};
use std::collections::BTreeMap;

fn key(n:u8)->Keypair {Keypair::from_secret_key(&Secp256k1::new(),&SecretKey::from_slice(&[n;32]).unwrap())}
fn pk(n:u8)->ArtifactValue {key(n).x_only_public_key().0.serialize().to_vec().into()}
fn compile(name:&str,args:&[ArtifactValue])->SilAbiArtifact {
    let root=std::env::var("KE_CONTRACT_DIR").expect("explicit contract directory");
    let source=std::fs::read_to_string(std::path::Path::new(&root).join(name)).unwrap();
    compile_to_sil_abi_artifact_with_options(&source,args,CompileOptions::default()).unwrap()
}
fn output(n:u8,value:u64)->TransactionOutput {
    let script=ScriptBuilder::new().add_data(&key(n).x_only_public_key().0.serialize()).unwrap().add_op(OpCheckSig).unwrap().drain();
    TransactionOutput{value,script_public_key:ScriptPublicKey::new(0,script.into()),covenant:None}
}
fn transaction(outputs:Vec<TransactionOutput>,time:u64)->Transaction {
    let input=TransactionInput::new(TransactionOutpoint{transaction_id:TransactionId::from_bytes([9;32]),index:0},vec![],0,1);
    Transaction::new(0,vec![input],outputs,time,Default::default(),0,vec![])
}
fn execute(artifact:&SilAbiArtifact,entry:&str,signer:u8,mut tx:Transaction,deposit:u64,corrupt:bool)->Result<(),kaspa_txscript_errors::TxScriptError> {
    let entries=vec![UtxoEntry::new(deposit,pay_to_script_hash_script(&bytecode(artifact)),0,false,None);tx.inputs.len()];
    let digest=calc_schnorr_signature_hash(&PopulatedTransaction::new(&tx,entries.clone()),0,SIG_HASH_ALL,&SigHashReusedValuesUnsync::new());
    let message=secp256k1::Message::from_digest_slice(digest.as_bytes().as_slice()).unwrap();
    let mut signature=key(signer).sign_schnorr(message).as_ref().to_vec();signature.push(SIG_HASH_ALL.to_u8());
    if corrupt {signature[0]^=1;}
    let mut script=encode_entry_sig_script(artifact,entry,&[signature.into()]).unwrap();script.extend(push_redeem_script(&bytecode(artifact)));
    tx.inputs[0].signature_script=script;tx.finalize();
    let input=tx.inputs[0].clone();let populated=PopulatedTransaction::new(&tx,entries);
    let covenants=CovenantsContext::from_tx(&populated).unwrap();let reused=SigHashReusedValuesUnsync::new();let cache=Cache::new(100);
    let limit=ScriptUnits(free_script_units_per_input().0+ScriptUnits::from(SigopCount(1)).0);
    let mut vm=TxScriptEngine::from_transaction_input_with_script_units_limit(&populated,&input,0,populated.utxo(0).unwrap(),EngineCtx::new(&cache).with_reused(&reused).with_covenants_ctx(&covenants),EngineFlags{covenants_enabled:true,sigop_script_units:Gram(1000).into()},limit);
    vm.execute()
}

#[test]
fn refundable_transfer_signature_and_time_boundaries(){
    let time=1_800_000_000_000u64;
    let artifact=compile("refundable-transfer.sil",&[pk(1),pk(2),(time as i64).into()]);
    for now in [0,time-1,time,time+1]{assert!(execute(&artifact,"claim",2,transaction(vec![output(2,99_800_000)],now),100_000_000,false).is_ok(),"recipient claim at {now}");}
    for now in [time,time+1]{assert!(execute(&artifact,"refund",1,transaction(vec![output(1,99_800_000)],now),100_000_000,false).is_ok(),"refund at {now}");}
    assert!(execute(&artifact,"refund",1,transaction(vec![output(1,99_800_000)],time-1),100_000_000,false).is_err());
    assert!(execute(&artifact,"claim",1,transaction(vec![output(1,99_800_000)],time),100_000_000,false).is_err());
    assert!(execute(&artifact,"refund",2,transaction(vec![output(2,99_800_000)],time),100_000_000,false).is_err());
    assert!(execute(&artifact,"claim",2,transaction(vec![output(2,99_800_000)],time),100_000_000,true).is_err());
    let mut final_sequence=transaction(vec![output(1,99_800_000)],time);final_sequence.inputs[0].sequence=u64::MAX;
    assert!(execute(&artifact,"refund",1,final_sequence,100_000_000,false).is_err());
}

fn split(share:i64)->SilAbiArtifact {compile("payment-split.sil",&[pk(1),pk(2),pk(3),share.into(),1_000_000i64.into()])}
fn split_tx(share:u64,fee:u64)->Transaction {let available=100_000_000-fee;let a=available*share/10000;transaction(vec![output(2,a),output(3,available-a)],0)}

// These are script execution fixtures, not funded genesis or relay evidence.
type TokenState=(u8,i64,bool);
fn token(s:TokenState)->SilAbiArtifact {compile("capped-token.sil",&[pk(1),1000i64.into(),pk(s.0),s.1.into(),s.2.into()])}
fn token_states(states:&[TokenState])->ArtifactValue {
    ArtifactValue::Array(states.iter().map(|s|BTreeMap::from([("owner".to_string(),pk(s.0)),("quantity".to_string(),s.1.into()),("isMinter".to_string(),s.2.into())]).into()).collect())
}
fn token_move(before:&[TokenState],after:&[TokenState],operation:i64,wrong_signer:bool)->bool {
    use common::{COV_A,covenant_decl_sigscript};
    use kaspa_consensus_core::tx::CovenantBinding;
    let artifacts:Vec<_>=before.iter().map(|s|token(*s)).collect();
    let entries:Vec<_>=artifacts.iter().map(|a|UtxoEntry::new(100_000_000,pay_to_script_hash_script(&bytecode(a)),0,false,Some(COV_A))).collect();
    let inputs=before.iter().enumerate().map(|(i,_)|TransactionInput::new_with_compute_budget(TransactionOutpoint{transaction_id:TransactionId::from_bytes([9;32]),index:i as u32},vec![],0,100)).collect();
    let outputs=after.iter().map(|s|TransactionOutput{value:10_000_000,script_public_key:pay_to_script_hash_script(&bytecode(&token(*s))),covenant:Some(CovenantBinding{authorizing_input:0,covenant_id:COV_A})}).collect();
    let mut tx=Transaction::new(1,inputs,outputs,0,Default::default(),0,vec![]);
    for (i,a) in artifacts.iter().enumerate(){
        let digest=calc_schnorr_signature_hash(&PopulatedTransaction::new(&tx,entries.clone()),i,SIG_HASH_ALL,&SigHashReusedValuesUnsync::new());
        let message=secp256k1::Message::from_digest_slice(digest.as_bytes().as_slice()).unwrap();
        let mut signature=key(if wrong_signer{4}else{before[i].0}).sign_schnorr(message).as_ref().to_vec();signature.push(SIG_HASH_ALL.to_u8());
        let args=if i==0{vec![token_states(after),operation.into(),signature.into()]}else{vec![signature.into()]};
        tx.inputs[i].signature_script=covenant_decl_sigscript(a,"move",args,i==0);
    }
    tx.finalize();let populated=PopulatedTransaction::new(&tx,entries);
    let covenants=CovenantsContext::from_tx(&populated).unwrap();let reused=SigHashReusedValuesUnsync::new();let cache=Cache::new(100);
    for i in 0..before.len(){
        let mut vm=TxScriptEngine::from_transaction_input_with_script_units_limit(&populated,&tx.inputs[i],i,populated.utxo(i).unwrap(),EngineCtx::new(&cache).with_reused(&reused).with_covenants_ctx(&covenants),EngineFlags{covenants_enabled:true,sigop_script_units:Gram(1000).into()},tx.inputs[i].compute_commit.allowed_script_units());
        if vm.execute().is_err(){return false;}
    }
    true
}

#[test]
fn capped_token_lifecycle_and_invalid_transitions(){
    assert!(token_move(&[(1,1000,true)],&[(1,900,true),(2,100,false)],1,false),"mint");
    assert!(token_move(&[(2,100,false)],&[(2,40,false),(3,60,false)],0,false),"split");
    assert!(token_move(&[(1,900,true),(3,60,false)],&[(1,900,true)],2,false),"joint burn");
    assert!(token_move(&[(1,900,true)],&[(1,0,true),(2,900,false)],1,false),"exhaust allowance");
    for after in [vec![(2,-100,false),(3,200,false)],vec![(2,101,false)],vec![(2,0,false),(3,100,false)],vec![(1,100,true)]]{
        assert!(!token_move(&[(2,100,false)],&after,0,false),"invalid holder transition {after:?}");
    }
    assert!(!token_move(&[(1,0,true)],&[(1,0,true),(2,1,false)],1,false),"exhausted");
    assert!(!token_move(&[(1,1000,true)],&[(1,900,true),(1,100,true)],1,false),"duplicate minter");
    assert!(!token_move(&[(1,900,true),(3,60,false)],&[(1,960,true)],2,false),"burn cannot replenish");
    assert!(!token_move(&[(2,100,false)],&[(3,100,false)],0,true),"wrong signature");
    assert!(!token_move(&[(2,100,false)],&[(3,100,false)],99,false),"unknown operation");
}

#[test]
fn split_conserves_odd_sompi_and_enforces_recipient_rules(){
    for share in [1,100,3333,5000,9900,9999]{
        let artifact=split(share);
        for fee in [0,232001,1_000_000]{let tx=split_tx(share as u64,fee);assert_eq!(tx.outputs.iter().map(|o|o.value).sum::<u64>()+fee,100_000_000);assert!(execute(&artifact,"distribute",1,tx,100_000_000,false).is_ok(),"share {share}, fee {fee}");}
    }
    let artifact=split(3333);
    // Every policy mutation is signed again by the authorized sender.
    let base=split_tx(3333,232000);let mut wrong_recipient=base.clone();wrong_recipient.outputs[0]=output(4,base.outputs[0].value);
    let mut shifted=base.clone();shifted.outputs[0].value+=1;shifted.outputs[1].value-=1;
    let mut swapped=base.clone();swapped.outputs.swap(0,1);
    let mut extra_output=base.clone();extra_output.outputs.push(output(4,1));
    let mut missing_output=base.clone();missing_output.outputs.pop();
    let mut extra_input=base.clone();extra_input.inputs.push(TransactionInput::new(TransactionOutpoint{transaction_id:TransactionId::from_bytes([8;32]),index:0},vec![],0,1));
    for (name,tx) in [("recipient",wrong_recipient),("allocation",shifted),("order",swapped),("extra output",extra_output),("missing output",missing_output),("extra input",extra_input),("fee",split_tx(3333,1_000_001))]{assert!(execute(&artifact,"distribute",1,tx,100_000_000,false).is_err(),"must reject {name}");}
    assert!(execute(&artifact,"distribute",1,base.clone(),99_999_999,false).is_err());
    assert!(execute(&artifact,"distribute",4,base.clone(),100_000_000,false).is_err());
    for share in [0,10000]{assert!(execute(&split(share),"distribute",1,base.clone(),100_000_000,false).is_err());}
}
