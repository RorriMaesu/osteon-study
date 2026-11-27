import test from 'node:test';
import assert from 'node:assert/strict';
import {createRecordsStore} from '../src/ap2-records.js';
import {springStore} from '../src/ap3-records.js';
import {courseMockStore,validTermRun} from '../src/term-mock-records.js';
import {makeSpringMock,springScopes} from '../src/term-mock-spring.js';
import {makeWinterMock,winterScopes} from '../src/term-mock-winter.js';
import {gradeTermItem,confirmTermWritten,scoreTermAttempt,confirmTermMeaning,termWrittenFixtures,termNotes} from '../src/term-mock-review.js';
import {interpretWrittenReview,compactWrittenQualification,WRITTEN_PROMPT_VERSION} from '../src/written-answer-judge.js';
import {createStudyBackup,restoreStudyBackup} from '../src/study-backup.js';

function storage(){
  const m=new Map();
  return {get length(){return m.size;},key:i=>[...m.keys()][i],getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)};
}
const choice={type:'choice',section:'19.4',prompt:'What is EDV minus ESV?',choices:['Stroke volume','Heart rate'],answer:0,why:'Subtracting end-systolic volume gives the volume ejected.',id:'heart-sv',points:1};
test('older backups, frozen attempts, later rubric decisions and both course backup entry points',()=>{
  const from=storage(), to=storage(), older=createStudyBackup(from);
  const winter=courseMockStore('ap2',createRecordsStore(from)),spring=springStore(from),mocks=courseMockStore('ap3',spring);
  const spec={scope:'all',form:'A',mode:'independent',title:'Cumulative mock'};
  const w=winter.start({...spec,items:[choice]});
  winter.update(w.id,'draft',d=>{d.answers[choice.id]='0';d.flags[choice.id]=true;});
  const writing=makeSpringMock('unit-3','A').filter(q=>q.type==='written')[0],s=mocks.start({...spec,items:[writing]});
  const text='More water is reabsorbed.';
  mocks.update(s.id,'draft',d=>{d.answers[writing.id]=text;d.grades={[writing.id]:gradeTermItem(writing,text)};d.submitted=Date.now();});
  const original=JSON.stringify(mocks.get(s.id).grades);
  mocks.update(s.id,'draft',d=>{d.answers[writing.id]='late edit';});
  assert.equal(mocks.get(s.id).answers[writing.id],text);
  assert.equal(scoreTermAttempt(mocks.get(s.id)).pending,3);
  const decisions=Object.fromEntries(writing.rubric.criteria.map((k,i)=>[k.id,i===0?'met':'missing']));
  mocks.update(s.id,'submitted',d=>{d.reviews[writing.id]={confirmed:confirmTermWritten(writing,text,s.id,decisions)};});
  const snapshot=mocks.get(s.id);
  assert.equal(JSON.stringify(snapshot.grades),original);
  assert.equal(scoreTermAttempt(snapshot).earned,1);
  restoreStudyBackup(to,JSON.parse(JSON.stringify(createStudyBackup(from))));
  assert.equal(courseMockStore('ap2',createRecordsStore(to)).get(w.id).flags[choice.id],true);
  const springCopy=courseMockStore('ap3',springStore(to));
  assert.deepEqual(springCopy.get(s.id),snapshot);
  restoreStudyBackup(to,older);
  assert.deepEqual(springCopy.get(s.id),snapshot);
  const independent=springStore(storage());
  assert.equal(independent.restore(JSON.parse(JSON.stringify(spring.backup()))),1);
  assert.deepEqual(independent.mocks()[0],snapshot);
  assert.equal(independent.restore(spring.backup()),0);
  assert.equal(validTermRun({...snapshot,course:'ap2'},'ap2'),false);
});

