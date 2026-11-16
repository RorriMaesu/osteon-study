import {muscleFigureTargets} from './muscle-figure-targets.js';
import {chapter11Muscles} from './chapter11-muscles.js';

export const MOCK_EXAM4_VERSION='2026-11-12.1';
const sectionFor={mc:0,diagram:1,tf:2,written:3};
const bank={A:[],B:[]};
const figures=muscleFigureTargets;
const sectionSlugs={
 '10.1':'overview-of-muscle-tissues','10.2':'skeletal-muscle','10.3':'muscle-fiber-contraction-and-relaxation',
 '10.4':'nervous-system-control-of-muscle-tension','10.5':'types-of-muscle-fibers','10.6':'exercise-and-muscle-performance',
 '10.7':'cardiac-muscle-tissue','10.8':'smooth-muscle','10.9':'development-and-regeneration-of-muscle-tissue',
 '11.1':'interactions-of-skeletal-muscles-their-fascicle-arrangement-and-their-lever-systems','11.2':'naming-skeletal-muscles',
 '11.3':'axial-muscles-of-the-head-neck-and-back','11.4':'axial-muscles-of-the-abdominal-wall-and-thorax',
 '11.5':'muscles-of-the-pectoral-girdle-and-upper-limbs','11.6':'appendicular-muscles-of-the-pelvic-girdle-and-lower-limbs',
};

function add(form,lesson,objectives,topic,type,section,points,prompt,answer,explanation,extra={}){
 const id='exam4-'+form.toLowerCase()+'-'+(bank[form].length+1);
 const url='https://openstax.org/books/anatomy-and-physiology-2e/pages/'+lesson.replace('.','-')+'-'+sectionSlugs[lesson];
 bank[form].push({
  id,chapter:Number(lesson.split('.')[0]),lesson,topic,type,section,points,prompt,answer,explanation,
  contentVersion:MOCK_EXAM4_VERSION,objectives:objectives.map(n=>lesson+'.'+n),
  source:'OpenStax Anatomy and Physiology 2e §'+lesson,
  sourceLinks:[{url,label:'OpenStax §'+lesson}],
  noteSuggestion:explanation.slice(0,180),...extra
 });
}
function mc(form,lesson,rows){
 for(const [objectives,topic,prompt,answer,distractors,explanation] of rows){
  add(form,lesson,objectives,topic,'choice','mc',1,prompt,answer,explanation,{distractors});
 }
}
function visual(form,lesson,objectives,topic,figure,prompt,answer,explanation,aliases=[],termId){
 add(form,lesson,objectives,topic,'identify','diagram',2,prompt,answer,explanation,{
  figure,aliases,answerPolicy:{kind:'structure',allowAnySide:!!termId},...(termId?{termId}:{})
 });
}
function anatomy(form,lesson,objectives,target){
 const item=figures[target];
 const card=chapter11Muscles.find(card=>card.name.toLowerCase()===item.name.toLowerCase());
 visual(form,lesson,objectives,item.name,'muscle-target:'+target,'Name the marked muscle or structure.',item.name,item.description,[...new Set([...(item.aliases||[]),...(card?.aliases||[])])],card?.id);
}
function written(form,lesson,objectives,topic,prompt,answer,criteria,{claim,fixtures}={}){
 const id='exam4-'+form.toLowerCase()+'-'+(bank[form].length+1);
 const rubric={id:id+'-rubric',version:MOCK_EXAM4_VERSION,criteria:criteria.map(([label,description,points],i)=>({id:'criterion-'+(i+1),label,description,points}))};
 add(form,lesson,objectives,topic,'written',claim?'tf':'written',claim?2:3,prompt,answer,answer,{rubric,...(claim?{claim}:{}),fixtures});
}
function claim(form,lesson,objectives,topic,prompt,truth,reason,good,wrong){
 const opposite=truth==='True'?'False':'True';
 written(form,lesson,objectives,topic,prompt,truth+'. '+reason,[
  ['Judgment','Select '+truth.toLowerCase()+' for the statement.',1],['Explanation',reason,1],
 ],{claim:truth,fixtures:[
  [truth+'\n'+good,[1,1]],[opposite+'\nI selected '+opposite.toLowerCase()+'.',[0,0]],[truth+'\n'+wrong,[1,0]]
 ]});
}

