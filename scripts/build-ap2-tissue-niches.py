"""Generate original teaching cutaways. Blender 4.5 -b -P thisfile -- NEW_OUTPUT_DIRECTORY"""
import sys
from pathlib import Path
import random
import bpy
from mathutils import Vector

dest = Path(sys.argv[sys.argv.index("--") + 1])
outputs = ["skin-fat-section.glb", "marrow-section.glb"]
if any((dest / name).exists() for name in outputs):
    raise FileExistsError("Choose a fresh destination to preserve prior model files.")
rng = random.Random(124)
parts = {}

def group(name, obj):
    parts.setdefault(name, []).append(obj)

def cell(name, point, radii):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=20, ring_count=12, location=point)
    obj = bpy.context.object
    obj.scale = radii
    for face in obj.data.polygons:
        face.use_smooth = True
    group(name, obj)

def slab(name, center, size, bevel):
    bpy.ops.mesh.primitive_cube_add(size=1, location=center)
    obj = bpy.context.object
    obj.dimensions = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    mod = obj.modifiers.new("Rounded specimen edges", "BEVEL")
    mod.width = bevel
    mod.segments = 3
    bpy.ops.object.modifier_apply(modifier=mod.name)
    group(name, obj)

def tube(name, points, radius):
    curve = bpy.data.curves.new(name, 'CURVE')
    curve.dimensions = '3D'
    curve.resolution_u = 10
    curve.bevel_depth = radius
    curve.bevel_resolution = 3
    # Leave the vessel lumen open at both ends.
    spline = curve.splines.new('BEZIER')
    spline.bezier_points.add(len(points)-1)
    for bp, xyz in zip(spline.bezier_points, points):
        bp.co = xyz
        bp.handle_left_type = bp.handle_right_type = 'AUTO'
    obj = bpy.data.objects.new(name, curve)
    bpy.context.collection.objects.link(obj)
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.convert(target='MESH')
    group(name, obj)

def export(name):
    for role, objects in parts.items():
        bpy.ops.object.select_all(action='DESELECT')
        for obj in objects:
            obj.select_set(True)
        bpy.context.view_layer.objects.active = objects[0]
        bpy.ops.object.join()
        objects[0].name = role
    bpy.ops.export_scene.gltf(filepath=str(dest / name), export_format='GLB',
                              export_materials='NONE', export_cameras=False, export_lights=False)
    parts.clear()

def fresh():
    bpy.ops.wm.read_factory_settings(use_empty=True)

fresh()
# The cut face shows the epidermis above dermis and adipocyte lobules in the hypodermis.
slab("epidermis", (0,0,1.12), (3.8,1.65,.13), .04)
slab("dermis", (0,0,.75), (3.8,1.65,.63), .09)
for x in range(7):
    for y in range(3):
        for z in range(2):
            pos = (x*.52-1.55+rng.uniform(-.06,.06), y*.52-.51+rng.uniform(-.05,.05), z*.4-.28+rng.uniform(-.04,.04))
            cell("adipocytes", pos, (.31,.30,.26))
for z in [-.23,.18]:
    tube("connective_septa", [(-1.8,-.58,z),(-.65,-.57,z+.10),(.55,-.64,z-.10),(1.8,-.6,z)], .022)
tube("cutaneous_vessels", [(-1.9,-.76,.4),(-.8,-.78,.43),(.2,-.76,.4),(1.85,-.77,.39)], .045)
for x in [-1.2,-.25,.85]:
    tube("cutaneous_vessels", [(x,-.76,.40),(x-.09,-.8,.68),(x,-.81,.93),(x+.14,-.82,.90),(x+.19,-.8,.68),(x+.27,-.77,.41)], .021)
export(outputs[0])
fresh()
# Trabeculae border intertrabecular marrow spaces. The field depicts selected cells at enlarged scale.
tube("trabeculae", [(-1.6,.50,-1.0),(-1.04,.42,-.23),(-.78,.38,.5),(-1.06,.53,1.12)], .19)
tube("trabeculae", [(-.78,.38,.5),(-.13,.52,.83),(.67,.49,1.00),(1.27,.47,1.13)], .14)
tube("trabeculae", [(1.38,.24,-1.02),(.91,.38,-.65),(.62,.46,-.22),(.97,.49,.28),(1.51,.43,.62)], .18)
tube("sinusoid", [(-1.65,-.02,-.92),(-1.05,-.05,-.7),(-.25,-.03,-.35),(.42,-.08,-.52),(1.68,-.02,-.66)], .145)
# A representative erythroblastic island has a central macrophage and nucleated precursors.
cell("macrophage",(-.45,-.31,.37),(.30,.21,.23))
from math import pi, sin, cos
for i in range(9):
    t=2*pi*i/9
    x,z=-.45+.46*cos(t),.36+.36*sin(t)
    cell("erythroid_cells",(x,-.38,z),(.133,.125,.125))
    cell("erythroid_nuclei",(x+.014,-.48,z+.008),(.073,.055,.069))
cell("megakaryocyte",(.56,-.33,-.02),(.34,.25,.32))
for x,z in [(.44,-.04),(.53,.06),(.63,.08),(.66,-.04),(.56,-.09)]:
    cell("megakaryocyte_nucleus",(x,-.53,z),(.09,.055,.085))
for x,z in [(-1.21,.15),(1.15,.38),(1.28,-.19),(-.21,.92)]:
    cell("marrow_adipocytes",(x,-.16,z),(.20,.16,.18))
export(outputs[1])
