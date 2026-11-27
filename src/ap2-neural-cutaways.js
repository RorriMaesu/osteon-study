const step=(surface,detail)=>[surface,detail];

const cordTargets=[
  step('Dorsal gray horn','Slender posterior gray projection. Incoming pain and temperature fibers can synapse here.'),
  step('Ventral gray horn','Broader anterior gray projection containing somatic lower motor neuron cell bodies.'),
  step('Dorsal white column','White matter behind the dorsal horns carries ascending vibration and discriminative touch fibers.'),
  step('Lateral white column','White matter on the side of the cord carries multiple ascending and descending tracts.'),
  step('Ventral white column','White matter anterior to the gray horn, alongside the anterior median fissure.'),
  step('Gray commissure','The gray bridge joining the two sides surrounds the central canal.'),
  step('Central canal','A narrow CSF-filled lumen within the gray commissure. Blue marks the lumen in this reconstruction.'),
  step('Dorsal root','Sensory axons enter the cord at the posterolateral surface through dorsal rootlets.'),
  step('Dorsal root ganglion','Sensory neuron cell bodies occupy the swelling on the dorsal root. No synapse is required inside this ganglion.'),
  step('Ventral root','Motor axons exit through anterior rootlets. The ventral root has no sensory ganglion.'),
  step('Spinal nerve','The short mixed nerve contains sensory and motor axons after the two roots meet.')
];
const axonTargets=[
  step('Axon','Local current spreads through the axon beneath the sheath. The cutaway opens the insulation lengthwise.'),
  step('Myelin internode','Concentric layers of compact myelin insulate an axon between nodes.'),
  step('Node of Ranvier','At each gap in myelin, the exposed axolemma contains voltage-gated channels that regenerate the signal.')
];
const cardiacTargets=[
  step('Medulla relay','Cardiac vagal preganglionic neuron cell bodies are located in the medulla.'),
  step('Upper thoracic cord','Preganglionic sympathetic neurons to the heart arise in upper thoracic spinal segments.'),
  step('Sympathetic preganglionic fiber','Axons leave through the ventral root and reach the chain through a white ramus communicans.'),
  step('Sympathetic chain ganglion','Acetylcholine activates nicotinic receptors at the synapse between the two neurons.'),
  step('Sympathetic cardiac fiber','A postganglionic cardiac nerve carries signals toward the cardiac plexus and heart.'),
  step('Vagal preganglionic fiber','Preganglionic fibers from the medulla travel within the vagus to ganglia close to the heart.'),
  step('Intrinsic cardiac ganglion','Preganglionic vagal fibers release acetylcholine onto nicotinic receptors here, near the effector.'),
  step('Parasympathetic cardiac fiber','A short postganglionic axon releases acetylcholine onto muscarinic receptors at the heart.'),
  step('SA node region','The sinoatrial node lies in the superior right atrium near the entry of the superior vena cava.')
];
export const cutaways={
  cord:{
    title:'Spinal cord, roots and ganglion',file:'spinal-section',direction:[0,.22,1],
    credit:'Original teaching reconstruction of a spinal segment in transverse section. The starting view looks from the cranial end, with dorsal toward the top and the deep anterior fissure below.',
    targets:cordTargets,routes:[
      ['Sensory input',[
        step('Spinal nerve','Start at the short mixed nerve and follow a sensory fiber toward the cord.'),
        cordTargets[8],cordTargets[7],step('Dorsal gray horn','In this pain pathway, the central branch enters the dorsal horn and can synapse onto a second-order neuron.')]],
      ['Motor output',[cordTargets[1],cordTargets[9],step('Spinal nerve','The motor axon joins sensory fibers in a mixed spinal nerve and continues to skeletal muscle.')]],
      ['Vibration and fine touch',[cordTargets[10],cordTargets[8],cordTargets[7],step('Dorsal white column','Many fine-touch and vibration afferents ascend ipsilaterally in a dorsal column to the medulla before crossing.')]]
    ]
  },
  axon:{
    title:'Open a myelinated axon',file:'myelinated-axon',direction:[.24,-1,-.46],
    credit:'A magnified longitudinal cutaway exposes the axon inside the myelin wraps. The enlargement and playback time illustrate conduction qualitatively.',
    targets:axonTargets,routes:[
      ['Intact myelin',[step('First node','Voltage-gated sodium channels at the first node regenerate an action potential.'),step('Middle myelin','Current spreads rapidly beneath compact myelin, which limits current loss and reduces effective membrane capacitance.'),step('Second node','The downstream node reaches threshold and regenerates a full action potential.')]],
      ['Focal myelin loss',[step('First node','The proximal node still fires. Predict whether the downstream node reaches threshold when enough current leaks out.'),step('Axon','The middle internode is exposed. More current leaks across the membrane and more charge is needed to change its voltage.'),step('Second node','In this severe example, the downstream node receives too little current to reach threshold. Less extensive damage may slow conduction without blocking it.')]]
    ]
  },
  'cardiac-autonomic':{
    title:'Two neural routes to the heart',file:'cardiac-autonomic',direction:[.47,.12,1],
    credit:'The heart walls and T3 vertebra come from the BodyParts3D chest. Colored paths, ganglia and the pacemaker region are enlarged teaching reconstructions in that frame. One representative sympathetic route is shown.',
    targets:cardiacTargets,routes:[
      ['Sympathetic · increase rate',[cardiacTargets[1],cardiacTargets[2],cardiacTargets[3],cardiacTargets[4],step('SA node region','Norepinephrine activates beta-1 receptors, increasing the rate of pacemaker depolarization.')]],
      ['Parasympathetic · decrease rate',[cardiacTargets[0],cardiacTargets[5],cardiacTargets[6],cardiacTargets[7],step('SA node region','Acetylcholine activates M2 receptors, slowing the pacemaker rate.')]]
    ]
  }
};
export const normalizeNeuroName=str=>str.toLowerCase().replace(/[_. ]/g,'');
export function cutawayMatch(label,meshName){
  if(label==='Myelin internode')return meshName.endsWith('myelin');
  if(label==='Node of Ranvier')return meshName==='firstnode'||meshName==='secondnode';
  return normalizeNeuroName(label)===meshName;
}
export function cutawayColor(n){
  if(n.includes('white'))return '#dfd6bd';
  if(n.includes('gray'))return '#ad827e';
  if(n==='centralcanal')return '#4dabc1';
  if(n.endsWith('myelin'))return '#76a4b2';
  if(n.includes('ganglion'))return '#d49979';
  if(n.startsWith('wallof'))return '#a67b78';
  if(n==='axon'||n==='ventralroot'||n==='dorsalroot'||n==='spinalnerve')return '#ceb68c';
  return '#87aaa9';
}
export const brainTargets=[
  ['Lateral ventricles','Paired fluid spaces arch through the cerebral hemispheres.','lateralventricle'],
  ['Third ventricle','This midline space lies between the thalami.','thirdventricle'],
  ['Cerebral aqueduct','A narrow channel inside the midbrain joins the third and fourth ventricles.','aqueductofmidbrain'],
  ['Fourth ventricle','This cavity lies behind the pons and upper medulla.','fourthventricle'],
  ['Caudate nucleus','Its curved body follows the lateral ventricle.','caudatenucleus'],
  ['Putamen','The lateral portion of the lentiform nucleus lies lateral to the globus pallidus.','putamen'],
  ['Globus pallidus','The medial portion of the lentiform nucleus lies medial to the putamen.','globuspallidus'],
  ['Thalamus','These paired masses form much of the lateral walls of the third ventricle.','thalamus'],
  ['Midbrain','The superior brainstem surrounds the cerebral aqueduct.','midbrain'],
  ['Pons','The prominence above the medulla lies ventral to the fourth ventricle.','pons'],
  ['Medulla oblongata','The most caudal part of the brainstem is continuous with the spinal cord.','medullaoblongata'],
  ['Precentral gyrus','This cortical ridge anterior to the central sulcus contains primary motor cortex.','precentralgyrus']
];

