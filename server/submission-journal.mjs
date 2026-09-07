import {createHash} from 'node:crypto';

const digest=value=>createHash('sha256').update(value).digest('hex');
const publicFields=['id','requestId','network','amount','fee','state','checkpoint','created','submissionError','scanCursor','scanCaughtUp','acceptingBlock','checked','verifiedAmount'];

export function publicTransaction(record){
  if(!record)return null;
  const result=Object.fromEntries(publicFields.filter(key=>record[key]!==undefined).map(key=>[key,record[key]]));
  result.recovery=record.journal?.signedTransaction ? (record.journal.attempts.length?'review-rebroadcast':'prepared') : 'unavailable';
  return result;
}

export function submissionJournal(pending){
  const signedTransaction=pending.serializeToSafeJSON();
  // Parse before saving. An incomplete serialization must never reach submission.
  const tx=JSON.parse(signedTransaction);
  if(!Array.isArray(tx.inputs)||!tx.inputs.length||!Array.isArray(tx.outputs)||!tx.outputs.length)throw new Error('The signed transaction could not be saved for recovery.');
  return {version:1,signedTransaction,digest:digest(signedTransaction),attempts:[]};
}

export function restoreSubmission(sdk,record){
  const journal=record.journal;
  if(!journal||journal.version!==1||typeof journal.signedTransaction!=='string'||digest(journal.signedTransaction)!==journal.digest||!Array.isArray(journal.attempts))throw new Error('This submission has no valid recovery record. Keep its spending reservation and investigate locally.');
  const tx=sdk.Transaction.deserializeFromSafeJSON(journal.signedTransaction);
  tx.finalize();
  if(tx.id!==record.id)throw new Error('The saved transaction does not match its recorded ID. Nothing was sent.');
  return tx;
}
