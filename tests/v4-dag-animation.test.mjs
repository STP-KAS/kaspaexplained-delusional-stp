import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../src/vendor/three/three.module.min.js';
import {createV4Dag3D} from '../src/v4-dag-3d.mjs';
const hash=n=>n.toString(16).padStart(64,'0');

test('pending and accepted parcels preserve exact five outputs through a busy block stream',()=>{
 const scene=new THREE.Scene(),dag=createV4Dag3D({THREE,scene}),layer=scene.children[0],id=hash(900),acceptingBlock=hash(901),outputs=Array.from({length:5},(_,index)=>({index,amount:String(index+1)}));let now=0;
 const advance=ms=>{for(let remaining=ms;remaining>0;){const delta=Math.min(20,remaining);remaining-=delta;now+=delta;dag.frame(now);}};
 const parcel=()=>layer.children.find(object=>object.userData.transactionId===id);
 dag.frame(now);dag.transaction({id,status:'pending',outputCount:5,outputs});advance(1000);assert.equal(parcel().userData.status,'pending');assert.ok(parcel().position.x<-6);
 dag.transaction({id,status:'accepted',outputCount:5,outputs});assert.equal(parcel().userData.status,'pending','acceptance without a block must not enter a block');
 const accepted={id,status:'accepted',acceptingBlock,outputCount:5,outputs};dag.transaction(accepted);assert.equal(parcel().userData.status,'accepted');
 let previous=acceptingBlock;for(let i=1;i<=70;i++){const next=hash(1000+i);dag.updateDag({hash:next,parents:[previous]});previous=next;if(i%5===0)dag.transaction(accepted);advance(20);assert.ok(layer.children.some(object=>object.userData.hash===acceptingBlock),'accepting block is retained while the parcel travels');}
 assert.equal(parcel().children.length,5,'each actual output has one parcel after entering the accepting block');assert.equal(parcel().userData.outputCount,5);
 dag.frame(now,{playing:false});const blocks=layer.children.filter(object=>object.userData.kind==='dag-block');assert.equal(new Set(blocks.map(object=>object.position.toArray().join(','))).size,blocks.length,'retaining the accepting block must not stack blocks in one slot');
 advance(2700);assert.equal(parcel(),undefined,'duplicate accepted notifications must not restart the flight');dag.transaction(accepted);assert.equal(parcel(),undefined,'completed transaction must not replay');dag.dispose();assert.equal(scene.children.length,0);
});
