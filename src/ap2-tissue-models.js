import {Raycaster,Vector2} from 'three';
import {mountOrganViewer} from './ap2-organ-viewer.js';

const option=(label,keys,note)=>({label,keys,note});
export const tissueModels={
  pituitary:{
    title:'Pituitary lobes and their connections',asset:'ap2-glands/pituitary-pathways',view:[.12,.02,1],
    note:'Sagittal teaching cutaway. In the starting view the anterior lobe is on the left. The stalk joins the gland to the hypothalamus. Pathways are enlarged to make them traceable.',
    parts:{
      hypothalamus:option('Hypothalamus',['hypothalamus'],'Neurosecretory cells here control the pituitary. Their axons either release regulatory signals into portal capillaries or descend to the posterior lobe.'),
      stalk:option('Infundibulum',['stalk'],'The stalk connects the hypothalamus and pituitary. Portal vessels and descending axons pass through this region.'),
      anterior:option('Anterior pituitary',['anterior_lobe'],'Glandular cells in this larger lobe make and release pituitary hormones in response to signals in portal blood.'),
      posterior:option('Posterior pituitary',['posterior_lobe'],'Hypothalamic axon terminals store and release ADH and oxytocin in this neural lobe.'),
      primary:option('Primary capillary plexus',['primary_plexus'],'Hypothalamic hormones enter the first capillary bed at the median eminence.'),
      portal:option('Hypophyseal portal veins',['portal_veins'],'Portal veins carry blood from the first plexus toward the anterior pituitary.'),
      secondary:option('Secondary capillary plexus',['secondary_plexus'],'Hormones leave portal blood to influence anterior pituitary cells. Pituitary products enter the venous circulation.'),
      axons:option('Hypothalamic neurosecretory neurons',['neurosecretory_axons'],'Cell bodies lie in the hypothalamus. Their axons carry ADH or oxytocin along the stalk to the posterior lobe.'),
      terminals:option('Posterior axon terminals',['axon_terminals'],'An arriving action potential triggers release of stored hormone into nearby blood.'),
      blood:option('Posterior pituitary capillaries',['posterior_capillaries'],'Posterior pituitary capillaries receive ADH or oxytocin from nearby axon terminals.')
    }
  },
  adrenal:{
    title:'Cut section of an adrenal gland',asset:'ap2-glands/adrenal-section',view:[.60,.14,1],
    note:'A cut through a right adrenal gland exposes the layers from capsule to core. Enlarged clusters in the outer cortex and radial cords in the middle cortex help distinguish the zones. Compare their cellular appearance with the textbook micrograph.',
    parts:{
      capsule:option('Fibrous capsule',['capsule'],'The thin connective-tissue covering surrounds the cortex.'),
      glomerulosa:option('Zona glomerulosa',['glomerulosa'],'The thin outer cortical zone produces aldosterone.'),
      fasciculata:option('Zona fasciculata',['fasciculata'],'This broad middle zone produces cortisol.'),
      reticularis:option('Zona reticularis',['reticularis'],'The innermost cortical zone produces adrenal androgens.'),
      medulla:option('Adrenal medulla',['medulla'],'Central chromaffin cells release catecholamines after preganglionic sympathetic stimulation.')
    }
  },
  pineal:{
    title:'Pineal gland in the diencephalon',asset:'ap2-glands/cranial-glands',view:[1,.28,-.30],
    note:'This BodyParts3D specimen retains the relative positions of the cranial glands, third ventricle and superior colliculi. Compare the pineal and pituitary from the side.',
    parts:{
      pineal:option('Pineal gland',['pineal'],'The gland projects from the posterior roof of the third ventricle, above the superior colliculi. It secretes melatonin.'),
      ventricle:option('Third ventricle',['third_ventricle'],'The blue cast represents the ventricular space. The pineal is attached near its posterior roof.'),
      colliculi:option('Superior colliculi',['right_colliculus','left_colliculus'],'The paired superior colliculi lie in the midbrain below the pineal gland.'),
      hypothalamus:option('Hypothalamus',['hypothalamus'],'The hypothalamus lies anterior and inferior to the thalamus. Its suprachiasmatic nucleus coordinates circadian timing.'),
      pituitary:option('Pituitary gland',['pituitary'],'The pituitary hangs below the hypothalamus. Compare its inferior location with the posterior pineal gland.')
    }
  },
  elements:{
    title:'Formed elements of blood',asset:'ap2-blood/formed-elements',view:[0,.08,1],
    note:'Compare seven formed elements at a common approximate scale. The translucent leukocyte surfaces reveal their nuclei. Spacing, colors and granules are illustrative. This arrangement shows one of each type.',
    parts:{
      erythrocyte:option('Erythrocyte',['erythrocyte_membrane'],'Rotate the biconcave disc edge-on to see its thin center and thicker rim. A mature human erythrocyte lacks a nucleus and carries hemoglobin.'),
      platelet:option('Platelet',['platelet_fragment'],'This small anucleate fragment comes from a megakaryocyte. Platelets help form a temporary plug after vessel injury.'),
      neutrophil:option('Neutrophil',['neutrophil_cytoplasm','neutrophil_nucleus','neutrophil_granules'],'Thin bridges connect the nuclear lobes. Fine cytoplasmic granules are subtle in a routine smear. Neutrophils phagocytose microbes.'),
      eosinophil:option('Eosinophil',['eosinophil_cytoplasm','eosinophil_nucleus','eosinophil_granules'],'A bilobed nucleus and prominent reddish granules help distinguish this cell. Eosinophils participate in responses to parasites and allergens.'),
      basophil:option('Basophil',['basophil_cytoplasm','basophil_nucleus','basophil_granules'],'Coarse dark-staining granules can obscure this lobed nucleus in a smear. Their contents include histamine.'),
      lymphocyte:option('Small lymphocyte',['lymphocyte_cytoplasm','lymphocyte_nucleus'],'The round nucleus occupies most of the cell, leaving a narrow cytoplasmic rim. A routine smear alone cannot reliably identify a B or T lymphocyte.'),
      monocyte:option('Monocyte',['monocyte_cytoplasm','monocyte_nucleus'],'Find the indentation in this large cell’s kidney-shaped nucleus. Monocytes can differentiate into macrophages in tissues.')
    }
  }
};
const guideCredit='<a href="assets/ap2-glands/SOURCES.md" target="_blank" rel="noreferrer">Gland model sources</a>';
export function tissueMarkup(kind){
  const spec=tissueModels[kind];
  return '<section data-tissue-station="'+kind+'"><h4>'+spec.title+'</h4><p>'+spec.note+'</p><div class="course-actions"><label>Inspect in 3D <select data-tissue-pick><option value="">All structures</option>'+Object.entries(spec.parts).map(([key,p])=>'<option value="'+key+'">'+p.label+'</option>').join('')+'</select></label><button type="button" data-tissue-isolate aria-pressed="false" disabled>Isolate selection</button></div><p data-tissue-note aria-live="polite"></p><div data-micro-stage></div><small>'+(kind==='elements'?'<a href="assets/ap2-blood/SOURCES.md" target="_blank" rel="noreferrer">Cell model sources</a> · <a href="#ap2-lesson-18.4/activity">Compare real blood smears</a>':guideCredit)+'</small></section>';
}
const cranialColors={pineal:'#d99a54',third_ventricle:'#77a8bd',right_colliculus:'#bd9c87',left_colliculus:'#bd9c87',hypothalamus:'#9f8091',pituitary:'#ce96a4'};
export function mountTissueModel(host,kind,{onPick,initial=''}={}){
  const spec=tissueModels[kind],picker=host.querySelector('[data-tissue-pick]'),isolate=host.querySelector('[data-tissue-isolate]'),note=host.querySelector('[data-tissue-note]');
  const keys=new Map(Object.entries(spec.parts).flatMap(([key,part])=>part.keys.map(name=>[name,key])));
  let api,isolated=false;
  function update(reframe=false){
    const selected=picker.value;
    if(!selected)isolated=false;
    isolate.disabled=!selected||!api;isolate.setAttribute('aria-pressed',String(isolated));isolate.textContent=isolated?'Show surrounding structures':'Isolate selection';
    note.textContent=selected?spec.parts[selected].note:'Tap a surface or choose its name to inspect it.';
    if(!api)return;
    api.model.traverse(obj=>{
      if(!obj.isMesh)return;
      const active=keys.get(obj.name)===selected,dim=!!selected&&!active;
      obj.visible=!isolated||active;
      const sheath=kind==='pituitary'&&['hypothalamus','stalk','anterior_lobe','posterior_lobe'].includes(obj.name);
      for(const mat of [].concat(obj.material)){
        if(!mat.userData.baseTint)mat.userData.baseTint=mat.color.clone();
        mat.color.copy(mat.userData.baseTint);
        if(active&&kind!=='elements')mat.color.lerp(gold,.6);
        const alpha=obj.name.endsWith('_cytoplasm')?.26:sheath&&!active?.29:1;
        mat.opacity=dim?Math.min(.16,alpha):alpha;mat.transparent=mat.opacity<1;mat.depthWrite=!mat.transparent;
      }
    });
    if(reframe)api.fit(api.model,api.camera.position.clone().sub(api.controls.target));
    api.invalidate();
  }
  const gold={r:1,g:.68,b:.23};
  function select(value,notify=false){
    if(value&&!Object.hasOwn(spec.parts,value))return;
    picker.value=value;update(isolated);
    if(notify)onPick?.(value);
  }
  picker.onchange=()=>select(picker.value,true);
  isolate.onclick=()=>{isolated=!isolated;update(true);};
  select(initial);
  mountOrganViewer(host.querySelector('[data-micro-stage]'),{
    title:spec.title,asset:'assets/'+spec.asset+'.glb',direction:spec.view,
    colors:kind==='pineal'?name=>cranialColors[name]:undefined,
    onLoad(view){
      api=view;update();const canvas=api.renderer.domElement,ray=new Raycaster();let down;
      const start=e=>{down=e.isPrimary?[e.clientX,e.clientY]:null;};
      const tap=e=>{
        if(!down||!e.isPrimary||Math.hypot(e.clientX-down[0],e.clientY-down[1])>5)return;down=null;
        const rect=canvas.getBoundingClientRect();ray.setFromCamera(new Vector2(2*(e.clientX-rect.left)/rect.width-1,1-2*(e.clientY-rect.top)/rect.height),api.camera);
        const meshes=[];api.model.traverseVisible(o=>{if(o.isMesh)meshes.push(o);});
        const hits=ray.intersectObjects(meshes,false);
        // Inside a gland, permit selection of a solid capillary through its translucent covering.
        const hit=hits.find(h=>h.object.material.opacity>=.95)||hits[0];
        if(hit)select(keys.get(hit.object.name)||'',true);
      };
      canvas.addEventListener('pointerdown',start);canvas.addEventListener('pointerup',tap);api.addCleanup(()=>{canvas.removeEventListener('pointerdown',start);canvas.removeEventListener('pointerup',tap);});
    }
  });
  return {select};
}
