// A locating choice must be observable; a buried key must not be graded against
// visible distractors. Callers use name recall when this yields fewer than two.
export function observablePinChoices(picks,targetId,isVisible){if(!picks.some(p=>p.term.id===targetId&&isVisible(p.point)))return [];return picks.filter(p=>isVisible(p.point));}
export function questionMode(requested,{fitToContext=false,index,fallbackIndex}={}){return fitToContext||(index!==undefined&&index===fallbackIndex)?'identify':requested;}
export function identificationPoints(r){return r.fitToContext?[]:r.presentAllPoints?r.points:[r.points[r.singlePinIndex||0]];}
