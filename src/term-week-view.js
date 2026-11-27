import {termExamWeeks,termExamSources} from './term-exam-weeks.js';

export function showExamWeek({course,week,name,page,root,hero,link,e,route,go,sections,scopes,itemsFor,start}){
  const plan=termExamWeeks[course],row=plan.find(w=>w.week===week)||plan[0];
  const spec=scopes.find(s=>s.id===row.scope);
  const sources=termExamSources.filter(s=>!s.course||s.course===course);
  let milestoneLinks='';
  if(spec){
    const finals=spec.id==='all';
    milestoneLinks=link(route('setup',spec.id),finals?'Set up cumulative mock':'Set up unit mock');
    if(finals)milestoneLinks+=course==='ap2'?link('ap2-spotter','Open scored 3D practical'):link(route('setup','practical'),'Set up cumulative practical');
  }
  const lessons=row.sections.map(s=>link(course+'-lesson-'+s,'§'+s+' · '+sections.get(s).title)).join('');
  const date=new Intl.DateTimeFormat(undefined,{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'})
    .format(new Date(row.weekOf+'T12:00:00Z'));
  page(hero(name+' · EXAM PLANNER','11-week study plan','Suggested pacing for the term. Follow your instructor’s syllabus for assigned readings and exam dates.')+
    '<div class="course-actions tm-week-picker"><button data-week-prev '+(row.week===1?'disabled':'')+'>← Previous</button>'+
    '<label>Study week <select data-week-jump>'+plan.map(w=>'<option value="'+w.week+'" '+(w.week===row.week?'selected':'')+'>Week '+w.week+' · '+e(w.title)+'</option>').join('')+'</select></label>'+
    '<button data-week-next '+(row.week===plan.length?'disabled':'')+'>Next →</button></div>'+
    '<div class="course-grid tm-week-grid"><article><div class="eyebrow">WEEK '+row.week+' · WEEK OF '+e(date)+'</div><h2>'+e(row.title)+'</h2><p>'+e(row.focus)+'</p>'+
    (lessons?'<h3>Assigned in this plan</h3><div class="course-actions tm-week-lessons">'+lessons+'</div>':'')+
    '</article><article><h2>Check your understanding</h2><p>'+e(row.checkpoint)+'</p>'+
    (row.sections.length?'<div class="tm-settings tm-week-settings"><label>Practice form<select data-week-form><option>A</option><option>B</option><option>C</option></select></label>'+
    '<label>Mode<select data-week-mode><option value="coached">Coached practice</option><option value="independent">Independent exam</option></select></label></div>'+
    '<p data-week-size></p><button class="primary" data-week-start>Start week '+row.week+' check</button>':'')+
    (milestoneLinks?'<div class="course-actions">'+milestoneLinks+'</div>':'')+
    '</article></div><details class="course-card"><summary>All 11 weeks at a glance</summary><ol class="tm-week-outline">'+plan.map(w=>'<li>'+link(route('week',String(w.week)),w.title)+'</li>').join('')+'</ol></details>'+
    '<details class="course-card"><summary>Where this plan comes from</summary><p>UCC publishes the course scope and term dates. Osteon estimates the weekly order and checkpoints using the OpenStax sections.</p><div class="course-actions">'+
    sources.map(s=>'<a href="'+e(s.url)+'" target="_blank" rel="noopener">'+e(s.title)+' ↗</a>').join('')+'</div></details>'+link(route(),'Mock exams & saved results'));
  root.querySelector('[data-week-jump]').onchange=ev=>go('week',ev.target.value);
  root.querySelector('[data-week-prev]').onclick=()=>go('week',String(row.week-1));
  root.querySelector('[data-week-next]').onclick=()=>go('week',String(row.week+1));
  const form=root.querySelector('[data-week-form]');
  if(!form)return;
  const scope='week-'+row.week;
  let items;
  function describe(){
    items=itemsFor(scope,form.value);
    root.querySelector('[data-week-size]').textContent=items.length+' questions · '+items.reduce((n,q)=>n+q.points,0)+' points · Drawn from the unit practice bank.';
  }
  form.onchange=describe;describe();
  root.querySelector('[data-week-start]').onclick=()=>start({scope,items,form:form.value,mode:root.querySelector('[data-week-mode]').value,
    title:'Week '+row.week+' · '+row.title+' · Form '+form.value});
}
