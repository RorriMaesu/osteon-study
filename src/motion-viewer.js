
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/addons/loaders/DRACOLoader.js';
import {elbowAngle,planarLimbPose,clamp} from './motion-core.js';
import {ankleMorphBinding,poseAnkleMorphs} from './motion-ankle.js';
import modelAssets from './model-assets.json' with {type:'json'};
import muscleModels from './muscle-models.json' with {type:'json'};
import {walkScopeMatches,walkBoneRegion,captureWalkDrivers,mountWalkPack,updateWalkPacks,walkScopeBounds} from './motion-walk-model.js';
import {regionalLessons} from './motion-regional.js';
import {overlapsPoseRect,placePoseLabel,poseRect} from './motion-pose-overlays.js';
import {MotionReveal,visibleInTree} from './motion-reveal.js';

const radians = Math.PI / 180;
const axis = values => new THREE.Vector3(...values).normalize();
const muscleBase = new THREE.Color('#9d7261');
const muscleMuted = new THREE.Color('#604f4e');
const opposingRoleColor=new THREE.Color('#a9b6e6');
const mixedRoleColor=new THREE.Color('#f3c479');
const walkContextMaterial=new THREE.MeshStandardMaterial({color:'#8f6559',roughness:.78});
const atlasParts=new Map(muscleModels.components.map(part=>[part.id,part]));
const svgNamespace='http://www.w3.org/2000/svg';
const cueColors=Object.fromEntries(Object.entries({concentric:'#ff9855',isometric:'#d7a1ff',eccentric:'#68d8ff',role:'#9cdec0',authored:'#ff9e61',emg:'#ffd8a0'}).map(([key,value])=>[key,new THREE.Color(value)]));

