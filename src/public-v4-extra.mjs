// Exact one-cell actions for the spending policy and delayed recovery vault.
// These checks explain policy failures; the SilverScript covenants enforce them.
import {buildV4Transition} from './public-v4-protocol.mjs';
const destination=(sdk,key)=>new sdk.PublicKey('02'+key).toAddress('testnet-10').toString();
export function buildV4Extra(sdk,{kind,action,cells,templates,payment,feeRate,fee}){
 if(!['agent','vault'].includes(kind)||!Array.isArray(cells)||cells.length!==1)throw new Error('Select one spending-policy or vault cell.');
 const cell=cells[0],state=cell.asset?.state??cell.state,total=BigInt(cell.utxo.amount),options={kind,templates,cells,feeRate,...(fee===undefined?{}:{fee})};
 if(kind==='agent'){
  if(action==='pay'){
   const value=BigInt(payment);if(value<=0n||value>BigInt(state.limit)||value>=total)throw new Error('Payment must fit the fixed per-payment limit and remaining budget.');
   return buildV4Transition(sdk,{...options,states:[{...state}],amounts:[total-value],operation:0,payments:[{address:destination(sdk,state.payee),amount:value}],feeOutputIndex:0});
  }
  if(action==='revoke')return buildV4Transition(sdk,{...options,states:[],operation:1,payments:[{address:destination(sdk,state.recovery),amount:total}]});
  throw new Error('Choose pay or revoke.');
 }
 if(action==='prepare'){
  if(state.pending)throw new Error('This vault withdrawal is already prepared.');
  return buildV4Transition(sdk,{...options,states:[{...state,pending:true}],amounts:[total],operation:0});
 }
 if(action==='cancel')return buildV4Transition(sdk,{...options,states:[],operation:1,payments:[{address:destination(sdk,state.recovery),amount:total}]});
 if(action==='release'){
  if(!state.pending)throw new Error('Prepare a withdrawal before releasing it.');
  // The sequence requirement is relative to this particular prepared UTXO.
  // The node, not this wrapper or a browser timer, checks that it has matured.
  return buildV4Transition(sdk,{...options,states:[],operation:2,sequence:state.delayDaa,payments:[{address:destination(sdk,state.recipient),amount:total}]});
 }
 throw new Error('Choose prepare, cancel, or release.');
}
