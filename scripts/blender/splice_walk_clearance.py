"""Preserve unrelated walking geometry when installing reviewed local fits."""

from copy import deepcopy

from atlas_shoulder_clearance import read_glb, write_glb


def replace_walk_parts(source, fitted, identities):
    original, views = read_glb(source)
    donor, payloads = read_glb(fitted)

    def skin_contract(doc, payload, node):
        skin = doc['skins'][node['skin']]
        names = [doc['nodes'][index]['name'] for index in skin['joints']]
        inverses = doc['accessors'][skin['inverseBindMatrices']]
        start = inverses.get('byteOffset', 0)
        matrices = payload[inverses['bufferView']][start:start + inverses['count'] * 64]
        return names, matrices

    def append_view(index):
        view = donor['bufferViews'][index].copy()
        assert view['buffer'] == 0 and not view.get('extensions')
        original['bufferViews'].append(view)
        views.append(payloads[index])
        return len(views) - 1

    def append_accessor(index):
        accessor = deepcopy(donor['accessors'][index])
        if 'bufferView' in accessor:
            accessor['bufferView'] = append_view(accessor['bufferView'])
        if 'sparse' in accessor:
            for item in accessor['sparse']['indices'], accessor['sparse']['values']:
                item['bufferView'] = append_view(item['bufferView'])
        original['accessors'].append(accessor)
        return len(original['accessors']) - 1

    candidates = {node.get('extras', {}).get('muscleId'): node for node in donor['nodes'] if 'mesh' in node}
    found = set()
    for node in original['nodes']:
        identity = node.get('extras', {}).get('muscleId')
        if identity not in identities:
            continue
        replacement = candidates[identity]
        for field in ('scale', 'matrix', 'translation', 'rotation'):
            assert node.get(field) == replacement.get(field), (identity, field)
        assert skin_contract(original, views, node) == skin_contract(donor, payloads, replacement), identity
        mesh = original['meshes'][node['mesh']]
        edited = donor['meshes'][replacement['mesh']]
        old, = mesh['primitives']
        new, = edited['primitives']
        assert set(old['attributes']) == set(new['attributes']), identity
        assert old.get('mode', 4) == new.get('mode', 4) == 4
        assert original['accessors'][old['indices']]['count'] == donor['accessors'][new['indices']]['count']
        old['attributes'] = {kind: append_accessor(index) for kind, index in new['attributes'].items()}
        old['indices'] = append_accessor(new['indices'])
        extension = deepcopy(new['extensions']['KHR_draco_mesh_compression'])
        extension['bufferView'] = append_view(extension['bufferView'])
        old['extensions']['KHR_draco_mesh_compression'] = extension
        if new.get('targets'):
            old['targets'] = [{kind: append_accessor(index) for kind, index in target.items()}
                              for target in new['targets']]
            mesh['weights'] = edited['weights']
            mesh.setdefault('extras', {})['targetNames'] = edited['extras']['targetNames']
            node['extras']['walkClearance'] = replacement['extras']['walkClearance']
        found.add(identity)
    assert found == set(identities)
    write_glb(fitted, original, views)
