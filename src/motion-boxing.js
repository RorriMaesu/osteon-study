import {boxingHandPose} from './motion-boxing-hands.js';

const role=(joint,axis,direction,contraction='contributor')=>({joint,axis,direction,contraction});
const hold=(joint,axis,direction)=>({...role(joint,axis,direction,'isometric'),stabilizer:true});
const phase=(start,end,label,explanation,roles)=>({start,end,label,explanation,roles});
const hands=['left','right'].flatMap(side=>[
 ...['index','middle','ring','little'].flatMap(digit=>['mcp','pip','dip'].map(level=>hold(`${side}-${digit}-${level}`,'flexion',1))),
 hold(side+'-thumb-cmc','flexion',1),hold(side+'-thumb-mcp','flexion',1),hold(side+'-thumb-ip','flexion',1),
 hold(side+'-wrist','flexion',-1),
]);
const guardRoles=side=>[hold(side+'-shoulder','flexion',1),hold(side+'-elbow','flexion',1)];
const baseRoles=[hold('left-hip','abduction',1),hold('right-hip','abduction',1),
 hold('left-knee','flexion',-1),hold('right-knee','flexion',-1),
 hold('left-ankle','dorsiflexion',-1),hold('right-ankle','dorsiflexion',-1)];
const punchRoles=side=>[
 role(side+'-elbow','flexion',-1),role(side+'-shoulder','flexion',1),
 role(side+'-shoulder','horizontal',1),role(side+'-scapula','protraction',1),
 role(side+'-forearm','pronation',1),
];
const returnRoles=side=>[role(side+'-elbow','flexion',1),role(side+'-shoulder','flexion',-1),role(side+'-scapula','protraction',-1)];
const driveRoles=[role('right-hip','flexion',-1),role('right-knee','flexion',-1),role('right-ankle','dorsiflexion',-1),role('left-knee','flexion',-1,'eccentric')];
const withSupport=(roles,guard=['left','right'])=>[...roles,...guard.flatMap(guardRoles),...hands,...baseRoles];

/** Deliberately slowed orthodox jab/cross. The rear leg and pelvis lead the
 * cross; the opposite hand stays high instead of both arms alternating from rest.
 * Vertical fists respect the verified pronation range of the current rig. */
function posture({left=0,right=0,sink=0,drive=0,turn=6,lean=0,yaw=-12}={}){
 const pose={
  ...boxingHandPose('left',{pronation:35+25*left}),...boxingHandPose('right',{pronation:35+25*right}),
  'left-hip':{flexion:18+sink*.55+drive*3,abduction:7,rotation:0},
  'right-hip':{flexion:sink*.5-drive*4,abduction:7,rotation:-drive*12},
  'left-knee':{flexion:18+sink+drive*5},'right-knee':{flexion:18+sink-drive*10},
  'left-ankle':{dorsiflexion:sink*.45+drive*2},'right-ankle':{dorsiflexion:18+sink*.5-drive*16},
  'right-hallux':{extension:drive*12},
  'right-toe-2':{extension:drive*10},'right-toe-3':{extension:drive*10},
  'right-toe-4':{extension:drive*10},'right-toe-5':{extension:drive*10},
  trunk:{flexion:4+sink*.18,lateral:lean},'thoracic-turn':{rotation:turn},
  // Counter-turn the neck to keep the face oriented toward the imagined target.
  neck:{flexion:3,rotation:0},
 };
 for(const [side,amount] of [['left',left],['right',right]]){
  // Keep the guard beside the cheeks as the chest turns. Counter the body's
  // heading during extension so both straight punches reach toward one target.
  const heading=yaw-turn,sign=side==='left'?1:-1;
  const guard=Math.max(-24,Math.min(48,22+sign*heading*1.5));
  const strike=Math.max(-24,Math.min(48,14+sign*heading*1.25));
  pose[side+'-shoulder']={flexion:50+40*amount,abduction:4,horizontal:guard+(strike-guard)*amount,rotation:25};
  pose[side+'-elbow']={flexion:115-103*amount};
  pose[side+'-scapula']={protraction:3+6*amount,elevation:2+amount};
 }
 return pose;
}
const key=(time,settings={},yaw=-12)=>{
 const pose=posture({...settings,yaw});pose.neck.rotation=yaw-(settings.turn??6);
 return {time,pose,root:[0,0,0],rootRotation:[0,yaw,0]};
};

