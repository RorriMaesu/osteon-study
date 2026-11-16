"""Reimport, compare original surfaces in neutral and sample the gait receiver."""
import json
import math
import sys
from pathlib import Path

import bpy
from mathutils import Matrix, Quaternion, Vector
sys.path.insert(0, str(Path(__file__).parent))
from build_motion_walk_muscles import REPO, REQUESTED_REGIONS, REVIEWED_FITS, WORK, surface_error, surface_sample


ASSETS = REPO / 'assets'
MANIFEST = json.loads((WORK / 'motion-walk-muscles.json').read_text())
ATLAS = json.loads((REPO / 'src' / 'muscle-models.json').read_text())
GAIT = json.loads((REPO / 'src' / 'motion-gait-data.json').read_text())
LOWER = json.loads((ASSETS / 'motion-legs.json').read_text())
UPPER = json.loads((ASSETS / 'motion-walk-context.json').read_text())
SAMPLES = [0, 22, 51, 85, 100]


def to_blender(point):
    x, y, z = point
    return Vector((x, -z, y))


def pose_delta(driver, axis, degrees):
    pivot = to_blender(MANIFEST['driverRest'][driver])
    rotation = Quaternion(to_blender(axis), math.radians(degrees)).to_matrix().to_4x4()
    return Matrix.Translation(pivot) @ rotation @ Matrix.Translation(-pivot)


def spline(phase, frames, column):
    last = len(frames)-1
    index = min(last-1, math.floor(phase*last))
    before, old, new, after = [frames[(index+offset+last) % last][column] for offset in (-1, 0, 1, 2)]
    t = phase*last-index
    return old+.5*t*(new-before+t*(2*before-5*old+4*new-after+t*(3*old-3*new+after-before)))


def driver_deltas(sample):
    # Deliberate 3 cm world translation also catches accidental double parenting.
    deltas = {'MotionPelvis': Matrix.Translation(Vector((.017, .013, .019)))}
    for side, chain in LOWER['joints'].items():
        if not isinstance(chain, dict):
            continue
        last = deltas['MotionPelvis']
        hip = None
        for joint in ('hip','knee','ankle','toe','patella'):
            name = chain[joint]
            if joint == 'patella':
                last = hip
                angle = max(0., sample[side]['knee'])*.55
            elif joint == 'toe':
                angle = 0.
            else:
                angle = sample[side][joint]-LOWER.get('neutralAngles', {}).get(side, {}).get(joint, 0.)
            local_delta = pose_delta(name, LOWER['axes'][side][joint], angle)
            deltas[name] = last @ local_delta
            last = deltas[name]
            if joint == 'hip':
                hip = last
    right_contact = next(e['percent'] for e in GAIT['events'] if e['side'] == 'right' and e['phase'] == 'initial-contact')
    percent = sample['percent']
    phase = .5+.5*percent/right_contact if percent < right_contact else .5*(percent-right_contact)/(100-right_contact)
    torso = UPPER['torso']
    head = UPPER['head']
    interp = lambda column: spline(phase, UPPER['previewFrames'], column)
    deltas[torso] = deltas['MotionPelvis'] @ pose_delta(torso, UPPER['axes']['torso'], interp(1))
    deltas[head] = deltas[torso] @ pose_delta(head, UPPER['axes']['head'], interp(2))
    for side, first in (('right', 3), ('left', 5)):
        shoulder, elbow = (UPPER['joints'][side][name] for name in ('shoulder', 'elbow'))
        deltas[shoulder] = deltas[torso] @ pose_delta(shoulder, UPPER['axes'][side]['shoulder'], interp(first))
        deltas[elbow] = deltas[shoulder] @ pose_delta(elbow, UPPER['axes'][side]['elbow'], interp(first+1))
    return deltas


def import_scene(path):
    bpy.ops.import_scene.gltf(filepath=str(path))
    bpy.context.view_layer.update()
    return {obj['muscleId']: obj for obj in bpy.context.scene.objects if obj.type == 'MESH' and obj.get('muscleId')}


def world_points(obj, graph=None):
    evaluated = obj.evaluated_get(graph) if graph else obj
    mesh = evaluated.to_mesh() if graph else evaluated.data
    world = evaluated.matrix_world.copy()
    out = [world @ vertex.co for vertex in mesh.vertices]
    if graph:
        evaluated.to_mesh_clear()
    return out


