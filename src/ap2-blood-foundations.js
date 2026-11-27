const book='https://openstax.org/books/anatomy-and-physiology-2e/pages/';
const style=`<style>
.bf-practical{padding:clamp(.7rem,2vw,1.3rem);border:1px solid #40585a;border-radius:12px;min-width:0;background:#16272c}
.bf-practical h3{margin:0 0 .45rem}.bf-practical label{display:grid;gap:.3rem}.bf-practical input,.bf-practical select{max-width:100%;min-height:40px}
.bf-practical .bf-actions{display:flex;align-items:end;flex-wrap:wrap;gap:.45rem .8rem;margin:.6rem 0}.bf-practical button{min-height:40px}
.bf-practical [hidden]{display:none!important}.bf-practical figure{margin:.6rem 0}.bf-practical svg{width:100%;height:auto;max-height:185px;display:block;background:#102027;border-radius:8px}.bf-practical svg text{font:13px system-ui;fill:#e5efed}
.bf-chain{display:flex;align-items:center;flex-wrap:wrap;gap:.4rem;margin:.75rem 0}.bf-chain span{border:1px solid #527672;border-radius:.35rem;padding:.35rem .55rem}
.bf-practical .bf-feedback{min-height:1.3em;color:#d5e8dc}.bf-practical small{display:block}.bf-practical .bf-amount{max-width:9rem}
</style>`;
const option=(value,label)=>`<option value="${value}">${label}</option>`;
const buttons=(attribute,labels)=>labels.map((label,i)=>`<button type="button" data-${attribute}="${i}">${label}</button>`).join('');
const svg=(label,art)=>`<figure><svg viewBox="0 0 390 160" role="img" aria-label="${label}">${art}</svg></figure>`;
const feedback='<p data-bf-feedback class="bf-feedback" role="status"></p>';

const reference={cells:4.50,buffy:.05,plasma:5.45};
export const hematocritCases=[
  ['Add 2.00 mL of plasma',{...reference,plasma:7.45},'falls','The added plasma increases the denominator while packed red-cell volume stays fixed.'],
  ['Remove 2.00 mL of plasma',{...reference,plasma:3.45},'rises','Removing plasma reduces the denominator while packed red-cell volume stays fixed.'],
  ['Remove half of well-mixed whole blood',{cells:2.25,buffy:.025,plasma:2.725},'stays the same','Removing half of the mixed sample halves every component. The red-cell fraction stays the same.']
];
export function hematocrit(sample){return 100*sample.cells/(sample.cells+sample.buffy+sample.plasma);}
function tube(sample,x,title){
  const h=v=>v*9,base=131,w=48,red=h(sample.cells),buff=h(sample.buffy),plasma=h(sample.plasma);
  return `<g transform="translate(${x},0)"><rect x="0" y="17" width="${w}" height="116" rx="4" fill="none" stroke="#70878a"/>
    <rect x="2" y="${base-red}" width="44" height="${red}" fill="#c46f74"/>
    <rect x="2" y="${base-red-buff}" width="44" height="${buff}" fill="#fff2df"/>
    <rect x="2" y="${base-red-buff-plasma}" width="44" height="${plasma}" fill="#daa655"/>
    <text x="24" y="151" text-anchor="middle">${title}</text></g>`;
}
function hematocritArt(sample){
  return svg(sample?'Blood columns before and after the selected volume change':'A centrifuged reference sample, with the comparison hidden',
    tube(reference,62,'Before')+(sample?tube(sample,261,'After'):'<rect x="261" y="17" width="48" height="116" fill="none" stroke="#70878a" stroke-dasharray="4 3"/><text x="285" y="83" text-anchor="middle">?</text><text x="285" y="151" text-anchor="middle">After</text>')+
    '<path d="M109 61H122 M109 90.3H118L122 91.5 M109 117H122" fill="none" stroke="#abc1bf"/><text x="125" y="64">Plasma</text><text x="125" y="95">Buffy coat</text><text x="125" y="121">Red cells</text>');
}
function renderHct(){return `<h3>Predict the packed red-cell fraction</h3><p>A mixed 10.00 mL sample contains 4.50 mL red cells, 0.05 mL white cells and platelets, and 5.45 mL plasma. Its hematocrit is 45%.</p>
  <label>Change the original sample<select data-bf-scenario>${hematocritCases.map(([l],i)=>option(i,l)).join('')}</select></label><div data-bf-art>${hematocritArt(null)}</div><p>After centrifugation, how does hematocrit compare with 45%?</p>
  <div class="bf-actions">${buttons('hct-pick',['Rises','Falls','Stays the same'])}</div>${feedback}`;}
