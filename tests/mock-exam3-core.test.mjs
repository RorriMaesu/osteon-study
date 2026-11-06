import test from 'node:test';
import assert from 'node:assert/strict';
import {createMockSession,setMockResponse,submitMockSession,mockResults,mockOutcome,validMockSession,applyMockReview,mockReportExport} from '../src/mock-exam3-core.js';
import {interpretWrittenReview,rubricCriteria,createLearnerWrittenReview} from '../src/written-answer-judge.js';
import {mockExam3Questions,mockExam3AllQuestions} from '../src/mock-exam3-bank.js';
const clone=value=>JSON.parse(JSON.stringify(value));
const fixture=[
  {id:'choice',type:'choice',chapter:6,lesson:'6.3',section:'mc',prompt:'Which cell builds?',answer:'Osteoblast',distractors:['Osteoclast','Osteocyte','Osteogenic cell'],points:1},
  {id:'diagram',type:'identify',chapter:8,lesson:'8.4',section:'diagram',prompt:'Name this landmark.',answer:'Medial malleolus',aliases:['Tibial medial malleolus'],points:2},
  {id:'written',type:'written',chapter:6,lesson:'6.4',section:'written',prompt:'Explain the starting tissue and mechanism.',answer:'Mesenchyme forms bone directly; cartilage is replaced.',points:3,
    rubric:{id:'test-rubric',version:'1',modelAnswer:'Mesenchyme forms bone directly; cartilage is replaced.',criteria:[
      {id:'a',label:'Mesenchyme',description:'Names mesenchyme.',points:.5},
      {id:'b',label:'Direct',description:'Forms bone directly.',points:.5},
      {id:'c',label:'Cartilage',description:'Starts with cartilage.',points:1},
      {id:'d',label:'Replacement',description:'Cartilage is replaced.',points:1}
    ]}}
];
const make=()=>createMockSession(fixture,{now:100,rng:()=>.5,form:{id:'targeted',version:'1',title:'Targeted recall'}});
const submit=s=>submitMockSession(s,{now:200,bank:fixture});
const filled=()=>fixture.reduce((s,q)=>setMockResponse(s,q.id,q.answer),make());
const review=(session,decision={})=>interpretWrittenReview({components:rubricCriteria(fixture[2]).map(c=>({id:c.id,decision:decision[c.id]||'met',evidence:['met','contradicted'].includes(decision[c.id]||'met')?[session.responses.written]:[],reason:'The source-backed criterion is checked.'})),feedback:'Review the stated mechanism.',studyNote:'Starting tissue -> mechanism.'},{question:fixture[2],response:session.responses.written,submissionId:session.submission.id,model:'local:test',modelIdentity:'local|digest',endpoint:'http://127.0.0.1:11434',now:210});

test('the full form retains all 44 questions, 60 points and a stable option shuffle',()=>{
  const a=createMockSession(mockExam3Questions,{now:100,rng:()=>.4}),b=createMockSession(mockExam3Questions,{now:100,rng:()=>.4});
  assert.equal(a.ids.length,44);assert.equal(a.maxPoints,60);assert.deepEqual(a.options,b.options);
  assert.ok(validMockSession(a));assert.ok(validMockSession(clone(a)));
  assert.equal(mockResults(a).maxPoints,60);
});

test('full blank submission is known zero; answer keys resolve 54 and leave six written points',()=>{
  const blank=submitMockSession(createMockSession(mockExam3Questions,{now:100}),{now:200});
  assert.equal(mockResults(blank).earnedPoints,0);assert.equal(mockResults(blank).pendingPoints,0);
  let correct=createMockSession(mockExam3Questions,{now:100});
  for(const q of mockExam3Questions)correct=setMockResponse(correct,q.id,q.answer);
  correct=submitMockSession(correct,{now:200});
  const result=mockResults(correct);
  assert.equal(result.earnedPoints,54);assert.equal(result.pendingPoints,6);assert.equal(result.maxPossiblePoints,60);
  for(const q of correct.questions.filter(q=>q.type==='written')) {
    const r=interpretWrittenReview({components:rubricCriteria(q).map(c=>({id:c.id,decision:'met',evidence:[correct.responses[q.id]],reason:'This criterion is present.'})),feedback:'All requested components are present.',studyNote:''},
      {question:q,response:correct.responses[q.id],submissionId:correct.submission.id,model:'local:test',modelIdentity:'local|digest',endpoint:'http://127.0.0.1:11434'});
    correct=applyMockReview(correct,q.id,r);
  }
  assert.equal(mockResults(correct).earnedPoints,60);assert.equal(mockResults(correct).pendingPoints,0);assert.ok(validMockSession(correct));
});

test('submission copies and locks answers before asynchronous grading',()=>{
  const draft=filled(), submitted=submit(draft);
  assert.equal(submitted.status,'submitted');assert.equal(submitted.gradingState,'pending');
  assert.equal(draft.status,'draft');assert.equal(submitted.submission.responses.written,draft.responses.written);
  draft.responses.written='changed draft';assert.notEqual(submitted.responses.written,draft.responses.written);
  assert.throws(()=>setMockResponse(submitted,'written','changed'),/locked/);
  assert.ok(validMockSession(clone(submitted),fixture));
  const changed=clone(submitted);changed.responses.written='tampered';assert.ok(!validMockSession(changed,fixture));
  assert.throws(()=>applyMockReview(changed,'written',review(submitted)),/changed/);
});

