import {test} from 'node:test';
import assert from 'node:assert/strict';
import {specimens} from '../src/ap3-specimens.js';
import {organMotions} from '../src/organ-atlas-catalog.js';
import {specimenAnimations,animationForTarget} from '../src/ap3-specimen-animations.js';

const specimen=id=>specimens.find(s=>s.id===id);
test('spring specimens retain all original animation choices and link relevant gross and microscopic models',()=>{
  for(const s of specimens){
    const ids=specimenAnimations(s).map(e=>e.id);
    assert.equal(new Set(ids).size,ids.length);
    for(const entry of organMotions.filter(e=>e.asset===s.asset))assert(ids.includes(entry.id));
  }
  for(const [id,wanted] of [['immune-organs','spleen'],['nodes-abdomen','lymph-node'],['kidney','glomerular-filtration'],
    ['kidney','nephron-transit'],['lactating-unit','mammary-glands'],['placental-exchange','placenta']]){
    assert(specimenAnimations(specimen(id)).some(e=>e.id===wanted),id+' should link to '+wanted);
  }
});
test('selected structures lead to relevant tissue and sex-specific anatomy',()=>{
  for(const [id,target,wanted] of [['accessory-ducts','pancreas','pancreas'],['accessory-ducts','bile_duct','gallbladder'],
    ['pelvic-section','urethra','female-urethra'],['pelvic-section','vagina','vagina']]){
    const s=specimen(id);
    assert.equal(animationForTarget(s,target,specimenAnimations(s)).id,wanted);
  }
});
