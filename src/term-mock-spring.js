import {chapters,examItems} from './ap3-curriculum.js';
import {drainage,absorption,digestiveRoutes,nephron,sperm} from './ap3-labs-routes.js';
import {chapterEvidence,springPracticalStations} from './term-mock-spring-evidence.js';
import {chapterShort,chapterWriting,recallChoices} from './term-mock-spring-recall.js';
import {ordered,pick,term,number,data,item} from './term-mock-spring-items.js';

const all=chapters.map(c=>c.id);
export const springScopes=[
  {id:'unit-1',title:'Immunity and respiration',chapters:[21,22]},
  {id:'unit-2',title:'Digestion and metabolism',chapters:[23,24]},
  {id:'unit-3',title:'Kidneys and fluid balance',chapters:[25,26]},
  {id:'unit-4',title:'Reproduction, development and inheritance',chapters:[27,28]},
  {id:'all',title:'Cumulative spring mock',chapters:all},
  {id:'practical',title:'Cumulative spring practical',chapters:all},
];

const extensionRows=[
  ['21.2','A cut breaches the epidermis. Which event most directly promotes entry of neutrophils into the surrounding tissue?','Inflammatory signaling increases endothelial adhesion and recruitment','Erythrocytes begin presenting antibody to T cells','The epidermis becomes a site of B-cell selection','Local mediators promote leukocyte adhesion, migration and chemotaxis.'],
  ['21.3','A cell presents an intracellular peptide on MHC I. Which lymphocyte can recognize the complex and kill that cell?','An antigen-specific CD8 T cell','A CD4 helper T cell recognizing peptide on MHC II','A B cell recognizing surface antigen through its B-cell receptor','Cytotoxic CD8 T cells survey peptide–MHC I complexes on nucleated cells.'],
  ['21.4','Which observation distinguishes active immunity after vaccination from protection by preformed antibody?','An antigen-specific memory population forms in the recipient','An immediate antibody level always proves memory','All transferred immunoglobulin lasts for life','Active immunity recruits the recipient’s adaptive response and memory.'],
  ['22.3','Two adults have identical minute ventilation. One takes smaller breaths more often. Anatomical dead space per breath is fixed. Which receives less fresh air per minute at the alveoli?','The person taking smaller, more frequent breaths','The person taking deeper, slower breaths','They must have identical alveolar ventilation','A larger fraction of minute ventilation repeatedly fills dead space in the shallow pattern.'],
  ['22.4','The gas, barrier thickness and partial-pressure difference stay fixed. If functioning exchange area doubles, how does diffusion rate change?','Approximately doubles','Falls to half','Remains unchanged','Fick’s diffusion relationship is proportional to surface area.'],
  ['22.5','At an active tissue, local pH falls and temperature rises. What does hemoglobin tend to do at the same oxygen partial pressure?','Release more oxygen','Bind oxygen more tightly','Keep the same oxygen affinity despite the local changes','Acidification and warming favor oxygen unloading in metabolically active tissue.'],
  ['23.4','A gastric sample contains pepsinogen but its pH stays near neutral. What function is most impaired?','Activation and normal activity of pepsin','Conversion of trypsinogen in the duodenum','Brush-border digestion of disaccharides in the jejunum','Acid promotes pepsin activation and activity in the normal gastric lumen.'],
  ['23.7','Lipase acts normally, but there are few bile salts. Which step becomes less effective?','Emulsification and transfer of lipid products in micelles','Cleavage of peptide bonds by pepsin','Direct glucose entry into portal capillaries','Bile salts disperse fats and assist delivery of digestion products to enterocytes.'],
  ['23.2','A segment of intestine contracts at alternating sites with little net forward propulsion. What does this accomplish?','Mixes chyme and improves contact with the absorptive surface','Moves contents rapidly in one direction only','Seals the bile duct after a meal','Segmentation mainly mixes intestinal contents.'],
  ['24.3','During prolonged fasting, the liver makes a water-soluble fuel from fatty-acid-derived acetyl-CoA. What is it?','Ketone bodies','Glycogen granules','Urea','Hepatic ketogenesis makes ketone bodies available to extrahepatic tissues.'],
  ['24.4','A labeled amino nitrogen atom reaches hepatic urea. Which organ normally removes much of this labeled waste from blood?','Kidney','Spleen','Gallbladder','Urea is carried in blood to the kidneys and partly excreted.'],
  ['24.5','Why can liver glycogen support plasma glucose while muscle glycogen mainly fuels local work?','Liver can generate free glucose from glucose-6-phosphate for export','Muscle has no glycogen phosphorylase','Only exercise converts glucose into glycogen','Hepatic glucose-6-phosphatase enables release of free glucose.'],
  ['25.3','Urine leaving a renal papilla encounters a small cup. Where does fluid go after that first cup?','Major calyx','Glomerular capsule','Descending nephron loop','Minor calyces receive papillary outflow before converging on major calyces.'],
  ['25.6','A solute’s reabsorption stays fixed while secretion increases. Its filtered load is unchanged. What happens to excretion?','It increases by the increase in secretion','It falls by the increase in secretion','It is fixed by filtration alone','Excretion equals filtration minus reabsorption plus secretion.'],
  ['25.8','Plasma osmolality falls after water intake and effective blood volume is stable. Which change is expected in collecting ducts?','Water permeability decreases as ADH falls','Water permeability rises because ADH rises','Filtration slits close to all water','Lower ADH reduces aquaporin-2 insertion and promotes dilute urine.'],
  ['26.1','What happens to water in an intact red cell placed in an extracellular solution with a higher concentration of nonpenetrating solute?','Net water moves out and cell volume falls','Net water moves in and cell volume rises','Net water movement stops immediately and cell volume is stable','Water shifts toward the side of higher effective osmotic concentration.'],
  ['26.2','Two volunteers have the same ADH, but one lacks a medullary osmotic gradient. Which capacity is reduced?','Concentrating urine above plasma osmolality','Filtering plasma at an otherwise normal glomerulus','Reclaiming glucose in an otherwise normal proximal tubule','Even a water-permeable duct needs an osmotic driving force to draw out water.'],
  ['26.3','In otherwise healthy kidneys, which stimulus can directly increase aldosterone secretion?','Elevated plasma potassium','A fall in plasma potassium below normal','High oxygen partial pressure in alveoli','Adrenal zona glomerulosa cells respond directly to raised plasma potassium.'],
  ['26.4','Why can bicarbonate buffering respond quickly to an added small acid load?','Bicarbonate binds added hydrogen ions','The lungs increase CO₂ retention','The kidney immediately raises plasma bicarbonate by new synthesis','Chemical buffering rapidly redistributes hydrogen ions before organ compensation.'],
  ['26.5','An isolated increase in alveolar ventilation lowers PCO₂. What primary acid–base direction follows?','Respiratory alkalosis','Respiratory acidosis','Metabolic acidosis','With less CO₂, the carbonic acid equilibrium shifts toward lower hydrogen ion concentration.'],
  ['27.1','Which feature helps maintain normal conditions for developing sperm?','The scrotum allows testicular temperature below core temperature','Sperm develop only at temperatures above core temperature','Scrotal position keeps the testes at a constant core temperature','Scrotal positioning and heat exchange assist temperature regulation.'],
  ['27.1','Sperm output declines after selective disruption of Sertoli cells. Which direct support is reduced?','Nourishment and organization of developing germ cells','Leydig cell synthesis of all testosterone as the primary target','Storage of mature sperm in the epididymal tail as the primary target','Sertoli cells support germ cells inside the seminiferous epithelium.'],
  ['27.2','After a normal ovulation, a hormone rises from an ovarian structure derived from the ruptured follicle. What is its major endometrial effect?','Maintains secretory endometrium','Directly initiates shedding while its level is high','Drives proliferative regrowth as the dominant preovulatory signal','Luteal progesterone supports the secretory phase.'],
  ['27.2','Which lining normally sheds its functional layer in menstruation?','Endometrium','Myometrium','Perimetrium','Loss of ovarian steroid support leads to shedding of the superficial functional endometrium.'],
  ['27.3','Anti-Müllerian hormone is produced during typical fetal testicular development. Which embryonic structures regress in response?','Paramesonephric ducts','Mesonephric ducts','Seminiferous cords','AMH from Sertoli cells promotes paramesonephric duct regression.'],
  ['28.7','An AB parent and an O parent have a child. Under standard ABO inheritance, which phenotypes are possible?','A or B','AB or O only','O only','The AB parent transmits either A or B, and the O parent transmits O.'],
  ['28.7','A woman heterozygous for an X-linked recessive allele and an unaffected man have a son. Assuming full penetrance, what is the probability this son expresses it?','One half','One quarter','All sons','A son receives his X from his mother. Half of her eggs carry the recessive variant.'],
  ['28.7','Two alleles are both expressed in a heterozygote, as in ABO group AB. Which term fits?','Codominance','Complete dominance','Autosomal recessivity','Both A and B antigens appear on the red cell in an AB individual.'],
  ['28.7','For an autosomal dominant variant with full penetrance, what is the chance an unaffected aa parent and a heterozygous Aa parent have an affected child?','One half','One quarter','Zero','The heterozygous parent passes A in half of conceptions.'],
  ['28.2','A conceptus contains trophoblast, inner cell mass and a cavity. What event normally follows arrival in the uterus?','Implantation of the blastocyst','Fertilization of a second oocyte by the same conceptus','Formation of mature gametes in the uterine wall','The blastocyst attaches to endometrium and trophoblast participates in implantation.'],
];

