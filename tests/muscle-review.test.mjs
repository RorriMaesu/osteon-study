import test from 'node:test';
import assert from 'node:assert/strict';
import {dueMuscleFigureReviews} from '../src/muscle-study-state.js';
import {dailyRoute} from '../src/daily-plan.js';
import {muscleReaderNotes} from '../src/muscle-reader-notes.js';
import reader from '../src/chapter11-reader.json' with {type:'json'};

test('figure review includes saved misses in their owning sections and excludes future and unselected figures',()=>{
 const progress={attempts:[],cards:{
  'muscle-figure-masseter':{due:20,interval:0},
  'muscle-figure-internal-oblique':{due:10,interval:0},
  'muscle-figure-brachialis':{due:60,interval:1},
 }};
 const expected=[
  {id:'11.4',figure:'11.16',target:'internal-oblique'},
  {id:'11.3',figure:'11.10',target:'masseter'},
 ];
 assert.deepEqual(dueMuscleFigureReviews(progress,50),expected);
 assert.deepEqual(dailyRoute(progress,{now:50,chapters:[10,11]}).dueFigures,expected);
 assert.deepEqual(dailyRoute(progress,{now:50,chapters:[10]}).dueFigures,[]);
});

test('the abdominal figure clarification matches the bundled edition',()=>{
 const page=reader.find(p=>p.pdf===445);
 assert.match(page.text,/medial to the rectus abdominis/i);
 assert.doesNotMatch(page.text,/rectus femoris/i);
 assert.match(muscleReaderNotes[page.pdf][0],/lateral to rectus abdominis/i);
});
