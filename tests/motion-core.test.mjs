
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {curlDuration,curlFrame,heelFrame,pressFrame,elbowAngle,elbowLimits,planarLimbPose} from '../src/motion-core.js';

test('arm lesson has continuous lift, stationary hold, and controlled lowering',()=>{
 assert.equal(curlFrame(0).angle,curlFrame(curlDuration).angle);
 assert.equal(curlFrame(1.6).angle,curlFrame(2.4).angle);
 assert.equal(curlFrame(2).contraction,'Isometric');
 assert.equal(curlFrame(3).contraction,'Eccentric');
 assert.match(curlFrame(3).detail,/elbow flexors lengthen/);
});

test('the heel raise holds the same plantar-flexion angle before controlled lowering',()=>{
 assert.equal(heelFrame(0).angle,0);
 assert.equal(heelFrame(2).angle,23);
 assert.equal(heelFrame(2.4).angle,23);
 assert.equal(heelFrame(4).angle,0);
 assert.match(heelFrame(3).detail,/lengthen under tension/);
});

test('triceps press reverses the elbow movement while retaining the extension muscle group',()=>{
 assert.equal(pressFrame(0).angle,100);
 assert.equal(pressFrame(2).angle,10);
 assert.equal(pressFrame(4).angle,100);
 assert.equal(pressFrame(.8).joint,curlFrame(3.2).joint);
 assert.equal(pressFrame(.8).clipTime,3.2);
 assert.ok(Math.abs(pressFrame(.8).angle-curlFrame(3.2).angle)<1e-8);
 assert.equal(pressFrame(0).clipTime,2.4);
 assert.match(pressFrame(3).detail,/extensors lengthen/);
});

test('both shipped elbow clips agree with lesson joint angles at their boundaries',()=>{
 for(const file of ['motion-arm','motion-arm-left']){
  const asset=ext=>new URL('../assets/'+file+ext,import.meta.url);
  const meta=JSON.parse(readFileSync(asset('.json'),'utf8')),glb=readFileSync(asset('.glb'));
  const jsonLength=glb.readUInt32LE(12);
  const doc=JSON.parse(glb.subarray(20,20+jsonLength)),bufferStart=28+jsonLength;
  const clip=doc.animations.find(item=>item.name===meta.animation.name);
  const track=clip.channels.find(channel=>doc.nodes[channel.target.node].name===meta.joints.elbow&&channel.target.path==='rotation');
  const sampler=clip.samplers[track.sampler];
  const values=(index,components)=>{
   const accessor=doc.accessors[index],view=doc.bufferViews[accessor.bufferView];
   const first=bufferStart+(view.byteOffset||0)+(accessor.byteOffset||0),stride=view.byteStride||4*components;
   assert.equal(accessor.componentType,5126);
   return Array.from({length:accessor.count},(_,row)=>Array.from({length:components},(_,col)=>glb.readFloatLE(first+row*stride+col*4)));
  };
  const times=values(sampler.input,1).flat(),rotations=values(sampler.output,4);
  const neutral=doc.nodes[track.target.node].rotation||[0,0,0,1];
  for(const t of [0,1.6,2.4,4]){
   const index=times.findIndex(sample=>Math.abs(sample-t)<1e-4);
   assert.ok(index>=0,file+' has the authored boundary '+t);
   const dot=rotations[index].reduce((sum,value,i)=>sum+value*neutral[i],0);
   const measured=2*Math.acos(Math.min(1,Math.abs(dot)))*180/Math.PI;
   assert.ok(Math.abs(measured-curlFrame(t).angle)<.02,file+' '+t+' s renders '+measured+'°');
  }
 }
});

test('target direction resolves to bounded elbow flexion without an unstable on-axis result',()=>{
 const neutral=[0,-1,0], axis=[-1,0,0];
 assert.equal(elbowAngle(neutral,[0,0,1],axis),90);
 assert.equal(elbowAngle(neutral,[0,0,-1],axis),0);
 assert.equal(elbowAngle(neutral,[0,1,0],axis),elbowLimits[1]);
 assert.equal(elbowAngle(neutral,[1,0,0],axis),null);
});

test('two-segment leg IK preserves segment lengths even past maximum reach',()=>{
 const pose=planarLimbPose(.41,.39,.45,.16,-1);
 const root=pose.root*Math.PI/180,end=(pose.root+pose.bend)*Math.PI/180;
 assert.ok(Math.abs(.41*Math.cos(root)+.39*Math.cos(end)-.45)<1e-9);
 assert.ok(Math.abs(.41*Math.sin(root)+.39*Math.sin(end)-.16)<1e-9);
 assert.ok(Math.abs(planarLimbPose(.41,.39,9,0,-1).bend)<1);
});
