import {courseRouteLabel} from './course-home.js';
import {setLearningContext} from './learning-context.js';
import {bodyMaps,mapForKey,mapRoute,mappedActions,locationForEntry} from './organ-atlas-bodies.js';
import {organMotions,motionById,phaseStart,currentPhase,sourceCredits} from './organ-atlas-catalog.js';
import {mountBodyMap,mountCloseup} from './organ-atlas-scene.js';
import {organStructureName} from './organ-structure-names.js';
import {mountMechanismPanel} from './organ-mechanism-panel.js';
import {filtrationReading} from './organ-mechanism-signals.js';
import {makeCourseSearch} from './ap2-term-search.js';

const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const link=(id,text)=>'<a class="oa-link" href="#'+escape(id)+'">'+escape(text)+'</a>';
const options=(rows,selected)=>rows.map(([value,label])=>'<option value="'+escape(value)+'"'+(value===selected?' selected':'')+'>'+escape(label)+'</option>').join('');
const cowperReference='<a class="oa-link" href="https://pmc.ncbi.nlm.nih.gov/articles/PMC8373982/" target="_blank" rel="noreferrer">Bulbourethral glands · illustrated human anatomy ↗</a>';
const titleSort=(a,b)=>a.localeCompare(b);
const searchableMotions=organMotions.map(entry=>{
  const parts=[...new Set([...entry.targets,...entry.context||[],...entry.studyOnly||[]])].map(raw=>({raw,title:organStructureName(entry.id,raw)}));
  return {title:entry.title,entry,parts,text:[entry.action,entry.system,...(entry.aliases||[]),...(entry.bodyIds||[]),...parts.map(p=>p.title)].join(' ')};
});
const searchMotions=makeCourseSearch(searchableMotions);

