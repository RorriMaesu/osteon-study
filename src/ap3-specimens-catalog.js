import meshInventory from './ap3-specimens-meshes.json' with {type:'json'};
import nodeInventory from './lymph-node-models.json' with {type:'json'};
import {fetalSegments} from './ap2-fetal-paths.js';

const atlas='Regional anatomy atlas',hra='Reference specimen',schema='3D teaching reconstruction';
const catalog=[];
const named={
  ...fetalSegments,
  cortical_sinuses:'Cortical (trabecular) sinuses',afferent_vessels:'Afferent lymphatic vessels',efferent_vessel:'Efferent lymphatic vessel',
  cortical_glomerular_capsule:'Cortical nephron · glomerular capsule', cortical_glomerular_tuft:'Cortical nephron · glomerular capillary tuft',
  juxtamedullary_glomerular_capsule:'Juxtamedullary nephron · glomerular capsule', juxtamedullary_glomerular_tuft:'Juxtamedullary nephron · glomerular capillary tuft',
  sustentacular_cells:'Sertoli (sustentacular) cells',sustentacular_nuclei:'Basal nuclei of Sertoli cells',
  sertoli_tight_junction:'Tight junction between Sertoli cells',interstitial_cells:'Leydig (interstitial) cells',
  VH_F_cornua:'Uterine horns',VH_F_isthmus_of_fallopian_tube_L:'Isthmus of uterine tube (left)',VH_F_isthmus_of_fallopian_tube_R:'Isthmus of uterine tube (right)',
  fenestrae:'Endothelial fenestrae (pore rims)',filtration_slits:'Filtration slits between foot processes',two_cell_stage:'Two-cell stage',
  VH_F_fundus_of_urinary_bladder_dome:'Urinary bladder dome (superior surface)',
  VH_F_fundus_of_urinary_bladder_base:'Urinary bladder base (fundus)',
  VH_F_abdominal_ostium_of_uterine_tube:'Uterotubal junctions (uterine ends of tubes)',
  lungBranch:'Pulmonary artery to the left lung',
  septal_flap:'Valve flap of the foramen ovale',
  Yao_afferent_lymphatic_vessel:'Afferent lymphatic vessel',Yao_efferent_lymph_node:'Efferent lymphatic vessel',
  Yao_blood_vasculature:'Blood vessels',Yao_capsule_of_lymph_node:'Capsule',Yao_follicles:'Lymphoid follicles',
  Yao_medulla_of_lymph_node:'Medulla',Yao_paracortex:'Paracortex',VH_M_kidney_capsule_L:'Fibrous capsule',
  VH_M_hilum_of_kidney_L:'Renal hilum',VH_M_outer_cortex_of_kidney_L:'Renal cortex',
  VH_M_renal_column_L:'Renal columns',VH_M_renal_pelvis_L:'Renal pelvis',VH_M_ureter_L:'Proximal left ureter',
  cortical_loop:'Cortical nephron loop',juxtamedullary_loop:'Juxtamedullary nephron loop',
  inner_membrane:'Inner mitochondrial membrane and cristae',matrix:'Mitochondrial matrix',
  thoracic_duct_territory:'Thoracic duct drainage territory',right_upper_quadrant:'Right upper drainage territory',
  lumen:'Lumen',milk_in_lumina:'Milk within alveolar lumina',VH_F_amnion:'Amnion',
  VH_F_placenta_vessels:'Placental vessels',VH_F_basal_plate:'Basal plate (maternal face)',
  VH_F_chorionic_plate:'Chorionic plate (fetal face)',capillaries:'Glomerular capillaries',
  capillary_network:'Capillary network',basement_membrane:'Basement membrane',
  juxtamedullary_corpuscle:'Juxtamedullary renal corpuscle',cortical_corpuscle:'Cortical renal corpuscle',
  shared_collecting_duct:'Shared collecting duct',lung_tissue:'Lung parenchyma',lacteal:'Central lacteal',
  superior_lobe_of_right_lung:'Right superior lobe',middle_lobe_of_right_lung:'Right middle lobe',
  inferior_lobe_of_right_lung:'Right inferior lobe',superior_lobe_of_left_lung:'Left superior lobe',
  inferior_lobe_of_left_lung:'Left inferior lobe',bile_duct:'Common bile duct',cystic_duct:'Cystic duct (teaching segment)',theca:'Thecal layers',
  region_Orbital_frontal_gyri:'Orbital surface of frontal lobes',trophoblast:'Blastocyst trophoblast',
  stage_12:'Stage 12 · 3.9 mm',stage_16:'Stage 16 · 10.5 mm',stage_20:'Stage 20 · 20 mm',stage_23:'Stage 23 · 31 mm'
};
export function label(name){
  if(named[name])return named[name];
  const text=name.replace(/^(?:VH_[MF]_|region_)/,'').replace(/_([LR])$/,(_,v)=>v==='L'?' (left)':' (right)')
    .replace(/_(left|right)$/,' ($1)').replace(/([a-z])([A-Z])/g,'$1 $2').replaceAll('_',' ').replace('fibria','fimbriae');
  return text.charAt(0).toUpperCase()+text.slice(1);
}
const nodeRecords=new Map(nodeInventory.structures.map(row=>[row.key,row]));
function add(chapter,id,title,kind,description,opts={}){
  const asset=opts.asset||'assets/ap3-models/'+id+'.glb';
  const targets=[];
  for(const raw of meshInventory[asset]){
    if(raw==='flow_arrows')continue;
    if(raw.startsWith('Node | ')){
      const record=nodeRecords.get(raw.slice(7));
      if(!record||record.status==='withheld')continue;
      targets.push({id:raw,label:record.name+(record.side?' ('+(record.side==='l'?'left':'right')+')':''),meshes:[raw],
        detail:record.status==='landmark-checked'?'Position checked against a nearby landmark.':'Source-aligned position. Individual landmark review is pending.'});continue;
    }
    const group=opts.groups?.find(([,re])=>re.test(raw));
    const key=group?.[0]||raw;
    const existing=targets.find(t=>t.id===key);
    if(existing)existing.meshes.push(raw);
    else targets.push({id:key,label:group?.[2]||opts.names?.[key]||label(key),meshes:[raw]});
  }
  for(const assembly of opts.assemblies||[])targets.push({...assembly,assembly:true});
  catalog.push({chapter,id,title,kind,description,asset,targets,...opts});
}
const route=(name,steps)=>({name,steps:steps.split(' ')});
const corpuscles=['cortical','juxtamedullary'].map(kind=>({
  id:kind+'_corpuscle',label:named[kind+'_corpuscle']+' (whole)',meshes:[kind+'_glomerular_capsule',kind+'_glomerular_tuft']
}));
const tubeRoutes=['L','R'].map(side=>route((side==='L'?'Left':'Right')+' uterine tube',
  ['fibria_of_uterine_tube','uterine_tube_infundibulum','ampulla_of_uterine_tube','isthmus_of_fallopian_tube']
    .map(part=>'VH_F_'+part+'_'+side).concat('VH_F_abdominal_ostium_of_uterine_tube').join(' ')));
