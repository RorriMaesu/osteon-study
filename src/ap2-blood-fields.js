const directory = 'assets/ap2-blood/';
const samples = [
  {type:'Erythrocyte',x:502,y:180,description:'A pink disc with a pale center.'},
  {type:'Platelet',x:510,y:82,description:'A tiny purple granular fragment between pink discs.'},
  {type:'Leukocyte',x:393,y:626,description:'A large cell with a dark segmented nucleus and pale cytoplasm.'}
];
const countCells = [
  ['Lymphocyte',86,33],['Lymphocyte',52,83],
  ['Neutrophil',427,112],['Neutrophil',346,198],['Neutrophil',371,292]
];
const normalCredit='<small>Keith Chambers, SCOOTER Project. Resized and converted to WebP. <a href="https://commons.wikimedia.org/wiki/File:Normal_Adult_Blood_Smear.JPG" target="_blank" rel="noreferrer">Original Giemsa smear</a> · <a href="https://creativecommons.org/licenses/by-sa/3.0/" target="_blank" rel="noreferrer">CC BY-SA 3.0</a>.</small>';
const cdcCredit='<small>CDC and Steven Glenn, 1979. Public-domain photomicrograph, cropped display. <a href="https://wwwn.cdc.gov/phil/Details.aspx?pid=5864" target="_blank" rel="noreferrer">Original free CDC image</a>.</small>';
const scanStyle='<style>.smear-area{max-width:530px;position:relative;margin:.65rem auto}.smear-area img,.smear-area svg{width:100%;height:auto;display:block}.blood-work .smear-ring{position:absolute;transform:translate(-50%,-50%);padding:0;margin:0;min-width:28px;min-height:28px;width:6%;aspect-ratio:1;height:auto;border:2px solid #204f54;border-radius:50%;background:transparent;box-shadow:0 0 0 1px white}.smear-ring{z-index:1;scroll-margin-block:80px}.smear-ring::after{content:"";position:absolute;inset:-8px;border-radius:50%}.smear-ring span{position:absolute;bottom:92%;left:65%;background:#102d31;color:white;border-radius:3px;padding:0 3px;font-size:.75rem}.smear-ring:focus-visible{outline:3px solid #ffbc43}.smear-counts{display:flex;gap:1rem;flex-wrap:wrap}.smear-counts input{width:6em;display:block;max-width:100%;min-height:40px;font:inherit}</style>';
export function fieldLabMarkup(mode){
  if(mode==='field')return scanStyle+'<h4>Find the formed element</h4><p data-scan-prompt></p><div class="smear-area"><img width="960" height="720" src="'+directory+'normal-adult-field.webp" alt="An adult peripheral smear with many pink discs, sparse purple fragments, and larger cells with dark nuclei.">'+samples.map((s,i)=>'<button class="smear-ring" data-sample="'+i+'" aria-label="Inspect site '+String.fromCharCode(65+i)+'" style="left:'+s.x/9.6+'%;top:'+s.y/7.2+'%"><span>'+String.fromCharCode(65+i)+'</span></button>').join('')+'</div><details><summary>Read the features at the marked sites</summary><ul>'+samples.map((s,i)=>'<li>'+String.fromCharCode(65+i)+' · '+s.description+'</li>').join('')+'</ul></details><p data-field-result role="status"></p><button data-next-target>Next target</button><p>'+normalCredit+'</p>';
  return scanStyle+'<h4>Differential in a defined field</h4><p>Scan the entire frame and count only complete white cells. Exclude cells cut by the edges and small platelet clusters.</p><div class="smear-area"><svg viewBox="0 3 650 320" role="img" aria-label="Giemsa-stained leukocyte field. A text description follows."><image href="'+directory+'phil-5864.webp" width="700" height="462"/><g data-count-key></g></svg></div><details><summary>Read the field observations</summary><p>Two fully visible cells at the upper left have round, dark nuclei. Three across the middle have segmented nuclei. Another round-nucleated cell is cut by the top edge. Scattered granule clusters lack a nucleus.</p></details><div class="smear-counts"><label>Neutrophils<input data-count-neut type="number" min="0" max="99" inputmode="numeric"></label><label>Lymphocytes<input data-count-lymph type="number" min="0" max="99" inputmode="numeric"></label></div><button data-count-check>Check tally</button><p data-field-result role="status"></p><p>'+cdcCredit+'</p><details><summary>Compare granules and nuclear shapes</summary><img style="width:min(100%,540px)" src="'+directory+'phil-15133.webp" alt="Labeled eosinophil, basophil and lymphocyte surrounded by erythrocytes."><p><small>CDC and Dr. Candler Ballard, 1974. Public domain. <a href="https://wwwn.cdc.gov/phil/Details.aspx?pid=15133" target="_blank" rel="noreferrer">Original free CDC slide</a>.</small></p></details>';
}
export function mountFieldLab(host, mode){
  const feedback=host.querySelector('[data-field-result]');
  if(mode==='field'){
    let index=1;
    const prompt=()=>{host.querySelector('[data-scan-prompt]').textContent='Find the '+samples[index].type.toLowerCase()+' and select its ring.';feedback.textContent='';};
    for(const button of host.querySelectorAll('[data-sample]'))button.onclick=()=>{
      const sample=samples[Number(button.dataset.sample)];
      feedback.textContent=(sample===samples[index]?'Correct. ':'That site marks a '+sample.type.toLowerCase()+'. ')+sample.description;
    };
    host.querySelector('[data-next-target]').onclick=()=>{index=(index+1)%samples.length;prompt();};
    prompt(); return;
  }
  const n=host.querySelector('[data-count-neut]'),l=host.querySelector('[data-count-lymph]'),key=host.querySelector('[data-count-key]');
  const clear=()=>{feedback.textContent='';key.replaceChildren();};
  n.oninput=l.oninput=clear;
  host.querySelector('[data-count-check]').onclick=()=>{
    if(![n,l].every(input=>input.value!==''&&input.validity.valid)){feedback.textContent='Enter a whole number from 0 to 99 for each cell type.';return;}
    const correct=Number(n.value)===3&&Number(l.value)===2;
    feedback.textContent=(correct?'Correct. ':'Compare your tally with the outlined cells. ')+'Three neutrophils (N) and two lymphocytes (L) give 60% and 40% of these five leukocytes. A differential from this selected teaching field cannot establish a patient’s blood-cell distribution.';
    key.innerHTML=countCells.map(([type,x,y])=>'<g><circle cx="'+x+'" cy="'+y+'" r="28" fill="none" stroke="#1d6470" stroke-width="3"/><text x="'+(x+24)+'" y="'+(y-13)+'" fill="#132a32" stroke="white" stroke-width="3" paint-order="stroke" font-size="19">'+type[0]+'</text></g>').join('');
  };
}
