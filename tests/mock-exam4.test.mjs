import test from 'node:test';
import {mockExam4Forms as legacyForms,mockExam4Calibration as legacyCalibration} from '../src/mock-exam4-legacy.js';
import assert from 'node:assert/strict';
import {mockExam4Forms,mockExam4PreviousForms,mockExam4QuizAlignedForms,mockExam4Questions,mockExam4Calibration,mockExam4Related,mockExam4AllQuestions,mockExam4AttachmentQuestions,mockExam4AttachmentForm} from '../src/mock-exam4-bank.js';
import {mockExam4QuizShowForm} from '../src/mock-exam4-quiz-show.js';
import {createMockSession,setMockResponse,submitMockSession,applyMockReview,mockResults,mockRubricQuestion,mockRubricResponse,validMockSession,assessMockQuestion} from '../src/mock-exam3-core.js';
import {mockExam4Storage,validMockExam4State} from '../src/mock-exam4-store.js';
import {createStudyBackup,restoreStudyBackup} from '../src/study-backup.js';
import {syllabus} from '../src/course-catalog.js';
import {createLearnerWrittenReview,validWrittenQuestion} from '../src/written-answer-judge.js';
import {mockExam4MatchingPlates,renderMockExam4Figure} from '../src/mock-exam4-figures.js';

const storage=()=>{
 const values=new Map();
 return {getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)};
};
const sessionFor=form=>createMockSession(form.questions,{form});
const submit=session=>submitMockSession(session,{bank:mockExam4AllQuestions});

test('both forms match the 44-question, 60-point blueprint and use real objectives',()=>{
 const objectives=new Set(syllabus.sections.flatMap(s=>s.objectives.map(o=>o.id)));
 assert.equal(new Set(mockExam4Questions.map(q=>q.id)).size,88);
 for(const [letter,form] of Object.entries(mockExam4Forms)){
  const session=sessionFor(form);
  assert.equal(session.maxPoints,60);
  assert.equal(session.ids.length,44);
  assert.ok(validMockSession(session,mockExam4AllQuestions));
  assert.equal(validMockSession(session),false);
  assert.equal(new Set(form.questions.map(q=>q.lesson)).size,15);
  assert.equal(form.questions.filter(q=>q.attachmentKey).length,5);
  const counts=letter==='A'?{mc:30,diagram:12,tf:0,written:2}:{mc:30,diagram:9,tf:3,written:2};
  for(const [kind,expected] of Object.entries(counts))
   assert.equal(form.questions.filter(q=>q.section===kind).length,expected);
  for(const q of form.questions){
   assert.ok(q.objectives.length&&q.objectives.every(id=>objectives.has(id)&&id.startsWith(q.lesson+'.')),q.id);
   assert.ok(q.sourceLinks.length>=1);
   if(q.type==='identify'){
    assert.match(renderMockExam4Figure(q),/<svg/);
    assert.ok(q.wordBank.includes(q.answer));
    assert.equal(q.wordBank.length,new Set(q.wordBank).size);
   }
   if(q.type==='written'){
    assert.ok(validWrittenQuestion(mockRubricQuestion(q)));
    assert.equal(mockExam4Calibration.filter(f=>f.questionId===q.id).length,3);
   }
  }
 }
 assert.ok(mockExam4Related(mockExam4Forms.A.questions[30].id).some(q=>q.id.startsWith('exam4-b-')));
});

