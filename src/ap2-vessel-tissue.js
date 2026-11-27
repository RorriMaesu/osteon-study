import {regionSpecimen} from './ap2-endocrine-regions.js';

const reference='https://openstax.org/books/anatomy-and-physiology-2e/pages/';
const credit='<small>OpenStax Anatomy and Physiology 2e, Fig. 20.3(c), LM ×160. Micrograph © 2012 Regents of the University of Michigan Medical School. Original labels covered for identification. <a href="'+reference+'20-1-structure-and-function-of-blood-vessels" target="_blank" rel="noreferrer">Textbook and image credits</a>.</small>';
const css='<style>.vessel-tissue{margin-block:1rem;padding:clamp(.7rem,2vw,1.25rem);border:1px solid #4a665f;border-radius:12px;min-width:0}.vessel-tissue figure{margin:.65rem 0}.vessel-tissue figure>svg,.vessel-tissue figure>img{width:100%;height:auto;max-height:38dvh;display:block;object-fit:contain}.vessel-tissue select{display:block;max-width:100%;width:100%;min-height:44px}.vessel-tissue button,.vessel-tissue summary{min-height:42px}.vessel-tissue [role=status]{min-height:1.4em}.vessel-tissue select,.vessel-tissue button{margin-block:.4rem}.vessel-tissue details>summary{cursor:pointer}.vessel-tissue .vt-grid{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);gap:1rem;align-items:start}@media(max-width:650px){.vessel-tissue .vt-grid{grid-template-columns:1fr}}</style>';
const tissue=[
 {visual:'slide',ask:'Identify vessel B and the strongest evidence for your conclusion.',choices:['Vein · pale lumen','Artery · relatively thick, muscular tunica media','Vein · round profile'],correct:1,note:'B has concentric layers of smooth muscle around a relatively small lumen. Lumen shape alone changes with preparation and section angle.'},
 {visual:'slide',ask:'Compare A with B. Which observation best identifies A?',choices:['Its wider, partly collapsed lumen has a thinner media relative to the lumen','Its lumen is empty, which identifies an artery','Its wall has more prominent concentric muscle than B'],correct:0,note:'A is a vein. The collapsed profile supports the identification when it is considered together with the relatively thin muscular layer.'},
 {visual:'fenestrated',ask:'Which type of capillary does this diagram show?',choices:['Sinusoidal','Continuous','Fenestrated'],correct:2,note:'Pores pass through the endothelial cells, while the basement membrane remains continuous. This structure supports rapid exchange in sites such as endocrine glands.'},
 {visual:'sinusoidal',ask:'Which location best matches this wall structure?',choices:['Skeletal muscle with continuous capillaries','Bone marrow, where blood cells can enter sinusoidal channels','Glomerulus with a continuous endothelial lining lacking fenestrae'],correct:1,note:'Large gaps and a discontinuous or absent basement membrane distinguish sinusoidal capillaries. They allow developing blood cells access to the circulation in marrow.'},
 {visual:'continuous',ask:'Which description fits this capillary?',choices:['An uninterrupted basement membrane under a continuous layer of endothelium','Wide, discontinuous gaps suitable for mature blood cells','Numerous transcellular pores along each endothelial cell'],correct:0,note:'Continuous capillaries have a continuous basement membrane. Exchange across the endothelium and its junctions depends on the tissue.'}
];
const fetal=[
 {ask:'A fetal red cell has just picked up oxygen at a placental villus. Which vessel carries it toward the fetus?',choices:['An umbilical artery','The umbilical vein','A maternal uterine vein'],correct:1,note:'The single umbilical vein carries relatively oxygen-rich fetal blood toward the liver. The two umbilical arteries carry fetal blood back to the placenta.'},
 {ask:'Trace the branch that bypasses much of the hepatic circulation.',choices:['Umbilical vein → ductus venosus → inferior vena cava','Umbilical vein → ductus arteriosus → descending aorta','Umbilical artery → foramen ovale → inferior vena cava'],correct:0,note:'Some umbilical venous blood perfuses the liver. The ductus venosus carries another portion toward the inferior vena cava and right atrium.'},
 {ask:'Which route can carry an incoming stream from the right atrium directly to the left atrium?',choices:['Ductus venosus through the liver','Ductus arteriosus into the pulmonary trunk','Foramen ovale across the interatrial septum'],correct:2,note:'Flow across the foramen ovale bypasses the right ventricle and lungs. Blood in the left atrium then passes into the left ventricle and aorta.'},
 {ask:'Now start in the right ventricle. Where can blood flow after it enters the pulmonary trunk?',choices:['Through the foramen ovale to the left atrium','Through the ductus arteriosus to the descending aorta','Through the ductus venosus to the liver'],correct:1,note:'High fetal pulmonary vascular resistance favors forward flow through the ductus arteriosus to the aorta. Some right-ventricular output still reaches the lungs.'},
 {ask:'After lung expansion, which change favors functional closure of the foramen ovale?',choices:['Higher left-atrial pressure than right-atrial pressure presses its flap against the septum','Lower left-atrial pressure opens the ductus venosus','Higher pulmonary vascular resistance redirects more blood through the foramen ovale'],correct:0,note:'As pulmonary resistance falls, more blood returns from the lungs to the left atrium. Cord clamping removes umbilical venous return. The resulting atrial pressure difference favors flap closure.'}
];
function slide(){
  return '<figure><svg viewBox="12 614 976 692" role="img" aria-label="Two vessels in a tissue section. A has an irregular, flattened, wide lumen. B has a rounder lumen and multiple circumferential bands of muscle."><image href="assets/ap2-figures/20.3.webp" width="999" height="1361"/><g fill="#193c43" stroke="white" stroke-width="3"><rect x="718" y="800" width="72" height="36" rx="6"/><rect x="249" y="1092" width="93" height="39" rx="6"/></g><g fill="white" text-anchor="middle" font-size="26" font-family="sans-serif"><text x="754" y="827">A</text><text x="295" y="1121">B</text></g></svg><figcaption>Vessel-wall micrograph</figcaption>'+credit+'</figure>';
}
function capillary(type){
  const sinus=type==='sinusoidal',fen=type==='fenestrated';
  const cells=sinus?[[18,107],[148,107],[297,88]]:[[18,118],[138,123],[263,122]];
  const desc=sinus?'Broad openings between endothelial cells and breaks in the basement membrane.':fen?'Several pores cross each endothelial cell. The underlying basement membrane is continuous.':'Closely adjoining endothelial cells have no visible pores. The underlying basement membrane is continuous.';
  const wall=cells.map(([x,w])=>'<rect x="'+x+'" y="58" width="'+w+'" height="19" rx="4" fill="#72b5a8"/><ellipse cx="'+(x+w*.27)+'" cy="68" rx="10" ry="5" fill="#326862"/>'+(fen?[.48,.64,.8].map(v=>'<path d="M'+(x+w*v)+' 56v23" stroke="#152d37" stroke-width="5"/>').join(''):'')).join('');
  const base=sinus?'M18 85h69m67 0h71m88 0h70':'M18 85h367';
  return '<figure><svg viewBox="0 0 405 153" role="img" aria-label="'+desc+'"><rect width="405" height="153" rx="8" fill="#152d37"/><text x="16" y="28" fill="#f3f3e9" font-size="15">Blood in lumen</text>'+wall+'<path d="'+base+'" stroke="#e5b975" stroke-width="4" fill="none"/><text x="16" y="122" fill="#f3f3e9" font-size="14">Interstitial space</text></svg><figcaption>Teaching diagram of one wall · green endothelium · gold basement membrane</figcaption></figure>';
}
const stations={'20.1':tissue,'20.6':fetal};
export function renderVesselTissue(id){
  if(!stations[id])return '';
  const placenta=id==='20.6';
  const specimen=placenta?'<details data-vt-placenta><summary>Explore the placenta and cord in 3D</summary><div data-vt-organ></div></details>':'';
  return css+'<section class="vessel-tissue" data-vt="'+id+'"><h3>'+(placenta?'Trace fetal circulation':'Vessel-wall practical')+'</h3><p>'+(placenta?'Start at placental exchange, trace each fetal shunt, and predict the change at birth.':'Use the tissue section to identify vessels, then interpret three capillary diagrams.')+'</p>'+specimen+'<div data-vt-task></div></section>';
}
export function mountVesselTissue(root,id){
  const items=stations[id],panel=root?.matches?.('[data-vt]')?root:root?.querySelector('[data-vt="'+id+'"]');
  if(!items||!panel||panel.dataset.vtMounted)return;
  panel.dataset.vtMounted='true';
  const slot=panel.querySelector('[data-vt-task]'),saved=[],details=panel.querySelector('[data-vt-placenta]');
  let index=0;
  if(details)details.ontoggle=()=>{
    if(!details.open||details.dataset.ready)return;
    details.dataset.ready='true';
    regionSpecimen(details.querySelector('[data-vt-organ]'),'placenta',async(host,config)=>{
      const {mountOrganViewer}=await import('./ap2-organ-viewer.js');
      if(host.isConnected)mountOrganViewer(host,config);
    });
  };
  function show(){
    const score=saved.reduce((sum,choice,i)=>sum+Number(choice===items[i].correct),0);
    if(index===items.length){
      const link=id==='20.1'?'20-1-structure-and-function-of-blood-vessels':'20-6-development-of-blood-vessels-and-fetal-circulation';
      const file=id==='20.1'?'20.3':'20.44';
      slot.innerHTML='<h4>Practical complete · '+score+' / '+items.length+'</h4><ol>'+items.map((q,i)=>'<li><strong>'+(saved[i]===q.correct?'Correct':'Review')+'</strong> · '+q.choices[q.correct]+'. '+q.note+'</li>').join('')+'</ol><details><summary>Open the labeled textbook figure</summary><figure><img src="assets/ap2-figures/'+file+'.webp" alt="'+(id==='20.1'?'Labeled arterial and venous wall structures and micrograph.':'Labeled fetal circulation and three shunts.')+'"><figcaption><a target="_blank" rel="noreferrer" href="'+reference+link+'">OpenStax Anatomy and Physiology 2e, Fig. '+file+'</a></figcaption></figure></details><button type="button" data-vt-restart>Practice again</button>';
      slot.querySelector('[data-vt-restart]').onclick=()=>{saved.length=0;index=0;show();};return;
    }
    const q=items[index];
    const image=q.visual==='slide'?slide():q.visual?capillary(q.visual):'';
    slot.innerHTML='<h4>Question '+(index+1)+' of '+items.length+'</h4><div class="'+(image?'vt-grid':'')+'">'+(image?'<div>'+image+'</div>':'')+'<div><label>'+q.ask+'<select data-vt-answer><option value="">Choose a response</option>'+q.choices.map((choice,i)=>'<option value="'+i+'">'+choice+'</option>').join('')+'</select></label><button type="button" data-vt-check>Check response</button><p role="status" data-vt-result></p><button type="button" data-vt-next hidden>'+(index===items.length-1?'See results':'Next question')+'</button></div></div>';
    const choice=slot.querySelector('[data-vt-answer]'),check=slot.querySelector('[data-vt-check]'),reply=slot.querySelector('[data-vt-result]'),next=slot.querySelector('[data-vt-next]');
    check.onclick=()=>{
      if(choice.value===''){reply.textContent='Choose a response first.';return;}
      saved[index]=Number(choice.value);choice.disabled=check.disabled=true;
      reply.textContent=(saved[index]===q.correct?'Correct. ':'Review your choice. ')+q.note;
      next.hidden=false;next.focus();
    };
    next.onclick=()=>{index++;show();slot.querySelector('select,button,summary')?.focus();};
  }
  show();
}
