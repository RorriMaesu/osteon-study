import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {MotionViewer} from '../src/motion-viewer.js';

test('the 3D viewer shows distinct contributor, opposing and mixed colors in the related-only view',()=>{
 const surfaces=['flexor','extensor','mixed','context'].map(id=>({
  id,key:id,side:'right',mesh:{visible:false},material:new THREE.MeshStandardMaterial(),
 }));
 const viewer=Object.assign(Object.create(MotionViewer.prototype),{current:{parts:surfaces}});
 const [flexor,extensor,mixed,context]=surfaces;
 const roles={strengths:{'right:flexor':1},mixedRoles:new Set(['right:mixed']),showMuscles:true,onlyActive:true,cue:'role'};
 viewer.highlight({...roles,antagonists:new Set(['right:extensor'])});
 assert.equal(flexor.material.color.getHexString(),'9cdec0');
 assert.deepEqual(extensor.material.color.toArray(),new THREE.Color('#604f4e').lerp(new THREE.Color('#a9b6e6'),.78).toArray());
 assert.equal(mixed.material.color.getHexString(),'f3c479');
 assert(surfaces.slice(0,3).every(part=>part.mesh.visible));
 assert.equal(context.mesh.visible,false);
 viewer.highlight({...roles,antagonists:new Set()});
 assert.equal(extensor.mesh.visible,false);
 assert.equal(extensor.material.color.getHexString(),'604f4e');
});
