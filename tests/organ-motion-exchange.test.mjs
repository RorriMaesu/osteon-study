import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Vector3} from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {exchangeOrgans,mountExchangeMotion} from '../src/organ-motion-exchange.js';

async function preparation(id){
  const entry=exchangeOrgans.find(e=>e.id===id);
  const bytes=readFileSync(new URL('../'+entry.asset,import.meta.url));
  const {scene:model}=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
  const meshes=new Map([...entry.targets,...entry.context].map(name=>{
    const object=model.getObjectByName(name);
    assert(object?.isMesh,id+': '+name);
    return [name,[object]];
  }));
  return {entry,model,meshes,instance:{model,invalidate(){}}};
}
const position=(model,name)=>model.getObjectByName(name).geometry.getAttribute('position');
function nearestVertexDistance(attribute,point){
  const vertex=new Vector3(),target=new Vector3(...point);
  let closest=Infinity;
  for(let i=0;i<attribute.count;i++)closest=Math.min(closest,vertex.fromBufferAttribute(attribute,i).distanceTo(target));
  return closest;
}
function visibleMarker(model){
  const visible=model.getObjectByName('Visceral process indicators').children.filter(o=>o.isGroup&&o.visible);
  assert.equal(visible.length,1);
  return visible[0].position.clone();
}

test('lymph follows separate left and right terminal ducts to their ipsilateral venous angles',async()=>{
  const {entry,model,meshes,instance}=await preparation('lymphatic-drainage');
  const motion=mountExchangeMotion(entry,instance,meshes);
  motion.set(.06);const abdominal=visibleMarker(model);
  motion.set(.49);const left=visibleMarker(model);
  motion.set(.60);const rightStart=visibleMarker(model);
  motion.set(.91);const rightEnd=visibleMarker(model);
  assert(left.y>abdominal.y+1&&left.x>0&&rightStart.x<rightEnd.x&&rightEnd.x<0);
  for(const [side,end] of [['right',rightEnd],['left',left]]){
    assert(nearestVertexDistance(position(model,side+'_venous_angle'),end.toArray())<.06);
  }
  motion.dispose();assert(!model.getObjectByName('Visceral process indicators'));
});

test('both villus pathways enter vessels and glucose continues through the draining venule',async()=>{
  const {entry,model,meshes,instance}=await preparation('villus-absorption');
  const motion=mountExchangeMotion(entry,instance,meshes);
  motion.set(.3);const capillary=visibleMarker(model);
  motion.set(.519);const portal=visibleMarker(model);
  motion.set(.82);const lymph=visibleMarker(model);
  assert(nearestVertexDistance(position(model,'capillary_network'),capillary.toArray())<.065);
  assert(nearestVertexDistance(position(model,'portal_venule'),portal.toArray())<.09);
  assert(nearestVertexDistance(position(model,'lacteal'),lymph.toArray())<.10);
  assert(capillary.x>.18&&portal.x>.5&&portal.y<capillary.y&&Math.abs(lymph.x)<.05);
  motion.dispose();motion.dispose();
});

test('pleural surfaces expand together, the central dome descends, and scrubbing restores resting vertices',async()=>{
  const {entry,model,meshes,instance}=await preparation('pleural-coupling');
  const originals=new Map([...meshes].map(([n,[mesh]])=>[n,mesh.geometry]));
  const motion=mountExchangeMotion(entry,instance,meshes);
  function extremes(name){
    const a=position(model,name);let xmax=-Infinity,ymax=-Infinity;
    for(let i=0;i<a.count;i++){xmax=Math.max(xmax,a.getX(i));ymax=Math.max(ymax,a.getY(i));}
    return [xmax,ymax];
  }
  motion.set(0);const reset=extremes('diaphragm')[1];const rim0=extremes('visceral_pleura')[0];
  motion.set(.50);
  assert(extremes('diaphragm')[1]<reset-.1);
  assert(extremes('visceral_pleura')[0]>rim0+.07);
  assert(extremes('chest_wall')[0]>extremes('parietal_pleura')[0]);
  assert(extremes('parietal_pleura')[0]>extremes('pleural_fluid')[0]);
  assert(extremes('pleural_fluid')[0]>extremes('visceral_pleura')[0]);
  assert.equal(model.getObjectByName('Pleural surface landmarks').children.length,2);
  motion.set(1);assert(Math.abs(extremes('diaphragm')[1]-reset)<1e-7);
  motion.dispose();motion.dispose();
  for(const [name,g] of originals)assert.equal(meshes.get(name)[0].geometry,g);
  assert(!model.getObjectByName('Pleural surface landmarks'));
});

test('erythrocyte oxygenation survives seeking and restores the original tissue color',async()=>{
  const {entry,model,meshes,instance}=await preparation('formed-elements');
  const material=meshes.get('erythrocyte_membrane')[0].material;
  const initial=material.color.getHex();
  const motion=mountExchangeMotion(entry,instance,meshes);
  motion.set(0);const deoxygenated=material.color.getHex();const incoming=visibleMarker(model);
  motion.set(.42);const oxygenated=material.color.getHex();
  assert.notEqual(oxygenated,deoxygenated);
  motion.set(.99);const released=visibleMarker(model);
  assert(released.x>incoming.x+.8);
  assert.equal(material.color.getHex(),deoxygenated);
  motion.set(.42);assert.equal(material.color.getHex(),oxygenated);
  motion.dispose();assert.equal(material.color.getHex(),initial);
});
