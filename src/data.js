// Canonical concepts transcribed from the supplied BI 231 lab 6/7 structure list.
// A match is a complete selectable structure, not an inferred landmark location.
const rows = `
Spine|region||Cervical curvature|Secondary curve of the neck; develops as the infant holds the head up.
Spine|region||Thoracic curvature|Primary curve; its convexity faces posteriorly.
Spine|region||Lumbar curvature|Secondary curve associated with standing and walking.
Spine|bone|Vertebra C|Cervical vertebrae|Seven vertebrae, C1–C7; typical cervical vertebrae have transverse foramina.
Spine|bone|Atlas (C1)|Atlas C1|Ring-shaped first cervical vertebra; supports the occipital condyles and lacks a body.
Spine|landmark|Atlas (C1)|Superior articular facet of atlas|Receives an occipital condyle; helps permit the nodding movement.
Spine|bone|Axis (C2)|Axis C2|The second cervical vertebra provides the pivot for rotation at the atlas.
Spine|landmark|Axis (C2)|Dens|Superior projection of the axis around which the atlas rotates.
Spine|opening|Vertebra C|Transverse foramen|Opening in a cervical transverse process; vertebral arteries usually enter at C6 and ascend through C1.
Spine|vessel|Vertebra C|Vertebral artery|Ascends through most cervical transverse foramina; supplies the posterior circulation of the brain.
Spine|bone|Vertebra T|Thoracic vertebrae|Twelve vertebrae, T1–T12; costal facets articulate with ribs.
Spine|landmark|Vertebra T|Vertebral body|Anterior, weight-bearing portion of a typical vertebra.
Spine|landmark|Vertebra T|Spinous process|Midline posterior projection from the vertebral arch.
Spine|landmark|Vertebra T|Transverse process|Lateral projection from a vertebral arch; typical thoracic transverse processes articulate with rib tubercles.
Spine|landmark|Vertebra T|Superior articular facets|Upward-facing articular surfaces joining the vertebra above.
Spine|landmark|Vertebra T|Inferior articular facets|Articular surfaces joining the vertebra below.
Spine|landmark|Vertebra T|Costal facets|Rib articulation surfaces on thoracic vertebrae; arrangement varies by level.
Spine|landmark|Vertebra T|Lamina|Posterior part of the vertebral arch between transverse and spinous processes.
Spine|landmark|Vertebra T|Pedicles|Short bridges from a vertebral body to its arch.
Spine|opening|Vertebra|Vertebral canal|Continuous canal formed by successive vertebral foramina; houses the spinal cord and associated tissues.
Spine|opening|Vertebra|Intervertebral foramen|Lateral opening between adjacent vertebrae through which a spinal nerve exits.
Spine|bone|Vertebra L|Lumbar vertebrae|Five vertebrae, L1–L5, with large bodies adapted for substantial loads.
Spine|bone|Sacrum|Sacrum|Five fused sacral vertebrae form a single adult bone.
Spine|bone|Coccyx|Coccyx|Usually four fused coccygeal vertebrae; three to five is a common range.
Spine|tissue|Vertebra|Intervertebral discs|Fibrocartilaginous joints between vertebral bodies; the annulus surrounds the nucleus.
Spine|tissue|Vertebra|Nucleus pulposus|Gelatinous center of an intervertebral disc; a remnant of the notochord.
Spine|tissue|Vertebra|Annulus fibrosus|Tough outer fibrocartilage ring of an intervertebral disc.
Thorax|bone|Hyoid bone|Hyoid bone|U-shaped neck bone that supports the tongue and has no direct articulation with another bone.
Thorax|ligament|Hyoid bone|Stylohyoid ligament|Connects the temporal styloid process with the hyoid.
Thorax|bone| rib|Ribs|Twelve pairs; all attach posteriorly to thoracic vertebrae.
Thorax|bone|true ribs|True ribs|Pairs 1–7 attach to the sternum through their own costal cartilage.
Thorax|bone|false ribs|False ribs|Pairs 8–12 lack their own direct sternal cartilage attachment; 11–12 are also floating.
Thorax|bone|floating ribs|Floating ribs|Pairs 11–12 have no anterior attachment to the sternum.
Thorax|bone|sternum|Sternum|Anterior midline flat bone made up of manubrium, body and xiphoid process.
Thorax|bone|Manubrium of sternum|Manubrium|Superior portion of the sternum; articulates with the clavicles.
Thorax|landmark|Manubrium of sternum|Jugular notch|Superior midline notch of the manubrium, between the clavicular notches.
Thorax|bone|Body of sternum|Body of sternum|Long central portion of the sternum.
Thorax|bone|Xiphoid process|Xiphoid process|Inferior portion of the sternum; often remains cartilaginous until later adulthood.
Skull|bone|Frontal bone|Frontal bone|Forms the forehead, orbital roof and much of the anterior cranial fossa.
Skull|cavity|Sinus of frontal bone|Frontal sinus|Paranasal air space within the frontal bone; the model shows the sinus volume.
Skull|bone|Parietal bone|Parietal bones|Paired bones forming much of the superior and lateral cranium.
Skull|suture|Frontal bone|Coronal suture|Joins the frontal bone to the parietal bones.
Skull|suture|Parietal bone|Sagittal suture|Midline joint between the right and left parietal bones.
Skull|development||Fontanelles|Fibrous gaps between incompletely ossified infant skull bones; absent from this adult specimen.
Skull|bone|Temporal bone|Temporal bones|Paired lateral skull bones; contain hearing structures and the mandibular fossae.
Skull|landmark|Temporal bone|Mandibular fossa|Temporal-bone depression receiving the mandibular condyle at the temporomandibular joint.
Skull|opening|Temporal bone|External acoustic meatus|External ear canal opening in the temporal bone.
Skull|landmark|Temporal bone|Mastoid process|Rounded projection posteroinferior to the external acoustic meatus.
Skull|landmark|Temporal bone|Styloid process of temporal bone|Slender inferior projection; attachment site for muscles and ligaments.
Skull|opening|Temporal bone|Carotid canal|Passage through the temporal bone for the internal carotid artery.
Skull|opening|Temporal bone|Jugular foramen|Opening between temporal and occipital bones; transmits the internal jugular vein and cranial nerves IX, X and XI.
Skull|landmark|Temporal bone|Zygomatic process|Temporal-bone projection that helps form the zygomatic arch.
Skull|bone|Occipital bone|Occipital bone|Forms the posterior cranium and surrounds the foramen magnum.
Skull|opening|Occipital bone|Foramen magnum|Large opening connecting the cranial cavity with the vertebral canal.
Skull|landmark|Occipital bone|Occipital condyles|Paired articular surfaces on either side of the foramen magnum; articulate with the atlas.
Skull|suture|Occipital bone|Lambdoid suture|Joins the occipital bone to the parietal bones.
Skull|bone|Sphenoid bone|Sphenoid bone|Central cranial-base bone; contributes to the orbit and all three cranial fossae.
Skull|opening|Sphenoid bone|Optic canal|Passage through the sphenoid for the optic nerve and ophthalmic artery.
Skull|landmark|Sphenoid bone|Sella turcica|Saddle-shaped sphenoid region containing the hypophyseal fossa for the pituitary gland.
Skull|cavity|Sinus of sphenoid bone|Sphenoid sinus|Paranasal air space in the sphenoid body; the model shows the sinus volume.
Skull|bone|Ethmoid bone|Ethmoid bone|Contributes to the nasal cavity, septum, orbit and anterior cranial floor.
Skull|landmark|Ethmoid bone|Cribriform plate|Perforated horizontal ethmoid plate carrying olfactory nerve fibers.
Skull|landmark|Ethmoid bone|Perpendicular plate|Ethmoid contribution to the superior bony nasal septum.
Skull|landmark|Ethmoid bone|Superior and middle nasal conchae|Curved projections of the ethmoid; distinguish them from the separate inferior nasal concha bones.
Skull|cavity|Ethmoid bone|Ethmoidal air cells and sinus openings|Small paranasal air spaces and drainage openings associated with the ethmoid and nasal cavity.
Skull|bone|Maxilla|Maxillae|Paired upper-jaw bones; form the anterior hard palate and part of each orbit.
Skull|landmark|Maxilla|Hard palate|Bony roof of the mouth: maxillary palatine processes anteriorly and palatine horizontal plates posteriorly.
Skull|cavity|Maxilla|Maxillary sinus|Large paranasal air space inside each maxilla; no separate sinus-volume mesh is included.
Skull|landmark|Maxilla|Alveolar arch|Tooth-bearing region of the maxilla containing the dental sockets.
Skull|bone|Zygomatic bone|Zygomatic bones|Cheekbones; contribute to the lateral orbital walls and zygomatic arches.
Skull|bone|Mandible|Mandible|Lower jaw; the freely movable bone of the skull.
Skull|landmark|Mandible|Mandibular condyles|Posterior superior mandibular projections that articulate with temporal mandibular fossae.
Skull|landmark|Mandible|Coronoid process of mandible|Anterior superior projection of the mandibular ramus; temporalis attachment.
Skull|opening|Mandible|Mandibular foramina|Openings on the medial mandibular rami for inferior alveolar nerves and vessels.
Skull|landmark|Mandible|Mandibular symphysis|Anterior midline fusion site of the developing halves of the mandible.
Skull|bone|Palatine bone|Palatine bones|Paired L-shaped bones; their horizontal plates form the posterior hard palate.
Skull|bone|Nasal bone|Nasal bones|Small paired bones forming the bridge of the nose.
Skull|bone|Lacrimal bone|Lacrimal bones|Small bones on the medial orbital walls near tear drainage structures.
Skull|bone|Vomer|Vomer|Unpaired bone forming the inferior posterior bony nasal septum.
Skull|bone|Inferior nasal concha bone|Inferior nasal conchae|Independent paired bones of the lateral nasal walls; not parts of the ethmoid.
Upper limb|bone|Clavicle|Clavicles|S-shaped struts linking sternum and scapulae; the upper limbs' bony connection to the axial skeleton.
Upper limb|bone|Scapula|Scapulae|Flat triangular shoulder blades on the posterior thorax.
Upper limb|landmark|Scapula|Coracoid process|Anterior hooklike scapular projection, near the glenoid cavity.
Upper limb|landmark|Scapula|Acromion|Lateral expansion of the scapular spine; articulates with the clavicle.
Upper limb|landmark|Scapula|Scapular spine|Posterior ridge separating supraspinous and infraspinous fossae.
Upper limb|landmark|Scapula|Glenoid cavity|Shallow lateral scapular socket receiving the humeral head.
Upper limb|landmark|Scapula|Subscapular fossa|Broad concavity on the anterior, costal surface of the scapula.
Upper limb|landmark|Scapula|Supraspinous fossa|Posterior scapular depression above the spine.
Upper limb|landmark|Scapula|Infraspinous fossa|Posterior scapular depression below the spine.
Upper limb|landmark|Scapula|Acromioclavicular facet|Articular surface on the acromion for the lateral clavicle.
Upper limb|landmark|Scapula|Medial border of scapula|Vertebral border, nearest the spine; corrected from the lab spelling “boarder.”
Upper limb|bone|Humerus|Humeri|Bones of the arms between shoulder and elbow; the head is proximal and medial.
Upper limb|landmark|Humerus|Head of humerus|Proximal rounded articular surface that joins the glenoid cavity.
Upper limb|landmark|Humerus|Anatomical neck of humerus|Groove immediately surrounding the humeral head.
Upper limb|landmark|Humerus|Shaft of humerus|Diaphysis of the humerus.
Upper limb|landmark|Humerus|Greater tubercle|Large lateral proximal humeral projection for muscle attachment.
Upper limb|landmark|Humerus|Lesser tubercle|Smaller anterior proximal humeral projection.
Upper limb|landmark|Humerus|Medial epicondyle of humerus|Distal medial projection; the ulnar nerve passes posterior to it.
Upper limb|landmark|Humerus|Lateral epicondyle of humerus|Distal lateral projection above the capitulum.
Upper limb|landmark|Humerus|Capitulum|Rounded lateral distal humeral articular surface for the radius.
Upper limb|landmark|Humerus|Trochlea|Medial spool-shaped distal humeral articular surface for the ulna.
Upper limb|landmark|Humerus|Ulnar nerve sulcus|Groove posterior to the medial epicondyle of the humerus.
Upper limb|landmark|Humerus|Olecranon fossa|Posterior distal humeral depression receiving the olecranon during extension.
Upper limb|landmark|Humerus|Radial nerve sulcus|Oblique groove on the posterior humeral shaft for the radial nerve.
Upper limb|bone|Radius|Radii|Lateral forearm bones on the thumb side in anatomical position.
Upper limb|landmark|Radius|Head of radius|Proximal disc-shaped surface articulating with capitulum and radial notch of ulna.
Upper limb|landmark|Radius|Styloid process of radius|Distal lateral projection on the thumb side of the wrist.
Upper limb|landmark|Radius|Radial tuberosity|Proximal medial projection distal to the neck; biceps brachii attachment.
Upper limb|bone|Ulna|Ulnae|Medial forearm bones on the little-finger side in anatomical position.
Upper limb|landmark|Ulna|Olecranon|Proximal posterior ulna forming the point of the elbow.
Upper limb|landmark|Ulna|Styloid process of ulna|Distal ulnar projection at the medial wrist.
Upper limb|landmark|Ulna|Trochlear notch|Large proximal ulnar notch that receives the humeral trochlea.
Upper limb|bone|carpals|Carpus|Eight carpal bones form each wrist; the lab specifically names scaphoid and pisiform.
Upper limb|bone|Scaphoid bone|Scaphoids|Proximal-row carpals on the thumb side.
Upper limb|bone|Pisiform bone|Pisiforms|Pea-shaped sesamoid carpals on the palmar side of the triquetrum.
Upper limb|opening|carpals|Carpal tunnel|Passage between carpal arch and flexor retinaculum carrying the median nerve and flexor tendons.
Upper limb|bone|metacarpal|Metacarpals|Five bones in each palm, numbered I–V from thumb to little finger.
Upper limb|bone|Proximal phalanx of.*hand|Proximal phalanges of hand|First phalanges of all five digits; articulate with metacarpal heads.
Upper limb|bone|Middle phalanx of.*hand|Middle phalanges of hand|Intermediate phalanges of fingers II–V; absent in the thumb.
Upper limb|bone|Distal phalanx of.*hand|Distal phalanges of hand|Terminal phalanges at the fingertips, including the thumb.
Upper limb|term|Proximal phalanx of first finger of hand|Pollex|Anatomical name for the thumb; digit I, with two phalanges.
Pelvis|region|Hip bone|Pelvis|Bony ring formed by two hip bones with the sacrum; the coccyx is associated inferiorly.
Pelvis|opening|Sacrum|Sacral foramina|Paired openings on anterior and posterior surfaces of the sacrum for sacral nerve branches.
Pelvis|landmark|Sacrum|Auricular surface of sacrum|Ear-shaped lateral sacral surface that articulates with the ilium.
Pelvis|bone region|Hip bone|Ilium|Superior flared part of the hip bone; fused with ischium and pubis in the adult.
Pelvis|landmark|Hip bone|Iliac crest|Thick superior margin of the ilium.
Pelvis|landmark|Hip bone|Greater sciatic notch|Posterior notch of the ilium superior to the ischial spine.
Pelvis|landmark|Hip bone|Pelvic brim|Bony boundary of the pelvic inlet separating greater and lesser pelvis.
Pelvis|landmark|Hip bone|Acetabulum|Lateral hip socket formed by ilium, ischium and pubis; receives the femoral head.
Pelvis|bone region|Hip bone|Ischium|Posteroinferior part of a hip bone.
Pelvis|landmark|Hip bone|Ischial tuberosity|Large inferior posterior projection that bears weight when seated.
Pelvis|bone region|Hip bone|Pubis|Anterior part of a hip bone.
Pelvis|joint|Hip bone|Pubic symphysis|Midline fibrocartilaginous joint connecting the pubic bones.
Lower limb|bone|Femur|Femora|Thigh bones; proximal heads articulate with acetabula, distal condyles with tibiae.
Lower limb|landmark|Femur|Head of femur|Medially directed proximal ball that joins the acetabulum.
Lower limb|landmark|Femur|Neck of femur|Narrow segment between femoral head and shaft/trochanter region.
Lower limb|landmark|Femur|Greater trochanter|Large lateral proximal femoral projection.
Lower limb|landmark|Femur|Lesser trochanter|Smaller posteromedial proximal femoral projection.
Lower limb|landmark|Femur|Medial epicondyle of femur|Projection above the medial femoral condyle; distinguish from its articular surface.
Lower limb|landmark|Femur|Lateral epicondyle of femur|Projection above the lateral femoral condyle.
Lower limb|bone|Tibia|Tibiae|Large medial leg bones; transmit body weight from femur to talus.
Lower limb|landmark|Tibia|Tibial tuberosity|Anterior proximal tibial prominence; patellar ligament insertion.
Lower limb|landmark|Tibia|Anterior border of tibia|Palpable sharp ridge along the shin.
Lower limb|landmark|Tibia|Medial malleolus|Distal tibial projection forming the medial ankle prominence.
Lower limb|bone|Fibula|Fibulae|Slender lateral leg bones; do not directly articulate with the femur.
Lower limb|landmark|Fibula|Lateral malleolus|Distal fibular projection forming the lateral ankle prominence.
Lower limb|bone|tarsals|Tarsus|Seven tarsal bones in each ankle/proximal foot.
Lower limb|bone|Talus|Tali|Tarsal bones receiving body weight from the tibiae.
Lower limb|bone|Calcaneus|Calcanei|Heel bones, posterior and inferior to the tali.
Lower limb|bone|metatarsal|Metatarsals|Five bones of each midfoot, numbered I–V from the great-toe side.
Lower limb|bone|Proximal phalanx of.*foot|Proximal phalanges of foot|First phalanges of all five toes.
Lower limb|bone|Middle phalanx of.*foot|Middle phalanges of foot|Intermediate phalanges of toes II–V; absent in the great toe.
Lower limb|bone|Distal phalanx of.*foot|Distal phalanges of foot|Terminal phalanges of all five toes.
Lower limb|term|Proximal phalanx of first finger of foot|Hallux|The great toe, digit I, with two phalanges.
Joints|ligament||Coracoclavicular ligament|Connects the coracoid process to the clavicle; includes conoid and trapezoid parts. Shoulder: muscle-test extension.
Joints|ligament||Acromioclavicular ligament|Reinforces the joint between acromion and clavicle. Shoulder: muscle-test extension.
Joints|ligament||Glenohumeral ligaments|Capsular thickenings spanning the anterior glenohumeral joint. Shoulder: muscle-test extension.
Joints|ligament||Coracohumeral ligament|Extends from the coracoid to the proximal humerus. Shoulder: muscle-test extension.
Joints|ligament||Ligament of head of femur|Ligamentum capitis femoris / ligamentum teres; joins the femoral head to the acetabulum. Hip: bone test.
Joints|ligament||Iliofemoral ligament|Strong anterior hip-capsule ligament resisting hyperextension. Hip: bone test.
Joints|ligament||Medial collateral ligament|Tibial collateral ligament; medial knee reinforcement and resistance to valgus stress. Knee: bone test.
Joints|ligament||Lateral collateral ligament|Fibular collateral ligament; lateral knee reinforcement and resistance to varus stress. Knee: bone test.
Joints|ligament||Anterior cruciate ligament|ACL; resists anterior translation of the tibia relative to the femur. Knee: bone test.
Joints|ligament||Posterior cruciate ligament|PCL; resists posterior translation of the tibia relative to the femur. Knee: bone test.
Joints|test||Anterior drawer|Anterior tibial translation tests ACL restraint; excessive movement can suggest loss of restraint. Study concept, not a self-diagnosis tool.
Joints|test||Posterior drawer|Posterior tibial translation tests PCL restraint; excessive movement can suggest loss of restraint. Study concept, not a self-diagnosis tool.
Joints|ligament||Patellar ligament|Continuation from patella to tibial tuberosity; transmits quadriceps force at the knee. Knee: bone test.
`.trim();

