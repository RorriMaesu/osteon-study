"""Read-only Blender 4.5 inspection. Never save or modify source geometry."""
import bpy,json,sys,hashlib,re
from pathlib import Path
from mathutils import Vector
root=Path(sys.argv[sys.argv.index('--')+1]).resolve()
source=root/'work/complete-anatomy/source/Z-Anatomy/Startup.blend'
original_hash=hashlib.sha256(source.read_bytes()).hexdigest()
manifest=json.loads((root/'outputs/osteon-study/src/muscle-models.json').read_text(encoding='utf-8'))
records=[]
for c in manifest['components']:
 obj=bpy.data.objects[c['sourceName']];me=obj.data;n=len(me.vertices)
 # Connected components are a diagnostic. A separate tendon or tendon slip
 # may create extra islands; island count never automatically certifies a muscle.
 parent=list(range(n))
 def find(x):
  while parent[x]!=x:parent[x]=parent[parent[x]];x=parent[x]
  return x
 for edge in me.edges:
  a,b=map(find,edge.vertices)
  if a!=b:parent[b]=a
 groups={}
 for i,v in enumerate(me.vertices):groups.setdefault(find(i),[]).append(obj.matrix_world@v.co)
 islands=[]
 for points in groups.values():
  if len(points)<5:continue
  lo=[min(p[k]for p in points)for k in range(3)];hi=[max(p[k]for p in points)for k in range(3)]
  islands.append({'vertices':len(points),'min':[lo[0],lo[2],-hi[1]],'max':[hi[0],hi[2],-lo[1]]})
 islands.sort(key=lambda x:x['vertices'],reverse=True)
 records.append({'id':c['id'],'sourceName':c['sourceName'],'vertices':n,'faces':len(me.polygons),'surfaceIslands':islands,'finite':all(all(__import__('math').isfinite(x)for x in p)for p in [*([v.co[:] for v in me.vertices])])})
assert hashlib.sha256(source.read_bytes()).hexdigest()==original_hash
out=root/'work/muscle-completeness/geometry-inspection.json'
out.write_text(json.dumps({'sourceUnchanged':True,'sourceSHA256':original_hash,'method':'Blender 4.5 original meshes, edge connectivity, world-space island bounds; read-only','components':records},indent=2)+'\n',encoding='utf-8')
print('INSPECTED',len(records),'SOURCE UNCHANGED',flush=True)
for r in records:
 if re.search('Palmar interossei|Lumbrical|Plantar interossei|Dorsal interossei|Spinalis capitis|Tensor fasciae',r['sourceName'],re.I):print(r['sourceName'],r['faces'],'faces;',len(r['surfaceIslands']),'surface islands',flush=True)
