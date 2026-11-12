import {chapter11Muscles} from './chapter11-muscles.js';
import {muscleFigureTitle} from './muscle-textbook.js';
import {setDiagramLearningContext} from './learning-context.js';

export function renderChapter11Activity(root, lesson, e, {openFigure,openAtlas}) {
 root.closest('.flow-body')?.classList.add('muscle-interactive-step');
 if (lesson.id==='11.1') { renderLever(root,lesson); return; }
 if (lesson.id==='11.2') { renderNames(root,lesson,e); return; }
 const available=chapter11Muscles.filter(card=>card.section===lesson.id);
 let scope='course', active=0, query='', recall=false, revealed=false;
 root.innerHTML=`<h3>Muscle cards</h3><div class="control-row muscle-card-filters">
  <label for="muscle-card-scope">Study set</label><select id="muscle-card-scope"><option value="course">Course checklist</option><option value="all">All cards in this section</option></select>
  <label class="sr-only" for="muscle-card-search">Find a muscle card</label><input type="search" id="muscle-card-search" placeholder="Find a muscle or action"></div>
  <div data-muscle-card-body></div>`;
 const body=root.querySelector('[data-muscle-card-body]');
 function render() {
  const items=available.filter(card=>(scope==='all'||card.courseChecklist)&&
   [card.name,card.action,card.location,...(card.aliases||[])].join(' ').toLowerCase().includes(query));
  active=Math.min(active,Math.max(0,items.length-1));
  const card=items[active];
  if(!card){body.innerHTML='<p>No matching cards. Try another search or study set.</p>';return;}
  const facts=[['Location',card.location],['Main action',card.action],['General origin',card.origin],['General insertion',card.insertion]];
  const figure=card.figures?.find(number=>lesson.syllabus.figures.some(f=>f.number===number));
  const show=!recall||revealed;
  body.innerHTML=`<div class="control-row muscle-card-navigation">
   <button type="button" data-card-prev aria-label="Previous muscle" ${active===0?'disabled':''}>←</button>
   <label class="sr-only" for="muscle-card-select">Choose a muscle card</label><select id="muscle-card-select">${items.map((item,i)=>`<option value="${i}" ${i===active?'selected':''}>${e(item.name)}</option>`).join('')}</select>
   <button type="button" data-card-next aria-label="Next muscle" ${active===items.length-1?'disabled':''}>→</button><span class="tiny">${active+1} / ${items.length}</span>
   <button type="button" data-card-recall aria-pressed="${recall}">${recall?'End recall':'Recall action and attachments'}</button></div>
   <article class="muscle-study-card"><h4>${e(card.name)}</h4>
   ${show?`<dl>${facts.map(([label,text])=>`<div><dt>${label}</dt><dd>${e(text)}</dd></div>`).join('')}</dl>`:
    '<p>Say where it lies, its main action, and both general attachment sites. Then check your answer.</p><button type="button" data-card-reveal>Reveal card</button>'}
   <div class="control-row">${figure?`<button type="button" data-card-figure>Figure ${figure} · ${e(muscleFigureTitle(figure))} ↗</button>`:''}
   ${card.region?`<button type="button" data-card-atlas>Open 3D region ↗</button>`:''}<button type="button" data-card-tutor>Ask the tutor</button></div></article>`;
  function advance(to,selector){active=to;revealed=false;render();(body.querySelector(selector)?.disabled?body.querySelector('#muscle-card-select'):body.querySelector(selector))?.focus();}
  body.querySelector('[data-card-prev]').onclick=()=>advance(active-1,'[data-card-prev]');
  body.querySelector('[data-card-next]').onclick=()=>advance(active+1,'[data-card-next]');
  body.querySelector('#muscle-card-select').onchange=ev=>advance(+ev.target.value,'#muscle-card-select');
  body.querySelector('[data-card-recall]').onclick=()=>{recall=!recall;revealed=false;render();body.querySelector('[data-card-recall]').focus();};
  const reveal=body.querySelector('[data-card-reveal]');
  if(reveal)reveal.onclick=()=>{revealed=true;render();body.querySelector('[data-card-recall]').focus();};
  if(figure)body.querySelector('[data-card-figure]').onclick=()=>openFigure(figure);
  if(card.region)body.querySelector('[data-card-atlas]').onclick=()=>openAtlas(card.region);
  body.querySelector('[data-card-tutor]').onclick=()=>document.getElementById('tutor-launch')?.click();
  setDiagramLearningContext({id:card.id,title:card.name,reference:lesson.id,
   state:{card:card.name,mode:recall?'recall':'study'},question:card.guidePrompt||'What does this structure do, and which regions does it connect?',
   hint:'Think about the joint it crosses and the direction of its pull.',
   answer:facts.map(([label,text])=>label+' — '+text).join(' '),
   facts:facts.map(([label,text])=>label+' — '+text)});
 }
 root.querySelector('#muscle-card-scope').onchange=ev=>{scope=ev.target.value;active=0;revealed=false;render();};
 root.querySelector('#muscle-card-search').oninput=ev=>{query=ev.target.value.trim().toLowerCase();active=0;revealed=false;render();};
 render();
}

