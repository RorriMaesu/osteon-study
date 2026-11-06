let serial=0;
const outline='M97 69 C79 75 60 61 64 42 C67 22 89 16 103 30 C111 20 132 18 140 30 C156 26 176 39 172 58 C171 75 155 87 140 92 C125 133 125 162 125 199 L130 282 C132 318 145 335 156 351 C170 349 183 368 175 385 C169 400 150 403 137 392 C126 406 102 406 96 391 C79 399 63 392 63 376 C63 360 79 349 91 350 C105 314 105 289 108 250 L110 172 C111 128 112 99 97 69 Z';
const fractureLines={transverse:'M103 213 L128 213',oblique:'M105 227 L126 199',spiral:'M107 195 C129 207 100 218 125 239',greenstick:'M106 207 L116 211 L108 217',comminuted:'M106 194 L122 203 L110 214 L126 223 M108 215 L117 228 L126 214 M114 200 L118 211',impacted:'M106 211 L112 203 L117 216 L124 205 L129 211',closed:'M105 208 L128 210',open:'M105 208 L128 210'};
export function fractureSVG(type='spiral',{id='diagram',label=false,hero=false,skinStatus='hidden'}={}){
const uid=id+'-'+(++serial),status=['open','closed'].includes(type)?type:skinStatus;
const open=status==='open',skin=status!=='hidden';
const tissue='M60 32Q48 210 65 397H172Q190 240 172 32Z';
const leftOpening=type==='greenstick';
const skinEdge=!open?tissue:leftOpening?'M56 200Q54 110 60 32H172Q190 240 172 397H65Q57 310 55 232':'M178 202Q176 116 172 32H60Q48 210 65 397H172Q181 308 179 235';
const fractureEdgeY={oblique:199,spiral:239,comminuted:223,impacted:211,transverse:213,open:210,closed:210}[type]??213;
const wound=leftOpening?'M56 200L79 205 110 205V218L79 222 55 232':`M178 202L160 210 124 ${fractureEdgeY-6}V${fractureEdgeY+7}L159 227 179 235`;
return `<svg class="bone-svg ${hero?'hero-bone':''}" viewBox="0 0 240 440" role="img" aria-labelledby="${uid}-title"><title id="${uid}-title">${label?type+' fracture':'Schematic long bone showing the fracture to classify'}</title><defs><linearGradient id="${uid}-bone" x1="0" x2="1"><stop stop-color="#ede9db"/><stop offset=".45" stop-color="#fffcf1"/><stop offset="1" stop-color="#d4d4c5"/></linearGradient><clipPath id="${uid}-clip"><path d="${outline}"/></clipPath></defs>
<g transform="${hero?'rotate(17 120 220)':''}">
${skin?`<path d="${tissue}" fill="#edc9b2" opacity=".72"/><path d="${skinEdge}" stroke="#9c5a4e" stroke-width="4" fill="none" data-skin-edge="${status}"/>`:''}
${open?`<path d="${wound}" fill="#723d47" stroke="#f0a694" stroke-width="2" data-wound-channel="true"/>`:''}
<path d="${outline}" fill="url(#${uid}-bone)" stroke="#748077" stroke-width="2"/><path d="M115 114 Q112 218 119 320" fill="none" stroke="#c4bd9e" stroke-width="10" opacity=".22"/>
<g clip-path="url(#${uid}-clip)" stroke="#c6bb9b" stroke-width="1" opacity=".58">${Array.from({length:9},(_,i)=>`<path d="M${69+i*10} 29 l35 40 m-31 -8 l40 -32 M${75+i*10} 358 l30 37 m-34 -8 l40 -28"/>`).join('')}</g>
<path class="fracture-line" d="${fractureLines[type]||''}" fill="none" stroke="#b64c3c" stroke-width="3.5" stroke-linecap="round"/>
${type==='comminuted'?'<path d="M110 213 l8 -6 5 11 -10 8Z" fill="#f4e7cd" stroke="#b64c3c" stroke-width="2"/>':''}
${type==='impacted'?'<path d="M155 180 v25 m-5 -6 5 6 5-6 M155 246 v-25 m-5 6 5-6 5 6" fill="none" stroke="#b64c3c" stroke-width="3"/>':''}</g></svg>`;
}
export const stageNames=['Fracture hematoma','Internal & external calli','Bony callus','Remodeling'];
export function repairSVG(stage='hematoma',{id='repair',label=false,targets=false}={}){
const uid=id+'-'+(++serial),n=['hematoma','callus','bony','remodeled'].indexOf(stage),isFinal=n===3;
return `<svg class="repair-svg" viewBox="0 0 360 320" role="img" aria-labelledby="${uid}-title"><title id="${uid}-title">${label?(stageNames[n]||'Bone repair'):'Schematic cross-section of a fracture repair stage'}</title>
<path d="${n>=2?'M107 25Q98 86 106 135L102 166Q97 236 107 294H146V25ZM214 25V294H253Q262 237 254 166L258 135Q267 85 253 25Z':'M107 25Q98 86 106 135L146 147V25ZM102 168Q97 236 107 294H146V178ZM214 25V141L258 135Q267 85 253 25ZM214 176V294H253Q262 237 254 168Z'}" fill="#e6e1cf" stroke="#6d7d70" stroke-width="2"/>
<path d="${n>=2?'M148 25H212V294H148Z':'M148 25H212V141L184 131 148 147ZM148 178L177 160 212 176V294H148Z'}" fill="#f5e8c5"/>
${n<1?'<path d="M101 139 152 149 184 134 213 155 257 142 L259 163 214 175 177 156 147 171 100 160Z" fill="#a3483e" opacity=".85"/><ellipse cx="180" cy="157" rx="96" ry="45" fill="#b96352" opacity=".25"/>':''}
${n===1?'<ellipse cx="180" cy="156" rx="105" ry="59" fill="#a7c4b3" opacity=".72"/><path d="M145 134Q180 116 215 134L215 183Q180 197 145 183Z" fill="#d4bc8b"/><path d="M104 143 147 154 184 140 213 163 255 151" fill="none" stroke="#818965" stroke-width="3"/>':''}
${n>=2?`<path d="M${n===2?'96':'103'} 105 Q79 161 101 213 L146 211 L214 210 L258 211 Q280 161 261 109Z" fill="#e4dcc0" stroke="#86927c" stroke-width="1.5"/>`:''}
${n>=1?`<g fill="none" stroke="#ae9471" stroke-width="2" opacity=".7">${Array.from({length:8},(_,i)=>`<path d="M${114+i*19} 121 l-14 62 m4 -55 23 44"/>`).join('')}</g>`:''}
<g class="repair-vessels" fill="none" stroke="#b15447" stroke-width="3"><path d="M177 294V${n===0?'194':'28'} M177 235l-27 -31 M177 246l27 -25 M177 87l-27 -29 M177 101l29 -40"/>${n>=1?'<path d="M177 187l-35 -24 M177 147l34 -22"/>':''}</g>
${targets?'<g class="diagram-markers"><circle cx="93" cy="155" r="14"/><text x="93" y="160">1</text><circle cx="180" cy="156" r="14"/><text x="180" y="161">2</text><circle cx="177" cy="87" r="14"/><text x="177" y="92">3</text></g>':''}
${isFinal?'<path d="M113 27v266 M247 27v266" fill="none" stroke="#c7c1a7" stroke-width="12" opacity=".7"/>':''}</svg>`;
}
export function anatomySVG({id='anatomy'}={}){const uid=id+'-'+(++serial);return `<svg class="anatomy-svg" viewBox="0 0 420 440" role="img" aria-labelledby="${uid}-title"><title id="${uid}-title">Long-bone cross-section with six numbered structures to identify</title><g transform="translate(80 0)"><path d="${outline}" fill="#ddd7bd" stroke="#64796a" stroke-width="2"/><path d="M112 112 Q105 216 111 326 L126 326 Q120 213 127 112Z" fill="#f0dc9d"/><g stroke="#ae9870" fill="none" stroke-width="1.5">${Array.from({length:8},(_,i)=>`<path d="M${80+i*10} 35 l20 40 m-22 -4 28 -29 M${82+i*9} 355 l18 38 m-20 -4 24 -29"/>`).join('')}</g><path d="M112 116V324" fill="none" stroke="#72947f" stroke-width="2"/></g><g class="diagram-markers"><path d="M81 54H179 M81 214H185 M81 382H175 M284 246H200 M284 313H209 M284 87H216" stroke="#60766a" stroke-width="1.5" fill="none"/>${[[76,54,1],[76,214,2],[76,382,3],[293,246,4],[293,313,5],[293,87,6]].map(([x,y,n])=>`<circle cx="${x}" cy="${y}" r="16"/><text x="${x}" y="${y+5}">${n}</text>`).join('')}</g></svg>`;}
export function diagram(q){if(!q.diagram)return '';if(q.diagram==='anatomy')return anatomySVG();return ['hematoma','callus','bony','remodeled'].includes(q.diagram)?repairSVG(q.diagram,{targets:q.diagramTargets}):fractureSVG(q.diagram);}