add(21,'lymph-drainage','From tissue fluid to the venous angles',schema,'Anterior view. The patient’s right is on your left. Compare the right upper quadrant with the rest of the body. The drawn territory boundaries and flow arrows illustrate typical drainage. Individual lymphatic connections vary.',{routes:[
  route('From the right hand','right_upper_quadrant right_lymphatic_duct right_venous_angle'),
  route('From the left foot','thoracic_duct_territory cisterna_chyli thoracic_duct left_venous_angle')]});
add(21,'node','Lymph node interior',hra,'The Human Reference Atlas used cleared mouse-node microscopy to model this reference anatomy. Examine multiple entrances on the convex surface and the outlet at the hilum. Peel back the capsule to compare follicles, paracortex and medulla.',{cut:/capsule_of_lymph_node|paracortex/,routes:[route('Entry and exit','Yao_afferent_lymphatic_vessel Yao_medulla_of_lymph_node Yao_efferent_lymph_node')]});
add(21,'node-sinuses','Flow through a lymph node',schema,'This opened node simplifies the sinus network. Follow lymph beneath the capsule, through cortical (trabecular) and medullary sinuses, and out at the hilum.',{routes:[route('Lymph through sinuses','afferent_vessels subcapsular_sinus cortical_sinuses medullary_sinuses efferent_vessel')]});
add(21,'immune-organs','Tonsils, thymus and spleen',atlas,'Compare the tonsils near the pharynx, the thymic lobes behind the sternum and the spleen in the left upper abdomen. The subclavian and internal jugular veins mark the two venous angles.');
add(21,'red-marrow','Red marrow and blood-cell formation',schema,'An enlarged marrow pocket shows developing erythrocytes near a macrophage and a large megakaryocyte beside a sinusoid.',{asset:'assets/ap2-glands/marrow-section.glb'});
for(const [region,title] of Object.entries({overview:'Whole-body node groups',head:'Head and face nodes',neck:'Cervical nodes',thorax:'Thoracic nodes',abdomen:'Abdominal nodes',pelvis:'Pelvic nodes','upper-limb':'Upper limb nodes','lower-limb':'Lower limb nodes'})){
  add(21,'nodes-'+region,title,atlas,'Each surface is a representative group in the regional atlas. Select a group for its location-review status. The full atlas records 31 landmark checks, 110 source-aligned groups and 17 withheld records.',{asset:'assets/lymph-nodes-'+region+'.glb'});
}
add(22,'lung-lobes','Lung lobes, bronchi and diaphragm',atlas,'Find the horizontal and oblique fissures at the lobe boundaries. Rotate behind the lungs to compare main bronchi. The moving surfaces illustrate quiet breathing and retain their donor shape at end-expiration.',{breathing:true});
add(22,'nasal-passage','Nasal cavity and conchae',atlas,'Rotate the nasal preparation to see how the conchae project into the air passage. The superior region carries olfactory fibers. The inferior nasal conchae are individually represented as a pair. The middle and superior conchae are parts of the ethmoid surface in this specimen.',{asset:'assets/ap2-neuro/nose.glb'});
add(22,'pleura','Pleural surfaces and fluid film',schema,'An opened slice through the thoracic wall shows the parietal layer outside the fluid film and the visceral layer against the lung. The space is enlarged for inspection.',{routes:[route('From chest wall to lung','chest_wall parietal_pleura pleural_fluid visceral_pleura lung_tissue')]});
add(22,'alveolar-exchange','Alveolar sac and pulmonary capillaries',schema,'The open air spaces share delicate septa. Follow conducting air into the exchange region, then follow blood from an arteriole through the capillary network to a venule.',{routes:[
  route('Air into an alveolus','respiratory_bronchiole alveolar_duct alveolar_air_spaces'),route('Blood past alveolar air','pulmonary_arteriole capillary_network pulmonary_venule')]});
