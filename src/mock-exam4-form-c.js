import {mockExam4FormCPlates} from './mock-exam4-form-c-plates.js';
import {chapter11Muscles} from './chapter11-muscles.js';

const version='2026-11-20.1';
const book='https://openstax.org/books/anatomy-and-physiology-2e/pages/';
const sectionSlugs={
 '10.1':'overview-of-muscle-tissues',
 '10.2':'skeletal-muscle',
 '10.3':'muscle-fiber-contraction-and-relaxation',
 '10.4':'nervous-system-control-of-muscle-tension',
 '10.5':'types-of-muscle-fibers',
 '10.6':'exercise-and-muscle-performance',
 '10.7':'cardiac-muscle-tissue',
 '10.8':'smooth-muscle',
 '10.9':'development-and-regeneration-of-muscle-tissue',
 '11.1':'interactions-of-skeletal-muscles-their-fascicle-arrangement-and-their-lever-systems',
 '11.2':'naming-skeletal-muscles',
 '11.3':'axial-muscles-of-the-head-neck-and-back',
 '11.4':'axial-muscles-of-the-abdominal-wall-and-thorax',
 '11.5':'muscles-of-the-pectoral-girdle-and-upper-limbs',
 '11.6':'appendicular-muscles-of-the-pelvic-girdle-and-lower-limbs',
};

const questions=[];
export const mockExam4FormCCalibration=[];

function addQuestion(lesson,objectives,topic,prompt,answer,explanation,fields){
 const number=questions.length+1;
 const id='exam4-c-r1-'+number;
 const sourceLinks=[{
  url:book+lesson.replace('.','-')+'-'+sectionSlugs[lesson],
  label:'OpenStax §'+lesson,
 },...(fields.sourceLinks||[])];
 const question={
  id,number,chapter:Number(lesson.split('.')[0]),lesson,topic,prompt,answer,explanation,
  contentVersion:version,objectives:objectives.map(objective=>lesson+'.'+objective),
  source:'OpenStax Anatomy and Physiology 2e §'+lesson,
  noteSuggestion:explanation,...fields,sourceLinks,
 };
 questions.push(question);
 return question;
}

function choice(lesson,objectives,topic,prompt,answer,distractors,explanation,extra={}){
 const courseEvidence=extra.attachmentKey?['Week 9 muscle lab · attachment table']:
  ['Chapter '+lesson.split('.')[0]+' textbook and course review'];
 addQuestion(lesson,objectives,topic,prompt,answer,explanation,{
  section:'mc',type:'choice',points:1,distractors,courseEvidence,...extra,
 });
}

function matching(lesson,objectives,figure,rows){
 const {markers}=mockExam4FormCPlates[figure];
 const courseEvidence=lesson.startsWith('10.')?['Chapter 10 textbook and course review']:
  ['BI 231 required muscle list','Week 9 muscle lab','OpenStax regional anatomy'];
 rows.forEach(([topic,explanation])=>{
  const correct=markers.find(marker=>marker.term===topic);
  const term=chapter11Muscles.find(card=>card.name===topic);
  addQuestion(lesson,objectives,topic,'Which marker identifies the '+topic.toLowerCase()+'?',
   'Marker '+correct.number,explanation,{
    section:'diagram',type:'choice',points:2,figure,diagramMatch:true,courseEvidence,
    distractors:markers.filter(marker=>marker!==correct).map(marker=>'Marker '+marker.number),
    ...(term?{termId:term.id}:{}),
   });
 });
}

function written(lesson,objectives,topic,prompt,answer,criteria,examples){
 const number=questions.length+1;
 const rubric={
  id:'exam4-c-r1-'+number+'-rubric',version,
  criteria:criteria.map(([label,description,points],index)=>({
   id:'criterion-'+(index+1),label,description,points,
  })),
 };
 const question=addQuestion(lesson,objectives,topic,prompt,answer,answer,{
  section:'written',type:'written',points:3,rubric,
  courseEvidence:['Professor muscle review questions','OpenStax Chapter '+lesson.split('.')[0]],
 });
 examples.forEach(([response,points],index)=>{
  mockExam4FormCCalibration.push({
   id:question.id+'-sample-'+(index+1),questionId:question.id,response,
   expectedPoints:Object.fromEntries(rubric.criteria.map((criterion,i)=>[criterion.id,points[i]])),
  });
 });
}

