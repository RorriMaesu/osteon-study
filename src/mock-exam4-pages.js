
const element=(tag,style)=>Object.assign(document.createElement(tag),{className:style});
const textBlock=node=>node?.matches('p,li,blockquote');
const splitChildren=new WeakMap();
function restore(node){
 const parts=splitChildren.get(node);
 if(parts){parts.forEach(restore);node.replaceChildren(...parts);}
}
const children=node=>node?[...node.children]:[];
const field=node=>node?.matches('textarea,input:not([type]),input[type="text"]');
const group=(title,...blocks)=>({title,blocks:blocks.flat().filter(Boolean)});

function title(text,tag='h2'){
 const node=document.createElement(tag);
 node.textContent=text;
 return node;
}

function plainList(items){
 return items.map(item=>{
  const p=document.createElement('p');p.textContent=item.textContent;return p;
 });
}

function groupDetails(node){
 const head=node.querySelector('summary');
 return group(head.textContent,title(head.textContent,'h3'),children(node).slice(1).flatMap(child=>child.matches('ul,ol')?plainList(children(child)):[child]));
}

export function mountMock4Pages(frame,groups,{pinned=[],start}={}){
 const area=element('div','mock4-page-area'),measure=element('div','mock4-measure');
 measure.setAttribute('aria-hidden','true');
 const nav=element('nav','mock4-page-nav');
 nav.setAttribute('aria-label','Screen pages');
 nav.innerHTML='<button type="button" aria-label="Previous screen page">←</button><select aria-label="Screen page"></select><button type="button" aria-label="Next screen page">→</button>';
 const [previous,select,next]=nav.children;
 const destinations={Diagram:'Diagram',Answer:'Answer',Prompt:'Prompt','Write answer':'Write answer'};
 frame.classList.add('mock4-frame');
 frame.replaceChildren(area,nav,...pinned);
 area.append(measure);
 let pages=[],index=0,pending=0,lastWidth,lastHeight,alive=true;

 function show(requested){
  index=Math.max(0,Math.min(requested,pages.length-1));
  const active=document.activeElement;
  const focusMoved=pages.some((page,i)=>i!==index&&page.node.contains(active));
  pages.forEach((page,i)=>{page.node.hidden=i!==index;});
  if(focusMoved)select.focus({preventScroll:true});
  previous.disabled=index===0;
  next.disabled=index===pages.length-1;
  const back=destinations[pages[index-1]?.title],forward=destinations[pages[index+1]?.title];
  previous.textContent=back&&back!==pages[index]?.title?'← '+back:'←';
  next.textContent=forward&&forward!==pages[index]?.title?forward+' →':'→';
  select.value=String(index);
  const options=[...(pages[index]?.node.querySelectorAll('[data-mock-option]')||[])];
  if(options.length&&!options.some(option=>option.tabIndex===0))options[0].tabIndex=0;
 }
 previous.onclick=()=>show(index-1);
 next.onclick=()=>show(index+1);
 select.onchange=()=>show(Number(select.value));

 function pack(){
  pending=0;
  if(!alive||!frame.isConnected)return;
  const width=area.clientWidth,height=area.clientHeight;
  if(!width||!height)return;
  frame.style.setProperty('--mock4-page-height',height+'px');
  const focus=document.activeElement;
  if(width===lastWidth&&height===lastHeight)return;
  // Resizing around the keyboard must preserve the focused input and caret.
  if(width===lastWidth&&frame.contains(focus)&&field(focus))return;
  lastWidth=width;lastHeight=height;
  const prior=pages[index],preferred=prior?.title||start?.title;
  const previousOffset=prior?.offset??start?.offset??0;
  const scratch=element('div','mock4-page');
  const built=[];
  measure.replaceChildren(scratch);
  let section,offset;
  const fits=()=>scratch.getBoundingClientRect().height<=height+.5;
  function flush(){
   if(!scratch.childElementCount)return;
   const node=element('section','mock4-page');
   node.tabIndex=-1;
   while(scratch.firstChild)node.append(scratch.firstChild);
   node.querySelectorAll('h2,h3').forEach(h=>h.tabIndex=-1);
   built.push({title:section.title,offset:offset++,node});
  }
  function push(block){
   scratch.append(block);
   if(fits())return;
   block.remove();flush();scratch.append(block);
   if(fits())return;
   if(block.hasAttribute('data-mock4-split')&&block.childElementCount){
    const parts=children(block);
    splitChildren.set(block,parts);
    block.remove();
    if(block.getAttribute('role')==='radiogroup'){
     parts.forEach(part=>{
      const list=block.cloneNode(false);
      list.classList.add('mock4-single-option');
      list.append(part);push(list);
     });
    }else parts.forEach(push);
    return;
   }
   if(textBlock(block)&&block.textContent.trim()){
    const words=block.textContent.match(/\S+\s*|\s+/g)||[];
    block.remove();
    let from=0;
    while(from<words.length){
     const part=block.cloneNode(false);
     part.removeAttribute('id');
     scratch.append(part);
     let low=1,high=words.length-from;
     while(low<high){
      const n=Math.ceil((low+high)/2);
      part.textContent=words.slice(from,from+n).join('');
      if(fits())low=n;else high=n-1;
     }
     part.textContent=words.slice(from,from+low).join('');
     from+=low;
     if(from<words.length)flush();
    }
    return;
   }
   // Large editable controls and diagram panes size against the page itself.
  }
  for(section of groups){
   offset=0;
   // Measure the actual elements so form values and listeners survive a resize.
   for(const block of section.blocks){restore(block);push(block);}
   flush();
  }
  for(const page of pages)page.node.remove();
  pages=built;
  select.replaceChildren(...pages.map(({title:label,offset},i)=>{
   const count=pages.filter(p=>p.title===label).length;
   return new Option(count>1?label+' · '+(offset+1)+'/'+count:label,String(i));
  }));
  for(const page of pages)area.append(page.node);
  nav.style.visibility=pages.length>1?'visible':'hidden';
  const match=pages.findIndex((p,i)=>p.title===preferred&&p.offset>=previousOffset&&(!frame.contains(focus)||!pages.some(other=>other.node.contains(focus))||p.node.contains(focus)));
  const focused=pages.findIndex(p=>p.node.contains(focus));
  show(focused>=0?focused:match>=0?match:Math.min(index,pages.length-1));
  if(focused>=0&&document.activeElement!==focus)focus.focus({preventScroll:true});
 }
 const refresh=()=>{if(!pending&&alive)pending=requestAnimationFrame(pack);};
 const viewport=window.visualViewport;
 function fitViewport(){
  if(viewport?.scale!==1)return;
  const keyboard=viewport.height+80<window.innerHeight;
  document.body.toggleAttribute('data-mock4-keyboard',keyboard);
  document.documentElement.style.setProperty('--mock4-viewport',Math.round(viewport.height)+'px');
  refresh();
 }
 viewport?.addEventListener('resize',fitViewport);
 fitViewport();
 const observer=new ResizeObserver(refresh);
 observer.observe(area);
 area.addEventListener('focusout',refresh);
 pack();
 document.fonts?.ready.then(()=>{if(!frame.contains(document.activeElement)||!field(document.activeElement)){lastWidth=undefined;refresh();}});
 return {
  reveal(node){const at=pages.findIndex(p=>p.node.contains(node));if(at>=0)show(at);},
  selection(){const page=pages[index];return page?{title:page.title,offset:page.offset}:start;},
  close(){alive=false;observer.disconnect();viewport?.removeEventListener('resize',fitViewport);cancelAnimationFrame(pending);area.removeEventListener('focusout',refresh);},
 };
}

