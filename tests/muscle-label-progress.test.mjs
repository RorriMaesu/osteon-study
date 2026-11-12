import test from 'node:test';
import assert from 'node:assert/strict';
const memory=new Map();
globalThis.localStorage={getItem:key=>memory.get(key)??null,setItem:(key,value)=>memory.set(key,value)};
const {muscleLabelId,dueMuscleLabels,muscleLabelCoverage,recordMuscleLabel}=await import('../src/muscle-label-progress.js');
const {getProgress,resetProgress}=await import('../src/storage.js');
const {createStudyBackup,restoreStudyBackup}=await import('../src/study-backup.js');
const {blankProfessorState,createProfessorSession,writeProfessorState,readProfessorState,setProfessorResponse,submitProfessorSession}=await import('../src/professor-muscle-store.js');

test('a missed diagram stays due in its mode until an independent retry',()=>{
 resetProgress();
 const item={targetId:'worksheet-leg-2',mode:'label'};
 recordMuscleLabel('worksheet',{...item,correct:false});
 recordMuscleLabel('worksheet',{...item,correct:true,assisted:true});
 recordMuscleLabel('worksheet',{...item,mode:'locate',correct:true});
 assert.deepEqual(dueMuscleLabels('worksheet').map(({mode,targetId})=>({mode,targetId})),[item]);
 recordMuscleLabel('worksheet',{...item,correct:true});
 assert.deepEqual(dueMuscleLabels('worksheet'),[]);
 assert.equal(getProgress().attempts.length,4);
});

test('different views count once per course structure and format',()=>{
 resetProgress();
 const termId='ch11-tibialis-anterior';
 recordMuscleLabel('worksheet',{targetId:'worksheet-leg-2',mode:'label',correct:true});
 recordMuscleLabel('worksheet',{targetId:'openstax-tibialis-anterior',mode:'label',correct:true});
 recordMuscleLabel('spatial',{termId,mode:'find',correct:false});
 const targets=new Map([['worksheet-leg-2',termId],['openstax-tibialis-anterior',termId]]);
 assert.deepEqual(muscleLabelCoverage([{id:termId,name:'Tibialis anterior'}],targets),[{id:termId,name:'Tibialis anterior',worksheet:true,spatial:true}]);
 assert.equal(dueMuscleLabels('spatial')[0].targetId,termId);
 assert.equal(muscleLabelId('spatial','locate',termId),null);
});

test('a complete backup preserves both the professor’s submitted original and the active revision',()=>{
 const storage=()=>{
  const data=new Map();
  return {getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value),removeItem:key=>data.delete(key)};
 };
 const source=storage(),destination=storage(),state=blankProfessorState(),ids=['prof-muscle-01'];
 const original=createProfessorSession({ids});
 setProfessorResponse(original,ids[0],'My original answer.');
 submitProfessorSession(original);
 state.history.push(original);
 state.active=createProfessorSession({ids,revisionOf:original.id});
 setProfessorResponse(state.active,ids[0],'My revision draft.');
 writeProfessorState(source,state);
 const payload=JSON.parse(JSON.stringify(createStudyBackup(source)));
 assert.equal(restoreStudyBackup(destination,payload).hasProfessorReview,true);
 assert.deepEqual(readProfessorState(destination),state);
});
