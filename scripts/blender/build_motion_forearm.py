"""Build a bilateral forearm rotation teaching asset in Blender 4.5.

blender -b --factory-startup --disable-autoexec --python-exit-code 1 \
  --python scripts/blender/build_motion_forearm.py -- REPO OUTPUT_DIRECTORY

The five synchronized shapes share one fitted radioulnar axis per side.
Each shape preserves rigid bones and moves approximate muscle envelopes.
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
import numpy as np
from mathutils import Quaternion, Vector
from mathutils.bvhtree import BVHTree


REPO, WORK = (Path(arg).resolve() for arg in sys.argv[sys.argv.index('--') + 1:])
if WORK.is_relative_to(REPO):
    raise ValueError('Keep Blender work files and backups outside the repository.')
ASSETS = REPO / 'assets'
NAME = 'motion-forearm'
ANGLES = (12, 24, 36, 48, 60)
SIDES = {'r': 'right', 'l': 'left'}
SHORT_BICEPS = 'muscle-short-head-of-biceps-brachii'
GROUP_ROLES = (
    ('muscle-superficial-head-of-pronator-teres', 'pronator-teres'),
    ('muscle-deep-head-of-pronator-teres', 'pronator-teres'),
    ('muscle-pronator-quadratus', 'pronator-quadratus'),
    ('muscle-supinator', 'supinator'),
    ('muscle-long-head-of-biceps-brachii', 'biceps'),
    (SHORT_BICEPS, 'biceps'),
)


def digest(path):
    with path.open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()


def backup(inputs):
    stamp = datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S-%f')
    folder = WORK.parent / 'model-backups' / ('motion-forearm-' + stamp)
    folder.mkdir(parents=True)
    outputs = [WORK / (NAME + ext) for ext in ('.glb', '.json', '.blend')]
    destinations = [ASSETS / (NAME+ext) for ext in ('.glb', '.json')]
    records = []
    for category, paths in (('source', inputs), ('draft', outputs), ('previous', destinations)):
        for path in paths:
            record = {'original': str(path), 'existed': path.is_file()}
            if record['existed']:
                copy = folder / (category+'-'+path.name)
                shutil.copy2(path, copy)
                record.update(file=copy.name, sha256=digest(path), bytes=path.stat().st_size)
                if record['sha256'] != digest(copy):
                    raise RuntimeError('Model backup checksum did not match ' + str(path))
            records.append(record)
    commit = subprocess.check_output(['git','-C',str(REPO),'rev-parse','HEAD'],text=True).strip()
    (folder/'manifest.json').write_text(json.dumps({
        'reason':'Before authoring the separate forearm rotation model','git':commit,'files':records,
    },indent=2)+'\n',encoding='utf-8')
    print('VERIFIED_BACKUP',folder,flush=True)
    return folder


def to_web(point):
    return Vector((point.x, point.z, -point.y))


def to_blender(point):
    return Vector((point.x, -point.z, point.y))


def import_scene(path):
    before = set(bpy.context.scene.objects)
    bpy.ops.import_scene.gltf(filepath=str(path))
    bpy.context.view_layer.update()
    return [obj for obj in set(bpy.context.scene.objects)-before if obj.type=='MESH']


def bone_context(obj):
    return obj.get('zgroup')=='Bones of free part of upper limb.g' or obj.get('zname') in {'Scapula.r','Scapula.l'}


def preserve_world(obj):
    matrix = obj.matrix_world.copy()
    obj.parent = None
    obj.matrix_world = matrix


def positions(obj):
    return [to_web(obj.matrix_world @ vertex.co) for vertex in obj.data.vertices]


def faces(obj):
    return [tuple(poly.vertices) for poly in obj.data.polygons]


def tree(points, polygons):
    return BVHTree.FromPolygons(points, polygons, all_triangles=True)


def smooth(value, lower, upper):
    t = max(0, min(1, (value-lower)/(upper-lower)))
    return t*t*(3-2*t)


def fit_axis(radius, ulna):
    rp = np.array(positions(radius))
    up = np.array(positions(ulna))
    proximal = Vector(np.median(rp[rp[:,1]>=rp[:,1].max()-.013],axis=0))
    ulna_head = up[(up[:,1]>=up[:,1].min()+.002)&(up[:,1]<up[:,1].min()+.015)]
    distal = Vector(np.median(ulna_head,axis=0))
    distal.z -= .0019
    outer = Vector(np.median(rp[rp[:,1]<rp[:,1].min()+.016],axis=0))
    return proximal, distal, outer


def rotation(fit, degrees, side):
    pivot, ulnar_head, radial_centre = fit
    axis = (pivot-ulnar_head).normalized()
    turn = Quaternion(axis, math.radians(degrees if side=='r' else -degrees))
    moved = pivot+turn@(radial_centre-pivot)
    offset = moved-ulnar_head
    outward = (offset-axis*offset.dot(axis)).normalized()
    # A measured-order millimetre distal slide clears this source's coarse
    # joint meshes while preserving rigid bones and the proximal pivot.
    clearance = .0015*smooth(degrees,12,38)
    tilt = (moved-pivot).rotation_difference(moved+clearance*outward-pivot)
    return tilt@turn


def target_name(angle):
    return f'Forearm{angle}'


def build_shapes(obj, fit, side, influences=None):
    basis = obj.shape_key_add(name='Basis')
    world = obj.matrix_world.copy()
    inverse = world.inverted()
    pivot = fit[0]
    rest = [to_web(world @ vertex.co) for vertex in basis.data]
    for angle in ANGLES:
        transform = rotation(fit,angle,side)
        shape = obj.shape_key_add(name=target_name(angle))
        shape.value = 0.
        for index, point in enumerate(rest):
            weight = 1. if influences is None else influences[index]
            if weight<=0:
                continue
            turn = transform if weight>=1 else Quaternion().slerp(transform,weight)
            moved = pivot+turn@(point-pivot)
            shape.data[index].co = inverse@to_blender(moved)


def weights(part, points, radial, ulnar, humeral):
    values = []
    for v in points:
        dr = radial.find_nearest(v)[3]
        du = ulnar.find_nearest(v)[3]
        dh = humeral.find_nearest(v)[3]
        if part=='muscle-superficial-head-of-pronator-teres':
            weight = 1-smooth(v.y,1.006,1.091)
        elif part=='muscle-deep-head-of-pronator-teres':
            weight = 1-smooth(v.y,1.032,1.075)
        elif part=='muscle-long-head-of-biceps-brachii':
            weight = 1-smooth(v.y,1.077,1.188)
        elif part=='muscle-pronator-quadratus':
            weight = smooth(du-dr,-.005,.005)
        else:
            weight = smooth(min(du,dh)-dr,-.004,.004)
        values.append(weight)
    return values


def base_boxes(bones):
    return {name: (positions(bone),faces(bone)) for name,bone in bones.items()}


def near_attachment_indices(contact, own, other):
    # Anchor checks use tight nearest-surface clusters and exclude points where
    # two bones are essentially equidistant.
    index_set=[]
    for index, vertex in enumerate(contact):
        own_distance = min(target.find_nearest(vertex)[3] for target in own)
        other_distance = min(target.find_nearest(vertex)[3] for target in other)
        if own_distance<.002 and other_distance>own_distance+.002:
            index_set.append(index)
    return index_set


def validate_motion(side, fit, atlas_bones):
    rp,rf=atlas_bones['Radius']
    static = [tree(*atlas_bones[name]) for name in ('Ulna','Humerus')]
    for i in range(31):
        degrees=i*2
        low=max(angle for angle in (0,*ANGLES) if angle<=degrees)
        high=min(angle for angle in (0,*ANGLES) if angle>=degrees)
        from_pose=rotation(fit,low,side)
        into_pose=rotation(fit,high,side)
        t=(degrees-low)/(high-low) if low!=high else 0.
        pivot=fit[0]
        posed = [pivot+(from_pose@(p-pivot)).lerp(into_pose@(p-pivot),t) for p in rp]
        radius=tree(posed,rf)
        if any(radius.overlap(bone) for bone in static):
            raise ValueError(f'Radial collision at {degrees}° {side}.')
    return {
        'radialHead': list(fit[0]),
        'distalUlnarHeadAxisPoint': list(fit[1]),
        'maximumRotationDegrees': ANGLES[-1],
        'maxDistalClearanceMillimeters': 1.5,
        'sampledNoBoneIntersectionAtDegrees': list(range(0,61,2)),
    }


def material(name, color):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color,1.)
    mat.use_nodes = True
    node = mat.node_tree.nodes.get('Principled BSDF')
    node.inputs['Base Color'].default_value = mat.diffuse_color
    node.inputs['Roughness'].default_value = .75
    return mat


def style(obj, mat):
    obj.data.materials.clear()
    obj.data.materials.append(mat)
    for poly in obj.data.polygons:
        poly.material_index=0


def build_clip():
    rise=[(round(2.2*math.acos(1-2*angle/60)/math.pi,4),angle) for angle in (0,*ANGLES)]
    timeline=rise+[(round(4.9-time,4),angle) for time,angle in reversed(rise)]
    return {
        'id':'forearm-rotation','name':'Pronation & supination','duration':4.9,
        'morphInterpolation':'linear',
        'morphTracks': {target_name(angle): [[t,1 if current==angle else 0] for t,current in timeline]
                        for angle in ANGLES},
        'phases': [
            {'start':0,'label':'Pronation','detail':'Pronator teres and pronator quadratus turn the radius over the ulna through 60°. Watch the wrist and both elbow ends.','active':['pronator-teres','pronator-quadratus'],'opposes':['supinator','biceps']},
            {'start':2.2,'label':'Pause in pronation','detail':'Compare the radius and ulna while the pose is held. This pause depicts position only.','active':[],'opposes':[]},
            {'start':2.7,'label':'Supination','detail':'Supinator and biceps brachii act in the return direction. Biceps generally has greater leverage for supination when the elbow is flexed.','active':['supinator','biceps'],'opposes':['pronator-teres','pronator-quadratus']},
        ],
    }


def main():
    WORK.mkdir(parents=True,exist_ok=True)
    atlas=REPO/'src'/'muscle-models.json'
    skeleton=ASSETS/'skeleton.glb'
    packs=[ASSETS/f'muscles-{region}.glb' for region in ('forearm-hand','shoulder-arm')]
    inputs=[skeleton,*packs,atlas,ASSETS/'MODEL-LICENSE.md']
    saved=backup(inputs)
    inputs_before={file.name:digest(file) for file in inputs}
    components={r['id']:r for r in json.loads(atlas.read_text(encoding='utf-8'))['components']}
    expected={part+'-'+side:(part,role) for part,role in GROUP_ROLES for side in SIDES}
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bones={obj['zname']:obj for obj in import_scene(skeleton) if bone_context(obj)}
    if len(bones)!=62:
        raise RuntimeError('Complete bilateral arm/hand bone geometry is required.')
    muscle_objects={obj['muscleId']:obj for file in packs for obj in import_scene(file) if obj.get('muscleId') in expected}
    if set(muscle_objects)!=set(expected):
        raise RuntimeError('The forearm lesson is missing named source anatomy.')
    anatomy=set(bones.values())|set(muscle_objects.values())
    for obj in anatomy:
        preserve_world(obj)
    for obj in list(bpy.context.scene.objects):
        if obj not in anatomy:
            bpy.data.objects.remove(obj,do_unlink=True)
    bpy.context.view_layer.update()
    mat_bone=material('Fixed bone',(.62,.61,.53))
    mat_radius=material('Rotating radius',(.71,.75,.68))
    mat_hand=material('Hand',(.56,.62,.58))
    mat_muscle=material('Named muscle',(.54,.26,.20))
    output_components=[]
    checks={}
    for side, title in SIDES.items():
        joint_bones={name:bones[name+'.'+side] for name in ('Humerus','Radius','Ulna')}
        fit=fit_axis(joint_bones['Radius'],joint_bones['Ulna'])
        before=base_boxes(joint_bones)
        checks[title]=validate_motion(side,fit,before)
        radial,ulnar,humeral=(tree(*before[key]) for key in ('Radius','Ulna','Humerus'))
        scapula=bones['Scapula.'+side]
        scapular=tree(positions(scapula),faces(scapula))
        contacts={}
        for label,obj in bones.items():
            if not label.endswith('.'+side):
                continue
            name=label[:-2]
            obj.name=f'{title.title()} {name}'
            obj['motionContext']=f'{name} · {title}'
            if name in ('Humerus','Ulna','Scapula'):
                style(obj,mat_bone)
            else:
                style(obj,mat_radius if name=='Radius' else mat_hand)
                build_shapes(obj,fit,side)
        for identity,obj in muscle_objects.items():
            if not identity.endswith('-'+side):
                continue
            part,role=expected[identity]
            component=components[identity]
            name=component['name']
            obj.name=f'{title.title()} {name}'
            obj['muscleId']=identity
            obj['motionPart']=name
            obj['motionSide']=title
            obj['motionMuscle']=role
            style(obj,mat_muscle)
            if part==SHORT_BICEPS:
                note='The short-head belly is labeled separately. The common distal biceps tendon is represented with the long-head surface.'
                modeling='regional-context'
            else:
                points=positions(obj)
                influence=weights(part,points,radial,ulnar,humeral)
                if min(influence)>.25 or max(influence)<.80:
                    raise ValueError('Insufficient fixed and moving geometry for '+identity)
                build_shapes(obj,fit,side,influence)
                obj['motionDeformationTarget']=target_name(ANGLES[-1])
                distal=near_attachment_indices(points,[radial],[ulnar,humeral])
                fixed_origins={'muscle-superficial-head-of-pronator-teres':[humeral],
                               'muscle-supinator':[ulnar,humeral],
                               'muscle-long-head-of-biceps-brachii':[scapular]}
                origin=near_attachment_indices(points,fixed_origins.get(part,[ulnar]),[radial])
                contacts[identity]={
                    'nearRadiusSurfaceSamples':len(distal),
                    'stronglyRotatingRadialSamples':sum(influence[index]>.90 for index in distal),
                    'nearFixedOriginSurfaceSamples':len(origin),
                    'mostlyFixedOriginSamples':sum(influence[index]<.10 for index in origin),
                }
                note='Atlas-derived attachment neighborhoods guide this approximate muscle envelope.'
                modeling='guided-morph'
            output_components.append({'id':identity,'name':name,'side':title,'role':role,'note':note,'modeling':modeling})
        checks[title]['attachmentNeighborhoods']=contacts
    model=WORK/(NAME+'.glb')
    bpy.context.preferences.filepaths.save_version=0
    bpy.ops.wm.save_as_mainfile(filepath=str(WORK/(NAME+'.blend')),compress=True)
    bpy.ops.export_scene.gltf(filepath=str(model),export_format='GLB',export_extras=True,export_yup=True,
                              export_animations=False,export_morph=True,
                              export_draco_mesh_compression_enable=True,export_draco_mesh_compression_level=6)
    with model.open('rb') as stream:
        header=stream.read(20)
        document=json.loads(stream.read(struct.unpack_from('<I',header,12)[0]))
    ids={node.get('extras',{}).get('muscleId') for node in document['nodes'] if 'mesh' in node}
    if ids-{None}!=set(expected) or inputs_before!={file.name:digest(file) for file in inputs}:
        raise ValueError('GLB export altered identities or a source input.')
    manifest={
        'region':'forearm','asset':model.name,'sha256':digest(model),'bytes':model.stat().st_size,
        'camera':{'target':[0.,1.004,-.014],'direction':[.11,.14,1.],'diameter':.84},
        'sources':{'openstax':'https://openstax.org/books/anatomy-and-physiology-2e/pages/9-5-types-of-body-movements',
                   'study':'https://pubmed.ncbi.nlm.nih.gov/20696507/',
                   'attachments':'https://pubmed.ncbi.nlm.nih.gov/16078622/',
                   'forearmMomentArms':'https://pubmed.ncbi.nlm.nih.gov/16678316/'},
        'evidence':'Anatomical teaching motion. Highlights show possible roles for the demonstrated direction.',
        'scope':'Bilateral 60° forearm rotation from the atlas starting pose with the humerus and ulna held fixed. The radius and hand rotate together. The tissue envelopes illustrate approximate shape change. Highlights describe the mechanical role for the direction shown.',
        'components':output_components,'clips':[build_clip()],'checks':checks,'inputs':inputs_before,
    }
    (WORK/(NAME+'.json')).write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
    print('FOREARM_EXPORTED',model,model.stat().st_size,saved,flush=True)


if __name__=='__main__':
    main()
