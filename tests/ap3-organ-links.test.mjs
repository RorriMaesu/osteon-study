import {test} from 'node:test';
import assert from 'node:assert/strict';
import {specimens} from '../src/ap3-specimens.js';
import {label} from '../src/ap3-specimens-catalog.js';
import {organMotions} from '../src/organ-atlas-catalog.js';
import {specimenAnimations,animationForTarget,specimenActivity} from '../src/ap3-specimen-animations.js';

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
    ['pelvic-section','urethra','female-urethra'],['pelvic-section','vagina','vagina'],
    ['immune-organs','left_lobe_of_thymus','thymus'],['immune-organs','spleen','spleen'],
    ['accessory-ducts','duodenum','duodenum'],['accessory-ducts','cystic_duct','gallbladder']]){
    const s=specimen(id);
    assert.equal(animationForTarget(s,target,specimenAnimations(s)).id,wanted);
  }
});
test('model activities open the matching route or physiological process',()=>{
  for(const [id,motion] of [['pleura','pleural-coupling'],['villus','villus-absorption'],['lymph-drainage','lymphatic-drainage']]){
    assert.equal(specimenAnimations(specimen(id))[0].id,motion);
  }
  assert.equal(specimenActivity(specimen('birth-orientation')).route,'ap3-lab-28/5/from-28.4');
  for(const [target,stream] of [['foramenOvale','atrial'],['ductusArteriosus','ductal'],['ductusVenosus','placental'],['leftUmbilicalArtery','placentaReturn']]){
    assert.equal(specimenActivity(specimen('fetal-shunts'),target).route,'ap2-lesson-20.6/activity/fetal-flow-'+stream);
  }
  const bile=specimen('accessory-ducts').routes[0].steps;
  assert.deepEqual(bile,['gallbladder','cystic_duct','bile_duct','duodenum']);
  assert.ok(bile.every(id=>specimen('accessory-ducts').targets.some(t=>t.id===id)));
});
test('display names distinguish the bladder dome and base and locate the donor tube ends',()=>{
  assert.equal(label('VH_F_fundus_of_urinary_bladder_dome'),'Urinary bladder dome (superior surface)');
  assert.equal(label('VH_F_fundus_of_urinary_bladder_base'),'Urinary bladder base (fundus)');
  const junction=specimen('ovarian-pelvis').targets.find(t=>t.id==='VH_F_abdominal_ostium_of_uterine_tube');
  assert.equal(junction.label,'Uterotubal junctions (uterine ends of tubes)');
});
test('bile route includes both contiguous named duct segments before entering the duodenum',()=>{
  const bile=specimen('accessory-ducts').routes.find(r=>r.name==='Bile delivery');
  assert.deepEqual(bile.steps,['gallbladder','cystic_duct','bile_duct','duodenum']);
  const motion=organMotions.find(e=>e.id==='gallbladder');
  assert(motion.context.includes('cystic_duct') && motion.context.includes('bile_duct'));
});
