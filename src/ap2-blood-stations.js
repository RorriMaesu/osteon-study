import specimens from '../assets/ap2-blood/specimens.json' with {type:'json'};

const features = {
  basophil: ['Coarse dark granules obscure much of the nucleus.', 'Granules can make the outline of the basophil nucleus hard to see.'],
  eosinophil: ['Prominent pink-orange granules surround a lobed nucleus.', 'The combination of granules and nuclear lobes is more useful than stain color alone.'],
  neutrophil: ['Thin strands link segments of a dark nucleus in lightly granulated cytoplasm.', 'Look for a segmented nucleus and relatively inconspicuous cytoplasmic granules.'],
  lymphocyte: ['A dense round or slightly indented nucleus fills most of the cell.', 'A mature small lymphocyte has a high nucleus-to-cytoplasm ratio. Routine smear morphology cannot reliably separate B cells from T cells.'],
  monocyte: ['A large cell has abundant gray-blue cytoplasm and an irregular or folded nucleus.', 'The contour and cytoplasm help distinguish a monocyte from a small mature lymphocyte.'],
  platelet: ['A small granular fragment is much smaller than neighboring red cells.', 'Platelets are fragments of megakaryocytes. They have granules and lack a nucleus.']
};
const types=Object.keys(features);
const ordinal=new Map();
export const teachingFields=[], examFields=[];
for(const specimen of specimens){
  const n=(ordinal.get(specimen.type)||0)+1;
  ordinal.set(specimen.type,n);
  (n===4 ? examFields : teachingFields).push(specimen);
}
const credit='<p class="blood-credit">Practice photographs by Acevedo, Merino, Alférez, Molina, Boldú and Rodellar, Hospital Clínic de Barcelona. Converted to WebP. <a target="_blank" rel="noreferrer" href="https://data.mendeley.com/datasets/snkd93bnjr/1">Specimen collection ↗</a> · <a target="_blank" rel="noreferrer" href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a></p>';
const style=`<style>.blood-work{color:#e7f1ea}.blood-work .specimen-view{display:grid;grid-template-columns:minmax(140px,320px) minmax(180px,1fr);gap:1rem;align-items:center}.specimen-view>*{min-width:0}.blood-work select{width:100%;box-sizing:border-box}.specimen-view img{display:block;width:100%;max-height:36dvh;object-fit:contain;border-radius:10px}.blood-work .blood-key img{width:100%;height:auto;max-width:820px}.blood-work select,.blood-work label{display:block;max-width:100%}.blood-work label{margin:.5rem 0}.blood-work button{margin:4px}.blood-work .blood-credit{font-size:.78rem}.clot-picture{width:100%;max-width:600px;max-height:32dvh;display:block}.clot-picture .recruit{animation:clot-recruit .8s ease-out both}.clot-picture .clot-strands{stroke-dasharray:1;animation:clot-weave .85s ease-out both}@keyframes clot-weave{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}@keyframes clot-recruit{from{transform:translate(26px,-18px);opacity:.2}to{transform:none;opacity:1}}@media(prefers-reduced-motion:reduce){.clot-picture .recruit,.clot-picture .clot-strands{animation:none}}@media(max-width:650px){.blood-work .specimen-view{grid-template-columns:minmax(0,1fr)}.specimen-view img{max-height:32dvh}}</style>`;
export function smearStation(){
  const names=types.map(t=>'<option>'+t+'</option>').join('');
  const clues=[...types].sort((a,b)=>features[a][0].localeCompare(features[b][0])).map(t=>'<option value="'+t+'">'+features[t][0]+'</option>').join('');
  return style+`<div class="blood-work"><h3>Blood film practical</h3><p>Identify the cell or fragment centered in the field. Choose a visible feature that supports your identification.</p>
    <details class="blood-key"><summary>Show the labeled study plate</summary><a href="assets/ap2-blood/teaching-18-13.webp" target="_blank" rel="noreferrer"><img src="assets/ap2-blood/teaching-18-13.webp" alt="Labeled reference micrographs of a basophil, eosinophil, neutrophil, monocyte and lymphocyte."></a><p class="blood-credit">OpenStax Anatomy and Physiology 2e, Fig. 18.13. Micrographs © 2012 Regents of University of Michigan Medical School. <a href="https://openstax.org/books/anatomy-and-physiology-2e/pages/18-4-leukocytes-and-platelets" target="_blank" rel="noreferrer">Textbook and figure credits ↗</a></p></details>
    <div class="specimen-view"><a data-full-field target="_blank" rel="noreferrer" aria-label="Enlarge this blood film"><img data-field></a><div><p data-progress></p><label>Cell or fragment<select data-cell><option value="">Choose identity</option>${names}</select></label><label>Visible evidence<select data-clue><option value="">Choose evidence</option>${clues}</select></label><button data-check-smear>Check both</button><button data-next-smear>Next field →</button><p data-cell-feedback role="status"></p></div></div>${credit}</div>`;
}
function shuffle(array){
  const copy=[...array];for(let i=copy.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];}return copy;
}
export function mountSmear(root){
  let deck=shuffle(teachingFields),index=0;
  const get=name=>root.querySelector('[data-'+name+']');
  function show(){
    const s=deck[index],file='assets/ap2-blood/'+s.file;
    get('field').src=file;get('full-field').href=file;
    get('field').alt='Peripheral blood field. The central target has these visible features: '+features[s.type][0];
    get('cell').value='';get('clue').value='';get('progress').textContent='Field '+(index+1)+' of '+deck.length;
    get('cell-feedback').textContent='';
  }
  get('check-smear').onclick=()=>{
    const type=deck[index].type,choice=get('cell').value,evidence=get('clue').value;
    get('cell-feedback').textContent=!choice||!evidence?'Choose both an identity and a visible feature.':
      (choice===type?'Identity correct. ':'The central target is a '+type+'. ')+(evidence===type?'Evidence correct. ':'Recheck the visible feature. ')+features[type][1];
  };
  get('next-smear').onclick=()=>{index++;if(index===deck.length){deck=shuffle(teachingFields);index=0;}show();};
  show();
}

