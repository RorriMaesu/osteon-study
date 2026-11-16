import {poseMotionScope} from './motion-pose-ik.js';

const shoulderContext = /pectoralis|serratus anterior|trapezius|rhomboid|levator scapulae|subclavius|rotator cuff/i;

/** Preserve the relevant attachment anatomy when a movement crosses a region boundary. */
export function activityScope(scope, activity, roles, descriptors, parts, bones) {
  const arm = /^(left|right)-arm$/.exec(scope);
  const neck = scope === 'head-neck' && activity.focusJoint === 'neck';
  const joint = descriptors.find(item => item.id === (neck ? 'neck' : arm ? arm[1] + '-shoulder' : null));
  const context = new Set();
  if (joint) {
    for (const row of roles.rows) {
      if (neck || row.part.side === arm[1] && shoulderContext.test(row.name)) context.add(row.key);
    }
  }
  // Reuse the pose viewer's attachment rules. An ordinary limb isolation
  // without any cross-region roles keeps its normal anatomy footprint.
  return poseMotionScope(scope, context.size ? joint : null,
    {contributors: [...context], opposing: []}, parts, bones);
}
