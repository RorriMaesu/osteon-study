"""Build the Osteon cutaway of hair-bearing skin in Blender 4.5.

Usage: blender -b -P scripts/build-skin-appendages.py -- REPO BACKUP_DIRECTORY
All geometry is original. World coordinates below are in anatomical millimetres,
stored as glTF x, y (superior), z (toward viewer). Blender uses x, -z, y.
"""
import datetime
import hashlib
import math
import os
from pathlib import Path
import shutil
import sys

import bpy
from mathutils import Vector

repo, backup_root = (Path(s).resolve() for s in sys.argv[sys.argv.index("--") + 1:])
if backup_root.drive.upper() != "T:":
    raise ValueError("Choose a backup directory on T:")
dest = repo / "assets" / "skin-appendages" / "skin-appendages.glb"
dest.parent.mkdir(parents=True, exist_ok=True)
stamp = datetime.datetime.now(datetime.timezone.utc).strftime("%Y%m%dT%H%M%S-%fZ")
run = backup_root / stamp
run.mkdir(parents=True)
for original in [dest, repo / "assets/ap2-neuro/skin-receptors.glb", repo / "assets/ap2-glands/skin-fat-section.glb"]:
    if original.is_file():
        saved = run / ("before-" + original.name)
        shutil.copy2(original, saved)
        if hashlib.sha256(saved.read_bytes()).digest() != hashlib.sha256(original.read_bytes()).digest():
            raise OSError(f"Backup digest mismatch: {original}")
bpy.ops.wm.read_factory_settings(use_empty=True)

def B(p):
    return Vector((p[0] * .001, -p[2] * .001, p[1] * .001))

def anatomical(p):
    return Vector((p.x * 1000, p.z * 1000, -p.y * 1000))

def material(name, hexcolor):
    m = bpy.data.materials.new(name)
    rgb = [int(hexcolor[i:i+2],16) / 255 for i in (0,2,4)]
    linear = [v / 12.92 if v < .04045 else ((v+.055)/1.055)**2.4 for v in rgb]
    m.diffuse_color = (*linear,1)
    m.use_nodes = True
    bs = m.node_tree.nodes.get("Principled BSDF")
    bs.inputs["Base Color"].default_value = (*linear,1)
    bs.inputs["Roughness"].default_value = .68
    return m

skin = material("Epidermis", "cf927c")
dermis = material("Dermis", "c98789")
deep = material("Subcutaneous bed", "d6ad7e")
haircol = material("Keratinized hair", "513529")
sheath = material("Outer root sheath", "d19a82")
ductcol = material("Sweat duct", "7aadb0")
coilcol = material("Secretory tubule", "74a3a1")
sebum = material("Sebaceous lobules", "d5ac63")
arrector = material("Arrector pili smooth muscle", "af5b67")
follicle_opening = Vector((.14,0,0))
dermal_anchor = Vector((1.05,-.18,-.03))
bulge = Vector((-.27,-.90,-.013))
THETA = math.radians(17)

def upright(p):
    x, y, z = p - follicle_opening
    return follicle_opening + Vector((math.cos(THETA)*x - math.sin(THETA)*y, math.sin(THETA)*x + math.cos(THETA)*y,z))

def register(obj, name, mat, label):
    obj.name = obj.data.name = name
    obj.data.materials.append(mat)
    obj["label"] = label
    return obj

def mesh(name, verts, faces, mat, label):
    data = bpy.data.meshes.new(name)
    data.from_pydata([B(p) for p in verts], [], faces)
    data.update()
    obj = bpy.data.objects.new(name,data)
    bpy.context.collection.objects.link(obj)
    for face in data.polygons: face.use_smooth = True
    return register(obj,name,mat,label)

def morph(obj, transform):
    obj.shape_key_add(name="Basis",from_mix=False)
    key=obj.shape_key_add(name="Piloerection",from_mix=False)
    for i,v in enumerate(obj.data.vertices):
        key.data[i].co=B(transform(anatomical(v.co)))