function jointState(node){
 if(!node)throw new Error('A required joint is missing from the model.');
 return {node,rest:node.quaternion.clone(),position:node.position.clone()};
}
const outlineMaterial=new THREE.MeshBasicMaterial({color:0xf7f5dd,side:THREE.BackSide,depthWrite:false});
outlineMaterial.onBeforeCompile=shader=>{shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed += normal * 0.0014;');};
function outlinePart(part){
 if(part.outline)return part.outline;
 const outline=part.mesh.clone(false);
 outline.material=outlineMaterial;
 outline.name=part.mesh.name+' selection';
 if(part.mesh.morphTargetInfluences)outline.morphTargetInfluences=part.mesh.morphTargetInfluences;
 part.mesh.parent.add(outline);
 return part.outline=outline;
}
function musclePart(mesh){
 const data=mesh.userData,key=data.muscleId;
 const material=data.walkRegion?walkContextMaterial:new THREE.MeshStandardMaterial({color:muscleBase,roughness:.78});
 mesh.material=material;
 const atlas=atlasParts.get(key);
 return {mesh,material,key,id:data.motionMuscle||data.walkMuscleGroup||key,side:data.motionSide||atlas?.side||'right',
  name:atlas?.geometryReview?.displayName||data.motionPart||atlas?.name||mesh.name,
  region:data.walkRegion||atlas?.region,walkSegments:data.walkSegments,deformation:data.walkDeformation,
  contextOnly:!!(data.motionContextOnly||data.walkEvidence),walkOnly:!!data.walkRegion};
}
async function readRig(name){
 const version=modelAssets[name];
 if(!version)throw new Error('This motion specimen is unavailable.');
 const url=ext=>new URL('assets/'+name+ext+'?v='+version,document.baseURI).href;
 const decoder=new DRACOLoader().setDecoderPath(new URL('vendor/draco/',document.baseURI).href).setWorkerLimit(2);
 try{return await Promise.all([new GLTFLoader().setDRACOLoader(decoder).loadAsync(url('.glb')),fetch(url('.json')).then(response=>{
  if(!response.ok)throw new Error('Could not read the motion rig.');return response.json();
 })]);}finally{decoder.dispose();}
}

export class MotionViewer {
 constructor(stage,{onFrame,onTarget,onMuscle,onLimb}){
  this.stage=stage;
  this.onFrame=onFrame;
  this.onTarget=onTarget;
  this.onMuscle=onMuscle;
  this.onLimb=onLimb;
  this.handle=stage.querySelector('.motion-handle');
  this.loadTag=stage.querySelector('.motion-load-tag');
  this.selectionLabel=stage.querySelector('[data-motion-selection-label]');
  this.selectionGuide=document.createElementNS(svgNamespace,'svg');
  this.selectionGuide.classList.add('motion-selection-guide');
  this.selectionGuide.setAttribute('aria-hidden','true');
  this.selectionGuide.style.display='none';
  this.selectionLine=document.createElementNS(svgNamespace,'line');
  this.selectionDot=document.createElementNS(svgNamespace,'circle');
  this.selectionDot.setAttribute('r','3');
  this.selectionGuide.append(this.selectionLine,this.selectionDot);
  this.stage.append(this.selectionGuide);
  this.reveal=new MotionReveal(stage);
  this.reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
  this.labelAnchor=new THREE.Vector3();
  this.cache=new Map();
  this.walkScope='all';
  this.walkActive=false;
  this.camera=new THREE.PerspectiveCamera(35,1,.004,30);
  this.pointer=new THREE.Vector2();
  this.ray=new THREE.Raycaster();
  this.dragPlane=new THREE.Plane();
  this.handle.addEventListener('pointerdown',event=>this.startDrag(event));
  this.handle.addEventListener('pointermove',event=>this.moveDrag(event));
  for(const name of ['pointerup','pointercancel','lostpointercapture'])this.handle.addEventListener(name,event=>this.endDrag(event));
  this.resize=new ResizeObserver(()=>this.fitCanvas());
 }
 open(){
  if(this.renderer)return;
  this.renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});
  this.renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.65));
  this.renderer.outputColorSpace=THREE.SRGBColorSpace;
  this.renderer.domElement.hidden=false;
  this.renderer.domElement.setAttribute('aria-hidden','true');
  this.renderer.domElement.className='motion-canvas';
  this.stage.prepend(this.renderer.domElement);
  this.renderer.domElement.addEventListener('pointerdown',event=>{this.pickStart={x:event.clientX,y:event.clientY};});
  this.renderer.domElement.addEventListener('pointerup',event=>this.pick(event));
  this.renderer.domElement.addEventListener('webglcontextrestored',()=>{this.dirty=true;});
  this.scene=new THREE.Scene();
  this.grid=new THREE.GridHelper(2.4,24,0x426660,0x2d4a4c);
  this.grid.visible=false;
  this.scene.add(this.grid);
  this.scene.add(new THREE.HemisphereLight(0xf4f6ed,0x668780,2.15));
  const key=new THREE.DirectionalLight(0xfff3d9,2.1);
  key.position.set(.8,1.8,2.6);this.scene.add(key);
  const fill=new THREE.DirectionalLight(0xc4edee,1);
  fill.position.set(-1,1,-2);this.scene.add(fill);
  this.controls=new OrbitControls(this.camera,this.renderer.domElement);
  this.controls.enableDamping=true;
  this.controls.addEventListener('change',()=>{this.dirty=true;});
  if(this.current)this.scene.add(this.current.model);
  this.resize.observe(this.stage);
  this.fitCanvas();
  this.dirty=true;
  this.tick(performance.now());
 }
 close(){
  if(!this.renderer)return;
  cancelAnimationFrame(this.token);
  this.resize.disconnect();
  this.controls.dispose();
  this.renderer.domElement.remove();
  this.grid.geometry.dispose();
  this.grid.material.dispose();
  this.renderer.dispose();
  this.renderer.forceContextLoss();
  this.renderer=null;
  this.drag=null;
  this.lastTime=undefined;
  this.selectedPart=null;
  this.reveal.reset();
  this.showSelectionLabel(false);
 }
 async load(kind){
  if(this.cache.has(kind))return this.cache.get(kind);
  const regional=Object.hasOwn(regionalLessons,kind);
  const arm=kind!=='legs'&&!regional;
  const name=regional?regionalLessons[kind].asset:arm?(kind==='arm-left'?'motion-arm-left':'motion-arm'):'motion-legs';
  const loading=(async()=>{
    const [modelFile,meta]=await readRig(name);
    const model=modelFile.scene;
    if(regional){
     const info=new Map(meta.components.map(part=>[part.id,part]));
     const parts=[],morphables=[],context=[];
     model.traverse(mesh=>{
      if(!mesh.isMesh)return;
      const targets=Object.entries(mesh.morphTargetDictionary||{});
      if(targets.length)morphables.push({mesh,targets});
      if(mesh.userData.motionContext){
       mesh.material=new THREE.MeshStandardMaterial({color:'#d1cec1',roughness:.83,opacity:.38,transparent:true,depthWrite:false});
       context.push(mesh);
      }
      if(mesh.userData.motionMuscle){
       const part=musclePart(mesh);
       const record=info.get(part.key);
       part.note=record?.note;
       part.deformation=record?.modeling;
       part.contextOnly=targets.length===0;
       parts.push(part);
      }
     });
     if(parts.length!==meta.components.length||!morphables.length)throw new Error('The regional movement and its named surfaces do not match.');
     return {model,meta,parts,morphables,context,kind:'regional'};
    }
    const attach=name=>jointState(model.getObjectByName(name));
    const joints=arm?Object.fromEntries(Object.entries(meta.joints).map(([key,name])=>[key,attach(name)])):{
     pelvis:attach(meta.joints.pelvis),
     ...Object.fromEntries(['right','left'].map(side=>[side,Object.fromEntries(Object.entries(meta.joints[side]).map(([key,name])=>[key,attach(name)]))])),
    };
    const parts=[],legBones=[],ankleMorphs={left:[],right:[]};
    model.traverse(mesh=>{
     if(!mesh.isMesh)return;
     if(mesh.isSkinnedMesh)mesh.frustumCulled=false;
     const side=!arm&&mesh.userData.motionKind==='bone'&&mesh.userData.zname?.match(/\.(r|l)$/i);
     if(side)legBones.push({mesh,side:side[1].toLowerCase()==='r'?'right':'left'});
     if(!arm){
      const binding=ankleMorphBinding(mesh);
      if(binding)ankleMorphs[binding.side].push(binding);
     }
     if(!mesh.userData.motionMuscle)return;
     parts.push(musclePart(mesh));
    });
    const clip=modelFile.animations.find(animation=>animation.name===meta.animation?.name);
    const mixer=clip?new THREE.AnimationMixer(model):null;
    const action=clip?mixer.clipAction(clip).setLoop(THREE.LoopOnce,1):null;
    if(action)action.clampWhenFinished=true;
    const contacts=!arm?Object.fromEntries(Object.entries(meta.contact).map(([side,points])=>[side,Object.values(points).map(point=>({node:model.getObjectByName(point.node),offset:new THREE.Vector3(...point.local)}))])):null;
    return {model,meta,joints,parts,kind:arm?'arm':'legs',side:meta.side||'right',mixer,action,contacts,legBones,ankleMorphs};
  })();
  this.cache.set(kind,loading);
  loading.catch(()=>this.cache.delete(kind));
  return loading;
 }
 async addUpper(specimen){
  if(specimen.upper)return;
  const [file,meta]=await readRig('motion-walk-context');
  if(specimen.upper)return;
  const root=file.scene.getObjectByName(meta.root);
  const attach=name=>jointState(root.getObjectByName(name));
  const torso=attach(meta.torso),head=attach(meta.head);
  const arms=Object.fromEntries(Object.entries(meta.joints).map(([side,chain])=>[side,Object.fromEntries(Object.entries(chain).map(([joint,name])=>[joint,attach(name)]))]));
  specimen.joints.pelvis.node.add(root);
  root.position.set(0,0,0);
  root.visible=false;
  specimen.upper={root,torso,head,arms,meta};
 }
 async addWalkMuscles(specimen){
  if(specimen.walkPacks)return;
  if(specimen.walkLoading)return specimen.walkLoading;
  const version=modelAssets['motion-walk-muscles'];
  if(!version||!specimen.upper)return;
  specimen.model.updateMatrixWorld(true);
  const bones=[];
  specimen.model.traverse(mesh=>{
   if(mesh.isMesh&&(mesh.userData.motionKind==='bone'||mesh.userData.motionBone))bones.push({mesh,...walkBoneRegion(mesh)});
  });
  const load=async()=>{
   const url=new URL('assets/motion-walk-muscles.json?v='+version,document.baseURI);
   const response=await fetch(url);
   if(!response.ok)throw new Error('Could not load the full-body muscle inventory.');
   const manifest=await response.json();
   const drivers=captureWalkDrivers(specimen.model,Object.keys(manifest.drivers));
   const decoder=new DRACOLoader().setDecoderPath(new URL('vendor/draco/',document.baseURI).href).setWorkerLimit(2);
   const loader=new GLTFLoader().setDRACOLoader(decoder);
   let files;
   try{
    files=await Promise.all(Object.values(manifest.regions).map(asset=>loader.loadAsync(new URL(asset.file+'?v='+asset.sha256.slice(0,12),url).href)));
   }finally{decoder.dispose();}
   const unique=new Set(manifest.baseMuscleIds),parts=[];
   for(const {scene} of files)scene.traverse(mesh=>{
    if(!mesh.isMesh||!mesh.userData.walkRegion)return;
    if(!mesh.userData.muscleId||unique.has(mesh.userData.muscleId))throw new Error('The walking muscle inventory contains a duplicate or unnamed surface.');
    unique.add(mesh.userData.muscleId);
    if(mesh.isSkinnedMesh)mesh.frustumCulled=false;
    parts.push(musclePart(mesh));
   });
   if(unique.size!==manifest.totalMuscleSurfaces)throw new Error('The full-body muscle inventory did not load completely.');
   try{
    specimen.walkPacks=files.map(({scene})=>mountWalkPack(specimen,scene,manifest.drivers,drivers));
   }catch(error){
    for(const {scene} of files)scene.removeFromParent();
    throw error;
   }
   specimen.walkBones=bones;
   specimen.parts.push(...parts);
  };
  specimen.walkLoading=load();
  try{await specimen.walkLoading;}finally{specimen.walkLoading=null;}
 }
 setWalkScope(scope,active){
  if(this.walkScope===scope&&this.walkActive===active&&this.walkScopeSpecimen===this.current)return;
  this.walkScope=scope;
  this.walkActive=active;
  this.walkScopeSpecimen=this.current;
  for(const entry of this.current?.walkBones||[])entry.mesh.visible=!active||walkScopeMatches(scope,entry.region,entry.side,entry.walkSegments);
  this.dirty=true;
 }
 async addCalves(specimen){
  if(specimen.calves)return;
  const [file,meta]=await readRig('motion-leg-actions');
  if(specimen.calves)return;
  const skeleton=specimen.parts[0].mesh.skeleton;
  if(!meta.skinCompatible||!skeleton||skeleton.bones.some((bone,index)=>bone.name!==meta.jointOrder[index]))throw new Error('The calf muscles could not be matched to the leg rig.');
  const calves=[];
  file.scene.traverse(mesh=>{if(mesh.isSkinnedMesh&&(mesh.userData.motionMuscle||mesh.userData.motionHeelReplacement))calves.push(mesh);});
  const replacements=calves.map(mesh=>{
   const {motionHeelReplacement:replace,motionHeelDeformation:shape}=mesh.userData;
   const base=replace?specimen.model.getObjectByName(replace):null;
   if(replace&&!base)throw new Error('A calf surface could not be matched to the leg rig.');
   const slot=shape?mesh.morphTargetDictionary?.[shape]:null;
   if(shape&&!Number.isInteger(slot))throw new Error('A calf deformation is missing from the model.');
   return {mesh,base,slot};
  });
  for(const entry of replacements){
   const {mesh}=entry;
   const bind=mesh.bindMatrix.clone();
   specimen.model.add(mesh);
   mesh.bind(skeleton,bind);
   mesh.frustumCulled=false;
   if(mesh.userData.motionMuscle){
    const part=musclePart(mesh);
    part.lessonOnly=true;
    specimen.parts.push(part);
   }
  }
  specimen.calves=replacements;
 }
 use(specimen){
  if(this.current!==specimen){
   this.reveal.reset();
   this.current?.model.removeFromParent();
   this.current=specimen;
   this.scene?.add(specimen.model);
  }
  specimen.revealBones=[];
  specimen.model.traverse(mesh=>{
   const info=mesh.userData;
   const skeleton=info.poseBone||info.motionBone||info.motionKind==='bone'||info.motionContext&&info.zlayer==='skeleton';
   if(mesh.isMesh&&skeleton)specimen.revealBones.push(mesh);
  });
  specimen.model.visible=true;
  this.dirty=true;
 }
 rotate(joint,normal,angle){
  if(!joint||!normal)return;
  const change=new THREE.Quaternion().setFromAxisAngle(axis(normal),angle*radians);
  joint.node.quaternion.copy(joint.rest).multiply(change);
 }
 reset(){
  if(!this.current)return;
  const {joints,kind,action}=this.current;
  if(kind==='regional'){this.applyRegional({},true);return;}
  action?.stop();
  const listed=kind==='arm'?Object.values(joints):[joints.pelvis,...Object.values(joints.left),...Object.values(joints.right)];
  if(this.current.upper){
   const {torso,head,arms}=this.current.upper;
   listed.push(torso,head,...Object.values(arms).flatMap(arm=>Object.values(arm)));
  }
  for(const joint of listed){joint.node.quaternion.copy(joint.rest);joint.node.position.copy(joint.position);}
  if(kind==='legs')for(const bindings of Object.values(this.current.ankleMorphs||{}))poseAnkleMorphs(bindings,0);
  this.dirty=true;
 }
 applyRegional(weights,showContext){
  const {morphables,context}=this.current;
  for(const {mesh,targets} of morphables)for(const [name,index] of targets)mesh.morphTargetInfluences[index]=weights[name]||0;
  for(const mesh of context)mesh.visible=showContext;
  this.dirty=true;
 }
 sampleCurl(seconds,angle){
  const {mixer,action}=this.current;
  if(!mixer){this.poseArm(angle);return angle;}
  action.reset().play();
  mixer.setTime(seconds);
  this.dirty=true;
  const {node,rest}=this.current.joints.elbow;
  return node.quaternion.angleTo(rest)/radians+(this.current.meta.neutralFlexionDegrees||0);
 }
 poseArm(angle){
  const {joints,meta}=this.current;
  this.rotate(joints.elbow,meta.elbowAxis,angle-(meta.neutralFlexionDegrees||0));
  this.dirty=true;
 }
 poseLeg(side,pose){
  const {joints,meta}=this.current;
  for(const joint of ['hip','knee','ankle']){
   const rest=meta.neutralAngles?.[side]?.[joint]||0;
   this.rotate(joints[side][joint],meta.axes[side][joint],pose[joint]-rest);
  }
  this.rotate(joints[side].patella,meta.axes[side].patella,Math.max(0,pose.knee)*.55);
  poseAnkleMorphs(this.current.ankleMorphs?.[side],pose.ankle);
  this.dirty=true;
 }
 showGround(visible){if(this.grid){this.grid.visible=visible;if(!visible)this.grid.position.z=0;}}
 showUpper(visible){
  if(this.current?.upper){this.current.upper.root.visible=visible;this.dirty=true;}
 }
 animateUpper(percent,rightContact){
  const upper=this.current.upper;
  if(!upper?.root.visible)return;
  const {meta,torso,head,arms}=upper;
  const phase=percent<rightContact ? .5+.5*percent/rightContact : .5*(percent-rightContact)/(100-rightContact);
  const frames=meta.previewFrames;
  const last=frames.length-1,index=Math.min(last-1,Math.floor(phase*last));
  const [before,from,to,after]=[-1,0,1,2].map(offset=>frames[(index+offset+last)%last]);
  const t=phase*last-index;
  const at=column=>{
   const a=before[column],b=from[column],c=to[column],d=after[column];
   return b+.5*t*(c-a+t*(2*a-5*b+4*c-d+t*(3*b-3*c+d-a)));
  };
  this.rotate(torso,meta.axes.torso,at(1));
  this.rotate(head,meta.axes.head,at(2));
  for(const [side,start] of [['right',3],['left',5]]){
   this.rotate(arms[side].shoulder,meta.axes[side].shoulder,at(start));
   this.rotate(arms[side].elbow,meta.axes[side].elbow,at(start+1));
  }
 }
 heelRise(angle){
  const {joints,contacts,model,meta,calves}=this.current;
  for(const {mesh,slot} of calves||[])if(slot!=null)mesh.morphTargetInfluences[slot]=clamp(angle/23,0,1);
  joints.pelvis.node.position.copy(joints.pelvis.position);
  for(const side of ['left','right']){
   this.poseLeg(side,{hip:0,knee:0,ankle:-angle});
   this.rotate(joints[side].toe,meta.axes[side].toe,angle);
  }
  model.updateMatrixWorld(true);
  const position=point=>point.node.localToWorld(point.offset.clone());
  const toe=position(contacts.right[2]).lerp(position(contacts.left[2]),.5);
  if(!this.heelRest)this.heelRest=toe.clone();
  // Keep the same forefoot contact while the heel and body rise together.
  joints.pelvis.node.position.add(this.heelRest.clone().sub(toe));
  if(this.grid){this.grid.position.y=this.heelRest.y-.004;this.grid.position.z=0;}
  this.dirty=true;
 }
 setWalkTracks(samples){
  const {joints,contacts,model}=this.current;
  joints.pelvis.node.position.copy(joints.pelvis.position);
  const height=sample=>{
   for(const side of ['left','right'])this.poseLeg(side,sample[side]);
   model.updateMatrixWorld(true);
   const y=Object.keys(contacts).filter(side=>sample[side].contact).flatMap(side=>contacts[side].map(({node,offset})=>node.localToWorld(offset.clone()).y));
   return y.length?Math.min(...y):0;
  };
  const raw=samples.map(height);
  const filter=[1,4,6,4,1];
  this.walkOffsets=raw.map((_,index)=>filter.reduce((sum,weight,j)=>sum+weight*raw[clamp(index+j-2,0,raw.length-1)],0)/16);
  this.reset();
 }
 walk(frame,distance,rightContact){
  this.animateUpper(frame.percent,rightContact);
  const {joints}=this.current;
  const clock=frame.percent/100;
  const index=clock*(this.walkOffsets.length-1);
  const a=this.walkOffsets[Math.floor(index)],b=this.walkOffsets[Math.ceil(index)];
  const floorCorrection=a+(b-a)*(index-Math.floor(index));
  const {forwardMeters,rightMeters}=frame.pelvis;
  joints.pelvis.node.position.copy(joints.pelvis.position).add(new THREE.Vector3(-rightMeters,-floorCorrection,forwardMeters-distance*clock));
  for(const side of ['left','right'])this.poseLeg(side,frame[side]);
  if(this.current.walkPacks)updateWalkPacks(this.current.walkPacks);
  if(this.grid){this.grid.position.z=-distance*clock%.1;this.grid.position.y=0;}
  this.dirty=true;
 }
 highlight({strengths,selected,selectedGroup,showMuscles,onlyActive,isolateSelection=false,showCalves=false,cue,displayThreshold=0,antagonists,mixedRoles,selectionRoles,regionalRoles,reveal=false,revealThreshold=0,revealGroup=false,revealBones=false}){
  if(!this.current)return;
  const replaced=new Set();
  for(const {mesh,base} of this.current.calves||[]){
   if(base){base.visible=!showCalves;if(showCalves)replaced.add(base);}
   mesh.visible=showCalves;
  }
  this.selectedPart=null;
  this.selectionRoles=selectionRoles;
  const revealTargets=[];
  const isolate=isolateSelection&&!!(selected||selectedGroup);
  for(const p of this.current.parts){
   const key=p.side+':'+p.id, strength=this.walkActive&&p.walkOnly?0:strengths[key];
   const exact=selected===p.key;
   const focused=exact||selectedGroup===key;
   const visibleSignal=strength>0&&strength>=displayThreshold;
   const opposing=antagonists?.has(key);
   const mixed=mixedRoles?.has(key);
   const inScope=this.walkActive?walkScopeMatches(this.walkScope,p.region,p.side,p.walkSegments):
    !regionalRoles||focused||regionalRoles.includes(p.id);
   p.mesh.visible=showMuscles&&inScope&&(!p.walkOnly||this.walkActive)&&!replaced.has(p.mesh)&&(!p.lessonOnly||showCalves)&&(!onlyActive||focused||visibleSignal||opposing||mixed)&&(!isolate||focused);
   if(exact&&p.mesh.visible)this.selectedPart=p;
   if(reveal&&p.mesh.visible&&(mixed||visibleSignal&&strength>=revealThreshold))revealTargets.push(p);
   if(!p.walkOnly){
    p.material.color.copy(cue?muscleMuted:muscleBase);
    const intensity=visibleSignal?clamp(strength,0,1):0;
    if(mixed)p.material.color.copy(mixedRoleColor);
    else if(cueColors[cue]&&intensity)p.material.color.lerp(cueColors[cue],intensity);
    else if(opposing)p.material.color.lerp(opposingRoleColor,.78);
    p.material.emissive.copy(p.material.color).multiplyScalar(intensity*.23);
   }
   if(p.outline||focused)outlinePart(p).visible=focused&&p.mesh.visible;
  }
  if(reveal&&showMuscles)this.reveal?.configure({
   selected:this.selectedPart,targets:revealGroup?revealTargets:[],bones:revealBones,
   contributors:new Set(cue==='emg'?[]:revealTargets.map(part=>part.mesh)),
  });
  else if(this.reveal?.targets.length||this.reveal?.selected||this.reveal?.faded.size)this.reveal.reset();
  this.dirty=true;
 }
 focusMuscle(){
  const mesh=this.selectedPart?.mesh;
  if(!mesh||!this.controls?.enabled||!visibleInTree(mesh))return;
  this.current.model.updateMatrixWorld(true);
  const bounds=new THREE.Box3().setFromObject(mesh,true);
  if(bounds.isEmpty())return;
  const center=bounds.getCenter(new THREE.Vector3());
  const radius=bounds.getBoundingSphere(new THREE.Sphere()).radius;
  const fitting=Math.min(1,Math.max(.25,this.camera.aspect));
  const distance=Math.max(.045,radius/Math.sin(this.camera.fov*radians/2)*1.35/fitting);
  const direction=this.camera.position.clone().sub(this.controls.target).normalize();
  this.controls.target.copy(center);
  this.controls.minDistance=Math.min(this.controls.minDistance,distance*.42);
  this.controls.maxDistance=Math.max(this.controls.maxDistance,distance*2);
  this.camera.position.copy(center).addScaledVector(direction,distance);
  this.controls.update();
  this.dirty=true;
 }
 zoom(direction){
  if(!this.renderer||!this.controls.enabled||!this.current?.model.visible)return;
  const {target,minDistance,maxDistance}=this.controls;
  const offset=this.camera.position.clone().sub(target);
  const distance=offset.length()*(direction==='in'?1/1.22:1.22);
  this.camera.position.copy(offset.setLength(clamp(distance,minDistance,maxDistance)).add(target));
  this.controls.update();
  this.dirty=true;
 }
 frame(view='lesson'){
  if(!this.current||!this.controls)return;
  if(this.current.kind==='regional'){
   const {target,direction,diameter}=this.current.meta.camera;
   const vector=({front:[0,0,1],side:[1,.03,0],back:[0,0,-1]})[view]||direction;
   const fitting=Math.min(1,Math.max(.24,this.camera.aspect));
   const distance=diameter/(2*Math.tan(this.camera.fov*radians/2)*fitting);
   this.controls.target.set(...target);
   this.camera.position.copy(this.controls.target).addScaledVector(axis(vector),distance);
   this.controls.minDistance=distance*.32;
   this.controls.maxDistance=distance*3.5;
   this.controls.update();
   this.dirty=true;
   return;
  }
  const isolated=this.walkActive&&this.walkScope!=='all'&&this.current.walkBones;
  const bounds=isolated?walkScopeBounds(this.current.parts,this.current.walkBones,this.walkScope):new THREE.Box3().setFromObject(this.current.model);
  if(bounds.isEmpty())return;
  const size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
  const left=this.current.side==='left';
  if(this.current.kind==='arm'){
   const {joints}=this.current;
   const elbow=joints.elbow.node.getWorldPosition(new THREE.Vector3());
   center.set(elbow.x+(left ? .018 : -.018),elbow.y-.020,elbow.z+.164);
  }
  if(this.current.kind==='legs'&&!isolated&&!this.current.upper?.root.visible){
   size.y=.94;center.y=.46;
  }
  const diagonal=this.current.kind==='arm'?.91:Math.max(size.y,size.x,size.z)*(isolated?1.45:1.15);
  const direction=({
   lesson:this.current.kind==='arm'?[left?1:-1,.11,.24]:[1,.13,1.25],
   front:[0,.08,1],back:[0,.08,-1],side:this.current.kind==='arm'?[left?1:-1,.05,0]:[1,.05,0],
  }[view]||[1,.1,1]);
  const limiting=Math.min(1,Math.max(.20,this.camera.aspect));
  const distance=diagonal/(2*Math.tan(this.camera.fov*radians/2)*limiting);
  this.controls.target.copy(center);
  this.camera.position.copy(center).addScaledVector(axis(direction),distance);
  this.controls.minDistance=distance*.26;
  this.controls.maxDistance=distance*3;
  this.controls.update();
  this.dirty=true;
 }
 fitCanvas(){
  if(!this.renderer||!this.stage.clientHeight)return;
  const width=this.stage.clientWidth,height=this.stage.clientHeight;
  this.camera.aspect=width/height;
  this.camera.updateProjectionMatrix();
  this.renderer.setSize(width,height,false);
  this.dirty=true;
 }
 targetJoint(){
  if(!this.current||!this.target)return null;
  return this.current.kind==='arm'?this.current.joints.wrist:this.current.joints[this.target].ankle;
 }
 updateMarker(){
  const joint=this.targetJoint();
  const hidden=!joint||!this.current.model.visible;
  this.handle.hidden=hidden||this.showLoad;
  this.loadTag.hidden=hidden||!this.showLoad;
  if(hidden)return;
  const pos=joint.node.getWorldPosition(new THREE.Vector3()).project(this.camera);
  const element=this.showLoad?this.loadTag:this.handle;
  const x=(pos.x*.5+.5)*100,y=(.5-pos.y*.5)*100;
  element.hidden=x<4||x>96||y<6||y>94||Math.abs(pos.z)>1;
  element.style.left=x+'%';
  element.style.top=y+'%';
  if(this.showLoad&&!element.hidden){
   element.style.translate='';
   const toolbar=this.stage.querySelector('.motion-camera')?.getBoundingClientRect();
   const tag=element.getBoundingClientRect();
   if(toolbar?.height&&overlapsPoseRect(tag,toolbar,4))element.style.translate='0 '+(toolbar.top-tag.bottom-4)+'px';
  }
 }
 rayAt(event){
  const rect=this.renderer.domElement.getBoundingClientRect();
  this.pointer.set((event.clientX-rect.left)/rect.width*2-1,1-(event.clientY-rect.top)/rect.height*2);
  this.ray.setFromCamera(this.pointer,this.camera);
 }
 startDrag(event){
  if(!this.current||!this.target||this.showLoad||event.button!==0)return;
  event.preventDefault();
  const {joints,meta,kind}=this.current;
  const hinge=kind==='arm'?joints.elbow:joints[this.target].hip;
  const pivot=hinge.node.getWorldPosition(new THREE.Vector3());
  const normal=kind==='arm'?meta.elbowAxis:meta.axes[this.target].hip;
  const originRotation=hinge.node.parent.getWorldQuaternion(new THREE.Quaternion()).multiply(hinge.rest);
  const worldNormal=axis(normal).applyQuaternion(originRotation);
  const marker=this.targetJoint().node.getWorldPosition(new THREE.Vector3());
  // The camera-facing plane keeps the target stable even when viewing edge-on.
  this.dragPlane.setFromNormalAndCoplanarPoint(this.camera.getWorldDirection(new THREE.Vector3()),marker);
  const elbowWorld=kind==='arm'?null:joints[this.target].knee.node.getWorldPosition(new THREE.Vector3());
  const restOffset=kind==='arm'?marker.clone().sub(pivot).applyAxisAngle(worldNormal,-this.angle*radians):null;
  this.drag={id:event.pointerId,pivot,normal:worldNormal,restOffset,kind,elbowWorld,marker};
  this.controls.enabled=false;
  this.handle.setPointerCapture(event.pointerId);
 }
 moveDrag(event){
  if(this.drag?.id!==event.pointerId)return;
  this.rayAt(event);
  const point=this.ray.ray.intersectPlane(this.dragPlane,new THREE.Vector3());
  if(!point)return;
  const {pivot,restOffset,normal,kind,marker,elbowWorld}=this.drag;
  const offset=point.sub(pivot);
  if(kind==='arm'){
   const angle=elbowAngle(restOffset.toArray(),offset.toArray(),normal.toArray());
   if(angle!==null)this.onTarget(angle);
   return;
  }
  const thigh=elbowWorld.clone().sub(pivot),shank=marker.clone().sub(elbowWorld);
  const vertical=new THREE.Vector3(0,-1,0).projectOnPlane(normal).normalize();
  const tangent=new THREE.Vector3().crossVectors(normal,vertical);
  const choice=planarLimbPose(thigh.clone().projectOnPlane(normal).length(),shank.clone().projectOnPlane(normal).length(),offset.dot(vertical),offset.dot(tangent),-1);
  const {hip,knee,ankle}=this.current.meta.neutral[this.target];
  const neutralThigh=new THREE.Vector3(...knee).sub(new THREE.Vector3(...hip));
  const neutralShank=new THREE.Vector3(...ankle).sub(new THREE.Vector3(...knee));
  const restAngle=vector=>Math.atan2(vector.dot(tangent),vector.dot(vertical))/radians;
  this.onTarget({hip:clamp(choice.root-restAngle(neutralThigh),-22,85),knee:clamp(restAngle(neutralShank)-restAngle(neutralThigh)-choice.bend,0,85)});
 }
 endDrag(event){
  if(this.drag?.id!==event.pointerId)return;
  this.drag=null;
  if(this.controls)this.controls.enabled=true;
 }
 pick(event){
  if(!this.current||!this.pickStart||Math.hypot(event.clientX-this.pickStart.x,event.clientY-this.pickStart.y)>6)return;
  this.rayAt(event);
  this.scene.updateMatrixWorld(true);
  const candidates=this.current.parts.filter(part=>visibleInTree(part.mesh));
  if(this.target&&this.current.kind==='legs')candidates.push(...this.current.legBones);
  const byMesh=new Map(candidates.map(part=>[part.mesh,part]));
  const pickingThrough=this.reveal.faded.size>0;
  if(pickingThrough)for(const mesh of this.current.revealBones||[]){
   if(visibleInTree(mesh)&&(!mesh.material.transparent||mesh.material.opacity>=.65)&&!byMesh.has(mesh))byMesh.set(mesh,null);
  }
  for(const mesh of byMesh.keys())if(mesh.isSkinnedMesh){
   mesh.computeBoundingSphere();
   if(mesh.boundingBox)mesh.computeBoundingBox();
  }
  const hits=this.ray.intersectObjects([...byMesh.keys()],false);
  const hit=pickingThrough?(hits.find(({object})=>!this.reveal.isFaded(object))||hits[0]):hits[0];
  const part=hit&&byMesh.get(hit.object);
  if(part){if(part.key)this.onMuscle(part.key);else this.onLimb(part.side);}
 }
 showSelectionLabel(visible){
  if(this.selectionLabel)this.selectionLabel.hidden=!visible;
  this.selectionGuide.style.display=visible?'':'none';
 }
 updateSelectionLabel(){
  const part=this.current?.model.visible&&this.selectedPart;
  const label=this.selectionLabel;
  if(!part||!label){this.showSelectionLabel(false);return;}
  const {mesh}=part,geometry=mesh.geometry;
  if(part.anchorIndex===undefined){
   if(!geometry.boundingBox)geometry.computeBoundingBox();
   const center=geometry.boundingBox.getCenter(new THREE.Vector3());
   const positions=geometry.getAttribute('position');
   let closest=Infinity;
   for(let index=0;index<positions.count;index++){
    const distance=this.labelAnchor.fromBufferAttribute(positions,index).distanceToSquared(center);
    if(distance<closest){part.anchorIndex=index;closest=distance;}
   }
  }
  const usingReveal=this.reveal.selected===part;
  const anchor=usingReveal?this.reveal.anchor:part.anchorIndex;
  if(anchor===undefined){this.showSelectionLabel(false);return;}
  mesh.getVertexPosition(anchor,this.labelAnchor);
  const {x,y,z}=mesh.localToWorld(this.labelAnchor).project(this.camera);
  if(Math.abs(x)>.98||Math.abs(y)>.98||Math.abs(z)>1){this.showSelectionLabel(false);return;}
  const {clientWidth:width,clientHeight:height}=this.stage;
  const anchorX=(1+x)*width/2,anchorY=(1-y)*height/2;
  const side=['left','right'].includes(part.side)?' · '+part.side:'';
  const role=this.selectionRoles?.get(part.key);
  const name=part.name+side+(role?' · '+role:'');
  if(label.textContent!==name)label.textContent=name;
  this.showSelectionLabel(true);
  const stageBounds=this.stage.getBoundingClientRect();
  const notes=this.stage.closest('#motion-view')?.querySelector('.motion-info');
  const notesBounds=notes?.getBoundingClientRect();
  const notesCover=notesBounds?.height&&notesBounds.left<stageBounds.right&&notesBounds.right>stageBounds.left&&notesBounds.top>stageBounds.top+38&&notesBounds.top<stageBounds.bottom;
  const lowerEdge=notesCover?notesBounds.top-stageBounds.top:height;
  const halfWidth=label.offsetWidth/2;
  let top=clamp(anchorY-38,notesCover?95:48,Math.max(notesCover?95:48,lowerEdge-label.offsetHeight/2-8));
  let left=clamp(anchorX+(anchorX<width*.58?42:-42),halfWidth+8,width-halfWidth-8);
  const obstacles=[...this.stage.querySelectorAll('.motion-camera,.motion-reveal-controls')]
   .map(element=>element.getBoundingClientRect()).filter(rect=>rect.height).map(rect=>({
    left:rect.left-stageBounds.left,right:rect.right-stageBounds.left,top:rect.top-stageBounds.top,bottom:rect.bottom-stageBounds.top,
   }));
  if(obstacles.some(obstacle=>overlapsPoseRect(poseRect(left,top,label.offsetWidth,label.offsetHeight),obstacle,7))){
    const point=placePoseLabel({anchor:{x:anchorX,y:anchorY},width,height:lowerEdge,labelWidth:label.offsetWidth,labelHeight:label.offsetHeight,obstacles});
    if(!point){this.showSelectionLabel(false);return;}
    left=point.x;top=point.y;
  }
  label.style.left=left+'px';
  label.style.top=top+'px';
  this.selectionLine.setAttribute('x1',anchorX);
  this.selectionLine.setAttribute('y1',anchorY);
  this.selectionLine.setAttribute('x2',left);
  this.selectionLine.setAttribute('y2',top);
  this.selectionDot.setAttribute('cx',anchorX);
  this.selectionDot.setAttribute('cy',anchorY);
 }
 tick(now){
  if(!this.renderer)return;
  this.token=requestAnimationFrame(time=>this.tick(time));
  if(document.hidden)return;
  const dt=Math.min(100,now-(this.lastTime??now));
  this.onFrame(dt/1000);
  this.lastTime=now;
  this.controls.update();
  const updatedReveal=this.reveal.tick(now,dt,this.current,this.camera,this.dirty,this.reducedMotion.matches);
  if((this.dirty||updatedReveal)&&this.stage.clientHeight){
   this.renderer.render(this.scene,this.camera);
   this.updateMarker();
   this.updateSelectionLabel();
   this.dirty=false;
  }
 }
}
