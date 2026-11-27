import {isLessonId} from './chapters.js';
import {ap3Reference} from './tutor-ap3.js';
import {ap2Reference} from './tutor-ap2.js';
import foundationPages from './foundations-reader.json' with {type:'json'};
import pages from './reader-pages.json' with {type:'json'};
const pageMap=new Map([...foundationPages,...pages].map(p=>[p.pdf,p]));
const validReference=s=>isLessonId(s)||Boolean(ap2Reference(s)||ap3Reference(s));
function restoreSource(s){
 if(!s||!/^S[1-4]$/.test(s.id))return null;
 const excerpt=typeof s.text==='string'?s.text.slice(0,3600):'';
 if(s.course==='ap2'||s.course==='ap3'){
  const canonical=s.course==='ap3'?ap3Reference(s.reference):ap2Reference(s.reference);
  return canonical?{id:s.id,...canonical,text:excerpt}:null;
 }
 const p=pageMap.get(s.pdf);
 if(!p)return null;
 const reference=isLessonId(s.reference)?s.reference:undefined;
 return{id:s.id,pdf:p.pdf,title:reference?`Osteon §${reference} · source p. ${p.printed}`:`OpenStax ch. ${p.chapter} · p. ${p.printed}`,reference,text:excerpt};
}
export const CHAT_LIMIT=30;
export function sanitizeConversation(value){
 if(!Array.isArray(value))return[];
 return value.filter(m=>m&&['user','assistant'].includes(m.role)&&typeof m.content==='string').slice(-CHAT_LIMIT).map(m=>({
  role:m.role,content:m.content.slice(0,24000)||(m.pending?'Reply interrupted by page reload. Edit and retry your question.':''),
  error:!!(m.error||m.pending),model:typeof m.model==='string'?m.model.slice(0,100):'',
  correction:typeof m.correction==='string'?m.correction.slice(0,300):'',reference:validReference(m.reference)?m.reference:undefined,
  course:['ap2','ap3'].includes(m.course)?m.course:'ap1',
  kind:m.role==='assistant'&&m.kind==='course-note'?'course-note':undefined,
  sources:(Array.isArray(m.sources)?m.sources:[]).map(restoreSource).filter(Boolean).slice(0,4)
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
