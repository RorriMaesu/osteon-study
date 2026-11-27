const iris='#6fae9d';
const labels=['Intact pathway','Left optic nerve (CN II) interruption','Right optic nerve (CN II) interruption','Left pupillary efferent (CN III) interruption','Right pupillary efferent (CN III) interruption'];
export function pupilResponse(lesion,light){
  const input=light!=='off'&&!(lesion===1&&light==='left'||lesion===2&&light==='right');
  return {left:input&&lesion!==3,right:input&&lesion!==4};
}
const options=(names)=>names.map((n,i)=>'<option value="'+i+'">'+n+'</option>').join('');
export function renderSensoryDetail(id){
  if(id==='14.1')return '<section class="neuro-station" data-sensory-detail="rod"><h3>From light to rod transmitter release</h3><label>Light reaching the rod <input data-light type="range" min="0" max="3" step="1" value="0"> <output data-illumination></output></label><div data-rod-figure></div><p data-rod-reading aria-live="polite"></p><a href="#ap2-lesson-14.1/activity/eye">Locate the retina in the left eye ↗</a></section>';
  if(id==='16.3')return '<section class="neuro-station" data-sensory-detail="pupil"><h3>Test the direct and consensual light responses</h3><p>Face the subject. Their right eye appears on your left. Shine the light into each eye and compare both pupils before naming the site.</p><div class="course-actions"><label>Practice mode <select data-pupil-mode><option value="explore">Explore a pathway</option><option value="unknown">Identify an unknown</option></select></label><label data-lesion-label>Pathway <select data-lesion>'+options(labels)+'</select></label><button type="button" data-new-case hidden>Another case</button></div><div class="course-actions" role="group" aria-label="Light stimulus"><button type="button" data-flash="right">Light in subject’s right eye</button><button type="button" data-flash="left">Light in subject’s left eye</button><button type="button" data-flash="off">Light off</button></div><div data-pupil-figure></div><p data-pupil-reading aria-live="polite"></p><div data-localize hidden><label>Which pathway fits both observations? <select data-diagnosis><option value="">Choose a pathway</option>'+options(labels)+'</select></label><button type="button" data-check-localization>Check localization</button><output data-pupil-feedback aria-live="polite"></output></div></section>';
  return '';
}
function drawRod(section){
  const light=section.querySelector('[data-light]');
  const levels=['Dark','Dim','Moderate','Bright'];
  const concentration=['high','slightly lower','lower','low'];
  const explanations=[
    'In darkness, abundant cGMP keeps outer-segment cation channels open. Inward current keeps the rod relatively depolarized and glutamate is released tonically.',
    'A few activated rhodopsin molecules stimulate transducin and phosphodiesterase. cGMP begins to fall, some cation channels close, and glutamate release starts to decrease.',
    'Greater light activates more of the cascade. More cation channels close while potassium continues to leave the inner segment. The rod hyperpolarizes and releases less glutamate.',
    'Bright light strongly suppresses the dark current. The rod is more hyperpolarized, calcium entry at its synaptic terminal is reduced, and glutamate release is low.'
  ];
  function draw(){
    const n=Number(light.value);
    light.setAttribute('aria-valuetext',levels[n]);
    section.querySelector('[data-illumination]').textContent=levels[n];
    let discs='',channels='',dots='',photons='';
    for(let j=0;j<9;j++)discs+='<path d="M'+(42+j*9)+' 44v32" stroke="#d8a572" stroke-width="4"/>';
    for(let i=0;i<4;i++){const x=44+i*20;channels+='<circle cx="'+x+'" cy="34" r="5" fill="'+(i<4-n?'#aadfc5':'#415965')+'" stroke="#a6c7b4"/>';if(i<4-n)channels+='<path d="M'+x+' 22v7l-3 -3m3 3 3 -3" stroke="#c8f1d9" fill="none"/>';}
    for(let i=0;i<10-n*3;i++)dots+='<circle cx="'+(245+i%5*7)+'" cy="'+(48+Math.floor(i/5)*8)+'" r="2.4" fill="#f0b97e"/>';
    for(let i=0;i<n;i++)photons+='<path d="M'+(33+i*24)+' 7l7 4 -4 4 8 3" stroke="#ffd17c" fill="none"/>';
    section.querySelector('[data-rod-figure]').innerHTML='<svg viewBox="0 0 320 110" role="img" aria-label="'+levels[n]+' light. Outer segment, cation channels and glutamate at the rod terminal."><rect x="27" y="34" width="110" height="49" rx="16" fill="#6c5145"/>'+discs+channels+photons+'<path d="M137 61h15c11 -24 38 -21 43 0h28l13 -11v22l-13 -8h-29c-6 20 -31 17 -42 -2h-15z" fill="#80b2a4"/><circle cx="176" cy="60" r="7" fill="#cbd9b3"/>'+dots+'<path d="M280 42v38" stroke="#aba7cc" stroke-width="5"/><g fill="#e6efe6" font-size="10" text-anchor="middle"><text x="82" y="101">Outer segment</text><text x="178" y="101">Cell body</text><text x="260" y="101">Synapse</text></g></svg>';
    section.querySelector('[data-rod-reading]').textContent=levels[n]+' light · cGMP '+concentration[n]+'. '+explanations[n];
  }
  light.oninput=draw;draw();
}
function drawPupils(section){
  const get=s=>section.querySelector(s);
  const mode=get('[data-pupil-mode]'),lesion=get('[data-lesion]'),guess=get('[data-diagnosis]'),feedback=get('[data-pupil-feedback]');
  let light='off',current=0,seen=new Set(),bag=[];
  function nextCase(){
    if(!bag.length){
      bag=labels.map((_,i)=>i);
      for(let i=bag.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[bag[i],bag[j]]=[bag[j],bag[i]];}
      if(bag.at(-1)===current)bag.reverse();
    }
    current=bag.pop();reset();
  }
  function reset(){light='off';seen=new Set();guess.value='';feedback.textContent='';draw();}
  function draw(){
    const r=pupilResponse(current,light);
    get('[data-lesion-label]').hidden=mode.value==='unknown';
    get('[data-new-case]').hidden=mode.value!=='unknown';get('[data-localize]').hidden=mode.value!=='unknown';
    section.querySelectorAll('[data-flash]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.flash===light)));
    const drawing=['right','left'].map((side,i)=>{
      const x=74+142*i;
      const radius=r[side]?6:current===(side==='left'?3:4)?17:13;
      return '<path d="M'+(x-45)+' 52q45 -45 90 0q-45 40 -90 0" fill="#d0d8ce"/><circle cx="'+x+'" cy="52" r="21" fill="'+iris+'"/><circle cx="'+x+'" cy="52" r="'+radius+'" fill="#111c20"/>'+(light===side?'<path d="M'+(x-31)+' 12l19 18m-7 -1 7 1 -2 -7" fill="none" stroke="#ffd07e" stroke-width="3"/>':'')+'<text x="'+x+'" y="96" fill="#eee9da" font-size="13" text-anchor="middle">Subject’s '+side+'</text>';
    }).join('');
    const result=light==='off'?'Light off. Compare baseline pupil sizes.':'Light in the '+light+' eye. Right pupil '+(r.right?'constricts':'shows no constriction')+'. Left pupil '+(r.left?'constricts.':'shows no constriction.');
    get('[data-pupil-figure]').innerHTML='<svg viewBox="0 0 290 106" role="img" aria-label="'+result+'">'+drawing+'</svg>';
    get('[data-pupil-reading]').textContent=result;
  }
  mode.onchange=()=>{if(mode.value==='unknown')nextCase();else{current=+lesion.value;reset();}};
  lesion.onchange=()=>{current=+lesion.value;reset();};
  get('[data-new-case]').onclick=nextCase;
  for(const b of section.querySelectorAll('[data-flash]')){
    b.onclick=()=>{light=b.dataset.flash;if(light!=='off')seen.add(light);draw();};
  }
  get('[data-check-localization]').onclick=()=>{
    if(seen.size<2){feedback.textContent='Test each eye once and compare the direct and consensual responses.';return;}
    if(guess.value===''){feedback.textContent='Choose the pathway that explains both observations.';return;}
    feedback.textContent=+guess.value===current?'Correct. '+labels[current]+'. '+(current===0?'Either input drives both pupils.':current<3?'Illuminating the interrupted input fails to drive either pupil. Illuminating the intact input drives both.':'Light in either eye drives the intact pupil. The pupil with impaired motor output cannot constrict.'):'Recheck whether the abnormal response follows the illuminated eye or stays with the same pupil.';
  };
  draw();
}
export function mountSensoryDetail(root){
  for(const panel of root.querySelectorAll('[data-sensory-detail]')){
    if(panel.dataset.ready)continue;
    panel.dataset.ready='true';
    if(panel.dataset.sensoryDetail==='rod')drawRod(panel);
    if(panel.dataset.sensoryDetail==='pupil')drawPupils(panel);
  }
}
