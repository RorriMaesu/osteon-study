import {EXPOSURE_KEY,validExposure} from './exam-exposure.js';
import {LESSON_WORK_KEY,validLessonWork} from './lesson-flow.js';
import {STORAGE_KEY,blankProgress,validProgress} from './storage.js';
import {validSession} from './exam-core.js';
import {questions} from './learning-data.js';
import {LAB_TEST_KEY,validLabRun} from './lab-list.js';
import {sanitizeConversation} from './tutor-state.js';

const EXAMS='osteon-exams-v1';
const CHAT='osteon-tutor-chat-v1';
const preferences=['osteon-local-ai-v2','osteon-answer-review-v1','osteon-bone-colors','osteon-atlas-landmarks','osteon-study-plan-v1','osteon-practice-options-v1'];
const read=(storage,key,fallback=null)=>{const raw=storage.getItem(key);if(raw===null)return fallback;try{return JSON.parse(raw);}catch{return raw;}};
const safeTree=(value,depth=0)=>depth<35&&(value===null||typeof value==='boolean'||typeof value==='string'&&value.length<=100000||typeof value==='number'&&Number.isFinite(value)||Array.isArray(value)&&value.length<=50000&&value.every(v=>safeTree(v,depth+1))||typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).length<=50000&&Object.entries(value).every(([k,v])=>!['__proto__','constructor','prototype'].includes(k)&&safeTree(v,depth+1)));
function validExams(x){return x===null||!!x&&Array.isArray(x.history)&&x.history.length<=20&&x.history.every(s=>validSession(s,questions)&&s.status==='submitted')&&(!x.active||validSession(x.active,questions)&&x.active.status==='active')&&(x.archives===undefined||Array.isArray(x.archives)&&x.archives.length<=20&&safeTree(x.archives));}
function validLab(x){return x===null||!!x&&(!x.current||validLabRun(x.current))&&Array.isArray(x.history)&&x.history.length<=8&&x.history.every(validLabRun);}
export function createStudyBackup(storage,{includeChat=false,includeSettings=false,now=Date.now()}={}){
 const backup={kind:'osteon-full-backup',schema:1,createdAt:now,progress:read(storage,STORAGE_KEY,blankProgress()),exams:read(storage,EXAMS),labTest:read(storage,LAB_TEST_KEY),lessonWork:read(storage,LESSON_WORK_KEY),questionExposure:read(storage,EXPOSURE_KEY)};
 if(includeChat)backup.chat={messages:read(storage,CHAT,[]),draft:storage.getItem('osteon-tutor-draft-v1')||''};
 if(includeSettings)backup.settings=Object.fromEntries(preferences.filter(k=>storage.getItem(k)!==null).map(k=>[k,storage.getItem(k)]));
 validateStudyBackup(backup);return backup;
}
export function validateStudyBackup(x){
 if(validProgress(x))return {legacy:true,attempts:x.attempts.length,examReports:0,hasExamDraft:false,hasLabDraft:false,chat:false,settings:false};
 if(!x||x.kind!=='osteon-full-backup'||x.schema!==1||!Number.isFinite(x.createdAt)||!safeTree(x)||!validProgress(x.progress)||!validExams(x.exams)||!validLab(x.labTest)||(x.lessonWork!==undefined&&!validLessonWork(x.lessonWork))||(x.questionExposure!==undefined&&!validExposure(x.questionExposure)))throw new Error('This is not a valid complete Osteon backup. Nothing was changed.');
 if(x.chat!==undefined&&(!x.chat||!Array.isArray(x.chat.messages)||x.chat.messages.length>30||x.chat.messages.some(m=>!m||typeof m.content!=='string'||!['user','assistant'].includes(m.role))||typeof x.chat.draft!=='string'||x.chat.draft.length>1500))throw new Error('The optional chat backup is invalid.');
 if(x.settings!==undefined&&(!x.settings||Array.isArray(x.settings)||Object.entries(x.settings).some(([k,v])=>!preferences.includes(k)||typeof v!=='string'||v.length>10000)))throw new Error('The optional settings backup is invalid.');
 // Local connection preferences must never import a remote or arbitrary endpoint.
 if(x.settings?.['osteon-local-ai-v2']){const p=JSON.parse(x.settings['osteon-local-ai-v2']);if(p.endpoint&&!['http://localhost:11434','http://127.0.0.1:11434'].includes(p.endpoint))throw new Error('The backup contains an unsupported AI connection.');}
 return {legacy:false,attempts:x.progress.attempts.length,examReports:x.exams?.history?.length||0,hasExamDraft:!!x.exams?.active,hasLabDraft:!!x.labTest?.current,chat:x.chat!==undefined,settings:x.settings!==undefined};
}
export function restoreStudyBackup(storage,x){
 const preview=validateStudyBackup(x),writes=preview.legacy?[[STORAGE_KEY,JSON.stringify(x)]]:[[STORAGE_KEY,JSON.stringify(x.progress)],[EXAMS,x.exams===null?null:JSON.stringify(x.exams)],[LAB_TEST_KEY,x.labTest===null?null:JSON.stringify(x.labTest)]];
 if(x.chat)writes.push([CHAT,JSON.stringify(sanitizeConversation(x.chat.messages))],['osteon-tutor-draft-v1',x.chat.draft]);
 if(x.settings)for(const [key,value]of Object.entries(x.settings))writes.push([key,value]);
 if(x.lessonWork!==undefined)writes.push([LESSON_WORK_KEY,x.lessonWork===null?null:JSON.stringify(x.lessonWork)]);
 if(x.questionExposure!==undefined)writes.push([EXPOSURE_KEY,x.questionExposure===null?null:JSON.stringify(x.questionExposure)]);
 const before=writes.map(([k])=>[k,storage.getItem(k)]);
 try{for(const [k,v]of writes)v===null?storage.removeItem(k):storage.setItem(k,v);}
 catch(err){for(const [k,v]of before)try{v===null?storage.removeItem(k):storage.setItem(k,v);}catch{}throw new Error('The browser could not restore this backup. Keep this page open and free storage before retrying.');}
 return preview;
}

