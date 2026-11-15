import {createPoseUI} from './motion-pose-ui.js';
import {PoseViewer} from './motion-pose-viewer.js';
import {PoseHistory,combinedPoseRoles,poseRoles} from './motion-pose-core.js';
import {poseMotionScope,poseScopeMatches} from './motion-pose-ik.js';
import {describePoseAxis,poseMotionCycle} from './motion-pose-motions.js';
import {createPosePreview,samplePosePreview} from './motion-pose-playback.js';
import {setLearningContext} from './learning-context.js';
import {findMotionStudyGuide} from './motion-study-guides.js';

const savedKey='osteon-whole-body-pose-v1';

export function initPoseLab(host,{onLesson}={}){
 let active=false,revision=0,specimen=null,history=null,descriptors=[],selectedJoint=null,selectedAxis=null;
 let scope='all',interaction='joint',selectedMuscle=null,showMuscles=true,onlyRelated=false,message='',saveTimer=null,lastContext='';
 let playback=null,playbackStarted=0,studyGuide=null,guidedDirection=0,guideRouteRead=false;
 const descriptor=()=>descriptors.find(joint=>joint.id===selectedJoint);
 const ui=createPoseUI(host,{
  selectJoint,selectAxis:id=>{stopGesture();studyGuide=null;selectedAxis=id;history?.clearChanges();message='';draw();},
  changeAngle:(value,{phase})=>{
   if(!history)return;
   if(phase==='start'){stopGesture();history.begin();}
   if(phase==='input'){setAngle(selectedJoint,selectedAxis,value);draw();}
   if(phase==='end')endGesture();
   if(phase==='cancel'){history.cancel();draw();}
  },
  stepAngle:step,
  togglePlayback,
  neutralJoint:()=>{if(!history)return;stopGesture();guidedDirection=0;history.reset(selectedJoint);message='Unlocked movements at this joint returned to neutral. Other joints keep their pose.';draw();save();},
  undo:()=>{if(!history)return;stopGesture();guidedDirection=0;history.undo();message='Last pose change undone.';draw();save();},
  redo:()=>{if(!history)return;stopGesture();guidedDirection=0;history.redo();message='Pose change restored.';draw();save();},
  reset:()=>{
   if(!history)return;
   stopGesture();guidedDirection=0;history.begin();
   for(const id of history.locks)history.setLocked(id,false);
   history.reset();history.commit();history.clearChanges();
   message='Starting pose restored. Undo brings your pose back.';draw();save();
  },
  setLock:locked=>{if(!history)return;stopGesture();history.setLocked(selectedJoint,locked);message=locked?'Joint angles locked. The limb still follows its parent joint.':'Joint angles unlocked.';draw();save();},
  setScope:changeScope,focus:()=>{stopGesture();viewer.focusJoint(studyGuide?.view,studyGuide?.radius);},
  camera:view=>{stopGesture();if(studyGuide&&!studyGuide.fullFrame)viewer.focusJoint(view,studyGuide.radius);else viewer.frame(view);},
  zoom:direction=>viewer.zoom(direction),
  setMuscles:show=>{showMuscles=show;draw();},selectMuscle,
  setRelated:show=>{onlyRelated=show;draw();},
  setInteraction:mode=>{
   stopGesture();
   if(mode==='endpoint'){
    const endpoint=viewer.endpointChain(selectedJoint);
    if(endpoint)selectJoint(endpoint.id,{pointer:true});
   }
   interaction=mode;message=mode==='endpoint'?'Drag the wrist or ankle target to move its linked joints.':'Drag the ring to adjust one movement.';draw();
  },
  markerPointerDown:(event,id)=>viewer.startPoseDrag(event,id),
  selectGuide:chooseGuide,
  openLesson:id=>onLesson?.(id),
  notesChange:()=>{viewer.dirty=true;},
 });
 const viewer=new PoseViewer(ui.stage,{
  selectJoint,selectMuscle,stepAngle:step,
  frame:previewFrame,
  markers:markers=>ui.setMarkers(markers),begin:()=>{stopPlayback();history?.begin();},
  angle:(value,joint,axis)=>{if(setAngle(joint||selectedJoint,axis||selectedAxis,value))draw();},
  patch:values=>{history?.patch(values);draw();},
  finish:cancel=>{if(!history)return;if(cancel){history.cancel();message='Adjustment cancelled.';}else history.commit({preserveDirection:true});draw();save();},
  message:text=>{message=text;updateUI();},
 });
 function endGesture(){if(history?.inTransaction){history.commit({preserveDirection:true});draw();save();}}
 function stopGesture(){stopPlayback();viewer.cancelPoseDrag();endGesture();}
 function stopPlayback({restore=false}={}){
  if(!playback)return;
  playback=null;
  if(restore){history.cancel();history.clearChanges();guidedDirection=0;}
  else history.commit({preserveDirection:true});
  save();
 }
 function togglePlayback(){
  if(!history)return;
  if(playback){stopPlayback();message='Preview paused. Keep adjusting, or Undo to return to your earlier pose.';draw();return;}
  stopGesture();
  if(history.isAxisLocked(selectedJoint,selectedAxis))return;
  const joint=descriptor(),cycle=poseMotionCycle(joint,selectedAxis);
  if(!cycle)return;
  if(studyGuide?.setup&&Object.entries(studyGuide.setup).some(([id,axes])=>Object.keys(axes).some(axis=>history.isAxisLocked(id,axis)))){
   message='Unlock the joints used by this comparison to play it.';draw();return;
  }
  history.begin();
  if(studyGuide?.setup)history.patch(studyGuide.setup);
  if(studyGuide?.range){
   const axis=joint.axes.find(axis=>axis.id===selectedAxis);
   [cycle.from,cycle.to]=studyGuide.range.map(value=>Math.max(axis.min,Math.min(axis.max,value)));
  }
  playback=createPosePreview(history.values,selectedJoint,selectedAxis,cycle);
  if(!playback){history.cancel();return;}
  guidedDirection=0;playbackStarted=performance.now();interaction='joint';
  message='Playing one gentle cycle. Pause keeps the pose; a complete cycle returns to your starting pose.';
  draw();
 }
 function previewFrame(){
  if(!playback||!active)return;
  // Follow elapsed time, not the base viewer's capped physics step. A slower
  // phone still plays one eight-second cycle rather than stretching it out.
  const sample=samplePosePreview(playback,(performance.now()-playbackStarted)/1000);
  if(sample.done){stopPlayback({restore:true});message='Preview finished. Your starting pose is restored.';draw();return;}
  if(studyGuide)guidedDirection=sample.direction;
  if(history.patch(sample.patch))draw();
 }
 function setAngle(joint,axis,value){
  if(!history)return false;
  guidedDirection=0;
  if(joint==='breathing'&&value>0)return history.patch({breathing:{[axis]:value,[axis==='inhale'?'exhale':'inhale']:0}});
  return history.set(joint,axis,value);
 }
 function step(delta){
  if(!history)return;
  stopGesture();
  setAngle(selectedJoint,selectedAxis,history.values[selectedJoint][selectedAxis]+delta);
  message='';draw();save();
 }
 function selectJoint(id,{pointer=false}={}){
  const joint=descriptors.find(item=>item.id===id);
  if(!joint||id===selectedJoint)return;
  stopGesture();
  studyGuide=null;
  selectedJoint=id;selectedAxis=joint.axes[0].id;selectedMuscle=null;
  history?.clearChanges();
  if(!viewer.endpointChain(id))interaction='joint';
  if(scope!=='all'&&!poseScopeMatches(scope,joint)){scope='all';viewer.setScope(scope);}
  message=joint.note||'';
  const detail=!pointer&&/thumb|index|middle|ring|little|toe|hallux|subtalar|upper-nod|face-/.test(id);
  if(detail){scope=joint.region;viewer.setScope(scope);message='Detail view. Full body returns to your complete pose.';}
  draw();save();
  if(detail)viewer.focusJoint();
  if(!pointer&&matchMedia('(max-width:760px) and (orientation:portrait)').matches)ui.closeNotes();
 }
 function selectMuscle(key){
  if(!specimen)return;
  stopGesture();
  const part=specimen.parts.find(part=>part.key===key);
  if(!part)return;
  selectedMuscle=selectedMuscle===key?null:key;
  if(selectedMuscle)message=part.name+' · '+part.side;
  draw();
  if(matchMedia('(max-width:760px) and (orientation:portrait)').matches)ui.closeNotes();
 }
 function changeScope(next){
  if(!history)return;
  stopGesture();studyGuide=null;guidedDirection=0;scope=next;viewer.setScope(scope);
  const joint=descriptor();
  if(next!=='all'&&!poseScopeMatches(next,joint)){
   const candidate=descriptors.find(item=>poseScopeMatches(next,item))
   if(candidate){selectedJoint=candidate.id;selectedAxis=candidate.axes[0].id;history.clearChanges();}
  }
  if(!viewer.endpointChain(selectedJoint))interaction='joint';
  selectedMuscle=null;message=next==='all'?'Whole body shown. Your pose is kept.':'Region isolated. Your pose is kept.';
  draw();viewer.frame();save();
 }
 function chooseGuide(id){
  const guide=findMotionStudyGuide(id);
  const joint=descriptors.find(entry=>entry.id===guide?.joint);
  if(!history||!joint?.axes.some(axis=>axis.id===guide.axis))return false;
  stopGesture();history.clearChanges();studyGuide=guide;guidedDirection=0;
  selectedJoint=joint.id;selectedAxis=guide.axis;selectedMuscle=null;
  scope=guide.scope;interaction='joint';showMuscles=true;onlyRelated=false;
  viewer.setScope(scope);
  message='Choose a direction or play the movement.';
  ui.closeNotes();draw();
  if(guide.fullFrame)viewer.frame(guide.view);
  else viewer.focusJoint(guide.view,guide.radius);
  return true;
 }
 function applyMotionRoute(search){
  if(chooseGuide(search.get('motionGuide')))return;
  const joint=descriptors.find(entry=>entry.id===search.get('motionJoint'));
  const axis=joint?.axes.find(entry=>entry.id===search.get('motionAxis'));
  if(!axis)return;
  selectedJoint=joint.id;selectedAxis=axis.id;scope=joint.region;
  viewer.setScope(scope);draw();viewer.focusJoint();
 }
 function roles(){
  if(!history||!specimen)return {contributors:[],opposing:[],note:''};
  if(studyGuide&&(guidedDirection||!history.changes.length)){
   const controlledReturn=guidedDirection<0&&studyGuide.controlledReturn;
   const direction=controlledReturn?1:guidedDirection||studyGuide.direction||1;
   const role=poseRoles(descriptor(),selectedAxis,direction,specimen.parts,history.values);
   if(controlledReturn)return {...role,label:studyGuide.returnLabel||'Controlled lowering',movementNotes:[controlledReturn]};
   return role;
  }
  return combinedPoseRoles(descriptors,history.changes,specimen.parts,history.values);
 }
 function shapeNotice(){
  if(!history)return '';
  const values=history.values;
  const large=['right','left'].some(side=>{
   const shoulder=values[side+'-shoulder'],elbow=values[side+'-elbow'];
   return shoulder?.abduction>=70||shoulder?.flexion>=75||elbow?.flexion>=95||values[side+'-hip']?.flexion>=70&&values[side+'-knee']?.flexion>=65;
  });
  return large?'Large teaching pose: muscle shapes may stretch or overlap.':'';
 }
 function updateUI(role=roles(),visibleAnatomy){
  const byId=new Map(specimen?.parts.map(part=>[part.key,part])||[]);
  const joint=descriptor(),directionLabels=joint?describePoseAxis(joint,selectedAxis):null;
  const visible=visibleAnatomy||poseMotionScope(scope,joint,role,specimen?.parts||[],specimen?.bones||[],selectedMuscle);
  const parts=(keys,contributor)=>keys.filter(key=>visible.muscleKeys.has(key)).map(key=>byId.get(key)).filter(Boolean).map(part=>{
   let roleLabel;
   if(contributor&&studyGuide?.id==='arm-abduction'&&['Shoulder abduction','Controlled lowering'].includes(role.label)){
    roleLabel=/serratus|trapezius/i.test(part.name)?'Shoulder blade · possible contributor':'Upper arm · possible contributor';
   }
   return {key:part.key,name:part.name+' · '+part.side,roleLabel};
  });
  ui.update({ready:!!history&&active,descriptors,selectedJoint,selectedAxis,pose:history?.values||{},canUndo:!!history?.canUndo,canRedo:!!history?.canRedo,scope,locked:history?.locks||[],
   playing:!!playback,directionLabels,axisLabels:Object.fromEntries((joint?.axes||[]).map(axis=>[axis.id,describePoseAxis(joint,axis.id).label])),
   canNeutralize:!!joint?.axes.some(axis=>!history?.isAxisLocked(selectedJoint,axis.id)&&history?.values[selectedJoint]?.[axis.id]!==(axis.neutral??0)),
   message:history?.isAxisLocked(selectedJoint,selectedAxis)&&!history.isLocked(selectedJoint)?'Unlock the shoulder girdle to raise this arm.':shapeNotice()||message,
   movementLocked:!!history?.isAxisLocked(selectedJoint,selectedAxis),contributors:parts(role.contributors,true),opponents:parts(role.opposing,false),selectedMuscle,
   selectedMuscleName:byId.get(selectedMuscle)?.name,showMuscles,onlyRelated,interaction,endpointAvailable:!!viewer.current&&!!viewer.endpointChain(selectedJoint),
   evidence:role.note,movementLabel:role.label,studyGuide,roleNote:role.movementNotes?.[0]||studyGuide?.note||'',
   movementNote:[studyGuide?.note,...(role.movementNotes||[]),joint?.detail,joint?.coupling].filter(Boolean).join(' ')});
 }
 function draw(){
  if(!history||!specimen||!active)return;
  viewer.apply(history.values);
  viewer.setPoseSelection(selectedJoint,selectedAxis,{locks:history.locks,interaction});
  const role=roles();
  const visibleAnatomy=poseMotionScope(scope,descriptor(),role,specimen.parts,specimen.bones,selectedMuscle);
  viewer.color({contributors:role.contributors,opposing:role.opposing,selectedMuscle,showMuscles,visibleAnatomy,onlyRelated:onlyRelated&&!!(role.contributors.length||role.opposing.length||selectedMuscle)});
  updateUI(role,visibleAnatomy);
  const context=[selectedJoint,role.label,selectedMuscle].join('|');
  if(context!==lastContext){setLearningContext({type:'study',label:'Pose skeleton · '+descriptor()?.label,reference:'9.5',text:role.note+' '+(role.label||'')});lastContext=context;}
 }
 function save(){
  clearTimeout(saveTimer);
  saveTimer=setTimeout(()=>{
   if(!history)return;
   try{localStorage.setItem(savedKey,JSON.stringify({values:history.values,locks:history.locks,selectedJoint,selectedAxis,scope}));}catch{/* Pose remains usable when browser storage is unavailable. */}
  },200);
 }
 function restore(){
  try{
   const stored=JSON.parse(localStorage.getItem(savedKey)||'null');
   if(!stored||typeof stored!=='object')return;
   history.patch(stored.values);
   for(const id of Array.isArray(stored.locks)?stored.locks:[])history.setLocked(id,true);
   if(descriptors.some(joint=>joint.id===stored.selectedJoint)){
    selectedJoint=stored.selectedJoint;
    selectedAxis=descriptor().axes.some(axis=>axis.id===stored.selectedAxis)?stored.selectedAxis:descriptor().axes[0].id;
   }
   history.past=[];history.future=[];history.clearChanges();
   message='Your last pose is restored on this device.';
  }catch{/* A stale saved pose never blocks a new session. */}
 }
 async function open(){
  active=true;const run=++revision;host.hidden=false;ui.setStatus('Loading the whole-body pose model…');
  try{
   viewer.open();
   const loaded=await viewer.loadBody();
   if(!active||run!==revision)return;
   specimen=loaded;viewer.use(specimen);
   if(!history){
    descriptors=specimen.descriptors||specimen.meta.descriptors;
    if(!descriptors?.length)throw new Error('The pose model is missing its joint controls.');
    history=new PoseHistory(descriptors);
    selectedJoint=descriptors.find(joint=>joint.id==='right-elbow')?.id||descriptors[0].id;
    selectedAxis=descriptor().axes[0].id;restore();
    const linked=specimen.parts.find(part=>part.key===new URLSearchParams(location.search).get('motionPart'));
    if(linked){
     selectedMuscle=linked.key;
     scope=linked.region==='head-neck'?'head-neck':linked.region==='trunk-back'?'trunk':linked.side+'-'+(linked.region==='pelvis-leg-foot'?'leg':'arm');
     const joint=descriptors.find(entry=>poseScopeMatches(scope,entry));
     if(joint){selectedJoint=joint.id;selectedAxis=joint.axes[0].id;}
     message=linked.name+' · '+linked.side;
    }
   }
   viewer.setScope(scope);draw();viewer.frame('front');ui.setStatus('');
   if(!guideRouteRead){guideRouteRead=true;applyMotionRoute(new URLSearchParams(location.search));}
  }catch(error){
   if(!active||run!==revision)return;
   ui.setStatus(error.message||'The pose model could not load.',{error:true,retry:open});
   updateUI();
  }
 }
 function close(){stopPlayback();ui.cancelGesture?.();history?.cancel();active=false;revision++;viewer.close();host.hidden=true;}
 const pauseWhenAway=()=>{if(!playback)return;stopPlayback();message='Preview paused while you were away.';draw();};
 window.addEventListener('blur',pauseWhenAway);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseWhenAway();});
 host.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&playback){event.preventDefault();stopPlayback({restore:true});message='Preview cancelled. Your starting pose is restored.';draw();return;}
  if(!active||!history||event.target.matches('input,select,textarea'))return;
  if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='z'){
   event.preventDefault();stopGesture();guidedDirection=0;if(event.shiftKey)history.redo();else history.undo();draw();save();
  }
 });
 return {open,close,viewer,ui,get history(){return history;}};
}