const levers=[
 {name:'First class · head balance',effort:100,load:-110,limits:[45,150],fact:'The fulcrum lies between effort and load.'},
 {name:'Second class · heel raise',effort:216,load:107,limits:[168,245],fact:'The load lies between fulcrum and effort.'},
 {name:'Third class · elbow flexion',effort:70,load:204,limits:[30,150],fact:'The effort lies between fulcrum and load.'},
];
function renderLever(root,lesson) {
 let index=2;
 let effort=levers[index].effort;
 root.innerHTML=`<h3>Where is the force applied?</h3><div class="control-row"><label for="lever-type">Lever example</label><select id="lever-type">${levers.map((lever,i)=>`<option value="${i}" ${i===index?'selected':''}>${lever.name}</option>`).join('')}</select></div>
 <div class="muscle-lab"><div class="muscle-lab-visual" data-lever-picture></div><div>
 <p>Predict what happens to the effort needed when the muscle pulls farther from the joint.</p>
 <label for="lever-effort">Move the effort farther from the fulcrum</label><input type="range" id="lever-effort"><p data-lever-result aria-live="polite"></p>
 <p class="tiny">This schematic assumes perpendicular forces and a fixed load. Distances and forces use relative units.</p></div></div>`;
 const slider=root.querySelector('#lever-effort');
 function paint(){
  const item=levers[index], fulcrum=index===0?170:57;
  const ratio=Math.abs(item.load)/effort;
  const ex=fulcrum+effort,lx=fulcrum+item.load;
  const loadUp=index!==0;
  root.querySelector('[data-lever-picture]').innerHTML=`<svg viewBox="0 0 390 150" role="img" aria-label="${item.fact} Effort arm ${effort}; load arm ${Math.abs(item.load)}.">
   <line x1="30" x2="360" y1="82" y2="82" stroke="#d6e7d5" stroke-width="8" stroke-linecap="round"/>
   <path d="M${fulcrum-12} 108 L${fulcrum} 87 L${fulcrum+12} 108Z" fill="#f3ae87"/><text x="${fulcrum}" y="135" text-anchor="middle" fill="#e9f2ea">Fulcrum</text>
   <path d="M${ex} ${loadUp?121:36}V${loadUp?89:75}" stroke="#8eddbb" stroke-width="5"/><circle cx="${ex}" cy="82" r="6" fill="#8eddbb"/><text x="${ex}" y="${loadUp?145:25}" text-anchor="middle" fill="#8eddbb">Effort</text>
   <path d="M${lx} 38V74" stroke="#f3ae87" stroke-width="5"/><circle cx="${lx}" cy="82" r="6" fill="#f3ae87"/><text x="${lx}" y="25" text-anchor="middle" fill="#f3ae87">Load</text></svg>`;
  root.querySelector('[data-lever-result]').textContent=item.fact+' Balancing effort is '+ratio.toFixed(2)+' times the load.';
  setDiagramLearningContext({id:'muscle-levers',title:item.name,reference:lesson.id,state:{effortArm:effort,loadArm:Math.abs(item.load)},
   question:'How does increasing the effort arm change the force required to balance the load?',
   hint:'Compare the same load torque with the two effort distances.',
   answer:'A longer effort arm needs less force to supply the same torque.',facts:[item.fact,'Torque equals force times its perpendicular moment arm.']});
 }
 function configure(){const item=levers[index];[slider.min,slider.max]=item.limits;slider.value=effort;paint();}
 root.querySelector('#lever-type').onchange=ev=>{index=+ev.target.value;effort=levers[index].effort;configure();};
 slider.oninput=()=>{effort=+slider.value;paint();};
 configure();
}

const names=[
 ['Flexor digitorum profundus',[['Flexor','bends a joint'],['Digitorum','of the digits'],['Profundus','deep']],'Deep finger flexor. Compare its position with flexor digitorum superficialis.'],
 ['Sternocleidomastoid',[['Sterno','sternum'],['Cleido','clavicle'],['Mastoid','mastoid process']],'The name lists attachments at the sternum, clavicle and mastoid process.'],
 ['Extensor hallucis longus',[['Extensor','straightens a joint'],['Hallucis','of the great toe'],['Longus','long']],'Long extensor of the great toe. Pollicis would refer to the thumb.'],
 ['Tibialis anterior',[['Tibialis','near the tibia'],['Anterior','toward the front']],'A muscle along the front of the leg, next to the tibia.'],
];
function renderNames(root,lesson,e) {
 let current=0;
 root.innerHTML=`<h3>Decode the name</h3><div class="control-row"><label for="muscle-name-example">Example</label><select id="muscle-name-example">${names.map(([name],i)=>`<option value="${i}">${e(name)}</option>`).join('')}</select></div><div data-word-parts></div>`;
 function render(){
  const [name,parts,explanation]=names[current];
  const region=root.querySelector('[data-word-parts]');
  region.innerHTML=`<p>Predict what each part describes. Choose a word to check.</p><div class="control-row">${parts.map(([word],i)=>`<button data-name-part="${i}" type="button" aria-pressed="false">${e(word)}</button>`).join('')}</div><p data-name-meaning aria-live="polite"></p><details><summary>Read the complete interpretation</summary><p>${e(explanation)}</p></details>`;
  region.querySelectorAll('[data-name-part]').forEach(button=>button.onclick=()=>{
   const [word,meaning]=parts[Number(button.dataset.namePart)];
   region.querySelectorAll('[data-name-part]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
   region.querySelector('[data-name-meaning]').textContent=word+' means '+meaning+'.';
   setDiagramLearningContext({id:'muscle-name',title:name,reference:lesson.id,state:{selected:word},question:'What does '+word+' tell you about this muscle?',answer:meaning,facts:[explanation]});
  });
  setDiagramLearningContext({id:'muscle-name',title:name,reference:lesson.id,state:{example:name},question:'What can you infer from the parts of '+name+'?',answer:explanation,facts:parts.map(([word,meaning])=>word+' means '+meaning+'.')});
 }
 root.querySelector('#muscle-name-example').onchange=ev=>{current=+ev.target.value;render();};
 render();
}
