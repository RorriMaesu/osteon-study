import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {practicalFamilies,byStation} from '../src/ap2-practical-bank.js';
import {markStation,newPractical,practicalScores,validPractical} from '../src/ap2-practical-session.js';
import {newRecords,validAP2Records,createRecordsStore,AP2_KEY} from '../src/ap2-records.js';
import {checkEvidenceAnswer,evidenceStations,evidenceExercise} from '../src/ap2-evidence-labs.js';
import {cuffEvents,cuffRecords,rhythmEvents,rhythmRecords} from '../src/ap2-measurement-labs.js';
import {examItems} from '../src/ap2-exam-core.js';

test('both 12-station forms cover all nine chapters and survive a device reload with their presented keys',()=>{
  const forms=[];
  for(const fixed of [.01,.99]){
    const run=newPractical(practicalFamilies,()=>fixed);
    assert.equal(run.items.length,12);
    const chapters=new Set();
    for(const it of run.items){
      const spec=byStation(it.station);
      chapters.add(Number(spec.section.split('.')[0]));
      assert.equal(spec.id.endsWith('-b'),fixed>.5);
      it.answers=[spec.tasks[0].answer,spec.tasks[1].answer,0];it.methods=['description','model','choice'];
      assert.ok(markStation(it,spec));
    }
    run.submitted=run.started+30;run.index=run.items.length-1;
    assert.deepEqual([...chapters].sort((a,b)=>a-b),[12,13,14,15,16,17,18,19,20]);
    assert.deepEqual(practicalScores(run),[12,12,12]);
    assert.ok(validPractical(JSON.parse(JSON.stringify(run)),true));
    forms.push(run);
  }
  for(const [a,b] of practicalFamilies){
    assert.notEqual(a.tasks[0].prompt,b.tasks[0].prompt);
    assert.notEqual(a.question,b.question);
    assert.notDeepEqual(a.tasks.map(t=>a.parts[t.answer].label),b.tasks.map(t=>b.parts[t.answer].label),a.id);
  }
  const stored={...newRecords(),practicalReports:forms};
  assert.ok(validAP2Records(stored));
});

test('pre-expansion station and frozen correct/incorrect report fields survive alongside a new run',()=>{
  // Generated once with the eight-station v1 bank and its original grading code.
  const archived=JSON.parse(readFileSync(new URL('./ap2-legacy-practical.json',import.meta.url),'utf8'));
  const oldIds=['cord','neck','ossicles','csf','adrenal','heart','pulmonary','leg'];
  const oldDraft=newPractical(oldIds.map(byStation),()=>.25);
  const first=oldDraft.items[0];first.answers[0]=byStation(first.station).tasks[0].answer;first.methods[0]='model';
  const before={...newRecords(),practicalDraft:oldDraft,practicalReports:[archived],resume:'ap2-lesson-14.1/activity/ossicles'};
  const mem=new Map([[AP2_KEY,JSON.stringify(before)]]),storage={getItem:k=>mem.get(k)??null,setItem:(k,v)=>mem.set(k,v)};
  const store=createRecordsStore(storage);
  assert.deepEqual(store.read(),before);
  assert.deepEqual(practicalScores(store.read().practicalReports[0]),[5,5,6]);
  store.update(record=>{record.practicalDraft=newPractical(practicalFamilies,()=>.9);});
  assert.deepEqual(createRecordsStore(storage).read().practicalReports[0],archived);
});
test('measurement keys match the drawn event streams and the historical smear has its published checksum',()=>{
  const hash=createHash('sha1').update(readFileSync(new URL('../assets/ap2-blood/reticulocytes-uthman.jpg',import.meta.url))).digest('hex');
  assert.equal(hash,'d330bd580546a28d2b2073bcb8649afbded17cd9');
  for(const [n,record] of cuffRecords.entries()){
    const events=cuffEvents(record),on=events.findIndex(e=>e.tap);
    const end=events.find((e,i)=>i>on&&!e.tap);
    assert.equal(events[on].pressure,record.systolic);assert.equal(end.pressure,record.diastolic);
    const ex=evidenceExercise('cuff',n);
    assert.deepEqual(ex.questions.map(q=>q.number),[events[on].pressure,end.pressure]);
  }
  for(const [n,record] of rhythmRecords.entries()){
    const events=rhythmEvents(record),conducted=events.filter(e=>e.qrs!==null),ex=evidenceExercise('rhythm',n);
    assert.ok(conducted.every(e=>e.qrs<6&&Math.abs(e.qrs-e.p-record.pr)<1e-8));
    assert.equal(ex.questions[0].number,conducted.length*10);
    assert.equal(ex.questions[2].number,events.findIndex(e=>e.qrs===null)+1);
  }
  for(const s of evidenceStations)for(const n of [0,1]){
    const ex=evidenceExercise(s.key,n);
    for(const question of [...ex.questions,...(ex.last?[ex.last]:[])]){
      assert.equal(checkEvidenceAnswer(question,''),false);
      assert.ok(checkEvidenceAnswer(question,String(question.choices?0:question.number)));
      assert.equal(checkEvidenceAnswer(question,String(question.choices?1:question.number+1000)),false);
    }
    assert.ok(validAP2Records({...newRecords(),resume:'ap2-lesson-'+s.section+'/activity/'+s.id}));
  }
});
test('chapter exams sample two from at least three distinct independent scenarios for every section',()=>{
  let state=20;
  const random=()=>((state=(Math.imul(1664525,state)+1013904223)>>>0)/2**32);
  for(let chapter=12;chapter<=20;chapter++){
    const seen=new Map();
    for(let i=0;i<40;i++)for(const q of examItems(String(chapter),random).filter(q=>q.type==='choice')){
      if(!seen.has(q.section))seen.set(q.section,new Set());
      seen.get(q.section).add(q.id);
    }
    for(const [id,ids] of seen)assert.ok(ids.size>=3,id);
  }
});
