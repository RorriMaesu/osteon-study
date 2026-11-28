"""Export and install the native Z-Anatomy outer skin for the registered body.

blender -b Z-Anatomy/Startup.blend --disable-autoexec --python-exit-code 1 \
    -P refresh_registered_skin.py -- registered-organs.glb backup_directory

The .blend is read only. A verified, timestamped copy of the destination GLB
is made before replacement. All non-skin buffer views are checked byte for byte.
"""
import hashlib
import json
import re
import shutil
import struct
import sys
import tempfile
import uuid
from datetime import datetime, timezone
from pathlib import Path

import bpy


def make_exterior_mesh():
    root = bpy.data.objects["Regions of human body.g"]
    patches = sorted((
        obj for obj in root.children_recursive
        if obj.type == "MESH" and len(obj.data.polygons)
        and not re.search(r"\.(j|t|s|i)$", obj.name) and obj.parent.name != "Hairs.g"
    ), key=lambda obj: obj.name)
    modifiers = [m for obj in patches for m in obj.modifiers if m.type == "SOLIDIFY" and m.show_viewport]
    for modifier in modifiers:
        modifier.show_viewport = False
    bpy.context.view_layer.update()
    graph = bpy.context.evaluated_depsgraph_get()
    vertices, faces, seams, seen_faces = [], [], {}, set()
    joined = duplicates = 0
    for obj in patches:
        evaluated = obj.evaluated_get(graph)
        mesh = evaluated.to_mesh()
        transform = evaluated.matrix_world
        reflected = transform.to_3x3().determinant() < 0
        points = [transform @ vertex.co for vertex in mesh.vertices]
        # Quantization is used only for matching; stored positions are the
        # original donor coordinates. Unmatched anatomical apertures stay open.
        keys = [tuple(round(value * 1e6) for value in point) for point in points]
        edge_use = {}
        for face in mesh.polygons:
            for edge in face.edge_keys:
                edge_use[edge] = edge_use.get(edge, 0) + 1
        boundary = {i for edge, count in edge_use.items() if count == 1 for i in edge}
        indices = []
        for i, point in enumerate(points):
            if i in boundary and keys[i] in seams:
                indices.append(seams[keys[i]])
                joined += 1
            else:
                index = len(vertices)
                indices.append(index)
                vertices.append(point)
                if i in boundary:
                    seams[keys[i]] = index
        for face in mesh.polygons:
            signature = tuple(sorted(keys[i] for i in face.vertices))
            if signature in seen_faces:
                duplicates += 1
                continue
            seen_faces.add(signature)
            polygon = [indices[i] for i in face.vertices]
            if len(set(polygon)) == len(polygon):
                faces.append(polygon[::-1] if reflected else polygon)
        evaluated.to_mesh_clear()
    exterior = bpy.data.meshes.new("Registered outer skin")
    exterior.from_pydata(vertices, [], faces)
    exterior.update()
    for face in exterior.polygons:
        face.use_smooth = True
    for modifier in modifiers:
        modifier.show_viewport = True
    bpy.context.view_layer.update()
    print("SKIN patches, shared boundary vertices, duplicate polygons:", len(patches), joined, duplicates)
    return exterior


def export_exterior(destination):
    exterior = make_exterior_mesh()
    scene = bpy.data.scenes.new("Registered exterior")
    bpy.context.window.scene = scene
    obj = bpy.data.objects.new("skin-exterior", exterior)
    scene.collection.objects.link(obj)
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.export_scene.gltf(filepath=str(destination), export_format="GLB", use_selection=True,
        use_active_scene=True, export_yup=True, export_attributes=False, export_texcoords=False,
        export_normals=True, export_tangents=False, export_animations=False, export_materials="NONE",
        export_cameras=False, export_lights=False)


def read_glb(path):
    raw = path.read_bytes()
    if raw[:4] != b"glTF" or struct.unpack_from("<I", raw, 4)[0] != 2:
        raise ValueError("Expected a binary glTF 2 model")
    length = struct.unpack_from("<I", raw, 12)[0]
    return json.loads(raw[20:20 + length]), raw[28 + length:]


