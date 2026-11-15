import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {readFileSync} from 'node:fs';
import {solvePoseTarget,dialDelta,visiblePoseMarkers} from '../src/motion-pose-ik.js';
import {preparePoseRig,applyPose,poseJointWorld,poseAxisWorld} from '../src/motion-pose-rig.js';
import {neutralPose} from '../src/motion-pose-core.js';

function example(){
 const root=new THREE.Object3D(),hinge=new THREE.Object3D(),tip=new THREE.Object3D();
 hinge.position.y=-1;tip.position.y=-1;root.add(hinge);hinge.add(tip);
 const apply=values=>{root.rotation.z=values.shoulder.flex*Math.PI/180;hinge.rotation.z=values.elbow.flex*Math.PI/180;root.updateMatrixWorld(true);};
 const endpoint=()=>tip.getWorldPosition(new THREE.Vector3());
 const axis=id=>({origin:(id==='shoulder'?root:hinge).getWorldPosition(new THREE.Vector3()),direction:new THREE.Vector3(0,0,1)});
 return {apply,endpoint,axis,values:{shoulder:{flex:0},elbow:{flex:0}},chain:[{jointId:'shoulder',axisId:'flex',min:-80,max:80},{jointId:'elbow',axisId:'flex',min:0,max:120}]};
}
test('endpoint drag reaches within joint bounds without mutating input',()=>{
 const options=example(),before=structuredClone(options.values);
 const result=solvePoseTarget({...options,target:[1,-1,0],iterations:50});
 assert.ok(result.error<.003,JSON.stringify(result));
 assert.deepEqual(options.values,before);
 assert(result.values.elbow.flex>=0&&result.values.elbow.flex<=120);
});
test('endpoint inverse kinematics respects locked joints and unreachable targets',()=>{
 const options=example();
 const result=solvePoseTarget({...options,locks:['elbow'],target:[4,-3,0]});
 assert.equal(result.values.elbow.flex,0);
 assert.equal(result.reached,false);
 assert.ok(Number.isFinite(result.error));
 assert(result.error<5);
});
test('all locked joints leave the pose unchanged',()=>{
 const options=example(),result=solvePoseTarget({...options,locks:['elbow','shoulder'],target:[1,-1,0]});
 assert.deepEqual(result.values,options.values);
});
test('an extended chain begins bending when its endpoint is pulled directly inward',()=>{
 const result=solvePoseTarget({...example(),target:[0,-1.5,0],iterations:55});
 assert.ok(result.error<.004,JSON.stringify(result));
 assert.ok(result.values.elbow.flex>50);
});
test('dial movement crosses the circular seam without a full-turn jump',()=>{
 assert.equal(dialDelta(179,-179),2);
 assert.equal(dialDelta(-179,179),-2);
});
test('markers preserve selected joint and avoid overlaps and viewport tools',()=>{
 const markers=[{id:'other',x:99,y:105,visible:true},{id:'selected',x:100,y:100,visible:true},{id:'top',x:50,y:25,visible:true},{id:'foot',x:60,y:299,visible:true}];
 assert.deepEqual(visiblePoseMarkers(markers,{width:200,height:310,selectedId:'selected'}).map(m=>m.id),['selected']);
});

// Reconstruct the real exported transforms, including Blender/glTF rest
// quaternions. Vertex data is unnecessary for this articulation regression.
function actualRig(){
 const meta=JSON.parse(readFileSync(new URL('../assets/motion-pose-body.json',import.meta.url)));
 const buffer=readFileSync(new URL('../assets/motion-pose-body.glb',import.meta.url));
 const gltf=JSON.parse(buffer.subarray(20,20+buffer.readUInt32LE(12)));
 const nodes=gltf.nodes.map(source=>{
  const node=new THREE.Object3D();node.name=source.name;
  if(source.matrix){node.matrix.fromArray(source.matrix);node.matrix.decompose(node.position,node.quaternion,node.scale);}
  else{
   if(source.translation)node.position.fromArray(source.translation);
   if(source.rotation)node.quaternion.fromArray(source.rotation);
   if(source.scale)node.scale.fromArray(source.scale);
  }
  return node;
 });
 for(const [index,source]of gltf.nodes.entries())for(const child of source.children||[])nodes[index].add(nodes[child]);
 const model=new THREE.Group();
 for(const index of gltf.scenes[gltf.scene||0].nodes)model.add(nodes[index]);
 return preparePoseRig(model,{...meta,totalMuscleSurfaces:0});
}

