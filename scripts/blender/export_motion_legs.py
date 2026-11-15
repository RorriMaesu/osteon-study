"""Export the separate Osteon lower-limb lesson rig with Blender 4.5.

Run from the repository with:
  blender --background --factory-startup --python scripts/blender/export_motion_legs.py

The editable .blend and verified snapshots live in the workspace's outputs
directory. Only the GLB and its rig manifest are served to the browser.
"""
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import shutil
import subprocess

import bpy
from mathutils import Matrix, Quaternion, Vector


REPO = Path(__file__).resolve().parents[2]
OUTPUTS = REPO.parent.parent / 'outputs'
EDITABLE = OUTPUTS / 'osteon-models' / 'motion-legs.blend'
EXPORT = REPO / 'assets' / 'motion-legs.glb'
MANIFEST = EXPORT.with_suffix('.json')
SKELETON = REPO / 'assets' / 'skeleton.glb'
MUSCLES = REPO / 'assets' / 'muscles-pelvis-leg-foot.glb'
SOURCES = (
    SKELETON, MUSCLES, REPO / 'src' / 'muscle-models.json',
    REPO / 'assets' / 'MODEL-LICENSE.md',
)

# Positions in the neutral atlas coordinates exported to Three.js.
# Hip center was fit to the articular cap of the femoral head. The knee
# center is the midpoint of sphere fits to the two distal condylar surfaces.
# The ankle is centered in the talar trochlea, and the toe pivot averages
# the metatarsophalangeal line for a teaching approximation.
RIGHT_PIVOTS = {
    'hip': (-0.0842, 0.85985, -0.004835),
    'knee': (-0.0757, 0.4569, -0.0274),
    'ankle': (-0.075, 0.071, -0.035),
    'toe': (-0.087, 0.019, 0.077),
}
PELVIS = (0, RIGHT_PIVOTS['hip'][1], RIGHT_PIVOTS['hip'][2])
SAGITTAL = {
    'hip': (-1, 0, 0),
    'knee': (1, 0, 0),
    'ankle': (-1, 0, 0),
    'toe': (-1, 0, 0),
    'patella': (1, 0, 0),
}
FOOT_GROUPS = ('Tarsal bones.g', 'Metatarsal bones.g', 'Phalanges of foot.g', 'Bones of foot.g')
MUSCLE_NAMES = {
    'Vastus lateralis muscle': 'vastus-lateralis',
    'Long head of biceps femoris': 'biceps-femoris',
    'Tibialis anterior muscle': 'tibialis-anterior',
    'Lateral head of gastrocnemius': 'gastrocnemius-lateral',
}
TENDON_NAMES = ('Calcaneal tendon',)


def sha256(path):
    with path.open('rb') as file:
        return hashlib.file_digest(file, 'sha256').hexdigest()


def snapshot(reason):
    """Capture inputs and any earlier outputs immediately before editing."""
    now = datetime.now(timezone.utc)
    target = OUTPUTS / 'model-backups' / now.strftime('motion-legs-%Y%m%d-%H%M%S-%f')
    target.mkdir(parents=True, exist_ok=False)
    entries = []
    for path in (*SOURCES, EDITABLE, EXPORT, MANIFEST):
        entry = {'original': str(path), 'existed': path.is_file()}
        if entry['existed']:
            copy = target / path.name
            shutil.copy2(path, copy)
            digest = sha256(copy)
            if digest != sha256(path):
                raise RuntimeError('Model backup hash mismatch for ' + str(path))
            entry.update(file=copy.name, sha256=digest, bytes=copy.stat().st_size)
        entries.append(entry)
    commit = subprocess.check_output(('git', '-C', str(REPO), 'rev-parse', 'HEAD'), text=True).strip()
    (target / 'manifest.json').write_text(json.dumps({
        'created': now.isoformat(), 'reason': reason, 'git': commit, 'files': entries,
    }, indent=2), encoding='utf-8')
    print('Verified backup:', target, flush=True)


def to_blender(point):
    x, y, z = point
    return Vector((x, -z, y))


def to_web(point):
    return Vector((point.x, point.z, -point.y))


def reflected(point, side):
    return ((-point[0] if side == 'left' else point[0]), *point[1:])


def rig_names(side):
    ending = 'R' if side == 'right' else 'L'
    return {key: f'Motion{key.title()}{ending}' for key in (*RIGHT_PIVOTS, 'patella')}


