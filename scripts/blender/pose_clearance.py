"""Bake localized, attachment-aware pose corrections for the study rig."""

import math
from collections import defaultdict

import bpy
from mathutils import Matrix, Quaternion, Vector
from mathutils.bvhtree import BVHTree


# Posed-space millimeters, measured on the left specimen and mirrored on the
# right. The lateral fold rides over the scapula, while the more medial sheet
# stays superficial to the clavicle. See Minelli et al. (PMCID PMC10702465).
# Each field is (center, spread, displacement) in Blender coordinates.
PLATYSMA_RAISE = (
    (30, (((121.56,26.25,1419.12), (33,23,30), (0,9.1,14)),
          ((58.18,-32.47,1413.90), (33,23,30), (2.4,-8.5,1.25)))),
    (40, (((120.83,28.25,1421.93), (17,14,16), (0,6.5,10)),
          ((58.18,-32.47,1413.90), (22,19,21), (4.2,-14,2.1)))),
    (48, (((120.83,28.25,1421.93), (33,23,30), (0,12.35,19)),
          ((58,-34,1419), (22,18,24), (2.4,-9,1.2)))),
    (56, (((117.43,34.28,1423.43), (33,23,30), (0,12.35,19)),
          ((54,-31,1419), (26,23,28), (.8,-6,.9)))),
    (60, (((119,33,1424), (33,23,30), (0,11.7,18.5)),
          ((51.25,-34.2,1418.68), (33,23,30), (2.2,-4,0)))),
    (64, (((45.39,-35.58,1421.36), (17,14,16), (0,-4,.6)),)),
    (72, (((45.39,-35.58,1421.36), (17,14,16), (0,-4,.6)),)),
    (81, (((51.8,-32.55,1425.07), (33,23,30), (2.2,-4,0)),)),
    (90, (((43.44,-33.14,1426.44), (17,14,16), (3.85,-7,0)),)),
)


def from_web(point):
    return Vector((point[0], -point[2], point[1]))


def axis_value(values, key):
    joint, axis = key
    return values.get(joint, {}).get(axis, 0.)


def apply_sample(rig, joints, nodes, sample):
    """Evaluate the same axes and shared shoulder elevation as the viewer."""
    for bone in rig.pose.bones:
        bone.rotation_mode = 'QUATERNION'
        bone.rotation_quaternion = Quaternion()
        bone.location = (0, 0, 0)

    def rotate(identifier, axis, degrees):
        bone = rig.pose.bones[nodes[identifier]['name']]
        local = bone.bone.matrix_local.to_quaternion().inverted() @ from_web(axis)
        bone.rotation_quaternion = bone.rotation_quaternion @ Quaternion(local, math.radians(degrees))

    for joint in joints:
        identifier = joint['id']
        for axis in joint['axes']:
            degrees = axis_value(sample, (identifier, axis['id']))
            vector = axis.get('vector')
            if not degrees or not vector:
                continue
            if axis.get('relativeTo'):
                raise ValueError('Clearance recipes require a fixed-axis sample')
            if joint.get('distribute'):
                handles = joint['distribute']
                shares = joint.get('axisWeights', {}).get(axis['id'], [1/len(handles)] * len(handles))
                for handle, share in zip(handles, shares):
                    rotate(handle, vector, degrees * share)
            else:
                if identifier.endswith('-shoulder') and axis['id'] in ('abduction','scaption'):
                    low, high = joint.get('scapularShare', [1/3, 1/3])
                    girdle = degrees * (low + (high-low) * min(1, max(0, degrees/90)))
                    rotate(joint['side']+'-scapula', vector, girdle)
                    degrees -= girdle
                rotate(identifier, vector, degrees)
        rule = joint.get('unlockedRotation')
        if rule:
            t = min(1, max(0, axis_value(sample,(identifier,'flexion'))/rule['endsAt']))
            rotate(identifier, rule['axis'], rule['degrees'] * t*t*(3-2*t))
    for side in ('left','right'):
        rotate(side+'-patella', [1,0,0], axis_value(sample,(side+'-knee','flexion'))*.55)
    bpy.context.view_layer.update()


def posed_geometry(obj, depsgraph):
    evaluated = obj.evaluated_get(depsgraph)
    mesh = evaluated.data
    mesh.calc_loop_triangles()
    world = evaluated.matrix_world
    return [world @ v.co for v in mesh.vertices], [tuple(t.vertices) for t in mesh.loop_triangles]


