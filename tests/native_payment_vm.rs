// Executes browser-constructed public templates and exact signed SDK transactions.
// Deterministic unfunded keys and outpoints; never uses a private wallet or RPC.
use kaspa_consensus_core::{Hash,hashing::sighash::SigHashReusedValuesUnsync};
use kaspa_consensus_core::mass::units::Gram;
use kaspa_consensus_core::mass::{MassCalculator,transaction_estimated_serialized_size};
use kaspa_consensus_core::config::params::TESTNET_PARAMS;
use kaspa_consensus_core::tx::{CovenantBinding,PopulatedTransaction,ScriptPublicKey,Transaction,TransactionId,TransactionInput,TransactionOutpoint,TransactionOutput,UtxoEntry,VerifiableTransaction};
use kaspa_txscript::{EngineCtx,EngineFlags,TxScriptEngine};
use kaspa_txscript::caches::Cache;
use kaspa_txscript::covenants::CovenantsContext;
use kaspa_txscript_errors::TxScriptError;
use serde_json::Value;

fn bytes(value:&str)->Vec<u8>{assert_eq!(value.len()%2,0);(0..value.len()).step_by(2).map(|i|u8::from_str_radix(&value[i..i+2],16).unwrap()).collect()}
fn hash(value:&str)->Hash{Hash::from_bytes(bytes(value).try_into().unwrap())}
fn string(v:&Value)->&str{v.as_str().unwrap()}
fn unsigned(v:&Value)->u64{string(v).parse().unwrap()}
fn decode(v:&Value)->(Transaction,Vec<UtxoEntry>){
 let inputs=v["inputs"].as_array().unwrap().iter().map(|i|TransactionInput::new_with_compute_budget(TransactionOutpoint{transaction_id:TransactionId::from_bytes(bytes(string(&i["transactionId"])).try_into().unwrap()),index:i["index"].as_u64().unwrap() as u32},bytes(string(&i["signatureScript"])),unsigned(&i["sequence"]),i["computeBudget"].as_u64().unwrap() as u16)).collect();
 let outputs=v["outputs"].as_array().unwrap().iter().map(|o|TransactionOutput{value:unsigned(&o["value"]),script_public_key:ScriptPublicKey::new(0,bytes(string(&o["scriptPublicKey"])).into()),covenant:(!o["covenant"].is_null()).then(||CovenantBinding{authorizing_input:o["covenant"]["authorizingInput"].as_u64().unwrap() as u16,covenant_id:hash(string(&o["covenant"]["covenantId"]))})}).collect();
 let entries=v["inputs"].as_array().unwrap().iter().map(|i|UtxoEntry::new(unsigned(&i["amount"]),ScriptPublicKey::new(0,bytes(string(&i["scriptPublicKey"])).into()),0,false,(!i["covenantId"].is_null()).then(||hash(string(&i["covenantId"]))))).collect();
 {let tx=Transaction::new(v["version"].as_u64().unwrap() as u16,inputs,outputs,unsigned(&v["lockTime"]),Default::default(),0,vec![]);tx.set_storage_mass(unsigned(&v["storageMass"]));(tx,entries)}
}
fn execute(tx:&Transaction,entries:Vec<UtxoEntry>)->Result<Vec<u64>,TxScriptError>{
 let populated=PopulatedTransaction::new(tx,entries);
 let covenants=CovenantsContext::from_tx(&populated).map_err(TxScriptError::from)?;
 let reused=SigHashReusedValuesUnsync::new();let cache=Cache::new(100);let mut units=vec![];
 for i in 0..tx.inputs.len(){
  let mut vm=TxScriptEngine::from_transaction_input_with_script_units_limit(&populated,&tx.inputs[i],i,populated.utxo(i).unwrap(),EngineCtx::new(&cache).with_reused(&reused).with_covenants_ctx(&covenants),EngineFlags{covenants_enabled:true,sigop_script_units:Gram(1000).into()},tx.inputs[i].compute_commit.allowed_script_units());
  vm.execute()?;units.push(vm.used_script_units().0);
 }
 Ok(units)
}
#[test]
fn native_payments_match_consensus_mass_and_signature_rules(){
 let data:Value=serde_json::from_str(&std::fs::read_to_string(std::env::var("KE_NATIVE_FIXTURES").unwrap()).unwrap()).unwrap();
 assert_eq!(data["network"],"testnet-10");assert_eq!(data["unfunded"],true);
 let fixtures=data["fixtures"].as_array().unwrap();assert_eq!(fixtures.len(),7);
 for fixture in fixtures{
  let name=string(&fixture["name"]);let (tx,entries)=decode(&fixture["transaction"]);
  let calc=MassCalculator::new_with_consensus_params(&TESTNET_PARAMS);
  let non=calc.calc_non_contextual_masses(&tx);
  let contextual=calc.calc_contextual_masses(&PopulatedTransaction::new(&tx,entries.clone())).unwrap();
  let mass=&fixture["mass"];
  assert_eq!(transaction_estimated_serialized_size(&tx),mass["estimatedBytes"].as_u64().unwrap(),"estimated size: {name}");
  assert_eq!(non.compute_mass,mass["computeMass"].as_u64().unwrap(),"compute mass: {name}");
  assert_eq!(non.transient_mass,mass["transientMass"].as_u64().unwrap(),"transient mass: {name}");
  let normalized=non.normalized_transient(&TESTNET_PARAMS.mempool_block_mass_cofactors().after());
  assert_eq!(normalized,mass["normalizedTransientMass"].as_u64().unwrap(),"normalized transient: {name}");
  assert_eq!(contextual.storage_mass,unsigned(&mass["storageMass"]),"storage mass: {name}");
  assert_eq!(tx.storage_mass(),contextual.storage_mass,"storage commitment: {name}");
  assert_eq!(non.compute_mass.max(normalized)*100+1000,unsigned(&mass["minimumFee"]),"relay fee + margin: {name}");
  if fixture["valid"].as_bool().unwrap(){
   let actual_fee=entries.iter().map(|i|i.amount).sum::<u64>()-tx.outputs.iter().map(|o|o.value).sum::<u64>();
   assert!(actual_fee>=unsigned(&mass["minimumFee"]),"underpriced valid fixture {name}");
   assert!(non.compute_mass<=500000&&non.transient_mass<=1000000&&contextual.storage_mass<=500000,"block-fit {name}");
  }
  let result=execute(&tx,entries);
  if fixture["valid"].as_bool().unwrap(){assert!(result.is_ok(),"{name}: {result:?}");println!("{name}: script units {:?}",result.unwrap());}
  else{assert!(result.is_err(),"must reject {name}");if name=="reject-insufficient-budget"{assert!(matches!(result,Err(TxScriptError::ExceededCommittedScriptUnits{..})),"{result:?}");}println!("{name}: {:?}",result.unwrap_err());}
 }
}