mc('A','10.2',[
 [[1,2],'Force transmission','Which sequence traces force from a muscle fiber to its bony attachment?','Fiber connective tissue → tendon → bone',['Fiber → motor neuron → bone','Fiber → joint cartilage → tendon','Fiber → synaptic cleft → bone'],'Intramuscular connective tissue transmits tension to the tendon and on to the attachment.'],
 [[4],'Sodium and potassium channels','After threshold is reached in a skeletal muscle membrane, what contributes most directly to repolarization?','Potassium leaves through voltage-gated channels',['Sodium enters through voltage-gated channels','Calcium leaves the sarcoplasmic reticulum','Acetylcholine enters the motor neuron'],'Sodium entry drives rapid depolarization. Potassium exit contributes to repolarization.'],
 [[2],'Skeletal muscle functions','Which observation illustrates a function of skeletal muscle besides producing joint movement?','Shivering raises heat production',['Intercalated discs synchronize heart cells','Peristalsis propels food down the intestine','Smooth muscle adjusts arteriole diameter'],'Skeletal muscle contractions generate heat. Skeletal muscle also supports posture and soft tissues and helps control body openings.'],
]);
mc('B','10.2',[
 [[1],'Muscle packaging','Which layer encloses an individual skeletal muscle fiber?','Endomysium',['Epimysium','Perimysium','Periosteum'],'Endomysium surrounds individual fibers. Perimysium surrounds fascicles and epimysium encloses the muscle.'],
 [[4],'Neuromuscular junction','Acetylcholine is released normally, but its receptors at the motor end plate cannot open. What is the immediate effect?','The end-plate depolarization is reduced',['Potassium channels at the nerve terminal open more quickly','The sarcoplasmic reticulum releases more calcium directly','Cross-bridges detach before the end-plate potential changes'],'Opening motor end-plate receptors produces a net inward cation current. Blocking that step weakens the end-plate potential.'],
 [[4],'T-tubule signaling','A surface action potential occurs, but propagation along T-tubules fails. What changes first inside the fiber?','Sarcoplasmic-reticulum calcium release becomes impaired',['Troponin begins pumping calcium into the reticulum','Myosin immediately releases acetylcholine','The deep myofibrils receive a stronger excitation signal'],'T-tubules convey excitation into the fiber so the nearby sarcoplasmic reticulum releases calcium throughout it.'],
]);
mc('A','10.3',[
 [[1,3],'Sliding filaments','Which change occurs as a skeletal sarcomere shortens?','Its Z discs move closer together',['Its thick filaments shorten','Its thin filaments lengthen','Its A band becomes narrower'],'Filaments slide past each other. The A band stays about the same width as the I band and H zone narrow.'],
 [[2],'Immediate ATP supply','What regenerates ATP rapidly in the first seconds of a sudden maximal effort?','Phosphate transfer from creatine phosphate to ADP',['Oxygen binding directly to ADP','Glucose storage as glycogen','Calcium binding to troponin'],'Creatine kinase transfers a phosphate from creatine phosphate to ADP. Other energy pathways can contribute concurrently.'],
 [[1,2],'Calcium regulation','If calcium release is blocked while ATP remains available, what limits skeletal muscle contraction?','Tropomyosin continues to obstruct most myosin-binding sites on actin',['Myosin is unable to hydrolyze any ATP','Actin filaments disappear from the I band','ATP cannot bind to any myosin heads'],'Without enough calcium binding to troponin, tropomyosin continues to obstruct myosin-binding sites.'],
]);
mc('B','10.3',[
 [[3],'Sarcomere bands','Which region is approximately unchanged in width during ordinary sarcomere shortening?','A band',['I band','H zone','Distance between adjacent Z discs'],'The A band corresponds to the length of the thick filaments. Thin filaments slide inward without shortening the thick filaments.'],
 [[2],'ATP yield','Which comparison specifically concerns ATP yield per glucose molecule?','Aerobic respiration yields more ATP per glucose than glycolysis alone',['Glycolysis yields more ATP because it can run rapidly','Creatine phosphate yields more ATP per glucose than either pathway','Oxygen changes ATP production rate but never yield'],'Aerobic metabolism oxidizes fuel more completely. ATP yield per glucose and rate of ATP regeneration are distinct measures.'],
 [[1,2],'Relaxation','If the skeletal muscle calcium pump stops while the fiber still has ATP for cross-bridge cycling, what effect is expected?','Cytosolic calcium remains elevated longer and relaxation is delayed',['Calcium clears faster and the fiber relaxes sooner','Myosin stops binding ATP as a direct consequence','Tropomyosin exposes fewer sites while calcium remains high'],'ATP-dependent calcium uptake into the sarcoplasmic reticulum normally lowers cytosolic calcium after excitation.'],
]);
mc('A','10.4',[
 [[1],'Contraction under load','During the controlled lowering phase of a biceps curl, what is the active elbow flexor doing?','Lengthening while generating tension',['Shortening while generating tension','Holding its length constant as the elbow angle changes','Releasing all tension while the weight descends'],'An eccentric contraction produces tension as an active muscle lengthens under load.'],
 [[2],'Length–tension','Why does a greatly overstretched sarcomere generate less active force?','Fewer thick and thin filaments overlap sufficiently to form cross-bridges',['Myosin filaments become longer than the sarcomere','The stimulus frequency automatically falls','Recruitment of neighboring motor units is required to restore overlap'],'Active force depends on the number of possible cross-bridges at the starting length.'],
 [[4],'Motor units','Why do small motor units support precise movements?','Each added unit changes force by a smaller amount',['Each action potential becomes smaller','Each unit contains more fibers','Each fiber changes its action potential amplitude to match the target'],'With fewer fibers per motor neuron, recruitment adjusts force in smaller increments.'],
]);
mc('B','10.4',[
 [[1],'Isometric contraction','A learner holds a weight motionless with the elbow at 90 degrees. What describes the elbow flexors?','They generate tension with no appreciable change in length',['They actively shorten as the joint angle stays fixed','They produce no tension while the load is stationary','They lengthen steadily as they lift the weight'],'During an isometric hold, active tension balances the load while muscle–tendon length and joint position remain approximately constant.'],
 [[2],'Length–tension','Which starting length usually gives the greatest active tension in a skeletal sarcomere?','An intermediate length with favorable filament overlap',['The shortest possible length, with maximal filament crowding','The longest possible length, with no overlap','Any length once the action potential reaches threshold'],'An intermediate length allows many productive cross-bridges without excessive crowding or loss of overlap.'],
 [[3,4],'Temporal summation','A second stimulus arrives before the fiber relaxes from the first. Why can the second tension peak be higher?','Residual cytosolic calcium supports additional cross-bridge activity',['The second action potential is larger than the first','The second stimulus permanently lengthens the thick filaments','More motor units must be recruited within that single fiber'],'Residual calcium and incomplete relaxation allow force to summate in the stimulated fiber.'],
]);
mc('A','10.5',[
 [[1,2],'Slow oxidative fibers','Which profile favors repeated low-force activity for a long period?','Many mitochondria, abundant myoglobin and high fatigue resistance',['Few mitochondria, low myoglobin and rapid fatigue','High glycolytic reliance and poor capillary supply','Rapid fatigue with no appreciable aerobic capacity'],'Slow oxidative fibers sustain force through substantial oxidative capacity and oxygen delivery.'],
 [[1,2],'Fast glycolytic fibers','Which fiber type is best suited to a brief, high-power effort with limited fatigue resistance?','Fast glycolytic',['Slow oxidative','Fast oxidative-glycolytic only','Single-unit smooth muscle'],'Fast glycolytic fibers contract rapidly, rely heavily on glycolysis and fatigue comparatively quickly.'],
]);
mc('B','10.5',[
 [[1,2],'Fast oxidative fibers','Which profile best fits fast oxidative-glycolytic skeletal fibers?','Relatively fast contraction with both oxidative and glycolytic ATP production',['Slow contraction with almost no mitochondrial ATP production','Fast contraction with almost no oxidative capacity','No striations and a dependence on calmodulin alone'],'Fast oxidative-glycolytic fibers are relatively fast and have more oxidative support than fast glycolytic fibers.'],
 [[1,2],'Fiber mixtures','Two skeletal muscles contain different proportions of fiber types. What does this imply?','Their fatigue resistance and speed can differ even though both contain mixed fiber populations',['Every fiber in either muscle has identical properties','Both muscles must fatigue at the same rate','One muscle must contain cardiac fibers to resist fatigue'],'Whole skeletal muscles contain fiber mixtures suited to their functional demands.'],
]);
mc('A','10.6',[
 [[1,2],'Resistance training','A muscle enlarges after repeated high-resistance exercise. What change primarily explains the enlargement?','Existing fibers add contractile proteins and increase cross-sectional area',['Existing fibers are replaced by cardiac muscle','All motor neurons begin generating larger action potentials','Every existing fiber divides into two mature fibers'],'Resistance training chiefly enlarges existing fibers by adding contractile proteins and myofibrils.'],
 [[3],'Performance-enhancing substances','Which statement accurately describes anabolic steroid use in sport?','It can increase muscle protein synthesis and carries health risks',['It provides ATP directly to myosin without metabolism','It replaces the need for neural recruitment','It turns skeletal muscle into smooth muscle'],'Anabolic steroids can increase protein synthesis and muscle mass. They do not supply ATP or bypass neural activation.'],
]);
mc('B','10.6',[
 [[2],'Endurance training','Which cellular change would help trained muscle sustain aerobic activity?','Greater mitochondrial capacity and improved capillary supply',['Loss of mitochondria and decreased blood supply','Replacement of myofibrils with noncontractile scar tissue','A permanent rise in single-fiber action-potential amplitude'],'Endurance training improves oxygen delivery and oxidative ATP production.'],
 [[1],'Disuse atrophy','Which change best explains weakness after a limb is immobilized for several weeks?','Reduced fiber size and loss of contractile protein from disuse',['New skeletal fibers crowding out existing fibers','Greater fiber size due to passive rest','A permanent increase in mitochondrial volume in every fiber'],'Disuse atrophy reduces fiber size and contractile capacity.'],
]);
mc('A','10.7',[
 [[1],'Cardiac electrical coupling','Which part of an intercalated disc lets ionic current spread between adjacent cardiomyocytes?','Gap junctions',['Desmosomes','Motor end plates','Dense bodies'],'Gap junctions provide low-resistance paths for current between neighboring cardiac cells.'],
 [[1,2],'Cardiac coordination','Why is a long cardiac refractory period important for pumping?','It prevents sustained tetanus and allows relaxation between beats',['It allows many twitches to fuse into sustained contraction','It makes desmosomes open to conduct current','It allows contraction without calcium'],'Long refractoriness helps prevent tetanic fusion so cardiac muscle can relax and the chambers can refill.'],
]);
mc('B','10.7',[
 [[2],'Cardiac mechanical coupling','What is the primary role of desmosomes at intercalated discs?','They help prevent cells from pulling apart during contraction',['They carry most electrical current between adjacent cells','They bind calcium to uncover myosin sites','They pump calcium back into the sarcoplasmic reticulum'],'Desmosomes mechanically attach adjacent cardiomyocytes, while gap junctions couple them electrically.'],
 [[1],'Cardiac pumping','If a ventricular contraction ended too soon to sustain ejection pressure, what is the most direct concern?','Less blood could be ejected during that beat',['The chamber would eject more blood because pressure ended earlier','The atrium would be unable to receive blood at any time','Every cardiac cell would fuse into a skeletal motor unit'],'Ventricular ejection requires pressure sufficient to drive blood through the outflow valve for part of the beat.'],
]);


