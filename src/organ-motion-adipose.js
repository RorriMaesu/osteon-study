import * as THREE from 'three';

export const adiposeLipolysis={
  id:'adipose-lipolysis',title:'Adipose tissue · lipid mobilization',system:'Endocrine',section:'24.3',
  asset:'assets/ap2-glands/skin-fat-section.glb',source:'https://openstax.org/books/anatomy-and-physiology-2e/pages/24-3-lipid-metabolism',
  kind:'Process overlay',bodyIds:['skin'],targets:['adipocytes','cutaneous_vessels'],
  context:['epidermis','dermis','connective_septa'],fitContext:['epidermis'],direction:[.04,.085,1],duration:11,
  action:'Follow fat from an adipocyte into blood',
  aliases:['triglyceride','lipolysis','hypodermis','subcutaneous fat','fatty acid','glycerol','fasting'],
  description:'One adipocyte in this skin section is opened to show a schematic lipid droplet. The enlarged symbols summarize release into local capillaries and transport in the visible cutaneous vessel. Droplet shrinkage illustrates mobilization over time.',
  phases:[
    {at:0,label:'Lipid storage',text:'Find the open fat cell in the middle of the upper yellow row. Its orange droplet stores triglycerides.'},
    {at:.21,label:'Lipolysis',text:'Between meals, falling insulin permits increased lipolysis. Lipases can hydrolyze one triglyceride to three fatty acids (gold chains) and one glycerol (blue sphere).'},
    {at:.48,label:'Release into blood',text:'The products leave the adipocyte and enter local blood. Gold fatty acids travel mainly bound to albumin. Blue glycerol circulates dissolved in plasma.'},
    {at:.77,label:'Fuel delivery',text:'Muscle and other tissues can oxidize fatty acids for energy. The liver can use glycerol to make glucose during a fast.'}
  ]
};

// Center and radii of the superficial central adipocyte in the seeded skin-section
// builder. The source cell is a single ellipsoid in a mesh that contains 42 cells.
const cell=new THREE.Vector3(.02687777,.11758088,.48726427);
const radii=new THREE.Vector3(.31,.26,.30);
// Midpoints of cross sections of the exported basal cutaneous vessel, in model coordinates.
const channel=[[.20,.4000,.7600],[.45,.3962,.7590],[.75,.3933,.7596],[1.10,.3941,.7627],[1.36,.3916,.7656]];
export const adiposeTissueColors={adipocytes:'#d8ae65',cutaneous_vessels:'#b65d68',epidermis:'#ac795d',dermis:'#cc9386',connective_septa:'#bdaf9f'};
const smooth=t=>{t=THREE.MathUtils.clamp(t,0,1);return t*t*(3-2*t);};

function showCellSection(mesh){
  mesh.updateWorldMatrix(true,false);
  const original=mesh.geometry,source=original.attributes.position,indices=original.index;
  const local=new THREE.Vector3(),points=[];
  for(let i=0;i<source.count;i++){
    local.fromBufferAttribute(source,i);mesh.localToWorld(local);
    local.sub(cell).divide(radii);
    points.push({onCell:Math.abs(local.lengthSq()-1)<.001,depth:local.z});
  }
  const kept=[],indexAt=i=>indices?indices.getX(i):i;
  const count=indices?.count??source.count;
  for(let i=0;i<count;i+=3){
    const triangle=[indexAt(i),indexAt(i+1),indexAt(i+2)];
    if(triangle.every(j=>points[j].onCell)&&triangle.reduce((sum,j)=>sum+points[j].depth,0)>0)continue;
    kept.push(...triangle);
  }
  if(kept.length===count)throw Error('The teaching cut could not be registered to its adipocyte.');
  const cut=original.clone();cut.setIndex(kept);mesh.geometry=cut;
  return ()=>{mesh.geometry=original;cut.dispose();};
}