add(23,'alimentary-tract','Esophagus to rectum',atlas,'Trace the canal to the descending colon, then open the distal-colon specimen for the sigmoid segment. The two specimens use different source surfaces.',{
  routes:[route('Canal landmarks to descending colon','esophagus stomach duodenum jejunum ileum ileocecal_junction ascending_colon transverse_colon descending_colon')],
  handoffs:{descending_colon:['ap3-specimen-distal-colon/target/sigmoid_colon','Continue to the sigmoid colon →']}
});
add(23,'distal-colon','Descending and sigmoid colon',atlas,'Follow the sigmoid curve into the pelvis anterior to the sacrum. Continue from sigmoid to rectum in the whole-canal specimen.',{
  routes:[route('Distal colon','descending_colon sigmoid_colon')],
  handoffs:{sigmoid_colon:['ap3-specimen-alimentary-tract/target/rectum','Continue to the rectum →']}
});
add(23,'accessory-ducts','Bile, pancreatic juice and portal blood',atlas,'Trace stored bile from the gallbladder through the cystic duct and common bile duct to the duodenum. The donor represents these ducts as one continuous outlet. Their division is approximate because the common hepatic duct branch is absent. Pancreatic juice follows the pancreatic duct.',{routes:[route('Bile delivery','gallbladder cystic_duct bile_duct duodenum'),route('Pancreatic secretion','pancreas pancreatic_duct duodenum')]});
add(23,'enteric-wall','Layers of the intestinal wall',schema,'Work outward from mucosa through submucosa and muscular layers to serosa. The myenteric plexus lies between the circular and longitudinal layers.',{asset:'assets/ap2-neuro/enteric-wall.glb',names:{mucosa:'Mucosa and villi',medulla:'Medulla oblongata (brainstem inset)',intrinsic_sensory:'Intrinsic sensory neuron',enteric_motor:'Enteric motor neuron',circular_muscle:'Inner circular muscle',longitudinal_muscle:'Outer longitudinal muscle',vagal_afferent:'Vagal sensory fiber',vagal_efferent:'Vagal preganglionic motor fiber'},
  routes:[route('Layers from lumen outward','mucosa submucosa circular_muscle myenteric_plexus longitudinal_muscle serosa'),route('Short enteric reflex','intrinsic_sensory enteric_interneuron enteric_motor circular_muscle')]});
