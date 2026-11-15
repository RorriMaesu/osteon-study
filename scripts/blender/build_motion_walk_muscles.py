"""Author additive walking muscle surfaces in Blender 4.5.

blender -b --factory-startup --disable-autoexec --python-exit-code 1 \
  --python scripts/blender/build_motion_walk_muscles.py -- REPO OUTPUT_DIRECTORY

The five staged GLBs reuse the unmodified regional atlas surfaces. The browser
retargets motion from its existing lower and upper rigs. Regional blending is a
first-pass teaching deformation. The model does not infer activity or force.
"""
import hashlib
import json
import shutil
import struct
import subprocess
import sys
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

import bpy
from mathutils import Vector
from mathutils.bvhtree import BVHTree


REPO, WORK = (Path(argument).resolve() for argument in sys.argv[sys.argv.index('--') + 1:])
if WORK.is_relative_to(REPO):
    raise ValueError('Store editable files and snapshots outside the repository.')
ASSETS = REPO / 'assets'
ATLAS_PATH = REPO / 'src' / 'muscle-models.json'
LOWER_PATH = ASSETS / 'motion-legs.glb'
UPPER_PATH = ASSETS / 'motion-walk-context.glb'
MODEL_NAME = 'motion-walk-muscles'
PELVIS = 'MotionPelvis'
TORSO = 'MotionTorso'
HEAD = 'MotionWalkHead'
TARGET_TRIANGLES = 3200
SIMPLIFICATION_ERROR = .00045


def digest(path):
    with path.open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()


def glb_json(path):
    with path.open('rb') as stream:
        magic, version, _ = struct.unpack('<4sII', stream.read(12))
        length, kind = struct.unpack('<I4s', stream.read(8))
        if (magic, version, kind) != (b'glTF', 2, b'JSON'):
            raise ValueError('Unexpected GLB header ' + str(path))
        return json.loads(stream.read(length))


def snapshot(inputs, outputs):
    now = datetime.now(timezone.utc)
    root = WORK.parent / 'model-backups' / now.strftime('motion-walk-muscles-%Y%m%d-%H%M%S-%f')
    root.mkdir(parents=True, exist_ok=False)
    files = []
    for path in dict.fromkeys([*inputs, *outputs]):
        row = {'original': str(path), 'existed': path.is_file()}
        if row['existed']:
            prefix = 'staging-' if path.is_relative_to(WORK) else 'source-'
            copy = root / (prefix + path.name)
            shutil.copy2(path, copy)
            row.update(file=copy.name, sha256=digest(path), bytes=path.stat().st_size)
            if digest(copy) != row['sha256']:
                raise RuntimeError('Model backup checksum changed: ' + str(path))
        files.append(row)
    commit = subprocess.check_output(['git', '-C', str(REPO), 'rev-parse', 'HEAD'], text=True).strip()
    (root / 'manifest.json').write_text(json.dumps({
        'created': now.isoformat(), 'git': commit, 'reason': 'Before additive whole-body walking rigs',
        'files': files,
    }, indent=2) + '\n', encoding='utf-8')
    print('VERIFIED_BACKUP', root, flush=True)
    return root


def to_blender(point):
    x, y, z = point
    return Vector((x, -z, y))


def to_web(point):
    return Vector((point.x, point.z, -point.y))


def read_json(path):
    return json.loads(path.read_text(encoding='utf-8'))


def import_meshes(path):
    bpy.ops.import_scene.gltf(filepath=str(path))
    bpy.context.view_layer.update()
    return [mesh for mesh in bpy.context.scene.objects if mesh.type == 'MESH']