choice('10.1',[2],'Extensibility during movement',
 'As the knee extends, the relaxed hamstrings lengthen under the pull of the moving limb. Which muscle property does this passive lengthening illustrate?',
 'Extensibility',['Contractility','Excitability','Elasticity'],
 'Extensibility is the ability to lengthen when stretched. Elasticity is the tendency to return toward the original length when the stretching force is removed.');

choice('10.2',[1,2],'Force transfer to the skeleton',
 'A tendon is completely detached from its bony insertion. The attached muscle still contracts when stimulated. Which step of normal movement is interrupted most directly?',
 'Delivery of the muscle’s pull to the bone',[
  'Delivery of the motor signal to the fiber','Release of calcium inside the muscle fiber','Generation of force inside the muscle fiber',
 ],
 'Contracting fibers can still generate tension. The tendon must remain attached to transmit that tension to the bone at its insertion.');

choice('10.2',[3,4],'Calcium release at a triad',
 'At a skeletal muscle triad, which structures on either side of the T-tubule release stored calcium into the sarcoplasm?',
 'Terminal cisternae of the sarcoplasmic reticulum',[
  'Junctional folds of the motor end plate','Synaptic vesicles within the axon terminal','T-tubule branches extending across the fiber',
 ],
 'The terminal cisternae are enlarged portions of the sarcoplasmic reticulum. A T-tubule conducts the signal that triggers calcium release from the nearby cisternae.');

choice('10.2',[4],'Ending a neuromuscular signal',
 'Acetylcholinesterase activity briefly decreases at a motor end plate. Which immediate change follows a release of acetylcholine?',
 'Acetylcholine remains longer in the cleft',[
  'Acetylcholine exits the cleft more quickly','The receptor releases more acetylcholine','The axon terminal takes up more calcium',
 ],
 'Acetylcholinesterase breaks down acetylcholine. Lower activity slows its removal from the synaptic cleft.');

choice('10.3',[2,3],'ATP binding and hydrolysis',
 'A myosin head has just completed a power stroke and remains attached. Which event directly causes that head to detach?',
 'A new ATP molecule binds to myosin',[
  'Myosin hydrolyzes a new ATP molecule','Phosphate is released from the head','Calcium binds to another troponin molecule',
 ],
 'ATP binding releases myosin from actin. Hydrolysis of that ATP returns the detached head to a position ready for another cycle.');

choice('10.3',[1,2],'ATP yield versus ATP production rate',
 'An athlete compares rapid glycolysis with complete aerobic breakdown of glucose. Which comparison correctly distinguishes ATP yield from speed?',
 'Aerobic breakdown yields more ATP per glucose. Glycolysis can supply ATP faster.',[
  'Aerobic breakdown yields less ATP per glucose. Glycolysis can supply ATP faster.',
  'Glycolysis yields more ATP per glucose. Aerobic breakdown can supply ATP faster.',
  'Glycolysis and aerobic breakdown yield equal ATP per glucose but run at different rates.',
 ],
 'Complete aerobic breakdown captures more energy per glucose molecule. Glycolysis can regenerate ATP quickly without requiring oxygen directly.');

choice('10.3',[1,2],'Phosphocreatine at sprint onset',
 'At the start of a brief sprint, creatine kinase transfers a phosphate from phosphocreatine. Which molecule receives that phosphate in the ATP-regenerating reaction?',
 'ADP',['ATP','Glucose','Pyruvate'],
 'Creatine kinase transfers the phosphate from phosphocreatine to ADP, regenerating ATP. This quickly buffers ATP during sudden effort.');

choice('10.4',[4],'Motor-unit recruitment versus firing frequency',
 'As grip force rises, the active motor neurons keep firing at their previous rates and more motor neurons begin firing. What accounts for the added force?',
 'Recruitment brings more muscle fibers into action',[
  'Wave summation increases force in the same fibers','Fused tetanus eliminates relaxation in the same fibers',
  'Atrophy reduces the size of previously active fibers',
 ],
 'Recruitment activates additional motor units and their fibers. Wave summation raises force from already active fibers when they receive stimuli closer together.');

