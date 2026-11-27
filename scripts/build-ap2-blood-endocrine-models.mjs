import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {access,copyFile,mkdir,writeFile} from 'node:fs/promises';
import {BufferGeometry,Float32BufferAttribute,Vector3,Vector2,SphereGeometry,TubeGeometry,CatmullRomCurve3,LatheGeometry,Mesh,MeshStandardMaterial,DoubleSide,Scene} from 'three';
import {mergeGeometries,mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';

globalThis.FileReader=class{async readAsArrayBuffer(blob){this.result=await blob.arrayBuffer();this.onloadend?.();}};
const output=resolve(process.argv[2]||'assets');
const v=p=>new Vector3(...p);
const oval=(x,y,z,a,b,c,slices=32,stacks=20)=>new SphereGeometry(1,slices,stacks).scale(a,b,c).translate(x,y,z);
const tube=(points,r,segments=24,facets=8)=>new TubeGeometry(new CatmullRomCurve3(points.map(v)),segments,r,facets,false);
function mesh(name,geometries,color){
  const flat=geometries.map(geo=>{const g=geo.index?geo.toNonIndexed():geo;g.deleteAttribute('uv');return g;});
  const shape=mergeVertices(mergeGeometries(flat));
  const obj=new Mesh(shape,new MeshStandardMaterial({color,side:DoubleSide,metalness:0,roughness:.75}));obj.name=name;return obj;
}
function grid(n,m,point){
  const positions=[],triangles=[];
  for(let i=0;i<=n;i++)for(let j=0;j<=m;j++)positions.push(...point(i/n,j/m));
  for(let i=0;i<n;i++)for(let j=0;j<m;j++){
    const a=i*(m+1)+j,b=a+m+1; triangles.push(a,b,a+1,a+1,b,b+1);
  }
  const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(positions,3));g.setIndex(triangles);g.computeVertexNormals();return g;
}
const tau=2*Math.PI;

function pituitary(){
  const s=new Scene();
  s.add(mesh('hypothalamus',[oval(0,.87,0,.88,.39,.56)],'#aa869c'));
  s.add(mesh('stalk',[tube([[.12,.69,0],[.17,.38,0],[.18,.12,0],[.22,-.16,0],[.22,-.42,0]],.17)],'#cba9a4'));
  // Divide a single continuous gland at a sloping interface running through its posterior third.
  const pit=(x,t)=>{const r=Math.sqrt(Math.max(0,1-x*x)),y=r*Math.cos(t)*.41;return [x*.69+.16*y,-.66+y,r*Math.sin(t)*.53];};
  const boundary=.27;
  for(const [name,a,b,color] of [['anterior_lobe',-1,boundary,'#bf777e'],['posterior_lobe',boundary,1,'#c5b2d4']]){
    const surface=grid(28,48,(u,v)=>pit(a+(b-a)*u,v*tau));
    const face=grid(1,48,(u,v)=>{const [x,y,z]=pit(boundary,v*tau);return [boundary*.69+(x-boundary*.69)*u,-.66+(y+.66)*u,z*u];});
    s.add(mesh(name,[surface,face],color));
  }
  const primary=[],secondary=[],portal=[],axons=[],terminals=[];
  for(let k=0;k<4;k++){
    const sx=(k-1.5)*.07;
    primary.push(tube([[-.42+sx,.58,.28],[-.26+sx,.47,.30],[-.13+sx,.41,.20],[-.04+sx,.39,.12]],.014));
    portal.push(tube([[-.04+sx,.39,.12],[-.01+sx,.22,.13],[.01+sx,-.09,.13],[-.03+sx,-.32,.18],[-.16+sx,-.50,.22]],.018));
    secondary.push(tube([[-.16+sx,-.50,.22],[-.26+sx,-.54,.26],[-.44+sx,-.60,.20],[-.47+sx,-.69,.13],[-.27+sx,-.75,.24]],.015));
    axons.push(oval(.09+sx,.84,.20,.055,.057,.045),tube([[.09+sx,.84,.20],[.18+sx,.67,.12],[.20+sx,.36,.075],[.19+sx,-.02,.065],[.23+sx,-.33,.11],[.36+sx,-.59,.22]],.012));
    terminals.push(oval(.36+sx,-.59,.22,.03,.03,.026));
  }
  for(let j=0;j<3;j++){
    primary.push(tube([[-.51,.55-j*.045,.27],[-.37,.55-j*.045,.30],[-.22,.55-j*.045,.28]],.012));
    secondary.push(tube([[-.48,-.60-j*.035,.19],[-.37,-.60-j*.035,.23],[-.21,-.60-j*.035,.26]],.012));
  }
  const systemic=tube([[.22,-.66,.23],[.34,-.66,.29],[.44,-.58,.25],[.49,-.67,.15],[.38,-.76,.2]],.025);
  s.add(mesh('primary_plexus',primary,'#da847c'),mesh('portal_veins',portal,'#6ca9dc'),mesh('secondary_plexus',secondary,'#bb7aab'),mesh('neurosecretory_axons',axons,'#edcd73'),mesh('axon_terminals',terminals,'#eeb967'),mesh('posterior_capillaries',[systemic],'#c894bd'));
  return s;
}

