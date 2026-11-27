// All traces are original, idealized teaching records. Times are in seconds.
export const rhythmRecords = [
  {interval:1,pr:.16,drop:0},
  {interval:.74,pr:.20,drop:4}
];
export function rhythmEvents(record) {
  const events=[];
  for(let i=0;;i++) {
    const p=Number((.16+i*record.interval).toFixed(2));
    if(p>=6)break;
    events.push({p,qrs:i+1===record.drop?null:Number((p+record.pr).toFixed(2))});
  }
  return events;
}
const x=t=>30+t*100;
const svg=(label,body,height=150)=>`<svg width="100%" viewBox="0 0 660 ${height}" role="img" aria-label="${label}" style="display:block;background:#fcfaf4;color:#193f46" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
const line=(x1,y1,x2,y2,color,width=1)=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${width}"/>`;
const digit=(px,y,s)=>`<text x="${px}" y="${y}" text-anchor="middle" font-family="system-ui" font-size="12" fill="#193f46">${s}</text>`;
const plot=(d,color,width=2)=>`<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linejoin="round"/>`;

export function rhythmStrip(record) {
  const events=rhythmEvents(record);
  let grid='',trace='M30 67';
  for(let i=0;i<=150;i++) grid+=line(x(i*.04),18,x(i*.04),103,i%5?'#eee3d8':'#cfae98',i%25?1:1.6);
  for(let y=25;y<=100;y+=15) grid+=line(30,y,630,y,'#eadbd0');
  for(let s=0;s<=6;s++)grid+=digit(x(s),124,s+' s');
  for(const {p,qrs} of events) {
    trace+=` H${x(p)} q3 -10 6 0`;
    if(qrs!==null)trace+=` H${x(qrs)} l1 4 2 -43 3 53 2 -14 h5 q8 -19 16 0`;
  }
  return svg('Six-second rhythm strip. Each small grid square is 0.04 seconds. An equivalent list of onsets follows.',grid+plot(trace+' H630','#174d54'));
}
const table=(cols,rows)=>'<div class="ap2-table-wrap"><table><thead><tr>'+cols.map(col=>'<th scope="col">'+col+'</th>').join('')+'</tr></thead><tbody>'+rows.map(row=>'<tr>'+row.map(val=>'<td>'+val+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';

export function rhythmExercise(record) {
  const events=rhythmEvents(record);
  const caption='<p>Six seconds of lead II. Each small square represents 0.04 s and each bold gridline marks 0.20 s. Measure PR from the start of P to the start of QRS on a conducted beat.</p>';
  const onsets=table(['P wave','P onset (s)','QRS onset (s)'],events.map((e,i)=>[i+1,e.p.toFixed(2),e.qrs===null?'—':e.qrs.toFixed(2)]));
  const coupled=svg('Ventricular-cell action potential rises first, followed by cytosolic calcium and then tension. All traces share the same time axis.',
    digit(72,25,'Voltage')+plot('M150 33 H183 L188 7 L195 14 Q230 17 326 20 Q352 24 376 33 H580','#197169')+
    digit(72,70,'Calcium')+plot('M150 79 H190 Q201 79 216 61 Q235 45 260 56 Q304 66 350 78 Q383 79 580 79','#77428a')+
    digit(72,115,'Tension')+plot('M150 124 H202 Q215 124 234 111 Q268 80 305 102 Q357 127 397 124 H580','#a95519')+
    line(150,140,580,140,'#485454')+digit(150,155,'0')+digit(365,155,'200')+digit(580,155,'400 ms'),166);
  return {
    body:caption+rhythmStrip(record)+'<details><summary>Read wave onset times</summary>'+onsets+'</details>',
    questions:[
      {prompt:'Estimate ventricular rate by counting QRS complexes in six seconds and multiplying by ten (beats/min).',number:events.filter(e=>e.qrs!==null).length*10,why:'Only QRS complexes count toward the ventricular rate estimate.'},
      {prompt:'PR interval of a conducted beat (milliseconds)',number:Math.round(record.pr*1000),tolerance:10,why:'Subtract P onset from QRS onset and multiply seconds by 1,000.'},
      {prompt:'Which numbered P wave has no following QRS? Enter 0 if all conduct.',number:record.drop,why:'A P wave can occur without subsequent ventricular depolarization.'}
    ],
    after:'<h4>One ventricular muscle cell</h4><p>The three traces share a time axis. Their vertical scales are relative to the size of each response.</p>'+coupled,
    last:{prompt:'Trigger calcium entry during the plateau is reduced. Which response do you predict?',choices:['Less calcium release from the sarcoplasmic reticulum and lower peak tension.','Earlier peak tension with no change in calcium release.','Greater peak tension because the cell repolarizes sooner.'],why:'Incoming calcium triggers additional release of stored calcium. Cytosolic calcium binds troponin, then cross-bridge cycling develops tension.'}
  };
}

export const cuffRecords=[{systolic:118,diastolic:76},{systolic:134,diastolic:84}];
export function cuffEvents(record) {
  const events=[];
  for(let pressure=150;pressure>=60;pressure-=2)events.push({pressure,tap:pressure<=record.systolic&&pressure>record.diastolic});
  return events;
}
const cx=i=>40+i*12.8;
const cy=p=>20+(150-p)*.77;
function cuffStrip(events) {
  let ink='';
  for(let p=150;p>=60;p-=10)ink+=digit(18,cy(p)+4,p)+line(35,cy(p),624,cy(p),'#d3d8d0');
  ink+=plot(events.map((e,i)=>(i?'L':'M')+cx(i)+' '+cy(e.pressure)).join(' '),'#1e7469');
  for(const [i,e] of events.entries()) {
    const px=cx(i);
    ink+= e.tap?plot(`M${px-4} 122 l2 -3 2 5 2 -10 2 8`,'#903a58'):line(px-3,122,px+3,122,'#7d8c8d');
  }
  return svg('Deflating cuff pressure in mmHg above a synchronized sound trace. Scrub through beats for exact pressure and tap information.',
    ink+'<line data-cuff-marker x1="40" x2="40" y1="15" y2="130" stroke="#152e37" stroke-width="1.5" stroke-dasharray="4 2"/>'+digit(300,149,'Deflation time → · each sample is one beat'),163);
}
export function cuffExercise(record) {
  const events=cuffEvents(record);
  return {
    body:'<p>In this typical adult recording the cuff drops 2 mmHg per beat. Follow the pressure line and synchronized sound marks. Scrub or step through the beats to find the first tap and the first silent beat after the last tap.</p>'+cuffStrip(events)+
      '<label>Beat <input type="range" min="0" max="'+(events.length-1)+'" step="1" value="0" data-cuff-beat></label><div class="course-actions"><button type="button" data-cuff-prev>Previous beat</button><button type="button" data-cuff-next>Next beat</button><button type="button" data-cuff-play>Play beats</button><label><input type="checkbox" data-cuff-audio> Hear taps</label></div><p data-cuff-status role="status"></p>',
    questions:[
      {prompt:'Systolic pressure (mmHg)',number:record.systolic,why:'The first Korotkoff sound marks systolic pressure.'},
      {prompt:'Diastolic pressure (mmHg)',number:record.diastolic,why:'Read the pressure at disappearance of the sounds (phase V).'}
    ]
  };
}
export function mountCuff(panel,record) {
  const events=cuffEvents(record),find=name=>panel.querySelector('[data-cuff-'+name+']');
  const slider=find('beat'),marker=find('marker'),play=find('play'),prev=find('prev'),next=find('next'),sound=find('audio');
  let timer=null,audio=null;
  const stop=()=>{clearInterval(timer);timer=null;play.textContent='Play beats';};
  function closeAudio(){if(audio){audio.close().catch(()=>{});audio=null;}}
  function ping() {
    if(!sound.checked||audio?.state!=='running')return;
    const osc=audio.createOscillator(),gain=audio.createGain(),now=audio.currentTime;
    osc.type='sine';osc.frequency.setValueAtTime(145,now);osc.frequency.exponentialRampToValueAtTime(65,now+.08);
    gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(.15,now+.012);gain.gain.exponentialRampToValueAtTime(.0001,now+.09);
    osc.connect(gain).connect(audio.destination);osc.start();osc.stop(now+.1);
  }
  function show(i) {
    slider.value=String(i);
    const event=events[i];marker.setAttribute('x1',cx(i));marker.setAttribute('x2',cx(i));
    find('status').textContent='Beat '+(i+1)+' · '+event.pressure+' mmHg · '+(event.tap?'Tap':'Silent');
    prev.disabled=i===0;next.disabled=i===events.length-1;
    if(event.tap)ping();
  }
  sound.onchange=async()=>{
    if(!sound.checked){closeAudio();return;}
    const Audio=window.AudioContext||window.webkitAudioContext;
    if(Audio){
      try{audio=new Audio();await audio.resume();return;}catch{closeAudio();}
    }
    sound.checked=false;find('status').textContent+=' · Audio unavailable. The lower trace shows each tap.';
  };
  slider.oninput=()=>{stop();show(+slider.value);};
  prev.onclick=()=>{stop();show(Math.max(0,+slider.value-1));};
  next.onclick=()=>{stop();show(Math.min(events.length-1,+slider.value+1));};
  play.onclick=()=>{
    if(timer!==null){stop();return;}
    if(+slider.value===events.length-1)show(0);
    play.textContent='Pause';
    timer=setInterval(()=>{
      if(!panel.isConnected||+slider.value===events.length-1){stop();return;}
      show(+slider.value+1);
    },600);
  };
  show(0);
  return ()=>{stop();closeAudio();};
}
