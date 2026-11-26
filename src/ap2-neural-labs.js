// Original schematic diagrams. Coordinates describe relationships, not clinical measurements.
const ink = '#193742';
const teal = '#096859';
const purple = '#71509a';
const amber = '#9b481a';
const gray = '#91a6a4';

function svg(label, body, height = 252) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 ${height}" role="img" aria-label="${label}" focusable="false" fill="none" font-family="system-ui,sans-serif" stroke-linejoin="round" stroke-linecap="round">${body}</svg>`;
}

function line(d, color = gray, width = 2, extra = '') {
  return `<path d="${d}" stroke="${color}" stroke-width="${width}" ${extra}/>`;
}

function text(x, y, value, anchor = 'start', color = ink, size = 13) {
  return `<text x="${x}" y="${y}" font-size="${size}" fill="${color}" text-anchor="${anchor}">${value}</text>`;
}

function dot(x, y, color = teal, radius = 5) {
  return `<circle cx="${x}" cy="${y}" r="${radius}" fill="${color}" stroke="#fff" stroke-width="2"/>`;
}

function tag(x, y, name) {
  return `<circle cx="${x}" cy="${y}" r="11" fill="${teal}" stroke="white" stroke-width="2"/><text x="${x}" y="${y+4.5}" fill="white" text-anchor="middle" font-size="13" font-weight="700">${name}</text>`;
}

const neuronParts = [
  ['Dendrites', 'Dendritic branches provide a large receiving surface for synapses. Local graded changes spread toward the soma.', 69, 72],
  ['Soma', 'The soma contains the nucleus and protein-making machinery. Signals from many branches can combine here.', 112, 122],
  ['Initial segment', 'The initial segment just beyond the axon hillock contains many voltage-gated sodium channels. Sufficient depolarization can initiate a spike.', 157, 126],
  ['Myelin', 'This insulating wrap reduces current loss along the axon. Oligodendrocytes form it in the CNS and Schwann cells form it in the PNS.', 218, 126],
  ['Node', 'This exposed gap between myelin segments has a high density of voltage-gated channels. Local current from the previous node brings it to threshold.', 241, 126],
  ['Terminals', 'Terminal branches end in boutons. A spike arriving in a bouton can open calcium channels and trigger transmitter release.', 364, 90]
];

function neuron(state) {
  const part = neuronParts[Number(state.region)];
  const branches = 'M101 116 Q83 100 71 81 L56 70 M74 86 L75 62 L66 47 M75 62 L84 51 M62 75 L39 77 M62 75 L44 59 M95 126 L71 124 L49 111 M72 124 L48 136 L34 134 M88 136 Q69 145 65 166 L51 177 M66 159 L47 156 L37 162 M99 142 L92 163 L95 180 M92 163 L83 177 M108 108 L103 85 L111 68 M103 87 L94 77';
  const terminals = 'M312 127 Q329 125 341 113 L351 92 L364 88 M345 105 L368 109 M330 120 L339 85 L354 73 M332 130 L353 135 L370 130 M339 133 L352 155 L369 165 M352 153 L373 151';
  let drawing = line(branches, teal, 4) + line('M124 125 Q149 128 166 127 L314 127', teal, 5) + line(terminals, teal, 3.5);
  drawing += '<path d="M92 105 Q103 114 109 95 Q112 108 128 113 Q137 120 154 126 Q140 130 130 134 Q118 140 113 152 Q110 138 94 139 Q99 129 83 127 Q101 122 92 105Z" fill="#8bc6ad" stroke="#287357" stroke-width="2"/><circle cx="112" cy="123" r="9" fill="#f4ead6" stroke="#587c60" stroke-width="2"/>';
  for (const x of [166, 206, 246, 286]) {
    drawing += `<rect x="${x}" y="118" width="30" height="18" rx="8" fill="#e2cbed" stroke="${purple}" stroke-width="1.6"/>`;
    for (const dx of [7, 14, 21]) drawing += line(`M${x+dx} 120 l-3 13`, '#b095be', 1.2);
  }
  for (const [x,y] of [[364,88],[368,109],[354,73],[370,130],[369,165],[373,151]]) drawing += dot(x,y,teal,4);
  drawing += `<circle cx="${part[2]}" cy="${part[3]}" r="17" stroke="${amber}" stroke-width="3.5" stroke-dasharray="4 3"/>`;
  drawing += text(26,29,'Multipolar neuron') + line('M119 208 H300 M291 203 l9 5 -9 5', ink,1.8) + text(210,232,'Usual direction along the axon','middle');
  return [svg('Multipolar neuron from dendrites on the left to axon terminals on the right. A dashed ring identifies the selected structure.', drawing), part[0], part[1]];
}

