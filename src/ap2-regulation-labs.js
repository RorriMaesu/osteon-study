import {renderGlandPractical,mountGlandPractical} from './ap2-endocrine-practicals.js';
import {mountFeedbackReasoning} from './ap2-feedback-reasoning.js';
import {pupilTable} from './ap2-pupil-evidence.js';

const labKinds = {
  '15.1': 'circuit', '15.4': 'circuit',
  '15.2': 'pressure', '15.3': 'pressure',
  '16.1': 'pupils', '16.3': 'pupils',
  '17.3': 'feedback', '17.4': 'feedback', '17.6': 'feedback',
  '17.9': 'glucose'
};

const styles = `<style>
.reg-lab {margin:1rem 0;padding:clamp(.85rem,3vw,1.4rem);color:#e7f1eb;background:#152925;border:1px solid #466058;border-radius:15px;min-width:0}
.reg-lab *{box-sizing:border-box}.reg-lab h3{margin:0 0 .35rem;color:#f4f8ec;font-size:1.18rem}.reg-lab p{margin:.45rem 0;line-height:1.55;color:#d1e1d8}
.reg-controls{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,12rem),1fr));gap:.7rem;margin:1rem 0}
.reg-controls label,.reg-guess label{display:grid;gap:.3rem;font-size:.82rem;font-weight:650;color:#dcebe1}
.reg-lab select,.reg-lab button{min-height:44px;max-width:100%;font:inherit;color:#f2f6e9;background:#203b34;border:1px solid #618277;border-radius:6px;padding:.45rem .6rem}
.reg-lab :is(select,button,input):focus-visible{outline:3px solid #f2ce86;outline-offset:2px}
.reg-out{padding:.65rem 0}.reg-track{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,9rem),1fr));gap:.65rem;margin:.5rem 0 .75rem}
.reg-node{min-width:0;background:#1e3630;border-top:3px solid #86d3b7;padding:.7rem;border-radius:4px}.reg-node span,.reg-node small{display:block;color:#c7dbce;font-size:.78rem;line-height:1.45}.reg-node strong{display:block;color:#eff6eb;margin:.25rem 0;line-height:1.4}
.reg-node[data-state="blocked"]{border-color:#edb38c}.reg-node[data-state="quiet"]{border-color:#829a91}.reg-node meter{width:100%;margin:.3rem 0;accent-color:#86d3b7}
.reg-eyes{display:grid;grid-template-columns:1fr 1fr;max-width:28rem;gap:.65rem;margin:.8rem 0}
.reg-eye{margin:0;text-align:center;border:1px solid #476359;background:#1c342e;color:#edf4e7;padding:.65rem .3rem;border-radius:8px}
.reg-eye[data-lit="true"]{border:2px solid #f5d590;padding:calc(.65rem - 1px) calc(.3rem - 1px)}
.reg-iris{height:3.5rem;width:3.5rem;margin:.3rem auto;background:#80ae9e;border-radius:50%;border:5px solid #d9e5d9;display:grid;place-items:center}
.reg-iris::before{content:"";border-radius:50%;width:1.65rem;height:1.65rem;background:#13251f}
.reg-eye[data-small="true"] .reg-iris::before{width:.72rem;height:.72rem}.reg-eye small{display:block;color:#cbdfd0}
.reg-guess{display:flex;flex-wrap:wrap;align-items:end;gap:.5rem;margin-top:.6rem}.reg-guess label{flex:1;min-width:min(11rem,100%)}.reg-lab [data-verdict]{font-weight:620}
</style>`;

function selectControl(name, label, options, initial = '') {
  const items = options.map(([value, text]) => `<option value="${value}"${value === initial ? ' selected' : ''}>${text}</option>`);
  return `<label>${label}<select data-reg-input="${name}">${items.join('')}</select></label>`;
}

function node(stage, name, detail, state = 'active') {
  return `<div class="reg-node" data-state="${state}"><span>${stage}</span><strong>${name}</strong><small>${detail}</small></div>`;
}

