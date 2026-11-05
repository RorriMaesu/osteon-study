const shellExamples=[
 {name:'Magnesium',symbol:'Mg',protons:12,electrons:[2,8,2],ion:[2,8],charge:'2⁺'},
 {name:'Sodium',symbol:'Na',protons:11,electrons:[2,8,1],ion:[2,8],charge:'⁺'},
 {name:'Chlorine',symbol:'Cl',protons:17,electrons:[2,8,7],ion:[2,8,8],charge:'⁻'}
];
export function renderFoundationsActivity(root,section){
 if(section==='2.1'){
  let atom=0,ionic=false;
  const draw=()=>{
   const a=shellExamples[atom],shells=ionic?a.ion:a.electrons;
   const diagram=shells.map((n,i)=>{const r=38+i*29;return `<circle cx="112" cy="112" r="${r}" fill="none" stroke="#71978a"/>${Array.from({length:n},(_,j)=>{const t=(j/n)*Math.PI*2;return `<circle cx="${112+r*Math.cos(t)}" cy="${112+r*Math.sin(t)}" r="4" fill="#f1b990"/>`;}).join('')}`;}).join('');
   root.innerHTML=`<div class="eyebrow">ELECTRON SHELL LAB</div><h3>What changes when an atom becomes an ion?</h3><div class="control-row"><label for="shell-atom">Element</label><select id="shell-atom">${shellExamples.map((s,i)=>`<option value="${i}" ${i===atom?'selected':''}>${s.name}</option>`).join('')}</select><button id="shell-ion" aria-pressed="${ionic}">${ionic?'Show neutral atom':'Form the common ion'}</button></div><div class="foundation-atlas-layout"><svg viewBox="0 0 224 224" role="img" aria-label="${a.symbol}. Shell occupancy ${shells.join(', ')}"><rect width="224" height="224" fill="#13272b"/>${diagram}<circle cx="112" cy="112" r="25" fill="#c4dfc7"/><text x="112" y="118" text-anchor="middle" font-size="16" fill="#172c23">${a.symbol+(ionic?a.charge:'')}</text></svg><div><p role="status">Shell occupancy ${shells.join(' · ')}. The nucleus still has ${a.protons} protons.</p><p class="tiny">Simplified shell model for the first three periods. Electrons are shown as counts, not as orbit trajectories.</p></div></div>`;
   root.querySelector('#shell-atom').onchange=e=>{atom=+e.target.value;ionic=false;draw();root.querySelector('#shell-atom').focus({preventScroll:true});};
   root.querySelector('#shell-ion').onclick=()=>{ionic=!ionic;draw();root.querySelector('#shell-ion').focus({preventScroll:true});};
  };
  draw();return true;
 }
 if(section==='2.4'){
  root.innerHTML='<div class="eyebrow">ACID–BASE LAB</div><h3>One pH step is a tenfold change.</h3><label for="ph-example">Example solution pH</label><input type="range" min="4" max="10" value="7" id="ph-example"><p id="ph-result" role="status"></p><p class="tiny">Compare equal additions of acid in water and a buffered solution. The buffer accepts some added hydrogen ions, limiting the pH change until its capacity is exceeded.</p>';
  const slider=root.querySelector('#ph-example');const draw=()=>{const p=+slider.value,relative=10**(7-p);root.querySelector('#ph-result').textContent='pH '+p+' · hydrogen-ion concentration is '+relative+' times that of pH 7.';};
  slider.oninput=draw;draw();return true;
 }
 return false;
}
