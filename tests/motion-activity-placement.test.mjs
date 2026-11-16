import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {preparePoseRig,poseJointWorld} from '../src/motion-pose-rig.js';
import {applyActivityPose} from '../src/motion-activity-placement.js';

const meta=JSON.parse(fs.readFileSync(new URL('../assets/motion-pose-body.json',import.meta.url)));
function specimen(){
 const model=new THREE.Group(),nodes=new Map(meta.nodes.map(entry=>[entry.id,new THREE.Object3D()]));
 for(const descriptor of meta.nodes){
  const node=nodes.get(descriptor.id);node.name=descriptor.name;node.position.fromArray(descriptor.pivot);
  if(descriptor.parent){
   node.position.sub(new THREE.Vector3(...meta.nodes.find(item=>item.id===descriptor.parent).pivot));
   nodes.get(descriptor.parent).add(node);
  }else model.add(node);
 }
 return preparePoseRig(model,{...meta,totalMuscleSurfaces:0});
}
const floor=rig=>Math.min(...rig.activityPlacement.probes.map(({node,point})=>node.localToWorld(point.clone()).y));
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} differs from ${b}`);
const squat={
 'left-hip':{flexion:58},'right-hip':{flexion:58},
 'left-knee':{flexion:60},'right-knee':{flexion:60},
 'left-ankle':{dorsiflexion:22},'right-ankle':{dorsiflexion:22},
};
test('bilateral squat lowers the body, preserves planted ankles and stays on the floor',()=>{
 const rig=specimen();applyActivityPose(rig,{},[],{ground:'both'});
 const height=poseJointWorld(rig,'left-hip').y;
 const left=poseJointWorld(rig,'left-ankle'),right=poseJointWorld(rig,'right-ankle');
 applyActivityPose(rig,squat,[],{ground:'both',rootRotation:[20,0,0]});
 assert.ok(poseJointWorld(rig,'left-hip').y<height-.06);
 for(const [side,rest] of [['left',left],['right',right]]){
  const foot=poseJointWorld(rig,side+'-ankle');
  // The knee's unlocking rotation can shift each foot less than 2 mm.
  assert.ok(Math.abs(foot.x-rest.x)<.002);assert.ok(Math.abs(foot.z-rest.z)<.002);
 }
 close(floor(rig),0);
});
test('authored flight raises foot probes and does not accumulate between frames',()=>{
 const rig=specimen();
 const pose={'left-knee':{flexion:30},'right-knee':{flexion:30}};
 const first=applyActivityPose(rig,pose,[.04,.18,0],{ground:'alternate'}).position;
 close(floor(rig),.18);
 for(let n=0;n<20;n++)applyActivityPose(rig,pose,[.04,.18,0],{ground:'alternate'});
 close(rig.model.position.distanceTo(first),0);
 applyActivityPose(rig,{},[],{ground:'both'});close(floor(rig),0);
 close(rig.model.quaternion.angleTo(new THREE.Quaternion()),0);
});
test('switching from body travel to a hand lesson resets all root motion',()=>{
 const rig=specimen(),rest=rig.model.position.clone();
 applyActivityPose(rig,squat,[.2,.1,.1],{ground:'both',rootRotation:[20,15,0]});
 applyActivityPose(rig,{},[],{ground:'none'});
 close(rig.model.position.distanceTo(rest),0);
 close(rig.model.quaternion.angleTo(new THREE.Quaternion()),0);
});
