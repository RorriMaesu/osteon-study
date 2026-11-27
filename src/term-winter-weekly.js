import {sectionById} from './ap2-library.js';
import {termExamWeeks} from './term-exam-weeks.js';

const pick=(prompt,correct,...others)=>({type:'choice',prompt,choices:[correct,...others],answer:0});
const value=(prompt,expected,unit)=>({type:'number',prompt,expected:String(expected),unit,tolerance:0.001});
const word=(prompt,expected,...aliases)=>({type:'term',prompt,expected,aliases});
// These small teaching datasets belong exclusively to the weekly checks.
// Each row supplies two independent readings and a second short-answer task.
function exercise(week,f){
  switch(week){
    case 1:{
      const rest=[-71,-68,-69][f],first=rest+6,second=rest+12;
      return ['12.5','Read two subthreshold postsynaptic recordings.',['Condition','Peak voltage (mV)'],[['Resting cell',rest],['One pulse at bouton K',first],['Two closely spaced pulses at K',second]],
        [value('How far above rest is the last peak?',12,'mV'),pick('Which process adds the two inputs from K?','Temporal summation','Spatial summation','Saltatory conduction')],
        'The voltage change is measured from rest. Repeated signals at one bouton can overlap in time.',
        '12.2','Identify support cells from the tissue compartment.',
        [word('Which glial cell wraps a peripheral myelin internode?','Schwann cell','neurolemmocyte'),word('Which glial cell can wrap multiple CNS axons?','Oligodendrocyte')],'Peripheral and central myelin come from different glial cells.'];
    }
    case 2:{
      const side=['Left','Right','Left'][f],levels=['lumbar','cervical','sacral'];
      return ['13.4','Interpret recordings from a '+levels[f]+' spinal nerve preparation.',['Recording site','Activity'],[[side+' dorsal root','During matched skin stimulation'],[side+' ventral root','During skeletal muscle activation']],
        [pick('Which root contains the incoming fibers?','Dorsal root','Ventral root','Both roots exclusively'),
         pick('What travels through the joined spinal nerve?','Sensory and motor signals','Motor signals only','CSF only')],
        'Dorsal roots carry afferents and ventral roots carry efferents. The spinal nerve formed by their union contains both.',
        '13.1','Name the two major derivatives of the embryonic forebrain.',
        [word('Which vesicle forms the cerebral hemispheres?','Telencephalon'),word('Which forms the thalamus?','Diencephalon')],'The forebrain divides into the telencephalon and diencephalon.'];
    }
    case 3:{
      const site=['index fingertip','thumb pad','middle fingertip'][f],near=[3,4,5][f],far=[22,24,26][f];
      return ['14.1','Compare two-point thresholds in a simulated sensory map.',['Site','Smallest separation resolved (mm)'],[[site,near],['Forearm',far]],
        [value('How much larger is the forearm threshold?',far-near,'mm'),pick('Which feature supports finer localization at the digit?','Smaller receptive fields','Larger receptive fields','Fewer sensory endings')],
        'Subtract the smaller threshold from the larger one. Small densely sampled fields support finer spatial discrimination.',
        '14.2','Trace a conscious somatic signal through the forebrain.',
        [word('Which diencephalic structure relays most somatic sensory signals to the cortex?','Thalamus'),word('Which gyrus contains primary somatosensory cortex?','Postcentral gyrus')],'Thalamic relay neurons project to the postcentral gyrus.'];
    }
    case 4:{
      const slow=[58,62,66][f],fast=slow+19;
      return ['15.1','Read a paired pacemaker experiment with cardiac nerves intact.',['Condition','Heart rate (beats/min)'],[['Increased vagal activity',slow],['Vagal activity reduced',fast]],
        [value('How much did rate rise?',19,'beats/min'),pick('Which receptor on pacemaker cells mediates the slowing?','Muscarinic receptor','Nicotinic ganglionic receptor','Alpha-1 receptor')],
        'Vagal postganglionic fibers release acetylcholine onto cardiac muscarinic receptors. Reducing the vagal signal can increase heart rate.',
        '15.1','Name the transmitters at two sympathetic synapses supplying a typical arteriole.',
        [word('Which transmitter is released in its autonomic ganglion?','Acetylcholine','ACh'),word('Which reaches the arteriole from its postganglionic fiber?','Norepinephrine','Noradrenaline','NE')],'Preganglionic autonomic fibers are cholinergic. Most sympathetic vasomotor postganglionic fibers are adrenergic.'];
    }
    case 5:{
      const start=[2,3,4][f],end=start+3;
      return ['16.2','Compare spoken recall in a standardized word-list task.',['Condition','Words recalled of 8'],[['Immediately after presentation',end],['After a delay without cues',start]],
        [value('How many fewer words were recalled after the delay?',3,'words'),pick('Which ability is being sampled most directly?','New learning and memory','Eye abduction','Tendon reflex gain')],
        'The task samples registration and delayed recall. The measurements alone do not establish the cause of a difference.',
        '17.2','Identify two types of signaling targets.',
        [word('Which membrane enzyme converts ATP to cAMP?','Adenylyl cyclase','Adenylate cyclase'),word('What class of lipid-soluble hormones is derived from cholesterol?','Steroid hormones','Steroids','Steroid')],'Cyclic AMP is a second messenger. Steroid hormones are synthesized from cholesterol.'];
    }
    case 6:{
      const high=[11,12,13][f],low=[3,4,5][f];
      return ['17.5','Read paired measurements in a short parathyroid-cell experiment.',['Medium','Relative PTH output'],[['Lower extracellular calcium',high],['Higher extracellular calcium',low]],
        [value('How many relative units higher is output in the lower-calcium medium?',high-low,'units'),pick('Which cells produced the measured hormone?','Parathyroid chief cells','Thyroid follicular cells','Chromaffin cells')],
        'Low extracellular calcium increases PTH secretion from parathyroid chief cells.',
        '17.6','Identify the two adrenal compartments.',
        [word('Where are catecholamine-producing chromaffin cells located?','Adrenal medulla','Medulla'),word('Which cortical zone produces aldosterone?','Zona glomerulosa','Glomerulosa')],'The medulla secretes catecholamines and the outermost cortical zone produces mineralocorticoids.'];
    }
    case 7:{
      const packed=[19,21,23][f],total=50;
      return ['18.1','Interpret a centrifuged teaching blood sample.',['Measurement','Volume (mL)'],[['Packed red cells',packed],['Whole sample',total]],
        [value('Calculate the packed red-cell percentage.',packed*2,'%'),pick('Which element makes the largest contribution to this packed layer?','Erythrocytes','Leukocytes','Platelets')],
        'Hematocrit is packed red-cell volume divided by whole-blood volume, times 100.',
        '17.9','Name the pancreatic islet cells that respond to changing fuel levels.',
        [word('Which cells secrete insulin?','Beta cells','Beta','β cells'),word('Which cells secrete glucagon?','Alpha cells','Alpha','α cells')],'Insulin comes from beta cells and glucagon from alpha cells.'];
    }
    case 8:{
      const count=[6000,7000,8000][f],percent=[50,60,40][f];
      return ['18.4','Use the differential and total white-cell count together.',['Measurement','Value'],[['White cells per microliter',count],['Neutrophils (%)',percent]],
        [value('Calculate neutrophils per microliter.',count*percent/100,'cells/µL'),pick('What else is needed to compare absolute neutrophil counts when two samples share the same percentage?','Total leukocyte count','Platelet volume','ABO type')],
        'Multiply total leukocytes by the neutrophil fraction. A percentage has no absolute count without its denominator.',
        '18.5','Name two participants in stable clot formation.',
        [word('Which enzyme cleaves fibrinogen?','Thrombin'),word('Which protein forms the resulting strands?','Fibrin')],'Thrombin converts soluble fibrinogen to fibrin, which reinforces the platelet plug.'];
    }
    case 9:{
      const start=[132,141,124][f],end=[46,48,44][f];
      return ['19.4','Analyze an isolated ventricle over one observed beat.',['Volume recording','mL'],[['Immediately before systole',start],['Immediately after ejection',end]],
        [value('What volume was ejected?',start-end,'mL'),pick('Which extra measurement converts that volume to output per minute?','Beats per minute','Aortic opening pressure','End-systolic pressure')],
        'Subtract end-systolic from end-diastolic volume for stroke volume. Multiply stroke volume by heart rate for cardiac output.',
        '19.2','Name the ventricular portions of an ECG.',
        [word('What complex records ventricular depolarization?','QRS complex','QRS'),word('Which wave represents ventricular repolarization?','T wave','T')],'The ECG records electrical activity. QRS and T represent the two ventricular electrical events.'];
    }
    default:{
      const upstream=[91,101,96][f],downstream=[11,6,16][f];
      return ['20.2','Read pressure at both ends of a perfused teaching vessel.',['Site','Pressure (mmHg)'],[['Upstream',upstream],['Downstream',downstream]],
        [value('Calculate the driving pressure.',upstream-downstream,'mmHg'),pick('At fixed resistance, what happens to flow if downstream pressure rises?', 'Flow decreases','Flow increases','Flow stays constant')],
        'Flow depends on upstream minus downstream pressure divided by resistance.',
        '20.6','Identify two fetal routes around the pulmonary circulation.',
        [word('Which opening joins the atria?','Foramen ovale'),word('Which vessel connects the pulmonary trunk to the aorta?','Ductus arteriosus')],'The foramen ovale is an interatrial opening. The ductus arteriosus links the pulmonary and systemic outflows.'];
    }
  }
}

