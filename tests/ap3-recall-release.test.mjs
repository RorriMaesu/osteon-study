import test from 'node:test';
import assert from 'node:assert/strict';
import {chapters,examItems} from '../src/ap3-curriculum.js';
import {makeAssessment,gradeSpring} from '../src/ap3-assessment.js';
import {sectionPractice,springRecoveryCase} from '../src/ap3-recovery-cases.js';
import {recoveryState,recoveryKey,latestSpringDraft} from '../src/ap3-recall.js';
import {springStore} from '../src/ap3-records.js';
import {gradeTermItem} from '../src/term-mock-review.js';
import {makeSpringMock,springExposureKeys} from '../src/term-mock-spring.js';

test('chapter and mock graders preserve ion charges, CD8 markers and compensation direction',()=>{
  const pairs=[
    ['Bicarbonate',['HCO₃⁻','bicarbonate (HCO3-)'],['HCO₃⁺','HCO3+','carbonate (HCO3-)']],
    ['Cytotoxic T cell',['CD8+ T lymphocyte','cytotoxic T cell (CD8+)','CD8-positive T cell'],['CD8- T cell','CD8⁻ T cell','CD8-negative T cell','CD4+ T cell']],
    ['Metabolic acidosis',['metabolic acidosis with respiratory compensation'],['metabolic acidosis with renal compensation','respiratory acidosis with renal compensation','metabolic alkalosis with respiratory compensation']]
  ];
  for(const [expected,yes,no] of pairs){
    const part={type:'term',expected,aliases:[],prompt:'Identify the term.'};
    for(const [samples,credit] of [[yes,true],[no,false]])for(const value of samples){
      assert.equal(gradeSpring({...part,kind:'name'},value),credit?'correct':'incorrect',value);
      assert.equal(gradeTermItem({type:'short',points:1,parts:[part]},[value]).earned,Number(credit),value);
    }
  }
});
test('each section rotates three distinct recall prompts and chapter exam/practical items have a fresh recovery case',()=>{
  for(const s of chapters.flatMap(c=>c.sections)){const cases=sectionPractice(s.id);assert.equal(cases.length,2,s.id);assert.equal(new Set([s.question,...cases.map(q=>q.prompt)]).size,3,s.id);}
  const bank=new Map(examItems.map(q=>[q.id,q]));
  for(const ch of chapters)for(const mode of ['exam','practical']){
    for(let n=0;n<16;n++)for(const q of makeAssessment(ch.id,mode,[],()=>n/16))bank.set(q.id,q);
  }
  for(const q of bank.values()){const fresh=springRecoveryCase(q);assert.ok(fresh,q.id);assert.notEqual(fresh.prompt,q.prompt,q.id);assert.equal(fresh.section,q.section,q.id);}
});
test('new weekly material is independent across forms and chapter exam exposure is removed from new unit MCs',()=>{
  const unitKeys=new Set(),weekly=new Set();
  for(let u=1;u<=4;u++)for(const f of ['A','B','C'])for(const q of makeSpringMock('unit-'+u,f))springExposureKeys(q).forEach(k=>unitKeys.add(k));
  for(let w=1;w<=10;w++)for(const f of ['A','B','C'])for(const q of makeSpringMock('week-'+w,f)){
    for(const key of springExposureKeys(q)){assert.ok(!weekly.has(key),'Repeated weekly '+key);assert.ok(!unitKeys.has(key),'Exposed unit '+key);weekly.add(key);}
  }
  const history=[{mode:'exam',items:examItems}],seen=new Set(examItems.map(q=>q.prompt));
  for(let u=1;u<=4;u++)for(const f of ['A','B','C']){
    const unit=makeSpringMock('unit-'+u,f,history);assert.equal(new Set(unit.map(q=>q.id)).size,unit.length);
    assert.ok(unit.every(q=>!seen.has(q.prompt)));
  }
});
test('separate recovery records and later correct answers resolve a note without changing the submitted snapshot',()=>{
  const store=springStore(),q={...examItems[0],kind:'choice'},run=store.start('exam','21',[q]);store.update(run.id,r=>{r.grades=['incorrect'];r.answers=[(q.answer+1)%3];r.submitted=10;});
  const snapshot=JSON.stringify(store.getRun(run.id)),past=store.getRun(run.id);
  assert.equal(recoveryState(store,past,0,[past]),'');
  assert.equal(recoveryState(store,past,0,[past,{...past,id:'later',submitted:12,grades:['correct']}]),'Correct on a later exam');
  store.write(recoveryKey(run.id,0),{passed:true,firstCorrect:false,attempts:2,at:25});
  assert.equal(recoveryState(store,past,0,[past]),'Recovered in practice');
  const restored=springStore();restored.restore(store.backup());assert.equal(JSON.stringify(restored.getRun(run.id)),snapshot);
  assert.equal(recoveryState(restored,past,0,[past]),'Recovered in practice');
  const d=store.start('exam','22',[q]);store.write('mock:draft',{id:'draft',created:d.created+1,title:'Week 2 check · Form B',form:'B'});
  assert.equal(latestSpringDraft(store).route,'ap3-mocks/take/draft');store.update(d.id,r=>r.index=0);
  store.write('mock:draft',{id:'draft',created:1,title:'Week 2 check · Form B',form:'B'});
  assert.equal(latestSpringDraft(store).route,'ap3-session-'+d.id);
});
