import {routeSignals, drawNeuralRoute} from './ap2-neural-routes.js';
const seq=(name,labels,notes)=>({name,labels,notes});
export const signals={
  ...routeSignals,
  '12.2':{title:'Compare the shapes of neurons',modes:[
    seq('Multipolar',['Dendrites','Soma','Axon terminals'],['Several dendrites bring graded inputs toward the soma. Spinal motor neurons are a familiar example.','One axon leaves a cell body bearing many dendrites. The axon initial segment integrates local current.','Action potentials travel along the axon to its terminals.']),
    seq('Bipolar',['Receptive process','Soma','Output process'],['One receptive process extends from one pole of the cell. Examples include bipolar cells of the retina.','The soma lies between two principal processes.','A process at the other pole carries the signal onward. Retinal bipolar cells use graded signals in the usual circuit.']),
    seq('Pseudounipolar',['Peripheral branch','T junction','Central branch'],['A sensory ending generates a local signal. A spike can travel toward the cord along the peripheral branch.','The soma is off the main conduction route. The spike passes the T junction toward the central branch.','The central branch enters the CNS. The two branches are portions of one process.'])]},
  '12.4':{title:'Follow an impulse along an axon',modes:[
    seq('Myelinated',['Node 1 fires','Current spreads beneath myelin','Node 2 fires','Current spreads onward','Node 3 fires'],['Voltage-gated sodium channels open at the first node of Ranvier.','Local current spreads passively through the internode. Myelin reduces leakage and membrane capacitance.','The second node reaches threshold and regenerates the action potential.','The previous node is refractory while current depolarizes membrane ahead.','The third node regenerates the spike. The signal is renewed at nodes along the axon.']),
    seq('Unmyelinated',['First segment fires','Adjacent segment fires','Middle segment fires','Next segment fires','Distal segment fires'],['An action potential depolarizes one patch of membrane.','Local circuit current brings the adjacent membrane to threshold.','Each excitable segment regenerates the spike.','Recently active channels behind the wave are refractory.','The impulse has propagated continuously along exposed axolemma. The spacing is schematic.'])]},
  '12.5':{title:'Follow a signal across a synapse',modes:[
    seq('Chemical',['Spike reaches terminal','Calcium enters','Vesicles fuse','Transmitter binds','Signal ends'],['A presynaptic action potential depolarizes the terminal.','Voltage-gated calcium channels open. Extracellular calcium enters down its electrochemical gradient.','Calcium binding promotes fusion of synaptic vesicles with the presynaptic membrane and exocytosis into the cleft.','Transmitter diffuses across the cleft and binds receptors. The effect depends on receptor type and ion gradients.','Uptake, enzymatic degradation or diffusion removes transmitter.']),
    seq('Electrical',['Cell A depolarizes','Current through gap junctions','Cell B responds','Reverse the gradient','Current from B to A'],['A voltage difference develops across two electrically coupled cells.','Ions pass directly through connexon channels connecting their cytoplasm.','Current changes the voltage of the neighboring cell with little delay.','Here cell B becomes more positive than A.','Current can pass the other way in this illustrative nonrectifying junction. Some electrical synapses rectify.'])]}
};
const paths=[[[35,35],[108,67],[245,67]],[[31,67],[131,67],[245,67]],[[31,67],[125,67],[245,67]]];
function path(d,color='#c4dbc9',width=4){return '<path d="'+d+'" fill="none" stroke="'+color+'" stroke-width="'+width+'" stroke-linejoin="round" stroke-linecap="round"/>';}
function dot(x,y,r=7,color='#f6b573'){return '<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="'+color+'" stroke="#15272c" stroke-width="1.5"/>';}
function neuron(mode,step){
  const soma=mode===2?[125,30]:mode===0?[108,67]:[131,67];
  let d=mode===0?'M27 25L52 45L108 67 M32 64L108 67 M35 104L61 79L108 67 M52 45L62 22 M108 67H214L247 45 M214 67L247 86':mode===1?'M31 67H224L246 55 M224 67L246 79':'M28 67H226L245 56 M226 67L245 79 M125 67V30';
  const [x,y]=paths[mode][step];
  return path(d)+dot(soma[0],soma[1],13,'#78ad99')+dot(soma[0],soma[1],4,'#e4efdc')+'<circle cx="'+x+'" cy="'+y+'" r="12" fill="none" stroke="#f5b871" stroke-width="3" stroke-dasharray="4 2"/>';
}
function axon(mode,step){
  let s=path('M24 65H261','#afc6b9',7);
  if(!mode)for(const x of [51,101,151,201])s+='<rect x="'+x+'" y="50" width="37" height="30" rx="11" fill="#789bb9" stroke="#c4dbe1"/>';
  const x=mode?38+step*49:[44,75,94,119,144][step];
  if(!mode&&step%2)s+=path('M'+(x-24)+' 35q16 -18 34 0l-6 -2','#f5b871',2);
  return s+dot(x,65)+path('M28 99H254l-9 -4','#85a6a1',1.5);
}
function synapse(mode,step){
  let s=mode?path('M20 30H120V91H20 M260 30H157V91H260','#79ad9b',4):path('M52 11Q56 38 95 47Q117 54 100 70H15Q0 55 27 48Q54 38 52 11 M8 91Q72 83 108 91H260','#8fbba6',4);
  if(mode){
    for(const y of [47,65,80])s+=path('M120 '+y+'H157','#c9b5db',7);
    const x=[56,139,213,216,104][step];
    s+=dot(x,65)+path(step>2?'M210 102H65l8 -4':'M65 102H210l-8 -4','#f4bf80',2);
  }else{
    if(step<=2){for(const x of [31,50,69])s+=dot(x,56,5,'#e6b789');}
    if(step===0)s+=path('M51 14v24l-4 -6','#f5b871',3);
    if(step===1)s+=dot(101,48,5,'#82dcff')+path('M124 41L96 53l6 -6','#82dcff',2);
    if(step===2||step===3)for(const [x,y] of [[45,72],[54,78],[62,74],[66,82],[52,85]])s+=dot(x,y,2.8);
    for(const x of [37,58,79])s+=path('M'+x+' 94v-6l-3 -3m3 3 3 -3',step===3?'#f6b573':'#b7cdd1',2);
    if(step===4)s+=path('M55 79Q87 76 110 67l-8 0','#e6b789',2);
    s+='<text x="135" y="56" font-size="12" fill="#dbe9de">Presynaptic terminal</text><text x="135" y="108" font-size="12" fill="#dbe9de">Postsynaptic cell</text>';
  }
  return s;
}
export function renderNeuralSignal(id){
  const s=signals[id];if(!s)return '';
  return '<section class="neuro-signal" data-process="'+id+'"><h3>'+s.title+'</h3><div class="course-actions"><label>Compare <select data-mode>'+s.modes.map((m,i)=>'<option value="'+i+'">'+m.name+'</option>').join('')+'</select></label><button type="button" data-step-back aria-label="Previous stage">←</button><button type="button" data-step-next aria-label="Next stage">→</button><button type="button" data-play-signal>Play sequence</button></div><svg viewBox="0 0 280 116" role="img"></svg><p data-process-caption aria-live="polite"></p></section>';
}
export function mountNeuralSignal(root,id){
  const panel=root?.querySelector('[data-process="'+id+'"]');if(!panel||panel.dataset.ready)return;
  panel.dataset.ready='true';
  const mode=panel.querySelector('[data-mode]'),svg=panel.querySelector('svg'),caption=panel.querySelector('[data-process-caption]');
  const back=panel.querySelector('[data-step-back]'),next=panel.querySelector('[data-step-next]'),play=panel.querySelector('[data-play-signal]');
  let stage=0,timer=0;
  const sequence=()=>signals[id].modes[+mode.value];
  function stop(){clearTimeout(timer);timer=0;play.textContent='Play sequence';play.setAttribute('aria-pressed','false');}
  function draw(){
    const seq=sequence(),n=+mode.value;
    svg.innerHTML=routeSignals[id]?drawNeuralRoute(id,n,stage):(id==='12.2'?neuron:id==='12.4'?axon:synapse)(n,stage);
    svg.setAttribute('aria-label',seq.name+' · '+seq.labels[stage]);
    caption.textContent=(stage+1)+' / '+seq.labels.length+' · '+seq.labels[stage]+'. '+seq.notes[stage];
    back.disabled=stage===0;next.disabled=stage===seq.labels.length-1;
  }
  mode.onchange=()=>{stop();stage=0;draw();};back.onclick=()=>{stop();stage--;draw();};next.onclick=()=>{stop();stage++;draw();};
  play.onclick=()=>{if(timer){stop();return;}if(stage===sequence().labels.length-1)stage=0;draw();play.textContent='Pause';play.setAttribute('aria-pressed','true');
    function advance(){if(!panel.isConnected||panel.hidden||document.hidden||stage>=sequence().labels.length-1){stop();return;}stage++;draw();if(stage===sequence().labels.length-1)stop();else timer=setTimeout(advance,2200);}
    timer=setTimeout(advance,2200);
  };
  draw();
}

