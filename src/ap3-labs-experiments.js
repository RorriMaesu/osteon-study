// Values in these teaching datasets are illustrative. Each experiment states
// which quantities are fixed and permits the learner to change one or more inputs.
export const select = (key, label, labels) => ({ key, label, labels });
export const slider = (key, label, min, max, step, initial, unit) => ({ key, label, min, max, step, initial, unit });
export const table = (caption, headers, rows) => ({ caption, headers, rows });
const frame = (label, detail) => [label, detail];

export const antibody = {
  title: 'Read an antibody time course', section: '21.4',
  intro: 'Both exposures use the same amount of the same antigen. The vertical scale is antibody concentration in arbitrary units (AU).',
  controls: [select('series', 'Observation to inspect', ['Days following a first exposure', 'Days following a later exposure'])],
  run({ series }) {
    const recall = Number(series) === 1;
    const days = [0, 2, 4, 7, 10, 14];
    const values = recall ? [2, 14, 48, 82, 65, 48] : [0, 0, 1, 7, 15, 10];
    const rows = days.map((day, i) => [day, values[i]]);
    return {
      observation: table('Antibody concentration after exposure', ['Elapsed time (days)', 'Antibody (AU)'], rows),
      plot: { x: 'Elapsed time (days)', y: 'Antibody (AU)', rows, ymax: 90 },
      question: 'Which feature best distinguishes this response from the other exposure?',
      choices: recall ? ['An early, large increase consistent with memory', 'A prolonged lag with a low peak', 'An immediate drop to zero as antigen arrives'] : ['A delayed, relatively low peak', 'A large rise by day 2 consistent with recall', 'A constant concentration throughout'],
      why: recall ? 'Antibody has risen by day 2 and reaches 82 AU by day 7. Previously activated clones can produce a faster, larger response.' : 'By day 4 the sample has only 1 AU, and the peak is 15 AU on day 10. A first response takes time for activation and clonal expansion.',
      frames: days.map((day, i) => frame('Day '+day, 'Antibody measures '+values[i]+' AU. '+(i===0?'Use the same scale to compare both exposures.':('Change since the preceding sample: '+(values[i]-values[i-1])+' AU.')))),
    };
  },
};

export const breathing = {
  title: 'Scrub a quiet breath', section: '22.3',
  intro: 'This illustrative breath begins at resting end-expiration. Atmospheric pressure is fixed at 0 cm H₂O gauge. All pressures use the same reference. The volume column gives change above resting lung volume.',
  controls: [select('moment', 'Make a prediction at', ['Mid-inspiration', 'End-inspiration', 'Mid-expiration'])],
  run({ moment }) {
    const headers = ['Time (s)', 'Volume change (mL)', 'Alveolar pressure (cm H₂O)', 'Pleural pressure (cm H₂O)', 'Airflow (L/s)'];
    const rows = [[0,0,0,-5,0],[1,250,-1,-6.5,0.39],[2,500,0,-7.5,0],[3,250,1,-5.8,-0.39],[4,0,0,-5,0]];
    const idx = 1+Number(moment);
    const directions = ['Inward','Zero','Outward'];
    const choices = [directions[Number(moment)],...directions.filter(d=>d!==directions[Number(moment)])];
    return {
      observation: table('Pressure at the selected instant', ['Time (s)','Alveolar pressure (cm H₂O)','Atmospheric pressure (cm H₂O)'], [[rows[idx][0],rows[idx][2],0]]),
      question: 'With an open airway, which direction is the airflow at this instant?', choices,
      why: ['Alveolar pressure is below atmospheric pressure. Air enters down that pressure gradient.','The lung is expanded, but alveolar and atmospheric pressure are equal, so instantaneous flow is zero.','Alveolar pressure exceeds atmospheric pressure, so air leaves the lungs.'][Number(moment)],
      result: table('One complete breath. Positive airflow is inward.',headers,rows),
      plotAfter: { x:'Elapsed time (s)', y:'Volume change (mL)', rows:rows.map(([t,v])=>[t,v]) },
      frames: rows.map(([t,v,pa,pp,flow])=>frame(t+' s', 'Volume change '+v+' mL. Alveolar pressure '+pa+' cm H₂O. Intrapleural pressure '+pp+' cm H₂O. Airflow '+flow+' L/s (positive inward).')),
    };
  },
};

