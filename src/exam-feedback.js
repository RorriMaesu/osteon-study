export function componentFeedback(q,response){
 if(q.type==='multi'){
  const actual=new Set(Array.isArray(response)?response:[]),expected=new Set(q.correctChoices);
  const union=new Set([...expected,...actual]);
  return {label:'Selected and expected statements',total:union.size,correct:[...actual].filter(x=>expected.has(x)).length,rows:[...union].map(text=>({prompt:text,response:actual.has(text)?'Selected':'Omitted',key:expected.has(text)?'Select':'Leave unselected',correct:actual.has(text)===expected.has(text)}))};
 }
 if(q.type==='match')return {label:'Matching pairs',total:q.pairs.length,correct:q.pairs.filter(p=>response?.[p.left]===p.right).length,rows:q.pairs.map(p=>({prompt:p.left,response:response?.[p.left]||'Unanswered',key:p.right,correct:response?.[p.left]===p.right}))};
 if(q.type==='order')return {label:'Positions in sequence',total:q.steps.length,correct:q.steps.filter((step,i)=>response?.[i]===step).length,rows:q.steps.map((step,i)=>({prompt:'Position '+(i+1),response:response?.[i]||'Unanswered',key:step,correct:response?.[i]===step}))};
 return null;
}
export function duplicateMatches(q,response){if(q.type!=='match')return [];const choices=Object.values(response||{}).filter(Boolean);return [...new Set(choices.filter((v,i)=>choices.indexOf(v)!==i))];}
export function componentHTML(q,response,e,points=1){const p=componentFeedback(q,response);return p?`<details class="component-feedback"><summary>${p.correct}/${p.total} ${p.label.toLowerCase()} correct · diagnostic only</summary><p class="tiny">The question is worth ${points} point${points===1?'':'s'} and requires all parts. This breakdown identifies what to practice.</p>${p.rows.map(row=>`<p><b>${row.correct?'✓':'↻'} ${e(row.prompt)}</b> · Your answer: ${e(row.response)}${row.correct?'':` · Expected: ${e(row.key)}`}</p>`).join('')}</details>`:'';}
export function remediationHTML(q,response,e){
 const note=q.remediation;if(!note)return '';
 const selected=Array.isArray(response)?response:response?[response]:[];
 const affected=q.type==='multi'?[...new Set([...selected.filter(value=>!q.correctChoices.includes(value)),...q.correctChoices.filter(value=>!selected.includes(value))])]:selected;
 const choices=affected.map(value=>note.choiceFeedback?.[value]).filter(Boolean);
 return `<details class="component-feedback"><summary>Teach me this</summary>${choices.map(text=>`<p>${e(text)}</p>`).join('')}${[note.correctIdea,note.explanation,note.example,note.mnemonic].filter(Boolean).map(text=>`<p>${e(text)}</p>`).join('')}${note.quickCheck?`<details><summary>Quick check</summary><p>${e(note.quickCheck)}</p><details><summary>Show answer</summary><p>${e(note.quickCheckAnswer)}</p></details></details>`:''}</details>`;
}
