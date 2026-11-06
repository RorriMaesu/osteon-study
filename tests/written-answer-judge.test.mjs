import test from 'node:test';
import assert from 'node:assert/strict';
import {WrittenAnswerJudge,interpretWrittenReview,validWrittenReview,scoreWrittenReview,writtenReviewSchema,questionIdentity,responseIdentity,rubricCriteria,compactWrittenQualification,isWrittenModelQualified,WRITTEN_PROMPT_VERSION,createLearnerWrittenReview} from '../src/written-answer-judge.js';
import qualifiedModels from '../src/mock-exam3-qualified-models.json' with {type:'json'};
import {mockExam3Calibration,mockExam3AllQuestions} from '../src/mock-exam3-bank.js';

const question={id:'rubric-test',type:'written',chapter:6,points:3,prompt:'Describe the source, process, and example.',answer:'Mesenchyme; osteoblasts form bone; parietal.',rubric:{id:'rubric-test-v1',version:'1',modelAnswer:'Mesenchyme; osteoblasts form bone; parietal.',criteria:[
  {id:'source',label:'Source',points:1,description:'Names mesenchymal connective tissue.'},
  {id:'process',label:'Process',points:.5,description:'Osteoblasts deposit bone matrix.'},
  {id:'replacement',label:'Replacement',points:.5,description:'Cartilage is replaced by bone.'},
  {id:'example',label:'Example',points:1,description:'Names parietal bone.'}
]}};
const response='Mesenchyme gives rise to osteoblasts. Osteoblasts deposit bone matrix. Cartilage is replaced by bone. Parietal.';
const parsed=(overrides={})=>({components:rubricCriteria(question).map(c=>({id:c.id,decision:'met',evidence:[response],reason:'Your answer states the required concept.'})),feedback:'You explained the mechanisms.',studyNote:'Compare starting tissues and bone formation.',...overrides});
const context=(overrides={})=>({question,response,submissionId:'attempt-submitted',model:'local:test',modelIdentity:'http://127.0.0.1:11434|local:test|digest',endpoint:'http://127.0.0.1:11434',now:20,...overrides});

test('written review awards only the authored atomic points and preserves evidence',()=>{
  const review=interpretWrittenReview(parsed(),context());
  assert.ok(validWrittenReview(review,context()));
  const score=scoreWrittenReview(question,review,context());
  assert.equal(score.earnedPoints,3);assert.equal(score.pendingPoints,0);
  assert.equal(review.response,response);assert.equal(review.questionIdentity,questionIdentity(question));
  assert.equal(review.responseIdentity,responseIdentity(response));
});

test('one missing half-point and one uncertain component stay distinct',()=>{
  const data=parsed();data.components[1]={...data.components[1],decision:'missing',evidence:[],reason:'The matrix deposition mechanism is absent.'};
  data.components[2]={...data.components[2],decision:'uncertain',evidence:[],reason:'The replacement wording is ambiguous.'};
  const review=interpretWrittenReview(data,context()),score=scoreWrittenReview(question,review,context());
  assert.equal(score.earnedPoints,2);assert.equal(score.pendingPoints,.5);assert.equal(review.status,'pending');
});

test('invalid model output cannot invent criteria, points, quotations or duplicate decisions',()=>{
  const bad=[];
  let d=parsed();d.components[0].id='invented';bad.push(d);
  d=parsed();d.components[1].id=d.components[0].id;bad.push(d);
  d=parsed();d.components[0].evidence=['This is not in the answer'];bad.push(d);
  d=parsed();d.components[0].evidence=[];bad.push(d);
  d=parsed();d.components[0].points=100;bad.push(d);
  d=parsed();d.components[0].decision='mostly';bad.push(d);
  d=parsed();d.total=3;bad.push(d);
  d=parsed();d.components.pop();bad.push(d);
  for(const data of bad)assert.throws(()=>interpretWrittenReview(data,context()),/valid rubric/);
});

