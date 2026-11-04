import * as THREE from 'three';
import {drawingRect,comparisonLimit,markerInView,annotationName,pointKey} from './annotation-layout.js';

// One presentation owns study markers and full names. Numbered assessment pins
// keep their separate, name-free interaction and cannot enter this component.
export function attachSpecimenAnnotations({viewer,escape:e,onBestView}){
 const card=document.createElement('section');card.className='annotation-focus';card.hidden=true;card.setAttribute('aria-label','Selected landmark');
 const names=document.createElement('div');names.className='annotation-names';card.append(names);
 const actions=document.createElement('div');actions.className='annotation-actions';actions.innerHTML='<button type="button" data-annotation-best>Show best view</button><button type="button" data-annotation-compare aria-pressed="false">Compare: Off</button>';card.append(actions);
 const note=document.createElement('p');note.className='annotation-note';card.append(note);viewer.el.append(card);
 let active=null,comparisons=[],neighbors=[],enabled=false,comparing=false,signature='',lastMotion=0,lastOcclusion=0,cameraKey='',currentContext='',rendered='';
 const all=()=>[...(viewer.pinLabels?viewer.pins||[]:[]),...neighbors];
 function item(p){return {...p,name:annotationName(p.term,p.label),key:pointKey(p),point:p.point||p.anchor?.point,side:p.anchor?.parent?.endsWith('.r')?'Right':p.anchor?.parent?.endsWith('.l')?'Left':null};}
 function choose(p,{focus=false}={}){
  active=item(p);if(comparing&&!comparisons.some(x=>x.key===active.key))comparisons=[...comparisons,active].slice(-comparisonLimit(viewer.el.clientWidth,viewer.el.clientHeight));
  rendered='';update();if(focus)names.querySelector('button')?.focus({preventScroll:true});
 }
 function paint(){
  const list=comparing?comparisons:active?[active]:[],key=list.map(x=>x.key+':'+x.covered).join('|')+':'+comparing;
  if(key===rendered)return;rendered=key;
  names.innerHTML=list.map((p,i)=>`<div class="annotation-name" data-annotation-name="${i}"><span class="eyebrow">${p.side?e(p.side)+' · ':''}${e(p.term.region)}</span><button type="button" data-annotation-current="${i}" title="Select ${e(p.name)}">${e(p.name)}</button><span class="annotation-visibility">${p.covered?'Hidden from this angle':'Reference point'}</span></div>`).join('');
  names.querySelectorAll('[data-annotation-current]').forEach(b=>b.onclick=()=>{active=list[+b.dataset.annotationCurrent];rendered='';paint();});
  actions.querySelector('[data-annotation-compare]').textContent=comparing?'Compare: On':'Compare: Off';actions.querySelector('[data-annotation-compare]').setAttribute('aria-pressed',String(comparing));
  note.textContent=comparing?`Choose markers to compare up to ${comparisonLimit(viewer.el.clientWidth,viewer.el.clientHeight)} names. ${active?.name||''} is active.`:active?.term.representation?.assessment==='learn-only'?'Qualified study guide · exact locating is withheld.':'Choose a marker to read its name. A point does not outline the whole feature.';
 }
 actions.querySelector('[data-annotation-best]').onclick=()=>{if(active)onBestView(active);};
 actions.querySelector('[data-annotation-compare]').onclick=()=>{comparing=!comparing;comparisons=comparing&&active?[active]:[];rendered='';paint();viewer.resize();};
 for(const event of ['pointerdown','pointerup','pointermove','dblclick'])card.addEventListener(event,ev=>ev.stopPropagation());
 viewer.controls.addEventListener('start',()=>{lastMotion=performance.now();viewer.el.classList.add('annotations-moving');});
 viewer.controls.addEventListener('end',()=>{lastMotion=performance.now();});
 function adopt(p){
  if(p.button.dataset.annotationMarker)return;
  p.button.dataset.annotationMarker='true';p.button.classList.add('landmark-marker');p.button.textContent='';p.button.type='button';
  const label=annotationName(p.term,p.label)+(p.anchor?.parent?.endsWith('.r')?' · right':p.anchor?.parent?.endsWith('.l')?' · left':'');p.button.setAttribute('aria-label',label+' · read landmark name');p.button.title=label;
  p.button.onclick=ev=>{ev.stopPropagation();choose(p);};p.button.onfocus=()=>choose(p);
  p.button.onmouseenter=()=>{if(!comparing)choose(p);};
 }
 function isCovered(p,solids){const position=p.position||new THREE.Vector3(...p.point),delta=position.clone().sub(viewer.camera.position),distance=delta.length();return new THREE.Raycaster(viewer.camera.position,delta.normalize(),0,Math.max(0,distance-.0015)).intersectObjects(solids,false).some(hit=>!(hit.object.material.clippingPlanes||[]).some(plane=>plane.distanceToPoint(hit.point)<0));}
 function update(force=false){
  const allowed=enabled&&!viewer.quiz&&!viewer.referenceOpen&&!document.body.dataset.precisionActive&&!document.body.dataset.examActive&&!document.body.dataset.courseActive;
  const context=[viewer.region,viewer.focus.areaId,viewer.focus.boneId,viewer.activeDetail,viewer.division].join('|');
  if(context!==currentContext){currentContext=context;comparisons=[];rendered='';if(active&&!all().some(p=>p.term.id===active.term.id)&&viewer.selectedTerm?.id!==active.term.id)active=null;}
  card.hidden=!allowed||!active;if(!allowed){for(const p of all()){p.button.hidden=true;p.line.style.display=p.dot.style.display='none';}return;}
  const w=viewer.el.clientWidth,h=viewer.el.clientHeight;if(!w||!h)return;
  const now=performance.now(),cam=viewer.camera.position.toArray().concat(viewer.controls.target.toArray()).map(n=>n.toFixed(4)).join(',');if(cam!==cameraKey){cameraKey=cam;lastMotion=now;}
  viewer.el.classList.toggle('annotations-moving',now-lastMotion<180);
  const selected=viewer.pinLabels?(viewer.pins||[]):[],selection=selected.map(pointKey).join('|');
  if(selection!==signature){signature=selection;if(selected.length&&!selected.some(p=>pointKey(p)===active?.key)){active=item(selected[0]);comparisons=comparing?[active]:[];rendered='';}}
  card.hidden=!active;if(active)paint();comparisons=comparisons.slice(-comparisonLimit(w,h));
  const base=viewer.el.getBoundingClientRect(),dock=viewer.el.querySelector('.atlas-landmark-dock'),tools=viewer.detailTools,top=Math.max(10,dock&&!dock.hidden?dock.getBoundingClientRect().bottom-base.top+8:0,tools&&!tools.hidden?tools.getBoundingClientRect().bottom-base.top+8:0);
  viewer.el.style.setProperty('--annotation-top',top+'px');
  const check=force||now-lastOcclusion>250,solids=check?viewer.meshes.filter(m=>m.visible&&m.material.opacity>.45):[];if(check)lastOcclusion=now;
  const placed=[];
  for(const p of all().slice().sort((a,b)=>Number(pointKey(b)===active?.key)-Number(pointKey(a)===active?.key))){
   adopt(p);const position=p.position||new THREE.Vector3(...p.point),q=position.clone().project(viewer.camera);if(check)p.covered=isCovered(p,solids);
   const key=pointKey(p),chosen=active?.key===key,visible=markerInView(q)&&!p.covered;
   p.button.hidden=!visible;p.line.style.display=p.dot.style.display='none';p.button.classList.remove('covered-pin');p.button.classList.toggle('active-marker',chosen);
   if(active?.key===key&&active.covered!==(!markerInView(q)||p.covered)){active.covered=!markerInView(q)||p.covered;rendered='';}
   for(const c of comparisons)if(c.key===key&&c.covered!==p.covered){c.covered=p.covered;rendered='';}
   if(!visible)continue;
   const x=(q.x+1)*w/2,y=(1-q.y)*h/2,rect=drawingArea();
   // Markers have a 44px interaction box with a small hollow visual endpoint.
   p.button.hidden=x<rect.x||x>rect.x+rect.width||y<rect.y||y>rect.y+rect.height||placed.some(a=>Math.hypot(a.x-x,a.y-y)<44);if(!p.button.hidden)placed.push({x,y});
   p.button.style.left=x+'px';p.button.style.top=y+'px';
   const index=(comparing?comparisons:active?[active]:[]).findIndex(c=>c.key===key),target=names.querySelector(`[data-annotation-name="${index}"]`);
   if(target&&!p.button.hidden){const r=target.getBoundingClientRect(),tx=w<600?r.left-base.left+r.width/2:r.left-base.left,ty=r.top-base.top+r.height/2;p.line.style.display='';p.line.classList.remove('covered-pin');for(const [k,v]of Object.entries({x1:x,y1:y,x2:tx,y2:ty}))p.line.setAttribute(k,v);}
  }
  if(active)paint();
 }
 function drawingArea(){const base=viewer.el.getBoundingClientRect(),dock=viewer.el.querySelector('.atlas-landmark-dock'),tools=viewer.detailTools,caption=viewer.el.querySelector('.fetal-specimen-caption'),top=Math.max(8,dock&&!dock.hidden?dock.getBoundingClientRect().bottom-base.top+8:0,tools&&!tools.hidden?tools.getBoundingClientRect().bottom-base.top+8:0),phone=viewer.el.clientWidth<600;return drawingRect(viewer.el.clientWidth,viewer.el.clientHeight,{top,bottom:(phone&&!card.hidden?card.offsetHeight+22:0)+(caption&&!caption.hidden?caption.offsetHeight+10:0),rail:!phone&&!card.hidden?Math.min(230,viewer.el.clientWidth*.28)+16:0});}
 return {update,drawingArea,choose,setEnabled(value){enabled=value;update(true);},setNeighbors(value){neighbors=value;update();},clear(){active=null;comparisons=[];signature='';card.hidden=true;},get active(){return active;}};
}
