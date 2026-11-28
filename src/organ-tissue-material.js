import * as THREE from 'three';
import {orientOrganSurface} from './organ-surface-orientation.js';

// Exact donor assets and gross surfaces. Microscopy, cutaway teaching models and
// flow markers keep their own colors, even when they contain the same organ words.
const grossAssets = new Set([
  'assets/organ-atlas/registered-organs.glb', 'assets/ap2-heart.glb', 'assets/ap2-thorax.glb',
  'assets/organ-atlas/female-urinary.glb', 'assets/organ-atlas/mammary-glands.glb',
  ...['body-overview','bodyparts-locator','body-gut','body-brain-landmarks','upper-abdomen','cranial-glands',
      'neck','ovarian-region','testicular-region','ovary-v1.3','pancreas-v1.3','placenta']
    .map(id=>'assets/ap2-glands/'+id+'.glb'),
  ...['brain','long-cord','outer-ear','eye-section','tongue'].map(id=>'assets/ap2-neuro/'+id+'.glb'),
  ...['lung-lobes','fuel-organs','accessory-ducts','alimentary-tract','distal-colon','sperm-route','urinary-tract','immune-organs']
    .map(id => 'assets/ap3-models/'+id+'.glb')
]);

// sRGB base, roughness, strength of broad color variation, spatial frequency.
// These are illustrative surface finishes; no disease markings or invented vessels.
const profiles = {
  liver: ['#864632', .32, .25, 3.4],
  vein: ['#86636a', .45, .08, 3],
  artery: ['#ad776a', .49, .09, 3],
  lung: ['#bf8d8f', .44, .29, 7.5],
  muscle: ['#9c5854', .53, .16, 4.0],
  heart: ['#a26459', .40, .19, 4.4],
  kidney: ['#985a4d', .36, .17, 4],
  spleen: ['#865561', .35, .18, 4],
  gut: ['#c7988b', .41, .16, 4],
  pancreas: ['#c7a17e', .55, .21, 7],
  gallbladder: ['#919475', .36, .10, 4],
  thyroid: ['#a16554', .46, .16, 6], adrenal: ['#d0a868', .54, .14, 5],
  gland: ['#c79986', .53, .12, 5], ovary: ['#cdb9a9', .50, .12, 5],
  testis: ['#d3c3b3', .39, .09, 4], uterus: ['#b07b79', .44, .14, 4],
  neural: ['#c6b1a7', .49, .09, 4], nerve: ['#d1c5a7', .50, .06, 3],
  sclera: ['#dfdcd4', .40, .05, 4], tongue: ['#bd8787', .52, .15, 8],
  adipose: ['#d7b981', .49, .14, 5], urinary: ['#c8a195', .47, .09, 4],
  placenta: ['#915759', .44, .15, 5], cord: ['#c4b8b6', .43, .08, 4]
};
const names = [
  [/^liver$/, 'liver'], [/^(hepatic_portal|portal|splenic)_vein$/, 'vein'],
  [/^(superior|middle|inferior)_lobe_of_(right|left)_lung$/, 'lung'],
  [/^diaphragm$/, 'muscle'],
  [/^(wall_of_)?(left|right)_(atrium|ventricle)$|^(left|right)_cardiac_atrium$|^heart_(left|right)_ventricle$/, 'heart'],
  [/^(left|right)_renal_artery$|^(left|right)_pulmonary_artery$|^(left|right)_coronary_artery$|^(ascending|thoracic|abdominal)_aorta$|^aortic_arch$|^pulmonary_trunk$/, 'artery'],
  [/^(great|middle|small|anterior)_cardiac_vein$|^(superior|inferior)_vena_cava($|_(thoracic|abdominal)_part$)/, 'vein'],
  [/^kidney_(left|right)$|^(left|right)_kidney$/, 'kidney'], [/^spleen$/, 'spleen'],
  [/^(esophagus|stomach|duodenum|jejunum|ileum|cecum|rectum|vermiform_appendix)$|^(ascending|transverse|descending|sigmoid)_colon$/, 'gut'],
  [/^pancreas$|^(body|tail|head|neck)_of_pancreas$|^uncinate_process_of_the_pancreas$/, 'pancreas'], [/^gallbladder$/, 'gallbladder'],
  [/^thyroid(_gland)?$/, 'thyroid'], [/^(left|right)_adrenal$|^suprarenal_gland_(left|right)$/, 'adrenal'],
  [/^((left|right)_(superior|inferior)_parathyroid|(superior|inferior)_parathyroid_gland_(left|right))$/, 'gland'],
  [/^(pineal(_gland)?|pituitary|adenohypophysis|neurohypophysis|thymus|(left|right)_lobe_of_thymus|prostate)$/, 'gland'],
  [/^(parotid|submandibular|sublingual|lacrimal)_gland_(left|right)$|^region_sublingual_glands$|^mammary_lobes_[lr]$/, 'gland'],
  [/^(left|right)_ovary$/, 'ovary'], [/^testis_(left|right)$|^(left|right)_testis$/, 'testis'],
  [/^(uterus|fundus_of_uterus|body_of_uterus|(anterior|posterior)_wall_of_uterus|cervix)$/, 'uterus'],
  [/^(frontal|parietal|temporal|occipital|limbic)_lobes$|^(region_)?(insulae?|cerebellum|brainstem|hypothalamus)$/, 'neural'],
  [/^region_(left|right)_(frontal|parietal|occipital|temporal)_lobe$|^(left|right)_(superior|middle|inferior)_frontal_gyrus$/, 'neural'],
  [/^(region_)?(pons|midbrain|medulla_oblongata|thalamus)(_(left|right))?$/, 'neural'],
  [/^region_(spinal_cord|cauda_equina|ventral_roots|dorsal_roots|lingual_nerve|chorda_tympani|glossopharyngeal_nerve|cochlear_nerve|vestibular_nerve)$/, 'nerve'],
  [/^sclera(_(left|right))?$/, 'sclera'], [/^(region_)?tongue$/, 'tongue'],
  [/^fat_[lr]$/, 'adipose'],
  [/^placenta$/, 'placenta'], [/^umbilical_cord$/, 'cord'],
  [/^umbilical_artery_[12]$/, 'artery'], [/^umbilical_vein$/, 'vein'],
  [/^(urinary_bladder|bladder|(left|right)_ureter|ureter_(left|right)|fundus_of_urinary_bladder_(dome|base)|urinary_bladder_neck_smooth_muscle)$/, 'urinary']
];

