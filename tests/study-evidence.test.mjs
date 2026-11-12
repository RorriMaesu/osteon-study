import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {planSettings,dailyRoute,studyItemChapter} from '../src/daily-plan.js';
import {automaticPracticeQuestions,rubricPracticeQuestions,sectionCheckpoint,rubricStudyEvidence} from '../src/study-evidence.js';
import {questions,reviewCards,lessons} from '../src/learning-data.js';
import {createSession} from '../src/exam-core.js';
import {createLearnerWrittenReview} from '../src/written-answer-judge.js';
const empty=()=>({attempts:[],cards:{},lessons:{}});
test('new and legacy plan settings default to chapters10–11 and preserve valid chosen scope',()=>{
 for(const raw of [null,'invalid',JSON.stringify({minutes:15,examDate:'2026-11-20'})])assert.deepEqual(planSettings({getItem:()=>raw}).chapters,[10,11]);
 const saved=planSettings({getItem:()=>JSON.stringify({minutes:30,examDate:'2026-11-20',chapters:[11,10,11,99]})});assert.deepEqual(saved,{minutes:30,examDate:'2026-11-20',chapters:[10,11]});
 assert.deepEqual(planSettings({getItem:()=>JSON.stringify({chapters:[3,4]})}).chapters,[3,4]);
});
test('both exam chapters appear in short checkpoints before and during the final week',()=>{
 for(const date of ['2026-11-11T12:00:00','2026-11-16T12:00:00'])for(const minutes of [10,20]){
  const route=dailyRoute(empty(),{minutes,examDate:'2026-11-20',now:new Date(date).getTime()});assert.ok(route.lesson.id.startsWith('10.')||route.lesson.id.startsWith('11.'));assert.deepEqual(new Set(route.items.map(studyItemChapter)),new Set([10,11]));assert.equal(route.items.length,minutes===10?5:10);assert.ok(route.items.every(q=>q.type!=='written'));
 }
});
test('due cards and weak lesson recommendations obey the selected exam scope',()=>{
 const progress=empty(),now=Date.now(),cards=[3,10,11].map(c=>reviewCards.find(q=>studyItemChapter(q)===c));assert.ok(cards.every(Boolean));cards.forEach((q,i)=>progress.cards[q.id]={due:now-10000+i,interval:0});
 const off=questions.find(q=>q.lesson==='3.1'),inside=questions.find(q=>q.lesson==='11.6');progress.attempts=[{id:off.id,correct:false,at:1},{id:inside.id,correct:false,at:2}];const route=dailyRoute(progress,{now});assert.equal(route.lesson.id,'11.6');assert.deepEqual(route.due.map(studyItemChapter),[10,11]);assert.ok(!route.items.some(q=>q.id===off.id));
 const other=dailyRoute(progress,{chapters:[3],now});assert.equal(studyItemChapter(other.due[0]),3);assert.ok(other.items.every(q=>studyItemChapter(q)===3));
});
test('short checkpoints exclude written rubrics while retaining varied objectives and mistakes',()=>{
 const items=questions.filter(q=>q.lesson==='10.3'),written=rubricPracticeQuestions(items),auto=automaticPracticeQuestions(items);assert.equal(written.length,2);assert.equal(written.length+auto.length,items.length);
 const weak=auto.at(-1),checkpoint=sectionCheckpoint(items,[{id:weak.id,correct:false,at:1}],5);assert.equal(checkpoint.length,5);assert.equal(checkpoint[0].id,weak.id);assert.ok(checkpoint.every(q=>q.type!=='written'));assert.equal(new Set(checkpoint.map(q=>q.id)).size,5);
 assert.deepEqual(sectionCheckpoint(items,[],0),[]);
});
test('rubric progress separates unattempted, pending, local and learner review from retrieval',()=>{
 const q=rubricPracticeQuestions(questions)[0],s=createSession([q]);s.status='submitted';s.submitted=5;s.responses[q.id]='My explanation is saved.';
 assert.equal(rubricStudyEvidence([q],[]).unattempted,1);assert.equal(rubricStudyEvidence([q],[s]).pending,1);
 s.writtenReviews={[q.id]:createLearnerWrittenReview({question:q,response:s.responses[q.id],submissionId:s.id,decisions:{c1:'met',c2:'missing',c3:'met'}})};
 const evidence=rubricStudyEvidence([q],[s]);assert.equal(evidence.selfReviewed,1);assert.equal(evidence.reviewed,0);assert.equal(evidence.pending,0);
 const next=structuredClone(s);next.id='newer';next.submitted=6;next.responses[q.id]='A new original response.';delete next.writtenReviews;assert.equal(rubricStudyEvidence([q],[s,next]).pending,1);
});
test('progress uses the live lesson denominator and automatic question pool',()=>{
 const source=fs.readFileSync(new URL('../src/practice.js',import.meta.url),'utf8');assert.ok(lessons.length>24);assert.ok(source.includes('${lessons.length}'));assert.ok(!source.includes('/24'));assert.match(source,/concepts=retrievalPlan\(automatic,p.attempts\)/);assert.match(source,/WRITTEN EXPLANATIONS/);
});
