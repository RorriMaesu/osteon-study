import test from 'node:test';
import assert from 'node:assert/strict';
import {mockExam4AllQuestions,mockExam4Forms,mockExam4QuizAlignedForms} from '../src/mock-exam4-bank.js';
import {mockExam4Storage} from '../src/mock-exam4-store.js';
import {applyMockReview,createMockSession,setMockResponse,submitMockSession,mockResults} from '../src/mock-exam3-core.js';
import {createLearnerWrittenReview,interpretWrittenReview} from '../src/written-answer-judge.js';
import {builtInStudyDraft,getWrittenSuggestion,hasConfirmedMiss,missedStudyPriorities,priorityRecall,saveWrittenSuggestion,studyEvidence,studyNoteValue,studyRecallItems,writtenSuggestionScore} from '../src/mock-review-tools.js';
import {studyCardLine} from '../src/mock-study-content.js';

function savedAttempt(){
  const form=mockExam4Forms.A;
  const written=form.questions.find(q=>q.type==='written');
  const choice=form.questions[0];
  let draft=createMockSession(form.questions,{form,now:100});
  draft=setMockResponse(draft,written.id,'Myosin stays attached.');
  draft=setMockResponse(draft,choice.id,choice.distractors[0]);
  return {written,choice,session:submitMockSession(draft,{now:200,bank:mockExam4AllQuestions})};
}

test('AI evidence and suggested points survive backup without changing a submitted score or answer',()=>{
  const {written,session}=savedAttempt();
  const state=mockExam4Storage.blank();
  state.history.push(session);
  const response=session.responses[written.id];
  const review=interpretWrittenReview({
    components:written.rubric.criteria.map((c,i)=>({id:c.id,decision:i===0?'met':'missing',reason:'Review the ATP requirement.',evidence:i===0?[response]:[]})),
    feedback:'Compare your answer with the rubric.',studyNote:'Recall what ATP does.'
  },{question:written,response,submissionId:session.submission.id,model:'sample',modelIdentity:'sample-1',endpoint:'http://127.0.0.1:11434',now:300});
  const before=structuredClone(session);
  saveWrittenSuggestion(state,session,review);
  const restored=mockExam4Storage.restore(mockExam4Storage.backup(state));
  assert.deepEqual(restored.history[0],before);
  assert.equal(mockResults(restored.history[0]).pendingPoints,3);
  const suggestion=getWrittenSuggestion(restored,session,written);
  assert.deepEqual(suggestion,review);
  assert.equal(writtenSuggestionScore(session,written,suggestion).earnedPoints,1);
  restored.writtenSuggestions[session.id][written.id].response='Different answer';
  assert.equal(getWrittenSuggestion(restored,session,written),null);
});

test('notes come from confirmed misses and preserve existing or deliberately cleared fields',()=>{
  const {written,choice,session}=savedAttempt();
  const rows=mockResults(session).rows;
  assert.equal(hasConfirmedMiss(rows.find(row=>row.q.id===written.id)),false);
  const missed=rows.find(row=>row.q.id===choice.id);
  assert.equal(hasConfirmedMiss(missed),true);
  const state=mockExam4Storage.blank();
  state.history.push(session);
  const key=session.id+':'+choice.id;
  state.notes[key]={confusion:'',rule:'My own explanation',retrieval:'',updatedAt:200,studyEdits:['retrieval'],studyDraft:builtInStudyDraft(missed)};
  const restored=mockExam4Storage.restore(mockExam4Storage.backup(state)).notes[key];
  assert.match(studyNoteValue(restored,'confusion'),new RegExp(choice.topic));
  assert.equal(studyNoteValue(restored,'rule'),'My own explanation');
  assert.equal(studyNoteValue(restored,'retrieval'),'');
  assert.ok(studyNoteValue(restored,'cardDraft').length<=180);
});

