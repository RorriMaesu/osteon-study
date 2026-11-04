"""Blender 4.5. Source-aligned teaching refinements; preserve pre-edit snapshots.

Original files are read-only. Working output is reviewed before installation.
Contours/calibers enhanced here are educational, not patient measurements.
"""
import bpy,bmesh,json,math,sys
from pathlib import Path
from mathutils import Vector,Matrix
from mathutils.bvhtree import BVHTree
R=Path(sys.argv[sys.argv.index('--')+1]).resolve() if '--' in sys.argv else Path(__file__).resolve().parents[4];W=R/'work/landmark-clarity-2026-11-04';sys.path.insert(0,str(Path(__file__).resolve().parent))
from exam_model_backup import backup
project=W/'exam-landmarks.blend';export=W/'exam-landmarks.glb'
snapshot=backup('Before authoring exam landmark contours, source restoration and flexed-knee specimen',[project,export])
source=json.loads((W/'source-evaluated.json').read_text());routes=json.loads((W/'source-routes.json').read_text());old=json.loads((W/'before-runtime.json').read_text());byid={t['id']:t for t in old}
source['Temporal bone.r']=json.loads((R/'work/blender-landmarks/refined-geometry.json').read_text())['Temporal bone.r']
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
def vec(p):return Vector((p[0],-p[2],p[1]))
def web(p):return [p.x,p.z,-p.y]
def mat(name,color):m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);return m
BONE=mat('Natural cortical bone',(.82,.79,.68));GUIDE=mat('Identification guide - not bone',(.96,.61,.26));PARENT=mat('Secondary bone',(.53,.65,.63))
def create(name,verts,faces,material=BONE):
    me=bpy.data.meshes.new(name);me.from_pydata([vec(p)for p in verts],[],faces);me.update();o=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(o);me.materials.append(material)
    for f in me.polygons:f.use_smooth=True
    return o
def triangles(o):o.data.calc_loop_triangles();return [list(t.vertices)for t in o.data.loop_triangles]
def positions(o):return [web(o.matrix_world@v.co)for v in o.data.vertices]
def tree(o):return BVHTree.FromPolygons(positions(o),triangles(o))
def topology(o):
    bm=bmesh.new();bm.from_mesh(o.data);boundary=[e for e in bm.edges if e.is_boundary];seen=set();loops=0
    for e in boundary:
        if e in seen:continue
        loops+=1;stack=[e]
        while stack:
            a=stack.pop()
            if a in seen:continue
            seen.add(a)
            stack.extend(k for v in a.verts for k in v.link_edges if k.is_boundary and k not in seen)
    out={'vertices':len(bm.verts),'faces':len(bm.faces),'boundaryEdges':len(boundary),'boundaryComponents':loops,'nonmanifoldEdges':sum(not e.is_manifold for e in bm.edges)};bm.free();return out
bones={};before={};changes={};anchors={};guides={}
for name in ['Humerus.r','Scapula.r','Tibia.r','Hip bone.r','Vertebra T6','Mandible','Occipital bone','Temporal bone.r','Parietal bone.r','Parietal bone.l']:
    d=source[name];o=create(name,d['verts'],d['faces']);o['zname']=name;o['replacementAnatomy']=True;o['source']='Z-Anatomy / BodyParts3D; native source resolution and November 4 educational contour refinements';o['license']='CC BY-SA 4.0';bones[name]=o;before[name]=topology(o)
def subdivide(o):
    bpy.context.view_layer.objects.active=o;modifier=o.modifiers.new('Contour continuity before local teaching refinement','SUBSURF');modifier.subdivision_type='CATMULL_CLARK';modifier.levels=1;modifier.render_levels=1;bpy.ops.object.modifier_apply(modifier=modifier.name)
for n in ['Humerus.r','Tibia.r','Hip bone.r','Vertebra T6']:subdivide(bones[n])
def nearest(name,p):
    h=tree(bones[name]).find_nearest(Vector(p));return h
