import {muscleFigureTargets} from './muscle-figure-targets.js';
import {chapter11Muscles} from './chapter11-muscles.js';

import {mockExam4Questions as legacyQuestions,mockExam4Calibration as legacyCalibration} from './mock-exam4-legacy.js';
import {QUIZ_SHOW_VERSION,mockExam4QuizShowForm,quizShowReplacements} from './mock-exam4-quiz-show.js';
import {mockExam4Alignment,mockExam4CourseRevision,mockExam4ReviewLinks} from './mock-exam4-alignment.js';
import {mockExam4MatchingPlates} from './mock-exam4-figures.js';
import {mockExam4FormC,mockExam4FormCCalibration} from './mock-exam4-form-c.js';

const revisionTwoVersion='2026-11-16.1';
const revisionFourVersion='2026-11-19.2';
export const MOCK_EXAM4_VERSION='2026-11-19.3';
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
 const id='exam4-'+form.toLowerCase()+'-r2-'+(bank[form].length+1);
 const url='https://openstax.org/books/anatomy-and-physiology-2e/pages/'+lesson.replace('.','-')+'-'+sectionSlugs[lesson];
 bank[form].push({
  id,chapter:Number(lesson.split('.')[0]),lesson,topic,type,section,points,prompt,answer,explanation,
  contentVersion:revisionTwoVersion,objectives:objectives.map(n=>lesson+'.'+n),
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
 const id='exam4-'+form.toLowerCase()+'-r2-'+(bank[form].length+1);
 const rubric={id:id+'-rubric',version:revisionTwoVersion,criteria:criteria.map(([label,description,points],i)=>({id:'criterion-'+(i+1),label,description,points}))};
 add(form,lesson,objectives,topic,'written',claim?'tf':'written',claim?2:3,prompt,answer,answer,{rubric,...(claim?{claim}:{}),fixtures});
}
mc("A","10.2",[
 [[1, 2], "Force transmission", "Which sequence traces force from a muscle fiber to its bony attachment?", "Fiber connective tissue → tendon → bone", ["Fiber → motor neuron → bone", "Fiber → joint cartilage → tendon", "Fiber → synaptic cleft → bone"], "Intramuscular connective tissue transmits tension to the tendon and on to the attachment."]
]);
mc("A","10.2",[
 [[4], "Sodium and potassium channels", "After threshold is reached in a skeletal muscle membrane, what contributes most directly to repolarization?", "Potassium leaves through voltage-gated channels", ["Sodium enters through voltage-gated channels", "Calcium leaves the sarcoplasmic reticulum", "Acetylcholine enters the motor neuron"], "Sodium entry drives rapid depolarization. Potassium exit contributes to repolarization."]
]);
mc("A","10.2",[
 [[2], "Skeletal muscle functions", "Which observation illustrates a function of skeletal muscle besides producing joint movement?", "Shivering raises heat production", ["Intercalated discs synchronize heart cells", "Peristalsis propels food down the intestine", "Smooth muscle adjusts arteriole diameter"], "Skeletal muscle contractions generate heat. Skeletal muscle also supports posture and soft tissues and helps control body openings."]
]);
mc("A","10.3",[
 [[1, 3], "Sliding filaments", "Which change occurs as a skeletal sarcomere shortens?", "Its Z discs move closer together", ["Its thick filaments shorten", "Its thin filaments lengthen", "Its A band becomes narrower"], "Filaments slide past each other. The A band stays about the same width as the I band and H zone narrow."]
]);
mc("A","10.3",[
 [[2], "Immediate ATP supply", "What regenerates ATP rapidly in the first seconds of a sudden maximal effort?", "Phosphate transfer from creatine phosphate to ADP", ["Oxygen binding directly to ADP", "Glucose storage as glycogen", "Calcium binding to troponin"], "Creatine kinase transfers a phosphate from creatine phosphate to ADP. Other energy pathways can contribute concurrently."]
]);
mc("A","10.3",[
 [[1, 2], "Calcium regulation", "If calcium release is blocked while ATP remains available, what limits skeletal muscle contraction?", "Tropomyosin continues to obstruct most myosin-binding sites on actin", ["Myosin is unable to hydrolyze any ATP", "Actin filaments disappear from the I band", "ATP cannot bind to any myosin heads"], "Without enough calcium binding to troponin, tropomyosin continues to obstruct myosin-binding sites."]
]);
mc("A","10.4",[
 [[1], "Contraction under load", "During the controlled lowering phase of a biceps curl, what is the active elbow flexor doing?", "Lengthening while generating tension", ["Shortening while generating tension", "Holding its length constant as the elbow angle changes", "Releasing all tension while the weight descends"], "An eccentric contraction produces tension as an active muscle lengthens under load."]
]);
mc("A","10.4",[
 [[2], "Length–tension", "Why does a greatly overstretched sarcomere generate less active force?", "Fewer thick and thin filaments overlap sufficiently to form cross-bridges", ["Myosin filaments become longer than the sarcomere", "The stimulus frequency automatically falls", "Recruitment of neighboring motor units is required to restore overlap"], "Active force depends on the number of possible cross-bridges at the starting length."]
]);
mc("A","10.4",[
 [[4], "Motor units", "Why do small motor units support precise movements?", "Each added unit changes force by a smaller amount", ["Each action potential becomes smaller", "Each unit contains more fibers", "Each fiber changes its action potential amplitude to match the target"], "With fewer fibers per motor neuron, recruitment adjusts force in smaller increments."]
]);
mc("A","10.5",[
 [[1, 2], "Slow oxidative fibers", "Which profile favors repeated low-force activity for a long period?", "Many mitochondria, abundant myoglobin and high fatigue resistance", ["Few mitochondria, low myoglobin and rapid fatigue", "High glycolytic reliance and poor capillary supply", "Rapid fatigue with no appreciable aerobic capacity"], "Slow oxidative fibers sustain force through substantial oxidative capacity and oxygen delivery."]
]);
mc("A","10.5",[
 [[1, 2], "Fast glycolytic fibers", "Which fiber type is best suited to a brief, high-power effort with limited fatigue resistance?", "Fast glycolytic", ["Slow oxidative", "Fast oxidative-glycolytic only", "Single-unit smooth muscle"], "Fast glycolytic fibers contract rapidly, rely heavily on glycolysis and fatigue comparatively quickly."]
]);
mc("A","10.6",[
 [[1, 2], "Resistance training", "A muscle enlarges after repeated high-resistance exercise. What change primarily explains the enlargement?", "Existing fibers add contractile proteins and increase cross-sectional area", ["Existing fibers are replaced by cardiac muscle", "All motor neurons begin generating larger action potentials", "Every existing fiber divides into two mature fibers"], "Resistance training chiefly enlarges existing fibers by adding contractile proteins and myofibrils."]
]);
mc("A","10.4",[
 [[4], "Summation and tetanus", "Repeated stimuli arrive before a skeletal fiber fully relaxes. What can happen as frequency rises?", "Twitch tensions sum and can fuse into tetanus", ["The fiber recruits other motor neurons", "Each action potential becomes proportionally larger", "The A band progressively shortens"], "Residual cytosolic calcium supports additional cross-bridge activity. At sufficiently high frequency, appreciable relaxation disappears."]
]);
mc("A","10.7",[
 [[1], "Cardiac electrical coupling", "Which part of an intercalated disc lets ionic current spread between adjacent cardiomyocytes?", "Gap junctions", ["Desmosomes", "Motor end plates", "Dense bodies"], "Gap junctions provide low-resistance paths for current between neighboring cardiac cells."]
]);
mc("A","10.7",[
 [[1, 2], "Cardiac coordination", "Why is a long cardiac refractory period important for pumping?", "It prevents sustained tetanus and allows relaxation between beats", ["It allows many twitches to fuse into sustained contraction", "It makes desmosomes open to conduct current", "It allows contraction without calcium"], "Long refractoriness helps prevent tetanic fusion so cardiac muscle can relax and the chambers can refill."]
]);
mc("A","10.1",[
 [[2], "Muscle properties", "Which property allows a skeletal muscle to be stretched without injury within its normal range?", "Extensibility", ["Excitability", "Contractility", "Conductivity"], "Extensibility permits stretch. Contractility describes active tension development, and excitability describes response to stimulation."]
]);
mc("A","10.8",[
 [[1, 3], "Smooth muscle anchors", "Which structures anchor thin filaments and transmit tension through a smooth muscle cell?", "Dense bodies", ["Z discs organized into sarcomeres", "Motor end plates", "Intercalated discs"], "Dense bodies anchor actin and connect with intermediate filaments, distributing tension through smooth muscle."]
]);
mc("A","10.8",[
 [[2, 4], "Coordinated visceral contraction", "Why can single-unit smooth muscle in the intestinal wall contract in a coordinated wave?", "Gap junctions allow excitation to spread between neighboring cells", ["Every cell requires a separate skeletal motor end plate", "Its cells are joined by tendons that conduct action potentials", "Its contractile filaments form skeletal sarcomeres"], "Electrical coupling supports coordinated activity in single-unit smooth muscle. Multiunit smooth muscle has less electrical coupling and allows more independent control."]
]);
mc("A","10.9",[
 [[1, 3], "Skeletal muscle repair", "Which cells can activate, multiply, and fuse with damaged skeletal muscle fibers during repair?", "Satellite cells", ["Mature red blood cells", "Osteoclasts", "Cardiac pacemaker cells"], "Satellite cells are muscle stem cells involved in limited skeletal muscle repair. Mature fibers have limited capacity for division."]
]);
mc("A","11.3",[
 [[4], "Sternocleidomastoid attachments", "A muscle arises from the sternum and medial clavicle and inserts on the mastoid process. Which muscle is it?", "Sternocleidomastoid", ["Trapezius", "Masseter", "Sternohyoid"], "Sternocleidomastoid connects the sternum and clavicle to the mastoid process. Unilateral contraction can rotate the face to the opposite side."]
]);
bank.A.at(-1).attachmentKey="scm";
mc("A","11.5",[
 [[4], "Distinguishing finger flexor attachments", "Which attachment and action combination correctly identifies flexor digitorum superficialis?", "Medial epicondyle and other forearm origins → middle phalanges → proximal interphalangeal flexion", ["Ulna and interosseous membrane → distal phalanges → distal interphalangeal flexion", "Lateral epicondyle → extensor expansions → finger extension", "Radius → first metacarpal → thumb opposition"], "Flexor digitorum superficialis reaches the middle phalanges of digits 2–5. Flexor digitorum profundus arises mainly from ulna/interosseous membrane and reaches the distal phalanges. The lab table combines clues from these two muscles, so review both accurate patterns."]
]);
bank.A.at(-1).attachmentKey="finger-flexors";
bank.A.at(-1).sourceLinks.push(
 {url:'https://www.lumen.luc.edu/lumen/meded/grossanatomy/dissector/mml/fds.htm',label:'Loyola anatomy · flexor digitorum superficialis'},
 {url:'https://www.lumen.luc.edu/lumen/meded/grossanatomy/dissector/mml/fdp.htm',label:'Loyola anatomy · flexor digitorum profundus'},
);
mc("A","11.4",[
 [[1], "Rectus abdominis attachments", "A muscle runs from the pubis to the xiphoid process and costal cartilages of ribs 5–7. Which action follows from these attachments?", "Flexion of the trunk", ["Extension of the knee", "Abduction of the thigh", "Elevation of the mandible"], "Rectus abdominis connects the anterior pelvis to the anterior thorax. It flexes the trunk and compresses the abdominal contents."]
]);
bank.A.at(-1).attachmentKey="rectus-abdominis";
mc("A","11.5",[
 [[2], "Latissimus dorsi insertion", "Latissimus dorsi passes from the lower back toward the proximal humerus. Which combination fits its insertion and major actions?", "Intertubercular sulcus of humerus; arm extension, adduction, and medial rotation", ["Olecranon of ulna; elbow extension", "Radial tuberosity; elbow flexion and supination", "Coracoid process; scapular protraction only"], "Its humeral attachment permits latissimus dorsi to move the arm at the shoulder. Its actions include extension, adduction, and medial rotation."]
]);
bank.A.at(-1).attachmentKey="latissimus-dorsi";
mc("A","11.6",[
 [[1], "Gluteus maximus attachments", "A powerful muscle arises from the posterior ilium and sacrum and attaches to the iliotibial tract and gluteal tuberosity. Which muscle is it?", "Gluteus maximus", ["Gluteus medius", "Rectus femoris", "Adductor longus"], "Gluteus maximus extends and laterally rotates the thigh. Its attachments include the gluteal tuberosity and iliotibial tract."]
]);
bank.A.at(-1).attachmentKey="gluteus-maximus";
mc("A","11.1",[
 [[1], "Fixator action", "During elbow flexion, a scapular muscle holds the scapula steady. Which role does it play in this task?", "Fixator", ["Prime mover of elbow flexion", "Antagonist of elbow flexion", "Insertion of the elbow flexor"], "A fixator stabilizes an attachment or supporting segment while the prime mover performs the action."]
]);
mc("A","11.1",[
 [[2], "Fascicle arrangement", "With comparable muscle volume, which arrangement generally favors greater shortening excursion?", "Long, mostly parallel fascicles", ["Short pennate fascicles packed onto a tendon", "A circular sphincter around an opening", "Any arrangement because orientation never affects excursion"], "Long parallel fibers can shorten through a greater distance. Pennate architecture often packs more fibers into the same volume and favors force."]
]);
mc("A","11.2",[
 [[2], "Names and direction", "What information does transversus provide in transversus abdominis?", "The general direction of its fibers", ["The number of heads", "The muscle’s relative size", "The muscle’s distal attachment"], "Transversus refers to fibers running broadly across the abdominal wall."]
]);
mc("A","11.3",[
 [[3], "Tongue actions", "Which listed tongue muscle depresses the tongue?", "Hyoglossus", ["Styloglossus", "Masseter", "Temporalis"], "Hyoglossus depresses the tongue. Styloglossus retracts and elevates it. Both appear on the required muscle list."]
]);
mc("A","11.4",[
 [[2], "Quiet inspiration", "What immediately follows diaphragm contraction during quiet inspiration?", "Thoracic volume increases and intrapulmonary pressure falls below atmospheric pressure", ["Thoracic volume decreases and air is drawn inward", "The abdominal muscles force air out of the lungs", "Intrapulmonary pressure rises above atmospheric pressure and draws air inward"], "The contracting diaphragm descends, increasing thoracic volume. Air enters down the resulting pressure gradient."]
]);
mc("A","11.4",[
 [[3], "Pelvic diaphragm", "Which function is associated with the pelvic diaphragm?", "Supporting pelvic organs and resisting rises in abdominal pressure", ["Flattening to draw air into the lungs", "Flexing the knee", "Extending the toes during walking"], "The pelvic diaphragm supports pelvic viscera and helps maintain continence and support during changes in pressure."]
]);
mc("B","10.2",[
 [[1], "Muscle packaging", "Which layer encloses an individual skeletal muscle fiber?", "Endomysium", ["Epimysium", "Perimysium", "Periosteum"], "Endomysium surrounds individual fibers. Perimysium surrounds fascicles and epimysium encloses the muscle."]
]);
mc("B","10.2",[
 [[4], "Neuromuscular junction", "Acetylcholine is released normally, but its receptors at the motor end plate cannot open. What is the immediate effect?", "The end-plate depolarization is reduced", ["Potassium channels at the nerve terminal open more quickly", "The sarcoplasmic reticulum releases more calcium directly", "Cross-bridges detach before the end-plate potential changes"], "Opening motor end-plate receptors produces a net inward cation current. Blocking that step weakens the end-plate potential."]
]);
mc("B","10.2",[
 [[4], "T-tubule signaling", "A surface action potential occurs, but propagation along T-tubules fails. What changes first inside the fiber?", "Sarcoplasmic-reticulum calcium release becomes impaired", ["Troponin begins pumping calcium into the reticulum", "Myosin immediately releases acetylcholine", "The deep myofibrils receive a stronger excitation signal"], "T-tubules convey excitation into the fiber so the nearby sarcoplasmic reticulum releases calcium throughout it."]
]);
mc("B","10.3",[
 [[3], "Sarcomere bands", "Which region is approximately unchanged in width during ordinary sarcomere shortening?", "A band", ["I band", "H zone", "Distance between adjacent Z discs"], "The A band corresponds to the length of the thick filaments. Thin filaments slide inward without shortening the thick filaments."]
]);
mc("B","10.3",[
 [[2], "ATP yield", "Which comparison specifically concerns ATP yield per glucose molecule?", "Aerobic respiration yields more ATP per glucose than glycolysis alone", ["Glycolysis yields more ATP because it can run rapidly", "Creatine phosphate yields more ATP per glucose than either pathway", "Oxygen changes ATP production rate but never yield"], "Aerobic metabolism oxidizes fuel more completely. ATP yield per glucose and rate of ATP regeneration are distinct measures."]
]);
mc("B","10.3",[
 [[1, 2], "Relaxation", "If the skeletal muscle calcium pump stops while the fiber still has ATP for cross-bridge cycling, what effect is expected?", "Cytosolic calcium remains elevated longer and relaxation is delayed", ["Calcium clears faster and the fiber relaxes sooner", "Myosin stops binding ATP as a direct consequence", "Tropomyosin exposes fewer sites while calcium remains high"], "ATP-dependent calcium uptake into the sarcoplasmic reticulum normally lowers cytosolic calcium after excitation."]
]);
mc("B","10.4",[
 [[1], "Isometric contraction", "A learner holds a weight motionless with the elbow at 90 degrees. What describes the elbow flexors?", "They generate tension with no appreciable change in length", ["They actively shorten as the joint angle stays fixed", "They produce no tension while the load is stationary", "They lengthen steadily as they lift the weight"], "During an isometric hold, active tension balances the load while muscle–tendon length and joint position remain approximately constant."]
]);
mc("B","10.4",[
 [[2], "Length–tension", "Which starting length usually gives the greatest active tension in a skeletal sarcomere?", "An intermediate length with favorable filament overlap", ["The shortest possible length, with maximal filament crowding", "The longest possible length, with no overlap", "Any length once the action potential reaches threshold"], "An intermediate length allows many productive cross-bridges without excessive crowding or loss of overlap."]
]);
mc("B","10.4",[
 [[3, 4], "Temporal summation", "A second stimulus arrives before the fiber relaxes from the first. Why can the second tension peak be higher?", "Residual cytosolic calcium supports additional cross-bridge activity", ["The second action potential is larger than the first", "The second stimulus permanently lengthens the thick filaments", "More motor units must be recruited within that single fiber"], "Residual calcium and incomplete relaxation allow force to summate in the stimulated fiber."]
]);
mc("B","10.5",[
 [[1, 2], "Fast oxidative fibers", "Which profile best fits fast oxidative-glycolytic skeletal fibers?", "Relatively fast contraction with both oxidative and glycolytic ATP production", ["Slow contraction with almost no mitochondrial ATP production", "Fast contraction with almost no oxidative capacity", "No striations and a dependence on calmodulin alone"], "Fast oxidative-glycolytic fibers are relatively fast and have more oxidative support than fast glycolytic fibers."]
]);
mc("B","10.5",[
 [[1, 2], "Fiber mixtures", "Two skeletal muscles contain different proportions of fiber types. What does this imply?", "Their fatigue resistance and speed can differ even though both contain mixed fiber populations", ["Every fiber in either muscle has identical properties", "Both muscles must fatigue at the same rate", "One muscle must contain cardiac fibers to resist fatigue"], "Whole skeletal muscles contain fiber mixtures suited to their functional demands."]
]);
mc("B","10.6",[
 [[2], "Endurance training", "Which cellular change would help trained muscle sustain aerobic activity?", "Greater mitochondrial capacity and improved capillary supply", ["Loss of mitochondria and decreased blood supply", "Replacement of myofibrils with noncontractile scar tissue", "A permanent rise in single-fiber action-potential amplitude"], "Endurance training improves oxygen delivery and oxidative ATP production."]
]);
mc("B","10.6",[
 [[1], "Disuse atrophy", "Which change best explains weakness after a limb is immobilized for several weeks?", "Reduced fiber size and loss of contractile protein from disuse", ["New skeletal fibers crowding out existing fibers", "Greater fiber size due to passive rest", "A permanent increase in mitochondrial volume in every fiber"], "Disuse atrophy reduces fiber size and contractile capacity."]
]);
mc("B","10.7",[
 [[2], "Cardiac mechanical coupling", "What is the primary role of desmosomes at intercalated discs?", "They help prevent cells from pulling apart during contraction", ["They carry most electrical current between adjacent cells", "They bind calcium to uncover myosin sites", "They pump calcium back into the sarcoplasmic reticulum"], "Desmosomes mechanically attach adjacent cardiomyocytes, while gap junctions couple them electrically."]
]);
mc("B","10.7",[
 [[1], "Cardiac pumping", "If a ventricular contraction ended too soon to sustain ejection pressure, what is the most direct concern?", "Less blood could be ejected during that beat", ["The chamber would eject more blood because pressure ended earlier", "The atrium would be unable to receive blood at any time", "Every cardiac cell would fuse into a skeletal motor unit"], "Ventricular ejection requires pressure sufficient to drive blood through the outflow valve for part of the beat."]
]);
mc("B","10.1",[
 [[1, 2], "Muscle tissue properties", "Which feature is shared by skeletal, cardiac, and smooth muscle?", "Actin and myosin interact to generate tension", ["Every cell is voluntary", "All have visible sarcomeres", "Every cell has many peripheral nuclei"], "All three muscle tissues generate tension through actin and myosin. Their control, arrangement, and cell shapes differ."]
]);
mc("B","10.2",[
 [[3], "Fiber organization", "Which structure is one skeletal muscle cell?", "Muscle fiber", ["Fascicle", "Myofibril", "Whole muscle"], "A muscle fiber is a cell containing many myofibrils. A fascicle is a bundle of fibers."]
]);
mc("B","10.8",[
 [[3, 4], "Single-unit and multiunit muscle", "Which arrangement best supports independently controlled smooth muscle activity in the iris?", "Multiunit cells with relatively independent neural control", ["A single skeletal motor unit supplying every cell", "Strong electrical coupling that forces every cell to contract together", "Cardiomyocytes connected by intercalated discs"], "Multiunit smooth muscle permits finer independent control than strongly coupled single-unit visceral muscle."]
]);
mc("B","10.9",[
 [[2, 3], "Cardiac repair", "After substantial cardiac muscle injury, fibrous scar tissue chiefly does what?", "Replaces damaged tissue without restoring the lost contractile cardiomyocytes", ["Produces new sarcomeres equivalent to the lost heart cells", "Turns into motor end plates", "Creates additional skeletal motor units"], "Fibrosis supplies collagen-rich connective tissue. It does not restore the original contractile muscle cells."]
]);
mc("B","11.3",[
 [[1], "Temporalis attachments", "A muscle arises in the temporal fossa and inserts on the coronoid process of the mandible. Which muscle is it?", "Temporalis", ["Masseter", "Orbicularis oris", "Sternocleidomastoid"], "Temporalis elevates the mandible, and its posterior fibers can retract it. Its tendon reaches the coronoid process."]
]);
bank.B.at(-1).attachmentKey="temporalis";
mc("B","11.6",[
 [[3], "Long toe flexor attachments", "Which muscle arises from the posterior tibia and sends tendons to the plantar bases of the distal phalanges of toes 2–5?", "Flexor digitorum longus", ["Extensor digitorum longus", "Flexor digitorum brevis", "Tibialis anterior"], "Flexor digitorum longus flexes the lateral four toes and assists plantar flexion. Flexor digitorum brevis reaches the middle phalanges."]
]);
bank.B.at(-1).attachmentKey="flexor-digitorum-longus";
mc("B","11.6",[
 [[2], "Rectus femoris joint crossings", "Rectus femoris originates on the ilium and reaches the tibial tuberosity through the quadriceps tendon, patella, and patellar ligament. Which pair of actions can it produce?", "Hip flexion and knee extension", ["Hip extension and knee flexion", "Hip adduction and ankle dorsiflexion", "Knee flexion and toe extension"], "Rectus femoris crosses the hip and knee. Its pelvic origin permits hip flexion, while the quadriceps extensor mechanism produces knee extension."]
]);
bank.B.at(-1).attachmentKey="rectus-femoris";
mc("B","11.5",[
 [[2], "Deltoid attachments", "A muscle originates from the lateral clavicle, acromion, and spine of the scapula. Where do its fibers insert?", "Deltoid tuberosity of humerus", ["Radial tuberosity", "Coronoid process of mandible", "Tibial tuberosity"], "Deltoid inserts on the humerus. Its middle fibers abduct the arm, while anterior and posterior fibers have additional actions."]
]);
bank.B.at(-1).attachmentKey="deltoid";
mc("B","11.5",[
 [[2], "Pectoralis major attachments", "Which muscle passes from the clavicle and anterior thorax to the proximal humerus and can adduct and medially rotate the arm?", "Pectoralis major", ["Pectoralis minor", "Serratus anterior", "Brachialis"], "Pectoralis major attaches to the humerus at the lateral lip of the intertubercular sulcus. Pectoralis minor attaches to the scapula and acts chiefly on the shoulder girdle."]
]);
bank.B.at(-1).attachmentKey="pectoralis-major";
mc("B","11.1",[
 [[1], "Antagonists", "During voluntary knee extension, which role best describes an active knee flexor that helps brake the movement?", "Antagonist", ["Prime mover of extension", "Effort arm of the lever", "Passive insertion"], "An antagonist produces a moment opposing the action. It can co-contract and help control the movement."]
]);
mc("B","11.1",[
 [[2], "Pennate architecture", "A muscle needs high force within limited space. What advantage can pennation provide?", "More fibers can fit in parallel onto the tendon", ["Every fiber lengthens during a concentric contraction", "Long fibers always shorten through a greater distance", "The tendon no longer needs a line of pull"], "Pennate packing can increase physiological cross-sectional area, although fiber angle and length affect how force and excursion reach the tendon."]
]);
mc("B","11.2",[
 [[1], "Names and action", "Which feature does extensor describe in extensor digitorum?", "An action at the digits", ["The number of tendons", "The relative muscle size", "The orientation of its fascicles"], "Extensor describes a movement that increases joint angle. Digitorum identifies the digits involved."]
]);
mc("B","11.3",[
 [[3], "Anterior neck muscles", "With the mandible stabilized, what can suprahyoid contraction contribute during swallowing?", "Elevation of the hyoid", ["Depression of the hyoid as a group action", "Abduction of the eye", "Extension of the vertebral column"], "Suprahyoid muscles help elevate the hyoid during swallowing. Infrahyoids commonly depress or stabilize it."]
]);
mc("B","11.4",[
 [[1], "Abdominal rotation", "Which pair contributes to rotating the trunk to the left?", "Right external oblique and left internal oblique", ["Left external oblique and right internal oblique", "Right external oblique and right internal oblique acting as an isolated pair", "Bilateral rectus femoris"], "External oblique contributes to contralateral trunk rotation. Internal oblique contributes to ipsilateral rotation."]
]);
mc("B","11.6",[
 [[2], "Hamstrings", "Which set contains the three commonly named hamstring muscles?", "Biceps femoris, semitendinosus, and semimembranosus", ["Rectus femoris, vastus medialis, and vastus intermedius", "Sartorius, gracilis, and tibialis anterior", "Gluteus maximus, gluteus medius, and psoas major"], "The hamstrings flex the knee. Their hip-crossing portions extend the hip. The short head of biceps femoris crosses only the knee."]
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
anatomy('B','11.5',[4],'flexor-carpi-radialis');
anatomy('A','11.6',[3],'soleus');
anatomy('B','11.6',[2],'rectus-femoris');
anatomy('B','11.6',[3],'tibialis-anterior');

// Form A follows Exam 3's twelve two-point visual items.
anatomy('A','11.5',[2],'latissimus-dorsi');
anatomy('A','11.6',[2],'biceps-femoris');
anatomy('A','11.6',[3],'calcaneal-tendon');

// Form B uses the plain true/false format visible on Exam 2.
for(const [lesson,objectives,topic,prompt,answer,explanation] of [
 ['10.3',[3],'Filament lengths','During ordinary skeletal muscle contraction, the thick and thin filaments each become shorter.','False','The filaments slide past one another. Sarcomeres shorten, while filament lengths stay approximately constant.'],
 ['10.8',[3],'Calcium regulation','In smooth muscle, calcium binds calmodulin to initiate the pathway that activates myosin.','True','Calcium–calmodulin activates myosin light-chain kinase. Skeletal muscle instead uses calcium binding to troponin.'],
 ['11.1',[1],'Muscle force','A skeletal muscle actively pushes its insertion away from its origin when it contracts.','False','Muscle generates tensile force through its attachments. Opposing actions are produced by different lines of pull.']
])add('B',lesson,objectives,topic,'choice','tf',2,prompt,answer,explanation,{distractors:[answer==='True'?'False':'True']});

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
written('B','10.2',[3,4],'Loss of T-tubules','A skeletal muscle fiber loses its T-tubules while its surface membrane can still conduct an action potential. Explain the effect on calcium release and contraction deep within the fiber.',
 'T-tubules carry membrane depolarization into the fiber. Their loss disrupts excitation–contraction coupling and coordinated calcium release from the sarcoplasmic reticulum near deep myofibrils. The deep contractile apparatus is activated poorly, reducing the strength and synchrony of contraction.',[
  ['Signal penetration','Explain that T-tubules carry surface depolarization into the interior of the fiber.',1],
  ['Calcium release','Connect disrupted T-tubule signaling to impaired coordinated calcium release from the sarcoplasmic reticulum.',1],
  ['Contraction','Explain that deep myofibrils are activated poorly, giving weaker or less synchronized contraction.',1],
 ],{fixtures:[
  ['T-tubules take the action potential deep inside. Without them, coordinated SR calcium release is impaired, so deep myofibrils activate poorly and contraction is weaker or less synchronized.',[1,1,1]],
  ['T-tubules carry the surface signal into the fiber.',[1,0,0]],
  ['T-tubules store ATP. Without them all actin disappears and myosin releases calcium normally.',[0,0,0]],
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

const wordBanks={
 '10.1':['Skeletal muscle','Smooth muscle','Cardiac muscle'],
 '10.2':['Endomysium','Perimysium','Epimysium','Sarcolemma','Tendon'],
 '10.3':['Troponin','Tropomyosin','Actin','Myosin','Sarcoplasmic reticulum','T-tubule'],
 '10.4':['Latent period','Contraction phase','Relaxation phase','Wave summation','Unfused tetanus','Fused tetanus','Treppe'],
 '11.3':['Masseter','Temporalis','Sternocleidomastoid','Orbicularis oculi','Orbicularis oris','Hyoglossus'],
 '11.4':['Rectus abdominis','Internal oblique','External oblique','Transversus abdominis','Diaphragm','Pubococcygeus'],
 '11.5':['Deltoid','Infraspinatus','Supraspinatus','Teres minor','Subscapularis','Latissimus dorsi','Pronator teres','Supinator','Flexor carpi radialis'],
 '11.6':['Soleus','Gastrocnemius','Tibialis anterior','Biceps femoris','Semitendinosus','Rectus femoris','Vastus medialis','Calcaneal tendon'],
};
for(const rows of Object.values(bank))for(const question of rows){
 question.courseEvidence=question.attachmentKey?['Muscle lab attachment table, page 8']:
  question.type==='identify'?['Chapter '+question.chapter+' image slides','BI 231 muscle lab and required list']:
  question.type==='written'?['Professor muscle review questions','OpenStax chapter '+question.chapter]:
  ['Chapter '+question.chapter+' slides and textbook'];
 if(question.type==='identify')question.wordBank=[...wordBanks[question.lesson]].sort();
}

export const mockExam4Calibration=[];
export const mockExam4PreviousForms=Object.fromEntries(Object.entries(bank).map(([letter,rows])=>{
 const questions=rows.sort((a,b)=>sectionFor[a.section]-sectionFor[b.section]).map(({fixtures,...question},i)=>{
  for(const [j,[response,points]] of (fixtures||[]).entries())mockExam4Calibration.push({
   id:question.id+'-sample-'+(j+1),questionId:question.id,response,
   expectedPoints:Object.fromEntries(question.rubric.criteria.map((criterion,k)=>[criterion.id,points[k]]))
  });
  return {...question,number:i+1};
 });
 return [letter,{id:'exam4-form-'+letter.toLowerCase()+'-r2',version:revisionTwoVersion,title:'Exam 4 · Form '+letter,questions}];
}));
const previousQuestions=Object.values(mockExam4PreviousForms).flatMap(form=>form.questions);
const publishedReplacements=[];
export const mockExam4QuizAlignedForms=Object.fromEntries(Object.entries(mockExam4PreviousForms).map(([letter,form])=>{
 const questions=form.questions.map(prior=>{
  const replacement=quizShowReplacements[letter][prior.number];
  if(!replacement)return prior;
  const {quizCategory,number,...item}=replacement;
  const question={...item,id:'exam4-'+letter.toLowerCase()+'-r3-'+prior.number,
   number:prior.number,section:prior.section,points:prior.points};
  if(item.type==='identify')question.wordBank=[...new Set([...wordBanks[item.lesson],item.answer])].sort();
  publishedReplacements.push(question);
  return question;
 });
 return [letter,{...form,id:'exam4-form-'+letter.toLowerCase()+'-r3',version:QUIZ_SHOW_VERSION,questions}];
}));
function alignedQuestion(replacement,prior,id,version){
  const {lesson,objectives,figure,topic,courseEvidence,explanation}=replacement;
  const chapter=Number(lesson.split('.')[0]);
  const url='https://openstax.org/books/anatomy-and-physiology-2e/pages/'+lesson.replace('.','-')+'-'+sectionSlugs[lesson];
  const sourceLinks=[{url,label:'OpenStax §'+lesson}];
  if(courseEvidence.includes('OpenStax end-of-chapter review questions'))
   sourceLinks.push({url:mockExam4ReviewLinks[chapter],label:'OpenStax Chapter '+chapter+' review questions'});
  let {prompt,answer,distractors}=replacement;
  if(figure){
   const markers=mockExam4MatchingPlates[figure].markers;
   const correct=markers.find(marker=>marker.term===topic);
   prompt=prompt||'Which marker identifies '+topic+'?';
   answer='Marker '+correct.number;
   distractors=markers.filter(marker=>marker!==correct).map(marker=>'Marker '+marker.number);
  }
  const card=figure&&chapter===11?chapter11Muscles.find(card=>card.name===topic):null;
  return {
   id,number:prior.number,section:prior.section,points:prior.points,type:'choice',
   chapter,lesson,objectives:objectives.map(n=>lesson+'.'+n),topic,prompt,answer,distractors,explanation,
   courseEvidence,source:'OpenStax Anatomy and Physiology 2e §'+lesson,sourceLinks,
   noteSuggestion:explanation,contentVersion:version,
   ...(figure?{figure,diagramMatch:true}:{}),...(card?{termId:card.id}:{}),
  };
}

function quadricepsQuestion(prior,id,version){
 const answer='Rectus femoris, vastus lateralis, vastus medialis, and vastus intermedius act together to extend the leg at the knee.';
 const criteria=[...prior.rubric.criteria.slice(0,4),{id:'criterion-5',label:'Shared action',
  description:'State that the group extends or straightens the knee.',points:1}];
 const examples=[
  ['Rectus femoris and the vasti (lateralis, medialis and intermedius) all straighten the knee.',[0.5,0.5,0.5,0.5,1]],
  ['Vastus medialis and vastus lateralis help extend the knee.',[0,0.5,0.5,0,1]],
  ['Semimembranosus and semitendinosus flex the knee.',[0,0,0,0,0]],
 ];
 for(const [index,[response,points]] of examples.entries()){
  mockExam4Calibration.push({id:id+'-sample-'+(index+1),questionId:id,response,
   expectedPoints:Object.fromEntries(criteria.map((criterion,i)=>[criterion.id,points[i]]))});
 }
 return {...prior,id,contentVersion:version,topic:'Quadriceps membership and shared action',
  prompt:'Name the four muscles of the quadriceps femoris and describe the movement they produce together at the knee.',
  answer,explanation:answer,noteSuggestion:answer,rubric:{id:id+'-rubric',version,criteria}};
}

const alignedQuestions=[];
function reviseForms(forms,items,revision,version,overrides){
 return Object.fromEntries(Object.entries(forms).map(([letter,form])=>{
  const questions=form.questions.map(prior=>{
   const replacement=items[letter][prior.number];
   const override=overrides[letter]?.[prior.number];
   if(!replacement&&!override)return prior;
   const id='exam4-'+letter.toLowerCase()+'-'+revision+'-'+prior.number;
   const question=override?override(prior,id,version):alignedQuestion(replacement,prior,id,version);
   alignedQuestions.push(question);
   return question;
  });
  return [letter,{...form,id:'exam4-form-'+letter.toLowerCase()+'-'+revision,version,questions}];
 }));
}
const reuseQuestion=source=>(prior,id,version)=>({...source,id,number:prior.number,contentVersion:version});
export const mockExam4RegionForms=reviseForms(mockExam4QuizAlignedForms,mockExam4Alignment,'r4',revisionFourVersion,{
 B:{37:reuseQuestion(mockExam4QuizAlignedForms.A.questions[37])},
});
const revisedForms=reviseForms(mockExam4RegionForms,mockExam4CourseRevision,'r5',MOCK_EXAM4_VERSION,{
 A:{44:quadricepsQuestion},
 B:{36:reuseQuestion(mockExam4PreviousForms.A.questions[40])},
});
export const mockExam4Forms={...revisedForms,C:mockExam4FormC};
mockExam4Calibration.push(...mockExam4FormCCalibration);
export const mockExam4Questions=Object.values(mockExam4Forms).flatMap(form=>form.questions);
export const mockExam4AttachmentQuestions=previousQuestions.filter(q=>q.attachmentKey).map((q,index)=>({
 ...q,id:'exam4-attachments-r2-'+(index+1),number:index+1,
}));
for(const [index,[answer,prompt,explanation]] of [
 ['Coracoclavicular ligament','Which ligament connects the coracoid process to the clavicle and helps suspend the scapula from the clavicle?','Its conoid and trapezoid portions connect the coracoid process to the clavicle and help stabilize the shoulder girdle.'],
 ['Acromioclavicular ligament','Which ligament spans the acromion and the lateral end of the clavicle at the joint between them?','The acromioclavicular ligament reinforces the acromioclavicular joint capsule.'],
 ['Glenohumeral ligaments','Which ligament group reinforces the anterior capsule between the glenoid margin and the humerus?','The superior, middle, and inferior glenohumeral ligaments are capsular thickenings that help stabilize the shoulder joint.'],
 ['Coracohumeral ligament','Which ligament runs from the coracoid process toward the proximal humerus and supports the superior shoulder capsule?','The coracohumeral ligament strengthens the superior capsule of the glenohumeral joint.'],
].entries()){
 mockExam4AttachmentQuestions.push({
  id:'exam4-shoulder-r2-'+(index+1),number:11+index,chapter:11,lesson:'11.5',objectives:['11.5.1','11.5.2'],
  topic:answer,type:'choice',section:'mc',points:1,prompt,answer,explanation,
  distractors:['Coracoclavicular ligament','Acromioclavicular ligament','Glenohumeral ligaments','Coracohumeral ligament'].filter(name=>name!==answer),
  contentVersion:revisionTwoVersion,noteSuggestion:explanation,
  source:'OpenStax Anatomy and Physiology 2e §9.6 · shoulder joint',
  sourceLinks:[{url:'https://openstax.org/books/anatomy-and-physiology-2e/pages/9-6-anatomy-of-selected-synovial-joints',label:'OpenStax §9.6 · shoulder joint'}],
  courseEvidence:['BI 231 bone list · Shoulder — on Muscle Test'],
 });
}
export const mockExam4AttachmentForm={
 id:'exam4-attachments-r2',version:revisionTwoVersion,title:'Exam 4 · Lab attachments and shoulder ligaments',questions:mockExam4AttachmentQuestions,
};
// Saved sessions validate their entire question snapshots. Keep the published
// versions of replaced items, alongside the new scored and drill questions.
export const mockExam4AllQuestions=[...legacyQuestions,...previousQuestions,...mockExam4AttachmentQuestions,
 ...publishedReplacements,...mockExam4QuizShowForm.questions,...alignedQuestions,...mockExam4FormC.questions];
export const mockExam4AllCalibration=[...legacyCalibration,...mockExam4Calibration];
export function mockExam4Related(id){
 const item=mockExam4AllQuestions.find(q=>q.id===id);
 if(!item)return [];
 return mockExam4Questions.filter(q=>q.id!==id&&q.id.slice(0,8)!==id.slice(0,8)&&q.lesson===item.lesson&&q.objectives.some(o=>item.objectives.includes(o)))
  .sort((a,b)=>Number(b.topic===item.topic)-Number(a.topic===item.topic)||Number(b.section===item.section)-Number(a.section===item.section));
}
