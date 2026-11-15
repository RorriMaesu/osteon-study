import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {walkScopeMatches,captureWalkDrivers,mountWalkPack,updateWalkPacks} from '../src/motion-walk-model.js';

test('walking isolation retains named overlapping attachments and respects anatomical side',()=>{
 assert.equal(walkScopeMatches('left-arm','trunk-back','left',['trunk','left-arm']),true);
 assert.equal(walkScopeMatches('right-arm','trunk-back','left',['trunk','left-arm']),false);
 assert.equal(walkScopeMatches('trunk','shoulder-arm','right',['trunk','right-arm']),true);
 assert.equal(walkScopeMatches('left-leg','pelvis-leg-foot','right'),false);
 assert.equal(walkScopeMatches('head-neck','head-neck','midline',['head']),true);
});

test('a flat skin receiver preserves its own rest orientation and follows driver world motion',()=>{
 const model=new THREE.Group(),pelvis=new THREE.Object3D(),driver=new THREE.Object3D();
 pelvis.position.set(0,2,0);
 driver.name='Driver';driver.position.set(1,0,0);
 pelvis.add(driver);model.add(pelvis);
 const scene=new THREE.Group(),receiver=new THREE.Bone();
 receiver.name='Receiver';receiver.position.set(2,2,0);
 scene.add(receiver);
 const pack=mountWalkPack({model},scene,{Driver:'Receiver'},captureWalkDrivers(model,['Driver']));
 pelvis.position.y=3;
 driver.rotation.z=Math.PI/2;
 updateWalkPacks([pack]);model.updateMatrixWorld(true);
 const pos=receiver.getWorldPosition(new THREE.Vector3());
 assert.ok(pos.distanceTo(new THREE.Vector3(1,4,0))<1e-10);
 pelvis.position.y=2;driver.rotation.z=0;
 updateWalkPacks([pack]);model.updateMatrixWorld(true);
 assert.ok(receiver.getWorldPosition(pos).distanceTo(new THREE.Vector3(2,2,0))<1e-10);
});
