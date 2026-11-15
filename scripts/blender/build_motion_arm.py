"""Build a Motion Lab arm with Blender 4.5 and existing Osteon anatomy.

Run from any directory:
  blender -b --factory-startup --disable-autoexec --python-exit-code 1 \
    --python scripts/blender/build_motion_arm.py -- REPO OUTPUT_DIRECTORY [right|left]

The output directory must be outside the repository. It contains the editable
.blend and a dated, SHA-256-verified backup from before every run. The small GLB
and browser mapping go in the repository's assets directory.
"""
import hashlib
import json
import math
import re
import shutil
import struct
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

import bpy
from mathutils import Quaternion, Vector


arguments = sys.argv[sys.argv.index('--') + 1:]
REPO, WORK = (Path(argument).resolve() for argument in arguments[:2])
SIDE = arguments[2] if len(arguments) > 2 else 'right'
if SIDE not in {'right', 'left'}:
    raise ValueError('Choose right or left as the arm profile.')
if WORK.is_relative_to(REPO):
    raise ValueError('Keep the editable .blend and backups outside the repository.')
ASSETS = REPO / 'assets'
STEM = 'motion-arm' if SIDE == 'right' else 'motion-arm-left'
PROJECT = WORK / (STEM + '.blend')
MODEL = ASSETS / (STEM + '.glb')
META = ASSETS / (STEM + '.json')
SKELETON = ASSETS / 'skeleton.glb'
ARM = ASSETS / 'muscles-shoulder-arm.glb'
FOREARM = ASSETS / 'muscles-forearm-hand.glb'
LANDMARKS = REPO / 'src' / 'landmarks.json'
MUSCLE_PARTS_RIGHT = {
    'muscle-long-head-of-biceps-brachii-r': ('biceps-brachii', 'Biceps brachii', 'Long head of biceps brachii'),
    'muscle-short-head-of-biceps-brachii-r': ('biceps-brachii', 'Biceps brachii', 'Short head of biceps brachii'),
    'muscle-brachialis-muscle-r': ('brachialis', 'Brachialis', 'Brachialis'),
    'muscle-brachioradialis-muscle-r': ('brachioradialis', 'Brachioradialis', 'Brachioradialis'),
    'muscle-medial-head-of-triceps-brachii-r': ('triceps-brachii', 'Triceps brachii', 'Medial head of triceps brachii'),
    'muscle-lateral-head-of-triceps-brachii-r': ('triceps-brachii', 'Triceps brachii', 'Lateral head of triceps brachii'),
    'muscle-long-head-of-triceps-brachii-r': ('triceps-brachii', 'Triceps brachii', 'Long head of triceps brachii'),
    'muscle-anconeus-muscle-r': ('anconeus', 'Anconeus', 'Anconeus'),
}

MUSCLE_PARTS = {identity[:-1] + SIDE[0]: part for identity, part in MUSCLE_PARTS_RIGHT.items()}


def side_point(point):
    x, y, z = point
    return ((-x if SIDE == 'left' else x), y, z)


# The atlas records bilaterally mirrored meshes from the same neutral alignment.
# All coordinates below are written in the source glTF's y-up frame. The shoulder
# is inside the humeral head. The elbow center and line were chosen from the
# source distal humerus and compared with the epicondyle and joint surface pins.
SHOULDER = side_point((-0.167, 1.381, -0.030))
ELBOW = side_point((-0.219, 1.099, -0.034))
WRIST = side_point((-0.260, 0.857, 0.017))
ELBOW_LIMIT = 115
FPS = 30
CURL_KEYS = ((0, 10), (48, 100), (72, 100), (120, 10))
ANCONEUS_SOURCE = 'https://pubmed.ncbi.nlm.nih.gov/24060388/'
ANCONEUS_ATLAS_REFERENCE = 'https://pmc.ncbi.nlm.nih.gov/articles/PMC13398567/'


def digest(path):
    with path.open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()


