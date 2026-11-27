import * as THREE from 'three';
import {mountOrganViewer} from './ap2-organ-viewer.js';

// Only geometry from the same BodyParts3D 4.0 donor belongs in this scene.
const layers={
  skeleton:{label:'Skeleton',color:'#e9ddc3'},
  glands:{label:'Endocrine organs',color:'#deaf77'},
  central:{label:'Central endocrine structures',asset:'assets/ap2-glands/cranial-glands.glb',color:'#88c6cd'},
  heart:{label:'Heart walls',asset:'assets/ap2-thorax.glb',color:'#cb7b81'},
  arteries:{label:'Right leg arteries',asset:'assets/ap2-leg-vessels.glb',color:'#e07c65'}
};
const structures={
  pineal:['central','Pineal gland','The pineal gland lies behind the third ventricle and releases melatonin.'],
  hypothalamus:['central','Hypothalamus','The hypothalamus lies below the thalamus and connects with the pituitary through the infundibulum.'],
  pituitary:['glands','Pituitary gland','A small gland in the sella turcica at the base of the skull.'],
  thymus:['glands','Thymus','The thymus occupies the upper anterior mediastinum behind the sternum and overlaps the great-vessel region.'],
  pancreas:['glands','Pancreas','The head and tail extend across the upper abdomen. Endocrine islets are microscopic.'],
  right_adrenal:['glands','Right adrenal gland','The right adrenal lies at the superomedial part of the right kidney.'],
  left_adrenal:['glands','Left adrenal gland','The left adrenal curves alongside the upper medial border of the left kidney.'],
  right_kidney:['glands','Right kidney','The kidney is a reference for the adrenal and also secretes renin and erythropoietin.'],
  left_kidney:['glands','Left kidney','Compare its position with the right kidney and follow its superior pole to the adrenal.'],
  heart:['heart','Whole heart','The four chamber walls lie behind the sternum. The left ventricle forms the apex.'],
  wall_of_right_atrium:['heart','Right atrial wall','The right atrium receives blood from the systemic veins.'],
  wall_of_left_atrium:['heart','Left atrial wall','The left atrium forms much of the posterior heart and receives the pulmonary veins.'],
  wall_of_right_ventricle:['heart','Right ventricular wall','The right ventricle forms much of the anterior surface and ejects into the pulmonary trunk.'],
  wall_of_left_ventricle:['heart','Left ventricular wall','The muscular left ventricle ejects into the aorta and forms the apex of the heart.'],
  right_external_iliac_artery:['arteries','Right external iliac artery','Follow this vessel toward the inguinal ligament, where it continues as the femoral artery.'],
  right_femoral_artery:['arteries','Right femoral artery','The femoral artery supplies the thigh and passes through the adductor hiatus.'],
  right_popliteal_artery:['arteries','Right popliteal artery','Orbit to the back of the knee to see the popliteal artery behind the joint.'],
  right_anterior_tibial_artery:['arteries','Right anterior tibial artery','Follow the anterior leg toward the ankle, where this vessel continues as dorsalis pedis.'],
  right_posterior_tibial_artery:['arteries','Right posterior tibial artery','This artery descends through the posterior leg and passes behind the medial malleolus.'],
  right_dorsalis_pedis_artery:['arteries','Right dorsalis pedis artery','Find this continuation of the anterior tibial artery on the dorsum of the foot.']
};