export function organTissueKind(asset, raw){
  if(!grossAssets.has(asset))return;
  const name=String(raw).replace(/^VH_[MF]_/, '').toLowerCase();
  if(asset==='assets/ap2-heart.glb'){
    if(/artery$|^left_marginal_branch$|^pulmonary_trunk$/.test(name))return 'artery';
    if(/vein|coronary_sinus/.test(name))return 'vein';
  }
  return names.find(([pattern])=>pattern.test(name))?.[1];
}

// glTF's unnamed default has no material definition and defaults to metallic.
// An authored white material, a mapped white material, and a missing material
// must remain distinguishable even when their three.js color values match.
const definitions=new WeakMap();
const namedMeshes=new WeakMap();
// Open donor patches and teaching cutaways with verified boundary edges.
// A single-sided material culls their inward face when viewed from the cut.
const openSurfaces=new Map([
  ['assets/ap2-neuro/skin-receptors.glb',new Set(['region_Pacinian_corpuscle'])],
  ['assets/organ-atlas/registered-organs.glb',new Set(['concha_of_auricle_left','concha_of_auricle_right','neurohypophysis'])],
  ['assets/organ-atlas/mammary-glands.glb',new Set(['VH_F_suspensory_ligaments_L','VH_F_suspensory_ligaments_R'])]
]);
export function registerOrganMaterials(gltf){
  gltf.scene.traverse(mesh=>{
    if(!mesh.isMesh)return;
    for(let node=mesh;node;node=node.parent){
      const index=gltf.parser.associations.get(node)?.nodes;
      const name=gltf.parser.json.nodes?.[index]?.name;
      if(name){namedMeshes.set(mesh,name);break;}
    }
    for(const mat of [].concat(mesh.material)){
      const index=gltf.parser.associations.get(mat)?.materials;
      definitions.set(mat,gltf.parser.json.materials?.[index]||null);
    }
  });
  return gltf.scene;
}

