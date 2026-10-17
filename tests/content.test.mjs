import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {terms,allTerms,matches} from '../src/data.js';
import {lessons,glossary,questions} from '../src/learning-data.js';

const glb=fs.readFileSync(new URL('../assets/skeleton.glb',import.meta.url));
const gltf=JSON.parse(glb.subarray(20,20+glb.readUInt32LE(12)).toString());
const names=gltf.nodes.map(n=>n.extras.zname);
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
 assert.equal(questions.length,56);assert.equal(new Set(questions.map(q=>q.id)).size,questions.length);
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
