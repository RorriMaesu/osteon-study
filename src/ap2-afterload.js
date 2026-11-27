import {discussWinterObservation} from './ap2-guided-predictions.js';
import {setLearningContext} from './learning-context.js';
import {renderMechanismTransfer,mountMechanismTransfer} from './mechanism-transfer.js';

// Illustrative single beats at the same initial filling and contractile state.
// End-systolic pressure is 2 mm Hg/mL times end-systolic volume in each trial.
const beats={
  baseline:{opening:80,esv:50,peak:120},
  higher:{opening:105,esv:65,peak:145},
  lower:{opening:65,esv:40,peak:98}
};
const edv=120, predictions=['smaller','same','larger'];
const events=[
  ['Mitral valve closes','Filling ends and the ventricle starts building pressure at its end-diastolic volume.'],
  ['Aortic valve opens','Ventricular pressure crosses above aortic pressure and ejection begins.'],
  ['Aortic valve closes','The pressure gradient reverses at the end of ejection.'],
  ['Mitral valve opens','Ventricular pressure falls below atrial pressure and filling begins.']
];
const letters='ABCD';
export function beatValues(trial){
  const {opening,esv,peak}=beats[trial];
  return {edv,esv,sv:edv-esv,events:[[edv,10],[edv,opening],[esv,2*esv],[esv,5]],peak};
}
const x=v=>50+(v-20)*2.8,y=p=>199-p*1.05;
const pt=([v,p])=>x(v)+','+y(p);
function loop(trial){
  const {events:[a,b,c,d],peak}=beatValues(trial);
  return 'M'+pt(a)+' L'+pt(b)+' C'+pt([edv-5,peak])+ ' '+pt([c[0]+14,peak+5])+' '+pt(c)+
    ' L'+pt(d)+' C'+pt([d[0]+17,3.8])+' '+pt([edv-10,5])+' '+pt(a)+' Z';
}
const axisText=(x,y,label,anchor='middle')=>'<text x="'+x+'" y="'+y+'" text-anchor="'+anchor+'">'+label+'</text>';
function chart(trial,revealed,selected){
  let grid='';
  for(const p of [0,40,80,120,160])grid+='<path d="M45 '+y(p)+' H365" stroke="#567071" opacity=".48"/>'+axisText(39,y(p)+4,p,'end');
  for(const v of [20,40,60,80,100,120])grid+=axisText(x(v),218,v);
  const gold='#f8be8d',mint='#a6e4cf';
  const marks=beatValues(trial).events.map(([v,p],i)=>{
    const px=x(v),py=y(p);
    return '<g data-pv-graph-point="'+i+'" style="cursor:pointer"><circle cx="'+px+'" cy="'+py+'" r="14" fill="transparent"/>'+
      '<circle cx="'+px+'" cy="'+py+'" r="'+(selected===i?8:4)+'" stroke="'+gold+'" stroke-width="2" fill="#14282b"/>'+
      axisText(px+(i<2?12:-12),py+(i===0?-4:i===3?-4:0),letters[i],i<2?'start':'end')+'</g>';
  }).join('');
  return '<figure class="ac-plot"><svg viewBox="0 0 390 244" role="img" aria-label="Left ventricular pressure against volume. Baseline is a solid mint loop.'+
    (revealed?' The comparison is a dashed orange loop. Points A through D are described in the measurement table.':'')+'">'+
    axisText(10,15,'Ventricular pressure (mm Hg)','start')+grid+'<path d="M50 24 V199 H365" fill="none" stroke="#b6c8c8"/>'+
    '<path d="'+loop('baseline')+'" fill="none" stroke="'+mint+'" stroke-width="3"/>'+
    (revealed?'<path d="'+loop(trial)+'" fill="none" stroke="'+gold+'" stroke-width="3" stroke-dasharray="6 4"/>'+marks:'')+
    axisText(202,239,'Left ventricular volume (mL)')+'</svg><figcaption>Solid line · baseline'+(revealed?' &nbsp; Dashed line · '+trial+' afterload':'')+'</figcaption></figure>';
}

