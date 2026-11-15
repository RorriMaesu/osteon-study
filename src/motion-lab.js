
import {MotionViewer} from './motion-viewer.js';
import {initPoseLab} from './motion-pose-lab.js';
import {armRoles,clamp,curlDuration,curlFrame,heelFrame,pressFrame,compareElbowTime,elbowLimits,contractionCues} from './motion-core.js';
import {sampleWalk,gaitEventName,gaitChannel} from './motion-walk.js';
import {walkScopes,walkScopeMatches} from './motion-walk-model.js';
import {regionalLessons,regionalFrame,breathingLayers} from './motion-regional.js';
import {setLearningContext} from './learning-context.js';
import modelAssets from './model-assets.json' with {type:'json'};

const sources={
 actions:'https://openstax.org/books/anatomy-and-physiology-2e/pages/10-4-nervous-system-control-of-muscle-tension',
 roles:'https://openstax.org/books/anatomy-and-physiology-2e/pages/11-5-muscles-of-the-pectoral-girdle-and-upper-limbs',
 walk:'https://pmc.ncbi.nlm.nih.gov/articles/PMC8041842/',
 joints:'https://openstax.org/books/anatomy-and-physiology-2e/pages/9-5-types-of-body-movements',
};
const gaitMuscles={
 'tibialis-anterior':{name:'Tibialis anterior',role:'Ankle dorsiflexor'},
 'gastrocnemius-lateral':{name:'Lateral head of gastrocnemius',role:'Ankle plantar flexor that also crosses the knee'},
 'biceps-femoris':{name:'Biceps femoris',role:'Long-head mesh. The surface EMG does not distinguish the heads.'},
 'vastus-lateralis':{name:'Vastus lateralis',role:'Part of the quadriceps that extends the knee'},
};
const calfRoles={
 ...gaitMuscles,
 'gastrocnemius-medial':{name:'Medial head of gastrocnemius',role:'Ankle plantar flexor that also crosses the knee'},
 soleus:{name:'Soleus',role:'Ankle plantar flexor that does not cross the knee'},
 plantaris:{name:'Plantaris',role:'Small muscle crossing the knee and ankle. Shown as anatomical context.'},
};
const legLimits={hip:[-22,85],knee:[0,85],ankle:[-35,23]};
const flexors=['biceps-brachii','brachialis','brachioradialis'];
const extensors=['triceps-brachii','anconeus'];
const heelMovers=['gastrocnemius-medial','gastrocnemius-lateral','soleus'];
const legRoles={
 hip:[
  ['Hip extension',['biceps-femoris'],[]],
  ['Hip flexion',[],['biceps-femoris']],
 ],
 knee:[
  ['Knee extension',['vastus-lateralis'],['biceps-femoris','gastrocnemius-lateral']],
  ['Knee flexion',['biceps-femoris','gastrocnemius-lateral'],['vastus-lateralis']],
 ],
 ankle:[
  ['Ankle plantarflexion',['gastrocnemius-lateral'],['tibialis-anterior']],
  ['Ankle dorsiflexion',['tibialis-anterior'],['gastrocnemius-lateral']],
 ],
};
const sideName=side=>({left:'Left',right:'Right',bilateral:'Bilateral',midline:'Midline'}[side]||'Side unspecified');
const roleKey=part=>part.side+':'+part.id;
const hasRecording=part=>!!part&&!part.contextOnly&&!part.walkOnly&&Object.hasOwn(gaitMuscles,part.id);
const walkPageSize=8;
const searchText=text=>text.normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const walkSearchName=part=>searchText(sideName(part.side)+' '+part.name);
const emptyPose=()=>({hip:0,knee:0,ankle:0});
const gaitFile=()=>new URL('src/motion-gait-data.json?v='+modelAssets['motion-gait'],document.baseURI).href;

const escape=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));


