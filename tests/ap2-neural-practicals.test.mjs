import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {renderLab} from '../src/ap2-neural-labs.js';
import {neuralCases,renderNeuralCases} from '../src/ap2-neural-cases.js';
import {signals} from '../src/ap2-neural-signals.js';
import {appliedItems} from '../src/ap2-applied.js';

import {cutaways,cutawayMatch,brainTargets,normalizeNeuroName,routeQuestions} from '../src/ap2-neural-cutaways.js';
import {pupilResponse} from '../src/ap2-neural-sensory.js';

function glb(path){
  const bytes=readFileSync(new URL('../assets/'+path,import.meta.url));
  assert.equal(bytes.subarray(0,4).toString(),'glTF');
  assert.equal(bytes.readUInt32LE(8),bytes.length);
  return JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)));
}
function coords(doc,node){
  const pos=doc.accessors[doc.meshes[node.mesh].primitives[0].attributes.POSITION];
  return [...pos.min,...pos.max].map((v,i)=>v+(node.translation?.[i%3]||0));
}
test('neural specimens preserve registered brain and left ossicle surfaces',()=>{
  const brain=glb('ap2-neuro/ventricles.glb'),head=glb('nerves-head.glb');
  const ear=glb('ap2-neuro/ossicles.glb'),skeleton=glb('skeleton.glb');
  for(const [output,original,name] of [[brain,head,n=>'Nerve | '+n],[ear,skeleton,n=>n+'.l.001']]){
    for(const node of output.nodes){
      const before=original.nodes.find(source=>source.name===name(node.name));assert.ok(before,node.name);
      const old=coords(original,before),current=coords(output,node);
      for(let i=0;i<6;i++)assert.ok(Math.abs(old[i]-current[i])<.0007,node.name+' dimension '+i);
    }
  }
  assert.equal(brain.nodes.length,21);
  assert.deepEqual(ear.nodes.map(n=>n.name).sort(),['Incus','Malleus','Stapes']);
});
test('eye section and inner-ear mesh labels match real independent surfaces',()=>{
  const eye=glb('ap2-neuro/eye-section.glb'),ear=glb('ap2-neuro/labyrinth.glb');
  for(const [doc,names] of [[eye,['Lens','Ciliary muscle','Zonules','Retina','Iris','Sclera','Cornea','Choroid','Macula lutea','Fovea','Optic disc']],[ear,['Anterior duct','Posterior duct','Lateral duct','Anterior ampulla','Posterior ampulla','Lateral ampulla','Saccule','Utricle','Scala vestibuli','Scala tympani']]]){
    assert.deepEqual(doc.nodes.map(n=>n.name).sort(),names.sort());
    for(const n of doc.nodes){
      assert.ok(doc.accessors[doc.meshes[n.mesh].primitives[0].attributes.POSITION].count>15);
      assert.ok(coords(doc,n).every(Number.isFinite));
    }
  }
  const b=coords(eye,eye.nodes.find(n=>n.name==='Lens'));
  assert.ok(b[3]-b[0]<.005,'lens must be opened in sagittal section');
});
test('motor and sensory practicals expose both reasoning steps for each observation',()=>{
  for(const [section,items] of Object.entries(neuralCases)){
    assert.ok(renderNeuralCases(section).includes('data-neuro-cases="'+section+'"'));
    for(const item of items){
      assert.equal(item.questions.length,2);
      assert.ok(item.observation.length>35);
      for(const q of item.questions){
        assert.equal(new Set(q.choices).size,q.choices.length);
        assert.ok(q.choices[q.key]);assert.ok(q.why.length>20);
      }
    }
  }
  for(const [id,model] of [['13.1','ventricles'],['13.2','ventricles'],['13.3','ventricles'],['14.1','ear'],['14.1','eye'],['14.1','ossicles']]){
    assert.ok(renderLab(id).includes('data-neuro-specimen="'+model+'"'));
  }
  assert.ok(renderNeuralCases('16.3').includes('data-neuro-specimen="eye"'));
  for(const [id,sequence] of Object.entries(signals)){
    const html=id.startsWith('15.')?renderNeuralCases(id):renderLab(id);
    assert.ok(html.includes('data-process="'+id+'"'));
    for(const mode of sequence.modes)assert.equal(mode.notes.length,mode.labels.length);
  }
});
test('action-potential marker is on its descending trace and axis distances scale in mV',()=>{
  const svg=appliedItems.find(i=>i.id==='ap2-12.4-spike-slope').stimulus.svg;
  assert.match(svg,/M57 38 H462/);assert.match(svg,/M57 68 H462/);assert.match(svg,/M57 138 H462/);
  assert.match(svg,/L202 56 L211 74 L226 103/);assert.match(svg,/cx="211" cy="74"/);
});
test('introductory pathways and spinal reflex stations give each distractor a specific cue',()=>{
  for(const id of ['12.1','12.3']){
    assert.ok(renderLab(id).includes('data-neuro-cases="'+id+'"'));
    for(const q of neuralCases[id][0].questions){
      q.choices.forEach((_,i)=>{if(i!==q.key)assert.ok(q.hints[i].length>30);});
    }
  }
});

test('every neural cutaway target and route resolves to a named, nonempty 3D surface',()=>{
  for(const [key,model] of Object.entries(cutaways)){
    const doc=glb('ap2-neuro/'+model.file+'.glb');
    const names=doc.nodes.filter(n=>n.mesh!==undefined).map(n=>normalizeNeuroName(n.name));
    for(const [label] of [...model.targets,...model.routes.flatMap(([,stages])=>stages)]){
      assert.ok(names.some(n=>cutawayMatch(label,n)),key+' '+label);
    }
    assert.equal(model.routes.length,routeQuestions[key].length);
    for(const [,choices,answer,why] of routeQuestions[key])assert.ok(choices[answer]&&why.length>30);
    for(const n of doc.nodes.filter(n=>n.mesh!==undefined))assert.ok(coords(doc,n).every(Number.isFinite));
  }
  const brain=glb('ap2-neuro/ventricles.glb');
  for(const n of brain.nodes){
    const matches=brainTargets.filter(([, ,prefix])=>normalizeNeuroName(n.name).startsWith(prefix));
    assert.equal(matches.length,1,n.name+' must have one blind identification target');
  }
  for(const [id,kind] of [['12.4','axon'],['13.2','cord'],['13.4','cord']])assert.ok(renderLab(id).includes('data-neuro-specimen="'+kind+'"'));
  assert.ok(renderLab('14.1').includes('data-sensory-detail="rod"'));
  assert.ok(renderNeuralCases('15.1').includes('data-neuro-specimen="cardiac-autonomic"'));
  assert.ok(renderNeuralCases('16.3').includes('data-sensory-detail="pupil"'));
});

test('pupil observations separate input loss from unilateral efferent loss',()=>{
  const both={left:true,right:true},neither={left:false,right:false};
  assert.deepEqual(pupilResponse(0,'right'),both);
  assert.deepEqual(pupilResponse(1,'left'),neither);
  assert.deepEqual(pupilResponse(1,'right'),both);
  assert.deepEqual(pupilResponse(2,'right'),neither);
  assert.deepEqual(pupilResponse(2,'left'),both);
  for(const light of ['right','left']){
    assert.deepEqual(pupilResponse(3,light),{left:false,right:true});
    assert.deepEqual(pupilResponse(4,light),{left:true,right:false});
  }
  for(let condition=0;condition<5;condition++)assert.deepEqual(pupilResponse(condition,'off'),neither);
});