function split(node){
 if(node)node.dataset.mock4Split='';
 return node;
}

function questionGroups(shell){
 const body=shell.querySelector('.mock4-question-body'),nav=shell.querySelector('.mock-question-bottom');
 const prompt=body.querySelector('h2'),meta=body.querySelector('.mock-question-meta');
 const options=body.querySelector('.mock-option-list'),figure=body.querySelector('.mock-figure');
 const visual=body.querySelector('.mock4-visual-question');
 const help=body.querySelector('[data-mock-action="coach-check"]'),feedback=body.querySelector('[role="status"].mock-evidence');
 const assisted=children(body).find(node=>node.matches('.mock-question-hint:not([id])'));
 const hint=body.querySelector('#mock-answer-hint');
 const groups=[];
 if(visual){
  if(matchMedia('(min-width: 761px)').matches){
   const controls=visual.querySelector('.mock4-visual-controls');
   split(controls);split(visual);
   groups.push(group('Question',prompt,visual,help));
  }else{
   const controls=visual.querySelector('.mock4-visual-controls'),zoom=controls.querySelector('.mock-figure-controls');
   const stage=element('div','mock4-diagram-stage');
   stage.append(prompt,figure,zoom);
   groups.push(group('Diagram',stage),group('Answer',children(controls),help));
  }
 }else if(options){
  groups.push(group('Question',prompt,split(options),help));
 }else{
  const claim=body.querySelector('.mock4-claim');
  const answerParts=children(body).filter(node=>![meta,prompt,feedback,help,assisted,claim,hint].includes(node));
  groups.push(group('Prompt',prompt,claim),group('Write answer',answerParts,hint,help));
 }
 if(feedback||assisted)groups.push(group('Feedback',children(feedback),assisted));
 return {host:body,groups,pinned:[nav],meta};
}

