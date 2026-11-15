// Pose coordinates describe geometry. They cannot establish neural recruitment,
// load, force, or whether a contracting muscle shortens or lengthens.
export const poseSources=Object.freeze({
 upper:'https://openstax.org/books/anatomy-and-physiology-2e/pages/11-5-muscles-of-the-pectoral-girdle-and-upper-limbs',
 lower:'https://openstax.org/books/anatomy-and-physiology-2e/pages/11-6-appendicular-muscles-of-the-pelvic-girdle-and-lower-limbs',
 axial:'https://openstax.org/books/anatomy-and-physiology-2e/pages/11-3-axial-muscles-of-the-head-neck-and-back',
 trunk:'https://openstax.org/books/anatomy-and-physiology-2e/pages/11-4-axial-muscles-of-the-abdominal-wall-and-thorax',
 recruitment:'https://openstax.org/books/anatomy-and-physiology-2e/pages/10-4-nervous-system-control-of-muscle-tension',
 thumb:'https://pubmed.ncbi.nlm.nih.gov/9755041/',
 hand:'https://pmc.ncbi.nlm.nih.gov/articles/PMC10508329/',
 foot:'https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/muscle-tables/muscles-of-the-lower-limb/',
});

const epsilon=1e-7;
const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
const frozenValues=values=>Object.freeze(Object.fromEntries(Object.entries(values).map(([id,axes])=>[id,Object.freeze({...axes})])));
const snapshot=(values,locks)=>Object.freeze({values:frozenValues(values),locks:Object.freeze([...locks].sort())});
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);

export function neutralPose(descriptors){
 return frozenValues(Object.fromEntries(descriptors.map(joint=>[joint.id,Object.fromEntries(joint.axes.map(axis=>[axis.id,clamp(axis.neutral??0,axis.min,axis.max)]))])));
}

export function poseChanges(before,after){
 const changes=[];
 for(const [joint,axes] of Object.entries(after))for(const [axis,value] of Object.entries(axes)){
  const old=before[joint]?.[axis];
  if(Number.isFinite(old)&&Math.abs(value-old)>epsilon)changes.push(Object.freeze({joint,axis,before:old,after:value,delta:value-old}));
 }
 return Object.freeze(changes);
}

