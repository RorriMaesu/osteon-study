import {bodyStructures} from './ap2-body-systems.js';
import figures from './ap2-figures.json' with {type:'json'};
import {sectionById} from './ap2-library.js';

const station=(title,kind,section,preset,terms)=>({
  title,kind,terms,section,route:'ap2-lesson-'+section+'/activity'+(preset?'/'+preset:'')
});
const specimens=[
  station('Ventricular system and deep brain','Separate 3D specimen','13.3','ventricles','CSF cerebrospinal fluid lateral third fourth ventricle cerebral aqueduct thalamus caudate putamen pallidus midbrain pons medulla precentral gyrus'),
  station('Left eye and accommodation','Separate 3D specimen','14.1','eye','lens retina choroid sclera iris cornea fovea macula optic disc pupil ciliary muscle zonules'),
  station('Left middle ear','Separate 3D specimen','14.1','ossicles','ossicles malleus incus stapes hearing vibration eardrum'),
  station('Inner-ear labyrinth','Separate 3D specimen','14.1','ear','semicircular ducts ampulla utricle saccule vestibule cochlea scala vestibuli tympani'),
  station('Pancreas in five regions','Separate 3D specimen','17.9','pancreas','head neck body tail uncinate process gross pancreas'),
  station('Left ovary','Separate 3D specimen','17.8','ovary','gonad ovarian surface'),
  station('Thyroid follicle','Microscopic 3D model','17.4','follicle','thyroid gland colloid follicular epithelium follicular cells capillaries thyroid hormone'),
  station('Pancreatic islet','Microscopic 3D model','17.9','islet','pancreas alpha beta delta endocrine cells exocrine acini islets of Langerhans'),
  station('Blood smear','Micrograph','18.4','','blood erythrocyte platelet neutrophil eosinophil basophil monocyte lymphocyte'),
  station('Heart and coronary vessels','Separate 3D specimen','19.1','','atrium atria ventricle septum papillary muscles mitral tricuspid aortic pulmonary valve coronary sinus coronary arteries dissection'),
  station('Aortic arch','Separate 3D specimen','20.5','arch','ascending aorta left common carotid artery subclavian brachiocephalic'),
  station('Renal circulation','Separate 3D specimen','20.5','kidneys','kidney renal artery renal vein inferior vena cava'),
  station('Hepatic portal system','Separate 3D specimen','20.5','portal','splenic superior mesenteric portal hepatic vein liver'),
  station('Right leg and foot','Separate 3D specimen','20.5','leg','external iliac femoral popliteal anterior tibial posterior tibial dorsalis pedis arteries')
];
const figureKind=f=>/micrograph|photomicrograph/i.test(f.alt+' '+f.credit)?'Textbook figure with microscopy':'Textbook figure';
export function structureIndex(){
  return [
    ...Object.entries(bodyStructures).map(([id,[layer,title,terms]])=>({title,kind:'On the body',terms,section:({central:'17.3',glands:'17.1',heart:'19.1',arteries:'20.5'})[layer],route:'ap2-body/'+id})),
    ...specimens,
    ...figures.map(f=>({title:f.title,kind:figureKind(f),terms:f.alt,section:f.section,route:'ap2-lesson-'+f.section+'/figures/'+f.figure}))
  ];
}
export function openStructureIndex({root,page,hero,link,e}){
  const entries=structureIndex();
  const kinds=[...new Set(entries.map(v=>v.kind))];
  page(hero('A&P II · MODEL & SLIDE LAB','Find a structure','Search a name, then choose the view and scale you want to study.')+
    '<section class="course-card"><div class="ap2-index-controls"><label>Structure or term<input type="search" data-index-search placeholder="Try thyroid, retina or femoral" autocomplete="off"></label><label>Type of view<select data-index-kind><option value="">All views</option>'+
    kinds.map(k=>'<option>'+e(k)+'</option>').join('')+'</select></label></div><p data-index-count role="status"></p><div class="ap2-index-list" data-index-links></div></section>'+link('ap2-practicals','← Model & slide lab'));
  const field=root.querySelector('[data-index-search]'),kind=root.querySelector('[data-index-kind]');
  function filter(){
    const words=field.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
    const list=entries.filter(row=>(!kind.value||row.kind===kind.value)&&words.every(word=>(row.title+' '+row.terms+' '+row.kind+' '+row.section+' '+(sectionById.get(row.section)?.title||'')).toLowerCase().includes(word)));
    root.querySelector('[data-index-count]').textContent=list.length?list.length+' matching views':'No matching views. Try a broader term or change the view type.';
    root.querySelector('[data-index-links]').innerHTML=list.map(row=>'<a class="course-link" href="#'+e(row.route)+'"><strong>'+e(row.title)+'</strong><small>'+e(row.kind)+' · §'+e(row.section)+'</small></a>').join('');
  }
  field.oninput=filter;kind.onchange=filter;filter();
}

