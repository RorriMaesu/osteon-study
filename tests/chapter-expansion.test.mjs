import test from 'node:test';
import assert from 'node:assert/strict';
import {chapterOf,isLessonId} from '../src/chapters.js';
import {author} from '../src/question-author.js';
import {transferAuthor} from '../src/transfer-author.js';
import {blankProgress,validProgress} from '../src/storage.js';
import {validLessonWork,saveLessonWork,readLessonWork} from '../src/lesson-flow.js';
import {weightedPractice} from '../src/custom-practice.js';
import {bank10} from '../src/bank10.js';
import {selectExam,createSession,validSession,syllabus} from '../src/exam-core.js';
import {assessTyped,outcomeCorrect} from '../src/typed-answer.js';
import {sarcomereGeometry,muscleExamFigure} from '../src/muscle-diagrams.js';
import {crossBridgePermission,tensionTrace} from '../src/muscle-labs.js';

test('multi-digit chapter IDs survive authoring and weighted practice',()=>{
 assert.equal(chapterOf('10.9'),'10');assert.equal(chapterOf('6.3'),'6');assert.equal(chapterOf('bad'),'');
 assert.ok(isLessonId('10.9'));for(const id of ['10.0','10.10','1.8','__proto__','10.1.1'])assert.ok(!isLessonId(id));
 for(const make of [author,transferAuthor]){const a=make();a.t('10.2',1,'Name the covering.','Epimysium',[],'The outer covering surrounds the whole muscle.');assert.equal(a.items[0].topic,'Chapter 10');assert.equal(a.items[0].objectives[0],'10.2.1');assert.equal(weightedPractice(a.items,{10:1},1)[0].id,a.items[0].id);}
});
test('Chapter 10 and comprehensive forms cover every assigned objective; old scope is retained',()=>{
 assert.equal(bank10.length,120);
 for(let i=0;i<20;i++)for(const scope of ['10','all10','all']){
  const form=selectExam(scope);assert.equal(form.length,scope==='10'?50:scope==='all'?100:150);assert.equal(new Set(form.map(q=>q.id)).size,form.length);
  if(scope==='all'){assert.ok(form.every(q=>Number(chapterOf(q.lesson))<=9));continue;}
  const relevant=syllabus.sections.filter(s=>scope==='all10'?[6,7,8,9,10].includes(s.chapter):s.chapter===10);
  for(const s of relevant)for(const o of s.objectives)assert.ok(form.some(q=>q.objectives.includes(o.id)),o.id);
  assert.ok(validSession(JSON.parse(JSON.stringify(createSession(form,{scope})))));
 }
});
test('muscle terminology preserves spelling credit without merging different structures',()=>{
 const term=answer=>bank10.find(q=>q.answer===answer);
 assert.equal(assessTyped(term('Epimysium'),'epimysum').status,'spelling');
 for(const [a,b]of [['Epimysium','Perimysium'],['Troponin','Tropomyosin'],['Sarcolemma','Sarcoplasm'],['Sarcomere','Myofibril'],['Calmodulin','Troponin']])assert.ok(!outcomeCorrect(assessTyped(term(a),b)),a+' vs '+b);
});
test('sarcomere geometry preserves filament and A-band length during shortening',()=>{
 const rest=sarcomereGeometry(0),short=sarcomereGeometry(1);assert.equal(rest.aBand,short.aBand);assert.equal(rest.thinLength,short.thinLength);assert.ok(short.length<rest.length);assert.ok(short.iBand<rest.iBand);assert.ok(short.hZone<rest.hZone);
 for(const q of bank10.filter(q=>q.figure))assert.ok(muscleExamFigure(q.figure,q.target)?.includes('<svg'),q.id);
});
test('physiology controls keep energy, timing and recruitment distinct',()=>{
 assert.ok(crossBridgePermission(0,{calcium:false}));assert.ok(crossBridgePermission(3,{atp:false}));assert.ok(crossBridgePermission(4,{atp:false}));assert.equal(crossBridgePermission(2,{atp:true,calcium:true}),'');
 const low=tensionTrace('summation',1),high=tensionTrace('summation',5);assert.deepEqual(low.pulses,high.pulses);assert.ok(high.points.some((p,i)=>p[1]>low.points[i][1]));
 const treppe=tensionTrace('treppe');for(let j=0;j<4;j++)assert.ok(treppe.points.some(([t,f])=>t>treppe.pulses[j]+.51&&t<treppe.pulses[j+1]&&f===0));
 assert.ok(tensionTrace('fused').pulses.length>tensionTrace('unfused').pulses.length);
});
test('Chapter 10 drafts and progress round-trip alongside older lessons',()=>{
 const p=blankProgress();p.lessons={'6.3':true,'10.9':true};assert.ok(validProgress(p));p.lessons['10.10']=true;assert.ok(!validProgress(p));
 const map=new Map(),storage={getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)};
 const work={step:3,section:0,figure:0,explore:'activity',retrieval:'My prediction',application:''};
 saveLessonWork(storage,'6.3',work);saveLessonWork(storage,'10.9',work);assert.ok(validLessonWork(JSON.parse([...map.values()][0])));assert.equal(readLessonWork(storage,'10.9').retrieval,'My prediction');assert.equal(readLessonWork(storage,'6.3').retrieval,'My prediction');
});
