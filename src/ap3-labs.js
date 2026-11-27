import { absorption, digestiveRoutes, drainage, nephron, sperm } from './ap3-labs-routes.js';
import { antibody, breathing, ventilation, spirometry, fedFast, heat, excretion, waterShift } from './ap3-labs-experiments.js';
import { acidBase, lymphTissue, foodEnergy, ovarian, development, birth, pedigree } from './ap3-labs-evidence.js';
import { intestinalTissue, gasSurface, gonadField, cleavageFields } from './ap3-labs-fields.js';
import { springLabTutorContext } from './ap3-labs-tutor.js';
import { collectingDuct,renderCollectingDuct } from './ap3-labs-kidney.js';
import { renderMechanismTransfer,mountMechanismTransfer } from './mechanism-transfer.js';
import { getTutorAssessmentMode } from './learning-context.js';

export const chapterLabs = {
  21: [drainage, lymphTissue, antibody],
  22: [breathing, ventilation, spirometry, gasSurface],
  23: [absorption, digestiveRoutes, intestinalTissue],
  24: [fedFast, heat, foodEnergy],
  25: [nephron, excretion, collectingDuct],
  26: [waterShift, acidBase],
  27: [ovarian, sperm, gonadField],
  28: [development, birth, pedigree, cleavageFields],
};

