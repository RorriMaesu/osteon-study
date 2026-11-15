import * as THREE from 'three';
import {ankleMorphBinding,poseAnkleMorphs} from './motion-ankle.js';

const RAD=Math.PI/180;
const clamp=(value,low,high)=>Math.max(low,Math.min(high,value));
const valueAt=(values,joint,axis)=>{
 const value=Number(values?.[joint.id]?.[axis.id]);
 return clamp(Number.isFinite(value)?value:axis.neutral||0,axis.min,axis.max);
};
const distributedShare=(joint,axisId,index)=>joint.axisWeights?.[axisId]?.[index]??1/joint.distribute.length;
function shoulderGirdleAngle(joint,angle){
 const [low,high]=joint.scapularShare||[1/3,1/3];
 return angle*(low+(high-low)*clamp(angle/90,0,1));
}
const scapularElevation=['abduction','scaption'];
const elevationAmount=angles=>Math.max(angles.abduction||0,angles.scaption||0,angles.flexion||0);
const horizontalAmount=(angle,angles)=>angle*clamp((elevationAmount(angles)-25)/20,0,1);
function referenceAxis(nodes,axis){
 const reference=nodes.get(axis.relativeTo);
 const orientation=reference.node.getWorldQuaternion(new THREE.Quaternion()).multiply(reference.restWorld.clone().invert());
 return new THREE.Vector3(...axis.vector).normalize().applyQuaternion(orientation);
}
function compensatePelvis(nodes,angles){
 const pelvis=nodes.get('pelvis');
 const undo=pelvis.node.quaternion.clone().invert().multiply(pelvis.rest);
 for(const id of ['lumbar-5','right-hip','left-hip'])nodes.get(id).node.quaternion.premultiply(undo);
 if(angles.obliquity){
  const hip=nodes.get('right-hip').position;
  const before=hip.clone().applyQuaternion(pelvis.rest);
  const after=hip.clone().applyQuaternion(pelvis.node.quaternion);
  pelvis.node.position.add(before.sub(after));
 }
}

/** Load the additive rig. Existing atlas and walking specimens stay untouched. */
export async function loadPoseRig(loader,baseURL,version='1'){
 const metadataURL=new URL('motion-pose-body.json',baseURL);
 metadataURL.searchParams.set('v',version);
 const response=await fetch(metadataURL);
 if(!response.ok)throw new Error('Could not load the whole-body pose inventory.');
 const meta=await response.json();
 const assetURL=new URL(meta.asset,baseURL);
 assetURL.searchParams.set('v',meta.sha256.slice(0,12));
 const {scene:model}=await loader.loadAsync(assetURL.href);
 return preparePoseRig(model,meta);
}

/** Kept separate from loading so joint mathematics can be tested without WebGL. */
export function preparePoseRig(model,meta){
 model.updateMatrixWorld(true);
 const nodes=new Map();
 for(const descriptor of meta.nodes){
  const node=model.getObjectByName(descriptor.name);
  if(!node)throw new Error('Missing pose articulation: '+descriptor.id);
  nodes.set(descriptor.id,{
   node,descriptor,rest:node.quaternion.clone(),position:node.position.clone(),
   restWorld:node.getWorldQuaternion(new THREE.Quaternion()),
  });
 }
 const descriptors=meta.joints;
 const jointsById=new Map();
 for(const descriptor of descriptors){
  const source=nodes.get(descriptor.id);
  if(!source)throw new Error('The pose descriptor has no matching joint: '+descriptor.id);
  const pivotState=descriptor.distribute?nodes.get(descriptor.distribute[0]):source;
  const markerState=descriptor.distribute?nodes.get(descriptor.distribute.at(-1)):source;
  const marker=descriptor.marker?markerState.node.worldToLocal(new THREE.Vector3(...descriptor.marker)):new THREE.Vector3();
  const axes=descriptor.axes.map(axis=>({
   ...axis,
   local:axis.vector?new THREE.Vector3(...axis.vector).normalize().applyQuaternion(source.restWorld.clone().invert()):null,
  }));
  jointsById.set(descriptor.id,{...source,descriptor,axes,marker,pivotState,markerState});
 }
 const parts=[],bones=[],morphables=[],ankleMorphs={right:[],left:[]};
 model.traverse(mesh=>{
  if(!mesh.isMesh)return;
  if(mesh.isSkinnedMesh){mesh.frustumCulled=false;mesh.normalizeSkinWeights();}
  const data=mesh.userData;
  if(data.poseMuscle){
   const material=new THREE.MeshStandardMaterial({color:'#9d7261',roughness:.78});
   mesh.material=material;
   parts.push({mesh,material,key:data.muscleId,id:data.poseMuscle,muscleName:data.poseMuscle,
    side:data.poseSide||'midline',name:data.poseName||mesh.name,region:data.poseRegion,
    walkSegments:data.walkSegments,deformation:data.poseDeformation,contextOnly:false,
    poseDrivers:data.poseDrivers||[],poseOnly:true});
  }else if(data.poseBone){
   const material=new THREE.MeshStandardMaterial({color:data.poseSupport?'#d8bd92':'#d6ddd0',roughness:.79});
   mesh.material=material;
   bones.push({mesh,material,name:data.poseBone,region:data.poseRegion,side:data.poseSide||'midline',poseDrivers:data.poseDrivers||[]});
  }
  const targets=Object.entries(mesh.morphTargetDictionary||{});
  if(targets.length)morphables.push({mesh,targets});
  const ankle=ankleMorphBinding(mesh);
  if(ankle)ankleMorphs[ankle.side].push(ankle);
 });
 if(new Set(parts.map(p=>p.key)).size!==meta.totalMuscleSurfaces||parts.length!==meta.totalMuscleSurfaces)
  throw new Error('The whole-body pose muscle inventory did not load completely.');
 const specimen={model,meta,descriptors,nodes,jointsById,parts,bones,morphables,ankleMorphs,kind:'pose',values:{}};
 applyPose(specimen,{});
 return specimen;
}

