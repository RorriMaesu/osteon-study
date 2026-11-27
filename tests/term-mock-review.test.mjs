import test from 'node:test';
import assert from 'node:assert/strict';
import {
  gradeTermItem, scoreTermAttempt, confirmTermWritten, getTermMeaningReview,
  confirmTermMeaning, termNotes, termRetestItems, termWrittenFixtures, refineTermNote
} from '../src/term-mock-review.js';
import {interpretWrittenReview,compactWrittenQualification, WRITTEN_PROMPT_VERSION} from '../src/written-answer-judge.js';
import {localAI} from '../src/local-ai.js';

const written={id:'water-a',section:'26.2',type:'written',points:3,
  prompt:'Explain the ADH response, a renal change and what happens to the urine during water deprivation.',
  why:'Water deprivation increases ADH and water reabsorption and concentrates the urine.',
  rubric:{id:'water-balance',version:'1',criteria:[
    {id:'signal',label:'Hormone signal',description:'ADH release increases.',points:1},
    {id:'effect',label:'Collecting duct',description:'Water permeability increases.',points:1},
    {id:'urine',label:'Urine',description:'Less, more concentrated urine is passed.',points:1}
  ],fixtures:[{id:'missing-renal',response:'ADH rises.',expectedPoints:{signal:1,effect:0,urine:0}}]}};
const objective={id:'heart-a',section:'19.4',type:'short',objective:'cardiac-output',points:2,
  prompt:'Use the volumes and heart rate.',stimulus:{columns:['EDV','ESV','Rate'],rows:[['120 mL','50 mL','75/min']]},
  why:'Stroke volume is end-diastolic minus end-systolic volume. Multiply it by heart rate for cardiac output.',
  parts:[{type:'number',prompt:'Give stroke volume in mL/beat.',unit:'mL/beat',expected:'70'},
    {type:'number',prompt:'Give cardiac output in L/min.',unit:'L/min',expected:'5.25'}]};
const terms={id:'flow-a',section:'21.1',type:'short',points:2,prompt:'Trace lymph through the node.',
  why:'Afferent vessels carry lymph into a node. Efferent vessels carry it away.',
  parts:[{type:'term',prompt:'Name the vessel carrying lymph away from the node.',expected:'efferent lymphatic vessel',
    aliases:['efferent vessel','efferent'],opposites:['afferent','afferent lymphatic vessel']},
  {type:'term',prompt:'Which cord drains?',expected:'thoracic duct',aliases:['left lymphatic duct']}]};
const choice={id:'change-a',section:'26.2',type:'choice',points:1,prompt:'With ADH higher, what changes?',
  choices:['More collecting duct water permeability','Less collecting duct water permeability'],answer:0,why:written.why};
const writtenQuestion={...written,answer:written.why,explanation:written.why,sourceContext:[]};
function attempt(items,answers) {
  return {id:'ap3-attempt-1',course:'ap3',items,answers,assisted:{},submitted:1,
    grades:Object.fromEntries(items.map(q=>[q.id,gradeTermItem(q,answers[q.id])])),reviews:{}};
}
const response='ADH rises.';
const parsed={components:[
  {id:'signal',decision:'met',evidence:['ADH rises'],reason:'You stated the hormone change.'},
  {id:'effect',decision:'missing',evidence:[],reason:'Mention collecting-duct water permeability.'},
  {id:'urine',decision:'missing',evidence:[],reason:'Explain the change in urine.'}
],feedback:'Your description includes the hormone response.',studyNote:'Connect ADH to water retention.'};
const endpoint='http://127.0.0.1:11434', model='local:model', modelEntry={name:model,digest:'abcd'};
const ctx={question:writtenQuestion,response,submissionId:'ap3-attempt-1',endpoint,model,modelIdentity:endpoint+'|'+model+'|abcd'};

test('signed quantities and equivalent units retain per-part credit',()=>{
  assert.deepEqual(gradeTermItem(objective,['70','5,250 mL/min']).parts.map(p=>p.earned),[1,1]);
  assert.equal(gradeTermItem(objective,['70','-5.25 L/min']).earned,1);
  assert.equal(gradeTermItem(objective,['70','5.25 mg/min']).earned,1);
  assert.equal(gradeTermItem(objective,['-70 mL/beat','5.25']).status,'partial');
  assert.equal(gradeTermItem(objective,['0.07 L/beat','5.25']).earned,2);
  assert.equal(gradeTermItem(objective,['0.07 L/min','5.25']).earned,1);
  assert.equal(gradeTermItem(choice,'0').parts[0].response,choice.choices[0]);
  assert.equal(gradeTermItem(choice,'').status,'unanswered');
});

