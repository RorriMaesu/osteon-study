import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {sampleWalk} from '../src/motion-walk.js';

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
