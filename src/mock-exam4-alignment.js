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
