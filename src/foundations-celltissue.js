import {renderLab,bindLab} from './cell-labs.js';
import {lab,labOptions} from './tissue-labs.js';
import {figures} from './legacy-tissue-figures.js';
import data from './foundations-celltissue-visuals.json' with {type:'json'};

const path='assets/foundations/';
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const options=(rows,selected)=>rows.map(([id,label])=>`<option value="${escape(id)}" ${id===selected?'selected':''}>${escape(label)}</option>`).join('');
function cellDiagram(d,index){
 const point=d.targets[index];
 if(!point)return d.svg;
 const x=point.x*8,y=point.y*5.2;
 const marker=`<circle cx="${x}" cy="${y}" r="12" fill="none" stroke="#ffb081" stroke-width="5"/><circle cx="${x}" cy="${y}" r="3" fill="#ffb081"/>`;
 return d.svg.replace('</svg>',marker+'</svg>');
}
function specimenFigure(s,visible,exam=false){
 return `<figure class="${exam?'exam-figure ':''}foundation-figure"><img src="${path}chapter4/${s.src.replace('assets/','')}" alt="${visible?escape(s.name):'Unlabeled textbook tissue micrograph'}" loading="lazy"><figcaption>${escape(s.credit)} · Textbook practice specimen.</figcaption></figure>`;
}
export function cellTissueExamFigure(name,target){
 if(name.startsWith('cell:')){
  const d=data.diagrams[name.slice(5)];
  return d?`<figure class="exam-figure">${cellDiagram(d,target)}<figcaption>Cell Studio schematic. Identify the orange target. Simplified, with details shown at different scales.</figcaption></figure>`:'';
 }
 if(name.startsWith('tissue-specimen:')){
  const s=data.specimens.find(s=>s.id===name.slice(16));
  return s?specimenFigure(s,false,true):'';
 }
 if(name.startsWith('tissue-diagram:')&&target){
  const d=lab(target.module,{...target,labels:false});
  return `<figure class="exam-figure">${d.svg}<figcaption>${escape(d.figure.credit)}</figcaption></figure>`;
 }
 return '';
}

const writtenHTML=items=>items.map(q=>`<details class="result-detail"><summary>${escape(q.stem)}</summary><p>Write or say your answer, then compare it with this checklist.</p><ul>${q.rubric.map(t=>`<li>${escape(t)}</li>`).join('')}</ul></details>`).join('');
const player=`<h3>Protein synthesis in two minutes</h3><video class="foundation-video" controls playsinline preload="none" poster="${path}chapter3/protein-synthesis-poster.webp"><source src="${path}chapter3/protein-synthesis.mp4" type="video/mp4"><track kind="captions" label="English" srclang="en" src="${path}chapter3/protein-synthesis.en.vtt" default><track kind="chapters" label="Scenes" srclang="en" src="${path}chapter3/protein-synthesis.chapters.vtt"></video><details><summary>Read the worked example</summary><p>Transcription reads the DNA template 3′–TAC CCG AAA ACT–5′ to make mRNA 5′–AUG GGC UUU UGA–3′. A ribosome reads the mRNA in that direction. Matching tRNAs carry methionine, glycine and phenylalanine. A release factor recognizes UGA, and the peptide is released. The longer chain shown later illustrates folding.</p></details><p class="tiny">Original animation from Soma Cell Studio. CC BY-NC-SA 4.0.</p>`;

