import {select,slider,table} from './ap3-labs-experiments.js';

export const filtrationPressure={
  title:'Change the forces that filter plasma',section:'25.5',figure:'25.16',
  intro:'Compare your glomerulus with a baseline of 55 mmHg in the capillary, 15 mmHg in the capsule and 30 mmHg of plasma oncotic pressure. In this model, capsular oncotic pressure is zero and the filtration coefficient stays at 12.5 mL/min/mmHg for both kidneys together.',
  controls:[slider('capillary','Glomerular capillary hydrostatic pressure',50,60,1,55,'mmHg'),slider('capsule','Capsular hydrostatic pressure',10,18,1,15,'mmHg'),slider('oncotic','Plasma oncotic pressure',24,32,1,30,'mmHg')],
  run({capillary,capsule,oncotic},answers=[]){
    const net=capillary-capsule-oncotic,gfr=net*12.5;
    const observation=table('Hydrostatic and osmotic forces',['Force (mmHg)','Baseline','Your trial'],[
      ['Glomerular capillary pressure',55,capillary],['Capsular pressure',15,capsule],['Plasma oncotic pressure',30,oncotic]
    ]);
    const frames=[['Outward force',capillary+' mmHg drives fluid into capsular space.'],['Opposing forces','Capsular fluid pressure and plasma protein osmotic pressure oppose filtration, totaling '+(capsule+oncotic)+' mmHg.']];
    if(!answers.length)return {observation,question:'What is the net outward filtration pressure?',choices:[net,net+5,net-5].map(n=>n+' mmHg'),why:capillary+' − '+capsule+' − '+oncotic+' = '+net+' mmHg.',frames,nextDecision:'Predict the filtration rate'};
    const change=gfr===125?'stays at baseline':gfr>125?'rises above baseline':'falls below baseline';
    return {observation,note:'The net filtration pressure is '+net+' mmHg. Baseline GFR is 125 mL/min.',question:'With the same filtration coefficient, what GFR follows?',
      choices:[gfr,gfr+50,gfr===0?12.5:Math.max(0,gfr-12.5)].map(n=>n+' mL/min'),why:'GFR equals coefficient × net pressure: 12.5 × '+net+' = '+gfr+' mL/min. It '+change+'.',
      result:table('Predicted filtration',['Quantity','Baseline','Your trial'],[['Net filtration pressure (mmHg)',10,net],['GFR (mL/min)',125,gfr]]),frames};
  }
};

const signals=[
  {observation:'Blood flow to the kidneys is preserved, but blood arriving there carries less oxygen. Renal oxygen sensing is intact.',key:'Erythropoietin',target:'Erythroid precursors in red marrow increase red-cell production.',why:'Oxygen-sensitive interstitial cells in the kidney increase erythropoietin release.',effect:'With available iron and an intact marrow, more red cells gradually improve oxygen-carrying capacity.'},
  {observation:'Ionized blood calcium falls. PTH rises, sufficient vitamin D precursor is available, and the kidney can respond.',key:'Calcitriol',target:'Intestinal epithelium increases calcium absorption.',why:'PTH stimulates proximal tubular cells to activate 25-hydroxyvitamin D to calcitriol.',effect:'Increased intestinal calcium and phosphate absorption supports mineral availability for bone. PTH also has separate renal and skeletal actions.'},
  {observation:'The afferent arteriole is stretched less after effective circulatory volume falls. Juxtaglomerular cells are intact.',key:'Renin',target:'Angiotensinogen is cleaved, initiating a response that supports arterial pressure.',why:'Granular cells of the afferent arteriole release the enzyme renin when renal perfusion pressure falls.',effect:'Angiotensin II can constrict arterioles and stimulate aldosterone. Renal sodium retention helps restore extracellular volume.'}
];
export const renalSignals={
  title:'Follow an endocrine signal out of the kidney',section:'25.10',
  intro:'Use the observed renal stimulus to predict the message and its downstream effect.',
  controls:[select('record','Observation',['Record A','Record B','Record C'])],
  run({record},answers=[]){
    const row=signals[record],observation=table('Renal observations',['Finding'],[[row.observation]]);
    const first=!answers.length,field=first?'key':'target';
    return {observation,question:first?'Which renal signal increases?':'What response would this signal produce?',choices:[row[field],...signals.filter(v=>v!==row).map(v=>v[field])],
      why:first?row.why:row.effect,nextDecision:first?'Predict the downstream response':undefined,
      frames:first?[['Stimulus',row.observation],['Kidney response',row.why]]:[['Message',row.key],['Downstream effect',row.effect]]};
  }
};