const circuits = {
  sympathetic: { name: 'Sympathetic · heart', origin: 'Thoracolumbar cord', relay: 'Sympathetic chain', terminal: 'β1 adrenergic', chemical: 'Norepinephrine', effect: 'Pacemaker acceleration', blocker: 'beta' },
  vagal: { name: 'Parasympathetic · heart', origin: 'Brainstem via vagus', relay: 'Cardiac ganglion', terminal: 'M2 muscarinic', chemical: 'Acetylcholine', effect: 'Pacemaker slowing', blocker: 'muscarinic' },
  sweat: { name: 'Sympathetic · sweat gland', origin: 'Thoracolumbar cord', relay: 'Sympathetic chain', terminal: 'Muscarinic', chemical: 'Acetylcholine', effect: 'Sweat secretion', blocker: 'muscarinic' }
};

const axes = {
  thyroid: { name: 'Thyroid axis', release: 'TRH', drive: 'TSH', organ: 'Thyroid follicles', hormone: 'T3 and T4' },
  adrenal: { name: 'Adrenal cortisol axis', release: 'CRH', drive: 'ACTH', organ: 'Adrenal cortex', hormone: 'Cortisol' }
};

const cases = {
  A: { blockedInput: 'left', blockedOutput: '', answer: 'left-in', explanation: 'Either pupil can constrict when the right eye supplies input. Both responses disappear only when light enters the left eye.' },
  B: { blockedInput: '', blockedOutput: 'right', answer: 'right-out', explanation: 'Input from either eye can constrict the left pupil, but the right pupil never responds. The right output limb is interrupted.' },
  C: { blockedInput: '', blockedOutput: '', answer: 'intact', explanation: 'Light in either eye drives constriction of both pupils. Both input and output limbs work in this model.' },
  D: { blockedInput: 'right', blockedOutput: '', answer: 'right-in', explanation: 'Illuminating the left eye demonstrates two working output limbs. Neither pupil responds to illumination of the right eye.' },
  E: { blockedInput: '', blockedOutput: 'left', answer: 'left-out', explanation: 'Light entering either eye constricts the right pupil, while the left pupil stays unchanged with either input.' }
};

const pupilOptions = [['', 'Choose a pathway'], ['intact', 'Both pathways intact'], ['left-in', 'Left input · CN II'], ['right-in', 'Right input · CN II'], ['left-out', 'Left output · CN III'], ['right-out', 'Right output · CN III']];

function controls(kind, id) {
  switch (kind) {
    case 'circuit':
      return selectControl('route', 'Pathway', Object.entries(circuits).map(([key, route]) => [key, route.name])) +
        selectControl('block', 'Receptor blockade', [['none', 'None'], ['nicotinic', 'Ganglionic nicotinic'], ['muscarinic', 'Effector muscarinic'], ['beta', 'Effector β1 adrenergic']]);
    case 'pressure':
      return selectControl('pressure', 'Initial arterial pressure', [['normal', 'Usual resting level'], ['low', 'Sudden decrease'], ['high', 'Sudden increase']]) +
        selectControl('afferent', 'Sensory input to medulla', [['intact', 'Tracks arterial stretch'], ['clamped', 'Held at baseline firing']]);
    case 'pupils':
      return selectControl('case', 'Fictional case', Object.keys(cases).map(key => [key, 'Case ' + key])) +
        selectControl('lamp', 'Test light', [['off', 'Light off'], ['left', 'Illuminate left eye'], ['right', 'Illuminate right eye']]);
    case 'feedback':
      return selectControl('axis', 'Endocrine axis', Object.entries(axes).map(([key, axis]) => [key, axis.name]), id === '17.6' ? 'adrenal' : 'thyroid') +
        selectControl('change', 'Change one condition', [['rest', 'Usual production'], ['gland', 'Peripheral gland cannot produce hormone'], ['pituitary', 'Pituitary cannot produce its signal'], ['external', 'Excess end hormone supplied externally']]);
    case 'glucose':
      return selectControl('meal', 'Metabolic condition', [['fed', 'After carbohydrate absorption'], ['fast', 'Between meals']]) +
        selectControl('sensitivity', 'Muscle and fat response to insulin', [['usual', 'Usual sensitivity'], ['reduced', 'Reduced sensitivity']]);
  }
}

