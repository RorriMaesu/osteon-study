import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {sampleWalk,walkTeachingComponentKeys,walkTeachingRoles} from '../src/motion-walk.js';

const walk = JSON.parse(readFileSync(new URL('../src/motion-gait-data.json', import.meta.url)));

test('walking data use one measured left heel-to-heel clock and ordered bilateral contacts', () => {
  assert.equal(walk.source.doi, 'https://doi.org/10.6084/m9.figshare.13169240.v1');
  assert.equal(walk.source.license, 'CC0-1.0');
  assert.equal(walk.source.participant, 1);
  assert.equal(walk.source.trial, 1);
  assert.equal(walk.source.speedKmh, 4);
  assert.equal(walk.durationSeconds, 1.055);
  assert.ok(Math.abs(walk.source.endSeconds - walk.source.startSeconds - walk.durationSeconds) < 1e-9);
  assert.deepEqual(walk.events.map(({timeSeconds, side, phase}) => [timeSeconds, side, phase]), [
    [0, 'left', 'initial-contact'],
    [0.11, 'right', 'toe-off'],
    [0.54, 'right', 'initial-contact'],
    [0.66, 'left', 'toe-off'],
    [1.055, 'left', 'initial-contact'],
  ]);

  const state = {left: false, right: true};
  let eventIndex = 0;
  assert.equal(walk.samples.length, 101);
  for (const [i, sample] of walk.samples.entries()) {
    assert.equal(sample.percent, i);
    const t = i / 100 * walk.durationSeconds;
    while (walk.events[eventIndex]?.timeSeconds <= t) {
      const event = walk.events[eventIndex++];
      state[event.side] = event.phase === 'initial-contact';
    }
    for (const side of ['left', 'right']) {
      assert.equal(sample[side].contact, state[side], side + ' at ' + i + '%');
      assert.equal(sample[side].verticalForceN !== null && sample[side].verticalForceN >= 20, state[side]);
    }
  }
});

test('sagittal motion and EMG retain the source units and measured channels', () => {
  const names = ['bicepsFemoris', 'lateralGastrocnemius', 'tibialisAnterior', 'vastusLateralis'];
  for (const sample of walk.samples) {
    assert.ok(Object.values(sample.pelvis).every(Number.isFinite));
    for (const side of [sample.left, sample.right]) {
      assert.ok(side.hip >= -30 && side.hip <= 45);
      assert.ok(side.knee >= -5 && side.knee <= 85);
      assert.ok(side.ankle >= -30 && side.ankle <= 30);
      assert.deepEqual(Object.keys(side.emg).sort(), names);
      assert.ok(Object.values(side.emg).every(value => Number.isFinite(value) && value >= 0));
    }
  }
  assert.match(walk.source.angles, /hip and knee flexion and ankle dorsiflexion are positive/i);
  assert.match(walk.source.emg, /percent of each channel's maximum voluntary contraction/);
  // The published %MVC amplitude remains anchored to source measurements rather than to a sample max.
  assert.equal(walk.samples[0].left.emg.vastusLateralis, 74.122);
  assert.equal(walk.samples[0].left.knee, 4.553);
  assert.equal(walk.samples.at(-1).left.knee, 2.62);
  assert.equal(walk.samples[0].pelvis.forwardMeters, 0);
  assert.equal(walk.samples.at(-1).pelvis.forwardMeters, 1.20621);
});


test('playback uses both recorded contacts and exact per-muscle MVC channels',()=>{
 assert.equal(sampleWalk(walk,0).left.emg['vastus-lateralis'],74.122);
 assert.equal(sampleWalk(walk,.109).right.contact,true);
 assert.equal(sampleWalk(walk,.11).right.contact,false);
 assert.equal(sampleWalk(walk,.54).right.contact,true);
 assert.equal(sampleWalk(walk,.66).left.contact,false);
 assert.equal(sampleWalk(walk,1.055).left.contact,true);
 const end=sampleWalk(walk,1.055);
 assert.equal(end.pelvis.forwardMeters,1.20621);
 assert.notEqual(end.right.knee,sampleWalk(walk,0).right.knee);
});

test('qualitative roles follow each recorded leg contact without changing or imitating the EMG channels',()=>{
 const first=sampleWalk(walk,0);
 const snapshot=structuredClone(first);
 const atStart=walkTeachingRoles(walk,first);
 assert.deepEqual(first,snapshot);
 assert.deepEqual(atStart.phases,{left:'Accept weight',right:'Prepare to lift the foot'});
 assert.ok(atStart.byKey.has('muscle-gluteus-maximus-muscle-l'));
 assert.ok(atStart.byKey.has('muscle-soleus-muscle-r'));
 assert.ok(!atStart.byKey.has('muscle-gluteus-maximus-muscle-r'));
 assert.ok([...atStart.byKey.values()].every(detail=>typeof detail==='string'&&!/%|MVC|recorded/i.test(detail)));
 const atToeOff=walkTeachingRoles(walk,sampleWalk(walk,.11));
 assert.equal(atToeOff.phases.right,'Clear and advance the leg');
 assert.ok(atToeOff.byKey.has('muscle-iliacus-muscle-r'));
 assert.ok(!atToeOff.byKey.has('muscle-soleus-muscle-r'));
 assert.equal(walkTeachingRoles(walk,sampleWalk(walk,.54)).phases.right,'Accept weight');
 assert.equal(walkTeachingRoles(walk,sampleWalk(walk,.66)).phases.left,'Clear and advance the leg');
 assert.deepEqual(walkTeachingRoles(walk,sampleWalk(walk,walk.durationSeconds)),atStart);
});

test('every qualitative role points to an actual shipped walking muscle',()=>{
 const manifest=JSON.parse(readFileSync(new URL('../assets/motion-walk-muscles.json',import.meta.url)));
 const glb=readFileSync(new URL('../assets/'+manifest.regions['pelvis-leg-foot'].file,import.meta.url));
 const document=JSON.parse(glb.subarray(20,20+glb.readUInt32LE(12)).toString('utf8'));
 const keys=new Set([...manifest.baseMuscleIds,...document.nodes.map(node=>node.extras?.muscleId)]);
 for(const key of walkTeachingComponentKeys)assert.ok(keys.has(key),'Missing gait muscle '+key);
});
