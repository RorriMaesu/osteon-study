import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mockExam4Forms as legacyForms,mockExam4Questions as legacyQuestions,mockExam4Calibration as legacyCalibration} from '../src/mock-exam4-legacy.js';
import {mockExam4Forms,mockExam4Questions,mockExam4AllQuestions,mockExam4AllCalibration,mockExam4Related} from '../src/mock-exam4-bank.js';
import {mockExam4Storage,validMockExam4State} from '../src/mock-exam4-store.js';
import {createMockSession,setMockResponse,submitMockSession,applyMockReview,mockResults,validMockSession} from '../src/mock-exam3-core.js';
import {createLearnerWrittenReview} from '../src/written-answer-judge.js';
import {createStudyBackup,restoreStudyBackup} from '../src/study-backup.js';

const memory=()=>{
 const values=new Map();
 return {getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)};
};

function savedLegacyWork(){
 const state=mockExam4Storage.blank(),form=legacyForms.A;
 const written=form.questions.find(q=>q.id==='exam4-a-43');
 let session=createMockSession(form.questions,{form,now:100,rng:()=>.1});
 session=setMockResponse(session,written.id,written.answer);
 session=submitMockSession(session,{now:200,bank:legacyQuestions});
 const review=createLearnerWrittenReview({
  question:written,response:written.answer,submissionId:session.submission.id,
  decisions:Object.fromEntries(written.rubric.criteria.map(criterion=>[criterion.id,'met'])),now:210
 });
 state.history=[applyMockReview(session,written.id,review,{now:210})];
 state.active=createMockSession(legacyForms.B.questions,{form:legacyForms.B,now:300,rng:()=>.2});
 const question=legacyForms.B.questions[0];
 state.active=setMockResponse(state.active,question.id,question.answer);
 state.notes[session.id+':'+written.id]={confusion:'ATP binding',rule:'ATP permits detachment',retrieval:'Explain rigor',updatedAt:220};
 state.card.front[0]='ATP binds to release myosin.';
 return state;
}

test('published Exam 4 question definitions remain exact for saved work',()=>{
 assert.equal(createHash('sha256').update(JSON.stringify(legacyQuestions)).digest('hex'),'29ed0f2449757ffa327778b7174af46c535a1724a967dd44136ce0517fa241b9');
 assert.ok(mockExam4Questions.every(q=>!legacyQuestions.some(old=>old.id===q.id)));
 assert.equal(new Set(mockExam4AllQuestions.map(q=>q.id)).size,mockExam4AllQuestions.length);
 for(const old of legacyQuestions)assert.deepEqual(mockExam4AllQuestions.find(q=>q.id===old.id),old);
 for(const fixture of legacyCalibration)assert.deepEqual(mockExam4AllCalibration.find(item=>item.id===fixture.id),fixture);
});

test('legacy draft, graded report, notes and study card survive both backup entry points',()=>{
 const state=savedLegacyWork(),source=memory(),target=memory();
 // This is the previously published record format stored directly by the old release.
 source.setItem(mockExam4Storage.key,JSON.stringify(state));
 const restored=mockExam4Storage.read(source);
 assert.deepEqual(restored,state);
 assert.equal(mockResults(restored.history[0]).earnedPoints,3);
 assert.equal(restored.history[0].reviews['exam4-a-43'].source,'learner');
 assert.deepEqual(mockExam4Storage.restore(mockExam4Storage.backup(restored)),state);
 const backup=createStudyBackup(source,{now:400});
 assert.equal(restoreStudyBackup(target,backup).exam4Reports,1);
 assert.deepEqual(mockExam4Storage.read(target),state);
 const resumed=submitMockSession(restored.active,{now:500,bank:mockExam4AllQuestions});
 assert.equal(mockResults(resumed).earnedPoints,1);
 assert.equal(resumed.formVersion,'2026-11-12.1');
 assert.equal(resumed.questions[0].id,'exam4-b-1');
});

test('current attempts coexist with old reports and old mistakes lead to current practice',()=>{
 const state=savedLegacyWork();
 const current=createMockSession(mockExam4Forms.A.questions,{form:mockExam4Forms.A,now:600});
 state.history.push(submitMockSession(current,{now:700,bank:mockExam4AllQuestions}));
 assert.ok(validMockExam4State(state));
 assert.equal(state.history[0].questions[0].id,'exam4-a-1');
 assert.match(state.history[1].questions[0].id,/^exam4-a-r2-/);
 const suggestions=mockExam4Related('exam4-a-31');
 assert.ok(suggestions.length);
 assert.ok(suggestions.every(q=>mockExam4Questions.includes(q)));
});

test('legacy support rejects altered answer keys and overwritten submitted answers',()=>{
 const original=savedLegacyWork(),changedKey=structuredClone(original),changedAnswer=structuredClone(original);
 changedKey.active.questions[0].answer='An altered canonical key';
 assert.equal(validMockSession(changedKey.active,mockExam4AllQuestions),false);
 changedAnswer.history[0].responses['exam4-a-43']='A rewritten answer after submission';
 assert.equal(validMockExam4State(changedAnswer),false);
 const storage=memory();
 mockExam4Storage.write(storage,original);
 const before=storage.getItem(mockExam4Storage.key);
 assert.throws(()=>mockExam4Storage.write(storage,changedKey),/not valid/);
 assert.equal(storage.getItem(mockExam4Storage.key),before);
});
