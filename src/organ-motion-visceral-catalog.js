import {chapters} from './ap3-curriculum.js';

const sources=new Map(chapters.flatMap(ch=>ch.sections.map(s=>[s.id,s.source])));
const spring=file=>'assets/ap3-models/'+file+'.glb';
const registered='assets/organ-atlas/registered-organs.glb';
const gut=spring('alimentary-tract'),accessory=spring('accessory-ducts'),renal=spring('urinary-tract');
const male=spring('sperm-route'),female='assets/ap2-glands/ovarian-region.glb',pelvic=spring('pelvic-section');
const digestive='Digestive',urinary='Urinary',reproductive='Reproductive';
const amber='#ffcd62',blood='#ff795f',bile='#b7e05b',milk='#fff1ca',blue='#7cd2ed';
const trace=(path,span=[0,1],color=amber,extra={})=>({mode:'trace',path,span,color,...extra});
const wave=(mesh,path,extra={})=>({mode:'wave',mesh,path,...extra});
const propel=(mesh,path,extra={})=>wave(mesh,path,{marker:true,color:amber,range:[.13,.98],...extra});
const cue=(mesh,span,color)=>({mode:'cue',mesh,span,color});
const list=[];
function add(id,title,system,asset,targets,context,section,action,description,steps,effects,extra={}){
  const deforms=effects.some(e=>['wave','mix','fill','empty'].includes(e.mode));
  const flow=effects.some(e=>e.mode==='trace'||e.marker);
  list.push({id,title,system,asset,targets:targets.split(' '),context:context?context.split(' '):[],
    kind:deforms?(flow?'Movement and flow':'Organ movement'):'Process overlay',
    section,action,description,phases:steps.map(([label,text,at])=>({label,text,at})),effects,
    source:sources.get(section),duration:8,bodyIds:[id],...extra});
}

add('esophagus','Esophagus',digestive,gut,'esophagus','stomach','23.3','Swallow a bolus',
  'The gold marker follows the esophageal lumen. A narrowing of the wall follows the bolus toward the stomach. The wave speed and bolus size are illustrative.',[
    ['Bolus enters','The pharynx delivers a bolus through the upper esophageal sphincter.'],
    ['Peristaltic wave','Circular muscle contracts behind the moving bolus.'],
    ['Distal delivery','Relaxation of the lower sphincter permits entry into the stomach.']],
  [propel('esophagus','esophagus',{amplitude:.36,width:.065})]);

add('stomach','Stomach',digestive,gut,'stomach','duodenum','23.4','Mix and retropel chyme',
  'Follow an antral mixing wave toward the pylorus. The gold tracer shows a portion of chyme swept back when the outlet narrows. Its path and the contraction amplitude are illustrative.',[
    ['Wave starts','A contraction begins in the body and travels distally.'],
    ['Antrum contracts','The distal stomach compresses its contents toward the pyloric canal.'],
    ['Retropulsion','Most of this portion turns back as the pyloric outlet narrows.']],
  [wave('stomach','stomach',{amplitude:.24,width:.09}),trace('stomach',[.05,.65],amber,{range:[.26,.9]}),trace('stomach',[.65,1],amber,{range:[.9,.47]})]);

add('duodenum','Duodenum',digestive,gut,'duodenum','','23.5','Propel chyme through the loop',
  'A local contraction advances around the C-shaped duodenum. Gold marks the luminal route from the pyloric side toward the jejunum.',[
    ['Receive','Chyme arrives from the pyloric stomach.'],['Advance','A peristaltic wave propels contents through the duodenal loop.'],['Deliver','The duodenum continues into the jejunum.']],
  [propel('duodenum','duodenum',{amplitude:.23})],{bodyIds:['duodenum','small-intestine']});

for(const [id,title,key,label] of [['jejunum','Jejunum','jejunal-segment','jejunum'],['ileum','Ileum','ileal-segment','ileum']]){
  add(id,title,digestive,gut,id,'','23.5','Watch segmentation',
    'The highlighted region is one connected loop in the '+label+' preparation. Alternating contractions mix its contents. The source contains separate bowel segments, so the animation stays within this loop.',[
      ['Relaxed loop','Use the changing diameter to locate the active segment.'],
      ['Alternating rings','Circular muscle narrows neighboring portions at different times.'],
      ['Mixing','As the rings relax and reform, luminal contents mix with digestive secretions.']],
    [{mode:'mix',mesh:id,path:key,amplitude:.32,radius:.017},trace(key,[0,.5],amber,{range:[.47,.62]}),trace(key,[.5,1],amber,{range:[.62,.47]})],{bodyIds:[id,'small-intestine']});
}

