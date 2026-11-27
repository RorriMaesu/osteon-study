const text = 'https://openstax.org/books/anatomy-and-physiology-2e/pages/';
const sensory = text + '14-1-sensory-perception';
const cns = text + '13-2-the-central-nervous-system';
const csf = text + '13-3-circulation-and-the-central-nervous-system';
const pituitary = text + '17-3-the-pituitary-gland-and-hypothalamus';
const lymph = text + '21-1-anatomy-of-the-lymphatic-and-immune-systems';
const breathing = 'https://www.nhlbi.nih.gov/health/lungs/breathing-benefits';
const heart = text + '19-3-cardiac-cycle';
const vessels = text + '20-1-structure-and-function-of-blood-vessels';
const neuro = 'ap2-neuro/';
const gland = 'ap2-glands/';
const spring = 'ap3-models/';

const named = names => names.split('|').filter(Boolean);
const phase = (label,text,sites,at) => ({label,text,sites:named(sites),at});
const list = [];

function add(id,title,system,asset,context,action,description,source,phases,options={}){
  const {restingSurfaces=[],...settings}=options;
  const targets = [...new Set([...phases.flatMap(p=>p.sites),...restingSurfaces])];
  list.push({id,title,system,asset:'assets/'+asset+'.glb',action,description,source,phases,
    targets,context:named(context).filter(name=>!targets.includes(name)),kind:'Process overlay',duration:8,...settings});
}

const brainContext='region_Left_frontal_lobe|region_Left_temporal_lobe|region_Left_parietal_lobe|region_Cerebellum|region_Pons';
add('brain','Brain · visual relay','Nervous',neuro+'brain',brainContext,'Follow a visual relay',
  'Light-evoked information reaches thalamic relay neurons before visual cortex. The markers identify stations in the pathway. Individual nuclei and fiber tracts are below the resolution of this preparation.',text+'14-2-central-processing',[
    phase('Thalamic relay','Retinal ganglion-cell signals synapse in the lateral geniculate nucleus of the thalamus.','region_Thalamus'),
    phase('Occipital cortex','Optic radiations carry thalamic output to primary visual cortex around the calcarine sulcus. Each hemisphere represents the opposite visual hemifield.','region_Left_occipital_lobe|region_Right_occipital_lobe')
  ],{direction:[-.9,.15,-.7],bodyIds:['brain']});

add('cerebellum','Cerebellum and pons','Nervous',neuro+'brain','region_Medulla_oblongata|region_Midbrain','Follow a movement-plan signal',
  'A copy of a cortical motor plan reaches the cerebellum. Pulses mark the two gross structures containing the relay. The crossed fibers and deep nuclei are microscopic relative to this view.',cns,[
    phase('Pontine relay','Pontine nuclei receive input from the cerebral cortex.','region_Pons'),
    phase('Cerebellar processing','Pontocerebellar fibers cross and enter via a middle cerebellar peduncle. The cerebellum integrates the plan with other sensory inputs.','region_Cerebellum')
  ],{direction:[-.9,.1,-.6],bodyIds:['brain']});
add('brainstem','Brainstem · breathing control','Nervous',neuro+'brain','region_Cerebellum|region_Midbrain','Locate the respiratory network',
  'Both the medulla and pons participate throughout breathing. The sequence spotlights their complementary roles. The individual respiratory neurons are too small to resolve here.',
  'https://www.nhlbi.nih.gov/health/lungs/body-controls-breathing',[
    phase('Medullary rhythm','Networks in the medulla generate respiratory drive that ultimately reaches spinal motor neurons.','region_Medulla_oblongata'),
    phase('Pontine modulation','Pontine circuits help adjust timing and the transition between inspiration and expiration.','region_Pons')
  ],{direction:[.9,.08,-.4],bodyIds:['brain']});
add('ventricles','Brain ventricles','Nervous',neuro+'ventricles','Pons.l|Pons.r|Thalamus.l|Thalamus.r','Follow cerebrospinal fluid',
  'Pulses mark successive fluid spaces in this cast. The interventricular foramina and the fourth-ventricular apertures connect the labeled spaces.',csf,[
    phase('Lateral ventricles','Choroid plexuses produce much of the CSF. Fluid leaves each lateral ventricle by an interventricular foramen.','Lateral ventricle.l|Lateral ventricle.r'),
    phase('Third ventricle','The two inflows reach the midline cavity in the diencephalon.','Third ventricle'),
    phase('Aqueduct','The narrow cerebral aqueduct conveys CSF through the midbrain.','Aqueduct of midbrain'),
    phase('Fourth ventricle','CSF exits via median and lateral apertures to the subarachnoid space.','Fourth ventricle')
  ],{direction:[1,.18,.3],bodyIds:['brain']});
