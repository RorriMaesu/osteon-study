const lessonMedia='svg, img, video, canvas, .foundation-plane-stage, .process-visual, .lab-root';
const canExpand=root=>!!root.querySelector(lessonMedia);
const fittedMedia='.section-diagram-media svg, .foundation-atlas-layout svg, .foundation-tissue-layout svg, .foundation-figure img, .foundation-video, .foundation-plane-stage, .motion-lab>svg, .osteon-layout>svg, .muscle-lab-visual svg, .lab-osmosis svg, .lab-division svg';
const inspectableMedia='.section-diagram-media svg, .foundation-atlas-layout svg, .foundation-tissue-layout svg, .foundation-figure img, .lab-osmosis svg, .lab-division svg, .fracture-figure svg, .foundation-experiment svg';

function openFigureView(root,trigger,title,refit){
 const marker=document.createComment('Lesson activity position');
 const modal=document.createElement('dialog'),listeners=new AbortController();
 const origin=location.hash;
 modal.className='lesson-visual-dialog';
 modal.setAttribute('aria-labelledby','lesson-visual-title');
 modal.innerHTML='<header><h2 id="lesson-visual-title"></h2><div class="lesson-visual-actions"><button type="button" data-inspect aria-pressed="false">Inspect</button><button type="button" data-close autofocus>Close full view</button></div></header><div class="lesson-visual-content"></div>';
 modal.querySelector('h2').textContent=title;
 modal.querySelector('[data-close]').onclick=()=>modal.close();
 const inspect=modal.querySelector('[data-inspect]');
 let inspecting=false,windowBox,visual;
 function fitInspection(){
  if(!windowBox)return;
  visual.classList.remove('lesson-inspect-media');
  windowBox.replaceWith(visual);
  windowBox=null;
 }
 function syncInspection(){
  const candidate=root.querySelector(inspectableMedia);
  inspect.hidden=!candidate;
  if(!candidate||!inspecting||windowBox?.contains(candidate)&&root.contains(windowBox))return;
  const position=windowBox?[windowBox.scrollLeft,windowBox.scrollTop]:[0,0];
  fitInspection();
  visual=candidate;
  const width=Math.round(visual.getBoundingClientRect().width*1.8);
  if(!width)return;
  windowBox=document.createElement('div');
  windowBox.className='lesson-inspect-window';
  windowBox.tabIndex=0;
  windowBox.setAttribute('role','region');
  windowBox.setAttribute('aria-label','Enlarged diagram. Scroll or use arrow keys to pan.');
  windowBox.style.setProperty('--inspect-width',width+'px');
  visual.before(windowBox);
  windowBox.append(visual);
  visual.classList.add('lesson-inspect-media');
  windowBox.scrollTo(...position);
 }
 inspect.onclick=()=>{
  inspecting=!inspecting;
  inspect.textContent=inspecting?'Fit diagram':'Inspect';
  inspect.setAttribute('aria-pressed',String(inspecting));
  if(!inspecting)fitInspection();
  syncInspection();
  if(inspecting)windowBox?.focus({preventScroll:true});
  refit();
 };
 const inspectionObserver=new MutationObserver(syncInspection);
 modal.addEventListener('close',()=>{
  listeners.abort();
  inspectionObserver.disconnect();
  fitInspection();
  if(marker.isConnected&&root.parentElement===modal.lastElementChild)marker.replaceWith(root);
  modal.remove();
  refit();
  if(trigger.isConnected)trigger.focus({preventScroll:true});
 },{once:true});
 document.addEventListener('viewchange',()=>{if(location.hash!==origin)modal.close();},{signal:listeners.signal});
 root.before(marker);
 document.body.append(modal);
 modal.lastElementChild.append(root);
 modal.showModal();
 refit();
 syncInspection();
 inspectionObserver.observe(root,{childList:true,subtree:true});
}

export function mountLessonVisual(flow,root,title){
 const tools=flow.querySelector('.lesson-explore-tools');
 const expand=document.createElement('button');
 expand.type='button';
 expand.className='lesson-expand-visual';
 expand.textContent='Full view';
 let frame=0;
 function fit(){
  if(!flow.isConnected){observer.disconnect();size.disconnect();return;}
  expand.hidden=!canExpand(root);
  const modal=root.closest('.lesson-visual-content');
  const viewport=modal||(matchMedia('(min-width:1000px)').matches?root:null);
  const bottom=viewport?.getBoundingClientRect().bottom;
  const minimum=viewport?Math.min(125,Math.max(82,Math.floor(viewport.clientHeight*.32))):125;
  for(const visual of root.querySelectorAll(fittedMedia)){
   if(!viewport){visual.style.removeProperty('--figure-space');continue;}
   const top=visual.getBoundingClientRect().top+viewport.scrollTop;
   const caption=visual.closest('figure')?.querySelector('figcaption');
   const remaining=bottom-top-(caption?.offsetHeight||0)-16;
   visual.style.setProperty('--figure-space',Math.max(minimum,Math.floor(remaining))+'px');
  }
 }
 function refit(){
  if(!frame)frame=requestAnimationFrame(()=>{frame=0;fit();});
 }
 expand.onclick=()=>openFigureView(root,expand,title,fit);
 tools.append(expand);
 expand.hidden=!canExpand(root);
 // Studio tabs replace their visual when changing diagrams or activities.
 const observer=new MutationObserver(fit),size=new ResizeObserver(refit);
 observer.observe(root,{childList:true,subtree:true});
 size.observe(flow);
 root.addEventListener('load',refit,true);
 fit();
}
