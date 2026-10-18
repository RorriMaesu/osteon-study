import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import catalog from '../src/landmark-catalog.json' with {type:'json'};
import {allTerms,textbookTerms,markingVocabulary,terms,matches} from '../src/data.js';
import {plates,coverage} from '../src/representations.js';
import {plateTargets} from '../src/precision.js';
import {acceptsAnswer} from '../src/storage.js';
import {termDivision,inDivision} from '../src/anatomy.js';
import pages from '../src/reader-pages.json' with {type:'json'};

test('the audited textbook inventory resolves every canonical feature without changing the lab checklist',()=>{
 assert.equal(catalog.entries.length,330);assert.equal(textbookTerms.length,310);assert.equal(markingVocabulary.length,20);
 assert.equal(new Set(textbookTerms.map(t=>t.id)).size,310);assert.equal(terms.length,177);
 assert.deepEqual(coverage(),{mesh:82,'source-pin':47,diagram:46,concept:2});
 for(const c of catalog.entries.filter(c=>c.termId)){
  const t=allTerms.find(t=>t.id===c.termId);assert.ok(t,c.name);assert.equal(t.feature.id,c.id);
  assert.ok(t.feature.description.length>15,t.name);assert.ok(t.representation,t.name);
  assert.ok(c.sources.some(s=>pages.some(p=>p.pdf===s.pdf)),c.name+' source page');
 }
});
test('nested structures and grouped lab targets keep distinct textbook identities',()=>{
 const get=name=>textbookTerms.find(t=>t.feature.name===name);
 for(const [a,b]of [['Hypophyseal fossa','Sella turcica'],['Condylar process of mandible','Mandibular condyle'],['Vertebral foramen','Vertebral canal'],['Anterior sacral foramina','Posterior sacral foramina'],['Superior nasal concha','Middle nasal concha'],['Anterior fontanelle','Posterior fontanelle'],['Arcuate line of the ilium','Pelvic brim']])assert.notEqual(get(a).id,get(b).id,a);
 assert.match(get('Articular tubercle').pattern,/Temporal/);assert.equal(get('Adductor tubercle').region,'Lower limb');assert.equal(get('Fibular notch of tibia').pattern,'Tibia');
 assert.ok(acceptsAnswer(get('Intertubercular groove of humerus'),'bicipital groove'));
 assert.ok(acceptsAnswer(get('Acromion'),'acromial process'));
 for(const name of ['Hypoglossal canal','Fovea capitis','Pubic crest','Fossa for lacrimal sac']){const t=get(name);assert.ok(acceptsAnswer(t,t.name));assert.ok(!acceptsAnswer(t,t.pattern),name);}
});
test('new 3D anchors are validated source endpoints on the stated parent and side',()=>{
 const glb=fs.readFileSync(new URL('../assets/skeleton.glb',import.meta.url)),g=JSON.parse(glb.subarray(20,20+glb.readUInt32LE(12)));
 const bounds=g.nodes.map(n=>({name:n.extras.zname,...g.accessors[g.meshes[n.mesh].primitives[0].attributes.POSITION]}));
 const pins=textbookTerms.filter(t=>t.textbookOnly&&t.representation.kind==='source-pin');assert.equal(pins.length,52);
 for(const t of pins){const r=t.representation;assert.ok(r.verification.webSurfaceDistanceMm<=.75,t.name);for(const p of r.points){assert.equal(p.sourceVertex,1);assert.equal(p.side,'right');const parent=bounds.filter(b=>matches(t.pattern,b.name));assert.ok(parent.length,t.name);assert.ok(parent.some(b=>p.point.every((v,i)=>v>=b.min[i]-.002&&v<=b.max[i]+.002)),t.name);}}
});
test('every spatial diagram has its named target, while source guides cannot enter spatial scoring',()=>{
 for(const t of textbookTerms){const r=t.representation;if(r.kind==='diagram'){assert.ok(plates[r.plate],t.name);assert.ok(plates[r.plate].points.some(p=>p[0]===(r.target||t.name)),t.name);assert.notEqual(r.assessment,'learn-only');}if(r.kind==='reference'){assert.equal(r.assessment,'learn-only');assert.ok(plates[r.plate],t.name);assert.ok(r.note.length>30,t.name);}}
 assert.equal(textbookTerms.filter(t=>t.representation.kind==='reference').length,23);
 const micro=textbookTerms.find(t=>t.name==='Central canal');assert.equal(termDivision(micro),'General');assert.ok(!inDivision(micro,'Axial'));assert.ok(inDivision(micro,'All'));
});
test('diagram comparisons remain sparse, include the answer and avoid obscured or overlapping choices',()=>{
 for(const t of textbookTerms.filter(t=>t.representation.kind==='diagram')){
  const r=t.representation,p=plates[r.plate],target=r.target||t.name;
  for(const limit of [3,5]){const picks=plateTargets(p,target,limit);assert.ok(picks.length<=limit);assert.ok(picks.some(v=>v[0]===target),t.name);assert.equal(new Set(picks.map(p=>p[0])).size,picks.length);}
 }
 for(const [key,p]of Object.entries(plates).filter(([k])=>k.startsWith('lm'))){const [x,y,w,h]=p.crop;assert.ok(x+w<=p.size[0]&&y+h<=p.size[1],key);for(const [name,px,py]of p.points){assert.ok(px>=x&&px<=x+w&&py>=y&&py<=y+h,key+name);for(const [mx,my,mw,mh]of p.masks||[])assert.ok(!(px>=mx&&px<=mx+mw&&py>=my&&py<=my+mh),key+name+' hidden by mask');}}
});