add('spinal-cord','Spinal cord and spinal nerve','Nervous',neuro+'spinal-section','Dorsal white column|Lateral white column|Central canal','Trace a withdrawal reflex',
  'A sensory signal enters dorsally. Interneurons relay it to ventral-horn motor neurons. Markers identify the compartments in a representative spinal level.',text+'14-3-motor-responses',[
    phase('Sensory entry','Sensory fibers enter through the dorsal root. Their cell bodies reside in the dorsal root ganglion.','Dorsal root|Dorsal root ganglion'),
    phase('Spinal integration','Nociceptive afferents activate interneurons in the dorsal gray horn.','Dorsal gray horn'),
    phase('Motor output','Interneurons activate motor neurons in the ventral horn. Their axons leave through the ventral root.','Ventral gray horn|Ventral root')
  ],{bodyIds:['spinal-cord']});
add('cranial-nerves','Cranial nerves','Nervous',neuro+'cranial-nerves','','Trace the pupil light reflex',
  'The visual afferent limb, midbrain relay and parasympathetic efferent limb occupy different structures. Markers identify their gross anatomy.',text+'16-3-the-cranial-nerve-exam',[
    phase('Optic nerve','Retinal ganglion cells carry the response along CN II.','region_Optic_nerve_(II)'),
    phase('Midbrain relay','Pretectal nuclei signal both Edinger–Westphal nuclei, allowing illumination of one eye to affect both pupils.','region_Brainstem'),
    phase('Oculomotor nerve','Preganglionic fibers travel in CN III to the ciliary ganglion. Short ciliary nerves carry the final signal to the iris sphincter.','region_Oculomotor_nerve_(III)')
  ],{bodyIds:['brain','eyes']});
add('peripheral-nerve','Myelinated peripheral nerve fiber','Nervous',neuro+'myelinated-axon','Proximal myelin|Middle myelin|Distal myelin','Follow saltatory conduction',
  'The light marks successive sites of action-potential regeneration. Local current runs through the axon beneath each myelinated internode.',text+'12-4-the-action-potential',[
    phase('First node','Voltage-gated sodium channels open at the exposed membrane.','First node'),
    phase('Internode','Local current spreads along the axon beneath the insulating sheath.','Axon'),
    phase('Second node','When the next node reaches threshold, another action potential is generated.','Second node')
  ],{bodyIds:[]});

add('eye','Eye · lens accommodation','Special senses',neuro+'eye-section','Iris|Cornea','Change focus from far to near',
  'A sagittal human eye section shows how ciliary contraction changes lens shape. The movement is enlarged and slowed for inspection.',sensory,[
    phase('Distance focus','Ciliary muscle is relaxed. Zonular tension keeps the lens relatively flat.','Zonules|Lens',0),
    phase('Near focus','The ciliary ring narrows. Reduced zonular tension lets the lens thicken along the optical axis.','Ciliary muscle|Lens',.25),
    phase('Return to distance','Relaxation increases zonular tension, flattening the lens again.','Ciliary muscle|Zonules|Lens',.64)
  ],{mechanism:'accommodation',kind:'Organ movement',direction:[1,.08,.24],bodyIds:['eyes']});
add('ear','Ear · middle-ear vibration','Special senses',neuro+'ossicles','','Transmit a sound vibration',
  'The malleus and incus rock together while the stapes footplate moves toward and away from the oval window. Excursion is exaggerated and slowed; the oval window is outside this isolated ossicle preparation.',
  'https://www.nidcd.nih.gov/health/how-do-we-hear',[
    phase('Inward excursion','Inward tympanic membrane displacement rocks the malleus and transmits force through the incus to the stapes.','Malleus|Incus|Stapes',0),
    phase('Outward excursion','Pressure reverses. The coupled ossicles reverse direction and the footplate moves outward.','Malleus|Incus|Stapes',.5)
  ],{mechanism:'ossicles',kind:'Organ movement',duration:3,direction:[.55,.28,.85],bodyIds:['ears']});
add('inner-ear','Inner ear · angular acceleration','Special senses',neuro+'labyrinth','Utricle|Saccule|Anterior duct|Posterior duct','Follow a horizontal head turn',
  'The lateral semicircular duct senses horizontal angular acceleration. Highlighted sites show where the endolymph and sensory cupula act. The cupula itself is too small to see.',
  'https://www.nidcd.nih.gov/health/balance-disorders',[
    phase('Head starts turning','The bony labyrinth and duct accelerate with the head. Endolymph inertia produces relative motion.','Lateral duct'),
    phase('Ampullary response','The pressure difference deflects the cupula and bends hair bundles. This changes vestibular nerve activity.','Lateral ampulla'),
    phase('Steady rotation','As endolymph catches up at steady velocity, cupular deflection diminishes.','Lateral ampulla')
  ],{direction:[.7,.45,1],bodyIds:['ears']});