function mountHct(root){
  const input=root.querySelector('[data-bf-scenario]'),art=root.querySelector('[data-bf-art]'),message=root.querySelector('[data-bf-feedback]');
  input.onchange=()=>{art.innerHTML=hematocritArt(null);message.textContent='';};
  root.querySelectorAll('[data-hct-pick]').forEach(b=>b.onclick=()=>{
    const [,sample,direction,why]=hematocritCases[+input.value],total=sample.cells+sample.buffy+sample.plasma;
    const correct=['rises','falls','stays the same'][+b.dataset.hctPick]===direction;
    art.innerHTML=hematocritArt(sample);
    message.textContent=(correct?'Correct. ':'Compare the two volumes. ')+`Hematocrit ${direction}. ${sample.cells.toFixed(2)} mL packed red cells ÷ ${total.toFixed(2)} mL whole blood × 100 = ${Number(hematocrit(sample).toFixed(2))}%. ${why}`;
  });
}

export const lineages=[
  {target:'Erythrocyte',cue:'Replace oxygen-carrying cells when kidney tissue receives less oxygen.',branch:'Myeloid',precursor:'Erythroblast → reticulocyte',note:'Renal erythropoietin supports erythroid precursor survival and maturation. A reticulocyte matures into an erythrocyte.'},
  {target:'Platelets',cue:'Supply fragments that take part in the initial plug at an injured vessel.',branch:'Myeloid',precursor:'Megakaryocyte',note:'Thrombopoietin, made mainly by the liver, supports megakaryocyte development. Megakaryocytes shed cytoplasmic fragments into the blood.'},
  {target:'Neutrophil',cue:'Produce a granulocyte that phagocytoses microbes.',branch:'Myeloid',precursor:'Myeloblast → granulocyte precursors',note:'G-CSF promotes neutrophil production and maturation in marrow. A segmented nucleus develops as the cell matures.'},
  {target:'T lymphocyte',cue:'Generate a cell for antigen-specific cellular immunity.',branch:'Lymphoid',precursor:'Lymphoid precursor → thymic maturation',note:'T-lineage precursors leave marrow for the thymus, where they mature and undergo selection.'}
];
const precursors=[lineages[1].precursor,lineages[3].precursor,lineages[0].precursor,lineages[2].precursor];
function renderLineage(){return `<h3>Build a blood-cell lineage</h3><label>Formed element to produce<select data-bf-scenario>${lineages.map((c,i)=>option(i,c.target)).join('')}</select></label><p data-bf-cue></p><div class="bf-chain" data-bf-chain aria-label="Developing lineage"></div>
  <p data-bf-prompt></p><div class="bf-actions" data-bf-options></div>${feedback}<button type="button" data-bf-reset>Start this lineage again</button>`;}
function mountLineage(root){
  const find=n=>root.querySelector('[data-bf-'+n+']'),pick=find('scenario');
  let stage=0;
  function show(){
    const term=lineages[+pick.value],path=['Hematopoietic stem cell',stage>0?term.branch+' progenitor':'?',stage>1?term.precursor:'?',term.target];
    find('cue').textContent=term.cue;find('chain').innerHTML=path.map(l=>'<span>'+l+'</span>').join(' → ');
    find('prompt').textContent=['Choose the progenitor branch.','Choose the next developmental route.','Lineage complete.'][stage];
    const options=stage===0?['Lymphoid','Myeloid']:stage===1?precursors:[];
    const box=find('options');box.replaceChildren();
    options.forEach(l=>{
      const b=document.createElement('button');b.type='button';b.textContent=l;box.append(b);
      b.onclick=()=>{
        if(l!==(stage===0?term.branch:term.precursor)){
          find('feedback').textContent=stage===0?'Lymphoid progenitors give rise to lymphocytes. Red cells, platelets and most other leukocytes arise along myeloid routes.':'Consider whether the mature product is an oxygen carrier, a cell fragment, a granulocyte or a lymphocyte.';return;
        }
        stage++;show();find('feedback').textContent=stage===2?term.note:'Correct branch. Which precursor produces the requested formed element?';
      };
    });
  }
  function reset(){stage=0;find('feedback').textContent='';show();}
  pick.onchange=reset;find('reset').onclick=reset;reset();
}

