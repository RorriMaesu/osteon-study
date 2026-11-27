import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {test} from 'node:test';
import {Vector3} from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {accessoryGlandOrgans,mountAccessoryGlandMotion} from '../src/organ-motion-accessory-glands.js';

async function glandSpecimen() {
  const entry = accessoryGlandOrgans.find(row=>row.id==='greater-vestibular-glands');
  const file = await readFile(new URL('../'+entry.asset,import.meta.url));
  const {scene} = await new GLTFLoader().parseAsync(file.buffer.slice(file.byteOffset,file.byteOffset+file.byteLength),'');
  return {entry,scene};
}

function outletFromTriangles(mesh) {
  const counts = new Map();
  const index = mesh.geometry.index.array;
  for(let i=0;i<index.length;i+=3){
    const [a,b,c]=index.subarray(i,i+3);
    for(const [v,w] of [[a,b],[b,c],[c,a]]){
      const key=v<w?v+','+w:w+','+v;
      counts.set(key,(counts.get(key)||0)+1);
    }
  }
  const edges=[...counts].filter(([,n])=>n===1).map(([key])=>key.split(',').map(Number));
  const vertices=new Set(edges.flat());
  const center=new Vector3(),v=new Vector3(),position=mesh.geometry.attributes.position;
  for(const id of vertices)center.add(v.fromBufferAttribute(position,id));
  return {edges:edges.length,vertices:vertices.size,center:center.divideScalar(vertices.size)};
}

test('both duct tracers end at the centers of the open donor surfaces',async()=>{
  const {entry,scene}=await glandSpecimen();
  for(const [side,name] of entry.targets.entries()){
    const mesh=scene.getObjectByName(name);
    assert.equal(mesh.geometry.index.count/3,[9152,10592][side]);
    const rim=outletFromTriangles(mesh);
    assert.equal(rim.edges,[32,40][side]);
    assert.equal(rim.vertices,rim.edges);
    const trace=entry.effects.find(fx=>fx.mode==='trace'&&!fx.range&&Math.sign(fx.points[0][0])===[1,-1][side]);
    assert(rim.center.distanceTo(new Vector3(...trace.points.at(-1)))<.000002);
    assert(new Vector3(...trace.points[0]).distanceTo(rim.center)>.05);
    assert(Math.abs(trace.points[0][0])>Math.abs(rim.center.x));
  }
});

test('paired markers travel during playback and all specimen materials are restored',async()=>{
  const {entry,scene}=await glandSpecimen();
  const meshes=new Map([...entry.targets,...entry.context].map(name=>[name,[scene.getObjectByName(name)]]));
  const originals=[...meshes.values()].map(([mesh])=>[mesh,mesh.material]);
  assert(originals.every(([mesh])=>mesh.isMesh));
  const motion=mountAccessoryGlandMotion(entry,{model:scene,invalidate(){}},meshes);
  const overlay=scene.getObjectByName('Visceral process indicators');
  const markers=()=>overlay.children.filter(object=>object.isGroup&&object.visible).map(object=>object.position.clone());
  motion.set(.41);const start=markers();
  motion.set(.70);const end=markers();
  assert.equal(start.length,2);assert.equal(end.length,2);
  for(const [i,p] of start.entries())assert(p.distanceTo(end[i])>.02);
  motion.set(.95);assert.equal(markers().length,2);
  motion.dispose();
  motion.dispose();
  assert(originals.every(([mesh,mat])=>mesh.material===mat));
  assert.equal(scene.getObjectByName('Visceral process indicators'),undefined);
});
