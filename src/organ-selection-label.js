import {organLabelRole} from './organ-label-roles.js';

export function showOrganSelection(element,entry,raw,title,detail=''){
  const role=organLabelRole(entry,raw,title),prefix=role.symbol+' '+role.title+' · ';
  const text=title+(detail?' · '+detail:'');
  if(element.textContent===prefix+text)return;
  const key=document.createElement('span');
  key.style.color=role.color;key.textContent=prefix;
  element.replaceChildren(key,document.createTextNode(text));
}
