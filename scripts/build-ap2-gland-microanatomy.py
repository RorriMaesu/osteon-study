"""Create two illustrative cell-scale teaching specimens with Blender 4.5.
Run blender -b -P this_script -- output_directory. Existing files are protected.
"""
from pathlib import Path
import math
import sys
import bpy
from mathutils import Vector

dest = Path(sys.argv[sys.argv.index("--") + 1])
for name in ("follicle-cutaway.glb", "islet-cutaway.glb"):
    if (dest / name).exists():
        raise FileExistsError("Back up and move the previous model before rebuilding " + name)

def reset():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)

def sphere(name, pos, size):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=8, location=pos)
    obj = bpy.context.object
    obj.name = name
    obj.scale = size
    for face in obj.data.polygons:
        face.use_smooth = True
    return obj

def cylinder(name, a, b, radius):
    vec = Vector(b) - Vector(a)
    bpy.ops.mesh.primitive_cylinder_add(vertices=18, radius=radius, depth=vec.length,
                                        location=(Vector(a) + Vector(b)) / 2)
    obj = bpy.context.object
    obj.name = name
    obj.rotation_euler = vec.to_track_quat("Z", "Y").to_euler()
    return obj

def save(filename):
    bpy.ops.export_scene.gltf(filepath=str((dest / filename).resolve()), export_format="GLB", export_yup=True)

reset()
# The specimen is open toward -Y. Retained colloid and epithelium are hemispherical.
for row in range(6):
    theta1 = row * math.pi / 6
    theta2 = (row + 1) * math.pi / 6
    n = max(3, round(12 * math.sin((theta1 + theta2) / 2)))
    for col in range(n):
        phi1, phi2 = col * math.pi / n, (col + 1) * math.pi / n
        verts = []
        for r in (.90, 1.18):
            for theta, phi in ((theta1, phi1), (theta1, phi2), (theta2, phi2), (theta2, phi1)):
                verts.append((r * math.sin(theta) * math.cos(phi), r * math.sin(theta) * math.sin(phi), r * math.cos(theta)))
        faces = [(0,1,2,3),(7,6,5,4),(0,4,5,1),(1,5,6,2),(2,6,7,3),(3,7,4,0)]
        data=bpy.data.meshes.new("follicular_cell");data.from_pydata(verts,[],faces);data.update()
        obj=bpy.data.objects.new("follicle_cell_%d_%d"%(row,col),data);bpy.context.collection.objects.link(obj)
        bevel=obj.modifiers.new("Soften cell junctions","BEVEL");bevel.width=.025;bevel.segments=2
        theta=(theta1+theta2)/2;phi=(phi1+phi2)/2
        sphere("cell_nucleus",(1.17*math.sin(theta)*math.cos(phi),1.17*math.sin(theta)*math.sin(phi),1.17*math.cos(theta)),(.07,.07,.07))
# A semitransparent-replacement cross section uses a shallow disk facing the cut.
disk = cylinder("colloid_section",(0,.045,0),(0,.12,0),.89)
sphere("parafollicular_cell",(1.20,.03,.17),(.17,.17,.20))
cylinder("capillary",(-1.46,.05,-.78),(-1.46,.05,.85),.075)
save("follicle-cutaway.glb")

reset()
# Alpha, beta and delta populations are deliberately intermingled; counts are illustrative.
positions=[(-1.0,0,.08),(-.63,-.06,.44),(-.60,-.05,-.30),(-.18,0,.06),(.19,.02,.44),(.22,-.02,-.28),(.69,0,.08),
           (-.44,.35,.02),(-.03,.36,.42),(.04,.42,-.32),(.44,.40,.10),(-.38,.04,.77),(.48,.1,-.65),(-.49,.1,-.70)]
types=["alpha","beta","beta","delta","alpha","beta","beta","beta","alpha","beta","delta","beta","alpha","beta"]
for i,(kind,position) in enumerate(zip(types,positions)):
    sphere(kind+"_cell_"+str(i),position,(.24,.20,.23))
cylinder("capillary",(-1.43,-.29,-.16),(1.23,-.29,-.02),.070)
# Each small group surrounds a lumen. Branches lead into a common duct.
for k,(cx,cz) in enumerate(((-1.50,.75),(1.52,.65),(1.65,-.55))):
    for j in range(6):
        angle=j*math.pi/3
        sphere("acinar_cell_%d_%d"%(k,j),(cx+.22*math.cos(angle),.29,cz+.22*math.sin(angle)),(.14,.15,.14))
    cylinder("duct_branch_"+str(k),(cx,.31,cz),(cx,.86,cz),.06)
    cylinder("duct_collect_"+str(k),(cx,.86,cz),(cx,.86,1.16),.07)
cylinder("duct",(-1.51,.86,1.16),(1.85,.86,1.16),.08)
save("islet-cutaway.glb")
