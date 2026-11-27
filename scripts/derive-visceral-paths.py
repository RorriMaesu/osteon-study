"""Derive illustrative centerlines from the distributed, unmodified GLBs.

Usage: python scripts/derive-visceral-paths.py (requires numpy, scipy and trimesh).
Lengths are model units. Open tubes use the centroids of their terminal mesh rings.
Distances along the connected triangle surface keep bends in the centerline.
For the discontinuous bowel preparations use a single connected source segment.
"""
from pathlib import Path
import json
import numpy as np
from scipy.sparse import coo_matrix
from scipy.sparse.csgraph import connected_components, dijkstra
from scipy.spatial import cKDTree
import trimesh

ROOT=Path(__file__).resolve().parents[1]
scenes={}
paths={}
def scene(asset):
    if asset not in scenes:
        p=ROOT/'assets'/asset
        sc=trimesh.load(p,process=False,force='scene')
        parts={}
        for name in sc.graph.nodes_geometry:
            transform,g=sc.graph[name]
            mesh=sc.geometry[g].copy()
            mesh.apply_transform(transform)
            mesh.merge_vertices(merge_tex=True,merge_norm=True)
            parts[name]=mesh
        scenes[asset]=parts
    return scenes[asset]

def graph(mesh):
    edge=mesh.edges_unique
    lengths=np.linalg.norm(mesh.vertices[edge[:,0]]-mesh.vertices[edge[:,1]],axis=1)
    return coo_matrix((lengths,edge.T),shape=(len(mesh.vertices),len(mesh.vertices))).tocsr()

def derive(key,asset,name,start,end,ring=False,samples=36,near=None):
    meshes=scene(asset)
    mesh=meshes[name]
    net=graph(mesh)
    _,labels=connected_components(net,directed=False)
    largest=np.argmax(np.bincount(labels))
    if near:
        # The mammary collection has many separate branching surfaces. Study
        # the terminal segment closest to the actual segmented nipple.
        neighbors=cKDTree(meshes[near].vertices)
        sizes=np.bincount(labels)
        candidates=[i for i in range(len(sizes)) if sizes[i]>=40]
        largest=min(candidates,key=lambda i:neighbors.query(mesh.vertices[labels==i])[0].min())
    mesh=mesh.submesh([np.flatnonzero(labels[mesh.faces[:,0]]==largest)],append=True)
    v=mesh.vertices
    net=graph(mesh)
    def anchor(a):
        if isinstance(a,(list,tuple)):
            return np.linalg.norm(v-np.array(a),axis=1).argmin()
        if a[0] in '+-':
            axis='xyz'.index(a[1])
            return v[:,axis].argmax() if a[0]=='+' else v[:,axis].argmin()
        if a[0]=='>':
            return cKDTree(meshes[a[1:]].vertices).query(v)[0].argmax()
        if a[0]=='~':
            return np.where(cKDTree(meshes[a[1:]].vertices).query(v)[0]<.0002)[0]
        return cKDTree(meshes[a].vertices).query(v)[0].argmin()
    starts=np.atleast_1d(anchor(start));ends=np.atleast_1d(anchor(end))
    if ring:
        boundary=mesh.edges_unique[np.bincount(mesh.edges_unique_inverse)==1]
        bgraph=coo_matrix((np.ones(len(boundary)),boundary.T),shape=net.shape).tocsr()
        _,bpart=connected_components(bgraph,directed=False)
        groups=[np.where(bpart==k)[0] for k in np.unique(bpart[boundary[:,0]])]
        if len(groups)==2:
            if np.linalg.norm(v[groups[0]].mean(0)-v[starts[0]])>np.linalg.norm(v[groups[1]].mean(0)-v[starts[0]]):
                groups.reverse()
            starts,ends=groups
    d0=dijkstra(net,directed=False,indices=starts,min_only=True)
    d1=dijkstra(net,directed=False,indices=ends,min_only=True)
    fraction=d0/np.maximum(d0+d1,1e-12)
    curve=[]
    for t in np.linspace(0,1,samples):
        weights=np.exp(-.5*((fraction-t)/(.65/(samples-1)))**2)
        curve.append(np.average(v,weights=weights,axis=0))
    if ring and len(starts)>1 and len(ends)>1:
        # Regular cylindrical strips in the donor use successive rings with
        # the same number of vertices. Their means track the observed lumen.
        layer=dijkstra(net,directed=False,indices=starts,min_only=True,unweighted=True).astype(int)
        counts=np.bincount(layer)
        if np.all(counts==len(starts)):
            rings=np.array([v[layer==i].mean(0) for i in range(len(counts))])
            distances=np.r_[0,np.cumsum(np.linalg.norm(np.diff(rings,axis=0),axis=1))]
            curve=np.stack([np.interp(np.linspace(0,distances[-1],samples),distances,rings[:,axis]) for axis in range(3)],axis=1)
    if len(starts)>1:curve[0]=v[starts].mean(0)
    if len(ends)>1:curve[-1]=v[ends].mean(0)
    paths[key]=np.round(curve,6).tolist()
    print(key, 'length',round(np.linalg.norm(np.diff(curve,axis=0),axis=1).sum(),4), 'start',np.round(curve[0],3),'end',np.round(curve[-1],3))