function reviewGroups(shell){
 const details=shell.querySelector('.mock-result-card');
 if(!details)return [];
 const body=details.querySelector('.mock-result-body');
 const compare=body.querySelector('.mock-answer-compare');
 const rubric=body.querySelector('.mock-rubric');
 const notes=body.querySelector('.mock-note-editor');
 const evidence=body.querySelector('details.mock-evidence');
 const actions=children(body).filter(node=>node.classList.contains('mock-mini-actions'));
 const paragraph=children(body).filter(node=>node.matches('p'));
 const groups=[group('Question',paragraph[0]),group('Your answer',children(compare?.firstElementChild)),
  group('Explanation',children(compare?.lastElementChild),paragraph.slice(1))];
 const figure=body.querySelector('.mock-figure');
 if(figure)groups.push(group('Diagram',figure,body.querySelector('.mock-figure-controls')));
 if(rubric)groups.push(group('Rubric',children(rubric).map(split),split(actions[1])));
 if(notes)groups.push(group('Study notes',children(notes.querySelector('.mock-note-fields')),split(notes.querySelector('.mock-note-candidate'))));
 groups.push(group('Study links',body.querySelector('div.mock-evidence'),split(actions[0])));
 if(evidence)groups.push(groupDetails(evidence));
 return groups;
}

export function mountMock4Screen(shell,screen,start){
 let groups,pinned=[],host;
 if(screen==='exam'){
  const {host:body,groups:parts,pinned:actions,meta}=questionGroups(shell);
  const container=body.parentElement;
  body.before(meta);
  const fit=mountMock4Pages(body,parts,{start});
  container.append(...actions);
  return fit;
 }
 const top=shell.querySelector('.mock-topline');
 if(screen==='spelling'){
  const card=shell.querySelector('.spelling-card')||shell.querySelector('.spelling-complete');
  return mountMock4Pages(card,[group('Spelling practice',children(card).map(split))],{start});
 }
 if(screen==='home'){
  const setup=shell.querySelector('.mock4-home'),panels=shell.querySelectorAll('.mock-overview-grid .mock-panel');
  const history=shell.querySelector('.mock-history');
  const settings=setup.querySelector('.mock-settings'),formActions=setup.querySelector('.mock-mini-actions');
  pinned=[formActions];formActions.classList.add('mock4-start-actions');
  groups=[group('Start',setup.querySelector('h1'),setup.querySelector('p'),children(settings),children(setup).filter(n=>n.matches('p')&&n!==setup.querySelector('p'))),
   group('Exam format',children(panels[0]).map(split)),group('Study tools',children(panels[1]).map(split)),group('Saved results',children(history).map(split))];
 }else if(screen==='results'){
  const summary=shell.querySelector('.mock4-summary');
  const tools=shell.querySelector('.mock4-result-tools');
  const head=shell.querySelector('.mock4-result-head');
  if(head){top.after(head);pinned=[shell.querySelector('.mock4-result-step')];}
  groups=summary?[group('Score',children(summary).map(split)),group('Review tools',children(tools).map(split))]:reviewGroups(shell);
  if(!groups.length)groups=[group('Review',shell.querySelector('.mock4-empty'))];
 }else if(screen==='card'){
  const sides=shell.querySelectorAll('.mock-card-side');
  groups=[...sides].map(side=>group(side.querySelector('h2').textContent,children(side).slice(0,1),children(side).filter(n=>n.classList.contains('mock-card-row'))));
  const head=shell.querySelector('.mock-exam-head');if(head)top.after(head);
  pinned=[shell.querySelector('.mock-exam-head .mock-mini-actions')].filter(Boolean);
  groups.push(group('Card tips',shell.querySelector(':scope > .mock-note'),shell.querySelector(':scope > .mock-mini-actions')));
 }else return null;
 host=element('div','mock4-screen-body');
 if(screen==='card')shell.replaceChildren(top,shell.querySelector('.mock-exam-head'),host);
 else shell.replaceChildren(...[top,shell.querySelector('.mock4-result-head'),host].filter(Boolean));
 if(pinned.length){
  const bar=element('div','mock4-pinned');bar.append(...pinned);pinned=[bar];
 }
 return mountMock4Pages(host,groups,{pinned,start});
}

export function mountMock4Dialog(content,groups){
 const box=content.closest('dialog');
 content.classList.add('mock4-dialog-content');
 box.classList.add('mock4-dialog');
 const heading=content.querySelector('h2');
 const tail=content.lastElementChild;
 const actions=tail?.matches('.control-row')?tail:null;
 let parts=groups?.(content);
 if(!parts){
  const nodes=children(content).filter(node=>node!==heading&&node!==actions);
  parts=[group('Details',nodes.map(node=>node.matches('.mock-answer-compare')?split(node):node))];
 }
 const frame=element('div','mock4-dialog-frame');
 content.replaceChildren(...[heading,frame,actions].filter(Boolean));
 const pages=mountMock4Pages(frame,parts);
 box.addEventListener('close',()=>{
  pages.close();if(!box.open){content.classList.remove('mock4-dialog-content');box.classList.remove('mock4-dialog');}
 },{once:true});
 return pages;
}

export {group as mock4Group,groupDetails as mock4Details};
