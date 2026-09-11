import {coordinationDiagram} from './mechanism-diagrams.mjs';
// Educational state model only. No wallet, network, encryption or escrow.
const integer=(n,min,max)=>Number.isSafeInteger(n)&&n>=min&&n<=max;
export function createCoordination(){return {revision:0,participants:[
 {id:'ana',name:'Ana',balance:50,amount:40,minPeople:3,minCapital:80,authorized:true},
 {id:'ben',name:'Ben',balance:40,amount:30,minPeople:3,minCapital:80,authorized:false},
 {id:'cleo',name:'Cleo',balance:30,amount:20,minPeople:2,minCapital:50,authorized:false},
 {id:'dev',name:'Dev',balance:20,amount:10,minPeople:4,minCapital:120,authorized:true}
 ],moved:[]};}
export function changeCoordination(state,id,changes){
 if(Object.keys(changes).some(k=>!['balance','amount','minPeople','minCapital','authorized'].includes(k)))throw new Error('Unknown condition.');
 if(!state.participants.some(p=>p.id===id))throw new Error('Unknown participant.');
 const participants=state.participants.map(p=>{if(p.id!==id)return {...p};const next={...p,...changes};if(!integer(next.balance,0,1000)||!integer(next.amount,1,1000)||!integer(next.minPeople,1,4)||!integer(next.minCapital,0,4000)||typeof next.authorized!=='boolean')throw new Error('Use whole credits and between one and four people.');return next;});
 return {...state,revision:state.revision+1,participants};
}
// Conditions are minimums, so removing an ineligible person cannot help another
// person's threshold. Repeated pruning finds the largest satisfying group.
export function coordinationGroup(state){
 let group=state.participants.filter(p=>p.authorized&&p.balance>=p.amount);
 while(group.length){const capital=group.reduce((n,p)=>n+p.amount,0),next=group.filter(p=>group.length>=p.minPeople&&capital>=p.minCapital);if(next.length===group.length)return {ids:group.map(p=>p.id),capital};group=next;}
 return {ids:[],capital:0};
}
const snapshot=state=>JSON.stringify(state);
export function previewCoordination(state){return {...coordinationGroup(state),snapshot:snapshot(state)};}
export function executeCoordination(state,preview){
 if(!preview||preview.snapshot!==snapshot(state))return {ok:false,state,reason:'Conditions changed after the preview. Nothing moved. Preview the current group again.'};
 const group=coordinationGroup(state);if(!group.ids.length)return {ok:false,state,reason:'No group meets every participant’s conditions. Nothing moved.'};
 if(JSON.stringify(group.ids)!==JSON.stringify(preview.ids)||group.capital!==preview.capital)return {ok:false,state,reason:'The preview does not match the group. Nothing moved.'};
 const ids=new Set(group.ids),moved=state.participants.filter(p=>ids.has(p.id)).map(p=>({name:p.name,amount:p.amount}));
 return {ok:true,state:{...state,revision:state.revision+1,participants:state.participants.map(p=>ids.has(p.id)?{...p,balance:p.balance-p.amount,authorized:false}:{...p}),moved:[...state.moved,...moved]},moved,capital:group.capital};
}
export function mountCoordination(root){
 if(!root||root.dataset.coordinationMounted)return;root.dataset.coordinationMounted='true';
 let state=createCoordination(),preview=null;
 const list=root.querySelector('[data-coordination-people]'),status=root.querySelector('[data-coordination-status]'),summary=root.querySelector('[data-coordination-summary]'),execute=root.querySelector('[data-coordination-execute]');
 const diagram=document.createElement('div');diagram.className='mechanism-diagram';list.before(diagram);
 const say=message=>{status.textContent=message;};
 function render(){
  list.replaceChildren();for(const p of state.participants){
   const card=document.createElement('fieldset'),legend=document.createElement('legend');legend.textContent=p.name;card.append(legend);
   const balance=document.createElement('p');balance.textContent=`Available now: ${p.balance} credits`;card.append(balance);const agreement=document.createElement('p');agreement.className='coordination-agreement';card.append(agreement);
   for(const [key,label,min,max]of [['amount','I will move this many credits',1,1000],['minPeople','Only if this many people move, including me',1,4],['minCapital','And together we move at least this many credits',0,4000]]){
    const field=document.createElement('label'),input=document.createElement('input');field.textContent=label;input.type='number';input.min=min;input.max=max;input.step=1;input.value=p[key];input.setAttribute('aria-label',`${p.name}: ${label}`);input.addEventListener('change',()=>{try{state=changeCoordination(state,p.id,{[key]:Number(input.value)});say('Condition updated. Any previous preview is now stale.');renderSummary();}catch(error){input.value=state.participants.find(x=>x.id===p.id)[key];say(error.message);}});field.append(input);card.append(field);
   }
   const label=document.createElement('label');label.className='coordination-authorize';const checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.checked=p.authorized;checkbox.setAttribute('aria-label',`${p.name}: authorize conditional move`);checkbox.addEventListener('change',()=>{state=changeCoordination(state,p.id,{authorized:checkbox.checked});say(checkbox.checked?`${p.name} agreed. No credits moved.`:`${p.name} withdrew agreement. No credits moved.`);renderSummary();});label.append(checkbox,document.createTextNode('Authorize this conditional move'));card.append(label);list.append(card);
  }renderSummary();
 }
 function renderSummary(){[...list.children].forEach((card,index)=>{card.querySelector('.coordination-agreement').textContent=state.participants[index].authorized?'Agreed':'Not agreed';});const group=coordinationGroup(state),names=state.participants.filter(p=>group.ids.includes(p.id)).map(p=>p.name);summary.textContent=group.ids.length?`${names.join(', ')} can move ${group.capital} credits together. Everyone in that group meets their own conditions. Others stay where they are.`:'No group satisfies every member’s conditions yet. A willingness to move is not enough on its own.';execute.disabled=!preview;diagram.innerHTML=coordinationDiagram(state,group,preview);}
 root.querySelector('[data-coordination-preview]').addEventListener('click',()=>{preview=previewCoordination(state);say(preview.ids.length?`Preview saved: ${preview.ids.length} people, ${preview.capital} credits. Execute now, or change a balance to see why the preview can become stale.`:'Preview saved: no satisfying group. Execution will move nothing.');renderSummary();});
 execute.addEventListener('click',()=>{const result=executeCoordination(state,preview);if(result.ok){state=result.state;preview=null;say(`${result.moved.map(p=>p.name).join(', ')} moved ${result.capital} credits together. Their authorizations are consumed. Nobody else moved.`);render();}else say(result.reason);});
 root.querySelector('[data-coordination-spend]').addEventListener('click',()=>{const ana=state.participants.find(p=>p.id==='ana');state=changeCoordination(state,'ana',{balance:Math.max(0,ana.balance-25)});say('Ana spent up to 25 credits elsewhere. Authorization did not lock her balance. Any previous preview is stale.');render();});
 root.querySelector('[data-coordination-reset]').addEventListener('click',()=>{state=createCoordination();preview=null;say('Reset. Ana and Dev have agreed, but no group meets all its rules.');render();});
 render();
 return {getState:()=>structuredClone(state)};
}
