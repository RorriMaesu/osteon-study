const text=(x,y,t)=>`<text x="${x}" y="${y}" text-anchor="middle" fill="#e4f0e7" font-size="15">${t}</text>`;
const stroke=(d,c='#a9dcc2',w=5,fill='none')=>`<path d="${d}" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" fill="${fill}"/>`;
const circle=(x,y,r,c='#a9dcc2')=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`;
const rect=(x,y,w,h,c='#244049',rx=8)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${c}"/>`;
const arrow=(x,y,d,c='#ffbf91')=>stroke(`M${x} ${y}h${d}m${d>0?-9:9} -7 ${d>0?9:-9} 7 ${d>0?-9:9} 7`,c,3);
const accent='#ffbf91',pale='#dddace',blue='#9ed9ef',green='#a9dcc2',mute='#55747a';

function division(i){
 const axial=i===0?accent:mute,append=i===1?green:mute;
 return circle(240,46,26,axial)+stroke('M240 71V153 M215 94Q240 130 265 94 M219 105Q240 139 261 105 M223 116Q240 147 257 116',axial,6)+
 stroke('M240 83L196 90L178 126L155 157M240 83L284 90L302 126L325 157 M240 155Q223 136 207 150L214 165L196 202L180 222 M240 155Q257 136 273 150L266 165L284 202L300 222',append,8)+
 text(379,108,i===0?'Central axis':'Limbs and girdles');
}

function ribs(i){
 const ribColors=[accent,green,blue];
 const paths=Array.from({length:12},(_,n)=>{
  const group=n<7?0:n<10?1:2,y=36+n*13,ink=group===i?ribColors[i]:'#506e70';
  const inner=group===0?12:group===1?34+(n-7)*19:103+(n-10)*18;
  const endY=group===0?y+18:group===1?137+(n-7)*9:y+22;
  const path=stroke(`M${-161-n*2} ${y}Q${-143-n*3} ${y+31} ${-inner} ${endY}`,ink,4);
  return path+`<g transform="scale(-1 1)">${path}</g>`;
 }).join('');
 const arch=stroke('M-13 132Q-35 137-80 163M13 132Q35 137 80 163',i===1?green:'#506e70',5);
 return `<g transform="translate(240)">${paths}${arch}</g>`+rect(230,47,20,105,pale,6)+text(240,230,['Ribs 1–7 · direct','Ribs 8–10 · indirect','Ribs 11–12 · no anterior attachment'][i]);
}

function axialGrowth(i){
 if(i<2){
  const middle=i===0?stroke('M115 130Q240 64 365 130',accent,11):stroke('M115 130Q240 64 365 130',blue,23)+stroke('M155 111Q240 73 325 111',accent,10);
  return Array.from({length:15},(_,n)=>circle(93+n*20,80+Math.sin(n*.7)*14,5,mute)).join('')+middle+text(240,207,i===0?'Bone develops directly in mesenchyme':'Bone replaces a cartilage model');
 }
 if(i===2)return Array.from({length:5},(_,n)=>rect(153+n*38,85,31,67,blue,5)).join('')+stroke('M118 118H362',accent,4)+text(240,208,'Vertebral models surround the notochord');
 return stroke('M212 60Q190 105 224 164M268 60Q290 105 256 164',accent,13)+stroke('M215 71Q137 65 118 117M265 71Q343 65 362 117M221 116Q151 107 135 160M259 116Q329 107 345 160',blue,7)+text(240,208,'Paired sternal bars converge');
}

function jointClass(i){
 if(i===0)return joints(0,'fibrous');
 if(i===1)return joints(1,'cartilage');
 if(i===2)return synovial(0);
 return [145,241,337].map((x,n)=>circle(x,110,32,mute)+stroke(`M${x-40} 110H${x+40}`,accent,3)+(n>0?stroke(`M${x} 70v80`,blue,3):'')+(n>1?stroke(`M${x-27} 137l54-54`,green,3):'')+text(x,178,['Uniaxial','Biaxial','Multiaxial'][n])).join('');
}

