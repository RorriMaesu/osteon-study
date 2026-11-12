import test from 'node:test';
import assert from 'node:assert/strict';
import {muscleReasoning,reasoningDrawing,reasoningFeedback} from '../src/muscle-reasoning.js';
import {muscleActivityChoices} from '../src/muscle-labs.js';
import {couplingEvents} from '../src/muscle-activities.js';
import glossary from '../src/glossary.json' with {type:'json'};

test('guided physiology cases remain reachable in their own chapter section and give specific feedback',()=>{
 const ids=new Set();
 for(const [activity,lab] of Object.entries(muscleReasoning)){
  assert.ok(muscleActivityChoices[lab.section].some(([id])=>id===activity),activity);
  assert.match(reasoningDrawing(lab.art),/role="img" aria-label="[^\"]+"/);
  for(const [index,c] of lab.cases.entries()){
   const id=activity+':'+c.id;assert.ok(!ids.has(id));ids.add(id);
   assert.equal(new Set(c.options).size,c.options.length);
   assert.equal(reasoningFeedback(activity,index,null),null);
   assert.equal(reasoningFeedback(activity,index,-1),null);
   assert.equal(reasoningFeedback(activity,index,c.options.length),null);
   assert.equal(reasoningFeedback(activity,index,c.key).matches,true);
   assert.equal(reasoningFeedback(activity,index,(c.key+1)%c.options.length).matches,false);
   assert.equal(reasoningFeedback(activity,index,c.key).explanation,c.explanation);
  }
 }
 assert.ok(ids.size>=25);
 assert.equal(reasoningFeedback('unknown',0,0),null);
});
test('signal pathway distinguishes compartments and explicitly teaches the AChE tested in practice',()=>{
 assert.match(couplingEvents[0][1],/Calcium entry into that terminal/);
 assert.match(couplingEvents[1][1],/voltage-gated sodium/);
 assert.match(couplingEvents[2][1],/does not carry acetylcholine/);
 assert.match(couplingEvents[3][1],/reticulum into the sarcoplasm/);
 assert.match(couplingEvents.at(-1)[1],/Acetylcholinesterase \(AChE\)/);
 assert.match(couplingEvents.at(-1)[1],/ATP-dependent pumps/);
});
test('glossary no longer reintroduces shortening-only contraction or voltage/force confusion',()=>{
 const cue=name=>glossary.find(x=>x.chapter===10&&x.name===name).cue;
 assert.match(cue('contractility'),/active force/);
 assert.match(cue('eccentric contraction'),/active muscle force/i);
 assert.doesNotMatch(cue('eccentric contraction'),/tension is diminished/);
 assert.match(cue('isotonic contraction'),/approximately constant tension/);
 assert.match(cue('latent period'),/before measurable twitch tension/);
 assert.match(cue('excitability'),/need not always be a nerve/);
 assert.match(cue('myogram'),/recording instrument/);
 assert.match(cue('wave summation'),/action potentials themselves do not add/);
 assert.match(cue('satellite cell'),/outside the sarcolemma/);
});
test('cardiac illustration separates voltage from force and warns that the trace is a contractile-cell example',()=>{
 const lab=muscleReasoning['cardiac-timing'];
 assert.match(reasoningDrawing(lab.art),/Voltage/);assert.match(reasoningDrawing(lab.art),/Force/);
 assert.match(lab.cases[0].explanation,/pacemaker-cell activity is different/i);
 assert.match(lab.cases[1].explanation,/Electrical coordination cannot substitute/);
});
