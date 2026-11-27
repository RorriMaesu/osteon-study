"""Build the shared body layer in Blender 4.5.1 and a separate female breast preparation.

blender -b --factory-startup --disable-autoexec -t 4 --python-exit-code 1 -P this.py --
  registered|mammary|female-urinary Z-Anatomy.blend BodyParts3D_dir HRA_dir repository backup_dir

Existing inputs and outputs are backed up and verified before editing export copies.
"""
import csv
import hashlib
import json
import re
import shutil
import sys
import uuid
import zipfile
from pathlib import Path

import bmesh
import bpy
import numpy as np

sys.path.insert(0, str(Path(__file__).parent))
from registered_organ_parts import systems

mode, blend, bp_dir, hra, repo, backup = sys.argv[sys.argv.index("--") + 1:]
blend, bp_dir, hra, repo, backup = map(Path, (blend, bp_dir, hra, repo, backup))
asset_dir = repo / "assets/organ-atlas"
asset_dir.mkdir(parents=True, exist_ok=True)
backup.mkdir(parents=True, exist_ok=True)
node_map = repo / "src/organ-atlas-assets.json"
data_name = {"mammary":"mammary-glands","female-urinary":"female-urinary","registered":"registered-organs"}[mode]
output = asset_dir / (data_name + ".glb")


def sha(path):
    with path.open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


def safeguard(path):
    if not path.exists():
        return
    digest = sha(path)
    copy = backup / f"{path.stem}-{digest.upper()}{path.suffix}"
    if not copy.exists():
        shutil.copyfile(path, copy)
    if sha(copy) != digest:
        raise RuntimeError(f"Backup verification failed for {path}")
    return digest


def divide_left_bowel(objects, height):
    # Divide the decimated *working copy* before glTF flattens its loop data.
    # bmesh interpolates UVs/colors at the cut and keeps per-face material slots.
    by_name = {obj.name: obj for obj in objects}
    graph = bpy.context.evaluated_depsgraph_get()
    source = bpy.data.meshes.new_from_object(by_name["descending_colon"].evaluated_get(graph),
        preserve_all_data_layers=True, depsgraph=graph)
    for name, distal in (("descending_colon", False), ("sigmoid_colon", True)):
        target = by_name[name]
        bm = bmesh.new()
        try:
            bm.from_mesh(source)
            bmesh.ops.bisect_plane(bm, geom=list(bm.verts)+list(bm.edges)+list(bm.faces),
                plane_co=(0, 0, height), plane_no=(0, 0, 1), dist=1e-8,
                clear_outer=distal, clear_inner=not distal)
            if not bm.faces:
                raise ValueError("Bowel split missed " + name)
            bm.normal_update()
            result = source.copy()
            bm.to_mesh(result)
            target.modifiers.clear()
            target.data = result
        finally:
            bm.free()
    bpy.data.meshes.remove(source)


def publish(objects):
    if mode == 'registered':
        # Every registered copy already has its source world transform baked in.
        # Blender +Z maps to glTF +Y (superior).
        divide_left_bowel(objects, .960)
    bpy.ops.object.select_all(action="DESELECT")
    for obj in objects:
        obj.select_set(True)
    staged = asset_dir / (data_name + "-" + uuid.uuid4().hex + ".glb")
    bpy.ops.export_scene.gltf(filepath=str(staged), export_format="GLB", use_selection=True,
        use_active_scene=True, export_apply=True, export_yup=True,
        export_materials="EXPORT", export_texcoords=True, export_normals=True, export_tangents=True,
        export_cameras=False, export_lights=False, export_animations=False)
    if staged.stat().st_size < 10000:
        raise RuntimeError("Incomplete export")
    staged.replace(output)


def reduce(obj, maximum):
    obj.data.calc_loop_triangles()
    count = len(obj.data.loop_triangles)
    if count > maximum:
        dec = obj.modifiers.new("Retain visible organ contours", "DECIMATE")
        dec.ratio = maximum / count
    for poly in obj.data.polygons:
        poly.use_smooth = True


def bounds(coords):
    aa = np.asarray(coords)
    return np.stack((aa.min(axis=0), aa.max(axis=0)))


