import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {allTerms} from '../src/data.js';
import {plates} from '../src/representations.js';

test('retired models have a real source illustration and cannot masquerade as precise 3D practice',()=>{
 for(const t of allTerms.filter(t=>t.representation.retiredModel)){
  const r=t.representation;assert.equal(r.kind,'reference',t.name);assert.equal(r.assessment,'learn-only');
  assert.ok(plates[r.plate],t.name);assert.ok(r.reviewNotice.length>60);assert.ok(r.reviewStatus);
 }
 for(const name of ['Stylomastoid foramen','Supraorbital foramen','Nasolacrimal canal']){
  const r=allTerms.find(t=>t.name===name).representation;assert.equal(r.assessment,'learn-only',name);assert.equal(r.reviewStatus,'replacement-required');assert.equal(r.kind,'reference');assert.equal(r.retiredModel,true);
 }
});

test('native sacral teaching copy has identical geometry to the unchanged source sacrum',()=>{
 const b=fs.readFileSync(new URL('../assets/landmark-details.glb',import.meta.url));
 const jsonLength=b.readUInt32LE(12),j=JSON.parse(b.subarray(20,20+jsonLength));const binaryStart=28+jsonLength;
 const mesh=name=>j.meshes[j.nodes.find(n=>n.extras?.zname===name).mesh].primitives[0];
 const source=mesh('Sacrum'),copy=mesh('Sacrum native neural passage');
 const bytes=index=>{const a=j.accessors[index],v=j.bufferViews[a.bufferView],start=binaryStart+v.byteOffset+(a.byteOffset||0);const width={5126:4,5125:4,5123:2}[a.componentType],components=a.type==='VEC3'?3:1;return b.subarray(start,start+a.count*width*components);};
 assert.deepEqual(bytes(source.attributes.POSITION),bytes(copy.attributes.POSITION),'A fabricated passage must not replace native lumen');
 assert.deepEqual(bytes(source.indices),bytes(copy.indices));
 for(const name of ['Foramen spinosum teaching passage.r','Carotid canal teaching passage.r','Stylomastoid foramen teaching passage.r','Supraorbital foramen teaching passage.r','Nasolacrimal canal reconstruction.r'])assert.ok(!j.nodes.some(n=>n.extras?.zname===name),'Wrong synthetic tube must not return: '+name);
 assert.ok(!j.nodes.some(n=>['newborn','ear-windows'].includes(n.extras?.detailGroup)));
 const r=allTerms.find(t=>t.name==='Carotid canal').representation;assert.equal(r.reviewStatus,'native-opening-verified');assert.equal(r.refinement,null);assert.equal(r.verification.route.segmentsUnblocked.length,5);assert.ok(r.verification.route.segmentsUnblocked.every(Boolean));
});

test('suture and hard-palate displays retain their defining contributors',()=>{
 const get=name=>allTerms.find(t=>t.name===name).representation.parentPattern;
 for(const bone of ['Frontal bone','Parietal bone.r','Parietal bone.l'])assert.ok(get('Coronal suture').includes(bone));
 for(const bone of ['Maxilla.r','Maxilla.l','Palatine bone.r','Palatine bone.l'])assert.ok(get('Hard palate').includes(bone));
 const arch=get('Alveolar arch');assert.ok(arch.includes('Maxilla.r')&&arch.includes('Maxilla.l'));
 assert.equal(allTerms.find(t=>t.name==='Carpal tunnel').representation.outline,null);
});