/** One begin/commit pair is one reversible edit, regardless of pointer samples. */
export class PoseHistory{
 constructor(descriptors,{limit=60,initial}={}){
  this.descriptors=Object.freeze(descriptors.map(joint=>{
   const axes=joint.axes.map(axis=>Object.freeze({...axis,
    ...(Array.isArray(axis.requiresUnlocked)?{requiresUnlocked:Object.freeze([...axis.requiresUnlocked])}:{})}));
   return Object.freeze({...joint,axes:Object.freeze(axes)});
  }));
  this.byId=new Map();
  for(const joint of this.descriptors){
   if(!joint.id||this.byId.has(joint.id)||!joint.axes.length)throw new Error('Pose joints need unique IDs and at least one axis.');
   const names=new Set();
   for(const axis of joint.axes){
    if(!axis.id||names.has(axis.id)||!Number.isFinite(axis.min)||!Number.isFinite(axis.max)||axis.min>axis.max||!Number.isFinite(axis.neutral??0))throw new Error('Pose axes need unique IDs and finite ordered limits.');
    names.add(axis.id);
   }
   this.byId.set(joint.id,joint);
  }
  for(const joint of this.descriptors)for(const axis of joint.axes){
   if(axis.requiresUnlocked!==undefined&&(!Array.isArray(axis.requiresUnlocked)||axis.requiresUnlocked.some(id=>!this.byId.has(id))))throw new Error('Coupled pose axes must reference existing joint locks.');
  }
  this.limit=Number.isFinite(limit)?Math.max(1,Math.floor(limit)):60;
  this.past=[];this.future=[];this.transaction=null;
  this.current=snapshot(neutralPose(this.descriptors),[]);
  this.changes=Object.freeze([]);
  if(initial){this.patch(initial);this.past=[];this.changes=Object.freeze([]);}
 }
 get values(){return this.current.values;}
 get locks(){return this.current.locks;}
 get canUndo(){return !this.transaction&&this.past.length>0;}
 get canRedo(){return !this.transaction&&this.future.length>0;}
 get inTransaction(){return !!this.transaction;}
 isLocked(id){return this.locks.includes(id);}
 isAxisLocked(id,axisId){
  const axis=this.byId.get(id)?.axes.find(axis=>axis.id===axisId);
  return !axis||this.isLocked(id)||!!axis.requiresUnlocked?.some(dependency=>this.isLocked(dependency));
 }
 begin(){
  if(this.transaction)return false;
  this.transaction={before:this.current,changes:this.changes};
  return true;
 }
 record(before){
  if(same(before,this.current))return false;
  this.past.push(before);
  if(this.past.length>this.limit)this.past.shift();
  this.future=[];
  return true;
 }
 commit({preserveDirection=false}={}){
  if(!this.transaction)return false;
  const {before,changes}=this.transaction;
  this.transaction=null;
  const changed=this.record(before);
  // A back-and-forth preview or drag can finish above its starting angle while
  // the final movement was extension. Preserve that actual last direction for
  // action cues when requested; the undo record still covers the whole gesture.
  this.changes=changed?(preserveDirection?this.changes:poseChanges(before.values,this.values)):changes;
  return changed;
 }
 cancel(){
  if(!this.transaction)return false;
  const {before,changes}=this.transaction;
  const changed=!same(before,this.current);
  this.current=before;this.changes=changes;this.transaction=null;
  return changed;
 }
 set(joint,axis,value){return this.patch({[joint]:{[axis]:value}});}
 patch(patch){
  if(!patch||typeof patch!=='object'||Array.isArray(patch))return false;
  // Validate the complete input before applying an IK result to either joint.
  const edits=[];
  for(const [id,axes] of Object.entries(patch)){
   const joint=this.byId.get(id);
   if(!joint||!axes||typeof axes!=='object'||Array.isArray(axes))return false;
   for(const [key,value] of Object.entries(axes)){
    const axis=joint.axes.find(axis=>axis.id===key);
    if(!axis||!Number.isFinite(value))return false;
    if(!this.isAxisLocked(id,key))edits.push([id,key,clamp(value,axis.min,axis.max)]);
   }
  }
  const before=this.current,values=Object.fromEntries(Object.entries(this.values).map(([id,axes])=>[id,{...axes}]));
  for(const [id,key,value] of edits)values[id][key]=value;
  const changes=poseChanges(this.values,values);
  if(!changes.length)return false;
  this.current=snapshot(values,this.locks);this.changes=changes;
  if(!this.transaction)this.record(before);
  return true;
 }
 setLocked(id,locked){
  if(!this.byId.has(id)||this.isLocked(id)===!!locked)return false;
  const before=this.current,locks=new Set(this.locks);
  if(locked)locks.add(id);else locks.delete(id);
  this.current=snapshot(this.values,locks);
  if(!this.transaction)this.record(before);
  return true;
 }
 reset(id){
  const all=neutralPose(this.descriptors);
  if(id&&!this.byId.has(id))return false;
  return this.patch(id?{[id]:all[id]}:all);
 }
 clearChanges(){this.changes=Object.freeze([]);}
 undo(){
  if(!this.canUndo)return false;
  this.future.push(this.current);this.current=this.past.pop();this.clearChanges();
  return true;
 }
 redo(){
  if(!this.canRedo)return false;
  this.past.push(this.current);this.current=this.future.pop();this.clearChanges();
  return true;
 }
}

