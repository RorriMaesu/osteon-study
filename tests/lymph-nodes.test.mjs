import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {lymphNodeFiles,lymphNodeRecords,lymphNodeTerms,lymphNodeByKey,lymphNodeInScope,lymphNodeScopeFiles} from '../src/lymph-node-data.js';
import {areas} from '../src/exploration.js';
import {atlasMatches} from '../src/atlas-search.js';

test('shipped nodes match their versioned regional models and review status',()=>{
 const ids=new Set();
 assert.equal(lymphNodeByKey.size,lymphNodeRecords.length);
 for(const [bucket,file] of Object.entries(lymphNodeFiles)){
  const glb=readFileSync(new URL('../assets/lymph-nodes-'+bucket+'.glb',import.meta.url));
  assert.equal(glb.byteLength,file.bytes);
  assert.equal(createHash('sha256').update(glb).digest('hex'),file.sha256);
  const nodes=JSON.parse(glb.toString('utf8',20,20+glb.readUInt32LE(12))).nodes;
  const keys=nodes.filter(n=>n.mesh!=null).map(n=>n.extras?.lymphNodeKey).sort();
  const expected=lymphNodeRecords.filter(r=>bucket==='overview'?r.overview:r.bucket===bucket&&r.status!=='withheld');
  assert.deepEqual(keys,expected.map(r=>r.key).sort(),bucket);
  if(bucket!=='overview')for(const key of keys){assert.ok(!ids.has(key),key);ids.add(key);}
 }
 assert.equal(ids.size,lymphNodeTerms.length);
 for(const r of lymphNodeRecords){
  assert.equal(ids.has(r.key),r.status!=='withheld',r.key);
  assert.ok(r.areas.length&&r.areas.every(a=>areas[a]),r.key);
  assert.ok(r.faces>0&&r.bounds.every(p=>p.every(Number.isFinite)),r.key);
  assert.ok(r.bounds[0].every((n,i)=>n<=r.bounds[1][i]),r.key);
  if(r.status==='landmark-checked')assert.ok(r.references.length&&r.cue,r.key);
  if(r.status==='withheld')assert.ok(r.reason&&!r.overview,r.key);
 }
});

test('node search retains side and source selection while regional loads follow current focus',()=>{
 const result=atlasMatches(lymphNodeTerms,'deep popliteal');
 assert.deepEqual(result.filter(t=>t.name.startsWith('Deep')).map(t=>t.name),['Deep popliteal nodes (left)','Deep popliteal nodes (right)']);
 assert.ok(lymphNodeTerms.every(t=>t.representation.assessment==='learn-only'));
 const overview={region:'All regions',division:'All',focus:{}};
 assert.deepEqual(lymphNodeScopeFiles(overview),[]);
 const knee={...overview,region:'Lower limb',focus:{areaId:'knee',side:'r'}};
 assert.deepEqual(lymphNodeScopeFiles(knee),['lower-limb']);
 assert.equal(lymphNodeInScope(lymphNodeByKey.get('Deep popliteal nodes.r'),knee),true);
 assert.equal(lymphNodeInScope(lymphNodeByKey.get('Deep popliteal nodes.l'),knee),false);
 assert.equal(lymphNodeInScope(lymphNodeByKey.get('Deep popliteal nodes.r'),{...knee,division:'Axial'}),false);
});