def driver_pivots(lower, upper):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(LOWER_PATH))
    bpy.ops.import_scene.gltf(filepath=str(UPPER_PATH))
    bpy.context.view_layer.update()
    legs = [PELVIS, *(joint for side in ('left', 'right') for joint in lower['joints'][side].values())]
    arms = [upper['torso'], upper['head'], *(joint for side in ('left', 'right') for joint in upper['joints'][side].values())]
    bone_positions = {bone.name: rig.matrix_world @ bone.matrix_local.translation for rig in bpy.context.scene.objects
                      if rig.type == 'ARMATURE' for bone in rig.data.bones}
    pivots = {name: bone_positions[name].copy() for name in legs}
    pivots.update({name: bpy.data.objects[name].matrix_world.translation.copy() for name in arms})
    return pivots


def make_receiver(pivots):
    data = bpy.data.armatures.new('Osteon walking surface joints')
    receiver = bpy.data.objects.new('WalkSurfaceRig', data)
    bpy.context.collection.objects.link(receiver)
    for obj in bpy.context.selected_objects:
        obj.select_set(False)
    receiver.select_set(True)
    bpy.context.view_layer.objects.active = receiver
    bpy.ops.object.mode_set(mode='EDIT')
    # The flat receiver accepts independent world-delta transforms from Three.js.
    for driver, pivot in pivots.items():
        name = 'WalkSurface_' + driver
        bone = data.edit_bones.new(name)
        bone.head = pivot
        bone.tail = pivot + Vector((0, 0, .045))
    bpy.ops.object.mode_set(mode='OBJECT')
    return receiver


def step(value, lower, upper):
    t = min(1., max(0., (value-lower)/(upper-lower)))
    return t*t*(3-2*t)


def blend(first, second, amount):
    return {first: 1-amount, second: amount}


def chain(first, middle, last, first_weight, last_weight):
    return {first: first_weight, middle: 1-first_weight-last_weight, last: last_weight}


def arm_rules(part, point, upper):
    side = part['side']
    shoulder, elbow = (upper['joints'][side][joint] for joint in ('shoulder', 'elbow'))
    identity, name = part['id'], part['muscleName']
    x, y = abs(point.x), point.y
    if name == 'Deltoid muscle':
        fraction = 1-step(y, 1.306, 1.395)
        return blend(TORSO, shoulder, fraction)
    if name in {'Supraspinatus muscle', 'Subscapularis muscle', 'Infraspinatus muscle',
                'Teres minor muscle', 'Teres major muscle'}:
        return blend(TORSO, shoulder, step(x, .103, .177))
    if name == 'Coracobrachialis muscle':
        return blend(TORSO, shoulder, 1-step(y, 1.275, 1.372))
    if name == 'Biceps brachii muscle':
        from_torso = step(y, 1.276, 1.396)
        to_forearm = 1-step(y, 1.074, 1.228)
        return chain(TORSO, shoulder, elbow, from_torso, to_forearm)
    if name == 'Triceps brachii muscle':
        to_forearm = 1-step(y, 1.103, 1.23)
        if 'long-head' in identity:
            return chain(TORSO, shoulder, elbow, step(y, 1.285, 1.363), to_forearm)
        return blend(shoulder, elbow, to_forearm)
    if name == 'Brachialis muscle':
        return blend(shoulder, elbow, 1-step(y, 1.072, 1.22))
    if name == 'Brachioradialis muscle':
        return blend(shoulder, elbow, 1-step(y, 1.034, 1.16))
    if name == 'Anconeus muscle':
        return blend(shoulder, elbow, 1-step(y, 1.045, 1.118))
    if 'deep-head-of-pronator' in identity or 'ulnar-head-of' in identity or 'radial-part' in identity:
        return {elbow: 1.}
    if name in {'Pronator teres muscle', 'Flexor carpi radialis', 'Palmaris longus muscle', 'Extensor digitorum',
                'Extensor digiti minimi', 'Extensor carpi radialis longus', 'Extensor carpi radialis brevis', 'Supinator'} \
            or name in {'Flexor carpi ulnaris', 'Flexor digitorum superficialis', 'Extensor carpi ulnaris'} and (
                'humeral' in identity or 'humeroulnar' in identity):
        return blend(shoulder, elbow, 1-step(y, 1.054, 1.108))
    return {elbow: 1.}


