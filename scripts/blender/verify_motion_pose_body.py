"""Read-only round-trip and sampled skin review of the whole-body pose GLB."""
import hashlib
import json
import math
import sys
from pathlib import Path
import bmesh
import bpy
import numpy as np
from mathutils import Vector,Quaternion

REPO,OUTPUT=[Path(p).resolve() for p in sys.argv[sys.argv.index('--')+1:]]
META=json.loads((REPO/'assets/motion-pose-body.json').read_text())
MODEL=REPO/'assets/motion-pose-body.glb'
blender=lambda v:Vector((v[0],-v[2],v[1]))
web=lambda v:Vector((v.x,v.z,-v.y))
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(MODEL))
rig=next(o for o in bpy.context.scene.objects if o.type=='ARMATURE')
objects=[o for o in bpy.context.scene.objects if o.type=='MESH' and (o.get('poseMuscle') or o.get('poseBone'))]
muscles=[o for o in objects if o.get('poseMuscle')]
assert len(muscles)==META['totalMuscleSurfaces']
assert len(set(o['muscleId'] for o in muscles))==len(muscles)
assert len(objects)-len(muscles)==META['boneSurfaces']
hamstring_parts = ('long-head-of-biceps-femoris', 'short-head-of-biceps-femoris',
                   'semimembranosus-muscle', 'semitendinosus-muscle')
muscle_by_id = {obj['muscleId']: obj for obj in muscles}
for part in hamstring_parts:
    volumes = []
    for side in ('l', 'r'):
        obj = muscle_by_id[f'muscle-{part}-{side}']
        mesh = bmesh.new()
        try:
            mesh.from_mesh(obj.data)
            mesh.transform(obj.matrix_world)
            signed_volume = mesh.calc_volume(signed=True)
        finally:
            mesh.free()
        assert signed_volume > 0, (obj.name, 'hamstring faces point inward')
        volumes.append(signed_volume)
    assert math.isclose(*volumes, rel_tol=.01), (part, 'asymmetric hamstring volumes')
nodes={row['id']:row for row in META['nodes']}

def rotate(identifier,axis,angle):
    p=rig.pose.bones[nodes[identifier]['name']]
    p.rotation_mode='QUATERNION'
    local=p.bone.matrix_local.to_quaternion().inverted()@blender(axis)
    p.rotation_quaternion=p.rotation_quaternion@Quaternion(local,math.radians(angle))

def apply(values):
    for p in rig.pose.bones:
        p.rotation_mode='QUATERNION'
        p.rotation_quaternion=Quaternion()
        p.location=(0,0,0)
    shapes={}
    for joint in META['joints']:
        for axis in joint['axes']:
            angle=values.get(joint['id'],{}).get(axis['id'],0)
            for name,scale in joint.get('morphs',{}).get(axis['id'],{}).items():shapes[name]=angle*scale
            for vector,degrees in axis.get('rotations',[]):rotate(joint['id'],vector,degrees*angle/axis['max'])
            if not axis.get('vector'):continue
            if axis.get('relativeTo'):
                posed=values.get(joint['id'],{})
                elevation=max(posed.get(key,0) for key in ('flexion','abduction','scaption'))
                angle*=min(1,max(0,(elevation-25)/20))
                if angle:
                    bpy.context.view_layer.update()
                    bone=rig.pose.bones[nodes[joint['id']]['name']]
                    reference=rig.pose.bones[nodes[axis['relativeTo']]['name']]
                    relative=reference.matrix.to_quaternion()@reference.bone.matrix_local.to_quaternion().inverted()
                    parent_basis=bone.parent.matrix.to_quaternion()@bone.parent.bone.matrix_local.to_quaternion().inverted()
                    basis=parent_basis@bone.bone.matrix_local.to_quaternion()
                    axis_local=basis.inverted()@relative@blender(axis['vector']).normalized()
                    bone.rotation_quaternion=Quaternion(axis_local,math.radians(angle))@bone.rotation_quaternion
                continue
            if joint.get('distribute'):
                weights=joint.get('axisWeights',{}).get(axis['id'],[1/len(joint['distribute'])]*len(joint['distribute']))
                assert abs(sum(weights)-1)<.00001
                for identifier,weight in zip(joint['distribute'],weights):rotate(identifier,axis['vector'],angle*weight)
            else:
                if joint['id'].endswith('-shoulder') and axis['id'] in {'abduction','scaption'}:
                    low,high=joint.get('scapularShare',[1/3,1/3])
                    girdle=angle*(low+(high-low)*min(1,max(0,angle/90)))
                    rotate(joint['side']+'-scapula',axis['vector'],girdle)
                    angle-=girdle
                rotate(joint['id'],axis['vector'],angle)
        if joint['id']=='pelvic-control' and any(values.get(joint['id'],{}).values()):
            pelvis=rig.pose.bones[nodes['pelvis']['name']]
            rest=pelvis.bone.matrix_local.to_quaternion()
            delta=rest@pelvis.rotation_quaternion@rest.inverted()
            for identifier in ['lumbar-5','right-hip','left-hip']:
                child=rig.pose.bones[nodes[identifier]['name']]
                basis=child.bone.matrix_local.to_quaternion()
                child.rotation_quaternion=(basis.inverted()@delta.inverted()@basis)@child.rotation_quaternion
            if values[joint['id']].get('obliquity'):
                hip=rig.pose.bones[nodes['right-hip']['name']]
                offset=hip.bone.head_local-pelvis.bone.head_local
                pelvis.location=rest.inverted()@(offset-delta@offset)
        if joint.get('unlockedRotation'):
            rule=joint['unlockedRotation']
            flexion=values.get(joint['id'],{}).get('flexion',0)
            t=min(1,max(0,flexion/rule['endsAt']))
            rotate(joint['id'],rule['axis'],rule['degrees']*t*t*(3-2*t))
        if joint['id']=='jaw':
            p=rig.pose.bones[nodes[joint['id']]['name']]
            jaw=values.get('jaw',{})
            shift=Vector(joint['translation'])*(jaw.get('opening',0)/joint['axes'][0]['max'])
            slide=joint.get('condyleHalfWidth',0)*math.sin(math.radians(abs(jaw.get('excursion',0))))
            protrusion=jaw.get('protrusion',0)
            shift.z+=slide+protrusion*.00005
            shift.y-=slide*.22+protrusion*.000018
            p.location=p.bone.matrix_local.to_quaternion().inverted()@blender(shift)
    for side in ['left','right']:
        rotate(side+'-patella',[1,0,0],values.get(side+'-knee',{}).get('flexion',0)*.55)
    for obj in objects:
        if obj.data.shape_keys:
            for block in obj.data.shape_keys.key_blocks[1:]:block.value=shapes.get(block.name,0)
    bpy.context.view_layer.update()

