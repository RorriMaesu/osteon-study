"""Build the Osteon lymph-node overlay in Blender 4.5 from the pinned source.

Open Startup.blend with --disable-autoexec and pass the task root after --.
Pass --pilot after the root for the initial four basins.
"""
import hashlib
import json
import re
import shutil
import struct
import subprocess
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path

import bpy
from mathutils import Vector
from mathutils.bvhtree import BVHTree

args = sys.argv[sys.argv.index('--') + 1:]
root = Path(args[0]).resolve()
pilot = '--pilot' in args
repo = root / 'outputs/osteon-study'
assets = repo / 'assets'
project = root / 'outputs/osteon-models/lymph-node-atlas.blend'
manifest = repo / 'src/lymph-node-models.json'
source = Path(bpy.data.filepath)
source_sha = '9f08a17ea0115fed80b2a73ecdf0a1bc2ab2f6956f37c593ce23d513ea35afcd'

def sha(path):
    with path.open('rb') as file:
        return hashlib.file_digest(file, 'sha256').hexdigest()

if sha(source) != source_sha:
    raise RuntimeError('The input does not match the pinned Z-Anatomy project')

existing = [p for p in (project, manifest, *assets.glob('lymph-nodes-*.glb')) if p.exists()]
if existing:
    stamp = datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S-%f')
    backup = root / 'outputs/model-backups' / ('lymph-nodes-' + stamp)
    backup.mkdir(parents=True)
    copies = []
    for path in existing:
        copy = backup / path.name
        shutil.copy2(path, copy)
        digest = sha(path)
        if sha(copy) != digest:
            raise RuntimeError('Backup verification failed for ' + str(path))
        copies.append(dict(original=str(path), file=copy.name, sha256=digest))
    head = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=repo, text=True).strip()
    (backup / 'manifest.json').write_text(json.dumps(dict(git=head, files=copies), indent=2))
    print('VERIFIED_PRE_EXPORT', backup, flush=True)