choice('10.4',[4],'Treppe versus overlapping twitches',
 'Successive stimuli produce taller tension peaks, and tension returns to its resting baseline before every new stimulus. Which pattern best fits the tracing?',
 'Treppe',['Wave summation','Unfused tetanus','Fused tetanus'],
 'In treppe, individual twitches grow while still relaxing between stimuli. Wave summation and tetanus involve incomplete relaxation or sustained tension.');

choice('10.5',[1,2],'Fiber selection for sustained posture',
 'Which set of fiber features best supports low-intensity postural work that must continue for long periods?',
 'Slow shortening, many mitochondria, and high fatigue resistance',[
  'Fast shortening, many mitochondria, and low fatigue resistance',
  'Slow shortening, few mitochondria, and low fatigue resistance',
  'Fast shortening, few mitochondria, and high fatigue resistance',
 ],
 'Slow oxidative fibers shorten more slowly and rely strongly on aerobic metabolism, supporting sustained activity such as posture.');

choice('10.5',[1,2],'Comparing fast fiber types',
 'Two fibers both shorten rapidly. Fiber X has greater oxidative capacity and resists fatigue longer than fiber Y. Which identification best fits them?',
 'X is fast oxidative and Y is fast glycolytic',[
  'X is fast glycolytic and Y is fast oxidative','X is slow oxidative and Y is fast glycolytic','X is fast oxidative and Y is slow oxidative',
 ],
 'Fast oxidative fibers combine rapid contraction with more oxidative capacity than fast glycolytic fibers. The rapid shortening in both fibers distinguishes them from slow oxidative fibers.');

choice('10.6',[1],'Changes during disuse',
 'After several weeks of reduced use, a muscle’s fibers have smaller cross-sectional areas. What is the direct interpretation of this observation?',
 'Existing fibers have undergone atrophy',[
  'Existing fibers have undergone hypertrophy','The muscle has added more fibers by hyperplasia','The tissue has undergone more motor-unit recruitment',
 ],
 'Atrophy refers to reduced fiber size. Hypertrophy increases fiber size, while hyperplasia means an increase in cell number.');

choice('10.7',[1,2],'Two roles of intercalated discs',
 'Mechanical attachments within a ventricular intercalated disc weaken while its gap junctions remain open. Which effect follows most directly?',
 'Cells may separate under tension even as current still passes',[
  'Cells stop sharing current even as mechanical adhesion persists',
  'Current stops passing and mechanical adhesion increases',
  'Current passes more rapidly and mechanical adhesion increases',
 ],
 'Intercalated discs bind the cells and coordinate electrical activity. Desmosomes help hold them together under tension, while gap junctions allow current between adjacent cells.');

choice('10.7',[1],'Pacemakers and electrical coupling',
 'Pacemaker cells continue to fire at their usual rate, but electrical coupling to nearby cardiac tissue is disrupted. Which outcome best follows?',
 'The pacemaker signal has difficulty spreading to neighboring cells',[
  'The pacemaker cells lose the ability to depolarize on their own',
  'The neighboring cells contract more quickly on every beat',
  'The neighboring cells separate because desmosomes open',
 ],
 'Pacemaker cells can generate their own electrical activity. Propagation to other cardiac cells relies on electrical coupling through gap junctions in intercalated discs.');

choice('10.8',[1,3],'Dense bodies and smooth-muscle tension',
 'A study preparation has smooth muscle with defective dense bodies. Which working connection is most directly affected?',
 'Actin attachment to the force-transmitting network',[
  'Myosin binding to activated thin filaments','ATP binding to the smooth-muscle myosin head','Membrane voltage changes during stimulation',
 ],
 'Dense bodies anchor thin filaments and connect them to a network that transmits force across a smooth-muscle cell.');

choice('10.8',[3],'Calcium regulation in smooth and skeletal muscle',
 'Cytosolic calcium rises in smooth muscle and skeletal muscle. Which pairing correctly identifies the initial calcium-binding regulator of contraction in each?',
 'Smooth muscle uses calmodulin. Skeletal muscle uses troponin.',[
  'Smooth muscle uses troponin. Skeletal muscle uses calmodulin.',
  'Smooth muscle and skeletal muscle both use troponin.',
  'Smooth muscle and skeletal muscle both use calmodulin.',
 ],
 'Calcium–calmodulin activates myosin light-chain kinase in smooth muscle. In skeletal muscle, calcium binding to troponin helps move tropomyosin away from actin’s myosin-binding sites.');

