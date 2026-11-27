import * as THREE from 'three';
import {mountVisceralMotion} from './organ-motion-visceral.js';

const text='https://openstax.org/books/anatomy-and-physiology-2e/pages/';
const gold='#ffcf66', aqua='#71eff0';
const phase=(at,label,explanation)=>({at,label,text:explanation});
const cue=(mesh,span,color)=>({mode:'cue',mesh,span,color});

// Centerlines match the curves in scripts/build-ap3-teaching-models.mjs.
// Sampling their original splines keeps the moving symbols inside curved ducts.
function tracer(waypoints,span,color){
  const curve=new THREE.CatmullRomCurve3(waypoints.map(p=>new THREE.Vector3(...p)));
  return {mode:'trace',points:curve.getPoints(40).map(p=>p.toArray()),span,color};
}
const thoracic=[[0,.08,.23],[-.05,.62,.24],[-.04,.87,.26],[.09,1.10,.26],[.17,1.32,.27],[.31,1.27,.24]];
const rightDuct=[[-.48,1.35,.27],[-.39,1.32,.29],[-.31,1.27,.24]];
const capillary=[[0,.85,.13],[.20,.63,.14],[.32,.14,.15],[.28,-.42,.15],[.30,-.91,.12]];
const venule=[[.30,-.91,.12],[.40,-1.02,.14],[.58,-1.10,.13]];
const lacteal=[[0,.65,.07],[.02,.10,.09],[-.03,-.6,.08],[0,-1.09,.05]];

