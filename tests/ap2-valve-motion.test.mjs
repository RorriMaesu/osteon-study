import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {Box3,Vector3} from 'three';
import {cardiacValves,makeTeachingValve,openingFor} from '../src/ap2-valve-surfaces.js';
import {pressureState,rightPressureState} from '../src/ap2-heart-cycle.js';
import {makeMitralSupports,papillaryName} from '../src/ap2-mitral-supports.js';

async function donor(){
  const bytes=await readFile(new URL('../assets/ap2-heart.glb',import.meta.url));
  const {scene}=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
  scene.updateMatrixWorld(true);return scene;
}
test('four moving valves sit at their donor surfaces and deform with their own forward gradients',async()=>{
  const heart=await donor(),split={...pressureState(500),...rightPressureState(500)};
  for(const valve of cardiacValves){
    const source=heart.getObjectByName('VH_M_'+valve.key+'_valve'),model=makeTeachingValve(valve);
    assert.ok(new Box3().setFromObject(source).containsPoint(model.root.position));
    assert.equal(model.root.children.length,1+valve.cusps);
    const leaflet=model.root.children[1],closed=leaflet.geometry.attributes.position.array.slice();
    for(let t=0;t<=800;t++){
      const state={...pressureState(t),...rightPressureState(t)},amount=openingFor(valve,state);
      assert.ok(amount>=0&&amount<=1);
      assert.equal(amount>0,state[valve.from]>state[valve.to],valve.key+' '+t);
    }
    model.open(1);assert.notDeepEqual(leaflet.geometry.attributes.position.array,closed);
    model.open(0);assert.deepEqual(leaflet.geometry.attributes.position.array,closed);
  }
  assert.equal(openingFor(cardiacValves.find(v=>v.key==='aortic'),split),0);
  assert.ok(openingFor(cardiacValves.find(v=>v.key==='pulmonary'),split)>0);
});
test('the schematic strands reach actual vertices on both donor papillary groups and the mitral valve',async()=>{
  const heart=await donor(),group=makeMitralSupports(heart);
  const onSurface=(name,point)=>{
    const mesh=heart.getObjectByName(name),v=new Vector3(),target=new Vector3(...point),p=mesh.geometry.attributes.position;
    for(let i=0;i<p.count;i++)if(v.fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld).distanceTo(target)<1e-8)return true;
    return false;
  };
  assert.equal(group.children.length,4);
  for(const strand of group.children){
    const {origin,end,papillary}=strand.userData;
    assert.ok(onSurface(papillaryName(papillary),origin));assert.ok(onSurface('VH_M_mitral_valve',end));
    assert.ok(new Vector3(...origin).distanceTo(new Vector3(...end))>.002);
  }
  assert.equal(new Set(group.children.map(s=>s.userData.papillary)).size,2);
  assert.equal(new Set(group.children.map(s=>s.userData.end.join(','))).size,4);
});