add('nasal-olfaction','Nose · smell','Special senses',neuro+'nose','region_Ethmoid|region_Inferior_nasal_conchae','Follow olfactory input',
  'Odor molecules reach specialized epithelium high in the nasal cavity. The source model groups nasal mucosa into one surface. The signal continues through the olfactory nerve fibers.',sensory,[
    phase('Olfactory mucosa','Odorants dissolve in mucus and engage receptors on olfactory cilia in the superior nasal region.','region_Nasal_mucosa'),
    phase('Olfactory nerve fibers','Receptor axons pass through the cribriform plate and synapse in glomeruli of the olfactory bulb.','region_Olfactory_nerve_fibers')
  ],{direction:[.65,.2,.75],bodyIds:['nose']});
add('tongue-taste','Tongue · taste','Special senses',neuro+'tongue','region_Hyoid','Trace taste from the anterior tongue',
  'Taste buds in the anterior tongue signal through fibers that accompany the lingual nerve and then the chorda tympani. Taste buds are microscopic at this scale.',sensory,[
    phase('Taste receptors','Dissolved chemicals activate taste cells in taste buds of the anterior two-thirds of the tongue.','region_Tongue'),
    phase('Lingual nerve segment','Taste afferents briefly travel with the lingual nerve, which also carries general sensory fibers.','region_Lingual_nerve'),
    phase('Chorda tympani','Taste fibers continue in the chorda tympani branch of the facial nerve.','region_Chorda_tympani')
  ],{bodyIds:['tongue']});
add('skin','Skin · light touch','Integumentary',neuro+'skin-receptors','region_Dermis|region_Subcutaneous_tissue','Trace touch into a sensory fiber',
  'In hairless skin, skin movement can deform a tactile corpuscle in a dermal papilla. A pulse marks the receptor, then its sensory axon.',sensory,[
    phase('Skin contact','A moving, light touch displaces the surface locally.','region_Epidermis'),
    phase('Receptor','Mechanical deformation excites the nerve ending within a Meissner corpuscle.','region_Meissner_corpuscle'),
    phase('Afferent signal','Action potentials travel along the sensory fiber toward the central nervous system.','region_Sensory_nerve_fibers')
  ],{bodyIds:['skin']});

add('hypothalamus','Hypothalamus · hormone transport','Endocrine',gland+'pituitary-pathways','stalk|posterior_lobe','Trace oxytocin to the posterior pituitary',
  'The hypothalamus makes oxytocin. It is carried along axons for storage at their terminals. A later electrical signal triggers release. The animation compresses these distinct time scales.',pituitary,[
    phase('Synthesis','Hypothalamic neuron cell bodies synthesize oxytocin.','hypothalamus'),
    phase('Axonal transport','Secretory granules move down axons through the infundibulum to the neurohypophysis.','neurosecretory_axons'),
    phase('Release to blood','When impulses reach the terminals, exocytosis releases hormone into posterior pituitary capillaries.','axon_terminals|posterior_capillaries')
  ],{bodyIds:['hypothalamus','pituitary']});
add('pituitary','Pituitary gland · portal circulation','Endocrine',gland+'pituitary-pathways','stalk|anterior_lobe|posterior_lobe','Trace a releasing hormone',
  'Small hypothalamic releasing hormones travel in portal blood directly to the anterior pituitary. The colored signal follows the vessel compartments of the cutaway.',pituitary,[
    phase('Primary plexus','Hypothalamic terminals release hormone into the primary capillary bed.','primary_plexus'),
    phase('Portal veins','The portal veins carry the releasing hormone toward the anterior pituitary.','portal_veins'),
    phase('Secondary plexus','Hormone leaves these capillaries to stimulate anterior pituitary cells. Their hormones enter the circulation.','secondary_plexus')
  ],{bodyIds:['pituitary','hypothalamus']});
add('pineal','Pineal gland','Endocrine',gland+'cranial-glands','third_ventricle|right_colliculus|left_colliculus','Compare night and daylight',
  'The particle overlay represents relative melatonin release over a light–dark cycle. Speeds and amounts are illustrative.',
  text+'17-7-the-pineal-gland',[
    phase('Daylight','Light input to the circadian clock normally suppresses daytime melatonin secretion.','pineal'),
    phase('Biological night','Sympathetic input to pinealocytes supports a nocturnal rise in melatonin.','pineal'),
    phase('Morning','Retinal light signaling helps suppress secretion again.','pineal')
  ],{mechanism:'pineal-release',bodyIds:['pineal']});
