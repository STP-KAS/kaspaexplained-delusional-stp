export function v4TemplateSpecs(keys){
 const bytes=value=>({kind:'bytes',value:[...Buffer.from(value,'hex')]}),int=value=>({kind:'int',value}),bool=value=>({kind:'bool',value}),world=bytes('44'.repeat(32)),owner=bytes(keys[0]),other=bytes(keys[1]),third=bytes(keys[2]),fee=int(3000000);
 return [
 ['terrarium','v4-terrarium','V4Terrarium',[world,owner,int(1),int(1),int(3),fee]],
 ['launch','v4-launch','V4Launch',[world,owner,third,int(0),bool(false),fee]],
 ['bundle','v4-bundle','V4Bundle',[world,owner,owner,other,int(0),int(5000000),fee]],
 ['agent','v4-agent','AgentBudget',[world,bytes('55'.repeat(32)),owner,third,other,int(5000000),fee]],
 ['vault','v4-vault','RecoveryVault',[world,owner,third,other,int(100),fee,bool(false)]],
 ['compute','v4-compute','V4Compute',[world,owner,other,int(3),int(3),int(3),int(6),int(5000000),fee]]
 ];
}
