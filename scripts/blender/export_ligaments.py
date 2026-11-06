"""Build Osteon's registered ligament layer in Blender 4.5.

Open the pinned Z-Anatomy Startup.blend with --disable-autoexec. Pass the
task root after --. Source and existing web assets are opened read-only.
"""
import hashlib
import json
import math
import re
import shutil
import struct
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path

import bpy
from mathutils import Matrix, Vector
from mathutils.bvhtree import BVHTree

root = Path(sys.argv[sys.argv.index('--') + 1]).resolve()
repo = root / 'outputs/osteon-study'
asset = repo / 'assets/ligaments.glb'
project = root / 'outputs/osteon-models/ligament-atlas.blend'
manifest = repo / 'src/ligament-models.json'
assets = repo / 'assets'
source = Path(bpy.data.filepath).resolve()
source_hash = '9f08a17ea0115fed80b2a73ecdf0a1bc2ab2f6956f37c593ce23d513ea35afcd'

def digest(path):
    with path.open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()

if digest(source) != source_hash:
    raise RuntimeError('The input does not match the pinned Z-Anatomy source')

def snapshot(paths):
    stamp = datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S-%f')
    folder = root / 'outputs/model-backups' / f'ligaments-{stamp}'
    folder.mkdir(parents=True, exist_ok=False)
    files = []
    for path in paths:
        if path.exists():
            copy = folder / path.name
            shutil.copy2(path, copy)
            checksum = digest(copy)
            if checksum != digest(path):
                raise RuntimeError(f'Backup verification failed for {path}')
            files.append({'original': str(path), 'file': copy.name, 'sha256': checksum})
    (folder / 'manifest.json').write_text(json.dumps({'files': files}, indent=2), encoding='utf-8')
    print('VERIFIED_BACKUP', folder, flush=True)
    return folder

def nodes(path):
    with path.open('rb') as stream:
        header = stream.read(20)
        return json.loads(stream.read(int.from_bytes(header[12:16], 'little')))['nodes']

legacy = {n: 'course-tissues' for n in json.loads((assets / 'course-tissues-manifest.json').read_text())
          if 'ligament' in n.lower()}
for node in nodes(assets / 'landmark-details.glb'):
    props = node.get('extras', {})
    name = props.get('zname', '')
    if props.get('supportAnatomy') and re.match(r'^(Flexor retinaculum of wrist|Sacrotuberous ligament|Sacrospinous ligament|Patellar ligament)\.[lr]$', name):
        legacy[name] = 'landmark-details'

def ancestry(obj):
    parents = []
    while obj.parent:
        obj = obj.parent
        parents.append(obj.name)
    return parents

def include(name, parents):
    if name.startswith('Cricopharyngeal ligament') or name.endswith(('.g', '.i', '.j', '.s', '.t')):
        return False
    if 'Joints.g' in parents:
        return bool(re.search(r'\bligaments?\b|Ligamenta flava|interosseous membrane|quadrangular membrane|obturator membrane|oblique cord', name, re.I))
    return bool(re.match(r'^(Inguinal ligament|Superficial transverse (metacarpal|metatarsal) ligament|Suspensory ligament of eyeball|.*retinaculum)\.[lr]$', name))

