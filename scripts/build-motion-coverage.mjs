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

const sides=['left','right','midline','other'];
const blankSides=()=>Object.fromEntries(sides.map(side=>[side,[]]));
const slug=value=>muscleTermKey(value).replace(/ +/g,'-');
const byLabel=(a,b)=>a.name.localeCompare(b.name,'en')||a.id.localeCompare(b.id,'en');
const expectedBuckets={
 'left-and-right':['left','right'],
 midline:['midline'],
 bilateral:['other'],
 unspecified:[],
};
const atlasConfirmed=['named-geometry','represented-by-components','source-inventory'];
const unconfirmed=['needs-anatomical-review','not-separately-resolved','partial-model'];
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

function motionEvidence(file,id){
 if(/^motion-arm(?:-left)?\.glb$/.test(file)){
  return {modes:['pose','elbow-lessons'],evidence:[elbowIDs.has(id)?'textbook-contraction':'pose-context']};
 }
 if(file==='motion-legs.glb'){
  const measured=gaitIDs.has(id);
  const inHeel=heelIDs.has(id);
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
  for(const file of motionFiles().filter(name=>/^motion-[a-z0-9-]+\.glb$/.test(name)).sort()){
   const {doc,bin}=glb(file);
   for(const node of doc.nodes||[]){
    const info=node.extras;
    if(node.mesh===undefined||!info?.motionMuscle)continue;
    const atlas=byID.get(info.muscleId);
    const side=info.motionSide||info.anatomicalSide||atlas?.side;
    const region=info.muscleRegion||atlas?.region;
    if(!side||!region)throw Error(file+' motion mesh lacks side or region: '+node.name);
    parts.push({id:info.motionMuscle,atlasId:atlas?.id||null,name:atlas?.name||info.motionPart||node.name,
     node:node.name,side,region,asset:file,...inspectSkin(node,doc,bin,lib,decoder),...motionEvidence(file,info.motionMuscle)});
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
 return {id:part.id,name:part.name,side:part.side,asset:part.asset,role,
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
  const present=groups.filter(group=>group.some(part=>bucketFor(part.side)===side||
   part.side==='bilateral'&&['left','right'].includes(side)&&expected.includes(side))).length;
  const candidate=row.atlas[side].some(part=>part.role==='candidate');
  return [side,present?(present<groups.length||unconfirmed.includes(row.atlasStatus)?'partial':'present'):
   candidate?'candidate':expected.includes(side)?'not-found':'not-applicable'];
 }));
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
 const base=[...checklist.items,...heads.filter(head=>!checklist.items.some(item=>item.id===head.id))];
 const reference=auditMuscleCoverage(staticParts,base);
 for(const item of reference.rows){
  rowFor({...item,origin:'reference',variant:item.inconstantInTA2,atlasStatus:item.status,
   note:item.note||item.variationNote,groups:(item.requiredGroups||[item.name]).map(findName),
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
   atlasStatus:'source-inventory',groups:[parts]});
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

 const counts={
  entries:rows.length,referenceEntries:reference.referenceChecks,
  atlasOnlyEntries:rows.filter(row=>row.origin==='atlas').length,
  courseEntries:rows.filter(row=>row.course).length,
  courseTargets:rows.reduce((n,row)=>n+(row.courseTargets?.length||0),0),
  atlasMuscleParts:staticParts.length,motionMuscleParts:motion.length,
  census:reference.counts,
  referenceConfirmed:rows.filter(row=>row.origin==='reference'&&atlasConfirmed.includes(row.atlasStatus)).length,
  referenceOpen:rows.filter(row=>row.origin==='reference'&&!atlasConfirmed.includes(row.atlasStatus)).length,
 };
 if(foundAtlas.size!==staticParts.length||foundMotion.size!==motion.length)throw Error('Coverage inventory dropped a shipped muscle part.');
 if(new Set(rows.map(row=>row.id)).size!==rows.length)throw Error('Coverage row IDs are not unique.');
 rows.sort(byLabel);
 return {
  schema:1,
  scope:'This working checklist combines selected FIPAT skeletal-muscle terms, separately tracked heads, BI 231 targets and all named muscle parts in Osteon’s delivered atlas and motion models. Muscle names, sides and mesh parts are different units. Coverage states track geometry and evidence without certifying anatomical attachments.',
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
