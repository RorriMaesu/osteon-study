import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {bodyMaps} from '../src/organ-atlas-bodies.js';
import {createBodyDissection} from '../src/organ-body-dissection.js';
import {createBoneContext} from '../src/organ-bone-context.js';
import {TOOTH_COLOR} from '../src/dental-appearance.js';

const body=bodyMaps.find(map=>map.key==='body');
test('whole organs are removed in peel order and can be restored individually',()=>{
  const state=createBodyDissection(body);
  assert.deepEqual(state.hiddenIds,[]);
  assert.equal(state.hide('no such organ'),null);
  assert.equal(state.hide('liver'),'liver');assert.equal(state.hide('liver'),null);
  assert.equal(state.hide('eyes'),'eyes');assert.equal(state.hide('lungs'),'lungs');
  assert.ok(state.show('eyes'));
  assert.deepEqual(state.hiddenIds,['liver','lungs']);
  assert.equal(state.undo(),'lungs');assert.ok(state.isHidden('liver'));
  assert.equal(state.restore(),1);assert.equal(state.undo(),null);
});

test('restoring a peeled skin restores its visible envelope; separate preparations stay independent',()=>{
  const state=createBodyDissection(body);
  assert.equal(state.skinVisible,false);assert.equal(state.hide('skin'),null);
  assert.equal(state.setSkin(true),true);assert.equal(state.hide('skin'),'skin');
  assert.equal(state.skinVisible,false);assert.equal(state.undo(),'skin');assert.ok(state.skinVisible);
  state.setSkin(false);state.hide('liver');assert.deepEqual(state.hiddenIds,['skin','liver']);
  state.setSkin(true);assert.deepEqual(state.hiddenIds,['liver']);
  state.setSkin(false);assert.equal(state.restore(),2);assert.ok(state.skinVisible);
  assert.equal(state.skeletonMode,'off');assert.ok(state.setSkeleton('solid'));
  assert.ok(!state.setSkeleton('bad'));assert.equal(state.skeletonMode,'solid');
  assert.equal(createBodyDissection(body).skeletonMode,'off');
  assert.equal(createBodyDissection(bodyMaps.find(m=>m.key==='peripheral')).skeletonMode,'xray');
});

test('peeling one lobe then its whole organ preserves independent visibility and mixed undo order',()=>{
  const [lobe,other]=body.organs.find(o=>o.id==='lungs').targets;
  const state=createBodyDissection(body);
  assert.equal(state.hidePart('lungs',lobe),lobe);assert.ok(!state.isPartHidden('lungs',other));
  state.hide('lungs');state.hide('eyes');assert.ok(state.isPartHidden('lungs',other));
  assert.deepEqual(state.hiddenEntries,[{id:'lungs',raw:lobe},{id:'lungs'},{id:'eyes'}]);
  assert.equal(state.undo(),'eyes');assert.equal(state.undo(),'lungs');
  assert.ok(state.isPartHidden('lungs',lobe));assert.ok(!state.isPartHidden('lungs',other));
  assert.equal(state.hidePart('eyes',lobe),null);
  state.hide('lungs');assert.ok(state.showPart('lungs',lobe));
  assert.ok(state.isPartHidden('lungs',lobe));
  state.undo();assert.ok(!state.isPartHidden('lungs',lobe));
  assert.deepEqual(state.hiddenEntries,[]);
});

test('the skeleton X-ray draws the nearest bone surface once and preserves source registration',()=>{
  const root=new THREE.Group();root.position.set(.3,-.5,1.1);
  const source=new THREE.Mesh(new THREE.BoxGeometry(.3,.4,.5));
  source.position.set(.2,.6,-.1);source.rotation.y=.3;
  const other=source.clone();other.position.x=-.4;
  root.add(source,other);root.updateMatrixWorld(true);
  const before=new THREE.Box3().setFromObject(root);
  const ctx=createBoneContext(root,[source,other]),surface=ctx.surface;
  assert.equal(source.visible,false);assert.equal(other.visible,false);
  const batch=new THREE.Box3().setFromObject(surface);
  assert.ok(batch.min.distanceTo(before.min)<1e-6&&batch.max.distanceTo(before.max)<1e-6);
  const depth=root.children.find(mesh=>mesh.material?.colorWrite===false);
  ctx.setMode('xray');
  assert.ok(depth.visible&&surface.visible&&depth.material.depthWrite);
  assert.ok(depth.renderOrder<surface.renderOrder);assert.equal(surface.material.depthFunc,THREE.EqualDepth);
  assert.equal(surface.material.depthWrite,false);
  ctx.setMode('solid');assert.ok(!depth.visible&&surface.visible);
  assert.equal(surface.material.transparent,false);assert.equal(surface.material.depthWrite,true);
  ctx.setMode('off');assert.ok(!surface.visible&&!depth.visible);
  ctx.dispose();assert.deepEqual(root.children,[source,other]);
  source.geometry.dispose();source.material.dispose();
});

test('the body skeleton omits duplicate teeth and the regional skeleton retains enamel in solid view',()=>{
  const root=new THREE.Group(),jaw=new THREE.Mesh(new THREE.BoxGeometry(.2,.2,.2));
  const tooth=jaw.clone();tooth.name='Upper medial incisor.r.001';tooth.userData.zmat='Teeth';tooth.position.x=1;
  root.add(jaw,tooth);
  const ray=new THREE.Raycaster(new THREE.Vector3(1,0,2),new THREE.Vector3(0,0,-1));
  const body=createBoneContext(root,[jaw,tooth],{omitTeeth:true});
  for(const mode of ['solid','xray']){
    body.setMode(mode);root.updateMatrixWorld(true);
    assert.equal(tooth.visible,false);
    assert.equal(ray.intersectObject(body.surface).length,0,'hidden registered teeth stay clear of bone drawing and picking');
  }
  body.dispose();
  const regional=createBoneContext(root,[jaw,tooth]);regional.setMode('solid');
  const surface=regional.surface,color=surface.geometry.getAttribute('color');
  const dentalStart=jaw.geometry.attributes.position.count;
  assert.equal(surface.material.vertexColors,true);
  assert.ok(ray.intersectObject(surface).length>0);
  const almost=(actual,expected)=>assert.ok(Math.abs(actual-expected)<=1/255);
  const ivory=new THREE.Color(TOOTH_COLOR),bone=new THREE.Color('#d9c4a6');
  for(const [start,expected] of [[0,bone],[dentalStart,ivory]]){
    almost(color.getX(start),expected.r);almost(color.getY(start),expected.g);almost(color.getZ(start),expected.b);
  }
  regional.setMode('xray');assert.equal(surface.material.vertexColors,false);
  regional.dispose();jaw.geometry.dispose();jaw.material.dispose();
});
