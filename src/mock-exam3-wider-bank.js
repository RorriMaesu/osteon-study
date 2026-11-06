// Additional retrieval practice for gaps explicitly disclosed by Form A.
// These are new, separately identified items; previously saved question snapshots
// and the instructor-pattern Form A remain unchanged.
const deepFreeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const child of Object.values(value))deepFreeze(child);}return value;};
export const MOCK_EXAM3_WIDER_VERSION='2026-11-06.2';

const sections={
 '6.2':'bone-classification','6.4':'bone-formation-and-development',
 '7.2':'the-skull','7.3':'the-vertebral-column',
 '8.2':'bones-of-the-upper-limb','8.4':'bones-of-the-lower-limb','8.5':'development-of-the-appendicular-skeleton',
 '9.4':'synovial-joints','9.7':'development-of-joints'
};
const rows=[
 {
  id:'growth-zones',lesson:'6.4',objective:'6.4.4',topic:'Growth-plate cell activity',gap:'Growth-plate zones and appositional growth',
  prompt:'Which growth-plate zone adds chondrocytes by mitosis, rather than mainly enlarging existing cells?',
  answer:'Proliferative zone',distractors:['Reserve zone','Zone of maturation and hypertrophy','Zone of calcified matrix'],
  explanation:'Proliferation adds chondrocytes. Hypertrophy enlarges them; these activities together support lengthening.',
  noteSuggestion:'Growth plate: proliferation = divide; hypertrophy = enlarge.',locator:'How Bones Grow in Length; Figure 6.18'
 },
 {
  id:'appositional-surfaces',lesson:'6.4',objective:'6.4.5',topic:'Growth in bone diameter',gap:'Growth-plate zones and appositional growth',
  prompt:'During appositional growth, which pairing widens the shaft while enlarging its medullary cavity?',
  answer:'Osteoblast deposition outside; osteoclast resorption inside',
  distractors:['Osteoclast resorption outside; osteoblast deposition inside','Osteoblast deposition on both surfaces','Osteoclast resorption on both surfaces'],
  explanation:'Periosteal deposition expands the outer shaft. Resorption along the cavity expands the inner space. This coordinated shape change is modeling.',
  noteSuggestion:'Width: osteoblasts add outside; osteoclasts remove inside.',locator:'How Bones Grow in Diameter; Bone Remodeling'
 },
 {
  id:'bone-shape',lesson:'6.2',objective:'6.2.1',topic:'Shape versus absolute size',gap:'All bone-shape/function distinctions',
  prompt:'A finger phalanx is small but has an elongated shaft. How is it classified, and why?',
  answer:'Long bone, because its shape is longer than it is wide',
  distractors:['Short bone, because its overall size is small','Flat bone, because it lies in the hand','Sesamoid bone, because it is near a tendon'],
  explanation:'Bone categories describe shape. Phalanges are long bones despite their small size; typical carpals have the roughly cuboid shape of short bones.',
  noteSuggestion:'Long describes shape, not size: phalanges count as long bones.',locator:'Long Bones; Short Bones'
 },
 {
  id:'olfactory-openings',lesson:'7.2',objective:'7.2.7',topic:'Skull opening and function',gap:'Every required skull opening and suture',
  prompt:'Small sensory branches from the nasal olfactory region pass into the cranial cavity through which opening?',
  answer:'Olfactory foramina in the ethmoid cribriform plate',
  distractors:['Optic canal in the sphenoid','Carotid canal in the temporal bone','Foramen magnum in the occipital bone'],
  explanation:'The perforated cribriform plate forms part of the nasal roof and transmits olfactory branches. The neighboring crista galli is a projection, not their passage.',
  noteSuggestion:'Cribriform plate/olfactory foramina = smell; crista galli = attachment.',locator:'Ethmoid Bone; Figures 7.11–7.12'
 },
 {
  id:'secondary-curves',lesson:'7.3',objective:'7.3.2',topic:'Postnatal spinal curves',gap:'Spinal curves, intervertebral discs and foramina',
  prompt:'Which spinal curves develop as an infant holds the head upright and later begins standing and walking, respectively?',
  answer:'Cervical, then lumbar',distractors:['Thoracic, then sacrococcygeal','Lumbar, then cervical','Sacrococcygeal, then thoracic'],
  explanation:'Cervical and lumbar curves develop after birth. Thoracic and sacrococcygeal curves retain the fetal curvature and are primary curves.',
  noteSuggestion:'Secondary: cervical/head control; lumbar/standing. Primary: thoracic + sacral.',locator:'Curvatures of the Vertebral Column; Figure 7.20'
 },
 {
  id:'disc-structure',lesson:'7.3',objective:'7.3.4',topic:'Disc core and outer ring',gap:'Spinal curves, intervertebral discs and foramina',
  prompt:'In the textbook example of a herniated intervertebral disc, which material protrudes through which weakened structure?',
  answer:'Nucleus pulposus through the anulus fibrosus',
  distractors:['Anulus fibrosus through the nucleus pulposus','Articular cartilage through the vertebral body','Nucleus pulposus through the spinous process'],
  explanation:'The hydrated nucleus is the softer core; the anulus is its fibrous outer ring. A posterior bulge can compress a nearby exiting spinal nerve.',
  noteSuggestion:'Disc: anulus = outer ring; nucleus = hydrated core. Herniation can compress a nerve.',locator:'Intervertebral Discs; Figures 7.24 and 7.30'
 },
 {
  id:'elbow-process-fossa',lesson:'8.2',objective:'8.2.2',topic:'Process versus receiving fossa',gap:'The complete required limb-landmark list',
  prompt:'When the elbow fully extends, which process enters which receiving depression?',
  answer:'Ulna olecranon process into humeral olecranon fossa',
  distractors:['Ulna coronoid process into humeral coronoid fossa','Radial head into humeral radial fossa','Humeral trochlea into the radial notch of the ulna'],
  explanation:'The olecranon enters the posterior humeral fossa during extension. The coronoid and radial fossae accommodate the forearm structures during flexion.',
  noteSuggestion:'Elbow extension: ulna olecranon → humeral olecranon fossa.',locator:'Humerus; Ulna; Figures 8.5–8.6'
 },
 {
  id:'ankle-weight-path',lesson:'8.4',objective:'8.4.2',topic:'Ankle articulation and load',gap:'The complete required limb-landmark list',
  prompt:'Which tarsal bone receives body weight directly from the distal tibia at the ankle joint?',
  answer:'Talus',distractors:['Calcaneus','Navicular','Cuboid'],
  explanation:'The distal tibia articulates with the talus. The calcaneus lies beneath the talus; it does not receive this load through a direct tibia–calcaneus articulation.',
  noteSuggestion:'Ankle: tibia → talus; talus sits on calcaneus.',locator:'Tarsal Bones; Figure 8.19'
 },
 {
  id:'limb-rotation',lesson:'8.5',objective:'8.5.1',topic:'Embryonic limb rotation',gap:'Limb development',
  prompt:'Which developmental rotations help place the thumb laterally and the great toe medially?',
  answer:'Upper limb laterally; lower limb medially',
  distractors:['Upper limb medially; lower limb laterally','Both limbs laterally','Both limbs medially'],
  explanation:'The limb buds begin with similar orientations, then rotate in opposite directions. This helps explain the different adult thumb and great-toe positions.',
  noteSuggestion:'Embryonic rotation: upper limb lateral; lower limb medial.',locator:'Limb Growth'
 },
 {
  id:'wrist-joint-type',lesson:'9.4',objective:'9.4.3',topic:'Joint shape and movement',gap:'All synovial types and movement pairs',
  prompt:'The radiocarpal wrist permits flexion/extension and abduction/adduction. Which synovial type matches these two main movement axes?',
  answer:'Condyloid',distractors:['Hinge','Pivot','Ball-and-socket'],
  explanation:'The radiocarpal joint is biaxial and condyloid. Hinge and pivot types are uniaxial; ball-and-socket joints are multiaxial.',
  noteSuggestion:'Radiocarpal = condyloid, biaxial; thumb CMC = saddle.',locator:'Condyloid Joint; Figure 9.10'
 },
 {
  id:'bursa-tendon-sheath',lesson:'9.4',objective:'9.4.2',topic:'Friction-reducing structures',gap:'Bursae and tendon sheaths',
  prompt:'Which comparison gives a shared role of bursae and tendon sheaths and a distinguishing feature?',
  answer:'Both reduce friction; a tendon sheath surrounds a tendon',
  distractors:['Both resist bone separation; a tendon sheath connects two bones','Both improve joint congruence; a bursa is a cartilage pad','Both cover bone ends; a tendon sheath encloses the joint cavity'],
  explanation:'Both contain lubricating fluid and reduce friction. A tendon sheath wraps around a tendon; neither is the tendon itself.',
  noteSuggestion:'Bursa = friction cushion; tendon sheath = lubricated wrap around tendon.',locator:'Bursae and Tendon Sheaths; Figure 9.9'
 },
 {
  id:'joint-interzone',lesson:'9.7',objective:'9.7.2',topic:'Formation of a joint cavity',gap:'All selected joints and joint embryology',
  prompt:'In the supplied textbook model, what happens at the center of the joint interzone between adjacent cartilage models?',
  answer:'Cells are removed to create the future joint cavity',
  distractors:['Cells become the shaft’s primary ossification center','Cells form an uninterrupted bony bridge between the models','Cells form the outer periosteum of both shafts'],
  explanation:'The textbook describes central interzone cell loss creating the cavity. Surrounding mesenchyme contributes the capsule and supporting ligaments.',
  noteSuggestion:'Joint interzone: center → cavity; surrounding mesenchyme → capsule/ligaments.',locator:'Development of Joints; joint interzone account'
 }
];

