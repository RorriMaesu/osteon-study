import * as THREE from 'three';
import {regulationOrgans} from './organ-motion-regulation-catalog.js';
import {mountMechanicalMotion} from './organ-motion-regulation-dynamics.js';
import {mountHeartbeatValves} from './organ-motion-heart-valves.js';
export {regulationOrgans};

const WARM = new THREE.Color('#efb23b');
const FLOW = new THREE.Color('#31beba');
const smooth=t=>t*t*(3-2*t);
// IE-Map (Ahmadi et al., CC BY 4.0). In the native labyrinth frame, millimetres.
// Midpoints of the two scala surfaces' 32 cross sections, taken at equal
// fractions of geodesic distance from the basal end of each triangulated cast.
// This gives a teaching trajectory for the partition between the scalae.
const cochlearPartition=[[-4.587,-4.058,3.489],[-4.300,-4.056,3.578],[-3.924,-4.086,3.572],[-3.493,-4.227,3.654],
  [-3.088,-4.464,3.857],[-2.618,-4.692,4.050],[-2.141,-4.929,4.188],[-1.661,-5.077,4.423],
  [-1.206,-5.174,4.606],[-.742,-5.124,4.820],[-.268,-5.108,5.061],[.117,-4.895,5.350],
  [.508,-4.775,5.688],[.819,-4.460,6.026],[1.111,-4.085,6.315],[1.285,-3.629,6.636],
  [1.330,-3.075,6.919],[1.193,-2.391,7.102],[1.036,-1.832,7.256],[.757,-1.271,7.247],
  [.386,-.794,7.282],[-.138,-.355,7.112],[-.815,-.156,6.671],[-1.477,-.287,6.287],
  [-1.980,-.617,5.914],[-2.358,-1.008,5.709],[-2.522,-1.681,5.604],[-2.377,-2.497,5.613],
  [-2.024,-3.175,5.754],[-1.451,-3.521,6.118],[-.802,-3.606,6.688],[-.384,-3.652,7.097]];

// Directions refer to the native glTF world frame. Only long, continuous
// structures get moving intraluminal markers. Other surfaces get a site marker.
const channels={
  'Aqueduct of midbrain':['y',-1], portal_veins:['y',-1], neurosecretory_axons:['y',-1],
  splenic_vein:['x',-1], 'VH_M_ascending_aorta':['y',1],
  VH_M_left_anterior_descending_artery:['y',-1],VH_M_great_cardiac_vein:['y',1],VH_M_middle_cardiac_vein:['x',-1],VH_M_coronary_sinus:['x',-1],
  right_femoral_vein:['y',1],right_external_iliac_vein:['y',1],right_common_iliac_vein:['y',1],
  abdominal_inferior_vena_cava:['y',1],thoracic_inferior_vena_cava:['y',1],
  inferior_vena_cava_abdominal_part:['y',1],inferior_vena_cava_thoracic_part:['y',1],superior_vena_cava:['y',-1],
  nasolacrimal_duct_left:['y',-1],nasolacrimal_duct_right:['y',-1],efferent_vessel:['x',1]
};
const siteHints={
  region_Nasal_mucosa:[.52,.91,.46],region_Thalamus:[.74,.50,.15],
  region_Left_occipital_lobe:[.10,.50,.15],region_Right_occipital_lobe:[.90,.50,.15],
  region_Tongue:[.58,.77,.84],region_Epidermis:[.65,.91,.85]
};

export function regulationPhaseAt(entry,t){
  t=Math.min(1,Math.max(0,Number.isFinite(t)?t:0));
  const {phases}=entry;
  const at=i=>i===phases.length?1:phases[i].at??i/phases.length;
  let index=0;
  while(index+1<phases.length&&t>=at(index+1))index++;
  return {index,phase:phases[index],u:(t-at(index))/(at(index+1)-at(index)),t};
}

function mapSurface(objects,name,entry){
  const points=[],point=new THREE.Vector3(),box=new THREE.Box3();
  for(const mesh of objects){
    mesh.updateWorldMatrix(true,false);
    const attr=mesh.geometry.getAttribute('position');
    const stride=Math.max(1,Math.ceil(attr.count/1100));
    for(let i=0;i<attr.count;i+=stride){
      point.fromBufferAttribute(attr,i).applyMatrix4(mesh.matrixWorld);
      points.push(point.clone());box.expandByPoint(point);
    }
  }
  if(!points.length)return null;
  const size=box.getSize(new THREE.Vector3()),hint=siteHints[name]||[.52,.58,.82];
  const aim=box.min.clone().add(new THREE.Vector3(...hint).multiply(size));
  const anchor=points.reduce((a,b)=>b.distanceToSquared(aim)<a.distanceToSquared(aim)?b:a);
  let channel=channels[name];
  if(entry.mechanism==='airflow')channel=['y',-1];
  let path;
  if(channel){
    const [axis,dir]=channel,span=size[axis];
    if(span>1e-12){
      // Find the center of each surface ring along the channel, including
      // lateral curvature. This follows real mesh cross sections, not a line
      // between regional bounding-box centers.
      const bins=Array.from({length:16},()=>({n:0,box:new THREE.Box3()}));
      for(const p of points){
        const i=Math.min(15,Math.max(0,Math.floor((p[axis]-box.min[axis])/span*16)));
        bins[i].box.expandByPoint(p);bins[i].n++;
      }
      const centers=bins.filter(bin=>bin.n).map(bin=>bin.box.getCenter(new THREE.Vector3()));
      if(dir<0)centers.reverse();
      if(centers.length>1)path=centers;
    }
  }
  return {anchor,size,box,path};
}

