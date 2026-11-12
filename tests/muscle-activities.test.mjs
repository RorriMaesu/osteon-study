import test from 'node:test';
import assert from 'node:assert/strict';
import {recruitmentState,lengthTensionState,fiberProfiles} from '../src/muscle-activities.js';
import {crossBridgePermission,tensionTrace} from '../src/muscle-labs.js';
import {getLearningContext,setLearningContext,setDiagramLearningContext,setTutorAssessmentMode} from '../src/learning-context.js';
import {buildTutorMessages,retrieveSources} from '../src/tutor-context.js';
import {curlState,smoothGeometry,repairComparison} from '../src/muscle-mechanics.js';
import {sarcomereGeometry,muscleLevelDrawing,sarcomereDrawing} from '../src/muscle-diagrams.js';
import source from '../src/chapter10-source.json' with {type:'json'};
import links from '../src/lesson-links.json' with {type:'json'};

import figureAssets from '../src/muscle-textbook-assets.json' with {type:'json'};
import {axialMuscleFigureTargets} from '../src/axial-muscle-targets.js';
import {muscleFigureTargets,musclePlateSVG} from '../src/muscle-figure-targets.js';
import {newMuscleCardView,newFigureView,dueFigureTargets,validMuscleStudyState} from '../src/muscle-study-state.js';
import {readLessonWork,saveLessonWork} from '../src/lesson-flow.js';

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

test('concentric and eccentric tasks both retain active elbow-flexor force',()=>{
 assert.ok(curlState('lift',100).angle<curlState('lift',0).angle);
 assert.ok(curlState('lower',100).angle>curlState('lower',0).angle);
 assert.equal(curlState('hold',0).angle,curlState('hold',100).angle);
 assert.equal(curlState('lower').type,'Eccentric');assert.equal(curlState('hold').type,'Isometric');
 for(const phase of ['lift','hold','lower'])assert.equal(curlState(phase).active,true);
});

test('smooth structure comparison narrows a passage without introducing striated sarcomeres',()=>{
 const relaxed=smoothGeometry(0),shortened=smoothGeometry(100);
 assert.ok(shortened.lengthScale<relaxed.lengthScale);assert.ok(shortened.widthScale>relaxed.widthScale);
 assert.ok(shortened.lumenRadius<relaxed.lumenRadius&&shortened.lumenRadius>0);
});

test('repair comparisons retain distinct mechanisms and avoid an injury-to-scar calculation',()=>{
 const tissues=['Skeletal','Cardiac','Smooth'],states=tissues.map(t=>repairComparison(t));
 assert.equal(new Set(states.map(s=>s.mechanism)).size,3);
 assert.equal(new Set(states.map(s=>s.capacity)).size,3);
 assert.match(repairComparison('Smooth',true).limitation,/does not guarantee/);
 assert.match(repairComparison('Skeletal',true).limitation,/may exceed/);
 for(const tissue of tissues)assert.equal(repairComparison(tissue).capacity,repairComparison(tissue,true).capacity);
});

test('I-band measurements distinguish a full band from the half inside one sarcomere',()=>{
 for(const amount of [0,.5,1]){const g=sarcomereGeometry(amount);assert.equal(g.iBand,2*g.halfIBand);assert.equal(g.halfIBand,g.thickLeft-g.left);}
 assert.match(sarcomereDrawing(0,{labels:true}),/Half I band/);
 assert.match(sarcomereDrawing(0,{labels:true}),/complete I band straddles a Z-disc/);
 const drawings=Array.from({length:6},(_,i)=>muscleLevelDrawing(i,{labels:true}));
 assert.equal(new Set(drawings).size,6);
 assert.match(drawings[2],/multinucleated cell/);assert.match(drawings[3],/sarcomeres in series/);
});

test('Chapter10 figure ownership follows subject matter rather than shared PDF pages',()=>{
 const assigned=source.sections.flatMap(s=>s.figures.map(f=>f.number));
 assert.equal(assigned.length,25);assert.equal(new Set(assigned).size,25);
 for(const id of ['10.5','10.9']){assert.deepEqual(source.sections.find(s=>s.id===id).figures,[]);assert.deepEqual(links[id].figures,[]);}
 assert.deepEqual(links['10.7'].figures.map(f=>f.number),['10.21','10.22']);
 for(const section of source.sections)assert.deepEqual(links[section.id].figures,section.figures);
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

test('reviewed axial crops preserve orientation, target position, and complete answer masking',()=>{
 for(const [id,item] of Object.entries(axialMuscleFigureTargets)){
  const [x,y,width,height]=item.panel,asset=figureAssets[item.figure];
  assert.ok(asset&&x>=0&&y>=0&&x+width<=asset.width&&y+height<=asset.height,id);
  assert.ok(item.point[0]>=x&&item.point[0]<=x+width&&item.point[1]>=y&&item.point[1]<=y+height,id);
  const masked=musclePlateSVG(item.figure,{targetId:id,hideLabel:true});
  assert.equal((masked.match(/<rect /g)||[]).length,1+(item.extraCovers?.length||0),id);
  assert.ok(!masked.toLowerCase().includes(item.name.toLowerCase()),id);
 }
 assert.equal(axialMuscleFigureTargets['internal-oblique'].extraCovers.length,1);
});
test('figure recall draft and card selection survive workspace round trip with scoped due targets',()=>{
 const data=new Map(),storage={getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value)};
 const prior=readLessonWork(storage,'11.5');
 const view={...newFigureView(),target:'pronator-teres',recalling:true,response:'pronater'};
 const work={...prior,step:2,explore:'figure',figureViews:{'11.25':view},figureFromCard:true,muscleCard:{...newMuscleCardView(),id:'muscle-pronator-teres'}};
 saveLessonWork(storage,'11.5',work);
 assert.deepEqual(readLessonWork(storage,'11.5').figureViews['11.25'],view);
 assert.deepEqual(readLessonWork(storage,'11.5').muscleCard,work.muscleCard);
 assert.equal(validMuscleStudyState({...work,figureViews:'invalid'}),false);
 const entries={'muscle-figure-pronator-teres':{due:100},'muscle-figure-masseter':{due:50},'muscle-figure-brachialis':{due:110}};
 assert.deepEqual(dueFigureTargets(muscleFigureTargets,[{number:'11.25'}],{cards:entries},100).map(([id])=>id),['pronator-teres']);
});
