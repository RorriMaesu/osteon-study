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

