// The legacy course stores own persistence and backup. New mocks are optional
// records so historical exams never need to be migrated or rescored.
import {validWrittenQuestion, validWrittenReview, localModelIdentity, responseIdentity, isWrittenModelQualified} from './written-answer-judge.js';
import {reviewMatches} from './answer-review-data.js';
const object = v => !!v && typeof v === 'object' && !Array.isArray(v);
const line = (v, max) => typeof v === 'string' && v.length <= max;
const nonempty = (v,max) => line(v,max)&&v.trim().length>0;
const strings = (v,max) => Array.isArray(v)&&v.every(s=>nonempty(s,max));
const idOK = id => typeof id === 'string' && /^[\w./:-]{1,160}$/.test(id) && !['__proto__','constructor','prototype'].includes(id);
const time = n => Number.isSafeInteger(n) && n > 0;
const choiceOK = q => strings(q.choices,4000) && q.choices.length >= 2 && Number.isInteger(q.answer) && q.answer >= 0 && q.answer < q.choices.length;
function partOK(p){
  if(!object(p)||!nonempty(p.prompt,5000))return false;
  if(p.type==='choice')return choiceOK(p);
  if(p.type==='term')return nonempty(p.expected,1000)&&[p.aliases,p.opposites].every(v=>v===undefined||strings(v,1000));
  if(p.type==='number')return (typeof p.expected==='number'||nonempty(p.expected,1000))&&Number.isFinite(Number(p.expected))&&
    (p.unit===undefined||line(p.unit,100))&&(p.tolerance===undefined||Number.isFinite(p.tolerance)&&p.tolerance>=0);
  return p.type==='surface'&&idOK(p.specimen)&&idOK(p.expected)&&Array.isArray(p.order)&&p.order.every(idOK)&&
    new Set(p.order).size===p.order.length&&p.order.includes(p.expected)&&object(p.labels)&&
    p.order.every(id=>Object.hasOwn(p.labels,id)&&nonempty(p.labels[id],500));
}
function validRubricFixtures(q){
  const fs=q.rubric.fixtures;
  if(fs===undefined)return true;
  const cs=q.rubric.criteria;
  return Array.isArray(fs)&&fs.length<=100&&fs.every(f=>object(f)&&idOK(f.id)&&line(f.response,3000)&&
    object(f.expectedPoints)&&Object.keys(f.expectedPoints).length===cs.length&&
    cs.every(c=>[0,c.points].includes(f.expectedPoints[c.id])))&&new Set(fs.map(f=>f.id)).size===fs.length;
}
function itemOK(q,course) {
  if (!object(q) || !idOK(q.id) || !nonempty(q.prompt,5000) || !nonempty(q.why,6000) || !line(q.section,12)||!/^\d+\.\d+$/.test(q.section)) return false;
  const chapter=Number(q.section.split('.')[0]);
  if(course==='ap2' ? chapter<12||chapter>20 : chapter<21||chapter>28) return false;
  const st=q.stimulus;
  if(st!=null && (!object(st) ||
    st.image!==undefined && (!line(st.image,500)||!/^assets\/[\w./-]+$/.test(st.image)||st.image.split('/').includes('..')) ||
    st.svg!==undefined&&!nonempty(st.svg,200000) ||
    (st.rows!==undefined||st.columns!==undefined) && (!strings(st.columns,1000)||!st.columns.length||!Array.isArray(st.rows)||
      !st.rows.every(row=>Array.isArray(row)&&row.length===st.columns.length&&row.every(v=>line(v,4000)||Number.isFinite(v)))))) return false;
  if(q.type==='choice') return q.parts===undefined&&q.points===1 && choiceOK(q);
  if(q.type==='written') return q.parts===undefined&&q.points===3 && object(q.rubric) && idOK(q.rubric.id) && Array.isArray(q.rubric.criteria) &&
    q.rubric.criteria.every(k=>object(k)&&idOK(k.id)) && validWrittenQuestion(q) && validRubricFixtures(q);
  return ['short','evidence'].includes(q.type) && Array.isArray(q.parts) && q.parts.length===q.points && [2,3].includes(q.points) && q.parts.every(partOK);
}
function validInput(part,value){
  if(!line(value,part.type==='written'?3000:500))return false;
  if(!value)return true;
  if(part.type==='choice')return /^(0|[1-9]\d*)$/.test(value)&&Number(value)<part.choices.length;
  return part.type!=='surface'||part.order.includes(value);
}
function gradeOK(q,raw,grade){
  const written=q.type==='written', blocks=written?q.rubric.criteria:q.parts||[q];
  if(!object(grade)||grade.source!=='answer-key'||grade.possible!==q.points||
    !Array.isArray(grade.parts)||grade.parts.length!==blocks.length)return false;
  let earned=0,pending=0;
  for(const [i,part] of grade.parts.entries()){
    const block=blocks[i], possible=written?block.points:1;
    const input=String((q.parts?raw?.[i]:raw)??''), trimmed=input.trim();
    const response=written?input:!trimmed?'':block.type==='choice'?block.choices[trimmed]:
      block.type==='surface'?block.labels[trimmed]:trimmed;
    const expected=written?block.description:block.type==='choice'?block.choices[block.answer]:
      block.type==='surface'?block.labels[block.expected]:[block.expected,block.unit].filter(v=>v!==undefined&&v!=='').join(' ');
    if(!object(part)||part.index!==i||part.possible!==possible||part.expected!==expected||part.response!==response||
      part.prompt!==(written?block.label:block.prompt)||!line(part.reason,6500)||
      !['correct','equivalent','spelling','incorrect','unanswered','pending'].includes(part.status)||
      (part.status==='unanswered')!==!trimmed)return false;
    if(written&&(part.id!==block.id||!['pending','unanswered'].includes(part.status)))return false;
    if(!written&&(typeof part.reviewable!=='boolean'||part.reviewable!==(block.type==='term'&&part.status==='pending')))return false;
    if(trimmed&&(block.type==='choice'||block.type==='surface')){
      const selectedKey=block.type==='choice'?String(block.answer):block.expected;
      if(part.status!==(trimmed===selectedKey?'correct':'incorrect'))return false;
    }
    if(part.earned!==(['correct','equivalent','spelling'].includes(part.status)?possible:0)||
      part.pending!==(part.status==='pending'?possible:0))return false;
    earned+=part.earned;pending+=part.pending;
  }
  const statuses=grade.parts.map(p=>p.status);
  const status=statuses.every(s=>s==='unanswered')?'unanswered':pending?'pending':earned===q.points?
    (statuses.includes('spelling')?'spelling':statuses.includes('equivalent')?'equivalent':'correct'):earned?'partial':'incorrect';
  return grade.status===status&&grade.earned===earned&&grade.pending===pending;
}
const indexKey=key=>/^(0|[1-9]\d*)$/.test(key);
function writtenRecordOK(q,raw,id,review,source){
  const question={...q,answer:q.rubric.modelAnswer||q.answer||q.why};
  if(!nonempty(raw,3000)||review?.source!==source||!validWrittenReview(review,{question,response:raw,submissionId:id}))return false;
  if(review.qualification===undefined&&review.modelEntry===undefined)return true;
  if(source!=='local-ai'||!object(review.modelEntry)||!object(review.qualification)||
    localModelIdentity(review.modelEntry,review.endpoint)!==review.modelIdentity)return false;
  const fixtures=(q.rubric.fixtures||[]).filter(f=>f.response.trim()).map(f=>({...f,id:q.id+'-'+f.id,questionId:q.id}));
  return isWrittenModelQualified(review.qualification,{model:review.model,endpoint:review.endpoint,modelEntry:review.modelEntry,questionId:q.id},[question],fixtures);
}
function reviewOK(q,r,record){
  if(!object(record))return false;
  const written=q.type==='written', raw=r.answers[q.id];
  for(const [kind,value] of Object.entries(record)){
    if(written){
      if(!['written','confirmed'].includes(kind)||!writtenRecordOK(q,raw,r.id,value,kind==='written'?'local-ai':'learner'))return false;
      continue;
    }
    if(!['meanings','manualMeanings'].includes(kind)||!object(value))return false;
    const identity=responseIdentity(q);
    for(const [index,entry] of Object.entries(value)){
      const part=q.parts?.[index];
      if(!indexKey(index)||part?.type!=='term'||!r.grades[q.id].parts[index].reviewable||!object(entry)||
        entry.submissionId!==r.id||entry.partIndex!==Number(index)||entry.itemIdentity!==identity||entry.response!==raw?.[index])return false;
      if(kind==='manualMeanings'){
        if(entry.source!=='learner'||!time(entry.at)||!['equivalent','incorrect','pending'].includes(entry.decision))return false;
      } else if(!reviewMatches(entry.review,{id:q.id+'-term-'+index,answer:part.expected},entry.response)||
        entry.review.strictCorrect||!entry.review.allowOverride)return false;
    }
  }
  return true;
}
function jobsOK(queue,ids,run){
  if(queue===undefined)return true;
  if(!Array.isArray(queue)||queue.length>run.items.reduce((n,q)=>n+(q.parts?.length||1),0))return false;
  const jobs=new Set();
  return queue.every(job=>{
    if(!object(job)||!ids.has(job.item)||!['written','calibrate','meaning','note'].includes(job.kind))return false;
    const q=ids.get(job.item), index=job.index;
    const key=job.item+'|'+job.kind+'|'+(index??0);
    if(jobs.has(key))return false;
    jobs.add(key);
    if(job.kind==='written'||job.kind==='calibrate')return q.type==='written'&&!!run.answers[q.id]?.trim()&&
      (index===undefined||index===0)&&(job.kind!=='calibrate'||q.rubric.fixtures?.some(f=>f.response.trim()));
    const part=Number.isInteger(index)&&index>=0&&run.grades[q.id].parts[index];
    return !!part&&(job.kind==='note'||part.reviewable);
  });
}
function cuesOK(cues,ids){
  if(cues===undefined)return true;
  return object(cues)&&Object.entries(cues).every(([key,cue])=>{
    const match=/^(.+)\/(0|[1-9]\d*)$/.exec(key);
    const q=match&&ids.get(match[1]);
    return q&&Number(match[2])<(q.parts?.length??q.rubric?.criteria.length??1)&&object(cue)&&
      nonempty(cue.coaching,320)&&nonempty(cue.model,160)&&typeof cue.basis==='string'&&/^\d+-[0-9a-f]{1,8}$/.test(cue.basis);
  });
}
export function validTermRun(r,course) {
  if(!object(r)||r.course!==course||!['ap2','ap3'].includes(course)||r.version!==1||!idOK(r.id)||!time(r.created)||
    !line(r.title,300)||!['A','B','C'].includes(r.form)||!['independent','coached'].includes(r.mode)||
    !/^(unit-[1-4]|week-(?:[1-9]|10)|all|practical)$/.test(r.scope)||!Array.isArray(r.items)||!r.items.length||r.items.length>44||
    !Number.isInteger(r.index)||r.index<0||r.index>=r.items.length||!r.items.every(q=>itemOK(q,course))) return false;
  const ids=new Map(r.items.map(q=>[q.id,q]));
  if(ids.size!==r.items.length||![r.answers,r.flags,r.assisted,r.reviews].every(object)) return false;
  if((r.timeGoal!=null&&(!Number.isInteger(r.timeGoal)||r.timeGoal<1||r.timeGoal>240))||
    (r.parent!==undefined&&!idOK(r.parent))||(r.updated!==undefined&&!time(r.updated)))return false;
  if(![r.flags,r.assisted].every(m=>Object.entries(m).every(([k,v])=>ids.has(k)&&typeof v==='boolean')))return false;
  if(!Object.entries(r.answers).every(([id,v])=>{const q=ids.get(id);return q&&(q.parts?Array.isArray(v)&&v.length===q.parts.length&&v.every((a,i)=>validInput(q.parts[i],a)):validInput(q,v));}))return false;
  if(!r.submitted)return r.submitted===undefined && r.grades===undefined && !Object.keys(r.reviews).length&&r.cues===undefined&&r.queue===undefined;
  return time(r.submitted)&&object(r.grades)&&Object.keys(r.grades).length===ids.size&&
    r.items.every(q=>Object.hasOwn(r.grades,q.id)&&gradeOK(q,r.answers[q.id],r.grades[q.id]))&&
    Object.entries(r.reviews).every(([k,v])=>ids.has(k)&&reviewOK(ids.get(k),r,v))&&jobsOK(r.queue,ids,r)&&cuesOK(r.cues,ids);
}
export function courseMockStore(course,store) {
  const winter=course==='ap2';
  const all=()=>winter?Object.values(store.read().mockRuns||{}):store.mocks();
  const get=id=>!idOK(id)?null:winter?store.read().mockRuns?.[id]:store.read('mock:'+id);
  function update(id,phase,fn){
    function change(r){if(!r||Boolean(r.submitted)!==(phase==='submitted'))return false;fn(r);r.updated=Date.now();return true;}
    if(winter)store.update(records=>{change(records.mockRuns?.[id]);});
    else {const r=get(id);if(r){const copy=structuredClone(r);if(change(copy))store.write('mock:'+id,copy);}}
    return get(id);
  }
  function start(spec){
    const run={...spec,id:crypto.randomUUID(),course,version:1,created:Date.now(),index:0,answers:{},flags:{},assisted:{},reviews:{}};
    if(!validTermRun(run,course))throw new Error('This exam form could not be opened.');
    if(winter)store.update(r=>{r.mockRuns||={};r.mockRuns[run.id]=run;});
    else store.write('mock:'+run.id,run);
    return run;
  }
  return {all,get,update,start};
}
