import {readFileSync,readdirSync,writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {runInNewContext} from 'node:vm';
import {fileURLToPath} from 'node:url';
import {auditMuscleCoverage,muscleTermKey} from '../src/muscle-coverage.js';
import {courseMuscleTargets} from '../src/muscle-spatial-data.js';

const repoURL = new URL('../',import.meta.url);
const assetURL = new URL('../assets/',import.meta.url);
const targetURL = new URL('../src/motion-coverage-data.json',import.meta.url);
const ref=process.env.MOTION_COVERAGE_REF||'';
const git=(...args)=>execFileSync('git',args,{cwd:fileURLToPath(repoURL),maxBuffer:32*1024*1024});
const commit=ref?git('rev-parse','--verify','--end-of-options',ref+'^{commit}').toString().trim():null;
const sourceBytes=relative=>commit?git('show',commit+':'+relative):readFileSync(new URL(relative,repoURL));
const sourceJSON=relative=>JSON.parse(sourceBytes(relative).toString('utf8').replace(/^\ufeff/,''));
const checklist=sourceJSON('src/muscle-reference-checklist.json');
const manifest=sourceJSON('src/muscle-models.json');
const motionFiles=()=>commit?git('ls-tree','--name-only',commit+':assets').toString().split(/\r?\n/):readdirSync(assetURL);
const sources = [
 {title:'FIPAT, Terminologia Anatomica, 2nd edition · Muscular system',url:'https://cdn.dal.ca/content/dam/dalhousie/pdf/library/FIPAT/TA2/FIPAT-TA2-Part-2.pdf'},
 {title:'OpenStax Anatomy & Physiology 2e · Muscular system',url:'https://openstax.org/books/anatomy-and-physiology-2e/pages/11-introduction'},
 {title:'OpenStax Anatomy & Physiology 2e · Control of muscle tension',url:'https://openstax.org/books/anatomy-and-physiology-2e/pages/10-4-nervous-system-control-of-muscle-tension'},
 {title:'Moreira et al. · Synchronized lower-limb walking data and surface EMG',url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC8041842/'},
 {title:'Osteon · Model attributions',url:'https://github.com/RorriMaesu/osteon-study/blob/main/assets/MODEL-LICENSE.md'},
];

// Selected heads directly checked against their individually numbered entries.
// This supplements the existing flat checklist without republishing its source hierarchy.
const heads = [
 [2465,'Long head of biceps brachii',2464,'shoulder-arm'],
 [2466,'Short head of biceps brachii',2464,'shoulder-arm'],
 [2472,'Long head of triceps brachii',2471,'shoulder-arm'],
 [2473,'Lateral head of triceps brachii',2471,'shoulder-arm'],
 [2474,'Medial head of triceps brachii',2471,'shoulder-arm'],
 [2639,'Long head of biceps femoris',2638,'pelvis-leg-foot'],
 [2640,'Short head of biceps femoris',2638,'pelvis-leg-foot'],
 [2658,'Lateral head of gastrocnemius',2657,'pelvis-leg-foot'],
 [2659,'Medial head of gastrocnemius',2657,'pelvis-leg-foot'],
].map(([ta2,name,parent,region])=>({
 id:'ta2-'+ta2,ta2,name,componentOf:'ta2-'+parent,region,
 entryType:'muscle-head',expectedSides:'left-and-right',inconstantInTA2:false,
}));

// Osteon coverage terms checked individually against TA2 2.07, Part II, chapter 4.
// These are anatomical names and identifiers. The categories, matching rules and notes are Osteon's.
const additionalTerms = {
 'head-neck': [
  [2052,'Levator palpebrae superioris'],
  [2054,'Epicranius'],
  [2063,'Transverse part of nasalis',2062],
  [2064,'Alar part of nasalis',2062],
  [2065,'Depressor septi nasi'],
  [2067,'Palpebral part of orbicularis oculi',2066],
  [2068,'Ciliary bundle of orbicularis oculi',2066],
  [2069,'Deep palpebral part of orbicularis oculi',2066],
  [2070,'Orbital part of orbicularis oculi',2066],
  [2072,'Depressor supercilii'],
  [2074,'Marginal part of orbicularis oris',2073],
  [2075,'Labial part of orbicularis oris',2073],
  [2076,'Depressor anguli oris'],
  [2081,'Levator labii superioris'],
  [2082,'Levator nasolabialis'],
  [2083,'Depressor labii inferioris'],
  [2084,'Levator anguli oris'],
  [2086,'Buccinator'],
  [2105,'Masseter'],
  [2106,'Superficial part of masseter',2105],
  [2107,'Deep part of masseter',2105],
  [2110,'Superior head of lateral pterygoid',2109],
  [2111,'Inferior head of lateral pterygoid',2109],
  [2114,'Deep head of medial pterygoid',2113],
  [2115,'Superficial head of medial pterygoid',2113],
  [2133,'Anterior fascicle of palatopharyngeus',2132],
  [2134,'Posterior fascicle of palatopharyngeus',2132],
  [2157,'Sternal head of sternocleidomastoid',2156],
  [2158,'Clavicular head of sternocleidomastoid',2156],
  [2161,'Anterior belly of digastric',2160],
  [2163,'Posterior belly of digastric',2160],
  [2170,'Superior belly of omohyoid',2169],
  [2172,'Inferior belly of omohyoid',2169],
  [2175,'Levator glandulae thyroideae',null,{variant:true,side:'unspecified'}],
  [2179,'Superior pharyngeal constrictor'],
  [2180,'Pterygopharyngeal part of superior pharyngeal constrictor',2179],
  [2181,'Buccopharyngeal part of superior pharyngeal constrictor',2179],
  [2182,'Mylopharyngeal part of superior pharyngeal constrictor',2179],
  [2183,'Glossopharyngeal part of superior pharyngeal constrictor',2179],
  [2184,'Middle pharyngeal constrictor'],
  [2185,'Chondropharyngeal part of middle pharyngeal constrictor',2184],
  [2186,'Ceratopharyngeal part of middle pharyngeal constrictor',2184],
  [2187,'Inferior pharyngeal constrictor'],
  [2188,'Thyropharyngeal part of inferior pharyngeal constrictor',2187],
  [2189,'Cricopharyngeal part of inferior pharyngeal constrictor',2187],
  [2194,'Straight part of cricothyroid',2193],
  [2195,'Oblique part of cricothyroid',2193],
  [2200,'External part of thyro-arytenoid',2199],
  [2201,'Thyro-epiglottic part of thyro-arytenoid',2199],
  [2204,'Ary-epiglottic part of oblique arytenoid',2203],
 ],
 'trunk-back': [
  [2227,'Upper (descending) part of trapezius',2226],
  [2228,'Transverse part of trapezius',2226],
  [2229,'Lower (ascending) part of trapezius',2226],
  [2234,'Levator scapulae'],
  [2240,'Dorsal parts of lateral intertransversarii lumborum',2239],
  [2241,'Ventral parts of lateral intertransversarii lumborum',2239],
  [2254,'Erector spinae'],
  [2257,'Iliocostalis',2254],
  [2262,'Longissimus',2254],
  [2264,'Lumbar part of longissimus thoracis',2263],
  [2267,'Spinalis',2254],
  [2272,'Splenius'],
  [2276,'Multifidus'],
  [2280,'Semispinalis'],
  [2285,'Lumbar rotatores',2284,{variant:true}],
  [2286,'Thoracic rotatores',2284],
  [2287,'Long thoracic rotatores',2286],
  [2288,'Short thoracic rotatores',2286],
  [2289,'Cervical rotatores',2284,{variant:true}],
  [2290,'Interspinales'],
  [2294,'Intertransversarii'],
  [2302,'Clavicular head of pectoralis major',2301],
  [2303,'Sternocostal head of pectoralis major',2301],
  [2304,'Abdominal part of pectoralis major',2301,{variant:true}],
  [2308,'Levatores costarum'],
  [2309,'Levatores longi costarum',2308],
  [2310,'Levatores breves costarum',2308],
  [2330,'Muscular part of right hemidiaphragm',2327,{side:'right-only'}],
  [2331,'Right lumbar part of diaphragm',2330,{side:'right-only'}],
  [2332,'Right crus of diaphragm',2331,{side:'right-only'}],
  [2336,'Right costal part of diaphragm',2330,{side:'right-only'}],
  [2337,'Right sternal part of diaphragm',2330,{side:'right-only'}],
  [2345,'Muscular part of left hemidiaphragm',2327,{side:'left-only'}],
  [2346,'Left lumbar part of diaphragm',2345,{side:'left-only'}],
  [2347,'Left crus of diaphragm',2346,{side:'left-only'}],
  [2351,'Left costal part of diaphragm',2345,{side:'left-only'}],
  [2352,'Left sternal part of diaphragm',2345,{side:'left-only'}],
 ],
 'shoulder-arm': [
  [2453,'Clavicular part of deltoid',2452],
  [2454,'Acromial part of deltoid',2452],
  [2455,'Scapular spinal part of deltoid',2452],
 ],
 'forearm-hand': [
  [2478,'Pronator teres'],
  [2479,'Superficial head of pronator teres',2478],
  [2480,'Deep head of pronator teres',2478],
  [2481,'Flexor carpi radialis'],
  [2483,'Flexor carpi ulnaris'],
  [2484,'Humeral head of flexor carpi ulnaris',2483],
  [2485,'Ulnar head of flexor carpi ulnaris',2483],
  [2486,'Flexor digitorum superficialis'],
  [2487,'Humero-ulnar head of flexor digitorum superficialis',2486],
  [2488,'Radial head of flexor digitorum superficialis',2486],
  [2491,'Flexor digitorum profundus'],
  [2492,'Flexor pollicis longus'],
  [2493,'Pronator quadratus'],
  [2508,'Humeral head of extensor carpi ulnaris',2507],
  [2509,'Ulnar head of extensor carpi ulnaris',2507],
  [2512,'Supinator'],
  [2513,'Humeral head of supinator',2512],
  [2514,'Ulnar head of supinator',2512],
  [2517,'Abductor pollicis longus'],
  [2521,'Abductor pollicis brevis'],
  [2522,'Flexor pollicis brevis'],
  [2523,'Superficial head of flexor pollicis brevis',2522],
  [2524,'Deep head of flexor pollicis brevis',2522],
  [2526,'Adductor pollicis'],
  [2527,'Oblique head of adductor pollicis',2526],
  [2528,'Transverse head of adductor pollicis',2526],
  [2529,'Abductor digiti minimi of hand'],
  [2530,'Flexor digiti minimi of hand'],
 ],
 'pelvis-leg-foot': [
  [2402,'Pelvic diaphragm'],
  [2427,'Subcutaneous part of external anal sphincter',2426,{side:'midline'}],
  [2428,'Superficial part of external anal sphincter',2426,{side:'midline'}],
  [2429,'Deep part of external anal sphincter',2426,{side:'midline'}],
  [2605,'Obturator internus'],
  [2615,'Straight head of rectus femoris',2614],
  [2616,'Reflected head of rectus femoris',2614],
  [2617,'Third head of rectus femoris',2614,{variant:true}],
  [2628,'Adductor longus'],
  [2629,'Adductor brevis'],
  [2630,'Adductor magnus'],
  [2631,'Adductor part of adductor magnus',2630],
  [2632,'Adductor minimus',2630,{variant:true}],
  [2633,'Ischiocondylar part of adductor magnus',2630],
  [2636,'Obturator externus'],
  [2668,'Flexor hallucis longus'],
  [2672,'Abductor hallucis'],
  [2673,'Flexor hallucis brevis'],
  [2674,'Medial head of flexor hallucis brevis',2673],
  [2675,'Lateral head of flexor hallucis brevis',2673],
  [2676,'Adductor hallucis'],
  [2677,'Oblique head of adductor hallucis',2676],
  [2678,'Transverse head of adductor hallucis',2676],
  [2679,'Abductor digiti minimi of foot'],
  [2680,'Abductor of fifth metatarsal',2679,{variant:true}],
  [2682,'Flexor digiti minimi of foot'],
  [2683,'Flexor digitorum brevis'],
 ],
};

// A model can represent a group with several independently named surfaces.
// Match all listed parts for that group. Never use a whole parent mesh to fill a subdivision.
const groupedTerms = {
 2054:[2056,2057,2058],
 2105:[2106,2107],
 2254:[2258,2260,2261,2263,2265,2266,2268,2269,2270],
 2257:[2258,2260,2261],
 2262:[2263,2265,2266],
 2267:[2268,2269,2270],
 2272:[2273,2274],
 2276:[2277,2278,2279],
 2280:[2281,2282,2283],
 2290:[2291,2292,2293],
 2294:[2237,2238,2239,2295,2296,2297],
 2308:[2309,2310],
 2402:[2403,2412],
 2478:[2479,2480],
 2483:[2484,2485],
 2486:[2487,2488],
 2522:[2523,2524],
 2526:[2527,2528],
 2673:[2674,2675],
 2676:[2677,2678],
};
const termNotes = {
 2086:'TA2 uses the spelling Bucinator and lists Buccinator as an alternative.',
 2327:'The atlas has a combined diaphragm surface. Check its named muscular subdivisions separately.',
 2426:'The atlas sphincter surface does not identify each named depth subdivision separately.',
 2632:'The source provides a distinct named mesh. The anatomical structure can vary.',
};

function referenceTerms(){
 const added=Object.entries(additionalTerms).flatMap(([region,terms])=>terms.map(([ta2,name,parent,options={}])=>({
  id:'ta2-'+ta2,ta2,name,region,inconstantInTA2:options.variant||false,
  entryType:parent?'muscle-subdivision':groupedTerms[ta2]?'muscle-group':'named-muscle-or-serial-group',
  componentOf:parent?'ta2-'+parent:undefined,expectedSides:options.side||'left-and-right',note:termNotes[ta2],
 })));
 const base=new Map(checklist.items.map(term=>[term.id,term]));
 for(const term of [...heads,...added])if(!base.has(term.id))base.set(term.id,term);
 return [...base.values()].map(term=>{
  const members=groupedTerms[term.ta2];
  if(!members&&!termNotes[term.ta2])return term;
  return {...term,note:term.note||termNotes[term.ta2],
   requiredGroups:members?.flatMap(id=>{
    const member=base.get('ta2-'+id);
    if(!member)throw Error('Missing standard muscle group member: '+id);
    return member.requiredGroups||[member.name];
   })||term.requiredGroups};
 });
}

const sides=['left','right','midline','other'];
const blankSides=()=>Object.fromEntries(sides.map(side=>[side,[]]));
const slug=value=>muscleTermKey(value).replace(/ +/g,'-');
const byLabel=(a,b)=>a.name.localeCompare(b.name,'en')||a.id.localeCompare(b.id,'en');
const expectedBuckets={
 'left-and-right':['left','right'],
 'left-only':['left'],
 'right-only':['right'],
 midline:['midline'],
 bilateral:['other'],
 unspecified:[],
};
const atlasConfirmed=['named-geometry','represented-by-components','source-inventory'];
const unconfirmed=['needs-anatomical-review','not-separately-resolved','partial-model'];
const namedSeries = new Map([
 ['first lumbrical of foot','ta2-2685'],['second lumbrical of foot','ta2-2685'],
 ['third lumbrical of foot','ta2-2685'],['fourth lumbrical of foot','ta2-2685'],
 ['palmar interosseous of index finger','ta2-2534'],['palmar interosseous of ring finger','ta2-2534'],
 ['palmar interosseous of little finger','ta2-2534'],
]);
const elbowIDs=new Set(['anconeus','biceps-brachii','brachialis','brachioradialis','triceps-brachii']);
const gaitIDs=new Set(['biceps-femoris','gastrocnemius-lateral','tibialis-anterior','vastus-lateralis']);
const heelIDs=new Set(['gastrocnemius-lateral','gastrocnemius-medial','soleus']);

function glb(file){
 const bytes=sourceBytes('assets/'+file);
 if(bytes.length<20||bytes.toString('ascii',0,4)!=='glTF'||bytes.readUInt32LE(4)!==2)throw Error('Invalid GLB: '+file);
 const jsonEnd=20+bytes.readUInt32LE(12);
 return {doc:JSON.parse(bytes.toString('utf8',20,jsonEnd)),bin:bytes.subarray(jsonEnd+8)};
}

const decoderCode=readFileSync(new URL('../vendor/draco/draco_decoder.js',import.meta.url),'utf8');
let draco;
async function loadDraco(){
 if(!draco){
  const env={module:{exports:{}},exports:{},require:createRequire(import.meta.url),process,console,setTimeout,clearTimeout,__dirname:'.'};
  runInNewContext(decoderCode,env);
  draco=env.module.exports({});
 }
 return draco;
}

function registerJoints(rawWeights,rawJoints,out){
 for(let k=0;k<rawWeights.size();k++){
  if(rawWeights.GetValue(k)>0.001)out.add(rawJoints.GetValue(k));
 }
}

function uncompressedJoints(doc,bin,attributes,out){
 const joint=doc.accessors[attributes.JOINTS_0],weight=doc.accessors[attributes.WEIGHTS_0];
 if(!joint||!weight||joint.bufferView===undefined||weight.bufferView===undefined||
    joint.sparse||weight.sparse||joint.count!==weight.count)return false;
 const jointView=doc.bufferViews[joint.bufferView],weightView=doc.bufferViews[weight.bufferView];
 const jointType={5121:[1,'readUInt8'],5123:[2,'readUInt16LE']}[joint.componentType];
 const weightType={5121:[1,'readUInt8'],5123:[2,'readUInt16LE'],5126:[4,'readFloatLE']}[weight.componentType];
 if(!jointType||!weightType)return false;
 const [jBytes,jRead]=jointType,[wBytes,wRead]=weightType;
 const jStart=(jointView.byteOffset||0)+(joint.byteOffset||0),wStart=(weightView.byteOffset||0)+(weight.byteOffset||0);
 for(let i=0;i<joint.count;i++)for(let j=0;j<4;j++){
  const wIndex=wStart+i*(weightView.byteStride||4*wBytes)+j*wBytes;
  const jIndex=jStart+i*(jointView.byteStride||4*jBytes)+j*jBytes;
  if(bin[wRead](wIndex)>0.001)out.add(bin[jRead](jIndex));
 }
 return true;
}

function dracoJoints(ext,doc,bin,lib,decoder,out){
 const view=doc.bufferViews[ext.bufferView];
 const start=view.byteOffset||0;
 const slice=bin.subarray(start,start+view.byteLength);
 const buffer=new lib.DecoderBuffer(),mesh=new lib.Mesh();
 const joints=new lib.DracoInt32Array(),weights=new lib.DracoFloat32Array();
 let status;
 try{
  buffer.Init(new Int8Array(slice),slice.byteLength);
  status=decoder.DecodeBufferToMesh(buffer,mesh);
  if(!status.ok())throw Error('Motion skin failed to decode: '+status.error_msg());
  if(ext.attributes.JOINTS_0===undefined||ext.attributes.WEIGHTS_0===undefined)return false;
  const j=decoder.GetAttributeByUniqueId(mesh,ext.attributes.JOINTS_0);
  const w=decoder.GetAttributeByUniqueId(mesh,ext.attributes.WEIGHTS_0);
  if(!decoder.GetAttributeInt32ForAllPoints(mesh,j,joints)||!decoder.GetAttributeFloatForAllPoints(mesh,w,weights))return false;
  registerJoints(weights,joints,out);
  return true;
 }finally{
  if(status)lib.destroy(status);
  for(const item of [weights,joints,mesh,buffer])lib.destroy(item);
 }
}

function inspectSkin(node,doc,bin,lib,decoder){
 const mesh=doc.meshes[node.mesh],joints=new Set();
 const skin=doc.skins?.[node.skin];
 const bound=skin&&mesh.primitives.every(({extensions,attributes})=>{
  const ext=extensions?.KHR_draco_mesh_compression;
  return ext?dracoJoints(ext,doc,bin,lib,decoder,joints):uncompressedJoints(doc,bin,attributes,joints);
 });
 const hasMorph=mesh.primitives.some(p=>p.targets?.some(target=>target.POSITION!==undefined));
 const targetName=node.extras.motionHeelDeformation||node.extras.motionDeformationTarget;
 const activeMorph=hasMorph&&(
  (targetName&&(mesh.extras?.targetNames||[]).includes(targetName))||
  (doc.animations||[]).some(a=>a.channels.some(c=>c.target.path==='weights'&&doc.nodes[c.target.node]===node))
 );
 const deformation=[];
 if(bound&&joints.size>1)deformation.push('joint-weights');
 if(hasMorph)deformation.push('morph-target');
 return {rig:(bound&&joints.size>1)||activeMorph?'deforms':!hasMorph&&(!skin||bound&&joints.size===1)?'rigid':'uncertain',
  deformation,joints:bound?[...joints].map(index=>doc.nodes[skin.joints[index]]?.name||String(index)).sort():[]};
}

function motionEvidence(file,id,heelReplacement){
 if(/^motion-arm(?:-left)?\.glb$/.test(file)){
  return {modes:['pose','elbow-lessons'],evidence:[elbowIDs.has(id)?'textbook-contraction':'pose-context']};
 }
 if(file==='motion-legs.glb'){
  const measured=gaitIDs.has(id);
  const inHeel=heelIDs.has(id)&&!heelReplacement;
  const scope=id==='biceps-femoris'?'The long-head mesh marks the sampled biceps femoris region. The recording does not distinguish its two heads.':'';
  return {modes:['pose','walk',...(inHeel?['heel-raise']:[])],
   evidence:[...(measured?['recorded-surface-emg']:['pose-context']),...(inHeel?['textbook-contraction']:[])],qualification:scope||undefined};
 }
 if(file==='motion-leg-actions.glb')return {modes:['heel-raise'],evidence:[heelIDs.has(id)?'textbook-contraction':'pose-context']};
 return {modes:[],evidence:['pose-context']};
}

async function motionParts(byID){
 const lib=await loadDraco(), decoder=new lib.Decoder(), parts=[];
 try{
  const rigs=motionFiles().filter(name=>/^motion-[a-z0-9-]+\.glb$/.test(name)).sort().map(file=>({file,...glb(file)}));
  const heelReplacements=new Set(
   (rigs.find(rig=>rig.file==='motion-leg-actions.glb')?.doc.nodes||[])
    .map(node=>node.extras?.motionHeelReplacement).filter(Boolean)
  );
  for(const {file,doc,bin} of rigs){
   for(const node of doc.nodes||[]){
    const info=node.extras;
    if(node.mesh===undefined||!(info?.motionMuscle||info?.walkRegion))continue;
    const atlas=byID.get(info.muscleId);
    const side=info.motionSide||info.anatomicalSide||atlas?.side;
    const region=info.walkRegion||info.muscleRegion||atlas?.region;
    if(!side||!region)throw Error(file+' motion mesh lacks side or region: '+node.name);
    const context=!!info.walkRegion;
    const evidence=context?{
     modes:['walk'],
     evidence:['walk-anatomical-context'],
     qualification:info.walkDeformation==='guided-blend'?'Follows the pose with a guided skin blend. No activity was recorded for this part.':'Follows one moving body segment. No activity was recorded for this part.',
    }:motionEvidence(file,info.motionMuscle,heelReplacements.has(node.name));
    const displayName=atlas?.geometryReview?.displayName||atlas?.name||info.motionPart||node.name;
    parts.push({id:info.motionMuscle||info.muscleId,atlasId:atlas?.id||null,name:displayName,
     node:node.name,side,region,asset:file,...inspectSkin(node,doc,bin,lib,decoder),...evidence});
   }
  }
 }finally{lib.destroy(decoder);}
 return parts;
}

function partsByName(parts){
 const index=new Map();
 for(const part of parts)for(const name of [part.name,part.sourceName,part.muscleName]){
  const key=muscleTermKey(name);
  if(!index.has(key))index.set(key,new Map());
  index.get(key).set(part.id,part);
 }
 return name=>[...(index.get(muscleTermKey(name))?.values()||[])];
}

function staticInventory(){
 const delivered=new Map();
 for(const {file} of Object.values(manifest.assets)){
  for(const node of glb(file).doc.nodes||[]){
   if(node.mesh===undefined||!node.extras?.muscleId)continue;
   if(delivered.has(node.extras.muscleId))throw Error('Duplicate delivered muscle node: '+node.extras.muscleId);
   delivered.set(node.extras.muscleId,file);
  }
 }
 return manifest.components.filter(c=>!c.retired&&c.kind==='muscle').map(part=>{
  const file=delivered.get(part.id);
  if(!file)throw Error('Active atlas part missing from the delivery model: '+part.id);
  return {...part,asset:file};
 });
}

function bucketFor(side){return sides.includes(side)?side:'other';}

function atlasDetail(part,role){
 return {id:part.id,name:part.geometryReview?.displayName||part.name,side:part.side,asset:part.asset,role,
  group:part.muscleName===part.name?undefined:part.muscleName,
  depth:part.depth!=='unassigned'?part.depth:undefined,
  note:part.geometryReview?.note||undefined};
}

function bySide(list){
 const buckets=blankSides();
 for(const part of list)buckets[bucketFor(part.side)].push(part);
 for(const side of sides)buckets[side].sort(byLabel);
 return buckets;
}

function sideStatus(row,groups){
 const expected=expectedBuckets[row.expectedSides];
 return Object.fromEntries(sides.map(side=>{
  const present=groups.filter(group=>{
   const pair=side==='midline'&&row.expectedSides==='midline'&&
    ['left','right'].every(half=>group.some(part=>part.side===half));
   return pair||group.some(part=>bucketFor(part.side)===side||
    part.side==='bilateral'&&row.expectedSides==='left-and-right'&&expected.includes(side));
  }).length;
  const candidate=row.atlas[side].some(part=>part.role==='candidate');
  return [side,present?(present<groups.length||unconfirmed.includes(row.atlasStatus)?'partial':'present'):
   candidate?'candidate':expected.includes(side)?'not-found':'not-applicable'];
 }));
}

function referenceStatus(item,groups){
 if(item.reviewStatus)return item.status;
 if(item.status==='no-named-mesh'&&groups.some(group=>group.length))return 'partial-model';
 if(item.status==='side-review'){
  const [side]=expectedBuckets[item.expectedSides];
  const expectsOneSide=['left-only','right-only'].includes(item.expectedSides);
  if(item.expectedSides==='unspecified'||expectsOneSide&&groups.every(group=>group.some(part=>part.side===side))){
   return item.requiredGroups?'represented-by-components':'named-geometry';
  }
 }
 return item.status;
}

export async function buildCoverage(){
 const staticParts=staticInventory(),exactID=new Map(staticParts.map(part=>[part.id,part])),findName=partsByName(staticParts);
 const motion=await motionParts(exactID), foundAtlas=new Set(),foundMotion=new Set();
 const rows=[];
 function rowFor({id,name,region,ta2=null,origin,expectedSides='unspecified',entryType,note,variant=false,sexScope,atlasStatus,componentOf,groups,candidates=[],directMotion=[]}){
  const matches=new Map(groups.flat().map(part=>[part.id,part]));
  const unresolved=candidates.filter(part=>!matches.has(part.id));
  for(const part of [...matches.values(),...unresolved])foundAtlas.add(part.id);
  const animated=motion.filter(part=>matches.has(part.atlasId)||directMotion.includes(part));
  for(const part of animated)foundMotion.add(part);
  const row={id,name,region,ta2,origin,course:false,variant,sexScope:sexScope||null,atlasStatus,expectedSides,entryType,
   atlas:bySide([...matches.values()].map(part=>atlasDetail(part,'match')).concat(unresolved.map(part=>atlasDetail(part,'candidate')))),
   motion:bySide(animated),note:note||null,componentOf:componentOf||undefined,attachmentCertified:false};
  row.atlasSides=sideStatus(row,groups);
  rows.push(row);
  return row;
 }
 const reference=auditMuscleCoverage(staticParts,referenceTerms());
 for(const item of reference.rows){
  const groups=(item.requiredGroups||[item.name]).map(name=>findName(name).filter(part=>part.geometryReview?.status!=='regional-reference'));
  rowFor({...item,origin:'reference',variant:item.inconstantInTA2,atlasStatus:referenceStatus(item,groups),
   note:item.note||item.variationNote,groups,
   candidates:(item.candidateNames||[]).flatMap(findName)});
 }

 const byMemberName=new Map();
 for(const part of staticParts){
  const key=part.region+'|'+muscleTermKey(part.name);
  if(!byMemberName.has(key))byMemberName.set(key,[]);
  byMemberName.get(key).push(part);
 }
 // Add atlas names when the reference only describes the parent/aggregate, or omits them entirely.
 for(const parts of byMemberName.values()){
  const {name,region}=parts[0];
  if(rows.some(row=>row.region===region&&muscleTermKey(row.name)===muscleTermKey(name)))continue;
  const both=parts.some(p=>p.side==='left')&&parts.some(p=>p.side==='right');
  rowFor({id:'atlas-'+region+'-'+slug(name),name,region,origin:'atlas',
   expectedSides:both?'left-and-right':'unspecified',entryType:'atlas-named-part',
   componentOf:namedSeries.get(muscleTermKey(name)),atlasStatus:'source-inventory',groups:[parts]});
 }

 const sameMembers=(row,ids)=>{
  if(!ids.length)return false;
  const matches=sides.flatMap(side=>row.atlas[side]).filter(part=>part.role==='match').map(part=>part.id);
  return matches.length===ids.length&&matches.every(id=>ids.includes(id));
 };
 for(const target of courseMuscleTargets.filter(item=>item.card.kind!=='connective tissue')){
  const components=target.componentIds.map(id=>exactID.get(id)).filter(Boolean);
  const ids=components.map(c=>c.id);
  const perfectName=rows.filter(row=>row.region===target.region&&muscleTermKey(row.name)===muscleTermKey(target.name));
  const exactMembers=rows.filter(row=>row.region===target.region&&sameMembers(row,ids));
  const preferred=perfectName.find(row=>row.origin==='reference')||perfectName[0]||
   (exactMembers.length===1?exactMembers[0]:null);
  const status={missing:'no-named-mesh',partial:'partial-model',review:'needs-anatomical-review',serial:'represented-by-components',composite:'represented-by-components',named:'named-geometry'}[target.status];
  if(!status)throw Error('Unknown course-muscle coverage status: '+target.status+' / '+target.id);
  const row=preferred||rowFor({id:'course-'+target.id,name:target.name,region:target.region,origin:'course',
   atlasStatus:status,expectedSides:'unspecified',entryType:'course-target',note:target.note,groups:[components]});
  row.course=true;
  row.courseTargets=[...(row.courseTargets||[]),{id:target.id,name:target.courseName,status:target.status,note:target.note||undefined}];
 }

 // Keep newly recovered surfaces visible in the inventory even before their reference-name mapping is reviewed.
 for(const part of motion)if(!foundMotion.has(part)){
  rowFor({id:'motion-'+part.region+'-'+part.side+'-'+slug(part.name),name:part.name,region:part.region,origin:'motion',
   atlasStatus:'no-named-mesh',entryType:'motion-inventory',note:'Motion mesh present. Atlas/reference identity still needs review.',
   groups:[],directMotion:[part]});
 }

 const census={};
 for(const row of rows.filter(row=>row.origin==='reference')){
  census[row.atlasStatus]=(census[row.atlasStatus]||0)+1;
 }
 const counts={
  entries:rows.length,referenceEntries:reference.referenceChecks,
  atlasOnlyEntries:rows.filter(row=>row.origin==='atlas').length,
  courseEntries:rows.filter(row=>row.course).length,
  courseTargets:rows.reduce((n,row)=>n+(row.courseTargets?.length||0),0),
  atlasMuscleParts:staticParts.length,motionMuscleParts:motion.length,
  walkMuscleParts:motion.filter(part=>part.modes.includes('walk')).length,
  census,
  referenceConfirmed:rows.filter(row=>row.origin==='reference'&&atlasConfirmed.includes(row.atlasStatus)).length,
  referenceOpen:rows.filter(row=>row.origin==='reference'&&!atlasConfirmed.includes(row.atlasStatus)).length,
 };
 if(foundAtlas.size!==staticParts.length||foundMotion.size!==motion.length)throw Error('Coverage inventory dropped a shipped muscle part.');
 if(new Set(rows.map(row=>row.id)).size!==rows.length)throw Error('Coverage row IDs are not unique.');
 rows.sort(byLabel);
 return {
  schema:1,
  scope:'This checklist audits FIPAT skeletal-muscle names across body regions, including named subdivisions, variants and selected groups. It also tracks BI 231 targets and every named muscle part in Osteon’s delivered atlas and motion rigs. Entries, sides and mesh parts count different things. Source names alone do not verify anatomical attachments or motion.',
  sources,counts,rows,
 };
}

function serialize(data){
 const {rows,...header}=data;
 return JSON.stringify(header,null,2).slice(0,-2)+',\n  "rows": [\n'+rows.map(row=>'    '+JSON.stringify(row)).join(',\n')+'\n  ]\n}\n';
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const data=await buildCoverage(),expected=serialize(data);
 if(process.argv.includes('--check')){
  const found=readFileSync(targetURL,'utf8').replaceAll('\r\n','\n');
  if(found!==expected)throw Error('Motion coverage is out of date. Run node scripts/build-motion-coverage.mjs.');
 }else writeFileSync(targetURL,expected);
 console.log(JSON.stringify(data.counts));
}
