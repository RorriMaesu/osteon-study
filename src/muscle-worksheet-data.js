import {muscleFigureTargets} from './muscle-figure-targets.js';
import assets from './muscle-textbook-assets.json' with {type:'json'};
import {chapter11Muscles} from './chapter11-muscles.js';

const cardsFor=(id,target)=>chapter11Muscles.find(card=>card.figures.includes(target.figure)&&(card.figureTarget===id||[card.name,...card.aliases].some(name=>[target.name,...target.aliases].some(value=>value.toLowerCase()===name.toLowerCase()))));
const publicPanels=new Map();
export const muscleWorksheetTargets={};
for(const [key,target] of Object.entries(muscleFigureTargets)){
 const panelId='openstax-'+target.figure.replace('.','-')+'-'+target.panel.join('-');
 if(!publicPanels.has(panelId))publicPanels.set(panelId,{id:panelId,source:'openstax',name:target.figure+' · '+target.orientation,orientation:target.orientation,figure:target.figure,bounds:target.panel,width:assets[target.figure].width,height:assets[target.figure].height,src:'assets/muscle-textbook/'+assets[target.figure].file});
 const card=cardsFor(key,target),id='openstax-'+key;
 muscleWorksheetTargets[id]={...target,id,panelId,termId:card?.id||null,section:card?.section||'11.6',source:'openstax',figureTarget:key,number:null};
}
const local=(id,name,image,bounds,width,height,orientation,note='')=>({id,source:'local',name,image,bounds,width,height,orientation,note});
export const muscleWorksheetPanels=[...publicPanels.values(),
 local('worksheet-body-front','Whole body · anterior','body',[0,0,248,500],500,500,'Anterior body overview','Small source image: use broad superficial landmarks rather than fine attachments.'),
 local('worksheet-body-back','Whole body · posterior','body',[248,0,252,500],500,500,'Posterior body overview','Small source image: use broad superficial landmarks rather than fine attachments.'),
 local('worksheet-arm-front','Right arm · anterior','arms',[14,125,230,490],527,657,'Right upper limb, anterior','The supplied worksheet explicitly identifies both illustrations as the right arm.'),
 local('worksheet-arm-back','Right arm · posterior','arms',[275,125,240,490],527,657,'Right upper limb, posterior','The supplied worksheet explicitly identifies both illustrations as the right arm.'),
 local('worksheet-leg-front','Lower leg · anterior (1–6)','leg',[35,0,260,513],700,550,'Anterior superficial lower leg','Original worksheet numbers are retained. Only reviewed pointers are graded.'),
 local('worksheet-leg-side','Lower leg · lateral (7–11)','leg',[389,0,257,513],700,550,'Lateral superficial lower leg','Original worksheet numbers are retained. Only reviewed pointers are graded.'),
 local('worksheet-limb-back','Lower limb A · posterior','limbs',[150,0,160,550],700,550,'Posterior lower limb, worksheet A','The narrow source drawing limits useful magnification.'),
 local('worksheet-limb-front','Lower limb B · anterior','limbs',[345,0,180,550],700,550,'Anterior lower limb, worksheet B','Use the source drawing for orientation. Uncertain fine leader endpoints are not scored.'),
];
function add(id,panelId,name,point,description,number=null){
 const card=chapter11Muscles.find(card=>card.name===name);if(!card)throw new Error('No course term for '+name);
 muscleWorksheetTargets[id]={id,panelId,name,point,description,number,source:'local',termId:card.id,section:card.section,aliases:card.aliases,orientation:muscleWorksheetPanels.find(panel=>panel.id===panelId).orientation};
}
// Coordinates below were inspected on the exact imported image signatures.
// These are selected, recognizable bellies, not an inferred answer key for every
// blank line. The narrow/ambiguous original pointers remain ungraded.
add('worksheet-front-deltoid','worksheet-body-front','Deltoid',[174,122],'The broad cap over the lateral shoulder.');
add('worksheet-front-pectoralis-major','worksheet-body-front','Pectoralis major',[143,131],'The broad superficial muscle over the anterior chest.');
add('worksheet-front-rectus-abdominis','worksheet-body-front','Rectus abdominis',[114,191],'The paired vertical anterior abdominal muscle beside the midline.');
add('worksheet-front-biceps-brachii','worksheet-body-front','Biceps brachii',[178,166],'The superficial muscle belly on the anterior upper arm.');
add('worksheet-back-trapezius','worksheet-body-back','Trapezius',[350,119],'The superficial upper back sheet extending toward the shoulder.');
add('worksheet-back-latissimus-dorsi','worksheet-body-back','Latissimus dorsi',[332,176],'The broad lower-back sheet approaching the upper arm.');
add('worksheet-back-gluteus-maximus','worksheet-body-back','Gluteus maximus',[347,244],'The large superficial buttock muscle.');
add('worksheet-back-gastrocnemius','worksheet-body-back','Gastrocnemius',[328,382],'The superficial calf belly below the knee.');
add('worksheet-arm-biceps-brachii','worksheet-arm-front','Biceps brachii',[171,266],'The prominent superficial anterior upper-arm belly.');
add('worksheet-arm-triceps-brachii','worksheet-arm-back','Triceps brachii',[329,252],'The posterior upper-arm muscle narrowing toward its elbow tendon.');
add('worksheet-leg-2','worksheet-leg-front','Tibialis anterior',[165,171],'The large anterior leg muscle beside the tibial crest.',2);
add('worksheet-leg-4','worksheet-leg-front','Gastrocnemius',[220,163],'The superficial calf muscle visible at the medial edge of this anterior view.',4);
add('worksheet-leg-5','worksheet-leg-front','Soleus',[207,212],'The calf muscle visible below the superficial gastrocnemius.',5);
add('worksheet-leg-1','worksheet-leg-front','Extensor digitorum longus',[142,138],'The anterior-compartment muscle lateral to tibialis anterior, continuing toward the lateral four toes.',1);
add('worksheet-leg-3','worksheet-leg-front','Fibularis longus',[133,207],'The superficial lateral-compartment muscle visible at the lateral edge of this anterior view.',3);
add('worksheet-leg-6','worksheet-leg-front','Flexor digitorum longus',[193,285],'The narrow deep posterior-compartment muscle visible along the medial lower leg.',6);
add('worksheet-leg-7','worksheet-leg-side','Tibialis anterior',[525,148],'The anterior leg muscle at the front edge of this lateral view.',7);
add('worksheet-leg-8','worksheet-leg-side','Extensor digitorum longus',[499,173],'The muscle just lateral to tibialis anterior, continuing toward the lateral toes.',8);
add('worksheet-leg-9','worksheet-leg-side','Fibularis longus',[477,198],'The lateral-compartment muscle between the anterior extensors and posterior calf.',9);
add('worksheet-leg-10','worksheet-leg-side','Soleus',[447,223],'The calf muscle visible between the lateral-compartment muscle and the superficial posterior belly.',10);
add('worksheet-leg-11','worksheet-leg-side','Gastrocnemius',[428,245],'The superficial posterior calf belly at the back of this lateral view.',11);
add('worksheet-limb-gluteus-maximus','worksheet-limb-back','Gluteus maximus',[209,102],'The large superficial buttock belly below the small exposed superior hip muscle.');
add('worksheet-limb-gluteus-medius','worksheet-limb-back','Gluteus medius',[194,54],'The exposed superior lateral hip muscle above the larger buttock muscle.');
add('worksheet-limb-gastrocnemius','worksheet-limb-back','Gastrocnemius',[220,374],'The prominent superficial calf belly.');
add('worksheet-limb-sartorius','worksheet-limb-front','Sartorius',[413,164],'The narrow strap running obliquely across the anterior thigh.');

