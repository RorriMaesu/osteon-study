import {getProgress,practiceSpelling} from './storage.js';
import {spellingId,spellingDiff} from './spelling-data.js';
import {fold} from './typed-answer.js';
import {setLearningContext} from './learning-context.js';
export function spellingDeck(rows=null,{dueOnly=false,now=Date.now()}={}){const cards=Object.entries(getProgress().spellings||{}).map(([id,c])=>({id,...c})),ids=rows?new Set(rows.filter(r=>r.outcome.status==='spelling').map(r=>spellingId(r.outcome.correction))):null;return cards.filter(c=>(!ids||ids.has(c.id))&&(!dueOnly||c.due<=now)).sort((a,b)=>a.due-b.due);}
export function startSpellingReview({root,cards,onExit,exitLabel='Back to results',escape:e}){
 let index=0,phase='compare',feedback='',attempted=false,lastValue='',practiced=0,deferred=0;
 const paint=()=>{
  setLearningContext({type:'study',label:'Spelling practice',text:'Separate spelling practice after the exam. Exam responses and scores stay saved.'});
  if(index>=cards.length){root.innerHTML=`<div class="section-intro"><div><div class="eyebrow">SPELLING / REVIEW COMPLETE</div><h1>A little more <em>familiar.</em></h1><p>${practiced} practiced · ${deferred} set aside for later. Your exam score is unchanged.</p></div><button id="spelling-exit">${e(exitLabel)}</button></div><div class="learning-panel spelling-complete"><p>Correctly retrieved spellings return on a later day. Words that need another try return sooner.</p></div>`;root.querySelector('#spelling-exit').onclick=onExit;return;}
  const card=cards[index],diff=spellingDiff(card.originalResponse,card.term),highlight=(parts,tag)=>parts.map(p=>p.changed?`<${tag}>${e(p.text)}</${tag}>`:e(p.text)).join('');
  root.innerHTML=`<div class="section-intro"><div><div class="eyebrow">SPELLING / ${index+1} OF ${cards.length}</div><h1>Know it. <em>Spell it.</em></h1><p>This practice strengthens the term. It does not change your exam result.</p></div><button id="spelling-exit">Save & exit review</button></div><div class="learning-panel spelling-workspace"><div class="spelling-card">${phase==='compare'?`<span class="pill">Anatomy credit retained</span><p class="tiny">Your original entry</p><p class="spelling-word spelling-original">${highlight(diff.before,'del')}</p><p class="tiny">Standard spelling · highlighted letters changed</p><p class="spelling-word">${highlight(diff.after,'mark')}</p><p>Compare the letters, then hide the term and retrieve it once.</p><button class="primary" id="spelling-try">Hide & try from memory</button>`:`<label for="spelling-input">Type the term from memory</label><form id="spelling-form"><input id="spelling-input" maxlength="300" autocomplete="off" spellcheck="false" value="${attempted?e(lastValue):''}" ${attempted?'disabled':''}><button class="primary" ${attempted?'disabled':''}>Check spelling</button></form><div id="spelling-feedback" aria-live="polite">${feedback}</div>${attempted?'<button class="primary" id="spelling-next">Next word ↗</button>':''}`}<div class="control-row">${!attempted?'<button id="spelling-later">Review later</button>':''}${phase==='try'&&!attempted?'<button id="spelling-show">Show the spelling again</button>':''}</div><p class="tiny">${card.reference?'OpenStax §'+e(card.reference)+' · ':''}Spelling practice is tracked separately from anatomy accuracy.</p></div></div>`;
  root.querySelector('#spelling-exit').onclick=onExit;
  if(root.querySelector('#spelling-later'))root.querySelector('#spelling-later').onclick=()=>{practiceSpelling(card.id,'',false,{later:true});deferred++;next();};
  if(phase==='compare')root.querySelector('#spelling-try').onclick=()=>{phase='try';feedback='';attempted=false;paint();root.querySelector('#spelling-input').focus();};
  else{
   const show=root.querySelector('#spelling-show');if(show)show.onclick=()=>{phase='compare';paint();};
   root.querySelector('#spelling-form').onsubmit=ev=>{ev.preventDefault();const value=root.querySelector('#spelling-input').value;if(!value.trim()||attempted)return;attempted=true;lastValue=value;const correct=fold(value)===fold(card.term);practiceSpelling(card.id,value,correct);if(correct)practiced++;else deferred++;feedback=`<div class="feedback ${correct?'':'wrong'}"><strong>${correct?'Retrieved correctly.':'A little more practice.'}</strong><p>${correct?'Standard spelling: ':'You wrote '+e(value)+'. Standard spelling: '}<b>${e(card.term)}</b>.</p><p class="tiny">${correct?'Scheduled for a later day.':'Scheduled to return sooner.'} Your exam score stays the same.</p></div>`;paint();};
   if(root.querySelector('#spelling-next'))root.querySelector('#spelling-next').onclick=next;
  }
 };
 function next(){index++;phase='compare';feedback='';attempted=false;lastValue='';paint();}
 paint();
}