export function afterloadContext(trial,first,selectedEvent=null){
  const base=beatValues('baseline'),beat=beatValues(trial);
  const facts=['First beat after changing aortic pressure. End-diastolic volume is 120 mL; myocardial contractility, compliance and heart rate stay fixed.',
    'Baseline aortic opening pressure is 80 mm Hg; baseline end-systolic volume is 50 mL.',
    'Aortic opening pressure for this trial is '+beat.events[1][1]+' mm Hg. Aortic pressure is the input changed to alter afterload. Loop width measures the resulting stroke volume.'];
  const state={trial,status:first?'Prediction checked':'Awaiting prediction',baselineStrokeVolume:base.sv};
  const prediction=first?'Stroke volume would be '+(first==='same'?'unchanged':first)+'.':'';
  if(first){
    state.trialStrokeVolume=beat.sv;
    state.changeInStrokeVolume=beat.sv-base.sv;
    facts.push('Learner prediction: '+prediction+' Measured baseline stroke volume = '+base.edv+' − '+base.esv+' = '+base.sv+' mL. Measured '+trial+' afterload stroke volume = '+beat.edv+' − '+beat.esv+' = '+beat.sv+' mL. Stroke volume '+(beat.sv<base.sv?'decreased':'increased')+' by '+Math.abs(state.changeInStrokeVolume)+' mL. The comparison ends systole at '+beat.esv+' mL.');
  }
  if(first&&selectedEvent!==null)facts.push('Inspected point '+letters[selectedEvent]+' on the comparison curve: '+beat.events[selectedEvent][0]+' mL and '+beat.events[selectedEvent][1]+' mm Hg.');
  return {course:'ap2',type:'diagram',reference:'19.4',label:'Afterload and stroke volume',text:facts.join(' '),diagram:{
    id:'ap2-lab-afterload',state,
    question:'Which change in loop width supports your explanation?',prediction,facts}};
}

// Check claims about this particular first beat against the values that drew the curves.
export function checkAfterloadTutorReply(text,context){
  const diagram=context?.diagram,trial=diagram?.state?.trial;
  if(context?.assessmentMode==='exam'||diagram?.id!=='ap2-lab-afterload'||diagram.state.status!=='Prediction checked'||!['higher','lower'].includes(trial))return null;
  const base=beatValues('baseline'),beat=beatValues(trial);
  const allowedVolumes=new Set([0,base.edv,base.esv,base.sv,beat.esv,beat.sv,Math.abs(beat.sv-base.sv)]);
  const statements=String(text).replace(/[*_]/g,'').split(/(?<=[.!?])\s+|\n+/);
  const conflicts=statements.some(line=>{
    if(/\bloop width\s*\(afterload\)|\bafterload\s*\(loop width\)|\bloop width\s+(?:measures|represents|is)\s+(?:the\s+)?afterload\b/i.test(line))return true;
    if(/\b(?:if|hypothetically|suppose|imagine)\b/i.test(line))return false;
    const measured=line.replace(/.*?\b(?:but|whereas|however|in fact|in your trial)\b[, ]*/i,'');
    if(/\b(?:you predicted|your prediction|you expected|you thought|you hypothesi[sz]ed)\b/i.test(measured))return false;
    if(/\b(?:stroke volume|SV) (?:remaining|left in the ventricle|at the end of systole)\b/i.test(measured))return true;
    if([...measured.matchAll(/(-?\d+(?:\.\d+)?)\s*(?:mL|milliliters?|millilitres?)\b/gi)].some(m=>!allowedVolumes.has(Math.abs(Number(m[1])))))return true;
    if(!/\bstroke volume\b|\bSV\b/i.test(measured))return false;
    const pair=measured.match(/(?:stroke volume|\bSV)\s+(?:(?:actually|instead)\s+)?(?:go|went|change[d]?|move[d]?|increase[d]?|rise|rose|decrease[d]?|fall|fell|drop(?:ped)?|decline[d]?)\s+from\s+(\d+(?:\.\d+)?)(?:\s*mL)?\s+to\s+(\d+(?:\.\d+)?)/i);
    if(pair&&(Number(pair[1])!==base.sv||Number(pair[2])!==beat.sv))return true;
    const quantity=measured.match(/\b(?:stroke volume|SV)\s+(?:is|was|equals|became|(?:rose|fell|increased|decreased|dropped)\s+to)\s+(\d+(?:\.\d+)?)\s*mL\b/i);
    if(quantity&&Number(quantity[1])!== (/\bbaseline\b/i.test(measured.slice(0,quantity.index))?base.sv:beat.sv))return true;
    const change=measured.match(/\b(?:stroke volume|SV)\s+(?:rose|fell|increased|decreased|dropped|changed)\s+by\s+(\d+(?:\.\d+)?)\s*mL\b/i);
    if(change&&Number(change[1])!==Math.abs(beat.sv-base.sv))return true;
    const direction=measured.match(/\b(?:stroke volume|SV)\s+(?:actually\s+|instead\s+)?(increased|rose|decreased|fell|remained unchanged|stayed the same)\b/i)?.[1];
    return !!direction&&!(beat.sv<base.sv?/^(decreased|fell)$/i:/^(increased|rose)$/i).test(direction);
  });
  if(!conflicts)return null;
  const outcome=beat.sv<base.sv?'decreased':'increased';
  const predicted=diagram.prediction.replace(/^Stroke volume/,'stroke volume');
  return {reason:'The local reply disagreed with the volumes in this trial.',reference:'19.4',text:
    'You predicted that '+predicted+' In the displayed '+trial+'-afterload beat, stroke volume '+outcome+' from '+base.sv+' mL to '+beat.sv+' mL. Both beats began at '+beat.edv+' mL. The baseline beat ended at '+base.esv+' mL and the comparison beat ended at '+beat.esv+' mL. [S1]\n\nWhich edge of the loop moved, and how does that explain the change in its width?'};
}

