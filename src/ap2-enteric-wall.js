import {regionSpecimen} from './ap2-endocrine-regions.js';
import {mountOrganViewer} from './ap2-organ-viewer.js';

const reflexSource = 'https://openstax.org/books/anatomy-and-physiology-2e/pages/15-2-autonomic-reflexes-and-homeostasis';
export const entericParts = {
  mucosa:['Mucosa and villi','#d99595','The villi project from the small-intestinal mucosa into the lumen. This inner surface absorbs nutrients.'],
  submucosa:['Submucosa','#d9b886','This connective tissue supports the mucosa. A step cut into its front edge exposes its nerve plexus.'],
  submucosal_plexus:['Submucosal plexus','#448d92','Find this network inside the submucosa, above the circular muscle in this cutaway. It helps regulate secretion and local blood flow.'],
  circular_muscle:['Inner circular muscle','#b76b71','These fibers wrap around the intestine. When they contract, the lumen narrows. Their direction runs across the length of the bowel.'],
  myenteric_plexus:['Myenteric plexus','#da902d','Look between the inner circular and outer longitudinal muscle. Ganglia and connecting fibers here coordinate intestinal motility.'],
  longitudinal_muscle:['Outer longitudinal muscle','#ad7489','These fibers run along the intestine. Their contraction shortens a segment of bowel.'],
  serosa:['Serosa','#b8b9b0','The thin covering beneath the longitudinal fibers forms the outer surface of this intestinal segment.'],
  intrinsic_sensory:['Intrinsic sensory neuron','#71558c','An enteric sensory neuron detects deformation of the wall and signals to other neurons within it.'],
  enteric_interneuron:['Enteric interneuron','#bd6d25','Follow the fiber between two ganglia in the myenteric plexus. This local relay links sensory input to motor output.'],
  enteric_motor:['Enteric motor neuron','#447d70','Its cell body lies in a myenteric ganglion. Its axon reaches nearby circular muscle, the effector shown here.'],
  vagal_afferent:['Vagal sensory fiber','#50829e','A separate stretch-sensitive ending sends input along the vagus to the medulla. The sensory cell body lies in a peripheral vagal ganglion outside this view.'],
  medulla:['Medulla · CNS','#9fadd0','This inset marks the central nervous system. Sensory input enters the brainstem, and medullary circuits recruit vagal motor neurons.'],
  vagal_efferent:['Vagal preganglionic motor fiber','#447b47','This fiber leaves the medulla and reaches an enteric ganglion, where it can influence enteric motor output.']
};

export const entericRoutes = {
  short:{label:'Short intrinsic reflex', steps:[
    ['intrinsic_sensory','Stretch activates an intrinsic sensory neuron in the intestinal wall.'],
    ['enteric_interneuron','An interneuron relays the signal within the myenteric plexus. The integration occurs entirely in the gut wall.'],
    ['enteric_motor','A local motor neuron carries the signal from a myenteric ganglion to muscle.'],
    ['circular_muscle','Circular muscle contracts at this site. The circuit has remained in the peripheral nervous system.']
  ]},
  long:{label:'Long vagovagal reflex', steps:[
    ['vagal_afferent','A vagal sensory ending detects stretch. Follow its fiber from the wall to the separate medulla inset.'],
    ['medulla','The afferent signal crosses into the CNS. Brainstem circuits integrate it and recruit vagal motor output.'],
    ['vagal_efferent','Preganglionic motor output crosses out of the CNS and travels in the vagus to an enteric ganglion.'],
    ['enteric_motor','Enteric motor neurons convey the returning signal to smooth muscle.'],
    ['circular_muscle','The muscle changes its activity. This route linked the gut and brainstem before returning to the same tissue.']
  ]}
};

const region = {
  file:'../ap2-neuro/enteric-wall.glb', title:'Small-intestinal wall and enteric plexuses', dir:[.14,.64,1],
  note:'The bowel runs left to right across this opened wall. Start at the pink villi on the lumen side, then follow the cut edges down to the outer surface. The small oval at upper right represents the medulla. Its surface marks the CNS boundary.',
  credit:'Original Osteon teaching model. Layers and neurons are enlarged. The distance to the medulla is compressed. <a href="'+reflexSource+'" target="_blank" rel="noreferrer">OpenStax §15.2, Fig. 15.8</a> · <a href="assets/ap2-neuro/SOURCES.md" target="_blank" rel="noreferrer">Model sources</a>',
  targets:Object.entries(entericParts).map(([id,[label,color,note]])=>[label,new RegExp('^'+id+'$'),color,note])
};

function mountEntericStation(host) {
  host.innerHTML = '<div class="course-actions"><label>Explore or trace a reflex <select data-enteric-route><option value="">Explore the layers</option>'+
    Object.entries(entericRoutes).map(([id,r])=>'<option value="'+id+'">'+r.label+'</option>').join('')+
    '</select></label><button type="button" data-enteric-prev hidden>Previous step</button><button type="button" data-enteric-next hidden>Next step</button></div>'+
    '<p data-enteric-step aria-live="polite"></p><div data-enteric-region></div>';
  const route = host.querySelector('[data-enteric-route]'), note = host.querySelector('[data-enteric-step]');
  const prev = host.querySelector('[data-enteric-prev]'), next = host.querySelector('[data-enteric-next]');
  const anatomy = host.querySelector('[data-enteric-region]');
  regionSpecimen(anatomy,region,mountOrganViewer);
  const picker = anatomy.querySelector('[data-region-target]'), isolate = anatomy.querySelector('[data-region-isolate]');
  const ids = Object.keys(entericParts);
  let step = 0;
  function showStep(updatePicker) {
    const steps = entericRoutes[route.value]?.steps;
    prev.hidden = next.hidden = !steps;
    prev.disabled = !steps || step === 0;
    next.disabled = !steps || step === steps.length-1;
    note.textContent = steps ? 'Step '+(step+1)+' of '+steps.length+' · '+entericParts[steps[step][0]][0]+'. '+steps[step][1] : '';
    if (updatePicker) {
      isolate.checked = false;
      picker.value = steps ? String(ids.indexOf(steps[step][0])) : '';
      picker.dispatchEvent(new Event('change'));
    }
  }
  route.onchange = () => { step=0; showStep(true); };
  prev.onclick = () => { step--; showStep(true); };
  next.onclick = () => { step++; showStep(true); };
  function manualSelection() {
    const steps=entericRoutes[route.value]?.steps;
    if (steps && ids[picker.value]!==steps[step][0]) {route.value='';step=0;showStep(false);}
  }
  picker.addEventListener('change',manualSelection);
  anatomy.addEventListener('pointerup',manualSelection);
  showStep(false);
}

export function addEntericLesson(body,preset) {
  const panel = document.createElement('details');
  panel.className = 'course-card';
  panel.dataset.enteric = '';
  panel.innerHTML = '<summary>Explore the intestinal wall and enteric reflexes in 3D</summary><div data-enteric-station></div><p>Compare this local reflex with bladder voiding. Pelvic parasympathetic output contracts detrusor smooth muscle. Somatic pudendal output can contract the external urethral sphincter during storage. <a href="#ap3-lesson-25.2">Follow urine storage and release in A&amp;P III</a>.</p>';
  body.prepend(panel);
  const host = panel.querySelector('[data-enteric-station]');
  const show = () => { if (panel.open && !host.firstElementChild) mountEntericStation(host); };
  panel.addEventListener('toggle',show);
  if (preset==='enteric-wall') {
    panel.open = true; show();
    requestAnimationFrame(()=>panel.querySelector('.organ-viewport')?.scrollIntoView({block:'center'}));
  }
}
