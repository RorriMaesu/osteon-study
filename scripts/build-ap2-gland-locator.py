"""Build a new gland locator from the BodyParts3D 4.0 part-of OBJ release.
Blender 4.5 -b -P this_script -- source_folder output.glb
The source folder needs partof_BP3D_4.0_obj_99.zip and partof_element_parts.txt.
"""
import csv
from pathlib import Path
import sys
import zipfile
import re
import bpy

args = sys.argv[sys.argv.index("--") + 1:]
directory, output = map(Path, args[:2])
overview = "--overview" in args[2:]
if output.exists():
    raise FileExistsError(f"Choose a new filename or back up and move the existing model: {output}")
roles = {
    "pituitary gland": "pituitary", "sphenoid bone": "sphenoid",
    "right adrenal gland": "right_adrenal", "left adrenal gland": "left_adrenal",
    "right kidney": "right_kidney", "left kidney": "left_kidney",
    "parenchyma of pancreas": "pancreas", "thymus": "thymus",
    "manubrium": "manubrium", "trachea": "trachea", "sacrum": "sacrum",
    "right clavicle": "right_clavicle", "left clavicle": "left_clavicle",
    "right hip bone": "right_hip", "left hip bone": "left_hip",
    "right femur": "right_femur", "left femur": "left_femur",
    "right tibia": "right_tibia", "left tibia": "left_tibia",
    "right parietal bone": "right_parietal", "left parietal bone": "left_parietal",
    "right sixth rib": "right_rib", "left sixth rib": "left_rib",
    "first lumbar vertebra": "l1", "twelfth thoracic vertebra": "t12",
    "fifth cervical vertebra": "c5"
}
if overview:
    roles = {key:value for key,value in roles.items() if value in
             ("pituitary","right_adrenal","left_adrenal","thymus","pancreas","right_kidney","left_kidney")}
    roles["skeletal system"] = "context_skeleton"
with (directory / "partof_element_parts.txt").open() as file:
    records = list(csv.reader(file, delimiter="\t"))[1:]
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)

with zipfile.ZipFile(directory / "partof_BP3D_4.0_obj_99.zip") as archive:
    prefix = archive.namelist()[0].split("/")[0] + "/"
    for name, role in roles.items():
        sources = [r[2] for r in records if r[1] == name]
        if role == "context_skeleton":
            # The archive's aggregate "skeletal system" omits limb bones. Include
            # named appendicular elements explicitly and deduplicate their OBJ IDs.
            paired = re.compile(r"(?:left|right) (?:clavicle|scapula|humerus|radius|ulna|hip bone|femur|patella|tibia|fibula|talus|calcaneus|scaphoid|lunate|triquetral|pisiform|trapezium|trapezoid|capitate|hamate|cuboid bone|(?:medial|intermediate|lateral) cuneiform bone)")
            distal = re.compile(r"(?:(?:proximal|middle|distal) phalanx of (?:left|right) (?:thumb|.* finger|.* toe)|navicular bone of (?:left|right) foot|(?:left|right) (?:first|second|third|fourth|fifth) meta(?:carpal|tarsal) bone)")
            sources = sorted(set(sources) | {r[2] for r in records if paired.fullmatch(r[1]) or distal.fullmatch(r[1])})
        if not sources:
            raise ValueError(name)
        vertices, faces = [], []
        for source in sources:
            offset = len(vertices)
            for row in archive.read(prefix + source + ".obj").splitlines():
                if row.startswith(b"v "):
                    vertices.append(tuple(float(s) * .001 for s in row.split()[1:4]))
                elif row.startswith(b"f "):
                    faces.append(tuple(offset + int(s.split(b"/")[0]) - 1 for s in row.split()[1:]))
        data = bpy.data.meshes.new(role)
        data.from_pydata(vertices, [], faces)
        data.update()
        for polygon in data.polygons:
            polygon.use_smooth = True
        obj = bpy.data.objects.new(role, data)
        bpy.context.collection.objects.link(obj)
        if role == "context_skeleton":
            modifier = obj.modifiers.new("Reduce context geometry", "DECIMATE")
            modifier.ratio = .15
bpy.ops.export_scene.gltf(filepath=str(output.resolve()), export_format="GLB", export_yup=True, export_apply=True, export_cameras=False, export_lights=False)