function localAxis(state,vector){
 return new THREE.Vector3(...vector).normalize().applyQuaternion(state.restWorld.clone().invert());
}

function rotateBy(state,vector,degrees){
 if(!degrees||!vector)return;
 state.node.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(localAxis(state,vector),degrees*RAD));
}

function applyForearmClearance(state,angle){
 const guide=state.descriptor.forearmClearance;
 if(!guide||angle<=12)return;
 const pivot=new THREE.Vector3(...state.descriptor.marker);
 const inverse=state.restWorld.clone().invert();
 const center=new THREE.Vector3(...state.descriptor.axes[0].vector).normalize();
 const jointRest=state.pivotState.descriptor.pivot;
 pivot.set(...jointRest);
 const offset=new THREE.Vector3(...guide.distalRadius).sub(pivot).applyQuaternion(inverse);
 const ulna=new THREE.Vector3(...guide.distalUlna).sub(pivot).applyQuaternion(inverse);
 const rotation=state.rest.clone().invert().multiply(state.node.quaternion);
 const moved=offset.applyQuaternion(rotation);
 const normal=center.applyQuaternion(inverse);
 const outward=moved.clone().sub(ulna).projectOnPlane(normal).normalize();
 const t=clamp((angle-12)/(38-12),0,1);
 const clearance=.001*guide.millimeters*t*t*(3-2*t);
 const target=moved.clone().addScaledVector(outward,clearance);
 const tilt=new THREE.Quaternion().setFromUnitVectors(moved.clone().normalize(),target.normalize());
 state.node.quaternion.copy(state.rest).multiply(tilt).multiply(rotation);
}

