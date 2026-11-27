import {select,table} from './ap3-labs-experiments.js';
import {absorption} from './ap3-labs-routes.js';

const cellPrompts=['Which cell displays the peptide in this encounter?','Which MHC class carries the peptide?','Which T cell recognizes that peptide–MHC combination?'];

export const immuneRecognition={
  title:'Match antigen location to immune recognition',section:'21.3',
  intro:'Each record describes one encounter. Use the location of the protein and the identity of the displaying cell to reconstruct the response.',
  routes:[
    {label:'Record A',start:'A branching cell collects an extracellular protein in tissue and carries it to a lymph node. It processes the protein in a vesicle and supplies costimulation.',prompts:cellPrompts,steps:[
      ['Dendritic cell','Mature red blood cell','Plasma cell','The sampling cell migrates to the node and can prime a naïve T cell.'],
      ['MHC class II','MHC class I','Secreted antibody','Peptides from the sampled protein are loaded onto class II molecules in this vesicular pathway.'],
      ['A matching CD4⁺ helper T cell','A matching CD8⁺ cytotoxic T cell','A neutrophil with a T-cell receptor','A CD4⁺ T cell recognizes the matching peptide on class II. Costimulation helps initiate activation.']
    ]},
    {label:'Record B',start:'A previously activated T cell encounters an abnormal epithelial cell. The epithelial cell is producing an altered protein in its cytosol.',prompts:cellPrompts,steps:[
      ['The abnormal epithelial cell','A nearby mature red blood cell','A plasma cell in lymph','This encounter concerns recognition of the abnormal nucleated target cell by an effector T cell.'],
      ['MHC class I','MHC class II','Free antibody','Class I displays a sample of intracellular peptides on nucleated cells.'],
      ['A matching CD8⁺ cytotoxic T cell','A matching CD4⁺ helper T cell','A plasma cell with a T-cell receptor','An activated cytotoxic T cell can recognize the peptide–class I complex and induce apoptosis in the target cell.']
    ]},
    {label:'Record C',start:'An intact foreign protein is dissolved in tissue fluid. Matching antibodies are already present from an earlier response.',
      prompts:['Which effector can bind this intact protein directly?','Which differentiated cell secreted that effector?','What can happen when binding covers the protein’s attachment site?'],steps:[
      ['A matching antibody','An MHC class I molecule on a red cell','A CD8⁺ T-cell receptor binding free protein','Antibodies can recognize accessible features of an intact extracellular antigen.'],
      ['Plasma cell','Helper T cell','Natural killer cell','Plasma cells are activated B-cell descendants specialized for antibody secretion.'],
      ['Attachment to the target is blocked','Every host cell displaying a self peptide dies','All T cells stop developing','Antibody binding can neutralize an antigen by preventing attachment to its target.']
    ]}
  ]
};

const bloodSamples=[
  {a:15,b:10},{a:9,b:14},{a:12,b:12}
];

export const oxygenCarriage={
  title:'Compare oxygen carried by two blood samples',section:'22.5',
  intro:'Each trial fixes oxygen partial pressure in both samples. Decide which measurement changes and distinguish pressure, saturation, and oxygen carried per deciliter.',
  controls:[select('trial','Comparison',['Hemoglobin pair A','Hemoglobin pair B','Matched samples','A decrease in tissue pH'])],
  nextTrial:({trial})=>({trial:(Number(trial)+1)%4}),
  run({trial}){
    const pair=bloodSamples[Number(trial)];
    if(!pair)return {
      observation:table('Blood equilibrated with tissue at 40 mmHg PO₂',['Sample','Hemoglobin (g/dL)','pH'],[['A',15,'7.40'],['B',15,'7.25']]),
      question:'At this same tissue PO₂, which sample has the lower hemoglobin saturation?',
      choices:['B','A','Their saturations must be equal'],
      why:'Lower pH shifts the oxygen–hemoglobin curve to the right. Hemoglobin has lower affinity for oxygen and unloads more at the same tissue PO₂.',
      frames:[['Controlled comparison','Hemoglobin concentration, temperature and PO₂ are held equal.'],['Bohr effect','At the lower pH in B, fractional occupancy falls. Sample B carries less bound oxygen at this tissue PO₂.']]
    };
    const content=hb=>(1.34*hb*.98+.003*100).toFixed(1);
    const answer=pair.a===pair.b?'Both carry the same amount':pair.a>pair.b?'A carries more':'B carries more';
    return {
      observation:table('Measured samples',['Sample','PO₂ (mmHg)','O₂ saturation (%)','Hemoglobin (g/dL)'],[['A',100,98,pair.a],['B',100,98,pair.b]]),
      question:'Which sample carries more oxygen per deciliter of blood?',
      choices:[answer,...['A carries more','B carries more','Both carry the same amount'].filter(v=>v!==answer)],
      why:'At equal saturation, the amount bound depends on how much hemoglobin is present. Equal PO₂ gives equal dissolved oxygen here.',
      result:table('Approximate oxygen content',['Sample','mL O₂/dL blood'],[['A',content(pair.a)],['B',content(pair.b)]]),
      frames:[['Bound oxygen','Multiply 1.34 mL O₂/g hemoglobin by hemoglobin concentration and the saturation fraction (0.98).'],['Dissolved oxygen','Both samples add about 0.30 mL O₂/dL dissolved at 100 mmHg. Total oxygen content is bound plus dissolved oxygen.']]
    };
  }
};