test('answer-key notes connect an actual wrong choice and visual answer to a specific contrast',()=>{
  const form=mockExam4QuizAlignedForms.A;
  const choice=form.questions.find(q=>q.topic==='Sodium and potassium channels');
  const visual=form.questions.find(q=>q.topic==='Infraspinatus');
  let attempt=createMockSession([choice,visual],{form,now:100});
  attempt=setMockResponse(attempt,choice.id,choice.distractors[0]);
  attempt=setMockResponse(attempt,visual.id,'Supraspinatus');
  const [choiceRow,visualRow]=mockResults(submitMockSession(attempt,{now:200,bank:mockExam4AllQuestions})).rows;
  assert.match(builtInStudyDraft(choiceRow).confusion,/Sodium entry drives the upstroke.*Potassium exit/);
  assert.equal(studyEvidence(visualRow).orientation,'Deep left shoulder, posterior');
  assert.match(builtInStudyDraft(visualRow).confusion,/below.*Supraspinatus lies above/);
  assert.ok(studyRecallItems(visualRow)[0].figure);
  assert.doesNotMatch(studyRecallItems(visualRow)[0].prompt,/infraspinatus/i);
});

test('partial written notes quiz only the confirmed gap while preserving earned and pending criteria',()=>{
  const {written,session}=savedAttempt();
  const review=createLearnerWrittenReview({question:written,response:session.responses[written.id],submissionId:session.submission.id,
    decisions:{'criterion-1':'met','criterion-2':'missing','criterion-3':'uncertain'},now:300});
  const reviewed=applyMockReview(session,written.id,review,{now:300});
  const row=mockResults(reviewed).rows.find(item=>item.q.id===written.id);
  const evidence=studyEvidence(row);
  assert.deepEqual(evidence.earned,['Myosin detachment']);
  assert.deepEqual(evidence.pending,['Calcium and relaxation']);
  assert.deepEqual(evidence.missing.map(item=>item.label),['Cross-bridge cycling']);
  assert.equal(studyRecallItems(row).length,1);
  assert.match(studyRecallItems(row)[0].prompt,/while myosin remains attached/);
  assert.doesNotMatch(builtInStudyDraft(row).rule,/reuptake/);
});

test('study priorities combine aligned concepts and count repeat misses once per earlier attempt',()=>{
  const choice=mockExam4Forms.B.questions.find(q=>q.topic==='Muscle packaging');
  const visual=mockExam4Forms.A.questions.find(q=>q.topic==='Epimysium');
  const other=mockExam4Forms.A.questions.find(q=>q.topic==='Sodium and potassium channels');
  function wrongAttempt(time){
    let attempt=createMockSession([choice,visual,other],{now:time});
    attempt=setMockResponse(attempt,choice.id,choice.distractors[0]);
    attempt=setMockResponse(attempt,visual.id,'Marker 2');
    attempt=setMockResponse(attempt,other.id,other.distractors[0]);
    return submitMockSession(attempt,{now:time+1,bank:mockExam4AllQuestions});
  }
  const first=wrongAttempt(100),current=wrongAttempt(200);
  const groups=missedStudyPriorities(mockResults(current).rows,[first,current],current.id);
  assert.equal(groups[0].name,'Muscle connective tissue layers');
  assert.equal(groups[0].points,3);
  assert.equal(groups[0].earlierAttempts,1);
  assert.equal(priorityRecall(groups).length,2);
  const row=mockResults(current).rows.find(item=>item.q.id===visual.id);
  assert.match(studyEvidence(row).contrast,/Marker 2 identifies Perimysium/);
  assert.equal(studyRecallItems(row)[0].figure,true);
  assert.match(studyRecallItems(row)[0].answer,/Marker 1 · Epimysium/);
});

test('study card suggestions fit the limit without cutting off any exam-bank sentences',()=>{
  for(const question of mockExam4AllQuestions){
    const line=studyCardLine(question);
    assert.ok(line.length<=180,question.id);
    assert.match(line,/[.!?]$/,question.id);
  }
  const q=mockExam4Forms.A.questions.find(item=>item.topic==='Complete ATP depletion');
  assert.equal(studyCardLine(q),'ATP binding is required for myosin detachment.');
});
