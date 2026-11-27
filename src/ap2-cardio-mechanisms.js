import {cardiacValves,openingFor} from './ap2-valve-surfaces.js';
// Original explanatory drawings. Stage timing and case data are for A&P instruction.
const row=(content)=>'<div class="ac-actions ac-row">'+content+'</div>';
const svg=(title,inner)=>`<figure class="ac-plot"><svg viewBox="0 0 440 170" role="img" aria-label="${title}">${inner}</svg></figure>`;
const line=(path,stroke,width=4,more='')=>`<path d="${path}" stroke="${stroke}" stroke-width="${width}" fill="none" stroke-linecap="round" stroke-linejoin="round" ${more}/>`;
const text=(x,y,word,anchor='start')=>`<text x="${x}" y="${y}" text-anchor="${anchor}">${word}</text>`;
export function renderValveWindow(){
  const descriptions=['Mitral · LA to LV','Aortic · LV to aorta','Tricuspid · RA to RV','Pulmonary · RV to trunk'];
  const pair=(offset)=>svg((offset?'Right':'Left')+' heart valve section. Forward flow points upward.',
    [0,1].map((j)=>{
      const i=j+offset,x=j?323:109;
      return text(x,20,descriptions[i],'middle')+'<g transform="translate('+x+' 0)">'+line('M-43 143V43 M43 143V43','#8b909f',5)+
        '<path data-leaf-a="'+i+'" stroke="#f6d48c" stroke-width="6" fill="none"/><path data-leaf-b="'+i+'" stroke="#f6d48c" stroke-width="6" fill="none"/>'+
        '<path data-leaf-flow="'+i+'" d="M0 128V53 m-7 8 7-8 7 8" stroke="#a4dacb" stroke-width="3" fill="none"/>'+
        '<text data-leaf-state="'+i+'" x="0" y="162" text-anchor="middle"></text></g>';
    }).join(''));
  return '<div class="ac-valve-window"><h4>Valve motion at the cursor</h4>'+pair(0)+pair(2)+'<small>Each section shows two leaflet edges. All four valves follow their own forward pressure gradients on the same heartbeat clock.</small></div>';
}
export function paintValves(root,state){
  cardiacValves.forEach((valve,i)=>{
    const open=state[valve.key],sweep=openingFor(valve,state);
    const spread=3+33*sweep,height=valve.av?91-29*sweep:90-26*sweep;
    for(const [side,sign] of [['a',-1],['b',1]]){
      const x=43*sign;
      const cp=valve.av?`Q${27*sign} ${86-17*sweep} ${spread*sign} ${height}`:`Q${x} ${106-18*sweep} ${spread*sign} ${height}`;
      root.querySelector('[data-leaf-'+side+'="'+i+'"]').setAttribute('d','M'+x+' 104 '+cp);
    }
    root.querySelector('[data-leaf-flow="'+i+'"]').style.display=open?'':'none';
    root.querySelector('[data-leaf-state="'+i+'"]').textContent=open?'Open':'Closed';
  });
}