export function initMotionLab({setView}){
 const root=document.querySelector('#motion-view');
 const walking=!!(modelAssets['motion-legs']&&modelAssets['motion-gait']);
 const secondArm=!!modelAssets['motion-arm-left'];
 const calfLesson=!!(walking&&modelAssets['motion-leg-actions']);
 const fullBody=!!modelAssets['motion-walk-context'];
 const fullWalk=!!(fullBody&&modelAssets['motion-walk-muscles']);
 const availableRegional=Object.entries(regionalLessons).filter(([,entry])=>modelAssets[entry.asset]);
 root.innerHTML=`
 <header class="motion-heading"><div><a href="#atlas" class="motion-back">← 3D Atlas</a><h1 tabindex="-1">Motion <em>Lab</em></h1><a class="motion-coverage" href="muscle-coverage.html">Coverage ↗</a></div>
 <div class="motion-modes" role="group" aria-label="Motion mode">
 <button type="button" data-motion-mode="pose">Pose skeleton</button>
 <button type="button" data-motion-mode="actions">Muscle actions</button>
 ${walking?'<button type="button" data-motion-mode="walk">Walk cycle</button>':''}
 <button class="motion-notes-toggle" type="button" aria-controls="motion-notes" aria-pressed="false"><span>Muscles &amp; notes</span><span class="motion-notes-short" aria-hidden="true">Muscles</span></button>
 </div></header>
 <div class="motion-workspace">
 <div class="motion-model-panel">
 <div class="motion-stage" aria-label="Interactive motion specimen">
 <div class="motion-status" role="status"></div>
 <div class="motion-phase-tag"><span data-motion-heading></span><span data-motion-cue></span><small data-motion-opposing-cue hidden>○ Antagonist roles</small></div>
 <span data-motion-selection-label aria-hidden="true" hidden></span>
 <span class="motion-handle" aria-hidden="true" hidden><i></i><span>Drag</span></span>
 <span class="motion-load-tag" aria-hidden="true" hidden>↓ Hand load</span>
 <div class="motion-camera" role="group" aria-label="Camera angle"><button type="button" data-motion-camera="front">Front</button><button type="button" data-motion-camera="side">Side</button><button type="button" data-motion-camera="back">Back</button><button type="button" data-motion-camera="lesson">Reset view</button></div>
 </div>
 <div class="motion-controls"></div></div>
 <aside class="motion-info" id="motion-notes" aria-label="Movement notes">
 <div class="motion-phase"></div>
 <div class="motion-filter">
  <label><input type="checkbox" data-motion-muscles checked> Muscles</label>
  <label><input type="checkbox" data-motion-active> <span data-motion-filter-label>Highlighted only</span></label>
  <label><input type="checkbox" data-motion-antagonists checked> Show antagonist roles</label>
  <label hidden><input type="checkbox" data-motion-context checked> Show bones &amp; context</label>
  <label hidden>Breathing layer <select data-motion-breath-layer><option value="thorax">Diaphragm &amp; ribs</option><option value="front">Rectus abdominis</option><option value="outer">External obliques</option><option value="deep">Deep wall &amp; intercostals</option><option value="all">All breathing muscles</option></select></label>
  <label hidden><input type="checkbox" data-motion-isolate> Isolate selected</label>
  <label hidden><input type="checkbox" data-motion-group> Whole muscle</label>
 </div>
 <div class="motion-walk-explorer" hidden>
  <label>Find a muscle <input type="search" data-motion-search placeholder="Name or side" autocomplete="off"></label>
  <label>Muscle list <select data-motion-walk-list><option value="recorded">Recorded EMG</option><option value="all">All anatomy</option></select></label>
 </div>
 <p class="motion-walk-list-info" role="status" hidden></p>
 <div class="motion-muscle-list"></div>
 <nav class="motion-walk-pages" aria-label="Muscle results pages" hidden><button type="button" data-motion-previous>Previous</button><span data-motion-page></span><button type="button" data-motion-next>Next</button></nav>
 <figure class="motion-trace" hidden><figcaption></figcaption><canvas width="300" height="90" aria-hidden="true"></canvas></figure>
 <button type="button" class="motion-compare" hidden></button>
 <p class="motion-note"></p><a class="motion-source" target="_blank" rel="noreferrer"></a>
 <details class="motion-recall"><summary>Quick recall</summary><p class="motion-question"></p><button type="button" class="motion-reveal" aria-expanded="false">Reveal answer</button><p class="motion-answer" hidden></p></details>
 </aside></div>`;

 const $=selector=>root.querySelector(selector);
 const controls=$('.motion-controls'), phase=$('.motion-phase'), names=$('.motion-muscle-list'), status=$('.motion-status');
 const state={mode:'pose',lesson:'curl',armSide:'right',limb:'arm',elbow:{right:25,left:25},leg:{right:emptyPose(),left:emptyPose()},time:0,speed:1,playing:false,loop:true,showMuscles:true,onlyActive:false,selected:null,selectedGroup:false,isolateSelection:false,showAntagonists:true,showContext:true,regionalClip:'',breathLayer:'',action:'flex',side:'left',walkScope:'all',walkList:'recorded',walkQuery:'',walkPage:0,poseChanges:[],poseDelta:0};
 let active=false,revision=0,specimen=null,gait=null,lastInfo='',lastListKey='',lastContext='';
 let gaitPromise,recallKey='',shownAngle=null,pendingPart=null,routeRead=false;
 let partCache={},walkCache={};
 const ready=()=>active&&!!specimen;
 const heelLesson=()=>state.mode==='actions'&&state.lesson==='heel';
 const pressLesson=()=>state.mode==='actions'&&state.lesson==='press';
 const regionalLesson=()=>state.mode==='actions'&&availableRegional.some(([id])=>state.lesson===id);
 const currentRegionalClip=()=>specimen?.meta.clips?.find(clip=>clip.id===state.regionalClip)||specimen?.meta.clips?.[0];
 const isArmPose=()=>state.limb==='arm'||state.limb==='arm-left';
 const armSide=()=>state.mode==='actions'?state.armSide:state.limb==='arm-left'?'left':'right';
 const shape=()=>regionalLesson()?state.lesson:state.mode==='walk'||heelLesson()||(state.mode==='pose'&&!isArmPose())?'legs':armSide()==='left'?'arm-left':'arm';
 const duration=()=>state.mode==='walk'?gait?.durationSeconds||1:regionalLesson()?currentRegionalClip()?.duration||1:curlDuration;
 const motion=new MotionViewer($('.motion-stage'),{onFrame:advance,onTarget:target,onMuscle:selectMuscle,onLimb:selectLeg});
 const poseHost=document.createElement('div');poseHost.hidden=true;root.append(poseHost);
 const poseLab=initPoseLab(poseHost,{onLesson:id=>{state.mode='actions';state.lesson=id;state.regionalClip='';clearSelection();state.time=0;load();}});
 function partsInMode(){
  if(!specimen)return [];
  const mode=state.mode+':'+state.lesson,count=specimen.parts.length;
  if(partCache.specimen===specimen&&partCache.mode===mode&&partCache.count===count)return partCache.parts;
  const byKey=new Map();
  for(const part of specimen.parts){
   if(part.lessonOnly&&!heelLesson()||part.walkOnly&&state.mode!=='walk')continue;
   if(part.lessonOnly||!byKey.has(part.key))byKey.set(part.key,part);
  }
  const parts=[...byKey.values()];
  partCache={specimen,mode,count,parts,byKey};
  return parts;
 }
 const inWalkScope=part=>walkScopeMatches(state.walkScope,part.region,part.side,part.walkSegments);
 function walkResults(parts){
  const key=[state.walkScope,state.walkList,state.side,state.walkQuery].join('|');
  if(walkCache.parts===parts&&walkCache.key===key)return walkCache.hits;
  const terms=state.walkQuery.split(' ').filter(Boolean);
  const hits=parts.filter(part=>inWalkScope(part)
   &&(state.walkList==='all'||part.side===state.side&&hasRecording(part))
   &&(!terms.length||terms.every(term=>walkSearchName(part).includes(term))));
  hits.sort((a,b)=>a.name.localeCompare(b.name)||a.side.localeCompare(b.side));
  walkCache={parts,key,hits};
  return hits;
 }
 function updateWalkList(list){
  state.walkList=list;
  state.walkPage=0;
  if(list==='recorded'){
   state.walkQuery='';
   $('[data-motion-search]').value='';
  }
  $('[data-motion-walk-list]').value=list;
 }
 function revealWalkPart(part){
  let rows=walkResults(partsInMode());
  if(!rows.includes(part)){
   state.walkQuery='';
   $('[data-motion-search]').value='';
   updateWalkList('all');
   rows=walkResults(partsInMode());
  }
  const index=rows.indexOf(part);
  if(index>=0)state.walkPage=Math.floor(index/walkPageSize);
 }
 function changeWalkScope(scope){
  if(!ready()||!Object.hasOwn(walkScopes,scope)||state.walkScope===scope)return;
  state.walkScope=scope;
  const selected=partsInMode().find(part=>part.key===state.selected);
  if(selected&&!inWalkScope(selected))clearSelection();
  if(scope.endsWith('-leg'))changeSide(scope.split('-')[0]);
  state.walkQuery='';
  $('[data-motion-search]').value='';
  updateWalkList(scope==='all'?'recorded':'all');
  if(selected&&state.selected)revealWalkPart(selected);
  motion.setWalkScope(scope,true);
  draw();
  motion.frame();
 }
 function clearSelection(){
  state.selected=null;
  state.selectedGroup=false;
  state.isolateSelection=false;
 }
 function changeSide(side){
  if(side===state.side)return;
  const parts=partsInMode(),previous=parts.find(part=>part.key===state.selected);
  const walking=state.mode==='walk';
  const followSide=previous&&(!walking||hasRecording(previous));
  const matching=followSide&&parts.find(part=>part.side===side&&part.name===previous.name&&part.id===previous.id&&(!walking||inWalkScope(part)));
  state.side=side;
  if(matching){
   state.selected=matching.key;
   if(walking)revealWalkPart(matching);
  }else if(followSide)clearSelection();
  if(walking&&state.walkList==='recorded')state.walkPage=0;
  const sideControl=$('#motion-side');
  if(sideControl)sideControl.value=side;
  if(walking)steps();
 }
 function readRoute(){
  if(routeRead)return;
  routeRead=true;
  const params=new URLSearchParams(location.search),part=params.get('motionPart'),mode=params.get('motionMode'),scope=params.get('motionScope');
  if(!part&&!mode)return;
  const lesson=params.get('motionLesson'),requestedSide=params.get('motionSide');
  const side=['left','right'].includes(requestedSide)?requestedSide:part?(part.endsWith('-l')?'left':'right'):state.side;
  if(mode==='pose'||mode==='actions'||mode==='walk'&&walking)state.mode=mode;
  if(lesson==='heel'&&calfLesson||lesson==='curl'||lesson==='press'||availableRegional.some(([id])=>id===lesson))state.lesson=lesson;
  if(regionalLesson())state.regionalClip=params.get('motionClip')||'';
  state.armSide=side==='left'&&secondArm?'left':'right';
  state.side=side;
  state.limb=state.lesson==='heel'&&walking?side:state.armSide==='left'?'arm-left':'arm';
  state.loop=state.mode!=='walk';
  if(fullWalk&&Object.hasOwn(walkScopes,scope)){
   state.walkScope=scope;
   if(scope!=='all')updateWalkList('all');
  }
  pendingPart=part;
 }
 const setStatus=(text='',retry=false)=>{status.textContent=text;status.hidden=!text;if(retry){const button=document.createElement('button');button.type='button';button.textContent='Retry loading';button.onclick=load;status.append(button);}};
 const range=(id,label,min,max,value,step=1)=>`<label class="motion-range" for="${id}"><span>${label}</span><input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${value}"><output for="${id}"></output></label>`;
 function renderControls(){
  for(const button of root.querySelectorAll('[data-motion-mode]'))button.setAttribute('aria-pressed',String(button.dataset.motionMode===state.mode));
  if(state.mode==='pose'){
   controls.innerHTML=`<div class="motion-settings">${walking?'<label>Choose limb <select id="motion-limb"><option value="arm">Right arm</option>'+ (secondArm?'<option value="arm-left">Left arm</option>':'') +'<option value="right">Right leg</option><option value="left">Left leg</option></select></label>':''}
   ${isArmPose()?'<label>Compare roles <select id="motion-action"><option value="flex">Elbow flexion</option><option value="extend">Elbow extension</option></select></label>':''}
   <button type="button" id="motion-reset">Reset pose</button></div>
   <div class="motion-angles">${isArmPose()?range('motion-elbow','Elbow flexion',...elbowLimits,state.elbow[armSide()]):Object.entries(legLimits).map(([key,bounds])=>range('motion-'+key,key[0].toUpperCase()+key.slice(1),...bounds,state.leg[state.limb][key])).join('')}</div>`;
   if(walking){$('#motion-limb').value=state.limb;$('#motion-limb').onchange=event=>{state.limb=event.target.value;clearSelection();state.poseDelta=0;state.poseChanges=[];load();};}
   if(isArmPose()){
    $('#motion-action').value=state.action;
    $('#motion-action').onchange=event=>{state.action=event.target.value;state.poseDelta=0;draw();};
    $('#motion-elbow').oninput=event=>target(Number(event.target.value));
   }else for(const key of Object.keys(legLimits))$('#motion-'+key).oninput=event=>target({[key]:Number(event.target.value)});
   $('#motion-reset').onclick=()=>{state.poseDelta=0;state.poseChanges=[];if(isArmPose())state.elbow[armSide()]=specimen?.meta.neutralFlexionDegrees||0;else state.leg[state.limb]=emptyPose();draw();motion.frame();};
  }else{
   const lessons=[['curl','Elbow curl'],['press','Triceps press'],...(calfLesson?[['heel','Heel raise']]:[]),...availableRegional.map(([id,entry])=>[id,entry.label])];
   const clips=regionalLesson()?specimen?.meta.clips||[]:[];
   controls.innerHTML=`<div class="motion-settings">${state.mode==='actions'?'<label>Lesson <select id="motion-lesson">'+lessons.map(([id,label])=>'<option value="'+id+'">'+escape(label)+'</option>').join('')+'</select></label>':''}<button type="button" class="primary" id="motion-play">Play</button><button type="button" id="motion-reset">Restart</button>
   ${clips.length>1?'<label>Movement <select id="motion-regional-clip">'+clips.map(clip=>'<option value="'+escape(clip.id)+'">'+escape(clip.name)+'</option>').join('')+'</select></label>':''}
   ${state.mode==='actions'&&!heelLesson()&&!regionalLesson()&&secondArm?'<label>Arm <select id="motion-arm-side"><option value="right">Right</option><option value="left">Left</option></select></label>':''}
   <label>Speed <select id="motion-speed"><option value=".25">¼×</option><option value=".5">½×</option><option value="1">1×</option></select></label>
   <label class="motion-check"><input type="checkbox" id="motion-loop" ${state.loop?'checked':''}> Loop</label>
   ${state.mode==='walk'||heelLesson()?'<label>'+(state.mode==='walk'?'EMG side':'Inspect')+' <select id="motion-side"><option value="right">Right leg</option><option value="left">Left leg</option></select></label>':''}
   ${state.mode==='walk'&&fullWalk?`<label>View <select id="motion-scope">${Object.entries(walkScopes).map(([value,label])=>`<option value="${value}">${escape(label)}</option>`).join('')}</select></label>`:''}</div>
   ${range('motion-time',state.mode==='walk'?'Stride':'Movement',0,duration(),state.time,.001)}
   <div class="motion-steps" role="group" aria-label="Jump to a movement event"></div>`;
   $('#motion-speed').value=String(state.speed).replace(/^0\./,'.');
   $('#motion-speed').onchange=event=>{state.speed=Number(event.target.value);};
   $('#motion-loop').onchange=event=>{state.loop=event.target.checked;};
   if($('#motion-arm-side')){
    $('#motion-arm-side').value=state.armSide;
    $('#motion-arm-side').onchange=event=>{state.armSide=event.target.value;clearSelection();load();};
   }
   if($('#motion-lesson')){
    $('#motion-lesson').value=state.lesson;
    $('#motion-lesson').onchange=event=>{state.lesson=event.target.value;state.regionalClip='';clearSelection();state.time=0;load();};
   }
   if($('#motion-regional-clip')){
    const selector=$('#motion-regional-clip');
    selector.value=currentRegionalClip().id;
    selector.onchange=()=>{state.regionalClip=selector.value;state.breathLayer='';state.time=0;state.playing=false;steps();draw();};
   }
   if($('#motion-scope')){
    $('#motion-scope').value=state.walkScope;
    $('#motion-scope').onchange=event=>changeWalkScope(event.target.value);
   }
   if($('#motion-side')){
    $('#motion-side').value=state.side;
    $('#motion-side').onchange=event=>{changeSide(event.target.value);draw();};
   }
   $('#motion-play').onclick=()=>{if(!ready())return;if(!state.playing&&state.time>=duration())state.time=0;state.playing=!state.playing;draw();};
   $('#motion-reset').onclick=()=>{state.playing=false;state.time=0;draw();};
   $('#motion-time').oninput=event=>{state.playing=false;state.time=Number(event.target.value);draw();};
   steps();
  }
 }
 function steps(){
  const buttons=root.querySelector('.motion-steps');
  const events=regionalLesson()?(currentRegionalClip()?.phases||[]).map(phase=>({phase:phase.label,timeSeconds:phase.start})):
   state.mode==='actions'?[{phase:heelLesson()?'Rise':pressLesson()?'Press':'Lift',percent:14},{phase:'Hold',percent:46},{phase:pressLesson()?'Return':'Lower',percent:76}]:
   (gait?.events||[]).filter(event=>event.side===state.side&&event.percent<100);
  buttons.replaceChildren(...events.map(event=>{
   const button=document.createElement('button');button.type='button';button.textContent=state.mode==='walk'?gaitEventName(event):event.phase;
   button.onclick=()=>{state.playing=false;state.time=event.timeSeconds??event.percent/100*duration();draw();};return button;
  }));
 }
 function target(value){
  if(!ready()||state.mode!=='pose')return;
  if(isArmPose()){
   const side=armSide(),angle=Math.round(value);
   state.poseDelta=angle-state.elbow[side];
   if(state.poseDelta)state.action=state.poseDelta>0?'flex':'extend';
   state.elbow[side]=angle;
   $('#motion-action').value=state.action;
  }else{
   const pose=state.leg[state.limb],values=Object.entries(value).map(([joint,angle])=>[joint,Math.round(angle)]);
   const changed=values.map(([joint,angle])=>[joint,angle-pose[joint]]).filter(([,delta])=>delta);
   if(changed.length)state.poseChanges=changed;
   Object.assign(pose,Object.fromEntries(values));
  }
  draw();
 }
 function selectLeg(side){
  if(state.mode!=='pose'||isArmPose()||state.limb===side)return;
  state.limb=side;clearSelection();state.poseDelta=0;state.poseChanges=[];renderControls();draw();
 }
 function selectMuscle(key){
  const part=partsInMode().find(item=>item.key===key);
  if(!part)return;
  const same=state.selected===key;
  if(state.mode==='pose'&&!isArmPose())selectLeg(part.side);
  const walking=state.mode==='walk';
  if((heelLesson()||walking&&hasRecording(part))&&['left','right'].includes(part.side))changeSide(part.side);
  clearSelection();
  if(!same){
   state.selected=key;
   state.showMuscles=true;
   $('[data-motion-muscles]').checked=true;
   if(walking&&fullWalk)revealWalkPart(part);
  }
  draw();
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
  const posing=state.mode==='pose';
  root.toggleAttribute('data-pose-workspace',posing);
  $('.motion-workspace').hidden=posing;
  $('.motion-notes-toggle').hidden=posing;
  for(const button of root.querySelectorAll('[data-motion-mode]'))button.setAttribute('aria-pressed',String(button.dataset.motionMode===state.mode));
  if(posing){motion.close();await poseLab.open();return;}
  poseLab.close();
  motion.target=null;
  if(motion.current){motion.current.model.visible=false;motion.dirty=true;}
  renderControls();
  controls.inert=true;
  setStatus('Loading the motion specimen…');
  try{
   motion.open();
   const kind=shape(),walking=state.mode==='walk';
   if(walking){
    gaitPromise||=fetch(gaitFile()).then(response=>{if(!response.ok)throw new Error('Could not read recorded walking data.');return response.json();});
   }
   const [loaded,recording]=await Promise.all([motion.load(kind),walking?gaitPromise:null]);
   if(!active||run!==revision)return;
   if(heelLesson())await motion.addCalves(loaded);
   if(walking&&fullBody)await motion.addUpper(loaded);
   if(!active||run!==revision)return;
   motion.use(loaded);
   motion.reset();
   if(walking&&fullWalk)await motion.addWalkMuscles(loaded);
   if(!active||run!==revision)return;
   gait=recording||gait;
   specimen=loaded;
   motion.setWalkScope(state.walkScope,walking&&fullWalk);
   if(pendingPart){
    const linked=partsInMode().find(part=>part.key===pendingPart);
    if(linked){
     state.selected=pendingPart;
     if(walking&&fullWalk){
      if(!inWalkScope(linked))state.walkScope='all';
      motion.setWalkScope(state.walkScope,true);
      if(hasRecording(linked))state.side=linked.side;
      revealWalkPart(linked);
     }
    }
   }
   pendingPart=null;
   if(walking)motion.setWalkTracks(gait.samples);
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
 function drawEmgTrace(current,selected){
  const figure=$('.motion-trace');
  figure.hidden=!current;
  if(!current)return;
  const side=state.side;
  const canvas=figure.querySelector('canvas'),figcaption=figure.querySelector('figcaption');
  const noRecording=!!selected&&!hasRecording(selected);
  if(canvas.hidden!==noRecording)canvas.hidden=noRecording;
  if(noRecording){
   const caption=sideName(selected.side)+' · '+selected.name+' · No surface EMG recording';
   if(figcaption.textContent!==caption)figcaption.textContent=caption;
   return;
  }
  const id=selected?.side===side?selected.id:'tibialis-anterior';
  const ctx=canvas.getContext('2d');
  if(!ctx)return;
  const scaled=gait.samples.map(sample=>gaitChannel(sample,side,id)),currentValue=current[side].emg[id];
  const caption=gaitMuscles[id].name+' · '+sideName(side)+' · '+(currentValue==null?'No recording':Math.round(currentValue)+'% MVC');
  if(figcaption.textContent!==caption)figcaption.textContent=caption;
  const left=25,right=canvas.width-4,top=10,bottom=canvas.height-12;
  const x=percent=>left+(right-left)*percent/100;
  const max=Math.max(100,Math.ceil(Math.max(...scaled)/10)*10),y=signal=>bottom-(bottom-top)*signal/max;
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.lineWidth=1;ctx.font='9px system-ui';ctx.fillStyle='#bdd1cb';ctx.strokeStyle='#50716b';
  for(const signal of [0,max/2,max]){
   ctx.beginPath();ctx.moveTo(left,y(signal));ctx.lineTo(right,y(signal));ctx.stroke();ctx.fillText(String(signal),3,y(signal)-1);
  }
  ctx.strokeStyle='#475e5b';
  for(const event of gait.events.filter(event=>event.side===side)){
   ctx.beginPath();ctx.moveTo(x(event.percent),top);ctx.lineTo(x(event.percent),bottom);ctx.stroke();
  }
  ctx.strokeStyle='#ffce83';ctx.lineWidth=2;ctx.beginPath();
  let drawing=false;
  for(const [index,signal] of scaled.entries()){
   if(signal==null){drawing=false;continue;}
   const time=gait.samples[index].percent;
   if(!drawing){ctx.moveTo(x(time),y(signal));drawing=true;}else ctx.lineTo(x(time),y(signal));
  }
  ctx.stroke();
  ctx.strokeStyle='#e8f4f0';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x(current.percent),top);ctx.lineTo(x(current.percent),bottom);ctx.stroke();
 }
 function draw(){
  if(!ready())return;
  const strengths={},opposing=new Set();
  const markRoles=(side,agonists,antagonists)=>{
   for(const id of agonists)strengths[side+':'+id]=1;
   for(const id of antagonists)opposing.add(side+':'+id);
  };
  let frameData=null,readoutText='',jointText='',cue=state.mode==='walk'?'emg':state.mode==='pose'?'role':null;
  shownAngle=null;
  let title,detail,tag,roleMap=armRoles,source=state.mode==='pose'?sources.roles:sources.actions, contextRef=state.mode==='pose'?'11.5':'10.4';
  motion.target=null;
  motion.showLoad=false;
  motion.showGround(state.mode==='walk'||heelLesson());
  motion.showUpper(state.mode==='walk');
  if(regionalLesson()){
   const {phase:current,weights}=regionalFrame(currentRegionalClip(),state.time);
   motion.applyRegional(weights,state.showContext&&!state.isolateSelection);
   roleMap=null;
   title=current.label;
   tag=specimen.meta.evidence;
   detail=current.detail;
   cue=current.active?.length?'authored':null;
   source=specimen.meta.sources?.openstax||specimen.meta.sources?.study||sources.actions;
   contextRef=regionalLessons[state.lesson].reference;
   for(const part of specimen.parts){
    if(current.active?.includes(part.id)&&!part.contextOnly)strengths[roleKey(part)]=1;
    if(current.opposes?.includes(part.id)&&!part.contextOnly)opposing.add(roleKey(part));
   }
  }else if(heelLesson()){
   const frame=heelFrame(state.time);
   motion.heelRise(frame.angle);
   roleMap=calfRoles;title=frame.name;tag=frame.contraction;detail=frame.detail;
   cue=frame.contraction.toLowerCase();
   jointText=frame.joint+' · '+Math.round(frame.angle)+'° plantarflexed';
   for(const side of ['right','left'])markRoles(side,heelMovers,['tibialis-anterior']);
  }else if(state.mode==='actions'){
   const pressure=pressLesson(),animation=specimen.meta.animation;
   const limits=Number.isFinite(animation?.startAngle)&&Number.isFinite(animation?.peakAngle)?[animation.startAngle,animation.peakAngle]:undefined;
   const frame=pressure?pressFrame(state.time,limits):curlFrame(state.time,limits);
   shownAngle=motion.sampleCurl(frame.clipTime??state.time,frame.angle);
   cue=frame.contraction.toLowerCase();
   jointText=frame.joint+' · '+Math.round(shownAngle)+'°';
   motion.target=armSide();
   motion.showLoad=true;
   $('.motion-load-tag').textContent=pressure?'↑ Cable resistance':'↓ Hand load';
   title=frame.name;
   tag=frame.contraction;
   detail=frame.detail;
   markRoles(armSide(),pressure?extensors:flexors,pressure?flexors:extensors);
  }else if(state.mode==='pose'){
   motion.target=isArmPose()?armSide():state.limb;
   if(isArmPose()){
    const angle=state.elbow[armSide()];
    motion.angle=angle-(specimen.meta.neutralFlexionDegrees||0);
    motion.poseArm(angle);
    const flex=state.action==='flex';
    title=flex?'Elbow flexion':'Elbow extension';
    jointText=(state.poseDelta?title:'Elbow pose')+' · '+angle+'°';
    markRoles(armSide(),flex?flexors:extensors,flex?extensors:flexors);
    detail='Drag the wrist ring or set an angle below. These are possible roles for the selected joint direction.';
    tag='Possible agonists';
   }else{
    roleMap=gaitMuscles;
    motion.poseLeg('left',state.leg.left);
    motion.poseLeg('right',state.leg.right);
    const motions=state.poseChanges.map(([joint,delta])=>({joint,role:legRoles[joint][Number(delta>0)]}));
    for(const {role:[,agonists,antagonists]} of motions)markRoles(state.limb,agonists,antagonists);
    const unavailable=motions.filter(({role})=>!role[1].length).map(({role})=>role[0]);
    const single=motions.length===1?motions[0]:null;
    title=sideName(state.limb)+' leg';
    jointText=single?single.role[0]+' · '+state.leg[state.limb][single.joint]+'°':motions.length?motions.map(({role})=>role[0]).join(' + '):title;
    cue=motions.length?Object.keys(strengths).length?'role':'unavailable':null;
    tag=cue?contractionCues[cue].label:'Joint pose';
    detail='Drag the ankle ring to move the hip and knee, or use the sliders. Highlights describe possible roles for the last adjustment.';
    if(unavailable.length)detail+=' This rig has no modeled agonist for '+unavailable.join(' or ').toLowerCase()+'.';
    source=sources.joints;contextRef='9.5';
   }
  }else{
   roleMap=gaitMuscles;source=sources.walk;contextRef='11.6';
   const current=sampleWalk(gait,state.time);frameData=current;
   const rightContact=gait.events.find(event=>event.side==='right'&&event.phase==='initial-contact');
   motion.walk(current,gait.samples.at(-1).pelvis.forwardMeters,rightContact?.percent??50);
   for(const side of ['right','left']){
    for(const [id,value] of Object.entries(current[side].emg))if(value!=null)strengths[side+':'+id]=value/100;
   }
   const scope=state.walkScope;
   if(fullWalk&&scope!=='all'&&!scope.endsWith('-leg')){
    title=walkScopes[scope];
    jointText=title+' · Walk cycle';
    tag='Illustrative movement';
    detail='This region follows the walk without a surface EMG recording.';
    cue=null;
   }else{
    const side=scope.endsWith('-leg')?scope.split('-')[0]:state.side;
    const joint=current[side];
    readoutText='Hip '+Math.round(joint.hip)+'° · Knee '+Math.round(joint.knee)+'° · Ankle '+Math.round(joint.ankle)+'°';
    title=joint.contact?'Stance':'Swing';
    jointText=sideName(side)+' leg · '+title;
    tag='Recorded surface EMG';
    detail=sideName(side)+' foot '+(joint.contact?'is in contact with the ground.':'is moving through the air.');
   }
  }
  const parts=partsInMode(),partsByKey=partCache.byKey;
  const selected=partsByKey.get(state.selected);
  const selectedGroup=selected&&state.selectedGroup?roleKey(selected):null;
  for(const key of Object.keys(strengths))opposing.delete(key);
  const threshold=state.mode==='walk'&&state.onlyActive ? .05 : 0;
  const breathing=regionalLesson()&&state.lesson==='breath';
  const layer=breathing?(state.breathLayer||(currentRegionalClip().id==='forced-expiration'?'front':'thorax')):null;
  const layerControl=$('[data-motion-breath-layer]');
  layerControl.parentElement.hidden=!breathing;
  if(breathing&&layerControl.value!==layer)layerControl.value=layer;
  motion.highlight({
   strengths,selected:state.selected,selectedGroup,isolateSelection:state.isolateSelection&&!!selected,
   antagonists:state.showAntagonists?opposing:new Set(),showMuscles:state.showMuscles,
   onlyActive:state.onlyActive,showCalves:heelLesson(),cue,displayThreshold:threshold,
   regionalRoles:breathingLayers[layer],
  });
  const isolate=$('[data-motion-isolate]'),group=$('[data-motion-group]'),antagonists=$('[data-motion-antagonists]');
  isolate.parentElement.hidden=!selected;
  isolate.checked=state.isolateSelection;
  group.parentElement.hidden=!selected||parts.filter(part=>roleKey(part)===roleKey(selected)).length<2;
  group.checked=state.selectedGroup;
  antagonists.parentElement.hidden=state.mode==='walk';
  $('[data-motion-context]').parentElement.hidden=!regionalLesson();
  $('[data-motion-opposing-cue]').hidden=!state.showAntagonists||!opposing.size;
  const indicator=$('.motion-phase-tag'),cueText=contractionCues[cue];
  indicator.dataset.cue=cue||'';
  $('[data-motion-heading]').textContent=jointText||title;
  $('[data-motion-cue]').textContent=cueText?cueText.symbol+' '+cueText.label:'';
  $('[data-motion-filter-label]').textContent=state.mode==='walk'?'5% MVC or higher':'Highlighted only';
  const compare=$('.motion-compare');
  compare.hidden=state.mode!=='actions'||heelLesson()||regionalLesson();
  compare.textContent=pressLesson()?'Compare curl lowering at the same angle':'Compare cable press at the same angle';
  const elapsed=state.mode==='pose'?null:`${Math.round(state.time/duration()*100)}%`;
  if(elapsed!==null){
   const play=$('#motion-play');
   play.textContent=state.playing?'Pause':'Play';
   play.setAttribute('aria-pressed',String(state.playing));
   $('#motion-time').value=state.time;
   $('.motion-range output').textContent=elapsed;
  }else if(isArmPose()){ const angle=state.elbow[armSide()];$('#motion-elbow').value=angle;$('.motion-range output').textContent=angle+'°';}
  else for(const [joint,angle] of Object.entries(state.leg[state.limb])){$('#motion-'+joint).value=angle;root.querySelector('[for="motion-'+joint+'"] output').textContent=angle+'°';}

  const side=roleMap===armRoles?armSide():heelLesson()||state.mode==='walk'?state.side:state.limb;
  const walkExplorer=state.mode==='walk'&&fullWalk;
  const results=walkExplorer?walkResults(parts):null;
  const pageCount=results?Math.max(1,Math.ceil(results.length/walkPageSize)):1;
  state.walkPage=Math.min(state.walkPage,pageCount-1);
  const entries=results?results.slice(state.walkPage*walkPageSize,(state.walkPage+1)*walkPageSize):regionalLesson()?parts:parts.filter(part=>part.side===side);
  $('.motion-walk-explorer').hidden=!walkExplorer;
  const listInfo=$('.motion-walk-list-info'),pages=$('.motion-walk-pages');
  listInfo.hidden=!walkExplorer;
  pages.hidden=!walkExplorer||pageCount<2;
  if(walkExplorer){
   const total=results.length;
   const summary=total?(total===1?'1 named part':total+' named parts')+' · '+(state.walkList==='recorded'?sideName(side)+' EMG':walkScopes[state.walkScope]):
    state.walkList==='recorded'?'No recorded channels in this view for '+sideName(side).toLowerCase()+' leg. Choose All anatomy to inspect this region.':'No matching muscle in this view.';
   if(listInfo.textContent!==summary)listInfo.textContent=summary;
   const page=$('[data-motion-page]'),label=(state.walkPage+1)+' of '+pageCount;
   if(page.textContent!==label)page.textContent=label;
   $('[data-motion-previous]').disabled=state.walkPage===0;
   $('[data-motion-next]').disabled=state.walkPage>=pageCount-1;
  }
  const infoKey=[title,tag,detail,side,state.mode].join('|');
  if(lastInfo!==infoKey){
   phase.innerHTML=`<p class="motion-evidence">${escape(tag)}</p><h2>${escape(title)}</h2><p>${escape(detail)}</p>${state.mode==='walk'?'<p class="motion-joint-readout"></p>':''}`;
   $('.motion-note').textContent=regionalLesson()?specimen.meta.scope:state.mode==='walk'?'One recorded stride at 4 km/h. The four recorded channels per leg show surface EMG relative to maximum voluntary contraction (MVC). The remaining muscles follow modeled motion and have no activity recording. Upper-body movement is illustrative.':state.mode==='actions'?'The colors show contraction roles for this teaching example. Antagonist roles describe the opposing action.':'Muscle recruitment depends on the task and load. The pose shows possible agonist and antagonist roles.';
   const link=$('.motion-source');link.href=source;link.textContent=state.mode==='walk'?'Walking data & methods ↗':'Read the OpenStax section ↗';
   lastInfo=infoKey;
  }
  const listKey=[state.mode,state.lesson,state.regionalClip,walkExplorer&&state.walkList,...entries.map(part=>part.key)].join('|');
  if(lastListKey!==listKey){
   names.innerHTML=entries.map(part=>{
    const role=regionalLesson()?part.note:state.mode==='walk'?(hasRecording(part)?roleMap[part.id]?.role:part.deformation==='segment-follow'?'Follows the segment':'Guided movement'):part.id==='biceps-femoris'?'Contributes to knee flexion and hip extension':roleMap[part.id]?.role;
    const name=regionalLesson()||walkExplorer&&state.walkList==='all'?sideName(part.side)+' · '+part.name:part.name;
    return `<button type="button" data-motion-pick="${escape(part.key)}" data-motion-role-key="${escape(roleKey(part))}" aria-pressed="false" aria-label="${escape(sideName(part.side)+' · '+part.name)}" aria-describedby="${escape('role-'+part.key+' measure-'+part.key)}"><span>${escape(name)}</span><small id="${escape('role-'+part.key)}">${escape(role||'Anatomical context')}</small><span class="motion-signal" aria-hidden="true"></span><span class="motion-measure" id="${escape('measure-'+part.key)}"></span></button>`;
   }).join('');
   for(const button of names.querySelectorAll('button'))button.onclick=()=>selectMuscle(button.dataset.motionPick);
   lastListKey=listKey;
  }
  if(readoutText)$('.motion-joint-readout').textContent=readoutText;
  for(const button of names.querySelectorAll('button')){
   const key=button.dataset.motionRoleKey,part=partsByKey.get(button.dataset.motionPick),antagonist=opposing.has(key);
   const context=part?.contextOnly;
   const measured=state.mode==='walk'&&!hasRecording(part)?undefined:strengths[key];
   const picked=String(state.selected===button.dataset.motionPick||selectedGroup===key);
   const contributing=String(measured>0&&measured>=threshold);
   const role=antagonist?'antagonist':state.mode==='walk'&&measured!=null?'recorded':measured?'agonist':'context';
   const signal=state.mode==='walk'?(measured==null?'No recording':Math.round(measured*100)+'% MVC'):
    measured?cueText.label:antagonist?'Antagonist role':context?'Context':'';
   if(button.getAttribute('aria-pressed')!==picked)button.setAttribute('aria-pressed',picked);
   if(button.dataset.contributing!==contributing)button.dataset.contributing=contributing;
   if(button.dataset.role!==role)button.dataset.role=role;
   if(button.dataset.cue!==(cue||''))button.dataset.cue=cue||'';
   const meter=button.querySelector('.motion-signal'),amount=Math.round(100*clamp(measured||0,0,1))+'%';
   if(meter.style.getPropertyValue('--signal')!==amount)meter.style.setProperty('--signal',amount);
   const measure=button.querySelector('.motion-measure');
   if(measure.textContent!==signal)measure.textContent=signal;
  }
  drawEmgTrace(frameData,selected);
  const recall=state.mode==='actions'?state.lesson:state.mode;
  if(recall!==recallKey){
   const [question,answer]=regionalLesson()?regionalLessons[state.lesson].recall:{
    curl:['As the load comes down, which muscle group controls it?','The elbow flexors remain active as they lengthen. That is an eccentric contraction.'],
    press:['The elbow flexes during the return. Which muscle group controls that motion?','The elbow extensors, led by triceps brachii, lengthen under tension to control the cable.'],
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
   setLearningContext({type:'study',label:'Motion Lab · '+(selected?sideName(selected.side)+' '+selected.name:title),reference:contextRef,text:detail});
   lastContext=contextKey;
  }
 }
 for(const button of root.querySelectorAll('[data-motion-mode]'))button.onclick=()=>{const mode=button.dataset.motionMode;if(state.mode!==mode){state.mode=mode;clearSelection();state.time=0;state.loop=mode!=='walk';load();}};
 for(const button of root.querySelectorAll('[data-motion-camera]'))button.onclick=()=>motion.frame(button.dataset.motionCamera);
 $('[data-motion-muscles]').onchange=event=>{state.showMuscles=event.target.checked;draw();};
 $('[data-motion-context]').onchange=event=>{state.showContext=event.target.checked;draw();};
 $('[data-motion-breath-layer]').onchange=event=>{state.breathLayer=event.target.value;draw();};
 $('[data-motion-active]').onchange=event=>{state.onlyActive=event.target.checked;draw();};
 $('[data-motion-antagonists]').onchange=event=>{state.showAntagonists=event.target.checked;draw();};
 $('[data-motion-isolate]').onchange=event=>{state.isolateSelection=event.target.checked;draw();};
 $('[data-motion-group]').onchange=event=>{state.selectedGroup=event.target.checked;draw();};
 $('[data-motion-walk-list]').onchange=event=>{
  const list=event.target.value,selected=partCache.byKey?.get(state.selected);
  if(list==='recorded'&&selected&&!hasRecording(selected))clearSelection();
  updateWalkList(list);
  draw();
 };
 $('[data-motion-search]').oninput=event=>{
  const query=searchText(event.target.value);
  if(query&&state.walkList!=='all')updateWalkList('all');
  state.walkQuery=query;
  state.walkPage=0;
  draw();
 };
 $('[data-motion-previous]').onclick=()=>{state.walkPage=Math.max(0,state.walkPage-1);draw();};
 $('[data-motion-next]').onclick=()=>{state.walkPage++;draw();};
 $('.motion-compare').onclick=()=>{
  if(!ready()||shownAngle==null)return;
  const toCurl=pressLesson(),limits=[specimen.meta.animation?.startAngle,specimen.meta.animation?.peakAngle];
  const sampleAngle=time=>motion.sampleCurl(time,curlFrame(time,limits.every(Number.isFinite)?limits:undefined).angle);
  state.time=compareElbowTime(shownAngle,toCurl,sampleAngle);
  state.lesson=toCurl?'curl':'press';
  state.playing=false;
  renderControls();draw();
 };
 $('.motion-reveal').onclick=event=>{
  const answer=$('.motion-answer');answer.hidden=!answer.hidden;
  event.currentTarget.setAttribute('aria-expanded',String(!answer.hidden));
  event.currentTarget.textContent=answer.hidden?'Reveal answer':'Hide answer';
 };
 const notesToggle=$('.motion-notes-toggle');
 notesToggle.onclick=()=>{
  const open=root.toggleAttribute('data-motion-notes');
  notesToggle.setAttribute('aria-pressed',String(open));
  notesToggle.firstElementChild.textContent=open?'Show model':'Muscles & notes';
  notesToggle.lastElementChild.textContent=open?'Model':'Muscles';
  motion.dirty=true;
 };
 root.addEventListener('keydown',event=>{
  if(event.key!=='Escape')return;
  if(state.playing){state.playing=false;draw();}
  else if(root.hasAttribute('data-motion-notes')){notesToggle.click();notesToggle.focus();}
 });
 $('.motion-back').onclick=event=>{event.preventDefault();setView('atlas');document.querySelector('[data-open-motion]')?.focus({preventScroll:true});};
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&active&&state.playing){state.playing=false;draw();}});
 document.addEventListener('viewchange',event=>{
  if(event.detail==='motion'){if(!active){active=true;readRoute();load();}}
  else if(active){active=false;state.playing=false;revision++;motion.close();poseLab.close();}
 });
}
