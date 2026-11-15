"""Export Osteon's independently authored blink, breathing, jaw and smile lessons in Blender 4.5.

Usage: blender -b --factory-startup --disable-autoexec --python-exit-code 1 \
  --python build_motion_regional.py -- REPO NEW_OUTPUT_DIRECTORY blink|breath|jaw|smile

Outputs go only to a new directory outside the repository. Source meshes retain
their identities and fitted neutral geometry. Authored teaching deformation is
not a measured activation or biomechanical simulation.
"""
import hashlib
import json
import math
from pathlib import Path
import re
import shutil
import statistics
import sys

import bmesh
import bpy
from mathutils import Matrix, Quaternion, Vector
from mathutils.kdtree import KDTree

sys.path.insert(0, str(Path(__file__).resolve().parent))
from mouth_deformation import ORAL_FOLLOW, oral_jaw_weight

SIDES = {"r": ("right", -1), "l": ("left", 1)}
ORDINALS = "first second third fourth fifth sixth seventh eighth ninth tenth eleventh twelfth".split()
MATERIALS = {}
SOURCES = {
    "blink": {
        "openstax": "https://openstax.org/books/anatomy-and-physiology-2e/pages/11-3-axial-muscles-of-the-head-neck-and-back",
        "study": "https://pmc.ncbi.nlm.nih.gov/articles/PMC12358864/",
        "detail": "https://pmc.ncbi.nlm.nih.gov/articles/PMC4043155/",
    },
    "jaw": {
        "openstax": "https://openstax.org/books/anatomy-and-physiology-2e/pages/11-3-axial-muscles-of-the-head-neck-and-back",
        "study": "https://pmc.ncbi.nlm.nih.gov/articles/PMC7860955/",
        "detail": "https://pmc.ncbi.nlm.nih.gov/articles/PMC12553608/",
        "perioralAttachments": "https://pmc.ncbi.nlm.nih.gov/articles/PMC9944027/",
        "mouthFloor": "https://pmc.ncbi.nlm.nih.gov/articles/PMC8130842/",
    },
    "smile": {
        "openstax": "https://openstax.org/books/anatomy-and-physiology-2e/pages/11-3-axial-muscles-of-the-head-neck-and-back",
        "study": "https://pubmed.ncbi.nlm.nih.gov/18300963/",
        "detail": "https://pmc.ncbi.nlm.nih.gov/articles/PMC13105802/",
    },
    "breath": {
        "openstax": "https://openstax.org/books/anatomy-and-physiology-2e/pages/22-3-the-process-of-breathing",
        "study": "https://pubmed.ncbi.nlm.nih.gov/27989446/",
        "detail": "https://journals.physiology.org/doi/10.1152/physrev.00007.2004",
        "ribs": "https://journals.physiology.org/doi/10.1152/japplphysiol.01046.2020",
        "parasternal": "https://pubmed.ncbi.nlm.nih.gov/6461619/",
    },
}
BLINK = {
    "Palpebral part of orbicularis oculi": ("orbicularis-oculi-palpebral", "Closes the eyelids."),
    "Levator palpebrae superioris": ("levator-palpebrae-superioris", "Raises the upper eyelid as it reopens."),
    "Orbital part of orbicularis oculi": ("orbicularis-oculi-orbital", "Surrounds the orbital rim and assists forceful eye closure. Use it here for anatomical context."),
}
BREATH = {
    "Diaphragm": ("diaphragm", "Its domes descend during inspiration. During forced expiration abdominal pressure displaces them upward."),
    "External intercostal muscles": ("external-intercostals", "Move with the adjacent ribs. Region-specific inspiratory contribution varies with task and interspace."),
    "Internal intercostal muscles": ("internal-intercostals", "The parasternal portion assists inspiration, while many interosseous portions assist expiration. This mesh groups them."),
    "Innermost intercostal muscles": ("innermost-intercostals", "The deepest layer of the intercostal muscles follows the adjacent ribs."),
    "Rectus abdominis muscle": ("rectus-abdominis", "The abdominal wall helps drive forced expiration. It is shown following the motion of the abdomen during inspiration."),
    "External abdominal oblique muscle": ("external-abdominal-oblique", "Compresses the abdomen during active expiration."),
    "Internal abdominal oblique muscle": ("internal-abdominal-oblique", "Compresses the abdomen during active expiration."),
    "Transversus abdominis muscle": ("transversus-abdominis", "Draws the abdominal wall inward during active expiration."),
}
JAW = {
    "Superficial part of masseter": ("masseter-superficial", "Elevates the mandible during jaw closing."),
    "Deep part of masseter": ("masseter-deep", "Assists mandibular elevation."),
    "Temporalis muscle": ("temporalis", "Elevates the mandible; some posterior fibers can also retract it."),
    "Medial pterygoid muscle": ("medial-pterygoid", "Assists elevation and can contribute to protrusion."),
    "Inferior head of lateral pterygoid muscle": ("lateral-pterygoid-inferior", "Helps draw the condyle forward during opening."),
    "Superior head of lateral pterygoid muscle": ("lateral-pterygoid-superior", "The skull attachment stays fixed while the fibers near the joint follow the condyle."),
    "Anterior belly of digastric muscle": ("digastric-anterior", "Helps depress the mandible when the hyoid is stabilized."),
    "Posterior belly of digastric muscle": ("digastric-posterior", "Acts on the hyoid. It is shown as regional context."),
    "Geniohyoid muscle": ("geniohyoid", "Can help depress the mandible with the hyoid stabilized."),
    "Mylohyoid muscle": ("mylohyoid", "Forms the floor of the mouth and can assist mandibular depression with the hyoid fixed."),
    **{name: entry for name, entry in ORAL_FOLLOW.items() if name != "Platysma"},
}
JAW_ELEVATORS = ["masseter-superficial", "masseter-deep", "temporalis", "medial-pterygoid"]
JAW_OPENERS = ["lateral-pterygoid-inferior", "digastric-anterior", "geniohyoid", "mylohyoid"]
SMILE = {
    "Zygomaticus major muscle": ("zygomaticus-major", "Draws the corner of the mouth upward and laterally."),
    "Depressor anguli oris": ("depressor-anguli-oris", "Its downward pull opposes the corner-raising direction."),
    "Levator anguli oris": ("levator-anguli-oris", "Raises the mouth angle. This surface follows the modeled corner displacement."),
    "Zygomaticus minor muscle": ("zygomaticus-minor", "Acts on the upper lip. The demonstration does not specify its recruitment."),
    "Risorius muscle": ("risorius", "Draws the mouth corner laterally. Its actual recruitment varies."),
    "Bucinator": ("buccinator", "Forms part of the cheek and blends near the corner of the mouth."),
    "Orbicularis oris muscle": ("orbicularis-oris", "A portion of the lip is carried with the mouth angle as the smile widens."),
}
ABDOMINALS = [
    "rectus-abdominis", "external-abdominal-oblique", "internal-abdominal-oblique", "transversus-abdominis"
]