test('stale response, submission and rubric versions cannot reuse a review',()=>{
  const review=interpretWrittenReview(parsed(),context());
  assert.ok(!validWrittenReview(review,context({response:response+'!'})));
  assert.ok(!validWrittenReview(review,context({submissionId:'other'})));
  assert.ok(!validWrittenReview(review,context({question:{...question,prompt:'Different prompt'}})));
  assert.ok(!validWrittenReview(review,context({question:{...question,rubric:{...question.rubric,version:'2'}}})));
  assert.ok(!validWrittenReview({...review,modelIdentity:''},context()));
  assert.ok(!validWrittenReview({...review,status:'pending'},context()));
});

const local={name:'local:test',size:1000,digest:'digest'},info={capabilities:['completion','thinking'],details:{format:'gguf'}};
const fake=(reply,inspect=()=>{},metadata={})=>new WrittenAnswerJudge(async(url,init)=>{
  const path=new URL(url).pathname,body=init.body?JSON.parse(init.body):null;
  inspect(path,body,init);
  const result=path==='/api/version'?{version:'test'}:path==='/api/tags'?{models:[{...local,...metadata}]}:path==='/api/show'?info:reply;
  return new Response(JSON.stringify(result));
});

test('uses loopback JSON schema and protects student text as untrusted data',async()=>{
  let sent;
  const judge=fake({done:true,done_reason:'stop',message:{content:JSON.stringify(parsed())}},(path,body,init)=>{
    assert.equal(init.credentials,'omit');assert.equal(init.redirect,'error');
    if(path==='/api/chat')sent=body;
  });
  const review=await judge.review({question,response,submissionId:'attempt-submitted'},{model:'local:test',endpoint:'http://127.0.0.1:11434'});
  assert.ok(validWrittenReview(review,context()));
  assert.deepEqual(sent.format,writtenReviewSchema(question));assert.equal(sent.options.temperature,0);
  assert.equal(sent.stream,false);assert.equal(sent.think,false);assert.ok(!sent.tools);
  assert.match(sent.messages[0].content,/untrusted data/);assert.match(sent.messages[0].content,/Do not return numeric scores/);
  assert.equal(JSON.parse(sent.messages[1].content).studentResponse,response);
});

test('cloud, unfinished, malformed and false-quote results fail with no grade',async()=>{
  for(const reply of [{done:false,message:{content:JSON.stringify(parsed())}},{done:true,done_reason:'length',message:{content:JSON.stringify(parsed())}},{done:true,message:{content:'```json {}```'}}]) {
    await assert.rejects(()=>fake(reply).review({question,response,submissionId:'attempt-submitted'},{model:'local:test'}));
  }
  let calls=0;
  await assert.rejects(()=>fake({},path=>{if(path==='/api/chat')calls++;},{remote_model:'remote'}).review({question,response,submissionId:'attempt-submitted'},{model:'local:test'}),/Cloud/);
  assert.equal(calls,0);
  await assert.rejects(()=>fake({}).review({question,response,submissionId:'attempt-submitted'},{model:'local:test',endpoint:'https://remote.example'}),/only connects/);
});

test('cancellation interrupts the request without a synthetic grade',async()=>{
  const controller=new AbortController();
  const judge=new WrittenAnswerJudge((url,init)=>new Promise((resolve,reject)=>{
    if(init.signal.aborted)reject(init.signal.reason);else init.signal.addEventListener('abort',()=>reject(init.signal.reason),{once:true});
  }));
  const promise=judge.review({question,response,submissionId:'attempt-submitted'},{model:'local:test',signal:controller.signal});
  controller.abort(new DOMException('Canceled','AbortError'));
  await assert.rejects(()=>promise,/Canceled/);
});

test('calibration compares every component rather than merely the total',async()=>{
  const data=parsed();data.components[1]={...data.components[1],decision:'missing',evidence:[]};
  const judge=fake({done:true,message:{content:JSON.stringify(data)}});
  const fixtures=[{id:'held-out',questionId:question.id,response,expectedPoints:{source:1,process:.5,replacement:0,example:1}}];
  const report=await judge.calibrate(fixtures,[question],{model:'local:test'});
  assert.equal(report.cases[0].earnedPoints,2.5);assert.equal(report.passed,false);
});

