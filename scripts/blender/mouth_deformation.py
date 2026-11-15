"""Passive jaw follow-through for Osteon's registered atlas, in metres and Y-up."""

import math
from mathutils import Quaternion, Vector
from muscle_clearance import directional_clearance, registered_surface

ORAL_FOLLOW = {
    "Orbicularis oris muscle": ("orbicularis-oris", "The lower lip follows the mandible while the upper lip stays supported by the upper face."),
    "Bucinator": ("buccinator", "The lower cheek follows the mandible and the upper cheek keeps its maxillary attachment."),
    "Mentalis muscle": ("mentalis", "The chin muscle and its lower-lip attachment travel with the mandibular symphysis."),
    "Depressor labii inferioris": ("depressor-labii-inferioris", "Moves with the mandibular attachment and the lower lip."),
    "Depressor anguli oris": ("depressor-anguli-oris", "The mandibular attachment follows the jaw while the mouth corner moves partway."),
    "Levator anguli oris": ("levator-anguli-oris", "The maxillary attachment stays fixed while the mouth corner can shift."),
    "Zygomaticus major muscle": ("zygomaticus-major", "The cheekbone attachment stays fixed while the mouth corner can shift."),
    "Risorius muscle": ("risorius", "The mouth corner follows part of the jaw displacement."),
    "Genioglossus muscle": ("genioglossus", "The anterior mandibular attachment follows the jaw and the tongue base follows partway."),
    "Hyoglossus muscle": ("hyoglossus", "The tongue-side fibers follow partway while the hyoid attachment stays fixed in this demonstration."),
    "Platysma": ("platysma", "The mandibular edge follows the jaw and the neck end stays anchored."),
}


def smooth(start, end, value):
    t = min(1., max(0., (value - start) / (end - start)))
    return t * t * (3. - 2. * t)


def jaw_transform(point, pivot, weight=1):
    angle = math.radians(15 * weight)
    return pivot + Quaternion(Vector((1, 0, 0)), angle) @ (point - pivot) + Vector((0, -.0048, .0075)) * weight


def incisor_clearance(obj, bones, pivot, to_web, to_blender):
    teeth = registered_surface([bone for name, bone in bones.items()
                                if name.startswith(('Upper medial incisor.', 'Upper lateral incisor.'))], to_web)
    front = Vector((0, 0, 1))
    inverse = obj.matrix_world.inverted()
    local_forward = inverse.to_3x3() @ to_blender(front)
    for vertex in obj.data.vertices:
        p = to_web(obj.matrix_world @ vertex.co)
        if abs(p.x) > .022 or not 1.524 <= p.y <= 1.548 or p.z < .079:
            continue
        weight = oral_jaw_weight('orbicularis-oris', p)
        # Match the skinned opening arc, checking in-between frames as well as
        # the closed and open endpoints. The correction binds in the rest mesh
        # so it also follows the existing smile and jaw skin.
        clearance = 0.
        for step in range(9):
            t = step / 8
            posed = p.lerp(jaw_transform(p, pivot, t), weight)
            clearance = max(clearance, directional_clearance(teeth, posed, front, .009, .00065))
        # The sampled ray covers vertices. Leave clearance for the surface
        # between adjacent samples near the medial incisors as well.
        band = (1 - smooth(.014, .022, abs(p.x))) * smooth(1.524, 1.532, p.y) * (1 - smooth(1.541, 1.548, p.y))
        clearance += .0015 * band
        if clearance:
            offset = local_forward * min(.006, clearance / .96)
            vertex.co += offset
            if obj.data.shape_keys:
                for key in obj.data.shape_keys.key_blocks:
                    key.data[vertex.index].co += offset
    obj.data.update()


def oral_jaw_weight(role, point):
    """Blend the fixed and mandibular ends of each atlas muscle surface."""
    x, y, z = point
    if role == "orbicularis-oris":
        lower_lip = 1. - smooth(1.526, 1.542, y)
        corner = smooth(.018, .032, abs(x))
        return lower_lip * (1. - .55 * corner)
    if role == "buccinator":
        return (1. - smooth(1.524, 1.547, y)) * (.86 + .14 * smooth(.046, .066, z))
    if role == "mentalis":
        return 1.
    if role == "depressor-labii-inferioris":
        return 1. - .15 * smooth(1.514, 1.533, y)
    if role == "depressor-anguli-oris":
        return 1. - .55 * smooth(1.511, 1.538, y)
    if role == "levator-anguli-oris":
        return .34 * (1. - smooth(1.542, 1.554, y))
    if role == "zygomaticus-major":
        return .42 * (1. - smooth(1.533, 1.555, y)) * smooth(.054, .072, z)
    if role == "risorius":
        return .43 * smooth(.049, .071, z)
    if role == "genioglossus":
        return .14 + .86 * smooth(.044, .075, z)
    if role == "hyoglossus":
        return .42 * smooth(1.502, 1.521, y) * smooth(.034, .051, z)
    if role == "platysma":
        return smooth(1.456, 1.532, y) * smooth(.014, .066, z)
    raise ValueError(f"Unknown oral attachment role: {role}")
