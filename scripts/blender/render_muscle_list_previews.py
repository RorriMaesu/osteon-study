"""Render the required-list specimens from Osteon's registered atlas meshes.

Run from the repository with Blender 4.5 and Node 22 or newer on PATH:
blender -b --factory-startup --python-exit-code 1 --python scripts/blender/render_muscle_list_previews.py
Optional arguments after -- are individual card IDs.
"""

import json
from pathlib import Path
import subprocess
import sys

import bpy
import numpy as np
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "assets" / "muscle-previews"
WIDTH, HEIGHT = 600, 480
MUSCLE_COLORS = [(.58, .19, .125, 1), (.72, .32, .21, 1), (.47, .14, .12, 1),
                 (.67, .25, .18, 1), (.57, .22, .18, 1)]
# Blender imports glTF Y-up anatomical coordinates into its Z-up space.
VIEWS = {
    "front": (0, -1, 0), "back": (0, 1, 0), "right": (-1, 0, 0),
    "top": (0, 0, 1), "bottom": (0, 0, -1),
}


def load_targets():
    script = """
        import {courseMuscleTargets} from './src/muscle-spatial-data.js';
        import {muscleListPreviewTarget} from './src/muscle-list-preview-targets.js';
        console.log(JSON.stringify(courseMuscleTargets.map(t => muscleListPreviewTarget(t.id))));
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], cwd=ROOT,
                            check=True, capture_output=True, encoding="utf-8")
    return json.loads(result.stdout)


def make_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_WORKBENCH"
    scene.render.resolution_x, scene.render.resolution_y = WIDTH, HEIGHT
    scene.render.resolution_percentage = 100
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = "WEBP"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.image_settings.quality = 90
    scene.display.render_aa = "16"
    shading = scene.display.shading
    shading.light = "STUDIO"
    shading.studio_light = "paint.sl"
    shading.color_type = "OBJECT"
    shading.show_shadows = False
    shading.show_cavity = True
    shading.cavity_type = "WORLD"
    shading.cavity_ridge_factor = 1.05
    shading.cavity_valley_factor = 1.1
    scene.view_settings.view_transform = "Standard"
    camera_data = bpy.data.cameras.new("Specimen orthographic camera")
    camera_data.type = "ORTHO"
    camera_data.clip_start = .0001
    scene.camera = bpy.data.objects.new(camera_data.name, camera_data)
    scene.collection.objects.link(scene.camera)
    return scene


def load_meshes(targets):
    assets = json.loads((ROOT / "src/muscle-models.json").read_text(encoding="utf-8"))["assets"]
    regions = {part["region"] for target in targets for part in target["components"]}
    for region in sorted(regions):
        bpy.ops.import_scene.gltf(filepath=str(ROOT / "assets" / assets[region]["file"]))
    meshes = {}
    for obj in bpy.context.scene.objects:
        if obj.type == "MESH":
            obj.hide_render = True
            mesh_id = obj.get("muscleId")
            if mesh_id in meshes:
                raise ValueError(f"Duplicate source component {mesh_id}")
            meshes[mesh_id] = obj
    return meshes


def frame_camera(scene, objects, direction):
    camera = scene.camera
    direction = Vector(direction).normalized()
    # A consistent azimuth keeps top and underside views from flipping between cards.
    camera.rotation_euler = (-direction).to_track_quat("-Z", "Y").to_euler()
    basis = camera.rotation_euler.to_matrix()
    lo, hi = np.full(3, np.inf), np.full(3, -np.inf)
    for obj in objects:
        positions = np.empty(len(obj.data.vertices) * 3, dtype=np.float32)
        obj.data.vertices.foreach_get("co", positions)
        world = np.asarray(obj.matrix_world)
        coords = (positions.reshape(-1, 3) @ world[:3, :3].T + world[:3, 3]) @ np.asarray(basis)
        lo, hi = np.minimum(lo, coords.min(axis=0)), np.maximum(hi, coords.max(axis=0))
    camera.location = basis @ Vector((lo + hi) / 2) + direction * 2
    size = hi - lo
    # A long, thin specimen should fill a portrait lightbox vertically without
    # requiring the phone to fit transparent landscape side margins.
    width = min(WIDTH, max(100, round(HEIGHT * size[0] / size[1])))
    scene.render.resolution_x = width
    long_edge = max(width, HEIGHT)
    camera.data.ortho_scale = max(size[0] / width, size[1] / HEIGHT) * long_edge * 1.12


def main():
    ids = set(sys.argv[sys.argv.index("--") + 1:]) if "--" in sys.argv else set()
    targets = [t for t in load_targets() if t["components"] and (not ids or t["id"] in ids)]
    if not targets:
        raise ValueError("No registered specimens selected")
    scene = make_scene()
    meshes = load_meshes(targets)
    OUT.mkdir(parents=True, exist_ok=True)
    for target in targets:
        visible = []
        names = list(dict.fromkeys(part["muscleName"] for part in target["components"]))
        for part in target["components"]:
            obj = meshes[part["id"]]
            obj.hide_render = False
            shade = MUSCLE_COLORS[names.index(part["muscleName"]) % len(MUSCLE_COLORS)]
            obj.color = (.74, .59, .42, 1) if part["kind"] == "support" else shade
            visible.append(obj)
        if target.get("direction"):
            x, y, z = target["direction"]
            direction = (x, -z, y)
        else:
            direction = VIEWS[target["view"]]
        frame_camera(scene, visible, direction)
        scene.render.filepath = str(OUT / (target["id"] + ".webp"))
        bpy.ops.render.render(write_still=True)
        for obj in visible:
            obj.hide_render = True


if __name__ == "__main__":
    main()
