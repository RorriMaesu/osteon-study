import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/addons/loaders/DRACOLoader.js';
import manifest from './muscle-models.json' with {type:'json'};
import {setLearningContext} from './learning-context.js';
import {muscleCoverage} from './muscle-coverage.js';
import {createMuscleSpatialPractice} from './muscle-spatial.js';

import {captureBoneView,restoreBoneView,prepareMuscleNavigation,muscleContextForView,boneViewKey} from './muscle-view.js';
import {muscleScopeRegions,muscleScopeNames,muscleRegions,componentVisible,componentColor,muscleBoneContext,muscleFacts,muscleLabelPosition} from './muscle-data.js';
export function initMuscleAtlas({viewer,escape:e,toast,dialog,onExit}){
 if(!viewer.scene||!viewer.renderer){
  const spatial=createMuscleSpatialPractice({viewer,escape:e,unavailable:true});
  const unavailable={unavailable:true,state:{enabled:false},get coursePracticeActive(){return spatial.active;},ownsFocus:()=>false,release(){},syncControls(){},
   openCoursePractice:spatial.open,closeCoursePractice:spatial.close,openRegion:async()=>toast('3D anatomy is unavailable here. The complete readings and exams remain available.')};
  viewer.muscleLayer=unavailable;return unavailable;
 }
 const $=s=>document.querySelector(s),sidebar=$('.structure-sidebar'),oldPick=viewer.onPick,initialGhostTitle=$('#ghost-btn').title;
 const state={enabled:false,region:'all',side:'both',depth:'all',support:false,focused:false,groupOnly:false,selected:null,colors:false,labels:true,pick:'muscles',query:'',page:0};
 const loaded=new Map(),loading=new Map(),meshes=[];let actionVersion=0,busy=false,level='region',before=null,overlayWasOn=false,loadStatus='',lastBoneView='';const initialTotal=$('#structure-total').textContent;
 const mainToggle=$('#main-muscles-toggle');
 const button=document.createElement('button');button.id='muscles-btn';button.type='button';button.setAttribute('aria-pressed','false');button.setAttribute('aria-label','Toggle muscle layer');button.innerHTML='◉ <span>Muscles: Off</span>';button.disabled=!viewer.loaded;$('#tissues-btn').before(button);
 const browse=document.createElement('button');browse.type='button';browse.textContent='Muscles';browse.setAttribute('aria-pressed','false');$('.browse-modes').append(browse);
 const panel=document.createElement('section');panel.className='muscle-browser';panel.hidden=true;panel.setAttribute('aria-label','Muscle explorer');sidebar.append(panel);
 const label=document.createElement('div');label.className='muscle-surface-label';label.hidden=true;viewer.el.append(label);
 const labelLine=document.createElementNS('http://www.w3.org/2000/svg','svg');labelLine.classList.add('muscle-label-line');labelLine.innerHTML='<line stroke="#badac7" stroke-width="1.4"/><circle r="3" fill="#182e30" stroke="#badac7" stroke-width="1.4"/>';labelLine.style.display='none';viewer.el.append(labelLine);
 const group=new THREE.Group();group.name='Osteon regional muscle layers';viewer.scene.add(group);
 const byId=new Map(manifest.components.map(c=>[c.id,c])),compact=matchMedia('(min-width:1000px) and (max-height:650px)');
 const assetURL=region=>new URL('assets/'+manifest.assets[region].file+'?v='+manifest.assets[region].sha256.slice(0,12),document.baseURI).href;
 function currentRows(){return manifest.components.filter(c=>!c.retired&&(muscleScopeRegions(state.region).includes(c.region))&&(state.side==='both'||c.side===state.side||c.side==='midline'||c.side==='bilateral')&&(state.support||c.kind==='muscle')&&(state.depth==='all'||c.depth===state.depth)&&(!state.query||[c.name,c.muscleName,c.side].join(' ').toLowerCase().includes(state.query.toLowerCase())));}
 async function load(region){
  if(loaded.has(region))return;if(loading.has(region))return loading.get(region);
  const job=(async()=>{const decoder=new DRACOLoader();decoder.setDecoderPath(new URL('vendor/draco/',document.baseURI).href);decoder.setWorkerLimit(1);const loader=new GLTFLoader().setDRACOLoader(decoder);try{const gltf=await loader.loadAsync(assetURL(region));gltf.scene.traverse(m=>{if(!m.isMesh)return;const c=byId.get(m.userData.muscleId);if(!c)throw Error('A muscle has no source identity.');m.userData.component=c;m.userData.zname=c.sourceName;m.material=new THREE.MeshStandardMaterial({color:c.kind==='support'?0xcfc1a3:0xad6554,roughness:.67,metalness:.02,side:THREE.DoubleSide});m.visible=false;meshes.push(m);});group.add(gltf.scene);group.updateMatrixWorld(true);for(const m of meshes)m.userData.bounds=new THREE.Box3().setFromObject(m);loaded.set(region,gltf.scene);}finally{decoder.dispose();loading.delete(region);}})();loading.set(region,job);return job;
 }
 async function ensureRegion(){busy=true;renderBrowser();try{const regions=muscleScopeRegions(state.region);for(const [i,r]of regions.entries()){loadStatus='Loading '+(i+1)+'/'+regions.length+' · '+muscleRegions[r];renderBrowser();await load(r);}}catch(err){toast('Muscle loading did not finish. Your skeleton and saved study work remain available. Use Retry.');console.error(err);}finally{busy=loading.size>0;loadStatus='';viewer.applyVisibility();renderBrowser();}}
 function bounds(targets){const box=new THREE.Box3();targets.forEach(m=>box.union(m.userData.bounds));return box;}
 function visibleTargets(){return meshes.filter(m=>m.visible);}
 function frame(side='front'){if(spatial.active){spatial.frame(side);return;}if(state.enabled&&state.preserveBoneContext){state.preserveBoneContext=false;prepareMuscleNavigation(viewer);}const ids=new Set(focusComponents().map(c=>c.id)),target=state.focused?meshes.filter(m=>ids.has(m.userData.muscleId)&&m.visible):visibleTargets();if(target.length){const box=bounds(target);box.expandByScalar(state.focused?.025:.045);viewer.frameBox(box,side);}}
 function selectedRecord(){return byId.get(state.selected);}
 function selectedComponents(){const c=selectedRecord();return c?manifest.components.filter(x=>!x.retired&&(x.id===c.id||(!state.partOnly&&x.muscleName===c.muscleName&&x.side===c.side))):[];}
 function groupMembers(){const c=selectedRecord();return c?.memberOf?manifest.components.filter(x=>!x.retired&&x.memberOf===c.memberOf&&x.side===c.side):[];}
 function focusComponents(){return state.groupOnly?groupMembers():selectedComponents();}
 function selectedName(){const c=selectedRecord();return c?(selectedComponents().length>1?c.muscleName:c.name):'';}
 function coverageReport(){
  const a=muscleCoverage,missing=a.rows.filter(r=>r.status==='no-named-mesh'),open=a.rows.filter(r=>!['named-geometry','represented-by-components','no-named-mesh'].includes(r.status));
  dialog(`<h2>Muscle coverage<br><em>Known gaps.</em></h2><p><b>This source atlas is incomplete.</b> ${a.muscleParts} muscle parts and ${a.supportParts} supporting components are source objects, including sides and separate heads.</p><p>The ${a.referenceChecks}-entry reference checklist found <b>${missing.length} entries without a named mesh</b> and ${open.length} partial or unresolved entries. These include variants and sex-specific anatomy. Named geometry does not certify shape, tendon routes or attachment areas.</p><h3>Important findings</h3><ul><li>Tensor fasciae latae is now correctly shown as muscle.</li><li>All three usual palmar interossei and all four foot lumbricals are now individually selectable on each side.</li><li>Several tongue, soft-palate, perineal, auricular and small spinal muscles lack a named mesh.</li><li>Spinalis / semispinalis capitis and pelvic-floor names need attachment-based review.</li></ul><details><summary>${missing.length} entries without a named model</summary>${Object.entries(muscleRegions).map(([id,name])=>{const rows=missing.filter(r=>r.region===id);return rows.length?`<h4>${e(name)}</h4><ul>${rows.map(r=>`<li>${e(r.name)}${r.inconstantInTA2?' · listed inconstant':''}${r.sexScope?' · '+e(r.sexScope)+' anatomy':''}</li>`).join('')}</ul>`:'';}).join('')}</details><details><summary>Partial groups and unresolved anatomy</summary><ul>${open.map(r=>`<li><b>${e(r.name)}</b>: ${e(r.note||r.status)}</li>`).join('')}</ul></details><p><a href="https://github.com/RorriMaesu/osteon-study/blob/main/MUSCLE-ACCURACY-AUDIT.md" target="_blank" rel="noreferrer">Read the full audit and correction order ↗</a> · <a href="MUSCLE-REFERENCE-AUDIT.csv" download>Download checklist ↓</a></p><p class="tiny">The checklist uses named skeletal-muscle terms and selected groups from TA2, checked against regional anatomy references. It is a finite coverage baseline, not every human variant. Precise spatial scoring and moving-muscle rigs remain disabled.</p>`);
 }
 function reviewNotice(c){return c.geometryReview?`<div class="muscle-review-note" role="note"><b>${c.geometryReview.status==='incomplete-group'?'Incomplete muscle group':'Anatomical review needed'}</b><p>${e(c.geometryReview.note)}</p></div>`:'';}
 function showOverview(){
  const name=state.region==='all'?'Whole-body muscles':muscleScopeNames[state.region];
  $('#specimen-name').textContent=name;$('#specimen-region').textContent='MUSCLE ATLAS';
  $('#detail-content').innerHTML=`<span class="detail-type">MUSCLE ATLAS · ${e(state.side)}</span><h2>${e(name)}</h2><p>Select a muscle in the model or search the list. Double-click or double-tap to focus; Show region brings its neighbors back.</p><p>Use Peel to remove covering surfaces, then switch Peel off to select the deeper anatomy. Undo peel brings back the most recent surface. Restore all brings back every hidden surface.</p><p class="tiny"><b>This source is incomplete.</b> Open Known gaps in the browser for the reference checklist. Outer and deeper filters are selected examples, not complete dissection layers. Attachment footprints and movement are not independently certified; precise spatial scoring is disabled.</p>`;
 }
 function showDetail(){const c=selectedRecord();if(!c)return;const facts=muscleFacts(c);$('#detail-content').innerHTML=`<span class="detail-type">${c.kind==='muscle'?'SKELETAL MUSCLE':'SUPPORTING TISSUE'} · ${e(c.side)}</span><h2>${e(selectedName())}</h2>${c.memberOf?`<p><button data-muscle-group aria-pressed="${state.groupOnly}">Study all ${groupMembers().length} group members</button></p>`:''}${reviewNotice(c)}${c.nameCorrection?`<p class="tiny">${e(c.nameCorrection)}</p>`:''}${manifest.components.filter(x=>x.muscleName===c.muscleName&&x.side===c.side).length>1?`<label for="muscle-part">Part or head</label><select id="muscle-part"><option value="all" ${!state.partOnly?'selected':''}>Whole muscle</option>${manifest.components.filter(x=>x.muscleName===c.muscleName&&x.side===c.side).map(x=>`<option value="${x.id}" ${state.partOnly&&state.selected===x.id?'selected':''}>${e(x.name)}</option>`).join('')}</select>`:''}${facts?`<p>${e(facts.action)}</p><div class="muscle-attachment-notes"><p><b>Origin</b><br>${e(facts.origin)}</p><p><b>Insertion</b><br>${e(facts.insertion)}</p></div>`:`<p>${e(c.muscleName)} · ${e(muscleRegions[c.region])}.</p><p class="tiny">Source anatomy is available for location and naming. Detailed attachment teaching for this structure has not yet been independently mapped.</p>`}<p class="tiny">${c.sourceDataset?`Source: <a href="${e(c.sourceURL)}" target="_blank" rel="noreferrer">${e(c.sourceDataset)} ↗</a>. `:''}Source-aligned reference · attachment footprints and movement are not certified. Precise spatial scoring is disabled.</p><div class="detail-actions"><button data-muscle-focus>Focus muscle</button><button data-muscle-region>Show region</button><button data-muscle-isolate>${state.focused?'Restore neighbors':'Isolate muscle'}</button><button data-muscle-attachments>Attachment guide</button><button data-muscle-source>Read related source</button></div>`;
  $('[data-muscle-group]')?.addEventListener('click',()=>{state.groupOnly=!state.groupOnly;state.focused=state.groupOnly;level=state.focused?'muscle':'region';viewer.applyVisibility();frame();renderBrowser();showDetail();document.dispatchEvent(new Event('structureselected'));});
  $('#muscle-part')?.addEventListener('change',ev=>{state.partOnly=ev.target.value!=='all';if(state.partOnly)state.selected=ev.target.value;viewer.applyVisibility();showDetail();});
  $('[data-muscle-focus]').onclick=()=>{if(state.groupOnly){state.groupOnly=false;state.focused=false;}if(!state.focused)api.toggleIsolation();else frame();};$('[data-muscle-isolate]').onclick=()=>api.toggleIsolation();$('[data-muscle-region]').onclick=()=>api.showRegion();$('[data-muscle-attachments]').onclick=()=>attachmentGuide(c);$('[data-muscle-source]').onclick=()=>window.open(muscleFacts(c)?.sourceURL||'https://openstax.org/books/anatomy-and-physiology-2e/pages/'+({ 'head-neck':'11-3-axial-muscles-of-the-head-neck-and-back','trunk-back':'11-4-axial-muscles-of-the-abdominal-wall-and-thorax','shoulder-arm':'11-5-muscles-of-the-pectoral-girdle-and-upper-limbs','forearm-hand':'11-5-muscles-of-the-pectoral-girdle-and-upper-limbs','pelvis-leg-foot':'11-6-appendicular-muscles-of-the-pelvic-girdle-and-lower-limbs'}[c.region]),'_blank','noopener');
  $('#specimen-name').textContent=selectedName()+' · '+c.side;$('#specimen-region').textContent='MUSCLE ATLAS';setLearningContext({type:'muscle',label:c.name+' ('+c.side+')',text:'Named '+(c.sourceDataset||'Z-Anatomy')+' skeletal muscle reference. Static source-aligned geometry; detailed attachment extents are not certified.',reference:facts?.reference||'10.2'});
 }
 function attachmentGuide(c){const f=muscleFacts(c);dialog(`<h2>${e(f?.name||c.name)} · attachment guide</h2>${f?`<p><b>Origin:</b> ${e(f.origin)}</p><p><b>Insertion:</b> ${e(f.insertion)}</p><p><b>Action:</b> ${e(f.action)}</p>`:'<p>This structure has named source geometry. Its full attachment teaching record is still under review.</p>'}<p>These descriptions are not certified surface footprints. The static source model retains its original attachment positioning. Broad origins, shared tendons and capsular contributions should not be reduced to one arbitrary dot.</p><p>Precise attachment scoring and movement are disabled until their anatomical mapping is reviewed.</p>`);}
 function select(id,{zoom=false}={}){const c=byId.get(id);if(!c||c.retired)return;const keepGroup=state.groupOnly&&c.memberOf&&c.memberOf===selectedRecord()?.memberOf&&c.side===selectedRecord()?.side;state.selected=id;state.partOnly=false;viewer.clearPins();viewer.selected=[];viewer.selectedTerm=null;viewer.isolated=false;viewer.ghost=false;state.focused=!!keepGroup;state.groupOnly=!!keepGroup;viewer.applyVisibility();showDetail();renderBrowser();document.dispatchEvent(new Event('structureselected'));if(zoom){state.focused=true;level='muscle';viewer.applyVisibility();frame();}}
 function renderBrowser(){
  panel.hidden=!state.enabled;sidebar.classList.toggle('muscle-browsing',state.enabled);browse.setAttribute('aria-pressed',String(state.enabled));button.setAttribute('aria-pressed',String(state.enabled));syncToggle();if(!state.enabled){$('#structure-total').textContent=initialTotal;return;}$('#structure-total').textContent=manifest.components.filter(c=>!c.retired&&c.kind==='muscle').length+' MUSCLE PARTS';sidebar.querySelectorAll('[data-browse-mode]').forEach(b=>b.setAttribute('aria-pressed','false'));
  const pageSize=compact.matches?2:3,rows=currentRows(),groups=[...rows.reduce((map,c)=>{const key=c.muscleName+'|'+c.side+'|'+c.kind;if(!map.has(key))map.set(key,[]);map.get(key).push(c);return map;},new Map()).values()],pages=Math.max(1,Math.ceil(groups.length/pageSize));state.page=Math.max(0,Math.min(pages-1,state.page));const shown=groups.slice(state.page*pageSize,state.page*pageSize+pageSize).map(parts=>({...parts[0],name:parts.length>1?parts[0].muscleName:parts[0].name,parts:parts.length}));
  panel.innerHTML=`<label for="muscle-region">Muscle region</label><select id="muscle-region">${Object.keys(manifest.assets).length>1?`<option value="all" ${state.region==='all'?'selected':''}>Whole body · all regions (~${Math.ceil(Object.values(manifest.assets).reduce((n,a)=>n+a.bytes,0)/1048576)} MB)</option>`:''}${Object.keys(muscleScopeNames).filter(r=>r!=='all').map(r=>`<option value="${r}" ${state.region===r?'selected':''}>${e(muscleScopeNames[r])}</option>`).join('')}</select><div class="muscle-filter-grid"><label>Side<select id="muscle-side"><option value="right" ${state.side==='right'?'selected':''}>Right</option><option value="left" ${state.side==='left'?'selected':''}>Left</option><option value="both" ${state.side==='both'?'selected':''}>Both</option></select></label><label>Layers<select id="muscle-depth" title="Outer and deeper are assigned examples. All layers includes every available muscle."><option value="all">All layers</option><option value="superficial" ${state.depth==='superficial'?'selected':''}>Outer examples</option><option value="deeper" ${state.depth==='deeper'?'selected':''}>Deeper examples</option></select></label></div><label for="muscle-search" class="sr-only">Search muscle components</label><input id="muscle-search" type="search" placeholder="Find a muscle or head" value="${e(state.query)}"><div class="muscle-small-controls"><button data-muscle-pick aria-pressed="${state.pick==='muscles'}">Select: ${state.pick==='muscles'?'Muscles':'Bones'}</button><button data-muscle-colors ${state.region==='all'?'disabled':''} title="Choose a region to color adjacent muscles; colors are for identification, not tissue histology." aria-pressed="${state.colors&&state.region!=='all'}">Colors: ${state.colors&&state.region!=='all'?'On':'Off'}</button><button data-muscle-labels aria-pressed="${state.labels}">Label: ${state.labels?'On':'Off'}</button><button data-muscle-show-region>${state.selected&&!state.focused?'Focus muscle':'Show region'}</button></div><label class="check-line"><input id="muscle-support" type="checkbox" ${state.support?'checked':''}> Fascia & supporting tissues</label><p class="tiny" role="status">${busy?e(loadStatus||'Loading original muscle anatomy…'):groups.length+' structure'+(groups.length===1?'':'s')+' / '+rows.length+' part'+(rows.length===1?'':'s')+' · '+(manifest.phase==='pilot'?'shoulder pilot':'regional atlas')}</p><div class="muscle-results">${shown.map(c=>`<button data-muscle-id="${c.id}" aria-pressed="${state.selected===c.id}"><span>${e(c.name)}</span><small>${e(c.side)} · ${c.parts>1?c.parts+' parts':c.kind==='support'?'supporting tissue':'muscle'}</small></button>`).join('')||'<p>No matches. Clear the search or change the filters.</p>'}</div><nav class="muscle-pages" aria-label="Muscle results pages"><button data-muscle-prev ${state.page===0?'disabled':''}>←</button><span>${state.page+1} / ${pages}</span><button data-muscle-next ${state.page===pages-1?'disabled':''}>→</button></nav><div class="muscle-browser-footer"><button data-muscle-exit>Back to bones</button><button data-muscle-coverage title="Open reference checks across the complete muscle atlas">Known gaps · ${muscleCoverage.rows.filter(r=>!['named-geometry','represented-by-components'].includes(r.status)).length}</button></div>${!busy&&!muscleScopeRegions(state.region).every(r=>loaded.has(r))?'<button data-muscle-retry>Retry muscle loading</button>':''}`;
  $('#muscle-region').onchange=async ev=>{const revision=++actionVersion;state.region=ev.target.value;state.pick='muscles';state.query='';state.groupOnly=false;state.partOnly=false;if(state.region==='all')state.side='both';state.selected=null;state.focused=false;state.page=0;level=state.region==='all'?'overview':'region';showOverview();await ensureRegion();if(state.enabled&&revision===actionVersion)frame();};$('#muscle-side').onchange=ev=>{state.side=ev.target.value;state.pick='muscles';state.groupOnly=false;state.partOnly=false;state.selected=null;state.focused=false;state.page=0;viewer.applyVisibility();renderBrowser();showOverview();frame();};$('#muscle-depth').onchange=ev=>{state.depth=ev.target.value;state.selected=null;state.groupOnly=false;state.partOnly=false;state.focused=false;state.page=0;viewer.applyVisibility();renderBrowser();if(state.pick==='muscles')showOverview();};$('#muscle-support').onchange=ev=>{state.support=ev.target.checked;if(!state.support&&selectedRecord()?.kind==='support'){api.release();state.partOnly=false;showOverview();}state.page=0;viewer.applyVisibility();renderBrowser();};$('#muscle-search').oninput=ev=>{state.query=ev.target.value;const cursor=ev.target.selectionStart;state.page=0;renderBrowser();$('#muscle-search').focus({preventScroll:true});try{$('#muscle-search').setSelectionRange(cursor,cursor);}catch{}};
  panel.querySelectorAll('[data-muscle-id]').forEach(b=>b.onclick=()=>select(b.dataset.muscleId));panel.querySelector('[data-muscle-prev]').onclick=()=>{state.page--;renderBrowser();};panel.querySelector('[data-muscle-next]').onclick=()=>{state.page++;renderBrowser();};panel.querySelector('[data-muscle-pick]').onclick=()=>{state.pick=state.pick==='muscles'?'bones':'muscles';lastBoneView=boneViewKey(viewer);viewer.applyVisibility();if(state.pick==='bones')viewer.notifyFocus();renderBrowser();};panel.querySelector('[data-muscle-colors]').onclick=()=>{state.colors=!state.colors;viewer.applyVisibility();renderBrowser();};panel.querySelector('[data-muscle-labels]').onclick=()=>{state.labels=!state.labels;viewer.needsRender=true;renderBrowser();};panel.querySelector('[data-muscle-show-region]').onclick=()=>{state.groupOnly=false;state.focused=!!state.selected&&!state.focused;level=state.focused?'muscle':'region';viewer.applyVisibility();frame();renderBrowser();if(state.selected)showDetail();document.dispatchEvent(new Event('structureselected'));};panel.querySelector('[data-muscle-exit]').onclick=()=>enable(false);panel.querySelector('[data-muscle-coverage]').onclick=coverageReport;panel.querySelector('[data-muscle-retry]')?.addEventListener('click',ensureRegion);
 }
 function syncToggle(){for(const control of [button,mainToggle]){control.disabled=!viewer.loaded||viewer.quiz||!!viewer.activeDetail;control.setAttribute('aria-pressed',String(state.enabled));control.setAttribute('aria-busy',String(state.enabled&&busy));control.querySelector('span:last-child').textContent='Muscles: '+(state.enabled?'On':'Off');control.title=control.disabled?'Return to the adult 3D atlas to use muscles':state.enabled?'Hide muscles and return to your bone view':'Show muscles here without moving the camera';}}
 function clearMusclePeels(){for(const surface of viewer.peeledSurfaces)if(typeof surface==='string')viewer.peeledSurfaces.delete(surface);}
 async function enable(on,{requestedRegion=null,frameView=false,restoreView=true}={}){
  if(!viewer.loaded){toast('The skeleton is still loading.');return;}if(on&&(viewer.quiz||viewer.activeDetail)){toast('Return to the adult atlas before opening muscles.');return;}
  const revision=++actionVersion;
  if(on){viewer.nervousLayer?.clearSelection();if(!state.enabled){before=captureBoneView(viewer);overlayWasOn=!!viewer.landmarksVisible;}lastBoneView=boneViewKey(viewer);const context=muscleContextForView(viewer);Object.assign(state,context,{enabled:true,preserveBoneContext:true,focused:false,groupOnly:false,selected:null,partOnly:false,query:'',page:0,depth:'all',pick:'muscles'});if(requestedRegion)state.region=requestedRegion;clearMusclePeels();viewer.landmarkOverlay?.setEnabled(false);level=state.region==='all'?'overview':'region';showOverview();viewer.applyVisibility();await ensureRegion();if(frameView&&state.enabled&&revision===actionVersion)frame();}
  else{const restoreCamera=!state.preserveBoneContext;state.enabled=false;state.selected=null;state.focused=false;state.groupOnly=false;clearMusclePeels();label.hidden=true;labelLine.style.display='none';renderBrowser();if(restoreView&&before)restoreBoneView(viewer,before,{restoreCamera});if(overlayWasOn)viewer.landmarkOverlay?.setEnabled(true);if(restoreView)onExit?.();}
  renderBrowser();document.dispatchEvent(new Event('layerschanged'));
 }
 function syncNavigation(){
  const trail=$('#focus-trail'),back=$('#focus-back'),backFocused=document.activeElement===back;
  const text='Muscles › '+muscleScopeNames[state.region]+(state.selected?' › '+selectedName():'');
  if(trail.textContent!==text)trail.textContent=text;
  trail.title=text;trail.classList.remove('focus-intro');
  back.hidden=!viewer.referenceOpen&&!api.canGoBack();
  if(back.hidden&&backFocused)$('#focus-overview').focus({preventScroll:true});
  $('.viewer-hint').textContent=viewer.peel?'Peel is on. Turn it off to select a muscle.':state.groupOnly?'Group view · '+groupMembers().length+' muscles · Select a member to compare':'Double-click or double-tap a muscle to focus · Drag to rotate';
 }
 const ray=new THREE.Raycaster();
 let courseBefore=null;
 function enterCourseRegion(region){
  if(!courseBefore){
   const stage=viewer.el.closest('.specimen-stage'),plate=stage.querySelector('#landmark-stage');
   courseBefore={state:{...state},level,bone:captureBoneView(viewer),peeled:[...viewer.peeledSurfaces],landmarks:!!viewer.landmarksVisible,reference:viewer.referenceOpen,plate,plateHidden:plate?.hidden};
   viewer.drawerMotion?.stop();viewer.landmarkOverlay?.setEnabled(false);
   viewer.activeDetail=null;viewer.referenceOpen=false;stage.classList.remove('reference-open');if(plate)plate.hidden=true;
   viewer.peeledSurfaces.clear();viewer.controls.autoRotate=false;viewer.lastTap=null;
   prepareMuscleNavigation(viewer);
  }
  ++actionVersion;
  Object.assign(state,{enabled:true,region,side:'both',depth:'all',support:true,preserveBoneContext:false,selected:null,focused:false,groupOnly:false,partOnly:false,pick:'muscles',query:'',page:0});
  level='region';viewer.applyVisibility();
 }
 function exitCourse(){
  if(!courseBefore)return;
  const saved=courseBefore;courseBefore=null;++actionVersion;Object.assign(state,saved.state);level=saved.level;
  viewer.peeledSurfaces.clear();for(const surface of saved.peeled)viewer.peeledSurfaces.add(surface);
  viewer.lastTap=null;viewer.referenceOpen=saved.reference;
  viewer.el.closest('.specimen-stage').classList.toggle('reference-open',!!saved.reference);
  if(saved.plate)saved.plate.hidden=saved.plateHidden;
  restoreBoneView(viewer,saved.bone,{restoreCamera:true});
  if(saved.landmarks)viewer.landmarkOverlay?.setEnabled(true);
  renderBrowser();if(state.enabled){if(state.selected)showDetail();else showOverview();}else onExit?.();
  document.dispatchEvent(new Event('layerschanged'));
 }
 const spatial=createMuscleSpatialPractice({viewer,escape:e,enter:enterCourseRegion,loadRegion:load,exit:exitCourse,visibleMeshes:visibleTargets,
  refresh:()=>{if(viewer.loaded)viewer.applyVisibility();},frameMeshes:(targets,side)=>{if(targets.length)viewer.frameBox(bounds(targets).expandByScalar(.014),side);}});
 const api={
  state,manifest,meshes,
  get coursePracticeActive(){return spatial.active;},openCoursePractice:spatial.open,closeCoursePractice:spatial.close,
  syncControls(){
   syncToggle();
   if(spatial.active)return;
   if(!api.ownsFocus()){$('#ghost-btn').title=initialGhostTitle;return;}
   viewer.el.setAttribute('aria-label','3D muscle atlas. Drag to rotate. Double-click or double-tap a muscle to focus. Back goes one step. Full skeleton returns to the bone atlas.');
   $('#skull-controls').hidden=true;$('#skull-key').hidden=true;
   syncNavigation();
   const isolate=$('#isolate-btn'),focus=$('#focus-btn'),ghost=$('#ghost-btn'),next=$('#focus-next');
   isolate.disabled=!state.selected;isolate.setAttribute('aria-pressed',String(state.focused));isolate.querySelector('span').textContent='Muscle';isolate.setAttribute('aria-label',state.focused?'Return to muscle region':'Focus selected muscle alone');isolate.title=isolate.getAttribute('aria-label');
   focus.disabled=false;focus.querySelector('span').textContent='Region';focus.setAttribute('aria-label','Show muscle region');focus.title='Show muscle region';
   ghost.disabled=true;ghost.setAttribute('aria-pressed','false');ghost.title='Use Select: Bones to see the skeleton through the muscle layer.';
   next.hidden=viewer.referenceOpen||viewer.peel||state.focused;next.disabled=!state.selected;next.textContent='Focus muscle';next.onclick=()=>api.toggleIsolation();
  },
  updateVisibility(){
   const practice=spatial.presentation;
   if(practice){
    group.visible=state.enabled&&!viewer.quiz&&!viewer.activeDetail;
    for(const o of viewer.scene.children)if(o.userData.ground)o.visible=false;
    for(const m of meshes){
     const c=m.userData.component;m.visible=group.visible&&c.region===state.region&&practice.ids.has(c.id)&&!c.retired;
     const highlighted=practice.emphasized.has(c.id);
     m.material.color.set(highlighted?'#e4b473':'#ad6554');m.material.emissive.setHex(highlighted?0x382312:0);m.material.opacity=1;m.material.transparent=false;m.material.depthWrite=true;
    }
    const local=visibleTargets(),box=local.length?bounds(local).expandByScalar(.05):null;
    for(const m of viewer.meshes){
     m.visible=!!(box&&m.visible&&!m.userData.detailGroup&&!m.userData.nonbone&&!m.userData.tissue&&!m.userData.guideOnly&&muscleBoneContext(m.userData.zname,state.region,state.side)&&box.intersectsBox(m.userData.bounds));
     if(m.visible){m.material.opacity=.24;m.material.transparent=true;m.material.depthWrite=false;}
    }
    label.hidden=true;labelLine.style.display='none';viewer.needsRender=true;return;
   }
   group.visible=!viewer.quiz&&!viewer.activeDetail;if(state.enabled&&!viewer.quiz&&!viewer.activeDetail)for(const o of viewer.scene.children)if(o.userData.ground)o.visible=state.region==='all'&&!state.focused;
   const selected=selectedRecord(),selectedIds=new Set(selectedComponents().map(c=>c.id)),focusIds=new Set(focusComponents().map(c=>c.id));if(api.ownsFocus())syncNavigation();for(const m of meshes){const c=m.userData.component;m.visible=componentVisible(c,{...state,quiz:viewer.quiz,activeDetail:viewer.activeDetail,hidden:viewer.peeledSurfaces,selectedIds:focusIds});m.material.color.set(state.colors&&state.region!=='all'?componentColor(c.muscleName):c.kind==='support'?'#cfc1a3':'#ad6554');m.material.emissive.setHex(selectedIds.has(c.id)?0x342019:0);m.material.opacity=state.pick==='bones'||viewer.nervousLayer?.fadesContext() ? .13 : 1;m.material.transparent=m.material.opacity<1;m.material.depthWrite=!m.material.transparent;}
   if(state.enabled&&!viewer.quiz&&!viewer.activeDetail&&state.pick==='muscles'){
    const local=visibleTargets(),box=local.length?bounds(local).expandByScalar(.05):null;
    if(!state.preserveBoneContext&&state.region!=='all'&&box)for(const m of viewer.meshes)if(!m.userData.detailGroup){m.visible=!!(m.visible&&muscleBoneContext(m.userData.zname,state.region,state.side)&&box.intersectsBox(m.userData.bounds));}
   }
   label.hidden=!state.enabled||!state.labels||!selected||viewer.quiz||!!viewer.activeDetail;viewer.needsRender=true;
  },
  intersection(ray){return state.enabled&&!viewer.quiz&&!viewer.activeDetail&&group.visible?ray.intersectObjects(visibleTargets(),false)[0]:null;},
  pick(pointerRay,boneHit){if(!state.enabled||state.pick!=='muscles'||viewer.quiz||viewer.activeDetail)return null;const hit=pointerRay.intersectObjects(visibleTargets(),false)[0];return hit&&(!boneHit||boneHit.object.material.opacity<.45||hit.distance<=boneHit.distance+.0005)?hit.object:null;},
  updateLabel(){if(spatial.active){spatial.updateSurfaces();return;}if(!state.enabled||!state.labels||!state.selected||viewer.quiz||viewer.activeDetail){label.hidden=true;labelLine.style.display='none';return;}const ids=new Set(selectedComponents().map(c=>c.id)),selectedMeshes=meshes.filter(m=>m.visible&&ids.has(m.userData.muscleId));if(!selectedMeshes.length){label.hidden=true;labelLine.style.display='none';return;}const center=bounds(selectedMeshes).getCenter(new THREE.Vector3()),delta=center.clone().sub(viewer.camera.position);ray.set(viewer.camera.position,delta.normalize());const hit=ray.intersectObjects(selectedMeshes,false)[0];if(!hit){label.hidden=true;labelLine.style.display='none';return;}const point=hit.point.clone().project(viewer.camera),occluders=[...meshes.filter(m=>m.visible&&!selectedMeshes.includes(m)),...viewer.meshes.filter(m=>m.visible&&!m.userData.guideOnly&&m.material.opacity>.45)],covered=ray.intersectObjects(occluders,false).some(h=>h.distance<hit.distance-.001);label.hidden=covered||Math.abs(point.x)>.95||Math.abs(point.y)>.95||point.z< -1||point.z>1;labelLine.style.display=label.hidden?'none':'';if(label.hidden)return;const c=selectedRecord(),ax=(point.x+1)*.5*viewer.el.clientWidth,ay=(1-point.y)*.5*viewer.el.clientHeight;const labelText=selectedName()+' · '+c.side+(c.geometryReview?.status==='incomplete-group'?' · partial group':'');if(label.textContent!==labelText)label.textContent=labelText;const base=viewer.el.getBoundingClientRect(),detail=$('#atlas-details').getBoundingClientRect(),rightEdge=$('#viewer-details')?.getAttribute('aria-expanded')==='true'&&detail.left>base.left&&detail.left<base.right?detail.left-base.left-12:viewer.el.clientWidth,pos=muscleLabelPosition({width:viewer.el.clientWidth,height:viewer.el.clientHeight,ax,ay,rightEdge,labelWidth:label.offsetWidth});if(!pos){label.hidden=true;labelLine.style.display='none';return;}const {x,y}=pos;label.style.left=x+'px';label.style.top=y+'px';const line=labelLine.querySelector('line'),dot=labelLine.querySelector('circle');line.setAttribute('x1',ax);line.setAttribute('y1',ay);line.setAttribute('x2',x);line.setAttribute('y2',y);dot.setAttribute('cx',ax);dot.setAttribute('cy',ay);},
  navigate(m){if(spatial.active||!m.userData.muscleId)return false;select(m.userData.muscleId);if(level==='overview'){level='region';state.region=m.userData.component.region;if(['left','right'].includes(m.userData.component.side))state.side=m.userData.component.side;state.focused=false;viewer.applyVisibility();frame();renderBrowser();}else{state.groupOnly=false;state.focused=true;level='muscle';viewer.applyVisibility();frame();showDetail();}return true;},
  ownsFocus:()=>spatial.active||state.enabled&&state.pick==='muscles'&&!viewer.selectedTerm?.representation?.nerveKey&&!viewer.selectedTerm?.representation?.lymphNodeKey&&!viewer.quiz&&!viewer.activeDetail&&group.visible,frame,
  toggleIsolation(){if(!state.selected)return;state.groupOnly=false;state.focused=!state.focused;level=state.focused?'muscle':'region';viewer.applyVisibility();frame();renderBrowser();showDetail();},
  showRegion(){state.groupOnly=false;state.focused=false;level=state.region==='all'?'overview':'region';viewer.applyVisibility();frame();renderBrowser();if(state.selected)showDetail();else showOverview();},
  exitToSkeleton(){if(state.enabled)enable(false,{restoreView:false});},
  release(){state.groupOnly=false;state.focused=false;state.selected=null;label.hidden=true;labelLine.style.display='none';},
  canGoBack:()=>spatial.active||state.focused||state.region!=='all'||state.side!=='both',
  async back(){
   if(spatial.active){spatial.closeAndReturn();return;}
   if(state.focused){api.showRegion();return;}
   const revision=++actionVersion;
   Object.assign(state,{region:'all',side:'both',selected:null,partOnly:false,page:0});
   api.showRegion();
   await ensureRegion();
   if(api.ownsFocus()&&revision===actionVersion)frame();
  },
  restore(){state.groupOnly=false;state.focused=false;viewer.applyVisibility();if(state.enabled){renderBrowser();frame();}},
  async openRegion(region=null){spatial.close();await enable(true,{requestedRegion:muscleScopeNames[region]?region:null,frameView:!!muscleScopeNames[region]});}
 };
 viewer.muscleLayer=api;viewer.onPick=m=>{if(spatial.onPick(m))return;if(m.userData.muscleId){select(m.userData.muscleId);return;}api.release();oldPick(m);if(state.enabled&&state.pick==='bones'&&state.preserveBoneContext)before=captureBoneView(viewer);};
 document.addEventListener('atlasfocuschange',async()=>{
  if(!state.enabled||state.pick!=='bones'||viewer.quiz||viewer.activeDetail)return;
  const key=boneViewKey(viewer);if(key===lastBoneView)return;lastBoneView=key;++actionVersion;
  // Bone navigation is a new current view, not a reason to restore the old
  // region when the muscle layer is switched off.
  before=captureBoneView(viewer);Object.assign(state,muscleContextForView(viewer),{preserveBoneContext:true,selected:null,focused:false,groupOnly:false,partOnly:false,query:'',page:0});
  level=state.region==='all'?'overview':'region';await ensureRegion();
 });
 sidebar.querySelectorAll('[data-browse-mode]').forEach(b=>b.addEventListener('click',()=>{if(state.enabled)enable(false);}));
 button.onclick=()=>enable(!state.enabled);mainToggle.onclick=()=>enable(!state.enabled);browse.onclick=()=>enable(!state.enabled);document.addEventListener('anatomyready',syncToggle);
 document.addEventListener('assessmentstart',()=>{group.visible=false;panel.hidden=true;sidebar.classList.remove('muscle-browsing');label.hidden=true;labelLine.style.display='none';});document.addEventListener('assessmentend',()=>{group.visible=true;renderBrowser();viewer.applyVisibility();});document.addEventListener('viewchange',ev=>{if(state.enabled){renderBrowser();viewer.applyVisibility();if(ev.detail==='atlas'&&!viewer.quiz){if(state.selected)showDetail();else showOverview();}}});
 viewer.el.addEventListener('keydown',ev=>{if(ev.key==='Enter'&&api.ownsFocus()&&state.selected){ev.preventDefault();const mesh=meshes.find(m=>m.userData.muscleId===state.selected);if(mesh)api.navigate(mesh);}});
 document.addEventListener('openmuscles',ev=>api.openRegion(ev.detail||null));compact.addEventListener('change',()=>{if(state.enabled)renderBrowser();});
 return api;
}
