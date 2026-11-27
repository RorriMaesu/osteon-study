import {filtrationParticles,filtrationReading,foldCover,pinealOutput} from './organ-mechanism-signals.js';
import {drawVentilation,drawTubularCell} from './organ-acid-base-diagrams.js';
import {drawFollicleSection} from './organ-motion-follicle.js';

const lessons={
  'follicle-ovulation':['Ovulation section','Release through the follicular apex','This enlarged teaching section adds the overlying ovarian surface. Follow the oocyte, zona and corona through the focal opening as you scrub.'],
  'respiratory-acid-base':['Ventilation readout','Ventilation, arterial CO₂ and pH','Each phase compares ventilation with the same resting baseline. Relative trends describe the immediate respiratory response.'],
  'renal-acid-base':['Tubular cell view','Acid–base transport across the tubular epithelium','Tubular fluid is on the left and the blood side is on the right. Compare filtered bicarbonate reclamation with the responses of type A and type B intercalated cells.'],
  pineal:['Melatonin rhythm','Melatonin across the day','Relative secretion over one illustrative light–dark cycle.'],
  phonation:['Mucosal wave','How the vocal-fold cover vibrates','Coronal section, slowed. The 3D specimen shows the paired vocalis muscles.'],
  'glomerular-filtration':['Compare particles','What crosses the filtration barrier?','Choose a particle, then scrub or play. Its motion also changes in the 3D specimen.'],
  'coronary-circulation':['Coronary route','From a coronary artery to a cardiac vein','This diagram enlarges the microscopic exchange bed between the named surface vessels.']
};
const gold='#ffd788',mint='#abdccf',pink='#ed9b9d',blue='#86c3e0',muted='#b4cac9';
function stroke(c,points,color,width=3){
  c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.lineWidth=width;c.strokeStyle=color;c.stroke();
}
function dot(c,x,y,r,color){
  c.beginPath();c.arc(x,y,r,0,2*Math.PI);c.fillStyle=color;c.fill();
}
function label(c,text,x,y,color=muted,align='left'){
  c.fillStyle=color;c.font='12px system-ui';c.textAlign=align;c.fillText(text,x,y);
}
function pineal(c,t){
  const y=v=>99-65*v,x=v=>24+292*v;
  c.fillStyle='#252f4a';c.fillRect(x(1/3),17,292/3,86);
  stroke(c,[[24,17],[24,102],[316,102]],'#456162',1);
  stroke(c,Array.from({length:101},(_,i)=>[x(i/100),y(pinealOutput(i/100))]),mint);
  stroke(c,[[x(t),17],[x(t),102]],'#9daaaa',1);dot(c,x(t),y(pinealOutput(t)),5,gold);
  for(const [s,f] of [['Daylight',1/6],['Biological night',.5],['Morning',5/6]])label(c,s,x(f),122,muted,'center');
  return t<1/3?'Daylight. Melatonin output is low.':t<2/3?'Biological night. Pineal melatonin secretion rises and stays elevated.':'Morning. Light input helps lower melatonin output.';
}
function larynx(c,t){
  const m=foldCover(t),mid=170;
  for(const sign of [-1,1]){
    const x=d=>mid+sign*d;
    c.beginPath();c.moveTo(x(100),25);c.bezierCurveTo(x(67),21,x(23),26,x(20*m.superior),49);
    c.bezierCurveTo(x(17*m.superior),55,x(19*m.inferior),69,x(22*m.inferior),79);
    c.bezierCurveTo(x(24),86,x(49),91,x(82),105);c.lineTo(x(105),105);c.closePath();
    c.fillStyle='#cf8487';c.fill();c.strokeStyle='#f7c3b4';c.lineWidth=3;c.stroke();
  }
  label(c,'Superior',170,15,muted,'center');label(c,'Inferior',170,121,muted,'center');
  if(m.voicing){stroke(c,[[170,97],[170,87]],gold,2);stroke(c,[[166,91],[170,86],[174,91]],gold,2);}
  if(m.voicing)return 'Voice. Expiratory airflow sustains oscillation. The lower margin leads the upper margin as the cover opens and closes.';
  return t<.2?'Inspiration. The vocal folds separate to allow airflow.':t<.5?'Preparing to speak. The vocal folds approach the midline before voicing.':'Breathing resumes. The vocal folds separate again.';
}
function renal(c,t,kind){
  const {fraction,particle,text}=filtrationReading(kind,t),x=225;
  for(const [name,y,ink,gap] of [['Endothelium',34,pink,6],['Basement membrane',63,'#b49abb',0],['Slit diaphragm',87,'#dea86f',3]]){
    label(c,name,12,y+4);stroke(c,[[157,y],[x-gap,y]],ink,6);stroke(c,[[x+gap,y],[323,y]],ink,6);
  }
  label(c,'Capillary blood',12,13,mint);label(c,'Capsular space',12,116,mint);
  const y=16+99*fraction;
  if(kind==='erythrocyte'){c.beginPath();c.ellipse(x,y,10,4,0,0,Math.PI*2);c.fillStyle=particle.color;c.fill();}
  else dot(c,x,y,kind==='albumin'?6:4,particle.color);
  return text;
}
function coronary(c,t,index){
  const xs=[20,62,102,143,192,233,274,317],ys=[68,68,67,48,49,67,68,68];
  stroke(c,[[20,68],[62,68],[102,67]],pink,8);
  for(const d of [-1,0,1]){
    stroke(c,[[102,67],[143,67+d*20],[192,67+d*20],[233,67]],d===0?'#c393a4':'#bb8fa8',3);
  }
  stroke(c,[[233,67],[274,68],[317,68]],blue,8);
  label(c,'Coronary artery',14,37,pink);label(c,'Capillaries',166,23,mint,'center');label(c,'Cardiac vein',323,37,blue,'right');
  label(c,'Myocardium',168,113,muted,'center');
  const stops=[0,.16,.29,.72,.86,1],u=Math.min(1,t*5-index);
  const f=(stops[index]+(stops[index+1]-stops[index])*u)*(xs.length-1),i=Math.min(xs.length-2,Math.floor(f)),r=f-i;
  dot(c,xs[i]+r*(xs[i+1]-xs[i]),ys[i]+r*(ys[i+1]-ys[i]),5,gold);
  return ['Coronary arteries receive blood from the aortic sinuses.','Arterial branches distribute blood within the myocardium.','Capillaries deliver oxygen to cardiac muscle and take up carbon dioxide. The atlas specimen resolves the larger vessels.','Cardiac veins collect blood from the heart muscle.','The coronary sinus drains most cardiac venous blood into the right atrium.'][index];
}