const exerciseData=[
  ['At rest',72,70,'Baseline venous return and sympathetic tone.'],
  ['Moderate cycling',120,95,'Leg movement increases venous return. Sympathetic drive raises heart rate and contractility.'],
  ['Vigorous cycling',160,105,'Heart rate rises further. Less filling time can limit further gains in stroke volume.']
];
export function renderOutput(){
  return `<h3>From a heartbeat to a minute of exercise</h3><p>A healthy volunteer cycles at three workloads. Calculate cardiac output from each pair of measurements.</p>
  ${row(exerciseData.map(([label],i)=>`<button data-workload="${i}">${label}</button>`).join(''))}<div class="ac-stats"><span>Heart rate<strong data-ex-hr></strong></span><span>Stroke volume<strong data-ex-sv></strong></span></div>
  <label>Predict cardiac output (L/min) <input type="number" data-ex-answer step=".01" inputmode="decimal"></label> ${row('<button data-ex-check>Check calculation</button><button data-ex-show>Show calculation</button>')}<p role="status" data-ex-feedback></p>`;
}
export function mountOutput(root){
  let current=0;const get=n=>root.querySelector('[data-ex-'+n+']');
  function choose(i){current=i;const [,hr,sv]=exerciseData[i];get('hr').textContent=hr+' beats/min';get('sv').textContent=sv+' mL/beat';get('answer').value='';get('feedback').textContent='';root.querySelectorAll('[data-workload]').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.workload===i)));}
  function answer(reveal){const [,hr,sv,note]=exerciseData[current],co=hr*sv/1000;
    const correct=get('answer').value!==''&&Math.abs(Number(get('answer').value)-co)<.011;
    get('feedback').textContent=(correct?'Correct. ':'')+(correct||reveal?`${hr} beats/min × ${sv} mL/beat = ${hr*sv} mL/min = ${co} L/min. ${note}`:'Multiply heart rate by stroke volume, then divide by 1,000 to convert mL to L.');}
  root.querySelectorAll('[data-workload]').forEach(b=>b.onclick=()=>choose(+b.dataset.workload));get('check').onclick=()=>answer(false);get('show').onclick=()=>answer(true);choose(0);
}

const embryo = [
  ['Paired tubes','Around day 19','Endocardial tubes arise in the cardiogenic region. Lateral folding brings them toward the midline.','M183 40 C170 60 173 97 181 130 M256 40 C270 60 267 97 258 130','Paired tubes'],
  ['Single tube','Around days 21–22','Fusion produces a primitive heart tube. Blood enters the caudal venous pole and leaves the cranial outflow.','M222 126 C205 107 210 73 219 49 Q222 40 222 34','Cranial outflow'],
  ['Rightward loop','During week 4','The ventricular portion bends ventrally and toward the embryo’s right. The atrial region shifts dorsocranially. Right appears on the left in this anterior view.','M236 68 C260 85 251 134 211 130 C156 127 162 79 199 84 C230 90 219 57 220 36','Ventricular loop'],
  ['Septation','Weeks 4–8','Atrial and ventricular septa and endocardial cushions partition the chambers. Outflow septation separates the aorta and pulmonary trunk.','M203 47 C164 40 165 92 181 116 Q215 151 247 119 C270 107 275 65 245 47 Q224 38 203 47 Z','Septal partitions']
];
export function renderEmbryo(){return `<h3>Build a heart from a tube</h3><p>Follow the embryo in an anterior schematic. Each stage has its own landmarks.</p>
  ${row(embryo.map(([l],i)=>`<button data-embryo="${i}">${l}</button>`).join(''))}<div data-embryo-drawing></div><h4 data-embryo-title></h4><p data-embryo-note></p>`;}
export function mountEmbryo(root){function draw(i){const [label,date,note,path,structure]=embryo[i];root.querySelector('[data-embryo-drawing]').innerHTML=svg(label,
  text(12,21,'Embryo’s right')+text(428,21,'Embryo’s left','end')+line('M220 25V147','#4e6970',1,'stroke-dasharray="3 3"')+
  (i===3?`<path d="${path}" fill="#704554"/>`:'')+line(path,'#c77582',i===3?8:18)+
  (i===3?line('M218 63 L218 81 M183 85 Q215 99 253 80 M216 132 Q226 107 220 91','#eed0aa',4):'')+
  text(220,161,structure,'middle'));root.querySelector('[data-embryo-title]').textContent=date+' · '+label;root.querySelector('[data-embryo-note]').textContent=note;
  root.querySelectorAll('button[data-embryo]').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.embryo===i)));}root.querySelectorAll('button[data-embryo]').forEach(b=>b.onclick=()=>draw(+b.dataset.embryo));draw(0);}

export function renderPump(){return `<h3>Operate the calf muscle pump</h3><p>Look at both valve pairs as a calf muscle compresses a deep vein. Blood moves toward the heart.</p>
  <div data-pump-drawing></div>${row('<button data-pump="0">Relax and refill</button><button data-pump="1">Contract and empty</button>')}<p data-pump-note role="status"></p>`;}
