"""Blender 4.5, background mode. Arguments after -- are the directory of verified
original backups, the HRA large-intestine v1.2 GLB, and a new staging directory.
Only the two bowel parts change in the composite files. All other accessors,
transforms, materials, nodes and vertex bytes remain those of the reference.
"""
import hashlib
import json
from pathlib import Path
import struct
import sys

import bmesh
import bpy
import numpy as np

baseline = {
    'distal-colon.glb': '39d7a1b348c99ec21e1b7c37259df5bcf557e106a112941853a7d44f2c69308a',
    'alimentary-tract.glb': '95d82135492d66c9da2d394a59d4e20b9b6f962986cc09de2da90bc3689e6cc9',
    'registered-organs.glb': '8c897a3210a64fd972e9b1c43a45e0f68a339f98a48431bd2a21b397d7ea023e',
}
donor_digest = '84a66fb4e2dd07dffc284435da896284c3bddc5b6eb6f8e2f8c1b9130387b66b'
types = {5121:'<u1',5123:'<u2',5125:'<u4',5126:'<f4'}

def read_glb(path):
    data = path.read_bytes()
    assert data[:4] == b'glTF'
    end = 20 + struct.unpack_from('<I', data, 12)[0]
    return json.loads(data[20:end]), bytearray(data[end+8:])

def array(doc, binary, index):
    acc = doc['accessors'][index]
    view = doc['bufferViews'][acc['bufferView']]
    base = view.get('byteOffset',0) + acc.get('byteOffset',0)
    width = {'SCALAR':1,'VEC3':3}[acc['type']]
    dtype = np.dtype(types[acc['componentType']])
    stride = view.get('byteStride',width*dtype.itemsize)
    return np.ndarray((acc['count'],width),dtype,buffer=binary,offset=base,strides=(stride,dtype.itemsize)).copy()

def append_array(doc,binary,values,kind,component):
    values = np.ascontiguousarray(values,dtype=types[component])
    binary.extend(bytes((-len(binary))%4))
    view = {'buffer':0,'byteOffset':len(binary),'byteLength':values.nbytes,'target':34963 if kind=='SCALAR' else 34962}
    doc['bufferViews'].append(view)
    binary.extend(values.tobytes())
    doc['accessors'].append({'bufferView':len(doc['bufferViews'])-1,'componentType':component,
        'count':len(values),'type':kind,'min':values.min(axis=0).flatten().tolist(),'max':values.max(axis=0).flatten().tolist()})
    return len(doc['accessors'])-1

def primitive(doc,binary,positions,normals,faces):
    return {'attributes':{'POSITION':append_array(doc,binary,positions,'VEC3',5126),
                          'NORMAL':append_array(doc,binary,normals,'VEC3',5126)},
            'indices':append_array(doc,binary,faces.reshape(-1,1),'SCALAR',5123)}

def write_glb(doc,binary,path):
    binary.extend(bytes((-len(binary))%4))
    doc['buffers'][0]['byteLength'] = len(binary)
    meta = json.dumps(doc,separators=(',',':')).encode()
    meta += b' '*((-len(meta))%4)
    with path.open('xb') as f:
        f.write(struct.pack('<4sIIII',b'glTF',2,28+len(meta)+len(binary),len(meta),0x4E4F534A))
        f.write(meta)
        f.write(struct.pack('<I4s',len(binary),b'BIN\0'))
        f.write(binary)

def replace(doc,name,p):
    node = next((n for n in doc['nodes'] if n['name']==name),None)
    if node is None:
        node = {'name':name,'mesh':len(doc['meshes'])}
        doc['scenes'][doc['scene']]['nodes'].append(len(doc['nodes']))
        doc['nodes'].append(node)
        doc['meshes'].append({'name':name,'primitives':[p]})
    else:
        doc['meshes'][node['mesh']]['primitives'] = [p]

def split_left_bowel(source,out,height):
    doc,binary = read_glb(source)
    parent = next(n for n in doc['nodes'] if n['name']=='descending_colon')
    assert set(parent)=={'name','mesh'}
    orig = doc['meshes'][parent['mesh']]['primitives'][0]
    v = array(doc,binary,orig['attributes']['POSITION'])
    f = array(doc,binary,orig['indices']).reshape(-1,3)
    mesh = bpy.data.meshes.new('native left bowel')
    mesh.from_pydata(v.tolist(),[],f.tolist())
    for name,distal in [('descending_colon',False),('sigmoid_colon',True)]:
        bm = bmesh.new()
        bm.from_mesh(mesh)
        bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=1e-8)
        # Coordinates are still native glTF metres, with Y superior.
        bmesh.ops.bisect_plane(bm,geom=list(bm.verts)+list(bm.edges)+list(bm.faces),
            plane_co=(0,height,0),plane_no=(0,1,0),dist=1e-8,clear_outer=distal,clear_inner=not distal)
        bmesh.ops.triangulate(bm,faces=list(bm.faces))
        bm.verts.index_update()
        bm.normal_update()
        vv=np.array([tuple(x.co) for x in bm.verts])
        nn=np.array([tuple(x.normal) for x in bm.verts])
        ff=np.array([[v.index for v in face.verts] for face in bm.faces])
        replace(doc,name,primitive(doc,binary,vv,nn,ff))
        bm.free()
    bpy.data.meshes.remove(mesh)
    write_glb(doc,binary,out)

def reference(source,out):
    assert hashlib.sha256(source.read_bytes()).hexdigest()==donor_digest
    donor,data = read_glb(source)
    doc={'asset':{'version':'2.0','copyright':'Human Reference Atlas, CC BY 4.0; Browne and Schlehlein, DOI 10.48539/HBM334.LVTH.937'},
         'scene':0,'scenes':[{'nodes':[]}],'nodes':[],'meshes':[],'buffers':[{}],'bufferViews':[],'accessors':[]}
    binary=bytearray()
    for name in ['descending_colon','sigmoid_colon','rectum']:
        node=next(n for n in donor['nodes'] if n.get('name')=='VH_M_'+name)
        p=donor['meshes'][node['mesh']]['primitives'][0]
        assert not any(key in n for n in (node,donor['nodes'][0]) for key in ['translation','matrix','rotation','scale'])
        pp=primitive(doc,binary,array(donor,data,p['attributes']['POSITION']),array(donor,data,p['attributes']['NORMAL']),array(donor,data,p['indices']))
        replace(doc,name,pp)
    write_glb(doc,binary,out)

if __name__ == '__main__':
    original,hra,output=map(Path,sys.argv[sys.argv.index('--')+1:])
    for filename,digest in baseline.items():
        assert hashlib.sha256((original/filename).read_bytes()).hexdigest()==digest,filename
    output.mkdir(parents=True,exist_ok=False)
    reference(hra,output/'distal-colon.glb')
    # The native left bowel curves medially into the pelvis below these points.
    for name,height in [('registered-organs.glb',.960),('alimentary-tract.glb',.905)]:
        split_left_bowel(original/name,output/name,height)