const phases = [
  ['Rest', 65, -70, 'Potassium leak conductance strongly influences baseline voltage. The sodium-potassium pump maintains the concentration gradients over time.'],
  ['Threshold', 129, -55, 'The depolarizing input reaches the model threshold. Regenerative opening of voltage-gated sodium channels begins.'],
  ['Upstroke', 154, 0, 'Voltage-gated sodium channels open rapidly. Net inward sodium current drives the voltage toward its peak.'],
  ['Repolarization', 211, -26, 'Sodium channels inactivate and potassium channels open. Outward potassium current brings the voltage down.'],
  ['Undershoot', 269, -80, 'Potassium channels close slowly. Elevated potassium conductance briefly drives the voltage below rest.']
];
const voltageY = mv => 28 + (38 - mv) * 1.39;

function voltage(state) {
  const input = Number(state.input);
  const fires = input >= 15;
  const phase = phases[Number(state.phase)];
  const y = voltageY;
  let drawing = text(15,18,'Membrane voltage (mV)');
  for (const mv of [30,0,-55,-70]) {
    drawing += line(`M52 ${y(mv)} H396`, mv===-55?'#bd7746':'#d4dfdc', 1.1, mv===-55?'stroke-dasharray="5 4"':'');
    drawing += text(43,y(mv)+4,String(mv).replace('-','−'),'end',ink,12);
  }
  drawing += line('M52 29 V207 H395',ink,1.5) + text(393,228,'Time →','end');
  drawing += text(392,y(-55)-5,'Threshold','end',amber,12);
  const weakPeak = -70+input;
  const trace = fires
    ? `M54 ${y(-70)} H94 C106 ${y(-70)} 116 ${y(-63)} 129 ${y(-55)} C139 ${y(-48)} 147 ${y(-19)} 154 ${y(0)} S166 ${y(30)} 171 ${y(30)} C185 ${y(34)} 196 ${y(-7)} 211 ${y(-26)} S247 ${y(-80)} 268 ${y(-80)} S306 ${y(-70)} 330 ${y(-70)} H394`
    : `M54 ${y(-70)} H94 C113 ${y(-70)} 127 ${y(weakPeak)} 151 ${y(weakPeak)} S195 ${y(-70)} 232 ${y(-70)} H394`;
  drawing += line(trace,teal,3.5);
  // The steep phase marker is placed on the upstroke at its zero crossing.
  const marker = fires ? [phase[1],y(phase[2])] : [151,y(weakPeak)];
  drawing += dot(marker[0],marker[1],amber,6);
  const heading = fires ? 'Spike generated · '+phase[0] : 'Subthreshold response';
  const detail = fires ? phase[3] : `The input takes the initial segment from −70 mV to ${String(weakPeak).replace('-','−')} mV. It falls short of the −55 mV threshold, so the local response fades without a spike.`;
  return [svg(`Voltage trace for a ${input} mV depolarizing input. ${heading}.`,drawing), heading, detail];
}

const csfStops = [
  ['Lateral ventricles', 'Choroid plexuses secrete CSF within the ventricular system. Each cerebral hemisphere contains a lateral ventricle.'],
  ['Third ventricle', 'Each lateral ventricle communicates with this midline cavity through its own interventricular foramen.'],
  ['Cerebral aqueduct', 'This slender channel carries CSF through the midbrain from the third ventricle to the fourth.'],
  ['Fourth ventricle', 'This cavity lies between the cerebellum and the pons or upper medulla. Its apertures open onto the subarachnoid space.'],
  ['Subarachnoid space', 'The median and paired lateral apertures allow CSF to circulate in the space between the arachnoid and pia around the brain and spinal cord.'],
  ['Dural venous sinus', 'CSF can return to the venous circulation through arachnoid granulations projecting into dural venous sinuses.']
];