function submitted(course,items,answers={}){
  return {course,id:'mock-saved',version:1,scope:'all',form:'A',mode:'independent',title:'Saved mock',
    created:100,submitted:120,index:0,items,answers,flags:{},assisted:{},reviews:{},
    grades:Object.fromEntries(items.map(q=>[q.id,gradeTermItem(q,answers[q.id])]))};
}

test('all published complete and partly answered forms validate without rescoring stored answers',()=>{
  for(const [course,scopes,make] of [['ap2',winterScopes,makeWinterMock],['ap3',springScopes,makeSpringMock]]){
    for(const scope of scopes)for(const form of ['A','B','C']){
      const items=make(scope.id,form);
      const answers=Object.fromEntries(items.map(q=>[q.id,q.type==='written'?'  My answer.  ':q.parts?q.parts.map((p,j)=>
        j===1?'':p.type==='choice'?String(p.answer):p.type==='surface'?p.order[0]:'Sample wording'):String(q.answer)]));
      const record={...submitted(course,items,answers),scope:scope.id,form};
      assert.ok(validTermRun(record,course),course+' '+scope.id+' '+form);
      assert.ok(validTermRun(submitted(course,items),course),'unanswered snapshot');
    }
  }
});

test('backup import rejects invalid grades, absent grade parts, stale responses, bad jobs and malformed cues atomically',()=>{
  const writing=makeSpringMock('unit-3','A').find(q=>q.rubric?.fixtures);
  const surface=makeSpringMock('practical','A').find(q=>q.parts.some(p=>p.type==='surface'));
  const topChoice=makeSpringMock('unit-3','A')[0];
  const q=writtenRecord();
  function writtenRecord(){
    const record=submitted('ap3',[writing,surface,topChoice],{[writing.id]:'Vasopressin rises.',[topChoice.id]:String(topChoice.answer)});
    const decisions=Object.fromEntries(writing.rubric.criteria.map((c,i)=>[c.id,i===0?'met':'missing']));
    record.reviews[writing.id]={confirmed:confirmTermWritten(writing,record.answers[writing.id],record.id,decisions)};
    record.queue=[{kind:'written',item:writing.id},{kind:'calibrate',item:writing.id,index:0}];
    const n=termNotes(record)[0];
    record.cues={[n.id]:{basis:n.basis,model:'local:4b',coaching:'Explain how permeability changes water retention.'}};
    return record;
  }
  assert.ok(validTermRun(q,'ap3'));
  const entries=[
    r=>{r.items[0].section=25.8;},r=>{r.items[0].rubric.criteria[0]=null;},
    r=>{r.answers[topChoice.id]='0.1';},r=>{r.answers[surface.id]=['foreign-surface', '0','0'];},
    r=>{r.grades[topChoice.id].earned=99;},r=>{r.grades['unknown']=r.grades[topChoice.id];},
    r=>{r.grades[surface.id].parts=[];},r=>{r.grades[writing.id].parts[0].earned=-1;},
    r=>{r.grades[writing.id].parts[0].response='Not my frozen answer.';},
    r=>{r.grades[writing.id].parts[0].expected='different rubric criterion';},
    r=>{r.grades[topChoice.id].status='incorrect';}, r=>{r.grades[topChoice.id].parts[0].possible=7;},
    r=>{r.reviews[writing.id].confirmed.submissionId='another-attempt';},
    r=>{r.reviews[writing.id].confirmed.components[0].id='unrecognized';},
    r=>{r.reviews[writing.id].confirmed.response=undefined;delete r.answers[writing.id];},
    r=>{r.queue=[{kind:'meaning',item:writing.id,index:0}];},
    r=>{r.queue=[{kind:'written',item:'missing'}];},r=>{r.queue=[r.queue[0],r.queue[0]];},
    r=>{r.queue=[{kind:'note',item:writing.id,index:-1}];},r=>{r.queue={};},
    r=>{r.cues={'foreign/0':Object.values(r.cues)[0]};},
    r=>{Object.values(r.cues)[0].coaching={};}, r=>{Object.values(r.cues)[0].basis=[];}
  ];
  const spring=springStore(storage());
  spring.write('mock:'+q.id,q);
  for(const mutate of entries){
    const altered=structuredClone(q);mutate(altered);
    assert.equal(validTermRun(altered,'ap3'),false,mutate.toString());
    assert.throws(()=>spring.restore({course:'ap3',version:1,records:{'mock:mock-saved':altered}}));
    assert.deepEqual(spring.mocks(),[q]);
  }
  const device=storage(),source=storage(),winter=courseMockStore('ap2',createRecordsStore(source));
  const draft=winter.start({scope:'all',form:'A',mode:'independent',title:'Winter',items:[choice]});
  const backup=createStudyBackup(source),bad=structuredClone(backup);
  bad.ap2.mockRuns[draft.id].answers[choice.id]='2';
  assert.throws(()=>restoreStudyBackup(device,bad));
  assert.equal(device.length,0);
});

