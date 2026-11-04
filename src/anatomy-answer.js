import {assessTyped,outcomeCorrect} from './typed-answer.js';

// The same authored meaning policy is used by chapter and specimen recall.
// Unsided course prompts intentionally accept either side; sided prompts must
// provide side explicitly and cannot discard an opposing direction.
export function anatomyQuestion(term,{side=null}={}){
 const forms=[term.name,...(term.aliases||[])];
 if(term.exact&&term.pattern&&!/[|*]/.test(term.pattern))forms.push(term.pattern);
 if(term.type==='count'){
  const number=forms.find(f=>/^\d+$/.test(f))||term.name.match(/^\d+/)?.[0];
  return {...term,answer:number||term.name,aliases:forms,answerPolicy:{kind:'count',suffixes:['vertebrae',term.testLabel?.replace(/ · count$/,'').toLowerCase(),term.name.replace(/^\d+\s+/,'' )].filter(Boolean)}};
 }
 const aliases=[...new Set(forms.flatMap(s=>[s,...(/ bones$/.test(s)?[s.replace(/ bones$/,' bone'),s.replace(/ bones$/,'')]:[])]))];
 const equivalents={Femora:['Thigh bone','Thighbone'],Humeri:['Upper arm bone'],Tibiae:['Shin bone','Shinbone'],Mandible:['Lower jaw','Lower jaw bone'],Clavicles:['Collarbone'],Scapulae:['Shoulder blade'],Patella:['Kneecap']};
 aliases.push(...(equivalents[term.name]||[]));
 return {...term,answer:term.answer||term.name,aliases,answerPolicy:{kind:'structure',bone:term.type==='bone',...(side?{side}:{allowAnySide:true}),...(term.answerPolicy||{})}};
}
export const assessAnatomyAnswer=(term,response,options)=>assessTyped(anatomyQuestion(term,options),response);
export const acceptsAnatomyAnswer=(term,response,options)=>outcomeCorrect(assessAnatomyAnswer(term,response,options));