test('compact qualification binds verified case scores to exact model, prompt, rubric and fixtures',()=>{
  const fixture={id:'good',questionId:question.id,response,expectedPoints:{source:1,process:.5,replacement:.5,example:1}};
  const review=interpretWrittenReview(parsed(),context({submissionId:'calibration-good'}));
  const report={promptVersion:WRITTEN_PROMPT_VERSION,cases:[{id:'good',pass:true,review}]};
  const qualification=compactWrittenQualification(report,[fixture],[question]);
  const settings={model:'local:test',endpoint:'http://127.0.0.1:11434',models:[local]};
  assert.equal(qualification.passed,true);assert.ok(isWrittenModelQualified(qualification,settings,[question],[fixture]));
  assert.ok(!isWrittenModelQualified(qualification,{...settings,models:[{...local,digest:'changed'}]},[question],[fixture]));
  assert.ok(!isWrittenModelQualified(qualification,settings,[{...question,prompt:'Changed'}],[fixture]));
  assert.ok(!isWrittenModelQualified(qualification,settings,[question],[{...fixture,response:'Changed'}]));
  assert.ok(!isWrittenModelQualified({...qualification,promptVersion:'old'},settings,[question],[fixture]));
  assert.ok(isWrittenModelQualified(qualification,{...settings,questionId:question.id},[question],[fixture,{...fixture,id:'new-case'}]));
  assert.ok(!isWrittenModelQualified(qualification,{...settings,questionId:'untested'},[question],[fixture]));
  assert.ok(!JSON.stringify(qualification).includes(response));
});

test('qualification rejects omitted, duplicate and mislabeled passing cases',()=>{
  const fixture={id:'good',questionId:question.id,response,expectedPoints:{source:0,process:0,replacement:0,example:0}};
  const review=interpretWrittenReview(parsed(),context({submissionId:'calibration-good'}));
  for(const cases of [[],[{id:'good',pass:true,review}],[{id:'good',pass:true,review},{id:'good',pass:true,review}]]) {
    assert.equal(compactWrittenQualification({promptVersion:WRITTEN_PROMPT_VERSION,cases},[fixture],[question]).passed,false);
  }
});

test('learner confirmation is distinct from AI evidence and keeps atomic point accounting',()=>{
  const review=createLearnerWrittenReview({question,response,submissionId:'attempt-submitted',decisions:{source:'met',process:'missing',replacement:'met',example:'uncertain'},reason:'I checked each required fact.',now:20});
  assert.ok(validWrittenReview(review,context()));assert.equal(review.source,'learner');assert.equal(review.model,'');
  const score=scoreWrittenReview(question,review,context());assert.equal(score.earnedPoints,1.5);assert.equal(score.pendingPoints,1);
  assert.ok(!validWrittenReview({...review,source:'local-ai'},context()));
  assert.throws(()=>createLearnerWrittenReview({question,response,submissionId:'attempt-submitted',decisions:{source:'met'}}),/exactly once/);
  assert.throws(()=>createLearnerWrittenReview({question,response,submissionId:'attempt-submitted',decisions:{source:'met',process:'met',replacement:'met',example:'invented'}}),/exactly once/);
});

test('shipped qualification metadata matches current rubric and fixture versions only for covered questions',()=>{
  assert.ok(qualifiedModels.length>0);
  for(const record of qualifiedModels){
    const [endpoint,name,digest]=record.modelIdentity.split('|');
    const settings={endpoint,model:name,models:[{name,digest}],questionId:record.coveredQuestionIds[0]};
    assert.ok(isWrittenModelQualified(record,settings,mockExam3AllQuestions,mockExam3Calibration));
    assert.ok(!isWrittenModelQualified(record,{...settings,questionId:'not-assessed'},mockExam3AllQuestions,mockExam3Calibration));
  }
  assert.ok(qualifiedModels.some(r=>r.coveredQuestionIds.includes('exam3-a-43')));
  assert.ok(qualifiedModels.some(r=>r.coveredQuestionIds.includes('exam3-a-44')));
});
