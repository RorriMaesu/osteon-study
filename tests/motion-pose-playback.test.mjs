import test from 'node:test';
import assert from 'node:assert/strict';
import {createPosePreview,samplePosePreview} from '../src/motion-pose-playback.js';

test('preview covers both motion directions smoothly and restores the exact starting pose',()=>{
 const values={elbow:{flexion:20},wrist:{flexion:7}};
 const preview=createPosePreview(values,'elbow','flexion',{from:0,to:60,duration:8,label:'Bend and straighten'});
 let before=20,maxStep=0,positive=false,negative=false;
 for(let frame=0;frame<480;frame++){
  const sample=samplePosePreview(preview,frame/60),value=sample.patch.elbow.flexion;
  maxStep=Math.max(maxStep,Math.abs(value-before));before=value;
  assert(value>=0&&value<=60);positive||=sample.direction>0;negative||=sample.direction<0;
 }
 assert(positive&&negative);assert(maxStep<.5,'no jumping between phases');
 assert.deepEqual(samplePosePreview(preview,8),{done:true,patch:values,direction:0});
 assert.deepEqual(values,{elbow:{flexion:20},wrist:{flexion:7}});
});
test('neutral starting value skips empty first phase',()=>{
 const preview=createPosePreview({elbow:{flexion:0}},'elbow','flexion',{from:0,to:60,duration:8});
 assert.equal(preview.segments.length,2);
 assert(samplePosePreview(preview,.1).patch.elbow.flexion>0);
});
test('invalid previews cannot create an endless animation',()=>{
 assert.equal(createPosePreview({elbow:{flexion:0}},'elbow','flexion',null),null);
 assert.equal(createPosePreview({elbow:{flexion:0}},'elbow','flexion',{from:0,to:0,duration:8}),null);
 assert.equal(createPosePreview({elbow:{flexion:0}},'elbow','flexion',{from:0,to:60,duration:0}),null);
});
test('breathing preview never combines inspiration and forced-expiration shapes',()=>{
 const values={breathing:{inhale:0,exhale:40}},preview=createPosePreview(values,'breathing','inhale',{from:0,to:75,duration:8});
 let previous=values.breathing;
 for(let frame=0;frame<480;frame++){
  const {patch}=samplePosePreview(preview,frame/60);
  assert(!(patch.breathing.inhale>0&&patch.breathing.exhale>0));
  for(const axis of ['inhale','exhale'])assert(Math.abs(patch.breathing[axis]-previous[axis])<2,'breathing phase must change smoothly');
  previous=patch.breathing;
 }
 assert.deepEqual(samplePosePreview(preview,8).patch,values);
});