export function mountPump(root){
  function draw(squeeze){
    const width=squeeze?12:32;
    const valve=(y,open)=>line(`M183 ${y} Q190 ${y-4} ${open?191:218} ${y-(open?18:11)} M257 ${y} Q250 ${y-4} ${open?249:222} ${y-(open?18:11)}`,'#f5ce88',4);
    const vein=`M183 12V45 Q${220-width} 75 ${220-width} 86 Q${220-width} 100 183 126V156 H257V126 Q${220+width} 105 ${220+width} 86 Q${220+width} 70 257 45V12Z`;
    root.querySelector('[data-pump-drawing]').innerHTML=svg(squeeze?'Contraction empties a deep leg vein':'Venous refill after relaxation',
      `<path d="${vein}" fill="#406a89" stroke="#86a9b9" stroke-width="3"/>`+
      [1,-1].map(d=>`<ellipse cx="${220+(squeeze?64:75)*d}" cy="86" rx="${squeeze?43:29}" ry="${squeeze?29:47}" fill="#aa696c"/>`).join('')+
      valve(42,squeeze)+valve(144,!squeeze)+line(squeeze?'M220 79V19 m-6 8 6-8 6 8':'M220 149V94 m-6 8 6-8 6 8','#a2eedc',4)+text(11,32,'Toward heart ↑')+text(306,40,'Proximal valve')+text(306,143,'Distal valve'));
    root.querySelector('[data-pump-note]').textContent=squeeze?'Contraction raises pressure in the compressed segment. The proximal valve opens and the distal valve closes. Blood is ejected toward the heart.':'During refill, lower pressure in the segment allows blood to enter through the distal valve. The proximal valve prevents backward flow.';
    root.querySelectorAll('button[data-pump]').forEach(b=>b.setAttribute('aria-pressed',String(Boolean(+b.dataset.pump)===squeeze)));
  }
  root.querySelectorAll('button[data-pump]').forEach(b=>b.onclick=()=>draw(Boolean(+b.dataset.pump)));draw(false);
}

const exchanges=[
  ['Diffusion','Oxygen moves down its concentration gradient into the tissue. Carbon dioxide can move in the opposite direction at the same time.','O₂ → tissue','CO₂ → blood'],
  ['Filtration','Capillary hydrostatic pressure favors outward movement of fluid. Plasma protein osmotic pressure opposes filtration. Water can carry small dissolved solutes.','Water + solutes → tissue','Plasma proteins remain'],
  ['Lymph return','Excess interstitial fluid enters blind-ended lymphatic capillaries and eventually returns to the veins at the base of the neck.','Tissue fluid → lymph','Lymph → venous blood']
];
export function renderExchange(){return `<h3>Follow a molecule or a volume of fluid</h3>${row(exchanges.map(([l],i)=>`<button data-exchange="${i}">${l}</button>`).join(''))}<div data-exchange-art></div><p data-exchange-note></p>`;}
export function mountExchange(root){function draw(i){const [l,note,a,b]=exchanges[i]; root.querySelector('[data-exchange-art]').innerHTML=svg(l,
  line('M36 53H399','#ad777c',26)+line('M36 53H399','#714f65',18)+line('M125 126Q184 112 247 127T400 122','#7fb597',14)+
  (i===0?line('M180 49V88 m-5 -6 5 6 5-6 M227 89V52 m-5 6 5-6 5 6','#f1ce80',3):i===1?line('M177 48V91 m-6-7 6 7 6-7 M210 48V91 m-6-7 6 7 6-7','#96d9dc',4):line('M175 84Q164 111 184 122H317 m-7-5 7 5-7 5','#d5edac',4))+
  text(12,22,a)+text(425,155,b,'end')+text(20,94,'Interstitial fluid'));root.querySelector('[data-exchange-note]').textContent=note;root.querySelectorAll('button[data-exchange]').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.exchange===i)));}root.querySelectorAll('button[data-exchange]').forEach(b=>b.onclick=()=>draw(+b.dataset.exchange));draw(0);}

