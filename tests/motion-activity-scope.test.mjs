import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {activities, sampleActivity} from '../src/motion-activities.js';
import {resolveActivityRoles} from '../src/motion-activity-roles.js';
import {activityScope} from '../src/motion-activity-scope.js';

const load = name => JSON.parse(readFileSync(new URL(name, import.meta.url), 'utf8'));
const {joints} = load('../assets/motion-pose-body.json');
const parts = load('../src/muscle-models.json').components.map(part => ({...part, key: part.id}));
const targets = (id, time, scope) => {
  const activity = activities.find(item => item.id === id);
  const {phase, pose} = sampleActivity(activity, time);
  const roles = resolveActivityRoles(activity, phase, joints, parts, pose);
  const visible = activityScope(scope || activity.scope, activity, roles, joints, parts, []);
  return {roles, visible};
};
const key = (name, side) => parts.find(part => part.name === name && part.side === side).key;

test('scoped reaches keep the working shoulder girdle without opening the opposite limb', () => {
  for (const id of ['reach-forward', 'grasp']) {
    const {visible} = targets(id, 1);
    assert(visible.muscleKeys.has(key('Serratus anterior muscle', 'right')));
    assert(visible.muscleKeys.has(key('Clavicular head of pectoralis major muscle', 'right')));
    assert(!visible.muscleKeys.has(key('Serratus anterior muscle', 'left')));
  }
});

test('the head-and-neck focus retains posterior rotators on the correct side', () => {
  const {roles, visible} = targets('head-turn', 2.5);
  const splenius = key('Splenius capitis muscle', 'right');
  assert(roles.contributors.includes(splenius));
  assert(visible.muscleKeys.has(splenius));
  assert(visible.muscleKeys.has(key('Sternocleidomastoid muscle', 'left')));
  assert(!visible.muscleKeys.has(key('Gluteus maximus muscle', 'right')));
});