const disturbances=[
  {primary:'Respiratory acidosis',start:[56,25],end:[56,30],organ:'Kidneys',direction:'Plasma bicarbonate increases.',change:'Net renal acid excretion and return of bicarbonate to blood increase.',timing:'Hours to days',time:'48 hours'},
  {primary:'Respiratory alkalosis',start:[30,23],end:[30,20],organ:'Kidneys',direction:'Plasma bicarbonate decreases.',change:'Renal retention of filtered bicarbonate and net acid excretion decrease.',timing:'Hours to days',time:'48 hours'},
  {primary:'Metabolic acidosis',start:[40,16],end:[32,16],organ:'Lungs',direction:'Arterial PCO₂ decreases.',change:'Increased alveolar ventilation removes more CO₂.',timing:'Within minutes',time:'30 minutes'},
  {primary:'Metabolic alkalosis',start:[40,34],end:[46,34],organ:'Lungs',direction:'Arterial PCO₂ increases.',change:'Reduced alveolar ventilation allows CO₂ to accumulate. Oxygen requirements limit the response.',timing:'Within minutes',time:'30 minutes'}
];
const gas=([co2,bicarb])=>[(6.1+Math.log10(bicarb/(0.03*co2))).toFixed(2),co2,bicarb];
export const compensation={
  title:'Predict the next blood gas',section:'26.4',
  intro:'Each simulated record begins with a single primary disturbance. The primary change persists and the compensating organ functions normally. Reference intervals: pH 7.35–7.45, arterial PCO₂ 35–45 mmHg and bicarbonate 22–26 mmol/L.',
  controls:[select('panel','Paired blood samples',['Case A','Case B','Case C','Case D'])],
  run({panel},answers=[]){
    const row=disturbances[panel],headers=['Sample','pH','PCO₂ (mmHg)','HCO₃⁻ (mmol/L)'];
    const first=['At onset',...gas(row.start)],later=[row.time+' later',...gas(row.end)];
    const observation=table('First arterial blood gas',headers,[first]);
    const task=answers.length,qs=['Which disturbance is primary?','Which organs produce the compensating response?','Which measurement should shift during compensation?','When would this compensating mechanism begin to change the blood?'];
    const options=[disturbances.map(v=>v.primary),['Kidneys','Lungs'],disturbances.map(v=>v.direction),['Within minutes','Hours to days']];
    const key=[row.primary,row.organ,row.direction,row.timing][task];
    const expl=['Compare the direction of the pH change with the changes in PCO₂ and bicarbonate. '+row.primary+' fits the initial values.',
      row.organ+' change the other part of the bicarbonate buffer system to oppose the primary pH disturbance.',row.change,row.organ==='Lungs'?'Ventilation can change within minutes, with the full effect developing later.':'A renal response develops over hours and grows over several days.'][task];
    const data={observation,question:qs[task],choices:[key,...options[task].filter(v=>v!==key)],why:expl,frames:[['First sample','The initial pH is '+first[1]+'.'],['Interpretation',expl]]};
    if(task<3)data.nextDecision=['Choose the compensating organ','Predict the direction','Predict the timing'][task];
    else{
      data.result=table('Matched arterial blood gases',headers,[first,later]);
      data.frames=[['Initial disturbance',row.primary],['Second sample',row.change+' The pH moves from '+first[1]+' to '+later[1]+', toward 7.40. Compensation can move pH toward its reference range even while the disturbance persists.']];
    }
    return data;
  }
};

const ions=[
  ['Sodium (Na⁺)','The most abundant extracellular cation helps determine extracellular osmolality.','Water follows changes in effective extracellular osmolality.','Hyponatremia and hypernatremia'],
  ['Potassium (K⁺)','A high intracellular concentration and selective membrane permeability help set resting membrane potential.','Changes in extracellular potassium can strongly change the excitability of nerve and muscle.','Hypokalemia and hyperkalemia'],
  ['Chloride (Cl⁻)','This predominant extracellular anion accompanies sodium and participates in forming gastric acid.','Chloride contributes to extracellular electrical neutrality and participates in the red-cell chloride shift.','Hypochloremia and hyperchloremia'],
  ['Bicarbonate (HCO₃⁻)','This extracellular buffer base accepts H⁺ and is linked to dissolved CO₂ in blood.','The lungs and kidneys regulate the two components of the carbonic acid–bicarbonate buffer.','Low and high plasma bicarbonate'],
  ['Calcium (Ca²⁺)','Its free cytosolic concentration rises during contraction and triggers vesicle release at synapses.','Ionized calcium is important for signaling and clotting. A large reserve is held in bone mineral.','Hypocalcemia and hypercalcemia'],
  ['Phosphate (mainly HPO₄²⁻ and H₂PO₄⁻)','This buffer in tubular fluid can bind secreted H⁺. It also supplies groups in ATP.','Phosphate contributes to urinary buffering, ATP and bone mineral.','Hypophosphatemia and hyperphosphatemia']
];
export const electrolyteRoles={
  title:'Identify six electrolytes from physiological evidence',section:'26.3',
  intro:'Read the function or compartment clue. Choose the ion that best accounts for both observations.',
  controls:[select('field','Record',ions.map((_,i)=>'Record '+(i+1)))],
  run({field}){
    const [name,cue,why,terms]=ions[field];
    return {observation:table('Physiology evidence',['Finding'],[[cue]]),question:'Which electrolyte fits this evidence?',choices:[name,...ions.filter(row=>row[0]!==name).map(row=>row[0])],
      why,frames:[['Role',why],['Concentration changes',terms+'. Concentration in a sample and total body stores can change independently.']]};
  }
};
