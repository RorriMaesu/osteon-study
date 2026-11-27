import {term,item,written} from './term-mock-spring-items.js';

// Each pair asks for distinct, independently scorable facts. Each form takes
// two pairs per chapter; the form offset changes the retrieval demand.
const pairs = {
  21:[
    ['21.1','Lymph moves through a regional node.', ['What vessel type brings lymph to the node?','Afferent lymphatic vessel',['afferent','afferent vessel'],['efferent']],['What type carries it away?','Efferent lymphatic vessel',['efferent','efferent vessel'],['afferent']]],
    ['21.4','A patient acquires protection in two ways.', ['What kind of immunity follows production of the patient’s own antibodies?','Active immunity',['active']],['What kind follows receipt of preformed antibodies?','Passive immunity',['passive']]],
    ['21.1','Name the organs where lymphocytes normally mature.', ['Where do T cells mature?','Thymus'],['Where do B cells mature in humans?','Bone marrow',['red bone marrow']]],
    ['21.4','Name two immunoglobulin classes.', ['Which predominates in colostrum and other mucosal secretions?','IgA',['secretory IgA','immunoglobulin A']],['Which is normally most abundant in adult plasma?','IgG',['immunoglobulin G']]],
    ['21.2','Two innate barriers use different mechanisms.', ['Which epithelial protein helps the outer skin resist abrasion?','Keratin'],['Which enzyme in tears can hydrolyze bacterial cell walls?','Lysozyme']],
    ['21.3','Different T-cell roles support adaptive immunity.', ['Which T cells direct other immune cells through cytokines?','Helper T cells',['CD4 T cells','T helper cells']],['Which T cells directly kill infected body cells?','Cytotoxic T cells',['CD8 T cells','cytotoxic T lymphocytes']]],
  ],
  22:[
    ['22.2','Name each pleural membrane.', ['What directly covers a lung?','Visceral pleura',[],['parietal pleura']],['What lines the chest wall?','Parietal pleura',[],['visceral pleura']]],
    ['22.1','Follow air through the larger conducting structures.', ['Which tube normally divides into the main bronchi?','Trachea',['windpipe']],['Which division supplies one lung lobe?','Lobar bronchus',['secondary bronchus']]],
    ['22.5','Name the principal forms in which these gases travel.', ['Which red-cell protein carries most oxygen?','Hemoglobin',['haemoglobin']],['In what ionic form is most carbon dioxide carried?','Bicarbonate',['HCO3','bicarbonate ion','hydrogen carbonate']]],
    ['22.1','Distinguish two alveolar cell types.', ['Which thin epithelial cell forms most of the alveolar surface area?','Type I pneumocyte',['type 1 pneumocyte','type 1 alveolar cell','type I alveolar cell'],['type II','type 2']],['Which secretes surfactant?','Type II pneumocyte',['type 2 pneumocyte','type 2 alveolar cell','type II alveolar cell'],['type I','type 1']]],
    ['22.3','Distinguish tidal volume and the conducting volume.', ['What is the volume of an ordinary quiet breath called?','Tidal volume',['VT']],['What is the volume of air in conducting airways called?','Anatomical dead space',['anatomic dead space']]],
    ['22.3','Name the muscles that expand the chest during quiet inspiration.', ['Which dome-shaped muscle descends?','Diaphragm'],['Which intercostal group elevates the ribs?','External intercostals',['external intercostal muscles'],['internal intercostals']]],
  ],
  23:[
    ['23.7','Compare the first vessels entered by two nutrients in a villus.', ['What lymphatic capillary receives chylomicrons?','Lacteal',['central lacteal']],['What vein eventually delivers intestinal glucose to the liver?','Hepatic portal vein',['portal vein'],['hepatic vein']]],
    ['23.6','Distinguish bile production and storage.', ['Which organ produces bile?','Liver'],['Which organ concentrates and stores it between meals?','Gallbladder',['gall bladder']]],
    ['23.4','Name two gastric gland cell types.', ['Which cells secrete pepsinogen?','Chief cells',['gastric chief cells']],['Which cells secrete hydrochloric acid?','Parietal cells',['oxyntic cells']]],
    ['23.2','Name two patterns of intestinal motility.', ['Which mainly mixes contents locally?','Segmentation'],['Which mainly propels contents forward?','Peristalsis']],
    ['23.5','Identify the first and last divisions of the small intestine.', ['Which receives chyme from the stomach?','Duodenum'],['Which empties into the cecum?','Ileum',[],['ilium']]],
    ['23.6','Identify two pancreatic secretions entering the duodenum.', ['Which ion neutralizes acid?','Bicarbonate',['bicarbonate ion','HCO3']],['Which enzyme hydrolyzes triglycerides?','Pancreatic lipase',['lipase']]],
  ],
  24:[
    ['24.2','A liver switches between glycogen storage and mobilization.', ['Name the process that builds glycogen from glucose.','Glycogenesis',[],['glycogenolysis','gluconeogenesis']],['Name the process that breaks glycogen down.','Glycogenolysis',[],['glycogenesis','gluconeogenesis']]],
    ['24.3','Trace fatty-acid carbon into aerobic metabolism.', ['What process removes two-carbon units from fatty acids?','Beta oxidation',['beta-oxidation','β oxidation']],['What two-carbon carrier enters the citric acid cycle?','Acetyl CoA',['acetyl coenzyme A']]],
    ['24.4','Trace amino nitrogen out of the body.', ['What nitrogen-rich waste is formed by the liver?','Urea',[],['uric acid']],['Which organs excrete most of it into urine?','Kidneys',['kidney']]],
    ['24.5','Distinguish two pancreatic signals.', ['Which hormone promotes storage after a meal?','Insulin'],['Which promotes hepatic glucose output during fasting?','Glucagon']],
    ['24.2','Locate two steps in glucose oxidation.', ['In which cell compartment does glycolysis occur?','Cytosol',['cytoplasm']],['Where within the mitochondrion does the citric acid cycle occur?','Mitochondrial matrix',['matrix']]],
    ['24.6','Name the heat transfer mechanisms.', ['What transfers heat by direct contact with a cold surface?','Conduction'],['What removes heat when sweat changes from liquid to vapor?','Evaporation']],
  ],
  25:[
    ['25.4','Trace blood through the renal corpuscle.', ['Which vessel delivers blood to the tuft?','Afferent arteriole',['afferent'],['efferent']],['Which vessel drains the tuft?','Efferent arteriole',['efferent'],['afferent']]],
    ['25.6','Name the two directions of tubular solute transport.', ['What is movement from tubular fluid back to blood?','Reabsorption',['tubular reabsorption']],['What is movement from peritubular blood into tubular fluid?','Secretion',['tubular secretion']]],
    ['25.4','Locate two parts of the filtration barrier.', ['What cells form interlocking foot processes?','Podocytes',['podocyte']],['What spaces lie between adjacent foot processes?','Filtration slits',['slit pores','filtration slit']]],
    ['25.3','Trace urine as it leaves the kidney.', ['Which cup receives urine from a single papilla?','Minor calyx',['minor calix']],['What tube carries urine from the renal pelvis to the bladder?','Ureter',[],['urethra']]],
    ['25.8','Identify two renal endocrine functions.', ['Which hormone from the kidney stimulates red-cell production?','Erythropoietin',['EPO']],['Which enzyme from granular cells initiates the angiotensin cascade?','Renin']],
    ['25.4','Name nephron types by loop depth.', ['Which type has long loops extending deep into the medulla?','Juxtamedullary nephron',['juxtamedullary']],['Which type generally has short loops?','Cortical nephron',['cortical']]],
  ],
  26:[
    ['26.1','Name fluid compartments.', ['Where is most body water located?','Intracellular fluid',['ICF','intracellular compartment']],['What extracellular fluid bathes tissue cells?','Interstitial fluid',['interstitial compartment']]],
    ['26.3','Name the principal cations.', ['Which predominates in extracellular fluid?','Sodium',['Na','Na+']],['Which predominates in intracellular fluid?','Potassium',['K','K+']]],
    ['26.2','Distinguish two renal hormones.', ['Which increases water permeability in the collecting ducts?','Antidiuretic hormone',['ADH','vasopressin']],['Which promotes distal sodium uptake and potassium secretion?','Aldosterone']],
    ['26.5','An arterial sample has pH 7.30, low bicarbonate and appropriately low PCO₂.', ['Name the primary disturbance.','Metabolic acidosis',[],['respiratory acidosis','metabolic alkalosis']],['Which system accounts for the lower PCO₂?','Respiratory system',['lungs','respiration']]],
    ['26.4','Name the major chemical buffer pair in extracellular fluid.', ['What is the weak acid in this pair?','Carbonic acid',['H2CO3']],['What is its conjugate base?','Bicarbonate',['HCO3','hydrogen carbonate']]],
    ['26.1','Water can cross a cell membrane but the bath solute cannot.', ['Describe a bath that makes the cell shrink.','Hypertonic',[],['hypotonic']],['Describe a bath that makes the cell swell.','Hypotonic',[],['hypertonic']]],
  ],
  27:[
    ['27.1','Identify two testicular cell populations.', ['Which cells secrete testosterone under LH stimulation?','Leydig cells',['interstitial cells']],['Which provide support for developing sperm?','Sertoli cells',['sustentacular cells']]],
    ['27.2','Distinguish the pituitary and ovarian signals.', ['Which pituitary hormone surges immediately before ovulation?','Luteinizing hormone',['LH','luteinising hormone']],['Which steroid predominates in luteal support of the endometrium?','Progesterone']],
    ['27.1','Trace sperm after efferent ductules.', ['In what coiled duct do sperm mature?','Epididymis',['epididymal duct']],['Which duct leaves its tail?','Ductus deferens',['vas deferens']]],
    ['27.2','Identify two layers of the uterine wall.', ['Which inner layer changes during the cycle?','Endometrium'],['Which layer contracts in labor?','Myometrium']],
    ['27.3','Trace male internal duct differentiation in typical development.', ['Which fetal cells secrete anti-Müllerian hormone?','Sertoli cells',['sustentacular cells']],['What hormone supports the mesonephric ducts?','Testosterone']],
    ['27.2','Name the ovarian structure before and after ovulation.', ['What structure encloses a growing oocyte?','Ovarian follicle',['follicle']],['What endocrine structure develops from the ruptured follicle?','Corpus luteum']],
  ],
  28:[
    ['28.2','Name two early developmental stages.', ['What is the solid ball of blastomeres?','Morula'],['What is the hollow stage with an inner cell mass?','Blastocyst']],
    ['28.3','Distinguish the directions of umbilical blood flow.', ['Which vessel carries blood to the fetus?','Umbilical vein',[],['umbilical artery']],['Which vessels return it to the placenta?','Umbilical arteries',['umbilical artery'],['umbilical vein']]],
    ['28.1','Identify changes on opposite sides of gamete fusion.', ['What maturation process prepares sperm for fertilization in the reproductive tract?','Capacitation'],['What oocyte response releases granules that help block polyspermy?','Cortical reaction',['cortical granule reaction']]],
    ['28.6','Distinguish milk production from ejection.', ['Which anterior pituitary hormone promotes synthesis?','Prolactin',['PRL']],['Which hormone triggers ejection?','Oxytocin']],
    ['28.5','Name the fetal shunts.', ['What communicates between the atria?','Foramen ovale'],['What connects pulmonary trunk to aorta?','Ductus arteriosus',[],['ductus venosus']]],
    ['28.7','For a completely penetrant autosomal recessive trait, label these genotypes.', ['What is the term for Aa?','Heterozygous',['heterozygote','heterozygous carrier','carrier']],['How would you describe aa?','Homozygous recessive',['homozygote recessive','recessive homozygote']]],
  ],
};
export function chapterShort(ch,n){
  return pairs[ch].slice(2*n,2*n+2).map(([section,prompt,...rows],i)=>item(section,'recall-'+ch+'-'+(2*n+i),prompt,rows.map(r=>term(...r)),rows.map(r=>r[0]+' '+r[1]+'.').join(' ')));
}

