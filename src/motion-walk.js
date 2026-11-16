
import {clamp} from './motion-core.js';

const channelById={
 'tibialis-anterior':'tibialisAnterior',
 'gastrocnemius-lateral':'lateralGastrocnemius',
 'biceps-femoris':'bicepsFemoris',
 'vastus-lateralis':'vastusLateralis',
};
export const gaitChannel=(sample,side,id)=>sample?.[side]?.emg?.[channelById[id]]??null;
export const gaitEventName=event=>event.phase==='toe-off'?'Toe-off':'Initial contact';

const ankleLift=[
 ['tibialis-anterior-muscle','Helps lift the forefoot.'],
 ['extensor-digitorum-longus','Can assist ankle dorsiflexion and toe clearance.'],
 ['extensor-hallucis-longus','Can assist ankle dorsiflexion and lift the great toe.'],
];
const hipAdvance=[
 ['iliacus-muscle','Helps advance the thigh.'],
 ['psoas-major','Helps advance the thigh.'],
];
const hipSupport=[['gluteus-medius-muscle','Helps support the pelvis on the stance leg.']];
const kneeSupport=[
 ['vastus-lateralis-muscle','Can support the knee as body weight is accepted.'],
 ['vastus-medialis-muscle','Can support the knee as body weight is accepted.'],
 ['vastus-intermedius-muscle','Can support the knee as body weight is accepted.'],
];
const pushOff=[
 ['soleus-muscle','Contributes to support and propulsion late in stance.'],
 ['medial-head-of-gastrocnemius','Can assist late-stance support and push-off.'],
 ['lateral-head-of-gastrocnemius','Can assist late-stance support and push-off.'],
];
const brakeThigh=[
 ['long-head-of-biceps-femoris','Can help decelerate the leg before contact.'],
 ['semimembranosus-muscle','Can help decelerate the leg before contact.'],
 ['semitendinosus-muscle','Can help decelerate the leg before contact.'],
];

// These are teaching examples drawn from gait research, not trial-specific
// measurements. Broad windows are anchored to the recording's contact events.
// Liu et al. (2008) https://pubmed.ncbi.nlm.nih.gov/18822415/
// Neptune et al. (2009) https://pubmed.ncbi.nlm.nih.gov/19394023/
// Fox and Delp (2010) https://pmc.ncbi.nlm.nih.gov/articles/PMC2866832/
const teachingPhases={
 loading:{label:'Accept weight',roles:[['gluteus-maximus-muscle','Helps support the hip as weight transfers.'],...kneeSupport,...hipSupport,...ankleLift]},
 support:{label:'Support on one leg',roles:[...hipSupport,['soleus-muscle','Helps support the body as the shin moves over the foot.']]},
 propulsion:{label:'Late stance',roles:[...hipSupport,...pushOff]},
 transfer:{label:'Prepare to lift the foot',roles:[...pushOff,...hipAdvance,['short-head-of-biceps-femoris','Can help begin knee flexion before toe-off.']]},
 advance:{label:'Clear and advance the leg',roles:[...hipAdvance,...ankleLift]},
 clearance:{label:'Clear the foot',roles:ankleLift},
 landing:{label:'Prepare for contact',roles:[...ankleLift,...brakeThigh]},
};

const componentKey=(name,side)=>'muscle-'+name+'-'+side[0];
export const walkTeachingComponentKeys=new Set(Object.values(teachingPhases)
 .flatMap(phase=>phase.roles.flatMap(([name])=>['left','right'].map(side=>componentKey(name,side)))));

const cycleElapsed=(time,event,duration)=>{
 const elapsed=(time-event+duration)%duration;
 return elapsed>duration-1e-8?0:elapsed;
};

function teachingPhaseForSide(data,frame,side){
 const {durationSeconds:duration,events}=data;
 const time=frame.percent*duration/100;
 const strike=events.find(event=>event.side===side&&event.phase==='initial-contact'&&event.timeSeconds<duration)?.timeSeconds;
 const toeOff=events.find(event=>event.side===side&&event.phase==='toe-off')?.timeSeconds;
 if(!Number.isFinite(strike)||!Number.isFinite(toeOff)||!frame[side])return null;
 const stanceDuration=cycleElapsed(toeOff,strike,duration);
 if(!stanceDuration)return null;
 if(frame[side].contact){
  const portion=cycleElapsed(time,strike,duration)/stanceDuration;
  if(portion<.33)return 'loading';
  if(portion<.65)return 'support';
  return frame[side==='left'?'right':'left']?.contact?'transfer':'propulsion';
 }
 const portion=cycleElapsed(time,toeOff,duration)/(duration-stanceDuration);
 return portion<.38?'advance':portion<.72?'clearance':'landing';
}

/** Qualitative roles keyed by exact atlas component and anatomical side. */
export function walkTeachingRoles(data,frame){
 const byKey=new Map(),phases={};
 for(const side of ['left','right']){
  const id=teachingPhaseForSide(data,frame,side);
  const phase=teachingPhases[id];
  if(!phase)continue;
  phases[side]=phase.label;
  for(const [name,detail] of phase.roles)byKey.set(componentKey(name,side),detail);
 }
 return {phases,byKey,signature:['left','right'].map(side=>phases[side]||'').join('|')};
}

function interpolate(a,b,fraction){
 return Number.isFinite(a)&&Number.isFinite(b)?a+(b-a)*fraction:null;
}

export function sampleWalk(data,time){
 const seconds=clamp(time,0,data.durationSeconds);
 const percent=seconds/data.durationSeconds*100;
 const upper=data.samples.findIndex(sample=>sample.percent>=percent);
 const first=data.samples[Math.max(0,upper<0?data.samples.length-1:upper-1)];
 const next=data.samples[upper<0?data.samples.length-1:upper];
 const fraction=next===first?0:(percent-first.percent)/(next.percent-first.percent);
 const read=(a,b,keys)=>Object.fromEntries(keys.map(key=>[key,interpolate(a[key],b[key],fraction)]));
 const current={percent,pelvis:read(first.pelvis,next.pelvis,Object.keys(first.pelvis))};
 for(const side of ['left','right']){
  const events=data.events.filter(event=>event.side===side&&event.timeSeconds<=seconds+1e-8);
  const contact=events.length?events.at(-1).phase==='initial-contact':data.samples[0][side].contact;
  current[side]={
   ...read(first[side],next[side],['hip','knee','ankle']),
   emg:Object.fromEntries(Object.entries(channelById).map(([id,channel])=>[id,interpolate(first[side].emg[channel],next[side].emg[channel],fraction)])),
   contact,
  };
 }
 return current;
}
