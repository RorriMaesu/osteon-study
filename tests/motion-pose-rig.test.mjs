import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import * as THREE from 'three';
import {preparePoseRig,applyPose,poseJointWorld,poseMarkerWorld,poseAxisWorld,clearanceWeight} from '../src/motion-pose-rig.js';

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

test('pose clearance ramps blend adjacent fits and release after returning to neutral',()=>{
 const hip='left-hip', mid=[[hip,'flexion',29,66],[hip,'flexion',85,66]], high=[[hip,'flexion',66,85]];
 for(const degrees of [66,71,79,85]){
  const sample={[hip]:{flexion:degrees}};
  close(clearanceWeight(mid,sample)+clearanceWeight(high,sample),1);
 }
 assert.equal(clearanceWeight(mid,{}),0);
 assert.equal(clearanceWeight(high,{[hip]:{flexion:55}}),0);
 assert.equal(clearanceWeight([[hip,'flexion',66,85],['trunk','flexion',12,25]],
  {[hip]:{flexion:85}}),0);
 const fittedHip=meta.clearanceCorrectives.find(rule=>rule.target==='ClearanceHipFlexionL');
 close(clearanceWeight(fittedHip.ramps,{[hip]:{flexion:85,rotation:0}}),1);
 for(const rotation of [-15,15])assert.equal(clearanceWeight(fittedHip.ramps,{[hip]:{flexion:85,rotation}}),0);
});

test('published clearance entries refer to supported joint axes and delivered muscle morphs',()=>{
 const bytes=fs.readFileSync(new URL('../assets/motion-pose-body.glb',import.meta.url));
 const gltf=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString());
 const byId=new Map(gltf.nodes.filter(n=>n.extras?.poseMuscle).map(n=>[n.extras.muscleId,n]));
 assert.ok(meta.clearanceCorrectives.length>=8);
 for(const {target,ramps,surfaces} of meta.clearanceCorrectives){
  for(const [joint,axis,start,end] of ramps){
   const base=meta.joints.find(row=>row.id===joint)?.axes.find(row=>row.id===axis);
   assert.ok(base&&start>=base.min&&end>=base.min&&start<=base.max&&end<=base.max&&start!==end,target);
  }
  for(const id of surfaces)assert.ok(gltf.meshes[byId.get(id).mesh].extras.targetNames.includes(target),id+' '+target);
 }
});

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

test('finger MCP spread moves each ray away from its hand midline without moving the wrist',()=>{
 const rig=specimen();
 for(const side of ['left','right'])for(const digit of ['index','middle','ring','little']){
  applyPose(rig,{});
  const id=side+'-'+digit+'-mcp';
  const joint=rig.descriptors.find(item=>item.id===id);
  const axis=joint.axes.find(item=>item.id==='abduction');
  assert.ok(axis&&axis.min===0&&axis.max<=15,'Spread uses a conservative independent channel');
  const tip=poseJointWorld(rig,side+'-'+digit+'-dip');
  const wrist=poseJointWorld(rig,side+'-wrist');
  applyPose(rig,{[id]:{abduction:axis.max}});
  const offset=poseJointWorld(rig,side+'-'+digit+'-dip').x-tip.x;
  const radial=digit==='index'||digit==='middle';
  const sign=(side==='right'?-1:1)*(radial?1:-1);
  assert.ok(offset*sign>.002,side+' '+digit+' spread went toward the wrong side');
  close(poseJointWorld(rig,side+'-wrist').distanceTo(wrist),0);
 }
});

test('hindfoot inversion turns each sole inward below a stationary ankle and reverses for eversion',()=>{
 const rig=specimen();
 for(const side of ['left','right'])for(const angle of [15,-8]){
  applyPose(rig,{});
  const ankle=rig.nodes.get(side+'-ankle').node.matrixWorld.clone();
  applyPose(rig,{[side+'-subtalar']:{inversion:angle}});
  const orientation=rig.nodes.get(side+'-subtalar').node.getWorldQuaternion(new THREE.Quaternion());
  const sole=new THREE.Vector3(0,-1,0).applyQuaternion(orientation);
  assert.ok(sole.x*(side==='right'?1:-1)*Math.sign(angle)>.05,side+' sole direction');
  assert.ok(rig.nodes.get(side+'-ankle').node.matrixWorld.equals(ankle),'Subtalar movement must not tilt the ankle or tibia');
  assert.equal(meta.nodes.find(row=>row.id===side+'-toes').parent,side+'-subtalar');
 }
});