# Related structures and the largest acceptable center-to-surface distance (mm)
# for a reference check. These are coarse screening limits, not population norms.
checks = {
    'Jugulodigastric node': (('Internal jugular vein.*',), 14, 'Upper deep cervical chain, along the internal jugular vein near the posterior belly of digastric. Receives drainage from the tonsillar region and pharynx.'),
    'Anterior inferior jugular nodes': (('Internal jugular vein.*',), 14, 'Lower deep cervical chain, adjacent to the internal jugular vein. Receives lymph from other neck groups and nearby structures.'),
    'Inferior deep lateral cervical nodes': (('Internal jugular vein.*',), 16, 'Lower deep cervical chain along the internal jugular vein. Receives lymph from other head and neck nodes.'),
    'Anterior axillary nodes': (('Pectoralis minor muscle.*', 'Lateral thoracic artery.*'), 12, 'Pectoral group along the lower border of pectoralis minor. Receives much of the lymph from the breast and anterior thoracic wall.'),
    'Superolateral superficial inguinal nodes': (('Inguinal ligament.*',), 12, 'Lateral part of the superficial groin chain, immediately below the inguinal ligament. Receives lymph from nearby superficial territories including the lower abdominal wall.'),
    'Superomedial superficial inguinal nodes': (('Inguinal ligament.*',), 12, 'Medial part of the superficial groin chain, below the inguinal ligament. Receives lymph from adjacent superficial regions including part of the external genitalia.'),
    'Deep popliteal nodes': (('Popliteal vein.*', 'Popliteal artery.*'), 14, 'Deep in the popliteal fossa, near the popliteal vessels. Receives deep drainage from the leg and foot.'),
    'Superficial popliteal nodes': (('Small saphenous vein.*',), 12, 'Superficial group near the end of the small saphenous vein behind the knee. It can receive superficial drainage from the lateral foot and posterolateral leg.'),
    'Inferior tracheobronchial nodes': (('Trachea', 'Left main bronchus', 'Right main bronchus'), 18, 'Subcarinal group near the tracheal bifurcation and between the main bronchi. Receives lymph from the bronchopulmonary pathways.'),
    'Paratracheal thoracic nodes': (('Trachea',), 14, 'Thoracic chain along the trachea. Receives lymph from bronchopulmonary and mediastinal pathways.'),
    'Central superior mesenteric nodes': (('Superior mesenteric artery', 'Superior mesenteric vein'), 15, 'Along the proximal superior mesenteric vessels. Receives lymph from more peripheral mesenteric groups that drain the midgut.'),
    'Lateral aortic nodes': (('Abdominal aorta',), 20, 'Lumbar group lateral to the abdominal aorta. Receives lymph from nearby deep structures and ascending iliac pathways.'),
    'Intermediate external iliac nodes': (('External iliac vein.*', 'External iliac artery.*'), 18, 'Part of the chain along the external iliac vessels. Receives deep inguinal and pelvic drainage.'),
    'Medial external iliac nodes': (('External iliac vein.*',), 18, 'Medial part of the chain along the external iliac vessels. Receives deep inguinal and pelvic drainage.'),
    'Pre-auricular nodes': (('Superficial temporal artery.*',), 18, 'In front of the ear near the superficial temporal vessels. Receives lymph from parts of the temporal scalp, lateral eyelids, and external ear.'),
    'Superficial parotid nodes': (('Parotid gland.*',), 16, 'Superficial to the parotid gland near the ear. Receives lymph from nearby superficial areas of the face and scalp.'),
    'Occipital nodes': (('Occipital artery.*',), 20, 'At the back of the head near the occipital vessels. Receives lymph from the posterior scalp.'),
    'Submandibular nodes': (('Submandibular gland.*',), 16, 'In the submandibular region below the jaw. Receives lymph from parts of the face and anterior oral cavity.'),
}
pilot_names = set(list(checks)[:8])
hold = {
    'Apical axillary nodes': 'The source group is too far posterior to the axillary vessel corridor for an apical teaching target.',
    'Central axillary nodes': 'The source group is too far posterior to the axillary vessel corridor for the central axillary fat compartment.',
    'Lateral axillary nodes': 'The source group lies posterior to the axillary vein and needs a refit along the humeral drainage corridor.',
    'Proximal deep inguinal node': 'The source mesh meets the great saphenous vein. The femoral-canal placement needs a separate refit.',
    'Inferior superficial inguinal nodes': 'The source group approaches the deep femoral vessel compartment. The superficial fascial location needs review.',
    'Intrapulmonary nodes': 'Distal airway branches are needed to distinguish the modeled group from hilar and interlobar nodes.',
}
alias = {'Bucinator node': 'Buccinator node', 'Juxta-oesophageal nodes': 'Paraesophageal nodes',
         'Coeliac nodes': 'Celiac nodes', 'Appendicular nodes': 'Appendiceal nodes'}
reference_names = {
    'Internal jugular vein', 'Sternocleidomastoid muscle', 'Posterior belly of digastric muscle',
    'Pectoralis minor muscle', 'Axillary vein', 'Axillary artery', 'Lateral thoracic artery',
    'Inguinal ligament', 'Femoral vein', 'Great saphenous vein', 'Popliteal vein', 'Popliteal artery',
    'Small saphenous vein', 'External iliac vein', 'External iliac artery', 'Common iliac vein',
    'Internal iliac vein', 'Abdominal aorta', 'Inferior vena cava (abdominal part)',
    'Superior mesenteric artery', 'Superior mesenteric vein', 'Inferior mesenteric artery',
    'Trachea', 'Left main bronchus', 'Right main bronchus', 'Coeliac trunk', 'Spleen',
    'Occipital artery', 'Superficial temporal artery', 'Parotid gland', 'Submandibular gland',
    'Urinary bladder', 'Rectum',
}

def bare(name):
    return re.sub(r'\.[lr]$', '', name)

def parents_of(obj):
    result = []
    while obj.parent:
        obj = obj.parent
        result.append(obj.name)
    return result

