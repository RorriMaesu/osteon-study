import test from 'node:test';
import assert from 'node:assert/strict';
import {ovarian} from '../src/ap3-labs-evidence.js';
import {filtrationPressure,compensation,renalSignals,electrolyteRoles} from '../src/ap3-renal-fluid-cases.js';
import {ductSignals,familyEvidence,pregnancyLabor,gameteTimeline} from '../src/ap3-reproduction-development-cases.js';
import {springLabTutorContext} from '../src/ap3-labs-tutor.js';

test('overlapping ovarian cycle observations agree in chart, table and day readout',()=>{
  const seen=new Map();
  for(const interval of [0,1,2]){
    const data=ovarian.run({interval});
    assert.deepEqual(data.observation.rows,data.plot.rows);
    for(const [index,[day,...levels]] of data.plot.rows.entries()){
      if(seen.has(day))assert.deepEqual(seen.get(day),levels);
      seen.set(day,levels);
      assert.ok(data.frames[index][1].includes('Estradiol '+levels[0]+', LH '+levels[1]+', progesterone '+levels[2]));
    }
  }
  assert.deepEqual(seen.get(12),[91,13,7]);
});

test('filtration learners independently predict pressure and proportional GFR',()=>{
  for(const [p,c,protein,expected] of [[55,15,30,10],[55,18,30,7],[50,18,32,0],[60,10,24,26]]){
    const controls={capillary:p,capsule:c,oncotic:protein};
    assert.equal(filtrationPressure.run(controls).choices[0],expected+' mmHg');
    const flow=filtrationPressure.run(controls,[2]);
    assert.equal(flow.choices[0],(12.5*expected)+' mL/min');
    assert.equal(new Set(flow.choices).size,flow.choices.length);
  }
  assert.equal(new Set([0,1,2].map(record=>renalSignals.run({record}).choices[0])).size,3);
  assert.equal(new Set([0,1,2,3,4,5].map(field=>electrolyteRoles.run({field}).choices[0])).size,6);
});

test('four paired gases withhold the second measurement until direction, organ and timing are answered',()=>{
  for(const panel of [0,1,2,3]){
    const conditions={panel};
    for(const history of [[],[0],[0,0]]){
      const data=compensation.run(conditions,history);
      assert.equal(data.observation.rows.length,1);assert.equal(data.result,undefined);assert.ok(data.nextDecision);
    }
    assert.equal(compensation.run(conditions,[0]).choices[0],panel<2?'Kidneys':'Lungs');
    const last=compensation.run(conditions,[1,0,0]),[first,later]=last.result.rows;
    for(const [,pH,pco2,bicarb] of [first,later])assert.equal(pH,(6.1+Math.log10(bicarb/(.03*pco2))).toFixed(2));
    assert.ok(Math.abs(+later[1]-7.4)<Math.abs(+first[1]-7.4));
    const state={values:conditions,choice:null,responses:[1,0,0],frame:0,activityIndex:2};
    const ctx=springLabTutorContext(26,compensation,state);
    assert.ok(ctx.text.includes('Earlier decision'));assert.ok(!ctx.text.includes('Matched arterial blood gases'));
    assert.ok(springLabTutorContext(26,compensation,{...state,choice:0}).text.includes('Matched arterial blood gases'));
  }
});

test('the two duct signals have independent outcomes; gamete arrests and labor stages are distinct',()=>{
  for(const amh of [0,1])for(const androgen of [0,1]){
    const m=ductSignals.run({amh,androgen}),w=ductSignals.run({amh,androgen},[0]);
    assert.equal(m.choices[0]==='Regresses',Boolean(amh));
    assert.equal(w.choices[0]==='Regresses',!androgen);
    assert.equal(w.result.rows.length,2);
  }
  assert.match(gameteTimeline.run({stage:0}).choices[0],/prophase I/);
  assert.match(gameteTimeline.run({stage:2}).choices[0],/metaphase II/);
  assert.equal(new Set([4,5,6].map(stage=>pregnancyLabor.run({stage}).choices[0])).size,3);
});

test('family evidence discloses only the requested record and scores conditional risks',()=>{
  const probabilities=['1/4','1/2','1/2','1/4'];
  for(const family of [0,1,2,3]){
    const start=familyEvidence.run({family}),chosen=familyEvidence.run({family},[0]);
    assert.equal(start.observation.rows.length,3);
    assert.equal(chosen.observation.rows.length,4);
    const partial=familyEvidence.run({family},[1]);
    assert.equal(partial.choices[0],'Both hypotheses are still possible');
    assert.notDeepEqual(partial.observation.rows.at(-1),chosen.observation.rows.at(-1));
    const full=familyEvidence.run({family},[1,0]);
    assert.equal(full.observation.rows.length,5);assert.equal(full.choices[0],chosen.choices[0]);
    for(const history of [[0,0],[1,0,0]]){
      const final=familyEvidence.run({family},history);
      assert.equal(final.choices[0],probabilities[family]);assert.equal(final.nextDecision,undefined);
    }
  }
});
