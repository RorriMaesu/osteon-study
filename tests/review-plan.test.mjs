import test from 'node:test';
import assert from 'node:assert/strict';
import {reviewQueues,retrievalPlan} from '../src/review-plan.js';
import {terms} from '../src/data.js';
import {reviewCards,questions} from '../src/learning-data.js';

test('scoped review counts and decks agree while the progress queue keeps all divisions',()=>{
  const skull=terms.find(t=>t.region==='Skull'),arm=terms.find(t=>t.region==='Upper limb'),concept=reviewCards[0];
  const p={cards:{[skull.id]:{due:10},[arm.id]:{due:20},[concept.id]:{due:15},orphan:{due:0}}};
  const queues=reviewQueues(terms,reviewCards,p,{division:'Appendicular',region:'Upper limb',now:20});
  assert.deepEqual(queues.anatomy.map(t=>t.id),[arm.id]);
  assert.deepEqual(queues.all.map(t=>t.id),[skull.id,concept.id,arm.id]);
  assert.equal(queues.allAnatomy.length,2);assert.equal(queues.chapters.length,1);
  assert.equal(reviewQueues(terms,reviewCards,p,{division:'Axial',region:'Upper limb',now:19}).anatomy.length,0);
});

test('an exact due boundary is included and a future schedule is excluded',()=>{
  const [a,b]=terms;
  const p={cards:{[a.id]:{due:100},[b.id]:{due:101}}};
  assert.deepEqual(reviewQueues(terms,[],p,{now:100}).all.map(t=>t.id),[a.id]);
});

const attempt=(id,at,extra={})=>({id,at,correct:true,assisted:false,selfRated:false,...extra});
test('reading and self-ratings never fill gaps in scored retrieval',()=>{
  const items=[{id:'a'},{id:'b'},{id:'c'}];
  const plan=retrievalPlan(items,[attempt('a',1,{selfRated:true}),attempt('b',2,{assisted:true}),attempt('c',3)]);
  assert.deepEqual(plan.unpracticed.map(t=>t.id),['a']);assert.deepEqual(plan.revisit.map(t=>t.id),['b']);assert.deepEqual(plan.retrieved.map(t=>t.id),['c']);
  assert.deepEqual(plan.next.map(t=>t.id),['b','a','c']);
});

test('latest scored evidence wins even in unordered imports, and a later miss needs another try',()=>{
  const items=[{id:'a'},{id:'b'}];
  const plan=retrievalPlan(items,[attempt('a',20,{correct:false}),attempt('a',10),attempt('b',30),attempt('a',40,{selfRated:true})]);
  assert.deepEqual(plan.revisit.map(t=>t.id),['a']);assert.deepEqual(plan.retrieved.map(t=>t.id),['b']);
});

test('repeated immediate answers do not count as a retrieval at least 24 hours later',()=>{
  const items=[{id:'a'},{id:'b'},{id:'c'}];
  const plan=retrievalPlan(items,[attempt('a',0),attempt('a',500),attempt('b',0),attempt('b',86400000),attempt('c',0),attempt('c',86400000,{assisted:true})]);
  assert.deepEqual(plan.spaced.map(t=>t.id),['b']);
});

test('lab and chapter plans contain every intended target once and prioritize unresolved evidence',()=>{
  assert.equal(retrievalPlan(terms,[]).unpracticed.length,177);
  assert.equal(retrievalPlan(questions,[]).unpracticed.length,104);
  const plan=retrievalPlan(terms,[attempt(terms[1].id,5,{correct:false}),attempt(terms[0].id,10,{assisted:true})]);
  assert.deepEqual(plan.next.slice(0,2).map(t=>t.id),[terms[1].id,terms[0].id]);
  assert.equal(new Set(plan.next.map(t=>t.id)).size,177);
});