for(const [id,title,mesh,asset,beg,end] of [
  ['ascending-colon','Ascending colon','ascending_colon',gut,'cecal region','right colic flexure'],
  ['transverse-colon','Transverse colon','transverse_colon',gut,'right colic flexure','left colic flexure'],
  ['descending-colon','Descending colon','descending_colon',gut,'left colic flexure','sigmoid colon']
]){
  add(id,title,digestive,asset,mesh,'','23.5','Follow a propulsive contraction',
    'The gold marker follows a representative path from the '+beg+' toward the '+end+'. The narrowing behind it illustrates wall contraction.',[
      ['Arrival','Contents arrive from the '+beg+'.'],
      ['Contraction','Smooth muscle raises local pressure and propels contents distally.'],
      ['Distal passage','Contents move toward the '+end+'.']],
    [propel(mesh,id,{amplitude:.24})],{bodyIds:[id,'large-intestine']});
}

const colorectal=spring('distal-colon');
add('sigmoid-colon','Sigmoid colon',digestive,colorectal,'sigmoid_colon','descending_colon rectum','23.5','Follow a propulsive contraction',
  'Follow the pelvic loop from the descending colon on the patient’s left to the rectum near the midline. All three segments share their original Human Reference Atlas coordinates. The gold marker travels in the direction of colonic transit.',[
    ['Descending–sigmoid junction','Contents enter from the left side of the abdomen.'],
    ['Pelvic loop','The loop bends medially through the pelvis. Its shape and length vary among individuals.'],
    ['Rectosigmoid junction','The sigmoid colon continues into the upper rectum.']],
  [propel('sigmoid_colon','sigmoid-colon',{amplitude:.20,range:[.02,.98]})],
  {direction:[.18,.82,1],modelSource:'Human Reference Atlas · large intestine, male v1.2',bodyIds:['sigmoid-colon','large-intestine']});
add('rectum','Rectum',digestive,colorectal,'rectum','sigmoid_colon','23.5','Follow rectal emptying',
  'This oblique side view shows the bend of the rectum below the sigmoid colon. The tracer moves toward the anal canal as rectal contraction helps expel contents. The anal sphincters are outside this preparation.',[
    ['Rectosigmoid junction','Feces enter the rectum from the sigmoid colon.'],
    ['Distension','Stretch of the rectal wall initiates the defecation reflex.'],
    ['Emptying','Rectal contraction and coordinated relaxation of the outlet permit defecation.']],
  [propel('rectum','rectum',{amplitude:.24,range:[.02,.98]})],
  {direction:[.95,.10,.32],modelSource:'Human Reference Atlas · large intestine, male v1.2',bodyIds:['rectum']});

add('liver','Liver',digestive,accessory,'liver hepatic_portal_vein','','23.6','Follow hepatic portal inflow',
  'A tracer follows the segmented hepatic portal vein toward the liver. Its arrival marks delivery of absorbed nutrients. The smaller intrahepatic vessels lie beyond this preparation.',[
    ['Portal stream','Nutrient-rich venous blood travels from digestive organs.'],
    ['Portal entry','Blood approaches the porta hepatis.'],
    ['Hepatic processing','Inside the liver, portal branches supply sinusoids where hepatocytes exchange substances with blood.']],
  [trace('portal-inflow',[0,.82],blood),cue('liver',[.69,1],amber)]);
add('gallbladder','Gallbladder',digestive,accessory,'gallbladder cystic_duct bile_duct','duodenum','23.6','Empty stored bile',
  'Follow bile out of the gallbladder through the cystic duct and into the common bile duct. The donor shows one continuous outlet. The change between the two duct labels illustrates where the common hepatic duct would join.',[
    ['Stored bile','Bile produced by the liver is concentrated in the gallbladder.',0],
    ['Cystic duct','Cholecystokinin promotes contraction during a meal. Stored bile leaves through the gallbladder neck and cystic duct.',.22],
    ['Common bile duct','Follow the marker toward the duodenal wall. Bile enters the bowel through the duodenal papilla, beyond the end of this visible duct.',.37]],
  [{mode:'empty',mesh:'gallbladder',pivot:[-.03019,1.15737,.03916],amount:.21,span:[.22,1]},trace('cystic-duct',[.22,.37],bile),trace('common-bile-duct',[.37,.93],bile)],{direction:[.1,-.32,1]});
add('pancreas','Pancreas · exocrine secretion',digestive,accessory,'pancreas pancreatic_duct','duodenum','23.6','Deliver pancreatic juice',
  'Follow the gold tracer along the main pancreatic duct toward the duodenum. Juice from acinar and duct cells contains digestive enzymes and bicarbonate. The microscopic opening is beyond this mesh.',[
    ['Exocrine secretion','Acini supply enzymes and duct cells add a bicarbonate-rich fluid.'],
    ['Duct transport','Pancreatic juice flows from smaller branches into the main duct.'],
    ['Duodenal delivery','The duct directs the secretion toward the descending duodenum.']],
  [trace('pancreatic-duct',[0,1],amber)],{bodyIds:['pancreas']});