def view_bytes(blob, view):
    start = view.get("byteOffset", 0)
    return blob[start:start + view["byteLength"]]


def skin_accessors(document, name):
    node, = [n for n in document["nodes"] if n.get("name") == name]
    primitive, = document["meshes"][node["mesh"]]["primitives"]
    if set(primitive["attributes"]) != {"POSITION", "NORMAL"}:
        raise ValueError("Unexpected skin attributes")
    return [primitive["attributes"]["POSITION"], primitive["attributes"]["NORMAL"], primitive["indices"]]


def replace_skin(original, replacement, staged):
    document, data = read_glb(original)
    exterior, surface = read_glb(replacement)
    replace = {}
    for old, new in zip(skin_accessors(document, "skin"), skin_accessors(exterior, "skin-exterior")):
        accessor = document["accessors"][old]
        view_id = accessor["bufferView"]
        if sum(a.get("bufferView") == view_id for a in document["accessors"]) != 1:
            raise ValueError("Skin buffer unexpectedly shared with another accessor")
        source = exterior["accessors"][new]
        replace[view_id] = view_bytes(surface, exterior["bufferViews"][source["bufferView"]])
        document["accessors"][old] = dict(source, bufferView=view_id)
    buffer = bytearray()
    for i, view in enumerate(document["bufferViews"]):
        payload = replace[i] if i in replace else view_bytes(data, view)
        view["byteOffset"] = len(buffer)
        view["byteLength"] = len(payload)
        buffer.extend(payload)
        buffer.extend(b'\0' * (-len(buffer) % 4))
    document["buffers"][0]["byteLength"] = len(buffer)
    metadata = json.dumps(document, ensure_ascii=False, separators=(",", ":")).encode("utf8")
    metadata += b" " * (-len(metadata) % 4)
    with staged.open("wb") as stream:
        stream.write(struct.pack("<4sIIII", b"glTF", 2, 28 + len(metadata) + len(buffer), len(metadata), 0x4e4f534a))
        stream.write(metadata)
        stream.write(struct.pack("<I4s", len(buffer), b"BIN\0"))
        stream.write(buffer)
    prior, _ = read_glb(original)
    result, produced = read_glb(staged)
    for key in prior.keys() - {"bufferViews", "accessors", "buffers"}:
        if prior[key] != result[key]:
            raise ValueError("Changed registered scene attribute " + key)
    for old, new in zip(prior["accessors"], result["accessors"]):
        if old["bufferView"] not in replace and old != new:
            raise ValueError("Changed a non-skin accessor")
    for i, (old, new) in enumerate(zip(prior["bufferViews"], result["bufferViews"])):
        expected = replace[i] if i in replace else view_bytes(data, old)
        if view_bytes(produced, new) != expected:
            raise ValueError("Buffer verification failed")
    print("VERIFIED", len(prior["bufferViews"]) - len(replace), "unchanged non-skin buffer views")


def main():
    target, backup_root = map(Path, sys.argv[sys.argv.index("--") + 1:])
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S-%fZ")
    folder = backup_root / stamp
    folder.mkdir(parents=True, exist_ok=False)
    backup = folder / target.name
    shutil.copyfile(target, backup)
    digest = hashlib.sha256(target.read_bytes()).hexdigest()
    if hashlib.sha256(backup.read_bytes()).hexdigest() != digest:
        raise RuntimeError("Backup failed verification")
    print("BACKUP", backup, digest, flush=True)
    with tempfile.TemporaryDirectory(dir=folder) as work:
        surface = Path(work) / "skin.glb"
        export_exterior(surface)
        staged = target.with_name("skin-update-" + uuid.uuid4().hex + ".glb")
        try:
            replace_skin(backup, surface, staged)
            try:
                staged.replace(target)
            except PermissionError:
                # Keep the already verified result if a desktop viewer temporarily
                # denies replacing an open model on Windows.
                recovery = folder / ("verified-" + target.name)
                shutil.copyfile(staged, recovery)
                print("STAGED", recovery, hashlib.sha256(recovery.read_bytes()).hexdigest(), flush=True)
                raise
        finally:
            staged.unlink(missing_ok=True)


if __name__ == "__main__":
    main()
