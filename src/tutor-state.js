import pages from './reader-pages.json' with {type:'json'};
const pageMap=new Map(pages.map(p=>[p.pdf,p]));
const validReference=s=>/^(?:6\.[1-7]|7\.[1-5]|8\.[1-4]|9\.6)$/.test(s);
export const CHAT_LIMIT=30;
export function sanitizeConversation(value){
 if(!Array.isArray(value))return[];
 return value.filter(m=>m&&['user','assistant'].includes(m.role)&&typeof m.content==='string').slice(-CHAT_LIMIT).map(m=>({
  role:m.role,content:m.content.slice(0,24000)||(m.pending?'Reply interrupted by page reload. Edit and retry your question.':''),
  error:!!(m.error||m.pending),model:typeof m.model==='string'?m.model.slice(0,100):'',
  correction:typeof m.correction==='string'?m.correction.slice(0,300):'',reference:validReference(m.reference)?m.reference:undefined,
  sources:(Array.isArray(m.sources)?m.sources:[]).filter(s=>s&&/^S[1-4]$/.test(s.id)&&pageMap.has(s.pdf)).slice(0,4).map(s=>{
   const p=pageMap.get(s.pdf);return{id:s.id,pdf:p.pdf,title:`OpenStax ch. ${p.chapter} · p. ${p.printed}`,text:typeof s.text==='string'?s.text.slice(0,1600):''};
  })
 })).filter(m=>m.content.trim());
}
export function citationParts(text,sources=[]){
 const byID=new Map(sources.map(s=>[s.id,s])),parts=[],used=new Set(),unknown=new Set();
 const pattern=/\[(S\d+(?:\s*,\s*S\d+)*)\]/gi;let previous=0,match;
 while((match=pattern.exec(text))){
  if(match.index>previous)parts.push({type:'text',text:text.slice(previous,match.index)});
  for(const id of match[1].toUpperCase().match(/S\d+/g)){
   const source=byID.get(id);
   if(source){parts.push({type:'source',source});used.add(id);}else{parts.push({type:'text',text:`[${id}]`});unknown.add(id);}
  }
  previous=pattern.lastIndex;
 }
 if(previous<text.length)parts.push({type:'text',text:text.slice(previous)});
 return{parts,used:[...used],unknown:[...unknown]};
}
export function conversationForModel(history){
 const recent=history.filter(m=>['user','assistant'].includes(m.role)&&!m.error&&!m.pending&&m.content?.trim()).slice(-8);
 let budget=6000;const kept=[];
 for(const m of [...recent].reverse()){
  if(budget<=0)break;
  const content=m.content.replace(/\[S\d+(?:\s*,\s*S\d+)*\]/gi,'').slice(-Math.min(2000,budget));
  kept.unshift({role:m.role,content});budget-=content.length;
 }
 return kept;
}
