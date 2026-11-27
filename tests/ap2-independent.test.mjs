import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {sections} from '../src/ap2-library.js';
import {examItems} from '../src/ap2-exam-core.js';
import {independentItems} from '../src/ap2-independent.js';
import {evidenceItems} from '../src/ap2-independent-visuals.js';
import {bloodExamItems} from '../src/ap2-blood-exam.js';
import {writtenCases} from '../src/ap2-writing.js';
import {snapshotWriting} from '../src/ap2-writing-ui.js';
import {newRecords,validAP2Records} from '../src/ap2-records.js';

test('all 49 sections have separate exam scenarios and all nine chapters have a fresh writing case',()=>{
  const practice=new Set(sections.flatMap(s=>s.questions.map(q=>q.prompt)));
  assert.equal(independentItems.length,147);
  assert.equal(new Set(independentItems.map(q=>q.id)).size,independentItems.length);
  assert.equal(new Set(independentItems.map(q=>q.prompt)).size,independentItems.length);
  for(const section of sections)assert.equal(independentItems.filter(q=>q.section===section.id).length,3,section.id);
  for(const q of independentItems){
    assert.ok(!practice.has(q.prompt));assert.equal(new Set(q.choices).size,4);
    assert.ok(['Trace','Identify','Explain','Predict'].includes(q.skill));
  }
  const exam=examItems('all');
  assert.equal(exam.length,67);
  assert.ok(exam.filter(q=>q.type==='choice').every(q=>!practice.has(q.prompt)));
  for(const c of snapshotWriting(exam)){
    assert.notEqual(c.prompt,writtenCases[c.chapter].prompt);
    assert.equal(c.rubric.length,3);
  }
});
test('exam stimuli work in saved drafts and image imports are limited to local smear specimens',()=>{
  const r=newRecords(),items=[...evidenceItems,...bloodExamItems];
  r.draft={id:'specimen-test',title:'Specimens',scope:'all',started:1,index:0,items:structuredClone(items),responses:{},writing:snapshotWriting(items)};
  assert.ok(validAP2Records(r));
  for(const q of bloodExamItems)assert.ok(existsSync(new URL('../'+q.stimulus.image,import.meta.url)));
  const st=r.draft.items.find(q=>q.stimulus.image).stimulus;
  st.image='../../outside.webp';assert.equal(validAP2Records(r),false);
});
