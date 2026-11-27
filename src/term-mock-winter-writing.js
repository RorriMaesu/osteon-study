import {writtenCases} from './ap2-writing.js';
import {examWritingCases} from './ap2-exam-writing.js';

const caseOf=(section,prompt,example,...rubric)=>({section,prompt,example,rubric});
const cases = {
  pupil:caseOf('16.3','Light in the left eye elicits no constriction in either pupil. Light in the right eye constricts both. Explain the evidence for intact motor output and identify the input to examine.',
    'Both pupils can constrict when the right eye is illuminated. Failure follows illumination of the left eye. The left afferent light pathway is the candidate.',
    'Use constriction of both pupils with right illumination as evidence that both efferent limbs can function.','Relate loss of both responses specifically to left-eye stimulation.','Identify the left afferent light pathway (retina or optic input) as the candidate.'),
  autonomic:caseOf('15.1','Compare sympathetic transmission to an eccrine sweat gland and to a typical resistance arteriole. Include the shared ganglionic signal, the target signals and the response at each target.',
    'Both use preganglionic ACh at nicotinic receptors. Sweat glands receive postganglionic ACh at muscarinic receptors and increase secretion. Cutaneous resistance arterioles typically receive norepinephrine at alpha-1 receptors and constrict.',
    'Identify the shared cholinergic nicotinic ganglionic relay.','Give the eccrine cholinergic muscarinic pathway and increased secretion.','Give the usual cutaneous adrenergic pathway and vasoconstriction.'),
  thyroid:caseOf('17.4','Free T4 is low and TSH is elevated. Assume a functioning pituitary and no hormone treatment. Explain the paired results and predict how adequate replacement T4 would affect TSH.',
    'Low circulating thyroid hormone removes a negative feedback signal. An intact pituitary increases TSH to drive thyroid output. Restoring T4 tends to lower TSH toward baseline.',
    'Explain that low thyroid hormone weakens negative feedback.','Link reduced feedback to increased pituitary TSH secretion.','Predict a fall in TSH as replacement restores the feedback signal.'),
  adrenal:caseOf('17.6','In an experimental axis, the adrenal cortex fails to synthesize cortisol despite high ACTH. Trace the response upstream, and predict what happens to ACTH when circulating cortisol is restored.',
    'The fall in cortisol removes negative feedback. Hypothalamic CRH and pituitary ACTH drive increase. Restoring cortisol reduces that drive and lowers ACTH.',
    'Explain that loss of circulating cortisol reduces negative feedback.','Relate reduced feedback to increased hypothalamic CRH and pituitary ACTH drive.','Predict that restored circulating cortisol decreases ACTH.'),
  insulin:caseOf('17.9','Two preparations have the same high insulin concentration. Preparation A has responsive receptors in muscle, while preparation B has severely reduced receptor signaling. Predict relative glucose uptake, the effect on circulating glucose, and the expected early pancreatic compensation if beta cells remain functional.',
    'Muscle B takes up less glucose in response to insulin. Glucose therefore stays higher in its circulation after the same meal. Responsive beta cells initially secrete additional insulin.',
    'Predict lower insulin-stimulated muscle glucose uptake in B.','Relate lower uptake to higher or more persistent post-meal blood glucose.','Predict compensatory additional insulin secretion while beta cells remain responsive.'),
  water:caseOf('17.3','During water deprivation, plasma becomes more concentrated and circulating ADH increases. Explain where the hormone is made and released, and how its kidney effect restores water balance.',
    'Hypothalamic neurons synthesize ADH. It travels along their axons to the posterior pituitary for release. Increased collecting-duct water permeability promotes water reabsorption and conserves water.',
    'Locate ADH synthesis in hypothalamic neurons.','Locate release into blood from posterior pituitary axon terminals.','Explain increased collecting-duct water reabsorption or permeability and its water-conserving effect.'),
  pump:caseOf('19.4','At unchanged end-diastolic volume and heart rate, an intervention raises end-systolic volume. Explain the change in stroke volume, the change in cardiac output and why the two measurements track one another.',
    'Leaving more blood behind at the same starting volume reduces EDV minus ESV. Stroke volume falls. Since output is heart rate times stroke volume and heart rate is held fixed, output falls proportionally.',
    'Use the fixed end-diastolic volume and higher end-systolic volume to explain that less blood leaves per beat.','Predict reduced cardiac output.','Explain that output equals heart rate times stroke volume and heart rate stays fixed.'),
  retina:caseOf('14.1','Compare two eyes after moving from bright daylight to a dim room. One retina lacks functioning rods but retains cones. Explain which eye should detect faint movement sooner after adaptation, why, and which function cones can still support.',
    'The eye with functional rods can detect fainter light after adaptation because rods are more sensitive in dim conditions. Functioning cones still support color and high-acuity vision under adequate light.',
    'Predict better detection of faint stimuli in the eye with functional rods after dark adaptation.','Relate the result to high rod sensitivity at low light levels.','Identify preserved cone-supported color or fine detail under adequate light.')
};

const caseLists = [
  [[examWritingCases[12],examWritingCases[13]],[writtenCases[12],examWritingCases[14]],[writtenCases[14],cases.retina]],
  [[examWritingCases[15],examWritingCases[16]],[writtenCases[15],writtenCases[16]],[cases.autonomic,cases.pupil]],
  [[cases.thyroid,examWritingCases[17]],[cases.adrenal,writtenCases[17]],[cases.insulin,cases.water]],
  [[cases.pump,examWritingCases[18]],[examWritingCases[19],writtenCases[20]],[examWritingCases[20],writtenCases[18]]]
];

export function winterWritten(raw,objective,fixtures){
  const rubricId='winter-'+objective+'-v1';
  return {section:raw.section,type:'written',objective,prompt:raw.prompt,points:3,why:raw.example,
    rubric:{id:rubricId,version:'1',criteria:raw.rubric.map((description,i)=>({id:'c'+(i+1),label:description,description,points:1})),...(fixtures?{fixtures}:{})}};
}
const pumpFixtures=[
  ['full',cases.pump.example,[1,1,1]],
  ['partial','Output falls. I do not know the formula or what changes per beat.',[0,1,0]],
  ['opposite','The heart ejects more blood per beat and cardiac output rises.',[0,0,0]],
  ['no-recall','I cannot recall the relationship.',[0,0,0]]
].map(([id,response,points])=>({id,response,expectedPoints:Object.fromEntries(points.map((p,i)=>['c'+(i+1),p]))}));
export function unitWinterWriting(unit,f){
  return caseLists[unit][f].map((q,i)=>winterWritten(q,'u'+(unit+1)+'-'+q.section+'-'+f+'-'+i,q===cases.pump?pumpFixtures:null));
}
