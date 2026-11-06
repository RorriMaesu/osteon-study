import {assessQuestion} from './exam-core.js';
import {validAnswerReview, reviewMatches} from './answer-review-data.js';
import {mockExam3Form, mockExam3AllQuestions} from './mock-exam3-bank.js';
import {responseIdentity, questionIdentity, rubricCriteria, validWrittenQuestion, validWrittenReview, scoreWrittenReview, WRITTEN_RESPONSE_LIMIT} from './written-answer-judge.js';

export const MOCK_SESSION_VERSION=1;
export const MOCK_STORAGE_KEY='osteon-mock-exam3-v1';
const object=value=>!!value&&typeof value==='object'&&!Array.isArray(value);
const clone=value=>JSON.parse(JSON.stringify(value));
const bounded=(value,max,empty=false)=>typeof value==='string'&&value.length<=max&&(empty||!!value.trim());
const nowId=(now,rng)=>`${now}-${Math.floor(rng()*1e12).toString(36)}`;
const shuffle=(values,rng)=>{const result=[...values];for(let i=result.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[result[i],result[j]]=[result[j],result[i]];}return result;};
const optionsFor=q=>q.type==='choice'?[q.answer,...(q.distractors||[])]:[];

function validQuestion(q) {
  return object(q)&&bounded(q.id,160)&&bounded(q.prompt,5000)&&bounded(q.answer,8000)&&
    ['choice','identify','written'].includes(q.type)&&Number.isFinite(q.points)&&q.points>0&&q.points<=3&&Number.isInteger(q.points*2)&&
    Number.isInteger(q.chapter)&&q.chapter>=6&&q.chapter<=9&&
    (q.type!=='choice'||(Array.isArray(q.distractors)&&q.distractors.length>=1&&q.distractors.length<=5&&
      optionsFor(q).every(o=>bounded(o,2000))&&new Set(optionsFor(q)).size===optionsFor(q).length))&&
    (q.type!=='written'||validWrittenQuestion(q));
}

export function createMockSession(items, {form=mockExam3Form, rng=Math.random, now=Date.now(), cardMode='closed', timeGoalMinutes=0, mode='exam'}={}) {
  if (!Array.isArray(items)||!items.length||items.length>100||items.some(q=>!validQuestion(q))||new Set(items.map(q=>q.id)).size!==items.length) throw new Error('This exam contains an invalid or duplicate question.');
  if (!['closed','notecard','card'].includes(cardMode)||!['exam','practice'].includes(mode)||!Number.isFinite(timeGoalMinutes)||timeGoalMinutes<0||timeGoalMinutes>240) throw new Error('Choose valid exam options.');
  const questions=clone(items), id=nowId(now,rng);
  return {schema:MOCK_SESSION_VERSION,id,formId:form.id||'exam3-form-a',formVersion:String(form.version||'1'),
    title:form.title||'Exam 3 mock',mode,status:'draft',gradingState:'not-submitted',started:now,submitted:null,
    ids:questions.map(q=>q.id),questions,options:Object.fromEntries(questions.map(q=>[q.id,shuffle(optionsFor(q),rng)])),
    responses:{},assisted:{},flags:{},reviews:{},reviewHistory:[],index:0,elapsedMs:0,elapsedSeconds:0,timeGoalMinutes,cardMode,
    maxPoints:questions.reduce((sum,q)=>sum+q.points,0)};
}

export function setMockResponse(session,id,value) {
  if (session.status!=='draft') throw new Error('Submitted answers are locked. Start a separate practice attempt to answer again.');
  const q=session.questions.find(q=>q.id===id);
  if (!q||!validResponse(q,value,session.options[id],true)) throw new Error('That response is not valid for this question.');
  return {...session,responses:{...session.responses,[id]:value}};
}

function validResponse(q,response,options,allowEmpty=true) {
  return typeof response==='string'&&response.length<=(q.type==='written'?WRITTEN_RESPONSE_LIMIT:500)&&
    (q.type!=='choice'||(allowEmpty&&response==='')||options.includes(response));
}

export function submitMockSession(session,{now=Date.now(),bank=mockExam3AllQuestions}={}) {
  if (!validMockSession(session,bank)) throw new Error('The saved exam is invalid and cannot be submitted.');
  if (session.status==='submitted') return clone(session);
  if (!Number.isFinite(now)||now<session.started) throw new Error('The submission time cannot precede the exam.');
  const result=clone(session), responses=clone(session.responses);
  result.status='submitted';result.submitted=now;
  result.submission={id:session.id+'-submitted',at:now,responses,identity:responseIdentity(responses)};
  result.initialOutcomes=Object.fromEntries(result.questions.map(q=>[q.id,assessMockQuestion(q,responses[q.id],null,{submissionId:result.submission.id})]));
  result.gradingState=mockResults(result).pendingPoints?'pending':'resolved';
  return result;
}

