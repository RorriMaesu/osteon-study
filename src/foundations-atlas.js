import groups from './foundations-atlas.json' with {type:'json'};
import {mountPlaneModel} from './foundation-planes.js';

const asset='assets/foundations/';
const preferred=['body-regions','directions','planes','cavities','membranes','abdomen'];
export function renderFoundationAtlas(root,section,e){
 const available=(section==='1.6'?preferred:section==='1.2'?['organs']:section==='4.1'?['membranes']:[]).map(id=>groups.find(g=>g.id===id)).filter(Boolean);
 if(!available.length)return false;
 let group=available[0],viewIndex=0,pointIndex=-1,showLabels=true,showMarkers=true,findIndex=-1,checked=false,plane=false,closeModel;
 function paint(){
  closeModel?.();closeModel=null;
  const view=group.views[viewIndex],points=view.targets||[],point=points[pointIndex],find=points[findIndex],crop=view.crop||[0,0,...view.size];
  const labelsVisible=showLabels&&!find,markersVisible=showMarkers||!!find;
  const [x,y,w,h]=crop,marker=Math.max(4,Math.min(w,h)*.018);
  const masks=(view.mask||[]).map(([a,b,c,d])=>`<rect x="${a*view.size[0]/100}" y="${b*view.size[1]/100}" width="${c*view.size[0]/100}" height="${d*view.size[1]/100}" fill="white"/>`).join('');
  root.innerHTML=`<div class="eyebrow">TEXTBOOK ATLAS</div><h3>${e(group.title)}</h3><p>${e(group.summary)}</p>
    <div class="control-row"><label for="foundation-group">Explore</label><select id="foundation-group">${available.map(g=>`<option value="${g.id}" ${g===group?'selected':''}>${e(g.title)}</option>`).join('')}</select>
    <label for="foundation-view" ${group.views.length<2?'hidden':''}>View</label><select id="foundation-view" ${group.views.length<2?'hidden':''}>${group.views.map((v,i)=>`<option value="${i}" ${i===viewIndex?'selected':''}>${e(v.title)}</option>`).join('')}</select>
    ${group.id==='planes'?'<button id="foundation-3d" aria-pressed="'+plane+'">'+(plane?'Textbook diagram':'Open 3D planes')+'</button>':''}
    ${points.length&&!plane?`<button id="foundation-labels" aria-pressed="${showLabels}" ${find?'disabled':''}>Labels ${showLabels?'on':'off'}</button><button id="foundation-markers" aria-pressed="${showMarkers}" ${find?'disabled':''}>Markers ${showMarkers?'on':'off'}</button><button id="foundation-find" aria-pressed="${!!find}">${find?'End location practice':'Practice locations'}</button>`:''}</div>
    ${plane?'<div class="foundation-plane-stage"></div><div class="control-row foundation-plane-buttons"></div><p class="tiny">Illustrative model. The cutting surfaces show plane direction. Human base mesh © Blender Studio contributors, CC0.</p>':`<div class="foundation-atlas-layout"><figure><svg viewBox="${crop.join(' ')}" role="${markersVisible&&points.length?'group':'img'}" aria-label="${e(view.title)}"><image href="${asset+e(view.src)}" width="${view.size[0]}" height="${view.size[1]}"/>${view.alwaysMask||!labelsVisible?masks:''}${markersVisible?points.map((t,i)=>{const px=t.x*view.size[0]/100,py=t.y*view.size[1]/100;return `<circle class="foundation-point ${i===pointIndex?'active':''}" data-foundation-point="${i}" role="button" tabindex="${i===Math.max(0,pointIndex)?0:-1}" aria-pressed="${i===pointIndex}" aria-label="${labelsVisible?e(t.name):'Marker '+(i+1)}" cx="${px}" cy="${py}" r="${marker}"/>`;}).join(''):''}</svg><figcaption>${e(view.source||'OpenStax A&P 2e · adapted by Soma')}. Access for free at openstax.org.</figcaption></figure>
    <div>${find?`<p>Find <strong>${e(find.name)}</strong>. Select a marker, then check your choice.</p><div class="control-row"><button id="foundation-check" ${point?'':'disabled'}>Check location</button><button id="foundation-next">Next location</button></div>`:`<label for="foundation-target" ${points.length?'':'hidden'}>Structure</label><select id="foundation-target" ${points.length?'':'hidden'}><option value="-1">Choose a structure</option>${points.map((t,i)=>`<option value="${i}" ${i===pointIndex?'selected':''}>${e(t.name)}</option>`).join('')}</select>`}
    <div class="foundation-target-note" role="status">${find?(checked?(pointIndex===findIndex?`<p><strong>Correct.</strong> ${e(find.teach||find.name)}</p>`:'<p>That marker points elsewhere. Try another location.</p>'):''):point?`<strong>${e(point.name)}</strong><p>${e(point.teach||'Compare this target with the surrounding structures.')}</p>`:'<p>Select a marker or name to read about its location.</p>'}</div></div></div>`}`;
  const select=(id,fn)=>{const input=root.querySelector(id);if(input)input.onchange=ev=>{fn(ev.target.value);paint();root.querySelector(id)?.focus({preventScroll:true});};};
  select('#foundation-group',v=>{group=available.find(g=>g.id===v);viewIndex=0;pointIndex=-1;findIndex=-1;plane=false;});
  select('#foundation-view',v=>{viewIndex=+v;pointIndex=-1;findIndex=-1;});
  select('#foundation-target',v=>{pointIndex=+v;});
  const pins=[...root.querySelectorAll('[data-foundation-point]')];
  pins.forEach((b,i)=>{
   b.onclick=()=>{pointIndex=+b.dataset.foundationPoint;checked=false;paint();root.querySelector(`[data-foundation-point="${pointIndex}"]`)?.focus({preventScroll:true});};
   b.onkeydown=event=>{
    if(event.key==='Enter'||event.key===' '){event.preventDefault();b.onclick();return;}
    const step={ArrowRight:1,ArrowDown:1,ArrowLeft:-1,ArrowUp:-1}[event.key];
    if(step){event.preventDefault();const next=pins[(i+step+pins.length)%pins.length];b.setAttribute('tabindex','-1');next.setAttribute('tabindex','0');next.focus();}
   };
  });
  const toggle=(id,fn)=>{const b=root.querySelector(id);if(b)b.onclick=()=>{fn();paint();root.querySelector(id)?.focus({preventScroll:true});};};
  toggle('#foundation-labels',()=>{showLabels=!showLabels;});
  toggle('#foundation-markers',()=>{showMarkers=!showMarkers;});
  toggle('#foundation-find',()=>{findIndex=find?-1:0;pointIndex=-1;checked=false;});
  toggle('#foundation-check',()=>{checked=true;});
  toggle('#foundation-next',()=>{findIndex=(findIndex+1)%points.length;pointIndex=-1;checked=false;});
  toggle('#foundation-3d',()=>{plane=!plane;});
  if(plane)closeModel=mountPlaneModel(root,()=>{plane=false;paint();});
 }
 paint();return true;
}