safeguard(output)
if mode in ("mammary", "female-urinary"):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    source_files = []
    for side, letter in [("left", "l"), ("right", "r")]:
        prefix = "mammary-gland" if mode == "mammary" else "ureter"
        source_files.append(hra / f"{prefix}-female-{side}" / f"3d-vh-f-{prefix}-{letter}.glb")
    if mode == "female-urinary":
        source_files.append(hra / "urinary-bladder-female/3d-vh-f-urinary-bladder.glb")
    for file in source_files:
        safeguard(file)
        bpy.ops.import_scene.gltf(filepath=str(file))
    meshes = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
    for obj in meshes:
        # Bake world transform before discarding the HRA collection hierarchy.
        mat = obj.matrix_world.copy()
        obj.parent = None
        obj.matrix_world = mat
        if mode == "mammary":
            budget = 18000 if "lobes" in obj.name else 10500 if "ducts" in obj.name else 3000
        else:
            budget = 4600 if any(t in obj.name.lower() for t in ("ureter","dome")) else 2200
        reduce(obj, budget)
    publish(meshes)
    print("REFERENCE", mode, len(meshes), [o.name for o in meshes], flush=True)
    sys.exit(0)
if mode != "registered":
    raise ValueError(mode)

archive_file = bp_dir / "partof_BP3D_4.0_obj_99.zip"
sources = {"zAnatomySHA256": safeguard(blend), "bodyPartsZipSHA256": safeguard(archive_file)}
safeguard(node_map)
bpy.ops.wm.open_mainfile(filepath=str(blend), load_ui=False, use_scripts=False)
source_objects = dict(bpy.data.objects.items())
graph = bpy.context.evaluated_depsgraph_get()
scene = bpy.data.scenes.new("Registered organs")
copies = []
records = []
with (bp_dir / "partof_element_parts.txt").open() as stream:
    ids = {}
    for _, label, key in list(csv.reader(stream, delimiter="\t"))[1:]:
        ids.setdefault(label, set()).add(key)
archive = zipfile.ZipFile(archive_file)
prefix = archive.namelist()[0].split("/")[0] + "/"


def bp_geometry(key):
    keys = set(ids[key])
    if key == "ileum":
        keys -= ids["ileocecal junction"]
    coords, faces = [], []
    for elt in sorted(keys):
        offset = len(coords)
        for line in archive.read(prefix + elt + ".obj").splitlines():
            if line.startswith(b"v "):
                coords.append(tuple(float(x) * .001 for x in line.split()[1:4]))
            elif line.startswith(b"f "):
                faces.append(tuple(offset + int(x.split(b"/")[0]) - 1 for x in line.split()[1:]))
    return np.asarray(coords), faces


def z_mesh(label):
    obj = source_objects[label].evaluated_get(graph)
    geo = bpy.data.meshes.new_from_object(obj, preserve_all_data_layers=True, depsgraph=graph)
    geo.transform(obj.matrix_world)
    if not geo.polygons:
        raise ValueError(f"Missing anatomical surface: {label}")
    return geo


def vertices(mesh):
    xyz = np.empty(len(mesh.vertices) * 3, dtype=np.float32)
    mesh.vertices.foreach_get("co", xyz)
    return xyz.reshape(-1, 3)


# Keep the mobile bowel segments in the original database's mutual positions.
# Fit their common frame to the native abdomen using independent gross landmarks.
landmarks = [("Gallbladder","gallbladder"),("Stomach","stomach"),("Vertebra T12","twelfth thoracic vertebra"),
             ("Vertebra L1","first lumbar vertebra"),("Sacrum","sacrum"),("Descending colon","descending colon")]
deltas = []
for z, native in landmarks:
    mesh = z_mesh(z)
    a = bounds(vertices(mesh)).mean(axis=0)
    bpy.data.meshes.remove(mesh)
    b = bounds(bp_geometry(native)[0]).mean(axis=0)
    deltas.append(a-b)
shift = np.median(deltas,axis=0)
sources["bowelTranslationBlenderMetres"] = shift.round(7).tolist()
sources["bowelCentroidResidualsMm"] = {lab:round(float(np.linalg.norm(d-shift))*1000,1)
    for (lab,_),d in zip(landmarks,deltas)}
# The raw kidney surfaces are the DBCLS release. Match their own side-specific
# gross envelopes to the published atlas before using the renal hilum as a check.
kidney_metrics = {}


