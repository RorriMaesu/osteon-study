import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {terms,allTerms,matches} from '../src/data.js';
import {plates,coverage} from '../src/representations.js';
import {sectionPages} from '../src/reader.js';
import pages from '../src/reader-pages.json' with {type:'json'};
import {lessons,glossary,questions} from '../src/learning-data.js';

const glb=fs.readFileSync(new URL('../assets/skeleton.glb',import.meta.url));
const gltf=JSON.parse(glb.subarray(20,20+glb.readUInt32LE(12)).toString());
const tissues=fs.readFileSync(new URL('../assets/course-tissues.glb',import.meta.url));
const tissueGLTF=JSON.parse(tissues.subarray(20,20+tissues.readUInt32LE(12)).toString());
const names=[...gltf.nodes,...tissueGLTF.nodes].filter(n=>n.mesh!==undefined).map(n=>n.extras.zname);
const store=new Map();globalThis.localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)};
globalThis.document=new EventTarget();
const {recordAttempt,objectiveStats,scheduleCard,validProgress,blankProgress,acceptsAnswer,importProgress,getProgress,resetProgress}=await import('../src/storage.js');

test('every declared exact target has real geometry and unique IDs',()=>{
 assert.equal(terms.length,177);assert.equal(new Set(allTerms.map(t=>t.id)).size,allTerms.length);
 for(const t of allTerms.filter(t=>t.exact))assert.ok(names.some(n=>matches(t.pattern,n)),`No mesh for ${t.name}`);
 assert.equal(gltf.nodes.length,271);
 assert.equal(terms.find(t=>t.name==='Ethmoidal air cells and sinus openings').exact,false);
 assert.equal(terms.find(t=>t.name==='Ilium').exact,false);
 assert.equal(terms.find(t=>t.name==='Fontanelles').pattern,'');
});
test('rib categories respect biological overlap and exclude cartilage',()=>{
 assert.ok(matches('true ribs','Seventh rib.l'));assert.ok(!matches('true ribs','Eighth rib.r'));
 assert.ok(matches('false ribs','Twelfth rib.r'));assert.ok(matches('floating ribs','Twelfth rib.l'));
 assert.ok(!matches('floating ribs','Tenth rib.r'));assert.ok(!matches(' rib','Costal cartilage of first rib.r'));
});
test('numbered and regional meshes do not accept neighboring bones',()=>{
 assert.ok(matches('First metacarpal bone','First metacarpal bone.l'));
 assert.ok(!matches('First metacarpal bone','First metatarsal bone.l'));
 assert.ok(matches('Vertebra C','Atlas (C1)'));assert.ok(matches('Vertebra C','Axis (C2)'));
 assert.ok(!matches('Vertebra C','Vertebra T1'));
 assert.ok(matches('Middle phalanx of.*hand','Middle phalanx of second finger of hand.r'));
 assert.ok(!matches('Middle phalanx of.*hand','Middle phalanx of second finger of foot.r'));
});
test('all twelve sections teach, apply and assess distinct concepts',()=>{
 assert.deepEqual(lessons.map(l=>l.id),['6.1','6.2','6.3','6.4','6.5','6.6','6.7','7.1','7.2','7.3','7.4','7.5']);
 for(const l of lessons){assert.ok(l.objective.length>35);assert.ok(l.sections.length>=3);assert.ok(l.compare.length>=2);assert.equal(l.recall.length,2);assert.equal(l.application.length,2);assert.ok(l.questions.length>=4);}
 assert.equal(questions.length,104);assert.equal(new Set(questions.map(q=>q.id)).size,questions.length);
 for(const q of questions){assert.equal(q.distractors.length,3);assert.equal(new Set([q.answer,...q.distractors]).size,4);assert.ok(q.explanation.length>25);}
});
test('complete glossary extraction excludes page furniture and broken glyphs',()=>{
 assert.equal(glossary.length,237);assert.equal(new Set(glossary.map(g=>g.id)).size,237);
 for(const g of glossary){assert.ok(g.name.length>2);assert.ok(g.cue.length>3);assert.ok(!/PDF PAGE|Access for free|Key Terms|\uFFFD/.test(g.cue+g.name),g.name);}
});
test('name recall accepts canonical synonyms without accepting other bones',()=>{
 assert.ok(acceptsAnswer(terms.find(t=>t.name==='Femora'),'Femur'));
 assert.ok(acceptsAnswer(terms.find(t=>t.name==='Atlas C1'),'atlas'));
 assert.ok(acceptsAnswer(terms.find(t=>t.name==='Annulus fibrosus'),'annulus fibrosis'));
 assert.ok(!acceptsAnswer(terms.find(t=>t.name==='Femora'),'humerus'));
 assert.ok(!acceptsAnswer(terms.find(t=>t.name==='Femora'),''));
});
test('assistance and self-ratings never inflate independent accuracy',()=>{
 resetProgress();recordAttempt({id:'a',topic:'Spine',correct:true,mode:'identify'});
 recordAttempt({id:'b',topic:'Spine',correct:false,mode:'identify'});
 recordAttempt({id:'c',topic:'Spine',correct:true,assisted:true,mode:'identify'});
 recordAttempt({id:'d',topic:'Spine',correct:true,mode:'flashcard',selfRated:true});
 assert.deepEqual(objectiveStats(),{total:3,unassisted:2,correct:1,accuracy:50,assisted:1});
 assert.ok(getProgress().cards.b.due<=Date.now());assert.ok(getProgress().cards.c.due<=Date.now());
});
test('review intervals, backups and malformed imports behave deliberately',()=>{
 resetProgress();const at=1000000;assert.equal(scheduleCard('a',1,at),10/1440);assert.equal(getProgress().cards.a.due,at+600000);
 assert.equal(scheduleCard('a',3,at),1);assert.equal(scheduleCard('a',3,at),3);
 const backup=JSON.parse(JSON.stringify(getProgress()));assert.ok(validProgress(backup));importProgress(backup);
 assert.ok(!validProgress({...blankProgress(),attempts:[{id:'broken'}]}));
 assert.ok(!validProgress({...blankProgress(),cards:{bad:{due:'tomorrow',interval:1}}}));
 assert.throws(()=>importProgress({schema:99}));assert.equal(getProgress().cards.a.interval,3);
});

