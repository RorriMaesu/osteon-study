import * as THREE from 'three';
import {mountOrganViewer} from './ap2-organ-viewer.js';
import {separateRegionalSurfaces} from './ap2-endocrine-regions.js';
import {mountStructurePicker} from './organ-structure-picker.js';
import {createOrganMotion,organSystemColor} from './organ-atlas-catalog.js';
import {eyeNearResponse} from './organ-motion-regulation-dynamics.js';
import {visibleEyeHit} from './organ-eye-picking.js';
import {eyeSectionTissue} from './organ-eye-section.js';
import {createBodyDissection} from './organ-body-dissection.js';
import {createBoneContext} from './organ-bone-context.js';


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
  const pairedEyes=entry.id==='paired-eyes';
  let picker,refreshAppearance;
  const options={
    prepare:entry.asset.endsWith('/ovarian-region.glb')?separateRegionalSurfaces:undefined,
    // A longer focal length gives both globes the same near-frontal view.
    fieldOfView:pairedEyes?12:undefined,
    ...expandedControls(host),asset:entry.asset,title:entry.title,direction:entry.id==='liver'?portalView:entry.direction||[0,.05,1],up:entry.up||[0,1,0],
    onRender:()=>picker?.updatePin(),
    onAppearanceChange:()=>refreshAppearance?.(),
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
      const peelHistory=[],peeledMeshes=new Set();
      // Keep identity, surface picking and the original donor geometry in both views.
      // In Lens motion, fade the outer coats and leave the internal lenses visible.
      const eyeMeshes=pairedEyes?selectable.map(mesh=>({mesh,raw:lookupSurface(mesh,names),eye:viewer.eyeSurface(mesh)})):[];
      function visibility(){
        for(const mesh of supplemental)mesh.visible=selectedParts.has(mesh);
        for(const mesh of surroundings)mesh.visible=contextVisible||selectedParts.has(mesh);
        for(const {mesh,raw,eye} of eyeMeshes){
          if(!eye)continue;
          const inside=viewer.appearance==='teaching',chosen=selectedParts.has(mesh);
          mesh.visible=chosen||!inside||!(/^(?:iris|retina)_/.test(raw));
          const opacity=inside&&!chosen&&!raw.startsWith('lens_')?.15:1;
          eye.applyVisibility(opacity,opacity<1,opacity===1);
        }
        for(const mesh of peeledMeshes)mesh.visible=false;
      }
      function resetView(direction){
        for(const mesh of surroundings)mesh.visible=!!lookupSurface(mesh,fitContext);
        for(const mesh of supplemental)mesh.visible=false;
        const focus=entry.fitTargets?.flatMap(key=>meshes.get(key)||[]);
        viewer.fit(focus?.length?focus:undefined,direction);visibility();
      }
      const showContext=visible=>{contextVisible=visible;visibility();viewer.invalidate();};
      refreshAppearance=visibility;resetView();
      if(pairedEyes){
        const presets=host.querySelector('[data-orientation]'),standard=presets.onchange;
        const appearance=host.querySelector('[data-organ-appearance]');
        appearance.setAttribute('aria-label','Eye view');
        appearance.options[0].text='Eye exterior';appearance.options[1].text='Lens motion';
        presets.options[0].text='Both eyes · front';
        presets.add(new Option('Left eye close-up','left-eye'),1);
        presets.add(new Option('Right eye close-up','right-eye'),2);
        presets.onchange=event=>{
          if(presets.value==='home')resetView();
          else if(presets.value==='left-eye'||presets.value==='right-eye'){
            const side=presets.value==='left-eye'?'left':'right';
            viewer.fit(meshes.get('sclera_'+side),entry.direction);
          }else standard.call(presets,event);
        };
      }
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
      let position=0;
      // This donor is physically sectioned; its cut faces use the same tissue
      // finishes as the chapter specimen, including the transparent optical media.
      if(entry.id==='eye'){
        const coats=[];
        for(const [raw,parts] of meshes){
          const natural=eyeSectionTissue(raw);
          if(!natural)continue;
          for(const part of parts)for(const mat of [].concat(part.material)){
            coats.push({mat,natural,teaching:{color:mat.color.clone(),roughness:mat.roughness,opacity:mat.opacity,transparent:mat.transparent,depthWrite:mat.depthWrite,vertexColors:mat.vertexColors}});
          }
        }
        const applySection=()=>{
          for(const {mat,natural,teaching} of coats){
            const naturalMode=viewer.appearance==='natural';
            const style=naturalMode?natural:teaching;
            mat.color.set(style.color);mat.roughness=style.roughness;mat.opacity=style.opacity;
            mat.transparent=naturalMode?style.opacity<1:teaching.transparent;
            mat.depthWrite=naturalMode?style.opacity===1:teaching.depthWrite;
            const vertexColors=naturalMode?false:teaching.vertexColors;
            if(mat.vertexColors!==vertexColors){mat.vertexColors=vertexColors;mat.needsUpdate=true;}
          }
        };
        refreshAppearance=()=>{applySection();visibility();motion.set(position);};
        applySection();
        const presets=host.querySelector('[data-orientation]'),standard=presets.onchange;
        presets.options[0].text='Whole eye section';
        presets.add(new Option('Lens close-up','lens'),1);
        presets.onchange=event=>{
          if(presets.value==='lens')viewer.fit([...meshes.get('Lens'),...meshes.get('Zonules')],entry.direction);
          else if(presets.value==='home')resetView();
          else standard.call(presets,event);
        };
      }
      const irises=eyeMeshes.filter(o=>o.raw.startsWith('iris_'));
      const frame=(t,particle)=>{
        position=t;
        motion.set(t,particle);
        if(pairedEyes)for(const {eye} of irises)eye?.setNearFocus(eyeNearResponse(t));
        viewer.invalidate();
      };
      viewer.addCleanup(()=>motion.dispose?.());
      function undoPeel(all=false){
        const restored=peelHistory.splice(all?0:-1);
        for(const layer of restored)for(const mesh of layer.meshes){
          peeledMeshes.delete(mesh);mesh.visible=true;
        }
        visibility();viewer.invalidate();
        return restored.at(-1)?.raw;
      }
      picker=mountStructurePicker(host,viewer,entry,meshes,{
        eligible:group=>group.meshes.some(mesh=>!peeledMeshes.has(mesh)),
        peel:{
          hide(group){
            const visible=group.meshes.filter(mesh=>!peeledMeshes.has(mesh));
            if(!visible.length)return;
            for(const mesh of visible)peeledMeshes.add(mesh);
            peelHistory.push({title:group.title,raw:group.names[0],meshes:visible});
            visibility();viewer.invalidate();
          },
          undo:undoPeel,get count(){return peelHistory.length;},get last(){return peelHistory.at(-1)?.title;}
        },
        reveal(group,groups){
        selectedParts=new Set(groups.flatMap(group=>group.meshes));
        if(pairedEyes&&viewer.appearance==='natural'&&group?.names.some(raw=>/^(?:lens|retina)_/.test(raw)))viewer.setAppearance('teaching');
        visibility();
      }});
      viewer.announce('Tap a surface or open Structures to identify it.');
      tapSurface(viewer,()=>picker.isolateObjects(selectable),hits=>{
        const hit=pairedEyes?visibleEyeHit(hits,viewer.appearance,mesh=>lookupSurface(mesh,names)):hits[0];
        if(hit)picker.pick(lookupSurface(hit.object,names),hit);
      });
      host.querySelector('[data-recenter]').onclick=()=>{resetView();host.querySelector('[data-orientation]').value='home';};
      onReady({frame,showContext,viewer,selectSurface:raw=>picker.pick(raw)});
    }
  };
  return mountOrganViewer(host,options);
}

