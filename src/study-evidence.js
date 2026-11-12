import {scoreWrittenReview} from './written-answer-judge.js';
// Written rubrics and self-review are kept outside automatic retrieval totals.
export const automaticPracticeQuestions=items=>items.filter(q=>q.type!=='written');
export const rubricPracticeQuestions=items=>items.filter(q=>q.type==='written');
export function sectionCheckpoint(items,attempts=[],count=5){
 const limit=Math.max(0,Math.min(100,Math.floor(Number(count)||0)));if(!limit)return [];
 const latest=new Map();for(const a of attempts)if(!a.selfRated&&(!latest.has(a.id)||latest.get(a.id).at<a.at))latest.set(a.id,a);
 const rank=q=>!latest.has(q.id)?1:latest.get(q.id).correct&&!latest.get(q.id).assisted?2:0;
 const pool=[...new Map(automaticPracticeQuestions(items).map(q=>[q.id,q])).values()].sort((a,b)=>rank(a)-rank(b)||(latest.get(a.id)?.at||0)-(latest.get(b.id)?.at||0)),out=[],used=new Set();
 const take=predicate=>{if(out.length>=limit)return;const candidates=pool.filter(q=>!out.includes(q)&&predicate(q)),next=candidates.find(q=>(q.objectives||[]).some(id=>!used.has(id)))||candidates[0];if(next){out.push(next);(next.objectives||[]).forEach(id=>used.add(id));}};
 // Repair one demonstrated gap first. In a fresh five-item muscle checkpoint,
 // reserve different evidence: a view, a prediction, a name, and relationships.
 const muscle=pool.length&&pool.every(q=>/^1[01]\./.test(q.lesson));
 if(muscle&&limit>=4){take(q=>rank(q)===0);take(q=>!!q.figure&&q.objectives?.length);take(q=>q.assessmentFacets?.includes('application'));take(q=>q.type==='text');take(q=>['match','order'].includes(q.type));}
 while(out.length<limit){const before=out.length;take(()=>true);if(out.length===before)break;}return out;
}
export function rubricStudyEvidence(items,sessions=[]){
 const targets=rubricPracticeQuestions(items),latest=new Map();
 for(const s of sessions)if(s?.status==='submitted'&&Number.isFinite(s.submitted)&&Array.isArray(s.ids))for(const q of targets){
  const response=s.responses?.[q.id];if(!s.ids.includes(q.id)||typeof response!=='string'||!response.trim())continue;
  if(!latest.has(q.id)||latest.get(q.id).session.submitted<s.submitted)latest.set(q.id,{q,response,session:s});
 }
 const rows=targets.map(q=>{const entry=latest.get(q.id);if(!entry)return {q,state:'unattempted'};
  const review=entry.session.writtenReviews?.[q.id],score=scoreWrittenReview(q,review,{response:entry.response,submissionId:entry.session.id});
  return {...entry,review,score,state:!score||score.pendingPoints?'pending':review.source==='learner'?'self-reviewed':'reviewed'};
 });
 return {total:targets.length,submitted:latest.size,reviewed:rows.filter(r=>r.state==='reviewed').length,selfReviewed:rows.filter(r=>r.state==='self-reviewed').length,pending:rows.filter(r=>r.state==='pending').length,unattempted:targets.length-latest.size,rows};
}
