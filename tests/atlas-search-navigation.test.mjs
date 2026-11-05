import test from 'node:test';
import assert from 'node:assert/strict';
import {atlasMatches,atlasSuggestions} from '../src/atlas-search.js';
import {lessonDirection} from '../src/lesson-flow.js';

const terms=[
 {name:'Tibial tuberosity',cue:'Inferior to the patella'},
 {name:'Patellar ligament',cue:'Joins the patella to the tibia'},
 {name:'Patella',aliases:['kneecap']},
 {name:'Humeri',aliases:['humerus']}
];
test('atlas search ranks exact terms and accepts aliases and small typos',()=>{
 assert.equal(atlasMatches(terms,'patella')[0].name,'Patella');
 assert.equal(atlasMatches(terms,'kneecap')[0].name,'Patella');
 assert.equal(atlasSuggestions(terms,'humerous')[0].label,'humerus');
 assert.deepEqual(atlasSuggestions(terms,'hu'),[]);
});
test('lesson navigation visits every explanation topic before advancing',()=>{
 const lesson={sections:[['one'],['two'],['three']]};
 let work={step:0,section:2};
 for(const expected of [{step:1,section:0},{step:1,section:1},{step:1,section:2},{step:2,section:2}]){
  work=lessonDirection(lesson,work,1);assert.deepEqual(work,expected);
 }
 assert.deepEqual(lessonDirection(lesson,work,-1),{step:1,section:2});
});
