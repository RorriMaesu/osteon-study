import {localAI} from './local-ai.js';
import {setLearningContext,setTutorAssessmentMode} from './learning-context.js';
import {
  scoreTermAttempt,termNotes,termRetestItems,confirmTermWritten,confirmTermMeaning,
  getTermWrittenReview,getTermMeaningReview,refineTermNote,termWrittenFixtures,calibrateTermWritten
} from './term-mock-review.js';

const names={correct:'Correct',equivalent:'Accepted wording',spelling:'Credit with a spelling note',incorrect:'Review',unanswered:'Unanswered',pending:'Needs review',partial:'Partial credit'};
const sourceName={'answer-key':'Answer key','learner':'Self-assessed','local-ai':'Local AI'};
export function createTermReport({db,root,page,hero,e,link,go,route,course,name,makeForm,toast,evidence}){
  let running=null,filter='review',viewId='',message='';
  const onReport=id=>location.hash==='#'+route('result',id);
  function show(id){
    const r=db.get(id);if(!r?.submitted)return;
    const same=viewId===id,openKeys=same?[...root.querySelectorAll('details[data-key][open]')].map(d=>d.dataset.key):[];
    const oldScroll=same?root.scrollTop:0;
    if(!same){filter='review';viewId=id;message='';}
    setTutorAssessmentMode(null);setLearningContext({course,type:'review',label:r.title,text:'Submitted mock exam'});
    const score=scoreTermAttempt(r),notes=termNotes(r);
    const unresolved=[];
    for(const {item,original,grade,suggestion} of score.rows){
      if(item.type==='written'&&grade.pending&&!suggestion)unresolved.push({kind:'written',item:item.id});
      if(item.type!=='written')original.parts.forEach((p,j)=>{if(p.reviewable&&grade.parts[j].pending&&!r.reviews[item.id]?.meanings?.[j])unresolved.push({kind:'meaning',item:item.id,index:j});});
    }
    const rows=score.rows.map((row,i)=>({...row,i})).filter(({grade,item})=>filter==='all'||(filter==='flags'?r.flags[item.id]:grade.earned<grade.possible||grade.status==='spelling'));
    function criteria(row){
      const {item,response,grade,suggestion}=row;
      if(item.type!=='written'||!response)return '';
      const saved=r.reviews[item.id]?.confirmed;
      return '<p><strong>Your explanation</strong> · '+e(response)+'</p>'+
        (suggestion?'<div class="tm-feedback"><strong>'+e(suggestion.model)+' · rubric feedback</strong><p>'+e(suggestion.feedback)+'</p><ul>'+suggestion.components.map((c,j)=>'<li>'+e(item.rubric.criteria.find(k=>k.id===c.id)?.label||String(j+1))+' · '+e(c.decision)+(c.evidence.length?' · “'+e(c.evidence.join('” / “'))+'”':'')+'. '+e(c.reason)+'</li>').join('')+'</ul></div>':'')+
        '<div class="course-actions"><button data-ai-job="written">Review writing with Ollama</button>'+(termWrittenFixtures(item).length?'<button data-ai-job="calibrate">Check model against this rubric</button>':'')+'</div>'+
        '<details><summary>Score with the rubric yourself</summary><form data-rubric>'+(suggestion&&!saved?'<p>The model’s suggested decisions are selected below. Compare each with your answer before saving.</p>':'')+item.rubric.criteria.map(k=>{
          const v=(saved||suggestion)?.components.find(c=>c.id===k.id)?.decision||'';
          return '<label>'+e(k.label)+' · '+k.points+' point'+(k.points===1?'':'s')+'<small>'+e(k.description)+'</small><select required data-criterion="'+e(k.id)+'">'+[['','Choose a decision'],['met','Met'],['missing','Missing'],['contradicted','Contradicted'],['uncertain','Leave pending']].map(([key,text])=>'<option value="'+key+'" '+(key===v?'selected':'')+'>'+text+'</option>').join('')+'</select></label>';
        }).join('')+'<button>Save my rubric review</button></form></details>'+
        (suggestion&&grade.source==='answer-key'?'<p>Model feedback is advisory. Compare the evidence and confirm your rubric decisions to record points.</p>':'');
    }
    const renderRow=row=>{
      const {item,i,grade,original}=row;
      return '<details class="course-card tm-row" data-key="q'+i+'" data-q="'+i+'"><summary>'+ (i+1)+'. '+e(item.prompt)+' <strong>'+e(names[grade.status]||grade.status)+' · '+grade.earned+'/'+grade.possible+'</strong></summary>'+
        evidence(item)+criteria(row)+grade.parts.map((p,j)=>{
          const written=item.type==='written',canReview=original.parts[j]?.reviewable;
          return '<div class="tm-component"><strong>'+e(p.prompt)+'</strong><p>'+(written?'':'Your answer · '+e(p.response||'Unanswered')+'<br>')+'Expected · '+e(p.expected)+'</p><p>'+p.earned+'/'+p.possible+' · '+e(sourceName[p.source||grade.source]||'Answer key')+(p.pending?' · pending':'')+' · '+e(p.reason||'')+'</p>'+
            (canReview?'<div class="course-actions"><button data-ai-job="meaning" data-part="'+j+'">Review wording with Ollama</button><label>Self-assess this term <select data-meaning="'+j+'"><option value="">Choose</option><option value="equivalent">Same meaning</option><option value="incorrect">Different meaning</option><option value="pending">Leave pending</option></select></label></div>':'')+'</div>';
        }).join('')+'<p>'+e(item.why)+'</p><p>Original key · '+original.earned+'/'+original.possible+' points, '+original.pending+' pending'+(r.assisted[item.id]?' · assistance used':'')+'</p><div class="course-actions">'+link(course+'-lesson-'+item.section,'Review §'+item.section)+'<button data-tutor>Discuss with tutor</button></div></details>';
    };
    const concept=notes.filter(n=>n.kind==='concept'),spell=notes.filter(n=>n.kind==='spelling');
    const renderNote=(n)=>{
      const cue=r.cues?.[n.id],itemIndex=r.items.findIndex(q=>q.id===n.itemId);
      return '<details class="tm-note" data-key="n'+itemIndex+'-'+n.partIndex+'" data-q="'+itemIndex+'"><summary>§'+e(n.section)+' · '+e(r.items[itemIndex].parts?.[n.partIndex]?.prompt||r.items[itemIndex].prompt)+'</summary><p>'+e(n.confusion)+'</p><p><strong>Rule</strong> · '+e(n.rule)+'</p><p><strong>Recall</strong> · '+e(n.retrieval)+'</p><p><strong>Card line</strong> · '+e(n.cardDraft)+'</p>'+
        (cue?.basis===n.basis?'<p><strong>Local AI cue</strong> · '+e(cue.coaching)+'</p>':'')+'<button data-ai-job="note" data-part="'+n.partIndex+'">Add a retrieval cue with Ollama</button></details>';
    };
    page(hero(name+' · SAVED MOCK RESULT',r.title,new Date(r.submitted).toLocaleString())+
      '<section class="course-card"><h2>'+score.earned+' / '+score.possible+' points earned</h2><p>'+score.pending+' points pending · '+score.missed+' points missed · '+score.assisted+' questions assisted · '+e(r.mode)+'</p><div class="course-actions">'+link(route(),'Mock exams & saved results')+
      (unresolved.length?'<button data-tm-batch>Review pending answers with Ollama ('+unresolved.length+')</button>':'')+(r.queue?.length?'<button data-tm-resume>Resume AI review</button><button data-tm-cancel>Cancel AI review</button>':'')+'</div><p data-tm-ai-status role="status"></p></section>'+
      '<section class="course-card"><h2>Study notes</h2><p>'+concept.length+' concept notes · '+spell.length+' spelling reminders</p>'+
      (concept.length?'<button data-tm-retest>Retest missed concepts</button><details data-key="concept"><summary>Read concept notes</summary>'+concept.map(renderNote).join('')+'</details>':'')+
      (spell.length?'<details data-key="spelling"><summary>Practice spelling · credit retained</summary>'+spell.map((n,i)=>'<label>'+e(n.retrieval)+'<input data-spell="'+i+'" autocomplete="off"></label><button data-check-spell="'+i+'">Check spelling</button><span role="status" data-spell-status="'+i+'"></span>').join('')+'</details>':'')+'</section>'+
      '<label>Show answers <select data-tm-filter>'+[['review','Missed, pending & spelling'],['flags','Flagged'],['all','All questions']].map(([v,t])=>'<option value="'+v+'" '+(v===filter?'selected':'')+'>'+t+'</option>').join('')+'</select></label>'+
      '<div class="ap2-report-list">'+(rows.map(renderRow).join('')||'<p>No questions in this view.</p>')+'</div>');
    root.querySelector('[data-tm-ai-status]').textContent=message||(running?'Reviewing with Ollama…':r.queue?.length?'A local AI review is queued.':'');
    for(const d of root.querySelectorAll('[data-key]'))if(openKeys.includes(d.dataset.key))d.open=true;
    root.scrollTop=oldScroll;
    root.querySelector('[data-tm-filter]').onchange=ev=>{filter=ev.target.value;show(id);};
    root.querySelector('[data-tm-retest]')?.addEventListener('click',()=>{
      const other=['A','B','C'].filter(f=>f!==r.form);
      const items=termRetestItems(r,other.flatMap(f=>makeForm(r.scope,f)));
      if(!items.length){toast('There are no fresh matching items in the other forms for these notes.');return;}
      const draft=db.start({scope:r.scope,form:other[0],title:'Retest · '+r.title.replace(/^(Retest · )+/,''),mode:'coached',parent:r.id,items});
      go('take',draft.id);
    });
    for(const b of root.querySelectorAll('[data-check-spell]'))b.onclick=()=>{
      const i=+b.dataset.checkSpell,input=root.querySelector('[data-spell="'+i+'"]');
      root.querySelector('[data-spell-status="'+i+'"]').textContent=input.value.trim().toLowerCase()===spell[i].cardDraft.trim().toLowerCase()?'Correct spelling.':'Standard spelling · '+spell[i].cardDraft;
    };
    const itemOf=el=>r.items[+el.closest('[data-q]').dataset.q];
    for(const form of root.querySelectorAll('[data-rubric]'))form.onsubmit=ev=>{
      ev.preventDefault();const q=itemOf(form);
      const decisions=Object.fromEntries([...form.querySelectorAll('[data-criterion]')].map(el=>[el.dataset.criterion,el.value]));
      const review=confirmTermWritten(q,r.answers[q.id],id,decisions);
      db.update(id,'submitted',d=>{(d.reviews[q.id]||={}).confirmed=review;});show(id);
    };
    for(const sel of root.querySelectorAll('[data-meaning]'))sel.onchange=()=>{
      if(!sel.value)return;const q=itemOf(sel),j=+sel.dataset.meaning;
      const result=confirmTermMeaning(q,j,r.answers[q.id][j],id,sel.value);
      db.update(id,'submitted',d=>{const v=d.reviews[q.id]||={};(v.manualMeanings||={})[j]=result;});show(id);
    };
    for(const btn of root.querySelectorAll('[data-tutor]'))btn.onclick=()=>{
      const q=itemOf(btn),row=score.rows.find(v=>v.item.id===q.id);
      setLearningContext({course,type:'review',label:'Mock exam · §'+q.section,reference:q.section,text:q.why,
        review:{prompt:q.prompt,response:q.type==='written'?row.response:row.grade.parts.map(p=>p.response).join(' / '),expected:row.grade.parts.map(p=>p.expected).join(' / '),why:q.why}});
      document.querySelector('#tutor-launch')?.click();
    };
    const queue=jobs=>{
      if(running){toast('A local review is already running.');return;}
      db.update(id,'submitted',d=>{d.queue=jobs;});kick(id,true);
    };
    for(const b of root.querySelectorAll('[data-ai-job]'))b.onclick=()=>queue([{kind:b.dataset.aiJob,item:itemOf(b).id,index:Number(b.dataset.part)||0}]);
    root.querySelector('[data-tm-batch]')?.addEventListener('click',()=>queue(unresolved));
    root.querySelector('[data-tm-resume]')?.addEventListener('click',()=>kick(id,true));
    root.querySelector('[data-tm-cancel]')?.addEventListener('click',()=>{
      running?.abort();db.update(id,'submitted',d=>{delete d.queue;});message='Review canceled. Your answers are saved.';show(id);
    });
  }
  async function kick(id,setup=false){
    if(running||!onReport(id)||!db.get(id)?.queue?.length)return;
    if(!localAI.state.ready){
      if(setup){message='Choose and test a local model. Review will continue on this result.';show(id);document.dispatchEvent(new CustomEvent('localaiopen',{detail:{returnToReview:true}}));}
      return;
    }
    const controller=new AbortController();running=controller;
    try{
      while(onReport(id)&&!controller.signal.aborted){
        const r=db.get(id),job=r?.queue?.[0];if(!job)break;
        const q=r.items.find(it=>it.id===job.item);
        if(!q)throw new Error('The saved question is unavailable.');
        message='Ollama is reviewing §'+q.section+' · '+r.queue.length+' remaining.';show(id);
        const options={signal:controller.signal},raw=r.answers[q.id];
        let result,note;
        if(job.kind==='written')result=await getTermWrittenReview(q,raw,id,options);
        else if(job.kind==='meaning')result=await getTermMeaningReview(q,job.index,raw[job.index],id,options);
        else if(job.kind==='calibrate')result=await calibrateTermWritten(q,options);
        else if(job.kind==='note'){
          note=termNotes(r).find(n=>n.itemId===q.id&&n.partIndex===job.index);
          if(note)result=await refineTermNote(r,note,options);
        }
        controller.signal.throwIfAborted();
        db.update(id,'submitted',d=>{
          if(JSON.stringify(d.queue?.[0])!==JSON.stringify(job))return;
          const record=d.reviews[q.id]||={};
          if(job.kind==='written')record.written=result;
          if(job.kind==='meaning')(record.meanings||={})[job.index]=result;
          if(job.kind==='note'&&note&&result)(d.cues||={})[note.id]=result;
          d.queue.shift();if(!d.queue.length)delete d.queue;
        });
        message=job.kind==='calibrate'?(result.passed?'The model passed the checks for this rubric. Review the writing to apply it.':'The model did not pass all checks. Its feedback is advisory.'):'Local review saved.';
      }
    }catch(err){if(!controller.signal.aborted)message=err.message||'Review paused. Your answers are saved.';}
    finally{running=null;if(onReport(id))show(id);}
  }
  localAI.subscribe(state=>{
    const [,action,id]=location.hash.split('/');
    if(state.ready&&action==='result'&&onReport(id))kick(id);
  });
  return {show};
}
