const textbook='https://openstax.org/books/anatomy-and-physiology-2e/pages/';
const axial='11-3-axial-muscles-of-the-head-neck-and-back';
const upper='11-5-muscles-of-the-pectoral-girdle-and-upper-limbs';
const lower='11-6-appendicular-muscles-of-the-pelvic-girdle-and-lower-limbs';
const guide=(id,label,joint,axis,scope,view,note,section,options={})=>({
 id,label,joint,axis,scope,view,note,source:textbook+section,...options,
});

export const motionStudyGuides=[
 guide('head-turn','Turn your head','neck','rotation','head-neck','front','Turn right and compare left sternocleidomastoid with right splenius capitis. Switch to Back or Related only for the deep neck.',axial,{range:[-27,27],radius:.19}),
 guide('arm-abduction','Raise your arm sideways','right-shoulder','abduction','right-arm','front','Middle deltoid and supraspinatus move the humerus. Serratus anterior and trapezius help rotate the shoulder blade.',upper,{range:[0,60],rear:true,controlledReturn:'Controlled lowering under gravity. The shoulder abductors can brake the return as they lengthen.'}),
 guide('hip-abduction','Move your leg sideways','right-hip','abduction','right-leg','front','Gluteus medius, gluteus minimus, and tensor fasciae latae help move the free thigh sideways. Related only uncovers deeper muscles.',lower,{range:[0,23]}),
 guide('hip-flexion','Lift the thigh','right-hip','flexion','right-leg','right','Follow iliacus and psoas major toward the lesser trochanter. Rectus femoris also crosses the knee.',lower,{range:[0,40]}),
 guide('hip-extension','Move the thigh back','right-hip','flexion','right-leg','right','Compare gluteus maximus with the hamstrings that cross the hip. The short head of biceps femoris crosses only the knee.',lower,{range:[0,-14],direction:-1}),
 guide('hip-rotation','Turn the thigh in and out','right-hip','rotation','right-leg','lesson','Compare the deep external rotators near neutral. Try Turn a bent thigh to see how hip position changes the roles.',lower,{setup:{'right-hip':{flexion:0}},range:[-14,14]}),
 guide('hip-rotation-flexed','Turn a bent thigh','right-hip','rotation','right-leg','lesson','Play the comparison to flex the hip and turn the thigh. Piriformis can assist internal rotation in deep flexion.',lower,{setup:{'right-hip':{flexion:82},'right-knee':{flexion:60}},range:[-14,14]}),
 guide('upper-neck-nod','Nod at the atlas','upper-nod','flexion','head-neck','side','Watch the skull tilt on C1 while the cervical vertebrae stay still. Compare this with bending the whole neck.',axial,{range:[-5,5],radius:.12}),
 guide('trunk-turn','Turn the trunk','trunk','rotation','trunk','lesson','The external oblique on the opposite side and the internal oblique on the same side can cooperate during rotation. This view uses the lumbar rig.','11-4-axial-muscles-of-the-abdominal-wall-and-thorax'),
 guide('finger-spread','Spread the index finger','right-index-mcp','abduction','right-arm','front','Compare dorsal and palmar interossei with the finger near straight. The atlas groups some of the individual muscles.',upper,{radius:.075}),
 guide('great-toe','Lift your great toe','right-hallux','extension','right-leg','right','Watch the first metatarsophalangeal joint while the other toes stay still. Compare the long and short great-toe extensors.',lower,{range:[0,24],radius:.09}),
 guide('jaw-side','Slide the jaw sideways','jaw','excursion','head-neck','front','When the jaw moves right, the left condyle glides forward. Examine both sides in a small excursion.',axial,{range:[-4,4],radius:.12}),
 guide('jaw-forward','Slide the jaw forward','jaw','protrusion','head-neck','side','Follow both mandibular condyles as they glide forward together. Rotate the view to compare the lateral pterygoids.',axial,{range:[0,80],radius:.12}),
 guide('scaption','Raise the arm diagonally','right-shoulder','scaption','right-arm','lesson','Compare this diagonal raise with the sideways raise. The upper arm and shoulder blade both move.',upper,{range:[0,55],rear:true,returnLabel:'Controlled lowering',controlledReturn:'The shoulder elevators can control the arm as it lowers under gravity.'}),
 guide('pelvic-tilt','Tip the pelvis','pelvic-control','tilt','trunk','right','Watch the pelvis turn relative to the thighs. Compare hip flexors and lower-back extensors with the abdominal muscles and hip extensors.','11-4-axial-muscles-of-the-abdominal-wall-and-thorax',{range:[-7,8]}),
 guide('hip-stance','Level the pelvis on one leg','pelvic-control','obliquity','all','front','The right leg is the support. Its hip abductors can resist the left side dropping and help return it to level.',lower,{
  range:[0,6],fullFrame:true,setup:{'pelvic-control':{tilt:0},'right-hip':{flexion:0,abduction:0,rotation:0},'right-knee':{flexion:0},'right-ankle':{dorsiflexion:0},
   'left-hip':{flexion:15,abduction:0,rotation:0},'left-knee':{flexion:20}},
 }),
 guide('thoracic-turn','Turn the rib cage','thoracic-turn','rotation','trunk','lesson','Watch the rib-bearing thoracic spine rotate with the lumbar angles held still. Compare it with the trunk-turn lesson.','11-4-axial-muscles-of-the-abdominal-wall-and-thorax',{range:[9,-9]}),
 guide('thumb-opposition','Sweep the thumb across','right-thumb-cmc','opposition','right-arm','front','Watch the first metacarpal roll as the thumb sweeps across the palm. Opponens pollicis contributes to this movement.',upper,{range:[0,80],radius:.08}),
 guide('knee-unlock','Unlock the knee','right-knee','flexion','right-leg','lesson','Watch the tibia rotate slightly inward as the free leg begins to bend. Find popliteus behind the knee.',lower,{range:[0,25],radius:.18,rear:true}),
];

export function findMotionStudyGuide(id){
 return motionStudyGuides.find(guide=>guide.id===id);
}
