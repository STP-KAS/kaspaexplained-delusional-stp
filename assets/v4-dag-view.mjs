// Bounded read-only node view. Solid arrows are actual header parent references.
import {observePublicAcceptance} from './public-acceptance.mjs';
const isHash=value=>typeof value==='string'&&/^[0-9a-f]{64}$/i.test(value);
const short=value=>isHash(value)?`${value.slice(0,6)}…${value.slice(-4)}`:String(value??'');
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let sequence=0;
export async function fetchV4Dag(rpc,record,call=p=>p){
 const transactionId=record?.transactionId??record?.id??record?.journal?.id;
 if(!isHash(transactionId))throw new Error('A transaction ID is required for the node view.');
 let acceptingBlock=null;
 // Do not promote a saved acceptance flag into fresh node evidence.
 if(isHash(record.checkpoint)){
  const observed=await observePublicAcceptance(rpc,{id:transactionId,checkpoint:record.checkpoint},{call,pages:5});
  acceptingBlock=observed.acceptingBlock;
 }
 const result={transactionId,acceptingBlock,status:acceptingBlock?'accepted':'pending',parents:[],inputs:record.inputs??[],outputs:record.outputs??[]};
 if(acceptingBlock){
  const {block}=await call(rpc.getBlock({hash:acceptingBlock,includeTransactions:false}));
  if((block.header?.hash??block.verboseData?.hash)!==acceptingBlock)throw new Error('The node returned a different accepting block.');
  const parents=block.header?.parentsByLevel?.[0];
  if(!Array.isArray(parents)||parents.some(parent=>!isHash(parent)))throw new Error('The node returned incomplete direct-parent data.');
  result.parents=[...new Set(parents)];result.nodeVerified=true;
 }
 if(isHash(record.containingBlock)){
  const {block}=await call(rpc.getBlock({hash:record.containingBlock,includeTransactions:true}));
  if((block.header?.hash??block.verboseData?.hash)!==record.containingBlock)throw new Error('The node returned a different containing block.');
  const ids=block.verboseData?.transactionIds??block.transactions?.map(t=>t.verboseData?.transactionId??t.id);
  if(!ids?.includes(transactionId))throw new Error('The supplied containing block does not contain this transaction.');
  result.containingBlock=record.containingBlock;
 }
 return result;
}
export function mountV4Dag(container){
 const id=`v4-dag-${++sequence}`,motion=matchMedia('(prefers-reduced-motion: reduce)');let current={},tip=null,playing=true,disposed=false,compact=container.clientWidth<570;
 container.classList.add('v4-dag-view');
 const style=document.createElement('style');style.textContent=`.v4-dag-view{position:relative;color:var(--text,#dbe8e1);min-width:0}.v4-dag-view svg{display:block;width:100%;height:auto;overflow:visible}.v4-dag-view .dag-ledger{fill:var(--paper,#132620);stroke:var(--muted,#6b9687);stroke-width:1}.v4-dag-view .dag-core{fill:var(--green-soft,#193e32);stroke:var(--green,#67caa6);stroke-width:1.5}.v4-dag-view .dag-parent{fill:none;stroke:var(--green,#67caa6);stroke-width:1.4}.v4-dag-view .dag-flow{fill:none;stroke:var(--muted,#6b9687);stroke-width:1;stroke-dasharray:3 5}.v4-dag-view text{fill:currentColor;font-family:inherit;font-size:12px}.v4-dag-view .dag-heading{font-size:11px;fill:var(--muted,#92aa9e);letter-spacing:.8px}.v4-dag-view .dag-hash{font-family:ui-monospace,monospace;font-size:10px}.v4-dag-view .dag-particle{fill:var(--green,#67caa6)}.v4-dag-view .dag-node{cursor:default}.v4-dag-view .dag-node:focus-visible{outline:none}.v4-dag-view .dag-node:focus-visible rect{stroke-width:3}.v4-dag-view .dag-status{display:flex;justify-content:space-between;gap:12px;font-size:12px;color:var(--muted,#92aa9e);margin:0 0 8px}.v4-dag-view .dag-status strong{font-weight:500;color:var(--text,#dbe8e1)}`;
 container.append(style);const content=document.createElement('div');container.append(content);
 function ledger(x,y,width,label,hash,core=false){return `<g class="dag-node" transform="translate(${x} ${y})"${isHash(hash)?' tabindex="0" role="img"':''} aria-label="${escape(label)}${hash?`: ${escape(hash)}`:''}"><title>${escape(label)}${hash?` · ${escape(hash)}`:''}</title><rect class="${core?'dag-core':'dag-ledger'}" x="${-width/2}" y="-21" width="${width}" height="42" rx="2"/><path d="M${-width/2+9} -8 H${width/2-9}" stroke="currentColor" opacity=".18"/><text text-anchor="middle" y="7">${escape(label)}</text>${hash?`<text class="dag-hash" text-anchor="middle" y="35">${escape(short(hash))}</text>`:''}</g>`;}
 function particle(path,index){return motion.matches?'':`<circle class="dag-particle" r="2.8"><animateMotion dur="${2.3+index*.3}s" begin="-${index*.4}s" repeatCount="indefinite" path="${path}"/></circle>`;}
 function render(){
  if(disposed)return;
  const tx=isHash(current.transactionId)?current.transactionId:null,accepting=isHash(current.acceptingBlock)?current.acceptingBlock:null,hasTip=Boolean(tip&&isHash(tip.hash)),block=hasTip?tip.hash:accepting,parents=block?[...new Set(((hasTip?tip.parents:current.parents)??[]).filter(isHash))]:[],shown=parents.slice(0,4),hasNode=Boolean(block),inputs=Array.isArray(current.inputs)?current.inputs:[],outputs=Array.isArray(current.outputs)?current.outputs:[];
  const width=compact?360:760,height=compact?(hasTip&&accepting?470:410):270;
  const left=compact?55:65,center=compact?180:215,right=compact?305:365,flowY=compact?70:85,blockX=compact?180:530,blockY=compact?(hasTip&&accepting?290:225):135;
  const flowA=`M${left+41} ${flowY} H${center-49}`,flowB=`M${center+49} ${flowY} H${right-41}`,history=compact?`M${center} ${flowY+42} V${blockY-23}`:`M${center} ${flowY+44} V${blockY+54} H${blockX} V${blockY+24}`;
  let drawing=`<path class="dag-flow" d="${flowA}"/><path class="dag-flow" d="${flowB}"/>${particle(flowA,0)}${particle(flowB,1)}${ledger(left,flowY,82,inputs.length?`${inputs.length} inputs`:'UTXOs',null)}${ledger(center,flowY,98,'Transaction',tx,true)}${ledger(right,flowY,82,outputs.length?`${outputs.length} outputs`:'Next state',null)}<text class="dag-heading" x="${center}" y="19" text-anchor="middle">${tx?'SELECTED TRANSACTION':'ILLUSTRATIVE TRANSACTION FLOW'}</text>`;
  if(hasNode){
   if(hasTip){
    drawing+=ledger(blockX,blockY,120,tip.unavailable?'Last observed block':tip.source==='stream'?'Observed block':'Sampled node tip',block,true);
    if(accepting){const ay=compact?175:220,ax=compact?180:center,acceptedPath=`M${center} ${flowY+42} V${ay-23}`;drawing+=`<path class="dag-flow" d="${acceptedPath}"/>${particle(acceptedPath,2)}${ledger(ax,ay,120,'Accepting block',accepting,true)}`;}
   }else drawing+=`<path class="dag-flow" d="${history}"/>${particle(history,2)}${ledger(blockX,blockY,120,'Accepting block',block,true)}`;
   shown.forEach((parent,index)=>{
    const x=compact?(shown.length===1?180:45+index*(270/(shown.length-1))):690,y=compact?(hasTip&&accepting?410:340):24+index*64;
    const path=compact?`M${blockX} ${blockY+39} L${x} ${y-23}`:`M${blockX+63} ${blockY} L${x-47} ${y}`;
    drawing+=`<path class="dag-parent" d="${path}" marker-end="url(#${id}-arrow)"/>${ledger(x,y,compact?78:88,'Parent',parent)}`;
   });
   if(parents.length>shown.length)drawing+=`<text class="dag-heading" x="${compact?180:685}" y="${compact?(hasTip&&accepting?469:399):267}" text-anchor="middle">+${parents.length-shown.length} more direct parents</text>`;
  }else drawing+=`<text class="dag-heading" x="${width/2}" y="${compact?210:200}" text-anchor="middle">${tx?'Waiting for accepted-chain observation':'Parent references appear after a node check'}</text>`;
  const status=hasTip?(tip.unavailable?'Last observed node block':tip.source==='stream'?'Live block stream':'Sampled node tip'):hasNode?'Accepted-chain observation':tx?'Prepared or pending transaction':'Illustrative flow';
  content.innerHTML=`<div class="dag-status"><strong>${escape(status)}</strong><span>${hasNode?`${parents.length} real parent reference${parents.length===1?'':'s'}`:'No block references inferred'}</span></div><svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${escape(status)}. Dashed lines show transaction flow. Solid arrows point to actual earlier parent blocks."><defs><marker id="${id}-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M1 1 L8 5 L1 9" fill="none" stroke="currentColor" stroke-width="1.4"/></marker></defs>${drawing}</svg>${current.containingBlock?`<p class="dag-status">Containing block: <span title="${escape(current.containingBlock)}">${escape(short(current.containingBlock))}</span></p>`:''}`;
  const svg=content.querySelector('svg');if(!playing||motion.matches)svg.pauseAnimations?.();
 }
 const observer=new ResizeObserver(entries=>{const next=entries[0].contentRect.width<570;if(next!==compact){compact=next;render();}});observer.observe(container);
 const reduced=()=>render();motion.addEventListener('change',reduced);render();
 return {update(record={}){current={...record};render();},updateTip(record){if(record?.unavailable){if(tip)tip={...tip,unavailable:true};}else{if(!isHash(record?.hash)||!Array.isArray(record.parents)||record.parents.some(parent=>!isHash(parent)))throw new Error('Live DAG requires a real tip hash and direct parent hashes.');tip={...record,parents:[...new Set(record.parents)]};}render();},setPlaying(value){playing=Boolean(value);const svg=content.querySelector('svg');if(playing&&!motion.matches)svg?.unpauseAnimations?.();else svg?.pauseAnimations?.();},dispose(){disposed=true;observer.disconnect();motion.removeEventListener('change',reduced);content.remove();style.remove();container.classList.remove('v4-dag-view');}};
}

