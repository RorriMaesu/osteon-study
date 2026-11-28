import test from 'node:test';
import assert from 'node:assert/strict';
import {visibleEyeHit} from '../src/organ-eye-picking.js';

const hit=name=>({object:{name}});
const choose=(names,mode='natural')=>visibleEyeHit(names.map(hit),mode,mesh=>mesh.name)?.object.name;

test('the visible iris can be picked through its own natural cornea',()=>{
  for(const side of ['left','right']){
    const cornea='cornea_'+side,iris='iris_'+side;
    assert.equal(choose([cornea,cornea,iris]),iris);
    assert.equal(choose([cornea,'lens_'+side,iris]),cornea);
    assert.equal(choose([cornea,iris],'teaching'),cornea);
  }
});

test('occluders, isolated surfaces and the opposite eye keep their own identity',()=>{
  assert.equal(choose(['sclera_right','cornea_right','iris_right']),'sclera_right');
  assert.equal(choose(['cornea_left','iris_right']),'cornea_left');
  assert.equal(choose(['cornea_left']),'cornea_left');
  assert.equal(choose(['iris_left']),'iris_left');
  assert.equal(choose([]),undefined);
});
