import * as THREE from 'three';
import {makeCourseSearch} from './ap2-term-search.js';
import {organStructureGroups} from './organ-structure-names.js';

const studyLayer=30;
const visibleInScene=mesh=>{
  for(let node=mesh;node;node=node.parent)if(!node.visible)return false;
  return true;
};
function element(tag,className,parent){
  const el=document.createElement(tag);
  if(className)el.className=className;
  parent.append(el);
  return el;
}
function markRole(el,role){
  el.style.setProperty('--oa-role',role.color);
  el.dataset.symbol=role.symbol;
}
function newPin(viewport){
  const el=element('div','oa-surface-pin',viewport);
  el.hidden=true;el.setAttribute('aria-hidden','true');
  const leader=element('i','oa-pin-leader',el);
  const caption=element('span','oa-pin-caption',el);
  return {el,leader,caption};
}

export function mountStructurePicker(host,viewer,entry,meshes,options={}){
  if(options.blind)return {updatePin(){},pick(){return false;},clear(){},refresh(){},isolateObjects:objects=>objects};
  const bar=host.querySelector('.organ-tools'),viewport=host.querySelector('.organ-viewport');
  const open=element('button','',bar);bar.prepend(open);
  open.type='button';open.textContent='Structures';open.setAttribute('aria-haspopup','dialog');open.dataset.oaStructures='';
  const dialog=element('dialog','oa-structure-dialog',host);dialog.setAttribute('aria-label','Find a structure in '+entry.title);
  dialog.innerHTML='<header><strong>Structures in this view</strong><button type="button" data-close aria-label="Close structures">×</button></header><input type="search" aria-label="Find a structure" placeholder="Find a structure" autocomplete="off"><small role="status"></small><div class="oa-structure-results"></div><div class="oa-label-settings"><label><input type="checkbox" data-label checked> Anatomy labels</label><label><input type="checkbox" data-colors checked> Category colors</label><label><input type="checkbox" data-compare> Compare structures</label><label hidden><input type="checkbox" data-process-label checked> Process labels</label><label hidden><input type="checkbox" data-process-markers checked> Process markers</label><label><input type="checkbox" data-solo> Isolate selection</label></div><details class="oa-local-key"><summary>Label key</summary><div></div></details><footer><button type="button" data-focus-surface>Focus selection</button><button type="button" data-clear>Clear selection</button></footer>';
  const filter=dialog.querySelector('input[type=search]'),results=dialog.querySelector('.oa-structure-results'),status=dialog.querySelector('[role=status]');
  const label=dialog.querySelector('[data-label]'),solo=dialog.querySelector('[data-solo]'),clear=dialog.querySelector('[data-clear]');
  const compare=dialog.querySelector('[data-compare]'),colors=dialog.querySelector('[data-colors]'),process=dialog.querySelector('[data-process-label]');
  const focus=dialog.querySelector('[data-focus-surface]'),key=dialog.querySelector('.oa-local-key div');
  const markers=dialog.querySelector('[data-process-markers]');
  const processMaterials=new Set(),markerMaterials=new Set();
  viewer.scene.traverse(obj=>{
    if(obj.userData.organProcessLabel)processMaterials.add(obj.material);
    if(obj.userData.organProcessMarker)markerMaterials.add(obj.material);
  });
  process.parentElement.hidden=!processMaterials.size&&!viewport.querySelector('[data-process-caption]');
  process.onchange=()=>{
    for(const material of processMaterials)material.visible=process.checked;
    viewport.classList.toggle('oa-hide-process-captions',!process.checked);viewer.invalidate();
  };
  markers.parentElement.hidden=!markerMaterials.size;
  markers.onchange=()=>{for(const material of markerMaterials)material.visible=markers.checked;viewer.invalidate();};
  const tools=options.peel?element('div','oa-part-actions',viewport):null;
  const isolate=element('button','oa-quick-isolate',tools||viewport);
  isolate.type='button';isolate.hidden=true;
  let peelButton,undoButton,restoreButton;
  if(tools){
    tools.hidden=true;tools.setAttribute('role','group');tools.setAttribute('aria-label','Selected anatomy');
    peelButton=element('button','',tools);peelButton.type='button';peelButton.dataset.oaPeel='';peelButton.textContent='Peel layer';
    undoButton=element('button','',tools);undoButton.type='button';undoButton.dataset.oaUndoPeel='';
    restoreButton=element('button','',dialog.querySelector('footer'));restoreButton.type='button';restoreButton.textContent='Restore peeled layers';
  }
  const dock=element('div','oa-compare-key',bar);dock.hidden=true;dock.setAttribute('role','group');dock.setAttribute('aria-label','Compared structures');
  const pins=Array.from({length:3},()=>newPin(viewport));
  const narrow=window.matchMedia('(max-width: 700px)');
  const limit=()=>narrow.matches?2:3;
  let byRaw,groups,search,selected=[],lastMessage='',lastCheck=0,recheck;
  const active=()=>selected.at(-1)?.group;
  const eligible=group=>!options.eligible||options.eligible(group);
  function index(){
    ({byRaw,groups}=organStructureGroups(entry,meshes,options.describe));
    if(options.terms)for(const group of groups)group.terms+=' '+options.terms(group);
    search=makeCourseSearch(groups);
  }
  index();
  const point=new THREE.Vector3(),world=new THREE.Vector3(),origin=new THREE.Vector3(),toward=new THREE.Vector3();
  const ray=new THREE.Raycaster(),triangle=new THREE.Triangle(),weights=new THREE.Vector3();
  const savedMasks=new Map(),cameraMask=viewer.camera.layers.mask;
  const allSelected=()=>[...new Set(selected.flatMap(s=>s.group.meshes))];
  function resetLayer(){
    viewer.camera.layers.mask=cameraMask;
    for(const [obj,mask] of savedMasks)obj.layers.mask=mask;
    savedMasks.clear();
  }
  function setLayer(){
    resetLayer();
    isolate.hidden=!selected.length;
    isolate.textContent=solo.checked?'Show context':selected.length>1?'Isolate parts':'Isolate part';
    isolate.setAttribute('aria-pressed',String(solo.checked));
    isolate.setAttribute('aria-label',solo.checked?'Show surrounding anatomy':selected.length>1?'Isolate compared structures':'Isolate '+(active()?.title||'selection'));
    if(tools){
      const count=options.peel.count;
      tools.hidden=!selected.length&&!count;peelButton.hidden=!selected.length;
      peelButton.title=active()?'Hide '+active().title:'';
      undoButton.hidden=restoreButton.hidden=!count;undoButton.textContent='Undo peel ('+count+')';
      undoButton.title=count?'Show '+options.peel.last:'';
    }
    if(selected.length&&solo.checked){
      const isolated=allSelected();
      viewer.scene.traverse(obj=>{if(obj.isLight)isolated.push(obj);});
      for(const obj of isolated){savedMasks.set(obj,obj.layers.mask);obj.layers.enable(studyLayer);}
      viewer.camera.layers.set(studyLayer);
    }
    options.onIsolationChange?.(Boolean(selected.length&&solo.checked));
    lastCheck=0;viewer.invalidate();
  }
  function chooseSurface(mesh){
    const bounds=new THREE.Box3().setFromObject(mesh),center=bounds.getCenter(new THREE.Vector3());
    ray.set(viewer.camera.position,center.sub(viewer.camera.position).normalize());ray.far=Infinity;ray.layers.mask=mesh.layers.mask;
    const hit=ray.intersectObject(mesh,false)[0];
    return hit||{object:mesh,point:mesh.localToWorld(mesh.getVertexPosition(0,new THREE.Vector3()))};
  }
  function readTriangle(mesh,face){
    mesh.getVertexPosition(face.a,triangle.a);mesh.getVertexPosition(face.b,triangle.b);mesh.getVertexPosition(face.c,triangle.c);
  }
  function makeAnchor(group,hit){
    const source=hit||chooseSurface(group.meshes.find(visibleInScene)||group.meshes[0]);
    const local=source.object.worldToLocal(source.point.clone());
    if(source.face)readTriangle(source.object,source.face);
    const valid=source.face&&triangle.getBarycoord(local,weights);
    return {mesh:source.object,local,face:valid?source.face:null,geometry:source.object.geometry,weights:weights.clone()};
  }
  function locate(anchor){
    if(!anchor||!visibleInScene(anchor.mesh))return false;
    if(anchor.face&&anchor.geometry===anchor.mesh.geometry){
      readTriangle(anchor.mesh,anchor.face);
      point.copy(triangle.a).multiplyScalar(anchor.weights.x).addScaledVector(triangle.b,anchor.weights.y).addScaledVector(triangle.c,anchor.weights.z);
    }else point.copy(anchor.local);
    world.copy(anchor.mesh.localToWorld(point));point.project(viewer.camera);
    return point.z>=-1&&point.z<=1&&Math.abs(point.x)<=1&&Math.abs(point.y)<=1;
  }
  function opaque(mat){return mat?.visible&&(!mat.transparent||mat.opacity>=.75);}
  function covered(candidates){
    viewer.camera.getWorldPosition(origin);
    const distance=toward.subVectors(world,origin).length();
    if(!distance)return false;
    ray.set(origin,toward.normalize());ray.far=distance*(1-1e-4);ray.layers.mask=viewer.camera.layers.mask;
    return ray.intersectObjects(candidates,false).some(hit=>{
      const mat=Array.isArray(hit.object.material)?hit.object.material[hit.face.materialIndex]:hit.object.material;
      return opaque(mat)&&!mat.clippingPlanes?.some(p=>p.distanceToPoint(hit.point)<0);
    });
  }
  // Place tags inside the canvas, clear of the isolate control and earlier tags.
  // Comparing shows short numbered tags; their full names sit outside the image.
  function place(pin,x,y,width,height,occupied){
    // Text layout only changes when the caption, its state, or the viewport changes.
    // Avoid a layout read after each pin write while an organ or camera is moving.
    const sizeKey=[width,pin.caption.textContent,pin.caption.dataset.detail,pin.caption.dataset.symbol].join('|');
    if(pin.sizeKey!==sizeKey){
      pin.width=pin.caption.offsetWidth;pin.height=pin.caption.offsetHeight;pin.sizeKey=sizeKey;
    }
    const w=pin.width,h=pin.height;
    const clamp=(v,max)=>Math.max(2,Math.min(v,max-2)),gap=14;
    const right=width/2>x,above=height/2<y;
    let left,top;
    for(const [r,a] of [[right,above],[!right,above],[right,!above],[!right,!above]]){
      left=clamp(r?x+gap:x-gap-w,width-w);top=clamp(a?y-gap-h:y+gap,height-h);
      if(!occupied.some(b=>left<b.r+2&&left+w>b.l-2&&top<b.b+2&&top+h>b.t-2))break;
    }
    occupied.push({l:left,t:top,r:left+w,b:top+h});
    const dx=left-x,dy=top-y,ex=Math.max(dx,Math.min(0,dx+w)),ey=Math.max(dy,Math.min(0,dy+h));
    pin.el.style.left=x+'px';pin.el.style.top=y+'px';
    pin.caption.style.left=dx+'px';pin.caption.style.top=dy+'px';
    pin.leader.style.width=Math.hypot(ex,ey)+'px';pin.leader.style.transform='rotate('+Math.atan2(ey,ex)+'rad)';
  }
  function updatePin(){
    if(!selected.length||!label.checked){for(const pin of pins)pin.el.hidden=true;return;}
    const width=viewport.clientWidth,height=viewport.clientHeight,now=performance.now(),due=!lastCheck||now-lastCheck>=180;
    const controls=tools||isolate;
    const occupied=controls.hidden?[]:[{l:controls.offsetLeft,t:controls.offsetTop,r:controls.offsetLeft+controls.offsetWidth,b:controls.offsetTop+controls.offsetHeight}];
    let candidates;
    if(due){
      candidates=[];
      for(const parts of meshes.values())for(const mesh of parts)if(mesh.layers.test(viewer.camera.layers)&&visibleInScene(mesh)&&[].concat(mesh.material).some(opaque))candidates.push(mesh);
      if(options.occluders)for(const mesh of options.occluders())if(mesh.layers.test(viewer.camera.layers)&&visibleInScene(mesh))candidates.push(mesh);
      lastCheck=now;clearTimeout(recheck);recheck=null;
    }else if(!recheck)recheck=setTimeout(()=>{recheck=null;viewer.invalidate();},185-(now-lastCheck));
    for(const [i,pin] of pins.entries()){
      const record=selected[i],onscreen=record&&locate(record.anchor);pin.el.hidden=!onscreen;
      if(!record)continue;
      if(onscreen){
        if(due)record.covered=covered(candidates);
        pin.el.classList.toggle('oa-pin-covered',!!record.covered);
        const detail=selected.length>1?'':record.group.role.title+(record.covered?' · Behind surface':'');
        if(pin.caption.dataset.detail!==detail)pin.caption.dataset.detail=detail;
        place(pin,(point.x+1)*width/2,(1-point.y)*height/2,width,height,occupied);
      }
      const condition=!onscreen?'Out of view':record.covered?'Behind surface':'';
      if(record.key&&record.key.dataset.condition!==condition)record.key.dataset.condition=condition;
      if(i===selected.length-1){
        const words=[record.group.title,record.group.role.title,condition].filter(Boolean);
        if(selected.length>1)words.push('Comparing '+selected.length+' structures');
        announce(words.join(' · '));
      }
    }
  }
  function announce(text){if(text!==lastMessage){lastMessage=text;viewer.announce(text);}}
  function showSelection(){
    const compared=selected.length>1;
    host.classList.toggle('oa-has-comparison',compared&&label.checked);
    dock.replaceChildren();dock.hidden=!(label.checked&&compared);
    for(const [i,record] of selected.entries()){
      const {group}=record,pin=pins[i];
      markRole(pin.el,group.role);pin.caption.dataset.symbol=group.role.symbol;pin.caption.textContent=compared?String(i+1):group.title;
      pin.el.classList.toggle('oa-pin-number',compared);
      if(compared){
        const button=element('button','',dock);button.type='button';button.textContent=(i+1)+'. '+group.title;
        markRole(button,group.role);button.setAttribute('aria-label','Remove '+group.title+' from comparison');button.title='Remove from comparison';
        button.onclick=()=>{applySelection(selected.filter(item=>item!==record));open.focus();};record.key=button;
      }else record.key=null;
    }
    setLayer();updatePin();renderList();
    if(!label.checked&&active())announce(active().title+' selected. Anatomy labels hidden.');
  }
  function applySelection(records,hit,notify=true){
    resetLayer();selected=records;
    const group=active()||null;
    options.reveal?.(group,records.map(item=>item.group));
    if(notify)options.onSelect?.(group,hit);
    for(const rec of selected)if(!rec.anchor)rec.anchor=makeAnchor(rec.group,rec.hit);
    if(!group){solo.checked=false;announce('Tap a surface or open Structures to identify it.');}
    showSelection();
  }
  function select(group,hit,notify=true,allowFit=true){
    const was=selected.find(r=>r.group===group);
    const retained=compare.checked&&group?selected.filter(r=>r!==was).slice(1-limit()):[];
    const current=group?(was&&!hit?was:{group,hit}):null;
    applySelection(current?[...retained,current]:[],hit,notify);
    if(current&&allowFit&&!hit&&!locate(current.anchor))viewer.fit(allSelected(),viewer.camera.position.clone().sub(viewer.controls.target));
  }
  function prune(){
    const retained=selected.filter(record=>eligible(record.group));
    if(retained.length!==selected.length)applySelection(retained,null,false);
    else {setLayer();renderList();}
    return active()||null;
  }
  function renderList(){
    const {items,suggestion}=search(filter.value,options.eligible);
    results.replaceChildren();
    for(const item of items){
      const button=element('button','',results);
      button.type='button';button.textContent=item.title;button.setAttribute('aria-label',item.title);markRole(button,item.role);
      button.setAttribute('aria-pressed',String(selected.some(rec=>rec.group===item)));
      button.onclick=()=>{select(item);dialog.close();};
    }
    status.textContent=items.length?(suggestion?'Showing matches for “'+suggestion+'” · ':'')+items.length+' structures':'No matching structure in this view.';
    key.replaceChildren();
    const local=new Set(groups.filter(options.eligible||(()=>true)).map(group=>group.role));
    for(const role of local){const el=element('span','',key);markRole(el,role);el.textContent=role.title;}
    focus.disabled=solo.disabled=clear.disabled=!selected.length;
    compare.parentElement.title='Keep up to '+limit()+' structures. A new selection replaces the oldest when full.';
  }
  filter.oninput=renderList;clear.onclick=()=>{select(null);dialog.close();};
  solo.onchange=()=>{setLayer();updatePin();};
  label.onchange=showSelection;
  colors.onchange=()=>host.classList.toggle('oa-neutral-marks',!colors.checked);
  compare.onchange=()=>{if(!compare.checked&&selected.length>1)applySelection(selected.slice(-1),null,false);};
  function resize(){if(selected.length>limit())applySelection(selected.slice(-limit()),null,false);else viewer.invalidate();}
  narrow.addEventListener('change',resize);
  isolate.onclick=()=>{solo.checked=!solo.checked;solo.onchange();};
  if(tools){
    peelButton.onclick=()=>{
      const group=active();if(!group)return;
      options.peel.hide(group);prune();announce(group.title+' peeled.');undoButton.focus();
    };
    undoButton.onclick=()=>{
      const group=byRaw.get(options.peel.undo());
      if(group&&eligible(group)){select(group,null,false,false);announce(group.title+' restored.');}
      else prune();
      (undoButton.hidden?peelButton:undoButton).focus();
    };
    restoreButton.onclick=()=>{options.peel.undo(true);prune();announce('Peeled layers restored.');dialog.close();};
    setLayer();
  }
  focus.onclick=()=>{if(active()){viewer.fit(allSelected(),viewer.camera.position.clone().sub(viewer.controls.target));dialog.close();}};
  open.onclick=()=>{filter.value='';renderList();dialog.showModal();filter.focus();};
  dialog.querySelector('[data-close]').onclick=()=>dialog.close();
  dialog.addEventListener('keydown',ev=>{if(ev.key==='Escape'){ev.preventDefault();ev.stopPropagation();dialog.close();}});
  dialog.onclose=()=>{if(open.isConnected)open.focus();};
  viewer.addCleanup(()=>{
    clearTimeout(recheck);narrow.removeEventListener('change',resize);resetLayer();host.classList.remove('oa-neutral-marks','oa-has-comparison');
    viewport.classList.remove('oa-hide-process-captions');
    for(const pin of pins)pin.el.remove();dock.remove();(tools||isolate).remove();dialog.remove();open.remove();
  });
  return {updatePin,
    prune,pick(raw,hit,notify=true){const group=byRaw.get(raw);if(group&&eligible(group)){select(group,hit,notify);return true;}return false;},
    clear(){if(selected.length)select(null,null,false);},
    refresh(){
      index();
      if(selected.length)applySelection(selected.flatMap(r=>{const group=byRaw.get(r.group.names[0]);return group&&eligible(group)?[{...r,group}]:[];}),null,false);
      else if(dialog.open)renderList();
    },
    isolateObjects(objects){return selected.length&&solo.checked?allSelected():objects;}};
}
