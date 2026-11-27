const part=(name,color,detail)=>({name,color,detail});
export const cellularNeuralRegions={
  'multipolar-neuron':{
    title:'A multipolar neuron from dendrites to terminals',
    intro:'Start at the branching dendrites on the left. Follow the signal past the cell body and along the myelinated axon to its terminals. The cut face exposes the nucleus. Axon length is compressed and the myelin gaps are enlarged.',
    view:[.03,.10,1], reconstruction:true,
    link:['12.5/activity/chemical-synapse','Magnify a chemical synapse at an axon terminal'],
    parts:[
      part('Dendrites','#a7b9a4','Multiple branched processes receive signals from other cells. Local changes in membrane voltage spread toward the cell body.'),
      part('Cell body','#c3a28e','The soma contains the nucleus and much of the machinery for making proteins. Inputs from dendrites and soma influence voltage at the initial segment.'),
      part('Nucleus','#9c83aa','The nucleus contains the neuron’s DNA. The front of the soma has been cut away to show it inside the cell body.'),
      part('Axon hillock','#c69772','The cell body narrows into this cone at the origin of the single axon. Follow it toward the initial segment.'),
      part('Initial segment','#d6b16d','This short region next to the hillock contains many voltage-gated sodium channels. An action potential typically starts here when threshold is reached.'),
      part('Axon','#ceac73','The axon carries action potentials toward its terminals. Select Show alone to follow its continuity beneath the myelin.'),
      part('Myelin sheath','#93b6c1','Myelinating glia wrap successive segments of the axon in layers of membrane. Current spreads rapidly beneath each insulating sheath.'),
      part('Nodes of Ranvier','#e0b664','Each short band marks exposed axonal membrane between myelin segments. Voltage-gated channels regenerate the action potential at these nodes.'),
      part('Axon terminals','#bf957f','Terminal branches end in boutons. Open the synapse close-up to see how an arriving action potential can trigger chemical transmission.')
    ]
  },
  'chemical-synapse':{
    title:'A chemical synapse at an axon terminal',
    intro:'Look into the cut face of the sending terminal above the receiving membrane. Follow vesicles to the release face, then trace the small transmitter particles across the bracketed gap. The gap and membrane proteins are enlarged for inspection.',
    view:[.21,.15,1], reconstruction:true,
    link:['12.2/activity/multipolar-neuron','Return to the whole multipolar neuron'],
    parts:[
      part('Presynaptic terminal','#9bb7a7','An action potential depolarizes the axon terminal. Its lower membrane faces the synaptic cleft and contains the release site.'),
      part('Synaptic vesicles','#c79b76','Vesicles hold neurotransmitter. The open profile at the lower membrane shows a vesicle fused with the terminal during exocytosis.'),
      part('Voltage-gated calcium channels','#829ec9','Depolarization opens these channels in the presynaptic membrane. Calcium enters the terminal and helps trigger vesicle fusion.'),
      part('Neurotransmitter','#e5bb55','The small particles represent transmitter released from the vesicle. Molecules diffuse across the extracellular gap and may bind receptors.'),
      part('Synaptic cleft','#ccba91','The bracket marks the extracellular space between the two membranes. Transmitter diffuses through the fluid in this gap.'),
      part('Postsynaptic membrane','#b891ad','This receiving patch of membrane faces the sending terminal. Receptor activation changes signaling in the postsynaptic cell.'),
      part('Ligand-gated receptors','#87afa4','The receptors shown are ion channels. Binding of the appropriate transmitter opens the pore and changes ion flow across the postsynaptic membrane.')
    ]
  }
};
