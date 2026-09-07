import {parseKas} from '../src/models.mjs';

export const NETWORK='testnet-10';
export const LIMITS=Object.freeze({payment:100000000n,fee:1000000n,total:1000000000n});
export function requireNetwork(info){
  if(info?.networkId!==NETWORK)throw new Error('Blocked: this application only permits Testnet-10.');
  if(info.isSynced!==true||info.hasUtxoIndex!==true)throw new Error('The Testnet-10 node must be synchronized and provide its UTXO index.');
}
export function paymentAmount(value){
  if(typeof value!=='string'||value.length>20)throw new Error('Enter an amount from 0.01 to 1 tKAS.');
  const amount=parseKas(value);
  if(amount===null||amount<1000000n||amount>LIMITS.payment)throw new Error('Enter an amount from 0.01 to 1 tKAS, with at most eight decimals.');
  return amount;
}
export function requireBudget({amount,fee,spent=0n}){
  if(amount<=0n||amount>LIMITS.payment||fee<0n||fee>LIMITS.fee||spent<0n||spent+amount+fee>LIMITS.total)throw new Error('The amount, fee, or cumulative test spending limit would be exceeded.');
}
export function receiptState({requested,received,expired=false,accepted=false}){
  if(received===0n)return expired?'Expired without an observed payment':'Waiting for a payment';
  if(!accepted)return 'Output observed; acceptance not yet verified';
  const amount=received<requested?'Partial payment':received>requested?'Overpayment':'Exact payment';
  return `${amount}${expired?' · checked after request expiry':''}`;
}
