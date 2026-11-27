"""Build new practical GLBs from archived HRA 1.3 and BodyParts3D 4.0 originals.
Blender 4.5 --background --python build_ap2_cardio.py -- SOURCE_DIR OUTPUT_DIR
Original downloads remain in SOURCE_DIR. Refuse to replace any existing export.
"""
import csv
import hashlib
import re
import sys
import tempfile
import zipfile
from pathlib import Path

import bpy

src, dest = (Path(x) for x in sys.argv[sys.argv.index("--") + 1:][:2])
mode = sys.argv[-1]
def fresh():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def save(name, objects):
    path = dest / name
    if path.exists():
        raise FileExistsError(f"Back up and move the previous export first: {path}")
    bpy.ops.object.select_all(action='DESELECT')
    for obj in objects:
        transform = obj.matrix_world.copy()
        obj.parent = None
        obj.matrix_world = transform
        obj.select_set(True)
        for polygon in obj.data.polygons:
            polygon.use_smooth = True
    bpy.ops.export_scene.gltf(filepath=str(path), use_selection=True,
                              export_format='GLB', export_materials='EXPORT',
                              export_texcoords=True, export_normals=True, export_tangents=True,
                              export_animations=False, export_cameras=False)
    print("Saved", path, len(objects), path.stat().st_size, flush=True)


def hra(filename, sha):
    path = src / filename
    if hashlib.sha256(path.read_bytes()).hexdigest() != sha.lower():
        raise ValueError("Unexpected source revision " + filename)
    old = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=str(path))
    return [obj for obj in bpy.data.objects if obj not in old and obj.type == 'MESH']


if mode == 'hra':
    fresh()
    chambers = hra('hra-heart-v1.3.glb', '689df039c8bc264ea06a44cd926762976f0666c0ff2dc532d046409b185e6b0c')
    vessels = hra('hra-vasculature-v1.3.glb', '3a9fe60549769f3a27c15a0901a055e7c4fd3a9f4a37f39a77f5047f0166d4c3')
    coronary = [obj for obj in vessels if re.search('coronary|cardiac_vein|oblique_vein_of_left_atrium|posterior_vein_of_left_ventricle|descending_artery|marginal_branch|right_marginal_artery|ascending_aorta|aortic_arch|pulmonary_trunk|superior_vena_cava', obj.name)]
    save('ap2-heart.glb', chambers + coronary)
    central = [obj for obj in vessels if not re.search('ocular|eye|retin|ophthalm|ciliary', obj.name)]
    # Preserve topology of small branches. Reduce bandwidth for the full trunk.
    for obj in central:
        if len(obj.data.polygons) > 200:
            modifier = obj.modifiers.new("Study resolution", 'DECIMATE')
            modifier.ratio = .36
            bpy.context.view_layer.objects.active = obj
            bpy.ops.object.modifier_apply(modifier=modifier.name)
    save('ap2-vessels.glb', central)

if mode in ('bodyparts','leg'):
    parts = list(csv.reader((src/'partof_element_parts.txt').read_text(encoding='utf-8-sig').splitlines(), delimiter='\t'))[1:]
    regions = {
        'ap2-thorax.glb': r'wall of (?:left|right) (?:atrium|ventricle)|sternum|(?:left|right) (?:second|third|fourth|fifth|sixth) (?:rib|costal cartilage)|(?:third|fourth|fifth|sixth|seventh|eighth) thoracic vertebra',
        'ap2-leg-vessels.glb': r'right (?:hip bone|external iliac artery|femur|tibia|fibula|talus|calcaneus|first metatarsal bone|femoral artery|popliteal artery|anterior tibial artery|posterior tibial artery|dorsalis pedis artery|fibular artery|femoral vein|popliteal vein|great saphenous vein|patella)'
    }
    with zipfile.ZipFile(src/'partof_BP3D_4.0_obj_99.zip') as archive, tempfile.TemporaryDirectory() as tmp:
        members = {Path(n).stem:n for n in archive.namelist() if n.endswith('.obj')}
        for name, pattern in regions.items():
            if mode == 'leg' and 'leg' not in name:
                continue
            fresh()
            selected = []
            by_label = {}
            for concept, label, element in parts:
                if element in members and re.fullmatch(pattern, label):
                    by_label.setdefault(label, set()).add(element)
            seen = set()
            for label, elements in sorted(by_label.items(), key=lambda item: ('dorsalis pedis' not in item[0], len(item[1]))):
                group = []
                for element in sorted(elements - seen):
                    path = Path(tmp) / (element + '.obj')
                    path.write_bytes(archive.read(members[element]))
                    # Source +X left, +Y posterior, +Z superior, mm. Blender exports +Y as -Z in glTF.
                    bpy.ops.wm.obj_import(filepath=str(path), forward_axis='Y', up_axis='Z', global_scale=.001)
                    group.extend(bpy.context.selected_objects)
                    seen.add(element)
                if group:
                    bpy.ops.object.select_all(action='DESELECT')
                    for obj in group:
                        obj.select_set(True)
                    obj = group[0]
                    bpy.context.view_layer.objects.active = obj
                    if len(group)>1:
                        bpy.ops.object.join()
                    obj.name = label.replace(' ', '_')
                    selected.append(obj)
            if not selected:
                raise ValueError("Missing source geometry for " + name)
            save(name, selected)