export const ventilation = {
  title: 'Compare breathing patterns', section: '22.3',
  intro: 'Both patterns deliver 6.0 L/min minute ventilation. Adjust dead-space volume, assumed the same for each breath in both patterns. Predict fresh air reaching alveoli each minute.',
  controls: [slider('dead', 'Dead space per breath', 100, 200, 10, 150, 'mL')],
  run({ dead }) {
    dead=Number(dead);
    const a=(500-dead)*12/1000, b=(300-dead)*20/1000;
    return {
      observation:table('Two breathing patterns',['Pattern','Tidal volume (mL)','Rate (breaths/min)'],[['A',500,12],['B',300,20]]),
      question:'Which delivers more fresh air to the alveoli per minute?',
      choices:['Pattern A','Pattern B','Both deliver the same fresh-air volume'],
      why:'Each breath fills the same dead space. Pattern B fills it 20 times each minute, compared with 12 times for pattern A.',
      frames:[frame('Conducting airways','Dead space is '+dead+' mL per breath.'),frame('Fresh air per breath','A: '+(500-dead)+' mL. B: '+(300-dead)+' mL.'),frame('Alveolar ventilation','A: '+a.toFixed(2)+' L/min. B: '+b.toFixed(2)+' L/min. Subtract dead space before multiplying by rate.')],
    };
  },
};

export const spirometry = {
  title: 'Read a volume trace', section:'22.3',
  intro:'A simple spirometer records changes in lung volume relative to resting end-expiration. The baseline of zero represents this reference position.',
  controls:[select('form','Trial',['Trial A','Trial B'])],
  run({form}){
    const high=Number(form)===0?3.2:3.5, low=Number(form)===0?-1.1:-0.9;
    const rows=[[0,0],[1,0.5],[2,0],[3,0.5],[4,0],[6,high],[9,low],[12,0]];
    return {observation:table('Relative volume at sampled times',['Time (s)','Relative volume (L)'],rows),plot:{x:'Time (s)',y:'Relative volume (L)',rows},
      question:'Which value can you determine from the deepest inspiration and maximal expiration in this trace?',
      choices:[(high-low).toFixed(1)+' L vital capacity',high.toFixed(1)+' L total lung capacity',Math.abs(low).toFixed(1)+' L residual volume'],
      why:'Vital capacity is the difference between the two volume extremes. A simple spirometer does not measure the gas that remains after maximal expiration.',
      frames:[frame('Quiet breath','The first quiet excursion is 0.5 L.'),frame('Maximal inspiration','The trace reaches +'+high+' L relative to resting end-expiration.'),frame('Maximal expiration','The trace reaches '+low+' L. The change from the maximum is '+(high-low).toFixed(1)+' L.')],
    };
  },
};

export const fedFast = {
  title:'Switch between feeding states', section:'24.5',
  intro:'Compare normal fuel traffic at rest. Activity and tissue mass are held constant. Each arrow in the evidence is relative to the contrasting feeding state.',
  controls:[select('state','Metabolic state',['After a carbohydrate-containing meal','Overnight fast'])],
  run({state}){
    const fast=Number(state)===1;
    return {observation:table('Hormonal setting',['Signal','Relative level'],[['Insulin',fast?'Lower':'Higher'],['Glucagon',fast?'Higher':'Lower']]),
      question:'Which coordinated change in fuel traffic fits the selected setting?',
      choices:fast?['Liver exports glucose and adipose releases fatty acids','Liver stores glycogen and adipose stores incoming triglyceride','Muscle exports its glycogen directly into blood']:['Liver stores glycogen and adipose stores incoming lipid','Both liver and muscle export free glucose from glycogen','Adipose lipolysis supplies most incoming dietary glucose'],
      why:fast?'The liver supports blood glucose between meals while fatty-acid release gives tissues another fuel.':'After a meal, insulin supports uptake and storage of incoming nutrients.',
      frames:fast?[frame('Liver','Glycogen breakdown and gluconeogenesis supply glucose to blood.'),frame('Adipose','Lipolysis releases fatty acids and glycerol.'),frame('Muscle','Muscle can oxidize fatty acids while its own glycogen serves local demand.')]:[frame('Intestine','Absorbed glucose enters hepatic portal blood.'),frame('Liver and muscle','Glycogen synthesis can increase as incoming glucose is stored.'),frame('Adipose','Higher insulin favors triglyceride storage and restrains lipolysis.')],
    };
  },
};

