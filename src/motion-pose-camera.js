import {Spherical} from 'three';

export function poseCameraMove(fromTarget,fromOffset,toTarget,toOffset){
 const from=new Spherical().setFromVector3(fromOffset);
 const to=new Spherical().setFromVector3(toOffset);
 const turn=to.theta-from.theta;
 return {fromTarget:fromTarget.clone(),toTarget:toTarget.clone(),from,to,turn:Math.atan2(Math.sin(turn),Math.cos(turn))};
}

export function samplePoseCamera(move,progress,target,position){
 const time=Math.max(0,Math.min(1,progress));
 const blend=time*time*(3-2*time);
 const {fromTarget,toTarget,from,to,turn}=move;
 target.lerpVectors(fromTarget,toTarget,blend);
 // Interpolate around the target. A straight line between opposing views
 // would take the camera through the anatomy.
 position.setFromSphericalCoords(from.radius+(to.radius-from.radius)*blend,
  from.phi+(to.phi-from.phi)*blend,from.theta+turn*blend).add(target);
}
