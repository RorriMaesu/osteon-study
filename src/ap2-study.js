import {mountLessonFigure} from './lesson-figure.js';
import {springSections} from './tutor-ap3.js';
import {mountGuidedPredictions} from './ap2-guided-predictions.js';
import {bodySystemsHTML,mountBodySystems} from './ap2-body-systems.js';
import {openStructureIndex} from './ap2-model-index.js';
import {openScoredPractical} from './ap2-scored-practical.js';
import {addOrgansToLesson} from './ap2-blood-organ-regions.js';
import {addEntericLesson} from './ap2-enteric-wall.js';
import {evidenceStations,addEvidenceLesson} from './ap2-evidence-labs.js';
import {lessons as fallLessons} from './learning-data.js';
import {chapters,sections,sectionById,labFor,units} from './ap2-library.js';
import figures from './ap2-figures.json' with {type:'json'};
import {openWritingPractice} from './ap2-writing-ui.js';
import {plates} from './ap2-endocrine-plates.js';
import {setLearningContext,setTutorAssessmentMode} from './learning-context.js';
import {rememberAP2Route} from './course-home.js';
import {createRecordsStore,AP2_KEY} from './ap2-records.js';
import {createExamScreens} from './ap2-exams.js';
import {createTermMocks} from './term-mock.js';
import {winterScopes,makeWinterMock} from './term-mock-winter.js';

