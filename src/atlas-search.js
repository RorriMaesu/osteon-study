import {editDistance} from './typed-answer.js';

const normalize=value=>String(value||'').normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();

export function atlasMatches(terms,input){
 const q=normalize(input);
 if(!q)return terms;
 return terms.map(term=>{
  const name=normalize(term.name),aliases=(term.aliases||[]).map(normalize),words=[name,...aliases];
  const score=name===q?0:aliases.includes(q)?1:words.some(word=>word.startsWith(q))?2:words.some(word=>word.includes(q))?3:normalize(term.cue).includes(q)?4:Infinity;
  return {term,score};
 }).filter(({score})=>Number.isFinite(score)).sort((a,b)=>a.score-b.score).map(({term})=>term);
}

export function atlasSuggestions(terms,input){
 const q=normalize(input);
 if(q.length<4||q.length>80)return [];
 const limit=q.length<7?1:2;
 return terms.map(term=>{
  const candidates=[term.name,...(term.aliases||[])].map(label=>({label,value:normalize(label)})).filter(({value})=>Math.abs(value.length-q.length)<=limit);
  const best=candidates.map(({label,value})=>({label,distance:editDistance(q,value)})).sort((a,b)=>a.distance-b.distance)[0];
  return {term,...best};
 }).filter(result=>result.distance<=limit).sort((a,b)=>a.distance-b.distance||a.term.name.localeCompare(b.term.name)).slice(0,3);
}

