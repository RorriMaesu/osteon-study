"""Export the bilateral, pose-corrected posterior calf for the heel-raise lesson."""
from datetime import datetime, timezone
import json
import math
from pathlib import Path
import shutil
import subprocess
import sys

import bpy
from mathutils import Quaternion
from mathutils.kdtree import KDTree

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent))
from export_motion_legs import (
    EXPORT as BASE, MUSCLES, OUTPUTS, REPO, bind, create_armature, make_material,
    muscle_weights, rig_names, sha256, smoothstep, source_objects, to_blender, to_web, use_material,
)


EXPORT = REPO / 'assets' / 'motion-leg-actions.glb'
MANIFEST = EXPORT.with_suffix('.json')
EDITABLE = OUTPUTS / 'osteon-models' / 'motion-leg-actions.blend'
SOURCE_NAMES = {
    'Lateral head of gastrocnemius': 'gastrocnemius-lateral',
    'Medial head of gastrocnemius': 'gastrocnemius-medial',
    'Soleus muscle': 'soleus',
    'Plantaris muscle': 'plantaris',
    'Calcaneal tendon': None,
}
REPLACEMENTS = {'Lateral head of gastrocnemius', 'Calcaneal tendon'}
HEEL_SHAPE = 'HeelRise23'
HEEL_ANGLE = 23


def snapshot(reason):
    now = datetime.now(timezone.utc)
    target = OUTPUTS / 'model-backups' / now.strftime('motion-leg-actions-%Y%m%d-%H%M%S-%f')
    target.mkdir(parents=True, exist_ok=False)
    entries = []
    for path in (
        MUSCLES, BASE, BASE.with_suffix('.json'), REPO / 'src' / 'muscle-models.json',
        REPO / 'assets' / 'MODEL-LICENSE.md', EDITABLE, EXPORT, MANIFEST,
    ):
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


def glb(path):
    with path.open('rb') as file:
        header = file.read(20)
        document = json.loads(file.read(int.from_bytes(header[12:16], 'little')))
        bin_header = file.read(8)
        return document, file.read(int.from_bytes(bin_header[:4], 'little'))


def bind_signature(path):
    document, data = glb(path)
    skin, = document['skins']
    joint_names = [document['nodes'][n]['name'] for n in skin['joints']]
    accessor = document['accessors'][skin['inverseBindMatrices']]
    view = document['bufferViews'][accessor['bufferView']]
    offset = view.get('byteOffset', 0) + accessor.get('byteOffset', 0)
    return joint_names, data[offset:offset + accessor['count'] * 16 * 4]


def ankle_weights(point, name, joints):
    if name == 'Soleus muscle':
        # The belly attaches to the shank. Its Achilles junction movement is
        # authored below, so ankle rotation cannot swing the belly into bone.
        return {joints['knee']: 1}
    if name == 'Plantaris muscle':
        thigh = smoothstep(point.y, 0.435, 0.49)
        foot = 1 - smoothstep(point.y, 0.063, 0.128)
        return {joints['hip']: thigh, joints['knee']: 1 - thigh - foot, joints['ankle']: foot}
    return muscle_weights(name, point.y, joints)


def heel_shape(obj, name):
    """Preserve both attachments and share displacement across the Achilles join."""
    neutral = obj.shape_key_add(name='Basis')
    correction = obj.shape_key_add(name=HEEL_SHAPE)
    correction.value = 0
    world = obj.matrix_world.copy()
    inverse = world.inverted()
    positions = [to_web(world @ point.co) for point in neutral.data]
    axis_x = (min(p.x for p in positions) + max(p.x for p in positions)) / 2
    belly = name in {'Soleus muscle', 'Medial head of gastrocnemius', 'Lateral head of gastrocnemius'}
    for target, point in zip(correction.data, positions):
        # The posterior aponeurosis translates proximally in the contracted
        # pose. A shared longitudinal envelope maintains overlap with the
        # existing tendon mesh. The calcaneal footprint stays ankle-bound.
        distal = smoothstep(point.y, 0.068, 0.128)
        proximal = 1 - smoothstep(point.y, 0.183, 0.365)
        point.y += 0.008 * distal * proximal
        if belly:
            # Modest transverse expansion compensates for local shortening.
            # Limit it to the belly, clear of the origin and the shared join.
            extent = smoothstep(point.y, 0.22, 0.26) * (1 - smoothstep(point.y, 0.30, 0.36))
            point.x += (point.x - axis_x) * 0.032 * extent
            point.z -= 0.002 * extent
        target.co = inverse @ to_blender(point)
    return correction