export const exchangeOrgans=[
  {id:'lymphatic-drainage',title:'Lymphatic ducts and venous angles',system:'Lymphatic',bodyIds:[],
    action:'Trace lymph back to the veins',kind:'Process overlay',duration:11,asset:'assets/ap3-models/lymph-drainage.glb',
    targets:['thoracic_duct','cisterna_chyli','right_lymphatic_duct','left_venous_angle','right_venous_angle'],
    context:['right_upper_quadrant','thoracic_duct_territory'],fitContext:['right_upper_quadrant','thoracic_duct_territory'],
    aliases:['lymph drainage','cisterna chyli','thoracic duct','right lymphatic duct','venous angle'],
    source:text+'21-1-anatomy-of-the-lymphatic-and-immune-systems',direction:[0,.02,1],
    description:'Follow two representative drainage routes on an anterior teaching map. Gold follows the lower-body route into the left venous angle. Turquoise follows the right upper quadrant into the right venous angle. Each angle is where the internal jugular and subclavian veins meet.',
    phases:[phase(0,'Lower body','Lymph from the lower limbs and much of the abdomen can collect in the cisterna chyli. It ascends in the thoracic duct.'),
      phase(.36,'Left venous angle','The thoracic duct arches toward the patient’s left to empty into venous blood. It also receives lymph from the left upper quadrant.'),
      phase(.58,'Right upper quadrant','Lymph from the patient’s right head and neck, right upper limb and right thorax returns on the right.'),
      phase(.83,'Right venous angle','In this common arrangement the short right lymphatic duct enters the right venous angle. Terminal drainage patterns vary.')],
    effects:[cue('cisterna_chyli',[0,.13],gold),tracer(thoracic,[.06,.49],gold),cue('left_venous_angle',[.44,.57],gold),
      tracer(rightDuct,[.60,.91],aqua),cue('right_venous_angle',[.85,1],aqua)]},
  {id:'villus-absorption',title:'Intestinal villus · nutrient absorption',system:'Digestive',bodyIds:['small-intestine'],
    action:'Compare blood and lymph uptake',kind:'Process overlay',duration:11,asset:'assets/ap3-models/villus.glb',
    targets:['surface_epithelium','capillary_network','portal_venule','lacteal'],context:['lumen','arteriole'],
    aliases:['intestine','villi','lacteal','glucose','chylomicron','fat digestion','blood and lymph'],
    source:text+'23-7-chemical-digestion-and-absorption-a-closer-look',direction:[.18,.05,1],
    description:'In this open villus, gold follows absorbed glucose into the circulation supplying the hepatic portal vein. Turquoise follows a chylomicron down the central lacteal. The symbols are enlarged to show their routes.',
    phases:[phase(0,'Across the epithelium','Glucose crosses an enterocyte from the lumen and enters the interstitial fluid before entering a villus capillary.'),
      phase(.14,'Blood route','Capillary blood drains into a venule. Mesenteric veins carry absorbed glucose toward the liver through the hepatic portal vein.'),
      phase(.54,'Assembly in the enterocyte','Long-chain lipid digestion products enter an enterocyte. The cell reassembles triglycerides and packages them into chylomicrons.'),
      phase(.68,'Lymph route','Chylomicrons leave the cell, enter the blind-ended lacteal and drain into larger intestinal lymphatics. Lymph ultimately joins venous blood.')],
    effects:[tracer([[.07,1.27,.02],[.10,1.08,.04],[.10,.98,.07],[0,.85,.13]],[0,.15],gold),
      tracer(capillary,[.15,.42],gold),tracer(venule,[.42,.52],gold),
      tracer([[-.10,1.27,.02],[-.13,1.09,.04],[-.10,.96,.06],[0,.65,.07]],[.56,.70],aqua),tracer(lacteal,[.70,1],aqua)]},
  {id:'pleural-coupling',title:'Pleura · coupling lung to chest wall',system:'Respiratory',bodyIds:['lungs','diaphragm'],
    action:'Watch the two pleural layers move',kind:'Organ movement',duration:6,asset:'assets/ap3-models/pleura.glb',
    targets:['chest_wall','parietal_pleura','pleural_fluid','visceral_pleura','lung_tissue','diaphragm'],context:[],
    aliases:['pleura','pleural membranes','ventilation','pleural cavity','diaphragm','intrapleural pressure'],
    source:text+'22-3-the-process-of-breathing',direction:[.17,.06,1],
    description:'The gold point follows parietal pleura on the chest wall. The turquoise point follows visceral pleura on the lung. The fluid layer between them allows sliding and helps couple their motion. Layer thickness and excursion are enlarged in this cutaway.',
    phases:[phase(0,'End expiration','The pleural layers are apposed across a thin film of fluid. Intrapleural pressure is below atmospheric pressure.'),
      phase(.08,'Inspiration','The diaphragm descends and the chest wall expands. Parietal pleura follows the wall. Visceral pleura and lung expand with it.'),
      phase(.46,'End inspiration','The lung has expanded. Airflow momentarily stops when alveolar pressure equals atmospheric pressure.'),
      phase(.56,'Quiet expiration','The diaphragm relaxes and elastic recoil reduces lung volume. The pleural layers remain coupled as air flows outward.')]},
  {id:'formed-elements',title:'Blood · oxygen transport by erythrocytes',system:'Cardiovascular',bodyIds:[],
    action:'Follow oxygen loading and unloading',kind:'Process overlay',duration:8,asset:'assets/ap2-blood/formed-elements.glb',
    targets:['erythrocyte_membrane'],context:[],aliases:['blood','formed elements','red blood cells','hemoglobin','oxyhemoglobin','erythrocyte','oxygen'],
    source:text+'18-3-erythrocytes',direction:[1,.43,.48],
    description:'Follow an enlarged oxygen symbol into a red cell at the lungs and out at systemic tissues. The red cell brightens as hemoglobin binds oxygen. The color change represents relative oxygenation. The model shows the membrane at cellular scale.',
    phases:[phase(0,'Pulmonary uptake','Oxygen diffuses from alveolar air into pulmonary capillary blood and then into the erythrocyte.'),
      phase(.28,'Hemoglobin binds oxygen','Most transported oxygen binds reversibly to the iron in hemoglobin inside the red cell.'),
      phase(.49,'Systemic delivery','Oxygenated blood reaches systemic capillaries. Lower tissue oxygen partial pressure favors unloading.'),
      phase(.65,'Oxygen release','Oxygen dissociates from hemoglobin and diffuses through plasma and interstitial fluid to tissue cells.')],
    effects:[tracer([[-3.36,1.83,.19],[-3.33,1.68,.22],[-3.17,1.36,.12],[-3.05,1.19,.05]],[0,.29],aqua),
      tracer([[-3.05,1.19,.05],[-2.88,1.13,.04],[-2.64,1.04,.05],[-2.32,.88,.08],[-2.15,.79,.10]],[.60,1],aqua)]}
];