def backup():
    stamp = datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S-%f')
    archive = WORK.parent / 'model-backups' / (STEM + '-' + stamp)
    archive.mkdir(parents=True)
    paths = [
        SKELETON, ARM, FOREARM, LANDMARKS,
        REPO / 'src' / 'muscle-models.json',
        REPO / 'src' / 'chapter11-muscles.js',
        ASSETS / 'MODEL-LICENSE.md', PROJECT, MODEL, META,
    ]
    items = []
    for path in paths:
        if not path.is_file():
            if path not in (PROJECT, MODEL, META):
                raise FileNotFoundError(path)
            continue
        destination = archive / path.name
        shutil.copy2(path, destination)
        checksum = digest(destination)
        if checksum != digest(path):
            raise RuntimeError(f'Backup verification failed for {path}')
        items.append({'original': str(path), 'file': destination.name,
                      'sha256': checksum, 'bytes': destination.stat().st_size})
    revision = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=REPO, text=True).strip()
    manifest = {'reason': f'Before building the Osteon Motion Lab {SIDE} arm',
                'revision': revision, 'files': items}
    (archive / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
    print('VERIFIED_BACKUP', archive, flush=True)


def to_blender(point):
    x, y, z = point
    return Vector((x, -z, y))


def import_meshes(path, select):
    existing = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=str(path))
    keep = []
    for obj in set(bpy.data.objects) - existing:
        if obj.type == 'MESH' and select(obj):
            mesh = obj.data.copy()
            mesh.transform(obj.matrix_world)
            obj.data = mesh
            obj.parent = None
            obj.matrix_world.identity()
            keep.append(obj)
        else:
            bpy.data.objects.remove(obj, do_unlink=True)
    return sorted(keep, key=lambda obj: obj.name)


def bone_segment(obj):
    label = obj.get('zname', '')
    if not label.endswith('.' + SIDE[0]):
        return None
    label = label[:-2]
    if label in ('Clavicle', 'Scapula'):
        return 'fixed-girdle'
    if label == 'Humerus':
        return 'MotionShoulder'
    if label in ('Radius', 'Ulna'):
        return 'MotionElbow'
    if re.search(r'finger of hand|metacarpal|capitate|hamate|lunate|pisiform|scaphoid|trapezi|trapezoid|triquetr', label, flags=re.I):
        return 'MotionWrist'
    return None


def new_rig():
    armature = bpy.data.armatures.new(f'Motion Lab {SIDE} arm armature')
    rig = bpy.data.objects.new('MotionArmRig', armature)
    bpy.context.collection.objects.link(rig)
    bpy.context.view_layer.objects.active = rig
    bpy.ops.object.mode_set(mode='EDIT')
    ends = [
        ('MotionShoulder', SHOULDER, ELBOW),
        ('MotionElbow', ELBOW, WRIST),
        ('MotionWrist', WRIST, side_point((-0.269, 0.793, 0.022))),
    ]
    previous = None
    for name, head, tail in ends:
        joint = armature.edit_bones.new(name)
        joint.head = to_blender(head)
        joint.tail = to_blender(tail)
        if previous:
            joint.parent = previous
            joint.use_connect = True
        previous = joint
    bpy.ops.object.mode_set(mode='OBJECT')
    rig.show_in_front = True
    return rig


def skin(obj, rig, weight_at=None, segment=None):
    modifier = obj.modifiers.new('Motion Lab armature', 'ARMATURE')
    modifier.object = rig
    obj.parent = rig
    if segment:
        group = obj.vertex_groups.new(name=segment)
        group.add(list(range(len(obj.data.vertices))), 1.0, 'REPLACE')
        return
    upper = obj.vertex_groups.new(name='MotionShoulder')
    lower = obj.vertex_groups.new(name='MotionElbow')
    for vertex in obj.data.vertices:
        weight = weight_at(vertex.co.z)
        if weight < 1:
            upper.add([vertex.index], 1 - weight, 'REPLACE')
        if weight > 0:
            lower.add([vertex.index], weight, 'REPLACE')


def smooth_transition(height, distal, proximal):
    weight = min(1, max(0, (proximal - height) / (proximal - distal)))
    return weight * weight * (3 - 2 * weight)


