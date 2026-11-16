import * as THREE from 'three';
import {PoseViewer} from './motion-pose-viewer.js';
import {neutralPose} from './motion-pose-core.js';
import {resolveActivityRoles} from './motion-activity-roles.js';
import {poseScopeMatches} from './motion-pose-ik.js';
import {activityScope} from './motion-activity-scope.js';
import {activities,sampleActivity} from './motion-activities.js';
import {createMotionRevealPreference,observeMotionReveal} from './motion-reveal-preference.js';
import {setLearningContext} from './learning-context.js';
import {viewerZoomControls} from './viewer-guidance.js';

const scopes={all:'Whole body','head-neck':'Head & neck',trunk:'Chest, abdomen & back','right-arm':'Right arm & hand','left-arm':'Left arm & hand','right-leg':'Right leg & foot','left-leg':'Left leg & foot'};
const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const normalize=value=>String(value??'').normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase();
const clock=value=>Number(value||0).toFixed(1)+' s';
const contactTerms={flat:'foot down',heel:'heel down',toe:'toes down',air:'airborne'};
function describeContacts(contacts){
 if(!contacts)return '';
 if(contacts.left==='air'&&contacts.right==='air')return 'Both feet airborne';
 if(contacts.left==='flat'&&contacts.right==='flat')return 'Both feet down';
 return ['left','right'].map(side=>side[0].toUpperCase()+side.slice(1)+' '+contactTerms[contacts[side]]).join(' · ');
}
let instances=0;

