import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import manifest from '../src/muscle-models.json' with {type:'json'};
import {componentVisible,muscleBoneContext,muscleFacts,muscleLabelPosition} from '../src/muscle-data.js';
import {muscleKind,muscleGroup} from '../src/muscle-taxonomy.js';
import {muscleCoverage,auditMuscleCoverage} from '../src/muscle-coverage.js';

test('every shipped muscle component retains source identity, finite bounds and a matching asset',()=>{
 assert.equal(new Set(manifest.components.map(c=>c.id)).size,manifest.components.length);assert.equal(manifest.license,'CC BY-SA 4.0');
 for(const [region,asset]of Object.entries(manifest.assets)){
  const binary=fs.readFileSync(new URL('../assets/'+asset.file,import.meta.url));assert.equal(createHash('sha256').update(binary).digest('hex'),asset.sha256);assert.equal(binary.readUInt32LE(0),0x46546c67);
  const json=JSON.parse(binary.subarray(20,20+binary.readUInt32LE(12))),ids=json.nodes.filter(n=>n.mesh!==undefined).map(n=>n.extras?.muscleId);
  assert.deepEqual(new Set(ids),new Set(manifest.components.filter(c=>c.region===region).map(c=>c.id)));assert.equal(ids.length,asset.components);
 }
 for(const c of manifest.components){assert.ok(c.sourceName&&c.parents.length);assert.equal(c.assessment,'learn-only');assert.equal(c.bounds.min.length,3);for(let i=0;i<3;i++)assert.ok(Number.isFinite(c.bounds.min[i])&&Number.isFinite(c.bounds.max[i])&&c.bounds.min[i]<=c.bounds.max[i]);}
});

test('tissue classification exposes tensor fasciae latae and excludes connective coverings',()=>{
 for(const c of manifest.components){assert.equal(c.kind,muscleKind(c.sourceName),c.id);assert.equal(c.muscleName,muscleGroup(c),c.id);}
 for(const side of ['right','left']){
  const c=manifest.components.find(c=>c.sourceName==='Tensor fasciae latae.'+(side==='right'?'r':'l'));assert.equal(c.kind,'muscle');
  assert.ok(componentVisible(c,{enabled:true,region:c.region,side,depth:'all',support:false,hidden:new Set()}));assert.equal(c.depth,'superficial');
 }
 for(const term of ['Linea alba','Iliotibial tract.r','Medial intermuscular septum of arm.r','Tendinous arch of levator ani.l','Synovial sheaths of digits of hand.r'])assert.equal(muscleKind(term),'support',term);
 assert.equal(muscleCoverage.muscleParts,472);assert.equal(muscleCoverage.supportParts,207);
});
test('reviewed whole-muscle grouping preserves separate heads and trapezius parts',()=>{
 for(const [name,count]of [['Trapezius muscle',3],['Pronator teres muscle',2],['Flexor carpi ulnaris',2],['Adductor pollicis muscle',2]])for(const side of ['right','left'])assert.equal(manifest.components.filter(c=>c.kind==='muscle'&&c.muscleName===name&&c.side===side).length,count,name+' '+side);
});
test('coverage separates missing names, partial geometry and unresolved neighboring anatomy',()=>{
 const row=id=>muscleCoverage.rows.find(r=>r.id===id);
 assert.equal(muscleCoverage.referenceChecks,226);assert.equal(row('ta2-2520').status,'no-named-mesh');assert.equal(row('ta2-2602').status,'named-geometry');
 assert.equal(row('ta2-2283').status,'needs-anatomical-review');assert.ok(row('ta2-2283').componentIds.some(id=>id.includes('spinalis-capitis')));
 for(const id of ['ta2-2534','ta2-2685'])assert.equal(row(id).status,'represented-by-components');assert.equal(row('ta2-2203').status,'partial-model');
 assert.equal(row('clinical-puborectalis').status,'needs-anatomical-review');assert.equal(muscleCoverage.geometryCertified,false);assert.ok(muscleCoverage.rows.every(r=>r.attachmentCertified===false));
 const fewer=auditMuscleCoverage(manifest.components.filter(c=>c.sourceName!=='Tensor fasciae latae.l'));assert.equal(fewer.rows.find(r=>r.ta2===2602).status,'side-review');
 const missingPart=auditMuscleCoverage(manifest.components.filter(c=>!c.sourceName.startsWith('Vastus medialis')));assert.equal(missingPart.rows.find(r=>r.ta2===2613).status,'no-named-mesh');
});
test('muscle captions avoid an open details drawer and stay above narrow viewers',()=>{
 const p=muscleLabelPosition({width:1028,height:500,ax:510,ay:240,rightEdge:690,labelWidth:250});assert.ok(p.x+125<690);assert.ok(Math.abs(p.x-510)>=125);
 assert.equal(muscleLabelPosition({width:1028,height:500,ax:760,ay:240,rightEdge:690}),null);
 const phone=muscleLabelPosition({width:390,height:650,ax:190,ay:300,labelWidth:250});assert.deepEqual(phone,{x:195,y:25});
});

