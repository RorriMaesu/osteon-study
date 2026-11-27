import {choice,term} from './term-mock-winter-stations.js';

// Each replacement changes the evidence or task itself. Some diagrams and
// experimental themes intentionally recur across forms with different trials.
const trials=[
  // unit, form, slot, section, evidence title, first observation, second observation,
  // interpretation, distractor, prediction or relationship, alternatives, rationale
  [1,'B',7,'13.4','Read a dye-tracing record in a spinal nerve.','Somata labeled','Outside the cord in a dorsal root ganglion','Central processes enter','Dorsal horn',
   'Which cells took up the dye?','Primary sensory neurons','Somatic motor neurons','Which direction do impulses normally travel in their central branches?','Toward the spinal cord','From ventral horn to skeletal muscle','Dorsal root ganglia house primary afferent cell bodies. Their central branches enter the cord.'],
  [1,'C',0,'12.4','Compare two stimuli delivered during recovery from an action potential.','First interval','No second spike even with strong stimulus','Later interval','A stronger-than-usual stimulus produces a spike',
   'What describes the first interval?','Absolute refractory period','Relative refractory period','What supports the eventual return of excitability?','Recovery of voltage-gated sodium channels from inactivation','Permanent closure of sodium channels','Sodium-channel inactivation prevents immediate re-excitation. As recovery proceeds a stronger stimulus may evoke a spike.'],
  [1,'C',1,'13.3','Follow ventricular tracer across a model obstruction.','Tracer inside fourth ventricle','Present','Tracer in subarachnoid space','Absent despite ongoing CSF production',
   'Which exit should be examined?','Fourth-ventricle apertures','Interventricular foramen only','Why is a complete aqueduct block less consistent?','Tracer has already reached the fourth ventricle from upstream','Subarachnoid CSF is produced only in veins','The median and lateral apertures carry CSF from the fourth ventricle to the subarachnoid space.'],
  [1,'C',2,'14.2','Compare the route of signals from a pinprick on the right foot.','Modality','Nociception','Signal relay','Dorsal horn near entry',
   'On which side does the long ascending anterolateral route principally run?','Left','Right','Where do the second-order fibers usually cross?','Spinal cord near entry','After reaching the cerebral cortex','The pathway for body pain crosses in the spinal cord before ascending contralaterally.'],
  [1,'C',5,'14.2','Locate the cortical destination of a stimulus on a right index fingertip.','Touch detection','Preserved','Cortical processing under study','Discriminative touch',
   'Which cortical hemisphere predominantly represents this fingertip?','Left','Right','Which gyrus contains primary somatosensory cortex?','Postcentral gyrus','Precentral gyrus','Contralateral postcentral cortex receives somatosensory information through thalamic relays.'],
  [1,'C',7,'13.2','Compare gray matter and white matter on a spinal section.','Area X','Central butterfly-shaped tissue','Area Y','Outer columns',
   'Which area contains anterior horn motor cell bodies?','X','Y','Which contains the principal long ascending and descending axon tracts?','Y','X','Spinal gray matter includes horn cell bodies. White columns carry long axonal pathways.'],
  [2,'B',3,'15.2','Volume loading briefly raises carotid sinus pressure.','Wall stretch','Above baseline','Brainstem integration','Intact',
   'What happens first to sinus afferent firing?','It increases','It decreases','Which cardiac response helps correct the rise?','Higher vagal drive slows the pacemaker','Higher sympathetic drive accelerates the pacemaker','Increased arterial stretch increases afferent discharge and promotes a compensating reduction in cardiac drive.'],
  [2,'B',6,'16.4','Compare contraction during two stimulation trials.','Stimulate intact muscle directly','Contraction','Stimulate interrupted peripheral motor nerve upstream','No contraction',
   'Which component can still respond?','The muscle tissue','The interrupted axon conducts across the block','What is predicted for the associated reflex?','Weak or absent contraction','Exaggerated contraction solely because the motor axon is interrupted','Interrupting the final motor pathway can eliminate reflex output while the muscle remains directly excitable.'],
  [2,'B',7,'16.5','Compare a finger-to-target task under controlled conditions.','Vision and strength','Adequate','Hand path','Oscillation increases near the visible endpoint',
   'Which finding is described?','Intention tremor','Rest-only tremor','Which control matters when inferring coordination difficulty?','Verify adequate sensory information and power','Assume weakness never affects reaching','Increasing oscillation near a target is an intention tremor. Sensory and strength checks improve interpretation.'],
  [2,'C',0,'15.1','Trace two autonomic outputs ending on different targets.','Route A','One ganglionic relay followed by an axon to an arteriole','Route B','Preganglionic fiber directly contacts chromaffin cells',
   'What tissue ends route B?','Adrenal medulla','Adrenal cortex','Which signal leaves that tissue for distant targets?','Catecholamines in blood','An axon entering every target','Adrenal chromaffin cells are modified sympathetic postganglionic cells that release circulating catecholamines.'],
  [2,'C',1,'16.3','Compare two eye-movement observations.','With a target at center','Both eyes aligned','Attempted right gaze','Right eye cannot abduct; left eye adducts',
   'Which muscle action is deficient?','Right lateral rectus','Left medial rectus','Which cranial nerve normally drives the deficient action?','Right abducens','Right optic','Lateral rectus abducts the eye and is innervated by CN VI.'],
  [2,'C',2,'16.3','Read both rows of a new pupil examination.','Illuminate left eye','Only left pupil constricts','Illuminate right eye','Only left pupil constricts',
   'Which output deserves attention first?','Right pupillary efferent pathway','Left retinal input','Which finding shows that right-eye afferents can initiate the response?','Left pupil constricts when right eye is illuminated','Right pupil stays large on both trials','The defect follows the responding eye. Both stimulated eyes can supply input to the working left effector.'],
  [2,'C',3,'15.2','Analyze a temperature-control loop.','Thermoreceptors','Report rising body temperature','Sweat glands and skin vessels','Functional',
   'Which effect supports evaporative cooling?','Greater eccrine secretion','Complete cessation of sweat','Which vascular change facilitates heat transfer to skin?','Increased cutaneous blood flow','Reduced cutaneous blood flow','Evaporating sweat removes heat. Greater skin blood flow carries internal heat toward the surface.'],
  [2,'C',6,'16.4','Compare two sensory examinations below a focal cord injury.','Vibration and position','Poor on the right','Pinprick','Relatively preserved',
   'Which spinal pathway should be examined first?','Right dorsal column','Left ventral root','Which pathway can support the preserved pinprick report?','Anterolateral system','Corticospinal tract','Body vibration and joint position travel in dorsal columns. Pain and temperature use anterolateral pathways.'],
  [2,'C',7,'16.5','Observe rapid alternating hand movement.','Power','Adequate in both directions','Rapid pronation/supination','Irregular timing and poor alternation',
   'Which deficit best fits?','Dysdiadochokinesia','Aphasia','What would a finger-to-nose trial add?','A check of endpoint accuracy','A direct measure of hearing threshold','Alternating rhythm and target accuracy probe distinct aspects of coordination.'],
  [3,'B',4,'17.2','Apply a lipid-soluble hormone to two otherwise matched cell cultures.','Culture A','Intracellular receptor present; target mRNA rises','Culture B','Receptor absent; target mRNA unchanged',
   'Which mechanism is supported?','Receptor-dependent control of transcription','Identical gene expression in every cell','Which measurement most directly tests the proposed transcriptional response?','Target mRNA after exposure','Number of capillaries surrounding the incubator','Response depends on functional receptors and may be measured at the level of target transcripts.'],
  [3,'B',5,'17.3','Compare two routes from hypothalamus to pituitary.','Route X','Capillary bed → portal vessel → capillary bed','Route Y','Axonal transport to nerve terminals',
   'Which route normally delivers hypothalamic TRH?','X','Y','Which route normally carries newly synthesized oxytocin?','Y','X','Releasing hormones enter the portal vessels. Oxytocin travels in axons to the posterior lobe.'],
  [3,'B',6,'17.6','A selective experimental block removes aldosterone synthesis while circulating cortisol stays normal.','Urinary sodium','Increased at the same intake','Urinary potassium secretion','Reduced',
   'Which gland region normally supplies the missing hormone?','Zona glomerulosa','Adrenal medulla','Which action normally supports extracellular volume?','Distal nephron sodium reabsorption','Complete inhibition of sodium reabsorption','Aldosterone from zona glomerulosa promotes sodium reabsorption and potassium secretion.'],
  [3,'B',7,'17.10','Measure the endocrine response to increased atrial filling.','Atrial wall stretch','Increased','Sodium excretion','Increases afterward',
   'Which signal best links the findings?','ANP','Erythropoietin','Which consequence helps oppose excess filling?','Renal sodium and water loss','Permanent retention of both','Atrial natriuretic peptide promotes excretion, helping oppose volume expansion.'],
  [3,'C',0,'17.4','Examine responses to an external source of thyroid hormone.','Free T4','Higher than baseline','Pituitary secretion','TSH falls',
   'Which feedback relation fits?','Higher thyroid hormone suppresses TSH drive','Higher thyroid hormone stimulates more TSH regardless of concentration','Which gland ordinarily secretes the measured TSH?','Anterior pituitary','Thyroid follicle','Circulating thyroid hormone feeds back on the hypothalamic-pituitary axis.'],
  [3,'C',2,'17.5','Assess feedback during experimentally elevated PTH despite high calcium.','Extracellular calcium','Above reference','PTH','Also above reference',
   'Why is this combination unexpected under normal calcium feedback?','High calcium normally suppresses PTH','High calcium normally stimulates PTH','Which tissue is a direct target for PTH-mediated calcium conservation?','Kidney','Pineal gland','Parathyroid feedback normally moves PTH opposite to calcium. Renal calcium retention is among its effects.'],
  [3,'C',3,'17.9','Compare normal and reduced insulin responsiveness after the same glucose input.','Insulin concentration','Equal in both groups','Skeletal muscle glucose uptake','Lower in group B',
   'Which explanation is supported?','Reduced tissue responsiveness in B','Increased insulin sensitivity in B','Which change could compensate initially if beta cells remain effective?','Increased insulin secretion','Complete cessation of beta-cell secretion','A weaker response at equal exposure indicates reduced sensitivity; beta cells may compensate with additional insulin.'],
  [3,'C',4,'17.2','Apply two equal hormone pulses to otherwise matched cells.','Cells chronically exposed beforehand','Fewer surface receptors','Control cells','Baseline receptor count',
   'What is the receptor change called?','Down-regulation','Up-regulation','At equal hormone concentration, which result is plausible?','Reduced sensitivity in chronically exposed cells','Identical responses required by equal dose','Target-cell sensitivity can change as the number of functional receptors changes.'],
  [3,'C',5,'17.3','Compare the responses to stalk compression and direct administration of a posterior pituitary peptide.','Release from posterior lobe','Reduced','Kidney response to supplied hormone','Preserved',
   'Which hormone can account for the renal response?','ADH','TSH','Which observation separates release failure from complete target resistance?','The kidney responds to directly supplied hormone','Hormone release falls during compression','Bypassing deficient release permits an intact target to respond.'],
  [3,'C',6,'17.6','Trace a response after ACTH increases.','Adrenal product X','Rises in response to ACTH','Product X restored experimentally','Pituitary ACTH falls',
   'Which product fits the axis?','Cortisol','Atrial natriuretic peptide','What mechanism produces the final ACTH fall?','Negative feedback','Positive feedback','Cortisol normally inhibits upstream CRH and ACTH drive.'],
  [3,'C',7,'17.10','A meal delivers acidic chyme to the duodenum.','Local pH','Falls','Pancreatic duct secretion','Becomes bicarbonate-rich',
   'Which intestinal signal helps link these events?','Secretin','Melatonin','Which property of the secretion protects the lumen?','It buffers acid','It increases acidity further','Secretin promotes pancreatic bicarbonate release; buffering helps neutralize acidic chyme.'],
  [4,'B',7,'20.6','Follow fetal blood across an opening between the atria.','Tracer location first','Right atrium','Tracer location next','Left atrium without traversing pulmonary capillaries',
   'Which shunt does this record isolate?','Foramen ovale','Ductus venosus','Which downstream chamber normally receives blood directly from the left atrium?','Left ventricle','Right ventricle','The fetal foramen ovale allows flow from the right atrium to the left atrium.'],
  [4,'C',1,'19.2','Compare an ECG and aortic pressure during one beat.','QRS complex','Immediately precedes ventricular pressure rise','Aortic pressure initially','Above ventricular pressure',
   'What electrical event does QRS primarily reflect?','Ventricular depolarization','Atrial depolarization','Why does ejection not have to begin exactly at QRS onset?','The ventricle must generate sufficient pressure to open the aortic valve','The ECG directly measures ejected blood volume','Electrical activation precedes contraction, and ejection requires a favorable pressure gradient.'],
  [4,'C',2,'20.1','Compare vessel walls of similar external diameter.','Specimen A','Thin wall, irregular lumen, valve cusps','Specimen B','Thick smooth-muscle media, round lumen',
   'Which specimen most likely represents a peripheral vein?','A','B','What is the role of the visible cusps?','Limit reverse flow','Initiate cardiac action potentials','Veins may contain valves that support return, while muscular arteries have thicker media.'],
  [4,'C',4,'19.3','Read an early relaxation interval before ventricular filling.','Aortic pressure','82 mmHg','Ventricular and atrial pressures','Ventricle 38 mmHg and falling; atrium 8 mmHg',
   'Which pair of valve states fits?','Aortic and mitral both closed','Aortic and mitral both open','What change normally permits filling to begin?','Ventricular pressure falls below atrial pressure','Ventricular pressure rises above aortic pressure','Isovolumetric relaxation precedes atrioventricular opening as ventricular pressure falls.'],
  [4,'C',7,'20.6','Trace fetal blood bypassing much of the pulmonary circulation.','Initial vessel','Pulmonary trunk','Next vessel','Descending aorta through a short channel',
   'Which channel fits?','Ductus arteriosus','Ductus venosus','What normally happens to this channel after the transition to air breathing?','It functionally closes','It becomes the umbilical vein','The fetal ductus arteriosus joins pulmonary outflow to the aorta and normally closes after birth.']
];
const termTrials=[
  [1,'B',1,'13.3','Trace CSF from a fourth ventricle into venous circulation.','Space receiving CSF through the median and lateral apertures','subarachnoid space','Structures conventionally described as returning CSF to dural venous sinuses','arachnoid granulations','arachnoid villi'],
  [1,'B',2,'14.1','Name the special-sense organs by their stimulus.','Spiral organ containing auditory hair cells','organ of Corti','Inner-ear sac sensing predominantly horizontal linear acceleration with the head upright','utricle','spiral organ'],
  [1,'B',3,'12.1','Name the collections of neuronal cell bodies.','A collection outside the CNS','ganglion','A collection inside the CNS','nucleus'],
  [1,'C',1,'13.3','Identify the CSF-producing structure and its epithelial cells.','Vascular tufts producing most CSF within ventricles','choroid plexus','Specialized glial cell type forming its secretory epithelium','ependymal cells','ependymal cell'],
  [1,'C',2,'14.1','Identify the retinal photoreceptor best suited to each task.','Very dim-light detection','rods','High-acuity daylight color vision','cones'],
  [1,'C',3,'12.1','Name axon bundles by compartment.','A bundle running entirely within the CNS','tract','A bundle outside the CNS','nerve'],
  [2,'B',1,'15.1','Name the principal transmitters at these two sympathetic synapses.','Within an ordinary sympathetic ganglion','acetylcholine','At most sympathetic postganglionic adrenergic cardiac terminals','norepinephrine'],
  [2,'B',2,'16.3','Name the nerves supplying two eye muscles.','Lateral rectus','abducens nerve','Superior oblique','trochlear nerve'],
  [2,'B',3,'16.5','Name two examination findings.','Rhythmic oscillation that becomes prominent near a target','intention tremor','General loss of coordinated movement','ataxia'],
  [2,'C',1,'15.1','Name the origin divisions of the autonomic nervous system.','Thoracolumbar outflow','sympathetic','Craniosacral outflow','parasympathetic'],
  [2,'C',2,'16.3','Name the motor nerves for two examination actions.','Tongue protrusion','hypoglossal nerve','Shoulder shrug against resistance','accessory nerve'],
  [2,'C',3,'16.2','Name the memory loss pattern.','Cannot form new lasting episodic memories','anterograde amnesia','Cannot recall events preceding the injury','retrograde amnesia'],
  [3,'B',1,'17.3','Name the hypothalamic releasing signals.','Signal that stimulates pituitary ACTH secretion','CRH','Signal that stimulates pituitary TSH secretion','TRH'],
  [3,'B',2,'17.9','Identify the islet hormones by their effect on liver metabolism.','Favors increased hepatic glycogen storage after a meal','insulin','Favors hepatic glucose release during a fast','glucagon'],
  [3,'C',1,'17.3','Name the posterior pituitary products by effect.','Promotes collecting-duct water reabsorption','ADH','Causes milk ejection','oxytocin'],
  [3,'C',2,'17.9','Name an endocrine and an exocrine pancreatic structure.','Cell clusters releasing insulin into blood','pancreatic islets','Secretory structures producing digestive enzymes','acini'],
  [3,'C',3,'17.6','Identify each adrenal product.','Mineralocorticoid that promotes sodium reabsorption','aldosterone','Main human glucocorticoid','cortisol'],
  [4,'B',2,'19.1','Name the valves along the left-heart route.','Between pulmonary venous inflow chamber and left ventricle','mitral valve','Between left ventricle and ascending aorta','aortic valve'],
  [4,'B',3,'18.5','Name the protease and substrate producing the fibrin mesh.','Active protease that cleaves fibrinogen','thrombin','Soluble precursor of fibrin','fibrinogen'],
  [4,'C',2,'19.2','Name the structures normally initiating and delaying the cardiac impulse.','Primary pacemaker in the right atrium','sinoatrial node','Node delaying atrial-to-ventricular conduction','atrioventricular node'],
  [4,'C',3,'18.2','Name the cell lineage stages.','Large marrow cell giving rise to platelets','megakaryocyte','Immature circulating erythrocyte with residual RNA','reticulocyte']
];
const aliases={
  'arachnoid granulations':['arachnoid villi'],'organ of Corti':['spiral organ'],'ependymal cells':['ependymal cell','ependymocytes'],
  rods:['rod','rod cells'],cones:['cone','cone cells'],acetylcholine:['ACh'],norepinephrine:['noradrenaline','NE'],
  'abducens nerve':['abducens','CN VI','cranial nerve VI'],'trochlear nerve':['trochlear','CN IV','cranial nerve IV'],
  'hypoglossal nerve':['hypoglossal','CN XII','cranial nerve XII'],'accessory nerve':['accessory','spinal accessory nerve','CN XI','cranial nerve XI'],
  CRH:['corticotropin-releasing hormone','corticotrophin-releasing hormone'],TRH:['thyrotropin-releasing hormone'],
  ADH:['antidiuretic hormone','vasopressin'],'pancreatic islets':['islets of Langerhans','islets'],acini:['pancreatic acini','acinus','acinar tissue'],
  'mitral valve':['bicuspid valve','left atrioventricular valve','mitral'],'aortic valve':['aortic semilunar valve','aortic'],
  'sinoatrial node':['SA node','sinus node'],'atrioventricular node':['AV node']
};
export function varyStations(group,unit,form){
  for(const [u,f,slot,section,prompt,l1,v1,l2,v2,p1,r1,w1,p2,r2,w2,why] of trials){
    if(u!==unit||f!==form)continue;
    group.evidence[slot]={...group.evidence[slot],section,prompt,why,
      stimulus:{columns:['Record','Observation'],rows:[[l1,v1],[l2,v2]]},
      parts:[choice(p1,r1,w1),choice(p2,r2,w2)]};
  }
  for(const [u,f,slot,section,prompt,p1,r1,p2,r2] of termTrials){
    if(u!==unit||f!==form)continue;
    group.short[slot]={...group.short[slot],section,prompt,stimulus:null,
      objective:'terms-'+section+'-'+r1.toLowerCase().replace(/\W+/g,'-'),
      parts:[term(p1,r1,aliases[r1]||[]),term(p2,r2,aliases[r2]||[])],why:p1+' — '+r1+'. '+p2+' — '+r2+'.'};
  }
  return group;
}
