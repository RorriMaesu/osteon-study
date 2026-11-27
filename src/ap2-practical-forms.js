const task = (prompt, answer) => ({prompt, answer});
const surface = (label, mesh, clue) => ({label, mesh, clue});
const neural = 'assets/ap2-neuro/SOURCES.md';
const gland = 'assets/ap2-glands/SOURCES.md';

export const additionalStations = [
  {
    id:'bouton', title:'Terminal and receiving membrane', section:'12.5', lesson:'12.5/activity/chemical-synapse',
    asset:'ap2-neuro/chemical-synapse', direction:[.21,.15,1], credit:'Osteon microscopic teaching model', source:neural,
    context:['Presynaptic_terminal','Postsynaptic_membrane'],
    parts:[
      surface('Voltage-gated calcium channels','Voltage-gated_calcium_channels','Pores in the membrane facing the cleft from above.'),
      surface('Synaptic vesicles','Synaptic_vesicles','Round membrane-bound sacs inside the upper terminal.'),
      surface('Transmitter molecules','Neurotransmitter','Small particles between the two membranes.'),
      surface('Ligand-gated receptors','Ligand-gated_receptors','Pores projecting from the receiving membrane.')
    ],
    tasks:[task('Select the channels opened by depolarization of the presynaptic terminal.',0),task('Select the structures whose fusion is triggered by calcium entering here.',1)],
    question:'The same action potential arrives, but the presynaptic calcium channels are blocked. What changes first?',
    options:['Fewer vesicles release transmitter.','More postsynaptic receptors open.','Axonal spikes double in amplitude.'],
    why:'The arriving spike opens calcium channels. Calcium entering the bouton triggers vesicle fusion and transmitter release.'
  },
  {
    id:'enteric', title:'Opened intestinal wall', section:'15.2', lesson:'15.2/activity/enteric-wall',
    asset:'ap2-neuro/enteric-wall', direction:[.14,.64,1], credit:'Osteon intestinal wall cutaway', source:neural,
    context:['submucosa','serosa'],
    parts:[
      surface('Myenteric plexus','myenteric_plexus','A network along the interface between two muscle layers.'),
      surface('Circular muscle','circular_muscle','Inner band of smooth muscle, its fibers running around the bowel.'),
      surface('Longitudinal muscle','longitudinal_muscle','Outer band with fibers running along the bowel.'),
      surface('Submucosal plexus','submucosal_plexus','Network in connective tissue closer to the lumen.')
    ],
    tasks:[task('Select the enteric plexus between the two muscle layers.',0),task('Follow local motor output to the muscle that narrows the lumen.',1)],
    question:'A segment retains intact enteric circuits after its central connections are interrupted. Which response can persist?',
    options:['A local stretch stimulus can recruit peristaltic contractions.','A vagovagal reflex can still reach the medulla.','Voluntary commands can reach gut muscle through somatic motor axons.'],
    why:'Intrinsic sensory neurons, interneurons and motor neurons can coordinate a short reflex within the gut wall.'
  },
  {
    id:'cranial', title:'Nerves at the base of the brain', section:'16.3', lesson:'16.3/activity/cranial-nerves',
    asset:'ap2-neuro/cranial-nerves', direction:[.14,-.80,.55], credit:'Regional cranial nerves · Z-Anatomy', source:neural,
    context:['region_Brainstem'],
    parts:[
      surface('Optic nerve (II)','region_Optic_nerve_(II)','Anterior paired visual pathway leading toward the chiasm.'),
      surface('Oculomotor nerve (III)','region_Oculomotor_nerve_(III)','Paired nerve emerging from the ventral midbrain.'),
      surface('Abducens nerve (VI)','region_Abducens_nerve_(VI)','Thin nerve emerging near the midline at the pontomedullary junction.'),
      surface('Vestibulocochlear nerve (VIII)','region_Vestibulocochlear_nerve_(VIII)','Nerve entering the lateral brainstem near the junction of pons and medulla.')
    ],
    tasks:[task('Light in one eye fails to drive either pupil, but illumination of the other eye constricts both. Select the nerve carrying the impaired input.',0),task('Trace the outgoing pupillary constriction signal from the midbrain. Which displayed nerve carries it?',1)],
    question:'If only the right oculomotor parasympathetic fibers stop conducting, what happens when the left eye receives light?',
    options:['The left pupil constricts and the right pupil fails to constrict.','Both pupils fail to constrict.','Only the right pupil constricts.'],
    why:'Optic afferents provide the light signal. Each pupil needs its own oculomotor parasympathetic output to constrict.'
  },
  {
    id:'marrow', title:'Red marrow space', section:'18.2', lesson:'18.2/activity/marrow',
    asset:'ap2-glands/marrow-section', direction:[.12,.15,1], credit:'Osteon marrow teaching preparation', source:gland,
    context:['trabeculae'],
    parts:[
      surface('Megakaryocyte',['megakaryocyte','megakaryocyte_nucleus'],'Large cell with a lobulated nucleus beside the vascular channel.'),
      surface('Sinusoid','sinusoid','Broad vascular channel through the marrow space.'),
      surface('Erythroid precursors',['erythroid_cells','erythroid_nuclei'],'Cluster of small developing cells surrounding a larger central cell.'),
      surface('Central macrophage','macrophage','Larger supporting cell in the center of a cluster of small precursor cells.')
    ],
    tasks:[task('Select the cell that sheds platelets.',0),task('Follow the platelets to the vascular channel through which they enter the blood.',1)],
    question:'If platelet production falls while existing platelets are cleared normally, which function is most directly affected?',
    options:['Formation of the initial platelet plug.','Hemoglobin transport of oxygen.','Antibody secretion by plasma cells.'],
    why:'Megakaryocytes release platelet fragments into marrow sinusoids. Platelets adhere and aggregate at a vascular injury.'
  }
];

