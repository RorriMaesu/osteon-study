import {foundationsVisuals} from './visual-foundations.js';

const frame=(art,label)=>`<svg viewBox="0 0 480 240" role="img" aria-label="${label}">${art}</svg>`;
const text=(x,y,label)=>`<text x="${x}" y="${y}" text-anchor="middle">${label}</text>`;
const dot=(x,y,r,color)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${color}"/>`;
const arrow=(a,b,y,color='#a9dcc2')=>`<path d="M${a} ${y}H${b}m${b>a?-9:9} -7L${b} ${y}l${b>a?-9:9} 7" stroke="${color}" stroke-width="3" fill="none"/>`;

export function bondArt(scenario,step){
 if(scenario!==0||!step)return '';
 const ions=step===3;
 const sodium=dot(134,115,42,'#a56755')+text(134,121,ions?'Na⁺':'Na');
 const chlorine=dot(346,115,49,'#316576')+text(346,121,ions?'Cl⁻':'Cl');
 const electron=step===1?dot(180,115,7,'#ffe1a2'):step===2?dot(235,115,7,'#ffe1a2')+arrow(177,289,115):dot(312,135,7,'#ffe1a2');
 return frame(sodium+chlorine+electron+text(240,205,['','Neutral atoms','Transfer toward chlorine','Opposite ions attract'][step]),['','Neutral sodium and chlorine, with one sodium electron highlighted.','One electron is transferred from sodium to chlorine.','Sodium has a positive charge and chloride has a negative charge.'][step]);
}

export function transportArt(scenario,step){
 if(!step||scenario===5)return '';
 const vesicle=scenario===4,protein=step===2&&[1,2,3].includes(scenario);
 const membrane=vesicle&&step===2?'<path d="M223 45V94Q300 105 223 148V198M253 45V85Q338 110 253 154V198" fill="none" stroke="#89a69d" stroke-width="8"/>':'<rect x="218" y="45" width="44" height="153" rx="12" fill="#58786f"/><path d="M228 49V194M252 49V194" stroke="#99b7a9" stroke-width="4"/>';
 const route=protein?'<path d="M207 95Q240 79 273 95V153Q240 169 207 153Z" fill="#77548d" stroke="#ceb8e5" stroke-width="3"/>':'';
 const cargo=[['O₂','#99d7f5'],['Glucose','#ffbe92'],['Na⁺','#cba7f3'],['Na⁺ + glucose','#ffbe92'],['Particle','#f5b88f']][scenario];
 const left=scenario!==2;
 const flow=step===2&&!vesicle?(left?arrow(114,365,123):arrow(365,114,123)):'';
 const secondary=scenario===2&&step===2?arrow(128,352,168,'#ffbf91')+text(324,186,'K⁺ inward')+text(240,74,'ATP'):'';
 const particleX=vesicle&&step===2?245:left?92:388;
 return frame(text(105,26,'Outside')+text(375,26,'Cytosol')+membrane+route+flow+secondary+dot(particleX,123,14,cargo[1])+text(left?95:388,158,cargo[0]),`Membrane cross-section. ${cargo[0]} starts on the ${left?'outside':'cytosolic'} side. ${step===2?(vesicle?'A membrane pocket wraps around the particle.':'The diagram shows its direction across the membrane.'):'Predict its route.'}`);
}

