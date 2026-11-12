import assets from './muscle-textbook-assets.json' with {type:'json'};
import {muscleFigureTargets, musclePlateSVG} from './muscle-figure-targets.js';
import {assessTyped, outcomeCorrect} from './typed-answer.js';
import {setDiagramLearningContext} from './learning-context.js';

const titles = {
 10: ['Tennis player','Three types of muscle tissue','Connective tissue layers','Muscle fiber','Sarcomere','Motor end-plate and innervation','T-tubule and sarcoplasmic reticulum','Muscle fiber contraction','Muscle fiber relaxation','Sliding filament model','Cross-bridge cycle','Muscle metabolism','Types of muscle contraction','Sarcomere length and tension','Myogram of a twitch','Wave summation and tetanus','Treppe','Marathoners','Hypertrophy','Atrophy','Cardiac micrograph','Intercalated discs','Smooth muscle tissue','Dense bodies and contraction','Autonomic varicosities'],
 11: ['A body in motion','Prime movers and synergists','Muscle shapes and fiber alignment','Biceps brachii contraction','Muscular system overview','Decode a muscle name','Facial expression','Facial muscle reference','Extraocular muscles','Muscles of the jaw','Tongue muscles','Tongue, swallowing, and speech','Anterior neck','Posterior and lateral neck','Neck and back','Abdominal muscles','Diaphragm','Intercostal muscles','Pelvic floor','Perineal anatomy','Perineal muscle reference','Scapular positioning muscles','Muscles that move the humerus','Shoulder muscle reference','Arm and forearm muscles','Elbow and forearm action reference','Wrist, hand, and forearm reference','Intrinsic hand muscles','Hip and thigh muscles','Gluteal region reference','Thigh muscle reference','Lower leg muscles','Foot and toe action reference','Intrinsic foot muscles','Intrinsic foot muscle reference'],
};

export const muscleFigureTitle = number => {
 const [chapter, figure] = number.split('.').map(Number);
 return titles[chapter]?.[figure-1];
};

const panel = (name, x,y,width,height) => ({name, bounds:[x,y,width,height]});
const panels = {
 '11.23': [panel('Left anterior lateral, superficial',0,0,1020,1090),panel('Posterior, superficial',943,0,1286,1090),panel('Deep left shoulder, anterior lateral',0,1160,1205,1030),panel('Deep left shoulder, posterior',1150,1150,1079,1020)],
 '11.25': [panel('Left upper arm, anterior lateral',114,0,985,938),panel('Left upper arm, posterior',1450,0,931,938),panel('Left forearm, superficial palmar',105,963,1148,942),panel('Left forearm, superficial dorsal',1254,963,1127,942),panel('Left forearm, deep palmar',110,1934,1020,960),panel('Left forearm, deep dorsal',1108,1934,1273,960)],
 '11.28': [panel('Left hand, superficial palmar',0,0,1223,1165),panel('Left hand, deep view',890,220,1193,945),panel('Left hand, palmar interossei',103,1180,855,853),panel('Left hand, dorsal interossei',1160,1180,810,853)],
 '11.29': [panel('Right thigh, superficial anterior',0,0,925,1055),panel('Right thigh, deep anterior',0,1118,819,1057),panel('Right thigh, posterior',806,1118,907,1057)],
 '11.32': [panel('Right leg, anterior',0,0,720,1358),panel('Right leg, posterior with gastrocnemius cut',843,0,695,1358),panel('Right leg, deep posterior',1612,0,667,1358)],
 '11.34': [panel('Right foot, dorsal from the lateral side',274,0,1575,675),panel('Left foot, first plantar layer',0,756,697,836),panel('Left foot, second plantar layer',704,756,622,836),panel('Left foot, third plantar layer',1355,756,728,836)],
};
const notes = {
 '10.8':'Calcium makes binding sites available. An active muscle can shorten, hold its length, or lengthen under load.',
 '10.9':'Normal relaxation requires ATP for myosin detachment and calcium uptake into the sarcoplasmic reticulum.',
 '10.11':'ATP binding permits detachment. Hydrolysis repositions the head; phosphate release is associated with the power stroke.',
 '10.14':'The horizontal axis measures relative sarcomere length. Use the curve to reason about useful overlap and active force.',
 '10.25':'These are autonomic varicosities along smooth muscle. A skeletal motor unit is a somatic motor neuron and all the fibers it innervates.',
 '11.9':'Use the anatomy panel to locate the muscles. The movement arrows in this plate need independent verification.',
 '11.16':'The obliques and transversus abdominis form layers of the lateral abdominal wall. Rectus abdominis lies near the midline.',
 '11.23':'Infraspinatus starts on the posterior scapula and attaches to the greater tubercle of the humerus.',
 '11.24':'Corrected deltoid attachments: lateral clavicle, acromion and scapular spine to the deltoid tuberosity. Infraspinatus laterally rotates the humerus.',
 '11.26':'Both the supinator and biceps brachii can supinate the forearm.',
 '11.30':'Gluteus minimus assists hip abduction. Pectineus assists hip adduction and flexion.',
 '11.34':'The dorsal view is of the right foot. The plantar views are of the left foot and depict layers one through three.',
 '11.35':'Plantar interossei adduct toes toward the second digit. Abductor hallucis abducts the great toe. Flexor digitorum brevis serves toes 2–5.',
};
const imageCredits = {
 '10.1':'Emmanuel Huybrechts / Flickr',
 '10.2':'Regents of the University of Michigan Medical School (micrographs)',
 '10.18':'Tseo2 / Wikimedia Commons',
 '10.19':'Lin Mei / Flickr',
 '10.21':'Regents of the University of Michigan Medical School',
 '10.23':'Regents of the University of Michigan Medical School (micrograph)',
 '11.1':'Dmitry Yanchylenko',
 '11.4':'Victoria Garcia',
};

