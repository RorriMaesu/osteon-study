import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import * as THREE from 'three';
import {preparePoseRig,applyPose,poseJointWorld,poseMarkerWorld,poseAxisWorld} from '../src/motion-pose-rig.js';

const meta=JSON.parse(fs.readFileSync(new URL('../assets/motion-pose-body.json',import.meta.url)));
function specimen(){
 const model=new THREE.Group();
 const nodes=new Map(meta.nodes.map(entry=>[entry.id,new THREE.Object3D()]));
 for(const descriptor of meta.nodes){
  const node=nodes.get(descriptor.id);
  node.name=descriptor.name;
  node.position.fromArray(descriptor.pivot);
  if(descriptor.parent){
   const parent=meta.nodes.find(item=>item.id===descriptor.parent);
   node.position.sub(new THREE.Vector3(...parent.pivot));
   nodes.get(descriptor.parent).add(node);
  }else model.add(node);
 }
 return preparePoseRig(model,{...meta,totalMuscleSurfaces:0});
}
const close=(a,b,tolerance=1e-7)=>assert.ok(Math.abs(a-b)<tolerance,`${a} differs from ${b}`);

test('whole-body pose asset matches its manifest and exact atlas muscle census',()=>{
 const buffer=fs.readFileSync(new URL('../assets/motion-pose-body.glb',import.meta.url));
 assert.equal(createHash('sha256').update(buffer).digest('hex'),meta.sha256);
 assert.equal(buffer.byteLength,meta.bytes);
 const gltf=JSON.parse(buffer.subarray(20,20+buffer.readUInt32LE(12)).toString());
 const actual=gltf.nodes.filter(node=>node.extras?.poseMuscle).map(node=>node.extras.muscleId).sort();
 const atlas=JSON.parse(fs.readFileSync(new URL('../src/muscle-models.json',import.meta.url)));
 const expected=atlas.components.filter(part=>part.kind==='muscle'&&!part.retired).map(part=>part.id).sort();
 assert.deepEqual(actual,expected);
 assert.equal(new Set(actual).size,actual.length);
 for(const node of gltf.nodes.filter(node=>'mesh' in node))assert.ok('skin' in node,'A visible surface lost its attachment: '+node.name);
 assert.equal(gltf.nodes.filter(node=>node.extras?.poseSupport==='disc').length,23);
 assert.equal(gltf.nodes.filter(node=>node.extras?.poseSupport==='tendon'&&node.extras.motionAnklePlantar).length,2);
});

test('scapular movers attach to the girdle and radioulnar-only muscles cannot follow fingers',()=>{
 const buffer=fs.readFileSync(new URL('../assets/motion-pose-body.glb',import.meta.url));
 const gltf=JSON.parse(buffer.subarray(20,20+buffer.readUInt32LE(12)).toString());
 const girdle=new Set(['Serratus anterior muscle','Pectoralis minor muscle','Trapezius muscle','Rhomboid major muscle','Rhomboid minor muscle','Levator scapulae','Subclavius muscle']);
 const forearm=new Set(['Pronator quadratus','Pronator teres muscle','Supinator','Brachioradialis muscle']);
 let checked=0;
 for(const node of gltf.nodes){
  const data=node.extras;
  if(!data?.poseMuscle)continue;
  if(girdle.has(data.poseMuscle)){
   assert.ok(data.poseDrivers.includes(data.poseSide+'-scapula'),node.name+' lost scapular insertion');
   checked++;
  }
  if(forearm.has(data.poseMuscle))for(const driver of data.poseDrivers)
   assert.ok(!/wrist|thumb|index|middle|ring|little/.test(driver),node.name+' crosses an unrelated hand joint');
 }
 assert.ok(checked>=18);
});

