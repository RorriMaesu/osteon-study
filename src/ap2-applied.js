const ink = '#e7f1e9', teal = '#84d8b8', coral = '#ffbc92', faint = '#718d82';
function label(x, y, name, color = ink, size = 16, anchor = 'start') {
  return `<text x="${x}" y="${y}" fill="${color}" font-size="${size}" text-anchor="${anchor}">${name}</text>`;
}
function line(d, color = teal, width = 3, dash = '') {
  return `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`;
}
function ellipse(x, y, rx, ry, fill, stroke = 'none', width = 2) {
  return `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${stroke}" stroke-width="${width}"/>`;
}
function figure(alt, drawing) {
  return {
    alt,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 190" width="500" height="190" style="display:block;width:100%;max-width:680px;height:auto" role="img" aria-label="${alt}" font-family="system-ui, sans-serif"><rect width="500" height="190" rx="10" fill="#172b26"/>${drawing}</svg>`
  };
}
function table(columns, rows) { return { columns, rows }; }
function visual(section, slug, prompt, stimulus, choices, answer, why) {
  return { id: `ap2-${section}-${slug}`, section, type: 'visual', prompt, stimulus, choices, answer, why };
}
function number(section, slug, prompt, stimulus, expected, unit, tolerance, why) {
  return { id: `ap2-${section}-${slug}`, section, type: 'number', prompt, stimulus, expected, unit, tolerance, why };
}
function term(section, slug, prompt, stimulus, expected, aliases, why) {
  return { id: `ap2-${section}-${slug}`, section, type: 'term', prompt, stimulus, expected, aliases, why };
}

