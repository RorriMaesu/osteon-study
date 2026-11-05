"""Append registered original anatomy to the editable Blender 4.5 derivative.

Run with --background --disable-autoexec --python this.py -- WORKSPACE.
Every existing destination is hash-verified in a backup before mutation.
The original Z-Anatomy project is never opened for writing.
"""
import bpy,json,sys,hashlib,shutil
from pathlib import Path
from datetime import datetime,timezone

ROOT=Path(sys.argv[sys.argv.index('--')+1]).resolve()
REPO=ROOT/'outputs/osteon-study';PROJECT=ROOT/'outputs/osteon-models/muscles.blend'
recipe=json.loads((REPO/'model-sources/muscle-repairs.json').read_text(encoding='utf-8'))
manifest_path=REPO/'src/muscle-models.json'
manifest=json.loads(manifest_path.read_text(encoding='utf-8'))
def digest(p):
 with p.open('rb')as f:return hashlib.file_digest(f,'sha256').hexdigest()
def backup(reason,paths):
 folder=ROOT/'outputs/model-backups'/('muscles-'+datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S-%f'))
 folder.mkdir(parents=True);records=[]
 for i,p in enumerate(paths):
  rec={'original':str(p),'existed':p.exists()}
  if p.exists():
   dest=folder/(str(i)+'-'+p.name);shutil.copy2(p,dest);assert digest(dest)==digest(p)
   rec.update(file=dest.name,bytes=dest.stat().st_size,sha256=digest(dest))
  records.append(rec)
 (folder/'manifest.json').write_text(json.dumps({'reason':reason,'files':records},indent=2)+'\n')
 print('VERIFIED_BACKUP',folder,flush=True);return folder.name
existing={c['id']for c in manifest['components']}
pending=[r for r in recipe['additions']if r['id']not in existing]
if not pending:
 print('NO_PENDING_REPAIRS');sys.exit(0)
backup('Before opening the derived project for original-source muscle-group repairs',[PROJECT,manifest_path])
source=ROOT/'work/complete-anatomy/source/Z-Anatomy/Startup.blend';source_hash=digest(source)
bpy.ops.wm.open_mainfile(filepath=str(PROJECT),load_ui=False)
scene=bpy.context.scene;regions=set()
for r in pending:
 p=REPO/r['sourceFile'];assert digest(p)==r['sourceSHA256'],p
 verts=[];faces=[]
 for line in p.read_text().splitlines():
  if line.startswith('v '):verts.append([float(x)*.001 for x in line.split()[1:4]])
  elif line.startswith('f '):faces.append([int(x.split('/')[0])-1 for x in line.split()[1:]])
 if 'sourceFaceIndices'in r:faces=[faces[i]for i in r['sourceFaceIndices']]
 used=sorted({i for f in faces for i in f});index={i:j for j,i in enumerate(used)}
 m=r['registration'];s=m['scale'];rot=m['rotation'];t=m['translation'];mirror=-1 if r.get('mirrorSource')else 1
 moved=[]
 for i in used:
  v=verts[i];v=[v[0]*mirror,v[1],v[2]]
  moved.append([s*sum(v[k]*rot[k][j]for k in range(3))+t[j]for j in range(3)])
 poly=[[index[i]for i in f]for f in faces]
 if mirror<0:poly=[list(reversed(f))for f in poly]
 me=bpy.data.meshes.new(r['name']+' source surface');me.from_pydata(moved,[],poly);me.update()
 assert not me.validate(verbose=False),'Invalid source topology: '+r['id']
 for face in me.polygons:face.use_smooth=True
 obj=bpy.data.objects.new(r['name']+'.'+('r'if r['side']=='right'else'l'),me);scene.collection.objects.link(obj)
 material=bpy.data.materials.get('Osteon muscle');assert material
 me.materials.append(material)
 obj['muscleId']=r['id'];obj['muscleRegion']=r['region'];obj['muscleKind']='muscle';obj['muscleDepth']='deeper';obj['zname']=r['sourceName'];obj['anatomicalSide']=r['side'];obj['source']='BodyParts3D 4.3 original anatomy; registered derivative';obj['sourceFile']=r['sourceFile'];obj['sourceSHA256']=r['sourceSHA256']
 lo=[min(v[j]for v in moved)for j in range(3)];hi=[max(v[j]for v in moved)for j in range(3)]
 record={k:v for k,v in r.items()if k not in ['sourceFaceIndices']}
 record.update(kind='muscle',depth='deeper',sourceDataset='BodyParts3D 4.3',parents=[r['memberOf'],'Intrinsic muscles of '+('hand'if r['region']=='forearm-hand'else'foot')],sourcePolygons=len(poly),bounds={'min':[lo[0],lo[2],-hi[1]],'max':[hi[0],hi[2],-lo[1]]},status='source-aligned-reference',assessment='learn-only',reviewNotice='Original named source geometry registered to the existing skeleton. Attachment extents and movement are not independently certified.')
 manifest['components'].append(record);regions.add(r['region'])
for c in manifest['components']:
 if c['id']in recipe['superseded']:
  c['retired']=True;c['supersededBy']=recipe['superseded'][c['id']]
 for o in scene.objects:
  if o.get('muscleId')==c['id']:
   o['muscleKind']=c['kind'];o['muscleDepth']=c['depth'];o['retired']=bool(c.get('retired'));break
backup('Immediately before saving the repaired editable Blender muscle project',[PROJECT])
bpy.ops.wm.save_as_mainfile(filepath=str(PROJECT),check_existing=False)
for region in sorted(regions):
 for obj in scene.objects:obj.select_set(obj.get('muscleRegion')==region)
 selected=[o for o in scene.objects if o.select_get()];bpy.context.view_layer.objects.active=selected[0]
 target=REPO/'assets'/('muscles-'+region+'.glb')
 snapshot=backup('Immediately before exporting repaired '+region,[target])
 bpy.ops.export_scene.gltf(filepath=str(target),export_format='GLB',use_selection=True,export_extras=True,export_animations=False,export_apply=True,export_yup=True,export_draco_mesh_compression_enable=True,export_draco_mesh_compression_level=6,export_draco_position_quantization=16,export_draco_normal_quantization=10)
 manifest['assets'][region]={'file':target.name,'bytes':target.stat().st_size,'sha256':digest(target),'components':len(selected),'backup':snapshot}
manifest['repairs']={'recipe':'model-sources/muscle-repairs.json','stage':'hand-and-foot-groups','addedComponents':len(recipe['additions']),'retiredComponents':len(recipe['superseded'])}
manifest['phase']='recovered-hand-and-foot-groups'
manifest_path.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
assert digest(source)==source_hash,'Original source unexpectedly changed'
print('REPAIRED',len(pending),'components; original source preserved',source_hash,flush=True)
