import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {Vector3} from 'three';
import {currentPhase,createOrganMotion,motionById} from '../src/organ-atlas-catalog.js';
import {specimenAnimations} from '../src/ap3-specimen-animations.js';
import {drawVentilation,drawTubularCell} from '../src/organ-acid-base-diagrams.js';

for(const [spring,id] of [['respiratory-buffer','respiratory-acid-base'],['renal-buffer','renal-acid-base']]){
  test(spring+' opens the chapter 26 activity and moves the tracer in the indicated direction',async()=>{
    const entry=motionById.get(id);
    assert.equal(specimenAnimations({id:spring,asset:entry.asset})[0],entry);
    const raw=readFileSync(new URL('../'+entry.asset,import.meta.url));
    const {scene:model}=await new GLTFLoader().parseAsync(raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength),'');
    const byName=new Map([...entry.targets,...entry.context].map(n=>[n,[model.getObjectByName(n)]]));
    for(const [n,[mesh]] of byName)assert(mesh?.isMesh,'missing '+n);
    const motion=createOrganMotion(entry,{model,invalidate(){}},byName);
    const traces=entry.effects.filter(e=>e.mode==='trace'),markers=model.getObjectByName('Visceral process indicators').children.filter(c=>c.isGroup);
    for(const [i,trace] of traces.entries()){
      const [start,end]=trace.span;motion.set(start);const p=markers[i].position.clone();
      assert(p.distanceTo(new Vector3(...trace.points[0]))<1e-5);
      motion.set(end);assert(markers[i].position.distanceTo(new Vector3(...trace.points.at(-1)))<1e-5);
      assert(p.distanceTo(markers[i].position)>.1);
    }
    if(id==='respiratory-acid-base'){
      const counts=entry.phases.map((_,idx)=>traces.filter(e=>currentPhase(entry,(e.span[0]+e.span[1])/2)===idx).length);
      assert(counts[1]<counts[0]&&counts[0]<counts[2]);
    }
    motion.dispose();assert.equal(model.getObjectByName('Visceral process indicators'),undefined);
  });
}

test('the companion reports the matched ventilation and renal transport direction for each scenario',()=>{
  const c={fillText(){},fillRect(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},arc(){},fill(){}};
  assert.match(drawVentilation(c,.38,1),/CO₂ retention increases H⁺.*Arterial PCO₂ rises.*pH falls/);
  assert.match(drawVentilation(c,.9,2),/Arterial PCO₂ falls.*pH rises/);
  assert.match(drawTubularCell(c,.1,0),/CO₂.*diffuse into the cell/);
  assert.match(drawTubularCell(c,.3,1),/reclaims filtered base/);
  assert.match(drawTubularCell(c,.6,2),/HCO₃⁻ toward blood/);
  assert.match(drawTubularCell(c,.9,3),/pendrin.*More bicarbonate is excreted/);
});
