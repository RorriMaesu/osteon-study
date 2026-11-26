export { renderLab, mountLab } from './ap2-neural-labs.js';

const book = 'https://openstax.org/books/anatomy-and-physiology-2e/pages/';

function lesson(id, title, objectives, paragraphs, activity, questions) {
  const slug = title.toLowerCase().replaceAll(' ', '-');
  return { id, title, source: book + id.replace('.', '-') + '-' + slug, objectives, paragraphs, activity, questions };
}

function activity(title, prompt, steps) {
  return { title, prompt, steps: steps.map(([label, detail]) => ({ label, detail })) };
}

function q(prompt, choices, answer, why) {
  return { prompt, choices, answer, why };
}

const nervousTissue = {
  id: 12,
  title: 'The Nervous System and Nervous Tissue',
  summary: 'Follow one message from a receptor to a muscle. Zoom in to see how a neuron carries that message along an axon and passes it across a synapse.',
  sections: [
    lesson('12.1', 'Basic Structure and Function of the Nervous System', [
      'Classify a structure by its location and a signal by its direction.',
      'Use nucleus, ganglion, tract, and nerve to describe tissue in context.',
      'Identify sensory input, integration, and motor output in one movement.'
    ], [
      'You feel a pencil roll under your finger and tighten your grip. Skin receptors and peripheral nerves carry the incoming news. The brain and spinal cord together form the central nervous system (CNS), where networks interpret it. Outgoing axons deliver instructions to the muscles. Afferent means toward the CNS. Efferent means away from it. A single peripheral nerve can carry fibers traveling in both functional directions.',
      'Look at what is grouped together. A collection of neuronal cell bodies is usually called a nucleus inside the CNS and a ganglion in the peripheral nervous system (PNS). A bundle of axons is a tract in the CNS and a nerve in the PNS. Gray matter is rich in cell bodies, dendrites, and synapses. White matter owes much of its pale appearance to the lipid-rich myelin surrounding axons.',
      'The destination of motor output gives a second way to classify it. Somatic motor neurons activate skeletal muscle, including in a spinal reflex. Autonomic output regulates cardiac muscle, smooth muscle, and glands. Within the gut wall, enteric circuits coordinate local digestive activity and receive input from the autonomic system.'
    ], activity('Track a slipping pencil', 'Trace the signal through three locations. At each one, say which way the information travels.', [
      ['Fingertip to cord', 'Pressure deforms a receptor. An afferent axon carries activity toward the spinal cord.'],
      ['Inside the CNS', 'Connected neurons combine the new touch signal with information about finger position and the current grip.'],
      ['Cord to hand', 'Somatic motor axons carry output to skeletal muscles that increase grip force.']
    ]), [
      q('A labeled bundle carries signals between two regions of the spinal cord. Which term describes the bundle?', ['Tract', 'Ganglion', 'Nerve', 'Nucleus'], 0, 'The labeled structure contains axons and lies wholly within the CNS. That combination identifies a tract.'),
      q('A receptor in the skin sends information toward the brain through an arm nerve. How would you classify this portion of its route?', ['Central and motor', 'Peripheral and afferent', 'Peripheral and efferent', 'Central and afferent'], 1, 'The arm nerve belongs to the PNS, and the direction toward the CNS makes the signal afferent.'),
      q('Which change is an example of autonomic motor output?', ['A biceps muscle contracts during a curl.', 'A receptor detects stretch in a tendon.', 'Smooth muscle in the iris constricts the pupil.', 'A sensory neuron signals a rising skin temperature.'], 2, 'Autonomic efferents act on smooth muscle, cardiac muscle, or glands. The iris contains smooth muscle.'),
      q('A slide shows a cluster of sensory neuron cell bodies just outside the spinal cord. What should its label read?', ['Spinal tract', 'Spinal nucleus', 'Peripheral nerve fascicle', 'Sensory ganglion'], 3, 'A cluster of peripheral neuronal cell bodies is a ganglion. Spinal sensory neurons have their cell bodies in dorsal root ganglia.')
    ]),
    lesson('12.2', 'Nervous Tissue', [
      'Follow signals through the parts of a typical multipolar neuron.',
      'Recognize multipolar, bipolar, and pseudounipolar shapes.',
      'Match each major CNS and PNS glial cell to its work.'
    ], [
      'In a typical multipolar neuron, many dendrites collect input near the cell body, or soma. The soma contains the nucleus and much of the machinery that makes proteins. If input brings the initial segment of the axon to threshold, a spike travels down the axon to its terminals. Branches of the same axon can deliver a message to several targets.',
      'Count processes where they meet the soma. Multipolar neurons have one axon and several dendrites. A bipolar neuron has two processes and occurs in special sensory systems. A pseudounipolar sensory neuron has a short stalk that divides into peripheral and central branches. Its cell body sits off the direct route from skin to spinal cord.',
      'Glia keep these circuits working. In the CNS, astrocytes help regulate extracellular ions and support the blood-brain barrier, microglia survey tissue and clear debris, and ependymal cells line the fluid-filled cavities. Oligodendrocytes extend processes to myelinate segments of multiple axons. In the PNS, each myelinating Schwann cell wraps one segment of one axon, while satellite cells surround neuron cell bodies in ganglia. Small gaps in the myelin, the nodes of Ranvier, are sites where an action potential regenerates.'
    ], activity('Read a neuron from shape to job', 'Use the shape of a cell and the location of its neighbors to identify three features in a specimen.', [
      ['Find the soma', 'Look for the neuronal nucleus, then count the processes emerging directly from the cell body.'],
      ['Follow the axon', 'Track a single long process toward its terminal branches. Myelin segments along that process are interrupted by nodes.'],
      ['Place the glia', 'For a myelinated axon in a peripheral nerve, label a wrapping cell Schwann cell. For a sensory cell body in a ganglion, label the surrounding small cells satellite cells.']
    ]), [
      q('One glial cell sends branches to myelin segments on three nearby axons in the spinal cord. Which cell is it?', ['Schwann cell', 'Oligodendrocyte', 'Satellite cell', 'Ependymal cell'], 1, 'A single oligodendrocyte can supply multiple CNS myelin segments. A myelinating Schwann cell supplies one peripheral segment.'),
      q('A sensory axon runs from skin toward the spinal cord. Its cell body sits on a short side branch. Which neuronal shape fits?', ['Bipolar', 'Multipolar', 'Pseudounipolar', 'Anaxonic'], 2, 'The two branches of a single stalk form a continuous path past the cell body, a characteristic pseudounipolar arrangement.'),
      q('Which cells would a microscopist find directly lining a brain ventricle?', ['Microglia', 'Satellite cells', 'Oligodendrocytes', 'Ependymal cells'], 3, 'An ependymal lining faces the cerebrospinal fluid within the ventricular system.'),
      q('Several short processes from a multipolar neuron receive synapses close to its soma. Which structures are these?', ['Dendrites', 'Nodes of Ranvier', 'Axon terminals', 'Myelin internodes'], 0, 'Dendrites branch from the soma and provide much of the surface for incoming signals.')
    ]),
    lesson('12.3', 'The Function of Nervous Tissue', [
      'Separate receptor transduction from conduction along an axon.',
      'Locate sensory, integrating, and motor events in a spinal circuit.',
      'Explain how a stimulus can contribute to a reflex and to conscious awareness.'
    ], [
      'Imagine stepping onto an unexpectedly sharp pebble. Mechanical stress in the skin changes ion flow at free nerve endings sensitive to potentially damaging stimuli. This conversion of stimulus energy into an electrical change is transduction. If the local change is large enough, a sensory axon carries action potentials toward the spinal cord.',
      'In the cord, the afferent can excite interneurons, which influence motor neurons in the ventral gray matter. Their axons leave by ventral roots and signal skeletal muscle at neuromuscular junctions. The leg can begin withdrawing while an ascending pathway carries related information toward the brain. The reflex circuit and conscious perception have different destinations and timing.',
      'An axon conducts within one cell. A synapse transfers information to another cell. Following these events separately helps locate an interruption. A receptor can still detect a stimulus when motor output is interrupted. A muscle response alone tells you that some input reached some motor neurons, while conscious identification also requires processing in the brain.'
    ], activity('Trace a withdrawal circuit', 'Reconstruct the route from skin to flexor muscle before accounting for awareness.', [
      ['Detect', 'Mechanical stress changes ion flow in a sensory ending. The sensory axon carries the signal into the spinal cord.'],
      ['Integrate', 'Interneurons connect the incoming signal to flexor motor neurons. Other neurons send information toward the brain.'],
      ['Respond', 'The motor axon conducts to the neuromuscular junction. Acetylcholine release activates the skeletal muscle fiber.']
    ]), [
      q('Which observation shows transduction at the start of a touch pathway?', ['An impulse arrives at the thalamus.', 'A motor terminal releases acetylcholine.', 'Pressure opens channels in a sensory ending.', 'A spike travels along a myelinated fiber.'], 2, 'Transduction changes stimulus energy into an electrical signal. Opening mechanically sensitive channels accomplishes this at the ending.'),
      q('A foot has already begun to withdraw when a person becomes aware of the sharp stimulus. Which arrangement explains the timing?', ['The cortex controls the tendon directly.', 'Spinal motor neurons detect the stimulus.', 'The ascending pathway activates the skin first.', 'Spinal circuits drive movement while other signals ascend.'], 3, 'Interneurons can recruit motor output within the cord before ascending information has undergone conscious processing.'),
      q('A recording shows a spike arriving at a motor terminal. What event transfers the instruction to the muscle?', ['Acetylcholine is released into the junction.', 'Myelin passes into the muscle fiber.', 'The motor cell body moves into the muscle.', 'A dorsal root relays the signal to a receptor.'], 0, 'Acetylcholine crosses the neuromuscular junction and binds receptors on the muscle fiber.'),
      q('A sensory axon activates an interneuron that excites a motor neuron. Which event is a synaptic transfer?', ['An impulse passing under myelin', 'The interneuron releasing transmitter onto the motor neuron', 'A spike regenerating at a node', 'Electrical current spreading along the sensory axon'], 1, 'A synapse passes information between cells. Regeneration and local current along an axon occur in one neuron.')
    ]),
    lesson('12.4', 'The Action Potential', [
      'Identify threshold and the phases of a voltage trace.',
      'Predict the direction of sodium and potassium movement during a spike.',
      'Relate refractoriness and myelin to propagation along an axon.'
    ], [
      'Membrane voltage measures the inside of a cell relative to the outside. At rest, many neurons sit near −70 mV. Potassium is concentrated inside, sodium outside, and resting membranes allow more potassium than sodium to leak through. The sodium-potassium pump maintains these gradients over time by moving three sodium ions out for two potassium ions in.',
      'A depolarizing input makes the inside less negative. At threshold, opening voltage-gated sodium channels admits enough sodium to open still more channels. This positive feedback creates the steep upstroke. Sodium channels then inactivate and delayed potassium channels open. Outward potassium current brings the voltage back down. When potassium conductance remains elevated briefly, the voltage dips below rest.',
      'During the absolute refractory period, too few sodium channels are available to generate another spike. During relative refractoriness, a stronger stimulus can succeed. A stronger sustained input can increase spike frequency. In a myelinated axon, current spreads under each insulating segment and regenerates the spike at the next node, a pattern called saltatory conduction.'
    ], activity('Annotate a single spike', 'Read the trace from left to right. Pair each change in slope with the channels responsible.', [
      ['Upstroke', 'At threshold the inward sodium current becomes self-reinforcing. The voltage can pass through zero.'],
      ['Downstroke', 'Sodium channels inactivate and potassium leaves through voltage-gated channels, bringing the voltage back toward rest.'],
      ['Undershoot', 'Potassium channels close gradually. Voltage returns toward baseline as the extra potassium conductance subsides.']
    ]), [
      q('An axon passes threshold and its voltage rises rapidly. Which current accounts for the rising phase?', ['Potassium moving inward', 'Calcium leaving vesicles', 'Sodium moving outward', 'Sodium moving inward'], 3, 'Voltage-gated sodium channels open rapidly. The sodium electrochemical gradient drives positive charge inward.'),
      q('Why can an axon briefly become more negative than its resting voltage after a spike?', ['Potassium conductance stays elevated.', 'Sodium channels reopen in large numbers.', 'The membrane loses its concentration gradients.', 'The sodium-potassium pump reverses direction.'], 0, 'Some voltage-gated potassium channels stay open after repolarization, allowing continued outward potassium flow.'),
      q('A second stimulus, however strong, fails during the absolute refractory period. What limits the response?', ['All potassium ions have left the cell.', 'Many voltage-gated sodium channels are inactivated.', 'The myelin has lost its insulation.', 'The sodium-potassium pump has stopped.'], 1, 'Sodium channels need time at a repolarized voltage to recover from inactivation before they can support a second upstroke.'),
      q('Where does a propagating spike regenerate along a healthy myelinated axon?', ['At each myelin layer', 'Inside the Schwann cell nucleus', 'At successive nodes of Ranvier', 'Only at the axon terminal'], 2, 'Current spreads passively under myelin and brings the next exposed node, rich in voltage-gated channels, to threshold.')
    ]),
    lesson('12.5', 'Communication Between Neurons', [
      'Trace transmitter release and removal at a chemical synapse.',
      'Distinguish spatial summation from temporal summation.',
      'Use the receptor and ion movement to explain a postsynaptic response.'
    ], [
      'An arriving spike opens voltage-gated calcium channels in a presynaptic terminal. Inward calcium triggers vesicle fusion. Released transmitter crosses the cleft and binds postsynaptic receptors. An ionotropic receptor opens a channel directly. A metabotropic receptor acts through an intracellular signaling pathway. Reuptake, enzymatic breakdown, and diffusion help end the signal.',
      'Synaptic responses are graded. An excitatory postsynaptic potential (EPSP) increases the chance of reaching threshold. An inhibitory postsynaptic potential (IPSP) reduces the chance, for example by increasing chloride conductance. Repeated inputs at one synapse can overlap in time. Inputs arriving from different synapses can add across space. The resulting voltage at the initial segment helps determine whether the receiving neuron fires.',
      'Acetylcholine activates nicotinic receptors at skeletal muscle. At other targets, muscarinic receptors can give the same transmitter a different effect. Common neurotransmitter families include amino acids such as glutamate and glycine, biogenic amines such as dopamine and serotonin, and peptides such as substance P. Knowing the transmitter narrows the possibilities. Knowing the receptor helps predict the response.'
    ], activity('Reconstruct a chemical synapse', 'Name the event on each side of the cleft, then explain how closely spaced inputs could combine.', [
      ['Presynaptic side', 'A spike reaches a terminal, calcium enters, and vesicles release transmitter.'],
      ['Postsynaptic side', 'Transmitter binds a receptor. Changes in ion conductance alter the probability that the target cell fires.'],
      ['Combine inputs', 'Two EPSPs can overlap if their timing permits. Two inputs from different terminals illustrate spatial summation. Repeating one input illustrates temporal summation.']
    ]), [
      q('A spike reaches a terminal but calcium entry is prevented. Which event falls most directly?', ['Fusion of transmitter vesicles', 'Resting potassium leakage in the target', 'Transport of sodium by the pump', 'Synthesis of myelin at nodes'], 0, 'Calcium entry couples depolarization of the terminal to synaptic vesicle fusion.'),
      q('Three spikes arrive at the same terminal before the first postsynaptic response fades. What can add together?', ['Axon diameters', 'Graded potentials through temporal summation', 'Spike heights through spatial summation', 'Synaptic clefts through diffusion'], 1, 'Closely spaced inputs from one terminal produce graded potentials that can overlap in time.'),
      q('Two cells respond differently to acetylcholine. Which comparison would best explain the difference?', ['Their distances from the spinal cord', 'Their positions within a nerve fascicle', 'The receptor subtypes and signaling pathways on each cell', 'The number of branches on the releasing neuron'], 2, 'The target receptor and its coupled channels or signaling pathways determine how acetylcholine changes cellular activity.'),
      q('A transmitter binds directly to a receptor that contains an ion-conducting pore. What type of receptor is this?', ['A voltage-gated channel', 'A reuptake transporter', 'A metabotropic receptor', 'An ionotropic receptor'], 3, 'Binding opens the channel in an ionotropic receptor. Metabotropic receptors signal through intermediary proteins.')
    ])
  ]
};

