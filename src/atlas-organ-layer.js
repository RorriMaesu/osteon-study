import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {bodyAtlas,motionsForBody,organSystemColor} from './organ-atlas-catalog.js';
import {organAssetUrl} from './organ-asset-url.js';
import {organStructureName} from './organ-structure-names.js';
import {bodyMaps,mapRoute} from './organ-atlas-bodies.js';
import {createOrganAppearance,registerOrganMaterials} from './organ-tissue-material.js';

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
    finish.setAttribute('aria-pressed',String(tissue.mode==='natural'));viewer.needsRender=true;
  };
  const index=new Map(bodyAtlas.organs.flatMap(row=>row.targets.map(name=>[name,row])));
  const parts=[];
  let group,request,enabled=false,chosen=null,chosenRaw=null;
  const available=()=>viewer.loaded&&!viewer.quiz&&!viewer.activeDetail&&!viewer.muscleLayer?.coursePracticeActive&&viewer.focus.level!=='bone'&&!viewer.isolated&&document.querySelector('#atlas-view').classList.contains('active');
  function showStudy(row,raw){
    chosen=row;chosenRaw=raw;selection.hidden=!row;
    if(row){
      selection.href='#'+organStudyDestination(row,raw);
      selection.textContent='Study '+(raw?organStructureName('body',raw):row.label);
    }
    for(const part of parts){
      const picked=part.row===row&&(!raw||part.raw===raw);
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
    for(const part of parts)part.mesh.visible=active&&!part.row.contextOnly&&(!limits||limits.intersectsBox(part.bounds));
    if(chosen&&!parts.some(p=>p.mesh.visible&&p.row===chosen&&(!chosenRaw||p.raw===chosenRaw)))showStudy(null);
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
        mesh.userData.organRow=row;mesh.userData.organPart=raw;mesh.userData.zname=organStructureName('body',raw);
        parts.push({mesh,row,raw,bounds:new THREE.Box3().setFromObject(mesh),
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
    pick(ray,boneHit){if(!group?.visible)return null;const hit=ray.intersectObjects(parts.filter(p=>p.mesh.visible).map(p=>p.mesh),false)[0];
      if(!hit||boneHit&&boneHit.object.material.opacity>=.47&&boneHit.distance<hit.distance)return null;return hit.object;},
    select:showStudy,open(row,raw){location.hash=organStudyDestination(row,raw);}
  };
  document.addEventListener('viewchange',refresh);document.addEventListener('anatomyready',refresh);
  viewer.organLayer=layer;refresh();
  return layer;
}
