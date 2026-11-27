const speeds=[20,2]; // Illustrative m/s, numerically equal to mm/ms.
const names=['Myelinated','Unmyelinated'];
export function conductionLocation(track,ms){return speeds[track]*ms;}
export function transitTime(track,mm){return mm/speeds[track];}

export function renderConduction(modes){
  return '<section class="neuro-signal" data-process="12.4"><h3>Measure conduction along two axons</h3><p>Stimulate two axons of equal diameter at electrode A. Electrode B sits the same distance away on each. The clocks share a single time scale. Speeds are illustrative.</p>'+
    '<div class="course-actions"><label>A to B <select data-distance><option>10</option><option selected>20</option><option>30</option></select> mm</label><label>Which spike reaches B first? <select data-conduction-guess><option value="">Predict</option><option value="0">Myelinated</option><option value="1">Unmyelinated</option><option value="2">Same time</option></select></label><button type="button" data-conduct>Run comparison</button></div>'+
    '<div data-conduction-tracks></div><p data-conduction-status role="status"></p><div data-conduction-tools hidden><label>Inspect both wavefronts at <output data-clock></output> <input type="range" data-time min="0" step=".25" value="0"></label> <button type="button" data-play-conduction>Play</button>'+
    '<div class="ap2-table-wrap"><table><caption>Arrival time in simulated milliseconds</caption><thead><tr><th>Axon</th><th>Electrode A</th><th>Electrode B</th></tr></thead><tbody data-arrivals></tbody></table></div>'+
    '<label>Measured myelinated speed (m/s) <input data-speed type="number" inputmode="decimal" step="any" min="0"></label> <button type="button" data-check-speed>Check speed</button><p data-speed-note role="status"></p>'+
    '<details><summary>Follow the membrane events</summary>'+modes.map(m=>'<h4>'+m.name+'</h4><ol>'+m.notes.map(n=>'<li>'+n+'</li>').join('')+'</ol>').join('')+'</details></div></section>';
}

function tracks(mm,time){
  const left=85,width=215,svg=[];
  for(let i=0;i<2;i++){
    const y=42+i*52;
    svg.push('<text x="0" y="'+(y+4)+'" fill="currentColor" font-size="11">'+names[i]+'</text><path d="M'+left+' '+y+'h'+width+'" stroke="#b5dcd4" stroke-width="4"/>');
    if(i===0)for(let j=0;j<8;j++)svg.push('<rect x="'+(left+j*width/8+3)+'" y="'+(y-6)+'" width="'+(width/8-6)+'" height="12" rx="5" fill="#81a5bb"/>');
    if(time!==null){
      const dist=conductionLocation(i,time);
      if(dist<=mm)svg.push('<circle cx="'+(left+width*dist/mm)+'" cy="'+y+'" r="5" fill="#ffc681" stroke="#1a282e"/>');
    }
  }
  return '<svg viewBox="0 0 320 114" role="img" aria-label="Two parallel axons, horizontal distance '+mm+' millimeters. '+(time===null?'Recording electrodes at A and B.':names.map((n,i)=>n+(conductionLocation(i,time)>=mm?' reached B':' wavefront at '+conductionLocation(i,time)+' mm')).join('. '))+'.">'+
   '<g stroke="#bea7d2" stroke-dasharray="3 3"><path d="M85 22v80 M300 22v80"/></g><g fill="currentColor" text-anchor="middle" font-size="12"><text x="85" y="15">A · 0</text><text x="300" y="15">B · '+mm+' mm</text></g>'+svg.join('')+'</svg>';
}
export function mountConduction(panel){
  const get=q=>panel.querySelector(q),time=get('[data-time]'),guess=get('[data-conduction-guess]'),distance=get('[data-distance]'),play=get('[data-play-conduction]');
  let frame=0,active=false;
  function pause(){cancelAnimationFrame(frame);frame=0;play.textContent='Play';}
  function draw(){
    const mm=+distance.value,t=+time.value;
    get('[data-conduction-tracks]').innerHTML=tracks(mm,active?t:null);
    get('[data-clock]').textContent=t+' ms';time.setAttribute('aria-valuetext',t+' milliseconds');
  }
  function reset(){pause();active=false;guess.value='';time.value=0;time.max=transitTime(1,+distance.value);
    get('[data-conduction-tools]').hidden=true;get('[data-conduction-status]').textContent='';get('[data-speed]').value='';get('[data-speed-note]').textContent='';draw();}
  function start(){
    pause();const mm=+distance.value,startMs=+time.value>=+time.max?0:+time.value,started=performance.now();
    play.textContent='Pause';
    function tick(now){
      if(!panel.isConnected||panel.closest('[hidden]')||document.hidden){pause();return;}
      const t=Math.min(+time.max,startMs+(now-started)*transitTime(1,mm)/4000);
      time.value=String(t);draw();
      if(t>=+time.max)pause();else frame=requestAnimationFrame(tick);
    }
    frame=requestAnimationFrame(tick);
  }
  get('[data-conduct]').onclick=()=>{
    if(guess.value===''){get('[data-conduction-status]').textContent='Choose an arrival prediction first.';guess.focus();return;}
    active=true;const mm=+distance.value;time.value=0;
    get('[data-conduction-status]').textContent=(guess.value==='0'?'Your prediction matches. ':'Compare the two arrival times. ')+'The myelinated spike reaches B first. Current spreads under each internode and regenerates a spike at the next node. In the unmyelinated axon successive exposed membrane segments regenerate it.';
    get('[data-arrivals]').innerHTML=names.map((n,i)=>'<tr><th scope="row">'+n+'</th><td>0</td><td>'+transitTime(i,mm)+'</td></tr>').join('');
    get('[data-conduction-tools]').hidden=false;draw();
    if(!matchMedia('(prefers-reduced-motion: reduce)').matches)start();
  };
  play.onclick=()=>frame?pause():start();time.oninput=()=>{pause();draw();};
  get('[data-check-speed]').onclick=()=>{const input=get('[data-speed]'),mm=+distance.value;
    get('[data-speed-note]').textContent=input.value!==''&&Math.abs(+input.value-speeds[0])<.05?'Correct. '+mm+' mm ÷ '+transitTime(0,mm)+' ms = 20 m/s.':'Divide the distance between electrodes by the difference in their arrival times. One mm/ms equals one m/s.';};
  distance.onchange=reset;reset();
}

