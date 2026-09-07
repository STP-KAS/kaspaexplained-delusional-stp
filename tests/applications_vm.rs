// Unfunded, deterministic fixtures. Executes the repository's exact .sil files.
// Runs inside the pinned SilverScript workspace; see check-contract-vm.mjs.
mod common;
use common::{bytecode,encode_entry_sig_script,push_redeem_script};
use kaspa_consensus_core::hashing::sighash::{calc_schnorr_signature_hash,SigHashReusedValuesUnsync};
use kaspa_consensus_core::hashing::sighash_type::SIG_HASH_ALL;
use kaspa_consensus_core::mass::units::{Gram};
use kaspa_consensus_core::tx::{PopulatedTransaction,ScriptPublicKey,Transaction,TransactionId,TransactionInput,TransactionOutpoint,TransactionOutput,UtxoEntry,VerifiableTransaction};
use kaspa_txscript::{EngineCtx,EngineFlags,TxScriptEngine,pay_to_script_hash_script};
use kaspa_txscript::caches::Cache;
use kaspa_txscript::covenants::CovenantsContext;
use kaspa_txscript::opcodes::codes::OpCheckSig;
use kaspa_txscript::script_builder::ScriptBuilder;
use silverscript_abi::{ArtifactValue,SilAbiArtifact};
use silverscript_lang::compiler::{CompileOptions,compile_to_sil_abi_artifact_with_options};
use secp256k1::{Keypair,Secp256k1,SecretKey};


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
fn execute(artifact:&SilAbiArtifact,entry:&str,signers:&[u8],extra:Vec<ArtifactValue>,mut tx:Transaction,deposit:u64,mutate_after:bool,budget:u16)->Result<(),kaspa_txscript_errors::TxScriptError> {
    tx.version=1;
    tx.inputs[0]=TransactionInput::new_with_compute_budget(tx.inputs[0].previous_outpoint.clone(),vec![],tx.inputs[0].sequence,budget);
    let entries=vec![UtxoEntry::new(deposit,pay_to_script_hash_script(&bytecode(artifact)),0,false,None);tx.inputs.len()];
    let digest=calc_schnorr_signature_hash(&PopulatedTransaction::new(&tx,entries.clone()),0,SIG_HASH_ALL,&SigHashReusedValuesUnsync::new());
    let message=secp256k1::Message::from_digest_slice(digest.as_bytes().as_slice()).unwrap();
    let mut args:Vec<ArtifactValue>=signers.iter().map(|signer|{let mut signature=key(*signer).sign_schnorr(message).as_ref().to_vec();signature.push(SIG_HASH_ALL.to_u8());signature.into()}).collect();
    args.extend(extra);
    let mut script=encode_entry_sig_script(artifact,entry,&args).unwrap();script.extend(push_redeem_script(&bytecode(artifact)));
    tx.inputs[0].signature_script=script;
    if mutate_after {tx.outputs[0]=output(8,tx.outputs[0].value);}
    tx.finalize();
    let input=tx.inputs[0].clone();let populated=PopulatedTransaction::new(&tx,entries);
    let covenants=CovenantsContext::from_tx(&populated).unwrap();let reused=SigHashReusedValuesUnsync::new();let cache=Cache::new(100);
    let mut vm=TxScriptEngine::from_transaction_input_with_script_units_limit(&populated,&input,0,populated.utxo(0).unwrap(),EngineCtx::new(&cache).with_reused(&reused).with_covenants_ctx(&covenants),EngineFlags{covenants_enabled:true,sigop_script_units:Gram(1000).into()},input.compute_commit.allowed_script_units());
    vm.execute()
}
const PRINCIPAL:u64=20_000_000;
const FEE:u64=300_000;
const TIME:u64=1_800_000_000_000;
fn run(a:&SilAbiArtifact,e:&str,s:&[u8],x:Vec<ArtifactValue>,outs:Vec<TransactionOutput>,time:u64)->bool {
 execute(a,e,s,x,transaction(outs,time),PRINCIPAL,false,40).is_ok()
}

