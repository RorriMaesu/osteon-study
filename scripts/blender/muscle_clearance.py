"""Directional clearance for registered, anatomically constrained muscle paths."""

from mathutils.bvhtree import BVHTree


def registered_surface(objects, to_web):
    vertices, triangles = [], []
    for obj in objects:
        offset = len(vertices)
        vertices.extend(to_web(obj.matrix_world @ vertex.co) for vertex in obj.data.vertices)
        obj.data.calc_loop_triangles()
        triangles.extend(tuple(offset + index for index in tri.vertices) for tri in obj.data.loop_triangles)
    return BVHTree.FromPolygons(vertices, triangles, all_triangles=True)


def directional_clearance(surface, point, direction, reach, margin):
    """Measure how far a point must move to clear an approached surface.

    Callers select the local tissue corridor and the anatomical side to clear.
    The ray begins on that side so the result also catches thin crossings.
    """
    origin = point + direction * reach
    hit, _, _, _ = surface.ray_cast(origin, -direction, reach + margin)
    return max(0., (hit - point).dot(direction) + margin) if hit is not None else 0.