function adrenal(){
  const s=new Scene();
  // A section through an asymmetric right adrenal wedge. Every shell has its own cut face.
  // The right gland has a tapered, pyramidal outline and a broad renal surface.
  const perimeter=new CatmullRomCurve3([[1.17,-.45,0],[.89,.16,0],[.42,.77,0],[.06,1.03,0],[-.26,.83,0],[-.88,.15,0],[-1.10,-.59,0],[-.76,-.67,0],[-.12,-.56,0],[.61,-.63,0]].map(v),true);
  const profile=(angle,r)=>{const p=perimeter.getPoint((angle/(2*Math.PI))%1);return [r*p.x,r*p.y];};
  const ring=(inner,outer)=>grid(48,2,(u,v)=>[...profile(tau*u,inner+(outer-inner)*v),0]);
  const cap=radius=>grid(48,24,(u,v)=>{const phi=v*Math.PI/2;return [...profile(tau*u,radius*Math.cos(phi)),-.61*radius*Math.sin(phi)];});
  const layers=[['capsule',.965,1,'#bfb2a0'],['glomerulosa',.85,.965,'#ba825e'],['fasciculata',.55,.85,'#e1bd73'],['reticularis',.36,.55,'#aa7569'],['medulla',0,.36,'#a689af']];
  for(const [name,inside,outside,color] of layers){
    const sections=[ring(inside,outside),cap(outside)];
    // The sectional rings meet edge to edge. Tiny relief provides a scale-enlarged
    // mnemonic for cortical cell arrangement without covering the cuts or creating labels.
    if(name==='fasciculata'){
      for(let i=0;i<50;i++){
        const a=(i+.3)*tau/50;const points=[.57,.66,.76,.83].map(rr=>[...profile(a,rr),.003]);
        sections.push(tube(points,.006,5,6));
      }
    }
    if(name==='glomerulosa'){
      for(let i=0;i<42;i++){
        const a=(i+.33)*tau/42,[x,y]=profile(a,.91);
        sections.push(oval(x,y,.001,.030,.022,.010,10,6));
      }
    }
    s.add(mesh(name,sections,color));
  }
  return s;
}

