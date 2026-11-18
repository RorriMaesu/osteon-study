import test from 'node:test';
import assert from 'node:assert/strict';
import {mockExam4AllQuestions,mockExam4Forms} from '../src/mock-exam4-bank.js';
import {mockExam4Storage} from '../src/mock-exam4-store.js';
import {createMockSession,setMockResponse,submitMockSession,mockResults} from '../src/mock-exam3-core.js';
import {interpretWrittenReview} from '../src/written-answer-judge.js';
import {builtInStudyDraft,getWrittenSuggestion,hasConfirmedMiss,saveWrittenSuggestion,studyNoteValue,writtenSuggestionScore} from '../src/mock-review-tools.js';

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
