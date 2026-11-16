import test from 'node:test';
import assert from 'node:assert/strict';
import {muscleChecklistBank,muscleChecklistTargets,muscleChecklistQuestionsFor} from '../src/muscle-checklist-bank.js';
import {muscleFigureTargets} from '../src/muscle-figure-targets.js';
import {assessQuestion,createSession,validSession,results} from '../src/exam-core.js';
import {questions} from '../src/learning-data.js';
import {createStudyBackup,restoreStudyBackup} from '../src/study-backup.js';

// Independently transcribed from the F24 list. Repeated appearances are counted
// once; combined intercostal/retinacular rows are split, and named groups remain
// distinct targets alongside their members. Course spelling is normalized below.
const requiredNames=`Sternocleidomastoid
Orbicularis oculi
Orbicularis oris
Zygomaticus major
Temporalis
Masseter
Hyoglossus
Styloglossus
Erector spinae
Levator scapulae
Trapezius
Rhomboids
Pectoralis minor
External intercostals
Internal intercostals
Rectus abdominis
External oblique
Internal oblique
Transversus abdominis
Diaphragm
Ischiocavernosus
Pelvic diaphragm
External urethral sphincter
External anal sphincter
Latissimus dorsi
Deltoid
Pectoralis major
Supraspinatus
Infraspinatus
Subscapularis
Teres minor
Rotator cuff
Biceps brachii
Brachialis
Triceps brachii
Supinator
Pronator teres
Flexor carpi radialis
Extensor carpi radialis
Flexor digitorum superficialis
Extensor digitorum
Extensor pollicis longus
Opponens pollicis
Flexor retinaculum of wrist
Extensor retinaculum of wrist
Gluteus maximus
Gluteus medius
Psoas major
Adductor longus
Rectus femoris
Vastus lateralis
Vastus medialis
Vastus intermedius
Quadriceps femoris
Biceps femoris
Semitendinosus
Semimembranosus
Hamstrings
Gastrocnemius
Soleus
Tibialis anterior
Flexor digitorum longus
Extensor digitorum longus
Calcaneal tendon
Aponeurosis
Fascia
Tendon sheaths`.split('\n');
const names=muscleChecklistQuestionsFor(undefined,{kind:'name'});
const find=name=>names.find(q=>q.answer===name);
const sorted=values=>[...values].sort();
const normalize=value=>value.toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const memory=()=>{const data=new Map();return {getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,String(value)),removeItem:key=>data.delete(key)};};

test('the professor list has exactly one name and written task for every independently transcribed entry',()=>{
 assert.equal(requiredNames.length,67);
 assert.equal(new Set(requiredNames).size,67);
 assert.deepEqual(sorted(muscleChecklistTargets.map(card=>card.name)),sorted(requiredNames));
 const written=muscleChecklistQuestionsFor(undefined,{kind:'written'});
 assert.equal(names.length,67);assert.equal(written.length,67);
 assert.deepEqual(sorted(names.map(q=>q.answer)),sorted(requiredNames));
 assert.deepEqual(sorted(written.map(q=>q.checklistTargetName)),sorted(requiredNames));
 assert.equal(new Set(muscleChecklistBank.map(q=>q.id)).size,muscleChecklistBank.length);
 assert.deepEqual(muscleChecklistTargets.reduce((counts,card)=>(counts[card.kind]=(counts[card.kind]||0)+1,counts),{}),{muscle:51,group:10,'connective tissue':6});
 for(const q of names){assert.equal(q.type,'identify');assert.equal(q.figure,undefined);assert.equal(q.answerPolicy.kind,'structure');}
});

test('name clues do not print their canonical answer or any accepted alternate name',()=>{
 for(const q of names){
  assert.ok(q.prompt.length>80,q.answer+' needs an informative clue');
  const prompt=' '+normalize(q.prompt)+' ';
  for(const accepted of [q.answer,...q.aliases])assert.equal(prompt.includes(' '+normalize(accepted)+' '),false,q.answer+' leaks '+accepted);
 }
});

