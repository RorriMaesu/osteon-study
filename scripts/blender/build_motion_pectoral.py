"""Build a bilateral shoulder-flexion lesson from the Osteon atlas in Blender 4.5.

Usage: blender -b --factory-startup --disable-autoexec --python-exit-code 1 \
  --python build_motion_pectoral.py -- REPO NEW_OUTPUT_DIRECTORY
"""
import json
import math
from pathlib import Path
import re
import statistics
import sys

import bpy
from mathutils import Quaternion, Vector
from mathutils.bvhtree import BVHTree
import numpy as np

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_motion_regional import (
    SIDES, add_shape, backup, center_of, coordinates, decimate, imported, percentile, phase, rib_like,
    select_sources, sha256, smooth, split_side, surface_lookup, tag_context, tag_muscle, to_web, write_json,
)


MUSCLES = {
    "Clavicular head of pectoralis major muscle": ("pectoralis-clavicular", "Clavicular fibers assist glenohumeral flexion as the arm reaches forward."),
    "Sternocostal head of pectoralis major muscle": ("pectoralis-sternocostal", "Many fibers adduct and internally rotate the arm. Direction and contribution vary across the joint range."),
    "(Abdominal part of pectoralis major muscle)": ("pectoralis-abdominal", "The variable lower part is shown following the humeral insertion."),
    "Pectoralis minor muscle": ("pectoralis-minor", "Runs from upper ribs to coracoid and acts on the scapula."),
    "Serratus anterior muscle": ("serratus-anterior", "The scapular insertion follows scapular rotation. The serratus can assist upward rotation and protraction."),
    "Clavicular part of deltoid muscle": ("deltoid-anterior", "The clavicular or anterior fibers flex the shoulder."),
    "Acromial part of deltoid muscle": ("deltoid-middle", "The acromial fibers are prominent abductors. This surface follows the arm during flexion."),
    "Scapular spinal part of deltoid muscle": ("deltoid-posterior", "The posterior fibers have a shoulder-extension moment arm opposite flexion."),
    "Coracobrachialis muscle": ("coracobrachialis", "Assists flexion and adduction at the shoulder."),
    "Teres major muscle": ("teres-major", "Extends, adducts and medially rotates the humerus."),
    "Supraspinatus muscle": ("supraspinatus", "Follows the humerus near its insertion and contributes to humeral-head control."),
    "Infraspinatus muscle": ("infraspinatus", "Assists external rotation and stability."),
    "Subscapularis muscle": ("subscapularis", "Assists internal rotation and stability."),
    "Teres minor muscle": ("teres-minor", "Assists external rotation and stability."),
    "Latissimus dorsi muscle": ("latissimus-dorsi", "Can oppose forward flexion with a shoulder-extension moment arm."),
}
PRIMARY = ["pectoralis-clavicular", "deltoid-anterior", "coracobrachialis"]
OPPOSITION = ["deltoid-posterior", "teres-major", "latissimus-dorsi"]


