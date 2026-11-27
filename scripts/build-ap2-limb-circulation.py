"""Export a right-arm vascular specimen and a deep/superficial right-leg return.
Blender 4.5 -b --factory-startup --disable-autoexec -P this_script -- Startup.blend output_folder
Source: Z-Anatomy master distribution (CC BY-SA 4.0), credits in assets/AP2-CARDIO-LICENSE.md.
Use a new destination. Old files must be backed up before any replacement.
"""
import sys
from pathlib import Path
import bpy

source, dest = map(Path, sys.argv[sys.argv.index("--") + 1:])
def right(names):
    return {name + ".r": "right_" + name.lower().replace(" ", "_") for name in names}
def bones(names):
    return {key:"context_"+value for key,value in right(names).items()}
common={"Right atrium":"right_atrium"}
arm={
    **common, "Aortic arch":"aortic_arch", "Brachiocephalic trunk":"brachiocephalic_trunk",
    "Right subclavian artery":"right_subclavian_artery", "Right subclavian vein":"right_subclavian_vein",
    "Right brachiocephalic vein":"right_brachiocephalic_vein","Superior vena cava":"superior_vena_cava",
    **right(["Axillary artery","Brachial artery","Radial artery","Ulnar artery","Superficial palmar arch",
             "Deep palmar arch","Radial veins","Ulnar veins","Brachial veins","Axillary vein","Deep venous palmar arch",
             "Dorsal venous network of hand","Cephalic vein","Basilic vein","Median cubital vein"]),
    **bones(["First rib","Clavicle","Humerus","Radius","Ulna","Scaphoid bone","First metacarpal bone",
             "Third metacarpal bone","Fifth metacarpal bone"])
}
leg={
    **common, "Inferior vena cava (abdominal part)":"abdominal_inferior_vena_cava",
    "Inferior vena cava (thoracic part)":"thoracic_inferior_vena_cava",
    **right(["Dorsal venous arch of foot","Dorsal metatarsal veins","Plantar venous arch","Medial plantar veins",
             "Lateral plantar veins","Great saphenous vein","Small saphenous vein","Anterior tibial veins",
             "Posterior tibial veins","Fibular veins","Popliteal vein","Femoral vein",
             "External iliac vein","Common iliac vein"]),
    **bones(["Hip bone","Femur","Patella","Tibia","Fibula","Talus","Calcaneus",
             "First metatarsal bone","Fifth metatarsal bone"])
}
specimens=[("ap2-arm-circulation.glb",arm),("ap2-leg-venous-return.glb",leg)]
for filename,_ in specimens:
    if (dest / filename).exists():
        raise FileExistsError("Back up the previous asset and choose a new destination: "+filename)

for filename, roles in specimens:
    bpy.ops.wm.open_mainfile(filepath=str(source), load_ui=False, use_scripts=False)
    deps=bpy.context.evaluated_depsgraph_get()
    scene=bpy.data.scenes.new("Regional specimen")
    parts=[]
    for name,role in roles.items():
        original=bpy.data.objects[name].evaluated_get(deps)
        mesh=bpy.data.meshes.new_from_object(original,depsgraph=deps)
        if not mesh.polygons:
            raise ValueError(name+" is missing its surface")
        mesh.transform(original.matrix_world)
        obj=bpy.data.objects.new(role,mesh)
        scene.collection.objects.link(obj)
        if role.startswith("context_") and len(mesh.polygons)>1200:
            modifier=obj.modifiers.new("Reduce orientation skeleton","DECIMATE")
            modifier.ratio=.4
        parts.append(obj)
    bpy.context.window.scene=scene
    for obj in parts:
        obj.select_set(True)
    bpy.ops.export_scene.gltf(filepath=str((dest/filename).resolve()),export_format="GLB",export_apply=True,
        use_selection=True,export_materials="NONE",export_cameras=False,export_lights=False,export_animations=False,
        export_texcoords=False,export_tangents=False)