export function assessMockQuestion(question,response,review,{submissionId}={}) {
  const answered=typeof response==='string'&&!!response.trim();
  if (question.type==='written') {
    const base={maxPoints:question.points,correction:question.rubric.modelAnswer||question.answer,strictCorrect:false,source:'rubric'};
    if (!answered) return {...base,status:'unanswered',correct:false,earnedPoints:0,pendingPoints:0,reason:'No written response was submitted.',components:rubricCriteria(question).map(c=>({...c,maxPoints:c.points,earnedPoints:0,pendingPoints:0,decision:'missing',reason:'No response was submitted.',evidence:[]}))};
    const score=scoreWrittenReview(question,review,{response,submissionId});
    if (!score) return {...base,status:'pending',correct:false,earnedPoints:0,pendingPoints:question.points,reason:'Your response is saved and awaits local rubric review.',components:rubricCriteria(question).map(c=>({...c,maxPoints:c.points,earnedPoints:0,pendingPoints:c.points,decision:'uncertain',reason:'Awaiting rubric review.',evidence:[]}))};
    const status=score.pendingPoints?'pending':score.earnedPoints===question.points?'correct':score.earnedPoints?'partial':'incorrect';
    return {...base,...score,status,correct:status==='correct',reason:review.feedback,source:review.source,studyNote:review.studyNote};
  }
  const built=assessQuestion(question,response,review);
  return {...built,maxPoints:question.points,earnedPoints:built.correct?question.points:0,pendingPoints:built.status==='pending'?question.points:0,components:[]};
}

export function mockOutcome(session,question) {
  return assessMockQuestion(question,session.responses[question.id],session.reviews?.[question.id],{submissionId:session.submission?.id});
}

function summarize(rows) {
  const earnedPoints=rows.reduce((sum,r)=>sum+r.outcome.earnedPoints,0), maxPoints=rows.reduce((sum,r)=>sum+r.outcome.maxPoints,0),pendingPoints=rows.reduce((sum,r)=>sum+r.outcome.pendingPoints,0);
  return {total:rows.length,answered:rows.filter(r=>r.answered).length,correct:rows.filter(r=>r.outcome.correct).length,
    partial:rows.filter(r=>r.outcome.status==='partial').length,pending:rows.filter(r=>r.outcome.pendingPoints>0).length,
    assisted:rows.filter(r=>r.assisted).length,earnedPoints,maxPoints,pendingPoints,
    maxPossiblePoints:earnedPoints+pendingPoints,resolvedPoints:maxPoints-pendingPoints,
    missedPoints:maxPoints-earnedPoints-pendingPoints,percentage:maxPoints?100*earnedPoints/maxPoints:0,
    independentPoints:rows.filter(r=>!r.assisted).reduce((sum,r)=>sum+r.outcome.earnedPoints,0)};
}

export function mockResults(session) {
  const rows=session.questions.map(q=>({q,response:session.responses[q.id]||'',answered:!!session.responses[q.id]?.trim(),
    outcome:mockOutcome(session,q),assisted:!!session.assisted[q.id],review:session.reviews?.[q.id]}));
  rows.forEach(r=>{r.correct=r.outcome.correct;r.pending=r.outcome.pendingPoints>0;r.earnedPoints=r.outcome.earnedPoints;r.maxPoints=r.outcome.maxPoints;});
  const grouped=field=>Object.fromEntries([...new Set(rows.map(r=>String(r.q[field]||'')))].map(key=>[key,summarize(rows.filter(r=>String(r.q[field]||'')===key))]));
  return {...summarize(rows),rows,chapters:grouped('chapter'),sections:grouped('section'),
    missed:rows.filter(r=>!r.pending&&(!r.correct||r.assisted))};
}

function validReview(review,question,session) {
  const response=session.responses[question.id];
  if (question.type==='written') return validWrittenReview(review,{question,response,submissionId:session.submission?.id});
  return question.type==='identify'&&validAnswerReview(review)&&reviewMatches(review,question,response);
}

export function applyMockReview(session,id,review,{now=Date.now()}={}) {
  if (review?.review) review=review.review;
  if (!Number.isFinite(now)||now<session.started) throw new Error('This review has an invalid timestamp.');
  if (session.status!=='submitted') throw new Error('Submit and save answers before applying a grade.');
  if (session.submission?.identity!==responseIdentity(session.responses)||JSON.stringify(session.responses)!==JSON.stringify(session.submission.responses)) throw new Error('Submitted responses changed. This grade cannot be applied.');
  const q=session.questions.find(q=>q.id===id);
  if (!q||!validReview(review,q,session)) throw new Error('This review does not match the saved answer and rubric. It was not applied.');
  const result=clone(session), old=result.reviews[id];
  if (old&&JSON.stringify(old)===JSON.stringify(review)) return result;
  if (result.reviewHistory.length>=500) throw new Error('This exam has reached its review-history limit. Export it before starting a new attempt.');
  result.reviews[id]=clone(review);
  result.reviewHistory.push({questionId:id,at:now,review:clone(review)});
  result.gradingState=mockResults(result).pendingPoints?'pending':'resolved';
  return result;
}
export const applyWrittenReview=applyMockReview;

