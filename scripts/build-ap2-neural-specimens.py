"""Build compact teaching derivatives in Blender 4.5. Run with -- <source-folder> <repo>.

Inputs in the source folder are the HRA eye GLB and the IE-Map VTK files
listed below. The ventricular surfaces come from Osteon's registered nerve layer.
Export preserves source geometry in metres except for reduction and the eye section.
"""
from pathlib import Path
import datetime
import hashlib
import json
import shutil
import struct
import sys
import tempfile
import bmesh
import bpy
from mathutils import Matrix, Vector

source, repo = map(Path, sys.argv[sys.argv.index("--") + 1:])
output = repo / "assets" / "ap2-neuro"
output.mkdir(parents=True, exist_ok=True)
def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def export(name):
    path = output / (name + ".glb")
    if path.exists():
        backup_dir = source / "derivative-backups"
        backup_dir.mkdir(exist_ok=True)
        stamp = datetime.datetime.now(datetime.timezone.utc).strftime("%Y%m%dT%H%M%S%fZ")
        backup = backup_dir / (stamp + "-" + path.name)
        shutil.copy2(path, backup)
        assert digest(backup) == digest(path)
    bpy.ops.export_scene.gltf(filepath=str(path), export_format="GLB", use_selection=False,
                              export_materials="NONE", export_animations=False, export_extras=True,
                              export_texcoords=False, export_tangents=False, export_normals=True)
    print("Created", path.name, path.stat().st_size, digest(path))

def clean():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def prepare(obj, name, budget, section_plane=None):
    # Bake the imported world transform before detaching the mesh from its source hierarchy.
    world = obj.matrix_world.copy()
    obj.parent = None
    obj.matrix_world = Matrix.Identity(4)
    mesh = obj.data
    mesh.transform(world)
    low = Vector([min(v.co[i] for v in mesh.vertices) for i in range(3)])
    high = Vector([max(v.co[i] for v in mesh.vertices) for i in range(3)])
    pivot = (low + high) * .5
    if section_plane is not None:
        bm = bmesh.new()
        bm.from_mesh(mesh)
        bmesh.ops.bisect_plane(bm, geom=list(bm.verts)+list(bm.edges)+list(bm.faces),
                               plane_co=(section_plane,0,0), plane_no=(1,0,0),
                               dist=1e-9, clear_outer=True)
        bm.to_mesh(mesh)
        bm.free()
    mesh.transform(Matrix.Translation(-pivot))
    obj.location = pivot
    obj.name = mesh.name = name
    for polygon in mesh.polygons:
        polygon.use_smooth = True
    if len(mesh.polygons) > budget:
        bpy.context.view_layer.objects.active = obj
        reduced = obj.modifiers.new("Mobile surface", "DECIMATE")
        reduced.ratio = budget / len(mesh.polygons)
        bpy.ops.object.modifier_apply(modifier=reduced.name)
    mesh.materials.clear()

def glb(filename, parts, plane=None):
    clean()
    # Some Blender exports retain a second, empty scene. Import only the
    # active scene in a temporary copy; preserve its root hierarchy and data.
    raw = filename.read_bytes()
    size = struct.unpack_from("<I",raw,12)[0]
    manifest = json.loads(raw[20:20+size])
    manifest["scenes"] = [manifest["scenes"][manifest.get("scene",0)]]
    manifest["scene"] = 0
    encoded = json.dumps(manifest,separators=(",",":")).encode()
    encoded += b" "*((-len(encoded))%4)
    payload = struct.pack("<I4s",len(encoded),b"JSON")+encoded+raw[20+size:]
    with tempfile.TemporaryDirectory(dir=source) as temp:
        prepared = Path(temp)/"one-scene.glb"
        prepared.write_bytes(struct.pack("<4sII",b"glTF",2,12+len(payload))+payload)
        bpy.ops.import_scene.gltf(filepath=str(prepared))
    objects = list(bpy.context.scene.objects)
    # HRA nests retinal landmarks in retinal parent meshes. Snapshot world
    # transforms before changing any source parent's pivot or mesh.
    selected = {obj:obj.matrix_world.copy() for obj in objects if obj.type == "MESH" and obj.name in parts}
    for obj,world in selected.items():
        obj.parent = None
        obj.matrix_world = world
    bpy.context.view_layer.update()
    for obj in objects:
        if obj.type == "MESH" and obj.name in parts:
            name, budget = parts[obj.name]
            prepare(obj, name, budget, plane)
    keep = {part[0] for part in parts.values()}
    for obj in list(bpy.context.scene.objects):
        if obj.type != "MESH" or obj.name not in keep:
            bpy.data.objects.remove(obj, do_unlink=True)
    assert {obj.name for obj in bpy.context.scene.objects} == keep

