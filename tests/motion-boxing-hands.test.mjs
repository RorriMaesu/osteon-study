import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {boxingHandPose} from '../src/motion-boxing-hands.js';
import {preparePoseRig,applyPose,poseJointWorld} from '../src/motion-pose-rig.js';

const meta=JSON.parse(fs.readFileSync(new URL('../assets/motion-pose-body.json',import.meta.url)));
const joints=new Map(meta.joints.map(joint=>[joint.id,joint]));
function specimen(){
 const model=new THREE.Group(),nodes=new Map(meta.nodes.map(entry=>[entry.id,new THREE.Object3D()]));
 for(const descriptor of meta.nodes){
  const node=nodes.get(descriptor.id);node.name=descriptor.name;node.position.fromArray(descriptor.pivot);
  if(descriptor.parent){node.position.sub(new THREE.Vector3(...meta.nodes.find(item=>item.id===descriptor.parent).pivot));nodes.get(descriptor.parent).add(node);}
  else model.add(node);
 }
 return preparePoseRig(model,{...meta,totalMuscleSurfaces:0});
}
// Read only the GLB's JSON inventory, including the actual atlas bone bounds.
const fd=fs.openSync(new URL('../assets/'+meta.asset,import.meta.url),'r');
let gltf;
try{
 const header=Buffer.alloc(20);fs.readSync(fd,header,0,20,0);
 const json=Buffer.alloc(header.readUInt32LE(12));fs.readSync(fd,json,0,json.length,20);gltf=JSON.parse(json);
}finally{fs.closeSync(fd);}
function distalMarkers(rig,side){
 return gltf.nodes.filter(node=>node.extras?.poseSide===side&&/^Distal phalanx of .* finger of hand/.test(node.extras?.poseBone||'')).map(entry=>{
  const data=entry.extras,bounds=data.poseNeutralBounds,node=rig.nodes.get(data.poseDrivers[0]).node;
  const center=new THREE.Vector3((bounds[0]+bounds[3])/2,(bounds[1]+bounds[4])/2,(bounds[2]+bounds[5])/2);
  return {name:data.poseBone,driver:data.poseDrivers[0],node,local:node.worldToLocal(center.clone()),rest:center};
 });
}

test('boxing hands respect every shipped joint limit and leave each wrist straight',()=>{
 for(const side of ['right','left']){
  const pose=boxingHandPose(side,{pronation:55});
  for(const [id,values] of Object.entries(pose))for(const [axis,value] of Object.entries(values)){
   assert.ok(id.startsWith(side+'-'));
   const definition=joints.get(id)?.axes.find(item=>item.id===axis);
   assert.ok(definition,`${id}.${axis} exists`);
   assert.ok(value>=definition.min&&value<=definition.max,`${id}.${axis} stays within atlas limits`);
  }
  assert.deepEqual(pose[side+'-wrist'],{flexion:0,deviation:0});
 }
});

test('all four fingertips curl back toward the palm on both sides of the actual rig',()=>{
 for(const side of ['right','left']){
  const rig=specimen(),markers=distalMarkers(rig,side);
  const distal=poseJointWorld(rig,side+'-middle-mcp').sub(poseJointWorld(rig,side+'-wrist')).normalize();
  applyPose(rig,boxingHandPose(side));
  for(const marker of markers.filter(item=>!item.driver.includes('thumb'))){
   const current=marker.node.localToWorld(marker.local.clone());
   assert.ok(marker.rest.clone().sub(current).dot(distal)>.05,`${marker.name} curls at least 5 cm back from its open-hand position`);
   const knuckle=poseJointWorld(rig,marker.driver.replace('-dip','-mcp'));
   assert.ok(current.clone().sub(knuckle).dot(distal)<-.01,`${marker.name} folds proximally past its MCP instead of staying extended`);
  }
 }
});

test('the thumb stays outside the folded index finger instead of tucking inside the fist',()=>{
 for(const side of ['right','left']){
  const rig=specimen(),markers=distalMarkers(rig,side),wrist=poseJointWorld(rig,side+'-wrist');
  const distal=poseJointWorld(rig,side+'-middle-mcp').sub(wrist).normalize();
  const radial=poseJointWorld(rig,side+'-index-mcp').sub(poseJointWorld(rig,side+'-little-mcp')).normalize();
  const palmNormal=radial.clone().cross(distal).normalize().multiplyScalar(side==='right'?1:-1);
  applyPose(rig,boxingHandPose(side));
  const thumb=markers.find(marker=>marker.driver.includes('thumb')),index=markers.find(marker=>marker.driver.includes('index'));
  const separation=thumb.node.localToWorld(thumb.local.clone()).sub(index.node.localToWorld(index.local.clone())).dot(palmNormal);
  assert.ok(separation>.012,`${side} thumb distal center lies ${Math.round(separation*1000)} mm palmar to the closed index, keeping it outside`);
  const across=radial.clone().negate();
  const direction=thumb.node.localToWorld(thumb.local.clone()).sub(poseJointWorld(rig,side+'-thumb-ip')).normalize();
  assert.ok(direction.dot(across)>.8,`${side} distal thumb points across the finger row, not up in a thumbs-up pose`);
 }
});

test('one hand or caller cannot mutate a later boxing pose',()=>{
 const first=boxingHandPose('right');first['right-index-mcp'].flexion=0;
 assert.ok(boxingHandPose('right')['right-index-mcp'].flexion>50);
 assert.throws(()=>boxingHandPose('center'),TypeError);
 assert.equal(boxingHandPose('left',{pronation:100})['left-forearm'].pronation,60);
});
