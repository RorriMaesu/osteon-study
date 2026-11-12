import {setDiagramLearningContext} from './learning-context.js';

// Original qualitative drawings and prompts. They teach relationships, not a
// claim that every named muscle has been segmented or verified on the 3D mesh.
export const fasciclePatterns=['Parallel','Fusiform','Convergent','Circular','Unipennate','Bipennate','Multipennate'];
const cases=(...rows)=>rows.map(([id,prompt,options,key,answer,visual])=>({id,prompt,options,key,answer,visual}));
export const chapter11Cases={
 '11.1':cases(
  ['role-lift','A person lifts a cup by flexing the elbow. For that action, the elbow flexors act primarily as…',['Agonists','Antagonists','Passive tendons'],0,'An agonist contributes to the specified movement. The same muscle can play another role in a different task.'],
  ['role-fix','During a pull, one muscle holds the scapula steady so an arm muscle has a stable base. What role does the scapular muscle perform?',['Fixator','Prime mover of the arm','Antagonist to the intended pull'],0,'A fixator is a stabilizing synergist. Stabilization can require active force without visible movement.'],
  ['role-lower','The elbow extends while a weight is lowered slowly. What can the active elbow flexors be doing?',['Lengthening to control descent','Shortening to produce the extension','Relaxing completely during descent'],0,'An external load can extend the elbow while active flexors lengthen eccentrically. Joint direction alone does not identify contraction type.'],
  ['role-partner','A wrist flexor also tends to move the hand toward one side. A partner cancels that sideways component while retaining flexion. The partner is acting as…',['A synergist','An antagonist to all wrist flexion','A fixator of the elbow'],0,'A synergist may neutralize an unwanted component while assisting the intended action.'],
  ['architecture-force','Two similarly sized muscles differ in architecture. Why can pennation allow substantial force despite limited excursion?',['It can pack more fibers in parallel','Its tendons actively contract','Every fiber spans the whole muscle length'],0,'More physiological cross-sectional area can support greater force. Fiber angle and length also matter; outline shape alone does not specify an exact force.']) ,
 '11.3':cases(
  ['neck-side','The right sternocleidomastoid acts unilaterally. Which paired prediction fits?',['Face left; neck bends right','Face right; neck bends left','Both directions must be left'],0,'Its rotation contribution is contralateral and its lateral-flexion contribution ipsilateral. Right always names the specimen’s side.'],
  ['neck-back','Which pairing distinguishes short segmental back muscles?',['Interspinales: spinous-to-spinous; intertransversarii: transverse-to-transverse','Interspinales: transverse-to-transverse; intertransversarii: spinous-to-spinous','Both span from lumbar vertebrae to the skull'],0,'Attachment relationships explain the names and their local stabilizing roles.'],
  ['hyoid-fixed','The hyoid is stabilized while a suprahyoid muscle pulls on the mandible. What can change compared with swallowing?',['The mandible can be depressed','The mandible must be elevated','The hyoid must always rise'],0,'Which end is held steady changes the movement produced. Origin/insertion names are conventional anatomical labels.'],
  ['eye-gaze','To isolate the vertical action of superior oblique, compare downward movement when the eye starts…',['Adducted','Abducted','In primary gaze only'],0,'Superior oblique depresses an adducted eye. Gaze position changes the expression of vertical and torsional components.'],
  ['tongue-shape','The tongue flattens without needing a new bony attachment. Which organization explains this?',['Intrinsic fibers change tongue shape','Only extrinsic fibers can change tongue shape','Suprahyoid fibers lie within the tongue'],0,'Intrinsic fibers lie within the tongue. Extrinsic attachments connect it to surrounding structures; coordinated activity normally combines both.']) ,
 '11.4':cases(
  ['breath','The diaphragm contracts during quiet inspiration. Select the causal sequence.',['Dome descends → thoracic volume rises → air enters','Dome rises → thoracic volume falls → air enters','Dome descends → thoracic volume falls → air leaves'],0,'Contractile peripheral fibers pull on the central tendon. Thoracic expansion supports lower lung pressure relative to the atmosphere.'],
  ['wall-rotation','During a leftward trunk rotation, which oblique pair contributes?',['Right external and left internal oblique','Left external and right internal oblique','Both sides of transversus alone'],0,'External oblique contributes to contralateral rotation; internal oblique to ipsilateral rotation. Other muscles stabilize the task.'],
  ['diaphragm-openings','Which structure passes through the diaphragm’s central tendon?',['Inferior vena cava','Esophagus','Aorta'],0,'The caval opening lies in the central tendon. The esophageal hiatus is muscular; the aortic passage is posterior between the crura.'],
  ['pelvic-sling','Which relationship describes puborectalis?',['A sling behind the anorectal junction','A circular ring only at the anal opening','A sheet over the obturator foramen'],0,'Puborectalis is a levator-ani component that helps maintain the anorectal bend. The external anal sphincter surrounds the anal canal lower down.','pelvic'],
  ['pelvic-relax','For defecation, how does the puborectalis relationship change?',['The sling relaxes and the bend becomes less acute','It must tighten maximally around the junction','It remains fully contracted while only the canal opens'],0,'Relaxation helps straighten the anorectal angle. This relationship diagram does not reproduce a specimen’s dimensions or provide diagnosis.','pelvic'],
  ['pelvic-components','In a female specimen, compressor urethrae and sphincter urethrovaginalis belong to which functional region?',['External urethral sphincter complex','The superficial perineal muscle layer','The entire levator ani'],0,'They are deep perineal sphincter components. Do not confuse them with the more superior pelvic support floor.']) ,
 '11.5':cases(
  ['shoulder-base','The arm rises overhead. Why is deltoid contraction alone an incomplete explanation?',['The scapula rotates and cuff muscles stabilize the humeral head','The scapula remains fixed at all angles','Teres major is the only cuff muscle'],0,'Serratus anterior and trapezius help upwardly rotate the scapula while cuff muscles help keep the humeral head centered.'],
  ['finger-depth','A tendon reaches the distal phalanx of the index finger. Which action best distinguishes profundus from superficialis?',['Distal interphalangeal flexion','Only proximal interphalangeal flexion','Metacarpophalangeal extension with interphalangeal flexion'],0,'Profundus reaches distal phalanges. Superficialis splits to attach to middle phalanges and emphasizes proximal interphalangeal flexion.'],
  ['carpal-route','Which set belongs inside the carpal tunnel?',['Median nerve + 4 FDS + 4 FDP + 1 FPL tendons','All wrist flexor tendons and the ulnar nerve','Median nerve + FCR and palmaris longus tendons'],0,'Flexor carpi radialis runs separately and palmaris longus is superficial. A nearby tendon is not necessarily inside the tunnel.'],
  ['rotation-joint','During pronation, which relationship changes?',['Radius crosses ulna at the radioulnar joints','Ulna twists around a fixed carpal bone','The elbow hinge alone produces the rotation'],0,'Forearm pronation/supination occurs at radioulnar articulations. Elbow flexion/extension is a different action.'],
  ['hand-axis','When the ring finger moves away from the middle-finger axis, which intrinsic group contributes?',['Dorsal interossei','Palmar interossei','Lumbricals'],0,'Dorsal interossei abduct relative to the middle-finger axis. Palmar interossei adduct. The foot uses a different axis.']) ,
 '11.6':cases(
  ['stance-hip','Standing on the right leg, which muscles help prevent the unsupported left pelvis from dropping?',['Right gluteus medius/minimus','Left gluteus medius/minimus alone','Right hip adductors alone'],0,'The stance-side hip abductors generate a stabilizing moment. No isolated muscle explains every part of standing balance.'],
  ['hamstring-head','Which statement distinguishes the two biceps-femoris heads?',['The short head crosses the knee but not the hip','Both originate on the ischial tuberosity','The short head crosses the hip but not the knee'],0,'The short head begins on the femur. The long head crosses hip and knee; do not assign its hip-extension action to the short head.'],
  ['tendon-chain','Trace knee-extensor force through the patella. Which order is correct?',['Quadriceps → quadriceps tendon → patella → patellar ligament → tibia','Quadriceps → patellar ligament → femur → patella','The patellar ligament contracts to pull the muscle'],0,'The proximal tendon and distal ligament transmit muscle force. Neither contracts independently.'],
  ['foot-fourth','The fourth plantar layer includes which muscle groups?',['Plantar and dorsal interossei','Only flexor digitorum brevis','Only quadratus plantae'],0,'Both interosseous groups lie near/between metatarsals. The original textbook artwork shows only plantar layers one through three.','foot'],
  ['foot-axis','The third toe moves toward the second-toe axis. Which group contributes?',['Plantar interossei','Dorsal interossei','Abductor hallucis'],0,'Plantar interossei adduct toes 3–5 toward digit 2. Dorsal interossei abduct toes 2–4 away from that axis.','foot'],
  ['foot-support','The plantar aponeurosis supports the arch. What kind of structure is it?',['A connective-tissue sheet','A contractile intrinsic muscle','A long digital flexor tendon'],0,'Its tension contributes to arch support; it does not contract. Intrinsic and extrinsic muscles also support foot function.','foot'])
};

