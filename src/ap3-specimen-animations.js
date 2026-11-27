import {organMotions} from './organ-atlas-catalog.js';

// Some physiology lessons use a different donor, a cutaway, or a microscopic
// model. Link by teaching topic in addition to matching the original GLB.
const companions={
  'lymph-drainage':['lymph-node'],node:['lymph-node'],'immune-organs':['tonsils','thymus','spleen'],
  'lung-lobes':['lungs','trachea-bronchi'],pleura:['lungs'],
  'alimentary-tract':['esophagus','stomach','duodenum','jejunum','ileum','cecum','ascending-colon','transverse-colon','descending-colon','sigmoid-colon','rectum'],
  'distal-colon':['descending-colon','sigmoid-colon','rectum'],'accessory-ducts':['liver','gallbladder','pancreas','duodenum'],
  'enteric-wall':['jejunum','esophagus','descending-colon'],villus:['jejunum','ileum'],
  'fuel-organs':['liver','glandular-pancreas'],
  'urinary-tract':['kidneys','ureters','urinary-bladder','urethra','nephron-transit','glomerular-filtration'],
  kidney:['kidneys','glomerular-filtration','nephron-transit','female-collecting-system'],
  'nephron-pair':['nephron-transit','glomerular-filtration'],glomerulus:['glomerular-filtration','nephron-transit'],
  'filtration-barrier':['glomerular-filtration','nephron-transit'],
  'renal-buffer':['nephron-transit'],'respiratory-buffer':['alveoli','lungs'],
  'sperm-route':['testes','epididymis','ductus-deferens','seminal-glands','ejaculatory-ducts','prostate','penis'],
  'ovarian-pelvis':['ovaries','uterine-tubes','uterus','cervix'],
  'pelvic-section':['female-urethra','vagina','vulvar-perfusion','greater-vestibular-glands','female-bladder','uterus','cervix','rectum'],
  'ovarian-follicle':['ovaries'],'seminiferous-tubule':['testes'],
  'placental-exchange':['placenta'],'birth-orientation':['placenta'],'fetal-shunts':['placenta','heart'],
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
  // Exact target matches take precedence over a mesh shown for context.
  return matched('targets')||matched('context');
}
