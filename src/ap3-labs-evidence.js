import { select, table } from './ap3-labs-experiments.js';
import { lymphMedia } from './ap3-labs-fields.js';

const panels = [
  { label:'Panel A', values:[7.29,55,26], primary:'Respiratory acidosis', evidence:'Acidemia accompanies a raised PCO₂. Retaining CO₂ is the primary acidifying change.', response:'Over hours to days, kidneys can increase net acid excretion and raise blood bicarbonate.' },
  { label:'Panel B', values:[7.48,30,22], primary:'Respiratory alkalosis', evidence:'Alkalemia accompanies a reduced PCO₂. Excess CO₂ removal is the primary alkalinizing change.', response:'Over hours to days, kidneys can reduce net acid excretion and lower blood bicarbonate.' },
  { label:'Panel C', values:[7.32,32,16], primary:'Metabolic acidosis', evidence:'Acidemia accompanies a low bicarbonate. The reduced PCO₂ would oppose acidemia, supporting respiratory compensation.', response:'An increase in ventilation can lower PCO₂ within minutes. Renal recovery depends on the cause and intact function.' },
  { label:'Panel D', values:[7.49,46,34], primary:'Metabolic alkalosis', evidence:'Alkalemia accompanies a raised bicarbonate. The elevated PCO₂ would oppose alkalemia, supporting respiratory compensation.', response:'A limited decrease in ventilation can raise PCO₂. The need to maintain oxygenation limits this response.' },
];

export const acidBase = {
  title:'Interpret an acid–base panel',section:'26.5',
  intro:'Each fictional arterial sample represents a single primary disturbance. Reference intervals for this exercise are pH 7.35–7.45, PCO₂ 35–45 mmHg and bicarbonate 22–26 mmol/L.',
  controls:[select('panel','Blood-gas sample',panels.map(p=>p.label))],
  run({panel}){
    const p=panels[Number(panel)];
    return { observation:table(p.label,['pH','PCO₂ (mmHg)','Bicarbonate (mmol/L)'],[p.values]),
      question:'Which primary disturbance best explains this panel?',
      choices:[p.primary,...panels.map(x=>x.primary).filter(x=>x!==p.primary)],
      why:p.evidence,frames:[['At sampling','The measured pH is '+p.values[0]+'. Compare it with the exercise interval.'],['Primary disturbance',p.evidence],['Compensatory response',p.response]],
    };
  },
};

const fields = [
  ['Node', 'Lymph node', 'An outer cortex contains lymphoid follicles. Pale sinuses run through the medulla, and an afferent vessel opens beneath the capsule.', 'The node samples lymph. Lymph arriving beneath the capsule passes through sinuses before leaving the hilum.'],
  ['Spleen', 'Spleen', 'Lymphoid nodules with an arteriole lie among extensive blood-filled sinusoids and cellular cords.', 'White pulp is organized around arteries, while red pulp handles blood cells. These landmarks support blood filtration.'],
  ['Thymus', 'Thymus', 'Septae outline lobules. Each has a dark cortex and a paler medulla containing small concentric epithelial whorls.', 'Lobules with medullary thymic (Hassall) corpuscles support identification of the site of T-cell maturation.'],
];
export const lymphTissue = {
  title:'Identify lymphoid tissue from field notes', section:'21.1',
  intro:'These are observations from representative section patterns. Use the combination of landmarks and the material an organ samples.',
  controls:[select('field','Field notes',['Field A','Field B','Field C'])],
  run({field}){
    const [,answer,clue,why]=fields[Number(field)];
    return {media:lymphMedia[Number(field)],observation:table('Observed section',['Field note'],[[clue]]),question:'Which organ fits these landmarks?',choices:[answer,...fields.map(f=>f[1]).filter(a=>a!==answer)],
      why,frames:[['Landmarks',clue],['Identification',answer+'. '+why]]};
  },
};

