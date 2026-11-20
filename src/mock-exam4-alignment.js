const quiz='Chapters 10–11 Quiz Show Review';
const lab='Week 9 muscle lab';
const labQuiz='Instructor muscle-lab quiz';
const textbookReview='OpenStax end-of-chapter review questions';

const choice=(lesson,objectives,topic,prompt,answer,distractors,explanation,courseEvidence)=>({
 lesson,objectives,topic,prompt,answer,distractors,explanation,courseEvidence,
});
const match=(lesson,objectives,figure,topic,explanation,courseEvidence)=>({
 lesson,objectives,figure,topic,explanation,courseEvidence,
});

export const mockExam4Alignment={
 A:{
  16:choice('10.1',[1],'Muscle in the heart wall',
   'What is the contractile muscle layer that generates the force to eject blood from a ventricle?',
   'Myocardium',['Endocardium','Epicardium','Fibrous pericardium'],
   'The myocardium is the cardiac muscle layer. Its coordinated contraction generates chamber pressure. The endocardium lines the chamber.',
   [quiz+' · cardiac muscle',textbookReview]),
  25:choice('11.1',[1],'Elbow flexors and their antagonist',
   'With the shoulder held still, the biceps brachii and brachialis help bend the elbow. Which muscle opposes their elbow action?',
   'Triceps brachii',['Brachioradialis','Pronator teres','Anterior deltoid'],
   'Biceps brachii and brachialis are synergists in elbow flexion. Triceps brachii pulls in the opposite direction at that joint and extends the elbow.',
   [lab+' · pages 10–11',textbookReview]),
  28:choice('11.3',[4],'Erector spinae order',
   'On one side of the spine, in which order do the three erector spinae columns lie from closest to the midline to farthest away?',
   'Spinalis → longissimus → iliocostalis',
   ['Iliocostalis → longissimus → spinalis','Longissimus → spinalis → iliocostalis','Spinalis → splenius capitis → iliocostalis'],
   'Spinalis is medial, longissimus is intermediate, and iliocostalis is lateral. Splenius capitis is a separate posterior neck muscle.',
   [lab+' · page 4',quiz+' · axial muscles']),
  31:match('10.2',[1],'coverings','Epimysium','Epimysium surrounds the entire skeletal muscle.',[labQuiz+' · skeletal muscle organization',textbookReview]),
  32:match('10.2',[1],'coverings','Perimysium','Perimysium surrounds a fascicle, which is a bundle of muscle fibers.',[labQuiz+' · skeletal muscle organization',textbookReview]),
  33:match('10.2',[1],'coverings','Endomysium','Endomysium surrounds each individual muscle fiber within a fascicle.',[labQuiz+' · skeletal muscle organization',textbookReview]),
  34:match('10.3',[1,3],'sarcomere','M line','The M line is at the center of a sarcomere, where proteins anchor and align the thick filaments.',[quiz+' · contraction']),
  35:match('10.3',[1,3],'sarcomere','Z disc','A sarcomere runs from one Z disc to the next. Thin filaments anchor at the Z discs.',[quiz+' · sarcomere',textbookReview]),
  36:match('11.3',[1],'face','Masseter','The masseter covers the lateral ramus of the mandible and elevates the jaw during chewing.',[quiz+' · facial identification',labQuiz]),
  37:match('11.3',[1,2],'face','Orbicularis oculi','Orbicularis oculi encircles the orbit and closes the eyelids.',[labQuiz+' · facial identification']),
  38:match('11.3',[1],'face','Orbicularis oris','Orbicularis oris encircles the mouth and helps close and protrude the lips.',[labQuiz+' · eyelid versus lip muscles']),
  39:match('11.5',[2],'shoulder','Infraspinatus','The infraspinatus lies below the spine of the scapula. It laterally rotates the humerus and contributes to rotator cuff stability.',[lab+' · shoulder muscles','BI 231 Lab 9 · rotator cuff']),
  40:match('11.5',[2],'shoulder','Deltoid','The deltoid caps the shoulder. Its middle fibers abduct the humerus at the shoulder joint.',[lab+' · page 9','BI 231 Lab 9 · shoulder']),
  41:match('11.6',[3],'leg','Tibialis anterior','Tibialis anterior lies beside the anterior shin and dorsiflexes the ankle.',[lab+' · pages 6 and 10','BI 231 required muscle list']),
  42:match('11.6',[3],'leg','Gastrocnemius','Gastrocnemius is a two-headed superficial calf muscle. It contributes to plantar flexion and also crosses the knee.',[quiz+' · appendicular muscles',lab+' · pages 6 and 10']),
 },
 B:{
  3:choice('10.3',[1],'Actin in the thin filament',
   'Which thin-filament protein carries the binding sites that myosin heads attach to during cross-bridge formation?',
   'Actin',['Troponin','Tropomyosin','Titin'],
   'Actin presents the binding sites. Tropomyosin covers those sites at rest, and calcium binding to troponin helps expose them.',
   [quiz+' · sarcomere',textbookReview]),
  17:choice('10.2',[1,3],'Skeletal muscle organization',
   'A lab diagram zooms in from the whole muscle to its contractile strands. Which path goes from the larger structure to the smaller structure at every step?',
   'Fascicle → muscle fiber → myofibril → myofilament',
   ['Muscle fiber → fascicle → myofibril → myofilament','Fascicle → myofibril → muscle fiber → myofilament','Fascicle → muscle fiber → myofilament → myofibril'],
   'A fascicle contains muscle fibers, each fiber contains myofibrils, and each myofibril is built from myofilaments arranged into sarcomeres.',
   [textbookReview,labQuiz+' · skeletal muscle organization']),
  27:choice('11.2',[1,2],'Fiber direction in a muscle name',
   'Rectus abdominis and rectus femoris lie in different regions. What does the shared word rectus describe?',
   'A straight fiber direction',['A circular arrangement','Two heads of origin','A diagonal fiber direction'],
   'Rectus means straight. Abdominis and femoris indicate different regions. Oblique describes a diagonal fiber direction.',
   [labQuiz+' · muscle naming',textbookReview]),
  28:choice('11.3',[4],'Opposing actions in the neck',
   'Which muscle group opposes bilateral splenius capitis extension by flexing the lower cervical spine when both sides contract?',
   'The sternocleidomastoids',['The upper trapezius fibers','The masseters','The temporalis muscles'],
   'Both splenius capitis muscles extend the head and neck. Bilateral sternocleidomastoid contraction can flex the lower cervical spine, even as it extends the head at the upper cervical joints.',
   [labQuiz+' · opposing sagittal neck actions']),
  42:choice('11.1',[1],'Shoulder adduction',
   'Pectoralis major and latissimus dorsi can work as synergists to bring a raised arm back toward the side of the body at the shoulder.',
   'True',['False'],
   'Both muscles can adduct the humerus. Their relationship depends on the action. For example, clavicular pectoralis major can contribute to shoulder flexion, while latissimus dorsi contributes to extension.',
   [lab+' · pages 10–11']),
 },
};

