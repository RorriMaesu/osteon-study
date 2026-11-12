import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {createRequire} from 'node:module';
import * as THREE from 'three';
import {chapter11Muscles} from '../src/chapter11-muscles.js';
import manifest from '../src/muscle-models.json' with {type:'json'};
import {courseMuscleTargets,courseMuscleTargetById,courseTargetComponents,courseComparisonGroups,courseChoiceCorrect,filterCourseMuscleTargets} from '../src/muscle-spatial-data.js';
import {createSurfaceProbe} from '../src/muscle-spatial.js';

const target=name=>courseMuscleTargetById.get('ch11-'+name);
const componentId=mesh=>mesh.userData.muscleId;
function delivered(region){
 const buf=readFileSync(new URL('../assets/'+manifest.assets[region].file,import.meta.url));
 const end=20+buf.readUInt32LE(12),gltf=JSON.parse(buf.subarray(20,end));
 return {gltf,bin:buf.subarray(end+8)};
}

test('the spatial checklist covers the 67 course IDs and only references active delivered components',()=>{
 const terms=chapter11Muscles.filter(c=>c.courseChecklist).map(c=>c.id);
 assert.equal(terms.length,67);assert.equal(courseMuscleTargetById.size,67);
 assert.deepEqual(new Set(courseMuscleTargets.map(t=>t.id)),new Set(terms));
 const sourceIds=new Set(Object.keys(manifest.assets).flatMap(region=>delivered(region).gltf.nodes.filter(n=>n.mesh!==undefined).map(n=>n.extras.muscleId)));
 const activeIds=new Set(manifest.components.filter(c=>!c.retired).map(c=>c.id));
 assert.ok(courseMuscleTargets.flatMap(t=>t.componentIds).every(id=>sourceIds.has(id)&&activeIds.has(id)));
 assert.equal(filterCourseMuscleTargets({scoredOnly:true}).length,59);
 for(const slug of ['styloglossus','ischiocavernosus','external-urethral-sphincter']){
  assert.equal(target(slug).status,'missing');assert.equal(target(slug).componentIds.length,0);
 }
 assert.equal(target('pelvic-diaphragm').status,'partial');assert.ok(!target('pelvic-diaphragm').componentIds.some(id=>id.includes('pubo-analis')));
 assert.equal(target('erector-spinae').status,'review');
 assert.equal(target('external-intercostals').status,'serial');
 assert.deepEqual(target('aponeurosis').examples.map(x=>x.region),['forearm-hand','pelvis-leg-foot','head-neck']);
 assert.ok(target('calcaneal-tendon').components.every(c=>c.kind==='support'));
});

test('a sided prompt retains the correct parts and a Find choice cannot share its answer meshes',()=>{
 for(const side of ['left','right'])for(const t of filterCourseMuscleTargets({scoredOnly:true})){
  const own=courseTargetComponents(t,side),ids=own.map(x=>x.id),alternatives=courseComparisonGroups(t,{side});
  assert.ok(own.length);assert.ok(courseChoiceCorrect(ids,[ids[0]]));
  const seen=new Set(ids);
  for(const option of alternatives){
   assert.ok(!courseChoiceCorrect(ids,option.componentIds));
   for(const id of option.componentIds){assert.ok(!seen.has(id));seen.add(id);}
  }
  if(!t.wholePair)assert.ok(own.every(x=>x.side===side||x.side==='bilateral'||x.side==='midline'));
 }
 assert.equal(courseTargetComponents(target('triceps-brachii'),'right').length,3);
 assert.equal(courseTargetComponents(target('rotator-cuff'),'left').length,4);
 assert.equal(courseTargetComponents(target('diaphragm'),'left').length,1);
 assert.equal(courseTargetComponents(target('orbicularis-oris'),'left').length,2);
 assert.equal(courseTargetComponents(target('external-anal-sphincter'),'right').length,2);
 assert.deepEqual(filterCourseMuscleTargets({targetIds:[]}),[]);
});

test('projection uses a real visible surface and never an occluded target or a bounds-only fallback',()=>{
 const camera=new THREE.PerspectiveCamera(32,1,.005,30);camera.position.set(0,0,4);camera.lookAt(0,0,0);
 const rayProbe=createSurfaceProbe();
 const ring=new THREE.Mesh(new THREE.RingGeometry(.2,.55,32),new THREE.MeshBasicMaterial({side:THREE.DoubleSide}));
 ring.userData.bounds=new THREE.Box3().setFromObject(ring);
 const hit=rayProbe(camera,[ring],[ring]);assert.equal(hit?.mesh,ring);assert.ok(hit.point.length()>=.195);
 const blocker=new THREE.Mesh(new THREE.PlaneGeometry(2,2),new THREE.MeshBasicMaterial({side:THREE.DoubleSide}));
 blocker.position.z=.4;blocker.updateMatrixWorld();
 assert.equal(rayProbe(camera,[ring],[ring,blocker]),null);
 assert.equal(rayProbe(camera,[ring],[ring],()=>false),null);
});

