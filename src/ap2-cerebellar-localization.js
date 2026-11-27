const tasks = ['Reach for a target', 'Compare trunk and gait', 'Track a moving target'];
const regions = [
  ['vermis', 'Midline vermis'],
  ['hemisphere', 'Cerebellar hemisphere on the affected side'],
  ['vestibular', 'Vestibulocerebellum (flocculonodular lobe)'],
  ['uncertain', 'Insufficient evidence to prioritize a region']
];

export const coordinationRecords = [
  {
    complaint:'The subject misses a cup with the right hand.',
    results:[
      'The right index finger overshoots on three reaches. The left hand reaches accurately. Strength, vision and finger position sense are intact.',
      'The subject sits upright and walks with a stable base.',
      'The eyes follow the target smoothly in both directions.'
    ],
    region:'hemisphere', needed:[0],
    explanation:'The side-to-side reaching difference favors right hemispheric limb circuits. The lateral hemisphere helps plan skilled movement, and adjacent intermediate circuits help correct it during execution. This task alone cannot separate those zones.',
    next:'Compare alternating hand movements on the two sides to test timing.'
  },
  {
    complaint:'The subject has trouble sitting steadily and walking a straight line.',
    results:[
      'With the trunk supported, both hands reach the target accurately. Joint position sense is intact.',
      'The trunk sways when sitting unsupported. Steps vary in width even with the eyes open.',
      'The eyes follow the moving target smoothly.'
    ],
    region:'vermis', needed:[1],
    explanation:'Axial instability with more accurate supported limb movement favors midline vermis circuits. Vestibular and sensory inputs also participate in balance.',
    next:'Compare supported and unsupported performance to separate trunk control from limb targeting.'
  },
  {
    complaint:'The subject loses sight of a moving target when the head turns with it.',
    results:[
      'Both hands reach their targets accurately with the head still.',
      'The subject sits without support but becomes unsteady during turns.',
      'Looking at a stationary target during a slow head turn is accurate. When target and head move together, the eyes slip off the target and make corrective jumps.'
    ],
    region:'vestibular', needed:[2],
    explanation:'The task changes whether the vestibulo-ocular reflex helps fixation or must be suppressed. Difficulty suppressing it makes vestibulocerebellar gaze control worth further testing. The flocculus is part of this system.',
    next:'Compare smooth eye tracking with the head still. Brainstem, vestibular and visual pathways can also affect the observations.'
  },
  {
    complaint:'One wide step was observed during a turn.',
    results:[
      'No reaching comparison was recorded.',
      'The surface was uneven. There was no second trial or observation of unsupported sitting.',
      'No eye movement or vestibular assessment was recorded.'
    ],
    region:'uncertain', needed:[],
    explanation:'A single step on an uneven surface cannot distinguish ordinary adjustment, a sensory problem, or impaired cerebellar control.',
    next:'Compare repeated steps on a level surface, unsupported sitting, limb targeting and eye movements before prioritizing a circuit.'
  }
];

export function interpretationFor(record, examined){
  if(examined.size<2 || record.needed.some(task=>!examined.has(task)))return 'uncertain';
  return record.region;
}

export function renderCoordination(){
  return '<section class="neuro-station" data-sensory-detail="cerebellar-localization"><h3>Compare cerebellar regions at the examination table</h3><p>Choose two observations from a simulated record. Decide which circuit deserves further testing.</p><label>Record <select data-coordination-case>'+coordinationRecords.map((_,i)=>'<option value="'+i+'">Record '+(i+1)+'</option>').join('')+'</select></label><p data-referral></p><div class="course-actions" role="group" aria-label="Examination tasks">'+tasks.map((t,i)=>'<button type="button" data-examine="'+i+'">'+t+'</button>').join('')+'</div><ul data-findings aria-live="polite"></ul><label>Which region do the observations favor? <select data-coordination-answer><option value="">Choose an interpretation</option>'+regions.map(([id,title])=>'<option value="'+id+'">'+title+'</option>').join('')+'</select></label><button type="button" data-check-coordination>Check interpretation</button><p role="status" data-coordination-feedback></p><a data-region-figure hidden href="#ap2-lesson-16.5/figures/16.15">Locate these regions in OpenStax Figure 16.15 ↗</a></section>';
}

export function mountCoordination(section){
  const get=selector=>section.querySelector(selector);
  const select=get('[data-coordination-case]'),answer=get('[data-coordination-answer]');
  const feedback=get('[data-coordination-feedback]'),figure=get('[data-region-figure]');
  const buttons=Array.from(section.querySelectorAll('[data-examine]'));
  const examined=new Set();
  const record=()=>coordinationRecords[Number(select.value)];
  function reset(){
    examined.clear();
    get('[data-referral]').textContent=record().complaint;
    get('[data-findings]').replaceChildren();
    answer.value='';
    feedback.textContent='';
    figure.hidden=true;
    buttons.forEach(b=>b.disabled=false);
  }
  for(const button of buttons){
    button.onclick=()=>{
      const i=Number(button.dataset.examine);
      examined.add(i);
      const li=document.createElement('li');
      li.textContent=tasks[i]+' · '+record().results[i];
      get('[data-findings]').append(li);
      button.disabled=true;
      answer.value='';
      feedback.textContent='';
      figure.hidden=true;
    };
  }
  get('[data-check-coordination]').onclick=()=>{
    if(examined.size<2){feedback.textContent='Compare at least two examination tasks first.';return;}
    if(!answer.value){feedback.textContent='Choose the interpretation that the available observations support.';return;}
    const c=record(),supported=interpretationFor(c,examined);
    if(answer.value!==supported){
      feedback.textContent=supported==='uncertain'?'These observations do not distinguish a region. Consider what the record still lacks.':'Compare the affected task with the relatively preserved one. Is the main difficulty axial control, targeting a limb, or coordinating the eyes and head?';
      figure.hidden=true;return;
    }
    feedback.textContent=supported==='uncertain'&&c.region!=='uncertain'?'Correct. The available comparisons leave the presenting difficulty unexplained. Examine the remaining task.':'Correct. '+c.explanation+' '+c.next;
    figure.hidden=false;
  };
  select.onchange=reset;
  reset();
}