def scope(name, ancestry):
    trail = ' '.join(ancestry)
    if 'Lymph nodes of head.g' in ancestry:
        return 'head', ['skull'], 'Axial'
    if 'Lymph nodes of neck.g' in ancestry:
        return 'neck', ['neck', 'skull'] if re.search(r'Submandibular|Submental|Retropharyngeal', name) else ['neck'], 'Axial'
    if 'Lymph nodes of upper limb.g' in ancestry:
        local = ['arm', 'forearm'] if re.search(r'Cubital|Supratrochlear', name) else ['shoulder', 'arm']
        return 'upper-limb', local, 'Appendicular'
    if 'Thoracic lymph nodes.g' in ancestry:
        return 'thorax', ['thorax', 'thoracic-spine'], 'Axial'
    if 'Abdominal lymph nodes.g' in ancestry:
        local = ['pelvis', 'lower-back'] if 'Inferior epigastric' in name else ['lower-back']
        return 'abdomen', local, 'Axial'
    if 'Pelvic lymph nodes.g' in ancestry:
        return 'pelvis', ['pelvis', 'lower-back'], 'Axial'
    if 'Lymph nodes of lower limb.g' in ancestry:
        if 'Inguinal nodes.g' in trail:
            local = ['pelvis', 'thigh']
        elif 'Popliteal nodes.g' in trail:
            local = ['knee', 'leg', 'thigh']
        else:
            local = ['leg', 'knee']
        return 'lower-limb', local, 'Appendicular'
    raise ValueError('Unclassified node: ' + name)

def tree(mesh):
    return BVHTree.FromPolygons([v.co for v in mesh.vertices], [list(p.vertices) for p in mesh.polygons])

def mesh_bounds(mesh):
    return [Vector([f(v.co[i] for v in mesh.vertices) for i in range(3)]) for f in (min, max)]

def round_point(point):
    return [round(v, 7) for v in point]

def web(point):
    return round_point((point.x, point.z, -point.y))

def evaluated_surface(obj, deps):
    evaluated = obj.evaluated_get(deps)
    surface = bpy.data.meshes.new_from_object(evaluated, depsgraph=deps)
    surface.transform(evaluated.matrix_world)
    return surface

def collection(name):
    coll = bpy.data.collections.new(name)
    scene.collection.children.link(coll)
    return coll

def add(name, mesh, coll):
    obj = bpy.data.objects.new(name, mesh)
    coll.objects.link(obj)
    return obj

def paint(mesh, color):
    mesh.materials.clear()
    mesh.materials.append(color)
    for polygon in mesh.polygons:
        polygon.material_index = 0

def material(name, color):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1)
    return mat

# Read exact adult web bones and replacements as context. Normalize historical
# empty glTF scenes in a temporary file for Blender 4.5's importer.
def import_asset(name, temporary):
    path = assets / (name + '.glb')
    previous = set(scene.objects)
    if name == 'landmark-details':
        raw = path.read_bytes()
        length = struct.unpack_from('<I', raw, 12)[0]
        data = json.loads(raw[20:20 + length])
        for item in data['scenes']:
            if item.get('nodes') is None:
                item['nodes'] = []
        chunk = json.dumps(data, separators=(',', ':')).encode()
        chunk += b' ' * (-len(chunk) % 4)
        body = struct.pack('<II', len(chunk), 0x4e4f534a) + chunk + raw[20 + length:]
        path = temporary / path.name
        path.write_bytes(struct.pack('<III', 0x46546c67, 2, len(body) + 12) + body)
    bpy.ops.import_scene.gltf(filepath=str(path))
    bpy.context.view_layer.update()
    return set(scene.objects) - previous

def overlaps(a, b):
    return all(a[0][i] <= b[1][i] and b[0][i] <= a[1][i] for i in range(3))

def inside(point, bvh):
    # Signed nearest-surface distance, confirmed by ray parity along two axes.
    surface, normal, _, distance = bvh.find_nearest(point)
    if surface is None or distance < .00035 or (point - surface).dot(normal) >= 0:
        return False
    for direction in (Vector((1, .16, .31)).normalized(), Vector((.23, -.13, 1)).normalized()):
        position, crossings = point, 0
        while crossings < 24:
            hit, _, _, _ = bvh.ray_cast(position, direction, 2)
            if hit is None:
                break
            crossings += 1
            position = hit + direction * .000015
        if crossings % 2 == 0:
            return False
    return True

