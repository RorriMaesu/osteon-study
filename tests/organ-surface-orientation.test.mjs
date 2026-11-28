import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {createOrganAppearance,registerOrganMaterials} from '../src/organ-tissue-material.js';
import {orientOrganSurface} from '../src/organ-surface-orientation.js';

const registered='assets/organ-atlas/registered-organs.glb';
async function load(asset){
  const bytes=readFileSync(new URL('../'+asset,import.meta.url));
  const gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
  return registerOrganMaterials(gltf);
}
function reversedCount(donor,rendered){
  const a=donor.index,b=rendered.index;
  let count=0;
  for(let i=0;i<a.count;i+=3){
    assert.equal(a.getX(i),b.getX(i));
    if(a.getX(i+1)===b.getX(i+1)){assert.equal(a.getX(i+2),b.getX(i+2));continue;}
    assert.equal(a.getX(i+1),b.getX(i+2));
    assert.equal(a.getX(i+2),b.getX(i+1));
    count++;
  }
  return count;
}

test('correct only mirrored brain, tooth and unilateral organ pieces on the registered donor',async()=>{
  const model=await load(registered),tissue=createOrganAppearance();
  for(const [name,min,max] of [
    ['frontal_lobes',.49,.51],['temporal_lobes',.49,.51],['occipital_lobes',.49,.51],
    ['parietal_lobes',.49,.51],['cerebellum',.42,.46],['skin',0,0],['upper_teeth',.49,.51],
    ['pons_left',1,1],['submandibular_gland_right',1,1],['malleus_left',1,1],
    ['pons_right',0,0],['liver',0,0],['left_ventricle',0,0],['iris_left',0,0]
  ]){
    const mesh=model.getObjectByName(name),original=mesh.geometry;
    const faces=original.index.array.slice(),normals=original.attributes.normal.array.slice();
    tissue.prepare(mesh,registered);
    const corrected=mesh.geometry,portion=reversedCount(original,corrected)*3/original.index.count;
    assert.ok(portion>=min&&portion<=max,name+' '+portion);
    assert.deepEqual(original.index.array,faces);
    assert.deepEqual(original.attributes.normal.array,normals);
    assert.deepEqual(corrected.attributes.position.array,original.attributes.position.array);
    if(!min)assert.equal(original,corrected,name);
  }
});

test('registered native skin keeps the eye apertures open and covers both cheeks, brows and lips',async()=>{
  const model=await load(registered),skin=model.getObjectByName('skin');
  const front=(mesh,x,y)=>new THREE.Raycaster(new THREE.Vector3(x,y,.3),new THREE.Vector3(0,0,-1))
    .intersectObject(mesh,false)[0]?.point.z??-Infinity;
  for(const sign of [-1,1]){
    const iris=model.getObjectByName(sign>0?'iris_left':'iris_right');
    const surface=front(skin,.031*sign,1.5913);
    const irisEdgeX=.034*sign;
    // Use a two-sided optical sample independently of the live eye shader.
    iris.material=iris.material.clone();iris.material.side=THREE.DoubleSide;
    assert.ok(surface<0&&front(iris,irisEdgeX,1.5913)>.06);
    assert.ok(front(skin,.031*sign,1.605)>.075,'brow');
    assert.ok(front(skin,.039*sign,1.563)>.075,'cheek');
    assert.ok(front(skin,.004*sign,1.5375)>.09,'upper lip');
    assert.ok(front(skin,.004*sign,1.522)>.09,'lower lip');
  }
});

test('both hemispheres present their outside surface when viewed from opposite sides',async()=>{
  const model=await load(registered);
  const lobes=model.children.filter(m=>/_lobes$|^insulae$/.test(m.name));
  assert.equal(lobes.length,6);
  const bounds=new THREE.Box3();
  for(const m of lobes)bounds.expandByObject(m);
  function depthDifferences(){
    const differences=[];
    for(let i=1;i<14;i++)for(let j=1;j<18;j++){
      const y=THREE.MathUtils.lerp(bounds.min.y,bounds.max.y,i/14),z=THREE.MathUtils.lerp(bounds.min.z,bounds.max.z,j/18);
      const depths=[-1,1].map(side=>new THREE.Raycaster(new THREE.Vector3(side*.2,y,z),new THREE.Vector3(-side,0,0)).intersectObjects(lobes,false)[0]?.distance);
      if(depths.every(Number.isFinite))differences.push(Math.abs(depths[0]-depths[1]));
    }
    return differences.sort((a,b)=>a-b);
  }
  const initial=depthDifferences();
  for(const mesh of lobes)orientOrganSurface(mesh,registered,mesh.name);
  const corrected=depthDifferences();
  assert.ok(corrected.length>130);
  assert.ok(initial[Math.floor(initial.length/2)]>.001);
  assert.ok(corrected[Math.floor(corrected.length*.90)]<.0005);
});

test('sectional brain and ear lessons use their own donor geometry and preserve selection indices',async()=>{
  for(const [asset,cases] of [
    ['assets/ap2-neuro/brain.glb',[['region_Right_frontal_lobe',1],['region_Left_frontal_lobe',0],['region_Thalamus',.5]]],
    ['assets/ap2-neuro/outer-ear.glb',[['region_Tympanic_membrane',1],['region_Stapes',1]]],
    ['assets/ap2-neuro/long-cord.glb',[['region_Dorsal_root_ganglia',.5]]]
  ]){
    const model=await load(asset);
    for(const [name,expected] of cases){
      const mesh=model.getObjectByName(name),original=mesh.geometry;
      orientOrganSurface(mesh,asset,name);
      const rendered=mesh.geometry;
      const ratio=reversedCount(original,rendered)*3/original.index.count;
      assert.ok(Math.abs(ratio-expected)<.01,name+' '+ratio);
      orientOrganSurface(mesh,asset,name);
      assert.equal(mesh.geometry,rendered,'already-correct pieces stay intact');
    }
  }
});