const plate=(figure,section,size,box,description)=>({figure,section,size,box,description,credit:'',kind:'Textbook illustration detail'});

export const gutWall={
  title:'Identify a layer of the alimentary wall',section:'23.1',
  intro:'Use the position of a sample relative to the lumen and adjacent layers. The cutaway shows the orientation of the wall.',
  controls:[select('site','Unknown tissue',['Site A','Site B','Site C'])],
  run({site}){
    const [finding,answer,role]=[
      ['The tissue lies between muscularis mucosae and the inner circular muscle. Larger blood vessels and a nerve plexus run through its connective tissue.','Submucosa','The submucosa carries larger vessels and the submucosal plexus beneath the mucosa.'],
      ['The sample includes the epithelium touching the food and a thin smooth muscle layer just deep to the lamina propria.','Mucosa','The epithelium, lamina propria and muscularis mucosae form the mucosa.'],
      ['Two thick smooth muscle layers enclose a nerve plexus. The inner fibers encircle the lumen and the outer fibers run lengthwise.','Muscularis externa','The myenteric plexus lies between the circular and longitudinal layers that mix and propel contents.']
    ][Number(site)];
    return {media:plate('23.3','23.1',[1080,617],[250,30,525,475],'A segment of intestine is opened to reveal successive tissue layers.'),
      observation:table('Section through the intestinal wall',['Sample finding'],[[finding]]),
      question:'Which layer contains the described sample?',choices:[answer,...['Mucosa','Submucosa','Muscularis externa'].filter(v=>v!==answer)],
      why:role,frames:[['Locate the sample',finding],['Identify the layer',role]]};
  }
};

const glandPrompts=['Which cell produces the missing secretion?','Which product accounts for the finding?','Which consequence follows?'];
export const gastricGlands={
  title:'Connect gastric cells to their secretions',section:'23.4',
  intro:'Each record removes one gastric contribution. Use the finding to identify its source and predict the next physiological change.',
  media:plate('23.16','23.4',[1126,528],[911,48,210,414],'A gastric gland contains differently shaped cells opening into the same lumen.'),
  routes:[
    {label:'Secretion A',start:'Acid secretion from the gastric body falls despite an unchanged amount of pepsinogen entering the lumen.',prompts:glandPrompts,steps:[
      ['Parietal cell','Chief cell','G cell','Parietal cells in body and fundus supply acid as well as intrinsic factor.'],
      ['Hydrochloric acid','Pepsinogen','Gastrin','Hydrochloric acid normally maintains the strongly acidic lumen.'],
      ['Activation of pepsinogen falls','More bile enters the gastric lumen','Intrinsic factor digests protein','Acid facilitates activation of pepsinogen to pepsin, which begins protein digestion.']
    ]},
    {label:'Secretion B',start:'Acidity is preserved. A deep gland cell loses the ability to release the inactive precursor of a protein-digesting enzyme.',prompts:glandPrompts,steps:[
      ['Chief cell','Parietal cell','G cell','Chief cells release the inactive enzyme precursor into the gastric lumen.'],
      ['Pepsinogen','Intrinsic factor','Hydrochloric acid','Pepsinogen becomes pepsin in the acidic lumen.'],
      ['Less gastric protein digestion','Failure of bile concentration','Lower pancreatic bicarbonate production solely from loss of pepsin','Loss of the precursor reduces active pepsin even if the lumen remains acidic.']
    ]},
    {label:'Secretion C',start:'A pyloric endocrine cell releases less of its meal-stimulated hormone into the bloodstream.',prompts:glandPrompts,steps:[
      ['G cell','Chief cell','Surface mucous cell','G cells in the pyloric region respond to meal-related signals.'],
      ['Gastrin','Pepsinogen','Gastric lipase','Gastrin travels in blood and stimulates gastric secretion.'],
      ['The acid response to a meal weakens','Bile salts stop emulsifying lipid','The stomach loses all intrinsic motility','Reduced gastrin reduces stimulation of acid secretion; neural and other local controls still operate.']
    ]},
    {label:'Secretion D',start:'A meal is followed by poor lubrication within the gastric gland neck. Acid and pepsinogen secretion remain intact.',prompts:glandPrompts,steps:[
      ['Mucous neck cell','Chief cell','G cell','Mucous neck cells contribute glandular mucus. Surface mucous cells also produce protective mucus at the luminal surface.'],
      ['Mucus','Gastrin','Hydrochloric acid','Mucus helps coat the local surface of the gastric lining.'],
      ['Reduced local mucus coverage','Loss of dietary B₁₂ binding by intrinsic factor','Conversion of gallbladder bile into acid','The secretion loss directly affects local mucus coverage; other cell types provide acid, enzymes and hormones.']
    ]}
  ]
};

