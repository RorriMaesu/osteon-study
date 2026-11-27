import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

function specimen(file){
  const buffer=readFileSync(new URL('../assets/'+file+'.glb',import.meta.url));
  const gltf=JSON.parse(buffer.subarray(20,20+buffer.readUInt32LE(12)).toString('utf8'));
  const positions=new Map();
  for(const node of gltf.nodes){
    if(node.mesh===undefined)continue;
    const primitive=gltf.meshes[node.mesh].primitives[0];
    const {min,max}=gltf.accessors[primitive.attributes.POSITION];
    positions.set(node.name,min.map((lo,i)=>(lo+max[i])/2));
  }
  return positions;
}

test('right arm and leg vessels share atrial registration and preserve sided skeletal landmarks',()=>{
  const arm=specimen('ap2-arm-circulation'),leg=specimen('ap2-leg-venous-return');
  assert.deepEqual(arm.get('right_atrium'),leg.get('right_atrium'));
  assert.ok(arm.get('right_radial_artery')[0]<arm.get('right_ulnar_artery')[0]);
  assert.ok(arm.get('right_radial_artery')[1]>arm.get('right_deep_palmar_arch')[1]);
  assert.ok(leg.get('right_dorsal_venous_arch_of_foot')[1]>leg.get('right_plantar_venous_arch')[1]);
  const route=['right_plantar_venous_arch','right_posterior_tibial_veins','right_popliteal_vein','right_femoral_vein','right_external_iliac_vein','right_common_iliac_vein','abdominal_inferior_vena_cava','thoracic_inferior_vena_cava','right_atrium'];
  for(let i=1;i<route.length;i++)assert.ok(leg.get(route[i])[1]>leg.get(route[i-1])[1],route[i]);
  for(const [vessels,names] of [[arm,['context_right_first_rib','context_right_radius','right_cephalic_vein','superior_vena_cava']],
                                 [leg,['context_right_patella','context_right_tibia','right_great_saphenous_vein','right_small_saphenous_vein']]]){
    for(const name of names)assert.ok(vessels.has(name),name);
  }
});
