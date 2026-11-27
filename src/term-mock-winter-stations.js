import {bank} from './ap2-exam-core.js';

export {neural,autonomic,sourceFigure};
const pick = (variants, f) => variants[f];
export const choice = (prompt, right, ...others) => ({type:'choice',prompt,choices:[right,...others],answer:0});
export const term = (prompt, expected, aliases=[], opposites=[]) => ({type:'term',prompt,expected,aliases,opposites});
export const num = (prompt, expected, unit, tolerance=0) => ({type:'number',prompt,expected:String(expected),unit,tolerance});
const data = (columns, rows) => ({columns,rows:rows.map(row=>row.map(String))});
const measurements = rows => data(['Measurement','Observation'],rows);
const item = (section, objective, prompt, stimulus, parts, why) => ({section,objective,prompt,stimulus,parts,why,points:2});

const followUps = {
  'paired-recordings':choice('If the spacing stays constant and the delay doubles, what happens to speed?','It halves','It doubles','It stays constant'),
  'fluid-map':choice('Where should fluid from the affected space flow next?','Third ventricle','Fourth ventricle directly','Superior sagittal sinus directly'),
  'vibration-crossing':choice('Where do these fibers run in the spinal cord before crossing?','Ipsilateral dorsal column','Contralateral dorsal column','Ipsilateral ventral root'),
  'adrenal-branch':choice('How does this branch deliver its final signal?','Catecholamines travel in blood','A motor neuron releases ACh at a skeletal muscle','A sensory ending releases glutamate into CSF'),
  'pupil-matrix':choice('Which finding supports adequate sensory input from each eye?','An intact pupil responds to light presented to either eye','A single pupil fails to respond to stimulation of either eye','The illuminated eye always fails to constrict'),
  'paired-hormones':choice('Which anterior pituitary hormone normally stimulates thyroid follicular cells?','TSH','ACTH','TRH'),
  'valve-reopens':choice('What happens to ventricular volume as filling begins?','It rises','It falls','It remains at end-systolic volume throughout filling'),
  'pedal-circuit':choice('Which function belongs to this arterial route?','It supplies the dorsum of the foot','It drains the foot into the great saphenous vein','It empties directly into the right atrium'),
  'spike-slope':choice('Which change drives the sharp rising phase of this neuronal spike?','Increased sodium influx','Increased potassium efflux','Reduced sodium permeability alone'),
  'csf-channel':choice('Which cavity receives fluid immediately after this channel?','Fourth ventricle','Third ventricle','Lateral ventricle'),
  'crossing-site':choice('Where do most of these second-order fibers cross?','Medulla','Thoracic dorsal horn','Cerebellar cortex'),
  'relay-location':choice('Which receptor ordinarily receives the preganglionic signal in the ganglion?','Nicotinic cholinergic','Muscarinic cholinergic','Beta adrenergic'),
  'reaching-endpoints':choice('Which additional observation would most strengthen a coordination interpretation?','Normal power with repeated overshoot','Loss of all movement against gravity','An unseen target in every trial'),
  'follicle-lumen':choice('Which product depends on iodination of this extracellular precursor?','Thyroid hormones T3 and T4','Parathyroid hormone','Insulin'),
  'smear-fragments':choice('Which marrow cell sheds these fragments?','Megakaryocyte','Reticulocyte','Monocyte'),
  'ecg-bracket':choice('Which mechanical event ordinarily follows this electrical activation?','Ventricular contraction','Passive filling from atria only','Atrial depolarization'),
  'vessel-wall':choice('How does contraction of that smooth muscle affect lumen size?','It decreases lumen radius','It increases lumen radius','It removes the endothelium'),
};
const cellFunctions = {
  Basophil:'Release histamine during inflammatory responses',Eosinophil:'Contribute to defense against parasitic worms',
  Lymphocyte:'Include cells mediating antigen-specific immunity',Monocyte:'Give rise to macrophages in tissues',
  Neutrophil:'Phagocytose invading bacteria',Platelet:'Form the initial plug at injured vessel walls'
};
function sourceFigure(suffix){
  const original=bank.find(q=>q.type==='visual' && q.id.endsWith('-'+suffix));
  const first={type:'choice',prompt:original.prompt,choices:original.choices,answer:original.answer};
  const name=original.choices[original.answer];
  const follow=followUps[suffix] || choice('Which function matches the central formed element?',
    cellFunctions[name],...Object.values(cellFunctions).filter(v=>v!==cellFunctions[name]).slice(0,3));
  return item(original.section,suffix,'Interpret the specimen or recording and connect it to function.',original.stimulus,
    [first,follow],original.why+' '+follow.choices[follow.answer]+'.');
}

