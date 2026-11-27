const all=()=>true;
const inTrunk=regex=>name=>regex.test(name);
export const vesselRegions={
  all:{label:'All reference vessels',include:all,note:'Explore the full set of named surfaces in this reference specimen. Choose a structure and use Focus selection to inspect a small branch. Regional views group vessels by the route they serve.'},
  arch:{label:'Aortic arch',include:inTrunk(/aortic_arch|ascending_aorta|descending_aorta|brachiocephalic_artery|left_common_carotid|left_subclavian/),note:'Follow the arch into the brachiocephalic trunk, left common carotid artery and left subclavian artery.'},
  pulmonary:{label:'Pulmonary arteries and veins',direction:[.15,.12,-1],include:inTrunk(/pulmonary_(trunk|artery|vein)/),note:'Start behind the heart. The pulmonary trunk divides into left and right arteries carrying blood to the lungs. Four veins return blood to the left atrium. The capillary beds lie between these two vessel groups.'},
  portal:{label:'Hepatic portal system',include:inTrunk(/portal_vein|mesenteric_vein|splenic_vein|hepatic_vein|vena_cava/),note:'Compare portal blood entering the liver with hepatic venous blood returning to the inferior vena cava.'},
  kidneys:{label:'Renal circulation',include:inTrunk(/renal_(artery|vein)|descending_aorta|vena_cava/),note:'Trace each artery from the aorta to its kidney. Compare the lengths and courses of the renal veins draining to the inferior vena cava.'},
  gut:{label:'Celiac and mesenteric arteries',include:inTrunk(/celiac_trunk|mesenteric_artery|colic_artery|ileocolic_artery|sigmoid_artery|splenic_artery|hepatic_artery|descending_aorta/),note:'Compare the celiac trunk with the superior and inferior mesenteric arteries. Follow their major branches toward foregut, midgut and hindgut territories.'},
  caval:{label:'Trunk venous return',include:inTrunk(/brachiocephalic_vein|vena_cava|iliac_vein|renal_vein|hepatic_vein/),note:'Compare the brachiocephalic veins entering the superior vena cava with the common iliac veins forming the inferior vena cava.'},
  upper:{label:'Right arm and hand circulation',asset:'ap2-arm-circulation',include:all,note:'Start at the brachiocephalic trunk. Trace the subclavian, axillary and brachial arteries to the radial and ulnar arteries and palmar arches. Then follow a superficial or deep venous route back to the right atrium. Pale bones mark the joints.'},
  leg:{label:'Right leg and foot arteries',asset:'ap2-leg-vessels',include:all,note:'Follow the femoral artery through the adductor hiatus to the popliteal artery. Trace the anterior tibial artery across the front of the ankle to dorsalis pedis.'},
  legReturn:{label:'Foot to right atrium · veins',asset:'ap2-leg-venous-return',include:all,note:'From the dorsum of the foot, follow the great saphenous vein to the femoral vein, then the external and common iliac veins and inferior vena cava. Compare with the deep route through the popliteal vein.'}
};
export const vesselPresets=['arch','pulmonary','portal','kidneys','gut','caval','upper','leg','legReturn','all'].map(key=>[key,vesselRegions[key].label]);
export function vesselLabel(name){
  let text=name.replace(/^VH_M_|^context_/,'').replace(/_([LR])_(inf|sup)$/,(all,s,level)=>(s==='L'?'_left':'_right')+(level==='inf'?'_inferior':'_superior')).replace(/_([LR])$/,(all,s)=>s==='L'?'_left':'_right');
  // Source segments sharing an anatomical name are kept identifiable.
  text=text.replace(/_([ab])$/,(all,s)=>' · segment '+s.toUpperCase()).replaceAll('_',' ');
  const pulmonary=text.match(/^pulmonary (vein|artery) (left|right)(?: (inferior|superior))?$/);
  if(pulmonary)return [pulmonary[2],pulmonary[3],'pulmonary',pulmonary[1]].filter(Boolean).join(' ');
  text=text.replace('opthalmic','ophthalmic').replace(/^(.*) (left|right)$/,'$2 $1');
  return text.replace('diagonal branch of anterior descending branch of left coro','diagonal branch of the left anterior descending artery');
}