ventricles = ["Lateral ventricle.l","Lateral ventricle.r","Third ventricle","Aqueduct of midbrain","Fourth ventricle","Pons.l","Pons.r","Precentral gyrus.l","Precentral gyrus.r"]
neighboring_structures = ["Caudate nucleus","Putamen","Globus pallidus","Thalamus","Midbrain","Medulla oblongata"]
parts = {name:6000 for name in ventricles}
parts.update({name+side:2500 for name in neighboring_structures for side in [".l",".r"]})
glb(repo / "assets" / "nerves-head.glb", {"Nerve | "+name:(name,budget) for name,budget in parts.items()})
export("ventricles")

# All three ossicles from the same left ear, retaining their original joint relationships.
ossicles = ["Malleus","Incus","Stapes"]
glb(repo / "assets" / "skeleton.glb", {name+".l.001":(name,9000) for name in ossicles})
export("ossicles")

eye = {"sclera":"Sclera","retina":"Retina","iris":"Iris","lens":"Lens","cornea":"Cornea","ciliary_muscle":"Ciliary muscle","suspensory_ligament_of_lens":"Zonules","fovea":"Fovea","macula_lutea":"Macula lutea","optic_disc":"Optic disc","optic_choroid":"Choroid"}
glb(source / "hra-eye.glb", {"VH_M_"+part+"_L":(name,3500) for part,name in eye.items()}, .03695)
export("eye-section")

# Legacy binary VTK POLYDATA in published RAS millimetres. Use its own
# coordinate frame for a stand-alone magnified inner-ear specimen.
ear = {"ls_Hsapiens_Sa":"Anterior duct","ls_Hsapiens_Sl":"Lateral duct","ls_Hsapiens_Sp":"Posterior duct","ls_Hsapiens_utricle":"Utricle","mesh_david_sacculus":"Saccule","seg_coch_inner_scala_vestibuli":"Scala vestibuli","seg_coch_inner_scala_tympani":"Scala tympani"}
ear.update({"ls_Hsapiens_Aa":"Anterior ampulla","ls_Hsapiens_Al":"Lateral ampulla","ls_Hsapiens_Ap":"Posterior ampulla"})
clean()
for key,name in ear.items():
    with (source / (key+".vtk")).open("rb") as stream:
        while True:
            row=stream.readline()
            if row.startswith(b"POINTS "): break
            if not row: raise ValueError("Missing VTK point data")
        n=int(row.split()[1])
        vertices=[(-x/1000,-y/1000,z/1000) for x,y,z in struct.iter_unpack(">fff",stream.read(12*n))]
        while True:
            row=stream.readline()
            if row.startswith(b"POLYGONS "): break
            if not row: raise ValueError("Missing VTK polygon data")
        faces,size=map(int,row.split()[1:])
        indices=iter(struct.unpack(">"+str(size)+"i",stream.read(size*4)))
        polygons=[tuple(next(indices) for _ in range(next(indices))) for _ in range(faces)]
    mesh=bpy.data.meshes.new(name)
    mesh.from_pydata(vertices,[],polygons)
    mesh.update()
    obj=bpy.data.objects.new(name,mesh)
    bpy.context.collection.objects.link(obj)
    prepare(obj,name,4500)
export("labyrinth")