// Alternatives within each pair (two cell types, vessels, compartments, etc.)
// address confusion about neighboring structures; the third alternative is
// authored for that specific pair. Exclude a pair from choices when the same
// form will assess that pair by free recall.
const additionalOptions={
  21:['Lymphatic capillary','Innate immunity','Spleen','IgM','Collagen','Regulatory T cells'],
  22:['Pericardium','Terminal bronchiole','Myoglobin','Alveolar macrophage','Vital capacity','Rectus abdominis'],
  23:['Hepatic vein','Pancreas','Mucous neck cells','Mass movement','Jejunum','Pancreatic amylase'],
  24:['Gluconeogenesis','Pyruvate','Gallbladder','Somatostatin','Intermembrane space','Convection'],
  25:['Renal vein','Glomerular filtration','Mesangial cells','Renal pelvis','Aldosterone','Collecting duct'],
  26:['Plasma','Calcium','Atrial natriuretic peptide','Metabolic alkalosis','Phosphate','Isotonic'],
  27:['Spermatogonia','Estradiol','Ejaculatory duct','Perimetrium','Dihydrotestosterone','Corpus albicans'],
  28:['Gastrula','Ductus venosus','Acrosomal reaction','Follicle-stimulating hormone','Ductus venosus','Homozygous dominant'],
};
export function recallChoices(ch,n) {
  return pairs[ch].flatMap(([section,context,a,b],i)=>{
    if(Math.floor(i/2)===n)return [];
    return [a,b].map(([p,key],j)=>{
      const rival=(j===0?b:a)[1];
      return {section,id:'spring-transfer-'+ch+'-'+i+'-'+j,objective:section,type:'choice',points:1,
        prompt:context+' '+p,choices:[key,rival,additionalOptions[ch][i]],answer:0,
        why:a[0]+' '+a[1]+'. '+b[0]+' '+b[1]+'.'};
    });
  });
}

