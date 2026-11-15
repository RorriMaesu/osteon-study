
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
  this.renderer.dispose();
  this.renderer.forceContextLoss();
  this.renderer=null;
  this.drag=null;
  this.lastTime=undefined;
 }
 async load(kind){
  if(this.cache.has(kind))return this.cache.get(kind);
  const name=kind==='arm'?'motion-arm':'motion-legs';
  const version=modelAssets[name];
  if(!version)throw new Error('This motion specimen is unavailable.');
  const decoder=new DRACOLoader().setDecoderPath(new URL('vendor/draco/',document.baseURI).href).setWorkerLimit(2);
  const asset=path=>new URL('assets/'+name+path+'?v='+version,document.baseURI).href;
  const loading=(async()=>{
   try{
    const [modelFile,meta]=await Promise.all([
     new GLTFLoader().setDRACOLoader(decoder).loadAsync(asset('.glb')),
     fetch(asset('.json')).then(response=>{if(!response.ok)throw new Error('Could not read the motion rig.');return response.json();}),
    ]);
    const model=modelFile.scene;
    const attach=name=>{
     const node=model.getObjectByName(name);
     if(!node)throw new Error('A required joint is missing from the model.');
     return {node,rest:node.quaternion.clone(),position:node.position.clone()};
    };
    const joints=kind==='arm'?Object.fromEntries(Object.entries(meta.joints).map(([key,name])=>[key,attach(name)])):{
     pelvis:attach(meta.joints.pelvis),
     ...Object.fromEntries(['right','left'].map(side=>[side,Object.fromEntries(Object.entries(meta.joints[side]).map(([key,name])=>[key,attach(name)]))])),
    };
    const parts=[];
    model.traverse(mesh=>{
     if(!mesh.isMesh||!mesh.userData.motionMuscle)return;
     const material=new THREE.MeshStandardMaterial({color:muscleBase,roughness:.78});
     mesh.material=material;
     parts.push({mesh,material,id:mesh.userData.motionMuscle,side:mesh.userData.motionSide||'right'});
    });
    const clip=modelFile.animations.find(animation=>animation.name===meta.animation?.name);
    const mixer=clip?new THREE.AnimationMixer(model):null;
    const action=clip?mixer.clipAction(clip).setLoop(THREE.LoopOnce,1):null;
    if(action)action.clampWhenFinished=true;
    return {model,meta,joints,parts,kind,mixer,action};
   }finally{decoder.dispose();}
  })();
  this.cache.set(kind,loading);
  loading.catch(()=>this.cache.delete(kind));
  return loading;
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
  this.dirty=true;
 }
 highlight({strengths,selected,showMuscles,onlyActive}){
  if(!this.current)return;
  for(const p of this.current.parts){
   const key=p.side+':'+p.id, strength=strengths[key];
   const focused=selected===key;
   p.mesh.visible=showMuscles&&(!onlyActive||focused||strength>0);
   p.material.color.copy(strengths.active?muscleMuted:muscleBase);
   if(strength>0)p.material.color.lerp(muscleActive,.25+.75*clamp(strength,0,1));
   if(focused)p.material.color.copy(muscleSelected);
   p.material.emissive.copy(p.material.color).multiplyScalar(focused?.24:strength>0?.16:0);
  }
  this.dirty=true;
 }
 frame(view='lesson'){
  if(!this.current||!this.controls)return;
  const bounds=new THREE.Box3().setFromObject(this.current.model);
  if(bounds.isEmpty())return;
  const size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
  if(this.current.kind==='arm'){
   const {joints}=this.current;
   const elbow=joints.elbow.node.getWorldPosition(new THREE.Vector3());
   center.set(elbow.x-.018,elbow.y-.020,elbow.z+.164);
  }
  const diagonal=this.current.kind==='arm'?.91:Math.max(size.y,size.x)*1.12;
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
  const choice=planarLimbPose(thigh.length(),shank.length(),offset.dot(vertical),offset.dot(tangent),-1);
  this.onTarget({hip:clamp(choice.root,-22,85),knee:clamp(-choice.bend,0,120)});
 }
 endDrag(event){
  if(this.drag?.id!==event.pointerId)return;
  this.drag=null;
  if(this.controls)this.controls.enabled=true;
 }
 pick(event){
  if(!this.current||!this.pickStart||Math.hypot(event.clientX-this.pickStart.x,event.clientY-this.pickStart.y)>6)return;
  this.rayAt(event);
  const byMesh=new Map(this.current.parts.filter(part=>part.mesh.visible).map(part=>[part.mesh,part]));
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
