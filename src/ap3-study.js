import {specimenAnimations,animationForTarget} from './ap3-specimen-animations.js';
import {chapters} from './ap3-curriculum.js';
import {chapterLabs,renderLab,mountLab} from './ap3-labs.js';
import {specimens,renderSpecimen,mountSpecimen} from './ap3-specimens.js';
import figures from './ap3-figures.json' with {type:'json'};
import {springStore} from './ap3-records.js';
import {isSpringStudyRoute} from './ap3-backup.js';
import {createSpringExams} from './ap3-exams.js';
import {rememberAP3Route} from './course-home.js';
import {setTutorAssessmentMode,setLearningContext} from './learning-context.js';
import {expectedAnswer,displayAnswer} from './ap3-assessment.js';

const sections=new Map(chapters.flatMap(ch=>ch.sections.map(s=>[s.id,s])));
const byChapter=new Map(chapters.map(ch=>[String(ch.id),ch]));
const units=[
  ['Defense and exchange',[21,22]],
  ['Digestion and metabolism',[23,24]],
  ['Renal physiology and fluid balance',[25,26]],
  ['Reproduction and development',[27,28]]
];
export function initAP3({root,escape:e,toast}){
  let storage,dispose=null;
  try{storage=localStorage;}catch{}
  const store=springStore(storage,toast);
  const cleanup=fn=>{if(typeof fn==='function')dispose=fn;};
  function release(){if(dispose){const callback=dispose;dispose=null;callback();}}
  const link=(route,title,primary=false)=>'<a class="course-link'+(primary?' course-primary':'')+'" href="#'+e(route)+'">'+e(title)+'</a>';
  const go=route=>{if(location.hash==='#'+route)open(route);else location.hash=route;};
  const hero=(kicker,title,description='')=>'<header class="course-hero"><div class="eyebrow">'+e(kicker)+'</div><h1 tabindex="-1">'+e(title)+'</h1>'+(description?'<p>'+e(description)+'</p>':'')+'</header>';
  function page(content){
    release();
    const nav=[['course-3','Chapters'],['ap3-models','Model lab'],['ap3-exams','Exams & results'],['ap3-progress','My progress']];
    root.innerHTML='<div class="course-page ap2-page ap3-page"><nav class="ap2-nav" aria-label="A&P III workspace">'+nav.map(([route,label])=>link(route,label)).join('')+'</nav>'+
      (store.volatile?'<p role="status">Work is saved in this tab only. Download a backup before closing it.</p>':'')+content+'</div>';root.scrollTop=0;
  }
  const exams=createSpringExams({root,link,e,page,hero,store,go,sections,cleanup});
  const studied=id=>!!store.read('study:'+id)?.studied;
  const chapterList=ids=>'<div class="ap2-chapter-list">'+ids.map(id=>{
    const c=byChapter.get(String(id));return '<a href="#ap3-chapter-'+id+'"><b>'+id+'</b><span>'+e(c.title)+'<small>'+c.sections.filter(s=>studied(s.id)).length+' of '+c.sections.length+' sections studied</small></span><span aria-hidden="true">→</span></a>';
  }).join('')+'</div>';
  function home(){
    const resume=store.read('last')?.route, draft=store.attempts().find(r=>!r.submitted);
    page(hero('Spring · BI 233Z','Anatomy & Physiology III','Chapters 21–28 of OpenStax Anatomy and Physiology 2e.')+
      '<div class="course-actions">'+(draft?link('ap3-session-'+draft.id,'Resume '+draft.mode,true):resume?link(resume,'Continue studying',true):link('ap3-lesson-21.1','Start the lymphatic system',true))+link('ap3-search','Find a lesson')+link('atlas','Shared 3D Atlas')+'</div>'+
      '<div class="ap2-unit-grid">'+units.map(([name,ids])=>'<article class="course-card"><h2>'+e(name)+'</h2>'+chapterList(ids)+'</article>').join('')+'</div>');
  }
  function chapter(ch){
    page(hero('A&P III · Chapter '+ch.id,ch.title)+
      '<div class="course-actions">'+link('ap3-lesson-'+(ch.sections.find(s=>!studied(s.id))||ch.sections[0]).id,'Continue chapter',true)+link('ap3-lab-'+ch.id,'Physiology lab')+link('ap3-models/'+ch.id,'Interactive 3D models')+link('ap3-exams/'+ch.id,'Chapter exam & practical')+'</div>'+
      '<section class="course-card"><h2>Lessons</h2><div class="ap2-chapter-list">'+ch.sections.map(s=>'<a href="#ap3-lesson-'+s.id+'"><b>'+s.id+'</b><span>'+e(s.title)+'<small>'+e(s.objective)+'</small></span><span>'+ (studied(s.id)?'✓':'→')+'</span></a>').join('')+'</div></section>');
  }
  function lesson(s,tab='read',figure){
    const ch=byChapter.get(s.id.split('.')[0]),base='ap3-lesson-'+s.id;
    setLearningContext({course:'ap3',type:'lesson',reference:s.id,label:s.title,text:s.explanation});
    page('<div class="ap2-breadcrumb">'+link('ap3-chapter-'+ch.id,'← Chapter '+ch.id)+'<label>Section <select data-section>'+ch.sections.map(v=>'<option value="'+v.id+'" '+(v.id===s.id?'selected':'')+'>'+v.id+' · '+e(v.title)+'</option>').join('')+'</select></label></div>'+
      hero('OpenStax §'+s.id,s.title,s.objective)+
      '<nav class="ap2-tabs" aria-label="Lesson activities">'+[['read','Study'],['figures','Textbook figures'],['check','Check recall']].map(([id,label])=>'<a '+(tab===id?'aria-current="page"':'')+' href="#'+base+(id==='read'?'':'/'+id)+'">'+label+'</a>').join('')+'</nav>'+
      '<section class="course-card ap2-lesson-body" data-lesson></section><div class="ap2-lesson-footer"><button data-mark aria-pressed="'+studied(s.id)+'">'+(studied(s.id)?'✓ Studied':'Mark studied')+'</button>'+
      '<a href="'+e(s.source)+'" target="_blank" rel="noreferrer">OpenStax §'+s.id+' ↗</a><button data-tutor>Ask the tutor</button>'+
      (ch.sections.indexOf(s)<ch.sections.length-1?link('ap3-lesson-'+ch.sections[ch.sections.indexOf(s)+1].id,'Next section →'):link('ap3-exams/'+ch.id,'Chapter exam →'))+'</div>');
    const body=root.querySelector('[data-lesson]');
    root.querySelector('[data-section]').onchange=ev=>go('ap3-lesson-'+ev.target.value);
    root.querySelector('[data-mark]').onclick=ev=>{const value=!studied(s.id);store.write('study:'+s.id,{studied:value,at:Date.now()});ev.currentTarget.textContent=value?'✓ Studied':'Mark studied';ev.currentTarget.setAttribute('aria-pressed',String(value));};
    root.querySelector('[data-tutor]').onclick=()=>document.querySelector('#tutor-launch')?.click();
    if(tab==='figures'){
      const available=figures.sections[s.id],id=available.includes(figure)?figure:available[0],f=figures.figures[id],src='assets/ap3-figures/'+id+'.webp';
      body.innerHTML='<figure class="ap2-art"><div><label>Figure <select data-figure>'+available.map(n=>'<option value="'+n+'" '+(n===id?'selected':'')+'>'+n+' · '+e(figures.figures[n].title)+'</option>').join('')+'</select></label> <a href="'+src+'" target="_blank" rel="noreferrer">Open full size ↗</a></div><img src="'+src+'" alt="'+e(f.title)+'"><figcaption>Figure '+id+' · '+e(f.title)+'. OpenStax, Rice University. '+e(f.credit||'')+' <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/" target="_blank" rel="noreferrer">CC BY-NC-SA 4.0</a> · <a href="'+e(sections.get(f.section)?.source||s.source)+'" target="_blank" rel="noreferrer">Access for free at openstax.org</a>.</figcaption></figure>';
      body.querySelector('[data-figure]').onchange=ev=>go(base+'/figures/'+ev.target.value);
    }else if(tab==='check'){
      body.innerHTML='<h2>'+e(s.question)+'</h2><div class="ap2-answers">'+s.options.map((opt,i)=>'<button data-answer="'+i+'">'+e(opt)+'</button>').join('')+'</div><p role="status" data-feedback></p>';
      for(const el of body.querySelectorAll('[data-answer]'))el.onclick=()=>{
        const correct=+el.dataset.answer===s.answer;
        const prior=store.read('check:'+s.id);store.write('check:'+s.id,{firstCorrect:prior?.firstCorrect??correct,correct,at:Date.now()});
        for(const b of body.querySelectorAll('button'))b.disabled=true;
        body.querySelector('[data-answer="'+s.answer+'"]').classList.add('ap2-correct');
        body.querySelector('[data-feedback]').textContent=(correct?'Correct. ':'Expected answer · '+s.options[s.answer]+'. ')+s.why;
      };
    }else{
      body.innerHTML='<div class="ap2-lesson-text"><div><p>'+e(s.explanation)+'</p></div><aside><h2>Worked example</h2><p>'+e(s.worked)+'</p></aside></div>'+
        '<div class="course-actions">'+link('ap3-lab-'+ch.id+'/'+Math.max(0,chapterLabs[ch.id].findIndex(a=>a.section===s.id)),'Try the physiology lab')+link('ap3-models/'+ch.id,'Explore this chapter in 3D')+(s.id==='25.2'?link('ap2-lesson-15.2/activity/enteric-wall','Compare autonomic reflexes in A&P II'):'')+'</div>';
    }
  }
  function lab(ch,requested){
    const activity=Number.isInteger(Number(requested))&&chapterLabs[ch.id][Number(requested)]?Number(requested):0;
    page(hero('Chapter '+ch.id+' · Physiology lab',ch.title)+link('ap3-chapter-'+ch.id,'← Chapter '+ch.id)+'<section class="course-card ap3-lab" data-lab>'+renderLab(ch.id,activity)+'</section>');
    cleanup(mountLab(root.querySelector('[data-lab]'),ch.id,activity,setLearningContext));
    const picker=root.querySelector('[data-ap3-activity]');
    const syncTopic=()=>{
      const index=Number(picker?.value||0);
      const route='ap3-lab-'+ch.id+'/'+index;
      store.write('last',{route});rememberAP3Route(route);
    };
    picker?.addEventListener('change',syncTopic);syncTopic();
  }
  function library(ch){
    const entries=ch?specimens.filter(s=>s.chapter===ch.id):specimens;
    page(hero('A&P III','Model lab')+link('organs','Animated organ atlas')+'<label class="ap3-select">Chapter <select data-model-filter><option value="">All chapters</option>'+chapters.map(c=>'<option value="'+c.id+'" '+(c===ch?'selected':'')+'>'+c.id+' · '+e(c.title)+'</option>').join('')+'</select></label>'+
      '<div class="course-grid">'+entries.map(s=>'<article><small>Chapter '+s.chapter+' · '+e(s.kind)+'</small><h2>'+e(s.title)+'</h2><p>'+e(s.description)+'</p>'+link('ap3-specimen-'+s.id,'Open model')+'</article>').join('')+'</div>'+link('atlas','Open shared Atlas'));
    root.querySelector('[data-model-filter]').onchange=ev=>go('ap3-models'+(ev.target.value?'/'+ev.target.value:''));
  }
  function specimen(s,target){
    const choices=specimenAnimations(s),first=animationForTarget(s,target,choices)||choices[0];
    const picker=choices.length>1?'<label class="ap3-select">Organ animation <select data-specimen-motion>'+
      choices.map(v=>'<option value="'+e(v.id)+'"'+(v===first?' selected':'')+'>'+e(v.title+' · '+v.action)+'</option>').join('')+'</select></label>':'';
    const launch=first?picker+'<a class="course-link course-primary" data-open-specimen-motion href="#organs/'+e(first.id)+'">'+
      (picker?'Open animation →':e(first.action)+' →')+'</a>':link('organs','Browse organ animations');
    page(hero('Chapter '+s.chapter+' · '+s.kind,s.title)+'<div class="course-actions ap3-specimen-actions"><div class="ap3-motion-launch" data-specimen-animations>'+launch+'</div>'+
      '<button class="ap3-mobile-enlarge" data-mobile-enlarge>Expand model</button></div><div data-spring-specimen>'+renderSpecimen(s.id)+'</div><div class="course-actions">'+link('ap3-models/'+s.chapter,'← Chapter models')+link('ap3-lab-'+s.chapter,'Physiology lab')+link('atlas','Shared 3D Atlas')+'</div>');
    setLearningContext({course:'ap3',reference:s.stations?.[0]?.section||s.chapter+'.1',type:'lesson',label:s.title,text:s.description});
    const select=root.querySelector('[data-specimen-motion]'),openMotion=root.querySelector('[data-open-specimen-motion]');
    const anonymous=root.querySelector('[data-ap3-anonymous]');
    if(select)select.onchange=()=>{openMotion.setAttribute('href','#organs/'+select.value);};
    if(anonymous)anonymous.addEventListener('change',()=>{root.querySelector('[data-specimen-animations]').hidden=anonymous.checked;});
    cleanup(mountSpecimen(root.querySelector('[data-spring-specimen]'),s.id,{selected:target,onSelect:id=>{
      const match=animationForTarget(s,id,choices);
      if(select&&match&&!anonymous?.checked){select.value=match.id;openMotion.setAttribute('href','#organs/'+match.id);}
    }}));
    root.querySelector('[data-mobile-enlarge]').onclick=()=>root.querySelector('[data-spring-specimen] [data-expand]')?.click();
  }
  function search(){
    page(hero('A&P III','Find a lesson')+'<section class="course-card"><label>Topic or anatomical term<input type="search" data-find autocomplete="off" placeholder="Try nephron, alveolus or lactation"></label><div data-matches></div></section>');
    const input=root.querySelector('[data-find]'),out=root.querySelector('[data-matches]');
    function filter(){
      const words=input.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
      const matches=[...sections.values()].filter(s=>words.every(w=>[s.id,s.title,s.explanation,s.objective,s.worked].join(' ').toLowerCase().includes(w)));
      out.innerHTML='<p role="status">'+matches.length+' matching sections</p><div class="course-links">'+matches.map(s=>link('ap3-lesson-'+s.id,s.id+' · '+s.title)).join('')+'</div>';
    }input.oninput=filter;filter();input.focus({preventScroll:true});
  }
  function progress(){
    const runs=store.attempts(),completed=runs.filter(r=>r.submitted),notes=exams.notes(completed);
    page(hero('A&P III','My progress',[...sections.values()].filter(s=>studied(s.id)).length+' of '+sections.size+' sections marked studied')+
      '<section class="course-card"><h2>Saved exams & practicals</h2><div class="course-actions">'+runs.filter(r=>!r.submitted).map(r=>link('ap3-session-'+r.id,'Resume '+(r.scope==='all'?'cumulative':'Chapter '+r.scope)+' '+r.mode)).join('')+'</div>'+exams.results(completed)+'</section>'+
      '<section class="course-card"><h2>Notes from missed questions</h2>'+(notes.length?'<div class="ap2-report-list">'+notes.map(({q,r,i})=>'<details><summary>§'+q.section+' · '+e(q.prompt)+'</summary>'+exams.fieldView(q)+'<p>Your response · '+e(displayAnswer(q,r.answers[i]))+'</p><strong>'+e(expectedAnswer(q))+'</strong><p>'+e(q.why)+'</p>'+exams.reviewedModel(q)+' '+link('ap3-lesson-'+q.section,'Review lesson')+' '+link('ap3-report-'+r.id,'Original result')+'</details>').join('')+'</div>':'<p>After submission, each missed question appears here with the answer, reasoning and source lesson.</p>')+'</section>'+
      '<div class="course-actions"><button data-backup>Download spring study records</button><label class="course-link">Restore spring backup <input type="file" data-restore accept=".json,application/json"></label></div><p role="status" data-import-status></p>');
    root.querySelector('[data-restore]').onchange=async ev=>{
      const file=ev.target.files[0];if(!file)return;
      try{
        const merged=store.restore(JSON.parse(await file.text()));progress();
        root.querySelector('[data-import-status]').textContent=merged+' spring records restored. Existing submitted scores are preserved.';
      }catch(err){root.querySelector('[data-import-status]').textContent=err instanceof SyntaxError?'Choose a JSON spring study backup.':err.message;}
    };
    root.querySelector('[data-backup]').onclick=()=>{
      const url=URL.createObjectURL(new Blob([JSON.stringify(store.backup(),null,2)],{type:'application/json'})),a=document.createElement('a');
      a.href=url;a.download='osteon-ap3-study-records.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);
    };
  }
  function open(route){
    release();delete document.body.dataset.ap3Exam;setTutorAssessmentMode(null);
    setLearningContext({course:'ap3',type:'study',label:'A&P III',text:'Chapters 21–28'});
    const [name,arg,detail]=route.split('/');
    const ch=byChapter.get(name.split('-').at(-1)),s=sections.get(name.slice('ap3-lesson-'.length));
    const knownStudyPage=s||ch||specimens.some(v=>'ap3-specimen-'+v.id===name);
    if(knownStudyPage&&isSpringStudyRoute(route)){store.write('last',{route});rememberAP3Route(route);}
    if(name.startsWith('ap3-lesson-')&&s){lesson(s,arg,detail);return;}
    if(name.startsWith('ap3-chapter-')&&ch){chapter(ch);return;}
    if(name.startsWith('ap3-lab-')&&ch){lab(ch,arg);return;}
    if(name.startsWith('ap3-specimen-')){const st=specimens.find(v=>'ap3-specimen-'+v.id===name);if(st){specimen(st,arg==='target'?detail:null);return;}}
    if(name==='ap3-models'){library(byChapter.get(arg));return;}
    if(name==='ap3-exams'){exams.center(arg);return;}
    if(name.startsWith('ap3-session-')){exams.session(name.slice(12));return;}
    if(name.startsWith('ap3-report-')){exams.report(name.slice(11));return;}
    if(name==='ap3-progress'){progress();return;}
    if(name==='ap3-search'){search();return;}
    home();
  }
  document.addEventListener('viewchange',()=>{
    if(!/^#(?:course-3|ap3-)/.test(location.hash)){release();if(document.body.dataset.ap3Exam){delete document.body.dataset.ap3Exam;setTutorAssessmentMode(null);}}
  });
  root.osteonAP3=open;
}