function actualChain(rig,side,limb,locks=[]){
 const root=side+(limb==='arm'?'-shoulder':'-hip'),hinge=side+(limb==='arm'?'-elbow':'-knee'),tip=side+(limb==='arm'?'-wrist':'-ankle');
 const chain=rig.descriptors.filter(joint=>[root,hinge].includes(joint.id)).flatMap(joint=>joint.axes
  .filter(axis=>!axis.requiresUnlocked?.some(id=>locks.includes(id)))
  .map(axis=>({jointId:joint.id,axisId:axis.id,min:axis.min,max:axis.max})));
 return {root,hinge,tip,chain,locks,apply:values=>applyPose(rig,values),endpoint:()=>poseJointWorld(rig,tip),
  axis:(joint,axis)=>({origin:poseJointWorld(rig,joint),direction:poseAxisWorld(rig,joint,axis)})};
}

function reachableGoal(rig,options,initial){
 const pose=structuredClone(initial);
 Object.assign(pose[options.root],options.tip.endsWith('wrist')?{flexion:35,abduction:18,rotation:8}:{flexion:30,abduction:8,rotation:7});
 pose[options.hinge].flexion=55;
 applyPose(rig,pose);
 return options.endpoint().toArray();
}

test('real exported wrists and ankles reach a quick multi-axis target with the trunk rotated',()=>{
 const rig=actualRig();
 for(const side of ['left','right'])for(const limb of ['arm','leg']){
  const options=actualChain(rig,side,limb),initial=structuredClone(neutralPose(rig.descriptors));
  Object.assign(initial.trunk,{flexion:15,lateral:8,rotation:12});
  const target=reachableGoal(rig,options,initial),original=structuredClone(initial);
  const result=solvePoseTarget({...options,values:initial,target});
  assert.ok(result.error<.004,side+' '+limb+' error '+result.error+'m');
  assert.deepEqual(initial,original,'The input pose is immutable');
  for(const control of options.chain){const value=result.values[control.jointId][control.axisId];assert.ok(value>=control.min&&value<=control.max);}
  assert.ok(result.values[options.hinge].flexion>25,'The hinge must not stall straight for a bent-limb target');
 }
});

test('real straight limbs can shorten along their own axis without getting stuck at full extension',()=>{
 const rig=actualRig();
 for(const side of ['left','right'])for(const limb of ['arm','leg']){
  const options=actualChain(rig,side,limb),initial=neutralPose(rig.descriptors);
  applyPose(rig,initial);
  const end=options.endpoint(),towardRoot=poseJointWorld(rig,options.root).sub(end).normalize();
  const target=end.clone().addScaledVector(towardRoot,limb==='arm'?.025:.04);
  const result=solvePoseTarget({...options,values:initial,target:target.toArray()});
  assert.ok(result.error<.004,side+' '+limb+' shortening error '+result.error+'m');
  assert.ok(result.values[options.hinge].flexion>10);
 }
});

test('actual-asset endpoint poses respect own locks and coupled girdle locks',()=>{
 const rig=actualRig();
 for(const side of ['left','right']){
  const initial=structuredClone(neutralPose(rig.descriptors));initial[side+'-elbow'].flexion=20;
  const goal=structuredClone(initial);Object.assign(goal[side+'-shoulder'],{flexion:35,abduction:18});
  applyPose(rig,goal);
  const locked=actualChain(rig,side,'arm',[side+'-elbow']),target=locked.endpoint().toArray();
  const result=solvePoseTarget({...locked,values:initial,target});
  assert.equal(result.values[side+'-elbow'].flexion,20);
  assert.ok(result.error<.004);
  const girdle=actualChain(rig,side,'arm',[side+'-scapula']);
  assert.ok(!girdle.chain.some(control=>control.axisId==='abduction'));
  goal[side+'-shoulder'].abduction=0;applyPose(rig,goal);
  const girdleResult=solvePoseTarget({...girdle,values:initial,target:girdle.endpoint().toArray()});
  assert.deepEqual(girdleResult.values[side+'-scapula'],initial[side+'-scapula']);
  assert.equal(girdleResult.values[side+'-shoulder'].abduction,0);
  assert.ok(girdleResult.error<.004);
 }
});

test('a sampled real-asset drag stays on the positive hinge branch without abrupt flips',()=>{
 const rig=actualRig();
 for(const side of ['left','right'])for(const limb of ['arm','leg']){
  const options=actualChain(rig,side,limb);
  let values=structuredClone(neutralPose(rig.descriptors));
  const target=new THREE.Vector3(...reachableGoal(rig,options,values));
  applyPose(rig,values);const start=options.endpoint();
  let result;
  for(let index=1;index<=24;index++){
   result=solvePoseTarget({...options,values,target:start.clone().lerp(target,index/24).toArray()});
   for(const control of options.chain)assert.ok(Math.abs(result.values[control.jointId][control.axisId]-values[control.jointId][control.axisId])<22,'Small endpoint steps must not flip the pose branch');
   assert.ok(result.values[options.hinge].flexion>=0);
   values=result.values;
  }
  assert.ok(result.error<.004,side+' '+limb+' final drag error '+result.error+'m');
 }
});
