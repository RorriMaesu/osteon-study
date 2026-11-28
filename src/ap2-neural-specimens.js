import {Plane,Vector3,DoubleSide} from 'three';
import {rememberOrganTeachingColor} from './organ-tissue-material.js';
import {mountOrganViewer} from './ap2-organ-viewer.js';
import {mountMechanicalMotion} from './organ-motion-regulation-dynamics.js';
import {eyeSectionTissue} from './organ-eye-section.js';
import {neuralRegions,renderNeuralRegion,startNeuralRegion} from './ap2-neural-regions.js';

import {cutaways,cutawayMatch,cutawayColor,brainTargets,routeQuestions} from './ap2-neural-cutaways.js';

const specimens={
  ...Object.fromEntries(Object.entries(cutaways).map(([key,value])=>[key,{...value,steps:value.routes[0][1]}])),
  ventricles:{title:'Ventricular casts in 3D',file:'ventricles',direction:[1,.16,.3],steps:[
    ['Lateral ventricles','Paired cavities in the cerebral hemispheres. Each communicates with the third ventricle through an interventricular foramen.'],
    ['Third ventricle','The narrow midline cavity is in the diencephalon.'],
    ['Cerebral aqueduct','This slender channel passes through the midbrain and connects the third and fourth ventricles.'],
    ['Fourth ventricle','Between brainstem and cerebellum, CSF can leave via apertures into the subarachnoid space.']
  ],credit:'Ventricular casts and brain landmarks derived from Osteon’s registered Z-Anatomy model.'},
  ossicles:{title:'Left middle-ear ossicles',file:'ossicles',direction:[.6,.25,.85],steps:[
    ['Malleus','The tympanic membrane moves the handle of the malleus.'],
    ['Incus','At the incudomalleolar joint, vibration passes to the incus. Its long process articulates with the stapes.'],
    ['Stapes','Movement of the stapes footplate at the oval window transfers vibration into cochlear fluid.']
  ],credit:'Three connected left-ear bones transmit a pressure vibration together. Play the sequence or move the phase slider to inspect the slowed, enlarged movement.'},
  eye:{title:'Left eye in sagittal section',file:'eye-section',direction:[1,.09,.14],steps:[
    ['Distant focus','The ciliary muscle is more relaxed. Zonular tension flattens the lens, reducing its optical power.'],
    ['Near focus','The ciliary ring contracts. Reduced zonular tension allows the elastic lens to thicken, increasing its optical power.']
  ],credit:'HuBMAP Human Reference Atlas left eye v1.3. The sagittal section and amplified changes in lens shape are teaching adaptations.'},
  ear:{title:'Inner-ear labyrinth in 3D',file:'labyrinth',direction:[.7,.45,1],steps:[
    ['Hearing','The scala vestibuli and scala tympani are highlighted. Sound produces a traveling wave along the basilar membrane between the cochlear compartments.'],
    ['Head rotation','Angular acceleration displaces endolymph relative to the semicircular ducts. This bends a cupula and changes the activity of its hair cells.'],
    ['Translation or tilt','The mass of otoconia shifts the otolithic membranes of the utricle and saccule. These organs sense linear acceleration and the orientation of the head relative to gravity.']
  ],credit:'IE-Map measured inner-ear template by Ahmadi and colleagues, with registered surfaces from David and colleagues. Highlighting identifies the responding structures.'}
};