const pituitary = {
  title:'Two routes from the hypothalamus', section:'17.3', lesson:'17.3/activity/pituitary-pathways',
  asset:'ap2-glands/pituitary-pathways', direction:[.12,.02,1], credit:'Osteon pituitary pathway cutaway', source:gland,
  context:['hypothalamus','anterior_lobe','posterior_lobe'],
  parts:[
    surface('Hypophyseal portal veins','portal_veins','Vessels connecting two capillary beds along the stalk.'),
    surface('Hypothalamic axons','neurosecretory_axons','Long fibers descending to terminals in the posterior lobe.'),
    surface('Secondary capillary plexus','secondary_plexus','Vascular network inside the anterior lobe.'),
    surface('Posterior axon terminals','axon_terminals','Expanded neural endings beside vessels in the posterior lobe.')
  ],
  tasks:[task('Select the vessels carrying releasing hormones from the first capillary bed to the anterior pituitary.',0),task('Switch to the posterior route. Select the fibers that carry newly made ADH down the stalk.',1)],
  question:'Portal flow remains intact, but action potentials fail to reach the posterior terminals. Which response falls immediately?',
  options:['Stimulated ADH release into posterior pituitary blood.','Delivery of TRH through portal veins.','Synthesis of every anterior pituitary hormone.'],
  why:'Anterior pituitary regulation uses portal blood. Hypothalamic axons deliver ADH to posterior terminals, where impulses trigger its release.'
};

