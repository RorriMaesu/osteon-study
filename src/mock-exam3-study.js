import {mockExam3Related} from './mock-exam3-bank.js';

// A different ID does not make a repeated prompt a new retrieval task.
const wording = question => question.prompt.toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();

export function chooseMockPractice(question, history=[], {exclude=[], related=mockExam3Related}={}) {
  const seen=new Map();
  for(const session of history)for(const q of session.questions||[])seen.set(wording(q),Math.max(seen.get(wording(q))||0,session.submitted||session.started||0));
  seen.set(wording(question),Math.max(seen.get(wording(question))||0,1));
  const blocked=new Set(exclude);
  const candidates=related(question.id).filter(q=>!blocked.has(q.id)&&wording(q)!==wording(question));
  candidates.sort((a,b)=>(seen.has(wording(a))-seen.has(wording(b)))||((seen.get(wording(a))||0)-(seen.get(wording(b))||0)));
  const selected=candidates[0]||(!blocked.has(question.id)?question:null);
  if(!selected)return null;
  return {question:selected,kind:wording(selected)===wording(question)?'repeat':seen.has(wording(selected))?'revisit':'new'};
}

export function mockStudyPriorities(result) {
  const groups=new Map();
  for(const row of result.rows) {
    const missed=row.outcome.maxPoints-row.outcome.earnedPoints-row.outcome.pendingPoints;
    if(missed<=0&&!row.assisted)continue;
    const key=row.q.lesson;
    if(!groups.has(key))groups.set(key,{lesson:key,chapter:row.q.chapter,missedPoints:0,pendingPoints:0,assisted:0,questionIds:[],topics:[]});
    const group=groups.get(key);
    group.missedPoints+=missed;group.pendingPoints+=row.outcome.pendingPoints;group.assisted+=Number(row.assisted);
    group.questionIds.push(row.q.id);if(!group.topics.includes(row.q.topic))group.topics.push(row.q.topic);
  }
  return [...groups.values()].sort((a,b)=>b.missedPoints-a.missedPoints||b.assisted-a.assisted||a.lesson.localeCompare(b.lesson,undefined,{numeric:true}));
}

export function mockReportRoute(id,slug='exam3') {return `${slug}-results/${encodeURIComponent(id)}`;}
export function parseMockReportRoute(route,slug='exam3') {
  const prefix=slug+'-results/';
  if(!route.startsWith(prefix))return null;
  const encoded=route.slice(prefix.length);
  if(encoded.includes('/'))return null;
  try {const id=decodeURIComponent(encoded);return id&&id.length<=160?id:null;}catch{return null;}
}