function escapeText(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

function renderTable({ caption, headers, rows }) {
  return '<div class="ap2-table-wrap"><table><caption>'+escapeText(caption)+'</caption><thead><tr>'+
    headers.map(h=>'<th scope="col">'+escapeText(h)+'</th>').join('')+'</tr></thead><tbody>'+
    rows.map(row=>'<tr>'+row.map(cell=>'<td>'+escapeText(cell)+'</td>').join('')+'</tr>').join('')+
    '</tbody></table></div>';
}

// Show measurements only at observed times and preserve their true spacing.
// The adjacent HTML table supplies the same values to screen-reader users.
export function renderPlot({ x, y, rows, ymax, series, frameTimes, measureExtrema }, cursor = -1, marks={}) {
  const left=56, right=390, top=20, bottom=130;
  const xmin=rows[0][0], xmax=rows.at(-1)[0];
  const measured=rows.flatMap(r=>r.slice(1)), min=Math.min(0,...measured);
  const max=ymax ?? Math.max(0,...measured);
  const px=v=>left+(right-left)*(v-xmin)/(xmax-xmin||1);
  const py=v=>bottom-(bottom-top)*(v-min)/(max-min||1);
  const ticks=min<0?[min,0,max]:[0,max/2,max];
  const labels=series||[y];
  const dashes=['','7 3','2 3'];
  const colors=['currentColor','#578cd0','#ba7e3c'];
  const lines=labels.map((_,index)=>{
    const points=rows.map(r=>px(r[0])+','+py(r[index+1])).join(' ');
    return '<polyline points="'+points+'" fill="none" stroke="'+colors[index]+'" stroke-width="2.4" stroke-dasharray="'+dashes[index]+'"/>'+
      rows.map((r,i)=>{
        const cx=px(r[0]),cy=py(r[index+1]);
        const marked=measureExtrema&&(i===marks.peak||i===marks.trough);
        return '<circle cx="'+cx+'" cy="'+cy+'" r="'+(marked?'5':'2.8')+'" fill="'+colors[index]+'"/>'+
          (measureExtrema?'<circle data-ap3-point="'+i+'" cx="'+cx+'" cy="'+cy+'" r="11" fill="transparent" style="cursor:pointer"/>':'');
      }).join('');
  }).join('');
  const time=frameTimes?frameTimes[cursor]:rows[cursor]?.[0];
  const marker=time===undefined?'':'<path data-event-time="'+time+'" d="M'+px(time)+' '+top+' V'+bottom+'" stroke="currentColor" stroke-width="1" stroke-dasharray="3 3" pointer-events="none"/>';
  return '<figure class="ap3-lab-plot"><figcaption>'+escapeText(y)+' by '+escapeText(x)+'</figcaption>'+
    '<svg aria-hidden="true" viewBox="0 0 408 170" style="display:block;width:100%;max-width:680px;height:auto"><g font-family="system-ui,sans-serif" font-size="11" fill="currentColor">'+
    '<path d="M'+left+' '+top+' V'+bottom+' H'+right+'" fill="none" stroke="currentColor"/>'+
    (min<0?'<path d="M'+left+' '+py(0)+' H'+right+'" stroke="currentColor" opacity=".45"/>':'')+
    [...new Set(ticks)].map(v=>'<text x="'+(left-8)+'" y="'+(py(v)+4)+'" text-anchor="end">'+v+'</text>').join('')+
    rows.map(r=>'<text x="'+px(r[0])+'" y="'+(bottom+15)+'" text-anchor="middle">'+r[0]+'</text>').join('')+
    '<text x="218" y="165" text-anchor="middle">'+escapeText(x)+'</text>'+lines+marker+'</g></svg>'+
    (series?'<small>'+series.map((s,i)=>escapeText(s)+' ('+['solid','long dash','short dash'][i]+')').join(' · ')+'</small>':'')+'</figure>';
}

function selectOptions(values, selected=0) {
  return values.map((value,i)=>'<option value="'+i+'"'+(i===selected?' selected':'')+'>'+escapeText(value)+'</option>').join('');
}

function renderField(media) {
  const [fullWidth,fullHeight]=media.size;
  const url='assets/ap3-figures/'+media.figure+'.webp';
  return '<figure class="ap3-lab-field"><svg role="img" aria-label="'+escapeText(media.description)+
    '" viewBox="'+media.box.join(' ')+'" style="display:block;width:100%;max-width:480px;height:auto">'+
    '<image href="'+url+'" x="0" y="0" width="'+fullWidth+'" height="'+fullHeight+'"/></svg>'+
    '<figcaption>'+escapeText(media.kind)+' · OpenStax, Anatomy and Physiology 2e, figure '+media.figure+
    '. '+escapeText(media.credit)+' <a href="#ap3-lesson-'+media.section+'/figures/'+media.figure+'">Full figure and attribution</a></figcaption></figure>';
}

function defaults(activity) {
  return Object.fromEntries((activity.controls||[]).map(control=>[control.key,control.initial??0]));
}

function makeState(list, activityIndex = 0, settings={}) {
  activityIndex = Number(activityIndex);
  if(!Number.isInteger(activityIndex) || !list[activityIndex]) activityIndex = 0;
  const activity=list[activityIndex];
  const values=defaults(activity);
  for(const control of activity.controls||[]){
    const value=settings[control.key];
    const allowed=control.labels?Number.isInteger(value)&&value>=0&&value<control.labels.length:
      Number.isFinite(value)&&value>=control.min&&value<=control.max&&Math.abs((value-control.min)/control.step-Math.round((value-control.min)/control.step))<1e-6;
    if(allowed)values[control.key]=value;
  }
  return { activityIndex, route:Number.isInteger(settings.route)&&activity.routes?.[settings.route]?settings.route:0,
    step:0, routeCorrect:false, routeChoice:null,values,choice:null, frame:0,marks:{next:'peak'} };
}

function studySettings(activity,state){
  if(activity.routes)return state.route?{route:state.route}:{};
  const initial=defaults(activity);
  return Object.fromEntries(Object.entries(state.values).filter(([key,value])=>value!==initial[key]));
}

function controlsFor(activity,state) {
  if(activity.routes) return '<label class="ap3-select">Route <select data-ap3-route>'+
    selectOptions(activity.routes.map(r=>r.label),state.route)+'</select></label>';
  return activity.controls.map(c=>{
    if(c.labels) return '<label class="ap3-select">'+escapeText(c.label)+' <select data-ap3-control="'+c.key+'">'+
      selectOptions(c.labels,Number(state.values[c.key]))+'</select></label>';
    return '<label class="ap3-lab-slider">'+escapeText(c.label)+' <output data-ap3-value="'+c.key+'">'+
      escapeText(state.values[c.key]+' '+c.unit)+'</output><input type="range" data-ap3-control="'+c.key+'" min="'+c.min+'" max="'+c.max+
      '" step="'+c.step+'" value="'+state.values[c.key]+'" aria-valuetext="'+escapeText(state.values[c.key]+' '+c.unit)+'"></label>';
  }).join('');
}

function optionsHtml(choices, position, locked, selected) {
  const display=choices.map((label,i)=>({label,index:i}));
  const rotation=position%display.length;
  const ordered=display.slice(rotation).concat(display.slice(0,rotation));
  return '<div class="ap2-answers">'+ordered.map(({label,index})=>
    '<button type="button" data-ap3-choice="'+index+'"'+(locked?' disabled':'')+
    (selected===index?' aria-pressed="true"':'')+'>'+escapeText(label)+'</button>').join('')+'</div>';
}

function traceBody(activity,state) {
  const route=activity.routes[state.route];
  const completed=route.steps.slice(0,state.step+(state.routeCorrect?1:0));
  const trace='<p><strong>Starting point</strong> · '+escapeText(route.start)+'</p>'+
    (completed.length?'<ol aria-label="Confirmed route">'+completed.map(s=>'<li>'+escapeText(s[0])+'</li>').join('')+'</ol>':'');
  if(state.step===route.steps.length) {
    return trace+'<h3 data-ap3-focus tabindex="-1">Route complete</h3><button type="button" data-ap3-reset>Trace again with the route hidden</button>';
  }
  const step=route.steps[state.step], locked=state.routeCorrect;
  const feedback=state.routeChoice===null?'':locked?'Correct. '+step[3]:'Reconsider the direction of travel from the last confirmed structure and try again.';
  return trace+'<h3 data-ap3-focus tabindex="-1">Choose the next stop</h3>'+
    optionsHtml(step.slice(0,3),state.activityIndex+state.step+state.route+1,locked,state.routeChoice)+
    '<p role="status">'+escapeText(feedback)+'</p>'+
    (locked?'<button type="button" data-ap3-next>'+(state.step+1===route.steps.length?'See completed route':'Continue route')+'</button>':'');
}

function frameBody(data,index) {
  const [label,detail]=data.frames[index];
  return '<p><strong>'+escapeText(label)+'</strong></p><p>'+escapeText(detail)+'</p>';
}

function markVolumes(plot,marks){
  const {rows}=plot;
  const picked=key=>'<label>'+ (key==='peak'?'Peak':'Trough')+' <select data-ap3-measure="'+key+'"><option value="">Choose time</option>'+
    rows.map(([t,v],i)=>'<option value="'+i+'"'+(marks[key]===i?' selected':'')+'>'+t+' s · '+v+' L</option>').join('')+'</select></label>';
  let message='Tap the trace to mark the '+marks.next+', or use the time selectors.';
  if(rows[marks.peak]&&rows[marks.trough]){
    const high=rows[marks.peak][1],low=rows[marks.trough][1],samples=rows.map(r=>r[1]);
    message='Marked difference '+(high-low).toFixed(1)+' L. '+(high===Math.max(...samples)&&low===Math.min(...samples)?
      'Both extremes are marked.':'Look for the highest and lowest measured volumes.');
  }
  return '<fieldset><legend>Measure the excursion</legend><div class="course-actions">'+picked('peak')+picked('trough')+'</div><p role="status">'+message+'</p></fieldset>';
}

function experimentBody(activity,state) {
  const data=activity.run(state.values), locked=state.choice!==null;
  const hash=activity.title.length+Object.values(state.values).reduce((sum,v)=>sum+Math.round(Number(v)*10),0);
  return (data.media?renderField(data.media):'')+
    (data.duct?renderCollectingDuct(data.duct,locked):'')+
    (data.plot?'<div data-ap3-observed-plot>'+renderPlot(data.plot,locked?state.frame:-1,state.marks)+'</div>':'')+
    (data.plot?.measureExtrema?'<div data-ap3-measure-tool>'+markVolumes(data.plot,state.marks)+'</div>':'')+
    renderTable(data.observation)+(data.note?'<p>'+escapeText(data.note)+'</p>':'')+
    '<h3>'+escapeText(data.question)+'</h3>'+optionsHtml(data.choices,hash,locked,state.choice)+
    '<div role="status" data-ap3-verdict tabindex="-1">'+(locked?
      '<p><strong>'+(state.choice===0?'Correct.':'Expected prediction · '+escapeText(data.choices[0])+'.')+'</strong> '+escapeText(data.why)+'</p>':'')+'</div>'+
    (locked?(data.result?renderTable(data.result):'')+
      (data.plotAfter?'<div data-ap3-result-plot>'+renderPlot(data.plotAfter,state.frame)+'</div>':'')+
      '<label class="ap3-lab-slider">Inspect the result <input type="range" data-ap3-frame min="0" max="'+(data.frames.length-1)+
      '" step="1" value="'+state.frame+'" aria-valuetext="'+escapeText(data.frames[state.frame][0])+'"></label>'+
      '<div data-ap3-frame-text aria-live="polite">'+frameBody(data,state.frame)+'</div>'+
      '<button type="button" data-ap3-reset>Repeat this prediction</button>'+
      (activity===collectingDuct?' <button type="button" data-ap3-discuss>Discuss my result</button>':'')+
      (activity.nextTrial?' <button type="button" data-ap3-new-trial>Try another condition</button>':''):'');
}

function bodyContent(activity,state) {
  return activity.routes?traceBody(activity,state):experimentBody(activity,state);
}

function activityContent(activity,state) {
  return '<h2>'+escapeText(activity.title)+'</h2><p>'+escapeText(activity.intro)+'</p>'+
    '<div class="course-actions">'+controlsFor(activity,state)+'</div>'+
    '<div data-ap3-lab-body>'+bodyContent(activity,state)+'</div>'+
    '<p><a href="#ap3-lesson-'+activity.section+'">Review lesson '+activity.section+'</a></p>'+
    (activity===collectingDuct?renderMechanismTransfer('collecting-duct'):'');
}

export function renderLab(chapterId,initialIndex=0,settings={}) {
  const list=chapterLabs[chapterId];
  if(!list)return '';
  const state=makeState(list,initialIndex,settings);
  return '<label class="ap3-select">Activity <select data-ap3-activity>'+selectOptions(list.map(a=>a.title),state.activityIndex)+'</select></label>'+
    '<div data-ap3-lab-activity>'+activityContent(list[state.activityIndex],state)+'</div>';
}

export function mountLab(root,chapterId,initialIndex=0,onContext,{settings={},onNavigate,store}={}) {
  const list=chapterLabs[chapterId];
  if(!root||!list)return;
  let state=makeState(list,initialIndex,settings);
  const controller=new AbortController();
  const listener={signal:controller.signal};
  const current=()=>list[state.activityIndex];
  const body=()=>root.querySelector('[data-ap3-lab-body]');
  const publish=()=>onContext?.(springLabTutorContext(chapterId,current(),state));
  const refreshBody=()=>{body().innerHTML=bodyContent(current(),state);publish();};
  const navigate=()=>onNavigate?.(state.activityIndex,studySettings(current(),state));
  const mountTransfer=()=>{if(current()===collectingDuct)mountMechanismTransfer(root,'collecting-duct',store);};
  function mark(key,index,focus){
    const plot=current().run(state.values).plot;
    if(!plot?.measureExtrema)return;
    if(Number.isInteger(index)&&plot.rows[index])state.marks[key]=index;
    else delete state.marks[key];
    state.marks.next=key==='peak'?'trough':'peak';
    root.querySelector('[data-ap3-observed-plot]').innerHTML=renderPlot(plot,state.choice===null?-1:state.frame,state.marks);
    root.querySelector('[data-ap3-measure-tool]').innerHTML=markVolumes(plot,state.marks);
    if(focus)root.querySelector('[data-ap3-measure="'+key+'"]').focus({preventScroll:true});
  }
  mountTransfer();publish();

  function updateControl(input) {
    const key=input.dataset.ap3Control;
    const control=current().controls.find(c=>c.key===key);
    if(!control)return;
    state.values[key]=Number(input.value);
    state.choice=null;state.frame=0;state.marks={next:'peak'};
    if(!control.labels) {
      const value=input.value+' '+control.unit;
      root.querySelector('[data-ap3-value="'+key+'"]').textContent=value;
      input.setAttribute('aria-valuetext',value);
    }
    refreshBody();
  }

  root.addEventListener('change',event=>{
    const target=event.target;
    if(target.matches('[data-ap3-activity]')){
      state=makeState(list,Number(target.value));
      root.querySelector('[data-ap3-lab-activity]').innerHTML=activityContent(current(),state);
      mountTransfer();
      publish();navigate();
    }else if(target.matches('[data-ap3-route]')){
      state.route=Number(target.value);state.step=0;state.routeCorrect=false;state.routeChoice=null;
      refreshBody();navigate();
    }else if(target.matches('select[data-ap3-control]')){
      updateControl(target);navigate();
    }else if(target.matches('input[data-ap3-control]')){
      navigate();
    }else if(target.matches('[data-ap3-measure]')){
      mark(target.dataset.ap3Measure,target.value===''?null:Number(target.value),true);
    }
  },listener);

  root.addEventListener('input',event=>{
    const target=event.target;
    if(target.matches('input[data-ap3-control]'))updateControl(target);
    if(!target.matches('[data-ap3-frame]'))return;
    state.frame=Number(target.value);
    const data=current().run(state.values);
    target.setAttribute('aria-valuetext',data.frames[state.frame][0]);
    root.querySelector('[data-ap3-frame-text]').innerHTML=frameBody(data,state.frame);
    if(data.plot)root.querySelector('[data-ap3-observed-plot]').innerHTML=renderPlot(data.plot,state.frame,state.marks);
    if(data.plotAfter)root.querySelector('[data-ap3-result-plot]').innerHTML=renderPlot(data.plotAfter,state.frame);
    publish();
  },listener);

  root.addEventListener('click',event=>{
    const point=event.target.closest('[data-ap3-point]');
    if(point){mark(state.marks.next,Number(point.dataset.ap3Point),false);return;}
    const button=event.target.closest('button');
    if(!button||button.disabled)return;
    const isRoute=!!current().routes;
    if(button.hasAttribute('data-ap3-choice')){
      const choice=Number(button.dataset.ap3Choice);
      if(isRoute){
        state.routeChoice=choice;state.routeCorrect=choice===0;
      }else state.choice=choice;
      refreshBody();
      const focus=isRoute?(state.routeCorrect?'[data-ap3-next]':'[data-ap3-choice="'+choice+'"]'):'[data-ap3-verdict]';
      body().querySelector(focus)?.focus();
    }else if(button.hasAttribute('data-ap3-next')&&state.routeCorrect){
      state.step++;state.routeCorrect=false;state.routeChoice=null;
      refreshBody();body().querySelector('[data-ap3-focus]')?.focus();
    }else if(button.hasAttribute('data-ap3-discuss')&&current()===collectingDuct&&state.choice!==null&&getTutorAssessmentMode()!=='exam'){
      publish();
      document.querySelector('#tutor-launch')?.click();
    }else if(button.hasAttribute('data-ap3-new-trial')&&current().nextTrial){
      state=makeState(list,state.activityIndex,current().nextTrial(state.values));
      root.querySelector('[data-ap3-lab-activity]').innerHTML=activityContent(current(),state);
      mountTransfer();
      publish();navigate();body().querySelector('[data-ap3-choice]')?.focus();
    }else if(button.hasAttribute('data-ap3-reset')){
      state.step=0;state.routeCorrect=false;state.routeChoice=null;state.choice=null;state.frame=0;
      refreshBody();body().querySelector('[data-ap3-choice]')?.focus();
    }
  },listener);
  return ()=>controller.abort();
}
