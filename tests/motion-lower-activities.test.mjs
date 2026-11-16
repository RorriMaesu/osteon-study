import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {activities, sampleActivity} from '../src/motion-activities.js';
import {preparePoseRig} from '../src/motion-pose-rig.js';
import {applyActivityPose} from '../src/motion-activity-placement.js';
import {resolveActivityRoles} from '../src/motion-activity-roles.js';

const meta = JSON.parse(fs.readFileSync(new URL('../assets/motion-pose-body.json', import.meta.url)));
const atlas = JSON.parse(fs.readFileSync(new URL('../src/muscle-models.json', import.meta.url))).components.map(part => ({...part, key: part.id}));
const bytes = fs.readFileSync(new URL('../assets/motion-pose-body.glb', import.meta.url));
const gltf = JSON.parse(bytes.toString('utf8', 20, 20 + bytes.readUInt32LE(12)));
const ids = ['squat', 'hip-hinge', 'walking', 'running', 'jumping', 'heel-raise'];
const byId = id => activities.find(activity => activity.id === id);
const floorTolerance = .0002; // Sub-millimeter source-mesh asymmetry, not arbitrary joint proxies.

function specimen() {
  const model = new THREE.Group(), nodes = new Map(meta.nodes.map(entry => [entry.id, new THREE.Object3D()]));
  for (const descriptor of meta.nodes) {
    const node = nodes.get(descriptor.id);
    node.name = descriptor.name;
    node.position.fromArray(descriptor.pivot);
    if (descriptor.parent) {
      node.position.sub(new THREE.Vector3(...meta.nodes.find(item => item.id === descriptor.parent).pivot));
      nodes.get(descriptor.parent).add(node);
    } else model.add(node);
  }
  const rig = preparePoseRig(model, {...meta, totalMuscleSurfaces: 0});
  // Use the actual asset's bone bounds and drivers. Ankle-only proxies missed
  // the original inverted walking contact and early swing toe penetration.
  rig.bones = gltf.nodes.filter(node => node.extras?.poseBone).map(node => ({
    name: node.extras.poseBone, side: node.extras.poseSide, poseDrivers: node.extras.poseDrivers,
    mesh: {userData: node.extras},
  }));
  return rig;
}
function apply(rig, activity, time) {
  const sample = sampleActivity(activity, time);
  applyActivityPose(rig, sample.pose, sample.root, {ground: activity.ground, rootRotation: sample.rootRotation, contacts: sample.contacts});
  return sample;
}
const footFloor = (rig, side) => Math.min(...rig.activityPlacement.probes.filter(probe => probe.side === side)
  .map(probe => probe.node.localToWorld(probe.point.clone()).y));
const resolved = (id, time) => {
  const activity = byId(id), sample = sampleActivity(activity, time);
  return resolveActivityRoles(activity, sample.phase, meta.joints, atlas, sample.pose);
};
const row = (result, name, side = 'right') => result.rows.find(item => item.name === name && item.side === side);

test('all lower-body named candidates resolve exactly to the intended atlas side and muscle', () => {
  for (const id of ids) {
    const activity = byId(id);
    for (const phase of activity.phases) {
      assert(phase.contacts, id + ': missing explicit contact');
      const result = resolved(id, (phase.start + phase.end) / 2);
      for (const entry of phase.namedRoles) for (const name of entry.names) {
        const expected = atlas.filter(part => part.kind === 'muscle' && part.name === name && (!entry.side || part.side === entry.side));
        assert(expected.length > 0, id + ': ' + name);
        for (const part of expected) assert(result.rows.some(item => item.key === part.key), id + ': unresolved ' + part.key);
      }
      for (const item of result.rows) {
        assert.equal(item.part.kind, 'muscle');
        assert(phase.namedRoles.some(entry => entry.names.includes(item.name) && (!entry.side || entry.side === item.side)));
      }
    }
  }
});

test('actual GLB foot probes stay above the floor and each declared stance foot is grounded', () => {
  const rig = specimen();
  for (const id of [...ids, 'dance']) {
    const activity = byId(id);
    for (let step = 0; step <= 800; step++) {
      const time = activity.duration * step / 800, sample = apply(rig, activity, time);
      for (const side of ['left', 'right']) {
        const height = footFloor(rig, side);
        assert(height >= -floorTolerance, `${id} ${side} penetrates at ${time}: ${height}`);
        if (sample.contacts[side] !== 'air') assert(Math.abs(height) < floorTolerance, `${id} ${side} support floats at ${time}: ${height}`);
      }
    }
  }
});

test('walking support and swing highlights agree with the actual foot contact on both sides', () => {
  const rig = specimen(), walk = byId('walking');
  for (const [time, support, swing] of [[.5, 'right', 'left'], [1, 'right', 'left'], [1.5, 'right', 'left'], [2.5, 'left', 'right'], [3, 'left', 'right'], [3.5, 'left', 'right']]) {
    const sample = apply(rig, walk, time);
    assert.equal(sample.contacts[support], 'flat');
    assert.equal(sample.contacts[swing], 'air');
    assert(Math.abs(footFloor(rig, support)) < floorTolerance);
    assert(footFloor(rig, swing) > .003, 'Swing foot must visibly clear the floor');
    assert(row(resolved('walking', time), 'Soleus muscle', support));
  }
  for (const time of [.1, 2.1]) {
    const sample = apply(rig, walk, time);
    assert.equal(Object.values(sample.contacts).filter(mode => mode !== 'air').length, 2);
    assert(Math.abs(footFloor(rig, 'left')) < floorTolerance);
    assert(Math.abs(footFloor(rig, 'right')) < floorTolerance);
  }
});

