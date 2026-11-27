import * as THREE from 'three';

export const vulvarPerfusion={id:'vulvar-perfusion',bodyIds:['vulva'],title:'Vulva · erectile tissue',system:'Reproductive',kind:'Process overlay',action:'Compare vascular filling',duration:7,
  asset:'assets/ap3-models/pelvic-section.glb',targets:['clitoris','labia_minora','labia_majora'],context:['pubic_symphysis','urethra','vagina'],source:'https://pubmed.ncbi.nlm.nih.gov/16536770/',
  aliases:['clitoral blood flow','clitoris','blood volume','labia','vulva'],description:'In this simplified external pelvic section, increasing red color represents rising blood volume in the clitoral and labial tissues. The color scale is qualitative. The internal erectile bodies are outside this section.',
  phases:[{label:'Baseline',at:0,text:'Identify the external clitoral landmark and the inner labial folds in the resting section.'},{label:'Vascular filling',at:.21,text:'As arterial inflow increases, blood volume rises in erectile tissue. Follow the deepening color.'},{label:'Increased volume',at:.54,text:'The overlay emphasizes the clitoral region. The labia minora also contain responsive vascular tissue.'},{label:'Return to baseline',at:.72,text:'As filling subsides, the color returns toward its resting value.'}]};

export function mountPerfusion(entry,viewer,meshes){
  const blood=new THREE.Color('#ae254b'),materials=[];
  for(const [name,strength] of [['clitoris',1],['labia_minora',.6]]){
    for(const mesh of meshes.get(name)||[])for(const material of [].concat(mesh.material)){
      materials.push({material,original:material.color.clone(),strength});
    }
  }
  return {set(t){const u=Math.max(0,Math.min(1,(t-.15)/.37,(1-t)/.28));
    for(const m of materials)m.material.color.copy(m.original).lerp(blood,u*u*(3-2*u)*m.strength);
  },dispose(){for(const m of materials)m.material.color.copy(m.original);}};
}
