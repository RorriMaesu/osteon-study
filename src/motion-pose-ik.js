import * as THREE from 'three';
import {walkScopeMatches} from './motion-walk-model.js';

export function poseScopeMatches(scope,entry){
 return scope==='all'||entry.region===scope||walkScopeMatches(scope,entry.region,entry.side,entry.segments||entry.walkSegments);
}

// Movements can span more than one atlas region. Keep their muscle surfaces
// and attachment landmarks in the focused view without exposing a whole
// unrelated limb. Joint markers continue to use the original region filter.
export function poseMotionScope(scope,joint,role,parts,bones,selectedMuscle){
 const contextual=joint&&scope!=='all'&&poseScopeMatches(scope,joint);
 const named=new Set(contextual?[...role.contributors,...role.opposing,...(role.shared||[])]:[]);
 if(contextual&&selectedMuscle)named.add(selectedMuscle);
 const kind=joint?.id.replace(/^(right|left)-/,'');
 const attachmentNames=kind==='neck'||kind==='upper-nod'
  ? /Vertebra T[1-4]$|Clavicle|Manubrium|Scapula/
  : kind==='shoulder'||kind==='scapula'
   ? /\brib\b|^(?:Vertebra T[1-8]$|Manubrium|Body of sternum)/i
   : kind==='hip'?/Sacrum|Coccyx|Vertebra L[1-5]$|Hip bone|Ilium|Ischium|Pubis/:null;
 const muscleKeys=new Set(parts.filter(part=>poseScopeMatches(scope,part)||named.has(part.key)).map(part=>part.key));
 const attachmentBones=new Set(bones.filter(bone=>poseScopeMatches(scope,bone)
  ||contextual&&attachmentNames?.test(bone.name)&&(!joint.side||joint.side==='midline'||bone.side==='midline'||bone.side===joint.side)));
 return {muscleKeys,attachmentBones};
}

const radians=Math.PI/180;
const copy=value=>Object.fromEntries(Object.entries(value).map(([id,angles])=>[id,{...angles}]));

/** Bounded cyclic coordinate descent. Inputs are anatomical axes, not screen axes.
 * The best reachable pose is retained when a target is outside the working range.
 * Locked joint angles are never modified, including by a coupled endpoint drag.
 */
