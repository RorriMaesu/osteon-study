// Write a new GLB only. Pass a fresh path to regenerate.
import {writeFile} from 'node:fs/promises';
import {Scene,Mesh,SphereGeometry,TubeGeometry,TorusGeometry,CatmullRomCurve3,Vector3,MeshStandardMaterial} from 'three';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {fetalPaths} from '../src/ap2-fetal-paths.js';
globalThis.FileReader=class{async readAsArrayBuffer(blob){this.result=await blob.arrayBuffer();this.onloadend?.();}};
const scene=new Scene(),mat=new MeshStandardMaterial({roughness:.75});
function put(id,geometry){const obj=new Mesh(geometry,mat);obj.name=id;scene.add(obj);return obj;}
const shunts=['foramenOvale','ductusArteriosus','ductusVenosus'];
for(const [id,points] of Object.entries(fetalPaths)){
  if(id==='foramenOvale'){
    const opening=put(id,new TorusGeometry(.15,.023,12,48));
    opening.position.set(...points[1]);opening.rotation.y=Math.PI/2;opening.scale.y=1.2;
    const flap=put('septal_flap',new SphereGeometry(1,24,16));
    flap.position.copy(opening.position);flap.scale.set(.018,.18,.15);
    continue;
  }
  const curve=new CatmullRomCurve3(points.map(v=>new Vector3(...v)));
  const radius=id.includes('UmbilicalArtery')?.040:shunts.includes(id)?.063:.071;
  put(id,new TubeGeometry(curve,Math.max(24,points.length*12),radius,12,false));
}
for(const [id,center,radii] of [
  ['right_atrium',[-.38,1.2,0],[.36,.34,.32]],['left_atrium',[.38,1.26,-.06],[.36,.34,.30]],
  ['right_ventricle',[-.3,.76,.25],[.37,.46,.33]],['left_ventricle',[.4,.67,.02],[.36,.49,.32]],
  ['right_lung',[-1.05,1.30,-.15],[.43,.67,.36]],['left_lung',[1.07,1.30,-.15],[.40,.65,.34]],
  ['liver',[-.43,-.43,0],[.81,.41,.42]],['placenta',[-1.63,-1.97,.71],[.25,.54,.45]],
  ['bladder',[0,-1.85,-.13],[.2,.24,.19]]
]){const part=put(id,new SphereGeometry(1,28,18));part.position.set(...center);part.scale.set(...radii);}
const binary=await new GLTFExporter().parseAsync(scene,{binary:true});
await writeFile(process.argv[2]||'assets/ap2-fetal-flow.glb',new Uint8Array(binary),{flag:'wx'});
