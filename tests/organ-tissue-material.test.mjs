import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createOrganAppearance,registerOrganMaterials,organTissueKind,cloneOrganMaterial,tintOrganMaterial}
  from '../src/organ-tissue-material.js';

const asset='assets/organ-atlas/registered-organs.glb';
function register(name,mesh,materials=[]){
  const scene=new THREE.Group();scene.add(mesh);
  const associations=new Map([[mesh,{nodes:0}]]);
  for(const [i,mat] of [].concat(mesh.material).entries())if(materials[i])associations.set(mat,{materials:i});
  registerOrganMaterials({scene,parser:{associations,json:{nodes:[{name}],materials}}});
}
function shaderFor(mat){
  const shader={uniforms:{},vertexShader:THREE.ShaderLib.standard.vertexShader,fragmentShader:THREE.ShaderLib.standard.fragmentShader};
  mat.onBeforeCompile(shader);return shader;
}
test('open teaching sections and donor patches draw their reverse face while neighboring closed anatomy keeps its own winding',()=>{
  const app=createOrganAppearance();
  for(const [file,name,side] of [
    ['assets/ap2-neuro/skin-receptors.glb','region_Pacinian_corpuscle',THREE.DoubleSide],
    ['assets/ap2-neuro/skin-receptors.glb','region_Meissner_corpuscle',THREE.FrontSide],
    [asset,'concha_of_auricle_left',THREE.DoubleSide],[asset,'concha_of_auricle_right',THREE.DoubleSide],
    [asset,'neurohypophysis',THREE.DoubleSide],[asset,'kidney_left',THREE.FrontSide],
    ['assets/organ-atlas/mammary-glands.glb','VH_F_suspensory_ligaments_L',THREE.DoubleSide],
    ['assets/organ-atlas/mammary-glands.glb','VH_F_suspensory_ligaments_R',THREE.DoubleSide]
  ]){
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshStandardMaterial());
    register(name,mesh);app.prepare(mesh,file,null);assert.equal(mesh.material.side,side,name);
  }
  app.dispose();
});
test('gross surface has stable UV-independent coordinates, switchable colors, and a smooth motion cue',()=>{
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshStandardMaterial({metalness:1}));
  mesh.geometry.deleteAttribute('uv');
  register('liver',mesh);
  const app=createOrganAppearance();app.prepare(mesh,asset,'#cc8844');
  const rest=mesh.geometry.getAttribute('organRest');
  assert.equal(rest.normalized,true);const x=rest.getX(0);
  mesh.geometry.attributes.position.setX(0,24);
  assert.equal(rest.getX(0),x);
  assert.equal(mesh.material.metalness,0);assert.equal(app.available,true);
  const copy=cloneOrganMaterial(mesh.material), base=copy.color.clone(), cue=new THREE.Color('#e4aa26');
  const shader=shaderFor(copy);
  assert.match(shader.vertexShader,/vOrganRest=organRest/);
  tintOrganMaterial(copy,base,cue,.5);
  assert.equal(shader.uniforms.tissueCueAmount.value,.5);
  assert.ok(shader.uniforms.tissueCueColor.value.equals(cue));
  assert.ok(copy.color.equals(base.clone().lerp(cue,.5)));
  app.setMode('teaching');assert.equal(shader.uniforms.naturalMode.value,0);
  app.setMode('natural');assert.equal(shader.uniforms.naturalMode.value,1);
  assert.ok(shader.uniforms.teachingColor.value.equals(base));app.dispose();
});
test('authored textures, per-slot albedo, roughness, normals and alpha survive preparation',()=>{
  const map=new THREE.Texture(),normal=new THREE.Texture(),roughnessMap=new THREE.Texture();
  const attrs={map,normalMap:normal,roughnessMap,roughness:.34,metalness:.07,transparent:true,opacity:.47,side:THREE.DoubleSide};
  const source=new THREE.MeshStandardMaterial({...attrs,color:'#a44e45'}), second=new THREE.MeshStandardMaterial({color:'#87564d'});
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(),[source,second]);
  register('liver',mesh,[{pbrMetallicRoughness:{baseColorFactor:source.color.toArray(),roughnessFactor:.34}}, {pbrMetallicRoughness:{baseColorFactor:second.color.toArray()}}]);
  createOrganAppearance().prepare(mesh,asset,source.color);
  for(const [field,value] of Object.entries(attrs))assert.equal(mesh.material[0][field],value);
  assert.ok(mesh.material[1].color.equals(second.color));assert.notEqual(mesh.material[1],second);
  const shader=shaderFor(mesh.material[0]);
  assert.equal(shader.uniforms.tissueFinish.value.x,.34);
  assert.equal(shader.uniforms.tissueFinish.value.y,0);
  assert.ok(shader.uniforms.tissueColor.value.equals(source.color));
});
test('tissue classification is scoped to the donor asset and closest named glTF node',()=>{
  assert.equal(organTissueKind(asset,'hepatic_portal_vein'),'vein');
  assert.equal(organTissueKind('assets/ap3-models/pleura.glb','diaphragm'),undefined);
  assert.equal(organTissueKind('assets/ap2-glands/adrenal-section.glb','cortex'),undefined);
  assert.equal(organTissueKind('assets/ap2-neuro/brain.glb','region_Left_frontal_lobe'),'neural');
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshStandardMaterial());
  register('retina_left',mesh);mesh.parent.name='liver';
  const app=createOrganAppearance();app.prepare(mesh,asset,'#eeeeee');
  assert.equal(app.available,false);assert.equal(mesh.geometry.hasAttribute('organRest'),false);
});
