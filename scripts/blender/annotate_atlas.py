"""Assemble the shipped anatomy and add editable source-backed label anchors.

Run in Blender 4.5 background mode. No Boolean or shape changes are made by
this annotation pass. Back up every input/output model before saving anything.
"""
import bpy, json, hashlib, shutil, sys, re, struct
from pathlib import Path
from datetime import datetime, timezone
from mathutils import Vector

args=sys.argv[sys.argv.index('--')+1:]
manifest_path,repo_path,project_path,backup_path=map(Path,args)
manifest=json.loads(manifest_path.read_text(encoding='utf-8'))
assets=[repo_path/'assets'/name for name in ['skeleton.glb','course-tissues.glb','landmark-details.glb']]
annotation_model=repo_path/'assets/course-landmark-labels.glb'
stamp=datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S-%f')
snapshot=backup_path/('atlas-labels-'+stamp);snapshot.mkdir(parents=True,exist_ok=False)
records=[]
for path in assets+[project_path,annotation_model]:
    record={'original':str(path),'existed':path.exists()}
    if path.exists():
        dest=snapshot/path.name;shutil.copy2(path,dest)
        digest=hashlib.sha256(path.read_bytes()).hexdigest()
        assert hashlib.sha256(dest.read_bytes()).hexdigest()==digest
        record.update(file=dest.name,bytes=path.stat().st_size,sha256=digest)
    records.append(record)