def inside(surface, point):
    # Two rays reduce edge and vertex parity ambiguities at attachment seams.
    for direction in (Vector((.891,.31,.79)).normalized(),Vector((-.414,.849,.30)).normalized()):
        origin = point
        intersections = 0
        for _ in range(48):
            hit, _, _, _ = surface.ray_cast(origin,direction,.7)
            if hit is None:
                break
            origin = hit + direction*.000004
            intersections += 1
        if intersections % 2 != 1:
            return False
    return True


def neighboring_vertices(mesh):
    # glTF may split the same geometric vertex at a shading seam. Treat its
    # copies as one node for the displacement while retaining the source mesh.
    representative = {}
    membership = [representative.setdefault(tuple(round(c*120000) for c in v.co), v.index)
                  for v in mesh.vertices]
    neighbors = defaultdict(set)
    for edge in mesh.edges:
        a,b = (membership[i] for i in edge.vertices)
        if a != b:
            neighbors[a].add(b)
            neighbors[b].add(a)
    return membership, neighbors


def fit_displacements(obj, points, faces, colliders, project_crossings=False):
    membership, neighbors = neighboring_vertices(obj.data)
    strongest = {}
    rest = [obj.matrix_world @ vertex.co for vertex in obj.data.vertices]
    actor_surface = BVHTree.FromPolygons(points, faces, all_triangles=True) if project_crossings else None
    for surface, bounds, preferred, corridor in colliders:
        lo, hi = bounds
        def escape(p, reference):
            if not corridor(reference) or not all(lo[i]-.0008 <= p[i] <= hi[i]+.0008 for i in range(3)):
                return None
            q, normal, _, distance = surface.find_nearest(p)
            if q is None or distance < .00008 or (p-q).dot(normal) >= 0 or not inside(surface,p):
                return None
            # Use the anatomical side when the shortest direction could route
            # a crossing to the opposite side of a bone.
            if normal.dot(preferred) < .35:
                start = p + preferred*.035
                hit, _, _, _ = surface.ray_cast(start,-preferred,.035)
                if hit is None:
                    return None
                delta = hit - p + preferred*.001
            else:
                delta = q - p + normal*.001
            return delta if delta.length < .037 else None

        def record(index, delta):
            identifier = membership[index]
            if delta is not None and delta.length > strongest.get(identifier,Vector()).length:
                strongest[identifier] = delta

        if actor_surface:
            patch = {i for face,_ in actor_surface.overlap(surface) for i in faces[face]}
            for index in patch:
                if not corridor(rest[index]):
                    continue
                point=points[index]
                q,_,_,distance=surface.find_nearest(point)
                if q is None or distance>.010:
                    continue
                # Adjacent triangle corners can straddle a bone even when the
                # individual vertices stay outside. Keep that patch on the
                # same anatomical side of the collider.
                origin=point+preferred*.029
                hit,_,_,_=surface.ray_cast(origin,-preferred,.030)
                if hit is not None:
                    delta=hit-point+preferred*.0014
                    if .00005 < delta.dot(preferred) < .029:
                        record(index,delta)

        for index, p in enumerate(points):
            record(index, escape(p, rest[index]))
        # Triangle centroids catch crossings between vertex samples, including
        # the low-resolution tendon tips and the broad abdominal sheets.
        for a,b,c in faces:
            if not any(membership[i] in strongest for i in (a,b,c)):
                delta = escape((points[a]+points[b]+points[c])/3, (rest[a]+rest[b]+rest[c])/3)
                if delta is not None:
                    for index in (a,b,c):
                        record(index,delta)

    offsets = strongest.copy()
    for _ in range(6):
        expanded = offsets.copy()
        for identifier in offsets.keys() | {j for i in offsets for j in neighbors[i]}:
            if identifier in strongest:
                continue
            adjacent = neighbors[identifier]
            if adjacent:
                expanded[identifier] = sum((offsets.get(j,Vector()) for j in adjacent),Vector()) * (.91/len(adjacent))
        offsets = expanded
    return [offsets.get(i,Vector()) for i in membership]


