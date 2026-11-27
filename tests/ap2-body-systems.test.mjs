import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {bodySystemsHTML} from '../src/ap2-body-systems.js';

function loadMeshes(name){
  const file=fs.readFileSync(new URL('../assets/'+name+'.glb',import.meta.url));
  const length=file.readUInt32LE(12), doc=JSON.parse(file.toString('utf8',20,20+length)), chunk=28+length;
  const result=new Map();
  for(const node of doc.nodes.filter(n=>n.mesh!=null)){
    assert.equal(node.rotation,undefined,'Check updated registration when a mesh gains a rotation');
    assert.equal(node.matrix,undefined);
    const attr=doc.accessors[doc.meshes[node.mesh].primitives[0].attributes.POSITION],view=doc.bufferViews[attr.bufferView];
    assert.equal(attr.type,'VEC3');assert.equal(attr.componentType,5126);
    const offset=chunk+(view.byteOffset||0)+(attr.byteOffset||0),stride=view.byteStride||12;
    const points=[];
    for(let i=0;i<attr.count;i++)points.push([0,1,2].map(k=>file.readFloatLE(offset+i*stride+k*4)*(node.scale?.[k]??1)+(node.translation?.[k]??0)));
    result.set(node.name,points);
  }
  return result;
}

test('organ, thoracic and limb exports share the same registered landmarks',()=>{
  const body=loadMeshes('ap2-glands/body-overview'),locator=loadMeshes('ap2-glands/bodyparts-locator'),heart=loadMeshes('ap2-thorax'),leg=loadMeshes('ap2-leg-vessels');
  const pairs=[[body.get('pancreas'),locator.get('pancreas')],[body.get('thymus'),locator.get('thymus')],
    [locator.get('manubrium'),heart.get('sternum')],[locator.get('right_femur'),leg.get('right_femur')],[locator.get('right_tibia'),leg.get('right_tibia')]];
  for(const [source,target] of pairs){
    assert.ok(source.length>50&&target.length>50);
    for(let i=0;i<11;i++){
      const [x,y,z]=source[Math.floor((source.length-1)*i/10)];
      const match=target.some(p=>Math.hypot(p[0]-x,p[1]-y,p[2]-z)<.000002);
      assert.ok(match,'Shared source landmark must agree in all axes to within two micrometers');
    }
  }
  const html=bodySystemsHTML();
  for(const key of ['skeleton','heart','glands','arteries'])assert.ok(html.includes('data-body-layer="'+key+'"'));
  for(const [key,mesh] of [['wall_of_left_ventricle',heart],['right_dorsalis_pedis_artery',leg],['pituitary',body]]){
    assert.ok(mesh.has(key));assert.ok(html.includes('value="'+key+'"'));
  }
});

