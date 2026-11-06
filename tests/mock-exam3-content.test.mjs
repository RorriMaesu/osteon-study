import test from 'node:test';
import assert from 'node:assert/strict';
import {mockExam3Questions as questions, mockExam3Form as form, mockExam3Rotations as rotations,
 mockExam3Coverage as coverage, mockExam3Calibration as calibration, mockExam3AllQuestions,
 mockExam3Lookup, mockExam3Related} from '../src/mock-exam3-bank.js';
import {examBank} from '../src/exam-bank.js';
import {syllabus} from '../src/course-catalog.js';
import {gradeQuestion} from '../src/exam-core.js';
import {assessTyped,outcomeCorrect} from '../src/typed-answer.js';

const question = n => questions.find(q => q.number === n);
const total = values => values.reduce((a,b) => a+b,0);

test('Form A preserves the independently established 44-item/60-point practice blueprint', () => {
 assert.equal(questions.length,44);
 assert.equal(total(questions.map(q=>q.points)),60);
 assert.deepEqual(form.ids,questions.map(q=>q.id));
 assert.deepEqual(form.questionIds,form.ids);
 assert.deepEqual(questions.map(q=>q.number),Array.from({length:44},(_,i)=>i+1));
 assert.deepEqual(['mc','diagram','tf','written'].map(section=>questions.filter(q=>q.section===section).length),[30,9,3,2]);
 assert.deepEqual(['mc','diagram','tf','written'].map(section=>total(questions.filter(q=>q.section===section).map(q=>q.points))),[30,18,6,6]);
 assert.deepEqual([6,7,8,9].map(chapter=>total(questions.filter(q=>q.chapter===chapter).map(q=>q.points))),[19,12,15,14]);
 assert.equal(new Set(mockExam3AllQuestions.map(q=>q.id)).size,mockExam3AllQuestions.length);
 assert.ok(form.formatNotice.includes('actual format is unknown'));
 assert.ok(form.gradingNotice.includes('not your instructor'));
 assert.ok(Object.isFrozen(questions)&&Object.isFrozen(question(43).rubric.criteria));
});

test('mock content remains outside generic sampling and links to real lesson objectives', () => {
 const genericIds=new Set(examBank.map(q=>q.id));
 const objectives=new Set(syllabus.sections.flatMap(section=>section.objectives.map(o=>o.id)));
 const lessons=new Set(syllabus.sections.map(section=>section.id));
 for(const q of mockExam3AllQuestions) {
  assert.equal(genericIds.has(q.id),false,q.id);
  assert.ok(lessons.has(q.lesson),q.id);
  assert.ok(q.objectives.length&&q.objectives.every(id=>objectives.has(id)),q.id);
  assert.ok(q.chapter>=6&&q.chapter<=9,q.id);
  assert.ok(q.explanation.length>=40,q.id);
  assert.ok(q.noteSuggestion.length>12,q.id);
  assert.ok(q.evidence.length&&q.source.includes('OpenStax'),q.id);
  assert.ok(q.sourceLinks.every(source=>new URL(source.url).hostname==='openstax.org'),q.id);
  assert.ok(!/C:\\Users|OneDrive|Tesla/.test(JSON.stringify(q)),q.id);
 }
});

test('all objective alternatives retain one defensible key and the intended conceptual distinctions', () => {
 const expectedLetters=['b','d','a','c','b','a','d','c','a','d','b','c','b','a','d','c','d','b','a','c','d','b','a','c','a','d','b','c','d','b'];
 for(const q of questions.filter(q=>q.type==='choice')) {
  assert.equal(new Set([q.answer,...q.distractors]).size,q.distractors.length+1,q.id);
  assert.equal(q.options.filter(o=>o.text===q.answer).length,1,q.id);
  assert.ok(gradeQuestion(q,q.answer),q.id);
  for(const wrong of q.distractors)assert.equal(gradeQuestion(q,wrong),false,q.id);
  if(q.section==='mc') {
   assert.equal(q.options.length,4,q.id);
   assert.equal(q.options.find(o=>o.id===expectedLetters[q.number-1]).text,q.answer,q.id);
  } else assert.deepEqual(q.options.map(o=>o.text),['True','False']);
 }
 assert.equal(question(40).answer,'False');
 assert.equal(question(41).answer,'True');
 assert.equal(question(42).answer,'False');
 assert.match(question(12).answer,/normal blood calcium does not prove healthy bone stores/);
 assert.match(question(21).answer,/nine flexor tendons/);
 assert.match(question(10).prompt,/supplied Quiz Show and textbook account/);
 assert.match(question(10).explanation,/not complete union/);
});

test('nine packet targets accept the precise structure and reject nearby structures', () => {
 const expected=['Osteon','Parietal bone','Sphenoid bone','Pedicle','Glenoid cavity','Deltoid tuberosity','Acetabulum','Medial malleolus','Synovial membrane'];
 for(let i=0;i<9;i++) {
  const q=question(31+i);
  assert.equal(q.answer,expected[i]);
  assert.equal(q.assetId,`exam3-q${31+i}`);
  assert.equal(q.figure,'packet-exam3');
  assert.equal(q.target,String(31+i));
  assert.equal(q.answerPolicy.allowAnySide,true);
  for(const answer of [q.answer,...q.aliases])assert.ok(outcomeCorrect(assessTyped(q,answer)),`${q.id}: ${answer}`);
  for(const wrong of q.wrongAnswers)assert.equal(outcomeCorrect(assessTyped(q,wrong)),false,`${q.id}: ${wrong}`);
 }
 assert.ok(outcomeCorrect(assessTyped(question(32),'right parietal bone')));
 assert.ok(outcomeCorrect(assessTyped(question(33),'greater wing of the sphenoid')));
 assert.match(question(33).prompt,/bone containing/);
 assert.ok(!question(34).prompt.includes('short bridge'),'Visual question must not supply pedicle definition');
 assert.ok(!question(39).prompt.includes('inner surface'),'Visual question must depend on the marked membrane');
});

