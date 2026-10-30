import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {examBank} from '../src/exam-bank.js';
import {questions,lessons,glossary} from '../src/learning-data.js';
import {selectExam,createSession,validSession,gradeQuestion,answered,results,syllabus} from '../src/exam-core.js';
const rng=seed=>()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
test('every source objective has multiple explicit questions, with complete modules and source destinations',()=>{
 assert.equal(syllabus.sections.length,24);assert.equal(syllabus.sections.flatMap(s=>s.objectives).length,74);
 for(const s of syllabus.sections){assert.ok(lessons.find(l=>l.id===s.id)?.syllabus);for(const o of s.objectives)assert.ok(examBank.filter(q=>q.objectives.includes(o.id)).length>=2,o.id);}
 const objectives=new Set(syllabus.sections.flatMap(s=>s.objectives.map(o=>o.id)));
 for(const q of examBank){assert.ok(q.objectives.every(id=>objectives.has(id)&&id.startsWith(q.lesson+'.')),q.id);assert.ok(q.source.includes(q.lesson));assert.ok(q.explanation.length>25);assert.ok(gradeQuestion(q,key(q)),q.id);assert.ok(validSession(createSession([q])),q.id);if(q.type==='match')assert.equal(new Set(q.pairs.map(p=>p.right)).size,q.pairs.length);}
 assert.equal(examBank.length,256);assert.equal(new Set(examBank.map(q=>q.id)).size,256);
 assert.deepEqual(new Set(examBank.map(q=>q.type)),new Set(['choice','text','identify','match','order']));
});
function key(q){return q.type==='match'?Object.fromEntries(q.pairs.map(p=>[p.left,p.right])):q.type==='order'?[...q.steps]:q.answer;}
test('chapter and cumulative blueprints hold across different randomized forms and never truncate to 20',()=>{
 for(let seed=1;seed<=60;seed++)for(const scope of ['6','7','8','9','all']){
  const items=selectExam(scope,examBank,rng(seed)),sections=syllabus.sections.filter(s=>scope==='all'||String(s.chapter)===scope);
  assert.equal(items.length,scope==='all'?100:50);assert.equal(new Set(items.map(q=>q.id)).size,items.length);
  for(const s of sections){const a=items.filter(q=>q.lesson===s.id);assert.ok(a.length,s.id);if(scope!=='all')assert.equal(a.length,s.examWeight,s.id);for(const o of s.objectives)assert.ok(a.some(q=>q.objectives.includes(o.id)),o.id);}
  if(scope==='all')for(const c of [6,7,8,9])assert.equal(items.filter(q=>q.lesson[0]==c).length,25);
 }
 assert.equal(selectExam('bank').length,examBank.length);
 assert.throws(()=>selectExam('6',examBank.filter(q=>q.lesson!=='6.3')),/too few/);
});
test('graders accept explicit synonyms and require every matching or sequence component',()=>{
 const text=examBank.find(q=>q.type==='text'&&q.answer==='Diaphysis');assert.ok(gradeQuestion(text,' DIAPHYSIS. '));assert.ok(gradeQuestion(text,'shaft'));assert.ok(!gradeQuestion(text,'epiphysis'));assert.ok(!gradeQuestion(text,''));assert.ok(!gradeQuestion(text,'the diaphysis or epiphysis'));
 const match=examBank.find(q=>q.type==='match');const response=key(match);delete response[match.pairs[0].left];assert.ok(!answered(match,response));assert.ok(!gradeQuestion(match,response));
 const order=examBank.find(q=>q.type==='order');assert.ok(!answered(order,undefined));assert.ok(!gradeQuestion(order,[...order.steps].reverse()));assert.ok(gradeQuestion(order,order.steps));
 const figure=examBank.find(q=>q.type==='identify');assert.ok(gradeQuestion(figure,figure.answer));assert.ok(!gradeQuestion(figure,'bone'));
});
test('saved sessions retain order, drafts, flags and sticky assistance and reject changed or malformed questions',()=>{
 const items=selectExam('all',examBank,rng(4)),s=createSession(items,{scope:'all',rng:rng(9)});const q=items[0];s.responses[q.id]=key(q);s.flags[q.id]=true;s.assisted[q.id]=true;s.index=3;
 const restored=JSON.parse(JSON.stringify(s));assert.ok(validSession(restored));assert.deepEqual(restored,s);assert.equal(results(restored).independent,0);assert.equal(results(restored).correct,1);assert.equal(results(restored).total,100);
 for(const change of [{version:'old'},{index:100},{ids:[...s.ids,s.ids[0]]},{options:{}}])assert.ok(!validSession({...s,...change}));
 const order=examBank.find(q=>q.type==='order'),bad=createSession([order]);bad.responses[order.id]=[order.steps[0],order.steps[0]];assert.ok(!validSession(bad));
});
test('legacy question and glossary identifiers stay usable, and new glossary has clean source endings',()=>{
 assert.equal(questions.filter(q=>q.id.startsWith('q-')).length,104);assert.ok(questions.some(q=>q.id==='q-6.1-1'));
 assert.deepEqual([6,7,8,9].map(c=>glossary.filter(g=>g.chapter===c).length),[61,176,195,112]);
 for(const g of glossary)assert.ok(!/Chapter Review|Access for free|Key Terms|\ufffd/.test(g.name+' '+g.cue),g.name);
 assert.ok(glossary.find(g=>g.name==='ulnar tuberosity').cue.length<300);
 for(const name of ['long-bone','osteon','vertebra','upper-limb','lower-limb'])assert.ok(fs.readFileSync(new URL('../src/exam-figures.js',import.meta.url),'utf8').includes(name));
});
test('recording a resumed exam does not duplicate existing attempts, and new lesson marks survive backup',async()=>{
 globalThis.localStorage={getItem:()=>null,setItem:()=>{}};globalThis.document=new EventTarget();
 const {recordAttempt,resetProgress,getProgress,markLesson,validProgress}=await import('../src/storage.js');resetProgress();
 const a={id:'ex-6.1-1',topic:'Chapter 6',correct:true,mode:'chapter-exam',attemptKey:'same-session:question'};recordAttempt(a);recordAttempt(a);assert.equal(getProgress().attempts.length,1);recordAttempt({...a,attemptKey:'new-session:question'});assert.equal(getProgress().attempts.length,2);
 markLesson('8.5');markLesson('9.7');assert.ok(validProgress(getProgress()));
});