choice('10.9',[1,2],'Limits of skeletal muscle repair',
 'An injury destroys a large region of skeletal muscle, including many supporting cells and much of its scaffold. What outcome is most likely within the badly damaged region?',
 'Partial regeneration with some fibrous scar formation',[
  'Complete regeneration from division of mature fibers','Full restoration through enlargement of the damaged fibers','Complete restoration through fusion of scar fibroblasts',
 ],
 'Satellite cells can contribute to repair, but extensive damage and loss of supporting tissue limit regeneration. Fibrosis can replace regions that cannot regenerate.');

choice('11.1',[3],'Lever mechanics of a heel raise',
 'During a standing heel raise, the ball of the foot is the fulcrum and the Achilles tendon pulls on the heel. Body weight acts through the ankle between those points. Which lever arrangement is this?',
 'Second class, with the load between the fulcrum and effort',[
  'First class, with the fulcrum between the effort and load',
  'Third class, with the effort between the fulcrum and load',
  'First class, with the load between the fulcrum and effort',
 ],
 'In the simplified heel-raise model, the ball of the foot is the pivot, body weight is the intermediate load, and the calf supplies effort at the heel. An intermediate load defines a second-class lever.');

choice('11.1',[2],'Fascicle arrangement and excursion',
 'Two muscles of similar volume have the same tendon leverage and maximum shortening percentage. If one has longer, nearly parallel fascicles, which advantage generally follows?',
 'Greater absolute shortening of the muscle fibers',[
  'Less absolute shortening of the muscle fibers','More fibers packed alongside one another','Higher force from a greater pennation angle',
 ],
 'Longer fibers can shorten a greater absolute distance at the same shortening percentage. Pennate architecture can pack more fibers in parallel and favor force capacity.');

choice('11.2',[1,2],'Location clues in muscle names',
 'Which part of the name flexor pollicis longus tells you that the muscle acts on the thumb?',
 'Pollicis',['Flexor','Longus','Flexor longus'],
 'Pollicis refers to the thumb. Flexor gives the action, while longus distinguishes the longer member of a naming pair.');

choice('11.3',[1],'Temporalis action from its tendon path',
 'The posterior fibers of temporalis pull backward on the coronoid process. After the jaw has been thrust forward, which movement do these fibers help produce?',
 'Retraction of the mandible',['Protraction of the mandible','Depression of the mandible','Elevation of the hyoid'],
 'The coronoid process is part of the mandible. The posterior fibers of temporalis pull the mandible posteriorly and help return it from a protruded position.',
 {attachmentKey:'temporalis'});

choice('11.3',[3],'Hyoid movement during swallowing',
 'With the mandible relatively stable, a muscle spanning from the mandible to the hyoid contracts during swallowing. Which action can a suprahyoid such as mylohyoid assist?',
 'Elevating the hyoid and floor of the mouth',[
  'Depressing the hyoid and floor of the mouth','Protruding the tongue out of the mouth','Retracting the mandible and elevating the jaw',
 ],
 'Mylohyoid forms much of the floor of the mouth. With the jaw relatively fixed, its contraction helps elevate that floor and the hyoid during swallowing.');

choice('11.4',[1],'Rectus abdominis with the thorax fixed',
 'During a reverse crunch, the lower ribs stay nearly fixed as the pelvis curls off the mat. Which pull can shortening rectus abdominis contribute?',
 'Drawing the pubis toward the lower sternum',[
  'Drawing the pubis farther from the lower sternum','Drawing one iliac crest away from the lower ribs',
  'Drawing the lumbar vertebrae into greater extension',
 ],
 'Rectus abdominis connects the pubis to the xiphoid region and costal cartilages. With the thorax relatively stable, shortening can draw the front of the pelvis toward the rib cage.',
 {attachmentKey:'rectus-abdominis'});

choice('11.4',[2],'Rib movement in forced expiration',
 'A student blows air out forcefully while the torso stays upright. Which rib-cage action helps produce this active phase of breathing?',
 'Interosseous internal intercostals help depress the ribs',[
  'External intercostals help elevate the ribs','Interosseous internal intercostals help elevate the ribs',
  'External intercostals help expand the thoracic cavity',
 ],
 'During forced expiration, the interosseous portions of the internal intercostals help lower the ribs and reduce thoracic volume. Quiet expiration relies primarily on elastic recoil.');