gut='ap3-models/alimentary-tract.glb'
duct='ap3-models/accessory-ducts.glb'
urine='ap3-models/urinary-tract.glb'
male='ap3-models/sperm-route.glb'
female='ap2-glands/ovarian-region.glb'
placenta='ap2-glands/placenta.glb'
derive('esophagus',gut,'esophagus','+y','stomach')
derive('stomach',gut,'stomach',[.080,1.108,.121],'duodenum')
derive('duodenum',gut,'duodenum','stomach','jejunum')
derive('jejunal-segment',gut,'jejunum','-x','+x')
derive('ileal-segment',gut,'ileum','-x','+x')
derive('ascending-colon',gut,'ascending_colon','-y','transverse_colon')
derive('transverse-colon',gut,'transverse_colon','ascending_colon','descending_colon')
derive('descending-colon',gut,'descending_colon','transverse_colon','~sigmoid_colon')
distal_colon='ap3-models/distal-colon.glb'
derive('sigmoid-colon',distal_colon,'sigmoid_colon','~descending_colon','~rectum',ring=True,samples=64)
derive('rectum',distal_colon,'rectum','~sigmoid_colon','-y',samples=48)
# At the sharp distal bend, an average of vertices with similar geodesic
# distance can land outside the wall. Center the distal portion in successive
# transverse sections of the outer rectal surface.
rectal_wall=max(scene(distal_colon)['rectum'].split(only_watertight=False),key=lambda part:part.area)
rectal_path=[p for p in paths['rectum'] if p[1]>=.018]
for height in np.linspace(rectal_path[-1][1],rectal_wall.bounds[0,1]+.0003,81)[1:]:
    segments=trimesh.intersections.mesh_plane(rectal_wall,[0,1,0],[0,height,0])[:,:,[0,2]]
    if not len(segments):continue
    lo,hi=segments.min(axis=(0,1)),segments.max(axis=(0,1))
    x,z=np.meshgrid(np.linspace(lo[0],hi[0],61),np.linspace(lo[1],hi[1],61))
    inside=np.zeros_like(x,dtype=bool);distance=np.full_like(x,np.inf)
    for a,b in segments:
        delta=b-a
        if abs(delta[1])>1e-12:
            inside^=((a[1]>z)!=(b[1]>z))&(x<(a[0]+(z-a[1])*delta[0]/delta[1]))
        fraction=np.clip(((x-a[0])*delta[0]+(z-a[1])*delta[1])/max(delta@delta,1e-20),0,1)
        distance=np.minimum(distance,(x-a[0]-fraction*delta[0])**2+(z-a[1]-fraction*delta[1])**2)
    if not np.any(inside):raise ValueError('Missing rectal cross-section')
    # A fold can create two clear spaces on one horizontal section. Follow
    # the connected space from above so the tracer cannot jump across a fold.
    prior=rectal_path[-1]
    score=np.sqrt(distance)-.55*np.hypot(x-prior[0],z-prior[2])
    idx=np.argmax(np.where(inside,score,-np.inf))
    rectal_path.append([x.flat[idx],height,z.flat[idx]])
