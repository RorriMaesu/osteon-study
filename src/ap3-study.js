import {mountLessonFigure} from './lesson-figure.js';
import {openSpringSearch,specimenRoute,springTargetKey} from './ap3-search.js';
import {specimenAnimations,animationForTarget,specimenActivity,specimenMotionRoute} from './ap3-specimen-animations.js';
import {chapters} from './ap3-curriculum.js';
import {chapterLabs,renderLab,mountLab} from './ap3-labs.js';
import {springLessonLabs,labRoute,readLabRoute} from './ap3-lab-links.js';
import {specimens,renderSpecimen,mountSpecimen} from './ap3-specimens.js';
import figures from './ap3-figures.json' with {type:'json'};
import {springStore} from './ap3-records.js';
import {isSpringStudyRoute} from './ap3-backup.js';
import {createSpringExams} from './ap3-exams.js';
import {latestSpringDraft,mountSpringRecall} from './ap3-recall.js';
import {createTermMocks} from './term-mock.js';
import {springScopes,makeSpringMock} from './term-mock-spring.js';
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
  const mocks=createTermMocks({course:'ap3',root,page,hero,link,e,store,sections,scopes:springScopes,makeForm:makeSpringMock,toast});
  const exams=createSpringExams({root,link,e,page,hero,store,go,sections,cleanup,mocks});
  const studied=id=>!!store.read('study:'+id)?.studied;
  const chapterList=ids=>'<div class="ap2-chapter-list">'+ids.map(id=>{
    const c=byChapter.get(String(id));return '<a href="#ap3-chapter-'+id+'"><b>'+id+'</b><span>'+e(c.title)+'<small>'+c.sections.filter(s=>studied(s.id)).length+' of '+c.sections.length+' sections studied</small></span><span aria-hidden="true">→</span></a>';
  }).join('')+'</div>';
  function home(){
    const resume=store.read('last')?.route, draft=latestSpringDraft(store);
    page(hero('Spring · BI 233Z','Anatomy & Physiology III','Chapters 21–28 of OpenStax Anatomy and Physiology 2e.')+
      '<div class="course-actions">'+(draft?link(draft.route,'Resume '+draft.label,true):'')+(resume?link(resume,'Continue studying',!draft):link('ap3-lesson-21.1','Start the lymphatic system',!draft))+link('ap3-search','Search spring resources')+link('atlas','Shared 3D Atlas')+'</div>'+
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
      const entries=figures.sections[s.id].map(id=>({...figures.figures[id],id,src:'assets/ap3-figures/'+id+'.webp'}));
      const selected=Math.max(0,entries.findIndex(f=>f.id===figure));
      mountLessonFigure(body,{figures:entries,selected,section:s.id,source:sections.get(entries[selected].section)?.source||s.source,
        onSelect:i=>go(base+'/figures/'+entries[i].id)});
    }else if(tab==='check'){
      mountSpringRecall(body,s,store,e);
    }else{
      const recommendation=springLessonLabs[s.id];
      const task=labRoute(recommendation.chapter||ch.id,recommendation.activity,recommendation.settings,s.id);
      const model=specimens.find(v=>v.id===recommendation.model);
      body.innerHTML='<div class="course-actions spring-start">'+link(task,(recommendation.related?'Related practice · ':'')+recommendation.label,true)+
        (model?link('ap3-specimen-'+model.id,model.title+' · 3D'):link('ap3-models/'+ch.id,'Explore this chapter in 3D'))+
        (['21.1','23.7','24.3'].includes(s.id)?link(labRoute(23,5,{},s.id),'Track one dietary lipid across three chapters'):'')+
        (s.id==='27.2'?link(labRoute(27,4,{},s.id),'Trace the two meiotic arrests'):'')+
        (s.id==='25.2'?link('ap2-lesson-15.2/activity/enteric-wall','Compare autonomic reflexes in A&P II'):'')+'</div>'+
        '<div class="ap2-lesson-text"><div><p>'+e(s.explanation)+'</p></div><aside><h2>Worked example</h2><p>'+e(s.worked)+'</p></aside></div>';
    }
  }
  function lab(ch,requested,segments){
    const activity=Number.isInteger(Number(requested))&&chapterLabs[ch.id][Number(requested)]?Number(requested):0;
    const {settings,from}=readLabRoute(segments);
    const back=from?link('ap3-lesson-'+from,'← Return to §'+from+' · '+sections.get(from).title):link('ap3-chapter-'+ch.id,'← Chapter '+ch.id);
    const oldLab=root.querySelector('[data-lab-chapter="'+ch.id+'"]'),oldFocus=document.activeElement;
    let focusSelector;
    if(oldLab?.contains(oldFocus)){
      if(oldFocus.hasAttribute('data-ap3-activity'))focusSelector='[data-ap3-activity]';
      if(oldFocus.hasAttribute('data-ap3-route'))focusSelector='[data-ap3-route]';
      if(oldFocus.hasAttribute('data-ap3-control'))focusSelector='[data-ap3-control="'+oldFocus.dataset.ap3Control+'"]';
      if(oldFocus.hasAttribute('data-ap3-choice'))focusSelector='[data-ap3-choice]';
    }
    const scroll=oldLab?root.scrollTop:0;
    const same=oldLab?.dataset.activity===String(activity);
    const pane=same?oldLab.dataset.pane:'question',medium=same?oldLab.dataset.medium:'visual';
    page(hero('Chapter '+ch.id+' · Physiology lab',ch.title)+back+'<section class="course-card ap3-lab" data-lab data-activity="'+activity+'" data-pane="'+(pane==='evidence'?'evidence':'question')+'" data-medium="'+(medium==='table'?'table':'visual')+'" data-lab-chapter="'+ch.id+'">'+renderLab(ch.id,activity,settings)+'</section>');
    const active=labRoute(ch.id,activity,settings,from);
    if(isSpringStudyRoute(active)){store.write('last',{route:active});rememberAP3Route(active);}
    cleanup(mountLab(root.querySelector('[data-lab]'),ch.id,activity,setLearningContext,{settings,store,
      onNavigate:(index,values)=>{
        const next=labRoute(ch.id,index,values,from);
        if(location.hash!=='#'+next)go(next);
      }}));
    if(oldLab){root.scrollTop=scroll;if(focusSelector)root.querySelector(focusSelector)?.focus({preventScroll:true});}
  }
  function library(ch){
    const entries=ch?specimens.filter(s=>s.chapter===ch.id):specimens;
    page(hero('A&P III','Model lab')+link('organs','Animated organ atlas')+'<label class="ap3-select">Chapter <select data-model-filter><option value="">All chapters</option>'+chapters.map(c=>'<option value="'+c.id+'" '+(c===ch?'selected':'')+'>'+c.id+' · '+e(c.title)+'</option>').join('')+'</select></label>'+
      '<div class="course-grid">'+entries.map(s=>'<article><small>Chapter '+s.chapter+' · '+e(s.kind)+'</small><h2>'+e(s.title)+'</h2><p>'+e(s.description)+'</p>'+link('ap3-specimen-'+s.id,'Open model')+'</article>').join('')+'</div>'+link('atlas','Open shared Atlas'));
    root.querySelector('[data-model-filter]').onchange=ev=>go('ap3-models'+(ev.target.value?'/'+ev.target.value:''));
  }
  function specimen(s,target){
    const choices=specimenAnimations(s),matched=animationForTarget(s,target,choices),first=matched||choices[0];
    const motionText=(id,match,entry)=>id&&!match?'Related animation · '+entry.title+' →':choices.length>1?'Open animation →':entry.action+' →';
    const picker=choices.length>1?'<label class="ap3-select">Organ animation <select data-specimen-motion>'+
      choices.map(v=>'<option value="'+e(v.id)+'"'+(v===first?' selected':'')+'>'+e(v.title+' · '+v.action)+'</option>').join('')+'</select></label>':'';
    const activity=specimenActivity(s,target);
    const launch=activity?'<a class="course-link course-primary" data-specimen-activity href="#'+e(activity.route)+'">'+e(activity.label)+' →</a>':first?picker+'<a class="course-link course-primary" data-open-specimen-motion href="#'+e(specimenMotionRoute(first,target))+'">'+
      e(motionText(target,matched,first))+'</a>':link('organs','Browse organ animations');
    page(hero('Chapter '+s.chapter+' · '+s.kind,s.title)+'<div class="course-actions ap3-specimen-actions"><div class="ap3-motion-launch" data-specimen-animations>'+launch+'</div>'+
      '<button class="ap3-mobile-enlarge" data-mobile-enlarge>Expand model</button></div><div data-spring-specimen>'+renderSpecimen(s.id)+'</div><div class="course-actions">'+link('ap3-models/'+s.chapter,'← Chapter models')+link('ap3-lab-'+s.chapter,'Physiology lab')+link('atlas','Shared 3D Atlas')+'</div>');
    setLearningContext({course:'ap3',reference:s.stations?.[0]?.section||s.chapter+'.1',type:'lesson',label:s.title,text:s.description});
    const select=root.querySelector('[data-specimen-motion]'),openMotion=root.querySelector('[data-open-specimen-motion]');
    const anonymous=root.querySelector('[data-ap3-anonymous]');
    let selectedTarget=target;
    if(select)select.onchange=()=>{const entry=choices.find(row=>row.id===select.value);openMotion.textContent='Open animation →';openMotion.setAttribute('href','#'+specimenMotionRoute(entry,selectedTarget));};
    function rememberTarget(id){
      const route=specimenRoute(s.id,id);
      if(location.hash==='#'+route)return;
      history.replaceState(history.state,'','#'+route);store.write('last',{route});rememberAP3Route(route);
    }
    if(anonymous)anonymous.addEventListener('change',()=>{root.querySelector('[data-specimen-animations]').hidden=anonymous.checked;rememberTarget(null);});
    cleanup(mountSpecimen(root.querySelector('[data-spring-specimen]'),s.id,{selected:target,onSelect:id=>{
      if(!anonymous?.checked)rememberTarget(id);
      if(activity)root.querySelector('[data-specimen-activity]').setAttribute('href','#'+specimenActivity(s,id).route);
      const direct=animationForTarget(s,id,choices),match=direct||choices[0];
      selectedTarget=id;
      if(openMotion&&match&&!anonymous?.checked){if(select)select.value=match.id;openMotion.textContent=motionText(id,direct,match);openMotion.setAttribute('href','#'+specimenMotionRoute(match,id));}
    }}));
    root.querySelector('[data-mobile-enlarge]').onclick=()=>root.querySelector('[data-spring-specimen] [data-expand]')?.click();
  }
  function progress(){
    const runs=store.attempts(),completed=runs.filter(r=>r.submitted),notes=exams.notes(completed);
    page(hero('A&P III','My progress',[...sections.values()].filter(s=>studied(s.id)).length+' of '+sections.size+' sections marked studied')+
      mocks.entry()+
      '<section class="course-card"><h2>Saved exams & practicals</h2><div class="course-actions">'+runs.filter(r=>!r.submitted).map(r=>link('ap3-session-'+r.id,'Resume '+(r.scope==='all'?'cumulative':'Chapter '+r.scope)+' '+r.mode)).join('')+'</div>'+exams.results(completed)+'</section>'+
      '<section class="course-card"><h2>Notes from missed questions</h2>'+(notes.length?'<div class="ap2-report-list">'+notes.map(({q,r,i})=>'<details><summary>§'+q.section+' · '+e(q.prompt)+'</summary>'+exams.fieldView(q)+'<p>Your response · '+e(displayAnswer(q,r.answers[i]))+'</p><strong>'+e(expectedAnswer(q))+'</strong><p>'+e(q.why)+'</p>'+exams.practiceLink(r,i,completed)+' '+exams.reviewedModel(q)+' '+link('ap3-lesson-'+q.section,'Review lesson')+' '+link('ap3-report-'+r.id,'Original result')+'</details>').join('')+'</div>':'<p>There are no open missed questions. Submitted results retain your answers and any completed recovery practice.</p>')+'</section>'+
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
    if(mocks.open(route))return;
    const [name,arg,detail]=route.split('/');
    const ch=byChapter.get(name.split('-').at(-1)),s=sections.get(name.slice('ap3-lesson-'.length));
    const knownStudyPage=s||ch||specimens.some(v=>'ap3-specimen-'+v.id===name);
    if(knownStudyPage&&isSpringStudyRoute(route)){store.write('last',{route});rememberAP3Route(route);}
    if(name.startsWith('ap3-lesson-')&&s){lesson(s,arg,detail);return;}
    if(name.startsWith('ap3-chapter-')&&ch){chapter(ch);return;}
    if(name.startsWith('ap3-lab-')&&ch){lab(ch,arg,route.split('/').slice(2));return;}
    if(name.startsWith('ap3-specimen-')){const st=specimens.find(v=>'ap3-specimen-'+v.id===name);if(st){specimen(st,arg==='target'?st.targets.find(t=>springTargetKey(t.id)===detail)?.id:null);return;}}
    if(name==='ap3-models'){library(byChapter.get(arg));return;}
    if(name==='ap3-exams'){exams.center(arg);return;}
    if(name.startsWith('ap3-session-')){exams.session(name.slice(12));return;}
    if(name.startsWith('ap3-report-')){exams.report(name.slice(11));return;}
    if(name.startsWith('ap3-recover-')){exams.recover(name.slice(12),arg);return;}
    if(name==='ap3-progress'){progress();return;}
    if(name==='ap3-search'){openSpringSearch({root,page,hero,link,e});return;}
    home();
  }
  document.addEventListener('viewchange',()=>{
    if(!/^#(?:course-3|ap3-)/.test(location.hash)){release();if(document.body.dataset.ap3Exam){delete document.body.dataset.ap3Exam;setTutorAssessmentMode(null);}}
  });
  root.osteonAP3=open;
}
