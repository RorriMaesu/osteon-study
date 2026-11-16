import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {MotionReveal} from '../src/motion-reveal.js';

function setup(){
 const stage=Object.assign(new EventTarget(),{dataset:{},clientWidth:700,clientHeight:500});
 const camera=new THREE.PerspectiveCamera(35,1.4,.004,30);
 camera.position.z=4;
 const model=new THREE.Group();
 const parts=[],revealBones=[];
 const reveal=new MotionReveal(stage);
 let now=0;
 return {
  stage,camera,reveal,model,
  muscle(name,x,y,z,radius,material){
   const mesh=new THREE.Mesh(new THREE.SphereGeometry(radius,18,12),material);
   mesh.position.set(x,y,z);
   model.add(mesh);
   const part={name,mesh};
   parts.push(part);
   return part;
  },
  scan(dirty=true){
   for(let i=0;i<45;i++)reveal.tick(now+=16,16,{model,parts,revealBones},camera,dirty&&i===0,true);
  },
  bone(mesh,material){
   mesh.material=material;
   parts.splice(parts.findIndex(part=>part.mesh===mesh),1);
   revealBones.push(mesh);
  },
 };
}

test('selected reveal fades independent covers, holds while paused, and restores after orbiting',()=>{
 const {stage,camera,reveal,muscle,scan}=setup();
 const base=new THREE.MeshStandardMaterial();
 const target=muscle('Target',0,0,0,.3,base);
 const first=muscle('Near blocker',0,0,1,.45,base);
 const second=muscle('Deep blocker',0,0,.5,.35,base);
 const behind=muscle('Behind the target',0,0,-.6,.4,base);
 reveal.configure({selected:target,targets:[],bones:false,contributors:new Set([first.mesh])});
 scan();
 scan(false);
 assert.equal(stage.dataset.revealCount,'2');
 assert.equal(target.mesh.material,base);
 assert.equal(behind.mesh.material,base);
 assert.equal(base.opacity,1);
 assert.ok(first.mesh.material.opacity<.3);
 assert.ok(second.mesh.material.opacity<.3);

 camera.position.z=-4;
 camera.lookAt(0,0,0);
 scan();
 assert.equal(first.mesh.material,base);
 assert.equal(second.mesh.material,base);
 assert.ok(behind.mesh.material.opacity<.3);
 reveal.reset();
 assert.equal(behind.mesh.material,base);
});

test('a fully bone-obscured muscle has no surface label until bone fading is enabled',()=>{
 const {stage,reveal,muscle,bone,scan}=setup();
 const target=muscle('Target',0,0,0,.2);
 const cover=muscle('Bone',0,0,.7,.42);
 const base=new THREE.MeshStandardMaterial();
 bone(cover.mesh,base);
 reveal.configure({selected:target,targets:[],bones:false,contributors:new Set()});
 scan();
 assert.equal(reveal.anchor,undefined);
 assert.equal(cover.mesh.material,base);

 reveal.configure({selected:target,targets:[],bones:true,contributors:new Set()});
 scan();
 assert.equal(stage.dataset.revealBoneCount,'1');
 assert.equal(typeof reveal.anchor,'number');
 assert.ok(cover.mesh.material.opacity<.3);
});

test('group reveal preserves contributors until one is selected for closer inspection',()=>{
 const {stage,reveal,muscle,scan}=setup();
 const deep=muscle('Deep contributor',0,0,0,.23);
 const superficial=muscle('Superficial contributor',0,0,.55,.34);
 const cover=muscle('Context cover',0,0,1.15,.44);
 const contributors=new Set([deep.mesh,superficial.mesh]);
 const targets=[deep,superficial];
 const solid=superficial.mesh.material;
 reveal.configure({selected:null,targets,bones:false,contributors});
 scan();
 assert.equal(superficial.mesh.material,solid);
 assert.ok(cover.mesh.material.opacity<.3);

 reveal.configure({selected:deep,targets,bones:false,contributors});
 scan();
 assert.ok(superficial.mesh.material.opacity<.3);
 assert.equal(stage.dataset.revealTarget,'Deep contributor');
 reveal.configure({selected:null,targets:[],bones:false,contributors:new Set()});
 scan();
 assert.equal(superficial.mesh.material,solid);
 assert.equal(cover.mesh.material.opacity,1);
});
