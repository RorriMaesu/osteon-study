import {chapters,examItems} from './ap3-curriculum.js';
import {fields} from './ap3-slides.js';
import {specimens} from './ap3-specimens.js';
import {assessTyped,fold,editDistance} from './typed-answer.js';
import {checkQuantity} from './ap2-quantities.js';
import {springScientificTerm} from './ap3-scientific-term.js';

const scopeChapters = scope => scope==='all' ? chapters : chapters.filter(c=>String(c.id)===String(scope));
function shuffle(rows,rng) {
  const list=[...rows];
  for(let i=list.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[list[i],list[j]]=[list[j],list[i]];}
  return list;
}
function variant(rows,last,rng){
  const unseen=rows.filter(row=>!last.has(row.id));
  return shuffle(unseen.length?unseen:rows,rng)[0];
}
function choices(item,rng){
  const wanted=item.options[item.answer], options=shuffle(item.options,rng);
  return {...item,options,answer:options.indexOf(wanted)};
}
const concept=(section,id,prompt,expected,aliases,why,opposites=[])=>({kind:'name',section,id,prompt,expected,aliases,why,opposites});
const quantity=(section,id,prompt,expected,unit,why)=>({kind:'quantity',section,id,prompt,expected:String(expected),unit,why});
const transfer=[
  concept('21.1','21-duct','Which large duct normally returns lymph from the left leg to the venous circulation?','Thoracic duct',['left lymphatic duct'],'Lymph from both lower limbs normally reaches the left venous angle through the thoracic duct.',['right lymphatic duct']),
  concept('21.1','21-node','Name the lymphatic vessel type carrying lymph away from a lymph node.','Efferent lymphatic vessel',['efferent lymphatic','efferent vessel','efferent'],'Efferent vessels carry lymph out of the node at the hilum.',['afferent','afferent lymphatic vessel']),
  concept('21.3','21-cytotoxic','A virus-infected epithelial cell displays viral peptide on MHC I. Name the antigen-specific T-cell type that can directly kill it.','Cytotoxic T cell',['cytotoxic T lymphocyte','CD8 T cell','CD8+ T cell','CTL'],'CD8 cytotoxic T cells recognize antigen on MHC I and can induce apoptosis in the infected target.',['helper T cell','CD4 T cell','natural killer cell']),
  quantity('22.3','22-air-a','A person takes 12 breaths/min, each 500 mL, with 150 mL dead space per breath. Calculate alveolar ventilation in L/min.',4.2,'L/min','Subtract dead space from each breath, then multiply 350 mL by 12.'),
  quantity('22.3','22-air-b','With 20 breaths/min, tidal volume 350 mL and dead space 150 mL per breath, calculate alveolar ventilation in L/min.',4,'L/min','Only 200 mL of fresh air per breath reaches the respiratory zone.'),
  concept('22.5','22-bicarbonate','Most CO₂ from working muscle travels in plasma after a reaction inside red cells. Name the ion that carries most of this carbon.','Bicarbonate',['bicarbonate ion','hydrogen carbonate','HCO3','HCO3−'],'Carbonic anhydrase speeds hydration of CO₂. Bicarbonate enters plasma as chloride enters red cells.',['carbonate','chloride']),
  concept('23.7','23-route','Name the central lymphatic capillary in an intestinal villus that takes up chylomicrons.','Lacteal',['central lacteal'],'Long-chain lipid is packaged into chylomicrons that enter a lacteal.'),
  concept('23.6','23-portal','Which vein carries nutrient-rich blood from the intestines into the liver?','Hepatic portal vein',['portal vein','hepatic portal vessel'],'Blood from the intestine enters a second capillary bed in the liver.',['hepatic vein']),
  concept('23.2','23-mixing','A marked patch of intestinal chyme repeatedly moves back and forth with little net propulsion. Name the mixing pattern.','Segmentation',['segmental contractions','segmenting contractions'],'Alternating contractions mix chyme with secretions and repeatedly bring it into contact with the mucosa.',['peristalsis']),
  concept('24.2','24-glucose','During fasting, what process makes new glucose from substrates such as lactate?','Gluconeogenesis',[],'Gluconeogenesis uses noncarbohydrate precursors. Glycogenolysis breaks down stored glycogen.',['glycogenolysis','glycogenesis']),
  concept('24.4','24-nitrogen','Which nitrogenous waste does the liver form when processing excess amino nitrogen?','Urea',['carbamide'],'Amino nitrogen enters the urea cycle. The kidneys excrete much of the resulting urea.',['uric acid','ammonia']),
  concept('24.6','24-heat','During exercise, sweat cools the skin when it changes phase. Which mechanism of heat loss is reduced in very humid air?','Evaporation',['evaporative cooling','evaporative heat loss'],'Less sweat evaporates when the vapor-pressure gradient between skin and surrounding air is smaller.',['radiation','conduction','convection']),
  quantity('25.5','25-load-a','A solute is filtered at 160 mg/min, reabsorbed at 140 mg/min and secreted at 5 mg/min. Calculate its excretion rate in mg/min.',25,'mg/min','Excretion = filtration − reabsorption + secretion. Here that gives 160 − 140 + 5.'),
  quantity('25.5','25-load-b','A solute is filtered at 80 mg/min, reabsorbed at 62 mg/min and secreted at 4 mg/min. Calculate its excretion rate in mg/min.',22,'mg/min','Excretion equals 80 − 62 + 4 mg/min.'),
  quantity('25.5','25-pressure','Glomerular capillary pressure is 55 mmHg. Capsular hydrostatic pressure is 15 mmHg and plasma colloid osmotic pressure is 30 mmHg. Ignore capsular oncotic pressure. Calculate net outward filtration pressure.',10,'mmHg','The two pressures opposing filtration sum to 45 mmHg. Net outward pressure is 55 − 45 = 10 mmHg.'),
  concept('26.5','26-base','A sample has pH 7.50, elevated bicarbonate and elevated PCO₂. Name the primary acid–base disturbance.','Metabolic alkalosis',[],'Alkalemia and elevated bicarbonate point to a metabolic process. Higher PCO₂ counteracts the rise in pH.',['metabolic acidosis','respiratory alkalosis']),
  concept('26.5','26-acid','A sample has pH 7.26, low bicarbonate and low PCO₂. Name the primary acid–base disturbance.','Metabolic acidosis',[],'The low pH and bicarbonate identify the metabolic process. Lower PCO₂ is in the compensating direction.',['respiratory acidosis','metabolic alkalosis']),
  concept('26.3','26-potassium','Plasma potassium rises while effective circulating volume stays stable. Which adrenal hormone normally increases renal potassium secretion?','Aldosterone',[],'Potassium can directly stimulate aldosterone release from adrenal glomerulosa cells. Distal nephron potassium secretion increases.',['ADH','antidiuretic hormone','angiotensin II']),
  concept('27.2','27-ovulation','Which anterior pituitary hormone surges shortly before ovulation?','Luteinizing hormone',['LH','luteinising hormone'],'An LH surge triggers ovulation and supports formation of the corpus luteum.'),
  concept('27.1','27-duct','After the efferent ductules, in which coiled duct do sperm continue to mature?','Epididymis',['duct of the epididymis','epididymal duct'],'Sperm leaving the testis pass into the epididymis and subsequently the ductus deferens.'),
  concept('27.3','27-amh','During fetal testicular development, Sertoli cells release a signal that causes regression of the paramesonephric ducts. Name the signal.','Anti-Müllerian hormone',['anti Mullerian hormone','AMH','Müllerian inhibiting substance','Mullerian inhibiting factor'],'AMH supports regression of the paramesonephric ducts. Testosterone supports persistence of the mesonephric ducts.',['testosterone','dihydrotestosterone']),
  concept('28.6','28-milk-a','Which hormone triggers milk ejection by contracting mammary myoepithelial cells?','Oxytocin',[],'Oxytocin signals ejection. Prolactin supports milk synthesis.',['prolactin']),
  concept('28.6','28-milk-b','Which anterior pituitary hormone supports milk synthesis after delivery?','Prolactin',['PRL'],'Prolactin supports synthesis in mammary alveoli. Oxytocin drives ejection.',['oxytocin']),
  concept('28.7','28-codominance','Both A and B antigens are present on the red cells of a person with blood group AB. What inheritance pattern describes the relationship between these alleles?','Codominance',['co-dominance','codominant inheritance','codominant'],'Both alleles are expressed in a heterozygote. In incomplete dominance the heterozygote instead has an intermediate phenotype.',['incomplete dominance','complete dominance']),
  concept('28.2','28-germ-layers','A section of an early embryo first shows three primary germ layers. Which developmental process established them?','Gastrulation',[],'Cell migrations during gastrulation establish ectoderm, mesoderm, and endoderm. Cleavage had increased cell number earlier.',['cleavage','neurulation'])
];
const dataStations=[
  {chapter:24,id:'24-fast',section:'24.5',prompt:'In a healthy adult after an overnight fast, insulin falls and glucagon rises. Which change best fits hepatic glycogen?',options:['Its stores decrease.','Its stores increase.','It is released intact into blood.'],answer:0,why:'Liver glycogen is broken down to support plasma glucose.',prediction:'As fasting continues and hepatic glycogen falls, which process supplies new glucose?',choices:['Gluconeogenesis from precursors such as lactate','Packaging glucose in chylomicrons','Increased intestinal absorption during fasting'],correct:0,reason:'Gluconeogenesis uses precursors to sustain glucose output as stores decline.'},
  {chapter:24,id:'24-fed',section:'24.5',prompt:'One hour after a carbohydrate-rich meal, glucose and insulin have risen. Which liver pathway is favored?',options:['Glycogen synthesis','Ketone production as the main task','Net breakdown of hepatic glycogen'],answer:0,why:'Insulin favors glycogen storage when glucose is available.',prediction:'After several hours without further food, which change helps maintain plasma glucose?',choices:['A rise in the glucagon-to-insulin ratio','Conversion of glucose into ketones by red blood cells','Release of intact glycogen into blood'],correct:0,reason:'Relatively more glucagon promotes liver glucose output.'},
  {chapter:26,id:'26-gas-a',section:'26.5',prompt:'Arterial sample A has pH 7.29, PCO₂ 55 mmHg and bicarbonate 26 mmol/L. Use reference ranges of 7.35–7.45, 35–45 mmHg and 22–26 mmol/L. What is the primary disturbance?',options:['Respiratory acidosis','Respiratory alkalosis','Metabolic acidosis'],answer:0,why:'Acidemia occurs with elevated PCO₂. Bicarbonate is close to the usual range.',prediction:'If the CO₂ change persists, which renal response would oppose it?',choices:['Increase net acid excretion and conserve bicarbonate','Increase urinary bicarbonate loss','Stop tubular hydrogen-ion secretion'],correct:0,reason:'Greater acid excretion and bicarbonate retention buffer sustained respiratory acidosis.'},
  {chapter:26,id:'26-gas-b',section:'26.5',prompt:'Arterial sample B has pH 7.49, PCO₂ 30 mmHg and bicarbonate 22 mmol/L. Use reference ranges of 7.35–7.45, 35–45 mmHg and 22–26 mmol/L. What is the primary disturbance?',options:['Respiratory alkalosis','Metabolic alkalosis','Respiratory acidosis'],answer:0,why:'An elevated pH accompanies low PCO₂. Bicarbonate is at the low end of the supplied range.',prediction:'If the CO₂ change persists, which renal response would oppose it?',choices:['Reduce bicarbonate reabsorption','Increase net acid excretion','Retain more bicarbonate'],correct:0,reason:'Renal bicarbonate loss helps bring pH toward baseline.'}
];