const nervousAnatomy = {
  id: 13,
  title: 'Anatomy of the Nervous System',
  summary: 'Use the developing neural tube to orient yourself in the adult brain. Trace fluid through its cavities and follow fibers across the boundary between the cord and a peripheral nerve.',
  sections: [
    lesson('13.1', 'The Embryologic Perspective', [
      'Distinguish neural tube derivatives from neural crest derivatives.',
      'Connect the three primary brain vesicles to five secondary vesicles and their adult structures.',
      'Use an adult cavity to identify the embryonic region that surrounded it.'
    ], [
      'A strip of dorsal ectoderm thickens into a neural plate. Its edges rise around a groove and meet to form a hollow neural tube. Cells from the neural crest migrate away and give rise to structures that include sensory ganglia, autonomic ganglia, and Schwann cells. The tube itself develops into the brain and spinal cord. Its lumen persists as the ventricular system and central canal.',
      'At the rostral end of the tube, three enlargements appear. The forebrain, or prosencephalon, produces the telencephalon (cerebral hemispheres) and diencephalon (including thalamus and hypothalamus). The midbrain, or mesencephalon, keeps its name. The hindbrain, or rhombencephalon, produces the metencephalon (pons and cerebellum) and myelencephalon (medulla). The pons and cerebellum share both an embryonic origin and large adult connections.',
      'Track the hollow center through those regions. Each cerebral hemisphere curves around a lateral ventricle. The third ventricle lies in the diencephalon, the narrow cerebral aqueduct runs through the midbrain, and the fourth ventricle lies between the cerebellum and brainstem. Farther caudally, the tube forms the spinal cord, where dorsal regions receive sensory input and ventral regions give rise to somatic motor output.'
    ], activity('Rebuild the hindbrain lineage', 'Start with a primary vesicle and keep track of its tissue separately from the space inside it.', [
      ['Primary vesicle', 'Locate the rhombencephalon just caudal to the mesencephalon.'],
      ['Secondary vesicles', 'Divide it into rostral metencephalon and caudal myelencephalon. Connect the pons and cerebellum to the former and the medulla to the latter.'],
      ['Adult cavity', 'Place the fourth ventricle between the cerebellum and the pons or upper medulla. Follow it superiorly to the cerebral aqueduct.']
    ]), [
      q('A cell lineage contributes to both the pons and the cerebellum. Which secondary vesicle was labeled?', ['Diencephalon', 'Myelencephalon', 'Metencephalon', 'Telencephalon'], 2, 'The metencephalon produces the pons and cerebellum. Its hindbrain neighbor, the myelencephalon, produces the medulla.'),
      q('Which pair would share a neural crest origin?', ['Cerebral cortex and thalamus', 'Medulla and pons', 'Spinal cord and retina', 'Schwann cells and dorsal root ganglion neurons'], 3, 'Migrating neural crest cells supply peripheral sensory ganglion neurons and Schwann cells. The other pairs derive from neural tube tissue.'),
      q('A narrow channel runs through the adult midbrain. Which embryonic lumen is represented here?', ['Lumen of the mesencephalon', 'Lumen of the telencephalon', 'Lumen of the myelencephalon', 'Lumen of the metencephalon'], 0, 'The cerebral aqueduct is the midbrain portion of the original hollow neural tube.'),
      q('Which cavity is surrounded by a cerebral hemisphere that develops from the telencephalon?', ['Third ventricle', 'Lateral ventricle', 'Fourth ventricle', 'Central canal'], 1, 'The two telencephalic expansions form cerebral hemispheres and enclose the paired lateral ventricles.')
    ]),
    lesson('13.2', 'The Central Nervous System', [
      'Locate motor and somatosensory cortex relative to the central sulcus.',
      'Differentiate the work of the basal nuclei, diencephalon, brainstem, and cerebellum.',
      'Orient a spinal cord cross-section using horns and white columns.'
    ], [
      'On a lateral view of the cerebrum, locate the central sulcus. The precentral gyrus on its frontal side contains primary motor cortex. The postcentral gyrus on its parietal side contains primary somatosensory cortex. The occipital lobe processes vision, and the temporal lobe includes primary auditory cortex. Beneath the cortical gray matter, white matter links areas within a hemisphere, crosses between hemispheres in the corpus callosum, and connects cortex to lower centers.',
      'Deep in the cerebrum, basal nuclei participate in circuits that help select and scale movement. The thalamus in the diencephalon relays and modifies information exchanged with cortex, while the hypothalamus coordinates autonomic and endocrine responses involved in homeostasis. The brainstem comprises midbrain, pons, and medulla. The cerebellum lies behind the brainstem and uses sensory feedback and a copy of motor commands to correct timing and coordination.',
      'In spinal cord cross-section, gray matter forms a central butterfly. The posterior (dorsal) horns receive and process sensory input. The anterior (ventral) horns contain the motor neuron cell bodies that supply skeletal muscle. Lateral horns are conspicuous in thoracic and upper lumbar segments and contain sympathetic preganglionic neurons. White matter around the gray forms posterior, lateral, and anterior columns that carry ascending and descending axons.'
    ], activity('Orient two unlabeled sections', 'Use a surface landmark in the cerebrum and an internal landmark in the cord to distinguish motor and sensory regions.', [
      ['Find the central sulcus', 'Point just anterior to it for the precentral motor gyrus. Cross the sulcus posteriorly to the postcentral sensory gyrus.'],
      ['Orient the spinal cord', 'Place the deeper anterior median fissure on the ventral side. Find the broad ventral gray horns and the narrower dorsal gray horns.'],
      ['Connect the motor levels', 'A descending command can travel through white matter and influence a ventral horn motor neuron whose axon leaves the cord.']
    ]), [
      q('A labeled cortical strip lies immediately behind the central sulcus. Which function is most closely associated with it?', ['Primary auditory processing', 'Somatic sensory processing', 'Primary visual processing', 'Initiating corticospinal commands'], 1, 'The postcentral gyrus of the parietal lobe contains primary somatosensory cortex.'),
      q('Which region compares intended movement with feedback to adjust the timing of a reach?', ['Hypothalamus', 'Occipital cortex', 'Cerebellum', 'Dorsal root ganglion'], 2, 'The cerebellum uses information about motor commands and actual movement to adjust coordination and timing.'),
      q('An axon innervating a skeletal muscle leaves the cord in a ventral root. Where is its cell body?', ['Posterior white column', 'Dorsal root ganglion', 'Dorsal horn', 'Ventral horn'], 3, 'The cell bodies of lower motor neurons that supply skeletal muscle are in the ventral gray horn.'),
      q('Which deep diencephalic structure coordinates body temperature, autonomic output, and pituitary activity?', ['Hypothalamus', 'Corpus callosum', 'Cerebellar cortex', 'Caudate nucleus'], 0, 'The hypothalamus integrates endocrine and autonomic responses that maintain internal conditions.')
    ]),
    lesson('13.3', 'Circulation and the Central Nervous System', [
      'Follow arterial blood into the brain and venous blood out.',
      'Trace cerebrospinal fluid from a lateral ventricle to venous blood.',
      'Predict which compartments lie upstream of a blocked cerebral aqueduct.'
    ], [
      'The brain receives arterial blood from the internal carotid and vertebral arteries. The vertebral arteries join to form the basilar artery. Communicating arteries at the base of the brain link the anterior and posterior systems in the cerebral arterial circle. Brain tissue needs a continuous delivery of oxygen and glucose. Loss of perfusion can injure the supplied territory. Cerebral veins empty into dural venous sinuses, which drain toward the internal jugular veins.',
      'From the skull inward, the meninges are dura mater, arachnoid mater, and pia mater. Cerebrospinal fluid (CSF) surrounds the brain and cord in the subarachnoid space between arachnoid and pia. CSF provides buoyancy and cushioning. Tight junctions between CNS capillary endothelial cells limit entry from blood into brain tissue. At a choroid plexus, a different barrier is made by the epithelial cells that secrete CSF.',
      'Each lateral ventricle drains through its interventricular foramen into the third ventricle. The cerebral aqueduct carries CSF through the midbrain to the fourth ventricle. Median and lateral apertures then open into the subarachnoid space. Arachnoid granulations provide a route back into the dural venous sinuses. An obstruction of the aqueduct impedes flow from the third ventricle, so both lateral ventricles and the third ventricle lie upstream.'
    ], activity('Find the upstream cavities', 'Sketch two paired spaces joining a single midline route. Place a block at the cerebral aqueduct.', [
      ['Trace before the block', 'Start in either lateral ventricle, go through an interventricular foramen, and enter the third ventricle.'],
      ['Mark the constriction', 'The aqueduct is the connection between the third and fourth ventricles. A block here can cause fluid to accumulate in the lateral and third ventricles.'],
      ['Resume downstream', 'From the fourth ventricle, follow the apertures into the subarachnoid space, then arachnoid granulations toward venous blood.']
    ]), [
      q('A tracer is placed in a lateral ventricle. What opening must it pass through to reach the third ventricle?', ['Median aperture', 'Cerebral aqueduct', 'Interventricular foramen', 'Arachnoid granulation'], 2, 'Each lateral ventricle has an interventricular foramen communicating with the third ventricle.'),
      q('In a model with a complete aqueduct obstruction, which cavities lie directly upstream?', ['Fourth ventricle and central canal', 'Only the fourth ventricle', 'Subarachnoid space and venous sinuses', 'Both lateral ventricles and the third ventricle'], 3, 'Both lateral ventricles drain into the third ventricle before fluid enters the aqueduct. The fourth ventricle lies downstream.'),
      q('A vessel is formed where the right and left vertebral arteries unite. Which vessel is it?', ['Basilar artery', 'Internal carotid artery', 'Anterior cerebral artery', 'Superior sagittal sinus'], 0, 'The paired vertebral arteries merge to form the basilar artery on the ventral brainstem.'),
      q('A CSF tracer surrounds the surface of the cord, external to the pia. What space does it occupy?', ['Epidural space', 'Subarachnoid space', 'Dural venous sinus', 'Central canal'], 1, 'The subarachnoid space contains CSF between the arachnoid and pia around the CNS.')
    ]),
    lesson('13.4', 'The Peripheral Nervous System', [
      'Trace a sensory fiber and a motor fiber through spinal roots, spinal nerve, and rami.',
      'Identify the twelve cranial nerves from characteristic sensory or motor tasks.',
      'Explain what a nerve plexus redistributes and how sensory and autonomic ganglia differ.'
    ], [
      'The 31 pairs of spinal nerves include 8 cervical, 12 thoracic, 5 lumbar, 5 sacral, and 1 coccygeal pair. A dorsal root carries afferent fibers into the cord, with cell bodies in its dorsal root ganglion. A ventral root carries efferent fibers out. The roots join in a mixed spinal nerve, which divides into dorsal and ventral rami. Both rami are mixed. Many ventral rami exchange fibers in cervical, brachial, lumbar, or sacral plexuses, so one limb nerve may contain axons from several spinal levels.',
      'Around an individual peripheral fiber lies endoneurium. Perineurium encloses a fascicle, and epineurium encloses the whole nerve. A sensory ganglion contains the cell bodies of primary sensory neurons. An autonomic ganglion houses the postganglionic neurons that receive synapses from preganglionic neurons. Enteric ganglia in the digestive wall participate in local circuits that regulate gut movement and secretion.',
      'Identify cranial nerves by testing the task in your mind. I olfactory carries smell, II optic carries vision, and VIII vestibulocochlear carries hearing and balance. III oculomotor moves most eye muscles and constricts the pupil, IV trochlear supplies superior oblique, and VI abducens supplies lateral rectus. V trigeminal carries facial sensation and drives chewing. VII facial drives facial expression and carries taste from the anterior tongue.',
      'IX glossopharyngeal contributes to swallowing, salivation, and taste from the posterior tongue. X vagus participates in swallowing and voice and carries sensory and parasympathetic fibers for thoracic and abdominal organs. XI accessory drives sternocleidomastoid and trapezius. XII hypoglossal moves the tongue. Distinguish the muscles that move the tongue from the afferents that carry taste.'
    ], activity('Follow fibers across a spinal nerve', 'Trace the routes to and from a patch of skin and the muscle beneath it on the posterior trunk.', [
      ['Sensory route inward', 'Follow the sensory fiber in a dorsal ramus, through the mixed spinal nerve, and into a dorsal root. Find its cell body in the dorsal root ganglion.'],
      ['Motor route outward', 'Start at a ventral horn motor neuron. Its axon leaves in a ventral root and reaches the back muscle by way of the mixed nerve and dorsal ramus.'],
      ['Check the distinction', 'Dorsal root identifies a sensory route. Dorsal ramus identifies the mixed branch serving the posterior trunk.']
    ]), [
      q('A branch carries both touch fibers and motor fibers to deep back muscles after a spinal nerve divides. What is the branch?', ['Dorsal root', 'Dorsal root ganglion', 'Ventral root', 'Dorsal ramus'], 3, 'The dorsal ramus serves the back and contains sensory and motor fibers. The dorsal root carries sensory fibers toward the cord.'),
      q('Which cranial nerve supplies lateral rectus to turn an eye outward?', ['VI abducens', 'IV trochlear', 'III oculomotor', 'II optic'], 0, 'The abducens nerve supplies lateral rectus. Its action abducts the eye.'),
      q('How can a named nerve of the forearm contain fibers from several spinal levels?', ['The dorsal roots join inside the spinal cord.', 'Ventral rami redistribute fibers in the brachial plexus.', 'Sensory ganglia fuse to form the named nerve.', 'Each cranial nerve contributes a root.'], 1, 'In the brachial plexus, axons from multiple ventral rami regroup into peripheral nerves of the upper limb.'),
      q('Which pairing correctly distinguishes facial sensation from facial expression?', ['VII senses facial skin and V moves expression muscles.', 'IX senses facial skin and XI moves expression muscles.', 'V senses facial skin and VII moves expression muscles.', 'VIII senses facial skin and XII moves expression muscles.'], 2, 'Trigeminal fibers supply most facial skin sensation. Facial motor fibers activate muscles of facial expression.')
    ])
  ]
};

