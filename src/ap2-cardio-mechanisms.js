// Original explanatory drawings. Stage timing and case data are for A&P instruction.
const row=(content)=>'<div class="ac-actions ac-row">'+content+'</div>';
const svg=(title,inner)=>`<figure class="ac-plot"><svg viewBox="0 0 440 170" role="img" aria-label="${title}">${inner}</svg></figure>`;
const line=(path,stroke,width=4,more='')=>`<path d="${path}" stroke="${stroke}" stroke-width="${width}" fill="none" stroke-linecap="round" stroke-linejoin="round" ${more}/>`;
const text=(x,y,word,anchor='start')=>`<text x="${x}" y="${y}" text-anchor="${anchor}">${word}</text>`;
export function renderValveWindow(){
  return `<div class="ac-valve-window"><h4>Valve motion at the cursor</h4>
    ${svg('Schematic of the mitral and aortic valves, with flow from bottom to top.',
      text(109,20,'Mitral · LA to LV','middle')+text(323,20,'Aortic · LV to aorta','middle')+
      [109,323].map((x,i)=>`<g transform="translate(${x} 0)">${line('M-43 143V43 M43 143V43','#8b909f',5)}
      <path data-leaf-a="${i}" stroke="#f6d48c" stroke-width="6" fill="none"/><path data-leaf-b="${i}" stroke="#f6d48c" stroke-width="6" fill="none"/>
      <path data-leaf-flow="${i}" d="M0 128V53 m-7 8 7-8 7 8" stroke="#a4dacb" stroke-width="3" fill="none"/>
      <text data-leaf-state="${i}" x="0" y="162" text-anchor="middle"></text></g>`).join(''))}
    <small>Section through two leaflets or cusps. Opening follows the forward pressure gradient. The 3D specimen shows the corresponding valve surfaces.</small></div>`;
}
export function paintValves(root,state){
  [state.mitral,state.aortic].forEach((open,i)=>{
    const gradient=i?state.lv-state.ao:state.la-state.lv;
    const sweep=open?Math.min(1,.65+Math.max(0,gradient)/6):0;
    const spread=3+33*sweep, height=i?90-26*sweep:91-29*sweep;
    for(const [side,sign] of [['a',-1],['b',1]]){
      const x=43*sign;
      const cp=i?`Q${x} ${110-20*sweep} ${spread*sign} ${height}`:`Q${(28+8*sweep)*sign} ${88-10*sweep} ${(spread-2)*sign} ${height}`;
      root.querySelector('[data-leaf-'+side+'="'+i+'"]').setAttribute('d',`M${x} 95 ${cp}`);
    }
    root.querySelector('[data-leaf-state="'+i+'"]').textContent=open?'Open':'Closed';
    root.querySelector('[data-leaf-flow="'+i+'"]').style.display=open?'':'none';
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
  ['Baseline',72,72,95,'Normal venous return maintains filling and stroke volume.'],
  ['Early compensation',108,49,87,'Blood loss reduces venous return, end-diastolic volume and stroke volume. Reduced baroreceptor firing increases sympathetic drive. Tachycardia and vasoconstriction help sustain pressure.'],
  ['Continuing loss',138,24,58,'Falling stroke volume now outweighs the rise in heart rate. Cardiac output and pressure decline, and organ perfusion becomes inadequate.']
];
export function renderHemorrhage(){return `<h3>Read a blood-loss time series</h3><p>A fictional adult loses blood progressively. Select the stage and predict whether the pressure is being maintained.</p>
  ${row(hemorrhage.map(([l],i)=>`<button data-loss="${i}">${l}</button>`).join(''))}<div class="ac-stats"><span>Heart rate<strong data-loss-hr></strong></span><span>Stroke volume<strong data-loss-sv></strong></span><span>Mean arterial pressure<strong data-loss-map></strong></span></div>
  ${row('<button data-loss-check>Explain these observations</button>')}<p role="status" data-loss-note></p>`;}
export function mountHemorrhage(root){let current;function draw(i){current=i;const [,hr,sv,map]=hemorrhage[i];for(const [k,v]of [['hr',hr+' beats/min'],['sv',sv+' mL/beat'],['map',map+' mm Hg'],['note','']])root.querySelector('[data-loss-'+k+']').textContent=v;root.querySelectorAll('button[data-loss]').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.loss===i)));}root.querySelectorAll('button[data-loss]').forEach(b=>b.onclick=()=>draw(+b.dataset.loss));root.querySelector('[data-loss-check]').onclick=()=>{const [,hr,sv,,msg]=hemorrhage[current];root.querySelector('[data-loss-note]').textContent='Cardiac output '+(hr*sv/1000).toFixed(2)+' L/min. '+msg;};draw(0);}

