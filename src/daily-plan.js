import {chapterOf,activeChapters} from './chapters.js';
import {questions,lessons,reviewCards} from './learning-data.js';
import {terms} from './data.js';
import {getProgress} from './storage.js';
import {LESSON_WORK_KEY,validLessonWork} from './lesson-flow.js';
import {automaticPracticeQuestions,sectionCheckpoint} from './study-evidence.js';
export const PLAN_KEY='osteon-study-plan-v1';
const defaults=[10,11],available=activeChapters.map(c=>c.id);
export function planChapters(value){if(value==='all')return [...available];if(!Array.isArray(value))return [...defaults];const ids=[...new Set(value.map(Number).filter(n=>available.includes(n)))].sort((a,b)=>a-b);return ids.length?ids:[...defaults];}
export function planSettings(storage){let p;try{p=JSON.parse(storage.getItem(PLAN_KEY));}catch{}return {minutes:[10,15,20,30,45,60].includes(p?.minutes)?p.minutes:20,examDate:typeof p?.examDate==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(p.examDate)?p.examDate:'',chapters:planChapters(p?.chapters)};}
export const variedQuestions=sectionCheckpoint;
export function studyItemChapter(item){
 const direct=Number(item.chapter);if(available.includes(direct))return direct;
 const lesson=chapterOf(item.lesson||item.reference||item.representation?.reference||'');if(lesson)return Number(lesson);
 const label=String(item.topic||item.region||'').match(/^Chapter\s+(\d+)$/i);return label?Number(label[1]):null;
}
export function dailyRoute(progress,{minutes=20,examDate='',chapters=defaults,now=Date.now()}={}){
 const selected=planChapters(chapters),inScope=q=>selected.includes(studyItemChapter(q)),automatic=automaticPracticeQuestions(questions).filter(inScope);
 const latest=new Map();for(const a of progress.attempts)if(!a.selfRated&&(!latest.has(a.id)||latest.get(a.id).at<a.at))latest.set(a.id,a);
 const evidence=lessons.filter(l=>selected.includes(Number(chapterOf(l.id)))).map(l=>{const qs=automatic.filter(q=>q.lesson===l.id),weak=qs.filter(q=>latest.has(q.id)&&(!latest.get(q.id).correct||latest.get(q.id).assisted)),newItems=qs.filter(q=>!latest.has(q.id));return {lesson:l,weak:weak.length,newItems:newItems.length};}).sort((a,b)=>b.weak-a.weak||(a.newItems?0:1)-(b.newItems?0:1)||a.lesson.id.localeCompare(b.lesson.id,undefined,{numeric:true}));
 const chosen=evidence[0],allScope=selected.length===available.length,pool=[...terms,...reviewCards],unique=[...new Map(pool.map(t=>[t.id,t])).values()],due=unique.filter(t=>(allScope||inScope(t))&&Number.isFinite(progress.cards[t.id]?.due)&&progress.cards[t.id].due<=now).sort((a,b)=>progress.cards[a.id].due-progress.cards[b.id].due).slice(0,Math.max(1,Math.min(5,Math.floor(minutes/4))));
 const days=examDate?Math.ceil((new Date(examDate+'T23:59:59').getTime()-now)/86400000):null,finalWeek=days!==null&&days>=0&&days<=7;
 const mixed=selected.length>1,count=Math.max(3,Math.min(10,Math.floor(minutes/2)));let items;
 if(mixed){const order=[Number(chapterOf(chosen.lesson.id)),...selected.filter(c=>c!==Number(chapterOf(chosen.lesson.id)))],pools=order.map(c=>variedQuestions(automatic.filter(q=>Number(chapterOf(q.lesson))===c),progress.attempts,count));items=[];for(let i=0;items.length<count&&i<count;i++)for(const pool of pools)if(items.length<count&&pool[i])items.push(pool[i]);}
 else items=variedQuestions(automatic.filter(q=>q.lesson===chosen.lesson.id),progress.attempts,count);
 return {lesson:chosen.lesson,weak:chosen.weak,due,items,minutes,days,mixed,finalWeek,chapters:selected};
}
const scopeLabel=chapters=>chapters.length===available.length?'All available chapters':chapters.length===1?'Chapter '+chapters[0]:'Chapters '+chapters.join(' + ');
export function dailyPlanHTML(storage,e){const settings=planSettings(storage),route=dailyRoute(getProgress(),settings);let resume=null;try{const work=JSON.parse(storage.getItem(LESSON_WORK_KEY));if(validLessonWork(work))resume=Object.entries(work||{}).filter(([id])=>settings.chapters.includes(Number(chapterOf(id)))).sort((a,b)=>(b[1].updatedAt||0)-(a[1].updatedAt||0))[0]?.[0];}catch{}
 return `<section class="daily-plan" aria-label="Recommended study route"><div><span class="eyebrow">YOUR NEXT ${route.minutes} MINUTES · ${e(scopeLabel(route.chapters))}${settings.examDate?' · EXAM '+e(settings.examDate):''}</span><h2>${route.weak?'Repair one weak connection.':'Build one useful connection.'}</h2><p>Review what is due in your selected chapters, study §${route.lesson.id}, then try ${route.mixed?'a mixed check across your exam chapters':'a varied section check'}.${route.finalWeek?' Final week: return to missed concepts after feedback.':''} Reading, self-ratings and written rubrics stay separate from automatic retrieval.</p></div><div class="daily-actions"><button data-daily-action="due" ${route.due.length?'':'disabled'}>1 · Review ${route.due.length} due cards</button><button data-daily-action="lesson">2 · Learn §${route.lesson.id}</button><button class="primary" data-daily-action="quiz">3 · Test ${route.items.length} questions</button><button class="text-btn" data-daily-action="settings">Chapters, time & exam date</button>${resume?`<button class="text-btn" data-daily-resume="${resume}">Resume section ${resume}</button>`:''}</div></section>`;
}
export function bindDailyPlan(root,{dialog,toast,escape:e,onChange}={}){
 root.querySelectorAll('[data-daily-resume]').forEach(b=>b.onclick=()=>document.dispatchEvent(new CustomEvent('openlesson',{detail:b.dataset.dailyResume})));
 root.querySelectorAll('[data-daily-action]').forEach(b=>b.onclick=()=>{const route=dailyRoute(getProgress(),planSettings(localStorage));
  if(b.dataset.dailyAction==='lesson')document.dispatchEvent(new CustomEvent('openlesson',{detail:route.lesson.id}));
  if(b.dataset.dailyAction==='quiz')document.dispatchEvent(new CustomEvent('exampractice',{detail:route.items.map(q=>q.id)}));
  if(b.dataset.dailyAction==='due')document.dispatchEvent(new CustomEvent('studydeck',{detail:route.due}));
  if(b.dataset.dailyAction==='settings'){const settings=planSettings(localStorage);dialog(`<h2>Study plan</h2><p id="plan-scope" role="status">${e(scopeLabel(settings.chapters))}</p><div class="control-row"><button type="button" id="plan-muscles">Chapters 10 + 11</button><button type="button" id="plan-all">All chapters</button></div><details id="plan-chapters"><summary>Choose individual chapters</summary><fieldset><legend>Include these chapters</legend><div class="control-row">${activeChapters.map(c=>`<label class="check-line"><input type="checkbox" data-plan-chapter="${c.id}" ${settings.chapters.includes(c.id)?'checked':''}> ${c.id} · ${e(c.short)}</label>`).join('')}</div></fieldset></details><div class="control-row"><label for="plan-minutes">Daily minutes <select id="plan-minutes">${[10,15,20,30,45,60].map(n=>`<option ${settings.minutes===n?'selected':''}>${n}</option>`).join('')}</select></label><label for="plan-exam-date">Exam date · optional <input id="plan-exam-date" type="date" value="${e(settings.examDate)}"></label></div><p class="tiny">Lessons, due cards and checks follow these chapters. Written practice stays separate.</p><button class="primary" id="plan-save">Save study plan</button><p id="plan-error" role="status"></p>`);
   const checks=()=>[...document.querySelectorAll('[data-plan-chapter]')],updateScope=()=>{const chapters=checks().filter(c=>c.checked).map(c=>+c.dataset.planChapter);document.querySelector('#plan-scope').textContent=chapters.length?scopeLabel(chapters):'Choose at least one chapter.';};checks().forEach(c=>c.onchange=updateScope);document.querySelector('#plan-muscles').onclick=()=>{checks().forEach(c=>c.checked=[10,11].includes(+c.dataset.planChapter));updateScope();};document.querySelector('#plan-all').onclick=()=>{checks().forEach(c=>c.checked=true);updateScope();};
   document.querySelector('#plan-save').onclick=()=>{const chapters=checks().filter(c=>c.checked).map(c=>+c.dataset.planChapter);if(!chapters.length){document.querySelector('#plan-error').textContent='Choose at least one chapter.';return;}const examDate=document.querySelector('#plan-exam-date').value,minutes=+document.querySelector('#plan-minutes').value;try{localStorage.setItem(PLAN_KEY,JSON.stringify({examDate,minutes,chapters}));document.querySelector('#info-dialog').close();onChange?.();toast('Study plan saved on this device.');}catch{toast('This browser could not save the plan.');}};}
 });
}
