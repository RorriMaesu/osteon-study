import {fold} from './typed-answer.js';

// Deliberately limited to the nine packet targets. These are authored context
// variants of an explicitly supplied anatomical name, not substring guessing.
// Locations follow the source-backed bank explanations (OpenStax 6.3, 7.2–7.3,
// 8.1–8.4 and 9.4); the supplied packet photographs determine the nine targets.
const locations=(relations,parents)=>relations.flatMap(r=>parents.map(p=>`${r} ${p}`));
const definitions={
 'exam3-a-31':{answer:'Osteon',parents:['compact bone','cortical bone'],contexts:locations(['of','in','within'],['compact bone','cortical bone'])},
 'exam3-a-32':{answer:'Parietal bone',parents:['skull','cranium','cranial vault','skull vault'],contexts:locations(['of','in'],['skull','cranium','cranial vault','skull vault'])},
 'exam3-a-33':{answer:'Sphenoid bone',parents:['skull','cranium','skull base','base of skull','cranial base','cranial floor'],contexts:locations(['of','in','at'],['skull','cranium','skull base','base of skull','cranial base','cranial floor'])},
 'exam3-a-34':{answer:'Pedicle',parents:['vertebra','thoracic vertebra','vertebral arch','neural arch'],contexts:locations(['of','on','in'],['vertebra','thoracic vertebra','vertebral arch','neural arch'])},
 'exam3-a-35':{answer:'Glenoid cavity',parents:['scapula','shoulder blade','shoulder joint'],contexts:[...locations(['of','on'],['scapula','shoulder blade']),'in shoulder joint']},
 'exam3-a-36':{answer:'Deltoid tuberosity',parents:['humerus','humeral shaft','shaft of humerus','lateral humeral shaft'],contexts:locations(['of','on'],['humerus','humeral shaft','shaft of humerus','lateral humeral shaft'])},
 'exam3-a-37':{answer:'Acetabulum',parents:['hip bone','coxal bone','os coxae','pelvis','hip joint'],contexts:[...locations(['of','on','in'],['hip bone','coxal bone','os coxae','pelvis']),'in hip joint']},
 'exam3-a-38':{answer:'Medial malleolus',parents:['tibia','distal tibia','medial ankle'],contexts:[...locations(['of','on'],['tibia','distal tibia']),'at medial ankle']},
 'exam3-a-39':{answer:'Synovial membrane',parents:['joint capsule','articular capsule','synovial joint'],contexts:[...locations(['of','inside','within'],['joint capsule','articular capsule']),...locations(['of','in','inside'],['synovial joint']),'lining joint capsule','lining articular capsule']}
};
// Hard contradictions are limited to named bones/tissues. Broader regions and
// specific joint names can overlap; an unauthored association needs review.
const namedParents=[
 'compact bone','cortical bone','spongy bone','cancellous bone','vertebra','thoracic vertebra',
 'scapula','shoulder blade','humerus','humeral shaft','shaft of humerus','lateral humeral shaft',
 'hip bone','coxal bone','os coxae','tibia','distal tibia','fibula','distal fibula','femur','radius','ulna','sternum','sacrum',
 'frontal bone','temporal bone','occipital bone','mandible'
].sort((a,b)=>b.length-a.length);
const follows=(text,phrase)=>text===phrase||text.startsWith(phrase+' ');

export function assessMockTermContext(question,response){
 const rule=definitions[question?.id];
 if(question?.type!=='identify'||!rule||fold(question.answer)!==fold(rule.answer)||typeof response!=='string')return null;
 const input=fold(response),names=[question.answer,...question.aliases||[]].map(fold).sort((a,b)=>b.length-a.length);
 if(names.includes(input))return null;
 const name=names.find(n=>input.startsWith(n+' '));
 if(!name)return null;
 const suffix=input.slice(name.length+1);
 if(/[,;/&]|\b(?:or|and|nor|not|never|without|instead|rather|except|versus|vs|isnt|isn't|isn’t)\b/i.test(response))
  return {status:'incorrect',reason:'Give one anatomical identification without alternatives or contradictory qualifications.'};
 if(question.answerPolicy?.side&&new RegExp(`\\b${question.answerPolicy.side==='left'?'right':'left'}\\b`).test(input)||
  /\bmedial\b/.test(name)&&/\blateral\b/.test(suffix)||/\blateral\b/.test(name)&&/\bmedial\b/.test(suffix))
  return {status:'incorrect',reason:'The added context conflicts with the anatomical side or direction of the named target.'};
 if(rule.contexts.includes(suffix))return {status:'equivalent',reason:'The anatomical term and its added location identify the same target; this is equivalent wording, not a spelling error.'};
 const location=suffix.replace(/^(?:of|on|in|inside|within|at|lining) /,''),parent=namedParents.find(p=>follows(location,p));
 if(parent&&!rule.parents.includes(parent))return {status:'incorrect',reason:'The named structure is paired with a different parent bone, tissue or joint. Check the added location.'};
 return {status:'pending',reason:'You supplied an accepted anatomical name, but the additional context needs a meaning review before points are decided.'};
}

export function mockTermReviewTarget(question,response,{scoringVersion=2}={}){
 if(scoringVersion===2&&assessMockTermContext(question,response)?.status==='pending')
  return {...question,answerPolicy:{...question.answerPolicy,formalOnly:false}};
 return question;
}
