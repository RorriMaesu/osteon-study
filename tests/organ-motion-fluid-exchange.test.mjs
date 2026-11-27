import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DoubleSide,Raycaster,Vector3} from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {fluidExchangeOrgans} from '../src/organ-motion-fluid-exchange.js';
import {specimenAnimations,animationForTarget,specimenMotionRoute} from '../src/ap3-specimen-animations.js';
import {specimens} from '../src/ap3-specimens-catalog.js';

async function containment(entry){
  const bytes=readFileSync(new URL('../'+entry.asset,import.meta.url));
  const {scene}=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
  scene.updateMatrixWorld(true);
  scene.traverse(o=>{if(o.isMesh)for(const m of [].concat(o.material))m.side=DoubleSide;});
  const ray=new Raycaster(),direction=new Vector3(.42,.33,.91).normalize();
  return (name,point)=>{
    ray.set(new Vector3(...point),direction);
    const hits=ray.intersectObject(scene.getObjectByName(name),false);
    return hits.filter((hit,i)=>i===0||hit.distance-hits[i-1].distance>1e-6).length%2===1;
  };
}

test('water crosses the capillary wall into interstitial fluid, then crosses a separate cell membrane',async()=>{
  const [entry]=fluidExchangeOrgans,inside=await containment(entry);
  const routes=entry.effects.map(e=>e.points);
  for(let i=1;i<routes.length;i++)assert.deepEqual(routes[i-1].at(-1),routes[i][0]);
  assert(inside('plasma',routes[0][0])&&!inside('red_blood_cells',routes[0][0]));
  assert(inside('capillary_wall',routes[1][1])&&!inside('plasma',routes[1][1]));
  assert(inside('interstitial_fluid',routes[2][1]));
  assert(inside('cell_membrane',routes[3][1])&&!inside('intracellular_fluid',routes[3][1]));
  assert(inside('intracellular_fluid',routes.at(-1).at(-1)));
});

test('only the oxygen marker crosses from maternal blood into a fetal capillary',async()=>{
  const [,entry]=fluidExchangeOrgans,inside=await containment(entry);
  const [maternalIn,fetalIn,oxygen,maternalOut,fetalOut]=entry.effects.map(e=>e.points);
  for(const path of [maternalIn,maternalOut,fetalIn,fetalOut]){
    const fetal=path===fetalIn||path===fetalOut;
    const blood=fetal?['fetal_arteriole','fetal_capillaries','fetal_venule']:['maternal_spiral_artery','intervillous_space','maternal_vein'];
    for(let i=1;i<path.length;i++){
      const middle=path[i-1].map((p,k)=>(p+path[i][k])/2);
      assert.equal(inside('chorionic_villus',middle),fetal,JSON.stringify(middle));
      assert(blood.some(mesh=>inside(mesh,middle)),JSON.stringify(middle));
    }
  }
  assert.deepEqual(oxygen[0],maternalIn.at(-1));assert.deepEqual(oxygen[0],maternalOut[0]);
  assert.deepEqual(oxygen.at(-1),fetalIn.at(-1));assert.deepEqual(oxygen.at(-1),fetalOut[0]);
  assert(inside('intervillous_space',oxygen[0]));assert(inside('fetal_capillaries',oxygen.at(-1)));
  assert(!inside('chorionic_villus',oxygen[0]));assert(inside('chorionic_villus',oxygen.at(-1)));
  const crossed=new Set();
  for(let i=0;i<=30;i++){
    const p=oxygen[0].map((v,k)=>v+(oxygen[1][k]-v)*i/30);
    crossed.add(inside('fetal_capillaries',p)?'fetal blood':inside('chorionic_villus',p)?'villous tissue':'maternal blood');
  }
  assert.deepEqual([...crossed],['maternal blood','villous tissue','fetal blood']);
  for(const [specimenId,target,phase] of [['placental-exchange','fetal_capillaries',2],['fluid-spaces','cell_membrane',4]]){
    const s=specimens.find(x=>x.id===specimenId),choices=specimenAnimations(s),entry=choices[0];
    assert.equal(animationForTarget(s,target,choices),entry);
    assert.equal(specimenMotionRoute(entry,target),'organs/'+entry.id+'/step-'+phase);
  }
});