test('recovered serial groups require every member on both sides and hide superseded aggregates',()=>{
 const repaired=manifest.components.filter(c=>c.sourceDataset==='BodyParts3D 4.3');assert.equal(repaired.length,14);
 for(const c of repaired){assert.ok(muscleFacts(c)?.origin&&muscleFacts(c)?.insertion&&muscleFacts(c)?.action);assert.equal(c.sourceLicense,'CC BY 4.0');const source=fs.readFileSync(new URL('../'+c.sourceFile,import.meta.url));assert.equal(createHash('sha256').update(source).digest('hex'),c.sourceSHA256);assert.ok(c.registration.heldOutValidation.length>=2);}
 const retired=manifest.components.filter(c=>c.retired);assert.equal(retired.length,4);
 for(const c of retired){assert.ok(c.supersededBy.every(id=>repaired.some(r=>r.id===id)));assert.equal(componentVisible(c,{enabled:true,region:'all',side:'both',depth:'all',support:true,hidden:new Set()}),false);}
 for(const [id,name]of [['ta2-2534','Palmar interossei muscles'],['ta2-2685','Lumbrical muscles of foot']]){
  const group=repaired.filter(c=>c.memberOf===name),right=group.filter(c=>c.side==='right');assert.equal(right.length,id==='ta2-2534'?3:4);assert.equal(new Set(right.map(c=>c.muscleName)).size,right.length);
  const partial=auditMuscleCoverage(manifest.components.filter(c=>c.id!==right[0].id));assert.equal(partial.rows.find(r=>r.id===id).status,'side-review');
  const absent=auditMuscleCoverage(manifest.components.filter(c=>c.muscleName!==right[0].muscleName));assert.equal(absent.rows.find(r=>r.id===id).status,'no-named-mesh');
 }
});
test('muscles respect assessment, side, layer, support and isolation visibility',()=>{
 const c=manifest.components.find(c=>c.side==='right'&&c.kind==='muscle'),s={enabled:true,region:c.region,side:'right',depth:'all',support:false,hidden:new Set(),selected:c.id};assert.ok(componentVisible(c,s));
 for(const extra of [{quiz:true},{activeDetail:'inner-ear'},{side:'left'},{enabled:false},{hidden:new Set([c.id])},{region:'missing'},{focused:true,selected:'other'}])assert.equal(componentVisible(c,{...s,...extra}),false,JSON.stringify(extra));
 assert.ok(componentVisible(c,{...s,focused:true,selected:'other',selectedIds:new Set([c.id])}));
 assert.equal(muscleBoneContext('Hip bone.r','shoulder-arm','right'),false);assert.equal(muscleBoneContext('Scapula.r','shoulder-arm','right'),true);assert.equal(muscleBoneContext('Scapula.l','shoulder-arm','right'),false);
});
test('the shoulder pilot contains both sides, separate heads and explicit attachment teaching limits',()=>{
 for(const name of ['biceps brachii','triceps brachii','deltoid','Brachialis','Subscapularis','Supraspinatus','Infraspinatus','Teres minor'])for(const side of ['left','right']){const c=manifest.components.find(c=>c.side===side&&c.sourceName.toLowerCase().includes(name.toLowerCase()));assert.ok(c,name+' '+side);assert.ok(muscleFacts(c)?.origin);}
 assert.ok(manifest.components.filter(c=>c.side==='right'&&/head of biceps brachii/.test(c.sourceName)).length===2);
});
test('regional atlas coverage preserves source sides and corrected anatomical grouping',()=>{
 assert.equal(manifest.components.length,683);assert.equal(Object.keys(manifest.assets).length,5);
 for(const c of manifest.components){if(c.side==='right')assert.ok(c.bounds.min[0]<.002,c.sourceName);if(c.side==='left')assert.ok(c.bounds.max[0]>-.002,c.sourceName);}
 const pectoralHeads=manifest.components.filter(c=>/head of pectoralis major/.test(c.sourceName));assert.ok(pectoralHeads.length);assert.ok(pectoralHeads.every(c=>c.region==='trunk-back'));
 const upper=manifest.components.filter(c=>c.name==='Upper (descending) part of trapezius'),lower=manifest.components.filter(c=>c.name==='Lower (ascending) part of trapezius');assert.equal(upper.length,2);assert.equal(lower.length,2);assert.ok(Math.min(...upper.map(c=>c.bounds.min[1]))>Math.min(...lower.map(c=>c.bounds.min[1])));
 const iliocostalis=manifest.components.find(c=>c.sourceName==='Iliocostalis colli muscle');assert.equal(iliocostalis.side,'left');
 const buccinators=manifest.components.filter(c=>c.sourceName.startsWith('Bucinator'));assert.equal(buccinators.length,2);assert.ok(buccinators.every(c=>c.name==='Buccinator muscle'&&c.nameCorrection));
 assert.equal(muscleBoneContext('Third costal cartilage.r','head-neck','right'),false);assert.equal(muscleBoneContext('Thyroid cartilage','head-neck','right'),true);assert.equal(muscleBoneContext('Vertebra C4','head-neck','right'),true);
});