function csf(state) {
  const blocked = state.flow === '1';
  const stop = Number(state.stop);
  const locations = [[152,72],[178,110],[202,132],[226,156],[306,103],[227,25]];
  const [x,y] = locations[stop];
  const brain = 'M72 108 C64 80 76 57 101 43 C122 23 155 23 183 24 C210 13 250 22 273 36 C302 47 322 76 322 103 C324 127 309 143 283 147 C273 157 259 161 242 161 L230 186 L209 206 L193 199 L202 168 Q179 153 161 155 C129 159 116 147 109 134 C89 135 77 125 72 108Z';
  let drawing = `<path d="${brain}" fill="#f2eadb" stroke="#aa9d89" stroke-width="2"/><path d="M246 132 Q268 114 288 133 Q306 151 291 170 Q277 189 250 176 Q235 173 232 162Z" fill="#e5d8c2" stroke="#aa9d89" stroke-width="2"/>`;
  drawing += line('M250 147 Q271 135 286 144 M246 156 Q266 146 291 154 M247 164 Q269 157 287 163','#bfae94',1.5);
  drawing += line('M89 98 C104 58 143 41 184 37 M239 39 Q282 46 301 73 M84 114 Q94 129 108 126','#d5c6b3',2);
  drawing += line('M139 79 C150 55 195 55 215 77 Q231 98 210 108', blocked ? '#a6551e' : '#318a9a',blocked ? 11 : 8);
  drawing += line('M146 82 C158 65 190 64 201 76','#72b3bd',4);
  drawing += line('M155 75 Q165 83 169 97','#318a9a',4);
  drawing += line('M169 97 Q176 111 188 119',blocked ? '#a6551e' : '#318a9a',blocked ? 12 : 8) + line('M188 119 L215 146','#318a9a',4);
  drawing += '<path d="M218 145 L237 151 L223 172 L216 159Z" fill="#8bc5ce" stroke="#337e89" stroke-width="2"/>';
  drawing += line('M232 154 C272 151 299 140 305 111 Q313 65 275 42 Q252 27 218 29','#608c97',3,'stroke-dasharray="3 4"');
  drawing += line('M199 29 Q231 20 252 28',purple,6);
  drawing += line('M227 43 L226 31',purple,2);
  if (blocked) drawing += line('M196 125 l14 14 M210 125 l-14 14', amber,4.3);
  drawing += `<circle cx="${x}" cy="${y}" r="13" stroke="${ink}" stroke-width="2.5" stroke-dasharray="3 3"/>`;
  drawing += text(76,225,'Anterior','start',ink,12)+text(322,225,'Posterior','end',ink,12)+text(206,242,'Side-view schematic','middle',ink,12);
  const [title, normalDetail] = csfStops[stop];
  const status = !blocked ? '' : stop < 2 ? ' This space lies upstream of the obstruction and can enlarge.' : stop === 2 ? ' The cross marks a complete block at this connection.' : ' This site is downstream of the blocked aqueduct.';
  return [svg(`Ventricular route in side view. The ring marks the ${title.toLowerCase()}. ${blocked?'A cross marks an aqueduct obstruction.':''}`,drawing),title,normalDetail+status];
}

function spinalRoot(state) {
  const motor = state.path === '1';
  let drawing = '<path d="M78 53 C38 55 20 82 23 127 C23 169 42 198 76 202 Q84 205 90 186 Q96 206 105 201 C142 195 157 166 155 128 C155 88 132 56 100 52 Q90 62 78 53Z" fill="#efe8df" stroke="#ac9e8f" stroke-width="2"/><path d="M89 119 Q74 114 60 85 Q55 80 60 99 Q62 122 77 131 Q65 135 55 150 Q48 172 65 168 Q81 162 89 145 Q97 162 114 168 Q131 172 123 150 Q114 135 103 131 Q119 118 123 99 Q128 77 121 85 Q105 114 89 119Z" fill="#c5afa6" stroke="#9a827d" stroke-width="1.4"/>';
  const dorsal = 'M111 107 C134 95 148 73 172 73 H196 C221 74 235 91 250 112';
  const ventral = 'M110 156 C143 170 172 170 204 157 C228 148 236 129 250 119';
  const nerve = 'M250 116 H312';
  drawing += line(dorsal,'#c1ccca',7)+line(ventral,'#c1ccca',7)+line(nerve,'#c1ccca',10)+line('M309 116 Q336 110 360 85 M309 116 Q336 130 365 153','#c1ccca',7);
  drawing += '<ellipse cx="183" cy="74" rx="20" ry="12" fill="#e9dec8" stroke="#a99a7f" stroke-width="2"/>';
  drawing += line(motor ? ventral : dorsal, motor ? purple : teal,3.5);
  drawing += line(nerve,motor ? purple : teal,3.5) +line('M309 116 Q336 110 360 85',motor ? purple : teal,3.5);
  drawing += motor ? line('M223 139 l8 -2 -3 8 M343 94 l8 -2 -2 7',purple,2.7) + dot(110,156,purple,5) : line('M230 99 l-9 -5 3 8 M340 107 l-9 1 4 -7',teal,2.7) + dot(183,74,teal,5);
  drawing += text(187,45,'Dorsal root ganglion','middle') +line('M184 50 V59',gray,1.3);
  drawing += text(186,194,'Ventral root','middle')+line('M183 180 V165',gray,1.3);
  drawing += text(272,78,'Spinal nerve','middle')+line('M279 84 V107',gray,1.3);
  drawing += text(401,68,'Dorsal ramus','end')+text(409,178,'Ventral ramus','end')+text(88,225,'Spinal cord','middle');
  const title = motor ? 'Motor · cord to back muscle' : 'Sensory · back skin to cord';
  const detail = motor ? 'A lower motor neuron in the ventral horn sends its axon out the ventral root. It travels through the mixed spinal nerve and dorsal ramus to a back muscle.' : 'The afferent enters by the dorsal ramus and mixed spinal nerve. Its cell body lies in the dorsal root ganglion, and its central branch reaches the dorsal horn.';
  return [svg(title+'. The highlighted route passes through the dorsal ramus of a mixed spinal nerve.',drawing),title,detail];
}

