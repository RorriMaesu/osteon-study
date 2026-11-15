import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PoseHistory,neutralPose,poseChanges,poseRoles,combinedPoseRoles,poseSources} from '../src/motion-pose-core.js';

const descriptors=[
 {id:'right-elbow',side:'right',axes:[{id:'flexion',min:0,max:115,neutral:0}]},
 {id:'left-elbow',side:'left',axes:[{id:'flexion',min:0,max:115,neutral:0}]},
 {id:'right-hip',side:'right',axes:[{id:'flexion',min:-22,max:85,neutral:0},{id:'abduction',min:-10,max:30,neutral:0}]},
 {id:'right-knee',side:'right',axes:[{id:'flexion',min:0,max:85,neutral:0}]},
];
const parts=JSON.parse(readFileSync(new URL('../src/muscle-models.json',import.meta.url),'utf8')).components;
const descriptor=id=>({id,side:id.startsWith('right-')?'right':id.startsWith('left-')?'left':'midline'});
const roles=(id,axis,delta=1)=>poseRoles(descriptor(id),axis,delta,parts);
const named=keys=>keys.map(id=>parts.find(part=>part.id===id)?.name);

test('deep hip flexion changes the piriformis cue while grouped gluteal surfaces stay unassigned',()=>{
 const hip=descriptor('right-hip'),state=flexion=>({'right-hip':{flexion}});
 const neutral=poseRoles(hip,'rotation',1,parts,state(0)),bent=poseRoles(hip,'rotation',1,parts,state(82));
 assert(named(neutral.opposing).some(name=>/piriformis/i.test(name)));
 assert(named(bent.contributors).some(name=>/piriformis/i.test(name)));
 assert(!named(bent.opposing).some(name=>/piriformis/i.test(name)));
 assert(!named([...bent.contributors,...bent.opposing]).some(name=>/gluteus/i.test(name)));
});

test('neutral pose includes all axes and immutable prior states remain intact',()=>{
 const history=new PoseHistory(descriptors),initial=history.values;
 assert.deepEqual(initial,neutralPose(descriptors));
 assert.ok(Object.isFrozen(initial)&&Object.isFrozen(initial['right-hip']));
 assert.equal(history.set('right-elbow','flexion',21.25),true);
 assert.equal(initial['right-elbow'].flexion,0);
 assert.equal(history.values['right-elbow'].flexion,21.25);
 assert.equal(history.values['left-elbow'].flexion,0);
 assert.throws(()=>{initial['right-elbow'].flexion=98;},TypeError);
});

test('joint limits reject nonfinite coordinates and clamp rather than overextend',()=>{
 const history=new PoseHistory(descriptors);
 history.set('right-elbow','flexion',200);
 assert.equal(history.values['right-elbow'].flexion,115);
 history.set('right-elbow','flexion',-90);
 assert.equal(history.values['right-elbow'].flexion,0);
 for(const value of [NaN,Infinity,-Infinity,'40',null])assert.equal(history.set('right-elbow','flexion',value),false);
 assert.equal(history.set('absent-joint','flexion',40),false);
 assert.equal(history.set('right-elbow','rotation',40),false);
 assert.equal(history.values['right-elbow'].flexion,0);
});

test('invalid multi-joint IK input cannot leave a partly applied pose',()=>{
 const history=new PoseHistory(descriptors);
 assert.equal(history.patch({'right-hip':{flexion:20},'right-knee':{flexion:NaN}}),false);
 assert.equal(history.values['right-hip'].flexion,0);
 assert.equal(history.canUndo,false);
});

test('a drag with hundreds of updates is one undo step and redo returns the final pose',()=>{
 const history=new PoseHistory(descriptors);
 history.begin();
 assert.equal(history.begin(),false);
 for(let index=1;index<=200;index++)history.set('right-elbow','flexion',index/2);
 assert.equal(history.canUndo,false);
 assert.equal(history.undo(),false);
 assert.equal(history.commit(),true);
 assert.equal(history.values['right-elbow'].flexion,100);
 assert.equal(history.changes.length,1);
 assert.equal(history.changes[0].delta,100);
 assert.equal(history.undo(),true);
 assert.equal(history.values['right-elbow'].flexion,0);
 assert.equal(history.canUndo,false);
 assert.equal(history.changes.length,0);
 assert.equal(history.redo(),true);
 assert.equal(history.values['right-elbow'].flexion,100);
 assert.equal(history.changes.length,0);
});