def create_armature(sides):
    armature = bpy.data.armatures.new('Osteon lower-limb motion')
    rig = bpy.data.objects.new('MotionLowerBody', armature)
    bpy.context.collection.objects.link(rig)
    rig.show_in_front = True
    rig['motionRig'] = 'osteon-lower-limb-v1'
    bpy.context.view_layer.objects.active = rig
    rig.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT')

    def make_bone(name, head, parent=None):
        bone = armature.edit_bones.new(name)
        bone.head = to_blender(head)
        bone.tail = bone.head + Vector((0, 0, 0.045))
        bone.parent = parent
        bone.use_connect = False
        return bone

    pelvis = make_bone('MotionPelvis', PELVIS)
    for side, names in sides.items():
        parent = pelvis
        for key, head in RIGHT_PIVOTS.items():
            parent = make_bone(names[key], reflected(head, side), parent)
        make_bone(names['patella'], reflected(RIGHT_PIVOTS['knee'], side), armature.edit_bones[names['hip']])
    bpy.ops.object.mode_set(mode='OBJECT')
    return rig


def source_objects(path):
    prior = set(bpy.context.scene.objects)
    bpy.ops.import_scene.gltf(filepath=str(path))
    return set(bpy.context.scene.objects).difference(prior)


def anatomical_bone(obj, sides):
    name = obj.get('zname', '')
    if name in {'Sacrum', 'Coccyx', 'Hip bone.r', 'Hip bone.l'}:
        return 'MotionPelvis'
    if name[-2:] not in {'.r', '.l'}:
        return None
    side = 'right' if name.endswith('.r') else 'left'
    if name.startswith('Femur.'):
        return sides[side]['hip']
    if name.startswith(('Tibia.', 'Fibula.')):
        return sides[side]['knee']
    if name.startswith('Patella.'):
        return sides[side]['patella']
    group = obj.get('zgroup')
    if group in FOOT_GROUPS:
        return sides[side]['toe' if group == 'Phalanges of foot.g' else 'ankle']
    return None


def smoothstep(value, low, high):
    t = min(1.0, max(0.0, (value - low) / (high - low)))
    return t * t * (3 - 2 * t)


def muscle_weights(source_name, y, joints):
    """Preserve rigidly bound attachment regions with adjacent tissue blends."""
    if source_name == 'Vastus lateralis muscle':
        # The distal quadriceps tendon in this source reaches past the
        # patella. Keep the distal extension with the proximal tibia.
        thigh = smoothstep(y, 0.457, 0.505)
        shin = 1 - smoothstep(y, 0.410, 0.439)
        return {joints['hip']: thigh, joints['patella']: 1 - thigh - shin, joints['knee']: shin}
    if source_name == 'Long head of biceps femoris':
        pelvis = smoothstep(y, 0.753, 0.802)
        shin = 1 - smoothstep(y, 0.419, 0.490)
        return {'MotionPelvis': pelvis, joints['hip']: 1 - pelvis - shin, joints['knee']: shin}
    if source_name == 'Lateral head of gastrocnemius':
        thigh = smoothstep(y, 0.429, 0.474)
        return {joints['hip']: thigh, joints['knee']: 1 - thigh}
    foot = 1 - smoothstep(y, 0.063, 0.116)
    return {joints['knee']: 1 - foot, joints['ankle']: foot}


def bind(obj, rig, weights):
    groups = {}
    world = obj.matrix_world.copy()
    for vert in obj.data.vertices:
        for joint, amount in weights(to_web(world @ vert.co)).items():
            if amount <= 0.000001:
                continue
            if joint not in groups:
                groups[joint] = obj.vertex_groups.new(name=joint)
            groups[joint].add([vert.index], amount, 'REPLACE')
    modifier = obj.modifiers.new(name='Osteon anatomical motion', type='ARMATURE')
    modifier.object = rig
    obj.parent = rig
    obj.matrix_world = world


def use_material(mesh, material):
    mesh.data.materials.clear()
    mesh.data.materials.append(material)


def make_material(name, color):
    material = bpy.data.materials.new(name)
    material.diffuse_color = (*color, 1)
    material.use_nodes = True
    principled = material.node_tree.nodes.get('Principled BSDF')
    principled.inputs['Base Color'].default_value = (*color, 1)
    principled.inputs['Roughness'].default_value = 0.76
    return material