add(23,'villus','A villus and its two absorption routes',schema,'Open villus, enlarged. The lacteal is a blind-ended lymphatic beside a network of capillaries. Compare the first vessel entered by glucose with the first vessel entered by a chylomicron.',{routes:[route('Glucose to portal blood','lumen surface_epithelium capillary_network portal_venule'),route('Chylomicron to lymph','lumen surface_epithelium lacteal')]});
add(24,'fuel-organs','Organs of fuel regulation',atlas,'Locate the gut, hepatic portal vein, pancreas, liver and skeletal muscle. Follow absorbed fuel to the liver, then use the chapter’s feeding and fasting activity to predict its fate.',{routes:[route('From gut to liver','duodenum hepatic_portal_vein liver')]});
add(24,'metabolic-cell','Cytosol and mitochondrial compartments',schema,'Glycolysis occurs in the cytosol and the citric acid cycle in the matrix. The respiratory chain pumps protons from the matrix into the intermembrane space. The electrochemical gradient spans the inner membrane. Return through ATP synthase drives ATP production.');
add(24,'adipose','Adipose tissue beneath the skin',schema,'Locate energy-storing adipocytes below the dermis. During a fast, adipocytes release fatty acids and glycerol into the circulation.',{asset:'assets/ap2-glands/skin-fat-section.glb'});
add(25,'urinary-tract','Kidneys, ureters and bladder',atlas,'Trace urine from either renal pelvis to the bladder and urethra. In this male atlas the urethra continues into the penis.',{routes:[route('Left urinary outflow','kidney_left renal_pelvis_left ureter_left urinary_bladder urethra'),route('Right urinary outflow','kidney_right renal_pelvis_right ureter_right urinary_bladder urethra')]});
add(25,'kidney','Left kidney with the collecting system',hra,'Coronal teaching cut through the Visible Human Male left kidney. The matching ureter specimen supplies the minor calyces, major calyces and pelvis. Rotate to inspect papilla–calyx relationships. The exit segment shows the proximal ureter.',{cut:/capsule|outer_cortex|renal_column|hilum/,groups:[
  ['pyramids',/renal_pyramid/,'Medullary pyramids'],['papillae',/renal_papilla/,'Renal papillae'],['minor_calyces',/minor_calyx/,'Minor calyces'],['major_calyces',/major_calyx/,'Major calyces']],
  routes:[route('Papilla to ureter','papillae minor_calyces major_calyces VH_M_renal_pelvis_L VH_M_ureter_L')]});
add(25,'nephron-pair','Cortical and juxtamedullary nephrons',schema,'Compare the short loop with the deeper loop beside the vasa recta. Both distal tubules drain to one collecting duct. Background bands mark cortex and medullary depth. During antidiuresis, interstitial osmolality increases toward the deep medulla. Blood stays in the glomerular capillary tuft. Filtrate enters the space inside its capsule.',{assemblies:corpuscles,layers:[[/_glomerular_capsule$/,.33]],routes:[
  route('Short-loop filtrate','cortical_glomerular_capsule cortical_proximal_tubule cortical_loop cortical_distal_tubule shared_collecting_duct'),
  route('Long-loop filtrate','juxtamedullary_glomerular_capsule juxtamedullary_proximal_tubule juxtamedullary_loop juxtamedullary_distal_tubule shared_collecting_duct'),
  route('Cortical blood supply','afferent_arteriole cortical_glomerular_tuft efferent_arteriole peritubular_capillaries')]});
