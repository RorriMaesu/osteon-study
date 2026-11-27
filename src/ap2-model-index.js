import {bodyStructures} from './ap2-body-systems.js';
import figures from './ap2-figures.json' with {type:'json'};
import {sectionById} from './ap2-library.js';

const station=(title,kind,section,preset,terms)=>({
  title,kind,terms,section,route:'ap2-lesson-'+section+'/activity'+(preset?'/'+preset:'')
});
const specimens=[
  station('Multipolar neuron from dendrites to terminals','Microscopic 3D model','12.2','multipolar-neuron','nervous tissue soma cell body nucleus dendrites axon hillock initial segment myelin nodes of Ranvier synaptic boutons'),
  station('Chemical synapse and neurotransmitter release','Microscopic 3D model','12.5','chemical-synapse','axon terminal synaptic vesicles calcium channels exocytosis synaptic cleft receptors ligand gated postsynaptic membrane'),
  station('Touch, vibration and cutaneous receptors','Microscopic 3D model','14.1','skin-receptors','skin fingertip sensation Meissner Merkel tactile disc Pacinian lamellated corpuscle Ruffini free endings touch pressure pain vibration'),
  station('Circle of Willis and its arterial supply','Separate 3D specimen','13.3','cerebral-arteries','cerebral arterial circle internal carotid basilar vertebral anterior middle posterior cerebral communicating arteries optic chiasm pons'),
  station('Dural venous sinuses and jugular drainage','Separate 3D specimen','13.3','dural-sinuses','superior inferior sagittal straight transverse sigmoid internal jugular veins cerebral venous return'),
  station('Intestinal wall and enteric reflexes','3D teaching model','15.2','enteric-wall','small intestine gut enteric nervous system short long vagovagal reflex CNS medulla motor vagus submucosal myenteric plexus circular longitudinal muscle'),
  station('Brain lobes, cerebellum and brainstem','Separate 3D specimen','13.2','brain','whole brain frontal parietal occipital temporal cortex central nervous system'),
  station('Spinal cord and cauda equina','Separate 3D specimen','13.2','long-cord','central nervous system conus medullaris spinal roots dorsal root ganglia'),
  station('Tongue and its nerves','Separate 3D specimen','14.1','tongue','gustation oral cavity lingual anatomy taste innervation'),
  station('Olfactory region of the nose','Separate 3D specimen','14.1','nose','smell nasal cavity olfaction ethmoid cribriform plate'),
  station('Auricle, eardrum and middle ear','Separate 3D specimen','14.1','outer-ear','external ear pinna tympanic membrane auditory canal ossicles'),
  station('Taste bud','Microscopic 3D model','14.1','taste-bud','gustation gustatory cells receptor cells pore tongue'),
  station('Olfactory epithelium','Microscopic 3D model','14.1','olfactory-epithelium','smell receptor neurons nasal mucosa olfaction cilia'),
  station('Cranial nerves','Separate 3D specimen','16.3','cranial-nerves','cranial nerve pairs neurological exam sensation motor'),
  station('Cerebral lobes for the mental status exam','Separate 3D specimen','16.2','brain','frontal parietal temporal occipital cortex mental status localization language attention'),
  station('Eye anatomy for the cranial nerve exam','Separate 3D specimen','16.3','eye','pupil iris lens eye visual optic ocular response'),
  station('Anterior and posterior pituitary pathways','3D teaching model','17.3','pituitary-pathways','infundibulum hypothalamus lobes axons portal vessels'),
  station('Adrenal cortex and medulla','3D teaching model','17.6','adrenal-layers','capsule glomerulosa fasciculata reticularis gland'),
  station('Pineal and neighboring landmarks','Separate 3D specimen','17.7','pineal','epithalamus third ventricle superior colliculi melatonin'),
  station('Secondary endocrine organs of the abdomen','Separate 3D specimen','17.10','abdomen','liver stomach duodenum pancreas gallbladder spleen portal splenic vein'),
  station('Skin and subcutaneous adipose tissue','Microscopic 3D model','17.10','skin','epidermis dermis capillary cutaneous adipocytes fat lobules leptin vitamin D'),
  station('Formed elements of blood','Microscopic 3D model','18.1','elements','erythrocytes leukocytes platelets blood cell morphology'),
  station('Red marrow and developing blood cells','Microscopic 3D model','18.2','marrow','megakaryocyte platelet erythroblastic island macrophage erythropoiesis sinusoid adipocyte trabeculae'),
  station('Spleen and liver in erythrocyte recycling','Separate 3D specimen','18.3','abdomen','red blood cells heme bilirubin bile portal circulation'),
  station('Artery and vein in section','Micrograph','20.1','tissue','blood vessel histology arterial and venous wall tunica media lumen continuous fenestrated sinusoidal capillary'),
  station('Placenta and fetal shunts','Physiology activity','20.6','shunts','placental circulation umbilical ductus venosus foramen ovale ductus arteriosus birth transition'),
  station('Three fetal shunts and the newborn transition','3D teaching model','20.6','fetal-flow','placenta umbilical vein arteries lungs ductus venosus foramen ovale ductus arteriosus flow'),
  station('Artery and vein wall with valve','3D teaching model','20.1','walls','tunica intima media externa artery vein venous valve'),
  station('Capillary barriers','Microscopic 3D model','20.1','capillaries','continuous fenestrated sinusoidal endothelium basement membrane'),
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
  station('Mitral valve and papillary supports','Separate 3D specimen','19.1','supports','mitral leaflets ventricular papillary muscles chordae tendineae illustrated support apparatus'),
  station('Four valves through one beat','3D teaching model','19.3','motion','mitral tricuspid pulmonary aortic semilunar cusps leaflets pressure opening closing cardiac cycle'),
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
const bodySections={pineal:'17.7',pituitary:'17.3',hypothalamus:'17.3',thymus:'17.10',pancreas:'17.9',right_adrenal:'17.6',left_adrenal:'17.6',left_kidney:'17.10',right_kidney:'17.10'};
const layerSections={heart:'19.1',arteries:'20.5',cns:'13.2',gut:'17.10',skin:'17.10'};
export function structureIndex(){
  return [
    ...Object.entries(bodyStructures).map(([id,[layer,title,terms]])=>({title,kind:'On the body',terms,section:bodySections[id]||layerSections[layer]||'17.1',route:'ap2-body/'+id})),
    ...specimens,
    ...figures.map(f=>({title:f.title,kind:figureKind(f),terms:f.alt,section:f.section,route:'ap2-lesson-'+f.section+'/figures/'+f.figure}))
  ];
}
export function openStructureIndex({root,page,hero,link,e,state}){
  const entries=structureIndex();
  const kinds=[...new Set(entries.map(v=>v.kind))];
  page(hero('A&P II · MODEL & SLIDE LAB','Find a structure','Search a name, then choose the view and scale you want to study.')+
    '<section class="course-card"><div class="ap2-index-controls"><label>Structure or term<input type="search" data-index-search placeholder="Try thyroid, retina or femoral" autocomplete="off"></label><label>Type of view<select data-index-kind><option value="">All views</option>'+
    '<option value="3d">All interactive 3D views</option>'+kinds.map(k=>'<option>'+e(k)+'</option>').join('')+'</select></label><label>Chapter<select data-index-chapter><option value="">All chapters</option>'+Array.from({length:9},(_,i)=>'<option value="'+(12+i)+'">Chapter '+(12+i)+'</option>').join('')+'</select></label></div><p data-index-count role="status"></p><div class="ap2-index-list" data-index-links></div></section><div class="course-actions"><span data-index-chapter-link></span>'+link('ap2-practicals','Model & slide lab')+'</div>');
  const field=root.querySelector('[data-index-search]'),kind=root.querySelector('[data-index-kind]');
  const chapter=root.querySelector('[data-index-chapter]');
  field.value=state.query;kind.value=state.kind;chapter.value=state.chapter||'';
  function filter(){
    const words=field.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
    state.query=field.value;state.kind=kind.value;state.chapter=chapter.value;
    root.querySelector('[data-index-chapter-link]').innerHTML=chapter.value?link('ap2-chapter-'+chapter.value,'← Chapter '+chapter.value):'';
    const list=entries.filter(row=>(!chapter.value||row.section.split('.')[0]===chapter.value)&&(!kind.value||(kind.value==='3d'?row.kind==='On the body'||row.kind.includes('3D'):row.kind===kind.value))&&words.every(word=>(row.title+' '+row.terms+' '+row.kind+' '+row.section+' '+(sectionById.get(row.section)?.title||'')).toLowerCase().includes(word)));
    const titleMatches=row=>words.filter(word=>row.title.toLowerCase().includes(word)).length;
    if(words.length)list.sort((a,b)=>titleMatches(b)-titleMatches(a));
    root.querySelector('[data-index-count]').textContent=list.length?list.length+' matching views':'No matching views. Try a broader term or change the view type.';
    root.querySelector('[data-index-links]').innerHTML=list.map(row=>'<a class="course-link" href="#'+e(row.route)+'"><strong>'+e(row.title)+'</strong><small>'+e(row.kind)+' · §'+e(row.section)+'</small></a>').join('');
  }
  field.oninput=filter;kind.onchange=chapter.onchange=filter;filter();
}