const labText = {
  circuit: ['Autonomic circuit bench', 'Choose a route and a receptor to block. Trace one incoming impulse through the ganglion to its target.'],
  pressure: ['Pressure reflex bench', 'Change arterial pressure and decide whether the sensory input reaching the medulla can register the change.'],
  pupils: ['Pupillary reflex station', 'Face the subject. Their right eye appears on your left. Illuminate each eye and use the recorded direct and consensual responses to identify the affected limb.'],
  feedback: ['Endocrine feedback bench', 'Select an axis and change one part of it. Compare the three signals after feedback has had time to act.'],
  glucose: ['Fuel movement bench', 'Choose a metabolic condition. Follow the islet signal into liver, muscle and adipose tissue, then change insulin sensitivity.']
};

function circuitOutput(read) {
  const route = circuits[read('route')], block = read('block');
  const relayBlocked = block === 'nicotinic', targetBlocked = block === route.blocker;
  const targetState = relayBlocked ? 'quiet' : targetBlocked ? 'blocked' : 'active';
  const response = relayBlocked ? 'No postganglionic impulse' : targetBlocked ? 'Target receptor blocked' : route.effect;
  const detail = relayBlocked ? 'The first synapse cannot excite the postganglionic neuron.' : targetBlocked ? `The postganglionic axon releases ${route.chemical.toLowerCase()}, but its target receptor is unavailable.` : `A working ${route.terminal} receptor mediates this response.`;
  return `<div class="reg-track">${node('1 · Preganglionic neuron', route.origin, 'Releases acetylcholine.')}${node('2 · Ganglion', route.relay, relayBlocked ? 'Nicotinic relay blocked.' : 'Nicotinic receptor transmits.', relayBlocked ? 'blocked' : 'active')}${node('3 · Effector synapse', route.terminal, relayBlocked ? 'No evoked transmitter release.' : `${route.chemical} released.`, targetState)}</div><p><strong>${response}.</strong> ${detail} This trace isolates the selected pathway.</p>`;
}

const pressureStates = {
  normal: ['Resting', 'Resting', 'Resting', 'Steady receptor firing supports resting autonomic tone.'],
  low: ['Less firing', 'Increases', 'Decreases', 'Reduced stretch increases sympathetic drive and reduces vagal slowing. A faster heart and greater vascular resistance oppose the initial fall.'],
  high: ['More firing', 'Decreases', 'Increases', 'Greater stretch reduces sympathetic drive and increases vagal slowing. A slower heart and lower resistance oppose the initial rise.']
};

function pressureOutput(read) {
  const input = read('pressure'), clamped = read('afferent') === 'clamped';
  const [firing, sympathetic, vagal, info] = pressureStates[clamped ? 'normal' : input];
  const note = clamped && input !== 'normal' ? 'The pressure disturbance occurs, but this model holds afferent firing at baseline. The medulla receives no change to trigger this reflex correction.' : info;
  return `<div class="reg-track">${node('Carotid sinus and aortic arch', firing, clamped ? 'Afferent firing held at baseline.' : 'Sensory signal to medulla.')}${node('Sympathetic output', sympathetic, 'Acts on heart and resistance vessels.')}${node('Cardiac vagal output', vagal, 'Acts on the pacemaker.')}</div><p>${note}</p>`;
}

function pupilOutput(read) {
  const test = cases[read('case')], lamp = read('lamp');
  function eye(side) {
    const small = lamp !== 'off' && lamp !== test.blockedInput && side !== test.blockedOutput;
    const lit = lamp === side, label = 'Subject’s '+side+' eye';
    const response = lamp === 'off' ? 'Resting pupil' : small ? 'Pupil constricts' : 'No constriction';
    return `<figure class="reg-eye" data-lit="${lit}" data-small="${small}"><figcaption><strong>${label}</strong><small>${lit ? 'Illuminated' : 'No direct light'}</small></figcaption><div class="reg-iris" aria-hidden="true"></div><small>${response}</small></figure>`;
  }
  return `<div class="reg-eyes">${eye('right')}${eye('left')}</div>`;
}

const feedbackLevels = {
  rest: ['Usual', 'Usual', 'Usual'],
  gland: ['High', 'High', 'Low'],
  pituitary: ['High', 'Low', 'Low'],
  external: ['Low', 'Low', 'High']
};

