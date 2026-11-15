"""Build the authored upper-body context for Osteon's separate walking rig.

Use Blender 4.5:
  blender -b --factory-startup --disable-autoexec --python-exit-code 1 \
    --python scripts/blender/build_motion_walk_context.py -- REPO OUTPUT_DIRECTORY

The upper body supplies a neutral anatomical frame and an illustrative swing.
Synchronized walking angles and muscle measurements belong to the leg rig.
"""
import hashlib
import json
import math
import shutil
import struct
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

import bpy
from mathutils import Quaternion, Vector


REPO, WORK = (Path(argument).resolve() for argument in sys.argv[sys.argv.index('--') + 1:])
if WORK.is_relative_to(REPO):
    raise ValueError('Keep the editable .blend and backups outside the repository.')
ASSETS = REPO / 'assets'
SOURCE = ASSETS / 'skeleton.glb'
LANDMARKS = REPO / 'src' / 'landmarks.json'
PROJECT = WORK / 'motion-walk-context.blend'
MODEL = ASSETS / 'motion-walk-context.glb'
META = ASSETS / 'motion-walk-context.json'

# The hip attachment matches the leg project's MotionPelvis neutral location.
PELVIS = (0, .85985, -.004835)
TORSO = (0, .979, -.030)
HEAD = (0, 1.481, -.054)
RIGHT_SHOULDER = (-.167, 1.381, -.030)
RIGHT_ELBOW = (-.219, 1.099, -.034)
LEG_GROUPS = {'Bones of pelvic girdle.g', 'Bones of free part of lower limb.g',
              'Bones of foot.g', 'Tarsal bones.g', 'Metatarsal bones.g', 'Phalanges of foot.g'}
HEAD_GROUPS = {'Bones of cranium.g', 'Extracranial bones of head.g', 'Frontal bone', 'Sphenoid bone',
               'Auditory ossicles.g', 'Anterior teeth.g', 'Posterior teeth.g', 'Nasal cartilages.g'}
SIDES = {'right': 'Right', 'left': 'Left'}


def digest(path):
    with path.open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()


