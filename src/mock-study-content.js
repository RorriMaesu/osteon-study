// Study cues are kept outside the frozen exam bank. Saved reports keep their original questions.
const topics = {
  'Sodium and potassium channels': {
    concept:'Membrane depolarization and repolarization',
    cue:'After the upstroke, which ion moves out to help bring voltage back down?',
    card:'Sodium entry depolarizes the membrane. Potassium exit helps repolarize it.',
    options:{
      'Sodium enters through voltage-gated channels':'Sodium entry drives the upstroke. Potassium exit helps bring the membrane potential back down.',
      'Calcium leaves the sarcoplasmic reticulum':'Calcium release helps turn on contraction. Potassium exit helps repolarize the surface membrane.',
      'Acetylcholine enters the motor neuron':'Acetylcholine acts at the motor end plate. Potassium leaving the muscle fiber helps repolarize its membrane.'
    }
  },
  'Muscle packaging': {
    concept:'Muscle connective tissue layers',
    cue:'Which connective tissue layer wraps one muscle fiber?',
    card:'Endomysium wraps a fiber, perimysium a fascicle, and epimysium the whole muscle.'
  },
  'Whole-muscle covering': {concept:'Muscle connective tissue layers'},
  'Fascicle covering': {concept:'Muscle connective tissue layers'},
  'Epimysium': {concept:'Muscle connective tissue layers'},
  'Perimysium': {concept:'Muscle connective tissue layers'},
  'Endomysium': {concept:'Muscle connective tissue layers'},
  'Neuromuscular junction': {
    concept:'Excitation of a skeletal fiber',
    cue:'What happens to the motor end-plate potential if its acetylcholine receptors are blocked?',
    card:'End-plate receptors allow net inward current. Blocking them weakens end-plate depolarization.'
  },
  'T-tubule signaling': {
    concept:'T-tubules and deep calcium release',
    cue:'If the surface fires but its T-tubules fail, which intracellular event is impaired?',
    card:'T-tubules carry excitation inward so nearby sarcoplasmic reticulum can release calcium.'
  },
  'Loss of T-tubules': {concept:'T-tubules and deep calcium release'},
  'Calcium-binding protein': {
    concept:'Calcium control of skeletal contraction',
    card:'In skeletal muscle, calcium binds troponin, moving tropomyosin away from actin’s binding sites.'
  },
  'Calcium regulation': {
    concept:'Calcium control of contraction',
    options:{
      'Myosin is unable to hydrolyze any ATP':'The tested change is failure to uncover actin’s binding sites when calcium cannot activate troponin.',
      'False':'Smooth muscle uses calcium–calmodulin to activate myosin light-chain kinase. Skeletal muscle uses troponin.'
    }
  },
  'Calcium storage': {concept:'Calcium storage and reuptake'},
  'Relaxation': {
    concept:'Calcium storage and reuptake',
    cue:'If calcium reuptake into the sarcoplasmic reticulum slows, what happens to relaxation?',
    card:'ATP-driven reuptake lowers cytosolic calcium. Slower reuptake delays relaxation.'
  },
  'Complete ATP depletion': {concept:'ATP in cross-bridge cycling and relaxation'},
  'Immediate ATP supply': {
    concept:'ATP sources during activity',
    cue:'In the first seconds of activity, what transfers a phosphate directly back to ADP?',
    card:'Creatine kinase transfers a phosphate from creatine phosphate to ADP, rapidly regenerating ATP.'
  },
  'ATP yield': {concept:'ATP sources during activity'},
  'Sliding filaments': {concept:'Sliding filaments and sarcomere bands'},
  'Sarcomere bands': {concept:'Sliding filaments and sarcomere bands'},
  'Filament lengths': {concept:'Sliding filaments and sarcomere bands'},
  'Contraction under load': {
    concept:'Contraction types under load',
    cue:'What contraction type produces tension while the active muscle lengthens?',
    card:'Eccentric contraction generates tension as the active muscle lengthens.'
  },
  'Isometric contraction': {
    concept:'Contraction types under load',
    cue:'What happens to tension and length while holding a load still?',
    card:'Isometric contraction generates tension with approximately unchanged muscle–tendon length.'
  },
  'Summation and tetanus': {concept:'Twitch summation and tetanus'},
  'Temporal summation': {
    concept:'Twitch summation and tetanus',
    cue:'Why can a second stimulus produce extra tension before the first twitch relaxes?',
    card:'Residual calcium allows additional cross-bridge activity before the first twitch fully relaxes.'
  },
  'Tension plateau': {concept:'Twitch summation and tetanus'},
  'Cardiac electrical coupling': {
    concept:'Electrical and mechanical cardiac connections',
    cue:'Which junction allows current to spread between cardiac cells?',
    card:'Gap junctions conduct current between cardiac cells. Desmosomes hold the cells together.',
    options:{Desmosomes:'Desmosomes hold neighboring cells together. Gap junctions allow electrical current to pass between them.'}
  },
  'Cardiac mechanical coupling': {
    concept:'Electrical and mechanical cardiac connections',
    cue:'What does a desmosome do when cardiac cells contract?',
    card:'Desmosomes resist mechanical separation. Gap junctions allow electrical coupling.'
  },
  'Resistance training': {concept:'Exercise adaptations',card:'Resistance training chiefly enlarges existing fibers by adding contractile proteins and myofibrils.'},
  'Endurance training': {concept:'Exercise adaptations',card:'Endurance training improves capillary supply and mitochondrial capacity.'},
  'Distinguishing finger flexor attachments': {
    concept:'Superficial and deep finger flexors',
    cue:'Which finger flexor reaches the middle phalanges, and which reaches the distal phalanges?',
    answer:'Flexor digitorum superficialis reaches the middle phalanges. Flexor digitorum profundus reaches the distal phalanges.',
    card:'FDS reaches middle phalanges and flexes PIP joints. FDP reaches distal phalanges and flexes DIP joints.',
    options:{'Ulna and interosseous membrane → distal phalanges → distal interphalangeal flexion':'That attachment and action pattern describes profundus. Superficialis reaches the middle phalanges and primarily flexes the PIP joints.'}
  },
  'Quadriceps and joint crossings': {concept:'Quadriceps and their joint crossings'},
  'Rectus femoris joint crossings': {concept:'Quadriceps and their joint crossings'},
  'Abdominal rotation': {
    concept:'Abdominal rotation',
    cue:'Which external and internal oblique pair rotates the trunk to the left?',
    card:'External oblique rotates the trunk to the opposite side. Internal oblique rotates it to the same side.'
  },
  'Infraspinatus': {
    concept:'Rotator cuff anatomy and function',
    card:'Infraspinatus lies below the scapular spine. Supraspinatus lies above it.',
    options:{Supraspinatus:'Find the scapular spine. The marked broad muscle lies below it. Supraspinatus lies above it.'}
  },
  'Rotator cuff': {concept:'Rotator cuff anatomy and function'},
  'Soleus': {
    concept:'Calf muscles and their tendon',
    card:'Soleus lies deep to gastrocnemius and plantarflexes the ankle. Gastrocnemius crosses the knee too.',
    options:{Gastrocnemius:'Use muscle depth to distinguish the two. The marker is on soleus, deep to the superficial gastrocnemius.'}
  },
  'Calcaneal tendon': {concept:'Calf muscles and their tendon',card:'The calcaneal tendon joins the calf plantarflexors to the heel bone.'}
};