add('kidneys','Kidneys',urinary,renal,'kidney_left kidney_right left_renal_artery right_renal_artery','','25.3','Follow renal blood supply',
  'Red tracers follow the two renal arteries toward the hila. The kidney surfaces retain their shape during inflow. Filtration takes place downstream in microscopic glomeruli.',[
    ['Arterial inflow','Each renal artery carries blood from the abdominal aorta.'],
    ['Approach the hilum','The paired vessels enter on the medial sides of the kidneys.'],
    ['Intrarenal supply','Intrarenal branches eventually feed afferent arterioles and glomeruli.']],
  [trace('renal-artery-left',[0,.9],blood),trace('renal-artery-right',[0,.9],blood),cue('kidney_left',[.77,1],blood),cue('kidney_right',[.77,1],blood)],{bodyIds:['kidneys','kidney-left','kidney-right']});
add('ureters','Ureters',urinary,renal,'ureter_left ureter_right','renal_pelvis_left renal_pelvis_right urinary_bladder','25.2','Propel urine toward the bladder',
  'Urine moves in small boluses. A traveling muscular contraction follows each gold tracer from the renal pelvis toward the bladder. The two timings are illustrative.',[
    ['Pelvic origin','A bolus enters a ureter from its renal pelvis.'],
    ['Traveling contraction','Smooth muscle contracts behind the bolus as it moves distally.'],
    ['Bladder entry','The bolus reaches the oblique intramural segment at the bladder.']],
  ['left','right'].map((side,i)=>propel('ureter_'+side,'ureter-'+side,{span:[i*.10,.9+i*.10],amplitude:.40,width:.045,range:[.1,.99]})));
add('urinary-bladder','Urinary bladder',urinary,renal,'urinary_bladder','','25.2','Fill and empty the bladder',
  'Watch the mobile dome expand above the comparatively fixed bladder neck. During voiding the outlet relaxes and the detrusor contracts. The shape change illustrates a storage and voiding cycle at an accelerated speed.',[
    ['Filling','The accommodating bladder stores urine at low pressure.'],
    ['Distension','Increasing wall stretch activates sensory pathways.'],
    ['Voiding','Detrusor contraction and a relaxed outlet move urine into the urethra.']],
  [{mode:'fill',mesh:'urinary_bladder',amount:.43}],{bodyIds:['bladder','urinary-bladder']});
add('urethra','Urethra',urinary,renal,'urethra','urinary_bladder','25.2','Follow urine during voiding',
  'In this male specimen, a gold tracer follows the urethra from the bladder neck toward its external opening. Rotate to see its pelvic and penile portions.',[
    ['Outlet opens','Coordinated sphincter relaxation permits flow.'],['Urethral flow','A pressure gradient drives urine through the lumen.'],['Exit','Urine reaches the external urethral opening.']],
  [trace('urethra')],{direction:[.7,.1,1]});

add('testes','Testes',reproductive,male,'testis_left testis_right epididymis_left','epididymis_right','27.1','Follow sperm into the epididymis',
  'The paired testes provide orientation. The gold marker follows the gross head-to-tail course along the left epididymis after sperm leave the testis. Its tightly coiled microscopic duct is represented by the external envelope.',[
    ['Production','Developing sperm form inside seminiferous tubules.'],
    ['Testicular outflow','Tubules drain through the rete testis and efferent ductules to the epididymal head.'],
    ['Maturation','Sperm pass through the epididymal duct toward its tail.']],
  [cue('testis_left',[0,.31],amber),trace('epididymis',[.28,1])],{bodyIds:['testes','testis-left','testis-right']});
add('epididymis','Epididymis',reproductive,male,'epididymis_left','testis_left','27.1','Trace head to tail',
  'Follow the gross course of the left epididymis from its head around the testis to its tail. The tracer represents the direction of passage through a highly coiled microscopic duct.',[
    ['Head','Efferent ductules carry sperm into the epididymal head.'],['Body','Sperm mature during ductal transit.'],['Tail','Stored sperm can enter the ductus deferens.']],
  [trace('epididymis')],{direction:[-.4,.08,-1],bodyIds:['epididymis','epididymides']});