test('hindfoot skin binds the calcaneus and Achilles insertion below the talus',()=>{
 const buffer=fs.readFileSync(new URL('../assets/motion-pose-body.glb',import.meta.url));
 const gltf=JSON.parse(buffer.subarray(20,20+buffer.readUInt32LE(12)).toString());
 for(const [side,suffix] of [['right','r'],['left','l']]){
  const talus=gltf.nodes.find(node=>node.extras?.poseBone==='Talus.'+suffix);
  const heel=gltf.nodes.find(node=>node.extras?.poseBone==='Calcaneus.'+suffix);
  assert.deepEqual(talus.extras.poseDrivers,[side+'-ankle']);
  assert.deepEqual(heel.extras.poseDrivers,[side+'-subtalar']);
  const tendon=gltf.nodes.find(node=>node.extras?.poseSupport==='tendon'&&node.extras.motionSide===side);
  assert.ok(tendon.extras.poseDrivers.includes(side+'-subtalar'),'Achilles insertion must follow the heel');
  assert.ok(!tendon.extras.poseDrivers.includes(side+'-ankle'),'Do not leave an Achilles insertion floating on the old foot driver');
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

test('the head turn favors C1 and a skull nod leaves cervical bones still',()=>{
 const rig=specimen(),spin=id=>rig.nodes.get(id).node.quaternion.angleTo(rig.nodes.get(id).rest);
 applyPose(rig,{neck:{rotation:30}});
 close(spin('cervical-1')*180/Math.PI,18);
 assert(spin('cervical-1')>spin('cervical-2')*5);
 applyPose(rig,{'upper-nod':{flexion:6}});
 close(spin('head')*180/Math.PI,6);
 for(let i=1;i<=7;i++)close(spin('cervical-'+i),0);
});

test('jaw translations advance the opposite condyle or both condyles as appropriate',()=>{
 const rig=specimen(),jaw=rig.nodes.get('jaw').node;
 const half=rig.descriptors.find(joint=>joint.id==='jaw').condyleHalfWidth;
 const condyle=side=>jaw.localToWorld(new THREE.Vector3(side*half,0,0)).z;
 const rest=[condyle(-1),condyle(1)];
 for(const side of [-1,1]){
  applyPose(rig,{jaw:{excursion:side*5}});
  const motion=[condyle(-1)-rest[0],condyle(1)-rest[1]];
  const working=side>0?0:1;
  assert(motion[1-working]>.004);
  assert(Math.abs(motion[working])<.00001);
 }
 applyPose(rig,{jaw:{protrusion:100}});
 close(condyle(-1)-rest[0],.005);
 close(condyle(1)-rest[1],.005);
});

test('great-toe lift changes the hallux without dragging other toe joints',()=>{
 const rig=specimen(),lesser=rig.nodes.get('right-toes').node.matrixWorld.clone();
 const great=rig.nodes.get('right-hallux').node;
 const tip=()=>great.localToWorld(new THREE.Vector3(0,0,.04));
 const rest=tip();
 applyPose(rig,{'right-hallux':{extension:24}});
 assert(tip().y>rest.y+.01);
 assert(rig.nodes.get('right-toes').node.matrixWorld.equals(lesser));
 assert.equal(rig.nodes.get('left-hallux').node.quaternion.angleTo(rig.nodes.get('left-hallux').rest),0);
});

test('the stance comparison lowers the free side while the support ankle stays fixed',()=>{
 const rig=specimen(),ankle=poseJointWorld(rig,'right-ankle'),freeHip=poseJointWorld(rig,'left-hip');
 applyPose(rig,{'pelvic-control':{obliquity:6}});
 close(poseJointWorld(rig,'right-ankle').distanceTo(ankle),0);
 assert(poseJointWorld(rig,'left-hip').y<freeHip.y-.01);
});

test('thoracic rotation leaves the lumbar levels still and turns the rib cage',()=>{
 const rig=specimen(),thorax=rig.nodes.get('thorax').node,base=rig.nodes.get('lumbar-1').node;
 const neutralBase=base.matrixWorld.clone(),neutralChest=thorax.getWorldQuaternion(new THREE.Quaternion());
 applyPose(rig,{'thoracic-turn':{rotation:9}});
 assert(base.matrixWorld.equals(neutralBase));
 close(thorax.getWorldQuaternion(new THREE.Quaternion()).angleTo(neutralChest)*180/Math.PI,9);
});

test('scaption moves each wrist outward and forward while opposition moves each thumb across the palm',()=>{
 const rig=specimen();
 for(const side of ['left','right']){
  const sign=side==='right'?-1:1,wrist=side+'-wrist',thumb=side+'-thumb-ip',index=side+'-index-mcp';
  applyPose(rig,{});
  const wristStart=poseJointWorld(rig,wrist),indexStart=poseJointWorld(rig,index);
  const gap=poseJointWorld(rig,thumb).distanceTo(indexStart);
  applyPose(rig,{[side+'-thumb-cmc']:{opposition:80}});
  assert(poseJointWorld(rig,thumb).distanceTo(indexStart)<gap-.001);
  close(poseJointWorld(rig,index).distanceTo(indexStart),0);
  applyPose(rig,{[side+'-shoulder']:{scaption:50}});
  const change=poseJointWorld(rig,wrist).sub(wristStart);
  assert(change.x*sign>.15&&change.z>.12&&change.y>.15);
 }
});

test('the raised arm sweeps forward at the same height and the hanging arm does not twist',()=>{
 const rig=specimen();
 for(const side of ['left','right']){
  const shoulder=side+'-shoulder',wrist=side+'-wrist';
  applyPose(rig,{});
  const low=poseJointWorld(rig,wrist);
  applyPose(rig,{[shoulder]:{horizontal:40}});
  close(poseJointWorld(rig,wrist).distanceTo(low),0);
  applyPose(rig,{[shoulder]:{abduction:65}});
  const open=poseJointWorld(rig,wrist);
  applyPose(rig,{[shoulder]:{abduction:65,horizontal:40}});
  const across=poseJointWorld(rig,wrist);
  close(across.y,open.y);
  assert(across.z-open.z>.2);
  assert(Math.abs(across.x)<Math.abs(open.x));
 }
});

test('a lesser toe moves at its base while the great toe and adjacent toes stay still',()=>{
 const rig=specimen(),names=['right-hallux','right-toe-3','right-toe-4','right-toe-5'];
 const rest=names.map(name=>rig.nodes.get(name).node.matrixWorld.clone());
 const second=rig.nodes.get('right-toe-2').node;
 const initial=second.localToWorld(new THREE.Vector3(0,0,.033));
 applyPose(rig,{'right-toe-2':{extension:20}});
 assert(second.localToWorld(new THREE.Vector3(0,0,.033)).y>initial.y+.01);
 for(const [i,name] of names.entries())assert(rig.nodes.get(name).node.matrixWorld.equals(rest[i]));
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