test('cancel rolls back the entire drag without losing the preexisting redo branch',()=>{
 const history=new PoseHistory(descriptors);
 history.set('right-elbow','flexion',40);history.undo();
 history.begin();history.set('right-elbow','flexion',60);history.patch({'right-hip':{flexion:20}});
 assert.equal(history.cancel(),true);
 assert.equal(history.values['right-elbow'].flexion,0);
 assert.equal(history.values['right-hip'].flexion,0);
 assert.equal(history.redo(),true);
 assert.equal(history.values['right-elbow'].flexion,40);
});

test('pausing a returning motion keeps its final direction while undo restores the entire preview',()=>{
 const history=new PoseHistory(descriptors,{initial:{'right-elbow':{flexion:20}}});
 history.begin();history.set('right-elbow','flexion',60);history.set('right-elbow','flexion',50);
 assert.equal(history.commit({preserveDirection:true}),true);
 assert.deepEqual(history.changes,[{joint:'right-elbow',axis:'flexion',before:60,after:50,delta:-10}]);
 const role=combinedPoseRoles(descriptors,history.changes,parts);
 assert.equal(role.label,'Elbow extension');
 assert.ok(named(role.contributors).includes('Long head of triceps brachii'));
 assert.equal(history.undo(),true);
 assert.equal(history.values['right-elbow'].flexion,20);
 assert.equal(history.canUndo,false);
 assert.equal(history.redo(),true);
 assert.equal(history.values['right-elbow'].flexion,50);
});

test('direction preservation does not create an undo entry for a completed return to the start',()=>{
 const history=new PoseHistory(descriptors,{initial:{'right-elbow':{flexion:20}}});
 history.begin();history.set('right-elbow','flexion',60);history.set('right-elbow','flexion',20);
 assert.equal(history.commit({preserveDirection:true}),false);
 assert.deepEqual(history.changes,[]);
 assert.equal(history.canUndo,false);
});

test('returning to the start during a drag creates no empty undo entry',()=>{
 const history=new PoseHistory(descriptors);
 history.begin();history.set('right-elbow','flexion',40);history.set('right-elbow','flexion',0);
 assert.equal(history.commit(),false);
 assert.equal(history.canUndo,false);
 assert.equal(history.changes.length,0);
});

test('joint locks prevent angle edits and survive other joints moving',()=>{
 const history=new PoseHistory(descriptors);
 history.set('right-hip','flexion',10);
 history.setLocked('right-hip',true);
 history.begin();history.patch({'right-hip':{flexion:80,abduction:20},'right-knee':{flexion:55}});history.commit();
 assert.deepEqual(history.values['right-hip'],{flexion:10,abduction:0});
 assert.equal(history.values['right-knee'].flexion,55);
 assert.ok(history.isLocked('right-hip'));
 history.reset();
 assert.equal(history.values['right-knee'].flexion,0);
 assert.equal(history.values['right-hip'].flexion,10);
 history.setLocked('right-hip',false);history.reset('right-hip');
 assert.equal(history.values['right-hip'].flexion,0);
});

test('lock changes are reversible and canceled gesture locks are rolled back',()=>{
 const history=new PoseHistory(descriptors);
 history.setLocked('right-elbow',true);history.undo();
 assert.equal(history.isLocked('right-elbow'),false);
 history.redo();assert.equal(history.isLocked('right-elbow'),true);
 history.begin();history.setLocked('right-elbow',false);history.set('right-elbow','flexion',45);history.cancel();
 assert.equal(history.isLocked('right-elbow'),true);
 assert.equal(history.values['right-elbow'].flexion,0);
});