export function bodySystemsHTML(){
  const toggles=Object.entries(layers).map(([key,{label}])=>`<label><input type="checkbox" data-body-layer="${key}" checked> ${label}</label>`).join('');
  const options=Object.entries(layers).filter(([key])=>key!=='skeleton').map(([key,{label}])=>`<optgroup label="${label}">${Object.entries(structures).filter(([,v])=>v[0]===key).map(([id,[,name]])=>`<option value="${id}">${name}</option>`).join('')}</optgroup>`).join('');
  return `<section class="ap2-body-systems" data-body-systems><style>
    .ap2-body-systems{min-width:0}.ap2-body-controls,.ap2-body-pick{display:flex;flex-wrap:wrap;align-items:center;gap:.35rem .85rem;margin:.55rem 0}.ap2-body-controls label{display:inline-flex;align-items:center;gap:.35rem;min-height:38px;cursor:pointer}.ap2-body-controls input{accent-color:#a8d4b8}.ap2-body-pick label{min-width:0;display:grid;gap:.18rem}.ap2-body-pick select{max-width:min(84vw,24rem)}.ap2-body-info{margin:.5rem 0}.ap2-body-systems details{margin-top:.5rem}.ap2-body-systems summary{cursor:pointer}
    </style>
    <div class="ap2-body-controls" role="group" aria-label="Visible body systems">${toggles}</div>
    <div class="ap2-body-pick"><label>Find a structure <select data-body-select><option value="">Whole body</option>${options}</select></label>
    <button type="button" data-body-center disabled>Center selection</button><button type="button" data-body-full>Full-body view</button></div>
    <div data-body-model></div><p data-body-info class="ap2-body-info" aria-live="polite">Select a structure by name or tap it on the model.</p><span data-body-state role="status"></span>
    <details><summary>Specimen and credits</summary><p>The gland, heart and right-leg preparations use the same adult BodyParts3D specimen. The kidney surfaces provide adrenal landmarks. This station includes selected organs and right leg arteries. The detailed heart, flow diagrams and microscopic structures have their own chapter practicals.</p>
    <small>BodyParts3D, © The Database Center for Life Science. <a href="https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html" target="_blank" rel="noreferrer">CC Attribution 4.0 International</a> · <a href="assets/ap2-glands/SOURCES.md" target="_blank" rel="noreferrer">Gland credits</a> · <a href="assets/AP2-CARDIO-LICENSE.md" target="_blank" rel="noreferrer">Heart and artery credits</a></small></details></section>`;
}