def location(name, parents, bounds):
    group = ' '.join(parents).lower()
    lower = name.lower()
    if 'stylohyoid' in lower:
        return 'Skull', ['skull', 'neck']
    if 'cranial syndesmoses' in group or 'temporomandibular joint' in group or 'eyeball' in lower:
        return 'Skull', ['skull']
    if re.search('larynx|thyrohyoid|cricothyroid|atlanto-axial', group + ' ' + lower):
        return 'Spine', ['neck']
    if 'vertebral column' in group:
        if 'intercornual' in lower:
            return 'Pelvis', ['pelvis']
        minimum, maximum = bounds
        areas = [area for area, low, high in [('lower-back', .86, 1.15), ('thoracic-spine', 1.15, 1.44), ('neck', 1.44, 1.63)]
                 if minimum[2] <= high and maximum[2] >= low]
        return 'Spine', areas
    if 'thoracic joints' in group:
        return 'Thorax', ['thorax', 'thoracic-spine']
    if 'sternoclavicular' in group:
        return 'Upper limb', ['shoulder', 'thorax']
    if 'girdle' in group and 'upper limb' in group or 'glenohumeral' in group:
        return 'Upper limb', ['shoulder', 'arm']
    if 'elbow joint' in group:
        return 'Upper limb', ['arm', 'forearm']
    if 'radio-ulnar syndesmoses' in group:
        return 'Upper limb', ['forearm']
    if 'radiocarpal' in group or 'distal radio-ulnar' in group or 'retinaculum of wrist' in lower:
        return 'Upper limb', ['hand', 'forearm']
    if 'upper limb' in group or 'metacarpal' in lower:
        return 'Upper limb', ['hand']
    if 'hip joint' in group:
        return 'Pelvis', ['pelvis', 'thigh']
    if re.search('pelvic girdle|pubic symphysis|sacro-iliac', group) or 'inguinal' in lower:
        return 'Pelvis', ['pelvis', 'lower-back'] if 'iliolumbar' in lower else ['pelvis']
    if 'knee joint' in group or 'superior tibiofibular' in group or 'patellar' in lower:
        return 'Lower limb', ['knee', 'thigh', 'leg']
    if 'interosseous membrane of leg' in lower:
        return 'Lower limb', ['leg']
    if re.search('ankle|tibiofibular syndesmosis|fibular retinaculum', group + ' ' + lower):
        return 'Lower limb', ['foot', 'leg']
    if 'lower limb' in group or 'metatarsal' in lower:
        return 'Lower limb', ['foot']
    raise RuntimeError(f'Unclassified surface {name}: {parents}')

backup = snapshot([assets / 'skeleton.glb', assets / 'course-tissues.glb', assets / 'landmark-details.glb', asset, project])
original_scenes = list(bpy.data.scenes)
depsgraph = bpy.context.evaluated_depsgraph_get()
original_objects = list(bpy.context.scene.objects)
derived = bpy.data.scenes.new('Osteon | Ligament atlas')
material = bpy.data.materials.new('Ligament layer | gold')
material.diffuse_color = (.70, .35, .08, 1)
collections = {}
records = []
layer_objects = []

def add_surface(name, mesh, parents, mode, asset_name):
    if len(mesh.polygons) < 4:
        raise RuntimeError(f'Invalid evaluated surface {name}')
    bounds = [[round(f(v.co[i] for v in mesh.vertices), 7) for i in range(3)] for f in (min, max)]
    side_match = re.search(r'\.([lr])$', name)
    side = side_match[1] if side_match else {'Ulnopisiform ligament': 'r', 'Intra-articular ligament of head of rib': 'l'}.get(name)
    # Z-Anatomy has these two source labels reversed. The anatomy stays in place.
    if name.startswith('Lateral temporomandibular ligament.'):
        side = {'l': 'r', 'r': 'l'}[side]
    if side and (bounds[0][0] + bounds[1][0]) * (1 if side == 'l' else -1) <= 0:
        raise RuntimeError(f'Unexpected side for {name}: {bounds}')
    label = re.sub(r'\.[lr]$', '', name)
    if label in ('Radial collateral ligament', 'Ulnar collateral ligament'):
        label += ' of elbow'
    region, areas = location(name, parents, bounds)
    division = 'Axial' if region in ('Skull', 'Thorax', 'Spine') or label == 'Intercornual ligament' else 'Appendicular'
    if re.match(r'Sacro-iliac|.*sacro-iliac|Sacrospinous|Sacrotuberous|Iliolumbar|Costoclavicular|.*sternoclavicular|Interclavicular', name, re.I):
        division = 'Mixed'
    kind = 'Retinaculum' if 'retinaculum' in label else 'Fibrous membrane' if 'membrane' in label else 'Fibrous band' if label == 'Oblique cord' else 'Ligament'
    if region not in collections:
        coll = bpy.data.collections.new('Ligaments | ' + region)
        derived.collection.children.link(coll)
        collections[region] = coll
    mesh.materials.clear()
    mesh.materials.append(material)
    for polygon in mesh.polygons:
        polygon.material_index = 0
    obj = bpy.data.objects.new('Ligament | ' + name, mesh)
    obj['zname'] = name
    if side:
        obj['anatomicalSide'] = side
    obj['anatomicalRegion'] = region
    obj['geometrySource'] = mode
    obj['sourceGroup'] = parents[0].removesuffix('.g') if parents else ''
    collections[region].objects.link(obj)
    layer_objects.append(obj)
    records.append({'sourceName': name, 'name': label, 'side': side, 'kind': kind, 'region': region,
                    'areas': areas, 'division': division, 'asset': asset_name, 'geometry': mode,
                    'group': obj['sourceGroup'], 'faces': len(mesh.polygons), 'boundsBlender': bounds})