paths['rectum']=np.round(rectal_path,6).tolist()
derive('portal-inflow',duct,'hepatic_portal_vein','-y','+y',True,22)
derive('pancreatic-duct',duct,'pancreatic_duct','+x','duodenum')
derive('cystic-duct',duct,'cystic_duct','gallbladder','bile_duct',True,18)
derive('common-bile-duct',duct,'bile_duct','cystic_duct','duodenum',True)
for side in ('left','right'):
    derive('ureter-'+side,urine,'ureter_'+side,'renal_pelvis_'+side,'urinary_bladder',True)
    derive('renal-artery-'+side,urine,side+'_renal_artery',('-x' if side=='left' else '+x'),'kidney_'+side,True,20)
derive('urethra',urine,'urethra','urinary_bladder','+z',True,48)
derive('epididymis',male,'epididymis_left','+y','-y')
derive('ductus',male,'ductus_deferens_left','epididymis_left','illustrative_terminal_ductus_left',True,55)
derive('terminal-ductus',male,'illustrative_terminal_ductus_left','ductus_deferens_left','ejaculatory_duct_left',True)
derive('ejaculatory-duct',male,'ejaculatory_duct_left','+y','urethra',True)
derive('left-infundibulum',female,'VH_F_uterine_tube_infundibulum_L','VH_F_fibria_of_uterine_tube_L','VH_F_ampulla_of_uterine_tube_L',True,22)
derive('left-ampulla',female,'VH_F_ampulla_of_uterine_tube_L','VH_F_uterine_tube_infundibulum_L','VH_F_isthmus_of_fallopian_tube_L',True)
derive('left-isthmus',female,'VH_F_isthmus_of_fallopian_tube_L','VH_F_ampulla_of_uterine_tube_L','VH_F_cornua',True,20)
derive('uterine-body',female,'VH_F_body_of_uterus','VH_F_fundus_of_uterus','VH_F_lower_uterine_segment')
derive('cervix',female,'VH_F_cervix','VH_F_internal_cervical_os','VH_F_external_cervical_os',True)
derive('placental-artery',placenta,'VH_F_umbilical_artery_1','+z','VH_F_chorionic_plate',True)
derive('placental-vein',placenta,'VH_F_umbilical_vein','VH_F_chorionic_plate','+z',True)
registered='organ-atlas/registered-organs.glb'
breast='organ-atlas/mammary-glands.glb'
for gland in ('parotid','submandibular'):
    for side in ('left','right'):
        derive(gland+'-'+side,registered,gland+'_duct_'+side,gland+'_gland_'+side,'+z',True,28)
# The pharynx is an open sheet. These illustrative midline/posterolateral
# points sit anterior to its observed posterior wall, clear of the larynx.
paths['oropharynx']=[[0,1.537,.047],[0,1.536,.032],[0,1.531,.022],[.003,1.520,.017],[.005,1.510,.015]]
paths['laryngopharynx']=[[.005,1.510,.015],[.006,1.501,.013],[.005,1.491,.011],[.003,1.482,.006],[.001,1.474,.004]]
derive('cecum',registered,'cecum','-y','+y',False,22)
derive('appendix',registered,'vermiform_appendix','+x','cecum',False,28)
mid=np.array(paths['appendix'][10])
wall=scene(registered)['vermiform_appendix'].vertices
paths['appendix-wall']=np.round([mid,wall[np.linalg.norm(wall-mid,axis=1).argmin()]],6).tolist()
derive('breast-duct',breast,'VH_F_main_lactiferous_ducts_L','-z','VH_F_nipple_L',False,36,near='VH_F_nipple_L')
derive('breast-terminal',breast,'VH_F_main_lactiferous_sinuses_L','-z','VH_F_nipple_L',False,22,near='VH_F_nipple_L')
for side,letter in [('left','L'),('right','R')]:
    derive('female-ureter-'+side,'organ-atlas/female-urinary.glb','VH_F_'+side+'_ureter',
        'VH_F_renal_pelvis_'+letter,'VH_F_ureteral_orifice_'+letter,True,40)
