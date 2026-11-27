import {getTutorAssessmentMode,setLearningContext} from './learning-context.js';

export function discussWinterObservation(context){
  if(getTutorAssessmentMode()==='exam')return;
  setLearningContext(context);
  document.querySelector('#tutor-launch')?.click();
}

export function mountGuidedPredictions(target,section,store,escapeText){
  let stepIndex=0, draft='', timer=0;
  const key=()=>section.id+'/'+stepIndex;
  const saved=()=>store.read().guidedPredictions?.[key()];
  function flush(){
    if(!timer)return;
    clearTimeout(timer);timer=0;
    window.removeEventListener('pagehide',flush);
    window.removeEventListener('hashchange',flush,true);
    if(draft===(saved()?.draft||''))return;
    store.update(records=>{
      const entries=records.guidedPredictions||={};
      const entry=entries[key()]||={};
      entry.draft=draft;
      if(!draft&&!Object.hasOwn(entry,'first'))delete entries[key()];
    });
  }
  function saveSoon(value){
    draft=value;clearTimeout(timer);timer=setTimeout(flush,280);
    window.addEventListener('pagehide',flush);
    window.addEventListener('hashchange',flush,true);
  }
  function render(i,shown=false){
    if(timer)flush();
    stepIndex=i;
    const step=section.activity.steps[i],entry=saved()||{};
    draft=entry.draft||'';
    target.innerHTML=`<p class="eyebrow">STEP ${i+1} / ${section.activity.steps.length}</p><h3>${escapeText(step.label)}</h3>
      <label>Your prediction or explanation <small>(optional)</small><input data-prediction maxlength="500" autocomplete="off" value="${escapeText(draft)}"></label>
      ${shown?'<p role="status">'+escapeText(step.detail)+'</p>':''}
      ${shown&&entry.first?'<p><strong>Your first prediction</strong> · '+escapeText(entry.first)+'</p>':''}
      <div class="course-actions"><button data-before ${i?'':'disabled'}>← Previous</button><button data-reveal>${shown?'Hide explanation':'Show explanation'}</button>${shown?'<button data-discuss-step>Discuss my result</button>':''}<button data-after ${i===section.activity.steps.length-1?'disabled':''}>Next step →</button></div>`;
    const input=target.querySelector('[data-prediction]');
    input.oninput=()=>saveSoon(input.value);
    input.onchange=flush;
    target.querySelector('[data-before]').onclick=()=>render(i-1);
    target.querySelector('[data-after]').onclick=()=>render(i+1);
    target.querySelector('[data-reveal]').onclick=()=>{
      flush();
      if(!shown&&!Object.hasOwn(saved()||{},'first')){
        store.update(records=>{
          const entries=records.guidedPredictions||={};
          const firstEntry=entries[key()]||={draft};
          firstEntry.first??=draft.trim();
        });
      }
      render(i,!shown);
      target.querySelector('[data-reveal]').focus();
    };
    if(shown)target.querySelector('[data-discuss-step]').onclick=()=>{
      flush();
      const facts=[section.activity.prompt,step.detail];
      discussWinterObservation({course:'ap2',type:'diagram',reference:section.id,label:section.activity.title,text:facts.join(' '),
        diagram:{id:'ap2-lab-guided-'+key(),state:{step:step.label,status:'Explanation revealed',currentExplanation:draft},
          question:'Which observation supports or changes your prediction?',prediction:saved()?.first||'',facts}});
    };
  }
  render(0);
}
