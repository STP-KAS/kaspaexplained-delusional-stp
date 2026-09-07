// Local EVM only: disposable Ganache accounts, no RPC URLs, wallets or real funds.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const require = createRequire(new URL('../.cache/wrap-evm/package.json', import.meta.url));
const solc = require('solc'), ganache = require('ganache');
const {BrowserProvider, ContractFactory, AbiCoder, keccak256, ZeroAddress, ZeroHash, id} = require('ethers');
const source = await readFile(new URL('../contracts/wrap-poc/TestBridge.sol', import.meta.url), 'utf8');
const faultSource = `pragma solidity ^0.8.20;
contract FaultToken {
 mapping(address=>uint256) public balanceOf;
 uint256 public mode;
 constructor(){balanceOf[msg.sender]=1000000000;}
 function setMode(uint256 m) external {mode=m;}
 function transferFrom(address from,address to,uint256 n) external returns(bool){return move(from,to,n);}
 function transfer(address to,uint256 n) external returns(bool){return move(msg.sender,to,n);}
 function move(address from,address to,uint256 n) internal returns(bool){
  if(mode==1)return false;require(mode!=2,"Mock token revert");
  balanceOf[from]-=n;balanceOf[to]+=mode==3?n-1:n;return true;
 }
}`;
const compiled=JSON.parse(solc.compile(JSON.stringify({language:'Solidity',sources:{'TestBridge.sol':{content:source},'FaultToken.sol':{content:faultSource}},settings:{evmVersion:'shanghai',optimizer:{enabled:true,runs:200},outputSelection:{'*':{'*':['abi','evm.bytecode.object']}}}})));
assert.deepEqual((compiled.errors||[]).filter(e=>e.severity==='error'),[]);
const artifacts={...compiled.contracts['TestBridge.sol'],...compiled.contracts['FaultToken.sol']};
const kaspaRecipient='0x'+'11'.repeat(32), quantity=2500000n;
async function sent(transaction){return (await transaction).wait();}

