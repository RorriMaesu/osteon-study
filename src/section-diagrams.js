import {plates} from './representations.js';
import {sectionPlates} from './section-plates.js';
import {foundationsVisuals} from './visual-foundations.js';
import {systemsVisuals} from './visual-systems.js';

const diagrams={...foundationsVisuals,...systemsVisuals};
export const newVisualSections=[...new Set([...Object.keys(diagrams),...Object.keys(sectionPlates)])].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
// Sections with a dedicated visual in their original activity renderer.
const existingVisualSections=[
 '1.2','1.6','2.1','3.1','3.2','3.3','3.4','3.5','3.6',
 '4.1','4.2','4.3','4.4','4.5','4.6','5.2','6.3','6.5','6.7','9.5','10.1','10.2','10.3','10.4','10.7'
];
export const interactiveSections=new Set([...existingVisualSections,...newVisualSections]);
let serial=0;
const palette={paper:'#10252c',ink:'#dfefe3',mint:'#a9dcc2',blue:'#9ed9ef',gold:'#ffbf91',rose:'#f08c94',muted:'#79948e'};
const colors=[palette.mint,palette.gold,palette.blue,palette.rose];

function flowArt(labels,active,e,sequence){
 const count=labels.length,dx=432/count,w=Math.min(95,dx-13);
 return labels.map((label,i)=>{
  const x=24+dx*(i+.5),y=124;
  const state=i===active?'#ffbf91':i<active?'#a9dcc2':'#83a39a';
  const words=label.split('|');
  return `${sequence&&i<count-1?`<path d="M${x+w/2+2} ${y}H${x+dx-w/2-6}" stroke="#83a39a" stroke-width="3"/><path d="m${x+dx-w/2-12} ${y-5} 6 5-6 5" fill="none" stroke="#83a39a" stroke-width="2"/>`:''}<rect x="${x-w/2}" y="83" width="${w}" height="83" rx="12" fill="#1a353d" stroke="${state}" stroke-width="${i===active?3:1.5}"/><text x="${x}" y="106" text-anchor="middle" fill="${state}" font-size="17" font-weight="700">${i+1}</text><text x="${x}" y="${words.length===1?135:126}" text-anchor="middle" fill="#e5f2e9" font-size="13">${words.map((word,n)=>`<tspan x="${x}" dy="${n?17:0}">${e(word)}</tspan>`).join('')}</text>`;
 }).join('');
}

function comparisonArt(rows,e){
 return rows.map(([label,value,tone],i)=>{
  const y=56+i*47,color=colors[tone??i]||palette.mint;
  return `<text x="26" y="${y+5}" fill="#e1efe5" font-size="14">${e(label)}</text><rect x="169" y="${y-10}" width="264" height="18" rx="6" fill="#244049"/><rect x="169" y="${y-10}" width="${value*66}" height="18" rx="6" fill="${color}"/>`;
 }).join('')+'<text x="169" y="222" fill="#aac9c0" font-size="12">Lower</text><text x="433" y="222" fill="#aac9c0" text-anchor="end" font-size="12">Higher · qualitative</text>';
}

function sceneArt(topic,index,e){
 const state=topic.states[index];
 if(typeof topic.art==='function')return topic.art(index,palette);
 if(topic.art==='bars')return comparisonArt(state[2],e);
 return flowArt(topic.states.map(s=>s[2]||s[0]),index,e,topic.art==='sequence');
}

function renderSchematic(root,topic,section,e){
 let index=0;
 root.innerHTML=`<div class="section-diagram-tabs" role="group" aria-label="${e(topic.title)} views"><label class="section-diagram-state-picker">Diagram view <select data-diagram-state-select>${topic.states.map(([name],i)=>`<option value="${i}">${e(name)}</option>`).join('')}</select></label>${topic.states.map(([name],i)=>`<button type="button" data-diagram-state="${i}" aria-pressed="false">${e(name)}</button>`).join('')}</div><div class="section-diagram-layout"><figure class="section-diagram-media"><svg viewBox="0 0 480 250" role="img" xmlns="http://www.w3.org/2000/svg"></svg><figcaption>Osteon teaching schematic · OpenStax §${section}${topic.art==='bars'?' · qualitative comparison':''}.</figcaption></figure><div class="section-diagram-note" role="status" aria-live="polite"></div></div>`;
 const svg=root.querySelector('svg'),note=root.querySelector('.section-diagram-note'),picker=root.querySelector('[data-diagram-state-select]'),buttons=[...root.querySelectorAll('[data-diagram-state]')];
 function select(i){
  index=i;const [name,explanation]=topic.states[index];
  svg.setAttribute('aria-label',topic.title+': '+name);
  svg.innerHTML=`<rect width="480" height="250" rx="13" fill="${palette.paper}"/>${sceneArt(topic,index,e)}`;
  note.innerHTML=`<h4>${e(name)}</h4><p>${e(explanation)}</p>`;
  picker.value=String(index);
  buttons.forEach((b,n)=>b.setAttribute('aria-pressed',String(n===index)));
 }
 buttons.forEach((b,i)=>b.onclick=()=>select(i));
 picker.onchange=()=>select(+picker.value);
 select(0);
}

