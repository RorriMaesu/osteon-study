import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {allTerms} from '../src/data.js';
import '../src/representations.js';
import {termForMesh,refinementForMesh,wholeStructureLabel} from '../src/mesh-term.js';
const b=fs.readFileSync(new URL('../assets/landmark-details.glb',import.meta.url));
const nodes=JSON.parse(b.subarray(20,20+b.readUInt32LE(12))).nodes;

test('catalog-linked whole structures retain atlas labels but never reveal a name during identification',()=>{
 const items=allTerms.filter(t=>t.representation.kind==='mesh'&&t.feature);assert.ok(items.some(t=>t.id==='xiphoid-process'));
 for(const t of items){assert.equal(wholeStructureLabel(t,true),null,t.id);assert.equal(wholeStructureLabel(t,false),t.name,t.id);}
});

test('clicking an edited parent bone retains bone identity rather than selecting one opening',()=>{
 for(const [zname,name]of [['Frontal bone','Frontal bone'],['Temporal bone.r','Temporal bones'],['Maxilla.r','Maxillae'],['Lacrimal bone.r','Lacrimal bones'],['Inferior nasal concha bone.r','Inferior nasal conchae']]){
  const node=nodes.find(n=>n.extras?.zname===zname);assert.ok(node,zname);assert.equal(node.extras.replacementAnatomy,true);
  const mesh={userData:{...node.extras,region:'Skull'}};assert.equal(termForMesh(mesh).name,name);assert.equal(refinementForMesh(mesh),undefined);
 }
});

test('edited openings remain separately selectable with their own rim targets',()=>{
 for(const name of ['Supraorbital foramen','Stylomastoid foramen','Nasolacrimal canal']){
  const t=allTerms.find(t=>t.name===name);assert.ok(t);assert.equal(t.representation.kind,'3d-landmark');assert.ok(t.representation.points.length);assert.equal(t.representation.reviewStatus,'modeled-opening-verified');
 }
});
