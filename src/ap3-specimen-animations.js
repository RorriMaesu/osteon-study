import {organMotions} from './organ-atlas-catalog.js';

// Some physiology lessons use a different donor, a cutaway, or a microscopic
// model. Link by teaching topic in addition to matching the original GLB.
const companions={
  'lymph-drainage':['lymphatic-drainage','lymph-node'],node:['lymph-node'],'immune-organs':['tonsils','thymus','spleen'],
  'lung-lobes':['lungs','trachea-bronchi'],pleura:['pleural-coupling','lungs'],
  'alimentary-tract':['esophagus','stomach','duodenum','jejunum','ileum','cecum','ascending-colon','transverse-colon','descending-colon','sigmoid-colon','rectum'],
  'distal-colon':['descending-colon','sigmoid-colon','rectum'],'accessory-ducts':['liver','gallbladder','pancreas','duodenum'],
  'enteric-wall':['jejunum','esophagus','descending-colon'],villus:['villus-absorption','jejunum','ileum'],
  'fuel-organs':['liver','glandular-pancreas','stomach','duodenum'],
  'urinary-tract':['kidneys','ureters','urinary-bladder','urethra','nephron-transit','glomerular-filtration'],
  kidney:['kidneys','glomerular-filtration','nephron-transit','female-collecting-system'],
  'nephron-pair':['nephron-transit','glomerular-filtration'],glomerulus:['glomerular-filtration','nephron-transit'],
  'filtration-barrier':['glomerular-filtration','nephron-transit'],
  'renal-buffer':['nephron-transit'],'respiratory-buffer':['alveoli','lungs'],
  'sperm-route':['testes','epididymis','ductus-deferens','seminal-glands','ejaculatory-ducts','prostate','penis'],
  'ovarian-pelvis':['ovaries','uterine-tubes','uterus','cervix'],
  'pelvic-section':['female-urethra','vagina','vulvar-perfusion','greater-vestibular-glands','female-bladder','uterus','cervix','rectum'],
  'ovarian-follicle':['ovaries'],'seminiferous-tubule':['testes'],
  'placental-exchange':['placenta'],
  'lactating-unit':['mammary-alveoli','mammary-glands']
};
const byId=new Map(organMotions.map(entry=>[entry.id,entry]));
export function specimenAnimations(specimen){
  const related=companions[specimen.id]||(specimen.id.startsWith('nodes-')?['lymph-node']:[]);
  const matches=organMotions.filter(entry=>entry.asset===specimen.asset).map(entry=>entry.id);
  return [...new Set([...related,...matches])].map(id=>byId.get(id)).filter(Boolean);
}
export function animationForTarget(specimen,targetId,choices){
  const target=specimen.targets.find(t=>t.id===targetId);
  if(!target)return;
  const matched=field=>choices.find(entry=>entry.asset===specimen.asset&&target.meshes.some(mesh=>entry[field]?.includes(mesh)));
  const direct=matched('targets');
  if(direct)return direct;
  const counterparts={
    'immune-organs':[[/thymus/,'thymus'],[/tonsil/,'tonsils'],[/^spleen$/,'spleen']],
    'accessory-ducts':[[/^duodenum$/,'duodenum'],[/cystic_duct|bile_duct/,'gallbladder'],[/pancreatic_duct/,'pancreas'],[/hepatic_portal_vein/,'liver']],
    'fuel-organs':[[/^pancreas$/,'glandular-pancreas'],[/liver|hepatic_portal/,'liver'],[/^stomach$/,'stomach'],[/^duodenum$/,'duodenum']],
    'alimentary-tract':[[/^ileocecal_junction$/,'cecum']],
    'kidney':[[/calyces|papillae|renal_pelvis|ureter/,'female-collecting-system']],
    'nephron-pair':[[/corpuscle|arteriole/,'glomerular-filtration']],
    'ovarian-pelvis':[[/uterine_tube|fallopian_tube/,'uterine-tubes'],[/ovary/,'ovaries'],[/cervic|cervix/,'cervix'],[/uterus|cornua|uterine_segment/,'uterus']],
    'pelvic-section':[[/^bladder$/,'female-bladder'],[/^rectum$/,'rectum'],[/uterine_body/,'uterus'],[/^cervix$/,'cervix']]
  };
  const id=counterparts[specimen.id]?.find(([pattern])=>pattern.test(targetId))?.[1];
  return choices.find(choice=>choice.id===id)||matched('context');
}

export function specimenActivity(specimen,targetId){
  if(specimen.id==='birth-orientation')return {label:'Explore the stages of labor',route:'ap3-lab-28/5/from-28.4'};
  if(specimen.id!=='fetal-shunts')return;
  const streams=[
    [/^(?:foramenOvale|septal_flap|lowerCava|ascendingAorta|left_atrium|left_ventricle|mitralInflow)$/,'atrial'],
    [/^(?:ductusArteriosus|pulmonaryTrunk|descendingAorta|upperCava|right_ventricle|tricuspidInflow)$/,'ductal'],
    [/UmbilicalArtery$/,'placentaReturn'],
    [/lung|pulmonaryVein/i,'lung']
  ];
  const stream=streams.find(([pattern])=>pattern.test(targetId||''))?.[1]||'placental';
  return {label:'Play fetal and newborn circulation',route:'ap2-lesson-20.6/activity/fetal-flow-'+stream};
}
