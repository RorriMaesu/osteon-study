"""Blender 4.5 teaching volumes. Export only to a fresh directory after backing up existing assets.

blender -b --factory-startup --python-exit-code 1 -P scripts/build-ap3-fluid-models.py -- OUTPUT
Append --verify after OUTPUT to check previously exported GLBs without writing them.
The model authoring coordinates below are (left/right, superior, anterior).
"""
from pathlib import Path
import sys

import bpy
from mathutils import Vector
from mathutils.bvhtree import BVHTree

ROOT = Path(__file__).resolve().parents[1]
OUT = Path(sys.argv[sys.argv.index('--') + 1]).resolve()
OUT.mkdir(parents=True, exist_ok=True)
FILES = ['fluid-spaces', 'placental-exchange', 'blood-compartment']
CHECK = '--verify' in sys.argv[sys.argv.index('--') + 2:]
if not CHECK and any((OUT / (name + '.glb')).exists() for name in FILES):
    raise FileExistsError("Use a fresh output directory to preserve existing models.")


def xyz(point):
    x, y, z = point
    return Vector((x, -z, y))


def select(obj):
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj


def bake(obj):
    select(obj)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    return obj


def color(obj, name, hex_color, opacity=1):
    obj.name = name
    obj.data.name = name
    rgb = [int(hex_color[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    linear = [(v / 12.92 if v <= .04045 else ((v + .055) / 1.055) ** 2.4) for v in rgb]
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*linear, opacity)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (*linear, 1)
    bsdf.inputs['Roughness'].default_value = .77
    bsdf.inputs['Alpha'].default_value = opacity
    obj.data.materials.clear()
    obj.data.materials.append(mat)
    return obj


def sphere(point, radii):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=20, location=xyz(point))
    obj = bpy.context.object
    obj.scale = (radii[0], radii[2], radii[1])
    for poly in obj.data.polygons:
        poly.use_smooth = True
    return bake(obj)


def tube(points, radius):
    curve = bpy.data.curves.new('path', 'CURVE')
    curve.dimensions = '3D'
    curve.resolution_u = 12
    curve.bevel_depth = radius
    curve.bevel_resolution = 4
    curve.use_fill_caps = True
    spline = curve.splines.new('BEZIER')
    spline.bezier_points.add(len(points) - 1)
    for point, coords in zip(spline.bezier_points, points):
        point.co = xyz(coords)
        point.handle_left_type = point.handle_right_type = 'AUTO'
    obj = bpy.data.objects.new('path', curve)
    bpy.context.collection.objects.link(obj)
    select(obj)
    bpy.ops.object.convert(target='MESH')
    return bpy.context.object


def block(center, dims, bevel):
    bpy.ops.mesh.primitive_cube_add(size=1, location=xyz(center))
    obj = bpy.context.object
    obj.scale = (dims[0], dims[2], dims[1])
    bake(obj)
    mod = obj.modifiers.new('Sampling window edges', 'BEVEL')
    mod.width = bevel
    mod.segments = 4
    bpy.ops.object.modifier_apply(modifier=mod.name)
    return obj


def joined(pieces):
    select(pieces[0])
    for piece in pieces[1:]:
        piece.select_set(True)
    bpy.ops.object.join()
    return bake(pieces[0])


def subtract(region, solid):
    select(region)
    mod = region.modifiers.new('Exclude solid tissue', 'BOOLEAN')
    mod.operation = 'DIFFERENCE'
    mod.solver = 'EXACT'
    mod.object = solid
    bpy.ops.object.modifier_apply(modifier=mod.name)
    if not len(region.data.polygons):
        raise ValueError(f'Empty compartment after subtracting {solid.name}')
    region.data.materials.clear()


def validate_inside(shell, contents, *, outside=False):
    """Check every enclosed vertex against its nearest point on the closed, outward-facing surface."""
    deps = bpy.context.evaluated_depsgraph_get()
    bvh = BVHTree.FromObject(shell, deps)
    for obj in contents:
        violations = []
        for vert in obj.data.vertices:
            loc = shell.matrix_world.inverted() @ obj.matrix_world @ vert.co
            near, normal, _, distance = bvh.find_nearest(loc)
            signed = (loc - near).dot(normal)
            if (signed < -.0001 if outside else signed > .0001):
                violations.append(round(distance, 5))
        relation = 'outside' if outside else 'inside'
        if violations:
            raise ValueError(f'{obj.name}: {len(violations)} vertices fail {relation} {shell.name}, worst {max(violations)}')
        print(f'CHECKED {obj.name} {relation} {shell.name}: {len(obj.data.vertices)} vertices')


def export(name):
    bpy.ops.export_scene.gltf(filepath=str(OUT / (name + '.glb')), export_format='GLB',
                              export_yup=True, export_animations=False, export_texcoords=False)
    bpy.ops.wm.read_factory_settings(use_empty=True)


if CHECK:
    # Reload the shipped GLBs, including all exported node transforms and triangulation.
    for specimen in FILES:
        bpy.ops.wm.read_factory_settings(use_empty=True)
        bpy.ops.import_scene.gltf(filepath=str(OUT / (specimen + '.glb')), merge_vertices=True)
        meshes = {o.name:o for o in bpy.context.scene.objects if o.type=='MESH'}
        if specimen == 'fluid-spaces':
            validate_inside(meshes['capillary_wall'], [meshes['plasma'],meshes['red_blood_cells']])
            validate_inside(meshes['plasma'], [meshes['red_blood_cells']])
            validate_inside(meshes['cell_membrane'], [meshes['intracellular_fluid']])
            validate_inside(meshes['interstitial_fluid'], [meshes['red_blood_cells'],meshes['intracellular_fluid']], outside=True)
        if specimen == 'placental-exchange':
            vessels = [meshes[k] for k in ('fetal_arteriole','fetal_capillaries','fetal_venule')]
            validate_inside(meshes['chorionic_villus'], vessels)
            validate_inside(meshes['intervillous_space'], vessels, outside=True)
        if specimen == 'blood-compartment':
            nuclei = [o for k,o in meshes.items() if k.endswith('_nucleus')]
            assert len(nuclei) == 5
            for nucleus in nuclei:
                validate_inside(meshes[nucleus.name.replace('_nucleus','_cytoplasm')], [nucleus])
            validate_inside(meshes['plasma'], nuclei, outside=True)
    sys.exit(0)


bpy.ops.wm.read_factory_settings(use_empty=True)
# Lumen and wall have concentric, separately selectable outer boundaries. The
# cell discs occupy the lumen. An explicit cut in the viewer reveals the inside.
wall = color(tube([(-1.19, -.30, 0), (1.19, -.30, 0)], .211), 'capillary_wall', 'cc747d', .32)
plasma = color(tube([(-1.17, -.30, 0), (1.17, -.30, 0)], .183), 'plasma', 'efbd60', .21)
discs = []
for x, tilt in [(-.89, .06), (-.46, -.14), (0, .14), (.48, -.10), (.90, .16)]:
    disc = sphere((0, 0, 0), (1, 1, 1))
    for vert in disc.data.vertices:
        u, v, w = vert.co
        radius_sq = u * u + w * w
        vert.co = (.115 * u, .085 * v * (.36 + 1.45 * radius_sq), .105 * w)
    disc.rotation_euler.x = .48
    disc.rotation_euler.y = tilt
    disc.location = xyz((x, -.30, 0))
    discs.append(bake(disc))
cells = color(joined(discs), 'red_blood_cells', 'bf354f')
tissue = [(-.67, .31, 0), (0, .40, -.015), (.67, .31, .005)]
membranes = color(joined([sphere(c, (.256,.241,.18)) for c in tissue]), 'cell_membrane', 'bb87be', .4)
icf = color(joined([sphere(c, (.243,.228,.167)) for c in tissue]), 'intracellular_fluid', '6db4c8')
validate_inside(wall, [plasma, cells])
validate_inside(plasma, [cells])
validate_inside(membranes, [icf])
interstitial = block((0,.11,0), (2.20,1.25,.51), .055)
subtract(interstitial, wall)
subtract(interstitial, membranes)
color(interstitial, 'interstitial_fluid', '72b99d', .12)
export('fluid-spaces')

# A Y-shaped stem with continuous tissue across the fork, enlarged in section.
# The capillary path follows the axes of the villous branches in both directions.
stem = tube([(0,1.10,0),(0,.21,0),(0,.06,0)], .183)
arms = [tube([(0,.21,0),(side*.17,.02,0),(side*.44,-.24,0)], .145) for side in [-1,1]]
tips = [sphere((side*.44,-.24,0),(.145,.145,.145)) for side in [-1,1]]
villus = joined([stem, *arms, *tips])
villus.data.remesh_voxel_size = .014
select(villus)
bpy.ops.object.voxel_remesh()
smooth = villus.modifiers.new('Smooth surface of teaching villus', 'SMOOTH')
smooth.iterations = 3
smooth.factor = .6
bpy.ops.object.modifier_apply(modifier=smooth.name)
decimate = villus.modifiers.new('Simplify branching surface', 'DECIMATE')
decimate.ratio = .18
bpy.ops.object.modifier_apply(modifier=decimate.name)
for f in villus.data.polygons:
    f.use_smooth = True
color(villus, 'chorionic_villus', 'f1ab90', .37)
inlet = color(tube([(-.062,1.075,0),(-.058,.48,0),(-.061,.22,0),(-.18,.03,0),(-.40,-.15,0)],.033), 'fetal_arteriole','608dc1')
loop = color(tube([(-.40,-.15,0),(-.46,-.226,0),(-.426,-.279,.024),(-.31,-.165,.035),(-.15,-.037,.04),(-.015,.12,.044),(.12,.018,.035),(.30,-.14,.036),(.447,-.265,.017),(.468,-.220,0),(.40,-.15,0)],.024), 'fetal_capillaries','ca5c76')
outlet = color(tube([(.40,-.15,0),(.19,.035,0),(.063,.22,0),(.058,.47,0),(.061,1.075,0)], .040),'fetal_venule','c44b55')
validate_inside(villus, [inlet,loop,outlet])
bath = block((0,.027,0), (1.46,1.15,.50), .1)
subtract(bath,villus)
color(bath,'intervillous_space','ca8299',.13)
color(tube([(-.54,-1.03,0),(-.48,-.91,.04),(-.58,-.78,.04),(-.53,-.65,0),(-.50,-.527,0)],.060),'maternal_spiral_artery','b54b4d')
color(tube([(.53,-.527,0),(.58,-.71,0),(.63,-1.02,0)],.078),'maternal_vein','5b83a8')
export('placental-exchange')

# Reuse the A&P II formed elements in their original pose. Add one finite,
# selectable sample of the extracellular fluid around their surfaces.
bpy.ops.import_scene.gltf(filepath=str(ROOT/'assets/ap2-blood/formed-elements.glb'), merge_vertices=True)
parts = [o for o in bpy.context.scene.objects if o.type=='MESH']
fluid = block((.10,-.37,0),(8.68,6.08,3.05),.18)
validate_inside(fluid,parts)
for obj in parts:
    if obj.name.endswith('_cytoplasm') or obj.name in ('platelet_fragment','erythrocyte_membrane'):
        subtract(fluid,obj)
color(fluid,'plasma','e6b458',.115)
export('blood-compartment')
