"""Validate the delivered Blender 4.5 forearm lesson after GLB reimport."""
import json
import sys
from pathlib import Path

import bpy
from mathutils.kdtree import KDTree

sys.path.insert(0,str(Path(__file__).parent))
from build_motion_forearm import ANGLES, ASSETS, NAME, SIDES, WORK, bone_context, faces, import_scene, positions, target_name, to_web, tree


def mesh_points(obj, graph):
    evaluated=obj.evaluated_get(graph)
    mesh=evaluated.to_mesh()
    points=[to_web(evaluated.matrix_world@v.co) for v in mesh.vertices]
    evaluated.to_mesh_clear()
    return points


def near(source, target):
    lookup=KDTree(len(source))
    for i, vertex in enumerate(source):
        lookup.insert(vertex,i)
    lookup.balance()
    return max(lookup.find(vertex)[2] for vertex in target)


def morph(objects, degrees):
    low=max(angle for angle in (0,*ANGLES) if angle<=degrees)
    high=min(angle for angle in (0,*ANGLES) if angle>=degrees)
    t=(degrees-low)/(high-low) if low!=high else 0.
    for obj in objects:
        keys=obj.data.shape_keys
        if not keys:
            continue
        for angle in ANGLES:
            value=(1-t if angle==low else 0.)+(t if angle==high else 0.)
            keys.key_blocks[target_name(angle)].value=value
    bpy.context.view_layer.update()


def verify():
    reference={obj['zname']: positions(obj) for obj in import_scene(ASSETS/'skeleton.glb')
               if bone_context(obj)}
    bpy.ops.wm.read_factory_settings(use_empty=True)
    meshes=import_scene(WORK/(NAME+'.glb'))
    bones={mesh['zname']:mesh for mesh in meshes if mesh.get('motionContext')}
    muscles={mesh['muscleId']:mesh for mesh in meshes if mesh.get('motionMuscle')}
    assert set(bones)==set(reference),set(reference)-set(bones)
    assert len(muscles)==12 and len(bones)==62
    assert sum(bool(mesh.data.shape_keys) for mesh in muscles.values())==10
    morph(meshes,0)
    graph=bpy.context.evaluated_depsgraph_get()
    original={name:mesh_points(bone,graph) for name,bone in bones.items()}
    errors=max(max(near(points,original[name]),near(original[name],points)) for name,points in reference.items())
    assert errors<.00010,errors
    muscles_neutral={name:mesh_points(mesh,graph) for name,mesh in muscles.items()}
    results={'sourceBoneRestErrorMillimeters':1000*errors,'samples':{}}
    for side,title in SIDES.items():
        radius=bones['Radius.'+side]
        rfaces=faces(radius)
        redges=[edge.vertices[:] for edge in radius.data.edges]
        rest=original['Radius.'+side]
        rest_lengths=[(rest[a]-rest[b]).length for a,b in redges]
        maximum=0.
        geometry=[]
        fixed=[tree(original[name+'.'+side],faces(bones[name+'.'+side])) for name in ('Ulna','Humerus')]
        for angle in range(0,61,2):
            morph(meshes,angle)
            graph=bpy.context.evaluated_depsgraph_get()
            moved=mesh_points(radius,graph)
            surface=tree(moved,rfaces)
            for bone in fixed:
                assert not surface.overlap(bone),(title,angle,'radius/fixed bone collision')
            for (a,b),length in zip(redges,rest_lengths):
                if length>.0005:
                    maximum=max(maximum,abs((moved[a]-moved[b]).length/length-1))
            distal=[k for k,point in enumerate(rest) if point.y<.871]
            geometry.append((angle,max((moved[k]-rest[k]).length for k in distal)*1000))
        assert maximum<.007,(title,maximum)
        morph(meshes,60)
        graph=bpy.context.evaluated_depsgraph_get()
        muscles_moving={}
        for name, mesh in muscles.items():
            if mesh['motionSide']!=title:
                continue
            start,end=muscles_neutral[name],mesh_points(mesh,graph)
            displacement=max((a-b).length for a,b in zip(start,end))
            assert displacement>.003 if mesh.data.shape_keys else displacement<.00002
            muscles_moving[name]=round(1000*displacement,3)
        for name in ('Ulna','Humerus','Scapula'):
            mesh=bones[name+'.'+side]
            fixed_drift=max((a-b).length for a,b in zip(original[name+'.'+side],mesh_points(mesh,graph)))
            assert fixed_drift<.00002,(title,name)
        results['samples'][title]={
            'maximumBoneEdgeLengthErrorPercent':100*maximum,
            'maximumDistalRadialDisplacementMillimetersByAngle':geometry,
            'muscleMaxDisplacementMillimeters':muscles_moving,
        }
    morph(meshes,0)
    graph=bpy.context.evaluated_depsgraph_get()
    for name, bone in bones.items():
        assert max((a-b).length for a,b in zip(original[name],mesh_points(bone,graph)))<.00001,name
    (WORK/'motion-forearm-verification.json').write_text(json.dumps(results,indent=2)+'\n',encoding='utf-8')
    print('FOREARM_VERIFIED',json.dumps(results),flush=True)


if __name__=='__main__':
    verify()
