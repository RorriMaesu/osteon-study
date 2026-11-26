import {assessTyped} from './typed-answer.js';
import {chapters,sections,units} from './ap2-library.js';
import {appliedItems} from './ap2-applied.js';

export const bank = [...sections.flatMap(section => section.questions.map((q,index) => ({
  ...q,id:'ap2-'+section.id+'-q'+(index+1),section:section.id,type:'choice'
}))), ...appliedItems.map(q=>({...q,...(q.expected!==undefined?{expected:String(q.expected)}:{})}))];
export const examScopes = [
  ...chapters.map(ch=>({id:String(ch.id),title:'Chapter '+ch.id+' · '+ch.title,chapters:[ch.id]})),
  ...units.map(unit=>({...unit,title:'Unit · '+unit.title})),
  {id:'all',title:'Cumulative · Chapters 12–20',chapters:chapters.map(ch=>ch.id)}
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
  const questions=selected.flatMap(s=>shuffle(bank.filter(q=>q.type==='choice'&&q.section===s.id),random).slice(0,perSection));
  for (const ch of spec.chapters) {
    const applied=bank.filter(q=>q.type!=='choice'&&Number(q.section.split('.')[0])===ch);
    const visual=applied.filter(q=>q.type==='visual'), typed=applied.filter(q=>q.type!=='visual');
    questions.push(...(spec.id==='all'?[...shuffle(visual,random).slice(0,1),...shuffle(typed,random).slice(0,1)]:applied));
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
  if (q.type==='number') {
    const numeric=/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(response)?Number(response):NaN;
    return Number.isFinite(numeric)&&Math.abs(numeric-Number(q.expected))<=(q.tolerance||0)+1e-9?'correct':'incorrect';
  }
  if (q.type==='term') {
    if (q.section==='18.6' && /^(AB|A|B|O) (negative|positive)$/i.test(q.expected)) {
      const type=response.toLowerCase().replace(/[−–]/g,'-').replace(/^type\s+/, '').replace(/rh(?:\(d\))?/g,'').replace(/\s+/g,'');
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
