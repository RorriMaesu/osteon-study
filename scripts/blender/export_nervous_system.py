"""Export a separate, registered nervous-system project and regional web layers."""
import hashlib
import json
import math
import re
import shutil
import struct
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

import bpy
from mathutils import Vector

root = Path(sys.argv[sys.argv.index('--')+1]).resolve()
repo = root/'outputs/osteon-study'
project = root/'outputs/osteon-models/nervous-system.blend'
work = root/'work/nervous-system'
source = Path(bpy.data.filepath)
source_sha = '9f08a17ea0115fed80b2a73ecdf0a1bc2ab2f6956f37c593ce23d513ea35afcd'
buckets = ('overview', 'head', 'spine', 'trunk', 'upper-limb', 'lower-limb')
outputs = {k:repo/f'assets/nerves-{k}.glb' for k in buckets}
manifest = repo/'src/nerve-models.json'

def sha(path):
    with path.open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()

if sha(source) != source_sha:
    raise RuntimeError('Input is not the pinned Z-Anatomy project')
snapshot = Path((work/'baseline-backup.txt').read_text())
baseline = json.loads((snapshot/'manifest.json').read_text())
for rec in baseline['files']:
    if not (snapshot/rec['file']).is_file() or sha(Path(rec['original'])) != rec['sha256']:
        raise RuntimeError(f'Baseline missing or original changed: {rec["original"]}')

old_outputs = [path for path in [project, manifest, *outputs.values()] if path.exists()]
if old_outputs:
    stamp = datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S-%f')
    backup = root/'outputs/model-backups'/f'nerves-{stamp}'
    backup.mkdir(parents=True)
    saved = []
    for path in old_outputs:
        copy = backup/path.name
        shutil.copy2(path,copy)
        digest = sha(path)
        if sha(copy) != digest:
            raise RuntimeError(f'Backup failed: {path}')
        saved.append({'original':str(path),'file':copy.name,'sha256':digest})
    head = subprocess.check_output(['git','rev-parse','HEAD'],cwd=repo,text=True).strip()
    (backup/'manifest.json').write_text(json.dumps({'git':head,'files':saved},indent=2),encoding='utf-8')
    print('VERIFIED_PRE_EXPORT',backup,flush=True)

def ancestry(obj):
    path=[]
    while obj.parent:
        obj=obj.parent
        path.append(obj.name)
    return path

def bare(name):
    return re.sub(r'\.[lr]$','',name)

def world_bounds(mesh):
    return [[round(f(v.co[i] for v in mesh.vertices),7) for i in range(3)] for f in (min,max)]

def web(co):
    return [round(co[0],7),round(co[2],7),round(-co[1],7)]

cranial = re.compile(r'\(([IVX]+)\)$')
major_pns = re.compile(r'^(Median|Ulnar|Radial|Musculocutaneous|Axillary|Femoral|Sciatic|Obturator|Tibial|Common fibular|Superficial fibular|Deep fibular|Sural|Saphenous|Pudendal|Intercostal|Phrenic) nerves?$|^Cauda equina$|^Sympathetic trunk$|^Roots of brachial plexus$')
outer_brain = {'Frontal lobe','Parietal lobe','Occipital lobe','Temporal lobe','Limbic lobe'}

