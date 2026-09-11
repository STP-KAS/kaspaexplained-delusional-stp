const integer=(value,min,max)=>{
  if(!Number.isSafeInteger(value)||value<min||value>max)throw new RangeError('Outside this model’s range.');
  return value;
};

// All dollar quantities are integer cents. Independent snapshots, not a ledger.
export function redemption(requested=4000){
  integer(requested,0,10000);
  const paid=Math.min(requested,2000);
  return {requested,paid,pending:requested-paid,cash:2000-paid,treasuries:8000,outstanding:10000-paid,reserves:10000-paid};
}

export function collateral(price=1000){
  integer(price,100,2000);
  const units=10,debt=5000,value=units*price,thresholdBps=7500;
  return {units,price,debt,value,thresholdBps,health:value*thresholdBps/(debt*10000),eligible:value*thresholdBps<debt*10000};
}

export function settlement(outcome='pending'){
  if(!['pending','yes','no'].includes(outcome))throw new RangeError('Unknown outcome.');
  return {outcome,locked:outcome==='pending'?10000:0,yes:outcome==='yes'?10000:0,no:outcome==='no'?10000:0,total:10000};
}