function neural(f){
  const axonDistance=[12,18,24][f], delay=[3,3,4][f],speed=axonDistance*10/delay;
  const side=['left','right','left'][f],other=side==='left'?'right':'left';
  const hearing=[['oval window','Stapes'],['malleus','Tympanic membrane'],['vestibulocochlear nerve','Cochlear hair cells']][f];
  const traces=[
    [['N1','0.4 mV'],['N1 + N2 simultaneously','1.1 mV']],
    [['N1 alone','0.6 mV'],['N1 + N3 simultaneously','1.4 mV']],
    [['N2 alone','0.3 mV'],['N2 + N4 simultaneously','0.9 mV']]
  ];
  const cells=[['Spinal white matter','Several neighboring axons','Oligodendrocyte'],['Forearm nerve','One internode on one axon','Schwann cell'],['Optic tract','Several neighboring axons','Oligodendrocyte']][f];
  return {
    evidence:[
      sourceFigure(pick(['spike-slope','paired-recordings','spike-slope'],f)),
      sourceFigure(pick(['fluid-map','csf-channel','fluid-map'],f)),
      sourceFigure(pick(['vibration-crossing','crossing-site','vibration-crossing'],f)),
      item('12.5','sum-inputs','Two converging excitatory inputs are tested at one postsynaptic neuron.',data(['Active input','Peak depolarization'],traces[f]),[
        choice('What type of integration explains the larger response?','Spatial summation','Temporal summation at one synapse','Absolute refractoriness'),
        choice('How could opening inhibitory channels near the axon initial segment alter firing?','It may reduce the chance of reaching threshold','It guarantees firing at threshold','It increases every spike amplitude')],
        'Simultaneous inputs at different sites can sum spatially. Inhibition near the trigger zone can reduce spike probability.'),
      item('12.2','myelin-source','Inspect the distribution of damaged internodes after the loss of one myelin-forming cell.',measurements([['Site',cells[0]],['Affected segments',cells[1]]]),[
        choice('Which cell best fits?',cells[2],cells[2]==='Schwann cell'?'Oligodendrocyte':'Schwann cell','Microglial cell'),
        choice('How should loss of this insulation affect conduction?','Slower conduction or local propagation failure','Faster conduction between nodes','Faster transmitter synthesis at every terminal')],
        cells[2]+' fits the compartment and internode pattern. Myelin limits current leakage between nodes.'),
      item('14.2','body-sensation-side','Trace a vibration signal before and after its first brainstem relay.',measurements([['Vibrating stimulus',side+' great toe'],['Modality','Conscious vibration']]),[
        choice('Which dorsal column carries the signal in the thoracic cord?',side,other,'Both sides equally at entry'),
        choice('Which medial lemniscus carries it above the crossing?',other,side,'Neither side')],
        'Large afferents ascend ipsilaterally. Second-order fibers cross in the medulla.'),
      item('14.1','hearing-route','A lab tracks sound transmission across the auditory apparatus.',measurements([['Downstream site',hearing[0]],['Stimulus',pick(['An airborne tone','A tuning-fork tone in air','A brief click'],f)]]),[
        choice('Which structure normally supplies the mechanical or sensory input to the listed site?',hearing[1],'Semicircular duct','Optic chiasm'),
        choice('How do cochlear hair cells encode motion of their bundles?','Bending changes ion-channel opening and membrane voltage','Bending shortens the auditory ossicles permanently','Every bundle directly emits a cortical action potential')],
        'The tympanic membrane drives the ossicles; the stapes moves the oval window. Hair-cell receptor potentials influence auditory afferents.'),
      item('13.2','spinal-root-record','Compare dorsal and ventral root stimulation in a teaching preparation.',data(['Root stimulated','Observed destination of normal signals'],[['R','Skeletal muscle'],['S','Spinal gray matter from skin']]),[
        choice('Which root is ventral?', 'R','S','Both'),
        choice('Which route normally carries a cutaneous signal to the spinal cord?','S','R','Neither')],
        'Motor efferents exit via ventral roots; sensory afferents enter dorsal roots.'),
    ],
    short:[
      item('12.4','axon-velocity','Compute propagation delay and speed for this axon.',measurements([['Distance',axonDistance+' cm'],['First peak','2 ms'],['Second peak',(2+delay)+' ms']]),[
        num('Transit delay (ms)',delay,'ms'),num('Conduction speed (m/s)',speed,'m/s')],'Speed is distance divided by the interval between peaks. Convert cm and ms before dividing.'),
      item('13.3','csf-route','Complete two missing steps along the ventricular route.',null,[
        term('Which passage takes CSF from the third to fourth ventricle?','cerebral aqueduct',['aqueduct of Sylvius','mesencephalic aqueduct']),
        term('From a lateral ventricle, which opening leads into the third ventricle?','interventricular foramen',['foramen of Monro','interventricular foramina'])],
        'The interventricular foramina connect lateral to third; the cerebral aqueduct connects third to fourth.'),
      item('14.1','sensory-receptors','Name the receptor class for each stimulus.',null,[
        term('Retinal rods and cones detect light.','photoreceptors',['photoreceptor']),
        term('Cochlear hair-cell bundles bend.','mechanoreceptors',['mechanoreceptor'])],
        'Photoreceptors transduce light and mechanoreceptors transduce deformation.'),
      item('12.1','afferent-efferent','Name each direction relative to the CNS.',null,[
        term('An impulse travels from skin to spinal cord.','afferent',['sensory','afferent signal'],['efferent']),
        term('An impulse travels from spinal cord to skeletal muscle.','efferent',['motor','somatic motor'],['afferent'])],
        'Afferent pathways carry signals toward the CNS and efferent pathways carry output away.'),
    ]
  };
}

