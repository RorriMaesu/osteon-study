import * as THREE from 'three';
import {mountOrganViewer} from './ap2-organ-viewer.js';
import {specimens as catalogue} from './ap3-specimens-catalog.js';
import {specimenStations} from './ap3-specimens-practical.js';
import {descriptions} from './ap3-specimens-descriptions.js';
import {mountNodeContext} from './ap3-specimens-node-context.js';

export const specimens=catalogue.map(spec=>({...spec,stations:specimenStations[spec.id]||[]}));
const lookup=new Map(specimens.map(spec=>[spec.id,spec]));
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const credit='<a href="assets/ap3-models/SOURCES.md" target="_blank" rel="noopener">Model sources, scale and credits</a>';
const letters=index=>index<26?String.fromCharCode(65+index):letters(Math.floor(index/26)-1)+letters(index%26);
function anonymousOrder(values){
  const result=[...values];
  for(let i=result.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));[result[i],result[j]]=[result[j],result[i]];
  }
  return result;
}

export function renderSpecimen(id,{blind=false}={}){
  const spec=lookup.get(id);
  if(!spec)return '';
  const name=blind?'3D practical specimen':spec.title;
  return '<section class="ap3-specimen" data-ap3-specimen="'+escape(id)+'"><h3>'+escape(name)+'</h3>'+
    (blind?'<p>Rotate the specimen and select a surface, or use the lettered structure list.</p>':
    '<p data-ap3-explanation><strong>'+escape(spec.kind)+'</strong> · '+escape(spec.description)+'</p>')+
    '<div data-ap3-view></div><div class="ac-row"><label>Structure <select data-ap3-target disabled aria-label="Select a structure"><option value="">All structures</option></select></label>'+
    '<button type="button" data-ap3-focus disabled>Focus selection</button><label><input type="checkbox" data-ap3-isolate disabled> Isolate selection</label>'+
    (!blind?'<label><input type="checkbox" data-ap3-anonymous> Hide names</label>':'')+
    (spec.cut?'<label><input type="checkbox" data-ap3-section checked> Open section</label>':'')+
    (!blind&&spec.id==='lymph-drainage'?'<label><input type="checkbox" data-ap3-arrows checked> Flow arrows</label>':'')+
    '</div><p data-ap3-selection role="status" aria-live="polite"></p>'+
    (blind&&descriptions[id]?'<details data-ap3-described><summary>Read the spatial description of each structure</summary><dl data-ap3-descriptions></dl></details>':'')+
    (!blind&&spec.routes?'<div class="ac-row"><label>Route <select data-ap3-route><option value="">Choose a route</option>'+spec.routes.map((r,i)=>'<option value="'+i+'">'+escape(r.name)+'</option>').join('')+'</select></label><button type="button" data-ap3-prev disabled>Previous stop</button><button type="button" data-ap3-next disabled>Next stop</button></div><p data-ap3-route-state aria-live="polite"></p>':'')+
    (!blind&&spec.handoffs?'<a hidden class="course-link" data-ap3-handoff></a>':'')+
    (!blind&&spec.breathing?'<div class="ac-row"><button type="button" data-ap3-play aria-pressed="false">Play one breath</button><label>Breath time <input type="range" min="0" max="5" step="0.01" value="0" data-ap3-breath></label><button type="button" data-ap3-end-in>End-inspiration</button></div><p data-ap3-breath-state></p>':'')+
    (!blind&&id.startsWith('nodes-')?'<div class="ac-row"><label><input data-ap3-landmarks type="checkbox" checked> Skeletal landmarks</label><label><input data-ap3-dots type="checkbox" checked> Location dots</label><a data-ap3-atlas href="./?lymph-node='+encodeURIComponent(spec.targets[0].meshes[0].slice(7))+'#atlas">Find nodes on the body</a></div><p data-ap3-node-context role="status"></p>':'')+
    (!blind?'<small>'+credit+'</small>':'')+'</section>';
}

