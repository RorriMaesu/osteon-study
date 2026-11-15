"""Stage ankle-responsive gastrocnemius and Achilles surface corrections."""
from datetime import datetime, timezone
import argparse
import hashlib
import json
import math
import shutil
import sys
from pathlib import Path

import bpy
from mathutils import Quaternion, Vector
from mathutils.kdtree import KDTree

ANGLES = {"AnklePosePlantarflexion": -35, "AnklePoseDorsiflexion": 23}
PARTS = ("LateralHeadOfGastrocnemius", "CalcanealTendon")
SUFFIXES = ("Right", "Left")

def digest(path):
    with path.open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()

def snapshot(stage, phase, paths):
    target = stage / "backups" / (datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%fZ") + "-" + phase)
    target.mkdir(parents=True)
    files = {}
    for index, path in enumerate(paths):
        if not path.is_file():
            continue
        copied = target / f"{index:02}-{path.name}"
        shutil.copy2(path, copied)
        checksum = digest(path)
        if digest(copied) != checksum:
            raise RuntimeError("Backup failed for " + str(path))
        files[str(path)] = {"file": copied.name, "sha256": checksum, "bytes": path.stat().st_size}
    (target / "checksums.json").write_text(json.dumps(files, indent=2), encoding="utf-8")
    print("Verified backup:", target, flush=True)
    return files

def to_web(v):
    return Vector((v.x, v.z, -v.y))

def to_blender(v):
    x, y, z = v
    return Vector((x, -z, y))

def smooth(value, low, high):
    t = min(1, max(0, (value - low) / (high - low)))
    return t * t * (3 - 2 * t)

def points(obj):
    return [to_web(obj.matrix_world @ v.co) for v in obj.data.vertices]

def centroid(points):
    return sum(points, Vector((0, 0, 0))) / len(points)

def evaluated_points(obj):
    deformed = obj.evaluated_get(bpy.context.evaluated_depsgraph_get())
    return points(deformed)

def bone(arm, role, side):
    return arm.pose.bones["Motion" + role + side[0]]

def change_angle(joint, web_axis, angle):
    local_axis = joint.bone.matrix_local.to_quaternion().inverted() @ to_blender(web_axis)
    joint.rotation_mode = "QUATERNION"
    joint.rotation_quaternion = Quaternion(local_axis, math.radians(angle))

def meshes():
    return {side: {part: bpy.data.objects["Motion" + side + part] for part in PARTS} for side in SUFFIXES}

def author(source_meshes, arm):
    baked_vectors = {}
    for side, pair in source_meshes.items():
        tendon = points(pair["CalcanealTendon"])
        insertion = centroid([p for p in tendon if p.y < 0.043])
        aponeurosis = centroid([p for p in tendon if 0.18 < p.y < 0.24])
        axis = (aponeurosis - insertion).normalized()
        pivot = to_web(arm.matrix_world @ bone(arm, "Ankle", side).bone.head_local)
        vectors = {}
        for name, angle in ANGLES.items():
            posed = pivot + Quaternion(Vector((-1, 0, 0)), math.radians(angle)) @ (insertion - pivot)
            # Shares the displacement between the free tendon and the aponeurosis.
            # This coefficient is an authored mesh correction, not a measured fiber parameter.
            vectors[name] = axis * (0.34 * (posed - insertion).dot(axis))
        baked_vectors[side] = {name: list(vector) for name, vector in vectors.items()}
        for obj in pair.values():
            base = obj.shape_key_add(name="Basis")
            transform = obj.matrix_world.copy()
            inverse = transform.inverted()
            obj["motionAnklePlantar"] = "AnklePosePlantarflexion"
            obj["motionAnkleDorsi"] = "AnklePoseDorsiflexion"
            for name, vector in vectors.items():
                shape = obj.shape_key_add(name=name)
                for rest, vertex in zip(base.data, shape.data):
                    point = to_web(transform @ rest.co)
                    # Same field on both surfaces across their proximal join.
                    # Fade it to zero before the femoral origin and calcaneal insertion.
                    envelope = smooth(point.y, 0.10, 0.155) * (1 - smooth(point.y, 0.23, 0.365))
                    vertex.co = inverse @ to_blender(point + envelope * vector)
    return baked_vectors

def distances(first, second, first_ids):
    tree = KDTree(len(second))
    for i, point in enumerate(second):
        tree.insert(point, i)
    tree.balance()
    return [tree.find(first[i])[2] for i in first_ids]

def percentile(ascending, fraction):
    return sorted(ascending)[round((len(ascending) - 1) * fraction)]

def validate_export(payload):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(payload))
    armatures = [obj for obj in bpy.context.scene.objects if obj.type == "ARMATURE"]
    if len(armatures) != 1:
        raise RuntimeError("Expected one imported lower-limb armature")
    arm = armatures[0]
    report = {}
    for side, pair in meshes().items():
        belly = pair["LateralHeadOfGastrocnemius"]
        tendon = pair["CalcanealTendon"]
        neutral_belly = points(belly)
        neutral_tendon = points(tendon)
        origin_ids = [i for i, point in enumerate(neutral_belly) if point.y > 0.44]
        insert_ids = [i for i, point in enumerate(neutral_tendon) if point.y < 0.043]
        join_candidates = [i for i, point in enumerate(neutral_belly) if point.y < 0.245]
        close_distances = distances(neutral_belly, neutral_tendon, join_candidates)
        close_ids = [i for i, near in zip(join_candidates, close_distances) if near < 0.0015]
        if min(len(origin_ids), len(insert_ids), len(close_ids)) < 15:
            raise RuntimeError("Not enough anatomical samples for " + side)
        report[side] = {}
        def evaluate(ankle, corrected):
            change_angle(bone(arm, "Ankle", side), (-1, 0, 0), ankle)
            for obj in pair.values():
                for name, end in ANGLES.items():
                    obj.data.shape_keys.key_blocks[name].value = max(0, min(1, ankle / end)) if corrected else 0
            bpy.context.view_layer.update()
            return evaluated_points(belly), evaluated_points(tendon)
        for hip, knee in ((0, 0), (28, 50)):
            change_angle(bone(arm, "Hip", side), (-1, 0, 0), hip)
            change_angle(bone(arm, "Knee", side), (1, 0, 0), knee)
            at_zero, _ = evaluate(0, False)
            for ankle in (-35, -18, 0, 11.5, 23):
                base_belly, base_tendon = evaluate(ankle, False)
                shaped_belly, shaped_tendon = evaluate(ankle, True)
                origin = max((shaped_belly[i] - base_belly[i]).length for i in origin_ids)
                end = max((shaped_tendon[i] - base_tendon[i]).length for i in insert_ids)
                before = distances(base_belly, base_tendon, close_ids)
                after = distances(shaped_belly, shaped_tendon, close_ids)
                join_drift = max(b - a for a, b in zip(before, after))
                distal = sum(shaped_belly[i].y - at_zero[i].y for i in close_ids) / len(close_ids) if not hip else None
                max_deformation = max((a - b).length for a,b in zip(shaped_belly,base_belly))
                if max(origin, end) > .0001 or join_drift > .0004:
                    raise RuntimeError(f"Attachment failure on {side} at {(hip,knee,ankle)}: {origin}, {end}, {join_drift}")
                if not hip and ankle and (max_deformation < .001 or distal * ankle >= 0):
                    raise RuntimeError(f"Calf ankle response wrong on {side} at {ankle}: {distal}")
                mm = lambda value: round(value * 1000, 3) if value is not None else None
                report[side][f"hip{hip}_knee{knee}_ankle{ankle}"] = {
                    "originCorrectionDriftMm": mm(origin),
                    "insertionCorrectionDriftMm": mm(end),
                    "lateralGastrocnemiusMaxDeformationMm": mm(max_deformation),
                    "joinMeanVerticalMovementMm": mm(distal),
                    "joinNearestDistanceP95Mm": mm(percentile(after, .95)),
                    "joinMaxIncrementMm": mm(join_drift),
                    "joinSampleVertices": len(close_ids),
                }
        change_angle(bone(arm, "Hip", side), (-1, 0, 0), 0)
        change_angle(bone(arm, "Knee", side), (1, 0, 0), 0)
        evaluate(0, True)
    return report

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo", type=Path, required=True)
    parser.add_argument("--editable", type=Path, required=True)
    parser.add_argument("--stage", type=Path, required=True)
    arg = parser.parse_args(sys.argv[sys.argv.index("--") + 1:])
    stage, repo = arg.stage.resolve(), arg.repo.resolve()
    if stage == repo or repo in stage.parents:
        raise RuntimeError("Use scratch outside the repository")
    source = arg.editable.resolve()
    assets = repo / "assets"
    editable = stage / "motion-legs-ankle-candidate.blend"
    payload = stage / "motion-legs-ankle-candidate.glb"
    protected = [source, assets / "motion-legs.glb", assets / "motion-leg-actions.glb",
                 assets / "motion-legs.json", assets / "motion-leg-actions.json",
                 assets / "skeleton.glb", assets / "muscles-pelvis-leg-foot.glb",
                 editable, payload]
    protected_before = snapshot(stage, "before-edit", protected)
    bpy.ops.wm.open_mainfile(filepath=str(source))
    arm = bpy.data.objects["MotionLowerBody"]
    vectors = author(meshes(), arm)
    snapshot(stage, "before-save", protected)
    bpy.ops.wm.save_as_mainfile(filepath=str(editable))
    snapshot(stage, "before-export", protected)
    bpy.ops.export_scene.gltf(filepath=str(payload),export_format="GLB",export_extras=True,export_animations=False,
        export_yup=True,export_draco_mesh_compression_enable=True,export_draco_mesh_compression_level=6,
        export_draco_position_quantization=16,export_draco_normal_quantization=10,export_draco_generic_quantization=12)
    report = validate_export(payload)
    for path in protected[:-2]:
        if digest(path) != protected_before[str(path)]["sha256"]:
            raise RuntimeError("Protected file changed: " + str(path))
    (stage / "gastrocnemius-ankle-validation.json").write_text(json.dumps({
        "exportSha256": digest(payload), "angles": ANGLES, "attachmentCorrectionVectorsMeters": vectors,
        "reimport": report, "scope": "Ankle-driven teaching approximation. This is separate from EMG and does not reproduce measured fascicle lengths or tendon strain.",
        "sources": ["https://pubmed.ncbi.nlm.nih.gov/17280557/", "https://pubmed.ncbi.nlm.nih.gov/21825027/", "https://pubmed.ncbi.nlm.nih.gov/25457482/"],
    }, indent=2), encoding="utf-8")
    print("Finished, tested Blender export:", payload)

if __name__ == "__main__":
    main()
