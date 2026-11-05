import test from 'node:test';
import assert from 'node:assert/strict';
import {viewerGuidance,doubleTap} from '../src/viewer-guidance.js';
import {boneId} from '../src/exploration.js';
import {AnatomyViewer} from '../src/viewer.js';

test('guidance explains the region-to-bone sequence for mouse and touch, without hinting during assessment',()=>{
 assert.match(viewerGuidance().intro,/Double-click.*region/);
 assert.match(viewerGuidance({touch:true}).hint,/Double-tap.*region.*one bone/);
 assert.equal(viewerGuidance({level:'region'}).action,'View bone alone');
 assert.equal(viewerGuidance({level:'bone'}).action,'');
 assert.match(viewerGuidance({level:'bone'}).hint,/Back returns to the region/);
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

test('Back can leave filtered regions and teaching specimens with no saved camera history',()=>{
 const viewer=Object.create(AnatomyViewer.prototype);
 Object.assign(viewer,{focus:{level:'overview'},focusHistory:[],activeDetail:'fetal-skull',lastTap:{},reset(){this.activeDetail=null;this.focus={level:'overview'};}});
 assert.ok(viewer.canGoBack());
 viewer.back();
 assert.equal(viewer.lastTap,null);
 assert.equal(viewer.canGoBack(),false);
 viewer.focus={level:'region'};
 assert.ok(viewer.canGoBack());
 viewer.back();
 assert.equal(viewer.canGoBack(),false);
});

test('Back follows muscle navigation and is blocked during practice',()=>{
 const viewer=Object.create(AnatomyViewer.prototype);
 let steps=0;
 Object.assign(viewer,{focus:{level:'bone'},focusHistory:[{}],muscleLayer:{ownsFocus:()=>true,canGoBack:()=>steps===0,back(){steps++;}}});
 assert.ok(viewer.canGoBack());
 viewer.quiz=true;
 viewer.back();
 assert.equal(steps,0);
 viewer.quiz=false;
 viewer.back();
 assert.equal(steps,1);
 assert.equal(viewer.canGoBack(),false);
 assert.equal(viewer.focusHistory.length,1);
});