export function initOrganAtlas(root){
  let dispose=null,query='',system='',returnRoute='',lastMap='';
  function close(){dispose?.();dispose=null;root.replaceChildren();}
  document.addEventListener('viewchange',ev=>{if(ev.detail!=='organs'&&root.childElementCount)close();});

  function open(route,from){
    if(from&&!from.startsWith('organs')){
      lastMap='';
      returnRoute=/^ap[23]-(?:chapter-|specimen-|lesson-|lab-|structures|body|practicals)[\w./-]*$/.test(from)?from:'';
    }
    close();
    const [,id,bodyId,partId]=route.split('/');
    const entry=motionById.get(id);
    const map=mapForKey(id)||bodyMaps[0];
    const atlasRow=id=>map.organs.find(b=>b.id===id);
    const initialBody=atlasRow(bodyId);
    const initialPart=partId&&initialBody?.targets.find(raw=>encodeURIComponent(raw)===partId||raw===partId);
    if(!entry)lastMap=mapRoute(map,initialBody,initialPart);
    const systemNames=[...new Set(organMotions.map(e=>e.system))].sort(titleSort);
    const region=entry?.system||'',systemFilter=systemNames.includes(system)?system:'';
    if(entry&&systemFilter&&region!==systemFilter)system='';
    root.innerHTML='<div class="oa-page"><header class="oa-header"><div>'+(returnRoute?link(returnRoute,'← '+courseRouteLabel(returnRoute)):link('atlas','← 3D Atlas'))+'<h1>Organ atlas</h1></div><a class="oa-link" href="model-review/">Model guide</a><a class="oa-link" href="assets/organ-atlas/SOURCES.md" target="_blank" rel="noreferrer">Model credits ↗</a></header>'+
      '<div class="oa-work"><aside class="oa-browser" data-detail data-compact><button type="button" class="oa-find" data-oa-find aria-expanded="false" aria-controls="oa-search-filter oa-system-filter">Find an organ</button><label id="oa-search-filter">Find an organ<input data-oa-search type="search" placeholder="Search by organ or process" autocomplete="off"></label>'+
      '<label id="oa-system-filter">System<select data-oa-system>'+options([['','All systems'],...systemNames.map(s=>[s,s])],system)+'</select></label>'+
      '<label><span class="oa-menu-name">Animated organ</span><select aria-label="Animated organ" data-oa-menu></select></label><div class="oa-count" role="status" data-oa-count></div><div data-oa-list class="oa-list" aria-label="Organ animations"></div></aside>'+
      '<section class="oa-content"><header class="oa-title"><div><small>'+escape(entry?entry.system+' · '+entry.kind:map.description)+'</small><h2 tabindex="-1">'+escape(entry?entry.title:map.title)+'</h2></div>'+
      (entry?link(lastMap||'organs',lastMap?'Back to body map':'Whole body'):'')+'</header><div class="oa-model" data-oa-model></div><section class="oa-lesson" data-oa-lesson></section></section></div></div>';
    const get=k=>root.querySelector('[data-oa-'+k+']');
    const search=get('search'),systemSelect=get('system'),menu=get('menu'),list=get('list'),count=get('count'),lesson=get('lesson'),host=get('model');
    search.value=query;
    const browser=search.closest('.oa-browser'),find=get('find');
    function revealSearch(){browser.removeAttribute('data-compact');find.setAttribute('aria-expanded','true');find.textContent='Hide filters';search.focus();}
    find.onclick=()=>{if(browser.hasAttribute('data-compact')){revealSearch();return;}browser.setAttribute('data-compact','');find.setAttribute('aria-expanded','false');find.textContent='Find an organ';};
    root.onkeydown=e=>{if(e.key==='/'&&!['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName)){e.preventDefault();e.stopPropagation();revealSearch();}};
    function filter(){
      const words=query.toLowerCase().trim().split(/\s+/).filter(Boolean);
      const result=searchMotions(query,row=>!system||row.entry.system===system);
      const term=(result.suggestion||query).trim().toLowerCase();
      const rows=result.items.map(({entry,parts})=>{
        const match=term&&parts.find(p=>p.title.toLowerCase()===term);
        return {entry,route:entry.id+(match?'/part/'+encodeURIComponent(match.raw):''),label:match?.title||entry.action};
      });
      menu.innerHTML=options([['','Choose an animation'],...rows.map(r=>[r.route,r.entry.title+' · '+r.label])],rows.find(r=>r.entry===entry)?.route);
      menu.disabled=!rows.length;
      list.innerHTML=rows.map(r=>'<a href="#organs/'+escape(r.route)+'" '+(r.entry===entry?'aria-current="page"':'')+'><b>'+escape(r.entry.title)+'</b><span>'+escape(r.label)+'</span></a>').join('');
      count.textContent=rows.length?(result.suggestion?'Showing matches for “'+result.suggestion+'” · ':'')+rows.length+' animations':'No matches. Try a shorter name or change system.';
      if((!system||system==='Reproductive')&&words.some(word=>/^(?:bulbo|cowper)/.test(word)))count.innerHTML='Illustrated reference available. The gland ducts still need a verified 3D model. '+cowperReference;
    }
    filter();search.oninput=()=>{query=search.value;filter();};systemSelect.onchange=()=>{system=systemSelect.value;filter();};
    menu.onchange=()=>{if(menu.value)location.hash='organs/'+menu.value;};
    if(entry){
      const locationRow=locationForEntry(entry);
      const related=locationRow?.row?mappedActions(locationRow.map,locationRow.row).filter(action=>action!==entry):[];
      lesson.innerHTML='<div class="oa-transport"><button type="button" data-oa-play disabled>▶ Play</button><button type="button" data-oa-back aria-label="Previous phase">←</button><label><span class="oa-sr">Animation position</span><input data-oa-time type="range" min="0" max="1000" step="1" value="0"></label><button type="button" data-oa-next aria-label="Next phase">→</button><label class="oa-check"><input data-oa-loop type="checkbox"> Loop</label></div>'+
        '<div data-oa-phase class="oa-phase"></div><details class="oa-notes"><summary>'+escape(entry.action)+' · '+escape(entry.kind)+'</summary><p>'+escape(entry.description)+'</p>'+(entry.context?.length?'<label class="oa-check"><input data-oa-context type="checkbox" checked> Show surrounding anatomy</label>':'')+'<div class="oa-links">'+
        (['prostate','urethra'].includes(entry.id)?cowperReference+' ':'')+(locationRow?link(mapRoute(locationRow.map,locationRow.row),'Locate on reference'):'')+' <a href="'+escape(entry.source)+'" target="_blank" rel="noreferrer">Physiology reference ↗</a> <a href="'+escape(entry.credits||sourceCredits(entry.asset))+'" target="_blank" rel="noreferrer">Specimen credits ↗</a></div>'+(related.length?'<div class="oa-links oa-related"><strong>Related animations</strong> '+related.map(other=>link('organs/'+other.id,other.action)).join(' ')+'</div>':'')+'</details>';
      let t=0,phase=-1,frame=0,previous=0,playing=false,controller=null;
      const play=get('play'),slider=get('time'),prev=get('back'),next=get('next'),phaseText=get('phase');
      const runSeconds=entry.duration||7;
      let lastCaption='';
      const companion=mountMechanismPanel(lesson,entry,{
        pause,seek,toggle:()=>play.click(),playing:()=>playing,posterior:()=>{
          const orientation=host.querySelector('[data-orientation]');
          orientation.value='reverse';orientation.dispatchEvent(new Event('change'));
        }
      });
      function render(position){
        t=Math.min(1,Math.max(0,position));slider.value=String(Math.round(t*1000));controller?.frame(t,companion?.particle);
        const idx=currentPhase(entry,t);
        const step={...entry.phases[idx]};
        if(entry.id==='glomerular-filtration'){
          const reading=filtrationReading(companion.particle,t);
          step.text=reading.text;
          if(reading.particle.limit<1&&t>=reading.particle.limit)step.label='Retained in capillary blood';
        }
        companion?.update(t,idx,playing&&t<1);
        if(idx!==phase||step.text!==lastCaption){
          phase=idx;lastCaption=step.text;
          setLearningContext({type:'study',label:entry.title+' · '+step.label,text:[entry.action,entry.description,step.text].join(' '),source:entry.source});
          phaseText.innerHTML='<b>'+escape(step.label)+'</b><span>'+escape(step.text)+'</span>';
          slider.setAttribute('aria-valuetext','Phase '+(idx+1)+' of '+entry.phases.length+' · '+step.label);
        }
        prev.disabled=t===0;next.disabled=t>=phaseStart(entry,entry.phases.length-1);
      }
      function pause(){
        playing=false;previous=0;cancelAnimationFrame(frame);frame=0;
        play.textContent=t>=1?'↻ Replay':'▶ Play';play.setAttribute('aria-pressed','false');
      }
      function tick(now){
        if(!playing)return;
        const elapsed=previous?Math.min(.12,(now-previous)/1000):0;previous=now;
        const target=t+elapsed/runSeconds;
        if(target>=1&&!get('loop').checked){render(1);pause();return;}
        render(target>1?target%1:target);frame=requestAnimationFrame(tick);
      }
      play.onclick=()=>{
        if(playing){pause();return;}
        if(t>=1)render(0);
        playing=true;previous=0;play.textContent='Ⅱ Pause';play.setAttribute('aria-pressed','true');frame=requestAnimationFrame(tick);
      };
      function seek(value){pause();render(value);pause();}
      slider.oninput=()=>seek(+slider.value/1000);
      prev.onclick=()=>seek(t-phaseStart(entry,phase)>.015?phaseStart(entry,phase):phaseStart(entry,Math.max(0,phase-1)));
      next.onclick=()=>seek(phaseStart(entry,Math.min(entry.phases.length-1,phase+1)));
      const visibility=()=>{if(document.hidden)pause();};
      document.addEventListener('visibilitychange',visibility);
      const requestedStep=/^step-(\d+)$/.exec(bodyId||'');
      const firstStep=requestedStep?Number(requestedStep[1])-1:0;
      render(entry.phases[firstStep]?phaseStart(entry,firstStep):0);
      const contextToggle=get('context');
      if(contextToggle)contextToggle.onchange=()=>controller?.showContext(contextToggle.checked);
      const viewer=mountCloseup(host,entry,ready=>{
        controller=ready;if(contextToggle&&!contextToggle.checked)ready.showContext(false);render(t);
        if(bodyId==='part'&&partId){
          const raw=searchableMotions.find(row=>row.entry===entry)?.parts.find(part=>part.raw===partId||encodeURIComponent(part.raw)===partId)?.raw;
          if(raw)ready.selectSurface(raw);
        }
        play.disabled=false;
      });
      dispose=()=>{pause();document.removeEventListener('visibilitychange',visibility);companion?.dispose();viewer.dispose();};
    }else{
      const rows=map.organs.slice().sort((a,b)=>titleSort(a.label,b.label));
      const groups=[...new Set(rows.map(r=>r.system))].sort(titleSort);
      lesson.innerHTML='<div class="oa-body-controls"><button type="button" class="oa-settings-button" data-oa-settings aria-expanded="false" aria-controls="oa-map-layers">Map settings</button><div class="oa-map-settings" id="oa-map-layers"><label>Preparation<select data-oa-map>'+options(bodyMaps.map(m=>[m.key,m.label]),map.key)+'</select></label><label>Visible system<select data-oa-body-system>'+options([['','All systems'],...groups.map(s=>[s,s])])+'</select></label>'+((map.skeletonAsset||map.boneNames)?'<label class="oa-check"><input data-oa-bones type="checkbox" checked> Skeleton</label>':'')+'</div><label>Locate in body<select data-oa-locate></select></label><button data-oa-focus disabled>Focus organ</button></div><div class="oa-body-pick" data-oa-pick aria-live="polite">Select an organ on the body or choose its name.</div>';
      const settings=get('settings');
      function toggleSettings(open){settings.setAttribute('aria-expanded',String(open));settings.parentElement.classList.toggle('oa-settings-open',open);}
      settings.onclick=()=>toggleSettings(settings.getAttribute('aria-expanded')!=='true');
      settings.parentElement.addEventListener('keydown',ev=>{if(ev.key==='Escape'&&settings.getAttribute('aria-expanded')==='true'){ev.stopPropagation();toggleSettings(false);settings.focus();}});
      const picker=get('locate'),group=get('body-system'),picked=get('pick'),focus=get('focus');
      let current=initialBody,currentPart=initialPart,scene,ready=false;
      function populate(){picker.innerHTML=options([['','Choose an organ'],...rows.filter(r=>!group.value||r.system===group.value).map(r=>[r.id,r.label])],current?.id);}
      function select(organ,part){
        current=organ||null;currentPart=part||null;picker.value=organ?.id||'';scene?.select(organ?.id,currentPart);focus.disabled=!organ||!ready||!scene?.has(organ.id);
        const title=part?organStructureName(map.key,part):organ?.label;
        focus.textContent=part?'Focus part':'Focus organ';
        setLearningContext({type:'study',label:title||map.title,text:map.description+(organ?' · '+organ.system+' · '+organ.label:'')});
        if(!organ){picked.textContent='Select an organ on the body or choose its name.';return;}
        const actions=mappedActions(map,organ);
        if(part)actions.sort((a,b)=>Number(b.targets.includes(part))-Number(a.targets.includes(part)));
        picked.innerHTML='<strong>'+escape(title)+'</strong> '+actions.map(e=>link('organs/'+e.id,'▶ '+e.action)).join(' ');
      }
      function pickOrgan(organ,part){
        select(organ,part);lastMap=mapRoute(map,organ,part);
        history.replaceState(history.state,'','#'+lastMap);
      }
      populate();select(initialBody,initialPart);
      scene=mountBodyMap(host,map,{onPick:pickOrgan,onReady:()=>{ready=true;select(current,currentPart);},onLayerError:message=>{picked.textContent=message;}});
      get('map').onchange=e=>{location.hash=mapRoute(mapForKey(e.target.value));};
      picker.onchange=()=>pickOrgan(atlasRow(picker.value));
      group.onchange=()=>{pickOrgan(null);scene.setSystem(group.value);populate();};
      focus.onclick=()=>scene.focus();if(get('bones'))get('bones').onchange=e=>scene.showSkeleton(e.target.checked);
      dispose=()=>scene.dispose();
    }
  }
  return {open,find(){const search=root.querySelector('[data-oa-search]');if(search?.closest('[data-compact]'))root.querySelector('[data-oa-find]').click();else search?.focus();}};
}
