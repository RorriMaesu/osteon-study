import {regionSpecimen} from './ap2-endocrine-regions.js';
import {tissueMarkup,mountTissueModel} from './ap2-tissue-models.js';
import {endocrineCaseMarkup,mountEndocrineCase} from './ap2-endocrine-cases.js';
import {neckHistology} from './ap2-neck-histology.js';

const root = 'assets/ap2-glands/';
const bodyCredit = 'BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International. Converted from the 4.0 mesh release in Blender 4.5. <a href="https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html" target="_blank" rel="noreferrer">Source</a> · <a href="https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html" target="_blank" rel="noreferrer">Database license</a>.';
const pancreasCredit = 'Kristen Browne and Heidi Schlehlein, Human Reference Atlas, Visible Human Male pancreas v1.3 (2024). <a href="https://doi.org/10.48539/HBM396.QWWJ.639" target="_blank" rel="noreferrer">Model and creators</a> · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>.';
const openstax = 'https://openstax.org/books/anatomy-and-physiology-2e/pages/';
const credits = (fig,slug,micro=false) => 'OpenStax Anatomy and Physiology 2e, Fig. '+fig+'. '+(micro?'Micrograph © 2012 Regents of University of Michigan Medical School. ':'')+'<a href="'+openstax+slug+'" target="_blank" rel="noreferrer">Figure and credits ↗</a> · <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/" target="_blank" rel="noreferrer">CC BY-NC-SA 4.0</a>.';
const select = (key,label,values) => '<label>'+label+'<select data-'+key+'>'+Object.entries(values).map(([id,v])=>'<option value="'+id+'">'+v+'</option>').join('')+'</select></label>';
const figure = (file,alt,credit) => '<figure class="gland-plate"><a href="'+file+'" target="_blank" rel="noreferrer" aria-label="Enlarge illustration"><img src="'+file+'" alt="'+alt+'"></a><figcaption>'+credit+'</figcaption></figure>';
const two = (a,b) => '<div class="gland-grid"><div>'+a+'</div><div>'+b+'</div></div>';
const style = '<style>.gland-lab{padding:clamp(.8rem,2.4vw,1.4rem);border:1px solid #48625b;border-radius:14px;background:#172b29;min-width:0}.gland-lab label{display:block;margin:.6rem 0}.gland-lab label>select{display:block;max-width:100%;width:100%;min-height:44px}.gland-lab button{min-height:42px}.gland-grid{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,1fr);gap:1rem;align-items:start}.gland-plate{margin:.65rem 0}.gland-plate img{width:100%;max-height:38dvh;object-fit:contain;background:white;border-radius:.4rem}.gland-plate figcaption,.gland-lab small{font-size:.77rem;color:#c4d5d0}.gland-flow{display:flex;flex-wrap:wrap;gap:6px}.gland-flow span{background:#263e38;border-bottom:2px solid #73bfac;padding:.5rem;border-radius:4px}.gland-flow .blocked{border-color:#ebad84}.gland-layer{padding:.6rem;border:1px solid #637a72}.gland-lab [role=status]{margin:.5rem 0}.gland-lab svg{width:100%;height:auto;max-height:24dvh}@media(max-width:680px){.gland-grid{grid-template-columns:1fr}}</style>';
const tissue = {
  whole:{title:'Skeleton and glands',note:'Trace from the pituitary in the skull to the thymus in the superior chest and the endocrine organs in the upper abdomen. Tap a colored gland or choose its region above.',view:[.25,.05,1]},
  pituitary:{title:'Pituitary in the sphenoid',keys:['pituitary','sphenoid'],note:'Look down into the sella turcica. The highlighted pituitary sits within the sphenoid bone, below the hypothalamus.',view:[.2,1,.38]},
  brain:{title:'Hypothalamus, pineal and pituitary',note:'Compare the pineal body behind the third ventricle with the pituitary below the hypothalamus. The two small superior colliculi sit below the pineal body.',view:[1,.28,-.3]},
  thymus:{title:'Thymus behind the sternum',keys:['thymus','manubrium','trachea','right_clavicle','left_clavicle'],note:'The paired thymic lobes lie behind the manubrium. This lateral-oblique view exposes their depth.',view:[1,.08,-.35]},
  adrenals:{title:'Adrenals above the kidneys',keys:['right_kidney','left_kidney','right_adrenal','left_adrenal','l1','t12'],note:'Follow each kidney to its superomedial pole. The two adrenal glands differ in shape. Open the section study below to distinguish cortex and medulla.',view:[.1,.28,1]},
  pancreas:{title:'Pancreas across the upper abdomen',keys:['pancreas','right_kidney','left_kidney','l1','t12'],note:'The pancreas crosses in front of the upper lumbar region. The head is on the subject’s right and the tail points toward the subject’s left.',view:[0,.32,1]},
  neck:{title:'Thyroid and parathyroids in the neck',note:'Rotate the neck specimen to compare the isthmus with the posterior surfaces.'},
  ovary:{title:'Ovaries in the female pelvis',note:'Locate the ovaries relative to the uterine tubes.'},
  testis:{title:'Testes and pelvic organs',note:'Trace each epididymis toward the pelvis.'},
  map:{title:'All major endocrine sites',note:'Trace the hypothalamus, pituitary, pineal, thyroid, parathyroids, thymus, adrenals, pancreatic islets and gonads. The textbook places ovaries and testes together for comparison.'}
};
const glandColor = name => {
  if(name.includes('adrenal')) return '#eea065';
  return ({pituitary:'#e997c5',pineal:'#f5b55d',hypothalamus:'#9d989e',third_ventricle:'#8ec7db',thymus:'#e4a69a',pancreas:'#ecbf69',right_kidney:'#8e6e83',left_kidney:'#8e6e83',trachea:'#83a7a1'})[name] || '#bfc4bf';
};
const pancreasParts = {head:'Head near the duodenum',uncinate:'Uncinate process',neck:'Neck',body:'Body',tail:'Tail toward the spleen'};
const regions = Object.fromEntries(Object.entries(tissue).map(([id,t])=>[id,t.title]));
const glandStations = {
  '17.1':'Locate the endocrine organs','17.2':'Predict the target-cell response','17.3':'Trace the two pituitary routes',
  '17.4':'Orient the thyroid','17.5':'Locate the parathyroids','17.6':'From adrenal surface to cortex and medulla',
  '17.7':'Locate the pineal gland and trace the night signal','17.8':'Compare gonadal hormone sources','17.9':'From pancreas to islet',
  '17.10':'Trace a hormone between organs','17.11':'Compare gland origins and life-stage changes'
};
const identifications = [
  ['adrenals','A paired gland caps each kidney. Which region should you isolate?','At the superomedial poles of the kidneys, the adrenal cortex and medulla supply different hormones.'],
  ['pituitary','A gland occupies a depression in the sphenoid. Which region should you isolate?','The pituitary occupies the hypophyseal fossa of the sella turcica.'],
  ['thymus','A bilobed organ sits behind the upper sternum. Which region should you isolate?','The thymus lies in the anterior superior chest and supports T-cell development.'],
  ['pancreas','Which organ extends from the curve of the duodenum toward the spleen?','The pancreatic head lies next to the duodenum and the tail approaches the spleen.']
];
const signalRoutes={
  camp:{label:'Glucagon at a hepatocyte',steps:['Glucagon binds a surface receptor','Gs activates adenylyl cyclase','cAMP rises and activates protein kinase A','Hepatic glycogen breakdown increases'],block:'cyclase'},
  ip3:{label:'Oxytocin at uterine smooth muscle',steps:['Oxytocin binds a surface receptor','Gq activates phospholipase C','IP₃ opens calcium channels on the ER','Cytosolic calcium rises and contraction increases'],block:'ip3r'},
  nuclear:{label:'Cortisol at a responsive target',steps:['Cortisol crosses the membrane','An intracellular glucocorticoid receptor binds cortisol','The complex regulates transcription','Expression of responsive proteins changes'],block:'transcription'},
  insulin:{label:'Insulin at a skeletal muscle fiber',steps:['Insulin binds its surface receptor','The receptor signals through its tyrosine kinase','A signaling cascade moves GLUT4 to the surface','Glucose uptake increases'],block:'kinase'}
};
const blocks={none:'Usual signaling',cyclase:'Block adenylyl cyclase',ip3r:'Block the ER IP₃ receptor',transcription:'Block new mRNA synthesis',kinase:'Block insulin receptor kinase activity'};
export function signalOutcome(route,block){
  const signal=signalRoutes[route];
  const stopped=block===signal.block;
  const step={camp:1,ip3:2,nuclear:2,insulin:1}[route];
  return {stopped,step,chain:signal.steps,note:stopped?'Ligand binding can still occur. The selected interruption reduces the downstream response.':'This immediate teaching pathway can operate under the selected condition.'};
}
const pituitary={
  anterior:['Anterior pituitary','A hypothalamic releasing hormone enters a primary capillary plexus.','Portal veins deliver it to a second plexus in the anterior lobe.','Anterior pituitary endocrine cells synthesize and secrete the tropic hormone into systemic blood.'],
  posterior:['Posterior pituitary','Hypothalamic neurons synthesize ADH or oxytocin.','Hormones move down axons through the infundibulum and accumulate in nerve endings.','Action potentials trigger secretion from axon terminals into systemic capillaries.']
};
const adrenal={
  glomerulosa:['Zona glomerulosa','Outermost cortex','Aldosterone','Angiotensin II and elevated plasma potassium stimulate secretion. The kidneys increase sodium reabsorption and potassium secretion.'],
  fasciculata:['Zona fasciculata','Middle cortex','Cortisol','ACTH stimulates cortisol synthesis. Cortisol supports fuel availability during stress and feeds back on hypothalamus and pituitary.'],
  reticularis:['Zona reticularis','Innermost cortex','Adrenal androgens','ACTH supports adrenal androgen production. These steroid hormones contribute to pubic and axillary hair development.'],
  medulla:['Medulla','Central core','Epinephrine and norepinephrine','Sympathetic preganglionic axons stimulate chromaffin cells directly. Catecholamines enter the bloodstream.']
};
const islet={
  beta:['Beta cell','Rising blood glucose','Insulin enters islet capillaries. Muscle and adipose tissue increase glucose uptake, and the liver favors storage.'],
  alpha:['Alpha cell','Falling blood glucose','Glucagon enters islet capillaries and promotes hepatic glucose output.'],
  delta:['Delta cell','Local regulation','Somatostatin reduces the release of insulin and glucagon from neighbors.'],
  acinus:['Exocrine acinus','Meal-related digestive stimulation','Acinar cells release digestive enzymes into ducts leading to the duodenum.']
};
function stationBody(id){
 if(id==='17.10'||id==='17.11')return endocrineCaseMarkup(id);
 if(id==='17.1')return select('region','Choose an anatomical view',regions)+'<p data-location></p><div data-organ></div><small data-attribution></small><h4>Find it from a landmark</h4><p data-locator-prompt></p>'+select('locator-guess','Gland region',{'':'Choose a region',pituitary:'Pituitary',thymus:'Thymus',adrenals:'Adrenals',pancreas:'Pancreas'})+'<button data-identify>Check location</button> <button data-next-location>Next location</button><p data-result role="status"></p>';
 if(id==='17.2')return two(select('signal','Hormone and target',Object.fromEntries(Object.entries(signalRoutes).map(([k,v])=>[k,v.label])))+select('block','Interruption',blocks),select('prediction','Predict the downstream response',{'':'Choose a prediction',continues:'Response can proceed',stops:'Response is reduced'})+'<button data-reveal>Trace the signal</button>')+'<div data-result role="status"></div>';
 if(id==='17.3')return select('lobe','Route to inspect',{anterior:'Hypothalamus → anterior lobe',posterior:'Hypothalamus → posterior lobe'})+select('pit-lesion','Change the connection',{none:'Usual connection',vessel:'Interrupt portal blood delivery',axon:'Interrupt neurosecretory axons'})+'<button type="button" data-pit-next>Next stop</button> <button type="button" data-pit-run>Play route</button><p data-pit-step aria-live="polite"></p>'+tissueMarkup('pituitary')+'<div data-pit-route></div>';
 if(id==='17.4'||id==='17.5'){
   const ask=id==='17.4' ? select('neck-guess','Which structure crosses the trachea between the two thyroid lobes?',{'':'Choose a structure',isthmus:'Thyroid isthmus',cricoid:'Cricoid cartilage',parathyroid:'Inferior parathyroid gland'}) : select('neck-guess','After ionized calcium falls, what response would you expect?',{'':'Predict the response',loss:'PTH falls and less calcium is retained by the kidney',retain:'PTH rises and the kidney retains more calcium',phosphate:'PTH rises and the kidney retains more phosphate'});
   return select('neck-view','Orientation or scale',{anterior:'Anterior neck · 3D',posterior:'Posterior neck · 3D',micro:id==='17.5'?'Microscopic · parathyroid and thyroid comparison':'Microscopic · thyroid follicle'})+'<div data-neck-plate></div><div data-neck-gross-check>'+ask+'<button data-neck-check>Check prediction</button><p data-result role="status"></p></div>';
 }
 if(id==='17.6')return tissueMarkup('adrenal')+'<div data-result role="status"></div><details><summary>Locate both adrenals above the kidneys</summary><div data-organ></div><small>'+bodyCredit+'</small></details><details><summary>Compare with the textbook section and micrograph</summary>'+figure('assets/ap2-figures/17.17.webp','A gland section and micrograph distinguish three cortical layers and the medulla.',credits('17.17','17-6-the-adrenal-glands',true))+'</details>';
 if(id==='17.7')return tissueMarkup('pineal')+select('light','During the biological night',{dark:'Dark surroundings',bright:'Bright light reaches the retina'})+select('melatonin','Predict relative pineal melatonin secretion',{'':'Choose a prediction',rise:'Nighttime rise is supported',fall:'Nighttime rise is suppressed'})+'<button data-pineal-check>Trace the pathway</button><div data-result role="status"></div>';
 if(id==='17.8')return select('gonad','Regional specimen',{ovary:'Ovaries, uterus and uterine tubes',testis:'Testes, ducts and pelvic organs',placenta:'Full-term placenta and umbilical cord'})+'<div data-gonad-specimen></div><div data-gonad-controls></div><div data-gonad-guess></div><button data-check-gonad>Check the response</button><p data-gonad-response role="status"></p>';
 return select('scale','Scale',{gross:'Gross anatomy · organ regions',micro:'Microscopic anatomy · islet and acinus'})+'<div data-scale-view></div>';
}
export function renderGlandPractical(id){return glandStations[id]?style+'<section class="gland-lab" data-gland-station="'+id+'"><h3>'+glandStations[id]+'</h3>'+stationBody(id)+'</section>':'';}
async function showModel(host,config) {
 const version=String(Number(host.dataset.version||0)+1);
 host.dataset.version=version;
 const {mountOrganViewer}=await import('./ap2-organ-viewer.js');
 if(host.isConnected&&host.dataset.version===version)mountOrganViewer(host,{...config,onLoad:api=>{
   api.model.traverse(obj=>{if(obj.isMesh)for(const mat of [].concat(obj.material)){
     if(config.asset.endsWith('pancreas-v1.3.glb'))continue;
     mat.metalness=0;mat.roughness=.76;
     if(obj.name==='context_skeleton'){mat.transparent=true;mat.opacity=.19;mat.depthWrite=false;}
   }});
   config.onLoad?.(api);
 }});
}
function wholeModel(host,region,onPick){
 const config=tissue[region];
 const onLoad=onPick ? async api=>{
   const {Raycaster,Vector2}=await import('three');
   if(!host.isConnected)return;
   const canvas=api.renderer.domElement,ray=new Raycaster();
   let down;
   const start=e=>{down=[e.clientX,e.clientY];};
   const pick=e=>{
     if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>5)return;
     const b=canvas.getBoundingClientRect();
     ray.setFromCamera(new Vector2(((e.clientX-b.left)/b.width)*2-1,1-((e.clientY-b.top)/b.height)*2),api.camera);
     const meshes=[];api.model.traverseVisible(obj=>{if(obj.isMesh&&obj.name!=='context_skeleton')meshes.push(obj);});
     const name=ray.intersectObjects(meshes,false)[0]?.object.name;
     const part=name?.includes('adrenal')?'adrenals':name;
     if(['pancreas','adrenals','thymus','pituitary'].includes(part))onPick(part);
   };
   canvas.addEventListener('pointerdown',start);canvas.addEventListener('pointerup',pick);
   api.addCleanup(()=>{canvas.removeEventListener('pointerdown',start);canvas.removeEventListener('pointerup',pick);});
 } : undefined;
 const file=region==='whole'?'body-overview.glb':region==='brain'?'cranial-glands.glb':'bodyparts-locator.glb';
 return showModel(host,{asset:root+file,title:config.title,direction:config.view,include:name=>!config.keys||config.keys.includes(name),colors:glandColor,onLoad});
}
// Coordinates follow the two original cell-scale models, with Y superior in glTF.
const secretionPaths={
  alpha:[[-1,.08,.05],[-1,-.14,.29],[.9,-.04,.29]],
  beta:[[-.63,.44,.06],[-.59,-.11,.29],[.9,-.04,.29]],
  delta:[[-.18,.06,0],[-.33,.23,.03],[-.45,.34,.05]],
  acinus:[[1.30,.65,-.29],[1.52,.65,-.29],[1.52,.65,-.86],[1.52,1.16,-.86],[1.82,1.16,-.86]],
  follicle:[[-1.46,.30,-.05],[-1.12,.28,0],[-.94,.22,0],[-.79,.21,0]],
  colloid:[[-.14,.04,.0],[-.04,.04,0],[.07,.04,0]],
  release:[[-.72,.24,0],[-1.0,.29,0],[-1.2,.26,0],[-1.46,.24,-.05]],
  cCell:[[1.20,.17,-.03],[1.34,.2,-.03],[1.40,.20,-.03]]
};
const movementLabels={
  alpha:'Glucagon travels from an alpha cell into islet blood.',
  beta:'Insulin travels from a beta cell into islet blood.',
  delta:'Somatostatin acts locally on nearby endocrine cells.',
  acinus:'Digestive secretion enters the acinar lumen and travels into a duct.',
  follicle:'Follow iodide from the blood across a follicle cell toward the lumen.',
  colloid:'Stored iodinated thyroglobulin occupies extracellular colloid.',
  release:'Follow thyroid hormone from colloid through a follicle cell toward blood.',
  cCell:'Calcitonin exits a parafollicular cell toward nearby tissue fluid and capillaries.'
};
function microRole(name){
  if(name.startsWith('follicle_cell'))return 'follicle';
  if(name.startsWith('parafollicular'))return 'cCell';
  if(name.startsWith('colloid'))return 'colloid';
  if(name.startsWith('acinar'))return 'acinus';
  if(name.startsWith('duct'))return 'duct';
  return name.split('_')[0];
}
function microMarkup(){
  return '<div data-micro-model></div><button type="button" data-secretion disabled>Play pathway</button> <span data-path-label role="status"></span><small style="display:block">Osteon cell-scale teaching cutaway. Cell proportions, colors and spacing are illustrative.</small>';
}
function mountMicro(panel,isThyroid,selected){
  const host=panel.querySelector('[data-micro-model]'),button=panel.querySelector('[data-secretion]'),label=panel.querySelector('[data-path-label]');
  let api,marker,frame=0,currentKey;
  const colors={follicle:'#ab8a9c',cCell:'#83bcb1',colloid:'#de9bab',cell:'#695674',capillary:'#b35e64',duct:'#89a89d',acinus:'#ab88a5',alpha:'#af8e98',beta:'#a991ae',delta:'#859da5'};
  const color=name=>{const part=microRole(name);const selectedPart=part===selected()||selected()==='release'&&part==='follicle';
    if(part==='follicle'){const [, ,row,col]=name.split('_');const shade=(Number(row)+Number(col))%3;return (selectedPart?['#d79d55','#f2c36b','#dea55a']:['#9c788c','#b18a9c','#aa7f93'])[shade];}
    return selectedPart?'#ffcc6f':colors[part]||'#a49490';};
  function stop(){
    cancelAnimationFrame(frame);frame=0;
    if(marker){marker.visible=false;api.invalidate();}
    button.textContent='Play pathway';
  }
  function update(){
    currentKey=selected();stop();label.textContent=movementLabels[currentKey];
    if(!api)return;
    api.model.traverse(obj=>{if(obj.isMesh)obj.material.color.set(color(obj.name));});api.invalidate();
  }
  showModel(host,{asset:root+(isThyroid?'follicle-cutaway.glb':'islet-cutaway.glb'),title:isThyroid?'Open thyroid follicle':'Pancreatic islet and surrounding acini',direction:isThyroid?[.45,.25,1]:[.07,.4,1],colors:color,
    onLoad:async viewer=>{
      const THREE=await import('three');if(!host.isConnected)return;
      api=viewer;
      marker=new THREE.Mesh(new THREE.SphereGeometry(.065,12,8),new THREE.MeshBasicMaterial({color:0xfff7d7,depthTest:false}));
      marker.renderOrder=4;marker.visible=false;api.scene.add(marker);api.addCleanup(()=>cancelAnimationFrame(frame));button.disabled=false;update();
    }
  });
  button.onclick=()=>{
    if(!api)return;if(frame){stop();return;}
    const points=secretionPaths[currentKey],begin=performance.now(),reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    marker.visible=true;
    if(reduced){
      const next=(Number(button.dataset.stage||0)+1)%points.length;button.dataset.stage=String(next);marker.position.set(...points[next]);api.invalidate();button.textContent='Step pathway · '+(next+1)+' / '+points.length;return;
    }
    button.textContent='Stop pathway';
    function animate(now){
      const t=Math.min((now-begin)/3500,1)*(points.length-1);
      const i=Math.min(Math.floor(t),points.length-2),fraction=t-i;
      const a=points[i],b=points[i+1];marker.position.set(...a.map((v,j)=>v+(b[j]-v)*fraction));api.invalidate();
      if(t<points.length-1&&host.isConnected)frame=requestAnimationFrame(animate);
      else {frame=0;button.textContent='Replay pathway';}
    }frame=requestAnimationFrame(animate);
  };
  update();return update;
}
function routeTrack(steps,failedFrom=Infinity){
 return '<div class="gland-flow">'+steps.map((s,i)=>'<span class="'+(i>=failedFrom?'blocked':'')+'">'+(i+1)+'. '+s+(i>=failedFrom?' · impaired':'')+'</span>').join('')+'</div>';
}
export function mountGlandPractical(rootElement,id){
 if(!glandStations[id])return;
 const selector='[data-gland-station="'+id+'"]';
 const panel=rootElement?.matches?.(selector)?rootElement:rootElement?.querySelector(selector);
 if(!panel||panel.dataset.mounted)return;
 panel.dataset.mounted='true';
 const get=k=>panel.querySelector('[data-'+k+']');
 if(id==='17.10'||id==='17.11'){mountEndocrineCase(panel,id);return;}
 if(id==='17.1'){
   let caseIndex=0;
   function locate(){
     const selected=get('region').value;
     get('location').textContent=tissue[selected].note;
     // Replace the host so a previous WebGL scene can release its resources.
     get('organ').replaceChildren();
     if(selected==='map'){
       get('organ').innerHTML=figure('assets/ap2-figures/17.2.webp','Body and regional insets showing the major endocrine glands and gonads.',credits('17.2','17-1-an-overview-of-the-endocrine-system'));
       get('attribution').innerHTML='';
     }else if(['neck','ovary','testis'].includes(selected)){
       const host=document.createElement('div');get('organ').append(host);regionSpecimen(host,selected,showModel);
       get('attribution').textContent='';
     }else{
       const host=document.createElement('div');get('organ').append(host);wholeModel(host,selected,part=>{if(part!==get('region').value){get('region').value=part;locate();}});
       get('attribution').innerHTML=bodyCredit;
     }
   }
   function ask(){get('locator-prompt').textContent=identifications[caseIndex][1];get('locator-guess').value='';get('result').textContent='';}
   get('region').onchange=locate;
   get('identify').onclick=()=>{const [key,,note]=identifications[caseIndex];const guess=get('locator-guess').value;if(!guess){get('result').textContent='Choose a region first.';return;}get('result').textContent=(guess===key?'Correct. ':'Inspect this region. ')+note;get('region').value=key;locate();};
   get('next-location').onclick=()=>{caseIndex=(caseIndex+1)%identifications.length;ask();};locate();ask();
 }else if(id==='17.2'){
   const clear=()=>{get('prediction').value='';get('result').innerHTML='';};
   get('signal').onchange=get('block').onchange=clear;
   get('reveal').onclick=()=>{const response=get('prediction').value;if(!response){get('result').textContent='Choose your predicted response before tracing it.';return;}const answer=signalOutcome(get('signal').value,get('block').value);get('result').innerHTML='<p>'+((response==='stops')===answer.stopped?'Correct. ':'Compare the interruption with the receptor’s pathway. ')+answer.note+'</p>'+routeTrack(answer.chain,answer.stopped?answer.step:Infinity);};
 }else if(id==='17.3'){
   let step=0,timer;
   const paths={anterior:['hypothalamus','primary','portal','secondary','anterior'],posterior:['hypothalamus','axons','terminals','blood']};
   const model=mountTissueModel(get('tissue-station'),'pituitary',{onPick(value){
     stop();const path=paths[get('lobe').value],match=path.indexOf(value);
     if(match>=0)step=match;
     get('pit-step').textContent='Inspecting the specimen. Use Next stop to continue the route.';
   }});
   function stop(){clearTimeout(timer);timer=null;get('pit-run').textContent='Play route';}
   function pathState(){
     const route=get('lobe').value,lesion=get('pit-lesion').value,path=paths[route];
     const blocked=route==='anterior'&&lesion==='vessel'?2:route==='posterior'&&lesion==='axon'?1:-1;
     return {path,blocked,last:blocked>=0?blocked:path.length-1};
   }
   function paintStep(){
     const {path,blocked,last}=pathState();
     model.select(path[step]);
     const label=get('tissue-pick').selectedOptions[0].textContent;
     get('pit-step').textContent='Stop '+(step+1)+' of '+path.length+' · '+label+(step===blocked?' · Route interrupted here.':'');
     get('pit-next').textContent=step>=last?'Restart route':'Next stop';
   }
   get('pit-next').onclick=()=>{stop();const {last}=pathState();step=step>=last?0:step+1;paintStep();};
   get('pit-run').onclick=()=>{
     if(timer){stop();return;}
     const {last}=pathState();if(step>=last)step=0;paintStep();get('pit-run').textContent='Pause route';
     function advance(){if(!panel.isConnected||!panel.getClientRects().length){stop();return;}step++;paintStep();if(step>=last)stop();else timer=setTimeout(advance,1250);}
     timer=setTimeout(advance,1250);
   };
   function trace(){
     const key=get('lobe').value,isAnterior=key==='anterior',lesion=get('pit-lesion').value;
     const impaired=isAnterior?lesion==='vessel':lesion==='axon';
     const plate=figure('assets/ap2-figures/'+(isAnterior?'17.9':'17.8')+'.webp',isAnterior?'A sagittal pituitary diagram shows releasing factors traveling through portal vessels to anterior endocrine cells.':'A sagittal pituitary diagram shows neurosecretory axons extending from the hypothalamus into the posterior lobe.',credits(isAnterior?'17.9':'17.8','17-3-the-pituitary-gland-and-hypothalamus'));
     const note=impaired?(isAnterior?'Portal delivery of hypothalamic factors is impaired. TRH-driven TSH release falls. Prolactin is a special case because dopamine normally inhibits its secretion.':'Axonal interruption reduces delivery and regulated release of hypothalamic ADH and oxytocin.'):'This route retains its direct connection in the selected condition.';
     get('pit-route').innerHTML=routeTrack(pituitary[key].slice(1),impaired?1:Infinity)+'<p role="status">'+note+'</p><a class="course-link" href="#ap2-body/pituitary">Locate the pituitary on the body specimen</a><details><summary>Compare with the textbook diagram</summary>'+plate+'</details>';
     stop();step=0;paintStep();
   }
   get('lobe').onchange=get('pit-lesion').onchange=trace;trace();
 }else if(id==='17.4'||id==='17.5'){
   function show(){
     const compare=id==='17.5'&&get('neck-view').value==='micro';
     get('neck-gross-check').hidden=compare;
     if(compare){neckHistology(get('neck-plate'));return;}
     if(get('neck-view').value==='micro'){
       const micro=figure(root+'thyroid-follicles.webp','Follicle cells enclose a colloid-filled lumen. A leader identifies parafollicular cells near the follicles.',credits('17.12c, tissue panel','17-4-the-thyroid-gland',true));
       const steps={follicle:['Follicle cell','Follicle cells take up iodide from blood and secrete thyroglobulin toward the follicle lumen.'],colloid:['Colloid','Iodination and coupling on thyroglobulin form thyroid hormone precursors in the lumen. Iodinated thyroglobulin provides extracellular storage.'],release:['Return to blood','TSH stimulates uptake of colloid. Proteolysis frees T3 and T4 for release toward the capillaries.'],cCell:['Parafollicular cell','These cells secrete calcitonin and do not make T3 or T4. They lie adjacent to the follicles.']};
       get('neck-plate').innerHTML=two(microMarkup(),select('follicle-step','Explore a compartment',Object.fromEntries(Object.entries(steps).map(([k,v])=>[k,v[0]])))+'<p data-follicle-note role="status"></p>');
       const updateMicro=mountMicro(panel,true,()=>get('follicle-step').value);get('neck-plate').insertAdjacentHTML('beforeend','<details><summary>Compare with the micrograph</summary>'+micro+'</details>');
       function explain(){updateMicro();get('follicle-note').textContent=steps[get('follicle-step').value][1];}
       get('follicle-step').onchange=explain;explain();return;
     }
     const back=get('neck-view').value==='posterior';
     const plate=back?figure(root+'posterior-thyroid.webp','Posterior thyroid lobes with small superior and inferior parathyroids.',credits('17.15','17-5-the-parathyroid-glands',true)):figure(root+'anterior-thyroid.webp','Anterior thyroid lobes connected by the isthmus over the trachea.',credits('17.12a','17-4-the-thyroid-gland'));
     get('neck-plate').innerHTML='<div data-neck-region></div><details><summary>Compare with the textbook plate</summary>'+plate+'</details>';
     regionSpecimen(get('neck-region'),'neck',showModel,back?[.28,.08,-1]:[.08,.08,1]);
   }
   get('neck-view').onchange=show;
   get('neck-check').onclick=()=>{
     const guess=get('neck-guess').value;
     if(!guess){get('result').textContent='Choose a prediction first.';return;}
     if(id==='17.4'){
       get('result').textContent=(guess==='isthmus'?'Correct. ':'Find the isthmus. ')+'The isthmus joins the thyroid lobes anterior to the upper trachea.';
     }else{
       get('result').textContent=(guess==='retain'?'Correct. ':'Follow the kidney response. ')+'Falling ionized calcium stimulates chief cells to release PTH. Kidneys retain calcium, excrete more phosphate, and make more calcitriol. Calcitriol increases intestinal calcium absorption. As calcium recovers, PTH secretion falls.';
     }
   };
   if(id==='17.5')get('neck-view').value='posterior';show();
 }else if(id==='17.6'){
   wholeModel(get('organ'),'adrenals');
   get('tissue-pick').setAttribute('data-zone','');
   mountTissueModel(get('tissue-station'),'adrenal',{onPick(value){const zone=adrenal[value];get('result').innerHTML=zone?'<p><b>'+zone[1]+' · '+zone[2]+'</b></p><p>'+zone[3]+'</p>':'';}});
 }else if(id==='17.7'){
   mountTissueModel(get('tissue-station'),'pineal',{initial:'pineal'});
   get('light').onchange=()=>{get('melatonin').value='';get('result').textContent='';};
   get('pineal-check').onclick=()=>{const dark=get('light').value==='dark',guess=get('melatonin').value;
     if(!guess){get('result').textContent='Predict the change in melatonin first.';return;}
     const note=dark?'During the biological night, darkness permits sympathetic input that promotes pineal melatonin synthesis.':'Bright light at night can suppress melatonin through retinal input to the suprachiasmatic nucleus and its downstream sympathetic pathway.';
     get('result').innerHTML='<p>'+((guess==='rise')===dark?'Correct. ':'Recheck the night signal. ')+note+'</p>'+routeTrack(['Retinal light input','Suprachiasmatic nucleus of hypothalamus','Sympathetic pathway via superior cervical ganglion','Pineal melatonin secretion']);};
 }else if(id==='17.8'){
   const outcomes={
     ovary:{fsh:['Support granulosa cell estradiol production','FSH supports follicular growth and aromatase activity in granulosa cells.'],lh:['Stimulate theca steroidogenesis and trigger ovulation with a surge','LH stimulates androgen synthesis by theca cells. The midcycle LH surge triggers ovulation and luteinization.']},
     testis:{fsh:['Support spermatogenesis through Sertoli cells','FSH acts on Sertoli cells in seminiferous tubules. Sertoli cells also release inhibin, which feeds back on FSH.'],lh:['Stimulate testosterone production in Leydig cells','LH stimulates Leydig cells in the interstitial tissue between seminiferous tubules.']}
   };
   function loadGonad(){
     const organ=get('gonad').value;
     get('gonad-specimen').innerHTML='<div data-gross></div>';
     regionSpecimen(get('gross'),organ,showModel);
     if(organ==='ovary'){
       get('gonad-specimen').insertAdjacentHTML('beforeend','<details><summary>Isolated left ovary</summary><div data-organ></div></details>');
       showModel(get('organ'),{asset:root+'ovary-v1.3.glb',title:'Left ovary',colors:()=>'#eab8b9'});
     }
     if(organ==='testis')get('gonad-specimen').insertAdjacentHTML('beforeend','<details><summary>Textbook section through the testis</summary>'+figure(root+'testis-section.webp','A sagittal section shows seminiferous tubules and the epididymis.',credits('27.4','27-1-anatomy-and-physiology-of-the-testicular-reproductive-system'))+'</details>');
     get('gonad-controls').innerHTML=organ==='placenta'?'':select('gonad-signal','Signal to trace',{fsh:'FSH',lh:'LH'});
     if(organ!=='placenta')get('gonad-signal').onchange=guess;
     guess();
   }
   function guess(){
     const data=outcomes[get('gonad').value];
     get('gonad-guess').innerHTML=data ? select('expected-effect','Which action follows?',{'':'Choose an action',lh:data.lh[0],fsh:data.fsh[0]}) : select('expected-effect','Which signal maintains the corpus luteum early in pregnancy?',{'':'Choose a signal',insulin:'Insulin',hcg:'Human chorionic gonadotropin',fsh:'Follicle-stimulating hormone'});
     get('gonad-response').textContent='';
   }
   get('check-gonad').onclick=()=>{
     const organ=get('gonad').value, chosen=get('expected-effect').value;
     if(!chosen){get('gonad-response').textContent='Choose a response first.';return;}
     const target=organ==='placenta'?'hcg':get('gonad-signal').value;
     get('gonad-response').textContent=(target===chosen?'Correct. ':'Recheck the hormone target. ')+(organ==='placenta'?'Early trophoblast hCG sustains the ovarian corpus luteum. Placental progesterone production takes over as pregnancy progresses.':outcomes[organ][target][1]);
   };
   get('gonad').onchange=loadGonad;loadGonad();
 }else{
   function changeScale(){
     const gross=get('scale').value==='gross';
     if(gross){
       get('scale-view').innerHTML=select('part','Highlight a pancreatic region',pancreasParts)+'<div data-organ></div><small>'+pancreasCredit+'</small><p>These regions describe the surface of the whole organ. Islets are microscopic clusters scattered through its tissue.</p>';
       let viewer;
       const color=n=>n.includes('_'+get('part').value+'_')?'#ffd081':'#b58a86';
       function part(){if(viewer){viewer.model.traverse(obj=>{if(obj.isMesh)obj.material.color.set(color(obj.name));});viewer.invalidate();}}
       get('part').onchange=part;
       showModel(get('organ'),{asset:root+'pancreas-v1.3.glb',title:'Human pancreas',direction:[0,.15,1],colors:color,onLoad:v=>{viewer=v;part();}});
     }else{
       get('scale-view').innerHTML=two(microMarkup(),select('cell','Examine a cell population',Object.fromEntries(Object.entries(islet).map(([k,v])=>[k,v[0]])))+'<p data-cell-result role="status"></p><p>Islet cells release hormones into nearby capillaries. A routine stain can reveal an islet as a cluster. Definitive alpha, beta and delta cell identification typically uses hormone-specific labeling.</p>');
       get('scale-view').insertAdjacentHTML('beforeend','<details><summary>Compare with the micrograph</summary>'+figure(root+'islet.webp','A pancreatic islet and its neighboring acini are identified in the tissue.',credits('17.18','17-9-the-endocrine-pancreas',true))+'</details>');
       const updateMicro=mountMicro(panel,false,()=>get('cell').value);
       function cell(){updateMicro();const [,trigger,result]=islet[get('cell').value];get('cell-result').textContent=trigger+'. '+result;}
       get('cell').onchange=cell;cell();
     }
   }
   get('scale').onchange=changeScale;changeScale();
 }
}