const written = {
  'Complete ATP depletion': {
    'Myosin detachment':['What must bind myosin for an attached head to release actin?','ATP must bind the myosin head for it to detach.'],
    'Cross-bridge cycling':['Why can repeated cross-bridge cycling stop even while myosin remains attached?','Without ATP, myosin cannot detach and reset for another cycle.'],
    'Calcium and relaxation':['Why does complete ATP depletion impair relaxation even after stimulation ends?','The sarcoplasmic reticulum needs ATP to pump calcium back in. Reuptake fails and relaxation is impaired.']
  },
  'Loss of T-tubules': {
    'Signal penetration':['What carries the surface electrical signal into the muscle fiber?','T-tubules carry depolarization inward.'],
    'Calcium release':['What happens to calcium release deep in a fiber when T-tubules fail?','Coordinated release from the sarcoplasmic reticulum is impaired.'],
    'Contraction':['With poor calcium release deep in the fiber, how does contraction change?','Deep myofibrils activate poorly. Contraction is weaker or less synchronized.']
  },
  'Quadriceps and joint crossings': {
    'Rectus femoris':['Which quadriceps muscle also flexes the hip?','Rectus femoris.'],
    'Vastus lateralis':['Which vastus lies toward the outer side of the thigh?','Vastus lateralis.'],
    'Vastus medialis':['Which vastus lies toward the inner side of the thigh?','Vastus medialis.'],
    'Vastus intermedius':['Which vastus lies deep to rectus femoris?','Vastus intermedius.'],
    'Joint crossings':['What action do all four quadriceps share, and which one also flexes the hip?','All four extend the knee. Rectus femoris also crosses and flexes the hip.']
  },
  'Rotator cuff': {
    'Supraspinatus':['Which rotator cuff muscle lies above the scapular spine?','Supraspinatus.'],
    'Infraspinatus':['Which broad rotator cuff muscle lies below the scapular spine?','Infraspinatus.'],
    'Teres minor':['Which small cuff muscle lies along the lateral scapula just below infraspinatus?','Teres minor.'],
    'Subscapularis':['Which cuff muscle covers the anterior surface of the scapula?','Subscapularis.'],
    'Stabilization':['How do the cuff tendons help keep the shoulder stable during movement?','They help center the head of the humerus in the glenoid.']
  }
};

