import {courseMockStore} from './term-mock-records.js';
import {gradeTermItem,scoreTermAttempt} from './term-mock-review.js';
import {createTermReport} from './term-mock-results.js';
import {setLearningContext,setTutorAssessmentMode} from './learning-context.js';
import {renderSpecimen,mountSpecimen} from './ap3-specimens.js';

const filled=value=>Array.isArray(value)?value.every(x=>String(x??'').trim()):Boolean(String(value??'').trim());
const begun=value=>Array.isArray(value)?value.some(x=>String(x??'').trim()):filled(value);
const status=(run,q)=>filled(run.answers[q.id])?'answered':begun(run.answers[q.id])?'partly answered':'unanswered';
const date=n=>new Date(n).toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'});
const labels={choice:'Multiple choice',evidence:'Interpret evidence',short:'Short answer',written:'Written explanation'};
if(typeof window!=='undefined'&&window.visualViewport){
  const fit=()=>document.documentElement.style.setProperty('--exam-vh',Math.round(window.visualViewport.height)+'px');
  window.visualViewport.addEventListener('resize',fit);
  fit();
}
export function createTermMocks({course,root,page,hero,link,e,store,scopes,makeForm,toast}){
  const db=courseMockStore(course,store),prefix=course+'-mocks',name=course==='ap2'?'A&P II':'A&P III';
  const route=(action='',id='')=>prefix+(action?'/'+action:'')+(id?'/'+id:'');
  const go=(action,id)=>{location.hash=route(action,id);};
  const runs=()=>db.all().sort((a,b)=>(b.submitted||b.updated||b.created)-(a.submitted||a.updated||a.created));
  let releaseModel=null;
  const release=()=>{releaseModel?.();releaseModel=null;};
  function evidence(q){
    const st=q.stimulus;
    if(!st)return '';
    let html='';
    if(st.image||st.svg){
      const src=st.image||'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(st.svg);
      html+='<figure><img alt="'+e(st.alt||'Exam figure')+'" src="'+e(src)+'">'+(st.credit?'<figcaption>'+e(st.credit)+'</figcaption>':'')+'<button type="button" data-term-enlarge>Enlarge figure</button></figure>';
    }
    if(st.columns&&st.rows)html+='<div class="ap2-table-wrap"><table><thead><tr>'+st.columns.map(v=>'<th scope="col">'+e(String(v))+'</th>').join('')+'</tr></thead><tbody>'+st.rows.map(row=>'<tr>'+row.map(v=>'<td>'+e(String(v))+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';
    return html;
  }
  root.addEventListener('click',ev=>{
    const button=ev.target.closest('[data-term-enlarge]');
    if(!button||!location.hash.startsWith('#'+prefix+'/'))return;
    const panel=document.createElement('dialog'),close=document.createElement('button');
    panel.className='ap2-image-dialog';panel.setAttribute('aria-label','Enlarged exam figure');
    close.textContent='Return to question';close.onclick=()=>panel.close();
    panel.append(close,button.closest('figure').querySelector('img').cloneNode());
    document.body.append(panel);panel.onclose=()=>{panel.remove();if(button.isConnected)button.focus();};
    panel.showModal();close.focus();
  });
  const results=createTermReport({db,root,page,hero,e,link,go,route,course,name,makeForm,toast,evidence});
  function entry(){
    const list=runs(),draft=list.find(r=>!r.submitted),last=list.find(r=>r.submitted);
    return '<section class="course-card tm-entry"><div><h2>Mock exams</h2><p>Unit and cumulative forms with written feedback, study notes and retests.</p></div><div class="course-actions">'+link(route(),'Choose a mock',true)+(draft?link(route('take',draft.id),'Resume mock'):'')+(last?link(route('result',last.id),'Latest mock result'):'')+'</div></section>';
  }
  function center(){
    const list=runs();
    const openRuns=list.filter(r=>!r.submitted),done=list.filter(r=>r.submitted);
    page(hero(name+' · PRACTICE LAB','Mock exams','Choose an independent exam or use coached practice to study as you go.')+
      '<div class="course-grid"><article><h2>Start a mock</h2><div class="tm-settings"><label>Coverage<select data-tm-scope>'+scopes.map(s=>'<option value="'+e(s.id)+'">'+(s.id.startsWith('unit-')?'Ch. '+s.chapters[0]+(s.chapters.length>1?'–'+s.chapters.at(-1):'')+' · ':'')+e(s.title)+'</option>').join('')+'</select></label>'+
      '<label>Form<select data-tm-form>'+['A','B','C'].map(f=>'<option>'+f+'</option>').join('')+'</select></label>'+
      '<label>Mode<select data-tm-mode><option value="independent">Independent exam</option><option value="coached">Coached practice</option></select></label>'+
      '<label>Time goal (optional)<input type="number" data-tm-goal min="1" max="240" placeholder="Minutes"></label></div><p data-tm-size></p><button class="primary" data-tm-start>Start mock</button>'+
      '</article><article><h2>Resume a mock</h2>'+ (openRuns.length?'<div class="course-links">'+openRuns.map(r=>link(route('take',r.id),r.title+' · '+(r.index+1)+' / '+r.items.length)).join('')+'</div>':'<p>When you save and exit, your place will appear here.</p>')+
      '</article></div><section class="course-card"><h2>Saved mock results</h2>'+(done.length?'<div class="course-links">'+done.map(r=>{const s=scoreTermAttempt(r);return link(route('result',r.id),r.title+' · '+s.earned+'/'+s.possible+(s.pending?' · '+s.pending+' pending':'')+' · '+date(r.submitted));}).join('')+'</div>':'<p>Your score, written feedback and study notes appear here after submission.</p>')+'</section>'+link(course+'-exams','All exams & results'));
    const scope=root.querySelector('[data-tm-scope]'),form=root.querySelector('[data-tm-form]'),goal=root.querySelector('[data-tm-goal]');
    function describe(){root.querySelector('[data-tm-size]').textContent=scope.value==='practical'?'8 stations · 24 points':'44 questions · 60 points';}
    describe();scope.onchange=describe;
    root.querySelector('[data-tm-start]').onclick=()=>{
      if(!goal.reportValidity())return;
      const spec=scopes.find(s=>s.id===scope.value);
      try{const run=db.start({scope:spec.id,title:spec.title+' · Form '+form.value,form:form.value,mode:root.querySelector('[data-tm-mode]').value,timeGoal:Number(goal.value)||null,items:makeForm(spec.id,form.value)});
        go('take',run.id);
      }catch(error){toast(error.message);}
    };
    setLearningContext({course,type:'study',label:name+' mock exams',text:''});
  }
  function setAssessment(run,q){
    document.body.dataset[course+'Exam']='true';
    setTutorAssessmentMode(run.mode==='independent'?'exam':'practice');
    setLearningContext({course,type:'assessment',label:run.title,reference:run.mode==='coached'?q?.section:'',text:run.mode==='coached'?q?.prompt||'':''});
  }
  function field(p,i,value){
    if(p.type==='surface')return '<p data-tm-selected="'+i+'">'+surfaceLabel(p,value)+'</p><button class="tm-specimen-tab" data-tm-pane="figure">Select on specimen</button>';
    if(p.type==='choice')return '<div class="ap2-answers">'+p.choices.map((v,n)=>'<button type="button" data-tm-choice="'+n+'" data-part="'+i+'" aria-pressed="'+(value===String(n))+'"><span class="tm-letter">'+String.fromCharCode(65+n)+'</span>'+e(v)+'</button>').join('')+'</div>';
    return '<label>'+ (p.type==='number'?'Value'+(p.unit?' ('+e(p.unit)+')':''):'Your answer')+'<input data-tm-input="'+i+'" maxlength="500" autocomplete="off" value="'+e(value||'')+'"></label>';
  }
  function surfaceLabel(p,value){
    const n=p.order.indexOf(value);
    return n>=0?'You selected structure '+String.fromCharCode(65+n)+'.':'Select a surface or a lettered structure on the specimen.';
  }
  function take(run){
    if(run.submitted){go('result',run.id);return;}
    release();setAssessment(run,run.items[run.index]);
    const i=run.index,q=run.items[i],raw=run.answers[q.id],parts=q.parts||[],surface=parts.findIndex(p=>p.type==='surface');
    const visual=evidence(q)+(surface<0?'':'<p><strong>'+e(parts[surface].prompt)+'</strong></p><div data-tm-surface="'+surface+'">'+renderSpecimen(parts[surface].specimen,{blind:true})+'</div>');
    const content=q.type==='written'?'<label>Your explanation<textarea data-tm-input="-1" maxlength="3000" rows="5">'+e(raw||'')+'</textarea></label>':
      parts.length?parts.map((p,j)=>'<fieldset><legend>'+ (j+1)+'. '+e(p.prompt)+'</legend>'+field(p,j,raw?.[j])+'</fieldset>').join(''):field(q,-1,raw);
    const assisted=run.assisted[q.id];
    page('<div class="tm-frame"><header class="tm-head"><div><div class="eyebrow">'+name+' · '+(run.mode==='coached'?'COACHED PRACTICE':'INDEPENDENT MOCK')+'</div><h1>'+e(run.title)+'</h1></div>'+link(route(),'Save & exit')+'</header>'+
      '<div class="tm-tools"><label>Question <select data-tm-jump aria-label="Jump to question">'+run.items.map((it,n)=>'<option value="'+n+'" '+(n===i?'selected':'')+'>'+ (n+1)+' / '+run.items.length+' · '+status(run,it)+(run.flags[it.id]?' · flagged':'')+'</option>').join('')+'</select></label>'+
      '<button data-tm-flag aria-pressed="'+!!run.flags[q.id]+'">'+(run.flags[q.id]?'Unflag':'Flag')+'</button><span data-tm-count role="status"></span></div>'+
      '<section class="course-card tm-question"><div class="eyebrow">'+(run.scope==='practical'?'Practical station':labels[q.type])+' · '+q.points+' point'+(q.points===1?'':'s')+'</div>'+
      '<h2 tabindex="-1" data-tm-prompt>'+e(q.prompt)+'</h2>'+
      (visual?'<div class="tm-tabs"><button aria-pressed="true" data-tm-pane="figure">'+(surface>=0?'Specimen':'Evidence')+'</button><button aria-pressed="false" data-tm-pane="response">Answer</button></div>':'')+
      '<div class="tm-panes '+(visual?'has-evidence':'')+'" data-pane="figure">'+(visual?'<div class="tm-figure">'+visual+'</div>':'')+'<div class="tm-response">'+content+'</div></div>'+
      (run.mode==='coached'?'<details data-tm-help '+(assisted?'open':'')+'><summary>Study clue · counts as assistance</summary><p>'+e(q.why)+'</p></details>':'')+'</section>'+
      '<div class="tm-nav"><button data-tm-prev '+(i===0?'disabled':'')+'>← Previous</button><button data-tm-check>Review & submit</button><button class="primary" data-tm-next '+(i===run.items.length-1?'disabled':'')+'>Next →</button></div></div>');
    function live(fn){const updated=db.update(run.id,'draft',fn);if(updated?.submitted)go('result',run.id);return updated;}
    function refresh(r){
      root.querySelector('[data-tm-count]').textContent=r.items.filter(it=>filled(r.answers[it.id])).length+' / '+r.items.length+' answered'+(r.timeGoal?' · '+Math.floor((Date.now()-r.created)/60000)+' min since start / '+r.timeGoal+' min goal':'');
      const opt=root.querySelector('[data-tm-jump]').options[i];opt.text=(i+1)+' / '+r.items.length+' · '+status(r,q)+(r.flags[q.id]?' · flagged':'');
    }
    refresh(run);
    function save(j,v){const r=live(d=>{
      if(j<0)d.answers[q.id]=v;
      else{const arr=d.answers[q.id]||Array(parts.length).fill('');arr[j]=v;d.answers[q.id]=arr;}
    });if(r&&!r.submitted)refresh(r);}
    for(const b of root.querySelectorAll('[data-tm-choice]'))b.onclick=()=>{
      save(+b.dataset.part,b.dataset.tmChoice);
      for(const a of b.parentNode.querySelectorAll('[data-tm-choice]'))a.setAttribute('aria-pressed',String(a===b));
    };
    for(const input of root.querySelectorAll('[data-tm-input]'))input.oninput=()=>save(+input.dataset.tmInput,input.value);
    const disposers=[];
    if(run.timeGoal){
      const clock=setInterval(()=>{if(location.hash==='#'+route('take',run.id)&&root.querySelector('[data-tm-count]'))refresh(db.get(run.id));},30000);
      disposers.push(()=>clearInterval(clock));
    }
    if(run.mode==='coached'){
      const launcher=document.querySelector('#tutor-launch'),mark=()=>live(d=>{d.assisted[q.id]=true;});
      launcher?.addEventListener('click',mark);
      disposers.push(()=>launcher?.removeEventListener('click',mark));
    }
    for(const el of root.querySelectorAll('[data-tm-surface]')){
      const j=+el.dataset.tmSurface,p=parts[j];
      disposers.push(mountSpecimen(el,p.specimen,{blind:true,order:p.order,selected:raw?.[j],onSelect:v=>{
        save(j,v||'');root.querySelector('[data-tm-selected="'+j+'"]').textContent=surfaceLabel(p,v);
      }}));
    }
    releaseModel=()=>disposers.forEach(fn=>fn());
    for(const b of root.querySelectorAll('[data-tm-pane]'))b.onclick=()=>{
      root.querySelector('.tm-panes').dataset.pane=b.dataset.tmPane;
      for(const other of root.querySelectorAll('.tm-tabs button'))other.setAttribute('aria-pressed',String(other.dataset.tmPane===b.dataset.tmPane));
      root.querySelector('.tm-question').scrollTop=0;
      window.dispatchEvent(new Event('resize'));
    };
    const help=root.querySelector('[data-tm-help]');if(help)help.ontoggle=()=>{if(help.open&&!assisted)live(d=>{d.assisted[q.id]=true;});};
    const flag=root.querySelector('[data-tm-flag]');flag.onclick=()=>{const r=live(d=>{d.flags[q.id]=!d.flags[q.id];});if(r){flag.setAttribute('aria-pressed',String(r.flags[q.id]));flag.textContent=r.flags[q.id]?'Unflag':'Flag';refresh(r);}};
    function move(n){const r=live(d=>{d.index=n;});if(r&&!r.submitted){take(r);root.querySelector('[data-tm-prompt]')?.focus({preventScroll:true});}}
    root.querySelector('[data-tm-jump]').onchange=ev=>move(Number(ev.target.value));
    root.querySelector('[data-tm-prev]').onclick=()=>move(i-1);root.querySelector('[data-tm-next]').onclick=()=>move(i+1);
    root.querySelector('[data-tm-check]').onclick=()=>go('check',run.id);
  }
  function check(run){
    if(run.submitted){go('result',run.id);return;}
    setAssessment(run);
    const count=run.items.filter(q=>filled(run.answers[q.id])).length,flagged=Object.values(run.flags).filter(Boolean).length;
    page(hero(name+' · '+run.title,'Ready to submit?',count+' of '+run.items.length+' fully answered · '+flagged+' flagged. You can revisit any question before locking your answers.')+
      '<div class="course-card tm-map">'+run.items.map((q,i)=>'<button data-tm-locate="'+i+'" aria-label="Question '+(i+1)+', '+status(run,q)+(run.flags[q.id]?', flagged':'')+'">'+(i+1)+' '+(run.flags[q.id]?'⚑':filled(run.answers[q.id])?'✓':begun(run.answers[q.id])?'◐':'○')+'</button>').join('')+'</div><div class="course-actions">'+link(route('take',run.id),'Keep working')+'<button class="primary" data-tm-submit>Submit & see results</button></div>');
    for(const b of root.querySelectorAll('[data-tm-locate]'))b.onclick=()=>{db.update(run.id,'draft',d=>{d.index=+b.dataset.tmLocate;});go('take',run.id);};
    root.querySelector('[data-tm-submit]').onclick=()=>{
      db.update(run.id,'draft',d=>{d.grades=Object.fromEntries(d.items.map(q=>[q.id,gradeTermItem(q,d.answers[q.id])]));d.submitted=Date.now();});
      go('result',run.id);
    };
  }
  function open(path){
    release();
    if(path.split('/')[0]!==prefix)return false;
    const [,action,id]=path.split('/');
    const run=id&&db.get(id);
    if(!action)center();
    else if(!run)page(hero(name,'Attempt unavailable','This browser has no saved mock at this address.')+link(route(),'Mock exams & results'));
    else if(action==='take')take(run);
    else if(action==='check')check(run);
    else if(action==='result'&&run.submitted)results.show(id);
    else center();
    return true;
  }
  document.addEventListener('viewchange',()=>{if(!location.hash.startsWith('#'+prefix+'/take/'))release();});
  return {entry,open};
}