def classification(name, path, bounds):
    title=bare(name)
    central='Central nervous system.g' in path
    lo,hi=bounds
    if central:
        if 'Spinal cord.g' in path:
            return 'central','spine',['neck','thoracic-spine','lower-back']
        return 'central','head',['skull']
    if 'autonomic division' in ' '.join(path).lower() or re.search(r'^Sympathetic',name):
        return 'autonomic','trunk',['neck','thoracic-spine','thorax','lower-back','pelvis']
    if cranial.search(title) or 'Cranial nerves.g' in path:
        areas=['skull']
        if lo[2]<1.52:areas.append('neck')
        if lo[2]<1.34:areas.append('thorax')
        if lo[2]<1.17:areas.extend(['thoracic-spine','lower-back'])
        return 'cranial','head',areas
    if 'brachial plexus' in ' '.join(path).lower() or re.search(r'upper subscapular|superior subscapular|phrenic|cord of brachial|root of median|posterior brachial cutaneous',name,re.I):
        areas=[]
        if lo[2]<1.47 and hi[2]>1.37:areas.append('shoulder')
        if lo[2]<1.40 and hi[2]>1.08:areas.append('arm')
        if lo[2]<1.12 and hi[2]>.85:areas.append('forearm')
        if lo[2]<.89:areas.append('hand')
        if hi[2]>1.44:areas.append('neck')
        if re.search(r'phrenic|thoracic|pectoral',title,re.I):areas.append('thorax')
        return 'peripheral','upper-limb',areas or ['shoulder']
    if 'thoracic nerves.g' in [p.lower() for p in path]:
        return 'peripheral','trunk',['thorax','thoracic-spine']
    if re.search(r'lumbar|sacral plexus|lower limb', ' '.join(path),re.I):
        areas=[]
        if hi[2]>.79:areas.append('pelvis')
        if lo[2]<.88 and hi[2]>.45:areas.append('thigh')
        if lo[2]<.57 and hi[2]>.34:areas.append('knee')
        if lo[2]<.43 and hi[2]>.055:areas.append('leg')
        if lo[2]<.10:areas.append('foot')
        if hi[2]>1.01:areas.append('lower-back')
        return 'peripheral','lower-limb',areas
    if title=='Cauda equina':
        return 'peripheral','spine',['lower-back','pelvis']
    if re.search(r'spinal nerve|spinal ganglion',title,re.I):
        return 'peripheral','spine',['neck','thoracic-spine','lower-back']
    if lo[2]>1.48:
        return 'cranial','head',['skull','neck']
    return 'peripheral','trunk',['neck','thorax','thoracic-spine','lower-back','pelvis']

def include(obj,path):
    if obj.type not in ('MESH','CURVE') or obj.name.endswith(('.g','.i','.j','.s','.t')):
        return False
    if 'Peripheral nervous system.g' in path:
        return True
    return 'Central nervous system.g' in path and 'Meninges.g' not in path and 'Choroid plexus' not in obj.name

# Stations name the portion of the source route we can inspect. They do not
# extrapolate a missing segment or imply that the whole nerve was reconstructed.
stations={
 'Median nerve':[('Upper arm',1.29),('Elbow',1.10),('Forearm',.98),('Wrist',.849)],
 'Ulnar nerve':[('Upper arm',1.28),('Behind the elbow',1.10),('Forearm',.96),('Distal modeled segment',.881)],
 'Radial nerve':[('Axilla',1.37),('Posterior humerus',1.258),('Elbow region',1.099)],
 'Sciatic nerve':[('Pelvic origin region',.949),('Greater sciatic foramen region',.898),('Posterior thigh',.73),('Distal modeled segment',.55)],
 'Vagus nerve (X)':[('Skull base region',1.56),('Neck',1.48),('Upper chest',1.365),('Distal modeled thoracic segment',1.15)],
 'Tibial nerve':[('Posterior knee',.47),('Calf',.27),('Medial ankle',.075)],
 'Cauda equina':[('Upper lumbar canal',1.125),('Lower lumbar canal',1.015),('Sacral canal',.923)]
}

def curve_stops(obj, matrix, name):
    if obj.type!='CURVE' or bare(name) not in stations:
        return []
    paths=[[matrix@Vector(p.co[:3]) for p in (s.bezier_points if s.type=='BEZIER' else s.points)] for s in obj.data.splines]
    paths=[p for p in paths if len(p)>1]
    if not paths:return []
    path=max(paths,key=lambda pts:sum((a-b).length for a,b in zip(pts,pts[1:])))
    result=[]
    for title,height in stations[bare(name)]:
        points=[a.lerp(b,(height-a.z)/(b.z-a.z)) for a,b in zip(path,path[1:]) if min(a.z,b.z)<=height<=max(a.z,b.z) and abs(a.z-b.z)>1e-6]
        if points:result.append({'name':title,'point':web(points[0])})
    return result if len(result)>1 else []

