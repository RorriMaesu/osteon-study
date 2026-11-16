import * as THREE from 'three';

const sampleCache=new WeakMap();
const point=new THREE.Vector3();
const projection=new THREE.Matrix4();

// Select vertices across a geometry's length and width. The indices stay
// stable while getVertexPosition supplies the current shape and skin pose.
function sampleVertices(geometry){
 let samples=sampleCache.get(geometry);
 if(samples)return samples;
 const positions=geometry.attributes.position;
 const candidates=[];
 const count=Math.min(128,positions.count);
 for(let i=0;i<count;i++){
  const index=Math.floor(i*positions.count/count);
  candidates.push({index,point:new THREE.Vector3().fromBufferAttribute(positions,index),distance:Infinity});
 }
 if(!geometry.boundingBox)geometry.computeBoundingBox();
 const center=geometry.boundingBox.getCenter(point);
 let next=candidates.reduce((best,entry)=>entry.point.distanceToSquared(center)<best.point.distanceToSquared(center)?entry:best);
 samples=[];
 while(next&&samples.length<32){
  samples.push(next.index);
  next.chosen=true;
  const chosen=next;
  next=null;
  for(const entry of candidates){
   if(entry.chosen)continue;
   entry.distance=Math.min(entry.distance,entry.point.distanceToSquared(chosen.point));
   if(!next||entry.distance>next.distance)next=entry;
  }
 }
 sampleCache.set(geometry,samples);
 return samples;
}

function projectVertex(mesh,index,matrix){
 return mesh.getVertexPosition(index,point).applyMatrix4(matrix);
}

export function visibleInTree(mesh){
 for(let node=mesh;node;node=node.parent)if(!node.visible)return false;
 return true;
}

function sampledBounds(mesh,viewProjection){
 projection.multiplyMatrices(viewProjection,mesh.matrixWorld);
 let left=Infinity,right=-Infinity,bottom=Infinity,top=-Infinity,near=Infinity;
 for(const index of sampleVertices(mesh.geometry)){
  const {x,y,z}=projectVertex(mesh,index,projection);
  if(z>1)continue;
  left=Math.min(left,x);right=Math.max(right,x);
  bottom=Math.min(bottom,y);top=Math.max(top,y);near=Math.min(near,z);
 }
 if(!Number.isFinite(near))return null;
 const padX=.012+(right-left)*.12,padY=.012+(top-bottom)*.12;
 return {mesh,left:left-padX,right:right+padX,bottom:bottom-padY,top:top+padY,near};
}

// Read the depth of the front surface along each probe. Projecting the
// deformed vertices once lets one triangle pass answer a whole set of probes.
function surfaceDepths(mesh,viewProjection,probes){
 const geometry=mesh.geometry,positions=geometry.attributes.position;
 const index=geometry.index;
 const projected=new Float32Array(positions.count*3);
 projection.multiplyMatrices(viewProjection,mesh.matrixWorld);
 for(let i=0;i<positions.count;i++){
  projectVertex(mesh,i,projection).toArray(projected,i*3);
 }
 const depths=new Float64Array(probes.length).fill(Infinity);
 const side=mesh.material.side,flipped=mesh.matrixWorld.determinant()<0?-1:1;
 const {start,count}=geometry.drawRange;
 const end=Math.min(index?.count??positions.count,start+count);
 for(let i=start;i+2<end;i+=3){
  const a=(index?index.getX(i):i)*3,b=(index?index.getX(i+1):i+1)*3,c=(index?index.getX(i+2):i+2)*3;
  const az=projected[a+2],bz=projected[b+2],cz=projected[c+2];
  if(Math.max(az,bz,cz)>1||Math.max(az,bz,cz)<-1)continue;
  const ax=projected[a],ay=projected[a+1],bx=projected[b],by=projected[b+1],cx=projected[c],cy=projected[c+1];
  const abx=bx-ax,aby=by-ay,acx=cx-ax,acy=cy-ay;
  const cross=abx*acy-aby*acx;
  if(Math.abs(cross)<1e-12)continue;
  if(side!==THREE.DoubleSide&&(cross*flipped>0)!==(side!==THREE.BackSide))continue;
  const left=Math.min(ax,bx,cx),right=Math.max(ax,bx,cx),bottom=Math.min(ay,by,cy),top=Math.max(ay,by,cy);
  for(let j=0;j<probes.length;j++){
   const {x,y}=probes[j];
   if(x<left||x>right||y<bottom||y>top)continue;
   const dx=x-ax,dy=y-ay;
   const u=(dx*acy-dy*acx)/cross,v=(dy*abx-dx*aby)/cross;
   if(u<-.0001||v<-.0001||u+v>1.0001)continue;
   const depth=az+u*(bz-az)+v*(cz-az);
   if(depth>=-1&&depth<depths[j])depths[j]=depth;
  }
 }
 return depths;
}

