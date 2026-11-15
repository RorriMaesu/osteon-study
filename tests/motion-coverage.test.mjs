import test from 'node:test';
import assert from 'node:assert/strict';
import coverage from '../src/motion-coverage-data.json' with {type:'json'};

const rows = new Map(coverage.rows.map(row => [row.id, row]));
const allParts = sides => Object.values(sides).flat();

test('coverage counts reference entries, named atlas surfaces and motion surfaces separately', () => {
  const reference = coverage.rows.filter(row => row.origin === 'reference');
  const atlas = new Set(coverage.rows.flatMap(row => allParts(row.atlas).map(part => part.id)));
  const motion = new Set(coverage.rows.flatMap(row => allParts(row.motion).map(part => part.asset + ':' + part.node)));
  assert.equal(rows.size, coverage.counts.entries);
  assert.equal(reference.length, coverage.counts.referenceEntries);
  assert.equal(atlas.size, coverage.counts.atlasMuscleParts);
  assert.equal(motion.size, coverage.counts.motionMuscleParts);
  assert.equal(coverage.counts.referenceConfirmed + coverage.counts.referenceOpen, reference.length);
  assert.ok(coverage.counts.referenceOpen > 0);
  assert.equal(coverage.rows.some(row => row.attachmentCertified), false);
});

test('independent left and right atlas anatomy does not imply independently modeled motion', () => {
  const longHead = rows.get('ta2-2639');
  const shortHead = rows.get('ta2-2640');
  for (const side of ['left', 'right']) {
    assert.equal(longHead.atlasSides[side], 'present');
    assert.equal(shortHead.atlasSides[side], 'present');
    const measured = longHead.motion[side].find(part => part.evidence.includes('recorded-surface-emg'));
    assert.match(measured.qualification, /does not distinguish its two heads/);
    assert.equal(shortHead.motion[side].some(part => part.evidence.includes('recorded-surface-emg')), false);
  }
});

test('unresolved candidate surfaces do not pass as anatomically identified motion meshes', () => {
  const articularisCubiti = rows.get('ta2-2475');
  assert.equal(articularisCubiti.atlasStatus, 'not-separately-resolved');
  for (const side of ['left', 'right']) {
    assert.equal(articularisCubiti.atlasSides[side], 'candidate');
    assert.ok(articularisCubiti.atlas[side].length > 0);
    assert.equal(articularisCubiti.atlas[side].every(part => part.role === 'candidate'), true);
    assert.deepEqual(articularisCubiti.motion[side], []);
  }
});

test('the recorded gait is limited to the available surface EMG channels', () => {
  const channels = new Set(coverage.rows.flatMap(row => allParts(row.motion)
    .filter(part => part.evidence.includes('recorded-surface-emg'))
    .map(part => part.side + ':' + part.id)));
  const expected = ['left', 'right'].flatMap(side => [
    'biceps-femoris', 'gastrocnemius-lateral', 'tibialis-anterior', 'vastus-lateralis',
  ].map(id => side + ':' + id));
  assert.deepEqual([...channels].sort(), expected.sort());
});

test('soleus weighting to a single joint alone is rigid', () => {
  for (const side of ['left', 'right']) {
    const plantarflexors = rows.get('ta2-2660').motion[side].filter(part => part.modes.includes('heel-raise'));
    assert.ok(plantarflexors.length > 0);
    for (const part of plantarflexors) {
      assert.ok(part.evidence.includes('textbook-contraction'));
      assert.equal(part.evidence.includes('recorded-surface-emg'), false);
      if (!part.deformation.includes('morph-target') && part.joints.length === 1) {
        assert.equal(part.rig, 'rigid');
      }
    }
  }
});
