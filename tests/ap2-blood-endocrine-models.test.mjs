import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {Box3,Vector3} from 'three';
import {tissueModels} from '../src/ap2-tissue-models.js';
import {renderGlandPractical} from '../src/ap2-endocrine-practicals.js';
import {renderBloodFoundations} from '../src/ap2-blood-foundations.js';

async function read(kind){
  const bytes=fs.readFileSync(new URL('../assets/'+tissueModels[kind].asset+'.glb',import.meta.url));
  const buffer=bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength);
  return (await new GLTFLoader().parseAsync(buffer,'')).scene;
}
test('four tissue lessons expose labeled, selectable 3D geometry for every listed component',async()=>{
  for(const [kind,spec] of Object.entries(tissueModels)){
    const model=await read(kind),names=Object.values(spec.parts).flatMap(p=>p.keys);
    const actual=[];model.traverse(o=>{if(o.isMesh)actual.push(o.name);});
    assert.deepEqual(new Set(actual),new Set(names),kind);
    assert.ok(names.length>=5);assert.ok(Object.values(spec.parts).every(p=>p.note&&p.label));
  }
  for(const [section,kind] of [['17.3','pituitary'],['17.6','adrenal'],['17.7','pineal']])assert.ok(renderGlandPractical(section).includes('data-tissue-station="'+kind+'"'));
  assert.match(renderBloodFoundations('18.1'),/data-formed-lab/);
});
const bounds=(model,name)=>new Box3().setFromObject(model.getObjectByName(name));
test('the adrenal zones nest from outer cortex to medulla and leave an open section face',async()=>{
  const model=await read('adrenal'),ordered=['capsule','glomerulosa','fasciculata','reticularis','medulla'];
  const boxes=ordered.map(n=>bounds(model,n));
  for(const [i,b] of boxes.entries()){
    assert.ok(b.max.z>=0&&b.max.z<.02,'only the shallow relief extends beyond the cut');
    assert.ok(b.min.z<0);
    if(i){
      const outer=boxes[i-1];
      assert.ok(outer.min.x<b.min.x&&outer.max.x>b.max.x);
      assert.ok(outer.min.y<b.min.y&&outer.max.y>b.max.y&&outer.min.z<b.min.z);
    }
  }
  assert.ok(boxes[1].max.x-boxes[2].max.x < boxes[2].max.x-boxes[3].max.x);
});
test('pituitary routes reach their corresponding sides and retain two plexuses',async()=>{
  const model=await read('pituitary'),center=n=>bounds(model,n).getCenter(new Vector3());
  assert.ok(center('hypothalamus').y>center('stalk').y&&center('stalk').y>center('anterior_lobe').y);
  assert.ok(center('anterior_lobe').x<center('posterior_lobe').x);
  assert.ok(bounds(model,'anterior_lobe').containsPoint(center('secondary_plexus')));
  assert.ok(bounds(model,'posterior_lobe').containsPoint(center('axon_terminals')));
  assert.ok(center('primary_plexus').y>center('portal_veins').y&&center('portal_veins').y>center('secondary_plexus').y);
});
test('blood includes an anucleate red disc and platelet, five nucleated white-cell types, and relative size cues',async()=>{
  const model=await read('elements'),width=name=>bounds(model,name).getSize(new Vector3()).x;
  assert.equal(Object.keys(tissueModels.elements.parts).length,7);
  for(const s of ['neutrophil','basophil','eosinophil','lymphocyte','monocyte'])assert.ok(model.getObjectByName(s+'_nucleus'));
  for(const s of ['erythrocyte','platelet'])assert.equal(model.getObjectByName(s+'_nucleus'),undefined);
  assert.ok(width('platelet_fragment')<width('erythrocyte_membrane')&&width('erythrocyte_membrane')<width('monocyte_cytoplasm'));
});