// Six rows of distinct epithelial-cell surfaces surround the cut face of this specimen.
const follicularWall=[3,8,12,12,8,3].flatMap((count,row)=>Array.from({length:count},(_,col)=>'follicle_cell_'+row+'_'+col));
add('thyroid','Thyroid gland · hormone release','Endocrine',gland+'follicle-cutaway','parafollicular_cell','Follow thyroid hormone out of a follicle',
  'This enlarged open follicle separates stored iodinated thyroglobulin, follicular epithelium and the blood supply. Gold marks the active compartment during each step.',
  text+'17-4-the-thyroid-gland',[
    phase('Colloid storage','Iodinated thyroglobulin stores thyroid hormone precursor in the follicular lumen.','colloid_section'),
    phase('Epithelial uptake','TSH stimulates follicular cells to take up colloid and liberate T3 and T4.','follicle_cell_1_7|follicle_cell_2_11|follicle_cell_3_11'),
    phase('Secretion to blood','T3 and T4 exit from the basal side of follicular cells and enter nearby capillaries.','capillary')
  ],{bodyIds:['thyroid'],restingSurfaces:follicularWall,direction:[-.26,.12,1]});
const parathyroids='left_superior_parathyroid|right_superior_parathyroid|left_inferior_parathyroid|right_inferior_parathyroid';
add('parathyroids','Parathyroid glands','Endocrine',gland+'neck','thyroid','Respond to falling blood calcium',
  'Four glands lie on the posterior thyroid in this atlas. Dots represent relative PTH output; individual chief cells and capillaries are microscopic at this scale.',
  text+'17-5-the-parathyroid-glands',[
    phase('Calcium falls','Chief cells sense a fall in ionized calcium in extracellular fluid.',parathyroids),
    phase('PTH release rises','More PTH enters nearby capillaries. The hormone helps raise circulating calcium.',parathyroids),
    phase('Feedback','As ionized calcium recovers, PTH release declines.',parathyroids)
  ],{mechanism:'feedback-release',direction:[.16,0,-1],bodyIds:['parathyroids']});
add('adrenal','Adrenal glands · stress responses','Endocrine',gland+'adrenal-section','capsule|glomerulosa|reticularis','Compare two responses to stress',
  'The cutaway separates the quick sympathetic response of the medulla from a slower ACTH-driven response of the cortex. These pathways can overlap in time.',
  text+'17-6-the-adrenal-glands',[
    phase('Medullary response','Preganglionic sympathetic input stimulates chromaffin cells to release catecholamines.','medulla'),
    phase('Cortical response','Under ACTH stimulation, the zona fasciculata increases cortisol synthesis and release.','fasciculata')
  ],{bodyIds:['adrenal-glands']});
add('glandular-pancreas','Pancreas · endocrine islet','Endocrine',gland+'islet-cutaway','alpha_cell_0|delta_cell_3|duct','Follow insulin secretion after a meal',
  'This teaching cutaway magnifies islet cells beside a capillary. The dots mark β-cell activity and insulin reaching the blood.',
  text+'17-9-the-endocrine-pancreas',[
    phase('Glucose rises','Pancreatic β cells sense increased circulating glucose.','beta_cell_1|beta_cell_5|beta_cell_7'),
    phase('Insulin release','Depolarization and calcium entry trigger insulin-granule exocytosis.','beta_cell_1|beta_cell_5|beta_cell_7'),
    phase('Endocrine transport','Insulin enters islet capillaries and travels in blood to target tissues.','capillary')
  ],{bodyIds:['pancreas']});

const atria='VH_M_left_cardiac_atrium|VH_M_right_cardiac_atrium';
const vent='VH_M_heart_left_ventricle|VH_M_heart_right_ventricle';
add('coronary-circulation','Coronary arteries, veins and sinus','Cardiovascular','ap2-heart',atria+'|'+vent+'|VH_M_ascending_aorta','Trace the myocardium’s blood supply',
  'Follow the named surface vessels of a human heart. Arteries are red and veins are blue. The phases connect arterial supply to venous return. The microscopic capillary beds are below the resolution of the specimen.',text+'19-1-heart-anatomy',[
    phase('Aortic origin','The right and left coronary arteries arise from aortic sinuses just above the aortic valve.','VH_M_left_coronary_artery|VH_M_right_coronary_artery'),
    phase('Arterial branches','The anterior interventricular artery descends toward the apex. The right marginal artery supplies the right ventricular wall. Smaller vessels deliver blood to cardiac muscle.','VH_M_left_anterior_descending_artery|VH_M_right_marginal_artery'),
    phase('Cardiac veins','Blood leaving the myocardial capillaries returns through cardiac veins, including the great and middle cardiac veins.','VH_M_great_cardiac_vein|VH_M_middle_cardiac_vein'),
    phase('Coronary sinus','The coronary sinus runs across the posterior heart and empties into the right atrium. Rotate the heart to follow its course.','VH_M_coronary_sinus')
  ],{bodyIds:['heart','aorta'],aliases:['cardiac perfusion','myocardial perfusion','coronary circulation','LAD','coronary sinus'],direction:[.28,.26,1],duration:11});