add('ductus-deferens','Ductus deferens',reproductive,male,'ductus_deferens_left illustrative_terminal_ductus_left ejaculatory_duct_left','','27.1','Follow sperm during emission',
  'The tracer ascends from the epididymal end of the left duct and returns behind the bladder. A short terminal continuation bridges a gap in the donor surface.',[
    ['Ascend','Smooth muscle propels sperm from near the epididymal tail.'],
    ['Pelvic turn','The duct turns inferiorly behind the bladder.'],
    ['Junction','Its terminal ampulla joins the duct of the seminal gland.']],
  [trace('ductus',[0,.77]),trace('terminal-ductus',[.77,.96]),trace('ejaculatory-duct',[.96,1])],{bodyIds:['ductus-deferens','ductus-deferentes']});
add('ejaculatory-ducts','Ejaculatory ducts',reproductive,male,'ejaculatory_duct_left ejaculatory_duct_right','prostate','27.1','Follow an ejaculatory duct',
  'The left duct carries the combined contents of the ductus deferens and the seminal-gland duct. Follow it through the prostate to the prostatic urethra.',[
    ['Duct junction','The duct begins where the ductus deferens and seminal-gland duct meet.'],
    ['Through the prostate','Each short duct crosses the prostate on its own side.'],
    ['Urethral entry','Contents enter the prostatic urethra. Prostatic glandular ducts have separate openings.']],
  [trace('ejaculatory-duct')],{direction:[.55,.32,-1]});
add('seminal-glands','Seminal glands',reproductive,male,'seminal_gland_left seminal_gland_right ejaculatory_duct_left','ejaculatory_duct_right prostate','27.1','Add seminal fluid',
  'The seminal glands supply much of the fluid in semen. Follow the gold tracer along the left ejaculatory duct after the gland outlet meets the ductus deferens.',[
    ['Gland secretion','The paired glands produce a fructose-containing secretion.'],
    ['Duct junction','The seminal-gland duct joins the ductus deferens.'],
    ['Emission','The ejaculatory duct delivers its contents to the prostatic urethra.']],
  [cue('seminal_gland_left',[0,.48],amber),cue('seminal_gland_right',[0,.48],amber),trace('ejaculatory-duct',[.32,1])],{direction:[.38,.13,-1],bodyIds:['seminal-glands','seminal-vesicles']});
add('prostate','Prostate',reproductive,male,'prostate urethra','','27.1','Follow prostatic fluid',
  'Prostatic secretion enters the prostatic urethra through small glandular ducts. The tracer starts in that proximal urethral segment and travels distally after secretion enters.',[
    ['Gland activity','Prostatic tissue contributes fluid to semen.'],
    ['Duct openings','Multiple small prostatic ducts open independently into the urethra.'],
    ['Urethral transport','Secretions join other components of semen for onward transport.']],
  [cue('prostate',[0,.53],amber),trace('urethra',[.36,1],amber,{range:[.06,.30]})],{direction:[.4,.10,1],fitTargets:['prostate']});
add('penis','Penis · spongy urethra',reproductive,male,'corpus_spongiosum_of_penis glans_penis urethra','','27.1','Trace the spongy urethra',
  'During emission, sperm and glandular secretions enter the prostatic urethra. During expulsion, rhythmic muscle contractions propel semen through the spongy urethra. Follow the gold marker toward the glans.',[
    ['Proximal segment','Semen enters the spongy urethra after the membranous segment.'],
    ['Penile course','The spongy urethra runs within the corpus spongiosum.'],
    ['External opening','The distal urethra opens at the glans.']],
  [trace('urethra',[0,1],amber,{range:[.43,1]})],{fitTargets:['corpus_spongiosum_of_penis','glans_penis']});

const leftTube='VH_F_fibria_of_uterine_tube_L VH_F_uterine_tube_infundibulum_L VH_F_ampulla_of_uterine_tube_L VH_F_isthmus_of_fallopian_tube_L';
const tubeFlow=[trace('oocyte-capture',[0,.2]),trace('left-infundibulum',[.2,.35]),trace('left-ampulla',[.35,.85]),trace('left-isthmus',[.85,1])];
add('ovaries','Ovaries',reproductive,female,'VH_F_left_ovary VH_F_right_ovary '+leftTube,'','27.2','Follow an ovulated oocyte',
  'An enlarged gold marker starts at the left ovarian surface, passes the fimbrial region, then follows the uterine tube. The timing is compressed. The ovary and tube are separate structures.',[
    ['Ovulation','A mature follicle releases its secondary oocyte into the peritoneal cavity beside the tube.'],
    ['Capture','Fimbrial and ciliary movements help direct the oocyte into the infundibulum.'],
    ['Tubal transport','Cilia and smooth-muscle activity advance the oocyte toward the uterus.']],
  tubeFlow,{direction:[.1,.48,1],bodyIds:['ovary','ovaries']});