def style(obj, material):
    obj.data.materials.clear()
    obj.data.materials.append(material)
    for face in obj.data.polygons:
        face.material_index = 0


def material(name, color):
    output = bpy.data.materials.new(name)
    output.diffuse_color = (*color, 1)
    output.use_nodes = True
    shader = output.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value = (*color, 1)
    shader.inputs['Roughness'].default_value = .63
    return output


def apply_muscle_weights(obj, rig, identity):
    # These intervals follow the visible junction between belly and tendon on
    # this particular specimen. Insertion geometry at the bottom follows the
    # radius/ulna as one rigid piece. The short biceps head stops well above the
    # insertion on the source specimen and deforms into the common distal part.
    intervals = {
        'muscle-long-head-of-biceps-brachii-r': (1.073, 1.255),
        'muscle-short-head-of-biceps-brachii-r': (1.074, 1.255),
        'muscle-brachialis-muscle-r': (1.072, 1.220),
        'muscle-brachioradialis-muscle-r': (1.034, 1.160),
        'muscle-medial-head-of-triceps-brachii-r': (1.103, 1.216),
        'muscle-lateral-head-of-triceps-brachii-r': (1.103, 1.216),
        'muscle-long-head-of-triceps-brachii-r': (1.103, 1.216),
        'muscle-anconeus-muscle-r': (1.060, 1.111),
    }
    distal, proximal = intervals[identity[:-1] + 'r']
    skin(obj, rig, weight_at=lambda height: smooth_transition(height, distal, proximal))


def elbow_axes(rig):
    landmarks = json.loads(LANDMARKS.read_text(encoding='utf-8'))
    lateral = Vector(landmarks['Lateral epicondyle of humerus']['points'][0]['point'])
    medial = Vector(landmarks['Medial epicondyle of humerus']['points'][0]['point'])
    world = (lateral - medial).normalized()
    if SIDE == 'left':
        # The reflected anatomical rotation keeps its X component and flips Y/Z.
        world = Vector((world.x, -world.y, -world.z))
    local = rig.data.bones['MotionElbow'].matrix_local.to_quaternion().inverted() @ to_blender(world)
    return world, local.normalized()


def author_lesson(rig, axis):
    context = bpy.context.scene
    context.render.fps = FPS
    context.frame_start, context.frame_end = 0, 120
    elbow = rig.pose.bones['MotionElbow']
    elbow.rotation_mode = 'QUATERNION'
    for frame, angle in CURL_KEYS:
        elbow.rotation_quaternion = Quaternion(axis, math.radians(angle))
        elbow.keyframe_insert('rotation_quaternion', frame=frame, group=elbow.name)
    action = rig.animation_data.action
    action.name = 'lift-hold-lower'
    # Put the preview and the saved model back in the specimen's neutral bind pose.
    rig.animation_data.action = None
    elbow.rotation_quaternion = Quaternion()
    context.frame_set(0)
    return action


def read_glb():
    with MODEL.open('rb') as stream:
        stream.seek(12)
        length, _ = struct.unpack('<II', stream.read(8))
        return json.loads(stream.read(length))


def world_rotation(data, index):
    node = data['nodes'][index]
    x, y, z, w = node.get('rotation', (0, 0, 0, 1))
    local = Quaternion((w, x, y, z))
    parents = [i for i, other in enumerate(data['nodes']) if index in other.get('children', ())]
    return world_rotation(data, parents[0]) @ local if parents else local