choice('11.5',[2],'Pectoralis major and humeral motion',
 'During a chest fly with the arms raised to shoulder height, the upper arms move toward each other in front of the torso. Which joint action does pectoralis major help produce?',
 'Horizontal adduction of the humerus',[
  'Horizontal abduction of the humerus','Retraction of the scapula','Extension of the elbow',
 ],
 'Pectoralis major attaches to the proximal humerus. Its pull can bring the elevated humerus toward the midline across the chest in horizontal adduction.',
 {attachmentKey:'pectoralis-major'});

choice('11.5',[4],'Finger-flexor insertion and joint action',
 'At the index finger, the tendon that ends on the distal phalanx can no longer transmit force. The tendon that ends on the middle phalanx is intact. Which pattern follows most directly?',
 'Active flexion at the joint nearest the fingertip is lost, while flexion at the middle joint remains possible',[
  'Active flexion at the middle joint is lost, while flexion at the joint nearest the fingertip remains possible',
  'Active extension at the joint nearest the fingertip is lost, while flexion there remains possible',
  'Active extension at the middle joint is lost, while flexion there remains possible',
 ],
 'Flexor digitorum profundus reaches the distal phalanx and flexes the distal interphalangeal joint. Flexor digitorum superficialis reaches the middle phalanx and can still flex the proximal interphalangeal joint.',
 {attachmentKey:'finger-flexors',sourceLinks:[
  {url:'https://www.lumen.luc.edu/lumen/meded/grossanatomy/dissector/mml/fds.htm',label:'Loyola anatomy · flexor digitorum superficialis'},
  {url:'https://www.lumen.luc.edu/lumen/meded/grossanatomy/dissector/mml/fdp.htm',label:'Loyola anatomy · flexor digitorum profundus'},
 ]});

choice('11.5',[1],'Scapular movement when reaching forward',
 'Near the end of a reach, the medial border of the scapula moves away from the spine as the scapula glides around the rib cage. Which muscle is a prime contributor to that translation?',
 'Serratus anterior',['Rhomboid major','Middle trapezius','Levator scapulae'],
 'Serratus anterior draws the scapula forward around the thorax. Rhomboid major and middle trapezius are scapular retractors, and levator scapulae primarily elevates the scapula.');

choice('11.6',[1],'Gluteus maximus during a chair rise',
 'During a chair rise, the thighs are initially flexed at the hips. Which action does gluteus maximus help produce as the person moves toward standing?',
 'Hip extension',['Hip flexion','Hip medial rotation','Knee extension'],
 'Gluteus maximus has substantial leverage to extend a flexed hip. The quadriceps extend the knee, which also straightens during the rise.',
 {attachmentKey:'gluteus-maximus'});

choice('11.6',[3],'Lateral leg compartment',
 'When the lateral compartment of the leg is active, the sole turns outward and the involved muscles can assist plantar flexion. Which muscle pair best fits?',
 'Fibularis longus and fibularis brevis',[
  'Tibialis anterior and tibialis posterior','Gastrocnemius and soleus',
  'Extensor digitorum longus and extensor hallucis longus',
 ],
 'Fibularis longus and brevis are the main lateral-compartment evertors and can assist plantar flexion. The other pairs are drawn from anterior or posterior compartments.');

choice('11.6',[4],'Reference axis for toe abduction',
 'Which reference digit defines whether the dorsal interossei of the foot move a toe away from the foot’s central axis?',
 'Second toe',['Great toe','Third toe','Fifth toe'],
 'Toe abduction and adduction are described relative to the second toe. The dorsal interossei abduct the toes they act on away from this axis.');

matching('10.2',[3,4],'c-nmj',[
 ['Synaptic vesicles','Synaptic vesicles store acetylcholine inside the axon terminal and release it into the synaptic cleft.'],
 ['Axon terminal','The axon terminal is the enlarged end of the motor neuron, on the presynaptic side of the junction.'],
 ['Motor end plate','The motor end plate is the specialized postsynaptic region of the muscle fiber membrane that carries acetylcholine receptors.'],
]);

matching('10.4',[3],'c-twitch',[
 ['Latent period','The latent period follows stimulation while electrical signaling and calcium release begin. The tension trace has yet to rise.'],
 ['Relaxation phase','Tension falls during relaxation as calcium returns to the sarcoplasmic reticulum and cross-bridge activity subsides.'],
]);