def write_json(path, value):
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def sha256(path):
    with path.open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


def backup(paths, folder):
    folder.mkdir()
    entries = []
    for path in paths:
        copied = folder / path.name
        if copied.exists():
            raise ValueError(f"Duplicate backup name {path.name}")
        shutil.copy2(path, copied)
        checksum = sha256(path)
        if checksum != sha256(copied):
            raise RuntimeError(f"Backup checksum mismatch: {path.name}")
        entries.append({"file": copied.name, "original": str(path), "sha256": checksum, "bytes": path.stat().st_size})
    write_json(folder / "SHA256.json", entries)
    return entries


def imported(path):
    before = set(bpy.context.scene.objects)
    bpy.ops.import_scene.gltf(filepath=str(path))
    return [obj for obj in bpy.context.scene.objects if obj not in before]


def select_sources(path, predicate):
    received = imported(path)
    keep = {}
    for obj in received:
        label = obj.get("zname", obj.name)
        if obj.type == "MESH" and predicate(obj, label):
            if label in keep:
                raise ValueError(f"Duplicate regional source: {label}")
            transform = obj.matrix_world.copy()
            obj.parent = None
            obj.data = obj.data.copy()
            obj.data.transform(transform)
            obj.matrix_world = Matrix.Identity(4)
            keep[label] = obj
    for obj in received:
        if obj not in keep.values():
            bpy.data.objects.remove(obj, do_unlink=True)
    return keep


def material(kind):
    if kind not in MATERIALS:
        color = {"muscle": (.58, .24, .15, 1), "bone": (.81, .75, .63, 1), "cartilage": (.34, .51, .51, 1)}[kind]
        item = bpy.data.materials.new(kind)
        item.diffuse_color = color
        MATERIALS[kind] = item
    return MATERIALS[kind]


def prepare(obj, kind):
    obj.data.materials.clear()
    obj.data.materials.append(material(kind))
    for polygon in obj.data.polygons:
        polygon.material_index = 0
        polygon.use_smooth = True


def to_web(point):
    return Vector((point.x, point.z, -point.y))


def to_blender(point):
    return Vector((point.x, -point.z, point.y))


def smooth(start, end, value):
    t = max(0, min(1, (value - start) / (end - start)))
    return t * t * (3 - 2 * t)


def split_side(label):
    suffix = label[-1:] if label[-2:-1] == "." else ""
    if suffix in SIDES:
        return label[:-2], *SIDES[suffix]
    return label, "midline", 0