test('physiology identifiers retain ABO, Rh, ion and molecular identity',()=>{
  const check=(expected,raw)=>gradeTermItem({id:'lab-value',points:1,parts:[{type:'term',prompt:'Name it',expected}]},[raw]).status;
  assert.equal(check('AB positive','AB+'),'correct');
  assert.equal(check('A+','B+'),'incorrect');
  assert.equal(check('AB negative','AB+'),'incorrect');
  assert.equal(check('carbon dioxide','CO₂'),'correct');
  assert.equal(check('CO₂','O₂'),'incorrect');
  assert.equal(check('K⁺','Na⁺'),'incorrect');
  assert.equal(check('increases','decreases'),'incorrect');
});

test('known opposite and its close typo cannot receive anatomical credit or AI override',async()=>{
  for(const v of ['afferent','afferent lymphatic vessel','affernt','not efferent but afferent']){
    const result=gradeTermItem(terms,[v,'thoracic duct']);
    assert.equal(result.earned,1,v);
    assert.equal(result.pending,0,v);
    await assert.rejects(getTermMeaningReview(terms,0,v,'ap3-attempt-1'),/unresolved/);
  }
  assert.equal(gradeTermItem(terms,['efferent','left lymphatic duct']).status,'equivalent');
  const typos=gradeTermItem(terms,['efferent','throacic duct']);
  assert.equal(typos.earned,2);
  assert.equal(typos.status,'spelling');
  const surface={...terms,parts:[{type:'surface',prompt:'Pick the target',specimen:'renal',expected:'cortex',labels:{cortex:'Renal cortex',pelvis:'Renal pelvis'}}]};
  assert.equal(gradeTermItem(surface,['pelvis']).parts[0].response,'Renal pelvis');
});

test('written points remain pending until a valid decision, with blanks acknowledged separately',()=>{
  const a=attempt([choice,written],{[written.id]:response,[choice.id]:'0'}), before=JSON.stringify(a);
  const original=scoreTermAttempt(a);
  assert.deepEqual([original.earned,original.pending,original.missed,original.possible],[1,3,0,4]);
  assert.equal(gradeTermItem(written,' ').pending,0);
  assert.equal(gradeTermItem(written,' ').status,'unanswered');
  assert.deepEqual(termNotes(a),[]);
  assert.equal(JSON.stringify(a),before);
  a.reviews[written.id]={written:interpretWrittenReview(parsed,ctx)};
  assert.equal(scoreTermAttempt(a).pending,3);
  assert.equal(scoreTermAttempt(a).rows[1].suggestion.components[0].evidence[0],'ADH rises');
  a.reviews[written.id].confirmed=confirmTermWritten(written,response,a.id,{signal:'met',effect:'missing',urine:'uncertain'});
  const scored=scoreTermAttempt(a);
  assert.deepEqual([scored.earned,scored.pending,scored.missed],[2,1,1]);
  assert.equal(scored.rows[1].grade.source,'learner');
  assert.deepEqual(a.grades[written.id],original.rows[1].grade);
  assert.equal(termNotes(a).length,1);
  assert.equal(termNotes(a)[0].rule,'Water permeability increases.');
  assert.equal(scoreTermAttempt({...a,id:'different-submission'}).pending,3);
  assert.equal(scoreTermAttempt({...a,items:[choice,{...written,rubric:{...written.rubric,version:'2'}}]}).pending,3);
});