test('running and jumping leave the floor only after the authored toe-off event', () => {
  const rig = specimen();
  for (const id of ['running', 'jumping']) {
    const activity = byId(id);
    for (const phase of activity.phases) {
      const airborne = Object.values(phase.contacts).every(mode => mode === 'air');
      for (const fraction of [.05, .25, .5, .75, .95]) {
        const sample = apply(rig, activity, phase.start + (phase.end - phase.start) * fraction);
        const floor = Math.min(footFloor(rig, 'left'), footFloor(rig, 'right'));
        if (airborne) {
          assert(sample.root[1] > 0, id + ': flight needs lift');
          assert(floor > 0, id + ': flight should not claim grounded support');
        } else {
          assert.equal(sample.root[1], 0, id + ': premature lift during ' + phase.label);
          assert(Math.abs(floor) < floorTolerance);
        }
      }
    }
  }
});

test('stopping a walk or run at its exact endpoint reports the reached contact rather than the preceding swing', () => {
  const rig = specimen();
  for (const id of ['walking', 'running']) {
    const activity = byId(id), start = apply(rig, activity, 0), end = apply(rig, activity, activity.duration);
    assert.equal(end.done, true);
    assert.equal(end.time, activity.duration);
    assert.deepEqual(end.pose, start.pose);
    assert.deepEqual(end.contacts, start.contacts);
    assert.equal(end.phase, start.phase);
    assert(Object.values(end.contacts).some(mode => mode !== 'air'));
    assert(Math.abs(footFloor(rig, 'right')) < floorTolerance);
  }
});

test('terminal-swing braking selects hamstrings without recruiting every anatomical knee flexor', () => {
  for (const [time, side] of [[1.25, 'left'], [2.75, 'right']]) {
    const result = resolved('running', time);
    for (const name of ['Long head of biceps femoris', 'Semimembranosus muscle', 'Semitendinosus muscle']) {
      assert.deepEqual(row(result, name, side).types, ['contributor']);
      assert.match(row(result, name, side).action, /net fascicle length is not inferred/);
    }
    assert.deepEqual(row(result, 'Short head of biceps femoris', side).types, ['eccentric']);
    for (const name of ['Popliteus muscle', 'Sartorius muscle', 'Gracilis muscle', 'Plantaris muscle', 'Medial head of gastrocnemius']) assert(!row(result, name, side), name + ' is not automatically a swing brake');
  }
});

test('gait calf roles describe support without inventing eccentric fascicle behavior', () => {
  for (const [id, time, side] of [['walking', .8, 'right'], ['walking', 2.8, 'left'], ['running', .2, 'right'], ['running', 1.7, 'left']]) {
    const result = resolved(id, time);
    for (const name of ['Soleus muscle', 'Medial head of gastrocnemius', 'Lateral head of gastrocnemius']) {
      assert.deepEqual(row(result, name, side).types, ['contributor']);
      assert.match(row(result, name, side).action, /fascicle behavior is not inferred/);
    }
    for (const name of ['Flexor hallucis longus', 'Flexor digitorum longus', 'Plantaris muscle']) assert(!row(result, name, side));
  }
});

test('squat arm control is separate from leg control and the hip hinge does not infer effort in hanging arms', () => {
  for (const [time, legType, armType] of [[1, 'eccentric', 'concentric'], [3.5, 'isometric', 'isometric'], [5, 'concentric', 'eccentric']]) {
    const result = resolved('squat', time);
    assert.deepEqual(row(result, 'Vastus lateralis muscle').types, [legType]);
    assert.deepEqual(row(result, 'Clavicular part of deltoid muscle').types, [armType]);
    assert(row(result, 'Multifidus lumborum muscle'));
    assert.deepEqual(row(result, 'Long head of biceps femoris').types, ['contributor']);
  }
  for (const time of [1, 3.5, 5]) {
    const result = resolved('hip-hinge', time);
    assert(row(result, 'Gluteus maximus muscle'));
    assert(row(result, 'Multifidus lumborum muscle'));
    assert(!row(result, 'Clavicular part of deltoid muscle'));
  }
});

test('heel raising distinguishes calf action, foot support and passive toe positioning', () => {
  for (const [time, contraction] of [[1, 'concentric'], [3, 'isometric'], [5, 'eccentric']]) {
    const result = resolved('heel-raise', time);
    assert.deepEqual(row(result, 'Soleus muscle').types, [contraction]);
    assert.deepEqual(row(result, 'Fibularis longus muscle').types, ['contributor']);
    assert.equal(row(result, 'Tibialis anterior muscle').kind, 'opponent');
    assert(!result.rows.some(item => /extensor (digitorum|hallucis)/i.test(item.name)));
  }
});
