import {isLessonId} from './chapters.js';
import {exposureCount} from './exam-exposure.js';
// Weighted deficit allocation with capacity redistribution. Never duplicates an item.
export function weightedPractice(bank,weights,count=50,{seen={},rng=Math.random}={}){
 if(!Number.isInteger(count)||count<1||count>100)throw Error('Choose 1–100 questions.');
 const groups=Object.entries(weights).filter(([id,w])=>(isLessonId(id)||/^(6|7|8|9|10)$/.test(id))&&Number.isFinite(w)&&w>0).map(([id,w])=>({id,w,pool:bank.filter(q=>id.includes('.')?q.lesson===id:q.lesson.split('.')[0]===id).map(q=>({q,tie:rng()})).sort((a,b)=>exposureCount(seen,a.q.id)-exposureCount(seen,b.q.id)||a.tie-b.tie).map(x=>x.q),quota:0}));
 if(!groups.length)throw Error('Give at least one chapter or section a positive weight.');
 const sum=groups.reduce((n,g)=>n+g.w,0),selected=[],ids=new Set();
 for(let i=0;i<count;i++){const available=groups.filter(g=>g.pool.some(q=>!ids.has(q.id)));if(!available.length)break;available.sort((a,b)=>((i+1)*b.w/sum-b.quota)-((i+1)*a.w/sum-a.quota));const group=available[0],q=group.pool.find(q=>!ids.has(q.id));group.quota++;selected.push(q);ids.add(q.id);}
 return selected.map(q=>({q,tie:rng()})).sort((a,b)=>a.tie-b.tie).map(x=>x.q);
}