test('exact question, model identity, and stored fixture results are necessary for automatic written scoring',()=>{
  const a=attempt([written],{[written.id]:response});
  const [fixture]=termWrittenFixtures(written);
  const calibrated=interpretWrittenReview(parsed,{...ctx,submissionId:'calibration-'+fixture.id});
  const qualification=compactWrittenQualification({promptVersion:WRITTEN_PROMPT_VERSION,cases:[{id:fixture.id,review:calibrated}]},[fixture],[writtenQuestion]);
  assert.equal(qualification.passed,true);
  a.reviews[written.id]={written:{...interpretWrittenReview(parsed,ctx),qualification,modelEntry}};
  assert.equal(scoreTermAttempt(a).earned,1);
  assert.equal(scoreTermAttempt(a).pending,0);
  a.reviews[written.id].written.modelEntry={...modelEntry,digest:'new-weights'};
  assert.equal(scoreTermAttempt(a).pending,3);
  a.reviews[written.id].written.modelEntry=modelEntry;
  a.reviews[written.id].written.components[0].evidence=['invented quote'];
  assert.equal(scoreTermAttempt(a).pending,3);
});

test('unclear term meaning can be resolved offline for the specific unchanged answer',()=>{
  const raw='vessel taking lymph from the node';
  const a=attempt([terms],{[terms.id]:[raw,'throacic duct']});
  assert.equal(scoreTermAttempt(a).pending,1);
  const request=confirmTermMeaning(terms,0,raw,a.id,'equivalent');
  a.reviews[terms.id]={manualMeanings:{0:request}};
  assert.equal(scoreTermAttempt(a).earned,2);
  assert.equal(scoreTermAttempt(a).rows[0].grade.parts[0].source,'learner');
  assert.deepEqual(termNotes(a).map(n=>n.kind),['spelling']);
  assert.equal(scoreTermAttempt({...a,id:'other'}).pending,1);
  a.reviews[terms.id].manualMeanings[0]={...request,response:'another answer'};
  assert.equal(scoreTermAttempt(a).pending,1);
});

test('retest uses fresh evidence for confirmed gaps and skips an unmatched chapter',()=>{
  const a=attempt([objective,terms],{[objective.id]:['70','5250 L/min'],[terms.id]:['efferent','throacic duct']});
  const matching={...objective,id:'new',stimulus:{columns:['EDV','ESV','Rate'],rows:[['110 mL','40 mL','100/min']]}};
  const duplicate={...objective,id:'same-stimulus'};
  const unrelated={...matching,id:'unrelated',section:'25.1'};
  assert.deepEqual(termRetestItems(a,[objective,duplicate,unrelated,matching]).map(q=>q.id),['new']);
  assert.deepEqual(termNotes(a).map(n=>n.kind),['concept','spelling']);
  const notes=termNotes(a);
  return assert.rejects(refineTermNote(a,{...notes[0],basis:'a stale correction'}),/changed/);
});

test('eligible local meaning review binds the decision to the submitted term and selected model',async()=>{
  const saved={state:localAI.state,client:localAI.client,preferences:{...localAI.preferences}};
  const entry={...modelEntry,size:1000,info:{capabilities:['completion'],details:{format:'gguf'}}};
  const client={endpoint,connect:async()=>({models:[entry]}),show:async()=>entry.info,request:async()=>({
    done:true,message:{content:JSON.stringify({verdict:'equivalent',confidence:'high',correctedAnswer:'efferent lymphatic vessel',
      explanation:'Your wording correctly identifies the direction away from the node.'})}
  })};
  const raw='vessel taking lymph from the node', a=attempt([terms],{[terms.id]:[raw,'thoracic duct']});
  try {
    localAI.client=client;localAI.state={...saved.state,endpoint,model,connected:true,ready:true,models:[entry]};
    const result=await getTermMeaningReview(terms,0,raw,a.id);
    assert.equal(result.review.verdict,'equivalent');
    a.reviews[terms.id]={meanings:{0:result}};
    assert.equal(scoreTermAttempt(a).earned,2);
    assert.equal(a.grades[terms.id].pending,1);
    assert.equal(scoreTermAttempt({...a,id:'wrong-submission'}).pending,1);
    a.reviews[terms.id].meanings[0]={...result,review:{...result.review,confidence:'low'}};
    assert.equal(scoreTermAttempt(a).pending,1);

    const missed=attempt([choice],{[choice.id]:'1'}), [note]=termNotes(missed);
    client.request=async()=>({done:true,message:{content:JSON.stringify({coaching:'Trace the change from ADH to collecting-duct permeability.'})}});
    const cue=await refineTermNote(missed,note);
    assert.equal(cue.basis,note.basis);
    assert.equal(cue.model,model);
    assert.deepEqual(termNotes(missed)[0],note);
  } finally {Object.assign(localAI,saved);}
});