add('uterine-tubes','Uterine tubes',reproductive,female,leftTube,'VH_F_left_ovary VH_F_cornua','27.2','Trace transport toward the uterus',
  'The marker follows the left infundibulum, ampulla and isthmus. These sections come from one segmented reference pelvis. The ampulla is the usual site of fertilization.',[
    ['Infundibulum','The infundibulum receives the oocyte near the fimbriae.'],
    ['Ampulla','Cilia and tubal muscle help transport material through the wider portion.'],
    ['Isthmus','The narrow isthmus leads to the intramural portion of the tube.']],
  [trace('left-infundibulum',[0,.15]),trace('left-ampulla',[.15,.83]),trace('left-isthmus',[.83,1])],{direction:[0,.50,1],bodyIds:['uterine-tubes','fallopian-tubes']});
const uterineWall='VH_F_fundus_of_uterus VH_F_body_of_uterus VH_F_anterior_wall_of_uterus VH_F_posterior_wall_of_uterus VH_F_lower_uterine_segment VH_F_cervix';
add('uterus','Uterus',reproductive,female,uterineWall,'VH_F_internal_cervical_os VH_F_external_cervical_os','27.2','Trace menstrual outflow',
  'Gold shows the direction of menstrual flow from the uterine body to the cervical canal. The external uterine surfaces provide orientation. The centerline illustrates flow through the cavity.',[
    ['Shedding','Falling ovarian hormone levels trigger breakdown of the functional endometrial layer.'],
    ['Uterine body','Blood, tissue and fluid move toward the lower uterine segment.'],
    ['Cervical passage','Menstrual fluid passes through the cervical canal toward the vagina.']],
  [trace('uterine-body',[0,.6]),trace('cervix',[.6,1])],{direction:[.12,.4,1]});
add('cervix','Cervix',reproductive,female,'VH_F_cervix VH_F_internal_cervical_os VH_F_external_cervical_os','VH_F_cervicovaginal_junction','27.2','Trace the cervical canal',
  'The gold marker enters at the internal os and moves to the external os on the vaginal side. In this example it represents menstrual fluid.',[
    ['Internal os','The cervical canal communicates superiorly with the uterine cavity.'],
    ['Cervical canal','Fluid passes through the endocervical canal.'],
    ['External os','The external os opens into the upper vagina.']],
  [trace('cervix')],{direction:[.45,.1,1]});
add('vagina','Vagina',reproductive,pelvic,'vagina','cervix pubic_symphysis rectum','27.2','Trace the vaginal canal',
  'In this sagittal teaching section the gold marker follows menstrual fluid from the cervical end of the vagina toward the vestibule. Anterior is to the left.',[
    ['Upper vagina','The vaginal canal surrounds the projecting cervix.'],
    ['Canal','The vagina lies behind the urethra and bladder and in front of the rectum.'],
    ['Outlet','The canal opens into the vestibule.']],
  [trace('vagina')],{direction:[.02,.01,1],modelSource:'Original Osteon teaching reconstruction'});

add('placenta','Placenta and umbilical cord',reproductive,'assets/ap2-glands/placenta.glb','VH_F_basal_plate VH_F_chorionic_plate VH_F_placenta_vessels VH_F_umbilical_artery_1 VH_F_umbilical_artery_2 VH_F_umbilical_vein','VH_F_umbilical_cord','28.3','Trace fetal placental circulation',
  'Blue follows one of the two umbilical arteries toward the chorionic plate. Red then follows the single umbilical vein away from the placenta. These colors represent relative oxygenation of fetal blood.',[
    ['Arterial delivery','Umbilical arteries deliver fetal blood to the placenta.'],
    ['Villous exchange','Fetal capillaries exchange substances with surrounding maternal blood across villous tissue.'],
    ['Venous return','The umbilical vein returns relatively oxygen-rich blood toward the fetus.']],
  [trace('placental-artery',[0,.45],blue),cue('VH_F_placenta_vessels',[.36,.66],amber),trace('placental-vein',[.58,1],blood)],{direction:[.10,.40,1]});
add('mammary-alveoli','Mammary alveoli',reproductive,spring('lactating-unit'),'secretory_alveoli milk_in_lumina myoepithelial_cells lactiferous_duct nipple','','28.6','Watch milk ejection',
  'In this enlarged teaching unit, secretory cells supply milk to the alveoli. Oxytocin stimulates the surrounding myoepithelial cells and milk moves into the duct.',[
    ['Milk production','Prolactin supports secretion by the alveolar epithelial cells.'],
    ['Let-down','Oxytocin triggers contraction of myoepithelial cells around the alveoli.'],
    ['Duct flow','The cream-colored tracer follows a collecting branch toward the nipple.']],
  [cue('secretory_alveoli',[0,.31],milk),cue('myoepithelial_cells',[.22,.64],amber),trace('milk-duct',[.45,1],milk)],{modelSource:'Original Osteon teaching reconstruction',bodyIds:[]});

