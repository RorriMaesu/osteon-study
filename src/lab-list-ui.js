import {labListSource,labScopes,listEntries,listQuestions,listStats,listQuestionById,entryStatus,LAB_TEST_KEY,validLabRun,makeLabRun,labRunSummary} from './lab-list.js';
import {shuffle} from './storage.js';
import {setLearningContext} from './learning-context.js';

export function initLabList({viewer,setView,selectTerm,precision,toast,escape:e}){
 const $=s=>document.querySelector(s);
 let scope='all',length='all',order='source',query='',page=0,screen=null,onlyMissed=false,current=null,history=[],persistent=true;
 try{const saved=JSON.parse(localStorage.getItem(LAB_TEST_KEY)||'null');if(validLabRun(saved?.current))current=saved.current;history=(Array.isArray(saved?.history)?saved.history:[]).filter(validLabRun).slice(-8);}catch{}
 const perPage=()=>matchMedia('(min-width:1000px)').matches&&innerHeight<680?4:6;
 const scopeName=s=>labScopes.find(([id])=>id===s)?.[1]||s;
 function save(){try{localStorage.setItem(LAB_TEST_KEY,JSON.stringify({current,history}));}catch{persistent=false;toast('This browser could not save the bone-list test. Keep this tab open and export your results when you finish.');}}
 function shell(title,sub,body){
  document.body.dataset.precisionActive='true';document.body.dataset.labListActive=screen;setView('practice');
  $('#practice-view').innerHTML=`<div class="section-intro"><div><div class="eyebrow">BI 231 / YOUR REQUIRED BONE LIST</div><h1>${title}</h1><p>${sub}</p></div><button id="lab-list-exit">Practice menu ↗</button></div>${body}`;
  $('#lab-list-exit').onclick=()=>{precision.stop();screen=null;delete document.body.dataset.labListActive;document.dispatchEvent(new Event('practicehome'));};
 }
 function home(){
  precision.stop();screen='home';const s=listStats(scope),active=current&&!labRunSummary(current).complete;
  setLearningContext({type:'practice',label:'BI 231 · required bone-list checklist'});
  shell('Your exact <em>bone list.</em>','Checked against the supplied BI 231 Lab 6 and 7 document. Choose a scope, then name every target.',`
   <div class="lab-list-layout">
    <section class="learning-panel lab-test-settings" aria-label="Bone list test setup">
     <div class="lab-test-controls"><label>Test scope<select id="lab-list-scope">${labScopes.map(([id,label])=>`<option value="${id}" ${id===scope?'selected':''}>${label}</option>`).join('')}</select></label><label>Length<select id="lab-list-length"><option value="all" ${length==='all'?'selected':''}>Full test · ${s.questions}</option>${[10,20].map(n=>`<option value="${n}" ${length===String(n)?'selected':''}>${n} questions</option>`).join('')}</select></label><label>Order<select id="lab-list-order"><option value="source" ${order==='source'?'selected':''}>Source order</option><option value="random" ${order==='random'?'selected':''}>Random order</option></select></label><button class="primary" id="lab-list-start" ${viewer.loaded?'':'disabled'}>Start ${length==='all'?s.questions:Math.min(+length,s.questions)}-question test ↗</button>${active?`<button id="lab-list-resume" ${viewer.loaded?'':'disabled'}>Continue · ${current.results.length}/${current.questionIds.length} answered</button>`:current?'<button id="lab-list-last">Last test results ↗</button>':''}</div>
     <p class="tiny lab-test-summary">${s.entries} checklist entries · ${s.spatial} with 3D targets · ${s.movement} movement questions · ${s.sourceRecall} source-recall questions · ${s.counts} count blanks. ${scope==='all'?'Repeated sacrum/coccyx entries are tested once.':scope==='lab7'?'Includes the repeated sacrum and coccyx; excludes the four shoulder muscle-test ligaments.':scope==='shoulder'?'The document assigns these four ligaments to the muscle test.':''}</p>
     <p class="tiny lab-test-notice">${active?`Saved test: ${e(scopeName(current.scope))}. Starting a new test replaces its unfinished queue; submitted attempts remain in your learning history. `:''}${s.sourceRecall?'Two list entries retain a 3D accuracy hold: fontanelles and individual ethmoid drainage openings. They receive source recall, not a guessed spatial score.':'Hints and source help are recorded as assistance.'} ${persistent?'Answers and cues save automatically on this browser.':'Saving is unavailable; keep this tab open to finish and export.'}</p>
    </section>
    <section class="lab-checklist-panel" aria-label="Required structures checklist"><div class="lab-checklist-toolbar"><label for="lab-list-search">Find a required item · checklist only</label><input id="lab-list-search" type="search" placeholder="Name or wording from the document" value="${e(query)}"><a href="BONE-LIST-REVIEW.md" target="_blank">Review report ↗</a><a href="BONE-LIST-CHECKLIST.csv" download>Checklist CSV ↓</a></div><div id="lab-list-items" class="lab-list-items"></div><nav id="lab-list-pages" class="lab-list-pages" aria-label="Required checklist pages"></nav></section>
   </div>`);
  $('#lab-list-scope').onchange=ev=>{scope=ev.target.value;query='';page=0;home();};$('#lab-list-length').onchange=ev=>{length=ev.target.value;home();};$('#lab-list-order').onchange=ev=>{order=ev.target.value;};
  $('#lab-list-search').oninput=ev=>{query=ev.target.value;page=0;renderChecklist();};
  $('#lab-list-start').onclick=()=>{let qs=listQuestions(scope);if(order==='random')qs=shuffle(qs);begin(scope,qs.slice(0,length==='all'?qs.length:+length).map(t=>t.id));};
  if($('#lab-list-resume'))$('#lab-list-resume').onclick=()=>run(current);
  if($('#lab-list-last'))$('#lab-list-last').onclick=resultsPage;
  renderChecklist();
 }
 function paginate(rows,render){
  const n=perPage(),pages=Math.max(1,Math.ceil(rows.length/n));page=Math.min(page,pages-1);
  $('#lab-list-items').style.setProperty('--lab-rows',n);$('#lab-list-items').innerHTML=rows.slice(page*n,(page+1)*n).map(render).join('')||'<p>No matching entries. Try another anatomical name or source phrase.</p>';
  $('#lab-list-pages').innerHTML=`<button id="lab-list-prev" ${page?'':'disabled'} aria-label="Previous checklist page">←</button><label for="lab-list-page" class="sr-only">Checklist page</label><select id="lab-list-page">${Array.from({length:pages},(_,i)=>`<option value="${i}" ${i===page?'selected':''}>${i+1} / ${pages}</option>`).join('')}</select><span>${rows.length} ${screen==='results'?(rows.length===1?'result':'results'):(rows.length===1?'entry':'entries')}</span><button id="lab-list-next" ${page<pages-1?'':'disabled'} aria-label="Next checklist page">→</button>`;
  const refresh=()=>screen==='results'?renderResults():renderChecklist();
  $('#lab-list-prev').onclick=()=>{page--;refresh();};$('#lab-list-next').onclick=()=>{page++;refresh();};$('#lab-list-page').onchange=ev=>{page=+ev.target.value;refresh();};
  document.querySelectorAll('[data-lab-study]').forEach(b=>b.onclick=()=>study(b.dataset.labStudy));
 }
 function renderChecklist(){
  const q=query.toLowerCase().trim();const entries=listEntries(scope).filter(({term:t,rows})=>!q||[t.name,...t.aliases,...rows.map(r=>r.sourceLabel),...rows.map(r=>r.section)].some(x=>x.toLowerCase().includes(q)));
  paginate(entries,({term:t,rows})=>`<article class="lab-list-row"><div><strong>${e(t.name)}</strong><small>${e(t.region)}</small></div><div><span>${e(rows[0].sourceLabel)}</span><small>${e(rows.map(r=>r.lab+' · '+r.section).join(' / '))}</small></div><span class="lab-list-status ${t.representation.assessment==='learn-only'?'hold':''}">${e(entryStatus(t))}</span><button data-lab-study="${t.id}" ${viewer.loaded?'':'disabled'}>Study ↗</button></article>`);
 }
 function study(id){
  const t=listQuestionById.get(id);if(!t)return;precision.stop();screen=null;delete document.body.dataset.labListActive;
  if(t.type==='count')document.dispatchEvent(new CustomEvent('openreader',{detail:'7.3'}));else{setView('atlas');selectTerm(listEntries().find(x=>x.term.id===id).term);}
 }
 function archiveCurrent(){if(current&&labRunSummary(current).complete&&!history.some(r=>r.startedAt===current.startedAt&&JSON.stringify(r.questionIds)===JSON.stringify(current.questionIds)))history=[...history,current].slice(-8);}
 function begin(runScope,ids){archiveCurrent();current=makeLabRun(runScope,ids);save();run(current);}
 function run(data){
  if(!validLabRun(data)||!viewer.loaded)return;current=data;screen='test';document.body.dataset.labListActive='test';
  const questions=data.questionIds.map(id=>listQuestionById.get(id));
  precision.startListTest({questions,run:data,onCheckpoint:update=>{current={...current,...update};save();},onExit:()=>{page=0;home();},onFinish:()=>{archiveCurrent();save();page=0;onlyMissed=false;resultsPage();}});
 }
 function resultsPage(){
  if(!validLabRun(current))return home();precision.stop();screen='results';const s=labRunSummary(current),available=listQuestions(current.scope).length;
  const completeCoverage=s.total===available&&s.complete;
  shell('Your checklist, <em>tested.</em>',`${e(scopeName(current.scope))} · ${s.answered} of ${s.total} selected questions answered. ${completeCoverage?'Every question in this scope was included.':`This run covers ${s.total} of ${available} available questions in this scope.`}`,`
    <div class="lab-list-layout"><section class="learning-panel lab-test-settings"><div class="lab-result-score"><strong>${s.independent}/${s.total}</strong><span>independently correct</span><span>${s.assisted} assisted · ${s.review.length} to revisit</span></div><div class="control-row"><button class="primary" id="lab-list-retry" ${s.review.length?'':'disabled'}>Retry ${s.review.length} missed / assisted ↗</button><button id="lab-list-home">Back to checklist</button><button id="lab-list-export">Export test results ↓</button><label class="check-line"><input id="lab-list-missed" type="checkbox" ${onlyMissed?'checked':''}> Show only missed / assisted</label></div><p class="tiny">3D naming, source recall, movement reasoning and counts are distinguished below. Cued answers do not count as independently correct. This is practice evidence, not a claim of mastery.</p></section><section class="lab-checklist-panel" aria-label="Bone list test results"><div id="lab-list-items" class="lab-list-items"></div><nav id="lab-list-pages" class="lab-list-pages" aria-label="Test result pages"></nav></section></div>`);
  $('#lab-list-retry').onclick=()=>begin(current.scope,s.review);$('#lab-list-home').onclick=()=>{page=0;home();};$('#lab-list-export').onclick=()=>download(JSON.stringify({source:labListSource.source,current,history},null,2),'osteon-bone-list-results.json','application/json');$('#lab-list-missed').onchange=ev=>{onlyMissed=ev.target.checked;page=0;renderResults();};renderResults();
 }
 function renderResults(){
  const rows=current.results.filter(r=>!onlyMissed||!r.correct||r.assisted);
  paginate(rows,r=>{const t=listQuestionById.get(r.id);return `<article class="lab-list-row"><div><strong>${e(t.testLabel||t.name)}</strong><small>${e(t.region)}</small></div><div><span>${e(r.response)}</span><small>${e(t.listRecall?.kind||entryStatus(t))}</small></div><span class="lab-list-status ${!r.correct||r.assisted?'hold':''}">${r.assisted?'Assisted':r.correct?'Correct':'Review again'}</span><button data-lab-study="${r.id}" ${viewer.loaded?'':'disabled'}>Study ↗</button></article>`;});
 }
 function download(text,name,type){const blob=new Blob([text],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 document.addEventListener('lablist',()=>{page=0;home();});
 document.addEventListener('anatomyready',()=>{if(screen==='home'&&$('#practice-view').classList.contains('active')&&document.body.dataset.labListActive==='home')home();});
 document.addEventListener('viewchange',ev=>{if(ev.detail!=='practice'){screen=null;delete document.body.dataset.labListActive;}});
 let resizeQueued=false;window.addEventListener('resize',()=>{if(resizeQueued)return;resizeQueued=true;requestAnimationFrame(()=>{resizeQueued=false;if(screen==='home')renderChecklist();else if(screen==='results')renderResults();});});
 return {home};
}
