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

test('the regional capitis surface is a candidate on both sides under both reference names', () => {
  for (const id of ['ta2-2270', 'ta2-2283']) {
    const row = rows.get(id);
    assert.equal(row.atlasStatus, 'needs-anatomical-review');
    for (const side of ['left', 'right']) {
      assert.equal(row.atlasSides[side], 'candidate');
      assert.equal(row.atlas[side].length, 1);
      assert.equal(row.atlas[side][0].role, 'candidate');
      assert.equal(row.atlas[side][0].name, 'Semispinalis capitis region');
      assert.equal(row.atlas[side][0].id, 'muscle-spinalis-capitis-muscle-' + side[0]);
      assert.deepEqual(row.motion[side], []);
    }
  }
});

test('verified reference rows distinguish whole muscles, named subdivisions and serial parts', () => {
  const buccinator = rows.get('ta2-2086');
  const constrictor = rows.get('ta2-2179');
  const constrictorPart = rows.get('ta2-2181');
  const rightCrus = rows.get('ta2-2332');
  const footLumbrical = rows.get('atlas-pelvis-leg-foot-first-lumbrical-of-foot');
  assert.equal(buccinator.atlasSides.left, 'present');
  assert.match(buccinator.note, /Bucinator/);
  assert.equal(constrictor.atlasSides.right, 'present');
  assert.equal(constrictorPart.componentOf, constrictor.id);
  assert.equal(constrictorPart.atlasSides.right, 'not-found');
  assert.equal(rightCrus.atlasSides.left, 'not-applicable');
  assert.equal(rightCrus.atlasSides.right, 'not-found');
  assert.equal(footLumbrical.componentOf, 'ta2-2685');
  assert.equal(rows.get('ta2-2426').atlasSides.midline, 'present');
  assert.equal(rows.get('ta2-2617').variant, true);
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

test('a dedicated heel-raise surface replaces the base surface for the same lesson', () => {
  for (const side of ['left', 'right']) {
    const parts = rows.get('ta2-2658').motion[side];
    const base = parts.find(part => part.asset === 'motion-legs.glb');
    const replacement = parts.find(part => part.asset === 'motion-leg-actions.glb');
    assert.ok(base.modes.includes('walk'));
    assert.equal(base.modes.includes('heel-raise'), false);
    assert.ok(replacement.modes.includes('heel-raise'));
    assert.equal(replacement.rig, 'deforms');
    assert.ok(replacement.deformation.includes('morph-target'));
    assert.equal(replacement.evidence.includes('recorded-surface-emg'), false);
  }
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
