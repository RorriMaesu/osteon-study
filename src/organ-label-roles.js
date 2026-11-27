// Label colors describe structure identity. Tissue appearance and moving process
// indicators have independent colors. Each identity also has a printable symbol.
const definitions={
  structure:['Anatomical structure','○','#81dec3'],
  muscle:['Muscle','◇','#c6b5ff'],
  vessel:['Blood vessel','△','#f3a9b7'],
  passage:['Duct or passage','□','#96d5ff'],
  nerve:['Nerve or nerve fiber','⬡','#eac893'],
  lymph:['Lymphatic pathway','☆','#c8de92'],
  node:['Lymph node','✧','#a9d6a8'],
  wall:['Vessel wall','◈','#e7b6cc'],
  valve:['Valve','▽','#ffbc94'],
  tissue:['Cell or tissue','◎','#d6cbe3']
};
const roles=Object.fromEntries(Object.entries(definitions).map(([id,[title,symbol,color]])=>[id,{id,title,symbol,color}]));
const systems={digestive:'#d5956e',urinary:'#bd7992',reproductive:'#be89b5',respiratory:'#c18c99',endocrine:'#e4ae65',nervous:'#d7b686',lymphatic:'#85aa86',cardiovascular:'#bd6974',sensory:'#8fb4bd',integumentary:'#d0a387',development:'#ae9dc4',metabolic:'#c1af77'};
const systemAliases={'special senses':'sensory','lymphatic and immune':'lymphatic'};
export function normalizeOrganSystem(name=''){
  const key=String(name||'').toLowerCase().trim();
  return systemAliases[key]||key;
}
export function organSystemColor(name){return systems[normalizeOrganSystem(name)]||'#b6aba2';}

export function organLabelRole(entry,rawName='',displayName=''){
  const id=entry?.id;
  const raw=String(rawName).toLowerCase().replace(/_/g,' ');
  const name=raw+' '+String(displayName).toLowerCase();
  // A territory, recess, or attachment named after another part is a distinct structure.
  if(raw.startsWith('node | '))return roles.node;
  if(/\bterritory\b|\brenal hilum\b|\bnerve (?:canal|groove|sulcus)\b|\bfimbriae?\b|\bfibria\b|\btwo.cell stage\b/.test(name))return roles.structure;
  if(/\bvalv(?:e|es|ular)\b|\bvein leaflet\b/.test(name))return roles.valve;
  if(/\btunica (?:intima|media|externa)\b|\bcapillary wall\b/.test(name))return roles.wall;
  if(/\bmuscles?\b|\bdiaphragm\b|\barrector pili\b/.test(name))return roles.muscle;
  if(/^nerve \|/.test(raw)||/\bnerves?\b|\baxons?\b|\bchorda tympani\b|\boptic chiasm\b/.test(name)||id==='spinal-cord'&&/\broot\b/.test(raw)||id==='peripheral-nerve'&&/\bnode\b/.test(raw))return roles.nerve;
  if((id==='lymph-node'&&/\bvessels?\b|\bsinus(?:es)?\b/.test(raw))||/\blacteal\b|\bcisterna chyli\b|\b(?:lymphatic|thoracic) ducts?\b/.test(name))return roles.lymph;
  if(/\b(?:artery|arteries|arteriole|arterioles|vein|veins|venule|venules|vessels?|aorta|capillary|capillaries|sinusoid|sinusoids)\b|\b(?:vena cava|venae cavae|venous angle|aortic arch|coronary sinus|pulmonary trunk|glomerular tuft)\b/.test(name)||id==='pituitary'&&/\bplexus\b/.test(raw))return roles.vessel;
  if(/\b(?:duct|ducts|ductus|airway|trachea|bronchus|bronchi|bronchiole|bronchioles|ureter|ureters|urethra|canaliculus|tubule|tubules|calyx|calyces|aqueduct)\b|\b(?:uterine tube|renal pelvis|nasal cavity)\b/.test(name))return roles.passage;
  if(/\b(?:cells?|membrane|membranes|epithelium|endothelium|skin|tissue|adipocytes|myelin|spermatogonia|spermatocytes|spermatids|spermatozoa|oocyte|erythrocytes?|epidermis)\b/.test(name))return roles.tissue;
  return roles.structure;
}
