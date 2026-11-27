import test from 'node:test';
import assert from 'node:assert/strict';
import {conductionLocation,transitTime} from '../src/ap2-conduction.js';
import {possibilities,pupilResponse,pupilTable} from '../src/ap2-pupil-evidence.js';
import {vesicles} from '../src/ap2-vesicle-map.js';
import {drugTrials} from '../src/ap2-drug-actions.js';
import {coordinationRecords,interpretationFor} from '../src/ap2-cerebellar-localization.js';
import {sectionById,labFor} from '../src/ap2-library.js';

test('arrival order and measured speed agree for the same distance and moment on both tracks',()=>{
  for(const mm of [10,20,30]){
    const myelinated=transitTime(0,mm),bare=transitTime(1,mm);
    assert.equal(mm/myelinated,20);assert.equal(mm/bare,2);
    assert.equal(conductionLocation(0,myelinated),mm);
    assert.ok(conductionLocation(1,myelinated)<mm);
    assert.equal(conductionLocation(1,bare),mm);
  }
});
test('ambiguous pupil observations reward informative choices and support an indeterminate conclusion',()=>{
  assert.deepEqual(possibilities([[0,false]]),[1,3]);
  assert.deepEqual(possibilities([[0,false],[3,true]]),[1,3]);
  assert.deepEqual(possibilities([[0,false],[1,false]]),[1]);
  assert.deepEqual(possibilities([[3,false],[2,true]]),[4]);
  const table=pupilTable(new Map([['left',pupilResponse(1,'left')]]));
  assert.ok(table.indexOf('Subject’s right pupil')<table.indexOf('Subject’s left pupil'));
  assert.equal(table.match(/Unobserved/g).length,2);
  assert.equal(table.match(/No constriction/g).length,2);
});
test('new stations appear in course lessons, including the shared hindbrain lumen and autonomic classes',()=>{
  for(const [section,key] of [['13.1','vesicle-map'],['14.1','two-point'],['15.4','drug-actions'],['16.3','choose-evidence'],['16.5','cerebellar-localization']]){
    assert.ok(labFor(section).renderLab(section).includes('data-sensory-detail="'+key+'"'));
  }
  assert.deepEqual(vesicles.filter(v=>v.cavity==='Fourth ventricle').map(v=>v.late),['Metencephalon','Myelencephalon']);
  const text=sectionById.get('15.4').paragraphs.join(' ');assert.match(text,/sympathomimetic/i);assert.match(text,/sympatholytic/i);assert.match(text,/nicotine/i);
  assert.ok(drugTrials.every(trial=>trial.effects[trial.answer]));
});

test('cerebellar region decisions require informative contrasts and allow incomplete records',()=>{
  for(const [index,region] of ['hemisphere','vermis','vestibular','uncertain'].entries()){
    const record=coordinationRecords[index];
    assert.equal(interpretationFor(record,new Set([0,1,2])),region);
    for(const task of [0,1,2])assert.equal(interpretationFor(record,new Set([task])),'uncertain');
    if(record.needed.length){
      const missing=new Set([0,1,2].filter(i=>!record.needed.includes(i)));
      assert.equal(interpretationFor(record,missing),'uncertain');
    }
  }
});

