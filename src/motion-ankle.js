import {clamp} from './motion-core.js';

const angleLimits={plantar:35,dorsi:23};

export function ankleMorphBinding(mesh){
 const data=mesh.userData||{};
 const side=data.motionSide;
 if(side!=='left'&&side!=='right')return null;
 const {morphTargetDictionary:slots,morphTargetInfluences:weights}=mesh;
 const plantar=slots?.[data.motionAnklePlantar];
 const dorsi=slots?.[data.motionAnkleDorsi];
 if(!Number.isInteger(plantar)||!Number.isInteger(dorsi)||!weights||
    plantar===dorsi||plantar<0||dorsi<0||Math.max(plantar,dorsi)>=weights.length)return null;
 return {side,weights,plantar,dorsi};
}

export function poseAnkleMorphs(bindings=[],angle=0){
 const signedAngle=Number.isFinite(angle)?angle:0;
 const plantar=clamp(-signedAngle/angleLimits.plantar,0,1);
 const dorsi=clamp(signedAngle/angleLimits.dorsi,0,1);
 for(const binding of bindings){
  binding.weights[binding.plantar]=plantar;
  binding.weights[binding.dorsi]=dorsi;
 }
}
