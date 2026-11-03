// Expand the existing canvas, retaining its controls, specimen and quiz state.
export function initViewerRoom({viewer,toast}){
 const stage=document.querySelector('.specimen-stage'),canvas=document.querySelector('#viewer');
 const tools=document.createElement('div');tools.className='viewer-room-tools';
 tools.innerHTML='<button type="button" id="viewer-details" aria-expanded="false" aria-controls="atlas-details">Details</button><button type="button" id="viewer-controls" aria-expanded="false" aria-controls="viewer-control-guide">Controls</button><button type="button" id="viewer-fullscreen" hidden>Full screen</button><button type="button" id="viewer-expand" aria-expanded="false" aria-controls="viewer-room"><span aria-hidden="true">⛶</span> <span>Expand viewer</span></button>';
 stage.append(tools);
 const guide=document.createElement('section');guide.id='viewer-control-guide';guide.className='viewer-control-guide';guide.hidden=true;guide.setAttribute('aria-label','How to explore the skeleton');
 guide.innerHTML='<div class="viewer-guide-heading"><strong>Get closer. Keep your bearings.</strong><button type="button" id="viewer-guide-close" aria-label="Close viewer controls">×</button></div><div class="viewer-guide-steps"><p><b>1</b><span><strong>Explore a region</strong>Double-click or double-tap a bone.</span></p><p><b>2</b><span><strong>Study one bone</strong>Do it again inside that region.</span></p><p><b>↶</b><span><strong>Return one step</strong>Use the Back arrow above the model.</span></p></div><p class="viewer-guide-practice" hidden>During a question, use rotate and zoom to inspect the target. Region navigation is paused so the exercise stays intact.</p><div class="viewer-guide-motion"><span>Drag / one finger<strong>Rotate</strong></span><span>Scroll / pinch<strong>Zoom</strong></span><span>Right-drag / two fingers<strong>Pan</strong></span></div><p class="viewer-guide-keyboard">Select a bone and press Enter to explore. Escape goes back. The Zoom to region and Bone buttons offer the same actions.</p><button type="button" id="viewer-guide-done">Got it — explore</button>';
 stage.append(guide);
 const room=document.createElement('div');room.id='viewer-room';room.className='viewer-room';room.hidden=true;room.setAttribute('role','dialog');room.setAttribute('aria-modal','true');room.setAttribute('aria-label','Expanded anatomy viewer');document.body.append(room);
 const expand=tools.querySelector('#viewer-expand'),full=tools.querySelector('#viewer-fullscreen'),help=tools.querySelector('#viewer-controls');
 const atlas=document.querySelector('#atlas-view'),details=document.querySelector('#atlas-details'),detailsButton=tools.querySelector('#viewer-details'),detailsClose=document.createElement('button');detailsClose.type='button';detailsClose.className='viewer-details-close';detailsClose.textContent='Back to model';details.prepend(detailsClose);
 function showDetails(open){atlas.dataset.detailsOpen=String(open);detailsButton.setAttribute('aria-expanded',String(open));if(open)detailsClose.focus({preventScroll:true});}
 detailsButton.onclick=()=>showDetails(atlas.dataset.detailsOpen!=='true');detailsClose.onclick=()=>{showDetails(false);detailsButton.focus({preventScroll:true});};
 stage.addEventListener('pointerdown',ev=>{if(!ev.target.closest('#viewer-details'))showDetails(false);});
 let placeholder=null,origin=null,scrollY=0,nativeActive=false;const inert=new Map();
 const toolSize=new ResizeObserver(()=>stage.style.setProperty('--viewer-tools-width',tools.offsetWidth+'px'));toolSize.observe(tools);
 function closeGuide(focus=true){guide.hidden=true;help.setAttribute('aria-expanded','false');if(focus)help.focus({preventScroll:true});}
 function openGuide(){guide.hidden=false;guide.querySelector('.viewer-guide-steps').hidden=!!viewer.quiz;guide.querySelector('.viewer-guide-keyboard').hidden=!!viewer.quiz;guide.querySelector('.viewer-guide-keyboard').textContent='Select a bone and press Enter to explore. '+(placeholder?'Escape leaves expanded view.':'Escape returns one step.')+' The Zoom to region and Bone buttons offer the same actions.';guide.querySelector('.viewer-guide-practice').hidden=!viewer.quiz;help.setAttribute('aria-expanded','true');guide.querySelector('#viewer-guide-close').focus({preventScroll:true});}
 help.onclick=()=>guide.hidden?openGuide():closeGuide();guide.querySelector('#viewer-guide-close').onclick=()=>closeGuide();guide.querySelector('#viewer-guide-done').onclick=()=>{closeGuide(false);canvas.focus({preventScroll:true});};
 function labels(){const expanded=!!placeholder;expand.setAttribute('aria-expanded',String(expanded));expand.querySelector('span:last-child').textContent=expanded?(viewer.quiz?'Back to question':'Exit expanded view'):'Expand viewer';full.hidden=!expanded||!document.fullscreenEnabled||!room.requestFullscreen;full.textContent=document.fullscreenElement===room?'Exit full screen':'Full screen';}
 function open(){
  if(placeholder||!stage.getClientRects().length)return;
  origin=document.activeElement;scrollY=window.scrollY;placeholder=document.createElement('div');placeholder.className='viewer-room-placeholder';placeholder.style.height=stage.getBoundingClientRect().height+'px';stage.replaceWith(placeholder);room.append(stage);room.hidden=false;document.body.classList.add('viewer-room-open');
  for(const child of document.body.children)if(child!==room&&child.tagName!=='DIALOG'&&child.id!=='toast'){inert.set(child,child.hasAttribute('inert'));child.setAttribute('inert','');}
  showDetails(false);closeGuide(false);labels();viewer.resize();expand.focus({preventScroll:true});
 }
 function close({focus=true}={}){
  if(!placeholder)return;
  if(document.fullscreenElement===room)document.exitFullscreen().catch(()=>{});
  closeGuide(false);if(placeholder.isConnected)placeholder.replaceWith(stage);else if(room.contains(stage))document.querySelector('.atlas-workspace').insertBefore(stage,document.querySelector('#atlas-details'));placeholder=null;room.hidden=true;document.body.classList.remove('viewer-room-open');for(const [child,value]of inert)if(!value)child.removeAttribute('inert');inert.clear();labels();viewer.resize();window.scrollTo({top:scrollY,behavior:'instant'});if(focus&&origin?.isConnected)origin.focus({preventScroll:true});
 }
 expand.onclick=()=>placeholder?close():open();
 full.onclick=async()=>{try{if(document.fullscreenElement===room)await document.exitFullscreen();else await room.requestFullscreen();}catch{toast('Expanded view is ready. This browser did not allow full screen.');}labels();};
 document.addEventListener('fullscreenchange',()=>{const active=document.fullscreenElement===room;if(nativeActive&&!active&&placeholder)close();nativeActive=active;labels();});
 document.addEventListener('keydown',ev=>{if(document.querySelector('dialog[open]'))return;if(ev.key==='Tab'&&placeholder){const items=[...room.querySelectorAll('button:not(:disabled),[tabindex="0"],input:not(:disabled),select:not(:disabled),a[href]')].filter(el=>el.getClientRects().length&&!el.closest('[hidden]')),index=items.indexOf(document.activeElement);if(index<0||(!ev.shiftKey&&index===items.length-1)||(ev.shiftKey&&index===0)){ev.preventDefault();items[ev.shiftKey?items.length-1:0]?.focus();}return;}if(ev.key!=='Escape')return;if(!guide.hidden){ev.preventDefault();ev.stopImmediatePropagation();closeGuide();}else if(placeholder){ev.preventDefault();ev.stopImmediatePropagation();close();}else if(atlas.dataset.detailsOpen==='true'&&detailsButton.getClientRects().length){ev.preventDefault();ev.stopImmediatePropagation();showDetails(false);detailsButton.focus({preventScroll:true});}},true);
 for(const event of ['viewchange','assessmentstart','assessmentend'])document.addEventListener(event,()=>{close({focus:false});showDetails(false);closeGuide(false);labels();},true);
 // A programmatic transition can replace a question while its stage is expanded.
 const observer=new MutationObserver(()=>{if(placeholder&&!placeholder.isConnected)close({focus:false});});observer.observe(document.querySelector('main'),{childList:true,subtree:true});
 labels();
}