export const routeQuestions={
  cord:[
    ['If the dorsal root is interrupted before this signal enters the cord, which function is directly affected?', ['Incoming sensory information from this root','Motor axons leaving through the ventral root','All movement and feeling on both sides'],0,'The injured dorsal root carries sensory input. A ventral root carries motor output.'],
    ['Suppose the ventral root is interrupted. Which observation fits?', ['Sensory neuron cell bodies disappear from the dorsal ganglion','Motor output through this root is lost while sensory input can still enter','All ascending pathways cross immediately'],1,'Motor axons leave through the ventral root. Sensory fibers can still enter an intact dorsal root.'],
    ['Where does fine-touch information from the right foot ascend before reaching the medulla?', ['Left ventral horn','Left dorsal column','Right dorsal column'],2,'First-order dorsal column fibers ascend on the side of entry and synapse in the medulla before the pathway crosses.']
  ],
  axon:[
    ['Where is the next action potential regenerated?', ['Inside a myelin wrap','At the next exposed node','Inside every layer of compact myelin'],1,'Local current spreads through the internode. The next node has the voltage-gated channels needed to regenerate the spike.'],
    ['If enough current escapes the damaged internode, what can happen at the next node?', ['It fires a spike twice as large','It fires sooner','Its membrane stays below threshold'],2,'Severe myelin loss can block conduction. Less severe damage may delay the next spike.']
  ],
  'cardiac-autonomic':[
    ['After this pathway’s postganglionic cell is activated, what happens at the pacemaker?', ['Norepinephrine acting on β1 receptors increases firing rate','Acetylcholine acting on nicotinic receptors lowers firing rate','Norepinephrine acting on M2 receptors stops all firing'],0,'The ganglionic synapse uses acetylcholine and nicotinic receptors. At the pacemaker, sympathetic norepinephrine acts mainly through β1 receptors.'],
    ['Which event at the pacemaker follows activation of this route?', ['Norepinephrine acts on β1 receptors and increases rate','Acetylcholine acts on M2 receptors and slows firing','Acetylcholine acts on a skeletal motor end plate'],1,'Vagal preganglionic axons synapse in or near the heart. Short postganglionic axons release acetylcholine onto M2 receptors.']
  ]
};
