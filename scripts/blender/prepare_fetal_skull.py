"""Orient a licensed scan and add clearly qualified developmental site references.

No fontanelle holes are cut. These junction guides remain outside spatial scoring.
Arguments: original GLB, site-input JSON, repository, editable blend, backup folder.
"""
import bpy,json,hashlib,shutil,sys
from pathlib import Path
from datetime import datetime,timezone
from mathutils import Vector,Matrix

original,site_file,repo,project,backups=map(Path,sys.argv[sys.argv.index('--')+1:])
output=repo/'assets/fetal-skull.glb';stamp=datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S-%f');snapshot=backups/('fetal-skull-'+stamp);snapshot.mkdir(parents=True,exist_ok=False)
records=[]
for path in [original,output,project]:
    record={'original':str(path),'existed':path.exists()}
    if path.exists():
        name=('original-' if path==original else '')+path.name;dest=snapshot/name;shutil.copy2(path,dest);digest=hashlib.sha256(path.read_bytes()).hexdigest();assert hashlib.sha256(dest.read_bytes()).hexdigest()==digest;record.update(file=name,sha256=digest,bytes=path.stat().st_size)
    records.append(record)
(snapshot/'manifest.json').write_text(json.dumps({'reason':'Before orienting the UCSF scan and adding developmental reference anchors','files':records},indent=2),encoding='utf-8')
print('FETAL_BACKUP_VERIFIED',snapshot,flush=True)
bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(original))
meshes=[o for o in bpy.data.objects if o.type=='MESH'];points=[o.matrix_world@v.co for o in meshes for v in o.data.vertices];lo=Vector(tuple(min(p[i]for p in points)for i in range(3)));hi=Vector(tuple(max(p[i]for p in points)for i in range(3)));center=(lo+hi)/2;scale=.2/max(hi-lo);target=Vector((0,0,1.1))
for i,o in enumerate(meshes):
    matrix=o.matrix_world.copy();o.parent=None;o.matrix_world=Matrix.Translation(target)@Matrix.Scale(scale,4)@Matrix.Translation(-center)@matrix;o.name='UCSF fetal skull scan '+str(i+1);o['zname']=o.name;o['detailGroup']='fetal-skull';o['source']='Roberto Rodriguez Rubio / SBCVL_UCSF, UCSF Anatomy Learning Center';o['license']='CC BY-NC 4.0'
bpy.context.view_layer.update();deps=bpy.context.evaluated_depsgraph_get();sites=[]
def web(p):return [round(p.x,7),round(p.z,7),round(-p.y,7)]
views={'top':[0,-.001,1],'back':[0,1,0],'left':[1,0,0],'right':[-1,0,0]}
collection=bpy.data.collections.new('Developmental junction guides - NOT open-hole targets');bpy.context.scene.collection.children.link(collection)
for item in json.loads(site_file.read_text(encoding='utf-8')):
    direction=Vector(views[item['image']]).normalized();rotation=(-direction).to_track_quat('-Z','Y').to_matrix();px,py=item['pixel'];origin=target+direction*.4+rotation@Vector(((px/720-.5)*.235,(.5-py/720)*.235,0));hit,location,normal,face,obj,matrix=bpy.context.scene.ray_cast(deps,origin,-direction)
    if not hit:raise RuntimeError('No scan surface at '+item['id'])
    record={**item,'point':web(location),'parent':obj.get('zname',obj.name),'face':face,'method':'Manual developmental-junction reference in an orthographic scan rendering; exact ray/triangle intersection','spatialScoring':False}
    sites.append(record);empty=bpy.data.objects.new(item['label'],None);collection.objects.link(empty);empty.location=location;empty.empty_display_type='SPHERE';empty.empty_display_size=.001;empty.show_name=True;empty['siteId']=item['id'];empty['pointWeb']=record['point'];empty['interpretation']='Developmental site reference; does not assert an open fontanelle';empty['spatialScoring']=False
bpy.ops.object.select_all(action='DESELECT')
for obj in [*meshes,*collection.objects]:obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(output),export_format='GLB',use_selection=True,export_extras=True,export_yup=True,export_animations=False)
project.parent.mkdir(parents=True,exist_ok=True);bpy.ops.wm.save_as_mainfile(filepath=str(project))
record={'schema':1,'group':'fetal-skull','name':'UCSF fetal-skull scan','source':'https://sketchfab.com/3d-models/fetal-skull-7646e0227f07475eb8275d084993194c','creator':'Roberto Rodriguez Rubio / SBCVL_UCSF','institution':'UCSF Anatomy Learning Center','license':'CC BY-NC 4.0','licenseURL':'https://creativecommons.org/licenses/by-nc/4.0/','reference':'7.5','figure':'7.33','center':[0,1.1,0],'sites':sites,'notice':'Developmental junction references are marked on this scan. Some sites are narrowed or closed in the specimen; labels do not assert six open fontanelles. Compare the newborn illustration to learn the membrane-filled gaps. The specimen is normalized for display; do not use it for measurements.','geometryChanges':'Orientation and uniform display scale only; no holes, bone shapes or scan textures were fabricated.','sourceSHA256':hashlib.sha256(original.read_bytes()).hexdigest(),'assetSHA256':hashlib.sha256(output.read_bytes()).hexdigest(),'backup':snapshot.name,'blenderVersion':bpy.app.version_string,'meshFaces':sum(len(o.data.polygons)for o in meshes)}
(repo/'src/fetal-skull-specimen.json').write_text(json.dumps(record,indent=2)+'\n',encoding='utf-8')
print('FETAL_SPECIMEN_SAVED',json.dumps({'sites':len(sites),'faces':record['meshFaces'],'backup':snapshot.name}),flush=True)
