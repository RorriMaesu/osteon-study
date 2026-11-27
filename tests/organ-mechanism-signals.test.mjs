import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Scene} from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {visceralOrgans,mountVisceralMotion} from '../src/organ-motion-visceral.js';
import {regulationOrgans} from '../src/organ-motion-regulation.js';
import {foldCover,pinealOutput,filtrationReading} from '../src/organ-mechanism-signals.js';

test('the illustrative pineal trace is low by day, rises at night and returns smoothly',()=>{
  assert.equal(pinealOutput(0),pinealOutput(.32));
  assert.ok(pinealOutput(.59)>pinealOutput(.39));
  assert.ok(pinealOutput(.66)>pinealOutput(.93));
  assert.ok(Math.abs(pinealOutput(1)-pinealOutput(0))<1e-9);
});
test('the lower vocal-fold margin opens first and the upper margin closes later',()=>{
  assert.equal(foldCover(.1).voicing,false);
  assert.equal(foldCover(.52).voicing,true);
  assert.ok(foldCover(.504).inferior>foldCover(.504).superior);
  assert.ok(foldCover(.545).superior>foldCover(.545).inferior);
  assert.equal(foldCover(.95).voicing,false);
});
test('the myocardial capillary phase links a regional tissue cue to the microscopic view',()=>{
  const entry=regulationOrgans.find(e=>e.id==='coronary-circulation'),p=entry.phases;
  assert.match(p[1].label,/Arterial/);assert.match(p[2].label,/capillaries/);assert.match(p[3].label,/veins/);
  for(const name of p[2].tissue)assert.ok(entry.context.includes(name));
  assert.equal(p[2].sites.length,0);
});
test('the real filtration tracer and its path stop before a red cell or albumin can enter filtrate',async()=>{
  const entry=visceralOrgans.find(e=>e.id==='glomerular-filtration');
  const bytes=readFileSync(new URL('../'+entry.asset,import.meta.url));
  const {scene:model}=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
  const scene=new Scene();scene.add(model);
  const byName=new Map(entry.targets.map(name=>[name,[model.getObjectByName(name)]]));
  const motion=mountVisceralMotion(entry,{scene,model,invalidate(){}},byName);
  const group=model.getObjectByName('Visceral process indicators'),marker=group.children.find(c=>c.isGroup),line=group.children.find(c=>c.isLine);
  for(const kind of ['albumin','erythrocyte']){
    motion.set(.4,kind);const first=marker.position.clone();
    motion.set(1,kind);assert.ok(marker.position.equals(first));assert.ok(marker.position.y>.35);
    assert.ok(line.geometry.drawRange.count<12);
    assert.match(filtrationReading(kind,1).text,/stays/);
  }
  for(const kind of ['glucose','water']){
    motion.set(1,kind);assert.ok(marker.position.y<-.35);assert.equal(line.geometry.drawRange.count,65);
    assert.match(filtrationReading(kind,1).text,/capsular space/);
  }
  motion.dispose();
});
