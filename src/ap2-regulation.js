const pages = 'https://openstax.org/books/anatomy-and-physiology-2e/pages/';

function lesson(id, title, objectives, paragraphs, activity, questions) {
  const slug = title.toLowerCase().replaceAll(' ', '-');
  return { id, title, source: pages + id.replace('.', '-') + '-' + slug, objectives, paragraphs, activity, questions };
}

function task(title, prompt, ...steps) {
  return { title, prompt, steps: steps.map(([label, detail]) => ({ label, detail })) };
}

function question(prompt, choices, answer, why) {
  return { prompt, choices, answer, why };
}

const autonomic = {
  id: 15,
  title: 'The Autonomic Nervous System',
  summary: 'Follow signals from the central nervous system to visceral organs. Use the receptor at each synapse to explain how the same division can produce different effects.',
  sections: [
    lesson('15.1', 'Divisions of the Autonomic Nervous System', [
      'Trace sympathetic and parasympathetic signals through their ganglia.',
      'Identify the transmitter and receptor at a ganglion, a cardiac target and an eccrine sweat gland.'
    ], [
      'Autonomic motor pathways adjust cardiac muscle, smooth muscle and glands. In the usual pathway a preganglionic neuron has its cell body in the central nervous system. Its axon meets a postganglionic neuron in a peripheral ganglion. In both divisions the first neuron releases acetylcholine (ACh) onto neuronal nicotinic receptors. The position of that ganglion helps you identify the division on a diagram.',
      'Sympathetic preganglionic neurons emerge from the thoracolumbar cord. Many synapse in paired chains beside the vertebral column. Others continue to prevertebral ganglia in the abdomen. Most sympathetic postganglionic neurons release norepinephrine onto adrenergic receptors. Two departures are especially informative. Eccrine sweat glands receive sympathetic ACh at muscarinic receptors, and adrenal medullary chromaffin cells receive preganglionic ACh and release catecholamines into blood.',
      'Parasympathetic outflow travels in cranial nerves III, VII, IX and X and from sacral segments S2–S4. A long preganglionic axon reaches a ganglion close to or inside the organ. A short postganglionic axon releases ACh onto muscarinic receptors. At the cardiac pacemaker this input slows the rate. ACh alone cannot identify a branch of the autonomic system. Its location and receptor establish what it does.'
    ], task('Trace two routes to the heart', 'Sketch both efferent routes and mark where their chemistry diverges.',
      ['Place the ganglia', 'Place a sympathetic chain ganglion near the spine and a parasympathetic ganglion near the heart.'],
      ['Label the first relay', 'Write ACh → nicotinic at both ganglia. Locate the cell bodies on the two sides of each synapse.'],
      ['Label the pacemaker', 'Add norepinephrine → β1 for sympathetic acceleration and ACh → muscarinic M2 for vagal slowing.']
    ), [
      question('A long axon in the vagus nerve ends in a ganglion in the heart wall. Which signal crosses this ganglion?', ['ACh binding a nicotinic receptor', 'ACh binding a muscarinic receptor', 'Norepinephrine binding a β1 receptor', 'Epinephrine binding an α1 receptor'], 0, 'A preganglionic autonomic neuron releases ACh. The ganglionic neuron responds through a neuronal nicotinic receptor.'),
      question('A sympathetic postganglionic fiber releases ACh. Which target best fits?', ['Cardiac pacemaker', 'Eccrine sweat gland', 'Typical cutaneous arteriole', 'Adrenal chromaffin cell'], 1, 'Sympathetic fibers to eccrine sweat glands release ACh onto muscarinic receptors. Chromaffin cells receive preganglionic fibers.'),
      question('How does a signal reach distant tissues after a preganglionic neuron activates the adrenal medulla?', ['Postganglionic axons deliver ACh to each distant tissue.', 'Sympathetic chain fibers deliver norepinephrine to each target directly.', 'Catecholamines travel through the bloodstream.', 'Anterior pituitary ACTH delivers the signal to each target.'], 2, 'Chromaffin cells secrete epinephrine and norepinephrine into blood, giving this sympathetic output an endocrine route.')
    ]),
    lesson('15.2', 'Autonomic Reflexes and Homeostasis', [
      'Separate the sensory limb of a visceral reflex from its motor limb.',
      'Predict how changing autonomic tone helps recover arterial pressure and distinguish long from short reflexes.'
    ], [
      'A visceral reflex begins when a receptor detects a change such as stretch in an arterial wall. Sensory fibers carry that information to an integrating circuit. In a long reflex the circuit reaches the brain or spinal cord. A short enteric reflex can instead coordinate secretion or contraction entirely within the gut wall. Visceral sensory input can share central pathways with somatic signals, which helps explain why discomfort from an internal organ may be felt at a body surface.',
      'The arterial baroreflex acts on a pressure disturbance. Standing can briefly lower arterial pressure and reduce stretch in the carotid sinus and aortic arch. Their sensory firing falls. Medullary circuits increase sympathetic activity and reduce vagal activity to the heart. Heart rate rises and sympathetic constriction of many vessels helps restore pressure. When pressure rises above its usual range, these changes reverse.',
      'Autonomic tone is ongoing activity that can rise or fall. At rest the vagus slows the intrinsic cardiac pacemaker, so removing vagal tone tends to speed it. Most systemic arterioles depend mainly on sympathetic vasoconstrictor tone. Less sympathetic output can therefore dilate a vessel even without a second motor supply.'
    ], task('Reverse a pressure disturbance', 'Trace the first seconds after standing up.',
      ['Identify the input', 'A transient pressure drop reduces stretch and firing at arterial baroreceptors.'],
      ['Select the output', 'Increase sympathetic drive to the heart and resistance vessels. Reduce vagal slowing of the pacemaker.'],
      ['Close the loop', 'A faster heart and greater peripheral resistance oppose the initial fall. Recovery of stretch feeds back to the medulla.']
    ), [
      question('Arterial pressure briefly increases. What is the expected fast reflex response?', ['Lower baroreceptor firing and faster heart rate', 'Higher baroreceptor firing and greater vagal slowing', 'Lower baroreceptor firing and stronger vasoconstriction', 'Higher baroreceptor firing and faster heart rate'], 1, 'Greater stretch raises baroreceptor firing. The integrating circuits favor vagal slowing and reduce sympathetic output.'),
      question('A segment of intestine responds to local stretch after its connections to the brain and spinal cord have been interrupted. Which circuit explains this?', ['A spinal somatic stretch reflex', 'A hypothalamic reflex', 'A short enteric reflex', 'A vagovagal long reflex'], 2, 'Enteric sensory neurons, interneurons and effectors can form a local circuit within the intestinal wall.'),
      question('A systemic arteriole dilates as its usual sympathetic firing declines. What property makes this possible?', ['A single skeletal motor neuron innervating its wall', 'Excitatory parasympathetic tone on its smooth muscle', 'Continuous sympathetic stimulation of β2-mediated dilation', 'Baseline sympathetic vasoconstrictor tone'], 3, 'Ongoing sympathetic activity partly constricts many arterioles. Reducing this activity lets the smooth muscle relax.')
    ]),
    lesson('15.3', 'Central Control', [
      'Connect emotion and body temperature to hypothalamic autonomic output.',
      'Trace cardiovascular sensory information into the medulla and its output toward the heart.'
    ], [
      'Autonomic responses can start before the internal environment changes. Hearing an unexpected alarm can accelerate the heart while a person is still sitting. Limbic circuits, including the amygdala, inform the hypothalamus about the significance of the sound. The hypothalamus links that information with temperature, fluid balance and other internal signals, then coordinates neural, endocrine and behavioral responses.',
      'Descending pathways, including the dorsal longitudinal fasciculus, link the hypothalamus to autonomic nuclei in the brainstem and spinal cord. The medial forebrain bundle also links hypothalamic and limbic regions. This organization lets a shift in temperature recruit sweating or heat conservation while influencing actions such as seeking shade.',
      'The medulla maintains rapid cardiovascular reflexes. Carotid sinus afferents travel with cranial nerve IX and aortic arch afferents travel with X to the nucleus of the solitary tract. Its circuits adjust sympathetic outflow and cardiac vagal neurons, including those in the nucleus ambiguus. The sensory report, integration and motor response occupy distinct parts of this circuit.'
    ], task('Locate three levels of control', 'Explain why anticipation and an actual pressure change can both affect the heart.',
      ['Anticipate', 'An emotionally significant cue recruits limbic and hypothalamic pathways even before exercise begins.'],
      ['Measure', 'IX and X convey actual arterial stretch information to the medulla.'],
      ['Act', 'Brainstem and spinal autonomic outputs change pacemaker activity and vascular tone.']
    ), [
      question('The heart accelerates at the sound of the starting whistle, before a runner moves. Which link best accounts for the anticipatory input?', ['Retina to pineal gland', 'Spinal motor neuron to muscle spindle', 'Limbic circuits to the hypothalamus', 'Adrenal cortex to a sympathetic ganglion'], 2, 'Limbic input can recruit hypothalamic and downstream autonomic circuits before a physical disturbance occurs.'),
      question('Sensory fibers reporting stretch of the aortic arch enter which central structure through the vagus?', ['Precentral gyrus', 'Cerebellar dentate nucleus', 'Anterior pituitary', 'Medullary nucleus of the solitary tract'], 3, 'The nucleus of the solitary tract receives visceral sensory input and relays it within cardiovascular control circuits.'),
      question('A temperature challenge produces both sweating and a drive to seek a cooler room. Which region best coordinates these outputs?', ['Hypothalamus', 'Primary visual cortex', 'Dorsal root ganglion', 'Caudate nucleus'], 0, 'The hypothalamus integrates temperature information with autonomic and behavioral responses.')
    ]),
    lesson('15.4', 'Drugs that Affect the Autonomic System', [
      'Predict an organ response from the receptor, its location and the action of an agonist or antagonist.',
      'Distinguish a drug acting at an autonomic ganglion from one acting at an effector.'
    ], [
      'An agonist activates a receptor. An antagonist prevents its usual transmitter from activating it. The physiological outcome depends on where that receptor sits and what the organ was doing. At a cardiac pacemaker, β1 stimulation increases rate, so a β1 antagonist limits acceleration during sympathetic drive. At an arteriole, α1 activation contracts smooth muscle and narrows the lumen.',
      'Nicotinic receptors on ganglionic neurons relay signals in both autonomic divisions. Interfering with this shared synapse can affect several organs, with direction determined by the prevailing tone. Effector muscarinic receptors have a different distribution. Blocking cardiac muscarinic receptors can release the pacemaker from vagal slowing. The same blockade can reduce sweating because eccrine glands use muscarinic receptors too.',
      'An indirect action changes transmitter availability. Acetylcholinesterase normally breaks down ACh after release. In a model with intact ACh release, slowing this enzyme prolongs exposure at cholinergic synapses. That intervention reaches more sites than a substance selective for one subtype of muscarinic receptor.'
    ], task('Predict a receptor blockade', 'For each tissue, identify the usual signal before predicting what an antagonist changes.',
      ['Cardiac β1', 'Norepinephrine normally accelerates the pacemaker. β1 blockade blunts that acceleration.'],
      ['Cardiac M2', 'ACh normally slows the pacemaker. Muscarinic blockade reduces vagal slowing.'],
      ['Sweat gland', 'Sympathetic ACh normally promotes secretion. A muscarinic antagonist can reduce it.']
    ), [
      question('A model heart receives steady vagal input. Blocking its M2 receptors should initially do what?', ['Slow the pacemaker further', 'Leave the resting rate unchanged because β1 receptors are intact', 'Stop the pacemaker by removing its initiating signal', 'Raise the rate toward its intrinsic value'], 3, 'Removing the M2 response reduces the vagal brake on the intrinsic pacemaker.'),
      question('Which intervention would interrupt the first peripheral relay in both major autonomic divisions?', ['Block neuronal nicotinic receptors', 'Block β1 adrenergic receptors', 'Activate α1 adrenergic receptors', 'Block glandular muscarinic receptors'], 0, 'Preganglionic fibers of both divisions signal through nicotinic receptors on ganglionic cells.'),
      question('In a cholinergic preparation, ACh release stays constant while acetylcholinesterase activity falls. What changes first?', ['The duration of ACh exposure decreases.', 'ACh remains available at the synapse longer.', 'ACh release must fall immediately to zero.', 'Muscarinic receptors lose their ability to bind ACh.'], 1, 'Slower enzymatic breakdown extends the time during which released transmitter can bind its receptors.')
    ])
  ]
};

