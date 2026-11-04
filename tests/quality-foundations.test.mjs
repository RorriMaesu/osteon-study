import test from 'node:test';
import assert from 'node:assert/strict';
import {meshRegion,meshDivision,tissueAreas} from '../src/anatomy.js';
import {allTerms} from '../src/data.js';
import '../src/representations.js';
import {assessAnatomyAnswer} from '../src/anatomy-answer.js';
import {blankProgress,STORAGE_KEY} from '../src/storage.js';
import {createSession} from '../src/exam-core.js';
import {examBank} from '../src/exam-bank.js';
import {createStudyBackup,validateStudyBackup,restoreStudyBackup} from '../src/study-backup.js';
import {makeLabRun,listQuestions,LAB_TEST_KEY} from '../src/lab-list.js';
import {comparisonLimit,drawingRect} from '../src/annotation-layout.js';
const memory=()=>{const map=new Map();return {getItem:k=>map.has(k)?map.get(k):null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)};};

test('distant support tissues cannot silently become skull anatomy',()=>{
 for(const name of ['Sacrotuberous ligament.r','Sacrotuberous ligament.l','Sacrospinous ligament.r','Sacrospinous ligament.l']){assert.equal(meshRegion(name),'Pelvis');assert.deepEqual(tissueAreas(name),['pelvis']);assert.equal(meshDivision(name),'Appendicular');}
 assert.equal(meshRegion('Plantar tendon sheath of fibularis longus muscle.r'),'Lower limb');assert.equal(meshRegion('Unclassified support tissue'),'Other anatomy');assert.equal(meshRegion('Nasal septal cartilage'),'Skull');
});
test('shared specimen grading accepts clear typos but protects different anatomy and explicit sides',()=>{
 const femur=allTerms.find(t=>t.name==='Femora');assert.equal(assessAnatomyAnswer(femur,'femurr').status,'spelling');assert.equal(assessAnatomyAnswer(femur,'thigh bone').status,'equivalent');assert.equal(assessAnatomyAnswer(femur,'left femur',{side:'right'}).status,'incorrect');assert.equal(assessAnatomyAnswer(femur,'right femur',{side:'right'}).status,'equivalent');assert.equal(assessAnatomyAnswer(allTerms.find(t=>t.name==='Ilium'),'ileum').status,'incorrect');
});
test('attachment projections are not mislabeled as articular surfaces',()=>{
 for(const name of ['Medial epicondyle of humerus','Lateral epicondyle of femur','Supraglenoid tubercle','Infraglenoid tubercle']){const term=allTerms.find(t=>t.name===name||t.feature?.name===name||t.feature?.name===name.replace(' of ',' of the '));assert.ok(term,name);assert.equal(term.feature.featureType,'Projection or bone region',name);}
 assert.equal(allTerms.find(t=>t.name==='Glenoid cavity').feature.featureType,'Articular feature');
});
test('complete backups round-trip active exam, lab test and progress with optional chat excluded',()=>{
 const a=memory(),b=memory(),exam={active:createSession(examBank.slice(0,3)),history:[],archives:[]},lab={current:makeLabRun('all',[listQuestions()[0].id]),history:[]};a.setItem(STORAGE_KEY,JSON.stringify(blankProgress()));a.setItem('osteon-exams-v1',JSON.stringify(exam));a.setItem(LAB_TEST_KEY,JSON.stringify(lab));a.setItem('osteon-tutor-chat-v1','[{"role":"user","content":"private draft"}]');const backup=createStudyBackup(a);assert.equal(backup.chat,undefined);assert.equal(validateStudyBackup(backup).hasExamDraft,true);restoreStudyBackup(b,backup);assert.deepEqual(JSON.parse(b.getItem('osteon-exams-v1')),exam);assert.deepEqual(JSON.parse(b.getItem(LAB_TEST_KEY)),lab);assert.equal(b.getItem('osteon-tutor-chat-v1'),null);
});
test('restore validates everything before writes, preserves unrelated keys, and rolls back a failed write',()=>{
 const store=memory();store.setItem(STORAGE_KEY,JSON.stringify(blankProgress()));store.setItem('unrelated','keep');const backup=createStudyBackup(store);assert.throws(()=>restoreStudyBackup(store,{...backup,exams:{active:{invalid:true},history:[]}}));assert.equal(store.getItem('unrelated'),'keep');const original=store.setItem;let failed=false;store.setItem=(k,v)=>{if(k==='osteon-exams-v1'&&!failed){failed=true;throw Error('full');}original(k,v);};backup.exams={active:null,history:[],archives:[]};assert.throws(()=>restoreStudyBackup(store,backup));assert.equal(store.getItem('osteon-exams-v1'),null);assert.deepEqual(JSON.parse(store.getItem(STORAGE_KEY)),blankProgress());
});
test('progress-only imports do not erase separately stored exams and unknown connections are rejected',()=>{
 const store=memory();store.setItem('osteon-exams-v1','preserve');restoreStudyBackup(store,blankProgress());assert.equal(store.getItem('osteon-exams-v1'),'preserve');const backup={kind:'osteon-full-backup',schema:1,createdAt:1,progress:blankProgress(),exams:null,labTest:null,settings:{'osteon-local-ai-v2':JSON.stringify({endpoint:'https://example.com'})}};assert.throws(()=>validateStudyBackup(backup));
});
test('annotation drawing space reserves the phone card or desktop rail and comparison stays bounded',()=>{
 const phone=drawingRect(390,500,{top:80,bottom:120});assert.ok(phone.y>=80);assert.ok(phone.y+phone.height<=380);const desktop=drawingRect(900,500,{top:70,rail:230});assert.ok(desktop.x+desktop.width<=670);assert.equal(comparisonLimit(390,500),2);assert.equal(comparisonLimit(900,500),3);assert.equal(comparisonLimit(390,300),1);
});