function selectedJoint(i){
 const bones=[
  'M105 73H373V98Q305 115 256 85Q206 77 105 114Z M208 157Q238 126 275 155L302 186H152Z',
  'M136 65Q104 103 136 147L166 154V70Z M326 83Q276 46 246 91Q220 129 258 153L271 186H307L294 145Q334 134 326 83Z',
  'M209 38H273V95Q316 149 248 154Q191 156 206 102Z M154 124Q160 178 235 171L282 190L261 211L206 201Q153 199 138 149Z',
  'M143 50Q108 76 119 143Q134 173 174 168L203 134Q162 116 194 78Z M323 91Q291 57 251 86Q224 114 247 145L289 161L311 208H346L331 155Z',
  'M190 43H292V92Q321 125 282 142Q256 151 238 128Q216 153 191 141Q154 132 190 92Z M165 169Q239 148 306 171L274 195V210H203V193Z',
  'M154 57H238V130L213 150L154 131Z M281 69H309V154L278 166Z M190 169Q245 144 281 172L276 199H187Z'
 ];
 const stabilizers=[
  'M198 118Q247 94 286 123','M161 68Q242 37 281 65M162 151Q239 179 278 148','M187 104L155 164M290 115L266 170',
  'M170 62Q248 38 301 70M163 170Q230 206 298 171','M202 142L268 170M270 142L207 168M176 131L174 173M302 131L305 173',
  'M166 134L193 178M302 140L272 181'
 ];
 return stroke(bones[i],pale,3,'#728581')+stroke(stabilizers[i],accent,6)+text(240,233,['Disc','Labrum and cuff','Collateral ligaments','Deep socket and capsule','Menisci and ligaments','Medial and lateral restraints'][i]);
}

function spineSupport(i){
 const vertebrae=[63,127,191].map(y=>rect(122,y-23,93,43,pale)+stroke(`M215 ${y}L257 ${y-15}L302 ${y+4}L353 ${y+16}L301 ${y+26}L253 ${y+13}H215`,pale,4,'#68807e')).join('');
 const discs=rect(122,84,93,18,blue,4)+rect(122,148,93,18,blue,4);
 const support=[
  'M116 41V211','M222 42V212','M262 76L267 112M262 140L267 176','M309 82L314 118M309 146L314 182','M353 79L353 207'
 ][i];
 return vertebrae+discs+stroke(support,accent,6)+text(130,236,'Anterior')+text(350,236,'Posterior');
}

function girdle(i){
 const rail=stroke('M75 92Q109 83 143 92L184 102Q233 107 285 91L338 75',pale,13)+
  stroke('M330 72L377 89L399 122L359 174L326 140L312 109Z',pale,4,'#6a8481')+rect(50,81,26,101,pale)+
  circle(414,120,19,pale)+stroke('M415 137L428 196',pale,12);
 return rail+circle(...[[76,93],[337,76],[395,119]][i],9,accent)+text(240,229,['Clavicle and sternum','Clavicle and acromion','Humeral head and glenoid'][i]);
}

function limbJoints(i,lower){
 const points=lower?[[112,82],[226,125],[265,139],[334,177],[390,187]]:[[108,70],[197,111],[214,127],[298,149],[347,164],[398,176]];
 const bones=lower?stroke('M73 69Q96 41 135 66L112 82L157 102L226 125L285 154L334 177L398 188',pale,11)+stroke('M238 135L332 164',pale,6):stroke('M72 55L105 69L197 111L292 145L335 155L398 175',pale,10)+stroke('M201 122L290 154L334 163L397 184',pale,5);
 const [x,y]=points[i];
 return bones+circle(x,y,12,accent)+circle(x,y,4,'#203a3e')+text(240,232,lower?'Follow the lower limb from hip to foot':'Follow the upper limb from shoulder to fingers');
}

function pelvis(i){
 const halves=stroke('M237 172Q187 216 140 176L102 119Q69 69 114 52Q160 38 188 75L218 105Z',pale,4,i===0?'#86aca7':'#607f7e')+stroke('M243 172Q293 216 340 176L378 119Q411 69 366 52Q320 38 292 75L262 105Z',pale,4,i===0?'#86aca7':'#607f7e');
 const marks=[stroke('M113 132L160 119L206 127M274 127L322 119L367 132',accent,4)+circle(147,127,10,blue)+circle(333,127,10,blue),stroke('M189 80L208 118M291 80L272 118M240 165V190',accent,7),stroke('M114 113Q240 154 366 113',accent,6)][i];
 return halves+stroke('M202 69L278 69L256 130H224Z',pale,3,'#718783')+marks+text(240,231,['Three regions meet around each acetabulum','Sacroiliac joints and pubic symphysis','The brim separates the greater and lesser pelvis'][i]);
}

