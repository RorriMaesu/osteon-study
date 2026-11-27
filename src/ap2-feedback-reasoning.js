import {discussWinterObservation} from './ap2-guided-predictions.js';

const levels=['Low','Usual','High'];

export function validEndocrineTrial(key,entry){
  const validAnswer=a=>a&&typeof a.why==='string'&&a.why.length<=500&&
    ['',...levels].includes(a.drive)&&['',...levels].includes(a.end)&&Number.isSafeInteger(a.at)&&a.at>=0;
  return /^(thyroid|adrenal)\/(rest|gland|pituitary|external)$/.test(key)&&validAnswer(entry)&&
    typeof entry.checked==='boolean'&&(!entry.checked||(levels.includes(entry.drive)&&levels.includes(entry.end)&&!!entry.first))&&
    (entry.first===undefined||(validAnswer(entry.first)&&levels.includes(entry.first.drive)&&levels.includes(entry.first.end)));
}

export function mergeEndocrineTrials(current,imported){
  const merged={...current};
  for(const [key,entry] of Object.entries(imported||{})){
    const previous=merged[key];
    if(!previous){merged[key]=entry;continue;}
    const latest=previous.at>entry.at?previous:entry;
    const first=[previous.first,entry.first].filter(Boolean).sort((a,b)=>a.at-b.at)[0];
    merged[key]={...latest,...(first?{first}:{})};
  }
  return merged;
}

export function mountFeedbackReasoning(panel,{id,store,axes,feedbackLevels,refresh}){
  const control=name=>panel.querySelector('[data-reg-input="'+name+'"]');
  const el=name=>panel.querySelector('[data-feedback-'+name+']');
  const drive=el('drive'),end=el('end'),why=el('why'),note=el('note'),discuss=el('discuss'),output=panel.querySelector('.reg-out');
  const memory={};
  const key=()=>control('axis').value+'/'+control('change').value;
  const entry=()=>store?.read().endocrineTrials?.[key()]||memory[key()]||{};
  const snapshot=()=>({drive:drive.value,end:end.value,why:why.value,at:Date.now()});
  function save(checked){
    const trialKey=key(),value=snapshot();
    function write(entries){const first=entries[trialKey]?.first||(checked?value:undefined);
      entries[trialKey]={...value,checked,...(first?{first}:{})};}
    if(store)store.update(records=>write(records.endocrineTrials||={}));
    else write(memory);
  }
  function result(){
    const [,pituitary,peripheral]=feedbackLevels[control('change').value];
    note.textContent=(drive.value===pituitary?'Pituitary drive is correct. ':'Recheck the pituitary drive. ')+
      (end.value===peripheral?'End-hormone prediction is correct.':'Recheck the circulating end hormone.');
    refresh();output.hidden=false;discuss.hidden=false;
  }
  function recall(){
    const value=entry();drive.value=value.drive||'';end.value=value.end||'';why.value=value.why||'';
    el('first').textContent=value.first?'First prediction for this condition: '+value.first.drive+' pituitary drive, '+value.first.end+' end hormone.'+
      (value.first.why?' Your explanation: '+value.first.why:''):'';
    note.textContent='';output.hidden=true;discuss.hidden=true;
    if(value.checked)result();
  }
  function revise(){save(false);note.textContent='';output.hidden=true;discuss.hidden=true;}
  drive.onchange=end.onchange=revise;
  why.oninput=()=>save(!!entry().checked); // preserve the learner’s first submitted explanation
  control('axis').onchange=control('change').onchange=recall;
  el('check').onclick=()=>{
    if(!drive.value||!end.value){note.textContent='Choose both hormone levels before checking.';return;}
    save(true);recall();
  };
  discuss.onclick=()=>{
    const axis=axes[control('axis').value],condition=control('change').selectedOptions[0].textContent;
    const [release,pituitary,peripheral]=feedbackLevels[control('change').value];
    const first=entry().first;
    if(!first||!entry().checked)return;
    const facts=[axis.name+' under '+condition+'.',axis.release+' is '+release+', '+axis.drive+' is '+pituitary+' and circulating '+axis.hormone+' is '+peripheral+'.',output.querySelector('p').textContent];
    discussWinterObservation({course:'ap2',type:'diagram',reference:id,label:axis.name+' feedback',text:facts.join(' '),
      diagram:{id:'ap2-lab-feedback',state:{axis:axis.name,condition,currentExplanation:why.value,selectedDrive:drive.value,selectedEnd:end.value},prediction:first.drive+' pituitary drive, '+first.end+' end hormone. '+first.why,question:'Which feedback connection supports your explanation?',facts}});
  };
  recall();
}
