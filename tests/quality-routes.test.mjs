import {createSession,validSession} from '../src/exam-core.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {weightedPractice} from '../src/custom-practice.js';
import {examBank} from '../src/exam-bank.js';
import {dailyRoute,variedQuestions} from '../src/daily-plan.js';
import {blankProgress} from '../src/storage.js';
import {newTutorSession,tutorSessionInstruction,completeTutorTurn} from '../src/tutor-session.js';
import {selectedDistractorFeedback} from '../src/distractor-feedback.js';
import {issueDraft} from '../src/issue-report.js';
import {lessons,questions} from '../src/learning-data.js';

test('custom blueprints honor chapter and section weights, capacities, exposure and uniqueness',()=>{
 const items=weightedPractice(examBank,{6:1,7:2,8:1,9:0},40);assert.equal(items.length,40);assert.equal(new Set(items.map(q=>q.id)).size,40);assert.deepEqual(['6','7','8','9'].map(c=>items.filter(q=>q.lesson.split('.')[0]===c).length),[10,20,10,0]);
 const small=weightedPractice(examBank,{'6.1':1,'9.7':1},100);assert.ok(small.every(q=>['6.1','9.7'].includes(q.lesson)));assert.equal(new Set(small.map(q=>q.id)).size,small.length);
 const seen=Object.fromEntries(examBank.filter(q=>q.lesson.split('.')[0]==='8').slice(0,90).map(q=>[q.id,{count:2,at:1}]));assert.ok(weightedPractice(examBank,{8:1},10,{seen}).every(q=>!seen[q.id]));assert.throws(()=>weightedPractice(examBank,{6:0},5));assert.throws(()=>weightedPractice(examBank,{6:1},NaN));const session=createSession(items);session.timeGoalMinutes='<img src=x onerror=alert(1)>';assert.equal(validSession(session,examBank),false);session.timeGoalMinutes=240;session.confidenceEnabled=true;assert.ok(validSession(session,examBank));session.confidenceEnabled='true';assert.equal(validSession(session,examBank),false);
});
test('daily study uses scored weaknesses and bounds mixed review to the available study time',()=>{
 const p=blankProgress(),weak=questions.find(q=>q.lesson==='9.6'),now=new Date('2026-11-04T12:00:00').getTime();p.attempts=[{id:weak.id,correct:false,at:now-1000},{id:questions.find(q=>q.lesson==='6.1').id,correct:false,selfRated:true,at:now}];
 const ordinary=dailyRoute(p,{minutes:20,chapters:[9],now});assert.equal(ordinary.lesson.id,'9.6');assert.ok(ordinary.items.every(q=>q.lesson==='9.6'));
 const final=dailyRoute(p,{minutes:20,chapters:'all',examDate:'2026-11-08',now});assert.equal(final.mixed,true);assert.equal(final.finalWeek,true);assert.equal(final.items.length,10);assert.equal(new Set(final.items.map(q=>q.lesson.split('.')[0])).size,Math.min(final.items.length,new Set(questions.map(q=>q.lesson.split('.')[0])).size));assert.equal(final.items[0].id,weak.id);assert.equal(new Set(final.items.map(q=>q.id)).size,final.items.length);assert.equal(dailyRoute(p,{examDate:'2026-10-01',now}).finalWeek,false);
 const muscleWeak=questions.find(q=>q.lesson==='11.6'),muscleProgress=blankProgress();muscleProgress.attempts=[{id:muscleWeak.id,correct:false,at:now-1000}];
 const brief=dailyRoute(muscleProgress,{minutes:10,examDate:'2026-11-08',now});assert.equal(brief.lesson.id,'11.6');assert.equal(brief.items.length,5);assert.equal(brief.items[0].id,muscleWeak.id);assert.deepEqual(new Set(brief.items.map(q=>q.lesson.split('.')[0])),new Set(['10','11']));
});
test('repair sets spread objectives rather than filling with near-duplicate items',()=>{
 const l=lessons.find(l=>l.id==='6.3'),items=questions.filter(q=>q.lesson===l.id),set=variedQuestions(items,[],5);assert.equal(set.length,5);assert.equal(new Set(set.map(q=>q.objectives?.[0]||q.lesson)).size,5);
});
test('short tutor sessions count completed turns and request a bounded closing task',()=>{
 let s=newTutorSession('PTH and calcium',3);assert.match(tutorSessionInstruction(s),/reply 1 of 3/);s=completeTutorTurn(s);s=completeTutorTurn(s);assert.match(tutorSessionInstruction(s),/independent retrieval task/);s=completeTutorTurn(s);assert.equal(tutorSessionInstruction(s),'');assert.equal(completeTutorTurn(s).completed,3);assert.throws(()=>newTutorSession('x',99));
});
test('specific distractor explanations cover all revised alternatives and never attach to the key',()=>{
 for(const q of examBank.filter(q=>q.legacyDistractors)){assert.equal(selectedDistractorFeedback(q,q.answer),'');for(const choice of q.distractors)assert.ok(selectedDistractorFeedback(q,choice).length>35,q.id);}
});
test('issue drafts exclude study answers, history and chat and remain a reviewable draft',()=>{
 const draft=issueDraft({id:'ex-6.1-1',title:'Bone classification',reference:'6.1',release:'test',answer:'PRIVATE-ANSWER',chat:'PRIVATE-CHAT',history:'PRIVATE-HISTORY'});assert.ok(draft.body.includes('ex-6.1-1'));assert.doesNotMatch(draft.body,/PRIVATE/);assert.ok(new URL(draft.url).pathname.endsWith('/issues/new'));
});
