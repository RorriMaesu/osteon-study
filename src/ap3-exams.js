import {chapters} from './ap3-curriculum.js';
import {specimens,renderSpecimen,mountSpecimen} from './ap3-specimens.js';
import {makeAssessment,practicalLength,gradeSpring,displayAnswer,expectedAnswer} from './ap3-assessment.js';
import {pass} from './ap3-records.js';
import {mountSpringRecovery,recoveryState} from './ap3-recall.js';
import {springRecoveryCase} from './ap3-recovery-cases.js';
import {springScientificTerm} from './ap3-scientific-term.js';
import {reviewWithUI} from './answer-review-ui.js';
import {localAI} from './local-ai.js';
import {reviewMatches,reviewedCorrect} from './answer-review-data.js';
import {setLearningContext,setTutorAssessmentMode} from './learning-context.js';
const title=run=>(run.scope==='all'?'Cumulative':'Chapter '+run.scope)+(run.mode==='practical'?' practical':' exam');
const stamp=time=>new Date(time).toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'});
const score=run=>run.grades.filter(pass).length;

function wordingTarget(q){return {id:q.id,answer:q.expected,aliases:q.aliases||[],prompt:q.prompt,explanation:q.why,reference:q.section};}
// AI assesses the student's wording. The academic explanation in the report
// always comes from the original question's authored answer key.
export function springWordingVerdict(q,raw,review){
  const target=wordingTarget(q);
  if(!reviewMatches(review,target,raw))return '';
  if(review.status==='unavailable')return 'Local AI review unavailable. You can try again.';
  if(review.status==='guarded')return 'Wording did not pass the answer-key checks.';
  if(reviewedCorrect(false,review,target,raw))return review.verdict==='spelling'?'Spelling accepted by local AI':'Equivalent wording accepted by local AI';
  if(review.status==='reviewed'&&review.confidence==='high'&&review.verdict==='incorrect')return 'Local AI judged this wording incorrect.';
  return 'Local AI could not confirm the wording.';
}

