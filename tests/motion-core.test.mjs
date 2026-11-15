
import test from 'node:test';
import assert from 'node:assert/strict';
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
 assert.equal(pressFrame(0).angle,115);
 assert.equal(pressFrame(2).angle,0);
 assert.equal(pressFrame(4).angle,115);
 assert.equal(pressFrame(0).clipTime,2.4);
 assert.match(pressFrame(3).detail,/extensors lengthen/);
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
