// Keep each earlier incorrect option as an allowed saved-session snapshot.
// Correct answers and their grading semantics are unchanged.
export const distractorRevisions={
 'ex-6.1-1':['A living epithelial tissue with a mineralized surface covering','A living muscular tissue with a collagen-rich contractile matrix','A nonliving connective framework whose matrix cannot be renewed'],
 'ex-6.3-7':['Compact bone has vascular osteons; spongy bone receives nutrients only from joint fluid','Compact bone contains mineral salts; spongy bone contains only unmineralized collagen','Compact bone has a trabecular marrow network; spongy bone has densely packed complete osteons'],
 'ex-6.4-12':['It decreases the cavity while new bone expands inward from the endosteum','It replaces the shaft with cartilage while external mineral is removed','It closes the cavity so all newly deposited bone remains as a solid shaft'],
 'ex-7.2-15':['They supply a smooth channel that prevents air contacting the nasal mucosa','They prevent changes in air direction by separating airflow from mucosal surfaces','They keep inspired air away from the vascular lining until it reaches the pharynx'],
 'ex-7.3-8':['Axis C2','Thoracic T1','Lumbar L5'],
 'ex-7.4-1':['Cervical vertebrae, clavicles, scapulae and the proximal humeri','Lumbar vertebrae, hip bones, sacrum and the proximal femora','Thoracic vertebrae, clavicles, humeri and the first carpal row'],
 'ex-7.5-5':['They replace the neural tube and become the conducting tissue of the spinal cord','They remain inside the notochord and form the membranes lining each joint cavity','They move away from the central axis and form the free portions of the developing limbs'],
 'ex-8.1-6':['Anchors the humeral head directly to the sternum and prevents shoulder rotation','Holds the scapula rigidly against the ribs and prevents its movement during elevation','Connects the two shoulder girdles into one immobile ring around the thoracic cage'],
 'ex-8.2-14':['Only the radius has a distal styloid; the ulna has a proximal one instead','Only the ulna has a distal styloid; the radius has a proximal one instead','Both styloids belong to the distal humerus rather than the forearm bones'],
 'ex-9.1-6':['Flexion and extension about a transverse axis','Abduction and adduction about a second axis','Circumduction through combined angular movements'],
 'ex-9.2-1':['Bones joined by hyaline cartilage, usually without a joint cavity','Bones joined through a fibrocartilage pad between their surfaces','Bones separated by a fluid-filled cavity within an articular capsule'],
 'ex-9.2-6':['Glenohumeral connection between the humeral head and glenoid cavity','Midline connection between the two pubic bones through fibrocartilage','First sternocostal connection between costal cartilage and manubrium'],
 'ex-9.4-1':['Fibrocartilage directly joining adjacent bones without a cavity','Hyaline cartilage connecting a shaft and epiphysis during growth','Dense fibrous tissue securing a tooth root within its alveolar socket'],
 'ex-9.4-12':['A labrum is a central articular pad; a meniscus is an outer socket rim','A labrum is the fluid-producing membrane; a meniscus is the fibrous capsule','A labrum is hyaline growth-plate cartilage; a meniscus is a tendon sleeve'],
 'ex-9.5-8':['Humeroulnar and humeroradial articulations without either radioulnar joint','Radiocarpal and intercarpal articulations without either radioulnar joint','Metacarpophalangeal and interphalangeal articulations without the forearm joints'],
 'ex-9.6-5':['Flexion/extension only, with no abduction, adduction or axial rotation','Abduction/adduction only, with no flexion, extension or axial rotation','Pronation/supination only, with no angular movement of either limb'],
 'ex-9.6-12':['Shallower socket and less enclosure by the surrounding capsular ligaments','Greater reliance on a loose capsule and less coverage of the articular head','Absence of supporting ligaments and a freely exposed articular femoral head'],
 'ex-9.7-6':['Every broad fontanelle turns into a freely movable synovial cavity','Closure removes the need for skull growth and eliminates every suture','Each fontanelle persists unchanged as a permanent adult paranasal sinus']
};
export function reviseDistractors(question){const next=distractorRevisions[question.id];return next?{...question,legacyDistractors:[...question.distractors],distractors:next}:question;}