test('claim judgment is deterministic and explanation review is bound to the original reason',()=>{
 const form=legacyForms.A,q=form.questions.find(q=>q.claim),fixture=legacyCalibration.find(f=>f.questionId===q.id);
 const reason=mockRubricResponse(q,fixture.response);
 const wrong=q.claim==='True'?'False':'True';
 assert.equal(assessMockQuestion(q,q.claim).earnedPoints,1);
 assert.equal(assessMockQuestion(q,q.claim).pendingPoints,0);
 const response=wrong+'\n'+reason,submitted=submit(setMockResponse(sessionFor(form),q.id,response));
 assert.equal(mockResults(submitted).pendingPoints,1);
 assert.equal(mockResults(submitted).earnedPoints,0);
 const question=mockRubricQuestion(q);
 const review=createLearnerWrittenReview({question,response:reason,submissionId:submitted.submission.id,decisions:{'criterion-2':'met'}});
 const reviewed=applyMockReview(submitted,q.id,review);
 assert.equal(mockResults(reviewed).earnedPoints,1);
 assert.equal(mockResults(reviewed).pendingPoints,0);
 assert.equal(reviewed.submission.responses[q.id],response);
 assert.ok(validMockSession(reviewed,mockExam4AllQuestions));
 assert.throws(()=>applyMockReview(submitted,q.id,{...review,response:'Changed reason'}));
});

test('spelling, answer protection, and Exam 4 full-backup round trip',()=>{
 const form=mockExam4Forms.B,anatomy=form.questions.find(q=>q.answer==='Gastrocnemius');
 assert.equal(assessMockQuestion(anatomy,'gastrocnemus').status,'spelling');
 assert.equal(assessMockQuestion(anatomy,'tibialis anterior').earnedPoints,0);
 const source=storage(),target=storage(),state=mockExam4Storage.blank();
 state.history=[submit(setMockResponse(sessionFor(form),anatomy.id,'gastrocnemus'))];
 state.active=sessionFor(mockExam4Forms.A);
 mockExam4Storage.write(source,state);
 const backup=createStudyBackup(source);
 assert.ok(validMockExam4State(backup.mockExam4));
 assert.equal(restoreStudyBackup(target,backup).exam4Reports,1);
 assert.deepEqual(mockExam4Storage.read(target),state);
});

test('new true-or-false questions grade as two-point choices and lab drill saves and submits',()=>{
 for(const q of mockExam4Forms.B.questions.filter(q=>q.section==='tf')){
  assert.equal(q.type,'choice');
  assert.equal(q.claim,undefined);
  assert.equal(assessMockQuestion(q,q.answer).earnedPoints,2);
  assert.equal(assessMockQuestion(q,q.answer==='True'?'False':'True').earnedPoints,0);
 }
 assert.equal(new Set(mockExam4AttachmentQuestions.filter(q=>q.attachmentKey).map(q=>q.attachmentKey)).size,10);
 assert.equal(mockExam4AttachmentQuestions.filter(q=>q.id.startsWith('exam4-shoulder-')).length,4);
 let attempt=sessionFor(mockExam4AttachmentForm);
 for(const q of attempt.questions)attempt=setMockResponse(attempt,q.id,q.answer);
 const state=mockExam4Storage.blank();
 state.history=[submit(attempt)];
 assert.equal(mockResults(state.history[0]).earnedPoints,14);
 const local=storage();
 mockExam4Storage.write(local,state);
 assert.deepEqual(mockExam4Storage.read(local),state);
});

test('Quiz Show Review covers every prompt once and grades using the mock engine',()=>{
 const form=mockExam4QuizShowForm,items=form.questions;
 assert.deepEqual(items.map(q=>q.reviewSlide),Array.from({length:21},(_,i)=>2+i*2));
 assert.equal(new Set(items.map(q=>q.quizCategory)).size,6);
 const visuals=items.filter(q=>q.type==='identify');
 assert.deepEqual(visuals.map(q=>q.answer),['Masseter','Extensor digitorum']);
 assert(visuals.every(q=>!q.wordBank&&renderMockExam4Figure(q).includes('<svg')));
 let attempt=sessionFor(form);
 for(const q of items)attempt=setMockResponse(attempt,q.id,q.answer);
 assert.equal(mockResults(submit(attempt)).earnedPoints,23);
 const edc=visuals[1],zDisc=mockExam4QuizAlignedForms.A.questions[32],calf=mockExam4Forms.B.questions[38];
 assert.equal(assessMockQuestion(edc,'extensor digitorum communis').earnedPoints,2);
 assert.equal(assessMockQuestion(edc,'extensor digitorum longus').earnedPoints,0);
 assert.equal(assessMockQuestion(zDisc,'Z line').earnedPoints,2);
 assert.equal(assessMockQuestion(zDisc,'M line').earnedPoints,0);
 assert.equal(assessMockQuestion(calf,'gastrocnemus').status,'spelling');
 assert.equal(assessMockQuestion(calf,'medial head of gastrocnemius').earnedPoints,2);
});

