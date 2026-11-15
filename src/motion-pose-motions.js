import {poseSources} from './motion-pose-core.js';

const movementSource='https://openstax.org/books/anatomy-and-physiology-2e/pages/9-5-types-of-body-movements';
const named=(label,positive,negative,positiveHint,negativeHint,source=movementSource)=>Object.freeze({label,positive,negative,positiveHint,negativeHint,neutralLabel:'Neutral joint',source});

// Signs describe the anatomical movement, not the viewer's camera direction.
// The short verbs fit touch controls; the complete terms remain available in
// titles, accessible names, and the movement feedback.
const directions=Object.freeze({
 'scapula:elevation':named('Shrug / lower','Scapular elevation','Scapular depression','Shrug','Lower'),
 'scapula:protraction':named('Reach / draw back','Scapular protraction','Scapular retraction','Reach','Draw back'),
 'shoulder:flexion':named('Arm forward / back','Shoulder flexion','Shoulder extension','Forward','Backward'),
 'shoulder:abduction':named('Arm out / in','Shoulder abduction','Shoulder adduction','Arm out','Arm in'),
 'shoulder:rotation':named('Turn arm in / out','Shoulder internal rotation','Shoulder external rotation','Turn in','Turn out'),
 'elbow:flexion':named('Bend / straighten','Elbow flexion','Elbow extension','Bend','Straighten'),
 'forearm:pronation':named('Turn palm back / front','Forearm pronation','Forearm supination','Pronate','Supinate'),
 'wrist:flexion':named('Palm / back bend','Wrist flexion','Wrist extension','Palm bend','Back bend'),
 'wrist:deviation':named('Hand toward little finger / thumb','Wrist ulnar deviation','Wrist radial deviation','Little side','Thumb side'),
 'hip:flexion':named('Thigh forward / back','Hip flexion','Hip extension','Forward','Backward'),
 'hip:abduction':named('Leg out / in','Hip abduction','Hip adduction','Leg out','Leg in'),
 'hip:rotation':named('Turn thigh in / out','Hip internal rotation','Hip external rotation','Turn in','Turn out'),
 'knee:flexion':named('Bend / straighten','Knee flexion','Knee extension','Bend','Straighten'),
 'ankle:dorsiflexion':named('Foot up / down','Ankle dorsiflexion','Ankle plantarflexion','Foot up','Foot down'),
 'subtalar:inversion':named('Sole inward / outward','Foot inversion','Foot eversion','Sole in','Sole out'),
 'toes:extension':named('Lift / curl toes','Toe extension','Toe flexion','Lift toes','Curl toes'),
 'hallux:extension':named('Lift / curl great toe','Great-toe extension','Great-toe flexion','Lift toe','Curl toe',poseSources.lower),
 'trunk:flexion':named('Bend forward / backward','Trunk flexion','Trunk extension','Forward','Backward'),
 'trunk:lateral':named('Bend to body’s right / left','Trunk side bend to the right','Trunk side bend to the left','Bend right','Bend left'),
 'trunk:rotation':named('Turn to body’s right / left','Trunk rotation to the right','Trunk rotation to the left','Turn right','Turn left'),
 'neck:flexion':named('Look down / up','Neck flexion','Neck extension','Look down','Look up'),
 'neck:lateral':named('Tilt to body’s right / left','Neck side bend to the right','Neck side bend to the left','Tilt right','Tilt left'),
 'neck:rotation':named('Turn to body’s right / left','Neck rotation to the right','Neck rotation to the left','Turn right','Turn left'),
 'upper-nod:flexion':named('Nod down / up','Nod down at the atlas','Nod up at the atlas','Nod down','Nod up',poseSources.axial),
 'jaw:opening':named('Open / close mouth','Jaw opening','Jaw closing','Open','Close'),
 'jaw:excursion':named('Jaw toward right / left','Jaw excursion to the right','Jaw excursion to the left','Slide right','Slide left'),
 'jaw:protrusion':named('Jaw forward / return','Jaw protrusion','Jaw retraction','Slide out','Slide back',poseSources.axial),
 'thumb-cmc:flexion':named('Thumb across / out of palm','Thumb CMC flexion','Thumb CMC extension','Across palm','Out of palm'),
 'thumb-cmc:abduction':named('Thumb away from / toward palm','Thumb CMC abduction','Thumb CMC adduction','Away','Toward'),
 'face-blink:closure':named('Close / open eyes','Eyelid closing','Eyelid opening','Close eyes','Open eyes',poseSources.axial),
 'face-smile:smile':named('Smile / relax','Smile','Return from smile','Smile','Relax',poseSources.axial),
 'breathing:inhale':named('Inhale / release','Inspiration','Return from inspiration','Inhale','Release',poseSources.trunk),
 'breathing:exhale':named('Exhale / relax','Forced expiration','Return from forced expiration','Exhale','Relax',poseSources.trunk),
});

function description(joint,axisId){
 const kind=String(joint?.id||'').replace(/^(right|left)-/,'');
 if(directions[kind+':'+axisId])return directions[kind+':'+axisId];
 const digit=kind.match(/^(thumb|index|middle|ring|little)-(mcp|pip|dip|ip)$/);
 if(!digit)return null;
 const title=digit[1][0].toUpperCase()+digit[1].slice(1)+' '+digit[2].toUpperCase();
 if(axisId==='flexion')return named('Bend / straighten',title+' flexion',title+' extension','Bend','Straighten');
 if(axisId==='abduction'&&digit[2]==='mcp'&&digit[1]!=='thumb'){
  if(digit[1]==='middle')return named('Middle finger toward index / rest','Middle finger radial abduction','Middle finger return toward rest','Toward index','Toward rest');
  return named('Spread / bring together',title+' abduction',title+' adduction','Spread','Together');
 }
 return null;
}

/** Returns a fresh value so the caller cannot change shared descriptions. */
export function describePoseAxis(joint,axisId){
 const axis=joint?.axes?.find(item=>item.id===axisId);
 const entry=description(joint,axisId);
 return entry?{...entry}:{label:axis?.label||'Movement',positive:'Increase angle',negative:'Decrease angle',positiveHint:'Increase',negativeHint:'Decrease',neutralLabel:'Neutral joint',source:null};
}

/** A modest demonstration inside this model's authored range, not a ROM norm. */
export function poseMotionCycle(joint,axisId){
 const axis=joint?.axes?.find(item=>item.id===axisId),entry=description(joint,axisId);
 if(!entry||!axis||!Number.isFinite(axis.min)||!Number.isFinite(axis.max)||axis.max<=axis.min)return null;
 const neutral=Math.max(axis.min,Math.min(axis.max,axis.neutral??0));
 const fraction=axis.unit==='percent'?.75:.6;
 const from=neutral+(axis.min-neutral)*fraction,to=neutral+(axis.max-neutral)*fraction;
 return {from,to,duration:8,label:entry.label};
}

/** Named target buttons can use these same bounded teaching poses. */
export function poseMotionOptions(joint,axisId){
 const cycle=poseMotionCycle(joint,axisId);
 if(!cycle)return [];
 const text=describePoseAxis(joint,axisId);
 return [
  {id:'negative',label:text.negative,target:cycle.from,direction:-1,hint:text.negativeHint},
  {id:'positive',label:text.positive,target:cycle.to,direction:1,hint:text.positiveHint},
 ];
}
