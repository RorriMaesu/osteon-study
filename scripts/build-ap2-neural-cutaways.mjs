// New teaching reconstructions. Use a separate output directory to preview a regeneration.
import {mkdir,writeFile,copyFile,access,readFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {CatmullRomCurve3,ExtrudeGeometry,Mesh,MeshStandardMaterial,Scene,Shape,SphereGeometry,TubeGeometry,Vector3} from 'three';
import {mergeGeometries,mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';

// GLTFExporter consumes Blob through the browser FileReader interface.
globalThis.FileReader = class {
  async readAsArrayBuffer(blob){this.result=await blob.arrayBuffer();this.onloadend?.();}
};
const output=resolve(process.argv[2]||'assets/ap2-neuro');
await mkdir(output,{recursive:true});

function groups(){
  const parts=new Map();
  return {
    add(name,geo){
      const flat=geo.index?geo.toNonIndexed():geo;
      flat.deleteAttribute('uv');
      if(!parts.has(name))parts.set(name,[]);
      parts.get(name).push(flat);
    },
    scene(colors,scale){
      const scene=new Scene();
      for(const [name,geometries] of parts){
        const shape=mergeVertices(mergeGeometries(geometries));
        shape.scale(scale,scale,scale);
        const mesh=new Mesh(shape,new MeshStandardMaterial({color:colors(name),roughness:.8}));
        mesh.name=name;
        scene.add(mesh);
      }
      return scene;
    }
  };
}
const vec=p=>new Vector3(...p);
function sweep(points,radius){
  return new TubeGeometry(new CatmullRomCurve3(points.map(vec)),24,radius,12,false);
}
function oval(x,y,z,a,b,c,angle=0){
  return new SphereGeometry(1,32,18).scale(a,b,c).rotateZ(angle).translate(x,y,z);
}
function rail(points){
  return new CatmullRomCurve3(points.map(([x,y])=>vec([x,y,0]))).getPoints((points.length-1)*5).map(v=>[v.x,v.y]);
}
function region(points,depth,side){
  const shape=new Shape();
  points.forEach(([x,y],i)=>shape[i?'lineTo':'moveTo'](side*x,y));
  shape.closePath();
  return new ExtrudeGeometry(shape,{depth,bevelEnabled:false}).translate(0,0,-depth/2);
}
const reverse=a=>[...a].reverse();
function cord(){
  const g=groups();
  // Partition one transverse profile. Adjacent regions reuse the same sampled boundaries.
  const innerD=rail([[.32,.04],[.41,.20],[.55,.45],[.69,.69]]);
  const outerD=rail([[.69,.69],[.66,.49],[.55,.21],[.47,.10]]);
  const innerV=rail([[.30,-.10],[.29,-.29],[.37,-.52],[.50,-.60],[.63,-.57],[.69,-.47]]);
  const outerV=rail([[.69,-.47],[.72,-.31],[.64,-.13],[.48,.01]]);
  const rear=rail([[.69,.69],[.77,.77],[.62,.86],[.28,.94],[.06,.91],[0,.84]]);
  const margin=rail([[.77,.77],[.98,.59],[1.10,.29],[1.14,0],[1.07,-.34],[.89,-.56],[.80,-.64]]);
  const front=rail([[.80,-.64],[.56,-.83],[.29,-.89],[.12,-.87],[.055,-.68],[.025,-.41],[0,-.35]]);
  const upperBridge=rail([[0,.09],[.14,.08],[.23,.07],[.32,.04]]);
  const lowerBridge=rail([[0,-.11],[.17,-.13],[.30,-.10]]);
  const dorsal=innerD.concat(outerD.slice(1));
  const ventral=innerV.concat(outerV.slice(1));
  const depth=.48;
  for(const side of [1,-1]){
    const put=(name,p)=>g.add(name,region(p,depth,side));
    put('Dorsal gray horn',dorsal);
    put('Ventral gray horn',ventral);
    put('Dorsal white column',[...upperBridge,...innerD.slice(1),...rear.slice(1)]);
    put('Lateral white column',[...reverse(outerD),rear[5],...margin.slice(1),...outerV]);
    put('Ventral white column',[...lowerBridge,...innerV.slice(1),...front]);
    const hole=[];
    for(let i=0;i<=16;i++){const t=-Math.PI/2+Math.PI*i/16;hole.push([.034*Math.cos(t),.03*Math.sin(t)]);}
    put('Gray commissure',[...upperBridge,...[outerD.at(-1),outerV.at(-1)],...reverse(lowerBridge),...hole]);
    // Rootlets converge longitudinally; the sensory ganglion is proximal to the mixed nerve.
    for(const z of [-.18,0,.18]){
      const mirrored=pts=>pts.map(([x,y,z])=>[side*x,y,z]);
      g.add('Dorsal root',sweep(mirrored([[.88,.66,z],[1.07,.74,z*.85],[1.31,.58,z*.45],[1.47,.45,z*.16],[1.77,.34,0]]),.034));
      g.add('Ventral root',sweep(mirrored([[.83,-.60,z],[1.1,-.64,z*.85],[1.39,-.45,z*.5],[1.65,-.23,z*.22],[1.90,.004,0],[2.02,.09,0]]),.033));
    }
    g.add('Dorsal root ganglion',oval(side*1.68,.39,0,.24,.112,.13,-side*.39));
    g.add('Dorsal root',sweep([[side*1.83,.32,0],[side*1.94,.22,0],[side*2.02,.09,0]],.066));
    g.add('Spinal nerve',sweep([[side*1.99,.09,0],[side*2.13,.065,0],[side*2.34,-.006,0]],.082));
  }
  g.add('Central canal',oval(0,0,0,.031,.027,.242));
  return g.scene(n=>n.includes('white')?'#e1d5b6':n.includes('gray')||n==='Gray commissure'?'#af827d':n==='Central canal'?'#72b7c6':'#ceb778',.005);
}
function axon(){
  const g=groups();
  const longitudinal=(start,end,r)=>sweep([[start,0,0],[(start+end)/2,0,0],[end,0,0]],r);
  g.add('Axon',longitudinal(-1.99,1.99,.115));
  for(let i=0;i<3;i++){
    const start=-1.77+i*1.25;
    // The exposed longitudinal quadrant reveals concentric compact myelin around the axon.
    for(let j=0;j<4;j++){
      const r=.125+j*.037,outer=r+.034,shape=new Shape();
      shape.absarc(0,0,outer,-.55,Math.PI*1.37,false);
      shape.absarc(0,0,r,Math.PI*1.37,-.55,true);
      shape.closePath();
      g.add(['Proximal myelin','Middle myelin','Distal myelin'][i],new ExtrudeGeometry(shape,{depth:1.07,bevelEnabled:false,curveSegments:32}).rotateY(Math.PI/2).translate(start,0,0));
    }
  }
  for(const [name,x] of [['First node',-.61],['Second node',.64]]){
    g.add(name,longitudinal(x-.086,x+.086,.119));
  }
  return g.scene(n=>n.includes('myelin')?'#82aebd':n.includes('node')?'#d89463':'#c98f86',.01);
}
async function autonomic(){
  const g=groups();
  // Millimetres in the BodyParts3D thorax frame. Paths summarize the two-neuron circuits.
  g.add('Medulla relay',oval(-4,1507,63,9,17,9));
  g.add('Upper thoracic cord',sweep([[0,1364,37],[0,1334,32],[0,1304,25],[0,1284,24]],5));
  g.add('Sympathetic preganglionic fiber',sweep([[-3,1322,31],[-11,1320,31],[-18,1324,43],[-15,1330,54]],1.9));
  g.add('Sympathetic chain ganglion',oval(-15,1330,55,3.9,6.2,3.9));
  g.add('Sympathetic cardiac fiber',sweep([[-14,1329,56],[-19,1320,72],[-20,1297,88],[-7,1279,109],[-20,1260,117]],1.85));
  g.add('Vagal preganglionic fiber',sweep([[-7,1506,64],[-26,1494,74],[-31,1442,78],[-35,1392,85],[-31,1347,88],[-19,1307,96],[-10,1288,105],[-15,1271,111]],2.0));
  g.add('Intrinsic cardiac ganglion',oval(-15,1271,111,3.3,4,3.2));
  g.add('Parasympathetic cardiac fiber',sweep([[-16,1269,111],[-16,1266,113],[-20,1260,117]],1.85));
  g.add('SA node region',oval(-20,1260,117,4.1,5.6,3));
  const scene=g.scene(n=>n.includes('ganglion')?'#d59e78':n==='SA node region'?'#62b3aa':'#a3bec4',.001);
  const raw=await readFile('assets/ap2-thorax.glb');
  const donor=(await new GLTFLoader().parseAsync(raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength),'')).scene;
  donor.updateMatrixWorld(true);
  donor.traverse(n=>{
    if(!n.isMesh||!/^wall_of_|^third_thoracic_vertebra$/.test(n.name))return;
    const mesh=new Mesh(n.geometry.clone().applyMatrix4(n.matrixWorld),new MeshStandardMaterial({color:n.name.includes('wall')?'#ad7975':'#c1b6a0'}));
    mesh.name=n.name;scene.add(mesh);
  });
  return scene;
}
async function save(name,scene){
  const file=join(output,name+'.glb');
  const bin=await new GLTFExporter().parseAsync(scene,{binary:true});
  // Verify an existing derivative has a recoverable copy before replacing it.
  try{
    await access(file);
    const dir=join(tmpdir(),'osteon-neural-model-backups');
    await mkdir(dir,{recursive:true});
    const backup=join(dir,Date.now()+'-'+name+'.glb');
    await copyFile(file,backup);
    console.log('Backed up',backup);
  }catch(e){if(e.code!=='ENOENT')throw e;}
  await writeFile(file,new Uint8Array(bin));
  console.log(name,scene.children.length+' labeled surfaces',bin.byteLength+' bytes');
}
await save('spinal-section',cord());
await save('myelinated-axon',axon());
await save('cardiac-autonomic',await autonomic());