const neurological = {
  id: 16,
  title: 'The Neurological Exam',
  summary: 'Interpret fictional exam findings by separating sensory input, motor output and central processing. Use preserved abilities alongside lost functions to narrow the anatomy.',
  sections: [
    lesson('16.1', 'Overview of the Neurological Exam', [
      'Choose the exam domain that samples a specified function.',
      'Use the distribution and timing of a deficit to frame an anatomical hypothesis.'
    ], [
      'The exam samples mental status, cranial nerves, sensation, movement and coordination including gait. Some tasks need several systems. Reaching for a moving target requires seeing it, understanding the request, generating force and correcting the path. A missed target is more informative once these other abilities have been examined.',
      'Localization starts with comparisons. A deficit confined to one peripheral nerve territory suggests a different level from simultaneous face, arm and leg changes on one side. An exam also records which abilities are intact and whether a pattern has changed since the last observation. This gives the next examiner a baseline and helps target further investigations.',
      'Time course and anatomy answer different questions. A developmental condition, trauma, inflammation and vascular injury can all disrupt neural function. A thrombus forms locally, while an embolus travels to obstruct a vessel downstream. Both can cause ischemia. Hemorrhage involves bleeding. Exam findings alone generally cannot establish which vascular mechanism caused a sudden focal loss.'
    ], task('Separate observation from inference', 'A fictional learner can lift both arms but repeatedly misses a target with one hand.',
      ['Record the observation', 'The hand misses despite the ability to raise the arm. Describe the direction and repeatability of the error.'],
      ['Check prerequisites', 'Confirm that the person sees the target, understands the task and has adequate strength and position sense.'],
      ['Choose a domain', 'Compare coordinated movement on the two sides. The result narrows the next anatomical question.']
    ), [
      question('Which observation belongs primarily to the mental status exam?', ['The left pupil constricts to light.', 'The person follows a two-part spoken command.', 'The patellar tendon tap extends the knee.', 'The eyes move together toward a target.'], 1, 'A spoken command samples comprehension and attention, provided hearing and the required motor output are adequate.'),
      question('A clot forms in the heart, travels into a cerebral artery and lodges there. Which mechanism is described?', ['Local cerebral thrombosis', 'Intracranial hemorrhage', 'Embolic ischemia', 'Axonal demyelination'], 2, 'An embolus travels from its site of origin and may obstruct blood flow at a downstream location.'),
      question('Why record normal left arm strength when documenting right arm weakness?', ['It identifies the exact cause of weakness.', 'It proves a peripheral nerve injury.', 'It rules out every central lesion.', 'It establishes asymmetry and a baseline for comparison.'], 3, 'Preserved performance helps define the distribution and provides a reference for subsequent examinations.')
    ]),
    lesson('16.2', 'The Mental Status Exam', [
      'Distinguish attention, registration, delayed recall, comprehension and speech production.',
      'Connect a pattern of preserved and impaired abilities with a cortical network.'
    ], [
      'Attention determines which information enters many other tasks. To investigate a memory complaint, establish that the person heard and immediately repeated the items. After an intervening task, ask for delayed recall. A failure at initial registration changes the interpretation of a later miss. Medial temporal structures, including the hippocampus, help form new declarative memories. Working memory and flexible planning draw on prefrontal networks.',
      'Primary cortical regions receive modality-specific input or direct motor output. Association regions interpret that information. Multimodal networks combine perception, prior knowledge and action. Someone who feels the shape of a familiar object yet cannot identify it by touch may have a problem with recognition. Difficulty demonstrating a learned gesture despite comprehension and adequate movement suggests impaired praxis.',
      'Language tasks sample naming, repetition, comprehension and spontaneous speech. In a typical language-dominant hemisphere, frontal language networks support fluent production and posterior temporal networks contribute to comprehension. Effortful, sparse speech with relatively preserved comprehension gives a different pattern from fluent speech with poor comprehension. Slurred articulation with accurate word choice can instead reflect a motor speech problem.'
    ], task('Disentangle a missed word', 'A fictional participant fails to recall a word after a delay. Identify what further observations would change your interpretation.',
      ['Check registration', 'Document immediate repetition to establish that the word was perceived and registered.'],
      ['Control the interval', 'Use an intervening task before delayed recall. Check attention and understanding during the session.'],
      ['Compare domains', 'Correct naming and comprehension alongside poor delayed recall support a different explanation from broad language difficulty.']
    ), [
      question('A participant never correctly repeats a new three-word list. Why is delayed recall of that list hard to interpret?', ['Registration was never established.', 'Delayed recall measures attention only.', 'Failed repetition establishes a storage defect by itself.', 'Recognition and recall always give identical results.'], 0, 'A later failure cannot isolate retention when initial perception, attention or encoding is uncertain.'),
      question('A fictional participant speaks in smooth phrases but gives unrelated answers and cannot follow a simple spoken request despite intact hearing. Which domain deserves closer testing?', ['Limb proprioception', 'Language comprehension', 'Visual acuity', 'Extraocular strength'], 1, 'Fluent output does not guarantee comprehension. The combination points to testing receptive language and related networks.'),
      question('A participant understands a request and can move the hand normally but cannot pantomime using a key. Which ability is being sampled?', ['Delayed verbal recall', 'Pupillary accommodation', 'Praxis', 'Arousal'], 2, 'Praxis is the planning and execution of a learned purposeful action.')
    ]),
    lesson('16.3', 'The Cranial Nerve Exam', [
      'Match a sensory or motor observation to the cranial nerve carrying the relevant signal.',
      'Separate the afferent and efferent limbs of the pupillary light reflex.'
    ], [
      'Smell enters through I, vision through II, and hearing and vestibular information through VIII. Eye movement uses III, IV and VI. The lateral rectus abducts the eye through VI, the superior oblique uses IV, and III carries the remaining major extraocular motor outputs as well as parasympathetic fibers for pupil constriction. Coordinating eye movements also requires intact brainstem connections.',
      'For the light reflex, light entering one retina sends a signal via II to midbrain circuits that activate both sides. Each III supplies the constrictor pathway for its own pupil through the ciliary ganglion. Comparing which eye receives light with which pupil responds separates a problem carrying information in from a problem sending the command out.',
      'V carries facial touch and powers mastication. VII moves the muscles of facial expression and carries taste from the anterior two-thirds of the tongue. IX carries taste from the posterior third and sensory input from the pharynx, while X contributes to palate, pharynx and larynx movement. XI drives sternocleidomastoid and trapezius. XII drives tongue movements. A tongue movement task and a taste task therefore test different pathways on the same organ.'
    ], task('Map the pupil observations', 'In a simplified case, both pupils constrict when light enters the right eye. Neither responds to light in the left eye.',
      ['Test both outputs', 'The right-eye trial demonstrates that both pupils can constrict.'],
      ['Compare inputs', 'The missing response follows illumination of the left eye regardless of which pupil is observed.'],
      ['Localize the limb', 'A complete left afferent pathway interruption fits the pattern. For this model, assume both irises are otherwise normal.']
    ), [
      question('With light in either eye, the right pupil constricts and the left pupil never constricts. In a simplified single-nerve model, which limb is impaired?', ['Right optic input', 'Left optic input', 'Right oculomotor output', 'Left oculomotor parasympathetic output'], 3, 'Either eye can drive the right pupil, demonstrating functional input from each eye. The absent response is confined to the left output.'),
      question('A fictional subject cannot move the right eye outward from center. Which nerve supplies the muscle responsible for that movement?', ['Right abducens, VI', 'Right trochlear, IV', 'Right optic, II', 'Right facial, VII'], 0, 'Abduction from center depends on the lateral rectus, supplied by VI.'),
      question('A subject feels a touch on both cheeks but cannot smile symmetrically. Which distinction helps interpret the finding?', ['Both actions use only V.', 'Facial touch mainly uses V and facial expression uses VII.', 'Facial touch uses VII and expression uses XII.', 'Both actions primarily use XI.'], 1, 'Trigeminal sensory fibers and facial motor fibers serve different functions in the same region.')
    ]),
    lesson('16.4', 'The Sensory and Motor Exams', [
      'Use sensory modality and side to reason about ascending tracts.',
      'Interpret the combination of strength, tone and reflexes in a motor pathway.'
    ], [
      'Light touch, vibration, joint position, pain and temperature sample different pathways. Vibration and conscious proprioception ascend on the same side in the spinal dorsal columns and cross in the medulla. Pain and temperature fibers synapse after entering the cord. Their second-order neurons cross near the entry level and ascend on the opposite side. A one-sided cord lesion may therefore produce different sidedness for the two sets of sensations below it.',
      'An upper motor neuron influences lower motor neurons through descending pathways. The lower motor neuron leaves the brainstem or spinal cord and directly innervates skeletal muscle. In an established upper motor neuron lesion, weakness can accompany increased tone, brisk reflexes and an extensor plantar response. Lower motor neuron or reflex-arc damage can produce weakness with low tone and reduced reflexes. The knee jerk specifically requires intact sensory input, a spinal synapse and motor output.',
      'Map the distribution as well as the quality of a change. A dermatome represents skin supplied predominantly by one spinal segment, with overlap at its borders. A named peripheral nerve usually contains axons from several roots. A patch of altered sensation matching a single nerve and a segmental band of loss suggest different sites to examine.'
    ], task('Follow two modalities up the cord', 'Mark the crossings to predict findings below a right thoracic hemicord lesion.',
      ['Trace vibration', 'From the right foot, the dorsal column ascends on the right to the medulla. A right cord lesion can disrupt this signal.'],
      ['Trace temperature', 'Input from the left foot crosses near entry and ascends in the right anterolateral cord. It too can be disrupted.'],
      ['State the prediction', 'Below the lesion, expect reduced vibration on the right and reduced pain or temperature on the left, generally beginning a few segments below for the latter.']
    ), [
      question('An established lesion causes weakness, increased tone and brisk tendon reflexes in one limb. Which site best explains the combination?', ['Neuromuscular junction alone', 'Peripheral motor axon alone', 'Descending upper motor neuron pathway', 'A cutaneous receptor alone'], 2, 'Loss of descending control can produce the combination of weakness, spasticity and hyperreflexia.'),
      question('An isolated left dorsal-column lesion in the thoracic cord most directly affects which signal below it?', ['Pain from the right foot', 'Temperature from the left foot', 'Pain from the left foot', 'Vibration from the left foot'], 3, 'Lower-limb vibration signals ascend on the same side of the cord before crossing in the medulla.'),
      question('A muscle contracts strongly on command but fails to respond to a tendon tap. Which neural component normally carries the stretch signal into the spinal cord?', ['Sensory afferent from its muscle spindle', 'Alpha motor axon to the same muscle', 'Corticospinal fiber to the spinal segment', 'Gamma motor axon to the spindle'], 0, 'The stretch reflex requires spindle afferent input even when the voluntary motor output path still functions.')
    ]),
    lesson('16.5', 'The Coordination and Gait Exams', [
      'Explain why matching a movement to its target requires sensory feedback and cerebellar processing.',
      'Distinguish inaccuracy of limb movement from loss of force or reliance on vision for balance.'
    ], [
      'To reach a cup, the nervous system needs an intended movement and an estimate of where the limb actually is. Pontine pathways convey information about planned movement to the cerebellum through the middle cerebellar peduncle. Proprioceptive and vestibular signals supply feedback, much of it through the inferior peduncle. Deep cerebellar nuclei send much of their output through the superior peduncle to motor control circuits.',
      'Alternating hand movements and reaching to a target sample timing and scaling. Dysmetria means the movement overshoots or undershoots its target. A tremor that grows near the target can accompany impaired cerebellar coordination. Check strength, sensation and vision because these tasks require all three. Cerebellar hemisphere dysfunction often affects limb coordination on the same side.',
      'Gait and stance combine proprioceptive, visual, vestibular and motor information. A wide base and instability already evident with eyes open can fit truncal ataxia. A fictional subject who stands steadily with eyes open but becomes markedly unstable with eyes closed is using vision to compensate. A positive Romberg pattern suggests a proprioceptive or vestibular contribution, with additional observations needed to distinguish them.'
    ], task('Interpret two balance records', 'Compare two written observations from a supervised fictional exam.',
      ['Record A', 'The subject is steady with eyes open and much less stable with eyes closed. Vision was contributing substantial compensation.'],
      ['Record B', 'The subject has an unsteady broad-based stance even with eyes open. Closing the eyes is unnecessary to establish baseline instability.'],
      ['Choose another observation', 'Check joint-position sense, eye movements and limb coordination to separate sensory contributions from cerebellar findings.']
    ), [
      question('Strength and joint-position sense are preserved. One hand repeatedly overshoots a visible target. Which term describes what was observed?', ['Aphasia', 'Dysmetria', 'Anosmia', 'Hyperreflexia'], 1, 'Dysmetria describes an error in the distance or amplitude of a goal-directed movement.'),
      question('A fictional participant is steady with eyes open and much less steady when visual input is removed. What does this comparison establish?', ['An isolated cerebellar lesion is certain.', 'Visual acuity must be impaired.', 'Vision was compensating for impaired balance input.', 'Lower motor neurons have lost all function.'], 2, 'A marked effect of eye closure suggests reliance on vision. Proprioceptive and vestibular findings help refine the interpretation.'),
      question('Which cerebellar connection carries prominent pontine input conveying information about planned movement?', ['Optic chiasm', 'Dorsal root ganglion', 'Superior colliculus', 'Middle cerebellar peduncle'], 3, 'Pontocerebellar fibers enter chiefly through the middle cerebellar peduncle.')
    ])
  ]
};