/** Joint and shape updates only. No vertices are visited on the CPU. */
export function applyPose(specimen,values={},options={}){
 const {nodes,jointsById,descriptors}=specimen;
 for(const state of nodes.values()){
  state.node.quaternion.copy(state.rest);
  state.node.position.copy(state.position);
 }
 const shaped={},applied={};
 for(const joint of descriptors){
  const state=jointsById.get(joint.id);
  applied[joint.id]={};
  for(const axis of state.axes){
   let angle=valueAt(values,joint,axis);
   // Exhalation and inhalation are different shapes of the same thorax.
   if(joint.id==='breathing'&&axis.id==='inhale'&&Number(values.breathing?.exhale)>0)angle=0;
   applied[joint.id][axis.id]=angle;
   const shapes=joint.morphs?.[axis.id];
   if(shapes)for(const [name,scale] of Object.entries(shapes))shaped[name]=angle*scale;
   if(axis.rotations)for(const [vector,degrees] of axis.rotations)rotateBy(state,vector,degrees*angle/axis.max);
   if(!axis.vector)continue;
   if(axis.relativeTo){
    angle=horizontalAmount(angle,applied[joint.id]);
    if(angle){
     const inParent=referenceAxis(nodes,axis).applyQuaternion(state.node.parent.getWorldQuaternion(new THREE.Quaternion()).invert());
     state.node.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(inParent,angle*RAD));
    }
    continue;
   }
   if(joint.distribute){
    joint.distribute.forEach((id,index)=>rotateBy(nodes.get(id),axis.vector,angle*distributedShare(joint,axis.id,index)));
   }else{
    // The shoulder blade contributes gradually more during elevation.
    if(joint.id.endsWith('-shoulder')&&scapularElevation.includes(axis.id)){
     const scapula=nodes.get(joint.side+'-scapula');
     const girdle=shoulderGirdleAngle(joint,angle);
     rotateBy(scapula,axis.vector,girdle);
     angle-=girdle;
    }
    rotateBy(state,axis.vector,angle);
   }
  }
  if(joint.id==='pelvic-control'&&(applied[joint.id].tilt||applied[joint.id].obliquity))compensatePelvis(nodes,applied[joint.id]);
  if(joint.unlockedRotation){
   const rule=joint.unlockedRotation;
   const t=clamp(applied[joint.id].flexion/rule.endsAt,0,1);
   rotateBy(state,rule.axis,rule.degrees*t*t*(3-2*t));
  }
  if(joint.id==='jaw'&&joint.translation){
   const {opening=0,excursion=0,protrusion=0}=applied.jaw;
   const openMax=state.axes.find(axis=>axis.id==='opening').max;
   const shift=new THREE.Vector3(...joint.translation).multiplyScalar(opening/openMax);
   if(joint.condyleHalfWidth){
    const oppositeGlide=joint.condyleHalfWidth*Math.sin(Math.abs(excursion)*RAD);
    shift.z+=oppositeGlide+protrusion*.00005;
    shift.y-=oppositeGlide*.22+protrusion*.000018;
   }
   state.node.position.add(shift.applyQuaternion(state.restWorld.clone().invert()));
  }
  if(joint.forearmClearance)applyForearmClearance(state,applied[joint.id].pronation||0);
 }
 for(const side of ['left','right']){
  const patella=nodes.get(side+'-patella');
  if(patella)rotateBy(patella,[1,0,0],(applied[side+'-knee']?.flexion||0)*.55);
  // Preserve the signed calf/Achilles shape already checked in the source rig.
  const angle=applied[side+'-ankle']?.dorsiflexion||0;
  poseAnkleMorphs(specimen.ankleMorphs[side],angle);
 }
 if(!options.jointsOnly)for(const {mesh,targets} of specimen.morphables){
  for(const [name,index] of targets){
   if(name in shaped)mesh.morphTargetInfluences[index]=clamp(shaped[name],0,1);
   else if(!name.startsWith('Ankle'))mesh.morphTargetInfluences[index]=0;
  }
 }
 specimen.values=applied;
 specimen.model.updateMatrixWorld(true);
 return applied;
}

export function poseJointWorld(specimen,id){
 const state=specimen.jointsById.get(id);
 if(!state)return null;
 return state.pivotState.node.getWorldPosition(new THREE.Vector3());
}

export function poseMarkerWorld(specimen,id){
 const state=specimen.jointsById.get(id);
 if(!state)return null;
 return state.markerState.node.localToWorld(state.marker.clone());
}

/** A current Euler axis includes preceding channels, never subsequent ones. */
export function poseAxisWorld(specimen,id,axisId){
 const state=specimen.jointsById.get(id);
 if(!state)return null;
 const wanted=state.axes.findIndex(axis=>axis.id===axisId);
 if(wanted<0||!state.axes[wanted].local)return null;
 if(state.axes[wanted].relativeTo)return referenceAxis(specimen.nodes,state.axes[wanted]);
 const origin=state.pivotState;
 const rotation=origin.node.parent.getWorldQuaternion(new THREE.Quaternion()).multiply(origin.rest);
 for(const axis of state.axes.slice(0,wanted)){
  if(!axis.local)continue;
  let angle=specimen.values[id]?.[axis.id]||0;
  if(axis.relativeTo){
   angle=horizontalAmount(angle,specimen.values[id]);
   rotation.premultiply(new THREE.Quaternion().setFromAxisAngle(referenceAxis(specimen.nodes,axis),angle*RAD));
   continue;
  }
  if(state.descriptor.distribute)angle*=distributedShare(state.descriptor,axis.id,0);
  if(id.endsWith('-shoulder')&&scapularElevation.includes(axis.id))angle-=shoulderGirdleAngle(state.descriptor,angle);
  rotation.multiply(new THREE.Quaternion().setFromAxisAngle(axis.local,angle*RAD));
 }
 return state.axes[wanted].local.clone().applyQuaternion(rotation).normalize();
}

export const poseEndpointWorld=poseJointWorld;
