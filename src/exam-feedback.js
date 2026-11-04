export function componentFeedback(q,response){
 if(q.type==='match')return {label:'Matching pairs',total:q.pairs.length,correct:q.pairs.filter(p=>response?.[p.left]===p.right).length,rows:q.pairs.map(p=>({prompt:p.left,response:response?.[p.left]||'Unanswered',key:p.right,correct:response?.[p.left]===p.right}))};
 if(q.type==='order')return {label:'Positions in sequence',total:q.steps.length,correct:q.steps.filter((step,i)=>response?.[i]===step).length,rows:q.steps.map((step,i)=>({prompt:'Position '+(i+1),response:response?.[i]||'Unanswered',key:step,correct:response?.[i]===step}))};
 return null;
}
export function duplicateMatches(q,response){if(q.type!=='match')return [];const choices=Object.values(response||{}).filter(Boolean);return [...new Set(choices.filter((v,i)=>choices.indexOf(v)!==i))];}
export function componentHTML(q,response,e){const p=componentFeedback(q,response);return p?`<details class="component-feedback"><summary>${p.correct}/${p.total} ${p.label.toLowerCase()} correct · diagnostic only</summary><p class="tiny">The question is still worth one point and requires all parts. This breakdown identifies what to practice.</p>${p.rows.map(row=>`<p><b>${row.correct?'✓':'↻'} ${e(row.prompt)}</b> · Your answer: ${e(row.response)}${row.correct?'':` · Expected: ${e(row.key)}`}</p>`).join('')}</details>`:'';}
