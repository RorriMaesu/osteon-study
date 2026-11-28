"""Derive the adult female whole-body study map from HRA United Female v1.10.

Blender 4.5 -b --factory-startup --disable-autoexec --python-exit-code 1
  -P export_female_body.py -- SOURCE.glb REPOSITORY BACKUP_DIRECTORY

Only the named gross-anatomy surfaces in GROUPS are used. A plus includes the
listed source node and its descendants. All transforms are baked from the source
hierarchy, including its source-to-body registration, without scaling organs.
"""
import hashlib
import json
import os
import shutil
import struct
import sys
import uuid
from collections import defaultdict
from pathlib import Path

import bpy
import numpy as np
from mathutils import Matrix, Quaternion, Vector

SOURCE_SHA = "95f0c3d2f918582608692ca1139e8bdb18c147a16470e9ee9af8b276bd77c422"
UT = "Urinary"
RP = "Reproductive"
DG = "Digestive"
CV = "Cardiovascular"
RS = "Respiratory"
LI = "Lymphatic and immune"

# Each display surface has a separate triangle budget; small source meshes
# pass through unchanged. Color codes are illustrative sRGB tissue finishes.
def surface(name, source, triangles, color):
    return name, source.split(), triangles, color

def pair(base, source, triangles, color):
    return [surface(base+"_"+side, source.replace("{s}", suffix), triangles, color)
            for side, suffix in (("left","L"),("right","R"))]

