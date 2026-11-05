import {divisions} from './anatomy.js';
import {regions} from './data.js';

export const QUICK_PRACTICE_KEY='osteon-quick-practice-v1';

export function readQuickPractice(storage,terms){
 try{
  const run=JSON.parse(storage.getItem(QUICK_PRACTICE_KEY));
  if(!run||typeof run.id!=='string'||!['locate','identify'].includes(run.mode)||!divisions.includes(run.division)||!regions.includes(run.region))return null;
  const {ids,index,answers,draft}=run;
  if(!Array.isArray(ids)||!ids.length||ids.length>20||!Number.isInteger(index)||index<0||index>=ids.length||!Array.isArray(answers)||answers.length<index||answers.length>index+1||typeof draft!=='string'||draft.length>160)return null;
  const byId=new Map(terms.filter(t=>t.exact&&t.type==='bone').map(t=>[t.id,t]));
  const items=ids.map(id=>byId.get(id));
  if(items.some(t=>!t)||new Set(ids).size!==ids.length||answers.some((a,i)=>!a||a.id!==ids[i]||typeof a.correct!=='boolean'||typeof a.assisted!=='boolean'||typeof a.response!=='string'))return null;
  return {...run,items};
 }catch{return null;}
}

export function writeQuickPractice(storage,run){
 if(!run){storage.removeItem(QUICK_PRACTICE_KEY);return;}
 const {id,mode,division,region,items,index,answers,assisted,draft}=run;
 storage.setItem(QUICK_PRACTICE_KEY,JSON.stringify({id,mode,division,region,ids:items.map(t=>t.id),index,answers,assisted,draft}));
}