const normal=text=>String(text||'').normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const matches=(part,patterns)=>{
 // Surface names are exact atlas components. Exclude fascia, bursae and tendon
 // sheaths even when their names contain the name of a contributing muscle.
 const name=normal(part.name||part.muscleName||part.sourceName||part.id);
 if(part.kind&&part.kind!=='muscle'||/\b(bursa|fascia|sheath|retinaculum|ligament|aponeurosis|tendon)\b/.test(name))return false;
 return patterns.some(pattern=>pattern.test(name));
};
const names=(...tokens)=>tokens.map(token=>new RegExp('\\b'+token+'\\b'));
const both=(...patterns)=>patterns.flat();
const elbowFlex=names('biceps brachii','brachialis','brachioradialis');
const elbowExt=names('triceps brachii','anconeus');
const anteriorDeltoid=names('clavicular part of deltoid','anterior (?:part of )?deltoid');
const posteriorDeltoid=names('scapular spinal part of deltoid','posterior (?:part of )?deltoid');
const shoulderFlex=both(anteriorDeltoid,names('clavicular head of pectoralis major','coracobrachialis','biceps brachii'));
const shoulderExt=both(posteriorDeltoid,names('latissimus dorsi','teres major','long head of triceps brachii'));
const shoulderAbd=names('acromial part of deltoid','middle (?:part of )?deltoid','supraspinatus','serratus anterior','upper descending part of trapezius','lower ascending part of trapezius');
const shoulderAdd=names('pectoralis major','latissimus dorsi','teres major');
const shoulderInternal=both(anteriorDeltoid,names('subscapularis','pectoralis major','latissimus dorsi','teres major'));
const shoulderExternal=both(posteriorDeltoid,names('infraspinatus','teres minor'));
const wristFlex=names('flexor carpi radialis','flexor carpi ulnaris','palmaris longus');
const wristExt=names('extensor carpi radialis','extensor carpi ulnaris');
const hipFlex=names('iliacus','psoas major','rectus femoris','sartorius','tensor fasciae latae','pectineus');
const hipExt=names('gluteus maximus','semitendinosus','semimembranosus','long head of biceps femoris');
const hipAbd=names('gluteus medius','gluteus minimus','tensor fasciae latae');
const hipAdd=names('adductor longus','adductor brevis','adductor magnus','gracilis','pectineus');
const hipInternal=names('tensor fasciae latae');
const hipExternal=names('gluteus maximus','piriformis','obturator internus','obturator externus','superior gemellus','inferior gemellus','quadratus femoris','sartorius');
const kneeFlex=names('biceps femoris','semitendinosus','semimembranosus','gastrocnemius','sartorius','gracilis','popliteus','plantaris');
const kneeExt=names('rectus femoris','vastus lateralis','vastus medialis','vastus intermedius');
const ankleDorsi=names('tibialis anterior','extensor digitorum longus','extensor hallucis longus','fibularis tertius');
const anklePlantar=names('gastrocnemius','soleus','plantaris','tibialis posterior','flexor hallucis longus','flexor digitorum longus','fibularis longus','fibularis brevis');
const trunkFlex=names('rectus abdominis','internal abdominal oblique','external abdominal oblique');
const trunkExt=names('iliocostalis (?:thoracis|lumborum)','longissimus thoracis','spinalis thoracis','multifidus (?:thoracis|lumborum)','semispinalis thoracis','interspinales (?:thoracis|lumborum)');
const neckFlex=names('sternocleidomastoid','longus capitis','longus colli','rectus anterior capitis','scalenus anterior');
const neckExt=names('splenius capitis','splenius colli','semispinalis colli','longissimus capitis','longissimus colli','spinalis capitis','spinalis colli','rectus posterior (?:major|minor) capitis','obliquus superior capitis');
const jawOpen=names('anterior belly of digastric','geniohyoid','mylohyoid','inferior head of lateral pterygoid');
const jawClose=names('masseter','temporalis','medial pterygoid');
const fingerFlex=names('flexor digitorum profundus','flexor digitorum superficialis');
const fingerExt=names('extensor digitorum');
const fingerIntrinsic=names('lumbrical muscles? of hand','(?:first|second|third|fourth|1st|2nd|3rd|4th) lumbrical','dorsal interosse(?:i|ous)','palmar interosse(?:i|ous)');
const pair=(positive,negative,up,down,source,note='')=>({positive,negative,up,down,source,note});

