"""Blender 4.5 read-only audit of the actual GLB delivery, including repairs.
Never saves a .blend or overwrites a model. Reports and renders go to M:.
"""
import bpy,json,math,hashlib,sys,csv
from pathlib import Path
from mathutils import Vector
args=sys.argv[sys.argv.index('--')+1:]
if len(args)!=2:raise SystemExit('Supply REPOSITORY and OUTPUT_DIRECTORY after --')
REPO=Path(args[0]).resolve();OUT=Path(args[1]).resolve();REPORT=OUT/'reports';RENDER=OUT/'renders'
REPORT.mkdir(parents=True,exist_ok=True);RENDER.mkdir(parents=True,exist_ok=True)
manifest=json.loads((REPO/'src/muscle-models.json').read_text());byid={c['id']:c for c in manifest['components']}
paths=[REPO/'assets'/a['file'] for a in manifest['assets'].values()]+[REPO/'assets/skeleton.glb']
before={str(p):hashlib.sha256(p.read_bytes()).hexdigest() for p in paths}
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
meshes=[]
for region,a in manifest['assets'].items():
    bpy.ops.import_scene.gltf(filepath=str(REPO/'assets'/a['file']))
    print('IMPORTED',region,flush=True)
bpy.context.view_layer.update()
records=[]
for obj in list(bpy.context.scene.objects):
    if obj.type!='MESH':continue
    ident=obj.get('muscleId');assert ident in byid,('Unknown mesh identity',obj.name,ident)
    c=byid[ident];points=[obj.matrix_world@v.co for v in obj.data.vertices]
    assert points and obj.data.polygons,(ident,'Empty geometry')
    finite=all(math.isfinite(x) for p in points for x in p)
    lo=[min(p[k] for p in points) for k in range(3)];hi=[max(p[k] for p in points) for k in range(3)]
    # glTF is Y-up; Blender's importer presents it Z-up. Back to web coordinates.
    weblo=[lo[0],lo[2],-hi[1]];webhi=[hi[0],hi[2],-lo[1]]
    error=max(abs(v-c['bounds'][key][k]) for key,vals in [('min',weblo),('max',webhi)] for k,v in enumerate(vals))
    parent=list(range(len(points)))
    def find(i):
        while parent[i]!=i:parent[i]=parent[parent[i]];i=parent[i]
        return i
    for edge in obj.data.edges:
        a,b=(find(i) for i in edge.vertices)
        if a!=b:parent[b]=a
    groups={}
    for i in range(len(points)):groups[find(i)]=groups.get(find(i),0)+1
    big_islands=sorted((n for n in groups.values() if n>=max(5,len(points)*.01)),reverse=True)
    record={'id':ident,'name':c['name'],'muscleName':c['muscleName'],'side':c['side'],'region':c['region'],'kind':c['kind'],'retired':bool(c.get('retired')),'vertices':len(points),'faces':len(obj.data.polygons),'finite':finite,'boundErrorMM':round(error*1000,4),'majorIslands':len(big_islands),'sideMatches':c['side'] not in ('left','right') or (weblo[0]<.002 if c['side']=='right' else webhi[0]>-.002),'sourceDataset':c.get('sourceDataset','Z-Anatomy'),'bounds':{'min':weblo,'max':webhi},'anatomyStatus':'Unresolved source naming' if c.get('geometryReview') else 'Named source geometry; attachment accuracy not independently certified'}
    records.append(record);obj.hide_render=record['retired'];meshes.append(obj)
assert set(r['id'] for r in records)==set(byid)
assert all(r['finite'] for r in records)
assert before=={str(p):hashlib.sha256(p.read_bytes()).hexdigest() for p in paths}
(REPORT/'shipped-geometry.json').write_text(json.dumps({'method':'Blender 4.5 imports of all shipped compressed GLBs, including recovered source and mirrored repairs; no source files saved','modelHashesUnchanged':True,'components':records},indent=2)+'\n')
with (REPORT/'shipped-components.csv').open('w',newline='',encoding='utf-8') as f:
    fields=[k for k in records[0] if k!='bounds'];w=csv.DictWriter(f,fieldnames=fields,extrasaction='ignore');w.writeheader();w.writerows(records)
print('ALL_COMPONENTS_INSPECTED',len(records),flush=True)
for row in records:
    if not row['sideMatches'] or row['boundErrorMM']>=1:print('BOUND_REVIEW',row['id'],row['sideMatches'],row['boundErrorMM'],flush=True)

# Actual shipped geometry in context: four viewpoints per region and full body.
bpy.ops.import_scene.gltf(filepath=str(REPO/'assets/skeleton.glb'))
bpy.context.view_layer.update();bones=[o for o in bpy.context.scene.objects if o.type=='MESH' and not o.get('muscleId')]
scene=bpy.context.scene;scene.render.engine='BLENDER_WORKBENCH';scene.render.resolution_x=1400;scene.render.resolution_y=1400;scene.render.resolution_percentage=100
scene.display.shading.light='STUDIO';scene.display.shading.studio_light='paint.sl';scene.display.shading.color_type='OBJECT';scene.display.shading.show_shadows=True;scene.display.shading.show_cavity=True;scene.display.shading.cavity_type='BOTH';scene.display.shading.show_specular_highlight=True;scene.display.shading.background_type='WORLD';scene.world.color=(.035,.055,.06)
scene.render.image_settings.file_format='PNG';scene.render.film_transparent=False
bpy.ops.object.camera_add();cam=bpy.context.object;scene.camera=cam;cam.data.type='ORTHO'
for b in bones:b.color=(.72,.72,.66,1)
for o in meshes:o.color=(.55,.24,.18,1)
def view(objects,filename,direction):
    points=[o.matrix_world@Vector(v) for o in objects for v in o.bound_box]
    low=Vector([min(p[k] for p in points) for k in range(3)]);high=Vector([max(p[k] for p in points) for k in range(3)]);center=(low+high)/2;span=max(high-low)
    cam.location=center+Vector(direction)*max(3,span*3);cam.rotation_euler=(center-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=span*1.15
    scene.render.filepath=str(RENDER/(filename+'.png'));bpy.ops.render.render(write_still=True)
for region in ['all',*manifest['assets']]:
    active=[o for o in meshes if not byid[o['muscleId']].get('retired') and byid[o['muscleId']]['kind']=='muscle' and (region=='all' or byid[o['muscleId']]['region']==region)]
    for o in meshes:o.hide_render=o not in active
    # Whole skeleton retained in the background; camera frames the muscle region.
    for name,direction in [('front',(0,-1,0)),('back',(0,1,0)),('left',(1,0,0)),('right',(-1,0,0))]:view(active,region+'-'+name,direction)
    print('RENDERED_REGION',region,flush=True)
assert before=={str(p):hashlib.sha256(p.read_bytes()).hexdigest() for p in paths}
print('READ_ONLY_AUDIT_COMPLETE',flush=True)
