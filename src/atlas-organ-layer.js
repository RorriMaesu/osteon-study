import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {bodyAtlas,motionsForBody,organSystemColor} from './organ-atlas-catalog.js';

export function attachOrganLayer(viewer,toast){
  const button=document.querySelector('#organs-layer-btn'),selection=document.querySelector('#organ-layer-study');
  const index=new Map(bodyAtlas.organs.flatMap(row=>row.targets.map(name=>[name,row])));
  const parts=[];
  let group,request,enabled=false,chosen=null;
  const available=()=>viewer.loaded&&!viewer.quiz&&!viewer.activeDetail&&!viewer.muscleLayer?.coursePracticeActive&&viewer.focus.level!=='bone'&&!viewer.isolated&&document.querySelector('#atlas-view').classList.contains('active');
  function showStudy(row){
    chosen=row;selection.hidden=!row;
    if(row){
      const entry=motionsForBody(row.id)[0];
      selection.href=entry?'#organs/'+entry.id:'#organs/body/'+row.id;
      selection.textContent='▶ Animate '+row.label;
    }
    for(const part of parts)part.mesh.material.emissive.setHex(part.row===row?0x684311:0);
    viewer.needsRender=true;
  }
  function refresh(){
    const active=enabled&&available();
    button.disabled=!available();button.setAttribute('aria-busy',String(!!request&&!group&&enabled));
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
    if(!parts.some(p=>p.mesh.visible&&p.row===chosen))showStudy(null);
    selection.hidden=!active||!chosen;
    viewer.needsRender=true;
  }
  function load(){
    if(!request)request=new GLTFLoader().loadAsync(new URL(bodyAtlas.asset,document.baseURI).href).then(gltf=>{
      group=gltf.scene;group.updateMatrixWorld(true);
      group.traverse(mesh=>{
        if(!mesh.isMesh)return;
        let row;for(let obj=mesh;obj&&!row;obj=obj.parent)row=index.get(obj.userData?.name)||index.get(obj.name);
        if(!row){mesh.visible=false;return;}
        const original=mesh.material;
        const color=[].concat(original)[0]?.color;
        mesh.material=new THREE.MeshStandardMaterial({color:color&&color.getHex()!==0xffffff?color:organSystemColor(row.system),roughness:.8,side:THREE.DoubleSide});
        for(const material of [].concat(original))material.dispose();
        mesh.userData.organRow=row;mesh.userData.zname=row.label;
        parts.push({mesh,row,bounds:new THREE.Box3().setFromObject(mesh)});
      });
      viewer.scene.add(group);viewer.applyVisibility();
    }).catch(error=>{request=null;group=null;enabled=false;refresh();viewer.applyVisibility();toast('Organ surfaces could not load. Toggle Organs to retry.');console.warn(error);});
    return request;
  }
  button.onclick=()=>{enabled=!enabled;if(enabled)load();else showStudy(null);viewer.applyVisibility();};
  const layer={
    refresh,fadesBones:()=>enabled&&!!group&&available(),
    pick(ray,boneHit){if(!group?.visible)return null;const hit=ray.intersectObjects(parts.filter(p=>p.mesh.visible).map(p=>p.mesh),false)[0];
      if(!hit||boneHit&&boneHit.object.material.opacity>=.47&&boneHit.distance<hit.distance)return null;return hit.object;},
    select(row){showStudy(row);},open(row){const entry=motionsForBody(row.id)[0];location.hash=entry?'organs/'+entry.id:'organs/body/'+row.id;}
  };
  document.addEventListener('viewchange',refresh);document.addEventListener('anatomyready',refresh);
  viewer.organLayer=layer;refresh();
  return layer;
}
