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

  const namedEntries = [
    ...(phase?.namedRoles || []),
    ...(activity?.supportMuscles || []).map(entry => ({...entry, role: 'support'})),
  ];
  for (const [index, entry] of namedEntries.entries()) {
    const names = new Set((entry.names || []).map(normalizedName).filter(Boolean));
    const keys = new Set(entry.keys || []);
    const contraction = Object.hasOwn(contractions, entry.contraction) ? entry.contraction : 'contributor';
    const label = entry.label?.trim() || 'Possible stabilizer';
    for (const part of parts) {
      if (!isMuscle(part) || (entry.side && part.side !== entry.side)) continue;
      const name = normalizedName(part.name || part.muscleName || part.sourceName);
      const key = muscleKey(part);
      if (!key || (!keys.has(key) && !names.has(name))) continue;
      if (!priority.has(key)) priority.set(key, entries.length + index);
      if (entry.action) add(jointRoles, key, entry.action);
      if (entry.role === 'support') {
        add(namedSupport, key, label);
        add(jointRoles, key, label);
        if (entry.contraction) add(stabilizers, key, contraction);
      } else if (entry.role === 'opponent') {
        if (!contributors.has(key)) opposing.add(key);
      } else {
        contributors.add(key);
        opposing.delete(key);
        add(types, key, contraction);
      }
    }
  }

  const dynamicKeys = new Set(contributors);
  // Directional roles from different joints can conflict. Support alone
  // never establishes opposing torque or a change in muscle length.
  for (const key of contributors) {
    if (opposing.has(key)) {
      shared.add(key);
      opposing.delete(key);
    }
  }
  for (const key of shared) contributors.delete(key);

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
    const supporting = kind === 'contributor' && !dynamicKeys.has(key);
    const onlyNamedSupport = supporting && namedSupport.has(key);
    let label;
    if (kind === 'mixed') label = 'Mixed joint actions · net length change not inferred';
    else if (kind === 'opponent') label = 'Opposing action · not necessarily inactive';
    else if (onlyNamedSupport) label = [...namedSupport.get(key)].join(' / ');
    else label = type.map(item => contractions[item]).join(' / ');
    if (supportedOpponents.has(key)) label += ' · also opposes this action';
    labels.set(key, label);
    const cue = supporting ? 'support' : type.length === 1 ? type[0] : 'contributor';
    rows.push({key, name: part.name || part.muscleName || key, side: part.side, part, kind, supporting, cue, types: type,
      role: label, action: action.join(' · '), priority: priority.get(key) ?? 1000});
  }
  const rank = row => row.kind === 'opponent' ? 2 : row.supporting ? 1 : 0;
  rows.sort((a, b) => rank(a) - rank(b) || a.priority - b.priority
    || a.name.localeCompare(b.name) || String(a.side).localeCompare(String(b.side)));
  return {contributors: [...contributors], opposing: [...opposing], shared: [...shared], labels, rows};
}