test('explicit atomic written components preserve half-credit without hidden requirements', () => {
 for(const q of mockExam3AllQuestions.filter(q=>q.type==='written')) {
  const r=q.rubric;
  assert.equal(r.maxPoints,3,q.id);
  assert.equal(r.modelAnswer,q.answer,q.id);
  assert.equal(total(r.criteria.map(c=>c.points)),3,q.id);
  assert.equal(new Set(r.criteria.map(c=>c.id)).size,r.criteria.length,q.id);
  assert.ok(r.criteria.every(c=>[0.5,1].includes(c.points)&&c.description.length>20),q.id);
 }
 assert.deepEqual(question(43).rubric.criteria.map(c=>c.points),[.5,.5,.5,.5,.5,.5]);
 assert.deepEqual(question(44).rubric.criteria.map(c=>c.points),[.5,.5,.5,.5,1]);
 assert.match(question(44).rubric.criteria.find(c=>c.id==='acl-third').description,/not an extra requirement/);
 assert.match(question(43).rubric.criteria.find(c=>c.id==='im-example').description,/Unqualified skull receives zero/);
 assert.match(question(44).rubric.gradingNotes,/wrong attachment statement alone loses only/);
});

test('source coverage discloses shared questions and includes all seven Bone Questions in rotation', () => {
 assert.equal(coverage.reviewTopics.length,21);
 assert.equal(new Set(coverage.reviewTopics.flatMap(t=>t.questionIds)).size,20);
 assert.equal(coverage.boneQuestions.length,7);
 assert.ok(coverage.reviewTopics.find(t=>t.id==='r3-13').relationship.includes('not whole-bone repeat'));
 assert.ok(coverage.reviewTopics.find(t=>t.id==='r3-09').relationship.includes('side not tested'));
 for(const row of coverage.boneQuestions) {
  assert.ok(row.rotationIds.length);
  for(const id of row.rotationIds)assert.ok(mockExam3Lookup.get(id)?.type==='written',id);
 }
 assert.equal(coverage.boneQuestions.find(row=>row.id==='bq-4').formAQuestionIds.length,0);
 assert.ok(coverage.remainingCoverage.length>=8);
 assert.ok(mockExam3Related('exam3-a-38').some(q=>q.id==='exam3-v-lateral-ankle'));
 assert.ok(mockExam3Related('exam3-a-43').some(q=>q.id==='exam3-v-patella-development'));
 assert.deepEqual(mockExam3Related('missing-question'),[]);
 assert.match(mockExam3Lookup.get('exam3-bq4').prompt,/Do not infer an exact forearm or wrist position/);
 assert.match(mockExam3Lookup.get('exam3-bq7').prompt,/supplied textbook account/);
});

test('human-authored calibration cases include mechanisms, contradictions, injection and held-out paraphrases', () => {
 assert.ok(calibration.length>=18);
 for(const fixture of calibration) {
  const q=mockExam3Lookup.get(fixture.questionId);
  assert.equal(fixture.rubricId,q.rubric.id);
  assert.equal(fixture.rubricVersion,q.rubric.version);
  assert.deepEqual(Object.keys(fixture.expectedPoints),q.rubric.criteria.map(c=>c.id));
  assert.equal(total(Object.values(fixture.expectedPoints)),fixture.expectedScore);
  for(const c of q.rubric.criteria)assert.ok([0,c.points].includes(fixture.expectedPoints[c.id]));
 }
 assert.equal(calibration.find(f=>f.id==='im-missing-processes').expectedScore,2);
 assert.equal(calibration.find(f=>f.id==='im-missing-deposition').expectedScore,2.5);
 assert.equal(calibration.find(f=>f.id==='im-ambiguous-skull').expectedScore,2.5);
 assert.equal(calibration.find(f=>f.id==='knee-names').expectedScore,2);
 assert.equal(calibration.find(f=>f.id==='knee-wrong-link').expectedScore,2.5);
 assert.equal(calibration.find(f=>f.id==='im-prompt-injection').expectedScore,0);
 assert.equal(calibration.find(f=>f.id==='knee-injection').expectedScore,0);
 assert.ok(calibration.filter(f=>f.set==='held-out').length>=4);
 for(let bq=1;bq<=7;bq++) {
  const examples=calibration.filter(f=>f.questionId===`exam3-bq${bq}`);
  assert.equal(examples.length,3,`BQ${bq} needs its own qualified rubric identity`);
  assert.ok(examples.some(f=>f.expectedScore===3));
  assert.ok(examples.some(f=>f.expectedScore===0));
  assert.ok(examples.some(f=>f.expectedScore>0&&f.expectedScore<3));
 }
});
