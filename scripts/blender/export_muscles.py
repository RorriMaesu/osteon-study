"""Blender 4.5: preserve world-space anatomy and export named muscle regions.

Open the preserved Z-Anatomy Startup.blend with --disable-autoexec. The original
is never saved. Every destination model is hash-verified in a unique backup
immediately before save/export. Model snapshots stay outside the public repo.
"""
import bpy,bmesh,json,re,sys,hashlib,shutil,math
from pathlib import Path
from datetime import datetime,timezone
from mathutils import Vector

args=sys.argv[sys.argv.index('--')+1:]
ROOT=Path(args[0]).resolve();PHASE=args[1] if len(args)>1 else 'pilot'
REPO=ROOT/'outputs/osteon-study';PROJECT=ROOT/'outputs/osteon-models/muscles.blend'
BACKUPS=ROOT/'outputs/model-backups';SOURCE=ROOT/'work/complete-anatomy/source/Z-Anatomy/Startup.blend'
existing_manifest=REPO/'src/muscle-models.json'
if existing_manifest.exists() and json.loads(existing_manifest.read_text(encoding='utf-8')).get('repairs'):
 raise RuntimeError('This atlas contains source repairs. Use repair_muscle_groups.py on the derived project; rebuilding from the original would erase repairs.')

def digest(p):
 with p.open('rb')as f:return hashlib.file_digest(f,'sha256').hexdigest()