function topicContent(question) {
  return Object.hasOwn(topics,question.topic) ? topics[question.topic] : {};
}

export function studyConcept(question) {
  const topic=topicContent(question);
  return question.topic==='Calcium regulation'&&question.lesson==='10.8'
    ?'Smooth muscle calcium regulation'
    :topic.concept||question.topic||'Section '+question.lesson;
}

export function studyContrast(question,response) {
  const options=topicContent(question).options;
  const selected=response.trim();
  if(!options)return '';
  const key=Object.keys(options).find(value=>value.toLowerCase()===selected.toLowerCase());
  return key?options[key]:'';
}

export function recallForCriterion(question,criterion) {
  const prompts=Object.hasOwn(written,question.topic)?written[question.topic]:{};
  const pair=Object.hasOwn(prompts,criterion.label)?prompts[criterion.label]:null;
  return pair?{prompt:pair[0],answer:pair[1]}
    :{prompt:`What is the missing idea for “${criterion.label}” in this question? ${question.prompt}`,answer:question.answer};
}

export function recallForQuestion(question) {
  const topic=topicContent(question);
  return {prompt:topic.cue||question.prompt,answer:topic.answer||question.answer};
}

export function studyCardLine(question,preferred='') {
  const topicsLine=topicContent(question).card;
  for(const value of [preferred,topicsLine,question.explanation,question.answer]){
    const text=String(value||'').replace(/\s+/g,' ').trim();
    if(!text)continue;
    const punctuated=/[.!?]$/.test(text)?text:text+'.';
    if(punctuated.length<=180)return punctuated;
    const wholeSentence=text.match(/^.+?[.!?](?=\s|$)/)?.[0];
    if(wholeSentence&&wholeSentence.length<=180)return wholeSentence;
  }
  return `Recall ${String(question.topic||'the key idea').slice(0,120)} (§${question.lesson}).`;
}
