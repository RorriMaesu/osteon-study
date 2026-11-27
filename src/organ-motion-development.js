import * as THREE from 'three';
import {mountVisceralMotion} from './organ-motion-visceral.js';

const book='https://openstax.org/books/anatomy-and-physiology-2e/pages/';
const phase=(at,label,text,members)=>({at,label,text,members});
function sequence(id,title,system,section,action,description,phases,extra={}){
  return {id,title,system,source:book+section,asset:'assets/ap3-models/'+id+'.glb',
    action,description,phases,kind:'Guided sequence',duration:14,bodyIds:[],context:[],
    targets:[...new Set(phases.flatMap(step=>step.members))],direction:[0,0,1],...extra};
}

const energy=sequence('metabolic-cell','Mitochondrion · ATP production','Metabolic','24-2-carbohydrate-metabolism','Follow the proton gradient',
  'Follow the compartments of aerobic glucose metabolism. Each moving dot represents a proton. Separate paths symbolize proton pumping by the respiratory chain and proton return through ATP synthase.',[
    phase(0,'Glycolysis in the cytosol','Glucose is split into pyruvate. Glycolysis yields a net two ATP per glucose and reduces NAD⁺ to NADH.',['cytosol']),
    phase(.17,'Electron donors in the matrix','Pyruvate oxidation and the citric acid cycle supply reduced electron carriers. Electrons enter the respiratory chain in the inner membrane.',['matrix']),
    phase(.36,'Pump H⁺ out of the matrix','Energy from electron transfer drives proton transport across the inner membrane into the intermembrane space. Oxygen accepts electrons at the end of the chain.',['inner_membrane','intermembrane_space']),
    phase(.65,'H⁺ returns through ATP synthase','Protons flow down their electrochemical gradient into the matrix through ATP synthase. This powers formation of ATP from ADP and phosphate on the matrix side.',['inner_membrane','matrix'])
  ],{context:['mitochondrial_outer_membrane'],aliases:['mitochondria','cellular respiration','oxidative phosphorylation','chemiosmosis','ATP synthase','electron transport chain'],kind:'Process overlay'});
// Plot both crossings in the open equatorial plane of the model. At these
// x positions the inner boundary is at y≈.38 and the outer one at y≈.48.
energy.effects=[
  {mode:'trace',points:[[-.05,.24,.01],[-.05,.38,.01],[-.05,.427,.01]],span:[.36,.64],color:'#ffe38f',size:.031},
  {mode:'trace',points:[[.23,.427,.01],[.23,.38,.01],[.23,.24,.01]],span:[.65,1],color:'#7ee2d9',size:.031}
];

const cleavage=sequence('cleavage-implantation','Cleavage to implantation','Development','28-2-embryonic-development','Step through early development',
  'Follow five stages from left to right. Cleavage partitions the original cytoplasm into smaller blastomeres. This enlarged sequence uses separate teaching specimens and illustrative intervals.',[
    phase(0,'Zygote','The fertilized egg is a single cell. Find it before following the first cleavage division.',['zygote']),
    phase(.18,'Two blastomeres','Mitosis produces two cells within the original envelope. Cell number increases while the overall diameter changes little during early cleavage.',['two_cell_stage']),
    phase(.37,'Morula','Smaller blastomeres form a compact cluster. Look for a solid ball before a fluid cavity appears.',['morula']),
    {...phase(.56,'Blastocyst','Identify the whole blastocyst, then its outer trophoblast, fluid-filled blastocoel and inner cell mass at one pole.',['trophoblast','blastocoel','inner_cell_mass']),assemblies:['whole_blastocyst']},
    phase(.8,'Implantation','After hatching, the blastocyst attaches to the endometrium. Trophoblast begins invading the uterine lining.',['implanting_blastocyst','endometrium'])
  ],{aliases:['embryo','fertilization','blastomere','embryoblast','early pregnancy']});

