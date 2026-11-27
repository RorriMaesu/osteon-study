import test from 'node:test';
import assert from 'node:assert/strict';
import {bank,submitDraft} from '../src/ap2-exam-core.js';
import {sections} from '../src/ap2-library.js';
import {newRecords,validAP2Records} from '../src/ap2-records.js';
import {nextRecovery,nextWinterSection} from '../src/ap2-recall.js';
import {recoveryCase} from '../src/ap2-recovery-cases.js';
import {makeWinterMock,winterExposureKeys,winterScopes} from '../src/term-mock-winter.js';
import {makeWeekCheck} from '../src/term-week-checks.js';
import {termExamWeeks} from '../src/term-exam-weeks.js';

test('each independently administered winter exam item has a different application prompt',()=>{
  for(const q of bank.filter(q=>q.pool!=='recall')){
    const activity=recoveryCase(q);
    assert.ok(activity,q.id);
    assert.notEqual(activity.prompt,q.prompt,q.id);
    assert.equal(new Set(activity.choices).size,3,q.id);
    assert.ok(activity.choices[activity.answer],q.id);
  }
});

test('a fresh spatial summation case resolves a specific miss and leaves the original report intact',()=>{
  const r=newRecords(),q=bank.find(q=>q.id==='ap2-12.5-two-inputs');
  for(const s of sections)for(let i=0;i<s.questions.length;i++){
    r.checks['ap2-'+s.id+'-q'+(i+1)]={section:s.id,correct:true,at:1};
  }
  function miss(id,time){
    r.draft={id,title:'Chapter 12',scope:'12',started:time,index:0,items:[structuredClone(q)],responses:{}};
    r.draft.responses[q.id]=String((q.answer+1)%q.choices.length);
    submitDraft(r,id,time+1);
  }
  miss('first',2);
  const original=structuredClone(r.reports[0]);
  assert.equal(nextWinterSection(r).id,'12.5');
  const activity=nextRecovery(r).activity;
  assert.equal(activity.choices[activity.answer],'Spatial summation');
  r.recoveries={first:{[q.id]:{first:false,attempts:1,passed:false}}};
  assert.equal(nextRecovery(r).q.id,q.id);
  Object.assign(r.recoveries.first[q.id],{attempts:2,passed:true});
  assert.equal(nextRecovery(r),null);
  assert.equal(nextWinterSection(r),undefined);
  assert.equal(validAP2Records(JSON.parse(JSON.stringify(r))),true);
  assert.deepEqual(r.reports[0],original);
  miss('second',5);
  assert.equal(nextRecovery(r).reportId,'second');
  assert.equal(r.recoveries.first[q.id].first,false);
  assert.deepEqual(r.reports[1],original);
});

const forms=['A','B','C'],units=winterScopes.filter(s=>s.id.startsWith('unit-'));
const standards=new Map(units.flatMap(s=>forms.map(f=>[s.id+f,makeWinterMock(s.id,f)])));
test('every winter weekly form has independent prompts and stimuli from every unit form',()=>{
  const fixed=new Set([...standards.values()].flatMap(items=>items.flatMap(winterExposureKeys)));
  for(const w of termExamWeeks.ap2.filter(w=>w.sections.length))for(const f of forms){
    const weekly=makeWeekCheck('ap2',w.week,f,winterScopes,makeWinterMock);
    for(const q of weekly)for(const key of winterExposureKeys(q))assert.ok(!fixed.has(key),q.prompt);
  }
});

test('fresh units avoid content a learner encountered in the original weekly banks on all forms',()=>{
  // Reproduce the original weekly selector on its original unit banks.
  const history=termExamWeeks.ap2.filter(w=>w.sections.length).flatMap(w=>forms.map(f=>{
    const pool=units.flatMap(s=>standards.get(s.id+f));
    const old=makeWeekCheck('ap2',w.week,f,winterScopes,()=>pool);
    return {scope:'week-'+w.week,items:old};
  }));
  const previous=structuredClone(history);
  const exposed=new Set(history.flatMap(r=>r.items.flatMap(winterExposureKeys)));
  for(const s of units)for(const f of forms){
    const queried=makeWinterMock(s.id,f,history);
    assert.equal(queried.length,44);
    assert.equal(queried.reduce((n,q)=>n+q.points,0),60);
    assert.equal(new Set(queried.map(q=>q.id)).size,44);
    for(const q of queried)assert.ok(!winterExposureKeys(q).some(k=>exposed.has(k)),s.id+'/'+f+' '+q.prompt);
  }
  assert.deepEqual(history,previous);
});