const e=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const svg=(label,body)=>`<svg viewBox="0 0 560 260" role="img" aria-label="${e(label)}">${body}</svg>`;
const line=(x1,y1,x2,y2,color='#b1dac5',width=4)=>`<path d="M${x1} ${y1}L${x2} ${y2}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round"/>`;
const label=(x,y,t)=>`<text x="${x}" y="${y}" fill="#e9f2ea" font-size="17" text-anchor="middle">${e(t)}</text>`;
export function fasciclePatternSVG(index){
 let body='';
 if(index===0||index===1){for(let i=0;i<7;i++){const y=70+i*20;body+=index===0?line(100,y,460,y):`<path d="M100 130 Q280 ${130+(i-3)*45} 460 130" fill="none" stroke="#b1dac5" stroke-width="4"/>`;}if(index===0)body+=line(100,70,100,190,'#eaa17b',5)+line(460,70,460,190,'#eaa17b',5);body+=line(65,130,100,130,'#eaa17b',8)+line(460,130,495,130,'#eaa17b',8);}
 if(index===2){for(let i=0;i<9;i++)body+=line(110,40+i*22,430,130);body+=line(430,130,490,130,'#eaa17b',9);}
 if(index===3){for(let i=0;i<5;i++)body+=`<ellipse cx="280" cy="130" rx="${70+i*14}" ry="${40+i*12}" fill="none" stroke="#b1dac5" stroke-width="4"/>`;}
 if(index===4||index===5){body+=line(90,130,475,130,'#eaa17b',9);for(let i=0;i<7;i++){body+=line(115+i*45,50,175+i*45,130);if(index===5)body+=line(115+i*45,210,175+i*45,130);}}
 if(index===6){body+=line(450,130,500,130,'#eaa17b',9);for(const y of [55,130,205]){body+=line(100,y,425,y,'#eaa17b',7)+line(425,y,450,130,'#eaa17b',6);for(let i=0;i<6;i++)body+=line(105+i*48,y-25,140+i*48,y)+line(105+i*48,y+25,140+i*48,y);}}
 return svg('Unlabeled schematic of fascicle pattern '+(index+1)+'. Green lines represent fiber paths and peach lines tendinous attachments.',body);
}
export function pelvicRelationshipSVG(){
 return svg('Conceptual side-view relationship. Anterior is left. A puborectalis sling passes behind the anorectal bend; the external anal sphincter is lower around the anal canal. Not a specimen or a precise muscle outline.',
  `<path d="M270 30V108Q270 130 315 160L325 222" stroke="#e9f2ea" stroke-width="30" fill="none"/><path d="M120 125Q310 95 330 155Q285 185 120 145" stroke="#eaa17b" stroke-width="13" fill="none"/><ellipse cx="323" cy="210" rx="40" ry="18" stroke="#b1dac5" stroke-width="10" fill="none"/>${label(80,35,'Anterior ←')}${label(425,35,'→ Posterior')}${label(115,105,'Pubic attachment')}${label(430,120,'Anorectal bend')}${label(420,185,'External sphincter')}${label(170,205,'Sling behind bend')}`);
}
export function fourthPlantarLayerSVG(group='plantar'){
 const xs=[115,205,285,365,440];
 const digits=xs.map((x,i)=>`<rect x="${x-13}" y="${75+i*5}" width="26" height="110" rx="11" fill="#d6e7d5"/>${label(x,55,String(i+1))}`).join('');
 const plantar=group==='plantar',places=plantar?[267,347,422]:[160,245,325,405];
 return svg('Original relationship diagram, schematic left foot viewed from the sole. Digit 2 is the axis. '+(plantar?'Three plantar interossei on toes 3–5 adduct toward the second toe.':'Four dorsal interossei abduct toes 2–4 away from the second-toe axis.')+' Colored bars are schematic locations, not exact muscle outlines.',
  `${digits}<path d="M205 65V220" stroke="#eaa17b" stroke-width="3" stroke-dasharray="6 5"/>${places.map(x=>line(x,105,x,165,'#eaa17b',9)).join('')}${label(280,24,'Left sole · fourth-layer relationships')}${label(205,245,'Axis: toe 2')}${label(350,218,plantar?'3 plantar · adduct':'4 dorsal · abduct')}`);
}

