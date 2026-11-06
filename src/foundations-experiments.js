import {foundationTraces} from './foundations-traces.js';
import {foundationsVisuals} from './visual-foundations.js';

const svg=(content,description,viewBox='0 0 480 240')=>`<svg viewBox="${viewBox}" role="img" aria-label="${description}" xmlns="http://www.w3.org/2000/svg">${content}</svg>`;
const option=(label,i)=>`<option value="${i}">${label}</option>`;

function mountTrace(root,{title,prompt,scenarios,art}){
 let step=0;
 root.innerHTML=`<div class="eyebrow">TRACE THE MECHANISM</div><h3>${title}</h3><p>${prompt}</p><label>Scenario <select>${scenarios.map(([name],i)=>option(name,i)).join('')}</select></label><div data-trace-art></div><ol class="foundation-trace" aria-label="Mechanism steps"></ol><p role="status" data-trace-note></p><div class="control-row"><button type="button" data-trace-next>Reveal next step</button><button type="button" data-trace-reset>Restart</button></div>`;
 const select=root.querySelector('select'),list=root.querySelector('ol'),note=root.querySelector('[data-trace-note]');
 const next=root.querySelector('[data-trace-next]'),reset=root.querySelector('[data-trace-reset]');
 function update(){
  const scenario=Number(select.value),[,steps]=scenarios[scenario];
  list.innerHTML=steps.map(([name],i)=>`<li ${i===step-1?'aria-current="step"':''}>${i<step?name:'Step '+(i+1)}</li>`).join('');
  if(art)root.querySelector('[data-trace-art]').innerHTML=art(scenario,step);
  note.textContent=step?steps[step-1][1]:'Predict the first change, then reveal the steps one at a time.';
  next.disabled=step===steps.length;
  reset.disabled=step===0;
 }
 select.onchange=()=>{step=0;update();};
 next.onclick=()=>{step++;update();if(next.disabled)reset.focus({preventScroll:true});};
 reset.onclick=()=>{step=0;update();next.focus({preventScroll:true});};
 update();
}

const acetateKa=10**-4.76;
const waterKw=1e-14;
export function acidDosePH(dose,buffered){
 const salt=buffered?.010:0,totalAcetate=buffered?.020:0;
 const initialAcid=buffered?0:acetateKa-waterKw/acetateKa;
 let lo=1e-8,hi=.1;
 for(let i=0;i<45;i++){
  const h=(lo+hi)/2;
  const acetate=totalAcetate*acetateKa/(acetateKa+h);
  const charge=h+salt-(dose/1000+initialAcid+acetate+waterKw/h);
  if(charge>0)hi=h;else lo=h;
 }
 return -Math.log10((lo+hi)/2);
}

function mountBuffer(root){
 const x=dose=>54+dose*18,y=ph=>183-(ph-1.5)*42;
 const curve=buffered=>Array.from({length:81},(_,i)=>`${x(i/4)},${y(acidDosePH(i/4,buffered)).toFixed(1)}`).join(' ');
 root.innerHTML=`<div class="eyebrow">BUFFER EXPERIMENT</div><h3>Equal acid doses. Different pH changes.</h3><p>Both samples start near pH 4.76. Predict which will change faster when you add strong acid.</p><label>Added acid <input type="range" min="0" max="20" step=".25" value="0"></label><div class="foundation-plot">${svg(`<path d="M54 24V183H423" fill="none" stroke="#92afa6" stroke-width="2"/>${[2,3,4,5].map(n=>`<text x="43" y="${y(n)+5}" text-anchor="end">${n}</text><path d="M54 ${y(n)}H423" stroke="#35534f"/>`).join('')}<text x="14" y="20">pH</text><text x="233" y="223" text-anchor="middle">Added strong acid (mmol/L)</text>${[0,5,10,15,20].map(n=>`<text x="${x(n)}" y="205" text-anchor="middle">${n}</text>`).join('')}<polyline points="${curve(true)}" fill="none" stroke="#a9dcc2" stroke-width="4"/><polyline points="${curve(false)}" fill="none" stroke="#ffbf91" stroke-width="4" stroke-dasharray="7 5"/><path data-dose-cursor stroke="#f4f0dc" stroke-width="2"/>`,'pH versus acid dose. A solid line shows acetate buffer. A dashed line shows unbuffered water.')}</div><ul class="reaction-legend"><li><span class="buffer-solid" aria-hidden="true"></span>Acetate buffer</li><li><span class="buffer-dashed" aria-hidden="true"></span>Unbuffered water</li></ul><p role="status"></p><p class="tiny">Idealized equilibrium at fixed volume with a 20 mM acetate buffer. The curves show a classroom solution model.</p>`;
 const range=root.querySelector('input'),status=root.querySelector('[role="status"]'),cursor=root.querySelector('[data-dose-cursor]');
 function draw(){
  const dose=Number(range.value);
  cursor.setAttribute('d',`M${x(dose)} 24V183`);
  range.setAttribute('aria-valuetext',`${dose} millimoles per liter`);
  status.textContent=`${dose} mmol/L added · Buffer pH ${acidDosePH(dose,true).toFixed(2)} · Unbuffered pH ${acidDosePH(dose,false).toFixed(2)}. ${dose>=10?'At this dose, most of the original acetate base is used up.':'Compare how far the two readings have moved from their starting pH.'}`;
 }
 range.oninput=draw;
 draw();
}