test('a coupled shoulder angle cannot alter a locked shoulder girdle',()=>{
 const controls=[
  {id:'right-scapula',axes:[{id:'elevation',min:-6,max:10}]},
  {id:'right-shoulder',axes:[{id:'abduction',min:0,max:90,requiresUnlocked:['right-scapula']},{id:'flexion',min:-20,max:90}]},
 ];
 const history=new PoseHistory(controls);
 history.set('right-shoulder','abduction',25);
 history.setLocked('right-scapula',true);
 assert.equal(history.isLocked('right-shoulder'),false);
 assert.equal(history.isAxisLocked('right-shoulder','abduction'),true);
 assert.equal(history.isAxisLocked('right-shoulder','flexion'),false);
 history.begin();
 history.patch({'right-shoulder':{abduction:70,flexion:20}});
 history.commit();
 assert.deepEqual(history.values['right-shoulder'],{abduction:25,flexion:20});
 history.setLocked('right-scapula',false);
 assert.equal(history.isAxisLocked('right-shoulder','abduction'),false);
 history.set('right-shoulder','abduction',40);
 assert.equal(history.values['right-shoulder'].abduction,40);
 history.setLocked('right-shoulder',true);
 assert.equal(history.isAxisLocked('right-shoulder','flexion'),true);
 assert.equal(history.isAxisLocked('right-shoulder','abduction'),true);
});

test('dependency descriptors are immutable and cannot reference absent locks',()=>{
 const dependency=['left-elbow'],data=[...descriptors,{id:'dependent',axes:[{id:'flexion',min:0,max:90,requiresUnlocked:dependency}]}];
 const history=new PoseHistory(data);
 dependency.length=0;
 history.setLocked('left-elbow',true);
 assert.equal(history.isAxisLocked('dependent','flexion'),true);
 assert.throws(()=>new PoseHistory([{id:'joint',axes:[{id:'axis',min:0,max:90,requiresUnlocked:['missing']}]}]),/existing joint locks/);
});

test('new edits discard redo and history is bounded',()=>{
 const history=new PoseHistory(descriptors,{limit:2});
 for(const angle of [10,20,30])history.set('right-elbow','flexion',angle);
 history.undo();history.undo();
 assert.equal(history.values['right-elbow'].flexion,10);
 assert.equal(history.undo(),false);
 history.set('right-elbow','flexion',15);
 assert.equal(history.canRedo,false);
});

test('invalid descriptors fail before any pose can be constructed',()=>{
 assert.throws(()=>new PoseHistory([...descriptors,descriptors[0]]),/unique IDs/);
 assert.throws(()=>new PoseHistory([{id:'joint',axes:[{id:'axis',min:90,max:0}]}]),/finite ordered limits/);
 assert.throws(()=>new PoseHistory([{id:'joint',axes:[{id:'axis',min:0,max:90},{id:'axis',min:0,max:90}]}]),/unique IDs/);
});

test('pose delta reports only the actual direction and value of each changed axis',()=>{
 const before=neutralPose(descriptors),history=new PoseHistory(descriptors);
 history.patch({'right-hip':{flexion:20,abduction:-5},'right-knee':{flexion:15}});
 assert.deepEqual(poseChanges(before,history.values).map(({joint,axis,delta})=>[joint,axis,delta]),[
  ['right-hip','flexion',20],['right-hip','abduction',-5],['right-knee','flexion',15],
 ]);
});

test('a held pose does not assert activity or an agonist role',()=>{
 const result=roles('right-elbow','flexion',0);
 assert.equal(result.label,'Pose held');
 assert.deepEqual(result.contributors,[]);
 assert.deepEqual(result.opposing,[]);
 assert.match(result.note,/does not measure activity/);
});

test('elbow flexion identifies correct exact heads and side, reversing roles on extension',()=>{
 const flex=roles('right-elbow','flexion'),extend=roles('right-elbow','flexion',-1);
 assert.deepEqual(named(flex.contributors).sort(),['Brachialis muscle','Brachioradialis muscle','Long head of biceps brachii','Short head of biceps brachii'].sort());
 assert.equal(flex.opposing.length,4);
 assert.ok([...flex.contributors,...flex.opposing].every(id=>parts.find(part=>part.id===id).side==='right'));
 assert.deepEqual(extend.contributors,flex.opposing);
 assert.deepEqual(extend.opposing,flex.contributors);
});

test('hip extension does not misidentify the short head of biceps femoris as crossing the hip',()=>{
 const hip=roles('left-hip','flexion',-1),knee=roles('left-knee','flexion');
 assert.ok(named(hip.contributors).includes('Long head of biceps femoris'));
 assert.ok(!named(hip.contributors).includes('Short head of biceps femoris'));
 assert.ok(named(knee.contributors).includes('Short head of biceps femoris'));
 assert.ok(!named(knee.contributors).includes('Soleus muscle'));
});