mc('A','11.1',[
 [[1],'Fixator action','During elbow flexion, a scapular muscle holds the scapula steady. Which role does it play in this task?','Fixator',['Prime mover of elbow flexion','Antagonist of elbow flexion','Insertion of the elbow flexor'],'A fixator stabilizes an attachment or supporting segment while the prime mover performs the action.'],
 [[2],'Fascicle arrangement','With comparable muscle volume, which arrangement generally favors greater shortening excursion?','Long, mostly parallel fascicles',['Short pennate fascicles packed onto a tendon','A circular sphincter around an opening','Any arrangement because orientation never affects excursion'],'Long parallel fibers can shorten through a greater distance. Pennate architecture often packs more fibers into the same volume and favors force.'],
 [[3],'Third-class lever','The biceps applies force to the radius between the elbow and a load in the hand. Which lever class is illustrated?','Third class',['First class','Second class','No lever because a tendon applies the force'],'A third-class lever places the applied effort between the pivot and the resistance.'],
]);
mc('B','11.1',[
 [[1],'Antagonists','During voluntary knee extension, which role best describes an active knee flexor that helps brake the movement?','Antagonist',['Prime mover of extension','Effort arm of the lever','Passive insertion'],'An antagonist produces a moment opposing the action. It can co-contract and help control the movement.'],
 [[2],'Pennate architecture','A muscle needs high force within limited space. What advantage can pennation provide?','More fibers can fit in parallel onto the tendon',['Every fiber lengthens during a concentric contraction','Long fibers always shorten through a greater distance','The tendon no longer needs a line of pull'],'Pennate packing can increase physiological cross-sectional area, although fiber angle and length affect how force and excursion reach the tendon.'],
 [[3],'Moment arm','Two muscles pull with equal force. At the same joint position, which produces the greater torque?','The one with the larger perpendicular distance from its line of pull to the joint axis',['The one attaching closer to the joint regardless of pull direction','The one with the smaller perpendicular moment arm','Both produce equal torque regardless of line of pull'],'Torque equals force times the perpendicular moment arm. Joint angle can change that moment arm.'],
]);
mc('A','11.2',[
 [[1],'Names and attachments','Which parts of sternocleidomastoid point to its attachments?','Sternum, clavicle and mastoid process',['Scapula, clavicle and mandible','Sternum, coracoid and maxilla','Sacrum, clavicle and mastoid process'],'Sterno-, cleido-, and mastoid refer to the sternum, clavicle, and mastoid process.'],
 [[2],'Names and direction','What information does transversus provide in transversus abdominis?','The general direction of its fibers',['The number of heads','The muscle’s relative size','The muscle’s distal attachment'],'Transversus refers to fibers running broadly across the abdominal wall.'],
]);
mc('B','11.2',[
 [[1],'Names and action','Which feature does extensor describe in extensor digitorum?','An action at the digits',['The number of tendons','The relative muscle size','The orientation of its fascicles'],'Extensor describes a movement that increases joint angle. Digitorum identifies the digits involved.'],
 [[2],'Names and size','What does brevis indicate when two otherwise similarly named muscles are compared?','The shorter member',['The medial member','The member with two heads','The member lying on the opposite side'],'Brevis means short and longus means long. These modifiers distinguish separate muscles.'],
]);
mc('A','11.3',[
 [[1],'Facial expression','What arrangement lets many facial-expression muscles move the skin?','Fibers insert into the skin or its connective tissue',['All fibers insert on the teeth','All fibers insert on the articular disc of the jaw','The muscles attach to the hyoid as their only insertion'],'Many facial-expression muscles insert into skin and move it directly. Jaw closers act on the mandible.'],
 [[2],'Eye movement','Which action is primarily produced by the lateral rectus when the head and gaze start in neutral?','Abduction of the eye',['Adduction of the eye','Elevation of the upper eyelid','Depression of the mandible'],'The lateral rectus draws the eye laterally. The medial rectus draws it medially.'],
 [[3],'Tongue movement','Which extrinsic muscle primarily protrudes the tongue?','Genioglossus',['Styloglossus','Sternohyoid','Masseter'],'Genioglossus protrudes the tongue. Styloglossus retracts and elevates it.'],
 [[4],'Back extensors','What motion can bilateral contraction of the erector spinae produce?','Extension of the vertebral column',['Flexion of the vertebral column as its primary action','Protraction of the mandible','Flexion of the hip by crossing the hip joint'],'The erector spinae lie posterior to the vertebral column and produce extension when they contract bilaterally.'],
]);
mc('B','11.3',[
 [[1],'Mastication','During forceful jaw closure, what action is produced by the masseter?','Elevation of the mandible',['Depression of the mandible','Elevation of the upper eyelid','Retraction of the tongue'],'The masseter elevates the mandible. Its line of pull crosses the temporomandibular joint.'],
 [[3],'Extrinsic tongue muscles','Which statement distinguishes extrinsic tongue muscles from intrinsic tongue muscles?','Extrinsic muscles attach outside the tongue and move the tongue as a whole',['Extrinsic muscles lie entirely within the tongue and only change its shape','Extrinsic muscles only move the eyeball','Intrinsic muscles must insert on the mandible'],'Extrinsic tongue muscles reposition the tongue. Intrinsic muscles primarily alter its shape.'],
 [[3],'Anterior neck muscles','With the mandible stabilized, what can suprahyoid contraction contribute during swallowing?','Elevation of the hyoid',['Depression of the hyoid as a group action','Abduction of the eye','Extension of the vertebral column'],'Suprahyoid muscles help elevate the hyoid during swallowing. Infrahyoids commonly depress or stabilize it.'],
 [[4],'Unilateral neck action','Which motion can right sternocleidomastoid contraction contribute when the head turns horizontally?','Rotation of the face toward the left',['Rotation of the face toward the right only','Extension of the knee','Depression of the mandible as its primary action'],'A single sternocleidomastoid rotates the face to the opposite side and can laterally flex the neck toward its own side.'],
]);
mc('A','11.4',[
 [[1],'Abdominal layers','Which abdominal muscle’s mostly horizontal fibers help compress the abdominal contents?','Transversus abdominis',['Rectus abdominis','Rectus femoris','External intercostal'],'Transversus abdominis is the deepest of the three lateral abdominal layers and helps compress the abdomen.'],
 [[2],'Quiet inspiration','What immediately follows diaphragm contraction during quiet inspiration?','Thoracic volume increases and intrapulmonary pressure falls below atmospheric pressure',['Thoracic volume decreases and air is drawn inward','The abdominal muscles force air out of the lungs','Intrapulmonary pressure rises above atmospheric pressure and draws air inward'],'The contracting diaphragm descends, increasing thoracic volume. Air enters down the resulting pressure gradient.'],
 [[3],'Pelvic diaphragm','Which function is associated with the pelvic diaphragm?','Supporting pelvic organs and resisting rises in abdominal pressure',['Flattening to draw air into the lungs','Flexing the knee','Extending the toes during walking'],'The pelvic diaphragm supports pelvic viscera and helps maintain continence and support during changes in pressure.'],
]);
mc('B','11.4',[
 [[1],'Abdominal rotation','Which pair contributes to rotating the trunk to the left?','Right external oblique and left internal oblique',['Left external oblique and right internal oblique','Right external oblique and right internal oblique acting as an isolated pair','Bilateral rectus femoris'],'External oblique contributes to contralateral trunk rotation. Internal oblique contributes to ipsilateral rotation.'],
 [[2],'Forced expiration','Which muscles help actively reduce thoracic volume during forced expiration?','Abdominal muscles and the interosseous portions of the internal intercostals',['Diaphragm and external intercostals contracting together','Pelvic-floor muscles acting directly on the ribs','Only the sternocleidomastoid muscles'],'Abdominal compression can move the diaphragm superiorly. The interosseous internal intercostals help depress the ribs.'],
 [[3],'Sphincter control','Which structure provides voluntary control of the anal outlet?','External anal sphincter',['Internal anal sphincter','Transversus abdominis','External intercostal'],'The external anal sphincter is skeletal muscle under voluntary control. The internal anal sphincter is smooth muscle.'],
]);
mc('A','11.5',[
 [[1,2],'Scapular protraction','Which muscle protracts the scapula and helps keep its medial border against the thorax?','Serratus anterior',['Rhomboid major','Infraspinatus','Brachialis'],'Serratus anterior draws the scapula around the thorax and helps stabilize it against the rib cage.'],
 [[3,4],'Forearm and hand','Which muscle reaches the distal phalanges of digits 2–5 and flexes their distal interphalangeal joints?','Flexor digitorum profundus',['Flexor digitorum superficialis','Flexor carpi radialis','Pronator teres'],'Profundus inserts distally and crosses the distal interphalangeal joints. Superficialis inserts on the middle phalanges.'],
]);
mc('B','11.5',[
 [[3],'Forearm rotation','With the elbow flexed, which muscle can turn the forearm into supination while also flexing the elbow?','Biceps brachii',['Brachialis','Pronator teres','Triceps brachii'],'Biceps brachii flexes the elbow and can supinate the forearm. Supination occurs at the radioulnar joints.'],
]);
mc('A','11.6',[
 [[1],'Hip stability','While standing on the right leg, which muscle helps keep the left side of the pelvis from dropping?','Right gluteus medius',['Right adductor longus','Left tibialis anterior','Right soleus'],'The stance-side hip abductors create a moment that counters the tendency of the opposite side of the pelvis to drop.'],
]);
mc('B','11.6',[
 [[2],'Hamstring joint crossings','Which component can flex the knee without directly extending the hip?','Short head of biceps femoris',['Semitendinosus','Semimembranosus','Long head of biceps femoris'],'The short head originates on the femur and crosses the knee but does not cross the hip.'],
 [[3],'Lower-leg compartments','A person struggles to lift the forefoot toward the shin. Which muscle normally contributes directly to that movement?','Tibialis anterior',['Soleus','Gastrocnemius','Fibularis longus'],'Tibialis anterior dorsiflexes the ankle. Soleus and gastrocnemius plantarflex. Fibularis longus everts and assists plantarflexion.'],
]);

