// Toggling a layer must not invoke a navigation preset.
import {areaForBone,boneSide} from './exploration.js';
export function muscleContextForView({region,focus={}}){
 const area={skull:'head-neck',neck:'head-neck','thoracic-spine':'trunk-back','lower-back':'trunk-back',thorax:'trunk-back',shoulder:'shoulder-arm',arm:'shoulder-arm',forearm:'forearm-hand',hand:'forearm-hand',pelvis:'pelvis-leg-foot',thigh:'pelvis-leg-foot',knee:'pelvis-leg-foot',leg:'pelvis-leg-foot',foot:'pelvis-leg-foot'};
 const macro={'Skull':'head-neck','Spine':'spine','Thorax':'trunk-back','Upper limb':'upper-limb','Pelvis':'pelvis-leg-foot','Lower limb':'pelvis-leg-foot'};
 const focusedBone=focus.level==='bone'?focus.boneId||'':'',side=focus.side||boneSide(focusedBone);
 return {region:area[focus.areaId||areaForBone(focusedBone)]||macro[region]||'all',side:side==='l'?'left':side==='r'?'right':'both'};
}
export function captureBoneView(viewer){return {...viewer.snapshot(),division:viewer.division,focusHistory:[...viewer.focusHistory],peel:viewer.peel,autoRotate:viewer.controls.autoRotate};}
export function restoreBoneView(viewer,snapshot,{restoreCamera=false}={}){
 viewer.clearPins();
 for(const key of ['focus','region','division','selected','selectedTerm','activeDetail','cutaway','isolated','ghost','hiddenMeshes','peel'])viewer[key]=snapshot[key];
 viewer.focusHistory=[...snapshot.focusHistory];
 if(snapshot.pins.length)viewer.showPins(snapshot.pins,{labelled:snapshot.pinLabels});
 viewer.showOutline(snapshot.selectedTerm?.representation?.outline);
 if(restoreCamera){viewer.tween=null;viewer.camera.position.copy(snapshot.position);viewer.controls.target.copy(snapshot.target);viewer.controls.update();}
 viewer.controls.autoRotate=snapshot.autoRotate;viewer.applyVisibility();viewer.notifyFocus();
}
export function prepareMuscleNavigation(viewer){
 viewer.clearPins();viewer.region='All regions';viewer.division='All';viewer.focus={level:'overview',areaId:null,side:null,boneId:null};viewer.selected=[];viewer.selectedTerm=null;viewer.isolated=false;viewer.ghost=false;viewer.cutaway=null;viewer.peel=false;
 viewer.applyVisibility();
}
