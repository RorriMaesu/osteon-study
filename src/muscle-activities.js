import {setDiagramLearningContext} from './learning-context.js';

const e=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const bone='#e5e8d7',mint='#b1dac5',peach='#eaa17b',dim='#76948e';
const credit='<p class="tiny">Original qualitative teaching diagram · guided practice, not scored. Compare the chapter figure and reading. Controls illustrate a relationship, not a measurement in a person.</p>';
const svg=(label,body)=>`<svg viewBox="0 0 600 350" role="img" aria-label="${e(label)}">${body}</svg>`;
const text=(x,y,label,{size=22,color=bone,anchor='start'}={})=>`<text x="${x}" y="${y}" fill="${color}" font-size="${size}" text-anchor="${anchor}">${e(label)}</text>`;
const arrow=(x1,y1,x2,y2)=>`<path d="M${x1} ${y1}L${x2} ${y2}" stroke="${mint}" stroke-width="3" fill="none"/><circle cx="${x2}" cy="${y2}" r="4" fill="${mint}"/>`;

export const couplingEvents=[
 ['Nerve signal','An action potential reaches the motor neuron terminal. Calcium entry into that terminal supports acetylcholine release.'],
 ['ACh at the end-plate','Acetylcholine binds receptors on the muscle motor end-plate. The resulting depolarization can trigger a muscle action potential.'],
 ['Signal travels inward','The muscle action potential travels along the sarcolemma and T-tubules. A T-tubule carries electrical change; it does not carry acetylcholine into the fiber.'],
 ['Calcium is released','Excitation–contraction coupling causes calcium release from the sarcoplasmic reticulum into the sarcoplasm.'],
 ['Thin filament activation','Calcium binds troponin. Tropomyosin shifts so myosin can interact with actin while ATP supports cycling.'],
 ['Signal ends and calcium returns','ACh is removed from the cleft. ATP-dependent pumps return calcium to the SR; thin-filament regulation restricts new crossbridges.']
];
export const fiberProfiles=[
 {id:'SO',name:'Slow oxidative',speed:1,oxidative:3,fatigue:3,force:1,description:'Slow contraction, substantial mitochondrial and oxygen-delivery support, and relatively high fatigue resistance. Useful for sustained lower-force activity.'},
 {id:'FO',name:'Fast oxidative',speed:3,oxidative:2,fatigue:2,force:2,description:'Faster contraction with substantial aerobic capacity. Useful when more force is needed while activity is sustained; speed and metabolism are separate dimensions.'},
 {id:'FG',name:'Fast glycolytic',speed:3,oxidative:1,fatigue:1,force:3,description:'Fast, relatively powerful contractions with strong glycolytic capacity. Useful for brief forceful activity and generally quicker to fatigue.'}
];
export const smoothEvents=[
 ['Calcium rises','Calcium enters the sarcoplasm from extracellular fluid and intracellular stores.'],
 ['Calmodulin binds calcium','Calcium binds calmodulin. Smooth muscle does not use troponin as its main contraction regulator.'],
 ['Kinase is activated','The calcium–calmodulin complex activates myosin light-chain kinase (MLCK).'],
 ['Myosin is phosphorylated','MLCK uses ATP to phosphorylate myosin light chains, permitting regulated interaction with actin.'],
 ['Force and relaxation','Actin–myosin interaction generates force. Lowering calcium and dephosphorylating myosin support relaxation. Latch behavior maintains some force with low ATP turnover, not zero cellular energy use.']
];
export const repairProfiles=[
 {name:'Skeletal',cells:'Satellite cells',detail:'Satellite cells can contribute to repair of surviving skeletal fibers. Severe damage can exceed repair capacity and produce fibrosis.',score:1},
 {name:'Cardiac',cells:'Limited replacement',detail:'Adult cardiac muscle has very limited regeneration. Substantial muscle-cell loss usually leaves noncontractile scar tissue.',score:0},
 {name:'Smooth',cells:'Cells can divide',detail:'Smooth muscle generally has greater capacity for cell replacement than skeletal or cardiac muscle. Capacity still depends on the tissue and injury.',score:3}
];

