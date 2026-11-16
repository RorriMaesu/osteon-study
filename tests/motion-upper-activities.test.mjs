import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildUpperActivities} from '../src/motion-upper-activities.js';
import {resolveActivityRoles} from '../src/motion-activity-roles.js';
import {boxingHandPose} from '../src/motion-boxing-hands.js';

// Exercise the independently authored module with the catalog's small helper
// contract, and resolve its phases against the real atlas and rig inventory.
const role = (joint, axis, direction, contraction = 'contributor') => ({joint, axis, direction, contraction});
const both = (joint, axes) => Object.fromEntries(['right', 'left'].map(side => [side + '-' + joint, {...axes}]));
const fixtures = buildUpperActivities({
  activity: definition => definition,
  source: (...ids) => ids.map(id => ({title: id, url: 'https://openstax.org/' + id})),
  both, role,
  bilateral: (joint, axis, direction, contraction) => ['right', 'left'].map(side => role(side + '-' + joint, axis, direction, contraction)),
  phase: (start, end, label, explanation, roles) => ({start, end, label, explanation, roles}),
  frame: (time, pose = {}, root = [0, 0, 0], rootRotation = [0, 0, 0]) => ({time, pose, root, rootRotation}),
});
const descriptors = JSON.parse(readFileSync(new URL('../assets/motion-pose-body.json', import.meta.url), 'utf8')).joints;
const parts = JSON.parse(readFileSync(new URL('../src/muscle-models.json', import.meta.url), 'utf8')).components.map(part => ({...part, key: part.id}));
const joints = new Map(descriptors.map(joint => [joint.id, joint]));
const at = (id, time) => fixtures[id].phases.find(phase => phase.start <= time && time < phase.end);
const resultAt = (id, time) => resolveActivityRoles(fixtures[id], at(id, time), descriptors, parts);
const row = (result, name, side = 'right') => result.rows.find(entry => entry.name === name && entry.side === side);
const hasRole = (entry, joint, axis, direction) => entry.roles.some(value => value.joint === joint && value.axis === axis && value.direction === direction);
const assertContributor = (result, name, side = 'right') => {
  const entry = row(result, name, side);
  assert(entry, name + ' is missing on ' + side);
  assert.equal(entry.kind, 'contributor', name + ' should contribute on ' + side);
  return entry;
};

test('six upper activities have complete phase coverage and valid real rig keyframes', () => {
  assert.deepEqual(Object.keys(fixtures), ['reach-forward', 'reach-up', 'fist', 'grasp', 'dance', 'head-turn']);
  for (const activity of Object.values(fixtures)) {
    assert.equal(activity.phases[0].start, 0, activity.id);
    assert.equal(activity.phases.at(-1).end, activity.duration, activity.id);
    activity.phases.forEach((phase, index) => {
      assert(phase.end > phase.start);
      if (index) assert.equal(phase.start, activity.phases[index - 1].end, activity.id);
      for (const role of phase.roles) {
        assert(joints.get(role.joint)?.axes.some(axis => axis.id === role.axis), activity.id + ' ' + role.joint + ':' + role.axis);
        assert([1, -1].includes(role.direction));
      }
      for (const named of phase.namedRoles || []) {
        for (const name of named.names) {
          const matches = parts.filter(part => part.name === name && (!named.side || named.side === part.side));
          assert(matches.length > 0, activity.id + ' unknown named muscle ' + name);
          assert(matches.every(part => part.kind === 'muscle'), 'Support must not match a bursa, tendon or sheath');
        }
      }
    });
    assert.deepEqual(activity.keyframes[0].pose, activity.keyframes.at(-1).pose, activity.id);
    assert.deepEqual(activity.keyframes[0].root, activity.keyframes.at(-1).root, activity.id);
    for (const keyframe of activity.keyframes) for (const [id, axes] of Object.entries(keyframe.pose)) {
      for (const [axisId, value] of Object.entries(axes)) {
        const axis = joints.get(id)?.axes.find(axis => axis.id === axisId);
        assert(axis, id + ':' + axisId);
        assert(value >= axis.min && value <= axis.max, activity.id + ' ' + id + ':' + axisId + ' = ' + value);
      }
    }
  }
});

test('reaching includes the animated elbow and phase-scoped cuff support', () => {
  for (const [id, times, sides] of [['reach-forward', [1, 3, 5], ['right']], ['reach-up', [1, 3.5, 5.5], ['right', 'left']]]) {
    for (const time of times) for (const side of sides) {
      assert(hasRole(at(id, time), side + '-elbow', 'flexion', 1));
      const resolved = resultAt(id, time);
      assertContributor(resolved, 'Brachialis muscle', side);
      assertContributor(resolved, 'Infraspinatus muscle', side);
      assertContributor(resolved, 'Subscapularis muscle', side);
      assertContributor(resolved, 'Teres minor muscle', side);
    }
    assert.equal(resultAt(id, fixtures[id].duration - .1).rows.length, 0, 'Support must not leak into reset');
  }
  assert.deepEqual(row(resultAt('reach-forward', 5), 'Clavicular part of deltoid muscle').types, ['eccentric']);
  for (const side of ['right', 'left']) assert.deepEqual(row(resultAt('reach-up', 5.5), 'Acromial part of deltoid muscle', side).types, ['eccentric']);
});

test('the standalone fist uses the visually checked closure with a neutral wrist', () => {
  const closure = fixtures.fist.keyframes[1].pose;
  assert.deepEqual(closure, boxingHandPose('right'));
  assert.equal(closure['right-wrist'].flexion, 0);
  assert.equal(closure['right-index-mcp'].flexion, 80);
  assert.equal(closure['right-index-pip'].flexion, 90);
  assert.equal(closure['right-thumb-ip'].flexion, 60);
  assert.equal(closure['right-thumb-cmc'].opposition, 0, 'The checked thumb lies outside the folded fingers');
});

