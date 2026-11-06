import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {nerveByKey,nerveFiles,nerveInScope,nerveRecords,nerveScopeFiles,nerveTerms} from '../src/nerve-data.js';
import {atlasMatches} from '../src/atlas-search.js';
import {areas} from '../src/exploration.js';

test('nerve GLBs match their manifest and the overview is a subset of detailed anatomy',()=>{
 const totals=new Map();
 for(const [key,file] of Object.entries(nerveFiles)){
  const glb=readFileSync(new URL('../assets/nerves-'+key+'.glb',import.meta.url));
  assert.equal(glb.byteLength,file.bytes);
  assert.equal(createHash('sha256').update(glb).digest('hex'),file.sha256);
  const nodes=JSON.parse(glb.toString('utf8',20,20+glb.readUInt32LE(12))).nodes;
  const keys=nodes.filter(n=>n.mesh!=null).map(n=>n.extras?.nerveKey).sort();
  assert.deepEqual(keys,nerveRecords.filter(r=>key==='overview'?r.overview:r.bucket===key).map(r=>r.key).sort(),key);
  if(key!=='overview')for(const id of keys)totals.set(id,(totals.get(id)||0)+1);
 }
 assert.equal(nerveByKey.size,nerveRecords.length);
 assert.equal(new Set(nerveTerms.map(term=>term.id)).size,nerveTerms.length);
 for(const r of nerveRecords){
  assert.equal(totals.get(r.key),1,r.key);
  assert.ok(r.areas.length&&r.areas.every(a=>areas[a]),r.key);
  assert.ok(r.faces>0&&r.bounds.flat().every(Number.isFinite),r.key);
  assert.ok(r.stops.every(stop=>stop.point.every(Number.isFinite)),r.key);
 }
});

test('all 12 bilateral cranial nerves are individually searchable by number',()=>{
 for(const roman of ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII']){
  const exact=atlasMatches(nerveTerms,'CN '+roman).filter(term=>term.aliases.includes('CN '+roman));
  assert.equal(exact.length,2,roman);
  assert.ok(exact.some(t=>t.name.endsWith('(left)'))&&exact.some(t=>t.name.endsWith('(right)')));
 }
 assert.deepEqual(atlasMatches(nerveTerms,'common peroneal nerve').slice(0,2).map(t=>t.name),['Common fibular nerve (left)','Common fibular nerve (right)']);
});

test('local files follow the current region and long nerves remain discoverable along their course',()=>{
 const median=nerveByKey.get('Median nerve.r');
 const view={region:'All regions',division:'All',focus:{areaId:null}};
 assert.deepEqual(nerveScopeFiles(view),[]);
 const hand={...view,region:'Upper limb',focus:{areaId:'hand',side:'r'}};
 assert.deepEqual(nerveScopeFiles(hand),['upper-limb']);
 assert.equal(nerveInScope(median,hand),true);
 assert.equal(nerveInScope(median,{...hand,focus:{areaId:'hand',side:'l'}}),false);
 assert.equal(nerveInScope(median,{...view,division:'Axial'}),false);
 assert.equal(nerveInScope(nerveByKey.get('Vagus nerve (X).r'),{...view,focus:{areaId:'thorax'}}),true);
 assert.ok(median.stops.some(s=>s.name==='Wrist'));
});

test('the eleven bilateral intercostal levels stay distinct from the spinal nerves and donor segments identify their extent',()=>{
 const intercostals=nerveRecords.filter(r=>/^Intercostal nerve T\d+$/.test(r.name));
 assert.equal(intercostals.length,22);
 for(const side of ['l','r'])for(let level=1;level<=11;level++){
  const r=nerveByKey.get('Intercostal nerve T'+level+'.'+side);
  assert.equal(r.bucket,'trunk');
  assert.equal(r.sourceObject,'Intercostal nerves.'+side);
 }
 const phrenic=nerveByKey.get('Phrenic nerve.r');
 assert.equal(phrenic.provider,'leiden-plexus');
 assert.ok(phrenic.partial.includes('thoracic inlet'));
 assert.ok(nerveByKey.has('Lumbar plexus.r')&&nerveByKey.has('Sacral plexus.r'));
});

