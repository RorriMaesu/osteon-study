import {checkQuantity} from './ap2-quantities.js';
import {assessTyped} from './typed-answer.js';
import {chapters,sections,units} from './ap2-library.js';
import {appliedItems} from './ap2-applied.js';

import {independentItems} from './ap2-independent.js';
import {evidenceItems} from './ap2-independent-visuals.js';
import {bloodExamItems} from './ap2-blood-exam.js';

export const bank = [...sections.flatMap(section => section.questions.map((q,index) => ({
  ...q,id:'ap2-'+section.id+'-q'+(index+1),section:section.id,type:'choice',pool:'recall'
}))), ...independentItems, ...[...evidenceItems,...bloodExamItems,...appliedItems].map(q=>({...q,skill:q.skill||(q.type==='visual'?'Interpret evidence':q.type==='number'?'Calculate':'Identify'),...(q.expected!==undefined?{expected:String(q.expected)}:{})}))];
export const examScopes = [
  ...chapters.map(ch=>({id:String(ch.id),title:'Chapter '+ch.id+' · '+ch.title,chapters:[ch.id]})),
  ...units.map(unit=>({...unit,title:'Unit · '+unit.title})),
  {id:'all',title:'Cumulative · All 49 sections',chapters:chapters.map(ch=>ch.id)},
  {id:'balanced',title:'Mixed practical · Equal chapter weight',chapters:chapters.map(ch=>ch.id)}
];
function shuffle(items,random) {
  const out=[...items];
  for (let i=out.length-1;i>0;i--) {
    const j=Math.floor(random()*(i+1)); [out[i],out[j]]=[out[j],out[i]];
  }
  return out;
}
export function examItems(scope,random=Math.random) {
  const spec=examScopes.find(s=>s.id===scope);
  if (!spec) throw new Error('Unknown exam scope.');
  const selected=sections.filter(s=>spec.chapters.includes(Number(s.id.split('.')[0])));
  const perSection=spec.chapters.length===1 && !units.some(u=>u.id===scope) ? 2 : 1;
  const questions=[],counts=new Map();
  const groupByChapter=spec.id==='balanced';
  const groups=groupByChapter?spec.chapters.map(ch=>selected.filter(s=>s.id.startsWith(ch+'.')).map(s=>s.id)):selected.map(s=>[s.id]);
  for (const ids of shuffle(groups,random)) {
    const candidates=shuffle(independentItems.filter(q=>ids.includes(q.section)),random);
    // Within each required section, favor tasks that have had less representation on this form.
    candidates.sort((a,b)=>(counts.get(a.skill)||0)-(counts.get(b.skill)||0));
    for(const item of candidates.slice(0,perSection)){
      questions.push(item);counts.set(item.skill,(counts.get(item.skill)||0)+1);
    }
  }
  for (const ch of spec.chapters) {
    const applied=bank.filter(q=>q.type!=='choice'&&Number(q.section.split('.')[0])===ch);
    const visual=applied.filter(q=>q.type==='visual'), typed=applied.filter(q=>q.type!=='visual');
    questions.push(...shuffle(visual,random).slice(0,1),...shuffle(typed,random).slice(0,spec.id==='all'||groupByChapter?1:2));
  }
  return shuffle(questions,random).map(q=>{
    if (!q.choices) return {...q};
    const indices=shuffle(q.choices.map((_,i)=>i),random);
    return {...q,choices:indices.map(i=>q.choices[i]),answer:indices.indexOf(q.answer)};
  });
}
export function grade(q,raw) {
  const response=String(raw??'').trim();
  if (!response) return 'blank';
  if (q.type==='number') return checkQuantity(q,response).correct?'correct':'incorrect';
  if (q.type==='term') {
    if (q.section==='18.6' && /^(AB|A|B|O) (negative|positive)$/i.test(q.expected)) {
      const type=response.toLowerCase().replace(/[−–]/g,'-').replace(/^type\s+/, '').replace(/rh(?:\(d\))?\s*[-‐‑]?(?=negative|positive|neg|pos)/g,'').replace(/rh(?:\(d\))?/g,'').replace(/\s+/g,'');
      const match=/^(ab|a|b|o)(negative|positive|neg|pos|[+-])$/.exec(type);
      if(!match)return 'incorrect';
      const canonical=match[1]+' '+(['-','neg','negative'].includes(match[2])?'negative':'positive');
      return canonical===q.expected.toLowerCase()?'correct':'incorrect';
    }
    const outcome=assessTyped({id:q.id,type:'text',answer:q.expected,aliases:q.aliases||[]},response).status;
    return ({correct:'correct',equivalent:'correct',spelling:'spelling',pending:'pending'})[outcome]||'incorrect';
  }
  return response===String(q.answer)?'correct':'incorrect';
}
export function submitDraft(state,id,now=Date.now()) {
  const draft=state.draft;
  if (!draft || draft.id!==id) return;
  const grades=Object.fromEntries(draft.items.map(q=>[q.id,grade(q,draft.responses[q.id])]));
  state.reports.unshift({...draft,submitted:now,grades});
  state.draft=null; state.resume='ap2-report-'+id;
}
export const correctGrade = g=>g==='correct'||g==='spelling';
export const expectedAnswer = q=>q.choices?q.choices[q.answer]:q.expected+(q.unit?' '+q.unit:'');
export function score(report) {
  const values=Object.values(report.grades);
  return {correct:values.filter(correctGrade).length,total:values.length,pending:values.filter(v=>v==='pending').length};
}
