export function detectOS(nav=globalThis.navigator){const s=nav.userAgentData?.platform||nav.platform||nav.userAgent||'';return /win/i.test(s)?'windows':/mac/i.test(s)&&!(nav.maxTouchPoints>1)?'mac':/linux/i.test(s)&&!/android/i.test(nav.userAgent)?'linux':'other';}
export async function browserHardware(){
 const n=navigator,report={schema:1,source:'browser',os:detectOS(),threads:n.hardwareConcurrency||null,ramGB:n.deviceMemory||null,ramApproximate:true,vramGB:null,gpu:'Not exposed by this browser'};
 try{if(n.gpu){const adapter=await n.gpu.requestAdapter();if(adapter){const info=adapter.info;report.gpu=[info?.vendor,info?.architecture,info?.description].filter(Boolean).join(' · ')||report.gpu;}}}catch{}
 return report;
}
export function validateHardware(r){if(!r||r.schema!==1)throw new Error('Choose an Osteon hardware report.');const num=v=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=4096?v:null;return{schema:1,source:'imported native report',ramGB:num(r.ramGB),vramGB:num(r.vramGB),ramApproximate:r.ramApproximate===true,gpu:String(r.gpu||'Unknown').slice(0,250),threads:num(r.threads),os:['windows','mac','linux'].includes(r.os)?r.os:'other'};}
export function mergeBrowserHardware(previous,detected){
 const exactRAM=previous.ramGB>0&&!previous.ramApproximate;
 return{...detected,ramGB:exactRAM?previous.ramGB:detected.ramGB,ramApproximate:!exactRAM,vramGB:previous.vramGB??null,source:exactRAM||previous.vramGB!=null?'browser identifiers + supplied memory values':'browser'};
}
export function memoryValues(ramText,vramText){
 const parse=(raw,name,min)=>{if(!String(raw).trim())return null;const value=Number(raw);if(!Number.isFinite(value)||value<min||value>4096)throw new Error(`${name} must be between ${min} and 4096 GB, or left blank.`);return value;};
 return{ramGB:parse(ramText,'System RAM',1),vramGB:parse(vramText,'Dedicated VRAM',0)};
}
export function recommendModels(models,hardware){
 return models.filter(m=>!m.problem).map(m=>({...m,fit:modelFit(m.size,hardware)})).filter(m=>m.fit.rank>=2).sort((a,b)=>b.fit.rank-a.fit.rank||Math.abs(a.size-(a.fit.rank===3?7.5e9:3.5e9))-Math.abs(b.size-(b.fit.rank===3?7.5e9:3.5e9)));
}
export function modelFit(size,{ramGB,vramGB,ramApproximate=false}={}){
 const weights=size/1e9,needed=weights*1.25+1.5; // Reserve room for context and other GPU work; never a guarantee.
 if(vramGB&&needed<vramGB*.8)return{rank:3,label:'Promising GPU fit · test it',needed};
 if(ramGB&&!ramApproximate&&needed<Math.max(0,ramGB-5))return{rank:2,label:'Likely RAM fit · may use CPU',needed};
 if((vramGB||0)>0||(ramGB&&!ramApproximate))return{rank:0,label:'Tight or unknown fit · try a smaller model',needed};
 return{rank:1,label:'Memory unknown · run a short test',needed};
}
export const downloadModels=[{name:'qwen3.5:2b',size:2.7e9,description:'Small start · roughly 2.7–3.1 GB download. Less reliable on complex explanations.'},{name:'qwen3.5:4b',size:3.4e9,description:'Balanced start · roughly 3.3–4.0 GB download.'},{name:'qwen3.5:9b',size:6.7e9,description:'Larger option · roughly 6.6–7.6 GB download. Needs more memory.'}];
