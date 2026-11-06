import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mockExam3Questions,mockExam3Rotations,mockExam3CoverageQuestions as questions,
 mockExam3CoverageForm as form,mockExam3AllQuestions,mockExam3Lookup,mockExam3Coverage} from '../src/mock-exam3-bank.js';
import {createMockSession,setMockResponse,submitMockSession,mockResults,validMockSession} from '../src/mock-exam3-core.js';
import {blankMockState,writeMockState,readMockState,mockBackup,parseMockBackup} from '../src/mock-exam3-store.js';

test('the extension preserves all 61 released question snapshots exactly',()=>{
 const legacy=[...mockExam3Questions,...mockExam3Rotations];
 // The exact released records are the compatibility contract for existing
 // saved submissions. New question IDs belong outside this immutable set.
 assert.equal(legacy.length,61);
 assert.equal(createHash('sha256').update(JSON.stringify(legacy)).digest('hex'),
  '62b7ef317ac3bfea3618d529cd2202f52111d99792805de1280f565ac3e29f0a');
 const ids=new Set(legacy.map(q=>q.id));
 for(const q of questions)assert.equal(ids.has(q.id),false,q.id);
});

test('wider coverage is a separate twelve-point sample with three questions per chapter',()=>{
 assert.equal(questions.length,12);
 assert.equal(form.maxPoints,12);
 assert.deepEqual(form.ids,questions.map(q=>q.id));
 assert.deepEqual(form.questionIds,form.ids);
 assert.deepEqual([6,7,8,9].map(ch=>questions.filter(q=>q.chapter===ch).length),[3,3,3,3]);
 assert.equal(new Set(questions.map(q=>q.coverageGap)).size,9);
 assert.ok(questions.every(q=>mockExam3Coverage.remainingCoverage.includes(q.coverageGap)));
 assert.match(form.formatNotice,/not a second predicted exam or complete chapter coverage/);
 assert.equal(form.requiresDiagrams,false);
 for(const q of questions){
  assert.equal(q.type,'choice');assert.equal(q.points,1);assert.equal(q.practiceOnly,true);
  assert.equal(q.distractors.length,3);assert.equal(new Set([q.answer,...q.distractors]).size,4,q.id);
  assert.ok(Object.isFrozen(q)&&Object.isFrozen(q.distractors));
  assert.equal(mockExam3Lookup.get(q.id),q);assert.ok(mockExam3AllQuestions.includes(q));
  assert.deepEqual(q.reviewTopicIds,[],'new textbook sampling must not claim a Quiz Show repeat');
  assert.ok(q.evidence.every(e=>e.kind==='textbook-extension'));
 }
});

test('nearby anatomical alternatives remain distinguishable in wider practice',()=>{
 const byId=Object.fromEntries(questions.map(q=>[q.id.replace('exam3-wider-',''),q]));
 assert.equal(byId['growth-zones'].answer,'Proliferative zone');
 assert.ok(byId['growth-zones'].distractors.includes('Zone of maturation and hypertrophy'));
 assert.match(byId['appositional-surfaces'].answer,/Osteoblast deposition outside; osteoclast resorption inside/);
 assert.match(byId['disc-structure'].answer,/Nucleus pulposus through the anulus fibrosus/);
 assert.match(byId['elbow-process-fossa'].answer,/Ulna olecranon process into humeral olecranon fossa/);
 assert.equal(byId['ankle-weight-path'].answer,'Talus');
 assert.match(byId['limb-rotation'].answer,/Upper limb laterally; lower limb medially/);
 assert.equal(byId['wrist-joint-type'].answer,'Condyloid');
 assert.match(byId['joint-interzone'].prompt,/supplied textbook model/);
});

test('wider practice saves, restores and grades through the real mock lifecycle without AI',()=>{
 let session=createMockSession(questions,{form,mode:'practice',now:1000,rng:()=>.3});
 for(const q of questions)session=setMockResponse(session,q.id,q.answer);
 const state=blankMockState();state.active=session;
 const data=new Map(),storage={getItem:k=>data.has(k)?data.get(k):null,setItem:(k,v)=>data.set(k,v)};
 writeMockState(storage,state);
 const restored=readMockState(storage);
 assert.equal(validMockSession(restored.active),true);
 session=submitMockSession(restored.active,{now:2000});
 let result=mockResults(session);
 assert.equal(result.earnedPoints,12);assert.equal(result.pendingPoints,0);
 assert.equal(result.total,12);assert.deepEqual(Object.keys(session.reviews),[]);
 state.active=null;state.history=[session];
 assert.deepEqual(parseMockBackup(mockBackup(state,3000)),state);
 let wrong=createMockSession(questions,{form,mode:'practice',now:1000,rng:()=>.4});
 for(const q of questions)wrong=setMockResponse(wrong,q.id,q.distractors[0]);
 result=mockResults(submitMockSession(wrong,{now:2000}));
 assert.equal(result.earnedPoints,0);assert.equal(result.missedPoints,12);assert.equal(result.pendingPoints,0);
});
