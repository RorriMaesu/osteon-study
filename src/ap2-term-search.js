import {editDistance} from './typed-answer.js';

const normalize=value=>String(value??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\.(?!\d)|[^a-z0-9.]+/g,' ').replace(/\s+/g,' ').trim();
const tokens=value=>normalize(value).split(/\s+/).filter(Boolean);

// Prepare searchable text once per screen. Keep corrections explicit and inside the selected scope.
export function makeCourseSearch(rows){
  const index=rows.map(row=>{
    const title=normalize(row.title),body=normalize([row.title,row.text??row.terms,row.section].join(' '));
    return {row,title,body};
  });
  return (query,include=()=>true)=>{
    const scoped=index.filter(entry=>include(entry.row));
    const words=tokens(query);
    if(!words.length)return {items:scoped.map(entry=>entry.row),suggestion:''};
    function find(terms){
      return scoped.filter(entry=>terms.every(word=>entry.body.includes(word)))
        .map(entry=>({row:entry.row,score:terms.reduce((score,word)=>score+Number(entry.title.includes(word)),0)}))
        .sort((a,b)=>b.score-a.score).map(match=>match.row);
    }
    const exact=find(words);
    if(exact.length)return {items:exact,suggestion:''};
    const vocabulary=new Set(scoped.flatMap(entry=>entry.body.split(' ')));
    const corrected=words.map(word=>{
      if(word.length<4||word.length>40||scoped.some(entry=>entry.body.includes(word)))return word;
      let best='',distance=word.length>=8?3:2,tie=false;
      for(const candidate of vocabulary){
        if(Math.abs(candidate.length-word.length)>distance||!candidate)continue;
        const d=editDistance(word,candidate);
        if(d<distance){best=candidate;distance=d;tie=false;}
        else if(d===distance&&best)tie=true;
      }
      return best&&!tie?best:word;
    });
    const suggestion=corrected.join(' ');
    if(suggestion===words.join(' '))return {items:[],suggestion:''};
    const items=find(corrected);
    return {items,suggestion:items.length?suggestion:''};
  };
}
