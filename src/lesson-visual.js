const lessonMedia='svg, img, video, canvas, .foundation-plane-stage, .process-visual, .lab-root';
const canExpand=root=>!!root.querySelector(lessonMedia);
const fittedMedia='.foundation-atlas-layout svg, .foundation-tissue-layout svg, .foundation-figure img, .foundation-video, .foundation-plane-stage, .motion-lab>svg, .osteon-layout>svg, .muscle-lab-visual svg, .lab-osmosis svg, .lab-division svg';

function openFigureView(root,trigger,title,refit){
 const marker=document.createComment('Lesson activity position');
 const modal=document.createElement('dialog'),listeners=new AbortController();
 const origin=location.hash;
 modal.className='lesson-visual-dialog';
 modal.setAttribute('aria-labelledby','lesson-visual-title');
 modal.innerHTML='<header><h2 id="lesson-visual-title"></h2><button type="button" autofocus>Close full view</button></header><div class="lesson-visual-content"></div>';
 modal.querySelector('h2').textContent=title;
 modal.querySelector('button').onclick=()=>modal.close();
 modal.addEventListener('close',()=>{
  listeners.abort();
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