test('weighted partial points, pending components and chapter summaries reconcile',()=>{
  let session=submit(filled());
  session=applyMockReview(session,'written',review(session,{a:'missing',b:'uncertain'}));
  const r=mockResults(session);
  assert.equal(r.earnedPoints,5);assert.equal(r.pendingPoints,.5);assert.equal(r.maxPoints,6);
  assert.equal(r.missedPoints,.5);assert.equal(r.maxPossiblePoints,5.5);
  assert.equal(r.chapters[6].earnedPoints,3);assert.equal(r.chapters[8].earnedPoints,2);
  assert.equal(r.sections.written.pendingPoints,.5);assert.ok(validMockSession(session,fixture));
});

test('ambiguous diagrams contribute their own pending points; wrong neighbor loses two',()=>{
  let s=setMockResponse(make(),'diagram','the tibial projection at the ankle');
  s=setMockResponse(s,'written','Mesenchyme');s=submit(s);
  assert.equal(mockOutcome(s,fixture[1]).status,'pending');assert.equal(mockResults(s).pendingPoints,5);
  s=submit(setMockResponse(make(),'diagram','Lateral malleolus'));
  assert.equal(mockResults(s).pendingPoints,0);assert.equal(mockOutcome(s,fixture[1]).earnedPoints,0);
  assert.equal(mockOutcome(s,fixture[1]).maxPoints,2);
});

test('review retries are idempotent and revisions preserve the initial result',()=>{
  const s=submit(filled()),first=review(s,{a:'missing'});
  const graded=applyMockReview(s,'written',first,{now:210}),again=applyMockReview(graded,'written',first,{now:220});
  assert.equal(again.reviewHistory.length,1);assert.equal(again.initialOutcomes.written.status,'pending');
  const revised=applyMockReview(again,'written',review(s),{now:230});
  assert.equal(revised.reviewHistory.length,2);assert.equal(mockResults(revised).earnedPoints,6);
  assert.equal(mockResults(graded).earnedPoints,5.5);assert.ok(validMockSession(revised,fixture));
});

test('invalid versions, forged snapshots, unknown flags, option changes and invalid responses reject import',()=>{
  const base=make();assert.ok(validMockSession(base,fixture));
  const mutations=[s=>s.schema=900,s=>s.questions[0].answer='Osteoclast',s=>s.questions[1].points=100,s=>s.options.choice=['Osteoblast'],s=>s.flags.unrecognized=true,s=>s.assisted.choice='yes',s=>s.responses.choice='Unknown',s=>s.responses.written='x'.repeat(3001),s=>s.index=3,s=>s.elapsedSeconds=-1];
  for(const mutate of mutations){const broken=clone(base);mutate(broken);assert.ok(!validMockSession(broken,fixture));}
  const submitted=submit(filled());submitted.initialOutcomes.written.earnedPoints=3;assert.ok(!validMockSession(submitted,fixture));
});

test('wrong-answer report retains evidence and assisted answers without changing original points',()=>{
  let s=filled();s.assisted.diagram=true;s=submit(s);s=applyMockReview(s,'written',review(s,{a:'missing'}));
  const report=mockReportExport(s,{notes:{written:'Remember the starting tissue.'},card:['Mesenchyme -> direct bone.']});
  assert.equal(report.summary.earnedPoints,5.5);assert.equal(report.summary.assisted,1);
  assert.equal(report.questions.find(q=>q.id==='written').response,fixture[2].answer);
  assert.equal(report.notes.written,'Remember the starting tissue.');assert.equal(report.card.length,1);
  assert.equal(report.questions.find(q=>q.id==='written').initialOutcome.status,'pending');
});

test('targeted alternate practice validates against the complete registry without changing Form A',()=>{
  const alternate=mockExam3AllQuestions.find(q=>!mockExam3Questions.some(a=>a.id===q.id));
  if(alternate){const s=createMockSession([alternate],{form:{id:'exam3-targeted',title:'Targeted recall',version:'1'},cardMode:'card'});assert.ok(validMockSession(s));assert.equal(s.maxPoints,alternate.points);}
  assert.equal(mockExam3Questions.length,44);
});

test('learner-confirmed partial credit survives save and export without masquerading as AI',()=>{
  let s=submit(filled());
  const r=createLearnerWrittenReview({question:fixture[2],response:s.responses.written,submissionId:s.submission.id,decisions:{a:'met',b:'missing',c:'met',d:'met'},reason:'Compared against each requirement.',now:210});
  s=applyMockReview(s,'written',r,{now:210});
  assert.ok(validMockSession(clone(s),fixture));assert.equal(mockOutcome(s,fixture[2]).source,'learner');
  const exported=mockReportExport(s).questions.find(q=>q.id==='written');
  assert.equal(exported.outcome.earnedPoints,2.5);assert.equal(exported.review.source,'learner');assert.equal(exported.review.model,'');
  assert.equal(exported.initialOutcome.status,'pending');
});