export function mountMechanismPanel(lesson,entry,callbacks){
  const meta=lessons[entry.id];
  if(!meta)return null;
  const notes=lesson.querySelector('.oa-notes'),row=document.createElement('div');
  row.className='oa-mechanism-row';notes.before(row);row.append(notes);
  const trigger=document.createElement('button');
  trigger.type='button';trigger.className='oa-mechanism-trigger';trigger.textContent=meta[0];trigger.setAttribute('aria-haspopup','dialog');row.append(trigger);
  const dlg=document.createElement('dialog');dlg.className='oa-mechanism-dialog';dlg.setAttribute('aria-labelledby','oa-mech-title');
  const renalView=entry.id==='glomerular-filtration',cardiacView=entry.id==='coronary-circulation';
  dlg.innerHTML='<header><h3 id="oa-mech-title">'+meta[1]+'</h3><button type="button" data-mech-close aria-label="Close mechanism view">×</button></header>'+
    '<p>'+meta[2]+'</p>'+(renalView?'<label>Particle<select data-mech-particle>'+Object.entries(filtrationParticles).map(([key,p])=>'<option value="'+key+'">'+p.label+'</option>').join('')+'</select></label>':'')+
    '<canvas width="680" height="264" role="img" aria-label="'+meta[1]+'"></canvas><p data-mech-reading></p>'+
    '<div class="oa-mech-controls"><button type="button" data-mech-play>Play</button><label>Animation position<input data-mech-time type="range" min="0" max="1000" value="0"></label></div>'+
    (cardiacView?'<button type="button" data-mech-posterior>View posterior coronary sinus in 3D</button>':'')+
    (entry.id==='phonation'?'<a href="https://voicefoundation.org/health-science/voice-disorders/anatomy-physiology-of-voice-production/understanding-voice-production/" target="_blank" rel="noreferrer">Vocal fold vibration reference ↗</a>':'');
  lesson.append(dlg);
  const q=attr=>dlg.querySelector('[data-mech-'+attr+']'),canvas=dlg.querySelector('canvas'),c=canvas.getContext('2d');
  let kind='water',time=0,index=0,playing=false;
  function update(t,phase,isPlaying){
    time=t;index=phase;playing=isPlaying;
    if(!dlg.open)return;
    q('time').value=String(Math.round(t*1000));q('time').setAttribute('aria-valuetext',entry.phases[phase].label);
    q('play').textContent=isPlaying?'Pause':t===1?'Replay':'Play';
    q('play').setAttribute('aria-pressed',String(isPlaying));
    c.setTransform(2,0,0,2,0,0);c.clearRect(0,0,340,132);
    const draw={pineal,phonation:larynx,'glomerular-filtration':renal,'coronary-circulation':coronary,'respiratory-acid-base':drawVentilation,'renal-acid-base':drawTubularCell,'follicle-ovulation':drawFollicleSection}[entry.id];
    const text=draw(c,t,renalView?kind:phase);
    if(q('reading').textContent!==text)q('reading').textContent=text;
    canvas.setAttribute('aria-label',meta[1]+'. '+text);
  }
  trigger.onclick=()=>{callbacks.pause();dlg.showModal();update(time,index,false);q('close').focus();};
  q('close').onclick=()=>dlg.close();
  q('play').onclick=()=>{callbacks.toggle();update(time,index,callbacks.playing());};
  q('time').oninput=e=>callbacks.seek(Number(e.target.value)/1000);
  if(renalView)q('particle').onchange=e=>{kind=e.target.value;callbacks.seek(0);};
  if(cardiacView)q('posterior').onclick=()=>{callbacks.seek(.8);callbacks.posterior();dlg.close();};
  dlg.onclose=()=>{callbacks.pause();trigger.focus();};
  return {update,get particle(){return kind;},dispose(){dlg.onclose=null;if(dlg.open)dlg.close();dlg.remove();}};
}
