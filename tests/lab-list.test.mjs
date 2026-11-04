import test from 'node:test';
import assert from 'node:assert/strict';
import {terms} from '../src/data.js';
import {acceptsAnswer} from '../src/storage.js';
import {labListSource,listEntries,listQuestions,listStats,countQuestions,makeLabRun,validLabRun,labRunSummary} from '../src/lab-list.js';

test('the supplied document reconciles every original lab ID, including paired and numbered structures',()=>{
 assert.equal(labListSource.source.sha256,'eec2b8a522662c508cfde47717c3bd47efe2a720df8d3a5f5f1d48c20340a5e1');
 assert.equal(labListSource.rows.length,152);
 assert.deepEqual(new Set(listEntries().map(x=>x.term.id)),new Set(terms.map(t=>t.id)));
 assert.equal(listEntries().length,177);
 for(const kind of ['metacarpal','metatarsal'])for(let n=1;n<=5;n++)assert.ok(listEntries().some(x=>x.term.id===`${kind}-${n}`));
 for(const id of ['sacrum','coccyx'])assert.deepEqual(listEntries().find(x=>x.term.id===id).rows.map(r=>r.lab),['Lab 6','Lab 7']);
 assert.ok(labListSource.rows.some(r=>r.sourceLabel==='anatomical neck & shaft'&&r.termIds.length===2));
});
test('the dedicated full test includes all 177 entries and all five count blanks without spatially grading held anatomy',()=>{
 const qs=listQuestions();assert.equal(qs.length,182);assert.equal(new Set(qs.map(t=>t.id)).size,182);
 assert.deepEqual(listStats(),{entries:177,questions:182,spatial:173,sourceRecall:2,movement:2,counts:5,shoulder:4});
 for(const id of ['fontanelles','ethmoidal-air-cells-and-sinus-openings']){
  const original=terms.find(t=>t.id===id),q=qs.find(t=>t.id===id);
  assert.equal(original.representation.assessment,'learn-only');assert.equal(q.representation.kind,'list-recall');assert.ok(q.listRecall.prompt);assert.equal(q.representation.points,undefined);
 }
 assert.equal(qs.filter(t=>t.representation.kind==='concept').length,2);
});
test('lab scopes preserve the source exam notes and the repeated axial bones under the pelvis',()=>{
 assert.equal(listQuestions('lab6').length,85);assert.equal(listQuestions('lab7').length,95);assert.equal(listQuestions('shoulder').length,4);
 const shoulder=listQuestions('shoulder').map(t=>t.id),lab7=new Set(listQuestions('lab7').map(t=>t.id));
 assert.ok(shoulder.every(id=>!lab7.has(id)));assert.ok(lab7.has('sacrum')&&lab7.has('coccyx'));
 for(const id of ['ligament-of-head-of-femur','iliofemoral-ligament','anterior-drawer','posterior-drawer','patellar-ligament'])assert.ok(lab7.has(id));
});
test('count answers distinguish regional counts, fusion and the typical coccygeal count',()=>{
 const correct=['7','12','5','5','4'];countQuestions.forEach((q,i)=>{assert.ok(acceptsAnswer(q,correct[i]));assert.ok(!acceptsAnswer(q,'8'));});
 assert.ok(acceptsAnswer(countQuestions[1],'twelve vertebrae'));assert.ok(!acceptsAnswer(countQuestions[0],'12'));
 assert.ok(!acceptsAnswer(countQuestions[4],'3'));assert.ok(!acceptsAnswer(countQuestions[4],'5'));assert.ok(/three to five/.test(countQuestions[4].cue));
 for(const [id,answer]of [['cervical-vertebrae','cervical vertebra'],['optic-canal','optic foramen'],['annulus-fibrosus','annulus fibrosis'],['nucleus-pulposus','nucleus pulposis'],['medial-border-of-scapula','vertebral boarder']])assert.ok(acceptsAnswer(terms.find(t=>t.id===id),answer));
 assert.ok(!acceptsAnswer(terms.find(t=>t.id==='head-of-radius'),'head'));
});
test('saved tests retain exact question order, assisted evidence and honest subset denominators',()=>{
 const qs=listQuestions('lab6').slice(0,10),run=makeLabRun('lab6',qs.map(t=>t.id),1234);
 run.results.push({id:qs[0].id,correct:true,assisted:false,response:qs[0].name,at:1235});
 run.results.push({id:qs[1].id,correct:true,assisted:true,response:qs[1].name,at:1236});run.assisted=true;
 const restored=JSON.parse(JSON.stringify(run));assert.ok(validLabRun(restored));assert.equal(restored.questionIds[restored.results.length],qs[2].id);assert.equal(restored.assisted,true);
 assert.deepEqual(labRunSummary(restored),{answered:2,total:10,independent:1,pending:0,assisted:1,review:[qs[1].id],complete:false});
 for(const changed of [{source:'changed'},{scope:'unknown'},{questionIds:['invented']},{results:[{...run.results[0],id:qs[1].id}]},{questionIds:[qs[0].id,qs[0].id]},{results:[{...run.results[0],correct:'true'}]}])assert.equal(validLabRun({...run,...changed}),false);
 assert.throws(()=>makeLabRun('shoulder',['sacrum']));
});