test('visual practice remains limited to 33 reviewed figures and selection does not silently add other entries',()=>{
 const visual=muscleChecklistQuestionsFor(undefined,{kind:'visual'});
 assert.equal(visual.length,33);
 for(const q of visual){
  assert.equal(q.type,'identify');assert.ok(q.figure.startsWith('muscle-target:'));
  const target=muscleFigureTargets[q.figure.slice('muscle-target:'.length)];
  const card=muscleChecklistTargets.find(card=>card.id===q.checklistTargetId);
  assert.ok(target,q.id);assert.ok(card.figures.includes(target.figure),q.id);
 }
 const ids=[find('Sternocleidomastoid').checklistTargetId,find('Tendon sheaths').checklistTargetId];
 assert.equal(muscleChecklistQuestionsFor(ids,{kind:'name'}).length,2);
 assert.equal(muscleChecklistQuestionsFor(ids,{kind:'written'}).length,2);
 assert.ok(muscleChecklistQuestionsFor(ids).every(q=>ids.includes(q.checklistTargetId)));
 assert.deepEqual(muscleChecklistQuestionsFor([]),[]);
 assert.equal(muscleChecklistQuestionsFor().length,167);
});

test('source wording, harmless aliases and list spelling errors retain credit with the canonical correction',()=>{
 for(const [answer,response] of [
  ['External urethral sphincter','Urethral sphincter'],
  ['Calcaneal tendon','Achilles tendon'],
  ['Flexor retinaculum of wrist','Flexor retinaculum'],
  ['Extensor retinaculum of wrist','Extensor retinaculum'],
  ['Semitendinosus','Semitendinosis'],
  ['Semimembranosus','Semimembrinosus'],
  ['Sternocleidomastoid','SCM'],
  ['Diaphragm','Thoracic diaphragm'],
  ['Quadriceps femoris','Quadriceps'],
  ['Rhomboids','Rhomboid muscles'],
  ['Erector spinae','Erector spinae muscles'],
  ['Rotator cuff','Rotator cuff muscles'],
  ['Hamstrings','Hamstring muscles'],
  ['Extensor carpi radialis','Extensor carpi radialis longus and brevis'],
 ]){
  const outcome=assessQuestion(find(answer),response);
  assert.equal(outcome.correct,true,answer+' should accept '+response);
  assert.equal(outcome.correction,answer);
 }
 const spelling=assessQuestion(find('Sternocleidomastoid'),'sternocleidomastiod');
 assert.equal(spelling.correct,true);assert.equal(spelling.status,'spelling');
 assert.equal(spelling.strictCorrect,false);assert.equal(spelling.correction,'Sternocleidomastoid');
});

test('spelling tolerance cannot replace one named muscle with a different muscle or tissue',()=>{
 for(const [answer,response] of [
  ['Zygomaticus major','Zygomaticus minor'],
  ['Teres minor','Teres major'],
  ['Pectoralis major','Pectoralis minor'],
  ['Flexor digitorum superficialis','Flexor digitorum profundus'],
  ['Biceps brachii','Biceps femoris'],
  ['Vastus lateralis','Vastus medialis'],
  ['Internal oblique','External oblique'],
  ['Orbicularis oculi','Orbicularis oris'],
  ['Flexor digitorum longus','Extensor digitorum longus'],
  ['Calcaneal tendon','Gastrocnemius'],
 ])assert.equal(assessQuestion(find(answer),response).correct,false,answer+' must not accept '+response);
});

test('a full 67-entry name drill survives the real study backup and resumes without losing responses',()=>{
 const active=createSession(names,{mode:'practice',now:1000,rng:()=>.25});
 for(const q of names.slice(0,20))active.responses[q.id]=q.answer;
 active.responses[find('Sternocleidomastoid').id]='sternocleidomastiod';
 active.index=20;
 assert.equal(validSession(active,questions),true);
 const source=memory(),destination=memory();
 source.setItem('osteon-exams-v1',JSON.stringify({active,history:[],archives:[]}));
 restoreStudyBackup(destination,JSON.parse(JSON.stringify(createStudyBackup(source))));
 const resumed=JSON.parse(destination.getItem('osteon-exams-v1')).active;
 assert.deepEqual(resumed,active);assert.equal(resumed.ids.length,67);
 for(const q of names.slice(20))resumed.responses[q.id]=q.answer;
 resumed.status='submitted';resumed.submitted=2000;
 assert.equal(validSession(resumed,questions),true);
 const report=results(resumed,questions);
 assert.equal(report.total,67);assert.equal(report.correct,67);assert.equal(report.spelling,1);
 assert.equal(report.pending,0);assert.equal(report.earnedPoints,67);
});
