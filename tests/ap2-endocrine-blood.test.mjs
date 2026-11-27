import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {renderLab as endocrine} from '../src/ap2-regulation-labs.js';
import {renderLab as blood} from '../src/ap2-cardio.js';
import {signalOutcome} from '../src/ap2-endocrine-practicals.js';
import {teachingFields, examFields, clotFrame} from '../src/ap2-blood-stations.js';
import {bloodExamItems} from '../src/ap2-blood-exam.js';

const location = file=>new URL('../'+file,import.meta.url);
function readGltf(filename){
  const bytes=readFileSync(location('assets/ap2-glands/'+filename));
  assert.equal(bytes.toString('ascii',0,4),'glTF');
  assert.equal(bytes.readUInt32LE(8),bytes.length);
  return JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString('utf8'));
}

test('endocrine practicals are reachable by section and the signaling section tests a target cell',()=>{
  for(const id of ['17.1','17.2','17.3','17.4','17.5','17.6','17.9'])assert.ok(endocrine(id).includes('data-gland-station="'+id+'"'),id);
  assert.doesNotMatch(endocrine('17.2'),/Negative feedback bench/i);
  assert.match(endocrine('17.4'),/data-feedback-drive/);
  for(const [route,block] of Object.entries({camp:'cyclase',ip3:'ip3r',nuclear:'transcription',insulin:'kinase'})){
    assert.equal(signalOutcome(route,block).stopped,true);
    assert.equal(signalOutcome(route,'none').stopped,false);
  }
  assert.equal(signalOutcome('nuclear','cyclase').stopped,false);
});

test('gland context extends from the feet to the skull and provides all registered bilateral targets',()=>{
  const overview=readGltf('body-overview.glb'),local=readGltf('bodyparts-locator.glb');
  assert.deepEqual(overview.meshes.map(m=>m.name).sort(),['context_skeleton','left_adrenal','left_kidney','pancreas','pituitary','right_adrenal','right_kidney','thymus']);
  const skeleton=overview.meshes.find(m=>m.name==='context_skeleton');
  const bounds=overview.accessors[skeleton.primitives[0].attributes.POSITION];
  assert.ok(bounds.max[1]-bounds.min[1]>1.6);
  assert.ok(bounds.max[0]-bounds.min[0]>.6);
  for(const name of ['sphenoid','pituitary','left_adrenal','right_adrenal','pancreas','l1','t12'])assert.ok(local.meshes.some(m=>m.name===name),name);
  for(const file of ['follicle-cutaway.glb','islet-cutaway.glb'])assert.ok(readGltf(file).nodes.length>6);
  assert.equal(readGltf('pancreas-v1.3.glb').meshes.length,5);
});

test('blood film practice and exam use unique pathologist-labeled fields with disjoint sources',()=>{
  assert.match(blood('18.4'),/data-check-smear/);
  assert.equal(teachingFields.length,18);assert.equal(examFields.length,6);
  assert.equal(new Set([...teachingFields,...examFields].map(r=>r.source)).size,24);
  for(const exam of examFields){
    assert.equal(teachingFields.filter(r=>r.type===exam.type).length,3);
    const item=bloodExamItems.find(i=>i.stimulus.image.endsWith('/'+exam.file));
    assert.ok(item);assert.equal(item.choices[item.answer].toLowerCase(),exam.type);
    assert.ok(!item.stimulus.alt.toLowerCase().includes(exam.type));
  }
  for(const field of [...teachingFields,...examFields]){
    assert.ok(existsSync(location('assets/ap2-blood/'+field.file)));
  }
  assert.ok(existsSync(location('assets/ap2-blood/teaching-18-13.webp')));
});
test('hemostasis perturbations change the affected visual step and preserve the preceding response',()=>{
  assert.match(blood('18.5'),/data-clot-test/);
  assert.match(clotFrame(2,'thrombin').image,/class="recruit"/);
  assert.match(clotFrame(3,'thrombin').note,/greatly reduced/);
  assert.match(clotFrame(3,'usual').image,/stroke="#f9cc74"/);
  assert.doesNotMatch(clotFrame(4,'usual').image,/stroke="#f9cc74"/);
  assert.match(clotFrame(4,'plasmin').image,/stroke="#f9cc74"/);
});
