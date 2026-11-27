import test from 'node:test';
import assert from 'node:assert/strict';
import {winterScopes, makeWinterMock} from '../src/term-mock-winter.js';
import {springScopes, makeSpringMock} from '../src/term-mock-spring.js';
import {gradeTermItem, scoreTermAttempt, confirmTermWritten} from '../src/term-mock-review.js';

for (const [course, scopes, makeForm] of [['ap2', winterScopes, makeWinterMock], ['ap3', springScopes, makeSpringMock]]) {
  test(course+' grading accepts every published answer and scores a blank submission consistently',()=>{
    for(const scope of scopes) {
      for(const form of ['A','B','C']) {
        const items=makeForm(scope.id,form);
        const run={id:'roundtrip-'+course+'-'+scope.id+'-'+form,course,items,answers:{},grades:{},reviews:{},submitted:1};
        for(const item of items) {
          const blank=gradeTermItem(item,'');
          assert.deepEqual([blank.earned,blank.pending,blank.possible],[0,0,item.points],item.id);
          if(item.type==='written') {
            const response=item.rubric.modelAnswer||item.why;
            const allMet=Object.fromEntries(item.rubric.criteria.map(c=>[c.id,'met']));
            run.answers[item.id]=response;
            run.reviews[item.id]={confirmed:confirmTermWritten(item,response,run.id,allMet)};
          } else {
            run.answers[item.id]=item.parts
              ?item.parts.map(p=>String(p.type==='choice'?p.answer:p.expected))
              :String(item.answer);
          }
          run.grades[item.id]=gradeTermItem(item,run.answers[item.id]);
        }
        const result=scoreTermAttempt(JSON.parse(JSON.stringify(run)));
        assert.equal(result.possible,scope.id==='practical'?24:60);
        for(const row of result.rows) assert.equal(row.grade.earned,row.item.points,row.item.id);
        assert.deepEqual([result.earned,result.missed,result.pending],[result.possible,0,0]);
      }
    }
  });
}
