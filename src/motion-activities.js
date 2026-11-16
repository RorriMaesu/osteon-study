import {boxingActivity} from './motion-boxing.js';
import {buildUpperActivities} from './motion-upper-activities.js';
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
  walking: {title: 'Sylvester et al. — Muscle forces and the demands of human walking', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8325943/'},
  calf: {title: 'Fukunaga et al. — Muscle fascicle and tendon behavior during walking', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC1088596/'},
  squat: {title: 'DeForest et al. — Muscle activity in single- vs. double-leg squats', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4831851/'},
  jump: {title: 'Arm swing and joint coordination during a countermovement jump', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11368957/'},
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
// Exact task-specific candidates. A joint's complete anatomical action list
// does not establish which muscles are recruited during a coordinated task.
const lowerNames = {
  gluteal: ['Gluteus maximus muscle'],
  vasti: ['Vastus lateralis muscle', 'Vastus medialis muscle', 'Vastus intermedius muscle'],
  rectus: ['Rectus femoris muscle'],
  hamstrings: ['Long head of biceps femoris', 'Semimembranosus muscle', 'Semitendinosus muscle'],
  shortHamstring: ['Short head of biceps femoris'],
  calf: ['Soleus muscle', 'Medial head of gastrocnemius', 'Lateral head of gastrocnemius'],
  hipFlexors: ['Iliacus muscle', 'Psoas major'],
  abductors: ['Gluteus medius muscle', 'Gluteus minimus muscle'],
  dorsiflexor: ['Tibialis anterior muscle'],
  back: ['Iliocostalis lumborum muscle', 'Longissimus thoracis muscle', 'Multifidus lumborum muscle'],
  abdominal: ['Transversus abdominis muscle'],
  footSupport: ['Tibialis posterior muscle', 'Fibularis longus muscle'],
  shoulderFront: ['Clavicular part of deltoid muscle', 'Coracobrachialis muscle'],
  shoulderBack: ['Scapular spinal part of deltoid muscle'],
  scapular: ['Serratus anterior muscle', 'Upper (descending) part of trapezius', 'Lower (ascending) part of trapezius'],
  elbowHold: ['Brachialis muscle', 'Long head of biceps brachii', 'Short head of biceps brachii'],
};
const named = (group, side, contraction = 'contributor', action = '', role = 'prime', label) =>
  ({names: lowerNames[group], ...(side ? {side} : {}), role, contraction, action, ...(label ? {label} : {})});
const trunkSupport = () => [
  named('back', undefined, 'isometric', 'Supports the held trunk against gravity', 'support'),
  named('abdominal', undefined, 'contributor', 'Possible abdominal bracing; effort is not measured', 'support'),
];
const legSupport = contraction => [
  named('gluteal', undefined, contraction, 'Hip extension controls body lowering and raising'),
  named('vasti', undefined, contraction, 'Knee extension controls body lowering and raising'),
  named('rectus', undefined, 'contributor', 'Acts across hip and knee; net fascicle length is not inferred'),
  named('hamstrings', undefined, 'contributor', 'Possible hip support across two moving joints; net fascicle length is not inferred', 'support'),
  named('calf', undefined, contraction === 'isometric' ? 'isometric' : 'contributor', 'Controls the ankle; tendon and muscle fascicles need not change length together'),
  named('hipFlexors', undefined, 'contributor', 'Opposes hip extension; an opposing action does not establish inactivity', 'opponent'),
  named('dorsiflexor', undefined, 'contributor', 'Opposes ankle plantar flexion; an opposing action does not establish inactivity', 'opponent'),
];
const contactPhase = (start, end, label, explanation, namedRoles, contacts = {left: 'flat', right: 'flat'}) =>
  ({start, end, label, explanation, roles: [], namedRoles, contacts});
const armRaise = contraction => [
  named('shoulderFront', undefined, contraction, 'Raises, holds or controls the lowering of the arms'),
  named('scapular', undefined, 'contributor', 'Possible scapular control during arm elevation', 'support'),
];
const swingSupport = () => [
  named('elbowHold', undefined, 'isometric', 'Possible support of the bent elbows during arm swing', 'support'),
  named('back', undefined, 'contributor', 'Possible trunk control during the alternating stride', 'support'),
  named('abdominal', undefined, 'contributor', 'Possible abdominal bracing during the stride', 'support'),
];
const armSwing = (forward, backward) => [
  named('shoulderFront', forward, 'contributor', 'Possible contributor to forward arm swing; momentum also contributes'),
  named('shoulderBack', backward, 'contributor', 'Possible contributor to backward arm swing; not a propulsion estimate'),
];
const stanceRoles = (side, loading = false) => [
  named('gluteal', side, 'contributor', 'Possible early-stance hip support'),
  named('vasti', side, loading ? 'eccentric' : 'contributor', 'Supports the flexed knee during weight acceptance'),
  named('rectus', side, 'contributor', 'Possible knee support across a biarticular muscle'),
  named('abductors', side, 'isometric', 'Possible pelvic support over the stance leg', 'support'),
];
const calfSupport = side => named('calf', side, 'contributor', 'Supports and propels the body; fascicle behavior is not inferred from ankle motion');
const swingClearance = side => [
  named('hipFlexors', side, 'contributor', 'Advances the thigh in swing'),
  named('dorsiflexor', side, 'contributor', 'Positions the foot for swing clearance'),
];
const swingBraking = side => [
  named('hamstrings', side, 'contributor', 'Terminal-swing braking across hip and knee; net fascicle length is not inferred'),
  named('shortHamstring', side, 'eccentric', 'Resists terminal-swing knee extension'),
  named('dorsiflexor', side, 'isometric', 'Maintains foot position before contact'),
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
// At transfer the leading heel and trailing forefoot have equal floor height
// on the actual specimen. The short held transfer makes double support visible.
const walkA = stridePose([20, 8, 0], [-10, 32, 1.1], 16);
const walkLoad = stridePose([14, 14, -2], [-5, 45, 8], 12);
const walkB = stridePose([2, 12, 12], [10, 55, 16], 0);
const walkC = stridePose([-6, 6, 15], [27, 35, 7], -10);
const walkD = stridePose([-10, 20, 10], [25, 14, 0], -15);
const runA = stridePose([30, 15, 3], [-12, 45, -20], 20, 80);
const runB = stridePose([0, 32, 12], [20, 75, -5], 2, 80);
const runC = stridePose([-16, 25, -24], [40, 35, 5], -20, 80);
const runD = stridePose([-14, 45, -4], [34, 16, 3], -15, 80);
const swapSides = pose => Object.fromEntries(Object.entries(pose).map(([id, axes]) => [
  id.startsWith('right-') ? id.replace('right-', 'left-') : id.startsWith('left-') ? id.replace('left-', 'right-') : id,
  id === 'thoracic-turn' ? {rotation: -axes.rotation} : {...axes},
]));
const stance = side => ({[side]: 'flat', [side === 'left' ? 'right' : 'left']: 'air'});
const flight = {left: 'air', right: 'air'};
const walkHalf = (start, lead, trail) => [
  contactPhase(start, start + .18, 'Double support · ' + lead + ' heel forward', 'A brief teaching pause shows both feet sharing support before the trailing foot leaves the ground.', [
    named('vasti', lead, 'isometric', 'Possible support of the leading flexed knee'), calfSupport(trail), ...swingSupport(),
  ], {[lead]: 'heel', [trail]: 'toe'}),
  contactPhase(start + .18, start + .38, (lead === 'right' ? 'Right' : 'Left') + ' loading · opposite toe-off', 'The leading knee bends as it accepts support. Tibialis anterior helps control foot lowering; the opposite thigh begins to swing.', [
    ...stanceRoles(lead, true), named('dorsiflexor', lead, 'eccentric', 'Controls the initial lowering of the foot'), ...swingClearance(trail), ...armSwing(lead, trail), ...swingSupport(),
  ], stance(lead)),
  contactPhase(start + .38, start + 1.2, (lead === 'right' ? 'Right' : 'Left') + ' support · opposite swing', 'The stance-side hip abductors support the pelvis. Calf muscles support tibial progression while the swing foot clears the floor; tendon behavior is not the same as fascicle length change.', [
    calfSupport(lead), named('abductors', lead, 'isometric', 'Possible pelvic support over the stance leg', 'support'), ...swingClearance(trail), ...armSwing(lead, trail), ...swingSupport(),
  ], stance(lead)),
  contactPhase(start + 1.2, start + 2, (lead === 'right' ? 'Right' : 'Left') + ' push-off · opposite landing preparation', 'Calf contributors assist late support. Named hamstrings can brake the advancing leg before its next contact; anatomical knee-flexor membership alone does not establish recruitment.', [
    calfSupport(lead), ...swingBraking(trail), ...armSwing(lead, trail), ...swingSupport(),
  ], stance(lead)),
];
const runHalf = (start, support, swing) => [
  contactPhase(start, start + .375, (support === 'right' ? 'Right' : 'Left') + ' loading', 'Knee extensors control the loaded knee bend. Gluteal support and calf-tendon coordination assist stance while the opposite thigh recovers.', [
    ...stanceRoles(support, true), calfSupport(support), ...swingClearance(swing), ...armSwing(support, swing), ...swingSupport(),
  ], stance(support)),
  contactPhase(start + .375, start + .75, (support === 'right' ? 'Right' : 'Left') + ' push-off', 'Soleus and gastrocnemius are principal late-stance contributors. The support foot remains on the floor until toe-off; arm swing counterbalances the legs.', [
    calfSupport(support), named('abductors', support, 'contributor', 'Possible pelvic support before toe-off', 'support'), ...swingClearance(swing), ...armSwing(support, swing), ...swingSupport(),
  ], stance(support)),
  contactPhase(start + .75, start + 1.05, 'Flight · recover the trailing leg', 'No ground reaction is available in flight. Hip flexors recover the trailing thigh and tibialis anterior contributes to foot clearance.', [
    ...swingClearance(support), named('gluteal', swing, 'contributor', 'Possible repositioning of the advancing thigh before contact'), ...armSwing(swing, support), ...swingSupport(),
  ], flight),
  contactPhase(start + 1.05, start + 1.5, 'Flight · prepare ' + swing + ' landing', 'No ground support is available before contact. Named hamstrings can brake terminal swing; whole-muscle length changes across two joints are not inferred.', [
    ...swingClearance(support), ...swingBraking(swing), ...armSwing(swing, support), ...swingSupport(),
  ], flight),
];

const upperActivities = buildUpperActivities({activity, source, both, role, bilateral, phase, frame});

export const activities = freeze([
  activity({
    id: 'squat', label: 'Squat down and stand', category: 'Everyday movements', duration: 8, view: 'side',
    description: 'Follow the same extensors through lowering, holding and rising. A partial squat keeps the demonstration inside this teaching rig’s range.',
    sources: source('lower', 'upper', 'trunk', 'contraction', 'squat'),
    keyframes: [frame(0), frame(3, squatPose, [0, 0, 0], [20, 0, 0]), frame(4, squatPose, [0, 0, 0], [20, 0, 0]), frame(7), frame(8)],
    phases: [
      contactPhase(0, 3, 'Lower with control', 'Hip and knee extensors resist the downward load while the joints flex. The arms rise for balance; trunk support and biarticular contributions are shown separately.', [...legSupport('eccentric'), ...armRaise('concentric'), ...trunkSupport()]),
      contactPhase(3, 4, 'Hold the squat', 'The knee and hip extensors and raised arms maintain position. Stopping the movement does not mean these muscles stop contributing.', [...legSupport('isometric'), ...armRaise('isometric'), ...trunkSupport()]),
      contactPhase(4, 7, 'Stand up', 'Hip and knee extensors help lift the body while the arm elevators control the arms returning down. Calf fascicle behavior is not inferred from ankle motion.', [...legSupport('concentric'), ...armRaise('eccentric'), ...trunkSupport()]),
      contactPhase(7, 8, 'Reset upright', 'The effort cue clears between repetitions. Postural muscle tone is not measured by this model.', []),
    ],
  }),
  activity({
    id: 'hip-hinge', label: 'Bend and straighten', category: 'Everyday movements', duration: 8, view: 'side',
    description: 'Compare bending at the hips with bending the lower back. The arms hang toward the floor as the torso tips forward with a small knee bend.',
    sources: source('lower', 'axial', 'trunk', 'contraction'),
    keyframes: [frame(0), frame(3, {...both('hip', {flexion: 38}), ...both('knee', {flexion: 8}), ...both('ankle', {dorsiflexion: 4}), ...both('shoulder', {flexion: 38}), trunk: {flexion: 4}}, [0, 0, 0], [34, 0, 0]), frame(4, {...both('hip', {flexion: 38}), ...both('knee', {flexion: 8}), ...both('ankle', {dorsiflexion: 4}), ...both('shoulder', {flexion: 38}), trunk: {flexion: 4}}, [0, 0, 0], [34, 0, 0]), frame(7), frame(8)],
    phases: [
      contactPhase(0, 3, 'Hinge forward', 'Gluteal hip extensors control the descent; back extensors support the trunk. The arms hang under gravity, so their changing shoulder angle is not labeled active shoulder flexion.', [
        named('gluteal', undefined, 'eccentric', 'Controls hip flexion under the weight of the torso'),
        named('hamstrings', undefined, 'contributor', 'Possible hip-extension contribution across a simultaneously bending knee'),
        named('vasti', undefined, 'contributor', 'Possible support of the small knee bend', 'support'),
        named('back', undefined, 'contributor', 'Supports the torso during its small spinal bend', 'support'),
        named('abdominal', undefined, 'contributor', 'Possible abdominal bracing', 'support'),
        named('hipFlexors', undefined, 'contributor', 'Opposes hip extension; not an inactivity claim', 'opponent'),
      ]),
      contactPhase(3, 4, 'Hold the hinge', 'Gluteal and posterior thigh muscles can maintain the hip angle while spinal extensors support the torso. The hanging arms are not actively raised.', [
        named('gluteal', undefined, 'isometric', 'Maintains the flexed hip position'), named('hamstrings', undefined, 'isometric', 'Possible support of the held hip angle'),
        named('vasti', undefined, 'isometric', 'Possible support of the held knee angle', 'support'), ...trunkSupport(),
        named('hipFlexors', undefined, 'contributor', 'Opposes hip extension; not an inactivity claim', 'opponent'),
      ]),
      contactPhase(4, 7, 'Return upright', 'Gluteal hip extensors straighten the hip. Posterior thigh muscles act across two moving joints; their net fascicle length is not estimated.', [
        named('gluteal', undefined, 'concentric', 'Returns the hips upright'), named('hamstrings', undefined, 'contributor', 'Possible hip-extension contribution across two moving joints'),
        named('vasti', undefined, 'contributor', 'Possible support during the small knee return', 'support'), named('back', undefined, 'contributor', 'Supports the small return of the trunk', 'support'),
        named('abdominal', undefined, 'contributor', 'Possible abdominal bracing', 'support'),
        named('hipFlexors', undefined, 'contributor', 'Opposes hip extension; not an inactivity claim', 'opponent'),
      ]),
      contactPhase(7, 8, 'Reset upright', 'Pause before repeating the bend.', []),
    ],
  }),
  activity({
    id: 'walking', label: 'Walk in place', category: 'Locomotion', duration: 4, view: 'side', ground: 'alternate', endpointPhaseIndex: 0,
    description: 'A slowed stride with brief double-support pauses separates loading, support, push-off and swing clearance. Body travel is simplified; the highlighted support side follows the actual foot contact.',
    sources: source('lower', 'upper', 'walking', 'calf'),
    keyframes: [frame(0, walkA), frame(.18, walkA), frame(.38, walkLoad), frame(.7, walkB), frame(1.2, walkC), frame(1.65, walkD), frame(2, swapSides(walkA)), frame(2.18, swapSides(walkA)), frame(2.38, swapSides(walkLoad)), frame(2.7, swapSides(walkB)), frame(3.2, swapSides(walkC)), frame(3.65, swapSides(walkD)), frame(4, walkA)],
    phases: [...walkHalf(0, 'right', 'left'), ...walkHalf(2, 'left', 'right')],
  }),
  activity({
    id: 'running', label: 'Run in place', category: 'Locomotion', duration: 3, view: 'side', ground: 'alternate', endpointPhaseIndex: 0,
    description: 'Watch greater knee recovery and a brief flight interval. This slowed sequence illustrates phase roles; it does not estimate force, speed or EMG.',
    sources: source('running', 'lower', 'upper', 'calf'),
    keyframes: [frame(0, runA), frame(.375, runB), frame(.75, runC), frame(1.125, runD, [0, .055, 0]), frame(1.5, swapSides(runA)), frame(1.875, swapSides(runB)), frame(2.25, swapSides(runC)), frame(2.625, swapSides(runD), [0, .055, 0]), frame(3, runA)],
    phases: [...runHalf(0, 'right', 'left'), ...runHalf(1.5, 'left', 'right')],
  }),
  activity({
    id: 'jumping', label: 'Jump and land', category: 'Locomotion', duration: 6, view: 'side', ground: 'both',
    description: 'A small two-foot jump links a controlled countermovement, push-off, flight and landing. Height and timing are slowed teaching choices.',
    sources: source('lower', 'upper', 'trunk', 'contraction', 'jump'),
    keyframes: [frame(0), frame(1.5, {...both('hip', {flexion: 42}), ...both('knee', {flexion: 46}), ...both('ankle', {dorsiflexion: 18}), ...both('shoulder', {flexion: -16})}, [0, 0, 0], [14, 0, 0]), frame(2.2, {...both('ankle', {dorsiflexion: -23}), ...both('shoulder', {flexion: 68}), ...both('elbow', {flexion: 12})}), frame(2.7, {...both('hip', {flexion: 8}), ...both('knee', {flexion: 16}), ...both('ankle', {dorsiflexion: -10}), ...both('shoulder', {flexion: 76})}, [0, .18, 0]), frame(3.2, {...both('hip', {flexion: 8}), ...both('knee', {flexion: 12}), ...both('ankle', {dorsiflexion: -6}), ...both('shoulder', {flexion: 45})}), frame(3.8, {...both('hip', {flexion: 40}), ...both('knee', {flexion: 44}), ...both('ankle', {dorsiflexion: 17}), ...both('shoulder', {flexion: 30})}, [0, 0, 0], [13, 0, 0]), frame(5.3), frame(6)],
    phases: [
      contactPhase(0, 1.5, 'Load the jump', 'Hip and knee extensors resist the downward motion. The posterior deltoid is a possible contributor to the arm backswing.', [...legSupport('eccentric'), named('shoulderBack', undefined, 'contributor', 'Possible arm-backswing contribution'), ...trunkSupport()]),
      contactPhase(1.5, 2.2, 'Push off', 'Hip and knee extension and calf contribution combine with the forward arm swing. Both feet stay on the floor until the toe-off event.', [...legSupport('concentric'), ...armRaise('concentric'), ...trunkSupport()]),
      contactPhase(2.2, 2.7, 'Flight · gather the legs', 'No ground reaction is available in flight. Named hip and knee contributors reposition the limbs and tibialis anterior positions the feet; these are not support-force estimates.', [
        named('hipFlexors', undefined, 'contributor', 'Possible thigh repositioning in flight'),
        named('hamstrings', undefined, 'contributor', 'Possible knee flexion across two moving joints; net length is not inferred'),
        named('shortHamstring', undefined, 'contributor', 'Possible knee flexion during leg gathering'),
        named('dorsiflexor', undefined, 'contributor', 'Positions the feet after toe-off'),
        ...armRaise('contributor'),
      ], flight),
      contactPhase(2.7, 3.2, 'Flight · prepare to land', 'No ground reaction is available before contact. Knee extensors can lengthen the legs slightly while the arm elevators help control arm lowering.', [
        named('vasti', undefined, 'contributor', 'Possible knee extension before contact'), named('rectus', undefined, 'contributor', 'Possible knee extension across a biarticular muscle'),
        named('dorsiflexor', undefined, 'contributor', 'Positions the feet for landing'), ...armRaise('eccentric'),
      ], flight),
      contactPhase(3.2, 3.8, 'Absorb the landing', 'The joints bend after contact while extensors help absorb the landing. The arms continue lowering; joint flexion does not imply that flexors alone are doing the work.', [...legSupport('eccentric'), ...armRaise('eccentric'), ...trunkSupport()]),
      contactPhase(3.8, 5.3, 'Stand after landing', 'Extensors restore the upright posture while the arms return down.', [...legSupport('concentric'), ...armRaise('eccentric'), ...trunkSupport()]),
      contactPhase(5.3, 6, 'Reset upright', 'Pause between the authored repetitions.', []),
    ],
  }),
  upperActivities['reach-forward'],
  upperActivities['reach-up'],
  upperActivities['fist'],
  upperActivities['grasp'],
  upperActivities['dance'],
  activity(boxingActivity),
  activity({
    id: 'heel-raise', label: 'Rise onto the toes', category: 'Everyday movements', duration: 7, view: 'side',
    description: 'Watch the calf muscles lift the heels, hold the position and control the return. The feet stay aligned with the ground reference.',
    sources: source('lower', 'contraction'),
    keyframes: [frame(0), frame(2.5, {...both('ankle', {dorsiflexion: -20}), ...both('hallux', {extension: 20}), ...both('toe-2', {extension: 16}), ...both('toe-3', {extension: 16}), ...both('toe-4', {extension: 16}), ...both('toe-5', {extension: 16})}), frame(3.5, {...both('ankle', {dorsiflexion: -20}), ...both('hallux', {extension: 20}), ...both('toe-2', {extension: 16}), ...both('toe-3', {extension: 16}), ...both('toe-4', {extension: 16}), ...both('toe-5', {extension: 16})}), frame(6.5), frame(7)],
    phases: [
      contactPhase(0, 2.5, 'Raise the heels', 'Gastrocnemius and soleus lift the heels. Named foot stabilizers are possible support, and toe extension follows contact rather than an inferred toe-extensor effort.', [
        named('calf', undefined, 'concentric', 'Raises the heels against gravity'), named('footSupport', undefined, 'contributor', 'Possible support of foot alignment', 'support'), ...trunkSupport(),
        named('dorsiflexor', undefined, 'contributor', 'Opposes plantar flexion; not an inactivity claim', 'opponent'),
      ], {left: 'toe', right: 'toe'}),
      contactPhase(2.5, 3.5, 'Hold high', 'The calf muscles sustain the raised position while foot and trunk support can help maintain balance.', [
        named('calf', undefined, 'isometric', 'Maintains the raised heels'), named('footSupport', undefined, 'contributor', 'Possible support of foot alignment', 'support'), ...trunkSupport(),
        named('dorsiflexor', undefined, 'contributor', 'Opposes plantar flexion; not an inactivity claim', 'opponent'),
      ], {left: 'toe', right: 'toe'}),
      contactPhase(3.5, 6.5, 'Lower the heels slowly', 'The same calf muscles control the return. Toe-extensor effort is not inferred from the changing toe angle.', [
        named('calf', undefined, 'eccentric', 'Controls the slow lowering of the heels'), named('footSupport', undefined, 'contributor', 'Possible support of foot alignment', 'support'), ...trunkSupport(),
        named('dorsiflexor', undefined, 'contributor', 'Opposes plantar flexion; not an inactivity claim', 'opponent'),
      ], {left: 'toe', right: 'toe'}),
      contactPhase(6.5, 7, 'Reset', 'Pause with the heels down.', []),
    ],
  }),
  upperActivities['head-turn'],
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
  // A non-looping gait stops exactly on its next contact. Report that boundary
  // as landed/double support, rather than retaining the preceding swing phase.
  const endpoint = Number.isInteger(sequence.endpointPhaseIndex) && sequence.phases[sequence.endpointPhaseIndex]
    ? sequence.endpointPhaseIndex : sequence.phases.length - 1;
  const phaseIndex = time === sequence.duration ? endpoint : sequence.phases.findIndex(item => item.start <= time && time < item.end);
  return {
    pose, root: channels.root.map(channel => interpolate(channel, index, fraction, length)),
    rootRotation: channels.rotation.map(channel => interpolate(channel, index, fraction, length)),
    phase: sequence.phases[phaseIndex], contacts: sequence.phases[phaseIndex]?.contacts,
    phaseIndex, time, done: time === sequence.duration,
  };
}