export function breathingFrame(seconds){
  const t=Math.max(0,Math.min(5,seconds)),duration=t<=2?2:3,angle=Math.PI*(t<=2?t:t-2)/duration;
  const fill=t<=2?(1-Math.cos(angle))/2:(1+Math.cos(angle))/2;
  const flow=(t<=2?1:-1)*.25*Math.PI/duration*Math.sin(angle);
  return {t,fill,volume:2.5+.5*fill,flow:Math.abs(flow)<1e-9?0:flow,
    alveolar:Math.abs(flow)<1e-9?0:-2*flow,pleural:-5-2.5*fill};
}
const surfaceColors=[
  [/rib|bone|sacrum|symphysis|coccyx/,'#d6c5af'],[/pulmonary_artery|umbilical_artery/,'#738fbb'],
  [/pulmonary_vein|umbilical_vein|artery|arteriole/,'#bf6774'],[/vein|venous|venule/,'#7199b2'],
  [/superior_lobe_of_.*lung/,'#c9939d'],[/middle_lobe_of_right_lung/,'#dba48f'],[/inferior_lobe_of_.*lung/,'#b98296'],
  [/trachea|bronchus|cartilage/,'#94b4b1'],[/diaphragm|muscle|myocard|rectus/,'#ac686e'],
  [/podocyte|follicle|epididymis|paracortex/,'#aa8cab'],[/capillaries|papilla/,'#bf6d75'],
  [/ureter|calyx|pelvis_L|renal_pelvis|urethra|bile_duct|pancreatic_duct|ductus|ejaculatory|duct_/,'#ddac68'],
  [/lymph|Yao_efferent|Node \||gallbladder/,'#78a88f'],[/cortex|kidney_left|kidney_right/,'#b57b76'],
  [/pyramid|medulla|spleen|liver/,'#9c6778'],[/capsule|amnion|hilum|umbilical_cord/,'#d6c8ae'],
  [/pancreas|testis|ovary/,'#dcb889'],[/jejunum|descending_colon|stage_16|stage_23/,'#c28a8d'],
  [/ileum|transverse_colon|stage_12|stage_20/,'#d4a197'],[/thymus|prostate|uterus/,'#b5849e']
];
function modelColor(name,object){
  // Authored teaching meshes carry material colors. Atlas files use neutral material.
  const material=[].concat(object.material)[0];
  if(material?.color&&material.color.getHex()!==0xffffff)return material.color;
  return surfaceColors.find(([pattern])=>pattern.test(name))?.[1]||'#ca9390';
}