export const terms = rows.split('\n').map((r, i) => {
  const [region,type,pattern,name,cue] = r.split('|');
  const id = name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/-$/,'');
  return {id,region,type,pattern,name,cue,source:region==='Joints'?'Lab 7 · joint extension': ['Upper limb','Lower limb','Pelvis'].includes(region)?'Lab 7 · appendicular':'Lab 6 · axial',exact:type==='bone'||(type==='cavity'&&pattern.startsWith('Sinus of')),aliases:[]};
});
const aliases = {
 'Annulus fibrosus':['annulus fibrosis'], 'Nucleus pulposus':['nucleus pulposis'],
 'Mandibular fossa':['temporal mandibular fossa'], 'Medial border of scapula':['vertebral border','vertebral boarder'],
 'Pollex':['thumb'], 'Hallux':['great toe','big toe'], 'Fontanelles':['fontanels'], 'Optic canal':['optic foramen'],
 'Ligament of head of femur':['ligamentum capitis','ligamentum teres'],
 'Medial collateral ligament':['tibial collateral ligament','MCL'], 'Lateral collateral ligament':['fibular collateral ligament','LCL'],
 'Anterior cruciate ligament':['ACL'], 'Posterior cruciate ligament':['PCL'], 'Atlas C1':['atlas','C1'], 'Axis C2':['axis','C2'],
 'Maxillae':['maxillary','maxilla'], 'Humeri':['humerus'], 'Radii':['radius'], 'Ulnae':['ulna'], 'Femora':['femur'], 'Tibiae':['tibia'], 'Fibulae':['fibula'], 'Tali':['talus'], 'Calcanei':['calcaneus'],
 'Parietal bones':['parietal'], 'Temporal bones':['temporal'], 'Scapulae':['scapula'], 'Scaphoids':['scaphoid'], 'Pisiforms':['pisiform']
};
terms.forEach(t=>t.aliases=aliases[t.name]||[]);
const numbers=['First','Second','Third','Fourth','Fifth'];
numbers.forEach((n,i)=> ['metacarpal','metatarsal'].forEach(kind=>terms.push({id:`${kind}-${i+1}`,name:`${kind==='metacarpal'?'Metacarpal':'Metatarsal'} ${i+1}`,region:kind==='metacarpal'?'Upper limb':'Lower limb',type:'bone',pattern:`${n} ${kind} bone`,cue:`Digit ${i+1}: numbered from the ${kind==='metacarpal'?'thumb':'great-toe'} side in anatomical position.`,source:'Lab 7 · numbered bones',exact:true,aliases:[`${kind} ${['I','II','III','IV','V'][i]}`]})));
// Supplementary bones complete the selectable skeleton without changing the course checklist.
export const supplement = [
 ['Patella','Lower limb','Patella','Sesamoid bone within the quadriceps tendon; articulates with the femur.'],
 ['Capitate','Upper limb','Capitate bone','Largest carpal; distal row near the center of the wrist.'],
 ['Hamate','Upper limb','Hamate bone','Distal-row carpal on the little-finger side; has a palmar hook.'],
 ['Lunate','Upper limb','Lunate bone','Proximal-row carpal between scaphoid and triquetrum.'],
 ['Triquetrum','Upper limb','Triquetrum bone','Proximal-row carpal on the ulnar side; pisiform lies anterior to it.'],
 ['Trapezium','Upper limb','Trapezium bone','Distal-row carpal articulating with the first metacarpal.'],
 ['Trapezoid','Upper limb','Trapezoid bone','Distal-row carpal articulating with the second metacarpal.'],
 ['Navicular','Lower limb','Navicular bone','Medial tarsal anterior to the talus.'],
 ['Cuboid','Lower limb','Cuboid bone','Lateral tarsal anterior to the calcaneus.'],
 ['Medial cuneiform','Lower limb','Medial cuneiform bone','Tarsal articulating with the first metatarsal.'],
 ['Intermediate cuneiform','Lower limb','Intermediate cuneiform bone','Small central cuneiform articulating with the second metatarsal.'],
 ['Lateral cuneiform','Lower limb','Lateral cuneiform bone','Cuneiform articulating with the third metatarsal.'],
 ['Malleus','Skull','Malleus','Hammer-shaped auditory ossicle.'], ['Incus','Skull','Incus','Anvil-shaped auditory ossicle.'], ['Stapes','Skull','Stapes','Stirrup-shaped auditory ossicle at the oval window.'],
 ['Hip bones','Pelvis','Hip bone','Each adult hip bone is formed by fusion of ilium, ischium and pubis.']
].map(([name,region,pattern,cue])=>({id:name.toLowerCase().replaceAll(' ','-'),name,region,pattern,cue,type:'bone',exact:true,source:'Supplement · full atlas',aliases:[]}));
export const allTerms=[...terms,...supplement];
export const regions=['All regions','Skull','Spine','Thorax','Upper limb','Pelvis','Lower limb','Joints'];

