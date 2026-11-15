
const $=selector=>document.querySelector(selector);
const search=$('#coverage-search'),region=$('#coverage-region'),filter=$('#coverage-filter');
const status=$('#coverage-state'),results=$('#coverage-rows'),details=$('#coverage-detail');
const pager=$('#coverage-pages'),previous=$('#coverage-prev'),next=$('#coverage-next');
const compact=matchMedia('(max-width: 620px)');
const countText=(number,singular,plural=singular+'s')=>number+' '+(number===1?singular:plural);
const symbols=/[^\p{L}\p{N}]+/gu;
const normalize=value=>String(value||'').normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase().replace(symbols,' ').trim();
const labelRegion={
 'head-neck':'Head and neck','trunk-back':'Trunk and back','pelvis-leg-foot':'Pelvis, leg and foot',
 'shoulder-arm':'Shoulder and upper arm','forearm-hand':'Forearm and hand',
};
const labelStatus={
 'named-geometry':'Named in atlas','represented-by-components':'Represented by parts',
 'no-named-mesh':'No named atlas mesh','not-separately-resolved':'Needs its own mesh',
 'partial-model':'Partial model','needs-anatomical-review':'Anatomy review needed',
 'atlas-inventory':'Named in atlas','course-only':'Course target under review',
};
const evidenceLabel={'pose-context':'Pose context','textbook-contraction':'Textbook example','recorded-surface-emg':'Recorded EMG','walk-anatomical-context':'Walk context'};
const parts=(row,kind)=>Object.values(row[kind]||{}).flat();
const missing=row=>!['named-geometry','represented-by-components','atlas-inventory'].includes(row.atlasStatus);
const studyMotion=part=>!part.evidence?.includes('walk-anatomical-context');
function hasPartialMotion(row){
 const motion=parts(row,'motion').filter(studyMotion);
 const covered=new Set(motion.map(part=>part.atlasId));
 return motion.length&&parts(row,'atlas').some(part=>part.role!=='candidate'&&!covered.has(part.id));
}
function motionLink(part){
 const walk=part.modes.includes('walk');
 const heel=part.modes.includes('heel-raise')&&!walk;
 const parameters=new URLSearchParams({motionPart:part.atlasId,motionMode:walk?'walk':'actions',motionLesson:heel?'heel':'curl',motionSide:part.side});
 return './?'+parameters+'#motion';
}
const filterMatches={
 course:row=>row.course,
 moving:row=>parts(row,'motion').some(studyMotion),
 walk:row=>parts(row,'motion').some(part=>part.modes.includes('walk')),
 gap:missing,
 variants:row=>row.variant||/female|male|sex\s*variant/i.test(row.sexScope||''),
};
const order=['left','right','midline','other','bilateral','unknown'];
const attach=(parent,tag,content,css)=>{
 const node=document.createElement(tag);
 if(content!=null)node.textContent=content;
 if(css)node.className=css;
 parent.append(node);
 return node;
};
const chip=(parent,text,className='')=>attach(parent,'span',text,'coverage-chip '+className);