def vertices(obj,evaluated=True):
    source=obj.evaluated_get(bpy.context.evaluated_depsgraph_get()) if evaluated else obj
    data=source.data
    coordinates=np.empty(len(data.vertices)*3,dtype=np.float64)
    data.vertices.foreach_get('co',coordinates)
    coordinates=coordinates.reshape((-1,3))
    m=np.asarray(source.matrix_world)
    return coordinates@m[:3,:3].T+m[:3,3]

apply({})
neutral={obj.name:vertices(obj) for obj in objects}
max_bounds_error=0
edge_data={}
max_weight_error=0
for obj in objects:
    assert any(m.type=='ARMATURE' for m in obj.modifiers),obj.name
    for vertex in obj.data.vertices:
        total=sum(g.weight for g in vertex.groups)
        max_weight_error=max(max_weight_error,abs(total-1))
        # Draco quantizes generic weights. The renderer normalizes the decoded
        # skin weights once at load; verify the decoded source stays within 0.1%.
        assert abs(total-1)<.001,(obj.name,vertex.index,total)
    coords=neutral[obj.name]
    assert np.isfinite(coords).all()
    canonical=coords[:,[0,2,1]]*np.array([1,1,-1])
    bounds=np.r_[canonical.min(axis=0),canonical.max(axis=0)]
    max_bounds_error=max(max_bounds_error,float(np.max(np.abs(bounds-np.array(obj['poseNeutralBounds'])))))
    if obj.get('poseMuscle'):
        edges=np.empty(len(obj.data.edges)*2,dtype=np.int32)
        obj.data.edges.foreach_get('vertices',edges)
        edges=edges.reshape((-1,2))
        lengths=np.linalg.norm(coords[edges[:,0]]-coords[edges[:,1]],axis=1)
        chosen=lengths>1e-6
        edge_data[obj.name]=(edges[chosen],lengths[chosen])
assert max_bounds_error<.0007,max_bounds_error