GROUPS = [
    ("skin","Skin surface","Integumentary",[surface("skin","skin",28000,"be9580")]),
    # The Allen reference uses a different hemisphere naming convention than
    # the united body's left/right positions. Preserve its full registered
    # surface as one gross structure without assigning side-specific labels.
    ("brain","Brain","Nervous",[surface("brain","+Allen_brain_hemisphere_L +Allen_brain_hemisphere_R",32000,"bd9d91")]),
    ("spinal-cord","Spinal cord","Nervous",[surface("spinal_cord","+spinal_cord",3000,"d6c69c")]),
    ("eyes","Eyes","Special senses",pair("sclera","sclera_{s}",950,"e5ded0")
     +pair("iris","iris_{s}",650,"644d37")+pair("pupil","pupil_{s}",250,"302b28")),
    ("teeth","Teeth",DG,[surface("upper_teeth","set_of_upper_jaw_teeth",2800,"f1eee6"),
                          surface("lower_teeth","set_of_lower_jaw_teeth",2800,"f1eee6")]),
    ("tongue","Tongue",DG,[surface("tongue","posterior_part_of_tongue dorsal_tongue ventral_tongue",1900,"ae6c6b")]),
    ("parotid-glands","Parotid glands",DG,pair("parotid_gland","parotid_gland_{s}",850,"c59775")),
    ("submandibular-glands","Submandibular glands",DG,pair("submandibular_gland","submandibular_gland_{s}",700,"c29974")),
    ("sublingual-glands","Sublingual glands",DG,pair("sublingual_gland","sublingual_gland_{s}",600,"d2a17f")),
    ("tonsils","Palatine tonsils",LI,pair("palatine_tonsil","palatine_tonsil_{s}",450,"a07977")),
    ("larynx","Larynx",RS,[surface("laryngeal_cartilages","+laryngeal_cartilage",1400,"b4a689")]),
    ("trachea","Trachea",RS,[surface("trachea","trachea tracheal_cartilage carina",1700,"c6ae97")]),
    ("bronchi","Main bronchi",RS,[surface("left_main_bronchus","left_main_bronchus cartilage_of_main_bronchus_L",650,"c3a491"),
                                  surface("right_main_bronchus","right_main_bronchus cartilage_of_main_bronchus_R",650,"c3a491")]),
    ("lungs","Lungs",RS,[surface(name,"+"+source,3500,"b88181") for name,source in (
        ("left_lung_upper_lobe","L_lung_upper_lobe"),("left_lung_lower_lobe","L_lung_lower_lobe"),
        ("right_lung_upper_lobe","R_lung_upper_lobe"),("right_lung_middle_lobe","R_lung_middle_lobe"),
        ("right_lung_lower_lobe","R_lung_lower_lobe"))]),
    ("heart","Heart",CV,[surface(source,source,1700,"9f5e59") for source in
                         ("left_cardiac_atrium","left_ventricle","right_cardiac_atrium","right_ventricle","interventricular_septum")]),
    ("aorta","Aorta",CV,[surface("aortic_arch","aortic_arch",700,"ac6e62"),
                         surface("ascending_aorta","ascending_aorta",700,"ac6e62"),
                         surface("descending_aorta","+descending_aorta",1200,"ac6e62")]),
    ("venae-cavae","Superior and inferior venae cavae",CV,[surface("superior_vena_cava","superior_vena_cava",700,"837389"),
                                                          surface("inferior_vena_cava","+inferior_vena_cava",900,"837389")]),
    ("thymus","Thymus",LI,pair("thymic_lobe","thymus_lobe_{s}",700,"be9185")),
    ("spleen","Spleen",LI,[surface("spleen","+spleen",2200,"8d616e")]),
    ("liver","Liver",DG,[surface("liver","capsule_of_the_liver bare_area_of_liver",3500,"865041")]),
    ("gallbladder","Gallbladder and bile duct",DG,[surface("gallbladder","gallbladder",800,"91a37d"),
                                                  surface("common_bile_duct","common_bile_duct",350,"91a37d")]),
    ("pancreas","Pancreas",DG,[surface("pancreas","+pancreas",2000,"c3a17b")]),
    ("small-intestine","Small intestine",DG,[surface("duodenum","+duodenum",850,"c39183"),
                                            surface("jejunum","jejenum",3000,"c39183"),
                                            surface("ileum","ileum ileum_terminal",3000,"c39183")]),
    ("large-intestine","Large intestine",DG,[surface(source,source,950,"b18778") for source in
        ("caecum","ascending_colon","hepatic_flexure_of_colon","transverse_colon","splenic_flexure_of_colon","descending_colon","sigmoid_colon")]),
    ("appendix","Vermiform appendix",DG,[surface("vermiform_appendix","vermiform_appendix",500,"b18778")]),
    ("rectum","Rectum",DG,[surface("rectum","rectum",900,"b18778")]),
    ("kidneys","Kidneys",UT,pair("kidney","kidney_capsule_{s} hilum_of_kidney_{s}",2100,"9e6056")),
    ("ureters","Ureters",UT,[surface(side+"_ureter",side+"_ureter",700,"c5ae88") for side in ("left","right")]),
    ("bladder","Urinary bladder",UT,[surface("urinary_bladder","fundus_of_urinary_bladder_dome urinary_bladder_neck_smooth_muscle fundus_of_urinary_bladder_base trigone_of_urinary_bladder",1300,"b98b7a")]),
    ("ovaries","Ovaries",RP,[surface(side+"_ovary",side+"_ovary",750,"c6a78e") for side in ("left","right")]),
    ("uterine-tubes","Uterine tubes",RP,pair("uterine_tube","+fallopian_tube_{s}",1200,"c58682")),
    ("uterus","Uterus",RP,[surface("body_of_uterus","body_of_uterus cornua lower_uterine_segment posterior_wall_of_uterus anterior_wall_of_uterus",1650,"b47974"),
                          surface("fundus_of_uterus","fundus_of_uterus",650,"b47974")]),
    ("cervix","Cervix",RP,[surface("cervix","cervix",650,"ba8980")]),
    ("vagina","Vagina",RP,[surface("vaginal_wall","vagina",850,"bb8886")]),
    ("mammary-glands","Mammary glands and ducts",RP,pair("mammary_lobes","mammary_lobes_{s}",1800,"c89c85")
     +pair("lactiferous_ducts","main_lactiferous_ducts_{s} main_lactiferous_sinuses_{s}",1100,"d7b687")
     +pair("nipple","nipple_{s} areola_{s}",650,"ab8071")),
]
BONE_SPECS = [surface(name,source,limit,"d9c4a6") for name,source,limit in [
    ("sternum","sternum manubrium",900),("pelvic_bones","sacrum coccyx ilium_compact_bone_R ilium_compact_bone_L",4000),
    ("vertebral_column","+vertebra",6300),("left_leg_bones","femur_L patella_L tibia_L fibula_L",1900),
    ("right_leg_bones","femur_R patella_R tibia_R fibula_R",1900)]]


def safeguard(path, backup):
    if path.exists():
        digest=hashlib.sha256(path.read_bytes()).hexdigest()
        target=backup / f"{path.stem}-{digest}{path.suffix}"
        backup.mkdir(parents=True,exist_ok=True)
        if not target.exists():
            shutil.copy2(path,target)
        if hashlib.sha256(target.read_bytes()).hexdigest()!=digest:
            raise RuntimeError("Backup verification failed for "+str(path))