def verify_region(region, item):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    source = import_scene(ASSETS / ATLAS['assets'][region]['file'])
    source_points = {identity: surface_sample(obj) for identity, obj in source.items()
                     if obj.get('muscleKind') == 'muscle'}
    bpy.ops.wm.read_factory_settings(use_empty=True)
    loaded = import_scene(WORK / item['file'])
    armature, = [obj for obj in bpy.context.scene.objects if obj.type == 'ARMATURE']
    bones = {driver: armature.pose.bones[name] for driver, name in MANIFEST['drivers'].items()}
    rest_bones = {driver: bone.matrix.copy() for driver, bone in bones.items()}
    bind = {}
    for identity, mesh in loaded.items():
        if mesh.find_armature() != armature or mesh.get('walkEvidence') != 'anatomical-context':
            raise ValueError('Bad delivered mesh binding ' + identity)
        weights = [sum(g.weight for g in vertex.groups) for vertex in mesh.data.vertices]
        if min(weights) < .98 or max(weights) > 1.02:
            raise ValueError('Unnormalized delivered skin weights ' + identity)
        bind[identity] = world_points(mesh, bpy.context.evaluated_depsgraph_get())
    errors = {key: surface_error(source_points[key], (pts, [tuple(poly.vertices) for poly in loaded[key].data.polygons]))
              for key, pts in bind.items()}
    reviewed = REVIEWED_FITS.get(region, errors) if REQUESTED_REGIONS else errors
    drift = max(errors[key] for key in reviewed)
    if drift > .00055:
        raise ValueError(f'Rest geometry changed by {drift} m in {region}')
    results = {'parts': len(loaded), 'restSampleMaxErrorMillimeters': round(1000*max(errors.values()), 4),
               'fittedRestSampleMaxErrorMillimeters': round(1000*drift, 4),
               'fittedRestComponentsChecked': len(reviewed), 'samples': {}}
    ids = sorted(loaded)
    edge_data = {identity: [edge.vertices[:] for edge in loaded[identity].data.edges] for identity in ids}
    for percent in SAMPLES:
        deltas = driver_deltas(GAIT['samples'][percent])
        world, inverse = armature.matrix_world.copy(), armature.matrix_world.inverted()
        # Assign the same world-delta transforms that will drive the browser receiver.
        for driver, bone in bones.items():
            bone.matrix = inverse @ deltas[driver] @ world @ rest_bones[driver]
        for mesh in loaded.values():
            if mesh.get('walkClearance'):
                mesh.data.shape_keys.key_blocks[mesh['walkClearance']].value = 1.
        bpy.context.view_layer.update()
        displaced, changed, edge_max = 0, 0, []
        graph = bpy.context.evaluated_depsgraph_get()
        for identity in ids:
            before = bind[identity]
            after = world_points(loaded[identity], graph)
            mesh = loaded[identity]
            if len(before) != len(after):
                raise ValueError('Evaluated topology changed')
            movement = max((b-a).length for a, b in zip(before, after))
            if movement > .001:
                displaced += 1
            if mesh['walkDeformation'] == 'segment-follow':
                driver, = mesh['walkDrivers']
                mismatch = max((b-deltas[driver]@a).length for a, b in zip(before, after))
                if mismatch > .00012:
                    raise ValueError(f'Unexpected deformation {identity} {mismatch}')
                continue
            edge_ratios = []
            for a, b in edge_data[identity][::max(1,len(edge_data[identity])//150)]:
                initial = (before[a]-before[b]).length
                if initial > .0005:
                    edge_ratios.append((after[a]-after[b]).length / initial)
            if edge_ratios:
                edge_ratios.sort()
                ratio = edge_ratios[math.floor(.95*(len(edge_ratios)-1))]
                edge_max.append((round(ratio, 3), identity))
                if ratio > 1.001:
                    changed += 1
        results['samples'][percent] = {'partsMovedOver1mm': displaced, 'partsWithSampledEdgeChange': changed,
                                      'highestEdgeStretchP95': sorted(edge_max, reverse=True)[:3]}
    for driver, bone in bones.items():
        bone.matrix = rest_bones[driver]
    for mesh in loaded.values():
        if mesh.get('walkClearance'):
            mesh.data.shape_keys.key_blocks[mesh['walkClearance']].value = 0.
    bpy.context.view_layer.update()
    graph = bpy.context.evaluated_depsgraph_get()
    mismatch = max(max((a-b).length for a, b in zip(points, world_points(loaded[identity], graph)))
                   for identity, points in bind.items())
    if mismatch > .00009:
        raise ValueError(f'Motion did not reset cleanly in {region}')
    print('VERIFIED_WALK_REGION', region, results, flush=True)
    return results


def main():
    if not REQUESTED_REGIONS <= set(MANIFEST['regions']):
        raise ValueError('Unknown walking region')
    report = {region: verify_region(region, item) for region, item in MANIFEST['regions'].items()
              if not REQUESTED_REGIONS or region in REQUESTED_REGIONS}
    (WORK / 'motion-walk-muscles-review.json').write_text(json.dumps(report, indent=2)+'\n', encoding='utf-8')


if __name__ == '__main__':
    main()