def ellipsoid_brush(name,center,normal,radius,depth,rough=0,flatten=False):
    o=bones[name];c=Vector(center);n=Vector(normal).normalized();axis=n.cross(Vector((0,1,0)))
    if axis.length<.1:axis=n.cross(Vector((0,0,1)))
    axis.normalize();up=n.cross(axis).normalized();affected=0;largest=0
    for v in o.data.vertices:
        p=Vector(web(v.co));d=p-c;a=d.dot(axis)/radius[0];b=d.dot(up)/radius[1];q=a*a+b*b
        if q>=1 or abs(d.dot(n))>.004:continue
        fade=(1-q)**2;delta=depth*fade
        if flatten:delta-=d.dot(n)*fade
        delta+=rough*fade*math.sin(a*36)*math.cos(b*31)
        v.co=vec(p+n*delta);affected+=1;largest=max(largest,abs(delta))
    o.data.update();return {'verticesAffected':affected,'maxDisplacementMm':largest*1000,'center':list(c),'normal':list(n),'radiiMm':[r*1000 for r in radius]}
def curve_object(name,path,radius=.00065):
    cu=bpy.data.curves.new(name,'CURVE');cu.dimensions='3D';cu.resolution_u=1;cu.bevel_depth=radius;cu.bevel_resolution=2;cu.use_fill_caps=True;s=cu.splines.new('POLY');s.points.add(len(path)-1)
    for p,v in zip(s.points,path):p.co=(*vec(v),1)
    o=bpy.data.objects.new(name,cu);bpy.context.collection.objects.link(o);cu.materials.append(GUIDE);return o
def tags(o,ids,parent):o['focusFor']=ids;o['focusParent']=parent;o['detailGroup']='landmark-focus';o['anatomicalRegion']='Spine'if parent.startswith('Vertebra')else'Skull'if parent in ['Mandible','Ethmoid bone','Occipital bone']else'Pelvis'if parent.startswith('Hip')else'Lower limb'if parent.startswith('Tibia')else'Upper limb';o['guideOnly']=True;o['license']='CC BY-SA 4.0'
def guide_path(key,name,path,ids):
    o=curve_object('Focus trace - '+key,path);tags(o,ids,name);guides[key]={'kind':'trace','parent':name,'points':path,'ids':ids};return o
def area(key,name,seed,radii,ids,normal=None):
    o=bones[name];bvh=tree(o);h=bvh.find_nearest(Vector(seed));c=h[0];n=Vector(normal or h[1]).normalized();axis=n.cross(Vector((0,1,0)))
    if axis.length<.1:axis=n.cross(Vector((0,0,1)))
    axis.normalize();up=n.cross(axis).normalized();verts=positions(o);chosen=[]
    for f in triangles(o):
        a,b,d=[Vector(verts[i])for i in f];mid=(a+b+d)/3;v=mid-c;nn=(b-a).cross(d-a)
        if nn.length<1e-12:continue
        nn.normalize();q=(v.dot(axis)/radii[0])**2+(v.dot(up)/radii[1])**2
        if q<1 and abs(v.dot(n))<(.015 if key=='infraspinous-fossa' else .0035) and nn.dot(n)>.08:chosen.append(f)
    assert chosen,(key,'No actual cortical faces selected')
    used=sorted({i for f in chosen for i in f});mapping={v:i for i,v in enumerate(used)};p=[list(Vector(verts[i])+n*.000075)for i in used];patch=create('Focus surface - '+key,p,[[mapping[i]for i in f]for f in chosen],GUIDE);tags(patch,ids,name)
    guides[key]={'kind':'surface','parent':name,'ids':ids,'sourceFaceCount':len(chosen),'center':list(c),'radiiMm':[r*1000 for r in radii],'limits':'Representative named cortical region, not a claim of complete anatomical segmentation.'};return list(c),list(n)
def set_anchor(key,name,point,direction,distance,**extra):
    anchors[key]={'parentPattern':name,'points':[{'point':list(point),'parent':name,'label':key.replace('-',' ').capitalize()}],'view':{'center':list(point),'direction':direction,'distance':distance},'isolateContext':True,'contextPatterns':[],'ghostContext':False,'kind':'3d-landmark',**extra}