def tube(name, pts, radii, mat, label, arc=2*math.pi, rings=16, route=False):
    pts=[Vector(p) for p in pts]
    verts=[];faces=[]
    open_side=arc<2*math.pi-.001
    width=rings+1 if open_side else rings
    for j,p in enumerate(pts):
        tangent=(pts[min(j+1,len(pts)-1)]-pts[max(j-1,0)]).normalized()
        # A parallel-transported frame keeps the winding stable around bends.
        ref=Vector((0,0,1)) if j==0 else radial
        if abs(tangent.dot(ref))>.96: ref=Vector((1,0,0)) if abs(tangent.x)<.95 else Vector((0,1,0))
        radial=(ref-tangent*tangent.dot(ref)).normalized()
        perp=tangent.cross(radial).normalized()
        radius=radii(j/(len(pts)-1)) if callable(radii) else radii
        for s in range(width):
            a=(math.pi-arc*.5 if open_side else 0)+arc*s/rings
            verts.append(p+radius*(radial*math.cos(a)+perp*math.sin(a)))
        if j:
            for s in range(rings):
                s2=s+1 if open_side else (s+1)%rings
                k0=(j-1)*width;k1=j*width
                faces.append((k0+s,k0+s2,k1+s2,k1+s))
    obj=mesh(name,verts,faces,mat,label)
    if route: obj["path_mm"]=[round(v,5) for p in pts for v in p]
    return obj

def interpolate(a,b,n):
    a=Vector(a);b=Vector(b);return [a.lerp(b,i/(n-1)) for i in range(n)]

def layer(name,bottom,top,mat,label):
    # Preserve the back half of a longitudinal tissue block and expose the
    # appendages at the cut face. The epidermal/dermal junction has rete ridges.
    n=48;verts=[];faces=[]; spans=[(-.015,0),(-.015,1),(-.78,1),(-.78,0)]
    def y(bound,x,z):
        if abs(bound+.13)<.0001:
            return bound-.037*(.6+.4*math.cos(11*x+z*5))**4-.017*math.sin(17*x+2*z)
        return bound
    for i in range(n+1):
        x=-1.93+3.59*i/n
        for z,upper in spans: verts.append((x,y(top if upper else bottom,x,z),z))
        if i:
            for s in range(4):
                a=(i-1)*4+s;b=(i-1)*4+(s+1)%4
                faces.append((a,a+4,b+4,b))
    faces.extend([(3,2,1,0),tuple(4*n+s for s in range(4))])
    o=mesh(name,verts,faces,mat,label)
    for face in o.data.polygons: face.use_smooth=False
    return o

def ellipsoids(name,regions,mat,label):
    verts=[];faces=[]
    for (cx,cy,cz),(rx,ry,rz),seed in regions:
        base=len(verts);lat=16;lon=22
        for i in range(lat+1):
            a=math.pi*i/lat
            for j in range(lon):
                u=2*math.pi*j/lon
                relief=1+.035*math.sin(3*u+seed)*math.sin(2*a)**2+.035*math.cos(5*u+seed)*math.sin(a)**3
                verts.append((cx+rx*math.sin(a)*math.cos(u)*relief,cy+ry*math.cos(a)*relief,cz+rz*math.sin(a)*math.sin(u)*relief))
        for i in range(lat):
            for j in range(lon):
                a=base+i*lon+j;b=base+i*lon+(j+1)%lon
                faces.append((a,b,b+lon,a+lon))
    return mesh(name,verts,faces,mat,label)

layer("epidermis",-.13,0,skin,"Epidermis")
layer("dermis",-1.75,-.13,dermis,"Dermis")
layer("subcutaneous",-2.0,-1.75,deep,"Subcutaneous tissue")
# Thicker wall around the bulb, tapering into the infundibulum.
def follicle_point(y):
    return Vector((.14+.455*y,y,0))
pts=[follicle_point(-1.82+1.82*j/28) for j in range(29)]
fol=tube("follicular_wall",pts,lambda t:.113+.071*math.exp(-((t-.08)/.08)**2)+.035*t**4,
         sheath,"Hair follicle in longitudinal section",arc=1.50*math.pi,rings=24)