for obj in sorted(original_objects, key=lambda o: o.name):
    parents = ancestry(obj)
    if obj.type != 'MESH' or not include(obj.name, parents) or obj.name in legacy:
        continue
    evaluated = obj.evaluated_get(depsgraph)
    mesh = bpy.data.meshes.new_from_object(evaluated, depsgraph=depsgraph)
    mesh.transform(evaluated.matrix_world)
    add_surface(obj.name, mesh, parents, 'Z-Anatomy source-aligned surface', 'ligaments')

bpy.context.window.scene = derived
def import_asset(filename):
    previous = set(derived.objects)
    raw = (assets / f'{filename}.glb').read_bytes()
    size = struct.unpack_from('<I', raw, 12)[0]
    data = json.loads(raw[20:20 + size])
    if any(scene.get('nodes') is None for scene in data['scenes']):
        # Blender 4.5 needs an explicit node list for empty historical scenes.
        for scene in data['scenes']:
            if scene.get('nodes') is None:
                scene['nodes'] = []
        chunk = json.dumps(data, separators=(',', ':')).encode()
        chunk += b' ' * (-len(chunk) % 4)
        body = struct.pack('<II', len(chunk), 0x4e4f534a) + chunk + raw[20 + size:]
        with tempfile.TemporaryDirectory() as folder:
            compatible = Path(folder) / f'{filename}.glb'
            compatible.write_bytes(struct.pack('<III', 0x46546c67, 2, len(body) + 12) + body)
            bpy.ops.import_scene.gltf(filepath=str(compatible))
    else:
        bpy.ops.import_scene.gltf(filepath=str(assets / f'{filename}.glb'))
    bpy.context.view_layer.update()
    return set(derived.objects) - previous

context = bpy.data.collections.new('Osteon | Skeleton context')
derived.collection.children.link(context)
replacements = set()
for filename in ('course-tissues', 'landmark-details'):
    imported = import_asset(filename)
    for obj in imported:
        name = obj.get('zname')
        if obj.type == 'MESH' and obj.get('replacementAnatomy'):
            replacement = obj.copy()
            replacement.parent = None
            replacement.matrix_world = obj.matrix_world.copy()
            context.objects.link(replacement)
            replacements.add(name)
        if obj.type != 'MESH' or legacy.get(name) != filename:
            continue
        original = bpy.data.objects.get(name)
        parents = ['Knee joint.g'] if name == 'Patellar ligament.r' else ancestry(original)
        mesh = obj.data.copy()
        mesh.transform(obj.matrix_world)
        mode = 'Existing Osteon teaching reconstruction' if name == 'Patellar ligament.r' else 'Existing Osteon source-aligned surface'
        add_surface(name, mesh, parents, mode, filename)
        if name == 'Patellar ligament.r':
            mirrored = mesh.copy()
            mirrored.transform(Matrix.Diagonal((-1, 1, 1, 1)))
            mirrored.flip_normals()
            add_surface('Patellar ligament.l', mirrored, parents, 'Mirrored Osteon teaching reconstruction', 'ligaments')
    for obj in imported:
        bpy.data.objects.remove(obj, do_unlink=True)

if len(records) < 250 or len({r['sourceName'] for r in records}) != len(records):
    raise RuntimeError('Unexpected missing or duplicate surfaces')
if set(legacy) - {r['sourceName'] for r in records}:
    raise RuntimeError('The derived model is missing legacy surfaces')
