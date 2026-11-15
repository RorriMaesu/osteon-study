
import {MotionViewer} from './motion-viewer.js';
import {armRoles,clamp,curlDuration,curlFrame,heelFrame,elbowLimits} from './motion-core.js';
import {sampleWalk,gaitEventName} from './motion-walk.js';
import {setLearningContext} from './learning-context.js';
import modelAssets from './model-assets.json' with {type:'json'};

const sources={
 actions:'https://openstax.org/books/anatomy-and-physiology-2e/pages/10-4-nervous-system-control-of-muscle-tension',
 roles:'https://openstax.org/books/anatomy-and-physiology-2e/pages/11-5-muscles-of-the-pectoral-girdle-and-upper-limbs',
 walk:'https://pmc.ncbi.nlm.nih.gov/articles/PMC8041842/',
};
const gaitMuscles={
 'tibialis-anterior':{name:'Tibialis anterior',role:'Ankle dorsiflexor'},
 'gastrocnemius-lateral':{name:'Lateral head of gastrocnemius',role:'Ankle plantar flexor that also crosses the knee'},
 'biceps-femoris':{name:'Biceps femoris',role:'The sampled part contributes to knee flexion'},
 'vastus-lateralis':{name:'Vastus lateralis',role:'Part of the quadriceps that extends the knee'},
};
const calfRoles={
 'gastrocnemius-medial':{name:'Medial head of gastrocnemius',role:'Ankle plantar flexor that also crosses the knee'},
 'gastrocnemius-lateral':gaitMuscles['gastrocnemius-lateral'],
 soleus:{name:'Soleus',role:'Ankle plantar flexor that does not cross the knee'},
};
const legLimits={hip:[-22,85],knee:[0,85],ankle:[-35,23]};
const emptyPose=()=>({hip:0,knee:0,ankle:0});
const gaitFile=()=>new URL('src/motion-gait-data.json?v='+modelAssets['motion-gait'],document.baseURI).href;

const escape=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));


