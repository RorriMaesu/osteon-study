import {select,table} from './ap3-labs-experiments.js';

const disorders=[
  ['An inherited developmental defect prevents many mature B and T cells from forming.','Protective antibody and cell-mediated responses are both weak.','Combined immunodeficiency','Loss of several protective responses','Both arms of adaptive immunity are affected. A deficiency can impair protection even when immune cells are present in other lineages.'],
  ['A person previously sensitized to pollen inhales it again.','Within minutes, surface-bound IgE on mast cells binds the allergen and the cells release histamine.','Immediate hypersensitivity','Inflammation triggered by a normally harmless antigen','Re-exposure links IgE molecules on sensitized mast cells and triggers mediator release. The response is directed at an environmental antigen.'],
  ['T cells recognize antigens made by the person’s own pancreatic beta cells.','The response damages insulin-producing cells.','Autoimmunity','Loss of tolerance to a self antigen','Self-reactive lymphocytes are damaging healthy tissue. Failure of self-tolerance explains the target of the response.']
];
export const immuneDisorders={
  title:'Distinguish three immune response patterns',section:'21.6',
  intro:'Read the target, the responding cells, and the outcome. Classify the mechanism, then choose the evidence that supports it.',
  controls:[select('record','Evidence record',['Record A','Record B','Record C'])],
  nextTrial:({record})=>({record:(Number(record)+1)%disorders.length}),
  run({record},responses=[]){
    const [trigger,outcome,category,evidence,why]=disorders[Number(record)],second=responses.length>0;
    const labels=disorders.map(row=>row[second?3:2]),answer=second?evidence:category;
    return {observation:table('Immune observations',['Trigger or context','Outcome'],[[trigger,outcome]]),
      question:second?'Which finding most directly supports that mechanism?':'Which immune mechanism best explains the record?',
      choices:[answer,...labels.filter(label=>label!==answer)],why:second?why:'Check whether the response is inadequate, directed at an environmental allergen, or directed at self.',
      nextDecision:second?undefined:'Identify the decisive evidence',frames:[['Trigger',trigger],['Observed response',outcome]]};
  }
};

export const altitude={
  title:'Follow oxygen pressure after ascent',section:'22.6',
  intro:'Follow a healthy person moving from sea level to a mountain station. Separate the physical change in air from the body’s immediate and slower responses.',
  controls:[select('pressure','Mountain station',['Higher station · 550 mmHg','Lower station · 650 mmHg'])],
  run({pressure},responses=[]){
    const total=Number(pressure)?650:550,po2=Math.round(total*.209),step=responses.length;
    const common={observation:table('Dry atmosphere at the two stations',['Station','Barometric pressure (mmHg)','Oxygen fraction'],[['Sea level',760,'0.209'],['Mountain',total,'0.209']]),
      frames:[['Dalton’s law','Dry-air oxygen pressure equals oxygen fraction × total pressure. Humidified airway and alveolar pressures differ from this dry-air value.'],['Acclimatization','Ventilation can change promptly. Increased erythropoiesis takes days to weeks to increase the circulating red-cell mass.']]};
    if(step===0)return {...common,question:'About how high is the dry-air oxygen partial pressure at the mountain station?',choices:[po2+' mmHg','159 mmHg',total+' mmHg'],
      why:'0.209 × '+total+' ≈ '+po2+' mmHg. The proportion of oxygen is the same at both stations.',nextDecision:'Predict the early response'};
    if(step===1)return {...common,question:'Within minutes, arterial PO₂ falls. Which response can change first?',choices:['Increased ventilation driven by peripheral chemoreceptors','A larger red-cell mass from newly formed red cells','A higher oxygen fraction in the outdoor air'],
      why:'Carotid and aortic body chemoreceptors respond to low arterial oxygen. Increased ventilation can lower arterial CO₂ before red-cell mass changes.',nextDecision:'Predict the slower response'};
    return {...common,question:'With sustained exposure over weeks, which change can raise oxygen-carrying capacity?',choices:['Renal erythropoietin stimulates production of more red cells','Red cells increase outdoor barometric pressure','New red cells raise arterial PO₂ by increasing dissolved oxygen at fixed conditions'],
      why:'Reduced renal oxygen availability stimulates erythropoietin. More circulating hemoglobin can carry more oxygen at a given saturation.'};
  }
};

const developmentalRecords=[
  ['A foregut outgrowth has formed paired bronchial buds. Distal gas-exchange surfaces are still absent.','Branching of the conducting airway tree','Formation of mature alveoli before bronchi','Surfactant secretion by the placenta','Successive branches form bronchi and the smaller airways.','The placenta exchanges gases for the fetus','The early lung bud supplies fetal oxygen by air breathing','Bronchial buds make fetal red cells','Fetal blood exchanges gases with the maternal circulation across the placenta. Early airways are not ventilated by air.'],
  ['Distal air spaces lie beside developing capillaries. Type II epithelial cells now secrete more material onto the lining.','Deposition of pulmonary surfactant','Formation of the initial lung bud','Production of hemoglobin by type I cells','Type II cells secrete surfactant into developing distal spaces.','Less tendency for small air spaces to collapse after inflation','Higher surface tension at expiration','Loss of contact between air and capillaries','Surfactant lowers surface tension at the air–liquid interface, improving compliance and helping keep air spaces open.'],
  ['Before delivery, the diaphragm contracts intermittently and moves fluid into and out of the developing airways.','Fetal breathing movements','Established pulmonary air breathing','The ending of placental gas exchange','Fetal breathing movements move liquid and support respiratory development.','After birth, air enters the lungs and pulmonary gas exchange increases','Air breathing supplies all oxygen before birth','Surfactant replaces the need for pulmonary blood flow','Expansion and aeration of the lungs at birth allow pulmonary gas exchange as placental exchange ends.']
];
export const lungDevelopment={
  title:'Interpret a developing lung',section:'22.7',figure:'22.29',
  intro:'Use the tissue and fluid clues to identify a developmental event, then predict its functional consequence.',
  controls:[select('record','Evidence record',['Branching tissue','Distal air space','Moving fluid'])],
  nextTrial:({record})=>({record:(Number(record)+1)%developmentalRecords.length}),
  run({record},responses=[]){
    const row=developmentalRecords[Number(record)],second=responses.length>0;
    return {observation:table('Developmental field record',['Observed evidence'],[[row[0]]]),
      question:second?'Which functional consequence follows from this record?':'Which process is represented?',
      choices:row.slice(second?5:1,second?8:4),why:row[second?8:4],nextDecision:second?undefined:'Predict the functional consequence',
      frames:[['Field record',row[0]],['Mechanism',row[second?8:4]]]};
  }
};