function limbBud(i){
 const forms=['M184 95q26-15 52 0q26 14 42 11q28-3 37 18q-12 22-36 24q-40 3-61 10q-32 9-42-10Z',
  'M174 92q36-18 74-5l80-15q28-6 43 25l3 41q-22 27-54 23l-67-5q-41 18-79 4Z',
  'M93 124q16-31 52-26l126-1q18-22 59-19q43 6 49 44q-5 42-50 46q-38 2-58-22l-126 0q-41 2-52-22Z',
  'M93 124q16-31 52-26l126-1q18-22 59-19q43 6 49 44q-5 42-50 46q-38 2-58-22l-126 0q-41 2-52-22Z'];
 return stroke(forms[i],blue,4,'#325766')+(i===1?stroke('M326 81Q374 80 372 135',accent,7):'')+(i>1?rect(169,106,89,30,accent):'')+(i===3?circle(128,123,19,accent)+circle(333,123,23,accent):'')+
 text(240,211,['Lateral limb bud','Apical ectodermal ridge','Primary center in shaft','Secondary centers toward ends'][i]);
}

function joints(i,family){
 const joined=family==='fibrous'?['Suture','Syndesmosis','Gomphosis'][i]:['Synchondrosis','Symphysis'][i];
 if(family==='fibrous'&&i===0)return stroke('M93 53H224L239 77L224 100L238 123L222 146L235 177H93Z',pale,4,'#627a79')+stroke('M385 53H250L265 77L250 100L264 123L248 146L260 177H385Z',pale,4,'#627a79')+stroke('M236 53L253 78L237 100L251 123L234 146L247 177',accent,4)+text(240,216,joined);
 if(family==='fibrous'&&i===2)return stroke('M148 83H200L214 164Q240 203 267 164L280 83H332V187H148Z',pale,4,'#637875')+stroke('M193 57Q240 27 287 57L264 126Q254 158 240 174Q228 151 217 124Z','#ede0c7',4,'#ab8975')+stroke('M205 93L221 153M275 93L258 153',accent,3)+text(240,224,joined);
 const cartilage=family!=='fibrous';
 return rect(62,67,120,105,pale)+rect(298,67,120,105,pale)+(cartilage?rect(178,70,124,99,i===0?blue:'#c997b3')+(i===1?stroke('M191 94H287M191 115H287M191 137H287','#9b6688',4):''):stroke('M183 81L299 106M183 103L299 128M183 125L299 150M183 147L298 165',accent,5))+text(240,218,joined);
}
function synovial(i){
 if(i===0)return rect(101,78,100,95,pale)+rect(279,78,100,95,pale)+
 stroke('M184 59Q240 27 296 59L296 191Q240 219 184 191Z',accent,4)+stroke('M201 83V169M279 83V169',blue,8)+text(240,128,'Cavity')+text(240,229,'Capsule encloses the joint');
 const shapes=[
  'M102 134H210M265 98H373',
  'M105 144Q144 73 209 95M265 106Q317 55 365 110',
  'M113 143A65 49 0 1 0 209 82M306 77V170',
  'M99 137Q156 57 215 132M263 133Q313 202 373 133',
  'M96 137Q152 62 208 133M268 122Q324 193 380 126',
  'M98 98Q113 172 191 167M289 86A39 39 0 1 0 290 86'
 ];
 const names=['Plane','Hinge','Pivot','Condyloid','Saddle','Ball and socket'];
 return stroke(shapes[i-1],pale,15)+arrow(206,183,60)+text(240,221,names[i-1]+' · surfaces and movement schematic');
}

function interzone(i){
 return rect(52,76,139,87,i===2?pale:blue)+rect(289,76,139,87,i===2?pale:blue)+
 (i===0?rect(190,76,100,87,'#a48ab5')+text(240,124,'Interzone'):
  stroke('M185 60Q240 29 294 60M185 180Q240 210 294 180',accent,5)+text(240,123,'Cavity')+
  (i===2?stroke('M191 83V155M290 83V155',blue,7):''))+text(240,225,['Between cartilage models','Cavity opens; margins persist','Articular cartilage persists'][i]);
}

