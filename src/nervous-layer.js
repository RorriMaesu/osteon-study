import * as THREE from 'three';
import {areas,inArea} from './exploration.js';
import {nerveFiles,nerveByKey,nerveTermByKey,nerveInScope,nerveScopeFiles} from './nerve-data.js';

const colors={central:0xa988d2,cranial:0x71d5ef,peripheral:0x62c4df,autonomic:0x64d5ad};
const sourceViews={central:'front',cranial:'bottom',peripheral:'front',autonomic:'front'};
const $=selector=>document.querySelector(selector);

export function attachNervousLayer(viewer,{toast}){
 const group=new THREE.Group();
 viewer.scene?.add(group);
 const requests=new Map(),loaded=new Map(),failed=new Set();
 let enabled=false,fade=null,filter='all',sequence=0,selectionLoad=0,loading=false,visible=[],stop=-1,lastRouteKey=null;
 const status=document.createElement('div');
 status.className='nerve-load-status';
 status.setAttribute('role','status');
 status.hidden=true;
 status.textContent='Loading regional nerve detail…';
 viewer.el.append(status);
 const route=document.createElement('div');
 route.className='nerve-route';
 route.hidden=true;
 route.innerHTML='<button type="button" data-nerve-prev aria-label="Previous route stop">←</button><button type="button" data-nerve-follow>Follow nerve</button><button type="button" data-nerve-next aria-label="Next route stop">→</button>';
 viewer.el.append(route);
 for(const event of ['pointerdown','pointerup','pointermove','dblclick'])route.addEventListener(event,e=>e.stopPropagation());
 route.addEventListener('pointerenter',()=>{$('#hover-label').hidden=true;});
 const previous=route.querySelector('[data-nerve-prev]'),follow=route.querySelector('[data-nerve-follow]'),next=route.querySelector('[data-nerve-next]');
 const active=()=>enabled&&!viewer.quiz&&!viewer.activeDetail&&$('#atlas-view').classList.contains('active');
 const current=()=>nerveByKey.get(viewer.selectedTerm?.representation?.nerveKey);
 const fades=()=>active()&&(fade??(!!current()||viewer.focus.level==='overview'));

 function sync(){
  for(const id of ['main-nerves-toggle','nerves-btn']){
   const b=document.getElementById(id);
   if(!b)continue;
   b.disabled=!viewer.loaded||loading||!!viewer.quiz||!!viewer.activeDetail;
   b.setAttribute('aria-pressed',String(active()));
   b.querySelector('span:last-child').textContent=loading?'Loading…':'Nerves: '+(active()?'On':'Off');
  }
  const context=$('#nerve-context-btn');
  if(context){context.hidden=!active();context.setAttribute('aria-pressed',String(fades()));}
  const record=current(),stops=record?.stops||[];
  if(record?.key!==lastRouteKey){lastRouteKey=record?.key;stop=-1;}
  route.hidden=!active()||!stops.length;
  if(!route.hidden){
   previous.hidden=next.hidden=stop<0;
   previous.disabled=stop===0;
   next.disabled=stop===stops.length-1;
   follow.textContent=stop<0?'Follow nerve':(stop+1)+' / '+stops.length+' · '+stops[stop].name;
   follow.setAttribute('aria-label',stop<0?'Follow the selected nerve':'Show the entire selected nerve');
  }
 }

 function load(key){
  if(!nerveFiles[key])return Promise.resolve([]);
  if(requests.has(key))return requests.get(key);
  const request=viewer.loadModel('nerves-'+key).then(scene=>{
   const entries=[];
   scene.traverse(mesh=>{
    if(!mesh.isMesh||!nerveByKey.has(mesh.userData.nerveKey))return;
    const record=nerveByKey.get(mesh.userData.nerveKey);
    mesh.userData.zname=record.key;
    mesh.userData.nonbone=true;
    mesh.userData.region=nerveTermByKey.get(record.key).region;
    if(!mesh.geometry.hasAttribute('normal'))mesh.geometry.computeVertexNormals();
    mesh.material=new THREE.MeshStandardMaterial({color:colors[record.category],roughness:.55,side:THREE.DoubleSide});
    mesh.visible=false;
    entries.push(mesh);
   });
   group.add(scene);
   group.updateMatrixWorld(true);
   for(const mesh of entries)mesh.userData.bounds=new THREE.Box3().setFromObject(mesh);
   loaded.set(key,entries);
   refresh();
   return entries;
  }).catch(error=>{
   requests.delete(key);
   failed.add(key);
   throw error;
  });
  requests.set(key,request);
  return request;
 }

 function refresh(){
  const record=current(),key=record?.key,scope=new Set(nerveScopeFiles(viewer));
  if(record)scope.add(record.bucket);
  group.visible=active();
  visible=[];
  const used=new Set();
  for(const bucket of [...loaded.keys()].sort((a,b)=>Number(a==='overview')-Number(b==='overview'))){
   for(const mesh of loaded.get(bucket)){
    const r=nerveByKey.get(mesh.userData.nerveKey),selected=r.key===key;
    const neuralContext=!record||selected||
      (record.category==='cranial'&&/^(Pons|Midbrain|Medulla oblongata)\.[lr]$/.test(r.key))||
      (record.bucket==='spine'&&r.key==='White matter of spinal cord');
    const wanted=(bucket==='overview'||scope.has(bucket))&&group.visible&&!used.has(r.key)&&
     (selected||((filter==='all'||r.category===filter)&&nerveInScope(r,viewer)))&&
     !viewer.peeledSurfaces.has(r.key)&&neuralContext;
    mesh.visible=wanted&&(!record||!viewer.isolated||selected);
    if(!mesh.visible)continue;
    used.add(r.key);visible.push(mesh);
    mesh.material.color.setHex(selected?0xa2f9ff:colors[r.category]);
    mesh.material.opacity=record&&!selected ? .14 : 1;
    mesh.material.transparent=mesh.material.opacity<1;
    mesh.material.depthWrite=!mesh.material.transparent;
    mesh.material.emissive.setHex(selected?0x184551:0);
   }
  }
  if(group.visible)for(const bucket of scope){
   if(!requests.has(bucket)&&!failed.has(bucket))load(bucket).catch(()=>toast('Some regional nerves could not load. Turn the layer off and on to retry.'));
  }
  viewer.needsRender=true;
  sync();
 }

 function clearSelection(){
  if(!current())return false;
  viewer.selected=[];viewer.selectedTerm=null;viewer.isolated=false;
  stop=-1;
  return true;
 }

 async function toggle(on){
  if(!viewer.loaded||viewer.quiz||viewer.activeDetail)return false;
  const revision=++sequence;
  if(!on){
   enabled=false;fade=null;loading=false;
   clearSelection();
   viewer.applyVisibility();return false;
  }
  if(enabled)return true;
  failed.clear();
  loading=true;sync();
  try{
   const local=nerveScopeFiles(viewer);
   await Promise.all(['overview',...local].map(load));
   if(revision!==sequence||viewer.quiz||viewer.activeDetail||!$('#atlas-view').classList.contains('active'))return false;
   enabled=true;
   viewer.applyVisibility();
   return true;
  }catch(error){
   console.error(error);
   toast('Nervous system could not load. Try the switch again.');
   return false;
  }finally{
   if(revision===sequence){loading=false;sync();}
  }
 }

 function find(term){
  const key=term.representation?.nerveKey,record=nerveByKey.get(key);
  return (loaded.get(record?.bucket)||loaded.get('overview')||[]).filter(mesh=>mesh.userData.nerveKey===key);
 }

 function frame(side=null){
  const record=current();
  if(!record||!viewer.selected.length)return;
  const aim=side||(record.category==='cranial'?[record.side==='l'?.62:-.62,-.76,.38]:sourceViews[record.category]);
  if(stop>=0&&record.stops[stop]){
   const point=new THREE.Vector3(...record.stops[stop].point);
   const radius=['Vagus nerve (X)','Sciatic nerve','Cauda equina'].includes(record.name) ? .047 : .037;
   const box=new THREE.Box3(point.clone(),point.clone()).expandByScalar(radius);
   viewer.frameBox(box,aim);
  }else{
   const box=new THREE.Box3();
   for(const mesh of viewer.selected)box.union(mesh.userData.bounds);
   viewer.frameBox(box.expandByScalar(.019),aim);
  }
 }

 function go(index){
  const record=current();
  if(!record)return;
  stop=index;
  frame();
  sync();
 }

 function applySelection(term,meshes,focus){
  const record=nerveByKey.get(term.representation.nerveKey);
  if(!record||!meshes.length)return;
  if(focus){
   viewer.focusHistory.push(viewer.snapshot());
   const region=term.region;
   const areaId=record.areas.length===1?record.areas[0]:null;
   viewer.region=region;
   viewer.focus={level:'region',areaId,side:areas[areaId]?.sided?record.side:null,boneId:null};
   viewer.controls.autoRotate=false;
  }
  stop=-1;
  viewer.clearPins();viewer.cutaway=null;viewer.isolated=false;
  viewer.selected=meshes;viewer.selectedTerm=term;
  viewer.peeledSurfaces.delete(record.key);
  viewer.applyVisibility();
  if(focus){frame();viewer.notifyFocus();}
 }

 previous.onclick=()=>go(Math.max(0,stop-1));
 next.onclick=()=>go(Math.min(current().stops.length-1,stop+1));
 follow.onclick=()=>go(stop<0?0:-1);

 const api={
  toggle,find,refresh,sync,clearSelection,frame,
  get enabled(){return enabled;},
  get active(){return active();},
  get visible(){return visible;},
  get filter(){return filter;},
  setFilter(value){filter=value;viewer.applyVisibility();},
  toggleContext(){fade=!fades();viewer.applyVisibility();},
  fadesContext:fades,
  contextContains(mesh){const record=current();return !!record&&active()&&record.areas.some(area=>inArea(mesh.userData.zname,area,record.side));},
  async select(term,{frame:focus=true,valid=()=>true}={}){
   if(!enabled&&!await toggle(true))return false;
   const record=nerveByKey.get(term.representation.nerveKey);
   const revision=++selectionLoad;
   status.hidden=loaded.has(record.bucket)&&(record.bucket!=='head'||viewer.detailsLoaded);
   try{await Promise.all([load(record.bucket),record.bucket==='head'?viewer.ensureDetails():null]);}
   catch(error){console.error(error);toast('The selected nerve model could not load. Select it to retry.');return false;}
   finally{if(revision===selectionLoad)status.hidden=true;}
   if(!valid()||!active())return false;
   if(filter!=='all'&&filter!==record.category)filter='all';
   applySelection(term,find(term),focus);
   return true;
  },
  intersection(ray){return active()?ray.intersectObjects(visible,false)[0]:null;},
  pick(ray,boneHit){

   const hit=api.intersection(ray);
   return hit&&(!boneHit||boneHit.object.material.opacity<.45||hit.distance<=boneHit.distance+.0005)?hit.object:null;
  },
  selectMesh(mesh){applySelection(nerveTermByKey.get(mesh.userData.nerveKey),[mesh],false);},
  routeStep(index){go(index);},
  get stop(){return stop;}
 };
 viewer.nervousLayer=api;
 return api;
}

