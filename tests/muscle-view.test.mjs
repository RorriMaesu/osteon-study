import test from 'node:test';
import assert from 'node:assert/strict';
import {muscleContextForView,captureBoneView,restoreBoneView,prepareMuscleNavigation} from '../src/muscle-view.js';
import {muscleScopeRegions,componentVisible} from '../src/muscle-data.js';
import manifest from '../src/muscle-models.json' with {type:'json'};
function vector(values){return {values:[...values],clone(){return vector(this.values);},copy(v){this.values=[...v.values];}};}
function specimen(){return {focus:{level:'bone',areaId:'hand',side:'l',boneId:'Second metacarpal bone.l'},region:'Upper limb',division:'Appendicular',selected:['bone'],selectedTerm:{id:'metacarpals',representation:{outline:[[1,2,3]]}},activeDetail:null,cutaway:null,isolated:true,ghost:false,peeledSurfaces:new Set(['peeled']),peel:true,pins:[{term:{id:'pin'},point:[1,2,3]}],pinLabels:true,focusHistory:[{focus:{level:'overview'}}],camera:{position:vector([1,2,3])},controls:{target:vector([.1,.2,.3]),autoRotate:false,update(){}},snapshot(){return {...this,focus:{...this.focus},selected:[...this.selected],position:this.camera.position.clone(),target:this.controls.target.clone()};},clearPins(){this.pins=[];},showPins(pins,{labelled}){this.pins=pins;this.pinLabels=labelled;},showOutline(outline){this.outline=outline;},applyVisibility(){this.visibilityApplied=true;},notifyFocus(){this.notified=true;}};}
test('muscle entry follows the viewed scope and side rather than the shoulder preset',()=>{
 assert.deepEqual(muscleContextForView({region:'All regions',focus:{level:'overview'}}),{region:'all',side:'both'});
 assert.deepEqual(muscleContextForView({region:'Upper limb',focus:{level:'region'}}),{region:'upper-limb',side:'both'});
 assert.deepEqual(muscleContextForView({region:'Upper limb',focus:{level:'bone',areaId:'hand',side:'l'}}),{region:'forearm-hand',side:'left'});
 assert.deepEqual(muscleContextForView({region:'Lower limb',focus:{areaId:'thigh',side:'r'}}),{region:'pelvis-leg-foot',side:'right'});
 assert.deepEqual(muscleContextForView({region:'Upper limb',focus:{level:'bone',areaId:null,side:null,boneId:'Humerus.l'}}),{region:'upper-limb',side:'left'});
 assert.equal(muscleContextForView({region:'Spine',focus:{}}).region,'spine');assert.equal(muscleContextForView({region:'Skull',focus:{}}).region,'head-neck');
 assert.deepEqual(muscleScopeRegions('upper-limb'),['shoulder-arm','forearm-hand']);assert.equal(muscleScopeRegions('all').length,5);
 const state={enabled:true,region:'upper-limb',side:'both',support:false,depth:'all',hidden:new Set()};
 assert.ok(componentVisible({id:'hand',region:'forearm-hand',side:'left',kind:'muscle'},state));assert.ok(componentVisible({id:'arm',region:'shoulder-arm',side:'right',kind:'muscle'},state));assert.equal(componentVisible({id:'leg',region:'pelvis-leg-foot',side:'right',kind:'muscle'},state),false);
});
test('humerus and radius/ulna views retain all twenty usual forearm muscles on the correct side',()=>{
 const names=['Pronator teres muscle','Flexor carpi radialis','Palmaris longus muscle','Flexor carpi ulnaris','Flexor digitorum superficialis','Flexor digitorum profundus','Flexor pollicis longus','Pronator quadratus','Brachioradialis muscle','Extensor carpi radialis longus','Extensor carpi radialis brevis','Extensor digitorum','Extensor digiti minimi','Extensor carpi ulnaris','Anconeus muscle','Supinator','Abductor pollicis longus','Extensor pollicis brevis','Extensor pollicis longus','Extensor indicis'];
 for(const [suffix,side,other] of [['l','left','right'],['r','right','left']])for(const bone of ['Humerus','Radius','Ulna']){
  const context=muscleContextForView({region:'Upper limb',focus:{level:'bone',boneId:bone+'.'+suffix}}),state={...context,enabled:true,depth:'all',support:false,hidden:new Set()};
  for(const name of names){const c=manifest.components.filter(c=>!c.retired&&c.muscleName===name&&c.side===side);assert.ok(c.length,name+' '+side);assert.ok(c.every(c=>componentVisible(c,state)),bone+' view hides '+name);assert.ok(manifest.components.filter(c=>c.muscleName===name&&c.side===other).every(c=>!componentVisible(c,state)),name+' leaks the opposite side');}
  assert.ok(manifest.components.filter(c=>!c.retired&&c.muscleName==='Triceps brachii muscle'&&c.side===side).every(c=>componentVisible(c,state)));
 }
});
test('every active muscle part can be shown in its regional and whole-body views',()=>{
 for(const c of manifest.components.filter(c=>!c.retired&&c.kind==='muscle'))for(const region of [c.region,'all'])assert.ok(componentVisible(c,{enabled:true,region,side:'both',depth:'all',support:false,hidden:new Set()}),c.id+' absent in '+region);
});
test('layer round trips restore bone navigation without reverting peels or the camera',()=>{
 const viewer=specimen(),saved=captureBoneView(viewer);assert.deepEqual(viewer.camera.position.values,[1,2,3]);viewer.selected=[];viewer.pins=[];viewer.peeledSurfaces.clear();viewer.camera.position.copy(vector([3,2,1]));restoreBoneView(viewer,saved);
 assert.deepEqual(viewer.camera.position.values,[3,2,1]);assert.equal(viewer.division,'Appendicular');assert.equal(viewer.focus.side,'l');assert.equal(viewer.isolated,true);assert.deepEqual(viewer.selected,['bone']);assert.equal(viewer.pins.length,1);assert.equal(viewer.peeledSurfaces.size,0);assert.equal(viewer.focusHistory.length,1);assert.deepEqual(viewer.outline,[[1,2,3]]);
});
test('explicit muscle navigation can leave bone isolation and then restore the original specimen',()=>{
 const viewer=specimen(),saved=captureBoneView(viewer);prepareMuscleNavigation(viewer);assert.equal(viewer.isolated,false);assert.equal(viewer.region,'All regions');assert.equal(viewer.division,'All');assert.equal(viewer.selected.length,0);assert.deepEqual(viewer.camera.position.values,[1,2,3]);viewer.camera.position.copy(vector([9,9,9]));restoreBoneView(viewer,saved,{restoreCamera:true});assert.deepEqual(viewer.camera.position.values,[1,2,3]);assert.equal(viewer.focus.boneId,'Second metacarpal bone.l');assert.equal(viewer.peel,true);
});