const directions={
 'scapula:elevation':pair('Scapular elevation','Scapular depression',names('upper descending part of trapezius','levator scapulae','rhomboid (?:major|minor)'),names('lower ascending part of trapezius','pectoralis minor'),poseSources.upper,'Scapular motion couples with the clavicle; it is not a separate ball-and-socket joint.'),
 'scapula:protraction':pair('Scapular protraction','Scapular retraction',names('serratus anterior','pectoralis minor'),names('transverse part of trapezius','rhomboid (?:major|minor)'),poseSources.upper),
 'shoulder:flexion':pair('Shoulder flexion','Shoulder extension',shoulderFlex,shoulderExt,poseSources.upper,'Shoulder roles depend on arm position; the sternocostal pectoralis can extend an already flexed shoulder.'),
 'shoulder:abduction':pair('Shoulder abduction','Shoulder adduction',shoulderAbd,shoulderAdd,poseSources.upper,'Arm elevation includes coordinated shoulder-girdle movement. Serratus anterior and the upper and lower trapezius can contribute to scapular upward rotation alongside glenohumeral abductors.'),
 'shoulder:scaption':pair('Scapular-plane elevation','Lower from scapular-plane elevation',both(shoulderAbd,anteriorDeltoid),shoulderAdd,poseSources.upper,'Raise the arm diagonally forward. Mid and anterior deltoid and supraspinatus contribute at the humerus, with the scapular upward rotators helping the blade.'),
 'shoulder:rotation':pair('Shoulder internal rotation','Shoulder external rotation',shoulderInternal,shoulderExternal,poseSources.upper),
 'elbow:flexion':pair('Elbow flexion','Elbow extension',elbowFlex,elbowExt,poseSources.upper),
 'forearm:pronation':pair('Forearm pronation','Forearm supination',names('pronator teres','pronator quadratus'),names('supinator','biceps brachii'),poseSources.upper,'Biceps also crosses the elbow. Brachioradialis assists return toward a neutral forearm position.'),
 'wrist:flexion':pair('Wrist flexion','Wrist extension',wristFlex,wristExt,poseSources.upper),
 'wrist:deviation':pair('Wrist ulnar deviation','Wrist radial deviation',names('flexor carpi ulnaris','extensor carpi ulnaris'),names('flexor carpi radialis','extensor carpi radialis','abductor pollicis longus'),poseSources.upper),
 'hip:flexion':pair('Hip flexion','Hip extension',hipFlex,hipExt,poseSources.lower,'The short head of biceps femoris does not cross the hip.'),
 'hip:abduction':pair('Hip abduction','Hip adduction',hipAbd,hipAdd,poseSources.lower),
 'hip:rotation':pair('Hip internal rotation','Hip external rotation',hipInternal,hipExternal,poseSources.lower,'Anterior fibers of gluteus medius and minimus also assist internal rotation; their whole-muscle meshes are left neutral because fiber regions have different actions. Rotation roles change with hip flexion.'),
 'knee:flexion':pair('Knee flexion','Knee extension',kneeFlex,kneeExt,poseSources.lower),
 'ankle:dorsiflexion':pair('Ankle dorsiflexion','Ankle plantarflexion',ankleDorsi,anklePlantar,poseSources.lower),
 'subtalar:inversion':pair('Foot inversion','Foot eversion',names('tibialis anterior','tibialis posterior'),names('fibularis longus','fibularis brevis','fibularis tertius'),poseSources.foot,'The hindfoot turns around an oblique teaching axis. Real inversion and eversion involve coupled hindfoot and midfoot movement; the model does not resolve every foot articulation. These are selected contributors, not an exhaustive recruitment list.'),
 'toes:extension':pair('Toe extension','Toe flexion',names('extensor digitorum (?:longus|brevis)','extensor hallucis (?:longus|brevis)'),names('flexor digitorum (?:longus|brevis)','flexor hallucis (?:longus|brevis)','flexor digiti minimi of foot'),poseSources.lower,'This grouped toe control combines separate muscles acting on different digits.'),
 'trunk:flexion':pair('Trunk flexion','Trunk extension',trunkFlex,trunkExt,poseSources.trunk),
 'pelvic-control:tilt':pair('Anterior pelvic tilt','Posterior pelvic tilt',both(hipFlex,trunkExt),both(hipExt,trunkFlex),poseSources.trunk,'With the thighs relatively fixed, hip flexors and back extensors can assist anterior tilt. Hip extensors and abdominal muscles can assist posterior tilt.'),
 'neck:flexion':pair('Neck flexion','Neck extension',neckFlex,neckExt,poseSources.axial,'This combined neck action does not resolve individual cervical joints. Sternocleidomastoid can extend the head at the upper cervical joints while flexing the lower neck.'),
 'upper-nod:flexion':pair('Nod down at the atlas','Nod up at the atlas',names('longus capitis','rectus anterior capitis'),names('rectus posterior (?:major|minor) capitis','obliquus superior capitis'),poseSources.axial,'Compare this small skull-on-atlas motion with bending the entire neck.'),
 'jaw:opening':pair('Jaw opening','Jaw closing',jawOpen,jawClose,poseSources.axial,'Suprahyoid opening assumes the hyoid is stabilized. Opening combines mandibular rotation and translation.'),
 'jaw:protrusion':pair('Jaw protrusion','Jaw retraction',names('inferior head of lateral pterygoid'),names('temporalis'),poseSources.axial,'Both lateral pterygoids help bring the mandible forward. The posterior fibers of temporalis assist return, and the atlas shows the whole temporalis surface.'),
 'hallux:extension':pair('Great-toe extension','Great-toe flexion',names('extensor hallucis (?:longus|brevis)'),names('flexor hallucis (?:longus|brevis)'),poseSources.lower,'The first metatarsophalangeal joint moves separately from the other toes.'),
 'thumb-cmc:flexion':pair('Thumb CMC flexion','Thumb CMC extension',names('flexor pollicis longus','flexor pollicis brevis','opponens pollicis','adductor pollicis'),names('extensor pollicis longus','extensor pollicis brevis','abductor pollicis longus'),poseSources.thumb,'Thumb flexion and abduction are components of opposition, which also requires rotation. Opponens pollicis contributes to these components; the control does not reproduce full opposition.'),
 'thumb-cmc:abduction':pair('Thumb CMC abduction','Thumb CMC adduction',names('abductor pollicis longus','abductor pollicis brevis','opponens pollicis'),names('adductor pollicis','extensor pollicis longus','flexor pollicis brevis'),poseSources.thumb,'The control shows palmar abduction. Individual muscle contributions vary with thumb position; the colors do not specify recruitment or force.'),
 'thumb-cmc:opposition':pair('Thumb opposition','Thumb reposition',names('opponens pollicis','abductor pollicis brevis','flexor pollicis brevis'),names('abductor pollicis longus','extensor pollicis longus','extensor pollicis brevis'),'https://pubmed.ncbi.nlm.nih.gov/28888568/','Watch the first metacarpal rotate as the thumb sweeps across the palm. The display uses a short arc without thumb–finger contact.'),
 'face-blink:closure':pair('Eyelid closing','Eyelid opening',names('orbicularis oculi'),names('levator palpebrae superioris'),poseSources.axial),
 'face-smile:smile':pair('Smile','Return from smile',names('zygomaticus major','zygomaticus minor','levator anguli oris','risorius'),[],poseSources.axial,'Returning the expression toward neutral does not establish antagonist recruitment.'),
 'breathing:inhale':pair('Inspiration','Return from inspiration',names('diaphragm','external intercostal'),[],poseSources.trunk,'Quiet expiration relies mainly on elastic recoil; a decreasing inspiration control does not imply abdominal contraction.'),
 'breathing:exhale':pair('Forced expiration','Return from forced expiration',names('rectus abdominis','internal abdominal oblique','external abdominal oblique','transversus abdominis'),[],poseSources.trunk,'Interosseous internal intercostal fibers can assist forced expiration. Their whole-muscle meshes are left neutral because interchondral fibers assist inspiration.'),
};

