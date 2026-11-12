import {lessons} from './learning-data.js';
import {newTutorSession,tutorSessionInstruction,completeTutorTurn} from './tutor-session.js';
import { getLearningContext } from './learning-context.js';
import { sanitizeConversation, citationParts, CHAT_LIMIT } from './tutor-state.js';
import { checkTutorReply } from './tutor-checks.js';
import { endpoints, localModelProblem } from './ollama-client.js';
import { detectOS, browserHardware, validateHardware, mergeBrowserHardware, memoryValues, downloadModels, recommendedDownload } from './hardware.js';
import { buildTutorMessages } from './tutor-context.js';
import { localAI, assistantReturn } from './local-ai.js';
import { setupScreen } from './local-ai-setup.js';
const CHAT_KEY='osteon-tutor-chat-v1', DRAFT_KEY='osteon-tutor-draft-v1', HARDWARE_KEY='osteon-tutor-device-v1';
function initTutor({escape:e,toast}) {
  const $=s=>document.querySelector(s);
  let client=localAI.client, connected=false, choice=localAI.state.model, models=[], tab='guide', busy=false, controller=null, job=null;
  let context=getLearningContext(), hardware={}, os=detectOS(), chat=[], draft='', lastFocus=null;
  let guided=null,guideSection='',guidePrompt='recall',guideReveal='',useDiagramGuide=true;
  let setupPage='auto', sample='', returnToReview=false, assistantFinished=false, opening=false, pollTimer=null, pollRun=0;
  let benchmarkText='', generationText='', downloadState={model:downloadModels[0].name,text:'',progress:null};
  try {
    chat=sanitizeConversation(JSON.parse(localStorage.getItem(CHAT_KEY)||'[]'));
    draft=(localStorage.getItem(DRAFT_KEY)||'').slice(0,1500);
    const report=JSON.parse(localStorage.getItem(HARDWARE_KEY)||'null');
    if(report) { hardware=validateHardware(report); hardware.source='saved device details'; }
  } catch {}
  const returned=assistantReturn(location.hash);
  const returnedMac=new URLSearchParams(location.search).get('ai-setup')==='mac';
  if(returnedMac){os='mac';assistantFinished=true;const cleaned=new URL(location.href);cleaned.searchParams.delete('ai-setup');history.replaceState(null,'',cleaned.pathname+cleaned.search+'#atlas');}
  if(returned) {
    try { hardware=validateHardware(returned); hardware.source='setup assistant'; os=hardware.os; saveHardware(); assistantFinished=true; } catch {}
    history.replaceState(null,'',location.pathname+location.search+'#atlas');
  }
  downloadState.model=recommendedDownload(hardware).name;
  const panel=document.createElement('dialog'); panel.id='tutor-panel'; panel.setAttribute('aria-labelledby','tutor-title');
  panel.innerHTML=`<div class="tutor-top"><div><span class="eyebrow">GUIDED RECALL / OPTIONAL LOCAL AI</span><h2 id="tutor-title">Think it <em>through.</em></h2></div><button id="tutor-close" class="icon-btn" aria-label="Close tutor">×</button></div><div class="tutor-status"><i id="tutor-dot"></i><span id="tutor-status" role="status">Set up local AI</span></div><div class="tutor-tabs" role="group" aria-label="Tutor workspace"><button data-tutor-tab="guide">Textbook guide</button><button data-tutor-tab="chat">Socratic AI</button><button data-tutor-tab="setup">Enable local AI</button></div><div id="tutor-body"></div><div class="tutor-privacy">The textbook guide works without a model. Optional AI chat goes to Ollama on this computer.</div>`;
  document.body.append(panel);
  const launcher=document.createElement('button'); launcher.id='tutor-launch'; launcher.setAttribute('aria-controls','tutor-panel'); launcher.setAttribute('aria-expanded','false');
  launcher.innerHTML='<span class="tutor-spark">✳</span> Socratic tutor <span>↗</span>'; document.body.append(launcher);
  const compactTutor=matchMedia('(max-width:999px)');
  function showPanel(){if(compactTutor.matches)panel.showModal();else panel.show();}
  function stopWaiting(){clearTimeout(pollTimer);pollRun++;opening=false;}
  function closePanel(){captureDraft();stopWaiting();if(job?.kind==='connect')controller?.abort();panel.close();launcher.setAttribute('aria-expanded','false');lastFocus?.focus();}
  function openPanel({setup=false,review=false,autoCheck=true}={}) {
    lastFocus=document.activeElement;returnToReview=review;
    if(!panel.open)showPanel();launcher.setAttribute('aria-expanded','true');
    if(!busy){
     tab=setup?'setup':localAI.state.ready?'chat':'guide';
     if(setup)setupPage='auto';
     else if(tab==='guide'){if(context.diagram?.question)useDiagramGuide=true;guideSection=lessons.some(l=>l.id===context.reference)?context.reference:guideSection;guideReveal='';}
    }
    render();$('#tutor-close').focus();
    if(context.assessmentMode==='exam')return;
    if((setup||tab==='chat')&&autoCheck&&!busy&&os!=='other'&&(!connected||Date.now()-localAI.state.checkedAt>60000)) {tab='setup';setupPage='auto';connect(true);}
  }
  launcher.onclick=()=>openPanel(); $('#tutor-close').onclick=closePanel;
  panel.addEventListener('cancel',ev=>{ev.preventDefault();closePanel();});
  panel.addEventListener('keydown',ev=>{
    if(ev.key==='Escape'){ev.preventDefault();ev.stopPropagation();closePanel();}
    if(ev.key==='Tab'&&compactTutor.matches){
      const controls=[...panel.querySelectorAll('button,a,input,select,textarea,summary,[tabindex]')].filter(el=>!el.disabled&&el.tabIndex>=0&&el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden');
      const first=controls[0],last=controls.at(-1),active=document.activeElement;
      if(ev.shiftKey&&active===first){ev.preventDefault();last?.focus();}else if(!ev.shiftKey&&active===last){ev.preventDefault();first?.focus();}
    }
  });
  compactTutor.addEventListener('change',()=>{if(panel.open){const focused=document.activeElement;panel.close();showPanel();if(panel.contains(focused))focused.focus({preventScroll:true});}});
  panel.querySelectorAll('[data-tutor-tab]').forEach(b=>b.onclick=()=>{
    captureDraft();tab=b.dataset.tutorTab;setupPage='auto';render();
    if(tab==='setup'&&os!=='other'&&!localAI.state.ready&&!busy)connect(true);
  });
  function status(text,ok=false){$('#tutor-status').textContent=text;$('#tutor-dot').classList.toggle('online',ok);}
  function syncConnection(state){
    client=localAI.client;connected=state.connected;models=state.models;choice=state.model;
    status(state.ready?'Ready · '+choice:state.phase==='checking'?'Checking Ollama…':state.phase==='testing'?'Trying your model…':connected?'Ollama connected · '+(choice?'test your model':'choose a model'):state.phase==='unreachable'?'Connection needs attention':'Set up local AI',state.ready);
    launcher.dataset.aiReady=String(state.ready);
    if(panel.open)render();
    document.dispatchEvent(new CustomEvent('localaistatechange',{detail:{ready:state.ready,connected,model:choice}}));
  }
  localAI.subscribe(syncConnection);syncConnection(localAI.snapshot());
  document.addEventListener('localaiopen',ev=>openPanel({setup:true,review:ev.detail?.returnToReview===true}));
  window.addEventListener('storage',ev=>{if(ev.key===HARDWARE_KEY&&ev.newValue){try{hardware=validateHardware(JSON.parse(ev.newValue));hardware.source='setup assistant / another study tab';if(panel.open&&tab==='setup')render();}catch{}}});
  document.addEventListener('visibilitychange',()=>{if(!opening)return;if(document.hidden)clearTimeout(pollTimer);else if(panel.open)waitForOllama();});
  function save(){try{localStorage.setItem(CHAT_KEY,JSON.stringify(chat.slice(-CHAT_LIMIT)));}catch{toast('Tutor history could not be saved. Study progress is separate.');}}
  function saveDraft(){try{localStorage.setItem(DRAFT_KEY,draft);}catch{}}
  function saveHardware(){try{localStorage.setItem(HARDWARE_KEY,JSON.stringify(hardware));}catch{}}
  function captureDraft(){if($('#tutor-input')){draft=$('#tutor-input').value.slice(0,1500);saveDraft();}}
  function render(){
    const body=$('#tutor-body'),active=document.activeElement,activeID=body.contains(active)?active.id:null;
    const selection=activeID==='tutor-input'?[active.selectionStart,active.selectionEnd]:null;
    captureDraft();body.classList.toggle('ai-guided-setup',tab==='setup');body.classList.toggle('tutor-chat-layout',tab==='chat');
    panel.dataset.aiView=tab;
    panel.querySelectorAll('[data-tutor-tab]').forEach(b=>{
     const mode=b.dataset.tutorTab;b.classList.toggle('active',mode===tab);b.setAttribute('aria-pressed',String(mode===tab));
     b.disabled=context.assessmentMode==='exam';
     if(mode==='chat')b.hidden=!localAI.state.ready&&tab!=='chat';
     if(mode==='setup')b.textContent=localAI.state.ready?'AI setup':os==='other'?'Local AI on a computer':'Enable local AI';
    });
    if(context.assessmentMode==='exam'){
      body.classList.remove('tutor-chat-layout');
      body.innerHTML='<div class="tutor-textbook-guide"><h3>Finish your independent attempt.</h3><p>Your tutor and source-based hints become available after submission. Your answers stay saved while you return to the exam.</p><button class="primary" id="tutor-return-exam">Return to exam</button></div>';
      $('#tutor-return-exam').onclick=closePanel;status('Independent exam · coaching paused');return;
    }
    if(tab==='setup')renderSetup();else if(tab==='guide')renderTextbookGuide();else renderChat();
    if(tab==='guide')status('Textbook guide · ready',true);
    else if(tab==='setup'&&!busy&&!localAI.state.ready)status(connected?'Ollama connected · choose or test a model':os==='other'?'Desktop Ollama setup':localAI.state.phase==='unreachable'?'Connection needs attention':'Set up local AI');
    syncControls();
    if(activeID&&$('#'+activeID)&&!$('#'+activeID).disabled){$('#'+activeID).focus({preventScroll:true});if(selection)$('#'+activeID).setSelectionRange(...selection);}
  }
  function syncControls(){
    const disable=(id,value)=>{if($('#'+id))$('#'+id).disabled=!!value;};
    disable('tutor-model',busy||!connected);disable('tutor-send',busy||!connected||!choice||!draft.trim());disable('tutor-clear',busy||!chat.length);
    if($('#tutor-stop'))$('#tutor-stop').hidden=job?.kind!=='chat';
    panel.querySelectorAll('[data-tutor-mode]').forEach(b=>b.disabled=busy||!connected||!choice);
  }
  function beginJob(kind){busy=true;controller=new AbortController();job={kind,model:choice};render();}
  function endJob(){busy=false;controller=null;job=null;render();}
  function go(page){setupPage=page;render();$('#tutor-body .ai-setup-content')?.focus({preventScroll:true});}
  function finish(){if(returnToReview||os==='other'){closePanel();if(localAI.state.ready)toast('Local AI is ready for optional answer review.');}else{tab='chat';render();$('#tutor-input')?.focus();}}
  function renderTextbookGuide(){
    if(useDiagramGuide&&context.diagram?.question){renderDiagramGuide();return;}
    const lesson=lessons.find(l=>l.id===guideSection)||lessons[0],prompt=lesson[guidePrompt];
    guideSection=lesson.id;
    $('#tutor-body').innerHTML=`<div class="tutor-textbook-guide"><h3>Practice from the textbook</h3><p>Pick a section, try an answer aloud or on paper, then check your reasoning.</p>
      <label for="tutor-guide-section">Textbook section</label><select id="tutor-guide-section">${lessons.map(l=>`<option value="${e(l.id)}" ${l.id===lesson.id?'selected':''}>${e(l.id+' · '+l.title)}</option>`).join('')}</select>
      <div class="control-row" aria-label="Prompt type"><button type="button" data-guide-prompt="recall" aria-pressed="${guidePrompt==='recall'}">Recall</button><button type="button" data-guide-prompt="application" aria-pressed="${guidePrompt==='application'}">Apply it</button></div>
      <div class="objective tutor-guide-prompt"><strong>${e(prompt[0])}</strong></div>
      ${context.type==='assessment'?'<p class="tiny warning-text">Hints, model answers, and source reading count as assistance for the current question.</p>':''}
      <div class="control-row"><button id="tutor-guide-hint" aria-expanded="${guideReveal==='hint'}">Show a hint</button><button id="tutor-guide-answer" aria-expanded="${guideReveal==='answer'}">Show model answer</button><button id="tutor-guide-source">Read §${e(lesson.id)} ↗</button></div>
      <div id="tutor-guide-reveal" role="status">${guideReveal?`<p><strong>${guideReveal==='hint'?'What to focus on':'Model answer'}</strong></p><p>${e(guideReveal==='hint'?lesson.objective:prompt[1])}</p>`:''}</div>${context.diagram?.question?'<button id="tutor-guide-activity">Practice my current activity</button>':''}</div>`;
    $('#tutor-guide-section').onchange=ev=>{guideSection=ev.target.value;guideReveal='';render();};
    panel.querySelectorAll('[data-guide-prompt]').forEach(button=>button.onclick=()=>{guidePrompt=button.dataset.guidePrompt;guideReveal='';render();panel.querySelector('[data-guide-prompt="'+guidePrompt+'"]').focus({preventScroll:true});});
    const reveal=kind=>{if(guideReveal!==kind)document.dispatchEvent(new Event('studyassistance'));guideReveal=guideReveal===kind?'':kind;render();};
    $('#tutor-guide-hint').onclick=()=>reveal('hint');
    $('#tutor-guide-answer').onclick=()=>reveal('answer');
    $('#tutor-guide-source').onclick=()=>{document.dispatchEvent(new Event('studyassistance'));closePanel();document.dispatchEvent(new CustomEvent('openreader',{detail:lesson.id}));};
    if($('#tutor-guide-activity'))$('#tutor-guide-activity').onclick=()=>{useDiagramGuide=true;guideReveal='';render();};
  }
  function renderDiagramGuide(){
    const d=context.diagram;
    $('#tutor-body').innerHTML=`<div class="tutor-textbook-guide"><span class="eyebrow">GUIDED DIAGRAM PRACTICE · NO AI REQUIRED</span><h3>${e(context.label)}</h3><p>Try an answer aloud or in your notes, then compare your reasoning. These prompts follow the activity you are viewing.</p><div class="objective tutor-guide-prompt"><strong>${e(d.question)}</strong></div>${d.prediction?`<p>Your activity response: ${e(d.prediction)}</p>`:''}<div class="control-row"><button id="tutor-diagram-hint" aria-expanded="${guideReveal==='hint'}">Small hint</button><button id="tutor-diagram-answer" aria-expanded="${guideReveal==='answer'}">Explain clearly</button></div><div role="status">${guideReveal?`<p>${e(guideReveal==='hint'?d.hint||'Identify which control changed and what stayed the same.':d.answer||d.facts.join(' '))}</p>`:''}</div><div class="control-row"><button id="tutor-diagram-return" class="primary">Return to activity</button><button id="tutor-diagram-other">Choose a course section</button></div><p class="tiny">Self-check practice is separate from scored exam results. Optional local AI can discuss your explanation.</p></div>`;
    const reveal=kind=>{document.dispatchEvent(new Event('studyassistance'));guideReveal=guideReveal===kind?'':kind;render();};
    $('#tutor-diagram-hint').onclick=()=>reveal('hint');$('#tutor-diagram-answer').onclick=()=>reveal('answer');
    $('#tutor-diagram-return').onclick=closePanel;$('#tutor-diagram-other').onclick=()=>{useDiagramGuide=false;guideReveal='';render();};
  }
  function renderSetup(){
    $('#tutor-body').innerHTML=setupScreen({state:localAI.snapshot(),page:setupPage,busy,job:job?.kind,os,hardware,download:downloadState,sample,testText:benchmarkText,returnToReview,assistantFinished,opening});
    // Keep the next action visible even on short laptop screens or with the
    // phone keyboard open. Technical instructions may scroll independently.
    const primary=panel.querySelector('.ai-setup-content .primary'),footer=panel.querySelector('.ai-setup-footer');
    if(primary){footer.append(primary);footer.classList.add('has-primary');}
    const actions={overview:()=>go('auto'),install:()=>go('install'),repair:()=>go('repair'),model:()=>go('model'),downloads:()=>go('download'),hardware:()=>go('hardware'),close:closePanel,finish,check:()=>connect(),test:()=>benchmark(),longer:()=>benchmark(120000),smaller:()=>{const smaller=models.filter(m=>!m.problem&&m.size<(models.find(m=>m.name===choice)?.size||0)).sort((a,b)=>a.size-b.size)[0];if(smaller){localAI.select(smaller.name);benchmark();}},download:pull,'use-installed':()=>{sample='';benchmarkText='';go('auto');},stop:()=>{stopWaiting();controller?.abort();render();},detect:async()=>{hardware=mergeBrowserHardware(hardware,await browserHardware());saveHardware();downloadState.model=recommendedDownload(hardware).name;render();},'apply-memory':()=>{try{hardware={...hardware,...memoryValues($('#hardware-ram').value,$('#hardware-vram').value),schema:1,ramApproximate:false,source:'manually entered'};saveHardware();downloadState.model=recommendedDownload(hardware).name;render();}catch(err){$('#hardware-error').textContent=err.message;}}};
    panel.querySelectorAll('[data-ai-action]').forEach(b=>b.onclick=()=>actions[b.dataset.aiAction]?.());
    if($('#ollama-os'))$('#ollama-os').onchange=ev=>{os=ev.target.value;render();};
    if($('#ollama-address'))$('#ollama-address').onchange=ev=>{localAI.setEndpoint(ev.target.value);sample='';benchmarkText='';render();};
    if($('#ollama-open'))$('#ollama-open').onclick=ev=>{if(busy){ev.preventDefault();return;}setTimeout(()=>{if(panel.open)waitForOllama();},0);};
    if($('#model-download'))$('#model-download').onchange=ev=>{downloadState={model:ev.target.value,text:'',progress:null};render();};
    if($('#hardware-import'))$('#hardware-import').onchange=async ev=>{try{const f=ev.target.files[0];if(!f)return;if(f.size>20000)throw new Error('Choose a small Osteon hardware report.');hardware=validateHardware(JSON.parse((await f.text()).replace(/^\uFEFF/,'')));saveHardware();downloadState.model=recommendedDownload(hardware).name;render();}catch(err){$('#hardware-error').textContent=err.message;}};
    bindModel();
  }
  async function waitForOllama(){
    stopWaiting();opening=true;const run=++pollRun,deadline=performance.now()+40000;render();
    const poll=async()=>{
      if(run!==pollRun||!panel.open||document.hidden)return;
      if(performance.now()>=deadline){opening=false;setupPage='repair';render();return;}
      try{await localAI.client.request('version',{timeout:Math.min(1500,deadline-performance.now())});if(run===pollRun){opening=false;await connect(true);return;}}catch{}
      if(run===pollRun)pollTimer=setTimeout(poll,1500);
    };
    pollTimer=setTimeout(poll,1000);
  }
  async function connect(returning=false){
    if(busy)return;stopWaiting();setupPage='auto';assistantFinished=false;benchmarkText='';sample='';beginJob('connect');
    let retest=false;
    try{await localAI.connect(controller.signal);retest=returning&&localAI.wasTested();}catch{}finally{endJob();}
    if(retest&&panel.open){await benchmark();if(localAI.state.ready&&!returnToReview){tab='chat';render();}}
  }
  const bytes=n=>(n/1e9).toFixed(1)+' GB';
  function modelSelector(){return `<label for="tutor-model">Local AI model</label><select id="tutor-model" ${busy||!connected?'disabled':''}>${choice?'':'<option value="">Finish local AI setup</option>'}${models.filter(m=>!m.problem).map(m=>`<option value="${e(m.name)}" ${m.name===choice?'selected':''}>${e(m.name)} · ${bytes(m.size)}</option>`).join('')}</select>`;}
  function bindModel(){if($('#tutor-model'))$('#tutor-model').onchange=ev=>{localAI.select(ev.target.value);sample='';benchmarkText='';if(tab==='chat')tab='setup';render();};}
  async function checkedModel(name=choice){
    if(!connected||!name)throw new Error('Finish local AI setup first.');
    const model=models.find(m=>m.name===name);if(!model)throw new Error('Check the installed model list again.');
    const info=await client.show(name,controller?.signal),problem=localModelProblem(model,info);if(problem)throw new Error(problem);return info;
  }
  async function benchmark(timeout=60000){
    if(busy||!choice)return;setupPage='auto';sample='';benchmarkText='Loading and trying your model…';beginJob('benchmark');
    const started=performance.now(),ticker=setInterval(()=>{if($('#model-test-result'))$('#model-test-result').textContent='Loading and trying your model · '+Math.floor((performance.now()-started)/1000)+' seconds (up to '+Math.round(timeout/1000)+' seconds).';},1000);
    try{const result=await localAI.test(controller.signal,{timeout});sample=result.text;benchmarkText='Your model returned a complete response.'+(result.firstSeconds==null?'':' First text took '+result.firstSeconds.toFixed(1)+' seconds.')+(result.firstSeconds>30?' A smaller model may make tutoring quicker.':'');}
    catch(err){benchmarkText=controller.signal.aborted?'Test stopped. You can try again.':(err.message?.includes('fetch')?'Connection interrupted. Check Ollama again.':err.message)+' Try a smaller model if this computer runs out of memory.';}
    finally{clearInterval(ticker);endJob();}
  }
  function updateDeviceJob(){
    if($('#model-pull-result'))$('#model-pull-result').textContent=downloadState.text;
    if($('#model-pull-progress')){$('#model-pull-progress').hidden=downloadState.progress==null;$('#model-pull-progress').value=downloadState.progress||0;}
  }
  async function pull(){
    if(busy||!connected)return;const name=downloadState.model;let downloaded=false;setupPage='model';downloadState={model:name,text:'Starting download…',progress:null};beginJob('pull');
    try{
      await client.pull(name,obj=>{downloadState.text=obj.status||'Downloading…';downloadState.progress=obj.total>0?Math.min(100,Math.round((obj.completed||0)/obj.total*100)):null;if(obj.total>0)downloadState.text+=' · current part: '+bytes(obj.completed||0)+' / '+bytes(obj.total)+' ('+downloadState.progress+'%)';updateDeviceJob();},controller.signal);
      downloaded=true;downloadState.text='Downloaded. Checking installed local weights…';updateDeviceJob();
      await localAI.connect(controller.signal);if(!localAI.state.models.some(m=>m.name===name&&!m.problem))throw new Error('The downloaded model could not be verified. Check the connection again.');
      localAI.select(name);downloadState.text='Download complete. Try this model to finish setup.';downloadState.progress=100;benchmarkText='Download complete. Test your model next.';setupPage='auto';sample='';
    }catch(err){downloadState.text=controller.signal.aborted?'Download stopped. Retry to resume available parts.':(downloaded?'Download finished, but verification needs another check. ':'')+(err.message||'Try again.');}
    finally{endJob();}
  }
  function sourceButtons(m) {
    return (m.sources || []).map((s) => `<button data-tutor-page="${s.pdf}" class="tutor-source">[${e(s.id)}] ${e(s.title)} \u2197</button>`).join("");
  }
  function answerHTML(m) {
    if (m.pending) return e(m.content || "Preparing a local reply\u2026");
    return citationParts(m.content, m.sources).parts.map((part) => part.type === "text" ? e(part.text).replace(/\*\*([^*\n]{1,200})\*\*/g,"<strong>$1</strong>").replace(/\*([^*\n]{1,160})\*/g,"<em>$1</em>") : `<button class="inline-source" data-tutor-page="${part.source.pdf}" aria-label="Read ${e(part.source.id + " " + part.source.title)}">[${part.source.id}]</button>`).join("");
  }
  function messageHTML(m, index) {
    const references = m.role === "assistant" ? citationParts(m.content, m.sources) : { unknown: [] }, unavailable = references.unknown.length ? `<p class="tiny warning-text">Reference ${references.unknown.map(e).join(", ")} was not supplied for this reply. Use the readings below to check it.</p>` : "";
    return `<article class="tutor-message ${m.role}"><span>${m.role === "user" ? "YOU" : m.pending ? "LOCAL AI / DRAFT" : "OSTEON / AI"}${m.model ? " \xB7 " + e(m.model) : ""}</span><div class="tutor-message-text">${m.role === "assistant" ? answerHTML(m) : e(m.content)}</div>${m.correction ? '<p class="tiny warning-text">Course note substituted: ' + e(m.correction) + "</p>" : ""}${m.reference ? '<button data-tutor-section="' + e(m.reference) + '" class="tutor-source">Read course section ' + e(m.reference) + " \u2197</button>" : ""}${m.error ? '<p class="tiny warning-text">Response incomplete. Check the source before using it.</p><button class="retry-question" data-tutor-retry="' + index + '">Edit question and retry \u2197</button>' : ""}${unavailable}${m.sources?.length ? '<details><summary>Read the source excerpts</summary><div class="tutor-sources">' + m.sources.map((source) => `<div class="tutor-excerpt"><button data-tutor-page="${source.pdf}" class="tutor-source">[${e(source.id)}] ${e(source.title)} \u2197</button>${source.text ? "<blockquote>" + e(source.text) + "</blockquote>" : ""}</div>`).join("") + '</div><p class="tiny">These readings were supplied to the model; a matching reference does not certify every claim.</p></details>' : ""}</article>`;
  }
  function renderChat() {
    const assessed = context.type === "assessment";
    $("#tutor-body").innerHTML = `<div class="tutor-chat-controls">${modelSelector()}<div id="tutor-context" class="tutor-context"><span>LEARNING CONTEXT</span><strong>${e(context.label)}</strong></div><p id="tutor-assessment-note" class="tiny warning-text" ${assessed ? "" : "hidden"}>Using tutor help marks the current unanswered attempt as assisted before a reply is generated.</p></div><div class="tutor-session"><button id="tutor-session-options" type="button">${guided?guided.completed>=guided.total?'Session complete · choose next topic':'Guided practice · '+guided.completed+'/'+guided.total+' replies':'Start a short guided practice'}</button>${guided?`<span class="tiny">${e(guided.topic)} · ${guided.completed>=guided.total?'Try the independent task before more hints.':'One question at a time; direct explanations remain available.'}</span>`:''}</div><div id="tutor-messages" aria-live="off">${chat.length ? chat.map((m, i) => messageHTML(m, i)).join("") : '<div class="tutor-welcome"><span>\u2733</span><h3>A question.<br>A connection.<br>Your understanding.</h3><p>Choose a structure or lesson, then ask me to help you reason through it.</p></div>'}</div><div id="tutor-generation-status" class="tiny" role="status">${e(generationText)}</div><div class="tutor-quick"><button data-tutor-mode="socratic">Ask me about this</button><button data-tutor-mode="hint">Small hint</button><button data-tutor-mode="explain">Explain clearly</button></div><form id="tutor-form"><label for="tutor-input" class="sr-only">Your anatomy question or answer</label><textarea id="tutor-input" rows="2" maxlength="1500" placeholder="Your question, prediction or answer\u2026">${e(draft)}</textarea><p class="composer-help">Enter to send \xB7 Shift + Enter for a new line</p><div class="tutor-send-row"><button id="tutor-clear" type="button">Clear chat</button><button id="tutor-stop" type="button" ${busy ? "" : "hidden"}>Stop</button><button class="primary" id="tutor-send" ${!connected || !choice || busy ? "disabled" : ""}>Send \u2197</button></div></form>${!connected ? '<p class="tiny">Connect to your local Ollama to send a question. <button type="button" id="chat-connect">Open connection setup \u2197</button></p>' : ""}`;
    bindModel();
    $('#tutor-session-options').disabled=busy;$('#tutor-session-options').onclick=()=>{captureDraft();const row=document.createElement('div');row.className='tutor-session-form';row.innerHTML=`<label for="tutor-session-topic">Small topic to practice</label><input id="tutor-session-topic" maxlength="120" value="${e(guided?.topic||context.label)}"><label for="tutor-session-length">Session length</label><select id="tutor-session-length"><option value="3">3 AI replies · quick check</option><option value="5">5 AI replies · deeper practice</option></select><p class="tiny">The last reply requests a recap and an independent task. AI output still needs source checking. Only completed replies count.</p><button type="button" id="tutor-session-start" class="primary">Start guided session</button><button type="button" id="tutor-session-free">Use open chat</button>`;panel.querySelector('.tutor-session').replaceChildren(row);$('#tutor-session-start').onclick=()=>{guided=newTutorSession($('#tutor-session-topic').value,+$('#tutor-session-length').value);generationText='Guided practice ready. Ask about the topic or choose Ask me about this.';render();};$('#tutor-session-free').onclick=()=>{guided=null;render();};};
    $("#tutor-input").oninput = () => {
      draft = $("#tutor-input").value;
      saveDraft();
      syncControls();
    };
    $("#tutor-input").onkeydown = (ev) => {
      if (ev.key === "Enter" && !ev.shiftKey && !ev.isComposing) {
        ev.preventDefault();
        if (!busy && connected && choice && draft.trim()) send("socratic", false);
      }
    };
    $("#tutor-form").onsubmit = (ev) => {
      ev.preventDefault();
      send("socratic", false);
    };
    panel.querySelectorAll("[data-tutor-mode]").forEach((b) => b.onclick = () => send(b.dataset.tutorMode, true));
    $("#tutor-stop").onclick = () => controller?.abort();
    $("#tutor-clear").onclick = () => {
      if (busy) return;
      chat = [];
      guided=null;
      generationText = "";
      save();
      render();
    };
    if ($("#chat-connect")) $("#chat-connect").onclick = () => {
      tab = "setup"; setupPage = "auto";
      render();
    };
    panel.querySelectorAll("[data-tutor-retry]").forEach((b) => b.onclick = () => {
      const prior = chat.slice(0, +b.dataset.tutorRetry).reverse().find((m) => m.role === "user");
      if (prior) {
        draft = prior.content.slice(0, 1500);
        $("#tutor-input").value = draft;
        saveDraft();
        syncControls();
        $("#tutor-input").focus();
      }
    });
    bindSources();
  }
  function bindSources() {
    const read=(event,detail)=>{$('#tutor-close').click();document.dispatchEvent(new CustomEvent(event,{detail}));};
    panel.querySelectorAll("[data-tutor-section]").forEach((b) => b.onclick = () => read("openreader",b.dataset.tutorSection));
    panel.querySelectorAll("[data-tutor-page]").forEach((b) => b.onclick = () => read("openreaderpage",+b.dataset.tutorPage));
  }
  async function send(mode, allowPrompt = false) {
    if (busy || !connected || !choice || context.assessmentMode==='exam') return;
    captureDraft();
    if (!draft.trim() && !allowPrompt) return;
    const query = draft.trim() || (guided&&guided.completed<guided.total?`Ask me one focused question about ${guided.topic}.`:mode === "explain" ? `Explain ${context.label} clearly.` : mode === "hint" ? `Give me a small hint about ${context.label}.` : `Ask me one question about ${context.label}.`), model = choice;
    document.dispatchEvent(new Event("studyassistance"));
    const { sources, messages, retrievalTopic } = buildTutorMessages(query, chat, guided&&guided.completed<guided.total?{...context,label:guided.topic}:context, mode);
    const contract=tutorSessionInstruction(guided);if(contract)messages[0].content+="\n"+contract;
    chat.push({ role: "user", content: query });
    const reply = { role: "assistant", content: "", model, pending: true, sources: sources.map(({ id, pdf, title, text }) => ({ id, pdf, title, text })) };
    chat.push(reply);
    chat = chat.slice(-CHAT_LIMIT);
    draft = "";
    if ($("#tutor-input")) $("#tutor-input").value = "";
    saveDraft();
    save();
    generationText = "Preparing a local reply. First use of a model can take longer.";
    beginJob("chat");
    $("#tutor-input")?.focus({ preventScroll: true });
    $("#tutor-body").scrollTop = $("#tutor-body").scrollHeight;
    try {
      const info = await checkedModel(model);
      const started=performance.now();let firstText=null;
      await client.chat(model, messages, (text) => {
        if(firstText===null&&text.trim())firstText=(performance.now()-started)/1000;
        reply.content = text;
        if (tab === "chat" && $("#tutor-messages")) {
          const body = $("#tutor-body"), follow = body.scrollHeight - body.scrollTop - body.clientHeight < 160, el = $("#tutor-messages").lastElementChild?.querySelector(".tutor-message-text");
          if (el) el.textContent = text;
          if (follow) body.scrollTop = body.scrollHeight;
        }
      }, { signal: controller.signal, info });
      const correction = checkTutorReply(reply.content, query+" "+retrievalTopic);
      if (correction) {
        reply.content = correction.text;
        reply.correction = correction.reason;
        reply.reference = correction.reference;
      }
      localAI.markResponded(model);
      if(contract)guided=completeTutorTurn(guided);
      generationText = "Reply ready \xB7 " + model + ". Check the source readings."+(firstText>20?" First text took "+Math.round(firstText)+" seconds; a smaller installed model may feel quicker alongside the atlas.":"");
    } catch (err) {
      reply.error = true;
      reply.content += (reply.content ? "\n\n" : "") + (controller.signal.aborted ? "Stopped." : err.message?.includes("fetch") ? "Connection lost. Check Ollama and retry." : err.message || "No answer received.");
      generationText = controller.signal.aborted ? "Reply stopped. Your question is saved." : "Reply incomplete. Edit and retry, or use the source readings.";
      if (err instanceof TypeError && /fetch/i.test(err.message)) {
        localAI.unavailable();
        status("Connection lost \xB7 reconnect to Ollama");
      }
    } finally {
      reply.pending = false;
      save();
      endJob();
    }
  }
  document.addEventListener("tutorcontext", (ev) => {
    const wasLocked=context.assessmentMode==='exam',oldDiagram=context.diagram?.id,oldQuestion=context.diagram?.question,oldState=JSON.stringify(context.diagram?.state);
    context = { ...ev.detail };
    if(oldDiagram!==context.diagram?.id)useDiagramGuide=true;
    if(oldDiagram!==context.diagram?.id||oldQuestion!==context.diagram?.question||oldState!==JSON.stringify(context.diagram?.state))guideReveal='';
    if(context.assessmentMode==='exam'&&job?.kind==='chat')controller?.abort();
    if ($("#tutor-assessment-note")) $("#tutor-assessment-note").hidden = context.type !== "assessment";
    if(panel.open&&(tab==='guide'||wasLocked!==Boolean(context.assessmentMode==='exam')))render();
    if ($("#tutor-context")) $("#tutor-context").innerHTML = "<span>LEARNING CONTEXT</span><strong>" + e(context.label) + "</strong>";
  });
  window.addEventListener("pagehide", () => controller?.abort());
  if(returned||returnedMac)requestAnimationFrame(()=>openPanel({setup:true,autoCheck:false}));
  return { open: () => openPanel() };
}
export {
  initTutor
};