export function mountSpecimen(container,id,{blind=false,onSelect,selected:prior=null,order}={}){
  const spec=lookup.get(id),selector='[data-ap3-specimen="'+CSS.escape(id)+'"]';
  const panel=container?.matches?.(selector)?container:container?.querySelector(selector);
  if(!panel||!spec)return ()=>{};
  const el=key=>panel.querySelector('[data-ap3-'+key+']'),picker=el('target');
  const meshes=[],targetFor=new Map(),materials=new Map(),byRaw=new Map(),motion=new Map();
  for(const target of spec.targets)for(const raw of target.meshes)byRaw.set(raw,target);
  let selected=spec.targets.find(t=>t.id===prior)||null,optionsList=[],routeIndex=-1,routeStep=0,clip,ready=false,frame=0,time=0,apex=0,viewer;
  let nodeContext;
  const hidden=()=>blind||el('anonymous')?.checked;
  function populate(){
    const restored=Array.isArray(order)?[...new Set(order)].map(key=>spec.targets.find(t=>t.id===key)).filter(Boolean):[];
    optionsList=hidden()?(restored.length?[...restored,...spec.targets.filter(t=>!restored.includes(t))]:anonymousOrder(spec.targets)):spec.targets;
    picker.replaceChildren(new Option('All structures',''));
    for(const [i,target] of optionsList.entries())picker.add(new Option(hidden()?'Structure '+letters(i):target.label,String(i)));
    if(el('descriptions'))el('descriptions').innerHTML=optionsList.map((target,i)=>'<dt>Structure '+letters(i)+'</dt><dd>'+escape(descriptions[id][target.id])+'</dd>').join('');
    picker.disabled=!blind&&!ready;
  }
  function apply(){
    const index=selected?optionsList.indexOf(selected):-1;
    const handoff=el('handoff');
    if(handoff){
      const next=!hidden()&&spec.handoffs[selected?.id];
      handoff.hidden=!next;
      if(next){handoff.href='#'+next[0];handoff.textContent=next[1];}
      else{handoff.removeAttribute('href');handoff.textContent='';}
    }
    picker.value=index<0?'':String(index);
    el('selection').textContent=selected?(hidden()?'Selected structure '+letters(index):selected.label+(selected.detail?' · '+selected.detail:'')):'';
    el('focus').disabled=el('isolate').disabled=!selected||!ready;
    if(!ready)return;
    const isolate=el('isolate').checked&&selected;
    nodeContext?.update(selected,isolate);
    if(el('atlas')&&selected)el('atlas').href='./?lymph-node='+encodeURIComponent(selected.meshes[0].slice(7))+'#atlas';
    for(const obj of meshes){
      const raw=obj.userData.ap3Raw,t=targetFor.get(obj),match=Boolean(selected&&selected===t);
      if(raw==='flow_arrows'){obj.visible=!hidden()&&el('arrows')?.checked&&!isolate;continue;}
      obj.visible=Boolean(t)&&(!isolate||match);
      const sheet=spec.cut?.test(raw)&&el('section')?.checked&&!match;
      for(const {mat,color} of materials.get(obj)){
        mat.color.copy(color);
        if(match)mat.color.set('#ffcf64');
        const soft=/kidney_capsule|capsule_of_lymph_node|umbilical_cord|amnion|compact_bone|spongy_bone|hilum_of_kidney|^podocyte_|^sixth_rib|^corpus_spongiosum/.test(raw);
        const opacity=selected&&!match?.15:soft&&!match?.31:1;
        mat.transparent=opacity<1;mat.opacity=opacity;mat.depthWrite=opacity===1;
        const planes=sheet?[clip]:[];
        if((mat.clippingPlanes?.length||0)!==planes.length)mat.needsUpdate=true;
        mat.clippingPlanes=planes;mat.side=THREE.DoubleSide;
      }
    }
    viewer.invalidate();
  }
  function select(t,notify=true){
    selected=t||null;if(!selected)el('isolate').checked=false;
    apply();if(notify)onSelect?.(selected?.id??null);
  }
  function updateRoute(){
    const r=spec.routes?.[routeIndex];
    if(!r)return;
    const target=spec.targets.find(t=>t.id===r.steps[routeStep]);
    el('route-state').textContent='Stop '+(routeStep+1)+' of '+r.steps.length+(hidden()?'':' · '+target.label);
    el('prev').disabled=routeStep===0;el('next').disabled=routeStep===r.steps.length-1;
    if(ready)select(target);
  }
  function applyBreath(t){
    const b=breathingFrame(t);time=b.t;
    const slider=el('breath');if(!slider)return;
    slider.value=b.t.toFixed(2);
    const phase=b.t===2?'End-inspiration':b.t===0||b.t===5?'End-expiration':b.t<2?'Inspiration':'Expiration';
    const value=n=>(Math.abs(n)<.005?0:n).toFixed(2);
    el('breath-state').textContent=phase+' · '+value(b.t)+' s · Lung volume '+value(b.volume)+' L · Airflow '+value(b.flow)+' L/s (inward positive) · Alveolar '+value(b.alveolar)+' cm H₂O · Intrapleural '+value(b.pleural)+' cm H₂O relative to atmosphere.';
    for(const [obj,{position,scale,center,diaphragm}] of motion){
      const dy=diaphragm?-.13*b.fill:.045*b.fill;
      const pivot=diaphragm?center:apex;
      obj.scale.y=scale.y*(1+dy);obj.position.y=position.y-pivot*dy-(diaphragm?.014*b.fill:0);
      if(!diaphragm)obj.scale.x=scale.x*(1+.027*b.fill);
    }
    viewer?.invalidate();
  }
  function stop(){
    cancelAnimationFrame(frame);frame=0;
    if(el('play')){el('play').textContent='Play one breath';el('play').setAttribute('aria-pressed','false');}
  }
  if(el('breath')){
    applyBreath(0);
    el('breath').oninput=()=>{stop();applyBreath(+el('breath').value);};
    el('end-in').onclick=()=>{stop();applyBreath(2);};
    el('play').onclick=()=>{
      if(frame){stop();return;}
      if(time>=5)time=0;
      const start=performance.now()-1000*time;
      el('play').setAttribute('aria-pressed','true');el('play').textContent='Pause breath';
      function tick(now){
        if(!panel.isConnected){stop();return;}
        applyBreath((now-start)/1000);
        if(time>=5){stop();return;}frame=requestAnimationFrame(tick);
      }
      frame=requestAnimationFrame(tick);
    };
  }
  populate();apply();
  picker.onchange=()=>select(picker.value===''?null:optionsList[Number(picker.value)]);
  el('isolate').onchange=apply;
  if(el('section'))el('section').onchange=apply;
  if(el('arrows'))el('arrows').onchange=apply;
  if(el('anonymous'))el('anonymous').onchange=()=>{
    selected=null;populate();el('isolate').checked=false;
    el('explanation').hidden=hidden();
    if(el('route')){el('route').value='';el('route').disabled=hidden();routeIndex=-1;el('route-state').textContent='';el('prev').disabled=el('next').disabled=true;}
    apply();
  };
  if(el('route')){
    el('route').onchange=()=>{
      routeIndex=el('route').value===''?-1:+el('route').value;routeStep=0;
      if(routeIndex<0){el('route-state').textContent='';el('prev').disabled=el('next').disabled=true;select(null);}
      else updateRoute();
    };
    el('prev').onclick=()=>{routeStep--;updateRoute();};el('next').onclick=()=>{routeStep++;updateRoute();};
  }
  el('focus').onclick=()=>{
    const active=meshes.filter(obj=>targetFor.get(obj)===selected);
    if(!active.length)return;
    const bounds=new THREE.Box3();
    for(const obj of active)bounds.union(new THREE.Box3().setFromObject(obj));
    const size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
    const box=new THREE.Mesh(new THREE.BoxGeometry(size.x,size.y,size.z));
    box.position.copy(center);viewer.fit(box,viewer.camera.position.clone().sub(viewer.controls.target));box.geometry.dispose();box.material.dispose();
  };
  viewer=mountOrganViewer(el('view'),{asset:spec.asset,title:blind?'Practical specimen':spec.title,
    direction:spec.direction||[.04,.04,1],colors:modelColor,onLoad:instance=>{
      viewer=instance;
      instance.model.traverse(obj=>{
        if(!obj.isMesh)return;
        let raw;
        for(let p=obj;p;p=p.parent){raw=[p.userData?.name,p.name].find(n=>byRaw.has(n)||n==='flow_arrows');if(raw)break;}
        obj.userData.ap3Raw=raw||'';targetFor.set(obj,byRaw.get(raw));meshes.push(obj);
        materials.set(obj,[].concat(obj.material).map(mat=>({mat,color:mat.color.clone()})));
        if(spec.breathing&&(/lobe_of_.*lung|^diaphragm$/.test(raw))){
          const bounds=new THREE.Box3().setFromObject(obj);
          if(raw!=='diaphragm')apex=Math.max(apex,bounds.max.y);
          motion.set(obj,{position:obj.position.clone(),scale:obj.scale.clone(),center:(bounds.max.y+bounds.min.y)/2,diaphragm:raw==='diaphragm'});
        }
      });
      const bounds=new THREE.Box3().setFromObject(instance.model);
      clip=new THREE.Plane(new THREE.Vector3(0,0,-1),bounds.getCenter(new THREE.Vector3()).z);
      if(el('node-context'))nodeContext=mountNodeContext(instance,spec,meshes,targetFor,panel);
      ready=true;picker.disabled=false;apply();if(el('breath'))applyBreath(time);updateRoute();
      const ray=new THREE.Raycaster(),canvas=instance.renderer.domElement;
      let start;
      canvas.addEventListener('pointerdown',e=>{start=[e.clientX,e.clientY];});
      canvas.addEventListener('pointercancel',()=>{start=null;});
      canvas.addEventListener('pointerup',e=>{
        if(!start||Math.hypot(start[0]-e.clientX,start[1]-e.clientY)>6)return;
        start=null;const box=canvas.getBoundingClientRect();
        ray.setFromCamera(new THREE.Vector2(2*(e.clientX-box.left)/box.width-1,1-2*(e.clientY-box.top)/box.height),instance.camera);
        const hits=ray.intersectObjects(meshes.filter(obj=>obj.visible&&targetFor.has(obj)&&targetFor.get(obj)),false)
          .filter(({object,point})=>!materials.get(object)[0].mat.clippingPlanes?.some(plane=>plane.distanceToPoint(point)<0));
        // Material dimming for a previous selection must never impede selection of a new surface.
        const hit=hits.find(({object})=>!(/umbilical_cord|amnion|kidney_capsule|capsule_of_lymph_node|hilum_of_kidney|compact_bone|spongy_bone|^corpus_spongiosum/.test(object.userData.ap3Raw)))||hits[0];
        const nearDot=nodeContext?.pick(e,box);
        if(hit||nearDot)select(hit?targetFor.get(hit.object):nearDot);
      });
      instance.addCleanup(stop);
    }});
  if(blind&&el('described')){
    const retry=el('view').querySelector('[data-retry-model]');
    const fallback=new MutationObserver(()=>{
      if(retry.hidden)return;
      el('described').open=true;
      el('view').querySelector('[data-model-status]').textContent='3D graphics are unavailable. Use the spatial descriptions below to choose a letter, or retry the model.';
    });
    fallback.observe(retry,{attributes:true,attributeFilter:['hidden']});
    viewer.addCleanup(()=>fallback.disconnect());
  }
  return ()=>{stop();viewer?.dispose();};
}