export function nerveArt(scenario,step){
 if(!step)return '';
 if(scenario===1){
  const axon=(y,segments)=>`<path d="M52 ${y}H426" stroke="#edbb96" stroke-width="5"/>${segments.map(x=>`<rect x="${x}" y="${y-9}" width="65" height="18" rx="8" fill="#a4daca"/>`).join('')}`;
  return frame(text(240,27,'CNS · one oligodendrocyte, several segments')+axon(57,[82,155,228,301])+axon(87,[82,155,228,301])+dot(158,113,12,'#c3a9ea')+'<path d="M158 110L185 86M158 110L117 56" stroke="#c3a9ea" stroke-width="3"/>'+(step>=2?text(240,154,'PNS · one Schwann cell per segment')+axon(184,[82,155,228,301])+[115,188,261,334].map(x=>dot(x,174,4,'#7f638f')).join(''):'')+(step===3?text(240,222,'Gaps between segments are nodes'):''),'Comparison of CNS oligodendrocyte processes and separate PNS Schwann-cell internodes.');
 }
 const points=[[62,75],[135,122],[235,122],[371,122],[414,122]],selected=points[step-1];
 const cell='<path d="M129 122L78 122 47 84M78 122L53 154M108 103L72 63 43 53M72 63L62 42" stroke="#bd9bdc" stroke-width="6" fill="none" stroke-linecap="round"/><ellipse cx="115" cy="122" rx="31" ry="27" fill="#8d6bac"/><path d="M140 122H350q14 0 22 -14m-22 14q14 0 22 14M421 104q-18 18 0 35" stroke="#bd9bdc" stroke-width="8" fill="none"/>';
 const transmit=step===5?[385,397,404].map((x,i)=>dot(x,118+i*4,3,'#ffc38e')).join(''):'';
 return frame(cell+dot(selected[0],selected[1],10,'#f6c18d')+transmit+text(240,211,['','Dendritic input','Axon initial segment','Axon propagation','Synaptic terminal','Transmit across the cleft'][step]),'Neuron showing the active stage from dendritic input to communication across the synapse.');
}

export function growthPlateArt(scenario,step){
 if(scenario!==0||!step)return '';
 const zones=[['#6996ad',110,54],['#6f90bb',164,59],['#8d80b5',223,63],['#b994a4',286,37]];
 const closed=step===5;
 const growth=closed?'<path d="M200 60V172" stroke="#9f7c75" stroke-width="3" stroke-dasharray="5 4"/>':zones.map(([color,x,w],i)=>`<rect x="${x}" y="65" width="${w-2}" height="102" fill="${color}" stroke="${i===step-1?'#fff0ba':'none'}" stroke-width="3"/>${Array.from({length:9},(_,j)=>dot(x+9+j%3*(w-17)/3,87+Math.floor(j/3)*27,3+i,'#e6c9ed')).join('')}`).join('');
 return frame(`<rect x="53" y="60" width="377" height="112" rx="34" fill="#d5b197"/><path d="M83 63Q44 76 56 138Q62 161 84 168" fill="none" stroke="#98d7ed" stroke-width="11"/>`+growth+text(83,39,'Epiphysis')+text(359,39,'Metaphysis')+text(82,207,'Joint cartilage')+text(245,207,closed?'Epiphyseal line':'Growth plate')+(closed?'':arrow(320,402,116,'#583846')),closed?'The growth plate has closed. Articular cartilage remains at the joint surface.':'Long bone cutaway. Articular cartilage covers the epiphyseal surface. The growth plate lies between epiphysis and metaphysis.');
}

export function boneScaleArt(scenario,step){
 if(!step)return '';
 if(step<=2)return frame(foundationsVisuals['6.3'].art(scenario===1?0:step===1?2:1),'Long bone section showing the emphasized tissue.');
 const osteon=Array.from({length:4},(_,i)=>`<circle cx="235" cy="107" r="${24+i*17}" fill="none" stroke="#c5ac90" stroke-width="8"/>`).join('');
 const vessels=step===3?dot(235,107,10,'#fbab8c'):step===4?dot(235,107,10,'#fbab8c')+`<path d="M238 107H410" stroke="#fbab8c" stroke-width="8"/><path d="M240 91h165" stroke="#fff1b8" stroke-width="2" stroke-dasharray="4 4"/>`:'';
 if(scenario===1)return frame('<path d="M95 55L148 117 212 66 269 157 379 83M105 188l43-71 111-3 83 65" stroke="#d5b197" stroke-width="18" fill="none" stroke-linecap="round"/>'+dot(266,153,5,'#593b53')+text(240,218,'Trabeculae surrounded by marrow spaces'),'A branching network of trabeculae with a highlighted osteocyte in the matrix.');
 if(step===5)return frame(`<path d="M138 62L329 158M141 162L335 64M114 111H368M235 36v156" stroke="#8ccbbf" stroke-width="3"/>`+dot(235,111,24,'#a98bb8')+dot(235,111,11,'#ead0fa')+text(240,219,'Osteocyte in a lacuna · radiating canaliculi'),'Enlarged osteocyte in a lacuna with processes radiating into canaliculi.');
 return frame(osteon+vessels+text(240,218,step===3?'Osteon · central canal':'Perforating canal runs across the osteon'),'Simplified view of concentric lamellae and vascular spaces in compact bone.');
}