visual('A','10.1',[1],'Tissue micrograph','micro-skeletal','Which muscle tissue is shown in this micrograph?','Skeletal muscle','The long parallel fibers have visible cross-striations and peripheral nuclei.',['Skeletal muscle tissue','Skeletal']);
visual('B','10.1',[1],'Tissue micrograph','micro-smooth','Which muscle tissue is shown in this micrograph?','Smooth muscle','The cells have elongated central nuclei and lack the regular cross-striations of skeletal muscle.',['Smooth muscle tissue','Smooth']);
visual('A','10.2',[1],'Whole-muscle covering','cover-epimysium','Name the connective tissue at the ringed point.','Epimysium','This connective tissue surrounds the entire muscle.');
visual('B','10.2',[1],'Fascicle covering','cover-perimysium','Name the connective tissue at the ringed point.','Perimysium','This connective tissue encloses a bundle of muscle fibers called a fascicle.');
visual('A','10.3',[1,2],'Calcium-binding protein','calcium-troponin','Name the ringed regulatory protein that binds calcium.','Troponin','Calcium binds troponin, shifting tropomyosin and allowing myosin to bind actin.',['Troponin complex','Troponin C','TnC']);
visual('B','10.3',[1,2],'Calcium storage','calcium-reticulum','Name the ringed organelle that stores calcium.','Sarcoplasmic reticulum','During relaxation, pumps move calcium back into the sarcoplasmic reticulum.',['SR','Terminal cisterna','Terminal cisternae','Terminal cisterna of the sarcoplasmic reticulum']);
visual('A','10.4',[3],'Single-twitch phases','muscle-task:twitch','Name phase 1 on the twitch graph.','Latent period','The latent period lies between the stimulus and the start of measurable tension.',['Latent phase','Latency period','Latency']);
visual('B','10.4',[4],'Tension plateau','muscle-force:fused','Name the contraction pattern in the graph, using the most specific term.','Fused tetanus','Repeated stimulation is frequent enough to prevent appreciable relaxation between contractions.',['Complete tetanus','Fused tetanic contraction','Complete tetanic contraction']);
anatomy('A','11.3',[1],'masseter');
anatomy('B','11.3',[3,4],'sternocleidomastoid');
anatomy('A','11.4',[1],'internal-oblique');
anatomy('B','11.4',[3],'pubococcygeus');
anatomy('A','11.5',[2],'infraspinatus');
anatomy('A','11.5',[3],'pronator-teres');
anatomy('B','11.5',[4],'palmar-interossei');
anatomy('A','11.6',[3],'soleus');
anatomy('B','11.6',[2],'rectus-femoris');
anatomy('B','11.6',[4],'flexor-digitorum-brevis');

