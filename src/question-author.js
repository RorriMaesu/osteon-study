import {chapterOf} from './chapters.js';
// Authoring helpers only: prompts, keys, distractors and rationales are explicit.
export function author(){
 const items=[],counts={};
 const add=(lesson,objective,type,prompt,answer,explanation,extra={})=>{const n=counts[lesson]=(counts[lesson]||0)+1;items.push({id:`ex-${lesson}-${n}`,lesson,topic:`Chapter ${chapterOf(lesson)}`,objectives:(Array.isArray(objective)?objective:[objective]).map(o=>`${lesson}.${o}`),type,prompt,answer,explanation,source:`OpenStax A&P 2e §${lesson}`, ...extra});};
 return {items,
 m:(l,o,p,a,d,r)=>add(l,o,'choice',p,a,r,{distractors:d}),
 t:(l,o,p,a,aliases,r)=>add(l,o,'text',p,a,r,{aliases}),
 f:(l,o,figure,target,p,a,aliases,r)=>add(l,o,'identify',p,a,r,{figure,target,aliases}),
 s:(l,o,p,steps,r)=>add(l,o,'order',p,steps.join(' → '),r,{steps}),
 x:(l,o,p,pairs,r)=>add(l,o,'match',p,pairs.map(([a,b])=>a+': '+b).join('; '),r,{pairs:pairs.map(([left,right])=>({left,right}))})
 };
}