def export_metadata(world_axis, bones, muscles):
    data = read_glb()
    names = {node['name']: i for i, node in enumerate(data['nodes'])}
    if len(data.get('skins', ())) < 1 or len(data.get('animations', ())) != 1:
        raise RuntimeError('Motion export is missing a skin or lesson animation')
    local = world_rotation(data, names['MotionElbow']).inverted() @ world_axis
    meta = {
        'joints': {'shoulder': 'MotionShoulder', 'elbow': 'MotionElbow', 'wrist': 'MotionWrist'},
        'jointPositions': {'shoulder': SHOULDER, 'elbow': ELBOW, 'wrist': WRIST},
        'elbowAxis': [round(value, 8) for value in local],
        'elbowWorldAxis': [round(value, 8) for value in world_axis],
        'elbowLimit': [0, ELBOW_LIMIT],
        'muscles': [dict(id=identity, name=name) for identity, name in sorted(
            {(identity, name) for identity, name, part in MUSCLE_PARTS.values()})],
        'animation': {
            'name': data['animations'][0]['name'],
            'duration': CURL_KEYS[-1][0] / FPS,
            'liftEnd': CURL_KEYS[1][0] / FPS,
            'holdEnd': CURL_KEYS[2][0] / FPS,
            'startAngle': CURL_KEYS[0][1],
            'peakAngle': CURL_KEYS[1][1],
        },
        'anconeus': {
            'meshSource': f'Anconeus muscle.{SIDE[0]} from the Osteon static atlas',
            'attachmentContext': 'Posterior lateral humeral epicondyle to lateral olecranon and proximal posterior ulna.',
            'role': 'Accessory elbow extensor and stabilizer.',
            'attachmentReference': ANCONEUS_ATLAS_REFERENCE,
            'roleReference': ANCONEUS_SOURCE,
            'deformation': 'Skinned teaching approximation with bone-bound proximal and distal regions.',
        },
        'source': 'Osteon atlas anatomy from Z-Anatomy and BodyParts3D',
        'status': f'{SIDE.capitalize()} arm teaching rig with source anconeus and approximate muscle deformation.',
        'side': SIDE,
        'counts': {'bones': len(bones), 'muscleMeshes': len(muscles)},
    }
    META.write_text(json.dumps(meta, indent=2) + '\n', encoding='utf-8')


def main():
    backup()
    original_hashes = {source: digest(source) for source in [SKELETON, ARM, FOREARM]}
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bones = import_meshes(SKELETON, bone_segment)
    muscles = [*import_meshes(ARM, lambda obj: obj.get('muscleId') in MUSCLE_PARTS),
               *import_meshes(FOREARM, lambda obj: obj.get('muscleId') in MUSCLE_PARTS)]
    if len(bones) != 32 or {obj['muscleId'] for obj in muscles} != MUSCLE_PARTS.keys():
        raise RuntimeError(f'Unexpected {SIDE} arm source inventory: {len(bones)} bones, {len(muscles)} muscles')
    rig = new_rig()
    bone_mat = material('Ivory bone', (.78, .73, .57))
    muscle_mat = material('Muscle', (.45, .095, .083))
    for obj in bones:
        label, segment = obj['zname'], bone_segment(obj)
        obj.name = label[:-2]
        obj['motionBone'] = obj.name
        style(obj, bone_mat)
        if segment != 'fixed-girdle':
            skin(obj, rig, segment=segment)
    for obj in muscles:
        identity = obj['muscleId']
        group, _, part = MUSCLE_PARTS[identity]
        obj.name = part
        obj['motionMuscle'], obj['motionPart'] = group, part
        obj['motionSide'] = SIDE
        style(obj, muscle_mat)
        apply_muscle_weights(obj, rig, identity)
    world_axis, local_axis = elbow_axes(rig)
    action = author_lesson(rig, local_axis)
    WORK.mkdir(parents=True, exist_ok=True)
    action.use_fake_user = True
    bpy.context.preferences.filepaths.save_version = 0
    bpy.ops.wm.save_as_mainfile(filepath=str(PROJECT), compress=True)
    rig.animation_data.action = action
    bpy.ops.export_scene.gltf(filepath=str(MODEL), export_format='GLB',
                              export_extras=True, export_animations=True,
                              export_animation_mode='ACTIONS',
                              export_force_sampling=True, export_yup=True,
                              export_draco_mesh_compression_enable=True,
                              export_draco_mesh_compression_level=6)
    export_metadata(world_axis, bones, muscles)
    for source, checksum in original_hashes.items():
        if digest(source) != checksum:
            raise RuntimeError(f'Original asset changed: {source}')
    print('MOTION_ARM_EXPORTED', PROJECT, MODEL, META, flush=True)


if __name__ == '__main__':
    main()