const nutrients = [
  ['Meal A',18,6,4],['Meal B',8,10,9],['Meal C',30,6,3],
];
export const foodEnergy = {
  title:'Trace food energy and cofactors',section:'24.7',
  intro:'Use 4 kcal/g for carbohydrate and protein, and 9 kcal/g for fat. Each portion also contains a small amount of thiamine, which supports enzyme function.',
  controls:[select('meal','Portion',nutrients.map(r=>r[0]))],
  run({meal}){
    const [label,c,p,f]=nutrients[Number(meal)],kcal=c*4+p*4+f*9;
    return {observation:table(label,['Carbohydrate (g)','Protein (g)','Fat (g)'],[[c,p,f]]),question:'How much energy do the listed macronutrients contribute?',
      choices:[kcal+' kcal',((c+p+f)*4)+' kcal',((c+p+f)*9)+' kcal'],
      why:'Multiply each macronutrient mass by its energy per gram, then add the contributions.',
      frames:[['Carbohydrate and protein',c+' × 4 + '+p+' × 4 = '+(4*(c+p))+' kcal.'],['Fat',f+' × 9 = '+(f*9)+' kcal.'],['Meal energy',kcal+' kcal. Thiamine can participate in metabolism as a cofactor component without contributing dietary energy.']],
    };
  },
};

const cycles = [
  { label:'Late follicular interval', days:[4,7,10,12], e:[18,32,60,91], lh:[8,9,10,13], pr:[5,5,6,7], tissue:'A growing follicle encloses an oocyte within layers of granulosa cells and an enlarging antrum.', event:'An LH surge and subsequent ovulation', why:'Sustained high estradiol near follicular maturity can switch feedback to positive and trigger the LH surge.' },
  { label:'Early luteal interval', days:[12,13,14,17], e:[88,71,38,55], lh:[15,100,30,9], pr:[6,7,12,53], tissue:'The ovary now contains a folded, vascular structure developing at the site of the ruptured follicle.', event:'Increasing progesterone supports secretory endometrium', why:'The preceding LH surge and new corpus luteum point to the luteal phase. Progesterone supports uterine gland secretion.' },
  { label:'Late luteal interval', days:[20,23,25,27], e:[60,55,36,16], lh:[8,8,7,7], pr:[91,77,40,11], tissue:'No implantation occurred. Luteal cells are regressing and steroid support is falling.', event:'Menstruation after loss of steroid support', why:'Falling luteal progesterone and estradiol precede shedding of the functional layer of endometrium.' },
];
export const ovarian = {
  title:'Align hormone traces and tissue evidence', section:'27.2',
  intro:'Each panel is a different interval in one illustrative cycle. Day 1 is the first day of bleeding. Each hormone uses its own relative scale (0–100), so compare each series across time. Actual cycle timing varies.',
  controls:[select('interval','Observation interval',['Interval A','Interval B','Interval C'])],
  run({interval}){
    const set=cycles[Number(interval)];
    const rows=set.days.map((day,i)=>[day,set.e[i],set.lh[i],set.pr[i]]);
    return {observation:table('Ovarian and pituitary signals',['Cycle day','Estradiol (relative)','LH (relative)','Progesterone (relative)'],rows),
      plot:{x:'Cycle day',y:'Relative hormone level',rows,series:['Estradiol','LH','Progesterone'],ymax:100},note:set.tissue,
      question:'Which event is best supported by the trace and tissue evidence?',choices:[set.event,...cycles.map(c=>c.event).filter(e=>e!==set.event)],
      why:set.why,frames:set.days.map((day,i)=>['Day '+day,'Estradiol '+set.e[i]+', LH '+set.lh[i]+', progesterone '+set.pr[i]+' (relative units). '+(i===rows.length-1?set.tissue:'Use the matching row of the hormone plot.')]),
    };
  },
};

const stages = [
  { observation:'A solid ball of small blastomeres has little overall increase in diameter relative to the zygote.',stage:'Morula',next:'Fluid accumulation helps create a blastocyst cavity.'},
  { observation:'A fluid-filled cavity is bordered by trophoblast. An inner cell mass is grouped at one side.',stage:'Blastocyst',next:'The blastocyst can attach to and implant in the endometrium.'},
  { observation:'An epiblast has a primitive streak. Cells move inward and contribute to three germ layers.',stage:'Gastrulating embryo',next:'Germ layers contribute to body tissues as folding and organ formation proceed.'},
];
export const development = {
  title:'Identify an early developmental stage',section:'28.2',intro:'Use the structures visible in each description to place the specimen in developmental order. These observations refer to embryonic development after fertilization.',
  controls:[select('stage','Unlabeled observation',['Specimen A','Specimen B','Specimen C'])],
  run({stage}){
    const item=stages[Number(stage)];
    return {observation:table('Specimen notes',['Visible feature'],[[item.observation]]),question:'Which stage does the evidence identify?',choices:[item.stage,...stages.map(s=>s.stage).filter(s=>s!==item.stage)],
      why:item.observation,frames:[['Identify',item.stage+'. '+item.observation],['Predict the next change',item.next]]};
  },
};