def bake_shape(obj, rig, deltas, name):
    if not any(delta.length>.00005 for delta in deltas):
        return False
    if not obj.data.shape_keys:
        obj.shape_key_add(name='Basis',from_mix=False)
    key = obj.shape_key_add(name=name,from_mix=False)
    inverse_world = obj.matrix_world.inverted().to_3x3()
    matrices = {}
    for group in obj.vertex_groups:
        bone = rig.pose.bones[group.name]
        matrices[group.index] = (rig.matrix_world @ bone.matrix
                                 @ bone.bone.matrix_local.inverted()
                                 @ rig.matrix_world.inverted()).to_3x3()
    for vertex,delta in zip(obj.data.vertices,deltas):
        if delta.length < .00003:
            continue
        blend = Matrix(((0,0,0),(0,0,0),(0,0,0)))
        for influence in vertex.groups:
            blend += matrices[influence.group] * influence.weight
        key.data[vertex.index].co = vertex.co + inverse_world @ blend.inverted_safe() @ delta
    key.value=0
    return True


def shoulder_sheet_delta(point, fields, sign):
    # Fade toward the jaw so the lower-face attachments keep their own motion.
    blend = min(1., max(0., (1505 - point.z * 1000) / 30))
    blend *= blend * (3 - 2 * blend)
    coordinates = (sign * point.x * 1000, point.y * 1000, point.z * 1000)
    result = Vector()
    for center, spread, displacement in fields:
        squared = sum(((c - anchor) / width) ** 2
                      for c, anchor, width in zip(coordinates, center, spread))
        result += Vector((sign * displacement[0], *displacement[1:])) * math.exp(-.5 * squared)
    return result * (blend * .001)


def bake_shoulder_clearance(rig, joints, nodes, actor, side, suffix, sign):
    shoulder = side + '-shoulder'
    same_plane = [
        (shoulder,'horizontal',25,10), (shoulder,'horizontal',-24,-10),
        (shoulder,'flexion',45,15), (shoulder,'flexion',-20,-10),
        (shoulder,'rotation',30,10), (shoulder,'rotation',-30,-10),
        (shoulder,'scaption',20,5),
    ]
    for index, (angle, fields) in enumerate(PLATYSMA_RAISE):
        previous = PLATYSMA_RAISE[index-1][0] if index else 16
        ramps = [(shoulder, 'abduction', previous, angle), *same_plane]
        if index + 1 < len(PLATYSMA_RAISE):
            ramps.append((shoulder, 'abduction', PLATYSMA_RAISE[index+1][0], angle))
        apply_sample(rig, joints, nodes, {shoulder: {'abduction': angle}})
        points, _ = posed_geometry(actor, bpy.context.evaluated_depsgraph_get())
        delta = [shoulder_sheet_delta(point, fields, sign) for point in points]
        name = f'ClearancePlatysmaRaise{angle}{suffix.upper()}'
        if bake_shape(actor, rig, delta, name):
            yield {'target': name, 'ramps': ramps, 'surfaces': [actor['muscleId']]}