function autonomic(f){
  const rate=[.60,.75,.50][f],start=[75,65,95][f];
  const bad=['left','right','left'][f], good=bad==='left'?'right':'left';
  const phase=pick(['standing abruptly','a brief loss of circulating fluid','a sudden fall in cardiac output'],f);
  const receptor=pick(['heart pacemaker','lacrimal gland','salivary gland'],f);
  const finding=pick([['Word comprehension','Preserved'],['Naming familiar objects','Impaired'],['Repetition of spoken words','Impaired']],f);
  return {
    evidence:[
      sourceFigure(pick(['relay-location','adrenal-branch','relay-location'],f)),
      sourceFigure(pick(['pupil-matrix','reaching-endpoints','pupil-matrix'],f)),
      item('16.3','paired-pupils','Interpret both stimulus trials in the simplified pupil reflex.',data(['Eye illuminated','Pupils constricting'],[[good,'Both eyes'],[bad,'Neither eye']]),[
        choice('Which input is least effective?',bad+' afferent input',good+' afferent input',bad+' efferent output'),
        choice('Which finding demonstrates that both output limbs can function?','Both pupils constrict on one trial','Neither pupil constricts on one trial','Only the illuminated pupil can respond')],
        'The deficit follows the illuminated eye. Both pupils constrict when the intact afferent input is used.'),
      item('15.2','pressure-reflex','Track the early compensation after '+phase+'.',measurements([['Arterial pressure','Falls below baseline'],['Baroreceptor stretch','Falls']]),[
        choice('How does arterial baroreceptor firing initially change?','Decreases','Increases','Becomes a somatic motor signal'),
        choice('Which efferent response helps restore pressure?','Increased sympathetic arteriolar tone','Increased cardiac vagal drive','Reduced arteriolar resistance')],
        'Reduced stretch reduces baroreceptor firing. Reflex sympathetic activation raises resistance and supports pressure.'),
      item('15.4','effector-receptor','A teaching compound acts selectively on a parasympathetic target.',measurements([['Target',receptor],['Ganglionic transmission','Normal'],['Response to ACh applied at target','Absent']]),[
        choice('Which effector receptor family is most directly implicated?','Muscarinic','Nicotinic at ganglia','Beta adrenergic'),
        choice('Why can transmission within the ganglion remain normal?','It uses a different cholinergic receptor family','It uses no neurotransmitter','Its second neuron is always somatic')],
        'Ganglionic signaling uses nicotinic ACh receptors; the specified parasympathetic effectors use muscarinic receptors.'),
      item('16.2','mental-status-control','Read the conditions of this language task before interpreting a deficit.',measurements([finding,['Hearing in test conditions','Unknown'],['Language used for testing','Second language']]),[
        choice('Which follow-up improves interpretation?','Verify hearing and test in a proficient language','Diagnose a lesion from this observation alone','Substitute limb strength for comprehension'),
        choice('What does testing immediate repetition before delayed recall help establish?','Whether the initial material registered','Whether limb position is intact','Whether pain pathways cross normally')],
        'Input quality and language proficiency affect performance; later recall also depends on initial registration.'),
      item('16.4','reflex-localization','Compare voluntary movement and reflexes below a chronic isolated motor pathway interruption.',data(['Finding','Observation'],[['Muscle tone','Increased'],['Tendon reflex','Exaggerated'],['Fine movement','Reduced']]),[
        choice('Which level is most consistent with the combination?','Descending upper motor pathway','Peripheral motor axon only','Neuromuscular junction only'),
        choice('What helps distinguish this from loss of the final motor axon?','Reflexes remain brisk','Weakness is present','Movement can be slow')],
        'Loss of descending control can leave segmental reflexes hyperactive. Loss of the final motor axon depresses its reflex.'),
      item('16.5','balance-evidence','Read the balance and position-sense observations together.',data(['Task','Observation'],[['Stance, eyes open','Stable'],['Stance, eyes closed','Marked sway'],['Great-toe position, eyes closed','Often misidentified']]),[
        choice('Which input had been compensating for an unreliable signal?','Vision','Olfaction','Taste'),
        choice('Which finding supports a proprioceptive contribution?','Incorrect toe-position reports','Ability to see the examiner','Normal speech alone')],
        'Closing the eyes removes visual compensation. Unreliable toe-position information supports a proprioceptive contribution.')
    ],
    short:[
      item('15.2','rate-from-interval','Compare baseline and reflex heart rates.',measurements([['Baseline rate',start+' beats/min'],['Beat interval during reflex',rate+' s']]),[
        num('New heart rate (beats/min)',60/rate,'beats/min'),num('Increase over baseline (beats/min)',60/rate-start,'beats/min')],
        'Divide 60 by the interval in seconds, then subtract the baseline rate.'),
      item('15.1','autonomic-chain','Identify the two autonomic neurons by their position.',null,[
        term('Neuron traveling from CNS to autonomic ganglion','preganglionic neuron',['preganglionic']),
        term('Neuron traveling from ganglion to target organ','postganglionic neuron',['postganglionic'])],
        'The ganglion lies between the preganglionic and postganglionic neurons.'),
      item('16.3','pupil-cranial','Name the cranial nerves of the pupillary light reflex.',null,[
        term('Nerve carrying light input toward the brainstem','optic nerve',['optic','CN II','cranial nerve II']),
        term('Nerve carrying preganglionic parasympathetic output to the ciliary ganglion','oculomotor nerve',['oculomotor','CN III','cranial nerve III'])],
        'The optic nerve carries sensory input; ocular parasympathetic efferents travel in the oculomotor nerve.'),
      item('16.5','movement-language','Name each observed movement finding.',null,[
        term('Repeated overshoot of an intended endpoint','dysmetria',['hypermetria']),
        term('Difficulty performing rapid alternating movements','dysdiadochokinesia',['dysdiadochokinesis','dysdiadokokinesia'])],
        'Dysmetria describes inaccurate movement distance. Rapid alternating movements test a different feature of coordination.')
    ]
  };
}