export function createSpringExams({root,link,e,page,hero,store,go,sections,cleanup,mocks}){
  let pendingAI=null;
  function fieldView(q,blind=false){
    if(q.kind!=='field')return '';
    const label='OpenStax · University of Michigan Medical School',source=sections.get(q.section)?.source;
    return '<figure class="ap3-field"><img src="'+e(q.image)+'" alt="'+e(q.description)+'"><figcaption>'+label+' · <a href="'+(blind?'https://openstax.org/':e(source))+'" target="_blank" rel="noreferrer">Access for free at openstax.org</a>'+
      (blind?'':' · Figure '+e(q.figure)+' (cropped) · <a href="assets/ap3-slides/SOURCES.md" target="_blank" rel="noreferrer">Image credits and license</a>')+'</figcaption></figure>';
  }
  function reviewedModel(q){
    if(q.kind!=='surface')return '';
    return link('ap3-specimen-'+q.specimen+'/target/'+q.expected,'See the correct surface in 3D');
  }
  function results(list){
    if(!list.length)return '<p>Your submitted results will appear here.</p>';
    return '<div class="ap3-results">'+list.map(r=>link('ap3-report-'+r.id,title(r)+' · '+score(r)+'/'+r.items.length+' · '+stamp(r.submitted))).join('')+'</div>';
  }
  function center(scope='all'){
    if(scope!=='all'&&!chapters.some(c=>String(c.id)===scope))scope='all';
    const runs=store.attempts();
    page(hero('A&P III','Exams & results')+mocks.entry()+`<label class="ap3-select">Coverage <select data-scope><option value="all">All eight chapters</option>${chapters.map(ch=>'<option value="'+ch.id+'" '+(scope===String(ch.id)?'selected':'')+'>'+ch.id+' · '+e(ch.title)+'</option>').join('')}</select></label>
      <div class="course-grid">${['exam','practical'].map(mode=>{
        const draft=runs.find(r=>r.mode===mode&&r.scope===scope&&!r.submitted);
        const count=mode==='practical'?practicalLength(scope):scope==='all'?32:chapters.find(c=>String(c.id)===scope).sections.length+1;
        return '<article><h2>'+(mode==='practical'?'Lab practical':'Written exam')+'</h2><p>'+count+' questions · '+(mode==='practical'?'Identify an unlabeled surface or interpret a dataset, then predict a consequence.':'Answer chapter questions and apply what you know to a short-answer or calculation problem.')+'</p>'+
          (draft?link('ap3-session-'+draft.id,'Resume '+mode+' · '+(draft.index+1)+'/'+draft.items.length,true):'<button class="primary" data-start="'+mode+'">Start '+mode+'</button>')+'</article>';
      }).join('')}</div><section class="course-card"><h2>Submitted results</h2>${results(runs.filter(r=>r.submitted&&(scope==='all'||r.scope===scope)))}</section>`);
    root.querySelector('[data-scope]').onchange=ev=>go('ap3-exams/'+ev.target.value);
    for(const button of root.querySelectorAll('[data-start]'))button.onclick=()=>{
      const mode=button.dataset.start,latest=store.attempts().find(r=>r.scope===scope&&r.mode===mode);
      if(latest&&!latest.submitted){go('ap3-session-'+latest.id);return;}
      const items=makeAssessment(scope,mode,latest?.items||[]);
      for(const item of items)if(item.kind==='surface'){
        const s=specimens.find(v=>v.id===item.specimen);
        item.labels=Object.fromEntries(s.targets.map(t=>[t.id,t.label]));
      }
      const run=store.start(mode,scope,items);go('ap3-session-'+run.id);
    };
  }
  function session(id){
    const run=store.getRun(id);if(!run){center();return;}if(run.submitted){report(id);return;}
    const i=run.index,q=run.items[i],raw=run.answers[i];
    setTutorAssessmentMode('exam');document.body.dataset.ap3Exam='true';
    setLearningContext({course:'ap3',type:'assessment',label:title(run),text:''});
    const answered=run.answers.filter(a=>a!==null&&a!=='').length;
    const prompt='<h2 id="ap3-prompt" tabindex="-1">'+e(q.prompt)+'</h2>';
    page('<header class="ap2-exam-header"><div><div class="eyebrow">A&P III · '+e(title(run))+'</div><h1>Question '+(i+1)+' of '+run.items.length+'</h1></div>'+link('ap3-exams/'+run.scope,'Save & exit')+'</header>'+
      '<section class="course-card ap2-test">'+prompt+fieldView(q,true)+(q.options&&q.kind!=='surface'?'<div class="ap2-answers">'+q.options.map((o,n)=>'<button data-choice="'+n+'" aria-pressed="'+(String(raw)===String(n))+'">'+e(o)+'</button>').join('')+'</div>':
        q.kind==='surface'?'<div data-blind-model>'+renderSpecimen(q.specimen,{blind:true,order:q.order,selected:raw})+'</div>':
        '<label>Your answer<input data-written maxlength="180" autocomplete="off" value="'+e(raw??'')+'" placeholder="'+(q.unit?e(q.unit):'Type the anatomical term')+'"></label>')+
      '<p role="status" data-answer-status></p></section><div class="ap2-test-nav"><button data-prev '+(i===0?'disabled':'')+'>← Previous</button><button data-review>Review &amp; submit</button><button data-next '+(i===run.items.length-1?'disabled':'')+'>Next →</button></div>');
    const status=root.querySelector('[data-answer-status]');
    function updateStatus(count){status.textContent=count+' of '+run.items.length+' answered'+(q.kind==='surface'&&run.answers[i]!=null?' · Surface response saved':'');}
    updateStatus(answered);
    function save(answer){
      const changed=store.update(id,r=>{r.answers[i]=answer;});
      if(!changed||changed.submitted){go('ap3-report-'+id);return;}
      run.answers[i]=answer;updateStatus(changed.answers.filter(v=>v!==null&&v!=='').length);
    }
    for(const button of root.querySelectorAll('[data-choice]'))button.onclick=()=>{
      save(Number(button.dataset.choice));for(const b of root.querySelectorAll('[data-choice]'))b.setAttribute('aria-pressed',String(b===button));
    };
    const written=root.querySelector('[data-written]');if(written)written.oninput=()=>save(written.value);
    if(q.kind==='surface')cleanup(mountSpecimen(root.querySelector('[data-blind-model]'),q.specimen,{blind:true,order:q.order,selected:raw,onSelect:save}));
    function move(index){store.update(id,r=>{r.index=index;});session(id);root.querySelector('#ap3-prompt')?.focus({preventScroll:true});}
    root.querySelector('[data-next]').onclick=()=>move(i+1);
    root.querySelector('[data-prev]').onclick=()=>move(i-1);
    root.querySelector('[data-review]').onclick=()=>review(id);
  }
  function review(id){
    const run=store.getRun(id);if(!run||run.submitted){report(id);return;}
    const missing=run.answers.filter(v=>v===null||String(v).trim()==='').length;
    page(hero('A&P III · '+title(run),'Review & submit')+
      '<section class="course-card"><p>'+ (missing?missing+' unanswered. You can return to any question before submitting.':'Every question has a response.')+'</p><div class="course-actions ap3-jumps">'+run.items.map((q,i)=>'<button data-jump="'+i+'" aria-label="Question '+(i+1)+(run.answers[i]==null||run.answers[i]===''?', unanswered':', answered')+'">'+(i+1)+(run.answers[i]==null||run.answers[i]===''?' ○':' ✓')+'</button>').join('')+'</div><div class="course-actions"><button data-submit class="primary">Submit &amp; see result</button>'+link('ap3-exams/'+run.scope,'Save & exit')+'</div></section>');
    for(const b of root.querySelectorAll('[data-jump]'))b.onclick=()=>{store.update(id,r=>{r.index=+b.dataset.jump;});session(id);};
    root.querySelector('[data-submit]').onclick=()=>{
      store.update(id,r=>{r.grades=r.items.map((q,i)=>gradeSpring(q,r.answers[i]));r.submitted=Date.now();});go('ap3-report-'+id);
    };
  }
  function notes(runs){
    return runs.flatMap(r=>r.items.flatMap((q,i)=>pass(r.grades[i])||recoveryState(store,r,i,runs)?[]:[{r,q,i}]));
  }
  function practiceLink(r,i,completed){
    if(pass(r.grades[i]))return '';
    const status=recoveryState(store,r,i,completed);
    return status?'<span>'+e(status)+'</span>':springRecoveryCase(r.items[i])?link('ap3-recover-'+r.id+'/'+i,'Try a fresh question',true):'';
  }
  function recover(id,index){
    const r=store.getRun(id),i=Number(index);
    if(!r?.submitted||!/^\d+$/.test(index)||!r.items[i]||pass(r.grades[i])||!springRecoveryCase(r.items[i])){if(r?.submitted)report(id);else center();return;}
    const q=r.items[i];
    page(hero('A&P III · Review §'+q.section,'Practice this concept','Apply the same idea to a new question. Your submitted exam score is saved separately.')+
      '<section class="course-card" data-recovery></section><nav class="course-actions">'+link('ap3-lesson-'+q.section,'Review the lesson')+link('ap3-report-'+r.id,'Original result')+link('ap3-progress','My study notes')+'</nav>');
    mountSpringRecovery(root.querySelector('[data-recovery]'),r,i,store,e);
  }
  function wordingResult(q,raw,review){
    const label=springWordingVerdict(q,raw,review);
    if(!label)return '';
    return '<div class="answer-review-result"><strong>'+e(label)+'</strong><p class="tiny">'+(review.model?'Local model · '+e(review.model)+' · ':'')+'Original score retained.</p></div>';
  }
  function wording(r,i){
    const q=r.items[i],raw=r.answers[i];
    if(q.kind!=='name'||!String(raw??'').trim()||pass(r.grades[i]))return '';
    const saved=store.read('wording:'+r.id+':'+i);
    return '<div data-spring-review="'+i+'" aria-live="polite">'+wordingResult(q,raw,saved)+'</div><button data-wording="'+i+'">Review my wording with local AI</button>';
  }
  async function runAI(id,i){
    const r=store.getRun(id),q=r?.items[i],out=root.querySelector('[data-spring-review="'+i+'"]'),button=root.querySelector('[data-wording="'+i+'"]');
    if(!r?.submitted||q?.kind!=='name'||!out||!button)return;
    button.disabled=true;
    const raw=r.answers[i],protectedAnswer=springScientificTerm(q.expected,raw)==='incorrect'||(q.opposites||[]).some(v=>String(raw).toLowerCase().includes(v.toLowerCase()));
    try{
      const result=await reviewWithUI({target:wordingTarget(q),response:raw,strictCorrect:false,allowOverride:!protectedAnswer,root:out,enabled:true});
      if(result.review&&!result.canceled)store.write('wording:'+id+':'+i,result.review);
      if(out.isConnected)out.innerHTML=result.canceled?'Review canceled.':wordingResult(q,raw,result.review);
    }finally{button.disabled=false;}
  }
  document.addEventListener('localaistatechange',()=>{if(pendingAI&&localAI.state.ready){const {id,i}=pendingAI;pendingAI=null;if(location.hash==='#ap3-report-'+id)runAI(id,i);}});
  function report(id){
    const r=store.getRun(id);if(!r?.submitted){center();return;}
    const skills=new Map(),completed=store.attempts().filter(run=>run.submitted);
    r.items.forEach((q,i)=>{
      const skill=q.kind==='surface'?'3D identification':q.kind==='field'?'Microscopy':q.kind==='quantity'?'Calculation':q.kind==='name'?'Name recall':q.id.endsWith('/reason')?'Prediction':r.mode==='practical'?'Data interpretation':'Chapter reasoning';
      const count=skills.get(skill)||[0,0];count[0]+=Number(pass(r.grades[i]));count[1]++;skills.set(skill,count);
    });
    page(hero('A&P III · '+stamp(r.submitted),title(r)+' result',score(r)+' of '+r.items.length+' correct')+
      '<div class="ap3-scores" aria-label="Score by skill">'+[...skills].map(([skill,count])=>'<span>'+e(skill)+' <strong>'+count[0]+'/'+count[1]+'</strong></span>').join('')+'</div>'+
      '<div class="course-actions">'+link('ap3-exams/'+r.scope,'Exams & results')+link('ap3-progress','My study notes')+'</div>'+
      '<div class="ap2-report-list">'+r.items.map((q,i)=>{
        const status=r.grades[i];
        return '<details class="course-card"><summary>'+ (i+1)+'. '+e(q.prompt)+' · '+(status==='spelling'?'Correct with spelling note':pass(status)?'Correct':status==='unanswered'?'Unanswered':'Review')+'</summary>'+fieldView(q)+'<p>Your response · '+e(displayAnswer(q,r.answers[i]))+'</p><p><strong>'+(q.kind==='name'?'Standard term · ':'')+e(expectedAnswer(q))+'</strong></p><p>'+e(q.why)+'</p><div class="course-actions">'+practiceLink(r,i,completed)+reviewedModel(q)+link('ap3-lesson-'+q.section,'Review §'+q.section)+'<button data-tutor-item="'+i+'">Discuss with tutor</button></div>'+wording(r,i)+'</details>';
      }).join('')+'</div>');
    for(const b of root.querySelectorAll('[data-wording]'))b.onclick=()=>{
      const i=Number(b.dataset.wording);
      if(localAI.state.ready){runAI(id,i);return;}
      pendingAI={id,i};document.dispatchEvent(new CustomEvent('localaiopen',{detail:{returnToReview:true}}));
    };
    for(const b of root.querySelectorAll('[data-tutor-item]'))b.onclick=()=>{
      const i=+b.dataset.tutorItem,q=r.items[i];
      setLearningContext({course:'ap3',type:'review',reference:q.section,label:sections.get(q.section).title,review:{prompt:q.prompt,response:displayAnswer(q,r.answers[i]),expected:expectedAnswer(q),choices:q.options,why:q.why}});
      document.querySelector('#tutor-launch')?.click();
    };
  }
  return {center,session,report,notes,results,fieldView,reviewedModel,practiceLink,recover};
}