export function matches(pattern,zname) {
 if(!pattern)return false;
 if(pattern.includes('||'))return pattern.split('||').some(p=>matches(p,zname));
 const base=zname.replace(/\.[lr]$/,'');
 const ord='(?:First|Second|Third|Fourth|Fifth|Sixth|Seventh|Eighth|Ninth|Tenth|Eleventh|Twelfth)';
 if(pattern===' rib')return new RegExp(`^${ord} rib$`,'i').test(base);
 if(pattern.endsWith('ribs')) {
  const n=['First','Second','Third','Fourth','Fifth','Sixth','Seventh','Eighth','Ninth','Tenth','Eleventh','Twelfth'].findIndex(x=>base===`${x} rib`)+1;
  return n>0&&(pattern==='true ribs'?n<=7:pattern==='false ribs'?n>=8:n>=11);
 }
 if(pattern==='sternum')return /^(Manubrium of sternum|Body of sternum|Xiphoid process)$/.test(base);
 if(pattern==='carpals')return /^(Scaphoid|Lunate|Triquetrum|Pisiform|Trapezium|Trapezoid|Capitate|Hamate) bone$/.test(base);
 if(pattern==='tarsals')return /^(Talus|Calcaneus|Navicular bone|Cuboid bone|Medial cuneiform bone|Intermediate cuneiform bone|Lateral cuneiform bone)$/.test(base);
 if(pattern==='metacarpal'||pattern==='metatarsal')return new RegExp(`^${ord} ${pattern} bone$`).test(base);
 if(pattern==='Vertebra C')return /^(Vertebra C\d+|Atlas \(C1\)|Axis \(C2\))$/.test(base);
 if(pattern==='Vertebra T'||pattern==='Vertebra L')return base.startsWith(pattern);
 if(pattern==='Vertebra')return /^(Vertebra [CTL]\d+|Atlas \(C1\)|Axis \(C2\))$/.test(base);
 if(pattern.includes('.*'))return new RegExp(`^${pattern}$`).test(base);
 return base===pattern;
}