add(25,'glomerulus','Glomerular blood vessels and podocytes','Reference microanatomy model','Inspect the afferent arteriole, glomerular capillary tuft and efferent arteriole. Podocyte processes cover the capillaries. This Human Reference Atlas functional tissue unit is enlarged and displayed separately.',{groups:[['podocytes',/^podocyte_/,'Podocytes']],routes:[route('Blood through the tuft','afferent_arteriole capillaries efferent_arteriole')]});
add(25,'filtration-barrier','From plasma to capsular space',schema,'This open, enlarged barrier contains a fenestrated endothelial layer, glomerular basement membrane and podocyte processes with filtration slits. The rings outline endothelial pores. Narrow colored strips mark the open slits between adjacent foot processes. Follow water and small solutes into the capsular space.',{direction:[.48,.55,1],routes:[route('Filtration layers','fenestrae basement_membrane filtration_slits capsular_space')]});
add(26,'fluid-spaces','Plasma, interstitial and intracellular fluid',schema,'Find the vessel wall that separates plasma from interstitial fluid and the cell membrane separating intracellular fluid. The fluid sample is enlarged. Open the section to see red cells inside the capillary and fluid inside each tissue cell.',{cut:/^(capillary_wall|cell_membrane|plasma|interstitial_fluid)$/,layers:[[/^interstitial_fluid$/,.095],[/^plasma$/,.22],[/^capillary_wall$/,.34],[/^cell_membrane$/,.40]],routes:[route('Trace water from plasma into a tissue cell','plasma capillary_wall interstitial_fluid cell_membrane intracellular_fluid')]});
add(26,'blood-compartment','Formed elements within plasma',schema,'Select the pale gold plasma surrounding the formed elements. Open the section to inspect white-cell nuclei and granules. The cells are arranged for comparison and their numbers do not represent a blood count.',{cut:/^plasma$|_cytoplasm$/,layers:[[/^plasma$/,.095],[/_cytoplasm$/,.28]],routes:[route('Compare plasma and a white cell','plasma neutrophil_cytoplasm neutrophil_nucleus')]});
add(26,'respiratory-buffer','Lung exchange during acid–base regulation',schema,'Blood delivers carbon dioxide to the exchange surface. A change in alveolar ventilation alters arterial carbon dioxide and the bicarbonate buffer equilibrium.',{asset:'assets/ap3-models/alveolar-exchange.glb'});
add(26,'renal-buffer','Renal tubules during acid–base regulation',schema,'Locate the proximal tubule where most filtered bicarbonate is reclaimed. Collecting-duct intercalated cells participate in acid secretion and bicarbonate handling.',{asset:'assets/ap3-models/nephron-pair.glb',assemblies:corpuscles,layers:[[/_glomerular_capsule$/,.33]]});
add(27,'sperm-route','Testicular ducts and the shared urethra','Regional atlas with illustrative terminal segments','Follow one side from testis through the epididymis and ductus deferens. The two terminal continuations behind the bladder are illustrative. They bridge a 32 mm gap in the source. The source ejaculatory ducts pass through the prostate to the urethra.',{routes:[route('Left sperm transport','testis_left epididymis_left ductus_deferens_left illustrative_terminal_ductus_left ejaculatory_duct_left urethra'),route('Right sperm transport','testis_right epididymis_right ductus_deferens_right illustrative_terminal_ductus_right ejaculatory_duct_right urethra')]});
add(27,'ovarian-pelvis','Ovaries, tubes, uterus and cervix',hra,'The Visible Human Female organs share their published pelvic coordinates. Trace a uterine tube from fimbriae to isthmus, then identify the fundus and cervix.',{asset:'assets/ap2-glands/ovarian-region.glb',direction:[.08,.5,1],routes:tubeRoutes,groups:[['pelvic_bones',/bone|sacrum|coccyx/,'Pelvic bones']]});
add(27,'pelvic-section','Female pelvic outlets and external anatomy',schema,'Sagittal teaching view, anterior to the left. Compare vagina and cervix with the bladder and urethra anteriorly and rectum posteriorly. External structures are enlarged.',{routes:[route('Reproductive outlet','uterine_body cervix vagina'),route('Urinary outlet','bladder urethra')]});
add(27,'ovarian-follicle','Antral follicle and oocyte',schema,'Inspect the oocyte within its zona pellucida and corona radiata. The granulosa layer lines the fluid-filled antrum. The theca lies farther outside.');
add(27,'seminiferous-tubule','Spermatogenesis across a tubule',schema,'Trace germ cells inward from the basement membrane to the lumen. A representative pair of Sertoli cells supports the germ cells. Tight junctions between Sertoli cells help separate the basal and adluminal compartments. Testosterone-producing Leydig cells lie outside the tubule.',{layers:[[/^sustentacular_cells$/,.42]],routes:[route('Germ cells from base to lumen','spermatogonia spermatocytes spermatids spermatozoa lumen'),route('Find the blood–testis barrier','basement_membrane sustentacular_nuclei sertoli_tight_junction sustentacular_cells lumen')]});
add(28,'cleavage-implantation','Cleavage, blastocyst and implantation',schema,'Sequence shown at enlarged teaching scales. Find the fluid cavity and inner cell mass in the open blastocyst before examining implantation in the endometrium.',{assemblies:[{id:'whole_blastocyst',label:'Blastocyst (whole)',meshes:['trophoblast','blastocoel','inner_cell_mass']}],routes:[route('Early sequence','zygote two_cell_stage morula whole_blastocyst implanting_blastocyst')]});
add(28,'carnegie-stages','Four Carnegie embryo stages',hra,'Left to right, four segmented embryos share a display scale calibrated to their linked fixed specimens. Stages 12, 16, 20 and 23 correspond to roughly 29, 39, 49 and 56 days after fertilization. Obstetric gestational age adds approximately two weeks. Select and focus to enlarge a stage.',{direction:[.08,.04,1]});
add(28,'placenta','Full-term placenta and umbilical cord',hra,'Rotate the separate full-term reference to compare the fetal chorionic plate with the maternal-facing basal plate. Inspect the two umbilical arteries and one umbilical vein inside the cord.',{asset:'assets/ap2-glands/placenta.glb',direction:[.15,.5,1],groups:[['umbilical_arteries',/umbilical_artery/,'Two umbilical arteries']]});
add(28,'placental-exchange','Maternal and fetal exchange surfaces',schema,'Follow fetal blood through a branching chorionic villus. Maternal blood bathes its outer surface and drains separately. Open the section to see the vessels inside the villus.',{cut:/^(chorionic_villus|intervillous_space)$/,layers:[[/^intervillous_space$/,.11],[/^chorionic_villus$/,.37]],routes:[route('Fetal blood','fetal_arteriole fetal_capillaries fetal_venule'),route('Maternal blood','maternal_spiral_artery intervillous_space maternal_vein')]});
add(28,'birth-orientation','Cephalic presentation and fetal supports',schema,'In this longitudinal teaching section the fetal head presents toward the cervix. Inspect the amniotic sac, placenta, umbilical cord and birth canal. Shapes show orientation rather than clinical measurements.');
add(28,'fetal-shunts','Fetal circulation and shunts',schema,'Trace one of the three fetal bypasses. Play the selected route, then switch to the newborn circulation to see where blood flows after functional closure.',{asset:'assets/ap2-fetal-flow.glb',routes:[
  route('Umbilical vein to right atrium','umbilicalVein ductusVenosus lowerCava right_atrium'),
  route('Across the atrial opening','lowerCava right_atrium foramenOvale left_atrium mitralInflow left_ventricle ascendingAorta'),
  route('Past the fetal lungs','right_ventricle pulmonaryTrunk ductusArteriosus descendingAorta')
]});
add(28,'lactating-unit','Lactating alveoli and ducts',schema,'Secretory epithelial cells produce milk. Surrounding myoepithelial cells contract during oxytocin-mediated ejection and move milk from the lumina into ducts.',{routes:[route('Milk outflow','secretory_alveoli milk_in_lumina lactiferous_duct nipple')]});
export const specimens=catalog;