claim('A','10.8',[3,4],'Smooth muscle coupling','In single-unit smooth muscle, excitation can spread from one cell to neighboring cells through gap junctions.','True','Explain that gap junctions electrically couple neighboring cells so their activity can coordinate.','Gap junctions allow ionic current to spread, coordinating contraction.','Each cell must receive an entirely independent nerve input.');
claim('B','10.8',[3],'Smooth muscle activation','In smooth muscle, calcium binds troponin to initiate contraction.','False','Explain that calcium binds calmodulin, which activates myosin light-chain kinase.','Calcium binds calmodulin and activates MLCK.','Calcium binds troponin on smooth muscle thin filaments.');
claim('A','10.9',[1,3],'Skeletal repair','Satellite cells can contribute to the repair of a damaged skeletal muscle fiber.','True','Explain that activated satellite cells proliferate and can fuse with damaged fibers or contribute to new fibers.','Satellite cells activate and proliferate, then can fuse with damaged fibers to help repair them.','Satellite cells are only connective tissue cells that secrete collagen.');
claim('B','10.9',[2,3],'Cardiac repair','Fibrosis after substantial cardiac muscle damage restores the lost contractile cells.','False','Explain that fibrous scar tissue replaces damaged tissue and does not recreate contractile cardiomyocytes.','Collagen-rich scar replaces the dead cells without restoring contractile cardiac muscle.','The scar develops contractile sarcomeres and replaces all lost muscle function.');
claim('A','11.1',[1],'Muscle line of pull','A muscle can actively push a bone to produce motion at a joint.','False','Explain that contracting muscle pulls through its attachments. Opposing movements can be produced by muscles that pull in different directions.','An active muscle generates tension and pulls through its attachments. Antagonists can pull in the other direction.','A contracting muscle pushes through its tendon when it shortens.');
claim('B','11.1',[3],'Lever mechanics','If muscle force stays the same, increasing the perpendicular moment arm increases torque at the joint.','True','Relate torque to muscle force times its perpendicular moment arm.','Torque equals the force multiplied by the perpendicular moment arm, so a longer arm increases torque.','Torque equals force divided by the moment arm, so it decreases.');