for(const [key,title,outlet] of [
  ['parotid','Parotid glands','oral vestibule near the upper second molar'],
  ['submandibular','Submandibular glands','floor of the mouth beside the lingual frenulum']
]){
  add(key+'-glands',title,digestive,registered,[key+'_gland_left',key+'_gland_right',key+'_duct_left',key+'_duct_right'].join(' '),'','23.3','Follow saliva along the ducts',
    'Two tracers follow the paired donor ducts from gland to mouth. The '+key+' ducts deliver saliva to the '+outlet+'.',[
      ['Secretion','Secretory cells produce saliva.'],
      ['Duct transit','Fluid moves along the excretory duct on each side.'],
      ['Oral opening','Saliva enters the '+outlet+'.']],
    [trace(key+'-left',[.03,.98],blue),trace(key+'-right',[.03,.98],blue)],{direction:[.36,.05,1]});
}
add('sublingual-glands','Sublingual glands',digestive,registered,'sublingual_gland_left sublingual_gland_right','tongue','23.3','Watch sublingual secretion',
  'Small blue markers above each gland represent secretion into the floor of the mouth through multiple small outlets. Individual duct openings are below the resolution of this atlas.',[
    ['Gland position','The sublingual glands sit immediately beneath the oral mucosa.'],
    ['Secretion','Their secretory units produce predominantly mucous saliva.'],
    ['Oral delivery','Multiple small sublingual ducts deliver secretion along the sublingual fold.']],
  [cue('sublingual_gland_left',[0,.47],blue),cue('sublingual_gland_right',[0,.47],blue),trace('sublingual-left',[.37,1],blue),trace('sublingual-right',[.37,1],blue)],{direction:[.15,.36,1]});
add('tongue-swallow','Tongue · swallowing',digestive,registered,'tongue','oropharynx','23.3','Propel a bolus backward',
  'A wave of elevation passes from the front of the tongue toward the back, pressing a bolus against the palate. The raised area and gold marker illustrate the oral transport phase.',[
    ['Anterior seal','The front of the tongue rises against the palate.'],
    ['Posterior transport','The tongue presses and directs the bolus posteriorly.'],
    ['Pharyngeal entry','The bolus reaches the oropharynx and the pharyngeal phase follows.']],
  [{mode:'tongue',mesh:'tongue'}, {mode:'trace',points:[[0,1.535,.072],[0,1.542,.061],[0,1.544,.049],[0,1.541,.037],[0,1.534,.027],[0,1.524,.019]]}],
  {bodyIds:['tongue'],direction:[.82,.28,.36],kind:'Movement and flow'});

add('pharynx','Pharynx · swallowing',digestive,registered,'oropharynx laryngopharynx','nasopharynx epiglottis cricoid_cartilage esophagus tongue','23.3','Follow a swallowed bolus',
  'Follow the bolus behind the tongue and past the airway to the upper esophagus. In the starting side view, the airway lies toward the front. The bright trail records the path already traveled.',[
    ['Pharyngeal entry','The tongue directs the bolus into the oropharynx.',0],
    ['Protected airway','The bolus passes behind the laryngeal inlet. The epiglottis marks its anterior margin.',.40],
    ['Esophageal entry','The bolus enters the upper esophagus behind the cricoid cartilage.',.82]],
  [trace('oropharynx',[0,.40],amber,{trail:true,size:.060}),
    trace('laryngopharynx',[.40,.82],amber,{trail:true,size:.060}),
    {mode:'trace',points:[[.001,1.474,.004],[.001,1.470,.0024],[.0006,1.464,.0015]],span:[.82,1],color:amber,trail:true,size:.060},
    {...cue('oropharynx',[0,.3999],'#f3ad63'),sustained:true},
    {...cue('laryngopharynx',[.40,.8199],'#f3ad63'),sustained:true}],
  {direction:[1,.015,.055],landmarks:[
    {label:'Airway',mesh:'epiglottis',point:[0,1.509,.021],offset:[0,.005,.021]},
    {label:'Esophagus',mesh:'esophagus',point:[.0006,1.464,.0015],offset:[0,-.002,.030],size:.12}]});
