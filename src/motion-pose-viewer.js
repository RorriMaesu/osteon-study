import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/addons/loaders/DRACOLoader.js';
import {MotionViewer} from './motion-viewer.js';
import {loadPoseRig,applyPose,poseJointWorld,poseMarkerWorld,poseAxisWorld} from './motion-pose-rig.js';
import {visiblePoseMarkers,dialDelta,solvePoseTarget,poseScopeMatches} from './motion-pose-ik.js';
import {placePoseLabel,placePoseGrip,poseRect,overlapsPoseRect} from './motion-pose-overlays.js';
import modelAssets from './model-assets.json' with {type:'json'};

const svgNS='http://www.w3.org/2000/svg';
const vector=value=>value?.isVector3?value.clone():new THREE.Vector3(...value);
const radians=Math.PI/180;
const baseColor=new THREE.Color('#956c60');

export class PoseViewer extends MotionViewer{
 constructor(stage,callbacks){
  super(stage,{onFrame:dt=>callbacks.frame?.(dt),onTarget:()=>{},onMuscle:key=>callbacks.selectMuscle(key),onLimb:()=>{}});
  this.callbacks=callbacks;
  this.poseScope='all';
  this.selectedJoint=null;this.selectedAxis=null;
  this.poseValues={};this.poseLocks=[];
  this.guide=document.createElementNS(svgNS,'svg');
  this.guide.classList.add('pose-rotation-guide');
  this.guide.setAttribute('aria-hidden','true');
  this.guide.innerHTML='<circle r="43"/><path/>';
  this.grip=document.createElement('button');
  this.grip.type='button';this.grip.className='pose-rotate-grip';
  this.grip.textContent='↻';this.grip.hidden=true;
  this.grip.title='Drag to adjust the selected movement';
  stage.append(this.guide,this.grip);
  this.jointLabelGuide=document.createElementNS(svgNS,'svg');
  this.jointLabelGuide.classList.add('motion-selection-guide');
  this.jointLabelGuide.setAttribute('aria-hidden','true');stage.append(this.jointLabelGuide);
  for(const event of ['pointerover','pointerout','focusin','focusout'])stage.addEventListener(event,()=>{this.dirty=true;});
  this.grip.addEventListener('pointerdown',event=>this.startPoseDrag(event,this.selectedJoint,'ring'));
  this.grip.addEventListener('keydown',event=>{
   if(!['ArrowUp','ArrowRight','ArrowDown','ArrowLeft'].includes(event.key))return;
   event.preventDefault();
   if(this.interaction==='endpoint'){
    const step=event.shiftKey?.025:.005;
    this.nudgeEndpoint(event.key==='ArrowLeft'?-step:event.key==='ArrowRight'?step:0,event.key==='ArrowUp'?step:event.key==='ArrowDown'?-step:0);
   }else callbacks.stepAngle((event.key==='ArrowUp'||event.key==='ArrowRight'?1:-1)*(event.shiftKey?5:1));
  });
  this.movePointer=event=>this.movePoseDrag(event);
  this.finishPointer=event=>this.finishPoseDrag(event,event.type!=='pointerup');
  this.cancelKey=event=>{if(event.key==='Escape'&&this.poseDrag){event.preventDefault();event.stopPropagation();this.cancelPoseDrag();}};
  this.blur=()=>this.cancelPoseDrag();
  this.visibility=()=>{if(document.hidden)this.cancelPoseDrag();};
  stage.addEventListener('lostpointercapture',event=>{
   if(this.poseDrag?.id===event.pointerId)this.finishPoseDrag(event,true);
  });
 }
 open(){
  if(this.renderer)return;
  super.open();
  window.addEventListener('pointermove',this.movePointer);
  window.addEventListener('pointerup',this.finishPointer);
  window.addEventListener('pointercancel',this.finishPointer);
  window.addEventListener('keydown',this.cancelKey,true);
  window.addEventListener('blur',this.blur);
  document.addEventListener('visibilitychange',this.visibility);
 }
 close(){
  this.cancelPoseDrag();
  window.removeEventListener('pointermove',this.movePointer);
  window.removeEventListener('pointerup',this.finishPointer);
  window.removeEventListener('pointercancel',this.finishPointer);
  window.removeEventListener('keydown',this.cancelKey,true);
  window.removeEventListener('blur',this.blur);
  document.removeEventListener('visibilitychange',this.visibility);
  super.close();
 }
 async loadBody(){
  if(this.bodyPromise)return this.bodyPromise;
  this.bodyPromise=(async()=>{
   const decoder=new DRACOLoader().setDecoderPath(new URL('vendor/draco/',document.baseURI).href).setWorkerLimit(2);
   try{
    const loader=new GLTFLoader().setDRACOLoader(decoder);
    const specimen=await loadPoseRig(loader,new URL('assets/',document.baseURI),modelAssets['motion-pose-body']);
    for(const part of specimen.parts){
     part.material||=new THREE.MeshStandardMaterial({color:baseColor,roughness:.79});
     part.mesh.material=part.material;part.walkOnly=false;part.lessonOnly=false;
     if(part.mesh.isSkinnedMesh)part.mesh.frustumCulled=false;
    }
    return specimen;
   }finally{decoder.dispose();}
  })();
  this.bodyPromise.catch(()=>{this.bodyPromise=null;});
  return this.bodyPromise;
 }
 apply(values){
  if(!this.current)return;
  this.poseValues=values;
  applyPose(this.current,values);
  this.dirty=true;
 }
 setPoseSelection(jointId,axisId,{locks=[],interaction='joint'}={}){
  this.selectedJoint=jointId;this.selectedAxis=axisId;this.poseLocks=locks;this.interaction=interaction;
  this.dirty=true;
 }
 descriptor(id=this.selectedJoint){return this.current?.meta.descriptors?.find(joint=>joint.id===id)||this.current?.descriptors?.find(joint=>joint.id===id);}
 axisDescriptor(){return this.descriptor()?.axes.find(axis=>axis.id===this.selectedAxis);}
 jointPosition(id){return vector(poseJointWorld(this.current,id));}
 axisDirection(joint,axis){return vector(poseAxisWorld(this.current,joint,axis)).normalize();}
 project(point){
  const value=point.clone().project(this.camera);
  return {x:(value.x+1)*this.stage.clientWidth/2,y:(1-value.y)*this.stage.clientHeight/2,z:value.z,visible:Math.abs(value.z)<1};
 }
 inScope(entry){return poseScopeMatches(this.poseScope,entry);}
 setScope(scope){this.poseScope=scope;this.dirty=true;}
 color({contributors=[],opposing=[],selectedMuscle=null,showMuscles=true,onlyRelated=false,visibleAnatomy}){
  if(!this.current)return;
  const up=new Set(contributors),down=new Set(opposing);
  const strengths={},antagonists=new Set();
  // Use exact component keys. Some atlas heads have different actions, so a
  // single shared group material would hide the distinction being taught.
  for(const part of this.current.parts){
   part.id=part.key;
   if(up.has(part.key))strengths[part.side+':'+part.key]=1;
   if(down.has(part.key))antagonists.add(part.side+':'+part.key);
  }
  super.highlight({strengths,antagonists,selected:selectedMuscle,showMuscles,onlyActive:onlyRelated,cue:up.size||down.size?'role':null});
  this.visibleAnatomy=visibleAnatomy;
  for(const part of this.current.parts){
   part.mesh.visible=part.mesh.visible&&(visibleAnatomy?.muscleKeys.has(part.key)??this.inScope(part));
   if(part.outline)part.outline.visible=part.outline.visible&&part.mesh.visible;
   if(this.selectedPart===part&&!part.mesh.visible)this.selectedPart=null;
  }
  for(const bone of this.current.bones||[])bone.mesh.visible=visibleAnatomy?.attachmentBones.has(bone)??this.inScope(bone);
  this.dirty=true;
 }
 bounds(scope=this.poseScope){
  const bounds=new THREE.Box3();
  this.current.model.updateMatrixWorld(true);
  const entries=[...(this.current.bones||[]),...this.current.parts];
  for(const part of entries){
   const focused=this.visibleAnatomy&&scope===this.poseScope;
   if(focused?!(part.key?this.visibleAnatomy.muscleKeys.has(part.key):this.visibleAnatomy.attachmentBones.has(part)):!poseScopeMatches(scope,part))continue;
   const mesh=part.mesh;
   if(mesh.isSkinnedMesh||mesh.morphTargetInfluences){
    if(mesh.isSkinnedMesh)mesh.computeBoundingBox();
    else mesh.geometry.computeBoundingBox();
    const box=mesh.boundingBox||mesh.geometry.boundingBox;
    if(box)bounds.union(box.clone().applyMatrix4(mesh.matrixWorld));
   }else bounds.expandByObject(mesh);
  }
  return bounds;
 }
 fitBounds(bounds,view='front'){
  if(bounds.isEmpty()||!this.controls)return;
  const center=bounds.getCenter(new THREE.Vector3());
  const direction=new THREE.Vector3(...({front:[0,.03,1],back:[0,.03,-1],side:[1,.04,0],right:[-1,.04,0],lesson:[.6,.06,1]}[view]||[0,.03,1])).normalize();
  const right=new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0),direction).normalize();
  const up=new THREE.Vector3().crossVectors(direction,right).normalize();
  const height=this.stage.clientHeight,width=this.stage.clientWidth;
  const hint=this.stage.querySelector('.pose-stage-hint'),toolbar=this.stage.querySelector('.pose-view-actions');
  const top=hint?.offsetHeight?hint.offsetTop+hint.offsetHeight+8:8;
  const bottom=toolbar?.offsetHeight?height-toolbar.offsetTop+8:8;
  const safeHeight=Math.max(30,height-top-bottom),safeCenter=(top+height-bottom)/2;
  const baseTan=Math.tan(this.camera.fov*radians/2);
  const tanY=baseTan*Math.max(.15,safeHeight/height)*.94,tanX=baseTan*this.camera.aspect*Math.max(.4,(width-36)/width)*.94;
  let distance=.1;
  for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){
   const delta=new THREE.Vector3(x,y,z).sub(center),depth=delta.dot(direction);
   distance=Math.max(distance,depth+Math.abs(delta.dot(right))/tanX,depth+Math.abs(delta.dot(up))/tanY);
  }
  const target=center.clone().addScaledVector(up,(safeCenter-height/2)*(2*distance*baseTan/height));
  this.controls.target.copy(target);
  this.camera.position.copy(target).addScaledVector(direction,distance);
  this.controls.minDistance=.035;this.controls.maxDistance=8;
  this.controls.update();this.dirty=true;
 }
 frame(view='front'){if(this.current&&this.renderer)this.fitBounds(this.bounds(),view);}
 fitCanvas(){
  const oldHeight=this.lastStageHeight;
  super.fitCanvas();
  this.lastStageHeight=this.stage.clientHeight;
  if(this.current&&oldHeight&&oldHeight!==this.lastStageHeight){
   // Refit only while the explorer changes available height. Ordinary window
   // rotation and a user's close-up keep their viewing target.
   const open=this.stage.closest('.motion-pose-workspace')?.hasAttribute('data-pose-notes-open');
   if(open||this.notesWereOpen){
    const direction=this.camera.position.clone().sub(this.controls.target).normalize();
    this.fitBounds(this.bounds(),Math.abs(direction.x)>.8?'side':direction.z<0?'back':'front');
   }
   this.notesWereOpen=open;
  }
 }
 focusJoint(view='front',radiusOverride){
  if(!this.current||!this.selectedJoint)return;
  const descriptor=this.descriptor(),position=this.jointPosition(this.selectedJoint);
  const radius=radiusOverride||descriptor.focusRadius||(/finger|thumb|index|middle|ring|little|toe|hallux/.test(descriptor.id)?.085:/jaw|blink|smile|wrist|forearm|ankle|subtalar/.test(descriptor.id)?.16:.3);
  const bounds=new THREE.Box3().setFromCenterAndSize(position,new THREE.Vector3(radius*2,radius*2,radius*2));
  this.fitBounds(bounds,view);
 }
 updateMarker(){
  this.handle.hidden=true;this.loadTag.hidden=true;
  if(!this.current||!this.renderer){this.guide.hidden=true;this.grip.hidden=true;return;}
  const descriptors=this.current.descriptors||this.current.meta.descriptors||[];
  const pixelsPerMeter=this.stage.clientHeight/(2*Math.tan(this.camera.fov*radians/2)*this.camera.position.distanceTo(this.controls.target));
  const raw=descriptors.filter(joint=>joint.id===this.selectedJoint||this.inScope(joint)).map(joint=>{
   const pos=this.project(vector(poseMarkerWorld(this.current,joint.id)));
   const fine=/finger|thumb|index|middle|ring|little|toe|hallux|blink|smile|upper-nod/.test(joint.id);
   return {...pos,id:joint.id,locked:this.poseLocks.includes(joint.id),priority:joint.markerPriority??(fine?3:1),visible:pos.visible&&(!fine||pixelsPerMeter>1350||joint.id===this.selectedJoint)};
  });
  let visible=visiblePoseMarkers(raw,{width:this.stage.clientWidth,height:this.stage.clientHeight,selectedId:this.selectedJoint});
  const selected=visible.find(marker=>marker.id===this.selectedJoint);
  const axes=this.axisDescriptor(),locked=this.poseLocks.includes(this.selectedJoint)||(axes?.requiresUnlocked||[]).some(id=>this.poseLocks.includes(id));
  const fixed=this.fixedOverlayObstacles(),endpoint=this.interaction==='endpoint';
  const grip=selected&&!locked&&axes?placePoseGrip({anchor:selected,width:this.stage.clientWidth,height:this.stage.clientHeight,obstacles:fixed,endpoint}):null;
  const show=!!grip;
  if(show)visible=visible.filter(marker=>marker.id===this.selectedJoint||!overlapsPoseRect(poseRect(marker.x,marker.y,44),poseRect(selected.x,selected.y,126),2));
  visible=visible.filter(marker=>!fixed.some(rect=>overlapsPoseRect(poseRect(marker.x,marker.y,44),rect,3)));
  this.callbacks.markers(visible.map(marker=>endpoint&&marker.id===this.selectedJoint?{...marker,visible:false}:marker));
  this.guide.style.display=show?'':'none';this.grip.hidden=!show;
  this.overlayObstacles=[...fixed,...visible.map(marker=>poseRect(marker.x,marker.y,44))];
  if(show){
   this.guide.querySelector('circle').setAttribute('r',endpoint?'25':'43');
   this.guide.querySelector('circle').setAttribute('cx',selected.x);
   this.guide.querySelector('circle').setAttribute('cy',selected.y);
   this.grip.style.left=grip.x+'px';this.grip.style.top=grip.y+'px';
   this.grip.textContent=endpoint?'✥':'↻';
   this.grip.setAttribute('aria-label',endpoint?'Move '+this.descriptor().label+' using linked joints. Drag or use arrow keys.':'Adjust '+this.descriptor().label+', '+axes.label+' with arrow keys or drag');
   this.overlayObstacles.push(poseRect(selected.x,selected.y,endpoint?56:126));
  }
  this.layoutJointLabels(visible);
 }
 fixedOverlayObstacles(){
  const stage=this.stage.getBoundingClientRect();
  return [...this.stage.querySelectorAll('.pose-stage-hint,.pose-view-actions button,.motion-status:not([hidden])')].map(element=>{
   const rect=element.getBoundingClientRect();
   return rect.width&&rect.height?{left:rect.left-stage.left,right:rect.right-stage.left,top:rect.top-stage.top,bottom:rect.bottom-stage.top}:null;
  }).filter(Boolean);
 }
 layoutJointLabels(markers){
  this.jointLabelGuide.replaceChildren();
  for(const marker of markers){
   const button=this.stage.querySelector('[data-pose-marker="'+marker.id+'"]'),label=button?.querySelector('span');
   if(!label||button.hidden)continue;
   label.style.visibility='';
   if(!label.offsetWidth||!label.offsetHeight)continue;
   const point=placePoseLabel({anchor:marker,width:this.stage.clientWidth,height:this.stage.clientHeight,labelWidth:label.offsetWidth,labelHeight:label.offsetHeight,obstacles:this.overlayObstacles});
   if(!point){label.style.visibility='hidden';continue;}
   label.style.left=(point.x-marker.x+22)+'px';label.style.top=(point.y-marker.y+22)+'px';
   label.style.bottom='auto';label.style.transform='translate(-50%,-50%)';
   this.overlayObstacles.push(poseRect(point.x,point.y,label.offsetWidth,label.offsetHeight));
   const line=document.createElementNS(svgNS,'line');
   line.setAttribute('x1',marker.x);line.setAttribute('y1',marker.y);line.setAttribute('x2',point.x);line.setAttribute('y2',point.y);this.jointLabelGuide.append(line);
  }
 }
 updateSelectionLabel(){
  super.updateSelectionLabel();
  if(!this.selectionLabel||this.selectionLabel.hidden)return;
  const anchor={x:Number(this.selectionLine.getAttribute('x1')),y:Number(this.selectionLine.getAttribute('y1'))};
  const point=placePoseLabel({anchor,width:this.stage.clientWidth,height:this.stage.clientHeight,labelWidth:this.selectionLabel.offsetWidth,labelHeight:this.selectionLabel.offsetHeight,obstacles:this.overlayObstacles||this.fixedOverlayObstacles()});
  if(!point){this.showSelectionLabel(false);return;}
  this.selectionLabel.style.left=point.x+'px';this.selectionLabel.style.top=point.y+'px';
  this.selectionLine.setAttribute('x2',point.x);this.selectionLine.setAttribute('y2',point.y);
 }
 startPoseDrag(event,jointId,kind='joint'){
  if(event.button!==0||!this.current||this.poseDrag)return;
  event.preventDefault();event.stopPropagation();
  this.callbacks.selectJoint(jointId,{pointer:true});
  if(this.poseLocks.includes(jointId)){this.callbacks.message('This joint angle is locked. Unlock it to adjust.');return;}
  const descriptor=this.descriptor(jointId),axis=this.axisDescriptor();
  if(!axis)return;
  if(this.interaction!=='endpoint'&&axis.requiresUnlocked?.some(id=>this.poseLocks.includes(id))){this.callbacks.message('Unlock the shoulder girdle to raise this arm.');return;}
  const center=this.project(vector(poseMarkerWorld(this.current,jointId)));
  const rect=this.stage.getBoundingClientRect();
  const theta=Math.atan2(event.clientY-rect.top-center.y,event.clientX-rect.left-center.x)/radians;
  const endpoint=this.interaction==='endpoint'&&this.endpointChain(jointId);
  const point=endpoint?this.jointPosition(endpoint.id):this.jointPosition(jointId);
  this.dragPlane.setFromNormalAndCoplanarPoint(this.camera.getWorldDirection(new THREE.Vector3()),point);
  this.rayAt(event);
  const hit=this.ray.ray.intersectPlane(this.dragPlane,new THREE.Vector3());
  this.poseDrag={id:event.pointerId,element:event.currentTarget||event.target,jointId,axisId:axis.id,kind:endpoint?'endpoint':kind,endpoint,center,
   startX:event.clientX,startY:event.clientY,value:this.poseValues[jointId][axis.id],theta,total:0,offset:hit?point.clone().sub(hit):new THREE.Vector3()};
  this.controls.enabled=false;
  this.callbacks.begin();
  this.poseDrag.element.setPointerCapture?.(event.pointerId);
 }
 endpointChain(id){
  const descriptor=this.descriptor(id);
  const side=descriptor?.side;
  if(!['right','left'].includes(side))return null;
  const joints=this.current.descriptors||this.current.meta.descriptors||[];
  const find=type=>joints.find(j=>j.side===side&&(j.type===type||j.id===side+'-'+type||j.id===type+'-'+side));
  const arm=/shoulder|elbow|wrist/.test(id),leg=/hip|knee|ankle/.test(id);
  if(!arm&&!leg)return null;
  const root=find(arm?'shoulder':'hip'),hinge=find(arm?'elbow':'knee'),end=find(arm?'wrist':'ankle');
  if(!root||!hinge||!end)return null;
  const chain=[root,hinge].flatMap(joint=>joint.axes.filter(axis=>(axis.id==='flexion'||axis.id==='abduction'||axis.id==='rotation')&&!axis.requiresUnlocked?.some(id=>this.poseLocks.includes(id))).map(axis=>({jointId:joint.id,axisId:axis.id,min:axis.min,max:axis.max})));
  return {id:end.id,chain};
 }
 solveEndpoint(point,endpoint){
  return solvePoseTarget({values:this.poseValues,chain:endpoint.chain,locks:this.poseLocks,target:point.toArray(),
   apply:values=>applyPose(this.current,values,{jointsOnly:true}),endpoint:()=>this.jointPosition(endpoint.id),
   axis:(joint,axis)=>({origin:this.jointPosition(joint),direction:this.axisDirection(joint,axis)})});
 }
 nudgeEndpoint(x,y){
  const endpoint=this.endpointChain(this.selectedJoint);if(!endpoint)return;
  this.cancelPoseDrag();
  const target=this.jointPosition(endpoint.id);
  target.addScaledVector(new THREE.Vector3(1,0,0).applyQuaternion(this.camera.quaternion),x);
  target.addScaledVector(new THREE.Vector3(0,1,0).applyQuaternion(this.camera.quaternion),y);
  this.callbacks.begin();
  const solved=this.solveEndpoint(target,endpoint);
  this.callbacks.patch(solved.values);this.callbacks.finish(false);
  this.callbacks.message(solved.reached?'':"Closest pose within this model’s joint limits.");
 }
 movePoseDrag(event){
  const drag=this.poseDrag;if(!drag||drag.id!==event.pointerId)return;
  if(!(event.buttons&1)&&event.pointerType!=='touch'){this.finishPoseDrag(event,true);return;}
  event.preventDefault();
  if(drag.kind==='endpoint'){
   this.rayAt(event);
   const point=this.ray.ray.intersectPlane(this.dragPlane,new THREE.Vector3());
   if(!point)return;
   const solved=this.solveEndpoint(point.add(drag.offset),drag.endpoint);
   this.callbacks.patch(solved.values);
   this.callbacks.message(solved.reached?'':"Closest pose within this model’s joint limits.");
   return;
  }
  let delta;
  if(drag.kind==='ring'){
   const rect=this.stage.getBoundingClientRect();
   const theta=Math.atan2(event.clientY-rect.top-drag.center.y,event.clientX-rect.left-drag.center.x)/radians;
   drag.total+=dialDelta(drag.theta,theta);drag.theta=theta;delta=drag.total;
  }else delta=((event.clientX-drag.startX)-(event.clientY-drag.startY))*.45;
  const axis=this.axisDescriptor();
  this.callbacks.angle(drag.value+delta*(axis?.unit==='percent'?.7:1),drag.jointId,drag.axisId);
 }
 finishPoseDrag(event,cancel=false){
  if(!this.poseDrag||event.pointerId!==this.poseDrag.id)return;
  const drag=this.poseDrag;this.poseDrag=null;
  if(drag.element.hasPointerCapture?.(drag.id))drag.element.releasePointerCapture(drag.id);
  if(this.controls)this.controls.enabled=true;
  this.callbacks.finish(cancel);
 }
 cancelPoseDrag(){if(this.poseDrag)this.finishPoseDrag({pointerId:this.poseDrag.id},true);}
}