written('A','10.3',[1,2],'Complete ATP depletion','A skeletal fiber has active cross-bridges when its ATP supply is completely depleted. Explain what happens to myosin detachment, repeated cycling, and calcium reuptake.',
 'ATP binding is required for myosin detachment. With no ATP, attached heads stay bound and repeated cycling cannot continue. ATP-dependent calcium reuptake into the sarcoplasmic reticulum also fails, impairing relaxation.',[
  ['Myosin detachment','Connect failure of detachment to the need for ATP binding.',1],
  ['Cross-bridge cycling','Explain why repeated normal cycling cannot continue without ATP.',1],
  ['Calcium and relaxation','Connect loss of ATP-driven SR calcium uptake with impaired relaxation.',1],
 ],{fixtures:[
  ['ATP binding normally releases myosin. With none, myosin remains attached and cannot cycle again. The SR calcium pump also fails, so calcium stays elevated and relaxation is impaired.',[1,1,1]],
  ['Myosin needs ATP to release actin, so it stays bound.',[1,0,0]],
  ['No ATP makes myosin release immediately, cross-bridges keep cycling, and calcium pumps faster.',[0,0,0]],
 ]});
written('B','10.3',[1,2],'Calcium and relaxation','A stimulus triggers a normal skeletal muscle twitch. Explain how released calcium permits cross-bridge formation and how calcium reuptake stops new cross-bridges.',
 'Calcium released from the sarcoplasmic reticulum binds troponin. Tropomyosin moves away from the binding sites on actin, so myosin can attach. ATP-powered pumps lower cytosolic calcium, troponin releases it, and tropomyosin re-covers the sites.',[
  ['Calcium signal','Identify calcium release from the sarcoplasmic reticulum and binding to troponin.',1],
  ['Binding sites','Explain that shifting tropomyosin uncovers actin sites for myosin.',1],
  ['Relaxation','Connect calcium reuptake to falling cytosolic calcium and re-covering the binding sites.',1],
 ],{fixtures:[
  ['SR calcium binds troponin, shifting tropomyosin so myosin can bind actin. Pumping calcium back into the SR lowers cytosolic calcium, and tropomyosin covers the sites again.',[1,1,1]],
  ['The sarcoplasmic reticulum releases calcium that binds troponin.',[1,0,0]],
  ['Calcium comes out of the mitochondria and binds myosin. Tropomyosin stays fixed. Calcium leaves the SR to end the twitch.',[0,0,0]],
 ]});
