/** Original scale-free anatomical teaching reconstructions. Run in a new output
 * directory. All coordinates use display X left/right, Y superior, Z anterior. */
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import * as T from 'three';
import {mergeGeometries,mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {developmentModels} from './ap3-development-models.mjs';

const destination=process.argv[2] || 'assets/ap3-models';
await mkdir(destination,{recursive:true});
globalThis.FileReader=class {async readAsArrayBuffer(blob){this.result=await blob.arrayBuffer();this.onloadend?.();}};
const C={tissue:'#dc8b8a',muscle:'#ad636a',wall:'#eeb390',blood:'#ba4e58',vein:'#5987ad',lymph:'#64a78c',duct:'#dda655',fluid:'#76b4bd',bone:'#cbbfa9',epithelium:'#d38a99',nucleus:'#9d769f',nerve:'#e0bb62',fat:'#d7b574'};
let scene=new T.Scene();
const sphere=(x,y,z,a,b=a,c=a,phi=0,arc=2*Math.PI)=>new T.SphereGeometry(1,26,16,arc===Math.PI?Math.PI:phi,arc).scale(a,b,c).translate(x,y,z);
const tube=(points,r=.04)=>new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),Math.max(16,points.length*7),r,9,false);
const ring=(x,y,z,r,t)=>new T.TorusGeometry(r,t,9,40).translate(x,y,z);
const slab=(x,y,z,w,h,d)=>new T.BoxGeometry(w,h,d).translate(x,y,z);
const around=(count,fn)=>Array.from({length:count},(_,i)=>fn(i,2*Math.PI*i/count));
function put(name,color,...pieces){
  const geos=pieces.flat(Infinity).map(g=>{
    const geom=g.index?g.toNonIndexed():g;
    geom.deleteAttribute('uv');return geom;
  });
  const obj=new T.Mesh(mergeVertices(mergeGeometries(geos)),new T.MeshStandardMaterial({color,roughness:.85,side:T.DoubleSide}));
  obj.name=name;scene.add(obj);
}
async function save(id){
  const binary=await new GLTFExporter().parseAsync(scene,{binary:true});
  await writeFile(path.join(destination,id+'.glb'),new Uint8Array(binary),{flag:'wx'});
  scene=new T.Scene();
}
const arrow=(a,b,r=.08)=>{
  const dir=new T.Vector3(...b).sub(new T.Vector3(...a)).normalize();
  return new T.ConeGeometry(r,r*2.6,10).applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),dir)).translate(...b);
};

// Terminal drainage territories shown from the anterior aspect, patient's right at display left.
for(const side of [-1,1]){
  const half=(y,a,b,c)=>new T.SphereGeometry(1,26,16,side<0?-Math.PI/2:Math.PI/2,Math.PI).scale(a,b,c).translate(0,y,0);
  const upper=[half(1.66,.22,.28,.20),half(1.36,.115,.20,.11),half(.91,.56,.59,.24),
    tube([[side*.40,1.21,0],[side*.58,1.15,0],[side*.77,.79,.01],[side*.96,.46,.04]],.088),
    sphere(side*.98,.41,.04,.083,.13,.062)];
  if(side<0)put('right_upper_quadrant','#afa4be',...upper);
  else put('thoracic_duct_territory','#80aca2',...upper,
    sphere(0,.29,-.04,.48,.42,.22),...[-1,1].flatMap(k=>[tube([[k*.24,.15,-.03],[k*.26,-.41,.01],[k*.31,-.96,0],[k*.33,-1.29,.01]],.13),
      sphere(k*.33,-1.31,.10,.13,.094,.23)]));
}
put('thoracic_duct',C.lymph,tube([[0,.08,.23],[-.05,.62,.24],[-.04,.87,.26],[.09,1.10,.26],[.17,1.32,.27],[.31,1.27,.24]],.046));
put('cisterna_chyli',C.duct,sphere(0,.08,.23,.077,.13,.07));
put('right_lymphatic_duct','#b1b544',tube([[-.48,1.35,.27],[-.39,1.32,.29],[-.31,1.27,.24]],.043));
for(const side of [-1,1])put(side<0?'right_venous_angle':'left_venous_angle',C.vein,
  tube([[side*.62,1.21,.20],[side*.31,1.27,.22],[side*.12,1.04,.16]],.050),
  tube([[side*.30,1.54,.18],[side*.30,1.39,.2],[side*.31,1.27,.22]],.047));
put('flow_arrows','#ffd875',arrow([0,.35,.30],[0,.53,.30]),arrow([.08,1.04,.34],[.14,1.14,.34]),arrow([-.53,1.35,.32],[-.40,1.32,.32]));
await save('lymph-drainage');

