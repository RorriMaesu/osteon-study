import {MOCK_EXAM3_VERSION,mockExam3Questions,mockExam3Form,mockExam3Rotations,mockExam3Related,mockExam3AllQuestions,mockExam3Calibration,mockExam3CoverageQuestions,mockExam3CoverageForm} from './mock-exam3-bank.js';
import {createMockSession,setMockResponse,submitMockSession,mockResults,applyMockReview,mockReportExport,mockTermReviewTarget,mockOutcome,claimResponseParts,mockRubricQuestion,mockRubricResponse} from './mock-exam3-core.js';
import {WrittenAnswerJudge,WRITTEN_RESPONSE_LIMIT,WRITTEN_QUALIFICATION_KEY,isWrittenModelQualified,compactWrittenQualification,createLearnerWrittenReview,rubricCriteria} from './written-answer-judge.js';
import verifiedModels from './mock-exam3-qualified-models.json' with {type:'json'};
import {LocalAnswerJudge} from './answer-judge.js';
import {localAI} from './local-ai.js';
import {chooseMockPractice,mockStudyPriorities,mockReportRoute} from './mock-exam3-study.js';
import {setLearningContext,setTutorAssessmentMode} from './learning-context.js';
import {addSpellingNote} from './storage.js';
import {spellingDeck,startSpellingReview} from './spelling-review.js';
import {courseMuscleTargetById} from './muscle-spatial-data.js';
import {chapter11Muscles} from './chapter11-muscles.js';
import {syllabus} from './course-catalog.js';
import {MOCK_EXAM4_VERSION,mockExam4Forms,mockExam4AllQuestions,mockExam4Related,mockExam4AllCalibration,mockExam4AttachmentQuestions,mockExam4AttachmentForm} from './mock-exam4-bank.js';
import {mockExam4QuizShowForm} from './mock-exam4-quiz-show.js';
import {mockExam4Storage} from './mock-exam4-store.js';
import {renderMockExam4Figure,preloadMockExam4Figures} from './mock-exam4-figures.js';
import {renderMockFigure,preloadMockFigures} from './mock-exam3-figures.js';
import {blankMockState,readMockState,writeMockState,mockBackup,parseMockBackup,addCardCandidate,cardText} from './mock-exam3-store.js';

import {mountMock4Screen,mountMock4Dialog,mock4Group,mock4Details} from './mock-exam4-pages.js';
import {STUDY_DRAFT_VERSION,builtInStudyDraft,getWrittenSuggestion,hasConfirmedMiss,missedStudyPriorities,priorityRecall,refineStudyDrafts,saveWrittenSuggestion,studyBasis,studyEvidence,studyNoteValue,studyRecallItems,writtenSuggestionScore} from './mock-review-tools.js';
import {renderStudyNote,renderStudyRecall} from './mock-study-sheet.js';