function muscleRepair(i){
 const units=[
  circle(103,116,23,blue)+circle(169,116,23,blue)+circle(235,116,23,blue)+arrow(269,116,57)+rect(339,96,82,40,green),
  rect(91,97,285,53,'#8e5765',19)+circle(160,101,9,blue)+circle(263,101,9,blue)+arrow(206,76,60),
  rect(91,97,285,53,'#8e5765',19)+rect(198,95,82,57,'#bcc0ae')+stroke('M209 103l58 36M209 121l47 24M225 102l45 29',pale,4),
  rect(91,97,285,53,'#65958b',19)+stroke('M103 132q61-62 123 0t137 0',green,7)
 ];
 return units[i]+text(240,212,['Myoblast fusion','Satellite cells support repair','Fibrotic scar','Smooth muscle regenerates more readily'][i]);
}
function smooth(i){
 if(i===0)return stroke('M62 126Q141 66 239 76Q339 80 418 126Q338 164 239 177Q135 172 62 126Z',green,4,'#3a625f')+
  stroke('M111 126L203 105L268 148L368 125M111 126L210 153L264 101L368 125',blue,4)+
  [[111,126],[203,105],[268,148],[368,125],[210,153],[264,101]].map(([x,y])=>circle(x,y,6,accent)).join('')+text(240,222,'Dense bodies anchor filaments');
 if(i===1)return circle(240,117,82,green)+circle(240,117,47,'#10252c')+arrow(127,118,57)+arrow(353,118,-56)+text(240,223,'Circular contraction narrows the lumen');
 const n=i===2?true:false;
 return [0,1,2].map(j=>rect(81+j*111,92,95,60,green,28)+circle(126+j*111,122,9,mute)).join('')+
 (n?stroke('M175 122H194M287 122H305',accent,6):stroke('M127 55V86M237 55V86M348 55V86',accent,4))+text(240,209,n?'Gap junctions couple neighbors':'Separate neural input');
}

