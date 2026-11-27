export function shuffle(items,random=Math.random){
  const out=items.slice();
  for(let i=out.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[out[i],out[j]]=[out[j],out[i]];}
  return out;
}
export function newPractical(stations,random=Math.random){
  const order=shuffle(stations.map(entry=>Array.isArray(entry)?entry[Math.floor(random()*entry.length)]:entry),random);
  return {id:crypto.randomUUID(),started:Date.now(),items:order.map(s=>({
    station:s.id, parts:shuffle(s.parts.map((_,i)=>i),random), choices:shuffle(s.options.map((_,i)=>i),random),
    angle:(random()-.5)*.7,answers:[null,null,null],methods:[null,null,null]
  })),index:0};
}
export function practicalScores(run){
  return [0,1,2].map(i=>run.items.filter(v=>v.result?.[i]?.correct).length);
}
export function markStation(item,spec){
  if(item.result||item.answers.includes(null))return false;
  item.result=item.answers.map((v,i)=>({
    prompt:i<2?spec.tasks[i].prompt:spec.question,
    chosen:i<2?spec.parts[v].label:spec.options[v],
    expected:i<2?spec.parts[spec.tasks[i].answer].label:spec.options[0],
    correct:i<2?v===spec.tasks[i].answer:v===0
  }));
  item.note=spec.why;item.title=spec.title;item.lesson=spec.lesson;return true;
}
const date=value=>Number.isSafeInteger(value)&&value>=0;
const short=(value,length=650)=>typeof value==='string'&&value.length>0&&value.length<=length;
const seq=arr=>Array.isArray(arr)&&arr.length>=2&&arr.length<=20&&new Set(arr).size===arr.length&&arr.every(v=>Number.isInteger(v)&&v>=0&&v<arr.length);
export function validPractical(run,complete){
  if(!run||!short(run.id,100)||!/^[-\w]+$/.test(run.id)||!date(run.started)||!Array.isArray(run.items)||!run.items.length||run.items.length>50||
      !Number.isInteger(run.index)||run.index<0||run.index>=run.items.length||new Set(run.items.map(x=>x?.station)).size!==run.items.length||
      (complete?!date(run.submitted):run.submitted!==undefined))return false;
  return run.items.every((v,n)=>{
    if(!v||!short(v.station,80)||!/^[-\w]+$/.test(v.station)||!seq(v.parts)||!seq(v.choices)||!Number.isFinite(v.angle)||Math.abs(v.angle)>Math.PI||
        !Array.isArray(v.answers)||v.answers.length!==3||!Array.isArray(v.methods)||v.methods.length!==3)return false;
    if(!v.answers.every((a,i)=>a===null?v.methods[i]===null:(i===2?v.choices:v.parts).includes(a)&&(i===2?v.methods[i]==='choice':['model','description'].includes(v.methods[i]))))return false;
    if(!v.result)return !complete&&n>=run.index;
    return v.answers.every(a=>a!==null)&&Array.isArray(v.result)&&v.result.length===3&&v.result.every(x=>x&&short(x.prompt)&&short(x.chosen)&&short(x.expected)&&typeof x.correct==='boolean'&&x.correct===(x.chosen===x.expected))&&short(v.note,1250)&&short(v.title,150)&&/^\d+\.\d+\/activity(?:\/[\w-]+)?$/.test(v.lesson);
  });
}
