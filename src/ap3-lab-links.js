// Each lesson names a particular task. Related cases rehearse a prerequisite
// or neighboring mechanism when the lab does not directly assess the objective.
const direct=(activity,label,settings={},model)=>({activity,label,settings,model});
const related=(activity,label,settings={},model)=>({...direct(activity,label,settings,model),related:true});

export const springLessonLabs={
  '21.1':direct(0,'Trace lymph from the right hand',{route:0},'lymph-drainage'),
  '21.2':related(1,'Identify a lymph node in section',{field:0},'node'),
  '21.3':related(1,'Locate the node where lymphocytes meet antigen',{field:0},'node'),
  '21.4':direct(2,'Compare antibody responses after exposure',{series:1}),
  '21.5':direct(2,'Interpret a first antibody response',{series:0}),
  '21.6':related(2,'Read an intact antibody response for comparison',{series:1}),
  '21.7':related(1,'Identify a lymphoid organ',{field:1},'immune-organs'),
  '22.1':direct(3,'Identify an alveolar exchange surface',{},'alveolar-exchange'),
  '22.2':direct(0,'Follow pleural pressure through a breath',{moment:0},'pleura'),
  '22.3':direct(2,'Measure vital capacity on a spirogram',{},'pleura'),
  '22.4':direct(3,'Predict exchange across a thickened barrier',{condition:0},'alveolar-exchange'),
  '22.5':related(3,'Compare diffusion across the lung–blood barrier',{},'alveolar-exchange'),
  '22.6':related(1,'Compare fresh air delivered by two breathing patterns'),
  '22.7':related(0,'Inspect pressure changes in a ventilated lung',{moment:1},'lung-lobes'),
  '23.1':direct(1,'Trace a swallowed bolus',{route:0},'alimentary-tract'),
  '23.2':related(1,'Follow material through the gut',{route:0},'enteric-wall'),
  '23.3':direct(1,'Trace the path of a swallowed bolus',{route:0}),
  '23.4':related(1,'Place the stomach along the alimentary tract',{route:0},'alimentary-tract'),
  '23.5':direct(2,'Compare intestinal tissue fields',{},'distal-colon'),
  '23.6':direct(1,'Trace bile from the gallbladder',{route:1},'accessory-ducts'),
  '23.7':direct(0,'Follow a long-chain lipid from a villus',{route:1},'villus'),
  '24.1':related(0,'Compare fuel storage and mobilization',{},'metabolic-cell'),
  '24.2':related(0,'Trace glucose after a meal',{state:0},'metabolic-cell'),
  '24.3':direct(0,'Follow fat mobilization during fasting',{state:1},'adipose'),
  '24.4':related(2,'Account for protein in a mixed meal',{meal:1}),
  '24.5':direct(0,'Compare fed and fasting metabolism',{},'fuel-organs'),
  '24.6':direct(1,'Calculate net heat storage'),
  '24.7':direct(2,'Compare dietary energy contributions'),
  '25.1':direct(2,'Predict the volume and concentration of urine'),
  '25.2':direct(0,'Trace urine through the collecting system',{route:2},'urinary-tract'),
  '25.3':direct(0,'Trace a papilla to the renal pelvis',{route:2},'kidney'),
  '25.4':direct(0,'Trace filtered water through a nephron',{route:1},'nephron-pair'),
  '25.5':direct(1,'Balance filtration, reabsorption and secretion',{},'filtration-barrier'),
  '25.6':direct(1,'Measure how reabsorption changes excretion'),
  '25.7':related(0,'Trace blood through the glomerular circulation',{route:0},'glomerulus'),
  '25.8':direct(2,'Test ADH and the medullary gradient',{},'nephron-pair'),
  '25.9':direct(2,'Test a weakened medullary gradient',{adh:1,gradient:0},'nephron-pair'),
  '25.10':direct(2,'Predict renal water conservation',{adh:1,gradient:1}),
  '26.1':direct(0,'Predict a cell-volume change',{},'fluid-spaces'),
  '26.2':{...direct(2,'Predict water conservation after ADH release',{adh:1,gradient:1},'nephron-pair'),chapter:25},
  '26.3':related(0,'Test the effect of an extracellular osmotic change',{},'fluid-spaces'),
  '26.4':direct(1,'Predict compensation for a respiratory disturbance',{panel:0},'renal-buffer'),
  '26.5':direct(1,'Interpret an acid–base panel',{panel:2},'respiratory-buffer'),
  '27.1':direct(1,'Trace sperm from a seminiferous tubule',{route:0},'sperm-route'),
  '27.2':direct(0,'Align a hormone trace with ovarian tissue',{interval:0},'ovarian-follicle'),
  '27.3':related(1,'Identify the adult sperm duct pathway',{route:0},'sperm-route'),
  '28.1':related(3,'Inspect the first divisions after fertilization',{field:0},'cleavage-implantation'),
  '28.2':direct(0,'Interpret an early embryonic stage',{},'cleavage-implantation'),
  '28.3':related(1,'Predict how placental separation changes circulation',{event:1},'placental-exchange'),
  '28.4':related(1,'Trace the circulatory transition at cord clamping',{event:1},'birth-orientation'),
  '28.5':direct(1,'Trace the effects of the first breath',{event:0},'fetal-shunts'),
  '28.6':direct(1,'Trace milk ejection during suckling',{event:2},'lactating-unit'),
  '28.7':direct(2,'Use family evidence to estimate carrier probability')
};

// Keep fragment routes compatible with the course picker, saved study links
// and the browser's native back/forward navigation. Old numeric-only links work.
export const springLabRoutePattern=/^ap3-lab-2[1-8](?:\/\d+(?:\/(?:from-2[1-8]\.\d+|[a-zA-Z]+-\d+(?:\.\d+)?))*)?$/;

export function labRoute(chapter,activity,settings={},from=''){
  const segments=['ap3-lab-'+chapter,String(activity)];
  if(from)segments.push('from-'+from);
  for(const [key,value] of Object.entries(settings))segments.push(key+'-'+value);
  return segments.join('/');
}

export function readLabRoute(segments){
  const settings={};
  let from='';
  for(const segment of segments){
    if(segment.startsWith('from-')&&Object.hasOwn(springLessonLabs,segment.slice(5)))from=segment.slice(5);
    const match=/^([a-zA-Z]+)-(\d+(?:\.\d+)?)$/.exec(segment);
    if(match&&match[1]!=='from')settings[match[1]]=Number(match[2]);
  }
  return {from,settings};
}
