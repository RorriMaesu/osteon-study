import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {skinOrgans,mountSkinMotion} from '../src/organ-motion-skin.js';

const raw=readFileSync(new URL('../'+skinOrgans[0].asset,import.meta.url));
const gltf=await new GLTFLoader().parseAsync(raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength),'');
const meshes=new Map();
gltf.scene.traverse(mesh=>{if(mesh.isMesh)meshes.set(mesh.name,[mesh]);});
const viewer={scene:gltf.scene,invalidate(){}};
const needle=name=>meshes.get(name)[0];
const point=(mesh,i)=>mesh.getVertexPosition(i,new THREE.Vector3());

test('the three learning activities use named skin structures from the published Blender cutaway',()=>{
  for(const entry of skinOrgans){
    for(const name of [...entry.targets,...entry.context])assert.ok(needle(name).userData.label,name);
    for(const phase of entry.phases)assert.ok(phase.sites.every(name=>entry.targets.includes(name)));
  }
  const coil=needle('eccrine_coil').userData.path_mm;
  const duct=needle('sweat_duct').userData.path_mm;
  assert.deepEqual(coil.slice(-3),duct.slice(0,3));
  assert.ok(coil[1]<-1.5&&Math.abs(duct.at(-2))<.001);
  const oil=needle('sebaceous_duct').userData;
  assert.deepEqual(oil.sebum_mm.slice(0,oil.path_mm.length),oil.path_mm);
  assert.ok(oil.sebum_mm.at(-2)>0);
});

test('sweat and sebum each travel from the gland to their own outlet',()=>{
  const destinations=[];
  for(const entry of skinOrgans.slice(0,2)){
    const before=viewer.scene.children.length,m=mountSkinMotion(entry,viewer,meshes),marker=viewer.scene.children.at(-1);
    m.set(.03);assert.ok(marker.visible);const gland=marker.position.clone();
    m.set(.55);const duct=marker.position.clone();
    m.set(.91);const surface=marker.position.clone();destinations.push(surface);
    assert.ok(duct.y>gland.y&&surface.y>duct.y,entry.id);
    m.set(.03);assert.ok(marker.position.distanceTo(gland)<1e-12);
    m.dispose();assert.equal(viewer.scene.children.length,before);
  }
  assert.ok(destinations[0].distanceTo(destinations[1])>.001);
});

test('piloerection raises the shaft and shortens the muscle around its dermal attachment',()=>{
  const entry=skinOrgans[2],motion=mountSkinMotion(entry,viewer,meshes);
  const hair=needle('hair'),muscle=needle('arrector_pili');
  function opposingVertices(mesh,direction){
    let low=Infinity,high=-Infinity,lo=0,hi=0;
    for(let i=0;i<mesh.geometry.attributes.position.count;i++){
      const dot=point(mesh,i).dot(direction);
      if(dot<low){low=dot;lo=i;}if(dot>high){high=dot;hi=i;}
    }
    return [lo,hi];
  }
  motion.set(0);
  const [base,tip]=opposingVertices(hair,new THREE.Vector3(0,1,0));
  const [lower,upper]=opposingVertices(muscle,new THREE.Vector3(1,.5,0));
  const angle=()=>point(hair,tip).sub(point(hair,base)).angleTo(new THREE.Vector3(0,1,0));
  const length=()=>point(muscle,upper).distanceTo(point(muscle,lower));
  const restAngle=angle(),restLength=length(),fixed=point(muscle,upper);
  motion.set(.58);
  assert.ok(restAngle-angle()>.23);
  assert.ok(length()<restLength*.97);
  assert.ok(point(muscle,upper).distanceTo(fixed)<.000012);
  motion.dispose();
  assert.ok(Math.abs(angle()-restAngle)<1e-8&&Math.abs(length()-restLength)<1e-8);
});
