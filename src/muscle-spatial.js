import * as THREE from 'three';
import {assessTyped,outcomeCorrect,outcomeLabel} from './typed-answer.js';
import {getLearningContext,getTutorAssessmentMode,setLearningContext,setTutorAssessmentMode} from './learning-context.js';
import {courseMuscleTargetById,courseSpatialModes,courseTargetComponents,filterCourseMuscleTargets,courseComparisonGroups,courseChoiceCorrect,shuffledCourseChoices} from './muscle-spatial-data.js';

// Sample actual triangle centers. Bounds centers only provide an extra aim point;
// they are never drawn unless a real, nearest visible triangle was hit.
export function createSurfaceProbe(){
 const cached=new WeakMap(),ray=new THREE.Raycaster(),pointer=new THREE.Vector2();
 function samples(mesh){
  if(cached.has(mesh))return cached.get(mesh);
  const geometry=mesh.geometry,positions=geometry.getAttribute('position'),index=geometry.index;
  const count=Math.floor((index?.count??positions.count)/3),step=Math.max(1,Math.floor(count/18)),result=[];
  if(mesh.userData.bounds)result.push(mesh.userData.bounds.getCenter(new THREE.Vector3()));
  for(let i=Math.floor(step/2);i<count;i+=step){
   const p=new THREE.Vector3();
   for(let j=0;j<3;j++)p.add(new THREE.Vector3().fromBufferAttribute(positions,index?index.getX(i*3+j):i*3+j));
   result.push(p.multiplyScalar(1/3).applyMatrix4(mesh.matrixWorld));
  }
  cached.set(mesh,result);return result;
 }
 return (camera,choiceMeshes,allMeshes,accept=()=>true)=>{
  camera.updateMatrixWorld();
  const allowed=new Set(choiceMeshes);
  for(const mesh of choiceMeshes)for(const aim of samples(mesh)){
   const q=aim.clone().project(camera);
   if(Math.abs(q.x)>.91||Math.abs(q.y)>.87||q.z< -1||q.z>1)continue;
   ray.setFromCamera(pointer.set(q.x,q.y),camera);
   const hit=ray.intersectObjects(allMeshes,false)[0];
   if(hit&&allowed.has(hit.object)){
    const projected=hit.point.clone().project(camera);
    if(accept(projected))return {mesh:hit.object,point:hit.point,projected};
   }
  }
  return null;
 };
}

