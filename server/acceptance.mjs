// Scan in bounded pages. The node may truncate a virtual-chain response.
// Retain the cursor and accepting block together so a later reorg can revoke it.
export async function scanAcceptance(rpc,transaction,{pages=3,call=promise=>promise,onProgress=async()=>{}}={}) {
  let cursor=transaction.scanCursor||transaction.checkpoint;
  let acceptingBlock=transaction.acceptingBlock||null;
  let caughtUp=false;
  for(let page=0;page<pages;page++) {
    const history=await call(rpc.getVirtualChainFromBlock({startHash:cursor,includeAcceptedTransactionIds:true}));
    if(history.removedChainBlockHashes.includes(acceptingBlock))acceptingBlock=null;
    const match=history.acceptedTransactionIds.find(group=>group.acceptedTransactionIds.includes(transaction.id));
    if(match)acceptingBlock=match.acceptingBlockHash;
    const next=history.addedChainBlockHashes.at(-1);
    if(!next||next===cursor)caughtUp=true;
    else cursor=next;
    await onProgress({scanCursor:cursor,acceptingBlock,scanCaughtUp:caughtUp});
    if(caughtUp)break;
  }
  return {scanCursor:cursor,acceptingBlock,scanCaughtUp:caughtUp};
}