function choice(section,id,prompt,choices,answer,why,objective){
  return {section,id,type:'choice',points:1,prompt,choices,answer,why,objective:objective||section};
}
const base=examItems.map(q=>choice(q.section,q.id,q.prompt,q.options,q.answer,q.why));
for(const ch of chapters)for(const s of ch.sections)base.push(choice(s.id,'checkpoint-'+s.id,s.question,s.options,s.answer,s.why));
extensionRows.forEach(([s,p,a,b,c,w],i)=>base.push(choice(s,'extension-'+i,p,[a,b,c],0,w)));
for(const activity of [drainage,absorption,digestiveRoutes,nephron,sperm]){
  for(const [r,route] of activity.routes.entries())for(const [i,[correct,b,c,why]] of route.steps.entries()){
    const origin=i?route.steps[i-1][0]:route.start;
    const prompt='Trace the route for '+route.label.toLowerCase()+'. Starting at '+origin+', which step follows?';
    const s=activity===digestiveRoutes&&r===0?'23.1':activity.section;
    base.push(choice(s,'route-'+activity.section+'-'+r+'-'+i,prompt,[correct,b,c],0,why));
  }
}
function balancedChoices(ch,count,scope,n) {
  // Allocate the forms together. Give each section one seat before distributing
  // the rest, and use fresh stems before repeating ones used by an earlier form.
  const seen=new Map();
  const sectionSeats=new Map();
  let result;
  for(let form=0;form<=n;form++){
    const bySection=new Map();
    result=[];
    const pool=ordered([...base.filter(q=>Number(q.section.split('.')[0])===ch),...recallChoices(ch,form)],scope+ch+form);
    while(result.length<count){
      pool.sort((a,b)=>{
        const ac=bySection.get(a.section)||0,bc=bySection.get(b.section)||0;
        const previous=scope==='all'?(sectionSeats.get(a.section)||0)-(sectionSeats.get(b.section)||0):0;
        return Number(ac>0)-Number(bc>0) || previous || (seen.get(a.id)||0)-(seen.get(b.id)||0) || ac-bc;
      });
      const q=pool.shift();
      if(!q)throw Error('Too few choice questions for Chapter '+ch);
      result.push(q);
      bySection.set(q.section,(bySection.get(q.section)||0)+1);
    }
    for(const q of result){
      seen.set(q.id,(seen.get(q.id)||0)+1);
      sectionSeats.set(q.section,(sectionSeats.get(q.section)||0)+1);
    }
  }
  return result;
}
function scoredChoices(p,seed){
  if(!p.choices)return p;
  const correct=p.choices[p.answer],choices=ordered(p.choices,seed);
  return {...p,choices,answer:choices.indexOf(correct)};
}
function publish(q,form,scope){
  // Snapshots go into local storage, so exclude functions, shared object references
  // and mutable catalogs. Every variant has a stable item identity.
  // The writing rubrics and their existing calibration still use revision 1.
  const version=q.type==='written'?'1':'2';
  const stable='ap3-mock-v'+version+'-'+scope+'-'+q.id+'-'+form;
  const result=scoredChoices({...q,id:stable,version},stable);
  if(q.parts)result.parts=q.parts.map((p,i)=>scoredChoices(p,stable+i));
  return JSON.parse(JSON.stringify(result));
}