function restCoordinates(geometry){
  if(geometry.hasAttribute('organRest'))return;
  const pos=geometry.getAttribute('position');
  geometry.computeBoundingBox();
  const {min,max}=geometry.boundingBox;
  const unit=65535/Math.max(max.x-min.x,max.y-min.y,max.z-min.z,1e-10);
  const coords=new Uint16Array(pos.count*3);
  for(let i=0;i<pos.count;i++){
    coords[i*3]=Math.round((pos.getX(i)-min.x)*unit);
    coords[i*3+1]=Math.round((pos.getY(i)-min.y)*unit);
    coords[i*3+2]=Math.round((pos.getZ(i)-min.z)*unit);
  }
  geometry.setAttribute('organRest',new THREE.BufferAttribute(coords,3,true));
}

// Trilinear value noise sampled in three dimensions. Quantized rest coordinates
// follow the mesh through deformation and never require a UV seam or image map.
const tissueShader = `
varying vec3 vOrganRest;
uniform vec3 tissueColor;
uniform vec3 teachingColor;
uniform vec3 tissueFinish;
uniform vec3 tissueCueColor;
uniform float tissueCueAmount;
uniform float naturalMode;
float tissueHash(vec3 p) {
  p = fract(p * vec3(.1031,.1030,.0973));
  p += dot(p, p.yxz + 33.33);
  return fract((p.x + p.y) * p.z);
}
float tissueNoise(vec3 p) {
  vec3 i=floor(p), f=fract(p);
  f=f*f*(3.0-2.0*f);
  vec3 d=vec3(0.,1.,0.);
  return mix(mix(mix(tissueHash(i),tissueHash(i+d.yxx),f.x),
                 mix(tissueHash(i+d.xyx),tissueHash(i+d.yyx),f.x),f.y),
             mix(mix(tissueHash(i+d.xxy),tissueHash(i+d.yxy),f.x),
                 mix(tissueHash(i+d.xyy),tissueHash(i+d.yyy),f.x),f.y),f.z);
}`;

const finishes=new WeakMap();
function finishSurface(mat, kind, mode, definition){
  const [color,roughness,strength,frequency]=profiles[kind];
  const authoredColor=definition?.pbrMetallicRoughness?.baseColorFactor;
  const hasArtwork=Boolean(mat.map||mat.vertexColors);
  const base=new THREE.Color(color);
  if(authoredColor)base.fromArray(authoredColor);
  else if(hasArtwork)base.set(0xffffff);
  const sourceRoughness=definition?.pbrMetallicRoughness?.roughnessFactor;
  const finish=new THREE.Vector3(sourceRoughness??roughness,hasArtwork?0:strength,frequency);
  const teaching=mat.color.clone();
  const cue={value:0},cueColor={value:new THREE.Color()};
  finishes.set(mat,{kind,mode,definition,cue,cueColor,teaching});
  mat.onBeforeCompile=shader=>{
    Object.assign(shader.uniforms,{
      naturalMode:mode, tissueColor:{value:base}, teachingColor:{value:teaching}, tissueFinish:{value:finish},
      tissueCueAmount:cue, tissueCueColor:cueColor
    });
    shader.vertexShader=shader.vertexShader.replace('#include <common>',
      '#include <common>\nattribute vec3 organRest;\nvarying vec3 vOrganRest;')
      .replace('#include <begin_vertex>','#include <begin_vertex>\nvOrganRest=organRest;');
    shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\n'+tissueShader)
      .replace('#include <map_fragment>', `
        float tissueAmount = 0.0;
        float tissueDetail = 0.0;
        // Colored picks and animations that change the base paint take precedence.
        if (naturalMode > 0.5 && distance(diffuse, mix(teachingColor,tissueCueColor,tissueCueAmount)) < 0.0001) {
          tissueAmount = 1.0;
          vec3 p=vOrganRest*tissueFinish.z;
          tissueDetail=(tissueNoise(p+2.1)-0.5)+0.36*(tissueNoise(p*3.7+9.4)-0.5);
          diffuseColor.rgb=mix(tissueColor*(1.0+tissueFinish.y*tissueDetail),tissueCueColor,tissueCueAmount);
        }
        #include <map_fragment>`)
      .replace('#include <roughnessmap_fragment>', `
        #include <roughnessmap_fragment>
        #ifndef USE_ROUGHNESSMAP
          roughnessFactor=mix(roughnessFactor,clamp(tissueFinish.x+tissueDetail*tissueFinish.y*.2,.08,1.0),tissueAmount);
        #endif`);
  };
  mat.customProgramCacheKey=()=> 'osteon-gross-tissue-v1';
}