def tag_muscle(obj, label, table, deformation):
    name, side, _ = split_side(label)
    role, note = table[name]
    if name == "Bucinator":
        name = "Buccinator muscle"
    source = obj.get("muscleId")
    if not source:
        raise ValueError(f"Missing atlas identity for {label}")
    obj["motionMuscle"] = role
    obj["motionPart"] = name
    obj["motionSide"] = side
    obj["motionRegion"] = obj.get("muscleRegion", "")
    obj["motionModeling"] = deformation
    prepare(obj, "muscle")
    return {"id": source, "name": name, "side": side, "role": role, "note": note, "modeling": deformation}


def tag_context(obj, label):
    obj["motionContext"] = label
    prepare(obj, "cartilage" if obj.get("zmat", "") == "Cartilage" else "bone")


def add_shape(obj, name, transform):
    if obj.data.shape_keys is None:
        obj.shape_key_add(name="Basis", from_mix=False)
    shape = obj.shape_key_add(name=name, from_mix=False)
    for rest, target in zip(obj.data.vertices, shape.data):
        target.co = to_blender(transform(to_web(rest.co)))
    shape.value = 0


def decimate(obj, minimum):
    if len(obj.data.vertices) < minimum * 1.4:
        return
    before = len(obj.data.vertices)
    reduced = obj.modifiers.new("Web regional surface", "DECIMATE")
    reduced.ratio = minimum / before
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier=reduced.name)
    obj["motionSourceVertices"] = before


def check_oblique_surface(obj, *, join_seams=False):
    # The atlas GLB can split vertices at shading seams. Weld those coincident
    # vertices before simplification so it collapses edges instead of islands.
    mesh = bmesh.new()
    try:
        mesh.from_mesh(obj.data)
        bmesh.ops.remove_doubles(mesh, verts=list(mesh.verts), dist=.000012)
        if not mesh.faces or any(not edge.is_manifold for edge in mesh.edges):
            raise ValueError(f"Expected a closed external oblique surface: {obj.name}")
        if join_seams:
            mesh.to_mesh(obj.data)
    finally:
        mesh.free()
    if join_seams:
        obj.data.update()


def build_blink(bones_path, muscles_path):
    context = {
        "Frontal bone", "Maxilla.r", "Maxilla.l", "Zygomatic bone.r", "Zygomatic bone.l",
        "Sphenoid bone", "Nasal bone.r", "Nasal bone.l",
        "Lacrimal bone.r", "Lacrimal bone.l",
    }
    bones = select_sources(bones_path, lambda _, label: label in context)
    for label, obj in bones.items():
        tag_context(obj, label)
    muscles = select_sources(muscles_path, lambda _, label: split_side(label)[0] in BLINK)
    entries = []
    for label, obj in muscles.items():
        name, _, side_sign = split_side(label)
        if name == "Orbital part of orbicularis oculi":
            entries.append(tag_muscle(obj, label, BLINK, "static-context"))
            continue
        if name == "Palpebral part of orbicularis oculi":
            def closure(point):
                relative_x = abs(point.x * side_sign - .0296) / .0169
                central = 1 - smooth(.12, 1, relative_x)
                relative_y = point.y - 1.5908
                fraction = .98 if relative_y > 0 else .69
                excursion = central * relative_y * fraction
                return point + Vector((0, -excursion, -.105 * abs(excursion)))
        else:
            def closure(point):
                forward = smooth(.047, .074, point.z)
                return point + Vector((0, -.0077 * forward, -.0009 * forward))
        add_shape(obj, "Blink", closure)
        entries.append(tag_muscle(obj, label, BLINK, "authored-deformation"))
    if len(entries) != 6:
        raise ValueError(f"Expected six bilateral orbital components, found {len(entries)}")
    return entries


def rib_like(label):
    return re.fullmatch(r"(?:(Costal cartilage of )?([A-Za-z]+) rib)\.([lr])", label, flags=re.I)


def coordinates(obj):
    return [to_web(vertex.co) for vertex in obj.data.vertices]


