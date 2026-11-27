import {examWritingCases} from './ap2-exam-writing.js';
import {writtenCases} from './ap2-writing.js';
import {setLearningContext} from './learning-context.js';
export function snapshotWriting(items) {
  return [...new Set(items.map(q=>Number(q.section.split('.')[0])))].sort((a,b)=>a-b)
    .map(chapter=>({chapter,...examWritingCases[chapter],answer:''}));
}
function model(c,e) {
  return `<h3>Check your reasoning</h3><ul>${c.rubric.map(point=>'<li>'+e(point)+'</li>').join('')}</ul><p><strong>Example explanation</strong></p><p>${e(c.example)}</p>`;
}
function editor(c,e) {
  return `<p>${e(c.prompt)}</p><label>Your explanation<textarea data-writing-answer rows="3" maxlength="2500">${e(c.answer||'')}</textarea></label>`;
}
export function openWritingPractice(ch,{root,hero,page,link,store,e}){
  const c=writtenCases[ch];if(!c)return false;
  const data=store.read().writing?.[ch]||{compared:false,answer:''};
  function view(compared){
    const current=store.read().writing?.[ch]||data;
    page(hero('A&P II · CHAPTER '+ch,'Explain the mechanism','Write your reasoning, then compare it with the chapter rubric.')+`<article class="course-card">${editor({...c,answer:current.answer},e)}
      <div class="course-actions"><button data-compare ${current.answer.trim()?'':'disabled'}>${compared?'Hide rubric':'Compare my reasoning'}</button>${link('ap2-chapter-'+ch,'Return to chapter')}</div>
      ${compared?model(c,e):''}</article>`);
    const input=root.querySelector('[data-writing-answer]'),button=root.querySelector('[data-compare]');
    const save=(answer,compared)=>store.update(r=>{r.writing||={};r.writing[ch]={answer,compared};});
    input.oninput=()=>{save(input.value,compared);button.disabled=!input.value.trim()&&!compared;};
    button.onclick=()=>{save(input.value,!compared);view(!compared);};
  }
  view(data.compared);
  setLearningContext({course:'ap2',type:'lesson',reference:c.section,label:'Writing practice · Chapter '+ch,text:c.prompt});
  return true;
}
export function examWriting(root,session,update,e){
  const place=root.querySelector('[data-writing-place]');if(!place||!session.writing?.length)return;
  place.innerHTML=`<details class="ap2-writing-panel"><summary>Optional written reasoning</summary><p>Saved with this exam. Compare your explanation with the rubric after submission. It is separate from the question score.</p>
    <label>Writing station <select data-station>${session.writing.map((c,i)=>`<option value="${i}">Chapter ${c.chapter} · §${e(c.section)}</option>`).join('')}</select></label><div data-editor></div></details>`;
  const select=place.querySelector('[data-station]');
  const draftAnswers=session.writing.map(c=>c.answer);
  function load(i) {
    const box=place.querySelector('[data-editor]');box.innerHTML=editor({...session.writing[i],answer:draftAnswers[i]},e);
    const input=box.querySelector('[data-writing-answer]');input.oninput=()=>{
      draftAnswers[i]=input.value;update(d=>{if(d.writing?.[i])d.writing[i].answer=input.value;});
    };
  }
  select.onchange=()=>load(Number(select.value));load(0);
}
export function writingResults(list,e){
  if(!list?.length)return '';
  return `<section class="course-card ap2-writing-panel"><h2>Written reasoning</h2>${list.map(c=>`<details><summary>Chapter ${c.chapter} · ${c.answer.trim()?'Review your explanation':'Try the case'}</summary><p>${e(c.prompt)}</p><p><strong>Your response</strong> · ${e(c.answer||'Unanswered')}</p><p><strong>Example explanation</strong></p><p>${e(c.example)}</p><fieldset><legend>Which points did your answer explain?</legend>${c.rubric.map((point,i)=>`<label class="ap2-choice"><input type="checkbox" data-evidence-point="${i}" data-case-chapter="${c.chapter}" ${c.selfMarked?.includes(i)?'checked':''}>${e(point)}</label>`).join('')}</fieldset><button data-written-tutor="${c.chapter}">Discuss a missing point with the tutor</button></details>`).join('')}</section>`;
}