(snapshot/'manifest.json').write_text(json.dumps({'created':stamp,'reason':'Before assembling and saving editable atlas annotations','files':records},indent=2),encoding='utf-8')
print('BACKUP_VERIFIED',snapshot,flush=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
meshes={}
for asset in assets:
    before=set(bpy.data.objects)
    # The shipped detail GLB retains empty historical scenes. Three.js accepts
    # them; Blender 4.5 expects explicit empty node lists. Sanitize an import-only
    # copy without changing the distributed geometry or its original file.
    raw=asset.read_bytes();offset=12;chunks=[]
    while offset<len(raw):
        length,kind=struct.unpack_from('<II',raw,offset);offset+=8;chunk=raw[offset:offset+length];offset+=length
        if kind==0x4e4f534a:
            data=json.loads(chunk)
            for scene in data.get('scenes',[]):
                if scene.get('nodes') is None:scene['nodes']=[]
            chunk=json.dumps(data,separators=(',',':')).encode();chunk+=b' '*((-len(chunk))%4)
        chunks.append(struct.pack('<II',len(chunk),kind)+chunk)
    body=b''.join(chunks);compatible=manifest_path.parent/('import-'+asset.name)
    compatible.write_bytes(struct.pack('<III',0x46546c67,2,len(body)+12)+body)
    bpy.ops.import_scene.gltf(filepath=str(compatible))
    imported=[o for o in bpy.data.objects if o not in before and o.type=='MESH']
    for o in imported:
        name=o.get('zname',o.name)
        if o.get('replacementAnatomy') and name in meshes:
            for old in meshes[name]:bpy.data.objects.remove(old,do_unlink=True)
            meshes[name]=[]
        o['assetSource']=asset.name
        meshes.setdefault(name,[]).append(o)

def matches(pattern,name):
    if not pattern:return False
    if '||' in pattern:return any(matches(p,name) for p in pattern.split('||'))
    if re.search(r'\.[lr]$',pattern):return pattern==name
    base=re.sub(r'\.[lr]$','',name)
    ordinals='(?:First|Second|Third|Fourth|Fifth|Sixth|Seventh|Eighth|Ninth|Tenth|Eleventh|Twelfth)'
    order=['First','Second','Third','Fourth','Fifth','Sixth','Seventh','Eighth','Ninth','Tenth','Eleventh','Twelfth']
    if pattern==' rib':return bool(re.fullmatch(ordinals+' rib',base,re.I))
    if pattern.endswith('ribs'):
        n=next((i+1 for i,w in enumerate(order) if base==w+' rib'),0)
        return n>0 and (n<=7 if pattern=='true ribs' else n>=8 if pattern=='false ribs' else n>=11)
    if pattern=='sternum':return base in ['Manubrium of sternum','Body of sternum','Xiphoid process']
    if pattern=='carpals':return bool(re.fullmatch('(Scaphoid|Lunate|Triquetrum|Pisiform|Trapezium|Trapezoid|Capitate|Hamate) bone',base))
    if pattern=='tarsals':return bool(re.fullmatch('Talus|Calcaneus|Navicular bone|Cuboid bone|(Medial|Intermediate|Lateral) cuneiform bone',base))
    if pattern in ['metacarpal','metatarsal']:return bool(re.fullmatch(ordinals+' '+pattern+' bone',base))
    if pattern=='Vertebra C':return bool(re.fullmatch('Vertebra C\\d+|Atlas \\(C1\\)|Axis \\(C2\\)',base))
    if pattern in ['Vertebra T','Vertebra L']:return base.startswith(pattern)
    if pattern=='Vertebra':return bool(re.fullmatch('Vertebra [CTL]\\d+|Atlas \\(C1\\)|Axis \\(C2\\)',base))
    if '.*' in pattern:return bool(re.fullmatch(pattern,base))
    return base==pattern

def web(p):return [round(p.x,7),round(p.z,7),round(-p.y,7)]
def blender(p):return Vector((p[0],-p[2],p[1]))
def dist_box(point,m):
    return sum(max(m['min'][i]-point[i],0,point[i]-m['max'][i])**2 for i in range(3))
inventory=manifest['models'];anchors={};unresolved=[]
collection=bpy.data.collections.new('Osteon - editable anatomical labels');bpy.context.scene.collection.children.link(collection)
for entry in manifest['entries']:
    found=[m for m in inventory if (m.get('detailGroup')==entry['detailGroup'] and (not entry['object'] or m['name'].startswith(entry['object'])) if entry['detailGroup'] else not m.get('detailGroup') and matches(entry['pattern'],m['name']))]
    if entry['retired'] or entry['kind'] in ['reference','concept']:
        anchors[entry['id']]=[];continue
    points=[]
    if entry['points']:
        for authored in entry['points']:
            point=authored['point'];explicit=next((m for m in found if m['name']==authored.get('parent')),None)
            parent=explicit or min(found,key=lambda m:dist_box(point,m),default=None)
            if not parent:unresolved.append(entry['id']);continue
            # Preserve void/leader endpoints exactly. Do not snap a foramen onto bone.
            record={'point':point,'parent':parent['name'],'label':authored.get('label') or entry['name'],'placement':'authored-reference','detailGroup':entry['detailGroup']}
            if dist_box(point,parent)>.003**2:record['contextParents']=list(dict.fromkeys(m['name'] for m in found))
            points.append(record)
    elif entry['kind']=='mesh':
        # Whole-structure labels may use any actual surface vertex, unlike named
        # bone-marking anchors. Keep the first source object on each body side.
        groups={}
        for m in found:
            side='l' if m['name'].endswith('.l') else 'r' if m['name'].endswith('.r') else 'midline'
            groups.setdefault(side,[]).append(m)
        for group in groups.values():
            objs=[o for m in group for o in meshes.get(m['name'],[]) if bool(o.get('detailGroup'))==bool(entry['detailGroup'])]
            if not objs:continue
            center=sum((Vector(tuple((m['min'][i]+m['max'][i])*.5 for i in range(3))) for m in group),Vector())/len(group)
            target=blender(center)
            candidates=((o.matrix_world@v.co,o) for o in objs for v in o.data.vertices)
            point,obj=min(candidates,key=lambda pair:(pair[0]-target).length_squared)
            points.append({'point':web(point),'parent':obj.get('zname',obj.name),'label':entry['name'],'placement':'whole-structure-surface','detailGroup':entry['detailGroup']})
    anchors[entry['id']]=points
    for i,p in enumerate(points):
        empty=bpy.data.objects.new('Label - '+entry['name']+' - '+str(i+1),None);collection.objects.link(empty)
        empty.location=blender(p['point']);empty.empty_display_type='SPHERE';empty.empty_display_size=.001;empty.show_name=True
        for key,value in {'termId':entry['id'],'anatomicalName':entry['name'],'parentAnatomy':p['parent'],'placement':p['placement'],'openstaxSection':entry['reference'],'teacherRequired':entry['teacher'],'spatialScoringHeld':entry['held'],'pointWeb':p['point']}.items():empty[key]=value

if unresolved:raise RuntimeError('Unresolved anchors: '+str(unresolved))
# Keep the assembled project useful when opened: adult anatomy is visible;
# magnified teaching specimens and the dense editable-label collection can be
# enabled separately without changing or moving their geometry.
teaching={}
for group in sorted({o.get('detailGroup') for objects in meshes.values() for o in objects if o.get('detailGroup')}):
    c=bpy.data.collections.new('Teaching specimen - '+group);bpy.context.scene.collection.children.link(c);c.hide_viewport=True;c.hide_render=True;teaching[group]=c
for objects in meshes.values():
    for obj in objects:
        group=obj.get('detailGroup')
        if group:
            for c in list(obj.users_collection):c.objects.unlink(obj)
            teaching[group].objects.link(obj)
project_path.parent.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='DESELECT')
for o in collection.objects:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(annotation_model),export_format='GLB',use_selection=True,export_extras=True,export_yup=True,export_animations=False)
raw=annotation_model.read_bytes();length=struct.unpack_from('<I',raw,12)[0];exported=json.loads(raw[20:20+length])
assert len([n for n in exported.get('nodes',[]) if n.get('extras',{}).get('termId')])==sum(map(len,anchors.values())), 'Annotation export omitted label nodes'
collection.hide_viewport=True
bpy.ops.wm.save_as_mainfile(filepath=str(project_path))
output={'schema':1,'source':manifest['source'],'method':'Blender 4.5 assembly of shipped assets; authored reference points preserved; whole-structure labels placed on actual surface vertices','anchors':anchors}
(repo_path/'src/atlas-label-anchors.json').write_text(json.dumps(output,separators=(',',':'))+'\n',encoding='utf-8')
evidence={'blenderVersion':bpy.app.version_string,'backup':snapshot.name,'entries':len(anchors),'anchors':sum(map(len,anchors.values())),'teacherEntries':sum(e['teacher'] for e in manifest['entries']),'project':project_path.name,'annotationAsset':annotation_model.name,'geometryChanged':False,'sourceHashes':{r['file']:r['sha256'] for r in records if r['existed'] and r['original'] in map(str,assets)}}
(repo_path/'assets/atlas-label-evidence.json').write_text(json.dumps(evidence,indent=2)+'\n',encoding='utf-8')
print('ATLAS_ANNOTATED',json.dumps(evidence),flush=True)