const bodyRoutes = [
  ['Vibration', 'Vibration and discriminative touch', 'medulla'],
  ['Temperature', 'Pain and temperature', 'spinal cord'],
  ['Hand movement', 'Voluntary distal limb command', 'caudal medulla']
];
function pathways(state) {
  const selected = Number(state.route);
  const motor = selected === 2;
  const targetLeft = state.side === '0';
  const bodySide = targetLeft ? 'left' : 'right';
  const otherSide = targetLeft ? 'right' : 'left';
  const sideX = targetLeft ? 164 : 288;
  const otherX = targetLeft ? 288 : 164;
  const crossY = selected === 1 ? 175 : 111;
  const sideColor = motor ? purple : teal;
  let drawing = text(164,25,'Body’s left','middle') + text(288,25,'Body’s right','middle');
  drawing += '<rect x="123" y="39" width="206" height="35" rx="13" fill="#e4eee8"/><rect x="137" y="82" width="178" height="46" rx="12" fill="#eee8f0"/><rect x="145" y="138" width="162" height="61" rx="10" fill="#ede8dc"/>';
  for (const [label,y] of [['Cerebral cortex',59],['Medulla',110],['Spinal cord',167],['Body',228]]) drawing+=text(111,y,label,'end',ink,13);
  drawing += line('M226 35 V225','#9aa9a6',1.3,'stroke-dasharray="3 5"');
  const path = `M${sideX} 221 V${crossY+10} L${otherX} ${crossY-10} V56`;
  drawing += line(path,sideColor,4.3) + dot(sideX,221,sideColor,6) + dot(otherX,56,sideColor,6);
  const directionY = motor ? 189 : 73;
  const directionX = motor ? sideX : otherX;
  drawing += line(motor ? `M${directionX-5} ${directionY-6} l5 6 5 -6` : `M${directionX-5} ${directionY+6} l5 -6 5 6`,sideColor,2.8);
  drawing += tag(226,crossY,'×');
  const title = bodyRoutes[selected][1];
  const detail = motor ? `A command from ${otherSide} motor cortex crosses in the caudal medulla and descends on the ${bodySide} in the lateral corticospinal tract. Lower motor neurons reach the ${bodySide} limb.` : selected === 0 ? `A signal from the ${bodySide} foot ascends the ${bodySide} dorsal column. After a medullary synapse, second-order fibers cross and ascend to the ${otherSide} thalamus and cortex.` : `A signal from the ${bodySide} foot synapses near spinal entry. Second-order fibers cross in the spinal cord and ascend on the ${otherSide} to the thalamus and cortex.`;
  return [svg(`${title}, ${bodySide} body side. The mark at the midline shows the crossing in the ${bodyRoutes[selected][2]}.`,drawing),title,detail];
}

const earTargets = [
  ['Sound', 'Cochlea', 'Motion passes from the stapes through the oval window. A traveling wave bends cochlear hair bundles where the basilar membrane moves most strongly.', 274,159],
  ['Head rotation', 'Semicircular ducts', 'Angular acceleration displaces endolymph relative to the ducts. The cupula bends in an ampulla and deflects the enclosed hair bundles.', 188,73],
  ['Linear acceleration or tilt', 'Utricle and saccule', 'The mass of the otolith membrane makes it shift with linear acceleration or a change of orientation relative to gravity. Hair cells beneath it change their output.', 205,126]
];