def trunk_rules(part, point, upper):
    name = part['muscleName']
    identity = part['id']
    y = point.y
    if name in {'Pectoralis major muscle', 'Latissimus dorsi muscle'}:
        arm = upper['joints'][part['side']]['shoulder']
        return blend(TORSO, arm, step(abs(point.x), .11, .185))
    if any(name.startswith(prefix) for prefix in ('Obliquus inferior capitis', 'Obliquus superior capitis',
                                                  'Rectus posterior', 'Splenius capitis', 'Longissimus capitis',
                                                  'Spinalis capitis')):
        return blend(TORSO, HEAD, step(y, 1.427, 1.551))
    if name == 'Trapezius muscle' and 'Upper' in part['name']:
        return blend(TORSO, HEAD, step(y, 1.445, 1.575))
    if 'lumborum' in name or name in {'Rectus abdominis muscle', 'External abdominal oblique muscle',
                                     'Internal abdominal oblique muscle', 'Transversus abdominis muscle',
                                     'Iliocostalis lumborum muscle', 'Longissimus thoracis muscle',
                                     'Iliocostalis thoracis muscle'}:
        if name in {'Multifidus lumborum muscle', 'Interspinales lumborum muscles',
                    'Ventral parts of lateral intertransversarii lumborum muscles',
                    'Dorsal parts of lateral intertransversarii lumborum muscles'}:
            return {PELVIS: 1.}
        return blend(PELVIS, TORSO, step(y, .915, 1.075))
    if 'pyramidalis' in identity:
        return {PELVIS: 1.}
    return {TORSO: 1.}


def leg_rules(part, point, lower):
    name = part['muscleName']
    identity = part['id']
    chain_joints = lower['joints'][part['side']]
    hip, knee, ankle, patella = (chain_joints[joint] for joint in ('hip', 'knee', 'ankle', 'patella'))
    y, x = point.y, abs(point.x)
    if name in {'Coccygeus muscle', 'Iliococcygeus muscle', 'Pubo-analis muscle',
                'Pubococcygeus muscle', 'External anal sphincter'}:
        return {PELVIS: 1.}
    if name == 'Psoas major':
        return chain(TORSO, PELVIS, hip, step(y, .921, 1.067), 1-step(y, .795, .887))
    if name == 'Iliacus muscle':
        return blend(PELVIS, hip, 1-step(y, .795, .895))
    if name in {'Adductor magnus', 'Adductor longus', 'Adductor brevis', '(Adductor minimus)', 'Pectineus muscle',
                'Gluteus maximus muscle', 'Tensor fasciae latae'}:
        return blend(PELVIS, hip, 1-step(y, .763, .923))
    if name in {'Gluteus medius muscle', 'Gluteus minimus muscle'}:
        return blend(PELVIS, hip, 1-step(y, .844, .956))
    if name in {'Piriformis muscle', 'Quadratus femoris muscle', 'Inferior gemellus muscle',
                'Superior gemellus muscle', 'Obturator internus', 'Obturator externus'}:
        return blend(PELVIS, hip, step(x, .073, .12))
    if name in {'Gracilis muscle', 'Sartorius muscle', 'Biceps femoris muscle', 'Semimembranosus muscle',
                'Semitendinosus muscle'}:
        shin = 1-step(y, .414, .524)
        if 'short-head' in identity:
            return blend(hip, knee, shin)
        return chain(PELVIS, hip, knee, step(y, .761, .856), shin)
    if name in {'Rectus femoris muscle', 'Vastus intermedius muscle', 'Vastus medialis muscle'}:
        thigh = step(y, .458, .579)
        shin = 1-step(y, .399, .448)
        weights = chain(hip, patella, knee, thigh, shin)
        if name == 'Rectus femoris muscle':
            pelvis = thigh * step(y, .794, .875)
            weights[PELVIS], weights[hip] = pelvis, thigh-pelvis
        return weights
    if name == 'Gastrocnemius muscle' or name == 'Popliteus muscle':
        return blend(knee, hip, step(y, .438, .484))
    if name == 'Plantaris muscle':
        return chain(hip, knee, ankle, step(y, .438, .494), 1-step(y, .069, .125))
    if name in {'Extensor digitorum longus', 'Fibularis tertius muscle', 'Extensor hallucis longus',
                'Fibularis longus muscle', 'Fibularis brevis muscle', 'Flexor digitorum longus',
                'Tibialis posterior muscle', 'Flexor hallucis longus'}:
        return blend(ankle, knee, step(y, .068, .132))
    if name == 'Soleus muscle':
        # This source belly ends above the ankle and has no Achilles vertices.
        return {knee: 1.}
    return {ankle: 1.}


