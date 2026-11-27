const signals = [
  ['Atrial muscle fibers stretch as circulating volume increases.','ANP','More sodium and water leave in the urine.','Atrial natriuretic peptide links a local stretch signal to renal sodium excretion, helping bring volume back toward its usual level.'],
  ['Oxygen delivery to the kidney remains low for several days.','EPO','More erythroid precursors mature in red marrow.','The kidney releases erythropoietin. New red cells increase oxygen-carrying capacity over time.'],
  ['Pressure falls in a renal afferent arteriole.','Renin','The angiotensin cascade supports pressure and sodium retention.','Juxtaglomerular cells release renin. Downstream angiotensin II and aldosterone help defend volume and pressure.'],
  ['Acidic chyme reaches the duodenum.','Secretin','Pancreatic ducts deliver bicarbonate-rich fluid.','Duodenal S cells release secretin. Bicarbonate buffers acid in the intestinal lumen.'],
  ['Lipids and partially digested protein enter the small intestine.','CCK','The gallbladder contracts and pancreatic enzyme secretion rises.','Intestinal I cells release cholecystokinin in response to meal components. Bile and enzymes support digestion.'],
  ['Peptides and stomach distension stimulate gastric G cells.','Gastrin','Gastric acid secretion increases.','Gastrin from the gastric antrum promotes acid secretion and supports gastric processing.'],
  ['Low calcium stimulates PTH and the kidney activates circulating 25-hydroxyvitamin D.','Calcitriol','Intestinal calcium absorption increases.','Skin supplies a precursor, liver hydroxylation yields calcidiol, and renal hydroxylation produces active calcitriol.']
];
const origins = [
  ['Anterior pituitary glandular cells','Oral ectoderm','An epithelial outgrowth from the roof of the embryonic mouth forms Rathke’s pouch. The anterior lobe develops secretory cells supplied by portal vessels.'],
  ['Posterior pituitary nerve tissue','Neural ectoderm','A downgrowth from the diencephalon retains its connection to the hypothalamus. This lobe contains axons and supporting glia.'],
  ['Adrenal cortex','Mesoderm','Mesoderm contributes the steroid-producing cortical tissue. The cortex and medulla have different embryonic origins.'],
  ['Adrenal medullary chromaffin cells','Neural crest','Neural crest cells migrate into the developing gland and differentiate into cells responsive to sympathetic preganglionic input.'],
  ['Thyroid follicular cells','Pharyngeal endoderm','The median endodermal thyroid primordium descends in the neck. Follicular cells produce T3 and T4.'],
  ['Parathyroid cells','Pharyngeal endoderm','Parathyroids develop from the third and fourth pharyngeal pouches. The glands subsequently migrate.']
];
const aging = [
  ['After menopause ovarian follicles produce less estradiol and inhibin. What happens to FSH?','FSH generally rises','Reduced ovarian negative feedback permits greater pituitary FSH output.'],
  ['A healthy older adult is compared with their young-adult baseline. What typically happens to pulsatile growth hormone secretion?','GH output generally falls','Growth hormone secretion tends to decrease with age. Other hormones and tissue sensitivities can follow different patterns.'],
  ['Which change is typical of the thymus between childhood and later adulthood?','Functional thymic tissue decreases','The thymus undergoes involution after puberty. The remaining organ continues to contain some active tissue.'],
  ['A target becomes less responsive to a hormone. Can the circulating concentration be predicted from that fact alone?','Additional feedback and secretion information is needed','Receptor sensitivity, secretion and clearance all contribute. Age alone does not dictate the direction of every hormone level.']
];
const select=(name,title,options)=>'<label>'+title+'<select data-'+name+'><option value="">Choose a response</option>'+[...new Set(options)].sort().map(v=>'<option>'+v+'</option>').join('')+'</select></label>';
export function endocrineCaseMarkup(id){
  const blood=id==='17.10';
  const mode=blood?'':'<label>Comparison<select data-case-mode><option value="origins">Embryonic origins</option><option value="aging">Life-stage changes</option></select></label>';
  return mode+'<p data-case-progress></p><h4 data-case-question></h4><div data-case-fields></div><button data-case-check>Check prediction</button> <button data-case-next>Next case →</button><div data-case-output role="status"></div>';
}
export function mountEndocrineCase(panel,id){
  const get=n=>panel.querySelector('[data-'+n+']');
  let i=0;
  const rows=()=>id==='17.10'?signals:get('case-mode').value==='origins'?origins:aging;
  function show(){
    const data=rows(),row=data[i];get('case-progress').textContent='Case '+(i+1)+' of '+data.length;
    get('case-question').textContent=row[0];get('case-output').textContent='';
    if(id==='17.10'){
      get('case-fields').innerHTML=select('signal-choice','Which hormone or enzyme is the immediate signal?',data.map(r=>r[1]))+select('target-choice','What follows at its target?',data.map(r=>r[2]));
    }else{
      get('case-fields').innerHTML=select('signal-choice',get('case-mode').value==='origins'?'Choose the embryonic source':'Choose the expected change',data.map(r=>r[1]));
    }
  }
  get('case-check').onclick=()=>{
    const row=rows()[i],signal=get('signal-choice').value,hasTarget=id==='17.10',target=get('target-choice')?.value;
    if(!signal||(hasTarget&&!target)){get('case-output').textContent='Choose each prediction before checking.';return;}
    if(hasTarget)get('case-output').textContent=(signal===row[1]?'Signal correct. ':'Expected signal: '+row[1]+'. ')+(target===row[2]?'Target response correct. ':'Expected response: '+row[2]+' ')+row[3];
    else get('case-output').textContent=(signal===row[1]?'Correct. ':'Expected response: '+row[1]+'. ')+row[2];
  };
  get('case-next').onclick=()=>{i=(i+1)%rows().length;show();};
  if(get('case-mode'))get('case-mode').onchange=()=>{i=0;show();};
  show();
}
