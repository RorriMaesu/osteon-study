import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {regulationOrgans} from '../src/organ-motion-regulation.js';
import {mountMechanicalMotion} from '../src/organ-motion-regulation-dynamics.js';

const entry=regulationOrgans.find(o=>o.id==='paired-eyes');
const parts=['sclera','cornea','iris','lens','retina'];
const up=new THREE.Vector3(0,1,0);
const close=(a,b,label)=>assert.ok(Math.abs(a-b)<1e-8,`${label}: ${a} vs ${b}`);
async function specimen(){
  const file=readFileSync(new URL('../assets/organ-atlas/registered-organs.glb',import.meta.url));
  const scene=(await new GLTFLoader().parseAsync(file.buffer.slice(file.byteOffset,file.byteOffset+file.byteLength),'')).scene;
  scene.updateMatrixWorld(true);
  const byName=new Map(entry.targets.map(name=>[name,[scene.getObjectByName(name)]]));
  return {scene,byName,motion:mountMechanicalMotion(entry,byName)};
}
function center(mesh){mesh.geometry.computeBoundingBox();return mesh.geometry.boundingBox.getCenter(new THREE.Vector3());}
function pupilCenter(iris){
  const sign=iris.name.endsWith('_left')?1:-1;
  const positions=iris.geometry.getAttribute('position'),mean=new THREE.Vector3();
  let count=0;
  for(let i=0;i<positions.count;i++){
    const p=new THREE.Vector3().fromBufferAttribute(positions,i);
    if(Math.hypot(p.x-.0311366*sign,p.y-1.5912949)<.0019){mean.add(p);count++;}
  }
  assert.ok(count>30,'pupil rim found on donor iris');
  return mean.divideScalar(count);
}
const snapshot=mesh=>[...mesh.position.toArray(),...mesh.quaternion.toArray(),...mesh.scale.toArray()];

test('both pupils converge smoothly, keeping the globe centers still and all optical tissues aligned',async()=>{
  const {scene,byName,motion}=await specimen();
  const eyes=['left','right'].map(side=>{
    const sclera=byName.get('sclera_'+side)[0],iris=byName.get('iris_'+side)[0];
    const globe=sclera.localToWorld(center(sclera)),pupil=pupilCenter(iris);
    const tissues=parts.map(part=>{
      const mesh=byName.get(part+'_'+side)[0],local=center(mesh);
      return {part,mesh,local,far:mesh.localToWorld(local.clone()),rest:snapshot(mesh)};
    });
    return {side,globe,iris,pupil,tissues};
  });
  const spacing=()=>eyes[0].iris.localToWorld(eyes[0].pupil.clone()).x-eyes[1].iris.localToWorld(eyes[1].pupil.clone()).x;
  const farWidth=spacing();
  let nearWidth,halfWidth;
  for(const [time,amount] of [[.25,0],[.375,.5],[.50,1],[.64,1],[.82,.5],[1,0]]){
    motion.set(time);scene.updateMatrixWorld(true);
    for(const {side,globe,tissues} of eyes){
      const angle=THREE.MathUtils.degToRad((side==='left'?-6:6)*amount);
      for(const {part,mesh,local,far} of tissues){
        const expected=far.clone().sub(globe).applyAxisAngle(up,angle).add(globe);
        close(mesh.localToWorld(local.clone()).distanceTo(expected),0,side+' '+part+' center');
        const normal=new THREE.Vector3(0,0,1).applyQuaternion(mesh.quaternion);
        close(Math.atan2(normal.x,normal.z),angle,part+' yaw');
        close(mesh.scale.x,part==='lens'?1-.07*amount:1,part+' width');
        close(mesh.scale.z,part==='lens'?1+.19*amount:1,part+' thickness');
      }
    }
    if(time===.375)halfWidth=spacing();
    if(time===.5){nearWidth=spacing();assert.ok(farWidth>halfWidth&&halfWidth>nearWidth);assert.ok(farWidth-nearWidth>.0018);}
    if(time===.82)close(spacing(),halfWidth,'reverse path');
    if(time===1)close(spacing(),farWidth,'distance viewing restored');
  }
  motion.set(.53);motion.dispose();scene.updateMatrixWorld(true);
  close(spacing(),farWidth,'disposal from near focus');
  for(const {tissues} of eyes)for(const {mesh,rest} of tissues)assert.deepEqual(snapshot(mesh),rest);
});
