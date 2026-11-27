import {DoubleSide,Raycaster,Vector2} from 'three';
import {mountOrganViewer} from './ap2-organ-viewer.js';
import {addSideGuide} from './ap2-side-guide.js';

const bone='#dfcfa9', nerve='#daa759', muscle='#bb7771', deep='#98adcd';
const part=(name,color,detail)=>({name,color,detail});
const lateralLobes=[
  ['frontal','#ad8eac','The frontal lobe includes the precentral gyrus. Primary motor cortex lies just anterior to the central sulcus.'],
  ['parietal','#80afa8','The parietal lobe includes the postcentral gyrus, immediately posterior to the central sulcus. It processes body sensation.'],
  ['temporal','#c7a276','The temporal lobe lies inferior to the lateral sulcus and includes primary auditory cortex.'],
  ['occipital','#8d9dc5','The occipital lobe is the posterior cerebral lobe. Primary visual cortex borders the calcarine sulcus on its medial surface.']
].flatMap(([name,color,detail])=>['Left','Right'].map(side=>part(side+' '+name+' lobe',color,detail)));
export const neuralRegions={
  brain:{title:'Major regions of the adult brain',intro:'Rotate the brain to compare the lobes, then select an internal structure to see through the cortex. Left and right refer to the person.',view:[1,.16,.32],
    link:['13.3/activity/ventricles','Explore the ventricles and basal nuclei'],parts:[...lateralLobes,
      part('Insula','#ba9fba','This cortex lies deep within the lateral sulcus, covered by portions of the frontal, parietal and temporal lobes.'),
      part('Cerebellum','#b39b81','The cerebellum sits behind the pons and medulla. It compares movement commands with sensory feedback to improve coordination.'),
      part('Corpus callosum','#dfc6a6','This large white matter commissure connects the cerebral hemispheres across the midline.'),
      part('Thalamus',deep,'The paired thalami in the diencephalon relay many sensory signals to cerebral cortex.'),
      part('Hypothalamus','#b8b278','This part of the diencephalon lies below the thalamus and links autonomic and endocrine control.'),
      part('Midbrain',deep,'The superior brainstem connects to the diencephalon. The cerebral aqueduct runs through it.'),
      part('Pons','#9eb9a4','The pons lies between the midbrain and medulla. The cerebellum sits posterior to it.'),
      part('Medulla oblongata','#bd957d','The inferior brainstem continues into the spinal cord at the foramen magnum.')]},
  'long-cord':{title:'Spinal cord and cauda equina',intro:'Follow the spinal cord from the medulla to its tapered lower end. The selected cervical and lumbar bones provide level references. Anterior and posterior roots join beyond the cord.',view:[.38,.04,-1],link:['13.2/activity/cord','Open a transverse spinal section'],parts:[
    part('Spinal cord','#adc0ac','The cord extends from the medulla to the conus medullaris, usually near L1–L2 in adults. The white matter surface represents the cord here.'),
    part('Medulla oblongata',deep,'The cord is continuous cranially with the medulla at the foramen magnum.'),
    part('Cauda equina',nerve,'These lower spinal nerve roots descend below the end of the spinal cord to reach their exits.'),
    part('Dorsal roots',nerve,'These posterior roots carry sensory information into the cord.'),
    part('Ventral roots','#d6af92','These anterior roots carry motor axons out of the cord.'),
    part('Dorsal root ganglia','#c08c6e','Sensory neuron cell bodies form swellings along the dorsal roots.'),
    part('Atlas',bone,'The first cervical vertebra surrounds the upper cord beneath the skull.'),
    part('Twelfth thoracic vertebra',bone,'T12 lies above the first lumbar vertebra and provides a landmark near the lower spinal cord.'),
    part('First lumbar vertebra',bone,'L1 is a typical vertebral level near the adult conus. Vertebral level and spinal segment are different labels.'),
    part('Second lumbar vertebra',bone,'L2 is another landmark at the approximate lower extent of the adult cord. The level varies among people.')]},
  'cranial-nerves':{title:'Twelve pairs of cranial nerves',intro:'Inspect the nerve pairs from the base of the brain. Select one to compare its origin, course and exam finding. Long nerves end at the upper-neck cut in this preparation.',view:[.20,-.68,.70],link:['16.3/activity/pupil','Test the pupillary light reflex'],parts:[
    part('Olfactory nerve (I)',nerve,'Smell. Bundles cross the cribriform plate to reach the olfactory bulbs. Test familiar odors in each nostril independently.'),
    part('Optic nerve (II)','#c4ac85','Vision and the afferent limb of the light reflex. Visual fields sample the pathway. Light in one eye normally constricts both pupils.'),
    part('Oculomotor nerve (III)',nerve,'Supplies most extraocular muscles, the upper eyelid elevator and the parasympathetic route for pupillary constriction.'),
    part('Trochlear nerve (IV)',nerve,'Supplies the superior oblique. Depression of the adducted eye helps test this muscle.'),
    part('Trigeminal nerve (V)','#bea978','Conveys general sensation from the face. The mandibular division also supplies muscles of mastication.'),
    part('Abducens nerve (VI)',nerve,'Supplies the lateral rectus, which abducts the eye.'),
    part('Facial nerve (VII)',nerve,'Supplies muscles of facial expression and carries taste from the anterior tongue through chorda tympani. Compare smiling and eye closure on the two sides.'),
    part('Vestibulocochlear nerve (VIII)','#c9b493','Carries auditory and vestibular information from the inner ear. Cochlear and vestibular branches serve different receptor organs.'),
    part('Glossopharyngeal nerve (IX)',nerve,'Carries taste from the posterior tongue and pharyngeal sensation, including the afferent limb of the gag reflex.'),
    part('Vagus nerve (X)','#b7b27d','Supplies palatal, pharyngeal and laryngeal muscles and carries parasympathetic fibers to thoracic and abdominal organs. Voice and palatal elevation help assess it.'),
    part('Accessory nerve (XI)',nerve,'Spinal rootlets ascend and leave the skull via the jugular foramen. Shoulder shrug and head rotation test trapezius and sternocleidomastoid function.'),
    part('Hypoglossal nerve (XII)',nerve,'Supplies the intrinsic tongue muscles and most extrinsic tongue muscles. Observe the tongue during protrusion.'),
    part('Brainstem',deep,'The midbrain, pons and medulla provide landmarks for cranial nerve attachments. I and II connect to the forebrain.')]},
  tongue:{title:'Tongue and gustatory nerves',intro:'Locate the tongue in relation to the hyoid and epiglottis. Follow the named nerve trunks carrying taste from different territories. Taste buds are visible in the separate magnified model.',view:[.72,.52,.91],link:['14.1/activity/taste-bud','Magnify a taste bud'],parts:[
    part('Tongue',muscle,'Taste buds occur in fungiform, foliate and circumvallate papillae. Filiform papillae provide mechanical texture. Taste qualities can be detected in multiple regions.'),
    part('Lingual nerve',nerve,'A branch of mandibular nerve (V3), it carries general sensation from the anterior tongue. Taste fibers from VII travel with it peripherally.'),
    part('Chorda tympani','#e1bc71','Taste from much of the anterior two-thirds of the tongue travels via the lingual nerve and this branch of the facial nerve (VII).'),
    part('Glossopharyngeal nerve','#e3bd98','Cranial nerve IX conveys taste from the posterior third of the tongue and from the circumvallate papillae.'),
    part('Epiglottis','#81a7a6','This elastic cartilage lies posterior to the tongue. Taste from the epiglottic region travels with the vagus (X).'),
    part('Sublingual glands','#cba687','These paired salivary glands lie in the floor of the mouth beneath the tongue. Tastants must dissolve in fluid to reach receptors.'),
    part('Hyoid',bone,'The hyoid provides attachment sites for muscles that move the tongue and larynx.')]},
  nose:{title:'Nasal cavity and olfactory fibers',intro:'Locate the nasal cavity beneath the frontal lobes. Select the olfactory fibers to see where they cross the roof. The lining shows the general nasal mucosa.',view:[.86,.13,.42],link:['14.1/activity/olfactory-epithelium','Magnify the olfactory epithelium'],parts:[
    part('Nasal mucosa','#bc8b8c','The mucosa lines the nasal cavity. The smaller olfactory region occupies the roof, superior nasal concha and adjacent septum.'),
    part('Olfactory nerve fibers',nerve,'Small bundles of receptor-neuron axons (cranial nerve I) cross foramina in the cribriform plate to synapse in olfactory bulb glomeruli.'),
    part('Ethmoid',bone,'The cribriform plate of the ethmoid forms part of the roof of the nasal cavity, below the olfactory bulbs. The gold surface shows the whole ethmoid.'),
    part('Inferior nasal conchae','#d2bca5','These paired bones project into the nasal passages below the olfactory region and increase mucosal surface area.'),
    part('Nasal bones',bone,'The paired nasal bones form the hard upper bridge of the nose.'),
    part('Major alar cartilages','#a6bfc2','These paired cartilages help shape the tip of the nose and the nostril openings.'),
    part('Orbital frontal gyri','#af98a2','These gyri mark the inferior surface of the frontal lobes superior to the nasal cavity.')]},
  'outer-ear':{title:'Left auricle, eardrum and ossicles',intro:'Trace sound from the outer ear to the ossicles, then compare the two sensory branches of cranial nerve VIII. The space between the concha and eardrum follows the external acoustic canal.',view:[.93,.20,.33],link:['14.1/activity/ear','Explore the inner-ear labyrinth'],parts:[
    part('Auricle','#bf9290','The external ear collects sound and directs it from the concha into the external acoustic canal.'),
    part('Tympanic membrane','#9abec3','Air-pressure changes in the canal vibrate this membrane. Its medial surface is attached to the malleus.'),
    part('Malleus',bone,'The handle follows the eardrum and passes vibration to the incus.'),
    part('Incus','#ccac8b','The incus transmits vibration from the malleus to the stapes.'),
    part('Stapes','#c6be92','The stapes footplate drives the oval window and produces waves in the fluid of the inner ear.'),
    part('Cochlear nerve',nerve,'This branch of VIII carries signals from the cochlea to the brainstem after hair cells transduce vibration.'),
    part('Vestibular nerve','#b9a880','This branch of VIII carries balance information from the vestibular apparatus.')]},
  'taste-bud':{title:'Taste bud and sensory ending',intro:'A magnified teaching cutaway shows an individual taste bud. Trace the path from the pore to a gustatory sensory fiber.',view:[.12,.25,1],reconstruction:true,link:['14.1/activity/tongue','Return to the tongue'],parts:[
    part('Taste pore','#c89e8c','Dissolved tastants reach the apical microvilli through an opening in the surrounding epithelium. The rim outlines the opening.'),
    part('Gustatory microvilli','#d9bb74','These projections extend into the taste pore and increase the membrane surface exposed to dissolved chemicals.'),
    part('Gustatory receptor cell','#a9b47c','This specialized epithelial cell transduces a tastant. Signaling to an afferent fiber conveys taste information.'),
    part('Neighboring taste cells','#b58589','Different cell types within one bud support transduction and signaling. Only representative cells are shown.'),
    part('Basal cells','#947c9e','These small cells near the base participate in renewal of taste bud cells.'),
    part('Gustatory afferent',nerve,'Branches of sensory axons contact cells at the basal portion of the bud. Afferents carry the signal to the brainstem.')]},
  'olfactory-epithelium':{title:'Olfactory receptor and cilia',intro:'A magnified teaching cutaway shows a bipolar neuron among supporting cells. Follow an odorant from the nasal air to the neuron’s apical receptor surface.',view:[.20,.22,1],reconstruction:true,link:['14.1/activity/nose','Return to the nasal cavity'],parts:[
    part('Olfactory cilia','#d5b56f','Odorants dissolved in mucus bind receptors on these nonmotile cilia arising from the dendritic knob.'),
    part('Dendritic knob','#9cc2ae','The apical knob anchors the olfactory cilia and joins a dendrite that reaches down to the neuron’s cell body.'),
    part('Olfactory receptor neuron','#88b4a8','An olfactory receptor is a bipolar sensory neuron. Sufficient depolarization initiates action potentials in its axon.'),
    part('Olfactory axon',nerve,'The basal axon joins bundles of cranial nerve I that traverse the cribriform plate and end in the olfactory bulb.'),
    part('Supporting cells','#bd9099','Tall supporting cells surround and maintain the olfactory receptor neurons.'),
    part('Basal cells','#9a83a9','Basal progenitor cells can replace olfactory receptor neurons in this epithelium.')]},
};

