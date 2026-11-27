// Each station uses a novel observation. The accessible description reports the same evidence as the diagram.
function evidence(section,slug,prompt,stimulus,choices,answer,why){
  return {id:'ap2-'+section+'-'+slug,section,type:'visual',skill:'Interpret evidence',prompt,stimulus,choices,answer,why};
}
function pathDiagram(alt,labels,segments){
  const words=labels.map(([x,y,text])=>'<text x="'+x+'" y="'+y+'">'+text+'</text>').join('');
  const paths=segments.map(([d,dash])=>'<path d="'+d+'" fill="none" stroke="'+(dash?'#ffc897':'#9ce1c8')+'" stroke-width="4" '+(dash?'stroke-dasharray="6 5"':'')+'/>').join('');
  return {alt,svg:'<svg xmlns="http://www.w3.org/2000/svg" role="img" viewBox="0 0 450 188" font-family="system-ui,sans-serif" font-size="15" fill="#eef6f3"><rect width="450" height="188" rx="9" fill="#17302e"/>'+paths+words+'</svg>'};
}
export const evidenceItems=[
  evidence('12.4','paired-recordings','Recordings were made 4 cm apart on one healthy axon. Which conduction velocity best fits the two peak times?',
    pathDiagram('The first action potential peaks at 2 ms, the second at 4 ms. Recording sites are separated by 4 cm.',
      [[12,25,'Electrode A'],[12,94,'Electrode B'],[116,67,'2 ms'],[257,138,'4 ms'],[12,175,'Same stimulus · 4 cm between electrodes']],
      [['M98 49 H125 L135 10 L148 54 L161 49 H418'],['M98 117 H268 L278 78 L291 122 L304 117 H418',true]]),
    ['2 m/s','20 m/s','200 m/s','0.5 m/s'],1,'The transit interval is 0.002 s over 0.04 m. Speed = distance ÷ time = 20 m/s.'),
  evidence('13.3','fluid-map','Which interruption best explains this distribution of ventricular enlargement?',
    {columns:['Space','Relative to baseline'],rows:[['Left lateral ventricle','Enlarged'],['Right lateral ventricle','Usual size'],['Third ventricle','Usual size'],['Fourth ventricle','Usual size']]},
    ['Left interventricular foramen','Cerebral aqueduct','All apertures of the fourth ventricle','Right interventricular foramen'],0,'Only the left lateral ventricle lies upstream of the left interventricular foramen. An aqueduct obstruction would affect both lateral ventricles and the third.'),
  evidence('14.2','vibration-crossing','A right-leg vibration signal follows the solid line and then the dashed segment. Which location matches the crossing shown?',
    pathDiagram('Signal ascends from the right leg on the right side of the spinal cord, crosses at X in the brainstem and continues on the left toward the thalamus.',
      [[32,24,'Left'],[351,24,'Right'],[20,54,'Thalamus'],[179,82,'X'],[24,127,'Spinal cord'],[306,167,'Right leg']],
      [['M331 147 V112 L298 96'],['M298 96 L140 67 L119 49',true]]),
    ['Caudal medulla','Ventral root','Primary sensory cortex','Dorsal root ganglion'],0,'Vibration from the leg ascends in the ipsilateral dorsal column. Second-order fibers cross in the medulla and ascend in the medial lemniscus.'),
  evidence('15.1','adrenal-branch','Which target occupies X on the second branch of this sympathetic pathway?',
    pathDiagram('One branch goes from the spinal cord to a sympathetic ganglion and then an organ. The other goes from the spinal cord to X, followed by release into blood.',
      [[14,95,'Spinal cord'],[164,42,'Sympathetic ganglion'],[352,40,'Organ'],[192,142,'X'],[302,141,'Bloodstream']],
      [['M110 86 L154 42'],['M315 37 H342'],['M110 94 L183 133'],['M213 135 H294',true]]),
    ['Dorsal root ganglion','Adrenal medulla','Anterior pituitary','Thyroid follicle'],1,'Preganglionic sympathetic fibers activate adrenal chromaffin cells, which release catecholamines into the circulation.'),
  evidence('16.3','pupil-matrix','Which isolated defect best accounts for these four pupil observations?',
    {columns:['Light stimulus','Left pupil','Right pupil'],rows:[['Light in left eye','Constricts','Stays large'],['Light in right eye','Constricts','Stays large']]},
    ['Right efferent pupillary pathway','Left afferent pupillary pathway','Right afferent pupillary pathway','Both afferent pathways'],0,'Either eye can supply sensory input because the left pupil responds to both stimuli. Failure follows the right pupil regardless of the eye illuminated.'),
  evidence('17.4','paired-hormones','Which feedback explanation best fits both measurements in sample B? Assume the hypothalamus and pituitary respond normally.',
    {columns:['Sample','Free T4','TSH'],rows:[['A','Within reference interval','Within reference interval'],['B','Below reference interval','Above reference interval']]},
    ['Reduced thyroid output weakens negative feedback','Excess thyroid output suppresses TSH','Loss of pituitary secretion deprives the thyroid of TSH','A rise in T4 directly increases TSH'],0,'The low thyroid hormone level reduces feedback inhibition. An intact pituitary increases TSH drive.'),
  evidence('19.3','valve-reopens','Between observations 2 and 3, which valve can open, and what pressure change explains it?',
    {columns:['Observation','LA (mmHg)','LV (mmHg)','Aorta (mmHg)'],rows:[['1','9','70','84'],['2','10','15','82'],['3','11','6','80']]},
    ['Mitral, because atrial pressure exceeds ventricular pressure','Aortic, because aortic pressure exceeds ventricular pressure','Mitral, because aortic pressure exceeds atrial pressure','Aortic, because the atrium is filling'],0,'The LV has relaxed below left atrial pressure at observation 3. That gradient opens the mitral valve while the aortic valve remains closed.'),
  evidence('20.5','pedal-circuit','Which vessel completes the arterial path on the upper branch?',
    pathDiagram('Arterial blood reaches the knee through the popliteal artery. Branch A continues via X to dorsalis pedis on the dorsum of the foot. Branch B supplies the plantar foot.',
      [[15,94,'Popliteal'],[155,55,'X'],[277,49,'Dorsalis pedis'],[130,143,'Posterior tibial'],[315,144,'Plantar foot']],
      [['M90 86 L143 53'],['M176 50 H264'],['M90 96 L119 133'],['M239 138 H301',true]]),
    ['Anterior tibial artery','Great saphenous vein','Posterior tibial vein','Femoral vein'],0,'The anterior tibial artery continues across the ankle as dorsalis pedis. The plantar arteries arise from the posterior tibial route.')
];
