import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';

import {ankleMorphBinding,poseAnkleMorphs} from '../src/motion-ankle.js';

const read=path=>readFileSync(new URL('../'+path,import.meta.url));
const metadata=JSON.parse(read('model-sources/motion-gastrocnemius-ankle.json'));

test('ankle shape binding tolerates earlier assets, keeps case-sensitive extras and clears unused sign',()=>{
 const create=(side='right')=>({userData:{motionSide:side,motionAnklePlantar:'Pitch plantar',motionAnkleDorsi:'Pitch dorsi'},
  morphTargetDictionary:{Other:0,'Pitch dorsi':1,'Pitch plantar':2},morphTargetInfluences:[.125,0,0]});
 const left=create('left'),right=create();
 assert.equal(ankleMorphBinding({userData:{motionSide:'right'}}),null);
 assert.equal(ankleMorphBinding(create('unassigned')),null);
 assert.equal(ankleMorphBinding({...right,morphTargetDictionary:{}}),null);
 const leftBinding=ankleMorphBinding(left),rightBinding=ankleMorphBinding(right);
 assert.equal(leftBinding.side,'left');
 poseAnkleMorphs([rightBinding],-17.5);
 assert.deepEqual(right.morphTargetInfluences,[.125,0,.5]);
 poseAnkleMorphs([leftBinding],11.5);
 assert.deepEqual(left.morphTargetInfluences,[.125,.5,0]);
 poseAnkleMorphs([rightBinding],47);
 assert.deepEqual(right.morphTargetInfluences,[.125,1,0]);
 poseAnkleMorphs([rightBinding],-70);
 assert.deepEqual(right.morphTargetInfluences,[.125,0,1]);
 poseAnkleMorphs([rightBinding],0);
 assert.deepEqual(right.morphTargetInfluences,[.125,0,0]);
 assert.deepEqual(left.morphTargetInfluences,[.125,.5,0]);
 assert.doesNotThrow(()=>poseAnkleMorphs(undefined,23));
});

test('the shipped base leg model has signed corrective targets on both lateral gastrocnemius and Achilles surfaces',()=>{
 const bytes=read('assets/motion-legs.glb');
 assert.equal(createHash('sha256').update(bytes).digest('hex'),metadata.correctedAssetSHA256);
 const jsonEnd=20+bytes.readUInt32LE(12);
 const {nodes,meshes,accessors}=JSON.parse(bytes.subarray(20,jsonEnd));
 const shaped=nodes.filter(node=>node.extras?.motionAnklePlantar||node.extras?.motionAnkleDorsi);
 assert.deepEqual(shaped.map(node=>node.name).sort(),[
  'MotionLeftCalcanealTendon','MotionLeftLateralHeadOfGastrocnemius',
  'MotionRightCalcanealTendon','MotionRightLateralHeadOfGastrocnemius',
 ]);
 assert.deepEqual(shaped.map(node=>node.name).sort(),[...metadata.correctedNodes].sort());
 for(const node of shaped){
  const mesh=meshes[node.mesh],targetSlots=Object.fromEntries(mesh.extras.targetNames.map((name,index)=>[name,index]));
  const binding=ankleMorphBinding({userData:node.extras,morphTargetDictionary:targetSlots,morphTargetInfluences:[0,0]});
  assert.ok(binding,node.name);
  if(node.name.endsWith('LateralHeadOfGastrocnemius'))assert.equal(node.extras.motionMuscle,'gastrocnemius-lateral');
  else assert.equal(node.extras.motionKind,'support');
  for(const part of mesh.primitives){
   const plantar=accessors[part.targets[binding.plantar].POSITION];
   const dorsi=accessors[part.targets[binding.dorsi].POSITION];
   const base=accessors[part.attributes.POSITION];
   assert.equal(plantar.count,base.count,node.name);
   assert.equal(dorsi.count,base.count,node.name);
   assert.ok(plantar.max[1]>.01,node.name+' proximal shift on plantarflexion');
   assert.ok(dorsi.min[1]<-.004,node.name+' distal shift on dorsiflexion');
  }
 }
});

test('Blender re-import report retains anchored extremities and signed calf motion in both stances',()=>{
 for(const [side,poses] of Object.entries(metadata.reimport)){
  assert.equal(Object.keys(poses).length,10,side);
  for(const [pose,row] of Object.entries(poses)){
   assert.equal(row.originCorrectionDriftMm,0,side+' '+pose);
   assert.equal(row.insertionCorrectionDriftMm,0,side+' '+pose);
   assert.ok(row.joinMaxIncrementMm<=.04,side+' '+pose);
   assert.ok(row.joinSampleVertices>=60,side+' '+pose);
  }
  assert.ok(poses.hip0_knee0_ankle23.joinMeanVerticalMovementMm<-5,side);
  assert.ok(poses['hip0_knee0_ankle-35'].joinMeanVerticalMovementMm>12,side);
 }
});