export function mountBodySystems(parent){
  const root=parent?.matches?.('[data-body-systems]')?parent:parent?.querySelector('[data-body-systems]');
  if(!root||root.dataset.mounted)return;
  root.dataset.mounted='true';
  const get=k=>root.querySelector('[data-body-'+k+']');
  const checks=new Map([...root.querySelectorAll('[data-body-layer]')].map(el=>[el.dataset.bodyLayer,el]));
  const select=get('select'),notice=get('state'),info=get('info');
  const surfaces=new Map(), groups=Object.fromEntries(Object.keys(layers).map(key=>[key,[]]));
  const pending=new Set(),loaded=new Set(),errors=new Set();
  let api,wholeFrame,heartFrame,disposed=false,shouldCenter=false;
  const checked=key=>checks.get(key).checked;
  function note(){
    const waiting=[...pending].filter(checked).map(k=>layers[k].label.toLowerCase());
    const failed=[...errors].map(k=>layers[k].label);
    if(failed.length)notice.textContent=failed.join(', ')+' could not load. Switch the layer on again to retry.';
    else if(waiting.length)notice.textContent='Loading '+waiting.join(' and ')+'…';
    else notice.textContent=[...checks.values()].some(c=>c.checked)?'':'Choose a layer to see the specimen.';
  }
  function paint(){
    const selected=select.value;
    for(const [key,objects] of Object.entries(groups))for(const obj of objects){
      obj.visible=checked(key);
      const chosen=selected===obj.name||(selected==='heart'&&key==='heart');
      const mat=obj.material;
      mat.color.set(chosen?'#ffe391':obj.userData.bodyColor);
      const context=key==='skeleton', muted=selected&&!chosen;
      mat.transparent=Boolean(context||muted);
      mat.opacity=context?(selected?.11:.25):muted?.21:1;
      mat.depthWrite=!mat.transparent;obj.renderOrder=chosen?2:0;
    }
    get('center').disabled=!selected||!loaded.has(structures[selected][0]);
    info.textContent=selected?structures[selected][1]+' · '+structures[selected][2]:'Select a structure by name or tap it on the model.';
    api?.invalidate();note();
  }
  function mark(object,key){
    const original=object.material;
    const color=object.name.endsWith('_kidney')?'#b18175':key==='heart'&&object.name.includes('right')?'#9e7898':layers[key].color;
    object.userData.bodyColor=color;
    object.material=new THREE.MeshStandardMaterial({color,roughness:.83,side:THREE.DoubleSide});
    // Other meshes in the same glTF can share the original material.
    api.addCleanup(()=>{for(const mat of [].concat(original))mat.dispose();});
    groups[key].push(object);if(key!=='skeleton')surfaces.set(object.name,object);
  }
  function frame(objects){
    const box=new THREE.Box3();for(const object of objects)box.expandByObject(object);
    if(box.isEmpty())return;
    const size=box.getSize(new THREE.Vector3());
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(size.x,size.y,size.z),new THREE.MeshBasicMaterial());
    mesh.position.copy(box.getCenter(new THREE.Vector3()));
    api.addCleanup(()=>{mesh.geometry.dispose();mesh.material.dispose();});return mesh;
  }
  function center(){
    const id=select.value,target=id==='heart'?heartFrame:surfaces.get(id);
    if(!target||!api?.controls)return;
    shouldCenter=false;
    const previous=api.camera.position.clone().sub(api.controls.target);
    api.fit(target,previous);
  }
  async function startLayer(key){
    if(!api||disposed||!layers[key].asset||loaded.has(key)||pending.has(key))return;
    pending.add(key);errors.delete(key);note();
    try {
      const group=await api.loadLayer(layers[key].asset);
      if(disposed||!group)return;
      group.traverse(obj=>{
        if(!obj.isMesh)return;
        if(structures[obj.name]?.[0]===key)mark(obj,key);
        else obj.visible=false;
      });
      group.updateWorldMatrix(true,true);
      if(key==='heart')heartFrame=frame(groups.heart);
      loaded.add(key);
    }catch{
      if(disposed)return;
      checks.get(key).checked=false;errors.add(key);
      if(structures[select.value]?.[0]===key){select.value='';shouldCenter=false;}
    }finally{
      pending.delete(key);
      if(!disposed){
        paint();if(shouldCenter&&loaded.has(structures[select.value]?.[0]))center();
      }
    }
  }
  function whole(){
    select.value='';shouldCenter=false;paint();if(api&&wholeFrame)api.fit(wholeFrame);
  }
  for(const [key,input] of checks)input.onchange=()=>{
    if(!input.checked&&structures[select.value]?.[0]===key){whole();return;}
    if(input.checked)startLayer(key);paint();
  };
  select.onchange=()=>{
    const value=select.value;if(!value){whole();return;}
    const key=structures[value][0];checks.get(key).checked=true;
    shouldCenter=true;paint();if(loaded.has(key))center();else startLayer(key);
  };
  get('center').onclick=center;
  get('full').onclick=()=>{
    if(![...checks.values()].some(c=>c.checked))checks.get('skeleton').checked=true;
    whole();
  };
  mountOrganViewer(get('model'),{asset:'assets/ap2-glands/body-overview.glb',title:'Adult organ systems',direction:[0,0,1],
    onLoad(instance){
      api=instance;instance.addCleanup(()=>{disposed=true;});
      const base=api.model;
      base.traverse(obj=>{if(obj.isMesh)mark(obj,structures[obj.name]?.[0]||'skeleton');});
      base.updateWorldMatrix(true,true);
      wholeFrame=frame(groups.skeleton);loaded.add('glands');loaded.add('skeleton');paint();
      if(wholeFrame)api.fit(wholeFrame);
      if(shouldCenter&&loaded.has(structures[select.value]?.[0]))center();
      for(const key of Object.keys(layers))if(layers[key].asset&&checked(key))startLayer(key);
      const canvas=api.renderer.domElement,ray=new THREE.Raycaster();let down=null;
      canvas.addEventListener('pointerdown',event=>{down=[event.clientX,event.clientY];});
      canvas.addEventListener('pointerup',event=>{
        if(!down||Math.hypot(event.clientX-down[0],event.clientY-down[1])>5)return;down=null;
        const rect=canvas.getBoundingClientRect();
        ray.setFromCamera(new THREE.Vector2(2*(event.clientX-rect.left)/rect.width-1,1-2*(event.clientY-rect.top)/rect.height),api.camera);
        const hit=ray.intersectObjects([...surfaces.values()].filter(o=>o.visible),false)[0];
        if(hit){select.value=hit.object.name;shouldCenter=false;paint();}
      });
    }});
}