test('shoulder rotation separates specific deltoid heads and cuff roles',()=>{
 const result=roles('right-shoulder','rotation');
 assert.ok(named(result.contributors).includes('Subscapularis muscle'));
 assert.ok(named(result.contributors).includes('Clavicular part of deltoid muscle'));
 assert.ok(!named(result.contributors).includes('Scapular spinal part of deltoid muscle'));
 assert.ok(named(result.opposing).includes('Infraspinatus muscle'));
 assert.ok(named(result.opposing).includes('Teres minor muscle'));
});

test('coupled shoulder elevation includes scapular upward rotators without coloring the middle trapezius as one',()=>{
 const result=roles('left-shoulder','abduction'),contributors=named(result.contributors);
 assert.ok(contributors.includes('Acromial part of deltoid muscle'));
 assert.ok(contributors.includes('Supraspinatus muscle'));
 assert.ok(contributors.includes('Serratus anterior muscle'));
 assert.ok(contributors.includes('Upper (descending) part of trapezius'));
 assert.ok(contributors.includes('Lower (ascending) part of trapezius'));
 assert.ok(!contributors.includes('Transverse part of trapezius muscle'));
 assert.match(result.note,/shoulder-girdle/);
});

test('forearm and wrist directions retain their different anatomical meanings',()=>{
 const pronation=roles('left-forearm','pronation');
 assert.ok(named(pronation.contributors).includes('Pronator quadratus'));
 assert.ok(named(pronation.contributors).includes('Deep head of pronator teres'));
 assert.ok(named(pronation.opposing).includes('Supinator'));
 assert.ok(!named(pronation.contributors).includes('Brachioradialis muscle'));
 const ulnar=roles('left-wrist','deviation');
 assert.ok(named(ulnar.contributors).some(name=>name.includes('flexor carpi ulnaris')));
 assert.ok(named(ulnar.contributors).some(name=>name.includes('extensor carpi ulnaris')));
 assert.ok(named(ulnar.opposing).includes('Flexor carpi radialis'));
});

test('DIP flexion excludes superficialis and MCP/IP intrinsic actions reverse',()=>{
 const dip=roles('right-index-dip','flexion'),mcp=roles('right-index-mcp','flexion'),pip=roles('right-index-pip','flexion');
 assert.deepEqual(named(dip.contributors),['Flexor digitorum profundus']);
 assert.ok(named(mcp.contributors).includes('Lumbrical muscles of hand'));
 assert.ok(named(pip.opposing).includes('Lumbrical muscles of hand'));
 assert.ok(named(pip.opposing).includes('Extensor indicis'));
 assert.ok(!named(roles('right-middle-pip','flexion').opposing).includes('Extensor indicis'));
});

test('finger spreading selects the right digit and does not invent a middle-finger palmar interosseous',()=>{
 const index=roles('right-index-mcp','abduction');
 assert.ok(named(index.contributors).includes('Dorsal interossei muscles of hand'));
 assert.ok(named(index.opposing).includes('Palmar interosseous muscle of index finger'));
 assert.ok(!named(index.opposing).includes('Palmar interosseous muscle of ring finger'));
 const little=roles('left-little-mcp','abduction');
 assert.deepEqual(named(little.contributors),['Abductor digiti minimi of hand']);
 assert.ok(named(little.opposing).includes('Palmar interosseous muscle of little finger'));
 const exact=Array.from({length:4},(_,i)=>({key:'dorsal-'+i,name:['First','Second','Third','Fourth'][i]+' dorsal interosseous muscle of hand',side:'right'}));
 exact.push({key:'palmar',name:'Palmar interossei muscles',side:'right'});
 const middle=poseRoles(descriptor('right-middle-mcp'),'abduction',1,exact);
 assert.deepEqual(middle.contributors,['dorsal-1']);
 assert.deepEqual(middle.opposing,['dorsal-2']);
 assert.match(roles('right-middle-mcp','abduction').note,/groups the dorsal interossei/);
 assert.ok(!named(roles('right-middle-mcp','abduction').contributors).some(name=>/palmar/i.test(name)));
});

