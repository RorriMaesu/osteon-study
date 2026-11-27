import * as THREE from 'three';
import {pressureState} from './ap2-heart-cycle.js';

// Change transforms in the loaded viewer only. Anatomical mesh data stays in its rest frame.
export function mountMechanicalMotion(entry,byName){
  const resting=[];
  for(const name of entry.targets){
    for(const mesh of byName.get(name)||[]){
      mesh.updateWorldMatrix(true,false);
      const bounds=new THREE.Box3().setFromObject(mesh);
      resting.push({name,mesh,bounds,position:mesh.position.clone(),scale:mesh.scale.clone(),quaternion:mesh.quaternion.clone()});
    }
  }
  const bounds=new THREE.Box3();
  for(const record of resting)bounds.union(record.bounds);
  const size=bounds.getSize(new THREE.Vector3());
  const origin=bounds.getCenter(new THREE.Vector3());
  const anchor=(name,defaultPoint=origin)=>{
    const r=resting.find(rec=>rec.name===name);
    return r?r.bounds.getCenter(new THREE.Vector3()):defaultPoint.clone();
  };
  const diaphragm=resting.find(r=>r.name==='diaphragm');
  const lungPivot=new THREE.Vector3(0,Math.max(...resting.filter(r=>r.name.includes('lobe')).map(r=>r.bounds.max.y),0),origin.z);
  const valve=(name)=>{const mesh=byName.get(name)?.[0];return mesh?new THREE.Box3().setFromObject(mesh).getCenter(new THREE.Vector3()):origin;};
  const ventricularPivot=valve('VH_M_aortic_valve').clone().lerp(valve('VH_M_pulmonary_valve'),.5);
  const atrialPivot=valve('VH_M_mitral_valve').clone().lerp(valve('VH_M_tricuspid_valve'),.5);
  const irisCenter=anchor('Lens');
  const axisZ=new THREE.Vector3(0,0,1);
  const axisX=new THREE.Vector3(1,0,0);
  const axisY=new THREE.Vector3(0,1,0);
  const workPosition=new THREE.Vector3(),localPivot=new THREE.Vector3(),q=new THREE.Quaternion();
  // Mesh origins may be local or baked into the geometry. Use a common world pivot
  // converted to each object's parent so offsets are preserved in either case.
  function move(r,sx,sy,sz,pivot,dy=0){
    const {mesh,position,scale}=r;
    localPivot.copy(pivot);mesh.parent.worldToLocal(localPivot);
    mesh.scale.set(scale.x*sx,scale.y*sy,scale.z*sz);
    mesh.position.set(localPivot.x+(position.x-localPivot.x)*sx,
      localPivot.y+(position.y-localPivot.y)*sy+dy,localPivot.z+(position.z-localPivot.z)*sz);
  }
  function rock(r,axis,angle,pivot){
    localPivot.copy(pivot);r.mesh.parent.worldToLocal(localPivot);
    q.setFromAxisAngle(axis,angle);
    r.mesh.position.copy(workPosition.copy(r.position).sub(localPivot).applyQuaternion(q).add(localPivot));
    r.mesh.quaternion.copy(q).multiply(r.quaternion);
  }
  function restore(){
    for(const {mesh,position,scale,quaternion} of resting){
      mesh.position.copy(position);mesh.scale.copy(scale);mesh.quaternion.copy(quaternion);
    }
  }
  const ease=t=>(1-Math.cos(Math.PI*Math.max(0,Math.min(1,t))))/2;
  const near=t=>t<.25?0:t<.50?ease((t-.25)/.25):t<.64?1:1-ease((t-.64)/.36);
  const respiratory=t=>t<.4?ease(t/.4):1-ease((t-.4)/.6);
  const ossiclePivot=anchor('Malleus').lerp(anchor('Incus'),.55);
  const leftPivot=anchor('malleus_left').lerp(anchor('incus_left'),.55);
  const rightPivot=anchor('malleus_right').lerp(anchor('incus_right'),.55);
  const aryRelative=[anchor('arytenoid_cartilage_left'),anchor('arytenoid_cartilage_right')];
  function set(t){
    for(const r of resting){
      const n=r.name,m=r.mesh;
      switch(entry.mechanism){
        case 'accommodation': {
          const amount=near(t);
          // The eye section is cut on its sagittal median. The original lens
          // node origin is the optical center; the half-mesh bounding box is offset.
          const pivot=byName.get('Lens')?.[0]?.getWorldPosition(workPosition)||irisCenter;
          if(n==='Lens')move(r,1-.07*amount,1-.07*amount,1+.19*amount,pivot);
          if(n==='Ciliary muscle'||n==='Zonules')move(r,1-.06*amount,1-.06*amount,1,pivot);
          break;
        }
        case 'eyes': {
          // Each globe's lens has its own optical center in the registered specimen.
          const pivot=r.bounds.getCenter(workPosition);
          const amount=near(t);if(n.startsWith('lens_'))move(r,1-.07*amount,1-.07*amount,1+.19*amount,pivot);
          break;
        }
        case 'ossicles':
        case 'paired-ears': {
          const angle=Math.sin(t*Math.PI*2);
          const side=n.endsWith('_right')?-1:1;
          const pivot=entry.mechanism==='ossicles'?ossiclePivot:side===1?leftPivot:rightPivot;
          if(/malleus|incus/i.test(n))rock(r,axisZ,side*angle*.105,pivot);
          if(/stapes|tympanic_membrane/i.test(n)){
            const width=r.bounds.max.x-r.bounds.min.x;
            m.position.copy(r.position);m.position.x-=side*angle*width*(/stapes/i.test(n)?.13:.085);
          }
          break;
        }
        case 'breathing': {
          const fill=respiratory(t);
          if(n==='diaphragm'){
            const pivot=diaphragm.bounds.getCenter(workPosition);
            // Keep the inferior attachments in place while the domes flatten.
            // In this measured specimen the dome descends approximately 13 mm.
            pivot.y=diaphragm.bounds.min.y;
            move(r,1,1-.06*fill,1,pivot);
          }else if(n.includes('lobe'))move(r,1+.028*fill,1+.055*fill,1+.025*fill,lungPivot);
          break;
        }
        case 'heart': {
          const ms=800*t;
          if(n.includes('ventricle')){
            // End diastole is the reference shape; excursion is scaled to show
            // the pressure-derived volume change, not to assert true wall strain.
            const ejected=(120-pressureState(ms).volume)/70;
            move(r,1-.12*ejected,1-.085*ejected,1-.12*ejected,ventricularPivot);
          }else if(n.includes('cardiac_atrium')){
            const a=ms<88?0:ms<164?ease((ms-88)/76):ms<275?1-ease((ms-164)/111):0;
            move(r,1-.075*a,1-.09*a,1-.075*a,atrialPivot);
          }
          break;
        }
        case 'artery': {
          const amount=t<.2?0:t<.48?ease((t-.2)/.28):t<.64?1:1-ease((t-.64)/.36);
          // The cutaway centerline is at x = -1.14, z = 0 (posterior wall cut away).
          // The inner wall must move farther than the outer wall as media thickens.
          const delta=n==='artery_intima'?.29:n==='artery_media'?.23:.18;
          move(r,1-delta*amount,1,1-delta*amount,new THREE.Vector3(-1.14,0,0));break;
        }
        case 'larynx': {
          const rise=t<.45?ease(t/.45):t<.6?1:1-ease((t-.6)/.4);
          const pivot=r.bounds.getCenter(workPosition);
          if(n==='epiglottis'){
            pivot.y=r.bounds.min.y+.13*(r.bounds.max.y-r.bounds.min.y);
            rock(r,axisX,-.72*rise,pivot);
          }else if(n==='arytenoid_cartilage_left'||n==='arytenoid_cartilage_right'){
            const left=n.endsWith('_left'),distance=aryRelative[0].distanceTo(aryRelative[1]);
            m.position.copy(r.position);m.position.x+=(left?-1:1)*distance*.1*rise;
          }else m.position.copy(r.position);
          m.position.y+=size.y*.13*rise;m.position.z+=size.y*.07*rise;
          break;
        }
        case 'phonation': {
          const adduct=t<.2?0:t<.5?ease((t-.2)/.30):t<.74?1:1-ease((t-.74)/.26);
          // BodyParts3D vocalis runs from posterior arytenoid to anterior thyroid
          // cartilage (+Z). Approximate gross position around its anterior end.
          const left=n.endsWith('.l'),pivot=r.bounds.getCenter(workPosition);
          pivot.z=r.bounds.max.z;
          rock(r,axisY,(left?-1:1)*(.29-.39*adduct),pivot);
          break;
        }
      }
    }
  }
  return {set,dispose:restore};
}
