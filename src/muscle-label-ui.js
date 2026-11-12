import {muscleRegions} from './muscle-data.js';
import {mountMuscleWorksheet} from './muscle-worksheet.js';
import {muscleWorksheetTargets} from './muscle-worksheet-data.js';
import {courseMuscleTargets} from './muscle-spatial-data.js';
import {chapter11Muscles} from './chapter11-muscles.js';
import {dueMuscleLabels,recordMuscleLabel} from './muscle-label-progress.js';
import {setLearningContext,setTutorAssessmentMode} from './learning-context.js';

export const worksheetTermIds=new Map(Object.entries(muscleWorksheetTargets).map(([id,target])=>[id,target.termId]));
export const worksheetSourcesByTerm=new Map(
 Object.values(muscleWorksheetTargets).filter(target=>target.termId).reverse().map(target=>[target.termId,target.source]),
);

export function initMuscleLabeling({viewer,setView,dialog,toast,escape:e}){
 const root=document.getElementById('practice-view');
 let disposeWorksheet=null,spatialReturn='hub';
 const goBack=destination=>destination==='progress'?setView('progress'):hub();

 function hub(){
  setView('practice',{route:'muscle-labeling'});
  setTutorAssessmentMode(null);
  setLearningContext({type:'study',label:'Muscle labeling',reference:'11.1'});
  const worksheetDue=dueMuscleLabels('worksheet').length,spatialDue=dueMuscleLabels('spatial').length;
  const diagramEntries=courseMuscleTargets.filter(target=>worksheetSourcesByTerm.has(target.id)).length;
  const spatialEntries=courseMuscleTargets.filter(target=>target.spatialEligible).length;
  root.innerHTML=`<div class="section-intro"><div><div class="eyebrow">BI 231 / MUSCLE CHECKLIST</div><h1>Muscle labeling</h1><p>Identify muscles in course diagrams or on the 3D specimen.</p></div><button id="muscle-labeling-back">Practice Lab</button></div>
   <div class="muscle-labeling-layout">
    <article class="learning-panel"><h2>Worksheet and figures</h2><p>Type a marked structure’s name or tap its location. Reviewed diagrams cover ${diagramEntries} checklist entries. Open your original worksheet from this device.</p><div class="control-row"><button class="primary" id="muscle-labeling-worksheet">Open diagrams</button>${worksheetDue?`<button id="muscle-labeling-worksheet-due">Review ${worksheetDue} due</button>`:''}</div></article>
    <article class="learning-panel"><h2>3D muscle practice</h2><p>Rotate the specimen and identify a highlighted muscle or locate one by name. ${spatialEntries} checklist entries have scored 3D targets.</p><div class="control-row"><button class="primary" id="muscle-labeling-spatial">Choose a 3D exercise</button>${spatialDue?`<button id="muscle-labeling-spatial-due">Review ${spatialDue} due</button>`:''}</div></article>
    <article class="learning-panel"><h2>Full course checklist</h2><p>Practice the location, action, and general attachments of all ${courseMuscleTargets.length} BI 231 entries.</p><button id="muscle-labeling-all">Open the course checklist</button></article>
   </div>`;
  root.querySelector('#muscle-labeling-back').onclick=()=>setView('practice');
  root.querySelector('#muscle-labeling-worksheet').onclick=()=>worksheet();
  root.querySelector('#muscle-labeling-spatial').onclick=spatialSetup;
  root.querySelector('#muscle-labeling-all').onclick=()=>document.dispatchEvent(new Event('openmusclechecklist'));
  root.querySelector('#muscle-labeling-worksheet-due')?.addEventListener('click',()=>worksheet({due:true}));
  root.querySelector('#muscle-labeling-spatial-due')?.addEventListener('click',()=>openSpatial({due:true}));
 }

 function worksheet(options={}){
  disposeWorksheet?.();
  setView('practice',{route:'muscle-worksheet'});
  root.innerHTML='<div class="muscle-worksheet-shell"></div>';
  const due=options.due?dueMuscleLabels('worksheet')[0]:null;
  const courseCard=chapter11Muscles.find(card=>card.id===options.termId);
  const memberIds=Array.isArray(courseCard?.members)?chapter11Muscles.filter(card=>courseCard.members.includes(card.name)).map(card=>card.id):[];
  const related=[courseCard?.id,...memberIds].filter(Boolean);
  const termTarget=Object.entries(muscleWorksheetTargets).find(([,target])=>related.includes(target.termId))?.[0];
  disposeWorksheet=mountMuscleWorksheet(root.firstElementChild,{
   initialPanel:options.initialPanel,initialTarget:options.initialTarget||due?.targetId||termTarget,
   initialMode:options.initialMode||due?.mode,onBack:()=>goBack(options.from),
   onResult:attempt=>recordMuscleLabel('worksheet',{...attempt,lesson:muscleWorksheetTargets[attempt.targetId]?.section}),getDue:()=>dueMuscleLabels('worksheet'),
  });
 }

 function spatialSetup(){
  dialog(`<h2>3D muscle practice</h2><div class="control-row">
   <label for="muscle-spatial-mode">Exercise</label><select id="muscle-spatial-mode"><option value="name">Name the highlighted muscle</option><option value="find">Find the named muscle</option></select>
   <label for="muscle-spatial-region">Region</label><select id="muscle-spatial-region"><option value="">All available regions</option>${Object.entries(muscleRegions).map(([id,name])=>`<option value="${id}">${e(name)}</option>`).join('')}</select></div>
   <button class="primary" id="muscle-spatial-start">Start 3D practice</button>`);
  document.getElementById('muscle-spatial-start').onclick=()=>{
   const mode=document.getElementById('muscle-spatial-mode').value;
   const region=document.getElementById('muscle-spatial-region').value;
   document.getElementById('info-dialog').close();
   openSpatial({mode,region});
  };
 }

 async function openSpatial(options={}){
  const due=options.due?dueMuscleLabels('spatial'):[],first=due[0];
  const targetIds=first?due.filter(item=>item.mode===first.mode).map(item=>item.targetId):options.termId?[options.termId]:undefined;
  spatialReturn=options.from||'hub';
  setView('atlas',{route:'muscle-label-3d'});
  try{
   await viewer.muscleLayer.openCoursePractice({
    mode:options.mode||first?.mode,region:options.region||undefined,
    termId:options.termId||first?.targetId,targetIds
   });
  }catch{
   if(location.hash==='#muscle-label-3d'){
    toast('The 3D exercise could not load. You can retry or use the diagrams.');
    goBack(spatialReturn);
   }
  }
 }

 document.addEventListener('openmusclelabeling',hub);
 document.addEventListener('openmuscleworksheet',event=>worksheet(event.detail));
 document.addEventListener('openmusclespatial',event=>openSpatial(event.detail));
 document.addEventListener('closemusclespatial',()=>goBack(spatialReturn));
 document.addEventListener('musclespatialattempt',event=>{
  const attempt=event.detail;
  recordMuscleLabel('spatial',{...attempt,lesson:chapter11Muscles.find(card=>card.id===attempt?.termId)?.section});
 });
 document.addEventListener('viewchange',()=>{
  if(location.hash!=='#muscle-worksheet'&&disposeWorksheet){
   disposeWorksheet();disposeWorksheet=null;
  }
 });
}