def head_rules(part, point):
    name = part['muscleName']
    if name in {'Sternocleidomastoid muscle', 'Longus capitis muscle', 'Omohyoid muscle', 'Sternohyoid muscle',
                'Sternothyroid muscle'} or name.startswith('Scalenus '):
        return blend(TORSO, HEAD, step(point.y, 1.42, 1.544))
    if name in {'Longus colli muscle', 'Thyrohyoid muscle'}:
        return {TORSO: 1.}
    return {HEAD: 1.}


def weights_at(part, point, lower, upper):
    region = part['region']
    if region in {'shoulder-arm', 'forearm-hand'}:
        return arm_rules(part, point, upper)
    if region == 'trunk-back':
        return trunk_rules(part, point, upper)
    if region == 'pelvis-leg-foot':
        return leg_rules(part, point, lower)
    return head_rules(part, point)


def joints_for_region(part):
    region, side, name = part['region'], part['side'], part['muscleName']
    if region in {'shoulder-arm', 'forearm-hand'}:
        area = f'{side}-arm'
        return [area, 'trunk'] if region == 'shoulder-arm' and name not in {
            'Brachialis muscle', 'Brachioradialis muscle', 'Anconeus muscle'} else [area]
    if region == 'head-neck':
        return ['head']
    if region == 'trunk-back':
        return ['trunk', f'{side}-arm'] if name in {'Latissimus dorsi muscle', 'Pectoralis major muscle'} else ['trunk']
    if name in {'Coccygeus muscle', 'Iliococcygeus muscle', 'Pubo-analis muscle',
                'Pubococcygeus muscle', 'External anal sphincter'}:
        return ['pelvis']
    return [f'{side}-leg']


def bind(obj, part, receiver, lower, upper):
    groups, found = {}, set()
    world = obj.matrix_world.copy()
    obj.parent = receiver
    obj.matrix_world = world
    for vertex in obj.data.vertices:
        amounts = weights_at(part, to_web(world @ vertex.co), lower, upper)
        if abs(sum(amounts.values())-1.) > 1e-5 or min(amounts.values()) < -1e-5:
            raise ValueError('Invalid joint interpolation for ' + part['id'])
        for driver, weight in amounts.items():
            if weight > .000001:
                if driver not in groups:
                    groups[driver] = obj.vertex_groups.new(name='WalkSurface_' + driver)
                groups[driver].add([vertex.index], weight, 'REPLACE')
                found.add(driver)
    obj.name = 'Walk_' + part['id']
    role = 'guided-blend' if len(found) > 1 else 'segment-follow'
    modifier = obj.modifiers.new(name='Walk joint envelopes', type='ARMATURE')
    modifier.object = receiver
    obj['muscleId'] = part['id']
    obj['motionPart'] = part.get('geometryReview', {}).get('displayName', part['name'])
    obj['motionSide'] = part['side']
    obj['walkMuscleGroup'] = part['muscleName']
    obj['walkRegion'] = part['region']
    obj['walkSegment'] = joints_for_region(part)[0]
    obj['walkSegments'] = joints_for_region(part)
    obj['walkDeformation'] = role
    obj['walkDrivers'] = sorted(found)
    obj['walkEvidence'] = 'anatomical-context'
    return role