export function initMotionLab({setView}){
 const root=document.querySelector('#motion-view');
 const walking=!!(modelAssets['motion-legs']&&modelAssets['motion-gait']);
 const calfLesson=!!(walking&&modelAssets['motion-leg-actions']);
 const fullBody=!!modelAssets['motion-walk-context'];
 root.innerHTML=`
 <header class="motion-heading"><div><a href="#atlas" class="motion-back">← 3D Atlas</a><h1 tabindex="-1">Motion <em>Lab</em></h1></div>
 <div class="motion-modes" role="group" aria-label="Motion mode">
 <button type="button" data-motion-mode="pose">Pose</button>
 <button type="button" data-motion-mode="actions">Muscle actions</button>
 ${walking?'<button type="button" data-motion-mode="walk">Walk cycle</button>':''}
 <button class="motion-notes-toggle" type="button" aria-controls="motion-notes" aria-pressed="false">Muscles &amp; notes</button>
 </div></header>
 <div class="motion-workspace">
 <div class="motion-model-panel">
 <div class="motion-stage" aria-label="Interactive motion specimen">
 <div class="motion-status" role="status"></div>
 <p class="motion-phase-tag" aria-hidden="true"></p>
 <span class="motion-handle" aria-hidden="true" hidden><i></i><span>Drag</span></span>
 <span class="motion-load-tag" aria-hidden="true" hidden>↓ Hand load</span>
 <div class="motion-camera" role="group" aria-label="Camera angle"><button type="button" data-motion-camera="front">Front</button><button type="button" data-motion-camera="side">Side</button><button type="button" data-motion-camera="lesson">Reset view</button></div>
 </div>
 <div class="motion-controls"></div></div>
 <aside class="motion-info" id="motion-notes" aria-label="Movement notes">
 <div class="motion-phase"></div>
 <div class="motion-filter"><label><input type="checkbox" data-motion-muscles checked> Muscles</label><label><input type="checkbox" data-motion-active> Highlighted only</label></div>
 <div class="motion-muscle-list"></div>
 <p class="motion-note"></p><a class="motion-source" target="_blank" rel="noreferrer"></a>
 <details class="motion-recall"><summary>Quick recall</summary><p class="motion-question"></p><button type="button" class="motion-reveal" aria-expanded="false">Reveal answer</button><p class="motion-answer" hidden></p></details>
 </aside></div>`;

 const $=selector=>root.querySelector(selector);
 const controls=$('.motion-controls'), phase=$('.motion-phase'), names=$('.motion-muscle-list'), status=$('.motion-status');
 const state={mode:'actions',lesson:'curl',limb:'arm',elbow:25,leg:{right:emptyPose(),left:emptyPose()},time:0,speed:1,playing:false,loop:true,showMuscles:true,onlyActive:false,selected:null,action:'flex',side:'left',showUpper:true};
 let active=false,revision=0,specimen=null,gait=null,lastInfo='',lastContext='';
 let gaitPromise,recallKey='';
 const ready=()=>active&&!!specimen;
 const heelLesson=()=>state.mode==='actions'&&state.lesson==='heel';
 const shape=()=>state.mode==='walk'||heelLesson()||(state.mode==='pose'&&state.limb!=='arm')?'legs':'arm';
 const duration=()=>state.mode==='walk'?gait?.durationSeconds||1:curlDuration;
 const motion=new MotionViewer($('.motion-stage'),{onFrame:advance,onTarget:target,onMuscle:selectMuscle});
 const setStatus=(text='',retry=false)=>{status.textContent=text;status.hidden=!text;if(retry){const button=document.createElement('button');button.type='button';button.textContent='Retry loading';button.onclick=load;status.append(button);}};
 const range=(id,label,min,max,value,step=1)=>`<label class="motion-range" for="${id}"><span>${label}</span><input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${value}"><output for="${id}"></output></label>`;
 function renderControls(){
  for(const button of root.querySelectorAll('[data-motion-mode]'))button.setAttribute('aria-pressed',String(button.dataset.motionMode===state.mode));
  if(state.mode==='pose'){
   controls.innerHTML=`<div class="motion-settings">${walking?'<label>Choose limb <select id="motion-limb"><option value="arm">Right arm</option><option value="right">Right leg</option><option value="left">Left leg</option></select></label>':''}
   ${state.limb==='arm'?'<label>Compare roles <select id="motion-action"><option value="flex">Elbow flexion</option><option value="extend">Elbow extension</option></select></label>':''}
   <button type="button" id="motion-reset">Reset pose</button></div>
   <div class="motion-angles">${state.limb==='arm'?range('motion-elbow','Elbow flexion',...elbowLimits,state.elbow):Object.entries(legLimits).map(([key,bounds])=>range('motion-'+key,key[0].toUpperCase()+key.slice(1),...bounds,state.leg[state.limb][key])).join('')}</div>`;
   if(walking){$('#motion-limb').value=state.limb;$('#motion-limb').onchange=event=>{state.limb=event.target.value;state.selected=null;load();};}
   if(state.limb==='arm'){
    $('#motion-action').value=state.action;
    $('#motion-action').onchange=event=>{state.action=event.target.value;draw();};
    $('#motion-elbow').oninput=event=>{state.elbow=Number(event.target.value);draw();};
   }else for(const key of Object.keys(legLimits))$('#motion-'+key).oninput=event=>{state.leg[state.limb][key]=Number(event.target.value);draw();};
   $('#motion-reset').onclick=()=>{state.elbow=specimen?.meta.neutralFlexionDegrees||0;state.leg={right:emptyPose(),left:emptyPose()};draw();motion.frame();};
  }else{
   controls.innerHTML=`<div class="motion-settings">${state.mode==='actions'&&calfLesson?'<label>Lesson <select id="motion-lesson"><option value="curl">Elbow curl</option><option value="heel">Heel raise</option></select></label>':''}<button type="button" class="primary" id="motion-play">Play</button><button type="button" id="motion-reset">Restart</button>
   <label>Speed <select id="motion-speed"><option value=".25">¼×</option><option value=".5">½×</option><option value="1">1×</option></select></label>
   <label class="motion-check"><input type="checkbox" id="motion-loop" ${state.loop?'checked':''}> Loop</label>
   ${state.mode==='walk'?'<label>Focus <select id="motion-side"><option value="right">Right leg</option><option value="left">Left leg</option></select></label>':''}${state.mode==='walk'&&fullBody?'<label class="motion-check"><input type="checkbox" id="motion-upper"> Whole body</label>':''}</div>
   ${range('motion-time',state.mode==='walk'?'Stride':'Movement',0,duration(),state.time,.001)}
   <div class="motion-steps" role="group" aria-label="Jump to a movement event"></div>`;
   $('#motion-speed').value=String(state.speed).replace(/^0\./,'.');
   $('#motion-speed').onchange=event=>{state.speed=Number(event.target.value);};
   $('#motion-loop').onchange=event=>{state.loop=event.target.checked;};
   if($('#motion-lesson')){
    $('#motion-lesson').value=state.lesson;
    $('#motion-lesson').onchange=event=>{state.lesson=event.target.value;state.selected=null;state.time=0;load();};
   }
   if($('#motion-upper')){
    $('#motion-upper').checked=state.showUpper;
    $('#motion-upper').onchange=event=>{state.showUpper=event.target.checked;draw();motion.frame();};
   }
   if(state.mode==='walk'){
    $('#motion-side').value=state.side;
    $('#motion-side').onchange=event=>{state.side=event.target.value;renderControls();draw();};
   }
   $('#motion-play').onclick=()=>{if(!ready())return;if(!state.playing&&state.time>=duration())state.time=0;state.playing=!state.playing;draw();};
   $('#motion-reset').onclick=()=>{state.playing=false;state.time=0;draw();};
   $('#motion-time').oninput=event=>{state.playing=false;state.time=Number(event.target.value);draw();};
   steps();
  }
 }
 function steps(){
  const buttons=root.querySelector('.motion-steps');
  const events=state.mode==='actions'?[{phase:heelLesson()?'Rise':'Lift',percent:14},{phase:'Hold',percent:46},{phase:'Lower',percent:76}]:
   (gait?.events||[]).filter(event=>event.side===state.side&&event.percent<100);
  buttons.replaceChildren(...events.map(event=>{
   const button=document.createElement('button');button.type='button';button.textContent=state.mode==='walk'?gaitEventName(event):event.phase;
   button.onclick=()=>{state.playing=false;state.time=event.timeSeconds??event.percent/100*duration();draw();};return button;
  }));
 }
 function target(value){
  if(!ready()||state.mode!=='pose')return;
  if(state.limb==='arm')state.elbow=Math.round(value);
  else Object.assign(state.leg[state.limb],Object.fromEntries(Object.entries(value).map(([joint,angle])=>[joint,Math.round(angle)])));
  draw();
 }
 function selectMuscle(key){
  if(state.mode==='walk'){
   const side=key.split(':')[0];
   if(state.side!==side){state.side=side;$('#motion-side').value=side;steps();}
  }
  state.selected=state.selected===key?null:key;draw();
 }
 function advance(dt){
  if(!ready()||!state.playing)return;
  state.time+=dt*state.speed;
  const end=duration();
  if(state.time>=end){
   if(state.loop)state.time%=end;
   else {state.time=end;state.playing=false;}
  }
  draw();
 }
 async function load(){
  const run=++revision;
  state.playing=false;
  specimen=null;
  motion.target=null;
  if(motion.current){motion.current.model.visible=false;motion.dirty=true;}
  renderControls();
  controls.inert=true;
  setStatus('Loading the motion specimen…');
  try{
   motion.open();
   const kind=shape();
   if(state.mode==='walk'){
    gaitPromise||=fetch(gaitFile()).then(response=>{if(!response.ok)throw new Error('Could not read recorded walking data.');return response.json();});
   }
   const [loaded,recording]=await Promise.all([motion.load(kind),state.mode==='walk'?gaitPromise:null]);
   if(!active||run!==revision)return;
   if(heelLesson())await motion.addCalves(loaded);
   if(state.mode==='walk'&&fullBody)await motion.addUpper(loaded);
   if(!active||run!==revision)return;
   gait=recording||gait;
   specimen=loaded;
   motion.use(loaded);
   motion.reset();
   if(state.mode==='walk')motion.setWalkTracks(gait.samples);
   setStatus();
   renderControls();
   controls.inert=false;
   draw();
   motion.frame();
  }catch(error){
   if(!active||run!==revision)return;
   gaitPromise=null;
   controls.inert=true;
   setStatus(error.message||'The motion specimen could not load.',true);
  }
 }
 function draw(){
  if(!ready())return;
  const strengths={active:true};
  let readoutText='';
  let title,detail,tag,roleMap=armRoles,source=state.mode==='pose'?sources.roles:sources.actions, contextRef=state.mode==='pose'?'11.5':'10.4';
  motion.target=null;
  motion.showLoad=false;
  motion.showGround(state.mode==='walk'||heelLesson());
  motion.showUpper(state.mode==='walk'&&state.showUpper);
  if(heelLesson()){
   const frame=heelFrame(state.time);
   motion.heelRise(frame.angle);
   roleMap=calfRoles;title=frame.name;tag=frame.contraction;detail=frame.detail;
   for(const side of ['right','left'])for(const id of Object.keys(calfRoles))strengths[side+':'+id]=1;
  }else if(state.mode==='actions'){
   const frame=curlFrame(state.time);
   motion.sampleCurl(state.time,frame.angle);
   motion.target='right';
   motion.showLoad=true;
   title=frame.name;
   tag=frame.contraction;
   detail=frame.detail;
   for(const id of ['biceps-brachii','brachialis','brachioradialis'])strengths['right:'+id]=1;
  }else if(state.mode==='pose'){
   motion.target=state.limb==='arm'?'right':state.limb;
   if(state.limb==='arm'){
    motion.angle=state.elbow-(specimen.meta.neutralFlexionDegrees||0);
    motion.poseArm(state.elbow);
    const flex=state.action==='flex';
    title=flex?'Elbow flexion':'Elbow extension';
    for(const id of flex?['biceps-brachii','brachialis','brachioradialis']:['triceps-brachii'])strengths['right:'+id]=1;
    detail='Drag the wrist ring, or set an angle below. The upper arm stays in place.';
    tag='Textbook muscle roles';
   }else{
    roleMap=gaitMuscles;
    motion.poseLeg('left',state.leg.left);
    motion.poseLeg('right',state.leg.right);
    strengths.active=false;
    title=state.limb==='right'?'Right leg':'Left leg';
    tag='Free pose';
    detail='Drag the ankle ring for hip and knee motion. Use the sliders to set each joint angle.';
    source=sources.walk;contextRef='9.5';
   }
  }else{
   roleMap=gaitMuscles;source=sources.walk;contextRef='11.6';
   const current=sampleWalk(gait,state.time);
   const rightContact=gait.events.find(event=>event.side==='right'&&event.phase==='initial-contact');
   motion.walk(current,gait.samples.at(-1).pelvis.forwardMeters,rightContact?.percent??50);
   for(const side of ['right','left']){
    for(const [id,value] of Object.entries(current[side].emg))if(value!=null)strengths[side+':'+id]=value/100;
   }
   const joint=current[state.side];
   readoutText='Hip '+Math.round(joint.hip)+'° · Knee '+Math.round(joint.knee)+'° · Ankle '+Math.round(joint.ankle)+'°';
   const contact=current[state.side].contact;
   title=contact?'Stance':'Swing';
   tag='Recorded surface EMG';
   detail=(state.side==='right'?'Right':'Left')+' foot '+(contact?'is in contact with the ground.':'is moving through the air.');
  }
  motion.highlight({strengths,selected:state.selected,showMuscles:state.showMuscles,onlyActive:state.onlyActive,showCalves:heelLesson()});
  $('.motion-phase-tag').textContent=title;
  const elapsed=state.mode==='pose'?null:`${Math.round(state.time/duration()*100)}%`;
  if(elapsed!==null){
   const play=$('#motion-play');
   play.textContent=state.playing?'Pause':'Play';
   play.setAttribute('aria-pressed',String(state.playing));
   $('#motion-time').value=state.time;
   $('.motion-range output').textContent=elapsed;
  }else if(state.limb==='arm'){ $('#motion-elbow').value=state.elbow;$('.motion-range output').textContent=state.elbow+'°';}
  else for(const [joint,angle] of Object.entries(state.leg[state.limb])){$('#motion-'+joint).value=angle;root.querySelector('[for="motion-'+joint+'"] output').textContent=angle+'°';}

  const entries=Object.entries(roleMap).filter(([id])=>specimen.parts.some(part=>part.id===id));
  const side=roleMap===armRoles||heelLesson()?'right':state.mode==='walk'?state.side:state.limb;
  const infoKey=[title,tag,detail,side,state.mode,state.showUpper].join('|');
  if(lastInfo!==infoKey){
   phase.innerHTML=`<p class="motion-evidence">${escape(tag)}</p><h2>${escape(title)}</h2><p>${escape(detail)}</p>${state.mode==='walk'?'<p class="motion-joint-readout"></p>':''}`;
   names.innerHTML=entries.map(([id,entry])=>`<button type="button" data-motion-pick="${side+':'+id}" aria-pressed="${state.selected===side+':'+id}"><span>${escape(entry.name)}</span><small>${escape(entry.role)}</small><span class="motion-signal" aria-hidden="true"></span><span class="motion-measure"></span></button>`).join('');
   for(const button of names.querySelectorAll('button'))button.onclick=()=>selectMuscle(button.dataset.motionPick);
   $('.motion-note').textContent=state.mode==='walk'?'Surface EMG is shown relative to each muscle’s maximum voluntary contraction (MVC). Only four muscles per leg were measured. The floor height is adjusted for the model. If shown, arm and torso motion is illustrative.':heelLesson()?'Highlights show the calf plantar flexors in this body-weight task.':state.mode==='actions'?'Highlights show the flexors in this hand-load example.':'Muscle recruitment depends on the task and load.';
   const link=$('.motion-source');link.href=source;link.textContent=state.mode==='walk'?'Walking data & methods ↗':'Read the OpenStax section ↗';
   lastInfo=infoKey;
  }
  if(readoutText)$('.motion-joint-readout').textContent=readoutText;
  for(const button of names.querySelectorAll('button')){
   const measured=strengths[button.dataset.motionPick];
   button.setAttribute('aria-pressed',String(state.selected===button.dataset.motionPick));
   button.dataset.contributing=String(measured>0);
   button.querySelector('.motion-signal').style.setProperty('--signal',100*clamp(measured||0,0,1)+'%');
   button.querySelector('.motion-measure').textContent=state.mode==='walk'?(measured==null?'No data':Math.round(measured*100)+'% MVC'):measured?'Contributes':'';
  }
  const recall=state.mode==='actions'?(heelLesson()?'heel':'curl'):state.mode;
  if(recall!==recallKey){
   const [question,answer]={
    curl:['As the load comes down, which muscle group controls it?','The elbow flexors remain active as they lengthen. That is an eccentric contraction.'],
    heel:['Which highlighted calf muscle crosses the ankle but leaves the knee free?','Soleus crosses the ankle only. Both heads of gastrocnemius cross the knee and ankle.'],
    walk:['In this recording, what do brighter muscle highlights represent?','Higher surface EMG relative to that muscle’s reference contraction. Only four muscles per leg were measured.'],
    pose:['Why can the same elbow movement use different muscles?','The task and load determine which muscles produce or control the motion.'],
   }[recall];
   $('.motion-question').textContent=question;$('.motion-answer').textContent=answer;$('.motion-answer').hidden=true;
   $('.motion-reveal').setAttribute('aria-expanded','false');$('.motion-reveal').textContent='Reveal answer';
   $('.motion-recall').open=false;recallKey=recall;
  }
  const contextKey=[state.mode,side,title,state.selected].join('|');
  if(contextKey!==lastContext&&!state.playing){
   setLearningContext({type:'study',label:'Motion Lab · '+title,reference:contextRef,text:detail});
   lastContext=contextKey;
  }
 }
 for(const button of root.querySelectorAll('[data-motion-mode]'))button.onclick=()=>{const mode=button.dataset.motionMode;if(state.mode!==mode){state.mode=mode;state.selected=null;state.time=0;state.loop=mode!=='walk';load();}};
 for(const button of root.querySelectorAll('[data-motion-camera]'))button.onclick=()=>motion.frame(button.dataset.motionCamera);
 $('[data-motion-muscles]').onchange=event=>{state.showMuscles=event.target.checked;draw();};
 $('[data-motion-active]').onchange=event=>{state.onlyActive=event.target.checked;draw();};
 $('.motion-reveal').onclick=event=>{
  const answer=$('.motion-answer');answer.hidden=!answer.hidden;
  event.currentTarget.setAttribute('aria-expanded',String(!answer.hidden));
  event.currentTarget.textContent=answer.hidden?'Reveal answer':'Hide answer';
 };
 const notesToggle=$('.motion-notes-toggle');
 notesToggle.onclick=()=>{
  const open=root.toggleAttribute('data-motion-notes');
  notesToggle.setAttribute('aria-pressed',String(open));
  notesToggle.textContent=open?'Show model':'Muscles & notes';
 };
 root.addEventListener('keydown',event=>{
  if(event.key!=='Escape')return;
  if(state.playing){state.playing=false;draw();}
  else if(root.hasAttribute('data-motion-notes')){notesToggle.click();notesToggle.focus();}
 });
 $('.motion-back').onclick=event=>{event.preventDefault();setView('atlas');document.querySelector('[data-open-motion]')?.focus({preventScroll:true});};
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&active&&state.playing){state.playing=false;draw();}});
 document.addEventListener('viewchange',event=>{
  if(event.detail==='motion'){if(!active){active=true;load();}}
  else if(active){active=false;state.playing=false;revision++;motion.close();}
 });
}
