import panels from '../assets/ap2-blood/tally-specimens.json' with {type:'json'};

const descriptions=[
  ['Curving dark nucleus with lobes joined by a narrow bridge, pale granular cytoplasm.','Central cell with a round dense nucleus and a narrow blue rim. A second cell is cut off at the top edge.','Round dark nucleus with a thin blue rim of cytoplasm.','Round dense nucleus, uneven blue cytoplasmic border.','Two dark nuclear lobes with a connecting bridge and pale speckled cytoplasm.'],
  ['A lobulated purple nucleus curves around pale granular cytoplasm.','Two dark lobes connected within a pale cell.','Dense round nucleus with a narrow blue rim.','Segmented nucleus with a bridge between lobes and a pale granular rim.','Dark connected lobes within light pink granular cytoplasm.']
];
const counts=[[4000,0.50],[10000,0.50]];

export function tallies(cells){
  return {neutrophils:cells.filter(c=>c.type==='neutrophil').length,lymphocytes:cells.filter(c=>c.type==='lymphocyte').length};
}
export function absoluteCount(total,fraction){return total*fraction;}

function panelMarkup(ix){
  return '<h4>Count the centered leukocytes</h4><p>These five separate microscope fields are grouped for practice. Count the centered cell once in each image. Each image is a different cell.</p>'+
    '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,8rem),1fr));gap:.45rem">'+panels[ix].map((f,i)=>
      '<figure style="margin:0"><figcaption>Field '+(i+1)+'</figcaption><img src="assets/ap2-blood/'+f.file+'" alt="'+descriptions[ix][i]+'" style="max-width:100%;height:auto"><span data-cell-key></span></figure>').join('')+'</div>'+
    '<details><summary>Read the centered cells’ features</summary><ol>'+descriptions[ix].map(v=>'<li>'+v+'</li>').join('')+'</ol></details>'+
    '<div class="smear-counts"><label>Neutrophils<input type="number" data-tally-n min="0" max="5" step="1"></label><label>Lymphocytes<input type="number" data-tally-l min="0" max="5" step="1"></label></div>'+
    '<button type="button" data-tally-grade>Check these five cells</button><p role="status" data-tally-result></p>'+
    '<small>Andrea Acevedo and colleagues, Hospital Clínic de Barcelona. Pathologist-classified peripheral blood cells, resized. <a href="https://data.mendeley.com/datasets/snkd93bnjr/1" target="_blank" rel="noreferrer">Source dataset</a> · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>.</small>';
}
function absoluteMarkup(){
  return '<h4>From a percentage to an absolute count</h4><p>Both samples have 50% neutrophils. Sample A has 4,000 total white blood cells/µL and sample B has 10,000/µL. Calculate the absolute neutrophil count in each.</p>'+
    '<div class="smear-counts">'+['A','B'].map(label=>'<label>Sample '+label+' (cells/µL)<input type="number" min="0" step="1" data-absolute></label>').join('')+'</div>'+
    '<button type="button" data-tally-grade>Check absolute counts</button><p role="status" data-tally-result></p>';
}
export function mountDifferentialSets(host){
  const worked=document.createElement('div');
  worked.append(...host.childNodes);
  host.innerHTML='<label>Counting exercise<select data-tally-field><option value="example">Worked mixed field</option><option value="0">New fields · set A</option><option value="1">New fields · set B</option><option value="absolute">Absolute counts</option></select></label>';
  const challenge=document.createElement('div');host.append(worked,challenge);
  const pick=host.querySelector('[data-tally-field]');
  pick.onchange=()=>{
    const value=pick.value,ix=Number(value);worked.hidden=value!=='example';challenge.replaceChildren();
    if(!worked.hidden)return;
    const absolute=value==='absolute';
    challenge.innerHTML=absolute?absoluteMarkup():panelMarkup(ix);
    const slots=[...challenge.querySelectorAll('input')],keys=[...challenge.querySelectorAll('[data-cell-key]')];
    const status=challenge.querySelector('[data-tally-result]');
    for(const input of slots)input.oninput=()=>{status.textContent='';keys.forEach(k=>k.textContent='');};
    challenge.querySelector('[data-tally-grade]').onclick=()=>{
      if(!slots.every(el=>el.value!==''&&el.validity.valid)){status.textContent='Enter a valid whole number in each box.';return;}
      if(absolute){
        const values=counts.map(row=>absoluteCount(...row));
        const correct=slots.every((el,j)=>el.valueAsNumber===values[j]);
        status.textContent=(correct?'Correct. ':'Compare your calculation. ')+'A: 4,000 × 0.50 = 2,000 cells/µL. B: 10,000 × 0.50 = 5,000 cells/µL. B has more circulating neutrophils per microliter despite the identical percentage.';return;
      }
      const {neutrophils,lymphocytes}=tallies(panels[ix]);
      const correct=slots[0].valueAsNumber===neutrophils&&slots[1].valueAsNumber===lymphocytes;
      status.textContent=(correct?'Correct. ':'Review the key below each field. ')+neutrophils+' neutrophils and '+lymphocytes+' lymphocytes. Trace the nucleus in each centered cell to see where its lobes join.';
      keys.forEach((key,j)=>{key.textContent=panels[ix][j].type;});
    };
  };
}
