import test from 'node:test';
import assert from 'node:assert/strict';
import {recruitmentState,lengthTensionState,fiberProfiles} from '../src/muscle-activities.js';
import {crossBridgePermission,tensionTrace} from '../src/muscle-labs.js';
import {getLearningContext,setLearningContext,setDiagramLearningContext,setTutorAssessmentMode} from '../src/learning-context.js';
import {buildTutorMessages,retrieveSources} from '../src/tutor-context.js';

test('recruitment increases active fibers without increasing stimulus frequency',()=>{
 const one=recruitmentState(1),three=recruitmentState(3);
 assert.equal(one.fibersActive,3);assert.equal(three.fibersActive,9);
 assert.equal(one.fibersTotal,three.fibersTotal);
 assert.equal(recruitmentState(-1).active,1);assert.equal(recruitmentState(30).active,3);
 const low=tensionTrace('summation',1),high=tensionTrace('summation',3);
 assert.deepEqual(low.pulses,high.pulses);
 assert.ok(high.points.some((point,index)=>point[1]>low.points[index][1]));
});

test('qualitative length–tension curve declines at both extremes and keeps values bounded',()=>{
 const middle=lengthTensionState(100);
 assert.ok(middle.tension>lengthTensionState(60).tension);
 assert.ok(middle.tension>lengthTensionState(170).tension);
 for(let length=-100;length<300;length++){
  const point=lengthTensionState(length);
  assert.ok(point.tension>=0&&point.tension<=1);
  assert.ok(point.length>=55&&point.length<=175);
 }
});

test('fiber comparison separates contraction speed from oxidative support',()=>{
 const so=fiberProfiles.find(p=>p.id==='SO'),fo=fiberProfiles.find(p=>p.id==='FO'),fg=fiberProfiles.find(p=>p.id==='FG');
 assert.equal(fo.speed,fg.speed);assert.ok(fo.oxidative>fg.oxidative);
 assert.ok(so.fatigue>fg.fatigue);assert.ok(so.speed<fo.speed);
});

test('calcium loss limits new attachment while ATP is still needed for detachment',()=>{
 assert.ok(crossBridgePermission(1,{calcium:false,atp:true}));
 assert.equal(crossBridgePermission(3,{calcium:false,atp:true}),'');
 assert.ok(crossBridgePermission(3,{calcium:false,atp:false}));
});

test('diagram context remains bounded and preserves the independent assessment lock',()=>{
 setTutorAssessmentMode('exam');
 const context=setDiagramLearningContext({id:'recruitment',title:'Motor units',reference:'10.4',state:{units:2,frequency:'unchanged',privateObject:{secret:true},invalid:NaN},facts:['More units recruit more fibers.'],question:'What changes?',answer:'More fibers are activated.'});
 assert.equal(context.assessmentMode,'exam');
 assert.deepEqual(context.diagram.state,{units:2,frequency:'unchanged'});
 assert.equal(context.diagram.question,'What changes?');
 setLearningContext({type:'lesson',label:'Another lesson',assessmentMode:null});
 assert.equal(getLearningContext().assessmentMode,'exam');
 setTutorAssessmentMode(null);
 const empty=setDiagramLearningContext({state:null,facts:null,reference:'invalid'});
 assert.deepEqual(empty.diagram.state,{});assert.deepEqual(empty.diagram.facts,[]);assert.equal(empty.reference,'');
});

test('independent exams expose neither answer-key context nor previous coaching to the model',()=>{
 const context={assessmentMode:'exam',label:'Secret question',diagram:{answer:'DO_NOT_SEND_ANSWER',facts:['DO_NOT_SEND_NOTE']}};
 assert.deepEqual(retrieveSources('Secret question',context),[]);
 const built=buildTutorMessages('Solve the secret question',[{role:'assistant',content:'DO_NOT_SEND_HISTORY'}],context);
 assert.equal(built.blocked,true);assert.deepEqual(built.sources,[]);
 assert.equal(built.messages.length,1);assert.doesNotMatch(JSON.stringify(built.messages),/DO_NOT_SEND_|Secret question|Solve the secret/);
});

test('current original activity notes are available for guided local tutoring with a course reference',()=>{
 const context=setDiagramLearningContext({id:'coupling',title:'Signal to contraction',reference:'10.2',state:{step:'T-tubules'},facts:['A muscle action potential travels through T-tubules; acetylcholine acts at the motor end-plate.'],question:'Which signal travels inward?'});
 const sources=retrieveSources('Give me a hint about this step',context);
 assert.ok(sources.some(s=>s.reference==='10.2'&&s.text.includes('acetylcholine acts at the motor end-plate')));
 assert.equal(new Set(sources.map(s=>s.pdf)).size,sources.length);
 const {messages}=buildTutorMessages('What travels through the T-tubules?',[],context);
 assert.match(messages[0].content,/chapters 1–11/);
 assert.match(messages[0].content,/not an image you can see/);
});