test('hindfoot inversion and eversion use tibial and fibular muscles on the selected side',()=>{
 const candidates=[
  {key:'ta-r',name:'Tibialis anterior muscle',side:'right'},
  {key:'tp-r',name:'Tibialis posterior muscle',side:'right'},
  {key:'fl-r',name:'Fibularis longus muscle',side:'right'},
  {key:'fb-r',name:'Fibularis brevis muscle',side:'right'},
  {key:'ft-r',name:'Fibularis tertius muscle',side:'right'},
  {key:'ta-l',name:'Tibialis anterior muscle',side:'left'},
  {key:'bad',name:'Tendon sheath of tibialis posterior muscle',side:'right'},
 ];
 const inversion=poseRoles(descriptor('right-subtalar'),'inversion',1,candidates);
 assert.deepEqual(inversion.contributors,['ta-r','tp-r']);
 assert.deepEqual(inversion.opposing,['fl-r','fb-r','ft-r']);
 assert.deepEqual(poseRoles(descriptor('right-subtalar'),'inversion',-1,candidates).contributors,inversion.opposing);
 assert.match(inversion.note,/coupled hindfoot and midfoot/);
});

test('thumb IP action excludes the brevis muscles that do not reach the distal phalanx',()=>{
 const result=roles('left-thumb-ip','flexion');
 assert.deepEqual(named(result.contributors),['Flexor pollicis longus']);
 assert.deepEqual(named(result.opposing),['Extensor pollicis longus']);
});

test('opponens contributes to thumb base components without implying full opposition',()=>{
 const flexion=roles('right-thumb-cmc','flexion'),abduction=roles('right-thumb-cmc','abduction');
 assert.ok(named(flexion.contributors).includes('Opponens pollicis muscle'));
 assert.ok(named(abduction.contributors).includes('Opponens pollicis muscle'));
 assert.match(flexion.note,/does not reproduce full opposition/);
 assert.ok(!named(roles('right-thumb-ip','flexion').contributors).includes('Opponens pollicis muscle'));
});

test('individually named interossei belong only to the digit they cross',()=>{
 const index=roles('right-index-mcp','flexion');
 assert.ok(named(index.contributors).includes('Palmar interosseous muscle of index finger'));
 assert.ok(!named(index.contributors).includes('Palmar interosseous muscle of ring finger'));
 assert.ok(!named(index.contributors).includes('Palmar interosseous muscle of little finger'));
 const ring=roles('right-ring-pip','flexion');
 assert.ok(named(ring.opposing).includes('Palmar interosseous muscle of ring finger'));
 assert.ok(!named(ring.opposing).includes('Palmar interosseous muscle of index finger'));
 assert.ok(!named(ring.opposing).includes('Palmar interosseous muscle of little finger'));
 const exact=Array.from({length:4},(_,i)=>({key:'dorsal-'+i,name:['First','Second','Third','Fourth'][i]+' dorsal interosseous muscle of hand',side:'right'}));
 exact.push({key:'foot',name:'First dorsal interosseous muscle of foot',side:'right'});
 assert.deepEqual(poseRoles(descriptor('right-index-mcp'),'flexion',1,exact).contributors,['dorsal-0']);
 assert.deepEqual(poseRoles(descriptor('right-middle-mcp'),'flexion',1,exact).contributors,['dorsal-1','dorsal-2']);
 assert.deepEqual(poseRoles(descriptor('right-ring-mcp'),'flexion',1,exact).contributors,['dorsal-3']);
});

test('trunk and neck rotation assign ipsilateral and contralateral muscles correctly',()=>{
 const trunk=roles('trunk','rotation');
 assert.ok(trunk.contributors.includes('muscle-internal-abdominal-oblique-muscle-r'));
 assert.ok(trunk.contributors.includes('muscle-external-abdominal-oblique-muscle-l'));
 assert.ok(!trunk.contributors.includes('muscle-external-abdominal-oblique-muscle-r'));
 const neck=roles('neck','rotation');
 assert.ok(neck.contributors.includes('muscle-sternocleidomastoid-muscle-l'));
 assert.ok(neck.contributors.includes('muscle-splenius-capitis-muscle-r'));
 assert.deepEqual(roles('neck','rotation',-1).contributors,neck.opposing);
});

test('jaw excursion uses contralateral pterygoids, jaw opening describes stabilized hyoid',()=>{
 const right=roles('jaw','excursion');
 assert.ok(right.contributors.every(id=>parts.find(part=>part.id===id).side==='left'));
 assert.ok(right.contributors.length>=2);
 assert.match(roles('jaw','opening').note,/hyoid is stabilized/);
});