export function validMockSession(session,bank=mockExam3AllQuestions) {
  if (!object(session)||session.schema!==MOCK_SESSION_VERSION||!bounded(session.id,160)||!bounded(session.formId,160)||
    !bounded(session.formVersion,160)||!bounded(session.title,300)||!['draft','submitted'].includes(session.status)||
    !['exam','practice'].includes(session.mode)||!['closed','notecard','card'].includes(session.cardMode)||
    !['not-submitted','pending','reviewing','resolved'].includes(session.gradingState)||
    !Array.isArray(session.questions)||!session.questions.length||session.questions.length>100||
    !Array.isArray(session.ids)||new Set(session.ids).size!==session.ids.length||session.ids.length!==session.questions.length||
    !Number.isInteger(session.index)||session.index<0||session.index>=session.ids.length||
    !Number.isFinite(session.started)||session.started<0||!Number.isFinite(session.elapsedMs)||session.elapsedMs<0||
    !Number.isFinite(session.timeGoalMinutes)||session.timeGoalMinutes<0||session.timeGoalMinutes>240||
    (session.elapsedSeconds!==undefined&&(!Number.isFinite(session.elapsedSeconds)||session.elapsedSeconds<0))) return false;
  for (const key of ['options','responses','assisted','flags','reviews']) if (!object(session[key])) return false;
  if (!Array.isArray(session.reviewHistory)||session.reviewHistory.length>500) return false;
  const known=new Map(bank.map(q=>[q.id,q]));
  for (let i=0;i<session.questions.length;i++) {
    const q=session.questions[i],original=known.get(q.id);
    if (!validQuestion(q)||session.ids[i]!==q.id||!original||JSON.stringify(q)!==JSON.stringify(original)) return false;
    const options=session.options[q.id],expected=optionsFor(q);
    if (!Array.isArray(options)||options.length!==expected.length||new Set(options).size!==expected.length||expected.some(v=>!options.includes(v))) return false;
    if (Object.hasOwn(session.responses,q.id)&&!validResponse(q,session.responses[q.id],options)) return false;
  }
  for (const key of ['options','responses','assisted','flags','reviews']) if (Object.keys(session[key]).some(id=>!session.ids.includes(id))) return false;
  for (const key of ['assisted','flags']) if (Object.values(session[key]).some(value=>typeof value!=='boolean')) return false;
  if (session.maxPoints!==session.questions.reduce((sum,q)=>sum+q.points,0)) return false;
  if (session.status==='draft') {
    if (session.submitted!==null||session.submission||session.gradingState!=='not-submitted'||Object.keys(session.reviews).length||session.reviewHistory.length) return false;
  } else {
    const sub=session.submission;
    if (!object(sub)||sub.id!==session.id+'-submitted'||!Number.isFinite(session.submitted)||session.submitted<session.started||
      sub.at!==session.submitted||!object(sub.responses)||sub.identity!==responseIdentity(session.responses)||
      JSON.stringify(sub.responses)!==JSON.stringify(session.responses)||session.gradingState==='not-submitted') return false;
    for (const [id,review] of Object.entries(session.reviews)) if (!validReview(review,known.get(id),session)) return false;
    for (const entry of session.reviewHistory) if (!object(entry)||!session.ids.includes(entry.questionId)||!Number.isFinite(entry.at)||entry.at<session.started||!validReview(entry.review,known.get(entry.questionId),session)) return false;
    const initial=session.initialOutcomes;
    if (!object(initial)||Object.keys(initial).length!==session.ids.length) return false;
    for (const q of session.questions) if (JSON.stringify(initial[q.id])!==JSON.stringify(assessMockQuestion(q,session.responses[q.id],null,{submissionId:sub.id}))) return false;
    if (session.gradingState==='resolved'&&mockResults(session).pendingPoints>0) return false;
  }
  return true;
}
export const validateMockSession=validMockSession;

export function mockReportExport(session,{notes={},card=[]}={}) {
  const result=mockResults(session);
  return {schema:1,kind:'osteon-exam3-report',exportedAt:Date.now(),session:clone(session),
    summary:Object.fromEntries(Object.entries(result).filter(([key])=>!['rows','missed'].includes(key))),
    questions:result.rows.map(r=>({id:r.q.id,prompt:r.q.prompt,response:r.response,answer:r.q.answer,
      points:r.q.points,outcome:r.outcome,assisted:r.assisted,sources:r.q.sources||r.q.evidence||[],
      initialOutcome:session.initialOutcomes?.[r.q.id],review:r.review||null})),notes:clone(notes),card:clone(card)};
}
