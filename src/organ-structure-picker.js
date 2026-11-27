import * as THREE from 'three';
import {makeCourseSearch} from './ap2-term-search.js';
import {organStructureGroups} from './organ-structure-names.js';

// Selected meshes get a separate render layer so studying a deep structure
// never changes its phase, tissue material or the learner's camera position.
const studyLayer=30;
export function mountStructurePicker(host,viewer,entry,meshes,options={}){
  let byRaw,search;
  function index(){
    const lookup=organStructureGroups(entry,meshes,options.describe);
    if(options.terms)for(const group of lookup.groups)group.terms+=' '+options.terms(group);
    byRaw=lookup.byRaw;search=makeCourseSearch(lookup.groups);
  }
  index();
  const bar=host.querySelector('.organ-tools'),viewport=host.querySelector('.organ-viewport');
  const open=document.createElement('button');
  open.type='button';open.textContent='Structures';open.setAttribute('aria-haspopup','dialog');
  open.dataset.oaStructures='';bar.prepend(open);
  const dialog=document.createElement('dialog');dialog.className='oa-structure-dialog';
  dialog.setAttribute('aria-label','Find a structure in '+entry.title);
  dialog.innerHTML='<header><strong>Structures in this view</strong><button type="button" data-close aria-label="Close structures">×</button></header><input type="search" aria-label="Find a structure" placeholder="Find a structure" autocomplete="off"><small role="status"></small><div class="oa-structure-results"></div><footer><label><input type="checkbox" data-label checked> Show label</label><label><input type="checkbox" data-solo> Isolate selection</label><button type="button" data-clear>Clear selection</button></footer>';
  host.append(dialog);
  const filter=dialog.querySelector('input[type=search]'),results=dialog.querySelector('.oa-structure-results'),status=dialog.querySelector('[role=status]');
  const label=dialog.querySelector('[data-label]'),solo=dialog.querySelector('[data-solo]'),clear=dialog.querySelector('[data-clear]');
  const focus=document.createElement('button');focus.type='button';focus.textContent='Focus selection';focus.dataset.focusSurface='';clear.before(focus);
  const isolate=document.createElement('button');
  isolate.type='button';isolate.className='oa-quick-isolate';isolate.hidden=true;viewport.append(isolate);
  const pin=document.createElement('div'),caption=document.createElement('span');
  pin.className='oa-surface-pin';pin.append(caption);pin.hidden=true;pin.setAttribute('aria-hidden','true');viewport.append(pin);
  const glow=new THREE.MeshBasicMaterial({color:0xffc76e,transparent:true,opacity:.36,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2,side:THREE.DoubleSide});
  const savedMasks=new Map(),overlays=[],point=new THREE.Vector3();
  const world=new THREE.Vector3(),origin=new THREE.Vector3(),toward=new THREE.Vector3();
  const occlusionRay=new THREE.Raycaster(),occlusionMeshes=[];
  let lastCheck=0,recheck;
  const triangle=new THREE.Triangle(),weights=new THREE.Vector3();
  function readTriangle(mesh,face){
    mesh.getVertexPosition(face.a,triangle.a);mesh.getVertexPosition(face.b,triangle.b);mesh.getVertexPosition(face.c,triangle.c);
  }
  const cameraMask=viewer.camera.layers.mask;
  let active=null,anchor=null;
  function includesVisible(mesh){for(let n=mesh;n;n=n.parent)if(!n.visible)return false;return true;}
  function resetLayer(){
    viewer.camera.layers.mask=cameraMask;
    for(const [object,mask] of savedMasks)object.layers.mask=mask;
    savedMasks.clear();
  }
  function setLayer(){
    resetLayer();
    isolate.hidden=!active;
    isolate.textContent=solo.checked?'Show context':'Isolate part';
    isolate.setAttribute('aria-pressed',String(solo.checked));
    isolate.setAttribute('aria-label',solo.checked?'Show anatomy around '+active?.title:'Isolate '+(active?.title||'selected structure'));
    if(active&&solo.checked){
      viewer.scene.traverse(obj=>{if(obj.isLight){savedMasks.set(obj,obj.layers.mask);obj.layers.enable(studyLayer);}});
      for(const mesh of [...active.meshes,...overlays]){savedMasks.set(mesh,mesh.layers.mask);mesh.layers.enable(studyLayer);}
      viewer.camera.layers.set(studyLayer);
    }
    viewer.invalidate();
  }
  function chooseSurface(mesh){
    const bounds=new THREE.Box3().setFromObject(mesh);
    const center=bounds.getCenter(new THREE.Vector3()),origin=viewer.camera.position;
    const ray=new THREE.Raycaster(origin,center.sub(origin).normalize());
    const hit=ray.intersectObject(mesh,false)[0];
    return {object:mesh,point:hit?.point||mesh.localToWorld(mesh.getVertexPosition(0,new THREE.Vector3())),face:hit?.face};
  }
  function locateAnchor(){
    if(!anchor||!includesVisible(anchor.mesh))return false;
    if(anchor.face&&anchor.geometry===anchor.mesh.geometry){
      readTriangle(anchor.mesh,anchor.face);
      point.copy(triangle.a).multiplyScalar(anchor.weights.x).addScaledVector(triangle.b,anchor.weights.y).addScaledVector(triangle.c,anchor.weights.z);
    }else point.copy(anchor.local);
    world.copy(anchor.mesh.localToWorld(point));point.project(viewer.camera);
    return point.z>=-1&&point.z<=1&&Math.abs(point.x)<=1&&Math.abs(point.y)<=1;
  }
  function checkOcclusion(){
    viewer.camera.getWorldPosition(origin);
    const distance=toward.subVectors(world,origin).length();
    if(!distance)return false;
    occlusionRay.set(origin,toward.normalize());occlusionRay.far=distance*(1-1e-4);
    occlusionRay.layers.mask=viewer.camera.layers.mask;occlusionMeshes.length=0;
    for(const parts of meshes.values())for(const mesh of parts){
      if(includesVisible(mesh)&&[].concat(mesh.material).some(m=>m.visible&&(!m.transparent||m.opacity>=.75)))occlusionMeshes.push(mesh);
    }
    const hits=occlusionRay.intersectObjects(occlusionMeshes,false);
    return hits.some(hit=>{
      const material=Array.isArray(hit.object.material)?hit.object.material[hit.face.materialIndex]:hit.object.material;
      return material?.visible&&(!material.transparent||material.opacity>=.75)&&!material.clippingPlanes?.some(p=>p.distanceToPoint(hit.point)<0);
    });
  }
  function updatePin(){
    if(!label.checked||!locateAnchor()){pin.hidden=true;return;}
    pin.hidden=false;pin.style.left=(50+point.x*50)+'%';pin.style.top=(50-point.y*50)+'%';
    pin.classList.toggle('oa-pin-left',point.x>0);pin.classList.toggle('oa-pin-down',point.y>.55);
    const now=performance.now();
    if(!lastCheck||now-lastCheck>=160){
      pin.classList.toggle('oa-pin-covered',checkOcclusion());lastCheck=now;
      clearTimeout(recheck);recheck=null;
    }else if(!recheck)recheck=setTimeout(()=>{recheck=null;viewer.invalidate();},165-(now-lastCheck));
  }
  function select(group,hit,notify=true){
    resetLayer();
    for(const mesh of overlays)mesh.removeFromParent();
    overlays.length=0;active=group;anchor=null;lastCheck=0;clearTimeout(recheck);recheck=null;
    options.reveal?.(group);
    if(notify)options.onSelect?.(group,hit);
    if(group){
      const source=hit||chooseSurface(group.meshes.find(includesVisible)||group.meshes[0]);
      const local=source.object.worldToLocal(source.point.clone()),face=source.face;
      // Keep the exact point inside its triangle as that triangle moves.
      if(face)readTriangle(source.object,face);
      const valid=face&&triangle.getBarycoord(local,weights);
      anchor={mesh:source.object,local,face:valid?face:null,geometry:source.object.geometry,weights:weights.clone()};
      for(const mesh of group.meshes){
        const overlay=new THREE.Mesh(mesh.geometry,glow);overlay.raycast=()=>{};
        overlay.morphTargetInfluences=mesh.morphTargetInfluences;overlay.renderOrder=mesh.renderOrder+1;
        mesh.add(overlay);overlays.push(overlay);
      }
      caption.textContent=group.title;viewer.announce(group.title);
      if(!hit&&!locateAnchor())viewer.fit(group.meshes.filter(includesVisible),viewer.camera.position.clone().sub(viewer.controls.target));
    }else {solo.checked=false;viewer.announce('Tap a surface or open Structures to identify it.');}
    setLayer();updatePin();renderList();
  }
  function renderList(){
    const {items,suggestion}=search(filter.value,options.eligible);
    results.replaceChildren();
    for(const item of items){
      const button=document.createElement('button');button.type='button';button.textContent=item.title;button.setAttribute('aria-pressed',String(item===active));
      button.onclick=()=>{select(item);dialog.close();};results.append(button);
    }
    status.textContent=items.length?(suggestion?'Showing matches for “'+suggestion+'” · ':'')+items.length+' structures':'No matching structure in this view.';
    focus.disabled=solo.disabled=clear.disabled=!active;
  }
  filter.oninput=renderList;clear.onclick=()=>{select(null);dialog.close();};
  solo.onchange=setLayer;label.onchange=()=>{updatePin();viewer.invalidate();};
  isolate.onclick=()=>{solo.checked=!solo.checked;lastCheck=0;setLayer();updatePin();};
  focus.onclick=()=>{if(active){viewer.fit(active.meshes,viewer.camera.position.clone().sub(viewer.controls.target));dialog.close();}};
  open.onclick=()=>{filter.value='';renderList();dialog.showModal();filter.focus();};
  dialog.querySelector('[data-close]').onclick=()=>dialog.close();
  dialog.addEventListener('keydown',ev=>{if(ev.key==='Escape'){ev.preventDefault();ev.stopPropagation();dialog.close();}});
  dialog.onclose=()=>{if(open.isConnected)open.focus();};
  viewer.addCleanup(()=>{clearTimeout(recheck);resetLayer();for(const overlay of overlays)overlay.removeFromParent();glow.dispose();pin.remove();isolate.remove();dialog.remove();open.remove();});
  return {updatePin,
    pick(raw,hit,notify=true){if(byRaw.has(raw)){select(byRaw.get(raw),hit,notify);return true;}return false;},
    clear(){if(active)select(null,null,false);},
    refresh(){const raw=active?.names[0];index();if(raw)select(byRaw.get(raw),null,false);else if(dialog.open)renderList();},
    isolateObjects(objects){return active&&solo.checked?active.meshes:objects;}};
}
