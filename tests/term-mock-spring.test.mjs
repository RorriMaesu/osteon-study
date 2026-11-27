import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {springScopes,makeSpringMock} from '../src/term-mock-spring.js';
import {specimens} from '../src/ap3-specimens-catalog.js';
import {chapters} from '../src/ap3-curriculum.js';
import {validWrittenQuestion} from '../src/written-answer-judge.js';
import {validTermRun} from '../src/term-mock-records.js';
import {gradeTermItem} from '../src/term-mock-review.js';

const forms=['A','B','C'];
const sections=new Set(chapters.flatMap(ch=>ch.sections.map(s=>s.id)));
const chapterOf=q=>Number(q.section.split('.')[0]);
function key(part){
  return part.type==='choice'?String(part.answer):part.type==='number'?part.expected+' '+part.unit:part.expected;
}
for(const scope of springScopes){
  for(const form of forms)test('Spring '+scope.id+', form '+form+': score, snapshots, sources and blind assets',()=>{
    const items=makeSpringMock(scope.id,form),practical=scope.id==='practical';
    assert.equal(items.length,practical?8:44);
    assert.equal(items.reduce((t,i)=>t+i.points,0),practical?24:60);
    assert.equal(new Set(items.map(q=>q.id)).size,items.length);
    assert.deepEqual(items,JSON.parse(JSON.stringify(makeSpringMock(scope.id,form))));
    assert.ok(validTermRun({items,scope:scope.id,course:'ap3',version:1,created:1,id:'snapshot',title:'Snapshot',mode:'independent',index:0,form,answers:{},flags:{},assisted:{},reviews:{}},'ap3'));
    assert.deepEqual([...new Set(items.map(chapterOf))].sort(),scope.chapters);
    if(!practical){
      assert.deepEqual(['choice','evidence','short','written'].map(t=>items.filter(q=>q.type===t).length),[30,8,4,2]);
      if(scope.id.startsWith('unit-')){
        for(const ch of chapters.filter(ch=>scope.chapters.includes(ch.id)))for(const sec of ch.sections)
          assert.ok(items.some(q=>q.section===sec.id),'Missing section '+sec.id);
      }else{
        const core=items.filter(q=>!q.relatedSections);
        assert.equal(core.length,32);
        for(const ch of scope.chapters)assert.equal(core.filter(q=>chapterOf(q)===ch).length,4);
        assert.ok(items.filter(q=>q.relatedSections).every(q=>q.relatedSections.some(s=>sections.has(s)&&Number(s.split('.')[0])!==chapterOf(q))));
      }
    }else{
      assert.equal(items.filter(q=>q.parts.some(p=>p.type==='surface')).length,3);
      assert.equal(items.filter(q=>q.stimulus?.image).length,2);
      assert.equal(items.filter(q=>q.stimulus?.columns).length,3);
    }
    for(const q of items){
      assert.ok(sections.has(q.section),q.section);
      if(q.type==='written'){
        assert.ok(validWrittenQuestion(q),q.id);
        continue;
      }
      const parts=q.parts||[q];
      for(const part of parts){
        if(part.choices){
          assert.equal(new Set(part.choices).size,part.choices.length,part.prompt);
          assert.ok(part.choices[part.answer],part.prompt);
        }
        if(part.type==='surface'){
          const spec=specimens.find(s=>s.id===part.specimen);
          assert.ok(part.order.includes(part.expected));
          assert.equal(part.order.length,spec.targets.length);
          assert.equal(part.labels[part.expected],spec.targets.find(t=>t.id===part.expected).label);
        }
      }
      if(q.stimulus?.image){
        assert.ok(existsSync(new URL('../'+q.stimulus.image,import.meta.url)),q.stimulus.image);
        assert.ok(q.stimulus.alt&&q.stimulus.credit);
      }
      if(q.stimulus?.rows)assert.ok(q.stimulus.rows.every(r=>r.length===q.stimulus.columns.length),q.id);
      const answer=q.parts?q.parts.map(key):key(q);
      assert.equal(gradeTermItem(q,answer).earned,q.points,q.id);
    }
  });
}

test('Parallel unit forms and transfer do not simply reorder the same set',()=>{
  for(const scope of springScopes.filter(s=>s.id!=='practical')){
    const [a,b,c]=forms.map(f=>makeSpringMock(scope.id,f).filter(q=>q.type==='choice').map(q=>q.prompt));
    assert.ok(a.filter(p=>b.includes(p)).length<=2,scope.id);
    assert.ok(a.filter(p=>c.includes(p)).length<12,scope.id);
    assert.ok(b.filter(p=>c.includes(p)).length<12,scope.id);
  }
  for(const idx of [0,1,4]){
    const picks=forms.map(f=>makeSpringMock('practical',f)[idx].parts[0]);
    assert.equal(new Set(picks.map(p=>p.expected)).size,3);
  }
});
test('Water deprivation pilot includes three criteria and benchmark responses',()=>{
  const [q]=makeSpringMock('unit-3','A').filter(q=>q.type==='written'&&q.section==='25.8');
  assert.match(q.prompt,/water deprivation/);
  assert.equal(q.rubric.criteria.length,3);
  assert.equal(q.rubric.fixtures.length,4);
  for(const f of q.rubric.fixtures)assert.deepEqual(Object.keys(f.expectedPoints),q.rubric.criteria.map(c=>c.id));
});
test('Retains directional distinctions, equivalent units and one-point partial credit',()=>{
  const vessels=makeSpringMock('unit-3','A').find(q=>q.type==='short'&&q.section==='25.4');
  assert.equal(gradeTermItem(vessels,['efferent','efferent']).earned,1);
  const flow=makeSpringMock('unit-1','A').find(q=>q.id.includes('-ventilation-'));
  assert.equal(gradeTermItem(flow,['6000 mL/min','4200 mL/min']).earned,2);
  assert.equal(gradeTermItem(flow,['6 L/min','4.2 mL/min']).earned,1);
});
