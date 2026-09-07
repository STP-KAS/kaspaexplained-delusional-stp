// Bounded accepted-chain observation. This does not promise finality.
export async function observePublicAcceptance(rpc,journal,{call=p=>p,pages=3}={}){
 if(!journal.checkpoint)return {acceptingBlock:null,scanCursor:null,scanCaughtUp:false};
 let cursor=journal.scanCursor||journal.checkpoint,acceptingBlock=journal.acceptingBlock||null,caughtUp=false;
 for(let page=0;page<pages;page++){
  const history=await call(rpc.getVirtualChainFromBlock({startHash:cursor,includeAcceptedTransactionIds:true}));
  if(history.removedChainBlockHashes.includes(acceptingBlock))acceptingBlock=null;
  const match=history.acceptedTransactionIds.find(group=>group.acceptedTransactionIds.includes(journal.id));
  if(match)acceptingBlock=match.acceptingBlockHash;
  const next=history.addedChainBlockHashes.at(-1);
  if(!next||next===cursor)caughtUp=true;else cursor=next;
  if(caughtUp)break;
 }
 return {acceptingBlock,scanCursor:cursor,scanCaughtUp:caughtUp};
}