function feedbackPlot(axis,change,levels){
  const middle={rest:['Usual','Usual','Usual'],gland:['Usual','Usual','Low'],pituitary:['Usual','Low','Usual'],external:['Usual','Usual','High']}[change];
  const y={High:20,Usual:50,Low:80};
  const rows=[axis.release,axis.drive,axis.hormone].map((h,i)=>{
    const description=h+' begins at baseline, is '+middle[i].toLowerCase()+' immediately after the disturbance, and becomes '+levels[i].toLowerCase()+' as feedback acts.';
    return '<figure style="margin:.2rem"><figcaption>'+h+'</figcaption><svg viewBox="0 0 235 100" role="img" aria-label="'+description+'"><path d="M8 50 H225" stroke="#83988c" stroke-dasharray="3 4"/><path d="M10 50 L107 '+y[middle[i]]+' L220 '+y[levels[i]]+'" fill="none" stroke="#8ce1c4" stroke-width="4"/><g fill="#f9d6a6"><circle cx="10" cy="50" r="4"/><circle cx="107" cy="'+y[middle[i]]+'" r="4"/><circle cx="220" cy="'+y[levels[i]]+'" r="4"/></g></svg></figure>';
  });
  return '<details><summary>Trace each hormone over time</summary><p>Read left to right: baseline → direct disturbance → later feedback. Each dashed line is that hormone’s own usual level. These qualitative trends use illustrative timing.</p><div class="reg-track">'+rows.join('')+'</div></details>';
}

function feedbackOutput(read) {
  const axis = axes[read('axis')], change = read('change'), levels = feedbackLevels[change];
  function signal(tissue, product, level) {
    const amount = { Low: 1, Usual: 2, High: 3 }[level];
    return `<div class="reg-node"><span>${tissue}</span><strong>${product}</strong><meter min="0" max="3" value="${amount}" aria-label="${product}: ${level}"></meter><small>${level}</small></div>`;
  }
  const notes = {
    rest: `Usual end-hormone availability supplies tonic negative feedback on ${axis.release} and ${axis.drive}.`,
    gland: `Low ${axis.hormone} weakens negative feedback. Both upstream signals rise, but the peripheral gland cannot restore production.`,
    pituitary: `The hypothalamus increases ${axis.release} as feedback falls. The pituitary cannot supply adequate ${axis.drive}, so the peripheral gland remains understimulated.`,
    external: `The high circulating end hormone includes the external supply. Negative feedback lowers ${axis.release} and ${axis.drive}, reducing the gland’s own production.`
  };
  return `<div class="reg-track">${signal('Hypothalamus', axis.release, levels[0])}${signal('Anterior pituitary', axis.drive, levels[1])}${signal(`${axis.organ} · circulating end hormone`, axis.hormone, levels[2])}</div><p>${notes[change]} Levels show qualitative directions for this simplified model.</p>`+feedbackPlot(axis,change,levels);
}

function glucoseOutput(read) {
  const fed = read('meal') === 'fed', resistant = read('sensitivity') === 'reduced';
  const muscle = fed ? (resistant ? 'Blunted glucose uptake' : 'Increased glucose uptake') : 'Less insulin-driven uptake';
  const note = fed ? (resistant ? 'At the same insulin signal, reduced target sensitivity slows post-meal glucose clearance.' : 'Insulin favors glucose use and storage as absorbed glucose reaches the circulation.') : 'A lower insulin-to-glucagon ratio helps preserve circulating fuel through hepatic glucose output. The selected resistance chiefly changes the response to a given insulin signal.';
  return `<div class="reg-track">${node('Pancreatic islet', fed ? 'Insulin predominates' : 'Glucagon predominates', fed ? 'Beta cells respond to absorbed glucose.' : 'Alpha cells signal the need for available fuel.')}${node('Liver', fed ? 'Glycogen storage' : 'Glucose release', fed ? 'Net hepatic output falls.' : 'Glycogen breakdown and gluconeogenesis supply blood.')}${node('Muscle and adipose tissue', muscle, resistant ? 'Response to a given insulin level is reduced.' : 'Usual target sensitivity.')}</div><p>${note}</p>`;
}

