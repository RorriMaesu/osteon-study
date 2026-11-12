import test from 'node:test';
import assert from 'node:assert/strict';
import {examBank} from '../src/exam-bank.js';
import {selectExam,createSession,validSession,results} from '../src/exam-core.js';
import {muscleExamCoverage} from '../src/muscle-exam-blueprint.js';
import {muscleChecklistBank,muscleChecklistTargets,muscleChecklistQuestionsFor} from '../src/muscle-checklist-bank.js';
import {muscleFigureTargets} from '../src/muscle-figure-targets.js';
import {muscleApplicationBank} from '../src/muscle-application-bank.js';
import {assessTyped,outcomeCorrect} from '../src/typed-answer.js';
import {sectionCheckpoint} from '../src/study-evidence.js';
import {validWrittenQuestion,interpretWrittenReview} from '../src/written-answer-judge.js';
import {examFigure} from '../src/exam-figures.js';
import {resultExport,renderExamReport} from '../src/exam-report.js';
const get=id=>examBank.find(q=>q.id===id);
test('coverage does not credit tendon, length-tension or twitch phases for unrelated name tasks',()=>{
 for(const id of ['mx-a-band','mx-b-band'])assert.deepEqual(get(id).objectives,['10.2.3']);
 for(const id of ['mx-a-unfused','mx-b-fused','mx-b-summation'])assert.deepEqual(get(id).objectives,['10.4.4']);
 for(const id of ['mx-a-recruit','mx-written-recruitment','ex-10.7-8','ex-10.9-6'])assert.deepEqual(get(id).objectives,[]);
 assert.deepEqual(get('mx-written-knee').objectives,['11.6.2']);
 const a=selectExam('muscles1011'),b=selectExam('muscles1011-b');
 for(const rows of [a,b])for(const objective of ['10.2.2','10.4.1','10.4.2','10.4.3','10.9.3'])assert.ok(rows.some(q=>q.objectives.includes(objective)),objective);
 assert.deepEqual([muscleExamCoverage(a).sampled.length,muscleExamCoverage(b).sampled.length],[44,45]);
 assert.equal(muscleExamCoverage([...a,...b]).sampled.length,47);
});
test('every required checklist target has a rubric and visual targets use only its own verified source figure',()=>{
 assert.equal(muscleChecklistTargets.length,67);
 for(const card of muscleChecklistTargets){const rows=muscleChecklistQuestionsFor([card.id]);assert.ok(rows.some(q=>q.type==='written'&&validWrittenQuestion(q)),card.id);for(const q of rows.filter(q=>q.figure)){const target=muscleFigureTargets[q.figure.slice(14)];assert.ok(card.figures.includes(target.figure),card.id);if(card.figureTarget)assert.equal(q.figure.slice(14),card.figureTarget);}}
 assert.equal(muscleChecklistBank.filter(q=>q.type==='written').length,67);
 assert.ok(selectExam('11').every(q=>!q.checklistTargetId));
});
test('regional checkpoints include a real view, a prediction and typed retrieval',()=>{
 for(const section of ['11.3','11.5','11.6']){const pool=examBank.filter(q=>q.lesson===section),rows=sectionCheckpoint(pool,[],5);assert.equal(rows.length,5);assert.ok(rows.some(q=>q.figure),section);assert.ok(rows.some(q=>q.assessmentFacets.includes('application')),section);assert.ok(rows.some(q=>q.type==='text'),section);assert.ok(rows.every(q=>q.type!=='written'));}
});
test('contextual wording accepts harmless alternatives and retains anatomical distinctions',()=>{
 for(const [id,response] of [['ex-10.4-10','latent'],['ex-11.1-11','3rd class lever'],['ex-11.1-11','class III lever'],['ex-11.5-2','rhomboid minor and rhomboid major'],['ex-11.3-15','erector spinae muscles']])assert.ok(outcomeCorrect(assessTyped(get(id),response)),response);
 for(const [answer,response] of [['Teres minor','teres major'],['Flexor digitorum superficialis','flexor digitorum profundus'],['Third-class lever','second class lever']])assert.ok(!outcomeCorrect(assessTyped({id:'test',answer},response)));
});
test('old distractor snapshots remain valid and new application diagrams and rubrics render',()=>{
 for(const q of examBank.filter(q=>q.legacyDistractors&&q.lesson.startsWith('10.'))){const s=createSession([q]);s.options[q.id]=[q.answer,...q.legacyDistractors.slice(0,3)];assert.ok(validSession(s),q.id);}
 for(const q of muscleApplicationBank){if(q.figure)assert.ok(examFigure(q.figure,q.target).includes('<svg'));if(q.type==='written')assert.ok(validWrittenQuestion(q),q.id);}
});
test('local written estimates cannot inflate independently graded objective points',()=>{
 const q=get('mx-written-calcium'),s=createSession([q]);s.status='submitted';s.submitted=1;s.responses[q.id]='Controlled sample response.';
 s.writtenReviews={[q.id]:interpretWrittenReview({components:q.rubric.criteria.map(c=>({id:c.id,decision:'met',evidence:['Controlled sample response.'],reason:'Controlled fixture, not an actual model judgment.'})),feedback:'Fixture only.',studyNote:''},{question:q,response:s.responses[q.id],submissionId:s.id,model:'test',modelIdentity:'test-v1',endpoint:'http://127.0.0.1:11434'})};
 const r=results(s);assert.equal(r.earnedPoints,1);assert.equal(r.aiEstimatedPoints,1);assert.equal(r.independentPoints,0);assert.equal(r.automaticMaxPoints,0);assert.equal(r.maxIndependent,0);assert.ok(validSession(s));
 const exported=resultExport(s,'Written practice',examBank);assert.equal(exported.summary.aiEstimatedPoints,1);assert.equal(exported.summary.automaticMaxPoints,0);assert.equal(exported.summary.rubricMaxPoints,1);
 const root={innerHTML:'',querySelector:()=>({addEventListener(){}}),querySelectorAll:()=>[]};renderExamReport({root,session:s,bank:examBank,title:'Written practice',escape:String});assert.match(root.innerHTML,/Written rubric practice/);assert.match(root.innerHTML,/Written practice estimates/);assert.ok(!root.innerHTML.includes('0/0'));
});