hand={j['id']:{a['id']:a['max'] for a in j['axes']} for j in META['joints'] if j['id'].startswith('right-') and any(d in j['id'] for d in ('thumb','index','middle','ring','little'))}
scenarios={
 'elbow-flexion':{'right-elbow':{'flexion':115},'left-elbow':{'flexion':115}},
 'overhead-combined':{'right-shoulder':{'flexion':90,'abduction':90,'rotation':30},'right-elbow':{'flexion':90}},
 'hand-flexion':{**hand,'right-forearm':{'pronation':60},'right-wrist':{'flexion':45,'deviation':18}},
 'seated-bend':{'right-hip':{'flexion':85},'left-hip':{'flexion':85},'right-knee':{'flexion':85},'left-knee':{'flexion':85},'trunk':{'flexion':25},'neck':{'flexion':25}},
 'facial-shapes':{'jaw':{'opening':15},'face-blink':{'closure':100},'face-smile':{'smile':100}},
 'inspiration':{'breathing':{'inhale':100}},
 'finger-spread':{j['id']:{'abduction':next(a['max'] for a in j['axes'] if a['id']=='abduction')} for j in META['joints'] if j['id'].endswith('-mcp') and any(a['id']=='abduction' for a in j['axes'])},
 'hindfoot-inversion':{'right-subtalar':{'inversion':15},'left-subtalar':{'inversion':15}},
 'hindfoot-eversion':{'right-subtalar':{'inversion':-8},'left-subtalar':{'inversion':-8}},
 'cervical-turn-right':{'neck':{'rotation':40}},
 'cervical-turn-left':{'neck':{'rotation':-40}},
 'upper-nod':{'upper-nod':{'flexion':7}},
 'shoulder-abduction':{'right-shoulder':{'abduction':58},'left-shoulder':{'abduction':58}},
 'hip-abduction':{'right-hip':{'abduction':30},'left-hip':{'abduction':30}},
 'flexed-hip-rotation':{'right-hip':{'flexion':82,'rotation':15},'right-knee':{'flexion':60}},
 'jaw-excursion':{'jaw':{'excursion':5}},
 'jaw-protrusion':{'jaw':{'protrusion':100}},
 'great-toe-extension':{'right-hallux':{'extension':25},'left-hallux':{'extension':25}},
 'scaption':{'right-shoulder':{'scaption':55},'left-shoulder':{'scaption':55}},
 'pelvis-tilt':{'pelvic-control':{'tilt':9}},
 'pelvic-drop':{'pelvic-control':{'obliquity':6},'left-hip':{'flexion':15},'left-knee':{'flexion':20}},
 'thoracic-rotation':{'thoracic-turn':{'rotation':11}},
 'thumb-opposition':{'right-thumb-cmc':{'opposition':80},'left-thumb-cmc':{'opposition':80}},
 'knee-unlock':{'right-knee':{'flexion':22},'left-knee':{'flexion':22}},
 'across-chest':{'right-shoulder':{'abduction':65,'horizontal':42},'right-elbow':{'flexion':15}},
 'second-toe':{'right-toe-2':{'extension':20},'left-toe-2':{'extension':20}},
 'pinch-approach':{'right-thumb-cmc':{'opposition':80,'flexion':9,'abduction':16},'right-thumb-ip':{'flexion':8},
                   'right-index-mcp':{'flexion':56},'right-index-pip':{'flexion':36},'right-index-dip':{'flexion':1}},
 'power-grip':{**{'right-'+digit+'-'+joint:{'flexion':amount}
                 for digit in ('index','middle','ring','little') for joint,amount in [('mcp',43),('pip',55),('dip',32)]},
               'right-thumb-cmc':{'opposition':54},'right-thumb-mcp':{'flexion':18}},
}
results={}
for name,values in scenarios.items():
    apply(values)
    rows=[]
    for obj in muscles:
        posed=vertices(obj)
        assert np.isfinite(posed).all(),(name,obj.name)
        original=neutral[obj.name]
        displacement=np.linalg.norm(posed-original,axis=1)
        edges,lengths=edge_data[obj.name]
        ratio=np.linalg.norm(posed[edges[:,0]]-posed[edges[:,1]],axis=1)/lengths
        rows.append({'muscle':obj['muscleId'],'maxDisplacementMm':round(float(displacement.max())*1000,3),'edgeLengthRatio95':round(float(np.percentile(ratio,95)),3),'edgeLengthRatio99':round(float(np.percentile(ratio,99)),3)})
    results[name]={'controls':values,'movedSurfaces':sum(row['maxDisplacementMm']>.01 for row in rows),'largestSkinStretch':sorted(rows,key=lambda row:row['edgeLengthRatio99'],reverse=True)[:12]}
    print('POSE_REVIEW',name,results[name]['movedSurfaces'],results[name]['largestSkinStretch'][:3],flush=True)
apply({})
for obj in objects:
    assert np.max(np.abs(vertices(obj)-neutral[obj.name]))<1e-6,(obj.name,'failed neutral reset')
report={
 'sha256':hashlib.sha256(MODEL.read_bytes()).hexdigest(),'reimportedMuscles':len(muscles),'reimportedBoneSurfaces':len(objects)-len(muscles),
 'maximumNeutralBoundsErrorMillimeters':round(max_bounds_error*1000,6),'maximumSkinWeightSumError':max_weight_error,
 'jointControls':len(META['joints']),'rigNodes':len(rig.pose.bones),'exactNeutralReset':True,
 'sampledPoses':results,
 'limits':'Numerical re-import and sampled skin-envelope checks. This does not validate tissue collision, dynamic forces, clinical range of motion, or activation.',
}
OUTPUT.write_text(json.dumps(report,indent=2)+'\n')
print('POSE_RIG_VERIFIED',OUTPUT,flush=True)
