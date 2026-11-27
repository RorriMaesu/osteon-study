// A single row may serve several exam items that test the same mechanism.
// Keys are the immutable original exam suffixes; reports retain their own grades.
const cases=new Map();
function chapterSection(section,rows){
  for(const [ids,prompt,right,b,c] of rows){
    for(const suffix of ids.split(' '))cases.set('ap2-'+section+'-'+suffix,{prompt,choices:[right,b,c],answer:0});
  }
}
chapterSection('12.1',[
  ['motor-exit','A nerve impulse travels from a ventral horn neuron to a muscle. Through which root does the impulse leave the cord?','Ventral root','Dorsal root','Both roots in succession'],
  ['ganglion-location','A microscopist moves from sensory neuron somas in a dorsal root ganglion to a collection of motor neuron somas in the brainstem. What term changes?','Ganglion becomes nucleus','Nerve becomes tract','White matter becomes myelin'],
  ['white-column','A label highlights ascending bundles surrounding the butterfly-shaped core of a spinal section. Which feature explains their pale appearance?','Lipid-rich myelin around many axons','Clusters of neuronal cell bodies','Fluid-filled cavities'],
  ['efferent-target','A command leaves the spinal cord to tighten a finger muscle. How should this connection be classified?','Somatic efferent','Visceral afferent','Autonomic efferent']
]);
chapterSection('12.2',[
  ['single-internode glial-comparison','In a cord section one cell sends extensions to internodes on several separate axons. How would a peripheral internode differ?','One myelinating Schwann cell supplies one internode','One astrocyte encloses the entire nerve','One oligodendrocyte extends along the entire peripheral nerve'],
  ['single-stalk','On a sensory neuron reconstruction, a short process from the soma splits into central and peripheral branches. Which drawing matches?','A T-shaped branch with the soma to the side','Dendrites and axon emerging from opposite poles','Many dendrites radiating around a motor soma'],
  ['buffering-glia','Potassium accumulates outside firing CNS neurons. Which neighboring glial cell normally helps stabilize that environment?','Astrocyte','Schwann cell','Ependymal cell']
]);
chapterSection('12.3',[
  ['reflex-branch integration','In a withdrawal diagram, the sensory neuron is firing but communication between spinal interneurons and motor neurons is interrupted. Which step failed?','Central integration and relay','Transduction in skin','Contraction of a stimulated muscle fiber'],
  ['warm-current afferent-order','A receptor converts indentation of the skin into a local electrical change before the first spike. What process is visible?','Sensory transduction','Motor output','Axonal myelination']
]);
chapterSection('12.4',[
  ['threshold-pair spike-frequency','Two sustained stimuli are both above threshold. The stronger one produces more spikes in one second in the same axon. What changed?','Frequency with similar spike amplitudes','Amplitude alone','The direction of propagation'],
  ['refractory-sodium','A membrane patch is just past its upstroke and many sodium gates are inactivated. What restores its ability to generate another spike?','Repolarization allows channels to recover','A second stimulus instantly removes inactivation','Sodium must leave through potassium channels'],
  ['nearer-equilibrium spike-slope','Opening more potassium channels while membrane voltage is above the potassium equilibrium potential produces which immediate tendency?','Potassium exits and voltage moves downward','Sodium enters and voltage rises','The membrane instantly loses all gradients'],
  ['paired-recordings axon-speed','An impulse passes electrodes 60 mm apart with a 4 ms delay. What is its conduction speed?','15 m/s','1.5 m/s','240 m/s']
]);
chapterSection('12.5',[
  ['two-inputs','Two different axon terminals each evoke a small potential in the same neuron. Their simultaneous activity reaches threshold. Which mechanism accounts for this?','Spatial summation','Temporal summation at one terminal','Axonal saltatory conduction'],
  ['dispersed-events summation','One bouton fires twice, but the second input arrives only after the first potential fully decays. Why is summation reduced?','The two postsynaptic potentials do not overlap in time','A second axon must always be present','The first potential becomes an action potential in the cleft'],
  ['synapse-calcium','A bouton depolarizes normally but its voltage-gated calcium channels cannot open. Which event immediately loses its trigger?','Fusion of transmitter vesicles','The postsynaptic cell making all its receptors','Myelin formation around the presynaptic axon'],
  ['transmitter-clearance','Release at a cholinergic synapse stays constant, but breakdown slows. Which change follows?','Acetylcholine can stimulate its receptors for longer','No acetylcholine enters the cleft','All receptors become voltage-gated']
]);
chapterSection('13.1',[
  ['fourth-derivative','A developmental tag stays in the lumen of the hindbrain while pons and cerebellum form around it. Which adult CSF space is tagged?','Fourth ventricle','Third ventricle','Cerebral aqueduct'],
  ['vesicle-derivative','A section through the embryonic third ventricle includes the tissue that will become the thalamus. Which secondary vesicle is sectioned?','Diencephalon','Telencephalon','Metencephalon'],
  ['midbrain-lumen','A dye stays inside the embryonic midbrain lumen while neighboring hindbrain tissue expands. Where would this dye lie in the adult?','Cerebral aqueduct','Fourth ventricular wall','Lateral ventricle'],
  ['forebrain-wall','A graft marks the wall of the telencephalic vesicle rather than its fluid space. Which adult structure could contain the graft?','Cerebral cortex','Cerebral aqueduct','Medulla'],
  ['crest-lineage','A developmental label marks migrating neural crest cells. Which peripheral structure can later carry the label?','Sensory ganglion','Ventricular ependyma of the spinal cord','Primary motor cortex']
]);
chapterSection('13.2',[
  ['dorsal-horn-input','A tracing marks the first spinal neurons receiving pain input from skin. In what part of the gray matter should their somas be concentrated?','Dorsal horn','Ventral motor horn','Anterior white commissure'],
  ['anterior-strip','A point lies just behind the central sulcus. Which function distinguishes it from the strip immediately in front?','Somatic sensory processing','Primary voluntary motor output','Generating CSF'],
  ['spinal-position','A cross-section shows two gray horns. Which comparison identifies the spinal motor output side?','Ventral horn contains somatic motor neuron cell bodies','Dorsal horn gives rise to all ventral root fibers','Ventral horn contains only incoming sensory terminals'],
  ['brainstem-level','A pin is between the pons and the spinal cord on the brainstem. Which structure is pinned?','Medulla oblongata','Thalamus','Midbrain']
]);
chapterSection('13.3',[
  ['one-foramen fluid-map','Dye injected into the left lateral ventricle cannot reach the third ventricle; dye from the right side can. Which connection best explains that asymmetry?','Left interventricular foramen','Cerebral aqueduct','Fourth-ventricle median aperture'],
  ['csf-exit csf-absorption','Fluid has exited the fourth ventricle and now surrounds the brain. What route returns it to dural venous blood in the textbook pathway?','Subarachnoid space to arachnoid granulations','Central canal to choroid plexus','Dural sinus to lateral ventricle'],
  ['csf-channel','A narrowing between the third and fourth ventricles restricts flow. Name the passage.','Cerebral aqueduct','Central sulcus','Interventricular foramen'],
  ['vertebral-confluence','A tracer passes from the paired vertebral arteries into a single artery along the ventral pons. Name it.','Basilar artery','Internal carotid artery','Superior sagittal sinus']
]);
chapterSection('13.4',[
  ['spinal-inventory','An inventory lists eight cervical, five lumbar, five sacral and one coccygeal spinal nerve pairs. How many thoracic pairs complete the count of 31?','12','11','13'],
  ['mixed-ramus','A tracer reaches the short spinal nerve immediately before the dorsal and ventral rami separate. Which description fits the spinal nerve and both rami?','They contain sensory and motor axons','They contain only sensory fibers','They contain motor neuron cell bodies'],
  ['bundle-layer','In a cut nerve, the sheath around a single fascicle is nicked while the outer covering of the whole nerve stays intact. Which layer was nicked?','Perineurium','Endoneurium','Epineurium'],
  ['tibial-sparing','The common fibular pathway is interrupted near the fibular neck while the tibial pathway works. Which motion is more likely to stay available?','Plantar flexion','Dorsiflexion','Toe extension'],
  ['plexus-mixing','A labeled cervical ventral ramus contributes fibers to more than one named nerve in the upper limb. Where did redistribution occur?','Brachial plexus','Dorsal root ganglion','Posterior median sulcus']
]);
chapterSection('14.1',[
  ['near-to-far near-focus','A student shifts gaze from a wall clock to small print nearby. Which change helps focus the print?','Less zonular tension and a rounder lens','More zonular tension and a flatter lens','A flatter lens from ciliary contraction'],
  ['elevator-start','A platform begins moving straight upward without rotation. Which receptor organ is especially positioned to signal vertical linear acceleration?','Saccule','Semicircular duct ampulla','Spiral organ'],
  ['retinal-light','A rod goes from darkness into light. In which direction do membrane voltage and glutamate release change?','Hyperpolarization and less glutamate','Depolarization and more glutamate','Hyperpolarization and more glutamate'],
  ['hearing-transduction','Movement of the cochlear partition deflects hair bundles. Where is mechanical displacement converted to a receptor potential?','Hair cells of the spiral organ','Tympanic cavity air','Ossicle articulations']
]);
chapterSection('14.2',[
  ['hemisphere-touch','Signals from the left index finger have crossed in the brainstem and relayed in the thalamus. Which cortical destination maps that finger?','Right postcentral gyrus','Left postcentral gyrus','Left precentral gyrus'],
  ['optic-tract visual-field','Signals from the left visual hemifield of both eyes have crossed the chiasm where appropriate. Where are they together?','Right optic tract','Left optic nerve','Left optic tract'],
  ['face-relay','Compare conscious touch from cheek and hand. Which thalamic relay is particularly associated with the cheek?','Ventral posteromedial nucleus','Ventral posterolateral nucleus','Medial geniculate nucleus'],
  ['vibration-crossing crossing-site','Vibration signals enter the cord from the right great toe. On which side are they in the thoracic dorsal column and then the medial lemniscus?','Right column then left lemniscus','Left column then right lemniscus','Left in both']
]);
chapterSection('14.3',[
  ['reflex-partner','During a knee jerk, contraction of the quadriceps is accompanied by a fall in hamstring activity. Which connection helps produce that fall?','An inhibitory spinal interneuron onto antagonist motor neurons','Inhibition of all spindle afferents','Direct excitatory input to hamstring motor neurons'],
  ['below-decussation','Corticospinal fibers have already crossed in the medulla. Which side of voluntary movement is most directly affected by an interruption of the right lateral tract in the cord?','Right below the interruption','Left below the interruption','Both eyes only'],
  ['withdrawal-crossed','The left foot withdraws from a painful stimulus while the right leg supports weight. Which paired action helps?','Left flexion and right extension','Bilateral flexion alone','Left extension and right flexion'],
  ['motor-final-path','A ventral root is interrupted. Which link from CNS to skeletal muscle is directly lost in those fibers?','Lower motor axons carrying impulses to neuromuscular junctions','Dorsal root ganglion cell bodies','Ascending dorsal-column signals'],
  ['reflex-latency','A stimulus occurs at 4 ms and its muscle response begins at 32 ms. What interval should be reported?','28 ms','36 ms','8 ms']
]);
chapterSection('15.1',[
  ['origin-of-outflow','Preganglionic fibers arise in sacral spinal segments and reach ganglia close to the bladder. Which autonomic division supplies this outflow?','Parasympathetic','Sympathetic','Somatic sensory'],
  ['sweat-relay','A sweat gland responds during sympathetic activation. Which pairing identifies its usual postganglionic signal?','Acetylcholine at muscarinic receptors','Norepinephrine at nicotinic receptors','Acetylcholine at skeletal end plates'],
  ['medulla-release adrenal-branch','An output travels to distant targets in blood after preganglionic stimulation. Which tissue is acting like a modified sympathetic ganglion?','Adrenal medulla','Adrenal cortex','Posterior pituitary'],
  ['parasym-chain relay-location','A preganglionic fiber travels a long distance from the brainstem to a ganglion near its target. What is typical of the next segment?','Short parasympathetic postganglionic axon','Long somatic motor axon','No ganglionic synapse']
]);
chapterSection('15.2',[
  ['reflex-rate','A pressure challenge lengthens the time between beats from 0.5 to 0.75 seconds. What is the new heart rate?','80 beats/min','120 beats/min','45 beats/min'],
  ['stretch-rise','Arterial pressure suddenly rises. In the intact baroreflex, which immediate change helps restore pressure?','More cardiac vagal activity and a slower rate','Less baroreceptor firing with a faster rate','Increased sympathetic output to all resistance vessels'],
  ['gut-local','An isolated segment of bowel still moves contents after a local stretch. Where can this reflex integrate?','Enteric plexuses in the bowel wall','Cerebral cortex only','Upper spinal cord only'],
  ['storage-pair','During urinary storage, voluntary tightening of the external urethral sphincter uses which output?','Somatic motor fibers to skeletal muscle','Parasympathetic fibers to smooth muscle','Sympathetic fibers to a cardiac syncytium'],
  ['arteriolar-tone','A resistance vessel loses resting sympathetic vasoconstrictor tone. Which change would you expect locally?','Greater lumen radius and lower resistance','Less radius and lower resistance','No change because vessels lack smooth muscle']
]);
chapterSection('15.3',[
  ['thermostat','Which control center coordinates thermoregulatory adjustments across several autonomic organs as body temperature falls?','Hypothalamus','Motor end plate','Dorsal root ganglion'],
  ['signal-before-running autonomic-descending','A starting bell changes pulse before muscles begin work. Which route can account for this order?','Forebrain signals to hypothalamic and brainstem autonomic centers','Metabolites produced by muscles already exercising','Stretch in the coronary sinus only'],
  ['medullary-response','A fast change in arterial stretch alters vagal firing. Which brainstem region normally integrates this cardiovascular reflex?','Medulla','Occipital cortex','Cerebellar vermis']
]);
chapterSection('15.4',[
  ['agonist-effect','A sympathetic agonist contracts radial smooth muscle in the iris. Which change should be visible in the pupil?','Dilation','Constriction','No change in diameter'],
  ['effector-block','An isolated pacemaker still receives norepinephrine but its beta-1 receptors are blocked. What sympathetic effect is reduced?','Rate acceleration','Transmission in both autonomic ganglia','Sensitivity to light'],
  ['ganglion-interrupt','Block neuronal nicotinic receptors in ordinary autonomic ganglia. Which transmission step is shared by both affected divisions?','Preganglionic ACh excitation of the ganglionic cell','Postganglionic norepinephrine release at every target','Somatic neuromuscular transmission'],
  ['muscarinic-effector muscarinic-site','Light reaches the retina but muscarinic receptors on the iris sphincter are blocked. Which action becomes weaker?','Constriction of the pupil','Abduction of the eye','Activation of optic nerve fibers by light']
]);
chapterSection('16.1',[
  ['consistent-localization','Which pair of new observations fits disruption of left-sided cerebral motor and language pathways in a person with left-dominant language?','Word-finding difficulty and weakness of the right arm','Left foot numbness and poor left ankle reflex only','Bilateral hearing loss without motor change'],
  ['observation-first','Which chart entry records a finding a second examiner could check before deciding where a deficit originates?','Right forearm pronates during an outstretched-arms task','Left cortex is certainly damaged','Cause is established by this single task'],
  ['compare-sides control-observation','A student uses a much stronger touch on one arm. Which redesign makes side-to-side localization more interpretable?','Match stimuli and block visual cues','Use stronger stimulation on both trials of the weaker side','Tell the participant which side is touched']
]);
chapterSection('16.2',[
  ['before-injury','A fictional learner easily forms new memories but has a gap for events immediately preceding an injury. Which time direction describes the loss?','Retrograde','Anterograde','Immediate registration only'],
  ['comprehension','A learner hears the instruction, can move either hand, and repeats the words correctly but cannot follow their meaning. What should the next language task examine?','Spoken comprehension','Hand strength','Coordination of speech muscles alone'],
  ['new-memory','A participant recalls school events from years ago but cannot retain a new list after a delay despite initially registering it. Which memory process is most affected?','Formation of new lasting memories','Retrieval of all pre-event memories','Understanding the examiner’s voice alone'],
  ['registration-check','Before interpreting delayed recall of three spoken words, which observation establishes that the words were registered?','The person immediately repeats all three','The person walks steadily','The person follows a moving target'],
  ['language-domain','A participant hears the examiner, recognizes an object and demonstrates its use but struggles to name it. Which task is most directly difficult?','Language production or word retrieval','Detection of the stimulus','Coordinated reaching']
]);
chapterSection('16.3',[
  ['pupil-matrix','In a simulated light-reflex test, the left pupil constricts when either eye is illuminated. The right pupil never constricts. Which limb accounts for that pattern?','Right efferent pupillary pathway','Right afferent input only','Left afferent input only'],
  ['left-input','With light in the right eye both pupils constrict. With light in the left eye neither constricts. Which limb is least reliable?','Left afferent limb','Left efferent limb alone','Right efferent limb alone'],
  ['eye-abduction','Which cranial nerve supplies the muscle moving the right eye laterally when the target goes right?','Abducens (VI)','Trochlear (IV)','Optic (II)'],
  ['air-bone-pattern','Sound lateralizes left in Weber, and bone outlasts air only on the left in Rinne. Which teaching pattern fits?','Left conductive loss','Left sensorineural loss','Right conductive loss'],
  ['tongue-vs-facial','An examiner asks for tongue movement, then an eyebrow raise. Which nerve supplies the first action?','Hypoglossal (XII)','Facial (VII)','Abducens (VI)']
]);
chapterSection('16.4',[
  ['motor-level','A fictional case shows increased reflexes and an extensor plantar response below a lesion, with muscle bulk initially preserved. Which pathway level fits?','Descending upper motor neuron pathway','Isolated neuromuscular junction','Degeneration limited to anterior horn cells'],
  ['motor-unit','Which signs more strongly point to a lower motor neuron than an upper motor pathway in a teaching case?','Focal wasting, fasciculations and reduced reflex','Marked hyperreflexia and spasticity','Reduced vibration with normal motor power'],
  ['paired-modalities sensory-map sensory-comparison','Right toe position and vibration are impaired below a thoracic level, while pinprick is spared. Which tract would explain this pattern?','Right dorsal column','Left dorsal column','Right ventral root alone']
]);
chapterSection('16.5',[
  ['target-error reaching-endpoints','Strength is preserved, but a moving finger repeatedly overshoots the target. What feature is being observed?','Dysmetria','Anosmia','Areflexia'],
  ['eyes-closed','Stance becomes unstable mainly when vision is removed and toe-position reports are inaccurate. Which function had vision helped compensate for?','Proprioceptive input','Visual acuity alone','Language retrieval'],
  ['alternating-motion alternating-movement','The participant can generate force, but cannot rapidly alternate palm up and palm down evenly. Which property is being tested?','Coordination of alternating movements','Light touch threshold','Hearing acuity']
]);

