const eyes=['right','left'];
const lesionNames=['Both pathways intact','Left afferent limb','Right afferent limb','Left efferent limb','Right efferent limb'];
export function pupilResponse(lesion,light){
  const input=eyes.includes(light)&&lesion!==(light==='left'?1:2);
  return {left:input&&lesion!==3,right:input&&lesion!==4};
}

export function pupilTable(observed){
  const rows=eyes.map(light=>'<tr><th scope="row">'+light+'</th>'+eyes.map(pupil=>{
    const value=observed.get(light)?.[pupil];
    return '<td>'+(value===undefined?'Unobserved':value?'Constricts':'No constriction')+' · '+(pupil===light?'direct':'consensual')+'</td>';
  }).join('')+'</tr>');
  return '<div class="ap2-table-wrap"><table><caption>Observed responses · facing the subject</caption><thead><tr><th>Light in eye</th><th>Subject’s right pupil</th><th>Subject’s left pupil</th></tr></thead><tbody>'+rows.join('')+'</tbody></table></div>';
}
const procedures=[
 ['left','left'],['left','right'],['right','left'],['right','right']
];
const describe=([light,pupil])=>'Illuminate '+light+' · observe '+pupil+' pupil';
const proceduresFor=i=>[0,1,2,3].filter(j=>j!==i);
const caseDetails=[
 {lesion:1,opening:0}, {lesion:4,opening:3}, {lesion:3,opening:0}, {lesion:2,opening:3}
];
const outcome=(lesion,test)=>pupilResponse(lesion,procedures[test][0])[procedures[test][1]];
export function possibilities(observations){return lesionNames.map((_,k)=>k).filter(k=>observations.every(([test,v])=>outcome(k,test)===v));}

export function renderEvidenceCase(){
  return '<section class="neuro-station" data-sensory-detail="choose-evidence"><h3>What would you check next?</h3><p>Face the subject. Consider an intact circuit or one complete unilateral interruption of its input or output. Start with one pupil reading and request one more observation.</p><div data-evidence-trial></div><button type="button" data-next-pupil>Another case</button></section>';
}
export function mountEvidenceCase(host){
  const body=host.querySelector('[data-evidence-trial]');
  let index=0,additional=null;
  function render(){
    const c=caseDetails[index],initial=[c.opening,outcome(c.lesion,c.opening)],remaining=possibilities([initial]);
    const report=([n,v])=>describe(procedures[n])+' → '+(v?'constricts':'no constriction');
    const letter=String.fromCharCode(65+index);
    body.innerHTML='<p><strong>Case '+letter+'</strong> · '+report(initial)+'.</p><p>Both '+remaining.map(k=>lesionNames[k].toLowerCase()).join(' and ')+' fit this single reading.</p>'+
      (additional===null?'<label>Which observation could distinguish them? <select data-request><option value="">Choose one</option>'+proceduresFor(c.opening).map(n=>'<option value="'+n+'">'+describe(procedures[n])+'</option>').join('')+'</select></label><div data-expect></div>':
        '<p><strong>Second observation</strong> · '+report(additional)+'.</p><label>What do the two observations support? <select data-conclusion><option value="">Choose</option>'+remaining.map(n=>'<option value="'+n+'">'+lesionNames[n]+'</option>').join('')+'<option value="unknown">Evidence still fits both</option></select></label> <button type="button" data-answer>Check conclusion</button>')+
      '<p role="status" data-evidence-feedback></p>';
    const feedback=body.querySelector('[data-evidence-feedback]');
    if(additional===null){
      const request=body.querySelector('[data-request]'),expect=body.querySelector('[data-expect]');
      request.onchange=()=>{
        feedback.textContent='';expect.innerHTML='';
        if(request.value==='')return;
        const test=+request.value;
        expect.innerHTML=remaining.map(k=>'<label>If the '+lesionNames[k].toLowerCase()+' were interrupted, the observed pupil would <select data-hypothesis="'+k+'"><option value="">Predict</option><option value="1">Constrict</option><option value="0">Show no constriction</option></select></label>').join(' ')+' <button type="button" data-observe>Reveal observation</button>';
        expect.querySelector('[data-observe]').onclick=()=>{
          const guesses=[...expect.querySelectorAll('select')];
          if(guesses.some(s=>s.value==='')){feedback.textContent='Predict a result for each possible interruption first.';return;}
          const correct=guesses.every(s=>Boolean(+s.value)===outcome(+s.dataset.hypothesis,test));
          additional=[test,outcome(c.lesion,test)];render();
          body.querySelector('[data-evidence-feedback]').textContent=(correct?'Both predictions fit their pathways. ':'Compare your predictions with the two pathways. ')+remaining.map(k=>lesionNames[k]+' predicts '+(outcome(k,test)?'constriction':'no constriction')).join('. ')+'.';
          body.querySelector('[data-conclusion]').focus();
        };
      };
    }else body.querySelector('[data-answer]').onclick=()=>{
      const selection=body.querySelector('[data-conclusion]').value,compatible=possibilities([initial,additional]);
      if(selection===''){feedback.textContent='Choose a conclusion first.';return;}
      const expected=compatible.length===1?String(compatible[0]):'unknown';
      const next=proceduresFor(c.opening).find(n=>compatible.length>1&&new Set(compatible.map(k=>outcome(k,n))).size>1);
      feedback.textContent=(selection===expected?'Correct. ':'Recheck your conclusion. ')+(compatible.length===1?lesionNames[compatible[0]]+' alone fits both observations in this model.':'Both candidate pathways predict this result. A distinguishing observation would be: '+describe(procedures[next])+'.');
    };
  }
  host.querySelector('[data-next-pupil]').onclick=()=>{index=(index+1)%caseDetails.length;additional=null;render();body.querySelector('[data-request]').focus();};
  render();
}

