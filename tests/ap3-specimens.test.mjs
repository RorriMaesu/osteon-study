import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {breathingFrame,renderSpecimen,specimens} from '../src/ap3-specimens.js';
import {descriptions} from '../src/ap3-specimens-descriptions.js';

const root=new URL('../',import.meta.url);
const cache=new Map();
function gltf(asset){
  if(cache.has(asset))return cache.get(asset);
  const buf=readFileSync(new URL(asset,root));
  assert.equal(buf.readUInt32LE(0),0x46546c67,asset);
  assert.equal(buf.length,buf.readUInt32LE(8),asset);
  const json=JSON.parse(buf.subarray(20,20+buf.readUInt32LE(12)).toString());
  const names=new Map();
  function visit(index){
    const node=json.nodes[index];
    if(node.mesh!==undefined)names.set(node.name,json.meshes[node.mesh]);
    for(const child of node.children||[])visit(child);
  }
  for(const n of json.scenes[json.scene||0].nodes)visit(n);
  const model={json,names};cache.set(asset,model);return model;
}

test('spring selectable targets resolve to rendered meshes with finite surface extents',()=>{
  assert.deepEqual([...new Set(specimens.map(s=>s.chapter))],[21,22,23,24,25,26,27,28]);
  assert.equal(new Set(specimens.map(s=>s.id)).size,specimens.length);
  for(const s of specimens){
    const {json,names}=gltf(s.asset);
    for(const t of s.targets){
      assert.ok(t.label&&t.meshes.length,s.id);
      for(const key of t.meshes){
        const mesh=names.get(key);
        assert.ok(mesh,s.id+'/'+key);
        for(const p of mesh.primitives){
          const positions=json.accessors[p.attributes.POSITION];
          assert.ok(positions.count>=3,key);
          assert.ok(positions.max.every(Number.isFinite)&&positions.min.every(Number.isFinite),key);
          assert.ok(positions.max.filter((n,i)=>n>positions.min[i]).length>=2,key);
        }
      }
    }
    for(const route of s.routes||[])for(const stop of route.steps)assert.ok(s.targets.some(t=>t.id===stop),stop);
  }
});

test('six practical preparations have two valid target/prediction pairs and complete spatial alternatives',()=>{
  const chapters=[];
  for(const s of specimens.filter(s=>s.stations.length)){
    chapters.push(s.chapter);assert.equal(s.stations.length,2);
    assert.equal(new Set(s.stations.map(q=>q.target)).size,2);
    for(const q of s.stations){
      assert.ok(s.targets.some(t=>t.id===q.target));assert.ok(q.options[q.answer]);assert.ok(q.prediction&&q.why&&q.prompt);
    }
    for(const t of s.targets)assert.ok(descriptions[s.id][t.id]?.length>20,s.id+'/'+t.id);
    const html=renderSpecimen(s.id,{blind:true});
    assert.ok(html.includes('data-ap3-descriptions'));assert.ok(!html.includes(s.description));
    assert.ok(!html.includes('data-ap3-route'));assert.ok(!html.includes('data-ap3-breath'));
  }
  assert.deepEqual(chapters,[21,22,23,25,27,28]);
});

test('volume derivative and airway pressure drive the same timed breathing model',()=>{
  for(const t of [0,2,5]){
    assert.equal(breathingFrame(t).flow,0);assert.equal(breathingFrame(t).alveolar,0);
  }
  assert.equal(breathingFrame(2).volume,3);assert.equal(breathingFrame(5).volume,2.5);
  for(const t of [.3,.9,1.7,2.7,3.5,4.9]){
    const b=breathingFrame(t),dt=.0001;
    const derivative=(breathingFrame(t+dt).volume-breathingFrame(t-dt).volume)/(2*dt);
    assert.ok(Math.abs(b.flow-derivative)<1e-6);assert.equal(Math.sign(b.flow),-Math.sign(b.alveolar));
    assert.ok(b.pleural<0);
  }
});