function fingerDirection(joint,axis){
 const digit=joint.match(/^(thumb|index|middle|ring|little)-(mcp|pip|dip|ip)$/);
 if(!digit)return null;
 const [name,level]=digit.slice(1);
 if(axis==='abduction'&&level==='mcp'&&name!=='thumb'){
  if(name==='middle')return pair('Middle finger radial abduction','Middle finger return toward rest',
   names('(?:second|2nd) dorsal interosseous','dorsal interossei muscles? of hand'),
   names('(?:third|3rd) dorsal interosseous','dorsal interossei muscles? of hand'),poseSources.hand,
   'The second dorsal interosseous moves the middle finger toward the index side; the third can move it back. There is no middle-finger palmar interosseous. The atlas groups the dorsal interossei into one surface, so its highlight includes muscles that are not responsible for this direction.');
  return pair(name[0].toUpperCase()+name.slice(1)+' MCP abduction',name[0].toUpperCase()+name.slice(1)+' MCP adduction',
   name==='little'?names('abductor digiti minimi of hand'):names('dorsal interosse(?:i|ous)'),
   names('palmar interosse(?:i|ous)'),poseSources.hand,
   'Abduction spreads this finger from the hand’s middle-finger axis; adduction brings it back. Grouped muscle surfaces include portions serving other fingers. Finger spreading is more limited when the MCP joint is deeply flexed.');
 }
 if(axis!=='flexion')return null;
 let flex,extend;
 if(name==='thumb'){
  flex=level==='ip'?names('flexor pollicis longus'):names('flexor pollicis longus','flexor pollicis brevis');
  extend=level==='ip'?names('extensor pollicis longus'):names('extensor pollicis longus','extensor pollicis brevis');
 }else{
  flex=level==='dip'?names('flexor digitorum profundus'):level==='mcp'?both(fingerFlex,fingerIntrinsic):fingerFlex;
  extend=level==='mcp'?fingerExt:both(fingerExt,fingerIntrinsic);
  if(name==='index')extend=both(extend,names('extensor indicis'));
  if(name==='little'){
   extend=both(extend,names('extensor digiti minimi'));
   if(level==='mcp')flex=both(flex,names('flexor digiti minimi of hand'));
  }
 }
 return pair(name[0].toUpperCase()+name.slice(1)+' '+level.toUpperCase()+' flexion',name[0].toUpperCase()+name.slice(1)+' '+level.toUpperCase()+' extension',flex,extend,poseSources.upper,'Shared finger muscle meshes contain fibers or tendons for more than one digit; the highlight is a muscle-level action cue. Lumbricals and interossei flex MCP joints and extend IP joints.');
}