function ear(state) {
  const part = earTargets[Number(state.stimulus)];
  let drawing = line('M43 155 Q64 151 88 151 L104 143','#b4a58c',11);
  drawing += line('M101 134 L109 163',ink,4) + line('M107 145 L121 120 L130 127 L149 126 L163 143 L173 142',amber,4);
  drawing += line('M168 139 L180 132 L183 144 Z',amber,3);
  drawing += line('M203 109 C163 62 178 32 197 41 C219 55 207 92 207 109 M198 109 C138 98 137 59 156 60 C177 63 182 89 199 107 M208 107 C215 70 238 63 244 73 C256 93 233 108 215 119','#61988d',8);
  drawing += '<path d="M188 112 Q199 99 214 108 Q228 119 221 133 Q219 148 203 148 Q186 147 185 131Z" fill="#9fcbbb" stroke="#477e73" stroke-width="2"/>';
  drawing += line('M218 135 C239 118 268 120 283 127 C315 141 310 177 285 186 C262 196 235 182 238 160 C240 139 263 132 277 140 C292 148 290 166 278 172 C267 178 251 168 258 157 C263 149 274 151 274 159','#ba9176',9);
  drawing += line('M225 121 Q258 109 286 115 M296 150 Q316 144 333 141','#ac9b5b',4);
  drawing += `<circle cx="${part[3]}" cy="${part[4]}" r="22" stroke="${amber}" stroke-width="3" stroke-dasharray="5 4"/>`;
  drawing += text(56,190,'Ear canal','middle')+text(122,97,'Ossicles','middle')+text(263,41,'Semicircular ducts')+line('M263 46 L235 68',gray,1);
  drawing += text(294,209,'Cochlea','middle')+line('M289 194 L285 183',gray,1)+text(131,219,'Otolith organs','middle')+line('M151 204 L194 147',gray,1);
  return [svg('Inner ear and ossicles. The ring identifies the receptor organ for '+part[0].toLowerCase()+'.',drawing),part[1],part[2]];
}

const pick = (key, label, values, initial = '0') => ({ key, label, values, initial });
const allRoutes = bodyRoutes.map(item => item[0]);
const labs = {
  '12.2': {title:'Explore a multipolar neuron', prompt:'Locate a structure, then follow how its work contributes to the signal.', controls:[pick('region','Structure',neuronParts.map(item=>item[0]))], draw:neuron},
  '12.4': {title:'Will the axon fire?', prompt:'Change the size of a single depolarizing input. Once the trace crosses threshold, inspect its phases.', controls:[{key:'input',label:'Depolarizing input',initial:'18',min:0,max:30,unit:'mV'},pick('phase','Phase to locate',phases.map(item=>item[0]),'2')], draw:voltage},
  '13.3': {title:'Follow cerebrospinal fluid', prompt:'Select a stop along the route, then block the aqueduct and identify the spaces upstream.', controls:[pick('flow','Flow condition',['Open aqueduct','Blocked aqueduct']),pick('stop','Site along the route',csfStops.map(item=>item[0]))], draw:csf},
  '13.4': {title:'Trace a spinal nerve', prompt:'Compare the incoming and outgoing fibers that share a nerve to the back.', controls:[pick('path','Direction',['Sensory input','Motor output'])], draw:spinalRoot},
  '14.1': {title:'Match the inner ear to a stimulus', prompt:'Change what the ear detects and locate the structure that turns motion into a neural signal.', controls:[pick('stimulus','Stimulus',earTargets.map(item=>item[0]))], draw:ear},
  '14.2': {title:'Find the sensory crossing', prompt:'Choose a body side and sensory modality. Follow the route from the body upward to its cerebral hemisphere.', controls:[pick('route','Sensory modality',allRoutes.slice(0,2)),pick('side','Side of stimulus',['Left','Right'])], draw:pathways},
  '14.3': {title:'Trace the descending command', prompt:'Choose the hand that moves and find the hemisphere that sends the corticospinal command.', controls:[pick('side','Moving hand',['Left','Right'])], draw:state=>pathways({...state,route:'2'})}
};

