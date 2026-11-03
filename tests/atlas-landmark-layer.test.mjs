import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {allTerms,terms} from '../src/data.js';
import '../src/representations.js';
import {teacherIds,atlasLandmarks,scopedLandmarks,findLandmarks,placeLabel,overlayAllowed,isOverlayLandmark,completeLandmarkContext} from '../src/atlas-landmark-data.js';
import {inArea} from '../src/exploration.js';
import {meshDivision,meshInRegion} from '../src/anatomy.js';
import authored from '../src/atlas-label-anchors.json' with {type:'json'};
import evidence from '../assets/atlas-label-evidence.json' with {type:'json'};
import models from '../assets/landmark-model-inventory.json' with {type:'json'};
import source from '../src/lab-list-source.json' with {type:'json'};

test('every teacher entry has an actual model anchor or an explicit infant/movement exception',()=>{
 assert.equal(teacherIds.size,177);assert.equal(authored.source,source.source.sha256);
 const missing=[];for(const t of terms.filter(t=>teacherIds.has(t.id))){if(!authored.anchors[t.id]?.length)missing.push(t.id);if(isOverlayLandmark(t))assert.ok(atlasLandmarks.some(x=>x.term.id===t.id),t.name);}
 assert.deepEqual(missing.sort(),['anterior-drawer','fontanelles','posterior-drawer']);
 const held=terms.filter(t=>teacherIds.has(t.id)&&t.representation.assessment==='learn-only');assert.deepEqual(held.map(t=>t.id).sort(),['ethmoidal-air-cells-and-sinus-openings','fontanelles']);
});
test('all source-authored opening and surface positions survive Blender annotation without snapping or mirroring',()=>{
 for(const t of allTerms.filter(t=>!t.representation.retiredModel&&t.representation.points?.length)){const actual=authored.anchors[t.id];assert.equal(actual.length,t.representation.points.length,t.name);t.representation.points.forEach((p,i)=>{assert.ok(actual[i].point.every((v,j)=>v===p.point[j]),t.name);assert.equal(actual[i].placement,'authored-reference');});}
});
test('each annotation resolves its stated shipped mesh and coordinate bounds in the correct specimen',()=>{
 for(const [id,points] of Object.entries(authored.anchors))for(const a of points){assert.ok(a.point.length===3&&a.point.every(Number.isFinite),id);const parents=models.filter(m=>m.name===a.parent&&(m.detailGroup||null)===(a.detailGroup||null));assert.ok(parents.length,id+': '+a.parent);const tolerance=allTerms.find(t=>t.id===id).representation.kind==='source-pin'?.015:.003,context=a.contextParents?models.filter(m=>a.contextParents.includes(m.name)&&(m.detailGroup||null)===(a.detailGroup||null)):parents,min=[0,1,2].map(i=>Math.min(...context.map(m=>m.min[i]))),max=[0,1,2].map(i=>Math.max(...context.map(m=>m.max[i])));assert.ok(a.point.every((v,i)=>v>=min[i]-tolerance&&v<=max[i]+tolerance),id+' outside its stated parent context');}
});
test('a right-side authored scapular landmark cannot appear on a left-only isolated scapula',()=>{
 const right=scopedLandmarks({visibleNames:new Set(['Scapula.r']),bone:'Scapula.r',side:'r'}),left=scopedLandmarks({visibleNames:new Set(['Scapula.l']),bone:'Scapula.l',side:'l'});assert.ok(right.some(x=>x.term.id==='coracoid-process'));assert.ok(!left.some(x=>x.term.id==='coracoid-process'));assert.ok(right.every(x=>x.viewAnchors.every(a=>a.parent==='Scapula.r')));
});
test('a composite opening is not labeled as complete when a contributing bone is absent',()=>{
 const term=allTerms.find(t=>t.id==='jugular-foramen');assert.ok(!completeLandmarkContext(term,new Set(['Occipital bone'])));assert.ok(completeLandmarkContext(term,new Set(['Occipital bone','Temporal bone.r'])));assert.ok(!scopedLandmarks({visibleNames:new Set(['Occipital bone'])}).some(x=>x.term.id===term.id));
});
test('the integrated teacher finder includes all required joint tissues, not just chapter 6–8 bone features',()=>{
 for(const t of terms.filter(t=>teacherIds.has(t.id)&&['ligament','joint','tissue','vessel'].includes(t.type))){assert.ok(findLandmarks({query:t.name}).some(x=>x.term.id===t.id),t.name);assert.ok(authored.anchors[t.id].length,t.name);}
 assert.ok(findLandmarks({query:'fontanels'}).some(x=>x.term.id==='fontanelles'&&x.retired));assert.ok(findLandmarks({kind:'joints'}).some(x=>x.term.id==='anterior-cruciate-ligament'));
});
test('regional navigation keeps the actual shoulder, hip, knee and spinal tissues with their anatomical context',()=>{
 for(const [name,area] of [['Conoid ligament.r','shoulder'],['Superior glenohumeral ligament.r','arm'],['Flexor retinaculum of wrist.r','hand'],['Ligament of head of femur.r','pelvis'],['Descending part of iliofemoral ligament.r','thigh'],['Anterior cruciate ligament.r','knee'],['Patellar ligament.r','knee'],['Vertebral artery.r','neck'],['Intervertebral disc L3-L4','lower-back']]){assert.ok(inArea(name,area,'r'),name);if(name.endsWith('.r')&&['shoulder','arm','hand','thigh','knee'].includes(area))assert.ok(!inArea(name,area,'l'),name+' wrong side');}
 assert.ok(!inArea('Anterior cruciate ligament.r','shoulder','r'));assert.ok(!inArea('Conoid ligament.r','foot','r'));
});
test('patellar ligament and wrist retinaculum remain appendicular and macro regions reveal their course tissues',()=>{
 assert.equal(meshDivision('Patellar ligament.r'),'Appendicular');assert.equal(meshDivision('Flexor retinaculum of wrist.r'),'Appendicular');assert.equal(meshDivision('Conoid ligament.r'),'Appendicular');assert.ok(meshInRegion('Anterior cruciate ligament.r','Joints','Lower limb'));assert.ok(meshInRegion('Conoid ligament.r','Joints','Upper limb'));assert.ok(!meshInRegion('Conoid ligament.r','Joints','Lower limb'));
});
test('sparse label placement stays within narrow viewports and never overlaps labels or reserved controls',()=>{
 for(const viewport of [{width:320,height:260,top:75},{width:850,height:440,top:80}]){const placed=[],reserved=[{x:160,y:150,bw:55,bh:24}];for(let i=0;i<10;i++){const p=placeLabel({x:160,y:150},{width:135,height:44},viewport,placed,reserved);if(!p)continue;assert.ok(p.x-p.bw>=0&&p.x+p.bw<=viewport.width);assert.ok(p.y-p.bh>=viewport.top&&p.y+p.bh<=viewport.height);for(const q of [...placed,...reserved])assert.ok(Math.abs(q.x-p.x)>=q.bw+p.bw||Math.abs(q.y-p.y)>=q.bh+p.bh);placed.push(p);}assert.ok(placed.length>0);}
});
test('named overlay labels are unavailable during assessments and source comparisons',()=>{
 assert.ok(overlayAllowed({}));for(const state of [{quiz:true},{referenceOpen:true},{assessment:true}])assert.ok(!overlayAllowed(state));
});
test('the Blender label asset contains matching annotation nodes and leaves the three anatomy assets unchanged',()=>{
 assert.match(evidence.blenderVersion,/^4\.5\./);assert.equal(evidence.geometryChanged,false);assert.match(evidence.backup,/^atlas-labels-/);
 for(const [file,hash]of Object.entries(evidence.sourceHashes))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(new URL('../assets/'+file,import.meta.url))).digest('hex'),hash,file);
 const bytes=fs.readFileSync(new URL('../assets/course-landmark-labels.glb',import.meta.url)),length=bytes.readUInt32LE(12),gltf=JSON.parse(bytes.subarray(20,20+length).toString()),nodes=gltf.nodes.filter(n=>n.extras?.termId);assert.equal(nodes.length,Object.values(authored.anchors).flat().length);assert.equal(gltf.meshes?.length||0,0);
 // Blender's GLTF exporter rounds near-zero transform components. The runtime
 // uses the unaltered JSON references; the editable GLB stays within 0.01 mm.
 for(const n of nodes){const a=authored.anchors[n.extras.termId].find(p=>p.parent===n.extras.parentAnatomy&&p.point.every((v,i)=>Math.abs(v-n.extras.pointWeb[i])<.000001));assert.ok(a,n.name);assert.ok(n.translation.every((v,i)=>Math.abs(v-a.point[i])<.00001),n.name);}
});
