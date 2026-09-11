// A view adapter only: no SDK, keys, storage, network or transaction construction.
export const V4_LEGACY_SERVICES=Object.freeze({
 token:{contract:'contracts/public/capped-token.sil',title:'Token workshop',kind:'market',why:'Create a capped supply, issue units and transfer ownership. Token units are separate from tKAS deposits.',boundary:'Custom teaching token; not KCC-20 conforming.',fields:[{id:'name',selector:'[data-asset-name]',label:'Public token name',type:'text',maxLength:40,required:true,note:'1–40 characters. Recorded publicly; do not include private information.'}]},
 receipt:{contract:'contracts/public/backed-receipt.sil',title:'Receipt counter',kind:'market',why:'A receipt carries a claim on locked test coins. Redeeming it returns the backing to its holder.',boundary:'A test-coin claim, not a claim on money or goods outside this network.',fields:[]},
 escrow:{contract:'contracts/public/application-escrow.sil',title:'Work agreement',kind:'coordination',why:'Release payment to the seller, ask an arbiter to resolve it, or use the timed buyer refund.',boundary:'You control buyer, seller and arbiter. A signature does not prove work was delivered.',fields:[],choices:['Release to seller','Arbiter: pay seller','Arbiter: refund buyer','Buyer: timed refund']},
 treasury:{contract:'contracts/public/shared-treasury.sil',title:'Shared treasury',kind:'agent',why:'Two different member signatures must approve the withdrawal.',boundary:'You control all three role keys in this example.',fields:[],choices:['Members A + B','Members A + C','Members B + C']},
 prediction:{contract:'contracts/public/prediction-escrow.sil',title:'Outcome desk',kind:'coordination',why:'An oracle chooses the winning side after the deadline; a later refund can return both sides’ shares.',boundary:'The oracle supplies the answer. The contract checks its authority, not the truth of an outside event.',fields:[],choices:['Oracle: Yes wins','Oracle: No wins','Refund both sides']},
 proof:{contract:'contracts/public/proof-payout.sil',title:'Proof verifier',kind:'computation',why:'A published example proof must pass verification before the payout can unlock.',boundary:'Uses a fixed proof fixture, not a fresh proof of your work or private user data.',fields:[],choices:['Verify proof and pay']}
});
export function createV4LegacyServices({root,selectService,isPending=()=>false,onChange=()=>{},onError=()=>{}}={}){
 if(!root?.querySelector)throw Error('The existing public-apps root is required.');
 let selected=null,disposed=false,queued=false,last='',actions=new Map();
 const q=s=>root.querySelector(s),txt=s=>q(s)?.textContent?.trim()||'';
 // Ignore the hidden host itself: its controls are presented by the world UI.
 const available=el=>{if(!el||el.disabled)return false;for(let p=el;p&&p!==root;p=p.parentElement)if(p.hidden)return false;return true;};
 const isAsset=()=>selected==='token'||selected==='receipt';
 function snapshot(){
  if(!selected)return null;const service=V4_LEGACY_SERVICES[selected],asset=isAsset(),prefix=asset?'asset':'public';actions=new Map();
  const add=(id,selector,group='action')=>{const el=typeof selector==='string'?q(selector):selector;if(available(el)){actions.set(id,el);return {id,label:el.textContent.trim(),group};}return null;};
  const review=q(`[data-${prefix}-review]`),reviewing=review&&!review.hidden&&available(q(`[data-${prefix}-submit]`));
  const complete=asset?/scenario complete/i.test(txt('[data-asset-guide-title]')):Boolean(q('[data-public-next]')&&!q('[data-public-next]').hidden);
  const list=[];if(complete){}else if(reviewing){list.push(add('submit',`[data-${prefix}-submit]`),add('cancel',`[data-${prefix}-cancel]`));}
  else if(asset){list.push(add('next','[data-asset-guide-next]'));}
  else{list.push(add('prepare','[data-public-prepare]'),add('fund','[data-public-fund]'),add('challenge','[data-public-challenge]','precheck'));for(const [i,el]of [...root.querySelectorAll('[data-public-action-options] button')].entries())list.push(add(`option-${i}`,el));}
  list.push(add('check',asset?'[data-asset-check]':'[data-public-check-receipt]','observation'));
  const visibleActions=list.filter(Boolean).sort((a,b)=>({action:0,precheck:1,observation:2}[a.group]-{action:0,precheck:1,observation:2}[b.group])),fields=service.fields.filter(f=>available(q(f.selector))).map(f=>({...f,value:q(f.selector).value}));
  const busy=root.getAttribute('aria-busy')==='true'||Boolean(isPending());
  return {service:selected,kind:service.kind,contract:service.contract,title:asset?txt('[data-asset-guide-title]')||service.title:txt('[data-public-title]')||service.title,line:reviewing?txt(`[data-${prefix}-review-details]`):asset?txt('[data-asset-guide-text]'):[txt('[data-public-description]'),txt('[data-public-cost]')].filter(Boolean).join(' '),why:service.why,boundary:service.boundary,pending:busy,complete,reviewing,fields,actions:visibleActions,label:complete?'Back to the world':visibleActions[0]?.label||'Waiting for node observation',status:asset?[txt('[data-asset-rule-result]'),txt('[data-asset-status]')].filter(Boolean).join(' '):[txt('[data-public-challenge-result]'),txt('[data-public-receipt-state]'),txt('[data-public-message]')].filter(Boolean).join(' '),transactionId:(value=>/^[a-f0-9]{64}$/i.test(value)?value:null)(txt(asset?'[data-asset-tx]':'[data-public-transaction-link]'))};
 }
 function publish(){queued=false;if(disposed)return;const state=snapshot(),serialized=JSON.stringify(state);if(serialized===last)return;last=serialized;onChange(state?{...state,onAction:id=>invoke(id||state.actions[0]?.id)}:null);}
 function schedule(){if(queued||disposed)return;queued=true;queueMicrotask(publish);}
 function invoke(id){if(disposed||!selected)return false;try{if(root.getAttribute('aria-busy')==='true'||isPending())throw Error('The current action is still running.');const el=actions.get(id);if(!available(el)||!root.contains(el))throw Error('This action changed. Review the current step before trying again.');el.click();schedule();return true;}catch(error){onError(error);return false;}}
 async function open(id){if(!V4_LEGACY_SERVICES[id])throw Error('Unknown world service.');if(disposed)return;selected=id;last='';if(selectService)await selectService(id);else{const el=q(`[data-public-${isAsset()?'asset-kind':'kind'}="${id}"]`);if(!el)throw Error('The existing service selector is unavailable.');el.click();}publish();return snapshot();}
 function setField(id,value){const field=V4_LEGACY_SERVICES[selected]?.fields.find(f=>f.id===id),el=field&&q(field.selector);if(!field||!available(el)||root.getAttribute('aria-busy')==='true')return false;const text=String(value);if(text.length>field.maxLength)return false;el.value=text;const EventCtor=root.ownerDocument.defaultView.Event;el.dispatchEvent(new EventCtor('input',{bubbles:true}));el.dispatchEvent(new EventCtor('change',{bubbles:true}));schedule();return true;}
 const Observer=root.ownerDocument.defaultView.MutationObserver,observer=new Observer(schedule);observer.observe(root,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['hidden','disabled','aria-busy','aria-pressed']});
 return {open,snapshot,invoke,setField,refresh:publish,close(){selected=null;last='';publish();},dispose(){disposed=true;observer.disconnect();actions.clear();}};
}
