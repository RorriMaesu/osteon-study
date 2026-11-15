"""Build the additive whole-body posing specimen with Blender 4.5.

Inputs are immutable. A verified snapshot precedes every build. This rig is an
atlas-derived teaching envelope, not a musculoskeletal force simulation.
"""
import hashlib
import json
import math
import re
import shutil
import struct
import sys
from datetime import datetime, timezone
from pathlib import Path

import bpy
import numpy as np
from mathutils import Vector
from mathutils.bvhtree import BVHTree

REPO, WORK = [Path(p).resolve() for p in sys.argv[sys.argv.index('--')+1:]]
if WORK.is_relative_to(REPO):
    raise ValueError('Keep editable Blender files and backups outside the repo.')
ASSETS = REPO/'assets'
NAME = 'motion-pose-body'
read = lambda path: json.loads(path.read_text(encoding='utf-8'))
web = lambda point: Vector((point.x,point.z,-point.y))
blender = lambda point: Vector((point[0],-point[2],point[1]))
SIDES = {'right':'r','left':'l'}
ORDINALS = ['first','second','third','fourth','fifth']
DIGITS = ['thumb','index','middle','ring','little']
ATLAS = read(REPO/'src/muscle-models.json')
PARTS = {p['id']:p for p in ATLAS['components'] if p['kind']=='muscle' and not p.get('retired')}
LOWER = read(ASSETS/'motion-legs.json')
UPPER = read(ASSETS/'motion-walk-context.json')
FOREARM = read(ASSETS/'motion-forearm.json')
DRIVERS = read(ASSETS/'motion-walk-muscles.json')
JAW_LANDMARK = read(REPO/'src/three-d-landmarks.json')['mandibular-condyle']['point']
JOINTS, NODES, BONE_BINDINGS, BONE_MESHES, MUSCLES, MORPHS = [], {}, {}, {}, {}, {}
REGIONAL_REPLACEMENTS = set()

def digest(path):
    with path.open('rb') as stream:
        return hashlib.file_digest(stream,'sha256').hexdigest()

def snapshot(inputs):
    stamp = datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S-%f')
    root = WORK.parent/'model-backups'/('motion-pose-body-'+stamp)
    root.mkdir(parents=True)
    rows = []
    for category,paths in [('input',inputs),('output',[ASSETS/(NAME+'.glb'),ASSETS/(NAME+'.json'),WORK/(NAME+'.blend')])]:
        for path in paths:
            if not path.is_file():
                continue
            copy = root/(category+'-'+path.name)
            shutil.copy2(path,copy)
            sha = digest(path)
            if digest(copy)!=sha:
                raise RuntimeError('Backup checksum mismatch '+str(path))
            rows.append({'original':str(path),'file':copy.name,'sha256':sha,'bytes':path.stat().st_size})
    (root/'manifest.json').write_text(json.dumps({'reason':'Before additive whole-body pose rig authoring','files':rows},indent=2)+'\n')
    print('VERIFIED_BACKUP',root,flush=True)
    return root

def import_file(path):
    before=set(bpy.context.scene.objects)
    if path.name=='course-tissues.glb':
        # The legacy source has a second empty scene, which Blender's importer
        # rejects. Normalize a staging copy only; source geometry is untouched.
        data=path.read_bytes()
        length=struct.unpack_from('<I',data,12)[0]
        doc=json.loads(data[20:20+length])
        doc['scenes']=[doc['scenes'][doc.get('scene',0)]]
        doc['scene']=0
        encoded=json.dumps(doc,separators=(',',':')).encode()
        encoded+=b' '*((-len(encoded))%4)
        chunks=struct.pack('<I4s',len(encoded),b'JSON')+encoded+data[20+length:]
        path=WORK/'pose-course-tissues-import.glb'
        path.write_bytes(struct.pack('<4sII',b'glTF',2,12+len(chunks))+chunks)
    bpy.ops.import_scene.gltf(filepath=str(path))
    bpy.context.view_layer.update()
    return [o for o in set(bpy.context.scene.objects)-before if o.type=='MESH']

def keep_world(obj):
    world=obj.matrix_world.copy()
    obj.parent=None
    obj.matrix_world=world
    for modifier in list(obj.modifiers):
        if modifier.type=='ARMATURE': obj.modifiers.remove(modifier)

def points(obj):
    return [web(obj.matrix_world@v.co) for v in obj.data.vertices]

def center(obj):
    p=np.asarray(points(obj))
    return Vector(np.median(p,axis=0))

