import {initLandmarks} from './landmark-ui.js';
import {initWorkspace} from './workspace.js';
import {setLearningContext} from './learning-context.js';
import {initTutor} from './tutor.js';
import {divisions,inDivision,termDivision,regionAvailable,meshDivision} from './anatomy.js';
import {boneFamily,boneId} from './exploration.js';
import {terms,allTerms,textbookTerms,regions} from './data.js';
import {AnatomyViewer} from './viewer.js';
import {initPractice} from './practice.js';
import {initStudy} from './study.js';
import {initPrecision,plateHTML} from './precision.js';
import {initReader} from './reader.js';
import {labels,coverage,pointKinds} from './representations.js';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
export const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let region='All regions',selected=null,ready=false,assessmentColors=false,explorationColors=true,browseMode='all',landmarkUI;
try{explorationColors=localStorage.getItem('osteon-bone-colors')!=='off';}catch{}
const initialDetail=$('#detail-content').innerHTML;
export function toast(s){$('#toast').textContent=s;$('#toast').hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('#toast').hidden=true,3500);}
export function dialog(html){$('#dialog-content').innerHTML=html;$('#info-dialog').showModal();}
$('#close-dialog').onclick=()=>$('#info-dialog').close();
$('#info-dialog').addEventListener('click',e=>{if(e.target===$('#info-dialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
export function setView(view){if(!['atlas','study','practice','progress'].includes(view))view='atlas';$$('.view').forEach(e=>e.classList.toggle('active',e.id===view+'-view'));$$('[data-view]').forEach(e=>{e.classList.toggle('active',e.dataset.view===view);e.setAttribute('aria-current',e.dataset.view===view?'page':'false');});history.replaceState(null,'','#'+view);if(view==='atlas')viewer?.resize();document.dispatchEvent(new CustomEvent('viewchange',{detail:view}));window.scrollTo({top:0,behavior:'instant'});}
$$('[data-view]').forEach(b=>b.onclick=()=>setView(b.dataset.view));$('.brand').onclick=e=>{e.preventDefault();setView('atlas');};
export const viewer=new AnatomyViewer($('#viewer'),m=>{
 if(document.dispatchEvent(new CustomEvent('bonepick',{detail:m,cancelable:true}))===false)return;
 viewer.selectMesh(m);const term=viewer.termFor(m)||{id:'extra',name:viewer.displayName(m),region:m.userData.region,cue:'Supplementary anatomical structure from the Z-Anatomy skeleton.',type:m.userData.nonbone?'tissue':'bone',exact:true,source:'Full specimen',aliases:[]};selected=term;detail(term,term.exact?viewer.displayName(m):null);renderList();updateButtons();
},()=>{const pendingSelection=selected;ready=true;$('#loading').hidden=true;$('#model-state').textContent=viewer.meshes.length+' objects · anatomy online';if(region!=='All regions')viewer.setRegion(region);if(pendingSelection)selectTerm(pendingSelection);renderList();updateButtons();document.dispatchEvent(new Event('anatomyready'));},err=>{$('#loading').innerHTML='<strong>3D viewer unavailable</strong><span>Text study remains available. Try a browser with WebGL enabled.</span>';$('#model-state').textContent='Text study mode';console.error(err);});
viewer.skullColors=explorationColors;
export function selectTerm(t,{frame=true}={}){if(!inDivision(t,viewer.division)){dialog(`<h2>Switch skeleton division?</h2><p>${escape(t.name)} belongs to ${termDivision(t)==='General'?'general bone anatomy':termDivision(t)==='Mixed'?'both skeleton divisions': 'the '+termDivision(t).toLowerCase()+' skeleton'}. Your current filter is ${viewer.division.toLowerCase()}.</p><button class="primary" id="switch-division">Switch and focus</button>`);$('#switch-division').onclick=()=>{$('#info-dialog').close();changeDivision(['Mixed','General'].includes(termDivision(t))?'All':termDivision(t));selectTerm(t,{frame});};return;}if(region!=='All regions'&&region!==t.region)changeRegion(t.region);selected=t;if(ready){viewer.select(t,{frame:frame||t.representation?.autoFocus});selected=t;updateButtons();}detail(t);renderList();$('#specimen-region').textContent=t.region.toUpperCase();$('#specimen-name').textContent=t.name;document.dispatchEvent(new Event('structureselected'));}
function detail(t,meshName){landmarkUI?.show(t);setLearningContext({type:'structure',label:t.name,termId:t.id,text:t.cue,reference:t.representation?.reference});const count=ready?viewer.find(t).length:0,r=t.representation||{kind:'mesh',reference:'7.2'};$('#detail-content').innerHTML=`<span class="detail-type">${(r.reviewStatus==='modeled-opening-verified'?'Blender bone reconstruction':r.reviewStatus==='route-schematic'?'Route schematic':labels[r.kind]).toUpperCase()}</span><h2>${escape(meshName||t.name)}</h2>${r.reviewNotice?`<p class="accuracy-note">${escape(r.reviewNotice)}</p>`:""}${r.memberIds?`<div class="detail-member-links">${r.memberIds.map(id=>allTerms.find(x=>x.id===id)).filter(Boolean).map(member=>`<button type="button" data-member-term="${member.id}">${escape(member.name)} ↗</button>`).join("")}</div>`:""}<p>${escape(t.feature?.description||t.cue)}</p>${t.feature?`<p class="tiny feature-parent">${escape(t.feature.parentBones.join(' · '))}<br>OpenStax ${escape(t.feature.section)} · ${escape(t.feature.featureType)}</p>`:''}<div class="field-meta"><div><small>REGION</small>${escape(t.region)}</div><div><small>SKELETON DIVISION</small>${escape(termDivision(t))}</div><div><small>STRUCTURE TYPE</small>${escape(t.type)}</div><div><small>COURSE CONNECTION</small>${escape(t.source)}</div></div>${r.kind==='source-pin'?'<p class="tiny">Source-placed anatomical reference pin. The parent bone provides context; the pin does not outline the complete landmark.</p>':''}${r.note?`<p class="tiny">${escape(r.note)}</p>`:''}${['diagram','reference'].includes(r.kind)||r.sourcePlate?'<button class="secondary" id="detail-source-view">Open textbook view ↗</button>':''}${r.kind==='concept'?'<p class="tiny">Use the movement exercise to connect direction with ligament restraint.</p>':''}<div class="detail-actions"><button id="detail-focus" ${count?'':'disabled'}>Focus specimen</button><button id="detail-card">Recall this</button><button class="primary" id="detail-practice" ${ready||['diagram','concept','reference'].includes(r.kind)?'':'disabled'}>${r.kind==='reference'||r.assessment==='learn-only'?'Recall feature':'Practice target'} ↗</button><button id="detail-read">Read source ↗</button></div>`;if($('#detail-source-view'))$('#detail-source-view').onclick=()=>document.dispatchEvent(new CustomEvent('landmarksource',{detail:t}));$('#detail-focus').onclick=()=>{landmarkUI?.hide();if(pointKinds.includes(r.kind))viewer.focusFeature(t);else{viewer.frame(viewer.selected);if(r.kind==='diagram'||r.kind==='reference')toast('3D parent-bone context. Use the textbook view to locate the precise feature.');}};$('#detail-card').onclick=()=>document.dispatchEvent(new CustomEvent('studyterm',{detail:t}));$('#detail-practice').onclick=()=>document.dispatchEvent(new CustomEvent(r.kind==='reference'||r.assessment==='learn-only'?'studyterm':'practicetarget',{detail:t}));$('#detail-read').onclick=()=>document.dispatchEvent(new CustomEvent(t.feature?'openreaderpage':'openreader',{detail:t.feature?(t.feature.sources.find(s=>s.kind?.includes('body'))||t.feature.sources[0]).pdf:r.reference}));$('#specimen-region').textContent=t.region.toUpperCase();$('#specimen-name').textContent=t.name;document.dispatchEvent(new Event('structureselected'));}
function updateButtons(){$('#isolate-btn').disabled=!viewer.selected.length;$('#ghost-btn').disabled=!viewer.selected.length;$('#focus-btn').disabled=!viewer.selected.length;$('#isolate-btn').setAttribute('aria-pressed',viewer.isolated);$('#ghost-btn').setAttribute('aria-pressed',viewer.ghost);$('#tissues-btn').setAttribute('aria-pressed',!!viewer.tissues);syncFocusControls();}
function renderList(){const q=$('#structure-search').value.trim().toLowerCase(),exactOnly=$('#exact-only').checked;const list=allTerms.filter(t=>(browseMode!=='landmarks'||!viewer.loaded||viewer.focus.level!=='bone'||viewer.find(t).some(m=>boneId(m.userData.zname)===viewer.focus.boneId))&&inDivision(t,viewer.division)&&(region==='All regions'||t.region===region||(ready&&viewer.focus.areaId&&viewer.find(t).some(m=>viewer.scopeContains(m))))&&(!q||[t.name,t.cue,...t.aliases].join(' ').toLowerCase().includes(q))&&(!exactOnly||(t.exact&&(!ready||viewer.find(t).length)))&&(browseMode==='all'||(browseMode==='bones'?t.type==='bone':(t.feature||['landmark','opening','suture','cavity','region','bone region','development'].includes(t.type)||['Manubrium','Body of sternum','Xiphoid process'].includes(t.name)))));$('#structure-total').textContent=textbookTerms.length+' TEXTBOOK FEATURES';$('#list-title').textContent=browseMode==='landmarks'?'Landmarks & features':browseMode==='bones'?'Bones':'Atlas entries';$('#list-count').textContent=list.length;$('#structure-list').innerHTML=list.map(t=>`<button class="structure-item ${t.exact?'':'context'} ${t.id===selected?.id?'active':''}" data-term="${t.id}"><span class="item-dot"></span><span>${escape(t.name)}<small>${escape(t.feature?.featureType||t.type)}${' · '+labels[t.representation?.kind||'mesh']}</small></span><span class="arrow">↗</span></button>`).join('')||'<p class="empty">No matches. Try a region or another spelling.</p>';$$('[data-term]').forEach(b=>b.onclick=()=>{const t=allTerms.find(x=>x.id===b.dataset.term);selectTerm(t,{frame:!t.exact||t.type!=='bone'});});}
function explorerContext(){return{type:'atlas',label:region==='All regions'?(viewer.division==='All'?'The skeletal system':viewer.division+' skeleton'):region==='Joints'?'Shoulder, hip and knee joints':region+' anatomy',text:'Current division: '+viewer.division+'. Current region: '+region+'.'};}
function resetDetail(){
 landmarkUI?.hide();
 $('#detail-content').innerHTML=initialDetail;
 $('#specimen-region').textContent=region==='All regions'?(viewer.division==='All'?'FULL SKELETON':viewer.division.toUpperCase()+' SKELETON'):region.toUpperCase();
 $('#specimen-name').textContent='Explore the relationships.';
 setLearningContext(explorerContext());updateButtons();
}
function syncSkullControls(){
 const focused=viewer.focus.level!=='overview'&&!assessmentColors&&!viewer.activeDetail;
 $('#skull-controls').hidden=!focused;$('#skull-key').hidden=!focused;
 const button=$('#skull-colors');button.disabled=assessmentColors;
 button.setAttribute('aria-pressed',String(viewer.skullColors));
 button.textContent='Colors: '+(viewer.skullColors?'On':'Off');
 button.setAttribute('aria-label','Bone colors: '+(viewer.skullColors?'On':'Off'));
 button.title='Turn regional bone colors '+(viewer.skullColors?'off':'on');
}
function syncFocusControls(){
 const blocked=assessmentColors||viewer.quiz;
 $('#exploration-bar').hidden=blocked;
 $('.specimen-stage').dataset.exploring=String(!blocked);
 $('#focus-back').disabled=viewer.focus.level==='overview';
 const label=viewer.focusLabel(),focusedMesh=viewer.selected.find(m=>boneFamily(m.userData.zname)),bone=viewer.focus.level==='bone'&&focusedMesh?(viewer.focus.boneId==='Sternum'?'Sternum':viewer.displayName(focusedMesh)):'';
 $('#focus-trail').innerHTML='<button type="button" id="focus-overview">'+(viewer.division==='All'?'Skeleton':viewer.division)+'</button>'+(viewer.focus.level!=='overview'?'<span aria-hidden="true">›</span>'+(bone?'<button type="button" id="focus-region">'+escape(label)+'</button><span aria-hidden="true">›</span><strong>'+escape(bone)+'</strong>':'<strong>'+escape(label)+'</strong>'):'<span class="focus-intro">Double-click to explore</span>');
 $('#focus-overview').onclick=()=>viewer.reset();
 $('#focus-trail').title=[viewer.division==='All'?'Skeleton':viewer.division,viewer.focus.level!=='overview'?label:'',bone].filter(Boolean).join(' › ');
 if($('#focus-region'))$('#focus-region').onclick=()=>viewer.back();
 const hint=$('.viewer-hint');
 hint.textContent=blocked?'DRAG TO ORBIT · SCROLL TO ZOOM':viewer.focus.level==='overview'?'DOUBLE-CLICK A BONE TO EXPLORE ITS REGION':viewer.focus.level==='region'?'DOUBLE-CLICK A BONE TO FOCUS IT ALONE':'BACK TO RETURN TO THE REGION · DRAG TO ORBIT';
 $$('#desktop-region,#desktop-division,#structure-search').forEach(e=>e.disabled=blocked);
 $('#exact-only').disabled=blocked||browseMode==='landmarks';
 const isBone=!!viewer.selected[0]&&!!boneFamily(viewer.selected[0].userData.zname);
 $('#focus-btn').setAttribute('aria-label',blocked?'Focus selected target':isBone?'Explore selected bone’s region':'Focus selected structure');
 $('#focus-btn').title=$('#focus-btn').getAttribute('aria-label');
 $('#focus-btn').querySelector('span').textContent=blocked?'Focus':'Region';
 $('#isolate-btn').setAttribute('aria-label',blocked?'Isolate selected target':viewer.focus.level==='bone'?'Return to region':'Focus selected bone alone');
 $('#isolate-btn').title=$('#isolate-btn').getAttribute('aria-label');
 $('#isolate-btn').querySelector('span').textContent=blocked?'Isolate':'Bone';
 syncSkullControls();
}
document.addEventListener('atlasfocuschange',()=>{
 if(!ready||assessmentColors||viewer.quiz){syncFocusControls();return;}
 region=viewer.region;selected=viewer.selectedTerm||null;
 if(selected)detail(selected,selected.exact&&viewer.selected.length===1?viewer.displayName(viewer.selected[0]):null);else resetDetail();
 syncFilters();renderList();updateButtons();$('#rotate-btn').setAttribute('aria-pressed','false');
});
$('#focus-back').onclick=()=>viewer.back();
function syncFilters(){
 syncSkullControls();
 $$('[data-division]').forEach(b=>{b.disabled=assessmentColors;b.classList.toggle('active',b.dataset.division===viewer.division);b.setAttribute('aria-pressed',b.dataset.division===viewer.division);});
 $$('[data-region]').forEach(b=>{b.disabled=assessmentColors||!regionAvailable(b.dataset.region,viewer.division,allTerms);b.classList.toggle('active',b.dataset.region===region);b.setAttribute('aria-pressed',b.dataset.region===region);});
}
function changeRegion(r){if(!regions.includes(r)||!regionAvailable(r,viewer.division,allTerms))return;region=r;selected=null;if(ready)viewer.setRegion(r);syncFilters();resetDetail();renderList();}
function changeDivision(d){if(!divisions.includes(d))return;region='All regions';selected=null;viewer.region=region;if(ready)viewer.setDivision(d);else viewer.division=d;syncFilters();resetDetail();renderList();document.dispatchEvent(new Event('divisionchange'));}

$('#division-filters').innerHTML=divisions.map(d=>`<button data-division="${d}" aria-pressed="${d==='All'}" class="${d==='All'?'active':''}">${d}</button>`).join('');
$$('[data-division]').forEach(b=>b.onclick=()=>changeDivision(b.dataset.division));
$('#skull-key').onclick=()=>{
 const entries=new Map();for(const m of viewer.meshes){if(!viewer.scopeContains(m)||(viewer.division!=='All'&&meshDivision(m.userData.zname)!==viewer.division)||m.userData.nonbone)continue;const family=boneFamily(m.userData.zname);if(family&&!entries.has(family.id))entries.set(family.id,{...family,mesh:m});}
 const key=[...entries.values()];dialog('<h2>'+escape(viewer.focusLabel())+'<br><em>Bone color key.</em></h2><div class="region-legend">'+key.map((f,i)=>`<button type="button" data-family="${i}"><i style="--bone-color:${f.color}"></i><span>${escape(f.name)}</span></button>`).join('')+'</div><p class="tiny">Left and right counterparts share a color. Colors support separation; use names to identify a bone. Nearby context bones may also appear. Teeth, cartilage and soft tissues keep separate materials.</p>');
 $('#dialog-content').querySelectorAll('[data-family]').forEach(b=>b.onclick=()=>{const m=key[+b.dataset.family].mesh;$('#info-dialog').close();viewer.selectMesh(m);const t=viewer.termFor(m);if(t){selected=t;detail(t,viewer.displayName(m));renderList();updateButtons();}});
};
$('#skull-colors').onclick=()=>{if(assessmentColors)return;viewer.skullColors=!viewer.skullColors;explorationColors=viewer.skullColors;try{localStorage.setItem('osteon-bone-colors',explorationColors?'on':'off');}catch{}viewer.applyVisibility();syncSkullControls();};
document.addEventListener('assessmentstart',()=>{if(!assessmentColors)explorationColors=viewer.skullColors;assessmentColors=true;viewer.skullColors=false;syncFocusControls();syncFilters();viewer.applyVisibility();});
document.addEventListener('assessmentend',()=>{assessmentColors=false;viewer.skullColors=explorationColors;syncFocusControls();syncFilters();viewer.applyVisibility();});
$('#region-filters').innerHTML=regions.map(r=>`<button data-region="${r}" class="${r===region?'active':''}" aria-pressed="${r===region}">${r}</button>`).join('');
$$('[data-region]').forEach(b=>b.onclick=()=>changeRegion(b.dataset.region));
syncFilters();
$('#structure-search').oninput=renderList;$('#exact-only').onchange=renderList;
$$('[data-browse-mode]').forEach(b=>b.onclick=()=>{browseMode=b.dataset.browseMode;$$('[data-browse-mode]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));if(browseMode==='landmarks')$('#exact-only').checked=false;$('#exact-only').disabled=browseMode==='landmarks';renderList();});
document.addEventListener('keydown',e=>{if(e.key==='/'&&!$('#tutor-panel')?.open&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)&&!$('#info-dialog').open){e.preventDefault();setView('atlas');$('#structure-search').focus();}});
$$('[data-camera]').forEach(b=>b.onclick=()=>{if(!ready)return;$$('[data-camera]').forEach(e=>e.classList.toggle('active',e===b));if(b.dataset.camera==='reset'&&viewer.quiz){if(viewer.selectedTerm?.representation?.points)viewer.focusFeature();else viewer.frameScope();return;}if(b.dataset.camera==='reset'){viewer.reset();region='All regions';selected=null;$$('[data-region]').forEach(e=>{e.classList.toggle('active',e.dataset.region===region);e.setAttribute('aria-pressed',e.dataset.region===region);});syncFilters();resetDetail();renderList();}else viewer.view(b.dataset.camera);$('#rotate-btn').setAttribute('aria-pressed','false');});
$('#rotate-btn').onclick=()=>{if(!viewer.controls)return;viewer.controls.autoRotate=!viewer.controls.autoRotate;$('#rotate-btn').setAttribute('aria-pressed',viewer.controls.autoRotate);};
$('#isolate-btn').onclick=()=>{if(viewer.quiz||!boneFamily(viewer.selected[0]?.userData.zname||''))viewer.isolate();else if(viewer.focus.level==='bone')viewer.back();else viewer.focusBone();updateButtons();};$('#ghost-btn').onclick=()=>{viewer.xray();updateButtons();};$('#focus-btn').onclick=()=>{if(viewer.quiz||!boneFamily(viewer.selected[0]?.userData.zname||'')){if(pointKinds.includes(viewer.selectedTerm?.representation?.kind))viewer.focusFeature();else viewer.frame(viewer.selected);}else viewer.exploreBoneRegion();};
$('#peel-btn').onclick=()=>{viewer.peel=!viewer.peel;$('#peel-btn').setAttribute('aria-pressed',viewer.peel);toast(viewer.peel?'Peel is on: click surfaces to hide them. Turn Peel off to select or answer.':'Peel is off: click to select or answer.');};
$('#restore-btn').onclick=()=>viewer.restore();
$('#tissues-btn').onclick=()=>{viewer.tissues=!viewer.tissues;viewer.applyVisibility();$('#tissues-btn').setAttribute('aria-pressed',viewer.tissues);};
document.addEventListener('layerschanged',()=>{$('#restore-btn').disabled=!viewer.hiddenMeshes.size;$('#peel-btn').setAttribute('aria-pressed',viewer.peel);});
function credits(){dialog(`<h2>A study space<br><em>with real foundations.</em></h2><p>Double-click a bone to explore its region, then double-click again to focus that bone alone. Back returns to the previous view. The Region and Bone buttons provide the same actions without a gesture. Regional bone colors have a persistent On / Off control and an optional key; skeleton overviews stay neutral.</p><p>Drag to orbit, scroll to zoom and use right-drag to pan. Enable Peel to click away covering surfaces, then disable it to select a deeper structure. Restore brings all hidden surfaces back. Shift-click is a peeling shortcut. On touch, use one finger to rotate and two fingers to zoom or pan. Anatomical left and right always refer to the specimen. Use the searchable structure list for keyboard access.</p><p>The specimen comes from <a href="https://github.com/Z-Anatomy/Models-of-human-anatomy" target="_blank" rel="noreferrer">Z-Anatomy</a> (CC BY-SA 4.0), derived from BodyParts3D © The Database Center for Life Science (CC BY-SA 2.1 Japan). Web export: <a href="https://github.com/SeemaBansal1/3d-human-body-anatomy" target="_blank" rel="noreferrer">3d-human-body-anatomy</a>. The adult skeleton and 81 additional course tissue objects include bones, cartilage, teeth, ligaments, discs and vertebral arteries. Landmark references combine original validated Z-Anatomy annotations with manually curated surface and opening references. Magnified long-bone, flat-bone and osteon teaching reconstructions are separate from the adult specimen. The previous newborn calvarial and round-window models have been withdrawn; use the labeled textbook comparison and optional UCSF fetal-skull scan. Additional source geometry reveals the bony labyrinth and ligament-bounded spaces. Pins mark reference locations rather than complete surface boundaries.</p><p>Learning content is adapted from OpenStax Anatomy and Physiology 2e, © 2026 Rice University, CC BY-NC-SA 4.0. Access for free at <a href="https://openstax.org/details/books/anatomy-and-physiology-2e" target="_blank" rel="noreferrer">openstax.org</a>. Lab scope follows the supplied BI 231 Fall 2024 list.</p><p>Progress stays in this browser. Export a backup before changing devices or clearing browser data. The tool is an independent study companion.</p><p><a href="accuracy.html" target="_blank">Landmark accuracy review ↗</a> · <a href="CREDITS.md" target="_blank">Complete credits and licenses ↗</a> · <a href="PLAN.md" target="_blank">Education and design plan ↗</a> · <a href="TUTOR.md" target="_blank">Local tutor setup guide ↗</a></p>`);}
$('#help-btn').onclick=credits;$('#credits-btn').onclick=credits;
$('#coverage-btn').onclick=()=>{const c=coverage();dialog(`<h2>Every course item.<br><em>A suitable target.</em></h2><div class="score-row">${Object.entries(c).map(([k,n])=>`<div class="stat"><strong>${n}</strong><span>${labels[k]}</span></div>`).join('')}</div><p><button id="coverage-landmarks" class="primary">Open 310-feature textbook bank ↗</button> · <a href="LANDMARKS.md" target="_blank">Expanded feature coverage ↗</a></p><p>All 177 original course IDs are preserved. Supported anatomy uses locating and identification exercises. Unresolved anatomy uses source study and recall while spatial scoring is withheld. Native geometry, source annotations and explanatory teaching models are distinguished in the <a href="accuracy.html" target="_blank">landmark accuracy review ↗</a>. Drawer tests use movement and ligament reasoning. Pins are reference points, not full surface segmentations. Adult geometry is never used to represent infant fontanelles.</p><table><thead><tr><th>Region</th><th>Course items</th><th>Represented</th></tr></thead><tbody>${regions.slice(1).map(r=>`<tr><td>${r}</td><td>${terms.filter(t=>t.region===r).length}</td><td>${terms.filter(t=>t.region===r&&t.representation).length}</td></tr>`).join('')}</tbody></table><p><a href="COVERAGE.csv" download>Download the item-by-item audit ↓</a> · <a href="PLAN.md" target="_blank">Learning and design plan ↗</a></p>`);$('#coverage-landmarks').onclick=()=>{$('#info-dialog').close();document.dispatchEvent(new Event('landmarkbank'));};};
renderList();
initPractice({viewer,setDivision:changeDivision,setView,selectTerm,dialog,toast,escape});

initStudy({viewer,setView,selectTerm,dialog,toast,escape});
initPrecision({viewer,setDivision:changeDivision,setView,dialog,toast,escape});
initReader({setView,escape});
initTutor({escape,toast});
landmarkUI=initLandmarks({viewer,selectTerm,setView,dialog,escape});
document.addEventListener('landmarkcontext',ev=>{if(ready)selectTerm(ev.detail);});
initWorkspace();
document.addEventListener('landmarkpick',ev=>{if(!document.body.dataset.precisionActive)selectTerm(ev.detail);});
document.addEventListener('viewchange',ev=>{if(ev.detail==='atlas'&&!document.body.classList.contains('quiz-active')){if(ready&&viewer.region!==region)viewer.setRegion(region);if(selected){if(viewer.selectedTerm?.id!==selected.id)selectTerm(selected);else detail(selected);}else resetDetail();syncFilters();}});

setView(location.hash.slice(1)||'atlas');
const requestedFeature=new URLSearchParams(location.search).get('feature');
if(requestedFeature){const term=allTerms.find(t=>t.id===requestedFeature||t.feature?.id===requestedFeature);if(term)selectTerm(term);}
document.addEventListener('click',event=>{const id=event.target.closest('[data-member-term]')?.dataset.memberTerm;if(id){const term=allTerms.find(t=>t.id===id);if(term)selectTerm(term);}});
