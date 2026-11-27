import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Box3, Raycaster, Vector3} from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {vesselWallTypes} from '../src/ap2-vessel-walls.js';
import {fetalPaths, fetalRoutes, fetalSegments} from '../src/ap2-fetal-paths.js';
import {entericParts, entericRoutes} from '../src/ap2-enteric-wall.js';
import {structureIndex} from '../src/ap2-model-index.js';
import {sectionById} from '../src/ap2-library.js';
import {bodyStructures} from '../src/ap2-body-systems.js';

test('every chapter has direct 3D entries and body landmarks use the correct chapter and section', () => {
  const views = structureIndex().filter(row => row.kind.includes('3D') || row.kind === 'On the body');
  assert.deepEqual(new Set(views.map(row => row.section.split('.')[0])), new Set(['12','13','14','15','16','17','18','19','20']));
  assert.equal(new Set(views.map(row => row.route)).size, views.length);
  for (const row of views) {
    assert.ok(sectionById.has(row.section), row.title);
    if (row.kind === 'On the body') assert.ok(Object.hasOwn(bodyStructures, row.route.slice('ap2-body/'.length)), row.title);
    else assert.ok(row.route.startsWith('ap2-lesson-' + row.section + '/activity'), row.title);
  }
  const sectionOf = id => views.find(row => row.route === 'ap2-body/' + id)?.section;
  assert.equal(sectionOf('pineal'), '17.7');
  assert.equal(sectionOf('pancreas'), '17.9');
});

async function loadModel(name) {
  const bytes = await readFile(new URL('../assets/' + name + '.glb', import.meta.url));
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  const {scene} = await new GLTFLoader().parseAsync(buffer, '');
  scene.updateMatrixWorld(true);
  return scene;
}

test('arterial and venous tunics are selectable and the two venous cusps meet under reverse pressure', async () => {
  const {asset, parts} = vesselWallTypes.walls;
  const model = await loadModel(asset);
  const selection = mesh => mesh.name.replace(/^vein_leaflet_[ab]$/, 'vein_leaflet');
  assert.deepEqual(new Set(model.children.map(selection)), new Set(Object.keys(parts)));

  const widths = vessel => ['intima', 'media', 'externa'].map(layer =>
    new Box3().setFromObject(model.getObjectByName(vessel + '_' + layer)).getSize(new Vector3()).x);
  const artery = widths('artery'), vein = widths('vein');
  assert.ok(artery[0] < artery[1] && artery[1] < artery[2]);
  assert.ok(vein[0] < vein[1] && vein[1] < vein[2]);
  assert.ok(artery[1] - artery[0] > vein[1] - vein[0], 'arterial media is thicker');

  function midlineEdges(mesh, closed) {
    mesh.morphTargetInfluences[0] = Number(closed);
    const points = [];
    for (let i = 0; i < mesh.geometry.attributes.position.count; i++) {
      const point = mesh.getVertexPosition(i, new Vector3());
      if (Math.abs(point.z) < 1e-5) points.push(point);
    }
    points.sort((a, b) => a.y - b.y);
    assert.ok(points.length > 1, mesh.name);
    return {hinge: points[0], free: points.at(-1)};
  }
  const leaflets = ['a', 'b'].map(side => model.getObjectByName('vein_leaflet_' + side));
  const open = leaflets.map(mesh => midlineEdges(mesh, false));
  const shut = leaflets.map(mesh => midlineEdges(mesh, true));
  const vesselWidth = vein[0];
  assert.ok(open[0].free.distanceTo(open[1].free) > .5 * vesselWidth);
  assert.ok(shut[0].free.distanceTo(shut[1].free) < 1e-5);
  open.forEach((side, i) => assert.ok(side.hinge.distanceTo(shut[i].hinge) < 1e-5));
});

test('rays through capillary cutaways encounter progressively more open exchange barriers', async () => {
  const {asset, parts} = vesselWallTypes.capillaries;
  const model = await loadModel(asset);
  const ray = new Raycaster(new Vector3(), new Vector3(0, 0, -1));
  function openings(kind) {
    const surface = part => model.getObjectByName(kind + '_' + part);
    for (const part of Object.keys(parts)) assert.ok(surface(part)?.isMesh, kind + ' ' + part);
    const lining = surface('endothelium'), basement = surface('basement');
    let exposedBasement = 0, throughBoth = 0;
    // Cast from the lumen into the interior of the modeled patch, avoiding its outer border.
    for (let x = -.93; x <= .93; x += .077) {
      for (let y = -.78; y <= .78; y += .063) {
        ray.ray.origin.set(x, y, 2);
        if (ray.intersectObject(lining).length) continue;
        if (ray.intersectObject(basement).length) exposedBasement++;
        else throughBoth++;
      }
    }
    return {exposedBasement, throughBoth};
  }
  const continuous = openings('continuous'), fenestrated = openings('fenestrated'), sinusoidal = openings('sinusoidal');
  assert.equal(continuous.throughBoth, 0);
  assert.equal(fenestrated.throughBoth, 0);
  assert.ok(fenestrated.exposedBasement > continuous.exposedBasement);
  assert.ok(sinusoidal.throughBoth > 0);
});