def penetration(mesh, bounds, candidates):
    sample = list(mesh.vertices)[::max(1, len(mesh.vertices) // 360)]
    hits = []
    for name, (other, bvh) in candidates.items():
        if not overlaps(bounds, other):
            continue
        share = sum(inside(v.co, bvh) for v in sample) / len(sample)
        if share >= .24:
            hits.append((name, round(share, 2)))
    return sorted(hits, key=lambda hit: -hit[1])

source_scenes = list(bpy.data.scenes)
source_objects = list(bpy.context.scene.objects)
depsgraph = bpy.context.evaluated_depsgraph_get()
scene = bpy.data.scenes.new('Osteon | Lymph-node atlas')
anatomical = collection('Lymph nodes | Source-aligned surfaces')
withheld = collection('Lymph nodes | Withheld for refit')
ref_collection = collection('Context | Vessels, muscles and organs')
context = collection('Context | Adult Osteon skeleton')
node_mat = material('Lymph nodes | Turquoise', (.04, .62, .43))
ref_mat = material('Alignment reference | Slate', (.23, .39, .6))
withheld_mat = material('Needs a placement review | Amber', (.75, .38, .10))

refs = {}
for obj in source_objects:
    if obj.type not in ('MESH', 'CURVE') or bare(obj.name) not in reference_names:
        continue
    mesh = evaluated_surface(obj, depsgraph)
    if not mesh.polygons:
        continue
    paint(mesh, ref_mat)
    add('Reference | ' + obj.name, mesh, ref_collection)
    refs[obj.name] = (mesh_bounds(mesh), tree(mesh))

surfaces = []
for obj in sorted(bpy.data.collections['6: Lymphoid organs'].all_objects, key=lambda item: item.name):
    if obj.type != 'MESH' or not re.search(r'\bnodes?\b', obj.name, re.I):
        continue
    mesh = evaluated_surface(obj, depsgraph)
    if len(mesh.polygons) < 4:
        continue
    name = bare(obj.name).strip('()')
    if pilot and name not in pilot_names:
        continue
    surfaces.append((obj.name, name, parents_of(obj), mesh))

bpy.context.window.scene = scene
with tempfile.TemporaryDirectory(dir=project.parent) as directory:
    temporary = Path(directory)
    imported = import_asset('skeleton', temporary)
    bones = {obj.get('zname', obj.name): obj for obj in imported if obj.type == 'MESH'}
    details = import_asset('landmark-details', temporary)
    for obj in details:
        if obj.type != 'MESH' or not obj.get('replacementAnatomy'):
            continue
        name = obj.get('zname')
        if name in bones:
            bpy.data.objects.remove(bones[name], do_unlink=True)
        copy = obj.copy()
        copy.parent = None
        copy.matrix_world = obj.matrix_world.copy()
        context.objects.link(copy)
        bones[name] = copy
    for obj in details:
        bpy.data.objects.remove(obj, do_unlink=True)
    bone_meshes = {}
    for name, obj in bones.items():
        for coll in list(obj.users_collection):
            if coll != context:
                coll.objects.unlink(obj)
        if context not in obj.users_collection:
            context.objects.link(obj)
        if re.search(r'tooth|incisor|molar|canine|cartilage', name, re.I):
            continue
        mesh = obj.data.copy()
        mesh.transform(obj.matrix_world)
        bone_meshes[name] = (mesh_bounds(mesh), tree(mesh))
        bpy.data.meshes.remove(mesh)

    records, objects = [], {}
    region_collections = {}
    for key, name, ancestry, mesh in surfaces:
        bucket, areas, division = scope(name, ancestry)
        side = key[-1] if re.search(r'\.[lr]$', key) else None
        bounds = mesh_bounds(mesh)
        center = (bounds[0] + bounds[1]) / 2
        if side and center.x * (1 if side == 'l' else -1) <= 0:
            raise RuntimeError('Unexpected modeled side for ' + key)
        used, note = [], hold.get(name)
        if name in checks:
            patterns, maximum, cue = checks[name]
            names = [p.replace('*', side) if side else p for p in patterns]
            for ref in names:
                if ref not in refs:
                    continue
                _, _, _, distance = refs[ref][1].find_nearest(center)
                if distance is not None:
                    used.append(dict(name=ref, centerToSurfaceMm=round(distance * 1000, 1)))
            if not used or min(ref['centerToSurfaceMm'] for ref in used) > maximum:
                note = 'The source position did not pass the adjacent-structure check.'
        else:
            cue = ''
        bone_hits = penetration(mesh, bounds, bone_meshes)
        if bone_hits:
            note = 'The mesh substantially intersects the modeled ' + bone_hits[0][0] + '.'
        if not note and used:
            hits = penetration(mesh, bounds, {ref['name']: refs[ref['name']] for ref in used})
            if hits:
                note = 'The mesh substantially intersects the modeled ' + hits[0][0] + '.'
        status = 'withheld' if note else 'landmark-checked' if used else 'source-aligned'
        if not note and bucket not in region_collections:
            coll = bpy.data.collections.new('Lymph nodes | ' + bucket)
            anatomical.children.link(coll)
            region_collections[bucket] = coll
        obj = add('Node | ' + key, mesh, withheld if note else region_collections[bucket])
        obj['lymphNodeKey'] = key
        obj['reviewStatus'] = status
        paint(mesh, withheld_mat if note else node_mat)
        if not note:
            objects[key] = obj
        overview = not note and (status == 'landmark-checked' or bool(re.match(
            r'Mastoid|Occipital|Submandibular|Supraclavicular|Parasternal|Coeliac|Obturator|Cubital', name)))
        records.append(dict(key=key, name=alias.get(name, name), side=side, bucket=bucket, areas=areas,
                            division=division, status=status, reason=note, cue=cue, references=used,
                            faces=len(mesh.polygons), bounds=[web(Vector((bounds[0].x, bounds[1].y, bounds[0].z))), web(Vector((bounds[1].x, bounds[0].y, bounds[1].z)))],
                            overview=overview))

    if len(records) != (16 if pilot else 158):
        raise RuntimeError('Unexpected source mesh count: ' + str(len(records)))
    if not objects: raise RuntimeError('No node surface passed export checks')
    files, staged = {}, {}
    for bucket in ['overview', *sorted({r['bucket'] for r in records if r['status'] != 'withheld'})]:
        bpy.ops.object.select_all(action='DESELECT')
        selected = [r for r in records if r['overview']] if bucket == 'overview' else [
            r for r in records if r['bucket'] == bucket and r['status'] != 'withheld']
        for record in selected:
            objects[record['key']].select_set(True)
        filename = 'lymph-nodes-' + bucket + '.glb'
        path = temporary / filename
        bpy.ops.export_scene.gltf(filepath=str(path), use_selection=True, export_extras=True,
                                  export_materials='NONE', export_normals=True,
                                  export_draco_mesh_compression_enable=True,
                                  export_draco_position_quantization=16)
        files[bucket] = dict(sha256=sha(path), bytes=path.stat().st_size)
        staged[path] = assets / filename
    bpy.ops.object.select_all(action='DESELECT')
    ref_collection.hide_viewport = ref_collection.hide_render = True
    withheld.hide_viewport = withheld.hide_render = True
    for original in source_scenes:
        bpy.data.scenes.remove(original)
    for block in list(bpy.data.texts):
        if not block.library:
            bpy.data.texts.remove(block, do_unlink=True)
    bpy.data.orphans_purge(do_recursive=True)
    scene.unit_settings.system = 'METRIC'
    for screen in bpy.data.screens:
        for area in screen.areas:
            if area.type == 'VIEW_3D':
                space = area.spaces.active
                space.region_3d.view_location = Vector((0, 0, .92))
                space.region_3d.view_distance = 2.3
                space.region_3d.view_rotation = (.7071068, .7071068, 0, 0)
                space.shading.color_type = 'MATERIAL'
    bpy.context.preferences.filepaths.save_version = 0
    path = temporary / project.name
    bpy.ops.wm.save_as_mainfile(filepath=str(path), compress=True)
    staged[path] = project
    path = temporary / manifest.name
    path.write_text(json.dumps(dict(schema=1, sourceSha256=source_sha, phase='pilot' if pilot else 'regional',
                                    files=files, structures=records), separators=(',', ':')) + '\n', encoding='utf-8')
    staged[path] = manifest
    for path, target in staged.items():
        path.replace(target)
    print('NODES_EXPORTED', len(records), len(objects), sum(r['status'] == 'landmark-checked' for r in records),
          json.dumps([r['key'] for r in records if r['status'] == 'withheld']), flush=True)