class Rib:
    def __init__(self, obj, number, sign):
        self.number = number
        samples = coordinates(obj)
        root = sorted(samples, key=lambda p: abs(p.x))[:max(8, len(samples) // 24)]
        self.pivot = sum(root, Vector()) / len(root)
        self.axis = Vector((-.77 + .012 * number, 0, sign * (.32 + .047 * number))).normalized()
        self.angle = math.radians(1.5 + .19 * min(number, 10))
        self.surface = KDTree(len(samples))
        for index, point in enumerate(samples):
            self.surface.insert(point, index)
        self.surface.balance()

    def transform(self, point, amount):
        return self.pivot + Quaternion(self.axis, amount * self.angle) @ (point - self.pivot)

    def distance(self, point):
        return self.surface.find(point)[2]


def sternum_move(point, amount):
    sternum = Vector((0, 1.396, .045))
    return sternum + Quaternion(Vector((1, 0, 0)), -.023 * amount) @ (point - sternum) + Vector((0, .003, .004)) * amount


def spine_rib_delta(point, row, amount, minimum=1):
    distances = sorted(
        ((rib.distance(point), rib) for num, rib in row.items() if num >= minimum),
        key=lambda item: item[0],
    )[:2]
    weighted = Vector()
    total = 0
    for dist, rib in distances:
        importance = 1 / (dist + .0018) ** 3
        weighted += (rib.transform(point, amount) - point) * importance
        total += importance
    return weighted / total


def build_breath(bones_path, muscles_path):
    def wants_bone(_, label):
        return rib_like(label) or label in {"Manubrium of sternum", "Body of sternum", "Xiphoid process", "Hip bone.r", "Hip bone.l", "Sacrum"} or re.fullmatch(r"Vertebra [TL]\d{1,2}", label)
    bones = select_sources(bones_path, wants_bone)
    for label, obj in bones.items():
        decimate(obj, 1350)
        tag_context(obj, label)
    ribs = {key: {} for key in SIDES}
    for label, obj in bones.items():
        match = rib_like(label)
        if match and not match[1]:
            number = ORDINALS.index(match[2].lower()) + 1
            ribs[match[3]][number] = Rib(obj, number, SIDES[match[3]][1])
    if any(len(row) != 12 for row in ribs.values()):
        raise ValueError("Expected 12 numbered ribs on each side")
    poses = {"Inhale": 1.0, "ForcedExhale": -.60}
    for label, obj in bones.items():
        sternum = "sternum" in label or label == "Xiphoid process"
        match = rib_like(label)
        if not match and not sternum:
            continue
        for shape, amount in poses.items():
            if sternum:
                add_shape(obj, shape, lambda point: sternum_move(point, amount))
                continue
            number = ORDINALS.index(match[2].lower()) + 1
            rib = ribs[match[3]][number]
            if match[1]:
                points = coordinates(obj)
                outer = max(abs(point.x) for point in points)
                inner = min(abs(point.x) for point in points)
                def move_cartilage(point):
                    join = smooth(inner, outer, abs(point.x))
                    if number <= 7:
                        center = sternum_move(point, amount)
                    else:
                        center = point + spine_rib_delta(point, ribs[match[3]], amount, 6)
                    return center.lerp(rib.transform(point, amount), join)
                add_shape(obj, shape, move_cartilage)
            else:
                add_shape(obj, shape, lambda point: rib.transform(point, amount))

    muscles = select_sources(muscles_path, lambda _, label: split_side(label)[0] in BREATH)
    entries = []
    for label, obj in muscles.items():
        name, _, side = split_side(label)
        role = BREATH[name][0]
        if role == "external-abdominal-oblique":
            check_oblique_surface(obj, join_seams=True)
        decimate(obj, 6300 if role == "diaphragm" else 4500)
        entries.append(tag_muscle(obj, label, BREATH, "authored-deformation"))
        for shape, amount in poses.items():
            if role == "diaphragm":
                def deformation(point):
                    row = ribs["l" if point.x >= 0 else "r"]
                    anterior_center = (point.z - .018) / .095
                    lateral_center = abs(point.x) / .13
                    dome = 1 - smooth(.25, 1, math.hypot(anterior_center, lateral_center))
                    dome *= smooth(1.095, 1.202, point.y)
                    outer = spine_rib_delta(point, row, amount, 6) * (1 - dome)
                    if point.z < -.035:
                        outer *= smooth(-.067, -.035, point.z)
                    descent = .013 if point.x < 0 else .016
                    if shape == "ForcedExhale":
                        descent *= .83
                    return point + outer + Vector((0, -descent * amount * dome, .0007 * amount * dome))
            elif role in ABDOMINALS:
                row = ribs["l" if side > 0 else "r"]
                def deformation(point):
                    cranial = smooth(1.12, 1.25, point.y)
                    superior = spine_rib_delta(point, row, amount, 6) * cranial
                    wall = smooth(.873, 1.008, point.y) * (1 - cranial)
                    wall *= smooth(-.050, .064, point.z)
                    lateral = max(-1, min(1, point.x / .108))
                    if shape == "Inhale":
                        visceral = Vector((.0021 * lateral, -.0019, .0056)) * wall
                    else:
                        visceral = Vector((-.0041 * lateral, .0025, -.0082)) * wall
                    return point + superior + visceral
            else:
                row = ribs["l" if side > 0 else "r"]
                def deformation(point):
                    return point + spine_rib_delta(point, row, amount)
            add_shape(obj, shape, deformation)
    if len(entries) != 15:  # One diaphragm, six intercostal layers and eight abdominal surfaces.
        raise ValueError(f"Expected 15 respiratory components, found {len(entries)}")
    return entries


def surface_lookup(objects):
    points = [p for obj in objects for p in coordinates(obj)]
    if not points:
        raise RuntimeError("No anatomical anchor vertices for this muscle")
    result = KDTree(len(points))
    for index, point in enumerate(points):
        result.insert(point, index)
    result.balance()
    return result


def jaw_transform(point, pivot, weight=1):
    angle = math.radians(15 * weight)
    return pivot + Quaternion(Vector((1, 0, 0)), angle) @ (point - pivot) + Vector((0, -.0048, .0075)) * weight


def build_jaw(bones_path, muscles_path, registration_path):
    contextual = {
        "Mandible", "Hyoid bone", "Frontal bone", "Parietal bone.r", "Parietal bone.l",
        "Temporal bone.r", "Temporal bone.l", "Sphenoid bone",
        "Zygomatic bone.r", "Zygomatic bone.l", "Maxilla.r", "Maxilla.l", "Palatine bone.r", "Palatine bone.l",
    }
    def wants_bone(_, label):
        return label in contextual or re.match(r"(Lower|Upper) (medial incisor|lateral incisor|canine|first premolar|second premolar|first molar tooth|second molar tooth)\.[lr]$", label)
    bones = select_sources(bones_path, wants_bone)
    landmark = json.loads(registration_path.read_text(encoding="utf-8"))["mandibular-condyle"]["point"]
    # Bilateral teaching model around the inspected superior condylar-head point.
    pivot = Vector((0, landmark[1] - .0015, landmark[2] + .0015))
    jaw = bones["Mandible"]
    mobile = surface_lookup([jaw])
    hyoid = surface_lookup([bones["Hyoid bone"]])
    masticatory = {}
    for suffix in SIDES:
        selected = lambda stem: bones[f"{stem}.{suffix}"]
        face = surface_lookup([selected("Zygomatic bone")])
        temporal = surface_lookup([bones["Frontal bone"], selected("Parietal bone"), selected("Temporal bone"), bones["Sphenoid bone"]])
        pterygoid = surface_lookup([bones["Sphenoid bone"]])
        masticatory[suffix] = face, temporal, pterygoid
    for label, obj in bones.items():
        tag_context(obj, label)
        if label == "Mandible" or label.startswith("Lower "):
            add_shape(obj, "JawOpen", lambda point: jaw_transform(point, pivot))
    muscles = select_sources(muscles_path, lambda _, label: split_side(label)[0] in JAW)
    entries = []
    for label, obj in muscles.items():
        name, _, _ = split_side(label)
        role = JAW[name][0]
        if role == "digastric-posterior":
            entries.append(tag_muscle(obj, label, JAW, "static-context"))
            continue
        if name in ORAL_FOLLOW:
            entries.append(tag_muscle(obj, label, JAW, "passive-deformation"))
            add_shape(obj, "JawOpen", lambda point: point.lerp(jaw_transform(point, pivot), oral_jaw_weight(role, point)))
            continue
        entries.append(tag_muscle(obj, label, JAW, "authored-deformation"))
        face, temporal, pterygoid = masticatory[label[-1]]
        fixed = hyoid if role in ("digastric-anterior", "geniohyoid", "mylohyoid") else temporal if role == "temporalis" else face if role.startswith("masseter-") else pterygoid
        def near_jaw(point):
            distance_to_jaw = mobile.find(point)[2]
            distance_to_fixed = fixed.find(point)[2]
            return distance_to_fixed / max(.00001, distance_to_jaw + distance_to_fixed)

        # Derive a fiber-direction guide from the atlas attachment surfaces.
        # Blend along that longitudinal axis instead of letting nearest-bone
        # switches accumulate local stretch in the belly.
        points = coordinates(obj)
        samples = sorted(points, key=near_jaw)
        n = max(10, len(samples) // 7)
        origin = center_of(samples[:n])
        insertion = center_of(samples[-n:])
        span = (insertion - origin).length
        axis = (insertion - origin).normalized()
        if span < .005:
            raise RuntimeError(f"Insufficient separation of source attachments for {label}")

        def deformation(point):
            longitudinal = (point - origin).dot(axis) / span
            weight = smooth(-.12, 1.15, longitudinal)
            return jaw_transform(point, pivot, weight)

        add_shape(obj, "JawOpen", deformation)
    if len(entries) != 2 * len(JAW):
        raise ValueError(f"Expected {2 * len(JAW)} bilateral jaw components, found {len(entries)}")
    return entries


def center_of(points):
    return sum(points, Vector()) / len(points)


def build_smile(bones_path, muscles_path):
    bones = select_sources(
        bones_path,
        lambda _, label: label in {
            "Mandible", "Maxilla.r", "Maxilla.l", "Nasal bone.r", "Nasal bone.l",
            "Zygomatic bone.r", "Zygomatic bone.l", "Frontal bone",
        } or bool(re.match(r"(Lower|Upper) (medial incisor|lateral incisor|canine)\.[lr]$", label)),
    )
    for label, obj in bones.items():
        tag_context(obj, label)
    muscles = select_sources(muscles_path, lambda _, label: split_side(label)[0] in SMILE)
    corners = {}
    fixed_areas = {}
    for suffix, (_, sign) in SIDES.items():
        major = coordinates(muscles[f"Zygomaticus major muscle.{suffix}"])
        mouth = coordinates(muscles[f"Orbicularis oris muscle.{suffix}"])
        major_tip = center_of(sorted(major, key=lambda p: p.y)[:max(12, len(major) // 18)])
        mouth_tip = center_of(sorted(mouth, key=lambda p: -sign * p.x)[:max(12, len(mouth) // 18)])
        if (major_tip - mouth_tip).length > .013:
            raise RuntimeError(f"Zygomatic and lip corner have different source locations: {suffix}")
        corners[suffix] = major_tip.lerp(mouth_tip, .55)
        fixed_areas[suffix] = {
            "zygomaticus-major": surface_lookup([bones[f"Zygomatic bone.{suffix}"]]),
            "zygomaticus-minor": surface_lookup([bones[f"Zygomatic bone.{suffix}"]]),
            "depressor-anguli-oris": surface_lookup([bones["Mandible"]]),
            "levator-anguli-oris": surface_lookup([bones[f"Maxilla.{suffix}"]]),
        }
    entries = []
    for label, obj in muscles.items():
        name, _, sign = split_side(label)
        suffix = label[-1]
        role = SMILE[name][0]
        fixed = fixed_areas[suffix].get(role)
        corner = corners[suffix]
        pull = Vector((sign * .008, .0095, -.0018))

        def deformation(point):
            # Shared displacement across the authored mouth corner. Weight fades
            # toward bony origins and the neutral philtrum/chin midline.
            delta = point - corner
            gaussian = math.exp(-((delta.x / .022) ** 2 + (delta.y / .022) ** 2 + (delta.z / .022) ** 2))
            midline = smooth(.001, .016, sign * point.x)
            if fixed is not None:
                distance_to_origin = fixed.find(point)[2]
                anchored = smooth(.0009, .009, distance_to_origin)
            else:
                anchored = 1
            return point + pull * (gaussian * midline * anchored)

        add_shape(obj, "Smile", deformation)
        entries.append(tag_muscle(obj, label, SMILE, "authored-deformation"))
    if len(entries) != 14:
        raise ValueError(f"Expected 14 bilateral perioral components, found {len(entries)}")
    return entries


def phase(start, label, detail, active=(), opposes=()):
    return {"start": start, "label": label, "detail": detail, "active": list(active), "opposes": list(opposes)}


def lessons(region):
    if region == "blink":
        return [
            {
                "id": "blink", "name": "Blink", "duration": 1.2,
                "morphTracks": {"Blink": [[0, 0], [.19, 0], [.36, 1], [.45, 1], [.68, 0], [1.2, 0]]},
                "phases": [
                    phase(0, "Eyes open", "The levator raises and holds the upper eyelid. The orbital portion of orbicularis oculi is shown for orientation.", ["levator-palpebrae-superioris"]),
                    phase(.19, "Closing", "Palpebral orbicularis oculi closes the eyelids as the levator relaxes.", ["orbicularis-oculi-palpebral"], ["levator-palpebrae-superioris"]),
                    phase(.36, "Peak closure", "The upper margin descends farther than the lower margin rises."),
                    phase(.45, "Reopening", "The levator raises the upper eyelid as the closer releases.", ["levator-palpebrae-superioris"], ["orbicularis-oculi-palpebral"]),
                    phase(.68, "Eyes open", "The levator maintains the raised upper eyelid.", ["levator-palpebrae-superioris"]),
                ],
            }
        ]
    if region == "jaw":
        return [
            {
                "id": "jaw", "name": "Jaw opening and closing", "duration": 3.4,
                "morphTracks": {"JawOpen": [[0, 0], [.28, 0], [1.38, 1], [1.85, 1], [2.99, 0], [3.4, 0]]},
                "phases": [
                    phase(0, "Jaw closed", "The mandible sits beneath the maxilla."),
                    phase(.28, "Opening", "The condyles rotate and glide forward and down. The inferior lateral pterygoid and suprahyoids assist opening with the hyoid stabilized.", JAW_OPENERS, JAW_ELEVATORS),
                    phase(1.38, "Open pose", "Compare the lower lip and cheek with the fixed upper face. The chewing muscles change length as the condyle glides forward."),
                    phase(1.85, "Closing", "The masseter, temporalis and medial pterygoid elevate the mandible as it returns toward the maxilla.", JAW_ELEVATORS, JAW_OPENERS),
                    phase(2.99, "Jaw closed", "The closing movement is complete."),
                ]
            }
        ]
    if region == "smile":
        return [
            {
                "id": "smile", "name": "Smile", "duration": 3.6,
                "morphTracks": {"Smile": [[0, 0], [.32, 0], [1.25, 1], [2.0, 1], [3.20, 0], [3.6, 0]]},
                "phases": [
                    phase(0, "Neutral rest", "Compare the muscle paths from the cheek and jaw to the corner of the mouth."),
                    phase(.32, "Raise the mouth corners", "The zygomaticus major draws the corner upward and outward. The depressor anguli oris has the opposing direction.", ["zygomaticus-major"], ["depressor-anguli-oris"]),
                    phase(1.25, "Hold the smile", "The lifted corner changes the shape of nearby muscles. Only the main taught contributor is colored for activity.", ["zygomaticus-major"], ["depressor-anguli-oris"]),
                    phase(2.0, "Relax to neutral", "The corner returns toward its resting position as the demonstration releases."),
                ]
            }
        ]
    return [
        {
            "id": "quiet-breath", "name": "Quiet breathing", "duration": 4.8,
            "morphTracks": {"Inhale": [[0, 0], [1.8, 1], [2.02, 1], [4.5, 0], [4.8, 0]]},
            "phases": [
                phase(0, "Inspiration", "The diaphragm contracts and its domes descend. Rib rotation widens and deepens the thorax. Different intercostal regions have different roles.", ["diaphragm"]),
                phase(1.8, "End of inspiration", "Compare the lower dome and expanded rib cage with the start of the breath."),
                phase(2.02, "Passive expiration", "The diaphragm relaxes and the chest wall recoils. The abdominal wall follows along in this quiet-breathing example."),
            ],
        },
        {
            "id": "forced-expiration", "name": "Forced expiration", "duration": 4.8,
            "morphTracks": {
                "Inhale": [[0, 0], [1.65, 1], [1.85, 1], [2.8, 0], [4.8, 0]],
                "ForcedExhale": [[0, 0], [2.8, 0], [3.7, 1], [3.95, 1], [4.8, 0]],
            },
            "phases": [
                phase(0, "Inspiration", "The diaphragm contracts as the abdominal wall accommodates the movement.", ["diaphragm"], ABDOMINALS),
                phase(1.85, "Forced expiration", "The abdominal muscles draw the wall inward. Rising abdominal pressure displaces the relaxed diaphragm upward. Intercostal recruitment varies by region.", ABDOMINALS, ["diaphragm"]),
                phase(3.95, "Release", "The model returns to neutral as the expiratory effort ends."),
            ],
        }
    ]


def percentile(values, rank):
    ordered = sorted(values)
    return ordered[round((len(ordered) - 1) * rank)]


def check_export(path, entries, region):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    imported(path)
    lookup = {obj.get("muscleId"): obj for obj in bpy.context.scene.objects if obj.type == "MESH" and obj.get("motionMuscle")}
    if len(lookup) != len(entries):
        raise ValueError("Re-import did not preserve each component identity")
    evidence = {}
    for entry in entries:
        obj = lookup[entry["id"]]
        if obj.get("motionSide") != entry["side"] or obj.get("motionMuscle") != entry["role"]:
            raise ValueError(f"Re-import label changed for {entry['id']}")
        if entry["role"] == "external-abdominal-oblique":
            check_oblique_surface(obj)
        keys = obj.data.shape_keys.key_blocks if obj.data.shape_keys else None
        expected = {"blink": {"Blink"}, "jaw": {"JawOpen"}, "smile": {"Smile"}, "breath": {"Inhale", "ForcedExhale"}}[region]
        found = set(keys.keys()) - {"Basis"} if keys else set()
        if entry["modeling"] == "static-context":
            if found:
                raise ValueError(f"Static contextual surface gained deformation: {entry['id']}")
            continue
        if found != expected:
            raise ValueError(f"Morph coverage mismatch for {entry['id']}: {found}")
        morph_evidence = {}
        for name in sorted(expected):
            basis = keys["Basis"]
            displaced = keys[name]
            deltas = [to_web(value.co - neutral.co) for value, neutral in zip(displaced.data, basis.data)]
            norms = [1000 * delta.length for delta in deltas]
            if not all(map(math.isfinite, norms)) or not (0.9 < max(norms) < 45):
                raise ValueError(f"Nonphysical displacement for {entry['id']}: {max(norms)}")
            edges = []
            for edge in obj.data.edges:
                first, last = edge.vertices
                initial = (basis.data[first].co - basis.data[last].co).length
                if initial > .0005:
                    edges.append((displaced.data[first].co - displaced.data[last].co).length / initial)
            morph_evidence[name] = {
                "maxDisplacementMm": round(max(norms), 3),
                "medianDisplacementMm": round(statistics.median(norms), 3),
                "minVerticalMm": round(1000 * min(d.y for d in deltas), 3),
                "maxVerticalMm": round(1000 * max(d.y for d in deltas), 3),
                "edgeLengthRatio95": round(percentile(edges, .95), 3),
            }
        evidence[entry["id"]] = morph_evidence
    return evidence


def main():
    source, folder, region = sys.argv[sys.argv.index("--") + 1:]
    repo, output = Path(source).resolve(), Path(folder).resolve()
    if output.is_relative_to(repo):
        raise ValueError("Keep outputs, writable model, and backups outside the repository.")
    if region not in {"blink", "breath", "jaw", "smile"}:
        raise ValueError("Choose blink, breath, jaw or smile.")
    output.mkdir(parents=True)
    assets = repo / "assets"
    source_bones = assets / "skeleton.glb"
    source_muscle = assets / ("muscles-head-neck.glb" if region in {"blink", "jaw", "smile"} else "muscles-trunk-back.glb")
    source_files = [source_bones, source_muscle, assets / "MODEL-LICENSE.md", repo / "src" / "muscle-models.json"]
    if region == "jaw":
        source_files.append(repo / "src" / "three-d-landmarks.json")
    backed = backup(source_files, output / "before-blender-edit")
    bpy.ops.wm.read_factory_settings(use_empty=True)
    if region == "jaw":
        entries = build_jaw(source_bones, source_muscle, source_files[-1])
    else:
        entries = {"blink": build_blink, "breath": build_breath, "smile": build_smile}[region](source_bones, source_muscle)
    base = f"motion-{region}"
    editable = output / (base + ".blend")
    bpy.ops.wm.save_as_mainfile(filepath=str(editable))
    backup([*source_files, editable], output / "before-blender-export")
    model = output / (base + ".glb")
    bpy.ops.export_scene.gltf(
        filepath=str(model),
        export_format="GLB",
        export_extras=True,
        export_animations=False,
        export_morph_normal=False,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
    )
    validation = check_export(model, entries, region)
    for row in backed:
        if sha256(Path(row["original"])) != row["sha256"]:
            raise RuntimeError(f"Input changed in the course of authoring: {row['original']}")
    notes = {
        "blink": "Authored bilateral eyelid motion based on human blink studies. Atlas skin, eyelash, lid tarsal plate, globe and all other facial muscles are outside this model.",
        "jaw": "Bilateral teaching motion with a stabilized hyoid. Lip, cheek and tongue surfaces show passive jaw follow-through. Separate tongue gestures, disc deformation and bite forces are outside the model.",
        "smile": "Bilateral authored smile. The mesh shows geometric muscle movement and a taught force direction. Labial skin and individual smile variants are outside the model.",
        "breath": "Authored respiratory motion. The diaphragm itself deforms, the ribs rotate on posterior pivots, and intercostal geometry follows the nearest ribs. Abdominal-wall changes are teaching approximations. Regional intercostal recruitment, organ deformation, pressure, and individual forces are not simulated.",
    }
    cameras = {
        "blink": [[0, 1.591, .062], [.22, .08, 1], .162],
        "jaw": [[0, 1.541, .034], [.89, .1, .74], .185],
        "breath": [[0, 1.128, .015], [.74, .12, 1], .66],
        "smile": [[0, 1.533, .072], [.24, .04, 1], .164],
    }
    target, direction, diameter = cameras[region]
    write_json(output / (base + ".json"), {
        "schema": 1,
        "region": region,
        "asset": model.name,
        "sha256": sha256(model),
        "bytes": model.stat().st_size,
        "camera": {"target": target, "direction": direction, "diameter": diameter},
        "sources": SOURCES[region],
        "evidence": "Authored teaching deformation",
        "scope": notes[region],
        "components": entries,
        "clips": lessons(region),
        "checks": validation,
        "sourceFiles": [{"file": item["file"], "sha256": item["sha256"]} for item in backed],
    })
    print(base, "validated", len(entries), "parts,", model.stat().st_size, "bytes")


if __name__ == "__main__":
    main()
