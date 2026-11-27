const stages=[
  ['Footplate at the oval window','A vibrating stapes presses on the oval window. Its motion couples the middle ear to cochlear fluid.'],
  ['Pressure wave','An alternating pressure difference across the cochlear partition drives a traveling wave. The round window can move as the fluid is displaced.'],
  ['Basilar membrane','The wave peaks near the base for higher pitches and farther toward the apex for lower pitches. Hair bundles bend as the organ of Corti moves.'],
  ['Inner hair cell','Bending toward the tallest stereocilia opens more transduction channels. Potassium enters from endolymph. Depolarization increases calcium entry and transmitter release onto the auditory nerve.']
];
export function hearingMarkup(){
  return '<section class="neuro-station" data-sensory-detail="hearing"><h3>From stapes to auditory nerve</h3><p>Follow one sound into the cochlea. The cochlea is shown uncoiled and movement is enlarged.</p>'+
    '<div class="course-actions"><label>Pitch <select data-pitch><option value="high">Higher pitch</option><option value="low">Lower pitch</option></select></label><label>Footplate mobility <select data-mobility><option value="free">Free to vibrate</option><option value="fixed">Completely fixed</option></select></label></div>'+
    '<div data-hearing-diagram></div><p data-hearing-detail aria-live="polite"></p><div class="course-actions"><label>Stage <select data-hearing-step>'+stages.map(([name],i)=>'<option value="'+i+'">'+(i+1)+' · '+name+'</option>').join('')+'</select></label><button data-hearing-play>Play sequence</button></div>'+
    '<p><a href="#ap2-lesson-14.1/activity/ossicles">Inspect the three ossicles</a> · <a href="#ap2-lesson-14.1/activity/ear">Open the 3D labyrinth</a> · <a href="https://www.nidcd.nih.gov/health/how-do-we-hear" target="_blank" rel="noreferrer">NIDCD hearing reference ↗</a></p></section>';
}
export function mountHearing(panel){
  const get=s=>panel.querySelector(s);
  const pitch=get('[data-pitch]'),mobility=get('[data-mobility]'),step=get('[data-hearing-step]'),play=get('[data-hearing-play]');
  let timer;
  function stop(){clearTimeout(timer);timer=null;play.textContent='Play sequence';play.setAttribute('aria-pressed','false');}
  function draw(){
    const n=+step.value,fixed=mobility.value==='fixed',peak=pitch.value==='low'?217:111;
    const motion=!fixed&&n>0,tilt=!fixed&&n===3?9:0;
    let wave='M85 85';
    for(let x=85;x<=251;x+=2){const y=85+(motion?12*Math.exp(-((x-peak)**2)/390)*Math.sin((x-peak)/10+1.6):0);wave+=' L'+x+' '+y.toFixed(1);}
    const stars=n===3&&!fixed?'<g fill="#f5bb85"><circle cx="303" cy="115" r="2"/><circle cx="309" cy="118" r="2"/><circle cx="315" cy="114" r="2"/></g>':'';
    const amber='#f3be83',neutral='#94b5af';
    const paths=['M22 68 Q38 53 51 75 L45 93 Q34 91 22 68 Z M45 93 L53 97','M61 66 Q132 37 241 64','M85 85 H252','M290 74 Q294 111 306 111 Q320 107 323 74 Z'];
    get('[data-hearing-diagram]').innerHTML='<svg viewBox="0 0 345 155" role="img" aria-label="'+stages[n][0]+'. '+(fixed?'Footplate fixed.':'Peak near the '+(pitch.value==='low'?'apex.':'base.'))+'"><g font-size="11" fill="#e8ede1" text-anchor="middle"><text x="34" y="28">Stapes</text><text x="152" y="28">Uncoiled cochlea</text><text x="305" y="28">Hair cell</text><text x="84" y="135">Base</text><text x="239" y="135">Apex</text></g><path d="M62 61 Q155 34 252 63 Q273 84 252 104 Q153 128 63 106Z" fill="#27454c" stroke="#7d9ba0"/>'+
    paths.map((p,i)=>'<path d="'+p+'" fill="'+(i===3?'#647e8d':'none')+'" stroke="'+(i===n?amber:neutral)+'" stroke-width="'+(i===0?5:2)+'"/>').join('')+
    '<path d="'+wave+'" fill="none" stroke="'+(motion?amber:neutral)+'" stroke-width="3"/><path d="M56 73l2 22" stroke="#d4cfad" stroke-width="4"/>'+
    (fixed?'<path d="M39 48l12 12m0 -12 -12 12" stroke="#f29485" stroke-width="3"/>':'')+
    '<g stroke="'+(n===3?amber:neutral)+'" stroke-width="3">'+[0,1,2,3].map(k=>'<path d="M'+(294+k*8)+' 74 l'+tilt+' -'+(9+k*3)+'"/>').join('')+'</g>'+stars+'<path d="M298 124q11 6 23 -1" fill="none" stroke="#86bfc8" stroke-width="4"/></svg>';
    const reduced=['A fixed footplate cannot drive the oval window in this air-conduction example.','Less sound energy enters the cochlear fluid through this route.','The membrane response driven by the stapes is greatly reduced.','Less stereociliary deflection means a smaller sound-evoked response. Other routes, such as bone conduction, can still stimulate the cochlea.'];
    get('[data-hearing-detail]').textContent=stages[n][0]+' · '+(fixed?reduced[n]:stages[n][1]);
  }
  function advance(){if(!panel.isConnected||panel.hidden||+step.value===3){stop();return;}step.value=String(+step.value+1);draw();if(+step.value<3)timer=setTimeout(advance,2200);else stop();}
  play.onclick=()=>{if(timer){stop();return;}step.value='0';draw();play.setAttribute('aria-pressed','true');play.textContent='Pause';timer=setTimeout(advance,2200);};
  for(const control of [step,pitch,mobility])control.onchange=()=>{stop();draw();};
  draw();
}
