// A disconnected or stalled node must not hold the local wallet's operation queue.
export function bounded(promise,ms=10000){
  let timer;
  return Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('The Testnet-10 node did not answer in time.')),ms);})]).finally(()=>clearTimeout(timer));
}