export function createMuscleSpatialPractice({viewer,escape:e,enter,loadRegion,exit,visibleMeshes=()=>[],frameMeshes=()=>{},refresh=()=>{},unavailable=false}){
 const atlas=document.querySelector('#atlas-view'),stage=viewer.el.closest('.specimen-stage');
 const panel=document.createElement('section');panel.className='muscle-spatial-panel';panel.setAttribute('aria-label','3D muscle practice');panel.hidden=true;stage.insertBefore(panel,viewer.el);
 const markerLayer=document.createElement('div');markerLayer.className='muscle-spatial-markers';markerLayer.hidden=true;viewer.el.append(markerLayer);
 const probe=createSurfaceProbe();let session=null,round=null,revision=0,lastProjection='',previousContext=null,previousMode=null,previousARIA=null;
 let markers=new Map(),observed=new Map();
 const sizeObserver=new ResizeObserver(()=>{
  if(!session||panel.hidden)return;
  const height=Math.ceil(panel.getBoundingClientRect().height)+20;
  if(stage.style.getPropertyValue('--muscle-spatial-head')!==height+'px'){
   stage.style.setProperty('--muscle-spatial-head',height+'px');viewer.resize?.();
  }
 });sizeObserver.observe(panel);
 const closeAndReturn=()=>{close();document.dispatchEvent(new Event('closemusclespatial'));};
 function openSource(){const section=round?.target.card.section;close();document.dispatchEvent(new CustomEvent('openreader',{detail:section||'11.1'}));}
 function coverageText(target){return target.note||'This practice uses the visible named anatomy in the current specimen. It does not assess exact attachment points.';}
 function render(){
  if(!session)return;
  const active=round?.phase==='question',mode=session.mode,target=round?.target,feedback=round?.feedback;
  const opening=round?.phase==='loading'||round?.phase==='waiting';
  const unavailableText=round?.phase==='error'?round.message:null;
  const study=round?.phase==='study';
  const prompt=!target?'No targets in this set':opening?'Preparing the specimen…':unavailableText?'3D practice unavailable':feedback?target.name:study?target.courseName:mode==='name'?'Name the highlighted structure.':'Find '+target.name+'.';
  const retry=round?.phase==='error'&&round.retry;
  panel.innerHTML=`<div class="muscle-spatial-heading"><div><span class="eyebrow">BI 231 / ${e(courseSpatialModes[mode])}${session.queue.length?` · ${session.index+1} / ${session.queue.length}`:''}</span><h2 tabindex="-1">${e(prompt)}</h2></div><button type="button" data-ms-exit>Exit practice</button></div>
   ${active&&mode==='name'?'<form class="muscle-spatial-answer"><label class="sr-only" for="muscle-spatial-answer">Anatomical name</label><input id="muscle-spatial-answer" name="answer" maxlength="160" placeholder="Type the anatomical name" autocomplete="off" spellcheck="false" required><button class="primary" type="submit" disabled>Check name</button></form><p data-ms-clarify class="tiny" role="status" hidden></p>':''}
   ${active?`<div class="muscle-spatial-actions"><span data-ms-observation role="status">Checking visible surfaces…</span><button type="button" data-ms-reveal>Show answer</button></div>`:''}
   ${active?'<p data-ms-assisted class="tiny" role="status" hidden>Study assistance used. Your result will be marked assisted.</p>':''}
   ${opening?'<p class="tiny" role="status">The exercise loads only the region it needs.</p>':''}
   ${unavailableText?`<p class="tiny" role="status">${e(unavailableText)}</p>`:''}
   ${feedback?`<p class="muscle-spatial-feedback" role="status"><strong>${e(feedback.label)}.</strong> ${e(target.card.location)} ${e(target.card.action)}</p>`:''}
   ${study?`<p class="muscle-spatial-feedback" role="status">${e(coverageText(target))} ${e(target.card.location)}</p>${target.examples.length>1?`<label class="muscle-spatial-examples">3D example <select data-ms-example>${target.examples.map((x,i)=>`<option value="${i}" ${i===round.example?'selected':''}>${e(x.name)}</option>`).join('')}</select></label>`:''}`:''}
   ${feedback||study||unavailableText?`<div class="muscle-spatial-actions">${retry?'<button type="button" data-ms-retry>Retry</button>':''}<button type="button" data-ms-source>Read source</button>${session.index+1<session.queue.length?'<button class="primary" type="button" data-ms-next>Next target ↗</button>':'<button class="primary" type="button" data-ms-finish>Finish ↗</button>'}</div>`:''}`;
  panel.querySelector('[data-ms-exit]').onclick=closeAndReturn;
  panel.querySelector('[data-ms-source]')?.addEventListener('click',openSource);
  panel.querySelector('[data-ms-next]')?.addEventListener('click',()=>startRound(session.index+1));
  panel.querySelector('[data-ms-finish]')?.addEventListener('click',closeAndReturn);
  panel.querySelector('[data-ms-retry]')?.addEventListener('click',()=>{
   const nativeRetry=!viewer.loaded&&document.querySelector('[data-model-retry]');
   if(nativeRetry)nativeRetry.click();else startRound(session.index,round.example);
  });
  panel.querySelector('[data-ms-example]')?.addEventListener('change',ev=>startRound(session.index,Number(ev.target.value)));
  panel.querySelector('[data-ms-reveal]')?.addEventListener('click',()=>grade({assisted:true}));
  panel.querySelector('.muscle-spatial-answer')?.addEventListener('submit',ev=>{
   ev.preventDefault();const response=String(new FormData(ev.currentTarget).get('answer')||'').trim();
   if(response&&canAnswer())grade({response});
  });
 }
 function meshSet(ids){const keys=new Set(ids);return visibleMeshes().filter(m=>keys.has(m.userData.muscleId));}
 function intersections(camera=viewer.camera){
  if(!round?.choices?.length||!camera)return new Map();
  const visible=visibleMeshes(),occluders=[...visible,...(viewer.meshes||[]).filter(m=>m.visible&&!m.userData.guideOnly&&m.material.opacity>=.45)];
  const result=new Map();
  const choices=[...round.choices].sort((a,b)=>Number(b.id===round.target.id)-Number(a.id===round.target.id));
  const width=viewer.el.clientWidth,height=viewer.el.clientHeight;
  for(const choice of choices){
   const distinct=q=>session.mode!=='find'||[...result.values()].every(r=>Math.hypot((q.x-r.projected.x)*width/2,(q.y-r.projected.y)*height/2)>=46);
   const ids=new Set(choice.componentIds),hit=probe(camera,visible.filter(m=>ids.has(m.userData.muscleId)),occluders,distinct);
   if(hit)result.set(choice.id,hit);
  }
  return result;
 }
 function clearMarkers(){markers.clear();observed=new Map();markerLayer.replaceChildren();lastProjection='';}
 function getMarker(choice,index){
  if(markers.has(choice.id))return markers.get(choice.id);
  const b=document.createElement('button');b.type='button';b.className='muscle-spatial-dot';b.textContent=index+1;b.setAttribute('aria-label','Surface target '+(index+1));
  for(const event of ['pointerdown','pointerup','dblclick'])b.addEventListener(event,ev=>ev.stopPropagation());
  b.onclick=()=>{if(canAnswer()&&observed.has(choice.id))grade({choice});};
  markerLayer.append(b);markers.set(choice.id,b);return b;
 }
 function canAnswer(){
  if(!session||round?.phase!=='question'||viewer.graphicsLost||viewer.referenceOpen||!viewer.el.clientWidth||!viewer.el.clientHeight)return false;
  updateSurfaces();return observed.has(round.target.id)&&(session.mode==='name'||observed.size>=2);
 }
 function updateSurfaces(){
  if(!session||!round)return;
  const question=round.phase==='question',showName=round.phase==='feedback'||round.phase==='study';
  if((!question&&!showName)||viewer.graphicsLost||viewer.referenceOpen||!viewer.el.clientWidth||!viewer.el.clientHeight){
   markerLayer.hidden=true;observed=new Map();lastProjection='';return;
  }
  const c=viewer.camera,key=[revision,round.phase,viewer.sceneRevision,viewer.el.clientWidth,viewer.el.clientHeight,...c.position.toArray(),...c.quaternion.toArray(),...c.projectionMatrix.elements].join('|');
  if(key===lastProjection)return;lastProjection=key;
  observed=intersections();markerLayer.hidden=false;
  for(const [i,choice]of round.choices.entries()){
   const show=question?session.mode==='find'||choice.id===round.target.id:choice.id===round.target.id;
   const hit=observed.get(choice.id),marker=getMarker(choice,i);marker.hidden=!show||!hit;
   if(marker.hidden)continue;
   const q=hit.projected;
   marker.style.left=((q.x+1)*50)+'%';marker.style.top=((1-q.y)*50)+'%';
   marker.classList.toggle('muscle-spatial-dot--label',showName);
   marker.classList.toggle('muscle-spatial-dot--focus',question&&session.mode==='name');
   marker.disabled=!question||session.mode!=='find';
   marker.textContent=showName?(round.target.examples[round.example]?.name||round.target.name):session.mode==='name'?'':String(i+1);
   marker.setAttribute('aria-label',showName?marker.textContent:session.mode==='find'?'Surface target '+(i+1):'Highlighted surface');
  }
  if(question){
   const visible=observed.has(round.target.id)&&(session.mode==='name'||observed.size>=2);
   const button=panel.querySelector('button[type="submit"]');if(button)button.disabled=!visible;
   const status=panel.querySelector('[data-ms-observation]');
   const message=visible?(session.mode==='find'?(round.target.status==='composite'?'Tap any member of the named group or choose its number.':'Tap a surface or choose its number. Drag to rotate.'):'The gold surface is your target. Drag to rotate.'):'Rotate to bring the practice surfaces into view, or show the answer.';
   if(status&&status.textContent!==message)status.textContent=message;
  }
 }
 function frame(view=round?.target.view||'front'){
  if(!session||!round?.choices?.length)return;
  frameMeshes(meshSet(round.choices.flatMap(x=>x.componentIds)),view);lastProjection='';
 }
 function chooseInitialView(){
  if(!round?.choices?.length)return;
  let best=null,score=-1;
  const fromCamera=viewer.camera.position.clone(),fromTarget=viewer.controls.target.clone();
  for(const view of new Set([round.target.view,'front','back','right','left','top','bottom'])){
   frame(view);
   const c=viewer.camera.clone();c.position.copy(viewer.tween?.to||viewer.camera.position);c.lookAt(viewer.tween?.targetTo||viewer.controls.target);
   const hits=intersections(c),target=hits.has(round.target.id),rating=(target?10:0)+hits.size;
   if(rating>score){best=view;score=rating;}
   if(target&&(session.mode==='name'||hits.size>=3)||round.phase==='study'&&target)break;
  }
  // Reduced-motion framing moves immediately during the probe; restore the
  // original pose before issuing the single chosen camera move.
  viewer.camera.position.copy(fromCamera);viewer.controls.target.copy(fromTarget);viewer.controls.update();
  frame(best||round.target.view);
 }
 function grade({response='',choice=null,assisted=false}={}){
  if(!session||round?.phase!=='question'||(!assisted&&!canAnswer()))return;
  const target=round.target;
  const typed=!assisted&&session.mode==='name'?assessTyped({id:target.id,answer:target.name,aliases:[...target.card.aliases,target.courseName,...(target.card.kind==='muscle'?[target.name+' muscle']:[])],answerPolicy:{kind:'structure',allowAnySide:true}},response):null;
  if(typed&&['pending','unanswered'].includes(typed.status)){
   const clarify=panel.querySelector('[data-ms-clarify]');
   if(clarify){clarify.hidden=false;clarify.textContent='That wording could not be confirmed. Try one specific anatomical name, or show the answer.';}
   panel.querySelector('#muscle-spatial-answer')?.focus({preventScroll:true});return;
  }
  const correct=!assisted&&(typed?outcomeCorrect(typed):!!choice&&courseChoiceCorrect(round.targetIds,choice.componentIds));
  const answerStatus=assisted?'revealed':typed?.status||(correct?'correct':'incorrect'),usedHelp=assisted||!!round.helpUsed;
  const feedbackLabel=assisted?'Answer shown':typed?outcomeLabel(typed):correct?'Correct':'Review the highlighted answer';
  round.phase='feedback';round.feedback={label:feedbackLabel+(correct&&usedHelp?' · with assistance':''),choiceId:choice?.id};
  clearMarkers();render();refresh();
  if(!intersections().has(target.id)){
   round.choices=round.choices.filter(x=>x.id===target.id);refresh();chooseInitialView();
  }
  updateSurfaces();
  document.dispatchEvent(new CustomEvent('musclespatialattempt',{detail:{mode:session.mode,termId:target.id,correct,assisted:usedHelp,answerStatus,correction:typed?.correction||target.name,response:typed?.response||choice?.name||'',attemptedAt:Date.now()}}));
  panel.querySelector('[data-ms-next],[data-ms-finish]')?.focus({preventScroll:true});
 }
 async function startRound(index,example=0){
  if(!session)return;const current=session,rev=++revision;
  current.index=index;const target=current.queue[index];
  round={target,example,phase:'loading',choices:[],targetIds:[]};clearMarkers();render();refresh();
  if(!target)return;
  if(unavailable||viewer.graphicsLost){round.phase='error';round.message='This device cannot display the 3D specimen right now. You can exit or read the source.';render();return;}
  if(!target.componentIds.length){round.phase='study';render();return;}
  if(!viewer.loaded){
   const failed=document.querySelector('[data-model-retry]');round.phase=failed?'error':'waiting';round.message='The skeleton did not finish loading. Use the atlas model retry or read the source.';round.retry=true;render();return;
  }
  if(viewer.quiz){round.phase='error';round.message='Finish or exit the other assessment before starting 3D muscle practice.';render();return;}
  try{
   const parts=courseTargetComponents(target,current.side,example),region=parts[0]?.region||target.region;
   enter(region);await loadRegion(region);
   if(session!==current||rev!==revision)return;
   const targetIds=parts.map(c=>c.id);round.targetIds=targetIds;
   const own={id:target.id,name:target.name,componentIds:targetIds};
   const alternatives=target.spatialEligible?courseComparisonGroups(target,{side:current.side,limit:current.mode==='find'?3:2}):[];
   round.choices=current.mode==='find'?shuffledCourseChoices([own,...alternatives]):[own,...alternatives];
   round.phase=target.spatialEligible?'question':'study';render();refresh();
   await new Promise(resolve=>requestAnimationFrame(resolve));
   if(session!==current||rev!==revision)return;
   viewer.resize();
   if(!targetIds.length||!targetIds.every(id=>meshSet([id]).length))throw Error('A required course surface is missing from the delivered region.');
   chooseInitialView();updateSurfaces();
  }catch(error){
   if(session!==current||rev!==revision)return;
   console.error(error);round.phase='error';round.retry=true;round.message='The required muscle surfaces could not load. Retry this region or use the source reading.';round.choices=[];clearMarkers();refresh();render();
  }
 }
 async function open({mode='name',region='all',termId,targetIds,side='right'}={}){
  close();const first=courseMuscleTargetById.get(termId);
  const ordered=Array.isArray(targetIds)?targetIds.map(id=>courseMuscleTargetById.get(id)).filter(Boolean):shuffledCourseChoices(filterCourseMuscleTargets({region:region||'all',scoredOnly:true}));
  const queue=[...new Map([...(first?[first]:[]),...ordered].map(t=>[t.id,t])).values()];
  session={mode:mode==='find'?'find':'name',side:side==='left'?'left':'right',index:0,queue,route:location.hash};
  previousContext=getLearningContext();previousMode=getTutorAssessmentMode();previousARIA=viewer.el.getAttribute('aria-label');
  if(previousMode!=='exam')setTutorAssessmentMode('practice');
  setLearningContext({type:'assessment',label:'Independent 3D muscle identification',text:'The answer is withheld until feedback. Explain model controls if asked, without identifying the target.',reference:'11.1'});
  atlas.dataset.muscleSpatial='true';stage.dataset.muscleSpatial='true';panel.hidden=false;
  viewer.el.setAttribute('aria-label','3D muscle practice. Drag or use the arrow keys to rotate. Use the visible surface numbers to choose a target.');
  document.dispatchEvent(new Event('showspecimen'));
  if(!queue.length){round=null;render();refresh();}else await startRound(0);
  if(session)panel.querySelector('h2')?.focus({preventScroll:true});
 }
 function close(){
  if(!session)return;
  session=null;round=null;revision++;clearMarkers();markerLayer.hidden=true;panel.hidden=true;
  delete atlas.dataset.muscleSpatial;delete stage.dataset.muscleSpatial;stage.style.removeProperty('--muscle-spatial-head');
  if(previousARIA===null)viewer.el.removeAttribute('aria-label');else viewer.el.setAttribute('aria-label',previousARIA);
  exit?.();refresh();
  if(previousContext){const {assessmentMode,...context}=previousContext;setLearningContext(context);}
  if(getTutorAssessmentMode()==='practice')setTutorAssessmentMode(previousMode);
  previousMode=null;previousContext=null;
 }
 function onPick(mesh){
  if(!session)return false;
  if(session.mode==='find'&&round?.phase==='question'&&mesh?.visible&&canAnswer()){
   const id=mesh.userData.muscleId,choice=round.choices.find(x=>x.componentIds.includes(id));if(choice)grade({choice});
  }
  return true;
 }
 document.addEventListener('openmusclepractice',ev=>open(ev.detail));
 document.addEventListener('viewchange',ev=>{if(session&&(ev.detail!=='atlas'||location.hash!==session.route))close();});
 document.addEventListener('anatomyready',()=>{if(round?.phase==='waiting'&&session)startRound(session.index,round.example);});
 const loadingNotice=document.querySelector('#loading');
 if(loadingNotice)new MutationObserver(()=>{
  if(session&&round?.phase==='waiting'&&loadingNotice.querySelector('[data-model-retry]'))startRound(session.index,round.example);
 }).observe(loadingNotice,{childList:true,subtree:true});
 document.addEventListener('assessmentstart',close);
 document.addEventListener('studyassistance',()=>{
  if(session&&round?.phase==='question'){round.helpUsed=true;const status=panel.querySelector('[data-ms-assisted]');if(status)status.hidden=false;}
 });
 document.addEventListener('viewertextfallback',ev=>{if(session){ev.preventDefault();openSource();}});
 return {open,close,closeAndReturn,frame,onPick,updateSurfaces,get active(){return !!session;},get presentation(){
  if(!session)return null;
  const ids=new Set(round?.choices.flatMap(x=>x.componentIds)||[]),show=round?.phase==='feedback'||round?.phase==='study'||session.mode==='name';
  return {ids,emphasized:new Set(show?round?.targetIds||[]:[])};
 }};
}