def build(source, repo, backup):
    with source.open("rb") as f:
        if hashlib.file_digest(f,"sha256").hexdigest()!=SOURCE_SHA:
            raise ValueError("Expected the United Female v1.10 reference file")
        f.seek(12)
        length,kind=struct.unpack("<II",f.read(8))
        if kind!=0x4e4f534a:
            raise ValueError("Missing glTF document")
        data=json.loads(f.read(length))
        f.read(8)
        binary=np.memmap(source,dtype="u1",mode="r",offset=f.tell())
    nodes=data["nodes"]
    names=defaultdict(list)
    for i,node in enumerate(nodes):
        names[node["name"].removeprefix("VH_F_")].append(i)
    world={}
    def visit(i, parent):
        n=nodes[i]
        x,y,z,w=n.get("rotation",(0,0,0,1))
        local=Matrix.LocRotScale(Vector(n.get("translation",(0,0,0))),
             Quaternion((w,x,y,z)),Vector(n.get("scale",(1,1,1))))
        world[i]=parent@local
        for child in n.get("children",[]): visit(child,world[i])
    # glTF (X,Y-up,Z-forward) to Blender (X,-Y-forward,Z-up).
    to_blender=Matrix(((1,0,0,0),(0,0,-1,0),(0,1,0,0),(0,0,0,1)))
    for i in data["scenes"][data.get("scene",0)]["nodes"]: visit(i,to_blender)
    def accessor(index):
        a=data["accessors"][index]
        view=data["bufferViews"][a["bufferView"]]
        dtype=np.dtype({5121:"u1",5123:"<u2",5125:"<u4",5126:"<f4"}[a["componentType"]])
        width={"SCALAR":1,"VEC3":3}[a["type"]]
        return np.ndarray((a["count"],width),dtype=dtype,buffer=binary,
                 offset=view.get("byteOffset",0)+a.get("byteOffset",0),
                 strides=(view.get("byteStride",dtype.itemsize*width),dtype.itemsize))
    def gather(i,recursive):
        if "mesh" in nodes[i]: yield i
        if recursive:
            for child in nodes[i].get("children",[]): yield from gather(child,True)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    colors={}
    def material(hexvalue):
        if hexvalue not in colors:
            m=bpy.data.materials.new("Illustrative "+hexvalue)
            rgb=[int(hexvalue[i:i+2],16)/255 for i in (0,2,4)]
            m.diffuse_color=tuple(v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in rgb)+(1,)
            m.roughness=.32 if hexvalue=="f1eee6" else .58
            colors[hexvalue]=m
        return colors[hexvalue]
    def make(spec):
        out, selectors, budget, color=spec
        indices=[]
        for s in selectors:
            found=names[s.removeprefix("+")]
            if len(found)!=1: raise ValueError((s,found))
            indices.extend(gather(found[0],s.startswith("+")))
        if not indices or len(indices)!=len(set(indices)): raise ValueError(out)
        positions=[]; faces=[]; offset=0
        for i in indices:
            transform=np.asarray(world[i],dtype=np.float64)
            for prim in data["meshes"][nodes[i]["mesh"]]["primitives"]:
                if prim.get("mode",4)!=4: raise ValueError(out)
                local=accessor(prim["attributes"]["POSITION"])
                positions.append((local@transform[:3,:3].T+transform[:3,3]).astype(np.float32))
                tris=accessor(prim["indices"]).astype(np.int32).reshape(-1,3)
                if np.linalg.det(transform[:3,:3])<0: tris=tris[:,[0,2,1]]
                faces.append(tris+offset); offset+=len(local)
        vertices=np.concatenate(positions); tris=np.concatenate(faces)
        mesh=bpy.data.meshes.new(out)
        mesh.vertices.add(len(vertices));mesh.vertices.foreach_set("co",vertices.ravel())
        mesh.loops.add(tris.size);mesh.loops.foreach_set("vertex_index",tris.ravel())
        mesh.polygons.add(len(tris));mesh.polygons.foreach_set("loop_start",np.arange(0,tris.size,3,dtype=np.int32))
        mesh.polygons.foreach_set("use_smooth",np.ones(len(tris),dtype=bool))
        mesh.update(calc_edges=True)
        obj=bpy.data.objects.new(out,mesh);bpy.context.collection.objects.link(obj)
        mesh.materials.append(material(color)); obj["name"]=out
        if len(tris)>budget:
            weld=obj.modifiers.new("Join coincident donor vertices","WELD")
            weld.merge_threshold=0.000001
            dec=obj.modifiers.new("Web detail","DECIMATE");dec.ratio=budget/len(tris)
        return obj
    records=[]
    for key,title,system,specs in GROUPS:
        for s in specs: make(s)
        row=dict(id=key,label=title,system=system,targets=[s[0] for s in specs])
        if key=="skin":row["contextOnly"]=True
        records.append(row)
    for s in BONE_SPECS: make(s)
    target=repo/"assets/organ-atlas/female-body.glb";catalog=repo/"src/organ-female-surfaces.json"
    # Write to a fresh output, then replace only after verifying backups.
    stage=target.with_name(f"female-body-{uuid.uuid4().hex}.glb")
    bpy.ops.export_scene.gltf(filepath=str(stage),export_format="GLB",export_apply=True,export_extras=True,
                             export_yup=True,export_animations=False,export_texcoords=False,export_cameras=False)
    safeguard(target,backup);safeguard(catalog,backup)
    os.replace(stage,target)
    catalog.write_text(json.dumps(dict(organs=records,boneNames=[s[0] for s in BONE_SPECS]),indent=2)+"\n",encoding="utf-8")


if __name__=="__main__":
    build(*(Path(arg) for arg in sys.argv[sys.argv.index("--")+1:]))
