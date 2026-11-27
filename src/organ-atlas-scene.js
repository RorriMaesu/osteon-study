import * as THREE from 'three';
import {mountOrganViewer} from './ap2-organ-viewer.js';
import {label as surfaceLabel} from './ap3-specimens-catalog.js';
import {createOrganMotion,organSystemColor} from './organ-atlas-catalog.js';


function lookupSurface(mesh,names){
  for(let obj=mesh;obj;obj=obj.parent){
    for(const key of [obj.userData?.name,obj.name])if(names.has(key))return key;
  }
}
function tapSurface(viewer,objects,choose,onTouch=()=>{}){
  const canvas=viewer.renderer.domElement,ray=new THREE.Raycaster(),pointer=new THREE.Vector2();
  const pointers=new Set();let down;
  canvas.onpointerdown=e=>{pointers.add(e.pointerId);down=pointers.size===1?[e.clientX,e.clientY]:null;onTouch();};
  canvas.onpointercancel=e=>{pointers.delete(e.pointerId);down=null;};
  canvas.onpointerup=e=>{
    pointers.delete(e.pointerId);
    if(!down)return;
    const click=Math.hypot(e.clientX-down[0],e.clientY-down[1])<=6;down=null;
    if(!click)return;
    const box=canvas.getBoundingClientRect();pointer.set(2*(e.clientX-box.left)/box.width-1,1-2*(e.clientY-box.top)/box.height);
    ray.setFromCamera(pointer,viewer.camera);
    choose(ray.intersectObjects(objects().filter(m=>m.visible),false));
  };
}
function addViewMenu(host){
  const bar=host.querySelector('.organ-tools'),button=document.createElement('button');
  button.type='button';button.className='oa-camera-views';button.textContent='Views';button.setAttribute('aria-expanded','false');
  button.onclick=()=>{const open=bar.classList.toggle('oa-camera-open');button.setAttribute('aria-expanded',String(open));};
  bar.insertBefore(button,bar.querySelector('[data-expand]'));
}
function expandedControls(host){
  const panel=host.parentElement.querySelector('[data-oa-lesson]');
  return {returnLabel:'Exit full screen',onExpand(active){
    if(active)host.append(panel);else host.after(panel);
  }};
}

export function mountCloseup(host,entry,onReady){
  const targets=new Set(entry.targets),context=new Set(entry.context||[]),names=new Set([...targets,...context]);
  const options={
    ...expandedControls(host),asset:entry.asset,title:entry.title,direction:entry.direction||[0,.05,1],up:entry.up||[0,1,0],
    include:(_,mesh)=>Boolean(lookupSurface(mesh,names)),
    colors:(_,mesh)=>{
      const name=lookupSurface(mesh,names),material=[].concat(mesh.material)[0];
      if(material?.color&&material.color.getHex()!==0xffffff)return material.color;
      if(!targets.has(name))return '#a7aaa3';
      return organSystemColor(entry.system);
    },
    onLoad(viewer){
      addViewMenu(host);
      const meshes=new Map();
      viewer.model.traverse(mesh=>{
        if(!mesh.isMesh)return;
        const name=lookupSurface(mesh,names);
        if(!name)return;
        if(!meshes.has(name))meshes.set(name,[]);
        meshes.get(name).push(mesh);
        if(!targets.has(name))for(const mat of [].concat(mesh.material)){
          mat.transparent=true;mat.opacity=.26;mat.depthWrite=false;
        }
      });
      const missing=[...targets].filter(key=>!meshes.has(key));
      if(missing.length)throw Error('Missing organ surface: '+missing.join(', '));
      // Fit the selected organ before an overlay or distant context can expand its bounds.
      const fitContext=new Set(entry.fitContext||[]);
      const fitMeshes=()=>{for(const id of context)if(!targets.has(id)&&!fitContext.has(id))for(const mesh of meshes.get(id)||[])mesh.visible=false;};
      const showContext=visible=>{for(const id of context)if(!targets.has(id))for(const mesh of meshes.get(id)||[])mesh.visible=visible;viewer.invalidate();};
      fitMeshes();viewer.fit();showContext(true);
      const motion=createOrganMotion(entry,viewer,meshes);
      const frame=t=>{motion.set(t);viewer.invalidate();};
      viewer.addCleanup(()=>motion.dispose?.());
      const selectable=[...meshes.values()].flat();
      viewer.announce('Tap a surface to identify it. Drag to rotate.');
      tapSurface(viewer,()=>selectable,hits=>{
        const hit=hits.find(h=>targets.has(lookupSurface(h.object,names)))||hits[0];
        if(!hit)return;
        const raw=lookupSurface(hit.object,names).replace(/\.001$/,'').replace(/\.([lr])$/,(_,s)=>s==='l'?' (left)':' (right)');
        viewer.announce(surfaceLabel(raw));
      });
      host.querySelector('[data-recenter]').onclick=()=>{const first=[...context].filter(k=>!targets.has(k)).flatMap(k=>meshes.get(k)||[])[0];const was=first?.visible;fitMeshes();viewer.fit();showContext(was??true);host.querySelector('[data-orientation]').value='home';};
      onReady({frame,showContext,viewer});
    }
  };
  return mountOrganViewer(host,options);
}