def database_mesh(key):
    coord, faces = bp_geometry(key)
    if "kidney" in key:
        original = z_mesh("Kidney.l" if key.startswith("left") else "Kidney.r")
        z = bounds(vertices(original))
        bpy.data.meshes.remove(original)
        db = bounds(coord)
        scale = (z[1]-z[0])/(db[1]-db[0])
        coord = (coord-db.mean(axis=0))*scale + z.mean(axis=0)
        kidney_metrics[key] = {"scale":scale.round(5).tolist()}
        role = "kidney_" + key.split()[0]
    else:
        coord += shift
        role = normal_name(key)
    mesh = bpy.data.meshes.new(role)
    mesh.from_pydata(coord.tolist(), [], faces)
    mesh.update()
    return role, mesh


def normal_name(key):
    return re.sub(r"\W+","_",key.replace(".l","_left").replace(".r","_right").lower()).strip("_").replace("oesophagus","esophagus")


def combine(key):
    if key == "skin":
        root = source_objects["Regions of human body.g"]
        surfaces = {o for o in root.children_recursive if o.type=="MESH" and o.data.polygons
            and not re.search(r"\.(j|t|s|i)$",o.name) and o.parent.name != "Hairs.g"}
        # Keep each full regional patch, including the digit and plantar surfaces.
        # Its nested small landmarks may duplicate triangles in the patch.
        names = []
        for o in surfaces:
            parent = o.parent
            while parent and parent not in surfaces:
                parent = parent.parent
            if not parent:
                names.append(o.name)
        names.sort()
    elif key in ("upper_teeth","lower_teeth"):
        pattern = re.compile(r"^"+key.split("_")[0]+r" .*?(?:incisor|canine|premolar|molar tooth)\.[lr]$",re.I)
        names = sorted(n for n in source_objects if pattern.match(n))
    else:
        source_collection = {"frontal_lobes":"Frontal lobe","parietal_lobes":"Parietal lobe",
            "temporal_lobes":"Temporal lobe","occipital_lobes":"Occipital lobe","limbic_lobes":"Limbic lobe",
            "insulae":"Insula","cerebellum":"Cerebellum"}[key]
        names = sorted(o.name for o in bpy.data.collections[source_collection].objects
            if o.type == "MESH" and not re.search(r"\.(j|t|s|i)$",o.name))
    if not names:
        raise ValueError(key)
    coords, faces = [], []
    for name in names:
        part = z_mesh(name)
        offset = len(coords)
        coords.extend(vertices(part).tolist())
        faces.extend(tuple(offset+i for i in p.vertices) for p in part.polygons)
        bpy.data.meshes.remove(part)
    combined = bpy.data.meshes.new(key)
    combined.from_pydata(coords, [], faces)
    combined.update()
    return combined


for system, group in systems.items():
    for identity, label, structures in group:
        target_names = []
        for original in structures:
            if original.startswith("%"):
                role, mesh = database_mesh(original[1:])
            elif original.startswith("@"):
                role = original[1:]
                mesh = combine(role)
            else:
                role = normal_name(original)
                mesh = z_mesh(original)
            # Rename old datablocks on this unsaved in-memory copy if Blender's
            # case-sensitive namespace would otherwise append .001 to a new mesh.
            collision = bpy.data.objects.get(role)
            if collision:
                collision.name = "__source__" + role
            obj = bpy.data.objects.new(role, mesh)
            scene.collection.objects.link(obj)
            target_names.append(role)
            compact = 2600
            if identity in ("lungs","heart","liver","stomach","skin","small-intestine","brain"):
                compact = {"skin":22000,"brain":4800,"small-intestine":12000}.get(identity,6000)
            reduce(obj, compact)
            copies.append(obj)
        record = {"id":identity, "label":label, "system":system, "targets":target_names}
        if identity == "skin":
            record["contextOnly"] = True
        if identity in ("large-intestine","small-intestine","rectum","kidneys"):
            record["registration"] = "Includes fitted BodyParts3D anatomy"
        if identity == 'large-intestine':
            record['registration'] += '. The proximal sigmoid boundary is illustrative on the continuous native left-bowel surface.'
        records.append(record)
bpy.context.window.scene = scene
bpy.context.view_layer.update()
publish(copies)
sources["kidneyFits"] = kidney_metrics
manifest = {"frame":"osteon-z-anatomy","units":"m","asset":"assets/organ-atlas/registered-organs.glb",
    "source":"assets/organ-atlas/SOURCES.md","organs":records, "registration":sources}
node_map.write_text(json.dumps(manifest, indent=2, ensure_ascii=False)+"\n", encoding="utf8")
print("BUILT", len(copies), "targets", len(records), "organs", flush=True)