// Decode representative production Draco primitives rather than replacing
// the source geometry with bounding boxes or testing only JSON identities.
const decoderCode=readFileSync(new URL('../vendor/draco/draco_decoder.js',import.meta.url),'utf8');
let dracoModule;
async function draco(){
 if(!dracoModule){
  const env={module:{exports:{}},exports:{},require:createRequire(import.meta.url),process,console,setTimeout,clearTimeout,__dirname:'.'};
  runInNewContext(decoderCode,env);dracoModule=env.module.exports({});
 }
 return dracoModule;
}
export async function regionMeshes(region,ids){
 const {gltf,bin}=delivered(region),lib=await draco(),decoder=new lib.Decoder(),meshes=[];
 function visit(i,parent){
  const n=gltf.nodes[i],matrix=new THREE.Matrix4();
  if(n.matrix)matrix.fromArray(n.matrix);else matrix.compose(new THREE.Vector3(...(n.translation||[0,0,0])),new THREE.Quaternion(...(n.rotation||[0,0,0,1])),new THREE.Vector3(...(n.scale||[1,1,1])));
  const world=new THREE.Matrix4().multiplyMatrices(parent,matrix);
  if(n.mesh!==undefined&&ids.has(n.extras?.muscleId)){
   for(const p of gltf.meshes[n.mesh].primitives){
    const ext=p.extensions.KHR_draco_mesh_compression,view=gltf.bufferViews[ext.bufferView],a=bin.subarray(view.byteOffset||0,(view.byteOffset||0)+view.byteLength);
    const buffer=new lib.DecoderBuffer(),raw=new lib.Mesh();buffer.Init(new Int8Array(a),a.byteLength);
    const status=decoder.DecodeBufferToMesh(buffer,raw);assert.ok(status.ok());
    const data=new lib.DracoFloat32Array(),attr=decoder.GetAttributeByUniqueId(raw,ext.attributes.POSITION);
    decoder.GetAttributeFloatForAllPoints(raw,attr,data);
    const positions=new Float32Array(raw.num_points()*3);for(let j=0;j<positions.length;j++)positions[j]=data.GetValue(j);
    const indices=new Uint32Array(raw.num_faces()*3),face=new lib.DracoInt32Array();
    for(let j=0;j<raw.num_faces();j++){decoder.GetFaceFromMesh(raw,j,face);for(let k=0;k<3;k++)indices[j*3+k]=face.GetValue(k);}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(positions,3));g.setIndex(new THREE.BufferAttribute(indices,1));
    const mesh=new THREE.Mesh(g,new THREE.MeshBasicMaterial({side:THREE.DoubleSide}));mesh.matrixAutoUpdate=false;mesh.matrix.copy(world);mesh.updateMatrixWorld(true);
    mesh.userData={muscleId:n.extras.muscleId,bounds:new THREE.Box3().setFromObject(mesh)};meshes.push(mesh);
    for(const x of [face,data,status,raw,buffer])lib.destroy(x);
   }
  }
  for(const child of n.children||[])visit(child,world);
 }
 try{for(const i of gltf.scenes[gltf.scene||0].nodes)visit(i,new THREE.Matrix4());}finally{lib.destroy(decoder);}
 return meshes;
}

test('Find it can distinguish the delivered biceps brachii from another real upper-arm surface',async()=>{
 const t=target('biceps-brachii'),ids=courseTargetComponents(t).map(c=>c.id),choices=courseComparisonGroups(t,{limit:3});
 const meshes=await regionMeshes(t.region,new Set([...ids,...choices.flatMap(c=>c.componentIds)]));
 assert.ok(meshes.length>=4);
 const box=meshes.reduce((b,m)=>b.union(m.userData.bounds),new THREE.Box3()),center=box.getCenter(new THREE.Vector3()),extent=box.getSize(new THREE.Vector3()).length();
 const camera=new THREE.PerspectiveCamera(32,1,.005,30),probe=createSurfaceProbe();let seen=null;
 for(const direction of [[0,0,1],[-1,0,.5],[0,0,-1],[1,0,0]]){
  camera.position.copy(center).addScaledVector(new THREE.Vector3(...direction).normalize(),extent*2.1);camera.lookAt(center);
  const hit=probe(camera,meshes.filter(m=>ids.includes(componentId(m))),meshes);
  const other=probe(camera,meshes.filter(m=>!ids.includes(componentId(m))),meshes);
  if(hit&&other){seen={hit,other};break;}
 }
 assert.ok(seen,'A usable view must expose both the named target and a different selectable muscle');
 assert.ok(courseChoiceCorrect(ids,[componentId(seen.hit.mesh)]));
 assert.ok(!courseChoiceCorrect(ids,[componentId(seen.other.mesh)]));
});