add('heart','Heart','Cardiovascular','ap2-heart','VH_M_pulmonary_trunk|VH_M_ascending_aorta|VH_M_mitral_valve|VH_M_tricuspid_valve|VH_M_aortic_valve|VH_M_pulmonary_valve','Watch a heartbeat',
  'The heart follows a slowed teaching beat. Atrial contraction precedes ventricular ejection. Chamber-wall movement is illustrative; the original donor surfaces show anatomy at one instant.',heart,[
    phase('Passive filling','Blood enters relaxed ventricles through open atrioventricular valves.',vent,0),
    phase('Atrial contraction','Atrial systole completes ventricular filling.',atria,88/800),
    phase('Pressure rises','Both left-heart valves are closed; pressure rises at constant ventricular volume.',vent,195/800),
    phase('Ejection','Ventricular pressure opens the outflow valves and ventricular volume falls.',vent,245/800),
    phase('Relaxation','Outflow valves close. Ventricular pressure falls before filling begins again.',vent,492/800),
    phase('Filling resumes','Atrioventricular valves open as atrial pressure exceeds ventricular pressure.',vent,562/800)
  ],{mechanism:'heart',kind:'Organ movement',duration:5,direction:[.25,.05,1],bodyIds:['heart']});
add('artery','Artery · smooth muscle tone','Cardiovascular','ap2-vessel-walls','','Change arterial caliber',
  'An open teaching segment shows the lumen narrowing as smooth muscle contracts. The excursion is enlarged. Narrowing an arteriole strongly increases resistance.',vessels,[
    phase('Resting caliber','The vessel begins at its reference diameter.','artery_intima|artery_media|artery_externa',0),
    phase('Constrict','Smooth muscle in the tunica media contracts, reducing the inner radius.','artery_media',.2),
    phase('Relax','As smooth muscle relaxes, the lumen widens.','artery_media|artery_intima',.64)
  ],{mechanism:'artery',kind:'Organ movement',bodyIds:['aorta']});
add('aorta','Aorta · systemic outflow','Cardiovascular','ap2-heart','VH_M_heart_left_ventricle','Follow left ventricular outflow',
  'Marked sites trace aortic outflow during ventricular ejection. Blood in the aortic arch continues to its branches and the descending aorta.',heart,[
    phase('Aortic valve','Left ventricular pressure exceeds aortic pressure and the aortic valve opens.','VH_M_aortic_valve'),
    phase('Ascending aorta','Ejected blood enters the ascending aorta.','VH_M_ascending_aorta'),
    phase('Aortic arch','Blood flows on into the aortic arch, where branches supply the head and upper limbs.','VH_M_aortic_arch')
  ],{bodyIds:['aorta','heart']});
add('pulmonary-outflow','Pulmonary trunk · right ventricular outflow','Cardiovascular','ap2-heart','','Trace blood toward the lungs',
  'This preparation shows the start of pulmonary circulation. The paired pulmonary arteries continue beyond the end of the pulmonary trunk.',heart,[
    phase('Right ventricle','The right ventricle develops pressure during systole.','VH_M_heart_right_ventricle'),
    phase('Pulmonary valve','When ventricular pressure exceeds arterial pressure, the pulmonary valve opens.','VH_M_pulmonary_valve'),
    phase('Pulmonary trunk','Blood enters the trunk on its way to the pulmonary arteries and lungs.','VH_M_pulmonary_trunk')
  ],{bodyIds:['heart']});
add('major-veins','Veins · return to the right heart','Cardiovascular','ap2-leg-venous-return','','Trace deep venous return',
  'This sequence traces one route from the proximal thigh through the pelvis to the thorax. A moving band along each vessel represents venous return.',text+'20-5-circulatory-pathways',[
    phase('Femoral vein','Venous blood from the thigh and lower limb ascends in the femoral vein.','right_femoral_vein'),
    phase('Iliac veins','The femoral vein continues as the external iliac vein, which joins the internal iliac to form the common iliac vein.','right_external_iliac_vein|right_common_iliac_vein'),
    phase('Inferior vena cava','The inferior vena cava carries blood toward the right atrium.','abdominal_inferior_vena_cava|thoracic_inferior_vena_cava'),
    phase('Right atrium','Blood enters the right atrium from below.','right_atrium')
  ],{travelAxis:'y',direction:[.1,.03,1],bodyIds:['venae-cavae']});