const kindBySection={'12.2':['multipolar-neuron','axon'],'12.5':['chemical-synapse'],'12.3':['cord'],'12.4':['axon'],'13.4':['cord','long-cord','cranial-nerves'],'15.1':['cardiac-autonomic'],'13.1':['ventricles','brain'],'13.2':['brain','long-cord','ventricles','cord'],'13.3':['ventricles','cerebral-arteries','dural-sinuses'],'14.1':['eye','skin-receptors','outer-ear','ossicles','ear','nose','olfactory-epithelium','tongue','taste-bud'],'14.2':['brain'],'16.2':['brain'],'16.3':['eye','cranial-nerves'],'16.5':['brain']};
const regions=[
  ['Ventricular cast',[],'Follow each connected space.'],
  ['Telencephalon · caudate',['caudatenucleus'],'The caudate follows the curvature of the lateral ventricle. The telencephalon gives rise to it, the cortex and other components of the cerebral hemispheres.'],
  ['Telencephalon · lentiform nucleus',['putamen','globuspallidus'],'The putamen and globus pallidus form the lentiform nucleus. The globus pallidus lies medial to the putamen.'],
  ['Telencephalon · precentral gyrus',['precentralgyrus'],'This cortical ridge lies anterior to the central sulcus and contains primary motor cortex.'],
  ['Diencephalon · thalamus',['thalamus'],'The paired thalami border the midline third ventricle.'],
  ['Mesencephalon · midbrain',['midbrain'],'The midbrain surrounds the cerebral aqueduct. Mesencephalon retains its name through the five-vesicle stage.'],
  ['Metencephalon · pons',['pons'],'The metencephalon forms pons and cerebellum. The pons lies anterior to the fourth ventricle.'],
  ['Myelencephalon · medulla',['medullaoblongata'],'The myelencephalon forms the medulla, continuous caudally with the spinal cord.']
];
const targets={
  ...Object.fromEntries(Object.entries(cutaways).map(([key,value])=>[key,value.targets])),
  eye:[['Cornea','Transparent anterior curved surface providing much of the refractive power.'],['Sclera','Tough outer coat surrounding the posterior globe.'],['Retina','Neural lining containing photoreceptors.'],['Iris','Aperture-control ring in front of the lens.'],['Lens','Elastic transparent body that changes shape for near focus.'],['Ciliary muscle','Smooth muscle whose contraction reduces zonular tension.'],['Zonules','Suspensory fibers connecting the lens capsule to the ciliary body.']],
  ear:[['Anterior duct','One of three approximately orthogonal ducts sensitive to angular acceleration.'],['Lateral duct','The horizontal duct lies in a different plane from the anterior and posterior ducts.'],['Posterior duct','This duct occupies the posterior vertical plane.'],['Utricle','Its macula responds chiefly to horizontal acceleration in the upright head.'],['Saccule','Its macula responds chiefly to vertical acceleration in the upright head.'],['Scala vestibuli','The perilymph-filled passage that begins near the oval window.'],['Scala tympani','The perilymph-filled passage ending at the round window.']],
};
const nameOf = mesh => (mesh.userData.name||mesh.name).replace(/[_. ]/g,'').toLowerCase();
targets.eye.push(['Choroid','The vascular pigmented layer lies between sclera and retina.'],['Macula lutea','The macula is the central retinal region around the fovea.'],['Fovea','This small pit in the macula supports high-acuity vision.'],['Optic disc','Ganglion-cell axons leave the retina here. Its lack of photoreceptors creates the blind spot.']);
targets.ear.push(['Anterior ampulla','Dilation at one end of the anterior semicircular duct. Its crista and cupula transduce angular acceleration.'],['Lateral ampulla','Dilation at the end of the lateral semicircular duct.'],['Posterior ampulla','Dilation at the end of the posterior semicircular duct.']);
const option=(label,i)=>'<option value="'+i+'">'+label+'</option>';
export function renderNeuralSpecimens(id){
  const kinds=kindBySection[id]||[];
  return kinds.map(kind=>{
    if(neuralRegions[kind])return renderNeuralRegion(kind);
    const spec=specimens[kind];
    const atlasTarget=kind==='eye'?['Optic nerve (II).l','Locate the left optic nerve in the full atlas']:kind==='ear'||kind==='ossicles'?['Vestibulocochlear nerve (VIII).l','Locate the left vestibulocochlear nerve in the full atlas']:['Third ventricle','Locate the third ventricle in the full atlas'];
    const jump=cutaways[kind]?'<a href="'+(kind==='axon'?'#ap2-lesson-12.4/activity/signal':kind==='cord'?'#ap2-lesson-13.4/activity/schematic':'#ap2-lesson-19.3/activity')+'">'+(kind==='axon'?'Compare impulse propagation':kind==='cord'?'Trace spinal nerve fibers':'Compare the cardiac cycle')+' ↗</a>':'<a href="?nerve='+encodeURIComponent(atlasTarget[0])+'#atlas">'+atlasTarget[1]+' ↗</a>';
    const routeSelect=spec.routes?'<label>Pathway or condition <select data-specimen-route>'+spec.routes.map(([label],i)=>option(label,i)).join('')+'</select></label>':'';
    const title='<h3>'+spec.title+'</h3>';
    const heading=kind==='eye'?'<header class="course-actions">'+title+'<a class="course-link" href="#organs/paired-eyes">Explore intact eyes in 3D</a></header>':title;
    return '<section class="neuro-specimen course-card" data-neuro-specimen="'+kind+'">'+heading+'<p>'+spec.credit+' <a href="assets/ap2-neuro/SOURCES.md" target="_blank" rel="noreferrer">Model credits ↗</a></p><button type="button" data-load-specimen>'+(kind==='eye'?'Open the eye cutaway':'Open the 3D specimen')+'</button><div data-specimen-content hidden><div data-specimen-host></div><div class="course-actions">'+routeSelect+'<label>Structure or condition <select data-stage>'+spec.steps.map(([label],i)=>option(label,i)).join('')+'</select></label>'+
      (kind==='ventricles'?'<label>Section plane <select data-plane><option>Whole cast</option><option>Sagittal</option><option>Coronal</option><option>Axial</option></select></label><label>Move section <input type="range" data-slice min="0" max="100" value="50" disabled></label><label>Adult derivatives <select data-region>'+regions.map(([name],i)=>option(name,i)).join('')+'</select></label><label><input type="checkbox" data-context> Show surrounding landmarks</label><label><input type="checkbox" data-obstruction> Simulate aqueduct obstruction</label>':targets[kind]?'<label>Identify a structure <select data-identify><option value="">Show this condition</option>'+targets[kind].map(([label],i)=>option(label,i)).join('')+'</select></label>':'')+
      '<button type="button" data-play-stages>Play sequence</button></div><p data-specimen-reading role="status"></p>'+(spec.routes?'<div data-route-question><label><span data-predict-prompt></span> <select data-route-response></select></label><button type="button" data-check-route>Check prediction</button><p data-route-feedback role="status"></p></div>':'')+'<button type="button" data-spot-open>Try a hidden-label identification</button><div data-spot hidden><label>Name the highlighted surface <select data-spot-pick></select></label><div class="course-actions"><button type="button" data-spot-check>Check structure</button><button type="button" data-spot-next>Another target</button><button type="button" data-spot-leave>Return to exploration</button></div><p role="status" data-spot-verdict></p></div></div><div class="course-actions">'+jump+(kind==='eye'?(id==='14.1'?'<a href="#ap2-lesson-14.1/activity/rod">Magnify the rod light response ↗</a><a href="#ap2-lesson-16.3/activity/pupil">Test the pupillary light reflex ↗</a>':'<a href="#ap2-lesson-16.3/activity/pupil">Test the pupillary light reflex ↗</a><a href="#ap2-lesson-14.1/activity/eye">Review lens accommodation ↗</a>'):'')+'</div></section>';
  }).join('');
}

