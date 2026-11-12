import {exposureCount} from './exam-exposure.js';
import {syllabus,legacyChapterGroups,publishedChapterIds} from './course-catalog.js';
import {examBank,EXAM_VERSION,LEGACY_EXAM_VERSION} from './exam-bank.js';
import {validAnswerReview,reviewedCorrect,reviewMatches} from './answer-review-data.js';
import {assessTyped,outcomeCorrect,GRADING_VERSION} from './typed-answer.js';
import {isMuscleCombinedScope,selectMuscleExam,muscleQuestionPoints,validMuscleBlueprint,MUSCLE_EXAM_BLUEPRINT_VERSION,muscleExamBlueprintVersions} from './muscle-exam-blueprint.js';
import {assessWritten} from './exam-written.js';
import {validWrittenReview,WRITTEN_RESPONSE_LIMIT} from './written-answer-judge.js';
export {GRADING_VERSION};
export {syllabus};
export const normalize=s=>String(s??'').normalize('NFKC').toLowerCase().replace(/[’']/g,'').replace(/[^a-z0-9]+/g,' ').replace(/\b(a|an|the|and)\b/g,' ').replace(/\s+/g,' ').trim();
export function shuffled(a,rng=Math.random){const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;}
export function gradeQuestion(q,response){
 if(q.type==='multi')return Array.isArray(response)&&response.length===q.correctChoices.length&&new Set(response).size===response.length&&q.correctChoices.every(value=>response.includes(value));
 if(q.type==='match')return !!response&&q.pairs.every(p=>response[p.left]===p.right);
 if(q.type==='order')return Array.isArray(response)&&response.length===q.steps.length&&q.steps.every((v,i)=>v===response[i]);
 if(q.type==='choice'||!q.type)return response===q.answer;
 return normalize(response)!==''&&[q.answer,...(q.aliases||[])].some(a=>normalize(a)===normalize(response));
}
export function answered(q,response){if(q.type==='multi')return Array.isArray(response)&&response.length>0;if(q.type==='match')return !!response&&q.pairs.every(p=>typeof response[p.left]==='string'&&response[p.left]);if(q.type==='order')return Array.isArray(response)&&response.length===q.steps.length;return typeof response==='string'&&!!response.trim();}
export function assessQuestion(q,response,review,{legacy=false}={}){
 if(q.type==='written')return assessWritten(q,response,null,'');
 const strict=gradeQuestion(q,response),typed=['text','identify'].includes(q.type);
 if(legacy||!typed){const correct=typed?reviewedCorrect(strict,review,q,response):strict;return {status:!answered(q,response)?'unanswered':correct?(review&&!strict?review.verdict==='spelling'?'spelling':'equivalent':'correct'):'incorrect',reason:legacy?'Original grading rules retained.':correct?'The answer matches the key.':'Compare your response with the answer key.',correction:q.answer,correct,strictCorrect:strict,source:review&&!strict&&correct?'ai':'key'};}
 const built=assessTyped(q,response);let outcome={...built,source:'builtin'};
 if(built.status==='pending'&&reviewMatches(review,q,response)&&review.status==='reviewed'&&review.confidence==='high'){
  if(reviewedCorrect(false,review,q,response))outcome={...outcome,status:review.verdict==='spelling'?'spelling':'equivalent',reason:review.explanation,source:'ai'};
  else if(review.verdict==='incorrect')outcome={...outcome,status:'incorrect',reason:review.explanation,source:'ai'};
 }
 return {...outcome,correct:outcomeCorrect(outcome),strictCorrect:strict};
}
export function gradeWithReview(q,response,review,options){return assessQuestion(q,response,review,options).correct;}
export function sessionOutcome(s,q){return q.type==='written'?assessWritten(q,s.responses[q.id],s.writtenReviews?.[q.id],s.id):assessQuestion(q,s.responses[q.id],s.aiReviews?.[q.id],{legacy:s.gradingVersion!==GRADING_VERSION});}
export function answeredCount(s,bank=examBank){const byId=new Map(bank.map(q=>[q.id,q]));return s.ids.filter(id=>byId.has(id)&&answered(byId.get(id),s.responses[id])).length;}
const cumulative={6:[2,2,7,5,2,4,3],7:[4,9,6,3,3],8:[3,7,5,7,3],9:[3,3,3,5,3,6,2]};
function comprehensiveQuotas(chapter,length=30){
 const sections=syllabus.sections.filter(s=>s.chapter===chapter),result=Object.fromEntries(sections.map(s=>[s.id,s.objectives.length]));
 let used=Object.values(result).reduce((a,b)=>a+b,0);if(used>length)throw Error('Comprehensive blueprint cannot cover this chapter.');
 while(used<length){const next=[...sections].sort((a,b)=>(b.examWeight/50*length-result[b.id])-(a.examWeight/50*length-result[a.id]))[0];result[next.id]++;used++;}
 return result;
}
export function selectExam(scope,bank=examBank,rng=Math.random,{seen={}}={}){
 if(isMuscleCombinedScope(scope))return selectMuscleExam(scope,bank);
 if(scope==='bank')return shuffled(bank,rng).sort((a,b)=>exposureCount(seen,a.id)-exposureCount(seen,b.id));
 const chapters=Object.hasOwn(legacyChapterGroups,scope)?legacyChapterGroups[scope]:publishedChapterIds.filter(id=>String(id)===String(scope));
 const sections=syllabus.sections.filter(s=>chapters.includes(s.chapter)),selected=[];
 if(chapters.some(c=>!publishedChapterIds.includes(c)))throw Error('This exam is available when all assigned chapters are published.');
 const expanded=chapters.length>1&&scope!=='all'?Object.assign({},...chapters.map(c=>comprehensiveQuotas(c,scope==='foundations12'?25:30))):null;
 if(!sections.length)throw new Error('Choose a chapter or cumulative exam.');
 for(const section of sections){
  const quota=expanded?expanded[section.id]:scope==='all'?cumulative[section.chapter][+section.id.split('.')[1]-1]:section.examWeight;
  const pool=shuffled(bank.filter(q=>q.lesson===section.id),rng).sort((a,b)=>exposureCount(seen,a.id)-exposureCount(seen,b.id));
  if(pool.length<quota)throw new Error(`Section ${section.id} has too few questions for its blueprint.`);
  const choose=source=>{
   const uncovered=new Set(section.objectives.map(o=>o.id)),chosen=[];
   while(uncovered.size){
    const candidates=source.filter(q=>!chosen.includes(q)).map(q=>({q,score:q.objectives.filter(id=>uncovered.has(id)).length})).sort((a,b)=>b.score-a.score||exposureCount(seen,a.q.id)-exposureCount(seen,b.q.id));
    if(!candidates[0]?.score||chosen.length>=quota)return null;
    const q=candidates[0].q;chosen.push(q);q.objectives.forEach(id=>uncovered.delete(id));
   }
   while(chosen.length<quota){const used=new Set(chosen.map(q=>q.type)),remaining=source.filter(q=>!chosen.includes(q));if(!remaining.length)return null;const lowest=exposureCount(seen,remaining[0].id),freshest=remaining.filter(q=>exposureCount(seen,q.id)===lowest);chosen.push(freshest.find(q=>!used.has(q.type))||freshest[0]);}
   return chosen;
  };
  const fresh=pool.filter(q=>!exposureCount(seen,q.id)),chosen=(fresh.length>=quota?choose(fresh):null)||choose(pool);
  if(!chosen)throw new Error(`Section ${section.id} cannot cover its learning objectives.`);selected.push(...chosen);
 }
 return shuffled(selected,rng);
}
const optionSet=q=>q.type==='multi'?q.choiceOrder:q.type==='match'?q.pairs.map(p=>p.right):q.type==='order'?q.steps:q.type==='choice'||!q.type?[q.answer,...q.distractors]:[];
export function choiceLabel(session,q,option){const wordings=q.wordings||[];const index=session.wording?.[q.id];return Number.isInteger(index)&&index>0?wordings[index-1]?.[q.choiceOrder.indexOf(option)]||option:option;}
export function createSession(items,{scope='custom',mode='exam',rng=Math.random,now=Date.now()}={}){
 const weighted=isMuscleCombinedScope(scope);if(weighted&&!validMuscleBlueprint(items))throw Error('The combined exam does not match its 60-question blueprint.');
 return {version:EXAM_VERSION,gradingVersion:GRADING_VERSION,id:`${now}-${Math.floor(rng()*1e9)}`,scope,mode:weighted?'exam':mode,status:'active',started:now,submitted:null,ids:items.map(q=>q.id),options:Object.fromEntries(items.map(q=>[q.id,shuffled(optionSet(q),rng)])),wording:Object.fromEntries(items.filter(q=>q.wordings?.length).map(q=>[q.id,Math.floor(rng()*(q.wordings.length+1))])),responses:{},assisted:{},flags:{},checked:{},index:0,...(weighted?{blueprintVersion:MUSCLE_EXAM_BLUEPRINT_VERSION,pointValues:Object.fromEntries(items.map(q=>[q.id,muscleQuestionPoints(q)]))}:{})};
}
export function validSession(s,bank=examBank){
 if(!s||![EXAM_VERSION,LEGACY_EXAM_VERSION].includes(s.version)||(s.version===EXAM_VERSION&&s.gradingVersion!==GRADING_VERSION)||(s.version===LEGACY_EXAM_VERSION&&s.gradingVersion!==undefined)||!['active','submitted'].includes(s.status)||!['practice','exam'].includes(s.mode)||typeof s.id!=='string'||s.id.length>100||typeof s.scope!=='string'||(s.status==='submitted'&&!Number.isFinite(s.submitted))||!Array.isArray(s.ids)||!s.ids.length||s.ids.length>bank.length||new Set(s.ids).size!==s.ids.length||!Number.isFinite(s.started)||!Number.isInteger(s.index)||s.index<0||s.index>=s.ids.length)return false;
 for(const key of ['presented','exposure','confidence'])if(s[key]!==undefined&&(!s[key]||Array.isArray(s[key])||Object.entries(s[key]).some(([id,v])=>!s.ids.includes(id)||(key==='confidence'?!['unsure','fairly sure','confident'].includes(v):!Number.isFinite(v)||v<0))))return false;
 if(s.elapsedMs!==undefined&&(!Number.isFinite(s.elapsedMs)||s.elapsedMs<0))return false;
 if(s.timeGoalMinutes!==undefined&&(!Number.isFinite(s.timeGoalMinutes)||s.timeGoalMinutes<0||s.timeGoalMinutes>240))return false;
 if(s.confidenceEnabled!==undefined&&typeof s.confidenceEnabled!=='boolean')return false;
 const byId=new Map(bank.map(q=>[q.id,q]));
 if(isMuscleCombinedScope(s.scope)&&(!validMuscleBlueprint(s.ids.map(id=>byId.get(id)).filter(Boolean))||!muscleExamBlueprintVersions.includes(s.blueprintVersion)||s.mode!=='exam'||!s.pointValues||typeof s.pointValues!=='object'||Array.isArray(s.pointValues)||Object.keys(s.pointValues).length!==s.ids.length||s.ids.some(id=>s.pointValues[id]!==muscleQuestionPoints(byId.get(id)))||(s.status==='active'&&Object.values(s.checked||{}).some(Boolean))))return false;
 if(!isMuscleCombinedScope(s.scope)&&s.pointValues!==undefined)return false;
 if(s.writtenReviews!==undefined&&(!s.writtenReviews||typeof s.writtenReviews!=='object'||Array.isArray(s.writtenReviews)||Object.entries(s.writtenReviews).some(([id,review])=>!s.ids.includes(id)||!validWrittenReview(review,{question:byId.get(id),response:s.responses?.[id],submissionId:s.id}))))return false;
 if(s.wording!==undefined&&(!s.wording||Array.isArray(s.wording)||Object.entries(s.wording).some(([id,n])=>!s.ids.includes(id)||!Number.isInteger(n)||n<0||n>(byId.get(id)?.wordings?.length||0))))return false;
 for(const key of ['options','responses','assisted','flags','checked'])if(!s[key]||typeof s[key]!=='object'||Array.isArray(s[key]))return false;
 if(s.aiReviews!==undefined&&(!s.aiReviews||typeof s.aiReviews!=='object'||Array.isArray(s.aiReviews)||Object.entries(s.aiReviews).some(([id,r])=>!s.ids.includes(id)||!validAnswerReview(r)||r.target!==id||r.answer!==byId.get(id)?.answer||(['text','identify'].includes(byId.get(id)?.type)&&r.response!==s.responses[id]))))return false;
 if(s.reviewHistory!==undefined&&(!Array.isArray(s.reviewHistory)||s.reviewHistory.length>1000||s.reviewHistory.some(r=>!s.ids.includes(r?.target)||!validAnswerReview(r)||r.answer!==byId.get(r.target)?.answer||r.response!==s.responses[r.target])))return false;
 if(s.initialOutcomes!==undefined&&(!s.initialOutcomes||typeof s.initialOutcomes!=='object'||Array.isArray(s.initialOutcomes)||Object.entries(s.initialOutcomes).some(([id,o])=>!s.ids.includes(id)||!o||!['correct','spelling','equivalent','partial','pending','incorrect','unanswered'].includes(o.status)||typeof o.correct!=='boolean'||typeof o.strictCorrect!=='boolean'||typeof o.reason!=='string'||o.reason.length>2000)))return false;
 for(const id of s.ids){const q=byId.get(id);if(!q)return false;const expected=optionSet(q),actual=s.options[id];const allowedOptions=q.type==='choice'&&q.legacyDistractors?[...expected,...q.legacyDistractors]:expected;if(!Array.isArray(actual)||actual.length!==expected.length||new Set(actual).size!==expected.length||(q.type==='choice'&&q.legacyDistractors?(!actual.includes(q.answer)||!actual.every(v=>allowedOptions.includes(v))):!expected.every(v=>actual.includes(v))))return false;
  const r=s.responses[id];if(r!==undefined){if(q.type==='multi'){if(!Array.isArray(r)||new Set(r).size!==r.length||r.some(v=>!actual.includes(v)))return false;}else if(q.type==='match'){if(!r||typeof r!=='object'||Array.isArray(r)||Object.entries(r).some(([a,b])=>!q.pairs.some(p=>p.left===a)||!expected.includes(b)))return false;}else if(q.type==='order'){if(!Array.isArray(r)||r.length!==expected.length||new Set(r).size!==expected.length||!expected.every(v=>r.includes(v)))return false;}else if(typeof r!=='string'||r.length>(q.type==='written'?WRITTEN_RESPONSE_LIMIT:2000)||(q.type==='choice'&&!actual.includes(r)))return false;}
 }
 return ['assisted','flags','checked'].every(k=>Object.entries(s[k]).every(([id,v])=>s.ids.includes(id)&&typeof v==='boolean'));
}
export function results(s,bank=examBank){
 const byId=new Map(bank.map(q=>[q.id,q]));const rows=s.ids.map(id=>{const q=byId.get(id),outcome=sessionOutcome(s,q),maxPoints=s.pointValues?.[id]||1,scale=q.type==='written'?maxPoints/(q.points||3):1,earnedPoints=q.type==='written'?outcome.earnedPoints*scale:outcome.correct?maxPoints:0,pendingPoints=q.type==='written'?outcome.pendingPoints*scale:outcome.status==='pending'?maxPoints:0;return {q,response:s.responses[id],answered:answered(q,s.responses[id]),correct:outcome.correct,strictCorrect:outcome.strictCorrect,outcome,pending:outcome.status==='pending',review:q.type==='written'?s.writtenReviews?.[id]:s.aiReviews?.[id],assisted:!!s.assisted[id],selfReviewed:outcome.source==='self-review',maxPoints,earnedPoints,pendingPoints};});
 const summarize=a=>{const correct=a.filter(x=>x.correct).length,independent=a.filter(x=>x.correct&&!x.assisted&&!x.selfReviewed).length,pending=a.filter(x=>x.pending).length,sum=key=>a.reduce((v,x)=>v+x[key],0),earnedPoints=sum('earnedPoints'),pendingPoints=sum('pendingPoints');return{total:a.length,answered:a.filter(x=>x.answered).length,correct,independent,pending,maxCorrect:correct+pending,maxIndependent:independent+a.filter(x=>x.pending&&!x.assisted&&!x.selfReviewed).length,spelling:a.filter(x=>x.outcome.status==='spelling').length,equivalent:a.filter(x=>x.outcome.status==='equivalent').length,assisted:a.filter(x=>x.assisted).length,selfReviewed:a.filter(x=>x.selfReviewed).length,maxPoints:sum('maxPoints'),earnedPoints,pendingPoints,maxPossiblePoints:earnedPoints+pendingPoints,independentPoints:a.filter(x=>!x.assisted&&!x.selfReviewed).reduce((v,x)=>v+x.earnedPoints,0)};};
 return {...summarize(rows),rows,chapters:Object.fromEntries([...new Set(rows.map(r=>r.q.lesson.split('.')[0]))].map(id=>[id,summarize(rows.filter(r=>r.q.lesson.split('.')[0]===id))])),sections:Object.fromEntries([...new Set(rows.map(r=>r.q.lesson))].map(id=>[id,summarize(rows.filter(r=>r.q.lesson===id))])),objectives:Object.fromEntries([...new Set(rows.flatMap(r=>r.q.objectives||[]))].map(id=>[id,summarize(rows.filter(r=>r.q.objectives?.includes(id)))]))};
}
