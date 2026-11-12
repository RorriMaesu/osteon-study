export const EXPOSURE_KEY='osteon-question-exposure-v1';
export function validExposure(x){return x===null||!!x&&!Array.isArray(x)&&Object.keys(x).length<=5000&&Object.entries(x).every(([id,v])=>/^(?:ex|mx|transfer|q|atlas12|cellstudio|tissuestudio|lamina|fracture)-[a-z0-9.-]+$/.test(id)&&v&&Number.isInteger(v.count)&&v.count>=1&&v.count<=100000&&Number.isFinite(v.at));}
export function readExposure(storage){try{const x=JSON.parse(storage.getItem(EXPOSURE_KEY));return validExposure(x)?x||{}:{};}catch{return {};}}
export function markExposure(storage,session,id,now=Date.now()){
 session.presented||={};session.exposure||={};if(session.presented[id])return session.exposure[id]||0;
 const data=readExposure(storage),before=data[id]?.count||0;session.exposure[id]=before;session.presented[id]=now;data[id]={count:Math.min(100000,before+1),at:now};try{storage.setItem(EXPOSURE_KEY,JSON.stringify(data));}catch{}return before;
}
export const exposureCount=(seen,id)=>seen instanceof Set?Number(seen.has(id)):typeof seen?.[id]==='number'?seen[id]:seen?.[id]?.count||0;
