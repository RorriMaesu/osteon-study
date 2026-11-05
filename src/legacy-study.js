import {examBank} from './exam-bank.js';
import {STORAGE_KEY,blankProgress,validProgress} from './storage.js';

const questions=new Map(examBank.map(q=>[q.id,q]));
const read=(storage,key)=>{try{return JSON.parse(storage.getItem(key));}catch{return null;}};
const entries=value=>value&&typeof value==='object'&&!Array.isArray(value)?Object.entries(value):[];
const sources=[
 {key:'soma-cell-studio-v1',prefix:'cellstudio-',time:'updatedAt',name:'Cell Studio'},
 {key:'soma-tissue-studio-v1',prefix:'tissuestudio-',time:'updatedAt',name:'Tissue Studio'},
 {key:'lamina.study.v1',prefix:'lamina-',time:'lastSeen',name:'Lamina'}
];
const fractureSource={key:'fracture-lab-fallback',prefix:'fracture-',name:'Fracture Lab'};
const validDate=value=>Number.isFinite(value)&&value>0&&value<=8640000000000000;
function item(prefix,id,correct,assisted,at,token){
 const q=questions.get(prefix+id.replaceAll('/','-'));
 if(!q||typeof correct!=='boolean'||!validDate(at))return null;
 return {id:q.id,topic:'Chapter '+q.lesson.split('.')[0],correct,assisted:assisted===true,at,mode:'legacy-import',attemptKey:'legacy:'+q.id+':'+token};
}
function latestStats(source,data){
 return entries(data?.stats).map(([id,s])=>item(source.prefix,id,s?.lastCorrect,s?.assisted,s?.[source.time],s?.[source.time])).filter(Boolean);
}
function fractureAttempts(data){
 if(!Array.isArray(data?.attempts)||data.attempts.length>2000)return [];
 const found=[];
 for(const record of data.attempts){
  if(typeof record?.id!=='string'||!/^[a-zA-Z0-9_-]{1,200}$/.test(record.id)||!Array.isArray(record.items)||record.items.length>100)continue;
  const date=Date.parse(record.completed||'');
  if(!validDate(date))continue;
  for(const q of record.items){
   if(typeof q?.id!=='string')continue;
   const result=record.responses?.[q.id];
   if(result?.grade?.status!=='graded'||!Number.isFinite(result.grade.points)||result.grade.points<0||result.grade.points>1||result.selfAssessed)continue;
   const entry=item('fracture-',q.id,result.grade.points===1,result.hints>0||result.grade.method==='ai',date,record.id);
   if(entry)found.push(entry);
  }
 }
 return found;
}
export function legacyFileKind(value){
 if(value?.version===1&&Array.isArray(value.history)&&Array.isArray(value.notes)&&value.stats&&typeof value.stats==='object'&&!Array.isArray(value.stats))return 'lamina';
 if(value?.schema===1&&typeof value.exported==='string'&&Array.isArray(value.attempts)&&value.attempts.length<=2000)return 'fracture';
 return '';
}
export function previewLegacyStudy(storage,file=null){
 const raw=storage.getItem(STORAGE_KEY);
 const existing=read(storage,STORAGE_KEY);
 if(raw!==null&&!validProgress(existing))throw new Error('The current Osteon progress could not be read safely. Export it before importing.');
 const progress=existing||blankProgress();
 const counts={},incoming=[];
 const add=(name,rows)=>{counts[name]=rows.length;incoming.push(...rows);};
 let due=[];
 if(file){
  const kind=legacyFileKind(file);
  if(kind==='lamina')add('Lamina',latestStats(sources[2],file));
  else if(kind==='fracture')add('Fracture Lab',fractureAttempts(file));
  else throw new Error('Choose an original Lamina or Fracture Lab JSON export.');
 }else{
  for(const source of sources)add(source.name,latestStats(source,read(storage,source.key)));
  add(fractureSource.name,fractureAttempts(read(storage,fractureSource.key)));
  const misses=read(storage,'ap_v2_missed');
  if(Array.isArray(misses)){
   const already=new Set(progress.attempts.map(a=>a.id));
   due=[...new Set(misses.filter(id=>['string','number'].includes(typeof id)).map(id=>'atlas12-'+id))].filter(id=>questions.has(id)&&!already.has(id)&&!Object.hasOwn(progress.cards,id));
  }
 }
 const seen=new Set(progress.attempts.map(a=>a.attemptKey)),added=[];
 for(const entry of incoming){if(seen.has(entry.attemptKey))continue;seen.add(entry.attemptKey);added.push(entry);}
 if(progress.attempts.length+added.length>10000)throw new Error('The merged progress would exceed the storage limit. Keep a separate backup of the earlier records.');
 return {counts,added,due,progress};
}
export function mergeLegacyStudy(storage,file=null,now=Date.now()){
 const result=previewLegacyStudy(storage,file);
 if(!result.added.length&&!result.due.length)return result;
 const {progress}=result;
 progress.attempts=[...progress.attempts,...result.added].sort((a,b)=>a.at-b.at);
 const latest=new Map(progress.attempts.map(a=>[a.id,a]));
 for(const a of result.added){
  if(latest.get(a.id)!==a||a.correct&&!a.assisted||Object.hasOwn(progress.cards,a.id))continue;
  progress.cards[a.id]={due:now,interval:0};
 }
 for(const id of result.due)progress.cards[id]={due:now,interval:0};
 if(!validProgress(progress))throw new Error('These records could not be merged safely.');
 try{storage.setItem(STORAGE_KEY,JSON.stringify(progress));}
 catch{throw new Error('There is not enough browser storage to merge these records.');}
 return result;
}

export function showLegacyStudyImport({dialog,file=null,escape:e}){
 function display(){
  const p=previewLegacyStudy(localStorage,file),total=p.added.length+p.due.length;
  dialog(`<h2>Import earlier study progress</h2><p>Preview the records available ${file?'in this export':'in this browser'}. Import adds matching scored records and missed trainer cards to Osteon. Earlier exam drafts stay in their original apps.</p><ul>${Object.entries(p.counts).map(([source,n])=>`<li>${e(source)} · ${n} matching scored records</li>`).join('')}${file?'':`<li>Anatomy Exam Trainer · ${p.due.length} new review cards</li>`}</ul><p>${p.added.length} new scores and ${p.due.length} new review cards are ready to add.</p>${total?'<button class="primary" id="legacy-merge">Merge and reload</button>':''}${file?'':'<p>To import from another browser or Fracture Lab’s database, export JSON in the original app and choose it here.</p><label for="legacy-file">Lamina or Fracture Lab export</label> <input id="legacy-file" type="file" accept="application/json,.json">'}<p id="legacy-status" role="status"></p>`);
  const status=document.querySelector('#legacy-status');
  document.querySelector('#legacy-merge')?.addEventListener('click',()=>{try{mergeLegacyStudy(localStorage,file);location.reload();}catch(err){status.textContent=err.message;}});
  document.querySelector('#legacy-file')?.addEventListener('change',async ev=>{
   const selected=ev.target.files[0];if(!selected)return;
   try{if(selected.size>15e6)throw new Error('Choose an export smaller than 15 MB.');file=JSON.parse(await selected.text());display();}
   catch(err){file=null;status.textContent=err.message;}
  });
 }
 display();
}
