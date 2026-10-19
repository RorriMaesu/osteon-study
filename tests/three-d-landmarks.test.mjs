import test from 'node:test';
import assert from 'node:assert/strict';
import {allTerms,textbookTerms,matches} from '../src/data.js';
import {pointKinds} from '../src/representations.js';
import models from '../assets/landmark-model-inventory.json' with {type:'json'};

test('every textbook feature has finite 3D references or an explicit source-first accuracy hold',()=>{
 for(const t of textbookTerms){const r=t.representation;assert.ok(r.kind==='mesh'||pointKinds.includes(r.kind)||(r.kind==='reference'&&r.retiredModel&&r.assessment==='learn-only'),t.name);
  if(!pointKinds.includes(r.kind))continue;
  assert.ok(r.points.length>0&&r.points.length<=4,t.name);
  for(const p of r.points)assert.ok(Array.isArray(p.point)&&p.point.length===3&&p.point.every(Number.isFinite),t.name);
  if(r.view){assert.equal(r.view.direction.length,3,t.name);assert.ok(r.view.direction.every(Number.isFinite),t.name);assert.ok(r.view.distance>0,t.name);}
  if(r.cutaway)assert.equal(typeof r.cutaway,'object',t.name);
 }
});

test('3D references resolve actual model groups and stated parent anatomy',()=>{
 for(const t of allTerms.filter(t=>pointKinds.includes(t.representation.kind))){const r=t.representation;
  const found=models.filter(m=>r.detailGroup?m.detailGroup===r.detailGroup&&(!r.object||m.name.startsWith(r.object)):!m.detailGroup&&matches(r.parentPattern||t.pattern,m.name));
  assert.ok(found.length,t.name+' missing parent/model');
  // An opening can lie in a void; test its anatomical bounds rather than invent a surface snap.
  const bounds={min:[0,1,2].map(i=>Math.min(...found.map(m=>m.min[i]))),max:[0,1,2].map(i=>Math.max(...found.map(m=>m.max[i])))};
  for(const p of r.points)assert.ok(p.point.every((v,i)=>v>=bounds.min[i]-(r.kind==='source-pin'?.015:.003)&&v<=bounds.max[i]+(r.kind==='source-pin'?.015:.003)),t.name+' outside parent bounds');
 }
});

test('native sacral spaces, explanatory microscopy and withdrawn models remain distinct',()=>{
 const get=name=>textbookTerms.find(t=>t.name===name)?.representation;
 for(const name of ['Central canal','Canaliculi','Bifid spinous process','Costal groove']){const r=get(name);assert.equal(r.kind,'teaching-pin',name);assert.ok(r.detailGroup,name);assert.ok(r.note.length>60,name);}
 for(const name of ['Anterior fontanelle','Posterior fontanelle','Round window']){const r=get(name);assert.equal(r.kind,'reference',name);assert.equal(r.assessment,'learn-only');assert.equal(r.retiredModel,true);assert.ok(r.reviewNotice.length>60);}
 for(const name of ['Hypoglossal canal','Foramen spinosum']){const r=get(name);assert.equal(r.kind,'3d-landmark');assert.equal(r.reviewStatus,'native-opening-verified');assert.equal(r.refinement,null);assert.ok(r.verification.unblockedRay || r.verification.unblockedRayFile);}
 for(const name of ['Sacral canal','Sacral hiatus']){const r=get(name);assert.equal(r.kind,'3d-landmark');assert.equal(r.object,'Sacrum native neural passage');assert.match(r.note,/Native|native/);}
 assert.equal(get('Oval window').detailGroup,'inner-ear');assert.equal(get('Oval window').kind,'3d-landmark');
 assert.notEqual(get('Round window').detailGroup,get('Oval window').detailGroup);
 const conchae=['Superior nasal concha','Middle nasal concha'].map(get);assert.notDeepEqual(conchae[0].points[0].point,conchae[1].points[0].point);assert.ok(conchae.every(r=>r.cutaway?.constant===-.002));
});
