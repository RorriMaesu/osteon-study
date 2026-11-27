import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {heartSounds} from '../src/ap2-heart-sounds.js';
import {pressureState} from '../src/ap2-heart-cycle.js';
import {hemorrhage,hemorrhageValues} from '../src/ap2-cardio-mechanisms.js';
import {tallies,absoluteCount} from '../src/ap2-blood-differentials.js';
import {mergeEndocrineTrials,validEndocrineTrial} from '../src/ap2-feedback-reasoning.js';
import {newRecords,validAP2Records} from '../src/ap2-records.js';

test('the sound onsets coincide with modeled AV and semilunar valve closure',()=>{
  for(const [i,valve] of ['mitral','aortic'].entries()){
    const t=heartSounds[i].time;
    assert.equal(pressureState(t-1)[valve],true);
    assert.equal(pressureState(t)[valve],false);
  }
});
test('the blood-loss pressure readings include right atrial pressure and convert stroke volume to litres',()=>{
  assert.deepEqual(hemorrhage.map(hemorrhageValues),[{co:5.04,map:95},{co:4.2,map:92},{co:2.8,map:66}]);
});
test('the two differential challenges use ten different new specimens and independent counts',()=>{
  const dir=new URL('../assets/ap2-blood/',import.meta.url);
  const read=name=>JSON.parse(fs.readFileSync(new URL(name,dir),'utf8'));
  const panels=read('tally-specimens.json'),existing=new Set(read('specimens.json').map(cell=>cell.source));
  assert.deepEqual(panels.map(tallies),[{neutrophils:2,lymphocytes:3},{neutrophils:4,lymphocytes:1}]);
  assert.equal(new Set(panels.flat().map(s=>s.source)).size,10);
  for(const field of panels.flat()){
    assert.ok(!existing.has(field.source));
    assert.equal(fs.readFileSync(new URL(field.file,dir)).toString('ascii',8,12),'WEBP');
  }
  assert.deepEqual([4000,10000].map(total=>absoluteCount(total,0.5)),[2000,5000]);
});
test('a revised endocrine explanation keeps the earliest submitted reasoning across backup merges',()=>{
  const key='thyroid/gland',first={drive:'High',end:'Low',why:'Less feedback',at:1};
  const revised={drive:'High',end:'Low',why:'Less circulating T4 releases pituitary inhibition.',at:8,checked:true,first};
  const laterFirst={...first,at:4};
  const earlierRevision={...revised,at:6,first:laterFirst};
  assert.ok(validEndocrineTrial(key,revised));
  assert.ok(validAP2Records({...newRecords(),endocrineTrials:{[key]:revised}}));
  assert.equal(validEndocrineTrial('unknown/rest',revised),false);
  assert.equal(validEndocrineTrial(key,{...revised,drive:''}),false);
  for(const [a,b] of [[revised,earlierRevision],[earlierRevision,revised]]){
    assert.deepEqual(mergeEndocrineTrials({[key]:a},{[key]:b})[key],revised);
  }
});
