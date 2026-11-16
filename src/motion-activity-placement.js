import * as THREE from 'three';
import {applyPose} from './motion-pose-rig.js';

const rad=Math.PI/180;
const finite=value=>Number.isFinite(value)?value:0;
const vector=values=>new THREE.Vector3(...[0,1,2].map(i=>finite(values?.[i])));

/** Small, rig-attached foot probes keep authored teaching poses on the floor.
 * This is placement, not a contact-force or muscle-activation simulation. */
export function createActivityPlacement(specimen){
 const {model,nodes}=specimen;
 const rest={position:model.position.clone(),quaternion:model.quaternion.clone()};
 const probes=[];
 model.updateMatrixWorld(true);
 for(const bone of specimen.bones||[]){
  if(!/calcaneus|metatarsal|distal phalanx.*(hallux|big toe|foot)/i.test(bone.name))continue;
  const box=bone.mesh.userData.poseNeutralBounds;
  const node=nodes.get(bone.poseDrivers?.[0])?.node;
  if(!box||!node)continue;
  for(const x of [box[0],box[3]])for(const z of [box[2],box[5]]){
   probes.push({node,point:node.worldToLocal(new THREE.Vector3(x,box[1],z))});
  }
 }
 const ankles=['left-ankle','right-ankle'].map(id=>nodes.get(id)?.node).filter(Boolean);
 if(!probes.length)for(const node of ankles)probes.push({node,point:new THREE.Vector3(0,-.071,0)});
 const center=new THREE.Vector3();
 for(const node of ankles)center.add(node.getWorldPosition(new THREE.Vector3()));
 if(ankles.length)center.divideScalar(ankles.length);
 const pivot=nodes.get('pelvis')?.node.getWorldPosition(new THREE.Vector3())||new THREE.Vector3();
 return {rest,probes,ankles,center,pivot};
}

export function applyActivityPose(specimen,values,root=[],{ground='none',rootRotation=[]}={}){
 const placement=specimen.activityPlacement||=createActivityPlacement(specimen);
 const {model}=specimen,{rest,probes,ankles,center,pivot}=placement;
 model.position.copy(rest.position);model.quaternion.copy(rest.quaternion);
 model.updateMatrixWorld(true);
 applyPose(specimen,values);
 const rotation=new THREE.Quaternion().setFromEuler(new THREE.Euler(...[0,1,2].map(i=>finite(rootRotation[i])*rad),'XYZ'));
 model.quaternion.premultiply(rotation);
 model.position.sub(pivot).applyQuaternion(rotation).add(pivot);
 model.updateMatrixWorld(true);
 const shift=vector(root);
 if(ground!=='none'&&probes.length){
  let bottom=Infinity;
  const point=new THREE.Vector3();
  for(const probe of probes)bottom=Math.min(bottom,point.copy(probe.point).applyMatrix4(probe.node.matrixWorld).y);
  shift.y-=bottom;
  if(ground==='both'&&ankles.length){
   const current=new THREE.Vector3();
   for(const node of ankles)current.add(node.getWorldPosition(point));
   current.divideScalar(ankles.length);
   shift.x+=center.x-current.x;shift.z+=center.z-current.z;
  }
 }
 model.position.add(shift);
 model.updateMatrixWorld(true);
 return {position:model.position.clone()};
}
