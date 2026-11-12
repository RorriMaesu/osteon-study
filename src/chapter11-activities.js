import {chapter11Muscles} from './chapter11-muscles.js';
import {muscleFigureTargets} from './muscle-figure-targets.js';
import {setDiagramLearningContext,setLearningContext} from './learning-context.js';
import {newMuscleCardView,saveCardReview,saveNamedRecall} from './muscle-study-state.js';
import {getProgress} from './storage.js';
import {assessTyped,outcomeCorrect} from './typed-answer.js';

export function renderChapter11Activity(root,lesson,e,{openFigure,openAtlas,saved,onSave}){
 root.closest('.flow-body')?.classList.add('muscle-interactive-step');
 if(lesson.id==='11.2'){renderNames(root,lesson,e);return;}
 const state={...newMuscleCardView(lesson.id==='11.1'?'activity':'cards'),...saved};
 const save=()=>onSave?.({...state});
 if(lesson.id==='11.1'){
  root.innerHTML='<div class="control-row" aria-label="Section activities"><button type="button" data-muscle-tab="activity">Lever lab</button><button type="button" data-muscle-tab="cards">Muscle and tissue cards</button></div><div data-muscle-tab-content></div>';
  const body=root.querySelector('[data-muscle-tab-content]');
  function show(){
   root.querySelectorAll('[data-muscle-tab]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.muscleTab===state.tab)));
   if(state.tab==='activity')renderLever(body,lesson);
   else renderCards(body,lesson,e,{openFigure,openAtlas,state,save});
  }
  root.querySelectorAll('[data-muscle-tab]').forEach(button=>button.onclick=()=>{state.tab=button.dataset.muscleTab;save();show();});
  show();return;
 }
 renderCards(root,lesson,e,{openFigure,openAtlas,state,save});
}

function renderCards(root,lesson,e,{openFigure,openAtlas,state,save}){
 const available=chapter11Muscles.filter(card=>card.section===lesson.id);
 root.innerHTML=`<h3>Muscle cards</h3><div class="control-row muscle-card-filters">
  <label for="muscle-card-scope">Study set</label><select id="muscle-card-scope"><option value="course">Course checklist</option><option value="all">All cards in this section</option><option value="revisit">Due for review</option></select>
  <label class="sr-only" for="muscle-card-search">Find a muscle card</label><input type="search" id="muscle-card-search" maxlength="120" placeholder="Find a muscle or action" value="${e(state.query)}"></div>
  <div data-muscle-card-body></div>`;
 root.querySelector('#muscle-card-scope').value=state.scope;
 const body=root.querySelector('[data-muscle-card-body]');
 let notice='';
 const clearName=()=>{state.nameResponse='';state.nameFeedback='';state.nameAssisted=false;};
 const markHelp=()=>{if(state.naming&&!state.revealed){state.nameAssisted=true;save();}};
 function render(){
  const due=getProgress().cards;
  const items=available.filter(card=>(state.scope==='all'||state.scope==='course'&&card.courseChecklist||state.scope==='revisit'&&due[card.id]?.due<=Date.now())&&
    [card.name,card.action,card.location,...card.aliases].join(' ').toLowerCase().includes(state.query.trim().toLowerCase()));
  const active=Math.max(0,items.findIndex(card=>card.id===state.id));
  const card=items[active];
  if(!card){
   body.innerHTML='<p role="status">'+(state.scope==='revisit'?'No matching cards are due. Choose another study set to keep practicing.':'No matching cards. Try another search or study set.')+'</p>';
   setLearningContext({type:'lesson',label:lesson.title,reference:lesson.id,text:lesson.objective});
   return;
  }
  state.id=card.id;save();
  const tissue=card.kind==='connective tissue';
  const facts=[['Location',card.location],[tissue?'Function':'Main action',card.action],
   [tissue?'Proximal relationship':'General origin',card.origin],[tissue?'Distal relationship':'General insertion',card.insertion]];
  if(card.members?.length)facts.push(['Members',Array.isArray(card.members)?card.members.join(', '):card.members]);
  const figures=card.figures||[];
  const marked=Object.entries(muscleFigureTargets).find(([,target])=>figures.includes(target.figure)&&
   [card.name,...card.aliases].some(name=>[target.name,...target.aliases].some(value=>name.toLowerCase()===value.toLowerCase())));
  const figure=marked?.[1].figure||figures[0];
  const naming=state.recall&&state.naming;
  const show=!state.recall||state.revealed;
  const answerNames=[card.name,...card.aliases].map(name=>name.toLowerCase());
  const clue=[card.location,card.action,card.origin,card.insertion].find(value=>
   answerNames.every(name=>!value.toLowerCase().includes(name)))||'Identify the structure from its region and attachments. '+card.origin;
  body.innerHTML=`<div class="control-row muscle-card-navigation">
   <button type="button" data-card-prev aria-label="Previous muscle" ${active===0?'disabled':''}>←</button>
   <label class="sr-only" for="muscle-card-select">Choose a muscle card</label><select id="muscle-card-select">${items.map((item,i)=>`<option value="${i}" ${i===active?'selected':''}>${naming?'Card '+(i+1):e(item.name)}</option>`).join('')}</select>
   <button type="button" data-card-next aria-label="Next muscle" ${active===items.length-1?'disabled':''}>→</button><span class="tiny">${active+1} / ${items.length}</span>
   <button type="button" data-card-recall aria-pressed="${state.recall}">${state.recall&&!naming?'End recall':tissue?'Recall location and function':'Recall action and attachments'}</button><button type="button" data-card-name-mode aria-pressed="${naming}">${naming?'End name recall':'Recall name'}</button></div>
   <article class="muscle-study-card"><h4>${naming&&!state.revealed?'Identify the structure':e(card.name)}</h4>
   ${card.kind!=='muscle'?'<p class="tiny">'+e(card.kind)+(card.courseLabel&&!naming?' · '+e(card.courseLabel):'')+'</p>':''}
   ${naming&&!state.revealed?`<p>${e(clue)}</p><form class="control-row muscle-figure-answer" data-card-name-form><label for="muscle-name-response">Anatomical name</label><input id="muscle-name-response" maxlength="120" autocomplete="off" value="${e(state.nameResponse)}" required><button type="submit">Check</button><button type="button" data-card-reveal-name>Reveal name</button></form><p role="status">${e(state.nameFeedback)}</p>`:show?`<dl>${facts.map(([label,text])=>`<div><dt>${label}</dt><dd>${e(text)}</dd></div>`).join('')}</dl>${card.sourceNotes&&!card.sourceNotes.startsWith('General attachment regions for study')?'<p class="tiny">'+e(card.sourceNotes)+'</p>':''}`:
    '<p>'+ (tissue?'Say where it lies and how it transmits force or supports adjacent structures.':'Say where it lies, its main action, and both general attachment sites.') +'</p><button type="button" data-card-reveal>Reveal card</button>'}
   ${state.recall&&state.revealed&&!naming?'<div class="control-row"><button type="button" data-card-rate="1">Practice again</button><button type="button" data-card-rate="3">I recalled it</button></div>':''}
   <p class="tiny" role="status" data-card-status>${e(notice)}</p>
   <div class="control-row">${figure&&(!naming||state.revealed)?`<button type="button" data-card-figure>${marked?'Locate on figure':'Open figure'} ${figure} ↗</button>`:''}
   ${card.region&&(!naming||state.revealed)?`<button type="button" data-card-atlas>Open 3D region ↗</button>`:''}<button type="button" data-card-tutor>Ask the tutor</button></div></article>`;
  function advance(to,selector){
   state.id=items[to].id;state.revealed=false;clearName();notice='';render();
   const control=body.querySelector(selector);(control?.disabled?body.querySelector('#muscle-card-select'):control)?.focus();
  }
  body.querySelector('[data-card-prev]').onclick=()=>advance(active-1,'[data-card-prev]');
  body.querySelector('[data-card-next]').onclick=()=>advance(active+1,'[data-card-next]');
  body.querySelector('#muscle-card-select').onchange=ev=>advance(+ev.target.value,'#muscle-card-select');
  body.querySelector('[data-card-recall]').onclick=()=>{state.recall=!(state.recall&&!state.naming);state.naming=false;state.revealed=false;clearName();notice='';render();body.querySelector('[data-card-recall]')?.focus();};
  body.querySelector('[data-card-name-mode]').onclick=()=>{
   state.naming=!naming;state.recall=state.naming;state.revealed=false;clearName();notice='';render();
   (body.querySelector('#muscle-name-response')||body.querySelector('[data-card-name-mode]'))?.focus();
  };
  const form=body.querySelector('[data-card-name-form]');
  if(form){
   const input=form.querySelector('input');
   input.oninput=()=>{state.nameResponse=input.value;state.nameFeedback='';save();updateContext();};
   form.onsubmit=ev=>{
    ev.preventDefault();
    if(!state.nameResponse.trim()||state.nameFeedback)return;
    const result=assessTyped({id:card.id,answer:card.name,aliases:card.aliases},state.nameResponse);
    const correct=outcomeCorrect(result);
    saveNamedRecall(card.id,lesson.id,result,state.nameAssisted);
    if(!correct&&result.status!=='pending')state.nameAssisted=true;
    state.revealed=correct;
    state.nameFeedback=correct?(result.status==='spelling'?'Correct. Standard spelling: ':'Correct. ')+card.name+'.':'Try a more specific name, or reveal the card.';
    notice=correct?state.nameFeedback:'';render();
    (body.querySelector('#muscle-name-response')||body.querySelector('[data-card-next]:enabled')||body.querySelector('[data-card-name-mode]'))?.focus();
   };
   form.querySelector('[data-card-reveal-name]').onclick=()=>{
    if(!state.nameAssisted||!getProgress().cards[card.id])saveNamedRecall(card.id,lesson.id,{status:'incorrect'},true);
    state.revealed=true;notice='Saved for another review.';render();body.querySelector('[data-card-name-mode]').focus();
   };
  }
  const reveal=body.querySelector('[data-card-reveal]');
  if(reveal)reveal.onclick=()=>{state.revealed=true;render();body.querySelector('[data-card-rate]')?.focus();};
  body.querySelectorAll('[data-card-rate]').forEach(button=>button.onclick=()=>{
   const rating=+button.dataset.cardRate;saveCardReview(card,rating);
   notice=rating===1?'Scheduled for another review.':'Self-check saved.';
   body.querySelector('[data-card-status]').textContent=notice;
   body.querySelectorAll('[data-card-rate]').forEach(b=>b.disabled=true);
   body.querySelector('[data-card-next]:enabled, [data-card-recall]')?.focus();
  });
  const figureButton=body.querySelector('[data-card-figure]');if(figureButton)figureButton.onclick=()=>openFigure(figure,marked?.[0]);
  const atlasButton=body.querySelector('[data-card-atlas]');if(atlasButton)atlasButton.onclick=()=>openAtlas(card.region);
  body.querySelector('[data-card-tutor]').onclick=()=>{updateContext();document.getElementById('tutor-launch')?.click();};
  function updateContext(){setDiagramLearningContext({id:card.id,title:naming&&!state.revealed?'Identify the structure':card.name,reference:lesson.id,state:{mode:naming?'name recall':state.recall?'recall':'study'},
   question:naming?'Which structure fits this description? '+clue:tissue?'Where does '+card.name+' lie, and what does it help support or connect?':'Where is '+card.name+', and how do its general attachments support its main action?',
   hint:naming?'Compare the anatomical region with the function given in the clue.':tissue?'Think about the structures on either side of the tissue.':'Use one nearby landmark to orient yourself, then follow the direction of pull.',
   answer:naming?card.name:facts.map(([label,text])=>label+' · '+text).join(' '),prediction:naming?state.nameResponse:'',
   facts:[...facts.map(([label,text])=>label+' · '+text),card.sourceNotes||'']});}
  updateContext();
 }
 body.addEventListener('musclestudyhelp',markHelp);
 root.querySelector('#muscle-card-scope').onchange=ev=>{state.scope=ev.target.value;state.id='';state.revealed=false;clearName();notice='';save();render();};
 root.querySelector('#muscle-card-search').oninput=ev=>{state.query=ev.target.value;state.id='';state.revealed=false;clearName();notice='';save();render();};
 render();
}

const levers=[
 {name:'First class · head balance',effort:100,load:-110,limits:[45,150],fact:'The fulcrum lies between effort and load.'},
 {name:'Second class · heel raise',effort:216,load:107,limits:[168,245],fact:'The load lies between fulcrum and effort.'},
 {name:'Third class · elbow flexion',effort:70,load:204,limits:[30,150],fact:'The effort lies between fulcrum and load.'},
];
function renderLever(root,lesson) {
 let index=2;
 let effort=levers[index].effort;
 root.innerHTML=`<h3>Where is the force applied?</h3><div class="control-row"><label for="lever-type">Lever example</label><select id="lever-type">${levers.map((lever,i)=>`<option value="${i}" ${i===index?'selected':''}>${lever.name}</option>`).join('')}</select></div>
 <div class="muscle-lab"><div class="muscle-lab-visual" data-lever-picture></div><div>
 <p>Predict what happens to the effort needed when the muscle pulls farther from the joint.</p>
 <label for="lever-effort">Move the effort farther from the fulcrum</label><input type="range" id="lever-effort"><p data-lever-result aria-live="polite"></p>
 <p class="tiny">This schematic assumes perpendicular forces and a fixed load. Distances and forces use relative units.</p></div></div>`;
 const slider=root.querySelector('#lever-effort');
 function paint(){
  const item=levers[index], fulcrum=index===0?170:57;
  const ratio=Math.abs(item.load)/effort;
  const ex=fulcrum+effort,lx=fulcrum+item.load;
  const loadUp=index!==0;
  root.querySelector('[data-lever-picture]').innerHTML=`<svg viewBox="0 0 390 150" role="img" aria-label="${item.fact} Effort arm ${effort}; load arm ${Math.abs(item.load)}.">
   <line x1="30" x2="360" y1="82" y2="82" stroke="#d6e7d5" stroke-width="8" stroke-linecap="round"/>
   <path d="M${fulcrum-12} 108 L${fulcrum} 87 L${fulcrum+12} 108Z" fill="#f3ae87"/><text x="${fulcrum}" y="135" text-anchor="middle" fill="#e9f2ea">Fulcrum</text>
   <path d="M${ex} ${loadUp?121:36}V${loadUp?89:75}" stroke="#8eddbb" stroke-width="5"/><circle cx="${ex}" cy="82" r="6" fill="#8eddbb"/><text x="${ex}" y="${loadUp?145:25}" text-anchor="middle" fill="#8eddbb">Effort</text>
   <path d="M${lx} 38V74" stroke="#f3ae87" stroke-width="5"/><circle cx="${lx}" cy="82" r="6" fill="#f3ae87"/><text x="${lx}" y="25" text-anchor="middle" fill="#f3ae87">Load</text></svg>`;
  root.querySelector('[data-lever-result]').textContent=item.fact+' Balancing effort is '+ratio.toFixed(2)+' times the load.';
  setDiagramLearningContext({id:'muscle-levers',title:item.name,reference:lesson.id,state:{effortArm:effort,loadArm:Math.abs(item.load)},
   question:'How does increasing the effort arm change the force required to balance the load?',
   hint:'Compare the same load torque with the two effort distances.',
   answer:'A longer effort arm needs less force to supply the same torque.',facts:[item.fact,'Torque equals force times its perpendicular moment arm.']});
 }
 function configure(){const item=levers[index];[slider.min,slider.max]=item.limits;slider.value=effort;paint();}
 root.querySelector('#lever-type').onchange=ev=>{index=+ev.target.value;effort=levers[index].effort;configure();};
 slider.oninput=()=>{effort=+slider.value;paint();};
 configure();
}

const names=[
 ['Flexor digitorum profundus',[['Flexor','bends a joint'],['Digitorum','of the digits'],['Profundus','deep']],'Deep finger flexor. Compare its position with flexor digitorum superficialis.'],
 ['Sternocleidomastoid',[['Sterno','sternum'],['Cleido','clavicle'],['Mastoid','mastoid process']],'The name lists attachments at the sternum, clavicle and mastoid process.'],
 ['Extensor hallucis longus',[['Extensor','straightens a joint'],['Hallucis','of the great toe'],['Longus','long']],'Long extensor of the great toe. Pollicis would refer to the thumb.'],
 ['Tibialis anterior',[['Tibialis','near the tibia'],['Anterior','toward the front']],'A muscle along the front of the leg, next to the tibia.'],
];
function renderNames(root,lesson,e) {
 let current=0;
 root.innerHTML=`<h3>Decode the name</h3><div class="control-row"><label for="muscle-name-example">Example</label><select id="muscle-name-example">${names.map(([name],i)=>`<option value="${i}">${e(name)}</option>`).join('')}</select></div><div data-word-parts></div>`;
 function render(){
  const [name,parts,explanation]=names[current];
  const region=root.querySelector('[data-word-parts]');
  region.innerHTML=`<p>Predict what each part describes. Choose a word to check.</p><div class="control-row">${parts.map(([word],i)=>`<button data-name-part="${i}" type="button" aria-pressed="false">${e(word)}</button>`).join('')}</div><p data-name-meaning aria-live="polite"></p><details><summary>Read the complete interpretation</summary><p>${e(explanation)}</p></details>`;
  region.querySelectorAll('[data-name-part]').forEach(button=>button.onclick=()=>{
   const [word,meaning]=parts[Number(button.dataset.namePart)];
   region.querySelectorAll('[data-name-part]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
   region.querySelector('[data-name-meaning]').textContent=word+' means '+meaning+'.';
   setDiagramLearningContext({id:'muscle-name',title:name,reference:lesson.id,state:{selected:word},question:'What does '+word+' tell you about this muscle?',answer:meaning,facts:[explanation]});
  });
  setDiagramLearningContext({id:'muscle-name',title:name,reference:lesson.id,state:{example:name},question:'What can you infer from the parts of '+name+'?',answer:explanation,facts:parts.map(([word,meaning])=>word+' means '+meaning+'.')});
 }
 root.querySelector('#muscle-name-example').onchange=ev=>{current=+ev.target.value;render();};
 render();
}
