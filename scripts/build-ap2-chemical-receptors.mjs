// Export two separate enlarged teaching cutaways. Run in the repository with a new output directory.
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {CatmullRomCurve3,LatheGeometry,Mesh,MeshStandardMaterial,Scene,SphereGeometry,TorusGeometry,TubeGeometry,Vector2,Vector3} from 'three';
import {mergeGeometries,mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';

const directory=process.argv[2];
if(!directory)throw Error('Supply a new output directory.');
await mkdir(directory,{recursive:true});
globalThis.FileReader=class {async readAsArrayBuffer(blob){this.result=await blob.arrayBuffer();this.onloadend?.();}};
const oval=(x,y,z,a,b,c)=>new SphereGeometry(1,24,16).scale(a,b,c).translate(x,y,z);
const tube=(pts,radius)=>new TubeGeometry(new CatmullRomCurve3(pts.map(p=>new Vector3(...p))),18,radius,8,false);
const cell=(pts,x,z,angle=0)=>new LatheGeometry(pts.map(([r,y])=>new Vector2(r,y)),24).rotateZ(angle).translate(x,0,z);
function merged(pieces){
  const buffer=pieces.map(geo=>{const flat=geo.index?geo.toNonIndexed():geo;flat.deleteAttribute('uv');return flat;});
  return mergeVertices(mergeGeometries(buffer));
}
async function save(name,parts){
  const scene=new Scene();
  for(const [label,pieces] of Object.entries(parts)){
    const mesh=new Mesh(merged(pieces),new MeshStandardMaterial({roughness:.8}));
    mesh.name='region_'+label.replaceAll(' ','_');mesh.userData.teachingLabel=label;scene.add(mesh);
  }
  const file=await new GLTFExporter().parseAsync(scene,{binary:true});
  await writeFile(join(directory,name+'.glb'),new Uint8Array(file),{flag:'wx'});
}
const spindle=[[0,-.89],[.12,-.74],[.18,-.40],[.15,.18],[.08,.64],[.035,.85],[0,.90]];
function tasteCell(a){
  const geo=cell(spindle,0,0);
  const pos=geo.attributes.position;
  for(let i=0;i<pos.count;i++){
    const y=pos.getY(i),radius=.04+.34*Math.max(0,1-Math.pow(Math.abs(y)/.93,1.55));
    pos.setX(i,pos.getX(i)+radius*Math.cos(a));pos.setZ(i,pos.getZ(i)+radius*Math.sin(a));
  }
  geo.computeVertexNormals();return geo;
}
const tasteCells=Array.from({length:9},(_,i)=>tasteCell(Math.PI*2*i/9));
const microvilli=Array.from({length:15},(_,i)=>{const a=i*2.4,r=.07+.033*(i%3);return tube([[r*Math.cos(a),.80,r*Math.sin(a)],[r*.84*Math.cos(a),.91,r*.84*Math.sin(a)],[r*Math.cos(a+.15),1.03+.03*(i%2),r*Math.sin(a+.15)]],.012);});
await save('taste-bud',{
  'Taste pore':[new TorusGeometry(.17,.038,10,48).rotateX(Math.PI/2).translate(0,.91,0)],
  'Gustatory microvilli':microvilli,'Gustatory receptor cell':[tasteCells[2]],'Neighboring taste cells':tasteCells.filter((_,i)=>i!==2),
  'Basal cells':[-.22,0,.22].map((x,i)=>oval(x,-.7,.12*(i%2),.13,.14,.11)),
  'Gustatory afferent':[
    tube([[-.55,-1.2,.13],[-.27,-1.05,.10],[.05,-.87,.08],[.11,-.55,.24]],.047),
    tube([[.03,-.90,.085],[-.15,-.75,-.12],[-.28,-.49,-.18]],.035),
    tube([[.02,-.89,.08],[.21,-.79,-.10],[.27,-.55,-.20]],.032)]
});
const cilia=Array.from({length:13},(_,i)=>{const a=i*2*Math.PI/13;const p=(r,y,d)=>[r*Math.cos(a+d),y,r*Math.sin(a+d)];return tube([p(.025,.94,0),p(.18,1.01,.04),p(.41,.99,.13),p(.59+.09*(i%3),.96,.24)],.015);});
const supports=[[-.50,-.08],[.46,-.13],[-.29,-.40],[.24,-.43]].map(([x,z],i)=>cell([[0,-.66],[.07,-.59],[.105,-.10],[.145,.39],[.18,.70],[.16,.83],[0,.85]],x,z,(i%2?.025:-.025)));
await save('olfactory-epithelium',{
  'Olfactory cilia':cilia,'Dendritic knob':[oval(0,.91,0,.093,.080,.093)],
  'Olfactory receptor neuron':[cell([[0,-.59],[.053,-.48],[.135,-.27],[.17,-.06],[.12,.09],[.048,.26],[.037,.78],[.052,.86],[0,.91]],0,0)],
  'Olfactory axon':[tube([[0,-.52,0],[-.015,-.72,.02],[.039,-.91,.04],[.13,-1.08,.09],[.49,-1.17,.13]],.025)],
  'Supporting cells':supports,'Basal cells':[-.49,-.24,.18,.43].map((x,i)=>oval(x,-.69,(i%2-.5)*.21,.13,.105,.11))
});
