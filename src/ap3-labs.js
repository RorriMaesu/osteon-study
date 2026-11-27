import { absorption, digestiveRoutes, drainage, nephron, sperm } from './ap3-labs-routes.js';
import { antibody, breathing, ventilation, spirometry, fedFast, heat, excretion, waterShift } from './ap3-labs-experiments.js';
import { acidBase, lymphTissue, foodEnergy, ovarian, development, birth, pedigree } from './ap3-labs-evidence.js';
import { intestinalTissue, gasSurface, gonadField, cleavageFields } from './ap3-labs-fields.js';
import { springLabTutorContext } from './ap3-labs-tutor.js';

export const chapterLabs = {
  21: [drainage, lymphTissue, antibody],
  22: [breathing, ventilation, spirometry, gasSurface],
  23: [absorption, digestiveRoutes, intestinalTissue],
  24: [fedFast, heat, foodEnergy],
  25: [nephron, excretion],
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
function renderPlot({ x, y, rows, ymax, series }, cursor = -1) {
  const left=56, right=390, top=20, bottom=130;
  const xmin=rows[0][0], xmax=rows.at(-1)[0];
  const max=ymax ?? Math.max(1,...rows.flatMap(r=>r.slice(1)));
  const px=v=>left+(right-left)*(v-xmin)/(xmax-xmin||1);
  const py=v=>bottom-(bottom-top)*v/max;
  const labels=series||[y];
  const dashes=['','7 3','2 3'];
  const colors=['currentColor','#578cd0','#ba7e3c'];
  const lines=labels.map((_,index)=>{
    const points=rows.map(r=>px(r[0])+','+py(r[index+1])).join(' ');
    return '<polyline points="'+points+'" fill="none" stroke="'+colors[index]+'" stroke-width="2.4" stroke-dasharray="'+dashes[index]+'"/>'+
      rows.map(r=>'<circle cx="'+px(r[0])+'" cy="'+py(r[index+1])+'" r="2.8" fill="'+colors[index]+'"/>').join('');
  }).join('');
  const marker=rows[cursor]?'<path d="M'+px(rows[cursor][0])+' '+top+' V'+bottom+'" stroke="currentColor" stroke-width="1" stroke-dasharray="3 3"/>':'';
  return '<figure class="ap3-lab-plot"><figcaption>'+escapeText(y)+' by '+escapeText(x)+'</figcaption>'+
    '<svg aria-hidden="true" viewBox="0 0 408 170" style="display:block;width:100%;max-width:680px;height:auto"><g font-family="system-ui,sans-serif" font-size="11" fill="currentColor">'+
    '<path d="M'+left+' '+top+' V'+bottom+' H'+right+'" fill="none" stroke="currentColor"/>'+
    [0,max/2,max].map(v=>'<text x="'+(left-8)+'" y="'+(py(v)+4)+'" text-anchor="end">'+v+'</text>').join('')+
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

function makeState(list, activityIndex = 0) {
  activityIndex = Number(activityIndex);
  if(!Number.isInteger(activityIndex) || !list[activityIndex]) activityIndex = 0;
  const activity=list[activityIndex];
  return { activityIndex, route:0, step:0, routeCorrect:false, routeChoice:null,
    values:defaults(activity), choice:null, frame:0 };
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

function experimentBody(activity,state) {
  const data=activity.run(state.values), locked=state.choice!==null;
  const hash=activity.title.length+Object.values(state.values).reduce((sum,v)=>sum+Math.round(Number(v)*10),0);
  return (data.media?renderField(data.media):'')+
    (data.plot?'<div data-ap3-observed-plot>'+renderPlot(data.plot,locked?state.frame:-1)+'</div>':'')+
    renderTable(data.observation)+(data.note?'<p>'+escapeText(data.note)+'</p>':'')+
    '<h3>'+escapeText(data.question)+'</h3>'+optionsHtml(data.choices,hash,locked,state.choice)+
    '<div role="status" data-ap3-verdict tabindex="-1">'+(locked?
      '<p><strong>'+(state.choice===0?'Correct.':'Expected prediction · '+escapeText(data.choices[0])+'.')+'</strong> '+escapeText(data.why)+'</p>':'')+'</div>'+
    (locked?(data.result?renderTable(data.result):'')+
      (data.plotAfter?'<div data-ap3-result-plot>'+renderPlot(data.plotAfter,state.frame)+'</div>':'')+
      '<label class="ap3-lab-slider">Inspect the result <input type="range" data-ap3-frame min="0" max="'+(data.frames.length-1)+
      '" step="1" value="'+state.frame+'" aria-valuetext="'+escapeText(data.frames[state.frame][0])+'"></label>'+
      '<div data-ap3-frame-text aria-live="polite">'+frameBody(data,state.frame)+'</div>'+
      '<button type="button" data-ap3-reset>Repeat this prediction</button>':'');
}

function bodyContent(activity,state) {
  return activity.routes?traceBody(activity,state):experimentBody(activity,state);
}

function activityContent(activity,state) {
  return '<h2>'+escapeText(activity.title)+'</h2><p>'+escapeText(activity.intro)+'</p>'+
    '<div class="course-actions">'+controlsFor(activity,state)+'</div>'+
    '<div data-ap3-lab-body>'+bodyContent(activity,state)+'</div>'+
    '<p><a href="#ap3-lesson-'+activity.section+'">Review lesson '+activity.section+'</a></p>';
}

export function renderLab(chapterId,initialIndex=0) {
  const list=chapterLabs[chapterId];
  if(!list)return '';
  const state=makeState(list,initialIndex);
  return '<label class="ap3-select">Activity <select data-ap3-activity>'+selectOptions(list.map(a=>a.title),state.activityIndex)+'</select></label>'+
    '<div data-ap3-lab-activity>'+activityContent(list[state.activityIndex],state)+'</div>';
}

export function mountLab(root,chapterId,initialIndex=0,onContext) {
  const list=chapterLabs[chapterId];
  if(!root||!list)return;
  let state=makeState(list,initialIndex);
  const controller=new AbortController();
  const listener={signal:controller.signal};
  const current=()=>list[state.activityIndex];
  const body=()=>root.querySelector('[data-ap3-lab-body]');
  const publish=()=>onContext?.(springLabTutorContext(chapterId,current(),state));
  const refreshBody=()=>{body().innerHTML=bodyContent(current(),state);publish();};
  publish();

  function updateControl(input) {
    const key=input.dataset.ap3Control;
    const control=current().controls.find(c=>c.key===key);
    if(!control)return;
    state.values[key]=Number(input.value);
    state.choice=null;state.frame=0;
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
      publish();
    }else if(target.matches('[data-ap3-route]')){
      state.route=Number(target.value);state.step=0;state.routeCorrect=false;state.routeChoice=null;
      refreshBody();
    }else if(target.matches('select[data-ap3-control]')){
      updateControl(target);
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
    if(data.plot)root.querySelector('[data-ap3-observed-plot]').innerHTML=renderPlot(data.plot,state.frame);
    if(data.plotAfter)root.querySelector('[data-ap3-result-plot]').innerHTML=renderPlot(data.plotAfter,state.frame);
    publish();
  },listener);

  root.addEventListener('click',event=>{
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
    }else if(button.hasAttribute('data-ap3-reset')){
      state.step=0;state.routeCorrect=false;state.routeChoice=null;state.choice=null;state.frame=0;
      refreshBody();body().querySelector('[data-ap3-choice]')?.focus();
    }
  },listener);
  return ()=>controller.abort();
}