const elements=['Hydrogen','Helium','Lithium','Beryllium','Boron','Carbon','Nitrogen','Oxygen','Fluorine','Neon','Sodium','Magnesium','Aluminium','Silicon','Phosphorus','Sulfur','Chlorine','Argon'];
function mountAtom(root){
 root.innerHTML=`<div class="eyebrow">ATOM BUILDER</div><h3>Change one particle at a time.</h3><p>Predict what will happen to the element, mass number and net charge before changing a count.</p><div class="foundation-inputs">${[['Protons',1,18,11],['Neutrons',0,30,12],['Electrons',0,18,11]].map(([name,min,max,value])=>`<label>${name} <input type="range" min="${min}" max="${max}" value="${value}"><output>${value}</output></label>`).join('')}</div><p role="status"></p><p class="tiny">This counting model allows hypothetical nuclei and ion charges, including combinations that are unstable.</p>`;
 const ranges=[...root.querySelectorAll('input')],outputs=[...root.querySelectorAll('output')];
 function draw(){
  const [p,n,e]=ranges.map((range,i)=>{outputs[i].value=range.value;return Number(range.value);});
  const charge=p-e;
  root.querySelector('[role="status"]').textContent=`${elements[p-1]} · atomic number ${p} · mass number ${p+n} · net charge ${charge>0?'+':''}${charge}`;
 }
 ranges.forEach(range=>range.oninput=draw);
 draw();
}

const skinLayers=[['Corneum','#e9ba98'],['Lucidum','#ded7a5'],['Granulosum','#ca9cb7'],['Spinosum','#a27da6'],['Basale','#736d9e']];
function mountSkin(root){
 root.innerHTML='<div class="eyebrow">COMPARE EPIDERMIS</div><h3>Thick skin and thin skin</h3><p>Compare the epidermal strata, then trace a keratinocyte toward the surface.</p><label>Trace outward from the basal layer <input type="range" min="0" max="4" step="1" value="0"></label><div data-skin-art></div><p role="status"></p>';
 const range=root.querySelector('input');
 function draw(){
  const step=Number(range.value);
  const panels=[{x:36,title:'Palm · thick skin',heights:[42,15,23,40,22]},{x:262,title:'Typical thin skin',heights:[21,0,18,36,22]}];
  const art=panels.map(({x,title,heights})=>{
   let top=194-heights.reduce((a,b)=>a+b,0);
   const active=step===3&&x===262?0:4-step;
   return `<text x="${x}" y="25">${title}</text>`+skinLayers.map(([name,color],i)=>{
    const y=top,h=heights[i];top+=h;
    if(!h)return '';
    return `<rect x="${x}" y="${y}" width="182" height="${h-1}" fill="${color}" rx="3"/><text x="${x+28}" y="${y+h/2+4}" fill="#10252c" style="fill:#10252c">${name}</text>${i===active?`<circle cx="${x+13}" cy="${y+h/2}" r="5" fill="#ffefb8" stroke="#473322" stroke-width="2"/>`:''}`;
   }).join('')+`<rect x="${x}" y="195" width="182" height="20" fill="#a96c73"/><text x="${x+28}" y="210">Dermis below</text>`;
  }).join('');
  root.querySelector('[data-skin-art]').innerHTML=svg(art,'Comparison of epidermal layers in thick and thin skin. Thick skin has a lucidum and a thicker corneum.');
  root.querySelector('[role="status"]').textContent=['Basale. Melanocytes transfer pigment to nearby keratinocytes.','Spinosum. Keratinocytes move outward while producing keratin.','Granulosum. Keratinization and barrier formation progress.','Lucidum. A distinct clear layer is visible in thick skin. Thin skin goes directly to corneum.','Corneum. Flattened keratinized cells form the outer barrier.'][step];
 }
 range.oninput=draw;
 draw();
}

