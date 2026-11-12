import {chapter11Muscles} from './chapter11-muscles.js';
import manifest from './muscle-models.json' with {type:'json'};

// Course card slug, exact active manifest muscle names, comparison area, entry view.
// A named group resolves to all its source components; it is never a name substring match.
const rows=`sternocleidomastoid|Sternocleidomastoid muscle|neck|right
orbicularis-oculi|Orbicularis oculi muscle|face
orbicularis-oris|Orbicularis oris muscle|face
zygomaticus-major|Zygomaticus major muscle|face
temporalis|Temporalis muscle|face|right
masseter|Masseter muscle|face|right
hyoglossus|Hyoglossus muscle|neck|right
styloglossus||neck
erector-spinae|Iliocostalis lumborum muscle;Iliocostalis thoracis muscle;Iliocostalis colli muscle;Longissimus thoracis muscle;Longissimus capitis muscle;Longissimus colli muscle;Spinalis capitis muscle;Spinalis colli muscle;Spinalis thoracis muscle|back|back
levator-scapulae|Levator scapulae|back|back
trapezius|Trapezius muscle|back|back
rhomboids|Rhomboid major muscle;Rhomboid minor muscle|back|back
pectoralis-minor|Pectoralis minor muscle|chest
external-intercostals|External intercostal muscles|chest
internal-intercostals|Internal intercostal muscles|chest
rectus-abdominis|Rectus abdominis muscle|abdomen
external-oblique|External abdominal oblique muscle|abdomen|right
internal-oblique|Internal abdominal oblique muscle|abdomen|right
transversus-abdominis|Transversus abdominis muscle|abdomen|right
diaphragm|Diaphragm|chest|top
ischiocavernosus||pelvic-floor
pelvic-diaphragm|Coccygeus muscle;Iliococcygeus muscle;Pubococcygeus muscle|pelvic-floor|bottom
external-urethral-sphincter||pelvic-floor
external-anal-sphincter|External anal sphincter|pelvic-floor|bottom
latissimus-dorsi|Latissimus dorsi muscle|back|back
deltoid|Deltoid muscle|shoulder|right
pectoralis-major|Pectoralis major muscle|chest
rotator-cuff|Supraspinatus muscle;Infraspinatus muscle;Teres minor muscle;Subscapularis muscle|shoulder|back
supraspinatus|Supraspinatus muscle|shoulder|back
infraspinatus|Infraspinatus muscle|shoulder|back
subscapularis|Subscapularis muscle|shoulder
teres-minor|Teres minor muscle|shoulder|back
biceps-brachii|Biceps brachii muscle|arm
supinator|Supinator|forearm|right
brachialis|Brachialis muscle|arm
pronator-teres|Pronator teres muscle|forearm
triceps-brachii|Triceps brachii muscle|arm|back
flexor-carpi-radialis|Flexor carpi radialis|forearm
extensor-carpi-radialis|Extensor carpi radialis longus;Extensor carpi radialis brevis|forearm|back
flexor-digitorum-superficialis|Flexor digitorum superficialis|forearm
extensor-digitorum|Extensor digitorum|forearm|back
extensor-pollicis-longus|Extensor pollicis longus|forearm|back
opponens-pollicis|Opponens pollicis muscle|wrist
flexor-retinaculum-of-wrist|Flexor retinaculum of wrist|wrist
extensor-retinaculum-of-wrist|Extensor retinaculum of wrist|wrist|back
gluteus-maximus|Gluteus maximus muscle|hip|back
gluteus-medius|Gluteus medius muscle|hip|right
psoas-major|Psoas major|hip
adductor-longus|Adductor longus|hip
quadriceps-femoris|Rectus femoris muscle;Vastus lateralis muscle;Vastus medialis muscle;Vastus intermedius muscle|thigh
rectus-femoris|Rectus femoris muscle|thigh
vastus-lateralis|Vastus lateralis muscle|thigh|right
vastus-medialis|Vastus medialis muscle|thigh
vastus-intermedius|Vastus intermedius muscle|thigh
hamstrings|Biceps femoris muscle;Semitendinosus muscle;Semimembranosus muscle|thigh|back
biceps-femoris|Biceps femoris muscle|thigh|back
semitendinosus|Semitendinosus muscle|thigh|back
semimembranosus|Semimembranosus muscle|thigh|back
gastrocnemius|Gastrocnemius muscle|lower-leg|back
soleus|Soleus muscle|lower-leg|back
tibialis-anterior|Tibialis anterior muscle|lower-leg
calcaneal-tendon|Calcaneal tendon|lower-leg|back
flexor-digitorum-longus|Flexor digitorum longus|lower-leg|back
extensor-digitorum-longus|Extensor digitorum longus|lower-leg
aponeurosis|Palmar aponeurosis;Plantar aponeurosis;Epicranial aponeurosis|wrist
fascia|Antebrachial fascia;Fascia lata|forearm
tendon-sheaths|Common flexor tendon sheath;Tendon sheath of tibialis anterior|wrist`;

