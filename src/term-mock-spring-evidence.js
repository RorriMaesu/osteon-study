import {fields} from './ap3-slides.js';
import {specimens} from './ap3-specimens-catalog.js';
import {specimenStations} from './ap3-specimens-practical.js';
import {antibody, breathing, excretion, waterShift, heat, fedFast} from './ap3-labs-experiments.js';
import {acidBase, foodEnergy, ovarian, development, pedigree, birth} from './ap3-labs-evidence.js';
import {ordered,pick,term,number,data,item} from './term-mock-spring-items.js';

const fieldFollow={
  lx1:pick('Which route brings a tissue antigen to the sinus beneath this capsule?','Afferent lymphatic vessel from the drainage territory','Efferent lymphatic vessel entering at the hilum','Nodal vein returning blood from the hilum'),
  lx2:pick('Which other region removes aging red blood cells?','Red pulp','Germinal center','Thymic medulla'),
  rx1:pick('At a fixed gradient, what happens if the barrier thickens?','Diffusion slows','Diffusion accelerates','Diffusion stops only in the conducting airways'),
  rx2:pick('If the exposed projections stop beating, what happens to trapped particles?','Clearance toward the throat decreases','Diffusion into red cells increases','They are swept toward the throat faster'),
  gx1:pick('Where does absorbed glucose first enter the circulation here?','Blood capillaries','Central lymphatic capillary','Bile ducts'),
  gx2:pick('How does secretion from the pale mucous cells aid this region?','Lubricates the luminal contents','Emulsifies fat','Converts pepsinogen to pepsin'),
  ux1:pick('Which muscle contracts to expel urine from this reservoir during micturition?','Detrusor','External urethral sphincter','Internal urethral sphincter'),
  ux2:pick('Pressure would first increase on which side of a complete obstruction?','Upstream toward the renal pelvis','Downstream toward the urethral opening','Equally on both sides immediately'),
  px1:pick('Which supporting cells directly nourish developing germ cells here?','Sertoli cells','Leydig cells','Granulosa cells'),
  px2:pick('Which pituitary signal normally triggers release of the secondary oocyte?','LH surge','Fall in LH','Suppression of FSH without an LH surge'),
};
const fieldThird={
  21:pick('Which defense depends on clones with specific antigen receptors?','Adaptive immunity','Epidermal keratin barrier','Mucociliary clearance'),
  22:pick('Which vessel normally brings blood from the right ventricle toward this organ?','Pulmonary artery','Pulmonary vein','Bronchial vein'),
  23:pick('Which neural network between the two major muscle layers coordinates local contractions?','Myenteric plexus','Submucosal plexus','Celiac plexus'),
  25:pick('Which passage carries urine from the bladder to the exterior?','Urethra','Ureter','Calyx'),
  27:pick('Which pituitary hormone acts directly on Sertoli or granulosa cells to support gamete development?','FSH','LH','Prolactin'),
};
const transferField={
  21: ['lx1','Identify the material this tissue normally samples and the path it takes.',
    pick('Which fluid arrives from tissues?','Lymph','Bile','Filtrate'),
    pick('Where does this fluid first collect after admission beneath the capsule?','Subcapsular sinus','Central arteriole','Portal venule')],
  22: ['rx1','Connect the specimen’s thin barriers to gas transport.',
    pick('Which gas normally moves into blood at this surface?','Oxygen','Nitrogen as the main respiratory substrate','Carbon dioxide as the main net transfer during quiet breathing'),
    pick('What would loss of half the available surface do at fixed thickness and gradient?','Reduce diffusion capacity','Raise diffusion capacity','Change diffusion into active transport')],
  23: ['gx1','Use the projection pattern to predict two nutrient routes.',
    pick('Which pair usually enters the blood capillary core after absorption?','Glucose and amino acids','Chylomicrons and large lipid droplets','Intact starch granules and triglyceride droplets'),
    pick('Where do long-chain fats usually go after repackaging in enterocytes?','Central lacteal','Portal venule directly','Pancreatic duct')],
  25: ['ux2','Use the wall and lumen to infer transport and the consequence of blockage.',
    pick('Which nearby organ normally receives fluid at the distal end of this passage?','Urinary bladder','Minor calyx','Renal cortex'),
    pick('Which pressure tends to rise first with a complete blockage?','Upstream collecting-system pressure','Downstream urethral pressure','Arterial oxygen partial pressure')],
  27: ['px2','Use the cell arrangement to identify the gamete and a later ovarian change.',
    pick('What is the large germ cell enclosed by supporting cells?','Oocyte','Spermatid','Leydig cell'),
    pick('After ovulation, the remaining follicle normally forms which structure?','Corpus luteum','Morula','Corpus spongiosum')],
};
function fieldItem(ch, n, practical=false) {
  const options=fields.filter(f=>f.chapter===ch);
  const transfer=n===2?transferField[ch]:null;
  const f=transfer?options.find(v=>v.id===transfer[0]):options[n%options.length];
  const parts=transfer?transfer.slice(2):[pick(f.prompt,f.options[f.answer],...f.options.filter((_,i)=>i!==f.answer)),fieldFollow[f.id]];
  if(practical)parts.push(fieldThird[ch]);
  return item(f.section,'micro-'+f.id,transfer?transfer[1]:'Examine the tissue section and connect its structure to function.',parts,
    f.why+' '+parts.map(p=>p.choices[0]+'.').join(' '),{image:f.image,alt:f.description,
      credit:'OpenStax Anatomy and Physiology 2e, fig. '+f.figure+'. Micrograph courtesy of the Regents of the University of Michigan Medical School © 2012.'});
}

