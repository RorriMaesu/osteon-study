import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {bodyAtlas,motionsForBody,organSystemColor} from './organ-atlas-catalog.js';
import {organAssetUrl} from './organ-asset-url.js';
import {organStructureName} from './organ-structure-names.js';
import {bodyMaps,mapRoute} from './organ-atlas-bodies.js';
import {createOrganAppearance,registerOrganMaterials} from './organ-tissue-material.js';
import {createEyeAppearance} from './organ-eye-appearance.js';
import {visibleEyeHit} from './organ-eye-picking.js';

export function organStudyDestination(row,raw){
  if(raw&&row.targets.includes(raw))return mapRoute(bodyMaps[0],row,raw);
  const entries=motionsForBody(row.id);
  return entries.length?'organs/'+entries[0].id:mapRoute(bodyMaps[0],row);
}

export function attachOrganLayer(viewer,toast){
  const button=document.querySelector('#organs-layer-btn'),selection=document.querySelector('#organ-layer-study');
  const tissue=createOrganAppearance();
  const finish=document.createElement('button');finish.type='button';finish.hidden=true;
  finish.id='organ-tissue-layer-btn';finish.textContent='Natural tissue';finish.setAttribute('aria-label','Use natural organ tissue appearance');finish.setAttribute('aria-pressed','true');
  button.after(finish);
  finish.onclick=()=>{
    tissue.setMode(tissue.mode==='natural'?'teaching':'natural');
    for(const part of parts)part.eye?.setMode(tissue.mode);
    finish.setAttribute('aria-pressed',String(tissue.mode==='natural'));viewer.needsRender=true;
  };
  const index=new Map(bodyAtlas.organs.flatMap(row=>row.targets.map(name=>[name,row])));
  const parts=[];
  const pickSurfaces=new Map();
  let group,request,enabled=false,chosen=null,chosenRaw=null;
  const available=()=>viewer.loaded&&!viewer.quiz&&!viewer.activeDetail&&!viewer.muscleLayer?.coursePracticeActive&&viewer.focus.level!=='bone'&&!viewer.isolated&&document.querySelector('#atlas-view').classList.contains('active');
  function markTeeth(part,picked){
    for(const tooth of part.teeth){
      if(viewer.selected.includes(tooth))continue;
      tooth.material.emissive.setHex(picked?0x684311:0);
    }
  }
  function showStudy(row,raw){
    chosen=row;chosenRaw=raw;selection.hidden=!row;
    if(row){
      selection.href='#'+organStudyDestination(row,raw);
      selection.textContent='Study '+(raw?organStructureName('body',raw):row.label);
    }
    for(const part of parts){
      const picked=part.row===row&&(!raw||part.raw===raw);
      if(part.teeth.length)markTeeth(part,picked);
      for(const {mat,emissive} of part.materials)if(emissive){
        mat.emissive.copy(emissive);
        if(picked)mat.emissive.setHex(0x684311);
      }
    }
    viewer.needsRender=true;
  }
  function refresh(){
    const active=enabled&&available();
    button.disabled=!available();button.setAttribute('aria-busy',String(!!request&&!group&&enabled));
    finish.hidden=!active||!group||!tissue.available;
    button.setAttribute('aria-pressed',String(active));button.textContent='Organs: '+(active&&!group?'Loading…':active?'On':'Off');
    if(!group)return;
    group.visible=active;
    let limits;
    if(active&&(viewer.region!=='All regions'||viewer.focus.level==='region'||viewer.division&&viewer.division!=='All')){
      limits=new THREE.Box3();
      for(const mesh of viewer.meshes)if(mesh.visible&&!mesh.userData.nonbone&&mesh.userData.bounds)limits.union(mesh.userData.bounds);
      limits.expandByScalar(.035);
    }
    pickSurfaces.clear();
    for(const part of parts){
      const inScope=active&&!part.row.contextOnly&&(!limits||limits.intersectsBox(part.bounds));
      part.mesh.visible=inScope&&!part.teeth.length;
      if(part.mesh.visible)pickSurfaces.set(part.mesh,part.mesh);
      if(part.teeth.length&&inScope){
        // The skeleton supplies individual teeth, including any the learner has peeled.
        // Keep these as the only drawn surfaces and route a normal tap to the arch's study link.
        for(const tooth of part.teeth)if(tooth.visible)pickSurfaces.set(tooth,part.mesh);
        markTeeth(part,chosen===part.row&&(!chosenRaw||chosenRaw===part.raw));
      }
    }
    if(chosen&&![...pickSurfaces.values()].some(mesh=>mesh.userData.organRow===chosen&&(!chosenRaw||mesh.userData.organPart===chosenRaw)))showStudy(null);
    selection.hidden=!active||!chosen;
    viewer.needsRender=true;
  }
  function load(){
    if(!request)request=new GLTFLoader().loadAsync(organAssetUrl(bodyAtlas.asset)).then(gltf=>{
      group=registerOrganMaterials(gltf);group.updateMatrixWorld(true);
      group.traverse(mesh=>{
        if(!mesh.isMesh)return;
        let raw;for(let obj=mesh;obj&&!raw;obj=obj.parent)raw=[obj.userData?.name,obj.name].find(name=>index.has(name));
        const row=index.get(raw);
        if(!row){mesh.visible=false;return;}
        const color=[].concat(mesh.material)[0]?.color;
        tissue.prepare(mesh,bodyAtlas.asset,color&&color.getHex()!==0xffffff?color:organSystemColor(row.system));
        const eye=createEyeAppearance(mesh,bodyAtlas.asset,raw,()=>{viewer.needsRender=true;});
        eye?.setMode(tissue.mode);
        mesh.userData.organRow=row;mesh.userData.organPart=raw;mesh.userData.zname=organStructureName('body',raw);
        const arch=raw==='upper_teeth'?'Upper ':raw==='lower_teeth'?'Lower ':null;
        const teeth=arch?viewer.meshes.filter(tooth=>tooth.userData.tooth&&tooth.userData.zname.startsWith(arch)):[];
        parts.push({mesh,row,raw,eye,teeth,bounds:new THREE.Box3().setFromObject(mesh),
          materials:[].concat(mesh.material).map(mat=>({mat,emissive:mat.emissive?.clone()}))});
      });
      tissue.dispose(); // All GPU-facing copies now belong to this persistent layer.
      viewer.scene.add(group);viewer.applyVisibility();
    }).catch(error=>{request=null;group=null;enabled=false;refresh();viewer.applyVisibility();toast('Organ surfaces could not load. Toggle Organs to retry.');console.warn(error);});
    return request;
  }
  button.onclick=()=>{enabled=!enabled;if(enabled)load();else showStudy(null);viewer.applyVisibility();};
  const layer={
    refresh,fadesBones:()=>enabled&&!!group&&available(),
    pick(ray,boneHit){
      if(!group?.visible)return null;
      const hits=ray.intersectObjects([...pickSurfaces.keys()],false);
      const visible=boneHit&&boneHit.object.material.opacity>=.47?hits.filter(hit=>hit.distance<=boneHit.distance):hits;
      const hit=visibleEyeHit(visible,tissue.mode,mesh=>pickSurfaces.get(mesh).userData.organPart);
      return hit?pickSurfaces.get(hit.object):null;
    },
    select:showStudy,open(row,raw){location.hash=organStudyDestination(row,raw);}
  };
  document.addEventListener('viewchange',refresh);document.addEventListener('anatomyready',refresh);
  viewer.organLayer=layer;refresh();
  return layer;
}
