
import {curlPhases} from './muscle-mechanics.js';

export const elbowLimits = [0, 115];
export const curlDuration = 4;
const degrees = 180 / Math.PI;
export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const smooth = value => value * value * (3 - 2 * value);

export const armRoles = {
 'biceps-brachii':{name:'Biceps brachii', role:'Elbow flexor. It also supinates the forearm.'},
 brachialis:{name:'Brachialis',role:'Elbow flexor across forearm positions.'},
 brachioradialis:{name:'Brachioradialis',role:'Assists elbow flexion, especially with the forearm near neutral rotation.'},
 'triceps-brachii':{name:'Triceps brachii',role:'Extends the elbow. The long head also crosses the shoulder.'},
 anconeus:{name:'Anconeus',role:'Assists elbow extension and helps stabilize the elbow.'},
};

export function curlFrame(seconds){
 const time=clamp(seconds,0,curlDuration);
 const phase=time<1.6?0:time<2.4?1:2;
 const angle=phase===0?115*smooth(time/1.6):phase===1?115:115-115*smooth((time-2.4)/1.6);
 return {angle,phase,name:curlPhases[phase].name,contraction:curlPhases[phase].type,detail:curlPhases[phase].detail};
}

export function pressFrame(seconds){
 const frame=curlFrame(seconds), time=clamp(seconds,0,curlDuration);
 const {phase,contraction}=frame;
 return {phase,contraction,angle:elbowLimits[1]-frame.angle,clipTime:[2.4+time,4,time-2.4][phase],
  name:['Press down','Hold the extension','Return under control'][phase],
  detail:[
   'The elbow extensors shorten as the hand moves down against the cable’s pull.',
   'The elbow extensors maintain tension while the hand stays in place.',
   'As the cable pulls the hand upward, the elbow flexes and the elbow extensors lengthen under tension to control the return.',
  ][phase]};
}

export function heelFrame(seconds){
 const frame=curlFrame(seconds);
 const {phase,contraction}=frame;
 return {phase,contraction,angle:frame.angle/elbowLimits[1]*23,
  name:['Rise onto the forefeet','Hold at the top','Lower the heels'][phase],
  detail:[
   'The calf plantar flexors shorten as the heels rise and the body moves upward.',
   'The calf plantar flexors hold the raised position as the body stays still.',
   'The calf plantar flexors lengthen under tension to control the heels as they return to the floor.',
  ][phase]};
}

export function elbowAngle(rest,target,normal,limits=elbowLimits){
 const dot=(a,b)=>a.reduce((total,value,index)=>total+value*b[index],0);
 const cross=[rest[1]*target[2]-rest[2]*target[1],rest[2]*target[0]-rest[0]*target[2],rest[0]*target[1]-rest[1]*target[0]];
 const denominator=dot(rest,target)-dot(normal,rest)*dot(normal,target);
 const numerator=dot(normal,cross);
 if(Math.hypot(denominator,numerator)<1e-10)return null;
 return clamp(Math.atan2(numerator,denominator)*degrees,...limits);
}

export function planarLimbPose(firstLength,secondLength,x,y,bendSign=1){
 const distance=clamp(Math.hypot(x,y),Math.abs(firstLength-secondLength)+1e-6,firstLength+secondLength-1e-6);
 const turn=bendSign*Math.acos(clamp((distance*distance-firstLength*firstLength-secondLength*secondLength)/(2*firstLength*secondLength),-1,1));
 const root=Math.atan2(y,x)-Math.atan2(secondLength*Math.sin(turn),firstLength+secondLength*Math.cos(turn));
 return {root:root*degrees,bend:turn*degrees};
}