if any(not r['areas'] for r in records):
    raise RuntimeError('The derived model contains unmapped regions')

for obj in import_asset('skeleton'):
    if obj.get('zname') in replacements:
        bpy.data.objects.remove(obj, do_unlink=True)
        continue
    for collection in list(obj.users_collection):
        collection.objects.unlink(obj)
    context.objects.link(obj)

def bone_tree(name):
    bone = next(o for o in context.objects if o.get('zname') == name)
    return BVHTree.FromPolygons([bone.matrix_world @ v.co for v in bone.data.vertices],
                                [tuple(p.vertices) for p in bone.data.polygons])

def transverse_atlantal_ligament():
    # Cross sections of the shipped C1/C2 meshes locate the C1 medial
    # tubercles and the rear of the dens. The elliptical profile follows
    # the dissection/MRI measurements published in PMC9574110.
    atlas, axis = bone_tree('Atlas (C1)'), bone_tree('Axis (C2)')
    stations, ring = 48, 24
    vertices, faces = [], []
    for i in range(stations + 1):
        u = 2 * i / stations - 1
        for j in range(ring):
            angle = 2 * math.pi * j / ring
            y = .01665 - .00525 * u*u + (.0012 + .00045 * u*u) * math.cos(angle)
            z = 1.5446 + (.0043 - .0017 * u*u) * math.sin(angle)
            side = -1 if u < 0 else 1
            hit, *_ = atlas.ray_cast(Vector((0, y, z)), Vector((side, 0, 0)), .023)
            if hit is None:
                raise RuntimeError('Transverse atlantal ligament could not be fitted to C1')
            x = u * (abs(hit.x) + .0002)
            dens, *_ = axis.ray_cast(Vector((x, .023, z)), Vector((0, -1, 0)), .012)
            if dens is not None:
                y = max(y, dens.y + .00012)
            vertices.append((x, y, z))
    for i in range(stations):
        for j in range(ring):
            k = (j+1) % ring
            a, b = i*ring, (i+1)*ring
            faces.append((a+j, a+k, b+k, b+j))
    faces.extend([tuple(reversed(range(ring))), tuple(stations*ring+j for j in range(ring))])
    mesh = bpy.data.meshes.new('Transverse ligament of atlas')
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    for polygon in mesh.polygons:
        polygon.use_smooth = len(polygon.vertices) == 4
    add_surface('Transverse ligament of atlas', mesh, ['Median atlanto-axial joint.g'],
                'Osteon teaching reconstruction fitted to C1 and C2', 'ligaments')

transverse_atlantal_ligament()

for scene in original_scenes:
    bpy.data.scenes.remove(scene)
bpy.data.orphans_purge(do_recursive=True)
derived.unit_settings.system = 'METRIC'
for screen in bpy.data.screens:
    for area in screen.areas:
        if area.type == 'VIEW_3D':
            space = area.spaces.active
            space.region_3d.view_location = Vector((0, 0, .87))
            space.region_3d.view_distance = 2.5
            space.region_3d.view_rotation = (0.7071068, 0.7071068, 0, 0)

bpy.ops.object.select_all(action='DESELECT')
web_names = {r['sourceName'] for r in records if r['asset'] == 'ligaments'}
for obj in layer_objects:
    obj.select_set(obj['zname'] in web_names)
bpy.ops.export_scene.gltf(filepath=str(asset), use_selection=True, export_extras=True,
                        export_draco_mesh_compression_enable=True, export_draco_position_quantization=16)
bpy.ops.object.select_all(action='DESELECT')
bpy.ops.wm.save_as_mainfile(filepath=str(project), compress=True)
if digest(source) != source_hash:
    raise RuntimeError('The source file changed during the export')
manifest.write_text(json.dumps({'sourceSha256': source_hash, 'assetSha256': digest(asset),
    'surfaces': sorted(records, key=lambda r: (r['name'].casefold(), r['side'] or ''))}, indent=2) + '\n', encoding='utf-8')
print('LIGAMENT_EXPORT', len(records), len(web_names), asset.stat().st_size, project, flush=True)

