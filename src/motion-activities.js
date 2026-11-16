import {boxingActivity} from './motion-boxing.js';
// Authored, slowed teaching sequences. These are not captured performances or
// measured EMG. A role describes a plausible muscle action under the stated load;
// angle velocity alone never determines whether a muscle is active.
export const activitySources = Object.freeze({
  contraction: {title: 'OpenStax 10.4 — Muscle tension and contraction types', url: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/10-4-nervous-system-control-of-muscle-tension'},
  upper: {title: 'OpenStax 11.5 — Shoulder, arm, forearm and hand muscles', url: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/11-5-muscles-of-the-pectoral-girdle-and-upper-limbs'},
  lower: {title: 'OpenStax 11.6 — Hip, leg and foot muscles', url: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/11-6-appendicular-muscles-of-the-pelvic-girdle-and-lower-limbs'},
  axial: {title: 'OpenStax 11.3 — Head, neck and back muscles', url: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/11-3-axial-muscles-of-the-head-neck-and-back'},
  trunk: {title: 'OpenStax 11.4 — Abdominal wall and thorax', url: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/11-4-axial-muscles-of-the-abdominal-wall-and-thorax'},
  running: {title: 'Hamner et al. — Muscle contributions to propulsion and support during running', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC2973845/'},
  squat: {title: 'DeForest et al. — Muscle activity in single- vs. double-leg squats', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4831851/'},
  jump: {title: 'Kotsifaki et al. — Single leg vertical jump performance and knee function', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9016240/'},
});

const source = (...names) => names.map(name => activitySources[name]);
const both = (joint, axes) => ({['right-' + joint]: {...axes}, ['left-' + joint]: {...axes}});
const role = (joint, axis, direction, contraction = 'contributor') => ({joint, axis, direction, contraction});
const bilateral = (joint, axis, direction, contraction) => ['right', 'left'].map(side => role(side + '-' + joint, axis, direction, contraction));
const phase = (start, end, label, explanation, roles) => ({start, end, label, explanation, roles});
const frame = (time, pose = {}, root = [0, 0, 0], rootRotation = [0, 0, 0]) => ({time, pose, root, rootRotation});
const clone = value => JSON.parse(JSON.stringify(value));

function freeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

function activity(definition) {
  // Each frame is an absolute pose. Omitted axes are neutral, never inherited
  // from a preceding activity or a frame that the user may have skipped.
  const neutral = {};
  for (const keyframe of definition.keyframes) {
    for (const [joint, axes] of Object.entries(keyframe.pose)) {
      neutral[joint] ||= {};
      for (const axis of Object.keys(axes)) neutral[joint][axis] = 0;
    }
  }
  const keyframes = definition.keyframes.map(keyframe => {
    const pose = clone(neutral);
    for (const [joint, axes] of Object.entries(keyframe.pose)) {
      for (const [axis, value] of Object.entries(axes)) pose[joint][axis] = value === 0 ? 0 : value;
    }
    return {...keyframe, pose};
  });
  return freeze({view: 'front', scope: 'all', ground: 'both', evidence: 'Authored teaching sequence; highlights are illustrative roles, not measured activation.', ...definition, keyframes});
}

const squatPose = {
  ...both('hip', {flexion: 58}), ...both('knee', {flexion: 60}),
  ...both('ankle', {dorsiflexion: 22}), ...both('shoulder', {flexion: 48}),
  ...both('elbow', {flexion: 12}), neck: {flexion: -8},
};
const supportRoles = contraction => [
  ...bilateral('hip', 'flexion', -1, contraction),
  ...bilateral('knee', 'flexion', -1, contraction),
  ...bilateral('ankle', 'dorsiflexion', -1, contraction),
];

function handPose(side, amount, opposition = 58) {
  const pose = {
    [side + '-thumb-cmc']: {opposition: opposition * amount, flexion: 9 * amount, abduction: 12 * amount},
    [side + '-thumb-mcp']: {flexion: 22 * amount},
    [side + '-thumb-ip']: {flexion: 22 * amount},
    [side + '-wrist']: {flexion: -8 * amount},
  };
  for (const digit of ['index', 'middle', 'ring', 'little']) {
    pose[side + '-' + digit + '-mcp'] = {flexion: 43 * amount};
    pose[side + '-' + digit + '-pip'] = {flexion: 55 * amount};
    pose[side + '-' + digit + '-dip'] = {flexion: 30 * amount};
  }
  return pose;
}
const fingerRoles = (direction, contraction) => [
  ...['index', 'middle', 'ring', 'little'].flatMap(digit => [
    role('right-' + digit + '-mcp', 'flexion', direction, contraction),
    role('right-' + digit + '-pip', 'flexion', direction, contraction),
    role('right-' + digit + '-dip', 'flexion', direction, contraction),
  ]),
];

function stridePose(right, left, armSwing, elbow = 28) {
  const pose = {};
  for (const [side, leg] of [['right', right], ['left', left]]) {
    pose[side + '-hip'] = {flexion: leg[0]};
    pose[side + '-knee'] = {flexion: leg[1]};
    pose[side + '-ankle'] = {dorsiflexion: leg[2]};
    pose[side + '-elbow'] = {flexion: elbow};
  }
  pose['right-shoulder'] = {flexion: -armSwing};
  pose['left-shoulder'] = {flexion: armSwing};
  pose['thoracic-turn'] = {rotation: armSwing / 5};
  return pose;
}
const walkA = stridePose([24, 5, 4], [-12, 18, -15], 16);
const walkB = stridePose([3, 14, 9], [10, 50, 3], 0);
const walkC = stridePose([-12, 18, -15], [24, 5, 4], -16);
const walkD = stridePose([10, 50, 3], [3, 14, 9], 0);
const runA = stridePose([30, 15, 3], [-12, 45, -20], 20, 80);
const runB = stridePose([0, 32, 12], [20, 75, -5], 2, 80);
const runC = stridePose([-16, 25, -24], [40, 35, 5], -20, 80);
const runD = stridePose([-14, 45, -4], [34, 16, 3], -15, 80);
const swapSides = pose => Object.fromEntries(Object.entries(pose).map(([id, axes]) => [
  id.startsWith('right-') ? id.replace('right-', 'left-') : id.startsWith('left-') ? id.replace('left-', 'right-') : id,
  id === 'thoracic-turn' ? {rotation: -axes.rotation} : {...axes},
]));
const gaitRoles = (stance, swing, push = false) => [
  role(stance + '-knee', 'flexion', -1),
  role(stance + '-hip', 'flexion', -1),
  role(stance + '-hip', 'abduction', 1),
  role(stance + '-ankle', 'dorsiflexion', -1, push ? 'contributor' : 'eccentric'),
  role(swing + '-hip', 'flexion', 1),
  role(swing + '-ankle', 'dorsiflexion', 1),
];

export const activities = freeze([
  activity({
    id: 'squat', label: 'Squat down and stand', category: 'Everyday movements', duration: 8, view: 'side',
    description: 'Follow the same extensors through lowering, holding and rising. A partial squat keeps the demonstration inside this teaching rig’s range.',
    sources: source('lower', 'contraction', 'squat'),
    keyframes: [frame(0), frame(3, squatPose, [0, 0, 0], [20, 0, 0]), frame(4, squatPose, [0, 0, 0], [20, 0, 0]), frame(7), frame(8)],
    phases: [
      phase(0, 3, 'Lower with control', 'Hip and knee extensors resist the downward load while the joints flex; plantar flexors help control forward tibial motion.', supportRoles('eccentric')),
      phase(3, 4, 'Hold the squat', 'The highlighted groups maintain the position rather than becoming inactive because the body has stopped.', supportRoles('isometric')),
      phase(4, 7, 'Stand up', 'Hip and knee extensors help lift the body. The ankle muscles coordinate support as the tibia returns.', supportRoles('concentric')),
      phase(7, 8, 'Reset upright', 'The effort cue clears between repetitions. Postural muscle tone is not measured by this model.', []),
    ],
  }),
  activity({
    id: 'hip-hinge', label: 'Bend and straighten', category: 'Everyday movements', duration: 8, view: 'side',
    description: 'Compare bending at the hips with bending the lower back. The arms hang toward the floor as the torso tips forward with a small knee bend.',
    sources: source('lower', 'axial', 'contraction'),
    keyframes: [frame(0), frame(3, {...both('hip', {flexion: 38}), ...both('knee', {flexion: 8}), ...both('ankle', {dorsiflexion: 4}), ...both('shoulder', {flexion: 38}), trunk: {flexion: 4}}, [0, 0, 0], [34, 0, 0]), frame(4, {...both('hip', {flexion: 38}), ...both('knee', {flexion: 8}), ...both('ankle', {dorsiflexion: 4}), ...both('shoulder', {flexion: 38}), trunk: {flexion: 4}}, [0, 0, 0], [34, 0, 0]), frame(7), frame(8)],
    phases: [
      phase(0, 3, 'Hinge forward', 'Hip extensors control the forward descent; back extensors support the trunk. This is a light, unloaded teaching bend.', [...bilateral('hip', 'flexion', -1, 'eccentric'), role('trunk', 'flexion', -1, 'contributor')]),
      phase(3, 4, 'Hold the hinge', 'Gluteal and posterior thigh muscles can contribute to maintaining the hip angle, with spinal extensors supporting the torso.', [...bilateral('hip', 'flexion', -1, 'isometric'), role('trunk', 'flexion', -1, 'isometric')]),
      phase(4, 7, 'Return upright', 'Hip extensors straighten the hip. Back extensors assist the small return of the trunk.', [...bilateral('hip', 'flexion', -1, 'concentric'), role('trunk', 'flexion', -1, 'contributor')]),
      phase(7, 8, 'Reset upright', 'Pause before repeating the bend.', []),
    ],
  }),
  activity({
    id: 'walking', label: 'Walk in place', category: 'Locomotion', duration: 4, view: 'side', ground: 'alternate',
    description: 'A slowed alternating stride shows support, push-off and foot clearance. Body translation and heel-to-toe contact are simplified.',
    sources: source('lower', 'upper', 'contraction'),
    keyframes: [frame(0, walkA), frame(1, walkB), frame(2, walkC), frame(3, walkD), frame(4, walkA)],
    phases: [
      phase(0, 1, 'Right support · left swing', 'Right-side extensors and hip abductors contribute to support; the left leg advances and its dorsiflexors help clear the foot.', gaitRoles('right', 'left')),
      phase(1, 2, 'Right push-off', 'The right plantar flexors contribute as the heel rises; the left leg prepares to accept support.', gaitRoles('right', 'left', true)),
      phase(2, 3, 'Left support · right swing', 'Roles switch sides. Opposite arm swing accompanies the legs without being a measure of arm effort.', gaitRoles('left', 'right')),
      phase(3, 4, 'Left push-off', 'Left plantar flexors contribute to push-off as the next right-side step approaches.', gaitRoles('left', 'right', true)),
    ],
  }),
  activity({
    id: 'running', label: 'Run in place', category: 'Locomotion', duration: 3, view: 'side', ground: 'alternate',
    description: 'Watch greater knee recovery and a brief flight interval. This slowed sequence illustrates phase roles; it does not estimate force, speed or EMG.',
    sources: source('running', 'lower'),
    keyframes: [frame(0, runA), frame(.375, runB), frame(.75, runC, [0, .01, 0]), frame(1.125, runD, [0, .055, 0]), frame(1.5, swapSides(runA)), frame(1.875, swapSides(runB)), frame(2.25, swapSides(runC), [0, .01, 0]), frame(2.625, swapSides(runD), [0, .055, 0]), frame(3, runA)],
    phases: [
      phase(0, .375, 'Right loading', 'Early support emphasizes knee and hip extensors while the left leg recovers.', gaitRoles('right', 'left')),
      phase(.375, .75, 'Right push-off', 'Plantar flexors contribute to propulsion late in support. The left hip flexors advance the opposite thigh.', [role('right-ankle', 'dorsiflexion', -1), role('left-hip', 'flexion', 1), role('right-hip', 'abduction', 1)]),
      phase(.75, 1.5, 'Flight · prepare left landing', 'Hip flexors recover the right thigh. Left hamstrings can help brake the advancing limb before contact; flight itself provides no ground support.', [role('right-hip', 'flexion', 1), role('left-hip', 'flexion', -1), role('left-knee', 'flexion', 1, 'eccentric')]),
      phase(1.5, 1.875, 'Left loading', 'The opposite leg now accepts support. Real recruitment changes with speed and individual technique.', gaitRoles('left', 'right')),
      phase(1.875, 2.25, 'Left push-off', 'Left plantar flexors help propel the body while the right thigh advances.', [role('left-ankle', 'dorsiflexion', -1), role('right-hip', 'flexion', 1), role('left-hip', 'abduction', 1)]),
      phase(2.25, 3, 'Flight · prepare right landing', 'Left hip flexors recover the thigh; right hamstrings can contribute to late-swing braking.', [role('left-hip', 'flexion', 1), role('right-hip', 'flexion', -1), role('right-knee', 'flexion', 1, 'eccentric')]),
    ],
  }),
  activity({
    id: 'jumping', label: 'Jump and land', category: 'Locomotion', duration: 6, view: 'side', ground: 'both',
    description: 'A small two-foot jump links a controlled countermovement, push-off, flight and landing. Height and timing are slowed teaching choices.',
    sources: source('lower', 'contraction', 'jump'),
    keyframes: [frame(0), frame(1.5, {...both('hip', {flexion: 42}), ...both('knee', {flexion: 46}), ...both('ankle', {dorsiflexion: 18}), ...both('shoulder', {flexion: -16})}, [0, 0, 0], [14, 0, 0]), frame(2.2, {...both('ankle', {dorsiflexion: -23}), ...both('shoulder', {flexion: 68}), ...both('elbow', {flexion: 12})}, [0, .04, 0]), frame(2.7, {...both('hip', {flexion: 8}), ...both('knee', {flexion: 16}), ...both('ankle', {dorsiflexion: -10}), ...both('shoulder', {flexion: 76})}, [0, .18, 0]), frame(3.2, {...both('hip', {flexion: 8}), ...both('knee', {flexion: 12}), ...both('ankle', {dorsiflexion: -6}), ...both('shoulder', {flexion: 45})}), frame(3.8, {...both('hip', {flexion: 40}), ...both('knee', {flexion: 44}), ...both('ankle', {dorsiflexion: 17}), ...both('shoulder', {flexion: 30})}, [0, 0, 0], [13, 0, 0]), frame(5.3), frame(6)],
    phases: [
      phase(0, 1.5, 'Load the jump', 'The extensor groups resist the downward motion before push-off.', supportRoles('eccentric')),
      phase(1.5, 2.2, 'Push off', 'Hip and knee extension combine with ankle plantar flexion to leave the ground.', supportRoles('concentric')),
      phase(2.2, 2.7, 'Flight · gather the legs', 'No ground reaction is available in flight. Hip and knee flexion reposition the limbs; these highlights are contributors, not a support-force estimate.', [...bilateral('hip', 'flexion', 1, 'contributor'), ...bilateral('knee', 'flexion', 1, 'contributor')]),
      phase(2.7, 3.2, 'Flight · prepare to land', 'No ground reaction is available before contact. Knee extensors can contribute as the legs lengthen slightly in preparation for landing.', bilateral('knee', 'flexion', -1, 'contributor')),
      phase(3.2, 3.8, 'Absorb the landing', 'The joints bend again while extensors help control the landing. Flexing joints do not imply that flexors alone are doing the work.', supportRoles('eccentric')),
      phase(3.8, 5.3, 'Stand after landing', 'Extensors help restore the upright posture.', supportRoles('concentric')),
      phase(5.3, 6, 'Reset upright', 'Pause between the authored repetitions.', []),
    ],
  }),
  activity({
    id: 'reach-forward', label: 'Reach forward', category: 'Everyday movements', duration: 7, view: 'side', scope: 'right-arm', focusJoint: 'right-shoulder', focusRadius: .47,
    description: 'See shoulder flexion and scapular protraction work together as the hand reaches in front of the body.',
    sources: source('upper', 'contraction'),
    keyframes: [frame(0), frame(2.5, {'right-shoulder': {flexion: 65}, 'right-scapula': {protraction: 7}, 'right-elbow': {flexion: 12}}), frame(3.5, {'right-shoulder': {flexion: 65}, 'right-scapula': {protraction: 7}, 'right-elbow': {flexion: 12}}), frame(6.5), frame(7)],
    phases: [
      phase(0, 2.5, 'Lift and reach', 'Anterior shoulder muscles lift the arm, while serratus anterior contributes to reaching the shoulder blade forward.', [role('right-shoulder', 'flexion', 1, 'concentric'), role('right-scapula', 'protraction', 1, 'concentric')]),
      phase(2.5, 3.5, 'Hold the reach', 'Holding the arm against gravity still requires muscle tension.', [role('right-shoulder', 'flexion', 1, 'isometric'), role('right-scapula', 'protraction', 1, 'isometric')]),
      phase(3.5, 6.5, 'Lower with control', 'Shoulder flexors can lengthen under tension as the arm lowers; retractors guide the shoulder blade back.', [role('right-shoulder', 'flexion', 1, 'eccentric'), role('right-scapula', 'protraction', -1, 'contributor')]),
      phase(6.5, 7, 'Reset', 'The hand returns beside the body.', []),
    ],
  }),
  activity({
    id: 'reach-up', label: 'Raise the arms', category: 'Everyday movements', duration: 8, view: 'front',
    description: 'Raise both arms in the scapular plane and lower them slowly. This rig stops below a full overhead reach.',
    sources: source('upper', 'contraction'),
    keyframes: [frame(0), frame(3, {...both('shoulder', {scaption: 60}), ...both('elbow', {flexion: 12})}), frame(4, {...both('shoulder', {scaption: 60}), ...both('elbow', {flexion: 12})}), frame(7), frame(8)],
    phases: [
      phase(0, 3, 'Raise in the scapular plane', 'Deltoid and supraspinatus contribute to arm elevation; serratus anterior and trapezius help rotate the scapula.', bilateral('shoulder', 'scaption', 1, 'concentric')),
      phase(3, 4, 'Hold the arms', 'The same elevating system supports the arms against gravity.', bilateral('shoulder', 'scaption', 1, 'isometric')),
      phase(4, 7, 'Control the lowering', 'The arm elevators remain relevant while lengthening during a controlled descent.', bilateral('shoulder', 'scaption', 1, 'eccentric')),
      phase(7, 8, 'Reset', 'Pause before repeating.', []),
    ],
  }),
  activity({
    id: 'fist', label: 'Clench and open a fist', category: 'Hands', duration: 7, scope: 'right-arm', view: 'lesson', focusJoint: 'right-index-mcp', focusRadius: .15,
    description: 'Follow the finger flexors from forearm to hand. The thumb folds across a partial fist; no contact force is simulated.',
    sources: source('upper', 'contraction'),
    keyframes: [frame(0), frame(2.5, handPose('right', 1)), frame(3.5, handPose('right', 1)), frame(6.5), frame(7)],
    phases: [
      phase(0, 2.5, 'Close the fingers', 'Long finger flexors curl the joints while thumb opposition brings the thumb across the palm.', [...fingerRoles(1, 'concentric'), role('right-thumb-cmc', 'opposition', 1, 'contributor')]),
      phase(2.5, 3.5, 'Hold a gentle fist', 'Flexors can sustain tension at a fixed pose. Wrist extensors can stabilize the wrist during a grip.', [...fingerRoles(1, 'isometric'), role('right-wrist', 'flexion', -1, 'isometric'), role('right-thumb-cmc', 'opposition', 1, 'isometric')]),
      phase(3.5, 6.5, 'Open the hand', 'Finger extensors straighten the digits. Thumb repositioning is a coordinated action, not a measured activation pattern.', [...fingerRoles(-1, 'concentric'), role('right-thumb-cmc', 'opposition', -1, 'contributor')]),
      phase(6.5, 7, 'Relax open', 'The next repetition starts with the hand open.', []),
    ],
  }),
  activity({
    id: 'grasp', label: 'Reach, grasp and release', category: 'Hands', duration: 10, view: 'side', scope: 'right-arm', focusJoint: 'right-elbow', focusRadius: .42,
    description: 'Coordinate a reach with a rounded grasp shape, then release. The empty hand illustrates joint coordination, without a virtual object or collision-based grip.',
    sources: source('upper', 'contraction'),
    keyframes: [frame(0), frame(2, {'right-shoulder': {flexion: 50}, 'right-elbow': {flexion: 35}, 'right-scapula': {protraction: 4}}), frame(4, {...handPose('right', .72, 66), 'right-shoulder': {flexion: 50}, 'right-elbow': {flexion: 35}, 'right-scapula': {protraction: 4}}), frame(5.5, {...handPose('right', .72, 66), 'right-shoulder': {flexion: 50}, 'right-elbow': {flexion: 35}, 'right-scapula': {protraction: 4}}), frame(7, {'right-shoulder': {flexion: 50}, 'right-elbow': {flexion: 35}, 'right-scapula': {protraction: 4}}), frame(9.5), frame(10)],
    phases: [
      phase(0, 2, 'Reach toward the object', 'Shoulder and elbow flexors position the hand; the shoulder blade advances slightly.', [role('right-shoulder', 'flexion', 1, 'concentric'), role('right-elbow', 'flexion', 1, 'concentric'), role('right-scapula', 'protraction', 1, 'contributor')]),
      phase(2, 4, 'Shape the grasp', 'Finger flexion and thumb opposition shape the hand around an imagined handle.', [...fingerRoles(1, 'concentric'), role('right-thumb-cmc', 'opposition', 1, 'contributor')]),
      phase(4, 5.5, 'Hold', 'Finger flexors maintain the shape; wrist extensors help resist the flexing pull at the wrist.', [...fingerRoles(1, 'isometric'), role('right-wrist', 'flexion', -1, 'isometric'), role('right-shoulder', 'flexion', 1, 'isometric')]),
      phase(5.5, 7, 'Release', 'Extensors reopen the fingers as the grasp is released.', [...fingerRoles(-1, 'concentric'), role('right-thumb-cmc', 'opposition', -1, 'contributor')]),
      phase(7, 9.5, 'Return the hand', 'Shoulder and elbow flexors can control the arm’s descent under gravity.', [role('right-shoulder', 'flexion', 1, 'eccentric'), role('right-elbow', 'flexion', 1, 'eccentric')]),
      phase(9.5, 10, 'Reset', 'Pause before the next reach.', []),
    ],
  }),
  activity({
    id: 'dance', label: 'Dance side to side', category: 'Sport and expression', duration: 8, view: 'front', ground: 'alternate',
    description: 'A gentle dance sway pairs alternating leg lifts with arm elevation and trunk rotation. It demonstrates coordination rather than a specific dance technique.',
    sources: source('lower', 'upper', 'trunk'),
    keyframes: [frame(0, {...both('knee', {flexion: 8}), ...both('hip', {flexion: 6}), ...both('ankle', {dorsiflexion: 2}), ...both('elbow', {flexion: 38})}), frame(2, {'right-hip': {flexion: 6}, 'right-knee': {flexion: 8}, 'right-ankle': {dorsiflexion: 2}, 'left-hip': {abduction: 15, flexion: 12}, 'left-knee': {flexion: 22}, 'right-shoulder': {scaption: 48}, 'left-shoulder': {scaption: 24}, ...both('elbow', {flexion: 38}), 'thoracic-turn': {rotation: 8}}, [-.035, 0, 0]), frame(4, {...both('knee', {flexion: 8}), ...both('hip', {flexion: 6}), ...both('ankle', {dorsiflexion: 2}), ...both('elbow', {flexion: 38})}), frame(6, {'left-hip': {flexion: 6}, 'left-knee': {flexion: 8}, 'left-ankle': {dorsiflexion: 2}, 'right-hip': {abduction: 15, flexion: 12}, 'right-knee': {flexion: 22}, 'left-shoulder': {scaption: 48}, 'right-shoulder': {scaption: 24}, ...both('elbow', {flexion: 38}), 'thoracic-turn': {rotation: -8}}, [.035, 0, 0]), frame(8, {...both('knee', {flexion: 8}), ...both('hip', {flexion: 6}), ...both('ankle', {dorsiflexion: 2}), ...both('elbow', {flexion: 38})})],
    phases: [
      phase(0, 2, 'Lift left · sway right', 'Right hip abductors contribute to pelvic support as the left leg moves out. Arm elevators and trunk rotators coordinate the gesture.', [role('right-hip', 'abduction', 1, 'isometric'), role('left-hip', 'abduction', 1), role('right-shoulder', 'scaption', 1), role('thoracic-turn', 'rotation', 1)]),
      phase(2, 4, 'Return through center', 'Hip abductors can control the returning leg; arm elevators control lowering against gravity.', [role('left-hip', 'abduction', 1, 'eccentric'), role('right-shoulder', 'scaption', 1, 'eccentric'), role('thoracic-turn', 'rotation', -1)]),
      phase(4, 6, 'Lift right · sway left', 'The opposite support hip and raised arm now contribute to the sway.', [role('left-hip', 'abduction', 1, 'isometric'), role('right-hip', 'abduction', 1), role('left-shoulder', 'scaption', 1), role('thoracic-turn', 'rotation', -1)]),
      phase(6, 8, 'Return through center', 'The right leg and left arm return with controlled lowering.', [role('right-hip', 'abduction', 1, 'eccentric'), role('left-shoulder', 'scaption', 1, 'eccentric'), role('thoracic-turn', 'rotation', 1)]),
    ],
  }),
  activity(boxingActivity),
  activity({
    id: 'heel-raise', label: 'Rise onto the toes', category: 'Everyday movements', duration: 7, view: 'side',
    description: 'Watch the calf muscles lift the heels, hold the position and control the return. The feet stay aligned with the ground reference.',
    sources: source('lower', 'contraction'),
    keyframes: [frame(0), frame(2.5, {...both('ankle', {dorsiflexion: -20}), ...both('hallux', {extension: 20}), ...both('toe-2', {extension: 16}), ...both('toe-3', {extension: 16}), ...both('toe-4', {extension: 16}), ...both('toe-5', {extension: 16})}), frame(3.5, {...both('ankle', {dorsiflexion: -20}), ...both('hallux', {extension: 20}), ...both('toe-2', {extension: 16}), ...both('toe-3', {extension: 16}), ...both('toe-4', {extension: 16}), ...both('toe-5', {extension: 16})}), frame(6.5), frame(7)],
    phases: [
      phase(0, 2.5, 'Raise the heels', 'Gastrocnemius and soleus are among the plantar flexors lifting the body. Toe extension here follows the support position, not an inferred toe-extensor effort.', bilateral('ankle', 'dorsiflexion', -1, 'concentric')),
      phase(2.5, 3.5, 'Hold high', 'The plantar flexors sustain the raised position.', bilateral('ankle', 'dorsiflexion', -1, 'isometric')),
      phase(3.5, 6.5, 'Lower the heels slowly', 'The same calf muscles can lengthen under tension to control the return.', bilateral('ankle', 'dorsiflexion', -1, 'eccentric')),
      phase(6.5, 7, 'Reset', 'Pause with the heels down.', []),
    ],
  }),
  activity({
    id: 'head-turn', label: 'Look over each shoulder', category: 'Everyday movements', duration: 8, view: 'front', scope: 'head-neck', focusJoint: 'neck', focusRadius: .33,
    description: 'Compare left and right neck rotation with a small upper-trunk turn. Opposite sides of different neck muscles cooperate in the same turn.',
    sources: source('axial', 'trunk'),
    keyframes: [frame(0), frame(2, {neck: {rotation: 30}, 'thoracic-turn': {rotation: 7}}), frame(3, {neck: {rotation: 30}, 'thoracic-turn': {rotation: 7}}), frame(4), frame(6, {neck: {rotation: -30}, 'thoracic-turn': {rotation: -7}}), frame(7, {neck: {rotation: -30}, 'thoracic-turn': {rotation: -7}}), frame(8)],
    phases: [
      phase(0, 2, 'Turn right', 'Rightward neck rotation combines muscles with ipsilateral and contralateral actions; the upper trunk adds a small turn.', [role('neck', 'rotation', 1), role('thoracic-turn', 'rotation', 1)]),
      phase(2, 3, 'Hold right', 'The rotation contributors can maintain the pose; holding is not the same as relaxation.', [role('neck', 'rotation', 1, 'isometric')]),
      phase(3, 4, 'Return to center', 'The direction of the active return reverses. The model does not estimate braking co-contraction.', [role('neck', 'rotation', -1), role('thoracic-turn', 'rotation', -1)]),
      phase(4, 6, 'Turn left', 'The complementary muscle groups produce the leftward turn.', [role('neck', 'rotation', -1), role('thoracic-turn', 'rotation', -1)]),
      phase(6, 7, 'Hold left', 'Maintain the turned position.', [role('neck', 'rotation', -1, 'isometric')]),
      phase(7, 8, 'Return to center', 'Return to the starting pose for another comparison.', [role('neck', 'rotation', 1), role('thoracic-turn', 'rotation', 1)]),
    ],
  }),
]);

const compiled = new WeakMap();

// A weighted harmonic tangent gives a monotone cubic Hermite curve. Unlike
// unconstrained Catmull–Rom, it cannot overshoot the anatomical keyframe limits.
function tangent(before, after, beforeTime, afterTime) {
  if (!before || !after || Math.sign(before) !== Math.sign(after)) return 0;
  const w1 = 2 * afterTime + beforeTime;
  const w2 = afterTime + 2 * beforeTime;
  return (w1 + w2) / (w1 / before + w2 / after);
}

function curve(times, values) {
  const lengths = times.slice(1).map((time, index) => time - times[index]);
  const slopes = lengths.map((length, index) => (values[index + 1] - values[index]) / length);
  const tangents = values.map((_, index) => {
    const previous = index === 0 ? slopes.length - 1 : index - 1;
    const next = index === values.length - 1 ? 0 : index;
    return tangent(slopes[previous], slopes[next], lengths[previous], lengths[next]);
  });
  return {values, tangents};
}

function compile(sequence) {
  const frames = sequence.keyframes;
  const times = frames.map(keyframe => keyframe.time);
  const axes = Object.entries(frames[0].pose).flatMap(([joint, values]) => Object.keys(values).map(axis => ({
    joint, axis, ...curve(times, frames.map(keyframe => keyframe.pose[joint][axis])),
  })));
  const root = [0, 1, 2].map(axis => curve(times, frames.map(keyframe => keyframe.root[axis])));
  const rotation = [0, 1, 2].map(axis => curve(times, frames.map(keyframe => keyframe.rootRotation?.[axis] || 0)));
  const result = {times, axes, root, rotation};
  compiled.set(sequence, result);
  return result;
}

function interpolate(channel, index, fraction, length) {
  const a = channel.values[index], b = channel.values[index + 1];
  const t2 = fraction * fraction, t3 = t2 * fraction;
  const value = (2 * t3 - 3 * t2 + 1) * a + (t3 - 2 * t2 + fraction) * length * channel.tangents[index]
    + (-2 * t3 + 3 * t2) * b + (t3 - t2) * length * channel.tangents[index + 1];
  // Floating point cancellation at exact limits should never escape the bounds.
  return Math.max(Math.min(a, b), Math.min(Math.max(a, b), value));
}

/** Sample seconds, clamped to one cycle. Caller controls looping and playback rate.
 *  Role.direction selects muscle action/torque, NOT the animated velocity sign.
 *  root is meters; rootRotation is XYZ degrees about the body origin/pivot.
 */
export function sampleActivity(sequence, seconds) {
  if (!sequence || !Array.isArray(sequence.keyframes) || sequence.keyframes.length < 2) throw new TypeError('A movement needs at least two keyframes.');
  const time = Number.isFinite(seconds) ? Math.max(0, Math.min(sequence.duration, seconds)) : 0;
  const channels = compiled.get(sequence) || compile(sequence);
  let index = channels.times.findIndex((value, i) => i > 0 && value > time) - 1;
  if (index < 0) index = channels.times.length - 2;
  const length = channels.times[index + 1] - channels.times[index];
  const fraction = (time - channels.times[index]) / length;
  const pose = {};
  for (const channel of channels.axes) {
    pose[channel.joint] ||= {};
    pose[channel.joint][channel.axis] = interpolate(channel, index, fraction, length);
  }
  const phaseIndex = time === sequence.duration ? sequence.phases.length - 1 : sequence.phases.findIndex(item => item.start <= time && time < item.end);
  return {
    pose, root: channels.root.map(channel => interpolate(channel, index, fraction, length)),
    rootRotation: channels.rotation.map(channel => interpolate(channel, index, fraction, length)),
    phase: sequence.phases[phaseIndex], phaseIndex, time, done: time === sequence.duration,
  };
}
