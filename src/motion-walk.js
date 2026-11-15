
import {clamp} from './motion-core.js';

const channelById={
 'tibialis-anterior':'tibialisAnterior',
 'gastrocnemius-lateral':'lateralGastrocnemius',
 'biceps-femoris':'bicepsFemoris',
 'vastus-lateralis':'vastusLateralis',
};
export const gaitChannel=(sample,side,id)=>sample?.[side]?.emg?.[channelById[id]]??null;
export const gaitEventName=event=>event.phase==='toe-off'?'Toe-off':'Initial contact';

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
