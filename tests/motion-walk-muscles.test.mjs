import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import * as THREE from 'three';
import {captureWalkDrivers,mountWalkPack,updateWalkPacks} from '../src/motion-walk-model.js';

const root=new URL('../',import.meta.url);
const file=path=>readFileSync(new URL(path,root));
const read=path=>JSON.parse(file(path));
const asset=path=>file('assets/'+path);
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const glb=bytes=>JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)));
const meshNodes=document=>document.nodes.filter(node=>node.mesh!==undefined);
function lowerRigSignature(bytes, correctedNames){
 const doc=glb(bytes),binStart=28+bytes.readUInt32LE(12);
 const viewBytes=(index,offset=0,length=doc.bufferViews[index].byteLength)=>{
  const start=binStart+(doc.bufferViews[index].byteOffset||0)+offset;
  return bytes.subarray(start,start+length);
 };
 const nodes=doc.nodes.map(node=>[
  node.name,
  (node.children||[]).map(index=>doc.nodes[index].name),
  node.matrix??null,node.translation??null,node.rotation??null,node.scale??null,
  node.extras?.motionKind??null,node.extras?.motionSide??null,
  node.extras?.motionMuscle??null,node.extras?.muscleId??null,node.extras?.zname??null,
  node.mesh===undefined?0:doc.meshes[node.mesh].primitives.length,
  node.skin??null,
 ]);
 const roots=doc.scenes[doc.scene||0].nodes.map(index=>doc.nodes[index].name);
 const skins=doc.skins.map(skin=>{
  const accessor=doc.accessors[skin.inverseBindMatrices];
  assert.equal(accessor.type,'MAT4');
  assert.equal(accessor.componentType,5126);
  assert.equal(accessor.count,skin.joints.length);
  return [
   skin.joints.map(index=>doc.nodes[index].name),
   skin.skeleton===undefined?null:doc.nodes[skin.skeleton].name,
   hash(viewBytes(accessor.bufferView,accessor.byteOffset||0,accessor.count*16*4)),
  ];
 });
 const parts=meshNodes(doc).filter(node=>!correctedNames.includes(node.name)).map(node=>[
  node.name,
  ...doc.meshes[node.mesh].primitives.map(primitive=>hash(viewBytes(primitive.extensions.KHR_draco_mesh_compression.bufferView))),
 ]);
 const digest=entries=>hash(JSON.stringify(entries));
 return {
  namedNodesAndRestTransforms:digest([roots,nodes]),
  skinJointsAndInverseBindMatrices:digest(skins),
  unchangedDracoPrimitives:digest(parts),
 };
}

const manifest=read('assets/motion-walk-muscles.json');
const atlas=read('src/muscle-models.json');