/** Coordinated, authored teaching animations. Posing and playback have separate state. */
export function initActivitiesLab(host,{revealPreference=createMotionRevealPreference()}={}){
 const prefix='activities-'+(++instances);
 let active=false,ready=false,revision=0,specimen=null,descriptors=[],neutral={},sample=null,pose={};
 let activity=activities[0],time=0,playing=false,loop=true,speed=1,scope='all',selectedMuscle=null;
 let showMuscles=true,onlyRelated=false,notesOpen=false,tab='muscles',page=0,pageSize=5,filter='all';
 let visibleAnatomy=null;
 let cameraMode='cycle',cameraView='front',cameraControls=null;
 let lastFrame=0,lastUI=0,lastRoleKey='',lastListKey='',lastContext='',roleState={rows:[],contributors:[],opposing:[],shared:[],labels:new Map()};
 const cycleBounds=new Map();
 const vertexProbes=new WeakMap();
 host.classList.add('motion-activities-workspace');
 host.innerHTML=`
 <section class="activities-model" aria-label="Movement library">
  <div class="activities-choose">
   <label>Movement<select data-activity-select aria-label="Choose an everyday movement"></select></label>
   <label>Show<select data-activity-scope aria-label="Isolate a body region">${Object.entries(scopes).map(([key,label])=>`<option value="${key}">${label}</option>`).join('')}</select></label>
  </div>
  <div class="motion-stage pose-stage activities-stage" aria-label="Animated whole-body anatomy">
   <div class="motion-status" role="status">Loading the whole-body model…</div>
   <div class="pose-stage-hint"><strong data-activity-phase>Choose a movement</strong><small data-activity-contact>Teaching animation</small></div>
   <div class="motion-reveal-controls"><button type="button" data-activity-reveal aria-pressed="false" title="Fade anatomy covering a highlighted or selected muscle" disabled>Reveal muscles</button><p class="motion-reveal-status" hidden></p></div>
   <span class="motion-handle" aria-hidden="true" hidden><i></i><span>Drag</span></span>
   <span class="motion-load-tag" aria-hidden="true" hidden></span>
   <span data-motion-selection-label aria-hidden="true" hidden></span>
   <div class="pose-view-actions" role="group" aria-label="Movement view controls">
    <button type="button" data-activity-full title="Show the whole body without changing the animation">Full body</button>
    <button type="button" data-activity-focus title="Focus the selected muscle or this movement">Focus</button>
    <button type="button" data-activity-camera="front">Front</button><button type="button" data-activity-camera="side">Side</button><button type="button" data-activity-camera="back">Back</button>
    ${viewerZoomControls}
   </div>
  </div>
  <div class="activities-controls">
   <div class="activities-timeline"><input data-activity-time type="range" min="0" max="1" step="0.01" value="0" aria-label="Animation time"><output data-activity-time-value>0.0 s</output></div>
   <div class="activities-playback" role="group" aria-label="Animation playback">
    <button type="button" data-activity-play aria-pressed="false" disabled>▶ Play</button>
    <button type="button" data-activity-restart aria-label="Restart animation" title="Return to the start">↺ <span>Restart</span></button>
    <button type="button" data-activity-loop aria-pressed="true" title="Repeat the movement">Loop</button>
    <label>Speed<select data-activity-speed aria-label="Playback speed"><option value="0.25">¼×</option><option value="0.5">½×</option><option value="1" selected>1×</option></select></label>
    <button type="button" data-activity-notes aria-expanded="false" aria-controls="${prefix}-notes">Muscles & notes</button>
   </div>
   <div class="activities-summary"><span data-activity-summary>Play, pause or drag the timeline to study each phase.</span><button type="button" data-activity-phase-previous aria-label="Previous movement phase">‹</button><button type="button" data-activity-phase-next aria-label="Next movement phase">›</button></div>
  </div>
 </section>
 <aside class="activities-notes" id="${prefix}-notes" aria-label="Movement muscles and notes">
  <div class="activities-notes-heading"><strong>Movement explorer</strong><button type="button" data-activity-close aria-label="Close movement explorer">×</button></div>
  <div class="activities-tabs" role="tablist" aria-label="Movement information"><button type="button" role="tab" data-activity-tab="muscles" id="${prefix}-tab-muscles" aria-controls="${prefix}-panel" aria-selected="true">Muscles</button><button type="button" role="tab" data-activity-tab="guide" id="${prefix}-tab-guide" aria-controls="${prefix}-panel" aria-selected="false" tabindex="-1">Learn</button><button type="button" role="tab" data-activity-tab="library" id="${prefix}-tab-library" aria-controls="${prefix}-panel" aria-selected="false" tabindex="-1">Find motion</button></div>
  <div class="activities-panel" id="${prefix}-panel" role="tabpanel" aria-labelledby="${prefix}-tab-muscles">
   <div class="activities-role-tools">
    <div class="activities-role-key" aria-label="Muscle color key">
     <span data-cue="concentric">● Shorten</span><span data-cue="eccentric">● Lengthen</span><span data-cue="isometric">● Hold</span>
     <span data-cue="support">● Support</span><span data-cue="contributor">◇ Other contributor</span><span data-cue="mixed">◆ Mixed</span><span data-cue="opponent">○ Opposing action</span>
    </div>
    <input type="search" data-activity-muscle-search aria-label="Search muscles in this phase" placeholder="Find a muscle…">
    <select data-activity-filter aria-label="Filter muscle roles"><option value="all">All roles in this view</option><option value="contributor">All contributors</option><option value="concentric">Shortening under tension</option><option value="eccentric">Lengthening under tension</option><option value="isometric">Holding under tension</option><option value="support">Support / stability</option><option value="mixed">Mixed joint actions</option><option value="opponent">Opposing actions</option></select>
    <div class="activities-options"><button type="button" data-activity-related aria-pressed="false">Related only</button><button type="button" data-activity-muscles aria-pressed="true">Muscles</button><label><input type="checkbox" data-activity-bones> Fade covering bones</label></div>
   </div>
   <input type="search" data-activity-search aria-label="Find an everyday movement" placeholder="Search movements…" hidden>
   <p class="activities-list-caption" data-activity-caption></p>
   <div class="activities-inspect" data-activity-inspect hidden><p data-activity-inspect-note></p><button type="button" data-activity-focus-muscle>Focus</button><button type="button" data-activity-clear-muscle>Clear</button></div>
   <div class="activities-muscle-list"></div>
   <article class="activities-guide" hidden></article>
   <nav class="activities-pager" aria-label="Movement explorer pages"><button type="button" data-activity-page-previous aria-label="Previous page">←</button><output data-activity-page>1 / 1</output><button type="button" data-activity-page-next aria-label="Next page">→</button></nav>
  </div>
 </aside>`;
 const $=selector=>host.querySelector(selector),stage=$('.activities-stage'),list=$('.activities-muscle-list');
 const viewer=new PoseViewer(stage,{frame:advance,selectMuscle,selectJoint:()=>{},markers:()=>{},stepAngle:()=>{},begin:()=>{},angle:()=>{},patch:()=>{},finish:()=>{}});
 viewer.activityMode=true;
 observeMotionReveal(stage);
 const on=(selector,event,fn)=>$(selector).addEventListener(event,fn);
 const button=(selector,fn)=>on(selector,'click',fn);
 function setStatus(text,error=false){
  const status=$('.motion-status');status.hidden=!text;status.replaceChildren();
  if(!text)return;
  status.append(document.createTextNode(text));
  if(error){const retry=document.createElement('button');retry.type='button';retry.textContent='Try again';retry.addEventListener('click',open);status.append(retry);}
 }
 function populateActivities(){
  const groups=new Map();
  for(const entry of activities){const name=entry.category||'Everyday movements';if(!groups.has(name))groups.set(name,[]);groups.get(name).push(entry);}
  $('[data-activity-select]').innerHTML=[...groups].map(([name,entries])=>`<optgroup label="${escape(name)}">${entries.map(entry=>`<option value="${escape(entry.id)}">${escape(entry.label)}</option>`).join('')}</optgroup>`).join('');
  $('[data-activity-select]').value=activity.id;
 }
 function setNotes(open,focus=false){
  notesOpen=open;host.toggleAttribute('data-activity-notes-open',open);
  $('[data-activity-notes]').setAttribute('aria-expanded',String(open));
  if(focus)(open?$('[data-activity-tab="'+tab+'"]'):$('[data-activity-notes]')).focus();
  requestAnimationFrame(()=>{measureList();viewer.dirty=true;});
 }
 function changeTab(value,focus=false){
  tab=value;page=0;lastListKey='';
  for(const item of host.querySelectorAll('[data-activity-tab]')){const selected=item.dataset.activityTab===tab;item.setAttribute('aria-selected',String(selected));item.tabIndex=selected?0:-1;if(selected&&focus)item.focus();}
  $('.activities-panel').setAttribute('aria-labelledby',prefix+'-tab-'+tab);
  $('.activities-role-tools').hidden=tab!=='muscles';$('[data-activity-search]').hidden=tab!=='library';
  list.hidden=tab==='guide';$('.activities-guide').hidden=tab!=='guide';
  renderDetails();requestAnimationFrame(measureList);
 }
 function completePose(partial){
  return Object.fromEntries(Object.entries(neutral).map(([joint,axes])=>[joint,{...axes,...partial[joint]}]));
 }
 function resolveRoles(){return resolveActivityRoles(activity,sample?.phase,descriptors,specimen.parts,pose);}
 function color(force=false){
  if(!specimen)return;
  const next=resolveRoles();
  const key=JSON.stringify([next.contributors,next.opposing,next.shared,next.rows.map(row=>[row.key,row.role,row.cue,row.action]),scope,selectedMuscle,showMuscles,onlyRelated,revealPreference.enabled('actions'),revealPreference.fadeBones()]);
  roleState=next;
  if(force||key!==lastRoleKey){
   lastRoleKey=key;
   visibleAnatomy=activityScope(scope,activity,next,descriptors,specimen.parts,specimen.bones);
   const roleCues=new Map(next.rows.filter(row=>row.kind==='contributor').map(row=>[row.key,row.cue]));
   viewer.color({...next,selectionRoles:next.labels,roleCues,visibleAnatomy,selectedMuscle,showMuscles,onlyRelated,reveal:revealPreference.enabled('actions'),revealBones:revealPreference.fadeBones()});
   lastListKey='';renderDetails();
  }
 }
 function draw({force=false}={}){
  if(!ready||!active)return;
  const previousPhase=sample?.phase;
  sample=sampleActivity(activity,time);pose=completePose(sample.pose);
  const phaseChanged=previousPhase!==sample.phase;
  viewer.applyActivity(pose,sample.root,{ground:activity.ground,rootRotation:sample.rootRotation,contacts:sample.contacts??sample.phase?.contacts});
  const lead=(sample.phase?.roles||[]).find(role=>descriptors.some(joint=>joint.id===role.joint));
  if(lead)viewer.setPoseSelection(activity.focusJoint||lead.joint,lead.axis);
  const now=performance.now();
  if(force||phaseChanged||now-lastUI>90){
   color(force);updateUI();lastUI=now;
   const context=activity.id+'|'+sample.phaseIndex;
   if(context!==lastContext){lastContext=context;setLearningContext({type:'study',label:'Movement library · '+activity.label,reference:'11',text:[activity.description,sample.phase?.label,sample.phase?.explanation,'Authored teaching choreography: highlighted muscles are likely contributors; no measured activation or force is claimed.'].filter(Boolean).join(' ')});}
  }
 }
 function advance(){
  const now=performance.now();
  if(!active||!ready||!playing){lastFrame=now;return;}
  const delta=Math.max(0,(now-(lastFrame||now))/1000);lastFrame=now;
  time+=delta*speed;
  if(time>=activity.duration){if(loop)time%=activity.duration;else{time=activity.duration;playing=false;}}
  draw({force:!playing});
 }
 function updateUI(){
  const phase=sample?.phase;
  $('[data-activity-play]').textContent=playing?'Ⅱ Pause':'▶ Play';$('[data-activity-play]').setAttribute('aria-pressed',String(playing));
  $('[data-activity-loop]').setAttribute('aria-pressed',String(loop));$('[data-activity-time]').max=activity.duration;
  $('[data-activity-time]').value=String(time);$('[data-activity-time]').setAttribute('aria-valuetext',clock(time)+' of '+clock(activity.duration)+(phase?' · '+phase.label:''));
  $('[data-activity-time-value]').textContent=clock(time)+' / '+clock(activity.duration);
  $('[data-activity-phase]').textContent=phase?.label||activity.label;
  $('[data-activity-contact]').textContent=describeContacts(sample?.contacts??phase?.contacts)||'Teaching animation · possible muscle roles';
  const rows=scopedRows();
  const support=rows.filter(row=>row.supporting).length;
  const contributors=rows.filter(row=>row.kind!=='opponent'&&!row.supporting).length;
  const counts=contributors+' contributors'+(support?' + '+support+' support':'');
  $('[data-activity-summary]').textContent=(phase?.label||'Ready')+' · '+counts;
  $('[data-activity-summary]').title=phase?.explanation||'';
  $('[data-activity-scope]').value=scope;$('[data-activity-reveal]').setAttribute('aria-pressed',String(revealPreference.enabled('actions')));
  $('[data-activity-related]').setAttribute('aria-pressed',String(onlyRelated));$('[data-activity-muscles]').setAttribute('aria-pressed',String(showMuscles));
  $('[data-activity-bones]').checked=revealPreference.fadeBones();
  $('[data-activity-phase-previous]').disabled=!ready||!sample||sample.phaseIndex===0&&time<=0;
  $('[data-activity-phase-next]').disabled=!ready||!sample||sample.done||sample.phaseIndex>=activity.phases.length-1;
  renderDetails();
 }
 function scopedRows(){return roleState.rows.filter(row=>visibleAnatomy?.muscleKeys.has(row.key)??poseScopeMatches(scope,row.part));}
 function visibleRows(){
  const query=normalize($('[data-activity-muscle-search]').value).trim().split(/\s+/).filter(Boolean);
  return scopedRows().filter(row=>{
   const matchesRole=filter==='all'||filter==='contributor'&&row.kind!=='opponent'||filter==='opponent'&&row.kind==='opponent'||filter==='mixed'&&row.kind==='mixed'||filter==='support'&&row.supporting||row.types.includes(filter);
   const text=normalize(row.name+' '+row.side);
   return matchesRole&&query.every(word=>text.includes(word));
  });
 }
 function guidePages(){
  const sources=(activity.sources||[]).filter(source=>/^https:\/\//.test(source.url||''));
  const pages=[
   {title:sample?.phase?.label||activity.label,text:sample?.phase?.explanation||activity.description,extra:'Orange marks shortening, blue controlled lengthening, and purple holding. Teal marks possible support, light green other contributors, gold mixed joint actions and lavender opposing actions.'},
   {title:activity.label,text:activity.description,extra:'Play or scrub through the cycle. Use ¼× speed to inspect a transition. Isolate a limb without interrupting the movement; Full body brings everything back.'},
   {title:'Read muscle activity carefully',text:'Shortening under tension = concentric. Controlled lengthening = eccentric. Holding without a visible change in length = isometric.',extra:'These labels describe an authored teaching scenario. Actual recruitment depends on load, posture, speed and the person. The model is not motion capture, a muscle-force simulation or measured EMG.'},
   {title:'See deeper muscles',text:'Search for a muscle and select it to reveal its surface through neighboring anatomy, including other highlighted muscles. Focus brings it closer. Clear the selection to return to group view.',extra:'Muscle shapes are approximate and may stretch or overlap during large movements. Opposing actions are not proof that a muscle is switched off.'},
   {title:'Sources',text:'Muscle actions and contraction principles support this teaching choreography. Sources do not validate the exact timing or intensity of this animation.'},
  ];
  // Short cards remain readable on landscape phones without an inner scrollbar.
  return [...pages.flatMap(item=>[{title:item.title,text:item.text},...(item.extra?[{title:item.title+' · continued',text:item.extra}]:[])]),...sources.map(source=>({title:'Read the source',text:'Opens the source in a new tab; your animation stays here.',sources:[source]}))];
 }
 function renderDetails(){
  const selected=scopedRows().find(row=>row.key===selectedMuscle);
  $('[data-activity-inspect]').hidden=tab!=='muscles'||!selectedMuscle;
  $('[data-activity-focus-muscle]').disabled=!viewer.selectedPart;
  const note=$('[data-activity-inspect-note]');
  const description=selected?[selected.name,selected.action||selected.role].join(' · '):'Selection carried over from the previous phase.';
  if(note.textContent!==description)note.textContent=description;
  if(tab==='guide'){
   const pages=guidePages();page=Math.max(0,Math.min(page,pages.length-1));const item=pages[page];
   const key=JSON.stringify([tab,page,item]);if(key!==lastListKey){lastListKey=key;$('.activities-guide').innerHTML=`<h3>${escape(item.title)}</h3><p>${escape(item.text)}</p>${item.extra?`<p>${escape(item.extra)}</p>`:''}${(item.sources||[]).map(source=>`<a href="${escape(source.url)}" target="_blank" rel="noopener">${escape(source.title)} ↗</a>`).join('')}`;}
   $('[data-activity-caption]').textContent='Learning notes';updatePager(pages.length);return;
  }
  const query=normalize($('[data-activity-search]').value);
  const entries=tab==='muscles'?visibleRows():activities.filter(entry=>normalize(entry.label+' '+entry.category+' '+entry.description).includes(query));
  const count=Math.max(1,Math.ceil(entries.length/pageSize));page=Math.max(0,Math.min(page,count-1));
  const shown=entries.slice(page*pageSize,(page+1)*pageSize);
  const key=JSON.stringify([tab,page,scope,selectedMuscle,activity.id,shown.map(row=>[row.key||row.id,row.role])]);
  if(key!==lastListKey){
   lastListKey=key;
   list.innerHTML=shown.length?shown.map(row=>tab==='muscles'?`<button type="button" data-activity-muscle="${escape(row.key)}" data-kind="${row.kind}" data-cue="${row.kind==='contributor'?row.cue:row.kind}" data-contraction="${row.types.join(' ')}" aria-pressed="${row.key===selectedMuscle}" title="${escape(row.name+' · '+row.role+' · '+row.action)}"><span>${escape(row.name)} <small>· ${escape(row.side)}</small></span><small>${escape(row.role)}</small></button>`:`<button type="button" data-activity-choice="${escape(row.id)}" aria-pressed="${row.id===activity.id}"><span>${escape(row.label)}</span><small>${escape(row.category)} · ${row.duration} s</small></button>`).join(''):'<p class="activities-empty">'+(tab==='library'?'No movements match. Try a shorter name.':'No matching muscles. Clear the search or change the role filter.')+'</p>';
  }
  const total=tab==='muscles'?scopedRows().length:0;
  $('[data-activity-caption]').textContent=tab==='library'?entries.length+' movements':(entries.length===total?total+' muscle components':entries.length+' of '+total+' muscle components')+' · '+(sample?.phase?.label||'Ready');
  updatePager(count);
 }
 function updatePager(count){$('[data-activity-page]').textContent=(page+1)+' / '+count;$('[data-activity-page-previous]').disabled=page===0;$('[data-activity-page-next]').disabled=page>=count-1;}
 function measureList(){
  if(tab==='guide'||!list.clientHeight)return;
  const next=Math.max(1,Math.floor((list.clientHeight+5)/57));
  if(next!==pageSize){pageSize=next;page=0;lastListKey='';renderDetails();}
 }
 function focusActivity(){
  if(!ready)return;
  if(selectedMuscle&&viewer.selectedPart){cameraMode='muscle';viewer.focusMuscle();return;}
  if(activity.focusJoint){cameraMode='focus';const joint=descriptors.find(item=>item.id===activity.focusJoint);if(joint)viewer.setPoseSelection(joint.id,joint.axes[0]?.id);viewer.focusJoint(activity.view||'front',activity.focusRadius);}
  else frameCycle(activity.view||'front');
 }
 function frameCycle(view='front'){
  if(!ready)return;
  cameraMode='cycle';cameraView=view;
  const key=activity.id+'|'+scope;
  if(!cycleBounds.has(key)){
   const bounds=new THREE.Box3(),point=new THREE.Vector3();
   const times=new Set([0,activity.duration,...activity.keyframes.map(frame=>frame.time),...activity.phases.map(phase=>(phase.start+phase.end)/2)]);
   for(const at of times){
    const frame=sampleActivity(activity,at);
    viewer.applyActivity(completePose(frame.pose),frame.root,{ground:activity.ground,rootRotation:frame.rootRotation,contacts:frame.contacts??frame.phase?.contacts});
    for(const bone of specimen.bones||[]){
     if(!poseScopeMatches(scope,bone))continue;
     const mesh=bone.mesh;
     let probes=vertexProbes.get(mesh.geometry);
     if(!probes){
      const position=mesh.geometry.getAttribute('position'),indices=new Set();
      const low=[Infinity,Infinity,Infinity],high=[-Infinity,-Infinity,-Infinity],extremes=[0,0,0,0,0,0];
      for(let i=0;i<position.count;i++)for(let axis=0;axis<3;axis++){
       const value=position.getComponent(i,axis);
       if(value<low[axis]){low[axis]=value;extremes[axis*2]=i;}
       if(value>high[axis]){high[axis]=value;extremes[axis*2+1]=i;}
      }
      for(const index of extremes)indices.add(index);
      for(let i=0;i<24;i++)indices.add(Math.floor(i*(position.count-1)/23));
      probes=[...indices];vertexProbes.set(mesh.geometry,probes);
     }
     for(const index of probes){mesh.getVertexPosition(index,point);bounds.expandByPoint(point.applyMatrix4(mesh.matrixWorld));}
    }
   }
   viewer.applyActivity(pose,sample.root,{ground:activity.ground,rootRotation:sample.rootRotation,contacts:sample.contacts??sample.phase?.contacts});
   // Sample deformed bone vertices, including neutral extrema. These bones are
   // skinned too: untransformed geometry bounds would miss the animated limbs.
   if(!bounds.isEmpty())cycleBounds.set(key,bounds.expandByScalar(scope==='head-neck'?.035:.065));
  }
  const bounds=cycleBounds.get(key);if(bounds)viewer.fitBounds(bounds,view);else viewer.frame(view);
 }
 function choose(id,{updateRoute=true}={}){
  const next=activities.find(item=>item.id===id);if(!next)return false;
  activity=next;time=0;playing=false;lastFrame=0;selectedMuscle=null;scope=activity.scope||'all';page=0;lastRoleKey='';lastListKey='';visibleAnatomy=null;
  filter='all';$('[data-activity-filter]').value=filter;$('[data-activity-muscle-search]').value='';
  $('[data-activity-select]').value=activity.id;viewer.setScope(scope);
  if(updateRoute){const url=new URL(location.href);url.searchParams.set('motionActivity',activity.id);url.searchParams.set('motionMode','activities');url.searchParams.delete('activity');history.replaceState(history.state,'',url);}
  if(ready){draw({force:true});if(activity.id==='grasp'||activity.id==='reach-forward')frameCycle(activity.view||'front');else focusActivity();}else updateUI();
  if(matchMedia('(max-width:959px)').matches)setNotes(false);return true;
 }
 function selectMuscle(key){
  if(!ready||!specimen.parts.some(part=>part.key===key))return;
  selectedMuscle=selectedMuscle===key?null:key;color(true);updateUI();
 }
 function seek(value){time=Math.max(0,Math.min(activity.duration,Number(value)||0));playing=false;draw({force:true});}
 function togglePlay(){if(!ready)return;if(!playing&&time>=activity.duration)time=0;playing=!playing;lastFrame=performance.now();draw({force:true});}
 function changeScope(next){if(!Object.hasOwn(scopes,next))return;scope=next;selectedMuscle=null;page=0;viewer.setScope(scope);draw({force:true});frameCycle(activity.view||'front');}
 function phaseStep(direction){
  if(!sample)return;
  const current=sample.done&&sample.phaseIndex===0?activity.phases.length:sample.phaseIndex;
  const index=Math.max(0,Math.min(activity.phases.length-1,current+direction));
  seek(activity.phases[index].start);
 }
 button('[data-activity-play]',togglePlay);
 button('[data-activity-restart]',()=>{time=0;lastFrame=performance.now();draw({force:true});});
 button('[data-activity-loop]',()=>{loop=!loop;updateUI();});
 on('[data-activity-speed]','change',event=>{speed=Number(event.target.value);lastFrame=performance.now();});
 on('[data-activity-time]','input',event=>seek(event.target.value));
 on('[data-activity-select]','change',event=>choose(event.target.value));
 on('[data-activity-scope]','change',event=>changeScope(event.target.value));
 button('[data-activity-full]',()=>changeScope('all'));button('[data-activity-focus]',focusActivity);
 button('[data-activity-reveal]',()=>{revealPreference.setEnabled(!revealPreference.enabled('actions'));color(true);updateUI();});
 on('[data-activity-bones]','change',event=>{revealPreference.setFadeBones(event.target.checked);color(true);});
 button('[data-activity-related]',()=>{onlyRelated=!onlyRelated;color(true);updateUI();});
 button('[data-activity-muscles]',()=>{showMuscles=!showMuscles;color(true);updateUI();});
 button('[data-activity-notes]',()=>setNotes(!notesOpen,true));button('[data-activity-close]',()=>setNotes(false,true));
 button('[data-activity-page-previous]',()=>{page--;renderDetails();});button('[data-activity-page-next]',()=>{page++;renderDetails();});
 button('[data-activity-phase-previous]',()=>phaseStep(-1));button('[data-activity-phase-next]',()=>phaseStep(1));
 on('[data-activity-filter]','change',event=>{filter=event.target.value;page=0;lastListKey='';renderDetails();});
 button('[data-activity-focus-muscle]',()=>{
  if(!viewer.selectedPart)return;
  if(notesOpen)setNotes(false,true);
  focusActivity();
 });
 button('[data-activity-clear-muscle]',()=>{if(selectedMuscle)selectMuscle(selectedMuscle);});
 on('[data-activity-muscle-search]','input',()=>{page=0;lastListKey='';renderDetails();});
 on('[data-activity-search]','input',()=>{page=0;lastListKey='';renderDetails();});
 host.addEventListener('click',event=>{
  const muscle=event.target.closest('[data-activity-muscle]'),choice=event.target.closest('[data-activity-choice]'),tabButton=event.target.closest('[data-activity-tab]'),camera=event.target.closest('[data-activity-camera]'),zoom=event.target.closest('[data-viewer-zoom]');
  if(muscle)selectMuscle(muscle.dataset.activityMuscle);if(choice)choose(choice.dataset.activityChoice);if(tabButton)changeTab(tabButton.dataset.activityTab);
  if(camera&&ready)frameCycle(camera.dataset.activityCamera);if(zoom&&ready){cameraMode='manual';viewer.zoom(zoom.dataset.viewerZoom);}
 });
 host.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&notesOpen){event.preventDefault();setNotes(false,true);return;}
  const tabs=[...host.querySelectorAll('[data-activity-tab]')],index=tabs.indexOf(event.target);
  if(index>=0&&['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?tabs.length-1:(index+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;changeTab(tabs[next].dataset.activityTab,true);}
 });
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&playing){playing=false;updateUI();}});
 const resize=new ResizeObserver(()=>{measureList();viewer.dirty=true;});resize.observe(list);
 const stageResize=new ResizeObserver(()=>requestAnimationFrame(()=>{
  if(!ready||!active)return;
  if(cameraMode==='cycle')frameCycle(cameraView);
  else if(cameraMode==='focus'||cameraMode==='muscle')focusActivity();
 }));stageResize.observe(stage);
 populateActivities();
 async function open(){
  active=true;ready=false;const run=++revision;host.hidden=false;setStatus('Loading the whole-body model…');
  for(const element of host.querySelectorAll('.activities-controls button,.activities-controls input,.activities-controls select,.activities-choose select,.pose-view-actions button,[data-activity-reveal]'))element.disabled=true;
  try{
   viewer.open();
   if(cameraControls!==viewer.controls){cameraControls=viewer.controls;cameraControls.addEventListener('start',()=>{cameraMode='manual';});}
   const loaded=await viewer.loadBody();if(!active||run!==revision)return;
   specimen=loaded;descriptors=specimen.descriptors||specimen.meta.descriptors;neutral=neutralPose(descriptors);viewer.use(specimen);viewer.showGround(true);ready=true;
   for(const element of host.querySelectorAll('.activities-controls button,.activities-controls input,.activities-controls select,.activities-choose select,.pose-view-actions button,[data-activity-reveal]'))element.disabled=false;
   const query=new URLSearchParams(location.search);
   setStatus('');if(!choose(query.get('motionActivity')||query.get('activity')||activity.id,{updateRoute:false}))choose(activity.id,{updateRoute:false});requestAnimationFrame(measureList);
  }catch(error){if(!active||run!==revision)return;ready=false;playing=false;setStatus(error.message||'The movement model could not load.',true);}
 }
 function close(){active=false;ready=false;playing=false;revision++;viewer.close();host.hidden=true;}
 return {open,close,viewer,getState:()=>({ready,active,activity:activity.id,time,playing,loop,speed,scope,selectedMuscle,pose,sample,roles:roleState})};
}
