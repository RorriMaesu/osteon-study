
import {curlPhases} from './muscle-mechanics.js';

export const elbowLimits = [0, 115];
export const curlDuration = 4;
const degrees = 180 / Math.PI;
export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const smooth = value => value * value * (3 - 2 * value);
const travelDuration=1.6;
const loweringStart=2.4;

export const armRoles = {
 'biceps-brachii':{name:'Biceps brachii', role:'Elbow flexor. It also supinates the forearm.'},
 brachialis:{name:'Brachialis',role:'Elbow flexor across forearm positions.'},
 brachioradialis:{name:'Brachioradialis',role:'Assists elbow flexion, especially with the forearm near neutral rotation.'},
 'triceps-brachii':{name:'Triceps brachii',role:'Extends the elbow. The long head also crosses the shoulder.'},
 anconeus:{name:'Anconeus',role:'Assists elbow extension and helps stabilize the elbow.'},
};

const activity=(seconds)=>{
 const time=clamp(seconds,0,curlDuration),phase=time<travelDuration?0:time<loweringStart?1:2;
 const travel=phase===0?smooth(time/travelDuration):phase===1?1:1-smooth((time-loweringStart)/travelDuration);
 return {time,phase,travel};
};
const lessonAngle=(value,limits)=>limits[0]+(limits[1]-limits[0])*value;
export const contractionCues={
 concentric:{label:'Shortening',symbol:'→←'},
 isometric:{label:'Holding tension',symbol:'='},
 eccentric:{label:'Lengthening under tension',symbol:'←→'},
 role:{label:'Possible agonists',symbol:'◇'},
 authored:{label:'Agonists in this lesson',symbol:'●'},
 unavailable:{label:'Agonist geometry unavailable',symbol:'○'},
 emg:{label:'Recorded surface EMG',symbol:'▂▅'},
};
const bakedRange=[10,100];

export function curlFrame(seconds,limits=bakedRange){
 const {phase,travel}=activity(seconds);
 return {angle:lessonAngle(travel,limits),phase,joint:['Elbow flexion','Elbow held','Elbow extension'][phase],
  name:curlPhases[phase].name,contraction:curlPhases[phase].type,detail:curlPhases[phase].detail};
}

export function pressFrame(seconds,limits=bakedRange){
 const {phase,time,travel}=activity(seconds),contraction=curlPhases[phase].type;
 return {phase,contraction,angle:lessonAngle(1-travel,limits),clipTime:[loweringStart+time,curlDuration,time-loweringStart][phase],
  joint:['Elbow extension','Elbow held','Elbow flexion'][phase],
  name:['Press down','Hold the extension','Return under control'][phase],
  detail:[
   'The elbow extensors shorten as the hand moves down against the cable’s pull.',
   'The elbow extensors maintain tension while the hand stays in place.',
   'As the cable pulls the hand upward, the elbow flexes and the elbow extensors lengthen under tension to control the return.',
  ][phase]};
}

// Both comparisons use the extension segment of the same baked elbow clip.
export function compareElbowTime(angle,toCurl,sampleAngle){
 let start=loweringStart,end=curlDuration;
 if(angle>=sampleAngle(start))end=start;
 else if(angle<=sampleAngle(end))start=end;
 else for(let index=0;index<17;index++){
  const middle=(start+end)/2;
  if(sampleAngle(middle)>angle)start=middle;
  else end=middle;
 }
 const time=(start+end)/2;
 return toCurl?time:time-loweringStart;
}

export function heelFrame(seconds){
 const {phase,travel}=activity(seconds),contraction=curlPhases[phase].type;
 return {phase,contraction,angle:travel*23,joint:['Ankle plantarflexion','Ankles held','Ankle dorsiflexion'][phase],
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
