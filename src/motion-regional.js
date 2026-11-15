import {clamp} from './motion-core.js';

export const regionalLessons={
 blink:{asset:'motion-blink',label:'Blink & reopen',reference:'11.3',
  recall:['Which muscle closes the lids during a blink?','The palpebral part of orbicularis oculi closes the lids. Levator palpebrae superioris raises the upper lid during reopening.']},
 breath:{asset:'motion-breath',label:'Breathing',reference:'22.3',
  recall:['Does quiet expiration require the same abdominal effort as forced expiration?','Quiet expiration largely follows elastic recoil. The abdominal muscles actively assist forced expiration.']},
 jaw:{asset:'motion-jaw',label:'Open & close the jaw',reference:'11.3',
  recall:['How does the mandibular condyle move as the jaw opens?','It rotates and glides forward. The temporomandibular joint combines rotation with translation.']},
 smile:{asset:'motion-smile',label:'Smile',reference:'11.3',
  recall:['Which highlighted muscle raises the corner of the mouth?','Zygomaticus major draws the mouth corner up and laterally. Depressor anguli oris acts in the opposing direction.']},
 forearm:{asset:'motion-forearm',label:'Turn the forearm',reference:'11.5',
  recall:['Which forearm bone moves around the other during pronation?','The radius turns around the ulna. Pronator teres and pronator quadratus can produce the motion.']},
 pectoral:{asset:'motion-pectoral',label:'Reach forward',reference:'11.5',
  recall:['Which portion of pectoralis major assists this forward reach?','Its clavicular portion assists shoulder flexion. Compare it with the anterior and posterior deltoid.']},
};

export const breathingLayers={
 thorax:['diaphragm','external-intercostals'],
 front:['rectus-abdominis'],
 outer:['external-abdominal-oblique'],
 deep:['internal-intercostals','innermost-intercostals','internal-abdominal-oblique','transversus-abdominis'],
};

function morphWeight(keys,time,interpolation){
 const next=keys.findIndex(([second])=>time<second);
 if(next===0)return keys[0][1];
 if(next<0)return keys.at(-1)[1];
 const [start,from]=keys[next-1],[end,to]=keys[next];
 const linear=(time-start)/(end-start);
 const eased=interpolation==='linear'?linear:linear*linear*(3-2*linear);
 return from+(to-from)*eased;
}

export function regionalFrame(clip,time){
 const seconds=clamp(time,0,clip.duration);
 const phase=clip.phases.findLast(entry=>entry.start<=seconds)||clip.phases[0];
 const weights=Object.fromEntries(Object.entries(clip.morphTracks).map(([name,keys])=>[name,morphWeight(keys,seconds,clip.morphInterpolation)]));
 return {phase,weights};
}
