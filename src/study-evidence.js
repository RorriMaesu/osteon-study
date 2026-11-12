import {scoreWrittenReview} from './written-answer-judge.js';
// Written rubrics and self-review are kept outside automatic retrieval totals.
export const automaticPracticeQuestions=items=>items.filter(q=>q.type!=='written');
export const rubricPracticeQuestions=items=>items.filter(q=>q.type==='written');
export function sectionCheckpoint(items,attempts=[],count=5){
 const limit=Math.max(0,Math.min(100,Math.floor(Number(count)||0)));if(!limit)return [];
 const latest=new Map();for(const a of attempts)if(!a.selfRated&&(!latest.has(a.id)||latest.get(a.id).at<a.at))latest.set(a.id,a);
 const rank=q=>!latest.has(q.id)?1:latest.get(q.id).correct&&!latest.get(q.id).assisted?2:0;
 const pool=[...new Map(automaticPracticeQuestions(items).map(q=>[q.id,q])).values()].sort((a,b)=>rank(a)-rank(b)||(latest.get(a.id)?.at||0)-(latest.get(b.id)?.at||0)),out=[],used=new Set();
 for(const q of pool){const concept=q.objectives?.[0]||q.lesson;if(!used.has(concept)){used.add(concept);out.push(q);if(out.length===limit)return out;}}
 for(const q of pool)if(out.length<limit&&!out.includes(q))out.push(q);return out;
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
