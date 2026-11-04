import test from 'node:test';
import assert from 'node:assert/strict';
import {adultVisibility,focusGuideVisible} from '../src/model-visibility.js';
import {discLevels,discAreas,vertebralLevel,betweenVisibleVertebrae,isIntervertebralDisc} from '../src/spinal-context.js';
import {inArea,isBone} from '../src/exploration.js';
import {meshRegion,meshDivision,tissueAreas,meshInRegion} from '../src/anatomy.js';
import {allTerms,matches} from '../src/data.js';
import '../src/representations.js';
import models from '../assets/landmark-model-inventory.json' with {type:'json'};
const base={division:'All',discs:true,tissues:false,inScope:true};
const disc={name:'Intervertebral disc L3-L4',tissue:true};
function render(term,{discs=true,tissues=false,isolated=false,hidden=new Set(),division='All',ghost=false}={}){
 const r=term.representation,selected=m=>matches(r.parentPattern||term.pattern,m.name),states=new Map(),levels=new Set();
 for(const m of models.filter(m=>!m.detailGroup)){
  const s={...base,division,discs,tissues,isolated,ghost,hidden:hidden.has(m.name),selected:selected(m),isolateContext:!!r.isolateContext,context:(r.contextPatterns||[]).some(p=>matches(p,m.name)),inScope:meshRegion(m.name)===term.region};states.set(m,s);
  if(vertebralLevel(m.name)&&adultVisibility({name:m.name,tissue:!!m.asset?.includes('tissues')||/disc|pulposus|ligament|artery/i.test(m.name)},{...s,hidden:false}).visible)levels.add(vertebralLevel(m.name));
 }
 return [...states].map(([m,s])=>({name:m.name,...adultVisibility({name:m.name,tissue:/disc|pulposus|ligament|artery/i.test(m.name)},{...s,discContext:betweenVisibleVertebrae(m.name,levels)})}));
}
test('all 23 real discs remain present with optional tissues off, independently of camera direction',()=>{
 const discs=models.filter(m=>isIntervertebralDisc(m.name));assert.equal(discs.length,23);
 for(const m of discs){assert.equal(discLevels(m.name).length,2);assert.equal(adultVisibility({name:m.name,tissue:true},base).visible,true,m.name);assert.equal(meshDivision(m.name),'Axial');}
 assert.equal(adultVisibility(disc,{...base,discs:false,tissues:true}).visible,false);
 assert.equal(adultVisibility({name:'Anterior cruciate ligament.r',tissue:true},base).visible,false);
});
test('curvatures and paired-vertebra landmarks include the real intervening discs',()=>{
 const expectations={'cervical-curvature':5,'thoracic-curvature':11,'lumbar-curvature':4,'intervertebral-foramen':1,'vertebral-canal':4};
 for(const [id,count]of Object.entries(expectations)){const t=allTerms.find(t=>t.id===id);const visible=render(t).filter(m=>m.visible&&isIntervertebralDisc(m.name));assert.equal(visible.length,count,id);assert.equal(render(t,{discs:false}).filter(m=>m.visible&&isIntervertebralDisc(m.name)).length,0,id+' respects explicit off');}
});
test('transitional discs belong to both adjoining regions without assigning all lumbar discs to pelvis',()=>{
 assert.deepEqual(discAreas('Intervertebral disc C7-T1'),['neck','thoracic-spine']);assert.deepEqual(discAreas('Intervertebral disc T12-L1'),['thoracic-spine','lower-back']);assert.deepEqual(discAreas('Intervertebral disc L5-S1'),['lower-back','pelvis']);
 assert.ok(inArea('Intervertebral disc C7-T1','thoracic-spine'));assert.ok(inArea('Intervertebral disc T12-L1','lower-back'));assert.ok(inArea('Intervertebral disc L5-S1','pelvis'));assert.ok(!inArea('Intervertebral disc L3-L4','pelvis'));
 assert.equal(vertebralLevel('Atlas (C1)'),'C1');assert.equal(vertebralLevel('Sacrum'),'S1');assert.equal(betweenVisibleVertebrae(disc.name,new Set(['L3','L4'])),true);assert.equal(betweenVisibleVertebrae(disc.name,new Set(['L3'])),false);
 assert.deepEqual(tissueAreas('Nucleus pulposus T12-L1'),['thoracic-spine','lower-back']);
});
test('isolation, division and peeling remain deliberate; selected disc targets stay visible',()=>{
 assert.equal(adultVisibility(disc,{...base,isolated:true}).visible,false);
 assert.equal(adultVisibility(disc,{...base,division:'Appendicular'}).visible,false);
 assert.equal(adultVisibility(disc,{...base,hidden:true,selected:true}).visible,false);
 assert.equal(adultVisibility(disc,{...base,activeDetail:'drawer-knee',selected:true}).visible,false);
 assert.equal(adultVisibility(disc,{...base,discs:false,selected:true,isolated:true}).visible,true);
 assert.equal(adultVisibility(disc,{...base,isolateContext:true,inScope:false,discContext:false}).visible,false);
});
test('X-ray disc context remains legible while an internal nucleus target can still be exposed',()=>{
 assert.equal(adultVisibility(disc,{...base,ghost:true}).opacity,.5);
 assert.equal(adultVisibility(disc,{...base,ghost:true,innerDiscTarget:true}).opacity,.12);
 assert.equal(adultVisibility(disc,{...base,ghost:true,selected:true}).opacity,1);
});
test('peeling a vertebra retains its neighboring discs; explicit disc peeling is respected',()=>{
 const t=allTerms.find(t=>t.id==='lumbar-curvature');assert.equal(render(t,{hidden:new Set(['Vertebra L3'])}).filter(m=>m.visible&&isIntervertebralDisc(m.name)).length,4);
 const hidden=new Set(['Vertebra L3','Intervertebral disc L3-L4']);assert.equal(render(t,{hidden}).filter(m=>m.visible&&isIntervertebralDisc(m.name)).length,3);
});
test('surface guides cannot float after their parent is peeled, filtered or replaced by another specimen',()=>{
 const guide={focusFor:['infraspinous-fossa'],focusParent:'Scapula.r'},state={selectedIds:['infraspinous-fossa'],activeDetail:null,visibleParents:new Set(['Scapula.r'])};assert.equal(focusGuideVisible(guide,state),true);assert.equal(focusGuideVisible(guide,{...state,visibleParents:new Set()}),false);assert.equal(focusGuideVisible(guide,{...state,selectedIds:['lesser-tubercle']}),false);
 assert.equal(focusGuideVisible(guide,{...state,assessmentTask:'locate',answerRevealed:false}),false,'Do not reveal a locating key through its highlight');assert.equal(focusGuideVisible(guide,{...state,assessmentTask:'locate',answerRevealed:true}),true);assert.equal(focusGuideVisible(guide,{...state,assessmentTask:'identify'}),true);
 const teaching={focusFor:['superior-and-middle-nasal-conchae'],focusParent:'Superior concha of right ethmoid',focusSpecimen:'ethmoid-conchae'},visibleParents=new Set([teaching.focusParent]);assert.equal(focusGuideVisible(teaching,{selectedIds:teaching.focusFor,visibleParents,activeDetail:'ethmoid-conchae'}),true);assert.equal(focusGuideVisible(teaching,{selectedIds:teaching.focusFor,visibleParents,activeDetail:'drawer-knee'}),false);
});
test('nose cartilages and fibrous tissues retain appropriate regional and tissue identities',()=>{
 for(const name of ['Major alar cartilage.r','Lateral process of nasal septal cartilage.l','Nasal septal cartilage'])assert.equal(meshRegion(name),'Skull',name);
 for(const name of ['Flexor retinaculum of wrist.r','Plantar tendon sheath of fibularis longus.r'])assert.equal(isBone(name),false,name);
});
test('macro thorax and pelvis views retain their axial attachment context',()=>{
 for(let n=1;n<=12;n++)assert.equal(meshInRegion('Vertebra T'+n,'Spine','Thorax'),true);
 assert.equal(meshInRegion('Vertebra C7','Spine','Thorax'),false);assert.equal(meshInRegion('Vertebra L5','Spine','Pelvis'),true);assert.equal(meshInRegion('Vertebra L4','Spine','Pelvis'),false);
 assert.equal(meshInRegion('Sacrum','Spine','Pelvis'),true);
});