original_scenes=list(bpy.data.scenes)
deps=bpy.context.evaluated_depsgraph_get()
source_objects=sorted(bpy.data.collections['7: Nervous system & Sense organs'].all_objects,key=lambda o:o.name)
derived=bpy.data.scenes.new('Osteon | Nervous system')
colors={'central':(.56,.32,.64,1),'cranial':(.32,.69,.8,1),'peripheral':(.30,.61,.69,1),'autonomic':(.22,.7,.52,1)}
materials={}
for key,color in colors.items():
    material=bpy.data.materials.new('Nervous system | '+key)
    material.diffuse_color=color
    materials[key]=material
collections={}
for key in buckets[1:]:
    collection=bpy.data.collections.new('Nerves | '+key)
    derived.collection.children.link(collection)
    collections[key]=collection
records=[]
parts={}
manifest_sources={}
seen=set()

def add_mesh(name,mesh,path,stops,provider='z-anatomy',partial=None,origin=None):
    if len(mesh.polygons)<4:
        bpy.data.meshes.remove(mesh)
        return
    if name in seen:
        raise RuntimeError(f'Duplicate anatomy identifier: {name}')
    seen.add(name)
    bounds=world_bounds(mesh)
    category,bucket,areas=classification(name,path,bounds)
    if not areas:raise RuntimeError(f'No study area for {name}')
    short=bare(name).strip()
    side=name[-1] if name.endswith(('.l','.r')) else None
    if name=='Cochlear nerve':side='r'
    if name=='Common plantar digital branches of medial plantar nerve':side='r'
    if short=='White matter of spinal cord':short='Spinal cord · white matter surface'
    if short=='Cochlear nerve' and name.endswith('.l'):short='Cochlear nerve'
    if short.startswith('Spinal ganglion'):short='Dorsal root ganglia'
    if short.endswith('root of spinal nerve'):
        short=short.replace('root of spinal nerve','roots of spinal nerves')
    overview=bool(major_pns.match(short) or cranial.search(short) or (category=='central' and (
        any(key+'.g' in path for key in outer_brain) and re.search(r'gyrus|lobule|lobus|cuneus|pole',short,re.I) and not re.search(r'sulcus|fissure',short,re.I)
        or 'Cerebellum.g' in path and not re.search(r'peduncle',short,re.I)
        or short in ('Pons','Midbrain','Medulla oblongata','Spinal cord · white matter surface'))))
    mesh.materials.clear()
    mesh.materials.append(materials[category])
    for polygon in mesh.polygons:polygon.material_index=0
    obj=bpy.data.objects.new('Nerve | '+name,mesh)
    obj['nerveKey']=name
    obj['nerveCategory']=category
    obj['anatomicalSource']=provider
    if side:obj['anatomicalSide']=side
    if origin:obj['sourceObject']=origin
    collections[bucket].objects.link(obj)
    parts[name]=obj
    records.append({'key':name,'name':short,'side':side,'category':category,'bucket':bucket,'areas':areas,'overview':overview,
                    'provider':provider,'sourceObject':origin or name,'faces':len(mesh.polygons),'bounds':bounds,'stops':stops,
                    'partial':partial,'group':path[0].removesuffix('.g') if path else ''})

for obj in source_objects:
    path=ancestry(obj)
    if not include(obj,path):continue
    ev=obj.evaluated_get(deps)
    em=ev.to_mesh()
    has_faces=em and len(em.polygons)>=4
    if em:ev.to_mesh_clear()
    if not has_faces:continue
    mesh=bpy.data.meshes.new_from_object(ev,depsgraph=deps)
    mesh.transform(ev.matrix_world)
    partial=None
    if bare(obj.name)=='Vagus nerve (X)':partial='Modeled cranial, cervical and thoracic portions. Distal organ pathways are a separate coverage item.'
    if bare(obj.name) in ('Anterior root of spinal nerve','Posterior root of spinal nerve','Spinal ganglion','Intercostal nerves'):
        partial='Several levels share one selectable source object.'
    if bare(obj.name)=='Sympathetic trunk':partial='Cervical and thoracic source extent. Lower sympathetic pathways need additional geometry.'
    add_mesh(obj.name,mesh,path,curve_stops(obj,ev.matrix_world,obj.name),partial=partial)

