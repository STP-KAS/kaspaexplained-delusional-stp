// The public site uses recorded evidence. Only a loopback page can call the local PoC.
export function createLocalWrapClient({location=globalThis.location,fetch=globalThis.fetch}={}){
 let capability=null;
 const assertLocal=()=>{if(!['http:','https:'].includes(location?.protocol)||!['localhost','127.0.0.1','[::1]','::1'].includes(location?.hostname))throw Error('The live bridge service is available only from a loopback page.');};
 async function externalStatus(){
  assertLocal();
  const response=await fetch('/api/wrap-poc/status',{signal:AbortSignal.timeout(12000)});
  if(!response.ok)throw Error('Start the local bridge PoC to connect the test oracle.');
  const result=await response.json();capability=result.capability;return result;
 }
 async function externalAction(action){
  assertLocal();
  if(!capability)await externalStatus();
  const response=await fetch('/api/wrap-poc/action',{method:'POST',headers:{'content-type':'application/json','x-wrap-capability':capability},body:JSON.stringify({action}),signal:AbortSignal.timeout(180000)});
  const result=await response.json();if(!response.ok)throw Error(result.error||'The bridge action did not complete. Check its saved status before retrying.');return result;
 }
 return {externalStatus,externalAction};
}
