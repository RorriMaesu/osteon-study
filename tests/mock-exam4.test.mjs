import test from 'node:test';
import assert from 'node:assert/strict';
import {mockExam4Forms,mockExam4Questions,mockExam4Calibration,mockExam4Related} from '../src/mock-exam4-bank.js';
import {createMockSession,setMockResponse,submitMockSession,applyMockReview,mockResults,mockRubricQuestion,mockRubricResponse,validMockSession,assessMockQuestion} from '../src/mock-exam3-core.js';
import {mockExam4Storage,validMockExam4State} from '../src/mock-exam4-store.js';
import {createStudyBackup,restoreStudyBackup} from '../src/study-backup.js';
import {syllabus} from '../src/course-catalog.js';
import {createLearnerWrittenReview,validWrittenQuestion} from '../src/written-answer-judge.js';
import {renderMockExam4Figure} from '../src/mock-exam4-figures.js';

const storage=()=>{
 const values=new Map();
 return {getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)};
};
const sessionFor=form=>createMockSession(form.questions,{form});
const submit=session=>submitMockSession(session,{bank:mockExam4Questions});

test('both forms match the 44-question, 60-point blueprint and use real objectives',()=>{
 const objectives=new Set(syllabus.sections.flatMap(s=>s.objectives.map(o=>o.id)));
 const quotas={10:[2,5,8,5,2,2,2,2,2],11:[5,2,6,5,6,6]};
 assert.equal(new Set(mockExam4Questions.map(q=>q.id)).size,88);
 for(const form of Object.values(mockExam4Forms)){
  const session=sessionFor(form);
  assert.equal(session.maxPoints,60);
  assert.ok(validMockSession(session,mockExam4Questions));
  assert.equal(validMockSession(session),false);
  for(const [chapter,counts] of Object.entries(quotas)){
   const items=form.questions.filter(q=>q.chapter===Number(chapter));
   assert.equal(items.length,22);
   assert.deepEqual(counts.map((_,i)=>items.filter(q=>q.lesson===chapter+'.'+(i+1)).reduce((n,q)=>n+q.points,0)),counts);
  }
  for(const [kind,expected] of Object.entries({mc:30,diagram:9,tf:3,written:2}))
   assert.equal(form.questions.filter(q=>q.section===kind).length,expected);
  for(const q of form.questions){
   assert.ok(q.objectives.length&&q.objectives.every(id=>objectives.has(id)&&id.startsWith(q.lesson+'.')),q.id);
   assert.equal(q.sourceLinks.length,1);
   if(q.type==='identify')assert.match(renderMockExam4Figure(q),/<svg/);
   if(q.type==='written'){
    assert.ok(validWrittenQuestion(mockRubricQuestion(q)));
    assert.equal(mockExam4Calibration.filter(f=>f.questionId===q.id).length,3);
   }
  }
 }
 assert.ok(mockExam4Related(mockExam4Forms.A.questions[30].id).some(q=>q.id.startsWith('exam4-b-')));
});

test('claim judgment is deterministic and explanation review is bound to the original reason',()=>{
 const form=mockExam4Forms.A,q=form.questions.find(q=>q.claim),fixture=mockExam4Calibration.find(f=>f.questionId===q.id);
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
 assert.ok(validMockSession(reviewed,mockExam4Questions));
 assert.throws(()=>applyMockReview(submitted,q.id,{...review,response:'Changed reason'}));
});

test('spelling, answer protection, and Exam 4 full-backup round trip',()=>{
 const form=mockExam4Forms.A,anatomy=form.questions.find(q=>q.answer==='Infraspinatus');
 assert.equal(assessMockQuestion(anatomy,'infrasspinatus').status,'spelling');
 assert.equal(assessMockQuestion(anatomy,'supraspinatus').earnedPoints,0);
 const source=storage(),target=storage(),state=mockExam4Storage.blank();
 state.history=[submit(setMockResponse(sessionFor(form),anatomy.id,'infrasspinatus'))];
 state.active=sessionFor(mockExam4Forms.B);
 mockExam4Storage.write(source,state);
 const backup=createStudyBackup(source);
 assert.ok(validMockExam4State(backup.mockExam4));
 assert.equal(restoreStudyBackup(target,backup).exam4Reports,1);
 assert.deepEqual(mockExam4Storage.read(target),state);
});
