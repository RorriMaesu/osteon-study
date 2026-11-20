"""Build a 3D teaching schematic from Liu et al., figure 2c/f/i (CC BY 4.0).

Usage: python scripts/build_urethral_sphincter_study.py NEW_GLB
Requires numpy, Pillow, scipy, scikit-image and trimesh.
"""

import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import distance_transform_edt, gaussian_filter
from skimage.measure import marching_cubes
import trimesh


SOURCE = "https://pmc.ncbi.nlm.nih.gov/articles/PMC12003430/#Fig2"
STEP = 0.20
PIXELS_PER_MM = 13.0

# Hand-traced principal red boundaries in panels C, F and I of the publisher's
# 1200-pixel-wide figure. Smaller lobes, fixation artefacts and text are omitted.
# The panels put anterior at the left. Each section shares its urethral lumen
# as a local origin and is made bilaterally symmetric for this teaching view.
SECTIONS = {
    11: ((968, 116), [
        [(952, 82), (956, 83), (944, 90), (936, 102), (931, 116), (935, 126),
         (948, 143), (947, 146), (932, 139), (920, 130), (913, 117), (914, 108),
         (922, 95), (939, 87)],
    ]),
    18: ((941, 268), [
        [(996, 259), (984, 252), (964, 244), (941, 240), (922, 239), (902, 232),
         (882, 238), (865, 246), (865, 261), (878, 277), (899, 292), (919, 296),
         (942, 296), (967, 292), (982, 284), (981, 294), (969, 304), (947, 311),
         (922, 314), (897, 308), (875, 302), (855, 312), (846, 322), (830, 321),
         (820, 312), (819, 294), (817, 280), (817, 256), (822, 230), (832, 212),
         (847, 204), (854, 209), (851, 218), (868, 218), (884, 219), (907, 220),
         (930, 227), (958, 233), (978, 243), (992, 251)],
    ]),
    21: ((952, 421), [
        [(974, 366), (960, 369), (941, 374), (925, 383), (917, 376), (904, 375),
         (899, 367), (889, 374), (869, 380), (849, 382), (826, 392), (819, 396),
         (822, 376), (831, 353), (848, 347), (861, 350), (875, 346), (898, 346),
         (920, 351), (938, 356), (966, 360)],
        [(1016, 456), (1009, 462), (985, 470), (965, 476), (942, 477), (922, 475),
         (899, 476), (890, 483), (868, 486), (846, 482), (829, 470), (824, 451),
         (817, 433), (823, 436), (845, 444), (866, 446), (887, 453), (905, 455),
         (925, 455), (943, 459), (969, 462), (995, 459)],
    ]),
}


def trace_section(depth, x_grid, z_grid):
    (cx, cy), paths = SECTIONS[depth]
    image = Image.new("1", (len(z_grid), len(x_grid)))
    draw = ImageDraw.Draw(image)
    for path in paths:
        coordinates = [
            (
                (-(px - cx) / PIXELS_PER_MM - z_grid[0]) / STEP,
                ((py - cy) / PIXELS_PER_MM - x_grid[0]) / STEP,
            )
            for px, py in path
        ]
        draw.polygon(coordinates, fill=1)
    pixels = np.asarray(image, dtype=bool)
    distance = (distance_transform_edt(pixels) - distance_transform_edt(~pixels)) * STEP
    return (distance + distance[::-1]) / 2


def main():
    output = Path(sys.argv[1])
    if output.exists():
        raise FileExistsError(f"Use a new export path, {output} exists")
    x = np.arange(-10, 10 + STEP / 2, STEP)
    z = np.arange(-11, 15 + STEP / 2, STEP)
    depth = np.arange(6, 28 + STEP / 2, STEP)
    masks = {d: trace_section(d, x, z) for d in SECTIONS}
    # The EUS tapers outside the three traced levels. The terminal profiles
    # erode to closed ends before the figure's last, entirely smooth-muscle level.
    masks[7] = masks[11] - 3
    masks[26] = masks[21] - 3
    field = np.empty((len(x), len(depth), len(z)), dtype="float32")
    keys = sorted(masks)
    for i, level in enumerate(depth):
        high = np.clip(np.searchsorted(keys, level), 1, len(keys) - 1)
        start, stop = keys[high - 1], keys[high]
        weight = np.clip((level - start) / (stop - start), 0, 1)
        field[:, i, :] = (1 - weight) * masks[start] + weight * masks[stop]
    field = gaussian_filter(field, sigma=1.3)
    # Mid-level horseshoe opens posteriorly. The distal anterior extension
    # divides the skeletal muscle there, leaving one slip on either side.
    mid, distal = (int(np.argmin(abs(depth - d))) for d in (18, 21))
    xm, zm = (int(np.argmin(abs(grid))) for grid in (x, z))
    assert field[xm, mid, zm] < 0 and field[xm, mid, -1] < 0
    assert field[xm, mid].max() > 0 and field[xm, distal].max() < 0
    vertices, faces, _, _ = marching_cubes(field, 0, spacing=(STEP,) * 3, allow_degenerate=False)
    vertices[:, 1] *= -1  # Depth is inferior; glTF y is superior.
    vertices *= 0.001
    mesh = trimesh.Trimesh(vertices=vertices, faces=faces, process=True)
    major = max(mesh.split(only_watertight=False), key=lambda part: len(part.faces))
    if len(major.faces) < len(mesh.faces) * .97 or not major.is_watertight:
        raise ValueError("Reconstruction is disconnected or has an open boundary")
    major.fix_normals()
    major.apply_translation(-major.bounds.mean(axis=0))
    major.visual = trimesh.visual.TextureVisuals(
        material=trimesh.visual.material.PBRMaterial(
            name="Female striated external urethral sphincter proper",
            baseColorFactor=[197, 109, 83, 255], roughnessFactor=0.72, metallicFactor=0,
        ),
    )
    study = trimesh.Scene(major, base_frame="Study")
    study.metadata = {"source": SOURCE, "license": "CC BY 4.0", "kind": "Osteon teaching schematic"}
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_bytes(study.export(file_type="glb", include_normals=True))
    print(f"{len(major.faces)} triangles, closed surface, extent {major.extents * 1000} mm")


if __name__ == "__main__":
    main()
