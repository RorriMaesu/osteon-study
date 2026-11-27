import {shuffle} from './ap2-practical-session.js';
import {rhythmRecords,rhythmExercise,cuffRecords,cuffExercise,mountCuff} from './ap2-measurement-labs.js';

const sectionBase='https://openstax.org/books/anatomy-and-physiology-2e/pages/';
const references={
  hearing:'16-3-the-cranial-nerve-exam',peripheral:'13-4-the-peripheral-nervous-system',
  marrow:'18-3-erythrocytes',rhythm:'19-2-cardiac-muscle-and-electrical-activity',cuff:'20-2-blood-flow-blood-pressure-and-resistance'
};
export const evidenceStations=[
  {id:'peripheral-localization',section:'13.4',title:'A weak ankle',goal:'Use strength and sensory distributions to distinguish a root from a peripheral nerve.',key:'peripheral'},
  {id:'tuning-fork',section:'16.3',title:'Compare tuning-fork tests',goal:'Combine air, bone and midline responses to localize a hearing change.',key:'hearing'},
  {id:'marrow-output',section:'18.3',title:'Smear and marrow output',goal:'Identify immature cells and interpret a timed reticulocyte count.',key:'marrow'},
  {id:'rhythm-strip',section:'19.2',title:'Measure a rhythm strip',goal:'Read ventricular rate, PR timing and the ventricular response to each P wave.',key:'rhythm'},
  {id:'cuff-reading',section:'20.2',title:'Read a deflating cuff',goal:'Record pressure when the first tap appears and when the taps disappear.',key:'cuff'}
];
const q=(prompt,choices,why)=>({prompt,choices,why});
function hearingExercise(second) {
  const side=second?'Right':'Left';
  const table='<div class="ap2-table-wrap"><table><thead><tr><th scope="col">Trial</th><th scope="col">Site</th><th scope="col">Observed response</th></tr></thead><tbody>'+
    '<tr><td>Rinne</td><td>Left</td><td>'+(second?'Air lasts longer than bone':'Bone lasts longer than air')+'</td></tr>'+
    '<tr><td>Rinne</td><td>Right</td><td>Air lasts longer than bone</td></tr>'+
    '<tr><td>Weber</td><td>Forehead midline</td><td>Louder in the left ear</td></tr></tbody></table></div>';
  return {body:`<p>The participant reports quieter sound in the ${side.toLowerCase()} ear. A 512 Hz fork is moved between mastoid and ear canal for Rinne, then placed on the forehead for Weber. Read the matched observations.</p>`+table,
    questions:[
      q('Which pattern best fits these observations?',second?['Right sensorineural loss','Left conductive loss','Right conductive loss']:['Left conductive loss','Left sensorineural loss','Right conductive loss'],
        second?'With reduced right cochlear or neural sensitivity, air may still exceed bone on each side. The midline signal is louder on the better-hearing left.':'Bone exceeds air on the affected left. The Weber signal also lateralizes toward that ear, supporting a conductive pattern.'),
      q('Which mechanism best accounts for the quieter ear?',second?['Reduced signaling by right cochlear hair cells or auditory fibers.','Stapes fixation on the left.','Interruption of right outer or middle ear conduction alone.']:['Attenuated sound transmission through the left outer or middle ear.','Reduced firing of left cochlear fibers alone.','Interruption of right vestibular signaling.'],
        'Air conduction uses the outer, middle and inner ear. Bone conduction bypasses much of the external and middle-ear route.'),
    ],
    after:'<p><a href="#ap2-lesson-14.1/activity/ossicles">Follow the middle-ear vibration pathway</a></p>'};
}
function peripheralExercise(second) {
  return {body:second?'<p>Right ankle dorsiflexion, inversion and hip abduction are weaker than the left. Sensation is reduced over the right lateral leg and dorsum of the great toe.</p>':
    '<p>After prolonged pressure at the right fibular neck, ankle dorsiflexion and eversion are weak. Inversion and hip abduction are preserved. Sensation is reduced across the dorsum of the right foot, including the first web space.</p>',
    questions:[
      q('Which site best explains the combined findings?',second?['Right L5 root','Right common fibular nerve at the fibular neck','Right tibial nerve at the ankle']:['Right common fibular nerve at the fibular neck','Right L5 root','Right tibial nerve at the ankle'],
        second?'L5 contributes to hip abduction, ankle inversion and dorsiflexion through different named peripheral nerves. The great-toe sensory change supports that distribution.':'The common fibular nerve supplies the deep and superficial branches serving dorsiflexion, eversion and most dorsal foot sensation.'),
      q('Which observation best distinguishes these two localizations?',second?['Weak hip abduction and inversion extend beyond the common fibular territory.','Foot dorsum sensation alone identifies a single root.','Dorsiflexion weakness always identifies a tibial nerve lesion.']:['Inversion and hip abduction remain strong despite dorsiflexion and eversion weakness.','Dorsiflexion weakness alone identifies the fibular neck.','Any change in dorsal foot sensation proves a spinal root lesion.'],
        'Tibialis posterior receives tibial-nerve fibers and gluteus medius receives superior gluteal fibers. Both share L5 contributions with dorsiflexors. Sensory fields overlap.')
    ]};
}
const fieldCredit='<small>Supravital blood smear by Ed Uthman, MD (2010). Osteon added four site markers. <a href="https://commons.wikimedia.org/wiki/File:Reticulocytes_Human_Blood_Supravital_Stain.jpg" target="_blank" rel="noreferrer">Original photograph</a> · <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noreferrer">CC BY 3.0</a></small>';
function marrowExercise(second) {
  const marks=[[625,125],[420,349],[307,512],[620,567]];
  const smear='<figure><svg width="100%" style="max-height:365px" viewBox="0 0 1008 672" role="img" aria-label="Four marked cells in a supravitally stained blood smear. A has dark blue threads, B has smooth pale cytoplasm, C and D have multiple dark blue dots."><image href="assets/ap2-blood/reticulocytes-uthman.jpg" width="1008" height="672"/>'+marks.map(([cx,cy],i)=>`<circle cx="${cx}" cy="${cy}" r="68" fill="none" stroke="#5b2946" stroke-width="3"/><circle cx="${cx-66}" cy="${cy-50}" r="17" fill="#5b2946"/><text x="${cx-66}" y="${cy-44}" font-size="19" fill="white" text-anchor="middle">${'ABCD'[i]}</text>`).join('')+'</svg><figcaption>'+fieldCredit+'</figcaption></figure>';
  const counts=second?'Day 1 hemoglobin 9.0 g/dL, MCV 71 fL, absolute reticulocytes 32 × 10⁹/L. Day 7 hemoglobin 8.8, MCV 70, absolute reticulocytes 22.':'Day 1 hemoglobin 9.1 g/dL, MCV 90 fL, absolute reticulocytes 40 × 10⁹/L. Day 7 hemoglobin 9.6, MCV 93, absolute reticulocytes 210.';
  return {body:smear+'<details><summary>Read the four sites</summary><p>A contains dark blue threads. B has a smooth, pale interior. C and D contain clusters of small dark blue particles.</p></details>',
    questions:[{prompt:'Among the four circled cells, how many contain the RNA remnants of reticulocytes?',number:3,why:'Sites A, C and D show stained RNA. B has a smooth interior.'}],
    after:'<h4>Serial counts from a separate teaching case</h4><p>'+counts+'</p><p>This lab uses adult comparison intervals of 12–16 g/dL for hemoglobin, 80–100 fL for MCV and 25–100 × 10⁹/L for absolute reticulocytes. Use the full serial count to assess output.</p>',
    last:q('Which conclusion and limitation are supported?',second?['Reticulocyte output is low despite anemia. The small cells suggest a production problem, but its cause needs further evidence.','Reticulocyte output is high, proving accelerated destruction.','A stable low MCV rules out an iron supply problem.']:['The rise in absolute reticulocytes during anemia supports a regenerative response. These counts alone cannot distinguish recent blood loss from accelerated destruction.','Normal-range MCV proves that marrow output has stayed at baseline.','The increased reticulocyte count establishes an exact cause of the anemia.'],
      second?'By day 7 hemoglobin remains low, MCV is reduced and the absolute reticulocyte count falls below the comparison interval. Iron studies and other evidence would help explain the response.':'By day 7 the absolute reticulocyte count exceeds the comparison interval while hemoglobin is still low. This supports increased erythrocyte production.'),
  };
}
export function evidenceExercise(key,form) {
  if(key==='rhythm')return rhythmExercise(rhythmRecords[form]);
  if(key==='cuff')return cuffExercise(cuffRecords[form]);
  if(key==='hearing')return hearingExercise(form===1);
  if(key==='peripheral')return peripheralExercise(form===1);
  return marrowExercise(form===1);
}
function questionHtml(question,i) {
  const name='response-'+i;
  const field=question.choices?'<fieldset><legend>'+question.prompt+'</legend>'+shuffle(question.choices.map((_,j)=>j)).map(j=>'<label><input type="radio" required name="'+name+'" value="'+j+'"> '+question.choices[j]+'</label>').join('')+'</fieldset>':'<label>'+question.prompt+'<input required type="number" step="any" inputmode="decimal" name="'+name+'"></label>';
  return '<div class="ap2-evidence-question">'+field+'<p data-feedback="'+i+'"></p></div>';
}
export function checkEvidenceAnswer(question,raw) {
  if(raw===null||raw===undefined||String(raw).trim()==='')return false;
  return question.choices?String(raw)==='0':Math.abs(Number(raw)-question.number)<=(question.tolerance||0);
}
export function addEvidenceLesson(body,section,requested) {
  const station=evidenceStations.find(s=>s.section===section);
  if(!station)return;
  const panel=document.createElement('section');
  panel.className='ap2-evidence-station';panel.dataset.evidenceStation=station.id;
  const direct=requested===station.id;
  if(direct)body.prepend(panel);
  else {
    const a=document.createElement('a');a.className='course-link';a.href='#ap2-lesson-'+section+'/activity/'+station.id;a.textContent=station.title;
    body.prepend(a);return;
  }
  panel.innerHTML='<h2>'+station.title+'</h2><p>'+station.goal+'</p><label>Case <select data-evidence-form><option value="0">Record A</option><option value="1">Record B</option></select></label><div data-evidence-work></div><p><a href="'+sectionBase+references[station.key]+'" target="_blank" rel="noreferrer">Read the physiology in OpenStax</a></p>';
  const form=panel.querySelector('[data-evidence-form]'),work=panel.querySelector('[data-evidence-work]');
  let cleanup;
  function render() {
    cleanup?.();
    const n=Number(form.value),ex=evidenceExercise(station.key,n);
    const questions=ex.last?[...ex.questions,ex.last]:ex.questions;
    work.innerHTML=ex.body+'<form data-evidence-answers>'+ex.questions.map(questionHtml).join('')+(ex.after||'')+(ex.last?questionHtml(ex.last,ex.questions.length):'')+
      '<button class="primary" type="submit">Check this record</button><p data-evidence-score role="status"></p></form>';
    if(station.key==='cuff')cleanup=mountCuff(work,cuffRecords[n]);
    work.querySelector('form').onsubmit=event=>{
      event.preventDefault();
      let correct=0;
      questions.forEach((q,i)=>{
        const result=checkEvidenceAnswer(q,event.currentTarget.elements.namedItem('response-'+i).value);
        if(result)correct++;
        const expected=q.choices?q.choices[0]:q.number;
        work.querySelector('[data-feedback="'+i+'"]').textContent=(result?'Correct. ':'Expected '+expected+'. ')+q.why;
      });
      work.querySelector('[data-evidence-score]').textContent=correct+' of '+questions.length+' correct.';
    };
  }
  const style=document.createElement('style');
  style.textContent='.ap2-evidence-station{max-width:54rem;margin:0 auto 2rem}.ap2-evidence-question{margin:1rem 0}.ap2-evidence-question fieldset{min-width:0;border:1px solid #56706c;border-radius:.6rem;padding:.6rem .85rem}.ap2-evidence-question legend{padding:0 .3rem;font-weight:600}.ap2-evidence-question label{display:block;margin:.4rem 0;line-height:1.5}.ap2-evidence-question input[type=number]{display:block;width:9rem;max-width:100%}.ap2-evidence-question input[type=radio]{width:auto;min-height:0}.ap2-evidence-station details{margin:.75rem 0}.ap2-evidence-station figure{margin:1rem 0}.ap2-evidence-station [data-cuff-beat]{width:min(22rem,75%)}';
  panel.prepend(style);
  form.onchange=render;render();
  if(station.key==='cuff'){
    function leave(){
      if(panel.isConnected&&location.hash==='#ap2-lesson-'+section+'/activity/'+station.id)return;
      cleanup?.();observer.disconnect();document.removeEventListener('viewchange',leave);
    }
    const observer=new MutationObserver(leave);
    observer.observe(body.closest('.ap2-page').parentElement,{childList:true});
    document.addEventListener('viewchange',leave);
  }
}