const option=(label,value)=>'<option value="'+value+'">'+label+'</option>';
export function renderNeuralRegion(kind){
  const spec=neuralRegions[kind];
  return '<section class="course-card neuro-specimen" data-neuro-specimen="'+kind+'"><h3>'+spec.title+'</h3><p>'+spec.intro+'</p><button data-load-specimen>Open the 3D specimen</button><div data-specimen-content hidden><div class="course-actions" data-explore><label>Structure <select data-region-target>'+option('Entire specimen','')+spec.parts.map((p,i)=>option(p.name,i)).join('')+'</select></label><button data-focus-part disabled>Focus selection</button><label><input type="checkbox" data-alone disabled> Show alone</label></div><div data-specimen-host></div><p data-region-reading role="status"></p><button data-spot-open>Try a hidden-label identification</button><div data-spot hidden><label>Name the gold structure <select data-spot-pick>'+option('Choose a name','')+spec.parts.map((p,i)=>option(p.name,i)).join('')+'</select></label><div class="course-actions"><button data-spot-check>Check structure</button><button data-spot-next>Another target</button><button data-spot-leave>Return to exploration</button></div><p data-spot-verdict role="status"></p></div></div><small>'+(spec.reconstruction?'Original enlarged teaching reconstruction. Cell sizes, numbers and spacing are illustrative.':'Z-Anatomy regional specimen. Named surfaces retain their source positions. Teaching colors identify regions.')+' <a href="assets/ap2-neuro/SOURCES.md" target="_blank" rel="noreferrer">Source and adaptations ↗</a></small><div class="course-actions"><a href="#ap2-lesson-'+spec.link[0]+'">'+spec.link[1]+' ↗</a></div></section>';
}