const endocrine = {
  id: 17,
  title: 'The Endocrine System',
  summary: 'Connect a gland’s location and cell type to its signal, target and feedback. Predict hormone patterns after a change at a particular level of a pathway.',
  sections: [
    lesson('17.1', 'An Overview of the Endocrine System', [
      'Classify chemical communication by the path a signal takes to its target.',
      'Locate major endocrine organs and distinguish endocrine from exocrine secretion.'
    ], [
      'A hormone released into interstitial fluid enters the circulation and reaches many organs. Only cells with a suitable receptor and signaling machinery respond. A paracrine signal diffuses to nearby cells, and an autocrine signal acts on its cell of origin. At a chemical synapse a neuron releases its transmitter across a short cleft. The route gives the signal its classification. For example, norepinephrine can reach a target from a nerve ending or through the circulation.',
      'The pituitary lies beneath the hypothalamus, and the pineal gland lies farther back in the diencephalon. In the anterior neck the thyroid straddles the trachea, with small parathyroids usually on its posterior surface. The adrenals cap the kidneys and hormone-secreting islets sit within the pancreas. The ovaries and testes also secrete hormones. Other organs, including heart and kidney, use endocrine signals alongside their better-known functions.',
      'Endocrine glands release their product toward the blood supply. Exocrine tissue delivers secretions through ducts to an epithelial surface or lumen. Both arrangements coexist in the pancreas. Its digestive enzymes travel to the small intestine in a duct, whereas islet hormones enter local capillaries.'
    ], task('Follow two pancreatic products', 'Draw a route from each secretory cell to the place where its product will act.',
      ['Digestive enzyme', 'An acinar cell contributes enzyme to a duct that empties into the small intestine.'],
      ['Insulin', 'A beta cell releases insulin toward capillaries. Blood carries it to receptor-bearing targets such as skeletal muscle.'],
      ['Explain selectivity', 'Nearby blood vessels expose many cells to insulin, but the response requires a receptor and functioning downstream machinery.']
    ), [
      question('A chemical diffuses across interstitial fluid from one islet cell to a neighboring cell. How is this specific route classified?', ['Paracrine', 'Endocrine', 'Autocrine', 'Exocrine ductal'], 0, 'The target is a nearby different cell, reached locally through interstitial fluid.'),
      question('Which pairing correctly locates both glands?', ['Parathyroids above the kidneys and adrenals behind the thyroid', 'Adrenals above the kidneys and parathyroids usually behind the thyroid', 'Parathyroids inside the thymus and adrenals below the kidneys', 'Adrenals behind the pancreas at its tail and parathyroids anterior to the thyroid isthmus'], 1, 'The adrenal glands sit at the upper poles of the kidneys. The parathyroids are usually on the posterior thyroid.'),
      question('Two tissues receive the same blood concentration of a hormone. Only one responds. Which difference most directly explains this?', ['Proximity to an exocrine duct', 'Whether the tissue lies above the heart', 'The presence of functional hormone receptors', 'Whether blood contains any proteins'], 2, 'Circulation distributes a hormone broadly, while functional receptors confer target specificity.')
    ]),
    lesson('17.2', 'Hormones', [
      'Use hormone chemistry to predict receptor location and signal transmission.',
      'Distinguish humoral, neural and hormonal triggers and infer the effect of feedback.'
    ], [
      'Peptides and proteins consist of amino-acid chains, amines arise from modified single amino acids, and steroids derive from cholesterol. Most peptide hormones and catecholamines bind surface receptors. One common route activates a G protein and adenylyl cyclase, producing cyclic AMP. Another produces IP3, which releases stored calcium from the endoplasmic reticulum, and DAG. These cascades can amplify a small signal. Insulin uses a receptor with tyrosine kinase activity.',
      'Steroids cross cell membranes and act through intracellular receptors that alter transcription. Thyroid hormones are an important chemical exception. They derive from tyrosine yet act predominantly through nuclear receptors. Carrier proteins transport much of the steroid and thyroid hormone pool in blood. Target response also depends on free hormone, receptor abundance and interactions with other hormones. Receptor down-regulation can decrease sensitivity even when hormone is plentiful.',
      'An ion or nutrient change directly stimulating a gland is a humoral stimulus, as when a rise in glucose promotes insulin release. Preganglionic activation of the adrenal medulla is neural. TSH acting on the thyroid is hormonal. Negative feedback reduces the stimulus that initiated secretion. A positive loop amplifies an initiating event until an endpoint interrupts the loop, as occurs with oxytocin and cervical stretch during labor.'
    ], task('Find the amplifier', 'Follow a peptide signal that uses cAMP and predict two different interruptions.',
      ['Start at the membrane', 'One activated receptor can recruit multiple G proteins. Adenylyl cyclase produces many cAMP molecules.'],
      ['Interrupt the cascade', 'Blocking adenylyl cyclase limits the cAMP rise even when hormone binds its receptor.'],
      ['Change sensitivity', 'Fewer surface receptors can reduce response to an unchanged extracellular hormone concentration.']
    ), [
      question('An amino-acid-derived hormone alters transcription through nuclear receptors. Which hormone fits?', ['Glucagon', 'Epinephrine', 'Thyroid hormone', 'Oxytocin'], 2, 'Thyroid hormone derives from tyrosine yet normally acts through nuclear receptors.'),
      question('In an IP3-linked signaling pathway, what event follows an increase in IP3?', ['Adenylyl cyclase converts ATP to cAMP.', 'A hormone–receptor complex binds a nuclear response element.', 'A membrane receptor autophosphorylates on tyrosine residues.', 'Calcium is released from endoplasmic reticulum stores.'], 3, 'IP3 binds receptors on the endoplasmic reticulum, opening channels for stored calcium.'),
      question('A fall in circulating ionized calcium directly stimulates parathyroid cells. What class of stimulus is this?', ['Humoral', 'Neural', 'Hormonal', 'Synaptic'], 0, 'The gland detects a change in the ionic composition of extracellular fluid.')
    ]),
    lesson('17.3', 'The Pituitary Gland and Hypothalamus', [
      'Contrast the vascular route to the anterior pituitary with the axonal route to the posterior pituitary.',
      'Match pituitary hormones to their targets and trace a feedback signal upstream.'
    ], [
      'The infundibulum connects pituitary and hypothalamus. Releasing or inhibiting hormones enter a first capillary bed, travel through portal veins and reach a second capillary bed in the anterior lobe. Its endocrine cells synthesize TSH, ACTH, FSH, LH, growth hormone and prolactin. TSH acts on thyroid follicles, ACTH on adrenal cortex, and FSH and LH on gonads. Growth hormone influences metabolism and growth, partly through liver-derived IGF-1. Prolactin supports milk synthesis and is normally restrained by dopamine.',
      'The posterior lobe is neural tissue. Hypothalamic neurons synthesize antidiuretic hormone (ADH, or vasopressin) and oxytocin. Their axons transport the hormones down the stalk for storage and release from posterior pituitary terminals. Increased plasma osmolality normally promotes ADH release and water conservation by renal collecting ducts. Suckling can trigger oxytocin release, which contracts myoepithelial cells to eject milk already produced.',
      'For a thyroid axis, write hypothalamic TRH → pituitary TSH → thyroid T4 and T3. Free thyroid hormones feed back at the hypothalamus and pituitary. If the thyroid cannot make enough hormone, loss of feedback usually increases TSH when the upstream organs work. A pituitary production defect instead leaves TSH inadequately low for the low thyroid hormone level.'
    ], task('Compare a vessel with an axon', 'Show how two hypothalamic messages reach different pituitary lobes.',
      ['Anterior route', 'Trace TRH from hypothalamic capillaries through portal veins to anterior pituitary cells that secrete TSH.'],
      ['Posterior route', 'Trace ADH inside a hypothalamic axon to its terminals in the posterior pituitary, then into systemic blood.'],
      ['Compare interruptions', 'Interrupting portal flow removes normal regulatory signals to anterior cells. Interrupting axonal transport impairs replenishment of posterior terminal stores.']
    ), [
      question('Which structure makes the ADH released from posterior pituitary terminals?', ['Anterior pituitary endocrine cells', 'Hypothalamic neurons', 'Renal collecting duct cells', 'Posterior pituitary capillaries'], 1, 'ADH is synthesized in hypothalamic neuronal cell bodies and transported along their axons.'),
      question('Milk is present in mammary alveoli. Which signal directly promotes its ejection during suckling?', ['Prolactin acting on hypothalamic neurons', 'Growth hormone acting on liver', 'Oxytocin acting on myoepithelial cells', 'TSH acting on thyroid follicles'], 2, 'Oxytocin contracts cells around the alveoli and ducts. Prolactin supports milk synthesis.'),
      question('A primary thyroid defect lowers circulating T4 and T3 while hypothalamus and pituitary remain functional. Which TSH trend is expected?', ['It falls in proportion to T4.', 'It disappears because TRH cannot enter blood.', 'It becomes independent of pituitary secretion.', 'It rises as negative feedback weakens.'], 3, 'The usual inhibition supplied by thyroid hormones decreases, increasing upstream drive.')
    ]),
    lesson('17.4', 'The Thyroid Gland', [
      'Follow iodine and thyroglobulin through a follicle to the release of T4 and T3.',
      'Distinguish the hormones and roles of follicular and parafollicular cells.'
    ], [
      'The thyroid has two lobes linked by an isthmus anterior to the trachea. Its follicles are spheres lined by epithelial cells around colloid containing thyroglobulin. The cells take up iodide from blood and deliver it to the colloid. Iodine is attached to tyrosines on thyroglobulin and iodinated residues couple to form T3 and T4. When stimulated by TSH, cells retrieve colloid and cleave the protein, freeing hormone for release into blood.',
      'T4 contains four iodine atoms and T3 contains three. The thyroid secretes mainly T4, and peripheral tissues convert some of it to the more active T3. Thyroid hormone helps set basal energy use and heat production and supports normal growth and nervous system maturation. T3 and T4 reduce upstream TSH and TRH drive through negative feedback. Limited iodine can reduce synthesis even while sustained TSH stimulates gland growth.',
      'Parafollicular cells, also called C cells, produce calcitonin. Elevated calcium can promote calcitonin release, which limits osteoclast-mediated bone resorption. In adults, parathyroid hormone and vitamin D carry more of the day-to-day regulation of calcium. The calcitonin pathway uses different cells and a different stimulus from the follicular thyroid hormone pathway.'
    ], task('Read a thyroid follicle', 'Imagine a cross section from capillary to follicle center and back.',
      ['Blood to colloid', 'Iodide crosses the follicular cell to reach the thyroglobulin-rich lumen.'],
      ['Colloid to blood', 'TSH promotes colloid uptake and release of hormone from its protein scaffold.'],
      ['Outside the follicle lumen', 'Place a C cell between or beside follicles. Its calcium-related product is calcitonin.']
    ), [
      question('Which material is stored in the lumen of a thyroid follicle?', ['Thyroglobulin-rich colloid', 'ACTH-rich portal blood', 'Aldosterone granules', 'Parathyroid chief cells'], 0, 'Follicular cells surround an extracellular colloid reservoir containing thyroglobulin.'),
      question('In a simplified case of persistent iodine deficiency, why can thyroid enlargement accompany low thyroid hormone?', ['Lower TSH permits unchecked follicular growth.', 'Reduced feedback permits sustained TSH stimulation.', 'Less iodine increases T3 production and directly enlarges follicles.', 'Reduced feedback selectively stimulates C cells to expand.'], 1, 'Iodine limits synthesis. Increased pituitary drive can stimulate gland growth without correcting the substrate shortage.'),
      question('Which pair correctly identifies the source and effect of calcitonin?', ['Chief cells and greater renal calcium retention', 'Follicular cells and higher basal metabolism', 'Parafollicular cells and reduced bone resorption', 'Adrenal cortical cells and sodium retention'], 2, 'Thyroid C cells release calcitonin, which can inhibit osteoclast activity.')
    ]),
    lesson('17.5', 'The Parathyroid Glands', [
      'Predict the parathyroid response to falling ionized calcium.',
      'Separate the renal, skeletal and indirect intestinal effects of PTH.'
    ], [
      'Small parathyroid glands usually lie on the posterior thyroid. Their chief cells sense ionized calcium, the fraction available for functions such as neurotransmitter release and muscle contraction. Falling ionized calcium increases parathyroid hormone (PTH). As circulating calcium recovers, PTH secretion falls.',
      'PTH promotes calcium reabsorption and phosphate excretion in the kidney. It also stimulates formation of calcitriol, the active vitamin D hormone, in renal tissue. Calcitriol increases intestinal calcium absorption. In bone, sustained PTH promotes signals from osteoblast-lineage cells that increase osteoclast-mediated resorption. These routes move available calcium toward extracellular fluid or reduce its loss.',
      'Consider two separate predictions. Reduced PTH leaves the kidney with less stimulus to retain calcium and activate vitamin D. Excess PTH can maintain high circulating calcium at the expense of skeletal mineral. Calcium and phosphate need not move together in blood because PTH promotes the loss of phosphate in urine.'
    ], task('Account for calcium at three organs', 'Blood ionized calcium falls. Draw one direct renal effect and one indirect intestinal effect.',
      ['Kidney', 'PTH increases calcium conservation and promotes calcitriol formation while increasing phosphate excretion.'],
      ['Intestine', 'Calcitriol increases absorption of dietary calcium into the body.'],
      ['Bone and feedback', 'Increased resorption can release mineral. Restored blood calcium reduces the stimulus to chief cells.']
    ), [
      question('After a fall in free calcium, which glandular cell normally increases its secretion?', ['Thyroid C cell', 'Pancreatic alpha cell', 'Adrenal chromaffin cell', 'Parathyroid chief cell'], 3, 'Chief cells detect extracellular calcium and secrete PTH when it falls.'),
      question('Which step carries the PTH response from kidney to intestine?', ['Increased renal production of calcitriol', 'Renal secretion of calcitonin', 'Increased pituitary TSH release', 'Renal conversion of calcium to phosphate'], 0, 'Renal activation of vitamin D yields calcitriol, which promotes intestinal calcium absorption.'),
      question('What combination is expected from direct renal actions of PTH?', ['More calcium excretion and less phosphate excretion', 'More calcium reabsorption and more phosphate excretion', 'Less calcium reabsorption and less calcitriol production', 'More phosphate reabsorption and less calcitriol production'], 1, 'PTH conserves calcium while decreasing phosphate reabsorption, increasing urinary phosphate loss.')
    ]),
    lesson('17.6', 'The Adrenal Glands', [
      'Match the three cortical zones and the medulla to their products.',
      'Distinguish the control of cortisol, aldosterone and catecholamine secretion.'
    ], [
      'Each adrenal gland has an outer cortex and a central medulla. From outside inward, the cortical zones are glomerulosa, fasciculata and reticularis. They chiefly produce aldosterone, cortisol and adrenal androgens, respectively. These steroids derive from cholesterol. The medulla contains chromaffin cells that release catecholamines in response to sympathetic preganglionic input.',
      'Aldosterone promotes sodium reabsorption and potassium secretion in the distal nephron. Angiotensin II and elevated plasma potassium are important stimuli. Sodium retention helps preserve extracellular fluid volume when water is available. Cortisol has a different controller. Hypothalamic CRH stimulates pituitary ACTH, which drives cortisol secretion. Cortisol helps mobilize fuel and limits inflammatory activity, then feeds back to reduce CRH and ACTH.',
      'During an acute challenge, preganglionic fibers can rapidly activate medullary release of epinephrine and norepinephrine. These signals alter cardiovascular activity and make fuel available. Cortisol-mediated changes can support a more sustained response. Separating the cortical and medullary routes helps explain why an isolated interruption of ACTH would leave the medulla capable of responding to an intact sympathetic input.'
    ], task('Read from capsule to center', 'Assign a major product and controller to each adrenal region.',
      ['Outer cortex', 'The zona glomerulosa releases aldosterone in response to angiotensin II or elevated potassium.'],
      ['Middle and inner cortex', 'The fasciculata makes cortisol under ACTH drive. The reticularis produces adrenal androgens.'],
      ['Medulla', 'Preganglionic ACh stimulates chromaffin cells and catecholamines enter the circulation.']
    ), [
      question('Which adrenal region directly responds to a sympathetic preganglionic signal by releasing catecholamines?', ['Zona fasciculata', 'Adrenal medulla', 'Zona glomerulosa', 'Zona reticularis'], 1, 'Chromaffin cells in the medulla respond to cholinergic preganglionic fibers.'),
      question('A sustained rise in circulating potassium directly favors secretion of which hormone?', ['Cortisol from the fasciculata', 'Epinephrine from the medulla', 'Aldosterone from the glomerulosa', 'Androgen from the reticularis'], 2, 'Elevated potassium is a major stimulus for aldosterone, which supports renal potassium excretion.'),
      question('An intact cortisol axis is exposed to persistently elevated cortisol from an external source. What upstream change is expected?', ['Both CRH and ACTH increase.', 'CRH rises while ACTH is unaffected.', 'ACTH increases without CRH.', 'Both CRH and ACTH tend to decrease.'], 3, 'Circulating cortisol supplies negative feedback to hypothalamus and anterior pituitary.')
    ]),
    lesson('17.7', 'The Pineal Gland', [
      'Trace environmental light information from retina to circadian clock and pineal gland.',
      'Explain how a rapid time-zone change separates external clock time from internal night.'
    ], [
      'Pinealocytes in a small gland near the posterior roof of the third ventricle synthesize melatonin from serotonin. Light information reaches the hypothalamic suprachiasmatic nucleus (SCN) from the retina. The SCN coordinates circadian timing and controls the pineal gland through a multisynaptic sympathetic route. Melatonin generally rises during biological night when light is dim. Bright light at night can suppress that rise.',
      'Melatonin signals the internal timing of darkness. It is one output of a circadian system that also times changes in alertness, temperature and other physiological functions. After rapid travel across time zones, a clock on the wall changes immediately while the SCN and its outputs take time to align with the new light schedule. Two people sampled at the same local hour can therefore be at different biological phases.'
    ], task('Compare two clocks', 'A traveler arrives where it is noon while their body is still on a schedule corresponding to midnight.',
      ['Set the labels', 'Mark local noon separately from the traveler’s estimated biological night.'],
      ['Predict the mismatch', 'Circadian sleepiness can persist at local noon while the internal rhythm is still aligned to the previous time zone.'],
      ['Follow the cue', 'Retinal light input helps the SCN adjust over time, and its pineal output gradually shifts with the new schedule.']
    ), [
      question('Which sequence carries environmental light information into the melatonin control pathway?', ['Pineal gland → lens → medulla', 'Pituitary → retina → cochlea', 'Retina → suprachiasmatic nucleus → autonomic output to pineal', 'Adrenal cortex → retina → thyroid'], 2, 'The retina supplies photic timing information to the SCN, whose downstream circuits regulate pineal output.'),
      question('Which change is expected when bright light is presented during the usual dark phase?', ['A larger nocturnal melatonin peak', 'A melatonin surge independent of the retinal signal', 'Identical melatonin output to a dark-night control', 'Suppression of the usual nocturnal melatonin rise'], 3, 'Light at biological night can suppress pineal melatonin secretion through the circadian control pathway.'),
      question('Why might a traveler feel sleepy at local midday after a rapid time-zone change?', ['Internal circadian timing still partly reflects the former time zone.', 'Internal night resets as soon as local clock time changes.', 'Daylight acutely increases the usual melatonin signal.', 'The SCN receives timing information only from meal frequency.'], 0, 'Internal rhythms adjust over time and can initially remain out of phase with local day and night.')
    ]),
    lesson('17.8', 'Gonadal and Placental Hormones', [
      'Connect pituitary FSH and LH to gonadal targets and feedback from inhibin.',
      'Explain how early pregnancy maintains progesterone production and how the placental role changes.'
    ], [
      'Pulsatile hypothalamic GnRH stimulates anterior pituitary FSH and LH. In the testes, LH stimulates Leydig cells to produce testosterone. FSH acts on Sertoli cells, which help support spermatogenesis and produce inhibin. In the ovaries, FSH supports follicular growth and estradiol production. LH supports steroid synthesis and its midcycle surge triggers ovulation. After ovulation the corpus luteum secretes progesterone, which helps maintain a secretory endometrium.',
      'Testosterone and estrogens affect reproductive tissues, secondary sex characteristics and tissues such as bone. Both testes and ovaries produce inhibin, which reduces pituitary FSH secretion. Most gonadal steroid feedback is negative. Sustained high estradiol near midcycle can instead contribute to the positive feedback producing the LH surge.',
      'In early pregnancy, developing placental tissue releases human chorionic gonadotropin (hCG), which preserves corpus luteum hormone secretion. Placental progesterone and estrogen production later becomes sufficient to support pregnancy. Human placental lactogen helps shift maternal nutrient use and supports mammary development. Relaxin contributes to changes in connective tissues associated with pregnancy.'
    ], task('Follow a changing source', 'Explain why the source of progesterone depends on the stage of pregnancy.',
      ['After ovulation', 'The corpus luteum releases progesterone, supporting the uterine lining.'],
      ['After implantation', 'Developing trophoblast secretes hCG, which supports the corpus luteum during early pregnancy.'],
      ['As the placenta develops', 'Placental steroid production increases and assumes the main role in maintaining progesterone availability.']
    ), [
      question('Which pairing accurately describes a testicular endocrine pathway?', ['LH stimulates Leydig cells to produce testosterone.', 'FSH directly triggers Leydig cells to produce hCG.', 'Inhibin stimulates pituitary FSH release.', 'Sertoli cells secrete placental lactogen.'], 0, 'LH targets Leydig cells. FSH acts on Sertoli cells, which secrete inhibin.'),
      question('Which early pregnancy signal sustains corpus luteum secretion?', ['Parathyroid hormone', 'Human chorionic gonadotropin', 'Atrial natriuretic peptide', 'Melatonin'], 1, 'hCG from developing placental tissue acts on LH receptors of the corpus luteum.'),
      question('A rise in gonadal inhibin is followed most directly by a decrease in which pituitary hormone?', ['Prolactin', 'ACTH', 'FSH', 'Growth hormone'], 2, 'Inhibin provides relatively selective negative feedback on FSH secretion.')
    ]),
    lesson('17.9', 'The Endocrine Pancreas', [
      'Predict fuel movement between blood, liver, muscle and fat after a meal or during fasting.',
      'Distinguish insufficient insulin secretion from reduced target-cell responsiveness.'
    ], [
      'Pancreatic islets contain beta cells that release insulin, alpha cells that release glucagon, delta cells that release somatostatin and PP cells that release pancreatic polypeptide. The surrounding acinar tissue supplies digestive secretions. Islet capillaries allow these small clusters to coordinate fuel handling well beyond the pancreas.',
      'After an absorbable carbohydrate meal, rising glucose stimulates beta cells. Insulin promotes GLUT4-mediated glucose uptake by skeletal muscle and adipose tissue. In liver it favors glycogen synthesis and suppresses glucose output. As glucose falls between meals, glucagon acts chiefly on liver, first favoring glycogen breakdown and also supporting glucose production from other substrates. Muscle glycogen chiefly supplies the muscle that stores it.',
      'A glucose measurement reports the result of several processes. In type 1 diabetes, autoimmune destruction of beta cells leads to marked insulin deficiency. In type 2 diabetes, reduced responsiveness to insulin can initially coexist with substantial insulin secretion. Over time beta cells may fail to meet demand. A high glucose value alone does not identify which mechanism predominates.'
    ], task('Move the fuel arrows', 'Draw the direction of net glucose movement under two conditions.',
      ['After a meal', 'Insulin rises. Muscle takes up glucose and liver favors glycogen storage.'],
      ['Between meals', 'Glucagon supports hepatic glucose release. Draw an arrow from liver toward blood.'],
      ['Change the target', 'If muscle responds weakly to insulin, less glucose may enter it at the same hormone concentration.']
    ), [
      question('In the hours between meals, which response helps sustain circulating glucose?', ['Insulin-driven fat storage', 'Somatostatin-driven muscle glucose export', 'Glucagon-driven liver glycogen synthesis', 'Glucagon-driven liver glucose output'], 3, 'Glucagon favors hepatic glycogen breakdown and gluconeogenesis, supplying glucose to blood.'),
      question('A model has high glucose and abundant insulin, yet muscle glucose uptake remains weak. Which mechanism best fits?', ['Reduced target-cell response to insulin', 'Reduced insulin release as the sole abnormality', 'Increased muscle uptake of glucose at a given insulin level', 'A stimulus confined to exocrine acinar secretion'], 0, 'The hormone is available, but the response of its target is reduced.'),
      question('Which islet cell and hormone pair generally promotes fuel storage after a carbohydrate meal?', ['Alpha cell and glucagon', 'Beta cell and insulin', 'Delta cell and somatostatin', 'PP cell and pancreatic polypeptide'], 1, 'Beta-cell insulin favors glucose uptake in muscle and adipose tissue and storage of fuel.')
    ]),
    lesson('17.10', 'Organs with Secondary Endocrine Functions', [
      'Link a local observation in heart, kidney or intestine to a hormone and its remote effect.',
      'Trace the participation of skin, liver and kidney in producing active vitamin D.'
    ], [
      'Atrial muscle senses stretch as blood returns to the heart. Atrial natriuretic peptide (ANP) favors renal loss of sodium and water, helping reduce excess volume. The kidney also releases erythropoietin (EPO) in response to reduced oxygen availability. EPO acts on erythroid precursors in red marrow to support red blood cell production. Renin from the kidney initiates a hormone cascade that supports arterial pressure and sodium retention.',
      'Digestion recruits endocrine cells distributed through the gut lining. Gastrin promotes gastric acid secretion. Acid arriving in the duodenum triggers secretin, which promotes a bicarbonate-rich pancreatic secretion. Fat and protein digestion products stimulate cholecystokinin, which promotes pancreatic enzyme release and gallbladder contraction. The position of a cell helps explain which change it can detect.',
      'Skin produces a vitamin D precursor that is modified first in the liver and then in the kidney to form calcitriol. Bone cells produce FGF23, which promotes renal phosphate loss. Adipocytes secrete leptin, supplying the brain with information about stored energy, and adiponectin, which influences insulin sensitivity. Thymic signaling molecules support the development of T lymphocytes. A tissue can therefore be the sender in one pathway and the target in another.'
    ], task('Match stimulus, messenger and recipient', 'Complete three communication chains that begin outside a traditional endocrine gland.',
      ['Atrial stretch', 'Stretched atrial cells release ANP. Renal responses favor loss of sodium and water.'],
      ['Low renal oxygen', 'The kidney releases EPO. Red marrow increases support for erythrocyte production.'],
      ['Acidic chyme', 'Duodenal cells release secretin. Pancreatic duct cells contribute bicarbonate that helps neutralize the acid.']
    ), [
      question('Increased filling stretches the atrial walls. Which output would help oppose the volume increase?', ['Renin promoting sodium retention', 'ANP promoting renal sodium loss', 'EPO promoting erythropoiesis', 'Leptin signaling fat stores'], 1, 'ANP links atrial stretch to natriuresis and accompanying water loss.'),
      question('A kidney senses reduced oxygen availability for an extended period. Which target receives its signal supporting oxygen transport?', ['Pancreatic beta cells receive secretin.', 'Thyroid follicles receive PTH.', 'Red marrow erythroid precursors receive EPO.', 'Adrenal chromaffin cells receive calcitonin.'], 2, 'Renal EPO supports red cell production in the marrow, increasing potential oxygen-carrying capacity.'),
      question('Which organ sequence leads from skin-derived vitamin D precursor to calcitriol?', ['Kidney → skin → liver', 'Skin → kidney → thyroid', 'Liver → thyroid → kidney', 'Skin → liver → kidney'], 3, 'A precursor produced in skin is hydroxylated in liver and then activated in kidney.')
    ]),
    lesson('17.11', 'Development and Aging of the Endocrine System', [
      'Distinguish the embryonic origins of neighboring endocrine tissues.',
      'Use feedback to explain a life-stage change in both a target hormone and its pituitary controller.'
    ], [
      'Endocrine tissues come from several embryonic sources. The anterior pituitary develops from an upward pocket of oral ectoderm, while the posterior pituitary develops as a neural outgrowth of the diencephalon. The adrenal cortex is mesodermal, and its neighboring medulla develops from neural crest cells. The thyroid follicular epithelium, parathyroid epithelium and pancreatic islet cells arise from endoderm. Final position alone can conceal very different developmental histories.',
      'These origins help explain adult structure. The anterior pituitary is secretory epithelium controlled through a portal circulation. The posterior lobe contains the terminals of hypothalamic neurons. Likewise, the neural crest origin of adrenal chromaffin cells fits their sympathetic preganglionic innervation, whereas the cortical cells synthesize steroids.',
      'With age, changes can affect secretion, clearance or target responsiveness. Growth hormone output generally decreases with age. At menopause, diminished ovarian follicular function reduces estradiol and inhibin feedback, and pituitary FSH generally rises. The directions differ across a feedback loop. Variation among people and across hormones makes a single general prediction for all endocrine output unreliable.'
    ], task('Explain one organ boundary and one feedback change', 'Use development to explain structure, then use feedback to explain a life-stage hormone pattern.',
      ['Trace the pituitary boundary', 'Label oral ectoderm on the anterior lobe and neural ectoderm on the posterior lobe. Connect the latter to hypothalamic axons.'],
      ['Trace the adrenal boundary', 'Label mesoderm on the cortex and neural crest on the medulla. Connect the latter to a sympathetic preganglionic fiber.'],
      ['Predict a feedback change', 'Reduced ovarian inhibin and estradiol at menopause reduce inhibitory feedback. Higher FSH is a typical consequence.']
    ), [
      question('Which tissue pair shares an organ but has different embryonic origins?', ['Two neighboring thyroid follicular cells', 'Two adjacent pancreatic beta cells', 'Adrenal cortex and adrenal medulla', 'Two neighboring parathyroid chief cells'], 2, 'The adrenal cortex arises from mesoderm and the medulla from neural crest.'),
      question('Which origin fits the axon-containing posterior pituitary?', ['An outgrowth of intestinal endoderm', 'Somitic skeletal muscle mesoderm', 'A pocket of oral ectoderm', 'Neural ectoderm of the diencephalon'], 3, 'The neural outgrowth forms the posterior lobe. The oral ectoderm pocket contributes to the anterior lobe.'),
      question('After menopause, which feedback pattern is expected?', ['Less ovarian inhibin and estradiol with higher FSH', 'More ovarian inhibin with higher FSH', 'Less ovarian inhibin and estradiol with lower FSH', 'More progesterone from a persistent corpus luteum with lower FSH'], 0, 'Loss of ovarian negative feedback permits FSH to rise.')
    ])
  ]
};

export const chapters = [autonomic, neurological, endocrine];
export { renderLab, mountLab } from './ap2-regulation-labs.js';
