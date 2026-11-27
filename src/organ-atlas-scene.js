import * as THREE from 'three';
import {mountOrganViewer} from './ap2-organ-viewer.js';
import {separateRegionalSurfaces} from './ap2-endocrine-regions.js';
import {mountStructurePicker} from './organ-structure-picker.js';
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
  canvas.onpointermove=e=>{if(down&&Math.hypot(e.clientX-down[0],e.clientY-down[1])>6)down=null;};
  canvas.onpointercancel=e=>{pointers.delete(e.pointerId);down=null;};
  canvas.onpointerup=e=>{
    pointers.delete(e.pointerId);
    if(!down)return;
    const click=Math.hypot(e.clientX-down[0],e.clientY-down[1])<=6;down=null;
    if(!click)return;
    const box=canvas.getBoundingClientRect();pointer.set(2*(e.clientX-box.left)/box.width-1,1-2*(e.clientY-box.top)/box.height);
    ray.setFromCamera(pointer,viewer.camera);
    const visible=objects().filter(mesh=>{
      for(let node=mesh;node;node=node.parent)if(!node.visible)return false;
      return true;
    });
    choose(ray.intersectObjects(visible,false));
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

// The portal vein lies on the visceral side of this preparation. Provide the
// anterior orientation separately so the learner can relate the two surfaces.
const portalView=[-.3,-.8,-1];

export function mountCloseup(host,entry,onReady){
  const targets=new Set(entry.targets),context=new Set(entry.context||[]);
  const study=new Set((entry.studyOnly||[]).filter(id=>!targets.has(id)&&!context.has(id)));
  const names=new Set([...targets,...context,...study]);
  let picker;
  const options={
    prepare:entry.asset.endsWith('/ovarian-region.glb')?separateRegionalSurfaces:undefined,
    ...expandedControls(host),asset:entry.asset,title:entry.title,direction:entry.id==='liver'?portalView:entry.direction||[0,.05,1],up:entry.up||[0,1,0],
    onRender:()=>picker?.updatePin(),
    include:(_,mesh)=>Boolean(lookupSurface(mesh,names)),
    colors:(_,mesh)=>{
      const name=lookupSurface(mesh,names),material=[].concat(mesh.material)[0];
      if(material?.color&&material.color.getHex()!==0xffffff)return material.color;
      if(!targets.has(name))return '#a7aaa3';
      return organSystemColor(entry.system);
    },
    onLoad(viewer){
      addViewMenu(host);
      const meshes=new Map(),supplemental=[],surroundings=[],selectable=[];
      viewer.model.traverse(mesh=>{
        if(!mesh.isMesh)return;
        const name=lookupSurface(mesh,names);
        if(!name)return;
        selectable.push(mesh);
        const keys=new Set();
        for(let n=mesh;n;n=n.parent)for(const key of [n.userData?.name,n.name])if(names.has(key))keys.add(key);
        for(const key of keys){
          if(!meshes.has(key))meshes.set(key,[]);
          meshes.get(key).push(mesh);
        }
        if(!lookupSurface(mesh,targets)){
          if(lookupSurface(mesh,context)){
            surroundings.push(mesh);
            for(const mat of [].concat(mesh.material)){mat.transparent=true;mat.opacity=.26;mat.depthWrite=false;}
          }else {supplemental.push(mesh);mesh.visible=false;}
        }
      });
      const missing=[...names].filter(key=>!meshes.has(key));
      if(missing.length)throw Error('Missing organ surface: '+missing.join(', '));
      // Fit the selected organ before an overlay or distant context can expand its bounds.
      const fitContext=new Set(entry.fitContext||[]);
      let contextVisible=true,selectedParts=new Set();
      function visibility(){
        for(const mesh of supplemental)mesh.visible=selectedParts.has(mesh);
        for(const mesh of surroundings)mesh.visible=contextVisible||selectedParts.has(mesh);
      }
      function resetView(direction){
        for(const mesh of surroundings)mesh.visible=!!lookupSurface(mesh,fitContext);
        for(const mesh of supplemental)mesh.visible=false;
        const focus=entry.fitTargets?.flatMap(key=>meshes.get(key)||[]);
        viewer.fit(focus?.length?focus:undefined,direction);visibility();
      }
      const showContext=visible=>{contextVisible=visible;visibility();viewer.invalidate();};
      resetView();
      if(entry.id==='liver'){
        const presets=host.querySelector('[data-orientation]'),standard=presets.onchange;
        presets.options[0].text='Portal inflow · visceral surface';
        presets.add(new Option('Portal vein close-up','portal'),1);
        presets.add(new Option('Anterior surface','anterior'),2);
        presets.onchange=event=>{
          if(presets.value==='portal'){
            viewer.fit(meshes.get('hepatic_portal_vein'),portalView);
            // Leave some surrounding capsule in the frame for orientation.
            const center=viewer.controls.target;
            viewer.camera.position.sub(center).multiplyScalar(1.45).add(center);
            viewer.controls.update();viewer.invalidate();
          }else if(presets.value==='anterior')resetView([0,.05,1]);
          else if(presets.value==='home')resetView();
          else standard.call(presets,event);
        };
      }
      const motion=createOrganMotion(entry,viewer,meshes);
      const frame=(t,particle)=>{motion.set(t,particle);viewer.invalidate();};
      viewer.addCleanup(()=>motion.dispose?.());
      picker=mountStructurePicker(host,viewer,entry,meshes,{reveal(_group,groups){
        selectedParts=new Set(groups.flatMap(group=>group.meshes));visibility();
      }});
      viewer.announce('Tap a surface or open Structures to identify it.');
      tapSurface(viewer,()=>picker.isolateObjects(selectable),hits=>{
        const hit=hits[0];if(hit)picker.pick(lookupSurface(hit.object,names),hit);
      });
      host.querySelector('[data-recenter]').onclick=()=>{resetView();host.querySelector('[data-orientation]').value='home';};
      onReady({frame,showContext,viewer,selectSurface:raw=>picker.pick(raw)});
    }
  };
  return mountOrganViewer(host,options);
}

export function mountBodyMap(host,map,{onPick,onReady,onLayerError}){
  const bySurface=new Map(map.organs.flatMap(organ=>organ.targets.map(name=>[name,organ])));
  const meshes=[],localBones=[],materials=new Map(),boneNames=new Set(map.boneNames||[]),contextNames=new Set(map.contextNames||[]);
  const parts=new Map();
  let selected=null,selectedPart=null,activeParts=null,comparedParts=new Set(),system='',skeleton=null,bones=true,skeletonLoading=false,closed=false,api,picker;
  function show(){
    for(const {mesh,organ,raw} of meshes){
      const match=comparedParts.has(raw)||(organ.id===selected&&(!activeParts||activeParts.includes(raw)));
      mesh.visible=(!system||organ.system===system)&&(!organ.contextOnly||organ.id===selected||comparedParts.has(raw)||!!system);
      for(const {mat,opacity,transparent,depthWrite} of materials.get(mesh)){
        const envelope=/^(skin|integument|body-surface)$/i.test(organ.id);
        const limit=envelope?(match?.26:.035):selected&&!match?.23:1;
        mat.opacity=Math.min(opacity,limit);
        mat.transparent=transparent||mat.opacity<1;mat.depthWrite=depthWrite&&mat.opacity===opacity;
      }
    }
    if(skeleton)skeleton.visible=bones;
    for(const mesh of localBones)mesh.visible=bones;
    api?.invalidate();
  }
  function select(id,raw){
    selected=id||null;
    if(!raw||bySurface.get(raw)?.id!==id){selectedPart=null;activeParts=null;picker?.clear();}
    else if(raw!==selectedPart||!activeParts){selectedPart=raw;picker?.pick(raw,null,false);}
    show();
  }
  function setSystem(value){system=value||'';select(null);}
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
  const viewer=mountOrganViewer(host,{...expandedControls(host),asset:map.asset,title:map.title,onRender:()=>picker?.updatePin(),
    prepare:map.asset.endsWith('/ovarian-region.glb')?separateRegionalSurfaces:undefined,
    direction:map.direction||[0,.02,1],colors:(_,mesh)=>{
      const organ=bySurface.get(lookupSurface(mesh,bySurface));
      const color=[].concat(mesh.material)[0]?.color;
      return color&&color.getHex()!==0xffffff?color:organSystemColor(organ?.system);
    },onLoad(instance){
      api=instance;addViewMenu(host);
      function indexLayer(layer,extraAsset){layer.traverse(mesh=>{
        if(!mesh.isMesh)return;
        const organ=bySurface.get(lookupSurface(mesh,bySurface));
        if(!organ){
          if(lookupSurface(mesh,boneNames)){localBones.push(mesh);for(const mat of [].concat(mesh.material)){mat.color.set('#c9bba5');mat.transparent=true;mat.opacity=.18;mat.depthWrite=false;}}
          else if(lookupSurface(mesh,contextNames)){for(const mat of [].concat(mesh.material)){mat.transparent=true;mat.opacity=.2;mat.depthWrite=false;}}
          else mesh.visible=false;
          return;
        }
        if(extraAsset)api.prepareTissue(mesh,extraAsset,organSystemColor(organ.system));
        const raw=lookupSurface(mesh,bySurface);
        if(!parts.has(raw))parts.set(raw,[]);
        parts.get(raw).push(mesh);
        meshes.push({mesh,organ,raw});mesh.userData.registeredOrgan=organ;
        materials.set(mesh,[].concat(mesh.material).map(mat=>({mat,opacity:mat.opacity,transparent:mat.transparent,depthWrite:mat.depthWrite})));
      });}
      indexLayer(api.model);
      if(!meshes.length)throw Error('No registered organ surfaces');
      picker=mountStructurePicker(host,api,{id:map.key,title:map.title,targets:[...bySurface.keys()]},parts,{
        terms:group=>{const organ=bySurface.get(group.names[0]);return organ.label+' '+organ.system;},
        eligible:group=>!system||bySurface.get(group.names[0]).system===system,
        reveal(group,groups){activeParts=group?.names||null;comparedParts=new Set(groups.flatMap(item=>item.names));if(group){selectedPart=group.names[0];selected=bySurface.get(selectedPart).id;}else selectedPart=null;show();},
        onSelect(group){interacted=true;onPick(group?bySurface.get(group.names[0]):null,group?.names[0]);}
      });
      show();whole();
      tapSurface(api,()=>picker.isolateObjects(meshes.map(o=>o.mesh)),hits=>{
        const hit=hits.find(h=>!/^skin$/i.test(h.object.userData.registeredOrgan.id))||hits[0];
        if(hit)picker.pick(lookupSurface(hit.object,bySurface),hit);
      },()=>{interacted=true;});
      host.querySelector('[data-recenter]').onclick=()=>{host.querySelector('[data-orientation]').value='home';whole();};
      loadSkeleton();onReady();
      for(const extra of map.extraAssets||[]){api.loadLayer(extra).then(layer=>{if(closed)return;indexLayer(layer,extra);picker.refresh();show();if(!interacted)whole();onReady();}).catch(()=>{if(!closed)onLayerError('The additional urinary surfaces could not load. Reopen this preparation to retry.');});}
    }});
  return {select,setSystem,has(id){return meshes.some(p=>p.organ.id===id);},showSkeleton(on){bones=on;if(on)loadSkeleton();show();},
    focus(){interacted=true;if(api&&selected)frame(meshes.filter(o=>o.organ.id===selected&&(!activeParts||activeParts.includes(o.raw))).map(o=>o.mesh),api.camera.position.clone().sub(api.controls.target));},
    dispose(){closed=true;viewer.dispose();}};
}
