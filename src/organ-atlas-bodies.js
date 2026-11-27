import {bodyAtlas,motionsForBody,motionById} from './organ-atlas-catalog.js';
import meshes from './ap3-specimens-meshes.json' with {type:'json'};

import nodeInventory from './lymph-node-models.json' with {type:'json'};
import nerveInventory from './nerve-models.json' with {type:'json'};

function regionalGroups(records,prefix,system,actionIds){
  const regions={head:'Head',neck:'Neck',thorax:'Thorax',abdomen:'Abdomen',pelvis:'Pelvis','upper-limb':'Upper limb','lower-limb':'Lower limb',spine:'Spinal roots',trunk:'Trunk'};
  return [...new Set(records.map(row=>row.bucket))].map(bucket=>({id:bucket,label:regions[bucket],system,actionIds,targets:records.filter(row=>row.bucket===bucket).map(row=>prefix+row.key)}));
}
const pelvis='assets/ap2-glands/ovarian-region.glb';
const parts=meshes[pelvis];
const pelvicRow=(id,label,pattern)=>({id,label,system:'Reproductive',targets:parts.filter(n=>pattern.test(n))});
export const bodyMaps=[
  {...bodyAtlas,key:'body',title:'Organs in the body',label:'Whole body · adult male',description:'Registered adult male anatomy',skeletonAsset:'assets/skeleton.glb'},
  {key:'lymphatic',title:'Regional lymph nodes',label:'Lymph nodes on the skeleton',description:'Selected node groups · registered adult anatomy',asset:'assets/lymph-nodes-overview.glb',skeletonAsset:'assets/skeleton.glb',organs:regionalGroups(nodeInventory.structures.filter(row=>row.overview),'Node | ','Lymphatic',['lymph-node','lymphatic-drainage'])},
  {key:'peripheral',title:'Peripheral nerves',label:'Peripheral nerves on the skeleton',description:'Selected peripheral nerves · registered adult anatomy',asset:'assets/nerves-overview.glb',skeletonAsset:'assets/skeleton.glb',organs:regionalGroups(nerveInventory.structures.filter(row=>row.overview&&row.category==='peripheral'),'Nerve | ','Nervous',['peripheral-nerve'])},
  {key:'pregnancy',title:'Placenta and umbilical cord',label:'Full-term placenta',description:'Human Reference Atlas · full-term preparation',asset:'assets/ap2-glands/placenta.glb',direction:[.15,.5,1],organs:[{id:'placenta',label:'Placenta and umbilical cord',system:'Reproductive',targets:meshes['assets/ap2-glands/placenta.glb']}]},
  {key:'pelvis',title:'Female pelvis and urinary tract',label:'Female pelvis and urinary tract',description:'Visible Human Female · registered regional anatomy',asset:pelvis,extraAssets:['assets/organ-atlas/female-urinary.glb'],direction:[.08,.5,1],
    boneNames:parts.filter(n=>/ilium|ischium|pubis|sacrum|coccyx/.test(n)),organs:[
      pelvicRow('ovaries','Ovaries',/ovary/),pelvicRow('uterine-tubes','Uterine tubes',/tube|ostium/),
      pelvicRow('uterus','Uterus',/body_of_uterus|wall_of_uterus|cornua|fundus_of_uterus|lower_uterine/),
      pelvicRow('cervix','Cervix',/cervix|cervical_os|cervicovaginal/),
    {id:'female-ureters',label:'Ureters',system:'Urinary',targets:['VH_F_left_ureter','VH_F_right_ureter','VH_F_ureteral_orifice_L','VH_F_ureteral_orifice_R']},
    {id:'female-bladder',label:'Urinary bladder',system:'Urinary',targets:['VH_F_fundus_of_urinary_bladder_dome','VH_F_urinary_bladder_neck_smooth_muscle','VH_F_fundus_of_urinary_bladder_base','VH_F_trigone_of_urinary_bladder']},
    {id:'female-collecting-system',label:'Calyces and renal pelves',system:'Urinary',targets:['L','R'].flatMap(side=>['VH_F_renal_pelvis_'+side,...[...'abcdefghij'].map(i=>'VH_F_minor_calyx_'+side+'_'+i),...[...(side==='L'?'abcd':'abc')].map(i=>'VH_F_major_calyx_'+side+'_'+i)])}
  ]},
  {key:'mammary',title:'Mammary glands',label:'Mammary glands',description:'Human Reference Atlas · bilateral preparation',asset:'assets/organ-atlas/mammary-glands.glb',
    organs:[{id:'mammary-glands',label:'Mammary glands and ducts',actionIds:['mammary-glands','mammary-alveoli'],system:'Reproductive',targets:['L','R'].flatMap(side=>['areolar_tubercles','nipple','areola','mammary_lobes','main_lactiferous_ducts','main_lactiferous_sinuses','suspensory_ligaments'].map(n=>'VH_F_'+n+'_'+side))}]},
  {key:'pelvic-section',title:'Pelvic outlets and vulva',label:'Pelvic outlets · teaching model',description:'Sagittal teaching reconstruction · anterior to the left',asset:'assets/ap3-models/pelvic-section.glb',boneNames:['pubic_symphysis'],organs:[
    {id:'vagina',label:'Vagina',system:'Reproductive',targets:['vagina']},{id:'vulva',label:'Vulva',system:'Reproductive',targets:['clitoris','labia_majora','labia_minora']},
    {id:'uterus',label:'Uterus',system:'Reproductive',targets:['uterine_body']},{id:'cervix',label:'Cervix',system:'Reproductive',targets:['cervix']},
    {id:'female-bladder',label:'Bladder',system:'Urinary',targets:['bladder']},{id:'female-urethra',label:'Urethra',system:'Urinary',targets:['urethra']},
    {id:'rectum',label:'Rectum',system:'Digestive',targets:['rectum']}
  ]}
];
export function mapForKey(key){return bodyMaps.find(m=>m.key===key);}
export function mapRoute(map,row){return 'organs/'+map.key+(row?'/'+row.id:'');}
export function mappedActions(map,row){
  if(row.actionIds)return row.actionIds.map(id=>motionById.get(id)).filter(Boolean);
  const specific=motionsForBody(row.id);
  const usesPreparation=entry=>entry.asset===map.asset||map.extraAssets?.includes(entry.asset);
  return specific.sort((a,b)=>Number(b.id===row.id)-Number(a.id===row.id)||Number(!!usesPreparation(b))-Number(!!usesPreparation(a)));
}
export function locationForEntry(entry){
  const matches=bodyMaps.flatMap(map=>map.organs.filter(r=>mappedActions(map,r).includes(entry)).map(row=>({map,row})));
  const rank=({map,row})=>(row.id===entry.id?100:0)+(map.asset===entry.asset||map.extraAssets?.includes(entry.asset)?20:0)-Math.max(0,entry.bodyIds?.indexOf(row.id)??0);
  const match=matches.sort((a,b)=>rank(b)-rank(a))[0];
  // A general process such as saltatory conduction applies to an entire preparation.
  if(match&&match.row.actionIds&&match.map.organs.length>1&&match.map.organs.every(row=>row.actionIds?.includes(entry.id)))return {map:match.map};
  return match;
}
