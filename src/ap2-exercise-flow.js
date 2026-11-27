// OpenStax Anatomy and Physiology 2e, Table 20.3. Values in mL/min.
export const perfusionBeds=[
  ['Skeletal muscle',1200,4500,12500],['Heart',250,350,750],['Brain',750,750,750],
  ['Skin',500,1500,1900],['Kidneys',1100,900,600],['Gastrointestinal tract',1400,1100,600],
  ['Other tissues',600,400,400]
];
const number=n=>n.toLocaleString('en-US');
export function flowBudget(column){
  const total=perfusionBeds.reduce((sum,row)=>sum+row[column],0);
  const available=perfusionBeds[0][column]+perfusionBeds[2][column];
  return {total,available,reserved:total-available,brainShare:100*perfusionBeds[2][column]/total};
}
export function mountExerciseFlow(host){
  host.innerHTML='<h2>Distribute blood during exercise</h2><p>At rest, the brain receives 750 of the 5,800 mL pumped each minute in this textbook example. During exercise, keep brain flow at its resting value and send the remaining available blood to skeletal muscle.</p>'+
    '<label>Workload <select data-perfusion-load><option value="2">Mild exercise</option><option value="3" selected>Maximal exercise</option></select></label>'+
    '<p data-perfusion-budget></p><div class="flow-allocation"><label>Flow to brain (mL/min) <input type="number" data-perfusion-number min="0" step="1" inputmode="numeric"></label>'+
    '<label>Adjust brain allocation <input type="range" data-perfusion-slider min="0" step="50"></label><output data-perfusion-muscle></output></div>'+
    '<label>Compared with rest, what happens to the brain’s percentage of cardiac output? <select data-perfusion-prediction><option value="">Choose a prediction</option><option value="higher">It increases</option><option value="equal">It stays the same</option><option value="lower">It decreases</option></select></label>'+
    '<p><button type="button" data-perfusion-check>Check my allocation</button></p><div role="status" data-perfusion-answer></div>'+
    '<details><summary>Flow reserved for the other five tissue beds</summary><div data-perfusion-other></div></details>'+
    '<small>Reference values from <a href="https://openstax.org/books/anatomy-and-physiology-2e/pages/20-4-homeostatic-regulation-of-the-vascular-system" target="_blank" rel="noreferrer">OpenStax A&amp;P 2e, Table 20.3</a>.</small>';
  const el=name=>host.querySelector('[data-perfusion-'+name+']');
  const load=el('load'),field=el('number'),slider=el('slider'),prediction=el('prediction'),answer=el('answer');
  const brain=()=>field.valueAsNumber;
  function update(){
    answer.replaceChildren();
    el('muscle').textContent=field.value!==''&&field.validity.valid?'Flow to skeletal muscle · '+number(flowBudget(+load.value).available-brain())+' mL/min':'Enter a brain flow within the available budget.';
  }
  function reset(){
    const column=+load.value,{total,reserved,available}=flowBudget(column);
    el('budget').textContent='Cardiac output is '+number(total)+' mL/min. Other organs receive '+number(reserved)+' mL/min, leaving '+number(available)+' mL/min for brain and skeletal muscle together.';
    field.max=slider.max=available;field.value=slider.value=0;prediction.value='';update();
    el('other').innerHTML='<ul>'+perfusionBeds.filter((_,i)=>i!==0&&i!==2).map(row=>'<li>'+row[0]+' · '+number(row[column])+' mL/min</li>').join('')+'</ul>';
  }
  load.onchange=reset;
  slider.oninput=()=>{field.value=slider.value;update();};
  field.oninput=()=>{if(field.value!==''&&field.validity.valid)slider.value=field.value;update();};
  prediction.onchange=update;
  el('check').onclick=()=>{
    if(field.value===''||!field.validity.valid){field.focus();field.reportValidity();return;}
    if(!prediction.value){answer.textContent='Choose what happens to the brain’s percentage first.';prediction.focus();return;}
    const column=+load.value,{total,brainShare}=flowBudget(column),rest=flowBudget(1);
    const allocation=brain()===750?'Your allocation preserves resting cerebral blood flow.':'Your allocation gives the brain '+number(brain())+' mL/min. The reference keeps it at 750 mL/min.';
    const percent=prediction.value==='lower'?'Your percentage prediction is correct.':'The brain’s share decreases as the total output rises.';
    answer.innerHTML='<p>'+allocation+' '+percent+'</p><p>In the reference, brain flow stays at 750 mL/min while skeletal muscle receives '+number(perfusionBeds[0][column])+' mL/min. The same 750 is '+rest.brainShare.toFixed(1)+'% of resting output and '+brainShare.toFixed(1)+'% of '+number(total)+' mL/min.</p>'+
      '<div class="flow-bars"><label>Brain’s share at rest <meter min="0" max="100" value="'+rest.brainShare+'"></meter> '+rest.brainShare.toFixed(1)+'%</label>'+
      '<label>Brain’s share during exercise <meter min="0" max="100" value="'+brainShare+'"></meter> '+brainShare.toFixed(1)+'%</label></div>';
  };
  reset();
}
