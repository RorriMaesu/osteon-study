import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {developmentMotions,mountDevelopmentMotion} from '../src/organ-motion-development.js';
import {specimenMotionRoute} from '../src/ap3-specimen-animations.js';
import {specimens} from '../src/ap3-specimens-catalog.js';
import {metricBar} from '../src/organ-metric-scale.js';

test('guided developmental phases emphasize their actual component meshes and restore their materials',async()=>{
  for(const entry of developmentMotions){
    const buf=await readFile(new URL('../'+entry.asset,import.meta.url));
    const {scene:model}=await new GLTFLoader().parseAsync(buf.buffer.slice(buf.byteOffset,buf.byteOffset+buf.byteLength),'');
    const meshes=new Map(),colors=new Map();
    for(const name of [...entry.targets,...entry.context]){
      const mesh=model.getObjectByName(name);mesh.material=mesh.material.clone();
      meshes.set(name,[mesh]);colors.set(mesh,mesh.material.color.getHex());
    }
    const motion=mountDevelopmentMotion(entry,{model,invalidate(){}},meshes);
    for(const [i,phase] of entry.phases.entries()){
      motion.set(phase.at);
      for(const key of phase.members)assert.equal(meshes.get(key)[0].material.emissiveIntensity,.23,entry.id+' '+i+' '+key);
    }
    motion.dispose();for(const [mesh,original] of colors)assert.equal(mesh.material.color.getHex(),original);
  }
});
test('the entire blastocyst has independent study access and Carnegie comparison preserves a metric scale',()=>{
  const specimen=specimens.find(s=>s.id==='cleavage-implantation'),whole=specimen.targets.find(t=>t.id==='whole_blastocyst');
  assert.deepEqual(whole.meshes,['trophoblast','blastocoel','inner_cell_mass']);
  assert.ok(whole.meshes.every(raw=>specimen.targets.some(t=>!t.assembly&&t.id===raw)));
  assert.equal(specimenMotionRoute(developmentMotions.find(e=>e.id===specimen.id),whole.id),'organs/cleavage-implantation/step-4');
  const near=metricBar(600,38,.04),far=metricBar(600,38,.08);
  assert.ok(near.pixels<=74&&far.pixels<=74);
  assert.equal(near.pixels/near.mm,2*far.pixels/far.mm);
});