const spikeY = mv => 68 - mv;
const spikeSamples = [[64,-70],[128,-70],[153,-64],[166,-55],[178,-1],[187,30],[192,28],[202,12],[211,-6],[226,-35],[244,-64],[261,-80],[273,-80],[290,-74],[312,-70],[465,-70]];
const spike = figure(
  'Voltage starts at −70 mV, reaches +30, and falls to −80 before returning to baseline. X marks the descending trace at −6 mV.',
  line('M62 18 V158 H471', faint, 2) + label(10,19,'mV',ink,14) +
  [30,0,-70].map(mv => line('M57 '+spikeY(mv)+' H462',faint,1,'3 6') + label(49,spikeY(mv)+4,mv===30?'+30':mv===0?'0':'−70',ink,13,'end')).join('') +
  line(spikeSamples.map(([x,mv],i)=>(i?'L':'M')+x+' '+spikeY(mv)).join(' '),teal,4) +
  ellipse(211,spikeY(-6),5,5,coral) + line('M217 '+spikeY(-6)+' L244 44 H263',coral,2) + label(271,49,'X',coral,18) + label(453,179,'Time',ink,14,'end')
);
const csf = figure(
  'Two upper curved cavities, one on each side, drain to one midline cavity. X marks the thin channel below that midline cavity and above a wider tent-shaped cavity.',
  `<g fill="#365b53" stroke="${teal}" stroke-width="3"><path d="M183 33 Q151 11 128 35 Q112 55 133 62 Q144 66 154 53 Q161 43 183 49Z"/><path d="M317 33 Q349 11 372 35 Q388 55 367 62 Q356 66 346 53 Q339 43 317 49Z"/><ellipse cx="250" cy="72" rx="26" ry="16"/><path d="M250 122 L215 159 Q250 170 285 159Z"/></g>` +
  line('M183 44 Q207 48 227 66 M317 44 Q293 48 273 66',teal,5) +
  line('M250 89 V121',teal,7) + line('M250 164 V179',teal,5) + line('M258 104 H319',coral,2) + label(327,110,'X',coral,19)
);
const crossing = figure(
  'In a frontal pathway diagram, vibration input ascends on the body’s left in the thoracic spinal cord and crosses to the right in the medulla. X interrupts this line in the thoracic cord before the crossing.',
  label(170,23,'Body left',ink,15,'middle')+label(328,23,'Body right',ink,15,'middle')+
  `<rect x="136" y="36" width="228" height="47" rx="18" fill="#2c443c"/><rect x="148" y="88" width="204" height="64" rx="9" fill="#293e38"/>`+
  label(14,61,'Medulla',ink,14)+label(14,115,'Thoracic',ink,14)+label(14,133,'cord',ink,14)+line('M250 36 V152',faint,1,'4 6')+
  line('M179 169 V82 Q180 71 209 67 L299 56 Q319 52 319 37',teal,4)+line('M313 44 L319 36 L325 44',teal,3)+
  line('M170 106 L188 121 M188 106 L170 121',coral,4)+label(195,119,'X',coral,16)+label(180,183,'Vibration input',ink,13,'middle')
);
const ganglion = figure(
  'A projected axon runs from the brainstem nearly to an organ. It meets a second neuron in a ganglion within the organ wall. The second axon travels a very short distance to the target.',
  `<rect x="24" y="55" width="90" height="67" rx="18" fill="#344e46"/><rect x="353" y="37" width="115" height="100" rx="30" fill="#3b5047" stroke="#85a798" stroke-width="2"/>`+
  label(68,152,'Brainstem',ink,16,'middle')+label(411,158,'Organ wall',ink,16,'middle')+
  ellipse(66,87,12,12,teal)+line('M78 87 H345 Q355 87 362 84',teal,4)+line('M365 76 L365 92',teal,3)+
  ellipse(387,84,22,24,'none',faint,2)+ellipse(385,84,8,8,coral)+line('M393 84 H432',coral,4)+line('M431 76 V92',coral,3)+
  label(220,68,'First axon',teal,14,'middle')+label(404,24,'Peripheral relay',ink,13,'middle')
);
const reaches = figure(
  'Three reaches start at the same point, travel toward a target at a fixed distance and end at different dots. Two go past the target, while one stops short. Movement time is not shown.',
  label(31,27,'Reach endpoints',ink,15)+line('M335 40 V157',faint,2,'5 6')+label(335,179,'Target distance',ink,14,'middle')+
  line('M80 96 Q161 91 209 77 T397 65',teal,3)+line('M80 96 Q149 135 213 109 T280 101',coral,3)+line('M80 96 Q191 100 249 118 T367 129','#b7bfdc',3)+
  ellipse(80,96,6,6,ink)+ellipse(397,65,6,6,teal)+ellipse(280,101,6,6,coral)+ellipse(367,129,6,6,'#b7bfdc')+label(65,146,'Start',ink,14,'middle')
);
function follicle(x,y,rx,ry) {
  let cells='';
  for(let i=0;i<20;i++){
    const angle=2*Math.PI*i/20;
    cells+=ellipse((x+(rx-4)*Math.cos(angle)).toFixed(1),(y+(ry-5)*Math.sin(angle)).toFixed(1),2.4,2.4,'#29443c');
  }
  return ellipse(x,y,rx,ry,'#84bda7','#b0d8bd',2)+ellipse(x,y,rx-10,ry-11,'#947160','#dbb69e',2)+cells;
}
const thyroid = figure(
  'Three rounded follicles are each lined by a single layer of cells. The arrow points into the uniform material filling the largest follicle, inside its lining.',
  follicle(173,92,61,57)+follicle(306,65,47,37)+follicle(310,136,43,33)+
  line('M40 150 L124 122 L166 96 M157 96 L166 96 L162 104',ink,2)+label(31,170,'X',ink,17)
);
function redCell(x,y,rx=25,ry=19) {
  return ellipse(x,y,rx,ry,'#b9766e','#e4a59b',2)+ellipse(x,y,rx*.48,ry*.41,'#e6ae9c');
}
const smear = figure(
  'A schematic blood field shows large pale-centered discs, a larger cell with a lobed nucleus and tiny irregular purple fragments. X points to one of the tiny fragments.',
  redCell(85,60)+redCell(164,125)+redCell(365,122)+redCell(281,54)+redCell(431,64)+
  ellipse(269,118,35,30,'#ccc8da','#aba3c4',2)+line('M254 114 Q250 98 262 109 Q270 127 277 117 Q284 99 286 114','#655b89',12)+
  `<path d="M177 62 l7 -3 4 6 -7 5 -5 -3z M197 71 l5 -3 4 4 -3 4 -6 -1z M383 41 l5 -2 3 5 -5 4 -4 -2z" fill="#c5b2e3"/>`+
  line('M175 21 L179 54 M175 49 L179 55 L182 48',ink,2)+label(162,25,'X',ink,17)
);
const ecg = figure(
  'A stylized ECG shows a small rounded deflection, a narrow cluster with a sharp tall peak and a small negative dip, then a wider rounded deflection. A shaded bracket marks only the narrow cluster.',
  `<rect x="207" y="29" width="63" height="118" fill="#314a41"/>`+line('M37 116 H461',faint,1,'5 7')+
  line('M36 116 H95 Q106 116 116 106 Q126 92 138 107 Q145 116 158 116 H204 L213 123 L227 42 L241 142 L254 114 L275 116 H295 Q312 115 325 101 Q346 78 367 102 Q381 117 400 116 H462',teal,3.5)+
  line('M207 149 V158 H270 V149',coral,2)+label(239,181,'X',coral,17,'middle')
);
const vessels = figure(
  'Vessel A has a wide nearly circular ring of smooth muscle surrounding a small round lumen. Vessel B at the same magnification has a thin muscle ring surrounding a much larger, irregular oval lumen.',
  ellipse(148,91,64,62,'#867568','#c4aa90',2)+ellipse(148,91,54,52,'#b67970','#d79c8d',2)+
  ellipse(148,91,27,26,'#283c35','#e2c7a6',3)+
  `<path d="M279 95 Q286 46 347 47 Q389 45 413 73 Q445 113 407 129 Q386 145 340 137 Q294 131 279 95Z" fill="#a27367" stroke="#c4aa90" stroke-width="4"/><path d="M290 94 Q296 57 347 57 Q390 56 408 81 Q426 112 401 122 Q380 134 342 127 Q302 122 290 94Z" fill="#283c35" stroke="#e2c7a6" stroke-width="2"/>`+
  label(148,176,'A',ink,17,'middle')+label(353,176,'B',ink,17,'middle')
);

