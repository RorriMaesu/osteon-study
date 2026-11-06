import {foundationCases} from './foundations-cases.js';
import {foundationExperiments} from './foundations-experiments.js';

function renderCases(root,items,e){
 let index=0;
 function draw(){
  const {prompt,choices,visual}=items[index];
  const shift=(index+1)%choices.length;
  const ordered=choices.slice(shift).concat(choices.slice(0,shift));
  root.innerHTML=`<div class="eyebrow">APPLY THE CONCEPT · CASE ${index+1} OF ${items.length}</div><h3 tabindex="-1">${e(prompt)}</h3>${visual?.html||''}<div class="foundation-case-choices" role="group" aria-label="Choose your prediction">${ordered.map(([answer],i)=>`<button type="button" data-case-answer="${i}" aria-pressed="false">${e(answer)}</button>`).join('')}</div><p class="foundation-case-feedback" role="status">Choose an answer to see why it fits or where the reasoning changes.</p><div class="control-row"><button type="button" data-case-next>${index===items.length-1?'Start cases again':'Next case →'}</button></div>`;
  const buttons=[...root.querySelectorAll('[data-case-answer]')];
  const feedback=root.querySelector('[role="status"]');
  buttons.forEach((button,i)=>button.onclick=()=>{
   const [answer,why]=ordered[i],correct=answer===choices[0][0];
   buttons.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
   feedback.textContent=`${correct?'Correct.':'Try again.'} ${why}`;
   feedback.dataset.result=correct?'correct':'retry';
  });
  root.querySelector('[data-case-next]').onclick=()=>{index=(index+1)%items.length;draw();root.querySelector('h3').focus({preventScroll:true});};
 }
 draw();
}

export function mountFoundationChallenges(root,section,e,renderStudy){
 const cases=foundationCases[section],experiment=foundationExperiments[section];
 if(!cases&&!experiment)return false;
 const modes=[['study','Study views',renderStudy],...(experiment?[['experiment',experiment.label,experiment.mount]]:[]),...(cases?[['cases','Apply it',panel=>renderCases(panel,cases,e)]]:[])];
 root.innerHTML=`<div class="foundation-challenge-toolbar"><nav class="control-row foundation-challenge-tabs" aria-label="Ways to explore this lesson">${modes.map(([key,name])=>`<button type="button" data-foundation-challenge="${key}" aria-pressed="false">${name}</button>`).join('')}</nav><div class="foundation-study-subnav" hidden></div></div><div class="foundation-challenge-panel"></div>`;
 const container=root.lastElementChild;
 const studySubnav=root.querySelector('.foundation-study-subnav');
 const buttons=[...root.querySelectorAll('[data-foundation-challenge]')];
 const panels=new Map();
 function open(key){
  buttons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.foundationChallenge===key)));
  if(!panels.has(key)){
   const panel=document.createElement('div');
   panel.className=key==='experiment'?'foundation-experiment':key==='cases'?'foundation-case':'';
   panels.set(key,panel);
   container.replaceChildren(panel);
   modes.find(mode=>mode[0]===key)[2](panel);
   const subnav=key==='study'&&panel.querySelector('.section-diagram-nav');
   if(subnav)studySubnav.append(subnav);
  }else if(container.firstElementChild!==panels.get(key))container.replaceChildren(panels.get(key));
  studySubnav.hidden=key!=='study'||!studySubnav.firstElementChild;
 }
 buttons.forEach(button=>button.onclick=()=>open(button.dataset.foundationChallenge));
 open('study');
 return true;
}