export function mountBodyMap(host,map,{onPick,onReady,onLayerError,onDissectionChange=()=>{},dissection=createBodyDissection(map)}){
  const bySurface=new Map(map.organs.flatMap(organ=>organ.targets.map(name=>[name,organ])));
  const meshes=[],localBones=[],materials=new Map(),boneNames=new Set(map.boneNames||[]),contextNames=new Set(map.contextNames||[]);
  const parts=new Map(),pickerParts=new Map(),boneContexts=[];
  let selected=null,selectedPart=null,activeParts=null,comparedParts=new Set(),system='',skeleton=null,skeletonLoading=false,closed=false,isolating=false,api,picker;
  const skinOrgan=bySurface.get('skin');
  const eligible=organ=>organ&&!dissection.isHidden(organ.id)&&(!system||organ.system===system);
  function indexVisibleParts(){
    pickerParts.clear();
    for(const [raw,objects] of parts){
      if(!dissection.isPartHidden(bySurface.get(raw).id,raw))pickerParts.set(raw,objects);
    }
  }
  function show(){
    const coveredPinna=dissection.skinVisible&&eligible(skinOrgan)&&(!isolating||comparedParts.has('skin'));
    for(const {mesh,organ,raw} of meshes){
      const match=comparedParts.has(raw)||(organ.id===selected&&(!activeParts||activeParts.includes(raw)));
      mesh.visible=Boolean(eligible(organ)&&!dissection.isPartHidden(organ.id,raw)&&(!organ.contextOnly||dissection.skinVisible));
      // The registered skin already includes the pinnae. Separate auricular
      // surfaces intersect its outer contour in this donor. Expose them on peel.
      if(coveredPinna&&/^(helix|concha_of_auricle|lobule_of_auricle)_(left|right)$/.test(raw))mesh.visible=false;
      for(const {mat,emissive} of materials.get(mesh)){
        if(emissive){
          mat.emissive.copy(emissive);
          if(match)mat.emissive.addScalar(.035);
        }
      }
    }
    for(const context of boneContexts)context.setMode(dissection.skeletonMode);
    api?.invalidate();
  }
  function revealSkin(){
    if(dissection.setSkin(true))onDissectionChange();
  }
  function select(id,raw){
    if(id&&(!eligible(map.organs.find(row=>row.id===id))||dissection.isPartHidden(id,raw)))id=null;
    selected=id||null;
    if(selected==='skin')revealSkin();
    if(!raw||bySurface.get(raw)?.id!==id){selectedPart=null;activeParts=null;picker?.clear();}
    else if(raw!==selectedPart||!activeParts){
      if(!activeParts?.includes(raw))picker?.pick(raw,null,false);
      selectedPart=raw;
    }
    show();
  }
  function setSystem(value){system=value||'';select(null);}
  let mapFov;
  function frame(objects,direction,fov=mapFov){
    const bounds=new THREE.Box3();
    for(const mesh of objects)bounds.expandByObject(mesh);
    if(bounds.isEmpty())return;
    api.camera.fov=fov;
    const size=bounds.getSize(new THREE.Vector3());
    const marker=new THREE.Mesh(new THREE.BoxGeometry(size.x,size.y,size.z));
    bounds.getCenter(marker.position);api.fit(marker,direction);marker.geometry.dispose();marker.material.dispose();
  }
  function whole(){const direction=map.direction||[0,.02,1];if(skeleton)frame([skeleton],direction);else if(api)frame([...localBones,...meshes.map(o=>o.mesh)],direction);}
  function addBones(layer,source){
    const context=createBoneContext(layer,source);
    if(context){boneContexts.push(context);api.addCleanup(()=>context.dispose());}
  }
  async function loadSkeleton(initial=false){
    if(!map.skeletonAsset||skeletonLoading||skeleton||!api||closed)return;
    skeletonLoading=true;
    try{
      const layer=await api.loadLayer(map.skeletonAsset);
      if(closed)return;
      skeleton=layer;
      const source=[];layer.traverse(mesh=>{if(mesh.isMesh)source.push(mesh);});
      addBones(layer,source);
      show();if(initial&&!interacted)whole();
    }catch{if(!closed)onLayerError('Skeletal context could not load. Choose a skeleton style again to retry.');}
    finally{skeletonLoading=false;}
  }
  let interacted=false;
  const markInteraction=()=>{interacted=true;};
  host.addEventListener('pointerdown',markInteraction);
  host.addEventListener('keydown',markInteraction);
  const viewer=mountOrganViewer(host,{...expandedControls(host),asset:map.asset,title:map.title,onRender:()=>picker?.updatePin(),
    prepare:map.asset.endsWith('/ovarian-region.glb')?separateRegionalSurfaces:undefined,
    direction:map.direction||[0,.02,1],colors:(_,mesh)=>{
      const organ=bySurface.get(lookupSurface(mesh,bySurface));
      const color=[].concat(mesh.material)[0]?.color;
      return color&&color.getHex()!==0xffffff?color:organSystemColor(organ?.system);
    },onLoad(instance){
      api=instance;mapFov=api.camera.fov;addViewMenu(host);
      function indexLayer(layer,extraAsset){layer.traverse(mesh=>{
        if(!mesh.isMesh)return;
        const organ=bySurface.get(lookupSurface(mesh,bySurface));
        if(!organ){
          if(lookupSurface(mesh,boneNames))localBones.push(mesh);
          else if(lookupSurface(mesh,contextNames)){for(const mat of [].concat(mesh.material)){mat.transparent=true;mat.opacity=.2;mat.depthWrite=false;}}
          else mesh.visible=false;
          return;
        }
        if(extraAsset)api.prepareTissue(mesh,extraAsset,organSystemColor(organ.system));
        const raw=lookupSurface(mesh,bySurface);
        if(!parts.has(raw))parts.set(raw,[]);
        parts.get(raw).push(mesh);
        meshes.push({mesh,organ,raw});mesh.userData.registeredOrgan=organ;
        materials.set(mesh,[].concat(mesh.material).map(mat=>({mat,emissive:mat.emissive?.clone()})));
      });}
      indexLayer(api.model);
      addBones(api.model,localBones);
      if(!meshes.length)throw Error('No registered organ surfaces');
      indexVisibleParts();
      picker=mountStructurePicker(host,api,{id:map.key,title:map.title,targets:[...bySurface.keys()]},pickerParts,{
        terms:group=>{const organ=bySurface.get(group.names[0]);return organ.label+' '+organ.system;},
        eligible:group=>eligible(bySurface.get(group.names[0]))&&group.names.every(raw=>!dissection.isPartHidden(bySurface.get(raw).id,raw)),
        occluders:()=>dissection.skeletonMode==='solid'?boneContexts.map(ctx=>ctx.surface):[],
        onIsolationChange(on){if(on!==isolating){isolating=on;show();}},
        reveal(group,groups){activeParts=group?.names||null;comparedParts=new Set(groups.flatMap(item=>item.names));if(group){selectedPart=group.names[0];selected=bySurface.get(selectedPart).id;if(selected==='skin')revealSkin();}else selectedPart=null;show();},
        onSelect(group,hit){interacted=true;const raw=hit?lookupSurface(hit.object,bySurface):group?.names[0];onPick(raw?bySurface.get(raw):null,raw);}
      });
      show();whole();
      tapSurface(api,()=>picker.isolateObjects([...meshes.map(o=>o.mesh),...(dissection.skeletonMode==='solid'?boneContexts.map(c=>c.surface):[])]),hits=>{
        const bone=hits.find(hit=>!hit.object.userData.registeredOrgan);
        const visible=bone?hits.filter(hit=>hit.distance<bone.distance):hits;
        const hit=visibleEyeHit(visible,api.appearance,mesh=>lookupSurface(mesh,bySurface));
        if(hit)picker.pick(lookupSurface(hit.object,bySurface),hit);
      },()=>{interacted=true;});
      host.querySelector('[data-recenter]').onclick=()=>{host.querySelector('[data-orientation]').value='home';whole();};
      if(dissection.skeletonMode!=='off')loadSkeleton(true);
      onReady();
      for(const extra of map.extraAssets||[]){api.loadLayer(extra).then(layer=>{if(closed)return;indexLayer(layer,extra);indexVisibleParts();picker.refresh();show();if(!interacted)whole();onReady();}).catch(()=>{if(!closed)onLayerError('The additional urinary surfaces could not load. Reopen this preparation to retry.');});}
    }});
  function afterHide(){
    const group=picker?.prune();
    indexVisibleParts();picker?.refresh();
    const raw=group?.names.includes(selectedPart)?selectedPart:group?.names[0];
    selected=raw?bySurface.get(raw).id:null;selectedPart=raw||null;
    onPick(raw?bySurface.get(raw):null,raw);
    show();onDissectionChange();
  }
  function afterRestore(){indexVisibleParts();picker?.refresh();show();onDissectionChange();}
  return {select,setSystem,has(id){return meshes.some(p=>p.organ.id===id&&!dissection.isPartHidden(id,p.raw));},
    isHidden:id=>dissection.isHidden(id),
    isPartHidden:(id,raw)=>dissection.isPartHidden(id,raw),
    get hiddenIds(){return dissection.hiddenIds;},
    get hiddenEntries(){return dissection.hiddenEntries;},
    get skinVisible(){return dissection.skinVisible;},
    get skeletonMode(){return dissection.skeletonMode;},
    setSkeleton(mode){
      const changed=dissection.setSkeleton(mode);
      if(dissection.skeletonMode!=='off')loadSkeleton();
      if(changed){show();onDissectionChange();}
    },
    setSkin(on){
      if(!dissection.setSkin(on))return;
      if(!on&&selected==='skin')afterHide();
      else{picker?.prune();afterRestore();}
    },
    hideSelected(){
      const id=dissection.hide(selected);
      if(id)afterHide();
      return id;
    },
    hidePart(raw=selectedPart){
      if(!selected||bySurface.get(raw)?.id!==selected||!pickerParts.has(raw))return null;
      const hidden=dissection.hidePart(selected,raw);
      if(hidden)afterHide();
      return hidden;
    },
    undoHide(){const id=dissection.undo();if(id)afterRestore();return id;},
    showOrgan(id){const restored=dissection.show(id);if(restored)afterRestore();return restored;},
    showPart(id,raw){const restored=dissection.showPart(id,raw);if(restored)afterRestore();return restored;},
    restoreHidden(){const count=dissection.restore();if(count)afterRestore();return count;},
    focus(){
      interacted=true;
      if(!api||!selected)return;
      const objects=meshes.filter(o=>o.mesh.visible&&o.organ.id===selected&&(!activeParts||activeParts.includes(o.raw))).map(o=>o.mesh);
      // Step back and use a longer lens for the paired globes. A close wide
      // camera makes forward-facing eyes look as though they diverge.
      frame(objects,api.camera.position.clone().sub(api.controls.target),selected==='eyes'?12:mapFov);
    },
    dispose(){
      closed=true;
      host.removeEventListener('pointerdown',markInteraction);host.removeEventListener('keydown',markInteraction);
      viewer.dispose();
    }};
}