export function solvePoseTarget({values,chain,locks=[],target,apply,endpoint,axis,iterations=24,tolerance=.0015}){
 const result=copy(values),fixed=new Set(locks),goal=new THREE.Vector3(...target);
 if(!goal.toArray().every(Number.isFinite))return {values:result,error:Infinity,reached:false};
 apply(result);
 let error=endpoint().distanceTo(goal),best=copy(result),bestError=error;
 const originalError=error;
 const groups=new Map();
 for(const control of chain){if(!groups.has(control.jointId))groups.set(control.jointId,[]);groups.get(control.jointId).push(control);}
 // Distal joints first, but preserve each joint's anatomical channel order.
 // Solving axial rotation before hip/shoulder flexion can needlessly twist an
 // almost straight limb to a rotation limit instead of moving it toward the target.
 const ordered=[...groups.values()].reverse().flat();
 const takeStep=(state,control,cap=16)=>{
  const {jointId,axisId,min,max}=control;
  if(fixed.has(jointId)||!Number.isFinite(state[jointId]?.[axisId]))return false;
  const {origin,direction}=axis(jointId,axisId);
  if(!direction||direction.lengthSq()<.5)return false;
  const current=endpoint().sub(origin).projectOnPlane(direction);
  const desired=goal.clone().sub(origin).projectOnPlane(direction);
  if(current.lengthSq()<1e-12||desired.lengthSq()<1e-12)return false;
  current.normalize();desired.normalize();
  let step=Math.atan2(direction.dot(new THREE.Vector3().crossVectors(current,desired)),current.dot(desired))/radians;
  step=Math.max(-cap,Math.min(cap,step));
  const before=state[jointId][axisId],beforeError=endpoint().distanceTo(goal);
  const next=Math.max(min,Math.min(max,before+step));
  if(Math.abs(next-before)<1e-5)return false;
  state[jointId][axisId]=next;apply(state);
  if(endpoint().distanceTo(goal)>beforeError+1e-7){state[jointId][axisId]=before+(next-before)*.5;apply(state);}
  if(endpoint().distanceTo(goal)>beforeError+1e-7){state[jointId][axisId]=before;apply(state);return false;}
  return true;
 };
 // A straight chain can align with a shorter target and then have no useful
 // single-axis step. Escape that singularity AFTER alignment with a bounded
 // hinge bend and compensating proximal motion. The law of cosines supplies
 // a seed size, not a forced final pose; only an improving candidate survives.
 let escapeAttempts=0;
 const escapeBend=()=>{
  if(escapeAttempts++>=3)return false;
  const movable=chain.filter(c=>!fixed.has(c.jointId));
  const end=movable.at(-1);
  const start=movable.find(c=>c.jointId!==end?.jointId&&/flex/.test(c.axisId))||movable.find(c=>c.jointId!==end?.jointId);
  if(!end||!start)return false;
  apply(best);
  const root=axis(start.jointId,start.axisId).origin,hinge=axis(end.jointId,end.axisId).origin,tip=endpoint();
  const upper=hinge.clone().sub(root),lower=tip.clone().sub(hinge);
  const a=upper.length(),b=lower.length();
  if(a<1e-6||b<1e-6)return false;
  const desired=Math.acos(Math.max(-1,Math.min(1,(goal.distanceToSquared(root)-a*a-b*b)/(2*a*b))))/radians;
  const current=Math.acos(Math.max(-1,Math.min(1,upper.dot(lower)/(a*b))))/radians;
  const magnitude=Math.max(4,Math.min(60,Math.abs(desired-current)));
  const reference=copy(best),beforeError=bestError;
  const proximal=movable.filter(control=>control.jointId!==end.jointId);
  for(const amount of [...new Set([Math.min(8,magnitude),magnitude])])for(const sign of [-1,1]){
   const candidate=copy(reference);
   candidate[end.jointId][end.axisId]=Math.max(end.min,Math.min(end.max,candidate[end.jointId][end.axisId]+sign*amount));
   apply(candidate);
   // A rotated limb needs a coordinated flexion/abduction correction rather
   // than a fixed half-angle compensation in the global sagittal plane.
   for(let sweep=0;sweep<3;sweep++)for(const control of proximal)takeStep(candidate,control,32);
   const candidateError=endpoint().distanceTo(goal);
   if(candidateError<bestError){bestError=candidateError;best=candidate;}
  }
  for(const id of Object.keys(best))Object.assign(result[id],best[id]);
  apply(result);
  return bestError<beforeError-1e-6;
 };
 for(let pass=0;pass<iterations&&bestError>tolerance;pass++){
  const beforePass=bestError;
  let moved=false;
  for(const control of ordered){
   if(!takeStep(result,control))continue;
   moved=true;error=endpoint().distanceTo(goal);
   if(error<bestError){bestError=error;best=copy(result);}
  }
  if(bestError>tolerance&&(!moved||pass===0||beforePass-bestError<.0002||pass===Math.floor(iterations/2)))moved=escapeBend()||moved;
  if(!moved)break;
 }
 apply(best);
 return {values:best,error:bestError,reached:bestError<=tolerance,improved:bestError<originalError-1e-6};
}

// Wrap adjacent dial samples, keeping continuous movement across the ±180 seam.
export function dialDelta(previous,current){
 if(!Number.isFinite(previous)||!Number.isFinite(current))return 0;
 return ((current-previous+540)%360)-180;
}

export function visiblePoseMarkers(markers,{width,height,selectedId,minGap=43,top=66,bottom=44}={}){
 const accepted=[];
 const ordered=[...markers].sort((a,b)=>(b.id===selectedId)-(a.id===selectedId)||(a.priority??1)-(b.priority??1));
 for(const marker of ordered){
  if(!marker.visible||marker.x<24||marker.x>width-24||marker.y<top||marker.y>height-bottom)continue;
  if(accepted.some(other=>Math.hypot(other.x-marker.x,other.y-marker.y)<minGap))continue;
  accepted.push(marker);
 }
 return accepted;
}
