import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {activities, sampleActivity} from '../src/motion-activities.js';
import {poseRoles} from '../src/motion-pose-core.js';
import {resolveActivityRoles} from '../src/motion-activity-roles.js';
import {preparePoseRig, poseJointWorld} from '../src/motion-pose-rig.js';
import {applyActivityPose} from '../src/motion-activity-placement.js';

const metadata = JSON.parse(readFileSync(new URL('../assets/motion-pose-body.json', import.meta.url), 'utf8'));
const parts = JSON.parse(readFileSync(new URL('../src/muscle-models.json', import.meta.url), 'utf8')).components;
const joints = new Map(metadata.joints.map(joint => [joint.id, joint]));
const byId = id => activities.find(activity => activity.id === id);
const eachCoordinate = (sample, visit) => {
  for (const [joint, axes] of Object.entries(sample.pose)) {
    for (const [axis, value] of Object.entries(axes)) visit(joint + ':' + axis, value);
  }
  sample.root.forEach((value, index) => visit('root:' + index, value));
  sample.rootRotation.forEach((value, index) => visit('rootRotation:' + index, value));
};
const flattened = sample => {
  const result = {};
  eachCoordinate(sample, (id, value) => { result[id] = value; });
  return result;
};

function jointRig() {
  const model = new THREE.Group();
  const nodes = new Map(metadata.nodes.map(entry => [entry.id, new THREE.Object3D()]));
  for (const descriptor of metadata.nodes) {
    const node = nodes.get(descriptor.id);
    node.name = descriptor.name;
    node.position.fromArray(descriptor.pivot);
    if (descriptor.parent) {
      const parent = metadata.nodes.find(entry => entry.id === descriptor.parent);
      node.position.sub(new THREE.Vector3(...parent.pivot));
      nodes.get(descriptor.parent).add(node);
    } else model.add(node);
  }
  return preparePoseRig(model, {...metadata, totalMuscleSurfaces: 0});
}

