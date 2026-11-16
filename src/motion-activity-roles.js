import {poseRoles} from './motion-pose-core.js';

const contractions = Object.freeze({
  concentric: 'Shortening under tension',
  eccentric: 'Lengthening under tension',
  isometric: 'Holding / stabilizing',
  contributor: 'Possible contributor',
});
const muscleKey = part => part.key || part.id;
const normalizedName = value => typeof value === 'string' ? value.trim().toLowerCase() : '';
const isMuscle = part => (!part.kind || part.kind === 'muscle')
  && !/\b(bursa|fascia|sheath|retinaculum|ligament|aponeurosis|tendon)\b/i.test(part.name || part.muscleName || part.sourceName || '');
const add = (map, key, value) => {
  if (!map.has(key)) map.set(key, new Set());
  map.get(key).add(value);
};

/** Resolve an authored phase without inferring recruitment from pose velocity.
 * A stabilizer entry supplies support candidates, not an opposing-action list.
 * Named support matches entire atlas muscle names; it never matches a region.
 */
export function resolveActivityRoles(activity, phase, descriptors, parts, pose = {}) {
  const byJoint = new Map(descriptors.map(joint => [joint.id, joint]));
  const contributors = new Set(), opposing = new Set(), shared = new Set();
  const types = new Map(), jointRoles = new Map(), priority = new Map();
  const stabilizers = new Map(), namedSupport = new Map();
  const entries = phase?.roles || [];

  for (const [index, entry] of entries.entries()) {
    const joint = byJoint.get(entry.joint);
    if (!joint) continue;
    const resolved = poseRoles(joint, entry.axis, entry.direction, parts, pose);
    const contraction = Object.hasOwn(contractions, entry.contraction) ? entry.contraction : 'contributor';
    for (const key of resolved.contributors || []) {
      if (!priority.has(key)) priority.set(key, index);
      add(jointRoles, key, resolved.label || joint.label);
      if (entry.stabilizer) add(stabilizers, key, contraction);
      else {
        contributors.add(key);
        add(types, key, contraction);
      }
    }
    if (!entry.stabilizer) {
      for (const key of resolved.opposing || []) opposing.add(key);
      for (const key of resolved.shared || []) shared.add(key);
    }
  }

  const dynamicKeys = new Set(contributors);
  // Only directional action evidence can establish mixed joint actions.
  // Being listed as a possible stabilizer does not turn an opposing action into
  // a contradictory shortening/lengthening claim.
  for (const key of contributors) {
    if (opposing.has(key)) {
      shared.add(key);
      opposing.delete(key);
    }
  }
  for (const key of shared) contributors.delete(key);

  for (const [index, support] of (activity?.supportMuscles || []).entries()) {
    const names = new Set((support.names || []).map(normalizedName).filter(Boolean));
    if (!names.size) continue;
    const label = typeof support.label === 'string' && support.label.trim() ? support.label.trim() : 'Possible stabilizer';
    for (const part of parts) {
      if (!isMuscle(part)) continue;
      const name = normalizedName(part.name || part.muscleName || part.sourceName);
      if (!names.has(name)) continue;
      const key = muscleKey(part);
      if (!key) continue;
      add(namedSupport, key, label);
      add(jointRoles, key, label);
      if (!priority.has(key)) priority.set(key, entries.length + index);
    }
  }

  const supportedOpponents = new Set();
  for (const key of new Set([...stabilizers.keys(), ...namedSupport.keys()])) {
    // Keep stronger authored dynamic/contraction evidence and all genuinely
    // mixed actions, rather than overwriting them with a generic support label.
    if (shared.has(key) || contributors.has(key)) continue;
    if (opposing.has(key)) {
      supportedOpponents.add(key);
      opposing.delete(key);
    }
    contributors.add(key);
    types.set(key, stabilizers.has(key) ? new Set(stabilizers.get(key)) : new Set(['contributor']));
  }

  const labels = new Map(), rows = [];
  for (const part of parts) {
    const key = muscleKey(part);
    const kind = shared.has(key) ? 'mixed' : contributors.has(key) ? 'contributor' : opposing.has(key) ? 'opponent' : null;
    if (!kind) continue;
    const type = kind === 'mixed' ? [] : [...(types.get(key) || [])];
    const action = [...(jointRoles.get(key) || [])];
    const onlyNamedSupport = namedSupport.has(key) && !stabilizers.has(key) && !dynamicKeys.has(key);
    let label;
    if (kind === 'mixed') label = 'Mixed joint actions · net length change not inferred';
    else if (kind === 'opponent') label = 'Opposing action · not necessarily inactive';
    else if (onlyNamedSupport) label = [...namedSupport.get(key)].join(' / ');
    else label = type.map(item => contractions[item]).join(' / ');
    if (supportedOpponents.has(key)) label += ' · also opposes this action';
    labels.set(key, label);
    rows.push({key, name: part.name || part.muscleName || key, side: part.side, part, kind, types: type,
      role: label, action: action.join(' · '), priority: priority.get(key) ?? 1000});
  }
  const order = {contributor: 0, mixed: 0, opponent: 1};
  rows.sort((a, b) => order[a.kind] - order[b.kind] || a.priority - b.priority
    || a.name.localeCompare(b.name) || String(a.side).localeCompare(String(b.side)));
  return {contributors: [...contributors], opposing: [...opposing], shared: [...shared], labels, rows};
}
