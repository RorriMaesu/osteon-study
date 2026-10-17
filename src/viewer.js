import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/addons/loaders/DRACOLoader.js';
import {allTerms,matches} from './data.js';
import './representations.js';
import {meshRegion,meshDivision,meshInRegion} from './anatomy.js';
import {areas,areaForBone,areaLabel,inArea,boneFamily,boneId,boneSide,navigationAction} from './exploration.js';

export class AnatomyViewer {
 constructor(el,onPick,onReady,onError){
  this.el=el;this.onPick=onPick;this.meshes=[];this.selected=[];this.isolated=false;this.ghost=false;this.region='All regions';this.division='All';this.skullColors=true;this.quiz=false;this.hiddenMeshes=new Set();this.peel=false;
  this.focus={level:'overview',areaId:null,side:null,boneId:null};this.focusHistory=[];
  this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  try {this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});}catch(e){onError(e);return;}
  this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));this.renderer.setClearColor(0x000000,0);this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.2;el.append(this.renderer.domElement);
  this.scene=new THREE.Scene();this.camera=new THREE.PerspectiveCamera(32,1,.005,30);this.camera.position.set(.13,.92,3.1);
  this.controls=new OrbitControls(this.camera,this.renderer.domElement);this.controls.target.set(0,.88,0);this.controls.enableDamping=!this.reduced;this.controls.dampingFactor=.09;this.controls.minDistance=.09;this.controls.maxDistance=7;this.controls.autoRotateSpeed=.7;this.controls.enablePan=true;
  this.scene.add(new THREE.HemisphereLight(0xe5f8ee,0x203c41,2.1));
  for(const [color,power,pos]of [[0xffe7d2,3,[2,3,4]],[0xa2d4d0,2,[-2,1,-2]],[0xffffff,1.3,[0,3,-1]]]){const l=new THREE.DirectionalLight(color,power);l.position.set(...pos);this.scene.add(l);}
  const grid=new THREE.GridHelper(4,40,0x44635d,0x2c4245);grid.material.transparent=true;grid.material.opacity=.23;grid.position.y=.003;this.scene.add(grid);
  const ring=new THREE.Mesh(new THREE.RingGeometry(.22,.223,96),new THREE.MeshBasicMaterial({color:0x789d8c,transparent:true,opacity:.35,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=.005;this.scene.add(ring);
  this.ray=new THREE.Raycaster();this.pointer=new THREE.Vector2();this.down=null;
  this.activePointers=new Set();
  el.addEventListener('pointerdown',e=>{this.activePointers.add(e.pointerId);if(this.activePointers.size>1){this.multiTouch=true;this.lastTap=null;}this.down=[e.clientX,e.clientY];this.tween=null;});
  el.addEventListener('pointercancel',e=>{this.activePointers.delete(e.pointerId);this.down=null;this.lastTap=null;if(!this.activePointers.size)this.multiTouch=false;});
  el.addEventListener('pointerup',e=>{
   const tapped=this.down&&!this.multiTouch&&Math.hypot(e.clientX-this.down[0],e.clientY-this.down[1])<6;
   this.activePointers.delete(e.pointerId);if(!this.activePointers.size)this.multiTouch=false;
   if(tapped&&e.button===0){const m=this.hit(e);if(m){if(this.peel||e.shiftKey){this.lastTap=null;this.hiddenMeshes.add(m);document.querySelector('#hover-label').hidden=true;this.applyVisibility();document.dispatchEvent(new Event('layerschanged'));}else{
    this.onPick(m);
    if(e.pointerType==='touch'){
     const now=performance.now(),last=this.lastTap;
     if(last&&last.mesh===m&&now-last.time<380&&Math.hypot(e.clientX-last.x,e.clientY-last.y)<20){this.lastTap=null;this.touchNavigationAt=now;this.navigateBone(m);e.preventDefault();}
     else this.lastTap={mesh:m,time:now,x:e.clientX,y:e.clientY};
    }
   }}else this.lastTap=null;}else this.lastTap=null;
   this.down=null;
  });
  el.addEventListener('dblclick',e=>{e.preventDefault();if(performance.now()-(this.touchNavigationAt||-1000)<800||this.peel||e.shiftKey)return;const m=this.hit(e);if(m)this.navigateBone(m);});
  el.addEventListener('keydown',e=>{if(this.quiz||e.target!==el)return;if(e.key==='Enter'){e.preventDefault();if(this.selected[0])this.navigateBone(this.selected[0]);}else if(e.key==='Escape'){e.preventDefault();this.back();}});
  el.addEventListener('pointermove',e=>{const label=document.querySelector('#hover-label');if(this.quiz||this.down){label.hidden=true;return;}const m=this.hit(e);label.hidden=!m;if(m){label.textContent=this.displayName(m);const r=el.getBoundingClientRect();label.style.left=Math.min(e.clientX-r.left+14,r.width-185)+'px';label.style.top=Math.max(42,e.clientY-r.top-30)+this.el.offsetTop+'px';}el.style.cursor=m?'pointer':'grab';});
  el.addEventListener('pointerleave',()=>{document.querySelector('#hover-label').hidden=true;});
  this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(el);
  this.controls.addEventListener('start',()=>{this.tween=null;});
  const decoder=new DRACOLoader();decoder.setDecoderPath(new URL('vendor/draco/',document.baseURI).href);decoder.setWorkerLimit(2);
  const loader=new GLTFLoader();loader.setDRACOLoader(decoder);
  loader.load(new URL('assets/skeleton.glb',document.baseURI).href,async gltf=>{
   try{
   gltf.scene.traverse(m=>{if(!m.isMesh)return;const z=m.userData.zname||m.name.replace(/\.001$/,'');m.userData.zname=z;m.userData.region=this.meshRegion(z,m.userData.zgroup||'');m.userData.sinus=/^Sinus /.test(z);m.userData.nonbone=/cartilage|tooth|canine|incisor|premolar/i.test(z);m.material=new THREE.MeshStandardMaterial({color:m.userData.sinus?0xa8b5a0:m.userData.nonbone?0xa6b3ad:0xe5e1cd,roughness:.55,metalness:.04,side:THREE.DoubleSide});m.userData.initialPosition=m.position.clone();this.meshes.push(m);});
   this.root=gltf.scene;this.scene.add(this.root);this.root.updateMatrixWorld(true);this.meshes.forEach(m=>{m.userData.bounds=new THREE.Box3().setFromObject(m);});
   const tissues=await loader.loadAsync(new URL('assets/course-tissues.glb',document.baseURI).href);
   tissues.scene.traverse(m=>{if(!m.isMesh)return;const z=m.userData.zname||m.name;m.userData.zname=z;m.userData.tissue=true;m.userData.region=/disc|pulposus|Vertebral artery/.test(z)?'Spine':/Stylohyoid/.test(z)?'Thorax':/Pubic symphysis/.test(z)?'Pelvis':'Joints';m.userData.nonbone=true;m.material=new THREE.MeshStandardMaterial({color:/artery/.test(z)?0xd98878:0xc9aa7b,roughness:.65,side:THREE.DoubleSide});this.meshes.push(m);});
   this.scene.add(tissues.scene);tissues.scene.updateMatrixWorld(true);this.meshes.forEach(m=>{m.userData.bounds=new THREE.Box3().setFromObject(m);});
   this.pinLayer=document.createElement('div');this.pinLayer.className='pin-layer';el.append(this.pinLayer);this.pins=[];
   this.loaded=true;this.applyVisibility();this.resize();this.reset();decoder.dispose();el.dataset.loaded='true';onReady(this.meshes);
   }catch(err){onError(err);}
  },p=>{if(p.total)document.querySelector('#load-progress').textContent=`Model transfer ${Math.min(100,Math.round(p.loaded/p.total*100))}% · preparing geometry`;},onError);
  this.running=true;this.animate();
 }
 meshRegion(n,g){return meshRegion(n,g);}
 displayName(m){const n=m.userData.zname;return n.replace(/finger of foot/g,'toe').replace(/finger of hand/g,'finger').replace(/\.l$/,' (left)').replace(/\.r$/,' (right)');}
 find(term){return this.meshes.filter(m=>matches(term.pattern,m.userData.zname));}
 termFor(m){const base=m.userData.zname.replace(/\.[lr]$/,'');return allTerms.find(t=>t.exact&&t.pattern===base)||allTerms.find(t=>t.exact&&matches(t.pattern,m.userData.zname))||{id:'specimen-'+base.toLowerCase().replace(/[^a-z0-9]+/g,'-'),name:base,region:m.userData.region,type:m.userData.nonbone?'tissue':'bone',pattern:base,exact:true,aliases:[],source:'Full specimen · supplementary structure',cue:'Named anatomical geometry from the Z-Anatomy reference specimen. Use the surrounding bones to orient yourself.',representation:{kind:'mesh',reference:({Skull:'7.2',Spine:'7.3',Thorax:'7.4','Upper limb':'8.2',Pelvis:'8.3','Lower limb':'8.4',Joints:'9.6'})[m.userData.region]}};}
 hit(e){if(!this.loaded)return null;const r=this.el.getBoundingClientRect();this.pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);this.ray.setFromCamera(this.pointer,this.camera);return this.ray.intersectObjects(this.meshes.filter(m=>m.visible),false)[0]?.object||null;}
 snapshot(){return{focus:{...this.focus},region:this.region,selected:[...this.selected],selectedTerm:this.selectedTerm,isolated:this.isolated,ghost:this.ghost,pins:(this.pins||[]).map(p=>({term:p.term,point:[...p.point]})),pinLabels:this.pinLabels,hiddenMeshes:new Set(this.hiddenMeshes),position:(this.tween?.to||this.camera.position).clone(),target:(this.tween?.targetTo||this.controls.target).clone()};}
 notifyFocus(){this.el.dataset.focus=this.focus.level;this.el.dataset.area=this.focus.areaId||'';document.dispatchEvent(new CustomEvent('atlasfocuschange'));}
 focusLabel(){return this.focus.areaId?areaLabel(this.focus.areaId,this.focus.side):this.region;}
 scopeContains(m){
  if(!this.focus.areaId||this.quiz)return meshInRegion(m.userData.zname,m.userData.region,this.region);
  const n=m.userData.zname;
  return inArea(n,this.focus.areaId,this.focus.side)||(this.focus.areaId==='skull'&&m.userData.region==='Skull')||(this.focus.areaId==='thorax'&&/^Costal cartilage/.test(n))||(this.focus.areaId==='neck'&&/Thyroid cartilage|Cricoid cartilage|Arytenoid cartilage|Corniculate cartilage/.test(n));
 }
 boneMeshes(m){const id=boneId(m.userData.zname);return this.meshes.filter(x=>boneId(x.userData.zname)===id);}
 navigateBone(m){const action=navigationAction(this.focus,m.userData.zname,this.quiz||this.peel);if(action==='region')this.exploreBoneRegion(m);else if(action==='bone')this.focusBone(m);}
 exploreBoneRegion(m=this.selected[0]){
  if(!m||this.quiz)return;
  this.peel=false;document.dispatchEvent(new Event('layerschanged'));
  const areaId=areaForBone(m.userData.zname);if(!areaId)return;
  if(this.focus.level==='bone'&&this.focus.areaId===areaId){this.back();return;}
  this.focusHistory.push(this.snapshot());this.focus={level:'region',areaId,side:boneSide(m.userData.zname),boneId:null};this.region=areas[areaId].macro;
  this.clearPins();this.selected=[m];this.selectedTerm=this.termFor(m);this.hiddenMeshes.delete(m);this.isolated=false;this.ghost=false;this.controls.autoRotate=false;this.applyVisibility();this.frameScope();this.notifyFocus();
 }
 focusBone(m=this.selected[0]){
  if(!m||this.quiz||!boneFamily(m.userData.zname))return;
  this.peel=false;document.dispatchEvent(new Event('layerschanged'));
  if(this.focus.level==='bone'&&this.focus.boneId===boneId(m.userData.zname))return;
  if(this.focus.level==='overview')this.exploreBoneRegion(m);
  this.focusHistory.push(this.snapshot());this.focus={...this.focus,level:'bone',boneId:boneId(m.userData.zname)};
  this.clearPins();this.selected=this.boneMeshes(m);this.selected.forEach(x=>this.hiddenMeshes.delete(x));this.selectedTerm=this.focus.boneId==='Sternum'?allTerms.find(t=>t.name==='Sternum'):this.termFor(m);this.isolated=true;this.ghost=false;this.controls.autoRotate=false;this.applyVisibility();this.frame(this.selected);this.notifyFocus();
 }
 back(){
  if(this.quiz)return;
  const previous=this.focusHistory.pop();
  if(!previous){if(this.focus.level!=='overview')this.reset();return;}
  this.clearPins();Object.assign(this,{focus:previous.focus,region:previous.region,selected:previous.selected,selectedTerm:previous.selectedTerm,isolated:previous.isolated,ghost:previous.ghost,hiddenMeshes:previous.hiddenMeshes});if(previous.pins.length)this.showPins(previous.pins,{labelled:previous.pinLabels});this.controls.autoRotate=false;this.applyVisibility();this.moveCamera(previous.position,previous.target);this.notifyFocus();document.dispatchEvent(new Event('layerschanged'));
 }
 select(term,{frame=true}={}){
  let found=this.find(term),changedContext=false;
  // Unsided reference targets need their source context, rather than a stale sided crop.
  if(!this.quiz&&!term.exact&&['source-pin','diagram'].includes(term.representation?.kind)&&(this.focus.areaId||this.focus.level!=='region')){
   this.focusHistory.push(this.snapshot());this.focus={level:'region',areaId:null,side:null,boneId:null};this.region=term.region;changedContext=true;
  }else if(!this.quiz&&this.focus.level==='bone'&&!found.some(m=>boneId(m.userData.zname)===this.focus.boneId))this.back();
  if(!this.quiz&&this.focus.level==='bone')found=found.filter(m=>boneId(m.userData.zname)===this.focus.boneId);
  this.clearPins();this.selected=found;this.selected.forEach(m=>this.hiddenMeshes.delete(m));this.selectedTerm=term;this.isolated=this.focus.level==='bone'&&!this.quiz;this.ghost=false;this.applyVisibility();
  if(term.representation?.kind==='source-pin'){this.showPins(term.representation.points.map(p=>({term,point:p.point})),{labelled:true});this.ghost=true;this.applyVisibility();if(frame)this.focusPoint(term.representation.points[0].point);}
  else if(frame&&this.selected.length)this.frame(this.selected);
  if(changedContext)this.notifyFocus();return this.selected;
 }
 clearPins(){this.pins=[];this.pinLabels=false;if(this.pinLayer)this.pinLayer.replaceChildren();}
 showPins(entries,{labelled=false,highlightId=null}={}){this.clearPins();if(!this.pinLayer)return;this.pinLabels=labelled;const ns='http://www.w3.org/2000/svg';const svg=document.createElementNS(ns,'svg');svg.classList.add('pin-lines');this.pinLayer.append(svg);this.pins=entries.map((p,i)=>{const line=document.createElementNS(ns,'line'),dot=document.createElementNS(ns,'circle');dot.setAttribute('r','3');svg.append(line,dot);const b=document.createElement('button');b.className='anatomy-pin';b.textContent=labelled?p.term.name:String(i+1);b.setAttribute('aria-label',labelled?p.term.name:'Anatomical target '+(i+1));b.dataset.id=p.term.id;b.classList.toggle('answer-pin',p.term.id===highlightId);b.onpointerdown=ev=>ev.stopPropagation();b.onpointerup=ev=>ev.stopPropagation();b.onclick=ev=>{ev.stopPropagation();document.dispatchEvent(new CustomEvent('landmarkpick',{detail:p.term}));};this.pinLayer.append(b);return{...p,position:new THREE.Vector3(...p.point),button:b,line,dot};});}
 layoutPins(){const placed=[],w=this.el.clientWidth,h=this.el.clientHeight;for(const p of this.pins||[]){const q=p.position.clone().project(this.camera),hidden=q.z>1||q.z< -1||Math.abs(q.x)>1||Math.abs(q.y)>1;p.button.hidden=hidden;p.line.style.display=p.dot.style.display=hidden?'none':'';if(hidden)continue;const ax=(q.x+1)*.5*w,ay=(1-q.y)*.5*h,bw=p.button.offsetWidth/2+5,bh=p.button.offsetHeight/2+5;let x=ax,y=ay;for(let step=0;step<25;step++){const angle=step*2.4,r=Math.ceil(step/4)*25;x=Math.max(bw,Math.min(w-bw,ax+Math.cos(angle)*r));y=Math.max(bh,Math.min(h-bh,ay+Math.sin(angle)*r));if(!placed.some(a=>Math.abs(a.x-x)<a.bw+bw&&Math.abs(a.y-y)<a.bh+bh))break;}placed.push({x,y,bw,bh});p.button.style.left=x+'px';p.button.style.top=y+'px';p.line.setAttribute('x1',ax);p.line.setAttribute('y1',ay);p.line.setAttribute('x2',x);p.line.setAttribute('y2',y);p.dot.setAttribute('cx',ax);p.dot.setAttribute('cy',ay);}}
 focusPoint(point){const c=new THREE.Vector3(...point),side=point[2]<-.025?-1:1;this.moveCamera(c.clone().add(new THREE.Vector3(.13,.08,.34*side)),c);}
 selectMesh(m){if(!this.quiz&&this.focus.level==='bone'&&boneId(m.userData.zname)!==this.focus.boneId)this.back();this.clearPins();this.selected=this.focus.level==='bone'&&!this.quiz?this.boneMeshes(m):[m];this.selectedTerm=this.termFor(m);this.isolated=this.focus.level==='bone'&&!this.quiz;this.ghost=false;this.applyVisibility();}
 setDivision(division){this.division=division;this.focus={level:'overview',areaId:null,side:null,boneId:null};this.focusHistory=[];this.selected=[];this.selectedTerm=null;this.clearPins();this.isolated=false;this.ghost=false;this.applyVisibility();this.frame(this.meshes.filter(m=>m.visible));this.notifyFocus();}
 setRegion(region){if(region==='Joints')this.tissues=true;this.focus={level:region==='All regions'?'overview':'region',areaId:null,side:null,boneId:null};this.focusHistory=[];this.clearPins();this.region=region;this.isolated=false;this.ghost=false;this.selected=[];this.selectedTerm=null;this.applyVisibility();this.frameScope();this.notifyFocus();}
 applyVisibility(){const selected=new Set(this.selected);for(const m of this.meshes){const region=this.scopeContains(m);const focusedBone=this.focus.level==='bone'&&!this.quiz&&boneId(m.userData.zname)===this.focus.boneId;m.visible=(this.division==='All'||meshDivision(m.userData.zname)===this.division)&&!this.hiddenMeshes.has(m)&&(this.isolated?selected.has(m)||focusedBone:(region||selected.has(m))&&(!m.userData.sinus||this.sinuses||selected.has(m))&&(!m.userData.tissue||this.tissues||selected.has(m)));m.material.transparent=this.ghost&&!selected.has(m);m.material.opacity=this.ghost&&!selected.has(m)?0.12:1;m.material.depthWrite=!m.material.transparent;const family=this.skullColors&&!this.quiz&&this.focus.level!=='overview'&&!m.userData.nonbone?boneFamily(m.userData.zname):null;const c=family?parseInt(family.color.slice(1),16):selected.has(m)?0xb5e6be:m.userData.sinus?0xa1b59b:m.userData.tissue?/artery/.test(m.userData.zname)?0xd98878:0xc9aa7b:m.userData.nonbone?0x9da9a1:0xe5e1cd;m.material.color.setHex(c);m.material.emissive.setHex(selected.has(m)?0x3a5742:0x000000);}}
 isolate(){if(!this.selected.length)return false;this.isolated=!this.isolated;this.ghost=false;this.applyVisibility();if(this.isolated)this.frame(this.selected);return this.isolated;}
 xray(){if(!this.selected.length)return false;this.ghost=!this.ghost;this.isolated=false;this.applyVisibility();return this.ghost;}
 resize(){const w=this.el.clientWidth,h=this.el.clientHeight;if(!w||!h||!this.renderer)return;const previous=this.camera.aspect;this.camera.aspect=w/h;this.camera.updateProjectionMatrix();this.renderer.setSize(w,h,false);if(this.loaded&&Math.abs(Math.log(this.camera.aspect/previous))>.12){if(this.pins?.length){const center=new THREE.Vector3();this.pins.forEach(p=>center.add(p.position));this.focusPoint(center.divideScalar(this.pins.length).toArray());}else this.frameScope();}}
 frameScope(side='front'){
  if(!this.quiz&&this.focus.areaId&&this.focus.level==='region'){
   const a=areas[this.focus.areaId],core=this.meshes.filter(m=>m.visible&&inArea(m.userData.zname,this.focus.areaId,this.focus.side,{core:true}));
   const box=new THREE.Box3();core.forEach(m=>box.union(m.userData.bounds));if(!box.isEmpty()){box.expandByScalar(a.padding??(a.sided ? .065 : .035));this.frameBox(box,side);return;}
  }
  this.frame(this.quiz&&this.selected.length||this.focus.level==='bone'||this.isolated?this.selected:this.meshes.filter(m=>m.visible),side);
 }
 frame(ms,side='front'){if(!ms.length)return;const box=new THREE.Box3();for(const m of ms)box.union(m.userData.bounds);this.frameBox(box,side);}
 frameBox(box,side='front'){const size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());const h=Math.max(.08,size.y),w=Math.max(.08,side==='left'||side==='right'?size.z:size.x),depth=Math.max(.08,side==='left'||side==='right'?size.x:size.z);const distance=Math.max(h,w/Math.max(this.camera.aspect,.4),depth)*.5/Math.tan(THREE.MathUtils.degToRad(16))*1.15+.05;const dirs={front:[0,.04,1],back:[0,.04,-1],left:[1,.04,0],right:[-1,.04,0]};const dir=new THREE.Vector3(...dirs[side]).normalize();this.moveCamera(center.clone().addScaledVector(dir,distance),center);}
 moveCamera(pos,target){if(this.reduced){this.camera.position.copy(pos);this.controls.target.copy(target);this.controls.update();return;}this.tween={start:performance.now(),from:this.camera.position.clone(),to:pos,targetFrom:this.controls.target.clone(),targetTo:target};}
 view(side){this.controls.autoRotate=false;this.frameScope(side);}
 restore(){this.hiddenMeshes.clear();this.applyVisibility();document.dispatchEvent(new Event('layerschanged'));}
 reset(){this.sinuses=false;this.controls.autoRotate=false;this.focus={level:'overview',areaId:null,side:null,boneId:null};this.focusHistory=[];this.lastTap=null;document.querySelector('#rotate-btn').setAttribute('aria-pressed','false');this.clearPins();this.hiddenMeshes.clear();this.peel=false;document.dispatchEvent(new Event('layerschanged'));this.selected=[];this.selectedTerm=null;this.isolated=false;this.ghost=false;this.region='All regions';this.applyVisibility();this.frame(this.meshes.filter(m=>m.visible));this.notifyFocus();}
 animate(){if(!this.running)return;requestAnimationFrame(()=>this.animate());if(this.tween){const t=Math.min((performance.now()-this.tween.start)/700,1),e=1-Math.pow(1-t,3);this.camera.position.lerpVectors(this.tween.from,this.tween.to,e);this.controls.target.lerpVectors(this.tween.targetFrom,this.tween.targetTo,e);if(t===1)this.tween=null;}this.controls.update();this.layoutPins();if(this.el.clientWidth&&this.el.clientHeight)this.renderer.render(this.scene,this.camera);}
}