def sole_points(meshes, side):
    suffix = '.r' if side == 'right' else '.l'
    specs = {
        'heel': ('ankle', lambda name, z: name == 'Calcaneus' + suffix and z < -0.059),
        'ball': ('ankle', lambda name, z: name == 'First metatarsal bone' + suffix and z > 0.060),
        'toe': ('toe', lambda name, z: 'first finger of foot' in name and z > 0.085),
        'lateralBall': ('ankle', lambda name, z: name == 'Fifth metatarsal bone' + suffix and z > 0.035),
    }
    result = {}
    for label, (joint, accepts) in specs.items():
        candidates = []
        for mesh in meshes:
            name = mesh.get('zname', '')
            if name.endswith(suffix) and (label != 'toe' or 'foot' in name):
                for vert in mesh.data.vertices:
                    p = to_web(mesh.matrix_world @ vert.co)
                    if accepts(name, p.z):
                        candidates.append(p)
        result[label] = (joint, min(candidates, key=lambda p: p.y))
    return result


def rounding(vector):
    return [round(value, 7) for value in vector]


def exported_transforms():
    with EXPORT.open('rb') as file:
        header = file.read(20)
        document = json.loads(file.read(int.from_bytes(header[12:16], 'little')))
    matrices = {}
    named = {}

    def walk(index, parent):
        node = document['nodes'][index]
        if 'matrix' in node:
            local = Matrix([node['matrix'][i::4] for i in range(4)])
        else:
            x, y, z, w = node.get('rotation', (0, 0, 0, 1))
            local = Matrix.LocRotScale(
                Vector(node.get('translation', (0, 0, 0))),
                Quaternion((w, x, y, z)),
                Vector(node.get('scale', (1, 1, 1))),
            )
        matrix = parent @ local
        if 'name' in node:
            matrices[node['name']] = matrix
            named[node['name']] = node
        for child in node.get('children', ()):
            walk(child, matrix)

    for root in document['scenes'][document.get('scene', 0)]['nodes']:
        walk(root, Matrix.Identity(4))
    return document, matrices, named


def write_manifest(sides, feet, expected_bones):
    document, matrices, named = exported_transforms()
    meshes = [node for node in document['nodes'] if 'mesh' in node]
    if sum(node.get('extras', {}).get('motionKind') == 'bone' for node in meshes) != expected_bones:
        raise RuntimeError('Missing exported lower-limb bone geometry')
    if len(document.get('skins', [])) != 1:
        raise RuntimeError('Expected one shared skeleton for the lower-limb meshes')
    highlights = {}
    axes = {}
    extra_axes = {}
    neutral = {}
    contact = {}
    for side, joints in sides.items():
        axes[side], neutral[side], extra_axes[side], contact[side] = {}, {}, {}, {}
        for key, name in joints.items():
            matrix = matrices[name]
            rotation = matrix.to_quaternion()
            axes[side][key] = rounding(rotation.inverted() @ Vector(SAGITTAL[key]))
            expected = reflected(RIGHT_PIVOTS['knee' if key == 'patella' else key], side)
            if (matrix.to_translation() - Vector(expected)).length > 1e-5:
                raise RuntimeError('Joint disagrees with the inspected atlas coordinates: ' + name)
            neutral[side][key] = rounding(matrix.to_translation())
        rotation = matrices[joints['hip']].to_quaternion().inverted()
        sign = 1 if side == 'right' else -1
        extra_axes[side]['hip'] = {
            'adduction': rounding(rotation @ Vector((0, 0, sign))),
            'internalRotation': rounding(rotation @ Vector((0, sign, 0))),
        }
        for kind, (joint, world) in feet[side].items():
            name = joints[joint]
            contact[side][kind] = {'node': name, 'local': rounding(matrices[name].inverted() @ world)}
        highlights[side] = {}
        for muscle in MUSCLE_NAMES.values():
            matches = [n for n in meshes if n.get('extras', {}).get('motionMuscle') == muscle
                       and n['extras'].get('motionSide') == side]
            if len(matches) != 1:
                raise RuntimeError(f'Expected a single {side} geometry for {muscle}')
            highlights[side][muscle] = matches[0]['name']

    if 'MotionPelvis' not in named or (matrices['MotionPelvis'].to_translation() - Vector(PELVIS)).length > 1e-5:
        raise RuntimeError('Pelvic root does not match the neutral atlas')
    MANIFEST.write_text(json.dumps({
        'schema': 1,
        'joints': {'pelvis': 'MotionPelvis', **sides},
        'axes': axes,
        'additionalAxes': extra_axes,
        'neutral': {'frame': '+Y superior, +Z anterior, -X anatomical right', 'pelvis': list(PELVIS), **neutral},
        'contact': contact,
        'muscles': highlights,
        'notes': {
            'geometry': 'Original atlas surfaces keep their neutral alignment. This teaching rig simplifies joint translations and soft-tissue geometry.',
            'knee': 'The knee uses a sagittal hinge. Patella rotation uses a separate node for a teaching approximation of tracking.',
            'gastrocnemius': 'Use the lateral head as the recorded region. The calcaneal tendon is included as supporting geometry.',
            'bicepsFemoris': 'The long-head surface locates the recorded biceps femoris muscle. The signal cannot distinguish its two heads.',
            'contact': 'Heel, ball of foot and toe coordinates are from the osseous surfaces. Sole thickness is absent.',
            'sources': ['assets/skeleton.glb', 'assets/muscles-pelvis-leg-foot.glb', 'assets/MODEL-LICENSE.md'],
        },
    }, indent=2) + '\n', encoding='utf-8')


