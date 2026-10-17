// Paged desktop content preserves the original nodes, listeners and input drafts.
export function initWorkspace() {
  const desktop=matchMedia('(min-width:1000px)'), records=new Map(),cache=new WeakMap();
  const main=document.querySelector('main');
  let queued=false,working=false,pane='specimen';
  const tabs=document.createElement('div');
  tabs.className='atlas-pane-tabs';tabs.setAttribute('aria-label','Atlas workspace');
  tabs.innerHTML=['specimen','browse','details'].map((id,i)=>`<button type="button" data-atlas-pane="${id}" aria-pressed="${i===0}" aria-controls="${id==='specimen'?'atlas-specimen':id==='browse'?'atlas-browser':'atlas-details'}">${id[0].toUpperCase()+id.slice(1)}</button>`).join('');
  document.querySelector('.atlas-workspace').before(tabs);
  const atlasPanels=[['.specimen-stage','atlas-specimen'],['.structure-sidebar','atlas-browser'],['.detail-sidebar','atlas-details']];
  atlasPanels.forEach(([selector,id])=>document.querySelector('.atlas-workspace>'+selector).id=id);
  function setPane(value){pane=value;document.querySelector('#atlas-view').dataset.pane=pane;tabs.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.atlasPane===pane)));if(!desktop.matches)window.scrollTo({top:0,behavior:'instant'});}
  tabs.addEventListener('click',ev=>{const b=ev.target.closest('[data-atlas-pane]');if(b)setPane(b.dataset.atlasPane);});
  setPane(pane);
  const launcher=document.querySelector('#tutor-launch');
  if(launcher)document.querySelector('.topbar').insertBefore(launcher,document.querySelector('#help-btn'));
  document.querySelectorAll('.viewer-actions button').forEach(button=>{const label=button.getAttribute('aria-label')||button.querySelector('span')?.textContent.trim()||button.textContent.trim();button.setAttribute('aria-label',label);button.title=label;});
  const filters=document.createElement('div');filters.className='desktop-filters';
  filters.innerHTML='<label for="desktop-division">Division</label><select id="desktop-division" aria-label="Skeleton division"></select><label for="desktop-region">Region</label><select id="desktop-region" aria-label="Anatomical region"></select>';
  document.querySelector('.division-block').before(filters);
  const syncSelect=(selector,target)=>{
    const buttons=[...document.querySelectorAll(selector)],select=filters.querySelector(target);
    const options=buttons.map(b=>({name:b.textContent,disabled:b.disabled,selected:b.getAttribute('aria-pressed')==='true'}));
    const signature=JSON.stringify(options);
    if(select.dataset.signature!==signature){select.innerHTML=options.map(o=>`<option ${o.disabled?'disabled':''} ${o.selected?'selected':''}>${o.name}</option>`).join('');select.dataset.signature=signature;}
  };
  filters.querySelector('#desktop-division').onchange=ev=>[...document.querySelectorAll('[data-division]')].find(b=>b.dataset.division===ev.target.value)?.click();
  filters.querySelector('#desktop-region').onchange=ev=>[...document.querySelectorAll('[data-region]')].find(b=>b.dataset.region===ev.target.value)?.click();

  function request(){if(!queued){queued=true;requestAnimationFrame(()=>{queued=false;refresh();});}}
  const observer=new MutationObserver(changes=>{
    if(working)return;
    if(changes.every(c=>c.target.closest?.('.page-tools')))return;
    request();
  });
  function observe(){observer.observe(main,{childList:true,subtree:true});for(const selector of ['#info-dialog','#tutor-panel'])observer.observe(document.querySelector(selector),{childList:true,subtree:true,attributes:true,attributeFilter:['open']});}
  function dismantle(root,record){
    if(record.window.parentNode===root){while(record.flow.firstChild)root.insertBefore(record.flow.firstChild,record.window);record.window.remove();record.tools.remove();}
    root.classList.remove('paged-root');records.delete(root);
  }
  function mount(root,label,pinned=[]){
    if(!root||root.getClientRects().length===0)return;
    let record=records.get(root);
    if(record&&record.window.parentNode!==root){records.delete(root);record=null;}
    if(!record){
      const win=document.createElement('div'),flow=document.createElement('div'),tools=document.createElement('nav');
      win.className='page-window';flow.className='page-flow';tools.className='page-tools';tools.setAttribute('aria-label',label+' pages');
      for(const child of [...root.childNodes])if(!pinned.includes(child))flow.append(child);
      win.append(flow);root.append(win,tools);root.classList.add('paged-root');
      tools.innerHTML=`<button type="button" class="page-prev" aria-label="Previous ${label.toLowerCase()} page">←</button><label class="sr-only">${label} page</label><select aria-label="${label} page"></select><span class="page-status" role="status"></span><button type="button" class="page-next" aria-label="Next ${label.toLowerCase()} page">→</button>`;
      const prior=cache.get(root),signature=flow.textContent;
      record={window:win,flow,tools,index:prior?.signature===signature?prior.index:0,count:1,width:0,signature,initial:true};records.set(root,record);
      const go=index=>{
        record.index=Math.max(0,Math.min(record.count-1,index));
        win.scrollLeft=record.index*(record.width+24);
        tools.querySelector('.page-prev').disabled=record.index===0;
        tools.querySelector('.page-next').disabled=record.index===record.count-1;
        tools.querySelector('select').value=String(record.index);
        tools.querySelector('.page-status').textContent=record.count===1?'All in view':record.count+' pages';
      };
      record.go=go;
      tools.querySelector('.page-prev').onclick=()=>go(record.index-1);
      tools.querySelector('.page-next').onclick=()=>go(record.index+1);
      tools.querySelector('select').onchange=ev=>go(+ev.target.value);
      flow.addEventListener('focusin',ev=>{
        const rect=ev.target.getBoundingClientRect(),base=win.getBoundingClientRect();
        go(Math.floor((rect.left-base.left+win.scrollLeft+2)/(record.width+24)));
      });
      win.addEventListener('keydown',ev=>{if(['INPUT','TEXTAREA','SELECT'].includes(ev.target.tagName))return;if(ev.key==='PageDown'||ev.key==='PageUp'){ev.preventDefault();go(record.index+(ev.key==='PageDown'?1:-1));}});
    }
    record.width=record.window.clientWidth;
    record.flow.style.columnWidth=record.width+'px';
    const following=record.index===record.count-1;
    const count=Math.max(1,Math.ceil((record.window.scrollWidth+24-2)/(record.width+24)));
    if(count!==record.count||!record.tools.querySelector('option')){
      record.count=count;record.tools.querySelector('select').innerHTML=Array.from({length:count},(_,i)=>`<option value="${i}">${i+1} / ${count}</option>`).join('');
    }
    const stop=document.querySelector('#tutor-stop');
    if(root.id==='tutor-messages'&&(record.initial||(following&&stop&&!stop.hidden)))record.index=count-1;
    record.initial=false;
    // Newly generated feedback should be immediately visible after an answer.
    const feedback=record.flow.querySelector('#concept-feedback:not(:empty),#course-feedback:not(:empty),#spatial-feedback:not(:empty)');
    const signature=feedback?.textContent||'';
    if(signature&&signature!==record.feedback){const x=feedback.getBoundingClientRect().left-record.window.getBoundingClientRect().left+record.window.scrollLeft;record.index=Math.floor((x+2)/(record.width+24));}
    record.feedback=signature;record.signature=record.flow.textContent;record.go(record.index);
  }
  function refresh(){
    if(working)return;working=true;observer.disconnect();
    document.documentElement.style.setProperty('--nav-height',document.querySelector('.topbar').getBoundingClientRect().height+'px');
    document.documentElement.style.setProperty('--atlas-tools-height',(document.querySelector('#atlas-view>.intro').offsetHeight+tabs.offsetHeight+24)+'px');
    document.querySelector('#specimen-name').title=document.querySelector('#specimen-name').textContent;
    for(const [root,record]of records){if(!root.isConnected||record.window.parentNode!==root){cache.set(root,record);root.classList.remove('paged-root');records.delete(root);}else if(!desktop.matches)dismantle(root,record);}
    if(desktop.matches){
      syncSelect('[data-division]','#desktop-division');syncSelect('[data-region]','#desktop-region');
      mount(document.querySelector('#structure-list'),'Structure list');
      mount(document.querySelector('#detail-content'),'Structure details');
      for(const id of ['study-view','practice-view','progress-view']){
        const root=document.getElementById(id);if(!root.classList.contains('active'))continue;
        const specialized=root.querySelector('.reader-layout,.lesson-layout,.course-layout,#study-body');
        if(specialized){
          root.classList.add('workspace-special');
          if(specialized.classList.contains('reader-layout')){
            mount(root.querySelector('#reader-results'),'Reading results');
            if(root.querySelector('.reader-text'))mount(root.querySelector('.reader-paper'),'Textbook text');
          }else if(specialized.id==='study-body')mount(specialized,'Study content',[...specialized.children].filter(n=>n.classList.contains('control-row')));
          else if(specialized.classList.contains('lesson-layout'))mount(root.querySelector('.lesson-content'),'Lesson');
          else mount(root.querySelector('#course-prompt'),'Course question');
        }else{
          root.classList.remove('workspace-special');
          mount(root,id==='study-view'?'Study studio':id==='practice-view'?'Practice':'Progress',[...root.children].filter(n=>n.classList.contains('section-intro')));
        }
      }
      if(document.querySelector('#info-dialog').open)mount(document.querySelector('#dialog-content'),'Reference');
      if(document.querySelector('#tutor-panel').open){
        const body=document.querySelector('#tutor-body'),chat=!!body.querySelector('#tutor-form');
        body.classList.toggle('tutor-chat-layout',chat);
        mount(chat?body.querySelector('#tutor-messages'):body,chat?'Conversation':'Tutor setup');
      }
    }
    working=false;observe();
  }
  document.addEventListener('viewchange',()=>{setPane('specimen');request();});
  document.addEventListener('structureselected',()=>{if(pane==='browse')setPane('specimen');request();});
  main.addEventListener('click',ev=>{if(!desktop.matches&&ev.target.closest('#detail-focus'))setPane('specimen');});
  document.addEventListener('anatomyready',request);
  window.addEventListener('resize',request);desktop.addEventListener('change',request);
  main.addEventListener('toggle',request,true);main.addEventListener('load',request,true);
  document.fonts?.ready.then(request);observe();request();
}
