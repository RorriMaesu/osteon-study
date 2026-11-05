import {shuffle} from './storage.js';
import {fractureSVG,repairSVG,anatomySVG,stageNames} from './fracture-diagrams.js';
import fracture from './fracture-lab-data.json' with {type:'json'};

const patterns={
 transverse:'The fracture line crosses the long axis at about a right angle.',
 oblique:'The fracture line crosses the long axis at a slant.',
 spiral:'A twisting fracture line wraps around the shaft.',
 comminuted:'The bone breaks into multiple fragments.',
 impacted:'Compression drives a fragment into another fragment.',
 greenstick:'An incomplete break affects one side of the bone.',
 open:'A wound communicates with the fracture. The bone need not be visible through the skin.',
 closed:'The skin barrier remains intact over the fracture.'
};
const stages=[
 ['hematoma','Early response','Disrupted vessels bleed into the fracture area. Blood clots and the fracture hematoma forms.','Look for the gap and disrupted blood supply.'],
 ['callus','Temporary bridge','An internal fibrocartilaginous bridge and an external cartilage-and-bone collar stabilize the area.','Find the internal bridge and the external collar.'],
 ['bony','Replacement with bone','Osteoclasts resorb dead tissue and osteoblasts contribute new matrix. Endochondral ossification replaces callus cartilage with trabecular bone.','Identify where the bony bridge spans the break.'],
 ['remodeled','Later repair','Resorption and formation reshape the repair region. Compact bone and the marrow space reorganize over time.','Compare the outline with the earlier, thicker callus.']
];
export function fractureExamFigure(name,target){
 if(!name.startsWith('fracture:'))return '';
 const key=name.slice(9);
 let svg=key==='anatomy'?anatomySVG():stages.some(([id])=>id===key)?repairSVG(key,{targets:!!target}):fractureSVG(key);
 if(target&&target!=='all'){
  const coord=key==='anatomy'?{1:[76,54],2:[76,214],3:[76,382],4:[293,246],5:[293,313],6:[293,87]}:{1:[93,155],2:[180,156],3:[177,87]};
  const point=coord[target];
  if(point)svg=svg.replace('</svg>',`<circle cx="${point[0]}" cy="${point[1]}" r="21" fill="none" stroke="#efa778" stroke-width="4"/></svg>`);
 }
 return `<figure class="exam-figure fracture-figure">${svg}<figcaption>Fracture Lab schematic · ${target&&target!=='all'?'identify target '+target+' · ':''}OpenStax §6.3–6.5.</figcaption></figure>`;
}
const domains={all:'All bone and fracture topics',patterns:'Fracture patterns',classification:'Classification',repair:'Repair and healing',cells:'Cells and tissues'};
const domainOptions=[...new Set(fracture.bank.map(q=>q.domain))];
export function renderFractureLab(root,section,e){
 if(section!=='6.5')return false;
 root.classList.add('muscle-interactive-step','foundation-studio');
 let view='repair',index=0,pattern='transverse',domain='all',playing=false,timer;
 const stop=()=>{clearTimeout(timer);playing=false;};
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const setView=id=>{stop();view=id;draw();};
 function draw(){
  const stage=stages[index];
  root.innerHTML=`<div class="eyebrow">FRACTURE LAB / §6.5</div><div class="control-row" aria-label="Fracture Lab views">${[['repair','Repair stages'],['patterns','Compare patterns'],['practice','Scored practice'],['written','Written practice']].map(([id,label])=>`<button data-fracture-view="${id}" aria-pressed="${id===view}">${label}</button>`).join('')}</div><div class="foundation-studio-content" id="fracture-content"></div>`;
  const panel=root.querySelector('#fracture-content');
  if(view==='repair'){
   panel.innerHTML=`<div class="control-row" aria-label="Repair stages">${stageNames.map((name,i)=>`<button data-fracture-stage="${i}" aria-pressed="${index===i}">${i+1}. ${name}</button>`).join('')}${reduced?'':`<button id="fracture-play" aria-pressed="${playing}">${playing?'Pause sequence':'Play sequence'}</button>`}</div><div class="foundation-tissue-layout"><figure class="fracture-figure">${repairSVG(stage[0],{label:true,targets:index===1})}<figcaption>${index===1?'1 · External callus, 2 · Internal callus, 3 · Blood vessels.':'Teaching cross-section.'}</figcaption></figure><div aria-live="polite"><div class="eyebrow">STAGE ${index+1} OF 4</div><h3>${stage[1]}</h3><p>${stage[2]}</p><p><b>Look for:</b> ${stage[3]}</p><p class="tiny">Stage timing varies and overlaps.</p></div></div>`;
   panel.querySelectorAll('[data-fracture-stage]').forEach(b=>b.onclick=()=>{stop();index=+b.dataset.fractureStage;draw();root.querySelector('[data-fracture-stage="'+index+'"]').focus({preventScroll:true});});
   const play=panel.querySelector('#fracture-play');
   if(play)play.onclick=()=>{if(playing)stop();else{if(index===stages.length-1)index=0;playing=true;}draw();root.querySelector('#fracture-play')?.focus({preventScroll:true});};
   if(playing)timer=setTimeout(()=>{if(!root.isConnected)return;if(index===stages.length-1)stop();else index++;const hadFocus=document.activeElement?.id==='fracture-play';draw();if(hadFocus)root.querySelector('#fracture-play')?.focus({preventScroll:true});},4200);
  }
  if(view==='patterns'){
   panel.innerHTML=`<label>Fracture pattern or skin status <select id="fracture-pattern">${Object.keys(patterns).map(id=>`<option value="${id}" ${pattern===id?'selected':''}>${id[0].toUpperCase()+id.slice(1)}</option>`).join('')}</select></label><div class="foundation-tissue-layout"><figure class="fracture-figure">${fractureSVG(pattern,{label:true})}</figure><div aria-live="polite"><h3>${pattern[0].toUpperCase()+pattern.slice(1)}</h3><p>${patterns[pattern]}</p><p>A fracture can have a geometric pattern and a skin-status classification at the same time.</p></div></div>`;
   panel.querySelector('select').onchange=ev=>{pattern=ev.target.value;draw();root.querySelector('#fracture-pattern').focus({preventScroll:true});};
  }
  if(view==='practice'||view==='written'){
   panel.innerHTML=`<label>Topic <select id="fracture-topic">${['all',...domainOptions].map(id=>`<option value="${id}" ${domain===id?'selected':''}>${e(domains[id]||id[0].toUpperCase()+id.slice(1))}</option>`).join('')}</select></label><p>${view==='practice'?'Use the normal Practice Lab with hints, grading and progress. Each set draws up to 12 different question families.':'Explain each correction aloud or in writing before opening its scoring rubric.'}</p>`;
   panel.querySelector('select').onchange=ev=>{domain=ev.target.value;draw();root.querySelector('#fracture-topic').focus({preventScroll:true});};
   if(view==='practice'){
    panel.insertAdjacentHTML('beforeend','<button class="primary" id="fracture-start">Start fracture practice ↗</button>');
    panel.querySelector('#fracture-start').onclick=()=>{
     const pool=shuffle(fracture.bank.filter(q=>domain==='all'||q.domain===domain)),families=new Set(),ids=[];
     for(const q of pool){if(families.has(q.family))continue;families.add(q.family);ids.push(q.id);if(ids.length===12)break;}
     document.dispatchEvent(new CustomEvent('exampractice',{detail:ids}));
    };
   }else{
    panel.insertAdjacentHTML('beforeend',fracture.written.filter(q=>domain==='all'||q.domain===domain).map(q=>`<details class="result-detail"><summary>${e(q.prompt)}</summary><ul>${q.rubric.map(part=>`<li>${e(part)}</li>`).join('')}</ul></details>`).join(''));
   }
  }
  root.querySelectorAll('[data-fracture-view]').forEach(b=>b.onclick=()=>{setView(b.dataset.fractureView);root.querySelector('[data-fracture-view="'+view+'"]').focus({preventScroll:true});});
 }
 draw();
 return true;
}
