import {sectionPractice,springRecoveryCase} from './ap3-recovery-cases.js';
import {chapters} from './ap3-curriculum.js';

export function springStudyExposure(store){
  const items=[];
  for(const ch of chapters)for(const s of ch.sections){
    const check=store.read('check:'+s.id);
    if(check){
      items.push({prompt:s.question});
      for(const q of sectionPractice(s.id))if(check.seen?.includes(q.id))items.push(q);
    }
  }
  const attempts=store.attempts();
  for(const r of attempts)if(r.submitted)r.items.forEach((q,i)=>{
    const trial=springRecoveryCase(q);
    if(trial&&store.read(recoveryKey(r.id,i)))items.push(trial);
  });
  return [...attempts,{mode:'study',items}];
}

export function recoveryKey(id,index){return 'recovery:'+id+':'+index;}
export function latestSpringDraft(store){
  const course=store.attempts().filter(r=>!r.submitted).map(r=>({r,route:'ap3-session-'+r.id,label:(r.scope==='all'?'cumulative':'chapter '+r.scope)+' '+r.mode}));
  const mocks=store.mocks().filter(r=>!r.submitted).map(r=>({r,route:'ap3-mocks/take/'+r.id,label:r.title}));
  return [...course,...mocks].sort((a,b)=>(b.r.updated||b.r.created)-(a.r.updated||a.r.created))[0];
}
export function recoveryState(store,r,i,completed){
  if(store.read(recoveryKey(r.id,i))?.passed)return 'Recovered in practice';
  const id=r.items[i].id;
  if(completed.some(later=>later.submitted>r.submitted&&later.items.some((q,n)=>q.id===id&&['correct','spelling'].includes(later.grades[n]))))return 'Correct on a later exam';
  return '';
}
function showChoice(body,q,e,mark){
  const choices=q.options.map((opt,i)=>({opt,i}));
  for(let i=choices.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[choices[i],choices[j]]=[choices[j],choices[i]];}
  body.innerHTML='<h2 tabindex="-1">'+e(q.prompt)+'</h2><div class="ap2-answers">'+choices.map(({opt,i})=>'<button data-answer="'+i+'">'+e(opt)+'</button>').join('')+'</div><p role="status" data-feedback></p><div data-recall-actions></div>';
  for(const el of body.querySelectorAll('[data-answer]'))el.onclick=()=>{
    const correct=Number(el.dataset.answer)===q.answer;
    for(const b of body.querySelectorAll('[data-answer]'))b.disabled=true;
    body.querySelector('[data-answer="'+q.answer+'"]').classList.add('ap2-correct');
    body.querySelector('[data-feedback]').textContent=(correct?'Correct. ':'Expected answer · '+q.options[q.answer]+'. ')+q.why;
    mark(correct);
  };
}
export function mountSpringRecall(body,s,store,e){
  const key='check:'+s.id,pool=[{id:'lesson-'+s.id,prompt:s.question,options:s.options,answer:s.answer,why:s.why},...sectionPractice(s.id)];
  let turn=(Number(store.read(key)?.nextItem)||0)%pool.length;
  function render(){
    showChoice(body,pool[turn],e,correct=>{
      const prior=store.read(key),next=(turn+1)%pool.length;
      const seen=new Set(Array.isArray(prior?.seen)?prior.seen:[]);seen.add(pool[turn].id);
      store.write(key,{firstCorrect:prior?.firstCorrect??correct,correct,at:Date.now(),nextItem:next,seen:[...seen]});
      const button=document.createElement('button');button.textContent='Try another application';button.onclick=()=>{turn=next;render();body.querySelector('h2').focus();};
      body.querySelector('[data-recall-actions]').append(button);
    });
  }
  render();
}
export function mountSpringRecovery(body,r,i,store,e){
  const key=recoveryKey(r.id,i),q=springRecoveryCase(r.items[i]);
  if(!q)return;
  showChoice(body,q,e,correct=>{
    const prior=store.read(key);
    store.write(key,{firstCorrect:prior?.firstCorrect??correct,passed:!!prior?.passed||correct,attempts:(prior?.attempts||0)+1,at:Date.now()});
    body.querySelector('[data-feedback]').textContent+=correct?' This concept is marked recovered.':' Revisit the source lesson and try the application again.';
  });
}