function focused(kind,stage,n){
  if(kind==='ventricles')return [n.startsWith('lateralventricle'),n==='thirdventricle',n==='aqueductofmidbrain',n==='fourthventricle'][stage];
  if(kind==='eye')return n==='lens';
  if(kind==='ossicles')return n===['malleus','incus','stapes'][stage];
  return [n.startsWith('scala'),n.endsWith('duct')||n.endsWith('ampulla'),n==='saccule'||n==='utricle'][stage];
}
function baseColor(n){
  return ({retina:'#c87b65',choroid:'#674d48',maculalutea:'#c18d55',fovea:'#bb945c',opticdisc:'#e9b9a0',cornea:'#a0d4db',iris:'#44987b',sclera:'#d4d4c6',ciliarymuscle:'#a9635a',zonules:'#cbb585',lens:'#d5e4e4',utricle:'#3ca9a1'})[n]||'#8cabc2';
}

function start(panel,kind){
  const spec=specimens[kind], stage=panel.querySelector('[data-stage]'),plane=panel.querySelector('[data-plane]'),ctx=panel.querySelector('[data-context]'),play=panel.querySelector('[data-play-stages]'),reading=panel.querySelector('[data-specimen-reading]');
  const host=panel.querySelector('[data-specimen-host]'),slice=panel.querySelector('[data-slice]'),obstruction=panel.querySelector('[data-obstruction]'),identify=panel.querySelector('[data-identify]');
  const region=panel.querySelector('[data-region]');
  const route=panel.querySelector('[data-specimen-route]');
  const steps=()=>route?spec.routes[+route.value][1]:spec.steps;
  let current=0,timer=0,animationFrame=0,api,focusAmount=0;
  const highlighted=[];
  function focusButton(before, text){
    const button=document.createElement('button');
    button.type='button';button.textContent=text;button.dataset.neuralFocus='';button.disabled=true;
    button.onclick=()=>{
      if(!api||!highlighted.length)return;
      stop();
      api.fit(highlighted,api.camera.position.clone().sub(api.controls.target));
    };
    before.before(button);return button;
  }
  const focusTargets=[focusButton(play,'Focus selection'),focusButton(panel.querySelector('[data-spot-next]'),'Focus highlighted structure')];
  let ossicles,phaseSlider;
  if(kind==='ossicles'){
    const label=document.createElement('label');label.textContent='Vibration phase ';
    phaseSlider=document.createElement('input');phaseSlider.type='range';phaseSlider.min='0';phaseSlider.max='1000';phaseSlider.value='0';phaseSlider.disabled=true;
    phaseSlider.dataset.vibrationPhase='';label.append(phaseSlider);play.before(label);play.disabled=true;
    phaseSlider.oninput=()=>{stop();ossicles?.set(+phaseSlider.value/1000);api?.invalidate();};
  }
  const spotEntries=kind==='ventricles'?brainTargets:kind==='ossicles'?spec.steps:targets[kind];
  const spotNames=spotEntries.map(([name])=>name);
  function matchesSpot(index,n){return kind==='ventricles'?n.startsWith(brainTargets[index][2]):cutawayMatch(spotNames[index],n);}
  let spot=-1,bag=[];
  const planes=[null,new Plane(new Vector3(-1,0,0)),new Plane(new Vector3(0,0,-1)),new Plane(new Vector3(0,-1,0))];
  const ranges=[null,[-.035,.035],[-.06,.035],[1.57,1.655]];
  function styleModel(){
    if(!api?.model)return;
    const naturalEye=kind==='eye'&&api.appearance==='natural';
    const showNaturalFocus=naturalEye&&spot<0&&identify.value==='';
    highlighted.length=0;
    api.model.traverse(mesh=>{
      if(!mesh.isMesh)return;
      const n=nameOf(mesh),context=kind==='ventricles'&&!/ventricle|aqueduct/.test(n);
      const matchingRegion=region&&regions[+region.value][1].some(prefix=>n.startsWith(prefix));
      const spotMatch=spot>=0&&matchesSpot(spot,n);
      const bareAxon=kind==='axon'&&route.value==='1'&&identify.value===''&&spot<0;
      mesh.visible=(!context||ctx.checked||matchingRegion||spot>=0)&&!(bareAxon&&n==='middlemyelin');
      const selection=identify?.value;
      const selected=selection!==undefined&&selection!==''?cutawayMatch(targets[kind][+selection][0],n):spec.routes?cutawayMatch(steps()[current][0],n):focused(kind,current,n);
      const upstream=n.startsWith('lateralventricle')||n==='thirdventricle';
      const occluded=obstruction?.checked;
      const active=spot>=0?spotMatch:occluded?n==='aqueductofmidbrain':region&&+region.value?matchingRegion:selected;
      if(active&&mesh.visible)highlighted.push(mesh);
      const sectionTissue=naturalEye?eyeSectionTissue(n):undefined;
      for(const m of [].concat(mesh.material)){
        const tissue=sectionTissue?.color??(spec.routes?cutawayColor(n):baseColor(n));
        rememberOrganTeachingColor(m,tissue);
        m.color.set(spot>=0?(spotMatch?'#f5b668':'#839da4'):occluded?(n==='aqueductofmidbrain'?'#c74950':upstream?'#f5b668':tissue):matchingRegion?(n.startsWith('globuspallidus')?'#ed9580':'#f5b668'):region&&+region.value?tissue:selected&&bareAxon&&current===2?'#8cb3c3':selected&&!showNaturalFocus?'#f5b668':tissue);
        const clearEyeTissue=kind==='eye'&&(n==='cornea'||n==='lens');
        m.transparent=(context&&!matchingRegion)||clearEyeTissue;
        m.opacity=context&&!matchingRegion?.12:clearEyeTissue?(n==='cornea'?.32:.78):1;
        if(kind==='eye'){
          if(sectionTissue){m.opacity=sectionTissue.opacity;m.transparent=m.opacity<1;}
          // Some HRA parts carry a teaching ID color on every vertex, which
          // would tint both the natural tissues and the anonymous gold target.
          m.vertexColors=Boolean(mesh.geometry.getAttribute('color'))&&!naturalEye&&spot<0&&identify.value==='';
          m.roughness=sectionTissue?.roughness??(clearEyeTissue?.2:n==='sclera'?.68:.84);
          m.metalness=0;
        }
        if(identify && identify.value!==''){m.transparent=!selected;m.opacity=selected?1:.16;}
        if(kind==='cardiac-autonomic'&&(n.startsWith('wallof')||n.endsWith('vertebra'))){m.transparent=true;m.opacity=.25;}
        if(spot>=0 && (kind==='eye'||kind==='ventricles'||spec.routes)){m.transparent=!spotMatch;m.opacity=spotMatch?1:.12;}
        if(spot>=0 && kind==='ear'){m.transparent=!spotMatch;m.opacity=spotMatch?1:.23;}
        m.depthWrite=!m.transparent;
        m.side=DoubleSide;
        if(plane)m.clippingPlanes=plane.selectedIndex?[planes[plane.selectedIndex]]:[];
        m.needsUpdate=true;
      }
      if(kind==='eye'){
        if(n==='lens')mesh.scale.set(1-.07*focusAmount,1-.07*focusAmount,1+.19*focusAmount);
        if(n==='ciliarymuscle')mesh.scale.set(1-.07*focusAmount,1-.07*focusAmount,1);
        if(n==='zonules')mesh.scale.set(1-.055*focusAmount,1-.055*focusAmount,1);
      }
    });
    for(const button of focusTargets)button.disabled=!highlighted.length;
    api.invalidate();
  }
  function stop(){
    clearTimeout(timer);timer=0;
    if(phaseSlider)cancelAnimationFrame(animationFrame);
    play.textContent='Play sequence';play.setAttribute('aria-pressed','false');
  }
  function step(i){
    current=i;stage.value=String(i);
    const extra=spec.routes?'':kind==='ventricles'?' In the default orientation, superior is up. The pons is anterior to the fourth ventricle.':kind==='eye'?' Watch the lens in profile. The globe stays still so you can distinguish accommodation from convergence.':kind==='ossicles'?' Gold marks this ossicle.':' Gold marks the organ associated with this stimulus.';
    reading.textContent=obstruction?.checked?'Aqueduct obstruction. The red channel marks the block. The gold lateral and third ventricles lie upstream and can enlarge. The fourth lies downstream. The cast shows their usual shapes.':identify&&identify.value!==''?targets[kind][+identify.value].join(' · '):steps()[i][1]+extra;
    if(region&&+region.value&&!obstruction.checked)reading.textContent=regions[+region.value][2]+' The ventricular cast remains visible for orientation.';
    if(kind==='eye'){
      cancelAnimationFrame(animationFrame);
      const initial=focusAmount,start=performance.now(),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
      function transition(now){
        if(!host.isConnected)return;
        const f=reduced?1:Math.min(1,(now-start)/650);
        focusAmount=initial+(i-initial)*f;styleModel();
        if(f<1)animationFrame=requestAnimationFrame(transition);
      }
      transition(start);
    }else styleModel();
  }
  const questionBox=panel.querySelector('[data-route-question]');
  if(route){
    const prompt=questionBox.querySelector('[data-predict-prompt]'),response=questionBox.querySelector('[data-route-response]'),feedback=questionBox.querySelector('[data-route-feedback]');
    const refreshQuestion=()=>{
      const [question,choices]=routeQuestions[kind][+route.value];
      prompt.textContent=question;response.innerHTML='<option value="">Choose a prediction</option>'+choices.map(option).join('');feedback.textContent='';
    };
    questionBox.querySelector('[data-check-route]').onclick=()=>{
      const [,,answer,why]=routeQuestions[kind][+route.value];
      feedback.textContent=response.value===''?'Choose a prediction first.':(+response.value===answer?'Correct. ':'Revisit the route. ')+why;
    };
    route.onchange=()=>{stop();identify.value='';stage.innerHTML=steps().map(([label],i)=>option(label,i)).join('');step(0);refreshQuestion();};
    refreshQuestion();
  }
  stage.onchange=()=>{stop();if(identify)identify.value='';if(obstruction)obstruction.checked=false;if(region)region.value='0';step(+stage.value);};
  if(region)region.onchange=()=>{stop();obstruction.checked=false;step(current);};
  if(identify)identify.onchange=()=>{stop();step(current);};
  function cut(){
    const i=plane.selectedIndex;slice.disabled=!i;
    if(i){const [lo,hi]=ranges[i];planes[i].constant=lo+(hi-lo)*(+slice.value/100);}
    styleModel();
  }
  if(plane){plane.onchange=()=>{slice.value='50';cut();};slice.oninput=cut;}
  if(ctx)ctx.onchange=styleModel;
  if(obstruction)obstruction.onchange=()=>{stop();region.value='0';step(current);};
  const spotBox=panel.querySelector('[data-spot]'),open=panel.querySelector('[data-spot-open]'),guess=panel.querySelector('[data-spot-pick]'),feedback=panel.querySelector('[data-spot-verdict]'),explore=stage.closest('.course-actions');
  guess.innerHTML='<option value="">Choose a structure</option>'+spotNames.map((label,i)=>option(label,i)).join('');
  function newTarget(){
    if(!bag.length){
      bag=spotNames.map((_,i)=>i);
      for(let i=bag.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[bag[i],bag[j]]=[bag[j],bag[i]];}
      if(bag.at(-1)===spot)bag.reverse();
    }
    spot=bag.pop();guess.value='';feedback.textContent='Rotate the specimen until you can identify the gold surface.';styleModel();
  }
  open.onclick=()=>{stop();if(plane){plane.selectedIndex=0;cut();}if(ctx)ctx.checked=false;if(region)region.value='0';if(obstruction)obstruction.checked=false;
    open.hidden=true;explore.hidden=true;reading.hidden=true;if(questionBox)questionBox.hidden=true;spotBox.hidden=false;newTarget();guess.focus();};
  panel.querySelector('[data-spot-check]').onclick=()=>{feedback.textContent=guess.value===''?'Choose a structure first.':+guess.value===spot?'Correct. '+spotNames[spot]+'. '+spotEntries[spot][1]:'Compare the highlighted surface with the nearby landmarks and try again.';};
  panel.querySelector('[data-spot-next]').onclick=newTarget;
  panel.querySelector('[data-spot-leave]').onclick=()=>{spot=-1;spotBox.hidden=true;open.hidden=false;reading.hidden=false;explore.hidden=false;if(questionBox)questionBox.hidden=false;step(current);open.focus();};
  play.onclick=()=>{
    if(timer){stop();return;}
    if(identify)identify.value='';if(obstruction)obstruction.checked=false;if(region)region.value='0';
    step(0);play.textContent='Pause';play.setAttribute('aria-pressed','true');
    if(ossicles){
      const startTime=performance.now();
      function vibrate(now){
        if(!host.isConnected||document.hidden||panel.hidden){stop();return;}
        const phase=((now-startTime)/1800)%1;
        ossicles.set(phase);phaseSlider.value=String(Math.round(phase*1000));api.invalidate();
        animationFrame=requestAnimationFrame(vibrate);
      }
      vibrate(startTime);
    }
    function next(){
      if(!host.isConnected||panel.hidden||document.hidden||current===steps().length-1){stop();return;}
      step(current+1);timer=setTimeout(next,1800);
    }
    timer=setTimeout(next,1800);
  };
  step(0);
  api=mountOrganViewer(host,{asset:'assets/ap2-neuro/'+spec.file+'.glb',title:spec.title,direction:spec.direction,colors:()=> '#aac4ce',
    onLoad(ready){
      api=ready;
      if(kind==='eye'){
        const appearance=host.querySelector('[data-organ-appearance]');
        appearance?.addEventListener('change',styleModel);
        ready.addCleanup(()=>appearance?.removeEventListener('change',styleModel));
      }
      if(phaseSlider){
        const targets=spec.steps.map(([name])=>name),bones=new Map();
        ready.model.traverse(mesh=>{if(mesh.isMesh)for(const name of targets)if(nameOf(mesh)===name.toLowerCase())bones.set(name,[mesh]);});
        if(bones.size!==targets.length)throw Error('Could not identify the three ossicles.');
        ossicles=mountMechanicalMotion({mechanism:'ossicles',targets},bones);
        phaseSlider.disabled=false;play.disabled=false;
      }
      styleModel();ready.addCleanup(()=>{stop();cancelAnimationFrame(animationFrame);ossicles?.dispose();});
    }});
}
export function mountNeuralSpecimens(root){
  for(const panel of root.querySelectorAll('[data-neuro-specimen]')){
    const button=panel.querySelector('[data-load-specimen]');
    button.onclick=()=>{
      button.hidden=true;panel.querySelector('[data-specimen-content]').hidden=false;
      const kind=panel.dataset.neuroSpecimen;
      if(neuralRegions[kind])startNeuralRegion(panel,kind);else start(panel,kind);
    };
  }
}

