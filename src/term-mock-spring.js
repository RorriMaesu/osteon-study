import {chapters,examItems} from './ap3-curriculum.js';
import {drainage,absorption,digestiveRoutes,nephron,sperm} from './ap3-labs-routes.js';
import {chapterEvidence,springPracticalStations} from './term-mock-spring-evidence.js';
import {chapterShort,chapterWriting,recallChoices} from './term-mock-spring-recall.js';
import {ordered,pick,term,data,item} from './term-mock-spring-items.js';

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
  ['21.3','A cell presents an intracellular peptide on MHC I. Which lymphocyte can recognize the complex and kill that cell?','An antigen-specific CD8 T cell','A plasma cell secreting IgA','An erythrocyte with oxygenated hemoglobin','Cytotoxic CD8 T cells survey peptide–MHC I complexes on nucleated cells.'],
  ['21.4','Which observation distinguishes active immunity after vaccination from protection by preformed antibody?','An antigen-specific memory population forms in the recipient','An immediate antibody level always proves memory','All transferred immunoglobulin lasts for life','Active immunity recruits the recipient’s adaptive response and memory.'],
  ['22.3','Two adults have identical minute ventilation. One takes smaller breaths more often. Anatomical dead space per breath is fixed. Which receives less fresh air per minute at the alveoli?','The person taking smaller, more frequent breaths','The person taking deeper, slower breaths','They must have identical alveolar ventilation','A larger fraction of minute ventilation repeatedly fills dead space in the shallow pattern.'],
  ['22.4','The gas, barrier thickness and partial-pressure difference stay fixed. If functioning exchange area doubles, how does diffusion rate change?','Approximately doubles','Falls to half','Remains unchanged','Fick’s diffusion relationship is proportional to surface area.'],
  ['22.5','At an active tissue, local pH falls and temperature rises. What does hemoglobin tend to do at the same oxygen partial pressure?','Release more oxygen','Bind oxygen more tightly','Stop carrying carbon dioxide in any form','Acidification and warming favor oxygen unloading in metabolically active tissue.'],
  ['23.4','A gastric sample contains pepsinogen but its pH stays near neutral. What function is most impaired?','Activation and normal activity of pepsin','Pancreatic bicarbonate secretion within the stomach','Ciliary transport in the esophagus','Acid promotes pepsin activation and activity in the normal gastric lumen.'],
  ['23.7','Lipase acts normally, but there are few bile salts. Which step becomes less effective?','Emulsification and transfer of lipid products in micelles','Cleavage of peptide bonds by pepsin','Direct glucose entry into portal capillaries','Bile salts disperse fats and assist delivery of digestion products to enterocytes.'],
  ['23.2','A segment of intestine contracts at alternating sites with little net forward propulsion. What does this accomplish?','Mixes chyme and improves contact with the absorptive surface','Moves contents rapidly in one direction only','Seals the bile duct after a meal','Segmentation mainly mixes intestinal contents.'],
  ['24.3','During prolonged fasting, the liver makes a water-soluble fuel from fatty-acid-derived acetyl-CoA. What is it?','Ketone bodies','Glycogen granules','Urea','Hepatic ketogenesis makes ketone bodies available to extrahepatic tissues.'],
  ['24.4','A labeled amino nitrogen atom reaches hepatic urea. Which organ normally removes much of this labeled waste from blood?','Kidney','Spleen','Gallbladder','Urea is carried in blood to the kidneys and partly excreted.'],
  ['24.5','Why can liver glycogen support plasma glucose while muscle glycogen mainly fuels local work?','Liver can generate free glucose from glucose-6-phosphate for export','Muscle has no glycogen phosphorylase','Only exercise converts glucose into glycogen','Hepatic glucose-6-phosphatase enables release of free glucose.'],
  ['25.3','Urine leaving a renal papilla encounters a small cup. Where does fluid go after that first cup?','Major calyx','Glomerular capsule','Descending nephron loop','Minor calyces receive papillary outflow before converging on major calyces.'],
  ['25.6','A solute’s reabsorption stays fixed while secretion increases. Its filtered load is unchanged. What happens to excretion?','It increases by the increase in secretion','It falls by the increase in secretion','It is fixed by filtration alone','Excretion equals filtration minus reabsorption plus secretion.'],
  ['25.8','Plasma osmolality falls after water intake and effective blood volume is stable. Which change is expected in collecting ducts?','Water permeability decreases as ADH falls','Water permeability rises because ADH rises','Filtration slits close to all water','Lower ADH reduces aquaporin-2 insertion and promotes dilute urine.'],
  ['26.1','What happens to water in an intact red cell placed in an extracellular solution with a higher concentration of nonpenetrating solute?','Net water moves out and cell volume falls','Net water moves in and cell volume rises','The cell actively exports all bath solute','Water shifts toward the side of higher effective osmotic concentration.'],
  ['26.2','Two volunteers have the same ADH, but one lacks a medullary osmotic gradient. Which capacity is reduced?','Concentrating urine above plasma osmolality','Secreting all potassium into saliva','Glomerular delivery of red cells to the ureter','Even a water-permeable duct needs an osmotic driving force to draw out water.'],
  ['26.3','In otherwise healthy kidneys, which stimulus can directly increase aldosterone secretion?','Elevated plasma potassium','A fall in plasma potassium below normal','High oxygen partial pressure in alveoli','Adrenal zona glomerulosa cells respond directly to raised plasma potassium.'],
  ['26.4','Why can bicarbonate buffering respond quickly to an added small acid load?','Bicarbonate binds added hydrogen ions','New nephrons are formed within seconds','ADH immediately stops all water filtration','Chemical buffering rapidly redistributes hydrogen ions before organ compensation.'],
  ['26.5','An isolated increase in alveolar ventilation lowers PCO₂. What primary acid–base direction follows?','Respiratory alkalosis','Respiratory acidosis','Metabolic acidosis','With less CO₂, the carbonic acid equilibrium shifts toward lower hydrogen ion concentration.'],
  ['27.1','Which feature helps maintain normal conditions for developing sperm?','The scrotum allows testicular temperature below core temperature','Sperm develop only at temperatures above core temperature','Seminiferous tubules communicate directly with bladder urine','Scrotal positioning and heat exchange assist temperature regulation.'],
  ['27.1','Sperm output declines after selective disruption of Sertoli cells. Which direct support is reduced?','Nourishment and organization of developing germ cells','Leydig cell synthesis of all testosterone as the primary target','Storage of mature sperm in the epididymal tail as the primary target','Sertoli cells support germ cells inside the seminiferous epithelium.'],
  ['27.2','After a normal ovulation, a hormone rises from an ovarian structure derived from the ruptured follicle. What is its major endometrial effect?','Maintains secretory endometrium','Directly initiates shedding while its level is high','Blocks all uterine blood flow','Luteal progesterone supports the secretory phase.'],
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
  let result;
  for(let form=0;form<=n;form++){
    const bySection=new Map();
    result=[];
    const pool=ordered([...base.filter(q=>Number(q.section.split('.')[0])===ch),...recallChoices(ch,form)],scope+ch+form);
    while(result.length<count){
      pool.sort((a,b)=>{
        const ac=bySection.get(a.section)||0,bc=bySection.get(b.section)||0;
        return Number(ac>0)-Number(bc>0) || (seen.get(a.id)||0)-(seen.get(b.id)||0) || ac-bc;
      });
      const q=pool.shift();
      if(!q)throw Error('Too few choice questions for Chapter '+ch);
      result.push(q);
      bySection.set(q.section,(bySection.get(q.section)||0)+1);
    }
    for(const q of result)seen.set(q.id,(seen.get(q.id)||0)+1);
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
  const stable='ap3-mock-v1-'+scope+'-'+q.id+'-'+form;
  const result=scoredChoices({...q,id:stable,version:'1'},stable);
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
function cumulativeItems(n){
  const energy=[80,120,160][n],nitrogen=[12,18,22][n];
  const specimen=chapterEvidence(28,n)[0],ovary=chapterEvidence(27,n)[3];
  const cases=[
    maternalAntibody(n),
    integrated(item('22.5','integration-gas','Interpret the change in a working tissue and predict the breathing response.',
      [pick('What is a major source of the additional CO₂?','Aerobic metabolism in active cells','Binding of oxygen to hemoglobin','Filtration in Bowman’s capsule'),
        pick('If alveolar ventilation fails to increase, what tends to happen to arterial PCO₂?','It rises','It falls','It must remain exactly fixed')],
      'Increased aerobic oxidation produces more CO₂. At fixed alveolar ventilation, greater CO₂ production raises arterial PCO₂.',
      data(['CO₂ production at rest (mL/min)','CO₂ production during work (mL/min)'],[200,400+energy])),'24.2'),
    intestinalReturn(n),
    integrated(item('24.4','integration-urea','Follow labeled nitrogen from a meal to its principal nitrogenous waste.',
      [pick('Where is most of that waste synthesized?','Liver','Renal pelvis','Gallbladder'),pick('How does the waste first enter normal nephron fluid?','Glomerular filtration','Leaving the ureter by diffusion','Red cell transport into the capsule')],
      'The liver converts amino nitrogen to urea, which is carried to the kidney and filtered.',
      data(['Tracer meal','Circulating product'],[nitrogen+' g of labeled protein equivalent','Label appears in blood urea'])),'25.5'),
    integrated(chapterEvidence(26,n)[2],'22.3'),
    ductFeedback(n),
    ovary,specimen
  ];
  const recalls=[
    ['23.6','24.5','After a carbohydrate-containing meal, identify the vessel that first delivers absorbed glucose to the liver and the pancreatic storage signal.',term('Name the vein.','Hepatic portal vein',['portal vein'],['hepatic vein']),term('Name the hormone.','Insulin'),'Portal blood carries glucose to the liver. Insulin favors its storage.'],
    ['26.5','22.3','Arterial pH is 7.28, bicarbonate 15 mmol/L, and PCO₂ 32 mmHg. The exercise assumes a single primary disturbance.',term('Name the primary disturbance.','Metabolic acidosis',[],['respiratory acidosis','metabolic alkalosis']),pick('Which breathing change explains the compensatory direction?','Increased alveolar ventilation','Decreased alveolar ventilation','No ventilation'),'The low bicarbonate and pH identify metabolic acidosis. Faster or deeper effective ventilation lowers PCO₂.'],
    ['27.2','28.4','An early implanted conceptus maintains the ovary’s temporary endocrine structure.',term('What signal comes from the trophoblast?','Human chorionic gonadotropin',['hCG','chorionic gonadotropin']),term('What ovarian structure does it preserve?','Corpus luteum'),'hCG maintains the progesterone-secreting corpus luteum early in pregnancy.'],
    ['28.5','22.2','A newborn aerates the lungs for the first time.',pick('What happens to pulmonary vascular resistance?','It falls','It rises','It always remains constant'),term('Name the atrial communication that functionally closes as left atrial pressure rises.','Foramen ovale'),'Aeration lowers pulmonary resistance, increases venous return to the left atrium and helps close the foramen ovale.'],
  ].map(([s,other,p,a,b,w],i)=>integrated(item(s,'integration-short-'+i,p,[a,b],w),other));
  const writing=[
    n===1?integrated(chapterWriting(26,2),'22.3'):integrated(chapterWriting(25,n),n===0?'26.2':'26.3'),
    integrated(n===0?chapterWriting(23,0):n===1?chapterWriting(24,1):chapterWriting(22,2),['21.1','25.5','26.4'][n])
  ];
  return [...cases,...recalls,...writing];
}