function blood(){
  const s=new Scene(),cells=[];
  function place(name,geos,color,pos){
    for(const g of geos)g.translate(...pos);s.add(mesh(name,geos,color));
  }
  // A smooth closed biconcave profile with a continuous central membrane.
  const points=[];for(let i=0;i<=64;i++){const a=Math.PI*i/64,r=Math.sin(a);const h=.75*Math.cos(a)*(.11+.46*r*r-.10*r**4);points.push(new Vector2(.75*r,-h));}
  const disc=new LatheGeometry(points,48).rotateX(1.06).rotateY(-.22);
  place('erythrocyte_membrane',[disc],'#be5361',[-3.0,1.12,0]);
  const fragment=oval(0,0,0,.28,.18,.14);const p=fragment.attributes.position;
  for(let i=0;i<p.count;i++){const scale=1+.08*Math.cos(p.getX(i)*24)*Math.sin(p.getY(i)*36+p.getZ(i)*12);p.setXYZ(i,p.getX(i)*scale,p.getY(i)*scale,p.getZ(i)*scale);}fragment.computeVertexNormals();
  place('platelet_fragment',[fragment],'#9f80b6',[-1.62,1.10,0]);
  cells.push(['neutrophil',1.12,[.16,1.17,0]],['eosinophil',1.18,[2.92,1.16,0]],['basophil',1.19,[-2.70,-1.62,0]],['lymphocyte',.85,[-.20,-1.64,0]],['monocyte',1.45,[2.56,-1.67,0]]);
  for(const [name,r,pos] of cells){
    place(name+'_cytoplasm',[oval(0,0,0,r,r,.89*r)],'#b7c8d5',pos);
    const ns=[];
    if(name==='neutrophil'||name==='eosinophil'||name==='basophil'){
      const lobes=name==='neutrophil'?[[-.42,.15,0],[-.14,-.31,.12],[.35,-.16,.05],[.35,.30,.03]]:[[-.35,.17,0],[.36,-.12,.06]];
      for(const [x,y,z] of lobes)ns.push(oval(x*r,y*r,z*r,.26*r,(name==='neutrophil'?.28:.38)*r,.31*r));
      ns.push(tube(lobes.map(p=>p.map(v=>v*r)),.089*r));
    }else if(name==='lymphocyte')ns.push(oval(-.055,-.03,.01,r*.81,r*.83,r*.70));
    else{
      const g=oval(0,0,0,r*.68,r*.49,r*.49),coords=g.attributes.position;
      for(let i=0;i<coords.count;i++){const x=coords.getX(i)/r;coords.setY(i,coords.getY(i)+r*(.94*x*x-.14));}g.computeVertexNormals();ns.push(g);
    }
    place(name+'_nucleus',ns,'#8267a3',pos);
    const cnt={neutrophil:46,eosinophil:72,basophil:55,lymphocyte:0,monocyte:0}[name];
    if(!cnt)continue;
    const granules=[];for(let i=0;i<cnt;i++){
      const t=1-2*(i+.5)/cnt,x=Math.sqrt(1-t*t)*Math.cos(i*2.39996),z=Math.sqrt(1-t*t)*Math.sin(i*2.39996);
      const size=r*({neutrophil:.024,eosinophil:.066,basophil:.090}[name]);
      granules.push(new SphereGeometry(size,8,6).translate(.86*r*x,.86*r*t,.76*r*z));
    }
    place(name+'_granules',granules,({neutrophil:'#a19ba9',eosinophil:'#df8564',basophil:'#66528b'})[name],pos);
  }
  return s;
}
for(const [file,scene] of [['ap2-glands/pituitary-pathways',pituitary()],['ap2-glands/adrenal-section',adrenal()],['ap2-blood/formed-elements',blood()]]){
  const path=join(output,file+'.glb');await mkdir(join(output,file.split('/')[0]),{recursive:true});
  let exists=true;try{await access(path);}catch(err){if(err.code!=='ENOENT')throw err;exists=false;}
  if(exists){const backup=join(tmpdir(),'osteon-model-backups');await mkdir(backup,{recursive:true});const dst=join(backup,Date.now()+'-'+file.split('/')[1]+'.glb');await copyFile(path,dst);console.log('Backup:',dst);}
  const bytes=await new GLTFExporter().parseAsync(scene,{binary:true});await writeFile(path,new Uint8Array(bytes));console.log(file,bytes.byteLength);
}
