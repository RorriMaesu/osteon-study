"""Install the reviewed working copy into the existing distributed atlas."""
import bpy,json,sys
from pathlib import Path
R=Path(sys.argv[sys.argv.index('--')+1]).resolve() if '--' in sys.argv else Path(__file__).resolve().parents[4];W=R/'work/landmark-clarity-2026-11-04';D=R/'outputs/osteon-study';sys.path.insert(0,str(Path(__file__).resolve().parent))
from exam_model_backup import backup
project=R/'outputs/osteon-models/landmark-details.blend';asset=D/'assets/landmark-details.glb'
first=backup('Before installing working candidate exam anatomy, preserve shipped detail and editable model',[project,asset])
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False);bpy.ops.import_scene.gltf(filepath=str(asset))
replacement=set(json.loads((W/'clarity-geometry.json').read_text()))
for o in list(bpy.data.objects):
    if o.get('zname',o.name)in replacement or o.get('focusFor')or o.get('detailGroup')in ['drawer-knee','ethmoid-conchae']:bpy.data.objects.remove(o,do_unlink=True)
with bpy.data.libraries.load(str(W/'exam-landmarks.blend'),link=False)as(src,dst):dst.objects=src.objects[:]
for o in dst.objects:
    if o and not o.users_collection:bpy.context.collection.objects.link(o)
# Bake only object transforms; retain native mesh coordinates and the site frame.
bpy.ops.object.select_all(action='DESELECT')
for o in bpy.context.scene.objects:
    if o.type in ['MESH','CURVE']:o.select_set(True)
bpy.context.view_layer.objects.active=next(o for o in bpy.context.scene.objects if o.type=='MESH');bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
bpy.ops.wm.save_as_mainfile(filepath=str(project));last=backup('Immediately before replacing distributed anatomical-detail GLB',[asset]);bpy.ops.export_scene.gltf(filepath=str(asset),export_format='GLB',use_selection=True,export_extras=True,export_yup=True,export_animations=False,export_apply=True)
(W/'installation.json').write_text(json.dumps({'beforeProject':first.name,'beforeExport':last.name,'project':str(project),'asset':str(asset),'replaced':sorted(replacement)},indent=2),encoding='utf-8');print('EXAM_CLARITY_INSTALLED',flush=True)
