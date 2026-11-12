import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import foundations from '../src/foundations-links.json' with {type:'json'};
import other from '../src/lesson-links.json' with {type:'json'};
import {textbookFigure,preferredLessonArt,textbookGallery} from '../src/textbook-figures.js';
import {foundationsVisuals} from '../src/visual-foundations.js';
import {systemsVisuals} from '../src/visual-systems.js';
import muscleAssets from '../src/muscle-textbook-assets.json' with {type:'json'};

test('every linked numbered figure has a crop on its original page',()=>{
 for(const {figures} of Object.values({...foundations,...other}))for(const {number,pdf} of figures){
  const asset=muscleAssets[number];
  if(asset){
   assert.equal(asset.pdf,pdf,number);
   assert.ok(asset.width>0&&asset.height>0&&existsSync(new URL('../assets/muscle-textbook/'+asset.file,import.meta.url)),number);
   continue;
  }
  const [page,w,h,[x,y,width,height],title]=textbookFigure(number);
  assert.equal(page,pdf,number);
  assert.ok(x>=0&&y>=0&&width>0&&height>0&&x+width<=w&&y+height<=h,number);
  assert.ok(title&&existsSync(new URL(`../assets/reader/p${page}.jpg`,import.meta.url)),number);
 }
});

test('preferred art states point to actual figures and keep the source-page action',()=>{
 for(const [id,states] of Object.entries(preferredLessonArt)){
  const topic=foundationsVisuals[id]||systemsVisuals[id];
  assert.ok(topic&&states.length<=topic.states.length,id);
  assert.ok(states.every(figure=>!figure||textbookFigure(figure)),id);
 }
 const gallery=textbookGallery(foundations['5.2'].figures,3,String);
 assert.match(gallery,/5\.13 · Nails/);
 assert.match(gallery,/data-lesson-figure="195"/);
 assert.match(gallery,/<svg viewBox=/);
});