add('lymph-node','Lymph node','Lymphatic',spring+'node-sinuses','capsule|cortical_follicles','Follow lymph through a node',
  'The opened teaching model shows entry on the convex surface and exit at the hilum. Sinuses slow lymph and expose its contents to immune cells.',lymph,[
    phase('Afferent vessels','Several afferent vessels bring lymph to a node.','afferent_vessels'),
    phase('Subcapsular sinus','Lymph enters the sinus immediately beneath the capsule.','subcapsular_sinus'),
    phase('Medullary sinuses','After passing through cortical sinuses, lymph reaches the medullary sinuses.','medullary_sinuses'),
    phase('Efferent vessel','Filtered lymph exits at the hilum.','efferent_vessel')
  ],{bodyIds:[]});
const thymic='right_lobe_of_thymus|left_lobe_of_thymus';
add('thymus','Thymus','Lymphatic',spring+'immune-organs','','Follow T-cell maturation',
  'The two lobes contain developing T cells. The dots represent the changing cell population through selection. Cortex and medulla are microscopic here, so dot positions do not locate those compartments.',lymph,[
    phase('Precursors arrive','Lymphoid precursors arrive from bone marrow and start to mature in the thymus.',thymic),
    phase('Selection','Developing thymocytes undergo selection for useful recognition and self-tolerance.',thymic),
    phase('Mature cells leave','A fraction survives to enter circulation as mature naïve T cells.',thymic)
  ],{mechanism:'selection',bodyIds:['thymus']});
add('spleen','Spleen','Lymphatic',gland+'upper-abdomen','', 'Follow splenic blood filtration',
  'The spleen filters blood. Gold markers on the whole organ represent red-pulp clearance, and the highlighted splenic vein shows the direction of venous return.',lymph,[
    phase('Filter blood','Red-pulp macrophages remove damaged or poorly deformable erythrocytes.','spleen'),
    phase('Drain venous blood','Blood drains into the splenic vein and flows toward the hepatic portal system.','splenic_vein')
  ],{bodyIds:['spleen']});
const tonsils='palatine_tonsil_left|palatine_tonsil_right';
add('tonsils','Palatine tonsils','Lymphatic',spring+'immune-organs','','Follow a local immune response',
  'The two palatine tonsils flank the oropharynx. Pulses indicate antigen sampling and activation of local immune cells. Microscopic crypts and cells are represented symbolically.',lymph,[
    phase('Sample antigen','Crypt epithelium exposes lymphoid tissue to material arriving from the oral cavity.',tonsils),
    phase('Local response','Antigen presentation can activate specific lymphocytes in tonsillar tissue.',tonsils)
  ],{mechanism:'immune-response',bodyIds:['tonsils']});
add('red-marrow','Red bone marrow','Lymphatic',gland+'marrow-section','trabeculae|macrophage|megakaryocyte','Follow red-cell formation',
  'This enlarged marrow island shows erythroid cells near a supporting macrophage and a sinusoid. Cell development is compressed into a few seconds.',
  text+'18-2-production-of-the-formed-elements',[
    phase('Develop','Erythroid precursors proliferate and accumulate hemoglobin.','erythroid_cells'),
    phase('Enucleate','Late erythroblasts expel their nuclei before entering the circulation.','erythroid_nuclei'),
    phase('Enter blood','Reticulocytes cross into marrow sinusoids and complete maturation in circulation.','sinusoid')
  ],{bodyIds:[]});

const rightLobes='superior_lobe_of_right_lung|middle_lobe_of_right_lung|inferior_lobe_of_right_lung';
const leftLobes='superior_lobe_of_left_lung|inferior_lobe_of_left_lung';
const lungs=rightLobes+'|'+leftLobes;
add('lungs','Lungs and diaphragm','Respiratory',spring+'lung-lobes','trachea|right_main_bronchus|left_main_bronchus','Watch quiet breathing',
  'The five lobes move together as the diaphragm descends and then recoils. A complete teaching breath takes five seconds. The surface deformation illustrates regional movement.',breathing,[
    phase('Inspiration','Diaphragmatic contraction increases thoracic volume. Falling alveolar pressure draws air inward.',lungs+'|diaphragm',0),
    phase('End-inspiration','Lung volume peaks and flow reaches zero when alveolar pressure equals atmospheric pressure.',lungs,.38),
    phase('Expiration','The diaphragm relaxes, elastic recoil decreases lung volume and air flows outward.','diaphragm|'+lungs,.4)
  ],{mechanism:'breathing',duration:5,kind:'Organ movement',aliases:['whole lungs','right lung','left lung','pulmonary ventilation','inhalation','exhalation'],bodyIds:['lungs','diaphragm']});
