import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Box3, Raycaster, Vector3} from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {labFor} from '../src/ap2-library.js';
import {structureIndex} from '../src/ap2-model-index.js';
import {neuralRegions} from '../src/ap2-neural-regions.js';

async function readParts(id) {
  const bytes = await readFile(new URL('../assets/ap2-neuro/' + id + '.glb', import.meta.url));
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  const {scene} = await new GLTFLoader().parseAsync(buffer, '');
  scene.updateMatrixWorld(true);
  const parts = new Map();
  scene.traverse(mesh => {
    if (!mesh.isMesh) return;
    const label = mesh.userData.teachingLabel;
    assert.ok(label, 'Every selectable mesh has a teaching label');
    if (!parts.has(label)) parts.set(label, []);
    parts.get(label).push(mesh);
  });
  return parts;
}

function bounds(parts, label) {
  const meshes = parts.get(label);
  assert.ok(meshes?.length, label);
  const box = new Box3();
  for (const mesh of meshes) box.expandByObject(mesh, true);
  return box;
}

// Disjoint intervals identify separate sheath segments even when the exporter merges them.
function axialIntervals(meshes) {
  const triangles = [];
  const point = new Vector3();
  for (const mesh of meshes) {
    const {index, attributes} = mesh.geometry;
    const count = index ? index.count : attributes.position.count;
    for (let i = 0; i < count; i += 3) {
      let min = Infinity, max = -Infinity;
      for (let corner = i; corner < i + 3; corner++) {
        const vertex = index ? index.getX(corner) : corner;
        const x = point.fromBufferAttribute(attributes.position, vertex).applyMatrix4(mesh.matrixWorld).x;
        min = Math.min(min, x);
        max = Math.max(max, x);
      }
      triangles.push([min, max]);
    }
  }
  const spans = [];
  for (const [min, max] of triangles.sort((a, b) => a[0] - b[0])) {
    const last = spans.at(-1);
    if (last && min <= last[1] + 1e-5) last[1] = Math.max(last[1], max);
    else spans.push([min, max]);
  }
  return spans;
}

test('the whole neuron and terminal close-up are discoverable and link to each other', () => {
  const index = structureIndex();
  const stations = [['12.2', 'multipolar-neuron'], ['12.5', 'chemical-synapse']];
  for (const [section, id] of stations) {
    const route = 'ap2-lesson-' + section + '/activity/' + id;
    assert.ok(index.some(entry => entry.route === route && entry.section === section && entry.kind.includes('3D')), id);
    const [otherSection, otherId] = stations.find(([, other]) => other !== id);
    const lesson = labFor(section).renderLab(section);
    assert.ok(lesson.includes('data-neuro-specimen="' + id + '"'));
    assert.ok(lesson.includes('href="#ap2-lesson-' + otherSection + '/activity/' + otherId + '"'), 'Cross-scale link in ' + section);
    assert.equal(neuralRegions[id].reconstruction, true);
  }
});

test('the nucleus lies in the soma and nodes expose the axon between myelin segments', async () => {
  const id = 'multipolar-neuron';
  const parts = await readParts(id);
  assert.deepEqual(new Set(parts.keys()), new Set(neuralRegions[id].parts.map(part => part.name)));
  const soma = bounds(parts, 'Cell body');
  const centerX = label => bounds(parts, label).getCenter(new Vector3()).x;
  const nucleus = bounds(parts, 'Nucleus').getCenter(new Vector3());
  assert.ok(soma.containsPoint(nucleus));
  const front = new Vector3(nucleus.x, nucleus.y, soma.max.z + soma.getSize(new Vector3()).z);
  const inward = new Raycaster(front, new Vector3(0, 0, -1));
  const [hit] = inward.intersectObjects([...parts.get('Cell body'), ...parts.get('Nucleus')], false);
  assert.equal(hit?.object.userData.teachingLabel, 'Nucleus', 'The cutaway exposes the nucleus');
  assert.ok(bounds(parts, 'Dendrites').min.x < soma.min.x);
  assert.ok(centerX('Axon hillock') < centerX('Initial segment'));
  assert.ok(centerX('Initial segment') < centerX('Myelin sheath'));
  assert.ok(centerX('Axon terminals') > centerX('Myelin sheath'));
  const axon = bounds(parts, 'Axon');
  const sheath = axialIntervals(parts.get('Myelin sheath'));
  assert.ok(sheath.length >= 2, 'Myelin is segmented');
  for (const [min, max] of axialIntervals(parts.get('Nodes of Ranvier'))) {
    const node = (min + max) / 2;
    assert.ok(axon.min.x < node && node < axon.max.x, 'A node belongs to the axon');
    assert.ok(sheath.slice(1).some(([start], i) => sheath[i][1] < node && node < start), 'Each node is in a gap between internodes');
  }
});

test('the chemical synapse separates the two membranes and positions signaling structures on their respective sides', async () => {
  const id = 'chemical-synapse';
  const parts = await readParts(id);
  assert.deepEqual(new Set(parts.keys()), new Set(neuralRegions[id].parts.map(part => part.name)));
  const terminal = bounds(parts, 'Presynaptic terminal');
  const membrane = bounds(parts, 'Postsynaptic membrane');
  const vesicles = bounds(parts, 'Synaptic vesicles');
  const calcium = bounds(parts, 'Voltage-gated calcium channels');
  const receptors = bounds(parts, 'Ligand-gated receptors');
  assert.ok(terminal.min.y > membrane.max.y, 'Extracellular cleft separates the membranes');
  const bracket = bounds(parts, 'Synaptic cleft');
  const midCleft = (terminal.min.y + membrane.max.y) / 2;
  assert.ok(bracket.min.y < midCleft && midCleft < bracket.max.y, 'The cleft marker spans the extracellular separation');
  assert.ok(terminal.containsPoint(vesicles.getCenter(new Vector3())), 'Vesicles are in the terminal');
  assert.ok(calcium.intersectsBox(terminal), 'Calcium channels meet the releasing terminal');
  assert.ok(receptors.intersectsBox(membrane), 'Receptors meet the receiving membrane');
  assert.ok(calcium.getCenter(new Vector3()).y > receptors.getCenter(new Vector3()).y);
  const transmitter = bounds(parts, 'Neurotransmitter');
  assert.ok(transmitter.min.y < terminal.min.y && transmitter.max.y > membrane.max.y, 'Transmitter reaches into the cleft');
});