add('cecum','Cecum',digestive,registered,'cecum','ascending_colon','23.5','Locate initial colonic mixing',
  'This blind pouch receives material from the terminal ileum. Follow an illustrative displacement of contents within the pouch as local muscular activity mixes them.',[
    ['Receive','Material entering across the ileocecal junction reaches the cecum.'],
    ['Mix','Local contractions redistribute cecal contents.'],
    ['Continue','The cecum communicates superiorly with the ascending colon.']],
  [{mode:'mix',mesh:'cecum',path:'cecum',amplitude:.19},trace('cecum',[0,.52],amber,{range:[.25,.50]}),trace('cecum',[.52,1],amber,{range:[.50,.36]})],{bodyIds:['large-intestine']});
add('appendix','Vermiform appendix',digestive,registered,'vermiform_appendix','cecum','23.5','Locate the appendiceal immune surface',
  'Follow an enlarged gold marker from a short segment of the appendiceal lumen to a representative wall site. Lymphoid tissue in the wall participates in mucosal immune responses. The marker shows where sampling occurs at organ scale.',[
    ['Lumen','The appendiceal lumen communicates with the cecum.'],
    ['Mucosal surface','The mucosal lining faces material in the lumen.'],
    ['Lymphoid tissue','Lymphoid follicles are embedded in the wall. Their cellular arrangement requires microscopy.']],
  [trace('appendix',[0,.50],amber,{range:[.06,.3]}),trace('appendix-wall',[.50,1],amber),cue('vermiform_appendix',[.72,1],amber)]);
const breast='assets/organ-atlas/mammary-glands.glb';
add('mammary-glands','Mammary glands',reproductive,breast,'VH_F_mammary_lobes_L VH_F_main_lactiferous_ducts_L VH_F_nipple_L',
  'VH_F_areola_L VH_F_fat_L VH_F_main_lactiferous_sinuses_L VH_F_suspensory_ligaments_L','28.6','Follow milk to the nipple',
  'In this Human Reference Atlas preparation of the left breast, a tracer moves through two segmented portions of the duct system. The lobes contain milk-producing units during lactation. Duct segments are shown at their original locations.',[
    ['Glandular tissue','Secretory alveoli produce milk within the lobular tissue of a lactating breast.'],
    ['Milk ejection','Oxytocin-induced contraction of myoepithelial cells moves milk into the ducts.'],
    ['Nipple','Milk passes through terminal ducts to openings at the nipple.']],
  [cue('VH_F_mammary_lobes_L',[0,.40],milk),trace('breast-duct',[.30,.69],milk),trace('breast-terminal',[.69,.94],milk),cue('VH_F_nipple_L',[.82,1],milk)],{direction:[.36,.03,1]});

const femaleUrinary='assets/organ-atlas/female-urinary.glb';
add('female-ureters','Ureters · female reference',urinary,femaleUrinary,'VH_F_left_ureter VH_F_right_ureter','VH_F_renal_pelvis_L VH_F_renal_pelvis_R VH_F_ureteral_orifice_L VH_F_ureteral_orifice_R VH_F_trigone_of_urinary_bladder','25.2','Trace ureteral transport',
  'Follow a urine bolus down each ureter. The paired models retain the female reference anatomy from the renal pelves to the bladder orifices.',[
    ['Entry','Each ureter begins below a renal pelvis.'],['Peristalsis','Sequential smooth-muscle contraction propels urine toward the pelvis.'],['Bladder','Urine reaches the ureteral orifices at the bladder wall.']],
  ['left','right'].map((side,i)=>propel('VH_F_'+side+'_ureter','female-ureter-'+side,{amplitude:.33,width:.055,span:[.10*i,.90+.10*i],range:[.10,.98]})));
const bladderParts=['VH_F_fundus_of_urinary_bladder_dome','VH_F_fundus_of_urinary_bladder_base'];
add('female-bladder','Urinary bladder · female reference',urinary,femaleUrinary,bladderParts.join(' ')+' VH_F_trigone_of_urinary_bladder VH_F_urinary_bladder_neck_smooth_muscle',
  'VH_F_ureteral_orifice_L VH_F_ureteral_orifice_R','25.2','Watch bladder accommodation',
  'As the bladder fills, its dome moves while the neck and posterior trigone remain relatively fixed. Follow the change in outline through filling and voiding.',[
    ['Filling','Ureteral inflow gradually increases bladder volume.'],['Accommodation','The dome can expand while the outlet stays closed.'],['Emptying','Detrusor contraction and outlet relaxation reduce bladder volume.']],
  bladderParts.map(mesh=>({mode:'fill',mesh,amount:.38,bounds:[[-.0405,-.0152,-.0593],[.0114,.0262,.0024]],fixPosterior:true})),{direction:[.43,.16,1]});
