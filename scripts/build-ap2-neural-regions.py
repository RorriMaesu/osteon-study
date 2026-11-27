"""Build five registered gross anatomical preparations from Z-Anatomy using Blender 4.5.
Run with -- Startup.blend output_directory. Always use a new destination for regeneration.
"""
from pathlib import Path
import sys, bpy, bmesh
arguments = sys.argv[sys.argv.index("--") + 1:]
source, dest = map(Path, arguments[:2])
dest.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(source), load_ui=False, use_scripts=False)
deps = bpy.context.evaluated_depsgraph_get()
pair = lambda n: [n + ".l", n + ".r"]

def members(collection):
    return sorted(o.name for o in bpy.data.collections[collection].all_objects
                  if o.type == "MESH" and len(o.data.polygons) > 0)

brain = {}
for lobe in ["Frontal lobe", "Parietal lobe", "Temporal lobe", "Occipital lobe"]:
    for side, short in [("Left", ".l"), ("Right", ".r")]:
        brain[side + " " + lobe.lower()] = [n for n in members(lobe) if n.endswith(short)]
brain.update({
    "Insula": [n for n in bpy.data.objects.keys() if n.startswith("Insula (Subcentral")],
    "Cerebellum": [n for n in members("Cerebellum") if not n.startswith("Base of peduncle")],
    "Thalamus": pair("Thalamus"), "Hypothalamus": ["Hypothalamus"],
    "Corpus callosum": ["Corpus callosum"], "Midbrain": pair("Midbrain"),
    "Pons": pair("Pons"), "Medulla oblongata": pair("Medulla oblongata")
})
spine = {
    "Spinal cord": ["White matter of spinal cord"], "Cauda equina": ["Cauda equina"],
    "Dorsal roots": pair("Posterior root of spinal nerve"), "Ventral roots": pair("Anterior root of spinal nerve"),
    "Dorsal root ganglia": pair("Spinal ganglion"), "Medulla oblongata": pair("Medulla oblongata"),
    "Atlas": ["Atlas (C1)"], "Twelfth thoracic vertebra": ["Vertebra T12"],
    "First lumbar vertebra": ["Vertebra L1"], "Second lumbar vertebra": ["Vertebra L2"]
}
tongue = {
    "Tongue": ["Tongue"], "Lingual nerve": pair("Lingual nerve"),
    "Chorda tympani": pair("Chorda tympani"), "Glossopharyngeal nerve": pair("Glossopharyngeal nerve (IX)"),
    "Epiglottis": ["Epiglottis"], "Hyoid": ["Hyoid bone"], "Sublingual glands": pair("Sublingual gland")
}
nose = {
    "Nasal mucosa": ["Mucosa of nasal cavity"], "Olfactory nerve fibers": pair("Olfactory nerve (I)"),
    "Ethmoid": ["Ethmoid bone"], "Inferior nasal conchae": pair("Inferior nasal concha bone"),
    "Nasal bones": pair("Nasal bone"), "Major alar cartilages": pair("Major alar cartilage"),
    "Orbital frontal gyri": pair("Orbital gyri")
}
ear = {
    "Auricle": [n+".l" for n in ["Helix","Antihelix","Crura of antihelix","Concha of auricle","Tragus","Antitragus","Lobule of auricle"]],
    "Tympanic membrane": ["Tympanic membrane.l"], "Malleus": ["Malleus.l"], "Incus": ["Incus.l"],
    "Stapes": ["Stapes.l"], "Cochlear nerve": ["Cochlear nerve.l"], "Vestibular nerve": ["Vestibular nerve.l"]
}
cranial = {name: pair(name) for name in [
    "Olfactory nerve (I)", "Optic nerve (II)", "Oculomotor nerve (III)", "Trochlear nerve (IV)",
    "Trigeminal nerve (V)", "Abducens nerve (VI)", "Facial nerve (VII)", "Vestibulocochlear nerve (VIII)",
    "Glossopharyngeal nerve (IX)", "Vagus nerve (X)", "Accessory nerve (XI)", "Hypoglossal nerve (XII)"
]}
cranial["Brainstem"] = pair("Midbrain") + pair("Pons") + pair("Medulla oblongata")
specimens = {"brain":brain, "long-cord":spine, "tongue":tongue, "nose":nose, "outer-ear":ear, "cranial-nerves":cranial}
if arguments[2:]:
    specimens = {key: specimens[key] for key in arguments[2:]}
if any((dest / (key+".glb")).exists() for key in specimens):
    raise FileExistsError("Choose a new output directory and back up any model before replacing it.")
for key, parts in specimens.items():
    original_scene = bpy.context.scene
    scene = bpy.data.scenes.new(key)
    for label, names in parts.items():
        merged = bmesh.new()
        for name in names:
            obj = bpy.data.objects[name].evaluated_get(deps)
            mesh = bpy.data.meshes.new_from_object(obj, depsgraph=deps)
            mesh.transform(obj.matrix_world)
            merged.from_mesh(mesh)
            bpy.data.meshes.remove(mesh)
        if key == "cranial-nerves":
            bmesh.ops.bisect_plane(merged,geom=list(merged.verts)+list(merged.edges)+list(merged.faces),
                                   plane_co=(0,0,1.49),plane_no=(0,0,1),clear_inner=True,dist=1e-8)
        assert len(merged.faces), label
        mesh = bpy.data.meshes.new(key + "_" + label)
        merged.to_mesh(mesh)
        merged.free()
        mesh.materials.clear()
        for face in mesh.polygons:
            face.use_smooth = True
        part = bpy.data.objects.new("region_" + label.replace(" ", "_"), mesh)
        scene.collection.objects.link(part)
        part["teachingLabel"] = label
        limit = 8000 if key == "brain" else 6200
        if len(mesh.polygons) > limit:
            reduction = part.modifiers.new("Keep specimen lightweight", "DECIMATE")
            reduction.ratio = limit / len(mesh.polygons)
    bpy.context.window.scene = scene
    bpy.ops.export_scene.gltf(filepath=str(dest / (key+".glb")), export_format="GLB", use_active_scene=True,
                              export_materials="NONE", export_extras=True, export_animations=False, export_apply=True,
                              export_texcoords=False, export_normals=True, export_cameras=False, export_lights=False)
    bpy.context.window.scene = original_scene
    for part in list(scene.objects):
        bpy.data.objects.remove(part, do_unlink=True)
    bpy.data.scenes.remove(scene)
