import * as THREE from 'three';
import tracks from './organ-motion-visceral-paths.json' with {type:'json'};

const clamp=(value,min=0,max=1)=>Math.min(max,Math.max(min,value));
const temp=new THREE.Vector3();
function lookup(map,name){
  const objects=map.get(name);
  return Array.isArray(objects)?objects:objects?[objects]:[];
}
function localTime(t,span=[0,1]){
  return clamp((t-span[0])/(span[1]-span[0]));
}
function smooth(t){return t*t*(3-2*t);}

function curveFor(effect){
  const source=effect.points||tracks[effect.path];
  if(!source?.length)return;
  const points=source.map(p=>new THREE.Vector3(...p));
  // Linear segments never overshoot a tight bend. Sample spacing is based on
  // distance, so uneven mesh tessellation does not change tracer velocity.
  const distance=[0];
  for(let i=1;i<points.length;i++)distance[i]=distance[i-1]+points[i].distanceTo(points[i-1]);
  const length=distance.at(-1);
  if(!(length>0))return;
  const at=(fraction,out)=>{
    const target=clamp(fraction)*length;
    let a=0,b=distance.length-1;
    while(b-a>1){const m=(a+b)>>1;if(distance[m]<=target)a=m;else b=m;}
    return out.lerpVectors(points[a],points[b],clamp((target-distance[a])/(distance[b]-distance[a]||1)));
  };
  return {points,distance,length,at};
}

function tracerFraction(effect,p){
  const [start,end]=effect.range||[0,1];
  return start+p*(end-start);
}

function tracer(effect,curve,root,radius){
  const {length,at}=curve;
  const linePoints=Array.from({length:65},(_,i)=>at(tracerFraction(effect,i/64),new THREE.Vector3()));
  const lineGeo=new THREE.BufferGeometry().setFromPoints(linePoints);
  const lineMat=new THREE.LineBasicMaterial({color:effect.color||'#ffe28a',transparent:true,opacity:.28,depthTest:false,depthWrite:false});
  const line=new THREE.Line(lineGeo,lineMat);line.renderOrder=14;root.add(line);
  // A dark edge keeps the moving token legible on pale tissues and a cut surface.
  const beadGeo=new THREE.SphereGeometry(Math.max(radius*(effect.size||.024),Math.min(length*.035,radius*.038)),12,9);
  const outline=new THREE.MeshBasicMaterial({color:'#513c2b',side:THREE.BackSide,transparent:true,depthTest:false,depthWrite:false});
  const fill=new THREE.MeshBasicMaterial({color:effect.color||'#ffce51',transparent:true,depthTest:false,depthWrite:false});
  const marker=new THREE.Group();
  const edge=new THREE.Mesh(beadGeo,outline);
  edge.scale.setScalar(1.22);edge.renderOrder=15;
  const dot=new THREE.Mesh(beadGeo,fill);dot.renderOrder=16;
  marker.add(edge,dot);root.add(marker);
  return {
    set(t){
      const p=localTime(t,effect.span),f=tracerFraction(effect,p);
      marker.visible=t>=(effect.span?.[0]??0)&&t<=(effect.span?.[1]??1);
      line.visible=marker.visible;
      at(f,marker.position);
      return f;
    },
    dispose(){lineGeo.dispose();lineMat.dispose();beadGeo.dispose();outline.dispose();fill.dispose();}
  };
}

function varyingMesh(object,mapPosition){
  const original=object.geometry;
  const changed=original.clone(),attr=changed.getAttribute('position'),source=original.getAttribute('position');
  attr.setUsage(THREE.DynamicDrawUsage);
  const transformations=mapPosition(source);
  object.geometry=changed;
  return {
    set(t){
      const modified=transformations(t,attr);
      if(modified!==false){attr.needsUpdate=true;changed.computeVertexNormals();}
    },
    dispose(){object.geometry=original;changed.dispose();}
  };
}

function wave(object,effect,curve){
  const {points,distance,length}=curve, width=effect.width||.10, cutoff=effect.radius||Infinity;
  return varyingMesh(object,source=>{
    const affected=[],a=new THREE.Vector3(),b=new THREE.Vector3(),p=new THREE.Vector3(),d=new THREE.Vector3();
    for(let i=0;i<source.count;i++){
      p.fromBufferAttribute(source,i);
      let best=Infinity,along=0,center=new THREE.Vector3();
      for(let j=1;j<points.length;j++){
        a.copy(points[j-1]);d.subVectors(points[j],a);
        const t=clamp(b.subVectors(p,a).dot(d)/(d.lengthSq()||1));
        b.copy(a).addScaledVector(d,t);
        const gap=p.distanceToSquared(b);
        if(gap<best){best=gap;along=(distance[j-1]+(distance[j]-distance[j-1])*t)/length;center.copy(b);}
      }
      if(best>cutoff*cutoff)continue;
      const edge=clamp(along/.075)*clamp((1-along)/.075);
      if(edge>0)affected.push([i,along,edge,p.x,p.y,p.z,center.x-p.x,center.y-p.y,center.z-p.z]);
    }
    return (t,attr)=>{
      const p=localTime(t,effect.span);
      const on=t>=(effect.span?.[0]??0)&&t<=(effect.span?.[1]??1);
      // A propulsive ring squeezes the lumen on the oral (or renal) side of its bolus.
      // The gastric mixing wave has a separate clock as contents can reverse direction.
      const traveling=effect.marker?tracerFraction(effect,p)-1.5*width:p*1.36-.18;
      for(const [i,f,edge,x,y,z,dx,dy,dz] of affected){
        const strength=effect.mode==='mix'
          ? (.5-.5*Math.cos(2*Math.PI*p))*Math.pow(.5+.5*Math.cos(4*Math.PI*(f-.28*Math.sin(2*Math.PI*p))),3)
          : Math.exp(-.5*((f-traveling)/width)**2)*Math.sin(Math.PI*p)**.4;
        const amount=on*(effect.amplitude||.18)*edge*strength;
        attr.setXYZ(i,x+dx*amount,y+dy*amount,z+dz*amount);
      }
    };
  });
}

