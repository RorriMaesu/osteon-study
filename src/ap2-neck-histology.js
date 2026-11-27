const directory='assets/ap2-glands/';
const fields=[
  {file:'thyroid-histology.webp',name:'Thyroid',description:'Round profiles contain pink material. A layer of cells outlines each profile.',points:[[25,23,'Pale pink center of a round follicle'],[47,68,'Rim of cells around a follicle']]},
  {file:'parathyroid-histology.webp',name:'Parathyroid',description:'Closely packed small cells surround a pale blood vessel. Large colloid-filled follicles are absent.',points:[[50,45,'Pale vessel lumen'],[63,82,'Cluster of small, closely packed cells']]}
];
const source='https://openstax.org/books/anatomy-and-physiology-2e/pages/';

export function neckHistology(host){
  function buildField(f,i){
    return '<figure style="margin:0;min-width:0"><figcaption>Field '+(i+1)+'</figcaption><div style="position:relative">'+
      '<img src="'+directory+f.file+'" alt="'+f.description+'" style="width:100%;height:auto;display:block">'+
      f.points.map(([x,y],j)=>'<button type="button" data-neck-site="'+i+'-'+j+'" aria-pressed="false" aria-label="Mark field '+(i+1)+', site '+(j+1)+'" style="position:absolute;left:'+x+'%;top:'+y+'%;transform:translate(-50%,-50%);min-width:36px;min-height:36px;padding:2px;border:2px solid white;border-radius:50%;background:#153e4ac9;color:#fff">'+(j+1)+'</button>').join('')+'</div>'+
      '<details><summary>Describe marked sites</summary><ol>'+f.points.map(([, ,description])=>'<li>'+description+'</li>').join('')+'</ol></details></figure>';
  }
  host.innerHTML='<h4>Which tissue responds to a fall in ionized calcium?</h4><p>Mark the chief-cell tissue in one of the two fields, then predict its response.</p>'+
    '<div class="gland-grid">'+fields.map(buildField).join('')+'</div>'+
    '<label>Hormone released and direction of change<select data-neck-hormone><option value="">Choose a prediction</option><option value="tsh">TSH rises</option><option value="less">PTH falls</option><option value="more">PTH rises</option></select></label>'+
    '<button type="button" data-neck-micro-check>Check tissue and response</button><p data-neck-micro-result role="status"></p>'+
    '<small>Micrographs © 2012 Regents of the University of Michigan Medical School, via OpenStax Anatomy and Physiology 2e. Tissue panels cropped. <a target="_blank" rel="noreferrer" href="'+source+'17-4-the-thyroid-gland">Fig. 17.12c</a> · <a target="_blank" rel="noreferrer" href="'+source+'17-5-the-parathyroid-glands">Fig. 17.15b</a> · <a target="_blank" rel="noreferrer" href="https://creativecommons.org/licenses/by-nc-sa/4.0/">CC BY-NC-SA 4.0</a></small>';
  const feedback=host.querySelector('[data-neck-micro-result]'),hormone=host.querySelector('[data-neck-hormone]');
  const buttons=[...host.querySelectorAll('[data-neck-site]')];
  let marked='';
  for(const button of buttons)button.onclick=()=>{
    marked=button.dataset.neckSite;
    for(const b of buttons){b.setAttribute('aria-pressed',String(button===b));b.style.outline=button===b?'3px solid #ffd477':'';}
    feedback.textContent='Marked '+button.getAttribute('aria-label').slice(5)+'.';
  };
  hormone.onchange=()=>{feedback.textContent='';};
  host.querySelector('[data-neck-micro-check]').onclick=()=>{
    if(!marked||!hormone.value){feedback.textContent='Mark one site and select a hormone response.';return;}
    const tissue=marked==='1-1',prediction=hormone.value==='more';
    feedback.textContent=(tissue?'Tissue identified. ':'Look at field 2, site 2. ')+
      'Field 2 shows solid groups of parathyroid chief cells around small vessels. Field 1 shows thyroid follicles with colloid. '+
      (prediction?'Your prediction is correct. ':'Recheck the direction of the calcium feedback. ')+
      'A fall in ionized calcium increases PTH secretion from chief cells.';
  };
}