export function muscleTextbookGallery(figures, selected, e) {
 const item = figures[selected];
 if (!assets[item?.number]) return null;
 return `<div class="lesson-source-preview muscle-source-preview" data-muscle-figure="${item.number}">
 <div class="control-row"><label class="sr-only" for="lesson-figure-select">Source figure</label><select id="lesson-figure-select">${figures.map((f,i)=>`<option value="${i}" ${i===selected?'selected':''}>${e(f.number+' · '+(muscleFigureTitle(f.number)||'Textbook figure'))}</option>`).join('')}</select><button type="button" data-lesson-figure="${item.pdf}">Read source page ↗</button><button type="button" data-plate-tutor>Ask the tutor</button></div>
 <div data-plate-controls class="control-row"></div><figure class="section-diagram-media section-diagram-source"><div data-plate-media></div><figcaption>OpenStax Anatomy and Physiology 2e · Fig. ${item.number} · Rice University · CC BY-NC-SA 4.0${imageCredits[item.number]?' · '+e(imageCredits[item.number]):''}. <a href="https://openstax.org/details/books/anatomy-and-physiology-2e" target="_blank" rel="noreferrer">Access for free at openstax.org</a>.</figcaption></figure>
 <div data-plate-recall></div>${notes[item.number]?`<details class="muscle-source-note"><summary>Figure study note</summary><p>${e(notes[item.number])}</p></details>`:''}</div>`;
}

