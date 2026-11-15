
"""Build the atlas vocalis supplement with Blender 4.5.

Usage: blender --background --disable-autoexec --python-exit-code 1 \
  --python build_muscle_vocalis.py -- REPOSITORY RECIPE NEW_OUTPUT_DIR

The recipe names the original OBJs relative to its own location. The output
directory must be new. Review its GLB and manifest before replacing either
atlas file. The earlier head/neck geometry and its compression stay intact.
"""

import hashlib
import json
from pathlib import Path
import shutil
import struct
import sys

import bpy
from mathutils import Matrix, Vector


def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def backup_files(files, folder):
    folder.mkdir()
    backup = []
    for source in files:
        target = folder / source.name
        if target.exists():
            raise ValueError(f"Duplicate backup filename: {target}")
        shutil.copy2(source, target)
        checksum = sha256(source)
        if sha256(target) != checksum:
            raise RuntimeError(f"Backup does not match {source}")
        backup.append({"source": str(source), "file": target.name, "sha256": checksum})
    write_json(folder / "SHA256.json", backup)


def write_json(path, content):
    path.write_text(json.dumps(content, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def read_glb(path):
    data = path.read_bytes()
    magic, version, length, json_size, json_tag = struct.unpack_from("<4sIII4s", data)
    binary_offset = 20 + json_size
    binary_size, binary_tag = struct.unpack_from("<I4s", data, binary_offset)
    if (magic, version, length, json_tag, binary_tag) != (b"glTF", 2, len(data), b"JSON", b"BIN\0"):
        raise ValueError(f"Unexpected GLB container in {path}")
    if binary_offset + 8 + binary_size != len(data):
        raise ValueError(f"Unexpected additional GLB payload in {path}")
    return json.loads(data[20:binary_offset]), data[binary_offset + 8:]


def append_static_meshes(base_path, addition_path, result_path):
    """Append two plain Blender primitives to the existing single-buffer atlas."""
    base, base_data = read_glb(base_path)
    addition, addition_data = read_glb(addition_path)
    if (len(base["buffers"]) != 1 or len(addition["buffers"]) != 1 or
            any(key in addition for key in ("animations", "skins", "textures", "extensionsUsed")) or
            len(addition["scenes"]) != 1 or len(addition["nodes"]) != 2):
        raise ValueError("The laryngeal supplement must contain two plain static mesh nodes")

    offsets = {key: len(base[key]) for key in ("bufferViews", "accessors", "materials", "meshes", "nodes")}
    for view in addition["bufferViews"]:
        view["byteOffset"] = view.get("byteOffset", 0) + len(base_data)
    for accessor in addition["accessors"]:
        accessor["bufferView"] += offsets["bufferViews"]
    for mesh in addition["meshes"]:
        for primitive in mesh["primitives"]:
            primitive["indices"] += offsets["accessors"]
            primitive["material"] += offsets["materials"]
            primitive["attributes"] = {
                key: index + offsets["accessors"] for key, index in primitive["attributes"].items()
            }
    for node in addition["nodes"]:
        if "children" in node or "mesh" not in node:
            raise ValueError("The supplement nodes must be standalone meshes")
        node["mesh"] += offsets["meshes"]
    for key in offsets:
        base[key].extend(addition[key])
    base["scenes"][base["scene"]]["nodes"].extend(
        index + offsets["nodes"] for index in addition["scenes"][0]["nodes"]
    )
    payload = base_data + addition_data
    base["buffers"][0]["byteLength"] = len(payload)
    gltf = json.dumps(base, separators=(",", ":"), ensure_ascii=False).encode()
    gltf += b" " * (-len(gltf) % 4)
    result_path.write_bytes(
        struct.pack("<4sIII4s", b"glTF", 2, 28 + len(gltf) + len(payload), len(gltf), b"JSON")
        + gltf + struct.pack("<I4s", len(payload), b"BIN\0") + payload
    )


def source_geometry(path, registration):
    scale = registration["scale"]
    rotation = Matrix(registration["rotation"])
    translation = Vector(registration["translationM"])
    vertices, faces = [], []
    for line in path.read_text(encoding="utf-8").splitlines():
        fields = line.split()
        if fields and fields[0] == "v":
            source = Vector(float(p) * .001 for p in fields[1:4])
            vertices.append(scale * (rotation @ source) + translation)
        elif fields and fields[0] == "f":
            indices = [int(field.split("/")[0]) - 1 for field in fields[1:]]
            faces.append(indices)
    if not vertices or not faces:
        raise ValueError(f"No OBJ anatomy was read from {path}")
    return vertices, faces


def add_vocalis(source_path, part, recipe, material):
    vertices, faces = source_geometry(source_path, recipe["registration"])
    mesh = bpy.data.meshes.new(part["sourceName"])
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    for polygon in mesh.polygons:
        polygon.use_smooth = True
    obj = bpy.data.objects.new(part["sourceName"], mesh)
    obj.data.materials.append(material)
    bpy.context.scene.collection.objects.link(obj)
    obj["zname"] = part["sourceName"]
    obj["muscleId"] = part["id"]
    obj["muscleRegion"] = "head-neck"
    obj["muscleKind"] = "muscle"
    obj["muscleDepth"] = "deeper"
    obj["source"] = recipe["attribution"]
    obj["anatomicalSide"] = part["side"]
    lo = [min(vertex[i] for vertex in vertices) for i in range(3)]
    hi = [max(vertex[i] for vertex in vertices) for i in range(3)]
    return {
        "id": part["id"], "sourceName": part["sourceName"], "name": "Vocalis muscle",
        "muscleName": "Vocalis muscle", "nameCorrection": None, "region": "head-neck",
        "side": part["side"], "kind": "muscle", "depth": "deeper",
        "parents": ["Intrinsic muscles of the larynx", "Thyroarytenoid muscle"],
        "sourcePolygons": len(faces), "sourceDataset": "BodyParts3D / Anatomography 4.3",
        "sourceURL": recipe["sourceURL"], "sourceFile": "model-sources/" + part["sourceFile"],
        "sourceSHA256": part["sourceSHA256"], "sourceLicense": "CC BY 4.0",
        "sourceLicenseURL": recipe["licenseURL"], "sourceAttribution": recipe["attribution"],
        "bounds": {"min": [lo[0], lo[2], -hi[1]], "max": [hi[0], hi[2], -lo[1]]},
        "teaching": recipe["teaching"], "status": "source-aligned-reference",
        "assessment": "learn-only", "reviewNotice": recipe["reviewNotice"],
    }


def main():
    repo, recipe_path, output = (Path(arg).resolve() for arg in sys.argv[sys.argv.index("--") + 1:])
    recipe = json.loads(recipe_path.read_text(encoding="utf-8"))
    manifest_path = repo / "src/muscle-models.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    asset = manifest["assets"]["head-neck"]
    original = repo / "assets" / asset["file"]
    if sha256(original) != asset["sha256"]:
        raise RuntimeError("The head/neck base should match its manifest before adding anatomy")
    if sha256(repo / "assets/skeleton.glb") != recipe["registration"]["targetSkeletonSHA256"]:
        raise RuntimeError("The target cartilages changed and need a new registration")
    part_ids = {part["id"] for part in recipe["parts"]}
    if part_ids.intersection(component["id"] for component in manifest["components"]):
        raise ValueError("The head/neck base already contains one or both vocalis muscles")
    sources = [recipe_path.parent / part["sourceFile"] for part in recipe["parts"]]
    for source, part in zip(sources, recipe["parts"]):
        if sha256(source) != part["sourceSHA256"]:
            raise RuntimeError(f"Source hash mismatch for {source}")
    output.mkdir(parents=True)
    backup_files([original, repo / "assets/skeleton.glb", manifest_path, recipe_path, *sources],
                 output / "before_blender_edit")

    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.context.scene.name = "Osteon vocalis source alignment"
    material = bpy.data.materials.new("Vocalis muscle")
    material.diffuse_color = (.45, .16, .13, 1)
    records = [add_vocalis(source, part, recipe, material)
               for source, part in zip(sources, recipe["parts"])]
    bpy.ops.wm.save_as_mainfile(filepath=str(output / "vocalis.blend"))
    backup_files([output / "vocalis.blend"], output / "before_blender_export")
    addition_path = output / "vocalis.glb"
    bpy.ops.export_scene.gltf(filepath=str(addition_path), export_extras=True,
                              export_format="GLB", export_normals=True)
    result = output / asset["file"]
    append_static_meshes(original, addition_path, result)
    asset.update(bytes=result.stat().st_size, sha256=sha256(result),
                 components=asset["components"] + len(records),
                 backup=output.name + "/before_blender_edit")
    manifest["components"].extend(records)
    manifest.setdefault("supplements", {})["vocalis"] = "model-sources/muscle-vocalis.json"
    write_json(output / "muscle-models.json", manifest)


if __name__ == "__main__":
    main()
