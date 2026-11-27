"""Blender 4.5 -b -P this_script -- original.glb verified-backup.glb fresh-output.glb.

The Z-Anatomy outlet is a single tube with 85 circumferential rings. Mark
the bent neck-side segment separately for teaching; the hepatic junction
is absent from the donor. Keep the original geometry and shared seam.
"""
import hashlib
import sys
from pathlib import Path

import bpy
import bmesh
from mathutils import Vector

original, backup, destination = [Path(arg).resolve() for arg in sys.argv[sys.argv.index("--") + 1:]]
digest = lambda path: hashlib.sha256(path.read_bytes()).hexdigest()
if (original == backup or destination in (original, backup) or destination.exists()
        or digest(original) != digest(backup)
        or digest(original) != "0abe6bdd2987eb4f99c36165192cce2afce9f315b51dd13a5e9d0b08235847e1"):
    raise ValueError("Expected original outlet model, its verified separate backup and a fresh destination")

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(backup), merge_vertices=True)
outlet = bpy.data.objects["bile_duct"]
bm = bmesh.new()
bm.from_mesh(outlet.data)
bmesh.ops.remove_doubles(bm, verts=list(bm.verts), dist=1e-7)
# GLB (+X left, +Y superior, +Z anterior) to Blender (+X left, +Z superior).
neck = Vector((-.03019, -.03916, 1.15737))
ring = {v for v in bm.verts if any(e.is_boundary for e in v.link_edges)
        and (outlet.matrix_world @ v.co - neck).length < .004}
visited = set()
levels = {}
while ring:
    if len(ring) != 12:
        raise ValueError("Unexpected cross section")
    for v in ring:
        levels[v] = len(visited) // 12
    visited.update(ring)
    ring = {edge.other_vert(v) for v in ring for edge in v.link_edges} - visited
if len(levels) != 85 * 12:
    raise ValueError("Unexpected outlet topology")
seam = 17
source_faces = len(bm.faces)
for name, proximal in [("cystic_duct", True), ("bile_duct", False)]:
    faces = [f for f in bm.faces if (max(levels[v] for v in f.verts) <= seam) == proximal]
    verts = sorted({v for f in faces for v in f.verts}, key=lambda v: v.index)
    ids = {v: i for i, v in enumerate(verts)}
    geo = bpy.data.meshes.new(name)
    geo.from_pydata([v.co for v in verts], [], [[ids[v] for v in f.verts] for f in faces])
    geo.update()
    for face in geo.polygons:
        face.use_smooth = True
    if proximal:
        part = bpy.data.objects.new(name, geo)
        bpy.context.collection.objects.link(part)
        part.matrix_world = outlet.matrix_world.copy()
    else:
        outlet.data = geo
if len(outlet.data.polygons) + len(part.data.polygons) != source_faces:
    raise ValueError("Outlet faces changed during segmentation")
bm.free()
bpy.ops.export_scene.gltf(filepath=str(destination), export_format="GLB", export_yup=True,
                          export_materials="NONE", export_cameras=False, export_lights=False,
                          export_animations=False)