function flowPosition(target,path,u){
  const s=Math.min(.999999,Math.max(0,u))*(path.length-1);
  const i=Math.floor(s);
  return target.copy(path[i]).lerp(path[i+1],s-i);
}

function releaseLevel(entry,index,u){
  if(entry.mechanism==='pineal-release'||entry.mechanism==='feedback-release'){
    if(index===0)return .20+.13*u;
    if(index===1)return .4+.6*smooth(u);
    return 1-.8*smooth(u);
  }
  if(entry.mechanism==='selection')return [1,.65,.27][index];
  if(entry.mechanism==='immune-response')return index===0?.32:.44+.56*u;
  return .78;
}

// The HRA sagittal section was bisected without capping its open surfaces.
// Close the convex cut edge of the lens with its own sampled rim. This makes
// the actual biconvex profile visible in a side view and follows its motion.
function makeLensSection(mesh){
  const geometry=mesh.geometry,position=geometry.getAttribute('position');
  if(!geometry.boundingBox)geometry.computeBoundingBox();
  const box=geometry.boundingBox,cut=box.max.x;
  const tolerance=(cut-box.min.x)*.0005;
  const rim=new Map();
  for(let i=0;i<position.count;i++){
    if(position.getX(i)<cut-tolerance)continue;
    const y=position.getY(i),z=position.getZ(i);
    rim.set(y.toFixed(8)+'/'+z.toFixed(8),[y,z]);
  }
  if(rim.size<3)return;
  const points=[...rim.values()];
  const [cy,cz]=points.reduce(([sy,sz],[y,z])=>[sy+y/points.length,sz+z/points.length],[0,0]);
  points.sort(([y,z],[by,bz])=>Math.atan2(z-cz,y-cy)-Math.atan2(bz-cz,by-cy));
  const vertices=[cut,cy,cz],indices=[];
  points.forEach(([y,z],i)=>{vertices.push(cut,y,z);indices.push(0,i+1,(i+1)%points.length+1);});
  const face=new THREE.BufferGeometry();
  face.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));face.setIndex(indices);face.computeVertexNormals();
  const section=new THREE.Mesh(face,[].concat(mesh.material)[0]);
  section.name='Lens section through specimen rim';mesh.add(section);
  return section;
}