matching('11.4',[1],'c-abdomen',[
 ['Transversus abdominis','Transversus abdominis is the deepest flat abdominal muscle. Its fibers run predominantly across the abdomen and help compress the abdominal contents.'],
 ['External oblique','External oblique is the most superficial flat muscle of the lateral abdominal wall. Its anterior fibers generally run down and toward the midline.'],
]);

matching('11.5',[3,4],'c-forearm',[
 ['Flexor digitorum superficialis','Flexor digitorum superficialis sends tendons to the middle phalanges of digits 2–5 and flexes their proximal interphalangeal joints.'],
 ['Pronator teres','Pronator teres takes an oblique course across the proximal forearm toward the radius and pronates the forearm.'],
 ['Flexor carpi radialis','The flexor carpi radialis tendon approaches the thumb side of the anterior wrist. Its pull flexes and radially deviates the wrist.'],
]);

matching('11.6',[2],'c-thigh',[
 ['Semimembranosus','Semimembranosus is the broader, deeper medial hamstring. Its distal attachment is posteromedial at the knee.'],
 ['Semitendinosus','Semitendinosus is a medial hamstring with a long distal tendon that inserts on the medial proximal tibia at the pes anserinus.'],
]);

written('10.6',[1,2],'Cellular adaptations to training',
 'Compare endurance training with resistance training. Give one adaptation in or around skeletal muscle fibers typical of each, and explain how each adaptation can improve performance.',
 'Endurance training can increase mitochondrial oxidative capacity, which supports sustained aerobic ATP production and delays fatigue. Resistance training can increase myofibrillar protein and fiber cross-sectional area, which increases force capacity.',
 [
  ['Endurance adaptation','Name one appropriate change, such as increased mitochondrial density or oxidative capacity, higher myoglobin, or increased capillary supply around the fibers.',1],
  ['Endurance performance','Link the stated adaptation to specific improvement in oxygen supply or use, sustained ATP production, or fatigue resistance.',0.5],
  ['Resistance adaptation','Name one appropriate change, such as increased myofibrillar protein, more contractile material, or greater existing fiber cross-sectional area through hypertrophy.',1],
  ['Resistance performance','Link the stated adaptation to increased force or the ability to lift greater loads.',0.5],
 ],[
  ['Endurance increases mitochondrial density so fibers can make aerobic ATP for longer. Resistance training adds myofibrillar protein so the larger fibers can generate more force.',[1,0.5,1,0.5]],
  ['Endurance increases capillary density, which helps oxygen reach working fibers. Resistance exercise makes fibers larger.',[1,0.5,1,0]],
  ['Endurance removes all mitochondria to make fibers faster, and lifting makes the muscles smaller and weaker.',[0,0,0,0]],
 ]);

written('11.4',[2,3],'Respiratory and pelvic diaphragms',
 'Compare the respiratory diaphragm and the pelvic diaphragm. State one similarity, then describe where each structure is located and what it does there.',
 'Both are skeletal muscle partitions with openings. The respiratory diaphragm separates the thorax from the abdomen and changes thoracic volume during breathing. The pelvic diaphragm spans the pelvic outlet and supports the pelvic organs and helps resist rises in abdominal pressure.',
 [
  ['Similarity','State one accurate similarity, such as both being skeletal-muscle partitions or both forming sheets with openings.',1],
  ['Respiratory diaphragm','Give both its location between the thorax and abdomen and its role in ventilation by changing thoracic volume.',1],
  ['Pelvic diaphragm','Give both its location at the pelvic floor or outlet and its role in supporting pelvic organs or resisting abdominal pressure.',1],
 ],[
  ['Both are sheets of skeletal muscle. The respiratory diaphragm forms the border between the thorax and abdomen and changes thoracic volume for breathing. The pelvic diaphragm forms the pelvic floor and supports its organs.',[1,1,1]],
  ['Both are muscle sheets with openings. The respiratory diaphragm lies between the chest and abdomen and expands the chest during inspiration. The pelvic diaphragm opens the rib cage.',[1,1,0]],
  ['The respiratory diaphragm is in the neck and closes the jaw. The pelvic diaphragm is in the calf and flexes the ankle. Both are smooth muscle.',[0,0,0]],
 ]);

export const mockExam4FormC={
 id:'exam4-form-c-r1',version,title:'Exam 4 · Form C',questions,
};