test('bilateral positive elbow, hip and ankle controls move in anatomical directions',()=>{
 const rig=specimen();
 for(const side of ['left','right']){
  applyPose(rig,{});
  const wrist=poseJointWorld(rig,side+'-wrist'),ankle=poseJointWorld(rig,side+'-ankle'),toes=poseJointWorld(rig,side+'-toes');
  applyPose(rig,{[side+'-elbow']:{flexion:30}});
  assert.ok(poseJointWorld(rig,side+'-wrist').z>wrist.z+.06,'Elbow flexion should move wrist anteriorly');
  applyPose(rig,{[side+'-hip']:{flexion:30}});
  assert.ok(poseJointWorld(rig,side+'-ankle').z>ankle.z+.2,'Hip flexion should move leg anteriorly');
  applyPose(rig,{[side+'-ankle']:{dorsiflexion:15}});
  assert.ok(poseJointWorld(rig,side+'-toes').y>toes.y+.02,'Dorsiflexion should raise toes');
 }
});

test('shoulder elevation raises both shoulders and scapular coupling keeps the arm attached',()=>{
 const rig=specimen();
 for(const side of ['left','right']){
  applyPose(rig,{});
  const shoulder=poseJointWorld(rig,side+'-shoulder'),elbow=poseJointWorld(rig,side+'-elbow');
  const length=shoulder.distanceTo(elbow);
  applyPose(rig,{[side+'-scapula']:{elevation:10}});
  assert.ok(poseJointWorld(rig,side+'-shoulder').y>shoulder.y+.015);
  applyPose(rig,{[side+'-shoulder']:{abduction:60,flexion:45}});
  close(poseJointWorld(rig,side+'-shoulder').distanceTo(poseJointWorld(rig,side+'-elbow')),length);
 }
});

test('trunk and neck flexion move forward; neck handles follow a bent trunk',()=>{
 const rig=specimen();
 const head=rig.nodes.get('head').node.getWorldPosition(new THREE.Vector3());
 const handle=poseMarkerWorld(rig,'neck');
 applyPose(rig,{trunk:{flexion:25}});
 assert.ok(rig.nodes.get('head').node.getWorldPosition(new THREE.Vector3()).z>head.z+.1);
 assert.ok(poseMarkerWorld(rig,'neck').distanceTo(handle)>.1);
 applyPose(rig,{neck:{flexion:25}});
 assert.ok(rig.nodes.get('head').node.getWorldPosition(new THREE.Vector3()).z>head.z+.01);
});

test('multi-axis hinges report the current axis without subsequent-axis contamination',()=>{
 const rig=specimen();
 applyPose(rig,{'right-hip':{flexion:30,abduction:20,rotation:15}});
 const flex=poseAxisWorld(rig,'right-hip','flexion');
 close(flex.x,-1);close(flex.y,0);close(flex.z,0);
 const abduction=poseAxisWorld(rig,'right-hip','abduction');
 const expected=new THREE.Vector3(0,0,-1).applyAxisAngle(new THREE.Vector3(-1,0,0),Math.PI/6);
 close(abduction.distanceTo(expected),0);
});

test('every declared axis has a finite bounded pose and resetting exactly restores all nodes',()=>{
 const rig=specimen();
 const neutral=new Map([...rig.nodes].map(([id,state])=>[id,state.node.matrixWorld.clone()]));
 for(const joint of rig.descriptors)for(const axis of joint.axes)for(const value of [axis.min,axis.max]){
  const applied=applyPose(rig,{[joint.id]:{[axis.id]:value}});
  close(applied[joint.id][axis.id],value);
  for(const state of rig.nodes.values()){
   assert.ok(state.node.matrixWorld.elements.every(Number.isFinite));
   close(state.node.matrixWorld.determinant(),1);
  }
 }
 applyPose(rig,{});
 for(const [id,state] of rig.nodes)assert.ok(state.node.matrixWorld.equals(neutral.get(id)),id+' did not reset exactly');
});

test('partial malformed input stays within limits and breathing shapes cannot oppose each other',()=>{
 const rig=specimen();
 const values=applyPose(rig,{'right-elbow':{flexion:999},'left-knee':{flexion:NaN},breathing:{inhale:100,exhale:40}});
 assert.equal(values['right-elbow'].flexion,115);
 assert.equal(values['left-knee'].flexion,0);
 assert.equal(values.breathing.inhale,0);
 assert.equal(values.breathing.exhale,40);
});
