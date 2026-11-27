import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {makeWinterMock,winterScopes} from '../src/term-mock-winter.js';
import {sectionById} from '../src/ap2-library.js';
import {validWrittenQuestion} from '../src/written-answer-judge.js';
import {checkQuantity} from '../src/ap2-quantities.js';
import {gradeTermItem,termWrittenFixtures} from '../src/term-mock-review.js';
import {validTermRun} from '../src/term-mock-records.js';

for(const scope of winterScopes){
  test('winter '+scope.id+' has three valid, balanced 60-point forms',()=>{
    const seenChoiceStems=new Set(),seenWritten=new Set(),seenStations=new Set(),covered=new Set();
    for(const form of 'ABC'){
      const items=makeWinterMock(scope.id,form);
      assert.deepEqual(items,makeWinterMock(scope.id,form));
      assert.deepEqual(items,JSON.parse(JSON.stringify(items)));
      assert.equal(new Set(items.map(q=>q.id)).size,44);
      assert.ok(validTermRun({course:'ap2',version:1,id:'example',scope:scope.id,form,title:scope.title,mode:'independent',created:1,index:0,answers:{},flags:{},assisted:{},reviews:{},items},'ap2'));
      assert.equal(items.reduce((sum,q)=>sum+q.points,0),60);
      assert.deepEqual(['choice','evidence','short','written'].map(t=>items.filter(q=>q.type===t).length),[30,8,4,2]);
      for(const q of items){
        assert.ok(sectionById.has(q.section)&&scope.chapters.includes(q.chapter),q.id);
        covered.add(q.section);
        assert.ok(q.prompt&&q.why&&q.source&&q.objective);
        for(const p of q.parts||[q]){
          if(p.type==='choice'){
            assert.ok(Number.isInteger(p.answer)&&p.choices[p.answer],q.id);
            assert.ok(p.choices.every(x=>typeof x==='string'&&x.trim()),q.id);
            assert.equal(new Set(p.choices).size,p.choices.length,q.id);
          } else if(p.type==='number'){
            assert.ok(checkQuantity(p,p.expected+' '+p.unit).correct,q.id);
          } else if(p.type==='term')assert.ok(p.expected.trim()&&p.aliases&&!p.opposites.includes(p.expected),q.id);
        }
        if(q.type==='choice'){
          assert.ok(!seenChoiceStems.has(q.prompt),'Repeated choice stem: '+q.prompt);
          seenChoiceStems.add(q.prompt);
        }
        if(q.type==='written'){
          assert.ok(validWrittenQuestion(q),q.id);
          assert.ok(!seenWritten.has(q.prompt));
          seenWritten.add(q.prompt);
        }
        if(q.parts){
          assert.equal(q.parts.length,2,q.id);
          const key=JSON.stringify([q.stimulus,q.parts.map(p=>[p.prompt,p.type==='choice'?p.choices[p.answer]:p.expected])]);
          assert.ok(!seenStations.has(key),'Repeated data and station tasks: '+q.id);
          seenStations.add(key);
        }
        if(q.type!=='written'){
          const correct=p=>p.type==='choice'?String(p.answer):p.expected+(p.unit?' '+p.unit:'');
          assert.equal(gradeTermItem(q,q.parts?q.parts.map(correct):correct(q)).earned,q.points,q.id);
        }
        if(q.type==='evidence'){
          assert.ok(q.stimulus?.rows?.length||q.stimulus?.svg||q.stimulus?.image,q.id);
          if(q.stimulus.image)assert.ok(existsSync(new URL('../'+q.stimulus.image,import.meta.url)),q.id);
        }
      }
      if(scope.id==='all'){
        assert.equal(items.filter(q=>q.relatedChapters?.length>1).length,8);
        for(const chapter of scope.chapters)assert.equal(items.filter(q=>q.chapter===chapter&&!q.relatedChapters).length,4);
      }
    }
    if(scope.id!=='all')for(const s of sectionById.values())if(scope.chapters.includes(Number(s.id.split('.')[0])))assert.ok(covered.has(s.id),'Missed section '+s.id);
  });
}
test('heart case accepts equivalent output units and separates the stroke volume and output criteria',()=>{
  const q=makeWinterMock('unit-4','A').find(q=>q.objective==='cardiac-output');
  assert.ok(checkQuantity(q.parts[0],'70 mL/beat').correct);
  assert.ok(checkQuantity(q.parts[1],'5.25 L/min').correct);
  assert.ok(checkQuantity(q.parts[1],'5250 mL/min').correct);
  assert.ok(!checkQuantity(q.parts[1],'5.25 mL/min').correct);
  const pump=makeWinterMock('unit-4','A').find(q=>q.rubric?.fixtures);
  assert.equal(termWrittenFixtures(pump).length,4);
});
test('winter rejects invalid form selectors',()=>{
  assert.throws(()=>makeWinterMock('unit-9','A'));
  assert.throws(()=>makeWinterMock('unit-1','D'));
});
