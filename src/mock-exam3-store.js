import {validMockSession} from './mock-exam3-core.js';

export const MOCK_EXAM3_STORAGE_KEY='osteon-mock-exam3-v1';
export const blankMockState=()=>({schema:1,active:null,history:[],notes:{},card:{front:Array(24).fill(''),back:Array(24).fill('')}});
const record=x=>!!x&&typeof x==='object'&&!Array.isArray(x)&&Object.getPrototypeOf(x)!==Array.prototype;
const safeKey=k=>/^[a-zA-Z0-9:_-]{1,220}$/.test(k)&&!['__proto__','constructor','prototype'].includes(k);
export function validMockState(x){
 if(!record(x)||x.schema!==1||!Array.isArray(x.history)||x.history.length>20||!x.history.every(s=>validMockSession(s)&&s.status==='submitted'))return false;
 if(new Set(x.history.map(s=>s.id)).size!==x.history.length)return false;
 if(x.active!==null&&(!validMockSession(x.active)||x.active.status!=='draft'))return false;
 if(!record(x.notes)||Object.keys(x.notes).length>1200||!record(x.card))return false;
 if(!['front','back'].every(side=>Array.isArray(x.card[side])&&x.card[side].length===24&&x.card[side].every(t=>typeof t==='string'&&t.length<=180)))return false;
 return Object.entries(x.notes).every(([key,n])=>safeKey(key)&&record(n)&&['confusion','rule','retrieval'].every(k=>typeof n[k]==='string'&&n[k].length<=2000)&&Number.isFinite(n.updatedAt)&&n.updatedAt>=0&&
  (n.cardDraft===undefined||typeof n.cardDraft==='string'&&n.cardDraft.length<=180)&&
  (n.cardSide===undefined||['front','back'].includes(n.cardSide)));
}
export function readMockState(storage){
 const raw=storage.getItem(MOCK_EXAM3_STORAGE_KEY);
 if(raw===null)return blankMockState();
 const value=JSON.parse(raw);
 if(!validMockState(value))throw new Error('The saved mock-exam record could not be read. Export your browser data before starting again.');
 return value;
}
export function writeMockState(storage,state){
 if(!validMockState(state))throw new Error('This mock-exam record is not valid. Your previous saved work has been kept.');
 storage.setItem(MOCK_EXAM3_STORAGE_KEY,JSON.stringify(state));
}
export function mockBackup(state,now=Date.now()){
 if(!validMockState(state))throw new Error('Cannot export an invalid mock exam.');
 return {kind:'osteon-exam3-backup',schema:1,createdAt:now,state:structuredClone(state)};
}
export function parseMockBackup(value){
 if(!value||value.kind!=='osteon-exam3-backup'||value.schema!==1||!Number.isFinite(value.createdAt)||value.createdAt<0||!validMockState(value.state))throw new Error('Choose a valid Osteon Exam 3 backup. Nothing has been changed.');
 return structuredClone(value.state);
}
export function addCardCandidate(card,text,side='front'){
 const clean=String(text).trim().slice(0,180);
 if(!clean)throw new Error('Write a note before adding it to your card.');
 if(!['front','back'].includes(side))throw new Error('Choose a side for your card.');
 if([...card.front,...card.back].some(x=>x.trim().toLowerCase()===clean.toLowerCase()))return {card,duplicate:true};
 const index=card[side].findIndex(x=>!x.trim());
 if(index<0)throw new Error('This side has 24 notes. Choose the other side or replace a line in the card planner.');
 const next=structuredClone(card);next[side][index]=clean;
 return {card:next,side,index,duplicate:false};
}
export function cardText(card){return ['EXAM 3 - FRONT',...card.front.map((s,i)=>`${String(i+1).padStart(2,'0')} ${s}`),'','EXAM 3 - BACK',...card.back.map((s,i)=>`${String(i+1).padStart(2,'0')} ${s}`)].join('\n');}
