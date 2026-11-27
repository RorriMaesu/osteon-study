import {writeFile} from 'node:fs/promises';
import {BoxGeometry, CatmullRomCurve3, Mesh, MeshStandardMaterial, Scene, SphereGeometry, TubeGeometry, Vector3} from 'three';
import {mergeGeometries, mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';

globalThis.FileReader = class {
  async readAsArrayBuffer(blob) { this.result = await blob.arrayBuffer(); this.onloadend?.(); }
};

const scene = new Scene();
function add(name, color, geometries) {
  const pieces = geometries.map(geometry => {
    const piece = geometry.index ? geometry.toNonIndexed() : geometry;
    piece.deleteAttribute('uv');
    return piece;
  });
  const object = new Mesh(mergeVertices(mergeGeometries(pieces)), new MeshStandardMaterial({color, roughness:.84}));
  object.name = name;
  scene.add(object);
}
const oval = (x,y,z,a,b,c) => new SphereGeometry(1,12,9).scale(a,b,c).translate(x,y,z);
const fiber = (points, radius) => new TubeGeometry(new CatmullRomCurve3(points.map(p => new Vector3(...p))), Math.max(8, points.length * 5), radius, 7, false);
const layer = (bottom,top,back,front) => new BoxGeometry(3,top-bottom,front-back).translate(0,(top+bottom)/2,(front+back)/2);

// The patch is opened along the bowel axis (X). Each anterior edge exposes a deeper tissue.
const mucosa = [layer(.40,.58,-.92,-.16)];
for (let row = 0; row < 3; row++) {
  for (let column = 0; column < 14; column++) {
    const x = -1.39 + column*.204 + (row%2)*.05, z = -.81 + row*.255;
    const height = .18 + .035*Math.sin(column*1.6+row);
    mucosa.push(oval(x,.57+height*.36,z,.075,height,.066));
  }
}
add('mucosa','#d99595',mucosa);
add('submucosa','#d9b886',[layer(.012,.40,-.92,-.155),layer(.012,.175,-.155,.45)]);

function plexus(name, color, y, back, front) {
  const pieces = [], rows = 3, columns = 8;
  const point = (r,c) => [-1.34+c*.36+(r%2)*.10,y+.006*Math.sin(c*1.7+r),back+(front-back)*r/(rows-1)];
  function join(a,b) {
    const middle = a.map((n,i) => (n+b[i])/2);
    middle[2] += .025;
    return fiber([a,middle,b],.014);
  }
  for (let r=0;r<rows;r++) {
    for (let c=0;c<columns;c++) {
      const p=point(r,c);
      pieces.push(oval(...p,.061,.028,.036));
      if(c+1<columns) pieces.push(join(p,point(r,c+1)));
      if(r+1<rows) pieces.push(join(p,point(r+1,c)));
      if(r+1<rows && c+1<columns && (r+c)%2===0) pieces.push(join(p,point(r+1,c+1)));
    }
  }
  add(name,color,pieces);
}
plexus('submucosal_plexus','#448d92',.212,-.15,.41);
const circular = [layer(-.355,.012,-.92,.74)];
for(let i=0;i<23;i++) circular.push(oval(-1.43+i*.130,.011,.36,.042,.022,.37));
add('circular_muscle','#b76b71',circular);
plexus('myenteric_plexus','#da902d',-.395,.39,1.075);
const longitudinal = [layer(-.66,-.44,-.92,1.16)];
for(let i=0;i<7;i++) longitudinal.push(oval(0,-.44,.63+i*.084,1.47,.018,.036));
add('longitudinal_muscle','#ad7489',longitudinal);
add('serosa','#b8b9b0',[layer(-.706,-.66,-.92,1.17)]);

const sensory = [-1.08,.03,.64], intrinsicGanglion = [-.72,-.395,.87], motorGanglion = [.53,-.395,.94];
add('intrinsic_sensory','#71558c',[
  fiber([sensory,[-1.00,-.02,.73],[-.98,-.17,.77],intrinsicGanglion],.027),
  ...[-.10,0,.10].map(dx=>fiber([sensory,[-1.13+dx,.045,.60],[-1.15+dx,.04,.52]],.014))
]);
add('enteric_interneuron','#bd6d25',[
  oval(...intrinsicGanglion,.086,.046,.052),
  fiber([intrinsicGanglion,[-.48,-.39,.98],[-.22,-.38,.92],[.10,-.39,1.01],motorGanglion],.030)
]);
add('enteric_motor','#447d70',[
  oval(...motorGanglion,.088,.048,.055),
  fiber([motorGanglion,[.68,-.37,1.02],[.84,-.22,.81],[.90,-.10,.735]],.031),
  ...[-.11,0,.11].map(dx=>fiber([[.90,-.10,.735],[.90+dx,-.07,.722],[.93+dx,-.04,.67]],.015))
]);

// Extrinsic paths are shortened, with distinct sensory and motor endings in a medullary inset.
const afferentEnd=[2.04,1.21,-.21], efferentStart=[2.20,1.00,-.17];
add('vagal_afferent','#50829e',[
  fiber([[-1.26,.045,.65],[-1.57,.15,.79],[-1.69,.71,.41],[-1.29,1.20,.03],
    [-.20,1.34,-.10],[1.05,1.28,-.13],afferentEnd],.032),
  ...[-.07,.03,.10].map(dx=>fiber([[-1.26,.045,.65],[-1.24+dx,.045,.57],[-1.26+dx,.043,.48]],.014))
]);
add('medulla','#9fadd0',[
  oval(2.14,1.17,-.23,.27,.39,.26),oval(2.15,.95,-.23,.18,.31,.18)
]);
add('vagal_efferent','#638852',[
  fiber([efferentStart,[2.14,.60,-.04],[1.90,.14,.19],[1.67,-.20,.74],[1.48,-.36,.94],[1.00,-.385,1.04],motorGanglion],.035)
]);

const output = process.argv[2] || new URL('../assets/ap2-neuro/enteric-wall.glb',import.meta.url);
const binary = await new GLTFExporter().parseAsync(scene,{binary:true});
await writeFile(output,new Uint8Array(binary));
