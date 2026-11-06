import test from 'node:test';
import assert from 'node:assert/strict';
import {createStudyBackup,validateStudyBackup,restoreStudyBackup} from '../src/study-backup.js';
import {blankMockState,MOCK_EXAM3_STORAGE_KEY,writeMockState,readMockState} from '../src/mock-exam3-store.js';
import {createMockSession,setMockResponse,submitMockSession,applyMockReview,mockResults} from '../src/mock-exam3-core.js';
import {createLearnerWrittenReview,rubricCriteria} from '../src/written-answer-judge.js';
import {mockExam3Questions} from '../src/mock-exam3-bank.js';
import {blankProgress} from '../src/storage.js';
const memory=()=>{const records=new Map();return{records,getItem:k=>records.get(k)??null,setItem:(k,v)=>records.set(k,String(v)),removeItem:k=>records.delete(k)}};
function sample(){
 const state=blankMockState(),question=mockExam3Questions.find(q=>q.type==='written');
 let s=createMockSession([question],{now:100,form:{id:'targeted',title:'Targeted recall',version:'1'}});
 s=setMockResponse(s,question.id,question.answer);s=submitMockSession(s,{now:200});
 const decisions=Object.fromEntries(rubricCriteria(question).map((c,i)=>[c.id,i===0?'missing':'met']));
 s=applyMockReview(s,question.id,createLearnerWrittenReview({question,response:s.responses[question.id],submissionId:s.submission.id,decisions,reason:'Compared with every component.',now:210}),{now:210});
 state.history=[s];state.notes[`${s.id}:${question.id}`]={confusion:'Starting tissue',rule:'Direct versus cartilage replacement',retrieval:'Explain both routes.',updatedAt:220};
 state.card.front[0]='IM direct; EC cartilage replacement';state.card.back[23]='MCL -> medial meniscus -> ACL';return state;
}

test('complete study backup round-trips mock score evidence, immutable responses, notes and card',()=>{
 const source=memory(),state=sample();writeMockState(source,state);
 const backup=createStudyBackup(source,{now:300}),preview=validateStudyBackup(backup);
 assert.equal(preview.mockReports,1);assert.equal(preview.hasMockDraft,false);
 const target=memory();restoreStudyBackup(target,JSON.parse(JSON.stringify(backup)));
 const restored=readMockState(target);assert.deepEqual(restored,state);
 assert.equal(mockResults(restored.history[0]).earnedPoints,2.5);
 assert.equal(restored.history[0].reviews['exam3-a-43'].source,'learner');
 assert.equal(restored.history[0].submission.responses['exam3-a-43'],restored.history[0].responses['exam3-a-43']);
});

test('older complete backups without a mock field preserve this browser’s existing mock work',()=>{
 const storage=memory(),state=sample();writeMockState(storage,state);
 const original=storage.getItem(MOCK_EXAM3_STORAGE_KEY),old=createStudyBackup(memory(),{now:300});
 delete old.mockExam3;assert.equal(validateStudyBackup(old).mockReports,0);
 restoreStudyBackup(storage,old);assert.equal(storage.getItem(MOCK_EXAM3_STORAGE_KEY),original);
});

test('legacy progress-only backups cannot smuggle unrelated mock records into storage',()=>{
 const storage=memory();writeMockState(storage,sample());const before=storage.getItem(MOCK_EXAM3_STORAGE_KEY);
 const legacy={...blankProgress(),mockExam3:{corrupt:'not a valid mock record'}};
 assert.equal(validateStudyBackup(legacy).legacy,true);
 restoreStudyBackup(storage,legacy);
 assert.equal(storage.getItem(MOCK_EXAM3_STORAGE_KEY),before);
});

test('invalid mock data rejects the entire complete backup before any write',()=>{
 const storage=memory();writeMockState(storage,sample());
 const backup=createStudyBackup(storage,{now:300}),before=new Map(storage.records);
 backup.mockExam3.history[0].responses['exam3-a-43']='Changed after submission';
 assert.throws(()=>restoreStudyBackup(storage,backup),/mock backup is invalid/);
 assert.deepEqual(storage.records,before);
});

test('a mock storage failure rolls back complete-backup writes and preserves earlier records',()=>{
 const source=memory();writeMockState(source,sample());const backup=createStudyBackup(source,{now:300});
 const target=memory();target.setItem('osteon-exams-v1','old exam raw');target.setItem(MOCK_EXAM3_STORAGE_KEY,'old mock raw');
 const before=new Map(target.records),write=target.setItem;let failed=false;
 target.setItem=(key,value)=>{if(key===MOCK_EXAM3_STORAGE_KEY&&!failed){failed=true;throw Error('Quota');}return write(key,value);};
 assert.throws(()=>restoreStudyBackup(target,backup),/could not restore/);
 assert.deepEqual(target.records,before);
});
