import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createWorld,stepWorld,findWalkPath} from '../src/v4-world-model.mjs';

test('walking follows clear grid segments around a solid desk',()=>{
 const desk={minX:-1,maxX:1,minZ:-1,maxZ:1},path=findWalkPath({x:-3,z:0},{x:3,z:0},[desk]);assert.ok(path.length>0);assert.ok(Math.abs(path.at(-1).x-3)<.3);
 for(const point of path)assert.ok(!(point.x>=desk.minX&&point.x<=desk.maxX&&point.z>=desk.minZ&&point.z<=desk.maxZ));
 for(let i=1;i<path.length;i++){const a=path[i-1],b=path[i];assert.ok(Math.abs(a.x-b.x)<1e-8||Math.abs(a.z-b.z)<1e-8,'a route cannot cut diagonally across furniture corners');assert.ok(Math.hypot(a.x-b.x,a.z-b.z)<.401);}
});
test('a blocked room does not teleport the player through a wall',()=>{const path=findWalkPath({x:-3,z:0},{x:3,z:0},[{minX:-.5,maxX:.5,minZ:-5,maxZ:5}]);assert.ok(path.length>0);assert.ok(path.every(point=>point.x<-.5));});
test('welcome and live worlds do not automatically advance or wander',()=>{for(const flags of [{welcome:true},{live:{active:true}}]){const world={...createWorld(),...flags};assert.deepEqual(stepWorld(world),world);}});
test('model production does not send robots to random coordinates',()=>{const world=createWorld(),before=world.robots.map(({x,y})=>({x,y}));assert.deepEqual(stepWorld(world).robots.map(({x,y})=>({x,y})),before);});
