import test from 'node:test';
import assert from 'node:assert/strict';
import winter from '../src/ap2-figures.json' with {type:'json'};
import spring from '../src/ap3-figures.json' with {type:'json'};
import {figureCovers} from '../src/lesson-figure-covers.js';

test('every spring textbook image has its own description of the printed evidence',()=>{
  const descriptions=Object.values(spring.figures).map(f=>f.alt);
  assert.equal(descriptions.length,86);
  assert.equal(new Set(descriptions).size,descriptions.length);
  for(const [id,f] of Object.entries(spring.figures)){
    assert.ok(f.alt.length>45&&f.alt!==f.title,id);
  }
  assert.match(spring.figures['25.17'].alt,/descending limb/);
  assert.match(spring.figures['22.26'].alt,/temperature/i);
});

test('practice covers are keyed to existing source images and stay within each image',()=>{
  const ids=new Set([...winter.map(f=>f.figure),...Object.keys(spring.figures)]);
  for(const [id,boxes] of Object.entries(figureCovers)){
    assert.ok(ids.has(id)&&boxes.length,id);
    for(const [x,y,w,h] of boxes)assert.ok(x>=0&&y>=0&&w>0&&h>0&&x+w<=100&&y+h<=100,id);
  }
});