test('test bridge preserves exact backing, enforces oracle release and rejects replay',async t=>{
 const local=ganache.provider({logging:{quiet:true},chain:{chainId:31337,hardfork:'shanghai'},wallet:{totalAccounts:4}});
 const provider=new BrowserProvider(local);provider.pollingInterval=10;
 try{
  const [owner,oracle,recipient,stranger]=await Promise.all([0,1,2,3].map(i=>provider.getSigner(i)));
  const [ownerAddress,oracleAddress,recipientAddress]=await Promise.all([owner,oracle,recipient].map(s=>s.getAddress()));
  const deploy=async(name,args=[])=>{const a=artifacts[name],c=await new ContractFactory(a.abi,a.evm.bytecode.object,owner).deploy(...args);await c.waitForDeployment();return c;};
  const token=await deploy('MockUSD'),vault=await deploy('TestVault',[await token.getAddress(),oracleAddress]),vaultAddress=await vault.getAddress();
  const deposit=async(amount=quantity)=>{const receipt=await sent(vault.deposit(amount,kaspaRecipient));return receipt.logs.map(l=>{try{return vault.interface.parseLog(l);}catch{return null;}}).find(l=>l?.name==='Deposited');};
  await t.test('faucet is once per account and ERC-20 approval/transfer have exact units',async()=>{
   assert.equal(await token.decimals(),6n);await sent(token.faucet());assert.equal(await token.balanceOf(ownerAddress),100000000n);
   await assert.rejects(async()=>sent(token.faucet()));
   await sent(token.transfer(recipientAddress,1000000n));assert.equal(await token.balanceOf(recipientAddress),1000000n);
   await sent(token.approve(vaultAddress,10000000n));assert.equal(await token.allowance(ownerAddress,vaultAddress),10000000n);
  });
  let first,second;
  await t.test('deposit locks exact tokens and derives a chain/vault/account/nonce-bound ID',async()=>{
   const before=await token.balanceOf(ownerAddress);first=await deposit();
   const expected=keccak256(AbiCoder.defaultAbiCoder().encode(['uint256','address','address','uint256','uint256','bytes32'],[31337,vaultAddress,ownerAddress,0,quantity,kaspaRecipient]));
   assert.equal(first.args.depositId,expected);assert.equal(first.args.depositor,ownerAddress);assert.equal(first.args.amount,quantity);assert.equal(first.args.kaspaRecipient,kaspaRecipient);
   assert.equal(await token.balanceOf(ownerAddress),before-quantity);assert.equal(await token.balanceOf(vaultAddress),quantity);
   assert.deepEqual(Array.from(await vault.deposits(expected)),[ownerAddress,quantity,kaspaRecipient,false]);
   assert.equal(await token.allowance(ownerAddress,vaultAddress),7500000n);
   second=await deposit();assert.notEqual(second.args.depositId,expected);assert.equal(await vault.nonces(ownerAddress),2n);
  });
  await t.test('release requires oracle, pays stored amount and rejects duplicate deposits/burn IDs',async()=>{
   const burn=id('accepted-kaspa-burn-1');
   await assert.rejects(async()=>sent(vault.connect(stranger).release(first.args.depositId,recipientAddress,burn)));
   const before=await token.balanceOf(recipientAddress);await sent(vault.connect(oracle).release(first.args.depositId,recipientAddress,burn));
   assert.equal(await token.balanceOf(recipientAddress),before+quantity);assert.equal(await token.balanceOf(vaultAddress),quantity);
   assert.equal((await vault.deposits(first.args.depositId)).released,true);assert.equal(await vault.usedBurnIds(burn),true);
   await assert.rejects(async()=>sent(vault.connect(oracle).release(first.args.depositId,recipientAddress,id('another-burn'))));
   await assert.rejects(async()=>sent(vault.connect(oracle).release(second.args.depositId,recipientAddress,burn)));
   assert.equal((await vault.deposits(second.args.depositId)).released,false);
   await sent(vault.connect(oracle).release(second.args.depositId,recipientAddress,id('accepted-kaspa-burn-2')));
   assert.equal(await token.balanceOf(vaultAddress),0n);
  });
  await t.test('zero/unknown inputs fail without consuming deposit nonce or burn IDs',async()=>{
   const nonce=await vault.nonces(ownerAddress);
   await assert.rejects(async()=>sent(vault.deposit(0,kaspaRecipient)));
   await assert.rejects(async()=>sent(vault.deposit(quantity,ZeroHash)));
   await assert.rejects(async()=>sent(vault.connect(oracle).release(ZeroHash,recipientAddress,id('unknown'))));
   await assert.rejects(async()=>sent(vault.connect(oracle).release(first.args.depositId,ZeroAddress,id('zero-recipient'))));
   await assert.rejects(async()=>sent(vault.connect(oracle).release(first.args.depositId,vaultAddress,id('vault-recipient'))));
   await assert.rejects(async()=>sent(vault.connect(oracle).release(first.args.depositId,recipientAddress,ZeroHash)));
   assert.equal(await vault.nonces(ownerAddress),nonce);assert.equal(await vault.usedBurnIds(id('unknown')),false);
  });
  await t.test('false-returning, reverting and short-paying tokens cannot create unbacked deposits or consume failed releases',async()=>{
   for(const mode of [1,2,3]){
    const fault=await deploy('FaultToken'),guarded=await deploy('TestVault',[await fault.getAddress(),oracleAddress]),address=await guarded.getAddress();
    await sent(fault.setMode(mode));await assert.rejects(async()=>sent(guarded.deposit(quantity,kaspaRecipient,{gasLimit:1000000})));
    assert.equal(await guarded.nonces(ownerAddress),0n);assert.equal(await fault.balanceOf(address),0n);
    await sent(fault.setMode(0));const receipt=await sent(guarded.deposit(quantity,kaspaRecipient));const event=receipt.logs.map(l=>{try{return guarded.interface.parseLog(l);}catch{return null;}}).find(l=>l?.name==='Deposited');
    const burn=id('fault-'+mode);await sent(fault.setMode(mode));await assert.rejects(async()=>sent(guarded.connect(oracle).release(event.args.depositId,recipientAddress,burn,{gasLimit:1000000})));
    assert.equal((await guarded.deposits(event.args.depositId)).released,false);assert.equal(await guarded.usedBurnIds(burn),false);assert.equal(await fault.balanceOf(address),quantity);
    await sent(fault.setMode(0));await sent(guarded.connect(oracle).release(event.args.depositId,recipientAddress,burn));assert.equal(await fault.balanceOf(recipientAddress),quantity);
   }
  });
 }finally{await local.disconnect();}
});