written('A','11.6',[2],'Quadriceps and joint crossings','Explain how the quadriceps extend the knee. Name all four muscles and explain why only one of them also contributes to hip flexion.',
 'Rectus femoris, vastus lateralis, vastus medialis, and vastus intermedius extend the knee. Rectus femoris crosses the hip as well as the knee and can flex the hip. The vasti originate on the femur and cross only the knee.',[
  ['Rectus femoris','Name rectus femoris.',0.5],['Vastus lateralis','Name vastus lateralis.',0.5],
  ['Vastus medialis','Name vastus medialis.',0.5],['Vastus intermedius','Name vastus intermedius.',0.5],
  ['Joint crossings','State that all extend the knee and only rectus femoris crosses and flexes the hip.',1],
 ],{fixtures:[
  ['Rectus femoris, vastus lateralis, vastus medialis and vastus intermedius all extend the knee. Rectus femoris also crosses the hip and flexes it; the vasti only cross the knee.',[.5,.5,.5,.5,1]],
  ['Rectus femoris and vastus lateralis are two of the muscles.',[.5,.5,0,0,0]],
  ['Biceps femoris, sartorius, semitendinosus and soleus all flex the knee and cross the hip.',[0,0,0,0,0]],
 ]});
written('B','11.5',[2],'Rotator cuff','Name the four muscles of the rotator cuff and explain how their tendons contribute to shoulder stability during motion.',
 'Supraspinatus, infraspinatus, teres minor, and subscapularis form the rotator cuff. Their tendons blend with the glenohumeral capsule and help keep the humeral head centered in the glenoid during movement.',[
  ['Supraspinatus','Name supraspinatus.',0.5],['Infraspinatus','Name infraspinatus.',0.5],
  ['Teres minor','Name teres minor.',0.5],['Subscapularis','Name subscapularis.',0.5],
  ['Stabilization','Explain that the cuff dynamically stabilizes the glenohumeral joint by centering or holding the humeral head against the glenoid.',1],
 ],{fixtures:[
  ['Supraspinatus, infraspinatus, teres minor and subscapularis help center the humeral head in the glenoid as the arm moves.',[.5,.5,.5,.5,1]],
  ['Supraspinatus, infraspinatus, teres major and subscapularis.',[.5,.5,0,.5,0]],
  ['Pectoralis major, deltoid, biceps and latissimus dorsi are cuff muscles that extend the elbow.',[0,0,0,0,0]],
 ]});

