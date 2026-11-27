// The first vibration in each illustrated sound follows its left-sided valve closure.
export const heartSounds=[
  {name:'S1',time:195,length:90,pitch:56},
  {name:'S2',time:492,length:68,pitch:81}
];
const x=t=>36+t*0.55;
const seconds=t=>(t/1000).toFixed(3)+' s';

function trace(){
  const points=[];
  for(let t=0;t<=800;t+=2){
    let y=60;
    for(const s of heartSounds){
      const elapsed=t-s.time;
      if(elapsed>=0&&elapsed<s.length){
        const factor=Math.min(1,elapsed/6)*Math.exp(-3*elapsed/s.length);
        y-=38*factor*Math.sin(elapsed*s.pitch*2*Math.PI/1000);
      }
    }
    points.push((points.length?'L':'M')+x(t).toFixed(1)+','+y.toFixed(1));
  }
  return points.join(' ');
}
export function renderHeartSounds(){
  return '<h4>Mark the onset of each heart sound</h4><p>Watch the two vibration bursts through one beat. Move the beat-time slider to the start of each sound and mark it. Sound is optional.</p>'+
    '<figure class="ac-plot"><svg viewBox="0 0 500 103" role="img" aria-label="Heart vibration trace. A longer burst just before 0.20 seconds is followed by a shorter burst just before 0.50 seconds.">'+
    '<text x="6" y="18">Heart vibrations</text><path d="'+trace()+'" fill="none" stroke="#ffc887" stroke-width="2.5"/>'+
    [0,200,400,600,800].map(t=>'<text x="'+x(t)+'" y="96" text-anchor="middle">'+(t/1000).toFixed(1)+' s</text>').join('')+
    '<line data-sound-cursor x1="36" x2="36" y1="24" y2="78" stroke="#e4fbff" stroke-dasharray="3 3"/>'+
    heartSounds.map((s,i)=>'<g data-sound-pin="'+i+'" visibility="hidden"><path d="m0 27 -4 -6 h8 z" fill="#e4fbff"/><text x="0" y="17" text-anchor="middle">'+s.name+'</text></g>').join('')+
    '</svg></figure><div class="ac-row ac-actions"><button type="button" data-sound-audio aria-pressed="false">Enable sound</button>'+
    heartSounds.map((s,i)=>'<button type="button" data-sound-mark="'+i+'">Mark '+s.name+' here</button>').join('')+
    '<button type="button" data-sound-grade>Check timing</button></div><small data-sound-audio-note>Audio is muted. The trace shows the same two events.</small>'+
    '<p data-sound-marks></p><p role="status" data-sound-result></p><small>Schematic phonocardiogram with synthesized heart sounds. <a href="https://openstax.org/books/anatomy-and-physiology-2e/pages/19-3-cardiac-cycle" target="_blank" rel="noreferrer">OpenStax §19.3</a></small>';
}
export function mountHeartSounds(panel,time,stop){
  const get=name=>panel.querySelector('[data-sound-'+name+']');
  const marks=[null,null],pins=[...panel.querySelectorAll('[data-sound-pin]')];
  const result=get('result'),button=get('audio'),note=get('audio-note'),cursor=get('cursor');
  let audio;
  function mute(){
    const closing=audio;audio=undefined;
    if(closing&&closing.state!=='closed')closing.close().catch(()=>{});
    button.setAttribute('aria-pressed','false');button.textContent='Enable sound';
    note.textContent='Audio is muted. The trace shows the same two events.';
    window.removeEventListener('hashchange',mute);
  }
  button.onclick=async()=>{
    if(audio){mute();return;}
    try{
      const Context=window.AudioContext||window.webkitAudioContext;
      const opened=new Context();audio=opened;
      window.addEventListener('hashchange',mute,{once:true});
      await opened.resume();
      if(audio!==opened)return;
      button.setAttribute('aria-pressed','true');button.textContent='Mute sound';
      note.textContent='Sound enabled. Use Play one beat to listen.';
    }catch{mute();note.textContent='Audio is unavailable here. You can complete the exercise using the trace.';}
  };
  panel.querySelectorAll('[data-sound-mark]').forEach((button,i)=>button.onclick=()=>{
    stop();
    marks[i]=Number(time.value);
    pins[i].setAttribute('transform','translate('+x(marks[i])+' 0)');
    pins[i].setAttribute('visibility','visible');
    get('marks').textContent=heartSounds.map((s,j)=>s.name+' '+(marks[j]===null?'unmarked':seconds(marks[j]))).join(' · ');
    result.textContent='';
  });
  get('grade').onclick=()=>{
    if(marks.includes(null)){result.textContent='Mark both S1 and S2 before checking.';return;}
    const matched=heartSounds.every((s,i)=>Math.abs(s.time-marks[i])<=30);
    result.textContent=(matched?'Both marks match the sound onsets. ':'Compare your marks with the first vibration in each burst. ')+
      'S1 begins at 0.195 s with AV valve closure as ventricular pressure rises. S2 begins at 0.492 s with semilunar valve closure as ventricular pressure falls. In this model, tricuspid and pulmonary closure follow their left-sided partners slightly later.';
  };
  return {
    mute,
    show(t){cursor.setAttribute('x1',x(t));cursor.setAttribute('x2',x(t));},
    playBetween(previous,t){
      if(audio?.state!=='running')return;
      for(const sound of heartSounds)if(previous<sound.time&&t>=sound.time){
        const oscillator=audio.createOscillator(),gain=audio.createGain(),now=audio.currentTime,end=now+sound.length/1000;
        oscillator.type='sine';oscillator.frequency.setValueAtTime(sound.pitch*1.25,now);
        oscillator.frequency.exponentialRampToValueAtTime(sound.pitch*.8,end);
        gain.gain.setValueAtTime(.001,now);gain.gain.exponentialRampToValueAtTime(.24,now+.008);
        gain.gain.exponentialRampToValueAtTime(.001,end);
        oscillator.connect(gain);gain.connect(audio.destination);oscillator.start(now);oscillator.stop(end);
        oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};
      }
    }
  };
}