export function recruitmentState(active=1,total=3){
 const count=Math.max(1,Math.min(total,Math.round(Number(active)||1)));
 return{active:count,total,fibersActive:count*3,fibersTotal:total*3};
}
export function lengthTensionState(length=100){
 const normalized=Math.max(55,Math.min(175,Number(length)||100));
 const tension=normalized<90?Math.max(0,(normalized-55)/35):normalized<=110?1:Math.max(0,(175-normalized)/65);
 return{length:normalized,tension,region:normalized<90?'too short':normalized<=110?'near optimal':'stretched'};
}
function routeDrawing(steps,index){
 return svg('Selected step '+(index+1)+' of a qualitative pathway. '+steps[index][0],steps.map(([name],i)=>{
  const y=25+i*49;return `${i?arrow(36,y-30,36,y-8):''}<circle cx="36" cy="${y+4}" r="17" fill="${i===index?peach:'#193237'}" stroke="${i===index?peach:dim}"/>${text(36,y+11,String(i+1),{size:20,color:i===index?'#14282c':bone,anchor:'middle'})}${text(68,y+11,name,{size:21,color:i===index?peach:bone})}`;
 }).join(''));
}
function parallelATP(steps,index){
 return svg('Several overlapping sources replenish ATP; selecting one does not turn the others off.',steps.map(([name],i)=>{
  const y=35+i*67;return `<rect x="20" y="${y}" width="272" height="45" rx="9" fill="${i===index?'#805344':'#193237'}" stroke="${i===index?peach:dim}"/>${text(156,y+29,name,{size:22,anchor:'middle'})}${arrow(296,y+22,390,167)}`;
 }).join('')+`<circle cx="458" cy="167" r="57" fill="#244c44" stroke="${mint}" stroke-width="3"/>${text(458,177,'ATP',{size:30,anchor:'middle'})}${text(300,338,'Contributions overlap; selection highlights one route',{size:19,anchor:'middle'})}`);
}
function developmentDrawing(stage){
 const cell=(x,width=120)=>`<rect x="${x}" y="130" width="${width}" height="80" rx="40" fill="#805344" stroke="${bone}" stroke-width="2"/>`;
 const nucleus=x=>`<ellipse cx="${x}" cy="170" rx="13" ry="19" fill="${mint}"/>`;
 let body;
 if(stage===0)body=[45,240,435].map(x=>cell(x)+nucleus(x+60)).join('')+text(300,262,'Separate myoblasts · each has a nucleus',{anchor:'middle'});
 else if(stage===1)body=cell(65,470)+[125,300,475].map(nucleus).join('')+`<path d="M222 132V208M378 132V208" stroke="${peach}" stroke-dasharray="5 6" stroke-width="2"/>`+text(300,262,'Fusion creates continuous cytoplasm',{anchor:'middle'});
 else body=cell(65,470)+[125,300,475].map(nucleus).join('')+text(300,262,'One developing fiber · nuclei are retained',{anchor:'middle'});
 if(stage===3)body+=`<ellipse cx="420" cy="103" rx="35" ry="17" fill="#805344" stroke="${peach}" stroke-width="2"/><ellipse cx="420" cy="103" rx="11" ry="10" fill="${mint}"/>${text(420,68,'Satellite cell',{size:21,anchor:'middle'})}`;
 return svg('Skeletal muscle development. '+(stage===0?'Separate mononucleated myoblasts.':stage===1?'Myoblast fusion into a shared cytoplasm.':'A multinucleated developing fiber.')+(stage===3?' A satellite cell is shown nearby as a simplified repair reference.':''),body+text(300,322,'Cell schematic · not a histology image',{size:19,anchor:'middle'}));
}
function publish(id,title,reference,state,question,hint,answer,facts,prediction=''){
 setDiagramLearningContext({id,title,reference,state,question,hint,answer,facts,prediction});
}
function askTutor(root){
 const row=document.createElement('div');row.className='control-row';row.innerHTML='<button type="button" data-activity-tutor>Think this through with the tutor ↗</button>';
 root.append(row);row.querySelector('button').onclick=()=>document.querySelector('#tutor-launch')?.click();
}
function sequence(root,{id,title,reference,steps,question,hint,answer,parallel=false}){
 let stage=0,revealed=false;
 function render(){
  publish(id,title,reference,{stage:stage+1,step:steps[stage][0]},question,hint,answer,[...steps.map(([,fact])=>fact)]);
  root.innerHTML=`<h3>${e(title)}</h3><div class="muscle-lab"><div class="muscle-lab-visual">${parallel?parallelATP(steps,stage):id==='skeletal-muscle-development'?developmentDrawing(stage):routeDrawing(steps,stage)}</div><div><label for="muscle-route-stage">${parallel?'ATP source':'Step'}</label><select id="muscle-route-stage">${steps.map(([name],i)=>`<option value="${i}" ${stage===i?'selected':''}>${parallel?'':i+1+'. '}${e(name)}</option>`).join('')}</select><p>${e(steps[stage][1])}</p><div class="control-row"><button data-route-back ${stage===0?'disabled':''}>← Previous</button><button data-route-next ${stage===steps.length-1?'disabled':''}>Next →</button></div><p class="flow-question">${e(question)}</p><button data-route-reveal aria-expanded="${revealed}">${revealed?'Hide explanation':'Check my reasoning'}</button>${revealed?`<p class="muscle-lab-feedback" role="status">${e(answer)}</p>`:''}</div></div>${credit}`;
  root.querySelector('#muscle-route-stage').onchange=ev=>{stage=+ev.target.value;render();};root.querySelector('[data-route-back]').onclick=()=>{stage--;render();};root.querySelector('[data-route-next]').onclick=()=>{stage++;render();};root.querySelector('[data-route-reveal]').onclick=()=>{revealed=!revealed;render();};askTutor(root);
 }render();
}
function fiberDrawing(profile){
 const rows=[['Contraction speed',profile.speed],['Oxidative support',profile.oxidative],['Fatigue resistance',profile.fatigue],['Relative force potential',profile.force]];
 return svg(profile.name+' illustrative comparison; blocks show qualitative relative levels, not measured values.',text(300,35,profile.name,{anchor:'middle',color:peach})+rows.map(([label,value],i)=>{
  const y=78+i*61;return text(25,y+15,label,{size:20})+Array.from({length:3},(_,j)=>`<rect x="${345+j*67}" y="${y-9}" width="54" height="28" rx="5" fill="${j<value?mint:'#274146'}"/>`).join('');
 }).join('')+text(300,335,'Relative levels · whole muscles contain mixtures',{size:19,anchor:'middle'}));
}
function fibers(root){
 let index=0,task=0,shown=false;
 const tasks=[['Maintain low-force posture','SO','Slow oxidative fibers generally suit sustained lower-force work. A whole muscle contains multiple fiber types.'],['Produce a brief powerful effort','FG','Fast glycolytic fibers generally support brief high-force activity. This does not imply an entire muscle contains only FG fibers.'],['Combine speed with aerobic support','FO','Fast oxidative fibers show why fast contraction does not necessarily mean predominantly anaerobic metabolism.']];
 function render(){const p=fiberProfiles[index],[q,key,answer]=tasks[task];publish('muscle-fiber-comparison','Muscle fiber comparison','10.5',{selected:p.name,task:q},'Which fiber profile best supports this task: '+q+'?','Compare speed, ATP pathway and fatigue resistance separately.',answer,fiberProfiles.map(x=>x.description),shown?p.id:'');
 root.innerHTML=`<h3>Compare speed and energy supply.</h3><div class="muscle-lab"><div class="muscle-lab-visual">${fiberDrawing(p)}</div><div><label for="fiber-profile">Fiber profile</label><select id="fiber-profile">${fiberProfiles.map((x,i)=>`<option value="${i}" ${i===index?'selected':''}>${x.name}</option>`).join('')}</select><p>${e(p.description)}</p><label for="fiber-task">Try a task</label><select id="fiber-task">${tasks.map(([name],i)=>`<option value="${i}" ${i===task?'selected':''}>${name}</option>`).join('')}</select><button data-fiber-check>Check selected profile</button>${shown?`<p role="status" class="muscle-lab-feedback">${p.id===key?'That fits this task. ':'Compare with '+key+'. '}${e(answer)}</p>`:''}</div></div>${credit}`;
 root.querySelector('#fiber-profile').onchange=ev=>{index=+ev.target.value;shown=false;render();};root.querySelector('#fiber-task').onchange=ev=>{task=+ev.target.value;shown=false;render();};root.querySelector('[data-fiber-check]').onclick=()=>{shown=true;render();};askTutor(root);}
 render();
}
function motorUnitDrawing(units){
 return svg('Three schematic motor units, each with one motor neuron connected to three muscle fibers. '+units+' active units.',Array.from({length:3},(_,i)=>{const y=70+i*94,on=i<units,color=on?peach:dim;return `<circle cx="72" cy="${y}" r="22" fill="${on?'#805344':'#20383a'}" stroke="${color}" stroke-width="3"/><path d="M94 ${y}H215V${y-27}M215 ${y}V${y+27}" fill="none" stroke="${color}" stroke-width="4"/>${[-27,0,27].map(dy=>`<path d="M215 ${y+dy}H310" stroke="${color}" stroke-width="3"/><rect x="310" y="${y+dy-9}" width="160" height="18" rx="9" fill="${on?mint:'#2a4446'}"/>`).join('')}${text(500,y+7,on?'On':'Off',{size:20,color})}`;}).join('')+text(72,25,'Motor neuron',{size:18,anchor:'middle'})+text(390,25,'Connected muscle fibers',{size:18,anchor:'middle'})+text(300,337,'Equal-sized units shown only to clarify the relationship',{size:17,anchor:'middle'}));
}
function motorUnits(root){
 let units=1;
 const question='If another motor unit is recruited while firing frequency stays the same, what changes?';
 const answer='More muscle fibers are active, so whole-muscle force can increase. Recruitment is separate from increasing the firing frequency of already active neurons.';
 const updateContext=()=>publish('motor-unit-recruitment','Motor-unit recruitment','10.4',{activeUnits:units,totalUnits:3,stimulusFrequency:'unchanged'},question,'Count active neurons and their connected fibers.',answer,[answer,'One skeletal motor unit is one somatic motor neuron and all muscle fibers it innervates. Real motor units vary in size.']);
 root.innerHTML=`<h3>Recruit another motor unit.</h3><div class="muscle-lab"><div class="muscle-lab-visual"></div><div><label for="motor-unit-count"></label><input id="motor-unit-count" type="range" min="1" max="3" step="1" value="${units}"><p data-active-fibers></p><p class="flow-question">${question}</p><p class="tiny">Use the force-trace activity to explore firing frequency separately. Real motor units differ in size; recruitment is not a calibrated force calculation here.</p></div></div>${credit}`;
 const update=()=>{const s=recruitmentState(units);root.querySelector('.muscle-lab-visual').innerHTML=motorUnitDrawing(units);root.querySelector('label[for="motor-unit-count"]').textContent=`Active motor units · ${units} of 3`;root.querySelector('[data-active-fibers]').textContent=`${s.fibersActive} of ${s.fibersTotal} illustrative muscle fibers are active. Their firing frequency stays the same.`;updateContext();};
 root.querySelector('#motor-unit-count').oninput=ev=>{units=+ev.target.value;update();};update();askTutor(root);
}
function lengthTensionDrawing(length){
 const s=lengthTensionState(length),pts=Array.from({length:121},(_,i)=>{const p=lengthTensionState(55+i);return`${i?'L':'M'}${70+i*3.8} ${265-p.tension*190}`;}).join(' '),x=70+(length-55)*3.8,y=265-s.tension*190;
 return svg('Qualitative active tension versus relative sarcomere length. Selected length is '+s.region+'.',`<path d="M70 35V265H550" fill="none" stroke="${dim}" stroke-width="3"/><path d="${pts}" stroke="${peach}" stroke-width="4" fill="none"/><path d="M${x} 265V${y}" stroke="${mint}" stroke-dasharray="5 5"/><circle cx="${x}" cy="${y}" r="8" fill="${mint}"/>${text(70,27,'Relative active tension',{size:20})}${text(70,297,'Short',{size:19})}${text(300,297,'Near optimal',{size:19,anchor:'middle'})}${text(545,297,'Long',{size:19,anchor:'end'})}${text(300,335,'Relative length · illustrative curve',{size:20,anchor:'middle'})}`);
}
function lengthTension(root){
 let length=100;
 const question='Why can both excessive shortening and excessive stretching reduce active tension?',answer='Excessive stretching leaves fewer possible actin–myosin contacts. Excessive shortening crowds the filament arrangement. Near an optimal length, productive crossbridge formation is favored.';
 root.innerHTML=`<h3>Compare length with active force.</h3><div class="muscle-lab"><div class="muscle-lab-visual"></div><div><label for="sarcomere-length"></label><input id="sarcomere-length" type="range" min="55" max="175" value="${length}"><p>${answer}</p><p class="flow-question">${question}</p><p class="tiny">This graph shows active tension only. It does not model passive tissue tension or prescribe a joint angle.</p></div></div>${credit}`;
 const update=()=>{const s=lengthTensionState(length);root.querySelector('.muscle-lab-visual').innerHTML=lengthTensionDrawing(length);root.querySelector('label[for="sarcomere-length"]').textContent='Relative length · '+s.region;publish('length-tension','Length and active tension','10.4',{relativeLength:length,relationship:s.region},question,'Compare productive crossbridge contact, not simply total overlap.',answer,[answer,'The horizontal axis is relative sarcomere length, not percentage overlap. This qualitative curve is not calibrated and its boundaries are illustrative.']);};
 root.querySelector('#sarcomere-length').oninput=ev=>{length=+ev.target.value;update();};update();askTutor(root);
}
function smoothCoupling(root){let coupled=true;
 function render(){const title=coupled?'Single-unit organization':'Multiunit organization',question='Why can stimulation spread between neighboring cells in one organization more readily than the other?',answer='Gap junctions electrically couple many single-unit smooth-muscle cells. Multiunit cells have little electrical coupling and allow more independent control; this is not a distinction between voluntary and involuntary tissue.';publish('smooth-unit-coupling',title,'10.8',{organization:coupled?'single-unit':'multiunit'},question,'Look for a path between adjacent cells.',answer,[answer]);
 const drawing=svg(title+'. '+(coupled?'Neighboring cells are connected by gap junctions.':'Cells are shown without intercellular electrical bridges.'),[110,300,490].map((x,i)=>`<path d="M${x} 65Q${x+78} 175 ${x} 285Q${x-78} 175 ${x} 65Z" fill="${coupled? '#80554b':i===0?'#80554b':'#294347'}" stroke="${bone}" stroke-width="2"/><ellipse cx="${x}" cy="175" rx="12" ry="28" fill="#152c31"/>${coupled&&i<2?`<path d="M${x+39} 175H${x+151}" stroke="${mint}" stroke-width="6"/>`:''}`).join('')+text(300,35,coupled?'Coupled activation':'More independent activation',{anchor:'middle',color:peach})+text(300,325,coupled?'Gap junctions link neighboring cells':'Little electrical coupling between cells',{anchor:'middle',size:20}));
 root.innerHTML=`<h3>How does activation spread?</h3><div class="muscle-lab"><div class="muscle-lab-visual">${drawing}</div><div><label for="smooth-organization">Organization</label><select id="smooth-organization"><option value="single" ${coupled?'selected':''}>Single-unit smooth muscle</option><option value="multi" ${!coupled?'selected':''}>Multiunit smooth muscle</option></select><p>${answer}</p><p class="flow-question">${question}</p><p class="tiny">The diagram compares coupling. It is not a literal distribution of nerves or cells in an organ.</p></div></div>${credit}`;
 root.querySelector('#smooth-organization').onchange=ev=>{coupled=ev.target.value==='single';render();};askTutor(root);}
 render();
}
function repair(root){let tissue=0,severe=false;
 function render(){const p=repairProfiles[tissue],question='Does replacing damaged muscle with scar restore its original contractile ability?',answer='No. Fibrosis replaces contractile tissue with connective scar. It can restore continuity without restoring the same force-generating tissue.';publish('muscle-repair','Repair and regeneration','10.9',{tissue:p.name,injury:severe?'substantial cell loss':'limited cell loss'},question,'Separate filling a defect from replacing functioning muscle cells.',answer,[p.detail,answer,'Skeletal satellite cells help repair and contribute nuclei; they do not guarantee complete recovery after any injury.']);
 const drawing=svg('Comparison of '+p.name.toLowerCase()+' muscle injury and repair. Generic bars represent muscle tissue, not cell morphology; crosshatching indicates illustrative scar.',Array.from({length:4},(_,i)=>{const y=75+i*52;return`<rect x="45" y="${y}" width="220" height="26" rx="12" fill="${peach}"/><rect x="335" y="${y}" width="220" height="26" rx="12" fill="${peach}"/>${severe||tissue===1?`<rect x="405" y="${y}" width="90" height="26" fill="#65807b"/><path d="M405 ${y+26}l26 -26M430 ${y+26}l26 -26M455 ${y+26}l26 -26" stroke="${bone}" stroke-width="2"/>`:`<rect x="405" y="${y}" width="60" height="26" rx="10" fill="${mint}"/>`}`;}).join('')+text(155,42,'Before injury',{anchor:'middle'})+text(445,42,'Possible repair outcome',{anchor:'middle',size:20})+arrow(280,170,320,170)+text(300,325,severe||tissue===1?'Scar does not generate muscle force':'Repair capacity varies with tissue and damage',{size:19,anchor:'middle'}));
 root.innerHTML=`<h3>Repair is different from replacement by scar.</h3><div class="muscle-lab"><div class="muscle-lab-visual">${drawing}</div><div><label for="repair-tissue">Tissue</label><select id="repair-tissue">${repairProfiles.map((x,i)=>`<option value="${i}" ${i===tissue?'selected':''}>${x.name} muscle</option>`).join('')}</select><label><input type="checkbox" id="repair-severe" ${severe?'checked':''}> Substantial muscle loss</label><h4>${p.cells}</h4><p>${p.detail}</p><p class="tiny">The possible outcome shown illustrates a distinction, not a prediction for an injury.</p><p class="flow-question">${question}</p></div></div>${credit}`;
 root.querySelector('#repair-tissue').onchange=ev=>{tissue=+ev.target.value;render();};root.querySelector('#repair-severe').onchange=ev=>{severe=ev.target.checked;render();};askTutor(root);}
 render();
}
const development=[['Myoblasts','Embryonic muscle-forming cells each contain a nucleus.'],['Cells fuse','Multiple myoblasts fuse, creating a developing skeletal myotube.'],['A multinucleated fiber','The contributing nuclei remain within one continuous muscle-cell cytoplasm.'],['Limited repair support','Satellite cells can support later skeletal-fiber repair. Developmental fusion is distinct from ordinary hypertrophy.']];
const metabolism=[['Stored ATP','A small local ATP supply supports immediate activity but must be replenished.'],['Creatine phosphate','Creatine phosphate can transfer phosphate to ADP rapidly to regenerate ATP.'],['Glycolysis','Glycolysis regenerates ATP quickly but with a smaller yield per glucose than aerobic metabolism.'],['Aerobic pathways','Mitochondria use oxygen-dependent pathways to sustain ATP supply, with substrate and oxygen availability affecting capacity.']];
export function renderAdditionalMuscleActivity(root,id){
 if(id==='coupling')sequence(root,{id:'excitation-contraction-route',title:'Follow the signal, then return calcium.',reference:'10.2',steps:couplingEvents,question:'Does acetylcholine travel through the T-tubules to bind troponin?',hint:'Distinguish the neurotransmitter, electrical signal and calcium ion.',answer:'No. Acetylcholine acts at the motor end-plate. A muscle action potential travels through T-tubules; calcium released from the SR binds troponin.'});
 else if(id==='metabolism')sequence(root,{id:'muscle-atp-sources',title:'Different routes replenish the same ATP supply.',reference:'10.3',steps:metabolism,parallel:true,question:'Does aerobic metabolism remain completely off during a brief intense effort?',hint:'These routes overlap; their relative contributions change.',answer:'No. ATP-regenerating pathways overlap. Duration, intensity, oxygen delivery and available fuels change their relative contributions; they do not switch at exact universal times.'});
 else if(id==='fibers')fibers(root);
 else if(id==='recruitment')motorUnits(root);
 else if(id==='length-tension')lengthTension(root);
 else if(id==='smooth-regulation')sequence(root,{id:'smooth-regulation',title:'Calcium activates a different regulator.',reference:'10.8',steps:smoothEvents,question:'Why would “calcium binds troponin” be the wrong explanation for smooth-muscle regulation?',hint:'Name the calcium-binding protein and the enzyme it activates.',answer:'Smooth muscle uses calcium–calmodulin to activate MLCK, which phosphorylates myosin light chains. It does not use the skeletal troponin-based regulatory mechanism.'});
 else if(id==='smooth-coupling')smoothCoupling(root);
 else if(id==='development')sequence(root,{id:'skeletal-muscle-development',title:'Many myoblasts contribute to one fiber.',reference:'10.9',steps:development,question:'Why can a skeletal muscle fiber contain many nuclei?',hint:'Consider what is retained when several cells fuse.',answer:'Many myoblasts fuse into one developing myotube while retaining their nuclei. This differs from enlargement of an existing fiber during hypertrophy.'});
 else if(id==='repair')repair(root);
 else return false;
 return true;
}