export const boxingActivity={
 id:'shadowbox',label:'Shadowbox · guarded jab–cross',category:'Sport and expression',duration:8,view:'lesson',scope:'all',ground:'both',
 description:'An orthodox left jab and rear-right cross with closed, near-vertical fists, a staggered stance, body turn and prompt recovery to guard. This non-contact teaching sequence is slowed for inspection; muscle roles are illustrative and foot contact is approximate.',
 sources:[
  {title:'Jin et al. — Boxing punch sequence and neutral wrist alignment',url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC12313678/'},
  {title:'Liu et al. — Lead straight punch and lower-limb biomechanics',url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC9798280/'},
  {title:'OpenStax 11.5 — Shoulder, arm, forearm and hand muscles',url:'https://openstax.org/books/anatomy-and-physiology-2e/pages/11-5-muscles-of-the-pectoral-girdle-and-upper-limbs'},
  {title:'OpenStax 11.6 — Hip, leg and foot muscles',url:'https://openstax.org/books/anatomy-and-physiology-2e/pages/11-6-appendicular-muscles-of-the-pelvic-girdle-and-lower-limbs'},
 ],
 supportMuscles:[
  {names:['Supraspinatus muscle','Infraspinatus muscle','Teres minor muscle','Subscapularis muscle'],label:'Possible shoulder stabilizer'},
  {names:['Rectus abdominis muscle','Transversus abdominis muscle','Multifidus lumborum muscle','Iliocostalis lumborum muscle','Longissimus thoracis muscle'],label:'Possible trunk stabilizer'},
 ],
 keyframes:[
  key(0),key(.55,{sink:3}),
  key(.9,{left:.32,sink:1,turn:8},-14),key(1.25,{left:1,turn:10},-15),
  key(1.6,{left:.36,turn:8},-14),key(2.05),
  key(2.5,{sink:4,turn:8},-14),
  // Hip/pelvic turn precedes maximal chest turn and then elbow extension.
  key(2.85,{right:.18,drive:.45,turn:8},-6),
  key(3.15,{right:.55,drive:.8,turn:-6},0),key(3.45,{right:1,drive:1,turn:-10},5),
  key(3.85,{right:.35,drive:.6,turn:-4},0),key(4.35),
  key(5.1,{sink:8,lean:-5,turn:7}),key(5.85),key(6.55,{sink:3}),key(7.2),key(8),
 ],
 phases:[
  phase(0,.55,'Set the guard','Keep both fists closed beside the face, elbows bent and knees soft. Forearm muscles hold the fist while wrist extensors help maintain alignment.',withSupport([])),
  phase(.55,1.25,'Left jab','The left arm advances from guard as serratus anterior reaches the scapula, shoulder muscles position the arm and triceps extends the elbow. The right hand stays up.',withSupport([...punchRoles('left'),role('thoracic-turn','rotation',1)],['right'])),
  phase(1.25,2.05,'Recover the jab','Return the left hand promptly to guard using elbow flexors and shoulder/scapular recovery muscles. Antagonists can also help brake a punch; their exact timing is not measured here.',withSupport([...returnRoles('left'),role('thoracic-turn','rotation',-1)],['right'])),
  phase(2.05,2.5,'Set the rear leg','A small knee bend prepares the rear-side drive while the hands remain in guard. The supporting muscle groups control this preparation.',withSupport([role('right-knee','flexion',-1,'eccentric'),role('right-hip','flexion',-1,'eccentric')])),
  phase(2.5,2.85,'Drive from the rear leg','Rear hip and knee extensors and plantar flexors contribute to the drive. The pelvis begins turning before the chest and punching arm complete their movement.',withSupport(driveRoles)),
  phase(2.85,3.45,'Turn and deliver the cross','The pelvis, trunk and right arm coordinate the cross. Obliques turn the chest; the shoulder, serratus, triceps and pronators deliver the arm while the left fist stays near the face.',withSupport([...driveRoles,role('thoracic-turn','rotation',-1),...punchRoles('right')],['left'])),
  phase(3.45,4.35,'Recover the cross','Bring the right fist back and restore the staggered guard. Elbow flexors, scapular retractors and the opposite trunk-turning action contribute to recovery.',withSupport([...returnRoles('right'),role('thoracic-turn','rotation',1)],['left'])),
  phase(4.35,5.1,'Small defensive dip','Knee and hip extensors control a small lowering of the body while the trunk bends slightly to the left. Both hands continue protecting the face.',withSupport([role('left-knee','flexion',-1,'eccentric'),role('right-knee','flexion',-1,'eccentric'),role('trunk','lateral',-1)])),
  phase(5.1,5.85,'Rise back to guard','Leg extensors restore the stance. The fists remain closed and the shoulders and trunk continue to stabilize the guard.',withSupport([role('left-knee','flexion',-1),role('right-knee','flexion',-1),role('trunk','lateral',1)])),
  phase(5.85,8,'Reset in stance','A small weight-ready settling motion returns to the same guard for the next combination. Highlights describe selected contributors and stabilizers, not measured activation intensity.',withSupport([])),
 ],
};