function belongsToDigit(part,digit){
 if(!digit)return true;
 const name=normal(part.name||part.muscleName||part.sourceName||part.id);
 if(part.region==='pelvis-leg-foot'||/\b(foot|toe|toes)\b/.test(name))return false;
 const namedDigit=name.match(/\b(thumb|index|middle|ring|little)(?: finger)?\b/)?.[1];
 if(namedDigit&&namedDigit!==digit)return false;
 // Keep grouped atlas meshes available, but an individually named intrinsic
 // muscle must attach to the selected digit. Dorsal interossei 2 and 3 both
 // act on the middle finger; neither crosses the index or ring MCP joint.
 const ordinal=name.match(/\b(first|second|third|fourth|1st|2nd|3rd|4th)\b/)?.[1];
 if(!ordinal)return true;
 const index={first:0,'1st':0,second:1,'2nd':1,third:2,'3rd':2,fourth:3,'4th':3}[ordinal];
 const family=/dorsal interosse/.test(name)?['index','middle','middle','ring']:
  /palmar interosse/.test(name)?['index','ring','little']:
  /lumbrical/.test(name)?['index','middle','ring','little']:null;
 return !family||family[index]===digit;
}

const opposite=side=>side==='right'?'left':'right';
function axialRoles(kind,axis,positive,parts){
 const side=positive?'right':'left';
 let ipsilateral=[],contralateral=[];
 if(kind==='neck'&&axis==='rotation'){
  ipsilateral=names('splenius capitis','splenius colli','longissimus capitis','obliquus inferior capitis','rectus posterior major capitis');
  contralateral=names('sternocleidomastoid','semispinalis colli','multifidus colli');
 }else if(['trunk','thoracic-turn'].includes(kind)&&axis==='rotation'){
  ipsilateral=names('internal abdominal oblique');
  contralateral=names('external abdominal oblique','multifidus (?:lumborum|thoracis)','rotatores');
 }else if(kind==='neck'&&axis==='lateral'){
  ipsilateral=names('sternocleidomastoid','scalenus (?:anterior|medius|posterior)','splenius capitis','splenius colli','longissimus capitis','longissimus colli','rectus lateralis capitis');
 }else if(kind==='trunk'&&axis==='lateral'){
  ipsilateral=both(trunkExt,names('quadratus lumborum','internal abdominal oblique','external abdominal oblique'));
 }else if(kind==='jaw'&&axis==='excursion'){
  // Contralateral pterygoids move the jaw toward the working side.
  contralateral=names('inferior head of lateral pterygoid','medial pterygoid');
 }else return null;
 const select=(ipsi,contra)=>parts.filter(part=>part.side===ipsi&&matches(part,ipsilateral)||part.side===contra&&matches(part,contralateral)).map(part=>part.key||part.id);
 const label=(kind==='thoracic-turn'?'Thoracic spine':kind[0].toUpperCase()+kind.slice(1))+' '+(axis==='rotation'?'rotation':axis==='lateral'?'side bend':'excursion')+' to the '+side;
 return {label,contributors:select(side,opposite(side)),opposing:select(opposite(side),side),source:['trunk','thoracic-turn'].includes(kind)?poseSources.trunk:poseSources.axial,note:kind==='jaw'?'Lateral excursion couples both temporomandibular joints. These highlights are selected possible contributors.':'Right and left muscles can contribute differently to rotation and side bending.'};
}

