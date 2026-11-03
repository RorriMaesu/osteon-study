import test from 'node:test';
import assert from 'node:assert/strict';
import {viewerGuidance,doubleTap} from '../src/viewer-guidance.js';
import {boneId} from '../src/exploration.js';

test('guidance explains the region-to-bone sequence for mouse and touch, without hinting during assessment',()=>{
 assert.match(viewerGuidance().intro,/Double-click.*region/);
 assert.match(viewerGuidance({touch:true}).hint,/Double-tap.*region.*one bone/);
 assert.equal(viewerGuidance({level:'region'}).action,'View bone alone');
 assert.equal(viewerGuidance({level:'bone'}).action,'Back to region');
 assert.equal(viewerGuidance({blocked:true}).action,'');
 assert.doesNotMatch(viewerGuidance({touch:true,blocked:true}).hint,/bone|region|answer/);
 assert.equal(viewerGuidance({peel:true}).action,'');
 assert.match(viewerGuidance({peel:true}).hint,/Turn Peel off/);
});
test('double-tap tolerates the same adult bone across component meshes, while rejecting another bone, delay or drag',()=>{
 const first={bone:boneId('Manubrium of sternum'),time:100,x:10,y:20};
 assert.ok(doubleTap(first,{bone:boneId('Body of sternum'),time:520,x:25,y:25}));
 assert.ok(!doubleTap(first,{...first,bone:boneId('Clavicle.l'),time:300}));
 assert.ok(!doubleTap(first,{...first,time:551}));
 assert.ok(!doubleTap(first,{...first,time:300,x:60}));
 assert.ok(!doubleTap(first,{...first,time:99}));
 assert.ok(!doubleTap(null,first));
 assert.ok(!doubleTap({...first,bone:null},{...first,bone:null}));
});
