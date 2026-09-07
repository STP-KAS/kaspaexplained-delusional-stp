// Preserve meaningful section links when a historical page moves.
export function legacyDestination(target,incomingHash,validIds){
  const renamed={'collision-sim':'parallel-blocks',ghostdag:'parallel-blocks',utxo:'conflicts','confirmation-risk':'confirmation','supply-split-demo':'readiness'};
  let fragment;try{fragment=decodeURIComponent(incomingHash.replace(/^#/,''));}catch{return target;}
  const mapped=validIds.includes(fragment)?fragment:renamed[fragment];
  return mapped&&validIds.includes(mapped)?target.split('#')[0]+'#'+encodeURIComponent(mapped):target;
}