urinary_f='organ-atlas/female-urinary.glb'
derive('minor-calyx',urinary_f,'VH_F_minor_calyx_L_e','>VH_F_major_calyx_L_b','~VH_F_major_calyx_L_b',False,14)
derive('major-calyx',urinary_f,'VH_F_major_calyx_L_b','~VH_F_minor_calyx_L_e','~VH_F_renal_pelvis_L',False,18)
derive('female-renal-pelvis',urinary_f,'VH_F_renal_pelvis_L','~VH_F_major_calyx_L_b','VH_F_left_ureter',False,18)
# The ureter track begins at the center of its cut rim. The renal-pelvis
# surface track ends on its edge. Continue to the rim center for a continuous
# route into the ureter. Use the same handoff for the adjoining calyces.
paths['major-calyx'][0] = paths['minor-calyx'][-1]
paths['female-renal-pelvis'].append(paths['female-ureter-left'][0])

# The sublingual gland has many small ducts that are absent from the gross
# model. Symbols end at the actual superior surface instead of drawing a duct.
for side in ('left','right'):
    v=scene(registered)['sublingual_gland_'+side].vertices
    top=v[v[:,1].argmax()]
    paths['sublingual-'+side]=np.round([top+[0,.0003,0],top+[0,.0035,0]],6).tolist()

# Gross-to-gross ovulation overlay. Endpoints are nearest exterior vertices.
ov=scene(female)['VH_F_left_ovary'].vertices
fi=scene(female)['VH_F_fibria_of_uterine_tube_L'].vertices
distance,mate=cKDTree(fi).query(ov); k=distance.argmin()
paths['oocyte-capture']=np.round([ov[k],fi[mate[k]],paths['left-infundibulum'][0]],6).tolist()
# These centerlines are defined in the original teaching-model construction.
paths['vagina']=[[.18,.17,.02],[.11,-.06,.06],[-.09,-.33,.08],[-.22,-.63,.1]]
paths['female-urethra']=[[-.47,-.07,.03],[-.50,-.27,.08],[-.50,-.52,.08]]
paths['filtration-barrier']=[[0,.51,0],[0,.35,0],[0,.22,0],[.025,.08,0],[.08,-.107,0],[.08,-.39,0]]
nephron='ap3-models/nephron-pair.glb'
for key,mesh,begin,finish in [
    ('proximal-tubule','cortical_proximal_tubule','cortical_glomerular_capsule','cortical_loop'),
    ('nephron-loop','cortical_loop','cortical_proximal_tubule','cortical_distal_tubule'),
    ('distal-tubule','cortical_distal_tubule','cortical_loop','shared_collecting_duct'),
    ('collecting-duct','shared_collecting_duct','+y','-y')
]:
    derive(key,nephron,mesh,begin,finish,ring=True,samples=64)
paths['milk-duct']=[[-.35,.23,.03],[-.23,.01,.05],[0,-.2,.03],[0,-.47,.04],[0,-.75,.06]]
path=ROOT/'src/organ-motion-visceral-paths.json'
path.write_text('{\n'+',\n'.join('  '+json.dumps(k)+':'+json.dumps(v,separators=(',',':')) for k,v in paths.items())+'\n}\n',encoding='utf-8')
