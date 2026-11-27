const fieldWidths={finger:5,arm:15};
const regions={finger:'Fingertip',arm:'Forearm'};
export function fieldAt(site,x){return Math.floor(x/fieldWidths[site]+.5);}
function mapFigure(site,gap,reveal){
  const w=fieldWidths[site],lo=-10,hi=25;
  const X=mm=>20+8*(mm-lo);
  const selected=new Set([fieldAt(site,0),fieldAt(site,gap)]);
  let belt='';
  for(let i=fieldAt(site,lo);i<=fieldAt(site,hi);i++){
    const start=X(Math.max(lo,(i-.5)*w)),end=X(Math.min(hi,(i+.5)*w));
    const center=(start+end)/2,hit=reveal&&selected.has(i);
    belt+='<rect x="'+start+'" y="45" width="'+(end-start)+'" height="31" fill="'+(hit?'#e9ae70':i%2?'#819bb1':'#aac8ba')+'" stroke="#183039"/>'+
      '<path d="M'+center+' 77v18" stroke="'+(hit?'#f6b466':'#9abbb1')+'" stroke-width="'+(hit?4:1.5)+'"/>'+(hit?'<circle cx="'+center+'" cy="99" r="4" fill="#ffc47e"/>':'');
  }
  const marks=[0,gap].map((pos,i)=>'<path d="M'+X(pos)+' '+(i?10:20)+'v24l-3 -4m3 4 3 -4" fill="none" stroke="#f1dfbd" stroke-width="2"/>').join('');
  return '<svg viewBox="0 0 320 123" style="display:block;width:100%;max-height:13rem" role="img" aria-label="'+regions[site]+' map with equal '+w+' mm fields. Touch A lies in the middle of a field. Touch B is '+gap+' mm to its right.'+(reveal?' '+selected.size+' distinct afferent channel'+(selected.size===1?' is':'s are')+' active.':'')+'">'+belt+marks+
    '<text x="160" y="119" text-anchor="middle" fill="currentColor" font-size="11">One afferent per field in this model</text></svg>';
}
export function renderReceptiveFields(){return '<section class="neuro-station" data-sensory-detail="two-point"><h3>Can two contacts be distinguished?</h3><p>Choose two touches the same distance apart on a fingertip or forearm. Each colored field feeds one afferent. The first touch stays at the center of its field.</p>'+
  '<div class="course-actions"><label>Skin map <select data-skin-map><option value="finger">Fingertip</option><option value="arm">Forearm</option></select></label><label>Contact separation <select data-gap>'+[1,3,6,10,16].map(n=>'<option value="'+n+'"'+(n===6?' selected':'')+'>'+n+' mm</option>').join('')+'</select></label></div>'+
  '<div data-field-map></div><label>How many distinct afferents respond? <select data-field-guess><option value="">Predict</option><option value="1">One</option><option value="2">Two</option></select></label> <button data-test-field>Apply both touches</button><p data-field-result role="status"></p>'+
  '<p><small>Illustrative nonoverlapping fields. Real receptive fields overlap, and central processing contributes to discrimination. These dimensions are model settings.</small></p></section>';}
export function mountReceptiveFields(host){
  const get=s=>host.querySelector(s),site=get('[data-skin-map]'),gap=get('[data-gap]'),guess=get('[data-field-guess]'),note=get('[data-field-result]');
  function draw(revealed){get('[data-field-map]').innerHTML=mapFigure(site.value,+gap.value,revealed);}
  function reset(){guess.value='';draw(false);note.textContent='';}
  site.onchange=gap.onchange=reset;get('[data-test-field]').onclick=()=>{
    if(!guess.value){note.textContent='Predict the number of responding afferents first.';return;}
    const count=fieldAt(site.value,+gap.value)===fieldAt(site.value,0)?1:2;
    draw(true);note.textContent=(+guess.value===count?'Correct. ':'Look where each contact lands. ')+(count===1?'Both contacts feed one afferent here; its activity alone cannot distinguish two spatial locations.':'The contacts reach two distinct afferents, providing positional evidence for two touches.')+' Keep the separation at '+gap.value+' mm and compare the other skin map.';
  };draw(false);
}

