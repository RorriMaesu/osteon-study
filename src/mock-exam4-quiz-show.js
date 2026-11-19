export const QUIZ_SHOW_VERSION='2026-11-19.1';

const sections={
 '10.2':'skeletal-muscle','10.3':'muscle-fiber-contraction-and-relaxation',
 '10.5':'types-of-muscle-fibers','10.7':'cardiac-muscle-tissue','10.8':'smooth-muscle',
 '11.3':'axial-muscles-of-the-head-neck-and-back','11.5':'muscles-of-the-pectoral-girdle-and-upper-limbs',
 '11.6':'appendicular-muscles-of-the-pelvic-girdle-and-lower-limbs',
};
const categories=['Smooth and cardiac muscle','Sarcomere','Axial muscles','Appendicular muscles','Contraction','Final round'];
const categoryFor=slide=>categories[Math.floor((slide-2)/8)];
function question(id,slide,lesson,objectives,topic,prompt,answer,explanation,format){
 const url='https://openstax.org/books/anatomy-and-physiology-2e/pages/'+lesson.replace('.','-')+'-'+sections[lesson];
 return {
  id:'exam4-quiz-show-'+id,chapter:Number(lesson.split('.')[0]),lesson,topic,prompt,answer,explanation,
  contentVersion:QUIZ_SHOW_VERSION,objectives:objectives.map(n=>lesson+'.'+n),
  source:'OpenStax Anatomy and Physiology 2e §'+lesson,sourceLinks:[{url,label:'OpenStax §'+lesson}],
  noteSuggestion:explanation.slice(0,180),courseEvidence:['Ch 10 to 11 Quiz Show Review · slide '+slide],
  quizCategory:categoryFor(slide),reviewSlide:slide,...format,
 };
}
const choice=(id,slide,lesson,objectives,topic,prompt,answer,distractors,explanation)=>
 question(id,slide,lesson,objectives,topic,prompt,answer,explanation,{type:'choice',section:'mc',points:1,distractors});
const truth=(id,slide,lesson,objectives,topic,prompt,answer,explanation)=>
 question(id,slide,lesson,objectives,topic,prompt,answer,explanation,{type:'choice',section:'tf',points:1,distractors:[answer==='True'?'False':'True']});
const identify=(id,slide,lesson,objectives,topic,prompt,answer,figure,aliases,explanation,termId)=>
 question(id,slide,lesson,objectives,topic,prompt,answer,explanation,{
  type:'identify',section:'diagram',points:2,figure,aliases,answerPolicy:{kind:'structure',allowAnySide:!!termId},...(termId?{termId}:{}),
 });