function mountHeat(root){
 root.innerHTML='<div class="eyebrow">THERMOREGULATION</div><h3>Change temperature and humidity separately.</h3><div class="foundation-inputs"><label>Thermal condition <select><option>Warm</option><option>Cool</option></select></label><label>Humidity <select><option>Dry</option><option>Humid</option></select></label></div><div data-heat-art></div><p role="status"></p><p class="tiny">Qualitative comparison with airflow and activity held constant.</p>';
 const [temperature,humidity]=root.querySelectorAll('select');
 function draw(){
  const warm=temperature.selectedIndex===0,dry=humidity.selectedIndex===0;
  root.querySelector('[data-heat-art]').innerHTML=svg(`<rect x="24" y="102" width="432" height="112" rx="12" fill="#a46c7a"/><path d="M80 175Q132 153 184 175T288 175T392 175" fill="none" stroke="#ffc19d" stroke-width="${warm?12:5}"/><path d="M220 171q-26-26 0-33t0-26v-10" fill="none" stroke="#9ed9ef" stroke-width="6"/>${warm?`<ellipse cx="220" cy="91" rx="${dry?11:27}" ry="6" fill="#9ed9ef"/>${dry?'<path d="M190 83V48m-5 7 5-7 5 7M220 76V35m-5 7 5-7 5 7M250 83V48m-5 7 5-7 5 7" fill="none" stroke="#d2f1f5" stroke-width="3"/>':''}`:''}<text x="29" y="232">Superficial vessel and eccrine duct</text>`,warm?`Vessel dilation and sweat secretion. ${dry?'More sweat evaporates.':'More sweat remains on the surface.'}`:'Vessel constriction and reduced sweat output.');
  root.querySelector('[role="status"]').textContent=warm?(dry?'Warm + dry: vessels dilate, sweat is secreted, and evaporation removes heat more readily.':'Warm + humid: vessels dilate and sweat is secreted, but evaporation removes less heat.'):'Cool: superficial vasoconstriction limits heat loss and the drive to sweat is lower in this example.';
 }
 temperature.onchange=humidity.onchange=draw;
 draw();
}

function mountBurn(root){
 const injuries=['Superficial · epidermis','Partial thickness · into dermis','Full thickness · through dermis','Deeper injury · muscle or bone'];
 root.innerHTML=`<div class="eyebrow">BURN COMPARISON</div><h3>Compare depth and extent independently.</h3><div class="foundation-inputs"><label>Depth <select>${injuries.map(option).join('')}</select></label><label>Illustrated surface area <input type="range" min="5" max="60" step="5" value="15"></label></div><div data-burn-art></div><p role="status"></p><p class="tiny">This schematic compares classifications. The illustrated area is a percentage of the diagram’s surface sample.</p>`;
 const range=root.querySelector('input'),select=root.querySelector('select');
 function draw(){
  const depth=+select.value,area=+range.value;
  const left=74,width=332*area/100;
  const art=foundationsVisuals['5.4'].art(depth).split('<path d="M102 32')[0];
  const bottom=[49,88,114,221][depth];
  root.querySelector('[data-burn-art]').innerHTML=svg(`${art}<path d="M${left} 32H${left+width}V${bottom}H${left}Z" fill="#572d40" stroke="#ffe0a6" stroke-width="2"/>`,injuries[depth]+`, covering ${area} percent of the illustrated surface sample`,'0 0 480 250');
  root.querySelector('[role="status"]').textContent=`${injuries[depth]} · ${area}% of the sample surface shown.`;
  range.setAttribute('aria-valuetext',`${area} percent of the illustrated surface`);
 }
 range.oninput=select.onchange=draw;
 draw();
}

