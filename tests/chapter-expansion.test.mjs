import test from 'node:test';
import assert from 'node:assert/strict';
import {chapterOf,isLessonId} from '../src/chapters.js';
import {author} from '../src/question-author.js';
import {transferAuthor} from '../src/transfer-author.js';
import {blankProgress,validProgress} from '../src/storage.js';
import {validLessonWork,saveLessonWork,readLessonWork} from '../src/lesson-flow.js';
import {weightedPractice} from '../src/custom-practice.js';

test('multi-digit chapter IDs survive authoring and weighted practice',()=>{
 assert.equal(chapterOf('10.9'),'10');assert.equal(chapterOf('6.3'),'6');assert.equal(chapterOf('bad'),'');
 assert.ok(isLessonId('10.9'));for(const id of ['10.0','10.10','1.1','__proto__','10.1.1'])assert.ok(!isLessonId(id));
 for(const make of [author,transferAuthor]){const a=make();a.t('10.2',1,'Name the covering.','Epimysium',[],'The outer covering surrounds the whole muscle.');assert.equal(a.items[0].topic,'Chapter 10');assert.equal(a.items[0].objectives[0],'10.2.1');assert.equal(weightedPractice(a.items,{10:1},1)[0].id,a.items[0].id);}
});
test('Chapter 10 drafts and progress round-trip alongside older lessons',()=>{
 const p=blankProgress();p.lessons={'6.3':true,'10.9':true};assert.ok(validProgress(p));p.lessons['10.10']=true;assert.ok(!validProgress(p));
 const map=new Map(),storage={getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)};
 const work={step:3,section:0,figure:0,explore:'activity',retrieval:'My prediction',application:''};
 saveLessonWork(storage,'6.3',work);saveLessonWork(storage,'10.9',work);assert.ok(validLessonWork(JSON.parse([...map.values()][0])));assert.equal(readLessonWork(storage,'10.9').retrieval,'My prediction');assert.equal(readLessonWork(storage,'6.3').retrieval,'My prediction');
});