const draw = { circuit: circuitOutput, pressure: pressureOutput, pupils: pupilOutput, feedback: feedbackOutput, glucose: glucoseOutput };

function renderOriginal(id) {
  const kind = labKinds[id];
  if (!kind) return '';
  const [title, prompt] = labText[kind];
  if(kind==='feedback'){
    const prediction=key=>'<select data-feedback-'+key+'><option value="">Choose level</option><option>Low</option><option>Usual</option><option>High</option></select>';
    return '<section class="reg-lab" data-reg-lab="'+id+'" aria-label="'+title+'">'+styles+'<h3>'+title+'</h3><p>'+prompt+'</p><div class="reg-controls">'+controls(kind,id)+'</div><div class="reg-controls"><label>Predict pituitary drive'+prediction('drive')+'</label><label>Predict circulating end hormone'+prediction('end')+'</label></div><label>Explain how feedback produces your pattern (optional)<textarea data-feedback-why maxlength="500" rows="2" style="display:block;width:100%;box-sizing:border-box"></textarea></label><button data-feedback-check>Compare my prediction</button> <button type="button" data-feedback-discuss hidden>Discuss my reasoning</button><p data-feedback-first></p><p data-feedback-note role="status"></p><div class="reg-out" hidden></div></section>';
  }
  const answer = kind === 'pupils' ? `<div class="reg-guess">${selectControl('prediction', 'Which pathway fits?', pupilOptions)}<button type="button" data-check-reg>Check interpretation</button></div><p data-verdict role="status"></p>` : '';
  return `<section class="reg-lab" data-reg-lab="${id}" aria-label="${title}">${styles}<h3>${title}</h3><p>${prompt}</p><div class="reg-controls">${controls(kind, id)}</div><div class="reg-out" aria-live="polite" aria-atomic="true"></div>${answer}</section>`;
}

export function mountLab(root, id, {store}={}) {
  mountGlandPractical(root,id);
  const kind = labKinds[id];
  if (!kind || !root) return;
  const selector = `[data-reg-lab="${id}"]`;
  const panel = root.matches?.(selector) ? root : root.querySelector(selector);
  if (!panel || panel.dataset.regMounted) return;
  panel.dataset.regMounted = 'true';
  const control = key => panel.querySelector(`[data-reg-input="${key}"]`);
  const read = key => control(key).value;
  const refresh = () => { panel.querySelector('.reg-out').innerHTML = draw[kind](read); };
  const verdict = panel.querySelector('[data-verdict]');
  if(kind==='feedback'){
    mountFeedbackReasoning(panel,{id,store,axes,feedbackLevels,refresh});
    return;
  }
  const observed = new Map();
  function showObserved(){
    refresh();
    if(kind==='pupils')panel.querySelector('.reg-out').insertAdjacentHTML('beforeend',pupilTable(observed));
  }
  panel.addEventListener('change', event => {
    const field = event.target.dataset.regInput;
    if (!field) return;
    if (kind === 'pupils') {
      verdict.textContent = '';
      if (field === 'case') {
        control('lamp').value = 'off';
        control('prediction').value = '';
        observed.clear();
      }
      if (field === 'lamp' && read('lamp') !== 'off') {
        const lamp=read('lamp'),test=cases[read('case')],input=lamp!==test.blockedInput;
        observed.set(lamp,{right:input&&test.blockedOutput!=='right',left:input&&test.blockedOutput!=='left'});
      }
      if (field === 'prediction') return;
    }
    showObserved();
  });
  panel.querySelector('[data-check-reg]')?.addEventListener('click', () => {
    if (observed.size < 2) {
      verdict.textContent = 'Test each eye once so you can compare both input pathways.';
      return;
    }
    const guess = read('prediction'), test = cases[read('case')];
    if (!guess) {
      verdict.textContent = 'Choose a pathway from the observations, then check it.';
      return;
    }
    verdict.textContent = guess === test.answer ? 'Correct. ' + test.explanation : 'Recheck the pattern. If the deficit follows the illuminated eye, compare the inputs. If one pupil fails with either light, compare the outputs.';
  });
  showObserved();
}

export function renderLab(id) {
  return renderGlandPractical(id)+renderOriginal(id);
}