export function mountRegulationMotion(entry,instance,meshesByName){
  const mechanical=entry.kind==='Organ movement'||entry.kind==='Movement and flow';
  const mechanism=mechanical?mountMechanicalMotion(entry,meshesByName):null;
  const valves=entry.mechanism==='heart'?mountHeartbeatValves(instance.model,meshesByName):null;
  valves?.set(0);
  const surfaces=new Map(),ink=new Map(),materialDefaults=new Map();
  const specimenMaterials=new Map();
  const sections=[];
  const modelBounds=new THREE.Box3();
  for(const key of entry.targets){
    const found=meshesByName.get(key)||[];
    const surface=mapSurface(found,key,entry);
    if(surface){surfaces.set(key,surface);modelBounds.union(surface.box);}
    const materials=new Set(found.flatMap(m=>[].concat(m.material||[])).filter(m=>m.emissive));
    ink.set(key,materials);
    for(const m of materials)if(!materialDefaults.has(m))materialDefaults.set(m,{color:m.emissive.clone(),intensity:m.emissiveIntensity});
    if(valves||entry.id==='thyroid'||entry.id==='eye'||entry.id==='coronary-circulation'||key==='diaphragm')for(const m of materials){
      if(!specimenMaterials.has(m))specimenMaterials.set(m,{color:m.color.clone(),transparent:m.transparent,opacity:m.opacity,depthWrite:m.depthWrite,side:m.side});
      if(valves){
        if(key.endsWith('_valve')){m.color.set('#e5b665');m.side=THREE.DoubleSide;m.needsUpdate=true;}
        else{m.transparent=true;m.opacity=.19;m.depthWrite=false;}
      }
      else if(entry.id==='coronary-circulation')m.color.set(/vein|sinus/.test(key)?'#557dba':'#bd6161');
      else if(key==='diaphragm')m.color.set('#a56253');
      else if(entry.id==='eye')m.color.set(key==='Lens'?'#9cd5d3':key==='Zonules'?'#e4d9b8':'#ae6d67');
      else m.color.set(key==='capillary'?'#b65265':key==='colloid_section'?'#e7bb78':'#ae7d87');
      if(key==='colloid_section'){m.transparent=true;m.opacity=.60;m.depthWrite=false;}
    }
    if(entry.id==='eye'&&key==='Lens')for(const mesh of found){const section=makeLensSection(mesh);if(section)sections.push(section);}
  }
  const radius=Math.max(modelBounds.getSize(new THREE.Vector3()).length(),1e-6);
  const count=4; // An explanatory marker at each current site, independent of mesh density.
  const group=new THREE.Group();group.name='Regulation physiology overlay';instance.scene.add(group);
  const geometry=new THREE.SphereGeometry(1,12,8);
  const materials=Array.from({length:count},(_,i)=>new THREE.MeshBasicMaterial({
    color:i?FLOW:WARM,transparent:true,opacity:1,depthTest:false,depthWrite:false,toneMapped:false
  }));
  const maxSites=Math.max(...entry.phases.map(p=>p.sites.length));
  const cochlea=entry.mechanism==='cochlear-wave';
  const markers=Array.from({length:mechanical?0:cochlea?cochlearPartition.length:Math.max(1,maxSites)*count},(_,i)=>{
    const m=new THREE.Mesh(geometry,materials[i%count]);m.renderOrder=7;m.visible=false;group.add(m);return m;
  });
  const emission=new THREE.Color();
  let closed=false;
  function set(time){
    if(closed)return;
    const {index,phase,u,t}=regulationPhaseAt(entry,time);
    mechanism?.set(t);
    valves?.set(t);
    for(const [mat,base] of materialDefaults){mat.emissive.copy(base.color);mat.emissiveIntensity=base.intensity;}
    const level=releaseLevel(entry,index,u);
    const glow=(mechanical ? .14 : .10+.39*level)+.09*Math.sin(Math.PI*u);
    for(const name of phase.sites)for(const mat of ink.get(name)||[]){
      const base=materialDefaults.get(mat);
      mat.emissive.copy(emission.copy(base.color).lerp(WARM,glow));mat.emissiveIntensity=Math.max(base.intensity,.85);
    }
    for(const mark of markers)mark.visible=false;
    if(cochlea){
      const peak=index===0?.22:.78;
      markers.forEach((mark,i)=>{
        const place=i/(markers.length-1);
        const arrival=Math.min(1,u*4);
        const amplitude=Math.exp(-((place-peak)**2)/.033)*Math.max(0,1-Math.max(0,place-peak)*4);
        const wave=.5+.5*Math.sin(2*Math.PI*(u*4-place*1.8));
        mark.visible=true;
        mark.position.fromArray(cochlearPartition[i]).multiplyScalar(.001);
        mark.scale.setScalar(.000035+(place<arrival?amplitude*wave*.00028:0));
      });
      instance.invalidate();return;
    }
    if(!mechanical)phase.sites.forEach((name,siteIndex)=>{
      const s=surfaces.get(name);if(!s)return;
      const length=s.size.length();
      // Tiny paired glands still need a legible release signal on a phone.
      const height=instance.renderer?.domElement?.clientHeight;
      const camera=instance.camera;
      const pixel=height&&camera?.isPerspectiveCamera?2*camera.position.distanceTo(s.anchor)*Math.tan(THREE.MathUtils.degToRad(camera.fov/2))/height:0;
      const relative=Math.max(Math.min(radius*.029,pixel*2.7),Math.min(radius*.018,Math.max(radius*.006,length*.035)));
      for(let j=0;j<count;j++){
        const m=markers[siteIndex*count+j];
        m.visible=true;
        let tick=(u*1.2+j/count)%1;
        if(s.path){
          if(entry.mechanism==='airflow'&&index>=2)tick=1-tick;
          flowPosition(m.position,s.path,tick);
          m.scale.setScalar(relative*(j===0?1.20:.76));
        }else{
          // All positions are registered to one representative surface site.
          // Expansion denotes local activity, not a measured cellular trajectory.
          m.position.copy(s.anchor);
          const orbit=(j-1)*Math.PI*2/3;
          const spread=relative*(1+2.5*tick)*level;
          if(j){m.position.x+=Math.cos(orbit)*spread;m.position.y+=Math.sin(orbit)*spread;m.position.z+=.5*spread;}
          const pulse=j?(1-.7*tick)*level:.85+.32*Math.sin(Math.PI*2*u);
          m.scale.setScalar(relative*(j?.83:1.15)*pulse);
        }
      }
    });
    instance.invalidate();
  }
  function dispose(){
    if(closed)return;closed=true;
    mechanism?.dispose();
    valves?.dispose();
    for(const [mat,base] of materialDefaults){mat.emissive.copy(base.color);mat.emissiveIntensity=base.intensity;}
    for(const [mat,base] of specimenMaterials){mat.color.copy(base.color);mat.transparent=base.transparent;mat.opacity=base.opacity;mat.depthWrite=base.depthWrite;mat.side=base.side;mat.needsUpdate=true;}
    for(const section of sections){section.removeFromParent();section.geometry.dispose();}
    group.removeFromParent();geometry.dispose();for(const m of materials)m.dispose();
  }
  return {set,dispose};
}
