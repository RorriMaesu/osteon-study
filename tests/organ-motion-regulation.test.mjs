import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {regulationOrgans,mountRegulationMotion,regulationPhaseAt} from '../src/organ-motion-regulation.js';

function readGeometry(path){
  const buf=readFileSync(new URL('../'+path,import.meta.url));
  const doc=JSON.parse(buf.subarray(20,20+buf.readUInt32LE(12)).toString());
  const scene=new THREE.Scene(),model=new THREE.Group(),byName=new Map();scene.add(model);
  function visit(index,parent){
    const node=doc.nodes[index],object=new THREE.Group();
    if(node.matrix){object.matrix.fromArray(node.matrix);object.matrix.decompose(object.position,object.quaternion,object.scale);}
    if(node.translation)object.position.fromArray(node.translation);
    if(node.rotation)object.quaternion.fromArray(node.rotation);
    if(node.scale)object.scale.fromArray(node.scale);
    parent.add(object);
    if(node.mesh!=null){
      const list=[];
      for(const primitive of doc.meshes[node.mesh].primitives){
        const attr=doc.accessors[primitive.attributes.POSITION],lo=new THREE.Vector3(...attr.min),hi=new THREE.Vector3(...attr.max);
        const size=hi.clone().sub(lo),mid=hi.clone().add(lo).multiplyScalar(.5);
        const geo=new THREE.BoxGeometry(size.x,size.y,size.z,3,3,3);geo.translate(mid.x,mid.y,mid.z);
        const mesh=new THREE.Mesh(geo,new THREE.MeshStandardMaterial());
        object.add(mesh);list.push(mesh);
      }
      byName.set(node.name,list);
    }
    for(const n of node.children||[])visit(n,object);
  }
  for(const n of doc.scenes[doc.scene??0].nodes)visit(n,model);
  model.updateWorldMatrix(true,true);
  return {instance:{scene,model,invalidate(){}},byName};
}
const cache=new Map();
function specimen(entry){
  if(!cache.has(entry.asset))cache.set(entry.asset,readGeometry(entry.asset));
  return cache.get(entry.asset);
}