function reservoir(object,effect){
  const box=effect.bounds?new THREE.Box3(new THREE.Vector3(...effect.bounds[0]),new THREE.Vector3(...effect.bounds[1])):new THREE.Box3().setFromBufferAttribute(object.geometry.attributes.position);
  const size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());
  const anchor=effect.pivot||[center.x,box.min.y,center.z];
  const pivot=new THREE.Vector3(...anchor);
  return varyingMesh(object,source=>{
    const points=[];
    for(let i=0;i<source.count;i++){
      temp.fromBufferAttribute(source,i);
      const weight=(effect.pivot?clamp(temp.distanceTo(pivot)/(size.length()*.60)):smooth(clamp((temp.y-box.min.y)/(size.y*.50||1))))*
        (effect.fixPosterior?smooth(clamp((temp.z-box.min.z)/(size.z*.35||1))):1);
      points.push([temp.x,temp.y,temp.z,weight]);
    }
    return (t,attr)=>{
      const p=localTime(t,effect.span);
      // The taper fixes a duct attachment or bladder neck throughout the cycle.
      const delta=effect.empty
        ? -effect.amount*(p<.55?smooth(p/.55):1-smooth((p-.55)/.45))
        : effect.amount*(p<.55?smooth(p/.55):1-smooth((p-.55)/.45));
      for(const [i,[x,y,z,weight]] of points.entries()){
        const k=delta*weight;
        attr.setXYZ(i,x+(x-anchor[0])*k,y+(y-anchor[1])*k*1.3,z+(z-anchor[2])*k);
      }
    };
  });
}

function tongueLift(object){
  const box=new THREE.Box3().setFromBufferAttribute(object.geometry.attributes.position),size=box.getSize(new THREE.Vector3());
  return varyingMesh(object,source=>{
    const points=[];
    for(let i=0;i<source.count;i++){
      temp.fromBufferAttribute(source,i);
      const fromFront=(box.max.z-temp.z)/size.z;
      const upper=smooth(clamp((temp.y-box.min.y)/size.y));
      points.push([temp.x,temp.y,temp.z,fromFront,upper]);
    }
    return (t,attr)=>{
      for(const [i,[x,y,z,f,upper]] of points.entries()){
        const height=size.y*.15*upper*Math.exp(-.5*((f-(1.18*t-.10))/.19)**2)*Math.sin(t*Math.PI);
        attr.setXYZ(i,x,y+height,z);
      }
    };
  });
}

function cue(object,effect){
  // Material references on a specimen can be shared. Copy before applying any
  // temporary highlighting so nearby context and subsequent specimens stay intact.
  const original=object.material;
  const list=[].concat(original).map(m=>m.clone());
  object.material=Array.isArray(original)?list:list[0];
  const base=list.map(m=>m.color?.clone());
  const color=new THREE.Color(effect.color||'#ffe28a');
  return {set(t){
    const p=localTime(t,effect.span);
    const level=Math.sin(Math.PI*p)**.7*.82;
    list.forEach((m,i)=>{if(base[i])m.color.copy(base[i]).lerp(color,level);});
  },dispose(){object.material=original;list.forEach(m=>m.dispose());}};
}

export function mountVisceralMotion(entry,instance,meshesByName){
  const root=new THREE.Group();root.name='Visceral process indicators';
  instance.model.add(root);
  const bounds=new THREE.Box3();
  for(const target of entry.targets)for(const obj of lookup(meshesByName,target))bounds.union(new THREE.Box3().setFromObject(obj));
  const radius=bounds.isEmpty()?1:bounds.getSize(new THREE.Vector3()).length()*.5;
  const operations=[];
  for(const effect of entry.effects){
    const meshes=lookup(meshesByName,effect.mesh);
    if(effect.mode==='fill'||effect.mode==='empty'){
      for(const object of meshes)operations.push(reservoir(object,{...effect,empty:effect.mode==='empty'}));
    } else if(effect.mode==='tongue'){
      for(const object of meshes)operations.push(tongueLift(object));
    } else if(effect.mode==='cue'){
      for(const object of meshes)operations.push(cue(object,effect));
    } else {
      const curve=curveFor(effect);
      if(!curve)continue;
      if(effect.mode==='wave'||effect.mode==='mix')for(const obj of meshes)operations.push(wave(obj,effect,curve));
      if(effect.mode==='trace'||effect.marker)operations.push(tracer(effect,curve,root,radius));
    }
  }
  let disposed=false;
  return {set(t){
    if(disposed)return;
    const p=clamp(Number(t)||0);
    for(const op of operations)op.set(p);
    instance.invalidate();
  },dispose(){
    if(disposed)return;disposed=true;
    for(const op of operations.reverse())op.dispose();root.removeFromParent();
  }};
}

export {visceralOrgans} from './organ-motion-visceral-catalog.js';
