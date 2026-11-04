import {localAI} from './local-ai.js';
import {LocalAnswerJudge,judgeSettings,setJudgeSettings} from './answer-judge.js';
import {reviewLabel} from './answer-review-data.js';
import {assessAnatomyAnswer} from './anatomy-answer.js';
import {outcomeCorrect,outcomeLabel} from './typed-answer.js';
import {addSpellingNote} from './storage.js';
export {judgeSettings};
const judge=new LocalAnswerJudge(),jobs=new Set();
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function judgeControls(){const s=judgeSettings();return `<span class="answer-review-controls"><label><input type="checkbox" data-answer-review ${s.enabled?'checked':''}> Local AI answer review</label><button type="button" data-answer-review-setup>${localAI.state.ready?'AI ready · Settings':'Set up local AI'}</button></span>`;}
const hint=()=> 'Built-in spelling support is on. Clear typos retain anatomy credit; uncertain wording stays pending. '+(judgeSettings().enabled?'Local AI can review the original wording.':'Local AI is optional.');
export const judgeHint=({builtin=false}={})=>builtin?'<p class="tiny">Built-in spelling support is on. Clear typos and accepted wording receive credit; uncertain meaning stays for review after submission.</p>':`<p class="tiny" data-answer-review-hint>${hint()}</p>`;
export function reviewHTML(review,{pending=false}={}){if(!review)return'';const label=pending?'Meaning review is still pending':reviewLabel(review),explanation=pending?'The local review was unavailable or uncertain. Your original response is saved for another review; this is not a confirmed mistake.':review.explanation;return `<div class="answer-review-result ${review.status==='reviewed'?'':'answer-review-notice'}"><strong>${escape(label)}</strong><p>${escape(explanation)}</p>${!pending&&review.status==='reviewed'&&review.correctedAnswer?`<p class="tiny">Standard answer: <b>${escape(review.correctedAnswer)}</b></p>`:''}<p class="tiny">${review.model?'Local model: '+escape(review.model)+' · ':''}${review.reference?'OpenStax §'+escape(review.reference)+' · ':''}The original response and answer-key result are retained. AI can make mistakes.</p></div>`;}
export async function connectAnswerReviewer(signal){const c=await judge.connect({signal});if(!localAI.state.ready)await localAI.test(signal);return c;}
export function openAnswerReviewSetup(options){openSetup(options);}
export function bindJudgeControls(root,{dialog,toast}={}){
 root?.querySelectorAll('[data-answer-review]').forEach(input=>input.onchange=()=>{setJudgeSettings({enabled:input.checked});if(input.checked&&!localAI.state.ready){document.querySelector('#info-dialog')?.close();document.dispatchEvent(new CustomEvent('localaiopen',{detail:{returnToReview:true}}));}});
 root?.querySelectorAll('[data-answer-review-setup]').forEach(button=>button.onclick=()=>openSetup({dialog,toast}));
}
if(typeof document!=='undefined'){
 document.addEventListener('localaistatechange',()=>{document.querySelectorAll('[data-answer-review-setup]').forEach(b=>b.textContent=localAI.state.ready?'AI ready · Settings':'Set up local AI');const status=document.querySelector('#answer-review-connection');if(status)status.textContent=localAI.state.ready?'Ready · '+localAI.state.model:localAI.state.connected?'Ollama connected · finish model setup':'Local AI needs setup';});
 document.addEventListener('answerreviewchange',()=>{document.querySelectorAll('[data-answer-review]').forEach(input=>input.checked=judgeSettings().enabled);document.querySelectorAll('[data-answer-review-hint]').forEach(p=>p.textContent=hint());});
 document.addEventListener('viewchange',()=>cancelAnswerReviews());
}
export function cancelAnswerReviews(){for(const controller of jobs)controller.abort(new DOMException('Review canceled.','AbortError'));}
export async function reviewWithUI({target,response,strictCorrect,allowOverride=true,root,signal,enabled=judgeSettings().enabled,pending=false}){
 let outcome=null;
 if(allowOverride&&(target.representation||target.listRecall)&&response?.trim()&&response!=='Answer revealed'){
  outcome=assessAnatomyAnswer(target,response);pending=outcome.status==='pending';
  if(outcome.status==='spelling')addSpellingNote({term:outcome.correction,sourceId:target.id,reference:target.reference||target.representation?.reference||'',response,attemptKey:`anatomy:${target.id}:${Date.now()}`});
  if(!pending||!enabled)return {correct:!!strictCorrect||outcomeCorrect(outcome),review:null,outcome,pending};
 }
 if(!enabled||!response?.trim()||response==='Answer revealed')return {correct:strictCorrect,review:null};
 const controller=new AbortController(),abort=()=>controller.abort(signal?.reason);signal?.addEventListener('abort',abort,{once:true});if(signal?.aborted)abort();jobs.add(controller);
 if(root){root.innerHTML=`<div class="answer-review-pending" role="status"><span class="answer-review-spinner" aria-hidden="true"></span><span>Reviewing your submitted answer with local Ollama…<small> The first review can take longer while the model loads.</small></span><button type="button" data-review-cancel>${pending?'Leave answer pending':'Use answer key instead'}</button></div>`;root.querySelector('[data-review-cancel]').onclick=()=>controller.abort(new DOMException('Review canceled.','AbortError'));}
 try{const result=await judge.review({target,response,strictCorrect,allowOverride},{signal:controller.signal});if(outcome){const resolved=result.review?.status==='reviewed'&&result.review.confidence==='high'&&result.review.verdict!=='uncertain';outcome={...outcome,status:resolved?(result.correct?result.review.verdict==='spelling'?'spelling':'equivalent':'incorrect'):'pending',reason:result.review?.explanation||outcome.reason};return {...result,outcome,pending:outcome.status==='pending'};}return result;}
 catch(err){return {correct:strictCorrect,...(outcome?{outcome,pending:true}:{}),review:{schema:1,status:'unavailable',verdict:'uncertain',confidence:'low',target:target.id,answer:target.answer,response,strictCorrect:!!strictCorrect,allowOverride:!!allowOverride,model:judgeSettings().model,correctedAnswer:target.answer,explanation:controller.signal.aborted?(pending?'AI review was canceled. The original answer remains pending.':'AI review was canceled. The answer-key result is used.'):(pending?'Could not complete local AI review. The original answer remains pending. ':'Could not complete local AI review. The answer-key result is used. ')+(err.message?.includes('fetch')?'Check Ollama and website access in Models & connection.':String(err.message||'Check Ollama and retry.')).slice(0,900),reference:/^\d+\.\d+$/.test(target.reference||target.lesson||'')?String(target.reference||target.lesson):'',at:Date.now()}};}
 finally{jobs.delete(controller);signal?.removeEventListener('abort',abort);}
}
export function builtinReviewHTML(outcome){return outcome?`<div class="answer-review-result ${outcome.status==='pending'?'answer-review-notice':''}"><strong>${escape(outcomeLabel(outcome))}</strong><p>${escape(outcome.reason)}</p>${outcome.status==='spelling'?'<p>Credit retained. This term is saved in Spelling review.</p>':''}${outcome.status==='pending'?'<p>Your original wording needs review. This is not recorded as an anatomy mistake. Compare the standard term, then practice it independently.</p>':''}</div>`:'';}
function openSetup({dialog,toast}={}){
 if(!dialog)return;
 const state=localAI.snapshot();
 dialog(`<h2>Your local <em>answer reviewer.</em></h2><p>Built-in spelling support already accepts clear typos in chapter exams. Optional local AI can review unresolved wording after you submit.</p><div class="control-row">${judgeControls()}</div><div class="ai-summary"><b id="answer-review-connection" role="status">${state.ready?'Ready · '+escape(state.model):state.connected?'Ollama connected · finish model setup':'Local AI needs setup'}</b><p>The tutor and answer reviewer share the same connection and model.</p></div><button class="primary" id="answer-review-tutor-setup">${state.ready?'Manage local AI':'Set up local AI'}</button><p>Setup opens over your exam. Your answers and position stay saved. Choose <b>Return to my exam</b> when you finish.</p><p class="tiny">AI review after submission is grading. Tutor help before answering still counts as assistance. Choices, matching, ordering, and clicked targets keep their answer-key score. Uncertain wording in chapter exams stays pending for later review.</p><p class="tiny">AI can make mistakes. Your original response and source key are retained. Requests use Ollama on this computer; there is no cloud fallback.</p>`);
 const root=document.querySelector('#dialog-content');root.querySelector('[data-answer-review-setup]')?.remove();bindJudgeControls(root,{dialog,toast});
 root.querySelector('#answer-review-tutor-setup').onclick=()=>{document.querySelector('#info-dialog').close();document.dispatchEvent(new CustomEvent('localaiopen',{detail:{returnToReview:true}}));};
}
