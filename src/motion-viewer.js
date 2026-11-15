
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/addons/loaders/DRACOLoader.js';
import {elbowAngle,planarLimbPose,clamp} from './motion-core.js';
import modelAssets from './model-assets.json' with {type:'json'};

const radians = Math.PI / 180;
const axis = values => new THREE.Vector3(...values).normalize();
const muscleBase = new THREE.Color('#9d7261');
const muscleMuted = new THREE.Color('#604f4e');
const muscleActive = new THREE.Color('#eb8d57');
const muscleSelected = new THREE.Color('#9fe6ca');

function jointState(node){
 if(!node)throw new Error('A required joint is missing from the model.');
 return {node,rest:node.quaternion.clone(),position:node.position.clone()};
}
function musclePart(mesh){
 const material=new THREE.MeshStandardMaterial({color:muscleBase,roughness:.78});
 mesh.material=material;
 return {mesh,material,id:mesh.userData.motionMuscle,side:mesh.userData.motionSide||'right'};
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
 constructor(stage,{onFrame,onTarget,onMuscle}){
  this.stage=stage;
  this.onFrame=onFrame;
  this.onTarget=onTarget;
  this.onMuscle=onMuscle;
  this.handle=stage.querySelector('.motion-handle');
  this.loadTag=stage.querySelector('.motion-load-tag');
  this.cache=new Map();
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
 }
 async load(kind){
  if(this.cache.has(kind))return this.cache.get(kind);
  const name=kind==='arm'?'motion-arm':'motion-legs';
  const loading=(async()=>{
    const [modelFile,meta]=await readRig(name);
    const model=modelFile.scene;
    const attach=name=>jointState(model.getObjectByName(name));
    const joints=kind==='arm'?Object.fromEntries(Object.entries(meta.joints).map(([key,name])=>[key,attach(name)])):{
     pelvis:attach(meta.joints.pelvis),
     ...Object.fromEntries(['right','left'].map(side=>[side,Object.fromEntries(Object.entries(meta.joints[side]).map(([key,name])=>[key,attach(name)]))])),
    };
    const parts=[];
    model.traverse(mesh=>{
     if(!mesh.isMesh)return;
     if(mesh.isSkinnedMesh)mesh.frustumCulled=false;
     if(!mesh.userData.motionMuscle)return;
     parts.push(musclePart(mesh));
    });
    const clip=modelFile.animations.find(animation=>animation.name===meta.animation?.name);
    const mixer=clip?new THREE.AnimationMixer(model):null;
    const action=clip?mixer.clipAction(clip).setLoop(THREE.LoopOnce,1):null;
    if(action)action.clampWhenFinished=true;
    const contacts=kind==='legs'?Object.fromEntries(Object.entries(meta.contact).map(([side,points])=>[side,Object.values(points).map(point=>({node:model.getObjectByName(point.node),offset:new THREE.Vector3(...point.local)}))])):null;
    return {model,meta,joints,parts,kind,mixer,action,contacts};
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
 async addCalves(specimen){
  if(specimen.calves)return;
  const [file,meta]=await readRig('motion-leg-actions');
  if(specimen.calves)return;
  const skeleton=specimen.parts[0].mesh.skeleton;
  if(!meta.skinCompatible||!skeleton||skeleton.bones.some((bone,index)=>bone.name!==meta.jointOrder[index]))throw new Error('The calf muscles could not be matched to the leg rig.');
  const calves=[];
  file.scene.traverse(mesh=>{if(mesh.isSkinnedMesh&&mesh.userData.motionMuscle)calves.push(mesh);});
  for(const mesh of calves){
   const bind=mesh.bindMatrix.clone();
   specimen.model.add(mesh);
   mesh.bind(skeleton,bind);
   mesh.frustumCulled=false;
   const part=musclePart(mesh);
   part.lessonOnly=true;
   specimen.parts.push(part);
  }
  specimen.calves=true;
 }
 use(specimen){
  if(this.current!==specimen){
   this.current?.model.removeFromParent();
   this.current=specimen;
   this.scene?.add(specimen.model);
  }
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
  action?.stop();
  const listed=kind==='arm'?Object.values(joints):[joints.pelvis,...Object.values(joints.left),...Object.values(joints.right)];
  for(const joint of listed){joint.node.quaternion.copy(joint.rest);joint.node.position.copy(joint.position);}
  this.dirty=true;
 }
 sampleCurl(seconds,angle){
  const {mixer,action}=this.current;
  if(!mixer){this.poseArm(angle);return;}
  action.reset().play();
  mixer.setTime(seconds);
  this.dirty=true;
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
  const {joints,contacts,model,meta}=this.current;
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
  if(this.grid){this.grid.position.z=-distance*clock%.1;this.grid.position.y=0;}
  this.dirty=true;
 }
 highlight({strengths,selected,showMuscles,onlyActive,showCalves=false}){
  if(!this.current)return;
  for(const p of this.current.parts){
   const key=p.side+':'+p.id, strength=strengths[key];
   const focused=selected===key;
   p.mesh.visible=showMuscles&&(!p.lessonOnly||showCalves)&&(!onlyActive||focused||strength>0);
   p.material.color.copy(strengths.active?muscleMuted:muscleBase);
   if(strength>0)p.material.color.lerp(muscleActive,.25+.75*clamp(strength,0,1));
   if(focused)p.material.color.copy(muscleSelected);
   p.material.emissive.copy(p.material.color).multiplyScalar(focused ? .24 : strength>0 ? .16 : 0);
  }
  this.dirty=true;
 }
 frame(view='lesson'){
  if(!this.current||!this.controls)return;
  const bounds=new THREE.Box3().setFromObject(this.current.model,true);
  if(bounds.isEmpty())return;
  const size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
  if(this.current.kind==='arm'){
   const {joints}=this.current;
   const elbow=joints.elbow.node.getWorldPosition(new THREE.Vector3());
   center.set(elbow.x-.018,elbow.y-.020,elbow.z+.164);
  }
  if(this.current.kind==='legs'&&!this.current.upper?.root.visible){
   size.y=.94;center.y=.46;
  }
  const diagonal=this.current.kind==='arm'?.91:Math.max(size.y,size.x)*1.15;
  const direction=({
   lesson:this.current.kind==='arm'?[-1,.11,.24]:[1,.13,1.25],
   front:[0,.08,1],side:this.current.kind==='arm'?[-1,.05,0]:[1,.05,0],
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
  const byMesh=new Map(this.current.parts.filter(part=>part.mesh.visible).map(part=>[part.mesh,part]));
  for(const mesh of byMesh.keys())if(mesh.isSkinnedMesh)mesh.computeBoundingSphere();
  const hit=this.ray.intersectObjects([...byMesh.keys()],false)[0];
  if(hit){const p=byMesh.get(hit.object);this.onMuscle(p.side+':'+p.id);}
 }
 tick(now){
  if(!this.renderer)return;
  this.token=requestAnimationFrame(time=>this.tick(time));
  if(document.hidden)return;
  this.onFrame(Math.min(.1,(now-(this.lastTime??now))/1000));
  this.lastTime=now;
  this.controls.update();
  if(this.dirty&&this.stage.clientHeight){
   this.renderer.render(this.scene,this.camera);
   this.updateMarker();
   this.dirty=false;
  }
 }
}
