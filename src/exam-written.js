import {scoreWrittenReview} from './written-answer-judge.js';
export function assessWritten(q,response,review,submissionId){
 const max=q.points||3;
 if(typeof response!=='string'||!response.trim())return {status:'unanswered',correct:false,strictCorrect:false,reason:'No written response was submitted.',source:'rubric',earnedPoints:0,pendingPoints:0,maxPoints:max};
 const score=scoreWrittenReview(q,review,{response,submissionId});
 if(!score)return {status:'pending',correct:false,strictCorrect:false,reason:'Written answer saved. Compare each rubric criterion after submission, or request a local AI review. No unsupported keyword grade has been assigned.',source:'rubric',earnedPoints:0,pendingPoints:max,maxPoints:max};
 const correct=score.earnedPoints===max,status=score.pendingPoints?'pending':correct?'correct':score.earnedPoints?'partial':'incorrect';
 return {...score,status,correct,strictCorrect:false,reason:review.feedback,source:review.source==='learner'?'self-review':'ai',correction:q.answer};
}
