import {viewerZoomControls} from './viewer-guidance.js';
import {motionStudyGuides} from './motion-study-guides.js';
import {observeMotionReveal} from './motion-reveal-preference.js';

const scopes={all:'Whole body','head-neck':'Head & neck',trunk:'Chest, abdomen & back','right-arm':'Right arm','left-arm':'Left arm','right-leg':'Right leg','left-leg':'Left leg'};
const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const normalize=value=>String(value??'').normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase();
const axesFor=joint=>Array.isArray(joint?.axes)?joint.axes:Object.entries(joint?.axes||{}).map(([id,axis])=>({id,...axis}));
const listName=entry=>typeof entry==='string'?entry:entry.name||entry.label||entry.id||entry.key;
const listId=entry=>typeof entry==='string'?entry:entry.key||entry.id||entry.name;
let nextInstance=0;

/** UI only. Pose geometry, constraints and gesture transactions belong to the controller. */
export function createPoseUI(host,callbacks={}){
 const prefix='whole-pose-'+(++nextInstance),controller=new AbortController(),signal=controller.signal;
 const call=(name,...args)=>callbacks[name]?.(...args);
 host.classList.add('motion-pose-workspace');
 host.innerHTML=`
 <section class="pose-model" aria-label="Whole-body posing workspace">
  <div class="motion-stage pose-stage" aria-label="Interactive whole-body pose">
   <div class="motion-status" role="status">Loading the whole-body model…</div>
   <div class="pose-stage-hint"><span>Choose a joint. Drag its ring or try Play motion.</span><small>Teaching pose · muscle shapes are approximate</small></div>
   <div class="motion-reveal-controls">
    <button type="button" data-pose-reveal aria-label="Reveal muscles" aria-pressed="false" title="Fade muscles that cover a highlighted or selected muscle" disabled>Reveal muscles</button>
    <p class="motion-reveal-status" hidden></p>
   </div>
   <div class="pose-joint-markers" role="group" aria-label="Joints in this view"></div>
   <span class="motion-handle" aria-hidden="true" hidden><i></i><span>Drag</span></span>
   <span class="motion-load-tag" aria-hidden="true" hidden></span>
   <span data-motion-selection-label aria-hidden="true" hidden></span>
   <div class="pose-view-actions" role="group" aria-label="View controls">
    <button type="button" data-pose-full title="Show the whole body and keep your pose">Full body</button>
    <button type="button" data-pose-focus title="Move the camera closer to this joint">Focus joint</button>
    <button type="button" data-pose-camera="front">Front</button>
    <button type="button" data-pose-camera="side">Side</button>
    <button type="button" data-pose-camera="back" hidden>Back</button>
    ${viewerZoomControls}
   </div>
  </div>
  <div class="pose-controls" aria-label="Pose controls">
   <div class="pose-choose-row">
    <label>Joint<select data-pose-joint aria-label="Select a joint"></select></label>
    <label>Movement<select data-pose-axis aria-label="Select a joint movement"></select></label>
    <button type="button" data-pose-endpoint hidden aria-pressed="false" title="Move the end of this limb using linked joints">Move limb</button>
   </div>
   <div class="pose-angle-row">
    <button type="button" data-pose-minus aria-label="Decrease joint angle">Back</button>
    <input type="range" data-pose-angle min="0" max="100" step="1" value="0" aria-label="Joint angle">
    <button type="button" data-pose-neutral title="Return this joint to its starting position"><output data-pose-angle-value aria-hidden="true">0°</output><small>Neutral</small></button>
    <button type="button" data-pose-plus aria-label="Increase joint angle">Forward</button>
   </div>
   <div class="pose-action-row">
    <button type="button" data-pose-play aria-pressed="false" title="Play this movement once, then return to your pose">Play motion</button>
    <button type="button" data-pose-undo aria-label="Undo last pose change" title="Undo the last pose change"><span>Undo</span><i aria-hidden="true">↶</i></button>
    <button type="button" data-pose-redo aria-label="Redo pose change" title="Redo a pose change"><span>Redo</span><i aria-hidden="true">↷</i></button>
    <button type="button" data-pose-lock aria-pressed="false" title="Keep this joint's angles fixed">Lock angles</button>
    <button type="button" data-pose-reset aria-label="Reset pose" title="Return all joints to their starting pose. You can undo this.">Reset</button>
    <button type="button" data-pose-muscles aria-pressed="true">Muscles</button>
    <button type="button" data-pose-notes aria-expanded="false" aria-controls="${prefix}-details">Explore</button>
   </div>
   <button type="button" class="pose-muscle-summary" data-pose-muscle-summary><span data-pose-movement-name>Explore a movement</span><span class="pose-summary-roles"><span class="pose-contributor-key" data-pose-contributor-summary>Move a joint to see muscle roles</span><span class="pose-opponent-key" data-pose-opponent-summary></span><span class="pose-mixed-key" data-pose-mixed-summary hidden></span></span><span class="pose-summary-open" aria-hidden="true">Muscle roles ↗</span></button>
   <p class="pose-feedback" role="status" aria-live="polite"></p>
  </div>
 </section>
 <aside class="pose-details" id="${prefix}-details" aria-label="Pose explorer">
  <div class="pose-details-heading"><strong>Pose explorer</strong><button type="button" data-pose-close aria-label="Close pose explorer">×</button></div>
  <div class="pose-details-tabs" role="tablist" aria-label="Pose explorer content">
   <button type="button" role="tab" data-pose-tab="muscles" aria-selected="true" id="${prefix}-tab-muscles" aria-controls="${prefix}-panel">Muscles</button>
   <button type="button" role="tab" data-pose-tab="guides" aria-selected="false" tabindex="-1" id="${prefix}-tab-guides" aria-controls="${prefix}-panel">Motions</button>
   <button type="button" role="tab" data-pose-tab="joints" aria-selected="false" tabindex="-1" id="${prefix}-tab-joints" aria-controls="${prefix}-panel">Find joint</button>
   <button type="button" role="tab" data-pose-tab="help" aria-selected="false" tabindex="-1" id="${prefix}-tab-help" aria-controls="${prefix}-panel">How it works</button>
  </div>
  <div class="pose-details-panel" id="${prefix}-panel" role="tabpanel" aria-labelledby="${prefix}-tab-muscles" tabindex="0">
   <div class="pose-detail-tools" data-pose-find-tools hidden>
    <input type="search" data-pose-search aria-label="Find a joint by name" placeholder="Find a joint…" autocomplete="off">
    <label>Show<select data-pose-scope aria-label="Show body region">${Object.entries(scopes).map(([key,value])=>`<option value="${key}">${value}</option>`).join('')}</select></label>
   </div>
   <div class="pose-role-key"><span class="pose-contributor-key" data-pose-contributor-key>◇ Possible contributors</span><span class="pose-opponent-key" data-pose-opponent-key>○ Opposing action</span><span class="pose-mixed-key" data-pose-mixed-key hidden>◆ Mixed joint roles</span><button type="button" data-pose-related aria-pressed="false" title="Show only related muscles and the selected muscle" hidden>Related only</button></div>
   <div class="pose-reveal-options" hidden>
    <label hidden><input type="checkbox" data-pose-reveal-bones> Fade covering bones</label>
    <button type="button" class="motion-reveal-option" data-pose-muscle-focus hidden>Focus muscle</button>
    <button type="button" class="motion-reveal-option" data-pose-explore-contributors hidden>Explore contributors</button>
   </div>
   <p class="pose-list-summary"></p>
   <p class="pose-role-note" hidden></p>
   <div class="pose-detail-list"></div>
   <div class="pose-help-page" hidden></div>
   <nav class="pose-list-pager" aria-label="Explorer pages"><button type="button" data-pose-previous aria-label="Previous explorer page">←</button><span data-pose-page></span><button type="button" data-pose-next aria-label="Next explorer page">→</button></nav>
  </div>
 </aside>`;
 const $=selector=>host.querySelector(selector),stage=$('.pose-stage'),markerLayer=$('.pose-joint-markers');
 observeMotionReveal(stage);
 let state={ready:false,descriptors:[],selectedJoint:null,selectedAxis:null,pose:{},canUndo:false,canRedo:false,scope:'all',locked:false,showMuscles:true,contributors:[],opponents:[],message:''};
 let tab='muscles',page=0,query='',notesOpen=false,rangeGesture=null,renderedDescriptorKey='',renderedAxisKey='',renderedListKey='',pageSize=5;
 const markers=new Map();
 const on=(element,event,handler)=>element.addEventListener(event,handler,{signal});
 const button=(selector,handler)=>on($(selector),'click',handler);
 const joint=()=>state.descriptors.find(entry=>entry.id===state.selectedJoint);
 const axis=()=>axesFor(joint()).find(entry=>entry.id===state.selectedAxis)||axesFor(joint())[0];
 const isLocked=()=>typeof state.locked==='boolean'?state.locked:state.locked instanceof Set?state.locked.has(state.selectedJoint):Array.isArray(state.locked)?state.locked.includes(state.selectedJoint):!!state.locked?.[state.selectedJoint];
 const angle=()=>{
  const current=axis(),value=state.pose?.[state.selectedJoint]?.[current?.id];
  return Number.isFinite(Number(value))?Number(value):Number(current?.neutral??current?.default??0);
 };
 function toggleNotes(open,focus=false){
  notesOpen=open;
  host.toggleAttribute('data-pose-notes-open',open);
  $('[data-pose-notes]').setAttribute('aria-expanded',String(open));
  call('notesChange',open);
  measureList();
  if(focus){if(open)$('[data-pose-tab="'+tab+'"]').focus();else $('[data-pose-notes]').focus();}
 }
 function changeTab(next,focus=false){
  tab=next;page=0;renderedListKey='';
  for(const item of host.querySelectorAll('[data-pose-tab]')){
   const selected=item.dataset.poseTab===tab;
   item.setAttribute('aria-selected',String(selected));item.tabIndex=selected?0:-1;
   if(selected&&focus)item.focus();
  }
  $('.pose-details-panel').setAttribute('aria-labelledby',prefix+'-tab-'+tab);
  $('[data-pose-find-tools]').hidden=tab!=='joints';
  $('.pose-role-key').hidden=tab!=='muscles';
  $('.pose-help-page').hidden=tab!=='help';
  $('.pose-detail-list').hidden=tab==='help';
  renderDetails();measureList();
 }
 const helpPages=[
  ['Make a pose','Choose a joint and movement. Use the named direction buttons, drag the slider, or drag the ring on the model.'],
  ['Watch one movement','Play motion demonstrates the selected movement and returns to your pose. Pause keeps the current position.'],
  ['Return one joint','The angle button marked Neutral resets only the selected joint. Reset returns the whole body. Both can be undone.'],
  ['Turn the view','Choose a joint from the dropdown to focus it. Drag to rotate or use Zoom + and Zoom −. Focus joint brings the selected joint back into view.'],
  ['Keep your pose','Full body returns to the overview while keeping your pose. Reset returns all joints to their starting position.'],
  ['Keep a joint fixed','Lock angles fixes a joint’s settings. It still moves with its parent. Undo reverses one completed adjustment.'],
  ['Read the colors','Green marks possible contributors. Violet marks opposing actions. Gold identifies muscles or grouped surfaces with mixed roles.'],
  ['See deeper muscles','Turn on Reveal muscles and choose a muscle to see it through the muscles covering it. Faded muscles keep their role colors. Focus muscle moves the camera closer.'],
  ['Understand activity','A fixed pose cannot tell us which muscles are active. Task, load and coordination affect recruitment.'],
  ['Compare muscle activity','Muscle actions offers guided contraction examples. Walk cycle shows recorded EMG for measured muscles.'],
  ['Find an articulation','Find joint searches supported articulations and lets you isolate a region. Facial and breathing controls guide surface shapes.'],
  ['Face and breathing','Try a timed lesson.'],
 ];
 function rows(){
  if(tab==='guides')return motionStudyGuides.map(guide=>({...guide,name:guide.label,kind:'guide'}));
  if(tab==='joints')return state.descriptors.filter(entry=>!query||normalize(entry.label+' '+entry.region+' '+entry.side).includes(query)).map(entry=>({...entry,name:entry.label,kind:'joint'}));
  const entries=[],seen=new Set();
  for(const [kind,list] of [['contributor',state.contributors],['opponent',state.opponents],['mixed',state.mixedRoles]])for(const entry of list||[]){
   const id=listId(entry);if(!id||seen.has(id))continue;seen.add(id);
   entries.push({...(typeof entry==='string'?{id,name:entry}:entry),kind});
  }
  return entries;
 }
 function renderDetails(){
  const movementNote=state.movementNote||axis()?.note||joint()?.note||state.evidence;
  const noteWords=String(movementNote||'').split(/\s+/).filter(Boolean),notePages=[];
  for(let i=0;i<noteWords.length;i+=22)notePages.push(['About this movement',noteWords.slice(i,i+22).join(' ')]);
  const currentHelp=[...helpPages,...notePages];
  const list=rows(),pages=tab==='help'?currentHelp.length:Math.max(1,Math.ceil(list.length/pageSize));
  page=Math.max(0,Math.min(page,pages-1));
  const summary=tab==='guides'?'Choose a movement to study':tab==='joints'?`${list.length} ${list.length===1?'joint':'joints'} · choose one to pose`:tab==='help'?'Pose, inspect and compare':list.length?state.movementLabel||`${joint()?.label||'Joint'} · last adjustment`:state.selectedMuscleName?state.selectedMuscleName+' · selected muscle':'Move a joint to explore possible muscle roles.';
  $('.pose-list-summary').textContent=summary;
  const roleNote=$('.pose-role-note');
  roleNote.hidden=tab!=='muscles'||!state.roleNote;
  if(roleNote.textContent!==state.roleNote){roleNote.textContent=state.roleNote||'';roleNote.title=state.roleNote||'';}
  $('[data-pose-related]').hidden=!list.length&&!state.selectedMuscle&&!state.onlyRelated;
  $('[data-pose-related]').setAttribute('aria-pressed',String(!!state.onlyRelated));
  const bones=$('[data-pose-reveal-bones]'),focus=$('[data-pose-muscle-focus]'),explore=$('[data-pose-explore-contributors]');
  bones.parentElement.hidden=!state.reveal;
  bones.checked=!!state.revealBones;
  focus.hidden=!state.canFocusMuscle;
  explore.hidden=!state.reveal||state.contributors.length<2;
  $('.pose-reveal-options').hidden=tab!=='muscles'||!state.ready||!state.showMuscles||(bones.parentElement.hidden&&focus.hidden&&explore.hidden);
  const visible=list.slice(page*pageSize,(page+1)*pageSize),key=JSON.stringify([tab,page,pageSize,visible.map(entry=>[listId(entry),listName(entry),entry.kind,entry.note,entry.roleLabel]),state.selectedJoint,state.selectedMuscle,state.studyGuide?.id,movementNote]);
  if(key!==renderedListKey){
   renderedListKey=key;
   if(tab==='help'){
    const [title,lead]=currentHelp[page];
    $('.pose-help-page').innerHTML=`<h3>${escape(title)}</h3><p>${escape(lead)}</p>${title==='Face and breathing'?'<div class="pose-lesson-links"><button type="button" data-pose-lesson="blink">Blink</button><button type="button" data-pose-lesson="smile">Smile</button><button type="button" data-pose-lesson="jaw">Jaw</button><button type="button" data-pose-lesson="breath">Breathing</button></div>':''}`;
   }else{
    $('.pose-detail-list').innerHTML=visible.map(entry=>{
     const id=listId(entry),name=listName(entry),selected=tab==='guides'?id===state.studyGuide?.id:tab==='joints'?id===state.selectedJoint:id===state.selectedMuscle;
     const subtitle=entry.kind==='guide'?(scopes[entry.scope]||'Guided movement'):entry.kind==='joint'?entry.regionLabel||scopes[entry.region]||entry.region||'Joint':entry.roleLabel||(entry.kind==='contributor'?'Possible contributor':entry.kind==='mixed'?'Mixed joint roles':'Opposing action');
     const symbol={contributor:'◇ ',opponent:'○ ',mixed:'◆ '}[entry.kind]||'';
     return `<button type="button" data-pose-row="${escape(id)}" data-kind="${entry.kind}" aria-pressed="${selected}" title="${escape(entry.note||name+' · '+subtitle)}"><span>${symbol}${escape(name)}</span><small>${escape(subtitle)}</small></button>`;
    }).join('')||`<p class="pose-empty">${tab==='joints'?'No matching joint. Try a shorter name.':state.ready?'The model will highlight supported muscle roles when you adjust a joint.':'The model is loading.'}</p>`;
   }
  }
  $('[data-pose-previous]').disabled=page===0;
  $('[data-pose-next]').disabled=page>=pages-1;
  $('[data-pose-page]').textContent=(page+1)+' / '+pages;
  $('.pose-list-pager').hidden=pages<2;
 }
 function measureList(){
  const list=$('.pose-detail-list'),panel=$('.pose-details-panel');
  if(!panel.clientHeight||tab==='help')return;
  const row=list.querySelector('button');
  const rowHeight=row?Number.parseFloat(getComputedStyle(row).minHeight)||44:44;
  const gap=Number.parseFloat(getComputedStyle(list).rowGap)||5;
  const next=Math.max(1,Math.min(10,Math.floor((list.clientHeight+gap)/(rowHeight+gap))));
  if(next!==pageSize){pageSize=next;renderDetails();}
  // The list stays within its panel; paging supplies the rest at every viewport size.
  list.style.setProperty('--pose-page-size',String(pageSize));
 }
 function update(snapshot={}){
  state={...state,...snapshot};
  const descriptors=Array.isArray(state.descriptors)?state.descriptors:Object.values(state.descriptors||{});
  state.descriptors=descriptors;
  const descriptorKey=JSON.stringify(descriptors.map(entry=>[entry.id,entry.label,entry.region]));
  if(renderedDescriptorKey!==descriptorKey){
   renderedDescriptorKey=descriptorKey;
   const groups=new Map();
   for(const entry of descriptors){const group=entry.regionLabel||scopes[entry.region]||entry.region||'Body';if(!groups.has(group))groups.set(group,[]);groups.get(group).push(entry);}
   $('[data-pose-joint]').innerHTML=[...groups].map(([name,entries])=>`<optgroup label="${escape(name)}">${entries.map(entry=>`<option value="${escape(entry.id)}">${escape(entry.label)}</option>`).join('')}</optgroup>`).join('');
  }
  const previousJoint=$('[data-pose-joint]').value;
  $('[data-pose-joint]').value=state.selectedJoint||'';
  const currentJoint=joint(),axes=axesFor(currentJoint),axisKey=JSON.stringify([state.selectedJoint,axes,state.axisLabels]);
  if(renderedAxisKey!==axisKey){renderedAxisKey=axisKey;$('[data-pose-axis]').innerHTML=axes.map(entry=>`<option value="${escape(entry.id)}">${escape(state.axisLabels?.[entry.id]||entry.label||entry.id)}</option>`).join('');}
  $('[data-pose-axis]').value=state.selectedAxis||axes[0]?.id||'';
  const currentAxis=axis(),locked=isLocked(),range=$('[data-pose-angle]'),value=angle();
  const percent=['%','percent'].includes(currentAxis?.unit),unit=percent?'%':'°';
  if(currentAxis){
   range.min=String(currentAxis.min??currentAxis.limits?.[0]??0);
   range.max=String(currentAxis.max??currentAxis.limits?.[1]??100);
   range.step=String(currentAxis.step??1);
   range.value=String(value);
   range.setAttribute('aria-label',(currentJoint.label||'Joint')+' · '+(currentAxis.label||'angle'));
   range.setAttribute('aria-valuetext',`${Math.round(value*10)/10} ${percent?'percent':'degrees'}${locked?', joint angles locked':''}`);
  }
  $('[data-pose-angle-value]').textContent=(Math.round(value*10)/10)+unit;
  const direction=state.directionLabels||{},step=percent?10:5;
  for(const [selector,key,fallback] of [['[data-pose-minus]','negative','Back'],['[data-pose-plus]','positive','Forward']]){
   const control=$(selector),name=direction[key]||fallback,hint=direction[key+'Hint']||name;
   control.textContent=hint;
   control.title=name+' · '+step+(percent?' percentage points':' degrees')+' per press';
   control.setAttribute('aria-label',name+', '+step+(percent?' percentage points':' degrees')+' per press');
  }
  $('[data-pose-neutral]').setAttribute('aria-label',`Return ${currentJoint?.label||'this joint'} to neutral; current ${currentAxis?.label||'angle'} ${Math.round(value*10)/10} ${percent?'percent':'degrees'}`);
  for(const selector of ['[data-pose-joint]','[data-pose-axis]','[data-pose-reset]','[data-pose-full]','[data-pose-muscles]'])$(selector).disabled=!state.ready;
  for(const selector of ['[data-pose-minus]','[data-pose-plus]','[data-pose-angle]'])$(selector).disabled=!state.ready||!currentAxis||locked||state.movementLocked;
  $('[data-pose-minus]').disabled||=value<=Number(range.min);
  $('[data-pose-plus]').disabled||=value>=Number(range.max);
  $('[data-pose-neutral]').disabled=!state.ready||!currentJoint||locked||state.canNeutralize===false;
  $('[data-pose-play]').disabled=!state.ready||!currentAxis||locked||(state.playbackLocked??state.movementLocked);
  $('[data-pose-play]').setAttribute('aria-pressed',String(!!state.playing));
  $('[data-pose-play]').textContent=state.playing?'Pause':'Play motion';
  $('[data-pose-play]').setAttribute('aria-label',state.playing?'Pause movement at this position':'Play the selected movement once');
  $('[data-pose-play]').title=state.playing?'Pause and keep this position':'Play this movement once, then return to your pose';
  $('[data-pose-focus]').disabled=!state.ready||!currentJoint;
  const rear=state.studyGuide?.scope==='head-neck'||state.studyGuide?.rear;
  $('[data-pose-camera="back"]').hidden=!rear;
  $('[data-pose-camera="side"]').hidden=!!rear;
  for(const button of zoomButtons)button.disabled=!state.ready;
  $('[data-pose-lock]').disabled=!state.ready||!currentJoint;
  $('[data-pose-lock]').setAttribute('aria-pressed',String(locked));
  $('[data-pose-lock]').textContent=locked?'Unlock':'Lock angles';
  $('[data-pose-undo]').disabled=!state.canUndo||!state.ready;
  $('[data-pose-redo]').disabled=!state.canRedo||!state.ready;
  $('[data-pose-muscles]').setAttribute('aria-pressed',String(state.showMuscles!==false));
  const revealToggle=$('[data-pose-reveal]');
  if(revealToggle.getAttribute('aria-pressed')!==String(!!state.reveal))revealToggle.setAttribute('aria-pressed',String(!!state.reveal));
  revealToggle.disabled=!state.ready||!state.showMuscles;
  $('[data-pose-scope]').value=state.scope||'all';
  const endpoint=$('[data-pose-endpoint]');
  endpoint.hidden=!state.endpointAvailable;
  endpoint.disabled=!state.ready||locked;
  endpoint.setAttribute('aria-pressed',String(state.interaction==='endpoint'));
  endpoint.textContent=state.interaction==='endpoint'?'Move joint':'Move limb';
  const contributorNames=(state.contributors||[]).map(listName),opponentNames=(state.opponents||[]).map(listName),mixedNames=(state.mixedRoles||[]).map(listName);
  const compact=names=>names.length?names[0].replace(/ · (right|left|midline)$/i,'')+(names.length>1?' + '+(names.length-1):''):'';
  const movementName=state.movementLabel&&state.movementLabel!=='Pose held'?state.movementLabel:currentAxis?.label||'Explore a movement';
  $('[data-pose-movement-name]').textContent=movementName;
  $('[data-pose-contributor-summary]').textContent=contributorNames.length?'◇ '+compact(contributorNames):opponentNames.length||mixedNames.length?'No single-role contributor':'Move a joint to see muscle roles';
  $('[data-pose-opponent-summary]').textContent=opponentNames.length?'○ '+compact(opponentNames):'';
  const contributorKey=state.contributorLabel?state.contributorLabel+'s · possible':'Possible contributors';
  const opponentKey=state.opposingLabel?state.opposingLabel+'s · opposing':'Opposing action';
  $('[data-pose-contributor-key]').textContent='◇ '+contributorKey;
  $('[data-pose-opponent-key]').textContent='○ '+opponentKey;
  $('[data-pose-mixed-key]').hidden=!mixedNames.length;
  const mixedSummary=$('[data-pose-mixed-summary]');
  mixedSummary.hidden=!mixedNames.length;
  mixedSummary.textContent=mixedNames.length?'◆ '+compact(mixedNames):'';
  const roleSummary=$('[data-pose-muscle-summary]');
  roleSummary.disabled=!state.ready;
  roleSummary.title=[movementName,contributorKey+': '+(contributorNames.join(', ')||'none mapped for this adjustment'),opponentKey+': '+(opponentNames.join(', ')||'none mapped'),mixedNames.length?'Mixed joint roles: '+mixedNames.join(', '):'', 'Colors show possible muscle roles'].filter(Boolean).join('. ');
  roleSummary.setAttribute('aria-label',roleSummary.title+' Open muscle roles.');
  $('.pose-feedback').textContent=state.message||(locked?'This joint’s angles are fixed. Unlock to adjust them.':'');
  $('.pose-feedback').hidden=!$('.pose-feedback').textContent;
  $('.pose-feedback').title=$('.pose-feedback').textContent;
  for(const [id,item] of markers){item.button.setAttribute('aria-pressed',String(id===state.selectedJoint));item.button.classList.toggle('is-selected',id===state.selectedJoint);}
  if(previousJoint!==state.selectedJoint){page=0;renderedListKey='';}
  renderDetails();measureList();
 }
 function setStatus(text,options={}){
  const status=$('.motion-status');status.hidden=!text;status.replaceChildren();
  status.classList.toggle('pose-error',!!options.error);
  if(text)status.append(document.createTextNode(text));
  if(options.retry){const retry=document.createElement('button');retry.type='button';retry.textContent='Try again';retry.onclick=options.retry;status.append(retry);}
 }
 function setMarkers(positions){
  const present=new Set();
  for(const point of positions){
   present.add(point.id);
   let item=markers.get(point.id);
   if(!item){
    const button=document.createElement('button');button.type='button';button.className='pose-joint-marker';button.dataset.poseMarker=point.id;
    const dot=document.createElement('i'),label=document.createElement('span');button.append(dot,label);markerLayer.append(button);
    item={button,label};markers.set(point.id,item);
    on(button,'pointerdown',event=>{if(event.button===0&&state.ready)call('markerPointerDown',event,point.id);});
    on(button,'click',event=>{if(state.ready)call('selectJoint',point.id,event);});
   }
   const descriptor=state.descriptors.find(entry=>entry.id===point.id),name=point.label||descriptor?.label||point.id;
   item.button.hidden=point.visible===false||!state.ready;
   item.button.disabled=!state.ready;
   item.button.style.left=point.x+'px';item.button.style.top=point.y+'px';
   item.button.classList.toggle('is-selected',point.id===state.selectedJoint);
   item.button.classList.toggle('is-locked',!!point.locked);
   item.button.setAttribute('aria-pressed',String(point.id===state.selectedJoint));
   item.button.setAttribute('aria-label',name+(point.locked?', locked':'')+'. Select and pose joint');
   item.button.title=name+(point.locked?' · locked':'');
   item.label.textContent=name;
  }
  for(const [id,item] of markers)if(!present.has(id))item.button.hidden=true;
 }
 function startRange(event){
  if(rangeGesture||!state.ready||isLocked()||state.movementLocked)return;
  rangeGesture={id:event?.pointerId,key:event?.type==='keydown'};
  call('changeAngle',Number($('[data-pose-angle]').value),{phase:'start'});
 }
 function finishRange(cancel=false){
  if(!rangeGesture)return;
  rangeGesture=null;call('changeAngle',Number($('[data-pose-angle]').value),{phase:cancel?'cancel':'end'});
 }
 on($('[data-pose-angle]'),'pointerdown',startRange);
 on($('[data-pose-angle]'),'keydown',event=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End','PageUp','PageDown'].includes(event.key))startRange(event);});
 on($('[data-pose-angle]'),'input',event=>{if(!rangeGesture)startRange(event);call('changeAngle',Number(event.currentTarget.value),{phase:'input'});});
 on($('[data-pose-angle]'),'change',()=>finishRange());
 on($('[data-pose-angle]'),'keyup',()=>finishRange());
 on($('[data-pose-angle]'),'blur',()=>finishRange());
 on(window,'pointerup',event=>{if(Number.isFinite(rangeGesture?.id)&&rangeGesture.id===event.pointerId)finishRange();});
 on(window,'pointercancel',event=>{if(Number.isFinite(rangeGesture?.id)&&rangeGesture.id===event.pointerId)finishRange(true);});
 on(window,'blur',()=>finishRange(true));
 on(document,'visibilitychange',()=>{if(document.hidden)finishRange(true);});
 on($('[data-pose-joint]'),'change',event=>{finishRange();call('selectJoint',event.currentTarget.value,{focus:true});});
 on($('[data-pose-axis]'),'change',event=>{finishRange();call('selectAxis',event.currentTarget.value);});
 const buttonStep=()=>['%','percent'].includes(axis()?.unit)?10:5;
 button('[data-pose-minus]',()=>call('stepAngle',-buttonStep()));
 button('[data-pose-plus]',()=>call('stepAngle',buttonStep()));
 button('[data-pose-neutral]',()=>{finishRange();call('neutralJoint');});
 button('[data-pose-play]',()=>{finishRange();call('togglePlayback');});
 button('[data-pose-muscle-summary]',()=>{changeTab('muscles');toggleNotes(true,true);});
 button('[data-pose-undo]',()=>call('undo'));
 button('[data-pose-redo]',()=>call('redo'));
 button('[data-pose-reset]',()=>call('reset'));
 button('[data-pose-lock]',()=>call('setLock',!isLocked()));
 button('[data-pose-full]',()=>call('setScope','all'));
 button('[data-pose-focus]',()=>call('focus'));
 button('[data-pose-endpoint]',()=>call('setInteraction',state.interaction==='endpoint'?'joint':'endpoint'));
 button('[data-pose-muscles]',()=>call('setMuscles',state.showMuscles===false));
 button('[data-pose-reveal]',()=>call('setReveal',!state.reveal));
 button('[data-pose-muscle-focus]',()=>call('focusMuscle'));
 button('[data-pose-explore-contributors]',()=>call('exploreContributors'));
 on($('[data-pose-reveal-bones]'),'change',event=>call('setFadeBones',event.currentTarget.checked));
 button('[data-pose-related]',()=>call('setRelated',!state.onlyRelated));
 button('[data-pose-notes]',()=>toggleNotes(!notesOpen));
 button('[data-pose-close]',()=>toggleNotes(false,true));
 button('[data-pose-previous]',()=>{page--;renderDetails();});
 button('[data-pose-next]',()=>{page++;renderDetails();});
 on($('[data-pose-scope]'),'change',event=>call('setScope',event.currentTarget.value));
 on($('[data-pose-search]'),'input',event=>{query=normalize(event.currentTarget.value).trim();page=0;renderDetails();});
 for(const item of host.querySelectorAll('[data-pose-camera]'))on(item,'click',()=>call('camera',item.dataset.poseCamera));
 const zoomButtons=host.querySelectorAll('[data-viewer-zoom]');
 for(const item of zoomButtons)on(item,'click',()=>call('zoom',item.dataset.viewerZoom));
 for(const item of host.querySelectorAll('[data-pose-tab]')){
  on(item,'click',()=>changeTab(item.dataset.poseTab));
  on(item,'keydown',event=>{
   if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
   event.preventDefault();const tabs=['muscles','guides','joints','help'],index=tabs.indexOf(tab);
   changeTab(tabs[event.key==='Home'?0:event.key==='End'?2:(index+(event.key==='ArrowRight'?1:2))%3],true);
  });
 }
 on($('.pose-details-panel'),'click',event=>{
  const item=event.target.closest('[data-pose-row]');
  if(item?.dataset.kind==='guide'){call('selectGuide',item.dataset.poseRow);changeTab('muscles');}
  else if(item)call(item.dataset.kind==='joint'?'selectJoint':'selectMuscle',item.dataset.poseRow);
  const lesson=event.target.closest('[data-pose-lesson]');if(lesson)call('openLesson',lesson.dataset.poseLesson);
 });
 on(host,'keydown',event=>{
  if(event.key==='Escape'){
   if(rangeGesture){event.preventDefault();event.stopPropagation();finishRange(true);}
   else if(notesOpen){event.preventDefault();event.stopPropagation();toggleNotes(false,true);}
  }
 });
 const resize=new ResizeObserver(measureList);resize.observe($('.pose-details-panel'));
 update();
 return {stage,update,setMarkers,setStatus,cancelGesture:()=>finishRange(true),suspend:()=>finishRange(true),openNotes:()=>toggleNotes(true),closeNotes:(focus=false)=>toggleNotes(false,focus&&notesOpen),
  destroy(){finishRange(true);controller.abort();resize.disconnect();markers.clear();host.replaceChildren();host.classList.remove('motion-pose-workspace');host.removeAttribute('data-pose-notes-open');}};
}