add('diaphragm','Diaphragm · breathing','Respiratory',spring+'lung-lobes',lungs,'Watch the diaphragm descend',
  'Look up at the undersurface of the diaphragm. On inspiration the dome flattens toward the abdomen. The faded lung lobes show the thoracic side. One cycle represents a quiet breath.',breathing,[
    phase('Contract and descend','As the muscle contracts, the central tendon moves inferiorly and the chest cavity gains volume.','diaphragm',0),
    phase('End-inspiration','The dome reaches its lowest position near the end of inspiration.','diaphragm',.38),
    phase('Relax and rise','During quiet expiration, relaxation and elastic recoil let the dome return upward.','diaphragm',.4)
  ],{mechanism:'breathing',duration:5,kind:'Organ movement',aliases:['respiratory muscle','inhalation','exhalation','ventilation'],direction:[.32,-.55,1],bodyIds:['diaphragm','lungs']});
add('trachea-bronchi','Trachea and bronchi','Respiratory',spring+'lung-lobes','thyroid_cartilage','Follow conducting airflow',
  'The air column moves down the trachea and divides at the main bronchi on inspiration. During expiration flow reverses. Markers illustrate this direction inside the airway.',breathing,[
    phase('Inhale through the trachea','Air moves from the larynx down the trachea toward the carina.','trachea',0),
    phase('Divide at the carina','Air enters the right and left main bronchi during inspiration.','right_main_bronchus|left_main_bronchus',.25),
    phase('Exhale through both bronchi','During expiration, air returns from smaller airways to the main bronchi.','right_main_bronchus|left_main_bronchus',.50),
    phase('Return to the upper airway','Expiratory flow ascends the trachea.','trachea',.75)
  ],{mechanism:'airflow',bodyIds:['trachea','bronchi']});
add('alveoli','Alveoli and pulmonary capillaries','Respiratory',spring+'alveolar-exchange','alveolar_duct|pulmonary_arteriole|pulmonary_venule','Follow oxygen into blood',
  'Alveolar air and capillary blood are separated by a thin respiratory membrane. The overlay identifies the exchange compartments in an enlarged teaching specimen.',breathing,[
    phase('Alveolar air','Inspired air maintains a higher oxygen partial pressure in the alveolus than in incoming venous blood.','alveolar_air_spaces'),
    phase('Exchange surface','Oxygen diffuses across the alveolar epithelium, basement membranes and capillary endothelium.','alveolar_septum'),
    phase('Capillary blood','Oxygen enters blood, much of it binding hemoglobin. Carbon dioxide diffuses in the opposite direction.','capillary_network')
  ],{bodyIds:['lungs']});



const registered='organ-atlas/registered-organs';
const vocalis='Vocalis muscle.l|Vocalis muscle.r';
add('phonation','Larynx · preparing to speak','Respiratory','muscles-head-neck','Lateral crico-arytenoid muscle.l.001|Lateral crico-arytenoid muscle.r.001|Posterior crico-arytenoid muscle.l.001|Posterior crico-arytenoid muscle.r.001','Watch the vocal folds move into position',
  'Look down on the paired vocalis muscles inside the true vocal folds. Their anterior attachments stay fixed as the posterior ends move. The thin vibrating mucosal cover is outside this muscle preparation.',text+'22-1-organs-and-structures-of-the-respiratory-system',[
    phase('Breathe in','Posterior cricoarytenoid muscles abduct the vocal folds, widening the airway at the back.',vocalis,0),
    phase('Prepare to speak','Adductor muscles rotate and approximate the arytenoids, bringing the vocal processes and folds toward the midline.',vocalis,.20),
    phase('Voice','Expiratory airflow drives vibration of the approximated fold covers. The underlying muscle bodies shown here remain in the adducted posture.',vocalis,.50),
    phase('Breathe again','As phonation ends, the folds separate for breathing.',vocalis,.74)
  ],{kind:'Organ movement',mechanism:'phonation',aliases:['vocal cords','vocal folds','voice','glottis','phonation','vocalis'],direction:[.04,1,.1],up:[0,0,1],bodyIds:['larynx']});
add('paired-eyes','Both eyes · accommodation','Special senses',registered,'cornea_left|cornea_right|sclera_left|sclera_right','Compare left and right lenses',
  'The two lenses thicken together when focusing on a nearer object. Their movement is amplified inside both registered globes; the separate sagittal eye shows the ciliary muscle and zonules.',sensory,[
    phase('Far focus','Both lenses have a flatter profile for distant vision.','lens_left|lens_right',0),
    phase('Near focus','Reduced zonular tension lets each elastic lens become thicker and more curved.','lens_left|lens_right',.25),
    phase('Far focus returns','Increased tension flattens both lenses again.','lens_left|lens_right',.64)
  ],{kind:'Organ movement',mechanism:'eyes',direction:[.09,.16,1],fitContext:['sclera_left','sclera_right'],bodyIds:['eyes']});
