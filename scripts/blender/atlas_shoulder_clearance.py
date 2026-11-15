"""Refit the posterior deltoid of the delivered Atlas in Blender 4.5."""

import hashlib
import json
import math
import shutil
import struct
import sys
from datetime import datetime, timezone
from pathlib import Path

import bpy
from mathutils import Vector


PARTS = {f'muscle-scapular-spinal-part-of-deltoid-muscle-{side}': sign
         for side, sign in [('l', 1), ('r', -1)]}
FITS_MM = (
    ((207, 52, 1305), (17, 17, 18), (5.6, 5.2, .8)),
    ((209, 54, 1291), (16, 14, 17), (2.2, -2.2, 2.0)),
)


def file_hash(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def snapshot(work, paths):
    folder = work.parent / 'model-backups' / datetime.now(timezone.utc).strftime('atlas-shoulder-%Y%m%d-%H%M%S-%f')
    folder.mkdir(parents=True)
    records = []
    for path in paths:
        if path.is_file():
            copy = folder / path.name
            shutil.copy2(path, copy)
            digest = file_hash(path)
            assert file_hash(copy) == digest, path
            records.append({'original': str(path), 'copy': copy.name, 'sha256': digest})
    (folder / 'manifest.json').write_text(json.dumps(records, indent=2) + '\n', encoding='utf-8')
    print('VERIFIED_BACKUP', folder, flush=True)
    return folder.name


def fit(point, sign):
    # The distal insertion stays on the humeral tuberosity. A small offset in
    # the intervening belly maintains its superficial course past the triceps.
    # Deltoid insertion dissections: PMID 19186076 and PMCID PMC11064717.
    p = Vector((sign * point.x, point.y, point.z)) * 1000
    for center, width, off in FITS_MM:
        squared = sum(((x - anchor) / spread)**2 for x, anchor, spread in zip(p, center, width))
        p += Vector(off) * math.exp(-.5 * squared)
    return Vector((sign * p.x, p.y, p.z)) * .001


def read_glb(path):
    with path.open('rb') as f:
        magic, version, _ = struct.unpack('<4sII', f.read(12))
        length, tag = struct.unpack('<I4s', f.read(8))
        assert (magic, version, tag) == (b'glTF', 2, b'JSON')
        doc = json.loads(f.read(length))
        length, tag = struct.unpack('<I4s', f.read(8))
        assert tag == b'BIN\0'
        binary = f.read(length)
    views = [binary[v.get('byteOffset', 0):v.get('byteOffset', 0) + v['byteLength']]
             for v in doc['bufferViews']]
    return doc, views


def write_glb(path, doc, views):
    binary = bytearray()
    for view, data in zip(doc['bufferViews'], views, strict=True):
        binary.extend(b'\0' * (-len(binary) % 4))
        view.update(byteOffset=len(binary), byteLength=len(data))
        binary.extend(data)
    binary.extend(b'\0' * (-len(binary) % 4))
    doc['buffers'][0]['byteLength'] = len(binary)
    desc = json.dumps(doc, ensure_ascii=False, separators=(',', ':')).encode()
    desc += b' ' * (-len(desc) % 4)
    path.write_bytes(struct.pack('<4sIII4s', b'glTF', 2, 28 + len(desc) + len(binary), len(desc), b'JSON')
                     + desc + struct.pack('<I4s', len(binary), b'BIN\0') + binary)


def replace_primitives(source, fitted, output):
    """Keep the other regional primitives, original metadata and materials byte-for-byte."""
    doc, views = read_glb(source)
    donor, data = read_glb(fitted)
    found = set()
    bindings = {node.get('extras', {}).get('muscleId'): node for node in donor['nodes']}
    for node in doc['nodes']:
        name = node.get('extras', {}).get('muscleId')
        if name not in PARTS:
            continue
        fitted_node = bindings[name]
        for key in ('translation', 'rotation', 'scale', 'matrix'):
            assert node.get(key) == fitted_node.get(key), (name, key)
        original = doc['meshes'][node['mesh']]['primitives']
        replacement = donor['meshes'][fitted_node['mesh']]['primitives']
        assert len(original) == len(replacement) == 1
        a, = original
        b, = replacement
        assert a.get('mode', 4) == b.get('mode', 4) == 4

        def append_accessor(index):
            acc = donor['accessors'][index]
            assert 'bufferView' not in acc and 'sparse' not in acc
            doc['accessors'].append(acc)
            return len(doc['accessors']) - 1

        assert set(a['attributes']) == set(b['attributes']) == {'POSITION', 'NORMAL'}
        assert doc['accessors'][a['indices']]['count'] == donor['accessors'][b['indices']]['count']
        a['attributes'] = {attribute: append_accessor(index) for attribute, index in b['attributes'].items()}
        a['indices'] = append_accessor(b['indices'])
        extension = b['extensions']['KHR_draco_mesh_compression'].copy()
        payload = data[extension['bufferView']]
        doc['bufferViews'].append({'buffer': 0, 'byteLength': len(payload)})
        views.append(payload)
        extension['bufferView'] = len(views) - 1
        a['extensions']['KHR_draco_mesh_compression'] = extension
        found.add(name)
    assert found == set(PARTS)
    write_glb(output, doc, views)


def main():
    repo, work = (Path(arg).resolve() for arg in sys.argv[sys.argv.index('--')+1:])
    if work.is_relative_to(repo):
        raise ValueError('Keep authored Blender files and backups outside the repo.')
    work.mkdir(parents=True, exist_ok=True)
    source = repo / 'assets/muscles-shoulder-arm.glb'
    metadata = repo / 'src/muscle-models.json'
    blend = work / 'atlas-shoulder-clearance.blend'
    donor = work / 'posterior-deltoids.glb'
    final = work / source.name
    backup = snapshot(work, [source, metadata, blend, donor, final])
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(source))
    bpy.context.view_layer.update()
    changes = {}
    for obj in bpy.context.scene.objects:
        muscle = obj.get('muscleId')
        obj.select_set(muscle in PARTS)
        if muscle not in PARTS:
            continue
        world = obj.matrix_world
        inverse = world.inverted()
        for vertex in obj.data.vertices:
            vertex.co = inverse @ fit(world @ vertex.co, PARTS[muscle])
        obj.data.update()
        verts = [world @ v.co for v in obj.data.vertices]
        canonical = [(p.x, p.z, -p.y) for p in verts]
        changes[muscle] = {name: [method(p[i] for p in canonical) for i in range(3)]
                           for name, method in [('min', min), ('max', max)]}
    assert set(changes) == set(PARTS)
    bpy.context.preferences.filepaths.save_version = 0
    bpy.ops.wm.save_as_mainfile(filepath=str(blend), compress=True)
    bpy.ops.export_scene.gltf(filepath=str(donor), export_format='GLB', use_selection=True, export_extras=True,
                              export_animations=False, export_yup=True, export_draco_mesh_compression_enable=True,
                              export_draco_mesh_compression_level=6, export_draco_position_quantization=16,
                              export_draco_normal_quantization=12)
    replace_primitives(source, donor, final)
    (work / 'atlas-shoulder-build.json').write_text(json.dumps({
        'backup': backup, 'sha256': file_hash(final), 'bounds': changes
    }, indent=2) + '\n', encoding='utf-8')
    print('STAGED_ATLAS_SHOULDER', final, flush=True)


if __name__ == '__main__':
    main()