export function mountBodyMap(host,map,{onPick,onReady,onLayerError}){
  const bySurface=new Map(map.organs.flatMap(organ=>organ.targets.map(name=>[name,organ])));
  const meshes=[],localBones=[],materials=new Map(),boneNames=new Set(map.boneNames||[]),contextNames=new Set(map.contextNames||[]);
  let selected=null,system='',skeleton=null,bones=true,skeletonLoading=false,closed=false,api;
  function show(){
    for(const {mesh,organ} of meshes){
      const match=organ.id===selected;
      mesh.visible=(!system||organ.system===system)&&(!organ.contextOnly||match||!!system);
      for(const {mat,base} of materials.get(mesh)){
        mat.color.copy(base);if(match)mat.color.set('#ffd06f');
        const envelope=/^(skin|integument|body-surface)$/i.test(organ.id);
        mat.opacity=envelope?(match?.26:.035):selected&&!match?.23:1;
        mat.transparent=mat.opacity<1;mat.depthWrite=!mat.transparent;
      }
    }
    if(skeleton)skeleton.visible=bones;
    for(const mesh of localBones)mesh.visible=bones;
    api?.invalidate();
  }
  function select(id){selected=id||null;show();}
  function setSystem(value){system=value||'';selected=null;show();}
  function frame(objects,direction){
    const bounds=new THREE.Box3();
    for(const mesh of objects)bounds.expandByObject(mesh);
    if(bounds.isEmpty())return;
    const size=bounds.getSize(new THREE.Vector3());
    const marker=new THREE.Mesh(new THREE.BoxGeometry(size.x,size.y,size.z));
    bounds.getCenter(marker.position);api.fit(marker,direction);marker.geometry.dispose();marker.material.dispose();
  }
  function whole(){const direction=map.direction||[0,.02,1];if(skeleton)frame([skeleton],direction);else if(api)frame([...localBones,...meshes.map(o=>o.mesh)],direction);}
  async function loadSkeleton(){
    if(!map.skeletonAsset||skeletonLoading||skeleton||!api||closed)return;
    skeletonLoading=true;
    try{
      const layer=await api.loadLayer(map.skeletonAsset);
      if(closed)return;
      skeleton=layer;
      const bone=new THREE.MeshStandardMaterial({color:'#d9c4a6',roughness:.9,transparent:true,opacity:.18,depthWrite:false});
      const originals=new Set();
      layer.traverse(m=>{if(m.isMesh){for(const mat of [].concat(m.material))originals.add(mat);m.material=bone;}});
      api.addCleanup(()=>{for(const mat of originals)mat.dispose();});
      show();if(!interacted)whole();
    }catch{if(!closed)onLayerError('Skeletal context could not load. Toggle Skeleton to retry.');}
    finally{skeletonLoading=false;}
  }
  let interacted=false;
  const viewer=mountOrganViewer(host,{...expandedControls(host),asset:map.asset,title:map.title,
    direction:map.direction||[0,.02,1],colors:(_,mesh)=>{
      const organ=bySurface.get(lookupSurface(mesh,bySurface));
      const color=[].concat(mesh.material)[0]?.color;
      return color&&color.getHex()!==0xffffff?color:organSystemColor(organ?.system);
    },onLoad(instance){
      api=instance;addViewMenu(host);
      function indexLayer(layer,extra=false){layer.traverse(mesh=>{
        if(!mesh.isMesh)return;
        const organ=bySurface.get(lookupSurface(mesh,bySurface));
        if(!organ){
          if(lookupSurface(mesh,boneNames)){localBones.push(mesh);for(const mat of [].concat(mesh.material)){mat.color.set('#c9bba5');mat.transparent=true;mat.opacity=.18;mat.depthWrite=false;}}
          else if(lookupSurface(mesh,contextNames)){for(const mat of [].concat(mesh.material)){mat.transparent=true;mat.opacity=.2;mat.depthWrite=false;}}
          else mesh.visible=false;
          return;
        }
        if(extra){const original=mesh.material;mesh.material=new THREE.MeshStandardMaterial({color:organSystemColor(organ.system),roughness:.8});api.addCleanup(()=>{for(const mat of [].concat(original))mat.dispose();});}
        meshes.push({mesh,organ});mesh.userData.registeredOrgan=organ;
        materials.set(mesh,[].concat(mesh.material).map(mat=>({mat,base:mat.color.clone()})));
      });}
      indexLayer(api.model);
      if(!meshes.length)throw Error('No registered organ surfaces');
      show();whole();
      tapSurface(api,()=>meshes.map(o=>o.mesh),hits=>{
        const hit=hits.find(h=>!/^skin$/i.test(h.object.userData.registeredOrgan.id))||hits[0];
        if(hit)onPick(hit.object.userData.registeredOrgan);
      },()=>{interacted=true;});
      host.querySelector('[data-recenter]').onclick=()=>{host.querySelector('[data-orientation]').value='home';whole();};
      loadSkeleton();onReady();
      for(const extra of map.extraAssets||[]){api.loadLayer(extra).then(layer=>{if(closed)return;indexLayer(layer,true);show();if(!interacted)whole();onReady();}).catch(()=>{if(!closed)onLayerError('The additional urinary surfaces could not load. Reopen this preparation to retry.');});}
    }});
  return {select,setSystem,has(id){return meshes.some(p=>p.organ.id===id);},showSkeleton(on){bones=on;if(on)loadSkeleton();show();},
    focus(){interacted=true;if(api&&selected)frame(meshes.filter(o=>o.organ.id===selected).map(o=>o.mesh),api.camera.position.clone().sub(api.controls.target));},
    dispose(){closed=true;viewer.dispose();}};
}