export const hemorrhage=[
  {label:'Baseline',hr:72,sv:70,rap:4,svr:18},
  {label:'Early compensation',hr:105,sv:40,rap:4,svr:21,why:'Cardiac output falls as stroke volume decreases. Increased vascular resistance partially offsets this loss, keeping mean arterial pressure near baseline.'},
  {label:'Continuing loss',hr:140,sv:20,rap:4,svr:22,why:'The faster heart rate and higher resistance can no longer offset the loss of stroke volume. Output falls enough to lower mean arterial pressure substantially.'}
];
export function hemorrhageValues({hr,sv,rap,svr}){
  const co=hr*sv/1000;
  return {co,map:Math.round(rap+co*svr)};
}
export function renderHemorrhage(){
  return '<h3>Read a blood-loss time series</h3><p>Use the baseline and a new set of measurements to predict mean arterial pressure (MAP). Right atrial pressure (RAP) stays at 4 mm Hg in this simplified comparison.</p>'+
    row(hemorrhage.map((s,i)=>'<button type="button" data-loss="'+i+'">'+s.label+'</button>').join(''))+
    '<p>Baseline: 72 beats/min × 70 mL/beat = 5.04 L/min. Systemic vascular resistance (SVR) is 18 mm Hg·min/L and MAP is 95 mm Hg.</p>'+
    '<div class="ac-stats"><span>Heart rate<strong data-loss-hr></strong></span><span>Stroke volume<strong data-loss-sv></strong></span><span>SVR<strong data-loss-svr></strong></span><span>MAP<strong data-loss-map></strong></span></div>'+
    '<fieldset data-loss-inputs><legend>Predict and explain</legend><p>Cardiac output = HR × SV ÷ 1,000 in L/min. MAP = RAP + output × SVR.</p>'+
    '<label>Predicted MAP (mm Hg)<input data-loss-prediction type="number" step="any" min="0" inputmode="decimal"></label>'+
    '<label>Which measurement supports a resistance-vessel response?<select data-loss-evidence><option value="">Select evidence</option><option value="rate">Heart rate increased</option><option value="svr">SVR increased</option><option value="volume">Stroke volume decreased</option></select></label>'+
    '<button type="button" data-loss-check>Compare prediction with measured pressure</button></fieldset><p role="status" data-loss-note></p>';
}
export function mountHemorrhage(root){
  const get=key=>root.querySelector('[data-loss-'+key+']');
  let current=0;
  function draw(i){
    current=i;
    const s=hemorrhage[i];get('hr').textContent=s.hr+' beats/min';get('sv').textContent=s.sv+' mL/beat';
    get('svr').textContent=s.svr+' mm Hg·min/L';get('map').textContent=i?'Predict first':'95 mm Hg';
    get('prediction').value='';get('evidence').value='';get('note').textContent=i?'':'Choose a blood-loss stage to test your prediction.';
    get('inputs').hidden=!i;
    root.querySelectorAll('[data-loss]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.loss)===i)));
  }
  root.querySelectorAll('[data-loss]').forEach(b=>b.onclick=()=>draw(Number(b.dataset.loss)));
  function revise(){
    get('map').textContent='Predict first';get('note').textContent='';
  }
  get('prediction').oninput=revise;get('evidence').onchange=revise;
  get('check').onclick=()=>{
    const input=get('prediction'),evidence=get('evidence').value;
    if(!input.value||!input.validity.valid||!evidence){get('note').textContent='Enter a pressure and choose the evidence before comparing.';return;}
    const s=hemorrhage[current],{co,map}=hemorrhageValues(s);
    const close=Math.abs(input.valueAsNumber-map)<=1;
    get('map').textContent=map+' mm Hg';get('note').textContent=(close?'Your pressure prediction fits. ':'Recheck the pressure calculation. ')+
      'Cardiac output is '+co.toFixed(2)+' L/min. 4 + ('+co.toFixed(2)+' × '+s.svr+') gives about '+map+' mm Hg. '+
      (evidence==='svr'?'You identified the resistance change. ':'The evidence for constriction is the higher SVR. ')+s.why;
  };
  draw(1);
}

