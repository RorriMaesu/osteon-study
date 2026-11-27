import test from 'node:test';
import assert from 'node:assert/strict';
import {collectingDuct} from '../src/ap3-labs-kidney.js';
import {springLabTutorContext} from '../src/ap3-labs-tutor.js';
import {checkRenalTutorReply} from '../src/ap3-renal-tutor.js';

function trial(adh,gradient,choice=0){
  return springLabTutorContext(25,collectingDuct,{activityIndex:2,values:{adh,gradient},choice,frame:0});
}

test('renal pilot reports the correct quantity, direction and driving force for every combination',()=>{
  const wrongNumber='No water was recovered, so the net water recovery is 10 mL/min.';
  const swapped='Water is reabsorbed from the interstitium into the lumen. 3.6 mL/min was recovered.';
  for(const [adh,gradient] of [[0,0],[0,1],[1,0],[1,1]]){
    const context=trial(adh,gradient),reply=checkRenalTutorReply(gradient?swapped:wrongNumber,context);
    assert.equal(reply.kind,'course-note');
    assert.equal(reply.reference,'25.8');
    assert.doesNotMatch(reply.text,/from the interstitium into the lumen/);
    const [,water,urine,conc]=collectingDuct.run({adh,gradient}).result.rows[1];
    assert.ok(reply.text.includes('recovered '+water+' of water from the duct. Urine left at '+urine+' with a concentration of '+conc));
    assert.ok(reply.text.includes('1.7 mL/min and produced 8.3 mL/min of urine at 360 mOsm/L'));
    if(!gradient)assert.match(reply.text,/no net osmotic water flux/);
  }
});

test('local renal guard protects the prediction gate and leaves independent exams and other lessons alone',()=>{
  const prompt=checkRenalTutorReply('The answer will be 840 mOsm/L.',trial(1,1,null));
  assert.doesNotMatch(prompt.text,/840|6.4|3.6/);
  assert.match(prompt.text,/Which setting changes water permeability/);
  assert.equal(checkRenalTutorReply('Which control adjusts water permeability?',trial(1,1)),null);
  const explanation='Aquaporin-2 is a water channel in principal cells. High ADH promotes insertion of these channels into the apical membrane.';
  assert.equal(checkRenalTutorReply(explanation,trial(1,1),'What is aquaporin-2?'),null);
  assert.equal(checkRenalTutorReply(explanation,trial(1,1),'What is aquaporin-2 in this trial?'),null);
  assert.equal(checkRenalTutorReply('High ADH reduces urine output by increasing apical water channels.',trial(1,1),'What does ADH do?'),null);
  assert.equal(checkRenalTutorReply('For normal plasma, a value of 290 mOsm/L is typical.',trial(1,1),'What is typical plasma osmolarity?'),null);
  assert.match(checkRenalTutorReply('High ADH closes the water channels.',trial(1,0),'What is aquaporin-2?').text,/water-permeable duct/);
  assert.match(checkRenalTutorReply('The setting changes water balance.',trial(1,1),'Explain my trial.').text,/840 mOsm/);
  assert.equal(checkRenalTutorReply('Look up the source section.',trial(1,1)),null);
  assert.equal(checkRenalTutorReply('The urine is 840 mOsm/L.',{...trial(1,1),assessmentMode:'exam'}),null);
  assert.equal(checkRenalTutorReply('The urine is 840 mOsm/L.',{...trial(1,1),diagram:{id:'ap3-lab-25-0'}}),null);
});
