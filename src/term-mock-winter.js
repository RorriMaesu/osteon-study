import {units, sectionById} from './ap2-library.js';
import {bank} from './ap2-exam-core.js';
import {neural,autonomic,sourceFigure} from './term-mock-winter-stations.js';
import {endocrine,circulation} from './term-mock-winter-system-stations.js';
import {winterTransferChoices} from './term-mock-winter-transfer.js';
import {unitWinterWriting} from './term-mock-winter-writing.js';
import {winterIntegrative} from './term-mock-winter-integration.js';
import {varyStations} from './term-mock-winter-variants.js';
import {winterWeeklyItems} from './term-winter-weekly.js';

const version='winter-mock-2';
const formNames=['A','B','C'];
export const winterScopes=[
  ...units.map((u,i)=>({id:'unit-'+(i+1),title:u.title,chapters:[...u.chapters]})),
  {id:'all',title:'Cumulative · Chapters 12–20',chapters:units.flatMap(u=>u.chapters)}
];
const choices=[...bank.filter(q=>q.type==='choice'&&q.pool!=='recall'),...winterTransferChoices];
const chapterOf=q=>Number(q.section.split('.')[0]);
function hash(text){
  let value=2166136261;
  for(const c of text)value=Math.imul(value^c.charCodeAt(0),16777619);
  return value>>>0;
}
function stableOrder(items,key,id=x=>x.id){
  return items.slice().sort((a,b)=>hash(key+id(a))-hash(key+id(b)));
}

// Share chapter and section coverage evenly and use previously unseen stems first.
function unitChoiceForm(scope,f){
  const cumulative=scope.id==='all';
  const base=cumulative?26:30;
  const extraForCumulative={12:3,13:3,14:3,15:3,16:3,17:2,18:3,19:3,20:3};
  const used=new Set();
  // Use the concept slots to cover sections that the fixed practicals and writing do not sample.
  const sectionTotal=new Map();
  if(cumulative){
    for(const form of [0,1,2]){
      for(const item of cumulativeStations(form)){
        sectionTotal.set(item.section,(sectionTotal.get(item.section)||0)+1);
      }
    }
  }
  let selected=[];
  for(let k=0;k<=f;k++){
    selected=[];
    for(const [ci,chapter] of scope.chapters.entries()){
      const target=cumulative?extraForCumulative[chapter]:
        Math.floor(base/scope.chapters.length)+(ci<base%scope.chapters.length?1:0);
      const available=choices.filter(q=>chapterOf(q)===chapter);
      const bySection=new Map();
      for(const q of available){
        if(!bySection.has(q.section))bySection.set(q.section,[]);
        bySection.get(q.section).push(q);
      }
      const byUse=new Map([...bySection.keys()].map(s=>[s,0]));
      const remaining=stableOrder(available,scope.id+':'+k+':');
      for(let i=0;i<target;i++){
        remaining.sort((a,b)=>Number(used.has(a.id))-Number(used.has(b.id))
          || byUse.get(a.section)-byUse.get(b.section)
          || (sectionTotal.get(a.section)||0)-(sectionTotal.get(b.section)||0));
        const next=remaining.shift();
        selected.push({...next,points:1,objective:'concept-'+next.section});
        used.add(next.id);
        byUse.set(next.section,byUse.get(next.section)+1);
        sectionTotal.set(next.section,(sectionTotal.get(next.section)||0)+1);
      }
    }
  }
  return selected;
}

function stations(unit,f){
  const factory=[neural,autonomic,endocrine,circulation][unit];
  const group=varyStations(factory(f,sourceFigure),unit+1,formNames[f]);
  return [
    ...group.evidence.map(q=>({...q,type:'evidence'})),
    ...group.short.map(q=>({...q,type:'short'})),
    ...unitWinterWriting(unit,f)
  ];
}

function cumulativeStations(f){
  const items=[0,1,2,3].flatMap(unit=>stations(unit,f));
  const pick=(chapter,type,slot)=>{
    const pool=items.filter(q=>chapterOf(q)===chapter&&q.type===type);
    return pool[(f+slot)%pool.length];
  };
  return [
    ...[12,13,14,15,16,17,18,20].map((ch,i)=>pick(ch,'evidence',ch===17&&f===0?0:i)),
    pick(17,'short',0),pick(19,'short',0),...winterIntegrative(f)
  ];
}
function shuffleOptions(part,key){
  if(!part.choices)return part;
  const order=stableOrder(part.choices.map((_,i)=>i),key,i=>part.choices[i]);
  return {...part,choices:order.map(i=>part.choices[i]),answer:order.indexOf(part.answer)};
}
function defaultWinterMock(scopeId,form){
  const scope=winterScopes.find(s=>s.id===scopeId),f=formNames.indexOf(form);
  if(!scope||f<0)throw new RangeError('Unknown A&P II mock form or scope.');
  const unit=winterScopes.indexOf(scope);
  const items=[...unitChoiceForm(scope,f),...(scope.id==='all'?cumulativeStations(f):stations(unit,f))];
  const blockOrder=['choice','evidence','short','written'];
  return blockOrder.flatMap(type=>items.filter(q=>q.type===type)).map((q,i)=>{
    const id='winter-'+scopeId+'-'+form.toLowerCase()+'-'+(i+1);
    const source=sectionById.get(q.section);
    const output={...q,id,contentVersion:version,source:source.source,chapter:chapterOf(q)};
    if(q.parts)output.parts=q.parts.map((part,j)=>shuffleOptions(part,id+'/'+j));
    return JSON.parse(JSON.stringify(shuffleOptions(output,id)));
  });
}

// Older weekly checks used material from the unit exams. Keep their submitted
// snapshots intact and select fresh material the next time a unit is started.
export function winterExposureKeys(q){
  const st=q.stimulus,keys=[];
  if(q.prompt!=='Interpret the specimen or recording and connect it to function.')keys.push('question:'+q.prompt);
  if(st?.image||st?.svg)keys.push('figure:'+(st.image||st.svg));
  if(st?.rows)keys.push('data:'+JSON.stringify([st.columns,st.rows]));
  if(!keys.length)keys.push('parts:'+JSON.stringify(q.parts?.map(p=>p.prompt)));
  return keys;
}
export function makeWinterMock(scopeId,form='A',history=[]){
  if(scopeId.startsWith('week-'))return winterWeeklyItems(Number(scopeId.slice(5)),form);
  const original=defaultWinterMock(scopeId,form);
  if(!scopeId.startsWith('unit-'))return original;
  const exposed=new Set(history.filter(run=>run.scope?.startsWith('week-')).flatMap(run=>run.items.flatMap(winterExposureKeys)));
  const seen=q=>winterExposureKeys(q).some(key=>exposed.has(key));
  if(!original.some(seen))return original;
  const reserved=new Set(original.filter(q=>!seen(q)).flatMap(winterExposureKeys));
  const reserve=formNames.filter(f=>f!==form).flatMap(f=>defaultWinterMock(scopeId,f)).filter(q=>!seen(q));
  return original.map(q=>{
    if(!seen(q))return q;
    const valid=reserve.filter(other=>other.type===q.type&&!winterExposureKeys(other).some(key=>reserved.has(key)));
    const replacement=valid.find(other=>other.section===q.section)||valid.find(other=>other.chapter===q.chapter)||valid[0];
    if(!replacement)return {...q,seenInWeekly:true};
    winterExposureKeys(replacement).forEach(key=>reserved.add(key));
    return {...replacement,id:q.id};
  });
}
