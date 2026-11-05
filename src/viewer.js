import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/addons/loaders/DRACOLoader.js';
import {allTerms,matches} from './data.js';
import {pointKinds} from './representations.js';
import modelAssets from './model-assets.json' with {type:'json'};
import {termForMesh,refinementForMesh,wholeStructureLabel} from './mesh-term.js';
import {meshRegion,meshDivision,meshInRegion} from './anatomy.js';
import {areas,areaForBone,areaLabel,inArea,boneFamily,boneId,boneSide,navigationAction} from './exploration.js';
import {doubleTap} from './viewer-guidance.js';
import {adultVisibility,focusGuideVisible} from './model-visibility.js';
import {isIntervertebralDisc,isNucleus,vertebralLevel,betweenVisibleVertebrae} from './spinal-context.js';

export class AnatomyViewer {
 constructor(el,onPick,onReady,onError){
  this.el=el;this.onPick=onPick;this.meshes=[];this.selected=[];this.isolated=false;this.ghost=false;this.region='All regions';this.division='All';this.skullColors=true;this.quiz=false;this.peeledSurfaces=new Set();this.peel=false;
  this.focus={level:'overview',areaId:null,side:null,boneId:null};this.focusHistory=[];
  this.discs=true;
  this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  try {this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});}catch(e){onError(e);return;}
  this.renderer.localClippingEnabled=true;this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));this.renderer.setClearColor(0x000000,0);this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.2;el.append(this.renderer.domElement);
  this.scene=new THREE.Scene();this.camera=new THREE.PerspectiveCamera(32,1,.005,30);this.camera.position.set(.13,.92,3.1);
  this.controls=new OrbitControls(this.camera,this.renderer.domElement);this.controls.target.set(0,.88,0);this.controls.enableDamping=!this.reduced;this.controls.dampingFactor=.09;this.controls.minDistance=.004;this.controls.maxDistance=7;this.controls.autoRotateSpeed=.7;this.controls.enablePan=true;this.needsRender=true;this.controls.addEventListener('change',()=>{this.needsRender=true;});
  this.scene.add(new THREE.HemisphereLight(0xe5f8ee,0x203c41,.85));
  for(const [color,power,pos]of [[0xffe7d2,3,[2,3,4]],[0xa2d4d0,.8,[-2,1,-2]],[0xffffff,1.3,[0,3,-1]]]){const l=new THREE.DirectionalLight(color,power);l.position.set(...pos);this.scene.add(l);}
  // A soft camera fill keeps inferior and medial surfaces legible when orbiting.
  const cameraFill=new THREE.DirectionalLight(0xf1f3e8,1.35);cameraFill.position.set(.4,.3,1);this.camera.add(cameraFill,cameraFill.target);this.scene.add(this.camera);
  const grid=new THREE.GridHelper(4,40,0x44635d,0x2c4245);grid.material.transparent=true;grid.material.opacity=.23;grid.position.y=.003;grid.userData.ground=true;this.scene.add(grid);
  const ring=new THREE.Mesh(new THREE.RingGeometry(.22,.223,96),new THREE.MeshBasicMaterial({color:0x789d8c,transparent:true,opacity:.35,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=.005;ring.userData.ground=true;this.scene.add(ring);
  this.ray=new THREE.Raycaster();this.pointer=new THREE.Vector2();this.down=null;
  this.activePointers=new Set();
  el.addEventListener('pointerdown',e=>{const touch=e.pointerType==='touch';if(this.touchInput!==touch){this.touchInput=touch;document.dispatchEvent(new Event('viewerinputchange'));}this.activePointers.add(e.pointerId);if(this.activePointers.size>1){this.multiTouch=true;this.lastTap=null;}this.down=[e.clientX,e.clientY];this.tween=null;});
  el.addEventListener('pointercancel',e=>{this.activePointers.delete(e.pointerId);this.down=null;this.lastTap=null;if(!this.activePointers.size)this.multiTouch=false;});
  el.addEventListener('pointerup',e=>{
   const tapped=this.down&&!this.multiTouch&&Math.hypot(e.clientX-this.down[0],e.clientY-this.down[1])<6;
   this.activePointers.delete(e.pointerId);if(!this.activePointers.size)this.multiTouch=false;
   if(tapped&&e.button===0){const m=this.hit(e);if(m){if(this.peel||e.shiftKey){this.lastTap=null;document.querySelector('#hover-label').hidden=true;this.peelSurface(m);}else{
    this.onPick(m);
    if(e.pointerType==='touch'){
     const now=performance.now(),next={bone:m.userData.muscleId?(m.userData.component.muscleName+'|'+m.userData.component.side):boneId(m.userData.zname),time:now,x:e.clientX,y:e.clientY};
     if(doubleTap(this.lastTap,next)){this.lastTap=null;this.touchNavigationAt=now;this.navigateBone(m);e.preventDefault();}
     else this.lastTap=next;
    }
   }}else this.lastTap=null;}else this.lastTap=null;
   this.down=null;
  });
  el.addEventListener('dblclick',e=>{e.preventDefault();if(performance.now()-(this.touchNavigationAt||-1000)<800||this.peel||e.shiftKey)return;const m=this.hit(e);if(m)this.navigateBone(m);});
  el.addEventListener('keydown',e=>{if(this.quiz||e.target!==el)return;if(e.key==='Enter'){e.preventDefault();if(this.selected[0])this.navigateBone(this.selected[0]);}else if(e.key==='Escape'){e.preventDefault();this.back();}});
  el.addEventListener('pointermove',e=>{const label=document.querySelector('#hover-label');if(this.quiz||this.down||e.pointerType==='touch'){label.hidden=true;return;}const m=this.hit(e);label.hidden=!m;if(m){label.textContent=this.peel?'Hide this surface':this.displayName(m)+(boneFamily(m.userData.zname)?this.focus.level==='overview'?' · Double-click → region':this.focus.level==='region'?' · Double-click → one bone':'':'');const r=el.getBoundingClientRect();label.style.left=Math.max(4,Math.min(e.clientX-r.left+14,r.width-250))+'px';label.style.top=Math.max(42,e.clientY-r.top-30)+this.el.offsetTop+'px';}el.style.cursor=m?'pointer':'grab';});
  el.addEventListener('pointerleave',()=>{document.querySelector('#hover-label').hidden=true;});
  this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(el);
  this.controls.addEventListener('start',()=>{this.tween=null;document.querySelectorAll('[data-camera]').forEach(b=>b.classList.remove('active'));});
  const decoder=new DRACOLoader();decoder.setDecoderPath(new URL('vendor/draco/',document.baseURI).href);decoder.setWorkerLimit(2);
  const loader=new GLTFLoader();loader.setDRACOLoader(decoder);
  loader.load(new URL('assets/skeleton.glb?v='+modelAssets['skeleton'],document.baseURI).href,async gltf=>{
   try{
   gltf.scene.traverse(m=>{if(!m.isMesh)return;const z=m.userData.zname||m.name.replace(/\.001$/,'');m.userData.zname=z;m.userData.region=this.meshRegion(z,m.userData.zgroup||'');m.userData.sinus=/^Sinus /.test(z);m.userData.nonbone=/cartilage|tooth|canine|incisor|premolar/i.test(z);m.material=new THREE.MeshStandardMaterial({color:m.userData.sinus?0xa8b5a0:m.userData.nonbone?0xa6b3ad:0xe5e1cd,roughness:.55,metalness:.04,side:THREE.DoubleSide});m.userData.initialPosition=m.position.clone();this.meshes.push(m);});
   this.root=gltf.scene;this.scene.add(this.root);this.root.updateMatrixWorld(true);this.meshes.forEach(m=>{m.userData.bounds=new THREE.Box3().setFromObject(m);});
   document.querySelector('#load-progress').textContent='Loading joint tissues · 2 of 3';
   const tissues=await loader.loadAsync(new URL('assets/course-tissues.glb?v='+modelAssets['course-tissues'],document.baseURI).href);
   tissues.scene.traverse(m=>{if(!m.isMesh)return;const z=m.userData.zname||m.name;m.userData.zname=z;m.userData.tissue=true;m.userData.region=/disc|pulposus|Vertebral artery/.test(z)?'Spine':/Stylohyoid/.test(z)?'Thorax':/Pubic symphysis/.test(z)?'Pelvis':'Joints';m.userData.nonbone=true;m.material=new THREE.MeshStandardMaterial({color:/artery/.test(z)?0xd98878:0xc9aa7b,roughness:.65,side:THREE.DoubleSide});this.meshes.push(m);});
   this.scene.add(tissues.scene);tissues.scene.updateMatrixWorld(true);this.meshes.forEach(m=>{m.userData.bounds=new THREE.Box3().setFromObject(m);});
   document.querySelector('#load-progress').textContent='Loading anatomical detail · 3 of 3';
   const details=await loader.loadAsync(new URL('assets/landmark-details.glb?v='+modelAssets['landmark-details'],document.baseURI).href);
   details.scene.traverse(m=>{if(!m.isMesh)return;const z=m.userData.zname||m.name;m.userData.zname=z;
    if(m.userData.replacementAnatomy){const old=this.meshes.filter(x=>x.userData.zname===z);old.forEach(x=>{x.removeFromParent();this.meshes.splice(this.meshes.indexOf(x),1);});}
    m.userData.region=m.userData.anatomicalRegion||this.meshRegion(z,'');m.userData.tissue=!!m.userData.supportAnatomy;m.userData.nonbone=!!m.userData.supportAnatomy;
    if(m.userData.detailGroup){m.material=m.userData.guideOnly?new THREE.MeshBasicMaterial({color:0xf0ae67,side:THREE.DoubleSide}):m.material.clone();m.material.side=THREE.DoubleSide;m.userData.authoredColor=m.material.color.clone();m.userData.authoredOpacity=m.material.opacity;}
    else m.material=new THREE.MeshStandardMaterial({color:m.userData.nonbone?0xc9aa7b:0xe5e1cd,roughness:.6,side:THREE.DoubleSide});
    this.meshes.push(m);
   });this.scene.add(details.scene);details.scene.updateMatrixWorld(true);this.meshes.forEach(m=>{m.userData.bounds=new THREE.Box3().setFromObject(m);});
   this.detailTools=document.createElement('div');this.detailTools.className='landmark-3d-tools';this.detailTools.hidden=true;el.append(this.detailTools);
   // Overlay controls must not select or navigate the bone beneath them.
   for(const event of ['pointerdown','pointerup','pointermove','dblclick'])this.detailTools.addEventListener(event,e=>e.stopPropagation());
   this.pinLayer=document.createElement('div');this.pinLayer.className='pin-layer';el.append(this.pinLayer);this.pins=[];
   this.loaded=true;this.applyVisibility();this.resize();this.reset();decoder.dispose();el.dataset.loaded='true';onReady(this.meshes);
   }catch(err){onError(err);}
  },p=>{if(p.total)document.querySelector('#load-progress').textContent=`Skeleton transfer ${Math.min(100,Math.round(p.loaded/p.total*100))}% · 1 of 3`;},onError);
  this.running=true;this.animate();
 }
 meshRegion(n,g){return meshRegion(n,g);}
 displayName(m){const n=m.userData.zname;return n.replace(/finger of foot/g,'toe').replace(/finger of hand/g,'finger').replace(/\.l$/,' (left)').replace(/\.r$/,' (right)');}
 practicePinVisible(point){
  const camera=this.camera.clone(false);camera.position.copy(this.tween?.to||this.camera.position);camera.lookAt(this.tween?.targetTo||this.controls.target);camera.updateMatrixWorld(true);
  const position=new THREE.Vector3(...point),q=position.clone().project(camera);if(Math.abs(q.x)>.88||Math.abs(q.y)>.88||q.z< -1||q.z>1)return false;
  const delta=position.clone().sub(camera.position),distance=delta.length(),ray=new THREE.Raycaster(camera.position,delta.normalize(),0,Math.max(0,distance-.0015));
  return !ray.intersectObjects(this.meshes.filter(m=>m.visible&&!m.userData.guideOnly&&m.material.opacity>.45),false).some(hit=>!(hit.object.material.clippingPlanes||[]).some(plane=>plane.distanceToPoint(hit.point)<0));
 }
 find(term){const r=term.representation||{};if(r.retiredModel)return [];if(r.detailGroup)return this.meshes.filter(m=>m.userData.detailGroup===r.detailGroup&&(!r.object||m.userData.zname.startsWith(r.object)));return this.meshes.filter(m=>!m.userData.detailGroup&&matches(r.parentPattern||term.pattern,m.userData.zname));}
 focusFeature(term=this.selectedTerm,{direction}={}){const r=term?.representation;if(!r?.points?.length)return;let center=r.view?.center||r.points[0].point;
  document.querySelectorAll('[data-camera]').forEach(b=>b.classList.remove('active'));
  if(r.fitToContext){this.frame(this.find(term),direction||r.view?.direction||'front');return;}
  let view=direction?{...r.view,direction}:r.view;
  if((r.detailGroup||r.frameContext)&&!r.view?.center){const context=this.meshes.filter(m=>r.detailGroup?m.userData.detailGroup===r.detailGroup:this.find(term).includes(m)||(r.contextPatterns||[]).some(p=>matches(p,m.userData.zname)));const box=new THREE.Box3();context.forEach(m=>box.union(m.userData.bounds));center=box.getCenter(new THREE.Vector3()).toArray();
   const d=new THREE.Vector3(...(view?.direction||[.6,.5,1])).normalize(),right=new THREE.Vector3(0,1,0).cross(d);if(right.lengthSq()<.001)right.set(1,0,0);right.normalize();const up=d.clone().cross(right),c=new THREE.Vector3(...center),p=[];
   for(const m of context){const a=m.geometry.getAttribute('position'),step=Math.max(1,Math.ceil(a.count/600));for(let i=0;i<a.count;i+=step)p.push(new THREE.Vector3().fromBufferAttribute(a,i).applyMatrix4(m.matrixWorld).sub(c));}
   const span=v=>Math.max(...p.map(q=>q.dot(v)))-Math.min(...p.map(q=>q.dot(v))),fit=Math.max(span(up),span(right)/this.camera.aspect)*.5/Math.tan(THREE.MathUtils.degToRad(16))*1.14+span(d)*.5;
   view={...view,distance:Math.max(r.view?.distance||0,fit)/Math.max(1,.75/this.camera.aspect)};
  }
  this.focusPoint(center,view);
 }
 refreshLandmarkTools(){if(!this.detailTools)return;if(this.renderFetalTools?.())return;const r=this.selectedTerm?.representation,active=pointKinds.includes(r?.kind)&&!this.quiz;this.detailTools.hidden=!active;if(!active)return;
  this.detailTools.replaceChildren();const tag=document.createElement('span');tag.textContent=r.reviewStatus==='modeled-opening-verified'?'Blender reconstruction · actual bone':r.detailGroup==='inner-ear'?'Right labyrinth · space cast · bone removed':r.refinement==='Source-aligned exam clarity'?'Blender detail · enhanced contours':r.refinement?'Route / opening schematic':r.kind==='teaching-pin'?'3D teaching reconstruction':r.cutaway?'3D anatomy · cutaway':'3D anatomy';this.detailTools.append(tag);
  const labels=document.createElement('button');labels.type='button';labels.hidden=true;labels.dataset.action='labels';const visible=this.landmarkOverlay?this.landmarksVisible:!this.labelsHidden;labels.textContent='Label: '+(visible?'On':'Off');labels.setAttribute('aria-pressed',String(visible));labels.onclick=()=>{if(this.landmarkOverlay)this.landmarkOverlay.setEnabled(!this.landmarksVisible);else{this.labelsHidden=!this.labelsHidden;this.pinLayer.hidden=this.labelsHidden;}this.refreshLandmarkTools();this.detailTools.querySelector('[data-action=labels]')?.focus({preventScroll:true});};this.detailTools.append(labels);
  if(r.cutaway){const b=document.createElement('button');b.type='button';b.dataset.action='cutaway';b.textContent='Cutaway: '+(this.cutaway?'On':'Off');b.setAttribute('aria-pressed',String(!!this.cutaway));b.onclick=()=>{this.cutaway=this.cutaway?null:r.cutaway;this.applyVisibility();this.refreshLandmarkTools();this.detailTools.querySelector('[data-action=cutaway]')?.focus({preventScroll:true});};this.detailTools.append(b);}
 }

 termFor(m){return termForMesh(m);}
 hit(e){if(!this.loaded)return null;const r=this.el.getBoundingClientRect();this.pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);this.ray.setFromCamera(this.pointer,this.camera);const hit=this.ray.intersectObjects(this.meshes.filter(m=>m.visible&&!m.userData.guideOnly&&(!m.userData.detailGroup||this.peel||e.shiftKey)),false)[0];if(this.muscleLayer?.ownsFocus())return this.muscleLayer.pick(this.ray,hit);return hit?.object||null;}
 snapshot(){return{focus:{...this.focus},region:this.region,selected:[...this.selected],selectedTerm:this.selectedTerm,activeDetail:this.activeDetail,cutaway:this.cutaway,isolated:this.isolated,ghost:this.ghost,pins:(this.pins||[]).map(p=>({term:p.term,point:[...p.point],label:p.label})),pinLabels:this.pinLabels,position:(this.tween?.to||this.camera.position).clone(),target:(this.tween?.targetTo||this.controls.target).clone()};}
 notifyFocus(){this.el.dataset.focus=this.focus.level;this.el.dataset.area=this.focus.areaId||'';document.querySelector('#hover-label').hidden=true;document.dispatchEvent(new CustomEvent('atlasfocuschange'));}
 focusLabel(){if(this.activeDetail==='fetal-skull')return 'Fetal skull · site guide';return this.focus.areaId?areaLabel(this.focus.areaId,this.focus.side):this.region;}
 scopeContains(m){
  if(!this.focus.areaId||this.quiz)return meshInRegion(m.userData.zname,m.userData.region,this.region);
  const n=m.userData.zname;
  return inArea(n,this.focus.areaId,this.focus.side)||(this.focus.areaId==='skull'&&m.userData.region==='Skull')||(this.focus.areaId==='thorax'&&/^Costal cartilage/.test(n))||(this.focus.areaId==='neck'&&/Thyroid cartilage|Cricoid cartilage|Arytenoid cartilage|Corniculate cartilage/.test(n));
 }
 boneMeshes(m){const id=boneId(m.userData.zname);return this.meshes.filter(x=>boneId(x.userData.zname)===id);}
 navigateBone(m){if(m.userData.muscleId){this.muscleLayer?.navigate(m);return;}const action=navigationAction(this.focus,m.userData.zname,this.quiz||this.peel);if(action==='region')this.exploreBoneRegion(m);else if(action==='bone')this.focusBone(m);}
 exploreBoneRegion(m=this.selected[0]){
  if(!m||this.quiz)return;
  this.peel=false;document.dispatchEvent(new Event('layerschanged'));
  const areaId=areaForBone(m.userData.zname);if(!areaId)return;
  if(this.focus.level==='bone'&&this.focus.areaId===areaId){this.back();return;}
  this.focusHistory.push(this.snapshot());this.focus={level:'region',areaId,side:boneSide(m.userData.zname),boneId:null};this.region=areas[areaId].macro;
  this.clearPins();this.selected=[m];this.selectedTerm=this.termFor(m);this.peeledSurfaces.delete(m);this.isolated=false;this.ghost=false;this.controls.autoRotate=false;this.applyVisibility();this.frameScope();this.notifyFocus();
 }
 focusBone(m=this.selected[0]){
  if(!m||this.quiz||!boneFamily(m.userData.zname))return;
  this.peel=false;document.dispatchEvent(new Event('layerschanged'));
  if(this.focus.level==='bone'&&this.focus.boneId===boneId(m.userData.zname))return;
  if(this.focus.level==='overview')this.exploreBoneRegion(m);
  this.focusHistory.push(this.snapshot());this.focus={...this.focus,level:'bone',boneId:boneId(m.userData.zname)};
  const landmark=this.selectedTerm&&!this.selectedTerm.exact&&this.find(this.selectedTerm).some(x=>boneId(x.userData.zname)===boneId(m.userData.zname))?this.selectedTerm:null;const retained=this.pins.map(p=>({term:p.term,point:p.point,label:p.label}));this.clearPins();this.selected=this.boneMeshes(m);this.selected.forEach(x=>this.peeledSurfaces.delete(x));this.selectedTerm=this.focus.boneId==='Sternum'?allTerms.find(t=>t.name==='Sternum'):this.termFor(m);if(landmark){this.selectedTerm=landmark;this.showPins(retained,{labelled:true});this.showOutline(landmark.representation?.outline);}this.isolated=true;this.ghost=false;this.controls.autoRotate=false;this.applyVisibility();this.frame(this.selected);this.notifyFocus();
 }
 canGoBack(){
  return !this.quiz&&(this.muscleLayer?.ownsFocus()?this.muscleLayer.canGoBack():!!this.activeDetail||this.focus.level!=='overview'||this.focusHistory.length>0);
 }
 back(){
  if(!this.canGoBack())return;
  this.lastTap=null;
  if(this.muscleLayer?.ownsFocus()){this.muscleLayer.back();return;}
  const previous=this.focusHistory.pop();
  if(!previous){this.reset();return;}
  this.clearPins();Object.assign(this,{focus:previous.focus,region:previous.region,selected:previous.selected,selectedTerm:previous.selectedTerm,activeDetail:previous.activeDetail,cutaway:previous.cutaway,isolated:previous.isolated,ghost:previous.ghost});if(previous.pins.length)this.showPins(previous.pins,{labelled:previous.pinLabels});this.showOutline(previous.selectedTerm?.representation?.outline);this.controls.autoRotate=false;this.applyVisibility();this.moveCamera(previous.position,previous.target);this.notifyFocus();document.dispatchEvent(new Event('layerschanged'));
 }
 select(term,{frame=true}={}){
  let found=this.find(term),changedContext=false;
  // Unsided reference targets need their source context, rather than a stale sided crop.
  if(!this.quiz&&!term.exact&&[...pointKinds,'diagram','reference'].includes(term.representation?.kind)&&(this.focus.areaId||this.focus.level!=='region')){
   this.focusHistory.push(this.snapshot());this.focus={level:'region',areaId:null,side:null,boneId:null};this.region=term.region;changedContext=true;
  }else if(!this.quiz&&this.focus.level==='bone'&&!found.some(m=>boneId(m.userData.zname)===this.focus.boneId))this.back();
  if(!this.quiz&&this.focus.level==='bone')found=found.filter(m=>boneId(m.userData.zname)===this.focus.boneId);
  this.activeDetail=term.representation?.retiredModel?null:term.representation?.detailGroup||null;this.cutaway=term.representation?.cutaway||null;this.clearPins();this.selected=found;this.selected.forEach(m=>this.peeledSurfaces.delete(m));this.selectedTerm=term;this.isolated=this.focus.level==='bone'&&!this.quiz;this.ghost=false;this.applyVisibility();
  if(pointKinds.includes(term.representation?.kind)){this.showPins(term.representation.points.map(p=>({...p,term})),{labelled:true});this.showOutline(term.representation.outline);this.ghost=!!term.representation.ghostContext||(!this.activeDetail&&!term.representation.isolateContext);this.applyVisibility();if(frame)this.focusFeature(term);}
  else if(this.selected.length){if(wholeStructureLabel(term,this.quiz)){const p=this.selected[0].userData.bounds.getCenter(new THREE.Vector3()).toArray();this.showPins([{term,point:p}],{labelled:true});}if(frame){if(term.representation?.autoFocus)this.focusPoint(this.selected[0].userData.bounds.getCenter(new THREE.Vector3()).toArray(),term.representation.view);else this.frame(this.selected);}}
  this.refreshLandmarkTools();if(changedContext)this.notifyFocus();return this.selected;
 }
 clearPins(){this.needsRender=true;if(this.outline){this.outline.removeFromParent();this.outline.geometry.dispose();this.outline.material.dispose();this.outline=null;}this.pins=[];this.pinLabels=false;if(this.pinLayer)this.pinLayer.replaceChildren();}
 showOutline(points){if(this.outline){this.outline.removeFromParent();this.outline.geometry.dispose();this.outline.material.dispose();this.outline=null;}if(!points?.length)return;this.needsRender=true;const geometry=new THREE.BufferGeometry().setFromPoints(points.map(p=>new THREE.Vector3(...p)));this.outline=new THREE.Line(geometry,new THREE.LineDashedMaterial({color:0xf4b184,dashSize:.004,gapSize:.002,depthTest:false,transparent:true,opacity:.9}));this.outline.computeLineDistances();this.outline.renderOrder=10;this.scene.add(this.outline);}
 showPins(entries,{labelled=false,highlightId=null}={}){this.clearPins();if(!this.pinLayer)return;this.pinLayer.hidden=!!(this.labelsHidden||this.landmarkLabelsOff)&&!this.quiz;this.pinLabels=labelled;const ns='http://www.w3.org/2000/svg';const svg=document.createElementNS(ns,'svg');svg.classList.add('pin-lines');this.pinLayer.append(svg);this.pins=entries.map((p,i)=>{const line=document.createElementNS(ns,'line'),dot=document.createElementNS(ns,'circle');dot.setAttribute('r','4');dot.setAttribute('fill','none');dot.setAttribute('stroke','#f7be86');dot.setAttribute('stroke-width','1.7');svg.append(line,dot);const b=document.createElement('button');b.className='anatomy-pin';const label=p.term.id==='ethmoidal-air-cells-and-sinus-openings'?'Ethmoidal air-cell region':p.label&&/^[a-z0-9]+(?:-[a-z0-9]+)+$/.test(p.label)?p.term.name:p.label||p.term.name;b.textContent=labelled&&!this.quiz?label:String(i+1);b.setAttribute('aria-label',labelled?(this.quiz?'Target '+(i+1)+': '+label:label):'Anatomical target '+(i+1));b.classList.toggle('assessment-marker',this.quiz);b.dataset.id=p.term.id;b.classList.toggle('answer-pin',p.term.id===highlightId);b.onpointerdown=ev=>ev.stopPropagation();b.onpointerup=ev=>ev.stopPropagation();b.onclick=ev=>{ev.stopPropagation();document.dispatchEvent(new CustomEvent('landmarkpick',{detail:p.term}));};this.pinLayer.append(b);return{...p,position:new THREE.Vector3(...p.point),button:b,line,dot};});this.annotationUI?.update(true);}
 layoutPins(){
  if(this.annotationUI&&!this.quiz&&this.pinLabels){this.annotationUI.update();return;}
  const placed=[],w=this.el.clientWidth,h=this.el.clientHeight;
  // Keep labels clear of the fixed landmark controls, including multi-line phone controls.
  const toolBottom=this.detailTools&&!this.detailTools.hidden?this.detailTools.getBoundingClientRect().bottom-this.el.getBoundingClientRect().top+8:0;
  const checkVisibility=performance.now()-(this.lastPinVisibility||0)>140;
  if(checkVisibility)this.lastPinVisibility=performance.now();
  const visibleSolids=checkVisibility?this.meshes.filter(m=>m.visible&&!m.userData.guideOnly&&m.material.opacity>.45):[];
  for(const p of this.pins||[]){
   const q=p.position.clone().project(this.camera),hidden=q.z>1||q.z< -1||Math.abs(q.x)>1||Math.abs(q.y)>1;
   p.button.hidden=hidden;p.line.style.display=p.dot.style.display=hidden?'none':'';if(hidden)continue;
   if(checkVisibility){
    const delta=p.position.clone().sub(this.camera.position),distance=delta.length();
    const probe=new THREE.Raycaster(this.camera.position,delta.normalize(),0,Math.max(0,distance-.0004));
    const hits=probe.intersectObjects(visibleSolids,false).filter(hit=>!(hit.object.material.clippingPlanes||[]).some(plane=>plane.distanceToPoint(hit.point)<0));
    const covered=hits.length>0;
    p.button.classList.toggle('covered-pin',covered);p.line.classList.toggle('covered-pin',covered);p.dot.classList.toggle('covered-pin',covered);
    p.button.title=covered?'Reference is behind a surface. Rotate the specimen or use Peel to expose it.':'Visible anatomical reference';
    p.button.setAttribute('aria-description',p.button.title);
   }
   const ax=(q.x+1)*.5*w,ay=(1-q.y)*.5*h,bw=p.button.offsetWidth/2+5,bh=p.button.offsetHeight/2+5;let x=ax,y=ay;
   for(let step=0;step<25;step++){
    const angle=step*2.4-1.1,r=Math.max(48,bw+18)+Math.ceil(step/4)*22;
    x=Math.max(bw,Math.min(w-bw,ax+Math.cos(angle)*r));y=Math.max(bh+toolBottom,Math.min(h-bh,ay+Math.sin(angle)*r));
    if(!placed.some(a=>Math.abs(a.x-x)<a.bw+bw&&Math.abs(a.y-y)<a.bh+bh))break;
   }
   placed.push({x,y,bw,bh});p.button.style.left=x+'px';p.button.style.top=y+'px';p.line.setAttribute('x1',ax);p.line.setAttribute('y1',ay);p.line.setAttribute('x2',x);p.line.setAttribute('y2',y);p.dot.setAttribute('cx',ax);p.dot.setAttribute('cy',ay);
  }
 }
 focusPoint(point,view=null){document.querySelectorAll('[data-camera]').forEach(b=>b.classList.remove('active'));const c=new THREE.Vector3(...point),side=point[2]<-.025?-1:1;const dir=new THREE.Vector3(...(view?.direction||[.13,.08,.34*side])).normalize();const distance=(view?.distance||.37)*Math.max(1,.75/this.camera.aspect);const rect=!this.quiz?this.annotationUI?.drawingArea():null,fit=rect?Math.min(rect.width/this.el.clientWidth,rect.height/this.el.clientHeight):1;this.moveFramedCamera(c,dir,distance/Math.max(.25,fit),rect);}
 selectMesh(m){const reference=refinementForMesh(m);if(reference){this.select(reference,{frame:false});return;}if(m.userData.detailGroup&&this.selectedTerm)return;this.activeDetail=null;this.cutaway=null;if(!this.quiz&&this.focus.level==='bone'&&boneId(m.userData.zname)!==this.focus.boneId)this.back();this.clearPins();this.selected=this.focus.level==='bone'&&!this.quiz?this.boneMeshes(m):[m];this.selectedTerm=this.termFor(m);this.isolated=this.focus.level==='bone'&&!this.quiz;this.ghost=false;this.applyVisibility();}
 setDivision(division){this.drawerMotion?.stop();this.peel=false;this.region='All regions';this.activeDetail=null;this.cutaway=null;this.division=division;this.focus={level:'overview',areaId:null,side:null,boneId:null};this.focusHistory=[];this.selected=[];this.selectedTerm=null;this.clearPins();this.isolated=false;this.ghost=false;this.applyVisibility();this.frame(this.meshes.filter(m=>m.visible));this.notifyFocus();}
 setRegion(region){this.drawerMotion?.stop();this.peel=false;this.activeDetail=null;this.cutaway=null;if(region==='Joints')this.tissues=true;this.focus={level:region==='All regions'?'overview':'region',areaId:null,side:null,boneId:null};this.focusHistory=[];this.clearPins();this.region=region;this.isolated=false;this.ghost=false;this.selected=[];this.selectedTerm=null;this.applyVisibility();this.frameScope();this.notifyFocus();}
 applyVisibility(){this.needsRender=true;this.sceneRevision=(this.sceneRevision||0)+1;this.el.dataset.specimen=this.activeDetail||'adult';const badge=this.el.closest('.specimen-stage')?.querySelector('.stage-header .tiny');if(badge)badge.textContent=this.activeDetail==='inner-ear'?'02 / INNER EAR':this.activeDetail?'03 / TEACHING':'01 / ADULT';this.scene.children.filter(o=>o.userData.ground).forEach(o=>o.visible=!this.activeDetail&&!pointKinds.includes(this.selectedTerm?.representation?.kind));const selected=new Set(this.selected),r=this.selectedTerm?.representation;const clipping=this.cutaway?[new THREE.Plane(new THREE.Vector3(...(this.cutaway.normal||[0,-1,0])),this.cutaway.constant??this.cutaway.height??1.619)]:[];
  // Peeling one vertebra exposes its neighbors; it must not remove their discs.
  const adultStates=new Map(),levels=new Set(),innerDiscTarget=this.selected.some(m=>isNucleus(m.userData.zname));
  for(const m of this.meshes.filter(m=>!m.userData.detailGroup)){
   const state={activeDetail:this.activeDetail,division:this.division,hidden:this.peeledSurfaces.has(m),selected:selected.has(m),focusedBone:this.focus.level==='bone'&&!this.quiz&&boneId(m.userData.zname)===this.focus.boneId,inScope:this.scopeContains(m),context:(r?.contextPatterns||[]).some(p=>matches(p,m.userData.zname)),isolateContext:!!r?.isolateContext,isolated:this.isolated,tissues:!!this.tissues,discs:this.discs,sinuses:!!this.sinuses,ghost:this.ghost,ghostContext:!!r?.ghostContext,innerDiscTarget};
   adultStates.set(m,state);const level=vertebralLevel(m.userData.zname);if(level&&adultVisibility({name:m.userData.zname,tissue:m.userData.tissue,sinus:m.userData.sinus},{...state,hidden:false}).visible)levels.add(level);
  }
  const adultDisplay=new Map(),visibleParents=new Set();
  for(const [m,state]of adultStates){state.discContext=betweenVisibleVertebrae(m.userData.zname,levels);const display=adultVisibility({name:m.userData.zname,tissue:m.userData.tissue,sinus:m.userData.sinus},state);adultDisplay.set(m,display);if(display.visible)visibleParents.add(m.userData.zname);}
  for(const m of this.meshes)if(m.userData.detailGroup&&!m.userData.guideOnly&&m.userData.detailGroup===this.activeDetail&&!this.peeledSurfaces.has(m)&&(!this.isolated||selected.has(m)))visibleParents.add(m.userData.zname);
  for(const m of this.meshes){
   const detail=m.userData.detailGroup;
   if(m.userData.focusFor){m.visible=focusGuideVisible(m.userData,{selectedIds:[this.selectedTerm?.id,this.selectedTerm?.feature?.id],activeDetail:this.activeDetail,visibleParents,assessmentTask:this.assessmentTask,answerRevealed:this.answerRevealed});m.material.transparent=true;m.material.opacity=m.userData.focusSpecimen?.includes('conchae') ? .24 : m.userData.zname.startsWith('Focus trace') ? .95 : .65;m.material.depthWrite=false;m.material.depthTest=true;m.material.polygonOffset=true;m.material.polygonOffsetFactor=-2;m.material.polygonOffsetUnits=-2;m.material.color.setHex(0xf0ae67);m.material.clippingPlanes=clipping;m.renderOrder=4;continue;}
   if(detail){m.visible=detail===this.activeDetail&&!this.peeledSurfaces.has(m)&&(!this.isolated||selected.has(m));m.material.clippingPlanes=clipping;m.material.color.copy(m.userData.authoredColor);m.material.opacity=this.ghost&&!selected.has(m)?Math.min(.15,m.userData.authoredOpacity):m.userData.authoredOpacity;m.material.transparent=m.material.opacity<1;m.material.depthWrite=!m.material.transparent;continue;}
   const display=adultDisplay.get(m);m.visible=display.visible;
   m.material.clippingPlanes=(m.userData.region==='Skull'||r?.isolateContext)?clipping:[];
   m.material.opacity=display.opacity;m.material.transparent=display.opacity<1;m.material.depthWrite=!m.material.transparent;
   const family=this.skullColors&&!this.quiz&&this.focus.level!=='overview'&&!m.userData.nonbone?boneFamily(m.userData.zname):null;
   const c=family?parseInt(family.color.slice(1),16):selected.has(m)?(pointKinds.includes(r?.kind)?0xe5e1cd:0xb5e6be):m.userData.sinus?0xa1b59b:m.userData.tissue?/artery/.test(m.userData.zname)?0xd98878:0xc9aa7b:m.userData.nonbone?0x9da9a1:0xe5e1cd;m.material.color.setHex(c);m.material.emissive.setHex(selected.has(m)&&!pointKinds.includes(r?.kind)?0x14291b:0x000000);
  }this.muscleLayer?.updateVisibility();this.syncLayerControls();this.refreshLandmarkTools();
 }


 syncLayerControls(){
  const button=document.querySelector('#discs-btn'),tissues=document.querySelector('#tissues-btn');
  for(const [id,value]of [['peel-btn',this.peel],['isolate-btn',this.isolated],['ghost-btn',this.ghost],['rotate-btn',this.controls.autoRotate]])document.getElementById(id)?.setAttribute('aria-pressed',String(!!value));
  const hasPeels=this.peeledSurfaces.size>0;
  for(const id of ['undo-peel-btn','restore-btn']){
   const control=document.getElementById(id);
   if(control)control.disabled=!hasPeels;
  }
  const mobileUndo=document.getElementById('mobile-undo-peel');
  if(mobileUndo){
   if(!hasPeels&&document.activeElement===mobileUndo)document.getElementById('viewer-action-toggle')?.focus({preventScroll:true});
   mobileUndo.hidden=!hasPeels;
  }
  if(tissues){tissues.setAttribute('aria-pressed',String(!!this.tissues));tissues.disabled=!!this.activeDetail;tissues.title='Additional ligaments and soft tissues. Selected targets stay visible.';}
  this.muscleLayer?.syncControls();
  if(!button)return;const count=this.meshes.filter(m=>m.visible&&isIntervertebralDisc(m.userData.zname)).length,target=this.selected.some(m=>isIntervertebralDisc(m.userData.zname));
  const relevant=(!this.muscleLayer?.ownsFocus()||count>0)&&!this.activeDetail&&(this.region==='All regions'||['Spine','Pelvis','Thorax'].includes(this.region)||this.focus.areaId==='neck'||target);
  button.hidden=!relevant;button.disabled=this.isolated||target;button.setAttribute('aria-pressed',String(this.discs||target));button.querySelector('span').textContent='Discs: '+(target?'Target':this.discs?'On':'Off');button.querySelector('small').textContent=String(count);
  button.title=target?'The selected disc target stays visible.':this.isolated?'Single bone view hides surrounding discs. Use Back to restore the region.':count+' intervertebral discs in the current specimen context. This layer is separate from additional tissues.';
 }

 isolate(){if(!this.selected.length)return false;this.isolated=!this.isolated;this.ghost=false;this.applyVisibility();if(this.isolated){if(pointKinds.includes(this.selectedTerm?.representation?.kind))this.focusFeature();else this.frame(this.selected);}return this.isolated;}
 xray(){if(!this.selected.length)return false;this.ghost=!this.ghost;this.isolated=false;this.applyVisibility();return this.ghost;}
 resize(){this.needsRender=true;const w=this.el.clientWidth,h=this.el.clientHeight;if(!w||!h||!this.renderer)return;const previous=this.camera.aspect,direction=(this.tween?.to||this.camera.position).clone().sub(this.tween?.targetTo||this.controls.target).normalize().toArray();this.camera.aspect=w/h;this.camera.updateProjectionMatrix();this.renderer.setSize(w,h,false);if(this.pendingFrame){const pending=this.pendingFrame;this.pendingFrame=null;this.frameBox(pending.box,pending.side);return;}if(this.drawerMotion?.active){this.drawerMotion.frame(direction);return;}if(this.loaded&&Math.abs(Math.log(this.camera.aspect/previous))>.12){if(this.pins?.length)this.focusFeature(undefined,{direction});else this.frameScope(direction);}}
 frameScope(side='front'){
  if(this.muscleLayer?.ownsFocus()){this.muscleLayer.frame(side);return;}
  if(this.drawerMotion?.active){this.drawerMotion.frame(side);return;}
  if(this.activeDetail){this.frame(this.meshes.filter(m=>m.visible),side);return;}
  if(!this.quiz&&this.focus.areaId&&this.focus.level==='region'){
   const a=areas[this.focus.areaId],core=this.meshes.filter(m=>m.visible&&inArea(m.userData.zname,this.focus.areaId,this.focus.side,{core:true}));
   const box=new THREE.Box3();core.forEach(m=>box.union(m.userData.bounds));if(!box.isEmpty()){box.expandByScalar(a.padding??(a.sided ? .065 : .035));this.frameBox(box,side);return;}
  }
  this.frame(this.quiz&&this.selected.length||this.focus.level==='bone'||this.isolated?this.selected:this.meshes.filter(m=>m.visible&&!m.userData.tissue&&!m.userData.nonbone&&!m.userData.sinus),side);
 }
 frame(ms,side='front'){if(!ms.length)return;const box=new THREE.Box3();for(const m of ms)box.union(m.userData.bounds);this.frameBox(box,side);}
 frameBox(box,side='front',rectOverride=null){
  if(!this.el.clientWidth||!this.el.clientHeight){this.pendingFrame={box:box.clone(),side};this.el.dataset.framing='waiting-for-layout';return;}this.el.dataset.framing='ready';
  document.querySelectorAll('[data-camera]').forEach(b=>b.classList.toggle('active',!Array.isArray(side)&&b.dataset.camera===side));
  const center=box.getCenter(new THREE.Vector3()),dirs={front:[0,.04,1],back:[0,.04,-1],left:[1,.04,0],right:[-1,.04,0],top:[0,1,.001],bottom:[0,-1,.001]};
  const direction=new THREE.Vector3(...(Array.isArray(side)?side:dirs[side])).normalize(),right=new THREE.Vector3(0,1,0).cross(direction).normalize();if(right.lengthSq()<.001)right.set(1,0,0);const up=direction.clone().cross(right),points=[];
  for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z])points.push(new THREE.Vector3(x,y,z).sub(center));
  const span=axis=>Math.max(.002,Math.max(...points.map(p=>p.dot(axis)))-Math.min(...points.map(p=>p.dot(axis))));
  const rect=rectOverride||(!this.quiz?this.annotationUI?.drawingArea():null),fw=rect?rect.width/this.el.clientWidth:1,fh=rect?rect.height/this.el.clientHeight:1;
  const distance=Math.max(span(up)/fh,span(right)/(Math.max(this.camera.aspect,.1)*fw))*.5/Math.tan(THREE.MathUtils.degToRad(16))*1.10+span(direction)*.5+.002;
  this.moveFramedCamera(center,direction,distance,rect);
 }

 moveFramedCamera(center,direction,distance,rect=null){const target=center.clone();if(rect){const right=new THREE.Vector3(0,1,0).cross(direction);if(right.lengthSq()<.001)right.set(1,0,0);right.normalize();const up=direction.clone().cross(right),nx=(rect.x+rect.width/2)/this.el.clientWidth*2-1,ny=1-(rect.y+rect.height/2)/this.el.clientHeight*2,scale=distance*Math.tan(THREE.MathUtils.degToRad(16));target.addScaledVector(right,-nx*scale*this.camera.aspect).addScaledVector(up,-ny*scale);}this.moveCamera(target.clone().addScaledVector(direction,distance),target);}
 moveCamera(pos,target){if(!pos.toArray().every(Number.isFinite)||!target.toArray().every(Number.isFinite))return;this.needsRender=true;if(!this.camera.position.toArray().every(Number.isFinite)||!this.controls.target.toArray().every(Number.isFinite)){this.camera.position.copy(pos);this.controls.target.copy(target);this.controls.update();this.tween=null;return;}if(this.reduced){this.camera.position.copy(pos);this.controls.target.copy(target);this.controls.update();return;}this.tween={start:performance.now(),from:this.camera.position.clone(),to:pos,targetFrom:this.controls.target.clone(),targetTo:target};}
 recenter(){
  this.controls.autoRotate=false;
  if(this.activeDetail==='fetal-skull'&&this.recenterFetalSpecimen)this.recenterFetalSpecimen();
  else if(this.selectedTerm?.representation?.points?.length)this.focusFeature();
  else this.view('front');
 }
 view(side){this.controls.autoRotate=false;const direction={front:[0,.04,1],back:[0,.04,-1],left:[1,.04,0],right:[-1,.04,0],top:[0,1,.001],bottom:[0,-1,.001]}[side];if(direction&&pointKinds.includes(this.selectedTerm?.representation?.kind))this.focusFeature(undefined,{direction});else this.frameScope(side);document.querySelectorAll('[data-camera]').forEach(b=>b.classList.toggle('active',b.dataset.camera===side));}
 peelSurface(mesh){
  // Muscles may share a component ID. Bone and specimen surfaces use mesh identity.
  this.peeledSurfaces.add(mesh.userData.muscleId||mesh);
  this.applyVisibility();
  document.dispatchEvent(new Event('layerschanged'));
 }
 undoPeel(){
  // Set insertion order is the peel history. Camera changes do not restore old peels.
  if(!this.peeledSurfaces.delete([...this.peeledSurfaces].at(-1)))return;
  this.applyVisibility();
  document.dispatchEvent(new Event('layerschanged'));
 }
 restore(){this.peeledSurfaces.clear();if(this.muscleLayer)this.muscleLayer.restore();else this.applyVisibility();document.dispatchEvent(new Event('layerschanged'));}
 reset({division=this.division}={}){this.division=division;this.muscleLayer?.release();this.assessmentTask=null;this.answerRevealed=false;this.drawerMotion?.stop();this.activeDetail=null;this.cutaway=null;this.sinuses=false;this.controls.autoRotate=false;this.focus={level:'overview',areaId:null,side:null,boneId:null};this.focusHistory=[];this.lastTap=null;document.querySelector('#rotate-btn').setAttribute('aria-pressed','false');this.clearPins();this.annotationUI?.clear();this.peeledSurfaces.clear();this.peel=false;document.dispatchEvent(new Event('layerschanged'));this.selected=[];this.selectedTerm=null;this.isolated=false;this.ghost=false;this.region='All regions';this.applyVisibility();this.frame(this.meshes.filter(m=>m.visible));this.notifyFocus();}
 animate(){if(!this.running)return;requestAnimationFrame(()=>this.animate());if(document.hidden||!this.el.getClientRects().length)return;if(this.tween){const t=Math.min((performance.now()-this.tween.start)/700,1),e=1-Math.pow(1-t,3);this.camera.position.lerpVectors(this.tween.from,this.tween.to,e);this.controls.target.lerpVectors(this.tween.targetFrom,this.tween.targetTo,e);if(t===1)this.tween=null;}this.controls.update();this.drawerMotion?.update();if(this.needsRender||performance.now()-(this.lastAnnotationUpdate||0)>250){this.layoutPins();this.landmarkOverlay?.update();this.muscleLayer?.updateLabel();this.lastAnnotationUpdate=performance.now();}if(!this.graphicsLost&&!this.referenceOpen&&this.el.clientWidth&&this.el.clientHeight&&(this.needsRender||this.tween||this.controls.autoRotate||this.drawerMotion?.moving)){this.renderer.render(this.scene,this.camera);this.needsRender=false;}}
}