export function renderAfterload(){
  return '<h3>How does afterload change a heartbeat?</h3><p>Compare the first beat after a change in aortic pressure. The left ventricle contains 120 mL at the end of filling in every trial. Contractility, ventricular compliance and heart rate stay fixed.</p>'+
    '<label>Compare baseline with <select data-pv-trial><option value="higher">Higher afterload</option><option value="lower">Lower afterload</option></select></label>'+
    '<div data-pv-work></div><small>Illustrative pressures and volumes. <a href="https://openstax.org/books/anatomy-and-physiology-2e/pages/19-4-cardiac-physiology" target="_blank" rel="noreferrer">OpenStax §19.4 ↗</a></small>'+renderMechanismTransfer('afterload');
}
function measureTable(trial){
  const original=beatValues('baseline'),changed=beatValues(trial);
  const rows=changed.events.map(([v,p],i)=>'<tr><th scope="row">'+letters[i]+'</th><td>'+original.events[i][0]+'</td><td>'+original.events[i][1]+'</td><td>'+v+'</td><td>'+p+'</td></tr>').join('');
  return '<details><summary>Read the loop measurements</summary><div class="ap2-table-wrap"><table><caption>Left ventricular measurements at the four corners, in beat order</caption><thead><tr><th scope="col">Point</th><th scope="col">Baseline mL</th><th scope="col">Baseline mm Hg</th><th scope="col">Trial mL</th><th scope="col">Trial mm Hg</th></tr></thead><tbody>'+rows+'</tbody></table></div></details>';
}
export function mountAfterload(root,store){
  let trial='higher',marker=null;
  const localFirst={...store?.read().afterload};
  const work=root.querySelector('[data-pv-work]');
  const publish=()=>setLearningContext(afterloadContext(trial,localFirst[trial],marker));
  function draw(focus=false){
    const first=localFirst[trial],reveal=!!first,beat=beatValues(trial),delta=beat.sv-beatValues('baseline').sv;
    const correct=delta<0?'smaller':'larger';
    work.innerHTML='<p>The baseline beat starts ejecting at 80 mm Hg and ends with 50 mL remaining. In this trial the ventricle must reach '+beat.events[1][1]+' mm Hg to begin ejection.</p>'+
      '<div data-pv-chart>'+chart(trial,reveal,marker)+'</div>'+
      (!reveal?'<h4>Predict the stroke volume compared with baseline.</h4><div class="ac-row">'+predictions.map(v=>'<button type="button" data-pv-predict="'+v+'">'+v[0].toUpperCase()+v.slice(1)+'</button>').join('')+'</div>':
        '<p tabindex="-1" data-pv-result class="ac-note"><strong>'+(first===correct?'Your prediction fits the loop.':'Compare your prediction with the loop.')+'</strong> You predicted '+first+'. The '+trial+' afterload beat ends with '+beat.esv+' mL remaining. Compare the widths at the same starting volume.</p>'+
        '<h4>Locate a valve event</h4><label>Find <select data-pv-event>'+events.map(([title],i)=>'<option value="'+i+'" '+(i===1?'selected':'')+'>'+title+'</option>').join('')+'</select></label><div class="ac-row">'+[...letters].map((l,i)=>'<button type="button" data-pv-point="'+i+'" aria-pressed="false">Point '+l+'</button>').join('')+'</div><p role="status" data-pv-location></p>'+
        measureTable(trial)+'<div class="ac-row"><label>Change in stroke volume (trial − baseline, mL/beat) <input type="number" step="1" inputmode="text" data-pv-delta></label><button type="button" data-pv-check>Check change</button></div><p role="status" data-pv-math></p>'+
        '<div class="ac-row"><button type="button" data-pv-discuss>Discuss my result</button><button type="button" data-pv-switch>Try '+(trial==='higher'?'lower':'higher')+' afterload</button></div>');
    publish();
    if(focus)work.querySelector('[data-pv-result]')?.focus({preventScroll:true});
  }
  const select=root.querySelector('[data-pv-trial]');
  select.onchange=()=>{trial=select.value;marker=null;draw();};
  work.addEventListener('change',ev=>{
    if(!ev.target.matches('[data-pv-event]'))return;
    marker=null;work.querySelector('[data-pv-chart]').innerHTML=chart(trial,true,null);
    work.querySelector('[data-pv-location]').textContent='';
    for(const b of work.querySelectorAll('[data-pv-point]'))b.setAttribute('aria-pressed','false');
    publish();
  });
  work.addEventListener('click',ev=>{
    const hit=ev.target.closest('[data-pv-graph-point]');
    if(hit){work.querySelector('[data-pv-point="'+hit.dataset.pvGraphPoint+'"]').click();return;}
    const btn=ev.target.closest('button');
    if(!btn)return;
    if(btn.hasAttribute('data-pv-predict')){
      const choice=btn.dataset.pvPredict;
      if(store){
        const next=store.update(r=>{(r.afterload||={})[trial]??=choice;});
        localFirst[trial]=next.afterload[trial];
      }else localFirst[trial]=choice;
      draw(true);
    }else if(btn.hasAttribute('data-pv-point')){
      marker=Number(btn.dataset.pvPoint);
      const goal=Number(work.querySelector('[data-pv-event]').value);
      work.querySelector('[data-pv-chart]').innerHTML=chart(trial,true,marker);
      for(const b of work.querySelectorAll('[data-pv-point]'))b.setAttribute('aria-pressed',String(b===btn));
      work.querySelector('[data-pv-location]').textContent=(goal===marker?'Correct. ':'Try another point. ')+events[marker][0]+'. '+events[marker][1];
      publish();
    }else if(btn.hasAttribute('data-pv-check')){
      const input=work.querySelector('[data-pv-delta]'),beat=beatValues(trial),base=beatValues('baseline');
      const msg=input.value===''?'Enter a signed change in mL per beat.':Number(input.value)===beat.sv-base.sv?
        'Correct. Trial '+beat.sv+' − baseline '+base.sv+' = '+(beat.sv-base.sv)+' mL/beat.':'For each loop, subtract the remaining volume from 120 mL. Then subtract baseline stroke volume from the trial stroke volume.';
      work.querySelector('[data-pv-math]').textContent=msg;
    }else if(btn.hasAttribute('data-pv-discuss'))discussWinterObservation(afterloadContext(trial,localFirst[trial],marker));
    else if(btn.hasAttribute('data-pv-switch')){select.value=trial==='higher'?'lower':'higher';select.onchange();select.focus();}
  });
  draw();
  mountMechanismTransfer(root,'afterload',store);
}