bpy.context.window.scene=derived
if (repo/'model-sources/nervous-donors.json').exists():
    donor_recipe=json.loads((repo/'model-sources/nervous-donors.json').read_text())
    for donor in donor_recipe['sources']:
        donor_file=work/donor['file']
        if sha(donor_file)!=donor['sha256']:raise RuntimeError('Source checksum mismatch '+donor['file'])
        manifest_sources[donor['id']]={k:donor[k] for k in ('url','sha256','license','credit')}
        known=set(derived.objects)
        bpy.ops.import_scene.gltf(filepath=str(donor_file))
        bpy.context.view_layer.update()
        imported=set(derived.objects)-known
        by_name={o.name:o for o in imported if o.type=='MESH'}
        for spec in donor['objects']:
            key=spec['source']
            original=by_name.get(key) or by_name.get(key+'.001')
            if not original:raise RuntimeError('Missing licensed donor object '+key)
            mesh=original.data.copy()
            mesh.transform(original.matrix_world)
            if donor['id']=='leiden-plexus':
                for v in mesh.vertices:
                    weight=max(0,min(1,(abs(v.co.x)-.035)/.055))
                    v.co.y-=.0042*weight*weight*(3-2*weight)
            add_mesh(spec['key'],mesh,spec['path'],[],donor['id'],spec.get('partial'),origin=key)
        for obj in imported:bpy.data.objects.remove(obj,do_unlink=True)

# Link the exact exported Osteon skeleton as editable inspection context.
known=set(derived.objects)
bpy.ops.import_scene.gltf(filepath=str(repo/'assets/skeleton.glb'))
skeleton=set(derived.objects)-known
context=bpy.data.collections.new('Osteon | Skeleton context')
derived.collection.children.link(context)
for obj in skeleton:
    for collection in list(obj.users_collection):collection.objects.unlink(obj)
    context.objects.link(obj)
for scene in original_scenes:bpy.data.scenes.remove(scene)
bpy.data.orphans_purge(do_recursive=True)
derived.unit_settings.system='METRIC'
for screen in bpy.data.screens:
    for area in screen.areas:
        if area.type=='VIEW_3D':
            space=area.spaces.active
            space.region_3d.view_location=Vector((0,0,.88))
            space.region_3d.view_distance=2.5
            space.region_3d.view_rotation=(.7071068,.7071068,0,0)
            space.shading.color_type='MATERIAL'
if len(records)<450 or sum(r['category']=='cranial' and bool(cranial.search(bare(r['key']))) for r in records)!=24:
    raise RuntimeError('Unexpected omission of nerve anatomy')

digests={}
for key,path in outputs.items():
    bpy.ops.object.select_all(action='DESELECT')
    for record in records:
        if (record['overview'] if key=='overview' else record['bucket']==key):
            parts[record['key']].select_set(True)
    bpy.ops.export_scene.gltf(filepath=str(path),use_selection=True,export_extras=True,export_materials='NONE',
                              export_draco_mesh_compression_enable=True,export_draco_position_quantization=16)
    digests[key]={'sha256':sha(path),'bytes':path.stat().st_size}
bpy.ops.object.select_all(action='DESELECT')
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=str(project),compress=True)
manifest.write_text(json.dumps({'schema':1,'sourceSha256':source_sha,'donors':manifest_sources,'files':digests,'structures':records},separators=(',',':'))+'\n',encoding='utf-8')
print('NERVES_EXPORTED',len(records),digests,project,flush=True)

