"""Export supplemental medial gastrocnemius and soleus for the heel-raise lesson."""
from datetime import datetime, timezone
import json
from pathlib import Path
import shutil
import subprocess
import sys

import bpy

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent))
from export_motion_legs import (
    EXPORT as BASE, MUSCLES, OUTPUTS, REPO, bind, create_armature, make_material,
    muscle_weights, rig_names, sha256, source_objects, use_material,
)


EXPORT = REPO / 'assets' / 'motion-leg-actions.glb'
MANIFEST = EXPORT.with_suffix('.json')
EDITABLE = OUTPUTS / 'osteon-models' / 'motion-leg-actions.blend'
SOURCE_NAMES = {
    'Medial head of gastrocnemius': 'gastrocnemius-medial',
    'Soleus muscle': 'soleus',
}


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
        raise RuntimeError('Expected all four supplemental calf surfaces')
    rig = create_armature(sides)
    rig.name = 'MotionCalfSupplement'
    rig['motionRig'] = 'osteon-calf-supplement-v1'
    material = make_material('Motion calf muscle reference', (0.34, 0.10, 0.079))
    meshes = {}
    for (side, name), obj in selected.items():
        mesh_name = 'Motion' + side.title() + ''.join(part.title() for part in name.split())
        obj.name = mesh_name
        obj['motionKind'] = 'muscle'
        obj['motionSide'] = side
        obj['motionMuscle'] = SOURCE_NAMES[name]
        use_material(obj, material)

        def weights(point, source_name=name, chain=sides[side]):
            # The soleus source surface stops where it joins the calcaneal
            # tendon. The tendon in the main rig carries the movement across
            # the ankle. Soleus attaches to tibia/fibula and skips the knee.
            if source_name == 'Soleus muscle':
                return {chain['knee']: 1}
            return muscle_weights('Lateral head of gastrocnemius', point.y, chain)

        bind(obj, rig, weights)
        meshes.setdefault(side, {})[SOURCE_NAMES[name]] = mesh_name
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
        'schema': 1,
        'baseRig': 'motion-legs',
        'skinCompatible': True,
        'jointOrder': joints,
        'muscles': meshes,
        'notes': 'These are textbook heel-raise teaching surfaces. Soleus joins the calcaneal tendon, which is supplied by the base rig. These meshes are outside the measured walking highlight set.',
    }, indent=2) + '\n', encoding='utf-8')
    print(f'Exported {len(selected)} calf meshes, with bind matrices identical to {BASE.name}.', flush=True)


if __name__ == '__main__':
    main()