# A shallow oblique depression follows the real source radial-nerve course.
native=tree(bones['Humerus.r']);path=[]
for p in routes['Radial nerve.r'][0]:
    if 1.215<p[1]<1.29:
        h=native.find_nearest(Vector(p))
        if h[3]<.005 and (not path or (h[0]-Vector(path[-1])).length>.0013):path.append(list(h[0]))
assert len(path)>20
o=bones['Humerus.r'];changes['radial-nerve-sulcus']={'source':'Radial nerve.r original curve projected onto posterior source humeral cortex','depthMm':.75,'widthMm':6,'path':path}
for v in o.data.vertices:
    p=Vector(web(v.co));best=(1e9,None)
    for aa,bb in zip(path,path[1:]):
        a,b=Vector(aa),Vector(bb);d=b-a;t=max(0,min(1,(p-a).dot(d)/max(1e-12,d.length_squared)));q=a+d*t;dist=(p-q).length
        if dist<best[0]:best=(dist,q)
    dist,q=best
    if dist<.003:
        v.co=vec(p+Vector((0,0,1))*(.00075*(1-(dist/.003)**2)**2))
o.data.update();radial=[list(tree(o).find_nearest(Vector(p))[0])for p in path];guide_path('radial-nerve-sulcus','Humerus.r',radial,['radial-nerve-sulcus']);set_anchor('radial-nerve-sulcus','Humerus.r',radial[len(radial)//2],[.1,.06,-1],.24)
# Small facets: locally flatten their actual source articular region, never add a disk.
for key,seed,rs,dep in [('superior-costal-facet',[-.0148163,1.33,-.059],[.0037,.0030],-.00025),('inferior-costal-facet',[-.0168289,1.313,-.058],[.0037,.0028],-.00025),('transverse-costal-facet',[-.032,1.33,-.0805142],[.0035,.0042],-.0003)]:
    h=nearest('Vertebra T6',seed);changes[key]=ellipsoid_brush('Vertebra T6',h[0],h[1],rs,dep,flatten=True);p,n=area(key,'Vertebra T6',h[0],rs,[key,'textbook-'+key,'costal-facets']);set_anchor(key,'Vertebra T6',p,[-1,.25,.45],.19)
anchors['costal-facets']={**anchors['superior-costal-facet'],'points':[anchors[k]['points'][0]for k in ['superior-costal-facet','transverse-costal-facet','inferior-costal-facet']],'view':{'center':[-.019,1.322,-.067],'direction':[-1,.27,.45],'distance':.19}}
for key,name,seed,rs,depth,rough,direction,distance in [
    ('tibial-tuberosity','Tibia.r',[-.0881994,.3979513,.0043869],[.0075,.011],.00125,.00013,[.18,.14,1],.25),
    ('ischial-tuberosity','Hip bone.r',[-.0678138,.8151411,-.0474347],[.011,.016],.00055,.00014,[-.3,-.18,-1],.25),
    ('acromioclavicular-facet','Scapula.r',[-.1506989,1.4142492,-.0373252],[.0045,.0025],-.0002,0,[1,.35,.12],.13)]:
    h=nearest(name,seed);changes[key]=ellipsoid_brush(name,h[0],h[1],rs,depth,rough,flatten=key.endswith('facet'));p,n=area(key,name,h[0],rs,[key]);set_anchor(key,name,p,direction,distance)
anchors['acromioclavicular-facet'].update(contextPatterns=['Clavicle.r'],ghostContext=True)
# Preserve the triangular shin and enhance only its anterior apex. Trace a length,
# so a crest cannot be mistaken for an unrelated isolated bump.
o=bones['Tibia.r'];ps=positions(o);crest=[]
for i in range(34):
    y=.135+i*(.390-.135)/33;section=[p for p in ps if abs(p[1]-y)<.0023]
    if section:crest.append(max(section,key=lambda p:p[2]))
for v in o.data.vertices:
    p=Vector(web(v.co));dist=min((p-Vector(q)).length for q in crest)
    if dist<.0028:v.co=vec(p+Vector((0,0,.00055))*(1-(dist/.0028)**2)**2)
o.data.update()
for smooth in range(5):crest=[crest[0]]+[list((Vector(crest[i-1])+2*Vector(crest[i])+Vector(crest[i+1]))/4)for i in range(1,len(crest)-1)]+[crest[-1]]
crest=[list(tree(o).find_nearest(Vector(q)+Vector((0,0,.001)))[0])for q in crest];changes['anterior-border-of-tibia']={'source':'Anterior-most points of native triangular-shaft cross sections','maxReliefMm':.55};guide_path('anterior-border-of-tibia','Tibia.r',crest,['anterior-border-of-tibia','anterior-border-of-the-tibia']);set_anchor('anterior-border-of-tibia','Tibia.r',crest[20],[.35,.04,1],.67,viewSpan=.28)
# Diaphysis: a representative shaft surface plus long axis extent, not one dot.
ps=positions(bones['Humerus.r']);shaft=[]
for y in [1.145+i*(1.354-1.145)/24 for i in range(25)]:
    section=[p for p in ps if abs(p[1]-y)<.0028]
    if section:shaft.append(max(section,key=lambda p:p[2]))
guide_path('shaft-of-humerus','Humerus.r',shaft,['shaft-of-humerus','shaft-of-the-humerus']);p,n=area('shaft-of-humerus','Humerus.r',[-.19,1.265,-.023],[.008,.09],['shaft-of-humerus','shaft-of-the-humerus'],[0,0,1]);set_anchor('shaft-of-humerus','Humerus.r',p,[.12,.05,1],.72)
# A fossa is presented as a representative surface in the basin below the spine.
p,n=area('infraspinous-fossa','Scapula.r',byid['infraspinous-fossa']['representation']['points'][0]['point'],[.024,.033],['infraspinous-fossa'],[0,0,-1]);set_anchor('infraspinous-fossa','Scapula.r',p,[0,.08,-1],.29)
p,n=area('lesser-tubercle','Humerus.r',byid['lesser-tubercle']['representation']['points'][0]['point'],[.0045,.0055],['lesser-tubercle']);set_anchor('lesser-tubercle','Humerus.r',p,[-.45,.2,1],.18)
# Follow the real occipital/parietal junction instead of the earlier point below it.
occ=positions(bones['Occipital bone']);par=tree(bones['Parietal bone.r']);candidates=[]
for p in occ:
    if -.065<p[0]<.004 and p[1]>1.60 and p[2]<-.055:
        hit=par.find_nearest(Vector(p))
        if hit[3]<.0014:candidates.append((p,hit[3]))
suture=[]
for i in range(28):
    x=-.060+i*.060/27;pool=[p for p,dist in candidates if abs(p[0]-x)<.0023]
    if pool:suture.append(min(pool,key=lambda p:p[2]))
assert len(suture)>10,'No native suture boundary found';guide_path('lambdoid-suture','Occipital bone',suture,['lambdoid-suture']);set_anchor('lambdoid-suture','Occipital bone||Parietal bone.r||Parietal bone.l',suture[len(suture)//2],[0,.1,-1],.32)
# Native medial ramus already has a real mandibular aperture; restore its source
# resolution and view. Do not drill another hole next to the original.
mp=byid['mandibular-foramina']['representation']['points'][0]['point'];mh=nearest('Mandible',mp);set_anchor('mandibular-foramina','Mandible',mh[0],[1,.07,.22],.105,cutaway={'normal':[-1,0,0],'constant':-.001})
anchors['mandibular-foramina']['verificationNote']='Native source mandibular aperture retained; inferior alveolar nerve route and medial-ramus render reviewed.'
# Reconstruct the bony exit only along the terminal source sigmoid-sinus route.
sig=routes['Sigmoid sinus.r'][0];jpath=sig[52:]+[list(Vector(sig[-1])+Vector((.002,-.013,.005)))];cut=curve_object('Jugular source-route cutter',jpath,.0032);bpy.context.view_layer.objects.active=cut;cut.select_set(True);bpy.ops.object.convert(target='MESH');cut=bpy.context.object;rem=cut.modifiers.new('Watertight source-route cutter','REMESH');rem.mode='VOXEL';rem.voxel_size=.00035;bpy.ops.object.modifier_apply(modifier=rem.name)
def difference_parts(o,cutter):
    original=topology(o);bm=bmesh.new();bm.from_mesh(o.data);bm.verts.ensure_lookup_table();groups=[];seen=set()
    for v in bm.verts:
        if v in seen:continue
        group=set();stack=[v]
        while stack:
            q=stack.pop()
            if q in seen:continue
            seen.add(q);group.add(q);stack.extend(e.other_vert(q)for e in q.link_edges)
        groups.append(group)
    verts=[];faces=[]
    for gi,g in enumerate(groups):
        vs=list(g);idx={v:i for i,v in enumerate(vs)};partfaces=[[idx[v]for v in f.verts]for f in bm.faces if all(v in g for v in f.verts)]
        part=create('Boolean component', [web(v.co)for v in vs],partfaces);bpy.context.view_layer.objects.active=part;mod=part.modifiers.new('Source-aligned jugular aperture','BOOLEAN');mod.operation='DIFFERENCE';mod.solver='EXACT';mod.object=cutter;bpy.ops.object.modifier_apply(modifier=mod.name)
        print('BOOLEAN_PART',o.name,gi,len(vs),len(part.data.vertices),len(partfaces),len(part.data.polygons),flush=True);offset=len(verts);verts.extend([v.co[:]for v in part.data.vertices]);faces.extend([[offset+i for i in p.vertices]for p in part.data.polygons]);bpy.data.objects.remove(part,do_unlink=True)
    bm.free();assert len(verts)>original['vertices']*.75,(o.name,'Unacceptable Boolean vertex loss');me=bpy.data.meshes.new(o.name+' reviewed aperture');me.from_pydata(verts,[],faces);me.update();me.materials.append(BONE);o.data=me
    for f in me.polygons:f.use_smooth=True
for n in ['Temporal bone.r','Occipital bone']:difference_parts(bones[n],cut)
bpy.data.objects.remove(cut,do_unlink=True);jp=Vector(sig[-1]);set_anchor('jugular-foramen','Temporal bone.r||Occipital bone',jp,[0,-1,.10],.15,requiredContext=['Temporal bone.r','Occipital bone'],reviewStatus='modeled-opening-verified')
changes['jugular-foramen']={'source':'Terminal source Sigmoid sinus.r curve, extended inferiorly to reveal its bony exit','path':jpath,'radiusMm':3.2,'note':'Reconstructed teaching morphology. Caliber and local margin are explanatory, not clinical measurements.'}
# Build a cropped flexed-knee specimen from the real source bones. Femur stays
# fixed; tibia/fibula translate along their anatomical AP axis, not whole-leg swing.
pivot=Vector((-.079,.438,-.029));rot=Matrix.Rotation(-math.pi/2,3,'X');drawer={}
for name,role in [('Femur.r','fixed'),('Tibia.r','moving'),('Fibula.r','moving')]:
    dd=source[name];o=create('Drawer specimen - '+name,dd['verts'],dd['faces'],BONE if role=='fixed'else PARENT)
    bm=bmesh.new();bm.from_mesh(o.data);level=pivot.y+(.145 if role=='fixed'else -.145)
    result=bmesh.ops.bisect_plane(bm,geom=list(bm.verts)+list(bm.edges)+list(bm.faces),dist=1e-7,plane_co=vec([0,level,0]),plane_no=vec([0,1,0]),clear_outer=role=='fixed',clear_inner=role=='moving')
    cut_edges=[e for e in result['geom_cut']if isinstance(e,bmesh.types.BMEdge)and e.is_boundary]
    if cut_edges:bmesh.ops.holes_fill(bm,edges=cut_edges,sides=0)
    bm.to_mesh(o.data);bm.free()
    for v in o.data.vertices:v.co=vec(rot@(Vector(web(v.co))-pivot)if role=='fixed'else Vector(web(v.co))-pivot)
    o.data.update();o['zname']=o.name;o['detailGroup']='drawer-knee';o['motionRole']=role;o['anatomicalRegion']='Joints';o['source']='Cropped native Z-Anatomy right knee, posed in Blender at 90 degrees of flexion';o['license']='CC BY-SA 4.0';drawer[name]={'role':role,'faces':len(o.data.polygons),'vertices':len(o.data.vertices),'croppedAndCapped':True,'poseDegrees':90 if role=='fixed'else 0}
# Conchae need an explicit teaching cutaway: the native medial wall and air-cell
# surfaces obscure the thin nasal shelves. Preserve adult Ethmoid unchanged.
# Two thin curled lamellae are reconstructed using the textbook's relative size,
# level and lateral-wall attachments; dimensions are qualitative.
ed=source['Ethmoid bone'];wall=create('Ethmoid cutaway context',ed['verts'],ed['faces']);bm=bmesh.new();bm.from_mesh(wall.data)
bmesh.ops.bisect_plane(bm,geom=list(bm.verts)+list(bm.edges)+list(bm.faces),dist=1e-7,plane_co=vec([-.008,0,0]),plane_no=vec([1,0,0]),clear_outer=True,clear_inner=False);bm.to_mesh(wall.data);bm.free();wall.data.update()
wall['zname']=wall.name;wall['detailGroup']='ethmoid-conchae';wall['anatomicalRegion']='Skull';wall['source']='Native right ethmoid lateral wall with a planar medial cut for teaching';wall['license']='CC BY-SA 4.0'
concha=[]
for label,z0,z1,base,width,drop in [('Superior concha of right ethmoid',.033,.052,1.596,.0048,.0025),('Middle concha of right ethmoid',.037,.074,1.588,.0080,.0040)]:
    vs=[];fs=[];rows,cols=40,20
    for j in range(rows+1):
        t=j/rows;taper=.18+.82*math.sin(math.pi*t)**.45
        for i in range(cols+1):
            angle=2.65*i/cols;vs.append([-.0125+width*taper*math.sin(angle),base-drop*taper*(1-math.cos(angle)),z0+(z1-z0)*t])
    for j in range(rows):
        for i in range(cols):
            a=j*(cols+1)+i;fs.append([a,a+1,a+cols+2,a+cols+1])
    o=create(label,vs,fs);bpy.context.view_layer.objects.active=o;mod=o.modifiers.new('Thin bony lamella','SOLIDIFY');mod.thickness=.00045;mod.offset=0;bpy.ops.object.modifier_apply(modifier=mod.name);o['zname']=label;o['detailGroup']='ethmoid-conchae';o['anatomicalRegion']='Skull';o['source']='Blender teaching reconstruction of a curved ethmoid nasal concha, OpenStax 7.12-7.13';o['license']='CC BY-SA 4.0';o['teachingMorphology']=True
    middle=(rows//2)*(cols+1)+cols//2;point=max([web(o.data.vertices[middle].co),web(o.data.vertices[middle+(rows+1)*(cols+1)].co)],key=lambda p:p[0]);concha.append({'point':point,'parent':label,'label':'Superior nasal concha'if label.startswith('Superior')else'Middle nasal concha'})
    patch=o.copy();patch.data=o.data.copy();patch.name='Focus surface - '+label;patch.data.materials.clear();patch.data.materials.append(GUIDE);bpy.context.collection.objects.link(patch);feature='superior-nasal-concha' if label.startswith('Superior') else 'middle-nasal-concha';tags(patch,['superior-and-middle-nasal-conchae',feature,'textbook-'+feature],label);patch['focusSpecimen']='ethmoid-conchae'
anchors['superior-and-middle-nasal-conchae']={'kind':'teaching-pin','detailGroup':'ethmoid-conchae','parentPattern':'Ethmoid cutaway context||Superior concha of right ethmoid||Middle concha of right ethmoid','points':concha,'view':{'center':[-.010,1.589,.052],'direction':[1,.25,.36],'distance':.105},'isolateContext':True,'contextPatterns':[],'cutaway':None,'teachingMorphology':True,'focusGuide':True,'reviewStatus':'source-aligned-teaching-refinement','verificationNote':'Right nasal-wall teaching cutaway; two conchae are parts of ethmoid, not independent bones. Adult source Ethmoid is retained for other features.'}
changes['superior-and-middle-nasal-conchae']={'method':'Thin curved lamellae attached to the right ethmoid wall, distinct upper small and lower larger shelves; midline obstruction omitted in separate teaching specimen','thicknessMm':.45,'sourceFigures':['7.12','7.13'],'limits':'Qualitative textbook-based reconstruction, not a scan or complete segmentation.'}
# Mark a continuous open corridor, not a single lateral intervertebral opening.
canal=[]
for n in ['Vertebra L1','Vertebra L2','Vertebra L3','Vertebra L4','Vertebra L5']:
    sd=source[n];vs=[Vector(p)for p in sd['verts']];cy=(min(p.y for p in vs)+max(p.y for p in vs))/2+.003;bt=BVHTree.FromPolygons(sd['verts'],sd['faces']);hits=[];start=Vector((0,cy,.2))
    for k in range(12):
        hit=bt.ray_cast(start,Vector((0,0,-1)),.5)
        if hit[0] is None:break
        hits.append(hit[0].z);start=hit[0]+Vector((0,0,-.00001))
    gaps=[(a-b,a,b)for a,b in zip(hits[1::2],hits[2::2])if a-b>.004]
    assert gaps,(n,'No median vertebral corridor found');gap,a,b=max(gaps);canal.append([-.0002,cy,(a+b)/2])
guide_path('vertebral-canal','Vertebra L3',canal,['vertebral-canal']);anchors['vertebral-canal']={**byid['vertebral-canal']['representation'],'points':[{'point':p,'parent':'Vertebra L'+str(i+1),'label':'Canal at lumbar level '+str(i+1)}for i,p in enumerate(canal) if i in [0,2,4]],'singlePinIndex':1,'view':{'center':canal[2],'direction':[1,.09,.05],'distance':.34},'focusGuide':True}
changes['vertebral-canal']={'method':'Median ray intersections identify the empty corridor between body and posterior arch at five real lumbar levels','path':canal,'limits':'Line indicates the space continuing between foramina, not the spinal cord or a segmented canal wall.'}
# Editable feature empties and native coordinates are saved with the sculpt.
for key,a in anchors.items():
    empty=bpy.data.objects.new('Landmark - '+key,None);bpy.context.collection.objects.link(empty);empty.location=vec(a['points'][0]['point']);empty.empty_display_type='SPHERE';empty.empty_display_size=.0007;empty['canonicalFeature']=key;empty['pointWeb']=a['points'][0]['point']
geometry={n:{'verts':positions(o),'faces':triangles(o)}for n,o in bones.items()};after={n:topology(o)for n,o in bones.items()}
for n,info in after.items():assert info['boundaryComponents']<=before[n]['boundaryComponents']+1,(n,'New disconnected boundary')
for key,a in anchors.items():a['note']='Source geometry restored and feature presentation reviewed. Area/trace is a visual identification guide, not complete segmentation.';a['refinement']='Source-aligned exam clarity';a['focusGuide']=True
(W/'clarity-anchors.json').write_text(json.dumps(anchors,indent=2),encoding='utf-8');(W/'clarity-geometry.json').write_text(json.dumps(geometry),encoding='utf-8');(W/'clarity-evidence.json').write_text(json.dumps({'blenderVersion':bpy.app.version_string,'backup':snapshot.name,'before':before,'after':after,'changes':changes,'guides':guides,'drawer':drawer,'limits':'Authored teaching refinements. Software geometry checks are not an independent anatomist review.'},indent=2),encoding='utf-8')
bpy.ops.wm.save_as_mainfile(filepath=str(project));backup('Before exporting reviewed working exam model',[export]);bpy.ops.object.select_all(action='SELECT');bpy.ops.export_scene.gltf(filepath=str(export),export_format='GLB',use_selection=True,export_extras=True,export_yup=True,export_animations=False,export_apply=True)
print('EXAM_MODEL_AUTHORED',json.dumps({'bones':len(bones),'features':len(anchors),'guides':len(guides),'after':after}),flush=True)
