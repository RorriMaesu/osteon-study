import {Box3,Vector3} from 'three';

// These Z-Anatomy exports baked a reflection into vertex positions without
// reversing the triangle order or shading normals. Some nodes contain both
// left and right structures; in those nodes only mirrored pieces need repair.
// Lumen linings, cut faces, HRA donors and the separately prepared eye coats
// have distinct meanings and are outside this list.
const audited=new Map([
  ['assets/organ-atlas/registered-organs.glb',new Set((
    'frontal_lobes parietal_lobes occipital_lobes temporal_lobes insulae limbic_lobes cerebellum '+
    'pons_left medulla_oblongata_left midbrain_left thalamus_left upper_teeth lower_teeth skin '+
    'helix_left lobule_of_auricle_left tympanic_membrane_left malleus_left incus_left stapes_left cochlea_right '+
    'lacrimal_gland_left lacrimal_canaliculus_left lacrimal_sac_left nasolacrimal_duct_left '+
    'superior_parathyroid_gland_left inferior_parathyroid_gland_left palatine_tonsil_left '+
    'major_alar_cartilage_left inferior_nasal_concha_bone_left arytenoid_cartilage_left '+
    'parotid_gland_left parotid_duct_right submandibular_gland_right submandibular_duct_right sublingual_gland_left '+
    'external_anal_sphincter_left testis_left epididymis_left ductus_deferens_right ejaculatory_duct_right seminal_gland_left'
  ).split(' '))],
  ['assets/ap2-neuro/brain.glb',new Set((
    'region_Right_frontal_lobe region_Right_parietal_lobe region_Right_occipital_lobe region_Right_temporal_lobe '+
    'region_Insula region_Cerebellum region_Thalamus region_Midbrain region_Pons region_Medulla_oblongata'
  ).split(' '))],
  ['assets/ap2-neuro/outer-ear.glb',new Set((
    'region_Auricle region_Tympanic_membrane region_Malleus region_Incus region_Stapes region_Cochlear_nerve region_Vestibular_nerve'
  ).split(' '))],
  ['assets/ap2-neuro/long-cord.glb',new Set((
    'region_Dorsal_roots region_Ventral_roots region_Dorsal_root_ganglia region_Medulla_oblongata'
  ).split(' '))]
]);

function connectedPieces(pos,index){
  const owner=new Int32Array(pos.count),seams=new Map();
  function root(i){
    while(owner[i]!==i){owner[i]=owner[owner[i]];i=owner[i];}
    return i;
  }
  // glTF can split one surface at a shared geometric vertex for shading.
  // Weld only the connectivity lookup; positions, normals and seams stay intact.
  for(let i=0;i<pos.count;i++){
    const key=[pos.getX(i),pos.getY(i),pos.getZ(i)].map(v=>Math.round(v*1e6)).join(',');
    const known=seams.get(key);
    owner[i]=known??i;
    if(known===undefined)seams.set(key,i);
  }
  for(let i=0;i<index.count;i+=3){
    const a=root(index.getX(i));
    owner[root(index.getX(i+1))]=a;owner[root(index.getX(i+2))]=a;
  }
  for(let i=0;i<owner.length;i++)owner[i]=root(i);
  return owner;
}

export function orientOrganSurface(mesh,asset,name){
  if(!audited.get(asset)?.has(name))return;
  const original=mesh.geometry,pos=original.getAttribute('position'),index=original.index;
  if(!index||!pos)return;
  const owner=connectedPieces(pos,index),components=new Map();
  const a=new Vector3(),b=new Vector3(),c=new Vector3();
  for(let i=0;i<pos.count;i++){
    const id=owner[i];
    if(!components.has(id))components.set(id,{bounds:new Box3(),center:new Vector3(),volume:0,count:0});
    components.get(id).bounds.expandByPoint(a.fromBufferAttribute(pos,i));
  }
  const pieces=[...components.values()];
  for(const part of pieces)part.bounds.getCenter(part.center);
  for(let i=0;i<index.count;i+=3){
    const first=index.getX(i),part=components.get(owner[first]);
    a.fromBufferAttribute(pos,first).sub(part.center);
    b.fromBufferAttribute(pos,index.getX(i+1)).sub(part.center);
    c.fromBufferAttribute(pos,index.getX(i+2)).sub(part.center);
    part.volume+=a.dot(b.cross(c));
    part.count++;
  }
  const inward=new Set();
  for(const [id,part] of components){
    if(part.volume>=0)continue;
    // The skin includes open regional sheets. A signed volume alone cannot
    // orient an open sheet. Match it to the opposite donor skin patch first.
    if(name==='skin'){
      const reflected=a.copy(part.center);
      reflected.x=-reflected.x;
      const counterpart=pieces.some(peer=>peer.volume>0&&Math.abs(peer.count-part.count)<=part.count*.4&&
        peer.center.distanceTo(reflected)<.002);
      if(!counterpart)continue;
    }
    inward.add(id);
  }
  if(!inward.size)return;
  const geometry=original.clone(),faces=geometry.index,normals=geometry.getAttribute('normal');
  for(let i=0;i<faces.count;i+=3)if(inward.has(owner[index.getX(i)])){
    faces.setX(i+1,index.getX(i+2));faces.setX(i+2,index.getX(i+1));
  }
  if(normals){
    for(let i=0;i<normals.count;i++)if(inward.has(owner[i]))
      normals.setXYZ(i,-normals.getX(i),-normals.getY(i),-normals.getZ(i));
  }else geometry.computeVertexNormals();
  mesh.geometry=geometry;
}
