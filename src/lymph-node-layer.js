import * as THREE from 'three';
import {areas,inArea} from './exploration.js';
import {lymphNodeFiles,lymphNodeByKey,lymphNodeTermByKey,lymphNodeInScope,lymphNodeScopeFiles} from './lymph-node-data.js';

const nodeColor=0x81dc40,selectedColor=0xd6fb74;
const $=selector=>document.querySelector(selector);

export function attachLymphNodeLayer(viewer,{toast}){
 const group=new THREE.Group();
 group.name='Osteon lymph nodes';
 viewer.scene?.add(group);
 const requests=new Map(),loaded=new Map(),failed=new Set();
 const materials=[new THREE.MeshStandardMaterial({color:nodeColor,emissive:0x152a08,roughness:.48}),new THREE.MeshStandardMaterial({color:selectedColor,emissive:0x52651a,roughness:.48})];
 let enabled=false,loading=false,fade=null,revision=0,visible=[];
 const available=()=>viewer.loaded&&!viewer.quiz&&!viewer.activeDetail&&$('#atlas-view').classList.contains('active');
 const active=()=>enabled&&available();
 const current=()=>lymphNodeByKey.get(viewer.selectedTerm?.representation?.lymphNodeKey);
 const fades=()=>active()&&(fade??(viewer.focus.level==='overview'||!!current()));

 function sync(){
  for(const button of [$('#main-lymph-nodes-toggle'),$('#lymph-nodes-btn')]){
   button.disabled=!available();
   button.setAttribute('aria-pressed',String(active()||loading));
   button.setAttribute('aria-busy',String(loading));
   button.querySelector('[data-layer-state]').textContent=loading?'…':active()?'On':'Off';
  }
  const context=$('#lymph-node-context');
  context.hidden=!active();
  context.setAttribute('aria-pressed',String(fades()));
  context.textContent=fades()?'Restore bones':'Fade bones';
 }

 function load(bucket){
  if(!lymphNodeFiles[bucket])return Promise.resolve([]);
  if(requests.has(bucket))return requests.get(bucket);
  const request=viewer.loadModel('lymph-nodes-'+bucket).then(scene=>{
   const meshes=[];
   scene.traverse(mesh=>{
    const record=lymphNodeByKey.get(mesh.userData.lymphNodeKey);
    if(!mesh.isMesh||!record||record.status==='withheld')return;
    mesh.userData.zname=record.key;
    mesh.userData.nonbone=true;
    mesh.userData.region=lymphNodeTermByKey.get(record.key).region;
    if(!mesh.geometry.hasAttribute('normal'))mesh.geometry.computeVertexNormals();
    mesh.material=materials[0];
    mesh.visible=false;
    meshes.push(mesh);
   });
   if(!meshes.length)throw new Error('Missing node surfaces in '+bucket);
   group.add(scene);
   group.updateMatrixWorld(true);
   for(const mesh of meshes)mesh.userData.bounds=new THREE.Box3().setFromObject(mesh);
   loaded.set(bucket,meshes);
   refresh();
   return meshes;
  }).catch(error=>{
   requests.delete(bucket);
   failed.add(bucket);
   throw error;
  });
  requests.set(bucket,request);
  return request;
 }

 function refresh(){
  const record=current(),scope=new Set(lymphNodeScopeFiles(viewer)),used=new Set();
  if(record)scope.add(record.bucket);
  group.visible=active();
  visible=[];
  for(const bucket of [...loaded.keys()].sort((a,b)=>Number(a==='overview')-Number(b==='overview'))){
   for(const mesh of loaded.get(bucket)){
    const r=lymphNodeByKey.get(mesh.userData.lymphNodeKey),selected=r.key===record?.key;
    mesh.visible=group.visible&&(bucket==='overview'||scope.has(bucket))&&!used.has(r.key)&&
     !viewer.peeledSurfaces.has(r.key)&&(selected||lymphNodeInScope(r,viewer))&&(!record||!viewer.isolated||selected);
    if(!mesh.visible)continue;
    used.add(r.key);
    visible.push(mesh);
    mesh.material=materials[Number(selected)];
   }
  }
  if(group.visible)for(const bucket of scope){
   if(!requests.has(bucket)&&!failed.has(bucket))load(bucket).catch(()=>toast('Regional lymph nodes could not load. Turn Nodes off and on to retry.'));
  }
  viewer.needsRender=true;
  sync();
 }

 async function toggle(on){
  const attempt=++revision;
  if(!on){
   enabled=loading=false;fade=null;
   if(current()){viewer.selected=[];viewer.selectedTerm=null;viewer.isolated=viewer.focus.level==='bone';}
   viewer.applyVisibility();
   return false;
  }
  if(!available())return false;
  if(enabled)return true;
  failed.clear();
  loading=true;
  sync();
  try{
   await load('overview');
   if(attempt!==revision||!available())return false;
   enabled=true;
   viewer.applyVisibility();
   return true;
  }catch(error){
   if(attempt===revision){console.error(error);toast('Lymph nodes could not load. Try the switch again.');}
   return false;
  }finally{
   if(attempt===revision){loading=false;sync();}
  }
 }

 function find(term){
  const key=term.representation.lymphNodeKey,record=lymphNodeByKey.get(key);
  return (loaded.get(record?.bucket)||loaded.get('overview')||[]).filter(mesh=>mesh.userData.lymphNodeKey===key);
 }

 function frame(side){
  const record=current(),mesh=viewer.selected[0];
  if(!record||!mesh)return;
  const lateral=record.side==='l'?.35:record.side==='r'?-.35:0;
  const posterior=record.areas.includes('knee')||/Occipital|Mastoid|gluteal/i.test(record.name);
  viewer.frameBox(mesh.userData.bounds.clone().expandByScalar(.052),side||[lateral,.15,posterior?-1:1]);
 }

 function applySelection(term,meshes,focus){
  if(!meshes.length)return false;
  const record=lymphNodeByKey.get(term.representation.lymphNodeKey);
  if(focus){
   viewer.focusHistory.push(viewer.snapshot());
   const areaId=record.bucket==='lower-limb'&&record.areas.includes('knee')?'knee':record.areas[0];
   viewer.region=areas[areaId].macro;
   viewer.focus={level:'region',areaId,side:areas[areaId].sided?record.side:null,boneId:null};
   viewer.isolated=false;
   viewer.controls.autoRotate=false;
  }
  viewer.clearPins();
  viewer.cutaway=null;
  viewer.selected=meshes;
  viewer.selectedTerm=term;
  viewer.peeledSurfaces.delete(record.key);
  viewer.applyVisibility();
  if(focus){frame();viewer.notifyFocus();}
  return true;
 }

 viewer.lymphNodeLayer={
  toggle,find,refresh,sync,frame,
  get enabled(){return enabled;},
  get loading(){return loading;},
  get active(){return active();},
  get visible(){return visible;},
  fadesContext:fades,
  toggleContext(){fade=!fades();viewer.applyVisibility();},
  contextContains(mesh){
   const record=current();
   return !!record&&active()&&record.areas.some(area=>inArea(mesh.userData.zname,area,record.side));
  },
  async select(term,{frame:focus=true,valid=()=>true}={}){
   if(!enabled&&!await toggle(true))return false;
   const record=lymphNodeByKey.get(term.representation.lymphNodeKey);
   try{await load(record.bucket);}
   catch(error){if(valid()){console.error(error);toast('The selected lymph nodes could not load. Select them again to retry.');}return false;}
   if(!valid()||!active())return false;
   return applySelection(term,find(term),focus);
  },
  intersection(ray){return active()?ray.intersectObjects(visible,false)[0]:null;},
  selectMesh(mesh){applySelection(lymphNodeTermByKey.get(mesh.userData.lymphNodeKey),[mesh],false);}
 };
 return viewer.lymphNodeLayer;
}
