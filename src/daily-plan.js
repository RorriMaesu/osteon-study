import {chapterOf,activeChapters} from './chapters.js';
import {questions,lessons,reviewCards} from './learning-data.js';
import {terms} from './data.js';
import {getProgress} from './storage.js';
import {LESSON_WORK_KEY,validLessonWork} from './lesson-flow.js';
export const PLAN_KEY='osteon-study-plan-v1';
export function planSettings(storage){try{const p=JSON.parse(storage.getItem(PLAN_KEY));return {minutes:[10,15,20,30,45,60].includes(p?.minutes)?p.minutes:20,examDate:typeof p?.examDate==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(p.examDate)?p.examDate:''};}catch{return {minutes:20,examDate:''};}}
export function variedQuestions(items,attempts,count=10){
 const latest=new Map();for(const a of attempts)if(!a.selfRated&&(!latest.has(a.id)||latest.get(a.id).at<a.at))latest.set(a.id,a);
 const rank=q=>!latest.has(q.id)?1:latest.get(q.id).correct&&!latest.get(q.id).assisted?2:0;
 const pool=items.slice().sort((a,b)=>rank(a)-rank(b)||(latest.get(a.id)?.at||0)-(latest.get(b.id)?.at||0)),out=[],used=new Set();
 for(const q of pool){const concept=q.objectives?.[0]||q.lesson;if(!used.has(concept)){used.add(concept);out.push(q);if(out.length===count)return out;}}
 for(const q of pool)if(out.length<count&&!out.includes(q))out.push(q);return out;
}
export function dailyRoute(progress,{minutes=20,examDate='',now=Date.now()}={}){
 const latest=new Map();for(const a of progress.attempts)if(!a.selfRated&&(!latest.has(a.id)||latest.get(a.id).at<a.at))latest.set(a.id,a);
 const evidence=lessons.map(l=>{const qs=questions.filter(q=>q.lesson===l.id),weak=qs.filter(q=>latest.has(q.id)&&(!latest.get(q.id).correct||latest.get(q.id).assisted)),newItems=qs.filter(q=>!latest.has(q.id));return {lesson:l,weak:weak.length,newItems:newItems.length};}).sort((a,b)=>b.weak-a.weak||(a.newItems?0:1)-(b.newItems?0:1)||a.lesson.id.localeCompare(b.lesson.id,undefined,{numeric:true}));
 const chosen=evidence[0],pool=[...terms,...reviewCards],unique=[...new Map(pool.map(t=>[t.id,t])).values()],due=unique.filter(t=>Number.isFinite(progress.cards[t.id]?.due)&&progress.cards[t.id].due<=now).sort((a,b)=>progress.cards[a.id].due-progress.cards[b.id].due).slice(0,Math.max(1,Math.min(5,Math.floor(minutes/4))));
 const days=examDate?Math.ceil((new Date(examDate+'T23:59:59').getTime()-now)/86400000):null,mixed=days!==null&&days>=0&&days<=7;
 const count=Math.max(3,Math.min(10,Math.floor(minutes/2)));let items;
 if(mixed){const chapters=[chapterOf(chosen.lesson.id),...activeChapters.map(c=>String(c.id)).filter(c=>c!==chapterOf(chosen.lesson.id))],pools=chapters.map(c=>variedQuestions(questions.filter(q=>chapterOf(q.lesson)===c),progress.attempts,count));items=[];for(let i=0;items.length<count&&i<count;i++)for(const pool of pools)if(items.length<count&&pool[i])items.push(pool[i]);}
 else items=variedQuestions(questions.filter(q=>q.lesson===chosen.lesson.id),progress.attempts,count);
 return {lesson:chosen.lesson,weak:chosen.weak,due,items,minutes,days,mixed};
}
export function dailyPlanHTML(storage,e){const settings=planSettings(storage),route=dailyRoute(getProgress(),settings);let resume=null;try{const work=JSON.parse(storage.getItem(LESSON_WORK_KEY));if(validLessonWork(work))resume=Object.entries(work||{}).sort((a,b)=>(b[1].updatedAt||0)-(a[1].updatedAt||0))[0]?.[0];}catch{}
 return `<section class="daily-plan" aria-label="Recommended study route"><div><span class="eyebrow">YOUR NEXT ${route.minutes} MINUTES${settings.examDate?' · EXAM '+e(settings.examDate):''}</span><h2>${route.weak?'Repair one weak connection.':'Build one useful connection.'}</h2><p>Review what is due, study §${route.lesson.id}, then try ${route.mixed?'a mixed-chapter check for the final week':'a varied section check'}. Reading and self-ratings stay separate from independent retrieval.</p></div><div class="daily-actions"><button data-daily-action="due" ${route.due.length?'':'disabled'}>1 · Review ${route.due.length} due cards</button><button data-daily-action="lesson">2 · Learn §${route.lesson.id}</button><button class="primary" data-daily-action="quiz">3 · Test ${route.items.length} questions</button><button class="text-btn" data-daily-action="settings">Time & exam date</button>${resume?`<button class="text-btn" data-daily-resume="${resume}">Resume section ${resume}</button>`:''}</div></section>`;
}
export function bindDailyPlan(root,{dialog,toast,escape:e,onChange}={}){
 root.querySelectorAll('[data-daily-resume]').forEach(b=>b.onclick=()=>document.dispatchEvent(new CustomEvent('openlesson',{detail:b.dataset.dailyResume})));
 root.querySelectorAll('[data-daily-action]').forEach(b=>b.onclick=()=>{const route=dailyRoute(getProgress(),planSettings(localStorage));
  if(b.dataset.dailyAction==='lesson')document.dispatchEvent(new CustomEvent('openlesson',{detail:route.lesson.id}));
  if(b.dataset.dailyAction==='quiz')document.dispatchEvent(new CustomEvent('exampractice',{detail:route.items.map(q=>q.id)}));
  if(b.dataset.dailyAction==='due')document.dispatchEvent(new CustomEvent('studydeck',{detail:route.due}));
  if(b.dataset.dailyAction==='settings'){const settings=planSettings(localStorage);dialog(`<h2>Your study time</h2><label for="plan-minutes">Daily minutes</label><select id="plan-minutes">${[10,15,20,30,45,60].map(n=>`<option ${settings.minutes===n?'selected':''}>${n}</option>`).join('')}</select><label for="plan-exam-date">Exam date · optional</label><input id="plan-exam-date" type="date" value="${e(settings.examDate)}"><p>The route prioritizes due review and concepts needing another attempt. During the final seven days, the exit check mixes chapters to revisit connections. The plan does not predict a grade.</p><button class="primary" id="plan-save">Save study plan</button>`);document.querySelector('#plan-save').onclick=()=>{const examDate=document.querySelector('#plan-exam-date').value,minutes=+document.querySelector('#plan-minutes').value;try{localStorage.setItem(PLAN_KEY,JSON.stringify({examDate,minutes}));document.querySelector('#info-dialog').close();onChange?.();toast('Study plan saved on this device.');}catch{toast('This browser could not save the plan.');}};}
 });
}
