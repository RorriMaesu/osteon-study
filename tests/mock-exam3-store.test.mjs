import test from 'node:test';
import assert from 'node:assert/strict';
import {blankMockState,validMockState,readMockState,writeMockState,mockBackup,parseMockBackup,
 addCardCandidate,cardText,MOCK_EXAM3_STORAGE_KEY} from '../src/mock-exam3-store.js';
import {mockExam3Questions} from '../src/mock-exam3-bank.js';
import {createMockSession,setMockResponse,submitMockSession} from '../src/mock-exam3-core.js';

function memoryStorage() {
 const records=new Map();
 return {getItem:key=>records.has(key)?records.get(key):null,setItem:(key,value)=>records.set(key,String(value)),removeItem:key=>records.delete(key),records};
}
function exampleState() {
 const state=blankMockState();
 let session=createMockSession(mockExam3Questions,{now:1000,rng:()=>.2});
 session=setMockResponse(session,mockExam3Questions[0].id,mockExam3Questions[0].answer);
 session=setMockResponse(session,mockExam3Questions[42].id,'Intramembranous uses connective tissue; endochondral replaces cartilage.');
 state.history=[submitMockSession(session,{now:2000})];
 state.notes[`${session.id}:exam3-a-43`]={confusion:'Tissue route',rule:'IM direct; EC cartilage replacement',retrieval:'Give an example of each route.',updatedAt:2100};
 state.card.front[0]='Pedicle: body to arch; lamina: posterior arch.';
 state.card.back[23]='ACL anterior tibial slide; PCL posterior.';
 return state;
}

test('mock state round-trips frozen answers, pending review, personal notes and exactly 48 card slots',()=>{
 const storage=memoryStorage(),state=exampleState();
 assert.equal(validMockState(state),true);
 writeMockState(storage,state);
 const read=readMockState(storage);
 assert.deepEqual(read,state);
 assert.equal(read.history[0].status,'submitted');
 assert.equal(read.history[0].gradingState,'pending');
 assert.equal(read.history[0].submission.responses['exam3-a-43'],state.history[0].responses['exam3-a-43']);
 assert.equal(read.card.front.length,24);assert.equal(read.card.back.length,24);
 const restored=parseMockBackup(mockBackup(state,3000));
 assert.deepEqual(restored,state);
 restored.card.front[0]='Changed later';
 restored.history[0].responses['exam3-a-43']='Changed later';
 assert.notEqual(restored.card.front[0],state.card.front[0]);
 assert.notEqual(restored.history[0].responses['exam3-a-43'],state.history[0].responses['exam3-a-43']);
 assert.equal(validMockState(restored),false,'Editing frozen submitted answers invalidates restored state');
});

test('editable card suggestions and destination survive backups while older notes remain valid',()=>{
 const state=exampleState(),storage=memoryStorage(),key=Object.keys(state.notes)[0];
 assert.ok(validMockState(state),'legacy notes do not require new fields');
 state.notes[key].cardDraft='My wording: cartilage model is replaced by bone.';
 state.notes[key].cardSide='back';
 writeMockState(storage,state);
 assert.equal(readMockState(storage).notes[key].cardDraft,state.notes[key].cardDraft);
 assert.equal(parseMockBackup(mockBackup(state)).notes[key].cardSide,'back');
 for(const patch of [{cardDraft:'x'.repeat(181)},{cardDraft:4},{cardSide:'left'},{cardSide:null}]){
  const bad=structuredClone(state);Object.assign(bad.notes[key],patch);assert.equal(validMockState(bad),false);
 }
 state.notes[key].cardDraft='';assert.ok(validMockState(state),'an intentionally cleared suggestion is preserved');
});

test('malformed saved data is rejected without overwriting its raw recovery copy',()=>{
 const storage=memoryStorage();
 for(const raw of ['{broken','null','{}','{"schema":2}','{"schema":1,"history":[]}']){
  storage.setItem(MOCK_EXAM3_STORAGE_KEY,raw);
  assert.throws(()=>readMockState(storage));
  assert.equal(storage.getItem(MOCK_EXAM3_STORAGE_KEY),raw);
 }
});