const notes={
 styloglossus:'This atlas has no separately named styloglossus. The nearby hyoglossus is a different muscle.',
 ischiocavernosus:'This atlas has no selectable ischiocavernosus. Use the appropriate sex-specific source illustration to study it.',
 'external-urethral-sphincter':'The course list says “urethral sphincter.” This skeletal-muscle card addresses the external complex; neither sex-specific complex is separately modeled here.',
 'pelvic-diaphragm':'Partial model: coccygeus, pubococcygeus and iliococcygeus are present. The model does not establish puborectalis, and puboanalis is not substituted for it.',
 'erector-spinae':'The named iliocostalis, longissimus and spinalis columns are available to study. The source identity of spinalis capitis still needs attachment review.',
 'external-intercostals':'This source represents the layer on each side as a group. Individual intercostal spaces are not scored.',
 'internal-intercostals':'This source represents the layer on each side as a group. Individual intercostal spaces are not scored.',
 'rotator-cuff':'The four source muscle members are shown. The view does not trace their combined capsular tendon footprint.',
 hamstrings:'This course group includes biceps femoris, semitendinosus and semimembranosus. The short biceps head does not cross the hip.',
 aponeurosis:'A tissue category, shown through a named sheet-like tendon example.',
 fascia:'A tissue category, shown through a named fascial sheet example.',
 'tendon-sheaths':'A tissue category, shown through a named sleeve around tendons.',
};
const exampleKeys=new Set(['aponeurosis','fascia','tendon-sheaths']);
const serialKeys=new Set(['external-intercostals','internal-intercostals']);
const wholePairKeys=new Set(['orbicularis-oris','external-anal-sphincter','pelvic-diaphragm','diaphragm']);
const chapterCards=new Map(chapter11Muscles.filter(c=>c.courseChecklist).map(c=>[c.id,c]));
const byName=new Map();
for(const c of manifest.components){
 if(c.retired)continue;
 if(!byName.has(c.muscleName))byName.set(c.muscleName,[]);
 byName.get(c.muscleName).push(c);
}

export const courseSpatialModes={name:'Name it',find:'Find it'};
export const courseMuscleTargets=rows.split('\n').map(row=>{
 const [key,names,zone,view='front']=row.split('|'),id='ch11-'+key,card=chapterCards.get(id);
 if(!card)throw new Error('Unknown BI 231 muscle card: '+id);
 const namesList=names?names.split(';'):[],groups=namesList.map(name=>byName.get(name)||[]),components=groups.flat();
 const expected=groups.every(list=>list.some(c=>['midline','bilateral'].includes(c.side))||['left','right'].every(side=>list.some(c=>c.side===side)));
 const status=!components.length?'missing':!expected||key==='pelvic-diaphragm'?'partial':key==='erector-spinae'?'review':exampleKeys.has(key)?'examples':serialKeys.has(key)?'serial':card.kind==='connective tissue'?'support':groups.length>1?'composite':'named';
 return {id,card,name:card.name,courseName:card.courseLabel||card.name,courseRegion:card.region,
  region:components[0]?.region||card.region,zone,view,status,wholePair:wholePairKeys.has(key),
  componentIds:components.map(c=>c.id),components,
  examples:status==='examples'?groups.map((list,i)=>({name:namesList[i],components:list,region:list[0].region})):[],
  spatialEligible:['named','composite','serial','support'].includes(status),note:notes[key]||null};
});
export const courseMuscleTargetById=new Map(courseMuscleTargets.map(t=>[t.id,t]));
export function filterCourseMuscleTargets({region='all',targetIds,scoredOnly=false}={}){
 const allowed=Array.isArray(targetIds)?new Set(targetIds):null;
 return courseMuscleTargets.filter(t=>(region==='all'||t.region===region||t.courseRegion===region)&&(!allowed||allowed.has(t.id))&&(!scoredOnly||t.spatialEligible));
}
export function courseTargetComponents(target,side='right',example=0){
 const actualSide=target.wholePair?'both':side;
 return (target.examples[example]?.components||target.components).filter(c=>actualSide==='both'||c.side===actualSide||c.side==='bilateral'||c.side==='midline');
}
function center(components){
 return [0,1,2].map(i=>(Math.min(...components.map(c=>c.bounds.min[i]))+Math.max(...components.map(c=>c.bounds.max[i])))/2);
}
export function courseComparisonGroups(target,{side='right',limit=4}={}){
 const components=courseTargetComponents(target,side);
 if(!components.length||limit<1)return [];
 const base=center(components),seen=new Set(components.map(c=>c.id));
 const potential=courseMuscleTargets.filter(t=>t.id!==target.id&&t.region===target.region&&t.spatialEligible)
 .map(t=>{
  const parts=courseTargetComponents(t,side),p=center(parts),distance=Math.hypot(...p.map((x,i)=>x-base[i]));
  return {term:t,parts,rank:distance+(t.zone===target.zone?0:.2)+(t.card.kind==='connective tissue'&&target.card.kind!=='connective tissue'?.08:0)};
 }).filter(x=>x.parts.length).sort((a,b)=>a.rank-b.rank);
 const chosen=[];
 for(const x of potential){
  const ids=x.parts.map(c=>c.id);
  if(ids.some(id=>seen.has(id)))continue;
  ids.forEach(id=>seen.add(id));chosen.push({id:x.term.id,name:x.term.name,componentIds:ids});
  if(chosen.length>=limit)break;
 }
 return chosen;
}
export const courseChoiceCorrect=(targetIds,choiceIds)=>choiceIds.length>0&&choiceIds.every(id=>targetIds.includes(id));
export function shuffledCourseChoices(values,random=Math.random){
 const list=[...values];
 for(let i=list.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[list[i],list[j]]=[list[j],list[i]];}
 return list;
}