def posed_points(obj, deps):
    evaluated = obj.evaluated_get(deps)
    return [to_web(evaluated.matrix_world @ vertex.co) for vertex in evaluated.data.vertices]


def nearest_distance(points, tendon, indices):
    tree = KDTree(len(tendon))
    for index, point in enumerate(tendon):
        tree.insert(point, index)
    tree.balance()
    return min(tree.find(points[index])[2] for index in indices)


def check_poses(rig, sides, selected, keys):
    """Check the authored calf pose and retain the measurements with the export."""
    deps = bpy.context.evaluated_depsgraph_get()
    poses = {}
    for angle in (0, HEEL_ANGLE / 2, HEEL_ANGLE):
        for side, chain in sides.items():
            ankle = rig.pose.bones[chain['ankle']]
            axis = ankle.bone.matrix_local.to_quaternion().inverted() @ to_blender((1, 0, 0))
            ankle.rotation_mode = 'QUATERNION'
            ankle.rotation_quaternion = Quaternion(axis, math.radians(angle))
        for shape in keys.values():
            shape.value = angle / HEEL_ANGLE
        bpy.context.view_layer.update()
        poses[angle] = {identity: posed_points(obj, deps) for identity, obj in selected.items()}

    neutral = poses[0]
    report = {}
    for side, chain in sides.items():
        tendon_id = (side, 'Calcaneal tendon')
        soleus_id = (side, 'Soleus muscle')
        neutral_soleus = neutral[soleus_id]
        tendon = neutral[tendon_id]
        origin = [i for i, p in enumerate(neutral_soleus) if p.y > 0.375]
        distal = [i for i, p in enumerate(neutral_soleus) if p.y < 0.154]
        foot = [i for i, p in enumerate(tendon) if p.y < 0.043]
        if not origin or not distal or not foot:
            raise RuntimeError('Calf attachment samples missing for ' + side)
        joint = rig.pose.bones[chain['ankle']]
        foot_matrix = joint.matrix @ joint.bone.matrix_local.inverted()
        posed = poses[HEEL_ANGLE]
        origin_drift = max((posed[soleus_id][i] - neutral_soleus[i]).length for i in origin)
        distal_rise = sum(posed[soleus_id][i].y - neutral_soleus[i].y for i in distal) / len(distal)
        tendon_anchor_error = max((posed[tendon_id][i] - to_web(foot_matrix @ to_blender(tendon[i]))).length for i in foot)
        clearance = {}
        for name, cutoff in {'Soleus muscle': 0.18, 'Medial head of gastrocnemius': 0.242,
                             'Lateral head of gastrocnemius': 0.245}.items():
            identity = (side, name)
            indices = [i for i, p in enumerate(neutral[identity]) if p.y < cutoff]
            spacing = [nearest_distance(poses[pose][identity], poses[pose][tendon_id], indices)
                       for pose in (0, HEEL_ANGLE / 2, HEEL_ANGLE)]
            if max(spacing) > max(spacing[0] + 0.002, 0.004):
                raise RuntimeError('The Achilles-join overlap has degraded for ' + name + ' ' + side)
            clearance[SOURCE_NAMES[name]] = [round(v * 1000, 3) for v in spacing]
        if origin_drift > 0.0001 or tendon_anchor_error > 0.0001 or not 0.006 < distal_rise < 0.010:
            raise RuntimeError('Calf attachment or deformation check failed for ' + side)
        report[side] = {'soleusOriginDriftMm': round(origin_drift * 1000, 4),
                        'soleusDistalRiseMm': round(distal_rise * 1000, 3),
                        'achillesInsertionErrorMm': round(tendon_anchor_error * 1000, 4),
                        'nearestTendonJoinVerticesMm': clearance}
    for shape in keys.values():
        shape.value = 0
    for chain in sides.values():
        rig.pose.bones[chain['ankle']].rotation_quaternion = Quaternion()
    bpy.context.view_layer.update()
    return report