def backup(reason,paths):
 folder=BACKUPS/('muscles-'+datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S-%f'));folder.mkdir(parents=True,exist_ok=False)
 records=[]
 for index,p in enumerate(paths):
  rec={'original':str(p),'existed':p.exists()}
  if p.exists():
   dest=folder/(str(index)+'-'+p.name);shutil.copy2(p,dest);assert digest(p)==digest(dest);rec.update(file=dest.name,sha256=digest(dest),bytes=dest.stat().st_size)
  records.append(rec)
 (folder/'manifest.json').write_text(json.dumps({'reason':reason,'files':records},indent=2)+'\n',encoding='utf-8')
 print('VERIFIED_BACKUP',folder,flush=True);return folder.name

original_hash=digest(SOURCE)
initial=backup('Before creating the derived muscle project; original anatomy and shipped skeleton retained',[SOURCE,REPO/'assets/skeleton.glb',PROJECT])
inventory=json.loads((ROOT/'work/complete-anatomy/inventory.json').read_text(encoding='utf-8'))['4: Muscular system']
names=[o['name']for o in inventory if o['type']=='MESH'and o.get('polys',0)>0 and not o['name'].endswith(('.g','.i','.j'))]
pilot=re.compile(r'deltoid muscle|biceps brachii|triceps brachii|^Brachialis muscle|^Coracobrachialis muscle|^Subscapularis muscle|^Supraspinatus muscle|^Infraspinatus muscle|^Teres minor muscle',re.I)
if PHASE=='pilot':names=[n for n in names if pilot.search(n)]

def ancestry(o):
 out=[];p=o.parent
 while p and len(out)<20:out.append(p.name);p=p.parent
 return out
def region_for(name,parents,center):
 text=' '.join([name,*parents]).lower()
 hierarchy=' '.join(parents).lower()
 if pilot.search(name)or re.search(r'teres major|deltoid|subacromial',name,re.I):return 'shoulder-arm'
 # Use the source regional hierarchy before geometric fallbacks. A muscle's
 # "clavicular head" is not a head/neck region simply because it says head.
 if 'compartment of arm.g' in hierarchy:return 'shoulder-arm'
 if any(w in hierarchy for w in ['muscular system of upper limb','muscles of upper limb']):return 'forearm-hand'
 if any(w in hierarchy for w in ['muscular system of lower limb','muscles of lower limb']):return 'pelvis-leg-foot'
 if any(w in hierarchy for w in ['abdominal part','muscles of abdomen','thoracic part','muscles of thorax','dorsal part','muscles of back']):return 'trunk-back'
 if any(w in hierarchy for w in ['muscles of head','muscles of face','muscles of neck','cervical part','head and neck']):return 'head-neck'
 if any(w in text for w in ['upper limb','forearm','of hand','carpi','digitorum superficialis','digitorum profundus','pollicis','pronator','supinator','brachioradialis']):return 'forearm-hand'
 if any(w in text for w in ['lower limb','of thigh','of leg','of foot','femoris','gastrocnemius','soleus','tibialis','fibularis','hallucis']):return 'pelvis-leg-foot'
 if any(w in text for w in ['of head','of face','of neck','pharyn','laryn','tongue','extraocular','masseter','temporalis','pterygoid','platysma','capitis','colli','scalen']):return 'head-neck'
 if any(w in text for w in ['pelvi','perine','coccyg','ani','obturator','piriformis']):return 'pelvis-leg-foot'
 if center.z>1.43:return 'head-neck'
 if abs(center.x)>.22 and center.z>0.75:return 'forearm-hand'
 if center.z<.90:return 'pelvis-leg-foot'
 return 'trunk-back'
taxonomy=json.loads((REPO/'src/muscle-taxonomy.json').read_text(encoding='utf-8'))
support=re.compile(taxonomy['supportPattern'],re.I)
geometry_reviews=json.loads((REPO/'src/muscle-geometry-review.json').read_text(encoding='utf-8'))['reviews']
superficial=re.compile(r'deltoid|biceps brachii|lateral head of triceps|long head of triceps|trapezius|latissimus|pectoralis major|rectus abdominis|external oblique|gluteus maximus|sartorius|rectus femoris|vastus|gastrocnemius|tibialis anterior|sternocleidomastoid|platysma|masseter|temporalis|facial|frontalis|orbicularis',re.I)
deep=re.compile(r'subscapularis|supraspinatus|infraspinatus|teres minor|brachialis|coracobrachialis|medial head of triceps|pronator quadratus|supinator|digitorum profundus|transversus abdominis|internal oblique|multifidus|rotator|interosse|lumbrical|psoas|iliacus|obturator|piriformis|popliteus|tibialis posterior|longus colli|longus capitis|pharyngeal',re.I)
scene=bpy.data.scenes.new('Osteon muscle anatomy');source_objects=[bpy.data.objects[n]for n in names]
deps=bpy.context.evaluated_depsgraph_get();records=[];objects=[]
for original in source_objects:
 parents=ancestry(original);evaluated=original.evaluated_get(deps);me=bpy.data.meshes.new_from_object(evaluated,depsgraph=deps);me.transform(original.matrix_world)
 if not me.vertices:raise ValueError('Empty source anatomy '+original.name)
 obj=bpy.data.objects.new(original.name,me);scene.collection.objects.link(obj)
 points=[v.co for v in me.vertices];lo=Vector(tuple(min(p[i]for p in points)for i in range(3)));hi=Vector(tuple(max(p[i]for p in points)for i in range(3)));center=(lo+hi)*.5
 kind='muscle' if re.sub(r'\.[lr]$','',original.name) in taxonomy['muscleOverrides'] else 'support' if support.search(original.name)else 'muscle';region=region_for(original.name,parents,center)
 side='right' if original.name.endswith('.r')else 'left'if original.name.endswith('.l')else 'right'if hi.x<-.001 else 'left'if lo.x>.001 else 'midline'if original.name in ['Linea alba','Transverse arytenoid muscle']else 'bilateral'
 source_name=original.name;identity='muscle-'+re.sub(r'[^a-z0-9]+','-',source_name.lower()).strip('-')
 group=next((p[:-2]for p in parents if re.search(r'(?<!s) muscle\.g$',p,re.I)),None)
 display=re.sub(r'\.[lr]$','',source_name);muscle_name=group or re.sub(r'^(?:Long|Short|Medial|Lateral) head of ','',display,flags=re.I)
 if kind=='muscle':muscle_name=next((g['name'] for g in taxonomy['groups'] if re.search(g['pattern'],source_name,re.I)),muscle_name)
 else:muscle_name=display
 correction=None
 if source_name.startswith('Bucinator'):display='Buccinator muscle';muscle_name='Buccinator muscle';correction='Source spelling corrected to the standard anatomical name: buccinator.'
 if re.match(r'Ascending part of trapezius',source_name):display='Upper (descending) part of trapezius';correction='Source part label corrected to match the superior, occipital/cervical geometry.'
 if re.match(r'Descending part of trapezius',source_name):display='Lower (ascending) part of trapezius';correction='Source part label corrected to match the inferior, thoracic geometry.'
 depth='superficial'if superficial.search(source_name)else 'deeper'if deep.search(source_name)else 'unassigned'
 depth=taxonomy['depthOverrides'].get(re.sub(r'\.[lr]$','',source_name),depth)
 obj['zname']=source_name;obj['muscleId']=identity;obj['muscleRegion']=region;obj['muscleKind']=kind;obj['muscleDepth']=depth;obj['source']='Z-Anatomy / BodyParts3D; world transforms preserved';obj['anatomicalSide']=side
 mat=bpy.data.materials.get('Osteon muscle'if kind=='muscle'else 'Osteon muscle support')
 if mat is None:
  mat=bpy.data.materials.new('Osteon muscle'if kind=='muscle'else 'Osteon muscle support');mat.diffuse_color=(.57,.20,.16,1)if kind=='muscle'else(.82,.76,.61,1);mat.use_nodes=True;bsdf=mat.node_tree.nodes.get('Principled BSDF');bsdf.inputs['Base Color'].default_value=mat.diffuse_color;bsdf.inputs['Roughness'].default_value=.68
 me.materials.clear();me.materials.append(mat)
 # Keep attachment shapes. Moderate polygon reduction is for large source surfaces.
 if PHASE!='pilot'and len(me.polygons)>7000:
  modifier=obj.modifiers.new('Conservative web simplification','DECIMATE');modifier.ratio=.70
 records.append({'id':identity,'sourceName':source_name,'name':display,'muscleName':muscle_name,'nameCorrection':correction,'region':region,'side':side,'kind':kind,'depth':depth,'parents':parents,'sourcePolygons':len(me.polygons),'bounds':{'min':[lo.x,lo.z,-hi.y],'max':[hi.x,hi.z,-lo.y]},'status':'source-aligned-reference','assessment':'learn-only','reviewNotice':'Named source geometry with original position retained. Attachment extents and movement are not independently certified; not enabled for precise spatial scoring.'})
 if re.sub(r'\.[lr]$','',source_name) in geometry_reviews:records[-1]['geometryReview']=geometry_reviews[re.sub(r'\.[lr]$','',source_name)]
 objects.append(obj)

bpy.context.window.scene=scene
# The editable derivative needs only the exported anatomy, not every original
# atlas scene, font and unrelated organ. The original .blend stays untouched.
for old in list(bpy.data.scenes):
 if old!=scene:bpy.data.scenes.remove(old)
keep=set(objects)
for old in list(bpy.data.objects):
 if old not in keep:bpy.data.objects.remove(old,do_unlink=True)
bpy.data.orphans_purge(do_local_ids=True,do_linked_ids=True,do_recursive=True)
for obj in scene.objects:obj.select_set(False)
backup('Immediately before saving the derived editable Blender muscle project',[PROJECT])
bpy.ops.wm.save_as_mainfile(filepath=str(PROJECT),check_existing=False)
regions=sorted(set(r['region']for r in records));assets={}
for region in regions:
 for obj in scene.objects:obj.select_set(obj['muscleRegion']==region)
 selected=[o for o in scene.objects if o.select_get()];bpy.context.view_layer.objects.active=selected[0]
 target=REPO/'assets'/('muscles-'+region+'.glb');snapshot=backup('Immediately before exporting '+region,[target])
 bpy.ops.export_scene.gltf(filepath=str(target),export_format='GLB',use_selection=True,export_extras=True,export_animations=False,export_apply=True,export_yup=True,export_draco_mesh_compression_enable=True,export_draco_mesh_compression_level=6,export_draco_position_quantization=16,export_draco_normal_quantization=10)
 assets[region]={'file':target.name,'bytes':target.stat().st_size,'sha256':digest(target),'components':len(selected),'backup':snapshot}
print('MUSCLE_EXPORTS',json.dumps(assets),flush=True)
manifest={'schema':1,'source':'Z-Anatomy original Startup.blend','sourceURL':'https://github.com/Z-Anatomy/Models-of-human-anatomy','sourceSHA256':original_hash,'license':'CC BY-SA 4.0','blender':bpy.app.version_string,'phase':PHASE,'initialBackup':initial,'assets':assets,'components':records,'note':'Component count is not distinct muscle count. Depth is a regional study filter, not a complete dissection plane. No movement rig or certified insertion footprint is asserted.'}
(REPO/'src/muscle-models.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
assert digest(SOURCE)==original_hash,'Original source changed unexpectedly'
print('PRESERVED_SOURCE',original_hash,'COMPONENTS',len(records),flush=True)
