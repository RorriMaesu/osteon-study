import * as THREE from 'three';
import {atlasLandmarks,scopedLandmarks,findLandmarks,placeLabel,overlayAllowed} from './atlas-landmark-data.js';
import {areas,boneSide} from './exploration.js';
import {tissueAreas} from './anatomy.js';

export function initAtlasLandmarks({viewer,selectTerm,escape:e,toast}){
 const stage=viewer.el.closest('.specimen-stage'),tools=stage.querySelector('.viewer-room-tools');
 const toggle=document.createElement('button');toggle.type='button';toggle.id='atlas-landmark-toggle';toggle.setAttribute('aria-pressed','false');toggle.textContent='Landmarks: Off';tools.prepend(toggle);
 const dock=document.createElement('div');dock.className='atlas-landmark-dock';dock.hidden=true;dock.innerHTML='<div class="atlas-landmark-bar"><label class="sr-only" for="atlas-landmark-scope">Landmark collection</label><select id="atlas-landmark-scope"><option value="teacher">Teacher list</option><option value="all">All anatomy</option></select><button type="button" id="atlas-landmark-find" aria-expanded="false" aria-controls="atlas-landmark-finder">Find landmarks</button><div class="atlas-label-pages"><button type="button" id="atlas-label-prev" aria-label="Previous landmark labels">←</button><span id="atlas-label-page">1 / 1</span><button type="button" id="atlas-label-next" aria-label="Next landmark labels">→</button></div></div><p id="atlas-landmark-status" role="status"></p>';
 viewer.el.append(dock);
 const panel=document.createElement('section');panel.id='atlas-landmark-finder';panel.className='atlas-landmark-finder';panel.hidden=true;panel.setAttribute('aria-label','Find landmarks on this model');panel.innerHTML='<div class="atlas-landmark-finder-head"><strong>Find it on the model</strong><button type="button" id="atlas-find-close" aria-label="Close landmark finder">×</button></div><label for="atlas-find-query" class="sr-only">Search model landmarks</label><input type="search" id="atlas-find-query" placeholder="Foramen, fossa, ligament…" autocomplete="off"><div class="atlas-find-filters"><label class="sr-only" for="atlas-find-kind">Landmark type</label><select id="atlas-find-kind"><option value="all">All feature types</option><option value="openings">Openings & cavities</option><option value="surfaces">Surfaces & projections</option><option value="joints">Ligaments, tissues & joints</option><option value="development">Development & microanatomy</option></select><label class="sr-only" for="atlas-find-region">Landmark region</label><select id="atlas-find-region"><option>All regions</option><option>Skull</option><option>Spine</option><option>Thorax</option><option>Upper limb</option><option>Pelvis</option><option>Lower limb</option><option>Joints</option><option>Bone structure</option></select></div><p class="tiny" id="atlas-find-count"></p><div id="atlas-find-results"></div><div class="atlas-find-pages"><button type="button" id="atlas-find-prev">← Previous</button><span id="atlas-find-page"></span><button type="button" id="atlas-find-next">Next →</button></div><p class="tiny atlas-find-note">Reference labels locate a feature; they do not outline its whole surface. Source guides and movement tests are marked separately.</p>';
 viewer.el.append(panel);
 const layer=document.createElement('div');layer.className='pin-layer atlas-landmark-pins';layer.hidden=true;viewer.el.append(layer);
 const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.classList.add('pin-lines');layer.append(svg);
 let enabled=false,scope='teacher',page=0,findPage=0,pins=[],signature='',lastState='',lastCheck=0,entries=[],count=0;
 try{enabled=localStorage.getItem('osteon-atlas-landmarks')==='on';}catch{}
 const $=s=>stage.querySelector(s),status=$('#atlas-landmark-status');
 function blocked(){return !overlayAllowed({quiz:viewer.quiz,referenceOpen:viewer.referenceOpen,assessment:!!document.body.dataset.precisionActive||!!document.body.dataset.courseActive||!!document.body.dataset.examActive});}
 function closeFinder({focus=true}={}){panel.hidden=true;$('#atlas-landmark-find').setAttribute('aria-expanded','false');if(focus)$('#atlas-landmark-find').focus({preventScroll:true});}
 function clear(){for(const p of pins){p.button.remove();p.line.remove();p.dot.remove();}pins=[];signature='';}
 function refresh(){
  const paused=blocked();toggle.disabled=viewer.quiz||!!document.body.dataset.precisionActive;toggle.setAttribute('aria-pressed',String(enabled));toggle.textContent=enabled?'Landmarks: On':'Landmarks: Off';toggle.title=toggle.disabled?'Names are hidden during practice':'Show or hide landmarks directly on the specimen';
  dock.hidden=layer.hidden=!enabled||paused;viewer.landmarksVisible=enabled&&!paused;viewer.landmarkLabelsOff=!enabled;if(viewer.pinLayer)viewer.pinLayer.hidden=!viewer.quiz&&(!enabled||!!viewer.labelsHidden);
  if(!enabled||paused){closeFinder({focus:false});clear();return;}
  lastCheck=0;update(true);
 }
 function setEnabled(value){enabled=value;page=0;try{localStorage.setItem('osteon-atlas-landmarks',value?'on':'off');}catch{}refresh();viewer.applyVisibility();if(value&&viewer.focus.level==='overview')toast('Double-click a bone to see regional labels, or choose Find landmarks.');}
 toggle.onclick=()=>setEnabled(!enabled);
 $('#atlas-landmark-scope').onchange=ev=>{scope=ev.target.value;page=findPage=0;lastState='';refresh();if(!panel.hidden)paintFinder();};
 $('#atlas-landmark-find').onclick=()=>{panel.hidden=!panel.hidden;$('#atlas-landmark-find').setAttribute('aria-expanded',String(!panel.hidden));if(!panel.hidden){findPage=0;paintFinder();$('#atlas-find-query').focus({preventScroll:true});}};
 $('#atlas-find-close').onclick=()=>closeFinder();
 for(const id of ['atlas-find-query','atlas-find-kind','atlas-find-region'])$('#'+id).addEventListener(id==='atlas-find-query'?'input':'change',()=>{findPage=0;paintFinder();});
 $('#atlas-find-prev').onclick=()=>{findPage--;paintFinder();};$('#atlas-find-next').onclick=()=>{findPage++;paintFinder();};
 $('#atlas-label-prev').onclick=()=>{page--;lastCheck=0;update(true);};$('#atlas-label-next').onclick=()=>{page++;lastCheck=0;update(true);};
 function paintFinder(){
  const list=findLandmarks({scope,division:viewer.division,query:$('#atlas-find-query').value,kind:$('#atlas-find-kind').value,region:$('#atlas-find-region').value}),size=viewer.el.clientHeight<350?2:viewer.el.clientHeight<500?3:5,pages=Math.max(1,Math.ceil(list.length/size));findPage=Math.max(0,Math.min(pages-1,findPage));
  $('#atlas-find-count').textContent=list.length+' landmarks and structures · choose one to focus here';$('#atlas-find-page').textContent=(findPage+1)+' / '+pages;$('#atlas-find-prev').disabled=findPage===0;$('#atlas-find-next').disabled=findPage===pages-1;
  $('#atlas-find-results').innerHTML=list.slice(findPage*size,findPage*size+size).map(entry=>`<button type="button" data-atlas-find="${e(entry.term.id)}"><strong>${e(entry.term.name)}</strong><small>${e(entry.term.region)} · ${entry.term.representation.localSpecimen?'Fetal scan · developmental guide':entry.retired?'Source guide':entry.term.type==='test'?'Movement exercise':entry.held?'Partial 3D reference · source guide':entry.term.representation.detailGroup?'3D teaching specimen':entry.term.representation.kind==='mesh'?'Whole 3D structure':'3D reference'}${entry.teacher?' · Teacher list':''}</small></button>`).join('')||'<p>No matching landmark. Try another name or region.</p>';
  panel.querySelectorAll('[data-atlas-find]').forEach(button=>button.onclick=()=>{const entry=atlasLandmarks.find(x=>x.term.id===button.dataset.atlasFind);closeFinder({focus:false});focusEntry(entry);});
 }
 function focusEntry(entry){
  const term=entry.term;selectTerm(term);if(term.type==='test'){document.dispatchEvent(new CustomEvent('practicetarget',{detail:term}));return;}
  if(term.representation.kind==='mesh'&&['ligament','joint','tissue','vessel'].includes(term.type)&&entry.anchors.length){
   const anchor=entry.anchors.find(a=>a.parent.endsWith('.r'))||entry.anchors[0],side=boneSide(anchor.parent),area=tissueAreas(anchor.parent)[0];
   if(area){viewer.focusHistory.push(viewer.snapshot());viewer.focus={level:'region',areaId:area,side,boneId:null};viewer.region=areas[area].macro;}
   viewer.selected=viewer.find(term).filter(m=>!side||boneSide(m.userData.zname)===side);viewer.selectedTerm=term;viewer.ghost=true;viewer.isolated=false;
   viewer.showPins([{term,point:anchor.point}],{labelled:true});viewer.applyVisibility();viewer.focusPoint(anchor.point,{direction:[0,.15,1],distance:term.type==='vessel'?.32:.4});viewer.notifyFocus();
  }
  lastState='';refresh();
 }
 for(const el of [dock,panel,layer])for(const event of ['pointerdown','pointerup','pointermove','dblclick'])el.addEventListener(event,ev=>ev.stopPropagation());
 stage.addEventListener('keydown',ev=>{if(ev.key==='Escape'&&!panel.hidden){ev.preventDefault();ev.stopPropagation();closeFinder();}});
 function makePins(items){
  const next=items.map(x=>x.term.id+':'+x.anchor.parent).join('|');if(next===signature)return;clear();signature=next;
  pins=items.map(({term,anchor})=>{const line=document.createElementNS(ns,'line'),dot=document.createElementNS(ns,'circle');dot.setAttribute('r','3');svg.append(line,dot);const button=document.createElement('button');button.type='button';button.className='anatomy-pin atlas-overlay-pin';const side=anchor.parent.endsWith('.r')?' · R':anchor.parent.endsWith('.l')?' · L':'',name=term.id==='ethmoidal-air-cells-and-sinus-openings'?'Ethmoidal air-cell region':term.name;button.textContent=name+side;button.setAttribute('aria-label',name+(side?' · '+(side.includes('R')?'right':'left'):'')+' · focus landmark');button.onclick=ev=>{ev.stopPropagation();focusEntry(atlasLandmarks.find(x=>x.term.id===term.id));};layer.append(button);return{term,anchor,position:new THREE.Vector3(...anchor.point),button,line,dot};});
 }
 function update(force=false){
  if(!viewer.loaded)return;const paused=blocked();if(paused||!enabled){if(!dock.hidden){dock.hidden=layer.hidden=true;closeFinder({focus:false});clear();}return;}
  dock.hidden=layer.hidden=false;
  const now=performance.now(),state=[viewer.focus.level,viewer.focus.areaId,viewer.focus.boneId,viewer.region,viewer.division,viewer.activeDetail,viewer.isolated,viewer.selectedTerm?.id,viewer.meshes.filter(m=>m.visible).length].join('|');
  if(state!==lastState){lastState=state;page=0;lastCheck=0;}
  if(force||now-lastCheck>350){
   lastCheck=now;const visible=viewer.meshes.filter(m=>m.visible),names=new Set(visible.map(m=>m.userData.zname));
   entries=scopedLandmarks({scope,division:viewer.division,visibleNames:names,detailGroup:viewer.activeDetail,bone:viewer.focus.level==='bone'?viewer.focus.boneId:null,side:viewer.focus.side});
   const overview=viewer.focus.level==='overview'&&!viewer.activeDetail;
   const projected=overview?[]:entries.filter(x=>x.term.id!==viewer.selectedTerm?.id).flatMap(entry=>{const anchors=entry.viewAnchors.map(anchor=>({anchor,q:new THREE.Vector3(...anchor.point).project(viewer.camera)})).filter(x=>x.q.z>=-1&&x.q.z<=1&&Math.abs(x.q.x)<.98&&Math.abs(x.q.y)<.98).sort((a,b)=>a.q.z-b.q.z);return anchors.length?[{...entry,anchor:anchors[0].anchor}]:[];});
   count=projected.length;const size=viewer.el.clientWidth<600?4:6,pages=Math.max(1,Math.ceil(count/size));page=Math.max(0,Math.min(pages-1,page));makePins(projected.slice(page*size,page*size+size));
   $('#atlas-label-page').textContent=(page+1)+' / '+pages;$('#atlas-label-prev').disabled=page===0;$('#atlas-label-next').disabled=page===pages-1;
   status.textContent=viewer.activeDetail==='fetal-skull'?'Developmental site guide · compare the newborn illustration; exact locating is not scored.':viewer.selectedTerm?.representation?.assessment==='learn-only'?viewer.selectedTerm.representation.reviewNotice:overview?'Double-click a bone for regional labels · Find searches the complete collection.':entries.length?entries.length+' landmarks in this view · dashed labels are behind a surface; rotate or select to expose them.':'No authored labels on this side or bone. Find landmarks opens the verified reference side.';
  }
  if(!panel.hidden){layer.hidden=true;return;}layer.hidden=false;
  const w=viewer.el.clientWidth,h=viewer.el.clientHeight,base=viewer.el.getBoundingClientRect(),top=Math.max(dock.getBoundingClientRect().bottom-base.top+8,viewer.detailTools&&!viewer.detailTools.hidden?viewer.detailTools.getBoundingClientRect().bottom-base.top+8:0),placed=[],reserved=(viewer.pins||[]).filter(p=>!p.button.hidden).map(p=>{const r=p.button.getBoundingClientRect();return{x:r.left-base.left+r.width/2,y:r.top-base.top+r.height/2,bw:r.width/2+7,bh:r.height/2+7};});
  const solids=viewer.meshes.filter(m=>m.visible&&m.material.opacity>.45),occlusion=force||now-(layer.lastOcclusion||0)>300;if(occlusion)layer.lastOcclusion=now;
  for(const p of pins){
   const q=p.position.clone().project(viewer.camera),ax=(q.x+1)*w/2,ay=(1-q.y)*h/2;
   p.button.hidden=false;const box=placeLabel({x:ax,y:ay},{width:p.button.offsetWidth,height:p.button.offsetHeight},{width:w,height:h,top},placed,reserved);const hidden=!box||q.z<-1||q.z>1||Math.abs(q.x)>1||Math.abs(q.y)>1;p.button.hidden=hidden;p.line.style.display=p.dot.style.display=hidden?'none':'';if(hidden)continue;
   placed.push(box);p.button.style.left=box.x+'px';p.button.style.top=box.y+'px';for(const [key,value]of Object.entries({x1:ax,y1:ay,x2:box.x,y2:box.y}))p.line.setAttribute(key,value);p.dot.setAttribute('cx',ax);p.dot.setAttribute('cy',ay);
   if(occlusion){const delta=p.position.clone().sub(viewer.camera.position),distance=delta.length(),ray=new THREE.Raycaster(viewer.camera.position,delta.normalize(),0,Math.max(0,distance-.0015)),covered=ray.intersectObjects(solids,false).some(hit=>!(hit.object.material.clippingPlanes||[]).some(plane=>plane.distanceToPoint(hit.point)<0));for(const el of [p.button,p.line,p.dot])el.classList.toggle('covered-pin',covered);p.button.title=covered?'Behind a surface. Rotate, peel, or select this label for its source view.':'Anatomical reference · select to focus';}
  }
 }
 for(const event of ['anatomyready','atlasfocuschange','layerschanged','structureselected','assessmentstart','assessmentend','viewchange'])document.addEventListener(event,()=>{lastState='';refresh();});
 viewer.landmarkOverlay={update,refresh,setEnabled};refresh();return{setEnabled,refresh};
}