#[test]
fn escrow_roles_destinations_and_refund_boundary(){
 let a=compile("application-escrow.sil",&[pk(1),pk(2),pk(3),(TIME as i64).into(),(PRINCIPAL as i64).into(),1_000_000i64.into()]);
 assert!(run(&a,"release",&[1],vec![],vec![output(2,PRINCIPAL-FEE)],0));
 for (choice,dest) in [(true,2),(false,1)]{assert!(run(&a,"resolve",&[3],vec![choice.into()],vec![output(dest,PRINCIPAL-FEE)],0));}
 assert!(run(&a,"refund",&[1],vec![],vec![output(1,PRINCIPAL-FEE)],TIME));
 assert!(!run(&a,"refund",&[1],vec![],vec![output(1,PRINCIPAL-FEE)],TIME-1));
 for signer in [2,3,4]{assert!(!run(&a,"release",&[signer],vec![],vec![output(2,PRINCIPAL-FEE)],0));}
 for outputs in [vec![output(4,PRINCIPAL-FEE)],vec![output(2,PRINCIPAL-1_000_001)],vec![output(2,PRINCIPAL+1)],vec![output(2,PRINCIPAL-FEE),output(4,1)]]{assert!(!run(&a,"release",&[1],vec![],outputs,0));}
 assert!(!run(&a,"resolve",&[3],vec![true.into()],vec![output(1,PRINCIPAL-FEE)],0));
 let mut tx=transaction(vec![output(1,PRINCIPAL-FEE)],TIME);tx.inputs[0].sequence=u64::MAX;
 assert!(execute(&a,"refund",&[1],vec![],tx,PRINCIPAL,false,40).is_err());
 assert!(execute(&a,"release",&[1],vec![],transaction(vec![output(2,PRINCIPAL-FEE)],0),PRINCIPAL-1,false,40).is_err());
}

#[test]
fn treasury_any_pair_but_never_one_member_or_changed_approval(){
 let a=compile("shared-treasury.sil",&[pk(1),pk(2),pk(3),(PRINCIPAL as i64).into(),1_000_000i64.into()]);
 for (pair,signers) in [(0,[1,2]),(1,[1,3]),(2,[2,3])]{
  for recipient in [4,5]{assert!(run(&a,"spend",&signers,vec![(pair as i64).into(),pk(recipient)],vec![output(recipient,PRINCIPAL-FEE)],0));}
  assert!(execute(&a,"spend",&signers,vec![(pair as i64).into(),pk(4)],transaction(vec![output(4,PRINCIPAL-FEE)],0),PRINCIPAL,true,40).is_err());
 }
 for signers in [[1,1],[2,2],[1,4]]{assert!(!run(&a,"spend",&signers,vec![0i64.into(),pk(4)],vec![output(4,PRINCIPAL-FEE)],0));}
 assert!(!run(&a,"spend",&[1,2],vec![3i64.into(),pk(4)],vec![output(4,PRINCIPAL-FEE)],0));
 assert!(!run(&a,"spend",&[1,2],vec![0i64.into(),pk(4)],vec![output(5,PRINCIPAL-FEE)],0));
 assert!(!run(&a,"spend",&[1,2],vec![0i64.into(),pk(4)],vec![output(4,PRINCIPAL-1_000_001)],0));
 let duplicated=compile("shared-treasury.sil",&[pk(1),pk(1),pk(3),(PRINCIPAL as i64).into(),1_000_000i64.into()]);
 assert!(!run(&duplicated,"spend",&[1,1],vec![0i64.into(),pk(4)],vec![output(4,PRINCIPAL-FEE)],0));
}

#[test]
fn prediction_oracle_and_timeout_refund(){
 let a=compile("prediction-escrow.sil",&[pk(1),pk(2),pk(3),(TIME as i64).into(),((TIME+120000) as i64).into(),(PRINCIPAL as i64).into(),1_000_000i64.into()]);
 for (choice,dest) in [(true,1),(false,2)]{assert!(run(&a,"settle",&[3],vec![choice.into()],vec![output(dest,PRINCIPAL-FEE)],TIME));}
 assert!(!run(&a,"settle",&[3],vec![true.into()],vec![output(1,PRINCIPAL-FEE)],TIME-1));
 assert!(!run(&a,"settle",&[1],vec![true.into()],vec![output(1,PRINCIPAL-FEE)],TIME));
 assert!(!run(&a,"settle",&[3],vec![false.into()],vec![output(1,PRINCIPAL-FEE)],TIME));
 let net=PRINCIPAL-FEE-1;let outputs=vec![output(1,net/2),output(2,net-net/2)];
 assert!(run(&a,"refund",&[1],vec![],outputs.clone(),TIME+120000));
 assert!(!run(&a,"refund",&[1],vec![],outputs.clone(),TIME+119999));
 let mut stolen=outputs.clone();stolen[0].value+=1;stolen[1].value-=1;
 assert!(!run(&a,"refund",&[1],vec![],stolen,TIME+120000));
 assert!(run(&a,"refund",&[2],vec![],outputs.clone(),TIME+120000));
 assert!(!run(&a,"refund",&[3],vec![],outputs,TIME+120000));
}