const stages=sequence('carnegie-stages','Embryo growth · four Carnegie stages','Development','28-2-embryonic-development','Compare four specimens at the same scale',
  'These four fixed embryos share one calibrated spatial scale. Carnegie stages describe morphology. Dates are approximate ages after fertilization and lengths are those of these particular specimens. The camera stays fixed as you step.',[
    phase(0,'Stage 12 · 3.9 mm','About day 29. Start with the smallest curved body and compare its outline with the next specimen.',['stage_12']),
    phase(.25,'Stage 16 · 10.5 mm','About day 39. Look for the enlarged head and limb buds. The upper limb has begun forming a hand plate.',['stage_16']),
    phase(.5,'Stage 20 · 20 mm','About day 49. The limbs extend farther and the developing digits are more distinct.',['stage_20']),
    phase(.75,'Stage 23 · 31 mm','About day 56. Compare the head, limbs and separated digits with the earlier specimens. This is the end of the embryonic period.',['stage_23'])
  ],{direction:[.08,.04,1],metricScale:true,aliases:['embryonic period','limb buds','embryology','Carnegie']});

const germCells=sequence('seminiferous-tubule','Seminiferous tubule · germ cell development','Reproductive','27-1-anatomy-and-physiology-of-the-testicular-reproductive-system','Trace sperm development toward the lumen',
  'Follow cell populations from the basal edge toward the lumen. Each highlighted group illustrates a different developmental stage. Mature motility is acquired later in the epididymis.',[
    phase(0,'Spermatogonia at the base','Find the germ cells next to the basement membrane. Mitotic divisions replenish the population and supply cells that enter meiosis.',['spermatogonia']),
    phase(.25,'Spermatocytes','Follow the next band toward the lumen. Primary spermatocytes complete meiosis I and secondary spermatocytes proceed through meiosis II.',['spermatocytes']),
    phase(.5,'Spermatids','Haploid spermatids remodel their nucleus, acrosome and flagellum during spermiogenesis.',['spermatids']),
    phase(.75,'Release toward the lumen','Elongated spermatozoa are released into the lumen. They travel to the epididymis for further maturation.',['spermatozoa','lumen'])
  ],{context:['basement_membrane','sustentacular_cells','sustentacular_nuclei','sertoli_tight_junction','interstitial_cells'],bodyIds:['testes'],aliases:['spermatogenesis','spermiogenesis','meiosis','testis']});

export const developmentMotions=[energy,cleavage,stages,germCells];
export function mountDevelopmentMotion(entry,viewer,meshes){
  const traces=entry.effects?mountVisceralMotion(entry,viewer,meshes):null;
  const materials=new Map();
  for(const raw of entry.targets)for(const object of meshes.get(raw)||[]){
    for(const mat of [].concat(object.material)){
      if(mat.emissive)materials.set(mat,{raw,color:mat.color.clone(),emissive:mat.emissive.clone(),intensity:mat.emissiveIntensity});
    }
  }
  const emphasis=new THREE.Color('#f2c87a'),quiet=new THREE.Color('#746e70');
  const bracket=new THREE.Line(new THREE.BufferGeometry(),new THREE.LineBasicMaterial({color:'#ffe09e',depthTest:false,depthWrite:false}));
  bracket.name='Current developmental stage';bracket.renderOrder=18;
  const compare=entry===cleavage||entry===stages;
  if(compare)viewer.model.add(bracket);
  let previous=-1;
  return {set(t){
    const index=entry.phases.findLastIndex(p=>p.at<=t);
    if(index!==previous&&index>=0){
      const members=entry.phases[index].members;
      if(compare){
        const box=new THREE.Box3();
        for(const key of members)for(const mesh of meshes.get(key)||[])box.expandByObject(mesh);
        const w=box.max.x-box.min.x,h=box.max.y-box.min.y,y=box.min.y-.06*h,z=box.max.z;
        const points=[[box.min.x,y+.12*h],[box.min.x,y],[box.max.x,y],[box.max.x,y+.12*h]];
        if(w>0){bracket.geometry.setFromPoints(points.map(([x,v])=>viewer.model.worldToLocal(new THREE.Vector3(x,v,z))));bracket.geometry.computeBoundingSphere();}
      }
      for(const [mat,initial] of materials){
        const active=members.includes(initial.raw);
        mat.color.copy(initial.color).lerp(active?emphasis:quiet,active?.28:.35);
        mat.emissive.copy(active?emphasis:initial.emissive);mat.emissiveIntensity=active?.23:initial.intensity;
      }
      previous=index;
    }
    traces?.set(t);viewer.invalidate();
  },dispose(){
    traces?.dispose();bracket.removeFromParent();bracket.geometry.dispose();bracket.material.dispose();
    for(const [mat,initial] of materials){mat.color.copy(initial.color);mat.emissive.copy(initial.emissive);mat.emissiveIntensity=initial.intensity;}
  }};
}