test('all course concepts have appropriate graded representations',()=>{
 assert.deepEqual(coverage(),{mesh:82,'source-pin':47,diagram:46,concept:2});
 for(const t of terms){const r=t.representation;assert.ok(r.reference,t.name);assert.ok(['mesh','source-pin','diagram','concept'].includes(r.kind));if(r.kind==='diagram')assert.ok(plates[r.plate].points.some(p=>p[0]===t.name),t.name);}
 assert.deepEqual(terms.filter(t=>t.representation.kind==='concept').map(t=>t.name),['Anterior drawer','Posterior drawer']);
 assert.equal(terms.find(t=>t.name==='Fontanelles').representation.kind,'diagram');
});
test('landmark targets use anatomical leader endpoints within the parent model bounds',()=>{
 const bounds=gltf.nodes.map(n=>{const a=gltf.accessors[gltf.meshes[n.mesh].primitives[0].attributes.POSITION];return {name:n.extras.zname,min:a.min,max:a.max};});
 for(const t of terms.filter(t=>t.representation.kind==='source-pin'))for(const p of t.representation.points){assert.equal(p.sourceVertex,1,t.name);assert.ok(p.distanceToWebVertexMm<12,t.name);assert.ok(p.object.endsWith('.j'));assert.ok(p.point.every(Number.isFinite));const parent=bounds.filter(b=>matches(t.pattern,b.name));assert.ok(parent.length,t.name);assert.ok(parent.some(b=>p.point.every((v,i)=>v>=b.min[i]-.015&&v<=b.max[i]+.015)),t.name);}
});
test('diagram targets remain inside the correct licensed source illustration crop',()=>{
 for(const [key,p]of Object.entries(plates)){assert.ok(fs.existsSync(new URL('../assets/figures/'+(p.image||key)+'.jpg',import.meta.url)));const [x,y,w,h]=p.crop;assert.ok(x>=0&&y>=0&&x+w<=p.size[0]&&y+h<=p.size[1],key);for(const [name,px,py]of p.points){assert.ok(px>=x&&px<=x+w&&py>=y&&py<=y+h,key+': '+name);}}
});
test('full chapter reading includes every source page and valid section destinations',()=>{
 assert.equal(pages.length,144);assert.equal(new Set(pages.map(p=>p.pdf)).size,pages.length);
 for(let n=213;n<=298;n++)assert.ok(pages.some(p=>p.pdf===n),'Missing chapter page '+n);
 for(const p of pages){assert.equal(p.printed,p.pdf-16);assert.ok(p.text.length>50);assert.ok(!p.text.includes('\ufffd'));assert.ok(fs.existsSync(new URL('../assets/reader/p'+p.pdf+'.jpg',import.meta.url)));}
 for(const [section,pdf]of Object.entries(sectionPages))assert.ok(pages.find(p=>p.pdf===pdf).text.includes(section),section);
});
test('typed landmark recall rejects parent bones and accepts the precise term',()=>{
 for(const name of ['Coracoid process','Head of femur','Cribriform plate','Dens','Iliac crest']){const t=terms.find(t=>t.name===name);assert.ok(acceptsAnswer(t,name));assert.ok(!acceptsAnswer(t,t.pattern),name);}
 assert.ok(matches(terms.find(t=>t.name==='Pollex').pattern,'Distal phalanx of first finger of hand.r'));
 assert.ok(!matches(terms.find(t=>t.name==='Pollex').pattern,'Proximal phalanx of second finger of hand.r'));
 assert.ok(!matches(terms.find(t=>t.name==='Anterior cruciate ligament').pattern,'Posterior cruciate ligament.l'));
});