export function winterWeeklyItems(week,form){
  const f=['A','B','C'].indexOf(form),plan=termExamWeeks.ap2.find(w=>w.week===week);
  if(!plan?.sections.length||f<0)throw new RangeError('Unknown winter weekly check.');
  const weekly=(section,suffix)=>({id:'winter-week-'+week+'-'+form.toLowerCase()+'-'+suffix,section,source:sectionById.get(section).source,chapter:Number(section.split('.')[0]),contentVersion:'winter-weekly-1'});
  const concepts=plan.sections.map((id,i)=>{
    const lesson=sectionById.get(id),q=lesson.questions[(i+f)%lesson.questions.length];
    return {...weekly(id,'concept-'+i),type:'choice',prompt:q.prompt,why:q.why,choices:[...q.choices],answer:q.answer,points:1};
  });
  const [sec,prompt,columns,rows,parts,why,shortSec,shortPrompt,shortParts,shortWhy]=exercise(week,f);
  // Rotate the keyed choices in the snapshot so the correct option varies by station and form.
  function vary(part,i){
    if(!part.choices)return part;
    const offset=(week+f+i)%part.choices.length,choices=part.choices.slice(offset).concat(part.choices.slice(0,offset));
    return {...part,choices,answer:choices.indexOf(part.choices[part.answer])};
  }
  return [...concepts,
    {...weekly(sec,'data'),type:'evidence',points:2,prompt,stimulus:{columns,rows},parts:parts.map(vary),why},
    {...weekly(shortSec,'retrieval'),type:'short',points:2,prompt:shortPrompt,parts:shortParts,why:shortWhy}];
}