// Real block-added events drive the view when available. One sampled poll at a
// time provides initial state and a fallback if notifications stop.
export function watchV4Dag(rpc,view,{call=p=>p,onError=()=>{},intervalMs=2500}={}){
 const delay=Math.max(1000,Math.min(30000,Number(intervalMs)||2500));
 let stopped=false,inFlight=false,timer=null,lastStreamAt=0,streamVersion=0;
 const visible=()=>typeof document==='undefined'||!document.hidden;
 const schedule=()=>{if(!stopped&&visible())timer=setTimeout(poll,delay);};
 async function poll(){
  clearTimeout(timer);timer=null;if(stopped||inFlight||!visible())return;
  if(lastStreamAt&&Date.now()-lastStreamAt<5000){schedule();return;}inFlight=true;const version=streamVersion;
  try{
   const {sink}=await call(rpc.getSink());if(stopped||!visible())return;if(!isHash(sink))throw new Error('The node returned no valid DAG tip.');
   const {block}=await call(rpc.getBlock({hash:sink,includeTransactions:false}));
   if((block.header?.hash??block.verboseData?.hash)!==sink)throw new Error('The node returned a different DAG tip.');
   const parents=block.header?.parentsByLevel?.[0];if(!Array.isArray(parents)||parents.some(p=>!isHash(p)))throw new Error('The node returned incomplete tip parents.');
   if(!stopped&&visible()&&version===streamVersion)view.updateTip({hash:sink,parents:[...new Set(parents)],checked:new Date().toISOString(),daaScore:String(block.header.daaScore??''),source:'sampled'});
  }catch(error){if(!stopped){view.updateTip?.({unavailable:true});try{onError(error);}catch{}}}
  finally{inFlight=false;schedule();}
 }
 const canStream=typeof rpc.subscribeBlockAdded==='function'&&typeof rpc.addEventListener==='function'&&typeof rpc.removeEventListener==='function';
 const added=event=>{if(stopped||!visible())return;try{const block=event?.data?.block??event?.block,hash=block?.header?.hash??block?.verboseData?.hash,parents=block?.header?.parentsByLevel?.[0];if(!isHash(hash)||!Array.isArray(parents)||parents.some(parent=>!isHash(parent)))throw new Error('The block notification has incomplete header references.');lastStreamAt=Date.now();streamVersion++;view.updateTip({hash,parents:[...new Set(parents)],daaScore:String(block.header.daaScore??''),checked:new Date().toISOString(),source:'stream'});}catch(error){lastStreamAt=0;try{onError(error);}catch{}}};
 const subscribe=()=>{if(stopped||!canStream)return;Promise.resolve().then(()=>stopped?null:call(rpc.subscribeBlockAdded())).catch(error=>{if(!stopped){lastStreamAt=0;try{onError(error);}catch{}}});};
 const disconnected=()=>{lastStreamAt=0;if(!stopped)view.updateTip?.({unavailable:true});};
 if(canStream){rpc.addEventListener('block-added',added);rpc.addEventListener('connect',subscribe);rpc.addEventListener('disconnect',disconnected);subscribe();}
 const visibility=()=>{clearTimeout(timer);timer=null;if(visible())void poll();};
 if(typeof document!=='undefined')document.addEventListener('visibilitychange',visibility);
 void poll();
 return ()=>{stopped=true;clearTimeout(timer);if(canStream){rpc.removeEventListener('block-added',added);rpc.removeEventListener('connect',subscribe);rpc.removeEventListener('disconnect',disconnected);}/* Do not unsubscribe the shared RPC: another view may own the same subscription. */if(typeof document!=='undefined')document.removeEventListener('visibilitychange',visibility);};
}