test('both real pilot rubrics preserve qualified reviews, audit invalid quotes and reject forged model identity',()=>{
  for(const [course,make,scope] of [['ap2',makeWinterMock,'unit-4'],['ap3',makeSpringMock,'unit-3']]){
    const item=make(scope,'A').find(q=>q.rubric?.fixtures);
    const question={...item,answer:item.why}, fixtures=termWrittenFixtures(item);
    assert.ok(fixtures.length>=3);
    const endpoint='http://127.0.0.1:11434',model='model:local',modelEntry={name:model,digest:'fixed-digest'};
    function review(f,submissionId){
      const components=item.rubric.criteria.map(c=>({id:c.id,decision:f.expectedPoints[c.id]?'met':'missing',
        evidence:f.expectedPoints[c.id]?[f.response]:[],reason:'Checked against the rubric.'}));
      return interpretWrittenReview({components,feedback:'Reviewed.',studyNote:''},{question,response:f.response,submissionId,
        endpoint,model,modelIdentity:endpoint+'|'+model+'|fixed-digest'});
    }
    const cases=fixtures.map(f=>({id:f.id,review:review(f,'calibration-'+f.id)}));
    const qualification=compactWrittenQualification({promptVersion:WRITTEN_PROMPT_VERSION,cases},fixtures,[question]);
    const record=submitted(course,[item],{[item.id]:fixtures[0].response});
    record.reviews[item.id]={written:{...review(fixtures[0],record.id),qualification,modelEntry}};
    assert.ok(validTermRun(record,course));
    const wrong=structuredClone(record);
    wrong.reviews[item.id].written.components[0].evidence=['fabricated quote'];
    assert.equal(validTermRun(wrong,course),false);
    record.reviews[item.id].written.modelEntry.digest='other weights';
    assert.equal(validTermRun(record,course),false);
  }
});

test('a manual terminology decision and queued local meaning review bind to their frozen term and part',()=>{
  const q={id:'ap2-flow',type:'short',points:2,section:'20.1',prompt:'Identify the vessel.',why:'Veins return blood toward the heart.',
    parts:[{type:'term',prompt:'Which vessel returns blood?',expected:'vein'},{type:'number',prompt:'Give output in L/min.',expected:'5.25',unit:'L/min'}]};
  const raw='the vessel returning blood',r=submitted('ap2',[q],{[q.id]:[raw,'5250 mL/min']});
  r.reviews[q.id]={manualMeanings:{0:confirmTermMeaning(q,0,raw,r.id,'equivalent')}};
  r.queue=[{kind:'meaning',item:q.id,index:0}];
  assert.ok(validTermRun(r,'ap2'));
  const wrong=structuredClone(r);wrong.queue[0].index=1;
  assert.equal(validTermRun(wrong,'ap2'),false);
  r.reviews[q.id].manualMeanings[0].itemIdentity='other-frozen-question';
  assert.equal(validTermRun(r,'ap2'),false);
});
