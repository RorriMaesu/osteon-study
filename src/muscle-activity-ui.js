// Replace an activity without dropping keyboard focus on every choice.
export function replaceMuscleActivity(root,html){
 const active=typeof document==='undefined'?null:document.activeElement;
 let selector='';
 if(active&&root.contains(active)){
  if(active.id)selector='#'+CSS.escape(active.id);
  else{const attribute=[...active.attributes].find(a=>a.name.startsWith('data-'));if(attribute)selector=`[${attribute.name}=${JSON.stringify(attribute.value)}]`;}
 }
 root.innerHTML=html;
 if(selector){
  const same=root.querySelector(selector);
  const target=same&&!same.disabled?same:root.querySelector('select:not(:disabled),button:not(:disabled),input:not(:disabled)');
  target?.focus({preventScroll:true});
  // The workspace may move this activity into its page container on the next
  // frame. Restore only a focus lost to the document, never another control.
  if(target)requestAnimationFrame(()=>{if(target.isConnected&&document.activeElement===document.body)target.focus({preventScroll:true});});
 }
}
