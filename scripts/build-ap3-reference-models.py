"""Blender 4.5 --background --factory-startup --disable-autoexec -P this_script --
TASK Z_Anatomy.blend BP3D_directory HRA_NIH_directory NEW_output_directory
Tasks: regions, gut, kidney, node, glomerulus, embryos. Existing outputs are protected.
"""
import csv
import math
import sys
import zipfile
from collections import defaultdict
from pathlib import Path

import bpy
import bmesh
import numpy as np
from mathutils import Vector, Matrix

task, *paths = sys.argv[sys.argv.index("--") + 1:]
blend, bp3d, reference, target = map(Path, paths)
target.mkdir(parents=True, exist_ok=True)


def export(name, objects):
    path = target / (name + ".glb")
    if path.exists():
        raise FileExistsError(f"Save a versioned backup first and export to a new directory: {path}")
    bpy.ops.object.select_all(action="DESELECT")
    for obj in objects:
        obj.select_set(True)
    bpy.ops.export_scene.gltf(filepath=str(path.resolve()), export_format="GLB", use_selection=True,
        use_active_scene=True, export_apply=True, export_yup=True, export_materials="NONE", export_cameras=False,
        export_lights=False, export_animations=False)
    print("EXPORTED", name, path.stat().st_size, flush=True)


def compact(obj, triangles):
    if len(obj.data.polygons) > triangles:
        dec = obj.modifiers.new("Preserve landmarks at mobile resolution", "DECIMATE")
        dec.ratio = triangles / len(obj.data.polygons)
    for face in obj.data.polygons:
        face.use_smooth = True


def mesh(name, vertices, faces):
    geo = bpy.data.meshes.new(name)
    geo.from_pydata(vertices, [], faces)
    geo.update()
    obj = bpy.data.objects.new(name, geo)
    bpy.context.collection.objects.link(obj)
    return obj


def regional():
    bpy.ops.wm.open_mainfile(filepath=str(blend), load_ui=False, use_scripts=False)
    graph = bpy.context.evaluated_depsgraph_get()
    groups = {
        "lung-lobes": ["Trachea", "Right main bronchus", "Left main bronchus", "Superior lobe of right lung",
            "Middle lobe of right lung", "Inferior lobe of right lung", "Superior lobe of left lung",
            "Inferior lobe of left lung", "Diaphragm", "Thyroid cartilage", "Sixth rib.l", "Sixth rib.r",
            "Right pulmonary artery", "Left pulmonary artery"],
        "urinary-tract": ["Kidney.l", "Kidney.r", "Renal pelvis.l", "Renal pelvis.r", "Ureter.l", "Ureter.r",
            "Urinary bladder", "Urethra", "Right renal artery", "Left renal artery", "Sacrum"],
        "sperm-route": ["Testis.l", "Testis.r", "Epididymis.l", "Epididymis.r", "Ductus deferens.l",
            "Ductus deferens.r", "Ejaculatory duct.l", "Ejaculatory duct.r", "Seminal gland.l",
            "Seminal gland.r", "Prostate", "Urethra", "Urinary bladder", "Glans penis", "Corpus spongiosum of penis"],
        "accessory-ducts": ["Liver", "Gallbladder", "Pancreas", "Bile duct", "Pancreatic duct",
            "Duodenum", "Hepatic portal vein"],
        "distal-colon": ["Descending colon", "Sigmoid colon", "Sacrum"],
        "fuel-organs": ["Liver", "Stomach", "Duodenum", "Pancreas", "Rectus abdominis muscle.r", "Hepatic portal vein"],
        "immune-organs": ["Right lobe of thymus", "Left lobe of thymus", "Spleen", "Palatine tonsil.l",
            "Palatine tonsil.r", "Internal jugular vein.r", "Internal jugular vein.l",
            "Right subclavian vein", "Left subclavian vein", "Sixth rib.l", "Sixth rib.r"]
    }
    for name, originals in groups.items():
        if task == "sperm-route" and name != task:
            continue
        output = bpy.data.scenes.new(name)
        copies = []
        for label in originals:
            original = bpy.data.objects[label].evaluated_get(graph)
            geo = bpy.data.meshes.new_from_object(original, depsgraph=graph)
            geo.transform(original.matrix_world)
            if not geo.polygons:
                raise ValueError(f"{label} has no mesh")
            key = label.lower().replace(" ", "_").replace(".l", "_left").replace(".r", "_right")
            obj = bpy.data.objects.new(key, geo)
            output.collection.objects.link(obj)
            compact(obj, 7500)
            copies.append(obj)
        old = bpy.context.window.scene
        bpy.context.window.scene = output
        if name == "sperm-route":
            # The segmented duct ends about 32 mm from the ejaculatory duct.
            # Show an explicitly illustrative terminal course behind the bladder.
            for side, sign in [("left", 1), ("right", -1)]:
                curve = bpy.data.curves.new("Terminal ampullary continuation", "CURVE")
                curve.dimensions = "3D"
                curve.resolution_u = 12
                curve.bevel_depth = .00135
                curve.bevel_resolution = 3
                spline = curve.splines.new("BEZIER")
                points = [(.032,.859,-.034,1),(.026,.864,-.041,1.05),
                          (.018,.858,-.044,1.35),(.012,.848,-.043,1.45),(.007,.838,-.035,1)]
                spline.bezier_points.add(len(points)-1)
                for bp, (x,y,z,radius) in zip(spline.bezier_points,points):
                    bp.co = (sign*x,-z,y)
                    bp.handle_left_type = bp.handle_right_type = "AUTO"
                    bp.radius = radius
                duct = bpy.data.objects.new("illustrative_terminal_ductus_"+side,curve)
                output.collection.objects.link(duct)
                copies.append(duct)
        export(name, copies)
        bpy.context.window.scene = old
        for obj in copies:
            bpy.data.objects.remove(obj, do_unlink=True)
        bpy.data.scenes.remove(output)