def main():
    snapshot('Before lower-limb authoring in Blender')
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sides = {side: rig_names(side) for side in ('right', 'left')}

    bones = {}
    muscle_objects = {}
    for obj in sorted(source_objects(SKELETON), key=lambda item: item.name):
        joint = anatomical_bone(obj, sides)
        if joint:
            bones[obj] = joint
        else:
            bpy.data.objects.remove(obj, do_unlink=True)
    feet = {side: sole_points(bones, side) for side in sides}
    for obj in sorted(source_objects(MUSCLES), key=lambda item: item.name):
        name = obj.get('zname', '')[:-2]
        side = obj.get('anatomicalSide', '')
        if (name in MUSCLE_NAMES or name in TENDON_NAMES) and side in sides:
            muscle_objects[obj] = (name, side)
        else:
            bpy.data.objects.remove(obj, do_unlink=True)

    rig = create_armature(sides)
    bone_material = make_material('Motion bone', (0.75, 0.67, 0.54))
    tissue_material = make_material('Motion muscle reference', (0.34, 0.10, 0.079))
    tendon_material = make_material('Motion calcaneal tendon', (0.56, 0.45, 0.35))
    for obj, joint in bones.items():
        obj['motionKind'] = 'bone'
        use_material(obj, bone_material)
        bind(obj, rig, lambda p, j=joint: {j: 1})
    for obj, (name, side) in muscle_objects.items():
        obj['motionSide'] = side
        obj['motionKind'] = 'muscle' if name in MUSCLE_NAMES else 'support'
        obj.name = 'Motion' + ('Right' if side == 'right' else 'Left') + ''.join(part.title() for part in name.split())
        if name in MUSCLE_NAMES:
            obj['motionMuscle'] = MUSCLE_NAMES[name]
        use_material(obj, tissue_material if name in MUSCLE_NAMES else tendon_material)
        bind(obj, rig, lambda p, n=name, chain=sides[side]: muscle_weights(n, p.y, chain))

    EDITABLE.parent.mkdir(parents=True, exist_ok=True)
    bpy.context.scene.name = 'Osteon lower-limb motion'
    snapshot('Before saving the editable lower-limb motion .blend')
    bpy.ops.wm.save_as_mainfile(filepath=str(EDITABLE))
    snapshot('Before exporting lower-limb motion GLB and rig manifest')
    bpy.ops.export_scene.gltf(
        filepath=str(EXPORT), export_format='GLB', export_extras=True, export_animations=False,
        export_yup=True, export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6, export_draco_position_quantization=16,
        export_draco_normal_quantization=10, export_draco_generic_quantization=12,
    )
    write_manifest(sides, feet, len(bones))
    print(f'Exported {len(bones)} bones, {len(muscle_objects)} muscle and tendon surfaces, {EXPORT.stat().st_size} bytes')


if __name__ == '__main__':
    main()
