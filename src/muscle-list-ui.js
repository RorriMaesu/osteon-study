import {muscleChecklistTargets,muscleChecklistQuestionsFor,muscleChecklistBank} from './muscle-checklist-bank.js';
import {validSession} from './exam-core.js';
import {muscleRegions} from './muscle-data.js';
import {courseMuscleTargetById} from './muscle-spatial-data.js';
import {muscleListPreviewTarget} from './muscle-list-preview-targets.js';
import {muscleListOpenStaxFigure} from './muscle-list-openstax.js';
import {mountMuscleStudyModel} from './muscle-list-model.js';
import {muscleStudyModels} from './muscle-list-model-data.js';
import {muscleWorksheetTargets} from './muscle-worksheet-data.js';
import {getProgress,shuffle} from './storage.js';
import {saveCardReview} from './muscle-study-state.js';
import {setDiagramLearningContext,setLearningContext,setTutorAssessmentMode} from './learning-context.js';
import {mountMock4Pages} from './mock-exam4-pages.js';

const nameId=card=>'mc11-'+card.id.replace(/^ch11-/,'')+'-name';
const cards=muscleChecklistTargets;
const regionName=id=>muscleRegions[id]||id.replaceAll('-',' ');
const regions=Object.keys(muscleRegions).filter(region=>cards.some(card=>card.region===region));
const diagramIds=new Set(Object.values(muscleWorksheetTargets).map(target=>target.termId));
const checklistQuestionIds=new Set(muscleChecklistBank.map(question=>question.id));
function savedDrill(){
 try{
  const saved=JSON.parse(localStorage.getItem('osteon-exams-v1'))?.active;
  return saved?.status==='active'&&saved.ids?.length&&saved.ids.every(id=>checklistQuestionIds.has(id))&&validSession(saved,muscleChecklistBank)?saved:null;
 }catch{return null;}
}