export function makeSpringMock(scopeId,form='A'){
  const scope=springScopes.find(s=>s.id===scopeId),n=['A','B','C'].indexOf(form);
  if(!scope||n===-1)throw new RangeError('Unknown spring mock or form.');
  if(scopeId==='practical')return springPracticalStations(n).map(q=>publish(q,form,scopeId));
  const cumulative=scopeId==='all';
  const choices=scope.chapters.flatMap((ch,i)=>balancedChoices(ch,cumulative?(i<6?4:3):15,scopeId,n));
  const extras=cumulative?cumulativeItems(n):[
    ...scope.chapters.flatMap(ch=>chapterEvidence(ch,n)),
    ...scope.chapters.flatMap(ch=>chapterShort(ch,n)),
    ...scope.chapters.map(ch=>chapterWriting(ch,n))];
  return [...ordered(choices,scopeId+form),...extras].map(q=>publish(q,form,scopeId));
}

function integrated(q,otherSection){return {...q,relatedSections:[otherSection]};}
function maternalAntibody(n){
  const sets=[
    ['Colostrum is given to a newborn','Antigen-specific secretory antibody is present','Which antibody predominates in this mucosal secretion?','IgA','IgG','IgE'],
    ['The fetus has not encountered the antigen','Matching maternal antibody is present in fetal blood','Which antibody class normally crosses the placenta in substantial amounts?','IgG','IgM','IgA'],
    ['A newborn ingests secretory antibody in milk','Antibody binds microbial surface antigens in the infant gut','What direct effect follows at this mucosal surface?','Reduced microbial attachment','Inherited resistance in every intestinal epithelial cell','Newborn plasma cells immediately produce all the milk antibodies'],
  ];
  const [condition,observed,p,a,b,c]=sets[n];
  return integrated(item('21.4','integration-antibody','Identify the type and mechanism of protection in the infant.',
    [pick('What kind of immunity does this transfer supply?','Naturally acquired passive immunity','Naturally acquired active immunity','Innate mechanical immunity'),pick(p,a,b,c)],
    'The antibody came from the parent, giving passive protection. '+p+' '+a+'.',data(['Condition','Finding'],[condition,observed])),n===1?'28.3':'28.6');
}
function intestinalReturn(n){
  const sets=[
    ['Central lymphatic capillary after a fat-containing meal','Chylomicrons carrying long-chain lipid','Thoracic duct'],
    ['Venule draining the absorptive villus after a carbohydrate-containing meal','Glucose dissolved in plasma','Hepatic portal vein'],
    ['Intestinal lymphatic trunk after absorption of long-chain fat','Chylomicrons carrying long-chain lipid','Thoracic duct'],
  ];
  const [origin,material,channel]=sets[n];
  return integrated(item('23.7','integration-villus','Trace absorbed material through its normal route.',
    [pick('Which absorbed material fits this sample?',material,n===1?'Intact chylomicrons as the main route':'Intact starch granules','Whole dietary proteins as the main route'),
      pick('Which major conduit subsequently carries this material?',channel,n===1?'Thoracic duct':'Hepatic portal vein','Common hepatic duct')],
    'Villus blood capillaries carry absorbed monosaccharides toward portal blood. Chylomicrons enter lymph and travel to venous blood via the thoracic duct.',
    data(['Sample','Observation'],['Origin',origin])),n===1?'24.5':'21.1');
}
function ductFeedback(n){
  const rises=n!==1;
  return integrated(item('25.8','integration-water','Compare collecting-duct transport with the osmoregulatory feedback stimulus.',
    [pick('Which change in ADH release ordinarily produces this response?',rises?'Increased release':'Decreased release',rises?'Decreased release':'Increased release','No change in ADH signaling'),
      pick('Which plasma change would drive that response with stable effective circulating volume?',rises?'Higher effective osmolality':'Lower effective osmolality',rises?'Lower effective osmolality':'Higher effective osmolality','Unchanged effective osmolality')],
    'Higher plasma tonicity promotes ADH release and insertion of apical water channels. Lower tonicity has the opposite effect.',
    data(['Measurement','Before','After'],['Apical aquaporin-2 relative abundance',100,[145,55,170][n]])),'26.2');
}
function respiratoryMetabolism(n){
  const settings=[
    ['Steady exercise; ventilation stays at its resting rate',200,400,4,4,'It rises'],
    ['Recovery at a steady lower workload',400,200,8,4,'It remains approximately unchanged'],
    ['Exercise at a new steady level',200,300,4,8,'It falls'],
  ];
  const [condition,rest,work,before,after,key]=settings[n];
  return integrated(item('22.5','integration-gas','Use both rates to predict arterial carbon dioxide after a change in workload. Assume healthy gas exchange at each steady state.',
    [pick('Compared with the first state, what happens to arterial PCO₂?',key,...['It rises','It remains approximately unchanged','It falls'].filter(v=>v!==key)),
      pick('How do red cells carry most of the metabolically produced CO₂ onward?','Convert it to bicarbonate, much of which enters plasma','Bind it mainly to amino groups on hemoglobin as carbaminohemoglobin','Retain it mainly as dissolved gas in red cell water')],
    'Arterial PCO₂ tracks CO₂ production divided by alveolar ventilation. The ratio changes from '+rest+'/'+before+' to '+work+'/'+after+'. Carbonic anhydrase in red cells speeds formation of bicarbonate.',
    data(['Measurement', 'Initial steady state',condition],['CO₂ production (mL/min)',rest,work],['Alveolar ventilation (L/min)',before,after])),'24.2');
}
function nitrogenClearance(n){
  const cases=[
    ['A meal contains amino acids labeled in their amino groups.','Label appears in circulating urea.',
      pick('Which organ first incorporated most of the label into urea?','Liver','Kidney','Small intestine'),
      pick('How does circulating urea first enter normal tubular fluid?','Filtration across glomerular capillaries','Secretion from peritubular capillaries','Reabsorption across collecting ducts'),
      'Amino nitrogen enters the hepatic urea cycle. Blood carries the product to glomeruli, where it can be filtered.'],
    ['Urea from amino acid breakdown is freely filtered.','Plasma urea = 0.30 mg/mL; GFR = 100 mL/min.',
      number('How much urea is filtered each minute? Enter mg/min.',30,'mg/min'),
      pick('If urinary excretion is 12 mg/min, which is true of net tubular handling?','Net reabsorption of 18 mg/min','Net secretion of 18 mg/min','Net reabsorption of 42 mg/min'),
      'Filtered load is plasma concentration times GFR: 0.30 × 100 = 30 mg/min. Excretion is 18 mg/min less than filtration, so the net movement is back into blood.'],
    ['Two steady states have equal GFR and equal net fractional urea reabsorption.','After more amino acids are broken down, plasma urea rises from 0.20 to 0.30 mg/mL.',
      pick('How does filtered urea load change?','Increases by one half','Falls by one third','Stays constant'),
      pick('Which step supplies amino nitrogen for the extra hepatic urea?','Removal of amino groups during amino acid catabolism','Removal of two-carbon units during fatty acid oxidation','Mobilization of glucose units from glycogen'),
      'At fixed GFR, filtered load increases in proportion to plasma concentration (0.30/0.20 = 1.5). Catabolism of amino acids releases nitrogen that the liver can convert to urea.'],
  ];
  const [setup,observation,first,second,why]=cases[n];
  return integrated(item('24.4','integration-urea','Relate protein metabolism to renal handling of its nitrogenous waste.',[first,second],why,data(['Condition','Observation'],[setup,observation])),'25.5');
}
function cumulativeRecall(n){
  const variants=[
    [
      ['23.7','24.5','After a carbohydrate-rich meal, absorbed glucose passes from intestinal blood capillaries to the liver.',term('Name the principal vein delivering this blood.','Hepatic portal vein',['portal vein'],['hepatic vein']),term('Name the pancreatic hormone that promotes storage of this glucose.','Insulin',[],['glucagon']),'The hepatic portal vein delivers absorbed monosaccharides to the liver. In the fed state, insulin favors glycogen synthesis.'],
      ['26.5','22.3','A single primary disturbance produces arterial pH 7.28, bicarbonate 15 mmol/L and PCO₂ 32 mmHg.',term('Name the primary disturbance.','Metabolic acidosis',[],['respiratory acidosis','metabolic alkalosis']),pick('Which change explains the compensatory PCO₂?','Increased alveolar ventilation','Decreased alveolar ventilation','Unchanged ventilation at constant CO₂ production'),'Low pH and bicarbonate identify metabolic acidosis. Increased ventilation lowers PCO₂.'],
      ['27.2','28.4','An early implanted conceptus maintains the ovary’s temporary endocrine structure.',term('What signal comes from the trophoblast?','Human chorionic gonadotropin',['hCG','chorionic gonadotropin']),term('What ovarian structure does it preserve?','Corpus luteum'),'hCG maintains the progesterone-secreting corpus luteum early in pregnancy.'],
      ['28.5','22.7','A newborn aerates the lungs for the first time.',pick('What happens to pulmonary vascular resistance?','It falls','It rises','It stays at the fetal level'),term('Name the atrial communication that functionally closes as left atrial pressure rises.','Foramen ovale'),'Aeration lowers pulmonary resistance, increases return to the left atrium and helps close the foramen ovale.'],
    ],[
      ['23.6','24.3','A blockage prevents bile salts from reaching the duodenum while pancreatic lipase remains available.',term('What bile-salt aggregates usually carry digestion products to the enterocyte surface?','Micelles',['micelle','mixed micelles'],['chylomicrons']),term('After absorption, in what particles do enterocytes export most long-chain dietary lipid?','Chylomicrons',['chylomicron'],['micelles']),'Bile salt micelles deliver digested lipid to the brush border. Enterocytes package absorbed lipid into chylomicrons for lymphatic transport.'],
      ['26.5','22.3','Several hours of excessive ventilation give arterial pH 7.49, bicarbonate 22 mmol/L and PCO₂ 30 mmHg. Assume a single primary process.',term('Name the primary disturbance.','Respiratory alkalosis',[],['metabolic alkalosis','respiratory acidosis']),pick('If this persists, how do the kidneys help restore pH?','Excrete more bicarbonate','Reabsorb more bicarbonate','Increase net acid excretion'),'Low PCO₂ drives the alkalemia. Less renal bicarbonate retention tends to return pH toward baseline.'],
      ['28.1','27.1','A sperm has reached the oocyte. Enzymes from a cap on its head are exposed as it encounters the oocyte coverings.',term('Name this cap.','Acrosome',['acrosomal cap']),term('Name the glycoprotein coat outside the oocyte plasma membrane.','Zona pellucida'),'Acrosomal enzymes assist passage through the coverings, including the zona pellucida, before membrane fusion.'],
      ['28.5','22.7','A preterm newborn has insufficient secretion from type II alveolar cells.',term('What substance is deficient?','Pulmonary surfactant',['surfactant']),pick('Compared with normal, what happens to small alveoli at end expiration?','They are more prone to collapse','They resist collapse more strongly','Their surface tension falls further'),'Surfactant lowers surface tension. Deficiency makes inflation harder and increases the tendency for alveoli to collapse.'],
    ],[
      ['24.5','23.6','Eighteen hours after a meal, the small intestine is delivering little glucose, but the liver still exports it.',term('Which hormone from pancreatic alpha cells supports hepatic glucose release as insulin falls?','Glucagon',[],['insulin']),term('Which pathway makes new glucose from lactate?','Gluconeogenesis',[],['glycogenolysis','glycogenesis']),'A higher glucagon-to-insulin ratio favors hepatic output. Gluconeogenesis uses lactate and other precursors as glycogen stores fall.'],
      ['26.5','25.6','Sustained hypoventilation gives arterial pH 7.31, PCO₂ 60 mmHg and bicarbonate 29 mmol/L. Assume a single primary disturbance.',term('Name the primary disturbance.','Respiratory acidosis',[],['metabolic acidosis','respiratory alkalosis']),pick('Which response helps account for the bicarbonate measurement?','Increased renal net acid excretion','Increased renal loss of bicarbonate','Reduced renal secretion of hydrogen ions'),'Elevated CO₂ is acidifying. Over time the kidneys retain and generate bicarbonate while increasing net acid excretion.'],
      ['27.2','28.4','As pregnancy progresses the placenta takes over production of the steroid that sustains the uterine lining.',term('Name this steroid.','Progesterone',[],['estrogen']),term('Name the uterine lining on which it acts.','Endometrium',['endometrial lining'],['myometrium']),'Progesterone supports the endometrium after ovulation and during pregnancy. Placental production succeeds the corpus luteum.'],
      ['28.3','22.4','Before birth, oxygen crosses into fetal blood at the placenta. The lungs do not yet provide this exchange.',term('Which single umbilical vessel carries the more oxygenated blood toward the fetus?','Umbilical vein',['the umbilical vein'],['umbilical artery']),term('By what passive mechanism does oxygen cross the placental barrier?','Simple diffusion',['diffusion','passive diffusion'],['active transport']),'Oxygen diffuses down its partial-pressure gradient across the placental barrier. The umbilical vein returns the more oxygenated blood to the fetus.'],
    ],
  ];
  return variants[n].map(([s,other,p,a,b,w],i)=>{
    const prompt=s==='26.5'?p+' Reference intervals: pH 7.35–7.45, PCO₂ 35–45 mmHg, bicarbonate 22–26 mmol/L.':p;
    return integrated(item(s,'integration-short-'+i,prompt,[a,b],w),other);
  });
}
function cumulativeItems(n){
  const specimen=chapterEvidence(28,n)[0],ovary=chapterEvidence(27,n)[3];
  const cases=[
    maternalAntibody(n),
    respiratoryMetabolism(n),
    intestinalReturn(n),
    nitrogenClearance(n),
    integrated(chapterEvidence(26,n)[2],'22.3'),
    ductFeedback(n),
    ovary,specimen
  ];
  const writing=[
    n===1?integrated(chapterWriting(26,2),'22.3'):integrated(chapterWriting(25,n),n===0?'26.2':'26.3'),
    integrated(n===0?chapterWriting(23,0):n===1?chapterWriting(24,1):chapterWriting(22,2),['21.1','25.5','26.4'][n])
  ];
  return [...cases,...cumulativeRecall(n),...writing];
}