export const heat = {
  title:'Calculate net heat storage', section:'24.6',
  intro:'Heat production is 400 W. Radiation, conduction and convection together remove 240 W. Change the evaporative heat loss and predict the result while all other terms stay fixed.',
  controls:[slider('evap','Evaporative heat loss',40,280,20,160,'W')],
  run({evap}){
    const loss=240+Number(evap), net=400-loss;
    const directions=['Stored heat increases','Stored heat stays constant','Stored heat decreases'], key=net>0?0:net===0?1:2;
    return {observation:table('Heat budget',['Term','Rate (W)'],[['Metabolic production',400],['Nonevaporative loss',240],['Evaporative loss',evap]]),
      question:'How does the body’s heat content change during this interval?',choices:[directions[key],...directions.filter((_,i)=>i!==key)],
      why:'Heat storage rate = heat production − total heat loss. Watts are joules per second.',
      frames:[frame('Add heat losses','Total loss = 240 + '+evap+' = '+loss+' W.'),frame('Net storage','400 − '+loss+' = '+net+' W.'),frame('One minute later','If these rates persist for 60 seconds, stored heat changes by '+(net*60/1000).toFixed(1)+' kJ.')],
    };
  },
};

export const excretion = {
  title:'Balance a filtered solute', section:'25.6',
  intro:'Model steady transport of a freely filtered solute. The filtered load is fixed at 100 mg/min. Set the two tubular transport rates and predict how excretion compares with filtration.',
  controls:[slider('reabs','Reabsorption',0,100,5,65,'mg/min'),slider('secrete','Secretion',0,100,5,15,'mg/min')],
  run({reabs,secrete}){
    const r=Number(reabs),s=Number(secrete),ex=100-r+s;
    const directions=['Below filtered load','Equal to filtered load','Above filtered load'], key=ex<100?0:ex===100?1:2;
    return {observation:table('Mass transport',['Movement','Rate (mg/min)'],[['Filtration • blood to capsule',100],['Reabsorption • tubule to blood',r],['Secretion • blood to tubule',s]]),
      question:'How does the rate leaving in urine compare with the filtered load?',choices:[directions[key],...directions.filter((_,i)=>i!==key)],
      why:'Excretion = filtration − reabsorption + secretion. Compare the amounts added and removed in the tubules.',
      frames:[frame('After filtration','The filtered load is 100 mg/min.'),frame('Account for recovery','100 − '+r+' = '+(100-r)+' mg/min remains from the filtered load.'),frame('Account for secretion','Adding '+s+' mg/min gives '+ex+' mg/min excreted in urine.')],
    };
  },
};

export const waterShift = {
  title:'Predict a cell-volume change', section:'26.1',
  intro:'A model cell contains 300 milliosmoles of trapped solute. The surrounding bath is large enough to maintain its concentration. Only water crosses the membrane. Ignore hydrostatic pressure.',
  controls:[slider('initialVol','Initial cell water',0.8,1.2,0.1,1,'L'),slider('outside','Effective solute concentration in bath',200,400,25,350,'mOsm/L')],
  run({initialVol,outside}){
    const v=Number(initialVol), bath=Number(outside), inside=300/v, final=300/bath;
    const directions=['Water exits the cell','No net water movement','Water enters the cell'], key=Math.abs(inside-bath)<0.01?1:inside<bath?0:2;
    return {observation:table('Initial model conditions',['Measurement','Value'],[['Cell effective solute concentration',inside.toFixed(1)+' mOsm/L'],['Bath effective solute concentration',bath+' mOsm/L'],['Cell water',v.toFixed(1)+' L']]),
      question:'Which initial net movement of water do you predict?',choices:[directions[key],...directions.filter((_,i)=>i!==key)],
      why:'Water moves toward the higher effective solute concentration until the concentrations match. The cell’s trapped solute amount remains 300 milliosmoles.',
      frames:[frame('Before equilibration','Cell concentration = 300 mOsm ÷ '+v.toFixed(1)+' L = '+inside.toFixed(1)+' mOsm/L.'),frame('Water shift',directions[key]+'. Bath concentration stays fixed at '+bath+' mOsm/L.'),frame('After equilibration','Cell water = 300 mOsm ÷ '+bath+' mOsm/L = '+final.toFixed(2)+' L. Both concentrations are '+bath+' mOsm/L.')],
    };
  },
};