const stages=[
 ['Vascular spasm','Smooth muscle contracts at the injured vessel. Local flow falls.'],
 ['Platelet adhesion','Exposed collagen and von Willebrand factor help tether platelets to the injury.'],
 ['Platelet recruitment','Activated platelets release signals and aggregate into a temporary plug.'],
 ['Fibrin stabilization','Thrombin cleaves fibrinogen. A cross-linked fibrin mesh reinforces the plug.'],
 ['Repair and fibrinolysis','As the vessel heals, plasmin breaks down fibrin and the clot resolves.']
];
const lesions={
 usual:{title:'Usual hemostasis',answer:'3',ask:'Which step reinforces the temporary plug?'},
 adhesion:{title:'Severely impaired platelet adhesion',answer:'1',ask:'Which step is impaired first?'},
 thrombin:{title:'Severely reduced thrombin activity',answer:'3',ask:'Which step is impaired most directly?'},
 plasmin:{title:'Severely reduced plasmin activity',answer:'4',ask:'Which step is impaired most directly?'}
};
export function clotStation(){
 return style+`<div class="blood-work"><h3>Follow a vessel repair</h3><p>Predict the effect of changing one mechanism, then step through the injury. Stages overlap in living tissue.</p><label>Condition<select data-clot-test>${Object.entries(lesions).map(([k,v])=>'<option value="'+k+'">'+v.title+'</option>').join('')}</select></label><label><span data-question></span><select data-guess><option value="">Choose a stage</option>${stages.map(([n],i)=>'<option value="'+i+'">'+n+'</option>').join('')}</select></label><button data-clot-check>Check prediction</button><p data-clot-reply role="status"></p><div data-clot-picture></div><div><button data-clot-prev>← Previous stage</button><button data-clot-play>Play sequence</button><button data-clot-next>Next stage →</button></div><h4 data-clot-stage></h4><p data-clot-note></p></div>`;
}
export function clotFrame(time,condition){
 const adhesion=condition!=='adhesion',fibrin=condition!=='thrombin',clearing=time===4&&condition!=='plasmin';
 const active=time>=1&&adhesion&&!clearing, n=active?(time===1?2:7):0;
 const platelets=Array.from({length:n},(_,i)=>'<ellipse class="recruit" cx="'+(178+i*11)+'" cy="'+(102+(i%3)*5)+'" rx="9" ry="6" fill="#d2a2dc" stroke="#efd8f2" />').join('');
 const threads=adhesion?'M167 101l32 25 34-32 24 28 M166 123l33-30 36 30 18-25 M173 106l77 8 M174 118l71-18':'M184 123l20-14 20 13';
 const strands=time>=3&&fibrin&&!clearing?'<g stroke="#f9cc74" fill="none" stroke-width="2"><path class="clot-strands" pathLength="1" d="'+threads+'"/></g>':'';
 const note=condition==='adhesion'&&time>=1?'Poor adhesion leaves too few attached platelets to form a reliable plug. Tissue-factor-driven fibrin formation can still occur.':
 condition==='thrombin'&&time===3?'Platelets form a temporary plug, but fibrin reinforcement is greatly reduced.':
 condition==='plasmin'&&time===4?'The vessel wall has repaired. Reduced plasmin activity delays breakdown of the fibrin mesh.':stages[time][1];
 const tear=clearing||time===4?'M20 121 H410':'M20 121 H177 L190 136 L206 121 L221 133 L235 121 H410';
 const top=time===0?'M20 40 H65 Q135 40 165 58 Q200 74 235 58 Q265 40 330 40 H410':'M20 40 H410';
 return {note,image:'<svg class="clot-picture" role="img" viewBox="0 0 430 162" aria-label="'+stages[time][0]+'. '+note+'"><rect width="430" height="162" rx="8" fill="#18292c"/><path d="'+top+' '+tear+'" fill="none" stroke="#ad7879" stroke-width="9"/><path d="M48 79h65m-10-8 10 8-10 8" fill="none" stroke="#c5d7e2" stroke-width="3"/>'+platelets+strands+'</svg><small>Arrow · blood flow &nbsp; Purple fragments · platelets &nbsp; Gold threads · fibrin</small>'};
}
export function mountClot(root){
 const get=x=>root.querySelector('[data-'+x+']');let i=0,timer;
 function show(){const frame=clotFrame(i,get('clot-test').value);get('clot-picture').innerHTML=frame.image;get('clot-stage').textContent=(i+1)+' / 5 · '+stages[i][0];get('clot-note').textContent=frame.note;get('clot-prev').disabled=i===0;get('clot-next').disabled=i===4;}
 function stop(){clearInterval(timer);timer=null;get('clot-play').textContent=i===4?'Replay sequence':'Play sequence';}
 get('clot-prev').onclick=()=>{i--;stop();show();};get('clot-next').onclick=()=>{i++;stop();show();};
 get('clot-play').onclick=()=>{if(timer){stop();return;}if(i===4)i=0;show();get('clot-play').textContent='Pause';timer=setInterval(()=>{if(!root.isConnected||!root.getClientRects().length){stop();return;}i++;show();if(i===4)stop();},1500);};
 function reset(){i=0;stop();get('guess').value='';get('clot-reply').textContent='';get('question').textContent=lesions[get('clot-test').value].ask;show();}
 get('clot-test').onchange=reset;get('clot-check').onclick=()=>{const guess=get('guess').value,answer=lesions[get('clot-test').value].answer;get('clot-reply').textContent=!guess?'Choose a stage.':(guess===answer?'Correct. ':'Revisit this stage: ')+stages[+answer][0]+'. '+clotFrame(+answer,get('clot-test').value).note;};reset();
}
