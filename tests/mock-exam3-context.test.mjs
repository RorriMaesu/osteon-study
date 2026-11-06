import test from 'node:test';
import assert from 'node:assert/strict';
import {mockExam3Questions} from '../src/mock-exam3-bank.js';
import {assessQuestion} from '../src/exam-core.js';
import {interpretReview} from '../src/answer-judge.js';
import {createMockSession,setMockResponse,submitMockSession,validMockSession,mockOutcome,assessMockQuestion,applyMockReview,mockTermReviewTarget} from '../src/mock-exam3-core.js';
import {blankMockState,mockBackup,parseMockBackup} from '../src/mock-exam3-store.js';

const question=number=>mockExam3Questions.find(q=>q.number===number);
const submitted=(q,response,{legacy=false}={})=>{
 let s=createMockSession([q],{now:100,form:{id:'context-practice',title:'Context recall',version:'1'}});
 if(legacy)delete s.scoringVersion;
 s=setMockResponse(s,q.id,response);return submitMockSession(s,{now:200});
};

test('all nine packet targets accept authored correct context as equivalent wording',()=>{
 const responses={31:'Haversian system in compact bone',32:'Parietal bone of the skull',33:'Sphenoid bone at the base of the skull',34:'Vertebral pedicle of the thoracic vertebra',35:'Glenoid fossa on the scapula',36:'Deltoid tuberosity on the humerus',37:'Acetabulum of the hip bone',38:'Medial malleolus on the distal tibia',39:'Synovial membrane inside the joint capsule'};
 for(const [number,response]of Object.entries(responses)){
  const q=question(Number(number)),s=submitted(q,response),out=mockOutcome(s,q);
  assert.equal(s.scoringVersion,2);assert.equal(out.status,'equivalent',response);assert.equal(out.earnedPoints,2,response);
  assert.equal(out.pendingPoints,0);assert.ok(validMockSession(structuredClone(s)));
  assert.equal(mockTermReviewTarget(q,response),q,'authored context needs no relaxed review policy');
 }
});

test('v1 submissions and their original zero-point outcomes survive reload and backup unchanged',()=>{
 const q=question(32),response='Parietal bone of the skull',s=submitted(q,response,{legacy:true});
 const old=assessQuestion(q,response),expected={...old,maxPoints:2,earnedPoints:0,pendingPoints:0,components:[]};
 assert.equal(old.status,'incorrect');assert.deepEqual(s.initialOutcomes[q.id],expected);
 assert.deepEqual(mockOutcome(s,q),expected);assert.ok(validMockSession(s));
 const state=blankMockState();state.history=[s];const restored=parseMockBackup(mockBackup(state,300)).history[0];
 assert.deepEqual(restored,s);assert.deepEqual(mockOutcome(restored,q),expected);
 assert.equal(assessMockQuestion(q,response,null,{scoringVersion:1}).earnedPoints,0);
 assert.equal(assessMockQuestion(q,response).earnedPoints,2,'direct new assessments use v2');
 assert.ok(!validMockSession({...s,scoringVersion:2}),'changing a frozen scoring version does not rewrite its original outcomes');
 for(const version of [0,3,'2',null])assert.ok(!validMockSession({...s,scoringVersion:version}));
});

test('wrong parents, directions, alternatives and negation never gain context credit',()=>{
 const cases=[[31,'osteon in spongy bone'],[32,'parietal bone of the femur'],[33,'sphenoid bone on the humerus'],[34,'pedicle of the tibia'],[35,'glenoid cavity of the humerus'],[36,'deltoid tuberosity on the femur'],[37,'acetabulum of the scapula'],[38,'medial malleolus of the fibula'],[38,'medial malleolus at the lateral ankle'],[39,'synovial membrane of the tibia'],[32,'parietal bone, frontal bone'],[35,'glenoid cavity or acromion'],[39,'synovial membrane not inside the joint capsule']];
 for(const [number,response]of cases){
  const q=question(number),out=assessMockQuestion(q,response);
  assert.equal(out.status,'incorrect',response);assert.equal(out.earnedPoints,0,response);
  assert.equal(mockTermReviewTarget(q,response),q,'contradictions retain the strict original review target');
  const fabricated={schema:1,target:q.id,answer:q.answer,response,strictCorrect:false,allowOverride:true,model:'test',at:250,status:'reviewed',verdict:'equivalent',confidence:'high',correctedAnswer:q.answer,explanation:'Overconfident model response.',reference:q.lesson};
  assert.equal(assessMockQuestion(q,response,fabricated).earnedPoints,0,'an AI override cannot bypass the authored contradiction guard');
 }
 const sided={...question(38),answerPolicy:{...question(38).answerPolicy,side:'left'}};
 assert.equal(assessMockQuestion(sided,'medial malleolus of the right tibia').earnedPoints,0);
});

test('unrecognized context requires meaning review, and only that narrow case relaxes formal-only review',()=>{
 const q=question(35),response='Glenoid cavity at the lateral angle',pending=assessMockQuestion(q,response);
 assert.equal(pending.status,'pending');assert.equal(pending.earnedPoints,0);assert.equal(pending.pendingPoints,2);
 const target=mockTermReviewTarget(q,response);
 assert.equal(target.id,q.id);assert.equal(target.answer,q.answer);assert.equal(target.answerPolicy.formalOnly,false);
 assert.equal(q.answerPolicy.formalOnly,true,'the saved question snapshot stays intact');
 assert.equal(mockTermReviewTarget(q,response,{scoringVersion:1}),q);
 assert.equal(mockTermReviewTarget(q,'shoulder socket'),q,'a response without the anatomical term receives no exception');
 const reviewed=interpretReview({verdict:'equivalent',confidence:'high',correctedAnswer:q.answer,explanation:'The named cavity and its lateral location refer to the scapular socket.'},{target,response,strictCorrect:false,allowOverride:true,model:'local:test',now:250});
 assert.equal(reviewed.review.status,'reviewed');
 const s=applyMockReview(submitted(q,response),q.id,reviewed,{now:250});
 assert.ok(validMockSession(s));assert.equal(mockOutcome(s,q).status,'equivalent');assert.equal(mockOutcome(s,q).earnedPoints,2);
 assert.equal(s.submission.responses[q.id],response);assert.equal(s.initialOutcomes[q.id].pendingPoints,2);
 for(const response of ['Synovial membrane in the shoulder joint','Synovial membrane in the hip joint']){
  assert.equal(assessMockQuestion(question(39),response).status,'pending','an unlisted specific joint is not automatically a contradictory parent');
 }
});