export function renderCellTissueActivity(root,section){
 const cell=data.cell[section], tissue=data.tissue[section];
 if(!cell&&!tissue)return false;
 root.classList.add('foundation-studio');
 const diagrams=Object.entries(data.diagrams).filter(([id])=>id.startsWith(cell+'-'));
 const refs=cell?data.references.filter(f=>f.section===cell):figures.filter(f=>f.module===tissue);
 const specimens=data.specimens.filter(s=>s.module===tissue);
 const written=data.written[section]||[];
 const views={lab:'Activity',...(diagrams.length?{schematic:'Cell diagrams'}:{}),...(refs.length?{figures:'Textbook figures'}:{}),...(specimens.length?{specimens:'Microscope'}:{}),...(section==='3.4'?{video:'Watch animation'}:{}),...(written.length?{written:'Written practice'}:{})};
 let view='lab',diagram=diagrams[0]?.[0],point=0,ref=0,specimen=0,reveal=false;
 const state=tissue?{mode:labOptions[tissue][0][0],step:0,labels:true,detail:false}:{};
 function drawBody(){
  root.innerHTML=`<div class="control-row" aria-label="Studio activities">${Object.entries(views).map(([id,label])=>`<button type="button" data-foundation-view="${id}" aria-pressed="${id===view}">${label}</button>`).join('')}</div><div class="foundation-studio-content"></div>`;
  const panel=root.querySelector('.foundation-studio-content');
  const on=(id,fn)=>panel.querySelector(id)?.addEventListener('change',fn);
  if(view==='lab'&&cell){panel.innerHTML=renderLab(cell);bindLab(panel,cell);}
  if(view==='lab'&&tissue){
   const item=lab(tissue,state);
   panel.innerHTML=`<div class="control-row"><label>Topic <select data-studio-mode>${options(labOptions[tissue],state.mode)}</select></label><label><input type="checkbox" data-studio-labels ${state.labels?'checked':''}> Focus overlay</label><label><input type="checkbox" data-studio-detail ${state.detail?'checked':''}> Detail crop</label></div><div class="control-row">${item.controls}</div><div class="foundation-tissue-layout"><figure>${item.svg}<figcaption>${escape(item.figure.credit)}</figcaption></figure><div aria-live="polite"><h3>${escape(item.title)}</h3><p>${escape(item.caption)}</p><p><b>Predict:</b> ${escape(item.question)}</p>${section==='4.1'?'<p><a href="#lesson-1.6">Compare cavities and membranes in §1.6</a></p>':''}</div></div>`;
   on('[data-studio-mode]',ev=>{state.mode=ev.target.value;state.step=0;draw();});
   for(const key of ['labels','detail'])on('[data-studio-'+key+']',ev=>{state[key]=ev.target.checked;draw();});
   for(const key of ['layers','shape','secretion'])on('#'+key,ev=>{state[key]=ev.target.value;draw();});
   panel.querySelectorAll('[data-tour-step]').forEach(b=>b.onclick=()=>{state.step=+b.dataset.tourStep;draw();});
  }
  if(view==='schematic'){
   const d=data.diagrams[diagram],target=d.targets[point];
   panel.innerHTML=`<div class="control-row"><label>Diagram <select id="cell-diagram">${options(diagrams.map(([id,v])=>[id,v.title]),diagram)}</select></label><label>Structure <select id="cell-target">${options(d.targets.map((t,i)=>[i,t.name]),point)}</select></label></div><div class="foundation-tissue-layout"><figure>${cellDiagram(d,point)}<figcaption>${escape(d.source)}</figcaption></figure><div aria-live="polite"><h3>${escape(target.name)}</h3><p>${escape(target.description)}</p><p class="tiny">${escape(d.description)}</p></div></div>`;
   on('#cell-diagram',ev=>{diagram=ev.target.value;point=0;draw();});on('#cell-target',ev=>{point=+ev.target.value;draw();});
  }
  if(view==='figures'){
   const f=refs[ref],src=cell?path+'chapter3/'+f.file.replace('assets/',''):f.src;
   panel.innerHTML=`<label>Figure <select id="studio-figure">${options(refs.map((f,i)=>[i,f.title]),ref)}</select></label><figure class="foundation-figure"><a href="${escape(src)}" target="_blank" rel="noopener"><img src="${escape(src)}" alt="${escape(f.title)}" loading="lazy"></a><figcaption>${escape(f.credit||f.caption+' OpenStax A&P 2e · CC BY-NC-SA 4.0.')}</figcaption></figure>`;
   on('#studio-figure',ev=>{ref=+ev.target.value;draw();});
  }
  if(view==='specimens'){
   const s=specimens[specimen];
   panel.innerHTML=`<div class="control-row"><label>Specimen <select id="studio-specimen">${options(specimens.map((_,i)=>[i,'Specimen '+(i+1)]),specimen)}</select></label><button id="studio-reveal" aria-pressed="${reveal}">${reveal?'Hide identification':'Reveal identification'}</button></div><div class="foundation-tissue-layout">${specimenFigure(s,reveal)}<div aria-live="polite">${reveal?`<h3>${escape(s.name)}</h3><p>${escape(s.evidence)}</p><p>${escape(s.contrast)}</p>`:'<p>Inspect fiber orientation, cell shape, nuclei and staining. Describe the evidence before revealing the identification.</p>'}</div></div>`;
   on('#studio-specimen',ev=>{specimen=+ev.target.value;reveal=false;draw();});
   panel.querySelector('#studio-reveal').onclick=()=>{reveal=!reveal;draw();};
  }
  if(view==='video')panel.innerHTML=player;
  if(view==='written')panel.innerHTML='<h3>Explain it in your own words.</h3>'+writtenHTML(written);
  root.querySelectorAll('[data-foundation-view]').forEach(button=>button.onclick=()=>{view=button.dataset.foundationView;draw();});
 }
 function draw(){
  const a=document.activeElement,keys=['data-foundation-view','data-tour-step','data-studio-mode','data-studio-labels','data-studio-detail'];
  const key=a&&keys.find(k=>a.hasAttribute(k)), selector=a?.id?'#'+CSS.escape(a.id):key?`[${key}="${CSS.escape(a.getAttribute(key))}"]`:'';
  drawBody();
  if(selector)root.querySelector(selector)?.focus({preventScroll:true});
 }
 draw();
 return true;
}