let catalog=[],page=0,current=null;
function change(){
 page=0;current=null;
 if(location.hash)history.replaceState(null,'',location.pathname+location.search);
 render();
}
function open(row,button){
 if(current===row.id){changeDetail();document.getElementById('coverage-item-'+row.id)?.focus({preventScroll:true});return;}
 current=row.id;
 history.replaceState(null,'','#'+encodeURIComponent(row.id));
 render();
 if(button)document.getElementById('coverage-item-'+row.id)?.focus({preventScroll:true});
}
function changeDetail(){
 current=null;history.replaceState(null,'',location.pathname+location.search);render();
}
function tagsFor(parent,row){
 const atlas=parts(row,'atlas'),motion=parts(row,'motion');
 if(missing(row))chip(parent,'Review','gap');
 else if(atlas.length)chip(parent,'Atlas');
 if(motion.some(studyMotion))chip(parent,hasPartialMotion(row)?'Partial study motion':'Study motion','moving');
 else if(motion.length)chip(parent,'Walk context');
 if(row.course)chip(parent,'Course','course');
 if(filterMatches.variants(row))chip(parent,'Variant / scope');
}
function showParts(target,row,kind){
 const fields=row[kind]||{},section=attach(target,'section');
 attach(section,'h3',kind==='atlas'?'Atlas geometry':hasPartialMotion(row)?'Motion geometry · partial':'Motion geometry');
 if(kind==='atlas'){
  const partial=Object.entries(row.atlasSides||{}).filter(([,status])=>status==='partial').map(([side])=>side);
  if(partial.length)attach(section,'p','Partial representation · '+partial.join(' and '));
 }else if(hasPartialMotion(row))attach(section,'p','Study motions cover some parts of this entry. The full-body walk can also show contextual anatomy.');
 if(!parts(row,kind).length){attach(section,'p','No '+(kind==='atlas'?'mesh matched in this inventory.':'motion mesh in this release.'));return;}
 const keys=[...new Set([...order,...Object.keys(fields)])];
 for(const side of keys){
  const sideParts=fields[side]||[];
  if(!sideParts.length)continue;
  attach(section,'p',side[0].toUpperCase()+side.slice(1),'coverage-side');
  const list=attach(section,'ul');
  for(const part of sideParts){
   const line=attach(list,'li');
   if(kind==='atlas'){
    const link=attach(line,'a',part.name+' ↗');
    link.href='./?muscle='+encodeURIComponent(part.id)+'#atlas';
    link.setAttribute('aria-label','Inspect '+part.side+' '+part.name+' in 3D Atlas');
    if(part.role==='candidate')line.append(document.createTextNode(' · candidate'));
   }else if(part.atlasId&&part.modes?.length){
    const link=attach(line,'a',part.name+' ↗');
    link.href=motionLink(part);
    link.setAttribute('aria-label','Inspect '+part.side+' '+part.name+' in Motion Lab');
   }else line.append(document.createTextNode(part.name));
   if(kind==='motion'){
    const rig=part.rig==='rigid'?'Rigid surface':part.rig==='deforms'?'Has deformation weights or shapes':'Rigged surface';
    attach(line,'small',' · '+rig);
    if(part.evidence?.length)attach(line,'small',' · '+part.evidence.map(id=>evidenceLabel[id]||id).join(', '));
    if(part.qualification)attach(line,'small',' · '+part.qualification);
   }
  }
 }
}
function render(){
 const tokens=normalize(search.value).split(' ').filter(Boolean),regionValue=region.value,predicate=filterMatches[filter.value];
 const hits=catalog.filter(row=>(!regionValue||row.region===regionValue)&&(!predicate||predicate(row))&&tokens.every(query=>row.search.includes(query)));
 const size=compact.matches?5:10,pages=Math.max(1,Math.ceil(hits.length/size));
 page=Math.min(page,pages-1);
 if(current&&!hits.slice(page*size,(page+1)*size).some(row=>row.id===current)){current=null;history.replaceState(null,'',location.pathname+location.search);}
 status.textContent=countText(hits.length,'match','matches')+(hits.length?' · showing '+(page*size+1)+'–'+Math.min((page+1)*size,hits.length):'');
 $('#coverage-clear').hidden=!search.value&&!region.value&&!filter.value;
 results.replaceChildren();
 details.replaceChildren();
 for(const row of hits.slice(page*size,(page+1)*size)){
  const listItem=attach(results,'li');
  const button=attach(listItem,'button',null,'coverage-item');
  button.type='button';button.id='coverage-item-'+row.id;button.setAttribute('aria-pressed',String(current===row.id));button.setAttribute('aria-controls','coverage-detail');
  attach(button,'span',row.name);
  tagsFor(attach(button,'span',null,'coverage-tags'),row);
  button.onclick=()=>open(row,button);
  if(current===row.id){
   const pane=attach(details,'article',null,'coverage-pane');
   pane.setAttribute('aria-label',row.name+' details');
   attach(pane,'h2',row.name);
   attach(pane,'p',[labelRegion[row.region]||row.region,labelStatus[row.atlasStatus]||row.atlasStatus,row.ta2?'TA2 '+row.ta2:''].filter(Boolean).join(' · '));
   if(row.note)attach(pane,'p',row.note);
   const columns=attach(pane,'div');showParts(columns,row,'atlas');showParts(columns,row,'motion');
  }
 }
 $('#coverage-page').textContent='Page '+(page+1)+' of '+pages;
 pager.hidden=pages<2;previous.disabled=page===0;next.disabled=page>=pages-1;
}
function hashRoute(){
 let id;
 try{id=decodeURIComponent(location.hash.slice(1));}catch{return;}
 const index=catalog.findIndex(row=>row.id===id);
 if(index<0)return;
 search.value='';region.value='';filter.value='';
 current=id;page=Math.floor(index/(compact.matches?5:10));render();
}
search.addEventListener('input',change);
region.addEventListener('change',change);
filter.addEventListener('change',change);
$('#coverage-filters').addEventListener('submit',event=>event.preventDefault());
$('#coverage-clear').onclick=()=>{search.value='';region.value='';filter.value='';change();search.focus();};
previous.onclick=()=>{page--;render();};
next.onclick=()=>{page++;render();};
compact.addEventListener('change',()=>{if(current)hashRoute();else render();});
window.addEventListener('hashchange',hashRoute);
try{
 const url=new URL('./motion-coverage-data.json',import.meta.url);
 url.search=new URL(import.meta.url).search;
 const response=await fetch(url);
 if(!response.ok)throw Error('Coverage inventory could not load.');
 const data=await response.json();
 catalog=data.rows.map(row=>({...row,search:normalize([row.name,row.ta2,...parts(row,'atlas').map(part=>part.name),...parts(row,'motion').map(part=>part.name)].join(' '))}));
 const moving=catalog.filter(row=>parts(row,'motion').some(studyMotion)).length;
 const totals=$('#coverage-totals');
 for(const [value,label] of [[data.counts.referenceEntries,'Reference checks'],[data.counts.referenceOpen,'Open checks'],[catalog.filter(row=>row.course).length,'Course entries'],[moving,'Study motions']]){
  const box=attach(totals,'div');attach(box,'strong',value);attach(box,'span',label);
 }
 for(const key of [...new Set(catalog.map(row=>row.region))].sort((a,b)=>(labelRegion[a]||a).localeCompare(labelRegion[b]||b))){
  const option=attach(region,'option',labelRegion[key]||key);option.value=key;
 }
 $('#coverage-scope').textContent=data.scope;
 for(const source of data.sources){
  const link=attach($('#coverage-sources'),'a',source.title+' ↗');link.href=source.url;
 }
 if(location.hash)hashRoute();
 if(!current)render();
}catch(error){
 status.textContent='The coverage inventory could not load. Reload to try again.';
 console.error(error);
}
