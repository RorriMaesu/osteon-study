import test from 'node:test';
import assert from 'node:assert/strict';
import {allTerms,textbookTerms,matches} from '../src/data.js';
import {pointKinds} from '../src/representations.js';
import models from '../assets/landmark-model-inventory.json' with {type:'json'};

test('every textbook feature opens a labeled 3D representation with finite coordinates',()=>{
 for(const t of textbookTerms){const r=t.representation;assert.ok(r.kind==='mesh'||pointKinds.includes(r.kind),t.name);
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

test('newborn, microscopic anatomy and unresolved source morphology use explicit teaching models',()=>{
 const get=name=>textbookTerms.find(t=>t.name===name)?.representation;
 for(const name of ['Anterior fontanelle','Posterior fontanelle','Central canal','Canaliculi','Round window','Bifid spinous process','Sacral canal','Sacral hiatus','Costal groove']){const r=get(name);assert.equal(r.kind,'teaching-pin',name);assert.ok(r.detailGroup,name);assert.ok(r.note.length>60,name);}
 assert.equal(get('Oval window').detailGroup,'inner-ear');assert.equal(get('Oval window').kind,'3d-landmark');
 assert.notEqual(get('Round window').detailGroup,get('Oval window').detailGroup);
 const conchae=['Superior nasal concha','Middle nasal concha'].map(get);assert.notDeepEqual(conchae[0].points[0].point,conchae[1].points[0].point);assert.ok(conchae.every(r=>r.cutaway?.constant===-.002));
});
