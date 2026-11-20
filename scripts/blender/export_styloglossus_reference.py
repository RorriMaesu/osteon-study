"""Build the isolated styloglossus study asset from ArtiSynth's ANSYS data.

See model-sources/STYLOGLOSSUS.md for the pinned inputs and attribution.
Run Blender 4.5 in background mode with this script and pass the input
directory and the output GLB path after --.
"""

import re
import sys
from collections import Counter
from pathlib import Path

import bmesh
import bpy
from mathutils import Vector


HEX_FACES = ((0, 1, 2, 3), (4, 5, 6, 7), (0, 1, 5, 4),
             (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7))
BUNDLES = (("STY_L", 7, "Left"), ("STY_R", 8, "Right"))


def selection_macros(source):
    selections = {}
    active = []
    for line in source.splitlines():
        command = line.split("!", 1)[0].strip().split(",")
        if len(command) >= 5 and command[0] == "ESEL" and command[2] == "ELEM":
            if command[1] == "S":
                active = []
            if command[1] in {"A", "S"}:
                start = int(command[4])
                end = int(command[5]) if len(command) > 5 else start
                step = int(command[6]) if len(command) > 6 else 1
                active.extend(range(start, end + 1, step))
        elif command[0] == "CM" and command[1] in {"STY_L", "STY_R"}:
            selections[command[1]] = active.copy()
    if selections.keys() != {"STY_L", "STY_R"}:
        raise ValueError("Could not find the named styloglossus regions in the source.")
    return selections


def fiber_ends(source, bundle):
    fibers = {}
    for match in re.finditer(r"^\s*FIBER\((\d+),(\d+),(\d+)\)=(\d+)", source, re.M):
        step, index, group, node = map(int, match.groups())
        if group == bundle:
            fibers.setdefault(index, []).append((step, node))
    paths = [sorted(fiber)[-2:] for fiber in fibers.values()]
    anchors = {path[-1][1] for path in paths}
    if len(anchors) != 1:
        raise ValueError("Expected the nine source fibers to share a styloid anchor.")
    return sorted(anchors | {path[-2][1] for path in paths})


def node_rows(path):
    for line in path.read_text(encoding="ascii").splitlines():
        fields = line.split()
        if fields:
            yield fields


def material(name, color):
    data = bpy.data.materials.new(name)
    data.diffuse_color = (*color, 1)
    return data


def mesh_object(name, geometry, surface, note):
    mesh = bpy.data.meshes.new(name)
    geometry.to_mesh(mesh)
    geometry.free()
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(surface)
    obj["studyLabel"] = name
    obj["representation"] = note
    return obj


def boundary(name, cells, positions, surface):
    boundary_counts = Counter()
    oriented_faces = {}
    for cell in cells:
        for corner_indices in HEX_FACES:
            face = tuple(cell[index] for index in corner_indices)
            key = tuple(sorted(face))
            boundary_counts[key] += 1
            oriented_faces[key] = face
    faces = [oriented_faces[key] for key, count in boundary_counts.items() if count == 1]
    geometry = bmesh.new()
    vertices = {node: geometry.verts.new(positions[node]) for node in sorted({node for face in faces for node in face})}
    for face in faces:
        geometry.faces.new([vertices[node] for node in face])
    bmesh.ops.recalc_face_normals(geometry, faces=list(geometry.faces))
    return mesh_object(name, geometry, surface, "Source finite-element surface")


def envelope(name, points, surface):
    geometry = bmesh.new()
    for point in points:
        geometry.verts.new(point)
    hull = bmesh.ops.convex_hull(geometry, input=list(geometry.verts), use_existing_faces=False)
    unused = [part for part in hull["geom_unused"] if isinstance(part, bmesh.types.BMVert)]
    bmesh.ops.delete(geometry, geom=unused, context="VERTS")
    bmesh.ops.recalc_face_normals(geometry, faces=list(geometry.faces))
    return mesh_object(name, geometry, surface, "Teaching envelope of the nine source fiber endpoints")


def main():
    source_dir, output = map(Path, sys.argv[sys.argv.index("--") + 1:])
    selections = selection_macros((source_dir / "tongueIcp.3.mac").read_text(encoding="latin-1"))
    fibers = (source_dir / "Fibers.mac").read_text(encoding="latin-1")
    cells = {int(row[-1]): tuple(map(int, row[:8])) for row in node_rows(source_dir / "tongueIcp.3.elem")}
    # ArtiSynth's +X is posterior, -Y is the source's left, and +Z is superior.
    # Blender exports with +Y superior and +Z anterior in glTF.
    positions = {int(node): Vector((-float(y), float(x), float(z)))
                 for node, x, y, z in node_rows(source_dir / "tongueIcp.3.node")}

    bpy.ops.wm.read_factory_settings(use_empty=True)
    belly_material = material("Finite-element muscle surface", (.48, .15, .105))
    fiber_material = material("Estimated proximal envelope", (.63, .35, .22))
    items = []
    for code, bundle, side in BUNDLES:
        ids = selections[code]
        if any(len(set(cells[index])) != 8 for index in ids):
            raise ValueError("Styloglossus source region contains an unsupported non-hexahedral element.")
        items.append(boundary(side + " styloglossus", [cells[index] for index in ids], positions, belly_material))
        items.append(envelope(side + " styloid attachment", [positions[node] for node in fiber_ends(fibers, bundle)], fiber_material))

    points = [vertex.co for item in items for vertex in item.data.vertices]
    center = Vector([(min(v[axis] for v in points) + max(v[axis] for v in points)) / 2 for axis in range(3)])
    for item in items:
        for vertex in item.data.vertices:
            vertex.co -= center
        item.data.update()

    output.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.export_scene.gltf(filepath=str(output), export_format="GLB", export_extras=True)


if __name__ == "__main__":
    main()
