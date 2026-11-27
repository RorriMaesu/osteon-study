import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {pressureState,rightPressureState,rightPhases,rightValveChallenges} from '../src/ap2-heart-cycle.js';
import {limbRoutes} from '../src/ap2-limb-circuits.js';
import {renderLab} from '../src/ap2-cardio.js';

test('left-sided pressure gradients, valve events and isovolumetric holds agree for an entire beat',()=>{
  for(let t=0;t<=800;t++){
    const state=pressureState(t);
    assert.equal(state.mitral,t<195||t>=562,'mitral '+t);
    assert.equal(state.aortic,t>=245&&t<492,'aortic '+t);
    if(t>=195&&t<=245) assert.equal(state.volume,120);
    if(t>=492&&t<=562) assert.equal(state.volume,50);
  }
  assert.equal(pressureState(0).volume,pressureState(800).volume);
});

test('lower-pressure right circuit opens and closes at its own four crossings',()=>{
  for(let t=0;t<=800;t++){
    const state=rightPressureState(t);
    assert.equal(state.tricuspid,t<200||t>=568,'tricuspid '+t);
    assert.equal(state.pulmonary,t>=235&&t<515,'pulmonary '+t);
  }
});

test('each right-heart prediction leads to the next event shown on its own phase selector',()=>{
  const changed=(t,previous)=>['tricuspid','pulmonary'].some(valve=>rightPressureState(t)[valve]!==previous[valve]);
  for(const [t,,answer] of rightValveChallenges){
    const before=rightPressureState(t);
    const following=Array.from({length:800-t},(_,i)=>t+i+1).find(time=>changed(time,before));
    assert.equal(rightPhases.find(phase=>phase.start>t)?.start,following);
    const after=rightPressureState(following);
    assert.equal([before.tricuspid&&!after.tricuspid,!before.pulmonary&&after.pulmonary,before.pulmonary&&!after.pulmonary,!before.tricuspid&&after.tricuspid][answer],true);
  }
});

test('leg routes preserve ankle continuity and distinct deep and superficial returns',()=>{
  const labels=route=>route.steps.map(([name])=>name);
  const art=labels(limbRoutes.footArtery),superficial=labels(limbRoutes.footSuperficial);
  assert.equal(art.indexOf('Anterior tibial artery')+1,art.indexOf('Dorsalis pedis artery'));
  assert.equal(superficial.indexOf('Great saphenous vein')+1,superficial.indexOf('Femoral vein'));
  assert.equal(superficial.at(-1),'Right atrium');
  assert.ok(Object.values(limbRoutes).some(r=>labels(r).includes('Popliteal vein')));
});

function glbNodes(file){
  const glb=fs.readFileSync(new URL('../assets/'+file+'.glb',import.meta.url));
  assert.equal(glb.toString('ascii',0,4),'glTF');
  const info=JSON.parse(glb.toString('utf8',20,20+glb.readUInt32LE(12)));
  return new Map(info.nodes.filter(n=>n.mesh!=null).map(n=>{
    const position=info.accessors[info.meshes[n.mesh].primitives[0].attributes.POSITION];
    return [n.name,{...n,center:position.min.map((v,i)=>(v+position.max[i])/2*(n.scale?.[i]??1))}];
  }));
}
test('registered specimens include all four valves, sternum, labeled ankle continuation and renal vessels',()=>{
  const heart=glbNodes('ap2-heart'),thorax=glbNodes('ap2-thorax'),leg=glbNodes('ap2-leg-vessels'),trunk=glbNodes('ap2-vessels');
  for(const name of ['aortic','mitral','tricuspid','pulmonary'])assert.ok(heart.has('VH_M_'+name+'_valve'));
  for(const name of ['sternum','wall_of_left_ventricle','left_fifth_rib','fifth_thoracic_vertebra'])assert.ok(thorax.has(name));
  for(const name of ['right_femoral_artery','right_popliteal_artery','right_anterior_tibial_artery','right_dorsalis_pedis_artery','right_tibia'])assert.ok(leg.has(name));
  for(const name of ['VH_M_aortic_arch','VH_M_splenic_vein','VH_M_left_renal_artery'])assert.ok(trunk.has(name));
  for(const n of [...thorax.values(),...leg.values()])assert.equal(n.rotation,undefined,'preserve anterior direction');
  assert.ok(thorax.get('left_fifth_rib').center[0]>thorax.get('right_fifth_rib').center[0]);
  assert.ok(thorax.get('sternum').center[2]>thorax.get('wall_of_left_ventricle').center[2]);
  assert.ok(thorax.get('wall_of_left_ventricle').center[2]>thorax.get('fifth_thoracic_vertebra').center[2]);
  assert.ok(leg.get('right_femur').center[1]>leg.get('right_tibia').center[1]);
  assert.ok(leg.get('right_external_iliac_artery').center[1]>leg.get('right_femoral_artery').center[1]);
  for(const id of ['19.1','19.2','19.3','19.4','19.5','20.1','20.2','20.3','20.4','20.5','20.6'])assert.match(renderLab(id),/data-cardio-lab=/);
});