class ShoulderPose:
    def __init__(self, bones, suffix, landmarks):
        self.sign = SIDES[suffix][1]
        self.socket = Vector(landmarks["Glenoid cavity"]["points"][0]["point"])
        self.socket.x = self.sign * abs(self.socket.x)
        approximate = self.socket + Vector((self.sign * .021, .007, .006))
        humerus = coordinates(bones[f"Humerus.{suffix}"])
        cap = np.array([list(p - approximate) for p in humerus
                        if p.y > approximate.y - .007 and (p - approximate).length < .044])
        if len(cap) < 20:
            raise RuntimeError(f"Insufficient vertices for the humeral head {suffix}")
        center, _ = np.linalg.lstsq(
            np.column_stack((2 * cap, np.ones(len(cap)))), np.sum(np.square(cap), axis=1), rcond=None
        )[:2]
        offset = Vector(center[:3])
        self.head = approximate + offset
        if offset.length > .013:
            raise RuntimeError(f"Humeral-head fit exceeds its local radius guide {suffix}: {offset.length}")
        self.acromioclavicular = Vector(landmarks["Acromioclavicular facet"]["points"][0]["point"])
        self.acromioclavicular.x = self.sign * abs(self.acromioclavicular.x)
        clavicle = coordinates(bones[f"Clavicle.{suffix}"])
        count = max(10, len(clavicle) // 20)
        self.clavicle_origin = center_of(sorted(clavicle, key=lambda point: abs(point.x))[:count])

    def shoulder_girdle_rotation(self, amount):
        pitch = Quaternion(Vector((0, 0, 1)), math.radians(self.sign * 4 * amount))
        yaw = Quaternion(Vector((0, 1, 0)), math.radians(-self.sign * 2 * amount))
        return yaw @ pitch

    def scapula(self, point, amount=1):
        fixed_joint = self.acromioclavicular
        additional_upward_rotation = Quaternion(Vector((0, 0, 1)), math.radians(self.sign * 2.2 * amount))
        adjusted = fixed_joint + additional_upward_rotation @ (point - fixed_joint)
        return self.clavicle(adjusted, amount)

    def humerus(self, point, amount=1):
        raise_arm = Quaternion(Vector((1, 0, 0)), math.radians(-29 * amount))
        return self.scapula(self.head, amount) + raise_arm @ (point - self.head)

    def clavicle(self, point, amount=1):
        rotation = self.shoulder_girdle_rotation(amount)
        return self.clavicle_origin + rotation @ (point - self.clavicle_origin)


def targeted_bone(_, label):
    rib = rib_like(label)
    return (
        re.fullmatch(r"(Clavicle|Scapula|Humerus|Radius|Ulna|Hip bone)\.[lr]", label)
        or re.fullmatch(r"Vertebra [TL]\d{1,2}", label)
        or label in {"Manubrium of sternum", "Body of sternum", "Xiphoid process"}
        or rib and rib[2].lower() not in {"tenth", "eleventh", "twelfth"}
    )


def muscles_for_motion(bones, assets, landmarks):
    shoulders = {suffix: ShoulderPose(bones, suffix, landmarks) for suffix in SIDES}
    targets = {
        "Clavicle": "clavicle",
        "Scapula": "scapula",
        "Humerus": "humerus",
        "Radius": "humerus",
        "Ulna": "humerus",
    }
    for label, obj in bones.items():
        name, _, _ = split_side(label)
        tag_context(obj, label)
        if name in targets:
            shoulder = shoulders[label[-1]]
            add_shape(obj, "Reach", getattr(shoulder, targets[name]))

    chest_fixed = surface_lookup([obj for label, obj in bones.items() if rib_like(label) or "sternum" in label])
    origins = {}
    for suffix in SIDES:
        unique = lambda stem: bones[f"{stem}.{suffix}"]
        origins[suffix] = {
            "upper": surface_lookup([unique("Clavicle")]),
            "scapula": surface_lookup([unique("Scapula")]),
            "humerus": surface_lookup([unique("Humerus")]),
            "chest": chest_fixed,
        }
    selected = lambda _, label: split_side(label)[0] in MUSCLES
    parts = {}
    for src in assets[1:]:
        parts.update(select_sources(src, selected))
    if len(parts) != len(MUSCLES) * 2:
        raise RuntimeError(f"Shoulder model expected {len(MUSCLES) * 2} parts, found {len(parts)}")
    entries = []
    anchor_checks = {}
    for label, obj in parts.items():
        name, _, sign = split_side(label)
        suffix = label[-1]
        role = MUSCLES[name][0]
        shoulder = shoulders[suffix]
        if role == "pectoralis-minor" or role == "serratus-anterior":
            fixed, movable = "chest", "scapula"
        elif role in {"pectoralis-clavicular", "deltoid-anterior"}:
            fixed, movable = "upper", "humerus"
        elif role.startswith("pectoralis-") or role == "latissimus-dorsi":
            fixed, movable = "chest", "humerus"
        else:
            fixed, movable = "scapula", "humerus"
        known = origins[suffix]
        from_transform = shoulder.clavicle if fixed == "upper" else shoulder.scapula if fixed == "scapula" else lambda p: p
        to_transform = getattr(shoulder, movable)
        decimate(obj, 4100)
        entries.append(tag_muscle(obj, label, MUSCLES, "authored-deformation"))
        neutral = coordinates(obj)

        def ratio(point):
            from_distance = known[fixed].find(point)[2]
            to_distance = known[movable].find(point)[2]
            return from_distance / max(.00001, from_distance + to_distance)

        rank = sorted(neutral, key=ratio)
        end_sample = max(8, len(rank) // 8)
        axis_origin = center_of(rank[:end_sample])
        extent = center_of(rank[-end_sample:]) - axis_origin
        axis = extent.normalized()
        span = extent.length

        def influence(point):
            specific = ratio(point)
            if role == "latissimus-dorsi":
                return smooth(.10, .79, specific) * smooth(1.20, 1.304, point.y)
            if role == "teres-major":
                progress = (point - axis_origin).dot(axis) / max(.0001, span)
                return smooth(-.15, 1.1, progress)
            return smooth(.10, .91, specific)

        def motion(point):
            return from_transform(point).lerp(to_transform(point), influence(point))

        add_shape(obj, "Reach", motion)
        measured = {}
        ranked = sorted(neutral, key=influence)
        selected = max(8, round(len(ranked) * .07))
        for tag, subset, transform in (
            ("origin", ranked[:selected], from_transform),
            ("insertion", ranked[-selected:], to_transform),
        ):
            errors = [1000 * (motion(point) - transform(point)).length for point in subset]
            measured[tag + "FollowErrorMmP95"] = round(percentile(errors, .95), 3)
        anchor_checks[obj["muscleId"]] = measured
    return entries, anchor_checks, shoulders


def vertices(obj, weight=0):
    if not obj.data.shape_keys:
        return [obj.matrix_world @ v.co for v in obj.data.vertices]
    rest = obj.data.shape_keys.key_blocks["Basis"].data
    reach = obj.data.shape_keys.key_blocks["Reach"].data
    return [obj.matrix_world @ point.co.lerp(target.co, weight) for point, target in zip(rest, reach)]


def checked_asset(path, components, shoulders, anchor_checks):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    imported(path)
    parts = {obj.get("muscleId"): obj for obj in bpy.context.scene.objects if obj.type == "MESH" and obj.get("motionMuscle")}
    bones = {obj.get("motionContext"): obj for obj in bpy.context.scene.objects if obj.type == "MESH" and obj.get("motionContext")}
    checks = {}
    for entry in components:
        obj = parts[entry["id"]]
        names = obj.data.shape_keys.key_blocks.keys()
        if obj.get("motionSide") != entry["side"] or set(names) != {"Basis", "Reach"}:
            raise RuntimeError(f"Invalid round-trip names: {entry['id']}")
        rest, reach = vertices(obj), vertices(obj, 1)
        lengths = [(moved - base).length * 1000 for base, moved in zip(rest, reach)]
        rates = []
        for edge in obj.data.edges:
            a, b = edge.vertices
            base = (rest[a] - rest[b]).length
            if base > .0005:
                rates.append((reach[a] - reach[b]).length / base)
        if not all(map(math.isfinite, lengths)) or not (1 < max(lengths) < 125):
            raise RuntimeError(f"Invalid round-trip deformation: {entry['id']}: {max(lengths)} mm")
        checks[entry["id"]] = {"Reach": {
            "medianDisplacementMm": round(statistics.median(lengths), 3),
            "maxDisplacementMm": round(max(lengths), 3),
            "edgeLengthRatio95": round(percentile(rates, .95), 3),
            **anchor_checks[entry["id"]],
        }}
    joint_reviews = {}
    for suffix, pose in shoulders.items():
        humerus = bones[f"Humerus.{suffix}"]
        forearm = bones[f"Radius.{suffix}"]
        scapula = bones[f"Scapula.{suffix}"]
        clavicle = bones[f"Clavicle.{suffix}"]
        both = []
        for weight in (0, .25, .5, .75, 1):
            bv = lambda obj: BVHTree.FromPolygons(vertices(obj, weight), [p.vertices for p in obj.data.polygons])
            both.append({
                "fraction": weight,
                "glenohumeralTrianglePairsInContact": len(bv(humerus).overlap(bv(scapula))),
                "acromioclavicularTrianglePairsInContact": len(bv(clavicle).overlap(bv(scapula))),
                "glenoidToHeadCenterMm": round(1000 * (pose.scapula(pose.socket, weight) - pose.scapula(pose.head, weight)).length, 3),
            })
        neutral, final = vertices(forearm), vertices(forearm, 1)
        anterior = max(to_web(moved - base).z for base, moved in zip(neutral, final))
        if anterior < .12:
            raise RuntimeError("The forward-reach forearm displacement did not pass the direction check")
        joint_reviews[suffix] = {"maxForearmForwardMm": round(anterior * 1000, 3), "samples": both}
    return checks, joint_reviews


def main():
    repo, output = [Path(value).resolve() for value in sys.argv[sys.argv.index("--") + 1:]]
    if output.is_relative_to(repo):
        raise ValueError("Keep editable Blender projects and backups outside the repository.")
    output.mkdir(parents=True)
    assets = [repo / "assets" / name for name in
              ("skeleton.glb", "muscles-shoulder-arm.glb", "muscles-trunk-back.glb")]
    landmarks_path = repo / "src" / "landmarks.json"
    inputs = [*assets, landmarks_path, repo / "assets" / "MODEL-LICENSE.md", repo / "src" / "muscle-models.json"]
    before = backup(inputs, output / "before-blender-edit")
    bpy.ops.wm.read_factory_settings(use_empty=True)
    landmarks = json.loads(landmarks_path.read_text(encoding="utf-8"))
    bones = select_sources(assets[0], targeted_bone)
    components, anchor_checks, shoulders = muscles_for_motion(bones, assets, landmarks)
    project = output / "motion-pectoral.blend"
    bpy.ops.wm.save_as_mainfile(filepath=str(project))
    backup([*inputs, project], output / "before-blender-export")
    model = output / "motion-pectoral.glb"
    bpy.ops.export_scene.gltf(
        filepath=str(model), export_format="GLB", export_extras=True, export_animations=False,
        export_morph_normal=False, export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=6,
    )
    checks, joint_review = checked_asset(model, components, shoulders, anchor_checks)
    if any(sha256(Path(saved["original"])) != saved["sha256"] for saved in before):
        raise RuntimeError("At least one source file changed during the Blender operation")
    write_json(output / "motion-pectoral.json", {
        "schema": 1,
        "region": "pectoral",
        "asset": model.name,
        "sha256": sha256(model),
        "bytes": model.stat().st_size,
        "camera": {"target": [0, 1.228, -.004], "direction": [.65, .12, 1], "diameter": .90},
        "sources": {
            "openstax": "https://openstax.org/books/anatomy-and-physiology-2e/pages/11-5-muscles-of-the-pectoral-girdle-and-upper-limbs",
            "study": "https://onlinelibrary.wiley.com/doi/10.1111/j.1469-7580.2008.00965.x",
            "detail": "https://pmc.ncbi.nlm.nih.gov/articles/PMC2857390/",
        },
        "evidence": "Authored teaching deformation",
        "scope": "Both shoulders flex through a limited available range in an authored reach. The model shows distinct muscle paths, scapular movement, and selected actions. It omits hands, instrumented activity and measured whole-body recruitment.",
        "components": components,
        "clips": [{
            "id": "forward-reach", "name": "Forward reach", "duration": 4.2,
            "morphTracks": {"Reach": [[0, 0], [.28, 0], [1.6, 1], [2.13, 1], [3.8, 0], [4.2, 0]]},
            "phases": [
                phase(0, "Arms at rest", "Compare the clavicular and sternocostal portions of pectoralis major."),
                phase(.28, "Forward reach", "Clavicular pectoralis major, anterior deltoid and coracobrachialis assist flexion. The highlighted opposing muscles have extension moment arms.", PRIMARY, OPPOSITION),
                phase(1.6, "Hold the reach", "The raised arms hold position in this teaching example.", PRIMARY, OPPOSITION),
                phase(2.13, "Return under control", "Shoulder flexors can control the descent with lengthening under tension.", PRIMARY),
                phase(3.8, "Arms at rest", "The arms are back at the starting posture."),
            ],
        }],
        "checks": checks,
        "jointReview": joint_review,
        "sourceFiles": [{"file": item["file"], "sha256": item["sha256"]} for item in before],
    })
    print("motion-pectoral verified", len(components), "components at five positions", model.stat().st_size, "bytes")


if __name__ == "__main__":
    main()
