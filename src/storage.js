export const STORAGE_KEY='osteon-study-v1';
export const blankProgress=()=>({schema:1,attempts:[],cards:{},lessons:{}});
export function validProgress(x){return !!x&&x.schema===1&&Array.isArray(x.attempts)&&x.attempts.length<=50000&&x.attempts.every(a=>a&&typeof a.id==='string'&&typeof a.topic==='string'&&typeof a.correct==='boolean'&&typeof a.assisted==='boolean'&&typeof a.mode==='string'&&Number.isFinite(a.at))&&x.cards&&typeof x.cards==='object'&&!Array.isArray(x.cards)&&Object.entries(x.cards).every(([k,c])=>k!=='__proto__'&&c&&Number.isFinite(c.due)&&Number.isFinite(c.interval)&&c.interval>=0)&&x.lessons&&typeof x.lessons==='object'&&!Array.isArray(x.lessons)&&Object.values(x.lessons).every(v=>typeof v==='boolean');}
let progress=blankProgress(),storageAvailable=true;
try{const saved=JSON.parse(localStorage.getItem(STORAGE_KEY));if(validProgress(saved))progress=saved;}catch{storageAvailable=false;}
export const getProgress=()=>progress;
export function save(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(progress));return true;}catch{storageAvailable=false;document.dispatchEvent(new Event('storagefailed'));return false;}}
export const hasStorage=()=>storageAvailable;
export function recordAttempt({id,topic,correct,assisted=false,mode,selfRated=false}){const a={id,topic,correct:!!correct,assisted:!!assisted,mode,selfRated,at:Date.now()};progress.attempts.push(a);if(progress.attempts.length>10000)progress.attempts=progress.attempts.slice(-10000);if(!correct||assisted)progress.cards[id]={due:Date.now(),interval:0};save();return a;}
export function scheduleCard(id,rating,now=Date.now()){const prev=progress.cards[id]?.interval||0;const interval=rating===1?10/1440:rating===2?1:rating===3?Math.min(90,prev>=1?Math.max(3,prev*2.5):1):Math.min(120,prev>=1?Math.max(7,prev*3):4);progress.cards[id]={due:now+interval*86400000,interval};save();return interval;}
export function markLesson(id){progress.lessons[id]=true;save();}
export function importProgress(x){if(!validProgress(x))throw new Error('Choose a valid Osteon progress backup.');progress=JSON.parse(JSON.stringify(x));save();}
export function resetProgress(){progress=blankProgress();save();}
export function objectiveStats(attempts=progress.attempts){const a=attempts.filter(x=>!x.selfRated);const independent=a.filter(x=>!x.assisted);return{total:a.length,unassisted:independent.length,correct:independent.filter(x=>x.correct).length,accuracy:independent.length?Math.round(independent.filter(x=>x.correct).length/independent.length*100):null,assisted:a.filter(x=>x.assisted).length};}
export function normalizeAnswer(s){return String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\b(the|left|right|bone|bones)\b/g,'').replace(/[^a-z0-9]/g,'').trim();}
export function acceptsAnswer(term,answer){const n=normalizeAnswer(answer);if(!n)return false;const forms=[term.name,...(term.aliases||[]),term.pattern].filter(Boolean);return forms.some(x=>normalizeAnswer(x)===n||normalizeAnswer(x.replace(/s$/,''))===n);}
export function shuffle(a){const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;}