const somatic = {
  id: 14,
  title: 'The Somatic Nervous System',
  summary: 'Compare the information carried by the senses, find where sensory pathways cross, and follow a motor command from cortex to muscle.',
  sections: [
    lesson('14.1', 'Sensory Perception', [
      'Match a stimulus to its receptor and identify the first electrical change.',
      'Compare the structures for hearing, linear acceleration, and rotation.',
      'Trace light to the retina and explain how photoreceptors respond.'
    ], [
      'A warm cup activates several receptor types at once. Skin thermoreceptors respond to temperature, mechanoreceptors to deformation, and nociceptors to potentially damaging stimuli. Proprioceptors monitor muscles, tendons, and joints. These general senses are widely distributed. Special senses use specialized organs. Perception emerges when the CNS interprets receptor signals in context.',
      'Taste buds contain receptor cells activated by dissolved chemicals. Salty and sour stimuli involve ion movement. Sweet, bitter, and umami stimuli activate G protein-coupled receptors. In the nose, odorants bind receptors on the cilia of olfactory neurons. Axons from these neurons run to the olfactory bulb. Taste and smell therefore both detect chemicals, but their receptor cells and first neural connections differ.',
      'Sound vibrates the tympanic membrane. Malleus, incus, and stapes transfer this motion to the oval window. Waves in the cochlea move the basilar membrane and deflect hair bundles, changing transmitter release onto auditory fibers. Vestibular hair cells instead report movement of the head. Semicircular ducts detect angular acceleration. The utricle and saccule contain weighted otolith membranes that shift during linear acceleration or changes in head tilt.',
      'Tears and eyelids protect the front of the eye. The clear cornea begins to focus incoming light, the pupil admits it, and the lens adjusts focus onto the retina. The retinal pigment epithelium supports the rods and cones in the adjacent neural retina and absorbs stray light. Light reduces cyclic GMP in rods and cones, closes cation channels, and hyperpolarizes the photoreceptors. Their glutamate release falls. Rods support dim-light sensitivity, while cones support color and sharp central vision. Retinal ganglion cell axons form the optic nerve.'
    ], activity('Identify a sense from its first event', 'For each example, name the stimulus, detecting structure, and signal that changes.', [
      ['An elevator starts upward', 'Linear acceleration shifts the otolith membrane relative to vestibular hair cells. Bending the hair bundles changes transmitter release.'],
      ['A tone begins', 'Motion of the stapes at the oval window launches cochlear fluid waves. Hair bundles bend as the basilar membrane moves.'],
      ['A point of light appears', 'Rods or cones absorb photons. Their cation channels close and the photoreceptors hyperpolarize.']
    ]), [
      q('A chair begins to spin while its occupant remains upright. Which sensory structures detect the initial angular acceleration?', ['Semicircular ducts', 'Cochlear basilar membrane', 'Olfactory cilia', 'Utricular otolith membrane'], 0, 'Rotation moves endolymph relative to each duct, deflecting hair bundles in the corresponding ampulla.'),
      q('What is the initial electrical response of a rod when light increases?', ['Depolarization from sodium influx', 'Hyperpolarization as cation channels close', 'A full action potential at the outer segment', 'Depolarization as glutamate release rises'], 1, 'Light reduces cyclic GMP and closes channels that carry inward current in darkness, so the rod hyperpolarizes and releases less glutamate.'),
      q('Which sequence takes sound energy from the eardrum into the inner ear?', ['Stapes → incus → malleus → round window', 'Cochlea → malleus → incus → stapes', 'Malleus → incus → stapes → oval window', 'Incus → oval window → malleus → stapes'], 2, 'The malleus connects to the tympanic membrane, the incus links the ossicles, and the stapes pushes on the oval window.'),
      q('Which taste stimulus relies principally on a G protein-coupled taste receptor?', ['Sodium producing salt taste', 'Acid producing sour taste', 'Protons entering a sour-sensitive cell', 'A sugar producing sweet taste'], 3, 'Sweet, bitter, and umami use G protein-coupled taste receptors. Salty and sour depend more directly on ion movement.')
    ]),
    lesson('14.2', 'Central Processing', [
      'Identify the crossing level for fine touch and for pain from the body.',
      'Compare body and facial somatosensory relays.',
      'Use sensory maps and visual processing streams to explain localization.'
    ], [
      'A vibrating tuning fork on the left foot activates a route for discriminative touch, vibration, and conscious proprioception. First-order axons ascend on the left in the dorsal columns to nuclei in the medulla. Second-order axons cross there, then ascend in the medial lemniscus to the thalamus. Third-order neurons project to the right primary somatosensory cortex. Pain and temperature follow a different route. After a dorsal horn synapse, second-order axons cross in the spinal cord near entry and ascend in the contralateral anterolateral system.',
      'For most facial touch, primary afferents travel in the trigeminal nerve to brainstem nuclei. Many second-order trigeminal fibers cross and ascend to the thalamus. Facial input reaches the ventral posteromedial thalamic nucleus, and body input reaches the ventral posterolateral nucleus. Both project to orderly body maps in somatosensory cortex. A fingertip has a larger cortical representation than an equal area of trunk skin, reflecting sensory resolution.',
      'Some central maps preserve space and others preserve frequency. Neighboring points of the visual field occupy neighboring parts of the visual cortex. The auditory system preserves a map of sound frequency and compares inputs from the two ears to help locate a source. In vision, nasal retinal fibers cross at the optic chiasm and temporal retinal fibers stay on their side. Each hemisphere thus receives the opposite visual hemifield from both eyes.',
      'From primary visual cortex, a ventral stream toward temporal cortex helps identify an object. A dorsal stream toward parietal cortex helps locate it and guide action. Identifying a set of keys and reaching accurately for it depend on related but distinguishable computations.'
    ], activity('Predict the side of an ascending signal', 'Begin in the left foot. Stop at the thoracic cord and then just above the medulla to identify the side carrying each modality.', [
      ['Vibration', 'At thoracic level, the vibration signal is still on the left in the dorsal column. It crosses after the medullary relay.'],
      ['Temperature', 'After a dorsal horn relay near entry, the temperature pathway crosses in the spinal cord. At thoracic level the signal ascends on the right.'],
      ['Above the medulla', 'Both pathways now carry the left-foot information on the right toward thalamic relays and sensory cortex.']
    ]), [
      q('While left-foot vibration information ascends the thoracic spinal cord, where is it carried?', ['Right anterolateral system', 'Left dorsal column', 'Right dorsal column', 'Left ventral root'], 1, 'First-order dorsal column axons ascend on the same side as the input until they reach the medulla.'),
      q('A right-foot temperature signal has crossed into the left anterolateral system. Where did that crossing occur?', ['At the optic chiasm', 'In the thalamus', 'In the spinal cord near entry', 'After the medullary dorsal column relay'], 2, 'Second-order neurons carrying pain and temperature cross near the level of their spinal synapse.'),
      q('Someone can describe a pictured object but needs visual guidance to reach its location. Which pathway contributes most directly to locating it for that reach?', ['Ventral occipitotemporal stream', 'Dorsal column of the cord', 'Trigeminal sensory tract', 'Dorsal occipitoparietal stream'], 3, 'The dorsal visual stream helps compute spatial relationships and guide actions. The ventral stream supports object recognition.'),
      q('Why do both eyes contribute information about the left visual field to the right cerebral hemisphere?', ['Nasal retinal fibers cross and temporal retinal fibers remain uncrossed.', 'All retinal fibers cross at the optic chiasm.', 'Each optic nerve carries information from the opposite eye.', 'The two retinas project directly to the same side of cortex.'], 0, 'The partial crossing at the chiasm brings the right temporal retina and the left nasal retina together in the right optic tract for the left visual field.')
    ]),
    lesson('14.3', 'Motor Responses', [
      'Trace a voluntary limb command from motor cortex to a neuromuscular junction.',
      'Distinguish the roles of upper and lower motor neurons, basal nuclei, and cerebellum.',
      'Compare the actions of stretch, withdrawal, and crossed-extensor reflexes.'
    ], [
      'To lift a cup, association and premotor areas use the goal and sensory surroundings to organize a movement. Primary motor cortex sends commands through upper motor neurons. Most corticospinal fibers cross at the pyramidal decussation in the caudal medulla and descend in the lateral corticospinal tract. They influence spinal circuits, including lower motor neurons, whose axons reach skeletal muscle. Corticobulbar projections instead influence motor nuclei of cranial nerves.',
      'Basal nuclei help select a movement and suppress competing motor programs through loops involving thalamus and cortex. The cerebellum compares expected and measured motion to tune force and timing. Descending pathways from the brainstem contribute to posture and balance. Vestibulospinal signals, for example, adjust postural muscles when the head changes orientation.',
      'Spinal reflexes also recruit lower motor neurons. Stretching a muscle spindle excites a sensory fiber that can directly activate motor neurons of the same muscle. A parallel inhibitory interneuron reduces activity in an antagonist. A withdrawal reflex uses interneurons to flex a threatened limb. Crossed-extensor circuits can extend the opposite limb to support body weight. The result coordinates several muscles around a rapid protective response.'
    ], activity('Compare three motor routes', 'Choose where each command begins, where its circuit crosses if needed, and where it reaches a muscle.', [
      ['Reach with the right hand', 'Follow a command from left motor cortex through the medullary crossing into the right lateral corticospinal tract and cervical motor circuits.'],
      ['Respond to a tendon tap', 'Stretch of a muscle spindle activates a sensory afferent that directly excites motor neurons of the same muscle. An interneuron can inhibit the antagonist.'],
      ['Step off a sharp stone', 'Interneurons recruit flexors on the stimulated side and can recruit extensors across the cord to support the other leg.']
    ]), [
      q('Which sequence can deliver a command from left motor cortex to a right hand muscle?', ['Right dorsal column → dorsal root → muscle', 'Optic chiasm → right spinal ganglion → muscle', 'Medullary crossing → right lateral corticospinal tract → right lower motor neuron', 'Left lateral corticospinal tract → right cerebellum → muscle'], 2, 'Most corticospinal fibers cross in the caudal medulla and influence lower motor neurons on the opposite side of the body.'),
      q('A tendon tap stretches a quadriceps muscle spindle. Which connection supplies the short excitatory limb of its stretch reflex?', ['A skin nociceptor to a flexor interneuron', 'A corticospinal neuron to a sensory ganglion', 'A tendon organ to an inhibitory interneuron', 'A spindle afferent directly to a quadriceps motor neuron'], 3, 'The homonymous stretch reflex includes a monosynaptic excitatory connection from the spindle afferent to a motor neuron of the same muscle.'),
      q('When the left leg withdraws from a sharp object, which response helps the standing person stay upright?', ['Extending the right leg', 'Flexing both knees simultaneously', 'Relaxing both knee extensors', 'Inhibiting all motor neurons on the right'], 0, 'The crossed-extensor reflex activates extensors on the side opposite the stimulus to support body weight.'),
      q('Which neuron carries the final electrical signal from spinal cord to skeletal muscle?', ['A somatosensory thalamic neuron', 'A lower motor neuron in the ventral horn', 'An upper motor neuron in motor cortex', 'A dorsal root ganglion neuron'], 1, 'The lower motor neuron sends its own axon out through the ventral root and into a peripheral nerve to the muscle.')
    ])
  ]
};

export const chapters = [nervousTissue, nervousAnatomy, somatic];
