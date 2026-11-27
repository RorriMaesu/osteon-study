import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {CatmullRomCurve3,DoubleSide,ExtrudeGeometry,LatheGeometry,Mesh,MeshStandardMaterial,Path,RingGeometry,Scene,Shape,SphereGeometry,TubeGeometry,Vector2,Vector3} from 'three';
import {mergeGeometries,mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';

const directory=process.argv[2];
if(!directory)throw Error('Supply an output directory for the two new GLBs.');
await mkdir(directory,{recursive:true});
globalThis.FileReader=class {async readAsArrayBuffer(blob){this.result=await blob.arrayBuffer();this.onloadend?.();}};
const vec=p=>new Vector3(...p);
const oval=(x,y,z,rx,ry,rz)=>new SphereGeometry(1,20,14).scale(rx,ry,rz).translate(x,y,z);
const lathe=(profile,start=0,span=2*Math.PI)=>new LatheGeometry(profile.map(p=>new Vector2(...p)),40,start,span);
function fiber(points,r0,r1=r0){
  const path=new CatmullRomCurve3(points.map(vec)),steps=Math.max(8,points.length*5),sides=9;
  const geometry=new TubeGeometry(path,steps,1,sides,false),position=geometry.attributes.position;
  for(let i=0;i<=steps;i++){
    const t=i/steps,center=path.getPointAt(t),radius=r0+(r1-r0)*t;
    for(let j=0;j<=sides;j++){
      const index=i*(sides+1)+j;
      const p=new Vector3().fromBufferAttribute(position,index).sub(center).multiplyScalar(radius).add(center);
      position.setXYZ(index,p.x,p.y,p.z);
    }
  }
  geometry.computeVertexNormals();return geometry;
}
async function save(id,parts){
  const scene=new Scene();
  for(const [label,pieces] of Object.entries(parts)){
    const flat=pieces.map(g=>{const piece=g.index?g.toNonIndexed():g;piece.deleteAttribute('uv');return piece;});
    const mesh=new Mesh(mergeVertices(mergeGeometries(flat)),new MeshStandardMaterial({roughness:.8,side:DoubleSide}));
    mesh.name=label.replaceAll(' ','_');mesh.userData.teachingLabel=label;scene.add(mesh);
  }
  const binary=await new GLTFExporter().parseAsync(scene,{binary:true});
  await writeFile(join(directory,id+'.glb'),new Uint8Array(binary),{flag:'wx'});
}

// The transverse cut is made in local +Z, then the ellipsoid is shaped around the soma.
function soma(){
  const radius=.47,cut=.57;
  const bowl=new SphereGeometry(radius,40,24,0,2*Math.PI,Math.acos(cut),Math.PI-Math.acos(cut)).rotateX(Math.PI/2);
  const face=new RingGeometry(.177,radius*Math.sqrt(1-cut*cut),40).translate(0,0,radius*cut);
  return [bowl,face].map(g=>g.scale(1,.89,.82).translate(-1.2,0,0));
}
function dendriteTree(){
  const pieces=[],origin=vec([-1.2,0,0]);
  const seedDirections=[[-1,.14,.08],[-.83,.70,-.22],[-.18,1,.28],[.52,.82,-.29],[-.68,-.70,.29],[.06,-.96,-.25],[.42,-.63,.51],[-.7,-.03,-.71]];
  for(const [i,raw] of seedDirections.entries()){
    const dir=vec(raw).normalize(),normal=new Vector3(-dir.y,dir.x,.29*(i%3-1)).normalize();
    const at=(length,side=0,depth=0)=>origin.clone().addScaledVector(dir,length).addScaledVector(normal,side).add(new Vector3(0,0,depth)).toArray();
    const fork=at(.72,.04),outer=at(1.05,-.03);
    pieces.push(fiber([at(.26),at(.48),fork,outer],.116,.044));
    for(const sign of [-1,1]){
      const twig=at(1.25,.16*sign,.04*sign),end=at(1.44,.32*sign,.12*sign);
      pieces.push(fiber([outer,twig,end],.043,.012),fiber([twig,at(1.34,.10*sign,.11),at(1.45,.05*sign,.17)],.025,.009));
    }
    pieces.push(fiber([fork,at(.87,.26,.02),at(.99,.43,-.03)],.048,.012));
  }
  return pieces;
}
function axonSleeve(start,end){
  const half=(end-start)/2;
  return lathe([[.061,-half],[.100,-half],[.134,-half+.04],[.140,0],[.134,half-.04],[.100,half],[.061,half],[.061,-half]])
    .rotateZ(-Math.PI/2).translate((start+end)/2,0,0);
}
const root=[1.67,0,0],terminalPieces=[];
for(const [index,[y,z]] of [[.57,.19],[.27,-.39],[-.30,.32],[-.55,-.25]].entries()){
  const fork=[1.87,y*.50,z*.60],tip=[2.19+.08*(index%2),y,z];
  terminalPieces.push(fiber([root,fork,tip],.050,.018),oval(...tip,.074,.058,.055));
  const side=[2.02,y*1.1+.08,z*1.1-.19];
  terminalPieces.push(fiber([fork,[1.95,y*.80,z*.7-.09],side],.032,.015),oval(...side,.060,.049,.047));
}
await save('multipolar-neuron',{
  'Dendrites':dendriteTree(),'Cell body':soma(),'Nucleus':[oval(-1.20,.012,.070,.207,.19,.201)],
  'Axon hillock':[fiber([[-.99,0,-.02],[-.84,.018,-.01],[-.67,0,0]],.238,.073)],
  'Initial segment':[fiber([[-.67,0,0],[-.52,0,0],[-.36,0,0]],.073,.060)],
  'Axon':[fiber([[-.36,0,0],[.70,0,0],root],.060,.050)],
  'Myelin sheath':[[-.30,.12],[.22,.60],[.70,1.08],[1.18,1.59]].map(([a,b])=>axonSleeve(a,b)),
  'Nodes of Ranvier':[[.12,.22],[.60,.70],[1.08,1.18]].map(([a,b])=>fiber([[a,0,0],[(a+b)/2,0,0],[b,0,0]],.062)),
  'Axon terminals':terminalPieces
});

function membraneDisk(r,y,depth,openings){
  const disk=new Shape();disk.absarc(0,0,r,0,Math.PI*2,false);
  for(const [x,z,radius] of openings){const pore=new Path();pore.absarc(x,-z,radius,0,Math.PI*2,true);disk.holes.push(pore);}
  return new ExtrudeGeometry(disk,{depth,curveSegments:24,bevelEnabled:false}).rotateX(-Math.PI/2).translate(0,y,0);
}
function channels(centers,y,outer){
  return centers.flatMap(([x,z])=>Array.from({length:5},(_,i)=>{
    const angle=2*Math.PI*i/5,ring=.069;
    return oval(x+ring*Math.cos(angle),y,z+ring*Math.sin(angle),.038,outer,.038);
  }));
}
const calciumSites=[[-.34,.23],[.34,-.19]],receptorSites=[[.14,.14],[-.30,-.06],[.35,-.23]];
const release=[.10,.21],presynapticFace=.135,postFace=-.175;
const releaseCup=lathe([[.066,0],[.059,.031],[.106,.095],[.114,.15],[.086,.205],[.045,.226],[.011,.228]])
  .translate(release[0],presynapticFace,release[1]);
const vesicles=[[-.35,.46,.05],[.34,.48,-.18],[-.09,.65,-.30],[.16,.72,-.08],[-.29,.87,-.11],[.27,.91,-.17]]
  .map(([x,y,z],i)=>oval(x,y,z,.11+.012*(i%3),.111,.109));
const dots=[[.10,.128,.20],[.09,.091,.23],[.14,.053,.22],[.07,.004,.24],[.17,-.03,.18],[-.02,-.071,.18],[.13,-.10,.15],[-.12,-.098,.079]];
await save('chemical-synapse',{
  'Presynaptic terminal':[
    lathe([[.53,.15],[.67,.28],[.75,.52],[.71,.73],[.53,.95],[.25,1.12],[.19,1.30],[.19,1.41]],.32*Math.PI,1.36*Math.PI),
    membraneDisk(.53,presynapticFace,.022,[[...release,.059],...calciumSites.map(p=>[...p,.067])])],
  'Synaptic vesicles':[...vesicles,releaseCup],
  'Voltage-gated calcium channels':channels(calciumSites,.146,.080),
  'Neurotransmitter':dots.map(p=>oval(...p,.028,.028,.028)),
  'Postsynaptic membrane':[
    lathe([[.24,-.67],[.26,-.54],[.49,-.42],[.69,-.31],[.72,postFace]],0,2*Math.PI),
    membraneDisk(.72,postFace-.028,.028,receptorSites.map(p=>[...p,.067]))],
  'Ligand-gated receptors':channels(receptorSites,postFace,.071),
  'Synaptic cleft':[
    fiber([[-.71,postFace,.15],[-.85,postFace,.15],[-.85,(presynapticFace+postFace)/2,.15]],.012),
    fiber([[-.85,(presynapticFace+postFace)/2,.15],[-.85,presynapticFace,.15],[-.71,presynapticFace,.15]],.012)]
});