const roleNote='Possible contributors for the last adjustment. A pose does not measure activity, tension, or muscle shortening; recruitment depends on load and the task. Opposing actions can be active at the same time.';

/** Exact surface keys, never an activity estimate. Positive signs follow the rig manifest. */
export function poseRoles(joint,axisId,delta,parts=[],pose={}){
 const empty={label:'Pose held',contributors:[],opposing:[],evidence:'possible-roles',note:roleNote,source:poseSources.recruitment};
 if(!joint||!Number.isFinite(delta)||Math.abs(delta)<=epsilon)return empty;
 const kind=joint.id.replace(/^(right|left)-/,'');
 const positive=delta>0;
 if(kind==='pelvic-control'&&axisId==='obliquity'){
  const rightAbductors=parts.filter(part=>part.side==='right'&&matches(part,hipAbd)).map(part=>part.key||part.id);
  return {...empty,label:positive?'Controlled pelvic drop':'Level the pelvis',contributors:rightAbductors,source:poseSources.lower,
   note:roleNote+' In the right-leg stance example, the right hip abductors can control the left side lowering and help bring the pelvis back to level.'};
 }
 const axial=axialRoles(kind,axisId,positive,parts);
 if(axial)return {...empty,...axial,note:roleNote+' '+axial.note};
 let direction=directions[kind+':'+axisId]||fingerDirection(kind,axisId);
 if(!direction)return {...empty,label:'Joint adjustment',note:roleNote+' Muscle roles have not been mapped for this axis.'};
 if(kind==='hip'&&axisId==='rotation'&&pose[joint.id]?.flexion>25){
  const deepFlexion=pose[joint.id].flexion>=80;
  direction=pair('Hip internal rotation','Hip external rotation',
   deepFlexion?both(hipInternal,names('piriformis')):hipInternal,
   names('obturator internus','obturator externus','quadratus femoris'),
   'https://nmbl.stanford.edu/publications/pdf/Delp1999.pdf',
   deepFlexion?'With the hip deeply flexed, piriformis can assist internal rotation. Gluteal compartments can have different actions, so their grouped surfaces stay neutral.':
    'Rotational leverage changes as the hip flexes. Compare near-neutral and deep flexion rather than assigning a fixed role to the whole gluteal surface.');
 }
 const side=joint.side||joint.id.match(/^(left|right)-/)?.[1];
 const digit=kind.match(/^(thumb|index|middle|ring|little)-/)?.[1];
 const candidates=parts.filter(part=>(!['left','right'].includes(side)||part.side===side)&&belongsToDigit(part,digit));
 const choose=patterns=>candidates.filter(part=>matches(part,patterns)).map(part=>part.key||part.id);
 return {...empty,label:positive?direction.positive:direction.negative,
  contributors:choose(positive?direction.up:direction.down),opposing:choose(positive?direction.down:direction.up),
  source:direction.source,note:roleNote+(direction.note?' '+direction.note:'')};
}

export function combinedPoseRoles(descriptors,changes,parts=[],pose={}){
 const byId=new Map(descriptors.map(joint=>[joint.id,joint]));
 const movements=(changes||[]).map(change=>poseRoles(byId.get(change.joint),change.axis,change.delta,parts,pose)).filter(role=>role.label!=='Pose held');
 const contributors=[...new Set(movements.flatMap(role=>role.contributors))];
 const allOpposing=[...new Set(movements.flatMap(role=>role.opposing))];
 const shared=contributors.filter(key=>allOpposing.includes(key));
 const movementNotes=[...new Set(movements.map(role=>role.note.startsWith(roleNote)?role.note.slice(roleNote.length).trim():role.note).filter(Boolean))];
 return {label:movements.length?movements.map(role=>role.label).join(' + '):'Pose held',contributors,
  opposing:allOpposing.filter(key=>!contributors.includes(key)),shared,movements,movementNotes,
  evidence:'possible-roles',note:roleNote+(movementNotes.length?' '+movementNotes.join(' '):'')+(shared.length?' Some muscles contribute to one adjusted joint and oppose another. Their net length or activity is not determined.':''),
  sources:[...new Set(movements.map(role=>role.source))]};
}