export function startNeuralRegion(panel,kind){
  const spec=neuralRegions[kind],get=name=>panel.querySelector('[data-'+name+']'),picker=get('region-target'),focus=get('focus-part'),alone=get('alone'),guess=get('spot-pick');
  let api,quiz=false,target='',remaining=[];const surfaces=new Map();
  function paint(){
    const i=target===''?-1:Number(target);
    for(const [mesh,index] of surfaces){
      const selected=i===index,dim=i!==-1&&!selected;
      mesh.visible=!(dim&&alone.checked);
      for(const material of [].concat(mesh.material)){
        material.color.set(selected?'#ffd880':quiz?'#92a5ac':spec.parts[index].color);
        material.transparent=dim;material.opacity=dim?.11:1;material.depthWrite=!dim;material.side=DoubleSide;
      }
    }
    focus.disabled=alone.disabled=i===-1||!surfaces.size;
    get('region-reading').textContent=quiz?'Rotate the specimen to identify the gold surface.':i===-1?'Select a structure from the list or tap it on the specimen.':spec.parts[i].name+' · '+spec.parts[i].detail;
    api?.invalidate();
  }
  function frame(){const mesh=[...surfaces].find(([,i])=>i===Number(target))?.[0];if(api&&mesh)api.fit(mesh,api.camera.position.clone().sub(api.controls.target));}
  picker.onchange=()=>{target=picker.value;if(target==='')alone.checked=false;paint();if(api&&(target===''||alone.checked))target===''?api.fit():frame();};
  focus.onclick=frame;
  alone.onchange=()=>{paint();if(alone.checked)frame();else api?.fit();};
  function next(){
    if(!remaining.length){remaining=spec.parts.map((_,i)=>i);for(let i=remaining.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[remaining[i],remaining[j]]=[remaining[j],remaining[i]];}if(String(remaining.at(-1))===target)remaining.reverse();}
    target=String(remaining.pop());guess.value='';get('spot-verdict').textContent='';paint();if(api)api.fit();
  }
  get('spot-open').onclick=()=>{quiz=true;alone.checked=false;get('explore').hidden=true;get('spot-open').hidden=true;get('spot').hidden=false;next();guess.focus();};
  get('spot-next').onclick=next;
  get('spot-check').onclick=()=>{get('spot-verdict').textContent=guess.value===''?'Choose a name first.':guess.value===target?'Correct. '+spec.parts[+target].detail:'Look at the highlighted surface and try again.';};
  get('spot-leave').onclick=()=>{quiz=false;get('spot').hidden=true;get('explore').hidden=false;get('spot-open').hidden=false;target=picker.value='';paint();api?.fit();get('spot-open').focus();};
  get('spot-open').disabled=true;
  paint();
  api=mountOrganViewer(get('specimen-host'),{asset:'assets/ap2-neuro/'+kind+'.glb',title:spec.title,direction:spec.view,colors:()=>'#a8b7b6',onLoad(ready){
    api=ready;ready.model.traverse(mesh=>{
      if(!mesh.isMesh)return;
      const i=spec.parts.findIndex(part=>part.name===mesh.userData.teachingLabel);
      if(i<0)throw Error('Unmapped specimen part '+mesh.name);
      surfaces.set(mesh,i);
    });
    const canvas=ready.renderer.domElement,ray=new Raycaster();let down;
    if(!spec.reconstruction)addSideGuide(canvas.parentElement,ready);
    canvas.addEventListener('pointerdown',e=>{down=[e.clientX,e.clientY];});
    canvas.addEventListener('pointercancel',()=>{down=null;});
    canvas.addEventListener('pointerup',e=>{
      const start=down;down=null;
      if(quiz||!start||Math.hypot(e.clientX-start[0],e.clientY-start[1])>5)return;
      const b=canvas.getBoundingClientRect();
      ray.setFromCamera(new Vector2((e.clientX-b.left)*2/b.width-1,1-(e.clientY-b.top)*2/b.height),ready.camera);
      const hit=ray.intersectObjects([...surfaces.keys()].filter(m=>m.visible),false)[0];
      if(hit){target=picker.value=String(surfaces.get(hit.object));paint();}
    });
    get('spot-open').disabled=false;paint();
  }});
}