put('capsule',C.wall,sphere(0,0,-.03,.99,.73,.50,0,Math.PI));
put('subcapsular_sinus',C.lymph,tube([[-.85,-.23,0],[-.88,.18,.03],[-.55,.50,.09],[0,.61,.13],[.58,.50,.10],[.85,.22,.04]],.062));
put('cortical_follicles',C.nucleus,[-.64,-.35,0,.35,.64].map(x=>sphere(x,.40-Math.abs(x)*.33,.02,.15,.13,.14)));
put('medullary_sinuses',C.lymph,[-.58,-.24,.12,.48].map(x=>tube([[x,.35,.14],[x+.08,.08,.12],[x-.04,-.12,.12],[.25,-.24,.12],[.58,-.27,.07]],.043)));
put('afferent_vessels','#83ac71',[-.55,.12,.58].map(x=>tube([[x*1.22,.97,.14],[x,.74,.08],[x,.56-Math.abs(x)*.22,.08]],.037)));
put('efferent_vessel',C.lymph,tube([[.54,-.26,.06],[.78,-.33,.02],[1.10,-.48,.06]],.07));
await save('node-sinuses');

// Open alveolar sac, an adjacent capillary sheet and a short respiratory passage.
put('respiratory_bronchiole',C.wall,tube([[-.4,1.29,-.13],[-.2,.88,-.10],[-.02,.6,-.08]],.16));
put('alveolar_duct',C.duct,tube([[-.02,.63,-.08],[0,.36,-.1],[.02,.09,-.11]],.13));
const sacs=[[0,.10,-.12],[-.34,.14,-.02],[-.52,-.16,.03],[-.24,-.44,.01],[.16,-.42,.03],[.48,-.18,-.02],[.35,.16,-.04]];
put('alveolar_air_spaces','#c1a2a8',sacs.map(([x,y,z])=>sphere(x,y,z,.285,.255,.28,Math.PI,Math.PI)));
put('alveolar_septum','#eeb8a4',sacs.map(([x,y,z])=>ring(x,y,z,.255,.025)));
put('capillary_network',C.blood,[-.13,.12,.34].map((offset,i)=>tube([[-.74,.18-i*.12,.19],[-.51,.29+offset,.24],[-.28,.18+offset,.23],[-.02,.23+offset,.18],[.23,.05+offset,.22],[.54,.16+offset,.19],[.67,.2,.14]],.031)),
  tube([[-.57,.21,.20],[-.66,-.15,.15],[-.35,-.54,.21],[.12,-.66,.17],[.51,-.44,.19],[.66,.06,.18]],.036));
put('pulmonary_arteriole',C.vein,tube([[-1.06,.58,.09],[-.91,.39,.14],[-.73,.18,.19]],.08));
put('pulmonary_venule',C.blood,tube([[.66,.2,.14],[.80,.39,.19],[.96,.55,.18]],.08));
await save('alveolar-exchange');

put('chest_wall',C.muscle,sphere(0,0,-.02,1.1,1.3,.66,0,Math.PI));
put('parietal_pleura','#d4b5b3',sphere(0,0,0,1.03,1.23,.62,0,Math.PI));
put('pleural_fluid',C.fluid,sphere(0,0,.025,.99,1.18,.595,0,Math.PI));
put('visceral_pleura','#d29ba5',sphere(0,0,.05,.94,1.12,.57,0,Math.PI));
put('lung_tissue',C.tissue,sphere(0,0,.065,.89,1.07,.54,0,Math.PI));
put('diaphragm',C.muscle,tube([[-1.02,-1.12,.05],[-.58,-.9,.09],[-.14,-.80,.05],[.36,-.84,.06],[.93,-1.14,.08]],.09));
await save('pleura');

put('surface_epithelium',C.wall,sphere(0,.08,-.04,.47,1.10,.42,0,Math.PI),
  ...[-1,1].map(k=>tube([[k*.49,-.75,.02],[k*.42,.16,.04],[k*.31,.77,.03],[k*.09,1.15,0]],.065)));
put('lumen', '#b5cfd0',sphere(0,1.31,0,.50,.10,.25));
put('lacteal',C.lymph,tube([[0,-1.09,.05],[-.03,-.6,.08],[.02,.1,.09],[0,.65,.07]],.084),sphere(0,.65,.07,.083));
put('capillary_network',C.blood,[-1,1].map(k=>tube([[k*.30,-.91,.12],[k*.28,-.42,.15],[k*.32,.14,.15],[k*.2,.63,.14],[0,.85,.13]],.042)),
  ...[-.42,-.12,.18,.48].map(y=>tube([[-.28,y,.10],[0,y+.06,-.09],[.28,y+.05,.1]],.022)));
put('arteriole',C.blood,tube([[-.56,-1.10,.12],[-.39,-1,.14],[-.30,-.91,.12]],.071));
put('portal_venule',C.vein,tube([[.30,-.91,.12],[.40,-1.02,.14],[.58,-1.10,.13]],.075));
await save('villus');

