import * as THREE from 'three';
import {cardiacValves,makeTeachingValve,openingFor} from './ap2-valve-surfaces.js';
import {pressureState,rightPressureState} from './ap2-heart-cycle.js';

// Keep the named specimen mesh selectable while replacing its static snapshot
// with the same registered leaflet reconstruction used in the cardiac-cycle lab.
export function mountHeartbeatValves(model,byName){
  model.updateWorldMatrix(true,true);
  const valves=cardiacValves.map(spec=>{
    const mesh=byName.get('VH_M_'+spec.key+'_valve')[0],original=mesh.geometry;
    const teaching=makeTeachingValve(spec);
    teaching.root.updateMatrixWorld(true);
    const matrix=mesh.matrixWorld.clone().invert().multiply(model.matrixWorld).multiply(teaching.root.matrix);
    const parts=teaching.root.children.map(o=>o.geometry);
    const count=parts.reduce((sum,g)=>sum+g.attributes.position.count,0);
    const positions=new THREE.Float32BufferAttribute(new Float32Array(count*3),3).setUsage(THREE.DynamicDrawUsage);
    const geometry=new THREE.BufferGeometry(),indices=[];
    let offset=0;
    for(const g of parts){for(const i of g.index.array)indices.push(i+offset);offset+=g.attributes.position.count;}
    geometry.setIndex(indices);geometry.setAttribute('position',positions);
    mesh.geometry=geometry;
    const v=new THREE.Vector3();
    let last=-1;
    function set(state){
      const amount=openingFor(spec,state);
      if(Math.abs(last-amount)<.003)return;
      last=amount;teaching.open(amount);
      let at=0;
      for(const part of parts){
        const src=part.attributes.position;
        for(let i=0;i<src.count;i++){v.fromBufferAttribute(src,i).applyMatrix4(matrix);positions.setXYZ(at++,v.x,v.y,v.z);}
      }
      positions.needsUpdate=true;geometry.computeVertexNormals();geometry.computeBoundingSphere();geometry.computeBoundingBox();
    }
    function dispose(){
      mesh.geometry=original;geometry.dispose();
      for(const child of teaching.root.children){child.geometry.dispose();child.material.dispose();}
    }
    return {set,dispose};
  });
  return {
    set(t){const ms=t*800,state={...pressureState(ms),...rightPressureState(ms)};for(const valve of valves)valve.set(state);},
    dispose(){for(const valve of valves)valve.dispose();}
  };
}