def backup():
    stamp = datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S-%f')
    folder = WORK.parent / 'model-backups' / ('motion-walk-context-' + stamp)
    folder.mkdir(parents=True)
    inputs = [SOURCE, LANDMARKS, ASSETS / 'MODEL-LICENSE.md']
    paths = inputs + [PROJECT, MODEL, META]
    records = []
    for path in paths:
        if not path.is_file():
            if path in inputs:
                raise FileNotFoundError(path)
            continue
        copy = folder / path.name
        shutil.copy2(path, copy)
        sha = digest(path)
        if sha != digest(copy):
            raise RuntimeError(f'Backup checksum mismatch for {path}')
        records.append({'original': str(path), 'file': copy.name, 'sha256': sha, 'bytes': copy.stat().st_size})
    revision = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=REPO, text=True).strip()
    manifest = {'reason': 'Before exporting the Osteon walking upper-body context', 'revision': revision, 'files': records}
    (folder / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
    print('VERIFIED_BACKUP', folder, flush=True)


def to_blender(point):
    x, y, z = point
    return Vector((x, -z, y))


def side_point(point, side):
    x, y, z = point
    return (x, y, z) if side == 'right' else (-x, y, z)


def segment(obj):
    label, group = obj.get('zname', ''), obj.get('zgroup', '')
    if not label or group in LEG_GROUPS or label in {'Sacrum', 'Coccyx'}:
        return None
    if group == 'Bones of free part of upper limb.g':
        side = 'Right' if label.endswith('.r') else 'Left'
        part = 'Shoulder' if label.startswith('Humerus') else 'Elbow'
        return 'MotionWalk' + part + side
    if group in HEAD_GROUPS or label == 'Mandible':
        return 'MotionWalkHead'
    return 'MotionTorso'


def make_group(name, position, parent=None):
    pivot = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(pivot)
    pivot.empty_display_size = .035
    pivot.empty_display_type = 'PLAIN_AXES'
    if parent:
        pivot.parent = parent
        bpy.context.view_layer.update()
        pivot.location = parent.matrix_world.inverted() @ to_blender(position)
    else:
        pivot.location = to_blender(position)
    return pivot


def rig_groups():
    root = make_group('MotionWalkContextRig', PELVIS)
    torso = make_group('MotionTorso', TORSO, root)
    head = make_group('MotionWalkHead', HEAD, torso)
    groups = {obj.name: obj for obj in (root, torso, head)}
    for side, name in SIDES.items():
        shoulder = make_group('MotionWalkShoulder' + name, side_point(RIGHT_SHOULDER, side), torso)
        elbow = make_group('MotionWalkElbow' + name, side_point(RIGHT_ELBOW, side), shoulder)
        groups.update({shoulder.name: shoulder, elbow.name: elbow})
    return groups


def traced_axes():
    pins = json.loads(LANDMARKS.read_text(encoding='utf-8'))
    lateral = Vector(pins['Lateral epicondyle of humerus']['points'][0]['point'])
    medial = Vector(pins['Medial epicondyle of humerus']['points'][0]['point'])
    right = (lateral - medial).normalized()
    # Mirroring an axis of rotation changes the two components transverse to
    # the mirror normal. Positive angle flexes the right and left forearms.
    left = Vector((right.x, -right.y, -right.z))
    return {'torso': [0, 1, 0], 'head': [0, 1, 0],
            'right': {'shoulder': [-1, 0, 0], 'elbow': list(right)},
            'left': {'shoulder': [-1, 0, 0], 'elbow': list(left)}}


def authored_preview(groups, axes):
    # Cycle start is right initial contact. These are restrained teaching poses,
    # expressed as degrees from the source rest pose. The browser can sample
    # the same table on its research-derived lower-limb cycle clock.
    rows = [
        # cycle, torso, head, right shoulder, right elbow, left shoulder, left elbow
        [0.00, -2.5, 2.5, -11, 12, 15, 21],
        [0.25,  0.0, 0.0,   2, 18,  2, 16],
        [0.50,  2.5,-2.5,  15, 21,-11, 12],
        [0.75,  0.0, 0.0,   2, 16,  2, 18],
        [1.00, -2.5, 2.5, -11, 12, 15, 21],
    ]
    channels = [
        ('MotionTorso', axes['torso']), ('MotionWalkHead', axes['head']),
        ('MotionWalkShoulderRight', axes['right']['shoulder']),
        ('MotionWalkElbowRight', axes['right']['elbow']),
        ('MotionWalkShoulderLeft', axes['left']['shoulder']),
        ('MotionWalkElbowLeft', axes['left']['elbow']),
    ]
    for index, (name, row_axis) in enumerate(channels, start=1):
        pivot = groups[name]
        pivot.rotation_mode = 'QUATERNION'
        for row in rows:
            pivot.rotation_quaternion = Quaternion(to_blender(row_axis), math.radians(row[index]))
            pivot.keyframe_insert('rotation_quaternion', frame=60 * row[0])
        pivot.animation_data.action.name = 'illustrative-walk-upper-body'
    return rows


def neutral_context_material():
    material = bpy.data.materials.new('Upper body context')
    material.diffuse_color = (.51, .59, .54, 1)
    material.use_nodes = True
    shader = material.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value = material.diffuse_color
    shader.inputs['Roughness'].default_value = .69
    return material


def main():
    backup()
    original = digest(SOURCE)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(SOURCE))
    anatomy = {}
    for obj in list(bpy.data.objects):
        name = segment(obj) if obj.type == 'MESH' else None
        if name:
            anatomy[obj] = name
        else:
            bpy.data.objects.remove(obj, do_unlink=True)
    groups = rig_groups()
    bpy.context.view_layer.update()
    mat = neutral_context_material()
    for obj, parent_name in anatomy.items():
        world = obj.matrix_world.copy()
        obj.parent = groups[parent_name]
        obj.matrix_world = world
        obj.name = obj['zname']
        obj['motionBone'] = obj.name
        obj.data.materials.clear()
        obj.data.materials.append(mat)

    # Save the source in neutral with an editable, muted preview action per pivot.
    tracked = [obj for obj in groups.values() if obj.name != 'MotionWalkContextRig']
    axes = traced_axes()
    rows = authored_preview(groups, axes)
    for pivot in tracked:
        pivot.animation_data.action.use_fake_user = True
        pivot.animation_data.action = None
        pivot.rotation_quaternion = Quaternion()
    scene = bpy.context.scene
    scene.frame_start, scene.frame_end = 0, 60
    scene.render.fps = 30
    scene.frame_set(0)
    WORK.mkdir(parents=True, exist_ok=True)
    bpy.context.preferences.filepaths.save_version = 0
    bpy.ops.wm.save_as_mainfile(filepath=str(PROJECT), compress=True)
    bpy.ops.export_scene.gltf(filepath=str(MODEL), export_format='GLB',
                              export_extras=True, export_yup=True, export_animations=False,
                              export_draco_mesh_compression_enable=True,
                              export_draco_mesh_compression_level=6)
    with MODEL.open('rb') as stream:
        stream.seek(12)
        length, _ = struct.unpack('<II', stream.read(8))
        asset = json.loads(stream.read(length))
    if len(asset['meshes']) != len(anatomy) or digest(SOURCE) != original:
        raise RuntimeError('Failed upper-body mesh inventory verification')
    metadata = {
        'root': 'MotionWalkContextRig', 'torso': 'MotionTorso', 'head': 'MotionWalkHead', 'pelvisRest': PELVIS,
        'joints': {side: {'shoulder': 'MotionWalkShoulder' + title, 'elbow': 'MotionWalkElbow' + title}
                   for side, title in SIDES.items()},
        'axes': axes,
        'columns': ['phase', 'torso', 'head', 'shoulderRight', 'elbowRight', 'shoulderLeft', 'elbowLeft'],
        'phaseZeroEvent': 'right-initial-contact',
        'previewFrames': rows, 'meshCount': len(anatomy),
        'provenance': 'Authored upper-body motion. The walking study recorded lower-limb motion and EMG.',
    }
    META.write_text(json.dumps(metadata, indent=2) + '\n', encoding='utf-8')
    print('MOTION_WALK_CONTEXT_EXPORTED', len(anatomy), MODEL, META, PROJECT, flush=True)


if __name__ == '__main__':
    main()