def alimentary():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    ids = defaultdict(set)
    with (bp3d / "partof_element_parts.txt").open() as f:
        for _, label, part in list(csv.reader(f, delimiter="\t"))[1:]:
            ids[label].add(part)
    parts = ["esophagus", "stomach", "duodenum", "jejunum", "ileum", "ileocecal junction",
             "ascending colon", "transverse colon", "descending colon", "rectum"]
    result = []
    with zipfile.ZipFile(bp3d / "partof_BP3D_4.0_obj_99.zip") as archive:
        prefix = archive.namelist()[0].split("/")[0] + "/"
        for label in parts:
            files = set(ids[label])
            if label == "ileum":
                files -= ids["ileocecal junction"]
            vertices, faces = [], []
            for part in sorted(files):
                offset = len(vertices)
                for line in archive.read(prefix + part + ".obj").splitlines():
                    if line.startswith(b"v "):
                        vertices.append(tuple(float(v) * .001 for v in line.split()[1:4]))
                    elif line.startswith(b"f "):
                        faces.append(tuple(offset + int(v.split(b"/")[0]) - 1 for v in line.split()[1:]))
            if not faces:
                raise ValueError(label)
            obj = mesh(label.replace(" ", "_"), vertices, faces)
            compact(obj, 11000)
            result.append(obj)
    export("alimentary-tract", result)


def hra():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    for name in ([task, "ureter"] if task == "kidney" else [task]):
        bpy.ops.import_scene.gltf(filepath=str(reference / (name + ".glb")))
    objects = [o for o in bpy.context.scene.objects if o.type == "MESH"]
    if task == "kidney":
        # Keep the short proximal ureter, in donor coordinates, so the renal section fills the viewer.
        ureter = next(o for o in objects if o.name == "VH_M_ureter_L")
        z = [float((ureter.matrix_world @ v.co).z) for v in ureter.data.vertices]
        cut = max(z) - .035
        local_plane = ureter.matrix_world.inverted() @ Vector((0, 0, cut))
        local_normal = ureter.matrix_world.to_3x3().transposed() @ Vector((0, 0, 1))
        bm = bmesh.new()
        bm.from_mesh(ureter.data)
        bmesh.ops.bisect_plane(bm, geom=list(bm.verts) + list(bm.edges) + list(bm.faces),
            plane_co=local_plane, plane_no=local_normal, clear_inner=True)
        bm.to_mesh(ureter.data)
        bm.free()
    for obj in objects:
        compact(obj, 1400 if obj.name.startswith("podocyte") else 10000)
    export(task, objects)


def embryos():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    result = []
    # Scale each source independently using maximum inter-vertex length and the linked
    # fixed specimen's greatest length. Compute the diameter from convex hull vertices.
    for stage, mm, xpos in [(12, 3.9, -21), (16, 10.5, -12), (20, 20, 1), (23, 31, 20)]:
        bpy.ops.wm.stl_import(filepath=str(reference / f"stage{stage}.stl"), forward_axis="Y", up_axis="Z")
        obj = bpy.context.selected_objects[0]
        obj.name = f"stage_{stage}"
        coords = np.array([v.co[:] for v in obj.data.vertices])
        bm = bmesh.new()
        bm.from_mesh(obj.data)
        hull = bmesh.ops.convex_hull(bm, input=list(bm.verts))["geom"]
        extremes = np.array([v.co[:] for v in hull if isinstance(v, bmesh.types.BMVert)])
        bm.free()
        length = max(np.max(np.linalg.norm(extremes - p, axis=1)) for p in extremes)
        scale = mm * .001 / length
        center = (coords.max(0) + coords.min(0)) / 2
        # In NIH's STL display frame Y is the longest axis. Keep it vertical.
        lateral = Matrix.Rotation(math.pi/2 if stage >= 20 else 0, 4, "Z")
        obj.data.transform(Matrix.Translation((xpos*.001, 0, mm*.0005)) @ lateral @ Matrix.Rotation(math.pi/2, 4, "X")
                           @ Matrix.Scale(scale, 4) @ Matrix.Translation(-Vector(center)))
        compact(obj, 14000)
        print(f"Stage {stage}: raw diameter {length:.3f}, publication {mm} mm", flush=True)
        result.append(obj)
    export("carnegie-stages", result)


if task in ("regions","sperm-route"):
    regional()
elif task == "gut":
    alimentary()
elif task in ("kidney", "node", "glomerulus"):
    hra()
elif task == "embryos":
    embryos()
else:
    raise ValueError(task)

