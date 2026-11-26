import test from 'node:test';
import assert from 'node:assert/strict';
import {sections,sectionById} from '../src/ap2-library.js';
import {ap2GuideLessons,isAP2Context} from '../src/tutor-ap2.js';
import {retrieveSources,buildTutorMessages} from '../src/tutor-context.js';
import {sanitizeConversation,citationParts} from '../src/tutor-state.js';

test('the offline A&P II guide provides recall and application for every numbered section',()=>{
  const guide=ap2GuideLessons();
  assert.deepEqual(guide.map(row=>row.id),sections.map(s=>s.id));
  assert.equal(guide.length,49);
  for(const row of guide){
    assert.ok(row.recall.every(Boolean)&&row.application.every(Boolean)&&row.objective);
    assert.ok(row.choices.length>=2);
  }
  assert.equal(isAP2Context({reference:'12.4'}),true);
  assert.equal(isAP2Context({course:'ap2'}),true);
  assert.equal(isAP2Context({reference:'4.5'}),false);
});

test('A&P II evidence, AI messages and restored citation targets agree on the section',()=>{
  const context={course:'ap2',reference:'13.3',label:'CSF circulation'};
  const sources=retrieveSources('Why are lateral ventricles upstream of the cerebral aqueduct?',context);
  assert.equal(sources[0].reference,'13.3');
  assert.ok(sources.length<=4&&sources.every(s=>sectionById.get(s.reference)?.source===s.url&&!s.pdf));
  assert.equal(new Set(sources.map(s=>s.reference)).size,sources.length);
  const restored=sanitizeConversation([{role:'assistant',course:'ap2',content:'Follow the ventricular route [S1].',
    sources:[{...sources[0],title:'Untrusted title',url:'https://untrusted.invalid'},{id:'S2',course:'ap2',reference:'13.99',pdf:253}]}])[0];
  assert.equal(restored.course,'ap2');
  assert.equal(restored.sources.length,1);
  assert.equal(restored.sources[0].url,sectionById.get('13.3').source);
  assert.equal(restored.sources[0].title,sources[0].title);
  assert.equal(citationParts(restored.content,restored.sources).parts.at(-2).source.reference,'13.3');
  const result=buildTutorMessages('Explain the flow',[],context,'explain');
  assert.match(result.messages[0].content,/chapters 12–20/);
  assert.match(result.messages[0].content,/\[S1\].*13\.3/);
  assert.doesNotMatch(result.messages[0].content,/PDF undefined|BI 231/);
});

test('submitted question review reaches the model and a closed exam excludes all item evidence',()=>{
  const review={prompt:'Which space contains CSF around the cord?',response:'Central canal',expected:'Subarachnoid space',why:'CSF surrounds the cord between the arachnoid and pia.'};
  const context={course:'ap2',type:'review',reference:'13.3',label:'CSF',review};
  const reviewed=buildTutorMessages('Help me understand this response',[],context);
  assert.ok(reviewed.messages[0].content.includes(review.prompt));
  assert.ok(reviewed.messages[0].content.includes(review.response));
  const exam={...context,assessmentMode:'exam'};
  assert.deepEqual(retrieveSources(review.prompt,exam),[]);
  const blocked=buildTutorMessages(review.prompt,[],exam);
  assert.equal(blocked.blocked,true);
  assert.deepEqual(blocked.sources,[]);
  assert.equal(blocked.messages.length,1);
  assert.ok(!blocked.messages[0].content.includes(review.expected));
});

test('valve timing explanations use the associated pressure pair at opening and closure',()=>{
  const context={course:'ap2',reference:'19.3'};
  const cases=[
    ['Why does the aortic valve open during ventricular ejection?',/left ventricular pressure rises above aortic pressure/,/mitral valve closed earlier/,/left ventricular pressure falls below aortic pressure/],
    ['When does the mitral valve reopen and shut?',/left atrial pressure exceeds left ventricular pressure/,/mitral valve closes/,/aortic valve opens later/],
    ['Which gradient shuts the pulmonic valve?',/right ventricular pressure rises above pulmonary trunk pressure/,/tricuspid valve closed earlier/,/right ventricular pressure falls below pulmonary trunk pressure/],
    ['Explain tricuspid valve timing.',/right atrial pressure exceeds right ventricular pressure/,/tricuspid valve closes/,/pulmonary valve opens later/],
    ['When do the AV and semilunar valves open and close?',/ventricular contraction starts/,/isovolumetric contraction/,/isovolumetric relaxation/i],
  ];
  for(const [query,...checks] of cases){
    const response=buildTutorMessages(query,[],context,'explain');
    for(const pattern of checks)assert.match(response.authoredReply,pattern);
    assert.match(response.authoredReply,/\[S1\]/);
    assert.equal(response.sources[0].reference,'19.3');
    assert.equal(response.sources[0].url,sectionById.get('19.3').source);
    assert.equal(response.messages.length,0);
  }
});

test('valve timing practice gives a focused Socratic question or a cue and respects the exam boundary',()=>{
  const context={course:'ap2',reference:'19.3'};
  const query='Why does the aortic valve open during ejection?';
  const practice=buildTutorMessages(query,[],context,'socratic');
  assert.match(practice.authoredReply,/which must be higher, left ventricular pressure or aortic pressure\?/i);
  const hint=buildTutorMessages('When does it close?',[{role:'user',content:query}],context,'hint');
  assert.match(hint.authoredReply,/back toward the valve.*aortic valve to close/i);
  const ordinary=buildTutorMessages('Explain how the SA node starts a heartbeat.',[],context,'explain');
  assert.equal(ordinary.authoredReply,undefined);
  assert.ok(ordinary.messages.length>=2);
  const structural=buildTutorMessages('What tissue forms the aortic valve cusps?',[],context,'explain');
  assert.equal(structural.authoredReply,undefined);
  const inExam=buildTutorMessages(query,[],{...context,assessmentMode:'exam'},'explain');
  assert.equal(inExam.authoredReply,undefined);
  assert.equal(inExam.blocked,true);
  assert.deepEqual(inExam.sources,[]);
});
