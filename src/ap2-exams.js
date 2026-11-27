import {checkQuantity} from './ap2-quantities.js';
import {snapshotWriting,examWriting,writingResults} from './ap2-writing-ui.js';
import {chapters,sectionById} from './ap2-library.js';
import {bank,examScopes,examItems,submitDraft,score,correctGrade,expectedAnswer} from './ap2-exam-core.js';
import {rememberAP2Route} from './course-home.js';
import {bindStudyBackups} from './study-backup.js';
import {localAI} from './local-ai.js';
import {reviewWithUI,reviewHTML} from './answer-review-ui.js';
import {setLearningContext} from './learning-context.js';

export function createExamScreens({root,page,hero,link,store,e,dialog,toast}){
  const date=n=>new Date(n).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'});
  let pendingAI=null;
  const label=g=>({correct:'Correct',spelling:'Correct · spelling to review',pending:'Meaning needs review',incorrect:'Review this concept',blank:'Unanswered'})[g];
  const go=route=>{location.hash=route;};
  const context=(title,text='')=>setLearningContext({course:'ap2',type:'study',label:title,text});
  const navReport=r=>link('ap2-report-'+r.id,date(r.submitted)+' · '+r.title+' · '+score(r).correct+'/'+r.items.length);
  function begin(scope,title,items) {
    const data=store.update(r=>{if(r.draft)return;
      r.draft={id:crypto.randomUUID(),scope,title,started:Date.now(),items,index:0,responses:{},writing:snapshotWriting(items)};r.resume='ap2-session';});
    if(data.draft)go('ap2-session');
  }
  function center(scope){
    const selection=examScopes.find(s=>s.id===scope)||examScopes[0],r=store.read();
    page(hero('A&P II · PRACTICE LAB','Exams & results','Chapter exams sample every section. Unit and cumulative exams mix topics, visual interpretation, and short answers.')+
      (r.draft?`<div class="course-card ap2-draft"><strong>Saved exam · ${e(r.draft.title)}</strong>${link('ap2-session','Resume at question '+(r.draft.index+1),true)}</div>`:'')+
      `<div class="course-grid"><article><h2>Take an exam</h2><label for="ap2-exam-scope">Choose coverage</label><select id="ap2-exam-scope">${examScopes.map(s=>`<option value="${s.id}" ${s===selection?'selected':''}>${e(s.title)}</option>`).join('')}</select>
      <p id="ap2-exam-size"></p><button class="primary" data-start ${r.draft?'disabled':''}>Start exam</button>${r.draft?'<p>Submit your current A&P II draft to start another. You can study lessons at any time.</p>':''}</article>
      <article><h2>Completed exams</h2>${r.reports.length?`<div class="course-links">${r.reports.map(navReport).join('')}</div>`:'<p>Your submitted scores, answers, and review notes will appear here.</p>'}</article></div>`);
    const select=root.querySelector('#ap2-exam-scope');
    function describe(){root.querySelector('#ap2-exam-size').textContent=examItems(select.value).length+' questions · untimed · saved on this device';}
    select.onchange=describe;describe();
    root.querySelector('[data-start]').onclick=()=>{const spec=examScopes.find(s=>s.id===select.value);begin(spec.id,spec.title,examItems(spec.id));};
    context('A&P II exam center');
  }
  function stimulus(q){
    // Saved attempts retain the original stimulus. SVGs render as inert images.
    const st=q.stimulus;if(!st)return '';
    if(st.svg)return `<figure class="ap2-stimulus"><img alt="${e(st.alt||'Question diagram')}" src="data:image/svg+xml;charset=utf-8,${encodeURIComponent(st.svg)}"></figure>`;
    if(st.columns&&st.rows)return `<div class="ap2-table-wrap"><table><thead><tr>${st.columns.map(c=>'<th scope="col">'+e(c)+'</th>').join('')}</tr></thead><tbody>${st.rows.map(row=>'<tr>'+row.map(c=>'<td>'+e(c)+'</td>').join('')+'</tr>').join('')}</tbody></table></div>`;
    return '';
  }
  function session(){
    const s=store.read().draft;
    if(!s){center();return;}
    rememberAP2Route('ap2-session');
    const q=s.items[s.index], value=s.responses[q.id]??'';
    const savedCount=()=>Object.values(store.read().draft?.responses||{}).filter(v=>v.trim()).length;
    page(`<div class="ap2-exam-header"><div><div class="eyebrow">A&P II · INDEPENDENT EXAM</div><h1>${e(s.title)}</h1></div>${link('ap2-exams','Save & exit')}</div>
    <section class="course-card ap2-test"><div class="ap2-question-meta"><label>Question <select aria-label="Jump to exam question" data-jump>${s.items.map((it,i)=>`<option value="${i}" ${s.index===i?'selected':''}>${i+1} / ${s.items.length}${s.responses[it.id]?.trim()?' · answered':''}</option>`).join('')}</select></label><span data-saved role="status">${savedCount()} answered</span></div>
    <h2>${e(q.prompt)}</h2>${stimulus(q)}${q.choices?`<div class="ap2-answers" role="group" aria-label="Answer choices">${q.choices.map((a,i)=>`<button data-answer="${i}" aria-pressed="${value===String(i)}">${e(a)}</button>`).join('')}</div>`:
    `<label>${q.type==='number'?'Numerical answer'+(q.unit?' · '+e(q.unit)+' or equivalent units':''):'Anatomical term'}<input data-typed autocomplete="off" maxlength="500" ${q.type==='number'?'inputmode="text"':''} value="${e(value)}"></label>`}<div data-writing-place></div></section>
    <div class="ap2-test-nav"><button data-prev ${s.index?'':'disabled'}>← Previous</button><button data-next ${s.index===s.items.length-1?'disabled':''}>Next →</button><button class="primary" data-submit>Review & submit</button></div>`);
    function update(fn){return store.update(r=>{if(r.draft?.id===s.id)fn(r.draft);});}
    examWriting(root,s,update,e);
    function answer(v){update(d=>{d.responses[q.id]=v;});root.querySelector('[data-saved]').textContent=savedCount()+' answered'+(store.volatile?' · in this tab':' · saved');}
    for(const b of root.querySelectorAll('[data-answer]'))b.onclick=()=>{
      answer(b.dataset.answer);for(const a of root.querySelectorAll('[data-answer]'))a.setAttribute('aria-pressed',String(a===b));};
    const input=root.querySelector('[data-typed]');if(input)input.oninput=()=>answer(input.value);
    function jump(n){update(d=>{d.index=n;});session();}
    root.querySelector('[data-jump]').onchange=ev=>jump(Number(ev.target.value));
    root.querySelector('[data-prev]').onclick=()=>jump(s.index-1);root.querySelector('[data-next]').onclick=()=>jump(s.index+1);
    root.querySelector('[data-submit]').onclick=()=>{
      const blank=s.items.length-savedCount();
      dialog(`<h2>Submit this exam?</h2><p>${s.items.length-blank} of ${s.items.length} answered. ${blank?blank+' unanswered will be recorded.':'All questions have an answer.'}</p><div class="course-actions"><button data-return-exam>Keep working</button><button class="primary" data-confirm-exam>Submit and see results</button></div>`);
      const d=document.querySelector('#info-dialog');
      d.querySelector('[data-return-exam]').onclick=()=>d.close();
      d.querySelector('[data-confirm-exam]').onclick=()=>{store.update(r=>submitDraft(r,s.id));d.close();go('ap2-report-'+s.id);};
    };
    context('Independent A&P II exam');
  }
  function report(id,onlyReview=false){
    const data=store.read(),r=data.reports.find(x=>x.id===id);
    if(!r){page(hero('A&P II','Result unavailable','This browser has no saved report at this address.')+link('ap2-exams','Exams & results'));return;}
    rememberAP2Route('ap2-report-'+r.id);
    const result=score(r),weak=r.items.filter(q=>r.grades[q.id]!=='correct'),pending=r.items.filter(q=>r.grades[q.id]==='pending').length;
    const included=onlyReview?weak:r.items;
    page(hero('A&P II · SAVED RESULT',r.title,date(r.submitted))+
    `<div class="course-card ap2-report-head"><strong>${result.correct} / ${r.items.length} points earned</strong>${pending?`<p>${pending} response(s) need a meaning review. The original score is saved.</p>`:''}
    <div class="course-actions"><label class="ap2-choice"><input type="checkbox" data-missed ${onlyReview?'checked':''}> Review missed answers and spelling only</label>
    ${weak.length&&!data.draft?'<button data-retry>Practice these questions again</button>':''}${data.draft?link('ap2-session','Resume active draft'):''}</div></div>
    ${writingResults(r.writing,e)}<div class="ap2-report-list">${included.map(q=>{
      const g=r.grades[q.id],v=r.responses[q.id]||'',given=q.choices&&v!==''?q.choices[Number(v)]:v;
      const reviewed=r.ai?.[q.id];
      const quantity=q.type==='number'&&v&&g==='incorrect'?checkQuantity(q,v):null;
      const unitNote=quantity?.correct?'The current grader accepts this equivalent quantity. Your original exam score is preserved.':quantity?.reason;
      return `<details class="course-card" ${onlyReview&&included.length===1?'open':''}><summary><b>${e(label(g))}</b> · §${e(q.section)} · ${e(q.prompt)}</summary>
      ${stimulus(q)}<p>Your answer · ${e(given||'Unanswered')}</p>${unitNote?'<p>'+e(unitNote)+'</p>':''}<p><strong>Answer · ${e(expectedAnswer(q))}</strong></p><p>${e(q.why)}</p>
      <div class="course-actions">${link('ap2-lesson-'+q.section,'Review §'+q.section)}<button data-ask="${e(q.id)}">Ask the tutor</button>${q.type==='term'&&v?`<button data-ai="${e(q.id)}">Review wording with Ollama</button>`:''}</div>
      <div data-review-for="${e(q.id)}">${reviewed?reviewHTML(reviewed):''}</div></details>`;
    }).join('')||'<p>All answers were correct.</p>'}</div>`);
    root.querySelector('[data-missed]').onchange=ev=>report(id,ev.target.checked);
    const retry=root.querySelector('[data-retry]');if(retry)retry.onclick=()=>begin('retry','Review · '+r.title.replace(/^(Review · )+/,''),weak);
    for(const b of root.querySelectorAll('[data-ask]'))b.onclick=()=>{
      const q=r.items.find(it=>it.id===b.dataset.ask),sec=sectionById.get(q.section);
      setLearningContext({course:'ap2',type:'lesson',label:sec?.title||'Review missed question',reference:q.section,text:q.prompt+' '+q.why});
      document.querySelector('#tutor-launch')?.click();
    };
    for(const b of root.querySelectorAll('[data-ask]'))b.onclick=()=>{
      const q=r.items.find(it=>it.id===b.dataset.ask),v=r.responses[q.id]||'';
      const given=q.choices&&v!==''?q.choices[Number(v)]:v;
      setLearningContext({course:'ap2',type:'review',label:'Exam review · '+sectionById.get(q.section).title,reference:q.section,text:q.why,
        review:{prompt:q.prompt,choices:q.choices,expected:expectedAnswer(q),response:given||'Unanswered',why:q.why}});
      document.querySelector('#tutor-launch')?.click();
    };
    for(const b of root.querySelectorAll('[data-ai]'))b.onclick=()=>{
      const q=r.items.find(it=>it.id===b.dataset.ai);
      if(localAI.state.ready){runAI(id,q);return;}
      pendingAI={id,q};document.dispatchEvent(new CustomEvent('localaiopen',{detail:{returnToReview:true}}));
      toast('Choose a local model. Answer review will start when it is ready.');
    };
    context('A&P II submitted exam',r.title);
  }
  async function runAI(id,q){
    const r=store.read().reports.find(s=>s.id===id);
    const output=root.querySelector('[data-review-for="'+q.id+'"]');
    if(!output||!r)return;
    const b=root.querySelector('[data-ai="'+q.id+'"]');if(b)b.disabled=true;
    const target={id:q.id,answer:q.expected,aliases:q.aliases||[],prompt:q.prompt,explanation:q.why,reference:q.section};
    const result=await reviewWithUI({target,response:r.responses[q.id],strictCorrect:correctGrade(r.grades[q.id]),root:output,allowOverride:q.section!=='18.6',enabled:true});
    if(result.review&&!result.canceled){
      store.update(s=>{const report=s.reports.find(v=>v.id===id);if(report){report.ai||={};report.ai[q.id]=result.review;}});
    }
    if(output.isConnected)output.innerHTML=result.canceled?'Review canceled.':reviewHTML(result.review);
    if(b)b.disabled=false;
  }
  document.addEventListener('localaistatechange',()=>{if(pendingAI&&localAI.state.ready){const job=pendingAI;pendingAI=null;if(location.hash==='#ap2-report-'+job.id)runAI(job.id,job.q);}});
  function progress(){
    const r=store.read(),answers=Object.values(r.checks);
    const next=sectionsToRevisit(r);
    page(hero('A&P II · STUDY STUDIO','My progress','Track section review, recall practice, and independent exams separately.')+
    `<div class="course-actions">${link('ap2-exams','Exams & results')}${r.draft?link('ap2-session','Resume exam',true):''}<details class="ap2-backup"><summary>Back up or restore both courses</summary><button data-export-study>Back up all study work</button><label>Restore backup <input type="file" data-import-study accept="application/json,.json"></label><p role="status" data-backup-status></p></details></div>
    <div class="course-grid"><article><h2>Study record</h2><p>${Object.keys(r.studied).length} / 49 sections marked studied · ${answers.filter(a=>a.correct).length} recall questions last answered correctly · ${r.reports.length} exams submitted.</p><h2>Study next</h2>${next?link('ap2-lesson-'+next.id+'/check','Practice §'+next.id+' · '+next.title):'<p>You have checked every section.</p>'}</article>
    <article><h2>Results and review notes</h2><div class="course-links">${r.reports.map(navReport).join('')||'<p>Submit an exam to see its results here.</p>'}</div></article></div>
    <section class="course-card"><h2>By chapter</h2><div class="ap2-chapter-list">${chapters.map(ch=>{
      const ids=new Set(ch.sections.map(s=>s.id)),checked=answers.filter(a=>ids.has(a.section)),all=bank.filter(q=>ids.has(q.section)&&q.type==='choice');
      return `<a href="#ap2-chapter-${ch.id}"><b>${ch.id}</b><span>${e(ch.title)}<small>${ch.sections.filter(s=>r.studied[s.id]).length}/${ch.sections.length} studied · ${checked.filter(a=>a.correct).length}/${all.length} recall questions correct</small></span><span>→</span></a>`;
    }).join('')}</div></section>`);
    bindStudyBackups(root,{dialog,toast,escape:e,getAP2Records:()=>store.read()});context('A&P II progress');
  }
  function sectionsToRevisit(r) {
    const latest=new Map();
    for(const report of [...r.reports].sort((a,b)=>a.submitted-b.submitted)){
      for(const q of report.items)latest.set(q.id,{section:q.section,correct:correctGrade(report.grades[q.id]),at:report.submitted});
    }
    for(const [id,check] of Object.entries(r.checks))if(check.at>=(latest.get(id)?.at||0))latest.set(id,check);
    const missed=[...latest.values()].filter(a=>!a.correct).sort((a,b)=>b.at-a.at)[0];
    if(missed)return sectionById.get(missed.section);
    return [...sectionById.values()].find(s=>s.questions.some((_,i)=>!r.checks['ap2-'+s.id+'-q'+(i+1)]?.correct));
  }
  function open(route){
    if(!route.startsWith('ap2-report-'))pendingAI=null;
    if(route==='ap2-session')session();
    else if(route==='ap2-progress')progress();
    else if(route.startsWith('ap2-report-'))report(route.slice('ap2-report-'.length));
    else if(route==='ap2-exams'||route.startsWith('ap2-exams/'))center(route.split('/')[1]);
    else return false;
    return true;
  }
  return {open};
}
