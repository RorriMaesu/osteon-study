import {Group, Mesh, MeshBasicMaterial, SphereGeometry, TorusGeometry} from 'three';

// Coordinates match the openings, exposed axon nodes and receptor in the two
// cellular specimens. Voltage changes are represented by light, Ca²⁺ and
// transmitter by separate particles.
const events = {
  'multipolar-neuron': [
    ['Dendrites', 'Graded inputs develop on the dendrites.'],
    ['Cell body', 'Local voltage changes spread toward the axon.'],
    ['Initial segment', 'If summed inputs reach threshold here, an action potential begins.'],
    ['Nodes of Ranvier', 'Current spreads beneath myelin. The action potential regenerates at successive exposed nodes.'],
    ['Axon terminals', 'Depolarization reaches the terminal branches.']
  ],
  'chemical-synapse': [
    ['Presynaptic terminal', 'An action potential depolarizes the terminal.'],
    ['Voltage-gated calcium channels', 'Calcium ions (blue) enter the terminal through an open channel.'],
    ['Synaptic vesicles', 'Calcium triggers vesicle fusion. Transmitter (gold) leaves through the fusion pore.'],
    ['Ligand-gated receptors', 'Released transmitter diffuses across the cleft and binds a receptor on its outer face.'],
    ['Postsynaptic membrane', 'Receptor activation changes ion flow across the postsynaptic membrane.']
  ]
};

export function neuralMotionControls(kind) {
  if (!events[kind]) return '';
  return '<div class="course-actions" data-neural-motion><button type="button" data-nerve-play disabled>Play transmission</button><label>Signal progress <input type="range" min="0" max="100" step="1" value="0" data-nerve-progress disabled></label><span data-nerve-event></span></div>';
}

export function setupNeuralMotion(panel, kind, api, surfaces, clearSelection) {
  const stages = events[kind];
  if (!stages) return;
  const controls = panel.querySelector('[data-neural-motion]');
  const play = controls.querySelector('[data-nerve-play]');
  const progress = controls.querySelector('[data-nerve-progress]');
  const caption = controls.querySelector('[data-nerve-event]');
  const cues = new Group();
  api.model.add(cues);
  const makeCue = (shape, color) => {
    const mesh = new Mesh(shape, new MeshBasicMaterial({color}));
    cues.add(mesh);
    return mesh;
  };
  // Each glow circles one exposed gap, never the insulating sheath.
  const neuron = kind === 'multipolar-neuron';
  const nodes = neuron ? [.17,.65,1.13].map(x => {
    const ring = makeCue(new TorusGeometry(.088,.022,12,32),0xffda73);
    ring.position.x = x;
    ring.rotation.y = Math.PI/2;
    return ring;
  }) : [];
  const calcium = neuron ? null : makeCue(new SphereGeometry(.027,14,10),0x51cfff);
  const transmitter = neuron ? null : makeCue(new SphereGeometry(.022,14,10),0xffcc67);
  const byLabel = new Map([...surfaces.keys()].map(mesh => [mesh.userData.teachingLabel, mesh]));
  const restore = () => {
    for (const mesh of byLabel.values()) {
      for (const material of [].concat(mesh.material)) material.emissive?.setHex(0);
    }
  };
  let frame = 0, elapsed = 0, previous, active = false;
  const duration = 9500;
  function draw() {
    const phase = Math.min(elapsed/duration*stages.length, stages.length-.000001);
    const index = Math.floor(phase), local = phase-index;
    const [label, description] = stages[index];
    restore();
    // The three spatially distinct node glows show the order of regeneration.
    if (!(neuron && index === 3)) {
      for (const material of [].concat(byLabel.get(label).material)) material.emissive.setHex(0x8e5d12);
    }
    nodes.forEach((node,i) => { node.visible = index === 3 && i === Math.floor(local*nodes.length); });
    if (!neuron) {
      byLabel.get('Neurotransmitter').visible = false;
      calcium.visible = index === 1;
      calcium.position.set(-.34, -.08 + .46*local, .23);
      transmitter.visible = index === 2 || index === 3;
      if (index === 2) transmitter.position.set(.10,.24-.13*local,.21);
      if (index === 3) {
        // Bind the external receptor domain, beside the pore, rather than
        // depicting a neurotransmitter entering the receiving cell.
        transmitter.position.set(.10+.11*local,.11-.235*local,.21-.07*local+.025*Math.sin(local*2*Math.PI));
      }
    }
    cues.visible = true;
    progress.value = String(Math.round(elapsed/duration*100));
    progress.setAttribute('aria-valuetext', label);
    if (caption.textContent !== description) caption.textContent = description;
    api.invalidate();
  }
  function pause() {
    if (frame) cancelAnimationFrame(frame);
    frame=0; previous=undefined;
    play.textContent = elapsed >= duration ? 'Replay transmission' : active ? 'Resume transmission' : 'Play transmission';
  }
  function stop() {
    active = false; elapsed = 0; pause(); cues.visible = false;
    progress.value = '0'; progress.removeAttribute('aria-valuetext');
    caption.textContent = ''; restore();
    if (!neuron) byLabel.get('Neurotransmitter').visible = true;
    api.invalidate();
  }
  function activate() {
    if (active) return;
    clearSelection(); active = true;
  }
  function tick(time) {
    if (previous !== undefined) elapsed = Math.min(duration, elapsed+Math.min(time-previous,100));
    previous = time; draw();
    if (elapsed >= duration) pause();
    else frame = requestAnimationFrame(tick);
  }
  play.onclick = () => {
    if (frame) { pause(); return; }
    activate(); if (elapsed >= duration) elapsed = 0;
    draw(); play.textContent = 'Pause transmission'; frame=requestAnimationFrame(tick);
  };
  progress.oninput = () => { activate(); elapsed = duration*Number(progress.value)/100; pause(); draw(); };
  play.disabled = progress.disabled = false; stop();
  api.addCleanup(pause);
  return {stop, controls};
}
