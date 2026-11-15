const textbook='https://openstax.org/books/anatomy-and-physiology-2e/pages/';
const guide=(id,label,joint,axis,scope,view,note,section)=>({
 id,label,joint,axis,scope,view,note,source:textbook+section,
});

export const motionStudyGuides=[
 guide('head-turn','Turn your head','neck','rotation','head-neck','front','Turn right and compare the left sternocleidomastoid with the right splenius capitis. Switch to Back to see the short muscles near C1 and C2.','11-3-axial-muscles-of-the-head-neck-and-back'),
 guide('arm-abduction','Raise your arm sideways','right-shoulder','abduction','right-arm','front','The middle deltoid and supraspinatus act on the humerus. Serratus anterior and the upper and lower trapezius help turn the shoulder blade upward.','11-5-muscles-of-the-pectoral-girdle-and-upper-limbs'),
 guide('hip-abduction','Move your leg sideways','right-hip','abduction','right-leg','front','Gluteus medius, gluteus minimus, and tensor fasciae latae help move the free thigh sideways. Use Related only to uncover deeper muscles.','11-6-appendicular-muscles-of-the-pelvic-girdle-and-lower-limbs'),
 guide('hip-flexion','Lift the thigh','right-hip','flexion','right-leg','side','Follow iliacus and psoas major toward the lesser trochanter. Rectus femoris also crosses the knee.','11-6-appendicular-muscles-of-the-pelvic-girdle-and-lower-limbs'),
 guide('hip-extension','Move the thigh back','right-hip','flexion','right-leg','side','Move Backward to compare gluteus maximus and the hamstrings that cross the hip. The short head of biceps femoris crosses only the knee.','11-6-appendicular-muscles-of-the-pelvic-girdle-and-lower-limbs'),
 guide('hip-rotation','Turn the thigh in and out','right-hip','rotation','right-leg','lesson','Compare the deep external rotators near neutral. Flexing the hip changes the rotational leverage of several muscles.','11-6-appendicular-muscles-of-the-pelvic-girdle-and-lower-limbs'),
];

export function findMotionStudyGuide(id){
 return motionStudyGuides.find(guide=>guide.id===id);
}