const styles = `<style>
.ap2-neural-lab{margin:1rem 0;padding:clamp(.8rem,2vw,1.25rem);background:#f4f7f3;color:#193742;border:1px solid #c4d4ca;border-radius:12px;min-width:0}
.ap2-neural-lab h3{margin:0 0 .25rem;color:#193742;font-size:1.15rem}
.ap2-neural-lab p{margin:.25rem 0 .7rem;line-height:1.48;color:#29454a}
.ap2-neural-lab .neural-grid{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(10rem,.85fr);gap:1rem;align-items:center}
.ap2-neural-lab .neural-figure{overflow:hidden;min-width:0;background:#fbfcf9;border:1px solid #d4dfd7;border-radius:8px}
.ap2-neural-lab svg{display:block;width:100%;height:auto;max-height:21rem}
.ap2-neural-lab .neural-controls{display:grid;gap:.75rem;margin:.4rem 0}
.ap2-neural-lab label{display:grid;gap:.25rem;color:#193742;font-size:.88rem;font-weight:650}
.ap2-neural-lab select{display:block;width:100%;max-width:100%;min-height:42px;padding:.4rem .6rem;color:#193742;background:white;border:1px solid #788e86;border-radius:5px;font:inherit}
.ap2-neural-lab input[type="range"]{width:100%;height:32px;accent-color:#096859;cursor:pointer}
@media(max-width:760px){.ap2-neural-lab .neural-grid{grid-template-columns:minmax(0,1fr);gap:.45rem}}
.ap2-neural-lab :is(select,input):focus-visible{outline:3px solid #096859;outline-offset:3px}
.ap2-neural-lab .neural-reading{padding:.65rem .75rem;border-left:3px solid #438777;background:#e8f1e9;color:#193742}
.ap2-neural-lab .neural-reading p{margin:.25rem 0 0;font-size:.95rem}
@media(max-width:740px){.ap2-neural-lab .neural-grid{grid-template-columns:minmax(0,1fr)}}
</style>`;

function controls(config) {
  return config.controls.map(control => {
    if (control.values) {
      const options = control.values.map((v,i)=>`<option value="${i}"${String(i)===control.initial?' selected':''}>${v}</option>`).join('');
      return `<label><span>${control.label}</span><select data-neural-control="${control.key}">${options}</select></label>`;
    }
    return `<label><span>${control.label} · <span data-neural-value="${control.key}">${control.initial} ${control.unit}</span></span><input type="range" data-neural-control="${control.key}" min="${control.min}" max="${control.max}" value="${control.initial}" aria-valuetext="${control.initial} ${control.unit}"></label>`;
  }).join('');
}

function initialState(config) {
  return Object.fromEntries(config.controls.map(c=>[c.key,c.initial]));
}

export function renderLab(id) {
  const config = labs[id];
  if (!config) return '';
  const [drawing, title, detail] = config.draw(initialState(config));
  return `${styles}<section class="ap2-neural-lab" data-neural-lab="${id}" aria-label="${config.title}"><h3>${config.title}</h3><p>${config.prompt}</p><div class="neural-grid"><div class="neural-figure">${drawing}</div><div><div class="neural-controls">${controls(config)}</div><div class="neural-reading" aria-live="polite" aria-atomic="true"><strong>${title}</strong><p>${detail}</p></div></div></div></section>`;
}

export function mountLab(root, id) {
  const config = labs[id];
  if (!config || !root) return;
  const selector = `[data-neural-lab="${id}"]`;
  const host = root.matches?.(selector) ? root : root.querySelector(selector);
  if (!host || host.dataset.neuralReady) return;
  host.dataset.neuralReady = 'true';
  const fields = [...host.querySelectorAll('[data-neural-control]')];
  const figure = host.querySelector('.neural-figure');
  const reading = host.querySelector('.neural-reading');
  const refresh = () => {
    const state = Object.fromEntries(fields.map(field=>[field.dataset.neuralControl,field.value]));
    for (const control of config.controls) {
      if (control.unit) {
        const formatted = state[control.key]+' '+control.unit;
        host.querySelector(`[data-neural-value="${control.key}"]`).textContent = formatted;
        fields.find(field=>field.dataset.neuralControl===control.key).setAttribute('aria-valuetext',formatted);
      }
    }
    if (id === '12.4') fields.find(field=>field.dataset.neuralControl==='phase').disabled = Number(state.input)<15;
    const [drawing,title,detail] = config.draw(state);
    figure.innerHTML = drawing;
    reading.querySelector('strong').textContent = title;
    reading.querySelector('p').textContent = detail;
  };
  fields.forEach(field=>field.addEventListener(field.type==='range'?'input':'change',refresh));
}