export function renderChapter11Practice(root,section,{architecture=false}={}){
 let index=0,selected=null,footGroup='plantar';
 const items=architecture?fasciclePatterns.map((name,i)=>({id:'pattern-'+i,prompt:'Which fascicle arrangement best matches the drawing?',options:fasciclePatterns,key:i,answer:name+'. '+(i===1?'This is the tapered, spindle-shaped form of a parallel arrangement.':i>=4?'Fibers approach tendinous structures obliquely. Compare the number of sides and branches.':i===2?'Fiber paths converge from a broad attachment.':i===3?'The fiber paths surround an opening.':'The fibers follow the long axis.'),visual:'architecture'})):chapter11Cases[section]||[];
 function render(focus){
  const item=items[index];if(!item)return;
  const picture=item.visual==='architecture'?fasciclePatternSVG(index):item.visual==='pelvic'?pelvicRelationshipSVG():item.visual==='foot'?fourthPlantarLayerSVG(footGroup):'';
  const ordered=item.options.map((option,i)=>({option,i}));if(!architecture){const split=(index+1)%ordered.length;ordered.push(...ordered.splice(0,split));}
  root.innerHTML=`<div class="control-row"><button type="button" data-case-prev ${index===0?'disabled':''}>←</button><span>${index+1} / ${items.length}</span><button type="button" data-case-next ${index===items.length-1?'disabled':''}>Next →</button></div>${picture?`<div class="muscle-lab-visual">${picture}</div>`:''}${item.visual==='foot'?`<div class="control-row"><button type="button" data-foot-group="plantar" aria-pressed="${footGroup==='plantar'}">Plantar group</button><button type="button" data-foot-group="dorsal" aria-pressed="${footGroup==='dorsal'}">Dorsal group</button></div>`:''}<p class="flow-question">${e(item.prompt)}</p><div class="control-row">${ordered.map(({option,i})=>`<button type="button" data-case-answer="${i}" aria-pressed="${selected===i}">${e(option)}</button>`).join('')}</div><p role="status" class="muscle-lab-feedback">${selected===null?'Make a prediction, then select an answer.':(selected===item.key?'That fits. ':'Compare the relationship. ')+e(item.answer)}</p><p class="tiny">Guided practice · not an exam score.${picture?' Original schematic; not to scale and not a specimen-identification target.':''}${item.visual==='foot'?' Both interosseous groups occupy the fourth layer; these bars indicate location only, not individual muscle shapes.':''}${item.visual==='pelvic'?' Puborectalis belongs to levator ani; the external anal sphincter is a separate structure.':''}</p>`;
  if(item.visual==='pelvic'||item.visual==='foot')root.insertAdjacentHTML('beforeend',`<p class="tiny">Anatomy reference: <a href="${item.visual==='foot'?'https://anatomy.med.utah.edu/diganat/PT/2014_lecture/L12_foot_ankle.pdf':'https://www.stritch.luc.edu/lumen/meded/grossanatomy/homepage/muscletables/pelvismuscletable.pdf'}" target="_blank" rel="noopener noreferrer">${item.visual==='foot'?'University of Utah · fourth plantar layer':'Loyola University · pelvic muscle relationships'} ↗</a>. Drawing by Osteon.</p>`);
  const publish=()=>setDiagramLearningContext({id:'ch11-practice-'+item.id,title:architecture?'Fascicle architecture':'Anatomical relationships',reference:section,state:{case:index+1,mode:selected===null?'predict':'feedback',...(item.visual==='foot'?{displayedGroup:footGroup}:{})},question:item.prompt,hint:'Identify the fixed segment, viewing direction or neighboring structures before naming an action.',answer:item.answer,facts:[item.answer],prediction:selected===null?'':item.options[selected]});
  root.querySelector('[data-case-prev]').onclick=()=>{index--;selected=null;render('[data-case-prev]');};
  root.querySelector('[data-case-next]').onclick=()=>{index++;selected=null;render('[data-case-next]');};
  root.querySelectorAll('[data-case-answer]').forEach(button=>button.onclick=()=>{selected=+button.dataset.caseAnswer;render('[data-case-answer="'+selected+'"]');});
  root.querySelectorAll('[data-foot-group]').forEach(button=>button.onclick=()=>{footGroup=button.dataset.footGroup;render('[data-foot-group="'+footGroup+'"]');});
  publish();if(focus)(root.querySelector(focus+':not(:disabled)')||root.querySelector('[data-case-answer]'))?.focus();
 }
 render();
}

export function muscleCardMatches(card,query){
 return [card.name,card.action,card.location,...card.aliases,...(card.members||[])].join(' ').toLowerCase().includes(query.trim().toLowerCase());
}
export function muscleNameClue(card){
 const names=[card.name,...card.aliases].map(name=>name.toLowerCase());
 return [card.location,card.action,card.origin,card.insertion].filter(value=>names.every(name=>!value.toLowerCase().includes(name))).slice(0,3).join(' ');
}
export function figureTargetForCard(card,targets){
 const explicit=targets[card.figureTarget];
 if(explicit&&card.figures.includes(explicit.figure))return [card.figureTarget,explicit];
 return Object.entries(targets).find(([,target])=>card.figures.includes(target.figure)&&[card.name,...card.aliases].some(name=>[target.name,...target.aliases].some(value=>name.toLowerCase()===value.toLowerCase())));
}