test('whole-body walking covers exactly the active atlas surfaces with the original recorded channels',()=>{
 const expected=new Map(atlas.components.filter(part=>part.kind==='muscle'&&!part.retired).map(part=>[part.id,part]));
 assert.equal(manifest.totalMuscleSurfaces,expected.size);
 const legs=asset('motion-legs.glb');
 const authorshipInput=manifest.inputs['motion-legs.glb'];
 const upgrade=read('model-sources/motion-gastrocnemius-ankle.json');
 if(hash(legs)!==upgrade.baseAssetSHA256){
  assert.ok([hash(legs),upgrade.baseAssetSHA256].includes(authorshipInput),'Authoring input is a verified lower rig');
  const winding=upgrade.surfaceWindingRepair;
  const correctedNodes=[...upgrade.correctedNodes,...winding.correctedNodes];
  assert.deepEqual(lowerRigSignature(legs,correctedNodes),{
   ...upgrade.baseCompatibility,
   unchangedDracoPrimitives:winding.unchangedDracoPrimitives,
  },'Surface repairs must preserve named nodes, rest transforms, skin bindings and unrelated mesh payloads');
 }
 assert.equal(hash(asset('motion-walk-context.glb')),manifest.inputs['motion-walk-context.glb']);
 const recorded=meshNodes(glb(legs)).filter(node=>node.extras?.motionMuscle).map(node=>node.extras.muscleId);
 assert.equal(recorded.length,8);
 assert.deepEqual(recorded.sort(),[...manifest.baseMuscleIds].sort());
 for(const id of recorded)assert.ok(expected.delete(id),'Recorded part exists in the active atlas');
 const segments=new Set(['head','trunk','pelvis','left-arm','right-arm','left-leg','right-leg']);
 for(const [region,descriptor] of Object.entries(manifest.regions)){
  const bytes=asset(descriptor.file), document=glb(bytes), surfaceNodes=meshNodes(document);
  assert.equal(bytes.length,descriptor.bytes);
  assert.equal(hash(bytes),descriptor.sha256);
  assert.equal(surfaceNodes.length,descriptor.parts);
  const triangles=document.meshes.flatMap(mesh=>mesh.primitives).reduce((sum,part)=>sum+document.accessors[part.indices].count/3,0);
  assert.equal(triangles,descriptor.triangles);
  assert.ok(descriptor.maximumSampledSimplificationErrorMillimeters<=manifest.walkMeshDensity.sampledErrorLimitMillimeters);
  assert.equal(document.skins.length,1);
  const receiverJoints=new Set(document.skins[0].joints.map(index=>document.nodes[index].name));
  const counts={};
  for(const node of surfaceNodes){
   const part=node.extras, source=expected.get(part.muscleId);
   assert.ok(source,'No duplicate or unrecognized surface: '+part.muscleId);
   assert.equal(node.skin,0);
   assert.equal(part.motionSide,source.side);
   assert.equal(part.walkMuscleGroup,source.muscleName);
   assert.equal(part.motionPart,source.geometryReview?.displayName||source.name);
   assert.equal(part.walkRegion,region);
   assert.equal(source.region,region);
   assert.equal(part.walkEvidence,'anatomical-context');
   assert.equal(part.motionMuscle,undefined,'Additive surfaces never enter the recorded channel table');
   assert.equal(part.walkSegments[0],part.walkSegment);
   assert.ok(part.walkSegments.every(scope=>segments.has(scope)));
   assert.ok(part.walkDrivers.every(driver=>receiverJoints.has(manifest.drivers[driver])));
   assert.equal(part.walkDeformation,part.walkDrivers.length===1?'segment-follow':'guided-blend');
   counts[part.walkDeformation]=(counts[part.walkDeformation]||0)+1;
   expected.delete(part.muscleId);
  }
  assert.deepEqual(counts,descriptor.deformation);
 }
 assert.equal(expected.size,0,'All active atlas parts are modeled across the five packs and measured base rig');
});

test('walking uses the two fitted glute surfaces while neutral asset weights remain zero',()=>{
 const document=glb(asset(manifest.regions['pelvis-leg-foot'].file));
 const corrected=meshNodes(document).filter(node=>node.extras?.walkClearance);
 assert.deepEqual(corrected.map(node=>node.extras.muscleId).sort(),
  ['muscle-gluteus-maximus-muscle-l','muscle-gluteus-maximus-muscle-r']);
 for(const node of corrected){
  const mesh=document.meshes[node.mesh];
  const index=mesh.extras.targetNames.indexOf(node.extras.walkClearance);
  assert.ok(index>=0);
  assert.equal(mesh.weights[index],0);
 }
 const model=new THREE.Group(), scene=new THREE.Group();
 const driver=new THREE.Object3D(), receiver=new THREE.Object3D(), mesh=new THREE.Object3D();
 driver.name='driver';
 receiver.name='receiver';
 mesh.isSkinnedMesh=true;
 mesh.userData.walkClearance='GaitGlutealClearance';
 mesh.morphTargetDictionary={GaitGlutealClearance:0};
 mesh.morphTargetInfluences=[0];
 model.add(driver);
 scene.add(receiver,mesh);
 const pack=mountWalkPack({model},scene,{driver:'receiver'},captureWalkDrivers(model,['driver']));
 assert.equal(mesh.morphTargetInfluences[0],0);
 updateWalkPacks([pack]);
 assert.equal(mesh.morphTargetInfluences[0],1);
});