test('published replacements retain their points and section across revisions',()=>{
 for(const [before,after,changed] of [
  [mockExam4PreviousForms,mockExam4QuizAlignedForms,{A:[17,28,33,38],B:[2,4,39,41]}],
  [mockExam4QuizAlignedForms,mockExam4Forms,{A:[16,25,28,31,32,33,34,35,36,37,38,39,40,41,42],B:[3,17,27,28,37,42]}],
 ])for(const [letter,positions] of Object.entries(changed)){
  const old=before[letter],updated=after[letter];
  assert.deepEqual(updated.questions.filter((q,i)=>q.id!==old.questions[i].id).map(q=>q.number),positions);
  for(const number of positions){
   const before=old.questions[number-1],after=updated.questions[number-1];
   assert.equal(after.section,before.section);
   assert.equal(after.points,before.points);
   assert(validMockSession(sessionFor(old),mockExam4AllQuestions));
  }
 }
 assert.equal(new Set(mockExam4AllQuestions.map(q=>q.id)).size,mockExam4AllQuestions.length);
});

test('Form A shares five numbered figures without revealing their keys before submission',()=>{
 const form=mockExam4Forms.A,questions=form.questions.filter(q=>q.section==='diagram');
 const groups=Object.groupBy(questions,q=>q.figure);
 assert.deepEqual(Object.fromEntries(Object.entries(groups).map(([name,items])=>[name,items.length])),
  {coverings:3,sarcomere:2,face:3,shoulder:2,leg:2});
 let attempt=sessionFor(form);
 for(const q of questions){
  assert.equal(q.diagramMatch,true);
  const markers=mockExam4MatchingPlates[q.figure].markers;
  assert.equal(q.answer,'Marker '+markers.find(m=>m.term===q.topic).number);
  assert.deepEqual(attempt.options[q.id],markers.map(m=>'Marker '+m.number));
  assert.equal(assessMockQuestion(q,q.distractors[0]).earnedPoints,0);
  const draft=renderMockExam4Figure(q);
  assert.equal(draft,renderMockExam4Figure(groups[q.figure][0]));
  assert.equal((draft.match(/data-matching-marker/g)||[]).length,markers.length);
  assert.ok(!draft.includes('Correct location:'));
  assert.ok(renderMockExam4Figure(q,{reveal:true}).includes('Correct location: '+q.answer));
  attempt=setMockResponse(attempt,q.id,q.answer);
 }
 const score=mockResults(submit(attempt));
 assert.equal(score.earnedPoints,24);
 assert.equal(score.sections.diagram.correct,12);
});

test('scores and drafts from earlier revisions coexist with Quiz Show progress',()=>{
 const local=storage(),restored=storage(),state=mockExam4Storage.blank();
 const previous=mockExam4QuizAlignedForms.A,priorQuestion=previous.questions[32];
 state.history=[submit(setMockResponse(sessionFor(previous),priorQuestion.id,priorQuestion.answer))];
 state.active=sessionFor(mockExam4QuizAlignedForms.B);
 const drill=createMockSession(mockExam4QuizShowForm.questions,{form:mockExam4QuizShowForm,mode:'practice'});
 const first=drill.questions[0];
 state.quizShowDraft=setMockResponse(drill,first.id,first.answer);
 mockExam4Storage.write(local,state);
 assert.equal(mockResults(mockExam4Storage.read(local).history[0]).earnedPoints,2);
 assert.deepEqual(mockExam4Storage.restore(mockExam4Storage.backup(state)),state);
 restoreStudyBackup(restored,createStudyBackup(local));
 assert.deepEqual(mockExam4Storage.read(restored),state);
});
