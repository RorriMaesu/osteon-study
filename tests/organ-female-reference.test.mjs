import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {femaleBody} from '../src/organ-female-body.js';

const binary=readFileSync(new URL('../'+femaleBody.asset,import.meta.url));
const gltf=JSON.parse(binary.toString('utf8',20,20+binary.readUInt32LE(12)));
const meshByName=new Map(gltf.nodes.map(node=>[node.name,gltf.meshes[node.mesh]]));
function bounds(name){
  const mesh=meshByName.get(name);
  assert.ok(mesh,'Missing female surface '+name);
  return gltf.accessors[mesh.primitives[0].attributes.POSITION];
}
function center(name,axis){const {min,max}=bounds(name);return (min[axis]+max[axis])/2;}

test('each selectable female organ and reference bone maps to exactly one rendered surface',()=>{
  const targets=femaleBody.organs.flatMap(row=>row.targets);
  assert.equal(new Set(targets).size,targets.length);
  assert.deepEqual(new Set([...femaleBody.boneNames,...targets]),new Set(meshByName.keys()));
  assert.ok(femaleBody.organs.find(row=>row.id==='skin').contextOnly);
  for(const name of [...targets,...femaleBody.boneNames]){
    const {min,max}=bounds(name);
    for(let i=0;i<3;i++)assert.ok(max[i]>min[i],name+' has width, depth and height');
  }
});

test('female exterior and bilateral reproductive and urinary surfaces retain registration',()=>{
  const skin=bounds('skin');
  assert.ok(skin.max[1]-skin.min[1]>1.6&&skin.max[1]-skin.min[1]<1.7);
  for(const [left,right] of [['left_ovary','right_ovary'],['uterine_tube_left','uterine_tube_right'],
    ['kidney_left','kidney_right'],['sclera_left','sclera_right'],['nipple_left','nipple_right']]){
    assert.ok(center(left,0)>center(right,0),left+' is on the anatomical left');
  }
  assert.ok(center('upper_teeth',1)>center('lower_teeth',1));
  assert.ok(center('body_of_uterus',1)>center('cervix',1));
  assert.ok(center('urinary_bladder',2)>center('rectum',2));
  const tooth=meshByName.get('upper_teeth').primitives[0];
  const color=gltf.materials[tooth.material].pbrMetallicRoughness.baseColorFactor;
  assert.ok(color.every(v=>v>.75)&&color[0]>color[2],'Bright warm dental surfaces');
});
