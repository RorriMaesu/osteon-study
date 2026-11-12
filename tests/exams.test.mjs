import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import fracture from '../src/fracture-lab-data.json' with {type:'json'};
import {examFigure} from '../src/exam-figures.js';
import {examBank} from '../src/exam-bank.js';
import {questions,lessons,glossary} from '../src/learning-data.js';
import {selectExam,createSession,validSession,gradeQuestion,answered,results,syllabus} from '../src/exam-core.js';
import links from '../src/lesson-links.json' with {type:'json'};
import pages from '../src/reader-pages.json' with {type:'json'};
import chapter11Pages from '../src/chapter11-reader.json' with {type:'json'};
import {regions} from '../src/data.js';
import {retrieveSources,buildTutorMessages} from '../src/tutor-context.js';
const rng=seed=>()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
test('every source objective has multiple explicit questions, with complete modules and source destinations',()=>{
 const original=syllabus.sections.filter(s=>s.chapter>=6);assert.equal(original.length,39);assert.equal(original.flatMap(s=>s.objectives).length,121);
 for(const s of syllabus.sections){assert.ok(lessons.find(l=>l.id===s.id)?.syllabus);for(const o of s.objectives)assert.ok(examBank.filter(q=>q.objectives.includes(o.id)).length>=2,o.id);}
 const objectives=new Set(syllabus.sections.flatMap(s=>s.objectives.map(o=>o.id)));
 for(const q of examBank){assert.ok(q.objectives.every(id=>objectives.has(id)&&id.startsWith(q.lesson+'.')),q.id);assert.ok(q.source.includes(q.lesson));assert.ok(q.explanation.length>25);assert.ok(gradeQuestion(q,key(q)),q.id);assert.ok(validSession(createSession([q])),q.id);if(q.type==='match')assert.equal(new Set(q.pairs.map(p=>p.right)).size,q.pairs.length);}
 assert.equal(examBank.filter(q=>Number(q.lesson.split('.')[0])>=6&&Number(q.lesson.split('.')[0])<=10&&!q.id.startsWith('fracture-')&&!q.id.startsWith('mx-')&&!q.id.startsWith('ma-')).length,520);assert.equal(new Set(examBank.map(q=>q.id)).size,examBank.length);
 assert.deepEqual(new Set(examBank.map(q=>q.type)),new Set(['choice','text','identify','match','order','multi','written']));
});
test('foundations exams sample both chapters, and select-all wording survives a saved draft',()=>{
 for(const scope of ['1','2','foundations12']){
  const items=selectExam(scope,examBank,rng(128));
  assert.equal(items.length,50);
  const chapters=scope==='foundations12'?[1,2]:[Number(scope)];
  for(const section of syllabus.sections.filter(s=>chapters.includes(s.chapter)))for(const goal of section.objectives)assert.ok(items.some(q=>q.objectives.includes(goal.id)),goal.id);
 }
 const question=examBank.find(q=>q.type==='multi'&&q.wordings?.length&&q.correctChoices.length>1);
 assert.ok(question);
 const draft=createSession([question],{rng:()=>0.9});
 draft.responses[question.id]=question.correctChoices.slice(1);
 assert.ok(validSession(JSON.parse(JSON.stringify(draft))));
 assert.ok(draft.wording[question.id]>0);
 assert.ok(!gradeQuestion(question,draft.responses[question.id]));
 assert.ok(gradeQuestion(question,[...question.correctChoices].reverse()));
});
test('cell and tissue exams cover each objective and preserve the full-bank session',()=>{
 for(const scope of ['3','4']){
  const items=selectExam(scope,examBank,rng(180));
  assert.equal(items.length,50);
  for(const section of syllabus.sections.filter(s=>s.chapter===Number(scope)))for(const goal of section.objectives)assert.ok(items.some(q=>q.objectives.includes(goal.id)),goal.id);
 }
 const bankSession=createSession(examBank,{scope:'bank',mode:'practice'});
 assert.ok(validSession(JSON.parse(JSON.stringify(bankSession))));
});
test('skin and expanded cumulative forms include every assigned chapter objective',()=>{
 for(const [scope,chapterIds,size] of [['5',[5],50],['foundations35',[3,4,5],90],['course1to10',[1,2,3,4,5,6,7,8,9,10],300]]){
  const items=selectExam(scope,examBank,rng(280));
  assert.equal(items.length,size);
  for(const section of syllabus.sections.filter(s=>chapterIds.includes(s.chapter)))for(const goal of section.objectives)assert.ok(items.some(q=>q.objectives.includes(goal.id)),goal.id);
 }
 assert.deepEqual(examBank.filter(q=>q.figure==='foundation:skin').map(q=>q.target),['A','B','C']);
});
test('fracture lab preserves all 84 families, original study cases and legible figures',()=>{
 const items=examBank.filter(q=>q.id.startsWith('fracture-'));
 assert.equal(items.length,252);
 assert.equal(fracture.written.length,84);
 assert.equal(new Set(items.map(q=>q.family)).size,84);
 for(const q of items.filter(q=>q.figure))assert.ok(examFigure(q.figure,q.target).includes('<svg'),q.id);
 for(const q of fracture.written)assert.equal(q.rubric.length,2);
});
function key(q){return q.type==='multi'?[...q.correctChoices]:q.type==='match'?Object.fromEntries(q.pairs.map(p=>[p.left,p.right])):q.type==='order'?[...q.steps]:q.answer;}
test('chapter and cumulative blueprints hold across different randomized forms and never truncate to 20',()=>{
 for(let seed=1;seed<=60;seed++)for(const scope of ['6','7','8','9','all']){
  const items=selectExam(scope,examBank,rng(seed)),sections=syllabus.sections.filter(s=>(scope==='all'&&s.chapter>=6&&s.chapter<=9)||String(s.chapter)===scope);
  assert.equal(items.length,scope==='all'?100:50);assert.equal(new Set(items.map(q=>q.id)).size,items.length);
  for(const s of sections){const a=items.filter(q=>q.lesson===s.id);assert.ok(a.length,s.id);if(scope!=='all')assert.equal(a.length,s.examWeight,s.id);for(const o of s.objectives)assert.ok(a.some(q=>q.objectives.includes(o.id)),o.id);}
  if(scope==='all')for(const c of [6,7,8,9])assert.equal(items.filter(q=>q.lesson[0]==c).length,25);
 }
 assert.equal(selectExam('bank').length,examBank.length);
 assert.throws(()=>selectExam('6',examBank.filter(q=>q.lesson!=='6.3')),/too few/);
});
test('graders accept explicit synonyms and require every matching or sequence component',()=>{
 const text=examBank.find(q=>q.type==='text'&&q.answer==='Diaphysis');assert.ok(gradeQuestion(text,' DIAPHYSIS. '));assert.ok(gradeQuestion(text,'shaft'));assert.ok(!gradeQuestion(text,'epiphysis'));assert.ok(!gradeQuestion(text,''));assert.ok(!gradeQuestion(text,'the diaphysis or epiphysis'));
 const hip=examBank.find(q=>q.prompt==='Which three fused regions contribute to the acetabulum?');for(const a of ['the ilium, ischium, and pubis','Pubis, ilium and ischium','ischium pubis ilium'])assert.ok(gradeQuestion(hip,a));assert.ok(!gradeQuestion(hip,'Ilium, ischium and femur'));
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
test('every lesson anatomy route exists and every direct figure link resolves its actual source caption',()=>{
 assert.deepEqual(Object.keys(links),lessons.filter(l=>Number(l.id.split('.')[0])>=6).map(l=>l.id));let figures=0;
 const sourcePages=[...pages,...chapter11Pages];
 for(const [id,l] of Object.entries(links)){assert.ok(regions.includes(l.region)||(['10.7','10.8','10.9'].includes(id)&&l.region===null),id);for(const f of l.figures){figures++;const page=sourcePages.find(p=>p.pdf===f.pdf);assert.ok(page);assert.ok(new RegExp('FIGURE\\s+'+f.number.replace('.','\\.')+'\\s').test(page.text),id+' figure '+f.number);}}
 assert.ok(figures>=159);const all=new Set(sourcePages.filter(p=>[6,7,8,9,10,11].includes(p.chapter)).flatMap(p=>[...p.text.matchAll(/FIGURE\s+(\d+\.\d+)\s/g)].map(m=>m[1])));assert.deepEqual(new Set(Object.values(links).flatMap(l=>l.figures.map(f=>f.number))),all);
});
test('the local tutor retrieves original notes for the development sections and expanded course',()=>{
 assert.ok(retrieveSources('apical ectodermal ridge limb buds',{reference:'8.5'}).some(s=>s.reference==='8.5'&&/apical/i.test(s.text)));
 assert.ok(retrieveSources('joint interzone cavity mesenchyme capsule',{reference:'9.7'}).some(s=>s.reference==='9.7'&&/interzone/i.test(s.text)));
 const early=buildTutorMessages('Explain membrane diffusion',[],{type:'reading',pdf:104,text:'RAW_TEXTBOOK_TEST_SENTINEL'});
 assert.ok(early.sources.some(s=>s.reference==='3.1'));
 assert.ok(!early.messages[0].content.includes('RAW_TEXTBOOK_TEST_SENTINEL'));
 assert.ok(buildTutorMessages('Explain a joint interzone',[],{reference:'9.7'}).messages[0].content.includes('chapters 1–11'));
});
test('recording a resumed exam does not duplicate existing attempts, and new lesson marks survive backup',async()=>{
 globalThis.localStorage={getItem:()=>null,setItem:()=>{}};globalThis.document=new EventTarget();
 const {recordAttempt,resetProgress,getProgress,markLesson,validProgress}=await import('../src/storage.js');resetProgress();
 const a={id:'ex-6.1-1',topic:'Chapter 6',correct:true,mode:'chapter-exam',attemptKey:'same-session:question'};recordAttempt(a);recordAttempt(a);assert.equal(getProgress().attempts.length,1);recordAttempt({...a,attemptKey:'new-session:question'});assert.equal(getProgress().attempts.length,2);
 markLesson('8.5');markLesson('9.7');assert.ok(validProgress(getProgress()));
});