export const alanineFates={
  title:'Follow both labels on alanine',section:'24.4',
  intro:'A liver cell receives alanine tagged on its amino nitrogen and on its three-carbon skeleton. Trace each label during fasting.',
  routes:[
    {label:'Amino nitrogen',start:'Amino nitrogen on alanine in a hepatocyte',steps:[
      ['Amino group transferred to α-ketoglutarate','Amino group incorporated directly into glucose','Carbon skeleton released as urea','Transamination transfers the amino group to α-ketoglutarate, forming glutamate.'],
      ['Nitrogen supplied to urea synthesis','Nitrogen carried through glycolysis as pyruvate','Nitrogen stored as hepatic glycogen','Glutamate nitrogen can reach the urea cycle via ammonium or aspartate.'],
      ['Urea carried in blood to the kidneys','Urea packaged in chylomicrons','Urea stored in the gallbladder','The liver releases urea into blood. The kidneys filter it and eliminate a portion in urine.']
    ]},
    {label:'Three-carbon skeleton',start:'Carbon skeleton of the same alanine molecule in a fasting hepatocyte',steps:[
      ['Pyruvate after transamination','Urea after transamination','Acetyl-CoA before amino transfer','Removing the amino group from alanine leaves the three-carbon keto acid pyruvate.'],
      ['Carbon entering gluconeogenesis','Carbon supplying the amino nitrogen of urea','Carbon obligatorily excreted in urine','During fasting, alanine is a glucogenic substrate; pyruvate carbons can contribute to glucose synthesis.'],
      ['Newly synthesized glucose released to blood','Urea formed from all three alanine carbons','A chylomicron secreted by the hepatocyte','Hepatic glucose production supports other tissues. A second three-carbon precursor supplies the other half of the six-carbon glucose molecule.']
    ]}
  ]
};

const sharedLipidSteps=[...absorption.routes[1].steps,
  ['Systemic capillary lipoprotein lipase releases fatty acids','An intact chylomicron enters every muscle cell','The thoracic duct empties directly into a hepatocyte','After lymph returns to venous blood, chylomicrons pass through the heart and lungs and reach systemic capillaries. Luminal lipoprotein lipase hydrolyzes their triglycerides.']
];
export const lipidJourney={
  title:'Follow a dietary fat from villus to tissue',section:'23.7',
  intro:'Track a labeled long-chain fatty acid from an enterocyte through intestinal lymph and venous blood. Compare its fate in fed adipose tissue and in a working muscle with oxygen available.',
  routes:[
    {label:'Delivery to fed adipose tissue',start:'A long-chain fatty acid from a meal has entered an enterocyte. Follow its label toward storage in adipose tissue.',steps:[...sharedLipidSteps,
      ['Fatty acid taken up and re-esterified to triglyceride','Whole chylomicron stored in an adipocyte nucleus','Fatty acid converted directly into glycogen','A fed adipocyte can take up the released fatty acid and re-esterify it for storage in a lipid droplet.']]},
    {label:'Delivery to working skeletal muscle',start:'The same type of long-chain fatty acid has entered an enterocyte. Follow its label toward oxidation in a working muscle.',steps:[...sharedLipidSteps,
      ['Fatty acid taken up, activated and transported into mitochondria','Whole chylomicron enters mitochondrial matrix','Fatty acid becomes a free amino group','Muscle can take up the fatty acid. Long-chain acyl groups reach the mitochondrial matrix through the carnitine shuttle.'],
      ['β-oxidation supplies acetyl-CoA','Glycolysis splits the fatty acid into glucose','The urea cycle stores the lipid','β-oxidation yields acetyl-CoA and reducing equivalents. Aerobic metabolism can use them to support ATP production.']]}
  ]
};