function renderPlate(root,config,e){
 let index=0,selected=-1;
 function draw(restore){
  const [key,label]=config.views[index],plate=plates[key],crop=plate.crop,point=plate.points[selected],radius=Math.max(5,Math.min(crop[2],crop[3])*.022),clip='lesson-plate-'+(++serial);
  const isInside=([,x,y])=>x>=crop[0]&&x<=crop[0]+crop[2]&&y>=crop[1]&&y<=crop[1]+crop[3];
  const selector=plate.points.map((item,i)=>isInside(item)?`<option value="${i}" ${i===selected?'selected':''}>${e(item[0])}</option>`:'').join('');
  root.innerHTML=`<div class="section-diagram-tabs"><label>Source view <select data-diagram-view>${config.views.map(([,name],i)=>`<option value="${i}" ${i===index?'selected':''}>${e(name)}</option>`).join('')}</select></label>${selector?`<label>Find a structure <select data-diagram-point><option value="-1">Choose a structure</option>${selector}</select></label>`:''}</div><div class="section-diagram-layout"><figure class="section-diagram-media section-diagram-source"><svg viewBox="${crop.join(' ')}" role="img" aria-label="${e(plate.title+(point?' · '+point[0]:''))}" xmlns="http://www.w3.org/2000/svg"><defs><clipPath id="${clip}"><rect x="${crop[0]}" y="${crop[1]}" width="${crop[2]}" height="${crop[3]}"/></clipPath></defs><g clip-path="url(#${clip})"><image href="assets/figures/${e(plate.image||key)}.jpg" width="${plate.size[0]}" height="${plate.size[1]}"/>${(plate.masks||[]).map(([x,y,w,h])=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="white"/>`).join('')}${point?`<circle cx="${point[1]}" cy="${point[2]}" r="${radius}" fill="none" stroke="#173831" stroke-width="${radius*.63}"/><circle cx="${point[1]}" cy="${point[2]}" r="${radius}" fill="none" stroke="#ffba74" stroke-width="${radius*.31}"/><circle cx="${point[1]}" cy="${point[2]}" r="${radius*.24}" fill="#173831"/>`:''}</g></svg><figcaption>OpenStax A&P 2e · Figure ${e(plate.figure)} · Rice University · CC BY-NC-SA 4.0 · adapted crop.</figcaption></figure><div class="section-diagram-note" role="status"><h4>${e(point?.[0]||label)}</h4><p>${e(config.lead)}</p></div></div>`;
  root.querySelector('[data-diagram-view]').onchange=event=>{index=+event.target.value;selected=-1;draw('[data-diagram-view]');};
  const select=root.querySelector('[data-diagram-point]');
  if(select)select.onchange=event=>{selected=+event.target.value;draw('[data-diagram-point]');};
  if(restore)root.querySelector(restore)?.focus({preventScroll:true});
 }
 draw();
}

export function renderSectionDiagrams(root,section,e,practice){
 const schematic=diagrams[section],source=sectionPlates[section];
 if(!schematic&&!source)return false;
 const tabs=[...(schematic?[['diagram','Interactive diagram']]:[]),...(source?[['plates','Locate structures']]:[]),['practice','Guided practice']];
 root.innerHTML=`<nav class="section-diagram-tabs section-diagram-nav" aria-label="Lesson activities">${tabs.map(([id,name])=>`<button type="button" data-diagram-tab="${id}" aria-pressed="false">${name}</button>`).join('')}</nav><div class="section-diagram-content"></div>`;
 const content=root.querySelector('.section-diagram-content'),buttons=[...root.querySelectorAll('[data-diagram-tab]')];
 function show(id){
  buttons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.diagramTab===id)));
  if(id==='practice'){practice(content);return;}
  const current=id==='plates'?source:schematic;
  content.innerHTML=`<h3>${e(current.title)}</h3><div class="section-diagram-body"></div>`;
  const body=content.lastElementChild;
  if(id==='plates')renderPlate(body,current,e);else renderSchematic(body,current,section,e);
 }
 buttons.forEach(b=>b.onclick=()=>show(b.dataset.diagramTab));
 show(tabs[0][0]);
 return true;
}

export function diagramSourceKeys(){return [...new Set(Object.values(sectionPlates).flatMap(({views})=>views.map(([key])=>key)))];}