test('each endothelial nucleus is exposed on the luminal face of its capillary', async () => {
  const model = await loadModel(vesselWallTypes.capillaries.asset);
  // Sample each of the seven cell centers from inside the curved wall.
  const rows = [[-.82, .01, .83], [-1.04, -.41, .445, 1.055]];
  for (const type of ['continuous', 'fenestrated', 'sinusoidal']) {
    const radius = type === 'sinusoidal' ? 1.49 : 1.13;
    const surfaces = Object.keys(vesselWallTypes.capillaries.parts).map(key => model.getObjectByName(type + '_' + key));
    for (const [index, centers] of rows.entries()) {
      for (const center of centers) {
        const angle = center / radius;
        const ray = new Raycaster(new Vector3(0, index === 0 ? -.45 : .43, radius), new Vector3(Math.sin(angle), 0, -Math.cos(angle)));
        assert.equal(ray.intersectObjects(surfaces, false)[0]?.object.name, type + '_nuclei', type + ' cell at ' + center);
      }
    }
  }
});

test('each fetal marker route follows joined, labeled segments registered to the exported anatomy', async () => {
  const model = await loadModel('ap2-fetal-flow');
  const vector = coords => new Vector3(...coords);
  for (const [id, coordinates] of Object.entries(fetalPaths)) {
    const mesh = model.getObjectByName(id);
    assert.ok(mesh?.isMesh && fetalSegments[id], id);
    if (id === 'foramenOvale') {
      const center = vector(coordinates[1]);
      assert.ok(mesh.getWorldPosition(new Vector3()).distanceTo(center) < 1e-5);
      assert.ok(new Box3().setFromObject(model.getObjectByName('septal_flap')).containsPoint(center));
      continue;
    }
    const bounds = new Box3().setFromObject(mesh).expandByScalar(1e-5);
    for (const coords of coordinates) assert.ok(bounds.containsPoint(vector(coords)), id + ' misses a blood-flow waypoint');
  }
  const shunts = {placental:'ductusVenosus', atrial:'foramenOvale', ductal:'ductusArteriosus'};
  for (const route of fetalRoutes) {
    if (shunts[route.id]) assert.ok(route.path.includes(shunts[route.id]), route.name);
    for (let i = 1; i < route.path.length; i++) {
      const previous = fetalPaths[route.path[i - 1]], next = fetalPaths[route.path[i]];
      assert.deepEqual(previous.at(-1), next[0], route.name + ' must traverse joined vessels');
    }
  }
  assert.deepEqual(fetalRoutes.map(route => route.id).sort(), ['atrial','ductal','lung','placentaReturn','placental']);
  const placenta = new Box3().setFromObject(model.getObjectByName('placenta'));
  assert.ok(placenta.containsPoint(vector(fetalPaths.umbilicalVein[0])));
  for (const id of ['leftUmbilicalArtery', 'rightUmbilicalArtery']) {
    assert.ok(placenta.containsPoint(vector(fetalPaths[id].at(-1))));
  }
});

test('the exported intestinal wall places each plexus at its anatomical depth', async () => {
  const model = await loadModel('ap2-neuro/enteric-wall');
  assert.deepEqual(new Set(model.children.map(mesh => mesh.name)), new Set(Object.keys(entericParts)));
  const bounds = id => new Box3().setFromObject(model.getObjectByName(id));
  const depth = id => bounds(id).getCenter(new Vector3()).y;
  const wall = ['mucosa','submucosa','circular_muscle','myenteric_plexus','longitudinal_muscle','serosa'];
  wall.slice(1).forEach((id,i) => assert.ok(depth(wall[i]) > depth(id), id));
  const submucosa = bounds('submucosa'), network = bounds('submucosal_plexus');
  assert.ok(network.min.y > submucosa.min.y && network.max.y < submucosa.max.y);
  assert.ok(bounds('myenteric_plexus').max.z > bounds('circular_muscle').max.z);
  assert.ok(bounds('vagal_afferent').intersectsBox(bounds('medulla')));
  assert.ok(bounds('vagal_efferent').intersectsBox(bounds('medulla')));
  assert.ok(bounds('vagal_efferent').intersectsBox(bounds('enteric_motor')));
  assert.ok(bounds('enteric_motor').intersectsBox(bounds('circular_muscle')));
});

test('the short reflex stays in the enteric circuit and the long reflex crosses the CNS boundary', () => {
  const targets = key => entericRoutes[key].steps.map(([id]) => id);
  assert.deepEqual(targets('short'), ['intrinsic_sensory','enteric_interneuron','enteric_motor','circular_muscle']);
  assert.deepEqual(targets('long'), ['vagal_afferent','medulla','vagal_efferent','enteric_motor','circular_muscle']);
  for (const route of Object.values(entericRoutes)) {
    for (const [id, explanation] of route.steps) assert.ok(entericParts[id] && explanation, id);
  }
  assert.ok(structureIndex().some(row => row.route === 'ap2-lesson-15.2/activity/enteric-wall'));
});
