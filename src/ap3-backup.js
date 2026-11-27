import {chapters} from './ap3-curriculum.js';
import {fields} from './ap3-slides.js';
import {specimens} from './ap3-specimens.js';

const sectionIds=new Set(chapters.flatMap(c=>c.sections.map(s=>s.id)));
const time=n=>Number.isSafeInteger(n)&&n>=0;
const short=(s,max=2600)=>typeof s==='string'&&s.length<=max;
const record=o=>o!==null&&typeof o==='object'&&!Array.isArray(o);
const routes=/^ap3-(?:chapter-2[1-8]|lesson-2[1-8]\.\d+(?:\/(?:check|figures)(?:\/\d+\.\d+)?)?|specimen-[\w-]+(?:\/target\/[\w-]+)?|lab-2[1-8](?:\/\d+)?)$/;
export const isSpringStudyRoute=route=>short(route,160)&&routes.test(route);
function validItem(q){
  if(!record(q)||!short(q.id,150)||!short(q.prompt)||!short(q.why)||!sectionIds.has(q.section))return false;
  if(q.kind==='choice'||q.kind==='field'){
    if(!Array.isArray(q.options)||q.options.length<2||q.options.length>14||!q.options.every(x=>short(x))||!Number.isInteger(q.answer)||q.answer<0||q.answer>=q.options.length)return false;
    if(q.kind==='field')return fields.some(f=>f.id===q.id&&f.image===q.image&&f.figure===q.figure)&&short(q.description);
    return true;
  }
  if(q.kind==='surface'){
    const model=specimens.find(s=>s.id===q.specimen);
    return model?.targets.some(t=>t.id===q.expected)&&record(q.labels)&&Object.values(q.labels).every(s=>short(s,200))&&short(q.display)
      &&(!q.order||Array.isArray(q.order)&&q.order.length<=model.targets.length&&q.order.every(id=>model.targets.some(t=>t.id===id)));
  }
  if(q.kind==='name')return short(q.expected)&&Array.isArray(q.aliases)&&q.aliases.every(s=>short(s,150))&&(!q.opposites||Array.isArray(q.opposites)&&q.opposites.every(s=>short(s,150)));
  return q.kind==='quantity'&&short(q.unit,40)&&short(q.expected,40)&&Number.isFinite(Number(q.expected));
}
function validRun(id,r){
  if(!record(r)||r.id!==id||!/^[a-z0-9-]{1,70}$/i.test(id)||r.version!==1||!time(r.created)||!['exam','practical'].includes(r.mode)||!['all',...chapters.map(c=>String(c.id))].includes(String(r.scope)))return false;
  if(!Array.isArray(r.items)||!r.items.length||r.items.length>160||!r.items.every(validItem)||!Number.isInteger(r.index)||r.index<0||r.index>=r.items.length)return false;
  if(!Array.isArray(r.answers)||r.answers.length!==r.items.length||!r.answers.every(a=>a===null||short(a,280)||Number.isInteger(a)))return false;
  if(r.submitted===undefined)return true;
  return time(r.submitted)&&Array.isArray(r.grades)&&r.grades.length===r.items.length&&r.grades.every(s=>['correct','spelling','incorrect','unanswered'].includes(s));
}
export function validatedBackup(file){
  if(!record(file)||file.course!=='ap3'||file.version!==1||!record(file.records))throw new Error('Choose an Osteon spring study backup.');
  const entries=Object.entries(file.records);
  for(const [key,v] of entries){
    let valid=false;
    if(key.startsWith('run:'))valid=validRun(key.slice(4),v);
    else if(record(v)){
      if(key==='last')valid=isSpringStudyRoute(v.route);
      if(key.startsWith('study:'))valid=sectionIds.has(key.slice(6))&&typeof v.studied==='boolean'&&time(v.at);
      if(key.startsWith('check:'))valid=sectionIds.has(key.slice(6))&&typeof v.correct==='boolean'&&typeof v.firstCorrect==='boolean'&&time(v.at);
    }
    if(!valid)throw new Error('This backup contains an unrecognized spring record. Your current work is still available.');
  }
  return entries;
}