export const systemsVisuals={
 '7.1':{title:'Switch between the axial and appendicular skeleton',art:division,states:[
  ['Axial','The central skeleton includes the skull, auditory ossicles, hyoid, vertebral column and thoracic cage. Its bones protect and support the head, neck and trunk.'],
  ['Appendicular','This division includes the limb bones and pectoral and pelvic girdles. The girdles connect the limbs to the axial skeleton.']
 ]},
 '7.3':{title:'Locate the stabilizing ligaments of the spine',art:spineSupport,states:[
  ['Anterior longitudinal','Runs along the front of vertebral bodies and discs and helps limit excess extension.'],
  ['Posterior longitudinal','Runs along the back of vertebral bodies within the vertebral canal.'],
  ['Ligamenta flava','Elastic ligaments join adjacent laminae at the back of the vertebral canal.'],
  ['Interspinous','Connects adjacent spinous processes.'],
  ['Supraspinous','Connects the tips of spinous processes.']
 ]},
 '7.4':{title:'Trace the rib attachments toward the sternum',art:ribs,states:[
  ['True ribs · 1–7','Each of the first seven pairs attaches to the sternum through its own costal cartilage.'],
  ['Indirect attachment · 8–10','These false ribs attach to the costal cartilage above, rather than directly to the sternum.'],
  ['Floating ribs · 11–12','The last two pairs have no anterior attachment to the sternum. They still articulate with vertebrae posteriorly.']
 ]},
 '7.5':{title:'Follow the routes that form the axial skeleton',art:axialGrowth,states:[
  ['Skull vault','Many vault bones form directly in mesenchyme by intramembranous ossification. Gaps between growing bones contain fibrous tissue.','Skull|vault'],
  ['Cranial base','Much of the skull base forms from cartilage models by endochondral ossification.','Cranial|base'],
  ['Vertebral column','Sclerotome-derived mesenchyme forms cartilage around the notochord and neural tube. Much of this cartilage is replaced by bone.','Vertebral|column'],
  ['Thoracic cage','Ribs develop from thoracic costal processes. The sternum develops from paired bars that join at the midline.','Thoracic|cage']
 ]},
 '8.1':{title:'Follow the shoulder girdle from the trunk to the arm',art:girdle,states:[
  ['Sternoclavicular','The medial clavicle meets the manubrium. This joint is the bony link between the pectoral girdle and the axial skeleton.'],
  ['Acromioclavicular','The lateral clavicle meets the acromion of the scapula. Motion at this joint helps the scapula move with the arm.'],
  ['Glenohumeral','The glenoid cavity of the scapula receives the humeral head and permits a large range of arm motion.']
 ]},
 '8.2':{title:'Trace the articulations from shoulder to fingers',art:i=>limbJoints(i,false),states:[
  ['Shoulder','Humeral head meets the scapular glenoid.'],['Elbow','The humeral trochlea meets the ulnar notch, and the capitulum meets the radial head.'],
  ['Radioulnar joints','The radius rotates relative to the ulna at proximal and distal radioulnar joints during pronation and supination.'],
  ['Wrist','The distal radius and an articular disc support articulation with the proximal carpal row.'],
  ['Carpometacarpal joints','The metacarpals meet distal carpals. The thumb forms a saddle joint with the trapezium.'],
  ['Finger joints','Metacarpal heads meet proximal phalanges at the knuckles. Interphalangeal joints hinge between phalanges.']
 ]},
 '8.3':{title:'Compare the regions, joints and spaces of the pelvis',art:pelvis,states:[
  ['Hip bone regions','The ilium, ischium and pubis meet at the acetabulum. Use the source views to identify their landmarks.'],
  ['Pelvic ring joints','The paired sacroiliac joints connect the sacrum to the ilia. The pubic symphysis joins the pubic bones anteriorly.'],
  ['Pelvic brim','The inlet lies at the pelvic brim. The greater pelvis is above it and the lesser pelvis extends to the pelvic outlet.']
 ]},
 '8.4':{title:'Trace the articulations from hip to foot',art:i=>limbJoints(i,true),states:[
  ['Hip','The head of the femur articulates with the acetabulum.'],['Knee','Femoral condyles meet the tibial condyles. The patella glides on the anterior femur.'],
  ['Tibiofibular joints','The fibular head articulates with the proximal tibia. A distal syndesmosis holds the ankle mortise together.'],
  ['Ankle','The tibia and fibula form the mortise around the talus.'],['Foot','The tarsals, metatarsals and phalanges form articulations that help the foot bear weight and adapt during gait.']
 ]},
 '8.5':{title:'Advance from limb bud to ossification centers',art:limbBud,states:[
  ['Limb bud','Upper limb buds appear near the end of week four and lower limb buds follow. Limb skeletal tissues develop from mesenchyme.'],
  ['Apical ridge','The apical ectodermal ridge at the growing tip signals to nearby mesenchyme and supports limb outgrowth.'],
  ['Primary center','Cartilage models form first. The first ossification center of a typical long bone develops in the shaft.'],
  ['Secondary centers','Secondary centers develop toward the ends of long bones. A growth plate separates the ends from the shaft until closure.']
 ]},
 '9.1':{title:'Classify the same joint by structure and movement',art:jointClass,states:[
  ['Fibrous · suture','Dense connective tissue joins the bones. Most skull sutures allow essentially no movement and are synarthroses.','Fibrous'],
  ['Cartilaginous · symphysis','Fibrocartilage joins the bones. The pubic symphysis allows slight movement and is an amphiarthrosis.','Cartilaginous'],
  ['Synovial · elbow','A joint cavity separates the articular surfaces. The elbow is a freely movable diarthrosis, chiefly uniaxial.','Synovial'],
  ['Axes of motion','Freely movable joints can be uniaxial, biaxial or multiaxial. Compare the elbow, a metacarpophalangeal joint and the shoulder.','Motion|axes']
 ]},
 '9.2':{title:'Inspect the three ways fibrous joints connect bones',art:i=>joints(i,'fibrous'),states:[
  ['Suture','Short fibers connect close skull edges. Compare the narrow interface with the broader connection of a syndesmosis.'],
  ['Syndesmosis','A ligament or interosseous membrane connects bones, as between the radius and ulna. Motion depends on the joint.'],
  ['Gomphosis','The periodontal ligament anchors a tooth root in its alveolar socket.']
 ]},
 '9.3':{title:'Compare the two cartilaginous joint designs',art:i=>joints(i,'cartilage'),states:[
  ['Synchondrosis','Hyaline cartilage directly joins bones. The epiphyseal plate is temporary, while the first sternocostal joint is usually permanent.'],
  ['Symphysis','Fibrocartilage unites bones, with hyaline cartilage at many adjoining surfaces. Examples include the pubic symphysis and joints between vertebral bodies.']
 ]},
 '9.4':{title:'Inspect the synovial joint and compare six types',art:synovial,states:[
  ['Joint structure','Articular cartilage covers the bone ends. The synovial membrane lines the inside of the fibrous capsule where cartilage does not cover the surface. Fluid lubricates the cavity. Ligaments stabilize the joint. Bursae or tendon sheaths reduce friction where present.'],
  ['Plane','Relatively flat surfaces glide, as at many intercarpal joints.'],
  ['Hinge','A spool-like surface permits flexion and extension, as at the elbow.'],
  ['Pivot','A bone rotates around a longitudinal axis, as at the proximal radioulnar joint.'],
  ['Condyloid','An oval surface fits a shallow oval depression, allowing movement in two planes, as at the radiocarpal joint.'],
  ['Saddle','Each surface is concave in one direction and convex in the other. The thumb carpometacarpal joint is the familiar example.'],
  ['Ball and socket','A rounded head fits a cup and moves around multiple axes. The hip and shoulder are examples.']
 ]},
 '9.6':{title:'Compare the selected joints by motion and restraint',art:selectedJoint,states:[
  ['TMJ','The mandibular condyle and temporal bone form a joint divided by an articular disc. Hinge motion and glide cooperate in jaw opening.','TMJ'],
  ['Shoulder','The humeral head meets the shallow glenoid. The labrum deepens the socket and the rotator cuff helps stabilize movement.','Shoulder'],
  ['Elbow','The humeroulnar articulation hinges. Collateral ligaments stabilize it; the nearby proximal radioulnar joint enables forearm rotation.','Elbow'],
  ['Hip','The femoral head meets the deep acetabulum. The labrum and strong capsular ligaments contribute to stability.','Hip'],
  ['Knee','The tibiofemoral and patellofemoral articulations work together. Menisci distribute load, and cruciate and collateral ligaments restrain excess movement.','Knee'],
  ['Ankle','The distal tibia and fibula form a mortise around the talus. The joint primarily dorsiflexes and plantarflexes. The deltoid and lateral ligaments resist excess movement.','Ankle']
 ]},
 '9.7':{title:'Watch the synovial joint cavity develop',art:interzone,states:[
  ['Cartilage models','Limb mesenchyme forms cartilage models that later ossify endochondrally. In intramembranous ossification, bone develops directly in mesenchyme.'],
  ['Joint interzone','A cavity forms in the center of the interzone. The margins contribute to the capsule and supporting ligaments.'],
  ['Articular surfaces','Bone replaces much of each model. Hyaline articular cartilage remains where bone ends face the joint.']
 ]},
 '10.5':{title:'Compare skeletal muscle fiber profiles',art:'bars',states:[
  ['Slow oxidative','Slow contraction with high oxidative capacity and relatively high fatigue resistance. Suited to prolonged activity.',[['Speed',1,1],['Oxidative capacity',4,0],['Fatigue resistance',4,2]]],
  ['Fast oxidative','Fast contraction with appreciable aerobic metabolism and intermediate fatigue resistance.',[['Speed',3,1],['Oxidative capacity',3,0],['Fatigue resistance',2.7,2]]],
  ['Fast glycolytic','Fast force production relies heavily on glycolysis during brief bursts. Fatigue develops sooner.',[['Speed',4,1],['Oxidative capacity',1,0],['Fatigue resistance',1,2]]]
 ]},
 '10.6':{title:'Compare exercise adaptations and disuse',art:'bars',states:[
  ['Resistance','Repeated loading stimulates protein synthesis and can enlarge existing fibers. Anabolic substances can affect this pathway and carry health risks.',[['Fiber size',3.5,1],['Oxidative support',2,0]]],
  ['Endurance','Endurance training can increase mitochondrial and capillary support for sustained ATP production.',[['Fiber size',2,1],['Oxidative support',3.7,0]]],
  ['Disuse','Inactivity can cause atrophy, a decrease in fiber size. Qualitative profiles illustrate adaptations, with no units or clinical cutoffs.',[['Fiber size',1,1],['Oxidative support',1.2,0]]]
 ]},
 '10.8':{title:'See how smooth muscle organizes force',art:smooth,states:[
  ['Dense bodies','Actin is anchored to dense bodies instead of aligned Z discs. This arrangement transmits force through a spindle-shaped, nonstriated cell.'],
  ['Around a lumen','A circular layer can narrow a passageway. Coordinated contractions help move contents through hollow organs.'],
  ['Single unit','Gap junctions let electrical changes spread between cells, which often contract together.'],
  ['Multiunit','Cells receive more independent input and can be controlled more finely.']
 ]},
 '10.9':{title:'Follow muscle formation, repair and scarring',art:muscleRepair,states:[
  ['Myoblast fusion','During skeletal development, myoblasts fuse to form multinucleate myotubes. Smooth and cardiac cells do not form skeletal-type myotubes.'],
  ['Satellite cells','Satellite cells near skeletal fibers activate after injury and can contribute to repair. Their capacity is limited.'],
  ['Fibrosis','Collagen-rich scar can replace damaged contractile tissue. Substantial injury to adult cardiac muscle commonly heals this way.'],
  ['Smooth muscle','Smooth muscle generally has the greatest regenerative ability of the three muscle types.']
 ]}
};