const atlasLinks = {
  '12.1':['Median nerve.r','Median nerve'], '13.2':['Anterior horn of spinal cord','Anterior horn of the spinal cord'],
  '13.4':['Sciatic nerve.r','Sciatic nerve'], '14.3':['Anterior horn of spinal cord','Anterior horn of the spinal cord'],
  '13.1':['Lateral ventricle.l','left lateral ventricle'], '13.3':['Third ventricle','third ventricle'],
  '14.1':['Optic nerve (II).l','left optic nerve'], '14.2':['Postcentral gyrus.l','left postcentral gyrus'],
  '15.2':['Vagus nerve (X).r','right vagus nerve'], '15.3':['Hypothalamus','hypothalamus'],
  '16.2':['Hippocampus.l','left hippocampus'], '16.4':['Precentral gyrus.r','right precentral gyrus'],
  '17.3':['Hypothalamus','hypothalamus'],
  '15.1':['Sympathetic trunk.r','Sympathetic trunk'], '16.3':['Abducens nerve (VI).r','Abducens nerve']
};
export function initAP2({root,escape:e,toast,dialog}) {
  const indexState={query:'',kind:''};
  let storage; try {storage=localStorage;} catch {}
  const store=createRecordsStore(storage,message=>{
    toast(message);
    const notice=root.querySelector('[data-storage-notice]');
    if(notice){notice.hidden=false;notice.textContent=message+' Use My progress to download a backup before closing this tab.';}
  });
  const link=(route,label,primary=false)=>`<a class="course-link${primary?' course-primary':''}" href="#${e(route)}">${e(label)}</a>`;
  const scopeNav=()=>`<nav class="ap2-nav" aria-label="A&P II workspace">${link('course-2','Chapters')}${link('ap2-practicals','Model & slide lab')}${link('ap2-exams','Exams & results')}${link('ap2-progress','My progress')}</nav>`;
  const page=(body)=>{root.innerHTML=`<div class="course-page ap2-page">${scopeNav()}<p data-storage-notice role="status" ${store.volatile?'':'hidden'}>This tab is keeping your work in memory. Download a backup from My progress before closing it.</p>${body}</div>`;root.scrollTop=0;};
  const hero=(kicker,title,description='')=>`<header class="course-hero"><div class="eyebrow">${e(kicker)}</div><h1 tabindex="-1">${e(title)}</h1>${description?'<p>'+e(description)+'</p>':''}</header>`;
  const mocks=createTermMocks({course:'ap2',root,page,hero,link,e,store,sections:sectionById,scopes:winterScopes,makeForm:makeWinterMock,toast});
  const exams=createExamScreens({root,page,hero,link,store,e,dialog,toast,mocks});
  const chapterComplete=(ch,data)=>ch.sections.filter(s=>data.studied[s.id]).length;
  function resume(data) {
    if (data.draft) return link('ap2-session','Resume · '+data.draft.title,true);
    if (data.resume && data.resume!=='ap2-session') {
      const sec=sectionById.get(data.resume.split('lesson-')[1]?.split('/')[0]);
      if(sec) return link(data.resume,'Continue §'+sec.id+' · '+sec.title,true);
      if(data.resume.startsWith('ap2-report-'))return link(data.resume,'Reopen last exam result');
      const writing=chapters.find(c=>'ap2-writing-'+c.id===data.resume); if(writing)return link(data.resume,'Continue written reasoning · Chapter '+writing.id,true);
      const ch=chapters.find(c=>'ap2-chapter-'+c.id===data.resume); if(ch)return link(data.resume,'Continue Chapter '+ch.id,true);
    }
    return link('ap2-lesson-12.1','Start Chapter 12',true);
  }
  function home() {
    const data=store.read();
    page(hero('STUDY STUDIO · CHAPTERS 12–20','Anatomy & Physiology II','Follow a signal from a neuron to an organ, then follow blood from the heart to the tissues.')+
      `<div class="course-actions">${resume(data)} ${link('ap2-search','Search lessons')} ${link('atlas','Shared 3D Atlas')}</div><div class="ap2-unit-grid">${units.map(unit=>`<article class="course-card"><h2>${e(unit.title)}</h2><div class="ap2-chapter-list">${chapters.filter(ch=>unit.chapters.includes(ch.id)).map(ch=>`<a href="#ap2-chapter-${ch.id}"><b>${ch.id}</b><span>${e(ch.title)}<small>${chapterComplete(ch,data)} of ${ch.sections.length} sections studied</small></span><span aria-hidden="true">→</span></a>`).join('')}</div></article>`).join('')}</div>`);
    setLearningContext({course:'ap2',type:'study',label:'A&P II · Chapters 12–20',text:chapters.map(c=>c.title).join(', ')});
  }
  function practicals(){
    const stations=[
      ['Measure and interpret',evidenceStations.map(s=>[s.section,s.title,s.goal,s.id])],
      ['Neural tissue and pathways', [['12.4','Myelinated axon','Compare signal conduction with intact and damaged myelin.','axon'],['13.2','Spinal cord and roots','Follow sensory input and motor output through a transverse section.','cord'],['13.3','Ventricles and CSF','Rotate the brain specimen, cut sections and test an obstruction.','ventricles'],['14.1','Eye and accommodation','Examine the lens and retina from several views.','eye'],['14.1','Middle-ear ossicles','Follow the bones that transmit vibration.','ossicles'],['14.1','Inner-ear labyrinth','Compare the sensory structures for hearing and balance.','ear'],['14.3','Motor pathways','Trace a motor command to a skeletal muscle.']]],
      ['Autonomic and neurological assessment',[['15.1','Autonomic routes to the heart','Trace each pathway through its ganglion to the pacemaker.','cardiac-autonomic'],['16.3','Pupillary light reflex','Shine light into either eye and localize the interruption.','pupil'],['16.5','Coordination and gait','Use observations from two tasks to explain a finding.']]],
      ['Endocrine and blood',[['17.1','Gland locator','Locate glands relative to nearby structures.'],['17.5','Posterior neck','Find the parathyroids behind the thyroid.','parathyroids'],['17.8','Pelvic endocrine anatomy','Locate the ovaries, testes and placenta in their respective specimens.'],['17.9','Pancreas and islets','Move between gross anatomy and a microscopic section.'],['18.4','Blood smear microscope','Identify cells and tally an unfamiliar mixed field.'],['18.5','Hemostasis','Predict the outcome when adhesion or fibrin formation is impaired.']]],
      ['Heart and circulation',[['19.1','Heart dissection','Inspect the chambers and coronary vessels.'],['19.1','Mitral valve supports','Follow the chordae from the papillary muscles to the leaflets.','supports'],['19.3','Four valves through one beat','Play a beat, then compare valve motion with the pressure traces.','motion'],['20.1','Veins and the calf pump','Track venous return during contraction and release.'],['20.5','Vascular routes','Trace blood through the trunk and limbs.'],['20.6','Fetal circulation','Compare placental and postnatal routes.']]]
    ];
    const groupCard=([title,items])=>'<article class="course-card"><h2>'+e(title)+'</h2><div class="ap2-chapter-list">'+items.map(([id,name,goal,station])=>`<a href="#ap2-lesson-${id}/activity${station?'/'+station:''}"><b>${id}</b><span>${e(name)}<small>${e(goal)}</small></span><span aria-hidden="true">→</span></a>`).join('')+'</div></article>';
    page(hero('A&P II · PRACTICALS','Model & slide lab','Choose a specimen or browse the activities in a textbook chapter.')+
      '<div class="course-actions">'+link('ap2-body','Explore the body systems together',true)+link('ap2-structures','Find a structure')+link('ap2-spotter','Scored 3D practical')+
      '<label>Browse <select data-lab-chapter><option value="">Featured practicals</option>'+
      chapters.map(c=>`<option value="${c.id}">Chapter ${c.id} · ${e(c.title)}</option>`).join('')+
      '</select></label></div><div class="ap2-unit-grid" data-practical-list></div>');
    const select=root.querySelector('[data-lab-chapter]'),list=root.querySelector('[data-practical-list]');
    function listStations(){
      const ch=chapters.find(c=>String(c.id)===select.value);
      const groups=ch?[[ch.title,ch.sections.map(s=>[s.id,s.title,s.objectives[0]])]]:stations;
      list.innerHTML=groups.map(groupCard).join('');
    }
    select.onchange=listStations;listStations();
    setLearningContext({course:'ap2',type:'study',label:'Model and slide practicals',text:'Neural pathways, endocrine anatomy, blood and circulation'});
  }
  function contextForSearch(){setLearningContext({course:'ap2',type:'study',label:'A&P II lesson search',text:''});}
  function search(){
    page(hero('A&P II · STUDY STUDIO','Search lessons')+`<div class="course-card"><label for="ap2-search-text">Topic or anatomical term</label><input type="search" id="ap2-search-text" autocomplete="off" placeholder="Try myelin, pupil, or blood pressure"><label class="ap2-choice"><input type="checkbox" id="ap2-search-both"> Search all three courses</label><div class="ap2-search-results"></div></div>`);
    const field=root.querySelector('#ap2-search-text'),both=root.querySelector('#ap2-search-both'),out=root.querySelector('.ap2-search-results');
    function filter(){
      const words=field.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
      const all=sections.map(s=>({label:s.id+' · '+s.title,route:'ap2-lesson-'+s.id,text:[s.title,...s.objectives,...s.paragraphs].join(' ')}));
      if(both.checked)all.push(...fallLessons.map(l=>({label:'A&P I · '+l.id+' · '+l.title,route:'lesson-'+l.id,text:[l.title,...l.sections.flat()].join(' ')})));
      if(both.checked)all.push(...springSections.map(s=>({label:'A&P III · '+s.id+' · '+s.title,route:'ap3-lesson-'+s.id,text:[s.title,s.objective,s.explanation].join(' ')})));
      const matches=all.filter(s=>words.every(v=>(s.label+' '+s.text).toLowerCase().includes(v)));
      out.innerHTML=`<p role="status">${matches.length} matching entries</p><div class="course-links">${matches.map(s=>link(s.route,s.label)).join('')}</div>`;
    }
    field.oninput=filter;both.onchange=filter;filter();field.focus();
  }
  const featuredOrgan={12:['peripheral-nerve','Watch a nerve impulse'],13:['ventricles','Trace cerebrospinal fluid'],14:['eye','Watch the lens focus'],15:['lacrimal','Follow tears through the lacrimal system'],16:['cranial-nerves','Trace the pupillary light reflex'],17:['thyroid','Watch thyroid hormone release'],18:['formed-elements','Follow oxygen on a red cell'],19:['heart','Watch a heartbeat'],20:['artery','Watch arterial caliber change']};
  function chapter(ch){
    const data=store.read();
    page(hero('A&P II · CHAPTER '+ch.id,ch.title,ch.summary)+`<div class="course-actions">${link('ap2-lesson-'+(ch.sections.find(x=>!data.studied[x.id])||ch.sections[0]).id,'Continue chapter',true)}${link('ap2-structures/chapter-'+ch.id,'Interactive 3D models')}${link('organs/'+featuredOrgan[ch.id][0],featuredOrgan[ch.id][1])}${link('ap2-exams/'+ch.id,'Chapter exam')}${link('ap2-writing-'+ch.id,'Written reasoning')}</div>
    <section class="course-card"><h2>Lessons</h2><div class="ap2-chapter-list">${ch.sections.map(s=>`<a href="#ap2-lesson-${s.id}"><b>${s.id}</b><span>${e(s.title)}<small>${e(s.objectives[0])}</small></span><span>${data.studied[s.id]?'Studied':'→'}</span></a>`).join('')}</div></section>`);
    setLearningContext({course:'ap2',type:'study',label:ch.title,reference:ch.sections[0].id,text:ch.summary});
  }
  function rememberStudy(route){
    rememberAP2Route(route);
    if(store.read().resume!==route)store.update(r=>{r.resume=route;});
  }
  function lesson(s,tab,station) {
    const ch=chapters.find(c=>c.sections.includes(s)),base='ap2-lesson-'+s.id;
    const art=figures.filter(f=>f.section===s.id), plate=plates[s.id];
    const tabs=[['read','Learn'],['activity','Explore'],...(art.length||plate?[['figures','Figures']]:[]),['check','Check recall']];
    if(!tabs.some(t=>t[0]===tab))tab='read';
    setLearningContext({course:'ap2',type:'lesson',reference:s.id,label:s.title,text:s.paragraphs.join(' ')});
    const data=store.read(),studied=!!data.studied[s.id];
    page(`<div class="ap2-breadcrumb">${link('ap2-chapter-'+ch.id,'← Chapter '+ch.id)}<label>Section <select id="ap2-section" aria-label="Choose section">${ch.sections.map(v=>`<option value="${v.id}" ${v.id===s.id?'selected':''}>${v.id} · ${e(v.title)}</option>`).join('')}</select></label></div>`+
      hero('A&P II · SECTION '+s.id,s.title)+
      `<nav class="ap2-tabs" aria-label="Lesson activities">${tabs.map(([key,label])=>`<a href="#${base}${key==='read'?'':'/'+key}" ${key===tab?'aria-current="page"':''}>${label}</a>`).join('')}</nav>
      <section class="course-card ap2-lesson-body"></section><div class="ap2-lesson-footer"><button type="button" data-studied aria-pressed="${studied}">${studied?'✓ Studied':'Mark studied'}</button>
      <a href="${e(s.source)}" target="_blank" rel="noreferrer">Read OpenStax §${s.id} ↗</a><button type="button" data-course-tutor>Ask the tutor</button>
      ${sections[sections.indexOf(s)+1]?link('ap2-lesson-'+sections[sections.indexOf(s)+1].id,'Next section →'):link('ap2-exams','Open exams →')}</div>`);
    const body=root.querySelector('.ap2-lesson-body');
    root.querySelector('#ap2-section').onchange=ev=>{location.hash='ap2-lesson-'+ev.target.value;};
    root.querySelector('[data-studied]').onclick=ev=>{
      const next=store.update(r=>{if(r.studied[s.id])delete r.studied[s.id];else r.studied[s.id]=Date.now();});
      const button=ev.currentTarget;button.textContent=next.studied[s.id]?'✓ Studied':'Mark studied';button.setAttribute('aria-pressed',String(!!next.studied[s.id]));
    };
    root.querySelector('[data-course-tutor]').onclick=()=>document.querySelector('#tutor-launch')?.click();
    if(tab==='read') {
      const atlas=atlasLinks[s.id];
      body.innerHTML=`<div class="ap2-lesson-text"><div>${s.paragraphs.map(p=>'<p>'+e(p)+'</p>').join('')}</div><aside><h2>Learning goals</h2><ul>${s.objectives.map(o=>'<li>'+e(o)+'</li>').join('')}</ul>${atlas?`<a class="course-link" href="?nerve=${encodeURIComponent(atlas[0])}#atlas">Locate ${e(atlas[1])} in 3D</a>`:''}</aside></div>`;
    } else if(tab==='figures') {
      const entries=art.length?art.map(f=>({...f,id:f.figure,src:'assets/ap2-figures/'+f.figure+'.webp'})):
        [{...plate,src:'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(plate.svg)}];
      const selected=Math.max(0,entries.findIndex(f=>f.id===station));
      mountLessonFigure(body,{figures:entries,selected,section:s.id,source:s.source,
        onSelect:i=>{location.hash=base+'/figures/'+entries[i].id;}});
    } else if(tab==='activity') {
      const lab=labFor(s.id),html=lab.renderLab(s.id);
      body.innerHTML=`${html?'<div class="ap2-simulation">'+html+'</div>':''}<div class="ap2-guided"><h2>${e(s.activity.title)}</h2><p>${e(s.activity.prompt)}</p><div class="ap2-step"></div></div>`;
      if(html)lab.mountLab(body.querySelector('.ap2-simulation'),s.id,{store,station});
      addOrgansToLesson(body,s.id,station);
      addEvidenceLesson(body,s.id,station);
      if(s.id==='15.2')addEntericLesson(body,station);
      if((s.id==='17.3'&&station==='pituitary-pathways')||(s.id==='17.6'&&station==='adrenal-layers')||(s.id==='17.7'&&station==='pineal')||(s.id==='18.1'&&station==='elements')){
        if(station==='elements')body.querySelector('[data-formed-lab]').open=true;
        requestAnimationFrame(()=>body.querySelector('[data-micro-stage]')?.scrollIntoView({block:'center',behavior:'instant'}));
      }
      const picker=body.querySelector('[data-neural-station-picker],[data-circulation-station]');
      if(s.id==='20.1'&&['walls','capillaries'].includes(station)&&picker){
        picker.value='tissue';picker.dispatchEvent(new Event('change'));
        const tissue=body.querySelector('[data-vessel-3d]');
        if(tissue){tissue.open=true;const scale=tissue.querySelector('[data-vessel-scale]');scale.value=station;scale.dispatchEvent(new Event('change'));requestAnimationFrame(()=>tissue.querySelector('[data-vessel-stage]')?.scrollIntoView({block:'center'}));}
      }
      if(picker&&station&&[...picker.options].some(o=>o.value===station)){
        picker.value=station;picker.dispatchEvent(new Event('change',{bubbles:true}));
        body.querySelector('[data-neuro-specimen="'+station+'"] [data-load-specimen]')?.click();
        if(s.id==='20.6'&&station==='fetal-flow')requestAnimationFrame(()=>body.querySelector('[data-fetal-view]')?.scrollIntoView({block:'center'}));
      }
      const presets={follicle:['[data-neck-view]','micro'],neck:['[data-neck-view]','anterior'],parathyroids:['[data-neck-view]','posterior'],islet:['[data-scale]','micro'],pancreas:['[data-scale]','gross'],ovary:['[data-gonad]','ovary'],testis:['[data-gonad]','testis'],placenta:['[data-gonad]','placenta']};
      const preset=Object.hasOwn(presets,station)?presets[station]:null;
      if(preset){
        const control=body.querySelector(preset[0]);
        if(control&&control.value!==preset[1]){control.value=preset[1];control.dispatchEvent(new Event('change',{bubbles:true}));}
      }
      if(station&&s.id==='20.5'){
        const view=body.querySelector('[data-cardio-panel="1"] [data-specimen-mode]');
        if(view&&[...view.options].some(o=>o.value===station)){
          body.querySelector('[data-cardio-view="1"]')?.click();
          view.value=station;view.dispatchEvent(new Event('change',{bubbles:true}));
        }
      }
      if((s.id==='19.1'&&station==='supports')||(s.id==='19.3'&&station==='motion')){
        if(station==='motion')body.querySelector('[data-cardio-view="1"]')?.click();
        const view=body.querySelector('[data-organ-kind="heart"] [data-specimen-mode]');
        if(view&&[...view.options].some(o=>o.value===station)){
          view.value=station;view.dispatchEvent(new Event('change',{bubbles:true}));
          requestAnimationFrame(()=>body.querySelector('[data-organ-kind="heart"] [data-organ-host]')?.scrollIntoView({block:'center',behavior:'instant'}));
        }
      }
      const atlas=atlasLinks[s.id];
      if(atlas){
        const context=document.createElement('a');context.className='course-link';
        context.href='?nerve='+encodeURIComponent(atlas[0])+'#atlas';context.textContent='Find '+atlas[1]+' in the whole-body Atlas';
        body.querySelector('.ap2-guided').append(context);
      }
      mountGuidedPredictions(body.querySelector('.ap2-step'),s,store,e);
    } else {
      const indices=s.questions.map((_,i)=>i);
      const first=indices.find(i=>!data.checks[`ap2-${s.id}-q${i+1}`]?.correct)??0;
      function check(i){
        const q=s.questions[i];body.innerHTML=`<p class="eyebrow">RECALL ${i+1} / ${indices.length}</p><h2>${e(q.prompt)}</h2><div class="ap2-answers">${q.choices.map((a,n)=>`<button data-pick="${n}">${e(a)}</button>`).join('')}</div><div class="ap2-recall-feedback" role="status"></div>`;
        for(const b of body.querySelectorAll('[data-pick]'))b.onclick=()=>{
          const correct=Number(b.dataset.pick)===q.answer;
          store.update(r=>{r.checks['ap2-'+s.id+'-q'+(i+1)]={section:s.id,at:Date.now(),correct};});
          for(const v of body.querySelectorAll('[data-pick]')){v.disabled=true;if(+v.dataset.pick===q.answer)v.classList.add('ap2-correct');}
          const out=body.querySelector('.ap2-recall-feedback');out.innerHTML=`<p><strong>${correct?'Correct.':'Review this connection.'}</strong> ${e(q.why)}</p><button>Next recall question →</button>`;
          out.querySelector('button').onclick=()=>check((i+1)%indices.length);
        };
      }check(first);
    }
  }
  const isExam=()=>location.hash==='#ap2-session'&&!!store.read().draft;
  document.addEventListener('viewchange',()=>{if(!location.hash.startsWith('#ap2-')&&!location.hash.startsWith('#course-2')&&document.body.dataset.ap2Exam){delete document.body.dataset.ap2Exam;setTutorAssessmentMode(null);}});
  window.addEventListener('storage',ev=>{if(ev.key===AP2_KEY&&root.classList.contains('active')&&/^#(?:course-2|ap2-)/.test(location.hash))open(location.hash.slice(1));});
  function open(route){
    delete document.body.dataset.ap2Exam;
    setTutorAssessmentMode(null);
    if(mocks.open(route))return;
    const chapterId=route.match(/^ap2-chapter-(\d+)$/)?.[1];
    const lessonId=route.match(/^ap2-lesson-(\d+\.\d+)(?:\/(activity|figures|check)(?:\/([\w.-]+))?)?$/);
    const ch=chapters.find(c=>String(c.id)===chapterId);
    if(ch){rememberStudy(route);chapter(ch);return;}
    if(lessonId&&sectionById.has(lessonId[1])){
      const [,id,tab='read',preset]=lessonId;
      const station=preset&&(tab==='figures'||(tab==='activity'&&/^[\w-]+$/.test(preset)))?preset:undefined;
      rememberStudy('ap2-lesson-'+id+(tab==='read'?'':'/'+tab)+(station?'/'+station:''));
      lesson(sectionById.get(id),tab,station);return;
    }
    const writingId=route.match(/^ap2-writing-(1[2-9]|20)$/)?.[1];
    if(writingId){rememberStudy(route);openWritingPractice(Number(writingId),{root,page,hero,link,store,e});return;}
    const indexRoute=route.match(/^ap2-structures(?:\/chapter-(1[2-9]|20))?$/);
    if(indexRoute){
      if(indexRoute[1]&&(indexState.route!==route||indexState.chapter!==indexRoute[1]))Object.assign(indexState,{chapter:indexRoute[1],kind:'3d',query:''});
      if(!indexRoute[1]&&indexState.route&&indexState.route!==route)Object.assign(indexState,{chapter:'',kind:'',query:''});
      indexState.route=route;
      openStructureIndex({root,page,hero,link,e,state:indexState});setLearningContext({course:'ap2',type:'study',label:'Find a structure',text:'Anatomical specimens, microscopic structures and textbook figures.'});return;
    }
    const bodyRoute=route.match(/^ap2-body(?:\/([\w-]+))?$/);
    if(bodyRoute){
      page(hero('A&P II · MODEL LAB','Body systems in 3D','Compare organs in the same body. Choose a structure to zoom in, then isolate it or keep the neighboring anatomy in view.')+bodySystemsHTML()+link('ap2-lesson-13.2/activity/long-cord','Explore the spinal cord and roots')+link('ap2-practicals','← Model & slide lab'));
      mountBodySystems(root);
      const select=root.querySelector('[data-body-select]');
      if(bodyRoute[1]&&[...select.options].some(o=>o.value===bodyRoute[1])){select.value=bodyRoute[1];select.dispatchEvent(new Event('change'));}
      setLearningContext({course:'ap2',type:'study',label:'Body systems in 3D',text:'Position of the glands, heart chambers, and right lower-limb arteries relative to the skeleton.'});return;
    }
    if(route==='ap2-practicals'){practicals();return;}
    if(/^ap2-spotter(?:\/run|\/result-[\w-]+)?$/.test(route)){
      openScoredPractical(route,{root,page,hero,link,store,e});
      setLearningContext({course:'ap2',type:'study',label:'Scored 3D practical',text:'Independent structure identification, connections and functional prediction.'});
      if(route==='ap2-spotter/run'&&store.read().practicalDraft){document.body.dataset.ap2Exam='true';setTutorAssessmentMode('exam');}
      return;
    }
    if(route==='ap2-search'){contextForSearch();search();return;}
    if(exams.open(route)){
      if(isExam()){document.body.dataset.ap2Exam='true';setTutorAssessmentMode('exam');}
      return;
    }
    home();
  }
  root.osteonAP2=open;
}
