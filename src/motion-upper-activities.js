import {boxingHandPose} from './motion-boxing-hands.js';

// Directional entries describe actions. Support entries remain separate so a
// wrist stabilizer cannot turn a finger flexor into a false opposing mover.
// These authored cues are not a prediction of EMG, force, or fiber shortening.
const cuffNames = ['Supraspinatus muscle', 'Infraspinatus muscle', 'Subscapularis muscle', 'Teres minor muscle'];
const wristExtensorNames = ['Extensor carpi radialis brevis', 'Extensor carpi radialis longus', 'Humeral head of extensor carpi ulnaris', 'Ulnar head of extensor carpi ulnaris'];
const coreNames = ['Transversus abdominis muscle', 'Multifidus lumborum muscle'];
const calfNames = ['Soleus muscle', 'Medial head of gastrocnemius', 'Lateral head of gastrocnemius'];
const gripSource = {title: 'Caumes et al. — Wrist mechanics during grasping', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6920170/'};

export function buildUpperActivities({activity, source, both, role, bilateral, phase, frame}) {
  const support = (names, side, label, action) => ({names, side, role: 'support', contraction: 'contributor', label, action});
  const cuff = side => support(cuffNames, side, 'Possible shoulder stabilizer', 'Rotator-cuff support during arm positioning');
  const wristSupport = () => support(wristExtensorNames, 'right', 'Possible wrist stabilizer', 'Wrist support during finger flexion');
  const core = () => support(coreNames, undefined, 'Possible trunk stabilizer', 'Postural support during the sway');
  const withSupport = (entry, namedRoles = [], contacts) => ({...entry, namedRoles, ...(contacts ? {contacts} : {})});
  const stable = (joint, axis, direction) => ({...role(joint, axis, direction, 'isometric'), stabilizer: true});
  const fingerRoles = (direction, contraction) => ['index', 'middle', 'ring', 'little'].flatMap(digit =>
    ['mcp', 'pip', 'dip'].map(level => role('right-' + digit + '-' + level, 'flexion', direction, contraction)));
  const thumbRoles = (direction, contraction, {opposition = false} = {}) => [
    role('right-thumb-mcp', 'flexion', direction, contraction),
    role('right-thumb-ip', 'flexion', direction, contraction),
    // Several CMC components combine to position the thumb; do not infer net
    // shortening from one component of this coupled movement.
    role('right-thumb-cmc', 'flexion', direction),
    role('right-thumb-cmc', 'abduction', direction),
    ...(opposition ? [role('right-thumb-cmc', 'opposition', direction)] : []),
  ];
  const thumbHold = ({opposition = false} = {}) => [
    role('right-thumb-mcp', 'flexion', 1, 'isometric'),
    role('right-thumb-ip', 'flexion', 1, 'isometric'),
    stable('right-thumb-cmc', 'flexion', 1),
    stable('right-thumb-cmc', 'abduction', 1),
    ...(opposition ? [stable('right-thumb-cmc', 'opposition', 1)] : []),
  ];
  const proximalHold = () => [
    stable('right-shoulder', 'flexion', 1),
    stable('right-elbow', 'flexion', 1),
    stable('right-scapula', 'protraction', 1),
  ];
  const graspArm = {'right-shoulder': {flexion: 50}, 'right-elbow': {flexion: 35}, 'right-scapula': {protraction: 4}};
  const roundedHand = () => {
    const pose = {
      'right-thumb-cmc': {opposition: 47.52, flexion: 6.48, abduction: 8.64},
      'right-thumb-mcp': {flexion: 15.84}, 'right-thumb-ip': {flexion: 15.84},
      'right-wrist': {flexion: -5.76},
    };
    for (const digit of ['index', 'middle', 'ring', 'little']) {
      pose['right-' + digit + '-mcp'] = {flexion: 30.96};
      pose['right-' + digit + '-pip'] = {flexion: 39.6};
      pose['right-' + digit + '-dip'] = {flexion: 21.6};
    }
    return pose;
  };
  const danceBase = {...both('knee', {flexion: 8}), ...both('hip', {flexion: 6}), ...both('ankle', {dorsiflexion: 2}), ...both('elbow', {flexion: 38})};
  const dancePose = (stance, swing, turn) => ({
    ...danceBase, [swing + '-hip']: {abduction: 15, flexion: 12}, [swing + '-knee']: {flexion: 22},
    // The real rig's free foot needs this small dorsiflexion for toe clearance.
    // Verified with dense actual-mesh foot probes, not inferred from pose angles.
    [swing + '-ankle']: {dorsiflexion: 8},
    [stance + '-shoulder']: {scaption: 48}, [swing + '-shoulder']: {scaption: 24},
    'thoracic-turn': {rotation: turn * 8},
  });
  const danceSupport = stance => [
    cuff('right'), cuff('left'), core(),
    support(calfNames, stance, 'Possible stance-ankle stabilizer', 'Support while the other foot is off the floor'),
    {names: ['Tibialis anterior muscle'], side: stance === 'right' ? 'left' : 'right', role: 'prime', contraction: 'contributor', action: 'Possible swing-foot positioning and clearance'},
  ];
  const danceStance = stance => [stable(stance + '-hip', 'abduction', 1), stable(stance + '-knee', 'flexion', -1), ...['right', 'left'].map(side => stable(side + '-elbow', 'flexion', 1))];
  const danceTransfer = () => [...['right', 'left'].flatMap(side => [stable(side + '-knee', 'flexion', -1), stable(side + '-elbow', 'flexion', 1)])];
  const flat = {left: 'flat', right: 'flat'};
  const rightStance = {left: 'air', right: 'flat'}, leftStance = {left: 'flat', right: 'air'};

  return {
    'reach-forward': activity({
      id: 'reach-forward', label: 'Reach forward', category: 'Everyday movements', duration: 7, view: 'side', scope: 'right-arm', focusJoint: 'right-shoulder', focusRadius: .47,
      description: 'Follow shoulder and elbow flexion with scapular protraction. Nearby shoulder-blade and cuff muscles remain available in the arm view; scapular motion is a simplified teaching representation.',
      sources: source('upper', 'contraction'),
      keyframes: [frame(0), frame(2.5, {'right-shoulder': {flexion: 65}, 'right-scapula': {protraction: 7}, 'right-elbow': {flexion: 12}}), frame(3.5, {'right-shoulder': {flexion: 65}, 'right-scapula': {protraction: 7}, 'right-elbow': {flexion: 12}}), frame(6.5), frame(7)],
      phases: [
        withSupport(phase(0, 2.5, 'Lift and reach', 'Shoulder and elbow flexors lift the arm. Serratus anterior helps advance the scapula; cuff muscles are shown as possible support, not measured recruitment.', [role('right-shoulder', 'flexion', 1, 'concentric'), role('right-elbow', 'flexion', 1, 'concentric'), role('right-scapula', 'protraction', 1)]), [cuff('right')]),
        withSupport(phase(2.5, 3.5, 'Hold the reach', 'The raised arm and bent elbow still require support. The scapula stays positioned while the hand is held forward.', proximalHold()), [cuff('right')]),
        withSupport(phase(3.5, 6.5, 'Lower with control', 'Shoulder and elbow flexors can lengthen under tension during descent. Retractors guide scapular return; cuff support remains possible.', [role('right-shoulder', 'flexion', 1, 'eccentric'), role('right-elbow', 'flexion', 1, 'eccentric'), role('right-scapula', 'protraction', -1)]), [cuff('right')]),
        phase(6.5, 7, 'Reset', 'The hand rests beside the body. No effort cue is assigned during this pause.', []),
      ],
    }),
    'reach-up': activity({
      id: 'reach-up', label: 'Raise the arms', category: 'Everyday movements', duration: 8, view: 'front',
      description: 'Raise both arms in the scapular plane and lower them slowly. This rig stops below a full overhead reach. Compare movers with possible shoulder stabilizers.',
      sources: source('upper', 'contraction'),
      keyframes: [frame(0), frame(3, {...both('shoulder', {scaption: 60}), ...both('elbow', {flexion: 12})}), frame(4, {...both('shoulder', {scaption: 60}), ...both('elbow', {flexion: 12})}), frame(7), frame(8)],
      phases: [
        withSupport(phase(0, 3, 'Raise in the scapular plane', 'Deltoid and supraspinatus help raise the arms; serratus anterior and trapezius help rotate the scapulae. Elbow flexors add a small bend.', [...bilateral('shoulder', 'scaption', 1, 'concentric'), ...bilateral('elbow', 'flexion', 1, 'concentric')]), [cuff('right'), cuff('left')]),
        withSupport(phase(3, 4, 'Hold the arms', 'The elevating system supports the arms against gravity. Elbows stay bent, and cuff support continues.', [...bilateral('shoulder', 'scaption', 1, 'isometric'), ...['right', 'left'].map(side => stable(side + '-elbow', 'flexion', 1))]), [cuff('right'), cuff('left')]),
        withSupport(phase(4, 7, 'Control the lowering', 'Arm elevators and elbow flexors can lengthen under tension during controlled lowering. Possible cuff stabilizers remain visible.', [...bilateral('shoulder', 'scaption', 1, 'eccentric'), ...bilateral('elbow', 'flexion', 1, 'eccentric')]), [cuff('right'), cuff('left')]),
        phase(7, 8, 'Reset', 'Pause before repeating; an absent highlight is not a measurement of relaxation.', []),
      ],
    }),
    fist: activity({
      id: 'fist', label: 'Clench and open a fist', category: 'Hands', duration: 7, scope: 'right-arm', view: 'lesson', focusJoint: 'right-index-mcp', focusRadius: .11,
      description: 'Curl the finger joints and fold the thumb across their outside, then reopen the hand. The wrist stays straight. The checked fist pose does not simulate contact force.',
      sources: [...source('upper', 'contraction'), gripSource],
      keyframes: [frame(0), frame(2.5, boxingHandPose('right')), frame(3.5, boxingHandPose('right')), frame(6.5), frame(7)],
      phases: [
        withSupport(phase(0, 2.5, 'Close the fingers and thumb', 'Finger flexors curl the digits. Thumb MCP and IP flexion includes flexor pollicis longus; several CMC actions position the thumb outside the fingers.', [...fingerRoles(1, 'concentric'), ...thumbRoles(1, 'concentric')]), [wristSupport()]),
        withSupport(phase(2.5, 3.5, 'Hold the fist', 'Finger and thumb flexors can maintain this shape. Wrist-extensor support does not make the finger flexors inactive; intrinsic hand muscles have different actions at different joints.', [...fingerRoles(1, 'isometric'), ...thumbHold()]), [wristSupport()]),
        phase(3.5, 6.5, 'Open the hand', 'Finger and thumb extensors reopen the hand. CMC repositioning combines several actions, so a single thumb component does not establish net fiber shortening.', [...fingerRoles(-1, 'concentric'), ...thumbRoles(-1, 'concentric')]),
        phase(6.5, 7, 'Pause with the hand open', 'The next repetition starts open. No contact force or recruitment measurement is simulated.', []),
      ],
    }),
    grasp: activity({
      id: 'grasp', label: 'Reach, grasp and release', category: 'Hands', duration: 10, view: 'side', scope: 'right-arm', focusJoint: 'right-elbow', focusRadius: .42,
      description: 'Coordinate a reach with a rounded grasp shape, then release. The empty hand illustrates coordination without a virtual object or collision-based grip. Arm support continues while the fingers change shape.',
      sources: [...source('upper', 'contraction'), gripSource],
      keyframes: [frame(0), frame(2, graspArm), frame(4, {...roundedHand(), ...graspArm}), frame(5.5, {...roundedHand(), ...graspArm}), frame(7, graspArm), frame(9.5), frame(10)],
      phases: [
        withSupport(phase(0, 2, 'Position the hand', 'Shoulder and elbow flexors position the hand as the scapula advances. The cuff can provide shoulder support.', [role('right-shoulder', 'flexion', 1, 'concentric'), role('right-elbow', 'flexion', 1, 'concentric'), role('right-scapula', 'protraction', 1)]), [cuff('right')]),
        withSupport(phase(2, 4, 'Shape the grasp', 'Fingers and thumb shape the imagined grip while the shoulder, bent elbow, and scapula keep supporting the arm. The wrist extends slightly as the fingers curl.', [...fingerRoles(1, 'concentric'), ...thumbRoles(1, 'concentric', {opposition: true}), ...proximalHold()]), [cuff('right'), wristSupport()]),
        withSupport(phase(4, 5.5, 'Hold the shape and arm', 'Finger and thumb flexors maintain the shape. Wrist extensors can resist their pull while the shoulder, elbow, and scapula continue supporting the raised arm.', [...fingerRoles(1, 'isometric'), ...thumbHold({opposition: true}), ...proximalHold()]), [cuff('right'), wristSupport()]),
        withSupport(phase(5.5, 7, 'Release while keeping the arm up', 'Extensors reopen the hand; proximal support stays present until the arm starts to lower. The wrist returns toward neutral without an assigned load estimate.', [...fingerRoles(-1, 'concentric'), ...thumbRoles(-1, 'concentric', {opposition: true}), ...proximalHold()]), [cuff('right'), wristSupport()]),
        withSupport(phase(7, 9.5, 'Return the hand', 'Shoulder and elbow flexors can control descent, while scapular retractors guide the shoulder blade back. These are action cues, not calculated muscle lengths.', [role('right-shoulder', 'flexion', 1, 'eccentric'), role('right-elbow', 'flexion', 1, 'eccentric'), role('right-scapula', 'protraction', -1)]), [cuff('right')]),
        phase(9.5, 10, 'Reset', 'Pause before the next reach; no support cue is assigned during this pause.', []),
      ],
    }),
    dance: activity({
      id: 'dance', label: 'Dance side to side', category: 'Sport and expression', duration: 8, view: 'front', ground: 'alternate',
      description: 'A gentle sway pairs alternating leg lifts with both arms moving and the trunk turning. Foot-contact phases distinguish the supporting leg from the moving leg; highlights remain illustrative.',
      sources: source('lower', 'upper', 'trunk'),
      keyframes: [frame(0, danceBase), frame(.4, danceBase), frame(2, dancePose('right', 'left', 1), [-.035, 0, 0]), frame(3.6, danceBase), frame(4.4, danceBase), frame(6, dancePose('left', 'right', -1), [.035, 0, 0]), frame(7.6, danceBase), frame(8, danceBase)],
      phases: [
        withSupport(phase(0, .4, 'Prepare with both feet down', 'Both feet contact the floor. Bent knees and elbows remain supported before the first lift.', danceTransfer()), [core()], flat),
        withSupport(phase(.4, 2, 'Lift left · sway right', 'Right hip abductors help support the pelvis. The left hip and knee flex, with a little ankle dorsiflexion for clearance. Both arms rise by different amounts while the trunk turns.', [...danceStance('right'), role('left-hip', 'abduction', 1), role('left-hip', 'flexion', 1), role('left-knee', 'flexion', 1), ...bilateral('shoulder', 'scaption', 1, 'concentric'), role('thoracic-turn', 'rotation', 1)]), danceSupport('right'), rightStance),
        withSupport(phase(2, 3.6, 'Lower left · keep right-leg support', 'Right-leg support continues until the left foot returns. Hip abductors and arm elevators can control lowering. Hip and knee coordination does not establish the net length change of muscles crossing both joints.', [...danceStance('right'), role('left-hip', 'abduction', 1, 'eccentric'), role('left-hip', 'flexion', 1), role('left-knee', 'flexion', -1), ...bilateral('shoulder', 'scaption', 1, 'eccentric'), role('thoracic-turn', 'rotation', -1)]), danceSupport('right'), rightStance),
        withSupport(phase(3.6, 4.4, 'Transfer with both feet down', 'Both feet have returned to the floor before the other leg lifts. The model marks contact, not measured load distribution.', danceTransfer()), [core()], flat),
        withSupport(phase(4.4, 6, 'Lift right · sway left', 'Left hip abductors support the pelvis. The right hip and knee flex, with a little ankle dorsiflexion for clearance. Both arms rise and the trunk turns the other way.', [...danceStance('left'), role('right-hip', 'abduction', 1), role('right-hip', 'flexion', 1), role('right-knee', 'flexion', 1), ...bilateral('shoulder', 'scaption', 1, 'concentric'), role('thoracic-turn', 'rotation', -1)]), danceSupport('left'), leftStance),
        withSupport(phase(6, 7.6, 'Lower right · keep left-leg support', 'Left-leg support continues until the right foot returns. Hip abductors and both arm-elevating systems can control lowering. Coordinated hip and knee movement does not establish net biarticular muscle shortening.', [...danceStance('left'), role('right-hip', 'abduction', 1, 'eccentric'), role('right-hip', 'flexion', 1), role('right-knee', 'flexion', -1), ...bilateral('shoulder', 'scaption', 1, 'eccentric'), role('thoracic-turn', 'rotation', 1)]), danceSupport('left'), leftStance),
        withSupport(phase(7.6, 8, 'Finish with both feet down', 'Return to the supported starting position before repeating.', danceTransfer()), [core()], flat),
      ],
    }),
    'head-turn': activity({
      id: 'head-turn', label: 'Look over each shoulder', category: 'Everyday movements', duration: 8, view: 'front', scope: 'head-neck', focusJoint: 'neck', focusRadius: .33,
      description: 'Compare left and right neck rotation with a small upper-trunk turn. Different muscles cooperate across the two sides; these action capabilities do not establish that every muscle recruits equally.',
      sources: source('axial', 'trunk'),
      keyframes: [frame(0), frame(2, {neck: {rotation: 30}, 'thoracic-turn': {rotation: 7}}), frame(3, {neck: {rotation: 30}, 'thoracic-turn': {rotation: 7}}), frame(4), frame(6, {neck: {rotation: -30}, 'thoracic-turn': {rotation: -7}}), frame(7, {neck: {rotation: -30}, 'thoracic-turn': {rotation: -7}}), frame(8)],
      phases: [
        phase(0, 2, 'Turn right', 'Right splenius and left sternocleidomastoid have cooperating rotation actions. Posterior neck and trunk muscles remain visible as possible contributors, not an all-on activation measurement.', [role('neck', 'rotation', 1), role('thoracic-turn', 'rotation', 1)]),
        phase(2, 3, 'Hold right', 'Keep the neck and upper trunk turned. Both retain support cues; a stationary pose is not proof of muscular relaxation.', [stable('neck', 'rotation', 1), stable('thoracic-turn', 'rotation', 1)]),
        phase(3, 4, 'Return to center', 'The return reverses the directional action cue. Braking co-contraction and individual deep-muscle recruitment are not estimated.', [role('neck', 'rotation', -1), role('thoracic-turn', 'rotation', -1)]),
        phase(4, 6, 'Turn left', 'Left splenius and right sternocleidomastoid have cooperating actions for this turn; the upper trunk contributes a small rotation.', [role('neck', 'rotation', -1), role('thoracic-turn', 'rotation', -1)]),
        phase(6, 7, 'Hold left', 'Maintain the neck and upper-trunk positions. The support cues continue through the hold.', [stable('neck', 'rotation', -1), stable('thoracic-turn', 'rotation', -1)]),
        phase(7, 8, 'Return to center', 'Return to the starting pose. Which muscles brake or co-contract depends on the real task and is not inferred from this animation.', [role('neck', 'rotation', 1), role('thoracic-turn', 'rotation', 1)]),
      ],
    }),
  };
}