chapterSection('17.1',[
  ['duct','A gland releases a peptide into a nearby capillary; the peptide acts on receptors in a distant organ. How did it reach its target?','Endocrine transport through the circulation','An exocrine duct to the organ surface','Paracrine diffusion between adjacent cells'],
  ['local-signal','A secreted messenger diffuses to adjacent cells without entering a duct or traveling to a distant target. What route is illustrated?','Paracrine signaling','Endocrine transport through blood','Exocrine secretion through a duct'],
  ['target target-receptor','Two tissues see the same circulating hormone. Only one has its matching receptor. Which tissue can respond directly?','The tissue with that receptor','Every tissue exposed to the blood','Only a tissue with an excretory duct']
]);
chapterSection('17.2',[
  ['second-signal','An extracellular hormone cannot cross the membrane but activation of its receptor raises cAMP inside the cell. Which enzyme supplies cAMP?','Adenylyl cyclase','Acetylcholinesterase','Thrombin'],
  ['binding','After a lipid-soluble signal enters the nucleus, production of a particular RNA increases. Which interaction best explains this?','Hormone–receptor complex regulating transcription','Secretory vesicle binding extracellular cAMP','Antibody binding a red-cell antigen'],
  ['receptor-number receptor-upregulation','The same hormone concentration now evokes a stronger response after the cell adds functional receptors. What changed?','Target-cell sensitivity','Hormone concentration in the sample','Identity of the hormone']
]);
chapterSection('17.3',[
  ['portal portal-vessels','A hypothalamic releasing hormone is already in the primary capillary plexus. How does it next reach anterior pituitary cells?','Portal veins lead to a second capillary plexus','Axons carry the blood into the posterior lobe','It must first circulate through the entire body'],
  ['pituitary-release posterior-trigger','Suckling evokes firing in hypothalamic neurons. Where is oxytocin released into systemic blood in this reflex?','Axon endings in the posterior pituitary','Anterior pituitary portal venules as their first source','Mammary gland ducts']
]);
chapterSection('17.4',[
  ['iodide-limit','Iodide delivery falls while a follicle continues making thyroglobulin. Which step of T3/T4 production is limited?','Iodination of tyrosine residues on thyroglobulin','Making calcitonin in C cells','Release of TRH into thyroid colloid'],
  ['follicle follicle-lumen','A thyroid section shows a lumen filled with colloid. Which protein there provides tyrosines for iodination?','Thyroglobulin','Insulin','Calcitonin'],
  ['feedback paired-hormones','An intact pituitary senses a persistent fall in circulating thyroid hormone. Which response fits the feedback loop?','Higher TSH','Lower TSH','Permanent loss of TRH receptors'],
  ['thyroid-cells','A labeled thyroid cell lies beside the follicular epithelium and secretes a peptide distinct from T3 and T4. Which hormone fits?','Calcitonin','Parathyroid hormone','Aldosterone']
]);
chapterSection('17.5',[
  ['chief-cell-loss','If little PTH reaches the kidney, which renal response would be diminished?','Increased tubular calcium reabsorption','Renal release of glucagon','Increased renal calcium loss directly caused by high PTH'],
  ['low-calcium direct-feedback','Chief cells in a perfused parathyroid initially respond to low calcium. If calcium returns to a higher level, which direction should PTH move?','Down as the stimulus is removed','Up as calcium rises','No change because calcium is never sensed'],
  ['target-intestine renal-messenger','The kidney cannot activate vitamin D in a teaching model. Which part of the normal PTH response is most directly weakened?','Greater intestinal calcium absorption through calcitriol','Secretion of PTH by chief cells','Release of TSH from the anterior pituitary']
]);
chapterSection('17.6',[
  ['stress-zones','A tracer labels chromaffin cells but spares the adrenal cortex. Which hormone pair can those labeled cells release?','Epinephrine and norepinephrine','Cortisol and aldosterone','Aldosterone and epinephrine'],
  ['adrenal-zone','A sample of adrenal cortex comes from the zone between glomerulosa and reticularis. Which steroid is it especially suited to produce?','Cortisol','Aldosterone','Epinephrine'],
  ['glucocorticoid','The adrenal medulla is intact, but cortisol production by the zona fasciculata is reduced. Which response is most directly weakened?','Support of hepatic glucose production during prolonged stress','Immediate catecholamine release from chromaffin cells','Parathyroid calcium sensing'],
  ['mineralocorticoid','A renal preparation receives more aldosterone at constant delivery. Which change in distal nephron handling fits?','More sodium reabsorption and potassium secretion','More sodium secretion and potassium retention','Less sodium reabsorption and no change in potassium handling']
]);
chapterSection('17.7',[
  ['darkness','A person goes from bright light to dim conditions near habitual bedtime. Which pineal signal normally increases during the biological night?','Melatonin','Aldosterone','Oxytocin'],
  ['phase-shift','After traveling six time zones, a student feels sleepy at the old bedtime. What part of the system is still adjusting?','The phase of the internal circadian rhythm','The number of hours in the local day','The route of the optic nerve'],
  ['daily-clock clock-trace','In a shifted light–dark schedule, the daily timing of pineal melatonin initially follows the old cycle. Which process must adjust?','Circadian timing coordinated by the suprachiasmatic nucleus','Minute-to-minute insulin secretion','Baroreceptor firing in the carotid sinus']
]);
chapterSection('17.8',[
  ['placental-steroids','Later in a typical pregnancy the corpus luteum becomes less important for maintaining progesterone. Which tissue takes over much of that production?','Placenta','Anterior pituitary','Pineal gland'],
  ['early-gestation','During early gestation an embryonic signal helps maintain the corpus luteum until placental steroid production is sufficient. Identify the signal.','Human chorionic gonadotropin','Calcitonin','Atrial natriuretic peptide'],
  ['gonadal-feedback','Sertoli cells release more inhibin. Which pituitary output is preferentially suppressed?','FSH','ADH','Oxytocin'],
  ['testicular-cell','Which hormone is produced by interstitial Leydig cells following LH stimulation?','Testosterone','Inhibin from Sertoli cells','Progesterone from the placenta']
]);
chapterSection('17.9',[
  ['after-meal','Blood glucose rises after a carbohydrate-rich meal. Which paired response supports its return toward baseline?','More beta-cell insulin and greater muscle glucose uptake','More glucagon and increased hepatic glucose release','Less insulin and less muscle uptake'],
  ['pancreas-dual','A tracer follows insulin from one pancreatic islet and digestive enzymes from an acinus. Where do their routes diverge?','Insulin enters blood; enzymes enter a duct','Both enter the pancreatic duct','Both enter an islet capillary first'],
  ['peripheral-resistance','Insulin reaches muscle in an islet-perfusion model, but identical doses cause less glucose uptake than in the reference muscle. What has changed?','The target tissue responds less strongly','Insulin has become an exocrine secretion','The islet produced no insulin'],
  ['fasting-liver','During an overnight fast, which liver response to glucagon helps maintain circulating fuel?','Release glucose through glycogen breakdown and gluconeogenesis','Store all available glucose as glycogen','Prevent hepatic glucose release'],
  ['tissue-uptake','A tissue receives 3 dL of plasma per minute. Incoming glucose is 94 mg/dL and outgoing glucose is 88 mg/dL. What is net uptake?','18 mg/min','2 mg/min','282 mg/min']
]);
chapterSection('17.10',[
  ['renal-signal','Low oxygen delivery stimulates a kidney signal. Which response would help increase oxygen-carrying capacity over time?','Erythropoietin stimulates red-cell production in marrow','ANP stimulates platelet release','Renin directly becomes hemoglobin'],
  ['atria','Atrial stretch increases secretion of ANP. Which renal response helps reduce volume?','Greater sodium and water excretion','Complete suppression of sodium excretion','More water retention through ADH release'],
  ['thymic-signal','An immature lymphocyte enters the thymus. Which maturation process is associated with this organ?','T-cell maturation','Erythrocyte enucleation','Megakaryocyte fragmentation'],
  ['adipose-signal','Which endocrine tissue can report energy stores by releasing leptin?','Adipose tissue','Pineal gland','Parathyroid gland']
]);
chapterSection('17.11',[
  ['sensitivity','Two tissue samples receive the same test concentration of thyroid hormone. Sample B shows less target-gene expression. What hypothesis does this observation support?','B has lower target-tissue responsiveness','B always receives less hormone in this experiment','The original glands must have identical secretory reserve'],
  ['common-origin','A labeled neural outgrowth from the developing diencephalon contributes to which pituitary region?','Posterior lobe','Anterior lobe derived from oral ectoderm','Both lobes entirely'],
  ['reserve-test','Two participants have equal resting hormone concentrations. What measurement would reveal a difference in glandular reserve?','Hormone secretion after a standardized stimulus','One additional unstimulated resting reading','The name of the hormone receptor alone'],
  ['ovarian-aging','Ovarian steroid production falls while the hypothalamic–pituitary feedback pathway remains intact. How can gonadotropins respond?','Rise as negative feedback weakens','Fall as negative feedback weakens','Become pancreatic hormones']
]);
chapterSection('18.1',[
  ['fluid-shift','A sample has unchanged red-cell volume but more plasma than before. What happens to the packed-cell percentage?','It falls as plasma dilutes the red-cell fraction','It rises as plasma expands','It stays fixed because red cells keep the same volume'],
  ['hematocrit','A 50 mL sample contains 20 mL of packed red cells. What is its hematocrit?','40%','20%','60%'],
  ['separated-plasma plasma-serum','Two blood tubes stand side by side. One clots and the other contains an anticoagulant. Which fluid retains fibrinogen?','Plasma from the anticoagulated tube','Serum from the clotted tube','Neither fluid']
]);
chapterSection('18.2',[
  ['lineage','A megakaryocyte sheds fragments into a marrow sinusoid. Which circulating component appears?','Platelets','Reticulocytes','Lymphocytes'],
  ['reticulocytes','A recovering marrow releases cells retaining residual ribosomal RNA as they become mature erythrocytes. What are they?','Reticulocytes','Megakaryocytes','Monocytes'],
  ['marrow-locations','Which adult specimen is a better place to study active hematopoiesis?','Red marrow in pelvic trabecular spaces','Yellow fat in the center of the adult tibial shaft','Articular cartilage'],
  ['progenitor','A common lymphoid progenitor is tagged in marrow. Which mature circulating cell could retain the tag?','B lymphocyte','Platelet','Erythrocyte']
]);
chapterSection('18.3',[
  ['oxygen-site','A hemoglobin molecule has four globin chains. What does a reversible oxygen molecule bind to at each site?','Ferrous iron in a heme group','The carbohydrate coat of the red cell','An unbound plasma globin'],
  ['oxygen-capacity','Assume 1.34 mL O₂ per gram of saturated hemoglobin. A sample contains 12 g Hb/dL. What is its approximate oxygen-binding capacity?','16.1 mL O₂/dL','1.6 mL O₂/dL','160.8 mL O₂/dL'],
  ['recycling','A macrophage retrieves iron as it breaks down heme. Which plasma carrier can return this iron to marrow?','Transferrin','Albumin carrying unconjugated bilirubin','Fibrinogen'],
  ['absolute-count','A second sample has the same red-cell count but twice the reticulocyte percentage. What changed?','More reticulocytes per unit volume','Half as many reticulocytes per unit volume','No change in their absolute number'],
  ['red-cell-energy','A mature erythrocyte circulates in oxygenated blood. Why does it rely on glycolysis for ATP?','It lacks mitochondria','It lacks hemoglobin','Its membrane blocks all oxygen']
]);
chapterSection('18.4',[
  ['multilobed smear-neutrophil','A leukocyte has several connected nuclear lobes and fine pale granules. Which cell best fits?','Neutrophil','Lymphocyte','Monocyte'],
  ['fragment smear-platelet smear-fragments','Tiny anucleate fragments accumulate on a damaged vessel wall. What do they form before the fibrin mesh stabilizes it?','Platelet plug','Red-cell precursor island','Antibody-producing follicle'],
  ['granulocyte-differential smear-eosinophil','A cell has a bilobed nucleus and conspicuous orange-red granules. Which identification fits its appearance?','Eosinophil','Basophil','Monocyte'],
  ['monocyte-tissue smear-monocyte','A large circulating cell with a folded or kidney-shaped nucleus enters tissue and can differentiate into a macrophage. Which cell was it?','Monocyte','Eosinophil','Platelet'],
  ['smear-basophil','A rare white cell has coarse dark blue-purple granules that obscure much of its nucleus. Which identification fits?','Basophil','Platelet','Neutrophil'],
  ['smear-lymphocyte','In a teaching field a small cell has a large round nucleus and only a narrow rim of cytoplasm. What fits best?','Small lymphocyte','Monocyte','Eosinophil']
]);
chapterSection('18.5',[
  ['hemostasis-sequence','Immediately after a small vessel injury, what is the usual teaching sequence for controlling blood loss?','Vascular spasm, platelet plug, fibrin stabilization','Fibrinolysis, platelet plug, vascular spasm','Platelet destruction, fibrin digestion, vascular spasm'],
  ['stable-mesh','Platelets seal a small breach briefly, but formation of a fibrin mesh is blocked. Which later stabilization normally depends on thrombin?','Conversion of fibrinogen to fibrin','Contraction of vascular smooth muscle','Formation of platelets by marrow'],
  ['clot-removal','During repair the fibrin scaffold is broken into fragments. Which enzyme performs this degradation?','Plasmin','Thrombin','Factor X'],
  ['platelet-adhesion','Platelets fail to adhere to exposed subendothelial material. Which step is most directly compromised?','Initial platelet plug formation','Production of fibrinogen by the liver','Digestion of fibrin by plasmin']
]);
chapterSection('18.6',[
  ['abo-plasma-test','Plasma from a group A individual is mixed separately with reference A and B red cells. Which sample typically agglutinates?','B red cells because the plasma contains anti-B','A red cells because they bear A antigen','Neither because plasma has no antibodies'],
  ['reverse-typing typing-pattern','Teaching red cells react with anti-B and anti-D but stay dispersed with anti-A. How should they be typed?','B positive','AB positive','B negative'],
  ['plasma-rule','A group A recipient has anti-B in plasma. Which red cells display the corresponding antigen?','Group B and AB red cells','Group O and A red cells','Only Rh-negative cells'],
  ['sensitization','Why may a D-negative person lack anti-D before exposure to D-positive red cells?','Anti-D usually forms after sensitization','All D-negative people carry D antigen','ABO antibodies prevent every Rh response']
]);
chapterSection('19.1',[
  ['coronary-return','A tracer in the great cardiac vein reaches the coronary sinus. Which chamber receives it next?','Right atrium','Left atrium','Right ventricle directly'],
  ['papillary','The chordae anchoring a mitral leaflet rupture. What movement during ventricular systole becomes more likely?','Leaflet displacement toward the left atrium','Leaflet opening into the aorta','Normal closure of the ductus arteriosus'],
  ['valve-side','A drop of blood leaves the right ventricle. Which valve must it cross?','Pulmonary valve','Tricuspid valve','Aortic valve'],
  ['pump-wall','The left and right ventricles eject comparable volumes per beat. Why is the left ventricular wall thicker?','It generates the greater systemic pressure','It normally pumps twice the volume','It empties into the pulmonary trunk']
]);
chapterSection('19.2',[
  ['unpaired-wave','An ECG shows a P wave followed by no QRS complex before the next P wave. What event occurred without its usual successor?','Atrial depolarization without subsequent ventricular depolarization','Ventricular depolarization without repolarization','Ventricular repolarization before atrial depolarization'],
  ['delay','An ECG shows normal atrial depolarization followed by an unusually long wait before ventricular depolarization. Which interval includes the AV conduction delay?','PR interval','QT interval only','ST segment'],
  ['path','Excitation has passed through the AV bundle and reached its right and left branches. Which network distributes it through ventricular muscle?','Purkinje fibers','SA node','Chordae tendineae'],
  ['ecg-bracket','Some P waves in a teaching recording have no QRS complex afterward. What electrical event is missing after those P waves?','Ventricular depolarization','Atrial depolarization','Atrial release of ANP'],
  ['intercalated-discs','Cardiac cells stay mechanically attached but their gap junction conduction falls. Which ability is most directly affected?','Spread of depolarization to adjacent cells','Oxygen binding by erythrocytes','Valve leaflet attachment']
]);
chapterSection('19.3',[
  ['closed-drop','Left ventricular pressure declines after aortic closure, before mitral opening. Why does volume stay constant?','Both valves are closed during isovolumetric relaxation','Blood leaves at the same rate that it enters','The mitral valve is already open'],
  ['outflow','Ventricular pressure rises just above aortic pressure while the mitral valve is closed. What should the next ventricular volume measurement show?','Volume starts falling as the aortic valve opens','Volume rises as the aortic valve closes','Volume stays fixed through all of systole'],
  ['constant-volume closed-valves','All valves are closed as ventricular pressure rises before ejection. Which interval is shown?','Isovolumetric contraction','Rapid ejection','Passive filling'],
  ['valve-reopens','During early filling, left atrial pressure becomes greater than left ventricular pressure. Which event follows?','Mitral valve opens','Aortic valve opens','Pulmonary valve opens'],
  ['heart-sounds','A sound occurs when the two ventricular outflow valves close. Which normal sound is this?','S2','S1','An atrial depolarization wave']
]);
chapterSection('19.4',[
  ['stroke','At an unchanged heart rate, a ventricle ejects 75 rather than 60 mL each beat. How does minute output change?','It rises by 25%','It falls by 20%','It stays the same'],
  ['cardiac-output','A ventricle has EDV 130 mL and ESV 55 mL at 80 beats/min. What is its cardiac output?','6.0 L/min','4.4 L/min','10.4 L/min'],
  ['afterload','Two beats start with equal EDV and contractility. Aortic pressure rises before the second one. What immediate change fits?','More blood remains at end systole','The aortic valve opens at a lower pressure','Stroke volume necessarily increases'],
  ['filling-preload venous-return','Venous return increases while afterload and contractility are held constant. Which first-beat sequence fits Frank–Starling behavior?','Greater filling, greater stretch, greater stroke volume','Less filling, greater stretch, less stroke volume','Greater filling, less stretch, unchanged stroke volume']
]);
chapterSection('19.5',[
  ['loop','Which developmental sequence builds the gross heart layout?','Tube fusion then looping then partitioning','Partitioning then fusion then looping','Looping only after all septa are complete'],
  ['septum','A gap remains in the interventricular septum. Which two spaces are abnormally connected?','Left and right ventricles','Left and right atria','Aorta and pulmonary trunk beyond their valves'],
  ['outflow-partition','The embryonic outflow tract must separate into two large channels. Which adult vessels result?','Aorta and pulmonary trunk','Superior and inferior venae cavae','Right and left pulmonary veins'],
  ['primitive-ventricle','A label is confined to embryonic primitive ventricle tissue. Which adult chamber has a major contribution from it?','Left ventricle','Right atrium','Superior vena cava']
]);
chapterSection('20.1',[
  ['microvessel thin-interface','A vessel wall in skeletal muscle consists of a single layer of endothelial cells plus basal lamina, closely apposed to muscle fibers. Which function does this support?','Short diffusion distances for exchange','Generating most of the systemic pressure','Withstanding aortic pulse pressure by elastic recoil'],
  ['elastic','Which property of large arteries helps maintain forward flow between ventricular ejections?','Elastic recoil of the stretched wall','Skeletal muscle squeezing each aortic segment','AV valves in the aortic wall'],
  ['capillary-types','An organ needs exchange of very large molecules across a discontinuous capillary wall. Which bed fits?','Sinusoidal capillaries','Elastic artery','Continuous capillaries of the brain'],
  ['vessel-wall','Of two round profiles, one has a thick smooth-muscle media relative to its lumen and the other a thin wall. Which is more suited to actively regulating resistance?','The thicker muscular profile','The thin-walled profile because veins initiate pulse pressure','Neither because vessel walls lack smooth muscle']
]);
chapterSection('20.2',[
  ['gradient pressure-flow','An isolated bed has upstream pressure 96 mm Hg, downstream 16 mm Hg, and resistance 4 mm Hg per mL/min. Calculate flow.','20 mL/min','24 mL/min','320 mL/min'],
  ['radius','At a fixed pressure gradient, an arteriole contracts while length and viscosity stay unchanged. What happens to flow?','It decreases as resistance rises','It increases as resistance rises','It remains fixed at the old rate'],
  ['cuff-silence','During gradual cuff deflation the first tap is at 118 mm Hg and the taps disappear at 74 mm Hg. What pressure is estimated?','118/74 mm Hg','74/118 mm Hg','192/44 mm Hg'],
  ['velocity-area','Blood moves more slowly through the combined systemic capillaries than through the aorta at the same total flow. Why?','All parallel capillaries together have a larger area','Each capillary is wider than the aorta','Blood ceases to flow between pulses']
]);
chapterSection('20.3',[
  ['oncotic','A model lowers plasma albumin while holding capillary blood pressure constant. Which fluid movement is favored?','Greater outward filtration because the inward oncotic force falls','Greater inward flow because albumin falls','No change in exchange because only blood pressure matters'],
  ['venous-backpressure','If capillary hydrostatic pressure rises while plasma oncotic pressure stays fixed, what is favored?','More fluid leaving capillaries into tissue','Less outward filtration','Direct movement of plasma proteins into every cell'],
  ['exchange','Oxygen leaves capillary blood along its partial-pressure gradient. Which transport process fits?','Diffusion','Pressure-driven bulk flow alone','Vesicular transport'],
  ['vesicle-transport','An endothelial cell takes up a protein into a vesicle and releases it at the opposite surface. What is this route?','Transcytosis','Diffusion through the lipid bilayer','Simple filtration through an open gap']
]);
chapterSection('20.4',[
  ['standing upright-response','After sudden standing arterial baroreceptor stretch briefly falls. Which response helps restore pressure?','Higher sympathetic drive to heart and arterioles','A drop in heart rate through stronger vagal firing','Less sympathetic vasomotor tone'],
  ['local-flow','A working muscle accumulates vasodilator metabolites despite little change in upstream pressure. Which local effect increases delivery?','Arteriolar relaxation reduces resistance','Arteriolar contraction reduces resistance','Venous collapse drives all inflow'],
  ['fluid-hormone','Higher ADH after fluid loss promotes which collecting-duct response?','Greater water permeability','Less water permeability','Direct secretion of erythropoietin']
]);
chapterSection('20.5',[
  ['pedal-circuit','A tracer moves from the popliteal artery toward the dorsum of the foot. Which leg vessel continues there as dorsalis pedis?','Anterior tibial artery','Posterior tibial artery','Great saphenous vein'],
  ['posterior-leg','Contrast two ankle pulses. Which vessel is palpated behind the medial malleolus?','Posterior tibial artery','Dorsalis pedis artery','Popliteal vein'],
  ['superficial-return','Blood rises along the medial leg through the great saphenous vein. Which deep vein receives it at the groin?','Femoral vein','Axillary vein','Hepatic vein'],
  ['portal-first portal-two-beds','A molecule absorbed into an intestinal blood capillary next reaches a second exchange bed before the vena cava. Where?','Hepatic sinusoids via the portal vein','Renal glomeruli via the renal artery','Pulmonary capillaries via the aorta']
]);
chapterSection('20.6',[
  ['placental-return','A tracer enters the fetus in the umbilical vein. Which shunt allows much of it to bypass hepatic sinusoids?','Ductus venosus','Foramen ovale','Ductus arteriosus'],
  ['first-breath','Pulmonary resistance falls and pulmonary venous return increases after birth. Which pressure shift favors functional closure of the foramen ovale?','Left atrial pressure exceeds right atrial pressure','Right atrial pressure exceeds left atrial pressure','Aortic pressure falls below pulmonary arterial pressure in every beat'],
  ['ductal-path fetal-bypass','In fetal circulation, which vessel shortcuts blood from the pulmonary trunk toward the descending aorta?','Ductus arteriosus','Ductus venosus','Umbilical vein'],
  ['new-vessels','Mesoderm first forms endothelial tubes; new branches then sprout from those tubes. Which terms describe these successive processes?','Vasculogenesis then angiogenesis','Angiogenesis then hematopoiesis','Hematopoiesis then hemostasis']
]);

export function recoveryCase(q){return cases.get(q.id);}