export function oxygenSites(hb,saturation){const capacity=4*hb;return {capacity,bound:capacity*saturation/100};}
function oxygenArt(hb,sat){
  const {capacity,bound}=oxygenSites(hb,sat);
  const positions=[[-15,-13],[15,-13],[-15,13],[15,13]];
  let art='';
  // Occupancy is arranged evenly to make percentages easy to count.
  for(let i=0;i<hb;i++){
    const x=195+(i-(hb-1)/2)*76;
    art+=`<g transform="translate(${x} 74)">${positions.map(([dx,dy],j)=>{
      const filled=sat!==null&&j<sat/25;
      return `<circle cx="${dx}" cy="${dy}" r="15" fill="${filled?'#b86b75':'#31464f'}" stroke="#d59aaa"/><text text-anchor="middle" x="${dx}" y="${dy+4}">${filled?'O₂':'·'}</text>`;
    }).join('')}<text x="0" y="56" text-anchor="middle">Hb ${i+1}</text></g>`;
  }
  return svg(sat===null?hb+' hemoglobin molecules with four binding sites each; occupancy is hidden':bound+' of '+capacity+' available heme sites carry oxygen',art);
}
function renderOxygen(){return `<h3>Count hemoglobin’s oxygen-binding sites</h3><p>Each hemoglobin has four heme groups. Each heme can bind one O₂ molecule. Set the amount of hemoglobin and the fraction of sites occupied.</p>
  <div class="bf-actions"><label>Hemoglobin molecules<select data-bf-count>${[1,2,3,4].map(n=>`<option value="${n}" ${n===3?'selected':''}>${n}</option>`).join('')}</select></label>
  <label>Saturation<select data-bf-saturation>${[0,25,50,75,100].map(n=>`<option value="${n}" ${n===75?'selected':''}>${n}%</option>`).join('')}</select></label></div><div data-bf-art></div>
  <form data-bf-form class="bf-actions"><label>How many O₂ molecules are bound?<input class="bf-amount" data-bf-answer type="number" min="0" step="1" required inputmode="numeric"></label><button type="submit">Check count</button></form>${feedback}<small>The slots show binding capacity. Try 4 Hb at 50%, then 2 Hb at 100%. Compare the number bound with the number of available sites in each group.</small>`;}
function mountOxygen(root){
  const find=n=>root.querySelector('[data-bf-'+n+']'),count=find('count'),sat=find('saturation'),art=find('art'),result=find('feedback'),answer=find('answer');
  function reset(){answer.value='';result.textContent='';art.innerHTML=oxygenArt(+count.value,null);}
  find('form').onsubmit=e=>{
    e.preventDefault();if(answer.value==='')return;
    const hb=+count.value,saturation=+sat.value,{capacity,bound}=oxygenSites(hb,saturation);
    const correct=Number(answer.value)===bound;
    art.innerHTML=oxygenArt(hb,saturation);
    result.textContent=(correct?'Correct. ':Number(answer.value)===capacity?'That is the total capacity. ':'Count one O₂ per occupied heme. ')+
      `${hb} Hb × 4 sites = ${capacity} available sites. At ${saturation}% saturation, ${bound} carry O₂ and ${capacity-bound} are empty.`;
  };
  count.onchange=sat.onchange=reset;reset();
}

const practicals={
  '18.1':[renderHct,mountHct,'18-1-an-overview-of-blood'],
  '18.2':[renderLineage,mountLineage,'18-2-production-of-the-formed-elements'],
  '18.3':[renderOxygen,mountOxygen,'18-3-erythrocytes']
};
export function renderBloodFoundations(id){
  const entry=practicals[id];if(!entry)return '';
  return style+`<section class="bf-practical" data-blood-foundation="${id}">${entry[0]()}<small><a href="${book+entry[2]}" target="_blank" rel="noreferrer">OpenStax A&amp;P 2e · section ${id}</a></small></section>`;
}
export function mountBloodFoundations(parent,id){
  const entry=practicals[id],selector='[data-blood-foundation="'+id+'"]';
  const root=parent?.matches?.(selector)?parent:parent?.querySelector(selector);
  if(!entry||!root||root.dataset.mounted)return;
  root.dataset.mounted='true';entry[1](root);
}

