import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import manifest from '../src/muscle-models.json' with {type:'json'};
import {componentVisible,muscleBoneContext,muscleFacts} from '../src/muscle-data.js';

test('every shipped muscle component retains source identity, finite bounds and a matching asset',()=>{
 assert.equal(new Set(manifest.components.map(c=>c.id)).size,manifest.components.length);assert.equal(manifest.license,'CC BY-SA 4.0');
 for(const [region,asset]of Object.entries(manifest.assets)){
  const binary=fs.readFileSync(new URL('../assets/'+asset.file,import.meta.url));assert.equal(createHash('sha256').update(binary).digest('hex'),asset.sha256);assert.equal(binary.readUInt32LE(0),0x46546c67);
  const json=JSON.parse(binary.subarray(20,20+binary.readUInt32LE(12))),ids=json.nodes.filter(n=>n.mesh!==undefined).map(n=>n.extras?.muscleId);
  assert.deepEqual(new Set(ids),new Set(manifest.components.filter(c=>c.region===region).map(c=>c.id)));assert.equal(ids.length,asset.components);
 }
 for(const c of manifest.components){assert.ok(c.sourceName&&c.parents.length);assert.equal(c.assessment,'learn-only');assert.equal(c.bounds.min.length,3);for(let i=0;i<3;i++)assert.ok(Number.isFinite(c.bounds.min[i])&&Number.isFinite(c.bounds.max[i])&&c.bounds.min[i]<=c.bounds.max[i]);}
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