export function bindStudyBackups(root,{dialog,toast,escape:e}){
 const button=root.querySelector('#export-data'),input=root.querySelector('#import-data');if(!button||!input)return;
 button.textContent='Back up all study work';
 button.before(Object.assign(document.createElement('p'),{className:'tiny',textContent:'Complete backup includes saved chapter exams, bone-list tests, results, review cards and spellings. Chat and preferences are optional.'}));
 button.onclick=()=>{
  dialog('<h2>Back up your study work</h2><p>Includes progress, exam drafts and reports, and the dedicated bone-list test. Keep this file before changing devices or clearing browser data.</p><label class="check-line"><input type="checkbox" id="backup-chat"> Include tutor conversation and draft</label><label class="check-line"><input type="checkbox" id="backup-settings"> Include AI and study preferences</label><button class="primary" id="backup-download">Download complete backup</button><p id="backup-error" role="status"></p>');
  document.querySelector('#backup-download').onclick=()=>{try{const data=createStudyBackup(localStorage,{includeChat:document.querySelector('#backup-chat').checked,includeSettings:document.querySelector('#backup-settings').checked}),url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='osteon-complete-backup-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);document.querySelector('#info-dialog').close();toast('Complete study backup downloaded.');}catch(err){document.querySelector('#backup-error').textContent=err.message;}};
 };
 input.onchange=async ev=>{const file=ev.target.files[0];if(!file)return;try{if(file.size>15e6)throw new Error('Choose a backup smaller than 15 MB.');const data=JSON.parse(await file.text()),p=validateStudyBackup(data);dialog(`<h2>Review the backup</h2><p>${p.legacy?'Earlier progress-only backup: exam drafts and reports on this device will stay as they are.':'This replaces study progress, chapter-exam records and bone-list test records on this device.'}</p><ul><li>${p.attempts} recorded attempts</li><li>${p.examReports} chapter-exam reports</li><li>Chapter-exam draft: ${p.hasExamDraft?'included':'none'}</li><li>Bone-list test: ${p.hasLabDraft?'included':'none'}</li><li>Tutor conversation: ${p.chat?'included':'unchanged'}</li><li>Preferences: ${p.settings?'included':'unchanged'}</li></ul><p>Download a backup of this device first if you want to keep both records. Restoring reloads the app.</p><button class="primary" id="backup-restore">Restore and reload</button><p id="backup-error" role="status"></p>`);document.querySelector('#backup-restore').onclick=()=>{try{restoreStudyBackup(localStorage,data);location.reload();}catch(err){document.querySelector('#backup-error').textContent=err.message;}};}catch(err){root.querySelector('#import-status').textContent=err.message;}input.value='';};
}
