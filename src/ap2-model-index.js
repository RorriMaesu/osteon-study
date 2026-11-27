import {bodyStructures} from './ap2-body-systems.js';
import figures from './ap2-figures.json' with {type:'json'};
import {sectionById} from './ap2-library.js';

const station=(title,kind,section,preset,terms)=>({
  title,kind,terms,section,route:'ap2-lesson-'+section+'/activity'+(preset?'/'+preset:'')
});
const specimens=[
  station('Artery and vein in section','Micrograph','20.1','tissue','blood vessel histology arterial and venous wall tunica media lumen continuous fenestrated sinusoidal capillary'),
  station('Placenta and fetal shunts','Separate 3D specimen','20.6','shunts','placental circulation umbilical ductus venosus foramen ovale ductus arteriosus birth transition'),
  station('From stapes to auditory nerve','Physiology activity','14.1','hearing','stereocilia cochlear fluid hearing hair cells basilar membrane organ of Corti pitch vibration oval window'),
  station('Myelinated axon and nodes','Microscopic 3D model','12.4','axon','node of Ranvier axolemma demyelination conduction action potential sheath'),
  station('Spinal cord, roots and ganglion','3D teaching model','13.2','cord','transverse section dorsal ventral gray horns white columns commissure central canal root ganglion spinal nerve'),
  station('Autonomic routes to the heart','3D teaching model','15.1','cardiac-autonomic','medulla vagus sympathetic trunk parasympathetic ganglion preganglionic postganglionic SA node'),
  station('Light response of a rod','Physiology activity','14.1','rod','eye retina phototransduction dark current glutamate hyperpolarization'),
  station('Pupillary light reflex','Physiology activity','16.3','pupil','eye optic oculomotor CN II III pupil afferent efferent direct consensual'),
  station('Ventricular system and deep brain','Separate 3D specimen','13.3','ventricles','CSF cerebrospinal fluid lateral third fourth ventricle cerebral aqueduct thalamus caudate putamen pallidus midbrain pons medulla precentral gyrus'),
  station('Left eye and accommodation','Separate 3D specimen','14.1','eye','lens retina choroid sclera iris cornea fovea macula optic disc pupil ciliary muscle zonules'),
  station('Left middle ear','Separate 3D specimen','14.1','ossicles','ossicles malleus incus stapes hearing vibration eardrum'),
  station('Inner-ear labyrinth','Separate 3D specimen','14.1','ear','semicircular ducts ampulla utricle saccule vestibule cochlea scala vestibuli tympani'),
  station('Pancreas in five regions','Separate 3D specimen','17.9','pancreas','head neck body tail uncinate process gross pancreas'),
  station('Thyroid and larynx in the neck','Separate 3D specimen','17.4','neck','gross thyroid isthmus trachea cricoid laryngeal cartilage hyoid anterior neck'),
  station('Parathyroids behind the thyroid','Separate 3D specimen','17.5','parathyroids','posterior thyroid left right superior inferior parathyroid gland PTH calcium'),
  station('Ovaries, uterus and uterine tubes','Separate 3D specimen','17.8','ovary','gonad ovarian surface ovary left right tubes fimbriae pelvis'),
  station('Testes, epididymides and ducts','Separate 3D specimen','17.8','testis','testicle testicular gonad ductus deferens male pelvis'),
  station('Placenta and umbilical cord','Separate 3D specimen','17.8','placenta','chorionic basal plate umbilical vein arteries fetal'),
  station('Thyroid follicle','Microscopic 3D model','17.4','follicle','thyroid gland colloid follicular epithelium follicular cells capillaries thyroid hormone'),
  station('Pancreatic islet','Microscopic 3D model','17.9','islet','pancreas alpha beta delta endocrine cells exocrine acini islets of Langerhans'),
  station('Blood smear','Micrograph','18.4','','blood erythrocyte platelet neutrophil eosinophil basophil monocyte lymphocyte'),
  station('Heart and coronary vessels','Separate 3D specimen','19.1','','atrium atria ventricle septum papillary muscles mitral tricuspid aortic pulmonary valve coronary sinus coronary arteries dissection'),
  station('Aortic arch','Separate 3D specimen','20.5','arch','ascending aorta left common carotid artery subclavian brachiocephalic'),
  station('Pulmonary arteries and veins','Separate 3D specimen','20.5','pulmonary','right left superior inferior pulmonary veins trunk lung left atrium'),
  station('Systemic venous return','Separate 3D specimen','20.5','caval','brachiocephalic veins vena cava iliac veins'),
  station('Arm and hand circulation','Separate 3D specimen','20.5','upper','axillary brachial radial ulnar artery vein shoulder forearm hand palmar arches basilic cephalic median cubital'),
  station('Foot to right atrium','Separate 3D specimen','20.5','legReturn','deep superficial venous return great small saphenous femoral popliteal iliac veins vena cava'),
  station('Arterial supply of the gut','Separate 3D specimen','20.5','gut','celiac trunk superior inferior mesenteric hepatic splenic artery'),
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
export function openStructureIndex({root,page,hero,link,e,state}){
  const entries=structureIndex();
  const kinds=[...new Set(entries.map(v=>v.kind))];
  page(hero('A&P II · MODEL & SLIDE LAB','Find a structure','Search a name, then choose the view and scale you want to study.')+
    '<section class="course-card"><div class="ap2-index-controls"><label>Structure or term<input type="search" data-index-search placeholder="Try thyroid, retina or femoral" autocomplete="off"></label><label>Type of view<select data-index-kind><option value="">All views</option>'+
    kinds.map(k=>'<option>'+e(k)+'</option>').join('')+'</select></label></div><p data-index-count role="status"></p><div class="ap2-index-list" data-index-links></div></section>'+link('ap2-practicals','← Model & slide lab'));
  const field=root.querySelector('[data-index-search]'),kind=root.querySelector('[data-index-kind]');
  field.value=state.query;kind.value=state.kind;
  function filter(){
    const words=field.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
    state.query=field.value;state.kind=kind.value;
    const list=entries.filter(row=>(!kind.value||row.kind===kind.value)&&words.every(word=>(row.title+' '+row.terms+' '+row.kind+' '+row.section+' '+(sectionById.get(row.section)?.title||'')).toLowerCase().includes(word)));
    const titleMatches=row=>words.filter(word=>row.title.toLowerCase().includes(word)).length;
    if(words.length)list.sort((a,b)=>titleMatches(b)-titleMatches(a));
    root.querySelector('[data-index-count]').textContent=list.length?list.length+' matching views':'No matching views. Try a broader term or change the view type.';
    root.querySelector('[data-index-links]').innerHTML=list.map(row=>'<a class="course-link" href="#'+e(row.route)+'"><strong>'+e(row.title)+'</strong><small>'+e(row.kind)+' · §'+e(row.section)+'</small></a>').join('');
  }
  field.oninput=filter;kind.onchange=filter;filter();
}

