// Reviewed parallel items keep independent IDs and do not change earlier keys.
export function transferAuthor(){
 const items=[],counts={};
 const add=(lesson,objective,type,prompt,answer,explanation,extra={})=>{const n=counts[lesson]=(counts[lesson]||0)+1;items.push({id:`transfer-${lesson}-${n}`,lesson,topic:'Chapter '+lesson[0],objectives:(Array.isArray(objective)?objective:[objective]).map(n=>lesson+'.'+n),type,prompt,answer,explanation,source:'OpenStax A&P 2e §'+lesson,skill:type==='identify'?'identify':type==='order'?'sequence':'apply',...extra});};
 return {items,
 m:(l,o,p,a,d,r)=>add(l,o,'choice',p,a,r,{distractors:d}),
 t:(l,o,p,a,aliases,r,answerPolicy={kind:'structure'})=>add(l,o,'text',p,a,r,{aliases,answerPolicy,skill:'recall'}),
 f:(l,o,plate,target,p,a,aliases,r)=>add(l,o,'identify',p,a,r,{figure:plate.startsWith('schematic:')?plate:'source:'+plate,target,aliases,answerPolicy:{kind:'structure'}}),
 s:(l,o,p,steps,r)=>add(l,o,'order',p,steps.join(' → '),r,{steps}),
 x:(l,o,p,pairs,r)=>add(l,o,'match',p,pairs.map(([a,b])=>a+': '+b).join('; '),r,{pairs:pairs.map(([left,right])=>({left,right})),skill:'compare'})
 };
}
