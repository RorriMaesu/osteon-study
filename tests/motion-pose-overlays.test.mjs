import test from 'node:test';
import assert from 'node:assert/strict';
import {overlapsPoseRect,poseRect,placePoseLabel,placePoseGrip} from '../src/motion-pose-overlays.js';

test('labels avoid the selected ring, drag grip, neighbouring joints and camera tools',()=>{
 for(const [width,height]of [[1100,550],[650,341],[300,165],[370,480],[550,185]]){
  const anchor={x:width/2,y:height/2};
  const obstacles=[poseRect(anchor.x,anchor.y,126),{left:0,top:height-37,right:width,bottom:height},{left:8,right:width-8,top:8,bottom:45}];
  const placed=placePoseLabel({anchor,width,height,labelWidth:125,labelHeight:23,obstacles});
  if(placed){
   const box=poseRect(placed.x,placed.y,125,23);
   assert(box.left>=0&&box.right<=width&&box.top>=0&&box.bottom<=height);
   assert(obstacles.every(obstacle=>!overlapsPoseRect(box,obstacle,7)));
  }else assert(height<=185,'A roomy view should have a readable label');
 }
});
test('crowded labels yield rather than covering an essential control',()=>{
 assert.equal(placePoseLabel({anchor:{x:90,y:60},width:180,height:120,labelWidth:100,labelHeight:25,obstacles:[{left:0,top:0,right:180,bottom:120}]}),null);
 assert.equal(placePoseLabel({anchor:{x:90,y:60},width:180,height:120,labelWidth:190,labelHeight:25}),null);
});
test('rotation grip switches sides when near the edge or another control',()=>{
 assert.deepEqual(placePoseGrip({anchor:{x:180,y:100},width:210,height:200}),{x:137,y:100});
 assert.deepEqual(placePoseGrip({anchor:{x:100,y:100},width:250,height:200,obstacles:[poseRect(143,100,44)]}),{x:57,y:100});
});
test('endpoint grip stays on the anatomical target and yields to fixed controls',()=>{
 const config={anchor:{x:100,y:100},width:250,height:200,endpoint:true};
 assert.deepEqual(placePoseGrip(config),config.anchor);
 assert.equal(placePoseGrip({...config,obstacles:[poseRect(100,100,44)]}),null);
});