function targetProbes(part,viewProjection,camera,width,height){
 const {mesh}=part;
 projection.multiplyMatrices(viewProjection,mesh.matrixWorld);
 const vertices=sampleVertices(mesh.geometry);
 const probes=[];
 for(const index of vertices){
  const {x,y,z}=projectVertex(mesh,index,projection);
  if(Math.abs(x)>.995||Math.abs(y)>.995||Math.abs(z)>1)continue;
  if(probes.some(p=>Math.hypot((p.x-x)*width,(p.y-y)*height)<9))continue;
  probes.push({x,y,index});
  if(probes.length===16)break;
 }
 const depths=surfaceDepths(mesh,viewProjection,probes);
 return probes.filter((probe,i)=>{
  probe.depth=cameraDepth(depths[i],camera);
  return Number.isFinite(depths[i]);
 });
}

function cameraDepth(z,{near,far}){
 return 2*near*far/(far+near-z*(far-near));
}

export class MotionReveal{
 constructor(stage){
  this.stage=stage;
  this.faded=new Map();
  this.materials=new WeakMap();
  this.viewProjection=new THREE.Matrix4();
  this.previousStatus='';
  this.reset();
 }
 reset(){
  for(const [mesh,{base}] of this.faded)mesh.material=base;
  this.faded.clear();
  this.targets=[];
  this.contributors=new Set();
  this.selected=null;
  this.selectedInView=null;
  this.bones=false;
  this.boneBlocked=false;
  this.anchor=undefined;
  this.pending=[];
  this.lastProbes=null;
  this.nextScan=0;
  this.sequence=0;
  this.roundsLeft=0;
  this.report(0,0,false,'',0);
 }
 configure({selected,targets,bones,contributors}){
  if(this.selected!==selected||this.bones!==bones){
   this.nextScan=0;
   this.pending=[];
   this.lastProbes=null;
   this.anchor=undefined;
   this.targetOffset=0;
  }
  this.selected=selected;
  this.targets=targets;
  this.bones=bones;
  this.contributors=contributors;
 }
 report(count,boneCount,boneBlocked,target,contributorCount){
  const status=[count,boneCount,boneBlocked,target,contributorCount].join('|');
  if(status===this.previousStatus)return;
  this.previousStatus=status;
  this.stage.dataset.revealCount=String(count);
  this.stage.dataset.revealBoneCount=String(boneCount);
  this.stage.dataset.revealTarget=target;
  this.stage.dispatchEvent(new CustomEvent('motionrevealchange',{detail:{count,boneCount,boneBlocked,target,contributorCount}}));
 }
 begin(now,specimen,camera){
  const selected=this.selected&&visibleInTree(this.selected.mesh)?this.selected:null;
  const targets=selected?[selected]:this.targets.filter(part=>visibleInTree(part.mesh));
  this.selectedInView=selected;
  this.sequence++;
  if(!targets.length){this.pending=[];this.lastProbes=null;this.anchor=undefined;this.boneBlocked=false;this.roundsLeft=0;return;}
  specimen.model.updateMatrixWorld(true);
  camera.updateMatrixWorld(true);
  this.viewProjection.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);
  // Whole-body movements may have many roles. Rotate through them over
  // successive checks and retain the covers between checks.
  const windowSize=4;
  const offset=(this.targetOffset||0)%targets.length;
  const batch=targets.length<=windowSize?targets:Array.from({length:windowSize},(_,i)=>targets[(offset+i)%targets.length]);
  this.targetOffset=offset+batch.length;
  const protectedMeshes=new Set(targets.map(part=>part.mesh));
  const probes=batch.flatMap(part=>targetProbes(part,this.viewProjection,camera,this.stage.clientWidth,this.stage.clientHeight));
  this.lastProbes=probes;
  const bones=specimen.revealBones||[];
  const candidate=(mesh,bone)=>{
   if(protectedMeshes.has(mesh)||!visibleInTree(mesh)||!mesh.geometry?.attributes.position)return;
   const bounds=sampledBounds(mesh,this.viewProjection);
   if(!bounds)return;
   const relevant=probes.filter(p=>p.x>=bounds.left&&p.x<=bounds.right&&p.y>=bounds.bottom&&p.y<=bounds.top&&p.depth>cameraDepth(bounds.near,camera)-.012);
   if(relevant.length)this.pending.push({mesh,bone,probes:selected?relevant:relevant.slice(0,16)});
  };
  if(probes.length){
   for(const {mesh} of specimen.parts)candidate(mesh,false);
   for(const mesh of bones)candidate(mesh,true);
   this.pending.sort((a,b)=>b.probes.length-a.probes.length);
  }
  this.coveredByBone=false;
  this.roundSize=Math.ceil(targets.length/windowSize);
  this.nextScan=now+110;
 }
 tick(now,dt,specimen,camera,dirty,reducedMotion){
  if(!specimen?.model.visible)return;
  const working=this.targets.length||this.selected;
  let rendered=false;
  if(working&&dirty)this.roundsLeft=Math.ceil((this.selected?1:this.targets.length)/4)+1;
  if(!working){this.pending=[];this.lastProbes=null;this.anchor=undefined;this.selectedInView=null;}
  if(working&&this.roundsLeft>0&&!this.pending.length&&now>=this.nextScan){
   this.roundsLeft--;
   this.begin(now,specimen,camera);
   rendered=true;
  }
  if(this.pending.length){
   // Cap work per frame when several deep tissues cover the same target.
   const deadline=performance.now()+3;
   do{
    const {mesh,bone,probes}=this.pending.shift();
    const depths=surfaceDepths(mesh,this.viewProjection,probes);
    const hit=probes.filter((p,i)=>Number.isFinite(depths[i])&&cameraDepth(depths[i],camera)<p.depth-.0012);
    if(bone&&hit.length){
     const base=this.faded.get(mesh)?.base??mesh.material;
     if(!base.transparent||base.opacity>=.8){
      this.coveredByBone=true;
      for(const probe of hit)probe.boneBlocked=true;
     }
    }
    if(hit.length&&!bone)for(const probe of hit)probe.covers=(probe.covers||0)+1;
    if(hit.length&&(!bone||this.bones))this.fade(mesh,bone);
   }while(this.pending.length&&performance.now()<deadline);
   rendered=true;
  }
  if(working&&!this.pending.length&&this.lastProbes){
   this.boneBlocked=this.coveredByBone;
   const anchors=this.bones?this.lastProbes:this.lastProbes.filter(p=>!p.boneBlocked);
   this.anchor=this.selectedInView?anchors.reduce((best,p)=>!best||(p.covers||0)<(best.covers||0)?p:best,null)?.index:undefined;
   this.lastProbes=null;
   rendered=true;
  }
  let count=0,boneCount=0,contributorCount=0;
  for(const [mesh,entry] of this.faded){
   const protectedMuscle=this.selected?mesh===this.selected.mesh:this.targets.some(part=>part.mesh===mesh);
   const active=working&&this.sequence-entry.seen<=this.roundSize&&visibleInTree(mesh)&&!protectedMuscle&&(!entry.bone||this.bones);
   const goal=active?(entry.bone?.18:.19):entry.base.opacity;
   const difference=goal-entry.material.opacity;
   if(!active&&(!visibleInTree(mesh)||protectedMuscle||Math.abs(difference)<.015||reducedMotion)){
    mesh.material=entry.base;
    this.faded.delete(mesh);
    rendered=true;
    continue;
   }
   if(active){
    if(entry.bone)boneCount++;
    else {
     count++;
     if(this.contributors?.has(mesh))contributorCount++;
    }
   }
   entry.material.color?.copy(entry.base.color);
   entry.material.emissive?.copy(entry.base.emissive);
   if(Math.abs(difference)>.001){
    entry.material.opacity=reducedMotion?goal:entry.material.opacity+difference*Math.min(1,dt/95);
    rendered=true;
   }
  }
  this.report(count,boneCount,!!(working&&this.boneBlocked&&!this.bones),this.selectedInView&&working?this.selectedInView.name:'',contributorCount);
  return rendered;
 }
 fade(mesh,bone){
  const existing=this.faded.get(mesh);
  if(existing){existing.seen=this.sequence;return;}
  const base=mesh.material;
  if(Array.isArray(base))return;
  let material=this.materials.get(mesh);
  if(!material){
   material=base.clone();
   material.transparent=true;
   material.depthWrite=false;
   material.forceSinglePass=true;
   this.materials.set(mesh,material);
  }
  material.opacity=base.opacity;
  mesh.material=material;
  this.faded.set(mesh,{base,material,bone,seen:this.sequence});
 }
 isFaded(mesh){return (this.faded.get(mesh)?.material.opacity??1)<.65;}
}
