import test from 'node:test';
import {mockExam4Forms as legacyForms,mockExam4Calibration as legacyCalibration} from '../src/mock-exam4-legacy.js';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mockExam4Forms,mockExam4PreviousForms,mockExam4QuizAlignedForms,mockExam4RegionForms,mockExam4Questions,mockExam4Calibration,mockExam4Related,mockExam4AllQuestions,mockExam4AttachmentQuestions,mockExam4AttachmentForm} from '../src/mock-exam4-bank.js';
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

test('prior spelling credit and submitted answers survive backup alongside a new draft',()=>{
 const form=mockExam4RegionForms.B,anatomy=form.questions.find(q=>q.answer==='Gastrocnemius');
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
 const edc=visuals[1],zDisc=mockExam4QuizAlignedForms.A.questions[32],calf=mockExam4RegionForms.B.questions[38];
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
  [mockExam4QuizAlignedForms,mockExam4RegionForms,{A:[16,25,28,31,32,33,34,35,36,37,38,39,40,41,42],B:[3,17,27,28,37,42]}],
  [mockExam4RegionForms,mockExam4Forms,{A:[27,31,32,33,44],B:[11,13,15,25,29,31,32,33,34,35,36,38,39]}],
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

test('the published regional forms preserve the complete question snapshots recorded in saved exams',()=>{
 // Fingerprints of the two forms shipped in 59deaeb, including keys, metadata and rubrics.
 for(const [letter,hash] of Object.entries({
  A:'79da1820fb38f7fb5262a4c62336edbccdc46d608e718a86a76e4ddf75fd5cb0',
  B:'f09367fbf97d4390b21663f4560f72fb5e771a5f8d9890e3cde3ba15056946c7',
 })){
  const form=mockExam4RegionForms[letter];
  assert.equal(createHash('sha256').update(JSON.stringify(form)).digest('hex'),hash);
  for(const q of form.questions)assert.deepEqual(mockExam4AllQuestions.find(saved=>saved.id===q.id),q);
 }
});

test('Form A shares five numbered figures with a plausible fourth covering marker',()=>{
 const form=mockExam4Forms.A,questions=form.questions.filter(q=>q.section==='diagram');
 const groups=Object.groupBy(questions,q=>q.figure);
 assert.deepEqual(Object.fromEntries(Object.entries(groups).map(([name,items])=>[name,items.length])),
  {'coverings-r5':3,sarcomere:2,face:3,shoulder:2,leg:2});
 assert.deepEqual(groups['coverings-r5'].map(q=>q.topic),['Endomysium','Epimysium','Perimysium']);
 assert.equal(mockExam4MatchingPlates['coverings-r5'].markers[3].term,'Skeletal muscle fiber');
 assert.equal(mockExam4MatchingPlates.coverings.markers.length,3);
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

test('Form B combines function-to-marker matching and typed identification for 18 practical points',()=>{
 const form=mockExam4Forms.B,items=form.questions.filter(q=>q.section==='diagram');
 const matches=items.filter(q=>q.diagramMatch),typed=items.filter(q=>q.type==='identify');
 assert.deepEqual(matches.map(q=>q.number),[31,32,33,34,35,38,39]);
 assert.deepEqual(typed.map(q=>q.answer),['Biceps femoris','Extensor digitorum']);
 assert.deepEqual(matches.slice(0,3).map(q=>q.answer),['Marker 3','Marker 1','Marker 2']);
 let attempt=sessionFor(form);
 for(const q of matches){
  assert.ok(!q.prompt.toLowerCase().includes(q.topic.toLowerCase()),'functional cue should not name '+q.topic);
  const plate=mockExam4MatchingPlates[q.figure];
  const markup=renderMockExam4Figure(q);
  assert.equal((markup.match(/data-matching-marker=/g)||[]).length,plate.markers.length);
  assert.equal(q.answer,'Marker '+plate.markers.find(marker=>marker.term===q.topic).number);
  assert.equal(assessMockQuestion(q,q.distractors[0]).earnedPoints,0);
  assert(!markup.includes('Correct location:'));
  assert(renderMockExam4Figure(q,{reveal:true}).includes('Correct location: '+q.answer));
  if(q.figure==='muscle-tissues')assert.doesNotMatch(markup,/smooth muscle|cardiac muscle|skeletal muscle/i);
 }
 for(const q of items)attempt=setMockResponse(attempt,q.id,q.answer);
 const result=mockResults(submit(attempt));
 assert.equal(result.sections.diagram.correct,9);
 assert.equal(result.earnedPoints,18);
});

test('quadriceps short answer credits each named muscle and shared knee extension',()=>{
 const form=mockExam4Forms.A,q=form.questions[43];
 const names=['Rectus femoris','Vastus lateralis','Vastus medialis','Vastus intermedius'];
 const criteria=q.rubric.criteria;
 for(const name of names)assert.equal(criteria.find(c=>c.label.toLowerCase()===name.toLowerCase())?.points,0.5);
 assert.equal(criteria.length,5);
 const action=criteria.find(c=>c.points===1);
 assert.match(action.description,/knee/i);
 assert.doesNotMatch(q.prompt+' '+action.description,/hip|crossing/i);
 const response=names.join(', ')+'. They all extend the knee.';
 const report=submit(setMockResponse(sessionFor(form),q.id,response));
 const review=createLearnerWrittenReview({question:q,response,submissionId:report.submission.id,
  decisions:Object.fromEntries(criteria.map(c=>[c.id,'met']))});
 assert.equal(mockResults(applyMockReview(report,q.id,review)).earnedPoints,3);

 const samples=mockExam4Calibration.filter(f=>f.questionId===q.id);
 assert.deepEqual(samples.map(f=>Object.values(f.expectedPoints).reduce((sum,n)=>sum+n,0)),[3,2,0]);
 for(const sample of samples){
  const result=submit(setMockResponse(sessionFor(form),q.id,sample.response));
  const decisions=Object.fromEntries(criteria.map(c=>[c.id,sample.expectedPoints[c.id]?'met':'missing']));
  const checked=createLearnerWrittenReview({question:q,response:sample.response,submissionId:result.submission.id,decisions});
  const summary=mockResults(applyMockReview(result,q.id,checked)).rows.find(row=>row.q.id===q.id);
  assert.deepEqual(Object.fromEntries(summary.outcome.components.map(c=>[c.id,c.earnedPoints])),sample.expectedPoints);
  assert.equal(summary.outcome.pendingPoints,0);
 }
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
