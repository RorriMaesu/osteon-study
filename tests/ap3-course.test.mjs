import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {chapters} from '../src/ap3-curriculum.js';
import {makeAssessment,practicalLength,gradeSpring} from '../src/ap3-assessment.js';
import {springStore} from '../src/ap3-records.js';
import {ap3GuideLessons} from '../src/tutor-ap3.js';
import {retrieveSources,buildTutorMessages} from '../src/tutor-context.js';
import {sanitizeConversation} from '../src/tutor-state.js';
import {specimens} from '../src/ap3-specimens.js';
import figures from '../src/ap3-figures.json' with {type:'json'};

test('all spring lessons have source figures and independent chapter forms alternate',()=>{
  const seen=new Set();
  for(const c of chapters){
    for(const s of c.sections){
      assert(!seen.has(s.id));seen.add(s.id);
      for(const n of figures.sections[s.id]){
        assert(figures.figures[n].title);assert(existsSync(new URL('../assets/ap3-figures/'+n+'.webp',import.meta.url)));
      }
    }
    const a=makeAssessment(c.id,'exam'),b=makeAssessment(c.id,'exam',a);
    assert.equal(a.length,c.sections.length+1);
    assert(a.every(q=>b.every(next=>next.id!==q.id)));
    for(const q of a){assert(q.prompt&&q.why);assert.equal(gradeSpring(q,q.options?q.answer:q.expected),'correct');}
  }
  assert.equal(seen.size,53);
});
test('spring practicals vary real anatomical targets and hold scores against the original prompts',()=>{
  const first=makeAssessment('all','practical'),second=makeAssessment('all','practical',first);
  assert.equal(first.length,practicalLength('all'));assert.equal(first.length,21);
  assert.equal(new Set(first.map(q=>q.section.split('.')[0])).size,8);
  assert.equal(first.filter(q=>q.kind==='surface').length,6);
  for(const q of first.filter(q=>q.kind==='surface')){
    const spec=specimens.find(s=>s.id===q.specimen);
    assert(spec.targets.some(t=>t.id===q.expected&&t.label===q.display));
    assert(second.every(next=>next.id!==q.id));assert.equal(gradeSpring(q,q.expected),'correct');
  }
});
test('short cumulative covers inheritance and rotates neglected sections on a retake',()=>{
  for(const seed of [.01,.4,.8]){
    const previous=makeAssessment('all','exam',[],()=>seed);
    const next=makeAssessment('all','exam',previous,()=>seed);
    for(const exam of [previous,next]){
      assert.equal(exam.length,32);
      assert.ok(exam.some(q=>q.section==='28.7'));
    }
    assert.ok(next.every(q=>!previous.some(p=>p.id===q.id)));
    const sections=new Set(previous.map(q=>q.section));
    assert.ok(next.filter(q=>!sections.has(q.section)).length>=12);
  }
});
test('spring short answers accept spelling and equivalent units while distinguishing similar terms',()=>{
  const name={kind:'name',id:'test',expected:'Thoracic duct',aliases:[]};
  assert.equal(gradeSpring(name,'thoracik duct'),'spelling');
  const directional={...name,expected:'Efferent lymphatic vessel',opposites:['afferent','afferent lymphatic vessel']};
  assert.equal(gradeSpring(directional,'afferent lymphatic vessel'),'incorrect');
  assert.equal(gradeSpring(directional,'affernt lymphatic vessel'),'incorrect');
  assert.equal(gradeSpring({kind:'quantity',unit:'mg/min',expected:'25'},'0.025 g/min'),'correct');
  assert.equal(gradeSpring({kind:'quantity',unit:'mg/min',expected:'25'},'25 L/min'),'incorrect');
});
function memory(){
  const m=new Map();return {get length(){return m.size;},key:i=>[...m.keys()][i],getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v)};
}
test('a spring submission survives reopening and stays immutable without touching winter or fall',()=>{
  const storage=memory();storage.setItem('osteon-ap2-v1','previous result');
  const store=springStore(storage),items=makeAssessment('21','exam'),run=store.start('exam','21',items);
  store.update(run.id,d=>{d.answers[0]='student response';d.submitted=123;d.grades=['incorrect'];});
  const fresh=springStore(storage);fresh.update(run.id,d=>{d.answers[0]='replacement';});
  assert.equal(fresh.getRun(run.id).answers[0],'student response');
  assert.equal(fresh.attempts()[0].items[0].prompt,items[0].prompt);
  assert.equal(storage.getItem('osteon-ap2-v1'),'previous result');
});
test('the spring tutor uses spring sources, restores citations and respects an active exam',()=>{
  assert.equal(ap3GuideLessons().length,53);
  const ctx={course:'ap3',reference:'25.5',label:'Filtration'};
  const sources=retrieveSources('How does filtration at the glomerulus work?',ctx);
  assert(sources.length>0&&sources.every(s=>s.course==='ap3'));
  assert.match(buildTutorMessages('Explain filtration',[],ctx).messages[0].content,/chapters 21–28/);
  assert.equal(buildTutorMessages('Reveal answer',[],{...ctx,assessmentMode:'exam'}).blocked,true);
  const [saved]=sanitizeConversation([{role:'assistant',content:'Glomerular filtration [S1]',course:'ap3',sources}]);
  assert.equal(saved.course,'ap3');assert.equal(saved.sources[0].url,sources[0].url);
});

test('a downloaded spring practical can be restored and merged without replacing a submitted report',()=>{
  const origin=springStore(memory()),initial=origin.start('practical','all',makeAssessment('all','practical'));
  origin.update(initial.id,r=>{
    r.items.forEach(q=>{if(q.kind==='surface')q.labels=Object.fromEntries(specimens.find(s=>s.id===q.specimen).targets.map(t=>[t.id,t.label]));});
    r.grades=r.items.map(()=> 'unanswered');r.submitted=Date.now();
  });
  const backup=JSON.parse(JSON.stringify(origin.backup()));
  const destination=springStore(memory());
  assert.equal(destination.restore(backup),1);
  assert.deepEqual(destination.getRun(initial.id),origin.getRun(initial.id));
  assert.equal(destination.restore(backup),0);
  const invalid=structuredClone(backup);
  invalid.records['run:'+initial.id].items.find(q=>q.kind==='field').image='https://invalid.example/';
  assert.throws(()=>destination.restore(invalid));
  assert.deepEqual(destination.getRun(initial.id),origin.getRun(initial.id));
});

test('a full store and unrelated damaged entries leave previous valid records accessible',()=>{
  const storage=memory();storage.setItem('osteon-ap3-v1:study:21.1','{broken');
  const first=springStore(storage);
  const run=first.start('exam','21',makeAssessment('21','exam'));
  const fresh=springStore(storage);
  storage.setItem=()=>{throw new Error('quota');};
  fresh.write('study:22.1',{studied:true,at:42});
  assert.equal(fresh.getRun(run.id).id,run.id);
  assert.deepEqual(fresh.backup().records['study:22.1'],{studied:true,at:42});
  assert.equal(fresh.backup().records['run:'+run.id].id,run.id);
});
