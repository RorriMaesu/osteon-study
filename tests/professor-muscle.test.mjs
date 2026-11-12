import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {professorMuscleQuestions as qs,professorMuscleQuestionById as byId} from '../src/professor-muscle-bank.js';
import {PROFESSOR_MUSCLE_KEY,blankProfessorState,createProfessorSession,validProfessorState,validProfessorSession,setProfessorResponse,checkProfessorResponse,submitProfessorSession,applyProfessorReview,professorResults,professorMuscleProgress,readProfessorState,writeProfessorState,professorReportExport} from '../src/professor-muscle-store.js';
import {validWrittenQuestion,createLearnerWrittenReview,interpretWrittenReview} from '../src/written-answer-judge.js';
import {selectExam,createSession,validSession} from '../src/exam-core.js';
const storage=()=>{const m=new Map();return {getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v)};};
const review=(s,q,decisions)=>createLearnerWrittenReview({question:q,response:s.responses[q.id],submissionId:s.id,decisions:decisions||Object.fromEntries(q.rubric.criteria.map(c=>[c.id,'met']))});
test('all21 professor-selected source prompts have distinct complete rubrics and transparent practice weights',()=>{
 assert.equal(qs.length,21);assert.deepEqual(qs.map(q=>q.number),Array.from({length:21},(_,i)=>i+1));assert.deepEqual(qs.slice(0,12).map(q=>q.sourceNumber),[33,34,35,37,38,39,40,41,42,43,44,47]);assert.deepEqual(qs.slice(12).map(q=>q.sourceNumber),[28,29,33,34,35,36,37,39,40]);assert.equal(qs.reduce((n,q)=>n+q.points,0),74);
 for(const q of qs){assert.ok(validWrittenQuestion(q),q.id);assert.ok(q.sourceUrl.includes(q.lesson.split('.')[0]+'-critical-thinking'));assert.equal(q.rubric.criteria.length,q.points);}
 for(const number of [19,20,21])assert.equal(qs[number-1].rubric.criteria.length,5);
 assert.match(qs[10].prompt,/same duration/);assert.match(qs[10].answer,/duration alone/);
});
test('rehearsal locks the first response before feedback and revisions keep originals',()=>{
 const q=qs[0],s=createProfessorSession({ids:[q.id]});setProfessorResponse(s,q.id,'My original response.');checkProfessorResponse(s,q.id);assert.throws(()=>setProfessorResponse(s,q.id,'Silently replace it'));applyProfessorReview(s,q.id,review(s,q));submitProfessorSession(s,2);const snapshot=JSON.stringify(s);
 const revision=createProfessorSession({ids:[q.id],revisionOf:s.id});setProfessorResponse(revision,q.id,'My improved response.');assert.equal(JSON.stringify(s),snapshot);assert.equal(revision.revisionOf,s.id);assert.ok(validProfessorSession(revision));
});
test('exam answers stay unrevealed until submitted and invalid saved exam assistance is rejected',()=>{
 const q=qs[3],s=createProfessorSession({mode:'exam',ids:[q.id]});setProfessorResponse(s,q.id,'ATP is needed for detachment.');assert.throws(()=>checkProfessorResponse(s,q.id));assert.throws(()=>applyProfessorReview(s,q.id,review(s,q)));const bad=structuredClone(s);bad.assisted[q.id]=true;assert.equal(validProfessorSession(bad),false);submitProfessorSession(s);applyProfessorReview(s,q.id,review(s,q));assert.ok(validProfessorSession(s));assert.throws(()=>setProfessorResponse(s,q.id,'Changed after submission'));
});
test('AI and self review preserve exact evidence, retain older reviews and report pending separately',()=>{
 const q=qs[1],s=createProfessorSession({ids:[q.id]});setProfessorResponse(s,q.id,'Sodium enters.');checkProfessorResponse(s,q.id);assert.equal(professorResults(s).pending,1);
 const decisions=Object.fromEntries(q.rubric.criteria.map((c,i)=>[c.id,i===0?'met':i===1?'uncertain':'missing']));applyProfessorReview(s,q.id,review(s,q,decisions));assert.equal(professorResults(s).pending,1);assert.equal(professorResults(s).learnerReviewedPoints,1);
 const ai=interpretWrittenReview({components:q.rubric.criteria.map((c,i)=>({id:c.id,decision:i===0?'met':'missing',evidence:i===0?['Sodium enters.']:[],reason:i===0?'You identify entry.':'The response does not state this.'})),feedback:'One criterion is present.',studyNote:''},{question:q,response:s.responses[q.id],submissionId:s.id,model:'test',modelIdentity:'test1',endpoint:'http://127.0.0.1:11434'});applyProfessorReview(s,q.id,ai);assert.equal(s.reviewHistory.length,1);assert.equal(professorResults(s).aiEstimatedPoints,1);assert.equal(professorResults(s).learnerReviewedPoints,0);assert.equal(professorResults(s).pending,0);assert.ok(validProfessorSession(s));const exported=professorReportExport(s);assert.match(exported.note,/not instructor grades/);assert.equal(exported.session.responses[q.id],'Sodium enters.');
});
test('saved drafts, completed reports and revisions round-trip and expose honest21-question progress',()=>{
 const st=storage(),state=blankProfessorState(),q=qs[18],s=createProfessorSession({ids:[q.id]});setProfessorResponse(s,q.id,'Original cuff answer.');checkProfessorResponse(s,q.id);submitProfessorSession(s);state.history.push(s);const revision=createProfessorSession({ids:[q.id],revisionOf:s.id});setProfessorResponse(revision,q.id,'A revision still awaiting review.');state.active=revision;state.studySeen[q.id]=1;assert.ok(validProfessorState(state));writeProfessorState(st,state);assert.deepEqual(readProfessorState(st),state);const p=professorMuscleProgress(st);assert.equal(p.total,21);assert.equal(p.attempted,1);assert.equal(p.revised,1);assert.equal(p.needsReview,1);assert.equal(p.reviewed,0);assert.equal(p.studied,1);
 const raw='{damaged';st.setItem(PROFESSOR_MUSCLE_KEY,raw);assert.throws(()=>readProfessorState(st));assert.equal(st.getItem(PROFESSOR_MUSCLE_KEY),raw);assert.equal(professorMuscleProgress(st).error,true);
});
test('professor review does not enter or invalidate the existing60/100 forms',()=>{
 for(const scope of ['muscles1011','muscles1011-b']){const rows=selectExam(scope),s=createSession(rows,{scope});assert.equal(rows.length,60);assert.equal(Object.values(s.pointValues).reduce((a,b)=>a+b,0),100);assert.ok(rows.every(q=>!byId.has(q.id)));assert.ok(validSession(s));}
 const ui=fs.readFileSync(new URL('../src/professor-muscle-ui.js',import.meta.url),'utf8');assert.match(ui,/session\?\.mode==='exam'&&session.status==='active'\?'exam'/);assert.match(ui,/resumeprofessormusclereview/);assert.match(ui,/professormuscleresults/);assert.match(ui,/data-prof-review="ai"/);
});
