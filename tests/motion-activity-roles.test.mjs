import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolveActivityRoles} from '../src/motion-activity-roles.js';
import {poseRoles} from '../src/motion-pose-core.js';

const descriptors = JSON.parse(readFileSync(new URL('../assets/motion-pose-body.json', import.meta.url), 'utf8')).joints;
const atlas = JSON.parse(readFileSync(new URL('../src/muscle-models.json', import.meta.url), 'utf8')).components;
const parts = atlas.map(part => ({...part, key: part.id}));
const byName = (name, side = 'right') => parts.find(part => part.name === name && part.side === side);
const role = (joint, axis, direction, contraction = 'contributor', stabilizer = false) => ({joint, axis, direction, contraction, stabilizer});
const resolve = (roles, supportMuscles = [], entries = parts) => resolveActivityRoles({supportMuscles}, {roles}, descriptors, entries, {});
const row = (result, name, side) => result.rows.find(item => item.key === byName(name, side)?.key);

test('eccentric phases retain the selected torque contributors and contraction label', () => {
  const result = resolve([role('right-knee', 'flexion', -1, 'eccentric')]);
  const vastus = row(result, 'Vastus lateralis muscle');
  assert(vastus);
  assert.equal(vastus.kind, 'contributor');
  assert.deepEqual(vastus.types, ['eccentric']);
  assert.equal(vastus.role, 'Lengthening under tension');
  assert(result.contributors.includes(vastus.key));
  assert(!result.contributors.some(key => parts.find(part => part.key === key)?.side === 'left'));
  const reference = poseRoles(descriptors.find(joint => joint.id === 'right-knee'), 'flexion', -1, parts);
  assert.deepEqual(result.contributors, reference.contributors);
  assert.deepEqual(result.opposing, reference.opposing);
});

test('biarticular mixed roles never imply known net shortening or lengthening', () => {
  const result = resolve([
    role('right-hip', 'flexion', -1, 'eccentric'),
    role('right-knee', 'flexion', -1, 'eccentric'),
  ], [{names: ['Rectus femoris muscle'], label: 'Possible support'}]);
  const rectus = row(result, 'Rectus femoris muscle');
  assert.equal(rectus.kind, 'mixed');
  assert.deepEqual(rectus.types, []);
  assert.equal(rectus.role, 'Mixed joint actions · net length change not inferred');
  assert(result.shared.includes(rectus.key));
  assert(!result.contributors.includes(rectus.key));
  assert(!result.opposing.includes(rectus.key));
});

test('stabilizer entries retain contraction evidence without creating an antagonist list', () => {
  const result = resolve([role('right-wrist', 'flexion', -1, 'isometric', true)]);
  assert(result.contributors.length > 0);
  assert.deepEqual(result.opposing, []);
  assert.deepEqual(result.shared, []);
  for (const item of result.rows) {
    assert.equal(item.kind, 'contributor');
    assert.deepEqual(item.types, ['isometric']);
    assert.equal(item.role, 'Holding / stabilizing');
  }
  const reference = poseRoles(descriptors.find(joint => joint.id === 'right-wrist'), 'flexion', -1, parts);
  assert.deepEqual(result.contributors, reference.contributors);
});

test('exact named support selects both sides of intended muscles without bursa or cervical matches', () => {
  const names = ['SUPRASPINATUS MUSCLE', 'infraspinatus muscle', 'Teres minor muscle', 'Subscapularis muscle', 'Multifidus lumborum muscle'];
  const result = resolve([], [{names, label: 'Possible shoulder or lumbar stabilizer'}]);
  assert.equal(result.contributors.length, 10);
  assert.deepEqual(result.opposing, []);
  assert.deepEqual(result.shared, []);
  for (const item of result.rows) {
    assert(names.some(name => name.toLowerCase() === item.name.toLowerCase()));
    assert.equal(item.role, 'Possible shoulder or lumbar stabilizer');
    assert.deepEqual(item.types, ['contributor']);
    assert.equal(item.part.kind, 'muscle');
    assert.doesNotMatch(item.name, /bursa|colli|cervic/i);
  }
  const excluded = resolve([], [{names: ['infraspinatus', 'Multifidus', 'Subtendinous bursa of infraspinatus muscle'], label: 'Unintended broad match'}]);
  assert.equal(excluded.rows.length, 0);
});

test('support for an opposing muscle explains its action without manufacturing mixed-joint evidence', () => {
  const result = resolve([role('right-shoulder', 'rotation', 1)], [
    {names: ['Infraspinatus muscle'], label: 'Possible shoulder stabilizer'},
  ]);
  const support = row(result, 'Infraspinatus muscle');
  assert.equal(support.kind, 'contributor');
  assert.equal(support.role, 'Possible shoulder stabilizer · also opposes this action');
  assert.deepEqual(support.types, ['contributor']);
  assert(result.contributors.includes(support.key));
  assert(!result.opposing.includes(support.key));
  assert(!result.shared.includes(support.key));
  assert.equal(row(result, 'Infraspinatus muscle', 'left').role, 'Possible shoulder stabilizer');
});

test('a stronger dynamic label is preserved when the same muscle is also named as support', () => {
  const result = resolve([role('right-shoulder', 'rotation', -1, 'eccentric')], [
    {names: ['Infraspinatus muscle'], label: 'Possible shoulder stabilizer'},
  ]);
  const infraspinatus = row(result, 'Infraspinatus muscle');
  assert.equal(infraspinatus.role, 'Lengthening under tension');
  assert.deepEqual(infraspinatus.types, ['eccentric']);
  assert.match(infraspinatus.action, /Possible shoulder stabilizer/);
});

test('stabilization opposite another action retains holding evidence and avoids a false mixed label', () => {
  const result = resolve([
    role('right-elbow', 'flexion', 1, 'concentric'),
    role('right-elbow', 'flexion', -1, 'isometric', true),
  ]);
  const triceps = result.rows.find(item => /triceps brachii/i.test(item.name));
  assert(triceps);
  assert.equal(triceps.kind, 'contributor');
  assert.equal(triceps.role, 'Holding / stabilizing · also opposes this action');
  assert.deepEqual(triceps.types, ['isometric']);
  assert.equal(result.shared.length, 0);
});

test('the resolver accepts atlas IDs or viewer keys, ignores unavailable joints and does not mutate inputs', () => {
  const action = role('right-elbow', 'flexion', -1, 'concentric');
  const first = resolve([action], [], parts);
  const second = resolve([action], [], atlas);
  assert.deepEqual(first.contributors, second.contributors);
  assert.deepEqual(first.opposing, second.opposing);
  const activity = Object.freeze({supportMuscles: Object.freeze([])});
  const phase = Object.freeze({roles: Object.freeze([Object.freeze({joint: 'missing', axis: 'no-axis', direction: 1})])});
  assert.deepEqual(resolveActivityRoles(activity, phase, descriptors, parts).rows, []);
  assert.deepEqual(resolveActivityRoles({}, null, descriptors, parts).rows, []);
  assert.equal(new Set(first.rows.map(item => item.key)).size, first.rows.length);
  assert(first.labels instanceof Map);
  for (const item of first.rows) assert.equal(first.labels.get(item.key), item.role);
});
