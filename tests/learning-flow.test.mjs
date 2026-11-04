import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {examBank} from '../src/exam-bank.js';
import {selectExam,createSession,validSession,gradeQuestion} from '../src/exam-core.js';
import {examFigure} from '../src/exam-figures.js';
import {plates} from '../src/representations.js';
import {readExposure,markExposure,validExposure} from '../src/exam-exposure.js';
import {matchingReaderPages} from '../src/reader.js';
import {validLessonWork,readLessonWork,saveLessonWork,LESSON_WORK_KEY} from '../src/lesson-flow.js';
import {componentFeedback,duplicateMatches} from '../src/exam-feedback.js';
import {createStudyBackup,restoreStudyBackup} from '../src/study-backup.js';
const memory=()=>{const values=new Map();return {getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};};
const rng=seed=>()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};

test('parallel question coverage supports much less repetitive objective-complete chapter retakes',()=>{
 for(const c of ['6','7','8','9']){assert.equal(examBank.filter(q=>q.lesson.startsWith(c+'.')).length,100);for(let seed=1;seed<=60;seed++){const first=selectExam(c,examBank,rng(seed)),seen=new Set(first.map(q=>q.id)),next=selectExam(c,examBank,rng(seed+100),{seen});assert.ok(next.filter(q=>seen.has(q.id)).length<=4,c+' seed '+seed);}}
});
test('source-figure assessments resolve authored points, local assets and mask names in the rendered markup',()=>{
 const source=examBank.filter(q=>q.figure?.startsWith('source:'));assert.ok(source.length>=25);assert.ok(source.some(q=>q.lesson.startsWith('9.')));
 for(const q of source){const p=plates[q.figure.slice(7)];assert.ok(p.points.some(x=>x[0]===q.target),q.id);assert.ok(fs.existsSync(new URL('../assets/figures/'+(p.image||q.figure.slice(7))+'.jpg',import.meta.url)));const html=examFigure(q.figure,q.target);assert.ok(html.includes('<svg'));assert.ok(!html.toLowerCase().includes(q.answer.toLowerCase()),q.id+' leaked name');}
 assert.ok(examFigure('schematic:flexion','A').includes('smaller included elbow angle'));
});
test('revised distractors preserve older frozen option snapshots and their scores',()=>{
 for(const q of examBank.filter(q=>q.legacyDistractors)){const s=createSession([q]);s.options[q.id]=[q.answer,...q.legacyDistractors];s.responses[q.id]=q.legacyDistractors[0];assert.ok(validSession(s),q.id);assert.equal(gradeQuestion(q,s.responses[q.id]),false);s.responses[q.id]=q.answer;assert.equal(gradeQuestion(q,s.responses[q.id]),true);s.options[q.id][1]='unrecognized injected option';assert.equal(validSession(s),false);}
});
test('view exposure persists separately from score and only increments once per question in a session',()=>{
 const storage=memory(),q=examBank[0],s=createSession([q]);assert.equal(markExposure(storage,s,q.id,10),0);assert.equal(markExposure(storage,s,q.id,20),0);assert.equal(readExposure(storage)[q.id].count,1);const next=createSession([q]);assert.equal(markExposure(storage,next,q.id,30),1);assert.equal(next.responses[q.id],undefined);assert.ok(validExposure(readExposure(storage)));assert.ok(validSession(next));
});
test('lesson position and explanation drafts survive complete backup and source-return reloads',()=>{
 const a=memory(),b=memory(),work={step:3,section:2,explore:'figure',figure:1,retrieval:'Central canal → canaliculi → lacuna.',application:''};saveLessonWork(a,'6.3',work);assert.ok(validLessonWork(JSON.parse(a.getItem(LESSON_WORK_KEY))));const saved=readLessonWork(a,'6.3');assert.ok(Number.isFinite(saved.updatedAt));restoreStudyBackup(b,createStudyBackup(a));assert.deepEqual(readLessonWork(b,'6.3'),saved);assert.throws(()=>saveLessonWork(a,'99.1',work));
});
test('reader searches all supplied words within the selected collection and exposes zero matches honestly',()=>{
 assert.equal(matchingReaderPages({query:'zygomatticc'}).length,0);const results=matchingReaderPages({chapter:'6',query:'osteocyte canaliculi'});assert.ok(results.length);assert.ok(results.every(p=>p.chapter===6&&/osteocyte/i.test(p.text)&&/canaliculi/i.test(p.text)));assert.equal(matchingReaderPages({query:'  '}).length,220);
});
test('compound feedback diagnoses partial knowledge without changing whole-question scoring',()=>{
 const q=examBank.find(q=>q.type==='match'),response=Object.fromEntries(q.pairs.map(p=>[p.left,p.right]));response[q.pairs[0].left]=q.pairs[1].right;const feedback=componentFeedback(q,response);assert.equal(feedback.correct,q.pairs.length-1);assert.equal(gradeQuestion(q,response),false);assert.deepEqual(duplicateMatches(q,response),[q.pairs[1].right]);
});