const leftCollectingSystem=[
  ...Array.from('abcdefghij',branch=>'VH_F_minor_calyx_L_'+branch),
  ...Array.from('abcd',branch=>'VH_F_major_calyx_L_'+branch),
  'VH_F_renal_pelvis_L'
];
add('female-collecting-system','Renal collecting system · female reference',urinary,femaleUrinary,
  [...leftCollectingSystem,'VH_F_left_ureter'].join(' '),'','25.3','Drain urine from a calyx',
  'Trace one branch of the left collecting system. The arrow follows urine out of a minor calyx, into a major calyx, through the renal pelvis and into the upper ureter. Other calyces drain neighboring papillae.',[
    ['Minor calyx','Urine from a papilla enters the highlighted cup.',0],
    ['Major calyx','The arrow follows that cup into its shared major calyx.',.35],
    ['Renal pelvis','Urine from the major calyces converges in the renal pelvis.',.62],
    ['Upper ureter','Urine leaves the pelvis at the ureteropelvic junction and enters the proximal ureter.',.88]],
  [trace('minor-calyx',[0,.35],amber,{arrow:true,trail:true,size:.073}),
    trace('major-calyx',[.35,.62],amber,{arrow:true,trail:true,size:.073}),
    trace('female-renal-pelvis',[.62,.88],amber,{arrow:true,trail:true,size:.073}),
    trace('female-ureter-left',[.88,1],amber,{arrow:true,trail:true,size:.073,range:[0,.045]}),
    {...cue('VH_F_minor_calyx_L_e',[0,.3499],amber),sustained:true},
    {...cue('VH_F_major_calyx_L_b',[.35,.6199],amber),sustained:true},
    {...cue('VH_F_renal_pelvis_L',[.62,.8799],amber),sustained:true}],
  {direction:[.52,.10,-1],fitTargets:leftCollectingSystem});

add('female-urethra','Urethra · female sagittal section',urinary,pelvic,'urethra','bladder pubic_symphysis vagina','25.2','Follow urine through the pelvic outlet',
  'The gold marker moves from the bladder neck to the external urethral opening. In this sagittal teaching model, the urethra lies behind the pubic symphysis and in front of the vagina.',[
    ['Bladder outlet','The detrusor contracts as the outlet relaxes.'],
    ['Urethral lumen','A pressure gradient carries urine down the short urethra.'],
    ['Vestibule','Urine exits through the urethral opening anterior to the vaginal opening.']],
  [trace('female-urethra')],{direction:[.02,.01,1],modelSource:'Original Osteon teaching reconstruction'});
add('glomerular-filtration','Glomerular filtration barrier',urinary,spring('filtration-barrier'),
  'endothelium fenestrae basement_membrane podocyte_foot_processes filtration_slits capsular_space','','25.5','Compare what can cross the filtration barrier',
  'Play a water marker or choose a different particle in Compare particles. This enlarged section shows the direction of net filtration into capsular space. Marker sizes and stopping positions illustrate permeability.',[
    ['Endothelial pore','Water passes through a fenestra. Blood cells remain in the circulation.'],
    ['Basement membrane','Water and small solutes pass through the basement membrane. Most plasma protein stays in the blood.'],
    ['Filtration slit','Water crosses the slit diaphragm between podocyte foot processes and enters capsular space.']],
  [trace('filtration-barrier',[0,1],blue)],{direction:[.35,.20,1],bodyIds:['kidneys','female-collecting-system'],modelSource:'Original Osteon microscopic teaching reconstruction'});
add('nephron-transit','Cortical nephron and collecting duct',urinary,spring('nephron-pair'),
  'cortical_glomerular_capsule cortical_glomerular_tuft cortical_proximal_tubule cortical_loop cortical_distal_tubule shared_collecting_duct','afferent_arteriole efferent_arteriole peritubular_capillaries','25.4','Follow tubular fluid through the nephron',
  'The gold marker represents fluid remaining in the tubule. Follow one cortical nephron into a collecting duct. Reabsorption returns water and solutes to blood, while secretion transfers selected substances into the tubule.',[
    ['Proximal tubule','Filtrate enters from the renal corpuscle. The proximal tubule reabsorbs most filtered water and solutes.'],
    ['Nephron loop','Fluid descends the loop, rounds the bend and returns toward the cortex.'],
    ['Distal delivery','Fluid passes through the distal tubule and into a collecting duct, where water recovery varies with antidiuretic hormone.']],
  [trace('proximal-tubule',[0,.29]),trace('nephron-loop',[.29,.62]),trace('distal-tubule',[.62,.82]),trace('collecting-duct',[.82,1],amber,{range:[.014,1]})],
  {direction:[0,.05,1],duration:11,bodyIds:['kidneys','female-collecting-system'],modelSource:'Original Osteon microscopic teaching reconstruction'});

export const visceralOrgans=list;