export const worksheetNumberedSource='https://www.purposegames.com/worksheet/ch-11-basic-leg-muscles-ant-lat';
for(const target of Object.values(muscleWorksheetTargets))if(target.source==='local'&&target.number){
 target.verification={source:worksheetNumberedSource,method:'Original public printable worksheet key matched to numbered leaders; compartment relationships checked against OpenStax §11.6.',reviewed:'2026-11-12'};
 if(target.number>=7)target.aliases=[...target.aliases,target.name+' (lateral)'];
}
export const worksheetPanelTargets=panelId=>Object.values(muscleWorksheetTargets).filter(target=>target.panelId===panelId).sort((a,b)=>(a.number??Infinity)-(b.number??Infinity));
export function validWorksheetDraft(value){return !!value&&value.version===1&&muscleWorksheetPanels.some(panel=>panel.id===value.panel)&&['study','label','locate'].includes(value.mode)&&typeof value.target==='string'&&(!value.target||muscleWorksheetTargets[value.target]?.panelId===value.panel)&&(value.choice===undefined||value.choice===''||muscleWorksheetTargets[value.choice]?.panelId===value.panel)&&typeof value.response==='string'&&value.response.length<=120&&typeof value.assisted==='boolean'&&typeof value.finished==='boolean'&&typeof value.feedback==='string'&&value.feedback.length<=700;}