def bake_clearance(rig, joints, nodes, bones, muscles):
    """Author corrections from fitted asset surfaces and transport them by skinning."""
    rules = []
    for side,suffix,sign in (('left','l',1),('right','r',-1)):
        hip,knee,forearm,wrist=(side+'-'+x for x in ('hip','knee','forearm','wrist'))
        muscle=lambda name: muscles['muscle-'+name+'-'+suffix]
        skeletal=lambda name: bones[name+'.'+suffix]
        all_vertices=lambda _:True
        # These fits were sampled in the sagittal plane. Release them before
        # substantial hip rotation so they do not push tissue across the leg.
        near_sagittal=[(hip,'rotation',15,5),(hip,'rotation',-15,-5)]
        thigh_pairs=[
            ('sartorius-muscle',skeletal('Femur'),hip,(0,0,1),all_vertices),
            ('sartorius-muscle',muscle('iliacus-muscle'),None,(sign,0,.55),all_vertices),
            ('rectus-femoris-muscle',skeletal('Femur'),hip,(0,0,1),all_vertices),
            ('long-head-of-biceps-femoris',skeletal('Femur'),hip,(0,0,-1),all_vertices),
        ]
        abdominal_pairs=[
            ('internal-abdominal-oblique-muscle',skeletal('Femur'),hip,(sign,0,.7),all_vertices),
            ('transversus-abdominis-muscle',skeletal('Femur'),hip,(sign,0,.7),all_vertices),
        ]
        fingers={joint['id']:{axis['id']:axis['max'] for axis in joint['axes']}
                 for joint in joints if joint['id'].startswith(side+'-')
                 and any(digit in joint['id'] for digit in ('thumb','index','middle','ring','little'))}
        recipes = [
            ('HipFlexionMid',[(hip,'flexion',29,66),(hip,'flexion',85,66),*near_sagittal],
             {hip:{'flexion':66},knee:{'flexion':66},'trunk':{'flexion':19.4}},thigh_pairs),
            ('HipFlexion',[(hip,'flexion',66,85),*near_sagittal],
             {hip:{'flexion':85},knee:{'flexion':85},'trunk':{'flexion':25}},thigh_pairs),
            ('AbdominalFlexionMid',[(hip,'flexion',29,66),(hip,'flexion',85,66),('trunk','flexion',8,19.4)],
             {hip:{'flexion':66},knee:{'flexion':66},'trunk':{'flexion':19.4}},abdominal_pairs),
            ('AbdominalFlexion',[(hip,'flexion',66,85),('trunk','flexion',12,25)],
             {hip:{'flexion':85},knee:{'flexion':85},'trunk':{'flexion':25}},abdominal_pairs),
            ('KneeFlexion',[(knee,'flexion',32,85),*near_sagittal],{knee:{'flexion':85}},
             [('lateral-head-of-gastrocnemius',skeletal('Tibia'),knee,(0,0,-1),all_vertices)]),
            ('ForearmPronation',[(forearm,'pronation',24,60)],{forearm:{'pronation':60}},
             [('flexor-carpi-radialis',muscle('flexor-digitorum-profundus'),forearm,(0,0,1),all_vertices),
              ('humero-ulnar-head-of-flexor-digitorum-superficialis',skeletal('Ulna'),side+'-elbow',(0,0,1),all_vertices)]),
            ('WristFlexion',[(wrist,'flexion',18,45),(forearm,'pronation',20,60)],
             {**fingers,forearm:{'pronation':60},wrist:{'flexion':45,'deviation':18}},
             [('flexor-pollicis-longus',skeletal('Scaphoid bone'),wrist,(0,0,1),all_vertices),
              ('flexor-pollicis-longus',skeletal('Trapezium bone'),wrist,(0,0,1),all_vertices)]),
        ]
        for label, ramps, sample, pairs in recipes:
            apply_sample(rig,joints,nodes,sample)
            depsgraph=bpy.context.evaluated_depsgraph_get()
            by_actor=defaultdict(list)
            for actor,collider,driver,direction,corridor in pairs:
                points,triangles=posed_geometry(collider,depsgraph)
                target=BVHTree.FromPolygons(points,triangles,all_triangles=True)
                bounds=[[calc(p[i] for p in points) for i in range(3)] for calc in (min,max)]
                preferred=from_web(direction)
                if driver:
                    bone=rig.pose.bones[nodes[driver]['name']]
                    preferred=(bone.matrix.to_quaternion() @ bone.bone.matrix_local.to_quaternion().inverted()) @ preferred
                by_actor[actor].append((target,bounds,preferred.normalized(),corridor))
            name=f'Clearance{label}{suffix.upper()}'
            fitted=[]
            for actor,colliders in by_actor.items():
                obj=muscle(actor)
                p,faces=posed_geometry(obj,depsgraph)
                is_thigh=label.startswith(('HipFlexion','AbdominalFlexion'))
                delta=fit_displacements(obj,p,faces,colliders,is_thigh)
                if is_thigh:
                    moved=[point+offset for point,offset in zip(p,delta)]
                    retry=fit_displacements(obj,moved,faces,colliders,True)
                    delta=[first+second for first,second in zip(delta,retry)]
                if bake_shape(obj,rig,delta,name):
                    fitted.append(obj['muscleId'])
            if fitted:
                rules.append({'target':name,'ramps':ramps,'surfaces':fitted})
                print('CLEARANCE',name,len(fitted),flush=True)
        rules.extend(bake_shoulder_clearance(rig, joints, nodes, muscle('platysma'), side, suffix, sign))
    apply_sample(rig,joints,nodes,{})
    return rules
