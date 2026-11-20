"""Export selected CC BY-SA 4.0 Leiden pelvic teaching meshes as new study GLBs.

Run in Blender 4.5 with:
  blender -b --disable-autoexec --python-exit-code 1 --python scripts/blender/build_leiden_pelvic_study.py -- LEIDEN_GLB NEW_OUTPUT_DIR
"""

import hashlib
import sys
from pathlib import Path

import bmesh
import bpy
from mathutils import Matrix, Vector


SOURCE_SHA256 = "3846fc5c8f2db944a174648a8cdfe91ca1a6ec16d7d54389d585e69d7b1f7e92"
SOURCE_URL = "https://caskanatomy.info/open3dviewer/?model=pelvicfloor"
REQUIRED_GROUPS = {
    "ischiocavernosus.glb": [("Ischiocavernosus muscle.r", "Ischiocavernosus", False)],
    "pelvic-diaphragm.glb": [
        ("Coccygeus muscle.r", "Coccygeus", True),
        ("Illiococcygeus (Levator Ani).r", "Iliococcygeus", True),
        ("Pubo-rectalis muscle / Pubococcygeus (Levator Ani).r", "Pubococcygeus and puborectalis base", True),
        ("Pubo-rectalis overlay.r", "Puborectalis", True),
        ("Pubococcygeus overlay.r", "Pubococcygeus", True),
    ],
}
COLORS = {
    "Ischiocavernosus": (.55, .24, .16, 1),
    "Coccygeus": (.21, .34, .62, 1),
    "Iliococcygeus": (.51, .22, .13, 1),
    "Pubococcygeus and puborectalis base": (.26, .20, .19, 1),
    "Puborectalis": (.15, .48, .40, 1),
    "Pubococcygeus": (.67, .42, .15, 1),
}


def selected_meshes(source_names):
    result = []
    for source_name, name, mirrored in source_names:
        donor = bpy.data.objects[source_name]
        if donor.type != "MESH" or len(donor.data.polygons) < 20:
            raise ValueError(f"Expected a usable mesh for {source_name}")
        material = bpy.data.materials.new(name)
        material.use_nodes = True
        shader = material.node_tree.nodes.get("Principled BSDF")
        shader.inputs["Base Color"].default_value = COLORS[name]
        shader.inputs["Roughness"].default_value = 0.72
        material.use_backface_culling = False
        for reflection in (False, True) if mirrored else (False,):
            obj = bpy.data.objects.new(name, donor.data.copy())
            bpy.context.scene.collection.objects.link(obj)
            transform = donor.matrix_world.copy()
            if reflection:
                transform = Matrix.Diagonal(Vector((-1, 1, 1, 1))) @ transform
            obj.data.transform(transform)
            if reflection:
                obj.data.flip_normals()
            obj.name = f"{name} ({'left' if reflection else 'right'})" if mirrored else name
            obj["sourceName"] = source_name
            obj["mirrored"] = reflection
            obj["sourceUrl"] = SOURCE_URL
            obj["license"] = "CC BY-SA 4.0"
            obj.data.materials.clear()
            obj.data.materials.append(material)
            bm = bmesh.new()
            bm.from_mesh(obj.data)
            # Keep the original shape while welding seams and coincident, oppositely wound faces.
            bmesh.ops.remove_doubles(bm, verts=bm.verts[:], dist=0.000001)
            if name == "Ischiocavernosus":
                bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
            print(obj.name, "faces", len(bm.faces), "boundary edges", sum(edge.is_boundary for edge in bm.edges))
            bm.to_mesh(obj.data)
            bm.free()
            for polygon in obj.data.polygons:
                polygon.use_smooth = True
            result.append(obj)
    return result


def export(path, objects):
    bbox = [obj.matrix_world @ Vector(point) for obj in objects for point in obj.bound_box]
    center = Vector([(min(p[axis] for p in bbox) + max(p[axis] for p in bbox)) / 2 for axis in range(3)])
    bpy.ops.object.select_all(action="DESELECT")
    for obj in objects:
        obj.location -= center
        obj.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath=str(path), export_format="GLB", use_selection=True, export_yup=True,
        export_apply=True, export_texcoords=False, export_extras=True,
    )
    for obj in objects:
        bpy.data.objects.remove(obj, do_unlink=True)


def main():
    path, out = map(Path, sys.argv[sys.argv.index("--") + 1:])
    if hashlib.sha256(path.read_bytes()).hexdigest() != SOURCE_SHA256:
        raise ValueError("The downloaded Leiden model does not match the reviewed revision")
    out.mkdir(parents=True, exist_ok=True)
    for file in REQUIRED_GROUPS:
        if (out / file).exists():
            raise FileExistsError(f"Use a new export directory, {out / file} exists")
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(path))
    for file, spec in REQUIRED_GROUPS.items():
        export(out / file, selected_meshes(spec))


if __name__ == "__main__":
    main()