#[test]
fn reserve_receipt_returns_full_principal_and_only_fee_reserve_can_shrink(){
 let principal=19_000_000;
 let a=compile("reserve-receipt.sil",&[pk(2),pk(1),principal.into(),1_000_000i64.into()]);
 let outputs=vec![output(2,principal as u64),output(1,1_000_000-FEE)];
 assert!(run(&a,"redeem",&[2],vec![],outputs.clone(),0));
 assert!(!run(&a,"redeem",&[1],vec![],outputs.clone(),0));
 for mutation in 0..5{let mut wrong=outputs.clone();match mutation{0=>wrong[0].value-=1,1=>wrong[0].value+=1,2=>wrong[1].value=1_000_001,3=>wrong[0]=output(3,principal as u64),_=>wrong.push(output(3,1))};assert!(!run(&a,"redeem",&[2],vec![],wrong,0));}
 assert!(execute(&a,"redeem",&[2],vec![],transaction(outputs,0),PRINCIPAL-1,false,40).is_err());
}

#[test]
fn bound_groth16_payout_accepts_fixture_and_rejects_tampering(){
 let (vk,proof,inputs)=kaspa_txscript::zk_precompiles::tests::helpers::load_groth_fields();
 let mut constructor=vec![pk(1),vk.into()];constructor.extend(inputs.into_iter().map(Into::into));constructor.extend([(PRINCIPAL as i64).into(),1_000_000i64.into()]);
 let a=compile("proof-payout.sil",&constructor);
 let tx=transaction(vec![output(1,PRINCIPAL-FEE)],0);
 assert!(execute(&a,"verify",&[1],vec![proof.clone().into()],tx.clone(),PRINCIPAL,false,1800).is_ok());
 let mut bad=proof.clone();bad[0]^=1;
 assert!(execute(&a,"verify",&[1],vec![bad.into()],tx.clone(),PRINCIPAL,false,1800).is_err());
 assert!(execute(&a,"verify",&[2],vec![proof.clone().into()],tx.clone(),PRINCIPAL,false,1800).is_err());
 assert!(execute(&a,"verify",&[1],vec![proof.clone().into()],tx.clone(),PRINCIPAL,false,100).is_err());
 assert!(execute(&a,"verify",&[1],vec![proof.into()],tx,PRINCIPAL,true,1800).is_err());
}

#[test]
fn javascript_transaction_builder_signatures_execute_in_pinned_vm(){
 let root=std::path::PathBuf::from(std::env::var("KE_CONTRACT_DIR").unwrap());
 let fixture_path=root.parent().unwrap().join(".cache/contracts/application-runtime-fixtures.json");
 let fixtures:serde_json::Value=serde_json::from_str(&std::fs::read_to_string(fixture_path).expect("run node scripts/application-fixtures.mjs before the VM suite")).unwrap();
 let number=|v:&serde_json::Value|->u64{v.as_u64().unwrap_or_else(||v.as_str().unwrap().parse().unwrap())};
 let hex=|s:&str|kaspa_txscript::hex::decode(s).unwrap();
 let mut count=0;
 for fixture in fixtures.as_array().unwrap(){
  if fixture.get("blocked").is_some(){continue;}
  let raw=&fixture["transaction"];let input=&raw["inputs"][0];
  let inputs=vec![TransactionInput::new_with_compute_budget(TransactionOutpoint{transaction_id:TransactionId::from_bytes(hex(input["transactionId"].as_str().unwrap()).try_into().unwrap()),index:number(&input["index"]) as u32},hex(input["signatureScript"].as_str().unwrap()),number(&input["sequence"]),number(&input["computeBudget"]) as u16)];
  let outputs=raw["outputs"].as_array().unwrap().iter().map(|o|{let bytes=hex(o["scriptPublicKey"].as_str().unwrap());TransactionOutput{value:number(&o["value"]),script_public_key:ScriptPublicKey::new(u16::from_le_bytes([bytes[0],bytes[1]]),bytes[2..].to_vec().into()),covenant:None}}).collect();
  let tx=Transaction::new(1,inputs,outputs,number(&raw["lockTime"]),Default::default(),0,vec![]).with_storage_mass(number(&raw["storageMass"]));
  let entries=vec![UtxoEntry::new(number(&fixture["deposit"]),pay_to_script_hash_script(&hex(fixture["script"].as_str().unwrap())),0,false,None)];
  let populated=PopulatedTransaction::new(&tx,entries);let covenants=CovenantsContext::from_tx(&populated).unwrap();let reused=SigHashReusedValuesUnsync::new();let cache=Cache::new(100);
  let mut vm=TxScriptEngine::from_transaction_input_with_script_units_limit(&populated,&tx.inputs[0],0,populated.utxo(0).unwrap(),EngineCtx::new(&cache).with_reused(&reused).with_covenants_ctx(&covenants),EngineFlags{covenants_enabled:true,sigop_script_units:Gram(1000).into()},tx.inputs[0].compute_commit.allowed_script_units());
  assert!(vm.execute().is_ok(),"JavaScript signed transaction: {} {}",fixture["kind"],fixture["entry"]);count+=1;
 }
 assert_eq!(count,12,"all non-proof spending routes must execute");
}
