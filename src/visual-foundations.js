const label=(x,y,t)=>`<text x="${x}" y="${y}" text-anchor="middle" fill="#e1efe5" font-size="15">${t}</text>`;
const line=(x,y,dx,dy,color='#a9dcc2')=>`<path d="M${x} ${y}l${dx} ${dy}" stroke="${color}" stroke-width="4" stroke-linecap="round"/>`;
const dot=(x,y,r,color='#9ed9ef')=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${color}"/>`;
const box=(x,y,w,h,c='#244049')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="9" fill="${c}"/>`;
const arrow=(x,y,w=56,color='#ffbf91')=>line(x,y,w,0,color)+line(x+w-10,y-8,10,8,color)+line(x+w-10,y+8,10,-8,color);
const loop=(warm)=>`<path d="M116 68Q230 7 357 70M357 179Q235 242 116 181" stroke="#7da99a" stroke-width="3" fill="none"/><path d="M344 54l13 16-20 3M130 196l-14-15 20-4" fill="none" stroke="#7da99a" stroke-width="3"/>`+
 box(31,80,134,85)+box(315,80,134,85)+label(98,115,'Stimulus')+label(98,140,warm?'Contractions':'Temperature ↑')+
 label(382,115,'Response')+label(382,140,warm?'Oxytocin ↑':'Heat loss ↑')+label(240,128,warm?'Amplifies':'Opposes');
function anatomy(i){
 const closed=i===2;
 return `<path d="M122 107C88 16 392 16 358 107L344 195Q240 252 136 195Z" fill="#573747" stroke="#e799a4" stroke-width="3"/><path d="M122 107H155M325 107H358" stroke="#e799a4" stroke-width="5"/>
 <path class="valve-leaflet" style="--valve-start:${i===1?-53:0}deg;--valve-angle:${closed?-53:0}deg;transform-origin:155px 107px" d="M155 107Q183 139 183 193"/><path class="valve-leaflet" style="--valve-start:${i===1?53:0}deg;--valve-angle:${closed?53:0}deg;transform-origin:325px 107px" d="M325 107Q297 139 297 193"/>`+
 (i===1?'<path d="M240 76v92m-10-11 10 11 10-11" stroke="#9ed9ef" stroke-width="4" fill="none"/>':i===2?'<path d="M240 181v-38m-9 9 9-9 9 9" stroke="#ffbf91" stroke-width="4" fill="none"/>':line(183,149,38,25)+label(255,183,'Leaflets'))+
 label(240,52,'Left atrium')+label(240,214,'Left ventricle');
}
function imaging(i){
 const frames=['X-ray projection','CT cross-section','MRI soft tissue','Ultrasound echo','PET tracer uptake'];
 const beam=i===0?Array.from({length:7},(_,n)=>line(72,65+n*17,140,0,'#f6c392')).join(''):'';
 const scan=i===1||i===2?dot(240,116,70,'#42636a')+dot(240,116,55,i===1?'#99b0ad':'#576d92')+dot(227,116,24,i===1?'#d9e1d0':'#acb9da')+dot(260,113,16,'#42515f'):'';
 const us=i===3?box(198,37,84,28,'#b9ddd2')+`<path d="M222 65L145 195H335L258 65Z" fill="#2d4e59"/><path d="M169 160q58-31 140 0" fill="none" stroke="#b1e1e1" stroke-width="5"/>`:'';
 const pet=i===4?dot(240,120,69,'#393c62')+dot(252,102,34,'#c57287')+dot(252,102,19,'#ffd08a')+dot(213,147,12,'#a879c0'):'';
 return beam+(i===0?box(226,51,35,130,'#d4ded5')+box(302,42,23,148,'#567783'):'')+scan+us+pet+label(240,222,frames[i]);
}
function chemistry(i){
 const names=['Ionic','Nonpolar covalent','Polar covalent','Hydrogen bond'];
 const join=(x,y,t,r,c)=>dot(x,y,r,c)+`<text x="${x}" y="${y+6}" text-anchor="middle" fill="#112832" font-weight="700" font-size="18">${t}</text>`;
 const dotted=(x,y,x2,y2)=>`<path d="M${x} ${y}L${x2} ${y2}" stroke="#ffbf91" stroke-width="4" stroke-dasharray="5 7"/>`;
 let drawing;
 if(i===0)drawing=join(152,111,'Na⁺',39,'#ffbf91')+join(326,111,'Cl⁻',49,'#9ed9ef')+dotted(197,111,271,111)+label(241,180,'Opposite charges attract');
 else if(i===3)drawing=line(130,120,52,-42)+line(130,120,52,42)+line(350,120,-52,-42)+line(350,120,-52,42)+dotted(198,78,315,115)+join(130,120,'O',32,'#f08c94')+join(350,120,'O',32,'#f08c94')+[[182,78],[182,162],[298,78],[298,162]].map(([x,y])=>join(x,y,'H',18,'#9ed9ef')).join('');
 else drawing=box(137,88,205,49,'#376474')+join(149,112,i===1?'H':'Hδ⁺',i===1?40:32,'#9ed9ef')+join(330,112,i===1?'H':'Clδ⁻',i===1?40:55,'#9ed9ef')+dot(i===1?230:263,104,5,'#ffbf91')+dot(i===1?250:278,122,5,'#ffbf91')+label(240,185,i===1?'Equal sharing':'Unequal sharing');
 return drawing+label(240,223,names[i]);
}
function reactions(i){
 if(i>=4){
  const end=i===4?155:87;
  return `<path d="M55 178H429M55 178V35" fill="none" stroke="#76938c" stroke-width="2"/><path d="M70 126H115C155 126 155 58 225 58S287 ${end} 342 ${end}H408" fill="none" stroke="#ffbf91" stroke-width="4"/>`+label(238,215,'Reaction progress')+label(119,113,'Reactants')+label(375,end-12,'Products');
 }
 const beads=(x,y,cs)=>cs.map((c,j)=>dot(x+j*31,y,17,c)).join('');
 if(i===3)return `<path d="M64 197H438M64 197V31" stroke="#aac9c0" stroke-width="2" fill="none"/><path d="M74 160H121C156 160 173 49 222 49S271 119 343 119H419" stroke="#ffbf91" stroke-width="4" fill="none"/><path d="M74 160H121C157 160 174 96 222 96S275 119 343 119H419" stroke="#9ed9ef" stroke-width="4" fill="none" stroke-dasharray="7 5"/><path d="M222 53V155m-5-97 5-5 5 5m-10 92 5 5 5-5M411 123v33m-5-28 5-5 5 5m-10 23 5 5 5-5M121 160H422" stroke="#c7dbd2" stroke-width="1.5" fill="none"/>`+label(246,228,'Reaction progress')+label(104,184,'Reactants')+label(363,105,'Products')+label(250,79,'Eₐ')+label(381,145,'ΔG')+`<g transform="rotate(-90 32 113)">${label(32,113,'Free energy')}</g>`;
 const [left,right]=[[[['#9ed9ef'],['#ffbf91']],[['#9ed9ef','#ffbf91']]],[[['#9ed9ef','#ffbf91']],[['#9ed9ef'],['#ffbf91']]],[[['#9ed9ef','#ffbf91'],['#a9dcc2','#f08c94']],[['#9ed9ef','#a9dcc2'],['#ffbf91','#f08c94']]]][i];
 return left.map((g,n)=>beads(90,95+n*54,g)).join('')+arrow(205,121,68)+right.map((g,n)=>beads(345,95+n*54,g)).join('')+label(240,216,['Synthesis','Decomposition','Exchange'][i]);
}
function skin(i,kind){
 if(kind==='depth'){
  const layers=[['Epidermis','#d7a395',32,30],['Dermis','#b77180',62,52],['Hypodermis','#bf9a74',114,37],['Deep fascia','#9eacb7',151,21],['Muscle','#c8877c',172,34],['Bone','#ded4b8',206,27]];
  const tissue=layers.map(([name,color,y,h])=>box(74,y,332,h-1,color)+label(320,y+h/2+5,name).replace('#e1efe5','#14282e')).join('');
  if(i===4)return tissue+`<path d="M104 33Q144 68 182 33" stroke="#f1bcc3" stroke-width="8" fill="none"/>`+label(144,94,'Scar');
  const bottom=[49,88,114,221][i];
  return tissue+`<path d="M102 32H189L181 ${bottom-4}Q145 ${bottom+4} 110 ${bottom-4}Z" fill="#572d40" stroke="#ffe0a6" stroke-width="2"/>`;
 }
 if(kind==='layers'&&i===4){
  const names=['Corneum','Lucidum','Granulosum','Spinosum','Basale'],colors=['#e5b5a0','#d7d6b0','#ac8f99','#996d86','#705f85'];
  return names.map((n,j)=>box(76,29+j*36,328,34,colors[j])+label(241,51+j*36,n).replace('#e1efe5',j<3?'#16262f':'#f6f0ee')).join('')+label(240,230,'Lucidum is present in thick skin');
 }
 const layers=[['Epidermis','#d7a395',48],['Dermis','#ac6676',67],['Hypodermis','#af8764',43],['Deep fascia','#8d9ca5',22]];
 let y=38;
 const artwork=layers.map(([name,c,h],j)=>{
  const out=box(62,y,352,h-2,c)+label(321,y+h*.63,name).replace('#e1efe5','#14282e')+(kind==='layers'&&j===i?`<rect x="61" y="${y-1}" width="354" height="${h}" rx="9" fill="none" stroke="#ffdc9c" stroke-width="4"/>`:'');y+=h;return out;
 }).join('');
 if(kind==='layers')return artwork;
 return artwork+`<path d="M94 123q23-20 46 0t46 0 46 0" fill="none" stroke="${i===0?'#ffada5':'#9ed9ef'}" stroke-width="${i===0?13:5}"/>`+
 (i===0?dot(128,23,7)+dot(165,18,5)+line(128,32,0,-12,'#9ed9ef')+line(165,30,0,-12,'#9ed9ef'):'')+label(166,160,i===0?'Vessels dilate':'Vessels constrict');
}
function accessory(i){
 if(i===0)return box(85,59,312,119,'#a96576')+
  `<path d="M148 37L193 152Q206 187 227 164L191 59" fill="#694956" stroke="#ffd0a7" stroke-width="5"/><path d="M181 94L121 119" stroke="#ffbf91" stroke-width="7"/><path d="M188 84Q230 72 239 102Q214 127 192 107" fill="#dba78b"/>`+label(240,225,'Hair follicle with associated structures');
 if(i===1)return `<path d="M88 123Q125 80 193 86H365Q398 96 399 123L366 169H109Z" fill="#a96576"/><path d="M146 95Q228 73 367 87L377 103H157Z" fill="#e5c2b0"/>`+dot(164,111,10,'#ffbf91')+arrow(202,63,99)+label(240,220,'Nail matrix supplies cells to the plate');
 const gland=`<path d="M209 159q-30-18 5-32q30 11-5 31q-27 25 11 28q21-7 6-24q-12-10-4-25" fill="none" stroke="#9ed9ef" stroke-width="6"/>`;
 return box(75,65,326,132,'#a96576')+(i===3?`<path d="M264 32l54 152" stroke="#382f42" stroke-width="16"/>`:'')+gland+
 (i===2?line(213,127,0,-62,'#9ed9ef'):strokeGland())+label(240,229,i===2?'Eccrine duct opens on the skin surface':'Apocrine duct opens into a hair follicle');
 function strokeGland(){return `<path d="M214 127Q222 104 292 111" fill="none" stroke="#9ed9ef" stroke-width="6"/>`;}
}

function longBone(i){
 const outline='M65 118Q49 85 84 68Q114 63 138 91H342Q366 63 397 68Q430 85 415 118Q433 148 396 163Q365 164 342 141H138Q112 165 84 163Q53 153 65 118Z';
 const core=`<path d="${outline}" fill="#bdab94" stroke="#ece2cf" stroke-width="6"/><path d="M147 110H332V128H147Z" fill="#5f5961"/>`;
 const ends=[91,390].map(x=>`<path d="M${x-19} 93l38 39m-37-15 37 28m-27 6 22-55m-39 32 42-22" fill="none" stroke="#684d57" stroke-width="4"/>`).join('');
 const highlights=[dot(98,117,8,accentBone)+dot(382,117,8,accentBone),line(151,91,178,0,accentBone)+line(151,142,178,0,accentBone),line(160,119,160,0,'#ffd18f'),line(148,84,185,0,accentBone),line(223,159,38,-48,accentBone)];
 return core+ends+highlights[i]+label(240,217,['Epiphyses and trabecular bone','Compact bone around the shaft','Medullary cavity','Periosteum at the outer shaft','Nutrient vessel enters the shaft'][i]);
}
const accentBone='#ff925f';

function bone(i){
 const mark=(x,y)=>dot(x,y,14,'#ffbf91');
 const art=[
  box(99,103,280,45,'#d6ddd3')+line(111,125,256,0,'#9ba9a1')+dot(103,125,36,'#d6ddd3')+dot(374,125,36,'#d6ddd3'),
  `<path d="M135 85Q209 84 284 129L315 169Q221 156 134 130Z" fill="#d6ddd3"/>`,
  box(189,75,103,103,'#d6ddd3')+line(194,102,91,0,'#a5aeb1')+line(194,148,91,0,'#a5aeb1'),
  `<path d="M123 109L180 94L210 65L263 71L290 99L357 110L338 130L284 135L252 187L227 190L203 137L136 134Z" fill="#d6ddd3"/>`,
  `<path d="M102 90Q241 113 373 90M102 157Q241 139 373 157" fill="none" stroke="#809fa0" stroke-width="8"/>`+mark(241,124)
 ];
 return art[i]+label(240,222,['Long','Flat','Short','Irregular','Sesamoid in a tendon'][i]);
}
function ossify(i){
 if(i===0)return Array.from({length:13},(_,n)=>dot(90+n*24,92+Math.sin(n)*23,7,'#a9dcc2')).join('')+line(94,140,293,0,'#ffbf91')+label(240,198,'Bone develops directly in mesenchyme');
 const model=dot(110,113,42,'#9ed9ef')+dot(370,113,42,'#9ed9ef')+box(104,83,275,60,'#9ed9ef');
 const center=box(152,88,175,50,'#ddb798');
 return model+(i>1?center:'')+(i===3?dot(110,113,20,'#e0bb9f')+dot(370,113,20,'#e0bb9f')+line(146,91,0,43,'#78d0ef')+line(333,91,0,43,'#78d0ef'):'')+label(240,208,['','Hyaline cartilage model','Primary center in the shaft','Secondary centers in the ends'][i]);
}

export const foundationsVisuals={
 '1.1':{title:'Relate a heart valve’s shape to its job',art:anatomy,states:[
  ['Anatomy','Identify the leaflets and the opening they span. Gross anatomy examines structures visible without a microscope.'],
  ['Physiology','Pressure differences drive blood flow. Leaflets open when the pressure gradient favors forward flow.'],
  ['Structure supports function','When pressure reverses, the leaflets come together. Their shape and attachments limit backward flow.']
 ]},
 '1.3':{title:'How the body turns a meal into usable materials',art:'sequence',states:[
  ['Break down','Catabolism splits molecules. Digestion makes smaller building blocks available, and cellular catabolism can yield energy.','Break|down'],
  ['Transfer energy','Cells capture part of the energy released by catabolism in ATP.','Transfer|energy'],
  ['Build','Anabolism uses energy and building blocks to make larger molecules. Growth and tissue repair depend on synthesis.','Build'],
  ['Respond','Cells detect signals and change activity. Coordinated muscle activity can produce a movement.','Respond']
 ]},
 '1.4':{title:'Follow the resources that keep cells functioning',art:'sequence',states:[
  ['Exchange','Oxygen diffuses at the lung surface. Food yields nutrients that are absorbed in the digestive tract.','Exchange'],
  ['Deliver','Blood transports oxygen and nutrients. Pressure differences drive circulation and ventilation.','Deliver'],
  ['Use','Cells use nutrients as building materials and fuel. Oxygen supports aerobic ATP production.','Use'],
  ['Protect','Extreme heat disrupts proteins and regulation. Extreme cold slows reactions and can injure tissues.','Protect']
 ]},
 '1.5':{title:'Compare feedback loops',art:i=>loop(i===1),states:[
  ['Negative feedback','A rise in temperature promotes heat loss, which reduces the original change. Sensors, an integrating center and effectors participate.'],
  ['Positive feedback','During labor, stretch promotes oxytocin release and stronger contractions, causing more stretch until delivery ends the loop.']
 ]},
 '1.7':{title:'Compare five ways to produce a medical image',art:imaging,states:[
  ['X-ray','A projection shows overlapping structures. Dense bone attenuates more X-rays. This uses ionizing radiation.'],
  ['CT','Multiple X-ray measurements are reconstructed as sections. CT shows bone and many internal injuries in cross-section and uses ionizing radiation.'],
  ['MRI','Magnetic fields and radiofrequency signals create images with useful soft-tissue contrast. MRI uses no ionizing radiation.'],
  ['Ultrasound','Sound echoes reveal boundaries and motion in real time. Air and bone can obstruct views.'],
  ['PET','A radioactive tracer shows where a process such as glucose uptake is concentrated. PET is often paired with anatomical imaging.']
 ]},
 '2.2':{title:'See what is shared, transferred or attracted',art:chemistry,states:[
  ['Ionic attraction','Electron transfer can form a positive cation and a negative anion. Opposite charges attract.'],
  ['Nonpolar covalent','In H₂, identical atoms share bonding electrons equally. A molecule can contain only one element.'],
  ['Polar covalent','In HCl, chlorine attracts the shared electron pair more strongly. HCl is both a molecule and a compound.'],
  ['Hydrogen bond','The oxygen of one water molecule attracts a partially positive hydrogen on a neighboring molecule. The dashed line is between molecules.']
 ]},
 '2.3':{title:'Compare molecular reactions and the activation barrier',art:reactions,states:[
  ['Synthesis','Smaller reactants join to form a larger product. Making bonds is one part of determining overall energy change.'],
  ['Decomposition','A larger reactant breaks into smaller products. Overall energy change depends on all the bonds and interactions involved.'],
  ['Exchange','Parts of reactants exchange partners. Compare the colors before and after the reaction.'],
  ['Activation energy','A catalyst lowers the barrier without changing the initial and final energy levels. Temperature and concentration can affect reaction rate.'],
  ['Exergonic','Products have lower free energy than reactants. The net change in free energy is negative, even though a barrier must be crossed.'],
  ['Endergonic','Products have higher free energy than reactants. The net change is positive and the reaction requires an energy input or coupling.']
 ]},
 '2.4':{title:'Follow a buffer as acid is added',art:'sequence',states:[
  ['Dissolve','Polar water surrounds charged particles. Dissolved salts form electrolytes that support electrical signaling and fluid balance.','Dissolve'],
  ['Add acid','An acid increases hydrogen-ion activity. A base accepts hydrogen ions or otherwise reduces their activity.','Add acid'],
  ['Buffer','A buffer binds added hydrogen ions and limits the pH change. Its capacity is finite.','Buffer']
 ]},
 '2.5':{title:'Compare the building blocks of four biomolecule groups',art:i=>{
  const pieces=[Array.from({length:4},(_,n)=>box(91+n*74,93,46,46,n%2?'#ffbf91':'#9ed9ef')).join(''),
    dot(163,85,32,'#9ed9ef')+line(159,117,-26,63,'#ffbf91')+line(175,116,31,52,'#ffbf91')+dot(311,83,25,'#9ed9ef')+line(307,106,0,65,'#ffbf91'),
    Array.from({length:8},(_,n)=>dot(86+n*42,124+Math.sin(n)*31,17,n%2?'#9ed9ef':'#a9dcc2')).join(''),
    Array.from({length:7},(_,n)=>line(99+n*45,88,0,69,n%2?'#ffbf91':'#9ed9ef')).join('')+line(99,88,270,0)+line(99,157,270,0)];
  return pieces[i]+label(240,214,['Sugar units','Lipid examples','Amino acid chain','Nucleotide chain'][i]);
 },states:[
  ['Carbohydrates','Monosaccharides can join as disaccharides or polysaccharides. Carbohydrates can supply fuel and store it as glycogen.'],
  ['Lipids','The examples show a phospholipid and a fatty acid schematically. Triglycerides store energy, phospholipids build membranes, steroids include cholesterol, and eicosanoids serve as local signals.'],
  ['Proteins','Amino acids join by peptide bonds. Sequence and folding help determine roles such as catalysis, transport and movement.'],
  ['Nucleotides','DNA and RNA are chains of nucleotides. DNA stores information and RNA helps express it. ATP is a nucleotide used in energy transfer.']
 ]},
 '5.1':{title:'Inspect the layers of skin and the tissue beneath it',art:i=>skin(i,'layers'),states:[
  ['Epidermis','Keratinocytes form a renewing barrier. They start in the basal layer and move toward the surface. Basal melanocytes make melanin and transfer it to keratinocytes.'],
  ['Dermis','The papillary and reticular regions supply support. Blood vessels nourish the avascular epidermis by diffusion.'],
  ['Hypodermis','Subcutaneous fat and connective tissue cushion, insulate and attach the skin to structures below.'],
  ['Deep fascia','Dense connective tissue lies deeper and helps organize or wrap muscles and other structures.'],
  ['Epidermal strata','The basal layer supplies keratinocytes. As they move outward, they pass through the spinosum and granulosum toward the corneum. The lucidum is distinct in thick skin such as the palms and soles.']
 ]},
 '5.2':{title:'Compare hair, nails and sweat gland ducts',art:accessory,states:[
  ['Hair follicle','A hair grows from matrix cells in the bulb. The sebaceous gland releases sebum into the follicle and the arrector pili muscle attaches to it.'],
  ['Nail','The nail matrix near the root supplies cells to the keratinized nail plate. The plate lies over the nail bed.'],
  ['Eccrine gland','Most eccrine ducts open directly onto the surface. Sweating can help cool the body when the fluid evaporates.'],
  ['Apocrine gland','Typical apocrine sweat glands empty into hair follicles in regions such as the axilla. They differ from the sebaceous glands that release oily sebum.']
 ]},
 '5.3':{title:'Change the temperature and inspect the skin response',art:i=>skin(i,'heat'),states:[
  ['Heat loss','Superficial vessels dilate and eccrine glands produce sweat. Evaporation removes heat. The skin also protects, senses and initiates vitamin D synthesis.'],
  ['Heat conservation','Superficial vessels constrict, reducing heat transfer from the body core to the surface. Sweat output decreases.']
 ]},
 '5.4':{title:'Compare injury depth with the skin layers affected',art:i=>skin(i,'depth'),states:[
  ['Superficial','Only the epidermis is involved. Surviving basal cells can support surface renewal.'],
  ['Partial thickness','Damage extends into the dermis. Surviving skin appendages can help re-epithelialize the surface.'],
  ['Full thickness','The epidermis and dermis are destroyed. The deeper injury removes many local sources of repair and commonly scars.'],
  ['Deeper injury','Damage can extend into subcutaneous tissues, muscle or bone. Depth and surface area are separate measures.'],
  ['Repair','Clotting and inflammation are followed by tissue formation and remodeling. Deep dermal injury can leave a fibrotic scar.']
 ]},
 '6.1':{title:'Link skeletal tissues to their jobs',states:[
  ['Support','Bone is mineralized connective tissue. Cartilage provides flexible support and reduces friction in selected places. Together with joints and associated structures, they contribute to the skeletal system.','Support'],
  ['Protect','The cranium encloses the brain and the thoracic cage protects structures in the chest.','Protect'],
  ['Move','Muscles pull on bones that act as levers around joints.','Move'],
  ['Store','Bone stores calcium and phosphate. Yellow marrow stores fat.','Store'],
  ['Make blood','Red marrow produces blood cells, including red cells, white cells and platelets.','Make|blood']
 ]},
 '6.2':{title:'Compare bone shape and the work it supports',art:bone,states:[
  ['Long','A long bone has a shaft and ends. The proportions matter more than its absolute length. A phalanx is a long bone.'],
  ['Flat','Flat bones such as the scapula or sternum offer broad surfaces for protection or muscle attachment.'],
  ['Short','Many carpals and tarsals are roughly cube-shaped, providing stability with controlled motion.'],
  ['Irregular','Vertebrae have openings and processes for protection, articulation and attachment.'],
  ['Sesamoid','A sesamoid develops within a tendon. The patella changes the direction and leverage of quadriceps force.']
 ]},
 '6.3':{title:'Locate the tissues of a long bone',art:longBone,states:[
  ['Epiphyses','The ends of a long bone contain trabeculae surrounded by a compact shell. Red marrow can occupy trabecular spaces.'],
  ['Compact bone','The dense shaft wall surrounds the cavity. Osteons help organize compact bone, which you can inspect in Guided practice.'],
  ['Medullary cavity','The cavity in the diaphysis contains marrow. The endosteum lines internal bone surfaces, including this cavity.'],
  ['Periosteum','This fibrous outer covering supports blood supply and attachment. It does not cover articular surfaces.'],
  ['Nutrient vessel','Nutrient vessels enter the bone through foramina. Osteoblasts form bone, osteoclasts resorb it and osteocytes maintain the matrix.']
 ]},
 '6.4':{title:'Compare the two ways bone forms',art:ossify,states:[
  ['Intramembranous','Osteoblasts differentiate within a mesenchymal membrane and deposit osteoid. Mineralized trabeculae enlarge and organize.'],
  ['Cartilage model','In endochondral ossification, hyaline cartilage first establishes the shape of a future bone.'],
  ['Primary center','Blood vessels invade the developing shaft. Bone replaces much of its cartilage model.'],
  ['Secondary centers','Ossification develops in the ends. Articular cartilage and growth plates persist. A growth plate lengthens bone while it remains open. Modeling changes shape; remodeling replaces existing bone.']
 ]},
 '6.6':{title:'Trace three inputs that change bone tissue',states:[
  ['Mechanical loading','Appropriate loading stimulates adaptation. Reduced loading can favor net bone loss.','Mechanical|loading'],
  ['Nutrition','Calcium and phosphate support mineral; vitamin D supports absorption, vitamin C supports collagen synthesis, and protein supplies building blocks.','Nutrition'],
  ['Hormones','Growth hormone supports growth-plate activity. Thyroid and sex hormones influence turnover and maturation. Estrogen helps limit bone resorption.','Hormones']
 ]}
};