export function mountAdiposeLipolysis(entry,viewer,meshes){
  const sourceCell=meshes.get('adipocytes')[0],restoreCell=showCellSection(sourceCell);
  const originals=[];
  for(const [name,objects] of meshes)for(const mesh of objects){
    const prior=mesh.material;
    const tinted=[].concat(prior).map(mat=>{
      const owned=mat.clone();owned.color.set(adiposeTissueColors[name]);
      if(name==='dermis')owned.opacity=.49;
      if(name==='epidermis')owned.opacity=.82;
      if(name==='connective_septa')owned.opacity=.65;
      return owned;
    });
    originals.push({mesh,prior,tinted});mesh.material=Array.isArray(prior)?tinted:tinted[0];
  }
  const root=new THREE.Group();root.name='Adipocyte lipid mobilization';viewer.model.add(root);
  const geos=[],mats=[];
  function shape(geometry,color,name){
    geos.push(geometry);
    const material=new THREE.MeshStandardMaterial({color,roughness:.55});mats.push(material);
    const obj=new THREE.Mesh(geometry,material);obj.name=name;root.add(obj);return obj;
  }
  const droplet=shape(new THREE.SphereGeometry(1,26,20),'#ea993b','Illustrative lipid droplet');
  droplet.position.copy(cell);
  const rim=shape(new THREE.TorusGeometry(1,.025,8,56),'#fff0b2','Opened adipocyte rim');
  rim.position.copy(cell);rim.scale.copy(radii);
  const products=[];
  for(let i=0;i<4;i++){
    const glycerol=i===3;
    const chain=new THREE.CatmullRomCurve3([[-.056,-.029,0],[-.028,.026,0],[.002,-.005,0],[.035,.037,0],[.064,.021,0]].map(p=>new THREE.Vector3(...p)));
    const marker=shape(glycerol?new THREE.SphereGeometry(.049,16,12):new THREE.TubeGeometry(chain,12,.020,7,false),
      glycerol?'#51d7ff':'#ffd052',glycerol?'Glycerol product':'Fatty acid product '+(i+1));
    marker.material.emissive.copy(marker.material.color);marker.material.emissiveIntensity=.25;
    // Keep enlarged tokens readable within the vessel and the open cell. Paths
    // begin in the droplet, fan apart across the interstitium, then share the lumen.
    marker.material.depthTest=false;marker.renderOrder=8;
    const edgeMaterial=new THREE.MeshBasicMaterial({color:'#473a30',side:THREE.BackSide,depthTest:false,depthWrite:false});
    mats.push(edgeMaterial);
    const edge=new THREE.Mesh(marker.geometry,edgeMaterial);edge.scale.setScalar(1.22);edge.renderOrder=7;
    marker.add(edge);
    const offset=(i-1.5)*.038;
    const path=[cell.clone().add(new THREE.Vector3(offset,.02,.10)),
      new THREE.Vector3(.046+offset,.22,.665),new THREE.Vector3(.10+offset,.31,.748),
      ...channel.map(p=>new THREE.Vector3(...p))];
    const curve=new THREE.CurvePath();
    for(let j=1;j<path.length;j++)curve.add(new THREE.LineCurve3(path[j-1],path[j]));
    products.push({marker,curve});
  }
  return {set(t){
    const mobilized=smooth((t-.21)/.56);
    droplet.scale.copy(radii).multiplyScalar(.80-.23*mobilized);
    for(const [i,{marker,curve}] of products.entries()){
      const start=.24+i*.043;
      marker.visible=t>=start;
      const fraction=smooth((t-start)/(.97-start))*(1-i*.17);
      marker.position.copy(curve.getPointAt(fraction));
    }
    viewer.invalidate();
  },dispose(){
    restoreCell();root.removeFromParent();geos.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());
    for(const {mesh,prior,tinted} of originals){mesh.material=prior;tinted.forEach(m=>m.dispose());}
  }};
}
