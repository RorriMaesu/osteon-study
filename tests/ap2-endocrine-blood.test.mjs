import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {renderLab as endocrine} from '../src/ap2-regulation-labs.js';
import {renderLab as blood} from '../src/ap2-cardio.js';
import {signalOutcome} from '../src/ap2-endocrine-practicals.js';
import {gonads,separateRegionalSurfaces} from '../src/ap2-endocrine-regions.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {teachingFields, examFields, clotFrame} from '../src/ap2-blood-stations.js';
import {bloodExamItems} from '../src/ap2-blood-exam.js';

const location = file=>new URL('../'+file,import.meta.url);
function readGltf(filename){
  const bytes=readFileSync(location('assets/ap2-glands/'+filename));
  assert.equal(bytes.toString('ascii',0,4),'glTF');
  assert.equal(bytes.readUInt32LE(8),bytes.length);
  return JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString('utf8'));
}

test('every modeled gonadal, pelvic and placental surface maps to one named target',()=>{
  for(const spec of Object.values(gonads)){
    const names=readGltf(spec.file).nodes.filter(node=>Number.isInteger(node.mesh)).map(node=>node.name);
    for(const name of names){
      assert.equal(spec.targets.filter(([,pattern])=>pattern.test(name)).length,1,spec.file+' '+name);
    }
    for(const [label,pattern] of spec.targets){
      const hits=names.filter(name=>pattern.test(name));
      assert(hits.length,label);
      if(/^(Left|Right) /.test(label)){
        const other=label.startsWith('Left')?/right|_R$/i:/left|_L$/i;
        assert(hits.every(name=>!other.test(name)),label);
      }
    }
  }
});

test('regional isolation keeps nested surfaces visible at their source coordinates',async()=>{
  const data=readFileSync(location('assets/ap2-glands/ovarian-region.glb'));
  const {scene}=await new GLTFLoader().parseAsync(data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength),'');
  scene.updateMatrixWorld(true);
  const meshes=[],before=new Map();
  scene.traverse(mesh=>{if(mesh.isMesh){meshes.push(mesh);before.set(mesh,mesh.matrixWorld.clone());}});
  const os=scene.getObjectByName('VH_F_internal_cervical_os');
  assert(os.parent.isMesh,'The real donor nests this smaller surface below a drawable parent');
  separateRegionalSurfaces(scene);scene.updateMatrixWorld(true);
  for(const mesh of meshes)assert(mesh.matrixWorld.equals(before.get(mesh)),mesh.name);
  for(const [label,pattern] of gonads.ovary.targets){
    for(const mesh of meshes)mesh.visible=pattern.test(mesh.name);
    const visible=[];
    scene.traverseVisible(mesh=>{if(mesh.isMesh)visible.push(mesh.name);});
    assert.deepEqual(visible.sort(),meshes.filter(m=>pattern.test(m.name)).map(m=>m.name).sort(),label);
  }
});

test('endocrine practicals are reachable by section and the signaling section tests a target cell',()=>{
  for(const id of ['17.1','17.2','17.3','17.4','17.5','17.6','17.7','17.8','17.9','17.10','17.11'])assert.ok(endocrine(id).includes('data-gland-station="'+id+'"'),id);
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
  assert.equal(readGltf('ovary-v1.3.glb').meshes.length,1);
  assert.ok(readGltf('cranial-glands.glb').nodes.some(n=>n.name==='pineal'));
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

test('injuries with weak adhesion and deficient fibrin have distinct final states',()=>{
  const adhesion=clotFrame(4,'adhesion'),thrombin=clotFrame(4,'thrombin');
  assert.match(adhesion.title,/persistent bleeding/);
  assert.match(thrombin.title,/recurrent bleeding/);
  assert.match(adhesion.image,/stroke="#ff8c85"/);
  assert.match(adhesion.image,/stroke="#f9cc74"/);
  assert.doesNotMatch(thrombin.image,/stroke="#f9cc74"/);
  assert.doesNotMatch(clotFrame(4,'usual').image,/stroke="#ff8c85"/);
});
test('regional specimens retain distinct sided anatomical meshes and expose the new chapter exercises',()=>{
  for(const [file,names] of Object.entries({
    'neck.glb':['thyroid','thyroid_cartilage','left_superior_parathyroid','right_inferior_parathyroid','trachea'],
    'testicular-region.glb':['left_testis','right_testis','right_epididymis','bladder'],
    'ovarian-region.glb':['VH_F_left_ovary','VH_F_right_ovary','VH_F_fundus_of_uterus','VH_F_sacrum'],
    'placenta.glb':['VH_F_basal_plate','VH_F_chorionic_plate','VH_F_umbilical_artery_2','VH_F_umbilical_vein']
  })){
    const model=readGltf(file);
    for(const name of names)assert.ok(model.nodes.some(n=>n.name===name&&n.mesh!==undefined),name);
  }
  assert.match(endocrine('17.5'),/ionized calcium falls/);
  assert.match(endocrine('17.4'),/crosses the trachea/);
  assert.match(endocrine('17.8'),/placenta/);
  for(const img of ['phil-5864','normal-adult-field','phil-15133'])assert.ok(existsSync(location('assets/ap2-blood/'+img+'.webp')));
});