export function mountMuscleTextbook(root, lesson, e) {
 const number = root.dataset.muscleFigure;
 const targets = Object.entries(muscleFigureTargets).filter(([,item])=>item.figure===number);
 const views = panels[number]||[];
 const controls = root.querySelector('[data-plate-controls]');
 const media = root.querySelector('[data-plate-media]');
 const activity = root.querySelector('[data-plate-recall]');
 let view = -1;
 let selected = -1;
 let recalling = false;
 let response = '';
 let feedback = '';
 const figureTitle = muscleFigureTitle(number);
 root.querySelector('[data-plate-tutor]').onclick=()=>{updateContext();document.getElementById('tutor-launch')?.click();};
 function updateContext() {
  const item = targets[selected]?.[1];
  setDiagramLearningContext({id:'openstax-'+number,title:figureTitle,reference:lesson.id,
   state:{figure:number,view:item?.orientation||views[view]?.name||'Whole figure',mode:recalling?'recall':'study'},
   question:recalling?'How can you identify the marked structure from the structures around it?':lesson.recall[0],
   hint:recalling?item?.description:lesson.objective,answer:recalling?item?.name:lesson.recall[1],
   facts:!recalling&&notes[number]?[notes[number]]:[],prediction:recalling?response:''});
 }
 function show() {
  const entry = targets[selected];
  controls.innerHTML = `${views.length?`<label>View <select data-plate-view><option value="-1">Whole figure</option>${views.map((v,i)=>`<option value="${i}" ${i===view?'selected':''}>${e(v.name)}</option>`).join('')}</select></label>`:''}
   ${targets.length?`<label>Target <select data-plate-target><option value="-1">Choose a target</option>${targets.map(([,item],i)=>`<option value="${i}" ${i===selected?'selected':''}>${recalling?'Target '+(i+1)+' · '+e(item.orientation):e(item.name)}</option>`).join('')}</select></label><button type="button" data-plate-mode aria-pressed="${recalling}">${recalling?'End recall':'Start recall'}</button>`:''}
   ${view!==-1||entry?`<button type="button" data-plate-whole>Whole figure</button>`:''}`;
  const note=root.querySelector('.muscle-source-note');
  if(note)note.hidden=recalling;
  media.innerHTML = musclePlateSVG(number, entry ? {targetId:entry[0], hideLabel:recalling} : {panel:views[view]?.bounds, alt:figureTitle+(views[view]?' · '+views[view].name:'')});
  activity.innerHTML = recalling&&entry ? `<form class="control-row muscle-figure-answer"><label for="muscle-figure-response">Name the marked structure</label><input id="muscle-figure-response" name="answer" autocomplete="off" maxlength="120" value="${e(response)}" required><button type="submit">Check</button><button type="button" data-plate-reveal>Reveal name</button></form><p data-plate-feedback role="status">${e(feedback)}</p>` : entry ? `<p class="muscle-target-note"><strong>${e(entry[1].name)}</strong> · ${e(entry[1].orientation)}</p>` : '';
  controls.querySelector('[data-plate-view]')?.addEventListener('change',ev=>{view=+ev.target.value;selected=-1;recalling=false;show();controls.querySelector('[data-plate-view]')?.focus();});
  controls.querySelector('[data-plate-target]')?.addEventListener('change',ev=>{selected=+ev.target.value;view=-1;response='';feedback='';if(selected<0)recalling=false;show();controls.querySelector('[data-plate-target]')?.focus();});
  controls.querySelector('[data-plate-mode]')?.addEventListener('click',()=>{
   recalling=!recalling;
   if(recalling&&selected<0)selected=Math.floor(Math.random()*targets.length);
   response='';feedback='';view=-1;show();
   (activity.querySelector('input')||controls.querySelector('[data-plate-mode]'))?.focus();
  });
  controls.querySelector('[data-plate-whole]')?.addEventListener('click',()=>{view=-1;selected=-1;recalling=false;show();root.querySelector('#lesson-figure-select').focus();});
  if(recalling&&entry) {
   activity.querySelector('input').oninput = ev=>{response=ev.target.value;};
   activity.querySelector('form').onsubmit = ev=>{
    ev.preventDefault();
    const result=assessTyped({id:entry[0],answer:entry[1].name,aliases:entry[1].aliases},response);
    feedback=outcomeCorrect(result)?'Correct. '+entry[1].name+'.':result.status==='pending'?'Check the specific anatomical name or reveal it.':'Try again or reveal the name.';
    activity.querySelector('[data-plate-feedback]').textContent=feedback;
    updateContext();
   };
   activity.querySelector('[data-plate-reveal]').onclick=()=>{
    activity.querySelector('[data-plate-feedback]').textContent=entry[1].name;
   };
  }
  updateContext();
 }
 show();
}
