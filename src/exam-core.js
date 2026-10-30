import syllabus from './curriculum-syllabus.json' with {type:'json'};
import {examBank,EXAM_VERSION} from './exam-bank.js';
export {syllabus};
export const normalize=s=>String(s??'').normalize('NFKC').toLowerCase().replace(/[’']/g,'').replace(/[^a-z0-9]+/g,' ').replace(/\b(a|an|the|and)\b/g,' ').replace(/\s+/g,' ').trim();
export function shuffled(a,rng=Math.random){const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;}
export function gradeQuestion(q,response){
 if(q.type==='match')return !!response&&q.pairs.every(p=>response[p.left]===p.right);
 if(q.type==='order')return Array.isArray(response)&&response.length===q.steps.length&&q.steps.every((v,i)=>v===response[i]);
 if(q.type==='choice'||!q.type)return response===q.answer;
 return normalize(response)!==''&&[q.answer,...(q.aliases||[])].some(a=>normalize(a)===normalize(response));
}
export function answered(q,response){if(q.type==='match')return !!response&&q.pairs.every(p=>typeof response[p.left]==='string'&&response[p.left]);if(q.type==='order')return Array.isArray(response)&&response.length===q.steps.length;return typeof response==='string'&&!!response.trim();}
const cumulative={6:[2,2,7,5,2,4,3],7:[4,9,6,3,3],8:[3,7,5,7,3],9:[3,3,3,5,3,6,2]};
export function selectExam(scope,bank=examBank,rng=Math.random){
 if(scope==='bank')return shuffled(bank,rng);
 const sections=syllabus.sections.filter(s=>scope==='all'||String(s.chapter)===String(scope)),selected=[];
 if(!sections.length)throw new Error('Choose a chapter or cumulative exam.');
 for(const section of sections){
  const quota=scope==='all'?cumulative[section.chapter][+section.id.split('.')[1]-1]:section.examWeight;
  const pool=shuffled(bank.filter(q=>q.lesson===section.id),rng),uncovered=new Set(section.objectives.map(o=>o.id)),chosen=[];
  if(pool.length<quota)throw new Error(`Section ${section.id} has too few questions for its blueprint.`);
  while(uncovered.size){
   const candidates=pool.filter(q=>!chosen.includes(q)).map(q=>({q,score:q.objectives.filter(id=>uncovered.has(id)).length})).sort((a,b)=>b.score-a.score);
   if(!candidates[0]?.score||chosen.length>=quota)throw new Error(`Section ${section.id} cannot cover its learning objectives.`);
   const q=candidates[0].q;chosen.push(q);q.objectives.forEach(id=>uncovered.delete(id));
  }
  // Prefer missing response formats when filling a section's remaining slots.
  while(chosen.length<quota){const used=new Set(chosen.map(q=>q.type)),remaining=pool.filter(q=>!chosen.includes(q));chosen.push(remaining.find(q=>!used.has(q.type))||remaining[0]);}
  selected.push(...chosen);
 }
 return shuffled(selected,rng);
}
export function createSession(items,{scope='custom',mode='exam',rng=Math.random,now=Date.now()}={}){
 return {version:EXAM_VERSION,id:`${now}-${Math.floor(rng()*1e9)}`,scope,mode,status:'active',started:now,submitted:null,ids:items.map(q=>q.id),options:Object.fromEntries(items.map(q=>[q.id,q.type==='match'?shuffled(q.pairs.map(p=>p.right),rng):q.type==='order'?shuffled(q.steps,rng):q.type==='choice'||!q.type?shuffled([q.answer,...q.distractors],rng):[]])),responses:{},assisted:{},flags:{},checked:{},index:0};
}
export function validSession(s,bank=examBank){
 if(!s||s.version!==EXAM_VERSION||!['active','submitted'].includes(s.status)||!['practice','exam'].includes(s.mode)||typeof s.id!=='string'||s.id.length>100||typeof s.scope!=='string'||(s.status==='submitted'&&!Number.isFinite(s.submitted))||!Array.isArray(s.ids)||!s.ids.length||s.ids.length>1000||new Set(s.ids).size!==s.ids.length||!Number.isFinite(s.started)||!Number.isInteger(s.index)||s.index<0||s.index>=s.ids.length)return false;
 const byId=new Map(bank.map(q=>[q.id,q]));
 for(const key of ['options','responses','assisted','flags','checked'])if(!s[key]||typeof s[key]!=='object'||Array.isArray(s[key]))return false;
 for(const id of s.ids){const q=byId.get(id);if(!q)return false;const expected=q.type==='match'?q.pairs.map(p=>p.right):q.type==='order'?q.steps:q.type==='choice'||!q.type?[q.answer,...q.distractors]:[],actual=s.options[id];if(!Array.isArray(actual)||actual.length!==expected.length||new Set(actual).size!==expected.length||!expected.every(v=>actual.includes(v)))return false;
  const r=s.responses[id];if(r!==undefined){if(q.type==='match'){if(!r||typeof r!=='object'||Array.isArray(r)||Object.entries(r).some(([a,b])=>!q.pairs.some(p=>p.left===a)||!expected.includes(b)))return false;}else if(q.type==='order'){if(!Array.isArray(r)||r.length!==expected.length||new Set(r).size!==expected.length||!expected.every(v=>r.includes(v)))return false;}else if(typeof r!=='string'||r.length>2000||(q.type==='choice'&&!expected.includes(r)))return false;}
 }
 return ['assisted','flags','checked'].every(k=>Object.entries(s[k]).every(([id,v])=>s.ids.includes(id)&&typeof v==='boolean'));
}
export function results(s,bank=examBank){
 const byId=new Map(bank.map(q=>[q.id,q]));const rows=s.ids.map(id=>{const q=byId.get(id);return {q,response:s.responses[id],answered:answered(q,s.responses[id]),correct:gradeQuestion(q,s.responses[id]),assisted:!!s.assisted[id]};});
 const summarize=a=>({total:a.length,answered:a.filter(x=>x.answered).length,correct:a.filter(x=>x.correct).length,independent:a.filter(x=>x.correct&&!x.assisted).length,assisted:a.filter(x=>x.assisted).length});
 return {...summarize(rows),rows,sections:Object.fromEntries([...new Set(rows.map(r=>r.q.lesson))].map(id=>[id,summarize(rows.filter(r=>r.q.lesson===id))])),objectives:Object.fromEntries([...new Set(rows.flatMap(r=>r.q.objectives||[]))].map(id=>[id,summarize(rows.filter(r=>r.q.objectives?.includes(id)))]))};
}
