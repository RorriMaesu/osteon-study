import {chapter11Muscles} from './chapter11-muscles.js';
import {editDistance} from './typed-answer.js';

const normalize=value=>String(value??'').normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase()
 .replace(/[^a-z0-9]+/g,' ').trim();
const words=value=>normalize(value).split(' ').filter(word=>word&&word!=='muscle'&&word!=='muscles');
const canonical=value=>words(value).join(' ');
const aliases=new Map(chapter11Muscles.map(muscle=>[canonical(muscle.name),muscle.aliases||[]]));
const shortcuts={
 'biceps brachii':['bicep','biceps'],'triceps brachii':['tricep','triceps'],
 sternocleidomastoid:['scm'],gastrocnemius:['gastroc','calf'],
 soleus:['calf'],'latissimus dorsi':['lat','lats'],'trapezius':['trap','traps'],
 'pectoralis major':['pec','pecs'],'rectus abdominis':['abs'],
 'gluteus maximus':['glute','glutes'],'gluteus medius':['glute','glutes'],'gluteus minimus':['glute','glutes'],
 'biceps femoris':['hamstring'],'semitendinosus':['hamstring'],'semimembranosus':['hamstring'],
};
const sides=new Map([['left','left'],['right','right'],['l','left'],['r','right'],['midline','midline'],['bilateral','bilateral']]);

export function indexMotionMuscles(entries,partFor=entry=>entry){
 return entries.map(entry=>{
  const part=partFor(entry),name=part.name,side=normalize(part.side);
  const key=canonical(part.muscleName||name);
  const names=[canonical(name),key,...(aliases.get(key)||[]).map(canonical),...(shortcuts[key]||[])].filter(Boolean);
  const forms=[...new Set(names)].map(name=>({name,words:name.split(' ')}));
  return {entry,name,side,forms};
 }).sort((a,b)=>a.name.localeCompare(b.name)||a.side.localeCompare(b.side));
}

function matchForm(form,terms,joined){
 if(form.name===joined)return 0;
 let score=0;
 for(const term of terms){
  if(form.words.includes(term))continue;
  if(term.length>=2&&form.words.some(word=>word.startsWith(term))){score+=1;continue;}
  if(term.length<4)return Infinity;
  const limit=term.length<8?1:2;
  let best=Infinity;
  for(const word of form.words){
   if(word.length>=4&&Math.abs(word.length-term.length)<=limit)best=Math.min(best,editDistance(term,word));
  }
  if(best>limit)return Infinity;
  score+=10+best;
 }
 return 1+score;
}

export function searchMotionMuscles(index,query){
 const tokens=words(query);
 const requestedSides=new Set(tokens.filter(token=>sides.has(token)).map(token=>sides.get(token)));
 const terms=tokens.filter(token=>!sides.has(token)),joined=terms.join(' ');
 const results=[];
 for(const item of index){
  if(requestedSides.size&&!requestedSides.has(item.side))continue;
  let score=terms.length?Infinity:0;
  for(const form of item.forms)if(terms.length)score=Math.min(score,matchForm(form,terms,joined));
  if(Number.isFinite(score))results.push({entry:item.entry,score});
 }
 const hasDirect=results.some(result=>result.score<10);
 return results.filter(result=>!hasDirect||result.score<10).sort((a,b)=>a.score-b.score)
  .map(result=>({entry:result.entry,close:result.score>=10}));
}