def end(obj,direction):
    pts=points(obj)
    ordered=sorted(pts,key=lambda p:p.dot(direction))
    n=max(6,len(ordered)//10)
    return sum(ordered[-n:],Vector())/n

def joint_gap(parent,child):
    direction=(center(child)-center(parent)).normalized()
    return (end(parent,direction)+end(child,-direction))/2

def tree(obj):
    return BVHTree.FromPolygons(points(obj),[tuple(p.vertices) for p in obj.data.polygons],all_triangles=True)

def combined_tree(objects):
    vertices,faces=[],[]
    for obj in objects:
        offset=len(vertices)
        vertices.extend(points(obj))
        faces.extend(tuple(offset+i for i in polygon.vertices) for polygon in obj.data.polygons)
    return BVHTree.FromPolygons(vertices,faces,all_triangles=True)

def attachment_axis(positions,mobile,fixed):
    def ratio(point):
        md=mobile.find_nearest(point)[3]
        fd=fixed.find_nearest(point)[3]
        return fd/max(.00001,md+fd)
    ordered=sorted(positions,key=ratio)
    n=max(8,len(ordered)//7)
    origin=sum(ordered[:n],Vector())/n
    insertion=sum(ordered[-n:],Vector())/n
    direction=insertion-origin
    length=direction.length
    if length<.004:raise RuntimeError('Cannot resolve attachment direction')
    return origin,direction.normalized(),length

def smooth(value,low,high):
    t=max(0.,min(1.,(value-low)/(high-low)))
    return t*t*(3-2*t)

def axis(identifier,label,low,high,vector=None,unit='degrees'):
    return dict(id=identifier,label=label,min=low,max=high,neutral=0,vector=list(vector) if vector else None,unit=unit)

def node(identifier,pivot,parent=None):
    if identifier in NODES: raise ValueError(identifier)
    NODES[identifier]={'id':identifier,'name':'Pose_'+identifier,'pivot':list(pivot),'parent':parent}
    return identifier

def joint(identifier,label,region,side,pivot,parent,axes,**kwargs):
    node(identifier,pivot,parent)
    if identifier.endswith('-shoulder'):
        for entry in axes:
            if entry['id']=='abduction':entry['requiresUnlocked']=[side+'-scapula']
    row=dict(id=identifier,label=label,region=region,side=side,node=NODES[identifier]['name'],axes=axes,**kwargs)
    JOINTS.append(row)
    return identifier

def bone(name):
    return BONE_MESHES[name]

def add_rig():
    node('pelvis',LOWER['neutral']['pelvis'])
    # Lumbar motion is distributed across five intervertebral levels.
    lumbar=[]
    parent='pelvis'
    for level in [5,4,3,2,1]:
        identifier='lumbar-'+str(level)
        obj=bone('Vertebra L'+str(level))
        pivot=end(obj,Vector((0,-1,0)))
        node(identifier,pivot,parent)
        BONE_BINDINGS[obj]=identifier
        lumbar.append(identifier)
        parent=identifier
    joint('trunk','Trunk','trunk','midline',UPPER['pelvisRest'],None,[axis('flexion','Forward / backward bend',-12,25,[1,0,0]),axis('lateral','Left / right bend',-15,15,[0,0,1]),axis('rotation','Left / right turn',-15,15,[0,-1,0])],distribute=lumbar,virtual=True,marker=[0,1.12,.11])
    node('thorax',[0,1.16,-.035],parent)
    # C7 through C1 form a coupled neck chain, rather than one hinge at the base.
    cervical=[]
    parent='thorax'
    for level in [7,6,5,4,3,2,1]:
        label='Atlas (C1)' if level==1 else 'Axis (C2)' if level==2 else 'Vertebra C'+str(level)
        obj=bone(label)
        identifier='cervical-'+str(level)
        node(identifier,end(obj,Vector((0,-1,0))),parent)
        BONE_BINDINGS[obj]=identifier
        cervical.append(identifier)
        parent=identifier
    node('head',[0,1.52,-.035],parent)
    joint('neck','Neck','head-neck','midline',[0,1.48,-.045],None,[axis('flexion','Look down / up',-20,25,[1,0,0]),axis('lateral','Tilt left / right',-20,20,[0,0,1]),axis('rotation','Turn left / right',-45,45,[0,-1,0])],distribute=cervical,virtual=True,marker=[0,1.51,.02])
    jaw_pivot=[0,JAW_LANDMARK[1]-.0015,JAW_LANDMARK[2]+.0015]
    joint('jaw','Jaw','head-neck','midline',jaw_pivot,'head',[axis('opening','Open / close',0,15,[1,0,0])],marker=[0,1.50,.077],morphs={'opening':{'JawOpen':1/15}},translation=[0,-.0048,.0075],morphBones=True)
    for identifier,label,key,marker in [('face-blink','Eyelids','Blink',[0,1.594,.084]),('face-smile','Smile','Smile',[0,1.54,.08])]:
        aid='closure' if identifier=='face-blink' else 'smile'
        joint(identifier,label,'head-neck','bilateral',marker,'head',[axis(aid,label,0,100,unit='percent')],morphs={aid:{key:.01}},virtual=True)
    joint('breathing','Breathing','trunk','midline',[0,1.22,.12],'thorax',[axis('inhale','Inhale',0,100,unit='percent'),axis('exhale','Forced exhale',0,100,unit='percent')],morphs={'inhale':{'Inhale':.01},'exhale':{'ForcedExhale':.01}},virtual=True)
    for side,suffix in SIDES.items():
        right=side=='right'
        sign=-1 if right else 1
        s=lambda name:name+'.'+suffix
        title=side.title()
        clav=bone(s('Clavicle'))
        scap=bone(s('Scapula'))
        medial=end(clav,Vector((-sign,0,0)))
        joint(side+'-scapula',title+' shoulder girdle',side+'-arm',side,medial,'thorax',[axis('elevation','Shoulder elevation',-6,10,[0,0,sign]),axis('protraction','Reach forward / back',-10,10,[0,-sign,0])],marker=list(center(scap)),coupling='Clavicle and scapula move together as a teaching approximation.')
        BONE_BINDINGS[clav]=side+'-scapula'
        BONE_BINDINGS[scap]=side+'-scapula'
        shoulder=Vector(DRIVERS['driverRest'][UPPER['joints'][side]['shoulder']])
        elbow=Vector(DRIVERS['driverRest'][UPPER['joints'][side]['elbow']])
        joint(side+'-shoulder',title+' shoulder',side+'-arm',side,shoulder,side+'-scapula',[axis('flexion','Forward / backward',-20,90,[-1,0,0]),axis('abduction','Arm out / in',0,90,[0,0,sign]),axis('rotation','Internal / external rotation',-30,30,[0,-sign,0])],endpoint=side+'-wrist')
        joint(side+'-elbow',title+' elbow',side+'-arm',side,elbow,side+'-shoulder',[axis('flexion','Bend / straighten',0,115,UPPER['axes'][side]['elbow'])],endpoint=side+'-wrist')
        BONE_BINDINGS[bone(s('Humerus'))]=side+'-shoulder'
        BONE_BINDINGS[bone(s('Ulna'))]=side+'-elbow'
        fits=FOREARM['checks'][side]
        radial=Vector(fits['radialHead'])
        distal=Vector(fits['distalUlnarHeadAxisPoint'])
        radial_points=np.asarray(points(bone(s('Radius'))))
        radial_end=Vector(np.median(radial_points[radial_points[:,1]<radial_points[:,1].min()+.016],axis=0))
        turn=(radial-distal).normalized()*(1 if right else -1)
        joint(side+'-forearm',title+' forearm',side+'-arm',side,radial,side+'-elbow',[axis('pronation','Pronation / return to supination',0,60,turn)],marker=list(radial.lerp(distal,.7)),endpoint=side+'-wrist',detail='The rest hand is already supinated. Increasing this angle pronates; returning toward zero supinates.',forearmClearance={'distalUlna':list(distal),'distalRadius':list(radial_end),'millimeters':1.5})
        BONE_BINDINGS[bone(s('Radius'))]=side+'-forearm'
        wrist=joint_gap(bone(s('Radius')),bone(s('Lunate bone')))
        joint(side+'-wrist',title+' wrist',side+'-arm',side,wrist,side+'-forearm',[axis('flexion','Palm / back bend',-35,45,UPPER['axes'][side]['elbow']),axis('deviation','Radial / ulnar deviation',-12,18,[0,0,-sign])])
        for index,(ordinal,digit) in enumerate(zip(ORDINALS,DIGITS)):
            proximal=bone(s('Proximal phalanx of '+ordinal+' finger of hand'))
            meta=bone(s(ordinal.title()+' metacarpal bone'))
            parent=side+'-wrist'
            if digit=='thumb':
                ray=(center(proximal)-center(meta)).normalized()
                palm_axis=ray.cross(Vector((0,0,1))).normalized()
                parent=joint(side+'-thumb-cmc',title+' thumb base',side+'-arm',side,joint_gap(bone(s('Trapezium bone')),meta),parent,[axis('flexion','Move across palm',0,25,[0,0,-sign]),axis('abduction','Lift away from palm',0,25,palm_axis)],detail='Limited thumb-base teaching range; opposition is a coupled motion.')
            BONE_BINDINGS[meta]=parent
            levels=[('mcp',proximal)]
            if digit!='thumb':levels.append(('pip',bone(s('Middle phalanx of '+ordinal+' finger of hand'))))
            levels.append(('ip' if digit=='thumb' else 'dip',bone(s('Distal phalanx of '+ordinal+' finger of hand'))))
            previous=meta
            for level,obj in levels:
                pivot=joint_gap(previous,obj)
                direction=(center(obj)-center(previous)).normalized()
                bend_axis=direction.cross(Vector((-sign,0,0)) if digit=='thumb' else Vector((0,0,1))).normalized()
                identifier=side+'-'+digit+'-'+level
                channels=[axis('flexion','Bend / straighten',0,60 if level=='mcp' else 70,bend_axis)]
                detail='An atlas-fitted hinge approximation; joint surface sliding is not simulated.'
                if level=='mcp' and digit!='thumb':
                    # The middle finger defines the digital midline. Its radial
                    # excursion is abducted by dorsal interosseous II; returning
                    # from that excursion can use dorsal interosseous III.
                    radial=digit in {'index','middle'}
                    channels.append(axis('abduction','Spread toward thumb / return' if radial else 'Spread outward / return',0,15 if digit=='index' else 12,[0,0,sign if radial else -sign]))
                    detail+=' Finger spread is easiest with the MCP joint near straight; these bounded teaching axes do not model collateral-ligament tightening.'
                joint(identifier,title+' '+digit+' '+level.upper(),side+'-arm',side,pivot,parent,channels,detail=detail)
                BONE_BINDINGS[obj]=identifier
                parent=identifier
                previous=obj
        chain=LOWER['neutral'][side]
        joint(side+'-hip',title+' hip',side+'-leg',side,chain['hip'],'pelvis',[axis('flexion','Forward / backward',-20,85,[-1,0,0]),axis('abduction','Leg out / in',0,35,[0,0,sign]),axis('rotation','Internal / external rotation',-20,20,[0,-sign,0])],endpoint=side+'-ankle')
        joint(side+'-knee',title+' knee',side+'-leg',side,chain['knee'],side+'-hip',[axis('flexion','Bend / straighten',0,85,[1,0,0])],endpoint=side+'-ankle')
        node(side+'-patella',chain['knee'],side+'-hip')
        joint(side+'-ankle',title+' ankle',side+'-leg',side,chain['ankle'],side+'-knee',[axis('dorsiflexion','Toes up / down',-35,23,[-1,0,0])])
        talus=bone(s('Talus'))
        heel=bone(s('Calcaneus'))
        forward=center(bone(s('Second metatarsal bone')))-center(heel)
        forward.y=0
        forward.normalize()
        medial=Vector((0,1,0)).cross(forward)*(1 if right else -1)
        horizontal=forward*math.cos(math.radians(16))+medial*math.sin(math.radians(16))
        subtalar_axis=(horizontal*math.cos(math.radians(42))+Vector((0,math.sin(math.radians(42)),0)))*(1 if right else -1)
        joint(side+'-subtalar',title+' hindfoot',side+'-leg',side,joint_gap(talus,heel),side+'-ankle',[axis('inversion','Sole inward / outward',-8,15,subtalar_axis)],marker=list(center(heel)),detail='Inversion and eversion occur below the talus, not by tilting the tibia. The oblique hindfoot axis and rigid midfoot coupling are teaching approximations; individual joint axes vary.')
        BONE_BINDINGS[talus]=side+'-ankle'
        joint(side+'-toes',title+' toes',side+'-leg',side,chain['toe'],side+'-subtalar',[axis('extension','Lift / curl toes',-15,35,[-1,0,0])],detail='The five toe rays move together in this teaching control.')
        BONE_BINDINGS[bone(s('Femur'))]=side+'-hip'
        BONE_BINDINGS[bone(s('Tibia'))]=side+'-knee'
        BONE_BINDINGS[bone(s('Fibula'))]=side+'-knee'
        BONE_BINDINGS[bone(s('Patella'))]=side+'-patella'

def bone_binding(obj):
    if obj in BONE_BINDINGS:return BONE_BINDINGS[obj]
    name=obj.get('zname','')
    group=obj.get('zgroup','')
    side='right' if name.endswith('.r') else 'left' if name.endswith('.l') else None
    if group=='Bones of free part of upper limb.g':return side+'-wrist'
    if group=='Phalanges of foot.g':return side+'-toes'
    if group in {'Tarsal bones.g','Metatarsal bones.g','Bones of foot.g'}:return side+'-subtalar'
    if group=='Bones of pelvic girdle.g' or name in {'Sacrum','Coccyx'}:return 'pelvis'
    if name=='Mandible' or name.startswith('Lower '):return 'jaw'
    if group in {'Bones of cranium.g','Extracranial bones of head.g','Frontal bone','Sphenoid bone','Auditory ossicles.g','Anterior teeth.g','Posterior teeth.g','Nasal cartilages.g'}:return 'head'
    if group=='Laryngeal cartilages.g':return 'cervical-5'
    return 'thorax'

def import_sources():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    for obj in import_file(ASSETS/'skeleton.glb'):
        name=obj.get('zname')
        if not name:continue
        keep_world(obj)
        BONE_MESHES[name]=obj
    for obj in import_file(ASSETS/'course-tissues.glb'):
        name=obj.get('zname','')
        if name.startswith('Intervertebral disc '):
            keep_world(obj)
            obj['poseSupport']='disc'
            BONE_MESHES[name]=obj
    for path in [ASSETS/'motion-legs.glb',*(ASSETS/v['file'] for v in DRIVERS['regions'].values())]:
        for obj in import_file(path):
            identifier=obj.get('muscleId')
            if obj.get('motionKind')=='support' and obj.get('motionAnklePlantar'):
                keep_world(obj)
                obj['poseSupport']='tendon'
                BONE_MESHES[obj['zname']]=obj
            if identifier in PARTS and identifier not in MUSCLES:
                keep_world(obj)
                MUSCLES[identifier]=obj
    if set(MUSCLES)!=set(PARTS):raise RuntimeError('Missing pose muscles '+str(set(PARTS)-set(MUSCLES)))
    # Preserve the already-reviewed local shapes. Matching atlas identities keep
    # names stable while the canonical armature supplies global body transforms.
    for region in ['blink','smile','jaw','breath']:
        for obj in import_file(ASSETS/('motion-'+region+'.glb')):
            keys=obj.data.shape_keys
            if not keys or len(keys.key_blocks)<2:continue
            identifier=obj.get('muscleId')
            label=obj.get('zname') or obj.get('motionBone') or obj.get('motionContext')
            if identifier in PARTS:
                previous=MUSCLES[identifier]
                if previous.data.shape_keys and len(previous.data.shape_keys.key_blocks)>1:
                    # These regional assets retain the original atlas topology.
                    if len(previous.data.vertices)!=len(obj.data.vertices):raise RuntimeError('Incompatible regional shapes '+identifier)
                    for key in keys.key_blocks[1:]:
                        output=previous.shape_key_add(name=key.name)
                        for target,source in zip(output.data,key.data):target.co=previous.matrix_world.inverted()@(obj.matrix_world@source.co)
                else:
                    keep_world(obj)
                    MUSCLES[identifier]=obj
                REGIONAL_REPLACEMENTS.add(identifier)
            elif region=='breath' and label in BONE_MESHES:
                keep_world(obj)
                BONE_MESHES[label]=obj
    kept=set(BONE_MESHES.values())|set(MUSCLES.values())
    for obj in list(bpy.context.scene.objects):
        if obj not in kept:bpy.data.objects.remove(obj,do_unlink=True)
    bpy.context.view_layer.update()

def armature():
    data=bpy.data.armatures.new('Osteon whole-body pose joints')
    rig=bpy.data.objects.new('OsteonPoseRig',data)
    bpy.context.collection.objects.link(rig)
    bpy.ops.object.select_all(action='DESELECT')
    rig.select_set(True)
    bpy.context.view_layer.objects.active=rig
    bpy.ops.object.mode_set(mode='EDIT')
    for identifier,row in NODES.items():
        b=data.edit_bones.new(row['name'])
        b.head=blender(row['pivot'])
        b.tail=b.head+Vector((0,0,.025))
        b.use_deform=True
    for identifier,row in NODES.items():
        if row['parent']:data.edit_bones[row['name']].parent=data.edit_bones[NODES[row['parent']]['name']]
    bpy.ops.object.mode_set(mode='OBJECT')
    return rig

def old_driver(name):
    name=name.removeprefix('WalkSurface_')
    if name=='MotionPelvis':return 'pelvis'
    if name=='MotionTorso':return 'thorax'
    if name=='MotionWalkHead':return 'head'
    match=re.fullmatch(r'MotionWalk(Shoulder|Elbow)(Right|Left)',name)
    if match:return match[2].lower()+'-'+match[1].lower()
    match=re.fullmatch(r'Motion(Hip|Knee|Ankle|Toe|Patella)(L|R)',name)
    if match:return ('left' if match[2]=='L' else 'right')+'-'+{'Toe':'toes'}.get(match[1],match[1].lower())
    return None

def merged(weights):
    total=sum(weights.values())
    if total<=0:raise ValueError('Empty skin influence')
    return {k:v/total for k,v in weights.items() if v>1e-8}

def replace_weight(weights,source,targets):
    value=weights.pop(source,0.)
    for name,weight in targets.items():weights[name]=weights.get(name,0.)+value*weight

def distributed(weights,point):
    # Adjacent lumbar/neck skin nodes prevent all back and neck muscles from
    # being frozen to one segment while the articulated vertebrae move beneath.
    for source,ids in [('thorax',['pelvis','lumbar-5','lumbar-4','lumbar-3','lumbar-2','lumbar-1','thorax']),('head',['thorax',*['cervical-'+str(i) for i in range(7,0,-1)],'head'])]:
        if source not in weights:continue
        ordered=sorted(ids,key=lambda key:NODES[key]['pivot'][1])
        y=point.y
        if y<=NODES[ordered[0]]['pivot'][1]:targets={ordered[0]:1.}
        elif y>=NODES[ordered[-1]]['pivot'][1]:targets={ordered[-1]:1.}
        else:
            pair=next((a,b) for a,b in zip(ordered,ordered[1:]) if NODES[a]['pivot'][1]<=y<=NODES[b]['pivot'][1])
            a,b=pair
            t=smooth(y,NODES[a]['pivot'][1],NODES[b]['pivot'][1])
            targets={a:1-t,b:t}
        replace_weight(weights,source,targets)
    return weights

def hand_influences(side,point,closest_bones):
    nearest=sorted(((lookup.find_nearest(point)[3],identifier) for identifier,lookup in closest_bones),key=lambda item:item[0])[:2]
    values={}
    for distance,identifier in nearest:values[identifier]=values.get(identifier,0.)+1/max(.0015,distance)**3
    return merged(values)

def bind_mesh(obj,rig,weights):
    neutral=points(obj)
    obj['poseNeutralBounds']=[min(p[axis] for p in neutral) for axis in range(3)]+[max(p[axis] for p in neutral) for axis in range(3)]
    obj.vertex_groups.clear()
    groups={}
    for index,amounts in enumerate(weights):
        # glTF has four primary joint slots. Prune only negligible extra values,
        # retaining a normalized primary skin so every vertex stays attached.
        amounts=merged(dict(sorted(amounts.items(),key=lambda kv:kv[1],reverse=True)[:4]))
        for identifier,value in amounts.items():
            if identifier not in NODES:raise ValueError(identifier)
            if identifier not in groups:groups[identifier]=obj.vertex_groups.new(name=NODES[identifier]['name'])
            groups[identifier].add([index],value,'REPLACE')
    world=obj.matrix_world.copy()
    obj.parent=rig
    obj.matrix_world=world
    modifier=obj.modifiers.new('Atlas pose attachment envelopes','ARMATURE')
    modifier.object=rig
    obj['poseDrivers']=sorted(groups)
    return list(groups)

def bind_all(rig):
    trees={name:tree(obj) for name,obj in BONE_MESHES.items() if name in {'Mandible','Hyoid bone'} or any(word in name for word in ('Radius.','Ulna.','Humerus.','phalanx','metacarpal'))}
    hand_bones={side:[(BONE_BINDINGS.get(obj,side+'-wrist'),trees[name]) for name,obj in BONE_MESHES.items() if name.endswith('.'+suffix) and name in trees and ('hand' in name or 'metacarpal' in name)] for side,suffix in SIDES.items()}
    girdle_names={'Serratus anterior muscle','Pectoralis minor muscle','Trapezius muscle','Rhomboid major muscle','Rhomboid minor muscle','Levator scapulae','Levator scapulae muscle','Subclavius muscle'}
    crossing_shoulder={'Deltoid muscle','Supraspinatus muscle','Infraspinatus muscle','Subscapularis muscle','Teres minor muscle','Teres major muscle','Coracobrachialis muscle','Pectoralis major muscle','Latissimus dorsi muscle'}
    hamstrings={'Biceps femoris muscle','Semimembranosus muscle','Semitendinosus muscle'}
    scapular={side:combined_tree([bone('Scapula.'+suffix),bone('Clavicle.'+suffix)]) for side,suffix in SIDES.items()}
    fixed_trunk=combined_tree([obj for name,obj in BONE_MESHES.items() if name.startswith(('Vertebra ','Atlas ','Axis ')) or 'rib.' in name or name=='Occipital bone'])
    for label,obj in BONE_MESHES.items():
        identifier=bone_binding(obj)
        if obj.get('poseSupport')=='disc':
            upper,lower=label.removeprefix('Intervertebral disc ').split('-')
            segment=lambda code:{'C':'cervical-','L':'lumbar-'}.get(code[0],'')+code[1:] if code[0] in 'CL' else 'pelvis' if code[0]=='S' else 'thorax'
            top,bottom=segment(upper),segment(lower)
            coordinates=points(obj)
            low,high=min(p.y for p in coordinates),max(p.y for p in coordinates)
            weights=[]
            for p in coordinates:
                t=smooth(p.y,low,high)
                weights.append({top:1.} if top==bottom else {top:t,bottom:1-t})
            bind_mesh(obj,rig,weights)
            identifier=top
        elif obj.get('poseSupport')=='tendon':
            original={g.index:old_driver(g.name) for g in obj.vertex_groups}
            weights=[{original[g.group]:g.weight for g in v.groups if original.get(g.group)} for v in obj.data.vertices]
            for row in weights:
                for side in SIDES:replace_weight(row,side+'-ankle',{side+'-subtalar':1.})
            bind_mesh(obj,rig,weights)
            identifier=obj['motionSide']+'-ankle'
        else:bind_mesh(obj,rig,[{identifier:1.}]*len(obj.data.vertices))
        obj['poseBone']=label
        obj['poseRegion']='head-neck' if identifier in {'head','jaw'} or identifier.startswith('cervical-') else 'trunk' if identifier in {'thorax','pelvis'} or identifier.startswith('lumbar-') else identifier.rsplit('-',1)[0]+'-'+('arm' if any(x in identifier for x in ('shoulder','wrist','elbow','forearm','scapula','thumb','index','middle','ring','little')) else 'leg')
        side=next((side for side in SIDES if identifier.startswith(side+'-')),'midline')
        if side!='midline':obj['poseRegion']=side+('-arm' if 'arm' in obj['poseRegion'] else '-leg')
        obj['poseSide']=side
        obj.name='PoseBone_'+label
    for identifier,obj in MUSCLES.items():
        part=PARTS[identifier]
        name=part['muscleName']
        side=part['side']
        original_groups={group.index:old_driver(group.name) for group in obj.vertex_groups}
        positions=points(obj)
        scap_attachment=attachment_axis(positions,scapular[side],fixed_trunk) if name in girdle_names and side in SIDES else None
        shoulder_attachment=None
        shoulder_origin=None
        if name in crossing_shoulder and side in SIDES:
            shoulder_origin='thorax' if name in {'Pectoralis major muscle','Latissimus dorsi muscle'} and 'clavicular-head' not in identifier else side+'-scapula'
            fixed=fixed_trunk if shoulder_origin=='thorax' else scapular[side]
            shoulder_attachment=attachment_axis(positions,trees['Humerus.'+SIDES[side]],fixed)
        hamstring_ends=None
        if name in hamstrings and side in SIDES:
            order=sorted(positions,key=lambda p:p.y)
            count=max(8,len(order)//10)
            insertion=sum(order[:count],Vector())/count
            origin=sum(order[-count:],Vector())/count
            hamstring_ends=(origin,(insertion-origin).normalized(),(insertion-origin).length)
        original=[{original_groups[g.group]:g.weight for g in vertex.groups if original_groups.get(g.group)} for vertex in obj.data.vertices]
        if identifier in REGIONAL_REPLACEMENTS:
            # Regional morphs already encode local attachment motion; skin adds
            # body/neck posing without applying that local motion a second time.
            original=[{'head' if part['region']=='head-neck' else 'thorax':1.} for _ in positions]
        if any(not values for values in original):raise RuntimeError('Unbound original muscle '+identifier)
        weights=[]
        for p,values in zip(positions,original):
            values=values.copy()
            if shoulder_attachment:
                origin,direction,length=shoulder_attachment
                t=smooth((p-origin).dot(direction)/length,0,1)
                values={shoulder_origin:1-t,side+'-shoulder':t}
            if hamstring_ends:
                origin,direction,length=hamstring_ends
                t=smooth((p-origin).dot(direction)/length,0,1)
                if 'short-head' in identifier:values={side+'-hip':1-t,side+'-knee':t}
                else:values={'pelvis':(1-t)**2,side+'-hip':2*t*(1-t),side+'-knee':t*t}
            if part['region'] in {'forearm-hand','shoulder-arm'} and side in SIDES:
                elbow=side+'-elbow'
                forearm=side+'-forearm'
                wrist=side+'-wrist'
                suffix=SIDES[side]
                if elbow in values:
                    radial=trees['Radius.'+suffix].find_nearest(p)[3]
                    ulnar=trees['Ulna.'+suffix].find_nearest(p)[3]
                    to_radius=smooth(ulnar-radial,-.006,.006)
                    # Ulnar-origin muscles retain the proximal anchor; distal
                    # tendons and hand follow the radius and mobile wrist.
                    forearm_only=name in {'Pronator quadratus','Pronator quadratus muscle','Pronator teres muscle','Supinator','Supinator muscle','Brachioradialis muscle'}
                    to_hand=0. if forearm_only else 1-smooth(p.y,NODES[wrist]['pivot'][1]-.025,NODES[wrist]['pivot'][1]+.025)
                    targets={elbow:(1-to_radius)*(1-to_hand),forearm:to_radius*(1-to_hand)}
                    if to_hand:
                        digital={wrist:1.} if name=='Palmaris longus muscle' else hand_influences(side,p,hand_bones[side])
                        for key,value in digital.items():targets[key]=targets.get(key,0.)+to_hand*value
                    replace_weight(values,elbow,targets)
                if 'thorax' in values and name in {'Deltoid muscle','Supraspinatus muscle','Subscapularis muscle','Infraspinatus muscle','Teres minor muscle','Teres major muscle','Coracobrachialis muscle'}:
                    replace_weight(values,'thorax',{side+'-scapula':1.})
                if 'thorax' in values and ('head-of-biceps' in identifier or 'long-head-of-triceps' in identifier):
                    replace_weight(values,'thorax',{side+'-scapula':1.})
            if 'thorax' in values and 'clavicular-head-of-pectoralis-major' in identifier:
                replace_weight(values,'thorax',{side+'-scapula':1.})
            if part['region']=='pelvis-leg-foot' and side in SIDES and side+'-ankle' in values:
                foot=side+'-subtalar'
                toes=side+'-toes'
                amount=smooth(p.z,NODES[toes]['pivot'][2]-.015,NODES[toes]['pivot'][2]+.018)
                replace_weight(values,side+'-ankle',{foot:1-amount,toes:amount})
            if scap_attachment:
                origin,direction,length=scap_attachment
                weight=smooth((p-origin).dot(direction)/length,-.08,1.08)
                values={key:value*(1-weight) for key,value in values.items()}
                values[side+'-scapula']=weight
            if part['region']=='head-neck' and identifier not in REGIONAL_REPLACEMENTS and 'head' in values:
                # Lower facial and suprahyoid source meshes follow jaw motion;
                # regional replacement muscles use their verified morphs.
                if name in {'Platysma','Platysma muscle','Depressor labii inferioris','Mentalis muscle','Buccinator muscle','Depressor anguli oris','Hyoglossus muscle','Genioglossus muscle'}:
                    amount=smooth(p.y,1.43,1.52) if name.startswith('Platysma') else 1-smooth(p.y,1.515,1.548)
                    replace_weight(values,'head',{'head':1-amount,'jaw':amount})
            if identifier not in REGIONAL_REPLACEMENTS:values=distributed(values,p)
            weights.append(values)
        found=bind_mesh(obj,rig,weights)
        obj.name='PoseMuscle_'+identifier
        obj['muscleId']=identifier
        obj['poseMuscle']=part['muscleName']
        obj['poseName']=part.get('geometryReview',{}).get('displayName',part['name'])
        obj['poseSide']=part['side']
        obj['poseRegion']=part['region']
        obj['poseDeformation']='regional-morph-and-skin' if identifier in REGIONAL_REPLACEMENTS else 'guided-skin' if len(found)>1 else 'segment-follow'
    print('BOUND',len(MUSCLES),'muscle surfaces',len(BONE_MESHES),'bone/context surfaces',len(NODES),'rig nodes',flush=True)

def glb_json(path):
    with path.open('rb') as f:
        f.seek(12)
        length,_=struct.unpack('<II',f.read(8))
        return json.loads(f.read(length))

def main():
    WORK.mkdir(parents=True,exist_ok=True)
    inputs=[ASSETS/'skeleton.glb',ASSETS/'course-tissues.glb',ASSETS/'motion-legs.glb',ASSETS/'motion-legs.json',ASSETS/'motion-walk-context.json',ASSETS/'motion-walk-muscles.json',ASSETS/'motion-forearm.json',REPO/'src/muscle-models.json',REPO/'src/three-d-landmarks.json',ASSETS/'MODEL-LICENSE.md',*(ASSETS/v['file'] for v in DRIVERS['regions'].values()),*(ASSETS/('motion-'+name+'.glb') for name in ['blink','smile','jaw','breath'])]
    hashes={str(path.relative_to(REPO)):digest(path) for path in inputs}
    backed=snapshot(inputs)
    import_sources()
    add_rig()
    # Emit the UI contract before the heavier skinning pass.
    (WORK/'pose-joints-draft.json').write_text(json.dumps(JOINTS,indent=2)+'\n')
    print('JOINT_CONTRACT',WORK/'pose-joints-draft.json',flush=True)
    rig=armature()
    bind_all(rig)
    bpy.context.view_layer.update()
    bpy.context.preferences.filepaths.save_version=0
    bpy.ops.wm.save_as_mainfile(filepath=str(WORK/(NAME+'.blend')),compress=True)
    target=ASSETS/(NAME+'.glb')
    bpy.ops.export_scene.gltf(filepath=str(target),export_format='GLB',export_extras=True,export_yup=True,export_animations=False,export_draco_mesh_compression_enable=True,export_draco_mesh_compression_level=6)
    doc=glb_json(target)
    ids=[n.get('extras',{}).get('muscleId') for n in doc['nodes'] if n.get('extras',{}).get('poseMuscle')]
    if len(ids)!=len(set(ids)) or set(ids)!=set(PARTS):raise RuntimeError('Export changed muscle census')
    if any('skin' not in n for n in doc['nodes'] if 'mesh' in n):raise RuntimeError('Export contains detached surface')
    if hashes!={str(path.relative_to(REPO)):digest(path) for path in inputs}:raise RuntimeError('An original model changed')
    meta={
        'schema':1,'asset':NAME+'.glb','sha256':digest(target),'bytes':target.stat().st_size,
        'description':'Atlas-derived whole-body posing specimen with named articulation handles and approximate attached muscle envelopes.',
        'evidence':'Teaching geometry. Pose and muscle color do not measure activation or force.',
        'scope':'Conservative joint ranges, distributed lumbar and cervical motion, coupled shoulder girdle, radius-led forearm turn, wrists, finger hinges and MCP finger spread, plus separate oblique hindfoot inversion/eversion. Toes move together. Existing reviewed blink, smile, jaw and breathing shapes are retained. Ligaments, tissue contact, independent carpal and midfoot glides, individual toe joints, eye rotations and tongue control are not simulated.',
        'knownLimitations':['Muscle envelopes can stretch or overlap at large combined joint angles. These shapes do not predict physiological muscle shortening or tissue contact.','Shoulder girdle coupling and joint hinges are teaching approximations. Individual anatomy and dynamic recruitment vary.'],
        'joints':JOINTS,'nodes':list(NODES.values()),'totalMuscleSurfaces':len(MUSCLES),'boneSurfaces':len(BONE_MESHES),
        'regionalMorphReplacements':sorted(REGIONAL_REPLACEMENTS),'backup':backed.name,
        'sources':{'openstax':'https://openstax.org/books/anatomy-and-physiology-2e/pages/9-5-types-of-body-movements','sourceModel':'https://github.com/Z-Anatomy/Models-of-human-anatomy','upperLimb':'https://pubmed.ncbi.nlm.nih.gov/16078622/','validation':'https://pmc.ncbi.nlm.nih.gov/articles/PMC4321112/','subtalarCT':'https://doi.org/10.1038/s41598-020-57912-z','subtalarAxis':'https://doi.org/10.1242/jeb.248069','fingerInterossei':'https://pmc.ncbi.nlm.nih.gov/articles/PMC13649930/'},
        'inputs':hashes,
    }
    (ASSETS/(NAME+'.json')).write_text(json.dumps(meta,indent=2)+'\n')
    print('EXPORTED_POSE_BODY',len(JOINTS),len(NODES),len(MUSCLES),target.stat().st_size,flush=True)

if __name__=='__main__':main()