export const quizShowQuestions=[
 choice('myocardium',2,'10.7',[1],'Myocardium','Which type of muscle forms the contractile tissue of the myocardium?','Cardiac muscle',
  ['Smooth muscle','Skeletal muscle'],'The myocardium is the muscular layer of the heart wall. It is made chiefly of cardiac muscle.'),
 choice('gap-junctions',4,'10.7',[1,2],'Intercalated discs','Which part of an intercalated disc allows electrical current to pass between neighboring cardiac muscle cells?','Gap junctions',
  ['Desmosomes','Tight junctions','Motor end plates'],'Gap junctions pass ionic current between cells. Desmosomes mechanically anchor cells to each other during contraction.'),
 truth('smooth-triggers',6,'10.8',[2,3],'Smooth muscle triggers','Smooth muscle can respond to autonomic signals, hormones, and local chemical changes such as changes in pH.','True',
  'Smooth muscle responds to several signals, depending on the tissue. Autonomic stimulation, hormones, and local chemical conditions can influence its contraction.'),
 choice('varicosities',8,'10.8',[2,3],'Varicosities','What are the neurotransmitter-releasing swellings along an autonomic axon supplying smooth muscle called?','Varicosities',
  ['Dense bodies','Z discs','Aponeuroses'],'Varicosities release neurotransmitter at points along an autonomic axon. Dense bodies anchor thin filaments inside smooth muscle cells.'),
 choice('sarcomere',10,'10.2',[3],'Sarcomere','What is the name of the repeating contractile unit between adjacent Z discs?','Sarcomere',
  ['Fascicle','Motor unit','Terminal cisterna'],'Skeletal and cardiac myofibrils are organized into sarcomeres. Smooth muscle has thick and thin filaments arranged without sarcomeres.'),
 choice('actin',12,'10.2',[3],'Thin filament composition','Which protein forms the main structural strands of a skeletal muscle thin filament?','Actin',
  ['Troponin','Tropomyosin','Myosin'],'Actin forms the structural strands. Troponin and tropomyosin regulate access to the actin binding sites.'),
 choice('z-disc-anchor',14,'10.3',[1,3],'Z-disc attachment','Which filaments are anchored to the Z discs of a skeletal muscle sarcomere?','Thin filaments',
  ['Thick filaments','Sarcoplasmic reticulum','Transverse tubules'],'Z discs anchor thin actin filaments at each end of the sarcomere. Thick myosin filaments are organized around the M line.'),
 choice('overlap',16,'10.3',[3],'Thick–thin overlap','Where do thick and thin filaments overlap in a relaxed skeletal sarcomere?','In the A band, outside the H zone',
  ['In the H zone at the center of the A band','In the I band next to the Z disc','At the Z disc itself'],'The A band spans the thick filament length and includes overlap on either side of the H zone. The H zone has thick filaments only.'),
 choice('mastoid',18,'11.3',[4],'Sternocleidomastoid attachment','Which superficial neck muscle attaches to the mastoid process and has heads arising from the sternum and clavicle?','Sternocleidomastoid',
  ['Masseter','Temporalis','Sternohyoid'],'Sternocleidomastoid runs from the manubrium and medial clavicle to the mastoid process and adjacent superior nuchal line.'),
 choice('latissimus',20,'11.5',[2],'Latissimus dorsi action','Which shoulder movement can latissimus dorsi produce when you pull a raised arm down and behind your trunk?','Extension of the arm',
  ['Abduction of the arm','Flexion of the arm','Lateral rotation of the arm'],'Latissimus dorsi extends, adducts, and medially rotates the humerus.'),
 choice('erector-spinae',22,'11.3',[4],'Erector spinae membership','Which muscle belongs to a different group from the three erector spinae columns?','Splenius',
  ['Iliocostalis','Longissimus','Spinalis'],'The erector spinae are iliocostalis, longissimus, and spinalis. Splenius is a separate posterior neck muscle group.'),
 identify('masseter',24,'11.3',[1],'Masseter identification','Name the ringed muscle in the lateral view of the jaw.','Masseter','muscle-target:masseter',
  ['Masseter muscle'],'The masseter lies over the lateral mandibular ramus and elevates the mandible to close the jaw.','ch11-masseter'),
 truth('biceps-location',26,'11.5',[3],'Biceps brachii location','Biceps brachii is a muscle of the lower limb.','False',
  'Biceps brachii is in the anterior upper arm. Biceps femoris is a hamstring in the posterior thigh.'),
 choice('quadriceps',28,'11.6',[2],'Quadriceps action','What action do the quadriceps femoris muscles share at the knee?','Knee extension',
  ['Knee flexion','Medial rotation of the leg','Lateral rotation of the leg'],'All four quadriceps muscles extend the knee. Rectus femoris also crosses the hip and contributes to hip flexion.'),
 choice('plantarflexion',30,'11.6',[3],'Gastrocnemius action','Which muscle helps raise the heel by plantarflexing the ankle?','Gastrocnemius',
  ['Biceps femoris','Tibialis anterior','Rectus femoris'],'Gastrocnemius crosses the knee and ankle and helps plantarflex the ankle. Tibialis anterior dorsiflexes it.'),
 identify('extensor-digitorum',32,'11.5',[4],'Extensor digitorum identification','Name the ringed muscle in this dorsal forearm view.','Extensor digitorum','quiz-forearm-extensor',
  ['Extensor digitorum muscle','Extensor digitorum communis','Extensor digitorum communis muscle','EDC'],
  'Extensor digitorum lies in the superficial posterior forearm. Its tendons contribute to extension of fingers 2–5.','ch11-extensor-digitorum'),
 choice('filament-motion',34,'10.3',[3],'Sliding filament motion','During the power stroke, which filament does myosin pull toward the M line?','The thin actin filament',
  ['The thick myosin filament','The elastic titin filament','The Z disc by itself'],'Myosin heads pull thin actin filaments toward the center of the sarcomere. The thick and thin filaments retain their lengths as the overlap increases.'),
 choice('acetylcholine',36,'10.2',[4],'Skeletal motor neuron transmitter','Which neurotransmitter does a motor neuron release at a skeletal neuromuscular junction?','Acetylcholine (ACh)',
  ['ATP','GABA','Glutamate'],'Acetylcholine (ACh) leaves the motor neuron terminal, crosses the cleft, and binds receptors at the motor end plate.'),
 choice('t-tubules',38,'10.2',[3,4],'T-tubule function','Which membrane structures carry the action potential deep into a skeletal muscle fiber?','T-tubules',
  ['Sarcoplasmic reticulum','Troponin','Myofibrils'],'T-tubules are extensions of the sarcolemma. Their depolarization triggers calcium release from the nearby sarcoplasmic reticulum.'),
 choice('synaptic-cleft',40,'10.2',[4],'Synaptic cleft','What happens in the synaptic cleft at a skeletal neuromuscular junction?','Acetylcholine diffuses toward receptors on the motor end plate',
  ['Calcium from the terminal diffuses to the motor end plate to open its receptors','The action potential travels along the axon across the cleft','Acetylcholine is pumped directly into the sarcoplasmic reticulum'],
  'Acetylcholine diffuses across the small gap between the axon terminal and the motor end plate. Calcium entry into the nerve terminal triggers its release.'),
 choice('powerlifting',42,'10.5',[1,2],'Fast glycolytic fibers','Which fiber type is best suited to a brief, near-maximal powerlifting effort?','Fast glycolytic',
  ['Slow oxidative','Fast oxidative-glycolytic'],'Fast glycolytic fibers produce rapid, powerful contractions and fatigue quickly. Skeletal muscles contain a mixture of fiber types.'),
].map((item,index)=>({...item,number:index+1}));

