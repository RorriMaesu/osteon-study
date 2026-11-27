import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {neuralRegions} from '../src/ap2-neural-regions.js';
import {labFor} from '../src/ap2-library.js';

function inventory(id){
  const bytes=readFileSync(new URL('../assets/ap2-neuro/'+id+'.glb',import.meta.url));
  assert.equal(bytes.readUInt32LE(8),bytes.length);
  const gltf=JSON.parse(bytes.toString('utf8',20,20+bytes.readUInt32LE(12)));
  return new Map(gltf.nodes.filter(n=>n.mesh!==undefined).map(n=>[n.extras.teachingLabel,
    gltf.accessors[gltf.meshes[n.mesh].primitives[0].attributes.POSITION]]));
}
test('each regional specimen has a unique 3D surface for each selectable name and a working chapter mount',()=>{
  const sections={'multipolar-neuron':'12.2','chemical-synapse':'12.5','skin-receptors':'14.1','cerebral-arteries':'13.3','dural-sinuses':'13.3',brain:'13.2','long-cord':'13.2',tongue:'14.1',nose:'14.1','outer-ear':'14.1','taste-bud':'14.1','olfactory-epithelium':'14.1','cranial-nerves':'16.3'};
  for(const [id,spec] of Object.entries(neuralRegions)){
    const parts=inventory(id);
    assert.deepEqual([...parts.keys()].sort(),spec.parts.map(p=>p.name).sort());
    for(const [label,pos] of parts){assert.ok(pos.count>20,label);assert.ok(pos.min.every((v,i)=>Number.isFinite(v)&&pos.max[i]>v),label);}
    const section=sections[id];assert.ok(labFor(section).renderLab(section).includes('data-neuro-specimen="'+id+'"'));
    const [lesson,,target]=spec.link[0].split('/');assert.ok(labFor(lesson).renderLab(lesson).includes('"'+target+'"'));
  }
});
test('atlas lobe laterality and longitudinal spinal and chemical sense relationships survive export',()=>{
  const brain=inventory('brain'),cord=inventory('long-cord'),nose=inventory('nose'),tongue=inventory('tongue'),ear=inventory('outer-ear');
  for(const lobe of ['frontal','parietal','temporal','occipital']){
    assert.ok(brain.get('Left '+lobe+' lobe').max[0]>.035);
    assert.ok(brain.get('Right '+lobe+' lobe').min[0]<-.035);
  }
  assert.ok(brain.get('Cerebellum').max[1]<brain.get('Left parietal lobe').max[1]);
  assert.ok(cord.get('Cauda equina').min[1]<cord.get('Spinal cord').min[1]-.10);
  assert.ok(nose.get('Olfactory nerve fibers').max[1]>nose.get('Nasal mucosa').max[1]);
  assert.ok(tongue.get('Hyoid').min[1]<tongue.get('Tongue').min[1]);
  assert.ok(ear.get('Auricle').max[0]>ear.get('Tympanic membrane').max[0]);
  assert.equal(inventory('cranial-nerves').size,13);
  const taste=inventory('taste-bud'),smell=inventory('olfactory-epithelium');
  const skin=inventory('skin-receptors'),depth=label=>skin.get(label).min[1];
  assert.ok(depth('Pacinian corpuscle')<depth('Ruffini ending'));
  assert.ok(depth('Ruffini ending')<depth('Meissner corpuscle'));
  assert.ok(skin.get('Free nerve endings').max[1]>skin.get('Dermis').max[1]);
  assert.ok(taste.get('Gustatory afferent').min[1]<taste.get('Gustatory receptor cell').min[1]);
  assert.ok(smell.get('Olfactory cilia').max[1]>smell.get('Dendritic knob').max[1]);
});
