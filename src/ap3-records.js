import {validatedBackup} from './ap3-backup.js';
export const springPrefix='osteon-ap3-v1:';
const prefix=springPrefix;
const idPattern=/^[a-z0-9-]{1,70}$/i;
const pass=status=>status==='correct'||status==='spelling';
export {pass};
export function shouldRestoreCourseRecord(key,current,value){
  if(!current)return true;
  if(key.startsWith('mechanism:'))return value.at<current.at;
  if(key.startsWith('recovery:'))return value.passed&&!current.passed||value.passed===current.passed&&value.at>current.at;
  if(key.startsWith('wording:'))return value.at>current.at;
  if(key.startsWith('run:'))return !current.submitted&&Boolean(value.submitted);
  if(key.startsWith('mock:')){
    if(!current.submitted&&value.submitted)return true;
    if(Boolean(current.submitted)!==Boolean(value.submitted)||(value.updated||0)<=(current.updated||0))return false;
    return !current.submitted||current.submitted===value.submitted&&JSON.stringify(current.answers)===JSON.stringify(value.answers)&&JSON.stringify(current.grades)===JSON.stringify(value.grades);
  }
  return (key.startsWith('study:')||key.startsWith('check:'))&&value.at>current.at;
}
export function springStore(storage,warn=()=>{}){
  const cache=new Map(),unsaved=new Set();
  let volatile=!storage;
  function read(key){
    if(storage&&!unsaved.has(key))try{
      const raw=storage.getItem(prefix+key);
      if(raw===null){cache.delete(key);return null;}
      const entry=JSON.parse(raw);cache.set(key,entry);
    }catch{ /* Other valid records remain readable if one record is damaged. */ }
    return cache.get(key)||null;
  }
  function write(key,value){
    if(storage)try{storage.setItem(prefix+key,JSON.stringify(value));unsaved.delete(key);volatile=unsaved.size>0;}catch{unsaved.add(key);if(!volatile)warn('Browser storage is full or unavailable. Download your spring backup before closing this tab.');volatile=true;}
    cache.set(key,value);return value;
  }
  function entries(){
    if(storage)try{for(let i=0;i<storage.length;i++){
      const key=storage.key(i);if(key?.startsWith(prefix)&&!cache.has(key.slice(prefix.length))){
        read(key.slice(prefix.length));
      }
    }}catch{}
    return [...cache.keys()].map(key=>[key,read(key)]).filter(([,v])=>v);
  }
  function attempts(){return entries().filter(([k])=>k.startsWith('run:')).map(([,v])=>v).sort((a,b)=>b.created-a.created);}
  function mocks(){return entries().filter(([k])=>k.startsWith('mock:')).map(([,v])=>v);}
  function start(mode,scope,items){
    const id=crypto.randomUUID();
    return write('run:'+id,{id,version:1,mode,scope,created:Date.now(),items,answers:items.map(()=>null),index:0});
  }
  function update(id,change){
    if(!idPattern.test(id))return;
    const run=read('run:'+id);if(!run||run.submitted)return run;
    change(run);run.updated=Date.now();return write('run:'+id,run);
  }
  function backup(){return {course:'ap3',version:1,records:Object.fromEntries(entries())};}
  function restore(file){
    const entries=validatedBackup(file);let merged=0;
    for(const [key,value] of entries){
      const current=read(key);
      if(shouldRestoreCourseRecord(key,current,value)){
        write(key,value);merged++;
      }
    }
    return merged;
  }
  return {read,write,attempts,mocks,start,update,backup,restore,get volatile(){return volatile;},getRun:id=>idPattern.test(id)?read('run:'+id):null};
}