const explanations={
  21:[
    ['21.4','A second exposure to the same antigen produces antibody earlier and in greater quantity. Explain the origin of memory cells, their response, and the source of secreted antibody.',
      ['First exposure','Antigen-specific B cells expand during the first response and some become memory B cells.'],['Recall','Memory B cells respond rapidly and expand upon re-exposure to the same antigen.'],['Antibody','Plasma cells derived from activated B cells secrete antibodies.']],
    ['21.2','Explain how an intact airway can stop particles before they reach alveoli. Include a secretion, a mechanical action, and the consequence if that action fails.',
      ['Trap','Airway mucus traps inhaled particles.'],['Move','Cilia move the mucus toward the pharynx for clearance.'],['Failure','Impaired ciliary movement allows particles or microbes to accumulate.']],
    ['21.3','A virus is multiplying inside a body cell. Explain how cytotoxic T cells recognize their target, what they do to it, and how this limits spread.',
      ['Recognize','The infected cell presents antigenic peptide on MHC class I to a matching cytotoxic T cell.'],['Act','The cytotoxic cell induces apoptosis of the infected cell.'],['Effect','Killing infected cells reduces sites of viral production.']],
  ],
  22:[
    ['22.4','Air and blood approach opposite sides of a thin alveolar septum. Explain the direction of oxygen movement, how surface area matters, and what thickening the septum would do.',
      ['Gradient','Oxygen diffuses from higher alveolar oxygen partial pressure toward lower incoming capillary oxygen partial pressure.'],['Area','Many alveoli increase the total surface available for diffusion.'],['Distance','Thickening the septum increases diffusion distance and slows transfer at a fixed gradient.']],
    ['22.3','Explain how contraction of the diaphragm produces inward airflow, from muscle motion through pressure to the movement of air.',
      ['Motion','The diaphragm flattens and descends, increasing thoracic volume.'],['Pressure','As lungs expand, alveolar pressure initially falls below atmospheric pressure.'],['Flow','Air flows inward down the pressure gradient until pressures equalize.']],
    ['22.5','A working muscle produces more CO₂. Explain its transport as bicarbonate, where the reverse reaction occurs for exhalation, and why ventilation matters for pH.',
      ['Tissue','CO₂ enters red cells and carbonic anhydrase helps convert it to bicarbonate and hydrogen ions.'],['Lung','Near alveoli bicarbonate is converted back to CO₂, which diffuses into alveolar air.'],['pH','Increased ventilation removes CO₂, limiting acid accumulation or raising pH.']],
  ],
  23:[
    ['23.7','Compare absorbed glucose and long-chain dietary lipid leaving the same villus. State how each reaches the circulation and why the liver sees glucose first.',
      ['Glucose','Glucose enters intestinal blood capillaries.'],['Lipid','Long-chain lipids are packaged into chylomicrons that enter lacteals and lymph.'],['Route','Portal venous blood reaches the liver before systemic blood, while lymph enters venous blood through the thoracic duct.']],
    ['23.6','Acidic chyme enters the duodenum. Explain the secretin signal, the principal pancreatic response, and how that response helps digestion.',
      ['Signal','Acid in the duodenum stimulates release of secretin.'],['Response','Pancreatic duct cells secrete bicarbonate-rich fluid.'],['Effect','Neutralization protects duodenal tissue and supplies a suitable pH for intestinal enzyme action.']],
    ['23.7','Explain the fate of dietary triglyceride in the small intestine. Include emulsification, hydrolysis and the first lymphatic transport step.',
      ['Emulsify','Bile salts disperse large fat droplets and increase surface area.'],['Hydrolyze','Pancreatic lipase releases fatty acids and monoglycerides.'],['Transport','Enterocytes reassemble long-chain fat into triglycerides, package chylomicrons and release them into lacteals.']],
  ],
  24:[
    ['24.5','Compare the liver and skeletal muscle in an overnight fast. Explain the hormone shift, why the liver releases glucose and why muscle glycogen mainly supports muscle.',
      ['Hormones','Insulin falls relative to glucagon.'],['Liver','Hepatic glycogen breakdown and gluconeogenesis support plasma glucose.'],['Muscle','Muscle uses its glycogen locally and lacks the glucose-6-phosphatase needed to release it as free glucose.']],
    ['24.4','An amino acid is used as fuel. Follow its nitrogen and carbon skeleton, then explain how the kidney completes nitrogen disposal.',
      ['Nitrogen','Amino nitrogen is removed or transferred and is converted in the liver to urea.'],['Carbon','The carbon skeleton can enter metabolic pathways for energy or glucose production.'],['Kidney','Kidneys filter and ultimately excrete a portion of urea into urine.']],
    ['24.2','Explain why sustained loss of oxygen delivery limits ATP production in a mitochondria-containing muscle cell. Include the electron acceptor, proton gradient, and short-term glycolytic response.',
      ['Acceptor','Oxygen serves as the final electron acceptor in the electron transport chain.'],['Gradient','Loss of electron transfer reduces proton pumping, the gradient and oxidative ATP synthesis.'],['Glycolysis','Lactate formation regenerates NAD+ so glycolysis can continue to make a smaller amount of ATP.']],
  ],
  25:[
    ['25.8','After water deprivation, a healthy person’s plasma osmolality rises. Describe ADH release, its effect on collecting ducts, and the resulting urine volume and concentration.',
      ['Hormone release','ADH release from the posterior pituitary increases. Accept increased vasopressin release or secretion.'],['Collecting duct','Collecting ducts become more water permeable and reabsorb more water. Accept increased insertion of aquaporin-2.'],['Urine','Urine volume falls and urine becomes more concentrated. Both changes earn this point.']],
    ['25.6','A freely filtered solute is normally almost completely reabsorbed. Explain filtered load, what a transporter maximum means, and why the solute appears in urine at high concentrations.',
      ['Load','Filtered load is the amount entering tubular fluid per unit time, determined by plasma concentration times GFR.'],['Capacity','A finite number of carriers can only transport a limited amount per unit time.'],['Urine','When filtered load exceeds reabsorptive capacity, excess solute remains in the tubule and is excreted.']],
    ['25.7','Reduced renal perfusion stimulates renin release. Trace the pathway to angiotensin II and explain two means of supporting arterial pressure.',
      ['Pathway','Renin acts on angiotensinogen to form angiotensin I, which ACE converts to angiotensin II.'],['Resistance','Angiotensin II causes arteriolar vasoconstriction, increasing systemic resistance.'],['Volume','Angiotensin II promotes aldosterone release and renal sodium retention, helping conserve volume.']],
  ],
  26:[
    ['26.5','A single metabolic disturbance lowers plasma bicarbonate and pH. Explain the primary change, the respiratory response and how this shifts pH.',
      ['Primary','Bicarbonate loss or consumption reduces buffering and lowers pH, producing metabolic acidosis.'],['Ventilation','Ventilation increases, removing more CO₂ and reducing arterial PCO₂.'],['Buffer','Reducing CO₂ lowers hydrogen ion concentration and moves pH back toward normal.']],
    ['26.1','A cell is put in a hypertonic bath of nonpenetrating solute. Explain the initial water movement, its effect on cell size, and what ends net flow.',
      ['Driving force','Effective solute concentration is higher outside, so water moves out of the cell.'],['Volume','The cell shrinks as it loses water.'],['Equilibrium','Water loss concentrates the remaining cell solute until the osmotic driving force balances.']],
    ['26.5','CO₂ retention persists for several days. Explain its initial effect on pH, how healthy kidneys respond, and how the response opposes the disturbance.',
      ['Primary','Retaining CO₂ raises hydrogen ion concentration and lowers pH.'],['Kidney','Kidneys increase acid excretion and retain or generate bicarbonate over hours to days.'],['Effect','More available bicarbonate buffers acid and moves pH upward.']],
  ],
  27:[
    ['27.2','Trace a typical ovulatory cycle from a mature follicle to a secretory endometrium, identifying the trigger, the new ovarian structure and its hormone.',
      ['Trigger','Sustained high estradiol contributes to the LH surge that triggers ovulation.'],['Structure','The ruptured follicle forms the corpus luteum.'],['Effect','Luteal progesterone supports secretory changes in the endometrium.']],
    ['27.1','Explain how LH and FSH support sperm production and how a testicular hormone limits further stimulation.',
      ['LH','LH stimulates Leydig cells to secrete testosterone.'],['FSH','FSH acts on Sertoli cells that support developing sperm.'],['Feedback','Inhibin from Sertoli cells suppresses FSH, or testosterone provides negative feedback on hypothalamic and pituitary signals.']],
    ['27.2','Compare the consequences of implantation versus no implantation for corpus luteum, progesterone and endometrium in the early weeks.',
      ['Signal','Implanting trophoblast produces hCG that rescues the corpus luteum.'],['Maintenance','Maintained luteal progesterone supports the endometrium early in pregnancy.'],['Without implantation','Without rescue the corpus luteum regresses, progesterone falls and functional endometrium is shed.']],
  ],
  28:[
    ['28.7','Two unaffected parents of a child with a fully penetrant autosomal recessive trait are studied. Assume no new mutations and independent segregation. Infer the parental genotypes, the next child’s risk, and the carrier probability for an unaffected sibling.',
      ['Parents','Each parent must carry one recessive allele, so both are heterozygous.'],['Risk','For each conception the chance of the affected aa genotype is one in four.'],['Conditional','Excluding aa leaves AA, Aa and Aa, so two thirds of unaffected siblings are carriers.']],
    ['28.5','Explain how first breaths influence flow through the lungs, the pressure between the atria and the foramen ovale.',
      ['Lungs','Aeration and higher oxygen lower pulmonary vascular resistance, increasing pulmonary flow.'],['Atria','Increased pulmonary venous return raises left atrial pressure relative to right atrial pressure.'],['Shunt','The pressure difference presses the flap against the septum, promoting functional closure of the foramen ovale.']],
    ['28.2','A sample shows a fluid-filled cavity, an inner cell mass and an outer cell layer. Identify the stage, compare the fates of the two populations and give the next uterine event.',
      ['Stage','The sample is a blastocyst.'],['Fates','The inner cell mass gives rise to the embryo and the trophoblast contributes to the fetal part of the placenta.'],['Event','The blastocyst attaches to and implants in the uterine endometrium.']],
  ],
};
export function chapterWriting(ch,n){
  const [section,prompt,...components]=explanations[ch][n];
  const q=written(section,'writing-'+ch+'-'+n,prompt,components);
  if(ch===25&&n===0){
    q.rubric.fixtures=[
      ['complete','More ADH is released by the posterior pituitary. The collecting ducts reabsorb more water. Urine volume decreases and the urine is more concentrated.',[1,1,1]],
      ['partial','Vasopressin secretion rises and the collecting ducts become more permeable to water.',[1,1,0]],
      ['absent','The kidney contains a cortex and a medulla.',[0,0,0]],
      ['opposite','ADH release decreases, the ducts reabsorb less water, and more dilute urine is produced.',[0,0,0]],
    ].map(([id,response,scores])=>({id,response,expectedPoints:Object.fromEntries(scores.map((score,i)=>['idea-'+(i+1),score]))}));
  }
  return q;
}