test('the movement library includes all requested movement families with transparent evidence', () => {
  assert(activities.length >= 12);
  assert.equal(new Set(activities.map(activity => activity.id)).size, activities.length);
  for (const id of ['dance', 'shadowbox', 'running', 'jumping', 'squat', 'hip-hinge', 'reach-forward', 'fist', 'grasp']) assert(byId(id), id);
  for (const activity of activities) {
    assert(activity.label && activity.description && activity.category);
    assert(activity.duration > 0 && activity.duration <= 30);
    assert(['front', 'side', 'lesson'].includes(activity.view));
    assert(['both', 'alternate', 'none'].includes(activity.ground));
    assert.match(activity.evidence, /not measured activation/);
    assert(activity.sources.length > 0);
    for (const source of activity.sources) {
      assert(source.title);
      assert.match(source.url, /^https:\/\/(openstax\.org|pmc\.ncbi\.nlm\.nih\.gov)\//);
    }
  }
  assert.match(byId('shadowbox').description, /non-contact/);
  assert.match(byId('grasp').description, /without a virtual object/);
  assert.match(byId('reach-up').description, /below a full overhead/);
});

test('all keyframes and dense interpolated poses respect the installed rig axes and anatomical limits', () => {
  for (const activity of activities) {
    for (let step = 0; step <= 240; step++) {
      const sample = sampleActivity(activity, activity.duration * step / 240);
      for (const [jointId, axes] of Object.entries(sample.pose)) {
        const joint = joints.get(jointId);
        assert(joint, activity.id + ' references ' + jointId);
        for (const [axisId, value] of Object.entries(axes)) {
          const axis = joint.axes.find(axis => axis.id === axisId);
          assert(axis, jointId + ':' + axisId);
          assert(Number.isFinite(value));
          assert(value >= axis.min - 1e-9 && value <= axis.max + 1e-9, `${activity.id} ${jointId}:${axisId} = ${value}`);
        }
      }
      eachCoordinate(sample, (_, value) => assert(Number.isFinite(value)));
      assert(sample.root.every(value => Math.abs(value) <= .25));
      assert(sample.rootRotation.every(value => Math.abs(value) <= 45));
      assert(sample.phase);
    }
  }
});

test('every cycle starts and ends at the same complete pose and transform', () => {
  for (const activity of activities) {
    assert.equal(activity.keyframes[0].time, 0);
    assert.equal(activity.keyframes.at(-1).time, activity.duration);
    for (let index = 1; index < activity.keyframes.length; index++) assert(activity.keyframes[index].time > activity.keyframes[index - 1].time);
    const first = sampleActivity(activity, 0), last = sampleActivity(activity, activity.duration);
    assert.deepEqual(first.pose, last.pose, activity.id);
    assert.deepEqual(first.root, last.root, activity.id);
    assert.deepEqual(first.rootRotation, last.rootRotation, activity.id);
    assert.equal(first.done, false);
    assert.equal(last.done, true);
    const initialKeys = Object.keys(flattened(first)).sort();
    for (const keyframe of activity.keyframes) {
      const sample = sampleActivity(activity, keyframe.time);
      assert.deepEqual(Object.keys(flattened(sample)).sort(), initialKeys);
      assert.deepEqual(sample.pose, keyframe.pose);
      assert.deepEqual(sample.root, keyframe.root);
      assert.deepEqual(sample.rootRotation, keyframe.rootRotation);
    }
  }
});

test('bounded interpolation has continuous velocity through frames and the loop seam', () => {
  const epsilon = 1e-5;
  for (const activity of activities) {
    for (const keyframe of activity.keyframes.slice(0, -1)) {
      const time = keyframe.time;
      const beforeTime = time === 0 ? activity.duration - epsilon : time - epsilon;
      const before = flattened(sampleActivity(activity, beforeTime));
      const center = flattened(sampleActivity(activity, time));
      const after = flattened(sampleActivity(activity, time + epsilon));
      for (const coordinate of Object.keys(center)) {
        const leftVelocity = (center[coordinate] - before[coordinate]) / epsilon;
        const rightVelocity = (after[coordinate] - center[coordinate]) / epsilon;
        assert(Math.abs(leftVelocity - rightVelocity) < .1, `${activity.id} ${time} ${coordinate}: ${leftVelocity} versus ${rightVelocity}`);
      }
    }
    for (let index = 0; index < activity.keyframes.length - 1; index++) {
      const a = activity.keyframes[index], b = activity.keyframes[index + 1];
      const low = flattened(sampleActivity(activity, a.time)), high = flattened(sampleActivity(activity, b.time));
      for (let step = 1; step < 16; step++) {
        const middle = flattened(sampleActivity(activity, a.time + (b.time - a.time) * step / 16));
        for (const [key, value] of Object.entries(middle)) assert(value >= Math.min(low[key], high[key]) - 1e-9 && value <= Math.max(low[key], high[key]) + 1e-9, `${activity.id} overshoot at ${key}`);
      }
    }
  }
});

test('phases cover the timeline without holes and every role resolves to muscle surfaces', () => {
  for (const activity of activities) {
    let end = 0;
    for (const phase of activity.phases) {
      assert.equal(phase.start, end, activity.id);
      assert(phase.end > phase.start && phase.end <= activity.duration);
      assert(phase.label && phase.explanation);
      end = phase.end;
      const sample = sampleActivity(activity, (phase.start + phase.end) / 2);
      assert.equal(sample.phase, phase);
      for (const role of phase.roles) {
        assert([-1, 1].includes(role.direction));
        assert(['concentric', 'eccentric', 'isometric', 'contributor'].includes(role.contraction));
        const joint = joints.get(role.joint);
        assert(joint?.axes.some(axis => axis.id === role.axis), activity.id + ' role ' + role.joint + ':' + role.axis);
        const resolved = poseRoles(joint, role.axis, role.direction, parts, sample.pose);
        assert(resolved.contributors.length > 0, `${activity.id}: ${phase.label}: no muscle surfaces for ${role.joint}:${role.axis}`);
      }
      for (const entry of phase.namedRoles || []) {
        assert(['prime', 'support', 'opponent'].includes(entry.role), activity.id + ' named role kind');
        assert(['concentric', 'eccentric', 'isometric', 'contributor'].includes(entry.contraction));
        for (const name of entry.names || []) {
          const matches = parts.filter(part => part.kind === 'muscle' && part.name.toLowerCase() === name.toLowerCase() && (!entry.side || part.side === entry.side));
          assert(matches.length > 0, `${activity.id}: ${phase.label}: unresolved named muscle ${name} (${entry.side || 'both'})`);
        }
        assert((entry.names?.length || 0) + (entry.keys?.length || 0) > 0, 'Empty named selection');
      }
    }
    assert.equal(end, activity.duration);
    for (const phase of activity.phases.slice(1)) assert.equal(sampleActivity(activity, phase.start).phase, phase);
    assert.equal(sampleActivity(activity, activity.duration).phase, activity.phases[activity.endpointPhaseIndex ?? activity.phases.length - 1]);
  }
});

test('controlled lowering retains the load-resisting muscles instead of inferring flexors from joint direction', () => {
  const squat = byId('squat');
  const down = sampleActivity(squat, 1).phase;
  const hold = sampleActivity(squat, 3.5).phase;
  const up = sampleActivity(squat, 5).phase;
  const namedRole = (phase, name) => phase.namedRoles.find(entry => entry.names.includes(name));
  for (const name of ['Gluteus maximus muscle', 'Vastus lateralis muscle']) {
    assert.equal(namedRole(down, name).contraction, 'eccentric');
    assert.equal(namedRole(hold, name).contraction, 'isometric');
    assert.equal(namedRole(up, name).contraction, 'concentric');
  }
  assert.equal(namedRole(down, 'Clavicular part of deltoid muscle').contraction, 'concentric');
  assert.equal(namedRole(up, 'Clavicular part of deltoid muscle').contraction, 'eccentric');
  assert(sampleActivity(squat, 2).pose['right-knee'].flexion > sampleActivity(squat, 1).pose['right-knee'].flexion);
  assert(sampleActivity(squat, 6).pose['right-knee'].flexion < sampleActivity(squat, 5).pose['right-knee'].flexion);
  const heel = byId('heel-raise');
  assert.equal(namedRole(sampleActivity(heel, 5).phase, 'Soleus muscle').contraction, 'eccentric');
  const raise = byId('reach-up');
  assert(sampleActivity(raise, 5).phase.roles.every(role => role.direction === 1 && role.contraction === 'eccentric'));
});

test('jump flight distinguishes limb positioning from ground support and landing from push-off', () => {
  const jump = byId('jumping');
  const flight = sampleActivity(jump, 2.7);
  assert(flight.root[1] > .15);
  assert.deepEqual(flight.contacts, {left: 'air', right: 'air'});
  assert(!flight.phase.namedRoles.some(entry => entry.names.includes('Soleus muscle')));
  assert.match(flight.phase.explanation, /No ground reaction/);
  const landing = sampleActivity(jump, 3.5);
  assert.equal(landing.root[1], 0);
  const vastus = phase => phase.namedRoles.find(entry => entry.names.includes('Vastus lateralis muscle'));
  assert.equal(vastus(landing.phase).contraction, 'eccentric');
  assert.equal(vastus(sampleActivity(jump, 1.8).phase).contraction, 'concentric');
  const tuck = sampleActivity(jump, 2.4).phase;
  const prepare = sampleActivity(jump, 2.9).phase;
  assert(tuck.namedRoles.some(entry => entry.names.includes('Short head of biceps femoris')));
  assert(vastus(prepare));
});

test('neck labels and dance shifts agree with the rig’s anatomical right and left', () => {
  const head = byId('head-turn');
  for (const [time, side, direction] of [[1, 'right', 1], [5, 'left', -1]]) {
    const sample = sampleActivity(head, time);
    assert.match(sample.phase.label, new RegExp(side));
    assert.equal(Math.sign(sample.pose.neck.rotation), direction);
    const resolved = poseRoles(joints.get('neck'), 'rotation', direction, parts, sample.pose);
    assert.match(resolved.label, new RegExp(side));
  }
  assert(sampleActivity(byId('dance'), 2).root[0] < 0);
  assert(sampleActivity(byId('dance'), 6).root[0] > 0);
});

test('shadowboxing coordinates a guarded jab and cross through the legs and trunk',()=>{
  const boxing=byId('shadowbox'),guard=sampleActivity(boxing,0),jab=sampleActivity(boxing,1.25),cross=sampleActivity(boxing,3.45);
  assert(jab.pose['left-elbow'].flexion<20&&jab.pose['right-elbow'].flexion>=110);
  assert(cross.pose['right-elbow'].flexion<20&&cross.pose['left-elbow'].flexion>=110);
  assert(jab.pose['thoracic-turn'].rotation>0&&cross.pose['thoracic-turn'].rotation<0);
  assert(cross.rootRotation[1]-guard.rootRotation[1]>15);
  assert(guard.pose['right-knee'].flexion-cross.pose['right-knee'].flexion>=10);
  assert(guard.pose['right-ankle'].dorsiflexion-cross.pose['right-ankle'].dorsiflexion>=12);
  const rig=jointRig();
  for(let time=0;time<=boxing.duration;time+=.1){
    const sample=sampleActivity(boxing,time);
    applyActivityPose(rig,sample.pose,sample.root,{ground:boxing.ground,rootRotation:sample.rootRotation});
    const left=poseJointWorld(rig,'left-ankle'),right=poseJointWorld(rig,'right-ankle');
    assert(left.z-right.z>.12,'Lead foot must remain in front of the rear foot');
    assert(left.x-right.x>.2,'The stance must retain a lateral base');
    for(const side of ['left','right']){
      assert.equal(sample.pose[side+'-wrist'].flexion,0);
      assert.equal(sample.pose[side+'-wrist'].deviation,0);
      for(const digit of ['index','middle','ring','little']){
        assert(sample.pose[side+'-'+digit+'-mcp'].flexion>=60);
        assert(sample.pose[side+'-'+digit+'-pip'].flexion>=70);
      }
    }
  }
  assert(boxing.phases.some(phase=>phase.roles.some(role=>role.joint==='right-ankle'&&!role.stabilizer)));
  assert(boxing.phases.every(phase=>phase.roles.some(role=>role.joint==='left-index-pip'&&role.stabilizer)));
  assert(boxing.supportMuscles.some(group=>group.names.includes('Transversus abdominis muscle')));
  assert(boxing.supportMuscles.some(group=>group.names.includes('Infraspinatus muscle')));
});

test('the shadowboxing uppercut has a rising bent arm, a closed fist and a guarded return', () => {
  const activity = byId('shadowbox');
  const arc = activity.phases.find(phase => phase.label === 'Left uppercut');
  const recovery = activity.phases.find(phase => phase.label === 'Recover the uppercut');
  assert(arc.start > 3.45 && recovery.start === arc.end);
  const rig = jointRig();
  const landmarks = sample => {
    applyActivityPose(rig, sample.pose, sample.root, {ground: activity.ground, rootRotation: sample.rootRotation});
    return {
      leftFist: poseJointWorld(rig, 'left-index-mcp'),
      rightFist: poseJointWorld(rig, 'right-index-mcp'),
      jaw: poseJointWorld(rig, 'jaw'),
    };
  };
  const low = sampleActivity(activity, arc.start);
  const rising = Array.from({length: 9}, (_, i) => sampleActivity(activity, arc.start + (arc.end - arc.start) * i / 9));
  let lastHeight = -Infinity;
  for (const sample of rising) {
    const {leftFist, rightFist, jaw} = landmarks(sample);
    const height = leftFist.y - jaw.y;
    assert(height > lastHeight, 'The fist rises relative to the torso through the arc');
    lastHeight = height;
    assert(sample.pose['left-elbow'].flexion > 65, 'The working elbow stays visibly bent');
    assert(sample.pose['right-elbow'].flexion >= 110, 'The other arm maintains guard');
    assert(rightFist.distanceTo(jaw) < .2, 'The other fist stays near the face');
    assert.equal(sample.pose['left-index-mcp'].flexion, 80);
    assert.equal(sample.pose['left-wrist'].flexion, 0);
  }
  const peak = rising.at(-1);
  assert(landmarks(peak).leftFist.y - landmarks(low).leftFist.y > .3);
  assert.deepEqual(sampleActivity(activity, recovery.end).pose, sampleActivity(activity, 0).pose);

  const result = resolveActivityRoles(activity, arc, metadata.joints, parts, peak.pose);
  const working = (name, side) => result.rows.some(row => row.name === name && row.side === side && row.kind !== 'opponent');
  assert(working('Clavicular part of deltoid muscle', 'left'));
  assert(working('Brachialis muscle', 'left'));
  assert(working('Vastus lateralis muscle', 'left'));
  assert(!working('Lateral head of triceps brachii', 'left'));
});

test('the arms hang downward in world space throughout a hip hinge instead of sweeping behind the back', () => {
  const rig = jointRig(), hinge = byId('hip-hinge');
  applyActivityPose(rig, {}, [], {ground: 'both'});
  const direction = side => {
    const hand = poseJointWorld(rig, side + '-wrist');
    const shoulder = poseJointWorld(rig, side + '-shoulder');
    return hand.sub(shoulder).normalize();
  };
  const rest = {right: direction('right'), left: direction('left')};
  for (const time of [1, 2, 3, 3.5, 5, 6]) {
    const sample = sampleActivity(hinge, time);
    applyActivityPose(rig, sample.pose, sample.root, {ground: hinge.ground, rootRotation: sample.rootRotation});
    for (const side of ['right', 'left']) {
      const arm = direction(side);
      assert(arm.y < -.9, `${side} arm points away from the floor at ${time}s`);
      assert(Math.abs(arm.z - rest[side].z) < .025, `${side} arm sweeps behind its neutral direction at ${time}s`);
    }
  }
});

test('sampling handles invalid time, seeking and caller edits without changing the catalog', () => {
  const movement = byId('fist');
  assert.deepEqual(sampleActivity(movement, -100), sampleActivity(movement, 0));
  for (const invalid of [NaN, Infinity, -Infinity, undefined, '2']) assert.deepEqual(sampleActivity(movement, invalid), sampleActivity(movement, 0));
  assert.deepEqual(sampleActivity(movement, 100), sampleActivity(movement, movement.duration));
  const mid = sampleActivity(movement, 2);
  const originalFinger = mid.pose['right-index-mcp'].flexion;
  sampleActivity(movement, 6);
  assert.deepEqual(sampleActivity(movement, 2), mid);
  mid.pose['right-index-mcp'].flexion = 999;
  mid.root[1] = 999;
  assert.equal(sampleActivity(movement, 2).pose['right-index-mcp'].flexion, originalFinger);
  assert.equal(sampleActivity(movement, 2).root[1], 0);
  assert(Object.isFrozen(movement.keyframes[0].pose));
  assert.throws(() => sampleActivity(null, 0), TypeError);
});
