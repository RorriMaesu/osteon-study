import {muscleWorksheetPanels,muscleWorksheetTargets,worksheetPanelTargets,validWorksheetDraft} from './muscle-worksheet-data.js';
import {readMuscleWorksheetFile} from './muscle-worksheet-import.js';
import {assessTyped,outcomeCorrect} from './typed-answer.js';
import {setDiagramLearningContext} from './learning-context.js';
export {muscleWorksheetPanels,muscleWorksheetTargets} from './muscle-worksheet-data.js';

const DRAFT_KEY='osteon-muscle-worksheet-v1',images=new Map();
const e=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const byId=id=>muscleWorksheetPanels.find(panel=>panel.id===id);
export function clearMuscleWorksheetImages(){for(const image of images.values())URL.revokeObjectURL(image.url);images.clear();}
export function worksheetViewBox(panel,zoom=1,center){
 const [x,y,w,h]=panel.bounds,z=Math.min(4,Math.max(1,zoom)),width=w/z,height=h/z;
 const cx=Math.min(x+w-width/2,Math.max(x+width/2,center?.[0]??x+w/2)),cy=Math.min(y+h-height/2,Math.max(y+height/2,center?.[1]??y+h/2));
 return [cx-width/2,cy-height/2,width,height];
}
export function worksheetPicture(panel,{mode='study',targetId='',choiceId='',url,viewBox=panel.bounds,finished=false}={}){
 const targets=worksheetPanelTargets(panel.id),selected=muscleWorksheetTargets[targetId],size=Math.min(panel.bounds[2],panel.bounds[3]),r=Math.max(4,size*.027);
 const active=mode==='locate'&&!finished?targets:selected?[selected]:[];
 const masks=panel.source==='openstax'&&mode!=='study'?Object.values(muscleWorksheetTargets).filter(target=>target.source==='openstax'&&target.figure===panel.figure&&(mode==='locate'||target.id===targetId)).flatMap(target=>[target.cover,...(target.extraCovers||[])]).map(([x,y,w,h])=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="white"/>`).join(''):'';
 const markers=active.map(target=>{
  const n=target.number??targets.indexOf(target)+1,[x,y]=target.point,interactive=mode==='locate'&&!finished;
  return `<g ${interactive?`role="button" tabindex="0" data-worksheet-pin="${e(target.id)}" aria-label="Marker ${n}" aria-pressed="${choiceId===target.id}"`:''}><circle cx="${x}" cy="${y}" r="${r*1.8}" fill="transparent"/><circle cx="${x}" cy="${y}" r="${r}" fill="${interactive?(choiceId===target.id?'#a34d25':'#12383c'):'#b0273b'}" stroke="white" stroke-width="2" vector-effect="non-scaling-stroke"/><text x="${x}" y="${y+r*.38}" text-anchor="middle" font-size="${r*1.1}" font-family="system-ui,sans-serif" font-weight="700" fill="white" pointer-events="none">${interactive?n:'•'}</text></g>`;
 }).join('');
 const [x,y,w,h]=panel.bounds;
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox.join(' ')}" role="group" aria-label="${e(panel.orientation)}. ${mode==='locate'?'Choose a numbered marker.':selected?'One anatomical target is marked.':'Anatomical study diagram.'}" class="mw-picture"><svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="${panel.bounds.join(' ')}" overflow="hidden"><image href="${e(url||panel.src)}" width="${panel.width}" height="${panel.height}" aria-hidden="true"/>${masks}${markers}</svg></svg>`;
}

export function mountMuscleWorksheet(root,{initialPanel,initialTarget,initialMode,onBack,onResult,getDue=()=>[]}={}){
 let saved;try{saved=JSON.parse(localStorage.getItem(DRAFT_KEY));}catch{}
 const state=validWorksheetDraft(saved)?saved:{version:1,panel:muscleWorksheetPanels[0].id,mode:'study',target:'',response:'',assisted:false,finished:false,feedback:''};
 if(muscleWorksheetTargets[initialTarget]){state.panel=muscleWorksheetTargets[initialTarget].panelId;state.target=initialTarget;state.response='';state.finished=false;state.feedback='';state.assisted=false;}
 else if(byId(initialPanel)){state.panel=initialPanel;state.target='';}
 if(['study','label','locate'].includes(initialMode))state.mode=initialMode;
 let zoom=1,center=null,disposed=false,notice='',importing=false,storageOK=true,expanded=false,importOpen=false;
 const setExpanded=value=>{expanded=value;root.classList.toggle('mw-expanded',value);const button=root.querySelector('[data-mw-expand]');if(button){button.textContent=value?'Close':'⛶';button.setAttribute('aria-label',value?'Close expanded diagram':'Expand diagram');}};
 const escapeExpanded=event=>{if(event.key==='Escape'&&expanded){setExpanded(false);root.querySelector('[data-mw-expand]')?.focus();}};
 document.addEventListener('keydown',escapeExpanded);
 const pointer=new Map();let gesture=null;
 const remember=()=>{try{localStorage.setItem(DRAFT_KEY,JSON.stringify(state));}catch{storageOK=false;}};
 const recordTutorAssistance=()=>{if(!disposed&&state.mode!=='study'&&!state.finished){state.assisted=true;remember();}};
 document.addEventListener('studyassistance',recordTutorAssistance);
 const reset=()=>{state.response='';state.choice='';state.feedback='';state.assisted=false;state.finished=false;zoom=1;center=null;};
 const available=panel=>panel.source==='openstax'||images.has(panel.image);
 const due=()=>{try{return getDue().filter(item=>muscleWorksheetTargets[item.targetId]&&['label','locate'].includes(item.mode));}catch{return[];}};
 const selected=()=>muscleWorksheetTargets[state.target];
 const results=record=>{if(typeof onResult==='function')onResult(record);};
 function publish(){const target=selected(),panel=byId(state.panel);setDiagramLearningContext({id:'muscle-worksheet-'+(target?.id||panel.id),title:'Muscle worksheet · '+panel.orientation,reference:target?.section||'11.6',state:{mode:state.mode,source:panel.source,view:panel.orientation,feedback:state.finished},question:state.mode==='locate'?'Which numbered marker indicates '+target?.name+'?':state.mode==='label'?'Name the marked muscle.':'Explain the visible muscle and its main action.',hint:target?.description||'Begin with the view and nearby joints.',answer:target?.name||'Choose a reviewed muscle target.',facts:target?[target.description]:[],prediction:state.response});}
 function startTarget(id,mode=state.mode){const target=muscleWorksheetTargets[id];if(!target)return;state.panel=target.panelId;state.target=id;state.mode=mode;reset();render();}
 function finish(result,{revealed=false}={}){
  if(state.finished||!selected())return;
  const target=selected();
  if(result.status==='pending'||result.status==='unanswered'){state.feedback=result.status==='pending'?'That wording needs clarification. Try one anatomical name, or reveal it. It has not been counted wrong.':'Enter a name first.';remember();render('#mw-response');return;}
  const correct=outcomeCorrect(result),assisted=state.assisted||revealed;
  results({targetId:target.id,mode:state.mode,correct,assisted,answerStatus:result.status,correction:result.correction||target.name,response:result.response||state.response});
  state.assisted=assisted;state.finished=true;
  state.feedback=revealed?'Answer: '+target.name+'. Review it again later.':correct?(result.status==='spelling'?'Correct identification. Standard spelling: ':'Correct. ')+target.name+'.': 'The target is '+target.name+'. '+target.description;
  render('[data-mw-next]');
 }
 function choosePin(id){if(state.mode!=='locate'||state.finished)return;const clicked=muscleWorksheetTargets[id];if(clicked?.panelId!==state.panel)return;state.choice=id;state.response=clicked.name;state.feedback='Marker selected. Check it when you are ready.';render('[data-mw-locate-check]');}
 function render(focus){
  if(disposed)return;
  const panel=byId(state.panel),targets=worksheetPanelTargets(panel.id),loaded=available(panel),queue=due();
  if(!targets.some(target=>target.id===state.target))state.target=targets[0]?.id||'';
  if(state.mode==='locate'&&targets.length<2)state.mode='label';
  if(!targets.length)state.mode='study';
  const target=selected(),index=targets.findIndex(item=>item.id===state.target),isStudy=state.mode==='study';
  root.innerHTML=`<section class="mw-shell" aria-label="Muscle worksheet practice"><header class="mw-toolbar"><button type="button" data-mw-back>← Back</button><label class="sr-only" for="mw-panel">Diagram view</label><select id="mw-panel"><optgroup label="Reviewed OpenStax diagrams">${muscleWorksheetPanels.filter(item=>item.source==='openstax').map(item=>`<option value="${e(item.id)}" ${item.id===panel.id?'selected':''}>${e(item.name)}</option>`).join('')}</optgroup><optgroup label="Your worksheet · local import">${muscleWorksheetPanels.filter(item=>item.source==='local').map(item=>`<option value="${e(item.id)}" ${item.id===panel.id?'selected':''}>${e(item.name)}${available(item)?'':' · import needed'}</option>`).join('')}</optgroup></select><button type="button" data-mw-due ${queue.length?'':'disabled'}>Review due (${queue.length})</button><button type="button" data-mw-import-open>Import worksheet</button></header>
  <details class="mw-import" ${importOpen?'open':''}><summary>Local worksheet files</summary><p>Choose “Muscle Diagrams for Studying.docx” or its original PNG/JPEG images. Images stay in this tab and are never uploaded. After a page refresh, choose the file again; your practice selection is remembered.</p><label for="mw-file">Choose your worksheet</label><input id="mw-file" type="file" accept=".docx,.png,.jpg,.jpeg" multiple ${importing?'disabled':''}><button type="button" data-mw-clear ${images.size?'':'disabled'}>Forget imported images</button><p role="status">${e(importing?'Reading local images…':notice)}</p></details>
  <div class="mw-workspace"><div class="mw-diagram-column"><div class="mw-viewbar"><span>${e(panel.orientation)}</span><div><button type="button" data-mw-zoom-out aria-label="Zoom out">−</button><button type="button" data-mw-fit>Fit view</button><button type="button" data-mw-zoom-in aria-label="Zoom in">+</button><button type="button" data-mw-expand aria-label="Expand diagram">⛶</button></div></div><div class="mw-canvas" data-mw-canvas>${loaded?worksheetPicture(panel,{mode:state.mode,targetId:state.target,choiceId:state.choice,url:images.get(panel.image)?.url,viewBox:worksheetViewBox(panel,zoom,center),finished:state.finished}):'<div class="mw-empty"><h3>Open your local worksheet</h3><p>This image is not hosted by Osteon. Import your original file above to practice on it.</p><button type="button" data-mw-pick>Choose file</button><button type="button" data-mw-public>Use a reviewed OpenStax diagram</button></div>'}</div><p class="mw-caption">${panel.source==='openstax'?`OpenStax Anatomy and Physiology 2e · Figure ${e(panel.figure)} · CC BY-NC-SA 4.0. <a href="https://openstax.org/details/books/anatomy-and-physiology-2e" target="_blank" rel="noopener noreferrer">Source</a>`:'Your imported course worksheet · '+targets.length+' reviewed target'+(targets.length===1?'':'s')+'.'} ${loaded?'Zoom, then drag to inspect.':''}</p></div>
  <aside class="mw-practice"><div class="mw-modes" aria-label="Practice mode">${['study','label','locate'].map(mode=>`<button type="button" data-mw-mode="${mode}" aria-pressed="${state.mode===mode}" ${(!loaded||!targets.length||(mode==='locate'&&targets.length<2))?'disabled':''}>${mode[0].toUpperCase()+mode.slice(1)}</button>`).join('')}</div>
  ${loaded&&target?`<div class="mw-target-nav"><button type="button" data-mw-prev aria-label="Previous target" ${index===0?'disabled':''}>←</button><label class="sr-only" for="mw-target">Practice target</label><select id="mw-target">${targets.map((item,i)=>`<option value="${e(item.id)}" ${item.id===target.id?'selected':''}>${isStudy?e(item.name):'Target '+(i+1)}</option>`).join('')}</select><button type="button" data-mw-next aria-label="Next target" ${index===targets.length-1?'disabled':''}>→</button><span>${index+1}/${targets.length}</span></div>
  ${isStudy?`<h3>${e(target.name)}</h3><p>${e(target.description)}</p><p class="tiny">Switch to Label to recall its name, or Locate to choose its numbered marker.</p>`:state.mode==='label'?`<h3>Name the marked muscle</h3><form data-mw-answer><label class="sr-only" for="mw-response">Anatomical name</label><input id="mw-response" type="text" maxlength="120" autocomplete="off" value="${e(state.response)}" ${state.finished?'readonly':''}>${!state.finished?'<button type="submit">Check answer</button>':''}</form>`:`<h3>Locate ${e(target.name)}</h3>${!state.finished?`<p>Select a numbered marker, then check your choice.</p><div class="mw-pin-choices" aria-label="Numbered diagram markers">${targets.map((item,i)=>`<button type="button" data-mw-choice="${e(item.id)}" aria-pressed="${state.choice===item.id}" aria-label="Marker ${item.number??i+1}">${item.number??i+1}</button>`).join('')}</div><button type="button" data-mw-locate-check ${!state.choice?'disabled':''}>Check marker</button>`:''}`}
  ${!isStudy?`${!state.finished?'<div class="mw-help"><button type="button" data-mw-hint>Hint</button><button type="button" data-mw-reveal>Reveal</button></div>':''}<p class="mw-feedback" role="status">${e(state.feedback)}</p>`:''}<button type="button" data-mw-tutor>Ask the tutor</button>`:loaded?'<h3>Orientation study</h3><p>This panel is available for inspection. Its small or ambiguous pointers are not used for scored questions. Select a reviewed OpenStax view for labeling practice.</p>':'<p>Import your worksheet to activate this panel. Public textbook practice is available immediately.</p>'}
  ${target?.verification&&(isStudy||state.finished)?`<p class="tiny">Original worksheet #${target.number} · <a href="${e(target.verification.source)}" target="_blank" rel="noopener noreferrer">Verified source key</a></p>`:''}${panel.note?`<p class="tiny">${e(panel.note)}</p>`:''}${targets.length===1?'<p class="tiny">Locate mode needs at least two reviewed markers; use Label for this view.</p>':''}${!storageOK?'<p class="tiny">This browser could not save the draft. Keep this tab open to retain your current work.</p>':''}</aside></div></section>`;
  root.querySelector('[data-mw-back]').onclick=()=>onBack?.();
  root.querySelector('#mw-panel').onchange=event=>{state.panel=event.target.value;state.target='';reset();render('#mw-panel');};
  root.querySelector('#mw-target')?.addEventListener('change',event=>{state.target=event.target.value;reset();render('#mw-target');});
  root.querySelector('[data-mw-prev]')?.addEventListener('click',()=>startTarget(targets[index-1]?.id));
  root.querySelector('[data-mw-next]')?.addEventListener('click',()=>startTarget(targets[index+1]?.id));
  root.querySelectorAll('[data-mw-mode]').forEach(button=>button.onclick=()=>{state.mode=button.dataset.mwMode;reset();render('[data-mw-mode="'+state.mode+'"]');});
  root.querySelector('[data-mw-answer]')?.addEventListener('submit',event=>{event.preventDefault();if(!state.finished)finish(assessTyped({id:target.id,answer:target.name,aliases:target.aliases},state.response));});
  root.querySelector('#mw-response')?.addEventListener('input',event=>{state.response=event.target.value;state.feedback='';remember();publish();});
  root.querySelectorAll('[data-mw-choice]').forEach(button=>button.onclick=()=>choosePin(button.dataset.mwChoice));
  root.querySelector('[data-mw-locate-check]')?.addEventListener('click',()=>{if(state.choice)finish({status:state.choice===state.target?'correct':'incorrect',response:state.response});});
  root.querySelectorAll('[data-worksheet-pin]').forEach(pin=>{pin.onclick=()=>choosePin(pin.dataset.worksheetPin);pin.onkeydown=event=>{if(['Enter',' '].includes(event.key)){event.preventDefault();choosePin(pin.dataset.worksheetPin);}};});
  root.querySelector('[data-mw-hint]')?.addEventListener('click',()=>{state.assisted=true;state.feedback=target.description;render('[data-mw-hint]');});
  root.querySelector('[data-mw-reveal]')?.addEventListener('click',()=>finish({status:'incorrect',response:state.response},{revealed:true}));
  root.querySelector('[data-mw-tutor]')?.addEventListener('click',()=>{publish();document.getElementById('tutor-launch')?.click();});
  root.querySelector('[data-mw-due]').onclick=()=>{const next=due()[0];if(next)startTarget(next.targetId,next.mode);};
  const file=root.querySelector('#mw-file'),details=root.querySelector('.mw-import');
  details.ontoggle=()=>{importOpen=details.open;};
  root.querySelector('[data-mw-import-open]').onclick=()=>{importOpen=true;details.open=true;file.focus();};
  root.querySelector('[data-mw-pick]')?.addEventListener('click',()=>{importOpen=true;details.open=true;file.click();});
  root.querySelector('[data-mw-public]')?.addEventListener('click',()=>{state.panel=muscleWorksheetPanels[0].id;state.target='';reset();render();});
  root.querySelector('[data-mw-clear]').onclick=()=>{clearMuscleWorksheetImages();notice='Imported images forgotten. Your practice results are retained.';render();};
  file.onchange=async()=>{
   const files=[...file.files];if(!files.length)return;importing=true;notice='';render();
   try{let added=0;for(const picked of files){for(const image of await readMuscleWorksheetFile(picked)){const old=images.get(image.id);if(old)URL.revokeObjectURL(old.url);images.set(image.id,{...image,url:URL.createObjectURL(image.blob)});added++;}}notice=added+' worksheet image'+(added===1?'':'s')+' ready in this tab.';importOpen=false;if(byId(state.panel).source!=='local'){state.panel=images.has('leg')?'worksheet-leg-front':muscleWorksheetPanels.find(item=>item.source==='local'&&images.has(item.image)).id;state.target='';reset();}}catch(error){importOpen=true;notice=error.message||'The file could not be opened. Try the original worksheet.';}finally{importing=false;render();}
  };
  const canvas=root.querySelector('[data-mw-canvas]');
  const updateView=()=>{const box=worksheetViewBox(panel,zoom,center);center=[box[0]+box[2]/2,box[1]+box[3]/2];canvas.querySelector('svg')?.setAttribute('viewBox',box.join(' '));};
  root.querySelector('[data-mw-zoom-in]').onclick=()=>{zoom=Math.min(4,zoom*1.4);updateView();};
  root.querySelector('[data-mw-zoom-out]').onclick=()=>{zoom=Math.max(1,zoom/1.4);updateView();};
  root.querySelector('[data-mw-fit]').onclick=()=>{zoom=1;center=null;updateView();};
  const expandButton=root.querySelector('[data-mw-expand]');
  setExpanded(expanded);expandButton.onclick=()=>setExpanded(!expanded);
  canvas.onpointerdown=event=>{if(event.target.closest('[data-worksheet-pin]'))return;pointer.set(event.pointerId,[event.clientX,event.clientY]);canvas.setPointerCapture?.(event.pointerId);if(pointer.size===1){const box=worksheetViewBox(panel,zoom,center);gesture={point:[event.clientX,event.clientY],center:[box[0]+box[2]/2,box[1]+box[3]/2],box};}else if(pointer.size===2){const [a,b]=[...pointer.values()];gesture={distance:Math.hypot(a[0]-b[0],a[1]-b[1]),zoom};}};
  canvas.onpointermove=event=>{if(!pointer.has(event.pointerId)||!gesture)return;pointer.set(event.pointerId,[event.clientX,event.clientY]);if(pointer.size===2&&gesture.distance){const[a,b]=[...pointer.values()];zoom=Math.min(4,Math.max(1,gesture.zoom*Math.hypot(a[0]-b[0],a[1]-b[1])/Math.max(1,gesture.distance)));updateView();}else if(pointer.size===1&&gesture.point&&zoom>1){const rect=canvas.getBoundingClientRect(),scale=Math.min(rect.width/gesture.box[2],rect.height/gesture.box[3]);center=[gesture.center[0]-(event.clientX-gesture.point[0])/scale,gesture.center[1]-(event.clientY-gesture.point[1])/scale];updateView();}};
  const release=event=>{pointer.delete(event.pointerId);gesture=null;};canvas.onpointerup=release;canvas.onpointercancel=release;
  remember();publish();if(focus)root.querySelector(focus)?.focus({preventScroll:true});
 }
 render();return()=>{disposed=true;pointer.clear();root.classList.remove('mw-expanded');document.removeEventListener('keydown',escapeExpanded);document.removeEventListener('studyassistance',recordTutorAssistance);};
}
