import {test} from 'node:test';
import assert from 'node:assert/strict';
import {specimens} from '../src/ap3-specimens.js';
import {label} from '../src/ap3-specimens-catalog.js';
import {organMotions} from '../src/organ-atlas-catalog.js';
import {specimenAnimations,animationForTarget,specimenActivity,specimenMotionRoute} from '../src/ap3-specimen-animations.js';

const specimen=id=>specimens.find(s=>s.id===id);
test('renal corpuscles preserve the whole view while blood and filtrate trace different compartments',()=>{
  for(const id of ['nephron-pair','renal-buffer']){
    const s=specimen(id);
    for(const kind of ['cortical','juxtamedullary']){
      const group=s.targets.find(t=>t.id===kind+'_corpuscle');
      assert.ok(group.assembly);
      assert.deepEqual(group.meshes,[kind+'_glomerular_capsule',kind+'_glomerular_tuft']);
      for(const raw of group.meshes)assert.ok(s.targets.some(t=>t.id===raw&&!t.assembly));
    }
  }
  const [short,long,blood]=specimen('nephron-pair').routes;
  assert.equal(short.steps[0],'cortical_glomerular_capsule');assert.equal(long.steps[0],'juxtamedullary_glomerular_capsule');
  assert.deepEqual(blood.steps,['afferent_arteriole','cortical_glomerular_tuft','efferent_arteriole','peritubular_capillaries']);
});
test('cortical sinus has its own atlas animation stop and the reproductive support cells have independent labels',()=>{
  const node=specimen('node-sinuses'),lymph=specimenAnimations(node).find(v=>v.id==='lymph-node');
  assert.deepEqual(node.routes[0].steps,['afferent_vessels','subcapsular_sinus','cortical_sinuses','medullary_sinuses','efferent_vessel']);
  assert.equal(specimenMotionRoute(lymph,'cortical_sinuses'),'organs/lymph-node/step-3');
  const testis=specimen('seminiferous-tubule'),germ=specimenAnimations(testis).find(v=>v.id==='seminiferous-tubule');
  for(const name of ['sustentacular_cells','sustentacular_nuclei','sertoli_tight_junction','interstitial_cells']){
    assert.ok(testis.targets.some(t=>t.id===name));assert.ok(germ.context.includes(name));
  }
  assert.equal(specimenActivity(specimen('enteric-wall')).route,'ap2-lesson-15.2/activity/enteric-wall');
  for(const id of ['urinary-tract','sperm-route','ovarian-pelvis']){
    const s=specimen(id);assert.equal(s.routes.length,2);
    assert.match(s.routes[0].name,/Left/);assert.match(s.routes[1].name,/Right/);
  }
});
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
  assert(motion.targets.includes('cystic_duct') && motion.targets.includes('bile_duct'));
});