export const mockExam4ReviewLinks={
 10:'https://openstax.org/books/anatomy-and-physiology-2e/pages/10-review-questions',
 11:'https://openstax.org/books/anatomy-and-physiology-2e/pages/11-review-questions',
};

const worksheet='Muscle Diagrams for Studying';
const requiredList='BI 231 required muscle list';
const writtenReview='Professor’s written Muscle Questions';
const tissueEvidence=['Chapter 10 · tissue micrographs','Exam 2 · histology task format'];

// Form B practices the historical function-to-marker task with new muscle content.
const functionalMatch=(lesson,objectives,figure,topic,prompt,explanation,courseEvidence)=>({
 ...match(lesson,objectives,figure,topic,explanation,courseEvidence),prompt,
});

export const mockExam4CourseRevision={
 A:{
  27:choice('11.2',[1,2],'Finger versus toe extensors',
   'The dorsal forearm and anterior leg each contain a muscle that extends digits. Which pairing correctly names the extensor of fingers 2–5 and the long extensor of toes 2–5, in that order?',
   'Extensor digitorum / extensor digitorum longus',
   ['Extensor digitorum longus / extensor digitorum','Flexor digitorum superficialis / extensor digitorum longus','Extensor digitorum / flexor digitorum longus'],
   'Extensor digitorum extends the four medial fingers. Extensor digitorum longus extends the lateral four toes and also helps dorsiflex the ankle.',
   [requiredList,worksheet,quiz+' · dorsal forearm']),
  31:{...mockExam4Alignment.A[33],figure:'coverings-r5'},
  32:{...mockExam4Alignment.A[31],figure:'coverings-r5'},
  33:{...mockExam4Alignment.A[32],figure:'coverings-r5'},
 },
 B:{
  11:choice('10.2',[4],'Signal from motor neuron to muscle',
   'A motor neuron fires. Which sequence carries that signal toward contraction in its skeletal muscle fibers?',
   'Acetylcholine release → motor end plate depolarizes → muscle action potential enters T-tubules → calcium release from the SR',
   ['Acetylcholine release → calcium release from the SR → motor end plate depolarizes → action potential enters T-tubules',
    'Muscle action potential enters T-tubules → acetylcholine release → motor end plate depolarizes → calcium release from the SR',
    'Calcium release from the SR → motor end plate depolarizes → acetylcholine release → action potential enters T-tubules'],
   'Acetylcholine from the nerve terminal activates receptors on the motor end plate. The ensuing muscle action potential travels into the T-tubules and triggers calcium release from the sarcoplasmic reticulum (SR).',
   [quiz+' · contraction',writtenReview,textbookReview]),
  13:choice('11.5',[1],'Scapular elevation',
   'During a shoulder shrug, which pair of muscles can lift the scapula while the arm stays at the side?',
   'Levator scapulae and upper trapezius',['Pectoralis minor and lower trapezius','Deltoid and supraspinatus','Biceps brachii and brachialis'],
   'Levator scapulae and the upper fibers of trapezius elevate the scapula. Abduction of the humerus involves a different movement at the shoulder.',
   [requiredList,labQuiz+' · shoulder shrug',lab+' · scapula']),
  15:choice('11.3',[1],'Smiling and facial muscle attachments',
   'Which muscle and attachment explain how a smile raises the corner of the mouth?',
   'Zygomaticus major blends with soft tissue at the corner of the mouth',
   ['Masseter attaches to the ramus of the mandible','Orbicularis oculi encircles the eyelids','Temporalis attaches to the coronoid process of the mandible'],
   'Zygomaticus major draws the corner of the mouth upward and laterally. Its attachment lets it move the lips and overlying skin. Masseter and temporalis primarily move the mandible.',
   [requiredList,'Chapter 11 slides · facial expression',labQuiz,writtenReview,textbookReview]),
  25:choice('11.5',[3],'Opposing forearm rotations',
   'With the elbow bent and the upper arm still, a student turns the palm down, then up. Which pair can produce those movements in that order?',
   'Pronator teres, then supinator',['Supinator, then pronator teres','Brachialis, then triceps brachii','Flexor carpi radialis, then extensor carpi radialis longus'],
   'Pronator teres pronates the forearm as the radius crosses the ulna. Supinator returns the radius toward a parallel position. These are radioulnar movements.',
   [requiredList,worksheet,lab+' · pages 7 and 11']),
  29:choice('11.4',[1],'Abdominal wall layers',
   'Which sequence describes the lateral abdominal wall from superficial to deep and gives the main fiber direction in each layer?',
   'External oblique, down and medially → internal oblique, mostly up and medially → transversus abdominis, horizontally',
   ['External oblique, up and medially → internal oblique, mostly down and medially → transversus abdominis, horizontally',
    'Internal oblique, up and medially → transversus abdominis, horizontally → external oblique, down and medially',
    'Transversus abdominis, horizontally → external oblique, down and medially → internal oblique, mostly up and medially'],
   'The external and internal obliques have crossing fiber directions. The deepest layer, transversus abdominis, wraps horizontally. Together the layers compress and support abdominal contents.',
   [requiredList,'Chapter 11 slides · abdominal wall',lab+' · page 3',writtenReview]),
  31:functionalMatch('10.1',[1],'muscle-tissues','Cardiac muscle','Which sample forms the pumping wall of the heart?',
   'Cardiac muscle has branching striated cells, usually with central nuclei. Intercalated discs join neighboring cells.',tissueEvidence),
  32:functionalMatch('10.1',[1],'muscle-tissues','Skeletal muscle','Which sample contains the fibers that a somatic motor neuron activates to move the elbow?',
   'Skeletal muscle has long, striated, multinucleate fibers. Somatic motor neurons activate these fibers at neuromuscular junctions.',tissueEvidence),
  33:functionalMatch('10.1',[1],'muscle-tissues','Smooth muscle','Which sample helps propel food through the intestine?',
   'Smooth muscle in the gut wall produces the contractions of peristalsis. Its spindle-shaped cells lack striations.',tissueEvidence),
  34:functionalMatch('11.5',[2],'shoulder','Supraspinatus','Which deep muscle above the scapular spine assists the start of arm abduction?',
   'Supraspinatus occupies the supraspinous fossa and works with the deltoid to abduct the humerus.',[lab+' · shoulder muscles',requiredList]),
  35:functionalMatch('11.5',[2],'shoulder','Latissimus dorsi','Which broad back muscle draws the raised arm down and back at the shoulder?',
   'Latissimus dorsi extends, adducts and medially rotates the humerus.',[quiz+' · axial muscles',requiredList,worksheet]),
  38:functionalMatch('11.6',[3],'leg','Soleus','Which calf muscle plantar-flexes the ankle without crossing the knee?',
   'Soleus arises from the tibia and fibula and reaches the calcaneus through the calcaneal tendon. It acts at the ankle and has no knee action.',[requiredList,worksheet,lab+' · lower leg']),
  39:functionalMatch('11.6',[2,3],'leg','Gastrocnemius','Which calf muscle can both plantar-flex the ankle and flex the knee?',
   'Gastrocnemius originates on the femur and reaches the calcaneus. Its path crosses both the knee and ankle.',[quiz+' · appendicular muscles',requiredList,worksheet]),
 },
};