test('every regulation motion is bound to a distinct organ preparation with actual target and context surfaces',()=>{
  assert.equal(new Set(regulationOrgans.map(o=>o.id)).size,regulationOrgans.length);
  for(const organ of regulationOrgans){
    const {byName}=specimen(organ);
    assert.match(organ.source,/^https:\/\//);
    assert.ok(organ.targets.length&&organ.phases.length>=2,organ.id);
    assert.deepEqual(organ.targets,[...new Set(organ.targets)]);
    for(const name of [...organ.targets,...organ.context])assert.ok(byName.has(name),organ.id+' / '+name);
    for(let i=0;i<organ.phases.length;i++){
      assert.equal(regulationPhaseAt(organ,organ.phases[i].at??i/organ.phases.length).index,i,organ.id);
      assert.ok(organ.phases[i].label&&organ.phases[i].text&&organ.phases[i].sites.every(name=>organ.targets.includes(name)));
    }
  }
});
function snapshot(meshes){return meshes.map(m=>[...m.position.toArray(),...m.scale.toArray(),...m.quaternion.toArray()]);}
test('scrubbing mechanical organs is deterministic, moves geometry and restores every resting transform',()=>{
  for(const organ of regulationOrgans.filter(o=>o.kind==='Organ movement')){
    const {instance,byName}=specimen(organ),meshes=organ.targets.flatMap(n=>byName.get(n));
    const rest=snapshot(meshes),controller=mountRegulationMotion(organ,instance,byName);
    controller.set(.34);const first=snapshot(meshes);
    assert.notDeepEqual(first,rest,organ.id+' has no displacement');
    assert.ok(first.flat().every(Number.isFinite),organ.id);
    controller.set(.81);controller.set(.34);
    assert.deepEqual(snapshot(meshes),first,organ.id+' accumulates displacement');
    controller.dispose();assert.deepEqual(snapshot(meshes),rest,organ.id+' lost its resting shape');
  }
});
test('process overlays animate inside the same 3D scene and clean up after selection changes',()=>{
  for(const organ of regulationOrgans.filter(o=>o.kind==='Process overlay')){
    const {instance,byName}=specimen(organ),before=instance.scene.children.length;
    const controller=mountRegulationMotion(organ,instance,byName);
    const group=instance.scene.children.at(-1);
    controller.set(.09);const markers=group.children.filter(m=>m.visible);
    assert.ok(markers.length&&markers.every(m=>m.position.toArray().every(Number.isFinite)),organ.id);
    const first=snapshot(markers);controller.set(.14);
    assert.notDeepEqual(snapshot(group.children.filter(m=>m.visible)),first,organ.id+' has static markers');
    controller.set(1);controller.dispose();assert.equal(instance.scene.children.length,before,organ.id);
  }
});

test('superior and inferior caval streams approach the atrium simultaneously throughout the lesson',()=>{
  const entry=regulationOrgans.find(row=>row.id==='venae-cavae'),{instance,byName}=specimen(entry);
  const motion=mountRegulationMotion(entry,instance,byName),overlay=instance.scene.children.at(-1);
  for(const moment of [.06,.39,.72]){
    motion.set(moment);
    const streams=['Superior caval stream','Inferior caval stream'].map(name=>overlay.children.filter(m=>m.visible&&m.name===name));
    assert.ok(streams.every(s=>s.length>1));
    const start=streams.map(s=>s[0].position.y);
    motion.set(moment+.015);
    assert.ok(streams[0][0].position.y<start[0],'superior return descends');
    assert.ok(streams[1][0].position.y>start[1],'inferior return ascends');
  }
  motion.dispose();
});

test('the sagittal lens visibly closes its actual cut edge and releases the cap on exit',()=>{
  const entry=regulationOrgans.find(o=>o.id==='eye');
  const raw=readFileSync(new URL('../'+entry.asset,import.meta.url)),jsonLength=raw.readUInt32LE(12);
  const doc=JSON.parse(raw.subarray(20,20+jsonLength).toString());
  const source=doc.nodes.find(n=>n.name==='Lens');
  const p=doc.meshes[source.mesh].primitives[0],attr=doc.accessors[p.attributes.POSITION],view=doc.bufferViews[attr.bufferView];
  const start=28+jsonLength+(view.byteOffset||0)+(attr.byteOffset||0);
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(Array.from({length:attr.count*3},(_,i)=>raw.readFloatLE(start+i*4)),3));
  const mesh=new THREE.Mesh(geo,new THREE.MeshStandardMaterial());
  const scene=new THREE.Scene();scene.add(mesh);
  const motion=mountRegulationMotion(entry,{scene,invalidate(){}},new Map([['Lens',[mesh]]]));
  const face=mesh.children[0].geometry;face.computeBoundingBox();
  assert.ok(face.getAttribute('position').count>15);
  assert.ok(Math.abs(face.boundingBox.max.z-geo.boundingBox.max.z)<.00012);
  assert.ok(Math.abs(face.boundingBox.min.y-geo.boundingBox.min.y)<.00012);
  assert.ok(face.boundingBox.max.x-face.boundingBox.min.x<1e-8);
  motion.dispose();assert.equal(mesh.children.length,0);
});

test('vocalis muscles approximate posteriorly around fixed anterior attachments',()=>{
  const entry=regulationOrgans.find(o=>o.id==='phonation'),{instance,byName}=specimen(entry);
  const left=byName.get('Vocalis muscle.l')[0],right=byName.get('Vocalis muscle.r')[0];
  const landmarks=[left,right].map(m=>{
    const b=new THREE.Box3().setFromObject(m),middle=b.getCenter(new THREE.Vector3());
    return [m.worldToLocal(middle.clone().setZ(b.max.z)),m.worldToLocal(middle.clone().setZ(b.min.z))];
  });
  function segment(index){return [left,right].map((m,i)=>m.localToWorld(landmarks[i][index].clone()));}
  const motion=mountRegulationMotion(entry,instance,byName);
  motion.set(0);const anterior=segment(0),open=segment(1);
  motion.set(.55);const front=segment(0),closed=segment(1);
  assert.ok(front.every((p,i)=>p.distanceTo(anterior[i])<1e-7));
  assert.ok(closed[0].distanceTo(closed[1])<open[0].distanceTo(open[1])*.65);
  motion.dispose();
});