const surfaceThird={
  'lymph-drainage':pick('As skeletal muscles repeatedly compress a collecting lymphatic vessel, what keeps net flow directed toward the venous angles?','Valves close against reverse flow','Filtration pressure at blood capillaries acts as a one-way valve','The pressure gradient reverses with every muscle contraction and no valves are needed'),
  'lung-lobes':pick('Which surface lines the inner chest wall?','Parietal pleura','Visceral pleura','Alveolar epithelium'),
  villus:pick('Which movement mixes chyme locally to improve mucosal contact?','Segmentation','Swallowing','Vomiting'),
  kidney:pick('Which event occurs before fluid reaches the first collecting cup?','Filtrate has passed through collecting and papillary ducts','Urine has traveled through the ureter','Blood has traveled through the renal vein into the cup'),
  'sperm-route':pick('Which gland normally contributes a fructose-rich secretion to semen?','Seminal gland','Prostate gland','Bulbourethral gland'),
  'placental-exchange':pick('Which fetal vessel carries blood from fetus to placenta?','Umbilical artery','Umbilical vein','Pulmonary vein'),
};
const transferSurface={
  'lymph-drainage':['21.1','cisterna_chyli','Select the enlarged sac near the abdominal origin of the long midline lymphatic duct.','Which input can make its lymph rich in lipid after a meal?','Intestinal lymphatic trunk','Right jugular lymphatic trunk','Superior vena cava','The cisterna chyli, when present, receives intestinal and lumbar lymph before the thoracic duct ascends.'],
  'lung-lobes':['22.1','left_main_bronchus','Select the primary airway that enters the patient’s left lung.','Which branches receive its airflow next?','Lobar bronchi','Terminal bronchioles directly','Alveolar ducts directly','The left main bronchus divides into lobar branches before smaller conducting airways.'],
  villus:['23.7','capillary_network','Select the web of small blood vessels within the villus.','Which absorbed cargo would normally enter this network?','Amino acids','Intact chylomicrons as the typical route','Whole dietary proteins as the typical route','Small water-soluble nutrients enter villus blood capillaries and travel toward the hepatic portal circulation.'],
  kidney:['25.3','pyramids','Select the conical regions in the renal medulla with apices facing collecting cups.','Where does fluid leaving a papillary duct enter?','Minor calyx','Renal artery','Proximal tubule','Renal pyramids end in papillae, which empty through papillary ducts into minor calyces.'],
  'sperm-route':['27.1','ductus_deferens_left','Select the patient’s left duct running from the epididymal tail toward the pelvis.','What normally drives sperm along this duct during emission?','Smooth-muscle contraction','Glomerular filtration pressure','Lung recoil','The ductus deferens has smooth muscle that propels sperm toward the ejaculatory duct.'],
  'placental-exchange':['28.3','fetal_capillaries','Select the small fetal blood vessels inside the branching exchange tissue.','Which layer must oxygen cross before reaching blood within these vessels?','Placental tissue between maternal and fetal blood','Maternal alveolar cartilage','Open pores connecting maternal and fetal vessels directly','Fetal capillaries lie inside chorionic villi. Maternal blood bathes the outside of the villi.'],
};
function surface(id, n, practical=false) {
  const spec=specimens.find(s=>s.id===id), stations=specimenStations[id];
  const [section,target,prompt,prediction,a,b,c,why]=transferSurface[id];
  const st=n===2?{section,target,prompt,prediction,options:[a,b,c],answer:0,why}:stations[n];
  const parts=[{type:'surface',prompt:st.prompt,specimen:id,expected:st.target,
    labels:Object.fromEntries(spec.targets.map(t=>[t.id,t.label])),order:ordered(spec.targets.map(t=>t.id),id+n)},
    pick(st.prediction,st.options[st.answer],...st.options.filter((_,i)=>i!==st.answer))];
  if(practical)parts.push(surfaceThird[id]);
  return {...item(st.section,'surface-'+id+'-'+st.target,'Examine the anonymous 3D specimen and follow the anatomical relationship.',parts,st.why),type:'evidence'};
}
function experiment(key, lab, config, prompt, follow, third) {
  const result=lab.run(config);
  const {headers:columns,rows}=result.observation;
  const parts=[pick(result.question,...result.choices),follow];
  if(third)parts.push(third);
  const evidence=key==='ovarian-cycle'?prompt+' Tissue observation: '+result.note:prompt;
  return item(lab.section,key,evidence,parts,result.why+' '+parts.slice(1).map(p=>p.type==='choice'?p.choices[0]+'.':p.expected+' '+(p.unit||'')+'.').join(' '),{columns,rows});
}
const flux=pick('What determines the direction of net diffusion of this gas across the barrier?','Its partial-pressure gradient','Total oxygen content including hemoglobin-bound oxygen','The direction in which blood flows along the capillary');
const immuneSignal=pick('Which cells directly secrete large amounts of antibody?','Plasma cells','Helper T cells','Resting memory B cells');
function oxygen(n){
  const alveolus=[100,90,85][n],blood=[40,100,85][n];
  const direction=alveolus>blood?'From air to blood':alveolus<blood?'From blood to air':'No net diffusion';
  return item('22.4','oxygen-gradient','Compare the two sides of an exchange barrier for oxygen only.',
    [pick('In what direction does net oxygen diffusion initially occur?',direction,...['From air to blood','From blood to air','No net diffusion'].filter(x=>x!==direction)),flux],
    'Oxygen diffuses from higher to lower oxygen partial pressure. Equal partial pressures give no net flux.',
    data(['Compartment','Oxygen partial pressure (mmHg)'],['Air compartment',alveolus],['Adjacent blood',blood]));
}
function transport(n){
  const tidal=[500,450,600][n], dead=[150,125,200][n], rate=[12,16,10][n];
  return item('22.3','ventilation','Use the measured respiratory pattern in the table.',
    [number('Calculate total minute ventilation in L/min.',tidal*rate/1000,'L/min'),number('Calculate alveolar ventilation in L/min.',(tidal-dead)*rate/1000,'L/min')],
    'Minute ventilation is tidal volume times rate. For alveolar ventilation subtract dead space per breath before multiplying.',
    data(['Tidal volume (mL)','Dead space (mL)','Rate (breaths/min)'],[tidal,dead,rate]));
}
function antigen(n){
  const t=[
    ['Enzyme-linked antibodies in serum rise after a booster','Faster B-cell response on re-exposure','Memory B cells','Cilia','Platelets'],
    ['A newborn has circulating maternal IgG before any exposure to its antigen','Transferred protection that declines over time','Maternal antibody','Newborn memory B cells','Neutrophil memory'],
    ['Serum antibody rises after the first dose of a vaccine','Active adaptive response after a lag','Activated B cells','Passive transfer of donor antibody','Skin keratinocytes'],
  ][n];
  return item('21.4','antibody-source','Interpret the immunological observation.',
    [pick('Which interpretation best fits?',t[1],...['Faster B-cell response on re-exposure','Transferred protection that declines over time','Active adaptive response after a lag'].filter(v=>v!==t[1])),pick('What explains this response?',t[2],t[3],t[4])],
    t[0]+'. '+t[1]+' is explained by '+t[2].toLowerCase()+'.',data(['History or sampling observation'],[t[0]]));
}
function digestiveSample(n){
  const sets=[['Stomach',2,'Pepsin','Protein'],['Duodenum',7.5,'Pancreatic lipase','Triglyceride'],['Mouth',7,'Salivary amylase','Starch']];
  const [site,ph,enzyme,substrate]=sets[n];
  return item('23.7','digestion-sample','Choose the enzyme–substrate pair that fits this specimen.',
    [pick('Which of these enzymes normally acts here?',enzyme,...sets.filter(r=>r[2]!==enzyme).map(r=>r[2])),pick('Which substrate is its main target?',substrate,...sets.filter(r=>r[3]!==substrate).map(r=>r[3]))],
    enzyme+' acts on '+substrate.toLowerCase()+' at this site.',data(['Sample site','Approximate luminal pH'],[site,ph]));
}
function secretions(n){
  const rows=[['Bile is diverted before it reaches the intestine. Pancreatic secretion is intact.','Emulsification of dietary fat','Long-chain lipids'],['An intestinal brush-border sample lacks lactase. Pancreatic secretion is intact.','Hydrolysis of lactose','Lactose'],['Pancreatic protease activation fails despite normal enzyme synthesis.','Breakdown of polypeptides','Dietary protein']];
  const [finding,process,nutrient]=rows[n];
  return item('23.7','digestive-loss','Read the isolated change in this teaching experiment.',
    [pick('Which process decreases most directly?',process,...rows.filter(r=>r[1]!==process).map(r=>r[1])),pick('Which nutrient is most directly affected?',nutrient,...rows.filter(r=>r[2]!==nutrient).map(r=>r[2]))],
    finding+' The immediate loss is '+process.toLowerCase()+', affecting '+nutrient.toLowerCase()+'.',data(['Experimental observation'],[finding]));
}
function nitrogen(n){
  const aa=[12,16,20][n];
  return item('24.4','nitrogen','Follow the fate of a labeled amino group and its carbon skeleton.',
    [pick('What principal nitrogen-containing waste will the liver form?','Urea','Uric acid','Carbon dioxide'),pick('Which renal process first moves this freely filterable waste from blood into capsular space?','Glomerular filtration','Tubular secretion at the papilla','Venous return')],
    'Amino nitrogen can enter the urea cycle. The kidney filters urea, with subsequent tubular handling.',data(['Tracer input','Condition'],[aa+' g dietary protein equivalent','Amino acids are being broken down.']));
}
function tonicity(n){
  const salt=[350,250,300][n];
  return experiment('tonicity',waterShift,{initialVol:1,outside:salt},'Only water crosses this model membrane. The bath concentration remains fixed.',
    pick('What happens to cell volume at equilibrium?',['Falls','Rises','Stays the same'][n],...['Falls','Rises','Stays the same'].filter((_,i)=>i!==n)));
}
function hormoneData(n){
  const high=n!==1;
  return item('26.2','urine-response','A healthy volunteer gains or loses water. Effective circulating volume is held constant. Compare the measurements with this person’s baseline.',
    [pick('Which change in ADH release is expected?',high?'Increase':'Decrease',high?'Decrease':'Increase','No change from baseline'),
      pick('Which way does collecting-duct water permeability change?',high?'It rises':'It falls',high?'It falls':'It rises','It remains at its baseline value')],
    'With intact feedback, higher osmolality increases ADH and collecting-duct water permeability. Lower osmolality has the opposite effect.',
    data(['Time','Plasma osmolality (mOsm/kg)'],['Baseline',285],['After water shift',[298,272,302][n]]));
}
function androgenData(n){
  const sets=[['LH declines while FSH remains stable.','Leydig cells','Testosterone production falls'],['FSH declines while LH remains stable.','Sertoli cells','Support for spermatogenesis decreases'],['The preovulatory LH surge is absent while a dominant follicle is present.','Mature ovarian follicle','Ovulation is less likely']];
  const [clue,target,result]=sets[n];
  return item(n===2?'27.2':'27.1','gonad-signals','Predict the immediate tissue response to the isolated signal change.',
    [pick('Which target is most directly affected?',target,...sets.filter(r=>r[1]!==target).map(r=>r[1])),pick('Which outcome follows?',result,...sets.filter(r=>r[2]!==result).map(r=>r[2]))],
    clue+' '+result+'.',data(['Pituitary observation'],[clue]));
}
function renalBarrier(n){
  const sets=[['Red cells remain within glomerular capillaries.','Efferent arteriole','Peritubular capillaries or vasa recta'],['A filtered molecule reaches capsular space and remains in the lumen.','Proximal convoluted tubule','Nephron loop'],['Urine emerges from a renal papilla.','Minor calyx','Major calyx']];
  const [clue,next,later]=sets[n];
  return item(n===2?'25.3':'25.4','kidney-routes','Trace the sample through two successive structures in its own pathway.',
    [pick('Where does it go next?',next,...sets.filter(r=>r[1]!==next).map(r=>r[1])),pick('Which structure follows that destination?',later,...sets.filter(r=>r[2]!==later).map(r=>r[2]))],
    'The relevant sequence is '+next+' then '+later+'.',data(['Tracking condition'],[clue]));
}
function labBlood(n,third){
  const follow=[['Increase net acid excretion','Decrease net acid excretion','Increase renal bicarbonate loss'],['Increase renal bicarbonate loss','Increase bicarbonate retention','Increase net acid excretion'],['Increase alveolar ventilation','Decrease alveolar ventilation','Keep alveolar ventilation at baseline']][n];
  return experiment('blood-gas',acidBase,{panel:n},'Interpret this single primary disturbance. Reference intervals: pH 7.35–7.45, PCO₂ 35–45 mmHg, bicarbonate 22–26 mmol/L.',
    pick('Which compensatory response would move pH toward normal?',...follow),third?pick('Which variable changes directly within minutes when effective alveolar ventilation increases at fixed CO₂ production?','Arterial PCO₂ falls','Arterial PCO₂ rises','Arterial PCO₂ holds steady'):null);
}
function inheritance(n,third){
  return experiment('pedigree',pedigree,{evidence:n},'This autosomal recessive trait is fully penetrant. Assume independent segregation and no new mutations.',
    pick('What is the chance of the next child showing the trait?','1/4','1/2','2/3'),
    third?pick('If an affected child later has offspring with a confirmed AA partner, which outcome is expected?','All offspring are unaffected carriers','Half have the recessive trait','All are AA'):null);
}
function nutrientEnergy(n,third){
  const [portion]=foodEnergy.run({meal:n}).observation.rows;
  const nutrients=['Carbohydrate','Protein','Fat'];
  const energies=portion.map((mass,i)=>mass*(i===2?9:4));
  const key=nutrients[energies.indexOf(Math.max(...energies))];
  return experiment('food-energy',foodEnergy,{meal:n},'Use 4 kcal/g for carbohydrate and protein and 9 kcal/g for fat.',
    pick('Which macronutrient supplies the most energy in this particular serving?',key,...nutrients.filter(s=>s!==key)),
    third?number('Replace 3 g of carbohydrate with 3 g of fat. By how many kcal does the serving’s energy increase?',15,'kcal'):null);
}
function birthStation(n){
  const station=experiment('birth-transition',birth,{event:n},'Follow the event in the observation to its physiological effect.',
    n===2?pick('Which anterior pituitary signal supports continued milk synthesis?','Prolactin','Oxytocin','Progesterone'):
    pick('Which fetal connection normally links the pulmonary trunk and aorta?','Ductus arteriosus','Ductus venosus','Foramen ovale'));
  return n===2?{...station,section:'28.6'}:station;
}
export function chapterEvidence(ch,n) {
  switch(ch){
    case 21: return [fieldItem(21,n),surface('lymph-drainage',n),experiment('response-curve',antibody,{series:n%2},'Samples follow equal doses of the same antigen. Compare the lag and magnitude to a typical first response.',immuneSignal),antigen(n)];
    case 22: return [fieldItem(22,n),oxygen(n),transport(n),experiment('pressure',breathing,{moment:n},'Use airway pressures relative to atmospheric pressure.',
      pick('What drives bulk airflow when the airway is open?','A pressure difference between alveoli and atmosphere','Oxygen binding to hemoglobin','The oxygen partial pressure of venous blood'))];
    case 23: return [fieldItem(23,n),surface('villus',n),digestiveSample(n),secretions(n)];
    case 24: return [nutrientEnergy(n),experiment('heat-balance',heat,{evap:[80,160,240][n]},'Compare the three heat transfer rates for this interval.',
      number('Calculate net heat storage rate (production minus loss) in W.',[80,0,-80][n],'W')),experiment('fed-fast',fedFast,{state:n%2},'Interpret the metabolic state in this experiment.',
      pick('Which is a normal use for a contracting muscle’s own glycogen?','Local ATP generation','Direct glucose export to blood','Conversion into red blood cells')),nitrogen(n)];
    case 25: return [fieldItem(25,n),surface('kidney',n),renalBarrier(n),experiment('renal-balance',excretion,{reabs:[65,25,40][n],secrete:[15,45,40][n]},'Trace the steady movement of one freely filtered solute.',
      number('Calculate excretion rate in mg/min.',[50,120,100][n],'mg/min'))];
    case 26: return [tonicity(n),hormoneData(n),labBlood(n),electrolytes(n)];
    case 27: return [fieldItem(27,n),surface('sperm-route',n),androgenData(n),experiment('ovarian-cycle',ovarian,{interval:n},'Compare each hormone with itself across days. Values are relative units on separate scales.',
      pick('Which ovarian structure supplies most progesterone after ovulation in a typical nonpregnant cycle?','Corpus luteum','Primordial follicle','Fimbria'))];
    case 28: return [inheritance(n),surface('placental-exchange',n),experiment('embryo-stage',development,{stage:n},'Identify the developmental stage from the observed structures.',
      pick('Which process gives rise to the three germ layers?','Gastrulation','Cleavage','Neurulation')),birthStation(n)];
  }
}
function electrolytes(n){
  const sets=[['Aldosterone rises with intact renal targets.','More sodium reabsorption','More potassium secretion'],['Aldosterone falls with other inputs fixed.','Less sodium reabsorption','Less potassium secretion'],['Aldosterone receptors in principal cells are blocked despite high circulating hormone.','Less sodium reabsorption','Less potassium secretion']];
  const [finding,sodium,potassium]=sets[n];
  return item('26.3','distal-ion','Compare distal nephron transport with baseline.',
    [pick('What changes in sodium handling?',sodium,sodium.startsWith('More')?'Less sodium reabsorption':'More sodium reabsorption','No change in distal sodium reabsorption'),pick('What changes in potassium handling?',potassium,potassium.startsWith('More')?'Less potassium secretion':'More potassium secretion','No change in distal potassium secretion')],
    'Aldosterone promotes distal sodium uptake and potassium secretion. Reduced signaling decreases both effects.',data(['Hormone condition'],[finding]));
}
export function springPracticalStations(n){
  return [surface('lymph-drainage',n,true),surface('lung-lobes',n,true),fieldItem(23,n,true),nutrientEnergy(n,true),surface('kidney',n,true),labBlood(n,true),fieldItem(27,n,true),inheritance(n,true)];
}
