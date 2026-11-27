import {choice,term,num} from './term-mock-winter-stations.js';
import {winterWritten} from './term-mock-winter-writing.js';

const questions = [
  [
    ['15.2',[15,19,20],'A fall in arterial stretch is followed by a shorter pacemaker interval. Which pathway best connects the two observations?','Reduced baroreceptor firing, increased cardiac sympathetic drive','Increased baroreceptor firing, increased cardiac vagal drive','Reduced baroreceptor firing, increased ventricular filling time','Less arterial stretch biases autonomic output toward restoring pressure and increasing heart rate.'],
    ['17.10',[17,18,20],'At sustained altitude, renal oxygen delivery falls. Which sequence helps restore oxygen delivery over days?','Erythropoietin rises → erythrocyte production increases','Aldosterone rises → mature erythrocytes divide','TSH rises → platelets synthesize hemoglobin','The renal endocrine signal recruits marrow production of oxygen-carrying cells.'],
    ['14.1',[14,15,16],'Reading a close target requires effective optics, sensory input and motor output. Which change represents parasympathetic near focusing?','Ciliary muscle contraction and a rounder lens','Flattening the lens by contracting the ciliary muscle','Blocking all retinal input while maintaining visual focus','Parasympathetic ciliary activation reduces zonular tension so the lens rounds.'],
    ['12.2',[12,13,16],'A dorsal column demyelinating lesion delays a vibration signal. Which observation ties the cellular injury to examination function?','Impaired propagation in a sensory tract and reduced vibration sense','Loss of erythrocytes and a lower hematocrit','Reduced insulin and increased muscle glucose uptake','A myelinated CNS sensory tract depends on efficient saltatory conduction.']
  ],[
    ['15.1',[15,17,19],'Both cardiac sympathetic nerve activity and circulating epinephrine rise during exercise. What response can they support in common?','Increased pacemaker rate through adrenergic signaling','Immediate reduction of every myocardial contraction','Insulin release as the sole cardiac chronotropic mechanism','Sympathetic terminals and adrenal catecholamines can both increase cardiac activity.'],
    ['20.3',[17,18,20],'An intact circulation loses plasma albumin while pressure is otherwise held constant. Which change favors interstitial fluid accumulation?','Reduced plasma oncotic opposition to filtration','Increased hemoglobin saturation','Greater plasma oncotic pressure precisely because protein fell','Albumin helps retain water in plasma through colloid osmotic pressure.'],
    ['16.4',[12,14,16],'A peripheral motor axon fails to release transmitter at a muscle. Which result is compatible with an intact sensory limb?','The stretch signal reaches the cord but the muscle response weakens','The vibration signal never enters the skin receptor','The failure must lie in visual cortex','The efferent output can fail downstream of normal sensory input.'],
    ['13.3',[12,13,20],'A major cerebral artery is transiently occluded. If oxygen and ATP fall, which process loses support in nearby neurons?','Maintenance of ion gradients by sodium–potassium ATPase','Passive diffusion of ions down existing gradients as its ATP source vanishes','Restoration of ATP by the blood–brain barrier alone','Neurons depend on vascular oxygen delivery and ATP-dependent gradient maintenance.']
  ],[
    ['19.2',[12,15,19],'Vagal input lengthens the time between successive SA node discharges. Which observation is most consistent with that change?','A longer interval between heartbeats','Disappearance of all skeletal muscle action potentials','A larger erythrocyte count on the next beat','Parasympathetic input slows SA node pacemaking.'],
    ['17.6',[15,17,20],'Renal perfusion falls and angiotensin II rises. Which pair links endocrine signaling to restoration of arterial pressure?','Arteriolar constriction and aldosterone-supported sodium retention','Arteriolar dilation and total sodium excretion','Erythrocyte destruction and reduced blood volume','Angiotensin II promotes vasoconstriction and aldosterone release.'],
    ['16.3',[13,14,16],'Light is detected in either eye. Only one pupil fails to constrict in every trial. Which interpretation links sensory input to the response pattern?','Input from either eye is usable; examine the affected efferent pathway','Both optic nerves must be interrupted','The retina of the responding pupil cannot detect light','A failure following the responding eye points to an output defect.'],
    ['18.3',[18,19,20],'Cardiac output remains constant as hemoglobin concentration falls. Which statement best predicts systemic oxygen delivery at the same saturation?','Delivery can fall despite normal blood flow','Delivery must double because plasma fraction is higher','Flow alone completely determines oxygen delivery','Oxygen delivery depends on both cardiac output and arterial oxygen content.']
  ]
];
const writing = [
  [
    ['15.2',[15,19,20],'After standing, venous return briefly drops. Explain how this can lower stroke volume, how carotid sinus firing changes as arterial pressure falls, and which cardiac reflex response opposes the fall.',
      'Reduced venous return decreases filling and stroke volume. Less wall stretch reduces carotid sinus afferent firing. Increased sympathetic or reduced vagal drive accelerates the heart.',
      'Connect reduced filling to lower stroke volume.','Connect reduced arterial stretch to lower baroreceptor firing.','Identify a compensating increase in cardiac sympathetic drive or decrease in vagal drive.'],
    ['17.10',[17,18,20],'Explain how reduced oxygen delivery to the kidneys changes a hormone signal, its marrow target and blood oxygen-carrying capacity over time.',
      'Reduced renal oxygen delivery stimulates erythropoietin. Erythroid precursors in red marrow increase production. More hemoglobin-bearing erythrocytes can improve oxygen-carrying capacity.',
      'Predict increased renal erythropoietin release.','Identify increased erythroid production in red marrow.','Connect more hemoglobin-bearing erythrocytes to improved oxygen-carrying capacity.']
  ],[
    ['16.4',[12,14,16],'A peripheral sensory neuron from a muscle spindle is interrupted. The motor neuron and muscle are intact. Explain what normally enters the cord, what happens to the stretch reflex and why direct stimulation of the motor axon can still produce contraction.',
      'The sensory afferent normally carries a stretch signal into the cord. Its loss reduces the segmental reflex. The final motor pathway and effector can still respond to direct motor stimulation.',
      'Identify the lost spindle afferent signal into the spinal cord.','Predict a diminished stretch reflex under the stated conditions.','Explain that the intact efferent axon, junction and muscle can respond to direct activation.'],
    ['17.6',[17,19,20],'Compare an immediate arteriolar effect and a slower renal effect of increased angiotensin II after a fall in effective circulating volume. How do both support arterial pressure?',
      'Arteriolar constriction raises systemic resistance. Angiotensin II also increases aldosterone, which promotes renal sodium retention. The resulting volume support can increase venous return and support cardiac output.',
      'Identify vasoconstriction and the rise in vascular resistance.','Link angiotensin II to aldosterone and renal sodium retention.','Connect volume support to increased venous return or cardiac output and support of pressure.']
  ],[
    ['19.4',[15,18,19,20],'During exercise, heart rate and stroke volume both rise. Explain why cardiac output changes, how active-muscle arterioles distribute blood, and how hemoglobin participates in oxygen delivery there.',
      'The product of heart rate and stroke volume rises. Local dilation favors blood flow to active muscle. Oxygen dissociates from hemoglobin as blood traverses the tissue capillaries.',
      'Explain increased cardiac output through increased heart rate times stroke volume.','Identify local arteriolar dilation and preferential flow to active muscle.','Relate hemoglobin unloading to oxygen supply at the tissue.'],
    ['16.3',[13,14,15,16],'A light stimulus in either eye causes only the right pupil to constrict. Trace the input that is demonstrably effective, the bilateral brainstem relay and the output to examine on the nonresponding side.',
      'Each eye can signal through its retina and optic nerve. A normal brainstem relay distributes light information to bilateral parasympathetic output nuclei. Since the left pupil fails under either stimulus, examine left oculomotor parasympathetic output, its peripheral relay or iris effector.',
      'Use the right response on either trial to infer usable afferent input from each eye.','Identify bilateral distribution in the pupillary light reflex.','Identify the left efferent limb or iris effector as the candidate.']
  ]
];
export function winterIntegrative(f){
  const multi=questions[f].map(([section,relatedChapters,prompt,right,b,c,why],i)=>({
    ...choice(prompt,right,b,c),section,relatedChapters,objective:'integrated-choice-'+i,points:1,why
  }));
  const rates=[72,75,80],sv=[75,80,65],rate=rates[f],vol=sv[f],higher=rate+10;
  const short=[
    {type:'short',section:'19.4',relatedChapters:[15,19],objective:'integrated-pacemaker-output',points:2,prompt:'Sympathetic stimulation raises heart rate while measured stroke volume stays fixed.',
      stimulus:{columns:['Stroke volume','Initial rate','Stimulated rate'],rows:[[vol+' mL/beat',rate+' beats/min',higher+' beats/min']]},
      parts:[num('Initial cardiac output (L/min)',rate*vol/1000,'L/min',.001),num('Stimulated cardiac output (L/min)',higher*vol/1000,'L/min',.001)],
      why:'Cardiac output is heart rate times stroke volume. Holding stroke volume fixed makes output proportional to the rate.'},
    [
      {section:'15.1',relatedChapters:[12,15,17],prompt:'Trace the direct sympathetic signal from its spinal terminal to adrenal secretory tissue.',parts:[term('Transmitter released by the preganglionic fiber','acetylcholine',['ACh']),term('Adrenal region receiving the fiber','adrenal medulla',['medulla'])],why:'Preganglionic ACh stimulates chromaffin cells in the adrenal medulla.'},
      {section:'18.2',relatedChapters:[17,18],prompt:'Name the hormone and production site in the response to low oxygen delivery.',parts:[term('Hormone stimulating erythroid precursors','erythropoietin',['EPO']),term('Organ that normally supplies most of this circulating hormone in adults','kidney',['kidneys'])],why:'The adult kidney provides the chief erythropoietin signal to red marrow.'},
      {section:'14.2',relatedChapters:[13,14,16],prompt:'Trace conscious vibration from the foot before its thalamic relay.',parts:[term('Medial dorsal-column fasciculus carrying lower-limb input','fasciculus gracilis',['gracile fasciculus']),term('Brainstem region where second-order fibers cross','medulla',['medulla oblongata','caudal medulla'])],why:'The gracile fasciculus ascends ipsilaterally to the medulla. Second-order axons then cross.'}
    ].map(q=>({...q,type:'short',objective:'integrated-neuro-endocrine',points:2}))[f]
  ];
  const extended=writing[f].map(([section,relatedChapters,prompt,example,...rubric],i)=>({...winterWritten({section,prompt,example,rubric},'integration-'+f+'-'+i),relatedChapters}));
  return [...multi,...short,...extended];
}