export function initMuscleList({setView,dialog,toast,escape:e}){
 const root=document.getElementById('practice-view');
 const state={mode:'learn',region:'',card:cards[0].id,kind:'name',length:'10',scope:'all'};
 let layout=null,notice='';
 const active=()=>location.hash==='#muscle-list';
 const selected=()=>cards.filter(card=>!state.region||card.region===state.region);
 function latestNames(){
  const known=new Set(cards.map(nameId)),latest=new Map();
  for(const attempt of getProgress().attempts)if(known.has(attempt.id)&&!attempt.selfRated)latest.set(attempt.id,attempt);
  return latest;
 }
 function available(){
  const latest=latestNames();
  return selected().filter(card=>state.scope==='all'||!latest.get(nameId(card))?.correct||latest.get(nameId(card))?.assisted);
 }
 function queue(targets=available()){
  return muscleChecklistQuestionsFor(targets.map(card=>card.id),{kind:state.kind});
 }
 function open(){render();}
 function previewImage(card,preview){
  return `<img src="${e(preview.src)}" alt="${e(card.name+' · '+preview.caption)}" decoding="async">`;
 }
 function previewCaption(preview){
  const source=preview.sourceUrl?` · <a href="${e(preview.sourceUrl)}" target="_blank" rel="noreferrer">${e(preview.sourceLabel)}</a>`:'';
  return `<figcaption>${e(preview.caption)}${source}</figcaption>`;
 }
 function previewFigure(card,preview){
  return `<figure class="muscle-list-preview">
   <button type="button" data-list-action="preview" aria-haspopup="dialog" aria-label="Enlarge preview of ${e(card.name)}" title="Enlarge preview">
    ${previewImage(card,preview)}<span class="muscle-list-expand" aria-hidden="true">⛶</span>
   </button>${previewCaption(preview)}</figure>`;
 }
 function openEnlargedPreview(card){
  const preview=muscleListPreviewTarget(card.id);
  dialog(`<div class="figure-zoom muscle-list-enlarged">
   <h2>${e(card.name)}</h2>
   <figure>
    <div class="muscle-list-enlarged-stage">${previewImage(card,preview)}<span role="status">Loading preview…</span></div>
    ${previewCaption(preview)}
   </figure>
   ${preview.note?`<p>${e(preview.note)}</p>`:''}
   <div class="control-row"><button type="button" data-preview-3d>Rotate in 3D</button></div>
  </div>`);
  const panel=document.querySelector('.muscle-list-enlarged');
  const image=panel.querySelector('img'),status=panel.querySelector('[role="status"]');
  function showImageStatus(){
   if(!image.complete)return;
   if(image.naturalWidth)status.hidden=true;
   else{
    image.hidden=true;
    status.textContent='Preview image unavailable. Use Rotate in 3D to see this structure.';
   }
  }
  image.addEventListener('load',showImageStatus,{once:true});
  image.addEventListener('error',showImageStatus,{once:true});
  showImageStatus();
  panel.querySelector('[data-preview-3d]').onclick=()=>{
   const box=panel.closest('dialog');
   box.addEventListener('close',()=>openStudyModel(card),{once:true});
   box.close();
  };
 }
 function openTextbookFigure(card){
  const figure=muscleListOpenStaxFigure(card.id);
  const id='muscle-list-textbook-image';
  const {number,supplement}=figure;
  function markup(supplementOpen){
   const plate=supplementOpen?supplement:figure;
   const {src,width,height,annotation}=plate;
   const bounds=plate.panel||[0,0,width,height];
   const heading=supplementOpen?plate.label:'OpenStax Figure '+number+' · '+plate.label;
   const marker=annotation
    ?`<circle cx="${annotation.point[0]}" cy="${annotation.point[1]}" r="${Math.max(6,bounds[2]*.012)}" fill="none" stroke="#85500e" stroke-width="3" vector-effect="non-scaling-stroke"/>`
    :'';
   const picture=plate.directImage
    ?`<img id="${id}" src="${e(src)}" width="${width}" height="${height}" alt="${e(heading)}">
     <p class="muscle-list-textbook-status" role="status">Loading diagram…</p>`
    :`<svg id="${id}" viewBox="${bounds.join(' ')}" role="img" aria-label="${e(heading)}">
      <image href="${e(src)}" width="${width}" height="${height}"/>${marker}
     </svg>`;
   const credit=supplementOpen
    ?`<a href="${e(plate.url)}" target="_blank" rel="noreferrer">Original illustration ↗</a> · ${e(plate.license||'Public domain')}`
    :`<a href="${e(figure.sourceUrl)}" target="_blank" rel="noreferrer">Access for free at OpenStax ↗</a> · <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/" target="_blank" rel="noreferrer">CC BY-NC-SA 4.0</a>`;
   return `<div class="figure-zoom muscle-list-textbook">
   <h2>${e(card.name)}</h2>
   <p class="figure-zoom-prompt">${e(heading)}</p>
   <figure class="exam-figure">
    <div class="muscle-list-textbook-plate" tabindex="0" aria-label="Textbook image. When enlarged, scroll to read the labels.">
     ${picture}
    </div>
    <figcaption>${annotation?`<strong>Osteon marker · ${e(annotation.label)}.</strong> `:''}${plate.note?`${e(plate.note)} `:''}
     ${supplement&&!supplement.src?`<a href="${e(supplement.url)}" target="_blank" rel="noreferrer">${e(supplement.label)} ↗</a> · `:''}${credit}
    </figcaption>
   </figure>
   <div class="control-row"><button type="button" id="muscle-list-textbook-zoom" aria-controls="${id}" aria-pressed="false" ${plate.directImage?'disabled':''}>Magnify labels</button>
    ${supplement?.src?`<button type="button" id="muscle-list-textbook-switch">${supplementOpen?'Show OpenStax figure':'Show labeled supplement'}</button>`:''}
   </div>
  </div>`;
  }
  function wire(supplementOpen){
   const zoom=document.getElementById('muscle-list-textbook-zoom');
   const picture=document.getElementById(id),plate=picture.parentElement;
   const status=plate.querySelector('[role="status"]');
   if(status){
    const update=()=>{
     if(!picture.complete)return;
     const loaded=picture.naturalWidth>0;
     zoom.disabled=!loaded;
     picture.hidden=!loaded;
     status.hidden=loaded;
     if(!loaded)status.textContent='The diagram could not load. Open the linked OpenStax figure below.';
    };
    picture.addEventListener('load',update,{once:true});
    picture.addEventListener('error',update,{once:true});
    update();
   }
   zoom.onclick=()=>{
    const enlarged=plate.classList.toggle('magnified');
    zoom.setAttribute('aria-pressed',String(enlarged));zoom.textContent=enlarged?'Fit diagram':'Magnify labels';
    if(enlarged)plate.focus({preventScroll:true});
    else plate.scrollTo(0,0);
   };
   const alternate=document.getElementById('muscle-list-textbook-switch');
   if(alternate)alternate.onclick=()=>{
    document.getElementById('dialog-content').innerHTML=markup(!supplementOpen);
    wire(!supplementOpen);
    document.getElementById('muscle-list-textbook-switch').focus();
   };
  }
  dialog(markup(false));
  wire(false);
 }
 function openStudyModel(card){
  const model=muscleStudyModels[card.id];
  if(!model){
   document.dispatchEvent(new CustomEvent('openmusclespatial',{detail:{termId:card.id,mode:'study',from:'muscle-list'}}));
   return;
  }
  dialog(`<div class="figure-zoom muscle-list-model">
   <h2>${e(card.name)}</h2><p class="figure-zoom-prompt">${e(model.kind)}</p>
   <div class="muscle-list-model-stage" tabindex="0" aria-label="Use arrow keys to rotate this 3D model. Use plus and minus to zoom.">
    <img src="${e(muscleListPreviewTarget(card.id).src)}" alt="${e(card.name)}">
    <span role="status">Loading 3D model…</span>
   </div>
   <p class="muscle-list-model-note">${e(model.note)} <a href="${e(model.sourceUrl)}" target="_blank" rel="noreferrer">${e(model.sourceLabel)} ↗</a></p>
   <div class="control-row"><button type="button" data-model-turn="-1" aria-label="Rotate left">←</button><button type="button" data-model-turn="1" aria-label="Rotate right">→</button><button type="button" data-model-zoom="1.2" aria-label="Zoom out">−</button><button type="button" data-model-zoom=".83" aria-label="Zoom in">+</button><button type="button" data-model-reset>Reset view</button></div>
  </div>`);
  mountMuscleStudyModel(document.querySelector('.muscle-list-model'),model);
 }
 function render(){
  const prior=layout?.selection();layout?.close();layout=null;
  delete document.body.dataset.examActive;
  delete document.body.dataset.mockExamActive;
  delete document.body.dataset.precisionActive;
  document.body.dataset.muscleListActive='true';
  document.body.dataset.conceptActive='true';
  setTutorAssessmentMode(null);
  setView('practice',{route:'muscle-list'});
  const items=selected();
  if(!items.some(card=>card.id===state.card))state.card=items[0]?.id;
  const card=items.find(item=>item.id===state.card),index=items.indexOf(card);
  const spatial=courseMuscleTargetById.get(card?.id);
  const hasModel=muscleStudyModels[card?.id]||spatial?.componentIds.length;
  const latest=latestNames();
  const studied=new Set(getProgress().attempts.filter(a=>a.mode==='muscle-card'&&a.selfRated).map(a=>a.id));
  const recalled=items.filter(item=>{const a=latest.get(nameId(item));return a?.correct&&!a.assisted;}).length;
  const draft=savedDrill();
  root.innerHTML=`<section class="muscle-list-shell" aria-label="Required muscle list">
   <header class="muscle-list-header"><div><span class="eyebrow">BI 231 / YOUR PROFESSOR’S LIST</span><h1>Required muscle list</h1></div><button data-list-action="exit">Practice Lab</button></header>
   <div class="muscle-list-controls"><div class="muscle-list-tabs" aria-label="Study or quiz"><button data-list-mode="learn" aria-pressed="${state.mode==='learn'}">Learn the list</button><button data-list-mode="quiz" aria-pressed="${state.mode==='quiz'}">Quiz me</button></div><label for="required-muscle-region">Region<select id="required-muscle-region"><option value="">All ${cards.length} entries</option>${regions.map(region=>`<option value="${region}" ${state.region===region?'selected':''}>${e(regionName(region))}</option>`).join('')}</select></label></div>
   <p class="muscle-list-progress">${items.filter(item=>studied.has(item.id)).length}/${items.length} cards reviewed · ${recalled}/${items.length} names last recalled independently</p>
   ${draft?`<button class="muscle-list-resume" data-list-action="resume">Resume saved drill · question ${draft.index+1}/${draft.ids.length} ↗</button>`:''}
   ${state.mode==='learn'?`<div class="muscle-list-card-tools">
    <div class="muscle-list-picker"><button data-list-action="previous" aria-label="Previous entry" ${index<=0?'disabled':''}>←</button><label class="sr-only" for="required-muscle-entry">Choose required entry</label><select id="required-muscle-entry">${items.map((item,i)=>`<option value="${item.id}" ${item.id===state.card?'selected':''}>${i+1}. ${e(item.name)}</option>`).join('')}</select><button data-list-action="next" aria-label="Next entry" ${index>=items.length-1?'disabled':''}>→</button></div>
    <div class="muscle-list-reference-actions">${hasModel?'<button type="button" data-list-action="study-model">View in 3D</button>':''}<button type="button" data-list-action="textbook">OpenStax diagram</button></div>
   </div>`:''}
   <article class="muscle-list-panel"><div class="muscle-list-frame"></div></article>
   <div class="muscle-list-bottom">${state.mode==='learn'?`<button data-list-action="again">Review again</button><button data-list-action="reviewed">Card reviewed</button><button class="primary" data-list-action="quiz-one">Quiz this name ↗</button>`:'<button data-list-action="learn">Return to cards</button><button class="primary" data-list-action="start">Start name drill ↗</button>'}</div>
  </section>`;
  root.onclick=click;root.onchange=change;root.oninput=null;root.onkeydown=null;
  const frame=root.querySelector('.muscle-list-frame');
  if(state.mode==='learn'){
   const tissue=card.kind==='connective tissue';
   const members=Array.isArray(card.members)?cards.filter(item=>card.members.includes(item.name)).map(item=>item.id):[];
   const diagram=diagramIds.has(card.id)||members.some(id=>diagramIds.has(id));
   const preview=muscleListPreviewTarget(card.id);
   frame.innerHTML=`${previewFigure(card,preview)}<h2>${e(card.name)}</h2><p class="muscle-list-meta">${e(regionName(card.region))} · ${e(card.kind)}${card.courseLabel?' · List wording: '+e(card.courseLabel):''}</p>
    <h3>Where to find it</h3><p>${e(card.location)}</p><h3>${tissue?'What it supports or connects':'Main action'}</h3><p>${e(card.action)}</p>
    ${card.members?.length?`<h3>Members of this group</h3><p>${e(Array.isArray(card.members)?card.members.join(', '):card.members)}</p>`:''}
    <h3>${tissue?'Attachment relationship':'General origin'}</h3><p>${e(card.origin)}</p><h3>${tissue?'Related attachment':'General insertion'}</h3><p>${e(card.insertion)}</p>
    ${card.sourceNotes&&!card.sourceNotes.startsWith('General attachment regions for study')?`<p class="muscle-list-note">${e(card.sourceNotes)}</p>`:''}
    <h3>Practice and review</h3><div class="muscle-list-links" data-mock4-split>${diagram?'<button data-list-action="diagram">Practice with diagram ↗</button>':''}${spatial?.spatialEligible?'<button data-list-action="spatial">Practice on the 3D model ↗</button>':''}<button data-list-action="tutor">Ask the Socratic tutor ↗</button><button data-list-action="explain-one">Practice explaining this entry ↗</button><button data-list-action="attachments">Lab attachments &amp; shoulder ligaments ↗</button></div>
    ${!spatial?.spatialEligible&&!muscleStudyModels[card.id]?`<p class="muscle-list-note">${e(spatial?.note||'This entry has no reviewed, scored 3D target. Use its study card and available diagrams.')}</p>`:''}
    <p class="muscle-list-note">The list requires these names. Actions and general attachments help explain them; the separate lab packet identifies ten tested attachment rows. Card ratings are self-reported study, not a quiz score.</p><p class="muscle-list-notice" role="status">${e(notice)}</p>`;
   // Keep each heading with its explanation or controls when the group fits.
   // Very small screens may split a group only if it exceeds a whole page.
   for(const heading of [...frame.querySelectorAll('h3')]){
    const content=heading.nextElementSibling,group=document.createElement('div');
    group.dataset.mock4Split='';heading.before(group);group.append(heading);
    if(content)group.append(content);
   }
   layout=mountMock4Pages(frame,[{title:'Study card',blocks:[...frame.children]}],{start:prior});
   setDiagramLearningContext({id:card.id,title:card.name,reference:card.section,state:{mode:'required-list teaching'},question:card.guidePrompt,
    hint:'First locate the structure, then connect its main role to its attachments.',answer:[card.location,card.action,card.origin,card.insertion].join(' '),facts:[card.location,card.action,card.origin,card.insertion,card.sourceNotes]});
  }else{
   const count=queue().length;
   frame.innerHTML=`<h2>Practice your required entries</h2><p>Work through a region or test the entire list. Name recall covers all ${cards.length} unique entries, including groups and connective tissues.</p>
    <label class="muscle-list-field" for="required-muscle-kind">Exercise<select id="required-muscle-kind"><option value="name">Name from location and action</option><option value="visual">Identify a marked figure</option><option value="written">Explain location, action and attachments</option></select></label>
    <label class="muscle-list-field" for="required-muscle-scope">Study set<select id="required-muscle-scope"><option value="all">Every entry in this region</option><option value="review">Untried or needs name practice</option></select></label>
    <label class="muscle-list-field" for="required-muscle-length">Session length<select id="required-muscle-length"><option value="10">Up to 10 entries</option><option value="20">Up to 20 entries</option><option value="all">Every available entry</option></select></label>
    <p class="muscle-list-count" role="status">${count} available ${count===1?'prompt':'prompts'} in this selection.</p><p class="muscle-list-note" data-list-kind-note></p>
    <p class="muscle-list-note">Built-in spelling support accepts clear minor errors and accepted names. Uncertain wording remains available for review. Sessions save in this browser; use Chapter exams to resume an unfinished drill.</p>
    <button data-list-action="results">Open saved drills and results ↗</button><p>The course list also reminds you to learn the shoulder ligaments.</p><button data-list-action="attachments">Lab attachments &amp; shoulder ligaments ↗</button>`;
   for(const [id,key] of [['kind','kind'],['scope','scope'],['length','length']])frame.querySelector('#required-muscle-'+id).value=state[key];
   updateQuizCount();
   layout=mountMock4Pages(frame,[{title:'Drill setup',blocks:[...frame.children]}],{start:prior});
   setLearningContext({type:'study',label:'Required muscle list · drill setup',reference:'11.1',text:'Choose name recall, reviewed figures, or explanatory practice for the 67 required BI 231 muscle-list entries.'});
  }
 }
 function updateQuizCount(){
  const n=queue().length,count=root.querySelector('.muscle-list-count'),start=root.querySelector('[data-list-action="start"]');
  if(count)count.textContent=`${n} available ${n===1?'prompt':'prompts'}. This session uses ${state.length==='all'?n:Math.min(n,Number(state.length))}.`;
  if(start){start.disabled=!n;start.textContent=`Start ${state.kind==='name'?'name':state.kind==='visual'?'figure':'explanation'} drill ↗`;}
  const note=root.querySelector('[data-list-kind-note]');
  if(note)note.textContent=state.kind==='name'?'Recall the anatomical name from a written location-and-action clue. This tests verbal recall, not recognition on a specimen.':state.kind==='visual'?'Only reviewed, marked figures are scored. Some required entries have no suitable figure target; learn every entry with the cards and name drill.':'Explain each entry in your own words. Written responses use a rubric and can be reviewed with the optional local AI; this is broader study, not a claim that every attachment will be tested.';
 }
 function launch(items){
  if(!items.length){toast('No reviewed questions match this selection. Try another exercise.');return;}
  document.dispatchEvent(new CustomEvent('exampractice',{detail:items.map(question=>question.id)}));
 }
 function click(event){
  const button=event.target.closest('button');if(!button||button.disabled)return;
  if(button.dataset.listMode){state.mode=button.dataset.listMode;notice='';layout?.close();layout=null;render();return;}
  const items=selected(),card=items.find(item=>item.id===state.card),index=items.indexOf(card);
  switch(button.dataset.listAction){
   case'textbook':openTextbookFigure(card);break;
   case'study-model':openStudyModel(card);break;
   case'preview':openEnlargedPreview(card);break;
   case'exit':setView('practice',{route:'practice'});document.dispatchEvent(new Event('practicehome'));break;
   case'learn':state.mode='learn';layout?.close();layout=null;render();break;
   case'previous':case'next':state.card=items[index+(button.dataset.listAction==='next'?1:-1)]?.id||state.card;notice='';layout?.close();layout=null;render();root.querySelector('#required-muscle-entry')?.focus({preventScroll:true});break;
   case'again':case'reviewed':saveCardReview(card,button.dataset.listAction==='again'?1:3);notice=button.dataset.listAction==='again'?'Saved for another review.':'Card review saved. Test its name when you are ready.';render();toast(notice);break;
   case'quiz-one':launch(muscleChecklistQuestionsFor([card.id],{kind:'name'}));break;
   case'explain-one':launch(muscleChecklistQuestionsFor([card.id],{kind:'written'}));break;
   case'start':{const questions=shuffle(queue());launch(state.length==='all'?questions:questions.slice(0,Number(state.length)));break;}
   case'diagram':document.dispatchEvent(new CustomEvent('openmuscleworksheet',{detail:{termId:card.id,from:'muscle-list'}}));break;
   case'spatial':document.dispatchEvent(new CustomEvent('openmusclespatial',{detail:{termId:card.id,from:'muscle-list'}}));break;
   case'tutor':document.getElementById('tutor-launch')?.click();break;
   case'results':document.dispatchEvent(new Event('openexams'));break;
   case'resume':document.dispatchEvent(new Event('resumeexam'));break;
   case'attachments':document.dispatchEvent(new Event('openexam4attachments'));break;
  }
 }
 function change(event){
  const id=event.target.id,value=event.target.value;
  if(id==='required-muscle-region'){state.region=value;notice='';layout?.close();layout=null;render();}
  else if(id==='required-muscle-entry'){state.card=value;notice='';layout?.close();layout=null;render();root.querySelector('#required-muscle-entry')?.focus({preventScroll:true});}
  else if(id==='required-muscle-kind'||id==='required-muscle-scope'||id==='required-muscle-length'){state[id.replace('required-muscle-','')]=value;render();}
 }
 document.addEventListener('openmusclechecklist',open);
 document.addEventListener('viewchange',()=>{if(!active()&&document.body.dataset.muscleListActive){layout?.close();layout=null;delete document.body.dataset.muscleListActive;if(['#practice','#atlas','#progress'].includes(location.hash))delete document.body.dataset.conceptActive;}});
 return {open};
}