const neonatal = [
  {name:'First breaths',cue:'The lungs expand and oxygen in ventilated regions rises. Consider the pulmonary vascular response.',prediction:'Pulmonary vascular resistance falls',why:'Aeration and increased oxygen allow pulmonary arterioles to dilate and blood flow through the lungs increases.',
    frames:[['Pulmonary arterioles','Vascular resistance falls.'],['Pulmonary veins','More pulmonary blood returns to the left atrium.'],['Atrial flap','A rise in left relative to right atrial pressure favors functional closure of the foramen ovale.']]},
  {name:'Cord clamping',cue:'The low-resistance placental circuit is disconnected. Consider its immediate removal from the systemic circuit.',prediction:'Systemic vascular resistance rises',why:'Removing a low-resistance parallel bed increases the resistance encountered by the systemic circulation.',
    frames:[['Systemic circuit','A low-resistance bed is removed.'],['Right atrial filling','Placental venous return through the umbilical vein ceases.'],['Shunts over time','Functional flow changes can occur promptly. Permanent anatomical closure requires later remodeling and varies by structure.']]},
  {name:'Suckling',cue:'A newborn begins suckling and milk already in the alveoli moves into the ducts within a short interval.',prediction:'Oxytocin contracts myoepithelial cells',why:'The observation is rapid milk ejection. Prolactin supports milk production for ongoing feeding.',
    frames:[['Sensory input','Nipple stimulation signals the hypothalamus.'],['Milk ejection','Posterior pituitary oxytocin release promotes myoepithelial contraction.'],['Ongoing milk supply','Anterior pituitary prolactin supports synthesis by secretory epithelial cells.']]},
];
export const birth = {
  title:'Follow birth and feeding transitions',section:'28.5',intro:'Select one event and predict its direct effect before stepping through downstream changes.',
  controls:[select('event','Event',neonatal.map(n=>n.name))],
  run({event}){
    const item=neonatal[Number(event)];
    const distractors=[['Pulmonary vascular resistance rises','The umbilical vein returns more blood after separation'],['Systemic vascular resistance falls','Placental venous return increases'],['Prolactin contracts myoepithelial cells to eject stored milk','Oxytocin creates the stored milk within seconds']];
    return {observation:table('Event observed',['Observation'],[[item.cue]]),question:'Which immediate effect fits?',choices:[item.prediction,...distractors[Number(event)]],why:item.why,frames:item.frames};
  },
};

export const pedigree = {
  title:'Condition an inheritance probability',section:'28.7',
  intro:'Use a single autosomal gene, complete penetrance, no new mutation, and independent segregation. An individual with aa shows the recessive trait. A confirmed Aa parent and a confirmed Aa parent have a child.',
  controls:[select('evidence','Information about this child',['Phenotype unknown','Child confirmed unaffected','Child confirmed affected'])],
  run({evidence}){
    const condition=Number(evidence);
    const candidates=condition===0?['AA','Aa','Aa','aa']:condition===1?['AA','Aa','Aa']:['aa'];
    const fraction=['1/2','2/3','0'][condition];
    return {observation:table('Family information',['Person','Known finding'],[['Parent 1','Aa'],['Parent 2','Aa'],['Child',['Phenotype unknown','Unaffected','Affected'][condition]]]),
      question:'What is the chance that this particular child is a heterozygous carrier?',choices:[fraction,...['1/2','2/3','0','1/4'].filter(x=>x!==fraction).slice(0,2)],
      why:'Restrict the four equally likely gamete combinations to those still possible after observing the child. Count Aa among that reduced set.',
      result:table('Parental allele combinations',['Parent 1 allele','Parent 2 allele','Child genotype','Fits the observation?'],[['A','A','AA'],['A','a','Aa'],['a','A','Aa'],['a','a','aa']].map(r=>[...r,candidates.includes(r[2])?'Yes':'No'])),
      frames:[['Original outcomes','AA, Aa, Aa, aa. The two Aa possibilities result from different parental gametes.'],['Apply the evidence','Compatible outcomes: '+candidates.join(', ')+'.'],['Count carriers',candidates.filter(v=>v==='Aa').length+' of '+candidates.length+' compatible outcomes are heterozygous. Probability = '+fraction+'.']],
    };
  },
};
