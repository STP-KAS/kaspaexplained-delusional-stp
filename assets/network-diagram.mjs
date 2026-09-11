// Both responsive drawings use the same calculated snapshot and reference graph.
export function networkDiagram(s,{interactive=false,selected=null,id='network'}={}){
  const visible=[true,s.foundB,s.foundC,s.time>=1200];
  const heading=!s.foundB?'Both miners know the earlier block':!s.foundC?'One miner finds a new block':s.parallel?'Two miners. Two independent blocks.':'The next miner builds on that block.';
  const explanation=!s.foundB?'Each miner can start looking for the next block.':!s.foundC?(s.time>=s.receivedB?'The news reaches miner 2. It can build on B.':'The news is still traveling. Miner 2 has not seen B yet.'):s.parallel?'Miner 2 found C before hearing about B. Both blocks build on A.':'Miner 2 heard about B in time. Its block C builds on B.';
  const names=['A','B','C','D'];
  const labels=['Earlier block','Miner 1 · 100 ms','Miner 2 · 400 ms','Possible later block'];
  const relations=['Known to both','References A',`References ${s.parent}`,s.parallel?'To B + C':'References C'];
  const paths=s.parallel?[[1,0],[2,0],[3,1],[3,2]]:[[1,0],[2,1],[3,2]];
  const svg=compact=>{
    const points=compact?[[75,65],[285,65],[75,245],[285,245]]:(s.parallel?[[80,175],[350,75],[350,265],[635,175]]:[[80,160],[265,160],[450,160],[635,160]]);
    const marker=`${id}-${compact?'small':'wide'}`;
    // Intersect the reference ray with each ledger's perimeter, keeping arrows
    // outside the header and transaction rows, including diagonal mobile edges.
    const anchor=(from,to,padding)=>{
      const dx=to[0]-from[0],dy=to[1]-from[1];
      const scale=Math.min((56+padding)/Math.abs(dx),(49+padding)/Math.abs(dy));
      return [from[0]+dx*scale,from[1]+dy*scale];
    };
    const edges=paths.filter(([from,to])=>visible[from]&&visible[to]).map(([from,to])=>{
      const start=anchor(points[from],points[to],5),end=anchor(points[to],points[from],10);
      const route=compact&&((from===2&&to===0)||(from===3&&to===1))?`M${points[from][0]+(from===2?-61:61)} ${points[from][1]} H${from===2?7:353} V${points[to][1]} H${points[to][0]+(from===2?-66:66)}`:`M${start.join(' ')} L${end.join(' ')}`;
      return `<path class="ledger-reference" data-from="${names[from]}" data-to="${names[to]}" d="${route}" marker-end="url(#${marker})"/><circle class="ledger-port" cx="${compact&&((from===2&&to===0)||(from===3&&to===1))?points[from][0]+(from===2?-61:61):start[0]}" cy="${compact&&((from===2&&to===0)||(from===3&&to===1))?points[from][1]:start[1]}" r="2.5"/>`;
    }).join('');
    const blocks=points.map(([x,y],i)=>visible[i]?`<g class="diagram-block ledger-block" data-block="${names[i]}" ${interactive?`role="button" tabindex="0" aria-pressed="${selected===names[i]}"`:'role="img"'} aria-label="Block ${names[i]}. ${labels[i]}. ${relations[i]}" transform="translate(${x} ${y})">
      <path class="ledger-stack" d="M-53 -42 H60 V51 H-53 Z M-50 -39 H63 V54 H-50"/>
      <rect class="ledger-sheet" x="-56" y="-49" width="112" height="96" rx="1"/>
      <path class="ledger-header" d="M-56 -49 H56 V-10 H-56 Z"/>
      <text class="ledger-id" x="-44" y="-23">${names[i]}</text>
      <text class="ledger-type" x="-18" y="-30">BLOCK</text>
      <text class="ledger-parent" x="-18" y="-17">${['earlier', 'ref A',`ref ${s.parent}`,s.parallel?'ref B+C':'ref C'][i]}</text>
      <text class="ledger-row-label" x="-44" y="5">TRANSACTIONS</text>
      <g class="ledger-transactions" aria-hidden="true">${[15,26,37].map((row,j)=>`<rect x="-44" y="${row-4}" width="5" height="5"/><path d="M-33 ${row-1.5} H${j===1?20:38}"/><path class="ledger-row-end" d="M42 ${row-4} V${row+1}"/>`).join('')}</g>
      <text class="ledger-owner" y="77" text-anchor="middle">${compact?['<tspan x="0">Earlier block</tspan>','<tspan x="0">Miner 1</tspan><tspan x="0" dy="17">100 ms</tspan>','<tspan x="0">Miner 2</tspan><tspan x="0" dy="17">400 ms</tspan>','<tspan x="0">Possible later</tspan><tspan x="0" dy="17">block</tspan>'][i]:labels[i]}</text>
    </g>`:'').join('');
    return `<svg class="network-drawing ledger-drawing ${compact?'drawing-small':'drawing-wide'}" viewBox="0 0 ${compact?'360 350':'720 380'}" role="group" aria-label="${s.parallel?'Parallel block references':'Sequential block references'}"><defs><marker id="${marker}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M1 1 L8 5 L1 9" fill="none" stroke="currentColor" stroke-width="1.4"/></marker></defs>${edges}${blocks}</svg>`;
  };
  return `<div class="diagram-caption"><strong>${heading}</strong><p>${explanation}</p><small>Arrows reference earlier blocks.${s.time>=1200?' D shows how a later block can connect the history.':''}</small></div>${svg(false)}${svg(true)}`;
}