function mountEpithelium(root){
 root.innerHTML='<div class="eyebrow">TRANSITIONAL EPITHELIUM</div><h3>What changes as the bladder fills?</h3><label>Distend the tissue <input type="range" min="0" max="100" step="10" value="0"></label><div data-epithelium-art></div><p role="status"></p>';
 const range=root.querySelector('input');
 function draw(){
  const fullness=Number(range.value)/100;
  const width=46+24*fullness,h=27-13*fullness,x0=(480-5*width)/2,y0=190-3*h;
  const cells=Array.from({length:15},(_,i)=>{
   const x=x0+(i%5)*width,y=y0+Math.floor(i/5)*h;
   return `<rect x="${x+1}" y="${y}" width="${width-2}" height="${h-1}" rx="${i<5?Math.min(h/2,13):3}" fill="${i<5?'#ecad9e':'#a884ac'}" stroke="#402d4c"/><ellipse cx="${x+width/2}" cy="${y+h/2}" rx="5" ry="${i<5?3:5}" fill="#55365b"/>`;
  }).join('');
  root.querySelector('[data-epithelium-art]').innerHTML=svg(`<text x="240" y="36" text-anchor="middle">Bladder lumen</text>${cells}<path d="M${x0} 192h${5*width}" stroke="#9ed9ef" stroke-width="3"/><text x="240" y="220" text-anchor="middle">Basement membrane</text>`,'Schematic transitional epithelium with a fixed number of cells. The superficial umbrella cells flatten as the tissue stretches.');
  root.querySelector('[role="status"]').textContent=fullness===0?'Relaxed view. Superficial umbrella cells appear rounded.':fullness===1?'Distended view. Umbrella cells are flatter and the epithelium is thinner. It remains stratified.':'During stretch, the same cells occupy a wider, thinner layer.';
 }
 range.oninput=draw;
 draw();
}

function mountImaging(root){
 const ct=`<figure class="foundation-figure"><svg viewBox="10 30 335 426" role="img" aria-label="Axial CT with a bright skull and dark fluid in the ventricles"><image href="assets/foundations/axial-brain-ct.png" width="646" height="468"/></svg><figcaption><strong>Noncontrast CT</strong><br>Axial crop · <a href="https://commons.wikimedia.org/wiki/File:CT_of_a_normal_brain,_axial_20.png" target="_blank" rel="noopener">Mikael Häggström, M.D.</a> · <a href="https://creativecommons.org/publicdomain/zero/1.0/" target="_blank" rel="noopener">CC0</a></figcaption></figure>`;
 const mri=`<figure class="foundation-figure"><img width="359" height="449" src="assets/foundations/axial-brain-mri.jpg" alt="Axial T2 MRI with bright ventricular fluid and stronger differences between soft tissues"><figcaption><strong>T2-weighted MRI</strong><br><a href="https://commons.wikimedia.org/wiki/File:Normal_axial_T2-weighted_MR_image_of_the_brain.jpg" target="_blank" rel="noopener">Novaksean via Wikimedia Commons</a> · <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener">CC BY-SA 4.0</a></figcaption></figure>`;
 root.innerHTML='<div class="eyebrow">COMPARE REAL SCANS</div><h3>Same region, different imaging contrast.</h3><p>Compare two axial examples near the lateral ventricles from different people. The levels are approximate. Look at the skull and fluid spaces first.</p><label>Display <select><option>Both scans</option><option>CT only</option><option>MRI only</option></select></label><div class="foundation-scan-grid"></div><p role="status"></p>';
 const select=root.querySelector('select'),scans=root.querySelector('.foundation-scan-grid');
 function draw(){
  const view=select.selectedIndex;
  scans.classList.toggle('single',view!==0);
  scans.innerHTML=view===1?ct:view===2?mri:ct+mri;
  root.querySelector('[role="status"]').textContent=view===1?'Bone attenuates X-rays strongly and appears bright in this CT view. Ventricular fluid is darker than brain tissue.':view===2?'Ventricular fluid appears bright on this T2-weighted sequence. Cortical bone gives little signal.': 'Trace the outer skull and the internal fluid spaces on both scans. The two modalities produce contrast by different physical mechanisms.';
 }
 select.onchange=draw;
 draw();
}

export const foundationExperiments={
 ...Object.fromEntries(Object.entries(foundationTraces).map(([section,trace])=>[section,{label:trace.label,mount:root=>mountTrace(root,trace)}])),
 '1.7':{label:'Compare CT & MRI',mount:mountImaging},
 '2.1':{label:'Build an atom',mount:mountAtom},'2.4':{label:'Buffer experiment',mount:mountBuffer},
 '4.2':{label:'Stretch a lining',mount:mountEpithelium},'5.1':{label:'Compare skin layers',mount:mountSkin},
 '5.3':{label:'Change temperature',mount:mountHeat},'5.4':{label:'Compare burns',mount:mountBurn}
};
