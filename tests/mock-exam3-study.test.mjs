import test from 'node:test';
import assert from 'node:assert/strict';
import {mockExam3Questions,mockExam3Rotations} from '../src/mock-exam3-bank.js';
import {chooseMockPractice,mockStudyPriorities,mockReportRoute,parseMockReportRoute} from '../src/mock-exam3-study.js';

test('ossification retest chooses changed wording instead of the verbatim Bone Question copy',()=>{
  const q=mockExam3Questions.find(q=>q.number===43);
  const selected=chooseMockPractice(q,[{questions:[q],submitted:10}]);
  assert.equal(selected.kind,'new');assert.notEqual(selected.question.prompt,q.prompt);
  assert.notEqual(selected.question.id,'exam3-bq6');
});

test('already seen variants and exact repetitions are labeled honestly',()=>{
  const q=mockExam3Questions.find(q=>q.number===43);
  assert.equal(chooseMockPractice(q,[{questions:[q,...mockExam3Rotations],submitted:10}]).kind,'revisit');
  const knee=mockExam3Questions.find(q=>q.number===44);
  const repeated=chooseMockPractice(knee,[]);
  assert.equal(repeated.kind,'repeat');assert.equal(repeated.question.id,knee.id);
});

test('practice chooses an unseen variant first, then the least recently seen changed example',()=>{
  const q={id:'base',prompt:'Name the original structure.'},a={id:'a',prompt:'What restrains motion?'},b={id:'b',prompt:'Which attachment is involved?'};
  const related=()=>[a,b];
  assert.equal(chooseMockPractice(q,[{questions:[a],submitted:20}],{related}).question.id,'b');
  assert.equal(chooseMockPractice(q,[{questions:[a],submitted:20},{questions:[b],submitted:10}],{related}).question.id,'b');
  assert.equal(chooseMockPractice(q,[],{related,exclude:['a','b','base']}),null);
});

test('study priorities rank confirmed missed points without treating pending points as wrong',()=>{
  const row=(lesson,missed,pending,assisted=false)=>({q:{id:lesson+missed,lesson,chapter:Number(lesson[0]),topic:'Topic '+lesson},assisted,outcome:{maxPoints:3,earnedPoints:3-missed-pending,pendingPoints:pending}});
  const result=mockStudyPriorities({rows:[row('6.4',.5,2.5),row('9.4',2,0),row('8.1',0,3),row('7.2',0,0,true)]});
  assert.deepEqual(result.map(r=>r.lesson),['9.4','6.4','7.2']);
  assert.equal(result[1].missedPoints,.5);assert.equal(result[1].pendingPoints,2.5);
  assert.equal(result[2].missedPoints,0);assert.equal(result[2].assisted,1);
});

test('each saved report has a round-trippable route; malformed routes cannot select a report',()=>{
  const id='1793995966571-abc123';
  assert.equal(parseMockReportRoute(mockReportRoute(id)),id);
  for(const route of ['exam3-results','exam3-results/%zz','exam3-results/','exam3-results/a/b','exam3-results/'+ 'a'.repeat(161)])assert.equal(parseMockReportRoute(route),null);
});
