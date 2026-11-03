import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {allTerms} from '../src/data.js';
import '../src/representations.js';
import specimen from '../src/fetal-skull-specimen.json' with {type:'json'};

test('the licensed scan has six qualified developmental references without promoting them to exact spatial targets',()=>{
 assert.equal(specimen.sites.length,6);assert.equal(new Set(specimen.sites.map(s=>s.id)).size,6);
 for(const s of specimen.sites){assert.equal(s.spatialScoring,false);assert.ok(s.uncertaintyPixels>=10);assert.ok(s.point.length===3&&s.point.every(Number.isFinite));const term=allTerms.find(t=>t.id===s.termId);assert.ok(term,s.termId);assert.equal(term.representation.assessment,'learn-only');assert.equal(term.representation.localSpecimen,'fetal-skull');}
 const byId=id=>specimen.sites.find(s=>s.id===id);assert.ok(byId('anterior').point[2]>byId('posterior').point[2]);for(const id of ['sphenoidal','mastoid']){assert.ok(byId(id+'-r').point[0]<0);assert.ok(byId(id+'-l').point[0]>0);}assert.match(specimen.notice,/do not assert six open fontanelles/);assert.match(specimen.geometryChanges,/no holes/);
});
test('the native scan and editable site nodes are present, credited and separate from adult anatomy',()=>{
 const bytes=fs.readFileSync(new URL('../assets/fetal-skull.glb',import.meta.url));assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),specimen.assetSHA256);assert.equal(specimen.sourceSHA256,'c3cc0df1c33e65ce4dc407b98b3c9575ae1d20f7cd1fb45fdb4c2b76270ab3cc');assert.equal(specimen.license,'CC BY-NC 4.0');assert.match(specimen.source,/7646e0227f07475eb8275d084993194c/);assert.match(specimen.creator,/Rodriguez Rubio/);assert.match(specimen.backup,/^fetal-skull-/);
 const gltf=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString()),meshNodes=gltf.nodes.filter(n=>n.mesh!==undefined);assert.equal(meshNodes.length,2);assert.ok(meshNodes.every(n=>n.extras?.detailGroup==='fetal-skull'));assert.equal(gltf.nodes.filter(n=>n.extras?.siteId).length,6);const faces=gltf.meshes.flatMap(m=>m.primitives).reduce((n,p)=>n+gltf.accessors[p.indices].count/3,0);assert.equal(faces,150022);assert.equal(specimen.meshFaces,faces);
});