test('finger flexors retain a holding role while wrist muscles support a grip', () => {
  for (const [id, time] of [['fist', 3], ['grasp', 4.75]]) {
    const result = resultAt(id, time);
    for (const part of parts.filter(part => part.side === 'right' && /flexor digitorum (profundus|superficialis)/i.test(part.name) && part.kind === 'muscle')) {
      const entry = assertContributor(result, part.name);
      assert(entry.types.includes('isometric'), id + ' lost flexor holding evidence');
    }
    assertContributor(result, 'Flexor pollicis longus');
    const wrist = assertContributor(result, 'Extensor carpi radialis brevis');
    assert.match(wrist.role, /stabili/i);
    assert(result.rows.some(entry => entry.kind === 'mixed' && /lumbrical|interosse/i.test(entry.name)), 'Intrinsic MCP/IP mixed actions must remain qualified');
  }
});

test('thumb MCP and IP movement is represented when closing, holding and opening', () => {
  for (const [id, close, hold, open] of [['fist', 1, 3, 5], ['grasp', 3, 4.75, 6]]) {
    for (const time of [close, hold]) {
      assert(hasRole(at(id, time), 'right-thumb-ip', 'flexion', 1));
      assertContributor(resultAt(id, time), 'Flexor pollicis longus');
    }
    assert(hasRole(at(id, open), 'right-thumb-ip', 'flexion', -1));
    // CMC actions may produce a qualified mixed role; the IP extension cue
    // must still include the actual extensor pollicis longus surface.
    assert(row(resultAt(id, open), 'Extensor pollicis longus'));
  }
});

test('the grasp keeps shoulder, elbow and scapular support across hand-only changes', () => {
  for (const time of [3, 4.75, 6.25]) {
    const entry = at('grasp', time);
    for (const [joint, axis] of [['right-shoulder', 'flexion'], ['right-elbow', 'flexion'], ['right-scapula', 'protraction']]) {
      assert(entry.roles.some(role => role.joint === joint && role.axis === axis && role.stabilizer), 'Missing proximal support at ' + time);
    }
    const result = resultAt('grasp', time);
    for (const name of ['Brachialis muscle', 'Brachioradialis muscle', 'Serratus anterior muscle', 'Infraspinatus muscle']) assertContributor(result, name);
  }
  assert(hasRole(at('grasp', 8), 'right-scapula', 'protraction', -1));
  assertContributor(resultAt('grasp', 8), 'Rhomboid major muscle');
});

test('dance maps both arms and retains stance support through free-leg lowering', () => {
  for (const [time, stance, swing] of [[1, 'right', 'left'], [2.8, 'right', 'left'], [5, 'left', 'right'], [6.8, 'left', 'right']]) {
    const entry = at('dance', time), result = resultAt('dance', time);
    assert.deepEqual(entry.contacts, {[stance]: 'flat', [swing]: 'air'});
    for (const side of ['right', 'left']) {
      assert(hasRole(entry, side + '-shoulder', 'scaption', 1));
      assertContributor(result, 'Acromial part of deltoid muscle', side);
    }
    for (const name of ['Gluteus medius muscle', 'Gluteus minimus muscle', 'Soleus muscle']) assertContributor(result, name, stance);
    assert(entry.roles.some(role => role.joint === swing + '-hip' && role.axis === 'flexion'));
    assert(entry.roles.some(role => role.joint === swing + '-knee' && role.axis === 'flexion'));
  }
  for (const time of [.2, 4, 7.8]) assert.deepEqual(at('dance', time).contacts, {left: 'flat', right: 'flat'});
  assert.equal(fixtures.dance.keyframes.find(frame => frame.time === 2).pose['left-ankle'].dorsiflexion, 8);
  assert.equal(fixtures.dance.keyframes.find(frame => frame.time === 6).pose['right-ankle'].dorsiflexion, 8);
  for (const [time, side] of [[1, 'left'], [2.8, 'left'], [5, 'right'], [6.8, 'right']]) assertContributor(resultAt('dance', time), 'Tibialis anterior muscle', side);
  for (const [time, side] of [[2.8, 'left'], [6.8, 'right']]) {
    const rectus = row(resultAt('dance', time), 'Rectus femoris muscle', side);
    assert(rectus);
    assert(!rectus.types.includes('eccentric') && !rectus.types.includes('concentric'), 'Combined hip/knee movement does not establish net rectus femoris length');
  }
});

test('head holds preserve upper-trunk support and the correct SCM/splenius sides', () => {
  for (const [time, direction, turnSide, oppositeSide] of [[2.5, 1, 'right', 'left'], [6.5, -1, 'left', 'right']]) {
    const entry = at('head-turn', time), result = resultAt('head-turn', time);
    assert(entry.roles.some(role => role.joint === 'thoracic-turn' && role.direction === direction && role.stabilizer));
    assertContributor(result, 'Sternocleidomastoid muscle', oppositeSide);
    assertContributor(result, 'Splenius capitis muscle', turnSide);
    assert(!row(result, 'Sternocleidomastoid muscle', turnSide), 'Do not reverse SCM laterality');
    assert(result.rows.some(row => /abdominal oblique/.test(row.name)), 'Trunk role disappeared during the hold');
    assert(!result.rows.some(row => /semispinalis capitis region/i.test(row.name)), 'Do not certify the unresolved source region');
  }
});
