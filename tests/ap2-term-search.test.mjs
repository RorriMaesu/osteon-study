import test from 'node:test';
import assert from 'node:assert/strict';
import {makeCourseSearch} from '../src/ap2-term-search.js';

const find=makeCourseSearch([
  {title:'Thyroid follicle',section:'17.4'},
  {title:'Pressure–volume loops',terms:'afterload',section:'19.4'},
  {title:'Tuning-fork tests',terms:'Rinne Weber',section:'16.3'},
  {title:'Deflating cuff',terms:'Korotkoff sounds',section:'20.2'}
]);
test('punctuation and synonyms lead to the corresponding practical',()=>{
  for(const query of ['pressure volume','pressure–volume','afterload'])assert.equal(find(query).items[0].section,'19.4');
  for(const query of ['tuning fork','tuning-fork','Rinne'])assert.equal(find(query).items[0].section,'16.3');
  assert.equal(find('korotkoff').items[0].section,'20.2');
  assert.equal(find('19.4').items[0].title,'Pressure–volume loops');
});
test('search labels close spellings and honors filters and ambiguous terms',()=>{
  const r=find('thryoid');
  assert.equal(r.suggestion,'thyroid');
  assert.equal(r.items[0].section,'17.4');
  assert.deepEqual(find('thryoid',row=>row.section==='20.2').items,[]);
  assert.equal(find('thyroid').suggestion,'');
  const tie=makeCourseSearch([{title:'atria'},{title:'atrio'}]);
  assert.deepEqual(tie('atrie'),{items:[],suggestion:''});
});
