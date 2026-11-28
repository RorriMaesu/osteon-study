import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {createEyeAppearance,isEyeSurface} from '../src/organ-eye-appearance.js';

const asset='assets/organ-atlas/registered-organs.glb';
async function registeredEyes(){
  const source=readFileSync(new URL('../'+asset,import.meta.url));
  return (await new GLTFLoader().parseAsync(source.buffer.slice(source.byteOffset,source.byteOffset+source.byteLength),'')).scene;
}

test('exterior materials only apply to registered bilateral surfaces and retain optical depth settings',async()=>{
  const root=await registeredEyes();
  assert.equal(isEyeSurface('assets/ap2-neuro/eye-section.glb','Iris'),false);
  assert.equal(isEyeSurface(asset,'optic_nerve_left'),false);
  for(const side of ['left','right']){
    const mesh=root.getObjectByName('cornea_'+side),mat=mesh.material,geometry=mesh.geometry;
    const controller=createEyeAppearance(mesh,asset,mesh.name);
    assert.ok(controller);
    const pos=mesh.geometry.getAttribute('position'),rest=pos.array.slice();
    controller.setMode('natural');
    let maxMove=0,stable=0;
    for(let i=0;i<pos.count;i++){
      const travel=Math.hypot(pos.getX(i)-rest[3*i],pos.getY(i)-rest[3*i+1],pos.getZ(i)-rest[3*i+2]);
      maxMove=Math.max(maxMove,travel);if(travel===0)stable++;
    }
    assert.ok(maxMove>.00015&&maxMove<.000161,'Only the small donor seam should close');
    assert.ok(stable>pos.count*.45,'The central dome should remain intact');
    const sealed=pos.array.slice();controller.setNearFocus(1);assert.deepEqual(pos.array,sealed);
    assert.equal(mesh.material,mat);assert.equal(mat.transparent,true);assert.equal(mat.depthWrite,false);
    controller.applyVisibility(.2,true,false);
    assert.equal(mat.opacity,.2);
    controller.applyVisibility(1,false,true);
    assert.equal(mat.transparent,true);assert.equal(mat.depthWrite,false);
    controller.setMode('teaching');
    assert.deepEqual(pos.array,rest);
    assert.equal(mat.transparent,false);assert.equal(mat.depthWrite,true);
    controller.dispose();assert.equal(mesh.geometry,geometry);
  }
});

test('near accommodation constricts the real, open pupil with its fibers attached and its outer iris fixed',async()=>{
  const root=await registeredEyes();
  for(const side of ['left','right']){
    const sign=side==='left'?1:-1,mesh=root.getObjectByName('iris_'+side),source=mesh.geometry;
    const controller=createEyeAppearance(mesh,asset,mesh.name);
    const pos=mesh.geometry.getAttribute('position'),uv=mesh.geometry.getAttribute('organEyeUv');
    const far=pos.array.slice(),coords=uv.array.slice();
    const changes=[];
    controller.setMode('natural');controller.setNearFocus(1);
    let fixedRim=0;
    for(let i=0;i<pos.count;i++){
      const x=far[3*i],y=far[3*i+1],z=far[3*i+2];
      const displacement=Math.hypot(pos.getX(i)-x,pos.getY(i)-y,pos.getZ(i)-z);
      const radius=Math.hypot(x-.0311366*sign,y-1.5912949);
      if(radius<.0019){
        assert.ok(displacement>.0004);
        assert.ok(Math.hypot(pos.getX(i)-.0311366*sign,pos.getY(i)-1.5912949)<radius);
        changes.push(displacement);
      }
      if(radius>.0062){assert.equal(displacement,0);fixedRim++;}
    }
    assert.ok(changes.length>30&&fixedRim>30);
    assert.deepEqual(uv.array,coords);
    controller.setMode('teaching');assert.deepEqual(pos.array,far);
    controller.setMode('natural');controller.setNearFocus(0);assert.deepEqual(pos.array,far);
    controller.dispose();assert.equal(mesh.geometry,source);
  }
});

test('iris refraction clears when a learner hides or isolates the optical surface',async()=>{
  const root=await registeredEyes(),camera=new THREE.PerspectiveCamera();
  const cornea=root.getObjectByName('cornea_right'),iris=root.getObjectByName('iris_right');
  const controller=createEyeAppearance(cornea,asset,cornea.name);
  const shader={uniforms:{},vertexShader:'#include <common>\n#include <begin_vertex>',
    fragmentShader:'#include <common>\n#include <opaque_fragment>'};
  cornea.material.onBeforeCompile(shader);
  const sample=()=>{cornea.onBeforeRender(null,root,camera);return shader.uniforms.eyeRefract.value;};
  controller.setMode('natural');
  assert.equal(sample(),1);
  iris.visible=false;assert.equal(sample(),0);
  iris.visible=true;iris.layers.set(2);assert.equal(sample(),0);
  camera.layers.enable(2);assert.equal(sample(),1);
  iris.material.opacity=.15;assert.equal(sample(),0);
  controller.dispose();
});
