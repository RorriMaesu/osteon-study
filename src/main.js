import {isLessonId} from './chapters.js';
import {atlasMatches,atlasSuggestions} from './atlas-search.js';
import {initMuscleAtlas} from './muscle-atlas.js';
import {initMuscleLabeling} from './muscle-label-ui.js';
import {attachLymphNodeLayer} from './lymph-node-layer.js';
import {lymphNodeTerms,lymphNodeByKey,lymphNodeInScope,lymphRegions,lymphNodeTextbook,lymphNodeStatus} from './lymph-node-data.js';
import {attachNervousLayer} from './nervous-layer.js';
import {nerveTerms,nerveByKey,nerveInScope,nerveCategories} from './nerve-data.js';
import {ligamentTerms,ligamentByMesh,ligamentInScope,ligamentInDivision} from './ligament-data.js';
import {attachDrawerMotion} from './drawer-motion.js';
import {initClarityPractical} from './clarity-practical.js';
import {attachViewerRecovery} from './viewer-recovery.js';
import {initIssueReporter} from './issue-report.js';
import {featureGroup} from './atlas-landmark-data.js';
import {initLabList} from './lab-list-ui.js';
import {initLandmarks} from './landmark-ui.js';
import {initWorkspace} from './workspace.js';
import {initViewerRoom} from './viewer-room.js';
import {initAtlasLandmarks} from './atlas-landmark-layer.js';
import {attachFetalSpecimen} from './fetal-specimen-view.js';
import {viewerGuidance} from './viewer-guidance.js';
import {setLearningContext} from './learning-context.js';
import {initTutor} from './tutor.js';
import {divisions,inDivision,termDivision,regionAvailable,meshDivision} from './anatomy.js';
import {boneFamily,boneId} from './exploration.js';
import {terms,allTerms,textbookTerms,regions} from './data.js';
import {AnatomyViewer} from './viewer.js';
import {initPractice} from './practice.js';
import {initStudy} from './study.js';
import {initExams} from './exam-ui.js';
import {initMockExam3} from './mock-exam3-ui.js';
import {parseMockReportRoute} from './mock-exam3-study.js';
import {initPrecision,plateHTML} from './precision.js';
import {initReader} from './reader.js';
import {labels,coverage,pointKinds} from './representations.js';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
export const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let region='All regions',selected=null,ready=false,assessmentColors=false,explorationColors=true,browseMode='all',atlasTopic='all',landmarkUI;
try{explorationColors=localStorage.getItem('osteon-bone-colors')!=='off';}catch{}
const initialDetail=$('#detail-content').innerHTML,atlasCanvasLabel=$('#viewer').getAttribute('aria-label');
export function toast(s){$('#toast').textContent=s;$('#toast').hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('#toast').hidden=true,3500);}
export function dialog(html){$('#dialog-content').innerHTML=html;$('#info-dialog').showModal();}
$('#close-dialog').onclick=()=>$('#info-dialog').close();
$('#info-dialog').addEventListener('click',e=>{if(e.target===$('#info-dialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
const appViews=['atlas','study','practice','progress'];
let currentRoute,restoringRoute=false;
export function setView(view,{route,historyMode='push'}={}){if(!appViews.includes(view))view='atlas';route||=view;const from=currentRoute;currentRoute=route;$$('.view').forEach(e=>e.classList.toggle('active',e.id===view+'-view'));$$('[data-view]').forEach(e=>{e.classList.toggle('active',e.dataset.view===view);e.setAttribute('aria-current',e.dataset.view===view?'page':'false');});if(location.hash!=='#'+route){if(historyMode==='replace')history.replaceState(null,'','#'+route);else if(historyMode==='push'){if(restoringRoute)history.replaceState(history.state,'','#'+route);else history.pushState({osteonFrom:from},'','#'+route);}}if(view==='atlas'){
 viewer?.resize();
 if(!viewer.quiz)viewer.ensureTissues().catch(()=>{if(viewer.loaded)toast('Extra tissues could not load. Reopen the atlas or use Tissues to retry.');});
}document.dispatchEvent(new CustomEvent('viewchange',{detail:view}));window.scrollTo({top:0,behavior:'instant'});}
function showHistoryRoute(initial=false){
 const route=location.hash.slice(1)||'atlas';
 if(route===currentRoute&&!initial)return;
 const routeEvents={'exam3':'openexam3','exam3-exam':'resumeexam3','exam3-results':'exam3results','exam3-card':'exam3card','exam-center':'openexams','exam-session':'resumeexam','bone-list':'lablist','bone-list-session':'lablist','study':'studyhome','muscle-labeling':'openmusclelabeling','muscle-worksheet':'openmuscleworksheet','muscle-label-3d':'openmusclespatial','professor-muscle-review':'openprofessormusclereview','professor-muscle-session':'resumeprofessormusclereview','professor-muscle-results':'professormuscleresults'};
 const mockReportId=parseMockReportRoute(route);
 const lesson=route.startsWith('lesson-')?route.slice(7):null,reader=route.match(/^reader-(\d+)$/);
 restoringRoute=true;
 try{
  if(mockReportId)document.dispatchEvent(new CustomEvent('exam3results',{detail:{id:mockReportId}}));
  else if(Object.hasOwn(routeEvents,route))document.dispatchEvent(new Event(routeEvents[route]));
  else if(lesson&&isLessonId(lesson))document.dispatchEvent(new CustomEvent('openlesson',{detail:lesson}));
  else if(reader)document.dispatchEvent(new CustomEvent('openreaderpage',{detail:Number(reader[1])}));
  else if(['quick-practice','practice-results'].includes(route))setView('practice',{route,historyMode:'none'});
  else if(route==='practice')openPracticeHome(initial?'replace':'none');
  else if(appViews.includes(route))setView(route,{historyMode:initial?'replace':'none'});
  else if(initial)setView('atlas',{historyMode:'replace'});
 }finally{restoringRoute=false;}
}
window.addEventListener('popstate',()=>showHistoryRoute());
window.addEventListener('hashchange',()=>showHistoryRoute());
function openPracticeHome(historyMode='push'){
 if(document.body.dataset.precisionActive)precision.stop();
 setView('practice',{historyMode});
 document.dispatchEvent(new Event('practicehome'));
}
$$('[data-view]').forEach(b=>b.onclick=()=>{const view=b.dataset.view;if(view==='study')document.dispatchEvent(new Event('studyhome'));else if(view==='practice')openPracticeHome();else setView(view);const heading=$('#'+b.dataset.view+'-view h1');if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true});}});$('.brand').onclick=e=>{e.preventDefault();setView('atlas');};
let selectionEpoch=0;
export const viewer=new AnatomyViewer($('#viewer'),m=>{
 selectionEpoch++;
 if(document.dispatchEvent(new CustomEvent('bonepick',{detail:m,cancelable:true}))===false)return;
 viewer.selectMesh(m);const term=viewer.termFor(m)||{id:'extra',name:viewer.displayName(m),region:m.userData.region,cue:'Supplementary anatomical structure from the Z-Anatomy skeleton.',type:m.userData.nonbone?'tissue':'bone',exact:true,source:'Full specimen',aliases:[]};selected=term;detail(term,term.exact?viewer.displayName(m):null);renderList();updateButtons();
},()=>{const pendingSelection=selected;ready=true;$('#loading').hidden=true;$('#model-state').textContent=viewer.meshes.length+' objects · anatomy online';if(region!=='All regions')viewer.setRegion(region);if(pendingSelection)selectTerm(pendingSelection);renderList();updateButtons();document.dispatchEvent(new Event('anatomyready'));},err=>{$('#loading').innerHTML='<strong>3D viewer unavailable</strong><span>Your saved exams and lesson drafts remain available.</span><button type="button" data-model-retry>Retry model loading</button><button type="button" data-model-text>Continue with text study</button>';$('#model-state').textContent='Text study mode';console.error(err);});
attachViewerRecovery(viewer,{toast});
attachDrawerMotion(viewer);
const nervous=attachNervousLayer(viewer,{toast});
const lymphNodes=attachLymphNodeLayer(viewer,{toast});
viewer.skullColors=explorationColors;
export function selectTerm(t,{frame=true}={}){
 const request=++selectionEpoch;
 if(t.representation?.lymphNodeKey){
  lymphNodes.select(t,{frame,valid:()=>request===selectionEpoch}).then(ok=>{
   if(ok){selected=t;detail(t);renderList();updateButtons();}
  });
  return;
 }
 if(t.representation?.nerveKey){
  nervous.select(t,{frame,valid:()=>request===selectionEpoch}).then(ok=>{
   if(!ok)return;
   if(nervous.filter==='all')atlasTopic='all';
   selected=t;detail(t);renderList();updateButtons();
  });
  return;
 }
 if(t.representation?.ligamentKey){
  viewer.muscleLayer?.exitToSkeleton();
  enableLigaments(true).then(enabled=>{
   if(!enabled||request!==selectionEpoch||viewer.quiz||!$('#atlas-view').classList.contains('active'))return;
   viewer.selectLigament(t,{frame});selected=t;detail(t);renderList();updateButtons();
  });
  return;
 }
 const needsDetails=!t.exact||t.type!=='bone'||!!t.representation?.detailGroup||(ready&&!viewer.find(t).length);
 if(needsDetails&&!viewer.detailsLoaded&&!['diagram','reference','concept'].includes(t.representation?.kind)){
  if(!viewer.detailsRequest)toast('Loading detailed anatomy…');
  viewer.ensureDetails().then(()=>{if(request===selectionEpoch&&$('#atlas-view').classList.contains('active'))selectTerm(t,{frame});}).catch(()=>{if(request===selectionEpoch)toast('Detailed anatomy could not load. Select the entry to retry.');});
  return;
 }if(!inDivision(t,viewer.division)){dialog(`<h2>Switch skeleton division?</h2><p>${escape(t.name)} belongs to ${termDivision(t)==='General'?'general bone anatomy':termDivision(t)==='Mixed'?'both skeleton divisions': 'the '+termDivision(t).toLowerCase()+' skeleton'}. Your current filter is ${viewer.division.toLowerCase()}.</p><button class="primary" id="switch-division">Switch and focus</button>`);$('#switch-division').onclick=()=>{$('#info-dialog').close();changeDivision(['Mixed','General'].includes(termDivision(t))?'All':termDivision(t));selectTerm(t,{frame});};return;}if(region!=='All regions'&&region!==t.region)changeRegion(t.region);selected=t;if(ready){viewer.select(t,{frame:frame||t.representation?.autoFocus});selected=t;updateButtons();}detail(t);renderList();$('#specimen-region').textContent=t.region.toUpperCase();$('#specimen-name').textContent=t.name;document.dispatchEvent(new Event('structureselected'));}
function detail(t,meshName){if(t.representation?.lymphNodeKey){
 const n=lymphNodeByKey.get(t.representation.lymphNodeKey);
 landmarkUI?.hide();
 setLearningContext({type:'structure',label:t.name,termId:t.id,text:t.cue,reference:t.representation.reference});
 $('#detail-content').innerHTML=`<span class="detail-type">LYMPH NODES · ${escape(lymphRegions[n.bucket])}</span><h2>${escape(t.name)}</h2><p>${escape(t.cue)}</p><p class="tiny">${escape(lymphNodeStatus[n.status])}. Representative adult anatomy.</p><div class="detail-actions"><button type="button" id="detail-focus">Focus group</button><button type="button" id="detail-fade-bones" aria-pressed="${lymphNodes.fadesContext()}">${lymphNodes.fadesContext()?'Restore bones':'Fade bones'}</button><a href="${lymphNodeTextbook}" target="_blank" rel="noopener">OpenStax ↗</a><a href="lymph-node-coverage.html">Model coverage ↗</a></div>`;
 $('#detail-focus').onclick=()=>{document.dispatchEvent(new Event('showspecimen'));selectTerm(t);};
 $('#detail-fade-bones').onclick=()=>{$('#lymph-node-context').click();};
 $('#specimen-region').textContent=lymphRegions[n.bucket].toUpperCase();$('#specimen-name').textContent=t.name;
 document.dispatchEvent(new Event('structureselected'));return;
 }if(t.representation?.nerveKey){
 const n=nerveByKey.get(t.representation.nerveKey);
 landmarkUI?.hide();
 setLearningContext({type:'structure',label:t.name,termId:t.id,text:t.cue,reference:t.representation.reference});
 const url={'13.2':'13-2-the-central-nervous-system','13.4':'13-4-the-peripheral-nervous-system','15.1':'15-1-divisions-of-the-autonomic-nervous-system'}[t.representation.reference];
 $('#detail-content').innerHTML=`<span class="detail-type">${escape(t.type)}</span><h2>${escape(t.name)}</h2><p>${escape(t.cue)}</p><p class="tiny">${n.provider==='z-anatomy'?'Z-Anatomy source surface':'Leiden UMC Open3DModel surface'}${n.group?' · '+escape(n.group):''}</p><div class="detail-actions"><button type="button" id="detail-focus">Focus structure</button>${n.stops.length?'<button type="button" id="detail-trace">Follow nerve</button>':''}<a href="https://openstax.org/books/anatomy-and-physiology-2e/pages/${url}" target="_blank" rel="noopener">OpenStax ↗</a><a href="nerve-coverage.html">Coverage ↗</a></div>`;
 $('#detail-focus').onclick=()=>selectTerm(t);
 if($('#detail-trace'))$('#detail-trace').onclick=()=>{document.dispatchEvent(new Event('showspecimen'));nervous.routeStep(0);};
 $('#specimen-region').textContent=t.region.toUpperCase();$('#specimen-name').textContent=t.name;
 document.dispatchEvent(new Event('structureselected'));return;
 }if(t.representation?.ligamentKey){
 landmarkUI?.hide();
 setLearningContext({type:'structure',label:t.name,termId:t.id,text:t.cue,reference:t.representation.reference});
 $('#detail-content').innerHTML=`<span class="detail-type">3D ${escape(t.type.toUpperCase())}</span><h2>${escape(t.name)}</h2><p>${escape(t.cue)}</p><p class="tiny">${escape(t.representation.note)}</p><div class="detail-actions"><button type="button" id="detail-focus">Focus ligament</button><a href="ligament-coverage.html">Model coverage ↗</a></div>`;
 $('#detail-focus').onclick=()=>viewer.selectLigament(t);
 $('#specimen-region').textContent=t.region.toUpperCase();$('#specimen-name').textContent=t.name;
 document.dispatchEvent(new Event('structureselected'));return;
 }landmarkUI?.show(t);setLearningContext({type:'structure',label:t.name,termId:t.id,text:t.cue,reference:t.representation?.reference});const count=ready?viewer.find(t).length:0,r=t.representation||{kind:'mesh',reference:'7.2'};$('#detail-content').innerHTML=`<span class="detail-type">${(r.reviewStatus==='modeled-opening-verified'?'Blender bone reconstruction':r.reviewStatus==='route-schematic'?'Route schematic':labels[r.kind]).toUpperCase()}</span><h2>${escape(meshName||t.name)}</h2>${r.reviewNotice?`<p class="accuracy-note">${escape(r.reviewNotice)}</p>`:""}${r.memberIds?`<div class="detail-member-links">${r.memberIds.map(id=>allTerms.find(x=>x.id===id)).filter(Boolean).map(member=>`<button type="button" data-member-term="${member.id}">${escape(member.name)} ↗</button>`).join("")}</div>`:""}<p>${escape(t.feature?.description||t.cue)}</p>${t.feature?`<p class="tiny feature-parent">${escape(t.feature.parentBones.join(' · '))}<br>OpenStax ${escape(t.feature.section)} · ${escape(t.feature.featureType)}</p>`:''}<div class="field-meta"><div><small>REGION</small>${escape(t.region)}</div><div><small>SKELETON DIVISION</small>${escape(termDivision(t))}</div><div><small>STRUCTURE TYPE</small>${escape(t.type)}</div><div><small>COURSE CONNECTION</small>${escape(t.source)}</div></div>${r.kind==='source-pin'?'<p class="tiny">Source-placed anatomical reference pin. The parent bone provides context; the pin does not outline the complete landmark.</p>':''}${r.note?`<p class="tiny">${escape(r.note)}</p>`:''}${['diagram','reference'].includes(r.kind)||r.sourcePlate?'<button class="secondary" id="detail-source-view">Open textbook view ↗</button>':''}${r.kind==='concept'?'<p class="tiny">Use the movement exercise to connect direction with ligament restraint.</p>':''}<div class="detail-actions"><button id="detail-focus" ${count?'':'disabled'}>Focus specimen</button><button id="detail-card">Recall this</button><button class="primary" id="detail-practice" ${ready||['diagram','concept','reference'].includes(r.kind)?'':'disabled'}>${r.kind==='reference'||r.assessment==='learn-only'?'Recall feature':'Practice target'} ↗</button><button id="detail-read">Read source ↗</button></div>`;if($('#detail-source-view'))$('#detail-source-view').onclick=()=>document.dispatchEvent(new CustomEvent('landmarksource',{detail:t}));$('#detail-focus').onclick=()=>{landmarkUI?.hide();if(pointKinds.includes(r.kind))viewer.focusFeature(t);else{viewer.frame(viewer.selected);if(r.kind==='diagram'||r.kind==='reference')toast('3D parent-bone context. Use the textbook view to locate the precise feature.');}};$('#detail-card').onclick=()=>document.dispatchEvent(new CustomEvent('studyterm',{detail:t}));$('#detail-practice').onclick=()=>document.dispatchEvent(new CustomEvent(r.kind==='reference'||r.assessment==='learn-only'?'studyterm':'practicetarget',{detail:t}));$('#detail-read').onclick=()=>document.dispatchEvent(new CustomEvent(t.feature?'openreaderpage':'openreader',{detail:t.feature?(t.feature.sources.find(s=>s.kind?.includes('body'))||t.feature.sources[0]).pdf:r.reference}));$('#specimen-region').textContent=t.region.toUpperCase();$('#specimen-name').textContent=t.name;document.dispatchEvent(new Event('structureselected'));}
let ligamentLoad=null;
async function enableLigaments(on){
 if(!ready||viewer.quiz||viewer.activeDetail)return false;
 if(on&&!viewer.ligamentsLoaded){
  if(!ligamentLoad){
   ligamentLoad=viewer.ensureLigaments().then(()=>true).catch(error=>{console.error(error);toast('Ligaments could not load. Try the switch again.');return false;}).finally(()=>{ligamentLoad=null;});
   updateButtons();
  }
  if(!await ligamentLoad){updateButtons();return false;}
  if(viewer.quiz||viewer.activeDetail||!$('#atlas-view').classList.contains('active')){updateButtons();return false;}
 }
 const clear=selected?.representation?.ligamentKey;
 viewer.setLigamentOverlay(on);
 if(!on&&clear){selected=null;resetDetail();renderList();}
 updateButtons();return on;
}
function updateButtons(){$('#isolate-btn').disabled=!viewer.selected.length||viewer.activeDetail==='fetal-skull';$('#ghost-btn').disabled=!viewer.selected.length||viewer.activeDetail==='fetal-skull';$('#focus-btn').disabled=!viewer.selected.length;$('#isolate-btn').setAttribute('aria-pressed',viewer.isolated);$('#ghost-btn').setAttribute('aria-pressed',viewer.ghost);$('#tissues-btn').setAttribute('aria-pressed',!!viewer.tissues);
 for(const id of ['main-ligaments-toggle','ligaments-btn']){
  const button=document.getElementById(id);
  button.disabled=!ready||!!ligamentLoad||!!viewer.quiz||!!viewer.activeDetail;
  button.setAttribute('aria-pressed',String(!!viewer.ligaments&&!viewer.quiz));
  button.querySelector('span:last-child').textContent=ligamentLoad?'Loading…':'Ligaments: '+(viewer.ligaments&&!viewer.quiz?'On':'Off');
 }
 nervous.sync();syncFocusControls();}
function renderList(){const q=$('#structure-search').value.trim(),exactOnly=$('#exact-only').checked;const ligamentMode=browseMode==='ligaments',nerveMode=browseMode==='nerves',nodeMode=browseMode==='lymph-nodes';const nodeRecord=t=>lymphNodeByKey.get(t.representation?.lymphNodeKey);const eligible=nodeMode?lymphNodeTerms.filter(t=>!!q||lymphNodeInScope(nodeRecord(t),viewer)):nerveMode?nerveTerms.filter(t=>!!q||nerveInScope(nerveByKey.get(t.representation.nerveKey),viewer)):ligamentMode?ligamentTerms.filter(t=>!!q||ligamentInScope(ligamentByMesh.get(t.representation.ligamentKey),viewer)):allTerms.filter(t=>(browseMode!=='landmarks'||!viewer.loaded||viewer.focus.level!=='bone'||viewer.find(t).some(m=>boneId(m.userData.zname)===viewer.focus.boneId))&&(!!q||region==='All regions'||t.region===region||(ready&&viewer.focus.areaId&&viewer.find(t).some(m=>viewer.scopeContains(m))))&&(!exactOnly||(t.exact&&(!ready||viewer.find(t).length)))&&(browseMode==='all'||(browseMode==='bones'?t.type==='bone':(t.feature||['landmark','opening','suture','cavity','region','bone region','development'].includes(t.type)||['Manubrium','Body of sternum','Xiphoid process'].includes(t.name)))));
 if(q&&browseMode==='all')eligible.push(...lymphNodeTerms);
 const visible=eligible.filter(t=>nodeRecord(t)?viewer.division==='All'||nodeRecord(t).division===viewer.division:nerveMode?nerveInScope(nerveByKey.get(t.representation.nerveKey),{...viewer,region:'All regions',focus:{}}):ligamentMode?ligamentInDivision(t,viewer.division):inDivision(t,viewer.division));
 let list=q?atlasMatches(visible,q):visible;
 const otherDivision=!!q&&!list.length&&viewer.division!=='All'&&atlasMatches(eligible,q).length>0;
 const suggestions=q&&!list.length&&!otherDivision?atlasSuggestions(visible,q):[];
 const overview=!ligamentMode&&!nerveMode&&!nodeMode&&region==='All regions'&&!q;let topics=$('#atlas-browse-topic');if(!topics){topics=document.createElement('select');topics.id='atlas-browse-topic';topics.setAttribute('aria-label','Browse local anatomy group');$('#structure-list').before(topics);topics.onchange=ev=>{atlasTopic=ev.target.value;if(browseMode==='nerves')nervous.setFilter(Object.entries(nerveCategories).find(([,label])=>label===atlasTopic)?.[0]||'all');renderList();};}let joints=$('#atlas-joint-context');if(!joints){joints=document.createElement('select');joints.id='atlas-joint-context';joints.setAttribute('aria-label','Joint study context');joints.innerHTML='<option value="knee">Right knee</option><option value="shoulder">Right shoulder girdle</option><option value="thigh">Right hip and thigh</option><option value="neck">Cervical column</option>';topics.before(joints);joints.onchange=ev=>{selected=null;viewer.clearPins();viewer.selected=[];viewer.selectedTerm=null;viewer.isolated=false;viewer.ghost=false;viewer.cutaway=null;viewer.activeDetail=null;viewer.tissues=true;viewer.focus={level:'region',areaId:ev.target.value,side:ev.target.value==='neck'?null:'r',boneId:null};viewer.applyVisibility();viewer.frameScope();viewer.notifyFocus();};}joints.hidden=region!=='Joints';joints.disabled=!ready;if(region==='Joints'&&viewer.focus.areaId)joints.value=viewer.focus.areaId;
 const groupFor=nodeMode?t=>lymphRegions[nodeRecord(t).bucket]:nerveMode?t=>t.type:ligamentMode?t=>t.region:featureGroup;const groups=[...new Set(list.map(groupFor))].sort();topics.hidden=overview||!!q||groups.length<2;if(atlasTopic!=='all'&&!groups.includes(atlasTopic))atlasTopic='all';topics.innerHTML='<option value="all">All local groups</option>'+groups.map(g=>`<option value="${escape(g)}" ${atlasTopic===g?'selected':''}>${escape(g)}</option>`).join('');if(!q&&atlasTopic!=='all')list=list.filter(t=>groupFor(t)===atlasTopic);
 $('#structure-total').textContent=nodeMode?lymphNodeTerms.length+' LYMPH-NODE ENTRIES':nerveMode?nerveTerms.length+' NERVOUS SYSTEM ENTRIES':ligamentMode?ligamentTerms.length+' 3D SURFACES':textbookTerms.length+' TEXTBOOK FEATURES';$('#list-title').textContent=nodeMode?'Lymph-node groups':nerveMode?'Nervous system':ligamentMode?'Ligaments & supports':browseMode==='landmarks'?'Landmarks & features':browseMode==='bones'?'Bones':'Atlas entries';$('#list-count').textContent=list.length;$('#structure-list').innerHTML=overview?'<p class="tiny browse-intro">Choose a region, or search every entry above.</p><div class="atlas-region-tiles">'+regions.filter(r=>r!=='All regions'&&regionAvailable(r,viewer.division,allTerms)).map(r=>`<button type="button" data-browse-region="${r}">${escape(r)}<small>${allTerms.filter(t=>t.region===r&&inDivision(t,viewer.division)).length} entries</small></button>`).join('')+'</div>':list.map(t=>`<button class="structure-item ${t.exact?'':'context'} ${t.id===selected?.id?'active':''}" data-term="${escape(t.id)}"><span class="item-dot"></span><span>${escape(t.name)}<small>${escape(t.feature?.featureType||t.type)}${' · '+labels[t.representation?.kind||'mesh']}</small></span><span class="arrow">↗</span></button>`).join('')||`<div class="atlas-search-empty"><p>No matches${viewer.division==='All'?'':' in the '+escape(viewer.division.toLowerCase())+' division'}.</p>${otherDivision?'<button id="atlas-search-all">Search all divisions</button>':suggestions.length?'<p>Did you mean one of these?</p>'+suggestions.map(s=>`<button data-atlas-suggestion="${escape(s.label)}">${escape(s.term.name)}</button>`).join(''):'<p>Try a different name, or clear the search to browse by region.</p>'}</div>`;
 if($('#atlas-search-all'))$('#atlas-search-all').onclick=()=>{changeDivision('All');$('#structure-search').focus();};
 $$('[data-atlas-suggestion]').forEach(b=>b.onclick=()=>{$('#structure-search').value=b.dataset.atlasSuggestion;renderList();$('#structure-search').focus();});
 $$('[data-browse-region]').forEach(b=>b.onclick=()=>{changeRegion(b.dataset.browseRegion);document.dispatchEvent(new Event('showspecimen'));});$$('[data-term]').forEach(b=>b.onclick=()=>{const t=list.find(x=>x.id===b.dataset.term);selectTerm(t,{frame:!!q||!t.exact||t.type!=='bone'});});}
function explorerContext(){return{type:'atlas',label:region==='All regions'?(viewer.division==='All'?'The skeletal system':viewer.division+' skeleton'):region==='Joints'?'Shoulder, hip and knee joints':region+' anatomy',text:'Current division: '+viewer.division+'. Current region: '+region+'.'};}
function resetDetail(){
 landmarkUI?.hide();
 $('#detail-content').innerHTML=initialDetail;
 $('#specimen-region').textContent=region==='All regions'?(viewer.division==='All'?'FULL SKELETON':viewer.division.toUpperCase()+' SKELETON'):region.toUpperCase();
 $('#specimen-name').textContent='Explore the relationships.';
 setLearningContext(explorerContext());updateButtons();
}
function syncSkullControls(){
 const focused=viewer.focus.level!=='overview'&&!assessmentColors&&!viewer.activeDetail&&!viewer.referenceOpen;
 $('#skull-controls').hidden=!focused;$('#skull-key').hidden=!focused;
 const button=$('#skull-colors');button.disabled=assessmentColors;
 button.setAttribute('aria-pressed',String(viewer.skullColors));
 button.textContent='Colors: '+(viewer.skullColors?'On':'Off');
 button.setAttribute('aria-label','Bone colors: '+(viewer.skullColors?'On':'Off'));
 button.title='Turn regional bone colors '+(viewer.skullColors?'off':'on');
}
function syncFocusControls(){
 const blocked=assessmentColors||viewer.quiz;
 viewer.el.setAttribute('aria-label',blocked?'3D practice specimen. Drag to rotate. Pinch or scroll to zoom. Recenter view returns to the starting angle.':atlasCanvasLabel);
 const guidance=viewerGuidance({level:viewer.focus.level,touch:viewer.touchInput??matchMedia('(pointer:coarse)').matches,blocked,peel:viewer.peel});
 $('#exploration-bar').hidden=blocked;
 $('.specimen-stage').dataset.exploring=String(!blocked);
 const back=$('#focus-back'),backFocused=document.activeElement===back;back.hidden=blocked||!(viewer.referenceOpen||viewer.canGoBack());
 if(back.hidden&&!blocked&&backFocused)$('#focus-overview').focus({preventScroll:true});
 $('#focus-overview').disabled=!ready;
 const label=viewer.focusLabel(),focusedMesh=viewer.selected.find(m=>boneFamily(m.userData.zname)),bone=viewer.focus.level==='bone'&&focusedMesh?(viewer.focus.boneId==='Sternum'?'Sternum':viewer.displayName(focusedMesh)):'';
 const selectedLayer=!blocked&&(viewer.selectedTerm?.representation?.ligamentKey||viewer.selectedTerm?.representation?.nerveKey||viewer.selectedTerm?.representation?.lymphNodeKey)?viewer.selectedTerm.name:'';
 const location=[viewer.focus.level!=='overview'?label:viewer.division!=='All'?viewer.division+' skeleton':'',bone||selectedLayer].filter(Boolean).join(' › ');
 if(!viewer.muscleLayer?.ownsFocus()){
  const trail=$('#focus-trail'),trailText=location||guidance.intro;
  if(trail.textContent!==trailText)trail.textContent=trailText;
  trail.classList.toggle('focus-intro',!location);trail.title=location;
 }
 const hint=$('.viewer-hint');
 hint.textContent=viewer.activeDetail==='fetal-skull'?'Rotate the scan · switch site views · compare the newborn illustration':selectedLayer&&!viewer.peel?selectedLayer:lymphNodes.active&&!viewer.peel?'Select a green group · or use Browse → Lymph nodes':guidance.hint;
 $$('#desktop-region,#desktop-division,#structure-search').forEach(e=>e.disabled=blocked);
 $('#exact-only').disabled=blocked||['landmarks','ligaments','nerves','lymph-nodes'].includes(browseMode);
 const isBone=!!viewer.selected[0]&&!!boneFamily(viewer.selected[0].userData.zname);
 const next=$('#focus-next');next.hidden=blocked||viewer.referenceOpen||!!selectedLayer||!guidance.action;next.disabled=!isBone||!ready;next.textContent=guidance.action;next.onclick=()=>viewer.navigateBone(viewer.selected[0]);
 $('#focus-btn').setAttribute('aria-label',blocked?'Focus selected target':isBone?'Explore selected bone’s region':'Focus selected structure');
 $('#focus-btn').title=$('#focus-btn').getAttribute('aria-label');
 $('#focus-btn').querySelector('span').textContent=blocked?'Focus':'Region';
 $('#isolate-btn').setAttribute('aria-label',blocked?'Isolate selected target':viewer.focus.level==='bone'?'Return to region':'Focus selected bone alone');
 $('#isolate-btn').title=$('#isolate-btn').getAttribute('aria-label');
 $('#isolate-btn').querySelector('span').textContent=blocked?'Isolate':'Bone';
 syncSkullControls();
 viewer.muscleLayer?.syncControls();
}
document.addEventListener('atlasfocuschange',()=>{
 if(!ready||assessmentColors||viewer.quiz){syncFocusControls();return;}
 region=viewer.region;selected=viewer.selectedTerm||null;
 if(selected)detail(selected,selected.exact&&viewer.selected.length===1?viewer.displayName(viewer.selected[0]):null);else resetDetail();
 syncFilters();renderList();updateButtons();$('#rotate-btn').setAttribute('aria-pressed','false');
});
$('#focus-back').onclick=()=>{
 if(viewer.referenceOpen){landmarkUI.hide();viewer.landmarkOverlay?.refresh();syncFocusControls();return;}
 viewer.back();
};
$('#focus-overview').onclick=()=>{
 if(!ready||assessmentColors||viewer.quiz)return;
 selectionEpoch++;
 atlasTopic='all';
 viewer.muscleLayer?.exitToSkeleton();
 viewer.reset({division:'All'});
 document.dispatchEvent(new Event('specimenreset'));
};
document.addEventListener('viewerinputchange',syncFocusControls);
function syncFilters(){
 syncSkullControls();
 $$('[data-division]').forEach(b=>{b.disabled=assessmentColors;b.classList.toggle('active',b.dataset.division===viewer.division);b.setAttribute('aria-pressed',b.dataset.division===viewer.division);});
 $$('[data-region]').forEach(b=>{b.disabled=assessmentColors||!regionAvailable(b.dataset.region,viewer.division,allTerms);b.classList.toggle('active',b.dataset.region===region);b.setAttribute('aria-pressed',b.dataset.region===region);});
}
function changeRegion(r){selectionEpoch++;if(!regions.includes(r)||!regionAvailable(r,viewer.division,allTerms))return;region=r;atlasTopic='all';selected=null;if(ready)viewer.setRegion(r);syncFilters();resetDetail();renderList();if(ready&&r==='Bone structure')selectTerm(allTerms.find(t=>t.name==='Diaphysis'));if(ready&&r==='Joints'){viewer.focus={level:'region',areaId:'knee',side:'r',boneId:null};viewer.applyVisibility();viewer.frameScope();viewer.notifyFocus();}}
function changeDivision(d){selectionEpoch++;if(!divisions.includes(d))return;region='All regions';selected=null;viewer.region=region;if(ready)viewer.setDivision(d);else viewer.division=d;syncFilters();resetDetail();renderList();document.dispatchEvent(new Event('divisionchange'));}

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
document.addEventListener('studyregion',ev=>{if(!regions.includes(ev.detail))return;setView('atlas');changeDivision('All');changeRegion(ev.detail);});
$('#region-filters').innerHTML=regions.map(r=>`<button data-region="${r}" class="${r===region?'active':''}" aria-pressed="${r===region}">${r}</button>`).join('');
$$('[data-region]').forEach(b=>b.onclick=()=>changeRegion(b.dataset.region));
syncFilters();
$('#structure-search').oninput=renderList;$('#exact-only').onchange=renderList;
$$('[data-browse-mode]').forEach(b=>b.onclick=()=>{browseMode=b.dataset.browseMode;atlasTopic='all';$('#structure-search').placeholder=browseMode==='nerves'?'Search nerves, e.g. CN VII':browseMode==='ligaments'?'Search ligaments':browseMode==='lymph-nodes'?'Search lymph nodes':'Search bones, landmarks & nodes';$('#structure-search').setAttribute('aria-label',$('#structure-search').placeholder);if(browseMode==='ligaments')enableLigaments(true);if(browseMode==='lymph-nodes'&&!lymphNodes.loading)lymphNodes.toggle(true);if(browseMode==='nerves'){nervous.setFilter('all');nervous.toggle(true);}$$('[data-browse-mode]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));if(browseMode==='landmarks')$('#exact-only').checked=false;$('#exact-only').disabled=['landmarks','ligaments','nerves','lymph-nodes'].includes(browseMode);renderList();});
document.addEventListener('keydown',e=>{if(e.key==='/'&&!$('#tutor-panel')?.open&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)&&!$('#info-dialog').open){e.preventDefault();setView('atlas');$(viewer.muscleLayer?.state.enabled?'#muscle-search':'#structure-search').focus();}});
$$('[data-camera]').forEach(b=>b.onclick=()=>{
 if(!ready)return;
 if(b.dataset.camera==='reset')viewer.recenter();
 else viewer.view(b.dataset.camera);
 $('#rotate-btn').setAttribute('aria-pressed','false');
});
$('#rotate-btn').onclick=()=>{if(!viewer.controls)return;viewer.controls.autoRotate=!viewer.controls.autoRotate;$('#rotate-btn').setAttribute('aria-pressed',viewer.controls.autoRotate);};
$('#isolate-btn').onclick=()=>{if(viewer.muscleLayer?.ownsFocus()){viewer.muscleLayer.toggleIsolation();return;}if(viewer.quiz||!boneFamily(viewer.selected[0]?.userData.zname||''))viewer.isolate();else if(viewer.focus.level==='bone')viewer.back();else viewer.focusBone();updateButtons();};$('#ghost-btn').onclick=()=>{viewer.xray();updateButtons();};$('#focus-btn').onclick=()=>{if(viewer.muscleLayer?.ownsFocus()){viewer.muscleLayer.showRegion();return;}if(viewer.quiz||!boneFamily(viewer.selected[0]?.userData.zname||'')){if(pointKinds.includes(viewer.selectedTerm?.representation?.kind))viewer.focusFeature();else if(viewer.selectedTerm?.representation?.nerveKey)nervous.frame();else if(viewer.selectedTerm?.representation?.lymphNodeKey)lymphNodes.frame();else viewer.frame(viewer.selected);}else viewer.exploreBoneRegion();};
for(const id of ['main-ligaments-toggle','ligaments-btn'])document.getElementById(id).onclick=()=>enableLigaments(!viewer.ligaments);
for(const id of ['main-nerves-toggle','nerves-btn'])document.getElementById(id).onclick=async()=>{
 const clear=selected?.representation?.nerveKey;
 const on=await nervous.toggle(!nervous.enabled);
 if(!on&&clear&&!viewer.selectedTerm){selected=null;resetDetail();renderList();}
};
$('#nerve-context-btn').onclick=()=>nervous.toggleContext();
for(const id of ['main-lymph-nodes-toggle','lymph-nodes-btn'])document.getElementById(id).onclick=async()=>{
 const turningOff=lymphNodes.enabled||lymphNodes.loading;
 if(turningOff)selectionEpoch++;
 const on=await lymphNodes.toggle(!turningOff);
 if(!on&&selected?.representation?.lymphNodeKey&&!viewer.selectedTerm){selected=null;resetDetail();renderList();}
 updateButtons();
};
$('#lymph-node-context').onclick=()=>{
 lymphNodes.toggleContext();
 const button=$('#detail-fade-bones');
 if(button){button.setAttribute('aria-pressed',String(lymphNodes.fadesContext()));button.textContent=lymphNodes.fadesContext()?'Restore bones':'Fade bones';}
};
$('#peel-btn').onclick=()=>{viewer.peel=!viewer.peel;document.dispatchEvent(new Event('layerschanged'));toast(viewer.peel?'Peel is on. Tap or click a surface to hide it. Use Undo peel to bring it back.':'Peel is off: click to select or answer.');};
$('#undo-peel-btn').onclick=()=>viewer.undoPeel();
$('#restore-btn').onclick=()=>viewer.restore();
$('#discs-btn').onclick=()=>{viewer.discs=!viewer.discs;viewer.applyVisibility();};
$('#tissues-btn').onclick=()=>{if(!viewer.loaded)return;viewer.ensureTissues().catch(()=>toast('Extra tissues could not load. Select Tissues to retry.'));viewer.tissues=!viewer.tissues;viewer.applyVisibility();$('#tissues-btn').setAttribute('aria-pressed',viewer.tissues);};
document.addEventListener('viewchange',()=>nervous.refresh());
document.addEventListener('layerschanged',()=>{viewer.syncLayerControls();updateButtons();$('#peel-btn').setAttribute('aria-pressed',viewer.peel);syncFocusControls();});
function credits(){dialog(`<h2>A study space<br><em>with real foundations.</em></h2><p>Double-click a bone to explore its region, then double-click again to focus that bone alone. Use Back to return one step, Full skeleton to see the whole body, or Recenter view to reset the camera within your current view. The Region and Bone buttons provide ways to zoom in without a gesture. Regional bone colors have a persistent On / Off control and an optional key; skeleton overviews stay neutral.</p><p>Drag to orbit, scroll to zoom and use right-drag to pan. Enable Peel to click away covering surfaces, then disable it to select a deeper structure. Use Undo peel to bring back one surface at a time, or Restore all to bring them all back. Shift-click is a peeling shortcut. On touch, use one finger to rotate and two fingers to zoom or pan. Anatomical left and right always refer to the specimen. Use the searchable structure list for keyboard access.</p><p>The specimen comes from <a href="https://github.com/Z-Anatomy/Models-of-human-anatomy" target="_blank" rel="noreferrer">Z-Anatomy</a> (CC BY-SA 4.0), derived from BodyParts3D © The Database Center for Life Science (CC BY-SA 2.1 Japan). Web export: <a href="https://github.com/SeemaBansal1/3d-human-body-anatomy" target="_blank" rel="noreferrer">3d-human-body-anatomy</a>. The adult skeleton and 81 additional course tissue objects include bones, cartilage, teeth, ligaments, discs and vertebral arteries. Landmark references combine original validated Z-Anatomy annotations with manually curated surface and opening references. Magnified long-bone, flat-bone and osteon teaching reconstructions are separate from the adult specimen. The previous newborn calvarial and round-window models have been withdrawn; use the labeled textbook comparison and optional UCSF fetal-skull scan. Additional source geometry reveals the bony labyrinth and ligament-bounded spaces. Pins mark reference locations rather than complete surface boundaries.</p><p>Learning content is adapted from OpenStax Anatomy and Physiology 2e, © 2026 Rice University, CC BY-NC-SA 4.0. Access for free at <a href="https://openstax.org/details/books/anatomy-and-physiology-2e" target="_blank" rel="noreferrer">openstax.org</a>. Lab scope follows the supplied BI 231 Fall 2024 list.</p><p>Progress stays in this browser. Export a backup before changing devices or clearing browser data. The tool is an independent study companion.</p><p><a href="accuracy.html" target="_blank">Landmark accuracy review ↗</a> · <a href="CREDITS.md" target="_blank">Complete credits and licenses ↗</a> · <a href="PLAN.md" target="_blank">Education and design plan ↗</a> · <a href="TUTOR.md" target="_blank">Local tutor setup guide ↗</a></p>`);}
$('#help-btn').onclick=credits;$('#credits-btn').onclick=credits;
$('#coverage-btn').onclick=()=>{const c=coverage();dialog(`<h2>Every course item.<br><em>A suitable target.</em></h2><div class="score-row">${Object.entries(c).map(([k,n])=>`<div class="stat"><strong>${n}</strong><span>${labels[k]}</span></div>`).join('')}</div><p><button id="coverage-landmarks" class="primary">Open 310-feature textbook bank ↗</button> · <a href="LANDMARKS.md" target="_blank">Expanded feature coverage ↗</a></p><p>All 177 original course IDs are preserved. Supported anatomy uses locating and identification exercises. Unresolved anatomy uses source study and recall while spatial scoring is withheld. Native geometry, source annotations and explanatory teaching models are distinguished in the <a href="accuracy.html" target="_blank">landmark accuracy review ↗</a>. Drawer tests use movement and ligament reasoning. Pins are reference points, not full surface segmentations. Adult geometry is never used to represent infant fontanelles.</p><table><thead><tr><th>Region</th><th>Course items</th><th>Represented</th></tr></thead><tbody>${regions.slice(1).map(r=>`<tr><td>${r}</td><td>${terms.filter(t=>t.region===r).length}</td><td>${terms.filter(t=>t.region===r&&t.representation).length}</td></tr>`).join('')}</tbody></table><p><a href="COVERAGE.csv" download>Download the item-by-item audit ↓</a> · <a href="PLAN.md" target="_blank">Learning and design plan ↗</a></p>`);$('#coverage-landmarks').onclick=()=>{$('#info-dialog').close();document.dispatchEvent(new Event('landmarkbank'));};};
renderList();
initPractice({viewer,setDivision:changeDivision,setView,selectTerm,dialog,toast,escape});

initStudy({viewer,setView,selectTerm,dialog,toast,escape});
const precision=initPrecision({viewer,setDivision:changeDivision,setView,dialog,toast,escape});
const labList=initLabList({viewer,setView,selectTerm,precision,toast,dialog,escape});
initExams({setView,dialog,toast,viewer,escape});
initMockExam3({setView,dialog,toast,escape});
initReader({setView,escape});
initIssueReporter({dialog,escape});
initTutor({escape,toast});
attachFetalSpecimen({viewer,toast});
landmarkUI=initLandmarks({viewer,selectTerm,setView,dialog,escape});
document.addEventListener('landmarksource',syncFocusControls);
document.addEventListener('anatomyassetsready',()=>{$('#model-state').textContent=viewer.meshes.length+' objects · anatomy online';});
document.addEventListener('viewchange',()=>{selectionEpoch++;lymphNodes.refresh();});
document.addEventListener('landmarkcontext',ev=>{if(ready)selectTerm(ev.detail);});
initWorkspace();
initViewerRoom({viewer,toast});
initAtlasLandmarks({viewer,selectTerm,escape,toast});
document.addEventListener('lymphnodefocus',ev=>selectTerm(ev.detail));
document.addEventListener('landmarkpick',ev=>{if(!document.body.dataset.precisionActive)selectTerm(ev.detail);});
document.addEventListener('viewchange',ev=>{if(ev.detail==='atlas'&&!document.body.classList.contains('quiz-active')){if(ready&&viewer.region!==region)viewer.setRegion(region);if(selected){if(viewer.selectedTerm?.id!==selected.id)selectTerm(selected);else detail(selected);}else resetDetail();syncFilters();}});

const muscleAtlas=initMuscleAtlas({viewer,escape,toast,dialog,onExit:()=>{region=viewer.region;selected=viewer.selectedTerm;$$('[data-browse-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.browseMode===browseMode)));syncFilters();if(selected)detail(selected);else resetDetail();renderList();updateButtons();}});
initMuscleLabeling({viewer,setView,dialog,toast,escape});
showHistoryRoute(true);
if(new URLSearchParams(location.search).get('lablist')==='1'&&['#atlas','#practice'].includes(location.hash))labList.home();
initClarityPractical({viewer,setView});
const requestedFeature=new URLSearchParams(location.search).get('feature');
if(requestedFeature){const term=allTerms.find(t=>t.id===requestedFeature||t.feature?.id===requestedFeature);if(term)selectTerm(term);}
const requestedNerve=new URLSearchParams(location.search).get('nerve');
const linkedNerve=nerveTerms.find(t=>t.representation.nerveKey===requestedNerve);
if(linkedNerve&&$('#atlas-view').classList.contains('active')){
 if(ready)selectTerm(linkedNerve);
 else document.addEventListener('anatomyready',()=>selectTerm(linkedNerve),{once:true});
}
const requestedNode=new URLSearchParams(location.search).get('lymph-node');
const linkedNode=lymphNodeTerms.find(t=>t.representation.lymphNodeKey===requestedNode);
if(linkedNode&&$('#atlas-view').classList.contains('active')){
 if(ready)selectTerm(linkedNode);
 else document.addEventListener('anatomyready',()=>selectTerm(linkedNode),{once:true});
}
document.addEventListener('click',event=>{const id=event.target.closest('[data-member-term]')?.dataset.memberTerm;if(id){const term=allTerms.find(t=>t.id===id);if(term)selectTerm(term);}});

export {muscleAtlas};

if(new URLSearchParams(location.search).get('muscles')==='1')document.addEventListener('anatomyready',()=>muscleAtlas.openRegion(new URLSearchParams(location.search).get('muscleRegion')||null),{once:true});