function alternate(first, second, question, options, why, direction) {
  return {tasks:[task(...first),task(...second)],question,options,why,...(direction?{direction}:{})};
}
const alternatives = {
  neck:pituitary,
  cord:alternate(['Select the root that carries axons out of the anterior cord.',2],['Follow these fibers past their junction with sensory fibers. Select the mixed segment.',3],
    'A focal lesion of this mixed segment can impair which fibers?', ['Both sensory and motor fibers at this level.','Only descending fibers inside the cord.','Only dorsal horn interneurons.'],'Dorsal sensory and ventral motor roots join in the short spinal nerve.'),
  ossicles:alternate(['Start at the eardrum. Select the bone whose handle is attached to it.',0],['Select the next bone to receive vibration from that handle.',1],
    'Which subsequent movement transfers this vibration to inner-ear fluid?', ['The stapes footplate moves at the oval window.','The malleus displaces the round window directly.','The incus pulls the auditory nerve.'],'The tympanic membrane moves the malleus, incus and stapes in sequence. The stapes acts on the oval window.',[-.65,.22,.85]),
  csf:alternate(['Select the paired cavities inside the hemispheres.',0],['Trace fluid through an interventricular foramen and select the next cavity.',1],
    'An isolated block at the right interventricular foramen first traps CSF where?', ['In the right lateral ventricle.','In the fourth ventricle.','In both subarachnoid spaces.'],'Each lateral ventricle drains through its own interventricular foramen into the third ventricle.'),
  adrenal:alternate(['Select the left kidney.',3],['Follow its superior medial border and select the neighboring endocrine gland.',1],
    'Sympathetic preganglionic fibers excite the medulla of this gland. What enters the blood?', ['Catecholamines.','Parathyroid hormone.','Thyroid hormone.'],'Adrenal medullary chromaffin cells release catecholamines when activated by sympathetic preganglionic fibers.'),
  heart:alternate(['Select the right atrioventricular valve.',1],['Trace blood through the right ventricle. Select the valve at its arterial outlet.',4],
    'If the right atrioventricular valve fails to close, where can blood flow during systole?', ['Right ventricle into right atrium.','Right atrium into left atrium through the aorta.','Pulmonary trunk into left atrium.'],'The tricuspid valve guards the right atrioventricular opening. Systolic ventricular pressure drives regurgitation across an incompetent valve.'),
  pulmonary:alternate(['Select the branch carrying blood toward the left lung.',2],['Select the superior vessel carrying blood away from that lung after gas exchange.',4],
    'Which change would usually occur as this blood moves through the lung capillaries?', ['Hemoglobin oxygen saturation increases.','Carbon dioxide content increases.','Oxygen is consumed exclusively by erythrocytes.'],'The left pulmonary artery carries blood to the lung. Pulmonary veins return blood after gas exchange.'),
  leg:alternate(['Select the artery behind the right knee.',1],['Trace the branch heading into the posterior leg compartment.',3],
    'A pulse just posterior to the medial malleolus samples which pathway?', ['The posterior tibial artery.','The anterior tibial artery after crossing the ankle.','The femoral artery before the adductor hiatus.'],'The posterior tibial artery descends in the posterior leg and passes behind the medial malleolus.'),
  bouton:alternate(['Select the particles crossing the cleft after vesicle fusion.',2],['Follow the particles to the proteins they bind on the receiving membrane.',3],
    'The presynaptic terminal releases its usual amount, but these receptors cannot open. What falls?', ['The postsynaptic ligand-gated current.','Calcium influx for the already completed release.','The voltage amplitude of the arriving axonal spike.'],'Ligand-gated receptors change postsynaptic conductance when transmitter binds.'),
  enteric:alternate(['Select the plexus closest to the submucosa.',3],['Find the other plexus, situated between the muscle layers.',0],
    'Which pairing best matches these two networks?', ['Submucosal regulation of secretion and myenteric coordination of motility.','Submucosal vision and myenteric hearing.','Submucosal voluntary movement and myenteric memory.'],'The submucosal plexus helps regulate secretion and local flow. The myenteric plexus coordinates smooth-muscle activity.'),
  cranial:alternate(['One eye cannot abduct. Select the nerve supplying lateral rectus.',2],['A separate test of hearing finds reduced neural input from the inner ear. Select the nerve carrying this input.',3],
    'A lesion affects both sensory divisions of the second nerve. Which additional observation fits?', ['Disturbed equilibrium.','Loss of voluntary tongue protrusion.','Loss of smell alone.'],'CN VI innervates lateral rectus. CN VIII carries cochlear and vestibular input.'),
  marrow:alternate(['Select the group of developing red cells.',2],['Trace this island to the central cell that supports the precursors.',3],
    'After a sustained rise in erythropoietin with adequate iron, which circulating population should increase after several days?', ['Reticulocytes.','Megakaryocyte nuclei.','Marrow adipocytes.'],'Maturing erythroid precursors lose their nuclei and enter blood as reticulocytes. An increase can indicate greater marrow output.')
};

// Preserve the original station IDs so an in-progress practical reopens its original form.
export function alternateForm(station) {
  const changes=alternatives[station.id];
  return changes ? {...station,...changes,id:station.id+'-b'} : null;
}