const exam3Sections=[['mc','01','Multiple choice','30 questions · one answer each',30],['diagram','02','Anatomy in view','9 packet targets · precise naming',18],['tf','03','True or false','3 statements · check the distinction',6],['written','04','Explain the mechanism','2 written responses · partial credit',6]];
const chapterNames={6:'Bone tissue',7:'Axial skeleton',8:'Appendicular skeleton',9:'Joints',10:'Muscle tissue',11:'Muscular system'};
const point=n=>Number(n).toLocaleString(undefined,{maximumFractionDigits:1});
const date=n=>new Date(n).toLocaleDateString(undefined,{month:'short',day:'numeric'});
const duration=s=>`${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;

export function mockExam3FeatureHTML(){return `<article class="learning-panel exam-hub-card mock-form-feature"><div class="mock-feature-inner"><div><span class="eyebrow">YOUR COURSE / CHAPTERS 06–09</span><h2>Exam 3. <em>Make it count.</em></h2><p>A course-grounded mock with real lab diagrams, written explanations and a study plan built from the points you miss.</p><div class="control-row"><button class="primary" data-mock-open>Open Exam 3 mock ↗</button><span class="tiny">44 questions · 60 points · save & resume</span></div></div><div class="mock-feature-badge" aria-hidden="true"><strong>03</strong><span>MOCK EXAM</span></div></div></article>`;}

export function mockExam4FeatureHTML(){
 return '<article class="learning-panel exam-hub-card exam-featured"><span class="eyebrow">CHAPTERS 10–11 / MOCK EXAM</span><h2>Exam 4</h2><p>Two 44-question mocks with diagrams and written explanations, plus a 21-question Quiz Show Review.</p><button class="primary" data-exam4-open>Open Exam 4 mock ↗</button></article>';
}
export const initMockExam3=options=>initMockExam(options,3);
export const initMockExam4=options=>initMockExam(options,4);

function initMockExam({setView,dialog:openDialog,toast,escape:e},number){
 const exam4=number===4,slug='exam'+number,label='Exam '+number;
 const questions=exam4?mockExam4AllQuestions:mockExam3AllQuestions;
 const relatedQuestions=exam4?mockExam4Related:mockExam3Related;
 const storage=exam4?mockExam4Storage:{blank:blankMockState,read:readMockState,write:writeMockState,backup:mockBackup,restore:parseMockBackup,key:'osteon-mock-exam3-v1'};
 const calibration=exam4?mockExam4AllCalibration.map(f=>{
  const q=mockExam4AllQuestions.find(item=>item.id===f.questionId);
  return q.claim?{...f,response:mockRubricResponse(q,f.response),expectedPoints:{'criterion-2':f.expectedPoints['criterion-2']}}:f;
 }):mockExam3Calibration;
 const gradingQuestions=exam4?questions.map(mockRubricQuestion):questions;
 const sections=exam4?[['mc','01','Multiple choice'],['diagram','02','Diagram matching'],['tf','03','True or false'],['written','04','Written explanations']]:exam3Sections;
 const sectionName=k=>sections.find(s=>s[0]===k)?.[2]||'Targeted recall';
 const renderFigure=exam4?renderMockExam4Figure:renderMockFigure;
 const formatLabel=()=>exam4?session.title+(session.mode==='practice'?' · Coached practice':''):(session.mode==='practice'?'Targeted recall':'Form A / Exam 3');
 const root=document.querySelector('#practice-view');
 let state,storageError='',unreadableRecord='',loadingFigures=false,session=null,screen='home',filter='missed',controller=null,gradingMessage='',autoGrade=!exam4,coachedFeedback=null;
 let lastTick=Date.now(),gradingEpoch=0,ownsView=false;
 let layout,paintedQuestion='',reviewIndex=null,notesOpen=false,operation='',reviewContinuation=null,reviewFailures=[],recallLayout=null;
 function dialog(html,decorate){
  openDialog(html);
  if(exam4)return mountMock4Dialog(document.querySelector('#dialog-content'),decorate);
 }
 function focusItem(node){if(node){layout?.reveal(node);node.focus({preventScroll:exam4});}}
 function cancelJob(){if(controller){controller.abort();controller=null;operation='';gradingEpoch++;gradingMessage='Review stopped. Completed work is saved.';}}
 const writtenJudge=new WrittenAnswerJudge(),termJudge=new LocalAnswerJudge();
 let qualifications=exam4?[]:[...verifiedModels];
 try{const saved=JSON.parse(localStorage.getItem(WRITTEN_QUALIFICATION_KEY)||'[]');if(Array.isArray(saved))qualifications.push(...saved.slice(-30));}catch{}
 const qualified=q=>qualifications.some(record=>isWrittenModelQualified(record,{...localAI.snapshot(),questionId:q.id},gradingQuestions,calibration));
 try{state=storage.read(localStorage);}catch(error){state=storage.blank();storageError=error.message;try{unreadableRecord=localStorage.getItem(storage.key)||'';}catch{}}
 const query=s=>root.querySelector(s);
 const active=()=>location.hash==='#'+slug||location.hash.startsWith('#'+slug+'-');
 const coaching=()=>exam4&&session?.mode==='practice';
 const setStatus=()=>{root.querySelectorAll('[data-mock-saved]').forEach(el=>{el.textContent=storageError?'Not saved — export a backup': 'Saved on this device';el.dataset.error=String(!!storageError);});};
 function save(){if(unreadableRecord){setStatus();return false;}try{storage.write(localStorage,state);storageError='';setStatus();return true;}catch(error){storageError=error.message||'Browser storage is full.';setStatus();return false;}}
 const draftSlot=formId=>exam4&&formId===mockExam4QuizShowForm.id?'quizShowDraft':'active';
 function putSession(){
  if(!session)return;
  const slot=draftSlot(session.formId);
  if(session.status==='draft')state[slot]=session;
  else{
   const i=state.history.findIndex(s=>s.id===session.id);
   if(i<0)state.history.push(session);else state.history[i]=session;
   state.history=state.history.slice(-20);
   if(state[slot]?.id===session.id)state[slot]=null;
  }
  return save();
 }
 function checkpoint(){if(session?.status==='draft'&&screen==='exam'&&active()&&!document.hidden){const delta=Math.min(6000,Math.max(0,Date.now()-lastTick));session.elapsedMs+=delta;session.elapsedSeconds=Math.floor(session.elapsedMs/1000);}lastTick=Date.now();}
 function paint(html,route,start){const prior=route===screen?layout?.selection():null;layout?.close();checkpoint();if(route!=='results')cancelJob();screen=route;ownsView=true;document.body.dataset.mockExamActive=slug;document.body.dataset.conceptActive='true';delete document.body.dataset.examActive;delete document.body.dataset.precisionActive;
  const path=route==='home'?slug:route==='results'||route==='spelling'?mockReportRoute(session.id,slug):
   route==='exam'&&draftSlot(session.formId)==='quizShowDraft'?'exam4-quiz-show':slug+'-'+route;
  setView('practice',{route:path});root.innerHTML=`<div class="mock-shell${exam4?' mock-exam4':''}" data-mock-screen="${route}">${html}</div>`;root.scrollTop=0;layout=exam4?mountMock4Screen(root.firstElementChild,route,start||prior):null;setStatus();lastTick=Date.now();root.onclick=handleClick;root.oninput=handleInput;root.onchange=handleChange;root.onkeydown=handleKeys;if(exam4)setTutorAssessmentMode(route==='exam'?session.mode==='exam'?'exam':'practice':null);}
 function top(back='Exam center',action='center'){const ai=localAI.snapshot();return `<div class="mock-topline"><button data-mock-action="${action}">← ${e(back)}</button><div class="control-row"><span class="mock-save-state" data-mock-saved role="status"></span><button class="mock-chip ${ai.ready?'ready':''}" data-mock-action="ai"><i aria-hidden="true"></i>${ai.ready?'Local AI ready':'Local AI setup'}</button></div></div>`;}
 function aiSetup(continuation){document.dispatchEvent(new CustomEvent('localaiopen',{detail:{returnToReview:true,continuation}}));}
 function continueAfterSetup(label,run){
  const attemptId=session?.id;
  const request={label,run:()=>{
   if(reviewContinuation!==request||screen!=='results'||!active()||session?.id!==attemptId)return;
   reviewContinuation=null;
   run();
  }};
  reviewContinuation=request;
  aiSetup(request);
 }
 function home(){checkpoint();if(session?.status==='draft')putSession();session=null;filter='missed';reviewIndex=null;notesOpen=false;reviewContinuation=null;reviewFailures=[];gradingMessage='';const draft=state.active;
  if(exam4){home4(draft);return;}
  paint(`${top()}<section class="mock-hero"><div><span class="mock-kicker">EXAM 3 / CHAPTERS 6–9</span><h1>Know the structure.<br><em>Explain the why.</em></h1><p class="mock-lead">Your course, brought into focus. Work through the most strongly supported question families, then turn missed points into your next study session.</p><div class="mock-hero-actions"><button class="mock-btn primary" data-mock-action="${draft?'resume':'start'}">${draft?'Resume your mock':'Begin Form A'} <span aria-hidden="true">↗</span></button><button class="mock-btn" data-mock-action="card">Your notecard ↗</button></div><p class="mock-hero-foot">Built from the Quiz Show review, Bone Questions, labs and past-exam patterns. A practice estimate—not the instructor’s actual exam or official rubric.</p></div><div><div class="mock-orbit" aria-hidden="true"><strong>03</strong><span>A course-focused mock</span></div><div class="mock-stat-trio"><div><strong>44</strong><span>QUESTIONS</span></div><div><strong>60</strong><span>POINTS</span></div><div><strong>9</strong><span>LAB TARGETS</span></div></div></div></section>
  ${storageError?`<p class="mock-error" role="alert">${e(storageError)} Your current work can be exported below.</p>`:''}
  ${draft?`<div class="mock-grade-banner"><div><strong>Your place is saved.</strong><p>${Object.values(draft.responses).filter(x=>x.trim()).length}/${draft.ids.length} responses · ${e(draft.title)} · ${duration(draft.elapsedSeconds||0)} active time</p></div><div class="control-row"><button class="mock-btn mint" data-mock-action="resume">Continue ↗</button><button class="mock-btn" data-mock-action="new">Start fresh</button></div></div>`:''}
  <div class="mock-overview-grid"><section class="mock-panel"><span class="mock-kicker">THE FIRST FORM</span><h2>Four ways to <em>show it.</em></h2><div class="mock-sections">${sections.map(s=>`<div class="mock-section-row"><span>${s[1]}</span><div><strong>${s[2]}</strong><small>${s[3]}</small></div><b>${s[4]} <small>pts</small></b></div>`).join('')}</div><p class="mock-note">The format follows the complete Exam 2. Questions sample chapters 6–9; a perfect mock score does not cover every required landmark or chapter objective.</p></section>
  <section class="mock-panel"><span class="mock-kicker">MAKE IT YOUR SESSION</span><h2>Settle in.</h2><p>These options apply to your next new attempt. A resumed attempt keeps its saved settings.</p><div class="mock-settings"><label>Practice conditions<select id="mock-card-mode"><option value="closed">Closed notes</option><option value="notecard">Using my permitted 3 × 5 card</option></select></label><label>Optional time goal<select id="mock-time-goal"><option value="0">Untimed — focus on reasoning</option><option value="45">45 minutes</option><option value="60">60 minutes</option><option value="90">90 minutes</option></select></label><label class="check-line"><input id="mock-auto-grade" type="checkbox" ${autoGrade?'checked':''}> Review with local AI after submission</label></div><p>Answers stay hidden until you submit. Clear objective answers use verified keys. Written explanations use explicit rubric components and your local Ollama model.</p><p>The verified <b>Gemma4:12b</b> build can grade Form A. Other models need to pass the grading check first; connection setup alone is not a grading check.</p><p class="mock-note">No model connected? Take the whole exam now. Your written answers stay saved and await review.</p><button class="mock-btn" data-mock-action="ai">Check shared tutor connection ↗</button></section></div>
  <section class="mock-panel mock-history"><span class="mock-kicker">YOUR PROGRESS</span><h2>Pick up the thread.</h2>${state.history.length?state.history.slice().reverse().map(s=>{const r=mockResults(s);return `<div class="mock-history-row"><div><strong>${e(s.title)}</strong><p>${date(s.submitted)} · ${s.ids.length} questions · ${r.pendingPoints?point(r.pendingPoints)+' points awaiting review':'Completed'}${r.assisted?' · assisted answers':''}</p></div><button class="mock-btn" data-mock-report="${e(s.id)}">${point(r.earnedPoints)} / ${r.maxPoints} ↗</button></div>`;}).join(''):'<p class="mock-empty">Your first attempt starts the story. Completed mocks and focused retakes appear here.</p>'}<div class="mock-mini-actions"><button class="mock-btn" data-mock-action="bone-questions">Practice the seven Bone Questions</button><button class="mock-btn" data-mock-action="wider">12 wider-coverage questions ↗</button><button class="mock-btn" data-mock-action="backup">Export mock & notes</button><button class="mock-btn" data-mock-action="import">Restore backup</button><button class="mock-btn" data-mock-action="coverage">What this form covers</button></div></section>`,'home');
  setLearningContext({type:'study',label:'Exam 3 preparation',reference:'6.3',text:'Chapters 6–9: bone tissue, axial and appendicular skeleton, and joints.'});
 }
 function home4(draft){
  const history=state.history.slice().reverse().map(attempt=>{
   const result=mockResults(attempt);
   return `<div class="mock-history-row"><div><strong>${e(attempt.title)}</strong><p>${date(attempt.submitted)} · ${attempt.mode==='practice'?'Coached practice':'Mock exam'}${result.pendingPoints?' · '+point(result.pendingPoints)+' points pending':''}</p></div><button class="mock-btn" data-mock-report="${e(attempt.id)}">${point(result.earnedPoints)} / ${result.maxPoints} ↗</button></div>`;
  }).join('');
  paint(`${top()}<section class="mock-panel mock4-home"><span class="mock-kicker">BI 231 / CHAPTERS 10–11</span><h1>Exam 4 mock</h1><p>44 questions · 60 points · Chapters 10–11</p>
   <div class="mock-settings"><label>Session<select id="mock4-mode"><option value="exam">Mock exam</option><option value="practice">Coached practice</option></select></label>
   <label>Optional time goal<select id="mock-time-goal"><option value="0">Untimed</option><option value="45">45 minutes</option><option value="60">60 minutes</option><option value="90">90 minutes</option></select></label>
   <label class="check-line"><input id="mock-auto-grade" type="checkbox" ${autoGrade?'checked':''}> Review with local AI after submission</label></div>
   <p>Practice based on Exams 1–3 and Weeks 9–11. The instructor’s questions and chapter weighting remain uncertain.</p><p>Mock exam opens tutor help and feedback after submission. Coached practice offers feedback during the attempt and records help used.</p>
   <div class="mock-mini-actions">${draft?'<button class="mock-btn primary" data-mock-action="resume">Resume saved attempt ↗</button>':''}<button class="mock-btn ${draft?'':'primary'}" data-mock-form="A">Start Form A</button><button class="mock-btn" data-mock-form="B">Start Form B</button><button class="mock-btn" data-mock-action="saved-results">Saved results</button><button class="mock-btn mint" data-mock-action="quiz-show">${state.quizShowDraft?'Resume Quiz Show Review':'Quiz Show Review · 21 questions'}</button></div>
   ${draft?`<p>${e(draft.title)} · ${Object.values(draft.responses).filter(x=>x.trim()).length}/${draft.ids.length} responses saved</p>`:''}
   ${storageError?`<p class="mock-error" role="alert">${e(storageError)}</p>`:''}</section>
   <div class="mock-overview-grid"><section class="mock-panel"><h2>Exam format</h2><p><strong>Start with Form A</strong> to practice the most recent exam format. It has 30 multiple-choice questions, 12 matches on shared numbered diagrams and two written responses.</p><p><strong>Form B provides a second format.</strong> It has 30 multiple-choice questions, seven matches from function or location clues, two diagram naming questions, three true-or-false statements and two written responses.</p><p>Multiple choice earns one point per question. Each diagram question or true-or-false statement earns two points. Written responses earn up to three points each.</p><p>Use both forms and the 14-question lab drill to broaden your practice. Written explanations can earn partial credit.</p><button class="mock-btn" data-mock-action="coverage">Sources and coverage</button></section>
   <section class="mock-panel"><h2>Study and extended practice</h2><div class="mock-mini-actions"><button class="mock-btn" data-mock-action="professor">Professor’s written questions</button><button class="mock-btn" data-mock-action="attachments">Lab attachments and shoulder ligaments</button><button class="mock-btn" data-mock-action="muscle-labeling">Diagrams and 3D</button><button class="mock-btn" data-mock-action="checklist">Required muscle list</button><button class="mock-btn" data-mock-extended="muscles1011">Extended Form A · 100 pts</button><button class="mock-btn" data-mock-extended="muscles1011-b">Extended Form B · 100 pts</button></div></section></div>
   <section class="mock-panel mock-history"><h2 id="mock4-saved-results">Saved results</h2>${history||`<p>No submitted attempts in this browser.${draft?' Resume your saved attempt and submit it to see your score here.':''}</p>`}<div class="mock-mini-actions"><button class="mock-btn" data-mock-action="card">Study card</button><button class="mock-btn" data-mock-action="backup">Export exam and notes</button><button class="mock-btn" data-mock-action="import">Restore backup</button></div></section>`,'home');
  setLearningContext({type:'study',label:'Exam 4 preparation',reference:'10.2',text:'Muscle tissue and the muscular system.'});
 }
 function ensureFresh(next,slot='active'){if(unreadableRecord){dialog('<h2>Preserve the earlier record first.</h2><p>This browser contains a mock record that this version cannot safely read. Nothing has been overwritten. Download the original record for recovery before replacing it with a new attempt.</p><div class="control-row"><button id="mock-recovery-cancel">Keep original record</button><button class="primary" id="mock-recovery-reset">Download original & start fresh</button></div>');document.querySelector('#mock-recovery-cancel').onclick=()=>document.querySelector('#info-dialog').close();document.querySelector('#mock-recovery-reset').onclick=()=>{download(unreadableRecord,'osteon-'+slug+'-original-recovery.json');unreadableRecord='';state=storage.blank();document.querySelector('#info-dialog').close();next();};return;}if(!state[slot]){next();return;}dialog('<h2>Keep your saved attempt?</h2><p>You already have a mock in progress. Export it first if you want to keep it. Starting fresh replaces only this unfinished attempt.</p><div class="control-row"><button id="mock-keep-draft">Keep my saved attempt</button><button class="primary" id="mock-replace-draft">Start a new attempt</button></div>');document.querySelector('#mock-keep-draft').onclick=()=>document.querySelector('#info-dialog').close();document.querySelector('#mock-replace-draft').onclick=()=>{document.querySelector('#info-dialog').close();next();};}
 async function begin(items=mockExam3Questions,form=mockExam3Form,mode=form.id===mockExam3Form.id?'exam':'practice'){if(loadingFigures)return;const cardMode=query('#mock-card-mode')?.value||'closed',timeGoalMinutes=Number(query('#mock-time-goal')?.value||0);autoGrade=query('#mock-auto-grade')?.checked??autoGrade;const startingRoute=location.hash;loadingFigures=true;try{if(items.some(q=>q.type==='identify'||q.diagramMatch)){const status=query('[data-mock-saved]');if(exam4&&status)status.textContent='Preparing diagrams…';else toast('Preparing exam diagrams…');const assets=await (exam4?preloadMockExam4Figures(items):preloadMockFigures());if(location.hash!==startingRoute)return;if(!assets.ready){toast('Some diagrams could not load. Check your connection and try again.');return;}}ensureFresh(()=>{cancelJob();session=createMockSession(items,{form,cardMode,timeGoalMinutes,autoGrade,mode});coachedFeedback=null;exam();},draftSlot(form.id));}catch(error){toast(error.message||'The mock could not start. Your saved work is unchanged.');}finally{loadingFigures=false;if(exam4)setStatus();}}
 function resume(){session=state.active;if(session)exam();else if(state.history.length)selectReport(state.history.at(-1).id);else home();}
 function quizShow(){
  const saved=state.quizShowDraft;
  if(saved){session=saved;coachedFeedback=null;exam();return;}
  begin(mockExam4QuizShowForm.questions,mockExam4QuizShowForm,'practice');
 }
 function exam(start){if(!session||session.status!=='draft'){home();return;}checkpoint();putSession();const q=session.questions[session.index],answer=session.responses[q.id]||'',count=Object.values(session.responses).filter(s=>s.trim()).length;
  if(exam4&&paintedQuestion!==session.id+':'+q.id){start={title:''};paintedQuestion=session.id+':'+q.id;}
  const hasDiagram=q.type==='identify'||q.diagramMatch;
  const sideBySide=exam4&&hasDiagram;
  const wordBank=q.type==='identify'&&Array.isArray(q.wordBank)?q.wordBank.filter(term=>typeof term==='string'):[];
  const progress=Math.round(100*count/session.ids.length),[judgment,reason]=q.claim?claimResponseParts(answer):[],order=sections.filter(s=>session.questions.some(q=>q.section===s[0]));
  const navigation=`<div class="mock-question-bottom"><button class="mock-btn" data-mock-action="previous" ${session.index===0?'disabled':''}>← Previous</button>${!exam4||coaching()?'<button class="mock-help-button" data-mock-action="help">Study help</button>':''}<button class="mock-btn primary" data-mock-action="${session.index===session.ids.length-1?'review-submit':'next'}">${session.index===session.ids.length-1?'Review & submit':'Next question'} →</button></div>`;
  paint(`${top('Save & exit','home')}<div class="mock-exam-head"><div><span class="mock-kicker">${e(formatLabel())}</span>${!exam4&&session.mode==='practice'?`<p class="mock-session-label">${e(session.title)}</p>`:''}<h1>${e(q.quizCategory||sectionName(q.section))}.</h1><p>${session.cardMode==='closed'?'Closed notes':'Your permitted notecard'} · ${session.maxPoints} available points · <span data-mock-time>${duration(session.elapsedSeconds||0)}</span>${session.timeGoalMinutes?` / ${session.timeGoalMinutes}-minute goal`:''}</p>${exam4?`<p><strong data-mock-count>${count}</strong> of ${session.ids.length} answered</p>`:''}</div><button class="mock-btn" data-mock-action="review-submit">Review & submit ↗</button>${exam4?'<button class="mock-btn mock4-nav-toggle" data-mock-action="navigator">Questions</button>':''}</div><div class="mock-exam-layout">${exam4?'':`<aside class="mock-navigator" aria-label="Question navigator"><div id="mock-question-nav" class="mock-panel"><span class="mock-kicker">YOUR PROGRESS</span><p><strong data-mock-count>${count}</strong> of ${session.ids.length} answered</p><div class="mock-progress"><i data-mock-progress style="width:${progress}%"></i></div>${order.map(s=>`<div class="mock-nav-section"><p>${e(s[2])}</p><div class="mock-numbers">${session.questions.map((n,i)=>n.section===s[0]?`<button data-mock-index="${i}" aria-label="Question ${i+1}${session.responses[n.id]?.trim()?', answered':''}${session.flags[n.id]?', flagged':''}" ${i===session.index?'aria-current="step"':''} class="${i===session.index?'active ':''}${session.responses[n.id]?.trim()?'answered ':''}${session.flags[n.id]?'flagged':''}">${i+1}</button>`:'').join('')}</div>`).join('')}<p class="mock-nav-legend">Filled = answered · dot = flagged<br>Move freely before submission.</p></div></aside>`}<section class="mock-panel mock-question">${exam4?'<div class="mock4-question-body" role="region" aria-label="Question and response" tabindex="0">':''}<div class="mock-question-meta"><span class="mock-chip">QUESTION ${session.index+1} / ${session.ids.length} <span>·</span> ${q.points} ${q.points===1?'POINT':'POINTS'}</span><button class="mock-flag" data-mock-action="flag" aria-pressed="${!!session.flags[q.id]}">${session.flags[q.id]?'⚑ Flagged':'⚐ Flag for review'}</button></div><h2 id="mock-question-title" tabindex="-1">${e(q.prompt)}</h2>
  ${sideBySide?`<div class="mock4-visual-question${q.diagramMatch?' mock4-matching-question':''}">`:''}
  ${hasDiagram?`<div class="mock-figure">${renderFigure(q,{marker:q.target||q.number})}</div>${sideBySide?'<div class="mock4-visual-controls">':''}<div class="mock-figure-controls"><button class="mock-btn" data-mock-zoom="${e(q.id)}">Enlarge diagram ⤢</button></div>`:''}
  ${q.claim?`<fieldset class="mock4-claim"><legend>Choose a judgment</legend><div>${['True','False'].map(value=>`<label><input type="radio" name="mock-claim-judgment" value="${value}" ${judgment===value?'checked':''}>${value}</label>`).join('')}</div></fieldset><label class="mock-answer-label" for="mock-claim-reason">Give a reason or correct the claim</label><textarea id="mock-claim-reason" class="mock-answer" maxlength="${WRITTEN_RESPONSE_LIMIT}" rows="3">${e(reason)}</textarea>`:q.type==='choice'?`<div class="mock-option-list${q.diagramMatch?' mock4-marker-options':''}" role="radiogroup" aria-labelledby="mock-question-title">${session.options[q.id].map((option,i)=>`<button class="mock-option" role="radio" aria-checked="${answer===option}" tabindex="${answer?answer===option?0:-1:i===0?0:-1}" data-mock-option="${i}" ${q.diagramMatch?`aria-label="${e(option)}"`:''}><span aria-hidden="true">${q.diagramMatch?e(option.slice(7)):String.fromCharCode(65+i)}</span>${q.diagramMatch?'':`<span>${e(option)}</span>`}</button>`).join('')}</div>`:`<label class="mock-answer-label" for="mock-answer">${q.type==='written'?'Explain in your own words. Clear, concise bullets are welcome.':(wordBank.length?'Type a name or choose from the word bank.':'Anatomical name')}</label>${q.type==='written'?`<textarea id="mock-answer" class="mock-answer" maxlength="${WRITTEN_RESPONSE_LIMIT}" aria-describedby="mock-answer-hint" placeholder="Connect the structures, mechanism and result…">${e(answer)}</textarea>`:`<input id="mock-answer" class="mock-answer" maxlength="500" autocomplete="off" spellcheck="false" aria-describedby="mock-answer-hint" value="${e(answer)}" placeholder="Name the marked target">${wordBank.length?`<label class="mock-answer-label" for="mock-word-bank">Word bank<select id="mock-word-bank" class="mock-answer"><option value="">Choose a name…</option>${wordBank.map(term=>`<option value="${e(term)}" ${answer===term?'selected':''}>${e(term)}</option>`).join('')}</select></label>`:'' }`}<p id="mock-answer-hint" class="mock-question-hint">${q.type==='written'?`<span data-mock-chars>${answer.length}</span> / ${WRITTEN_RESPONSE_LIMIT} characters · Rubric feedback appears after submission.`:'Use the precise structure name. Unambiguous equivalent terms and minor spelling errors retain credit.'}</p>`}
  ${sideBySide?'</div></div>':''}${exam4?'':navigation}${coaching()?`<button class="mock-btn" data-mock-action="coach-check" ${answer.trim()?'':'disabled'}>Check response</button>`:''}${coaching()&&coachedFeedback===q.id?`<div class="mock-evidence" role="status"><p><strong>${e(mockOutcome(session,q).reason)}</strong></p><p>${e(q.answer)}${q.type==='written'?'':' · '+e(q.explanation)}</p></div>`:''}${session.assisted[q.id]?'<p class="mock-question-hint">Study help was used for this item. It will be marked assisted.</p>':''}${exam4?'</div>'+navigation:''}</section></div>`,'exam',start);
  setLearningContext({type:'assessment',label:label+' · '+q.topic,reference:q.lesson,text:`Active practice question: ${q.prompt}. The learner has not submitted. Study help must be marked assisted.`});
 }
 function updateResponse(value){if(!session||session.status!=='draft')return;const q=session.questions[session.index];try{session=setMockResponse(session,q.id,value);putSession();const wordBank=query('#mock-word-bank');if(wordBank)wordBank.value=[...wordBank.options].some(option=>option.value===value)?value:'';const count=Object.values(session.responses).filter(s=>s.trim()).length;query('[data-mock-count]').textContent=count;const progress=query('[data-mock-progress]');if(progress)progress.style.width=`${100*count/session.ids.length}%`;const b=query(`[data-mock-index="${session.index}"]`);b?.classList.toggle('answered',!!value.trim());b?.setAttribute('aria-label',`Question ${session.index+1}${value.trim()?', answered':''}${session.flags[q.id]?', flagged':''}`);if(query('[data-mock-chars]'))query('[data-mock-chars]').textContent=value.length;const check=query('[data-mock-action="coach-check"]');if(check)check.disabled=!value.trim();}catch(error){toast(error.message);}}
 function questionRows(items){
  const buttons=items.map(q=>{
   const i=session.ids.indexOf(q.id),answered=!!session.responses[q.id]?.trim(),flagged=!!session.flags[q.id];
   return `<button type="button" data-mock-dialog-index="${i}" class="mock-btn ${answered?'answered ':''}${flagged?'flagged':''}" aria-label="Question ${i+1}${answered?', answered':''}${flagged?', flagged':''}" ${i===session.index?'aria-current="step"':''}>${i+1}</button>`;
  });
  const rows=[];
  for(let i=0;i<buttons.length;i+=6)rows.push('<div class="mock4-number-row">'+buttons.slice(i,i+6).join('')+'</div>');
  return rows.join('');
 }
 function bindQuestionRows(){
  document.querySelectorAll('#dialog-content [data-mock-dialog-index]').forEach(b=>b.onclick=()=>{
   checkpoint();session.index=Number(b.dataset.mockDialogIndex);document.querySelector('#info-dialog').close();exam();focusItem(query('#mock-question-title'));
  });
 }
 function pickQuestion(){
  const pages=dialog(`<h2>Jump to a question</h2><p>Filled = answered · dot = flagged</p>${questionRows(session.questions)}<div class="control-row"><button id="mock-close-picker">Return to question</button></div>`);
  document.querySelector('#mock-close-picker').onclick=()=>document.querySelector('#info-dialog').close();
  bindQuestionRows();
  const current=document.querySelector('#dialog-content [aria-current="step"]');
  if(current){pages.reveal(current);current.focus({preventScroll:true});}
 }
 function submitDialog4(unanswered,flags){
  const blanks=unanswered.length,flagged=flags.length;
  const pages=dialog(`<h2>Review &amp; submit</h2>
   <section data-submit-summary><p><strong>${session.ids.length-blanks} of ${session.ids.length} answered · ${flagged} flagged</strong></p>
   <p>${blanks?blanks+(blanks===1?' blank answer receives':' blank answers receive')+' zero points.':'Every question has a response.'} Submitting locks your answers.</p>
   <div class="mock-mini-actions">${blanks?'<button id="mock-show-blanks">Unanswered questions</button>':''}${flagged?'<button id="mock-show-flags">Flagged questions</button>':''}</div></section>
   ${blanks?`<section data-submit-blanks><h3>Unanswered</h3>${questionRows(unanswered)}</section>`:''}
   ${flagged?`<section data-submit-flags><h3>Flagged</h3>${questionRows(flags)}</section>`:''}
   <div class="control-row"><button id="mock-return-exam">Keep working</button><button id="mock-submit-final" class="primary">Submit ${session.maxPoints}-point ${session.mode==='practice'?'practice':'mock'} ↗</button></div>`,content=>
    [['Summary','summary'],['Unanswered','blanks'],['Flagged','flags']].flatMap(([title,key])=>{
     const part=content.querySelector('[data-submit-'+key+']');
     return part?[mock4Group(title,[...part.children])]:[];
    }));
  const box=document.querySelector('#dialog-content');
  for(const [id,title] of [['blanks','Unanswered'],['flags','Flagged']]){
   const trigger=box.querySelector('#mock-show-'+id);
   const head=[...box.querySelectorAll('h3')].find(h=>h.textContent===title);
   if(trigger&&head)trigger.onclick=()=>{pages.reveal(head);head.focus({preventScroll:true});};
  }
 }
 function reviewSubmit(){checkpoint();putSession();const unanswered=session.questions.filter(q=>!session.responses[q.id]?.trim()),flags=session.questions.filter(q=>session.flags[q.id]);if(exam4)submitDialog4(unanswered,flags);else dialog(`<h2>Ready to <em>submit?</em></h2><p>${session.ids.length-unanswered.length} of ${session.ids.length} questions answered. ${flags.length} flagged. Submission locks your exact answers before grading starts.</p>${unanswered.length?`<p class="mock-error">${unanswered.length} blank ${unanswered.length===1?'answer will':'answers will'} receive zero points.</p><div class="control-row">${unanswered.map(q=>`<button data-mock-dialog-index="${session.ids.indexOf(q.id)}">Q${session.ids.indexOf(q.id)+1}</button>`).join('')}</div>`:'<p>Your responses are complete. You can still return and check them.</p>'}${flags.length?`<h3>Flagged for review</h3><div class="control-row">${flags.map(q=>`<button data-mock-dialog-index="${session.ids.indexOf(q.id)}">Flagged Q${session.ids.indexOf(q.id)+1}</button>`).join('')}</div>`:''}<p>Written responses and ambiguous labels can remain pending until local review succeeds. No connection error is counted as a wrong answer.</p><div class="control-row"><button id="mock-return-exam">Keep working</button><button id="mock-submit-final" class="primary">Submit ${session.maxPoints}-point ${session.mode==='practice'?'practice':'mock'} ↗</button></div>`);document.querySelector('#mock-return-exam').onclick=()=>document.querySelector('#info-dialog').close();bindQuestionRows();document.querySelector('#mock-submit-final').onclick=()=>{if(session.status!=='draft')return;document.querySelector('#mock-submit-final').disabled=true;checkpoint();session=submitMockSession(session,{bank:questions});if(exam4)recordSpellings();const saved=putSession();if(!saved)gradingMessage='Your submission is locked in this tab but could not be saved. Keep this tab open and export a recovery backup before reloading.';document.querySelector('#info-dialog').close();filter='missed';reviewIndex=null;report();if(saved&&session.autoGrade===true&&(exam4||localAI.state.ready))grade();};}
 function selectReport(id){cancelJob();const found=state.history.find(s=>s.id===id);if(!found){home();toast('That report is not stored in this browser. Restore its backup to open it.');return;}session=found;filter='missed';reviewIndex=null;notesOpen=false;reviewContinuation=null;reviewFailures=[];gradingMessage='';report();}
 function recordSpellings(){
  for(const row of mockResults(session).rows)if(row.outcome.status==='spelling'&&row.outcome.correction){
   addSpellingNote({term:row.outcome.correction,sourceId:row.q.id,reference:row.q.lesson,response:row.response,attemptKey:session.id+':'+row.q.id});
  }
 }
 function safeLinks(q){return (q.sourceLinks||[]).filter(s=>typeof s.url==='string'&&s.url.startsWith('https://openstax.org/')).map(s=>`<a href="${e(s.url)}" target="_blank" rel="noreferrer">${e(s.label)} ↗</a>`).join(' · ');}
 const noteKey=q=>`${session.id}:${q.id}`;
 function resumeOrStart(action){
  if(!reviewContinuation){action();return;}
  if(localAI.state.ready)reviewContinuation.run();
  else aiSetup(reviewContinuation);
 }
 const noteFor=q=>state.notes[noteKey(q)]||{confusion:'',rule:'',retrieval:'',updatedAt:0};
 const suggestionFor=q=>exam4?getWrittenSuggestion(state,session,q):null;
 const unconfirmedSuggestion=row=>{
  const suggestion=suggestionFor(row.q);
  return !!suggestion&&(!row.review||suggestion.at>row.review.at);
 };
 function showSuggestions(){
  notesOpen=false;
  filter='suggestions';
  reviewIndex=0;
  report({title:'AI suggestion'});
 }
 function reportActions(result){
  const pending=result.rows.filter(row=>row.pending&&mockRubricResponse(row.q,row.response).trim()).length;
  const suggestions=result.rows.filter(unconfirmedSuggestion).length;
  const notes=result.rows.filter(hasConfirmedMiss).length;
  return `<div class="mock-mini-actions mock4-review-actions">${controller?'<button class="mock-btn" data-mock-action="stop-review">Stop AI</button>':pending?`<button class="mock-btn mint" data-mock-action="grade">${reviewContinuation?'Continue AI review':'Review with AI'}</button>`:''}
   ${suggestions?`<button class="mock-btn primary" data-mock-action="suggestions" ${controller?'disabled':''}>AI suggestions (${suggestions})</button>`:''}
   ${notes?`<button class="mock-btn" data-mock-action="create-notes" ${controller?'disabled':''}>${result.rows.some(row=>noteFor(row.q).studyDraft)?'Open study notes':'Create study notes'}</button>`:''}</div>`;
 }
 function renderSuggestion(row){
  const suggestion=suggestionFor(row.q);
  if(!suggestion)return '';
  const score=writtenSuggestionScore(session,row.q,suggestion);
  if(!score)return '';
  const staged=unconfirmedSuggestion(row);
  const suggestedPoints=score.earnedPoints+(row.q.claim?(row.outcome.components[0]?.earnedPoints||0):0);
  return `<section class="mock4-suggestion" data-written-suggestion>
   <h3>AI suggested ${point(suggestedPoints)} / ${row.maxPoints} points</h3>
   <p>${e(suggestion.model)} · ${score.pendingPoints?point(score.pendingPoints)+' suggested points still uncertain · ':''}${staged?'Confirm or adjust each criterion to apply the score.':'Saved as evidence for your review.'}</p>
   ${staged?`<button class="mock-btn primary" data-mock-confirm="${e(row.q.id)}" ${controller?'disabled':''}>Confirm or adjust AI suggestions</button>`:''}
   <p>${e(suggestion.feedback)}</p>
   ${score.components.map(c=>`<div class="mock-criterion"><div><strong>${e(c.label)}</strong><span>${c.pendingPoints?'Unsure':point(c.earnedPoints)+' / '+point(c.maxPoints)}</span></div><p>${e(c.reason)}</p>${c.evidence.map(quote=>`<blockquote>${e(quote)}</blockquote>`).join('')}</div>`).join('')}
  </section>`;
 }
 function prepareStudySheet(){
  let changed=false;
  for(const row of mockResults(session).rows.filter(hasConfirmedMiss)){
   const note=noteFor(row.q),basis=studyBasis(row);
   const previous=note.studyDraft;
   if(previous?.basis===basis&&(previous.kind==='local-ai'||previous.version===STUDY_DRAFT_VERSION))continue;
   state.notes[noteKey(row.q)]={...note,studyDraft:builtInStudyDraft(row),updatedAt:Date.now()};
   changed=true;
  }
  if(changed&&!save())toast('These study notes are only in this tab. Download them before leaving.');
 }
 function openStudySheet(){
  if(!exam4||controller||session?.status!=='submitted')return;
  prepareStudySheet();
  notesOpen=true;
  gradingMessage='';
  reviewFailures=[];
  report({title:'Study notes'});
 }
 function startStudyRecall(rows){
  if(!notesOpen||!rows.length)return;
  let index=0,revealed=false;
  const info=document.querySelector('#info-dialog');
  function show(){
   recallLayout?.close();
   const item=rows[index],q=item.question;
   const next=chooseMockPractice(q,state.history,{exclude:rows.map(r=>r.question.id),related:relatedQuestions});
   const related=next?.kind==='repeat'?null:next?.question;
   recallLayout=dialog(renderStudyRecall(item,{index,total:rows.length,revealed,related,escape:e,renderFigure}),
    content=>[mock4Group('Recall',[...content.children].filter(node=>!node.matches('h2,.mock-study-recall-actions')))]);
   const bind=(id,action)=>{const button=info.querySelector('#mock-study-recall-'+id);if(button)button.onclick=action;};
   const move=offset=>{index+=offset;revealed=false;show();};
   bind('prev',()=>move(-1));
   bind('next',()=>move(1));
   bind('reveal',()=>{revealed=true;show();const answer=info.querySelector('#mock-study-recall-answer');recallLayout?.reveal(answer);answer?.focus({preventScroll:true});});
   bind('related',()=>{
    rows.splice(index+1,0,...studyRecallItems({q:related,response:'',outcome:{components:[]}}));
    move(1);
   });
   bind('close',()=>info.close());
  }
  show();
 }
 function studySheet(result){
  const misses=result.rows.filter(hasConfirmedMiss);
  const canRefine=misses.some(row=>row.answered);
  const priorities=missedStudyPriorities(misses,state.history,session.id);
  return `<section class="mock4-study-sheet">
   <header data-study-summary><h1>Study notes</h1><p>${misses.length} ${misses.length===1?'question with':'questions with'} confirmed missed points. Browse all notes with the page selector.</p>
   ${result.pendingPoints?'<p>Answers with only pending points will appear after review confirms a miss.</p>':''}
   <p id="mock4-job-status" class="mock-note" role="status">${e(gradingMessage||(canRefine?'Ready from the answer key. Local AI can add coaching using your submitted answers.':'Notes are ready from the answer key.'))}</p>
   ${reviewFailures.map(message=>`<p class="mock-error">${e(message)}</p>`).join('')}</header>
   ${priorities.length?`<section data-study-priorities><h2>Start with these concepts</h2>
    <button class="mock-btn primary" data-mock-action="priority-recall">Practice ${priorities.length} ${priorities.length===1?'concept':'concepts'} ↗</button>
    ${priorities.map(group=>`<p><strong>${e(group.name)}</strong> · ${point(group.points)} missed ${group.points===1?'point':'points'}${group.earlierAttempts?` · missed on ${group.earlierAttempts} earlier ${group.earlierAttempts===1?'attempt':'attempts'}`:''}</p>`).join('')}</section>`:''}
   ${misses.map(row=>renderStudyNote(row,{
    number:session.ids.indexOf(row.q.id)+1,note:noteFor(row.q),escape:e,renderFigure,links:safeLinks(row.q)
   })).join('')}
   <div class="mock-mini-actions mock4-review-actions" data-study-actions><button class="mock-btn" data-mock-action="back-score">← Score</button>
   ${controller&&operation==='notes'?'<button class="mock-btn" data-mock-action="stop-review">Stop AI</button>':canRefine?`<button class="mock-btn mint" data-mock-action="refine-notes">${reviewContinuation?'Continue AI notes':'Add local AI coaching'}</button>`:''}
   <button class="mock-btn" data-mock-action="download-sheet">Download notes</button></div></section>`;
 }
 async function refineNotes(){
  if(controller||!notesOpen||session?.status!=='submitted')return;
  const candidates=mockResults(session).rows.filter(row=>row.answered&&hasConfirmedMiss(row));
  if(!candidates.length)return;
  if(!localAI.state.ready){
   continueAfterSetup('Refine my study notes',refineNotes);
   updateReviewProgress('Finish connecting to Ollama to refine these notes.');
   return;
  }
  controller=new AbortController();
  operation='notes';
  reviewFailures=[];
  const reportEpoch=++gradingEpoch,signal=controller.signal,attemptId=session.id;
  const {model,endpoint}=localAI.state;
  const remaining=candidates.filter(row=>{
   const draft=noteFor(row.q).studyDraft;
   return draft?.kind!=='local-ai'||draft.version!==STUDY_DRAFT_VERSION||draft.model!==model||draft.basis!==studyBasis(row);
  });
  const rows=remaining.length?remaining:candidates;
  let saved=0;
  gradingMessage='Preparing your notes for local AI refinement…';
  report();
  try{
   for(let i=0;i<rows.length;i+=3){
    if(signal.aborted||!reviewStatus(attemptId,reportEpoch))break;
    if(localAI.state.model!==model||localAI.state.endpoint!==endpoint){
     reviewFailures.push('The selected model changed. Try again with the current model.');
     break;
    }
    const batch=rows.slice(i,i+3);
    updateReviewProgress(`Refining notes ${i+1}–${i+batch.length} of ${rows.length}`);
    try{
     const drafts=await refineStudyDrafts(batch,{signal,model,endpoint});
     if(signal.aborted||!reviewStatus(attemptId,reportEpoch))break;
     for(const row of batch){
      const note=noteFor(row.q);
      state.notes[noteKey(row.q)]={...note,studyDraft:drafts[row.q.id],updatedAt:Date.now()};
     }
     if(!save())throw new Error('Notes could not be saved on this device. Download them before leaving.');
     saved+=batch.length;
    }catch(error){
     if(signal.aborted)break;
     reviewFailures.push(`Notes ${i+1}–${i+batch.length}: ${error.message}`);
     // Keep any completed work and let the learner retry from the sheet.
     break;
    }
   }
  }finally{
   if(reportEpoch!==gradingEpoch)return;
   controller=null;
   operation='';
   gradingMessage=(signal.aborted?'Coaching stopped. ':'')+`AI coaching saved for ${saved} ${saved===1?'question':'questions'}. Your edits are kept.`;
   if(reviewStatus(attemptId,reportEpoch))report();
  }
 }
 function downloadStudySheet(){
  const lines=[session.title+' · Study notes',''];
  for(const row of mockResults(session).rows.filter(hasConfirmedMiss)){
   const q=row.q,note=noteFor(q);
   const evidence=studyEvidence(row);
   lines.push(`Q${session.ids.indexOf(q.id)+1} · ${q.topic}`,q.source||'Textbook section '+q.lesson,
    'Your answer: '+(row.response||'No answer submitted.'),'Correct answer: '+evidence.correctAnswer);
   if(evidence.orientation)lines.push('View: '+evidence.orientation+' (marked image in Osteon)');
   if(evidence.earned.length)lines.push('Earned credit: '+evidence.earned.join(', '));
   for(const criterion of evidence.missing)lines.push('Confirmed gap · '+criterion.label+': '+criterion.answer);
   if(evidence.pending.length)lines.push('Still pending: '+evidence.pending.join(', '));
   lines.push('What to revisit: '+studyNoteValue(note,'confusion'),'Correct rule: '+studyNoteValue(note,'rule'),
    'Recall question: '+studyNoteValue(note,'retrieval'),'Study card: '+studyNoteValue(note,'cardDraft'));
   if(note.studyDraft?.coaching)lines.push('AI coaching: '+note.studyDraft.coaching);
   for(const link of q.sourceLinks||[])if(link.url?.startsWith('https://'))lines.push(link.label+' '+link.url);
   lines.push('');
  }
  download(lines.join('\n'),'osteon-exam4-study-notes-'+session.id+'.txt','text/plain');
 }
 function renderResult(row,index){const {q,response,outcome:o,assisted}=row,note=noteFor(q),unresolved=o.pendingPoints>0,missed=o.maxPoints-o.earnedPoints-o.pendingPoints,open=filter!=='all';
  const status=unresolved?'Awaiting review':o.correct?o.status==='spelling'?'Full credit · spelling to practice':'Full credit':o.status==='partial'?'Partial credit':response?'Review this concept':'No response';
  return `<details class="mock-result-card" data-result-id="${e(q.id)}" ${open?'open':''}><summary><span class="mock-result-index">${String(index+1).padStart(2,'0')}</span><div><strong>${e(q.topic)}</strong><small>${e(status)}${assisted?' · assisted':''} · ${e(sectionName(q.section))}</small></div><span class="mock-result-points">${point(o.earnedPoints)} / ${o.maxPoints}${unresolved?' + ?':''}</span></summary><div class="mock-result-body"><p>${e(q.prompt)}</p>${q.type==='identify'||q.diagramMatch?`<div class="mock-figure">${renderFigure(q,{reveal:true,marker:q.target||q.number})}</div><div class="mock-figure-controls"><button class="mock-btn" data-mock-zoom="${e(q.id)}">Enlarge corrected target ⤢</button></div>`:''}<div class="mock-answer-compare"><div><small>YOUR SUBMITTED ANSWER</small><p>${e(response||'No answer submitted.')}</p></div><div><small>${q.type==='written'?'MODEL EXPLANATION':'ACCEPTED ANSWER'}</small><p>${e(q.diagramMatch?q.answer+' · '+q.topic:q.answer)}</p></div></div><p>${e(q.explanation)}</p>${o.reason?`<p class="mock-note">${e(o.reason)}</p>`:''}
  ${q.type==='written'?`<div class="mock-rubric">${renderSuggestion(row)}<span class="mock-kicker">WHERE THE POINTS COME FROM</span>${(o.components||[]).map(c=>`<div class="mock-criterion"><div><strong>${e(c.label)}</strong><span>${point(c.earnedPoints||0)} / ${point(c.maxPoints??c.points)}${c.pendingPoints?' · pending':''}</span></div><p>${e(c.reason||c.description||'')}</p>${c.evidence?.length?`<blockquote>${c.evidence.map(x=>e(typeof x==='string'?x:x.quote||'')).join('<br>')}</blockquote>`:''}</div>`).join('')}</div>`:''}
  <div class="mock-evidence">${e(q.source)}<br>${safeLinks(q)}</div><div class="mock-mini-actions"><button class="mock-btn" data-mock-lesson="${e(q.id)}">Read this section ↗</button><button class="mock-btn" data-mock-tutor="${e(q.id)}">Work through it with tutor ↗</button><button class="mock-btn" data-mock-related="${e(q.id)}">Try a related question ↗</button>${exam4&&q.termId&&courseMuscleTargetById.get(q.termId)?.componentIds.length?`<button class="mock-btn" data-mock-spatial="${e(q.termId)}">Review on the 3D model ↗</button>`:''}${q.type!=='choice'&&mockRubricResponse(q,response).trim()?`<button class="mock-btn" data-mock-grade="${e(q.id)}" ${controller?'disabled':''}>${row.review?'Request re-review':'Review original answer'}</button>`:''}</div>
  <div class="mock-note-editor"><span class="mock-kicker">MAKE THE CORRECTION YOURS</span><h3>Your next recall starts here.</h3><div class="mock-note-fields"><label>What I confused<textarea data-mock-note="confusion" data-question="${e(q.id)}" maxlength="2000" placeholder="Name the distinction you missed…">${e(studyNoteValue(note,'confusion'))}</textarea></label><label>The rule or mechanism<textarea data-mock-note="rule" data-question="${e(q.id)}" maxlength="2000" placeholder="Write the reason in your own words…">${e(studyNoteValue(note,'rule'))}</textarea></label><label>A question to ask myself later<textarea data-mock-note="retrieval" data-question="${e(q.id)}" maxlength="2000" placeholder="Turn the correction into a retrieval question…">${e(studyNoteValue(note,'retrieval'))}</textarea></label></div><div class="mock-note-candidate"><input aria-label="Notecard candidate for ${e(q.topic)}" data-mock-candidate="${e(q.id)}" maxlength="180" value="${e(studyNoteValue(note,'cardDraft',o.studyNote||q.noteSuggestion||''))}"><select aria-label="Notecard side" data-mock-side="${e(q.id)}"><option value="front" ${note.cardSide!=='back'?'selected':''}>Front</option><option value="back" ${note.cardSide==='back'?'selected':''}>Back</option></select><button class="mock-btn mint" data-mock-add-note="${e(q.id)}">Add to card +</button></div><p class="mock-question-hint">Your suggestion and chosen side save as you edit. Add to card copies it into a free line; your exam answer stays unchanged.</p></div>
  ${q.type==='written'&&mockRubricResponse(q,response).trim()?`<div class="mock-mini-actions"><button class="mock-btn" data-mock-confirm="${e(q.id)}" ${controller?'disabled':''}>Compare & confirm rubric myself</button><span class="mock-save-state">${qualified(q)?'Selected model passed this rubric check':'Selected model needs this rubric check'}</span></div>`:''}${row.review?`<details class="mock-evidence"><summary>Grade evidence & history</summary><p>${row.review.source==='learner'?'Learner-confirmed rubric':'Local model: '+e(row.review.model||'local review')} · ${date(row.review.at||session.submitted)} · ${session.reviewHistory.filter(r=>r.questionId===q.id).length} saved review(s). ${row.review.source==='learner'?'You confirmed these criteria; this is not an AI or instructor grade.':'This is an AI practice estimate; compare each criterion with your response.'}</p><p>${e(row.review.feedback||row.review.explanation||'')}</p><ol class="mock-review-history">${session.reviewHistory.filter(entry=>entry.questionId===q.id).map(entry=>{const review=entry.review;return `<li><b>${review.source==='learner'?'Learner confirmation':e(review.model||'Local model')}</b> · ${e(new Date(entry.at).toLocaleString())}${review.components?`<ul>${review.components.map(c=>`<li>${e(q.rubric.criteria.find(r=>r.id===c.id)?.label||c.id)}: ${e(c.decision==='met'?'earned':['missing','contradicted'].includes(c.decision)?'not earned':'pending')}</li>`).join('')}</ul>`:`<p>${e(review.verdict||review.status)}</p>`}</li>`;}).join('')}</ol></details>`:''}</div></details>`;
 }
 function report4(result,rows,priorities,spellingCount,start){
  const score=point(result.earnedPoints)+' / '+result.maxPoints;
  const filters=[['missed','Missed & assisted'],['pending',`Awaiting review (${result.pending})`],['written','Written reasoning'],['notes','My notes'],['all','All questions']];
  if(result.rows.some(unconfirmedSuggestion)||filter==='suggestions')filters.push(['suggestions','AI suggestions to confirm']);
  if(filter.startsWith('lesson:'))filters.push([filter,'Section '+filter.slice(7)]);
  const selectFilter=`<select id="mock4-review-filter" aria-label="Filter review">${filters.map(([id,name])=>`<option value="${e(id)}" ${id===filter?'selected':''}>${e(name)}</option>`).join('')}</select>`;
  let body;
  if(notesOpen){
   body=studySheet(result);
  }else if(reviewIndex!==null){
   reviewIndex=Math.max(0,Math.min(reviewIndex,rows.length-1));
   const row=rows[reviewIndex];
   body=`<div class="mock4-result-head"><button class="mock-btn" data-mock-action="back-score">← Score</button>
    ${row?`<div><strong>${e(row.q.topic)}</strong><small>${point(row.outcome.earnedPoints)} / ${row.outcome.maxPoints} points${row.outcome.pendingPoints?' · '+point(row.outcome.pendingPoints)+' pending':''}${row.assisted?' · assisted':''}</small></div>`:'<strong>Question review</strong>'}</div>
    ${row?`<div class="mock4-result-step"><button class="mock-btn" data-mock-action="previous-result" ${reviewIndex===0?'disabled':''}>← Previous result</button>
     <select id="mock4-result-number" aria-label="Review question">${rows.map((r,i)=>`<option value="${i}" ${i===reviewIndex?'selected':''}>Q${session.ids.indexOf(r.q.id)+1} · ${i+1}/${rows.length}</option>`).join('')}</select>
     <button class="mock-btn primary" data-mock-action="next-result" ${reviewIndex===rows.length-1?'disabled':''}>Next result →</button></div>
     ${renderResult(row,session.ids.indexOf(row.q.id))}`:'<div class="mock4-empty"><p>No questions match this filter.</p><p>Return to the score to choose another filter.</p></div>'}`;
  }else{
   body=`<section class="mock4-summary"><h1>${e(session.title)} results</h1>
    <div class="mock4-score"><strong>${score}</strong><span>${result.pendingPoints?`${point(result.pendingPoints)} points pending`:`${Math.round(result.percentage)}%`} · ${result.assisted} assisted · ${duration(session.elapsedSeconds||0)} active</span></div>
    ${(result.pendingPoints||controller||gradingMessage)?`<p class="mock-note" id="mock4-job-status" role="status">${e(gradingMessage||'Review with AI can evaluate submitted written answers and uncertain terms.')}</p>`:''}
    <div class="mock4-summary-actions">${selectFilter}<button class="mock-btn primary" data-mock-action="open-review">Review ${rows.length} ${rows.length===1?'question':'questions'} ↗</button></div>
    <div class="mock-chapter-bars">${Object.entries(result.chapters).map(([ch,r])=>`<div><p>CH. ${ch} / ${chapterNames[ch].toUpperCase()}</p><strong>${point(r.earnedPoints)} / ${r.maxPoints}</strong>${r.pendingPoints?`<span class="tiny"> · ${point(r.pendingPoints)} pending</span>`:''}</div>`).join('')}</div>
    ${storageError?`<div class="mock-grade-banner" role="alert"><div><strong>Submission is locked but unsaved.</strong><p>Keep this tab open and export a backup before reloading.</p></div><div class="control-row"><button class="mock-btn primary" data-mock-action="backup">Export backup</button><button class="mock-btn" data-mock-action="retry-save">Retry save</button></div></div>`:''}
    ${reviewFailures.map(message=>`<p class="mock-error">${e(message)}</p>`).join('')}
    ${reportActions(result)}</section>
    <section class="mock4-result-tools"><h2>Review tools</h2>${priorities.map(group=>`<div class="mock4-priority"><p>Section ${e(group.lesson)} · ${point(group.missedPoints)} missed points</p><button class="mock-btn" data-mock-priority="${e(group.lesson)}">Review section ${e(group.lesson)} ↗</button></div>`).join('')}
    <div class="mock-mini-actions"><button class="mock-btn" data-mock-action="retry">Retest missed concepts</button>${spellingCount?`<button class="mock-btn" data-mock-action="spellings">Practice ${spellingCount} spelling ${spellingCount===1?'term':'terms'}</button>`:''}<button class="mock-btn" data-mock-action="professor">Professor’s 21 questions</button><button class="mock-btn" data-mock-action="card">Study card</button><button class="mock-btn" data-mock-action="coverage">Remaining coverage</button><button class="mock-btn" data-mock-action="qualify" ${controller?'disabled':''}>Verify model for automatic scoring</button><button class="mock-btn" data-mock-action="export-report">Export score &amp; evidence</button><button class="mock-btn" data-mock-action="export-text">Download study notes</button></div></section>`;
  }
  paint(top(label+' home','home')+body,'results',start);
  setLearningContext({type:'study',label:label+' results',text:`Practice score ${score}, ${result.pendingPoints} points pending. The submitted answers are locked.`});
 }
 function report(start){const priorScroll=screen==='results'?root.scrollTop:0;if(!session||session.status!=='submitted'){home();return;}const result=mockResults(session);let rows=result.rows;
  if(filter==='missed')rows=rows.filter(r=>hasConfirmedMiss(r)||r.assisted);else if(filter==='pending')rows=rows.filter(r=>r.pending);else if(filter==='written')rows=rows.filter(r=>r.q.type==='written');else if(filter==='suggestions')rows=rows.filter(unconfirmedSuggestion);else if(filter.startsWith('lesson:'))rows=rows.filter(r=>r.q.lesson===filter.slice(7)&&(hasConfirmedMiss(r)||r.assisted));else if(filter==='notes')rows=rows.filter(r=>['confusion','rule','retrieval','cardDraft'].some(k=>studyNoteValue(noteFor(r.q),k).trim()));
  const reviewed=result.pendingPoints===0,priorities=mockStudyPriorities(result).slice(0,3);
  const spellingCount=exam4?spellingDeck(result.rows).length:0;
  if(exam4){report4(result,rows,priorities,spellingCount,start);return;}
  paint(`${top(label+' home','home')}${storageError?`<div class="mock-grade-banner" role="alert"><div><strong>Submission is locked in this tab, but not saved.</strong><p>Keep this tab open. A reload may restore the earlier editable draft. Download a backup now, then free browser storage and retry saving. AI review waits for a successful save.</p></div><div class="control-row"><button class="mock-btn primary" data-mock-action="backup">Export recovery backup</button><button class="mock-btn" data-mock-action="retry-save">Retry save</button></div></div>`:''}<section class="mock-score-hero"><div class="mock-score-ring" style="--score:${Math.min(100,result.percentage)}%"><div><strong>${point(result.earnedPoints)}</strong><span>OF ${result.maxPoints} POINTS${reviewed?'':' · PROVISIONAL'}</span></div></div><div><span class="mock-kicker">${e(formatLabel())} / YOUR RESULTS</span>${session.mode==='practice'?`<p class="mock-session-label">${e(session.title)}</p>`:''}<h1>${result.missedPoints?'Find the gap.<br><em>Make it stick.</em>':result.pendingPoints?'Saved. Scored.<br><em>Ready for review.</em>':'You made the<br><em>connections.</em>'}</h1><p>${result.pendingPoints?`${point(result.pendingPoints)} points await review. Possible final score: ${point(result.earnedPoints)}–${point(result.maxPossiblePoints)} / ${result.maxPoints}.`:`${Math.round(result.percentage)}% on this practice form. Use the untested coverage list to keep your preparation broad.`}</p><div class="mock-result-stats"><span><b>${point(result.missedPoints)}</b>missed points</span><span><b>${result.assisted}</b>assisted</span><span><b>${duration(session.elapsedSeconds||0)}</b>active time</span></div><div class="mock-hero-actions"><button class="mock-btn primary" data-mock-action="focus-missed">Study missed points ↓</button><button class="mock-btn" data-mock-action="card">Build my notecard ↗</button></div></div></section>
  ${(result.pendingPoints||controller||gradingMessage)?`<div class="mock-grade-banner" role="status"><div><strong>${storageError?'Save needs attention.':controller?'Reviewing with local Ollama…':result.pendingPoints?'Your original answers are waiting safely.':'Review complete.'}</strong><p>${e(gradingMessage||'Connect the shared tutor model to review written reasoning and uncertain terms. A failed request leaves points pending.')}</p></div><button class="mock-btn ${controller?'':'mint'}" data-mock-action="${controller?'cancel-grade':'grade'}">${controller?'Stop review':'Review with Ollama ↗'}</button></div>`:''}
  ${priorities.length?`<section class="mock-priorities"><div><span class="mock-kicker">YOUR NEXT STUDY SESSION</span><h2>Start with these gaps.</h2><p>Ranked by confirmed missed points. Pending points are not counted as mistakes.</p></div><div class="mock-priority-grid">${priorities.map((group,i)=>`<article class="mock-panel"><span class="mock-kicker">${i+1} / SECTION ${e(group.lesson)}</span><h3>${point(group.missedPoints)} missed ${group.missedPoints===1?'point':'points'}</h3><p>${group.topics.map(e).join(' · ')}</p><p class="mock-question-hint">${group.questionIds.length} question(s)${group.assisted?' · '+group.assisted+' assisted':''}${group.pendingPoints?' · '+point(group.pendingPoints)+' points still pending':''}</p><button class="mock-btn" data-mock-priority="${e(group.lesson)}">Review these answers ↗</button></article>`).join('')}</div></section>`:''}<div class="mock-chapter-bars">${Object.entries(result.chapters).map(([ch,r])=>`<div><p>CH. ${ch} / ${chapterNames[ch].toUpperCase()}</p><strong>${point(r.earnedPoints)} <small>/ ${r.maxPoints}</small></strong>${r.pendingPoints?`<span class="tiny"> · ${point(r.pendingPoints)} pending</span>`:''}<div class="mock-progress"><i style="width:${r.percentage}%"></i></div></div>`).join('')}</div><div class="mock-mini-actions"><button class="mock-btn" data-mock-action="retry">Retest missed concepts ↗</button>${spellingCount?`<button class="mock-btn" data-mock-action="spellings">Practice ${spellingCount} spelling${spellingCount===1?'':'s'} ↗</button>`: ''}<button class="mock-btn" data-mock-action="bone-questions">${exam4?'Professor’s 21 questions':'Bone Questions practice'}</button><button class="mock-btn" data-mock-action="export-report">Export score & evidence</button><button class="mock-btn" data-mock-action="export-text">Download study notes</button><button class="mock-btn" data-mock-action="coverage">Remaining coverage ↗</button><button class="mock-btn" data-mock-action="qualify" ${controller?'disabled':''}>Check grading model</button></div><div class="mock-result-toolbar" id="mock-review-list" aria-label="Filter exam feedback">${[['missed','Missed & assisted'],['pending',`Awaiting review (${result.pending})`],['written','Written reasoning'],['notes','My notes'],['all','All questions']].map(([id,label])=>`<button class="mock-btn ${filter===id?'active':''}" data-mock-filter="${id}" aria-pressed="${filter===id}">${label}</button>`).join('')}<span class="mock-save-state" data-mock-saved role="status"></span>${filter.startsWith('lesson:')?`<span class="mock-chip">Section ${e(filter.slice(7))}</span>`:''}</div>${rows.length?rows.map(r=>renderResult(r,session.ids.indexOf(r.q.id))).join(''):`<div class="mock-panel"><h2>${filter==='pending'?'All available grades are resolved.':filter==='missed'?'No missed points in this view.':'Nothing here yet.'}</h2><p>${result.pendingPoints?'Some points still await review. Open Awaiting review to see those responses.':'Use All questions to revisit your explanations, or try a new concept to test transfer.'}</p></div>`}<p class="mock-hero-foot">Practice scoring uses an authored course-informed rubric. Original answers and re-review history are retained. Reading a correction is study; a new attempt tests independent recall.</p>`,'results');
  root.scrollTop=priorScroll;
  setLearningContext({type:'study',label:label+' results',text:`Practice results: ${result.earnedPoints}/${result.maxPoints}, ${result.pendingPoints} pending. The learner is correcting missed concepts, not changing submitted answers.`});
 }
 function updateReviewProgress(message){
  gradingMessage=message;
  const progress=query('#mock4-job-status')||query('.mock-grade-banner p');
  if(progress)progress.textContent=message;
 }
 function reviewStatus(attemptId,reportEpoch){
  return active()&&screen==='results'&&session?.id===attemptId&&gradingEpoch===reportEpoch;
 }
 async function grade(onlyId){
  if(controller||!session||session.status!=='submitted')return;
  if(!putSession()){
   gradingMessage='Export a backup or retry saving the submission before using AI review.';
   report();
   return;
  }
  const requested=mockResults(session).rows.filter(row=>
   mockRubricResponse(row.q,row.response).trim()&&row.q.type!=='choice'&&(onlyId?row.q.id===onlyId:row.pending));
  if(!requested.length){
   gradingMessage='There are no submitted answers awaiting AI review.';
   report();
   return;
  }
  if(!localAI.state.ready){
   gradingMessage='Finish connecting to Ollama to continue reviewing these answers.';
   report({title:'Score'});
   continueAfterSetup('Start grading my answers',()=>grade(onlyId));
   return;
  }
  const rows=exam4?requested:requested.filter(row=>row.q.type!=='written'||qualified(row.q));
  if(!rows.length){
   gradingMessage='Use Check grading model or confirm the written rubric yourself.';
   report();
   return;
  }
  controller=new AbortController();
  operation='grade';
  reviewFailures=[];
  const reportEpoch=++gradingEpoch,signal=controller.signal,attemptId=session.id;
  const {model,endpoint}=localAI.state;
  let savedGrades=0,savedSuggestions=0,needsConfirmation=0;
  const sameModel=()=>localAI.state.model===model&&localAI.state.endpoint===endpoint;
  if(exam4){notesOpen=false;reviewIndex=null;}
  gradingMessage='Starting review of your submitted answers…';
  report({title:'Score'});
  try{
   for(const [index,row] of rows.entries()){
    if(signal.aborted||!reviewStatus(attemptId,reportEpoch))break;
    const q=row.q;
    updateReviewProgress(`Reviewing answer ${index+1} of ${rows.length} · ${q.topic}`);
    if(!sameModel()){
     reviewFailures.push(q.topic+': The selected model changed. Retry the remaining answers.');
     break;
    }
    try{
     const review=q.type==='written'
      ?await writtenJudge.review({question:mockRubricQuestion(q),response:mockRubricResponse(q,row.response),submissionId:session.submission.id},{signal,model,endpoint})
      :await termJudge.review({target:mockTermReviewTarget(q,row.response,{scoringVersion:session.scoringVersion??1}),response:row.response,strictCorrect:row.outcome.strictCorrect,allowOverride:true},{signal,model,endpoint});
     if(signal.aborted||!reviewStatus(attemptId,reportEpoch))break;
     if(!sameModel())throw new Error('The selected model changed. This result was not applied.');
     if(q.type==='written'&&!qualified(q)){
      if(!exam4)throw new Error('The model no longer matches its rubric check.');
      saveWrittenSuggestion(state,session,review);
      if(!save())throw new Error('The suggestion could not be saved on this device.');
      savedSuggestions++;
     }else{
      session=applyMockReview(session,q.id,review);
      if(exam4)recordSpellings();
      if(!putSession())throw new Error('The review is only in this tab. Export a backup before leaving.');
      savedGrades++;
     }
    }catch(error){
     if(signal.aborted)break;
     reviewFailures.push(q.topic+': '+(error.message||'Review failed. Retry this answer.'));
     if(storageError||!sameModel())break;
    }
   }
  }finally{
   if(reportEpoch!==gradingEpoch)return;
   controller=null;
   operation='';
   needsConfirmation=mockResults(session).rows.filter(unconfirmedSuggestion).length;
   const counts=[`${savedGrades} ${savedGrades===1?'review':'reviews'} saved`,savedSuggestions?`${savedSuggestions} AI ${savedSuggestions===1?'suggestion':'suggestions'} saved`:''].filter(Boolean).join(' · ');
   gradingMessage=(signal.aborted?'Review stopped. ':'')+counts+'.'+
    (needsConfirmation?` Open AI suggestions to confirm or adjust ${needsConfirmation} ${needsConfirmation===1?'answer':'answers'}.`:'')+
    (reviewFailures.length?` ${reviewFailures.length} ${reviewFailures.length===1?'item needs':'items need'} attention.`:'');
   if(reviewStatus(attemptId,reportEpoch))report({title:'Score'});
  }
 }
 async function qualifyModel(){
  if(controller)return;
  if(!localAI.state.ready){continueAfterSetup('Check model for automatic scoring',qualifyModel);return;}
  const candidates=session?.status==='submitted'?session.questions.filter(q=>q.type==='written'&&mockRubricResponse(q,session.responses[q.id]||'').trim()&&!qualified(q)):mockExam3Questions.filter(q=>q.type==='written'&&!qualified(q));
  if(!candidates.length){toast('The selected model has passed the checks for these written questions.');return;}
  const selectedFixtures=calibration.filter(f=>candidates.some(q=>q.id===f.questionId));
  if(!selectedFixtures.length){toast('This rubric has no model check yet. Use the learner confirmation after comparing your answer.');return;}
  const isReport=screen==='results',attemptId=session?.id;
  controller=new AbortController();const job=++gradingEpoch,signal=controller.signal,model=localAI.state.model,endpoint=localAI.state.endpoint;
  operation='qualification';reviewFailures=[];
  gradingMessage=`Checking ${model} with ${selectedFixtures.length} prepared answers. This may take several minutes; your own responses are not used.`;
  if(isReport)report();else toast(gradingMessage);
  try{
   const result=await writtenJudge.calibrate(selectedFixtures,gradingQuestions,{signal,model,endpoint,onProgress:p=>{gradingMessage=`Checking rubric scoring: ${p.completed}/${p.total} prepared answers. Your exam stays saved.`;updateReviewProgress(gradingMessage);}});
   if(signal.aborted||model!==localAI.state.model||endpoint!==localAI.state.endpoint)return;
   let passed=0;
   for(const q of candidates){const fixtures=selectedFixtures.filter(f=>f.questionId===q.id),ids=new Set(fixtures.map(f=>f.id));if(!fixtures.length)continue;const record=compactWrittenQualification({...result,cases:result.cases.filter(c=>ids.has(c.id))},fixtures,gradingQuestions);qualifications.push(record);if(record.passed)passed++;}
   try{localStorage.setItem(WRITTEN_QUALIFICATION_KEY,JSON.stringify(qualifications.slice(-30)));}catch{toast('The model check is available for this session, but could not be saved.');}
   gradingMessage=passed===candidates.length?'The selected model passed these rubric checks. Choose Review with AI to grade your original responses.':`${passed}/${candidates.length} rubrics passed. Unverified written points stay pending. Select another model or use learner rubric confirmation.`;
  }catch(error){gradingMessage=signal.aborted?'Model check stopped. No unfinished check qualifies a model.':`Model check could not finish: ${error.message}. Written points stay pending.`;}
  finally{if(job!==gradingEpoch)return;controller=null;operation='';if(isReport&&session?.id===attemptId&&active()&&screen==='results')report();else if(active())toast(gradingMessage);}
 }
 function confirmRubric(q){
  if(controller){toast('Stop the current review before confirming a rubric.');return;}
  const question=mockRubricQuestion(q),response=mockRubricResponse(q,session.responses[q.id]),row=mockResults(session).rows.find(r=>r.q.id===q.id),criteria=rubricCriteria(question);
  const suggestion=unconfirmedSuggestion(row)?suggestionFor(q):null;
  dialog(`<h2>Compare each part of your answer.</h2><p>This saves a <b>learner-confirmed</b> practice review. ${suggestion?'The selected values come from the AI suggestion. Check them against your original answer.':'Award only what your original answer says.'} Choose <b>Not sure</b> to keep a component pending for later review.</p><div class="mock-answer-compare"><div><small>YOUR LOCKED RESPONSE</small><p>${e(response)}</p></div><div><small>VERIFIED EXPLANATION</small><p>${e(q.answer)}</p></div></div>${criteria.map(c=>{const priorDecision=(suggestion?.components||row.outcome.components).find(x=>x.id===c.id)?.decision||'uncertain',decision=priorDecision==='contradicted'?'missing':priorDecision;return `<label class="mock-manual-criterion"><span><b>${e(c.label)} · ${point(c.points)} points</b><small>${e(c.description)}</small></span><select data-manual-criterion="${e(c.id)}">${[['uncertain','Not sure — keep pending'],['met','Present in my answer — award points'],['missing','Missing or incorrect — no points']].map(([value,label])=>`<option value="${value}" ${decision===value?'selected':''}>${label}</option>`).join('')}</select></label>`;}).join('')}<label class="mock-answer-label" for="mock-confirmation-reason">Your reason or correction note (optional)</label><textarea id="mock-confirmation-reason" class="mock-answer" maxlength="1000" rows="2"></textarea><div class="control-row"><button id="mock-manual-cancel">Keep current grade</button><button id="mock-manual-apply" class="primary">Save learner-confirmed review</button></div>`,exam4?content=>{
   const compare=content.querySelector('.mock-answer-compare'),reason=content.querySelector('#mock-confirmation-reason');
   return [mock4Group('Instructions',content.querySelector('p')),
    mock4Group('Locked response',[...compare.firstElementChild.children]),
    mock4Group('Verified explanation',[...compare.lastElementChild.children]),
    mock4Group('Criteria',[...content.querySelectorAll('.mock-manual-criterion')]),
    mock4Group('Review note',reason.previousElementSibling,reason)];
  }:undefined);
  document.querySelector('#mock-manual-cancel').onclick=()=>document.querySelector('#info-dialog').close();
  document.querySelector('#mock-manual-apply').onclick=()=>{try{const decisions=Object.fromEntries([...document.querySelectorAll('[data-manual-criterion]')].map(input=>[input.dataset.manualCriterion,input.value]));const review=createLearnerWrittenReview({question,response,submissionId:session.submission.id,decisions:Object.entries(decisions).map(([id,decision])=>{
   const proposed=suggestion?.components.find(c=>c.id===id);
   return {id,decision,...(proposed?.decision===decision?{evidence:proposed.evidence}:{})};
  }),reason:document.querySelector('#mock-confirmation-reason').value});session=applyMockReview(session,q.id,review);const stored=putSession();document.querySelector('#info-dialog').close();
   if(filter==='suggestions'&&!mockResults(session).rows.some(unconfirmedSuggestion)){
    filter='missed';reviewIndex=null;gradingMessage='Your confirmed written score is included in the report.';
   }
   report();toast(stored?'Learner review saved, including any pending points. Your original response is unchanged.':'The confirmation is in this tab only. Export a recovery backup and retry saving.');}catch(error){toast(error.message);}};
 }
 function help(){dialog('<h2>A little help changes the attempt.</h2><p>Opening a source or tutor before submission marks this item assisted. Your points are still shown separately from that assistance status.</p><div class="control-row"><button id="mock-help-cancel">Return to question</button><button id="mock-help-source">Open course section</button><button class="primary" id="mock-help-tutor">Ask the tutor</button></div>');document.querySelector('#mock-help-cancel').onclick=()=>document.querySelector('#info-dialog').close();for(const kind of ['source','tutor'])document.querySelector('#mock-help-'+kind).onclick=()=>{const q=session.questions[session.index];session.assisted[q.id]=true;putSession();document.querySelector('#info-dialog').close();if(kind==='source')document.dispatchEvent(new CustomEvent('openreader',{detail:q.lesson}));else document.querySelector('#tutor-launch')?.click();};}
 function tutorFor(q){const row=mockResults(session).rows.find(r=>r.q.id===q.id),missing=row.outcome.components.filter(c=>!c.earnedPoints).map(c=>c.label).join('; ');setLearningContext({type:'study',label:label+' correction · '+q.topic,reference:q.lesson,text:`Prompt: ${q.prompt}\nSubmitted: ${row.response}\nVerified answer: ${q.answer}\nMissing criteria: ${missing}\nCourse explanation: ${q.explanation}`.slice(0,1800)});document.querySelector('#tutor-launch')?.click();}
 function targeted(items,title='Targeted recall'){if(!items.length){toast('No resolved missed concepts yet. Review pending answers first.');return;}begin(items,{id:slug+'-targeted',version:exam4?MOCK_EXAM4_VERSION:MOCK_EXAM3_VERSION,title},'practice');}
 function practiceSelections(questions){const selections=[];for(const q of questions){const pick=chooseMockPractice(q,state.history,{exclude:selections.map(s=>s.question.id),related:relatedQuestions});if(pick)selections.push(pick);}return selections;}
 function retry(){const selections=practiceSelections(mockResults(session).missed.map(row=>row.q));const fresh=selections.filter(s=>s.kind==='new').length,repeats=selections.length-fresh;targeted(selections.map(s=>s.question),`Focused recall · ${fresh} new example${fresh===1?'':'s'}${repeats?' · '+repeats+' repeat/revisit':''}`);}
 function related(q){const selection=practiceSelections([q])[0];if(!selection)return;targeted([selection.question],`${selection.kind==='new'?'New example':selection.kind==='revisit'?'Revisit a changed example':'Repeat recall'} · ${q.topic}`);}

 function coverage(){if(exam4){coverage4();return;}dialog('<h2>A strong sample.<br><em>Keep the wider view.</em></h2><p>Form A maps all 21 Quiz Show topics, with some combined or changed into adjacent-feature applications. The whole-scapula review becomes a glenoid target in a different view; the parietal question does not test laterality.</p><p>Written Form A covers ossification and the traditional knee mechanism. The seven-Bone-Question practice set adds tooth support, cartilage/joint comparisons, stabilization, crossing arms and internal/external calli.</p><p><button class="primary" id="mock-coverage-practice">Practice 12 wider-coverage questions ↗</button></p><p>This separate practice set samples the gaps below. It is textbook-based and does not add evidence that these questions will appear on your exam.</p><p><b>Still study:</b> growth-plate zones, appositional growth, all required skull and limb landmarks, spinal curves/discs, limb development, every movement pair, bursae/tendon sheaths, selected joints and joint development.</p><p>Use the broader chapters 6–9 cumulative exam and required bone-list test alongside this mock. These source priorities are not numerical predictions of what your professor will choose.</p><div class="control-row"><button id="mock-coverage-exams" class="primary">Go to Exam center ↗</button><button id="mock-coverage-close">Back</button></div>');document.querySelector('#mock-coverage-practice').onclick=()=>{document.querySelector('#info-dialog').close();begin(mockExam3CoverageQuestions,mockExam3CoverageForm);};document.querySelector('#mock-coverage-close').onclick=()=>document.querySelector('#info-dialog').close();document.querySelector('#mock-coverage-exams').onclick=()=>{document.querySelector('#info-dialog').close();document.dispatchEvent(new Event('openexams'));};}
 function coverage4(){
  const render=items=>syllabus.sections.filter(section=>[10,11].includes(section.chapter)).map(section=>{
   const found=items.filter(q=>q.lesson===section.id),sampled=new Set(found.flatMap(q=>q.objectives));
   const remaining=section.objectives.filter(o=>!sampled.has(o.id));
   return `<details><summary>§${e(section.id)} · ${e(section.title)} · ${found.reduce((n,q)=>n+q.points,0)} pts</summary><p>${found.length?found.map(q=>e(q.topic)).join(' · '):'No questions in this attempt.'}</p>${remaining.length?`<p>Objectives for further practice</p><ul>${remaining.map(o=>`<li>${e(o.text)}</li>`).join('')}</ul>`:''}</details>`;
  }).join('');
  const items=session?.questions||mockExam4Forms.A.questions;
  const testedTerms=new Set(items.map(q=>q.termId).filter(Boolean));
  const pendingTerms=chapter11Muscles.filter(card=>card.courseChecklist&&!testedTerms.has(card.id));
  const checklist=`<details><summary>${pendingTerms.length} checklist entries to practice</summary><p>${pendingTerms.map(card=>e(card.name)).join(' · ')}</p></details>`;
  const evidence=`<section data-form-coverage="Sources">
   <details><summary>How the practice formats were chosen</summary><p>The syllabus specifies four 60-point exams with multiple choice, true/false, matching, fill-in and short-answer formats, including lab material.</p><p>The complete Exams 2 and 3 each contain 44 questions worth 60 points. Exam 3 uses 12 matches on shared diagrams. Exam 2 uses nine diagram targets and three true-or-false statements. Both include 30 multiple-choice questions and two written responses. Form A and Form B practice those two formats.</p><p>The supplied Exam 1 pages show 42 points and include a separate lab page. Its complete format cannot be established from those pages.</p></details>
   <details><summary>What guides the topic emphasis</summary><p>Counting the main topic of each Exam 3 multiple-choice question gives 12 on bone tissue, 16 on joints and two on appendicular anatomy. Much of the regional anatomy appears in diagram questions. In Exam 2, seven of nine visual prompts used a clue about function, location or a tissue property. Both written topics came from the Bone Questions handout, and five multiple-choice questions closely followed OpenStax review items.</p><p>For Exam 4, the chapter slides, the 21 written Muscle Questions, the Chapters 10–11 Quiz Show Review, the required muscle list, and the Week 9 muscle lab guide the practice emphasis. The Quiz Show drill covers all 21 review prompts. The scored forms also draw on the muscle diagram worksheet, muscle-lab quizzes and OpenStax review questions. Practice includes locating a muscle from its action and distinguishing similar names in the forearm and lower leg. The lab lists ten attachment rows to learn on page 8 and opposing actions on page 10. The 14-question lab drill covers those ten attachment rows and the four shoulder ligaments explicitly marked for the muscle test on the required bone list: coracoclavicular, acromioclavicular, glenohumeral and coracohumeral.</p><p>The practice questions sample these patterns. The instructor’s Exam 4 questions and topic weighting remain unknown.</p></details>
   <details><summary>Source scope and corrected terminology</summary><p>The Chapter 11 decks in Weeks 10 and 11 are identical. Repeated files add no new topic emphasis. The personal Week 11 FOP project and Week 9 back-pain report do not establish Exam 4 coverage.</p><p>Chapter 11 slide 17 labels an abdominal muscle “rectus femoris.” The correct abdominal muscle is rectus abdominis; rectus femoris is in the thigh.</p><p>The finger-flexor row on lab page 8 mixes attachment details. Flexor digitorum superficialis attaches to the middle phalanges. Flexor digitorum profundus originates on the ulna and interosseous membrane and attaches to the distal phalanges. Practice uses those distinct relationships.</p></details>
  </section>`;
  dialog(`<h2>Exam 4 coverage</h2><p>Course evidence, practice choices and sampled topics</p>${evidence}<section data-form-coverage="${e(session?.title||'Form A')}">${render(items)}${checklist}</section>${session?'':`<section data-form-coverage="Form B">${render(mockExam4Forms.B.questions)}</section>`}`,content=>[...content.querySelectorAll('[data-form-coverage]')].flatMap(form=>[...form.children].map(detail=>{const g=mock4Details(detail);g.title=form.dataset.formCoverage+' · '+g.title;return g;})));
 }
 function zoom(q){if(exam4){
  dialog(`<h2>${session.status==='submitted'?e(q.topic):'Exam diagram'}</h2><div class="mock-figure mock4-enlarged">${renderFigure(q,{reveal:session.status==='submitted',marker:q.target||q.number})}</div><div class="control-row"><button id="mock-close-figure">Return to ${session.status==='submitted'?'review':'question'} ↗</button></div>`);
  document.querySelector('#mock-close-figure').onclick=()=>document.querySelector('#info-dialog').close();return;
 }dialog(`<div class="mock-shell mock-lightbox${exam4?' mock-exam4':''}"><h2>${session.status==='submitted'?e(q.topic):'Follow the numbered target.'}</h2><div class="mock-figure">${renderFigure(q,{reveal:session.status==='submitted',marker:q.target||q.number})}</div><p>Use browser zoom to inspect fine detail.</p>${exam4?'<button id="mock-close-figure">Return to exam ↗</button>':''}</div>`);document.querySelector('#mock-close-figure')?.addEventListener('click',()=>document.querySelector('#info-dialog').close());}
 function download(data,name,type='application/json'){const url=URL.createObjectURL(new Blob([typeof data==='string'?data:JSON.stringify(data,null,2)],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 function backup(){if(unreadableRecord){download(unreadableRecord,'osteon-'+slug+'-original-recovery.json');toast('Original unreadable record downloaded for recovery.');return;}checkpoint();if(session?.status==='draft')putSession();download(storage.backup(state),`osteon-${slug}-backup-${new Date().toISOString().slice(0,10)}.json`);toast(label+' backup downloaded.');}
 function restore(){const input=document.createElement('input');input.type='file';input.accept='.json,application/json';input.onchange=async()=>{const file=input.files[0];if(!file)return;try{if(file.size>15e6)throw new Error('Choose a mock backup smaller than 15 MB.');const imported=storage.restore(JSON.parse(await file.text()));dialog(`<h2>Restore this ${label} backup?</h2><p>${imported.history.length} completed reports, ${imported.active?'one saved attempt':'no unfinished mock'}${imported.quizShowDraft?' and one saved Quiz Show Review':''}, ${Object.keys(imported.notes).length} personal notes and both card sides. This replaces saved ${label} records on this device.</p><p>Export your current mock work first to keep both copies.</p><div class="control-row"><button id="mock-import-cancel">Cancel</button><button class="primary" id="mock-import-confirm">Restore mock work</button></div>`);document.querySelector('#mock-import-cancel').onclick=()=>document.querySelector('#info-dialog').close();document.querySelector('#mock-import-confirm').onclick=()=>{try{storage.write(localStorage,imported);cancelJob();state=imported;unreadableRecord='';session=null;document.querySelector('#info-dialog').close();home();toast(label+' work restored.');}catch(error){toast(error.message);}};}catch(error){toast(error.message);}};input.click();}
 function exportText(){const result=mockResults(session);const lines=[session.title,`Score ${result.earnedPoints}/${result.maxPoints}; ${result.pendingPoints} points pending.`,''];for(const row of result.rows){const n=noteFor(row.q);lines.push(`Q${session.ids.indexOf(row.q.id)+1}. ${row.q.prompt}`,`Your answer: ${row.response||'(blank)'}`,`Points: ${row.outcome.earnedPoints}/${row.maxPoints}; pending ${row.outcome.pendingPoints}`,`Answer: ${row.q.answer}`,`Why: ${row.q.explanation}`,`Source: ${row.q.source}`,`What I confused: ${studyNoteValue(n,'confusion')}`,`Rule: ${studyNoteValue(n,'rule')}`,`Ask myself: ${studyNoteValue(n,'retrieval')}`,'');}lines.push(cardText(state.card,label));download(lines.join('\n'),`osteon-${slug}-study-${date(session.submitted).replace(/\W+/g,'-')}.txt`,'text/plain');}
 function card(){checkpoint();if(session?.status==='draft')putSession();const used=state.card.front.concat(state.card.back).filter(t=>t.trim()).length;paint(`${top(label+' home','home')}<div class="mock-exam-head"><div><span class="mock-kicker">YOUR 3 × 5 MEMORY CARD</span><h1>Small card.<br><em>Sharper recall.</em></h1><p><span data-card-count>${used}</span> / 48 lines · 24 on each side · your earlier saved notecard files stay unchanged</p></div><div class="mock-mini-actions"><button class="mock-btn" data-mock-action="card-download">Download copy text</button><button class="mock-btn primary" data-mock-action="card-preview">Actual-size preview ↗</button></div></div><p class="mock-note">Build from the mistakes you actually make. Edit any line, move it up or down, and leave room for your handwriting. Amber lines are long enough to check by hand; character count alone cannot guarantee fit.</p><div class="mock-card-grid">${['front','back'].map(side=>`<section class="mock-card-side"><h2>${side==='front'?'Front':'Back'}.</h2><p>24 lines · abbreviate only after the idea is clear</p>${state.card[side].map((line,i)=>`<div class="mock-card-row ${line.length>88?'overlong':''}"><span>${String(i+1).padStart(2,'0')}</span><input aria-label="${side} line ${i+1}" data-card-side="${side}" data-card-line="${i}" maxlength="180" value="${e(line)}"><span><button aria-label="Move ${side} line ${i+1} up" data-card-move="${side}:${i}:-1" ${i===0?'disabled':''}>↑</button><button aria-label="Move ${side} line ${i+1} down" data-card-move="${side}:${i}:1" ${i===23?'disabled':''}>↓</button></span></div>`).join('')}</section>`).join('')}</div><div class="mock-mini-actions"><button class="mock-btn" data-mock-action="backup">Back up card & exam work</button></div>`,'card');}
 function cardPreview(){
  const markup=['front','back'].map(side=>`<p class="mock-print-label">${side==='front'?'Front':'Back'} · 3 × 5 inches · 24 writing lines</p><div class="mock-card-preview" data-card-preview-side="${side}">${state.card[side].map((line,i)=>`<div data-preview-line="${i}">${e(line)||'&nbsp;'}</div>`).join('')}</div>`).join('');
  const measure=document.createElement('div');measure.className='mock-card-measure';measure.innerHTML=markup;document.body.append(measure);
  const overflow=[...measure.querySelectorAll('[data-preview-line]')].filter(line=>line.scrollWidth>line.clientWidth+1).map(line=>({side:line.parentElement.dataset.cardPreviewSide,line:Number(line.dataset.previewLine)}));measure.remove();
  dialog(`<h2>Your card, at scale.</h2><p>The fit check measures text at the printed 3 × 5 inch size. Print at 100% / actual size. Screen previews may scale to fit your device.</p><p id="mock-card-fit-warning" role="status" class="${overflow.length?'mock-error':'mock-note'}">${overflow.length?`${overflow.length} line(s) would be clipped: ${overflow.map(item=>`${item.side==='front'?'Front':'Back'} line ${item.line+1}`).join(', ')}. Shorten these lines before printing. Your full text remains saved and available in Download copy text.`:'All 48 lines fit within the printed width at the displayed type size. Check your handwriting separately.'}</p>${markup}<div class="control-row"><button id="mock-card-edit">Return to edit card</button><button class="primary" id="mock-print-card" ${overflow.length?'disabled':''}>Print card layout</button></div>`,exam4?content=>{const [help,warning]=content.querySelectorAll('p:not(.mock-print-label)');return ['front','back'].map(side=>{const card=content.querySelector(`[data-card-preview-side="${side}"]`);return mock4Group(side==='front'?'Front':'Back',card.previousElementSibling,card);}).concat(mock4Group('Print fit',help,warning));}:undefined);
  for(const item of overflow)document.querySelector(`[data-card-preview-side="${item.side}"] [data-preview-line="${item.line}"]`)?.classList.add('overlong');
  document.querySelector('#mock-card-edit').onclick=()=>{document.querySelector('#info-dialog').close();card();const first=overflow[0];if(first)focusItem(query(`[data-card-side="${first.side}"][data-card-line="${first.line}"]`));};
  document.querySelector('#mock-print-card').onclick=()=>{if(overflow.length)return;const sheet=document.createElement('div');sheet.className='mock-print-only';sheet.innerHTML=markup;document.body.append(sheet);document.body.classList.add('mock-print-card');window.addEventListener('afterprint',()=>{sheet.remove();document.body.classList.remove('mock-print-card');},{once:true});window.print();};
 }
 function handleInput(event){const t=event.target;if(t.dataset.mockCandidate){const q=session?.questions.find(q=>q.id===t.dataset.mockCandidate);if(q){state.notes[noteKey(q)]={...noteFor(q),cardDraft:t.value.slice(0,180),updatedAt:Date.now()};save();}}if(t.id==='mock-answer')updateResponse(t.value);if(t.id==='mock-claim-reason')saveClaim();if(t.dataset.mockNote){const q=session?.questions.find(q=>q.id===t.dataset.question);if(!q)return;const prior=noteFor(q),field=t.dataset.mockNote;const n={...prior,[field]:t.value.slice(0,2000),updatedAt:Date.now()};if(exam4)n.studyEdits=[...new Set([...(prior.studyEdits||[]),field])];state.notes[noteKey(q)]=n;save();}if(t.dataset.cardSide){state.card[t.dataset.cardSide][Number(t.dataset.cardLine)]=t.value.slice(0,180);t.closest('.mock-card-row').classList.toggle('overlong',t.value.length>88);query('[data-card-count]').textContent=state.card.front.concat(state.card.back).filter(s=>s.trim()).length;save();}}
 function saveClaim(){const judgment=query('[name="mock-claim-judgment"]:checked')?.value||'',reason=query('#mock-claim-reason').value;updateResponse(judgment||reason?judgment+'\n'+reason:'');}
 function handleChange(event){const t=event.target;if(t.id==='mock-word-bank'){query('#mock-answer').value=t.value;updateResponse(t.value);return;}if(t.id==='mock4-review-filter'){filter=t.value;report({title:'Score'});focusItem(query('#mock4-review-filter'));return;}if(t.id==='mock4-result-number'){reviewIndex=Number(t.value);report({title:'Question'});focusItem(query('#mock4-result-number'));return;}if(t.name==='mock-claim-judgment')saveClaim();if(t.id==='mock-auto-grade')autoGrade=t.checked;if(t.dataset.mockSide){const q=session?.questions.find(q=>q.id===t.dataset.mockSide);if(q){state.notes[noteKey(q)]={...noteFor(q),cardSide:t.value,updatedAt:Date.now()};save();}}}
 function handleKeys(event){if(!event.target.matches('[data-mock-option]')||!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const options=[...root.querySelectorAll('[data-mock-option]')],i=options.indexOf(event.target),step=['ArrowUp','ArrowLeft'].includes(event.key)?-1:1,next=event.key==='Home'?0:event.key==='End'?options.length-1:(i+step+options.length)%options.length;options[next].click();focusItem(options[next]);}
 function handleClick(event){const b=event.target.closest('button');if(!b||b.disabled)return;
  const currentQ=id=>session?.questions.find(q=>q.id===id);
  if(b.dataset.studyRecall&&notesOpen){
   const row=mockResults(session).rows.find(item=>item.q.id===b.dataset.studyRecall);
   if(row&&hasConfirmedMiss(row))startStudyRecall(studyRecallItems(row));
   return;
  }
  if(b.dataset.mockForm){const form=mockExam4Forms[b.dataset.mockForm];begin(form.questions,form,query('#mock4-mode').value);return;}
  if(b.dataset.mockExtended){document.dispatchEvent(new CustomEvent('openextendedexam',{detail:b.dataset.mockExtended}));return;}
  if(b.dataset.mockSpatial){document.dispatchEvent(new CustomEvent('openmusclespatial',{detail:{termId:b.dataset.mockSpatial}}));return;}
  if(b.dataset.mockIndex!==undefined){session.index=Number(b.dataset.mockIndex);exam();focusItem(query('#mock-question-title'));return;}
  if(b.dataset.mockOption!==undefined){const q=session.questions[session.index];updateResponse(session.options[q.id][Number(b.dataset.mockOption)]);root.querySelectorAll('[data-mock-option]').forEach(el=>{const selected=el===b;el.setAttribute('aria-checked',String(selected));el.tabIndex=selected?0:-1;});return;}
  if(b.dataset.mockReport){selectReport(b.dataset.mockReport);return;}
  if(b.dataset.mockPriority){filter='lesson:'+b.dataset.mockPriority;if(exam4)reviewIndex=0;report();query('#mock-review-list')?.scrollIntoView({block:'start'});return;}
  if(b.dataset.mockFilter){filter=b.dataset.mockFilter;report();query('#mock-review-list')?.scrollIntoView({block:'start'});return;}
  if(b.dataset.mockZoom){zoom(currentQ(b.dataset.mockZoom));return;}
  if(b.dataset.mockLesson){document.dispatchEvent(new CustomEvent('openreader',{detail:currentQ(b.dataset.mockLesson).lesson}));return;}
  if(b.dataset.mockTutor){tutorFor(currentQ(b.dataset.mockTutor));return;}
  if(b.dataset.mockGrade){grade(b.dataset.mockGrade);return;}
  if(b.dataset.mockConfirm){confirmRubric(currentQ(b.dataset.mockConfirm));return;}
  if(b.dataset.mockRelated){related(currentQ(b.dataset.mockRelated));return;}
  if(b.dataset.mockAddNote){const id=b.dataset.mockAddNote;try{const result=addCardCandidate(state.card,query(`[data-mock-candidate="${id}"]`).value,query(`[data-mock-side="${id}"]`).value);state.card=result.card;save();toast(result.duplicate?'That reminder is already on your card.':`Added to ${result.side}, line ${result.index+1}. Edit it in Your notecard.`);}catch(error){toast(error.message);}return;}
  if(b.dataset.cardMove){const [side,line,delta]=b.dataset.cardMove.split(':'),i=Number(line),j=i+Number(delta);[state.card[side][i],state.card[side][j]]=[state.card[side][j],state.card[side][i]];save();card();focusItem(query(`[data-card-side="${side}"][data-card-line="${j}"]`));return;}
  switch(b.dataset.mockAction){
   case'center':checkpoint();if(session?.status==='draft')putSession();document.dispatchEvent(new Event('openexams'));break;
   case'home':cancelJob();home();break;
   case'start':case'new':begin();break;
   case'resume':resume();break;
   case'saved-results':focusItem(query('#mock4-saved-results'));break;
   case'previous':case'next':checkpoint();session.index+=b.dataset.mockAction==='next'?1:-1;exam();focusItem(query('#mock-question-title'));break;
   case'flag':{const q=session.questions[session.index];session.flags[q.id]=!session.flags[q.id];exam();break;}
   case'review-submit':reviewSubmit();break;
   case'help':if(!exam4||coaching())help();break;
   case'spellings':{const cards=spellingDeck(mockResults(session).rows);if(cards.length){cancelJob();screen='spelling';startSpellingReview({root,cards,onExit:report,escape:e,present:exam4?html=>paint(html,'spelling'):undefined});}break;}
   case'coach-check':if(coaching()){const q=session.questions[session.index];session.assisted[q.id]=true;coachedFeedback=q.id;exam({title:'Feedback'});}break;
   case'navigator':if(exam4)pickQuestion();break;
   case'professor':document.dispatchEvent(new Event('openprofessormusclereview'));break;
   case'quiz-show':if(exam4)quizShow();break;
   case'attachments':if(exam4)begin(mockExam4AttachmentQuestions,mockExam4AttachmentForm,'practice');break;
   case'muscle-labeling':document.dispatchEvent(new Event('openmusclelabeling'));break;
   case'checklist':document.dispatchEvent(new Event('openmusclechecklist'));break;
   case'ai':aiSetup();break;
   case'grade':resumeOrStart(grade);break;
   case'suggestions':showSuggestions();break;
   case'create-notes':openStudySheet();break;
   case'priority-recall':if(notesOpen)startStudyRecall(priorityRecall(missedStudyPriorities(mockResults(session).rows,state.history,session.id)));break;
   case'refine-notes':resumeOrStart(refineNotes);break;
   case'download-sheet':downloadStudySheet();break;
   case'stop-review':controller?.abort();updateReviewProgress('Stopping. Completed work is saved.');break;
   case'qualify':qualifyModel();break;
   case'cancel-grade':cancelJob();report();break;
   case'retry-save':putSession();report();break;
   case'focus-missed':filter='missed';if(exam4)reviewIndex=0;report();query('#mock-review-list')?.scrollIntoView({block:'start'});break;
   case'open-review':reviewIndex=0;report();break;
   case'back-score':if(operation==='notes')cancelJob();reviewIndex=null;notesOpen=false;reviewContinuation=null;report({title:'Score'});break;
   case'previous-result':reviewIndex--;report({title:'Question'});break;
   case'next-result':reviewIndex++;report({title:'Question'});break;
   case'retry':retry();break;
   case'wider':begin(mockExam3CoverageQuestions,mockExam3CoverageForm);break;
   case'bone-questions':if(exam4){document.dispatchEvent(new Event('openprofessormusclereview'));break;}targeted(mockExam3Rotations.filter(q=>q.type==='written'&&q.boneQuestionIds?.length).slice(0,7),'Seven Bone Questions');break;
   case'card':card();break;
   case'card-download':download(cardText(state.card,label),'osteon-'+slug+'-notecard.txt','text/plain');break;
   case'card-preview':cardPreview();break;
   case'backup':backup();break;
   case'import':restore();break;
   case'coverage':coverage();break;
   case'export-report':download(mockReportExport(session,{notes:state.notes,card:state.card,kind:'osteon-'+slug+'-report'}),`osteon-${slug}-report-${session.id}.json`);break;
   case'export-text':exportText();break;
  }
 }
 document.addEventListener('click',event=>{if(event.target.closest(exam4?'[data-exam4-open]':'[data-mock-open]'))home();});
 document.addEventListener('open'+slug,home);
 if(exam4){
  document.addEventListener('openexam4attachments',()=>begin(mockExam4AttachmentQuestions,mockExam4AttachmentForm,'practice'));
  document.addEventListener('resumeexam4quizshow',quizShow);
 }
 document.addEventListener('resume'+slug,resume);
 document.addEventListener(slug+'results',event=>{const id=event.detail?.id||state.history.at(-1)?.id;if(id)selectReport(id);else home();});
 document.addEventListener(slug+'card',card);
 document.addEventListener('studyassistance',()=>{if((!exam4||coaching())&&active()&&screen==='exam'&&session?.status==='draft'){session.assisted[session.ids[session.index]]=true;putSession();}});
 document.addEventListener('viewchange',()=>{
  if(!ownsView||active())return;
  ownsView=false;layout?.close();layout=null;checkpoint();if(session?.status==='draft')putSession();cancelJob();reviewContinuation=null;
  if(document.body.dataset.mockExamActive===slug)delete document.body.dataset.mockExamActive;
  if(exam4)setTutorAssessmentMode(null);
 });
 document.addEventListener('visibilitychange',()=>{checkpoint();if(session?.status==='draft')putSession();});
 window.addEventListener('pagehide',()=>{checkpoint();if(session?.status==='draft')putSession();});
 setInterval(()=>{if(active()&&screen==='exam'&&session?.status==='draft'){checkpoint();putSession();query('[data-mock-time]')?.replaceChildren(document.createTextNode(duration(session.elapsedSeconds||0)));}},5000);
 localAI.subscribe(()=>{if(!active())return;root.querySelectorAll('.mock-chip[data-mock-action="ai"]').forEach(el=>{el.classList.toggle('ready',localAI.state.ready);el.innerHTML=`<i aria-hidden="true"></i>${localAI.state.ready?'Local AI ready':'Local AI setup'}`;});});
 return {open:home,resume,results:report};
}