add('paired-ears','Both ears · sound conduction','Special senses',registered,'','Compare middle-ear vibration',
  'This sequence illustrates simultaneous stimulation of both ears. Slow, enlarged oscillations show the eardrums and their ossicles relative to the midline.',
  'https://www.nidcd.nih.gov/health/how-do-we-hear',[
    phase('Pressure rises','The membranes move medially. Coupled malleus and incus motion drives the stapes toward each oval window.','tympanic_membrane_left|tympanic_membrane_right|malleus_left|malleus_right|incus_left|incus_right|stapes_left|stapes_right',0),
    phase('Pressure falls','The ear structures reverse their displacement as the pressure oscillates.','tympanic_membrane_left|tympanic_membrane_right|malleus_left|malleus_right|incus_left|incus_right|stapes_left|stapes_right',.5)
  ],{kind:'Organ movement',mechanism:'paired-ears',duration:3,direction:[.26,.28,1],bodyIds:['ears']});
add('lacrimal','Lacrimal glands and tear ducts','Special senses',registered,'','Follow tear production and drainage',
  'The glands release the aqueous component of tears onto the surface of the eyes. Markers identify the secretory and drainage organs on both sides. Blinking spreads the tears between these sites.',
  'https://www.nei.nih.gov/eye-health-information/healthy-vision/how-eyes-work/how-tears-work',[
    phase('Production','The lacrimal glands lie superolateral to the globes. Their secretion reaches the conjunctival sac.','lacrimal_gland_left|lacrimal_gland_right'),
    phase('Collection','Fluid reaches the medial puncta and enters the lacrimal canaliculi.','lacrimal_canaliculus_left|lacrimal_canaliculus_right'),
    phase('Lacrimal sacs','The canaliculi deliver tears into the lacrimal sacs.','lacrimal_sac_left|lacrimal_sac_right'),
    phase('Nasal drainage','Each nasolacrimal duct drains into the inferior meatus of the nasal cavity.','nasolacrimal_duct_left|nasolacrimal_duct_right')
  ],{bodyIds:['lacrimal-glands']});
add('larynx','Larynx and epiglottis','Respiratory',registered,'','Protect the airway during swallowing',
  'The larynx rises and moves forward as the epiglottis tilts back over the inlet. Movement is a simplified surface animation of the cartilages. Vocal fold closure takes place inside the larynx and is described in the phase text.',text+'23-3-the-mouth-pharynx-and-esophagus',[
    phase('Rise','The larynx begins to elevate and move anteriorly during the pharyngeal swallow.','thyroid_cartilage|cricoid_cartilage|epiglottis|arytenoid_cartilage_left|arytenoid_cartilage_right',0),
    phase('Protect the airway','The epiglottis covers the inlet. The true and false vocal folds close as the bolus passes.','epiglottis|arytenoid_cartilage_left|arytenoid_cartilage_right',.34),
    phase('Reopen','The larynx descends and the epiglottis returns toward its upright position.','thyroid_cartilage|cricoid_cartilage|epiglottis',.60)
  ],{kind:'Organ movement',mechanism:'larynx',direction:[.8,.32,.55],bodyIds:['larynx']});

add('venae-cavae','Venae cavae and right atrium','Cardiovascular',registered,'','Compare upper and lower body return',
  'Blood flows toward the right atrium through both caval systems at once. The markers follow the superior and inferior venae cavae. Each viewing step calls attention to part of that simultaneous return.',text+'20-5-circulatory-pathways',[
    phase('Upper body','Venous blood from the head, neck, upper limbs and thorax descends through the superior vena cava.','superior_vena_cava'),
    phase('Lower body','The inferior vena cava ascends through the abdomen, crosses the diaphragm and continues to the heart.','inferior_vena_cava_abdominal_part|inferior_vena_cava_thoracic_part'),
    phase('Right atrium','Both caval streams empty into the right atrium.','right_atrium')
  ],{direction:[.35,.06,1],bodyIds:['venae-cavae','heart']});

add('cochlea','Cochlea · place and pitch','Special senses',neuro+'labyrinth','','Compare the location of two pitch responses',
  'The marked spiral follows the partition between the two fluid-filled scalae. The bright band represents the approximate site of greatest vibration. Time and amplitude are enlarged. Each sound produces a traveling wave that begins at the base.',
  'https://www.nidcd.nih.gov/health/how-do-we-hear',[
    phase('Higher pitch','A higher-frequency wave reaches its maximum closer to the basal turn, near the oval window.','Scala vestibuli|Scala tympani'),
    phase('Lower pitch','A lower-frequency wave travels farther along the spiral before reaching its maximum closer to the apex.','Scala vestibuli|Scala tympani')
  ],{mechanism:'cochlear-wave',bodyIds:['ears'],direction:[.5,.15,1]});

export const regulationOrgans=list;
