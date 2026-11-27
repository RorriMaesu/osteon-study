import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {access,copyFile,mkdir,writeFile} from 'node:fs/promises';
import {Scene,Mesh,MeshStandardMaterial,DoubleSide,BufferGeometry,Float32BufferAttribute,SphereGeometry,Shape,Path,ExtrudeGeometry} from 'three';
import {mergeGeometries,mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
globalThis.FileReader=class{async readAsArrayBuffer(blob){this.result=await blob.arrayBuffer();this.onloadend?.();}};
const output=resolve(process.argv[2]||'assets'),pi=Math.PI;
function mesh(name,geos,color){
  const pieces=geos.map(geo=>{const g=geo.index?geo.toNonIndexed():geo;g.deleteAttribute('uv');return g;});
  const obj=new Mesh(mergeVertices(mergeGeometries(pieces)),new MeshStandardMaterial({color,side:DoubleSide,roughness:.84}));obj.name=name;return obj;
}
function grid(n,m,point){
  const xyz=[],index=[];
  for(let i=0;i<=n;i++)for(let j=0;j<=m;j++){xyz.push(...point(i/n,j/m));if(i===n||j===m)continue;const a=i*(m+1)+j,b=a+m+1;index.push(a,b,a+1,a+1,b,b+1);}
  const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(xyz,3));g.setIndex(index);g.computeVertexNormals();return g;
}
function walls(){
  const s=new Scene(),rv=.68,squash=.85;
  for(const [id,x,rs,depth] of [['artery',-1.14,[.44,.50,.73,.85],1],['vein',1.14,[rv,.715,.775,.85],squash]]){
    const a0=pi*.83,end=pi*2.17;
    for(let i=0;i<3;i++){
      const [inside,outside]=rs.slice(i,i+2),lo=-1.20,hi=1.24-.13*i;
      const point=(a,y,r)=>[x+r*Math.cos(a),y,r*depth*Math.sin(a)];
      const geo=[
        grid(56,1,(u,v)=>point(a0+(end-a0)*u,lo+(hi-lo)*v,outside)),
        grid(56,1,(u,v)=>point(end-(end-a0)*u,lo+(hi-lo)*v,inside)),
        ...[lo,hi].map(y=>grid(56,1,(u,v)=>point(a0+(end-a0)*u,y,inside+(outside-inside)*v))),
        ...[a0,end].map(a=>grid(1,1,(u,v)=>point(a,lo+(hi-lo)*u,inside+(outside-inside)*v)))
      ];
      const part=['intima','media','externa'][i],color=['#dda09c','#b76d75','#c4ab8f'][i];s.add(mesh(id+'_'+part,geo,color));
    }
  }
  for(const sign of [-1,1]){
    const shape=closed=>grid(36,9,(u,v)=>{
      const angle=(u-.5)*pi,c=Math.cos(angle),edge=Math.sin(angle);
      const xwall=sign*rv*c;
      const xfree=closed?0:xwall*.86;
      const hingeY=.40-.95*c;
      const freeY=.40+(closed?.07:-.09)*c;
      return [1.14+xwall+(xfree-xwall)*v,hingeY+(freeY-hingeY)*v,rv*squash*edge];
    });
    const flat=shape(false),shut=shape(true);
    flat.morphAttributes.position=[shut.attributes.position];flat.morphAttributes.normal=[shut.attributes.normal];
    const leaflet=new Mesh(flat,new MeshStandardMaterial({color:'#eac981',side:DoubleSide,roughness:.73}));
    leaflet.name='vein_leaflet_'+(sign===1?'a':'b');s.add(leaflet);
  }
  return s;
}
const capsule=(cx,cy,rx,ry)=>new SphereGeometry(1,16,10).scale(rx,ry,.054).translate(cx,cy,0);
function capillary(){
  const s=new Scene();
  // Map a flat patch to a curved portion of wall. The lumen is on its concave face.
  const wrap=(geo,radius)=>{
    const p=geo.attributes.position;
    for(let i=0;i<p.count;i++){const a=p.getX(i)/radius,r=radius+p.getZ(i),y=p.getY(i);p.setXYZ(i,Math.sin(a)*r,y,-Math.cos(a)*r+radius);}
    geo.computeVertexNormals();return geo;
  };
  const block=(left,bottom,w,h,holes=[],thick=.045)=>{
    const outline=new Shape();outline.moveTo(left,bottom);outline.lineTo(left,bottom+h);outline.lineTo(left+w,bottom+h);outline.lineTo(left+w,bottom);outline.closePath();
    for(const [x,y,r] of holes){const pore=new Path();pore.absarc(x,y,r,0,pi*2,false);outline.holes.push(pore);}
    return new ExtrudeGeometry(outline,{depth:thick,bevelEnabled:false,curveSegments:8});
  };
  for(const kind of ['continuous','fenestrated','sinusoidal']){
    const fen=kind==='fenestrated',sin=kind==='sinusoidal',r=sin?1.49:1.13;
    const cells=[],nuclei=[],base=[];const xStart=-1.24,end=1.24,yStart=-.89;
    const gap=sin?.09:.007;
    for(let row=0;row<2;row++){
      const boundaries=row===0?[xStart,-.40,.42,end]:[xStart,-.84,.02,.87,end];
      for(let i=0;i<boundaries.length-1;i++){
        const left=boundaries[i]+gap,right=boundaries[i+1]-gap,width=right-left,bottom=yStart+row*.89+gap,h=.89-2*gap;
        const holes=[];
        if(fen)for(const fx of [.23,.55,.80])for(const fy of [.22,.73])holes.push([left+width*fx,bottom+h*fy,Math.min(width*.10,.055)]);
        cells.push(wrap(block(left,bottom,width,h,holes),r));
        nuclei.push(wrap(capsule(left+.46*width,bottom+h*.48,Math.min(width*.22,.15),.080).translate(0,0,-.012),r));
      }
    }
    const bounds=sin?[[-1.24,-.64],[-.36,.27],[.48,1.24]]:[[-1.24,1.24]];
    for(const [l,h] of bounds){
      // Subdivide the basal lamina before curling it, keeping it immediately outside endothelium.
      base.push(grid(36,1,(u,v)=>{const a=(l+(h-l)*u)/r,rad=r+.077;return [Math.sin(a)*rad,-.89+1.78*v,-Math.cos(a)*rad+r];}));
    }
    s.add(mesh(kind+'_endothelium',cells,'#87bbb0'),mesh(kind+'_nuclei',nuclei,'#616f9a'),mesh(kind+'_basement',base,'#bfad79'));
  }
  return s;
}
for(const [file,scene] of [['ap2-vessel-walls',walls()],['ap2-capillary-barriers',capillary()]]){
  await mkdir(output,{recursive:true});const dest=join(output,file+'.glb');let present=true;try{await access(dest);}catch(e){if(e.code!=='ENOENT')throw e;present=false;}
  if(present){const dir=join(tmpdir(),'osteon-model-backups');await mkdir(dir,{recursive:true});const copy=join(dir,Date.now()+'-'+file+'.glb');await copyFile(dest,copy);console.log('Backed up',copy);}
  const bytes=await new GLTFExporter().parseAsync(scene,{binary:true});await writeFile(dest,new Uint8Array(bytes));console.log(file,bytes.byteLength);
}
