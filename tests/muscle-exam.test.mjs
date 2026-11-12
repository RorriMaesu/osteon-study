import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {examBank} from '../src/exam-bank.js';
import {selectExam,createSession,validSession,results,sessionOutcome,syllabus} from '../src/exam-core.js';
import {muscleExamKind,muscleExamBlueprint,muscleExamSectionCounts,muscleExamCoverage,selectLegacyMuscleExam} from '../src/muscle-exam-blueprint.js';
import {muscleExamBank} from '../src/muscle-exam-bank.js';
import {examFigure} from '../src/exam-figures.js';
import {assessTyped} from '../src/typed-answer.js';
import {validWrittenQuestion,createLearnerWrittenReview,interpretWrittenReview} from '../src/written-answer-judge.js';
import {resultExport,renderExamReport} from '../src/exam-report.js';
const key=q=>q.type==='match'?Object.fromEntries(q.pairs.map(p=>[p.left,p.right])):q.type==='order'?[...q.steps]:q.answer;
test('both combined forms preserve exact format, section, chapter and point distributions',()=>{
 const forms=['muscles1011','muscles1011-b'].map(scope=>{
  const items=selectExam(scope),s=createSession(items,{scope});assert.equal(items.length,60);assert.equal(new Set(s.ids).size,60);assert.ok(validSession(JSON.parse(JSON.stringify(s))));
  for(const chapter of [10,11]){const rows=items.filter(q=>Number(q.lesson.split('.')[0])===chapter);assert.equal(rows.length,30);assert.equal(rows.reduce((n,q)=>n+s.pointValues[q.id],0),50);for(const group of muscleExamBlueprint)assert.equal(rows.filter(q=>muscleExamKind(q)===group.kind).length,group.count);muscleExamSectionCounts[chapter].forEach((n,i)=>assert.equal(rows.filter(q=>q.lesson===chapter+'.'+(i+1)).length,n));}
  s.ids.forEach(id=>{s.responses[id]=key(items.find(q=>q.id===id));});const r=results(s);assert.equal(r.maxPoints,100);assert.equal(r.earnedPoints,88);assert.equal(r.pendingPoints,12);assert.equal(r.maxPossiblePoints,100);assert.equal(r.pending,4);
  for(const chapter of ['10','11']){assert.equal(r.chapters[chapter].maxPoints,50);assert.equal(r.chapters[chapter].earnedPoints,44);assert.equal(r.chapters[chapter].pendingPoints,6);}
  const bad=structuredClone(s);bad.pointValues[bad.ids[0]]++;assert.equal(validSession(bad),false);return s;
 });
 assert.ok(forms[0].ids.filter(id=>forms[1].ids.includes(id)).length<=10,'Forms should mostly use different items.');
 assert.equal(forms[0].ids.filter(id=>id.startsWith('mx-')&&forms[1].ids.includes(id)).length,0,'Visual and written forms must differ.');
});
test('Chapter 11 standalone samples every objective at its 50-question section weights',()=>{
 for(let run=0;run<20;run++){const items=selectExam('11');assert.equal(items.length,50);for(const section of syllabus.sections.filter(s=>s.chapter===11)){assert.equal(items.filter(q=>q.lesson===section.id).length,section.examWeight);for(const o of section.objectives)assert.ok(items.some(q=>q.objectives.includes(o.id)),o.id);}}
});
test('revised paired forms cover all objectives without changing previously saved forms',()=>{
 const forms=['muscles1011','muscles1011-b'].map(scope=>selectExam(scope));
 assert.equal(muscleExamCoverage(forms.flat()).sampled.length,47);assert.equal(muscleExamCoverage(forms.flat()).notSampled.length,0);
 for(const form of forms){
  assert.ok(muscleExamCoverage(form).sampled.length>=40);
  assert.deepEqual(form.filter(q=>q.revisedAxial).map(q=>q.lesson).sort(),['11.3','11.4']);
 }
 const oldItems=selectLegacyMuscleExam('muscles1011',examBank),old=createSession(oldItems,{scope:'muscles1011'});old.blueprintVersion='10-11-v1';old.responses[old.ids[0]]=key(oldItems[0]);const snapshot=JSON.stringify(old);
 assert.ok(validSession(JSON.parse(snapshot)));assert.equal(JSON.stringify(old),snapshot);assert.equal(results(old).maxPoints,100);assert.equal(muscleExamCoverage(oldItems).sampled.length,34);
});
test('written explanations remain pending without a valid response-bound rubric review',()=>{
 const q=muscleExamBank.find(q=>q.type==='written'),s=createSession([q]);assert.ok(validWrittenQuestion(q));s.responses[q.id]='My original explanation connects the events.';assert.equal(sessionOutcome(s,q).status,'pending');assert.equal(results(s).pending,1);
 s.status='submitted';s.submitted=Date.now();const decisions={c1:'met',c2:'missing',c3:'uncertain'};
 s.writtenReviews={[q.id]:createLearnerWrittenReview({question:q,response:s.responses[q.id],submissionId:s.id,decisions})};
 let r=results(s);assert.equal(r.pending,1);assert.equal(r.earnedPoints,1/3);assert.equal(r.pendingPoints,1/3);assert.equal(r.independentPoints,0);assert.equal(r.selfReviewed,1);assert.ok(validSession(s));
 s.writtenReviews[q.id]=createLearnerWrittenReview({question:q,response:s.responses[q.id],submissionId:s.id,decisions:{c1:'met',c2:'met',c3:'missing'}});assert.equal(sessionOutcome(s,q).status,'partial');assert.equal(results(s).pending,0);assert.ok(validSession(s));
 s.responses[q.id]='Changed after the review';assert.equal(validSession(s),false);assert.equal(sessionOutcome(s,q).status,'pending');
});
test('local written reviews require quoted response evidence and score criterion credit',()=>{
 const q=muscleExamBank.find(q=>q.type==='written'),s=createSession([q]);s.responses[q.id]='The fiber can depolarize. Calcium binds troponin. Force falls.';
 const input={components:[{id:'c1',decision:'met',evidence:['The fiber can depolarize.'],reason:'The response separates excitation.'},{id:'c2',decision:'met',evidence:['Calcium binds troponin.'],reason:'The response names regulation.'},{id:'c3',decision:'uncertain',evidence:[],reason:'The causal detail needs clarification.'}],feedback:'Controlled review fixture; one criterion remains pending.',studyNote:''};
 const context={question:q,response:s.responses[q.id],submissionId:s.id,model:'test:local',modelIdentity:'test-local-v1',endpoint:'http://127.0.0.1:11434'};
 const review=interpretWrittenReview(input,context);s.writtenReviews={[q.id]:review};assert.equal(sessionOutcome(s,q).earnedPoints,2);assert.equal(sessionOutcome(s,q).pendingPoints,1);assert.ok(validSession(s));
 assert.throws(()=>interpretWrittenReview({...input,components:input.components.map((c,i)=>i?c:{...c,evidence:['This was not written']})},context));
});
test('muscle spelling support distinguishes close muscle names and accepts an unambiguous typo',()=>{
 for(const [answer,response] of [['Teres minor','Teres major'],['Flexor digitorum profundus','Flexor digitorum superficialis'],['Biceps brachii','Biceps femoris'],['Vastus medialis','Vastus lateralis'],['Palmar interossei','Dorsal interossei'],['Flexor hallucis longus','Flexor hallucis brevis']])assert.equal(assessTyped({id:'muscle-check',answer},response).status,'incorrect',answer);
 assert.equal(assessTyped({id:'test',answer:'Infraspinatus'},'infraspinatuss').status,'spelling');
});
test('all new visual items render and all written rubrics are valid',()=>{
 for(const q of muscleExamBank){if(q.figure){const html=examFigure(q.figure,q.target);assert.ok(html.includes('<svg'),q.id);assert.ok(!html.includes('undefined'),q.id);}if(q.type==='written')assert.ok(validWrittenQuestion(q),q.id);}
});
test('weighted reports and exports retain point intervals, original answers and chapter scores',()=>{
 const items=selectExam('muscles1011'),s=createSession(items,{scope:'muscles1011'});items.forEach(q=>s.responses[q.id]=key(q));s.status='submitted';s.submitted=Date.now();
 const root={innerHTML:'',querySelector:()=>({addEventListener(){}}),querySelectorAll:()=>[]};renderExamReport({root,session:s,bank:examBank,title:'Test',escape:String});assert.match(root.innerHTML,/88\/100/);assert.match(root.innerHTML,/Three-part explanation rubric/);assert.match(root.innerHTML,/data-written-self/);assert.match(root.innerHTML,/Not sampled in this form/);assert.match(root.innerHTML,/Written rubrics/);assert.ok(!root.innerHTML.includes('undefined'));
 const exported=resultExport(s,'Test',examBank);assert.equal(exported.summary.maxPoints,100);assert.equal(exported.summary.pendingPoints,12);assert.equal(exported.summary.chapters['11'].maxPoints,50);assert.equal(exported.answers.filter(q=>q.correct===null).length,4);
});
test('combined simulation locks tutor in question and submission views and submits before AI review',()=>{
 const ui=fs.readFileSync(new URL('../src/exam-ui.js',import.meta.url),'utf8');
 assert.match(ui,/setTutorAssessmentMode\(combined\?'exam':'practice'\)/);assert.match(ui,/function overview\(\)\{setTutorAssessmentMode\(isMuscleCombinedScope\(session.scope\)\?'exam':'practice'\)/);
 assert.match(ui,/if\(isMuscleCombinedScope\(session.scope\)\)\{finalize\(\);return;\}/);assert.match(ui,/function report\(\)\{\s+setTutorAssessmentMode\(null\)/);assert.match(ui,/onRubric:confirmWritten/);
});