morph(fol,upright)
hairpts=[follicle_point(-1.66+2.67*j/38) for j in range(39)]
hair=tube("hair",hairpts,lambda t:.058*(1-.78*max(0,(t-.77)/.23)**1.55),haircol,"Hair root and shaft",rings=14)
morph(hair,upright)
# Two attached bundles share a myotendinous axis between dermis and follicle.
base_axis=bulge-dermal_anchor
move_axis=upright(bulge)-dermal_anchor
mpts=interpolate(dermal_anchor,bulge,28)
muscle=tube("arrector_pili",mpts,lambda t:.023+.056*math.sin(math.pi*t)**.75,arrector,"Arrector pili muscle",rings=16)
def shorten(p):
    q=p-dermal_anchor;t=q.dot(base_axis)/base_axis.length_squared
    radial=q-t*base_axis
    rotated=base_axis.rotation_difference(move_axis) @ radial
    return dermal_anchor+t*move_axis+rotated*math.sqrt(base_axis.length/move_axis.length)
morph(muscle,shorten)
lobules=ellipsoids("sebaceous_lobules",[
    ((.19,-.52,.005),(.16,.18,.095),1),((.33,-.53,.015),(.16,.15,.11),2),
    ((.39,-.65,-.01),(.13,.17,.11),3),((.20,-.68,-.035),(.14,.16,.10),4),
    ((.29,-.63,.078),(.115,.12,.092),5)],sebum,"Sebaceous gland lobules")
oilway=[(.29,-.53,.04),(.23,-.46,.05),(.164,-.413,.062),(.093,-.36,.067),(.043,-.295,.068)]
oilduct=tube("sebaceous_duct",oilway,.045,sebum,"Sebaceous duct into the hair follicle",route=True)
# Secretions enter the space next to the hair shaft and spread to the surface.
sebpath=oilway+[tuple(follicle_point(y)+Vector((.033,0,.068))) for y in [-.23,-.17,-.09,0,.08,.17]]
oilduct["sebum_mm"]=[round(v,5) for p in sebpath for v in p]
# A continuous toroidal winding represents one coiled secretory tubule rather
# than a stack of disconnected rings. Its end is contiguous with the sweat duct.
coil=[]
for i in range(142):
    a=2*math.pi*i/141
    R=.233+.094*math.cos(5*a+.25)
    coil.append((-1.30+R*math.cos(a),-1.66+.102*math.sin(5*a+.25)+.025*a, .90*R*math.sin(a)))
coilobj=tube("eccrine_coil",coil,.047,coilcol,"Eccrine secretory coil",rings=12,route=True)
start=Vector(coil[-1])
duct=[start]
for i in range(1,47):
    t=i/46; y=start.y+(-.19-start.y)*t
    duct.append(Vector((start.x+.035*math.sin(2*math.pi*t)-.125*t,y,start.z+.04*math.sin(2.8*math.pi*t))))
# Acrosyringium spirals through the epidermis.
center=duct[-1]-Vector((.042,0,0))
for i in range(1,45):
    t=i/44; angle=2.8*math.pi*t
    duct.append(Vector((center.x+.042*math.cos(angle),-.19+.19*t,center.z+.039*math.sin(angle))))
tube("sweat_duct",duct,.031,ductcol,"Eccrine duct and intraepidermal spiral",rings=12,route=True)
pore=duct[-1]
ring=[pore+Vector((.053*math.cos(2*math.pi*j/36),0,.043*math.sin(2*math.pi*j/36))) for j in range(37)]
tube("sweat_pore",ring,.013,skin,"Sweat pore on the free skin surface",rings=8)

working=run/"skin-appendages.glb"
bpy.ops.wm.save_as_mainfile(filepath=str(run/"skin-appendages.blend"))
bpy.ops.export_scene.gltf(filepath=str(working),export_format="GLB",export_extras=True,export_morph=True,export_normals=True,export_texcoords=False,export_animations=False,export_yup=True)
if working.stat().st_size<10000: raise RuntimeError("Incomplete export")
# Replace only this generated file after both backup and successful staging.
next_file=dest.with_suffix(".staging.glb")
shutil.copy2(working,next_file)
os.replace(next_file,dest)
print("Wrote",dest,dest.stat().st_size, "sha256",hashlib.sha256(dest.read_bytes()).hexdigest(),"Backup/build folder",run)
