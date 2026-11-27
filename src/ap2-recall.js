import {sectionById} from './ap2-library.js';
import {recoveryCase} from './ap2-recovery-cases.js';
import {correctGrade} from './ap2-exam-core.js';

const recallId=(section,index)=>'ap2-'+section+'-q'+(index+1);
function shuffle(items,random=Math.random){
  const result=[...items];
  for(let i=result.length-1;i>0;i--){
    const j=Math.floor(random()*(i+1));
    [result[i],result[j]]=[result[j],result[i]];
  }
  return result;
}
export function nextRecovery(record,section){
  const latest=new Map();
  for(const report of [...record.reports].sort((a,b)=>b.submitted-a.submitted)){
    for(const q of report.items){
      if((section&&q.section!==section)||latest.has(q.id))continue;
      latest.set(q.id,report.id);
      if(correctGrade(report.grades[q.id])||report.grades[q.id]==='pending')continue;
      if(record.recoveries?.[report.id]?.[q.id]?.passed)continue;
      const activity=recoveryCase(q);
      if(activity)return {reportId:report.id,q,activity};
    }
  }
  return null;
}

export function nextWinterSection(record){
  const missed=nextRecovery(record);
  if(missed)return sectionById.get(missed.q.section);
  const weak=Object.values(record.checks).filter(c=>!c.correct).sort((a,b)=>b.at-a.at);
  return weak.length?sectionById.get(weak[0].section):[...sectionById.values()].find(s=>
    s.questions.some((_,i)=>!record.checks[recallId(s.id,i)]?.correct));
}

export function mountWinterRecall(body,s,store,e){
  let order,position,answers,miss;
  function headingFocus(){body.querySelector('[tabindex="-1"]')?.focus({preventScroll:true});}
  function start(offerRecovery){
    const saved=store.read();
    order=shuffle(s.questions.map((_,i)=>i));position=0;answers=[];miss=nextRecovery(saved,s.id);
    renderQuestion(Boolean(offerRecovery&&miss&&order.every(i=>saved.checks[recallId(s.id,i)]?.correct)));
  }
  function renderQuestion(transfer=true){
    const index=order[position],q=transfer?miss.activity:s.questions[index];
    const presented=shuffle(q.choices.map((_,i)=>i));
    body.innerHTML='<p class="eyebrow">'+(transfer?'Apply the missed concept':'Recall '+(position+1)+' / '+order.length)+'</p>'+
      '<h2 tabindex="-1">'+e(q.prompt)+'</h2><div class="ap2-answers">'+presented.map(i=>'<button type="button" data-pick="'+i+'">'+e(q.choices[i])+'</button>').join('')+
      '</div><div class="ap2-recall-feedback" role="status"></div>';
    headingFocus();
    for(const button of body.querySelectorAll('[data-pick]'))button.onclick=()=>{
      const chosen=Number(button.dataset.pick),correct=chosen===q.answer;
      if(transfer){
        store.update(r=>{
          const entries=r.recoveries||={},report=entries[miss.reportId]||={};
          const item=report[miss.q.id]||={attempts:0,first:correct,passed:false};
          item.attempts++;item.passed||=correct;
        });
      }else{
        answers.push(correct);
        store.update(r=>{
          const id=recallId(s.id,index),old=r.checks[id];
          r.checks[id]={section:s.id,at:Date.now(),correct,...(!old?{first:correct}:old.first!==undefined?{first:old.first}:{})};
        });
      }
      for(const option of body.querySelectorAll('[data-pick]')){
        option.disabled=true;
        if(Number(option.dataset.pick)===q.answer)option.classList.add('ap2-correct');
      }
      const feedback=body.querySelector('.ap2-recall-feedback');
      const action=transfer?'Return to My progress':position+1===order.length?'Finish recall set':'Next recall question →';
      feedback.innerHTML='<p><strong>'+(correct?'Correct.':'Review this connection.')+'</strong> You chose '+e(q.choices[chosen])+'. The correct answer is '+e(q.choices[q.answer])+'.</p>'+
        (q.why?'<p>'+e(q.why)+'</p>':'')+
        (transfer?'<p>'+(correct?'Recovery recorded for this exam question.':'This question stays in your study recommendations.')+' Your original exam score is preserved.</p>':'')+
        '<button type="button" data-next>'+action+'</button>';
      feedback.querySelector('[data-next]').onclick=()=>{
        if(transfer)location.hash='ap2-progress';
        else if(++position===order.length)summary();else renderQuestion(false);
      };
    };
  }
  function summary(){
    body.innerHTML='<h2 tabindex="-1">Recall set complete</h2><p>'+answers.filter(Boolean).length+' of '+answers.length+' correct on this pass.</p>'+
      (miss?'<p>Try a different question on the concept you missed in your exam.</p><button class="primary" data-recover>Apply the missed concept</button>':'')+
      '<div class="course-actions"><a class="course-link" href="#ap2-progress">My progress</a><button type="button" data-repeat>Practice again</button></div>';
    headingFocus();
    body.querySelector('[data-repeat]').onclick=()=>start(false);
    const retry=body.querySelector('[data-recover]');
    if(retry)retry.onclick=()=>renderQuestion();
  }
  start(true);
}
