import {labFor} from './ap2-library.js';
import {regionalLessons,addOrgansToLesson} from './ap2-blood-organ-regions.js';
import {addEntericLesson} from './ap2-enteric-wall.js';
import {evidenceStations,addEvidenceLesson} from './ap2-evidence-labs.js';
import {mountGuidedPredictions} from './ap2-guided-predictions.js';
import {mountTissueModel,tissueMarkup} from './ap2-tissue-models.js';
import {mountExerciseFlow} from './ap2-exercise-flow.js';
import {mountVesselModels,vesselModelMarkup} from './ap2-vessel-walls.js';

const inspect='Inspect a specimen',trace='Trace a pathway',test='Test a prediction',interpret='Interpret evidence';
const panelKinds=[
  ['neuroSpecimen','data-neuro-specimen',inspect],['sensoryDetail','data-sensory-detail',test],
  ['process','data-process',trace,'signal'],['neuroCases','data-neuro-cases',interpret,'cases'],
  ['neuralLab','data-neural-lab',trace,'schematic'],['regLab','data-reg-lab',test,'regulation'],
  ['glandStation','data-gland-station',inspect,'gland']
];
const panelSelector=panelKinds.map(([,attr])=>'['+attr+']').join(',');
const glandKeys={'17.3':'pituitary-pathways','17.4':'neck','17.5':'parathyroids','17.6':'adrenal-layers','17.7':'pineal','17.8':'ovary','17.9':'pancreas'};
const glandPresets={
  follicle:['neck-view','micro'],neck:['neck-view','anterior'],parathyroids:['neck-view','posterior'],
  'parathyroid-histology':['neck-view','micro'],islet:['scale','micro'],pancreas:['scale','gross'],
  ovary:['gonad','ovary'],testis:['gonad','testis'],placenta:['gonad','placenta']
};
const extras={
  '17.4':[['follicle','Inspect the thyroid follicle',inspect]],
  '17.5':[['parathyroid-histology','Compare parathyroid and thyroid tissue',inspect]],
  '17.8':[['testis','Explore the testis',inspect],['placenta','Inspect the placenta',inspect]],
  '17.9':[['islet','Inspect the pancreatic islet',inspect]],
  '19.1':[['supports','Inspect the mitral valve supports',inspect]],
  '19.4':[['afterload','Compare pressure–volume loops',test]],
};
const lastStation=new Map();
export function winterExploreRoute(section){
  let key=lastStation.get(section);
  try{key??=sessionStorage.getItem('osteon-winter-explore-'+section);}catch{}
  return 'ap2-lesson-'+section+'/activity'+(key&&/^[\w-]+$/.test(key)?'/'+key:'');
}
function remember(section,key){
  lastStation.set(section,key);
  try{sessionStorage.setItem('osteon-winter-explore-'+section,key);}catch{}
}
function activateSelect(host,selector,value){
  const control=host.querySelector(selector);
  if(!control||![...control.options].some(o=>o.value===value)||control.value===value)return;
  control.value=value;control.dispatchEvent(new Event('change',{bubbles:true}));
}
function setView(host,id,key){
  const preset=glandPresets[key];if(preset)activateSelect(host,'[data-'+preset[0]+']',preset[1]);
  const circulation=host.querySelector('[data-circulation-station]');
  if(circulation){
    activateSelect(host,'[data-circulation-station]',key);
    circulation.closest('label').hidden=true;
  }
  if(id==='20.5'&&key!=='core'){
    host.querySelector('[data-cardio-view="1"]')?.click();
    activateSelect(host,'[data-cardio-panel="1"] [data-specimen-mode]',key);
  }
  if(id==='19.1'&&key==='supports')activateSelect(host,'[data-specimen-mode]',key);
  if(id==='19.3'&&key==='motion'){
    host.querySelector('[data-cardio-view="1"]')?.click();activateSelect(host,'[data-specimen-mode]','motion');
  }
  if(id==='19.3'&&key==='heart-sounds')host.querySelector('[data-cardio-view="4"]')?.click();
  if(id==='19.4')host.querySelector('[data-afterload-link]')?.closest('nav')?.remove();
}
function stationMenu(bar,choices,current,change){
  const label=document.createElement('label'),pick=document.createElement('select'),groups=new Map();
  label.textContent='Activity ';pick.dataset.winterStation='';pick.setAttribute('aria-label','Choose a lesson activity');
  for(const {group,key,title} of choices){
    if(!groups.has(group)){
      const groupNode=document.createElement('optgroup');groupNode.label=group;groups.set(group,groupNode);pick.append(groupNode);
    }
    const option=document.createElement('option');option.value=key;option.textContent=title;groups.get(group).append(option);
  }
  pick.value=current;pick.onchange=()=>change(pick.value);label.append(pick);bar.append(label);
  return pick;
}
let focusSection='';
export function openWinterExplore(body,section,requested,{store,escape,atlas}){
  const id=section.id,lab=labFor(id),template=document.createElement('template');
  template.innerHTML=lab.renderLab(id);
  const choices=[],panels=[...template.content.querySelectorAll(panelSelector)];
  function add(key,title,group,kind='lab',panel=null){
    if(!choices.some(c=>c.key===key))choices.push({key,title,group,kind,panel});
  }
  for(const node of panels){
    const [field,,group,alias]=panelKinds.find(([field])=>field in node.dataset);
    const key=field==='glandStation'?(glandKeys[id]||'gland'):alias||node.dataset[field];
    add(key,node.querySelector('h3,h2')?.textContent||section.title,group,'lab',node);
  }
  const circulation=template.content.querySelector('[data-circulation-station]');
  if(circulation)for(const o of circulation.options)add(o.value,o.textContent,o.value==='core'?trace:inspect);
  if(!choices.length)add('core',template.content.querySelector('h3,h2')?.textContent||section.activity.title,test);
  for(const [key,title,group] of extras[id]||[])add(key,title,group,'lab',panels.find(p=>p.hasAttribute('data-gland-station')));
  if(id==='19.3'){
    add('motion','Inspect the four valves through a beat',inspect);
    if(template.content.querySelector('[data-cardio-view="4"]'))add('heart-sounds','Listen to and mark the heart sounds',interpret);
  }
  if(id==='20.5')for(const [key,title] of [['arch','Aortic arch'],['pulmonary','Pulmonary vessels'],['caval','Systemic venous return'],['upper','Arm and hand circulation'],['legReturn','Foot to right atrium'],['gut','Arterial supply of the gut'],['kidneys','Renal circulation'],['portal','Hepatic portal system'],['leg','Right leg and foot']])add(key,title,inspect);
  if(id==='18.1')add('elements','Inspect formed blood elements in 3D',inspect,'elements');
  if(id==='20.1'){
    add('walls','Compare arterial and venous walls',inspect,'vessel-model');
    add('capillaries','Compare capillary barriers',inspect,'vessel-model');
  }
  if(id==='20.4')add('exercise-flow','Distribute blood during exercise',test,'exercise-flow');
  for(const [key,title] of regionalLessons[id]||[])add(key,title,inspect,'regional');
  if(id==='15.2')add('enteric-wall','Trace a reflex in the intestinal wall',trace,'enteric');
  for(const s of evidenceStations.filter(s=>s.section===id))add(s.id,s.title,interpret,'evidence');
  add('guided',section.activity.title,'Explain step by step','guided');
  const stream=id==='20.6'&&/^fetal-flow-(atrial|ductal|placentaReturn|placental|lung)$/.exec(requested||'');
  const current=choices.find(c=>c.key===(stream?'fetal-flow':requested))||choices[0],key=current.key;
  remember(id,key);
  body.innerHTML='<div class="winter-station-bar"></div><div class="winter-station-content"></div>';
  const host=body.lastElementChild,bar=body.firstElementChild;
  const pick=stationMenu(bar,choices,key,next=>{
    focusSection=id;location.hash='ap2-lesson-'+id+'/activity/'+next;
  });
  if(focusSection===id){focusSection='';pick.focus({preventScroll:true});}
  if(current.kind==='guided'){
    host.innerHTML='<div class="ap2-guided"><h2>'+escape(section.activity.title)+'</h2><p>'+escape(section.activity.prompt)+'</p><div class="ap2-step"></div></div>';
    mountGuidedPredictions(host.querySelector('.ap2-step'),section,store,escape);
    if(atlas){
      const a=document.createElement('a');a.className='course-link';a.href='?nerve='+encodeURIComponent(atlas[0])+'#atlas';a.textContent='Find '+atlas[1]+' in the whole-body Atlas';host.append(a);
    }
  }else if(current.kind==='regional')addOrgansToLesson(host,id,key);
  else if(current.kind==='enteric')addEntericLesson(host,key);
  else if(current.kind==='evidence')addEvidenceLesson(host,id,key);
  else if(current.kind==='exercise-flow')mountExerciseFlow(host);
  else if(current.kind==='vessel-model'){
    host.innerHTML=vesselModelMarkup(key);mountVesselModels(host);
  }
  else if(current.kind==='elements'){
    host.innerHTML=tissueMarkup('elements');mountTissueModel(host,'elements');
  }else{
    for(const p of panels)if(p!==current.panel)p.remove();
    if(id==='18.1')template.content.querySelector('[data-formed-lab]')?.remove();
    const sim=document.createElement('div');sim.className='ap2-simulation';sim.append(template.content);host.append(sim);
    lab.mountLab(sim,id,{store,station:key});setView(sim,id,key);
    if(stream)activateSelect(sim,'[data-fetal-route]',stream[1]);
    if(requested&&current.panel?.hasAttribute('data-neuro-specimen'))current.panel.querySelector('[data-load-specimen]')?.click();
  }
}