test('returning breathing and smile shapes to neutral does not invent antagonist activation',()=>{
 for(const [joint,axis] of [['breathing','inhale'],['breathing','exhale'],['face-smile','smile']]){
  const forward=roles(joint,axis),back=roles(joint,axis,-1);
  assert.ok(forward.contributors.length>0,joint+' has named contributors');
  assert.equal(back.contributors.length,0,joint+' return has no claimed active contributor');
 }
 const inhale=roles('breathing','inhale');
 assert.ok(named(inhale.contributors).includes('Diaphragm'));
 assert.ok(!named(inhale.contributors).includes('Diaphragmatic fascia'));
 assert.ok(!named(roles('breathing','exhale').contributors).includes('Internal intercostal muscles'));
});

test('nonmuscular anatomy containing a muscle name never receives a contributor role',()=>{
 const result=poseRoles(descriptor('right-hip'),'flexion',-1,[
  {key:'good',name:'Gluteus maximus muscle',side:'right',kind:'muscle'},
  {key:'bursa',name:'Trochanteric bursa of gluteus maximus muscle',side:'right',kind:'muscle'},
  {key:'fascia',name:'Gluteus maximus fascia',side:'right'},
  {key:'wrong-kind',name:'Gluteus maximus muscle',side:'right',kind:'tissue'},
 ]);
 assert.deepEqual(result.contributors,['good']);
});

test('combined joint movements flag biarticular ambiguity without contradictory color memberships',()=>{
 const result=combinedPoseRoles(descriptors,[
  {joint:'right-hip',axis:'flexion',delta:10},{joint:'right-knee',axis:'flexion',delta:10},
 ],parts);
 const rectus='muscle-rectus-femoris-muscle-r';
 assert.ok(result.shared.includes(rectus));
 assert.ok(result.contributors.includes(rectus));
 assert.ok(!result.opposing.includes(rectus));
 assert.match(result.note,/net length or activity is not determined/);
 assert.equal(result.evidence,'possible-roles');
 assert.deepEqual(result.sources,[poseSources.lower]);
});

test('unknown axes remain explicitly unmapped instead of supplying generic active muscles',()=>{
 const result=roles('right-elbow','unreviewed');
 assert.deepEqual(result.contributors,[]);
 assert.match(result.note,/not been mapped/);
});

test('combined role feedback retains action-specific limitations instead of dropping them',()=>{
 const joint={id:'breathing',side:'midline'},result=combinedPoseRoles([joint],[{joint:'breathing',axis:'inhale',delta:-10}],parts);
 assert.equal(result.contributors.length,0);
 assert.match(result.note,/elastic recoil/);
 assert.equal(result.movementNotes.length,1);
});

test('every shipped pose axis maps to exact available surfaces or an explicitly passive return',()=>{
 const meta=JSON.parse(readFileSync(new URL('../assets/motion-pose-body.json',import.meta.url),'utf8'));
 const glb=readFileSync(new URL('../assets/motion-pose-body.glb',import.meta.url));
 const scene=JSON.parse(glb.subarray(20,20+glb.readUInt32LE(12)));
 const surfaces=scene.nodes.filter(node=>node.extras?.poseMuscle).map(({extras})=>({key:extras.muscleId,name:extras.poseName,side:extras.poseSide}));
 const available=new Set(surfaces.map(part=>part.key));
 assert.equal(surfaces.length,meta.totalMuscleSurfaces);
 const passive=new Set(['face-smile:smile','breathing:inhale','breathing:exhale']);
 for(const joint of meta.joints)for(const axis of joint.axes)for(const delta of [1,-1]){
  const result=poseRoles(joint,axis.id,delta,surfaces),name=joint.id+':'+axis.id;
  assert.notEqual(result.label,'Joint adjustment',name+' has a reviewed role mapping');
  if(delta===-1&&passive.has(name))assert.equal(result.contributors.length,0,name+' passive return');
  else assert.ok(result.contributors.length>0,name+' has available contributor geometry');
  for(const key of [...result.contributors,...result.opposing])assert.ok(available.has(key),name+' uses existing surface '+key);
  assert.equal(result.evidence,'possible-roles');
 }
});
