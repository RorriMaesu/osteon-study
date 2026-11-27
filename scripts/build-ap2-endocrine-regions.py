"""Build endocrine regional specimens using Blender 4.5 in background mode.
Run with --factory-startup --disable-autoexec -P this_script -- source_folder output_folder.
Required inputs are listed in assets/ap2-glands/SOURCES.md. Every output must be new.
"""
import sys
from pathlib import Path
import bpy

source, target = map(Path, sys.argv[sys.argv.index("--") + 1:])
files = ["neck.glb", "testicular-region.glb", "ovarian-region.glb", "placenta.glb"]
if any((target / filename).exists() for filename in files):
    raise FileExistsError("Back up prior models and choose a new export directory.")

neck = {
    "Thyroid gland": "thyroid", "Thyroid cartilage": "thyroid_cartilage",
    "Cricoid cartilage": "cricoid", "Hyoid bone": "hyoid", "Trachea": "trachea"
}
male = {"Urinary bladder": "bladder", "Prostate": "prostate", "Pubic symphysis": "pubic_symphysis"}
for suffix, side in [(".l", "left"), (".r", "right")]:
    for level in ["Superior", "Inferior"]:
        neck[level + " parathyroid gland" + suffix] = side + "_" + level.lower() + "_parathyroid"
    for structure, short in [("Testis", "testis"), ("Epididymis", "epididymis"),
                             ("Ductus deferens", "ductus_deferens"), ("Seminal gland", "seminal_gland")]:
        male[structure + suffix] = side + "_" + short

def export(filename):
    bpy.ops.export_scene.gltf(filepath=str((target / filename).resolve()), export_format="GLB",
        export_yup=True, use_selection=True, export_materials="NONE",
        export_cameras=False, export_lights=False, export_extras=False, export_animations=False)

def export_z(mapping, filename):
    bpy.ops.wm.open_mainfile(filepath=str(source / "Startup.blend"), load_ui=False, use_scripts=False)
    deps = bpy.context.evaluated_depsgraph_get()
    scene = bpy.data.scenes.new("Endocrine export")
    copies = []
    for source_name, role in mapping.items():
        original = bpy.data.objects[source_name].evaluated_get(deps)
        mesh = bpy.data.meshes.new_from_object(original, depsgraph=deps)
        mesh.transform(original.matrix_world)
        if not mesh.polygons:
            raise ValueError(source_name + " has no surface")
        obj = bpy.data.objects.new(role, mesh)
        scene.collection.objects.link(obj)
        copies.append(obj)
    bpy.context.window.scene = scene
    for obj in copies:
        obj.select_set(True)
    export(filename)

def export_hra(filenames, output):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    for stem in filenames:
        bpy.ops.import_scene.gltf(filepath=str(source / ("3d-vh-f-" + stem + ".glb")))
    bpy.ops.object.select_all(action="SELECT")
    export(output)

export_z(neck, files[0])
export_z(male, files[1])
export_hra(["ovary-l", "ovary-r", "fallopian-tube-l", "fallopian-tube-r", "uterus", "pelvis"], files[2])
export_hra(["placenta-full-term"], files[3])