test('invalid imports and modified keys cannot replace a valid saved mock',()=>{
 const storage=memoryStorage(),original=exampleState();writeMockState(storage,original);
 const saved=storage.getItem(MOCK_EXAM3_STORAGE_KEY);
 const mutations=[
  value=>{value.kind='other-backup';},
  value=>{value.schema=2;},
  value=>{value.createdAt=Infinity;},
  value=>{value.state.card.front.push('25th line');},
  value=>{value.state.card.back[2]=null;},
  value=>{value.state.history[0].questions[0].answer='Altered key';},
  value=>{value.state.history[0].responses['exam3-a-01']='Changed answer';},
  value=>{value.state.active=value.state.history[0];},
  value=>{value.state.notes.bad={confusion:'x'.repeat(2001),rule:'',retrieval:'',updatedAt:3000};},
  value=>{value.state.notes=JSON.parse('{"__proto__":{"confusion":"","rule":"","retrieval":"","updatedAt":0}}');}
 ];
 for(const mutate of mutations){const bad=mockBackup(original,3000);mutate(bad);assert.throws(()=>parseMockBackup(bad));assert.equal(storage.getItem(MOCK_EXAM3_STORAGE_KEY),saved);}
 const badState=structuredClone(original);badState.card.front=[];
 assert.throws(()=>writeMockState(storage,badState));assert.equal(storage.getItem(MOCK_EXAM3_STORAGE_KEY),saved);
});

test('storage capacity failure leaves previously saved work intact and propagates failure',()=>{
 const storage=memoryStorage(),original=exampleState();writeMockState(storage,original);
 const saved=storage.getItem(MOCK_EXAM3_STORAGE_KEY);
 storage.setItem=()=>{throw new Error('Quota exceeded');};
 const changed=structuredClone(original);changed.card.back[0]='New memory cue';
 assert.throws(()=>writeMockState(storage,changed),/Quota exceeded/);
 assert.equal(storage.getItem(MOCK_EXAM3_STORAGE_KEY),saved);
});

test('card candidates deduplicate across both sides and do not mutate the caller',()=>{
 const original=blankMockState().card;
 const first=addCardCandidate(original,'  Medial malleolus = tibia.  ','back');
 assert.equal(first.side,'back');assert.equal(first.index,0);assert.equal(first.duplicate,false);
 assert.equal(first.card.back[0],'Medial malleolus = tibia.');
 assert.equal(original.back[0],'');
 const duplicate=addCardCandidate(first.card,'MEDIAL MALLEOLUS = TIBIA.','front');
 assert.equal(duplicate.duplicate,true);assert.equal(duplicate.card.front[0],'');
 assert.throws(()=>addCardCandidate(original,'   '));
 assert.throws(()=>addCardCandidate(original,'A valid note','unknown'));
});

test('card capacity is strictly 24 per side, with an explicit error instead of a 25th line',()=>{
 let card=blankMockState().card;
 for(let i=0;i<24;i++)card=addCardCandidate(card,`Front fact ${i+1}`,'front').card;
 const before=structuredClone(card);
 assert.throws(()=>addCardCandidate(card,'An extra front fact','front'),/24 notes/);
 assert.deepEqual(card,before);
 for(let i=0;i<24;i++)card=addCardCandidate(card,`Back fact ${i+1}`,'back').card;
 assert.equal(card.front.concat(card.back).filter(Boolean).length,48);
 assert.throws(()=>addCardCandidate(card,'An extra back fact','back'),/24 notes/);
 const output=cardText(card);
 assert.equal(output.split('\n').filter(line=>/^\d{2} /.test(line)).length,48);
 assert.equal(output.split('\n').filter(line=>/^24 /.test(line)).length,2);
});

test('a fresh store allocates independent sides and reports missing storage as an empty valid state',()=>{
 const a=blankMockState(),b=blankMockState();a.card.front[0]='Personal';
 assert.equal(a.card.back[0],'');assert.equal(b.card.front[0],'');
 assert.deepEqual(readMockState(memoryStorage()),b);
 assert.equal(validMockState(b),true);
 assert.equal(validMockState({...b,history:Array(21).fill(exampleState().history[0])}),false);
});