export function practicalLength(scope){return scopeChapters(scope).reduce((n,c)=>n+2+(fields.some(f=>f.chapter===c.id)?1:0),0);}
export function makeAssessment(scope,mode,prior=[],rng=Math.random){
  const last=new Set(prior.map(q=>q.id)),result=[];
  const previousSections=new Set(prior.map(q=>q.section));
  for(const chapter of scopeChapters(scope)){
    if(mode==='practical'){
      const variants=specimens.filter(s=>s.chapter===chapter.id).flatMap(s=>(s.stations||[]).map(st=>({...st,specimen:s.id,id:s.id+'/'+st.target})));
      if(variants.length&&!dataStations.some(d=>d.chapter===chapter.id)){
        const st=variant(variants,last,rng);
        result.push({id:st.id,kind:'surface',section:st.section,specimen:st.specimen,prompt:st.prompt,expected:st.target,
          order:shuffle(specimens.find(s=>s.id===st.specimen).targets.map(t=>t.id),rng),display:specimens.find(s=>s.id===st.specimen).targets.find(t=>t.id===st.target).label,why:st.why});
        result.push(choices({kind:'choice',id:st.id+'/reason',section:st.section,prompt:st.prediction,options:st.options,answer:st.answer,why:st.reason||st.why},rng));
      }else{
        const st=variant(dataStations.filter(s=>s.chapter===chapter.id),last,rng);
        if(!st)throw new Error('A practical station is missing for chapter '+chapter.id);
        result.push(choices({...st,kind:'choice'},rng),choices({id:st.id+'/reason',kind:'choice',section:st.section,prompt:st.prediction,options:st.choices,answer:st.correct,why:st.reason},rng));
      }
      const microscopy=fields.filter(f=>f.chapter===chapter.id);
      if(microscopy.length)result.push(choices(variant(microscopy,last,rng),rng));
    }else{
      const recall=variant(transfer.filter(q=>q.section.startsWith(chapter.id+'.')),last,rng);
      // A short cumulative samples three distinct MC sections. Prefer sections
      // missed on the previous attempt and broaden the coverage of its recall.
      const sections=scope==='all'?shuffle(chapter.sections,rng).sort((a,b)=>
        Number(b.id==='28.7'&&recall.section!=='28.7')-Number(a.id==='28.7'&&recall.section!=='28.7') ||
        Number(a.id===recall.section)-Number(b.id===recall.section) ||
        Number(previousSections.has(a.id))-Number(previousSections.has(b.id))).slice(0,3):chapter.sections;
      const questions=sections.map(section=>choices({...variant(examItems.filter(q=>q.section===section.id),last,rng),kind:'choice'},rng));
      result.push(...questions,recall);
    }
  }
  return mode==='practical'?result:shuffle(result,rng);
}
export function gradeSpring(q,raw){
  if(raw===null||raw===undefined||String(raw).trim()==='')return 'unanswered';
  if(q.options)return String(q.answer)===String(raw)?'correct':'incorrect';
  if(q.kind==='surface')return raw===q.expected?'correct':'incorrect';
  if(q.kind==='quantity')return checkQuantity(q,raw).correct?'correct':'incorrect';
  const scientific=springScientificTerm(q.expected,raw);
  if(scientific)return scientific;
  const value=fold(raw);
  if(q.opposites?.length){
    const nearKey=Math.min(...[q.expected,...(q.aliases||[])].map(term=>editDistance(value,fold(term))));
    if(q.opposites.some(term=>value.split(' ').includes(fold(term))||editDistance(value,fold(term))<=nearKey))return 'incorrect';
  }
  const status=assessTyped({id:q.id,type:'text',answer:q.expected,aliases:q.aliases},String(raw).slice(0,180)).status;
  if(['correct','equivalent'].includes(status))return 'correct';
  return status==='spelling'?'spelling':'incorrect';
}
export function displayAnswer(q,answer){
  if(answer===null||answer===undefined||answer==='')return 'Unanswered';
  if(q.options)return q.options[answer]??'Unanswered';
  if(q.kind==='surface')return q.labels?.[answer]|| (answer===q.expected?q.display:'Other surface');
  return String(answer);
}
export function expectedAnswer(q){
  if(q.options)return q.options[q.answer];
  return q.display || (q.unit?q.expected+' '+q.unit:q.expected);
}