const byKey=key=>quizShowQuestions.find(item=>item.id==='exam4-quiz-show-'+key);
const zDisc=identify('z-disc-visual',14,'10.3',[1,3],'Z-disc identification','Name the ringed structure where the thin filaments attach.','Z disc','sarcomere-z-disc',
 ['Z line','Z disk','Z-disc','Z-line','Z-disk','Z band'],'A Z disc anchors thin filaments and marks a boundary between adjacent sarcomeres.');
const calf=identify('gastrocnemius-visual',30,'11.6',[3],'Gastrocnemius identification','Which muscle does this marked calf muscle head belong to?','Gastrocnemius','quiz-gastrocnemius',
 ['Gastrocnemius muscle','Medial head of gastrocnemius','Medial gastrocnemius','Gastrocnemius medial head'],
 'The ring marks the medial head of gastrocnemius, a superficial calf muscle that plantarflexes the ankle and assists knee flexion.','ch11-gastrocnemius');

export const quizShowReplacements={
 A:{17:byKey('varicosities'),28:byKey('erector-spinae'),33:zDisc,38:byKey('extensor-digitorum')},
 B:{2:byKey('synaptic-cleft'),4:byKey('overlap'),39:calf,41:byKey('smooth-triggers')},
};
export const mockExam4QuizShowForm={
 id:'exam4-quiz-show-v1',version:QUIZ_SHOW_VERSION,title:'Exam 4 · Quiz Show Review',questions:quizShowQuestions,
};