export function cloneOrganMaterial(source){
  const clone=source.clone(),finish=finishes.get(source);
  if(finish)finishSurface(clone,finish.kind,finish.mode,finish.definition);
  return clone;
}

export function tintOrganMaterial(mat,base,color,amount){
  mat.color.copy(base).lerp(color,amount);
  const finish=finishes.get(mat);
  if(finish){finish.cueColor.value.copy(color);finish.cue.value=amount;}
}

// A few native stations apply their legend after loading and then change the
// current color for blind questions. Remember only the unselected legend paint.
export function rememberOrganTeachingColor(mat,color){
  finishes.get(mat)?.teaching.set(color);
}

export function createOrganAppearance(initial='natural'){
  const mode={value:initial==='teaching'?0:1};
  const donors=new Set();
  let surfaces=0;
  return {
    get available(){return surfaces>0;},
    get mode(){return mode.value?'natural':'teaching';},
    setMode(value){mode.value=value==='teaching'?0:1;},
    prepare(mesh,asset,teachingColor){
      let kind;
      const name=namedMeshes.get(mesh);
      orientOrganSurface(mesh,asset,name||mesh.name);
      if(name)kind=organTissueKind(asset,name);
      else if(grossAssets.has(asset)){
        for(let obj=mesh;obj&&!kind;obj=obj.parent){
          kind=organTissueKind(asset,obj.userData.name)||organTissueKind(asset,obj.name);
        }
      }
      const open=openSurfaces.get(asset)?.has(name||mesh.name);
      if(teachingColor==null&&!kind&&!open)return;
      const wasArray=Array.isArray(mesh.material),original=[].concat(mesh.material);
      const materials=original.map(donor=>{
        const mat=donor.clone(),definition=definitions.get(donor);
        if(open)mat.side=THREE.DoubleSide;
        donors.add(donor);
        const authoredPaint=Boolean(mat.map||mat.vertexColors);
        const ownColor=wasArray&&mat.color&&teachingColor?.isColor&&teachingColor.equals(original[0].color);
        if(teachingColor!=null&&mat.color&&!authoredPaint&&!ownColor)mat.color.set(teachingColor);
        if(mat.isMeshStandardMaterial&&definition===null&&!authoredPaint){
          mat.metalness=0;mat.roughness=.8;
        }
        if(kind&&mat.isMeshStandardMaterial){
          restCoordinates(mesh.geometry);
          finishSurface(mat,kind,mode,definition);
          surfaces++;
        }
        return mat;
      });
      mesh.material=wasArray?materials:materials[0];
    },
    dispose(){for(const mat of donors)mat.dispose();donors.clear();}
  };
}
