export function attachViewerRecovery(viewer,{toast}){
 document.addEventListener('click',event=>{if(event.target.closest('[data-model-retry]'))location.reload();if(event.target.closest('[data-model-text]'))document.dispatchEvent(new Event('studyhome'));});
 if(!viewer.renderer)return;
 const notice=document.createElement('section');notice.className='viewer-recovery';notice.hidden=true;notice.setAttribute('role','status');notice.innerHTML='<h3>Graphics paused</h3><p>Your current work remains in this page. Try restoring the model, or use a text study alternative.</p><button type="button" data-graphics-retry>Try to restore graphics</button><button type="button" data-graphics-text>Use text alternative</button>';viewer.el.append(notice);
 for(const type of ['pointerdown','pointerup','pointermove','dblclick'])notice.addEventListener(type,event=>event.stopPropagation());
 viewer.renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();viewer.graphicsLost=true;viewer.controls.enabled=false;notice.hidden=false;});
 viewer.renderer.domElement.addEventListener('webglcontextrestored',()=>{viewer.graphicsLost=false;viewer.controls.enabled=true;viewer.needsRender=true;notice.hidden=true;viewer.resize();toast('Graphics restored. Your question and draft are retained.');});
 notice.querySelector('[data-graphics-retry]').onclick=()=>{const extension=viewer.renderer.getContext().getExtension('WEBGL_lose_context');if(extension)extension.restoreContext();else toast('This browser cannot restore graphics on request. Keep the page open or use the text alternative.');};
 notice.querySelector('[data-graphics-text]').onclick=()=>{const handled=!document.dispatchEvent(new CustomEvent('viewertextfallback',{cancelable:true}));if(!handled)document.dispatchEvent(new Event('studyhome'));};
}