export const mockExam3WiderQuestions=deepFreeze(rows.map((row,index)=>({
 id:`exam3-wider-${row.id}`,number:index+1,contentVersion:MOCK_EXAM3_WIDER_VERSION,formId:'exam3-wider',
 chapter:Number(row.lesson.split('.')[0]),lesson:row.lesson,topic:row.topic,objectives:[row.objective],
 type:'choice',section:'mc',points:1,prompt:row.prompt,answer:row.answer,distractors:row.distractors,
 options:[row.answer,...row.distractors].map((text,i)=>({id:'abcd'[i],text})),
 explanation:row.explanation,noteSuggestion:row.noteSuggestion,family:`exam3-wider-${row.id}`,coverageGap:row.gap,
 source:`OpenStax A&P 2e §${row.lesson} · broader chapters 6–9 preparation; ${row.locator}.`,
 evidence:[{id:`exam3-wider-source-${row.id}`,kind:'textbook-extension',locator:`OpenStax §${row.lesson}: ${row.locator}. Samples a disclosed Form A gap; not additional evidence of instructor selection.`}],
 sourceLinks:[{label:`OpenStax §${row.lesson}`,lesson:row.lesson,url:`https://openstax.org/books/anatomy-and-physiology-2e/pages/${row.lesson.replace('.','-')}-${sections[row.lesson]}`}],
 reviewTopicIds:[],boneQuestionIds:[],relatedQuestionIds:[],practiceOnly:true
})));

export const mockExam3WiderForm=deepFreeze({
 id:'exam3-wider',version:MOCK_EXAM3_WIDER_VERSION,title:'Beyond Form A · wider coverage',
 ids:mockExam3WiderQuestions.map(q=>q.id),questionIds:mockExam3WiderQuestions.map(q=>q.id),
 maxPoints:12,sections:[{id:'mc',title:'Connect the wider course',label:'Multiple choice',count:12,points:12}],
 chapterPoints:{6:3,7:3,8:3,9:3},requiresDiagrams:false,defaultTiming:'untimed',
 description:'Twelve additional retrieval questions sample important topics omitted or lightly assessed in Form A.',
 formatNotice:'This is a separate 12-point practice set, not a second predicted exam or complete chapter coverage.',
 gradingNotice:'Authored objective keys award one point per question. This is practice feedback, not an instructor grade.'
});