def mesh_ids(document):
    return [node.get('extras', {}).get('muscleId') for node in document.get('nodes', []) if 'mesh' in node]


def surface_sample(obj):
    world = obj.matrix_world.copy()
    points = [world @ vertex.co for vertex in obj.data.vertices]
    faces = [tuple(face.vertices) for face in obj.data.polygons]
    return points, faces


def surface_error(original, reduced):
    def error(source, target):
        points, faces = target
        tree = BVHTree.FromPolygons(points, faces, all_triangles=True)
        # Include far-end vertices so attachment silhouettes get checked.
        vertices = source[0]
        samples = vertices[::max(1, len(vertices)//320)]
        samples.extend(min(vertices, key=lambda v: direction*v[axis]) for axis in range(3) for direction in (-1, 1))
        return max(tree.find_nearest(point)[3] for point in samples)

    return max(error(original, reduced), error(reduced, original))


def simplify(obj):
    original = obj.data
    if len(original.polygons) <= TARGET_TRIANGLES:
        return None
    source = surface_sample(obj)
    ratio = TARGET_TRIANGLES / len(original.polygons)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    while ratio < 1:
        obj.data = original.copy()
        modifier = obj.modifiers.new('Walk view mesh density', 'DECIMATE')
        modifier.ratio = ratio
        modifier.use_collapse_triangulate = True
        bpy.ops.object.modifier_apply(modifier=modifier.name)
        error = surface_error(source, surface_sample(obj))
        if error <= SIMPLIFICATION_ERROR:
            if not original.users:
                bpy.data.meshes.remove(original)
            return error
        rejected = obj.data
        obj.data = original
        if not rejected.users:
            bpy.data.meshes.remove(rejected)
        ratio *= 1.4
    return None

def build_region(region, source, parts, pivots, lower, upper):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    meshes = import_meshes(source)
    chosen = {}
    for mesh in meshes:
        identity = mesh.get('muscleId')
        if identity in parts:
            if identity in chosen:
                raise RuntimeError('Duplicate regional muscle ' + identity)
            chosen[identity] = mesh
            world = mesh.matrix_world.copy()
            mesh.parent = None
            mesh.matrix_world = world
    if set(chosen) != set(parts):
        raise RuntimeError('Atlas has no unique surface for ' + repr(sorted(set(parts)-set(chosen))))
    for obj in list(bpy.context.scene.objects):
        if obj not in chosen.values():
            bpy.data.objects.remove(obj, do_unlink=True)
    simplified = [error for obj in chosen.values() if (error := simplify(obj)) is not None]
    receiver = make_receiver(pivots)
    results = Counter(bind(chosen[identity], part, receiver, lower, upper) for identity, part in parts.items())
    file = WORK / f'{MODEL_NAME}-{region}.glb'
    blend_path = WORK / f'{MODEL_NAME}-{region}.blend'
    bpy.context.preferences.filepaths.save_version = 0
    bpy.ops.wm.save_as_mainfile(filepath=str(blend_path), compress=True)
    bpy.ops.export_scene.gltf(filepath=str(file), export_format='GLB', export_extras=True,
                              export_yup=True, export_animations=False,
                              export_draco_mesh_compression_enable=True,
                              export_draco_mesh_compression_level=6)
    document = glb_json(file)
    if sorted(mesh_ids(document)) != sorted(parts):
        raise RuntimeError('GLB changed the region muscle component census ' + region)
    if any('skin' not in node for node in document['nodes'] if 'mesh' in node):
        raise RuntimeError('GLB contains an unbound surface ' + region)
    triangles = sum(document['accessors'][primitive['indices']]['count']//3
                    for mesh in document['meshes'] for primitive in mesh['primitives'])
    print('STAGED_WALK_REGION', region, len(parts), dict(results), triangles, file.stat().st_size, flush=True)
    return {'file': file.name, 'sha256': digest(file), 'bytes': file.stat().st_size,
            'parts': len(parts), 'deformation': dict(results), 'triangles': triangles,
            'simplifiedSurfaces': len(simplified),
            'maximumSampledSimplificationErrorMillimeters': round(1000*max(simplified, default=0), 4)}


def main():
    atlas = read_json(ATLAS_PATH)
    lower_meta, upper_meta = LOWER_PATH.with_suffix('.json'), UPPER_PATH.with_suffix('.json')
    lower, upper = read_json(lower_meta), read_json(upper_meta)
    inputs = [ATLAS_PATH, LOWER_PATH, UPPER_PATH, lower_meta, upper_meta, ASSETS / 'MODEL-LICENSE.md',
              *(ASSETS / item['file'] for item in atlas['assets'].values())]
    outputs = [*(WORK / f'{MODEL_NAME}-{region}.{suffix}' for region in atlas['assets'] for suffix in ('glb', 'blend')),
              WORK / f'{MODEL_NAME}.json',
               *(ASSETS / f'{MODEL_NAME}-{region}.glb' for region in atlas['assets']),
               ASSETS / f'{MODEL_NAME}.json']
    WORK.mkdir(parents=True, exist_ok=True)
    backup = snapshot(inputs, outputs)
    source_hashes = {path.name: digest(path) for path in inputs}
    atlas_muscles = {part['id']: part for part in atlas['components'] if part['kind'] == 'muscle' and not part.get('retired')}
    retained = tuple(sorted(node['extras']['muscleId'] for node in glb_json(LOWER_PATH)['nodes']
                            if 'mesh' in node and node.get('extras', {}).get('motionMuscle')))
    if len(set(retained)) != 8 or not set(retained).issubset(atlas_muscles):
        raise RuntimeError('An exact set of eight recorded gait surfaces must remain available in the base rig.')
    pivots = driver_pivots(lower, upper)
    regions = {}
    for region, source in atlas['assets'].items():
        parts = {identity: part for identity, part in atlas_muscles.items()
                 if part['region'] == region and identity not in retained}
        if digest(ASSETS / source['file']) != source['sha256']:
            raise RuntimeError('Source atlas hash disagrees with its manifest.')
        regions[region] = build_region(region, ASSETS / source['file'], parts, pivots, lower, upper)
    if source_hashes != {path.name: digest(path) for path in inputs}:
        raise RuntimeError('A source model changed while exporting.')
    manifest = {
        'schema': 1,
        'description': 'Existing atlas muscles follow the Osteon whole-body walk. Joint blends approximate regional deformation.',
        'activity': 'Existing recorded gait channels are retained. Additive muscles have no recorded activity.',
        'restFrame': 'Neutral Osteon atlas coordinates, metres, +Y up',
        'retargeting': 'Flat receiver bones apply the live driver world transform relative to its rest frame.',
        'drivers': {name: 'WalkSurface_' + name for name in pivots},
        'driverRest': {name: list(to_web(pivot)) for name, pivot in pivots.items()},
        'walkMeshDensity': {'targetTrianglesPerLargeSurface': TARGET_TRIANGLES,
                            'sampledErrorLimitMillimeters': 1000*SIMPLIFICATION_ERROR},
        'baseMuscleIds': retained,
        'totalMuscleSurfaces': len(atlas_muscles),
        'regions': regions,
        'inputs': source_hashes,
    }
    (WORK / f'{MODEL_NAME}.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
    print('WALK_MUSCLES_EXPORTED', WORK, backup, len(atlas_muscles), flush=True)


if __name__ == '__main__':
    main()
