import {DoubleSide,Raycaster,Vector2,Vector3} from 'three';
import {mountOrganViewer} from './ap2-organ-viewer.js';
import {addSideGuide} from './ap2-side-guide.js';
import {practicalFamilies,byStation,partForMesh,meshKey} from './ap2-practical-bank.js';
import {newPractical,markStation,practicalScores} from './ap2-practical-session.js';

const skills=['Locate','Trace','Predict'];

const letter=n=>String.fromCharCode(65+n);
export const practicalTotal=run=>practicalScores(run).reduce((a,b)=>a+b,0)+' / '+(3*run.items.length);
export function openScoredPractical(route,{root,page,hero,link,store,e}){
  const go=url=>{if(location.hash==='#'+url)root.osteonAP2(url);else location.hash=url;};
  const date=t=>new Date(t).toLocaleString(undefined,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'});
  const history=(store.read().practicalReports||[]);
  function reports(){
    return history.length?history.map(v=>link('ap2-spotter/result-'+v.id,date(v.submitted)+' · '+practicalTotal(v))).join(''):'<p>Your submitted practicals will appear here.</p>';
  }
  if(route.startsWith('ap2-spotter/result-')){
    const result=history.find(v=>v.id===route.slice('ap2-spotter/result-'.length));
    if(!result){page(hero('A&P II','Practical result unavailable')+link('ap2-spotter','Back to practicals'));return;}
    const scores=practicalScores(result);
    page(hero('A&P II · PRACTICAL RESULT','Anatomy practical',date(result.submitted))+
      '<section class="course-card"><h2>'+practicalTotal(result)+' points</h2><div class="course-actions">'+skills.map((s,i)=>'<strong>'+s+' · '+scores[i]+' / '+result.items.length+'</strong>').join('')+'</div></section>'+
      result.items.map(it=>'<details class="course-card"><summary>'+e(it.title)+' · '+it.result.filter(a=>a.correct).length+' / 3</summary>'+
        it.result.map((r,i)=>'<p><strong>'+skills[i]+' · '+(r.correct?'Correct':'Review')+'</strong> '+e(r.prompt)+'<br>Your answer · '+e(r.chosen)+(r.correct?'':'<br>Expected · '+e(r.expected))+(it.methods[i]==='description'?' · Described view':'')+'</p>').join('')+
        '<p>'+e(it.note)+'</p>'+link('ap2-lesson-'+it.lesson,'Review the specimen')+(it.lesson==='14.1/activity/ossicles'?link('ap2-lesson-16.3/activity/tuning-fork','Interpret air and bone conduction'):'')+'</details>').join('')+link('ap2-spotter','Back to practicals'));
    return;
  }
  const run=store.read().practicalDraft;
  if(route!=='ap2-spotter/run'||!run){
    page(hero('A&P II · LAB EXAM','Scored 3D practical','Locate a structure, trace its connection, and predict what happens. Each task earns one point.')+
      '<div class="course-grid"><article><h2>Take the practical</h2><p>'+practicalFamilies.length+' stations · Two forms per station · Untimed · Saved on this device</p><p>Rotate or tap each unlabeled specimen. You can also use the keyboard or choose a described view. Confirm each response once. Feedback follows submission.</p>'+
      (run?link('ap2-spotter/run','Resume station '+(run.index+1)+' of '+run.items.length,true):'<button class="primary" data-practical-start>Start 3D practical</button>')+
      '</article><article><h2>Completed practicals</h2><div class="course-links">'+reports()+'</div></article></div>'+link('ap2-practicals','Study in the model & slide lab'));
    const button=root.querySelector('[data-practical-start]');
    if(button)button.onclick=()=>{store.update(r=>{r.practicalDraft||=newPractical(practicalFamilies);});go('ap2-spotter/run');};
    return;
  }
  const item=run.items[run.index],spec=byStation(item.station);
  if(!spec){page(hero('A&P II','Specimen unavailable','Your saved responses are on this device. Reopen this practical after updating Osteon.')+link('ap2-spotter','Back to practicals'));return;}
  page('<div class="ap2-exam-header"><div class="eyebrow">A&P II · STATION '+(run.index+1)+' / '+run.items.length+'</div>'+link('ap2-spotter','Save & exit')+'</div>'+
    '<section class="course-card ap2-practical-station"><h1>'+e(spec.title)+'</h1><div class="ap2-practical-layout"><header data-practical-brief><div class="eyebrow"></div><h2 tabindex="-1" id="ap2-practical-prompt"></h2></header><div class="ap2-practical-model-wrap"><div data-practical-model></div><small>'+e(spec.credit)+' · <a target="_blank" rel="noreferrer" href="'+e(spec.source)+'">Specimen credits ↗</a></small></div><section data-practical-task aria-labelledby="ap2-practical-prompt"></section></div></section>');
  const task=root.querySelector('[data-practical-task]');
  const brief=root.querySelector('[data-practical-brief]'),prompt=brief.querySelector('h2'),kicker=brief.querySelector('.eyebrow');
  let api,selected=null,method=null,described=false;
  const meshes=new Map(),context=new Set((spec.context||[]).map(meshKey));
  const step=()=>item.answers.indexOf(null);
  const sourceName=obj=>obj.userData.name||obj.name;
  function paint(){
    if(!api)return;
    for(const [obj,id] of meshes){
      for(const m of [].concat(obj.material)){m.color.set(id===selected?'#f3ba64':'#a8c9ba');m.emissive?.set(id===selected?'#4b3418':'#000000');}
    }
    api.invalidate();
  }
  function select(n,via){
    selected=n;method=via;paint();
    const pick=task.querySelector('[data-part-pick]');if(pick)pick.value=String(n);
    const status=task.querySelector('[data-surface-status]');if(status)status.textContent='Surface '+letter(item.parts.indexOf(n))+' selected.';
    const confirm=task.querySelector('[data-commit]');if(confirm)confirm.disabled=false;
  }
  function drawTask(focus=false){
    const i=step();selected=null;method=null;described=false;paint();
    if(i<0){
      kicker.textContent='';prompt.textContent='Station recorded';
      task.innerHTML='<p>All three responses are saved.</p><button class="primary" data-continue-station>'+(run.index===run.items.length-1?'Submit & see results':'Next specimen →')+'</button>';
      task.querySelector('button').onclick=()=>{
        const last=run.index===run.items.length-1;
        store.update(r=>{
          const draft=r.practicalDraft;if(draft?.id!==run.id||draft.index!==run.index||!draft.items[draft.index].result)return;
          if(last){draft.submitted=Date.now();(r.practicalReports||=[]).unshift(draft);delete r.practicalDraft;}
          else draft.index++;
        });
        if(last)go('ap2-spotter/result-'+run.id);
        else openScoredPractical(route,{root,page,hero,link,store,e});
      };
    }else{
      kicker.textContent=skills[i]+' · '+(i+1)+' / 3';prompt.textContent=i<2?spec.tasks[i].prompt:spec.question;
      task.innerHTML=
        (i<2?'<p>Tap a surface or choose its letter to highlight it in gold.</p><label>Surface <select data-part-pick><option value="">Choose a surface</option>'+item.parts.map((v,j)=>'<option value="'+v+'">'+letter(j)+'</option>').join('')+'</select></label><details data-described><summary>Use anatomical descriptions</summary><ul>'+item.parts.map((v,j)=>'<li><b>'+letter(j)+'</b> · '+e(spec.parts[v].clue)+'</li>').join('')+'</ul></details><p data-surface-status role="status"></p>':
        '<div class="ap2-answers" role="group" aria-label="Prediction">'+item.choices.map(n=>'<button type="button" data-function="'+n+'" aria-pressed="false">'+e(spec.options[n])+'</button>').join('')+'</div>')+
        '<button class="primary" data-commit disabled>Confirm '+skills[i].toLowerCase()+' answer</button>';
      if(i<2){
        task.querySelector('[data-described]').ontoggle=event=>{if(event.currentTarget.open){described=true;if(method)method='description';}};
        task.querySelector('[data-part-pick]').onchange=event=>{
          if(event.target.value!=='')select(+event.target.value,described?'description':'model');
          else{selected=null;paint();task.querySelector('[data-commit]').disabled=true;task.querySelector('[data-surface-status]').textContent='';}
        };
      }else for(const b of task.querySelectorAll('[data-function]'))b.onclick=()=>{
        selected=+b.dataset.function;method='choice';task.querySelector('[data-commit]').disabled=false;
        for(const other of task.querySelectorAll('[data-function]'))other.setAttribute('aria-pressed',String(b===other));
      };
      task.querySelector('[data-commit]').onclick=()=>{
        if(selected===null)return;
        const saved=store.update(r=>{
          const d=r.practicalDraft;if(d?.id!==run.id||d.index!==run.index)return;
          const v=d.items[d.index];if(v.answers[i]!==null)return;
          v.answers[i]=selected;v.methods[i]=method;markStation(v,spec);
        });
        if(saved.practicalDraft?.id!==run.id||saved.practicalDraft.index!==run.index){openScoredPractical(route,{root,page,hero,link,store,e});return;}
        Object.assign(item,saved.practicalDraft.items[run.index]);drawTask(true);
      };
    }
    if(focus)prompt.focus();
  }
  drawTask();
  const dir=new Vector3(...spec.direction).applyAxisAngle(new Vector3(0,1,0),item.angle).toArray();
  mountOrganViewer(root.querySelector('[data-practical-model]'),{asset:'assets/'+spec.asset+'.glb',title:spec.title+' · unlabeled specimen',direction:dir,
    include:(_,obj)=>partForMesh(spec,sourceName(obj))!==-1||context.has(meshKey(sourceName(obj))),colors:()=>'#a8c9ba',
    onLoad(instance){
      api=instance;
      api.model.traverse(obj=>{if(!obj.isMesh||!obj.visible)return;const id=partForMesh(spec,sourceName(obj));
        if(id>=0)meshes.set(obj,id);
        else for(const m of [].concat(obj.material)){m.transparent=true;m.opacity=.14;m.depthWrite=false;m.color.set('#bcb8a8');}
        for(const m of [].concat(obj.material))m.side=DoubleSide;
      });
      paint();
      const canvas=api.renderer.domElement,ray=new Raycaster();let start=null;
      if(['adrenal','pulmonary'].includes(spec.id.replace(/-b$/,'')))addSideGuide(canvas.parentElement,api);
      canvas.addEventListener('pointerdown',event=>{start=event.isPrimary&&event.button===0?[event.clientX,event.clientY]:null;});
      canvas.addEventListener('pointercancel',()=>{start=null;});
      canvas.addEventListener('pointerup',event=>{
        const down=start;start=null;if(!down||step()<0||step()>1||Math.hypot(event.clientX-down[0],event.clientY-down[1])>6)return;
        const rect=canvas.getBoundingClientRect(),objects=[...meshes.keys()];
        const hitAt=(dx,dy)=>{
          ray.setFromCamera(new Vector2((event.clientX-rect.left+dx)*2/rect.width-1,1-(event.clientY-rect.top+dy)*2/rect.height),api.camera);
          return ray.intersectObjects(objects,false)[0];
        };
        let hit=hitAt(0,0);
        // A thin artery or aqueduct can be narrower than a fingertip. Prefer the actual hit;
        // only search nearby screen pixels when a touch would otherwise select empty space.
        if(!hit&&event.pointerType==='touch'){
          for(const radius of [3,6,9]){
            for(let j=0;j<8;j++){
              const angle=j*Math.PI/4;hit=hitAt(radius*Math.cos(angle),radius*Math.sin(angle));if(hit)break;
            }
            if(hit)break;
          }
        }
        if(hit)select(meshes.get(hit.object),described?'description':'model');
      });
    }
  });
}