put('cytosol','#d4b994',sphere(0,0,-.36,1.25,.90,.42,0,Math.PI));
put('mitochondrial_outer_membrane','#b7828b',sphere(.10,0,-.06,.87,.49,.35,0,Math.PI));
put('intermembrane_space',C.fluid,sphere(.10,0,-.03,.81,.44,.32,0,Math.PI));
put('inner_membrane',C.muscle,sphere(.1,0,0,.75,.385,.28,0,Math.PI),...[-.42,-.15,.12,.39].map(x=>tube([[x,-.25,.05],[x+.04,.04,.13],[x+.09,.19,.13],[x+.15,.08,.10],[x+.19,-.24,.05]],.028)));
put('matrix',C.duct,sphere(.10,-.01,.015,.68,.33,.24,0,Math.PI));
await save('metabolic-cell');

const loops=[[-.78,-.45],[.15,-1.17]];
for(const [i,[x,depth]] of loops.entries()){
  const label=i?'juxtamedullary':'cortical';
  const top=i?.51:.94;
  put(label+'_corpuscle',C.wall,sphere(x,top,-.02,.135,.12,.12,0,Math.PI),sphere(x,top,.005,.091,.085,.095));
  const start=[x+.10,top,.02], end=[x+.21,top-.12,.02], distal=[x+.48,top-.01,0];
  put(label+'_proximal_tubule',C.wall,tube([start,[x+.17,top+.10,.08],[x+.25,top+.06,.12],[x+.13,top+.01,.13],end],.041));
  put(label+'_loop',i?'#c88d57':'#c8ac68',tube([end,[x+.20,depth+.16,.03],[x+.26,depth,.03],[x+.34,depth+.11,.02],[x+.38,top-.12,.02],distal],.032));
  put(label+'_distal_tubule','#bd809a',tube([distal,[x+.43,top+.09,.08],[x+.36,top+.12,.12],[x+.45,top+.18,.09],[x+.55,top+.05,.06],[.93,top-.10,.04]],.039));
}
put('shared_collecting_duct',C.duct,tube([[.93,.87,.04],[.93,.37,.04],[.94,-.37,.04],[.95,-1.35,.04]],.062));
put('afferent_arteriole',C.blood,tube([[-1.14,1.12,.04],[-.98,1.06,.06],[-.87,.97,.05]],.043));
put('efferent_arteriole','#ac4c70',tube([[-.87,.94,.05],[-.99,.84,.06],[-.92,.69,.10]],.031));
put('peritubular_capillaries',C.vein,tube([[-.92,.69,.10],[-.93,.43,.13],[-.70,.31,.13],[-.46,.51,.1],[-.43,.69,.13],[-.59,.74,.13]],.020));
put('vasa_recta',C.blood,tube([[.10,.47,.08],[.03,.26,.08],[.27,-.94,.04],[.40,-1.24,.06],[.52,-1.12,.08],[.47,-.58,.09],[.45,.34,.09]],.022));
put('cortex',C.tissue,slab(-.04,.86,-.355,2.20,.71,.065));
put('outer_medulla','#c09c9b',slab(-.04,.12,-.355,2.20,.76,.065));
put('inner_medulla','#9a7b91',slab(-.04,-.84,-.355,2.20,1.13,.065));
await save('nephron-pair');

const endothelialSheet=new T.Shape();
endothelialSheet.moveTo(-.93,-.32);endothelialSheet.lineTo(.93,-.32);endothelialSheet.lineTo(.93,.32);endothelialSheet.lineTo(-.93,.32);endothelialSheet.closePath();
for(const x of [-.60,-.31,0,.31,.60]){
  const hole=new T.Path();hole.absarc(x,0,.070,0,Math.PI*2,true);endothelialSheet.holes.push(hole);
}
put('endothelium',C.tissue,new T.ExtrudeGeometry(endothelialSheet,{depth:.055,bevelEnabled:false}).rotateX(-Math.PI/2).translate(0,.29,0));
put('fenestrae',C.blood,[-.60,-.31,0,.31,.60].map(x=>ring(0,0,0,.075,.014).rotateX(Math.PI/2).translate(x,.35,0)));
put('basement_membrane','#b4a1be',slab(0,.08,.01,1.88,.105,.69));
put('podocyte_foot_processes','#deb16c',[-.81,-.56,-.31,-.06,.19,.44,.69].map((x,i)=>tube([[x,-.12,i%2?.39:-.39],[x,-.10,0],[x+.04,-.11,i%2?-.24:.24]],.071)));
put('filtration_slits','#70a5a0',[-.67,-.42,-.17,.08,.33,.58].map(x=>slab(x,-.107,0,.048,.025,.38)));
put('capsular_space',C.fluid,slab(0,-.39,.01,1.65,.13,.60));
await save('filtration-barrier');

await developmentModels({C,put,sphere,tube,ring,slab,around,save});


// Closed, nested volumes are built and checked for containment in Blender.
const blender=process.env.BLENDER_BIN||(process.platform==='win32'
  ?path.join(process.env.ProgramFiles,'Blender Foundation','Blender 4.5','blender.exe'):'blender');
execFileSync(blender,['-b','--factory-startup','--python-exit-code','1','-P',
  fileURLToPath(new URL('./build-ap3-fluid-models.py',import.meta.url)),'--',path.resolve(destination)],{stdio:'inherit'});