export const mockExam4Calibration=[];
export const mockExam4Forms=Object.fromEntries(Object.entries(bank).map(([letter,rows])=>{
 const questions=rows.sort((a,b)=>sectionFor[a.section]-sectionFor[b.section]).map(({fixtures,...question},i)=>{
  for(const [j,[response,points]] of (fixtures||[]).entries())mockExam4Calibration.push({
   id:question.id+'-sample-'+(j+1),questionId:question.id,response,
   expectedPoints:Object.fromEntries(question.rubric.criteria.map((criterion,k)=>[criterion.id,points[k]]))
  });
  return {...question,number:i+1};
 });
 return [letter,{id:'exam4-form-'+letter.toLowerCase(),version:MOCK_EXAM4_VERSION,title:'Exam 4 · Form '+letter,questions}];
}));
export const mockExam4Questions=Object.values(mockExam4Forms).flatMap(form=>form.questions);
export function mockExam4Related(id){
 const item=mockExam4Questions.find(q=>q.id===id);
 if(!item)return [];
 return mockExam4Questions.filter(q=>q.id!==id&&q.id.slice(0,8)!==id.slice(0,8)&&q.lesson===item.lesson&&q.objectives.some(o=>item.objectives.includes(o)))
  .sort((a,b)=>Number(b.topic===item.topic)-Number(a.topic===item.topic)||Number(b.section===item.section)-Number(a.section===item.section));
}