export const appliedItems = [
  visual('12.4','spike-slope','At X, which change in membrane conductance is driving the voltage back toward its resting value?',spike,
    ['A sustained rise in sodium influx','Opening chloride channels at a chemical synapse','Increased potassium efflux through voltage-gated channels','Closure of every potassium channel'],2,
    'X falls on repolarization. Sodium channels are inactivating while open voltage-gated potassium channels carry outward current.'),
  number('12.4','axon-speed','The same action potential passes two recording sites on an axon. Divide their separation by the difference in arrival times to calculate conduction speed.',table(['Measurement','Value'],[['Distance between sites','0.12 m'],['Arrival at first site','1.0 ms'],['Arrival at second site','4.0 ms']]),'40','m/s',0,
    'The signal covers 0.12 m in 3.0 ms, or 0.003 s. Its speed is 0.12 ÷ 0.003 = 40 m/s.'),
  term('12.5','summation','Name the type of summation that allows the last pulse to reach threshold in this recording from a single synaptic input.',table(['Trial at the same synapse','Observation'],[['One pulse','Small depolarization, then decay'],['Three closely spaced pulses','Each arrives before the prior response has decayed'],['Third pulse','Threshold reached']]),'temporal summation',['temporal'],
    'Repeated input from the same source overlaps across time. Spatial summation combines inputs arriving from different locations.'),
  visual('13.3','csf-channel','Which structure carries cerebrospinal fluid through the segment marked X?',csf,
    ['Interventricular foramen','Cerebral aqueduct','Median aperture of the fourth ventricle','Central canal of the spinal cord'],1,
    'The paired cavities feed the third ventricle. The cerebral aqueduct links the third to the fourth ventricle, the wider cavity below X.'),
  term('13.1','vesicle-derivative','An unlabeled secondary brain vesicle produces the thalamus and hypothalamus. Its lumen forms the third ventricle. Name the vesicle.',table(['Observed derivative','Description'],[['Dorsal region','Major sensory relay nuclei'],['Ventral region','Homeostatic control centers'],['Cavity','Third ventricle']]),'diencephalon',[],
    'The diencephalon arises from the prosencephalon and gives rise to the thalamus, hypothalamus and related structures.'),
  number('13.4','spinal-inventory','A lab inventory counts one specimen per left–right spinal nerve pair. How many pair labels are needed for the complete inventory?',table(['Region','Pairs'],[['Cervical','8'],['Thoracic','12'],['Lumbar','5'],['Sacral','5'],['Coccygeal','1']]),'31','pairs',0,
    'Adding 8 + 12 + 5 + 5 + 1 gives 31 pairs. A single pair label accounts for a left and a right spinal nerve.'),
  visual('14.2','crossing-site','X marks an isolated interruption in the indicated thoracic pathway. Which finding does this drawing predict below the interruption?',crossing,
    ['Reduced pain sensation in the right foot','Reduced vibration sense in the right foot','Reduced voluntary movement in the left hand','Reduced vibration sense in the left foot'],3,
    'Foot vibration ascends on the same side in the dorsal column until the medulla. X interrupts the left-sided pathway before it crosses.'),
  term('14.1','near-focus','A participant shifts their gaze from a distant wall to a nearby page. What term names the lens-shape adjustment shown in the observations?',table(['Observation','Near focus'],[['Ciliary muscle','Contracts'],['Zonular tension','Decreases'],['Lens','Becomes rounder']]),'accommodation',['lens accommodation','visual accommodation','ocular accommodation'],
    'Ciliary contraction reduces zonular tension and lets the lens round up, increasing its refractive power for near objects.'),
  number('14.3','reflex-latency','In a model stretch-reflex recording, latency runs from tendon tap onset to the first muscle electrical response. What is the latency?',table(['Event','Recording time'],[['Tendon tap starts','8 ms'],['Sensory volley detected','15 ms'],['Muscle electrical activity starts','32 ms'],['Visible limb movement begins','48 ms']]),'24','ms',0,
    'Subtract tap onset from the first muscle electrical response, 32 − 8 = 24 ms. Visible motion begins later.'),
  visual('15.1','relay-location','Which identity fits the two-neuron route drawn here?',ganglion,
    ['Sympathetic route with a ganglion beside the thoracic cord','Parasympathetic route with a terminal or intramural ganglion','Somatic motor route to skeletal muscle','Sensory route through a dorsal root ganglion'],1,
    'A long brainstem preganglionic fiber and a short effector fiber from a ganglion at the organ are characteristic of parasympathetic output.'),
  number('15.2','reflex-rate','In a teaching simulation, arterial pressure briefly falls and the baroreflex shortens the heartbeat interval. Use 60 seconds divided by the interval to find the new heart rate.',table(['State','Beat interval'],[['Before the fall','0.80 s'],['During the reflex response','0.60 s']]),'100','beats/min',0,
    'At 0.60 seconds per beat, 60 ÷ 0.60 = 100 beats/min. The shorter interval means the heart is beating faster.'),
  term('15.4','muscarinic-site','A compound blocks ACh responses at two effector organs while ganglionic transmission remains intact. Name the receptor family blocked at the effector organs.',table(['Test preparation','Effect of compound'],[['Vagal cardiac pacemaker response','Usual slowing is blocked'],['Sympathetic eccrine gland response','Secretion is blocked'],['Autonomic ganglion','ACh still evokes a response']]),'muscarinic',['muscarinic receptor','muscarinic receptors','muscarinic acetylcholine receptor','muscarinic cholinergic receptor'],
    'Both cardiac vagal effectors and sympathetic eccrine glands have muscarinic ACh receptors. Autonomic ganglia use neuronal nicotinic receptors.'),
  visual('16.5','reaching-endpoints','The fictional participant sees the target and has normal strength and position sense. Which exam term describes the endpoint errors?',reaches,
    ['Rigidity','Bradykinesia','Dysmetria','Sensory extinction'],2,
    'Inaccurate movement amplitude gives overshoot or undershoot, called dysmetria. The trace gives no timing information for judging movement speed.'),
  term('16.2','new-memory','A fictional participant retains old autobiographical memories but cannot form new lasting episodic memories after an injury. What directional type of amnesia fits?',table(['Task','Observation'],[['Immediate repetition','Accurate'],['Events from years before injury','Remembered'],['New experiences after injury','Not retained across a delay']]),'anterograde amnesia',['anterograde'],
    'Anterograde amnesia affects formation of new memories after onset. Retrograde loss affects material acquired before onset.'),
  term('16.4','motor-level','These observations were made several months after a stable injury. Name the class of motor neuron pathway whose disruption best fits this combination.',table(['One affected limb','Finding'],[['Voluntary strength','Reduced'],['Passive tone','Increased'],['Deep tendon reflexes','Brisk'],['Plantar response','Great toe extends']]),'upper motor neuron',['UMN','UMN lesion','upper motor neuron lesion','upper motor neurons','upper motor neuron pathway','upper motor neuron pathways'],
    'Weakness with increased tone, brisk reflexes and an extensor plantar response fits loss of descending upper motor neuron control.'),
  visual('17.4','follicle-lumen','Which material normally occupies the compartment marked X in this thyroid section?',thyroid,
    ['Colloid containing thyroglobulin','Blood containing hypothalamic releasing hormones','Cytoplasm of a parathyroid chief cell','Catecholamine granules in a chromaffin cell'],0,
    'The arrow ends inside the follicle, across the ring of epithelial cells from the surrounding tissue. This extracellular lumen stores thyroglobulin-rich colloid.'),
  number('17.9','tissue-uptake','Model blood flow through resting muscle is 1.0 dL/min and stays constant across the tissue. Calculate net glucose uptake as blood flow multiplied by the arterial–venous concentration difference.',table(['Measurement','Value'],[['Arterial glucose','145 mg/dL'],['Venous glucose','120 mg/dL'],['Blood flow','1.0 dL/min']]),'25','mg/min',0,
    'Each deciliter loses 145 − 120 = 25 mg across the muscle. One deciliter per minute therefore supplies 25 mg/min.'),
  term('17.5','renal-messenger','Name the active vitamin D hormone made by kidney in the middle step of this calcium response.',table(['Organ','Observed change'],[['Parathyroids','PTH increases as ionized calcium falls'],['Kidney','Vitamin D intermediate undergoes final activation'],['Intestine','Calcium absorption rises']]),'calcitriol',['1,25-dihydroxyvitamin D','1,25-dihydroxyvitamin D3','1,25-dihydroxycholecalciferol'],
    'PTH promotes renal formation of calcitriol. Calcitriol signals intestinal cells to increase calcium absorption.'),
  visual('18.4','smear-fragments','Which function belongs to the formed element indicated by X?',smear,
    ['Carrying most oxygen bound to hemoglobin','Producing antibody as a plasma cell','Phagocytosing bacteria as a neutrophil','Helping form the initial plug at an injured vessel wall'],3,
    'The small irregular fragment is a platelet. Platelets adhere and aggregate in primary hemostasis. The larger pale-centered discs are erythrocytes.'),
  number('18.3','oxygen-capacity','For this model, use 1.34 mL O₂ per gram of fully saturated hemoglobin and ignore dissolved oxygen. How much oxygen can the hemoglobin in 1 dL of this blood carry?',table(['Measurement','Value'],[['Hemoglobin concentration','15.0 g/dL'],['Hemoglobin saturation','100%']]),'20.1','mL O₂/dL',0,
    'At full saturation the bound oxygen capacity is 15.0 × 1.34 = 20.1 mL O₂ per dL.'),
  term('18.6','typing-pattern','Report the ABO and Rh(D) type of these red cells. In this model agglutination means the tested antigen is present.',table(['Reagent','Observation'],[['Anti-A','Agglutination'],['Anti-B','No agglutination'],['Anti-D','No agglutination'],['Control','No agglutination']]),'A negative',['A-','A−','A neg','A Rh negative','A Rh-negative','A Rh(D) negative','type A negative'],
    'The cells carry A antigen but lack detectable B and Rh(D) antigens, giving type A negative.'),
  visual('19.2','ecg-bracket','Which electrical event is represented by the bracketed ECG deflection?',ecg,
    ['Atrial depolarization','Ventricular depolarization','Ventricular repolarization','Mechanical opening of the aortic valve'],1,
    'The bracket spans the QRS complex, the electrical signature of ventricular depolarization. Ventricular repolarization appears in the later T wave.'),
  number('19.4','cardiac-output','Use end-diastolic and end-systolic volumes to get stroke volume. Calculate cardiac output in liters per minute.',table(['Measurement','Value'],[['End-diastolic volume','124 mL'],['End-systolic volume','54 mL'],['Heart rate','78 beats/min']]),'5.46','L/min',0,
    'Stroke volume is 124 − 54 = 70 mL. Multiplying by 78 beats/min gives 5,460 mL/min, or 5.46 L/min.'),
  term('19.3','closed-valves','Name the phase of the cardiac cycle during the interval shown for the left ventricle.',table(['Observation','During interval'],[['Mitral and aortic valves','Both closed'],['Ventricular pressure','Rises rapidly'],['Ventricular volume','Constant at end-diastolic volume']]),'isovolumetric contraction',['isovolumic contraction','isovolumetric ventricular contraction','isovolumic ventricular contraction','ventricular isovolumetric contraction'],
    'Contraction raises pressure while closed valves prevent a volume change. Ejection begins once ventricular pressure opens the aortic valve.'),
  visual('20.1','vessel-wall','Both vessels are shown at the same magnification. Which pairing best identifies the muscular artery profile and its distinguishing feature?',vessels,
    ['B, because a large irregular lumen indicates high pressure','B, because a thin media supports stronger vasoconstriction','A, because its thick smooth-muscle media can regulate lumen caliber','A, because exchange takes place across a single endothelial layer'],2,
    'A has a substantial concentric muscular wall around its lumen. A vein tends to have a thinner media and a larger, more collapsible lumen.'),
  number('20.2','pressure-flow','In this model, flow equals the pressure difference divided by resistance. Find the flow through the vascular bed.',table(['Measurement','Value'],[['Inlet pressure','95 mmHg'],['Outlet pressure','15 mmHg'],['Resistance','4 mmHg·min/mL']]),'20','mL/min',0,
    'The pressure difference is 95 − 15 = 80 mmHg. Dividing by 4 mmHg·min/mL yields 20 mL/min.'),
  term('20.6','fetal-bypass','Name the fetal shunt that supplied the connection described in this tracing.',table(['Trace station','Observed direction'],[['First vessel','Pulmonary trunk'],['Connection','Short vessel bypassing the high-resistance fetal lungs'],['Next vessel','Aorta downstream of the aortic arch branches']]),'ductus arteriosus',['arterial duct','fetal ductus arteriosus'],
    'The ductus arteriosus carries blood from pulmonary trunk to aorta in the fetus. The foramen ovale connects atria and the ductus venosus bypasses much of the liver.')
];