const smooth=u=>u*u*(3-2*u);
const ramp=(t,a,b)=>smooth(THREE.MathUtils.clamp((t-a)/(b-a),0,1));

function oxygenation(entry,viewer,meshes){
  const flow=mountVisceralMotion(entry,viewer,meshes);
  const materials=meshes.get('erythrocyte_membrane').flatMap(o=>[].concat(o.material)).map(material=>({material,initial:material.color.clone()}));
  const low=new THREE.Color('#903347'),high=new THREE.Color('#ee5048');
  const bound=new THREE.Mesh(new THREE.SphereGeometry(.029,12,9),new THREE.MeshBasicMaterial({
    color:aqua,depthTest:false,depthWrite:false}));
  bound.name='Bound oxygen symbol';bound.renderOrder=16;bound.position.set(-3.05,1.19,.05);viewer.model.add(bound);
  let closed=false;
  return {set(t){
    if(closed)return;
    flow.set(t);
    bound.visible=t>.29&&t<.60;
    const fraction=ramp(t,.08,.36)*(1-ramp(t,.60,.96));
    for(const {material} of materials)material.color.lerpColors(low,high,fraction);
  },dispose(){
    if(closed)return;closed=true;flow.dispose();
    bound.removeFromParent();bound.material.dispose();bound.geometry.dispose();
    for(const {material,initial} of materials)material.color.copy(initial);
  }};
}

function pleura(viewer,meshes){
  const root=new THREE.Group();root.name='Pleural surface landmarks';viewer.model.add(root);
  const surfaces=[];
  for(const [name,objects] of meshes)for(const mesh of objects){
    const original=mesh.geometry,copy=original.clone(),base=original.getAttribute('position'),moving=copy.getAttribute('position');
    moving.setUsage(THREE.DynamicDrawUsage);
    const points=name==='parietal_pleura'||name==='visceral_pleura';
    let marker,point;
    if(points){
      const pos=new THREE.Vector3(),aim=new THREE.Vector3(.99,.31,0);
      let nearest=Infinity;
      for(let i=0;i<base.count;i++){
        pos.fromBufferAttribute(base,i);
        const distance=pos.distanceToSquared(aim);
        if(distance<nearest){nearest=distance;point=i;}
      }
      marker=new THREE.Mesh(new THREE.SphereGeometry(.034,12,8),new THREE.MeshBasicMaterial({
        color:name==='parietal_pleura'?gold:aqua,depthTest:false,depthWrite:false}));
      marker.renderOrder=15;root.add(marker);
    }
    mesh.geometry=copy;
    surfaces.push({name,mesh,original,copy,base,moving,marker,point});
  }
  let closed=false;
  return {set(t){
    if(closed)return;
    const fill=ramp(t,.06,.45)*(1-ramp(t,.54,.99));
    for(const {name,mesh,base,moving,marker,point} of surfaces){
      for(let i=0;i<base.count;i++){
        const x=base.getX(i),y=base.getY(i),z=base.getZ(i);
        // Coupled layers expand around the same superior reference. The dome
        // flattens most centrally and moves with the wall at the lateral ends.
        const descent=name==='diaphragm'?.16*Math.max(0,1-x*x):0;
        moving.setXYZ(i,x*(1+.09*fill),y+((y-1.23)*.035-descent)*fill,z*(1+.05*fill));
      }
      moving.needsUpdate=true;
      if(name==='diaphragm')mesh.geometry.computeVertexNormals();
      if(marker){
        marker.position.fromBufferAttribute(moving,point);
        mesh.localToWorld(marker.position);
        root.worldToLocal(marker.position);
      }
    }
    viewer.invalidate();
  },dispose(){
    if(closed)return;closed=true;
    root.removeFromParent();
    for(const {mesh,original,copy,marker} of surfaces){
      mesh.geometry=original;copy.dispose();
      if(marker){marker.geometry.dispose();marker.material.dispose();}
    }
  }};
}

export function mountExchangeMotion(entry,viewer,meshes){
  if(entry.id==='pleural-coupling')return pleura(viewer,meshes);
  if(entry.id==='formed-elements')return oxygenation(entry,viewer,meshes);
  return mountVisceralMotion(entry,viewer,meshes);
}