def main():
    snapshot('Before Blender authoring of supplemental calf surfaces')
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sides = {side: rig_names(side) for side in ('right', 'left')}
    selected = {}
    for obj in sorted(source_objects(MUSCLES), key=lambda item: item.name):
        name = obj.get('zname', '')[:-2]
        side = obj.get('anatomicalSide', '')
        if name in SOURCE_NAMES and side in sides:
            if (side, name) in selected:
                raise RuntimeError('Duplicate calf surface for ' + side + ': ' + name)
            selected[(side, name)] = obj
        else:
            bpy.data.objects.remove(obj, do_unlink=True)
    if len(selected) != len(sides) * len(SOURCE_NAMES):
        raise RuntimeError('Expected all requested bilateral calf surfaces')
    rig = create_armature(sides)
    rig.name = 'MotionCalfSupplement'
    rig['motionRig'] = 'osteon-calf-supplement-v2'
    material = make_material('Motion calf muscle reference', (0.34, 0.10, 0.079))
    tendon_material = make_material('Motion calf calcaneal tendon', (0.56, 0.45, 0.35))
    meshes, keys, replacements = {}, {}, {}
    for (side, name), obj in selected.items():
        stem = ''.join(part.title() for part in name.split())
        replaces = 'Motion' + side.title() + stem
        mesh_name = ('MotionHeel' if name in REPLACEMENTS else 'Motion') + side.title() + stem
        obj.name = mesh_name
        muscle = SOURCE_NAMES[name]
        obj['motionKind'] = 'muscle' if muscle else 'support'
        obj['motionSide'] = side
        obj['motionHeelDeformation'] = HEEL_SHAPE
        if muscle:
            obj['motionMuscle'] = muscle
            meshes.setdefault(side, {})[muscle] = mesh_name
        if name in REPLACEMENTS:
            obj['motionHeelReplacement'] = replaces
            replacements[mesh_name] = replaces
        if name == 'Plantaris muscle':
            obj['motionContextOnly'] = True
        use_material(obj, material if muscle else tendon_material)
        keys[(side, name)] = heel_shape(obj, name)
        bind(obj, rig, lambda point, muscle_name=name, chain=sides[side]: ankle_weights(point, muscle_name, chain))
    checks = check_poses(rig, sides, selected, keys)
    EDITABLE.parent.mkdir(parents=True, exist_ok=True)
    bpy.context.scene.name = 'Osteon heel-raise calf supplement'
    snapshot('Before saving the supplemental calf .blend')
    bpy.ops.wm.save_as_mainfile(filepath=str(EDITABLE))
    snapshot('Before exporting supplemental calf GLB and rig manifest')
    bpy.ops.export_scene.gltf(
        filepath=str(EXPORT), export_format='GLB', export_extras=True, export_animations=False,
        export_yup=True, export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6, export_draco_position_quantization=16,
        export_draco_normal_quantization=10, export_draco_generic_quantization=12,
    )
    joints, matrices = bind_signature(EXPORT)
    base_joints, base_matrices = bind_signature(BASE)
    if joints != base_joints or matrices != base_matrices:
        raise RuntimeError('Supplemental calf skin differs from the base rig bind pose')
    MANIFEST.write_text(json.dumps({
        'schema': 2,
        'baseRig': 'motion-legs',
        'skinCompatible': True,
        'jointOrder': joints,
        'muscles': meshes,
        'replacements': replacements,
        'deformation': {'target': HEEL_SHAPE, 'anklePlantarflexionDegrees': [0, HEEL_ANGLE],
                        'validatedAngles': [0, HEEL_ANGLE / 2, HEEL_ANGLE], 'checks': checks},
        'notes': {
            'movement': 'Pose-dependent Blender corrective shapes depict the posterior calf shortening during a straight-knee heel raise. Shared aponeurosis motion is a teaching approximation, not measured individual fascicle strain.',
            'attachments': 'Upper soleus stays bound to the shank. The calcaneal insertion tracks the ankle. Tendon-join nearest-vertex separation is a mesh diagnostic.',
            'plantaris': 'Source-aligned plantaris and its tendon are an anatomical context layer. Distal insertion varies. No activation was assigned.',
            'sources': ['assets/muscles-pelvis-leg-foot.glb', 'https://doi.org/10.1152/japplphysiol.00596.2003',
                        'https://pubmed.ncbi.nlm.nih.gov/35627332/'],
        },
    }, indent=2) + '\n', encoding='utf-8')
    print(f'Exported {len(selected)} calf meshes, with bind matrices identical to {BASE.name}.', flush=True)


if __name__ == '__main__':
    main()
